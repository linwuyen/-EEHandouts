# 6b-4 — Power topology original formal/retention assessment

## Exact source and boundaries
- EE main base: `528ea1bef5d2ba422013efa8574897580afcf3cd` (tree `145da51c347a2e3b67f93d9468366c818c798bf5`). Source Circuit: `11ef4e4801b5283f265dc349a4afec0027603228`.
- Source `assets/learning/quiz-bank.js` blob `b22c59dddf02c0aa72daa3b12202ea176d965528` provides exactly four `power-topology-control` families: `topology-pfc-scaling`, `topology-psfb-scaling`, `topology-llc-scaling`, `topology-inverter-scaling`.
- Only the existing QuizBank creates questions, CircuitAssessment evaluates answers and schedules A/B/C/D, and CircuitEvidence writes `circuit-learning-state-v5`. No duplicate owner or unrelated content migration.

## Source ideal-physics contracts
- PFC bus-voltage ripple (fixed Vbus and mains frequency) scales with output power divided by bus capacitance, not with input THD.
- PSFB leakage inductance commutation energy scales with current squared; does not imply ZVS has been achieved or deadtime validated.
- LLC series resonant frequency and ideal inverter LCL resonant frequency scale with the inverse square root of capacitance; no claim about stability, damping or controller bandwidth.
- A baseline, B/C changed-condition transfer and seeded D retention; due stages 1/7/30/90 days. Historical wrong-first preserved. Never grant learning credit from practice-only activity.

## Safety, evidence and release
- Exact source route `quiz.html?module=power-topology-control` only, query/hash variations denied. Local navigation must flush source Evidence before leaving.
- Unsupported/future/malformed V5, old migrations, missing Web Locks, source races, quota, missing source, readback failures: fail closed, preserve original bytes and unsaved answer draft for export. Backup-only Web Lock uses `ifAvailable:true` to avoid starvation.
- Node source contracts plus real Chromium, Firefox, WebKit smoke, 320/390, first-wrong/transfer/reload, retention, held Web Locks, conflict, quota, backup. Keep all existing CI steps.
- Exact-head independent P0/P1/P2 review and complete PR CI before merge. After merge, new main CI, workflow_run Pages, hosted SHA/assets, download actual ZIP/TAR and compare changed files to Git blob SHA-1.
- No hardware BOARD_PASS, rights approval, full 6b/6c/6d audit, or whole Circuit retirement. Issue #20 remains a separate blocker; rollback via reviewed revert PR without clearing user V5 bytes.
