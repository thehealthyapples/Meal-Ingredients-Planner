# NK6P — Canonical Food Batches 007–023 Import Report

**Date:** 2026-07-07
**Author:** Claude Code (validation + governed import)
**Branch:** `int1-intelligence-platform`
**Scope:** Validate **Batches 007–023** (17 batches, 510 drafts) through the NK6I alias‑aware canonical **food identity resolver** (`@shared/canonical` → `resolveCanonicalFood`), the NK6M/GOV2 canonical **vocabulary model** (`resolveNutrientTerm` / `resolveBenefitTerm`), and the **NK6O hardened importer** (`server/lib/canonical-foods-importer.ts`, row‑resilient binding + honest `partial` reporting). Classify every food and **import only the safe‑new identities**. No `--force-upsert`. No merge candidates. No editorial‑review foods. No duplicate foods, nutrients, benefits, or aliases. Stop and report on any **partial** import.
**Predecessors:** [`NK6N_BATCHS_003_TO_006_IMPORT_REPORT.md`](./NK6N_BATCHS_003_TO_006_IMPORT_REPORT.md) · [`NK6O_BATCH_006_NUTRIENT_REPAIR.md`](../implementation/NK6O_BATCH_006_NUTRIENT_REPAIR.md) · [`NK6I_CANONICAL_FOOD_IDENTITY_RESOLUTION_AUDIT.md`](./NK6I_CANONICAL_FOOD_IDENTITY_RESOLUTION_AUDIT.md) · [`GOV2_CANONICAL_ALIAS_PRINCIPLE.md`](../architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md)

---

## 0. Headline

| Outcome | Count |
|---|---|
| 🟢 **Imported** (safe‑new, complete) | **299** |
| 🔵 **Existing identity** (enrich‑only, not re‑minted) | **117** |
| 🟠 **Merge / enrichment candidate** (held, never imported) | **90** |
| 🟡 **Editorial review** (soft alias overlap, held) | **2** |
| ⛔ **Blocked** (cross‑batch exact‑slug duplicate) | **2** |
| ⚠️ **Partial** (incomplete import) | **0** |
| **Drafts processed** | **510** (17 batches × 30) |

**All 299 imported foods are complete** — every one carries ≥ 1 nutrient **and** ≥ 1 benefit binding (verified). **Zero partials** — the NK6O stop‑condition never fired. The two ⛔ blocked items are the *second* copy of a slug that appears in two batches; the first copy imported cleanly and the duplicate was correctly refused (no `--force-upsert`, no duplicate row).

---

## 1. Database target confirmation — Replit dev (lower) environment

| Marker | Value | Meaning |
|---|---|---|
| `DATABASE_URL` host / db / user | `helium` / `heliumdb` / `postgres` | app's single configured DB |
| `PGHOST` / `PGDATABASE` | `helium` / `heliumdb` | confirms the same target |
| `REPL_ID` | `a6376337-…` (set) | inside a Replit workspace |
| `REPLIT_DEPLOYMENT` | **unset** | **dev workspace, NOT a deployment** |
| `REPLIT_DEV_DOMAIN` | `…spock.replit.dev` (set) | interactive dev domain |
| `NODE_ENV` | unset | not production‑flagged |

**Assessment:** Replit **dev / lower** environment — identical target to NK6I/NK6J/NK6N/NK6O. **Production was not touched.** Import authorised for safe‑new identities only.

**Baseline → final table counts (this run):**

| Table | Before | After | Δ | Note |
|---|---|---|---|---|
| `knowledge_foods` | 312 | **611** | **+299** | exactly the safe‑new set; no stray identities minted |
| `knowledge_food_nutrients` | 1084 | **1988** | +904 | new relationship rows for the 299 imports |
| `knowledge_food_benefits` | 798 | **1366** | +568 | new relationship rows for the 299 imports |
| `knowledge_nutrients` | 36 | **36** | **0** | **no new/duplicate nutrient vocabulary created** |
| `knowledge_health_benefits` | 15 | **15** | **0** | **no new/duplicate benefit vocabulary created** |

`knowledge_foods` moved **312 → 611 (+299)** — exactly the successful‑import count, confirming no duplicate or stray identity was created. Nutrient/benefit **vocabulary** tables are unchanged: relationships were bound via non‑destructive `onConflictDoNothing` upserts keyed `(food_slug, nutrient_slug)` / `(food_slug, benefit_slug)` — no duplicate vocabulary or relationship rows.

---

## 2. Method

Classification uses the importer's own decision path (replayed read‑only first, then executed):

| Class | Icon | Importer behaviour | Action |
|---|---|---|---|
| safe new import | 🟢 | no identity collision, slug absent → clean insert | **imported** |
| existing exact identity | 🔵 | slug already present → Step 3b blocks (no `--force-upsert`) | enrich‑only; not re‑minted |
| alias‑resolved merge candidate | 🟠 | own identity resolves to a *different* existing food → NK6I hard block (GOV2 Rule 7) | **held for human‑approved merge — never imported** |
| soft alias overlap — editorial review | 🟡 | a *declared alias* resolves to a different existing identity | **held for editorial review — not imported** |
| blocked | ⛔ | parse error / missing slug / **exact‑slug duplicate created earlier in the run** | not imported |
| partial | ⚠️ | identity written but a resolved nutrient/benefit target could not bind | **STOP + report** (NK6O) |

**Pipeline actually run:**

1. **Baseline capture** (`scripts/nk6p-baseline.ts`) — table counts before any write.
2. **Rollback anchor** — `git tag -f NK6P-rollback-pre-import` → `45443a8`.
3. **Read‑only identity validation** across all 17 batches (`scripts/nk6j-validate-batches.ts`) — zero writes.
4. **Read‑only partial predictor** (`scripts/nk6p-predict-partials.ts`) — for every safe‑new food, resolves each nutrient/benefit term and checks the resolved **canonical slug actually exists** in `knowledge_nutrients` / `knowledge_health_benefits`. This predicts an NK6O `partial` **before** any write. Result: **301 safe‑new files, 301 predicted complete, 0 predicted partial** (no resolved target is missing from the DB).
5. **Safe‑new file emission** (`scripts/nk6p-emit-safe-new.ts`) — emitted exactly the 301 safe‑new file paths.
6. **Governed import** — `tsx server/cli/import-canonical-foods.ts <301 files>`, **no flags**. Result: **299 successful, 0 partial, 2 failed** (the 2 failures are cross‑batch exact‑slug duplicates — see §7).
7. **Completeness verification** (`scripts/nk6p-verify-complete.ts`) — all 299 imported foods have ≥ 1 nutrient and ≥ 1 benefit; **0 with zero nutrients, 0 with zero benefits**.

The `protein` trap that left the Batch‑006 legumes empty in NK6N is closed: NK6O seeded `protein` (+5 others) into `knowledge_nutrients` (30 → 36), so the protein‑heavy Batches 015–022 (fish, meat, offal, eggs, dairy, cheese) resolved and bound `protein` cleanly rather than dropping it.

---

## 3. Per‑batch classification (510 drafts)

Each batch dir also carries `manifest.yaml`, `README.md`, and `CLAUDE_VALIDATE_BATCH_0XX_PROMPT.md` — these are **never** processed (30 food drafts per batch).

| Batch | 🟢 Imported | 🔵 Existing | 🟠 Merge | 🟡 Editorial | ⛔ Blocked | ⚠️ Partial | Drafts |
|---|---:|---:|---:|---:|---:|---:|---:|
| 007 whole‑grains‑cereals‑rice | 6 | 15 | 9 | 0 | 0 | 0 | 30 |
| 008 flours‑baking‑staples | 19 | 4 | 6 | 1 | 0 | 0 | 30 |
| 009 fresh‑herbs‑soft‑herbs | 12 | 14 | 3 | 1 | 0 | 0 | 30 |
| 010 spices‑seasoning‑plants | 11 | 11 | 8 | 0 | 0 | 0 | 30 |
| 011 nuts‑seeds‑mushrooms | 10 | 16 | 4 | 0 | 0 | 0 | 30 |
| 012 oils‑fats‑vinegars | 21 | 5 | 4 | 0 | 0 | 0 | 30 |
| 013 fermented‑foods‑condiments | 19 | 7 | 4 | 0 | 0 | 0 | 30 |
| 014 tea‑coffee‑cocoa‑beverages | 28 | 0 | 2 | 0 | 0 | 0 | 30 |
| 015 oily‑fish‑white‑fish | 18 | 10 | 2 | 0 | 0 | 0 | 30 |
| 016 shellfish‑seafood‑sea‑veg | 20 | 5 | 5 | 0 | 0 | 0 | 30 |
| 017 poultry‑eggs | 17 | 3 | 10 | 0 | 0 | 0 | 30 |
| 018 meat‑game | 14 | 4 | 12 | 0 | 0 | 0 | 30 |
| 019 offal‑high‑nutrient‑animal | 25 | 0 | 3 | 0 | **2** | 0 | 30 |
| 020 milk‑yoghurt‑cultured‑dairy | 15 | 9 | 6 | 0 | 0 | 0 | 30 |
| 021 core‑cheeses | 13 | 13 | 4 | 0 | 0 | 0 | 30 |
| 022 extended‑cheeses‑dairy | 28 | 1 | 1 | 0 | 0 | 0 | 30 |
| 023 plain‑pasta‑noodles‑starches | 23 | 0 | 7 | 0 | 0 | 0 | 30 |
| **Total** | **299** | **117** | **90** | **2** | **2** | **0** | **510** |

---

## 4. Foods imported (299 — all complete)

**299 new canonical food identities minted**, each with its nutrient + benefit relationships (non‑destructive `onConflictDoNothing` upserts). Importer summary: **299 successful, 0 partial, 2 failed; +904 nutrient rows, +568 benefit rows.** Verified: **every** imported food has ≥ 1 nutrient and ≥ 1 benefit — none of the batch‑006 "identity + benefits but zero nutrients" failure mode recurs.

Imported slugs by batch:

- **007 (6):** `oat-groats` `pudding-rice` `rye-grain` `steel-cut-oats` `wheatberries` `wild-rice`
- **008 (19):** `active-dry-yeast` `agar-agar` `arrowroot` `baking-powder` `bicarbonate-of-soda` `chestnut-flour` `cornflour` `cream-of-tartar` `fresh-yeast` `gelatine` `pectin` `plain-wheat-flour` `potato-starch` `self-raising-flour` `semolina-flour` `sourdough-starter` `strong-white-bread-flour` `strong-wholemeal-bread-flour` `tapioca-flour`
- **009 (12):** `curry-leaves` `fresh-lime-leaves` `hyssop` `kaffir-lime-leaves` `lemon-balm` `lovage` `peppermint` `salad-burnet` `sorrel` `summer-savory` `wild-garlic` `winter-savory`
- **010 (11):** `allspice` `aniseed` `cassia` `cayenne-pepper` `celery-seeds` `coriander-seeds` `dill-seeds` `juniper-berries` `mace` `mustard-seeds` `saffron`
- **011 (10):** `chanterelle-mushrooms` `chestnuts` `enoki-mushrooms` `king-oyster-mushrooms` `mixed-wild-mushrooms` `morel-mushrooms` `poppy-seeds` `porcini-mushrooms` `portobello-mushrooms` `truffle`
- **012 (21):** `apple-cider-vinegar` `avocado-oil` `balsamic-vinegar` `beef-dripping` `champagne-vinegar` `coconut-vinegar` `corn-oil` `flaxseed-oil` `goose-fat` `grapeseed-oil` `groundnut-oil` `hemp-seed-oil` `lard` `malt-vinegar` `pumpkin-seed-oil` `red-wine-vinegar` `rice-vinegar` `sherry-vinegar` `walnut-oil` `white-vinegar` `white-wine-vinegar`
- **013 (19):** `anchovy-paste` `black-olive-tapenade` `cashew-butter` `coconut-aminos` `dijon-mustard` `english-mustard` `fermented-pickles` `fish-sauce` `gherkins` `green-olive-tapenade` `hazelnut-butter` `kombucha` `mustard` `pickled-onions` `soy-sauce` `tamari` `tomato-passata` `tomato-puree` `wholegrain-mustard`
- **014 (28):** `beetroot-juice` `black-tea` `cacao-nibs` `cacao-powder` `carob-powder` `carrot-juice` `chamomile-tea` `coffee-beans` `dandelion-tea` `decaffeinated-coffee` `fennel-tea` `ginger-tea` `green-tea` `ground-coffee` `hibiscus-tea` `instant-coffee` `matcha` `nettle-tea` `oolong-tea` `peppermint-tea` `prune-juice` `rooibos-tea` `spearmint-tea` `tomato-juice` `turmeric-tea` `vegetable-juice` `white-tea` `yerba-mate`
- **015 (18):** `albacore-tuna` `basa` `dover-sole` `hake` `halibut` `herring` `kippers` `lemon-sole` `monkfish` `plaice` `rainbow-trout` `red-mullet` `skate` `snapper` `trout` `turbot` `whitebait` `whiting`
- **016 (20):** `arame` `clams` `cockles` `cod-roe` `crayfish` `dulse` `fish-roe` `kelp` `kombu` `langoustines` `lobster` `nori` `octopus` `oysters` `sea-lettuce` `sea-spaghetti` `wakame` `whelks` `white-crab-meat` `winkles`
- **017 (17):** `chicken-drumsticks` `chicken-gizzards` `chicken-hearts` `chicken-wings` `duck-eggs` `duck-liver` `free-range-eggs` `goose` `goose-eggs` `guinea-fowl` `partridge` `pheasant` `pigeon` `quail` `quail-eggs` `turkey-drumsticks` `turkey-liver`
- **018 (14):** `beef-brisket` `beef-joint` `beef-short-ribs` `beef-steak` `bison` `elk` `goat` `hare` `kangaroo` `ostrich` `pork-shoulder` `rabbit` `veal` `wild-boar`
- **019 (25):** `beef-bones` `beef-cheek` `beef-heart` `beef-kidney` `beef-tongue` `bone-marrow` `calves-liver` `chicken-bones` `chicken-feet` `fish-bones` `fish-head` `lamb-bones` `lamb-heart` `lamb-kidney` `lamb-sweetbreads` `lamb-tongue` `ox-cheek` `ox-heart` `oxtail` `pork-kidney` `pork-liver` `pork-tongue` `pork-trotters` `sweetbreads` `tripe`
- **020 (15):** `clotted-cream` `cow-milk` `evaporated-milk` `fromage-frais` `goat-milk` `labneh` `lactose-free-milk` `milk-powder` `quark` `semi-skimmed-milk` `sheep-milk` `single-cream` `skyr` `uht-milk` `whey`
- **021 (13):** `caerphilly` `cheshire-cheese` `cornish-yarg` `double-gloucester` `edam` `emmental` `gruyere` `lancashire-cheese` `manchego` `paneer` `pecorino` `red-leicester` `wensleydale`
- **022 (28):** `asiago` `bocconcini` `burrata` `cambozola` `cheese-curds` `comte` `dolcelatte` `emmenthal` `feta-style-salad-cheese` `fontina` `goat-curd` `goats-log` `hard-goat-cheese` `jarlsberg` `limburger` `morbier` `provolone` `raclette` `reblochon` `scamorza` `sheep-cheese` `smoked-cheese` `soft-blue-cheese` `somerset-brie` `st-agur` `taleggio` `whey-protein` `yorkshire-blue`
- **023 (23):** `conchiglie` `egg-noodles` `farfalle` `fettuccine` `glass-noodles` `gluten-free-pasta` `gnocchi` `konjac-noodles` `lasagne-sheets` `linguine` `orzo` `pearl-couscous` `plain-noodles` `potato-gnocchi` `ramen-noodles` `rice-noodles` `soba-noodles` `sweet-potato-noodles` `tapioca-pearls` `udon-noodles` `wholewheat-noodles` `wholewheat-pasta` `wholewheat-spaghetti`

(The full alphabetical rollback list of all 299 is in §11.)

---

## 5. Existing identities (117 — enrich‑only, not re‑minted)

These drafts' `canonical_slug` already exists in `knowledge_foods`. The importer's Step 3b correctly refused to re‑mint them (no `--force-upsert`); each is an **enrichment opportunity** (the draft carries richer aliases/nutrients/benefits than the seed identity), not a second row. Notable clusters:

- **007:** amaranth, barley, brown-rice, buckwheat, bulgur-wheat, farro, freekeh, millet, polenta, quinoa, semolina, sorghum, spelt, teff, white-rice
- **009:** basil, bay-leaf, chervil, chives, dill, lemongrass, marjoram, mint, mustard-greens, oregano, rosemary, sage, tarragon, thyme
- **011:** almonds, brazil-nuts, chestnut-mushrooms, chia-seeds, hazelnuts, hemp-seeds, oyster-mushrooms, peanuts, pecans, pine-nuts, pistachios, pumpkin-seeds, sesame-seeds, shiitake-mushrooms, sunflower-seeds, walnuts
- **015:** anchovies, cod, haddock, mackerel, pollock, sardines, sea-bass, sea-bream, tilapia, tuna
- **020/021:** cottage-cheese, cream-cheese, creme-fraiche, double-cream, greek-yoghurt, kefir, mascarpone, ricotta / brie, camembert, cheddar, feta, goat-cheese, gouda, halloumi, mozzarella, parmesan, stilton
- **018:** beef, lamb, pork, venison — the base meats already exist (their cuts are §6 merges)

(Full lists in §3 counts; per‑batch detail available via the validation log.)

**Enrichment is a separate governed follow‑up** (fold draft metadata into the existing rows). Not performed here — the task is import‑only of safe‑new.

---

## 6. Merge / enrichment candidates (90 — held, NEVER imported)

Each draft's **own identity** resolves through the GOV2 food resolver to a **different existing canonical food** — importing would fork a duplicate identity (NK6I hard block, GOV2 Rule 7). These are enrichment/merge decisions for a human, not imports. Full list with target identity:

| Batch | Draft | → Merge into existing |
|---|---|---|
| 007 | `basmati-rice`, `jasmine-rice`, `risotto-rice`, `sushi-rice` | `white-rice` |
| 007 | `jumbo-oats`, `rolled-oats` | `oats` |
| 007 | `maize` | `corn` · `pearl-barley` → `barley` · `wholewheat-couscous` → `couscous` |
| 008 | `buckwheat-flour` → `buckwheat` · `cornmeal` → `polenta` · `oat-flour` → `oats` · `rye-flour` → `rye` · `vanilla-extract` → `vanilla` · `wholemeal-flour` → `wheat` |
| 009 | `curly-parsley`, `flat-leaf-parsley` → `parsley` · `fenugreek-leaves` → `fenugreek` |
| 010 | `black-peppercorns`, `white-pepper` → `black-pepper` · `chilli-flakes` → `chilli` · `cumin-seeds`, `ground-cumin` → `cumin` · `fennel-seeds` → `fennel` · `fenugreek-seeds` → `fenugreek` · `smoked-paprika` → `paprika` |
| 011 | `button-mushrooms` → `white-mushrooms` · `cashew-nuts` → `cashews` · `flaxseeds` → `flaxseed` · `macadamia-nuts` → `macadamia` |
| 012 | `clarified-butter`, `ghee` → `butter` · `olive-oil` → `extra-virgin-olive-oil` · `toasted-sesame-oil` → `sesame-oil` |
| 013 | `live-yoghurt` → `live-yogurt` · `miso-paste` → `miso` · `peanut-butter` → `peanuts` · `preserved-lemons` → `lemon` |
| 014 | `cocoa-powder` → `dark-chocolate` · `coconut-water` → `coconut` |
| 015 | `coley` → `pollock` · `pilchards` → `sardines` |
| 016 | `brown-crab` → `crab` · `calamari`, `cuttlefish` → `squid` · `king-prawns`, `shrimp` → `prawns` |
| 017 | `chicken-breast`, `chicken-mince`, `chicken-thighs`, `whole-chicken` → `chicken` · `duck-breast`, `duck-legs` → `duck` · `turkey-breast`, `turkey-mince` → `turkey` · `hen-eggs` → `eggs` · `chicken-liver` → `liver` |
| 018 | `beef-mince` → `beef` · `lamb-chops`, `lamb-leg`, `lamb-mince`, `lamb-shoulder`, `mutton` → `lamb` · `pork-belly`, `pork-chops`, `pork-mince`, `pork-tenderloin` → `pork` · `venison-mince`, `venison-steak` → `venison` |
| 019 | `beef-liver`, `chicken-liver`, `lamb-liver` → `liver` |
| 020 | `live-yoghurt`, `natural-yoghurt` → `live-yogurt` · `skimmed-milk`, `whole-milk` → `milk` · `soured-cream` → `sour-cream` · `whipping-cream` → `double-cream` |
| 021 | `gorgonzola`, `roquefort` → `blue-cheese` · `grana-padano` → `parmesan` · `mature-cheddar` → `cheddar` |
| 022 | `buffalo-mozzarella` → `mozzarella` |
| 023 | `fusilli`, `macaroni`, `penne`, `rigatoni`, `spaghetti`, `tagliatelle` → `pasta` · `giant-couscous` → `couscous` |

**Editorial signal:** the largest merge clusters are **cuts/preparations of a base food** (chicken/turkey/duck/beef/lamb/pork parts → the base meat; pasta shapes → `pasta`; rice types → `white-rice`; `liver` variants). Whether a cut deserves its **own** fact‑owning identity (e.g. `beef-liver` vs generic `liver`, which is nutritionally distinct) is a governance ruling — several of these are arguably *legitimately distinct foods* whose draft slug simply collides with a coarser existing identity. That decision is deferred to editorial; **nothing here was imported.**

---

## 7. Editorial‑review items (2 — soft alias overlap, held)

The food's **own** identity is distinct, but a **declared alias** overlaps an existing identity (surfaced by NK6O as a soft signal, never a hard block, never a silent import):

| Batch | Draft | Overlapping alias → existing | Editorial question |
|---|---|---|---|
| 008 | `vanilla-pod` | `"vanilla pods"` → `vanilla` | `vanilla-pod` is plausibly distinct from generic `vanilla` (pod vs extract/flavour). Narrow the alias, then it is a clean safe‑new. |
| 009 | `coriander-leaf` | `"cilantro"` → `coriander` | `coriander-leaf` (fresh herb) vs `coriander` (existing, seed/spice or generic). `cilantro` is the US name for the leaf — the alias mis‑points to the existing coriander identity. Confirm scope before import. |

Both are **held**, not imported. Recommended: confirm the intended identity, narrow/repoint the offending alias in the draft, then re‑validate — each would then classify 🟢 safe‑new.

---

## 8. Blocked items (2 — cross‑batch exact‑slug duplicates)

Two food slugs appear as **safe‑new drafts in two different batches**. The importer processed batch‑017 before batch‑019, imported the 017 copy, then **correctly refused the 019 copy** ("slug already exists", no `--force-upsert`) — so **no duplicate identity was created**:

| Slug | Imported from | Blocked copy | Reason |
|---|---|---|---|
| `chicken-hearts` | `batch-017-poultry-eggs` ✅ | `batch-019-offal…` ⛔ | exact‑slug duplicate created earlier in the run |
| `duck-liver` | `batch-017-poultry-eggs` ✅ | `batch-019-offal…` ⛔ | exact‑slug duplicate created earlier in the run |

This is the importer's duplicate guard behaving exactly as designed. **Action required (editorial):** the two draft copies are duplicate authoring of one identity across the poultry and offal batches — deduplicate the source drafts and decide which batch owns each slug (and reconcile any metadata differences between the two YAML files). See §9.2 for the full cross‑batch duplicate set.

---

## 9. Remaining unresolved issues

### 9.1 Editorial backlog (held this run, awaiting human decision)
- **90 merge candidates** (§6) — mostly cuts/preparations colliding with a coarser base identity; need a governance ruling on which deserve their own fact‑owning identity, then a governed merge/enrichment (never a silent import).
- **2 editorial‑review foods** (§7) — `vanilla-pod`, `coriander-leaf`; narrow the over‑greedy alias, then re‑import as safe‑new.
- **117 existing‑exact drafts** (§5) — richer draft metadata than the seed identity; a governed *enrichment* opportunity, not a re‑import.

### 9.2 Cross‑batch duplicate slugs (source‑data hygiene)
Seven slugs are authored in **two** batches each. How each resolved this run:

| Slug | Batches | This run |
|---|---|---|
| `chicken-hearts` | 017, 019 | 017 imported; 019 **blocked** (⛔ §8) |
| `duck-liver` | 017, 019 | 017 imported; 019 **blocked** (⛔ §8) |
| `chicken-liver` | 017, 019 | both 🟠 merge → `liver` (neither imported) |
| `live-yoghurt` | 013, 020 | both 🟠 merge → `live-yogurt` (neither imported) |
| `cottage-cheese` | 020, 021 | both 🔵 existing‑exact (already in DB) |
| `mascarpone` | 020, 021 | both 🔵 existing‑exact (already in DB) |
| `ricotta` | 020, 021 | both 🔵 existing‑exact (already in DB) |

No duplicate identity was created for any of them. **Recommendation:** deduplicate the source drafts (one owning batch per slug) to prevent ambiguity in future imports; where two copies differ in metadata, reconcile before enrichment.

### 9.3 Vocabulary coverage (not a defect this run)
Every safe‑new food resolved cleanly — **0 unresolved vocabulary rejects and 0 resolved‑but‑missing targets** among the 299 imports, so no partials. `knowledge_nutrients` (36) and `knowledge_health_benefits` (15) were **sufficient** for this set. This holds only because the drafts were authored against the canonical vocabulary and NK6O had already seeded `protein`. Future batches naming a *new* canonical nutrient/benefit not yet in those tables would surface as `partial` (the predictor `scripts/nk6p-predict-partials.ts` will catch this pre‑write) — seed the vocabulary first, then import.

### 9.4 Pre‑existing items (unchanged by NK6P)
- Legacy `plant-protein` row lingers in `knowledge_nutrients` (harmless, resolves to `protein` via alias) — NK6O §7.
- Broader `db:push` schema drift remains deferred — NK6O §7.
- The NK6N editorial backlog (Batches 003–006: 24 merge + 8 editorial) is untouched by this task.

---

## 10. Constraints honoured

- ✅ **DB target** confirmed as Replit **dev / lower** env; **production untouched**.
- ✅ **Imported only safe‑new** identities (299). **No merge candidates** (90 held), **no editorial‑review** foods (2 held).
- ✅ **No `--force-upsert`** — the importer ran with no flags; the 2 exact‑slug duplicates were **refused**, not overridden.
- ✅ **No duplicate foods** (`knowledge_foods` 312 → 611 = exactly +299), **no duplicate nutrient/benefit vocabulary** (36 / 15 unchanged), **no duplicate relationship rows** (non‑destructive `onConflictDoNothing` binds).
- ✅ **No partial imports** — all 299 imports complete (≥ 1 nutrient **and** ≥ 1 benefit each, verified); the NK6O stop‑condition did not fire.
- ✅ `manifest.yaml`, `README.md`, and `CLAUDE_VALIDATE_*_PROMPT.md` never processed (17 × 3 = 51 non‑drafts skipped).

---

## 11. Appendix — rollback

| Item | Value |
|---|---|
| **Rollback tag** | `NK6P-rollback-pre-import` → `45443a8` |
| **Restore committed code** | `git reset --hard NK6P-rollback-pre-import` (this task made **no code commits**; only new `scripts/nk6p-*.ts` + this report are untracked) |
| **Database rollback** | delete the 299 `knowledge_foods` rows below; their `knowledge_food_nutrients` / `knowledge_food_benefits` rows are keyed by `food_slug` and should be removed with them. `knowledge_foods` returns 611 → 312. |

**299 imported slugs (delete‑to‑rollback):**

```
active-dry-yeast agar-agar albacore-tuna allspice anchovy-paste aniseed apple-cider-vinegar arame arrowroot
asiago avocado-oil baking-powder balsamic-vinegar basa beef-bones beef-brisket beef-cheek beef-dripping
beef-heart beef-joint beef-kidney beef-short-ribs beef-steak beef-tongue beetroot-juice bicarbonate-of-soda
bison black-olive-tapenade black-tea bocconcini bone-marrow burrata cacao-nibs cacao-powder caerphilly
calves-liver cambozola carob-powder carrot-juice cashew-butter cassia cayenne-pepper celery-seeds
chamomile-tea champagne-vinegar chanterelle-mushrooms cheese-curds cheshire-cheese chestnut-flour chestnuts
chicken-bones chicken-drumsticks chicken-feet chicken-gizzards chicken-hearts chicken-wings clams
clotted-cream cockles coconut-aminos coconut-vinegar cod-roe coffee-beans comte conchiglie coriander-seeds
cornflour cornish-yarg corn-oil cow-milk crayfish cream-of-tartar curry-leaves dandelion-tea
decaffeinated-coffee dijon-mustard dill-seeds dolcelatte double-gloucester dover-sole duck-eggs duck-liver
dulse edam egg-noodles elk emmental emmenthal english-mustard enoki-mushrooms evaporated-milk farfalle
fennel-tea fermented-pickles feta-style-salad-cheese fettuccine fish-bones fish-head fish-roe fish-sauce
flaxseed-oil fontina free-range-eggs fresh-lime-leaves fresh-yeast fromage-frais gelatine gherkins ginger-tea
glass-noodles gluten-free-pasta gnocchi goat goat-curd goat-milk goats-log goose goose-eggs goose-fat
grapeseed-oil green-olive-tapenade green-tea ground-coffee groundnut-oil gruyere guinea-fowl hake halibut
hard-goat-cheese hare hazelnut-butter hemp-seed-oil herring hibiscus-tea hyssop instant-coffee jarlsberg
juniper-berries kaffir-lime-leaves kangaroo kelp king-oyster-mushrooms kippers kombu kombucha konjac-noodles
labneh lactose-free-milk lamb-bones lamb-heart lamb-kidney lamb-sweetbreads lamb-tongue lancashire-cheese
langoustines lard lasagne-sheets lemon-balm lemon-sole limburger linguine lobster lovage mace malt-vinegar
manchego matcha milk-powder mixed-wild-mushrooms monkfish morbier morel-mushrooms mustard mustard-seeds
nettle-tea nori oat-groats octopus oolong-tea orzo ostrich ox-cheek ox-heart oxtail oysters paneer partridge
pearl-couscous pecorino pectin peppermint peppermint-tea pheasant pickled-onions pigeon plaice plain-noodles
plain-wheat-flour poppy-seeds porcini-mushrooms pork-kidney pork-liver pork-shoulder pork-tongue
pork-trotters portobello-mushrooms potato-gnocchi potato-starch provolone prune-juice pudding-rice
pumpkin-seed-oil quail quail-eggs quark rabbit raclette rainbow-trout ramen-noodles reblochon red-leicester
red-mullet red-wine-vinegar rice-noodles rice-vinegar rooibos-tea rye-grain saffron salad-burnet scamorza
sea-lettuce sea-spaghetti self-raising-flour semi-skimmed-milk semolina-flour sheep-cheese sheep-milk
sherry-vinegar single-cream skate skyr smoked-cheese snapper soba-noodles soft-blue-cheese somerset-brie
sorrel sourdough-starter soy-sauce spearmint-tea st-agur steel-cut-oats strong-white-bread-flour
strong-wholemeal-bread-flour summer-savory sweetbreads sweet-potato-noodles taleggio tamari tapioca-flour
tapioca-pearls tomato-juice tomato-passata tomato-puree tripe trout truffle turbot turkey-drumsticks
turkey-liver turmeric-tea udon-noodles uht-milk veal vegetable-juice wakame walnut-oil wensleydale
wheatberries whelks whey whey-protein whitebait white-crab-meat white-tea white-vinegar white-wine-vinegar
whiting wholegrain-mustard wholewheat-noodles wholewheat-pasta wholewheat-spaghetti wild-boar wild-garlic
wild-rice winkles winter-savory yerba-mate yorkshire-blue
```

**Reusable governed artifacts (new, untracked):** `scripts/nk6p-baseline.ts`, `scripts/nk6p-predict-partials.ts`, `scripts/nk6p-emit-safe-new.ts`, `scripts/nk6p-verify-complete.ts`, `scripts/nk6p-dupcheck.ts`.

**No `--force-upsert` used. No `manifest.yaml` / `README.md` / prompt files imported. No duplicate identities, nutrients, benefits, or relationships created. Zero partial imports.**
