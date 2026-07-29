# Change report — uncommitted work on `claude-work`

**Date:** 2026-07-25
**Branch:** `claude-work` (up to date with `origin/claude-work`)
**Baseline commit:** `3cfc1f1b` — *ASSETLIB — record the asset library GitHub publication*
**Scope:** read-only inspection of the working tree. Nothing was modified, staged,
committed, pushed, migrated or deployed.

---

## Summary

13 modified files (+2,060 / −656), 13 untracked paths. That headline is misleading:
**97% of the line change sits in two files** (`larder-room.css`, `larder-room.tsx`).
The remainder is comment-only doc-path cleanup and session bookkeeping.

---

## Group 1 — Documentation path corrections (8 files, comment-only)

- `shared/schema.ts`
- `server/migrations/runner.ts`
- `server/routes.ts`
- `client/src/components/TrialBanner.tsx`
- `shared/cookbook/curation.ts`
- `shared/nutrition/household-nutrition.ts`
- `server/tests/test-mat1-registry-conformance.ts`
- `server/tests/test-planner-continuous-timeline.ts`

Each is exactly one line, inside a comment, updating a doc reference to a subfoldered
path (`docs/implementation/PLANNER_CONTINUOUS_TIMELINE.md` →
`docs/implementation/planner/…`). All five renamed targets were verified to exist on
disk. Trailing cleanup from an already-committed docs reorganisation. Zero executable
change.

## Group 2 — Living Larder room rebuild (the real work)

| File | Change |
|---|---|
| `client/src/pages/larder-room.css` | 316 → 1,446 lines — modelled room: plaster wall, casement, worktop, fitted run, flagstone floor |
| `client/src/pages/larder-room.tsx` | +617 / −440 — category-first composition |
| `client/src/pages/larder-shelves.ts` | **new**, 233 lines — pure presentation-only shelf vocabulary, derives shelves from the existing Domain 2 resolver; owns no data |
| `client/src/components/layout/app-shell.tsx` | +54 — new `ROOMS_OWN_THRESHOLD` set; `pantry` ground `"room"` → `"none"`; extracted/exported `resolveRoomExposure` |
| `client/src/components/layout/orchard-backdrop.tsx` | +59 — new `<OrchardCasement />`, reuses the existing `/orchard.webp` asset and `--orchard-exposure-e2` token |

Presentation only, on the evidence:

- `useQuery` count unchanged (3 → 3); zero `useMutation` in both the HEAD and working
  versions.
- No added or removed line in `larder-room.tsx` touches `/api/`, `queryKey` or
  `apiRequest`.
- Six `data-testid`s removed (`larder-tagline`, `lardr-appliance-toggle-fruit`,
  `lardr-appliance-toggle-larder`, `lardr-area-fruit`, `lardr-area-larder`,
  `lardr-status-empty`). A repo-wide grep found **no other references** to any of
  them, so no test or selector breaks.
- Six added (`lardr-room-name`, `lardr-run`, `lardr-shelf-back`, `lardr-wall`,
  `lardr-wall-empty`, `lardr-working-wall`).
- No import cycle from the new `app-shell` export: `larder-room.tsx` imports
  `resolveRoomExposure` from `app-shell.tsx`, and `app-shell.tsx` does not import
  `larder-room`.

## Group 3 — Session bookkeeping

`.engineering/session/CURRENT.md` — one-line heartbeat timestamp
(`2026-07-25T20:02:56Z` → `2026-07-25T22:17:23Z`), plus 3 untracked run files under
`.engineering/session/runs/`.

---

## Schema & migration changes — none, and no data impact

The clearest finding of the review. Both schema-adjacent files changed by exactly one
line, and both changes are inside comments:

- **`shared/schema.ts:463`** — a doc URL in the JSDoc above `weekNumber`. The column
  definition (`integer("week_number").notNull()`) is byte-identical.
- **`server/migrations/runner.ts:3697`** — a doc URL in the header comment of the
  existing PLANNER1 block. **No entry was added to the `MIGRATIONS` array.**

No table, column, type, index, constraint or default changed. Nothing to push, nothing
to backfill, no `db:push` required, and the migration ledger is untouched.

---

## Files that should not be committed

### Definitely exclude — 6 disposable scripts (218 lines)

```
scripts/_tmp-larder-shot.ts      scripts/_tmp-larder6-shot.ts
scripts/_tmp-larder6-diag.ts     scripts/_tmp-larder6b-shot.ts
scripts/_tmp-larder6-diag2.ts    scripts/_tmp-larder6-diag3.ts
```

None is referenced by `package.json` or any source file, and **none is covered by
`.gitignore`** (confirmed with `git check-ignore`) — so a `git add -A` sweeps them in.

### Exclude on size — 47 MB of screenshots

`docs/implementation/evidence/2026-07-24-larder-category-first/` holds 20 PNGs, several
near 4 MB each. Committing them puts 47 MB into git history permanently, where it cannot
be removed without a history rewrite. The `-viewport` variants duplicate the full-page
shots.

### Judgement call — 2 orphaned scripts (216 lines)

`scripts/capture-larder-category-first.ts` and `scripts/verify-larder-category-first.ts`
look intentional rather than throwaway, but neither is wired into `package.json`, so as
committed they would be orphaned. Either add npm script entries or drop them.

---

## Were tests run? — No, and the work is explicitly mid-flight

All three run files show the verification checkpoint **unticked**:

- `LARDER6_North_Star_Implementation.md` —
  `[ ] Verification (typecheck · build · asset verifier · screenshots)`.
  Last checkpoint reads *"root defect diagnosed; rebuild begun"*; next action is
  *"Rebuild `larder-room.css` / `larder-room.tsx` as one volume"*.
- `LARDER_CATEGORY_FIRST_Living_Larder_Evolution.md` —
  `[ ] Verification (verify:living-home-assets, typecheck, build, targeted suites) run`.
- `LIVING_LARDER_Canonical_Experience_Refinement.md` —
  `[ ] Verify (typecheck · build · asset verifier · targeted tests · screenshots)`.

Corroborating this, **all three promised implementation reports are absent** from
`docs/implementation/`:

```
MISS docs/implementation/LIVING_LARDER_CANONICAL_EXPERIENCE_REFINEMENT.md
MISS docs/implementation/LARDER6_NORTH_STAR_IMPLEMENTATION.md
MISS docs/implementation/2026-07-24-larder-category-first-implementation.md
```

`npm run typecheck`, `npm run build` and the test suite were **not** run as part of this
review — that was outside the read-only scope requested.

---

## Deployment risk

1. **Highest risk: this is an unfinished rebuild, not a completed feature.**
   `LARDER6`'s own notes record a root defect where `.lardr-room` collapsed to 820 px
   against 2,093 px of content with `overflow: clip` hiding the rest — *"the worktop,
   the fitted run, the floor and the door were rendered but unreachable."* The rebuild
   that fixes it is in progress. Nothing here should reach production.
2. **`pantry: "room"` → `"none"`** in `ROOM_GROUND` removes the shell-provided ground
   plane from the Larder. Correct only if the 1,446-line CSS covers every viewport;
   unverified, and a gap shows as bare canvas behind the room.
3. **`client/src/index.css` was never touched**, though `LARDER6` lists it as needing
   the `.lardr-dock` retirement — the old floating dock styles may still be live against
   a room that no longer expects them.
4. **Repo weight** — the 47 MB of evidence inflates every clone and CI checkout from
   here on.
5. **Low risk** — Groups 1 and 3 are inert and could be committed separately and safely
   at any time.

---

## Suggested split

The 8 doc-path files are a clean, zero-risk standalone commit. The Larder work should
stay uncommitted until the rebuild finishes and verification runs.
