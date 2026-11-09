# Slice 6a — C2000 ADC 五課與速查導讀
## Exact sources
- EE main base: `e0b7841cc6fa3731da995bf0ebdcbc12fdec6a7c`
- Pinned Circuit: `11ef4e4801b5283f265dc349a4afec0027603228`
- Original overview / five lessons / formula reference: Git blobs pinned in `workbench/source-manifest.json:adcCourseSourcePages`.
- Existing EE owner: `workbench/assets/learning/engineering-models.js` — remains byte-identical; no second ADC solver.
- TI first-party: F28004x Datasheet Rev. H (SPRS945H), ADC configurability and timing tables; TRM SPRUI33.

## Scope and boundaries
- One stateless HTML page with six lesson anchors (overview plus five teaching stages), reference section and separate responsive CSS.
- Physical flow: Shunt → gain → DC Offset → ADC / current scaling; high-voltage divider → ADC / voltage scaling.
- Original source's Vref/(2^N−1) round-based endpoint mapping is distinguished from the integrated CircuitModels Vref/2^N floor/clamp teaching quantizer. No silent formula rewrite.
- F28004x is 12-bit. At SYSCLK 100 MHz, ACQPS=7 gives 80 ns; datasheet 75 ns condition is limited to Rs≤50Ω. This does not establish settling for an actual AFE or timing correctness for CPU interrupts. No firmware register generator.
- Not an exact reproduction of original per-page sliders or the original `c2000_adc_progress` completion marker. Guided concept reading delegates numerical exploration to the existing `adc.html` calculator; no independent evaluation, grade, BOARD_PASS, V5 writer, or storage migration.
- Source routes recognized by exact path only. All saved-workbench navigation still crosses `EEWorkbenchHost.leave` and its Evidence.flush gate; unknown / query / hash source variants stay unavailable.
- New narrative is independently written rather than copying lecture extracts or images. Copyright authorization issue #20 remains open; source and history are not removed or declared licensed.

## Acceptance
- Node: source/converted page provenance, unchanged Solver, LSB + end-code, 0 / ±20 / +30 A, 800 V divider, acquisition-window assumptions, exact route and storage-free page.
- Chromium/Firefox/WebKit real DOM: lesson anchors, expanding comprehension questions, simulator handoff, 320/390 overflow, unchanged localStorage, host navigation quota veto.
- PR exact HEAD full Node/browser CI and independent review must pass before merge; new main CI, Pages and downloaded artifact SHA/assets independently accepted before release.
- Failure boundaries: source mismatch, new grade/progress writer, changed numerical semantics, P1/P2 finding, missing assets or failed CI block merge.

## Rollback
Revert the isolated PR; preserve learning keys and historical backups. No old Circuit-Simulation retirement, no force-push.
