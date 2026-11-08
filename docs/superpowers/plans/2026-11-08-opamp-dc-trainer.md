# OP AMP DC Trainer slice 5a — execution checklist

Base: \`6fc37f52baa12ee4ede0d8addb41364ab1d43e92\`. Source: \`11ef4e4801b5283f265dc349a4afec0027603228\`.
Spec: \`docs/superpowers/specs/2026-11-08-opamp-dc-trainer.md\`.

- [x] Reproduce failure of guard contract when adapter is missing (RED).
- [x] Add only persistence guard; 7 focused Node guard cases passed locally (GREEN).
- [x] Verify unmodified 11 upstream source cases locally, 0 failures.
- [x] Copy pinned CSS and tests, adapt only source autoMount storage argument, and convert source HTML to local paths.
- [x] Add local course and exact workbench route, source manifest SHA and required deploy assets.
- [ ] Run exact-branch full Node suite and Chromium/Firefox/WebKit browser suite on GitHub Actions.
- [ ] Complete independent review, resolve important findings, retest exact HEAD.
- [ ] Merge only when gates all green; separately verify new main CI, Pages, hosted SHA, actual assets.
- [ ] Keep older Circuit repo and user learning records intact.
