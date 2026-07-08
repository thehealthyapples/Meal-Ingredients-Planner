# NK6S — Beverage & Pasta Taxonomy Refinement — Implementation

**Date:** 2026-07-08
**Author:** Claude Code (implementation)
**Branch:** `int1-intelligence-platform`
**Scope:** Two approved refinements to [`NK6R`](./NK6R_CANONICAL_FOOD_IDENTITY_IMPLEMENTATION.md) — promote Beverages to a first-class canonical domain with a real hierarchy, and reclassify Spinach Pasta from a pasta *type* to a *variety* of Wheat Pasta.
**Governing document:** [`GOV2_CANONICAL_ALIAS_PRINCIPLE.md`](../architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md) — one identity, one display name, unlimited aliases; the scope test decides alias-vs-variety-vs-separate-identity.
**Predecessors:** [`NK6R`](./NK6R_CANONICAL_FOOD_IDENTITY_IMPLEMENTATION.md) (the `family` column) · [`NK6Q`](../investigations/NK6Q_CANONICAL_FOOD_IDENTITY_GOVERNANCE.md) · [`NK6M`](./NK6M_CANONICAL_NUTRIENT_MODEL_REFINEMENT.md)
**Verification:** `npm run test:nk6s-beverage-and-pasta` — **97 passed, 0 failed**

---

## 0. Headline

NK6R left two things half-built.

It minted an **ad-hoc `Drinks` category holding a single member** (`coconut-water`) and wrote, in §6.4, that "the tea/coffee foods from batch 014 will belong here on promotion." A category string is not a hierarchy — it is precisely the thing NK6R's own §1 forbids as a parent. The thirty batch-014 drafts had nowhere to bind.

And it made **Spinach Pasta a sixth pasta type**, sitting beside `chickpea-pasta` and `lentil-pasta`. But the pasta types are types *because each one changes the plant*. Spinach pasta does not: it is durum wheat dough with spinach folded in for colour. NK6R itself gave it `diversityGroupSlug: "wheat"` — the same plant, the same grain, the same fibre and protein class as `wheat-pasta`. It owned no facts of its own, and a food that owns no facts is not an identity.

NK6S fixes both. **Neither needs a migration**: `canonical_food.family` already exists.

| | Before (NK6R) | After (NK6S) | Δ |
|---|---:|---:|---:|
| `canonical_food` | 303 | 312 | **+9** (10 minted, 1 demoted) |
| `food_variety` | 67 | 68 | **+1** |
| `canonical_food_alias` | 776 | 801 | **+25** |

**The one-line result:** `resolveCanonicalFood("spinach pasta")` returns `wheat-pasta` as a **variety**, counting wheat — the same plant as before, now without a second fact owner. And `resolveCanonicalFood("drink")` returns `beverage`, a real parent identity with nine declared families waiting for batch 014.

---

## 1. Refinement 1 — Beverages as a first-class domain

### 1.1 The model: two axes, kept apart

NK6R §1 established that `subcategory` is a descriptive attribute and `family` is the hierarchy. NK6S adds the third leg of that rule, because a beverage hierarchy is where it first bites:

| Column | Answers | Rewritten by NK6S? |
|---|---|---|
| `category` | **What domain does this food come from?** Dairy, Fermented foods, Dairy alternatives. | **No** — except `coconut-water`, whose domain *was* the placeholder. |
| `subcategory` | What is it like? "Plant milks", "Fermented drinks". Descriptive. Never a parent. | No |
| `family` | **What broader canonical identity is it a kind of?** | **Yes** — this is the entire change. |

A plant milk is still a dairy alternative. Kombucha is still a fermented food. **Joining the beverage hierarchy does not evict a food from its domain**, because "is drunk" describes a food; it does not tell you what the food *is*. Only identities with no other domain — tea, coffee, juice, cocoa drinks, infusions, plant waters — carry `category: "Beverages"`.

### 1.2 The hierarchy, built now — not deferred

```
beverage                (category: Beverages; no knowledge food, no diversity group)
  ├── tea                    ← green, black, white, oolong, matcha        (batch 014)
  ├── herbal-infusion        ← rooibos, chamomile, nettle, peppermint     (batch 014)
  ├── coffee                 ← beans, ground, instant, decaf              (batch 014)
  ├── cocoa-beverage         ← drinking chocolate            ⚠ NOT slugged `cocoa`
  ├── juice                  ← beetroot, carrot, tomato, prune            (batch 014)
  ├── plant-water            └── coconut-water
  ├── fermented-beverage     ├── kombucha        (category stays: Fermented foods)
  │                          └── kefir           (category stays: Dairy)
  ├── plant-beverage         ├── oat-milk        (category stays: Dairy alternatives)
  │                          ├── soy-milk
  │                          └── almond-milk
  └── dairy-beverage         └── buttermilk      (category stays: Dairy)
```

Every family row is a **legitimate coarse identity in its own right** — the `blue-cheese` precedent. "Tea" names a real thing when the kind is unknown, exactly as "a blue cheese" does. Each resolves to itself; none is swallowed by its parent.

**Five families carry no canonical member yet.** This is the `washed-rind-cheese` precedent NK6R established and defended: *"the family is declared now so those promotions have a correct parent to bind to, rather than being forced under a texture word. This is an honest gap, not dead data."* Batch 014 holds thirty drafts; twenty-eight have no canonical identity yet (`cacao-powder` and `coconut-water` already do) and bind to these parents on promotion. Declaring them is what stops that import inventing a hierarchy at 3am.

> **The hierarchy is not deferred. The *membership* of five families is, because the foods do not exist yet.** Those are different things.

### 1.3 Three rulings inside the hierarchy

**`herbal-infusion` is a sibling of `tea`, not a child.** Rooibos, chamomile and nettle are not *Camellia sinensis*. They are sold as "herbal tea", but a different plant is a different food — the same discipline NK6Q §2.5 applied to split `fennel` (the bulb) from `fennel-seeds` (the spice). Parenting rooibos under `tea` would assert that rooibos is a kind of tea. It is not. The string `"herbal tea"` still resolves, as an alias of `herbal-infusion`, so no coverage is lost.

**The cocoa family is `cocoa-beverage`, not `cocoa`.** `cacao-powder` legitimately owns the alias keys `cocoa` and `cacao` (NK6Q §2.4 — cocoa powder is *defatted cocoa*, an ingredient). Slugging this family `cocoa` would have been a resolver key collision and `validateCanonicalSeed()` would have refused to seed. The narrower name is also the more honest one: a hot chocolate is a preparation, distinct from the powder it is made with.

**`milk` is deliberately *not* parented here.** It is the dairy fact owner (`knowledgeFoodSlug: "milk"`) and it already parents its own fat classes, `skimmed-milk` and `semi-skimmed-milk`. Pulling that subtree under `beverage` would make *how a food is consumed* into a hierarchy level — the identical move Amendment 2 rejected when it ruled Hard and Soft descriptive attributes rather than cheese families. `dairy-beverage` therefore holds `buttermilk`, and stands ready if THA later rules that milk belongs beneath it. That ruling is **open, and named** — see §5.

### 1.4 What bound, and what it cost

| Food | `family` gained | `category` | Diversity group | Knowledge food |
|---|---|---|---|---|
| `coconut-water` | `plant-water` | `Drinks` → **`Beverages`** | `coconut` ✅ unchanged | — |
| `kombucha` | `fermented-beverage` | Fermented foods ✅ unchanged | — | — |
| `kefir` | `fermented-beverage` | Dairy ✅ unchanged | — | `kefir` ✅ unchanged |
| `oat-milk` | `plant-beverage` | Dairy alternatives ✅ unchanged | `oats` ✅ unchanged | `oat-milk` ✅ unchanged |
| `soy-milk` | `plant-beverage` | Dairy alternatives ✅ unchanged | `edamame` ✅ unchanged | `soy-milk` ✅ unchanged |
| `almond-milk` | `plant-beverage` | Dairy alternatives ✅ unchanged | `almonds` ✅ unchanged | `almond-milk` ✅ unchanged |
| `buttermilk` | `dairy-beverage` | Dairy ✅ unchanged | — | `buttermilk` ✅ unchanged |

**No plant count changes. No editorial content is re-pointed. No food leaves its domain** — except `coconut-water`, whose domain was a placeholder for exactly this.

The five bound foods were chosen on evidence already in the seed, not on taste: `kombucha` and `buttermilk` carry the subcategory `"Fermented drinks"` / `"Dairy drinks"`; the plant milks carry `"Plant milks"`; `kefir`'s own description reads *"a cultured, **drinkable** ferment"*. The editorial data already said these were drinks.

### 1.5 The retired `Drinks` category

`Drinks` had exactly one member and is now empty — the suite asserts no canonical food remains in it. The **word** survives as an alias of `beverage`, so `"drink"` and `"drinks"` resolve where they previously returned `unknown`:

| Input | Before | After |
|---|---|---|
| `drink`, `drinks` | *unresolved* | `beverage` — no plant, no knowledge food |
| `beverage`, `beverages` | *unresolved* | `beverage` |
| `tea`, `coffee`, `juice` | *unresolved* | themselves — no plant, no knowledge food |
| `herbal tea`, `tisane` | *unresolved* | `herbal-infusion` |
| `hot chocolate`, `drinking chocolate` | *unresolved* | `cocoa-beverage` |
| `cocoa`, `cacao`, `cocoa powder` | `cacao-powder` | `cacao-powder` **unchanged** |

Every coarse parent carries `diversityGroupSlug: null` and `knowledgeFoodSlug: null`. An unqualified "juice" is source-unknown — it must not claim a plant it may not contain (Core Principle 6: no fabricated knowledge). This is the `pasta` and `mushroom` rule, applied consistently.

---

## 2. Refinement 2 — Spinach Pasta is a variety

### 2.1 The line the pasta types draw

NK6R's Amendment 3 got the *axis* right: TYPE is what a pasta is made from; SHAPE is a format and never an identity. It then mis-sorted one item across its own line.

**A type is a type because it changes the plant.** That is what makes it a fact owner:

| Type | Plant | Fibre / protein | Gluten |
|---|---|---|---|
| `wheat-pasta` | wheat | baseline | yes |
| `wholewheat-pasta` | wheat | **higher fibre** | yes |
| `chickpea-pasta` | **chickpeas** | **higher both** | **none** |
| `lentil-pasta` | **lentils** | **higher both** | **none** |
| `pea-pasta` | **peas** | **higher both** | **none** |
| ~~`spinach-pasta`~~ | wheat | baseline | yes |

Spinach pasta differs from wheat pasta in **colour**. It is durum wheat dough with a little spinach folded in. Every fact NK6R could have hung on it was `wheat-pasta`'s fact — which is why NK6R shipped it with `knowledgeFoodSlug: null`, an identity with nothing to say.

`food_variety` is the mechanism for exactly this: *"A named sub-kind of ONE canonical food… A variety shares its parent's diversity group, so tracking it NEVER changes a plant count."* Spinach pasta is `wheat-pasta`'s `mature-cheddar`.

### 2.2 What changed

```diff
  pasta  (parent — no knowledge food, no diversity group)
    ├── wheat-pasta        → wheat   | shapes: spaghetti, penne, fusilli, …
+   │                                | varieties: spinach-pasta
    ├── wholewheat-pasta   → wheat
    ├── chickpea-pasta     → chickpeas
    ├── lentil-pasta       → lentils
    └── pea-pasta          → peas
-   └── spinach-pasta      → wheat
```

Chickpea, lentil and pea pasta **remain separate canonical types**, untouched. The refinement narrows the type list from six to five; it does not weaken it.

### 2.3 Resolution, before and after

| Input | Before | After |
|---|---|---|
| `spinach pasta` | `spinach-pasta` *(canonical)* · plant `wheat` · kf `null` | `wheat-pasta` **(variety `spinach-pasta`)** · plant `wheat` ✅ · kf **`pasta`** |
| `pasta verde` | `spinach-pasta` *(alias)* | `wheat-pasta` *(alias)* · plant `wheat` ✅ |
| `spinach tagliatelle` | `spinach-pasta` *(alias)* | `wheat-pasta` *(alias)* · plant `wheat` ✅ |

Two things worth stating plainly:

1. **The plant count is identical.** Spinach pasta counted wheat before and counts wheat now — a variety inherits its parent's diversity group. It has never counted, and still does not count, a spinach portion. One food, one plant.
2. **It gained editorial content it did not have.** `knowledgeFoodSlug` moves `null` → `pasta`, because it now reaches wheat pasta's knowledge food. A user asking about spinach tagliatelle gets a real nutrition answer instead of nothing.

The `food-context.ts` entry for `spinach-pasta` is **deleted** rather than left behind. Orphan context entries are legal (they pre-stage a future promotion), but this promotion is never coming — leaving it would have been a lie about the roadmap.

---

## 3. Confirmation: no resolver conflicts, no alias conflicts, no import blockers

This was the explicit condition on both refinements. Each is confirmed by a mechanism, not an assertion.

### 3.1 Resolver conflicts — **none**

`buildCanonicalIndex()` records any key that two distinct canonical foods both claim. `validateCanonicalSeed()` refuses to seed on a single one.

```
validateCanonicalSeed()   → CLEAN (0 problems, 312 foods / 68 varieties / 801 aliases)
buildCanonicalIndex()     → 0 conflicts
```

All 35 keys NK6S introduces were probed against the pre-change index before authoring. Every one was free. The full family graph re-validates: no dangling parent, no self-parent, **no cycle**, and no child aliased by its own parent.

### 3.2 Alias conflicts — **none, and one was actively avoided**

The `alias_key` UNIQUE column is the anti-fork lock: one string, at most one identity. The suite asserts it holds.

The near-miss is worth recording, because it shaped the design rather than being papered over:

> `cacao-powder` owns the alias keys `cocoa` **and** `cacao`. Naming the cocoa-drink family `cocoa` — the obvious name, and the word the refinement brief uses — would have produced `Resolver key collision "cocoa" between cacao-powder and cocoa`, and `validateCanonicalSeed()` would have **refused to seed**. The family is therefore `cocoa-beverage`, with `hot chocolate` / `drinking chocolate` / `hot cocoa` as its aliases. The seed's own integrity check caught the modelling error before the model shipped.

`herbal-infusion` claims `"herbal tea"`, and `tea` claims `"tea"`. Distinct keys, distinct identities, no fork. The two aliases inherited from the retired `spinach-pasta` identity (`pasta verde`, `spinach tagliatelle`) move to `wheat-pasta`; the alias upsert targets `alias_key` and re-points `canonical_food_id`, so a re-seed migrates them cleanly rather than colliding.

### 3.3 Import blockers — **none, verified over all 700 drafts**

The importer hard-**BLOCKS** a draft only when the draft's own identity (slug, de-hyphenated slug, or display name) resolves to a match carrying a **foreign, non-null `knowledgeFoodSlug`** (`canonical-foods-importer.ts:462-481`). `aliasOverlaps` — the soft signal — has the same non-null precondition.

That predicate makes the analysis exact. NK6S touches the resolver in only two ways:

| Change | Blocker risk |
|---|---|
| **35 keys added**, all owned by the 10 new beverage rows | **Structurally impossible.** Every new row carries `knowledgeFoodSlug: null`. A match with a null knowledge food can neither block nor overlap. Asserted by the suite, so it cannot silently change. |
| **3 keys re-pointed** — `spinach pasta`, `pasta verde`, `spinach tagliatelle` — from `spinach-pasta` (kf `null`) to `wheat-pasta` (kf `pasta`) | The one real exposure. A draft naming any of these in a resolved field would now block. |
| Keys removed | **None.** `"spinach pasta"` survives as the variety's name. |
| `category` / `family` edits | Invisible to `resolveCanonicalFood()`. |

The three re-pointed keys were then checked against **every draft YAML in the tree (700 files)**, in each of the three fields the importer actually resolves — `record.canonical_slug`, `record.display_name`, `identity.aliases`:

```
(a) 35 added keys → all resolve, all knowledgeFoodSlug=null → cannot block, cannot overlap  ✅
(b) 3 re-pointed keys → named by 0 drafts in any resolved field → no new block, no new overlap  ✅
```

`spinach.yaml` does mention `"spinach pasta"` — under `not_same_as` and `processing_watchouts`. Neither is ever resolved (`not_same_as` deliberately so, per the importer's own comment). No effect.

**Batch 014 in particular is unaffected.** Its thirty drafts (`green-tea`, `coffee-beans`, `beetroot-juice`, …) do not collide with the coarse parents `tea` / `coffee` / `juice`: resolution is exact-key and never substring, and `inputVariants()` only singularises the trailing word — it never shortens `"green tea"` to `"tea"`. They will bind to their declared parents on promotion, as intended.

---

## 4. Verification

```
npm run test:nk6s-beverage-and-pasta   ✅  97 passed, 0 failed   ← new
npm run test:nk6r-canonical-identity   ✅ 161 passed, 0 failed
npm run test:variety-surfacing         ✅  36 passed, 0 failed
npm run typecheck                      ✅ no errors in any NK6S-touched file
npm run test:canonical-food               43 passed,  3 failed  (unchanged from baseline)
npm run test:food-report                 102 passed,  2 failed  (unchanged from baseline)
npm run test:knowledge-registry           21 passed,  2 failed  (unchanged from baseline)
```

The pre-existing failures are the ones NK6R recorded, at the same counts. `test:canonical-food`'s three are `DB count ≥ seed` assertions — the database has not been re-seeded since before NK6R (`canonical_food_alias` db=143 vs seed=801), so the gap widens by construction with every seed addition and says nothing about this change.

`test-nk6s-beverage-and-pasta.ts` is the durable regression cover. It runs against the editorial seed through the **one** shared resolver (GOV2 Rule 5), so it tests the interpretation the importer, search and AI paths receive. Most of it is **negative space** — a hierarchy refinement is exactly the kind of change that silently moves a plant count or re-points a knowledge food. It asserts:

- the domain is real — `beverage` is top-level, parents exactly nine families, each of which resolves to *itself*;
- the retired `Drinks` category holds no food, and `"drink"` still resolves;
- **every bound food keeps its `category`, its diversity group and its knowledge food** — the seven-row table in §1.4, asserted cell by cell;
- `milk` is **not** parented into the tree and keeps both its fat-class children;
- no food is slugged `cocoa`, and `"cocoa"` / `"cacao"` still reach `cacao-powder`;
- every coarse parent claims no plant and no knowledge food;
- **no beverage family row can hard-block an import** — all carry `knowledgeFoodSlug: null`;
- `spinach-pasta` is not a canonical food; `"spinach pasta"` reaches `wheat-pasta` as `matchType: "variety"`, counts **wheat**, and does **not** count spinach;
- the five remaining pasta types each still resolve as `matchType: "canonical"` and count their own plant — the line the refinement draws, asserted from both sides;
- `coconut-water → plant-water → beverage`, three levels, and every family chain terminates.

---

## 5. Honest gaps and open rulings

1. **Five families have no canonical member** — `tea`, `herbal-infusion`, `coffee`, `cocoa-beverage`, `juice`. Their members are the batch-014 drafts, which bind on promotion (§6). Declared, not populated. The `washed-rind-cheese` precedent.

2. **`milk` under `dairy-beverage` is an open editorial ruling, not an oversight.** NK6S leaves it top-level for the reason in §1.3. If THA rules that the dairy fat-class subtree belongs beneath `beverage`, it is a one-line change (`family: "dairy-beverage"`) with no migration and no resolver impact — `family` has **no runtime consumer** today outside the seed upsert, `validateCanonicalSeed()` and these tests.

3. **`yoghurt` was not touched**, though drinking yoghurt exists. It is eaten far more than drunk, and its NK6Q duplicate-draft ruling (`live-yoghurt`, batch 013 vs 020) is still open — see NK6R §6.1. Reclassifying it before that ruling lands would prejudge it.

4. **`knowledge_foods` has no `Beverages` category** and NK6S did not add one. The canonical spine and the knowledge registry carry independent category vocabularies; nothing enumerates canonical categories statically. The batch-014 drafts map their own `food_category` through `mapFoodCategory()` at import time.

5. **The seed runner is an additive upsert and never deletes.** If `seed:canonical` had been run between NK6R and NK6S, a stale `canonical_food` row for `spinach-pasta` would linger until reaped. It has not been — NK6R §7 records that nothing in that change touched the database, and the DB row counts confirm it. The same caveat still applies to NK6R's orphan `wholemeal-pasta` `food_variety` row.

---

## 6. What is deferred, and how to run it

**No schema change. `npm run db:push` is not required** — `canonical_food.family` was added by NK6R and NK6S only writes to it.

```bash
npm run seed:canonical           # 1. upserts 312 foods / 68 varieties / 801 aliases
                                 #    (refuses to run if validateCanonicalSeed() finds a problem)
npm run import:canonical-foods   # 2. unchanged — no new blockers (§3.3)
```

`seed:canonical` propagates `category`, `family` and `fermented` through the upsert's `onConflictDoUpdate` set, so `coconut-water`'s domain move and all seven `family` bindings apply on re-seed rather than being silently dropped. The variety and alias upserts target `slug` / `alias_key` and re-point `canonical_food_id`, so `spinach-pasta` migrates from identity to variety, and its two aliases migrate to `wheat-pasta`, without collision.

Still open, and unchanged by this task: the batch-014 promotion that populates the five empty families, and the knowledge-food-level merges NK6Q ruled that have no canonical counterpart (NK6R §7).

---

## 7. Files changed

| File | Change |
|---|---|
| `shared/canonical/foods.ts` | `beverage` + 9 families minted; 7 foods bound by `family`; `coconut-water` domain `Drinks`→`Beverages`; `spinach-pasta` demoted to a variety of `wheat-pasta` with its 2 aliases |
| `shared/canonical/food-context.ts` | context for the 10 new identities; `spinach-pasta` entry removed |
| `server/tests/test-nk6s-beverage-and-pasta.ts` | **new** — 97 assertions |
| `server/tests/test-nk6r-canonical-identity.ts` | one assertion narrowed: pasta parents five types, not six |
| `docs/implementation/NK6R_…_IMPLEMENTATION.md` | §4, §5.2 and §6.4 marked superseded, with links here |
| `package.json` | `test:nk6s-beverage-and-pasta` |

**No schema, database row, draft YAML or `knowledge_foods` record was modified by this task.**
