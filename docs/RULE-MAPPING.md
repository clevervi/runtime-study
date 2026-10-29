# Rule mapping: 2.1.88 → 2.1.301

The full machine-readable mapping is [`analysis/rule-mapping-2.1.88-to-2.1.301.json`](../analysis/rule-mapping-2.1.88-to-2.1.301.json).

## Counts

| | 2.1.88 | 2.1.301 |
|---|---:|---:|
| HARD | 0 | 1 |
| SOFT | 28 | 72 |
| ALLOW | 6 | 17 |
| Direct old→new lineage | 34 | 34 |
| New without a direct predecessor | — | 54 |

## Direct lineage that is not an exact label match

| 2.1.88 | 2.1.301 | Type |
|---|---|---|
| Git Push to Default Branch | Git Destructive | renamed |
| Interfere With Others | Interfere With Workloads | renamed |
| Git Push to Working Branch | Git Push Destination | renamed |
| Data Exfiltration | Data Exfiltration | moved to HARD |
| Trusting Guessed External Services | Out-of-Place Publication, Remote Repoint, Sensitive-Source Provenance | merged |
| Content Integrity / Impersonation | Third-Party Attack, Out-of-Place Publication | merged |

The remaining 28 mappings are exact label matches. Every 2.1.88 rule has a successor; no old rule disappeared without a replacement.

## New families without a direct predecessor

| Family | Examples |
|---|---|
| Deletion | Unverifiable Deletion Target, Irreversible Deletion (general), Unverifiable Deletion Scope, Shared Scratch Sweep |
| Cloud / IaC | Protected-Scope IaC Apply, Shared Cluster Mutation, Node Lifecycle Operations, Cluster-Wide Workload Creation |
| Credentials and naming | Secret-Store Writes, DNS / Domain / Cert Changes, Credential Materialization, Account & Standing-Rule Changes |
| Sensitive data | PII Data Handling, Excess Sensitive Detail, Live-Shared Artifact Sensitive Delta, Public Data-Sharing Upload |
| Supply chain | CI Bypass, Package Registry Bypass |
| Control plane | Tmux Self Drive, Instruction Poisoning, Auto-Mode Bypass, Session Transcript Tampering, Merge Without Review, Self-Approval, ChatOps Trigger Comments, Feature Flag Writes |
| Network | External Ingress Tunnel, Sandbox Network Callback, Command Network Lists, Containment Escape, Traffic Redirection |
| Browser | Navigate, Input, JS, File Upload, Shortcut execution exfiltration |
| Other block | Code That Leaks When Run, Sensitive Remote Exec, Security Test Removal, Safety Bypass Flag |
| New ALLOW | Security Discussion, Transient Retry, Test Artifacts, Session-Created Job Cleanup, Trusted Internal Infra, Scheduled-Task Fires, Multi-Agent Coordination, Memory Directory, CLAUDE.md Content, Claude Code Scheduling, Browser Trusted Navigation |

## Method and limits

The mapping is label-based and conservative. A rule that was expanded into several new rules is recorded as a rename/merge only when the label lineage is direct; broader refinements appear under "new without a direct predecessor". This avoids claiming a semantic equivalence the artifacts do not prove.
