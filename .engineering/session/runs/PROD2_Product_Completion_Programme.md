
# Session: PROD2_Product_Completion_Programme

| Field | Value |
|---|---|
| **Session ID** | `PROD2_Product_Completion_Programme` |
| **Rollback ID** | `rollback/PROD2-product-completion-programme-20260718` |
| **Start time** | 2026-07-18T20:15Z UTC |
| **Current stage** | Complete — awaiting owner review |

## Objective
Complete the existing THA product by connecting, hardening and finishing what already exists, using LAUNCH1 as the implementation backlog. No new platform capabilities, no Community, no Partner integrations, no new Intelligence Platforms, no payments, no architecture expansion.

## Rollback protection
- Annotated tag `rollback/PROD2-product-completion-programme-20260718` → `24e37d20` (ENGPROG1)
- Dirty-tree snapshot `stash@{0}` → `8cc31519778310f1df430f42493cb0b022c2005c`
  (`git stash create`/`store` — the working tree was NOT disturbed)
- **Coverage, stated per ROLLBACK §3:** the tag covers committed state only; the
  snapshot covers **all 82 modified tracked files and NONE of the 159 untracked
  files**. Untracked work belongs to concurrent sessions, was never touched, and
  is protected by neither. Pre-existing condition (ENGPROG1 Finding 1).
- Pre-delete snapshots outside the repo: `<scratchpad>/pre-delete-snapshot/`

## Relationship to PROD1 — no duplicate ownership
`docs/implementation/PROD1_PRODUCT_COMPLETION_PROGRAMME.md` already existed with
almost this title. PROD2 is its **successor, not a second owner**: PROD1 closed
the failed-load-renders-as-absence theme and listed 14 remaining gaps in its §8.
PROD2 took the decision-free remainder of that list plus LAUNCH1's backlog, and
re-opened nothing PROD1 owns.

## SCOPE LOCK (fixed before any file was edited)

**IN SCOPE — delivered**
- P1 Withdraw the **fabricated partners directory**: 12 invented health/nutrition
  businesses, all `example.com`, all `isActive: true`, under a REAL affiliate
  disclosure, reachable from two live menus.
- P2 Withdraw two **"Coming soon"** Nutrition tabs and one permanently-disabled
  diary control.
- P3 Retire two **dead rivals**: `list-page.tsx` (773 lines, no importer) and
  `TopBar` (185 lines, zero consumers).
- P4 **Production foundation**: pool `'error'` handler (an unhandled `'error'`
  event exits the process) + `connectionTimeoutMillis`.
- P5 **`tsconfig` target** — `lib: esnext` with no `target` defaulted to ES5;
  251 → 94 typecheck errors from one line.
- P6 **Open Food Facts honesty**: 9 sites on the staging instance → production;
  9 User-Agents naming a non-existent product → one honest string built from the
  app's own canonical support address.
- P7 **Adoption register compliance** in the same change.

**OUT OF SCOPE — held, nothing attempted**
Community · partner integrations · new Intelligence Platforms/capabilities ·
payments, pricing, entitlement enforcement, legal/GDPR authorship · PWA, native,
CoFID · architecture expansion (`registerRoutes`, `IStorage`).

**DELIBERATELY REFUSED (the important one).** Companion allergen safety —
LAUNCH1's #1 and the only finding with a path to physical harm. PROD2 measured it
worse than the audit did (`restriction-safety.ts` has **zero production consumers
anywhere**, not merely none in the conversation directory) and then **did not
half-build it**: `DiscoveryItem` carries no ingredients, so filtering needs the
port extended through three sources — a 1–2 week workstream. A partial filter
would imply a safety guarantee THA cannot deliver on the one path where being
wrong reaches an allergic child. Left fully open and handed over.

## Findings WITHDRAWN on verification (do not re-fix these)
1. **§3.14 "Freezer meals" false-sharing claim — FALSE POSITIVE.** `freezer_meals`
   HAS `household_id`; `getFreezerMeals` reads `where householdId = …`. All four
   claims in the panel verified household-scoped. **The panel is honest.** No change.
2. **§3.8 partners finding — TRUE but filed against the wrong surface.**
   `supermarket_links` holds 16 REAL rows and has no `website_url`/`is_active`
   column at all. The fabricated 12 are in `client/src/data/partners.ts`.
3. **§3.1 Blocker 3 migration head mismatch — DOWNGRADED, not a defect.**
   `runner.ts:3239` already documents it as cosmetic and self-resolving;
   `compareMigrationState` is set-based. Reproduced live and left alone.

## Verification
- `adoption:check` **4 failed → 0 failed** (81 passed, 0 notices); every ceiling
  movement a TIGHTENING (raw `<button>` 538 → 524). No debt absorbed.
- `npx tsc --noEmit` **251 → 94**. `typecheck:ci` 20 → 18 regressions.
  **The 18 left are not this session's**: 3 from another session's uncommitted
  `shopping-read-port.ts`; 15 from an unbuilt explainer workstream whose spec
  files PROD2 refused to delete (see report §7.2).
- `NODE_ENV=production npm run build` exit 0. Bundle checked both ways: every
  withdrawn string ABSENT, every intended string PRESENT.
- 23 test suites run, **0 failures**. Full `npm test` NOT run — ~3.7 h vs a
  45-min CI timeout (LAUNCH1 §2.1 confirmed, not fixed).
- Pool fix proven by forcing the failure in BOTH directions: guarded pool logs
  and survives; an unguarded pool throws.
- **Gap disclosed:** no browser verification — Playwright's Chromium cannot
  launch here (`libglib-2.0.so.0` missing). Report §11 steps 1–3 close it.

## Files changed
14 files, **119 insertions / 1,116 deletions** (a 9:1 deletion ratio — LAUNCH1 §6
predicted exactly this: *"Every item below is a deletion or a hiding, not a build"*).
No schema, no migration, no write path, no route added, no `server/intelligence/**`.

## Next action
Owner to review `docs/implementation/PROD2_PRODUCT_COMPLETION_PROGRAMME.md`.
Top three recommendations, none implemented: (1) Companion allergen safety;
(2) parallelise `npm test` so CI can complete at all; (3) an owner decision on
the unbuilt explainer workstream — build the explainers or retire the spec —
which closes the last 15 typecheck regressions.
