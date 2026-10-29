# Version timeline

The classifier did not change once; it changed in steps. These are the first published versions where each structural change appears.

| Version | Rules | Prompt | Milestone |
|---|---|---|---|
| 2.1.87 | 28 block + 6 allow + 4 env | 25,532 chars | prose template |
| 2.1.88 | identical | identical | no change |
| 2.1.110 | 31 block + 7 allow | 14,246 base + 15,314 external | explicit stage-1 split |
| 2.1.136 | 2 hard + 30 soft + 9 allow + 5 env | structured | first HARD tier; rules become structured data |
| 2.1.195 | 1 hard + 55 soft + 16 allow + 9 env | structured | rule set grows |
| 2.1.197 | same as 2.1.195 | structured | last version without `<category>` |
| 2.1.198 | 1 hard + 58 soft + 16 allow + 21 env | structured | first `<category>`; environment expands to 21 |
| 2.1.200 | 1 hard + 62 soft + 16 allow + 21 env | structured | rule set grows |
| 2.1.301 | 1 hard + 72 soft + 17 allow + 21 env | 126,793 reconstructed | final shape |
| 2.1.312 | identical | identical | no change |

## What the milestones mean

1. **2.1.110** adds an explicit stage-1 instruction that excludes user intent and ALLOW exceptions, and expands the prose rules from 28+6 to 31+7.
2. **2.1.136** is the first version with a HARD tier. It starts with two rules: `Data Exfiltration` and `Safety-Check Bypass`. The rules move from prose to structured defaults.
3. **2.1.195–198** is the largest single-step growth: 55 → 58 soft rules, 9 → 21 environment fields, and the `<category>` output requirement. The environment expansion alone changes how much context the classifier gets.
4. **2.1.301** reaches 72 soft rules and 17 allow rules. The parser remains strict; the anchoring requirement is prompt-only.

## Method and limits

The counts come from the prose template (2.1.87–2.1.110) or `auto-mode defaults` (2.1.136+). The version samples are published npm/native artifacts; unpublished builds may sit between the listed versions. A version is marked as a milestone only when the marker is present in the shipped artifact.

Machine-readable data: [`analysis/version-timeline.json`](../analysis/version-timeline.json).
