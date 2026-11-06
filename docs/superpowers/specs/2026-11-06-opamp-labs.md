# Slice 4b: local OP AMP step/sine labs

## Objective / authorization
Continue the approved single EEHandouts migration, in small reversible slices. The user repeatedly authorized sequential execution. This is NOT permission to delete the source repo, erase storage, upgrade dependencies, or bypass release gates.
Base: EE `2b9c516fc57538f7d7bd5f33881a0cdd3884362f`, tree `97009d67050f5a288d034dc4f61f1f005aa0f691`.
Source: Circuit `11ef4e4801b5283f265dc349a4afec0027603228`.

## Approaches and ruling
Retain the approved local, isolated-page architecture instead of linking the old site or mixing its global tutor into EE's lesson document. Import the two Module 12 labs and their original numerical/plotting owner, not the full legacy course or its formal assessment. Selection of this small slice is an implementation ruling under the user's existing sequential-migration approval.
Module 9's own README calls it a bidirectional power-control AFE simulator: it is NOT the analog front end of Module 1. Correct the inventory/routing classification explicitly, without changing that source.

## Scope / ownership
Add `workbench/opamp-step.html`, `workbench/opamp-sine.html`, original `12_opamp_slew_rate/assets/opamp.{js,css}`, a stateless UI boundary adapter and responsive integration CSS.
Keep numerical source bytes unchanged. Add lesson and ADC links; exact host source-path mapping uses the existing before/after guard and Evidence.flush. Fixed local return links only, no parameter/state transfer.
Keep source explanatory text; label the original sine pass contract as not enabled here. No A-grade, formal pass, board pass, or automatic lesson completion. Old ADC course inconsistencies remain deferred.
No access to localStorage/sessionStorage/Evidence from the two labs. Inputs remain in the page and are not preserved on navigation. No silent save claims.

## Verification / stop conditions
Node contracts verify closure, provenance, exact routes, input fail-closed state, original step/sine fixtures and existing 40 scripts +87 source cases. Real browser suite verifies DOM, canvas, zero storage writes, source/adapter asset failure, mobile, local lesson return, and workbench save refusal/retry.
No merge/publication before exact-head full Chromium/Firefox/WebKit and independent review pass. A local test result is not CI/release evidence. Missing tools or failed install stays an explicit incomplete gate.
Rollback removes this slice's routes/pages only; preserve every learning record/export and previous migration.
