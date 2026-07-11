# INTQ6 — Benchmark Household World — Implementation Report

**Workstream:** INTQ6
**Date:** 2026-07-05
**Branch:** `int1-intelligence-platform`
**Status:** Delivered — the permanent deterministic Benchmark Household World (10 households, real "(Auto)" accounts, DEV-only), the seeder + reset mechanism, the Admin → Benchmark Households page (view / inspect / impersonate / reset / run), benchmark-world run integration through the one Companion seam, and documentation.

---

## 1. Mission & scope delivered

Create the permanent deterministic Benchmark Household World used by the Companion Intelligence
Benchmark, in the DEV environment only.

| Scope item | Status | Where |
|---|---|---|
| 10 permanent Benchmark Households in DEV | ✅ | `server/benchmark/world-fixtures.ts` (`BW01`–`BW10`, world v1.0.0) |
| Real THA accounts, "Name (Auto)" convention | ✅ | 17 accounts (e.g. John Harris (Auto), Emma Carter (Auto)), deterministic usernames `<first>.<last>.auto@benchmark.thehealthyapples.dev` |
| Realistic profile / members / ages / diets / allergies / goals / budget / cooking time / favourites / dislikes / pantry / cookbook / planner / shopping / diary | ✅ | Per-household fixtures (see §3) seeded through existing write paths |
| Lifestyle / shopping habits / cooking confidence / kitchen equipment | ✅ (honestly) | Stored where a schema column exists (budget, cook-time, dislikes…); the rest is fixture **persona narrative** shown on the admin detail view and deliberately NOT written to any store (no parallel schema — questions about them are honest gaps) |
| Realistic Companion history where appropriate | ✅ (honestly) | EL1 evidence events + derived learning signals are seeded through the canonical store/detector. Fabricated conversation turns are deliberately NOT seeded — a synthetic assistant transcript would be a second Companion voice (CPA1); genuine history accrues from real runs/impersonation |
| Deterministic and resettable | ✅ | Wipe-then-reseed is total; verified: two consecutive resets produce identical content counts |
| Permanent Benchmark Household ID | ✅ | `BW01`–`BW10` + deterministic usernames (serial row ids are explicitly not the contract) |
| Stable between benchmark runs | ✅ | Runs are read-only through the seam (writes are unconfirmed proposals); run endpoint resets first by default |
| Deliberate "known gaps" | ✅ | Every fixture declares canonical absences (e.g. BW01 no next-week plan; BW08 no peanut record; BW10 near-total gap generator) |
| Sufficient evidence for reasoning & learning | ✅ | BW03/BW05/BW06/BW07 each clear the EL1 detection bar (≥3 consistent events on one dimension) → genuine `household_learning_signals` rows; sparser households deliberately stay below it |
| Admin page: view / inspect / impersonate / reset / run (one, multiple, all) | ✅ | `/admin/benchmark-households` + `/api/admin/benchmark-households/*` |
| Do not modify production data | ✅ | `assertBenchmarkWorldAllowed()` refuses when `NODE_ENV === "production"` (no override); wipe additionally scoped to ids resolved from benchmark usernames |
| Do not change Companion behaviour | ✅ | Zero changes to the gateway, resolver, handlers, or scoring; the only engine change is the additive `worldMode: "benchmark-world"` label |
| Do not duplicate Intelligence Platform functionality | ✅ | World code is fixtures + seeding + a thin admin surface; execution/scoring stays in the INTQ4 engine behind `processUserTurn` |
| Documentation | ✅ | `docs/intelligence/benchmark/BENCHMARK_HOUSEHOLD_WORLD.md` + cross-reference note in the framework `README.md` |

## 2. Architecture

### Two worlds, one invariant

The framework's six certification fixtures (`BENCHMARK_HOUSEHOLDS.md`, disposable DB, fixed row ids,
bundle component `households`) are untouched. The World is **operational infrastructure**: permanent,
resettable DEV households for admin-triggered runs and impersonation. Runs against it are stamped
`worldMode: "benchmark-world"` + `householdLabel: "BWxx"`, so they are never conflated with
certification scores. Both worlds share the framework's core discipline: a benchmark household **is an
ordinary household** (real `users`/`households`/`household_members`/`household_eaters` rows) seeded
through the platform's existing write paths — no parallel schema, no second identity space.

### Module layout

| File | Responsibility |
|---|---|
| `server/benchmark/world-fixtures.ts` | Canonical fixtures: types + the ten households + `BENCHMARK_WORLD_VERSION` ("1.0.0"). Pure data, no DB imports |
| `server/benchmark/world-seeder.ts` | `seedBenchmarkWorld` / `resetBenchmarkHousehold` / `listBenchmarkHouseholdStates` / `getBenchmarkHouseholdDetail` / `resolveBenchmarkOwner`; DEV guard |
| `server/benchmark/index.ts` | The single public API surface the routes consume |
| `server/routes.ts` (INTQ6 block) | Admin-guarded + DEV-guarded routes: list, detail, seed, reset, impersonate, stop-impersonation, run-benchmark; all mutations audit-logged |
| `client/src/pages/admin-benchmark-households-page.tsx` | Admin → Benchmark Households page |
| `client/src/components/benchmark-impersonation-banner.tsx` | App-level "Return to admin" banner (visible on every surface, incl. the onboarding redirect BW10 triggers) |
| `server/tests/benchmark/types.ts`, `runner.ts` | Additive `worldMode: "benchmark-world"` union member |

### Seeding & reset (deterministic by construction)

`resetBenchmarkHousehold(id)`:
1. **Ensure accounts** by deterministic username (`storage.createUser` + scrypt `hashPassword`); canonical
   profile/flags applied (the beta/verified flags mirror `createDemoUser`'s pattern — the register endpoint is
   closed in dev and sends real emails). Shared dev password, `BENCHMARK_WORLD_PASSWORD`-overridable.
2. **Ensure household** via `storage.createHouseholdForUser`; partner account attached as an active member.
3. **Scoped wipe** of all household- and account-scoped rows (planner, eaters, pantry, cookbook + nutrition/allergen/diet
   rows, shopping + attribution, extras, basket, freezer, diary days/entries/metrics, preferences, streaks, trends,
   savings, usage, activity, conversations → cascade threads/turns/feedback/proposals, opportunity deliveries, EL1
   events + signals) — the same direct-delete pattern `storage.cleanupDemoUser` establishes, scoped to resolved ids only.
4. **Reseed** through ordinary storage methods: preferences → eaters (`syncMembersAsEaters` + child eaters with hard
   restrictions) → pantry → cookbook meals → planner (canonical `createPlannerWeeks` + entries) → shopping list →
   diary (entries + metrics at reset-relative `dayOffset`s) → EL1 evidence via `evidenceLearningStore.recordEvent`
   with clock-relative `occurredAt`, then signals derived by the **canonical** `detectPatterns` — the seeder contains
   no pattern maths of its own.
5. Stamp `benchmark_world:<id>:last_reset_at` + `benchmark_world:version` in site settings.

Recency is expressed as `dayOffset` from the reset instant (the World's equivalent of the framework's
`benchmarkClock` D−n convention): canonical state is "as of the last reset", and the run endpoint resets by default
before executing.

### Impersonation

`POST /api/admin/benchmark-households/:id/impersonate` re-logs the admin's session in as the household owner
(passport `keepSessionInfo`), stashing the admin's id on the session; every surface then shows exactly what the
benchmark user sees. A fixed banner (rendered only when the session carries an active impersonation) returns to the
admin via `POST /api/benchmark-impersonation/stop`. Both directions are audit-logged; the stop route requires only
the session proof (the acting user is by definition not an admin while impersonating).

### Running the benchmark against the World

`POST /api/admin/benchmark-households/run-benchmark { mode: quick|full, households: "all" | ["BW03", …] }` —
for each selected household: reset (default), resolve the owner, build the INTQ4 one-seam
`makeCompanionTurnRunner(owner, personality)`, execute `runBenchmark` with `worldMode: "benchmark-world"` and
`householdLabel: BWxx`, and `saveRun` into the same append-only history the Intelligence Benchmark dashboard reads.
One artefact per household; the response returns per-household headline/verdict summaries and the page links to the
dashboard for full breakdowns. Baseline comparison is deliberately `null` for world runs (cross-household baselines
would be meaningless); per-household trend comparison is a bounded follow-on.

## 3. The ten households (summary)

| ID | Archetype | Household (owner) | Signature facts | Signature known gaps |
|---|---|---|---|---|
| BW01 | Standard Family | Harris Family (John Harris (Auto)) + partner, 2 children (10, 7) | Full week-1 dinner plan, 10 meals, 20 pantry, 12 diary/7d | No next-week plan; no goals; no allergies |
| BW02 | Busy Family | Carter Family (Emma Carter (Auto)) + partner, 3 children | 15–20 min meals, air fryer/freezer rotation, budget stores | Sparse diary (4 dinners); no metrics; empty weekend plan |
| BW03 | Vegetarian | Patel Household (Anita Patel (Auto)) + partner | Hard meat/fish exclusion; paneer learning signal; protein-variety goal | Vegetarian ≠ vegan; diet ≠ allergy; no numeric goal |
| BW04 | Vegan | Reeves Household (Daniel Reeves (Auto)) + partner | HARD vegan (incl. honey); 16 diverse diary entries; legume pantry | No in-app shopping list (market shoppers); no weight goal |
| BW05 | Mediterranean | Rossi Household (Sofia Rossi (Auto)) + partner | Heart-health goal; oily-fish signal; premium budget | Goal has no numeric target; Saturday unplanned |
| BW06 | Muscle Building | Marcus Webb (Auto), solo | 2800 kcal gain goal; 35 diary entries/14d; bounded UPWARD weight trend 77.5→78.4 kg; meal-prep signal | No protein-gram target; Thu–Sun unplanned; lives alone |
| BW07 | Weight Loss | Laura Bennett (Auto), solo | 1600 kcal lose goal; 24 entries/14d; bounded DOWNWARD trend 72.6→71.2 kg; chickpea signal | Fibre goal has no gram target; weekend unplanned |
| BW08 | Allergy | Okafor Family (Grace Okafor (Auto)) + partner, child (6) | Child eater with HARD tree-nut + sesame restrictions; all content allergen-safe; adult soft mushroom dislike | No peanut record (legume ≠ tree nut); dislike ≠ allergy; Friday unplanned |
| BW09 | Elderly Couple | Whitfield Household (Arthur Whitfield (Auto)) + partner | Main meal at lunch; fibre/less-salt goals; budget; traditional meals | No metrics at all; evenings deliberately empty; no numeric salt target |
| BW10 | New User / Cold Start | Nadia Ali (Auto), onboarding incomplete | Account + display name only | Everything else — the strongest honest-gap and onboarding-guidance test |

## 4. Verification performed

- **Type-check:** `tsc --noEmit` — 0 errors in every new/modified file (`server/benchmark/*`, routes block,
  engine type union, page, banner, App, nav). Remaining errors are pre-existing on this WIP branch in untouched files.
- **Seed end-to-end (real dev DB):** all 10 households created — real accounts, households, members, eaters (BW08's
  child carries `[tree nuts, sesame]` hard restrictions), pantry/meals/planner/shopping/diary/evidence counts exactly
  as fixtured; BW10 verified to stay empty (members=1, everything else 0).
- **Reset determinism:** two consecutive `resetBenchmarkHousehold("BW03")` runs produced **identical** content counts.
- **Learning signals:** BW03/BW05/BW06/BW07 each derive exactly 1 genuine signal through the canonical EL1 detector;
  all other households stay honestly below the detection bar.
- **Benchmark-world run:** a Quick run executed against BW01 through `processUserTurn` only — 10/10 questions scored,
  headline 74.5, honest-gap rate 1.0, 0 gates, verdict PARTIAL, artefact stamped `worldMode: "benchmark-world"`,
  household rollup `BW01 n=10`; saved to and read back from history. (The verification artefact was then removed —
  history stays reserved for real measurement runs.)
- **No regression:** `npm run test:companion-benchmark:validate` still PASSES; full `npm run build` (client + server
  bundle) succeeds.
- One fixture correction surfaced by the real write path: pantry categories are constraint-checked
  (`larder|fridge|freezer|household|fruit|pet`) — fixtures updated accordingly. Seeding through real write paths is
  exactly what caught this.

## 5. Compliance with the governing architecture

- **One Companion, one seam** — world runs execute exclusively through the INTQ4 `companion-turn.ts` adapter; the
  world code itself never imports the gateway, a handler, the intent engine, or the permission model. ✅
- **No second assistant / no duplicated conversation state** — no conversation rows are fabricated; Companion history
  is left to accrue genuinely. ✅
- **Honest gaps over fabrication** — known gaps are first-class canonical facts; unstorable persona facts are
  deliberately not written anywhere. ✅
- **Existing business services reused** — accounts, households, eaters, pantry, meals, planner, shopping, diary and
  preferences are all seeded via `storage`'s existing methods; evidence via the EL1 store's own API with signals from
  the EL1 detector. ✅
- **Source-of-truth ownership respected** — the only direct table writes are the scoped wipe (the established
  `cleanupDemoUser` teardown pattern) and the account-flag update (mirroring `createDemoUser`). ✅
- **Production safety** — every entry point (seeder and routes) hard-refuses in production; no override exists. ✅
- **Frozen, versioned world** — `BENCHMARK_WORLD_VERSION` 1.0.0; any fact change requires a bump
  (`BENCHMARK_HOUSEHOLD_WORLD.md` §3). ✅

## 6. Follow-on work (bounded, additive)

1. **Per-household baselines** — extend baseline selection to filter history by `householdLabel` so world runs gain
   regression deltas per household.
2. **Certification seed contract** — the six-fixture `households.v1.json` + disposable-DB provisioner
   (INTQ4 follow-on §9.1) remains open; the World does not replace it.
3. **Benchmark-100 expectation mapping** — the canonical questions' expectation records reference the six
   certification households; a curated mapping of ground-truth assertions onto `BW01`–`BW10` would let G1/G2/G4
   fire against world facts.
