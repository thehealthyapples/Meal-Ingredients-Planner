# WS2 — Pantry Explore V2 · Implementation Record

**Status:** Implemented
**Date:** 2026-06-22
**Branch:** `safety/preserve-since-last-prod-20260617-1613`
**Spec:** [`WS2_PANTRY_EXPLORE_V2.md`](./WS2_PANTRY_EXPLORE_V2.md) (the specification — this
document records how it was built and verified)

> Pantry becomes **the Home of Food**. It is **READ ONLY**. It owns **UI** only.
> Discovery (WS8), Alternatives (WS9), Stories (WS10) and Seasonal Stories (WS11)
> are engines Pantry *consumes* — never reimplements.

---

## 1. Rollback protection (mandatory first step — confirmed)

| Item | Value |
| --- | --- |
| **Rollback tag** | `ws2-pantry-v2-rollback` |
| **Rollback commit** | `f531216` |
| Branch | `safety/preserve-since-last-prod-20260617-1613` |
| Working tree at tag | clean |

**To revert WS2 entirely:**

```bash
git checkout ws2-pantry-v2-rollback        # inspect
git reset --hard ws2-pantry-v2-rollback    # full revert
```

Because WS2 writes no data and changes no engine, a code-level revert is a complete
rollback. Removing the two changed files' additions removes WS2 in its entirety.

### Protected workstreams — confirmed intact at the rollback point

| Workstream | Protected at | Evidence |
| --- | --- | --- |
| WS0.12 (Catalogue Normalisation / Promotion) | `b47afcb` | committed; `ws0.12-rollback-point` |
| WS7 (Food Relationship Graph) | `a7eaef5` | committed; `rollback-ws7-start-20260620` |
| WS8 (Discovery Engine) | `0a996f8` | `shared/discovery/` (6 files); tests pass |
| WS9 (Alternatives Engine) | `52cd86d` | `shared/alternatives/` (5 files); tests pass |
| WS10 (Household Stories Engine) | `0dd662a` | `shared/stories/` (5 files); tests pass |
| WS11 (Seasonal Stories Engine) | `f531216` | `shared/seasonal/` (4 files); tests pass |

All four engines were re-run during this implementation and **all checks passed**
(see §7). No engine source was modified.

---

## 2. Implementation approach

WS2 is a **read-only presentation layer** in two parts, both additive:

1. **Read API** — four thin `GET` routes in `server/routes.ts`. Each assembles a
   household's own history from existing planner tables, calls the relevant engine,
   strips internal signals, and returns the result. No writes, no business logic,
   no stored summaries.
2. **UI** — `client/src/components/PantryKnowledgeHub.tsx` (Explore mode only) gains
   a Home surface, an alias-resolving search, an Explore-Topics model, and the four
   engine surfaces threaded into the existing Food Page (the WS1 Knowledge Hub
   spine). Inventory mode is untouched.

The design rule throughout is **empty-is-silent**: every engine surface renders
nothing (not "nothing yet") when its sections are empty, so a sparse household sees
a short, warm page rather than a chore-list.

### Files changed

| File | Change |
| --- | --- |
| `server/routes.ts` | +4 read routes + `buildHouseholdHistory()` helper (≈130 lines) |
| `client/src/components/PantryKnowledgeHub.tsx` | Home / Search / Topics / Food Page engine surfaces (+667 / −169) |
| `docs/investigations/knowledge/WS2_PANTRY_EXPLORE_V2.md` | spec (new, untracked) |

No new files, no schema changes, no migrations.

---

## 3. API endpoints added

All `GET`, all auth-gated (`401` when unauthenticated), all read-only, all
display-stripped.

| Endpoint | Wraps | Notes |
| --- | --- | --- |
| `GET /api/pantry/discover?food=<slug>` | `discover()` (WS8) | `food` optional → household-only discovery for Home; `limitPerType: 3`; **`familiar` + `source` stripped** |
| `GET /api/pantry/alternatives?food=<slug>&diet=<diet>` | `alternatives()` (WS9) | `food` required (`400` if absent); `diet=lower_upf` → `preferLowerUpf`; other diets → exclusion gate; **`source` stripped** |
| `GET /api/pantry/stories?food=<slug>` | `stories()` (WS10) | Home → 1 card; food page → ≤3, filtered to that food (+ household-level cards) |
| `GET /api/pantry/seasonal` | `seasonalStories()` (WS11) | season defaults to "now"; composes WS10 + WS8 internally; nothing persisted |

`buildHouseholdHistory(userId)` assembles `HouseholdHistory` from
`getPlannerWeeks` → `getPlannerDays` → `getPlannerEntriesForDay` → `getMeal`,
parsing each meal's ingredients into `MealEntry` records (canonical slug via
`singularizeIngredientKey`). It reads only; it stores nothing.

### Display-stripping (trust risk #2 — internal signals)

- Discover: each suggestion has `familiar` and `source` removed server-side.
- Alternatives: each option has `source` removed server-side.
- Verified live: the strings `"familiar"` and `"source"` do **not** appear in any
  discover/alternatives payload (§7).

---

## 4. UI components added (all in `PantryKnowledgeHub.tsx`, Explore mode)

| Component | Role |
| --- | --- |
| `HomeView` | The Home of Food. Sections in spec order (§5). |
| `HomeSearchResults` | Inline results when the Home search field is active. |
| `TopicView` | Explore Topics — editorial list + derived contents (§7 of spec). |
| `FoodDetailView` | The Food Page: knowledge spine + four engine surfaces (§6 of spec). |
| `BrowseView` | "All foods" browse/filter (reached from the Explore-Topics row). |
| `NutrientDetailView` / `BenefitDetailView` | Existing WS1 knowledge detail pages. |
| `EngineSection` helpers (`HomeSection`, `FoodSection`) | Render-nothing-when-empty wrappers enforcing empty-is-silent. |

### Home order (spec §4 — implemented exactly)

`Search → Recent → This Season → Discover → Your Household → Explore Topics`

- **Search** — always first; calm field, alias-resolving, debounced.
- **Recent** — last viewed foods from `localStorage` (`pantry-explore-recent-v2`), max 3 shown. Silent when empty.
- **This Season** — WS11 hero: `seasonal_habits` lines + a quiet `looking_ahead` line. Falls back to evergreen looking-ahead on cold start.
- **Discover** — WS8, one section, ≤3 items, grid (no carousel, no "see more").
- **Your Household** — WS10, one story card.
- **Explore Topics** — editorial manifest (`EXPLORE_TOPICS`) + "All foods".

### Food Page order (spec §6 — implemented exactly)

`Hero → Benefits → Key nutrients → Varieties → Discover → Alternatives → Stories → Seasonal`

- Single vertical scroll of cards.
- **Alternatives** is the one collapsed surface: a calm `Need a swap?` prompt with
  `Vegetarian · Dairy-free · Keto · Lower UPF` pills; tapping a need expands that
  diet's `alternatives()` sections inline (lazy-fetched).
- `reason`, `note`, `headline`, `facts` rendered verbatim.

### Explore Topics architecture (spec §7)

Editorial **list** + derived **contents**, three tiers:

- Knowledge-derived (Mediterranean, Healthy fats, Plant protein, Better sleep, Gut health) → `/api/knowledge/search` over the topic query.
- Engine-derived: Family favourites → WS10 `favourite_foods`; Seasonal foods → WS8 `seasonal` discovery.
- No food lists are hard-coded — only `title / icon / query` are editorial.

---

## 5. Mobile behaviour

- Food Page is a **single vertical scroll** of cards — no accordions (the only
  collapse is Alternatives, which is a *trust* decision, not a length one).
- Discover/Topic grids are `grid-cols-2` on mobile, `sm:grid-cols-3` above.
- Search results are full-width image-left rows.
- Inventory mode's responsive behaviour is untouched.

## 6. Desktop behaviour

- Rendered inside the existing max-width Pantry container (no sidebar redesign).
- Food Page remains a single reading flow; grids widen to 3-up.
- Inventory mode untouched.

---

## 7. Manual test results

**Typecheck:** `npm run typecheck` — WS2 files (`server/routes.ts`,
`PantryKnowledgeHub.tsx`) produce **zero** errors. The 24 pre-existing errors are
all in unrelated `server/tests/*` and `server/scripts/*` files and are identical on
the clean rollback baseline (confirmed by stash-compare).

**Engine tests (WS8–WS11):** all pass, engines unmodified.

| Engine | Result |
| --- | --- |
| WS8 Discovery | `ALL CHECKS PASSED ✓` |
| WS9 Alternatives | `all worked examples, gates and trust checks passed ✓` |
| WS10 Stories | `all worked examples, gates and trust checks passed ✓` |
| WS11 Seasonal | `all worked examples, gates and trust checks passed ✓` |

(Report JSONs regenerated by the test runs were reverted to keep the WS2 diff clean.)

**Live API smoke test** (dev server, authenticated session):

| Check | Result |
| --- | --- |
| All four routes `401` when unauthenticated | ✓ (auth-gated, no crash) |
| `discover?food=tomato` returns sections | ✓ 5 sections, anchor `tomato` |
| Discover payload contains no `familiar` / `source` | ✓ neither key present |
| Discover reasons rendered verbatim | ✓ e.g. "Cherry Tomato is a variety of Tomato." |
| `alternatives?food=milk&diet=dairy_free` | ✓ `dietary` → Oat Milk, reason verbatim, no `source` |
| `alternatives?food=rice` | ✓ `meal_role` → Brown Rice, `note` verbatim, no `source` |
| `alternatives?food=tomato&diet=lower_upf` (legit empty) | ✓ empty sections (silent) |
| `alternatives` with no `food` | ✓ `400` |
| `seasonal` (cold start) | ✓ "Summer 2026", `looking_ahead` block (evergreen) |
| `stories` (cold start) | ✓ 0 sections (empty-is-silent) |
| Search alias `zucchini` → Courgette | ✓ resolves to canonical `courgette` |

**Trust-rule spot checks:** no scores, rankings, grades or percentages appear in any
payload; all evaluative copy originates in the trust-guarded engines; chips are
positive-only (seasonal). Verified against the spec checklist (§13).

### Spec manual-test checklist

| Check | Status |
| --- | --- |
| Explore mode loads | ✓ (component renders Home) |
| Inventory mode unchanged | ✓ (no Inventory code touched) |
| Search resolves aliases | ✓ (zucchini → Courgette) |
| Discover returns max 3 | ✓ (`limitPerType: 3`, UI `.slice(0,3)`) |
| Alternatives collapsed by default | ✓ (lazy, `enabled: openDiet !== null`) |
| Stories omitted when absent | ✓ (empty-is-silent) |
| Seasonal hero renders | ✓ |
| Empty sections omitted | ✓ |
| No scores / no ranking appear | ✓ |

> Not yet exercised in a real browser session: full visual mobile/desktop layout and
> screenshots (see §8). All behavioural contracts above were verified at the API and
> type level.

---

## 8. Screenshots

Not captured in this implementation pass (verification was API- and type-level via a
local authenticated session). The UI follows the worked-example layouts in spec
§14. A browser screenshot pass is the recommended next verification step before
promotion.

---

## 9. Risks

1. **Empty-is-silent must hold end-to-end.** Mitigated by render-nothing-when-empty
   section wrappers; verified cold-start returns silent sections, not empty states.
2. **Leaking internal signals.** Mitigated by server-side stripping of
   `familiar`/`source`; verified absent from live payloads. *Suggested follow-up:* a
   regression test asserting these keys never appear.
3. **Re-introducing ranking by accident.** No rank numbers, %, "top" or sort controls
   are rendered; reasons are verbatim only.
4. **Stories/Season flicker.** Home picks the first card and queries are cached
   (`staleTime: 5 min`), so memories don't jump within a session.
5. **Household-context assembly cost.** `buildHouseholdHistory` walks planner
   weeks/days/entries per request. Fine at current scale; *suggested follow-up:*
   per-household session cache if planner history grows large.
6. **Cold-start reading as "broken".** Mitigated by evergreen This Season +
   Explore Topics, which always render with no history.

### Minor note (in-scope, defensible)

The food-page stories filter keeps cards with a matching `slug` **and** household-level
cards with no `slug` (e.g. "Friday became pizza night"). This is intentional so
household-wide memories aren't lost, but it means a slug-less story can appear on any
food page. Acceptable under the spec; flagged for review if stricter
food-only scoping is wanted later.

---

## 10. Data impact

| Question | Answer |
| --- | --- |
| Reads existing data | **YES** (knowledge tables + planner history, via engines) |
| Writes new data | **NO** |
| Changes meaning of existing data | **NO** |
| Requires backfill | **NO** |

---

## SUGGESTION (future — not in scope, not built)

- **Food Wrapped** — `seasonalStories()` over a year window, rendered with the
  Season-view template; a new *route*, not a redesign.
- **Saved / followed foods** — would be Pantry's first *write*; deliberately excluded.
- **Topic editor UI** — turn the `EXPLORE_TOPICS` manifest into an admin surface.
- **Internal-signal regression test** — assert `familiar`/`source` never appear in
  `/api/pantry/*` payloads (hardens risk #2).
- **Household-context session cache** — memoise `buildHouseholdHistory` per household
  per session if planner history grows.
- **Browser screenshot pass** — capture mobile + desktop Home and Food Page before
  promotion (§8).

---

## Scope lock (honoured)

Built: **Pantry Explore V2** read APIs + Explore-mode UI only. **Not** built: Food
Wrapped, Social, Dashboard redesign, saved/followed foods, new engines, new
scoring/ranking, Inventory changes. Pantry remains read-only: it consumes
WS8/WS9/WS10/WS11 and displays their results — it owns the UI, nothing else.
