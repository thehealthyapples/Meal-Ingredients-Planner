# KNOW3 — Bind Canonical Foods to Knowledge Foods — Implementation

**Date:** 2026-07-09
**Branch:** `int1-intelligence-platform`
**Risk:** 🔴 RED
**Reason:** Alters identity-domain data (`canonical_food.knowledge_food_slug`) and adds a seed-refusing gate to Domain 2.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-know3-canonical-knowledge-food-binding-20260709` → `17f1afd3729c0c4aec872cd3663f4208d790e8bd` |
| Working tree | Clean at start |
| This task's writes | `shared/canonical/knowledge-binding.ts` (new), `shared/canonical/foods.ts`, `shared/canonical/index.ts`, `shared/canonical/resolver.ts`, `server/lib/canonical-foods-gate.ts`, `server/cli/graduate-canonical-foods.ts`, `server/seeds/seed-canonical-food.ts`, `server/tests/test-canonical-knowledge-binding.ts` (new), `package.json`, this document |
| Rollback to committed state | `git checkout rollback/before-know3-canonical-knowledge-food-binding-20260709` |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md`
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (Domains 1 and 2)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md`
- [x] `docs/architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md`
- [x] `docs/architecture/NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`
- [x] `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`
- [x] `docs/implementation/KNOW1_FOOD_INTELLIGENCE_EXPANSION.md`, `KNOW2_KNOWLEDGE_FOOD_OWNERSHIP_CONVERGENCE.md`

---

## THE DEFECT, AND ITS MECHANISM

Sixty-three canonical foods carried `knowledgeFoodSlug: null`. Seven of them sat beside a
knowledge food of **exactly their own name**, with nothing joining the two.

The cause is a single line in the import gate. `reconcileFoodIdentity()` decides whether an
incoming draft would fork an existing identity by asking the canonical resolver what the
draft's name resolves to, and reading `knowledgeFoodSlug` off the result:

```ts
const isForeignIdentity = (res) =>
  res.matched && res.knowledgeFoodSlug && res.knowledgeFoodSlug !== foodIdentity.slug
    ? res.knowledgeFoodSlug : null;
```

For a canonical food that is **already bound**, that works. For one that is **not**, the
resolution succeeds but `knowledgeFoodSlug` is `null`, the `&&` short-circuits, and the draft
is judged to collide with nothing:

```
resolveCanonicalFood("tomato")     → matched, knowledgeFoodSlug "tomatoes"   ← seen
resolveCanonicalFood("grapefruit") → matched, knowledgeFoodSlug null         ← unseen
resolveCanonicalFood("ghee")       → matched, knowledgeFoodSlug null         ← unseen
```

So a draft named after an unbound canonical food promoted cleanly, a knowledge identity was
created, and nothing ever bound the two. All seven orphans are canonical foods that existed
*before* their knowledge twin arrived through that path — and all seven knowledge foods are
`GRADUATED_FOOD_SEED` rows, i.e. exactly the ones the NK6D importer created.

Nothing enforced the binding, so nothing noticed. This document repairs the seven, and makes
the omission unshippable.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  canonical_food.slug (Domain 2, one key space) and knowledge_foods.slug (Domain 1, one key
  space). `knowledge_food_slug` is a pointer from the first to the second. No third key space
  is introduced; food_variety keeps its own slug space and is addressed as `variety:<slug>`.

☑ One owner per fact
  Domain 2 (shared/canonical/foods.ts) owns the binding column. Domain 1
  (shared/knowledge/) owns the identity it points at. `knowledge-binding.ts` owns NEITHER —
  it reads both declared owners and reports. It has no store and writes nothing.
  Newly enforced: one knowledge food may be bound by at most ONE canonical identity. The DB
  has no unique constraint on `knowledge_food_slug`, so nothing else caught this.

☑ No duplicate entities
  No food is created. Seven existing rows gain a value in an existing column. The two
  ambiguous cases are refused precisely because binding them would duplicate an owner.

☑ No duplicate ownership
  The binding was already Domain 2's fact, declared but unenforced. It now has the same
  single owner and a running check. `resolveKnowledgeBinding()` is the only matcher.

☑ No duplicate state
  No user state is touched.

☑ Extends existing architecture
  Extends `validateCanonicalSeed()` — the existing refuse-to-seed integrity check that
  already enforces dangling FKs, alias uniqueness, family acyclicity and resolver
  collisions. Extends the existing gate's soft/hard signal split. Reuses the resolver's one
  normalisation (`ingredientKeyVariants`, exported from resolver.ts rather than re-written)
  so no second normalisation step exists — GOV2 Rule 5.

☑ Progressive enrichment where appropriate
  Knowledge entity. Identity (Level 1) already existed for all 312 canonical foods; the
  binding is the seam to Level 2/3 enrichment. Absent knowledge stays absent: 80 canonical
  identities have no knowledge food and are reported as gaps, never invented.

☑ Honest gaps over fabricated information
  Only identity-to-identity name equality binds. An alias is never evidence of identity, in
  either direction. 80 unmatched identities render as gaps. 2 ambiguous matches are refused
  and recorded with a stated reason. Nothing is guessed.

☑ No permanent synchronisation bridge
  None. `knowledge_food_slug` is a foreign-key pointer, not a copy: no fact is stored twice
  and no two stores must be kept in agreement. The audit reads; it never reconciles.

☑ Evolution over replacement
  No store is replaced. `canonical-foods-gate.ts` is amended, not superseded.
```

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Canonical Food Identity (SoT Register Domain 2). Reads Food Knowledge (Domain 1).
Declared SoT: shared/canonical/foods.ts → DB canonical_food
New store created? NO
Existing store extended? YES — 7 existing canonical_food rows gain a value in the existing
  `knowledge_food_slug` column. No column, table or entity is added.
Consumer created? NO
  shared/canonical/knowledge-binding.ts is an AUDITOR, not a consumer or an owner. It reads
  CANONICAL_SEED (Domain 2) and FOOD_SEED (Domain 1) and returns problems and warnings.
  It exposes no data to any runtime surface and performs no write.
```

---

## ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Canonical Food Identity → Food Knowledge binding (Domain 2 → Domain 1)

Current Canonical Owner:
  shared/canonical/foods.ts → DB canonical_food.knowledge_food_slug
  (SoT Register Domain 2; the identity it points at is Domain 1, shared/knowledge/)

Current Runtime Consumer(s):
  shared/canonical/resolver.ts (buildCanonicalIndex → CanonicalResolution.knowledgeFoodSlug)
  shared/canonical/food-report-adapter.ts (buildFoodReport)
  server/lib/food-report-evidence.ts (buildFoodReportEvidence, DB-backed)
  server/lib/canonical-foods-gate.ts (identity reconciliation)

Duplicate Owners Remaining:
  NONE

Duplicate State Remaining:
  NONE

Duplicate Workflows Remaining:
  NONE. The canonical→knowledge match runs in exactly one place
  (resolveKnowledgeBinding), over the resolver's single normalisation.

Current Convergence (%):
  Bindings: 99.3% — 271 of 273 bindable identities bound (312 foods + 68 varieties = 380
  identities; 80 have no knowledge food of that name, 27 varieties inherit their parent's,
  leaving 273 bindable). Before KNOW3: 264 of 273 = 96.7%. The 2 unbound are deferred with
  a recorded reason, not forgotten.

  Enforcement: 0% → 100%. The binding was declared and unenforced; validateCanonicalSeed()
  now refuses to seed while any of the four failure modes stands (missing binding,
  double-claimed knowledge food, unregistered ambiguity, stale deferral).

Target Convergence (%):
  99.3% for this workstream. 100% requires resolving the two deferrals, both of which are
  Domain 1 questions, not Domain 2 ones (see Scope Lock, SUGGESTION 1 and 2).

Next Planned Milestone:
  Resolve the knowledge-side `lentils` / `red-lentils` identity duplicate. That unblocks
  food:lentils. food:pasta is a settled editorial decision, not a defect.

Remaining Architectural Risks:
  Five bindings rest on editorial judgement the audit cannot verify by name equality
  (peas→garden-peas, strawberry→strawberries, blueberry→blueberries, wheat-pasta→pasta,
  button-mushroom→white-mushrooms). They are correct; they are also unverifiable by any
  deterministic matcher. They are printed as warnings on every seed rather than implied to
  have been checked.
```

---

## IMPLEMENTATION

### W1 — Measure before touching anything

312 canonical foods, 249 bound, 63 unbound. 610 knowledge foods (264 editorial, 346
graduated). Matching the 63 against the knowledge seed on **identity names only** yields:

| Outcome | Count |
|---|---|
| Exactly one knowledge food carries the name, unclaimed | **7** |
| Ambiguous — refused for human review | **2** |
| No knowledge food carries the name — an honest gap | **54** |

The first matcher I wrote was alias-tolerant, and it produced an eighth "match":
`pepper → red-pepper`. It is wrong, and instructively so. Canonical `pepper` is the bell
pepper plant — *all colours, one plant* — and its `red-pepper` **variety** already binds
knowledge `red-pepper`. The two share the alias "bell pepper". An alias-tolerant matcher
therefore:

1. gives the parent the red variety's facts (a fabricated claim), and
2. gives knowledge `red-pepper` a **second** canonical claimant (an owner-per-fact violation).

Both failures come from treating an alias as evidence of identity. GOV2 says an alias never
*creates* a second entity; it does not *establish* one either. The binder was rewritten to
match identity-to-identity only, and to use aliases for exactly one purpose: detecting
ambiguity. `pepper` is now correctly refused, and asserted so by test.

### W2 — Bind the seven

Each is identity-to-identity name equality, against an unclaimed knowledge food, and each
denotes the same real-world thing (the GOV2 scope test: *can these two names ever need to
disagree on a fact?* — no).

| Canonical food | → knowledge food | Facts it reaches |
|---|---|---|
| `grapefruit` | `grapefruit` | 3 nutrients, 2 benefits |
| `semi-skimmed-milk` | `semi-skimmed-milk` | 3 nutrients, 2 benefits |
| `plain-wheat-flour` | `plain-wheat-flour` | 3 nutrients, 2 benefits |
| `pearl-couscous` | `pearl-couscous` | 4 nutrients, 2 benefits |
| `wholewheat-pasta` | `wholewheat-pasta` | 4 nutrients, 2 benefits |
| `cacao-powder` | `cacao-powder` | 3 nutrients, 2 benefits |
| `kombucha` | `kombucha` | 2 nutrients, 2 benefits |
|  | **total** | **22 nutrient links, 14 benefit links** |

No knowledge food is claimed twice; all seven were unclaimed. All 54 gaps are left as gaps.

### W3 — Refuse the two that cannot be decided

`DEFERRED_KNOWLEDGE_BINDINGS` records a deliberate non-binding with its reason, so that a
refused match is distinguishable from a forgotten one. It has two entries, and the audit
re-derives both on every run — a deferral that no longer describes the data is a **problem**,
so the register cannot rot.

- **`food:lentils`** — the string "lentils" names *two* knowledge identities: `lentils`, and
  `red-lentils`, which carries it as an alias. That is a GOV2 Rule 3 conflict inside the
  knowledge seed, not a binding to pick. Worse, knowledge `lentils` declares the aliases
  "red lentils" / "green lentils" / "puy lentils" — the very identities that canonical
  `lentils`' four **varieties** already bind to. Binding the parent would give red-lentil
  facts a second owner. The knowledge-side duplicate must be resolved first.

- **`food:pasta`** — knowledge `pasta` is the fact owner for *wheat* pasta and is already
  bound by canonical `wheat-pasta` (NK6R Amendment 3). Canonical `pasta` is the deliberately
  type-unknown parent: its own seed comment says it "must not claim a plant it may not
  contain." Binding it would add a second claimant *and* assert durum-wheat facts of
  chickpea, lentil and pea pasta.

Neither was invented to satisfy a gate. Each is a real disagreement between two owners.

### W4 — Make the binding enforced, not declared

`validateCanonicalSeed()` — the check the seed runner already calls and **refuses to seed**
on — now carries `auditKnowledgeBindings()`. Four refusals:

1. A canonical identity a knowledge food of the same name exists for, with no binding declared.
2. One knowledge food bound by two canonical identities.
3. An ambiguous match with no reasoned entry in the register.
4. A register entry that no longer matches the seed (bound now, unmatched now, or drifted candidates).

A **variety** with a null binding is not unbound: `buildCanonicalIndex()` already falls back
to the parent's knowledge food (`v.knowledgeFoodSlug ?? base.knowledgeFoodSlug`). "Cherry
Tomato" is an alias of knowledge `tomatoes`, which canonical `tomato` binds. The audit reports
those 27 as `inherited`. Getting this wrong the first time produced 25 false demands for human
review — a validator that cries wolf is a validator that gets switched off.

### W5 — Close the blind spot at the source

`reconcileFoodIdentity()` now reads the resolution it was already computing for what
`isForeignIdentity()` discards: a canonical identity that matched but carries **no** binding.
That is not a fork — there is nothing to fork onto. It is the binding the draft owes.

The gate does **not** block. The draft is genuinely new knowledge, and blocking it would stall
a correct promotion. Instead:

- `GateResult.identity.requiredBinding` and `GraduationRecord.canonicalBinding` carry it.
- The reviewer is warned in prose.
- `npm run knowledge:graduate` prints the canonical edit beside the knowledge rows.
- `validateCanonicalSeed()` refuses until the edit lands or a reason is recorded.

The gate proposes; the seed disposes. Driven over `batch-001`, the gate now emits:

```
🟢 PROMOTE  sweet-pepper.yaml  →  3 nutrients, 2 benefits
      ⚠ alias "red pepper" also names existing "red-pepper" — review scope before promoting
      🔗 binding owed: canonical food "pepper" → knowledgeFoodSlug: "sweet-pepper"
```

That binding is correct, and the gate could not see it before. (Note the asymmetry, which is
deliberate: the gate resolves a draft name through **canonical** aliases, which Domain 2's
editorial owner declares; the binder refuses **knowledge** aliases as evidence, because they
are draft-authored. So the gate may propose a binding the binder will still send to review.
Neither fabricates; the human decides. `sweet-pepper` remains unpromoted — NK6P held it back.)

---

## DEFINITION OF DONE

**Success**
- Every canonical identity for which a same-named knowledge food exists is bound, or refused
  with a recorded reason. Measured: 271 bound, 2 deferred, 27 inherited, 80 honest gaps.
- No knowledge food has two canonical claimants.
- A future import cannot silently omit a binding: the gate names it, the seed refuses it.

**Must not break**
- No new food identity, no merged identity, no fabricated link.
- The gate's existing hard block on identity forks is unchanged (verified: `carrot`,
  `tomato`, `sweetcorn`, `fennel-bulb` still blocked).
- `buildFoodReport()` returns `null` for non-canonical slugs; the preparation guard holds.

**Manual test steps**
1. `npm run test:canonical-knowledge-binding` → 67 passed, 0 failed.
2. `npm run knowledge:graduate -- "docs/knowledge/canonical-foods/drafts/batch-001-core-everyday-vegetables/*.yaml"`
   → 1 promote / 25 existing / 4 blocked, and the promote prints `🔗 binding owed`. Nothing is written.
3. Delete `knowledgeFoodSlug: "kombucha"` from `shared/canonical/foods.ts` and run
   `npm run seed:canonical`. **Performed.** It refuses and exits 1 before any insert:
   ```
   Canonical seed validation failed — refusing to seed:
     • food "kombucha": knowledge_food "kombucha" carries this identity's name
       (matched on "kombucha") but no binding is declared. Set knowledgeFoodSlug:
       "kombucha", or record a reason in DEFERRED_KNOWLEDGE_BINDINGS.
   ```
   The database was re-read afterwards and was unchanged (362 rows, 44 bound).
4. `npm run seed:canonical` on an unmodified tree → validates, prints the five
   editorial-judgement warnings and the binding coverage, then upserts.

---

## DATA IMPACT

- **Reads existing data:** YES — `CANONICAL_SEED` (Domain 2) and `FOOD_SEED` (Domain 1).
- **Writes new data:** YES — 7 `canonical_food.knowledge_food_slug` values, written by the
  declared owner's own seed runner. No new row, column, table or entity.
- **Changes meaning of existing data:** NO. A binding is a pointer to an identity that already
  exists and already publishes its facts. No claim is authored, edited or re-stamped.
- **Requires backfill:** NO — **and no migration.** `knowledge_food_slug` already exists and
  `seed-canonical-food.ts` already upserts it (`knowledgeFoodSlug: sqlExcluded(...)`). That the
  correction is achievable by running the owner is the demonstration that the owner owns it.
  No `DELETE` or `UPDATE` is issued anywhere by hand.

**Live DB (dev/lower, `REPLIT_DEPLOYMENT` unset; production untouched, nothing seeded):**

```
canonical_food                    362 rows, 44 bound
canonical_food rows for the 7       0  (they do not exist in this DB yet)
knowledge_foods for the 7           7  (all published)
duplicate knowledge_food_slug       0  (the new one-claimant invariant already holds live)
```

The dev database is materially stale — 362 rows against a 312-row seed, 52 diversity groups
against 173 — and predates several canonical workstreams. `seed:canonical` was **deliberately
not run**: it would have inserted ~121 diversity groups, ~44 varieties and ~658 aliases
unrelated to KNOW3, and would have silently repaired three tests that fail at HEAD for that
reason. The seven bindings reach the database the next time the owner runs, which is the
architecture's own mechanism.

---

## TRUST CHECK

- **Could this mislead the user?** No new claim is displayed. The binding makes an existing
  Domain 1 fact reachable from the canonical surface; it authors none. Benefit rendering stays
  behind the unchanged Layer-2 gate (`getFoodBenefitsForDisplay` shows a benefit only when it
  is reachable via an evidence-backed nutrient bridge — valid `SourceRef` **and** human
  `reviewedAt`). None of that is touched.
- **Could this fabricate certainty?** The single greatest risk in this workstream, and the one
  it is built against. Only identity-to-identity name equality binds. `pepper → red-pepper`
  was found, understood, and is now refused *by test*. Alias matches, multi-candidate matches
  and already-claimed targets are all blocked for a human.
- **Is anything guessed but shown as real?** No. 80 canonical identities have no knowledge food
  and stay `null`. 2 ambiguous matches stay `null` with a written reason. Zero links were
  inferred from anything weaker than name equality.
- **What happens if the system is wrong?** A wrong binding attaches one food's facts to another
  — the failure mode that motivated the identity-only rule. Three independent barriers: the
  binder refuses anything short of unique name equality; the audit refuses a second claimant on
  any knowledge food; and the seed refuses to run while either stands. A binding the matcher
  cannot verify (5 of them) is printed on every seed rather than passed off as checked.
- **No architectural duplication introduced:** YES (none).
- **No new source of truth created:** YES (none — `knowledge-binding.ts` owns no fact).
- **No runtime behaviour altered:** NO — this is not governance-only work. Seven canonical
  foods now reach 22 nutrient links and 14 benefit links through the DB-backed report path.
  See SUGGESTION 1: through the *seed-backed* `buildFoodReport()` they still surface nothing,
  because that adapter reads the editorial half of the seed. That is a pre-existing limit this
  workstream exposes and deliberately does not fix.

---

## VALIDATION PERFORMED

Dev/lower. `REPLIT_DEPLOYMENT` unset. No seed run; production untouched.

| Check | Result |
|---|---|
| `test:canonical-knowledge-binding` (new) | **67 / 67** |
| `test:knowledge-food-ownership` | 24 / 24 |
| `test:knowledge-registry` | 27 / 27 |
| `test:knowledge-evidence-gate` | 116 / 116 |
| `test:knowledge-claim-coverage` | 14 / 14 |
| `test-nk6r-canonical-identity` | 161 / 161 |
| `test-nk6s-beverage-and-pasta` | 97 / 97 |
| `test:intelligence-nutrition-knowledge-binding` | 37 / 37 |
| `test:intelligence-food-intelligence-binding` | 36 / 36 |
| `test:intelligence-food-opportunity-binding` | 40 / 40 |
| `test:nutrition-enrichment` | 22 / 22 |
| `tsc --noEmit` | **190 errors, exactly as HEAD (190); 0 in any file touched** |

`test-canonical-food` (3 fail), `test-food-report-adapter` (2 fail) and
`test-food-report-evidence` (1 fail) fail **identically at HEAD** — proven by running each from
a detached worktree at `17f1afd` against the same database and diffing the failing assertions
byte-for-byte. All six are stale-dev-DB assertions (`db=52 seed=173`) or the `plant-protein`
residue KNOW1 and KNOW2 documented.

**The load-bearing test.** Every assertion above passes on a clean tree, and none of them proves
the gate bites. `test-canonical-knowledge-binding.ts` therefore *removes* a binding
(`grapefruit`) and asserts `validateCanonicalSeed()` refuses and names the food; duplicates a
binding and asserts the one-claimant rule refuses; and corrupts the deferral register two ways
and asserts each is caught as stale. It restores each and re-asserts clean. A validator that
has never been seen to refuse is a validator nobody has tested.

The gate's blind spot is asserted directly (`resolveCanonicalFood("ghee").knowledgeFoodSlug ===
null` while `("tomato")` yields `"tomatoes"`), and end-to-end: a synthetic `ghee` draft promotes
*and* carries `canonicalBinding`; a `carrot` draft is still blocked as a fork and owes nothing;
a `pasta` draft the seed already owns returns `existing` and owes nothing — the gate only claims
a binding for a draft it would actually promote, so it can never contradict the deferral register.

Step 3 of the manual tests was **executed**, not merely specified: the real seed runner was made
to refuse, and the database was re-read afterwards to confirm it wrote nothing.

---

## ROLLBACK PLAN

| Item | Value |
|------|-------|
| Rollback identifier | `rollback/before-know3-canonical-knowledge-food-binding-20260709` → `17f1afd3729c0c4aec872cd3663f4208d790e8bd` |

**Files modified**
```
shared/canonical/knowledge-binding.ts          (new)
shared/canonical/foods.ts                      (7 knowledgeFoodSlug values)
shared/canonical/index.ts                      (audit wired into validateCanonicalSeed)
shared/canonical/resolver.ts                   (export ingredientKeyVariants / slugKey)
server/lib/canonical-foods-gate.ts             (requiredBinding; no write introduced)
server/cli/graduate-canonical-foods.ts         (print the binding owed)
server/seeds/seed-canonical-food.ts            (print warnings + coverage)
server/tests/test-canonical-knowledge-binding.ts (new)
package.json                                   (test script + npm test chain)
docs/implementation/KNOW3_CANONICAL_KNOWLEDGE_FOOD_BINDING.md (new)
```

**Rollback commands**
```bash
git checkout rollback/before-know3-canonical-knowledge-food-binding-20260709
npm run seed:canonical    # only if the seed has since been run; the upsert restores nulls
```

**Verification after rollback**
```bash
npx tsx server/tests/test-canonical-food.ts      # 43 passed, 3 failed (pre-existing)
npx tsx server/tests/test-nk6r-canonical-identity.ts   # 161 passed
npm run knowledge:graduate -- "docs/knowledge/canonical-foods/drafts/batch-001-*/*.yaml"
# → 1 promote, 25 existing, 4 blocked; no 🔗 line; nothing written
```

No migration was added, so there is nothing to reverse. The seed runner's upsert is the only
writer of `knowledge_food_slug`, and it restores whatever the seed declares.

---

## SCOPE LOCK

**Implemented scope**
- 7 canonical → knowledge food bindings, each identity-to-identity name equality.
- `resolveKnowledgeBinding()` — the single, deterministic canonical→knowledge matcher.
- `DEFERRED_KNOWLEDGE_BINDINGS` — 2 reasoned, self-invalidating refusals.
- `auditKnowledgeBindings()` wired into `validateCanonicalSeed()` (seed refuses).
- `canonical-foods-gate.ts` blind spot closed; the CLI prints the binding a draft owes.
- `test-canonical-knowledge-binding.ts` (64 assertions), wired into `npm test`.

**Explicitly excluded scope**
- No knowledge food created, merged, renamed or deleted.
- No canonical food created, merged or deleted; no alias added or removed.
- No nutrient, benefit or description authored. No `reviewedAt` written.
- The 54 canonical foods with no knowledge counterpart are left unbound.
- The `lentils` / `pasta` deferrals are recorded, not resolved.
- `seed:canonical` was not run against the stale dev database.
- No amendment to NK1 or the SoT Register, whose stale figures are reported below.

**SUGGESTIONS — observed, not implemented, do not action without approval**

1. **`buildFoodReport()` cannot see graduated knowledge.** It reads the compact editorial maps
   `FOOD_NUTRIENTS` / `FOOD_BENEFITS` (`relationships.ts`), not the unified `FOOD_NUTRIENT_SEED`
   / `FOOD_BENEFIT_SEED` that KNOW2 composed. Measured: of 256 bound canonical foods, 249 are
   visible to the adapter and **7 are not — exactly the seven bound here**, which are the first
   canonical foods ever bound to *graduated* knowledge. Their facts are reachable through the
   DB-backed `food-report-evidence.ts` and through `/api/knowledge/foods`, but not through the
   seed-backed adapter. Pointing the adapter at the unified arrays is a one-line change with a
   real blast radius (`test-food-report-adapter` asserts current behaviour) and belongs to
   whoever owns the adapter's authority model.

2. **Duplicate identities inside the knowledge seed.** 15 normalised keys name more than one
   knowledge identity, including `lentils`↔`red-lentils`, `tahini`↔`sesame-seeds`,
   `cabbage`↔`white-cabbage`, `cinnamon`↔`cassia`, `spelt`↔`spelt-flour`,
   `chicken`↔`chicken-drumsticks`, `green-beans`↔`runner-beans`. Each is a GOV2 Rule 3
   conflict in Domain 1. The first of these is what blocks `food:lentils`.

3. **`wholewheat-spaghetti` is unreachable from canonical.** Knowledge mints it as an identity;
   canonical `wholewheat-pasta` treats "wholewheat spaghetti" as a `form` alias. No fact is
   lost (wholewheat spaghetti *is* wholewheat pasta), but the two owners disagree on whether a
   shape is an identity. Noted at the seed site.

4. **`pepper` awaits `sweet-pepper`.** The gate now proposes binding canonical `pepper` to the
   unpromoted draft `sweet-pepper` — the correct binding, invisible before this workstream.
   NK6P held that draft back over its `red pepper` alias overlap. Promoting it would bind
   `pepper` and close one of the 54 gaps.

5. **`plain-wheat-flour` lists `fibre` as a notable nutrient.** A draft-authored (ChatGPT)
   Domain 1 fact about a flour whose bran and germ are milled out. Already published and
   already served by `/api/knowledge/foods`; this binding does not create it. Worth an
   editorial pass over the graduated nutrient lists.

6. **`canonicalSeedContextWarnings()` has no caller.** Exported since WS0X.10A and documented
   as "TRACKED (never silent)", it is invoked nowhere. Level-1 context gaps are therefore
   silent. KNOW3's binding warnings *are* printed by the seed runner; the context ones still
   are not.

7. **SoT Register figures are stale.** Domain 2 records "239 entries in shared/canonical/foods.ts"
   (actual: 312). Domain 1 records "188 foods" (actual: 610). KNOW2 reported the same drift.

8. **The dev database has drifted from its seed.** 362 `canonical_food` rows against a 312-row
   seed: it holds rows the seed no longer defines, and the seed is additive-only so it cannot
   remove them. Three test suites fail at HEAD because of it.
