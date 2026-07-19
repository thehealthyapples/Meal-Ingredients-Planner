# NAV1 — Shared THA Application Shell

**Session ID:** `NAV1_Application_Shell`
**Objective:** Implement the shared THA application shell — permanent top header,
unified navigation, contextual desktop rail, shared page shell, responsive
behaviour, active highlighting, Companion entry in the header.
**Rollback ID:** `rollback/NAV1-application-shell-20260719` → `993e1bc8`
**Stage:** Verification — full test suite running
**Report:** `docs/implementation/NAV1_APPLICATION_SHELL_IMPLEMENTATION.md`

---

## Rollback

Annotated tag `rollback/NAV1-application-shell-20260719` → `993e1bc8`.

⚠️ **The working tree was already dirty when the tag was created.** The tag
protects committed state only. It does **not** cover the modified tracked files
or untracked paths belonging to the COMM1A / COMM2 and other sessions listed in
`CURRENT.md`. None of that work is mine and none of it has been altered.

---

## Scope stop — resolved

The brief's seven-item navigation list collided with canonical `NAV_ITEMS`
(nine, declared the single source of truth): it would have removed `/orchard`
(COMM2, same day) and `/analyser` from navigation and renamed Nutrition.
**Stopped before implementation and taken to the owner.**

**Owner ruling (2026-07-19): keep the canonical nine** — *"build the shell around
the existing canonical navigation; this task is about implementing the shell, not
redesigning the information architecture."* `nav-bar.tsx` is byte-unchanged.

---

## What was built

- `client/src/components/layout/app-shell.tsx` — the shell, NAMED. Was ~50 lines
  of inline JSX in `ProtectedRoute`; moved, not rewritten.
- **Header permanence** — the defect. `/compare`, `/import-recipe` and all 13
  `/admin/*` pages had no header at all, and the slot was empty during every
  loading state, lazy-chunk suspense and caught error. The shell now renders the
  canonical header by default and a page's own replaces it. **No page file
  changed.**
- `companion-open.ts` — the Companion entry in the header, asking via
  `tha:open-companion` rather than owning the panel's state.
- `shell-slots.tsx` — `RoomActions`, the desktop contextual rail.
  ⚠️ **authored and unadopted**, declared in the adoption register.

## Verified

- Browser: **12/12 (6 routes × 2 viewports), 0 page errors**.
- `typecheck:ci`: 16 pre-existing regressions, **0 introduced** (proven by
  stash-comparison).
- `build`: 🟢, same 4 pre-existing warnings.
- `adoption:check`: **83 passed** (was 80); 9 failures all pre-existing.

## Near-miss to remember

Scoping a `git stash` by pathspec still stashed **COMM2's uncommitted
`| "orchard"` realm addition**, because it lives in a file NAV1 also edits.
Restored and verified. **Do not `git stash` in a tree holding another session's
uncommitted work.**

---

## Next action

Await the full `npm test` result, record it in the report, then commit and push.
Two earlier attempts produced unusable logs (first truncated to the final suite;
second killed when its launching shell returned) — **neither was reported as a
result**. If interrupted again: re-run `npm test` capturing full output, and do
not claim a suite result without a complete log.
