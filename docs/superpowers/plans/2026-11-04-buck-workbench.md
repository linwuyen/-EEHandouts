# Buck Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans.

**Goal:** Self-contained Buck experiment in EEHandouts.
**Architecture:** Independent local document, original numerical/evidence owners, bounded host navigation.
**Tech Stack:** Existing static HTML/JS, Node 22, pinned EE Playwright. No dependency upgrades.
**Spec:** ../specs/2026-11-04-circuit-absorption.md

## Global Constraints
Exact EE b1e41595 / Circuit 11ef4e48; no external Circuit runtime/build dependency; no kernel/storage/score changes.

## Review Focus
Unsaved return must stay; conflicting/newer records cannot overwrite; unknown return query must not redirect; missing lazy asset must report; mobile and non-migrated advanced navigation remain understandable.

### Task 1: Immutable runtime import
- [ ] Write tests/migration-contracts.mjs and observe missing internal entry RED.
- [ ] Import deterministic local-source closure, manifest and original unit tests; maintain CommonJS package boundary; GREEN.
### Task 2: EE navigation
- [ ] Write actual DOM test lesson→experiment→answer→flush→return; read mark unchanged. Observe RED.
- [ ] Implement host navigation, records backup, coverage; only adapt original UI navigation points.
- [ ] Verify eight-step, reload, conflict, quota, newer record, asset failure and mobile behaviors.
### Task 3: Delivery
- [ ] Add CI commands without removing any existing suite; complete migration inventory.
- [ ] Run full EE plus imported unit tests and browser acceptance.
- [ ] Push tested exact tree to isolated branch; create PR and request independent Review; do not claim pending CI as passed.
