# Permission gate specification for an agentic runtime

A clean-room design for the part of an agent that decides whether a tool call is allowed. It is derived from the lessons in this study, not from any proprietary implementation.

## 1. Goals

- **Safe by default.** Ambiguity resolves to block, not allow.
- **Explainable.** Every decision cites a rule identifier and a short reason.
- **Auditable.** Inputs and outputs are logged with secrets redacted.
- **Testable.** The parser and the rules have independent test suites.
- **Evolvable.** Rules are data, not prose buried in a prompt.

## 2. Non-goals

- Reproducing another product's rule text or prompt.
- Guaranteeing that a model cannot be manipulated.
- Replacing OS-level sandboxing, least-privilege credentials, or human approval.

## 3. Threat model

The gate protects against three classes of failure:

1. **Prompt injection.** Untrusted text in files, web pages, or tool output manipulates the model into a harmful action.
2. **Scope creep.** The agent "helpfully" exceeds the task: deleting shared state, publishing artifacts, changing permissions.
3. **Accidental damage.** The agent misjudges blast radius.

The gate assumes the model can be wrong. It does not assume the model is an attacker; it assumes the transcript may contain an attacker.

## 4. Tiers

| Tier | Meaning | User intent override |
|---|---|---|
| `hard` | Crosses a security boundary. | Never |
| `soft` | Destructive or irreversible mistake. | Yes, with explicit, specific consent |
| `allow` | Exception that clears a soft block. | n/a |

Environment facts (trusted repos, domains, buckets, sensitive hosts) are separate from rules. They inform evaluation but never clear a hard block.

## 5. Rule schema

```json
{
  "id": "data-exfiltration",
  "tier": "hard",
  "label": "Data Exfiltration",
  "summary": "Sending sensitive data to a destination outside the trust boundary.",
  "signals": ["outbound network call", "sensitive source", "untrusted destination"],
  "examples": ["upload .env to a public bucket"],
  "exceptions": [],
  "version": 1
}
```

Rules are versioned and reviewed like code. A rule without a test case is not enabled.

## 6. Decision protocol

The model returns a single structured decision:

```text
<decision>block</decision><rule>data-exfiltration</rule><reason>...</reason>
```

The parser must follow these rules:

1. **Anchored.** The response must start with `<decision>` after whitespace trimming. Text before it is a parse failure.
2. **Exact vocabulary.** `block` or `allow` only. Anything else is a parse failure.
3. **Rule required on block.** A block without a known rule id is a parse failure.
4. **No first-match fallback.** Parse the anchored decision only. Do not scan the rest of the response for a later tag.
5. **Fail closed.** Any parse failure, timeout, or classifier error results in block.

This is the core lesson of the case study: the parser is part of the security boundary, not glue code.

## 7. Pipeline

```text
tool call
  -> action summary (what runs, reads, writes, sends)
  -> stage 1: fast decision, no user intent, no exceptions
  -> if block: stage 2 (reasoning, user intent, allow exceptions)
  -> decision + rule id + reason
  -> audit log
```

Stage 1 is intentionally strict. Stage 2 exists to reduce false positives on genuinely authorized actions. A hard rule never reaches stage 2's exception path.

## 8. Invariants

1. Parse failure means block.
2. A decision is only valid at position zero.
3. Hard rules cannot be cleared by user intent, quoted text, or another agent.
4. Every block cites a rule id; every allow cites the exception or "no rule matched".
5. The classifier never sees secrets it does not need; redact before sending.
6. Rules and parser changes require a regression test that includes an injection case.

## 9. Interfaces

```ts
type Tier = 'hard' | 'soft' | 'allow'

interface Rule {
  id: string
  tier: Tier
  label: string
  summary: string
  signals: string[]
  exceptions: string[]
  version: number
}

interface Decision {
  block: boolean
  ruleId?: string
  reason: string
  tier?: Tier
  confidence: number
  parseFailure?: boolean
}

interface Gate {
  evaluate(action: ActionSummary, context: EnvironmentContext): Promise<Decision>
}
```

`parseFailure` exists for metrics and must always imply `block: true`.

## 10. Test corpus

At minimum:

- valid block and allow;
- whitespace and newline variants inside the decision tag;
- truncated output;
- chatty preamble;
- decision text inside quoted or thinking content;
- injected decision before the real one;
- multiple decisions;
- uppercase and mixed case;
- empty response;
- timeout and 5xx from the classifier.

The parser test asserts the anchored contract, not just the regex. The gate test asserts fail-closed behavior when parsing fails.

## 11. Rollout

1. **Shadow mode.** Evaluate every action, log the decision, never enforce. Compare against human decisions.
2. **Canary.** Enforce on a small cohort. Watch false positives and parser failures separately.
3. **Default.** Enforce with an explicit bypass that requires step-up approval and is logged.

Metrics: parse-failure rate, block rate by rule, override rate, time to decision, and injection-corpus pass rate.

## 12. Anti-patterns

- Tolerant parsing that turns "unparseable" into a decision.
- First-match scanning of free-form output.
- Prompt-only anchoring without a parser check.
- Rules as unstructured prose with no ids.
- Treating a model's explanation as evidence of safety.
- Letting another agent's message count as user consent.

## 13. What not to copy

Do not copy another product's prompt text, rule text, or source. Use this specification as a design checklist and write your own rules, examples, and tests. The security properties come from the invariants, not from the wording.
