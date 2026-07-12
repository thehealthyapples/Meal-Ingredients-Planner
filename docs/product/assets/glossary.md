---
entry: gls-glossary
name: Product Glossary
section: glossary
status: live
visibility: public
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Product Glossary

> The one name THA uses for each concept — and the eleven places it currently
> uses more than one.

This is one file, on purpose. PKR §18: "a vocabulary split across files is a
vocabulary that develops dialects." Every term THA uses lives here, each with the
**one** approved name, its definition, and — where it exists — the list of other
names the product wrongly uses for the same thing today. Those collision lists
are the point of this document: they are the drift, written down, verified
against the client, with the actual files named.

## Related

- [[gls-tha-score]]
- [[gls-plant-diversity]]
- [[gls-apple]]
- [[gls-basket]]

## Known defects

- `fnd-score-name-collision` — the household's rating is called five different
  things across the product, one of which means something else entirely. See
  the THA Score term below, and PDA1.

---

entry: gls-tha-score

## THA Score

**Definition.** The one-to-five apple rating THA gives a food. The `AppleRating`
component clamps it to 1–5 and labels it Ultra-Processed / Below Average /
Average / Good / Elite Whole Food (`client/src/components/AppleRating.tsx`).

**Approved name:** *THA Score.*

**Names THA wrongly uses for it today.** The same 1–5 rating is called at least
five different things across the product — and one of those names denotes a
*different quantity* entirely:

- **"THA Score"** (approved) — `client/src/components/analyser/AnalyserDetailV2.tsx#L272`,
  `client/src/pages/products-page.tsx#L1697` (compare row),
  `client/src/pages/dashboard.tsx#L421`.
- **"Apple Score"** — `client/src/components/ShoppingListView.tsx#L2033` and
  `#L2046`, `client/src/components/analyser/WholeFoodAnalysisCard.tsx#L108`,
  `client/src/components/WorkspaceAnalyserSheet.tsx#L49`,
  `client/src/pages/shopping-workspace-page.tsx#L2236` (sort option
  `value="apple_score"`), and `client/src/components/conversation/companion-card.ts#L257`.
- **"Apple Rating" / "Min Apple Rating" / "Minimum Apple Rating"** —
  `client/src/pages/products-page.tsx#L1913` and `#L2078`; and it is the name of
  the rendering component itself (`AppleRating`).
- **"THA score" / "About THA scores" / "Minimum THA score"** — a lower-case and
  phrasing drift of the approved name at
  `client/src/components/WorkspaceAnalyserSheet.tsx#L994`,
  `client/src/pages/shopping-list-page.tsx#L1324`, and
  `client/src/lib/analyser-choice.ts#L5`.
- **"Health Score" / "THA Health Score"** — *this one means something else.* It
  is a **0–100** number, not the 1–5 apple count:
  `client/src/pages/meals-page.tsx#L126` renders a `HealthScoreRing` over
  `score / 100`; `client/src/components/HealthTrendChart.tsx#L63` ("Health Score
  Trend"); `client/src/pages/dashboard.tsx#L415`; and
  `client/src/pages/profile-page.tsx#L1687`. On the server it is a separate,
  derived value — `server/routes.ts#L1650` computes `healthScore = 100 -
  thaRating * 20` (an **inverted** rescaling of the apple rating), while
  `server/lib/explainability-service.ts#L312` builds a 0–100 composite. Calling
  both "score" hides that a household is looking at two different numbers on two
  different scales, one of them running the opposite direction.

---

entry: gls-plant-diversity

## Plant Diversity

**Definition.** The count of different plants a household has eaten. Surfaced in
the household nutrition centre as a headline stat
(`client/src/components/HouseholdNutritionCentre.tsx#L286`).

**Approved name:** *Plant Diversity.*

**Names THA wrongly uses for it today.** The one concept answers to three
different names depending on where you meet it:

- Shown to households as **"Plants enjoyed"** —
  `client/src/components/HouseholdNutritionCentre.tsx#L286` (`<Stat ... label="Plants enjoyed" />`).
- Navigated to as **"Nutrition"** — the nav item pointing at this page is
  labelled Nutrition: `client/src/components/nav-bar.tsx#L45`.
- Addressed as **`/plant-diversity`** — the route itself:
  `client/src/App.tsx#L232`.

So the label, the navigation, and the URL each name the same thing differently.

---

entry: gls-apple

## Apple (the Companion)

**Definition.** The name every household sees for THA's conversational companion.
The floating assistant surface is labelled "Apple" to the household:
`client/src/components/conversation/FloatingAssistant.tsx#L87` (`floating: "Apple"`).

**Approved name:** *Apple* (household-facing).

**Names kept correctly internal.** Unlike the terms above, this one does *not*
leak. "Companion" and "Assistant" are used only in code and internal
structures — the component file is `FloatingAssistant`, the cards it renders are
`CompanionCard` / "Companion Cards", and the surface key is `floating` — while
the household only ever sees "Apple." Recorded here as the correct pattern the
other terms should follow.

---

entry: gls-basket

## Basket

**Definition.** What a household is buying — the collected products it intends to
purchase. Rendered on the shopping surfaces with the title "Basket"
(`client/src/pages/shopping-workspace-page.tsx#L2150`,
`client/src/pages/shopping-list-page.tsx#L2860`).

**Approved name:** *Basket.*

**Names THA wrongly uses for it today.** Called four different things across the
surfaces, reached by five different routes:

- **Four surface names:**
  - "Basket" — `client/src/pages/shopping-workspace-page.tsx#L2150`,
    `client/src/pages/shopping-list-page.tsx#L2860` (title) and `#L3036`,
    `client/src/pages/dashboard.tsx#L374`,
    `client/src/components/KitchenToBasketVisual.tsx#L93`.
  - "Shopping" — nav label at `client/src/components/nav-bar.tsx#L43`,
    the workspace title at `client/src/pages/shopping-workspace-page.tsx#L2250`
    and `#L2275`, `client/src/pages/home-experience-page.tsx#L234`,
    `client/src/pages/shopping-list-page.tsx#L3007`.
  - "Shopping List" — `client/src/components/ShoppingListScanReview.tsx#L144`
    (badge), and the `ShoppingListView` / `shopping-list-page` naming.
  - "List" — the bare `/list` route below.
- **Five routes** (`client/src/App.tsx`):
  - `/analyse-basket` → `ShoppingListPage` (`#L211`)
  - `/basket` → `ShoppingListPage` (`#L212`)
  - `/list` → redirect to `/shopping-workspace` (`#L238`)
  - `/shopping-list` → redirect to `/shopping-workspace` (`#L239`)
  - `/shopping-workspace` → `ShoppingWorkspacePage` (`#L240`)

Two different pages (`ShoppingListPage` and `ShoppingWorkspacePage`) both render
"the basket," which is the duplication recorded as `fnd-shopping-duplicate`.

## Known defects

- `fnd-shopping-duplicate` — two pages, four names and five routes resolve to the
  same "basket" concept. See PDA1.

---

entry: gls-simply-better-choices

## Simply Better Choices

**Definition.** THA's name for the one easy upgrade it offers on a product or a
meal — a single, gentle "swap this for that" suggestion. Rendered by
`client/src/components/intelligence/SimplyBetterChoiceCard.tsx`.

**Approved name:** *Simply Better Choices.*

**Names THA wrongly uses for it today.** None — this term is used consistently
everywhere it appears: the card component (`SimplyBetterChoiceCard`), the meal
panel heading "Simply Better Choices"
(`client/src/components/meal-detail/SimplyBetterChoicesPanel.tsx#L40`), and the
nutrition, pantry and shopping intelligence panels all use the same name.
Recorded as a term that is behaving.

---

entry: gls-tha-picks

## THA Picks

**Definition.** The admin's name for a curated preferred product — a product an
administrator has marked as preferred. Titled "THA Picks - Preferred Products" in
the admin tool (`client/src/pages/admin-ingredient-products-page.tsx#L194`).

**Approved name:** *THA Picks* (admin-facing, internal).

**Scope.** Never shown to a household — it is an administrative term for a curated
selection, correctly kept out of the household-facing surfaces.

---

entry: gls-bad-apple

## Bad Apple

**Definition.** The internal name for a product carrying multiple high-risk
additives. The warning modal file is `BadAppleWarningModal`
(`client/src/components/BadAppleWarningModal.tsx`).

**Approved name:** *Bad Apple* (internal only).

**What the household sees instead.** Households are never shown the phrase "Bad
Apple." The modal's title to the household is **"Highly Ultra-Processed"**
(`client/src/components/BadAppleWarningModal.tsx#L100`). Recorded as the correct
split between an internal codename and the household-facing phrase.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
