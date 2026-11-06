# OP AMP labs implementation plan

> **For agentic workers:** Use superpowers:executing-plans task by task; verify every gate.

**Goal:** OP lesson / ADC tool / saved-workbench reference → local step and sine labs → fixed local return.
**Architecture:** Isolated stateless pages, unchanged pinned numerical owner, existing host persistence gate.
**Tech Stack:** Static HTML/CSS/JS, Node 22, pinned Playwright 1.56.1.
**Spec:** `docs/superpowers/specs/2026-11-06-opamp-labs.md`.

## Global Constraints
Exact base/source and numerical bytes as spec. No storage/schema/grading changes, dependency upgrades or external runtime dependency. Future/failed evidence is never rewritten by stateless labs.

## Review Focus
- Blank/nonfinite/out-of-range input clears stale readings and canvas; a valid edit restores display.
- Missing source or integration JS never presents ready controls or a believable old result.
- Module 12 exact routes only; unported diagnosis/course routes remain unavailable, not disguised as migrated.
- Sine margin does not assert actual amplifier safety or formal assessment pass.
- New navigation cannot bypass the host's existing save/conflict gate.

### Task 1: local pages and numerical provenance
- [x] Add failing `tests/opamp-workbench-contracts.mjs` and `tests/opamp-workbench-model.mjs` (pages missing, exact owner bytes and +8/-8/zero/sine fixtures).
- [x] Import source JS/CSS unchanged, adapt two source pages; run contracts.
- [x] Add stateless UI guard and actual-owner DOM fixture tests; observe missing guard RED then GREEN.

### Task 2: integrate routing and tests
- [x] Extend existing real-host tests with exact step/sine routing, unported routes rejection and guarded save behavior; observe RED.
- [x] Add OP/ADC/coverage entry links, host allowlist and source manifest; fix inventory AFE classification explicitly.
- [x] Add all-assets release-check negative controls and a Playwright DOM suite wired into both original browser commands.
- [x] Run all Node scripts and attempt full `npm test` / cross-browser without weakening pinned dependencies.

### Task 3: verification and delivery
- [x] Fresh Node suite, source hashes and diff check. Full browser commands were attempted and are BLOCKED, not PASS.
- [x] Apply the delivered patch to a clean base and compare its tree; repeat the complete Node suite.
- [ ] Exact-head independent review and full PR CI when write/review environment is available.
- [x] Keep main unchanged until all required gates pass; deliver verified patch/evidence because write actions are unavailable.

## Observed completion boundary
Local source/contract tests and clean replay passed. `npm test` and `npm run test:cross-browser` did not complete: Playwright package installation failed with EAI_AGAIN; system Chromium also blocked localhost navigation by administrator policy. Independent review and exact-head PR CI remain NOT RUN. No PR, merge or publication occurred.
