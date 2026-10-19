# ACTIVITY MONITOR APP SHELL

**Date:** 2026-08-26

**Repository:** `C:\Users\Colin\The Healthy Apples\GitHub\tha-integrated-dev`

**Branch:** `feat/integrated-dev`

**HEAD:** `a007b37f7f62bd9cbb59c20edf8ced2c22144a56`

## RISK

GREEN — non-functional Admin shell and presentation scaffolding only.

**Verified:** No server route, external request, activity response model,
credential, polling loop, persistence, workflow, or lifecycle state was added.

## ROLLBACK_IDENTIFIER

`rollback/activity-monitor-app-shell-20260826-120000` →
`a007b37f7f62bd9cbb59c20edf8ced2c22144a56`

The tag records the committed base. Because the worktree was already dirty,
rollback must be selective: reverse only the Activity Monitor hunks in the
three existing client files and delete the new page, focused test, registry
entry, and this report. Do not check out or reset whole dirty files.

## FILES_CHANGED

- `client/src/pages/admin-activity-monitor-page.tsx` — new contract-independent shell.
- `client/src/App.tsx` — one lazy import, Admin chrome wrapper, and protected route.
- `client/src/components/admin-banner.tsx` — one Activity Monitor navigation entry.
- `client/src/pages/admin-page.tsx` — one honest Support Hub tool card.
- `server/tests/test-admin-activity-monitor-shell.ts` — focused static regression.
- `docs/product/surfaces/admin/adm-activity-monitor.md` — current product-registry entry.
- `docs/product/structure/domains/dom-admin.md` — related Admin-domain reference.
- `docs/product/surfaces/admin/adm-home.md` — related Admin Hub reference.
- `docs/implementation/ACTIVITY_MONITOR_APP_SHELL.md` — this implementation record.

## PRE_EXISTING_DIRTY_FILES_PRESERVED

**Verified:** The repository was substantially dirty before work began.
`client/src/App.tsx` already contained a Pantry preview import and routes plus
Cookbook route changes. Those hunks remain intact; the Activity Monitor patch
was limited to the Admin import, chrome, and route positions.

**Verified:** All other previously modified and untracked files were left
untouched. No reset, clean, stash, checkout, commit, push, deployment, or
migration was performed.

## ARCHITECTURE_COMPLIANCE

**Verified:** The page follows the existing Admin conventions:

- lazy route registration in `client/src/App.tsx`;
- `ProtectedRoute` for authenticated application access;
- page-local Admin role guard returning `NotFound` for non-admin users;
- shared `AdminBanner` chrome;
- Support Hub discovery;
- existing `Table`, `Badge`, `Skeleton`, `LoadError`, and `Card` primitives;
- calm Observation/Behaviour workbench layout idioms.

**Verified:** The shell renders honest absence and does not render fabricated
records, canonical statuses, or success claims.

**Verified:** No new reusable visual building block was introduced. The page
composes existing owners, so no Adoption Register owner or exemption was added.

## CANONICAL_OWNER_IMPACT

**Verified:** None. The bridge remains the canonical owner of governed activity
facts. The application owns only this presentation shell and navigation.

## DUPLICATED_STATE

NONE.

## DUPLICATED_WORKFLOW

NONE.

## IMPLEMENTED

- Admin Activity Monitor route at `/admin/activity`.
- Existing Admin authentication and role-protection pattern.
- AdminBanner navigation and Support Hub card.
- Heading and explanatory copy.
- Honest `Not connected` state.
- Loading skeleton structure.
- `LoadError`-based error structure for the later query boundary.
- Recent-work table shell with no records.
- Detail-panel shell with no fabricated selection.
- Focused regression enforcing route protection and contract independence.

## NOT_IMPLEMENTED

- Bridge API client or proxy route.
- Bridge credentials or environment variables.
- Activity Projection response model.
- Request-to-decision linkage or history.
- Lifecycle or terminal-state vocabulary.
- TanStack Query polling or stop conditions.
- Runtime/business-data reads or writes.
- Sample or fixture activity records in production code.

## BLOCKED_BY_BRIDGE_CONTRACT

**Assumed:** The future canonical contract must still supply its bounded response
shape, field ownership, lifecycle vocabulary, terminal semantics, authentication,
redaction, ordering, and error behaviour before data connection can begin.

## TESTS

- `npx tsx server/tests/test-admin-activity-monitor-shell.ts` — **PASS**.
- `npm run build` — **PASS**; the page compiled as the lazy
  `admin-activity-monitor-page` chunk.
- `npm run typecheck` — **BASELINE FAIL** on existing server/intelligence and
  historical test errors; no diagnostic referenced an Activity Monitor file.
- `npm run adoption:check` — **BASELINE FAIL** on thirteen pre-existing adoption
  debts. The new page is imported and was not reported as an orphan; it added no
  `Loader2`, raw `button`, or `useMutation` rival.
- `npm run test:know2-human-evidence-publication` — **ENVIRONMENT FAIL** after
  its first 29 assertions passed. Its existing test script invokes Unix `grep`
  and `true` through Windows `cmd.exe`; neither executable is available in that
  shell. The failure occurred before its Admin navigation assertion and is
  unrelated to this shell.

## USER_ACCEPTANCE_EVIDENCE

Starting page: Admin Support Hub or shared Admin navigation.

User action: open **Activity Monitor**.

Expected behaviour: `/admin/activity` loads through the standard protected Admin
route and clearly reports that governed activity data is not connected. It shows
no fabricated pipeline records.

Verified evidence: route, chrome, Admin guard, unavailable copy, loading/error
structures, no-query/no-polling rules, production build, and focused static test
all pass. A bounded local-server attempt on isolated port `5056` stopped before
listening because the existing runtime requires `DATABASE_URL`. No credential was
read or invented. An authenticated visual browser session was therefore not
available in this task, so final pixel-level Admin acceptance remains to be
performed by an Admin user in the configured application runtime.

## DATA_IMPACT

- Reads existing: normal authenticated user state only.
- Writes new runtime/business data: none.
- Changes meaning: none.
- Backfill: none.

## ROLLBACK_PLAN

1. Remove only the Activity Monitor lazy import, chrome wrapper, and route from
   `client/src/App.tsx`; preserve its pre-existing Pantry and Cookbook edits.
2. Remove only the Activity Monitor entries from `admin-banner.tsx` and
   `admin-page.tsx`.
3. Delete the new page and focused test.
4. Remove the Activity Monitor registry entry and reverse only its two related
   links in the existing registry documents.
5. Delete this implementation report.
6. Re-run the focused test (expected to be absent), build, and a status/diff
   review against the rollback tag without resetting unrelated dirty state.

## DEFINITION_OF_DONE

- [x] Page shell loads through existing Admin route conventions.
- [x] Existing Admin role gate remains intact.
- [x] Existing UI primitives are reused.
- [x] No lifecycle facts or bridge fields are invented.
- [x] No polling, credentials, proxy, persistence, or duplicate workflow exists.
- [x] Unrelated dirty work is preserved.
- [x] Focused regression and production build pass.
- [x] Product registry records the current shell honestly.
- [ ] Authenticated Admin visual acceptance — blocked only by the absence of an
      authenticated test session in this task, not by implementation code.

## TRUST_CHECK

- highest-risk claim still Inferred or Assumed: **Assumed** — the final bridge
  contract will provide the exact facts and terminal semantics required by the
  later consumer.
- evidence required to verify it: the final canonical bridge Activity Projection
  schema, authenticated examples, field ownership/redaction rules, and lifecycle
  terminal semantics.

## SUGGESTIONS

- Address the pre-existing Adoption Register and TypeScript baselines as separate
  governed work; they were not caused by this shell and were not modified here.
- Once the bridge contract is canonical, create a bounded data-connection decision
  covering the server-only client/proxy, schema validation, conditional polling,
  and contract-derived rendering.
