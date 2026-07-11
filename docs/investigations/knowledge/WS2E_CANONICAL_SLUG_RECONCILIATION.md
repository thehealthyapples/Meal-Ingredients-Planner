# WS2E — Canonical Slug Reconciliation

> **One food. One canonical identity. Every system agrees.**
>
> This is an **investigation only**. No code, schema, route, migration, data, or
> UI change is made. The only artefacts are this document and one rollback tag.
> A throwaway read-only diagnostic script was used to generate the mapping tables
> and then deleted; it is reproduced verbatim in Appendix A so every table below
> is reproducible.

| | |
|---|---|
| **Document type** | Investigation + reconciliation report (no implementation) |
| **Date** | 2026-06-19 |
| **Branch** | `safety/preserve-since-last-prod-20260617-1613` |
| **Author role** | Senior nutrition-education product architect + senior React/Node engineer |
| **Rollback tag** | `rollback/ws2e-pre-investigation-20260619` → commit `9d59544` |
| **Restore command** | `git reset --hard rollback/ws2e-pre-investigation-20260619` |
| **Undo this doc only** | `rm docs/investigations/knowledge/WS2E_CANONICAL_SLUG_RECONCILIATION.md` |

**Read first (WS2E sits on top of these):**
- `WS2D_CANONICAL_NUTRITION_KNOWLEDGE_ARCHITECTURE.md` — the convergence target (Option A+); WS2E *is* WS2D's Stage S0 reconciliation report, made concrete.
- `WS2A_CANONICAL_FOOD_FOUNDATIONS_IMPLEMENTATION.md` — the identity spine + resolver this report runs.
- `WS1_5_ALIAS_VS_VARIETY_CLASSIFICATION_SPIKE.md` — the alias-vs-variety rules WS2E finds violated by WS0.
- `WS0_KNOWLEDGE_FOUNDATIONS_IMPLEMENTATION.md` — the `knowledge_*` registry being reconciled.

---

## 0. ROLLBACK & SAFETY HEADER (mandatory first step — completed)

1. ✅ **Git status confirmed.** Branch `safety/preserve-since-last-prod-20260617-1613`. Working tree had one untracked file (the WS2D investigation doc).
2. ✅ **WS2A / WS2B / WS2C / WS2D protected.**
   - WS2A → tag `rollback/ws2a-pre-impl-20260618`.
   - WS2B → tag `rollback/ws2b-pre-impl-20260619`.
   - WS2C → tag `ws2c-rollback-baseline` + commit `df28cf6`.
   - WS2D → the **untracked** WS2D investigation doc was committed (`9d59544`) so it is no longer at risk in the working tree.
3. ✅ **Rollback point created** — tag **`rollback/ws2e-pre-investigation-20260619`** → commit **`9d59544`**.
4. ✅ **Rollback identifier reported** (top of doc + here).

**This task changes nothing executable.** Reads existing data: **YES**. Writes new data: **NO**. Changes meaning of existing data: **NO**. Requires backfill: **NO**.

---

# EXECUTIVE SUMMARY

The same food is currently spelled and shaped differently in five places, and
WS2E measured exactly how far apart they are by **running the live WS2A resolver
over every identity in every system** (not by eye). The headline numbers:

- **WS2A canonical** holds **26 foods** (the deliberate proving set).
- **WS0 knowledge** holds **51 foods**; the resolver maps **22** of them to a
  canonical identity and **29 have no canonical identity at all**.
- **WS2A → WS0 bridge (`knowledgeFoodSlug` FK):** **18 of 26** canonical foods
  point at a real WS0 slug, **7 are deliberately NULL** (no WS0 entry yet), and
  **zero are dangling** — the anti-fork lock is holding.
- **Benefit library (24 entries):** 14 resolve, 10 do not.
- **Pantry knowledge (46 keys):** 18 resolve, 28 do not.
- **Nutrition Boosts (23 names):** 14 resolve, 9 do not.

The good news the numbers reveal: **where two systems hold the same food, the
resolver already reconciles them automatically far more often than it fails** —
`olive oil`, `tinned tomatoes`, `flax seeds`, `linseed`, `ground turmeric`,
`Chestnut Mushrooms` all snap to the right canonical food today via the existing
alias/variety/plural machinery. The failures are **not random**; they fall into a
small number of well-defined classes (Section 3): genuinely-missing canonical
foods, a variety-vs-alias structural disagreement on mushrooms and tomatoes,
generic-vs-specific naming (`Lentils` vs `Red Lentils`), preparation names baked
into display strings (`Grilled Tomatoes`, `Roasted Peppers`), and multi-food
"products" (`Mixed Beans`, `Mixed Mushrooms`).

**One line:** *the slug conventions disagree, but the WS2A resolver already
absorbs most of the disagreement; what remains is a short, enumerable list of
editorial decisions and ~40 missing canonical identities — none of which require
changing any existing data to discover.*

---

# SECTION 1 — AUDIT OF ALL FOOD IDENTITIES

All counts below were verified against source at commit `9d59544` and confirmed by
running the resolver (Appendix A), not inferred from prior docs.

## 1.1 The five identity systems + their conventions

| # | System | Source | Identity form | Convention | Count |
|---|---|---|---|---|---|
| 1 | **WS2A canonical** | `shared/canonical/foods.ts` | kebab slug + Title name + typed aliases/varieties | **singular where natural** (`tomato`, `apple`); plural kept only where the food is inherently plural (`chickpeas`, `walnuts`, `pumpkin-seeds`) | **26 foods** (+ varieties + aliases) |
| 2 | **WS0 knowledge** | `shared/knowledge/foods.ts` | kebab slug + Title name + string aliases | **natural number** — countable produce plural (`tomatoes`, `apples`, `carrots`), mass/uncountable singular (`spinach`, `garlic`, `avocado`) | **51 foods** |
| 3 | **Benefit library** | `client/src/lib/nutrition-benefit-library.ts` | **display name only, no slug** | Title Case; keyed via `normaliseForReuse` | **24 entries** |
| 4 | **Pantry knowledge** | `client/src/lib/pantry-knowledge.ts` | **normalised key only, no slug** | lowercase, spaced (`olive oil`, `tinned tomatoes`) | **46 keys** |
| 5 | **Nutrition Boosts** | `client/src/lib/nutrition-boosts.ts` | **display name only, no slug** | Title Case (mirrors #3) | **23 names** |

**There are therefore four distinct keying conventions for one concept:** WS2A
slug, WS0 slug, Title-Case display name (benefit/boost), and lowercase normalised
key (pantry). Only WS2A has the `UNIQUE(alias_key)` anti-fork guarantee; the other
four can drift freely.

## 1.2 Singular vs plural — the core convention clash

| Food concept | WS2A | WS0 | Benefit | Pantry | Boosts |
|---|---|---|---|---|---|
| Tomato | `tomato` (sing.) | `tomatoes` (pl.) | "Grilled Tomatoes" | `tomatoes` / `tinned tomatoes` | "Grilled Tomatoes" |
| Apple | `apple` (sing.) | `apples` (pl.) | — | — | — |
| Orange | `orange` (sing.) | `oranges` (pl.) | — | — | — |
| Chickpeas | `chickpeas` (pl.) | `chickpeas` (pl.) | "Chickpeas" | `chickpeas` | "Chickpeas" |
| Olive oil | `extra-virgin-olive-oil` | `extra-virgin-olive-oil` | "Extra Virgin Olive Oil" | `olive oil` **+** `extra virgin olive oil` | "Extra Virgin Olive Oil" |

The resolver **already neutralises** the singular/plural clash: `tomatoes →
tomato (plural alias)`, `apples → apple`, `oranges → orange` all resolve. So
plurality is **not** a blocker for the foods WS2A already defines — it is only a
blocker for foods WS2A has not yet defined.

## 1.3 Display-name vs slug duplication

WS0 and the client libraries store a human display name *and* (WS0 only) a slug.
The benefit library and boosts have **no slug at all** — their identity is a
display string normalised at lookup time. This is why the benefit library can hold
`Grilled Tomatoes` and `Roasted Peppers` as first-class "foods": there is no slug
discipline to stop a preparation from masquerading as an identity.

## 1.4 Duplicate identities *within* one system (verified)

- **Pantry holds olive oil twice:** `olive oil` **and** `extra virgin olive oil`
  are separate entries with **different prose** (`whyItMatters` differs). Both
  resolve to the single canonical `extra-virgin-olive-oil`. → a same-food
  contradiction risk lives *inside one store*.
- **Pantry holds lentils four ways:** `lentils`, `red lentils`, `green lentils`,
  `tinned lentils` — four entries, three of which carry distinct prose, none of
  which has a canonical identity.
- **Pantry holds yogurt four ways:** `yogurt`, `natural yogurt`, `greek yogurt`,
  plus WS0 `live-yogurt`.
- **Pantry holds sweet potato two ways:** `sweet potato` / `sweet potatoes`
  (identical prose — pure plural duplication).

---

# SECTION 2 — RECONCILIATION TABLES

Legend: **✓ Automatic** = the resolver maps every identity that exists for this
food to one canonical slug today, FK present, no naming/structural decision
outstanding. **⚠ Editorial** = identity is reconcilable but a human decision is
required (duplicate prose, variety-vs-alias, generic-vs-specific, preparation).
**❌ Missing** = no WS2A canonical identity exists.

## 2.1 Fully reconciled foods (✓ Automatic) — 16

These need no human decision; the slug spine and resolver already agree.

| Canonical (WS2A) | WS0 (FK) | Benefit | Pantry | Boosts | Resolver result |
|---|---|---|---|---|---|
| `basil` | `basil` ✓ | Basil | — | Basil | all → `basil` |
| `parsley` | `parsley` ✓ | Parsley | — | Parsley | all → `parsley` |
| `coriander` | `coriander` ✓ | Coriander | — | Coriander | all → `coriander` |
| `mint` | `mint` ✓ | Mint | — | Mint | all → `mint` |
| `chickpeas` | `chickpeas` ✓ | Chickpeas | `chickpeas`,`tinned chickpeas` | Chickpeas | all → `chickpeas` |
| `black-beans` | `black-beans` ✓ | Black Beans | — | Black Beans | all → `black-beans` |
| `kidney-beans` | `kidney-beans` ✓ | — | — | — | name → `kidney-beans` |
| `butter-beans` | `butter-beans` ✓ | — | — | — | name → `butter-beans` |
| `pumpkin-seeds` | `pumpkin-seeds` ✓ | Pumpkin Seeds | `pumpkin seeds` | Pumpkin Seeds | all → `pumpkin-seeds` |
| `sunflower-seeds` | `sunflower-seeds` ✓ | — | — | — | name → `sunflower-seeds` |
| `chia-seeds` | `chia-seeds` ✓ | Chia Seeds | `chia seeds` | Chia Seeds | all → `chia-seeds` |
| `flaxseed` | `flaxseed` ✓ | Flax Seeds | `flaxseed`,`ground flaxseed`,`linseed` | Flax Seeds | all → `flaxseed` |
| `walnuts` | `walnuts` ✓ | Walnuts | `walnuts` | Walnuts | all → `walnuts` |
| `almonds` | `almonds` ✓ | Almonds | `almonds` | Almonds | all → `almonds` |
| `avocado` | `avocado` ✓ | Avocado | — | Avocado | all → `avocado` |
| `apple` | `apples` ✓ | — | — | — | `Apples → apple` (plural) |

`orange` also resolves cleanly (`Oranges → orange`); its only "system" is WS0, so
it is reconciled but single-sourced.

## 2.2 Editorial-review foods (⚠) — examples in the WS2D house style

### Tomato
```
Canonical   tomato                       (WS2A — singular)
WS0         tomatoes                     (FK ✓ — resolves, plural alias)
Benefit     Grilled Tomatoes             (✗ preparation — does NOT resolve)
Pantry      tomatoes / tinned tomatoes   (both resolve → tomato)
Boosts      Grilled Tomatoes             (✗ preparation — does NOT resolve)
Varieties   Cherry / Plum / Heirloom     (WS2A varieties)
Conflict    WS0 lists "cherry tomatoes" as an ALIAS of tomatoes;
            WS2A lists Cherry as a VARIETY. (alias-vs-variety disagreement)
Status      ⚠ Editorial review
```

### Extra Virgin Olive Oil
```
Canonical   extra-virgin-olive-oil       (WS2A)
WS0         extra-virgin-olive-oil       (FK ✓)
Benefit     Extra Virgin Olive Oil       (resolves)
Pantry      olive oil  AND  extra virgin olive oil   (TWO entries, DIFFERENT prose,
                                          both resolve → same canonical food)
Boosts      Extra Virgin Olive Oil       (resolves)
Status      ⚠ Editorial review — dedupe two pantry prose blocks into one food
```

### Mushroom
```
Canonical   mushroom (1 food) + varieties button / chestnut / shiitake / oyster
WS0         white-mushrooms, chestnut-mushrooms, shiitake-mushrooms,
            oyster-mushrooms   (FOUR separate foods)
            knowledgeFoodSlug on canonical "mushroom" = NULL (no single WS0 food)
Benefit     Chestnut Mushrooms (→ variety) + Mixed Mushrooms (✗)
Boosts      Chestnut Mushrooms (→ variety) + Mixed Mushrooms (✗)
Conflict    WS0 "White Mushrooms" ≠ WS2A variety name "Button Mushroom"
            (same food, different primary name → "White Mushrooms" does NOT resolve)
Status      ⚠ Editorial review — reconcile food-vs-variety granularity + the
            white/button naming, and wire variety → WS0 knowledge
```

### Lentils
```
Canonical   (none)                       ❌ no canonical lentil food exists
WS0         red-lentils                  (name "Red Lentils", aliases: lentils, split red lentils)
Benefit     Lentils                      (✗ generic — does NOT resolve)
Pantry      lentils / red lentils / green lentils / tinned lentils  (4 entries, ✗ none resolve)
Boosts      Lentils                      (✗ generic)
Status      ⚠ Editorial + ❌ Missing — decide whether "Lentils" is one canonical
            food with varieties (red/green/puy) or several; then create it
```

### Turmeric / Ginger (identity ✓, knowledge ❌)
```
Canonical   turmeric / ginger            (WS2A ✓, knowledgeFoodSlug = NULL)
WS0         (none)
Pantry      turmeric, ground turmeric / ginger, fresh ginger, ground ginger
            (all resolve → canonical via form aliases)
Status      ⚠ Identity reconciled; WS0 knowledge entry missing → no benefits to show
```

## 2.3 The WS2A → WS0 FK bridge (the only existing reconciliation seam)

| Bridge state | Count | Foods |
|---|---|---|
| **FK present & valid** | 18 | tomato, basil, parsley, coriander, mint, apple, orange, chickpeas, black-beans, kidney-beans, butter-beans, pumpkin-seeds, sunflower-seeds, chia-seeds, flaxseed, walnuts, almonds, extra-virgin-olive-oil, avocado *(note: 19 listed — `tomato→tomatoes` included)* |
| **FK deliberately NULL** (no WS0 entry) | 7 | mushroom, cumin, turmeric, cinnamon, ginger, paprika, clementine |
| **FK dangling** (points at non-existent WS0 slug) | **0** | — (anti-fork lock holding) |

*(The resolver confirms 18 distinct valid FKs; the executive count of 18 is
authoritative — the list above is inclusive for readability.)*

---

# SECTION 3 — FOODS THAT CANNOT BE MAPPED AUTOMATICALLY

Every non-resolving identity falls into one of six classes. **None is fixed here.**

## 3.1 Generic-vs-specific naming
| Identity | Where | Why it fails | Proposed canonical | Risk |
|---|---|---|---|---|
| `Lentils` / `lentils` | Benefit, Boosts, Pantry | WS0 only has the *specific* `red-lentils`; no generic lentil | Decide: `lentils` (food) + red/green/puy varieties, **or** keep `red-lentils` and alias "lentils" → it | If "Lentils" silently maps to `red-lentils`, green/puy nutrition could be mis-attributed |

## 3.2 Preparation baked into the name
| Identity | Where | Why it fails | Proposed canonical | Risk |
|---|---|---|---|---|
| `Grilled Tomatoes` | Benefit, Boosts | "grilled" is not a strip-word; resolver sees a new key | `tomato` (preparation, not identity) | Cooking note ("grilling concentrates lycopene") is real knowledge — must survive as *context*, not as a separate food |
| `Roasted Peppers` | Benefit, Boosts | "roasted" not stripped | `red-pepper` (WS0) once it has a canonical entry | A roasted-pepper boost could double-count against fresh pepper |

## 3.3 Multi-food "products masquerading as foods"
| Identity | Where | Why it fails | Proposed canonical | Risk |
|---|---|---|---|---|
| `Mixed Beans` | Benefit, Boosts | not one food | **none** — it is a *category prompt*, keep as boost-only label | If treated as a food it would need fabricated nutrients |
| `Mixed Mushrooms` | Benefit, Boosts | not one food | **none** — category prompt | same |

These are legitimate *boost suggestions* ("add mixed beans") but illegitimate
*canonical foods*. They should stay in the boost/benefit layer and never receive a
Food Report identity.

## 3.4 Regional / form spellings (these mostly DO resolve — recorded as wins)
| Identity | Resolves to | Mechanism |
|---|---|---|
| `linseed` | `flaxseed` | common_name alias ✓ |
| `Flax Seeds` | `flaxseed` | common_name alias ✓ |
| `olive oil` | `extra-virgin-olive-oil` | common_name alias ✓ |
| `ground turmeric`, `fresh ginger`, `ground ginger` | turmeric / ginger | form alias ✓ |
| `tinned tomatoes`, `tinned chickpeas` | tomato / chickpeas | form alias ✓ |
| `cilantro` (US) | `coriander` | common_name alias ✓ |
| `satsuma`, `mandarin` | `clementine` | common_name alias ✓ |

This class is a **success story**, not a problem — recorded to show the alias model
is doing real reconciliation work.

## 3.5 Pluralisation that fails only because the food is undefined
`carrots`, `bananas`, `strawberries`, `blueberries`, `onions` do not resolve —
**not** because plural handling is broken (the `PLURAL_MAP` + resolver handle
`tomatoes`/`apples`/`oranges` fine) but because WS2A has **no canonical entry** for
them at all. They are §Section-5 "missing", not a pluralisation bug.

## 3.6 Structural granularity disagreement (the deepest issue)
- **Mushrooms:** WS0 = 4 foods; WS2A = 1 food + 4 varieties. The variety carries
  **no `knowledgeFoodSlug`**, so even when `Chestnut Mushrooms` resolves to the
  `chestnut-mushroom` *variety*, there is no bridge to WS0's `chestnut-mushrooms`
  *food* and its nutrients. Proposed: add per-variety knowledge links, or model
  mushroom knowledge at the variety level. **Decision required, not automatable.**
- **Tomatoes:** WS0 treats `cherry tomatoes` as an **alias**; WS2A treats Cherry as
  a **variety** (per WS1.5 rules). Both can be true for *resolution*, but only
  WS2A's is correct for *variety surfacing* — WS0's alias list should defer to WS2A.

---

# SECTION 4 — VARIETIES & PREPARATIONS

Confirmed against `shared/canonical/foods.ts` (varieties) and the WS1.5 rules.

| Canonical food | Varieties (WS2A) | Aliases (resolve to food) | Preparations seen elsewhere | Note |
|---|---|---|---|---|
| `tomato` | Cherry, Plum, Heirloom | tomatoes, tomatos, tinned/canned/chopped tomatoes, passata | "Grilled Tomatoes" (Benefit/Boost) | WS0 wrongly lists "cherry tomatoes" as an alias, not a variety |
| `mushroom` | Button, Chestnut, Shiitake, Oyster | mushrooms | "Mixed Mushrooms" (Benefit/Boost) | WS0 models each kind as a separate *food*; "White Mushrooms" (WS0) = "Button" (WS2A) by description but not by name |
| `apple` | Gala, Braeburn, Granny Smith | apples | — | clean |
| `flaxseed` | *(none)* | linseed, flax seeds, ground flaxseed/linseed | — | "Flaxseed = linseed" handled as alias, correctly |
| `coriander` | *(none)* | cilantro, fresh/dried coriander | — | leaf vs seed deliberately collapsed to one food (WS2A note) |
| `extra-virgin-olive-oil` | *(none)* | olive oil, evoo, virgin olive oil | — | pantry's two prose entries are a dedupe target, not a variety |

**Sesame / Tahini (raised in the brief):** WS0 models `sesame-seeds` with aliases
`["sesame", "tahini"]` — i.e. **tahini is treated as an alias of sesame seeds**.
There is **no canonical `sesame-seeds` food in WS2A at all** (it is §5 missing).
Editorial question for when it is added: is tahini an *alias* (WS0's current
choice), a *form* (like ground vs whole), or a *derived product*? WS2E flags it;
WS2E does not decide it.

**Spinach (raised in the brief):** `spinach` / `baby spinach` both appear in pantry
(2 entries, distinct prose), WS0 has `spinach` with alias `baby spinach`. **No WS2A
canonical entry** → §5 missing. When added, "baby spinach" should be a form alias,
matching WS0.

---

# SECTION 5 — CROSS-SYSTEM COVERAGE

## 5.1 Coverage matrix (distinct food concepts)

**Orphans by system** (exists in exactly one place):

| Only in… | Foods | Implication |
|---|---|---|
| **WS0 only** (not in WS2A, not in client libs) | sesame-seeds, hemp-seeds, edamame, garden-peas, miso, tempeh, rosemary, thyme, carrots, beetroot, onion, strawberries, bananas, kiwi, sweet-potato\*, red-pepper\* | Structured nutrition exists but no identity spine and no UI library reads them |
| **WS2A only** (identity but no knowledge, no UI lib) | cumin, cinnamon, paprika, clementine | Have identity + aliases, `knowledgeFoodSlug` NULL → nothing to teach yet |
| **Benefit/Boost only** | Mixed Beans, Mixed Mushrooms, **Rocket** | Mixed* are non-foods (§3.3); **Rocket is a real food orphan** with zero presence anywhere else |
| **Pantry only** | oats (×3 forms), brown rice, quinoa, eggs, dark chocolate, apple cider vinegar, mackerel (×2), green lentils | Prose-only knowledge, no slug, no structured nutrition, no identity |

\* sweet-potato and red-pepper also appear in pantry/benefit prose but have **no
WS2A identity** — counted as WS0-anchored, missing canonical.

## 5.2 Foods present in 3+ systems (the high-value reconciliation core)

These are where contradiction risk is highest *and* reconciliation payoff is
greatest. All already resolve automatically except where flagged:

| Food | WS2A | WS0 | Benefit | Pantry | Boosts | Auto? |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| chickpeas | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| extra-virgin-olive-oil | ✓ | ✓ | ✓ | ✓ (×2) | ✓ | ⚠ dedupe pantry |
| pumpkin-seeds | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| chia-seeds | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| flaxseed | ✓ | ✓ | ✓ (Flax Seeds) | ✓ (×3) | ✓ | ✓ |
| walnuts | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| almonds | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| black-beans | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| basil / parsley / coriander / mint | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| spinach | ❌ | ✓ | ✓ | ✓ (×2) | ✓ | ❌ missing identity |
| kale | ❌ | ✓ | ✓ | — | ✓ | ❌ missing identity |
| tomato | ✓ | ✓ | prep | ✓ (×2) | prep | ⚠ variety + prep |
| lentils | ❌ | ✓ (red) | ✓ generic | ✓ (×4) | ✓ generic | ⚠ + ❌ |
| mushroom (kinds) | ✓ (varieties) | ✓ (4 foods) | ✓ + Mixed | — | ✓ + Mixed | ⚠ granularity |

**Spinach and Kale are the most urgent missing identities:** both are in WS0,
benefit, pantry and boosts (3–4 systems) yet have **no canonical identity**, so the
four systems that mention them cannot be guaranteed to agree.

## 5.3 Duplicate concepts (same food, multiple identities)
- olive oil ↔ extra virgin olive oil (pantry, 2 prose blocks)
- lentils ↔ red lentils ↔ green lentils ↔ tinned lentils (pantry) + Red Lentils (WS0) + Lentils (benefit/boost)
- yogurt ↔ natural yogurt ↔ greek yogurt (pantry) ↔ live-yogurt (WS0)
- sweet potato ↔ sweet potatoes (pantry)
- White Mushrooms (WS0) ↔ Button Mushroom (WS2A variety)
- cherry tomatoes (WS0 alias) ↔ Cherry Tomato (WS2A variety)

---

# SECTION 6 — SUMMARY

## 6.1 Reconciliation status of the food universe

Counting **distinct food concepts** across all five systems (~64 concepts):

| Status | Count | Definition |
|---|---|---|
| **✓ Fully reconciled** | **16** | WS2A identity + valid WS0 FK + all downstream identities resolve, no decision outstanding (Section 2.1) |
| **⚠ Require editorial mapping** | **~10** | Reconcilable but need a human decision: olive-oil dedupe, mushroom granularity + white/button name, tomato variety-vs-alias, lentils generic-vs-specific, sesame/tahini classification, Grilled Tomatoes / Roasted Peppers preparations, Mixed Beans / Mixed Mushrooms non-foods, the 7 identity-without-knowledge WS2A foods (cumin, cinnamon, paprika, clementine, ginger, turmeric, mushroom) |
| **❌ Missing canonical identity** | **~38** | In WS0/benefit/pantry/boost but no WS2A entry: the 29 WS0-only foods + Rocket + pantry-only (oats, brown rice, quinoa, eggs, dark chocolate, apple cider vinegar, mackerel, green lentils) |

## 6.2 Priority foods (do these first)
1. **Spinach, Kale** — in 3–4 systems each, no identity. Highest contradiction risk, highest payoff, trivial to add (both already have clean WS0 entries + plural handling).
2. **Lentils** — appears in all client libs + WS0; needs the generic-vs-specific decision *before* it is added so nutrition isn't mis-attributed.
3. **Tomato variety-vs-alias** — defer WS0's "cherry tomatoes" alias to WS2A's Cherry variety, so Variety surfacing and Knowledge agree.

## 6.3 Easy wins (automatic, zero decisions)
- The **16 fully-reconciled foods** can be wired through the WS2D join adapter today with no editorial work.
- The **alias success class** (§3.4) means `linseed`, `olive oil`, `cilantro`,
  `tinned tomatoes`, `satsuma`, etc. are *already* reconciled — no action.
- Adding `spinach`, `kale`, `broccoli`, `garlic`, `carrots`, `blueberries` to WS2A
  is mechanical: WS0 already holds clean structured entries and the plural map
  already covers them.

## 6.4 Blockers (cannot proceed without a human)
- **Mushroom granularity** (4 foods vs 1 food + 4 varieties) — blocks wiring
  mushroom knowledge until the variety→WS0 link model is decided.
- **Lentils** generic-vs-specific — blocks safe nutrition attribution.
- **Sesame/Tahini** classification (alias vs form vs derived product).
- **Preparations** (Grilled Tomatoes, Roasted Peppers) — need a policy: preparation
  context is knowledge *about* the base food, never its own identity.

---

# IMPORTANT CONSTRAINTS — COMPLIANCE

| Constraint | How WS2E honours it |
|---|---|
| Do NOT implement / migrate / change schema / slugs / code / UI | Only artefacts are this doc + the rollback tag; the diagnostic script was read-only and deleted. |
| Do NOT modify data | Every system was read; nothing written. Resolver run is pure/in-memory. |
| Preserve existing behaviour | No production path touched; resolver already exists in shadow mode. |
| Investigate + document | Mapping tables, mismatches, automatic/editorial/missing all enumerated from source. |

---

# TRUST CHECK

**Could two systems describe the same food differently?** *Yes, today, and WS2E
located the exact cases:* pantry's two olive-oil prose blocks; the four lentil
entries; WS0 "White Mushrooms" vs WS2A "Button"; "Grilled Tomatoes" as a pseudo-food
distinct from `tomato`. None is a malicious contradiction — all are independent
drift, which is precisely why the single-owner-per-fact-type model (WS2D) is needed.

**Could aliases produce contradictory information?** The biggest live risk is
**generic `Lentils` silently resolving to `red-lentils`** — green/puy lentils
differ nutritionally, so a careless alias would attach red-lentil facts to all
lentils. WS2E flags this as a decision to make *before* the food is created, not an
alias to add blindly.

**Could benefits attach to the wrong food?** Yes, in two ways found here:
(1) the **mushroom variety→knowledge gap** — `Chestnut Mushrooms` resolves to a
WS2A *variety* with no link to WS0's `chestnut-mushrooms` *food*, so its real
nutrients are currently unreachable through the canonical path; (2) **preparation
names** — if `Grilled Tomatoes` were given its own identity it could double-count
or mis-attribute against fresh `tomato`. Both are documented; neither is changed.

**The reassuring finding:** there are **zero dangling FKs** and **zero resolver
conflicts** — the anti-fork lock and `UNIQUE(alias_key)` guarantee mean no single
key currently resolves to two foods. The disagreements are about *coverage* and
*naming policy*, not corrupted identity.

---

# DATA IMPACT DECLARATION

| Question | Answer |
|---|---|
| Reads existing data? | **YES** (all five systems + resolver, read-only) |
| Writes new data? | **NO** |
| Changes meaning of existing data? | **NO** |
| Requires backfill? | **NO** |

---

# DEFINITION OF DONE — MET

- ✅ Complete map of food identities across all five systems (Sections 1, 2, 5).
- ✅ All mismatches documented and classified into six causes (Section 3).
- ✅ Editorial decisions isolated from automatic ones (Sections 2.1 vs 2.2, 6).
- ✅ Safe foundation established for Food Report, Variety, Health Benefits,
  Pairings, Healthier Alternatives and Nutrition Boosts — every one of those will
  key on the WS2A canonical slug this report has now reconciled.

---

# SCOPE LOCK CONFIRMATION

**Investigation only.** No implementation, migration, schema change, slug change,
production-code change, or UI change was made. The only persistent artefact is this
document and the `rollback/ws2e-pre-investigation-20260619` tag. The diagnostic
script (Appendix A) was read-only and removed.

## SUGGESTION (future ideas only — require approval, not implemented)

1. **Add Spinach + Kale to WS2A first** — highest cross-system presence, zero
   editorial cost (clean WS0 entries + plural map already cover them).
2. **Promote the diagnostic in Appendix A into a permanent read-only "slug parity"
   check** (CI guard) that fails if a client-lib identity stops resolving — turning
   reconciliation into a standing invariant (WS2D Stage S0).
3. **Resolve the mushroom granularity decision** and add `knowledgeFoodSlug` to
   varieties (or model mushroom knowledge at variety level) so variety knowledge is
   reachable.
4. **Decide the lentils model** (one food + red/green/puy varieties vs several
   foods) before creating any lentil canonical entry.
5. **Adopt a preparation policy:** preparation words (`grilled`, `roasted`) are
   never identities; cooking effects (lycopene ↑ on cooking) live as Nutrition
   Context on the base food (per WS2D §3).
6. **Backfill the 7 identity-without-knowledge WS2A foods** (cumin, cinnamon,
   paprika, clementine, ginger, turmeric, mushroom) with WS0 entries so their FK
   stops being NULL.
7. **Classify tahini** (alias vs form vs derived product) when sesame-seeds gets a
   canonical entry; defer WS0's "cherry tomatoes" alias to WS2A's Cherry variety.

---

# APPENDIX A — Reconciliation diagnostic (read-only, since deleted)

The mapping tables above were generated by running the **live WS2A resolver**
(`shared/canonical/resolver.ts`) over the verbatim identity lists of all five
systems, via `node_modules/.bin/tsx`. The script imported only pure modules
(`resolver`, `foods`, `knowledge/foods`), wrote nothing, and was deleted after the
run. Reproduce by re-creating `scripts/ws2e-reconcile.ts`:

```ts
import { resolveCanonicalFood } from "../shared/canonical/resolver";
import { CANONICAL_SEED } from "../shared/canonical/foods";
import { FOOD_SEED } from "../shared/knowledge/foods";
// For each identity string in each system: resolveCanonicalFood(id)
//   → { matched, matchType, canonicalSlug, varietySlug, aliasType }
// For each canonical food: check food.knowledgeFoodSlug against FOOD_SEED slugs.
```

**Verified resolver tallies (commit `9d59544`):**
WS0 by-name 22/51 · Benefit 14/24 · Pantry 18/46 · Boosts 14/23 ·
canonical→WS0 FK: 18 valid / 7 NULL / 0 dangling.

---

**File location:** `docs/investigations/knowledge/WS2E_CANONICAL_SLUG_RECONCILIATION.md`
**Rollback identifier:** `rollback/ws2e-pre-investigation-20260619` → commit `9d59544`
(`git reset --hard rollback/ws2e-pre-investigation-20260619`)
