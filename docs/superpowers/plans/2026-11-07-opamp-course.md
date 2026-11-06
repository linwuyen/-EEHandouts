# OP concept-course implementation plan

> Execute inline using superpowers:executing-plans; preserve fresh whole-branch review before merge.

**Goal:** Local OP readings connected to existing EEHandouts labs.
**Architecture:** Static source-preserving lesson pages, existing source CSS plus a small layout stylesheet, explicit host allowlist. No new state owner.
**Tech Stack:** HTML/CSS/JavaScript, pinned Node22/Playwright1.56.1.
**Spec:** docs/superpowers/specs/2026-11-07-opamp-course.md

## Global constraints
Base b4a3588e; Circuit11ef4e48. Do not modify numerical/plot/Evidence/grading owners, keys, schemas, dependencies, old repo or existing test coverage. Original lesson text stays intact except the visible documented bandwidth correction. No formal PASS or board claim.

## Review focus
Unported diagnosis/quiz links; reversed BW wording; new source paths bypassing flush; future-version records; small-screen and JS-disabled readability.

### Task 1: source-preserving local readings
- [ ] Add `tests/opamp-course-contracts.mjs` and fixtures; observe missing-page failure.
- [ ] Add contents, six lessons and `ee-opamp-course.css`; add visible correction and unported boundary; verify content/links.
### Task 2: integration and release gates
- [ ] Add `tests/opamp-course-host.mjs`; observe missing-map failure.
- [ ] Add exact host routes and reading links to existing labs; update manifest, inventory and coverage only.
- [ ] Add publication asset failures, keep old tests, wire new checks to package scripts. Run all Node suites and negative controls.
### Task 3: browser and independent review
- [ ] Add `tests/opamp-course-smoke.mjs`: six chapters, both labs, fixed returns, local runtime, preserved data/zero storage access, disabled JS, 320/390px and host save refusal/success.
- [ ] Submit isolated branch, verify exact tree, run full standard CI and independent review. Never infer full coverage from targeted checks.
- [ ] Record status, remaining gates and rollback; no new slice before this one's acceptance.
