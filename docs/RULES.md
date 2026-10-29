# Rule taxonomy

The gate moved from a short prose list to a structured rule set. Counts below come from the full shipped template for 2.1.88 and the structured defaults for 2.1.301.

| Version | Block | Allow | Environment | Notes |
|---|---:|---:|---:|---|
| 2.1.87 | 28 | 6 | 4 | prose template |
| 2.1.88 | 28 | 6 | 4 | identical to 2.1.87 |
| 2.1.301 | 1 hard + 72 soft | 17 | 21 | structured, injected at runtime |
| 2.1.312 | 1 hard + 72 soft | 17 | 21 | identical to 2.1.301 |

## 2.1.88 families

- destructive git, storage, and local state;
- production and shared infrastructure;
- credentials and secrets;
- exfiltration and external writes;
- agent persistence and self-modification;
- content integrity and real-world transactions.

## 2.1.301 families

The 2.1.301 set keeps the old core and adds:

- **HARD DENY**: data exfiltration, with no user-intent override.
- **Multi-agent and sessions**: cross-session messaging, scheduled-task fires, multi-agent coordination, session transcript tampering.
- **Cloud and IaC**: protected IaC scopes, secret-store writes, DNS and certificate changes, cluster mutation, node lifecycle.
- **Supply chain**: package registry bypass, CI bypass, unrequested artifact publish, feature-flag writes.
- **Sensitive data**: PII handling, sensitive-source provenance, excess sensitive detail, out-of-place publication.
- **Agent behavior**: instruction poisoning, auto-mode bypass, self-approval, merge without review, ChatOps trigger comments.
- **Browser**: navigate, input, JavaScript, upload, and shortcut exfiltration.
- **Deletion**: unverifiable deletion target, shared scratch sweep, irreversible deletion variants.

## Renames and merges

| 2.1.88 | 2.1.301 |
|---|---|
| Git Push to Default Branch | Git Destructive |
| Git Push to Working Branch | Git Push Destination |
| Interfere With Others | Interfere With Workloads |
| Trusting Guessed External Services | merged into publication and remote-repoint rules |
| Content Integrity / Impersonation | absorbed by third-party attack and publication rules |

The full label diff is in [`analysis/comparison-2.1.87-vs-2.1.301.json`](../analysis/comparison-2.1.87-vs-2.1.301.json).
