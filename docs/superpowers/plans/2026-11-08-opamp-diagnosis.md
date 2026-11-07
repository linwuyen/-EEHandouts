# OP Diagnosis Slice 4d Implementation Plan

> **For agentic workers:** Implement via small RED→GREEN cycles. No release before review+exact CI.

**Goal:** Add the original three-case in-memory OP diagnosis exercise to EEHandouts, locally and without formal grades.

**Architecture:** One stateless local HTML page, one narrow first-choice controller, existing host and source manifest. Existing OP pages only gain links; model/Evidence owners remain unchanged.

**Tech Stack:** static HTML/CSS, vanilla JS, Node `node:assert`, existing Playwright regression.

**Spec:** `docs/superpowers/specs/2026-11-08-opamp-diagnosis.md`

## Global constraints
- Base `f696a0945ade3c68e90f3238c864b244fd5b417f`, pinned source `11ef4e4801b5283f265dc349a4afec0027603228`.
- Preserve first-choice in-memory semantics; no persistence, official grade or new numerical modeling.
- No external runtime dependencies, no old repo mutation, no main merge before all CI green and review.

## Review focus
- Wrong then correct does not inflate first-choice score.
- JS unavailable or partial markup leaves questions disabled.
- Source-route with query/hash or unknown path cannot bypass host allowlist.
- Existing record future-version, quota or concurrent changes block leaving saved workbench.
- Responsive/keyboard and feedback semantics on 320px and 390px widths.

### Task 1: First-choice session
- [ ] Add failing `tests/opamp-diagnosis-contracts.mjs` for exact three source keys, first answers immutable, unknown/invalid choice rejected.
- [ ] Run it to see expected missing-module failure.
- [ ] Implement `workbench/ee-opamp-diagnosis.js` with pure `createSession(answers)` and DOM `mount(doc)`, no storage.
- [ ] Re-run test, check PASS.

### Task 2: Local navigation, scope and provenance
- [ ] Extend failing source/host/release assertions to require local file and source route.
- [ ] Implement `workbench/opamp-diagnosis.html`, internal OP lesson/experiment links, host exact allowlist, coverage, manifest and hosted asset check.
- [ ] Re-run tests and full Node `npm run test:ci`.

### Task 3: Browser integration and PR
- [ ] Add `tests/opamp-diagnosis-smoke.mjs` to normal browser+cross-browser scripts, test answer/reload/JS-disabled/mobile/host guards/storage.
- [ ] Run all available suites on exact tree; state if browser environment blocked. Record evidence and complete independent review.
- [ ] Push only isolated migration branch and open PR. Do not merge into main or retire source.
