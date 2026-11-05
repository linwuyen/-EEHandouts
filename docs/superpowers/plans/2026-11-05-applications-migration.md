# Four applications migration implementation plan

> For agentic workers: use superpowers:executing-plans task by task.

**Goal:** Own the source-defined four-application learning route in EEHandouts.
**Architecture:** Local isolated page + existing save-gated EE host; source numerical/proof owners unchanged; a small raw-record validator protects the adapted source UI.
**Tech stack:** Static HTML/CSS/JS, Node22, existing pinned Playwright1.56.1; no dependencies added.
**Spec:** `docs/superpowers/specs/2026-11-05-applications-migration.md`

## Global constraints
Use only pinned versions in the spec; no source runtime/build dependence; no changed formula, evidence schema/key or first-attempt semantics. No old-repo retirement. CI/review gates cannot be skipped.

## Review focus
- Operated source records with stale model IDs/versions or mismatched before/after snapshots must be protected, not relabeled.
- Future raw records arriving during fetch/flush must remain byte-identical.
- Native slider grid mismatch must prevent operation acceptance; retained records do not silently become live control state on reload.
- Pending saves, quota and same-version tab conflicts must not show accepted progress or permit navigation.
- Existing comparator/experiment routing and source ownership must not regress.

## Task 1 — local closure and original model contracts
Files: applications.html, 17_power_topology_control/app.js/style.css, source-manifest, source tests; tests/applications-migration-contracts.mjs.
- [x] Write missing-page/dependency/model-owner test; observe failure.
- [x] Copy original UI/control/plot dependencies locally. Remove only nonmigrated tutor/formal-assessment bootstrap; do not alter calculations.
- [x] Run source application tests and all existing engineering tests. Local final slice commit after shared interfaces are green.

## Task 2 — guarded lifecycle and durable progression
Files: ee-applications-contract.js, ee-applications-entry.js, adapted topology-application-ui.js; tests/applications-evidence-contracts.mjs.
Interfaces: validator consumes raw source V1 application session, original W.applicationPlan/Run/Proof and registry IDs; returns validation error or null. UI mounts only after contracts load and validation; host owns navigation.
- [x] Write actual-record invalid-model/snapshot/shape tests plus positive records; observe RED.
- [x] Add validator and minimal lifecycle guards. Preserve source schema and all numerical/proof owners.
- [x] Add browser tests for source fixtures and asynchronous failure cases. Syntax checked; real browser execution remains pending.

## Task 3 — integrate source routes and release evidence
Files: ee-host.js, workspace-topology-ui.js, ee-entry.js, workspace-experiment-ui.js, coverage/inventory, package scripts, release-guard, applications-workbench-smoke.mjs.
- [x] Write route and hosted-asset failing assertions.
- [x] Connect next/return/recommendation through existing save gate; label assessment not migrated.
- [x] Attempt entire npm test and cross-browser; engineering/source tests PASS. Pinned browser executables absent; system Chromium navigation blocked by administrator policy. Not a browser PASS.
- [ ] Verify exact tree/hashes, publish isolated branch/PR, request independent exact-head review; stop without merge on incomplete gates.

## Execution disposition — 2026-11-05
Local implementation and Node gates are complete. Full browser validation, an independent reviewer, remote PR and post-merge release gates are **not complete**. Current connected GitHub tools are read-only and no write-capable CLI is available. Deliver the exact-base patch and handoff; do not create an invented PR, bypass policy or reinterpret local fixture success as remote success.


## Resume correction — 2026-11-05
A real-owner fixture reproduced a navigation race: after another writer changes the same root-version application record, but before its storage event runs, `Evidence.flush()` can truthfully report no pending local writes and the host previously allowed exit. The winner bytes were not overwritten; stale-page conflict navigation nevertheless violated this slice's contract.

- [x] Add mounted-page cases for same-version changes and nested future versions before flush and during the awaited boundary; compatible, pending-lock and quota-retry positive controls retained.
- [x] Register one page-owned record guard through `EEWorkbenchHost.setNavigationGuard`, invoked before and after the existing flush. No Evidence/numerical/grading owner, storage key or schema changes.
- [x] Observe RED, GREEN, reverted RED, then fresh full Node suite GREEN.
- [ ] Execute added real-browser cases in all three required browsers and obtain an independent review. Missing pinned binaries/DNS and unavailable connector write actions remain release blockers, not passed gates.
