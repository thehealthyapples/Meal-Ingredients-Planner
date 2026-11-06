---
title: Uncited Claim Source Research — Batch 2
date: 2026-11-06
author: Claude (Sonnet 5), at the direction of Colin Clapson
audience: Codex (nutrition-source review task) and human reviewer
status: research only — nothing attached to the app or database
---

# Uncited Claim Source Research — Batch 2

Continuation of [Batch 1](./SOURCE_RESEARCH_BATCH1_20261106.md), same method
(offline bulk USDA JSON, word-boundary search, every number read from a real
record — none from search-engine summaries). Read-only research; nothing
attached to the app or database.

## Two findings worth flagging before the claim list

**1. Spice/herb composition claims risk misleading "per 100g" framing.**
Aniseed shows iron 37 mg/100g and magnesium 170 mg/100g — both look like
outstanding sources. But nobody eats 100g of aniseed; a realistic serving is
1–2g, making the *effective* contribution negligible. The brief's own rule
("a positive per-100-g value alone does not establish that an ordinary
serving makes the food a notable source") applies to essentially **every**
spice/herb claim in the queue (allspice, aniseed, basil, bay leaf, and
others seen in this batch). Recommend Codex flag the whole spice/herb
category for human judgment on serving-size realism, not just source
existence.

**2. `baking-powder → fibre` and the `bicarbonate-of-soda` claims look like data-quality defects, not sourcing gaps.** USDA's "Leavening agents, baking
powder" record genuinely shows 2.2g fibre / 100g (starch filler) — a real,
citable number — but at a ~4g (1 tsp) serving that's ~0.09g fibre, nutritionally meaningless. Meanwhile `bicarbonate-of-soda` (pure NaHCO₃) has
three claims queued — fibre, manganese, protein — and no matching USDA
record exists at all, because pure sodium bicarbonate has none of these in
any measurable sense. **Recommend these go back to whoever curated the claim
list, not to source research** — they look like entries that shouldn't have
been generated.

## Findings

| Claim ID | Food | Nutrient | Source | Value (per 100g) | Match | Limitations | Recommendation |
|---|---|---|---|---|---|---|---|
| 4391 | aniseed | iron | USDA FDC 171316 "Spices, anise seed" (SR Legacy) | 37 mg | Direct | **Serving-size caution** — see finding #1 above | **Flag for human review** |
| 4392 | aniseed | magnesium | same record | 170 mg | Direct | Same serving-size caution | **Flag for human review** |
| 547 | artichoke | fibre | USDA FDC 168386 "Artichokes, (globe or french), cooked, boiled, drained, without salt" (SR Legacy) | 5.7 g | Direct | None | **Candidate** |
| 1181 | barley | fibre | USDA FDC 170285 "Barley, pearled, cooked" (SR Legacy) | 3.8 g | Direct | Pearled/cooked form; hulled barley (raw) would read higher | **Candidate** |
| 1182 | barley | selenium | same record | 8.6 µg | Direct | Same form note | **Candidate** |
| 4831 | beef-heart | iron | USDA FDC 169448 "Beef, variety meats and by-products, heart, cooked, simmered" (SR Legacy) | 6.38 mg | Direct | None | **Candidate** |
| 4830 | beef-heart | protein | same record | 28.5 g | Direct | None | **Candidate** |
| 4833 | beef-heart | vitamin-b12 | same record | 10.8 µg | Direct | None | **Candidate** |
| 4832 | beef-heart | zinc | same record | 2.87 mg | Direct | None | **Candidate** |
| 4776 | beef-short-ribs | protein | USDA FDC 171222 "Beef, chuck, short ribs, boneless, separable lean and fat, trimmed to 0\" fat, all grades, cooked, braised" (SR Legacy) | 25.5 g | Reasonable — lean-and-fat generic cut chosen over a specific grade | Several near-duplicate records exist by fat trim/grade/cooked state; this is a judgment call on which is "the" generic short rib | **Candidate, flag record choice** |
| 4777 | beef-short-ribs | iron | same record | 2.7 mg | Same as above | Same as above | **Candidate, flag record choice** |
| 4779 | beef-short-ribs | vitamin-b12 | same record | 3.45 µg | Same as above | Same as above | **Candidate, flag record choice** |
| 4778 | beef-short-ribs | zinc | same record | 9.73 mg | Same as above | Same as above | **Candidate, flag record choice** |
| 4838 | beef-tongue | protein | USDA FDC 170598 "Beef, variety meats and by-products, tongue, cooked, simmered" (SR Legacy) | 19.3 g | Direct | None | **Candidate** |
| 4839 | beef-tongue | iron | same record | 2.61 mg | Direct | None | **Candidate** |
| 4841 | beef-tongue | vitamin-b12 | same record | 3.13 µg | Direct | None | **Candidate** |
| 4840 | beef-tongue | zinc | same record | 4.09 mg | Direct | None | **Candidate** |
| 4784 | bison | protein | USDA FDC 174421 "Game meat, bison, ground, raw" (SR Legacy) | 18.7 g | Reasonable — raw ground chosen as the generic default | Cooked values would read higher (water loss); several cut-specific records also exist | **Candidate, flag record choice** |
| 4785 | bison | iron | same record | 2.6 mg | Same as above | Same as above | **Candidate, flag record choice** |
| 4787 | bison | vitamin-b12 | same record | 1.79 µg | Same as above | Same as above | **Candidate, flag record choice** |
| 4786 | bison | zinc | same record | 4.29 mg | Same as above | Same as above | **Candidate, flag record choice** |
| 4306 | bicarbonate-of-soda | fibre | — | — | — | No matching record; pure NaHCO₃ has no fibre | **Leave uncited — likely a data-quality defect, see finding #2** |
| 4307 | bicarbonate-of-soda | manganese | — | — | — | Same | **Leave uncited — likely a data-quality defect** |
| 4308 | bicarbonate-of-soda | protein | — | — | — | Same | **Leave uncited — likely a data-quality defect** |
| 4303 | baking-powder | fibre | USDA FDC 172805 "Leavening agents, baking powder, low-sodium" (SR Legacy) | 2.2 g | Technically direct | **Meaningless at a real ~4g (1 tsp) serving (~0.09g) — see finding #2** | **Leave uncited (or flag for a serving-adjusted claim, not per-100g)** |
| — | asiago | calcium / iodine / protein | — | — | — | No USDA record for this specific cheese (checked SR Legacy + Foundation, zero hits) | **Leave uncited** |
| — | arame | fibre / iodine | — | — | — | No USDA record (this seaweed isn't tracked in either dataset) | **Leave uncited — try CoFID or a specialty seaweed source separately** |
| — | basa | iodine / protein / selenium / vitamin-b12 | — | — | — | No USDA record (Vietnamese catfish not tracked) | **Leave uncited** |
| — | anchovy-paste | iodine / protein / selenium | — | — | — | No USDA record for the paste/processed form (only whole-fish anchovy records exist — see Batch 1) | **Leave uncited, or reconsider using the whole-fish anchovy record with a stated form caveat** |
| — | beef-cheek | — | — | — | — | No USDA record (only a false match on fish cheeks) | **Leave uncited** |
| — | beef-bones | calcium / protein | — | — | — | No USDA record — "bones" isn't a standalone composition entry in this dataset | **Leave uncited** |
| — | baby-corn | fibre / folate / vitamin-c | — | — | — | No USDA record distinct from regular corn | **Leave uncited, or try CoFID separately** |
| — | bean-sprouts | fibre / folate / vitamin-c | — | — | — | No match under several phrasings tried ("bean sprouts", "beansprout") | **Needs a different search term — not yet exhausted, retry next pass** |
| — | beluga-lentils | anthocyanins / fibre / iron / plant-protein / protein | — | — | — | No match for "beluga" or "lentils, black" — USDA likely uses a different name for this variety, if tracked at all | **Needs a different search term — not yet exhausted, retry next pass** |
| — | beetroot-juice | polyphenols / vitamin-c | — | — | — | No match for "beet juice" | **Needs a different search term — not yet exhausted, retry next pass** |
| — | bilberry | anthocyanins / fibre / polyphenols | — | — | — | No match for "bilberries" | **Needs a different search term (try "huckleberry" or check CoFID — bilberry is more a UK/European fruit) — retry next pass** |
| 155 | apples | flavonoids | — | — | — | Real source exists (USDA Flavonoid Database Release 3.3) but distributed as a Microsoft Access file, not JSON — needs separate tooling, not covered by this method | **Deferred — see Batch 1's flavonoid-database note** |
| 141 / 139 | beetroot | anthocyanins / nitrates | — | — | — | Same flavonoid-database situation for anthocyanins; nitrates is tracked by neither USDA dataset nor the flavonoid DB — would need a specialized nitrate source | **Deferred / leave uncited** |

## Running totals (Batches 1+2)

- **26 candidates** found and verified against primary USDA records (some flagged for a record-choice or arithmetic-convention judgment call).
- **9 "leave uncited"** — 2 structural (polyphenols has no coverage anywhere in this data family), 4 no matching USDA record exists for that specific food/form, 1 data-quality concern (baking powder), 2 likely-erroneous claims (bicarbonate of soda).
- **5 "needs another search pass"** — not exhausted, just not found with the terms tried so far.
- **3 flagged for serving-size realism** (spices — a category-wide caution, not per-claim).
- **3 fortification flags** (almond milk, Batch 1).
- This covers roughly 16 foods / ~45 of the 1,018 uncited composition claims. Food→benefit and nutrient→benefit edges haven't been started yet.
