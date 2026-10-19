# INT29 / INT30 — Discovery Handler & Port Type-Safety Fix

**Status:** Implemented and verified. Local commit only — not pushed, not deployed.
**Scope:** `server/intelligence/handlers/household-discovery-handler.ts`,
`server/intelligence/handlers/shopping-discovery-port.ts`,
`server/intelligence/services/shopping-discovery-engine.ts`,
`server/tests/test-intelligence-shopping-discovery-binding.ts`.

## Why this piece of work

This session's brief was to advance the app toward a usable first release without
touching live infrastructure, production data, or anyone else's in-progress work,
and without needing a product/framework decision. `docs/architecture/THA_MASTER_EVOLUTION_ROADMAP.md`
turned out to be significantly stale against the current repository (it cites files —
`nutrition-variety.ts`, `nutrition-benefit-library.ts` — that no longer exist, and
describes the Tier-4 planner shell-recovery matcher as "built but unwired" when it has
in fact been fully wired and tested for some time). Rather than plan against a document
the repository itself contradicts, this session verified gaps directly against the
current code and its own type checker (`npm run typecheck` / `npx tsc --noEmit`).

That surfaced two real, currently-shipping defects in the Companion's Household and
Shopping **discovery** capabilities (`household-discovery/search` and
`shopping-discovery/search` — the intents behind "who's in my household?" and "what's
on my shopping list?"). Both capabilities are live and registered (confirmed via
`server/intelligence/index.ts`, the capability registry, and their existing binding
tests — 23 live capabilities today), so this is a correctness fix to shipping product
surface, not a change to dead code.

## What was wrong

1. **`household-discovery-handler.ts`** imported `CapabilityHandler` from
   `../capability-registry.js` and `IntelligenceContext` from
   `../intelligence-platform.js`. Neither module exports those names — every sibling
   discovery handler (pantry, diary, meal, nutrition, planner, shopping) correctly
   imports both, together with `Intent`, from `../types.js`. This is a leftover from
   an earlier refactor that consolidated these types into `types.js` and missed this
   one file. Because these are `import type` (erased before runtime), the app itself
   never crashed — but `npm run typecheck` has been red on this file.

2. **`shopping-discovery-port.ts` / `shopping-discovery-engine.ts`** declared the
   shopping list's amount field as `quantity: string`, fed by a minimal storage
   interface (`ShoppingDiscoveryStorage`) that also claimed `quantity: string | null`.
   The real column (`shared/schema.ts` → `shoppingList.quantity`) is a `notNull`
   `integer` defaulting to `1` — a legacy per-row pack-count that the rest of the app
   (`client/src/pages/shopping-workspace-page.tsx`, `unit-display.ts`) does not use to
   describe an item's amount to a household. The value a person actually sees for "how
   much" is `quantityValue` (a nullable real number) together with `unit` — the same
   pair the shopping workspace's own `formatItemDisplay()` consumes. So the port's
   contract was not just mistyped, it was pointed at the wrong column: wiring the real
   `DatabaseStorage` behind it failed to compile (`Type 'number' is not assignable to
   type 'string'`), and had that mismatch been silenced instead of fixed, the Companion
   would have had no honest field to report an item's actual amount from.

## What changed

- `household-discovery-handler.ts`: both types now come from `../types.js`, matching
  every other discovery handler. Pure type-only change — zero runtime behaviour
  difference (verified: `import type` is erased at build; the compiled output for this
  file is unaffected).
- `shopping-discovery-port.ts`: `ShoppingDiscoveryItem.quantity: string` →
  `quantityValue: number | null`, documented as "the stored amount, or null when the
  household added the item with no amount specified" — an honest-gap, not a fabricated
  default (consistent with this codebase's own non-fabrication principle: several
  neighbouring fields already pass `null` through rather than inventing a value).
- `shopping-discovery-engine.ts`: `ShoppingDiscoveryStorage`'s declared return shape
  now matches `DatabaseStorage.getShoppingListItems()` (`quantityValue: number | null`
  instead of the fictitious `quantity: string | null`), and `discover()` passes
  `item.quantityValue` straight through instead of coercing it through `?? ""`.
- `test-intelligence-shopping-discovery-binding.ts` (existing regression suite, INT30):
  fixtures and assertions updated to the corrected field, plus **two new assertions**:
  the numeric amount survives end-to-end (`quantityValue === 500`, not the string
  `"500g"` the old fixtures fabricated), and a genuinely-unspecified amount comes back
  as `null` rather than a coerced `0` or `""`.

No application behaviour was live-broken by the "before" state — `import type` is
erased, and nothing currently wires the real `DatabaseStorage` behind
`ShoppingDiscoveryEngine` in a way that had been exercised (the compile error is what
caught it). This fix closes that gap before it does get wired to a real caller.

## Tests run

All runs used a **non-routable placeholder** `DATABASE_URL=postgresql://localhost:1/does-not-exist`
— never the repository's real (Neon-hosted) database. See "Remaining blocker" below for
why that placeholder was necessary at all.

| Check | Before | After |
|---|---|---|
| `npx tsc --noEmit` — errors in the two fixed production files | 2 errors (9 output lines) | **0** |
| `test-intelligence-household-discovery-binding.ts` (INT29, pre-existing) | not run pre-fix (no behaviour change expected; type-only) | **48 passed, 0 failed** |
| `test-intelligence-shopping-discovery-binding.ts` (INT30) | 41 passed, 0 failed (ran once to confirm the harness itself was safe to use) | **44 passed, 0 failed** (3 new) |
| `npm run build` (`tsx script/build.ts`) | — | **succeeds**, unchanged pre-existing warnings only (`import.meta`/cjs, chunk-size) |
| Full-repo `npx tsc --noEmit` diff, before vs. after | 107 output lines | 98 output lines — **only** the 9 targeted lines removed; every remaining line is byte-equivalent modulo TypeScript's own non-deterministic property-order printing in long inferred types |

No other file's typecheck status changed. `git status` was checked before and after:
only the four files listed above show as modified; every pre-existing dirty file
(Living Home/pantry/fridge imagery, Cookbook real-book work, Contact page, Admin
banner, `server/routes.ts`, `shared/normalize.ts`, `scripts/ci/typecheck-gate.ts`, the
new `.engineering/scripts/project-markdown-handoff.mjs` pair, etc.) is untouched and
unstaged by this session.

## Dirty-state preservation

Confirmed via `git status --short` before starting and again after every step. Nothing
was staged, committed, pushed, or reset. No production/staging system, database, or
secret was read, connected to, or modified — see below.

## Remaining blocker (for the next session, not fixed here)

This session was instructed not to inspect or connect to production databases or live
services. The repository's own `.env` `DATABASE_URL` points at a hosted Neon Postgres
instance with no visible separation between "development" and "production" — there is
no safe way from inside this session to confirm it is disposable, so it was treated as
off-limits entirely, including for read-only test runs.

That turned out to matter beyond just this fix: **every** `server/tests/*.ts` file —
including ones explicitly designed and commented to run "WITHOUT a live database" via
injected in-memory stubs (`test-intelligence-shopping-discovery-binding.ts` says so in
its own header) — currently throws `Error: DATABASE_URL must be set` at import time if
the variable is unset at all, before any test body runs. `server/db.ts` guards on
presence, not validity, of the connection string, so a syntactically-valid,
non-routable placeholder (`postgresql://localhost:1/does-not-exist`) satisfies the
guard and lets these DB-free tests run and fail closed if anything ever did try a real
query — which is exactly what this session used throughout, and is a reasonable
pattern for a CI/test environment to adopt permanently. **The one remaining piece of
work this session could not do safely on its own** is deciding and wiring a real
`TEST_DATABASE_URL`/CI convention so the next agent (or CI) doesn't have to improvise
that placeholder by hand, and so tests that *do* need a real database (most of
`server/tests/`) can run at all without the ambiguity this session hit.

## Single next action

**Decide and record what `DATABASE_URL` (or a separate `TEST_DATABASE_URL`) safely
means for automated test/CI runs in this repository** — e.g., confirm the current Neon
instance is a disposable dev/test database safe for agents to run tests against, or
provision a separate one and document it in `.env.example` — so future sessions can run
the full `npm test` suite (hundreds of `test:*` scripts currently gated on this) without
having to make the same conservative call this session made.
