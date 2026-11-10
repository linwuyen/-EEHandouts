# Slice 6b-3 Buck formal assessment — scope and source contracts

- EEHandouts base main: `0097466670df60382ca09c0b437dd3550ae6405a`.
- Original Circuit ref: `11ef4e4801b5283f265dc349a4afec0027603228`.
- Canonical family IDs: `buck-ripple-inductance-transfer`, `buck-dcm-boundary`, `buck-model-validity`; source QuizBank, CircuitAssessment and CircuitEvidence remain byte-identical Git owners and V5 remains the only formal store.
- Baseline A, seeded changed conditions B/C, seeded retention D, and source 1/7/30/90-day due-review policy. First wrong answer cannot be replaced by retaking it. Practice/mastery and hardware proof are not formal grades.
- UI-only port: standalone Buck assessment route, allowlisted `quiz.html?module=buck`, entry from workbench coverage. Both typed answer confirmation and protected backup fail closed on unsupported/future/malformed V5, missing Web Locks, held lock, quota, stale snapshot, and readback failure.
- In source Evidence, `load()` may auto-migrate unsupported raw and queue a write: the adapter must validate+load synchronously under one key Web Lock and flush only AFTER lock release. Export uses the same key lock; pending unsaved answer draft must stay downloadable even if the current raw is a newer schema.
- Do not alter source question generation, math/physics or retention semantics; no new score store, no production device claims. Buck transfer ratio and DCM model validity are idealized qualitative claims requiring real converter measurements and protections separately.
- Acceptance: new original-source Node contracts, real Chromium/Firefox/WebKit interaction and 320/390 viewport, first wrong→transfer→reload, due 1/7/30/90, genuine Web Lock races with raw preservation, backup with pending draft, quota and missing asset cases, and unchanged old V5 other families.
- Release: independently reviewed exact PR HEAD + complete CI; after merge, new main CI and Pages hosted SHA, actual ZIP/TAR blob checks. No old Circuit retirement or rights Issue #20 closure. Rollback separate revert PR preserving V5 bytes and user backup.
