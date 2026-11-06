# ADC signal-chain migration implementation plan

> For agentic workers: use superpowers:executing-plans task by task.

**Goal:** Local ADC signal-chain calculator with clear model boundaries and existing save-gated entry.
**Architecture:** Source calculator HTML/UI adapted locally; numerical owner reused unchanged; no new persistence.
**Tech Stack:** Static HTML/JS/CSS, Node 22, pinned Playwright 1.56.1; no new dependencies.
**Spec:** `docs/superpowers/specs/2026-11-06-adc-signal-chain.md`

## Global Constraints
Pinned commits in spec; numerical/evidence/proof owners and tests unchanged. No automatic parameter, grade or storage bridge. No old-site runtime/build dependency, repo retirement or Issue #20 closure.

## Review Focus
Invalid query/input must clear prior outputs; current range/saturation distinct from actual hardware safety; source missing cannot leave enabled copy; unknown deep links cannot silently redirect to a different lesson; caller's pending save or conflict cannot be bypassed.

## Task 1 — calculator closure and invalid-state contract
Files: `workbench/adc.html`, `workbench/ee-adc.js`, `tests/adc-workbench-contracts.mjs`, `tests/adc-workbench-page.mjs`.
Consumes existing `CircuitModels.quantizeAdc/calculateCurrentChain/calculateDivider`; produces a stateless page and ready/invalid/failed DOM states.
- [x] Write missing page and actual UI/owner fixtures; observe RED.
- [x] Adapt source HTML/UI; keep formulas/controls, add local header, precise default/validity note and fail-closed input handling.
- [x] Verify literal default/zero/positive/negative/rail examples, copy/share and invalid-state recovery.

## Task 2 — course/host integration and source provenance
Files: `app.js`, `workbench/ee-host.js`, source manifest, coverage/inventory, imported models/invariant tests.
Consumes existing host navigation guard and flush; produces allowlisted `adc.html` entry without storage mutation on the destination.
- [x] Verify exact supported reference paths, unknown-path rejection, pending/conflicted saves and future raw evidence.
- [x] Connect entry and update source provenance; document legacy source mismatch and previous slice's release.
- [x] Run complete Node/source suites; compare unchanged owner hashes.

## Task 3 — browser/release gate and isolated PR
Files: `tests/adc-workbench-smoke.mjs`, package scripts, published-head script, release-guard tests.
- [x] Add actual Chromium/Firefox/WebKit interaction, URL, clipboard, missing asset, raw-record preservation and mobile assertions.
- [x] Require new published assets; observe missing-asset RED then GREEN.
- [ ] Run full test commands or report exact environment blocker; publish only tested tree to an isolated branch.
- [ ] Obtain independent exact-head review and full PR CI; never claim release before main/Pages/hosted verification.
