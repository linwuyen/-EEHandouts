# Engineering review round 2: F05-F07 corrections

## Objective and fixed basis
Apply the approved findings against `fe6abb14008fe16921eeff5140dadea4ecb28d49`. Preserve 72 lessons, 154 page guides, seven advanced models and the PR43 corrections. No new topology, physical rectifier model, ZVS guarantee or hardware timing certification.

## Scope and invariants
- F05 changes the LLC numerical method, not its `Lr-Cr-(Lm||Rac)` equations or `Rac=8n²Rdc/pi²` assumption. Keep zero initial state and exactly 160 periods, the 2% periodicity/energy gates, and invalid-state warnings.
- F06 changes PFC trace coordinates and the shared viewer's physical-time interpolation. Keep PFC steady-state equations, Bode logarithmic axes and PSFB/timing behavior.
- F07 changes only the Buck capacitor control step from 100 to 10 uF; preserve the 470 uF default and all numerical equations.
- No workflow, dependency lockfile, textbook guide or release-guard logic is removed. Extend the existing package-command guard to require both original browser suites plus the new round-2 suite.

## Implementation
F05: energy-normalized three-state matrix exponential (scaled degree-18 Taylor plus squaring) propagates constant-input intervals. First 159 periods are advanced by exact half-period maps, without pretending the state is already periodic. The last period retains 241 plotting points. Power, RMS and fundamental use separate bounded adaptive Simpson quadrature; Pin and Rac dissipation are integrated independently rather than assigned from the energy balance. Quadrature-budget failure invalidates the result.

F06: all five PFC traces share the exact events `[0, ON end, diode end, period end]`, in microseconds. The renderer maps nonuniform physical x coordinates rather than equally spaced indices. Cursor values use held voltages and linearly interpolated current at the same physical time. The existing Bode log-frequency path is retained.

F07: the native range now accepts 470 uF exactly; keyboard steps, extrema and reset agree with the displayed label and the parameters consumed by the model.

## Verification
Each new regression was first run against the original implementation and failed for its named defect, then passed after the targeted fix.

- `tests/llc-accuracy.mjs`: nine independent SciPy expm/quad_vec fixtures, including transient/unsettled cases. Verify switch-edge samples, state variables, fundamental, RMS and independently integrated powers. The reviewed vp sample at 41.666667 ns after the negative edge is -188.14199952889223 V, not -339.811989 V. Maximum allowed numerical error is `1e-5*(1+abs(reference))`; per-case runtime ceiling 1500 ms.
- `tests/fixtures/generate_llc_reference.py`: optional offline oracle generator; requires NumPy/SciPy, is never imported by production or Node CI. A separate Radau integration crosschecks the primary fixture. Run `python tests/fixtures/generate_llc_reference.py --output /tmp/llc-reference.json` to regenerate without editing the tracked fixture.
- `tests/pfc-event-time.mjs`: narrow 17.316 ns pulse, CCM/BCM/DCM event synchronization, volt-seconds, current mean, KVL and probe agreement.
- `tests/advanced-control-defaults.mjs`: all 56 defaults lie on legal native range grids.
- `tests/review-round2-smoke.mjs`: actual SVG/DOM, physical cursor, LLC switch-edge fixture and runtime, plus Buck 470 -> 480 -> 100 -> 1000 -> reset470. Runs in Chromium and in the independent Firefox/WebKit job. `--offline` loads the real source locally; it is not the full HTTP-site suite.
- Local additional validation: 247 legal LLC parameter sets (183 review samples + 64 corners), all 241 samples for ir/vcr/im/vp compared against SciPy expm; max peak-normalized error < 1.6e-10. 126 points satisfy the unchanged steady-state gates; all quadrature checks converged. This does not exhaust the parameter space or validate a real LLC power stage.

Local full engineering/content suite passes. Local complete browser-suite attempts stop on missing pdf-lib / Firefox binaries; only the new offline Chromium DOM suite has local browser evidence. PR CI with pinned dependencies remains the authority for full browser acceptance. Do not infer any PR/main/deploy PASS from this document.

## Stop conditions, rollback and deliverables
Stop merging on failed/pending checks, unresolved review, source drift or an unreviewed physical-model change. Require exact-head browser-regression and cross-browser success plus review; after merge, verify new main CI, Pages and hosted SHA separately. Keep root-cause commits so each fix and its associated tests can be reverted together. Deliver numerical fixtures, regression tests, real-browser screenshots, red/green logs and an exact-tree comparison; retain existing safety warnings.
