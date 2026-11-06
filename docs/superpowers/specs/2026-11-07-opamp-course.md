# Slice 4c: OP dynamic-response reading path

## Objective / Scope
Continue the authorized single EEHandouts migration after published PR49 (`b4a3588ec121c7b685e3aa4ac6044d8de1ee2d31`). Bring in exactly the six pinned Module12 concept lessons, with a local contents page and links to the existing step/sine labs. No new simulator, quiz, DC trainer, diagnosis lab, persistence owner, source-site dependency or repository retirement.

## Source and approaches
Circuit source stays `11ef4e4801b5283f265dc349a4afec0027603228`. Full Module12 import would also import unverified grading and DC tooling; external links would retain a second runtime site. The chosen bounded migration keeps the six lesson bodies/order, adapts their shell/navigation and keeps unported features visibly deferred. User already authorized sequential implementation; this is the implementer's slice boundary, not a new user requirement.

## Target state and ownership
- `workbench/opamp-course.html`: contents, scope and fixed local returns; not a second global homepage.
- `workbench/12_opamp_slew_rate/01_slew_rate.html` through `06_datasheet_selection.html`: static readings, no script/storage/automatic progress.
- Existing OP lab links expose the reading path. Original lab source, numerical/plot owner, Evidence and schema remain unchanged.
- Existing EEWorkbenchHost maps only exact known source paths; uses the original before/after guards and flush before leaving the experiment. Unknown paths still go to coverage.
- Six lesson instructional bodies are source-hash checked. Only the lesson06 bandwidth phrase is explicitly corrected: source `noise gain / GBW` is not bandwidth; a dominant-pole voltage-feedback estimate is `BW ≈ GBW / noise gain`. Preserve the original wording in an identified correction note, cite Analog Devices AN-940 (Noise Gain) and state approximation limits. No silent reconciliation or model rewrite.
- The source footer's diagnosis/Transfer links point to an explicit unavailable section; never masquerade as a completed assessment.
- Source attribution and this documented edit remain visible, not just in a report. Keep existing source manifest and append six adapted entries.

## Verification / Stop / Rollback
Tests pin content, equations, routes, preservation of existing/unknown learning records, zero storage access by new static pages, JS-disabled navigation, narrow screens and mandatory published assets. Full old suites remain enabled. Missing/failing tests or unresolved important review findings block merge; each release separately requires new-main CI and Pages verification. Roll back via a revert PR; never clear browser data or modify the old repository. Issue20 stays outside scope.
