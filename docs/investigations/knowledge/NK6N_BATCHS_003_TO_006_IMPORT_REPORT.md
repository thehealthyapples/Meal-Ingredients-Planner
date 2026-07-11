# NK6N — Canonical Food Batches 003–006 Import Report

**Date:** 2026-07-07
**Author:** Claude Code (validation + governed import)
**Branch:** `int1-intelligence-platform`
**Scope:** Validate **Batch 003, 004, 005, 006** through the NK6I‑fixed **alias‑aware canonical food identity resolver** (`@shared/canonical` → `resolveCanonicalFood`) and the **GOV2 canonical vocabulary** (`resolveNutrientTerm` / `resolveBenefitTerm`), classify every food, and **import only the safe‑new identities**. No `--force-upsert`. No duplicate foods, nutrients, or benefits. `manifest.yaml`, `README.md`, and `CLAUDE_VALIDATE_*_PROMPT.md` never processed.
**Governing docs read first:** `docs/architecture/README.md` bootstrap → **GOV2 Canonical Alias Principle** → `docs/investigations/knowledge/NK6J_CANONICAL_FOOD_BATCH_001_002_IMPORT_PLAN.md` (predecessor method).

---

## 0. Rollback identifier

| Item | Value |
|---|---|
| **Rollback tag (this task)** | `NK6N-rollback-pre-import` → `45443a8f81c8a28ede0586192dd2965ba3aaf87a` |
| **Prior anchor (still present)** | `NK6I-rollback-pre-investigation` → same commit |
| **Current HEAD** | `45443a8f81c8a28ede0586192dd2965ba3aaf87a` (unchanged — this task made **no code commits**) |
| **Restore committed state** | `git reset --hard NK6N-rollback-pre-import` |
| **Database rollback** | This task **wrote 46 new food identities + 89 nutrient + 92 benefit relationship rows**. To undo: delete `knowledge_food` rows for the 46 slugs in §3 (relationship rows cascade / are keyed by `food_slug`). See §7 for the exact slug list. |

The 46 imported slugs did not exist before this run (verified: `knowledge_food` count **265 → 311**, delta **+46**, exactly the safe‑new set — no stray identities were minted).

---

## 1. Database target confirmation — Replit dev (lower) environment

| Marker | Value | Meaning |
|---|---|---|
| `DATABASE_URL` host / db | `helium` / `heliumdb` (user `pos***`) | app's single configured DB |
| `REPL_ID` | `a6376337-…` (set) | inside a Replit workspace |
| `REPLIT_DEPLOYMENT` | **unset** | **dev workspace, NOT a deployment** |
| `REPLIT_DEV_DOMAIN` | `…spock.replit.dev` (set) | interactive dev domain |
| `NODE_ENV` | unset | not production‑flagged |

**Assessment:** Replit dev workspace (lower environment) — consistent with NK6I/NK6J. Not a deployment. Import authorised for safe‑new identities only.

---

## 2. Method

The importer (`server/lib/canonical-foods-importer.ts`) resolves the incoming identity through the single GOV2 food resolver **before** minting (NK6I Step 3a), then blocks exact‑slug duplicates (Step 3b). Classification is therefore identical to the importer's own decision path:

| Class | Icon | Importer behaviour | Action taken |
|---|---|---|---|
| **safe new import** | 🟢 | no collision, slug absent → clean insert | **imported** |
| **existing exact identity** | 🔵 | slug already present → Step 3b blocks (no `--force-upsert`) | enrichment‑only; not re‑minted |
| **alias‑resolved merge candidate** | 🟠 | own identity resolves to a *different* existing food → NK6I hard block | **held for human‑approved merge — never imported** |
| **soft overlap — editorial review** | 🟡 | a declared alias resolves to a different existing identity | **held for editorial review — not imported** |
| **blocked conflict** | ⛔ | parse error / missing slug | blocked |

Validation was run read‑only first via `scripts/nk6j-validate-batches.ts` (zero writes) across all four batch dirs; the safe‑new set was then imported through the governed importer with **no flags** (`npm run import:canonical-foods -- <safe files…>`).

---

## 3. Classification results (120 drafts across 4 batches)

### Batch 003 — Core Everyday Fruit (30 drafts)

| Class | Count | Foods |
|---|---|---|
| 🟢 safe new (IMPORTED) | 4 | `dried-apple`, `dried-pear`, `prune`, `rhubarb` |
| 🔵 existing exact | 10 | avocado, coconut, fig, mango, passion-fruit, pear, pineapple, plantain, pomegranate, watermelon |
| 🟠 merge candidate | 9 | `apple`→apples, `banana`→bananas, `cantaloupe-melon`→melon, `dried-mango`→mango, `galia-melon`→melon, `goji-berry`→goji-berries, `grapes`→grape, `honeydew-melon`→melon, `kiwi-fruit`→kiwi |
| 🟡 editorial review | 7 | `date` (alias "dates"→dates), `dried-apricot` ("dried apricots"→apricot), `dried-cranberry` ("dried cranberries"→cranberry), `dried-fig` ("dried figs"→fig), `olive` ("olives"→olives), `raisin` ("raisins"→raisins), `sultana` ("sultanas"→raisins) |

### Batch 004 — Citrus, Berries & Stone Fruit (30 drafts)

| Class | Count | Foods |
|---|---|---|
| 🟢 safe new (IMPORTED) | 7 | `bilberry`, `blood-orange`, `grapefruit`, `greengage`, `mirabelle-plum`, `tayberry`, `whitecurrant` |
| 🔵 existing exact | 14 | apricot, blackberry, blackcurrant, cherry, clementine, cranberry, gooseberry, lemon, lime, nectarine, peach, plum, raspberry, redcurrant |
| 🟠 merge candidate | 9 | `blueberry`→blueberries, `damson`→plum, `elderberry`→elderberries, `loganberry`→loganberries, `mandarin`→clementine, `mulberry`→mulberries, `orange`→oranges, `satsuma`→clementine, `strawberry`→strawberries |
| 🟡 editorial review | 0 | — |

### Batch 005 — Extended Tropical / Specialist / Dried Fruit (30 drafts)

| Class | Count | Foods |
|---|---|---|
| 🟢 safe new (IMPORTED) | 24 | `boysenberry`, `breadfruit`, `cherimoya`, `cloudberry`, `dragon-fruit`, `dried-banana`, `dried-blueberry`, `dried-gooseberry`, `dried-mulberry`, `dried-papaya`, `dried-pineapple`, `dried-sour-cherry`, `jostaberry`, `kumquat`, `longan`, `mangosteen`, `persimmon`, `pomelo`, `quince`, `rambutan`, `starfruit`, `tamarind`, `tangelo`, `ugli-fruit` |
| 🔵 existing exact | 3 | guava, jackfruit, physalis |
| 🟠 merge candidate | 2 | `lychee`→lychees, `papaya`→papayas |
| 🟡 editorial review | 1 | `dried-coconut` (alias "desiccated coconut"→coconut) |

### Batch 006 — Legumes, Beans, Pulses & Soy Foods (30 drafts)

| Class | Count | Foods |
|---|---|---|
| 🟢 safe new (IMPORTED — see §5 nutrient caveat) | 11 | `adzuki-beans`, `brown-lentils`, `chana-dal`, `flageolet-beans`, `green-split-peas`, `lupin-beans`, `marrowfat-peas`, `mixed-beans`, `mung-beans`, `toor-dal`, `yellow-split-peas` |
| 🔵 existing exact | 15 | black-beans, borlotti-beans, butter-beans, cannellini-beans, chickpeas, edamame, green-lentils, haricot-beans, kidney-beans, lentils, pinto-beans, puy-lentils, red-lentils, tempeh, tofu |
| 🟠 merge candidate | 4 | `black-eyed-beans`→black-eyed-peas, `fava-beans`→broad-beans, `gram-flour`→chickpea-flour, `soya-beans`→edamame |
| 🟡 editorial review | 0 | — |

### Totals

| Class | 003 | 004 | 005 | 006 | **Total** |
|---|---|---|---|---|---|
| 🟢 safe new (imported) | 4 | 7 | 24 | 11 | **46** |
| 🔵 existing exact (enrich‑only) | 10 | 14 | 3 | 15 | **42** |
| 🟠 merge candidate (held) | 9 | 9 | 2 | 4 | **24** |
| 🟡 editorial review (held) | 7 | 0 | 1 | 0 | **8** |
| ⛔ blocked / parse error | 0 | 0 | 0 | 0 | **0** |
| **Drafts** | 30 | 30 | 30 | 30 | **120** |

---

## 4. Foods imported

**46 new canonical food identities minted** (identity + benefit + nutrient relationships, non‑destructive `onConflictDoNothing` upserts). Importer summary: **46 successful, 0 failed; 46 foods, 89 nutrient rows, 92 benefit rows written.**

- **35 of 46 imported cleanly and completely** — the fruit foods of Batches 003, 004, 005 (identity + nutrients + benefits all bound).
- **11 of 46 (Batch 006 legumes) imported identity + benefits, but with ZERO nutrient relationships** — see §5.

No exact‑duplicate identity was created; every 🔵 existing‑exact draft was correctly recognised as an already‑present identity and left untouched (enrichment only, never a second row). No duplicate nutrient‑vocabulary or benefit‑vocabulary rows were created — nutrient/benefit **relationships** are keyed `(food_slug, nutrient_slug)` / `(food_slug, benefit_slug)` with conflict‑ignore.

---

## 5. Editorial decisions required

### 5.1 Missing canonical nutrient `protein` — blocks legume nutrient enrichment (ACTION REQUIRED)

Every Batch‑006 legume names **protein** as a notable nutrient (declared as `plant-protein`). The GOV2 vocabulary resolver **resolves it successfully** (`plant-protein` → canonical slug `protein`, via alias), but the `knowledge_nutrients` table **has no `protein` row** (only 30 nutrient identities exist). The insert therefore fails the foreign key `knowledge_food_nutrients_nutrient_slug_fkey`.

Because the importer binds a food's nutrients in a **single all‑or‑nothing `INSERT … VALUES(rows)`**, the one bad `protein` row **aborts the entire nutrient batch for that food** — so the legumes lost *all* their nutrient bindings (fibre, iron, folate, etc.), not just protein. The importer swallows this as a warning and still reports the food as "successful", which is why the 11 legumes are now in the DB **with benefits but zero nutrients**.

**Decision required (governance — not taken here):** add `protein` to the canonical nutrient vocabulary / `knowledge_nutrients` table. This is *creating a missing canonical nutrient*, not a duplicate — but it is a vocabulary‑ownership decision (GOV2) and was deliberately **not** performed by this import. `protein` is referenced by the resolver as a first‑class canonical slug yet is absent from the persisted nutrient set; this mismatch predates NK6N and affects any food naming protein.

**Follow‑up once `protein` exists:** re‑bind nutrients for the 11 legumes (§7). The governed importer cannot do this on re‑run (their slugs now exist → Step 3b block); a targeted, governed re‑bind (or a one‑time `--force-upsert` on exactly these 11, human‑approved) is required. Until then the legumes carry benefits only.

**Recommended importer hardening (separate follow‑up):** make nutrient binding resilient — bind row‑by‑row (or `onConflictDoNothing` + skip FK‑missing targets) so one unresolved/missing‑target nutrient cannot silently drop a food's entire nutrient set, and downgrade "success" to "partial" when any relationship is dropped.

### 5.2 Merge candidates — 24 foods (🟠, human‑approved merge, never a silent import)

These drafts' **own identity resolves to a different existing canonical food** — importing them would fork a duplicate identity (GOV2 Rule 7 hard block). Each is an **enrichment/merge into the existing identity**, not a new food:

| Draft | Merge into existing | Batch |
|---|---|---|
| `apple` | apples | 003 |
| `banana` | bananas | 003 |
| `cantaloupe-melon` | melon | 003 |
| `dried-mango` | mango | 003 |
| `galia-melon` | melon | 003 |
| `goji-berry` | goji-berries | 003 |
| `grapes` | grape | 003 |
| `honeydew-melon` | melon | 003 |
| `kiwi-fruit` | kiwi | 003 |
| `blueberry` | blueberries | 004 |
| `damson` | plum | 004 |
| `elderberry` | elderberries | 004 |
| `loganberry` | loganberries | 004 |
| `mandarin` | clementine | 004 |
| `mulberry` | mulberries | 004 |
| `orange` | oranges | 004 |
| `satsuma` | clementine | 004 |
| `strawberry` | strawberries | 004 |
| `lychee` | lychees | 005 |
| `papaya` | papayas | 005 |
| `black-eyed-beans` | black-eyed-peas | 006 |
| `fava-beans` | broad-beans | 006 |
| `gram-flour` | chickpea-flour | 006 |
| `soya-beans` | edamame | 006 |

**Note on singular/plural pairs** (`apple`↔apples, `banana`↔bananas, `grapes`↔grape, `orange`↔oranges, `blueberry`↔blueberries, `strawberry`↔strawberries, `elderberry`↔elderberries, `loganberry`↔loganberries, `mulberry`↔mulberries, `lychee`↔lychees, `papaya`↔papayas): the existing canonical seed is inconsistently singular/plural. The resolver correctly binds each draft to the one existing identity; editorial should decide the **preferred canonical surface form** and normalise, then fold the richer draft metadata (aliases, nutrients, benefits) into that single identity.

**Genuine semantic merges** worth an explicit editorial ruling: `cantaloupe-melon`/`galia-melon`/`honeydew-melon` → **melon** (do melon cultivars deserve separate fact ownership, per the batch‑003 manifest note?), `mandarin`/`satsuma` → **clementine**, `damson` → **plum**, `dried-mango` → **mango** (dried vs fresh — likely *should* be a distinct food; see §5.3), `fava-beans` → **broad-beans**, `soya-beans` → **edamame** (soya bean vs edamame are arguably distinct maturities), `gram-flour` → **chickpea-flour**.

### 5.3 Editorial‑review / soft‑overlap — 8 foods (🟡, held, not imported)

The food's **own** identity is distinct, but a **declared alias** overlaps an existing identity — flagged for editorial scope confirmation before any import:

| Draft | Overlapping alias → existing | Batch | Editorial question |
|---|---|---|---|
| `date` | "dates" → dates | 003 | Draft `date` (singular) vs existing `dates` — likely the **same** food; treat as merge into `dates`. |
| `olive` | "olives" → olives | 003 | Draft `olive` vs existing `olives` — likely merge into `olives`. |
| `raisin` | "raisins" → raisins | 003 | Draft `raisin` vs existing `raisins` — likely merge into `raisins`. |
| `sultana` | "sultanas" → raisins | 003 | Sultana's alias resolves to `raisins`. Distinct food or a raisin sub‑type? Confirm before minting. |
| `dried-apricot` | "dried apricots" → apricot | 003 | Genuinely distinct (dried ≠ fresh). The alias should **not** resolve to fresh `apricot`; fix the alias, then it is a clean safe‑new. |
| `dried-cranberry` | "dried cranberries" → cranberry | 003 | Same pattern — distinct dried food; alias mis‑points to fresh `cranberry`. |
| `dried-fig` | "dried figs" → fig | 003 | Same pattern — distinct dried food; alias mis‑points to fresh `fig`. |
| `dried-coconut` | "desiccated coconut" → coconut | 005 | Same pattern — distinct dried/desiccated food; alias mis‑points to fresh `coconut`. |

**Two sub‑patterns:**
- **Singular/plural of an existing food** (`date`, `olive`, `raisin`, and `sultana`→raisins): almost certainly the same identity — **merge**, do not mint.
- **Dried‑variant whose alias mis‑resolves to the fresh food** (`dried-apricot`, `dried-cranberry`, `dried-fig`, `dried-coconut`): the food *is* legitimately new; only the declared alias is too greedy. **Recommended:** narrow/remove the offending alias in the draft, then these become clean 🟢 safe‑new imports (consistent with `dried-apple`, `dried-pear`, `dried-banana`, `dried-blueberry`, etc. which imported cleanly). Held pending that alias correction.

---

## 6. Remaining unresolved items

1. **11 legumes carry zero nutrient relationships** (§5.1) — pending the canonical `protein` nutrient decision + a governed re‑bind. Highest‑priority follow‑up. Slugs: `adzuki-beans`, `brown-lentils`, `chana-dal`, `flageolet-beans`, `green-split-peas`, `lupin-beans`, `marrowfat-peas`, `mixed-beans`, `mung-beans`, `toor-dal`, `yellow-split-peas`.
2. **Missing canonical nutrient `protein`** — resolver knows it, DB lacks it. Vocabulary‑ownership decision required (§5.1).
3. **24 merge candidates** (§5.2) — await human‑approved merge into their existing identities; several need a canonical singular/plural normalisation ruling.
4. **8 editorial‑review foods** (§5.3) — 4 are likely merges (singular/plural), 4 are clean‑new blocked only by an over‑greedy alias.
5. **Importer robustness** — all‑or‑nothing nutrient insert silently drops a food's full nutrient set on one bad target, while still reporting "success" (§5.1). Recommend row‑resilient binding + honest partial‑success reporting.
6. **42 existing‑exact drafts** carry richer metadata (aliases/nutrients/benefits) than the seed identities they match — a governed *enrichment* opportunity (fold metadata into the existing rows; never a second identity). Not performed here.

---

## 7. Appendix — exact imported slug list (for rollback / re‑bind)

**46 imported (`knowledge_food` 265 → 311):**

```
# Batch 003 (4) — full (identity+nutrients+benefits)
dried-apple  dried-pear  prune  rhubarb
# Batch 004 (7) — full
bilberry  blood-orange  grapefruit  greengage  mirabelle-plum  tayberry  whitecurrant
# Batch 005 (24) — full
boysenberry  breadfruit  cherimoya  cloudberry  dragon-fruit  dried-banana  dried-blueberry
dried-gooseberry  dried-mulberry  dried-papaya  dried-pineapple  dried-sour-cherry  jostaberry
kumquat  longan  mangosteen  persimmon  pomelo  quince  rambutan  starfruit  tamarind  tangelo  ugli-fruit
# Batch 006 (11) — identity + benefits only; nutrients pending (§5.1)
adzuki-beans  brown-lentils  chana-dal  flageolet-beans  green-split-peas  lupin-beans
marrowfat-peas  mixed-beans  mung-beans  toor-dal  yellow-split-peas
```

**Commands run (key):**
```
# read-only validation (zero writes)
tsx scripts/nk6j-validate-batches.ts \
  docs/knowledge/canonical-foods/drafts/batch-003-core-everyday-fruit \
  docs/knowledge/canonical-foods/drafts/batch-004-citrus-berries-stone-fruit \
  docs/knowledge/canonical-foods/drafts/batch-005-extended-tropical-specialist-dried-fruit \
  docs/knowledge/canonical-foods/drafts/batch-006-legumes-beans-pulses-soy-foods

# governed import — safe-new files only, NO --force-upsert
npm run import:canonical-foods -- <46 safe-new .yaml files>
```

**No `--force-upsert` used. No `manifest.yaml` / `README.md` / prompt files imported. No duplicate identities, nutrients, or benefits created.**
