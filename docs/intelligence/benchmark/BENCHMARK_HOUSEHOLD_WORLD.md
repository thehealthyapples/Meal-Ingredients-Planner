# THA Benchmark Household World

**Status:** OPERATIONAL INFRASTRUCTURE — the permanent, deterministic DEV world the Companion Intelligence Benchmark runs against.
**Established:** 2026-07-05 (workstream `INTQ6`). **World version:** `1.0.0` (`server/benchmark/world-fixtures.ts` → `BENCHMARK_WORLD_VERSION`).
**Part of:** the benchmark framework directory ([`README.md`](./README.md)); serves [`BENCHMARK_EXECUTION_PROCESS.md`](./BENCHMARK_EXECUTION_PROCESS.md) and the INTQ4 execution platform.

---

## 1. WHAT THIS IS — AND HOW IT RELATES TO THE SIX CERTIFICATION FIXTURES

Two "household worlds" exist by design, with different jobs:

| | Six certification fixtures | **Benchmark Household World (this doc)** |
|---|---|---|
| Defined by | [`BENCHMARK_HOUSEHOLDS.md`](./BENCHMARK_HOUSEHOLDS.md) (bundle component `households`) | `server/benchmark/world-fixtures.ts` (INTQ6) |
| Lives in | a **disposable database** provisioned per run, dropped at teardown | the **permanent DEV database**, always present |
| Identity | fixed row IDs (`9001`–`9006`) | permanent Benchmark Household IDs **`BW01`–`BW10`** + deterministic account usernames |
| Used for | Certification runs (strict preconditions) | day-to-day admin-triggered Quick/Full runs, impersonation, manual exploration |
| Run stamp | `worldMode: "deterministic-households"` | `worldMode: "benchmark-world"` |

The World does **not** change the frozen `households` bundle component and its scores are never conflated with
certification scores — every artefact carries its `worldMode` and per-run `householdLabel` (`BWxx`).

The invariant is shared: a benchmark household **is an ordinary THA household** — real accounts, real
`households`/`household_members`/`household_eaters` rows, seeded exclusively through the platform's existing write
paths. There is no parallel schema and no second identity space.

## 2. THE TEN HOUSEHOLDS

Real accounts follow the naming convention **"Name (Auto)"** (benchmark accounts, not test throwaways), with
deterministic usernames `<first>.<last>.auto@benchmark.thehealthyapples.dev` and one shared dev password
(`BENCHMARK_WORLD_PASSWORD`, default in `world-fixtures.ts`).

| ID | Archetype | Household | Owner account | Primary axis |
|---|---|---|---|---|
| `BW01` | Standard Family | Harris Family (Auto) | John Harris (Auto) | Baseline routing; "this week vs next week" gap pair |
| `BW02` | Busy Family | Carter Family (Auto) | Emma Carter (Auto) | Time pressure; sparse diary (thin-data honesty) |
| `BW03` | Vegetarian Household | Patel Household (Auto) | Anita Patel (Auto) | Exclusion diet ≠ allergy; protein variety; paneer signal |
| `BW04` | Vegan Household | Reeves Household (Auto) | Daniel Reeves (Auto) | HARD vegan enforcement; plant diversity; no shopping list |
| `BW05` | Mediterranean Household | Rossi Household (Auto) | Sofia Rossi (Auto) | Diet pattern (not exclusion); goal with no numeric target |
| `BW06` | Muscle Building | Marcus Webb (Auto) | Marcus Webb (Auto) | Dense diary; bounded UPWARD weight trend; meal-prep signal |
| `BW07` | Weight Loss | Laura Bennett (Auto) | Laura Bennett (Auto) | Dense diary; bounded DOWNWARD weight trend; fibre goal |
| `BW08` | Allergy Household | Okafor Family (Auto) | Grace Okafor (Auto) | HARD tree-nut + sesame allergy (child eater); safety gates |
| `BW09` | Elderly Couple | Whitfield Household (Auto) | Arthur Whitfield (Auto) | Traditional lunch-main pattern; no metrics; budget |
| `BW10` | New User / Cold Start | Nadia Ali (Auto) | Nadia Ali (Auto) | Near-total honest-gap generator; onboarding guidance |

Each fixture specifies: accounts and members, eaters (with per-eater hard restrictions), profile + preferences,
pantry, cookbook meals, planner entries, shopping list, diary entries + metrics, EL1 evidence events, a persona
narrative, and **known gaps**.

### Known gaps are canonical facts

Every household declares deliberate absences (e.g. BW01 has no plan for next week; BW08 has no peanut record; BW10
has almost nothing). A question about a known gap **must** produce an honest gap — they are the fabrication traps.
Facts the platform has no schema column for (kitchen equipment, cooking confidence narrative) are kept as fixture
narrative shown on the admin detail view and are **deliberately not written to any store** — the world never invents
a parallel store, so questions about them are honest gaps too.

### Evidence & learning

Evidence events are appended through the canonical EL1 store (`evidence-learning-store.ts`) with clock-relative
`occurredAt`, and learning signals are then derived by the canonical detector (`framework.ts detectPatterns`) — the
seeder invents no pattern maths. Households BW03/BW05/BW06/BW07 each carry one dimension with ≥3 consistent events,
so a genuine `household_learning_signals` row exists for Companion reasoning to cite; sparser households deliberately
stay below the detection bar.

## 3. DETERMINISM CONTRACT

- **Frozen content.** `BENCHMARK_WORLD_VERSION` pins the fixtures. Changing ANY present-or-absent fact is a breaking
  change: bump the version (mirror of [`README.md`](./README.md) §4 discipline). Adding a new household nobody's
  questions use is additive.
- **Reset-relative recency.** Diary/planner/evidence timestamps are `dayOffset`s from the reset instant (the same
  D−n convention as the certification fixtures' `benchmarkClock`). Canonical state is "as of the last reset" —
  **reset before a run** (the run endpoint does this by default) for an identical world every time.
- **Stable identity.** The permanent ID is `BWxx` plus the deterministic usernames. Database row ids are serial and
  not part of the contract; every consumer resolves a household by username lookup, never by hard-coded row id.
- **Stability between runs.** Benchmark questions execute read-only through `processUserTurn`; write intents produce
  proposals that are never confirmed, so a run does not mutate the world. Impersonation sessions CAN mutate it —
  reset the household afterwards.

## 4. ENVIRONMENT GUARD

The world is **DEV-only**. Every seeder entry point and every admin route asserts
`NODE_ENV !== "production"` (`server/benchmark/world-seeder.ts` → `assertBenchmarkWorldAllowed`) and refuses
otherwise. Production data can never be touched: the seed/reset wipe is additionally scoped to the ids resolved from
the deterministic benchmark usernames — it cannot reach any other account.

## 5. ADMIN SURFACE

**Admin → Benchmark Households** (`/admin/benchmark-households`, apple-menu link; admin-only routes under
`/api/admin/benchmark-households`):

- **View** all ten households: seeded state, owner account, last reset.
- **Inspect** one: canonical fixture (accounts, eaters, persona, known gaps) side-by-side with live database counts.
- **Impersonate** one: the admin session becomes the household owner (audit-logged); a fixed banner offers
  one-click "Return to admin" (`/api/benchmark-impersonation/stop`).
- **Reset** one household, or **seed/reset the whole world**.
- **Run the Intelligence Benchmark** (Quick/Full) against **one / multiple / all** households: each selected
  household is reset, then the INTQ4 engine executes every selected question as that household's owner **through
  the one Companion seam** (`conversationGateway.processUserTurn` via `makeCompanionTurnRunner`), producing one
  artefact per household stamped `worldMode: "benchmark-world"`, `householdLabel: "BWxx"`, saved into the same
  append-only history the Intelligence Benchmark dashboard reads.

No scoring, routing, or conversation logic exists in the world code — it is fixtures + seeding + a thin admin
surface over the existing INTQ4 engine.

## 6. FILES

| File | Role |
|---|---|
| `server/benchmark/world-fixtures.ts` | Canonical fixtures — the single authored source of truth (this doc's §2 table is its summary) |
| `server/benchmark/world-seeder.ts` | Seed / reset / state / detail / owner resolution; environment guard |
| `server/benchmark/index.ts` | Public API surface consumed by the admin routes |
| `server/routes.ts` (INTQ6 block) | Admin-guarded, DEV-guarded HTTP surface incl. impersonation + run-benchmark |
| `client/src/pages/admin-benchmark-households-page.tsx` | The Admin → Benchmark Households page |
| `client/src/components/benchmark-impersonation-banner.tsx` | App-level "return to admin" banner |
| `server/tests/benchmark/types.ts` / `runner.ts` | `worldMode: "benchmark-world"` (additive) |
