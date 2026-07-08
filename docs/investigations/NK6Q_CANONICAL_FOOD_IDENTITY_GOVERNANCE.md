# NK6Q — Canonical Food Identity Governance — Merge-Candidate Ruling

**Date:** 2026-07-07
**Author:** Claude Code (governance classification — read-only)
**Branch:** `int1-intelligence-platform`
**Scope:** Classify the **90 merge / enrichment candidates** held (never imported) by [`NK6P`](./NK6P_BATCHES_007_TO_023_IMPORT_REPORT.md) §6. Each draft's own identity resolved through the GOV2 food resolver to a **different existing canonical food**, so the NK6I hard block ([GOV2 Rule 7](../architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md#rule-7--aliases-never-create-duplicate-entities)) held it for a human ruling. This document is that ruling.
**Governing document:** [`GOV2_CANONICAL_ALIAS_PRINCIPLE.md`](../architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md) — one identity, one display name, unlimited aliases; the scope test decides alias-vs-separate-identity.
**Predecessors:** [`NK6P`](./NK6P_BATCHES_007_TO_023_IMPORT_REPORT.md) · [`NK6I`](./NK6I_CANONICAL_FOOD_IDENTITY_RESOLUTION_AUDIT.md)

> **No data was modified.** This is a classification and recommendation document only. No draft, seed, alias, or DB row was touched. Every recommended action is a governed follow-up for a human to approve.

---

## 0. Headline

| Classification | Count | Meaning |
|---|---:|---|
| **Merge into existing food** | 22 | true synonym / regional / spelling variant — record as an alias of the target, no new identity |
| **Separate canonical food** | 21 | resolver over-merged into a coarser or different-scope identity; the draft is a genuine distinct fact owner — mint it |
| **Form** | 19 | same food, different physical format (mince, flakes, ground, whole, pasta shape) — merge into base as a form |
| **Cut** | 12 | anatomical cut of an animal — merge into the base animal (no THA-approved cut fact owner yet) |
| **Variety** | 8 | cultivar / breed / named variant — merge into base as a named variety |
| **Preparation** | 7 | processed derivative (extract, clarified, roasted, ground-to-paste, fermented) — mostly a **distinct** fact owner |
| **Editorial review required** | 1 | genuine identity-hierarchy question a human must settle |
| **Total** | **90** | |

**One-line disposition:** ~53 of the 90 (`Merge`/`Form`/`Cut`/`Variety` + the merging `Preparation`s) collapse into an existing base identity as an alias / form / cut / variety and never earn a new slug. ~26 should become **their own canonical identity** (the 21 `Separate` + the splitting `Preparation`s such as `peanut-butter`, `ghee`, `vanilla-extract`) — the resolver merged them only because an existing identity's alias set was **too greedy**. `olive-oil` is the single true editorial escalation.

---

## 1. Method — the classification taxonomy

Each candidate is classified as **exactly one** of the seven labels. The labels sit on one axis (governance disposition); the **Recommended canonical ownership** column then states precisely where the facts live.

| Label | Definition | Default ownership |
|---|---|---|
| **Merge into existing food** | A pure synonym — regional name, spelling/plural variant, or a duplicate that names the very same real-world food. | Record as an **alias** of the target. No new slug. |
| **Separate canonical food** | The draft is a genuinely distinct fact owner (different plant part, species, milk source, fat class, whole-vs-refined, or milled flour) that the resolver over-merged into a coarser/different identity. | **Mint its own identity**; narrow the offending alias on the target. |
| **Variety** | A cultivar / breed / named market variety of the base whose nutrient profile does not materially diverge. | Merge into base as a **named variety** (alias), unless THA later approves a variety fact owner. |
| **Cut** | An anatomical portion of an animal. Cuts differ in macros but THA has **not** approved cut-level fact owners ([draft `form_policy`](../knowledge/canonical-foods/drafts/batch-018-meat-game/beef-mince.yaml)). | Merge into the **base animal**; record the cut as preparation metadata. |
| **Form** | The same food in a different physical format/state — mince, flakes, ground, whole, powder, pasta shape. `form_policy`: format is never a new identity. | Merge into **base**; record as a form. |
| **Preparation** | A processed derivative made *from* the base by a transformation (extraction, clarifying, roasting, grinding-to-paste, fermenting, smoking). | Usually a **distinct** fact owner (own identity); a few merge. Stated per row. |
| **Editorial review required** | A genuine identity-**hierarchy** question (which of two names is the parent scope) that a human must settle before any merge or mint. | Deferred. |

**The decisive test (GOV2 / Core Principle 2):** *can the two names ever need to disagree on a fact* (nutrient profile, benefit, GI, allergen, milk source, fibre class)? **Yes → separate identity. No → alias/form/variety/cut merge.**

**Precedent anchors used** — this run and the TS seed already minted these as their *own* identities, so their un-imported siblings must be treated consistently:

- Milk fat classes: `semi-skimmed-milk`, `lactose-free-milk` minted → so `skimmed-milk` is a separate fat class.
- Cream grades: `single-cream` minted, `double-cream` exists → so `whipping-cream` is a separate grade.
- Species offal: `pork-liver`, `calves-liver` minted → so `beef-liver`/`chicken-liver`/`lamb-liver` must be separate too (yet generic `liver` **over-aliases** them — see §2.1).
- Named blue cheeses: `stilton` exists; `dolcelatte`/`st-agur`/`yorkshire-blue` minted → so `gorgonzola`/`roquefort` are separate (generic `blue-cheese`'s own description names them — §2.2).
- Flours: 19 flours minted (`plain-wheat-flour`, `semolina-flour`, `chestnut-flour`…) → so `buckwheat-/oat-/rye-/wholemeal-flour` are separate flour identities, not the whole grain (§2.3).
- Wholegrain vs refined: `wholewheat-pasta`/`-noodles`/`-spaghetti` minted, `brown-rice` vs `white-rice` both exist → so `wholewheat-couscous` is separate.
- Age class: `veal` minted (young beef) → so `mutton` (adult sheep) is separate.
- Already-minted near-duplicates: `pearl-couscous` minted → `giant-couscous` is its synonym; `cacao-powder` minted → `cocoa-powder` is its synonym.

---

## 2. Cross-cutting governance findings (the important signals)

### 2.1 Generic `liver` over-aliases species livers — inconsistent with minted `pork-liver`/`calves-liver`
`shared/knowledge/foods.ts` `liver` carries `aliases: ["chicken liver", "lamb's liver", "beef liver", "pig's liver", "chicken livers"]`. That greedy alias set is why `beef-liver`, `chicken-liver`, `lamb-liver` all hard-blocked as merges — **while `pork-liver` and `calves-liver` were minted as their own identities** in the same run (NK6P §4). Species livers differ materially (vitamin A, copper, iron), so the consistent ruling is **separate identity per species liver**. **Recommended fix:** strip the species-specific strings from `liver`'s alias set (keep `liver` as the coarse fallback), then mint `beef-liver`/`chicken-liver`/`lamb-liver`.

### 2.2 Generic `blue-cheese` over-aliases named PDO cheeses
`blue-cheese`'s description literally reads *"including Stilton, Gorgonzola, and Roquefort"* and **`stilton` already has its own identity** (as do `dolcelatte`, `st-agur`, `yorkshire-blue` from this run). `gorgonzola` and `roquefort` must therefore be **separate** named cheeses, not folded into the generic. Same pattern: `grana-padano` is a distinct PDO from `parmesan` (cf. `pecorino`, `comte`, `gruyere`, `emmental` all minted separately).

### 2.3 Milled flours were merged into their whole grain
`buckwheat-flour`→`buckwheat`, `oat-flour`→`oats`, `rye-flour`→`rye`, `wholemeal-flour`→`wheat` collided with the **grain**, not a flour. But the platform mints flours as first-class identities (19 this run). A flour is a distinct culinary fact owner. **Separate**, consistent with peers.

### 2.4 Resolver mis-targets — the merge target is the *wrong* existing food
Two drafts resolved to a plausible-but-incorrect neighbour when a closer already-minted identity exists:
- `cocoa-powder` → `dark-chocolate` **✗** — cocoa powder is defatted cocoa, not chocolate. It is a synonym of the already-minted **`cacao-powder`**. → Merge into `cacao-powder`.
- `giant-couscous` → `couscous` **✗** — giant couscous *is* pearl couscous (mograbiah), and **`pearl-couscous` was minted this run**. → Merge into `pearl-couscous`.

### 2.5 Scope inversions — the draft is *broader* than the identity it resolved to
- `olive-oil` → `extra-virgin-olive-oil`: the generic (which includes refined/light olive oil, different polyphenols & smoke point) resolved into the *narrower* EVOO. This is a hierarchy question — should `extra-virgin-olive-oil` be re-parented under a generic `olive-oil`? **Editorial review required** (§4, batch 012).
- `fennel-seeds` → `fennel` (a **Vegetable**, the bulb): seed-spice vs bulb-vegetable are different parts. → Separate (mirrors `coriander` the herb vs `coriander-seeds` minted).
- `fenugreek-leaves` → `fenugreek` (a **Spice**, the seed): leaf (methi) vs seed are different parts. → Separate.

### 2.6 Cross-batch duplicate drafts (source hygiene, from NK6P §9.2)
`chicken-liver` (batches 017 **and** 019) and `live-yoghurt` (batches 013 **and** 020) each appear **twice** among the 90 and are classified identically in both rows below. Deduplicate the source drafts to one owning batch before any action.

---

## 3. Per-batch classification (all 90)

### Batch 007 — whole-grains-cereals-rice (9)

| Draft | → Resolved to | Classification | Reason | Recommended canonical ownership |
|---|---|---|---|---|
| `basmati-rice` | white-rice | **Variety** | Long-grain aromatic rice cultivar; profile ≈ white rice. | `white-rice` (named variety alias). Brown basmati would go under `brown-rice`. |
| `jasmine-rice` | white-rice | **Variety** | Aromatic long-grain cultivar; profile ≈ white rice. | `white-rice` (variety alias). |
| `risotto-rice` | white-rice | **Variety** | Arborio/carnaroli short-grain cultivar; higher-starch but same fact class. | `white-rice` (variety alias). |
| `sushi-rice` | white-rice | **Variety** | Short-grain cultivar. (Seasoned sushi rice = out-of-scope preparation.) | `white-rice` (variety alias). |
| `jumbo-oats` | oats | **Form** | Large rolled-oat flake — a physical format of the same grain. | `oats`. |
| `rolled-oats` | oats | **Form** | Flattened oat flake. **Flag:** `steel-cut-oats` & `oat-groats` were minted separately this run — reconcile whether oat cut/format ever owns facts. | `oats`. |
| `maize` | corn | **Merge into existing food** | British/botanical synonym of corn. Note: `corn`'s display name is "Sweetcorn" (the vegetable) — confirm the grain vs veg scope. | `corn` (alias `maize`). |
| `pearl-barley` | barley | **Form** | Pearled/polished milling format. Minor bran loss vs pot barley — accept as form unless THA wants a refined-grain split. | `barley`. |
| `wholewheat-couscous` | couscous | **Separate canonical food** | Wholegrain variant; platform keeps whole-vs-refined distinct (`wholewheat-pasta/-noodles` minted; `brown-rice`≠`white-rice`). | Mint `wholewheat-couscous`; keep `couscous` as the refined identity. |

### Batch 008 — flours-baking-staples (6)

| Draft | → Resolved to | Classification | Reason | Recommended canonical ownership |
|---|---|---|---|---|
| `buckwheat-flour` | buckwheat | **Separate canonical food** | A milled flour is a first-class culinary fact owner (19 flours minted this run); resolver over-merged into the whole grain. | Mint `buckwheat-flour`; narrow `buckwheat`'s "flour" alias. |
| `oat-flour` | oats | **Separate canonical food** | Same as above — flour ≠ whole grain. | Mint `oat-flour`. |
| `rye-flour` | rye | **Separate canonical food** | Flour, not the grain (`rye-grain` also minted separately). | Mint `rye-flour`. |
| `cornmeal` | polenta | **Merge into existing food** | Target `polenta` is itself the ground-corn identity; cornmeal is the generic name for it. (Contrast §2.3: this collided with a *flour/meal* identity, not the grain.) | `polenta` (alias `cornmeal`); record grind coarseness as a form note. |
| `vanilla-extract` | vanilla | **Preparation** | Alcohol extraction — a distinct pantry product from the bean/pod, different use & composition. | Mint `vanilla-extract` (distinct fact owner). Relates to `vanilla-pod` (NK6P §7). |
| `wholemeal-flour` | wheat | **Separate canonical food** | Wholemeal **wheat flour**, not the grain; the wholemeal counterpart of the minted `plain-wheat-flour`. | Mint `wholemeal-flour`; narrow `wheat`'s alias. |

### Batch 009 — fresh-herbs-soft-herbs (3)

| Draft | → Resolved to | Classification | Reason | Recommended canonical ownership |
|---|---|---|---|---|
| `curly-parsley` | parsley | **Variety** | Leaf-shape variety of the same herb. | `parsley` (variety alias). |
| `flat-leaf-parsley` | parsley | **Variety** | Leaf-shape variety of the same herb. | `parsley` (variety alias). |
| `fenugreek-leaves` | fenugreek | **Separate canonical food** | Fresh leaf (methi) vs `fenugreek` the **seed spice** — different plant part, different nutrients/use. Mirrors `coriander-leaf` (NK6P §7). | Mint `fenugreek-leaves`; confirm `fenugreek` = seed scope. |

### Batch 010 — spices-seasoning-plants (8)

| Draft | → Resolved to | Classification | Reason | Recommended canonical ownership |
|---|---|---|---|---|
| `black-peppercorns` | black-pepper | **Form** | Whole-vs-ground format of the same spice. | `black-pepper`. |
| `white-pepper` | black-pepper | **Separate canonical food** | Same species (*Piper nigrum*) but ripe berry, hull removed — a distinct pantry spice with its own flavour/use. | Mint `white-pepper`. |
| `chilli-flakes` | chilli | **Form** | Dried/crushed format of chilli. | `chilli`. |
| `cumin-seeds` | cumin | **Merge into existing food** | `cumin` (Spices) *is* the seed spice — synonym. | `cumin` (alias). |
| `ground-cumin` | cumin | **Form** | Ground format of the same spice. | `cumin`. |
| `fennel-seeds` | fennel | **Separate canonical food** | `fennel` is the **bulb Vegetable**; the seed is a different part/spice. Cf. `coriander-seeds` minted separately from herb `coriander`. | Mint `fennel-seeds` (Spice). |
| `fenugreek-seeds` | fenugreek | **Merge into existing food** | `fenugreek` (Spices) already *is* the seed spice — synonym (whole-vs-ground is a form note). | `fenugreek` (alias). |
| `smoked-paprika` | paprika | **Preparation** | Smoke-dried pimentón — a distinct spice product (flavour, use) from sweet paprika. | Mint `smoked-paprika` (or `paprika` variety if THA prefers). |

### Batch 011 — nuts-seeds-mushrooms (4)

| Draft | → Resolved to | Classification | Reason | Recommended canonical ownership |
|---|---|---|---|---|
| `button-mushrooms` | white-mushrooms | **Merge into existing food** | Immature white mushroom — the same cultivated *Agaricus bisporus*. (`chestnut-mushrooms` = the brown variety, already separate.) | `white-mushrooms` (alias). |
| `cashew-nuts` | cashews | **Merge into existing food** | Plural/naming synonym. | `cashews` (alias). |
| `flaxseeds` | flaxseed | **Merge into existing food** | Plural / linseed synonym. | `flaxseed` (alias). |
| `macadamia-nuts` | macadamia | **Merge into existing food** | Naming synonym. | `macadamia` (alias). |

### Batch 012 — oils-fats-vinegars (4)

| Draft | → Resolved to | Classification | Reason | Recommended canonical ownership |
|---|---|---|---|---|
| `clarified-butter` | butter | **Preparation** | Butter with water/milk solids removed — lactose/casein-free, higher smoke point. Distinct from butter. | Merge with `ghee` into **one** identity (`ghee` / `clarified-butter`), distinct from `butter`. |
| `ghee` | butter | **Preparation** | Clarified butter (cooked longer). Distinct fact owner from butter. | Same single `ghee`/`clarified-butter` identity; do not fold into `butter`. |
| `olive-oil` | extra-virgin-olive-oil | **Editorial review required** | Scope **inversion**: generic olive oil (incl. refined/light — different polyphenols/smoke point) resolved into the *narrower* EVOO. Hierarchy decision needed. | Decide: re-parent `extra-virgin-olive-oil` under a new generic `olive-oil`, **or** keep EVOO as canonical and alias "olive oil". Do not merge blindly. |
| `toasted-sesame-oil` | sesame-oil | **Preparation** | Pressed from roasted seeds — a distinct product (flavour, finishing use) from plain sesame oil. | Mint `toasted-sesame-oil` (or `sesame-oil` variety). |

### Batch 013 — fermented-foods-condiments (4)

| Draft | → Resolved to | Classification | Reason | Recommended canonical ownership |
|---|---|---|---|---|
| `live-yoghurt` | live-yogurt | **Merge into existing food** | Spelling variant (yoghurt/yogurt). Cross-batch dup (also batch 020). | `live-yogurt` (alias). |
| `miso-paste` | miso | **Merge into existing food** | `miso` *is* the paste — synonym. | `miso` (alias). |
| `peanut-butter` | peanuts | **Preparation** | Ground roasted peanuts — a distinct pantry product (and often additive-bearing) from whole nuts. | Mint `peanut-butter` (distinct fact owner). |
| `preserved-lemons` | lemon | **Preparation** | Salt-fermented lemons — very high salt, fermented, condiment use; not fresh fruit. | Mint `preserved-lemons` (fermented condiment). |

### Batch 014 — tea-coffee-cocoa-beverages (2)

| Draft | → Resolved to | Classification | Reason | Recommended canonical ownership |
|---|---|---|---|---|
| `cocoa-powder` | dark-chocolate | **Merge into existing food** | Resolver mis-target (§2.4): cocoa powder is defatted cocoa, not chocolate. It is a synonym of the minted `cacao-powder`. | `cacao-powder` (alias `cocoa-powder`); **not** `dark-chocolate`. |
| `coconut-water` | coconut | **Separate canonical food** | The clear liquid endosperm — a distinct food/beverage from coconut flesh, different nutrients (electrolytes vs fat). | Mint `coconut-water`. |

### Batch 015 — oily-fish-white-fish (2)

| Draft | → Resolved to | Classification | Reason | Recommended canonical ownership |
|---|---|---|---|---|
| `coley` | pollock | **Merge into existing food** | Coley/coalfish is sold and used interchangeably with pollock (near-identical white fish); market synonym. Note: biologically a distinct *Pollachius* species. | `pollock` (alias `coley`/`saithe`). |
| `pilchards` | sardines | **Merge into existing food** | Pilchards are mature sardines (same species, *Sardina pilchardus*). | `sardines` (alias `pilchards`). |

### Batch 016 — shellfish-seafood-sea-veg (5)

| Draft | → Resolved to | Classification | Reason | Recommended canonical ownership |
|---|---|---|---|---|
| `brown-crab` | crab | **Variety** | The common edible crab species; `crab` already aliases "brown crab" and lumps spider/dressed crab. | `crab` (variety alias). Disambiguate from "brown crab **meat**" if THA splits meat types. |
| `calamari` | squid | **Merge into existing food** | Culinary/Italian name for squid. | `squid` (alias `calamari`). |
| `cuttlefish` | squid | **Separate canonical food** | A different cephalopod (*Sepia*), not squid (*Loligo*) — distinct animal. Resolver over-merged. | Mint `cuttlefish`. |
| `king-prawns` | prawns | **Form** | Size grade of prawns — a format, not a species. | `prawns`. |
| `shrimp` | prawns | **Merge into existing food** | Regional synonym (US "shrimp" = UK "prawns"). | `prawns` (alias `shrimp`). |

### Batch 017 — poultry-eggs (10)

| Draft | → Resolved to | Classification | Reason | Recommended canonical ownership |
|---|---|---|---|---|
| `chicken-breast` | chicken | **Cut** | Lean anatomical cut; no THA-approved cut fact owner (`form_policy`). | `chicken` (cut metadata). |
| `chicken-mince` | chicken | **Form** | Minced format. | `chicken`. |
| `chicken-thighs` | chicken | **Cut** | Anatomical cut (darker, fattier than breast). | `chicken` (cut metadata). |
| `whole-chicken` | chicken | **Merge into existing food** | Whole bird *is* the base `chicken`. | `chicken` (alias). |
| `duck-breast` | duck | **Cut** | Anatomical cut. | `duck` (cut metadata). |
| `duck-legs` | duck | **Cut** | Anatomical cut. | `duck` (cut metadata). |
| `turkey-breast` | turkey | **Cut** | Anatomical cut. | `turkey` (cut metadata). |
| `turkey-mince` | turkey | **Form** | Minced format. | `turkey`. |
| `hen-eggs` | eggs | **Merge into existing food** | Hen eggs = chicken eggs = the default `eggs`. | `eggs` (alias). |
| `chicken-liver` | liver | **Separate canonical food** | Species offal; consistent with minted `pork-liver`/`calves-liver`. `liver`'s greedy alias caused the merge (§2.1). Cross-batch dup (also 019). | Mint `chicken-liver`; strip alias from generic `liver`. |

### Batch 018 — meat-game (12)

| Draft | → Resolved to | Classification | Reason | Recommended canonical ownership |
|---|---|---|---|---|
| `beef-mince` | beef | **Form** | Minced format (`form_policy`). | `beef`. |
| `lamb-chops` | lamb | **Cut** | Anatomical cut. | `lamb` (cut metadata). |
| `lamb-leg` | lamb | **Cut** | Anatomical cut. | `lamb` (cut metadata). |
| `lamb-mince` | lamb | **Form** | Minced format. | `lamb`. |
| `lamb-shoulder` | lamb | **Cut** | Anatomical cut. | `lamb` (cut metadata). |
| `mutton` | lamb | **Separate canonical food** | Meat of adult sheep — distinct flavour/fat/texture from lamb (young). Mirrors `veal` (young beef) minted separately. | Mint `mutton` (age class of sheep). |
| `pork-belly` | pork | **Cut** | Anatomical cut (high-fat). | `pork` (cut metadata). |
| `pork-chops` | pork | **Cut** | Anatomical cut. | `pork` (cut metadata). |
| `pork-mince` | pork | **Form** | Minced format. | `pork`. |
| `pork-tenderloin` | pork | **Cut** | Anatomical cut (lean). | `pork` (cut metadata). |
| `venison-mince` | venison | **Form** | Minced format; `venison` already aliases "venison mince". | `venison`. |
| `venison-steak` | venison | **Cut** | Anatomical cut; `venison` already aliases "venison steak". | `venison` (cut metadata). |

### Batch 019 — offal-high-nutrient-animal (3)

| Draft | → Resolved to | Classification | Reason | Recommended canonical ownership |
|---|---|---|---|---|
| `beef-liver` | liver | **Separate canonical food** | Species offal; higher vitamin A/copper than generic. Consistent with minted `pork-liver`/`calves-liver` (§2.1). | Mint `beef-liver`; strip alias from generic `liver`. |
| `chicken-liver` | liver | **Separate canonical food** | As batch 017 row (cross-batch dup — deduplicate source drafts). | Mint `chicken-liver`; strip alias from `liver`. |
| `lamb-liver` | liver | **Separate canonical food** | Species offal, distinct profile. | Mint `lamb-liver`; strip alias from `liver`. |

### Batch 020 — milk-yoghurt-cultured-dairy (6)

| Draft | → Resolved to | Classification | Reason | Recommended canonical ownership |
|---|---|---|---|---|
| `live-yoghurt` | live-yogurt | **Merge into existing food** | Spelling variant (cross-batch dup with 013). | `live-yogurt` (alias). |
| `natural-yoghurt` | live-yogurt | **Merge into existing food** | Plain set yoghurt; treat as the base cultured yoghurt. *Editorial note:* if THA wants to distinguish non-live/heat-treated set yoghurt, split later. | `live-yogurt` (alias). |
| `skimmed-milk` | milk | **Separate canonical food** | Fat class (~0.1% fat) — consistent with minted `semi-skimmed-milk`. | Mint `skimmed-milk`; keep `milk` as generic/whole default. |
| `whole-milk` | milk | **Merge into existing food** | Whole milk is the default `milk` identity. | `milk` (alias `whole-milk`). |
| `soured-cream` | sour-cream | **Merge into existing food** | Spelling/regional variant of `sour-cream`. | `sour-cream` (alias). |
| `whipping-cream` | double-cream | **Separate canonical food** | Distinct cream grade (~35% fat vs double ~48%); consistent with `single-cream` minted. | Mint `whipping-cream`. |

### Batch 021 — core-cheeses (4)

| Draft | → Resolved to | Classification | Reason | Recommended canonical ownership |
|---|---|---|---|---|
| `gorgonzola` | blue-cheese | **Separate canonical food** | Named PDO blue cheese; `blue-cheese`'s own description names it, and `stilton` is already separate (§2.2). | Mint `gorgonzola`; keep `blue-cheese` as the family fallback. |
| `roquefort` | blue-cheese | **Separate canonical food** | Named PDO (sheep's-milk) blue cheese — distinct milk source & profile. | Mint `roquefort`. |
| `grana-padano` | parmesan | **Separate canonical food** | Distinct PDO from Parmigiano (different rules/aging); consistent with `pecorino`/`comte`/`gruyere` minted. | Mint `grana-padano`. |
| `mature-cheddar` | cheddar | **Variety** | Aging/maturity of the same cheese — not a new fact owner. | `cheddar` (maturity variety/alias). |

### Batch 022 — extended-cheeses-dairy (1)

| Draft | → Resolved to | Classification | Reason | Recommended canonical ownership |
|---|---|---|---|---|
| `buffalo-mozzarella` | mozzarella | **Separate canonical food** | Made from **buffalo** milk (PDO), distinct source & profile (higher fat) from cow-milk mozzarella. | Mint `buffalo-mozzarella`; keep `mozzarella` as the cow-milk identity. |

### Batch 023 — plain-pasta-noodles-starches (7)

| Draft | → Resolved to | Classification | Reason | Recommended canonical ownership |
|---|---|---|---|---|
| `fusilli` | pasta | **Form** | Pasta shape — same dough, nutritionally identical. | `pasta` (shape/form). |
| `macaroni` | pasta | **Form** | Pasta shape. | `pasta`. |
| `penne` | pasta | **Form** | Pasta shape. | `pasta`. |
| `rigatoni` | pasta | **Form** | Pasta shape. | `pasta`. |
| `spaghetti` | pasta | **Form** | Pasta shape. (Contrast: `wholewheat-spaghetti` minted separately — the *grain class* differs, not the shape.) | `pasta`. |
| `tagliatelle` | pasta | **Form** | Pasta shape. | `pasta`. |
| `giant-couscous` | couscous | **Merge into existing food** | Resolver mis-target (§2.4): giant couscous = pearl couscous (mograbiah), and `pearl-couscous` was minted this run. | `pearl-couscous` (alias `giant-couscous`); **not** `couscous`. |

---

## 4. Recommended actions (governed follow-ups — none performed here)

1. **Mint the 21 `Separate canonical food` identities** + the splitting `Preparation`s (`peanut-butter`, `ghee`/`clarified-butter` as one, `vanilla-extract`, `smoked-paprika`, `toasted-sesame-oil`, `preserved-lemons`) via the governed importer, **after** narrowing the greedy aliases below.
2. **Narrow over-greedy alias sets** on existing identities so the mints don't re-block:
   - `liver` — drop `"beef liver"`, `"chicken liver"`, `"lamb's liver"` (keep coarse fallback).
   - `blue-cheese` — drop `gorgonzola`/`roquefort` scope; keep as the family term.
   - `buckwheat`/`oats`/`rye`/`wheat` — drop the "…flour" aliases.
   - `fennel` (Vegetable) — drop "fennel seeds"; `fenugreek` (Spice) — keep seed, drop leaf.
3. **Record the merges** (`Merge`/`Form`/`Cut`/`Variety` = ~53 drafts) as aliases / form / cut / variety metadata on the base identity — a content edit, never a new slug. Fold any richer draft metadata in as enrichment (per NK6P §5).
4. **Settle the one editorial escalation** — `olive-oil` vs `extra-virgin-olive-oil` hierarchy (§4, batch 012 / §2.5) — before any merge or mint.
5. **Deduplicate cross-batch source drafts** — `chicken-liver` (017/019), `live-yoghurt` (013/020) — to one owning batch (NK6P §9.2).
6. Re-validate through the NK6I resolver; each newly-minted identity should then classify 🟢 safe-new, and each alias'd merge should classify 🔵 existing.

**No draft, alias, seed, or database row was modified by this task.**
