# FI20 — Food Intelligence Activation

**Giving the already-built, cited, test-green Food Comparison Engine (COMP1) its first way in — a read-only route and a calm UI — so a household can decide between two everyday foods deliberately, not only by asking the Companion.**
Connection, not addition. No new nutrition knowledge; no canonical ownership change; no new brain.

| | |
|---|---|
| **Session** | `FI20_Food_Intelligence_Activation` |
| **Date** | 2026-07-17 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `rollback/FI20-food-intelligence-activation-20260717` → `7bfad50c` |
| **Status** | **Implemented and verified.** Route live, UI wired, screenshots captured. Awaiting owner review before commit. |
| **Implements** | FI18 investigation, Option A — *connection not addition*. |
| **Product changed** | Additive-only: one read-only HTTP route + two new client files + two small wiring edits. No owner, no schema, no knowledge touched. |

---

## 1. What this activates, and what it deliberately does not touch

**The gap FI18 found.** The Food Comparison Engine
(`server/intelligence/food-intelligence/comparison-engine.ts`, capability verb
`food-intelligence:compare`) was **built, cited, and test-green (56/56)** — but had
**no HTTP route and no UI**. Its only way in was a Companion utterance
("compare cheddar and brie"). A household that wanted to deliberately weigh two
foods side by side had nowhere to go.

**What FI20 adds.** The missing way in — and nothing else:

- a **read-only** `GET /api/foods/compare` that projects the engine's already-assembled bundle;
- a **presentation-only** `FoodComparisonView` that renders the engine's cited answer;
- a deep-linkable **`/compare`** page (`/compare?items=cheddar,brie`);
- a **"Compare with another food"** entry on every canonical Food page.

**What it does NOT touch.** No new nutrition knowledge. No canonical ownership
change. No change to the engine's reasoning, its citations, its safety gate, or
its `food-intelligence:compare` binding. The route computes nothing and owns
nothing; the view adds no adjective the engine did not (Rule E1 — *no citation,
no card*; Rule LT3 — *the brain stays deterministic, the view only phrases what
it was handed*). Ambient surfaces already mounted elsewhere (planner, pantry,
shopping, home, dashboard) were **not duplicated**.

---

## 2. Rollback

| Item | Value |
|---|---|
| **Tag** | `rollback/FI20-food-intelligence-activation-20260717` |
| **Resolves to** | `7bfad50c` (`7bfad50ca198f2b86f6501a4f82d8ae41af9260b`) |
| **HEAD at session** | `7bfad50c` — matches the tag; committed state is fully protected. |
| **Working tree caveat** | The tree was **dirty at session start — NOT this session's changes.** ~132 pre-existing uncommitted edits from sibling sessions. The tag protects **committed** state only. FI20 left them byte-untouched and did not commit them. |

**To roll back FI20 only:** discard this session's files (§3) — the tree returns
to its pre-FI20 (still sibling-dirty) state. **To roll back to clean HEAD:**
`git checkout 7bfad50c` (also discards sibling work — coordinate first).

---

## 3. Files changed (this session's writes)

**New files**

| File | Lines | Role |
|---|---|---|
| `client/src/components/intelligence/FoodComparisonView.tsx` | 268 | Presentation only. Renders an already-assembled `FoodComparisonBundle` through the WX2_5 Intelligence card system (verdict → household scope → dimension rows with cited progressive-disclosure evidence → honest gaps → sources). Owns no intelligence. |
| `client/src/pages/food-comparison-page.tsx` | 217 | The `/compare` page. Collects 2–4 food names (deep-linked or typed), asks the route, renders the view. Publishes Companion deixis (`currentFoodSlug`). |
| `scripts/fi20-capture-comparison-screenshots.ts` | 165 | Playwright capture of the four FI20 surfaces against a live dev server + seeded demo household. Read-only; writes only PNGs. |
| `docs/implementation/intelligence/FI20_FOOD_INTELLIGENCE_ACTIVATION.md` | — | This doc. |
| `docs/implementation/assets/fi20/*.png` + `manifest.json` | — | The captured screenshot baseline. |

**Modified files**

| File | Δ | Change |
|---|---|---|
| `server/routes.ts` | +36 | Added read-only `GET /api/foods/compare` (routes.ts:5453). Auth-gated; splits/trims `?items=`; 400 on fewer than two items; dynamic-imports `assembleFoodComparison`; returns the bundle verbatim; 500 only on unexpected fault. |
| `client/src/App.tsx` | +2 | Lazy-imports `FoodComparisonPage`; registers `<Route path="/compare">` behind `ProtectedRoute`. |
| `client/src/pages/food-detail-page.tsx` | +14 | Adds the "Compare with another food" entry under the food header, deep-linking `/compare?items=<slug>`. Renders only when the food resolves. |

> Total product-source footprint: **+52 lines across 3 tracked files, plus 2 new
> client files.** Everything the comparison *means* was already built in COMP1.

---

## 4. Verification results

### 4.1 Server / engine — endpoint proven end-to-end
`POST /api/demo/start` → **201**; `GET /api/foods/compare?items=cheddar,brie` →
**200** returning a well-formed, fully-cited `FoodComparisonBundle` (subjects with
per-dimension `evidence`/`gap`, cross-subject `dimensions`, `recommendation` /
`recommendationGap`, `trust`, `metadata.sources`). Honest gaps present where the
engine has no grounded data (e.g. Apple Score is not computed for whole foods).

### 4.2 COMP1 regression — unchanged and green
`npm run test:comp1-food-comparison` → **56 passed, 0 failed.**

### 4.3 Typecheck — FI20 files are clean
`tsc --noEmit` over the FI20 files reports **zero** errors. The tree-wide count of
pre-existing TS errors is sibling/COMP1 baseline state — including 2 in
**unmodified** test port mocks that never adopted COMP1's `assembleFoodComparison`
port member. **None are introduced by FI20.**

### 4.4 UI — driven in a real browser against a seeded demo household
All four surfaces rendered correctly at mobile viewport (430×932). See §5.

---

## 5. Screenshots

Captured by `scripts/fi20-capture-comparison-screenshots.ts` → `docs/implementation/assets/fi20/`.

| File | Surface | What it proves |
|---|---|---|
| `compare-deeplink-cheddar-brie.png` | `/compare?items=cheddar,brie` | The flagship deep-link. Header, editable inputs, honest **"No clear winner"** verdict, household scope line, and the **"For your household"** dimension with "Show the evidence" disclosure. |
| `compare-empty-entry.png` | `/compare` | Clean empty state — placeholders, disabled Compare, "Enter two foods to compare." |
| `compare-broccoli-spinach.png` | `/compare?items=broccoli,spinach` | A second grounded comparison. Surfaces **real household awareness**: *"already planned it (2 planner appearances)."* |
| `food-page-compare-entry.png` | `/foods/cheddar` | The **"⚖ Compare with another food"** entry in-tone under the Cheddar food header. |

**Honesty note (expected, not a defect).** Both grounded pairs returned *"No clear
winner — these are close."* The engine refuses to fabricate a difference when
subjects tie on every fully-evidenced dimension. The UI faithfully renders that
honesty rather than inventing a verdict — Rule E1 in pixels.

---

## 6. Follow-on recommendations

1. **Cover the 2 pre-existing typecheck errors (separate session)** — the two COMP1 port mocks that never adopted `assembleFoodComparison`. One-line stub each.
2. **Seed a few "differentiating" comparison fixtures** so the positive "better choice for you" card can be screenshotted (every current demo pair ties).
3. **Cross-surface entries into `/compare`** — cookbook/meal "which is better for us?", the analyser result, shopping/pantry rows — each deep-linking `/compare?items=…`. Reuse the entry pattern; add no new engine.
4. **Companion deixis on more surfaces** — extend `currentFoodSlug` publishing to pantry/shopping rows where a clean pointer exists.
5. **Register `/compare` in the product surface manifest / nav docs** (PDA1's `product.yaml` + screenshot registry).

---

## 7. Provenance

- **Investigation:** FI18 — Household Food Intelligence Experiences (Option A).
- **Engine activated:** COMP1 Food Comparison Engine (`comparison-engine.ts`, `food-intelligence:compare`).
- **Presentation system reused:** WX2_5 Intelligence Experience System (`client/src/components/intelligence/*`).
- **Screenshot discipline reused:** PDA1 pattern (`scripts/capture-product-screenshots.ts`).
- **Run file:** `.engineering/session/runs/FI20_Food_Intelligence_Activation.md`.

---

_Note: this doc was recreated after a concurrent sibling process deleted untracked docs mid-session; content restored from the authoring session's context._
