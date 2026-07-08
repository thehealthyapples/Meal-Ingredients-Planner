# NK6R — Canonical Food Identity Governance — Implementation

**Date:** 2026-07-08
**Author:** Claude Code (implementation)
**Branch:** `int1-intelligence-platform`
**Scope:** Apply the approved [`NK6Q`](../investigations/NK6Q_CANONICAL_FOOD_IDENTITY_GOVERNANCE.md) rulings over the 90 held merge/enrichment candidates, plus the three hierarchy amendments (Olive Oil, Cheese, Pasta) attached to the approval.
**Governing document:** [`GOV2_CANONICAL_ALIAS_PRINCIPLE.md`](../architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md) — one identity, one display name, unlimited aliases; the scope test decides alias-vs-separate-identity.
**Predecessors:** [`NK6Q`](../investigations/NK6Q_CANONICAL_FOOD_IDENTITY_GOVERNANCE.md) · [`NK6P`](../investigations/NK6P_BATCHES_007_TO_023_IMPORT_REPORT.md) · [`NK6I`](../investigations/NK6I_CANONICAL_FOOD_IDENTITY_RESOLUTION_AUDIT.md) · [`NK6M`](./NK6M_CANONICAL_NUTRIENT_MODEL_REFINEMENT.md) (the `family` precedent)
**Verification:** `npm run test:nk6r-canonical-identity` — **161 passed, 0 failed**

---

## 0. Headline

NK6Q found that ~30 existing identities carried **over-greedy alias sets**: strings like `gorgonzola`, `beef liver`, `oat flour` and `cuttlefish` were recorded as aliases of a coarser or simply *different* food. Under [GOV2 Rule 7](../architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md#rule-7--aliases-never-create-duplicate-entities) those aliases hard-blocked the import of 90 drafts, because the importer correctly refuses to mint an identity whose meaning an existing alias already claims.

The alias sets were the bug. This change narrows them, mints the identities they were suppressing, and — per the amendments — introduces a **parent/child hierarchy** so that a coarse identity (`Olive Oil`, `Cheese`, `Pasta`) can exist as a *parent* of its grades, families and types rather than as a synonym that swallows them.

| | Before | After | Δ |
|---|---:|---:|---:|
| `canonical_food` | 254 | 303 | **+49** |
| `food_variety` | 58 | 67 | **+9** |
| `canonical_food_alias` | 726 | 776 | **+50** |

**The one-line result:** a hierarchy is now expressible, so it no longer has to be faked with an alias. `resolveCanonicalFood("olive oil")` returns `olive-oil` (the parent), not `extra-virgin-olive-oil` (one grade of it).

---

## 1. The model change — `canonical_food.family`

The amendments require a parent identity with children. `canonical_food` had **no** parent pointer, and the two mechanisms that existed could not carry one:

| Mechanism | Why it cannot express the amendments |
|---|---|
| `food_variety` | A variety does not own facts, and the table is two levels deep. It cannot hold `cheese → blue-cheese → stilton`, and it contradicts NK6Q's ruling that Gorgonzola and Roquefort are separate **fact owners**. |
| `subcategory` (a string) | A category string is not an identity. Parenting Stilton under the *word* `"Blue cheese"` is precisely the "Hard/Soft as hierarchy" anti-pattern Amendment 2 rejects. |

So NK6R adds a nullable `family` column, mirroring **exactly** the precedent NK6M set for `knowledge_nutrients.family` — where `lutein`, `lycopene` and `beta-carotene` sit beneath the `carotenoids` family *"without being merged or aliased into it… keeping their own identity and facts"*.

```
canonical_food
  slug: "stilton"       family: "blue-cheese"   ← child keeps its own slug, name, facts
  slug: "blue-cheese"   family: "cheese"        ← a family row is itself an identity
  slug: "cheese"        family: null            ← top-level parent
```

`family` is a **self-reference by slug**, no DB foreign key (as NK6M did). `validateCanonicalSeed()` carries the integrity instead, and **refuses to seed** on:

1. a `family` pointing at a slug that does not exist (dangling parent);
2. a food that is its own parent;
3. **a cycle** anywhere in the family graph — otherwise "walk to the root identity" never terminates for any consumer;
4. **a food that is both a child of X and an alias of X.** This is the load-bearing check. The entire point of `family` is that *a hierarchy is not an alias* ([GOV2 fail test 5](../architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md#fail-tests-summary)). A child that its parent also swallows is the old over-merge with extra steps, and it is exactly the state NK6Q was raised to undo.

`seed-canonical-food.ts` propagates `family` through the upsert's `onConflictDoUpdate` set. Omitting it would silently strip the hierarchy on every re-seed — the same trap NK6M documented for nutrients.

> **`subcategory` is now, explicitly, a descriptive attribute.** Texture words ("Hard", "Soft", "Semi-hard", "Fresh") live there and cut *across* families — a blue cheese may be soft (Dolcelatte) or hard (aged Stilton). Nothing in the codebase branches on `subcategory`; it was verified to be display copy only. It can never be a parent.

---

## 2. Amendment 1 — Olive Oil

NK6Q §2.5 recorded a **scope inversion**: `olive-oil` (the generic) resolved *into* the narrower `extra-virgin-olive-oil`, because EVOO's alias set claimed the string `"olive oil"`. The grades disagree on facts — extraction method, polyphenol content, smoke point — so under the scope test each is its own identity, and the generic is their **parent**.

```
olive-oil  (parent; diversity group: olive-oil)
  ├── extra-virgin-olive-oil   aliases: EVOO, cold pressed olive oil
  ├── virgin-olive-oil
  ├── refined-olive-oil        aliases: light olive oil, pure olive oil, mild olive oil
  └── olive-pomace-oil         aliases: pomace oil
```

**Aliases struck from `extra-virgin-olive-oil`:** `"olive oil"` (names the parent), `"virgin olive oil"` (names a sibling). Both in `CANONICAL_SEED` and in `FOOD_SEED`. EVOO keeps `EVOO` as the amendment requires.

---

## 3. Amendment 2 — Cheese

`cheese` becomes the parent identity. Beneath it sit **meaningful families** — groupings by *how the cheese is made* (curd handling, ripening), which is what actually predicts a cheese's character:

| Family | Canonical members today |
|---|---|
| `fresh-cheese` | cottage-cheese, cream-cheese, mascarpone, goat-cheese |
| `whey-cheese` | ricotta |
| `brined-cheese` | feta, halloumi |
| `bloomy-rind-cheese` | brie, camembert |
| `washed-rind-cheese` | *(none yet — see below)* |
| `blue-cheese` | stilton, **gorgonzola**, **roquefort** |
| `pasta-filata` | mozzarella, **buffalo-mozzarella** |
| `pressed-cheese` | cheddar, gouda |
| `cooked-pressed-cheese` | parmesan, **grana-padano** |

**Hard and Soft are not hierarchy levels.** They are descriptive attributes in `subcategory`, per §1. The pre-existing `subcategory` values `"Hard cheese"`, `"Soft and bloomy cheese"`, `"Hard and semi-hard cheese"` were classification masquerading as description; they are normalised to bare texture words.

**Alias sets narrowed:**

- `blue-cheese` — dropped `gorgonzola`, `roquefort`. Its own description *named them* while `stilton` already had a separate identity (NK6Q §2.2). The description is reworded so no named cheese is folded into the family record. **`blue-cheese` survives as a legitimate coarse identity** for a blue cheese whose name is not known — a parent, not a synonym.
- `parmesan` — dropped `grana padano` (a distinct PDO, different rules and ageing).
- `mozzarella` — dropped `buffalo mozzarella` (a different milk source).
- `cheddar` — `mature`/`mild` promoted from `form` aliases to **varieties** (`mild-cheddar`, `mature-cheddar`, `extra-mature-cheddar`), per NK6Q's Variety ruling. Maturity is not a new fact owner.

> **`washed-rind-cheese` is declared with no canonical member.** Taleggio, Reblochon, Raclette, Morbier and Limburger exist today as `knowledge_foods` rows only (batch 022) and have not been promoted to the identity spine. The family is declared now so those promotions have a correct parent to bind to, rather than being forced under a texture word. This is an honest gap, not dead data.

---

## 4. Amendment 3 — Pasta

Type and shape were conflated. The old `pasta` entry aliased six **shapes** as forms of a single wheat identity, which left nowhere for a chickpea or lentil pasta to live.

- **TYPE** = what it is made from. Types disagree on fibre, protein and *plant group*, so each is its own identity under the `pasta` parent.
- **SHAPE** = a physical format. `form_policy`: a format is never an identity. Shapes stay **form aliases of the type they are made from**.

```
pasta  (parent — no knowledge food, no diversity group)
  ├── wheat-pasta        → wheat      | shapes: spaghetti, penne, fusilli, tagliatelle,
  │                                   |   rigatoni, macaroni, linguine, fettuccine,
  │                                   |   farfalle, conchiglie, orzo, lasagne sheets
  ├── wholewheat-pasta   → wheat      | shapes: wholewheat spaghetti, wholemeal penne…
  ├── chickpea-pasta     → chickpeas
  ├── lentil-pasta       → lentils
  ├── pea-pasta          → peas
  └── spinach-pasta      → wheat      (wheat dough coloured with spinach; one food = one plant)
```

> **Superseded by [NK6S](./NK6S_BEVERAGE_AND_PASTA_REFINEMENT.md).** `spinach-pasta` is no longer a
> sixth type. It is a **variety of `wheat-pasta`**: the spinach colours the dough without changing the
> grain, the plant or the nutrient class, so it owns no facts of its own. The five remaining types stand.

`wholemeal-pasta` was a `food_variety`. It is **promoted to an identity** (`wholewheat-pasta`): whole-vs-refined is a fact-owning distinction everywhere else on this platform (`brown-rice` ≠ `white-rice`).

### ⚠ Behaviour change: unqualified "pasta" no longer counts a plant

The parent `pasta` carries `diversityGroupSlug: null` and `knowledgeFoodSlug: null`. This is deliberate and follows the existing `mushroom` parent, which does the same. An unqualified "pasta" is **type-unknown** — it may be chickpea or lentil — so it must not claim a wheat portion it may not contain (Core Principle 6: no fabricated knowledge).

Coverage for the strings users actually type is **preserved in full**:

| Input | Canonical slug | Diversity group | Knowledge food |
|---|---|---|---|
| `spaghetti`, `penne`, `fusilli`, … | `wheat-pasta` | `wheat` ✅ | `pasta` ✅ |
| `wholemeal pasta` | `wholewheat-pasta` | `wheat` ✅ | — |
| `pasta` | `pasta` | **null** (was `wheat`) | **null** (was `pasta`) |

Only the bare word `"pasta"` changes, and it changes to the honest answer.

---

## 5. The remaining NK6Q decisions, applied unchanged

### 5.1 Greedy alias sets narrowed (NK6Q action 2)

| Identity | Aliases struck | Why |
|---|---|---|
| `liver` | `chicken liver`, `chicken livers`, `lamb's liver`, `lamb liver`, `beef liver`, `pig's liver` | §2.1 — species livers differ materially on vitamin A, copper, iron. `pork-liver` and `calves-liver` were already separate. `liver` stays as the coarse fallback. |
| `buckwheat`, `oats`, `rye`, `wheat` | the `…flour` aliases | §2.3 — a milled flour is a first-class fact owner; the grain is not the flour. |
| `fennel` | `fennel seed`, `fennel seeds` | §2.5 — this identity is the bulb **vegetable**; the seed is a different plant part. |
| `fenugreek` | `methi`, `fenugreek leaves`, `kasuri methi` | §2.5 — this identity is the **seed** spice; the leaf is a different plant part. |
| `blue-cheese` | `gorgonzola`, `roquefort` | §2.2 |
| `parmesan` | `grana padano` | §2.2 |
| `mozzarella` | `buffalo mozzarella` | batch 022 |
| `black-pepper` | `white pepper` | batch 010 — ripe berry, hull removed |
| `paprika` | `smoked paprika` | batch 010 — smoke-dried pimentón |
| `butter` | `ghee`, `clarified butter` | batch 012 — no lactose/casein, higher smoke point |
| `vanilla` | `vanilla extract`, `vanilla essence` | batch 008 — alcohol extraction |
| `sesame-oil` | `toasted sesame oil`, `dark sesame oil` | batch 012 — pressed from roasted seeds |
| `peanuts` | `peanut butter` | batch 013 — a ground paste with its own ingredient list |
| `lemon` | `preserved lemon` | batch 013 — salt-fermented condiment |
| `coconut` | `coconut water` | batch 014 — the liquid endosperm, not the flesh |
| `dark-chocolate` | `cocoa`, `cacao`, `cocoa powder` | §2.4 mis-target — cocoa powder is defatted cocoa, not chocolate |
| `couscous` | `wholewheat couscous`, `giant couscous`, `Israeli couscous` | §2.4 mis-target — giant couscous *is* pearl couscous |
| `squid` | `cuttlefish` | batch 016 — a different animal (*Sepia*, not *Loligo*) |
| `lamb` | `mutton` | batch 018 — the meat of an adult sheep |
| `milk` | `skimmed milk`, `semi-skimmed milk` | batch 020 — fat classes |
| `double-cream` | `whipping cream` | batch 020 — a distinct ~35% grade |

### 5.2 The 49 identities minted

Every one of these was previously unreachable: the string resolved to some *other* food.

| Group | Slugs |
|---|---|
| Olive oil (Amdt 1) | `olive-oil`, `virgin-olive-oil`, `refined-olive-oil`, `olive-pomace-oil` |
| Cheese (Amdt 2) | `cheese`, `fresh-cheese`, `whey-cheese`, `brined-cheese`, `bloomy-rind-cheese`, `washed-rind-cheese`, `pasta-filata`, `pressed-cheese`, `cooked-pressed-cheese`, `gorgonzola`, `roquefort`, `grana-padano`, `buffalo-mozzarella` |
| Pasta (Amdt 3) | `wheat-pasta`, `wholewheat-pasta`, `chickpea-pasta`, `lentil-pasta`, `pea-pasta`, ~~`spinach-pasta`~~ (demoted to a variety by [NK6S](./NK6S_BEVERAGE_AND_PASTA_REFINEMENT.md)) |
| Species livers (§2.1) | `beef-liver`, `chicken-liver`, `lamb-liver` |
| Flours (§2.3) | `plain-wheat-flour`, `wholemeal-flour`, `oat-flour`, `buckwheat-flour`, `rye-flour` |
| Couscous (§2.4) | `wholewheat-couscous`, `pearl-couscous` |
| Plant parts (§2.5) | `fennel-seeds`, `fenugreek-leaves` |
| Grades / classes | `white-pepper`, `smoked-paprika`, `mutton`, `cuttlefish`, `semi-skimmed-milk`, `skimmed-milk`, `whipping-cream` |
| Preparations (§4.1) | `ghee`, `vanilla-extract`, `toasted-sesame-oil`, `peanut-butter`, `preserved-lemons`, `cacao-powder`, `coconut-water` |

`ghee` and `clarified-butter` were ruled **one** identity: `clarified butter` is recorded as an alias of `ghee`, not a second slug.

> **45 of the 49 carry `knowledgeFoodSlug: null`.** This is an honest gap, not an omission. Their editorial nutrition content lives in the batch drafts and binds when the deferred import runs (§7). Minting the *identity* now is what stops the resolver silently answering "Gorgonzola" with the wrong food — resolution correctness does not have to wait for nutrition content.

### 5.3 The ~53 merges recorded (NK6Q action 3)

Recorded as alias / form / cut / variety metadata on the base identity. **No new slug.** Promotions from plain alias to the structure NK6Q actually ruled:

- **Varieties** (were `form` aliases): `basmati-rice`, `jasmine-rice`, `risotto-rice`, `sushi-rice` → `white-rice`; `flat-leaf-parsley`, `curly-parsley` → `parsley`; `brown-crab` → `crab`; `mild/mature/extra-mature-cheddar` → `cheddar`.
- **Cuts** stay merged into the base animal — no THA-approved cut-level fact owner exists (`form_policy`).
- **Forms** (mince, flakes, ground, whole, size grade) stay merged.

`test:nk6r-canonical-identity` asserts **all 53** still resolve to their base. Narrowing alias sets is exactly how resolution coverage gets silently lost; this half of the suite exists to catch that.

---

## 6. Things found on the way that NK6Q did not anticipate

1. **`semi-skimmed-milk` was an adjacent instance of the same violation.** NK6Q ruled only on `skimmed-milk`, but cited `semi-skimmed-milk` as an *already-minted* identity — while `milk` still aliased the string `"semi-skimmed milk"`. That is the same fork. Both fat classes are now identities under `milk`; `whole milk` stays an alias, because whole milk *is* the default identity.

2. **`pimentón` cannot be an alias next to `pimenton`.** Both normalise to the same `alias_key`, and one key may map to only one row — the anti-fork lock. Only the unaccented form is recorded.

3. **`wheat flour` had nowhere to go.** NK6Q ordered the `…flour` aliases struck from `wheat`, but `plain-wheat-flour` (already minted as a `knowledge_food`) had no canonical identity. Minted, so `"wheat flour"` still resolves.

4. **A new canonical category, `Drinks`,** was introduced for `coconut-water` (one member). The tea/coffee foods from batch 014 will belong here on promotion. Nothing enumerates canonical categories statically; the knowledge-food category list is queried at runtime.
   > **Superseded by [NK6S](./NK6S_BEVERAGE_AND_PASTA_REFINEMENT.md).** `Drinks` was a placeholder. It is retired in favour of a first-class `Beverages` domain rooted at the `beverage` identity, with nine declared families for the batch-014 drafts to bind to.

5. **`wholemeal-pasta` leaves an orphan `food_variety` row.** The seed runner is an additive upsert and never deletes. After `seed:canonical`, the stale row remains until reaped. No code references it (verified).

### 6.1 ⚠ NK6Q action 5 (deduplicate cross-batch drafts) — deliberately NOT applied

NK6Q states the duplicate drafts are "classified identically in both rows". **They are not identical**, and one contains a data-quality error. No draft file was touched.

| Draft | Copies | They differ on | Recommended owner |
|---|---|---|---|
| `chicken-liver` | batch 017, batch 019 | `food_category` (`poultry_or_egg` vs `offal_or_animal_bone`), shopping locations | **019** — liver is offal, not poultry |
| `live-yoghurt` | batch 013, batch 020 | plant-diversity policy and nutrient list | **020** — dairy |

The batch-013 `live-yoghurt` draft asserts `counts_towards_plant_diversity: true`, `plant_family: plant_based_ingredient`, and lists **polyphenols and fibre** as notable nutrients. Yoghurt is dairy: it is not a plant and contains no fibre. Deduplicating by deleting a file would have destroyed differing content and buried this bug. **It needs an editorial ruling, and the batch-013 draft needs correcting regardless of which copy survives.**

---

## 7. What is deferred, and how to run it

Nothing in this change touched the database. The 611-row `knowledge_foods` table is untouched; the `canonical_food` tables are untouched. The runbook, in order:

```bash
npm run db:push                  # 1. adds canonical_food.family
npm run seed:canonical           # 2. upserts the 303 foods / 67 varieties / 776 aliases
                                 #    (refuses to run if validateCanonicalSeed() finds a problem)
npm run import:canonical-foods   # 3. the ~26 draft mints NK6Q unblocked
```

Step 3 is now **verified unblocked**: each draft's own identity previously resolved, through the GOV2 resolver, to a *different* existing canonical food. It no longer does — `test:nk6r-canonical-identity` asserts every one of them resolves to itself. Per NK6Q action 6, each should therefore classify 🟢 *safe-new* (or 🔵 *existing*, for the identities this change authored editorially), and no draft should hard-block.

The import will bind editorial nutrition and benefit content to the 45 identities currently carrying `knowledgeFoodSlug: null`, after which a follow-up pass can link `canonical_food.knowledge_food_slug` for each.

**Also still open:** the knowledge-food-level merges NK6Q ruled that have no canonical counterpart to edit — `cornmeal` → `polenta`, `live-yoghurt` / `natural-yoghurt` → `live-yogurt`. `polenta` and `live-yogurt` exist only as `knowledge_foods` rows, so those merges belong to the import pass, not the seed.

---

## 8. Verification

```
npm run test:nk6r-canonical-identity     ✅ 161 passed, 0 failed
npm run typecheck                        ✅ no new errors in any touched file
npm run test:canonical-food              43 passed, 3 failed  (unchanged from baseline)
npm run test:variety-surfacing           ✅ 36 passed, 0 failed
npm run test:food-report                 102 passed, 2 failed (unchanged from baseline)
npm run test:knowledge-registry          21 passed, 2 failed  (unchanged from baseline)
```

The pre-existing failures were confirmed identical with this change stashed. `test:canonical-food`'s three are `DB count ≥ seed` assertions — the database has not been re-seeded (see §7); the gap predates this work (`diversity_group` db=52 vs seed=173, a table NK6R does not touch).

`test:nk6r-canonical-identity` is the durable regression cover. It runs against the editorial seed through the **one** shared resolver (GOV2 Rule 5), so it tests the same interpretation the importer, search and AI paths receive. It asserts, in both directions:

- the splits landed — the 49 minted identities resolve to themselves, and the mis-targets (`cocoa powder`, `giant couscous`) reach the right food;
- the merges held — all ~53 merge/form/cut/variety strings still reach their base identity;
- no food is parented by a texture word;
- no alias_key is claimed by two identities;
- **no child is an alias of its own parent** — the fail test that makes `family` meaningful.

---

## 9. Files changed

| File | Change |
|---|---|
| `shared/schema.ts` | `canonical_food.family` (nullable); `subcategory` documented as a descriptive attribute |
| `shared/canonical/foods.ts` | 49 identities minted, ~30 alias sets narrowed, 3 hierarchies authored, 10 varieties promoted |
| `shared/canonical/food-context.ts` | WS0X.5 context for all 49 new identities |
| `shared/canonical/index.ts` | `validateCanonicalSeed()`: dangling parent, self-parent, family cycle, child-aliased-by-parent |
| `shared/knowledge/foods.ts` | the same greedy aliases narrowed in the knowledge registry; `blue-cheese` description reworded |
| `server/seeds/seed-canonical-food.ts` | propagate `family` through the upsert |
| `server/tests/test-nk6r-canonical-identity.ts` | **new** — 161 assertions |
| `package.json` | `test:nk6r-canonical-identity` |

**No draft, database row, or `knowledge_foods` record was modified by this task.**
