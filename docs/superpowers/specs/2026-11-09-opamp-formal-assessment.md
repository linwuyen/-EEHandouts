# OP AMP first-attempt, transfer and retention migration — slice 5b

Base: EEHandouts `c234f718f4e0e9d1fb31eb32643368ff48bcd031`.
Source Circuit `11ef4e4801b5283f265dc349a4afec0027603228`.

## Authority and ownership
- Existing `learning-assessment.js` is the single owner of first-attempt, deterministic transfer, due-review intervals (1/7/30/90 days), grading and progress. Port original `opamp-assessment.js` without modifications (source Git blob `353e71b253d895976e93ef9c2259e618b702de80`).
- Existing `learning-evidence.js` exclusively owns the `circuit-learning-state-v5` record and Web Locks persistence; the new EE adapter only handles visual UI, unsupported-version preflight, acknowledgement/readback and backup.
- Only OP AMP Slew Rate assessment family is included in this slice; no generic expansion to other modules, no change to the original numerical/assessment kernels.

## Invariants
- Do not rewrite unknown/future/malformed raw data or automatically import a legacy-only V4/V3/V2 record in this new entry. Historical V5 records and wrong first answers survive intact.
- Never show a passing answer or advance until `Evidence.flush().saved` and verified on-disk history. Quota, cross-tab conflict, missing Web Locks, missing source or readback failure fail closed and expose backup; no BOARD_PASS, certificate or physical board evidence.
- Do not merge DC Trainer's `opamp-dc-reasoning-trainer-v2` practice key with V5 formal assessment.
- Source quiz expansion retains source distractors, first attempt and fixed retention interval rules. The trainer provides no alternate score owner.

## Acceptance
- Unit: copied original module source hash, baseline wrong answer immutable, transfer, due/no-due, first retention stage and next schedule; unknown V5 fails closed.
- Real browser: Chromium, Firefox, WebKit first-answer → transfer → reload/no duplicate, V5 record, 320/390px layout, read-only backup, unsupported-version data preservation.
- PR: exact HEAD Node, three-browser CI and independent code review required before merge. Post-merge: new main CI, Pages SHA and assets, actual artifact checks.

## Exclusions / stop conditions
- Existing Source Circuit-Simulation remains available; no mass migration of C2000 firmware or other assessments in this PR.
- Public extracted lecture text rights unresolved: Issue #20 remains open until a real authorization or approved replacement strategy exists; no history rewrites or deletion.
- Rollback: isolated PR revert, preserving V5 localStorage bytes and user exports.
