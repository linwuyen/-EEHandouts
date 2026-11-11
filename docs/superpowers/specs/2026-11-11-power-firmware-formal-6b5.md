# 6b-5 — Power Firmware source-backed formal assessment

## Immutable source & scope
- Circuit-Simulation `11ef4e4801b5283f265dc349a4afec0027603228`, original `assets/learning/power-firmware-assessment.js` Git blob `5579ff0338656507dab45ac7bd7a4dc3d6388048` copied byte-for-byte.
- Original `quiz.html` blob `61ad104246926cea2ea5b94ce9ded605c34340da`; EE base `bd9fc7b9a46f278a21c39afb34620e4d72b6c8b1`.
- Only the formal Power Firmware three families: `power-sync-deadline`, `protection-trip-latency`, `capstone-signal-chain`. Do not copy source numeric responses, diagnostic games or unported labs.

## Invariants
- Original `CircuitAssessment` grades and schedules seeded A/B/C/D, R1-R4 and unbounded Tn/RXn; original `CircuitEvidence` exclusively persists `circuit-learning-state-v5`.
- Preserve first wrong attempt, source seed, role, family ID, choice/grade, 1/7/30/90-day retention. Reject foreign/future schema and unsafe identity; allow raw V5 and pending draft export under Web Lock conflict, quota and missing source.
- Only exact source routes `quiz.html?module=power-sync`, `quiz.html?module=protection`, `quiz.html?module=power-capstone`; suffixes/foreign URLs denied. Flush V5 before navigation.
- Physics, safety and deterministic timing remain first: original question texts are conceptual, not MCU/board proof. No BOARD_PASS, hardware Trip timing validation, TI compile claim, or rights clearance.

## Verification & rollback
- Native Node source/physics/negative contract tests, real 3-browser end-to-end suites, 320/390 layouts, and full unchanged CI. Independent exact-HEAD P0/P1/P2 review, then PR CI before merge.
- After merge: new-main CI, Pages workflow_run, hosted SHA/assets, real GitHub artifact ZIP SHA, release stamp and exact changed-file Git blobs.
- If V5 ownership, source SHA, fault-safety role or tests cannot be established: stop and keep the branch unmerged. Roll back only this slice; do not delete V5 or weaken CI.
- Remaining 6b Assessment V8 nine families, 6c/6d, final audit and copyright Issue #20 remain open.
