# OP AMP DC Trainer — migration slice 5a

## Goal
Absorb pinned Circuit \`12_opamp_slew_rate/reasoning_trainer.html\` and Level 0–5 core into the single EEHandouts site. Keep a locally usable mastery exercise without claiming an official assessment, board evidence or complete Circuit retirement.

## Fixed sources
- EEHandouts base: \`6fc37f52baa12ee4ede0d8addb41364ab1d43e92\`.
- Circuit source: \`11ef4e4801b5283f265dc349a4afec0027603228\`.
- Source core \`12_opamp_slew_rate/assets/opamp-dc-trainer.js\` blob \`ebf8c29f013ffbb935e15dafaa38d07002131886\`, version \`1.1.0\`.
- Original source tests \`tests/opamp-dc-trainer.test.mjs\`, 11 cases.

## Contracts
- Original Solver, QuestionGenerator, SkillGraph, AnswerEvaluator, MasteryTracker and remediation semantics remain unchanged. Only the source autoMount call injects the EE storage adapter.
- Mastery uses original browser-local key \`opamp-dc-reasoning-trainer-v2\`; it never becomes official Evidence or a grade. No silent key migration, legacy schema normalization or record deletion.
- Enforce exact version, skill IDs and snapshot shape on startup and every write. If malformed/future or competing write, quota, missing source script, readback mismatch: stop interaction, keep original bytes, offer raw and in-memory draft export; never claim saved. The exported `raw` retains the last accepted baseline (including a rejected startup record), while `currentRaw` and `currentReadError` disclose later storage changes/errors separately; a cross-tab deletion must never erase the retained baseline export.
- Reset requires explicit consent and uses one replacement write, never removeItem followed by a fallible write. Do not reset unsupported or conflicting history.
- Existing saved Buck workbench routes through \`EEWorkbenchHost.leave\` and its Evidence.flush before entering exact old source route; query/hash variants remain rejected.
- A source-format extension under the same version is treated as unknown, not normalized; the copied Circuit CSS and tests retain their original blobs, with responsive fixes in an EE-only stylesheet.
- Synchronous localStorage cannot provide cross-tab compare-and-swap. Baseline checks and storage events detect observed conflicts, but truly simultaneous writes remain a residual lost-update risk; this browser-local practice is not authoritative evidence.
- Original source works offline after site deployment; no Circuit-Simulation runtime/CI clone, CDN or secondary home page.
- Negative feedback and linear OP region are **assumptions**, no saturation, slew, rail, actual board timing or certified score.

## Verification
- Observe failing guard test before implementing adapter, then green; keep all original source tests.
- Test all 3 browsers with numerical skill 0, mastery persistence/reload, 320/390 widths, quota + backup, future schema, tab conflict and missing JS.
- Exact-head complete PR Chromium and Firefox/WebKit CI and independent code review before merge; new-main CI, Pages and hosted SHA/assets after merge.
- GitHub Actions green does not imply full physically validated power electronics or board evidence.

## Rollback
Revert only this migration through a follow-up PR, preserving the old browser-local key and any exported raw backups. Do not delete Circuit repository or Issue #20.
