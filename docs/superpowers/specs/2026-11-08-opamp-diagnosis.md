# OP diagnosis integration — slice 4d

## Goal
Move the pinned Circuit `12_opamp_slew_rate/lab_diagnose.html` three-case formative exercise into EEHandouts; preserve its exact three cases and first-choice semantics. One EEHandouts repo and runtime, no old site links.

## Behavioral contract
- Entrance from EEHandouts OP course/lesson 4, step and sine labs and exact saved-host reference `12_opamp_slew_rate/lab_diagnose.html`, with before/after `Evidence.flush` gate. Unknown/unported/parametrized source routes do not enter.
- A: large amplitude-only triangular waveform suggests SR/FPBW; B: small-signal sweep roll-off and phase lag suggests GBW; C: post-ramp precision tail concerns settling/closed-loop dynamics. These are hypotheses/next measurement, not real-device proof.
- Three first choices get one immutable in-memory score per case. After a wrong answer, a later correction may change the highlighted current choice but must not rewrite first-choice score. Reload resets (no storage).
- JS missing, corrupt markup or boot failure must not allow answering or display a passing status. Only after initialization may controls become enabled.
- No Evidence, learning progress, localStorage, sessionStorage or formal grade. No model changes, no other OP module ports, no Circuit runtime dependency. Keep source/provenance SHA.
- Preserve old assessment unavailable wording and content, distinguish new *formative* diagnosis from formal assessment. No direct main modification or publication without CI and review.

## Verification
Node RED→GREEN of first-choice/unknown-case/markup and source/scope/route/asset checks; browser smoke Chrome+Firefox+WebKit for first/wrong/correct, reload, JS blocked, narrow widths, saved-host quota/conflict and no storage mutation; full existing tests; independent review before merge.

## Rollback
Revert slice 4d via PR without modifying historical browser data. Original source remains pinned; EEHandouts prior releases unchanged until accepted.
