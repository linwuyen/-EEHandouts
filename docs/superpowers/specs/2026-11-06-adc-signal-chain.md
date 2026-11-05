# ADC signal-chain migration (slice 4a)

## Objective and scope
Absorb the pinned Circuit standalone ADC signal-chain calculator into EEHandouts. Connect the existing analog/adc lesson and the saved workbench reference route; return locally. No old-site runtime/build dependency.

Base EE commit: `36abe27f619bcb39397913ada3fb1832ca49ca6b`, tree `953d0f82eb1f0cf03dfe59a299ca55938a838c6d`. Circuit source: `11ef4e4801b5283f265dc349a4afec0027603228`.

## Decision and source boundary
The approved overall approach is single-repository absorption, with isolated pages retaining numerical and evidence ownership. This slice uses `workbench/adc.html` rather than an iframe/external site or duplicating the equations in EE's lesson widget. Source `1_c2000_adc_calculator/c2000_adc_calculator.html` supplies the complete calculator. Existing `assets/learning/engineering-models.js` remains byte-identical and solely owns quantization/current/divider equations.

Old ADC lesson 1 labels Vref/(2^N-1) as LSB and uses rounding, while the source standalone calculator/model uses Vref/2^N and flooring. Do NOT silently reconcile or migrate those older lessons in this slice. Record this blocker in the inventory; existing EE P.106 and its widget remain unchanged.

## Interfaces and invariants
- Existing EE `#lesson/analog/adc` gets a separate explicitly named calculator link; defaults are the source's 3.3 V / 12 bit / 0.005 ohm / gain 8.2 / offset 1.65 V, not EE P.106's gain 14 / offset 1.5 V. No automatic parameter bridge.
- The workbench host maps only known Module 1 entry/calculator paths to `adc.html`. Entering from an evidence-writing page invokes its existing before/after guard and Evidence.flush. Unknown paths and other unmigrated ADC lessons remain explicitly unavailable; AFE still links to the existing EE lesson.
- Calculator is stateless: no Evidence/tutor/learning-bridge/lessons progress, localStorage, schema/key migration or auto-completion. URL query/share is the original calculator mechanism, with numeric input validation. Header links are fixed local paths, never `from`/return query controlled.
- Invalid/blank/nonfinite input, unsupported bit depth, nonpositive reference/resistors/gain, negative bus or noninteger series count must clear all old results and disable copy/share. Numeric overflow and missing calculation assets also fail closed. Valid input can recover after input errors.
- Source unit conversions, ideal rail saturation, current polarity, divisor definition and equal series-resistor assumption remain explicit. Source overrange warning says to increase the divider ratio; the adapted UI explicitly says to reduce Rbot/(Rtop+Rbot) (e.g. increase Rtop), as derived from the unchanged model. This wording correction is tested; no equation is changed. This is NOT ADC acquisition/ADCRESULT timing, analog front-end settling validation, calibrated firmware or board evidence.
- No dependency versions, numerical/proof/storage owners, existing tests, old repository or Issue #20 changed.

## Verification and rollback
Missing-page and invalid-result tests must fail before implementation. Actual script with real numerical owner is tested in Node; real three-browser suite tests lesson link, values, numeric/shared URL inputs, missing assets, fixed returns, copy/share, zero writes and 320/390px layout. Full existing suites remain enabled; new required public assets are part of hosted-release rejection tests. Independent exact-head review and PR CI precede merge; main CI/Pages/hosted SHA are separate gates. Revert this slice to remove its routes/page without touching browser storage.
