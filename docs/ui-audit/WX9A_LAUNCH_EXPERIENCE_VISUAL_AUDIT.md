# WX9A — Launch Experience Visual Audit
**The Healthy Apples · UI Snapshot Report**
**Date:** 26 June 2026
**Auditor:** Automated visual capture + analysis
**Viewports captured:** 1440 × 900 (desktop), 1280 × 800 (laptop)
**Auth method:** Demo session (POST /api/demo/start)
**Screenshots folder:** `docs/ui-audit/wx9a-snapshots/` (40 files)

---

## Executive Summary

The Healthy Apples presents a coherent, calm, and branded visual identity throughout. The "Calm Orchard" design language — warm cream/sage palette, orchard background, DM Sans headings — is consistent across all authenticated pages. The product has reached a high level of visual polish on most screens.

**Three issues require attention before a public launch:**
1. `/shopping` returns a 404 — a broken nav link risk depending on how "Shop" is routed
2. Cookbook meal images are not loading in the demo session (empty placeholders on all cards)
3. The Basket page renders in a narrow centred column at 1440px, leaving large empty margins

Additional medium-priority observations are documented below.

---

## Severity Key

| Symbol | Meaning |
|--------|---------|
| 🔴 | Critical — broken, blank, or 404 |
| 🟠 | High — visible regression or strong UX gap |
| 🟡 | Medium — polish or consistency issue |
| 🟢 | Low / Informational — worth noting, not blocking |

---

## Page-by-Page Findings

---

### 1. Dashboard / Home (`/` → renders as Quick List)

**Screenshot:** `01-dashboard-desktop-1440-fold.png`

**What renders:** The authenticated landing page resolves to the "Quick List" entry screen — a large text-area centred on the orchard background with three placeholder lines ("milk, eggs", "oven chips", "bananas, yoghurt") and four action icons below.

**Observations:**
- 🟢 The orchard background renders beautifully at 1440px. Typography is strong.
- 🟢 Sidebar navigation is fully visible and correctly highlights "Quick List".
- 🟢 Demo trial banner ("Trial expires in 19:50") is clearly visible and dismissible.
- 🟡 The landing experience for a new user is a blank text entry box with no orientation context (no headline, no "here's what you can do"). First-time users arriving here after signup have no signpost to the Planner, Cookbook, or Basket until they explore the sidebar. Consider a first-visit onboarding nudge or a brief welcome card.
- 🟢 The top bar shows the THA logo centred, basket icon (with badge "12"), and apple icon — clean and uncluttered.

---

### 2. Planner (`/planner`)

**Screenshots:** `02-planner-desktop-1440-fold.png`, `02-planner-desktop-1440-full.png`

**Observations:**
- 🟢 The week grid renders correctly at 1440px. Monday–Sunday columns are evenly distributed. Meal cards show meal names and plant diversity chips ("4 Grains + Herbs", "5 boost ideas").
- 🟢 The Assistant Panel on the right (PLAN / ADD & IMPORT / MANAGE sections) is well-organised and not overwhelming.
- 🟢 Intelligence cards above the grid ("Your household discovered…", "In Season", "You Could", "Your Kitchen") add genuine value and are visually distinctive.
- 🟠 **Planner grid cut off at the fold.** At 1440×900 the Dinner row is partially visible but cut off by the viewport bottom. The intelligence cards + header take ~440px, leaving only ~360px for the grid rows. A user lands on the planner and cannot see their Dinner assignments without scrolling. The "above fold" view shows Breakfast and Lunch slots only — Dinner requires scroll. This is a meaningful UX problem for a meal planner where all three rows need to be legible at a glance.
- 🟡 The "Plants This Week" progress bar (`18/30`) overflows slightly past the visible panel width at 1440px — the variety dot-chips on the right (Fruit · Vegetables · Whole grains · Herbs & spices · Olive oil) are truncated with no "..." or overflow indicator.
- 🟢 Planner correctly shows "9 meals planned out of 28 this week" and "4 days covered" chips — good data density.
- 🟢 Week selector ("Week 1") dropdown, edit pencil, "Plan" and "Send week to basket" buttons all present and clearly actionable.
- 🟡 The full-page screenshot is identical to the fold screenshot, confirming the page is not a scrollable document — the grid + assistant panel fill the viewport. This is correct by design but means layout tightness cannot be escaped by scrolling.

---

### 3. Cookbook (`/cookbook`)

**Screenshots:** `03-cookbook-desktop-1440-fold.png`, `03-cookbook-desktop-1440-full.png`

**Observations:**
- 🟢 Four-column meal card grid renders cleanly. Card layout (tabs: Ingredients / Nutrition / Why Good, action icons, quantity badge) is consistent across all cards.
- 🔴 **All meal images are broken.** Every card shows the same grey broken-image placeholder icon. In the demo session, no meal card images loaded. This is a significant visual gap for a food product — meal cards without food photography look unfinished and erode trust. Root cause likely: image URLs stored in demo meals point to external sources (e.g. TheMealDB) that either time out or the demo records have null image URLs.
- 🟢 The right-hand sidebar panel (Search cookbook, Create: Build/Scan/Add, Display: Grid/List/Filter) is well-structured.
- 🟢 The "Find recipes from across the web" discovery banner at the top renders correctly.
- 🟢 MY FREEZER section renders with a "No frozen meals yet" empty state — snowflake icon + explanatory copy is appropriate and polished.
- 🟢 Tab bar (My Cookbook / Recipes / My Freezer / Packaged) is clean and clickable.
- 🟡 At 1440px, four meal cards each ~160px wide sit in an 820px content column with a 170px right panel. Cards feel slightly compressed — the meal name "Baked Salmon with Tenderstem Broccoli" truncates. A wider content column or 3-wide grid at this breakpoint could breathe more.

---

### 4. Basket / Shopping (`/basket`)

**Screenshots:** `06-basket-desktop-1440-fold.png`, `06-basket-desktop-1440-full.png`

**Observations:**
- 🟠 **Basket content is narrow-centred at 1440px.** The list content renders in a ~460px wide centred column, leaving approximately 490px of unused space on each side. At 1440px this feels very empty. The orchard background fills the margins beautifully but the product list itself looks undersized for the canvas.
- 🟢 Category grouping (Produce, Dairy, Eggs, Meat, Fish, etc.) with expand/collapse is well-designed and scannable.
- 🟢 Per-item controls (–/+/Options, checkbox, delete) are consistent and accessible.
- 🟢 The "Demo Household · Shared basket" label at the top of the list panel sets household context well.
- 🟢 Mode/View/Sort controls in the header (Review · All · Quality) are clear.
- 🟢 The basket icon in the topbar correctly shows "12" badge — live count confirmed working.
- 🟡 "No quantity set" appears under multiple items. In a launch context this looks like incomplete data rather than a feature. Either hide when null or show a softer placeholder.
- 🔴 **`/shopping` → 404.** The route `/shopping` returns a 404 not-found page. If any nav link, email, or external reference points to `/shopping`, users hit a dead end. The actual routes are `/basket` (Basket Review) and `/shopping-list` (Quick List). Verify the sidebar "Shop" link and any deep-link references resolve to `/basket`.

---

### 5. Shopping List / Quick List (`/shopping-list`)

**Screenshot:** `06b-shopping-list-desktop-1440-fold.png`

**Observations:**
- 🟢 Clean, focused entry screen. The orchard background works particularly well here — calm and uncluttered.
- 🟢 The "Write your list naturally" helper banner is clear and dismissible.
- 🟡 This page is visually identical to the `/` dashboard. New users who navigate to both will see the exact same screen twice without realising they are different URLs. The page title ("Quick List") matches the sidebar label, which helps — but consider whether "/" should render a different home/landing view for authenticated users.

---

### 6. Analyse Basket (`/analyse-basket`)

**Screenshot:** `06c-analyse-basket-desktop-1440-fold.png`

**Observations:**
- 🟢 Routes correctly to the Basket view in Review mode (same component as `/basket`).
- 🟢 No visual difference from `/basket` — these routes share a component, which is appropriate.

---

### 7. Pantry (`/pantry`)

**Screenshots:** `07-pantry-desktop-1440-fold.png`, `07-pantry-desktop-1440-full.png`

**Observations:**
- 🟢 Two-column layout (Food Pantry left, Household Essentials right) renders clearly at 1440px.
- 🟢 Tab bar (Larder / Fridge / Freezer / Fruit) and secondary tabs (Inventory / Explore) are cleanly styled.
- 🟢 Household Essentials (Toilet roll, Kitchen roll, Tissues, Washing up liquid, etc.) with "+ Need" quick-add buttons is a nice value-add differentiator.
- 🟡 Items carry a small "+ Need" dotted-border chip. The meaning of this is not immediately obvious without tooltip or explanation — first-time users may not understand what "Need" does vs adding to the basket.
- 🟢 "Seeds like chia and flaxseed are small but surprisingly rich in plant-based omega-3." — the subtle tip banner at the top is a nice content touch.
- 🟢 Onboarding nudge banner ("Add the ingredients you have at home…") is present and dismissible.
- 🟡 Full-page screenshot is the same as fold — the pantry lists are scrollable inside the panels but the page shell doesn't extend. Items are cut off at the bottom of each panel. Pantry items below "Worcestershire sauce" are not visible. This is correct by design but means users with long pantry lists must scroll within the panel, which is not visually hinted.

---

### 8. Household Nutrition Centre (`/plant-diversity`)

**Screenshots:** `08-nutrition-centre-desktop-1440-fold.png`, `08-nutrition-centre-desktop-1440-full.png`

**Observations:**
- 🟢 Clean summary stats at top (16 Plants, 17 Foods, 9 Meals, 15 Foods discovered, 2 In season) are scannable and motivating.
- 🟢 Food category progress bars (Dairy alternatives, Fruit, Grains, Proteins, Spices, Mushrooms, etc.) provide a clear visual picture of nutritional variety.
- 🟡 **No active sidebar nav state.** When on this page, none of the sidebar items (Quick List, Cookbook, Planner, etc.) is highlighted. The Nutrition Centre is accessed from the Planner context ("Back to your week" breadcrumb) but has no dedicated nav item. New users who land here via a direct link or are exploring may not know where they are in the app.
- 🟡 The "Back to your week" breadcrumb at the top anchors this page to the Planner. This is fine contextually but means the page feels like a sub-page rather than a first-class feature.
- 🟢 "YOUR NUTRITION JOURNEY" section (21 Nutrients, 12 Health benefits, 8 of 13 food categories) panel renders cleanly and is motivating.
- 🟢 The orchard background is visible through the white/warm-white panels and looks excellent at this page layout.

---

### 9. Profile (`/profile`)

**Screenshots:** `09-profile-desktop-1440-fold.png`, `09-profile-desktop-1440-full.png`

**Observations:**
- 🟡 **Background colour inconsistency.** The profile page renders with a noticeably pinkish/lavender-tinted background gradient, while every other page in the app uses the warm cream/orchard background. The orchard image appears absent or is overridden by a tinted overlay. This is the most jarring visual inconsistency in the app — it looks like the profile page is on a different product.
- 🟢 The accordion structure (PERSONAL > Dietary Pattern, SHOPPING & UPF) is clean and scannable.
- 🟢 "Demo User" with avatar initial, email address, "2 Adults · Moderately Active" chips render correctly.
- 🟢 The THA apple logo badge on the profile card is a nice branded touch.
- 🟢 Row-level chevrons for each setting (Dietary Pattern, Allergies, Budget, etc.) indicate expandability clearly.
- 🟡 All settings show "No preference", "None", "Not set" — the profile is empty. This is expected for a fresh demo user but in a launch context, consider pre-populating the demo profile with example values to show the profile in its "filled" state.
- 🟢 "← Back" navigation in the top-right is clean.

---

### 10. Food Detail Page (`/foods/tomato`)

**Screenshots:** `05-food-page-tomato-desktop-1440-fold.png`, `05-food-page-tomato-desktop-1440-full.png`

**Observations:**
- 🟢 Excellent content quality. "Why It Matters", "Key Nutrients", "In Season", "In The Cookbook" sections all populated and clearly laid out.
- 🟢 The small green apple icon before "Tomato" heading is a lovely branded detail.
- 🟢 Health benefit chips (Heart Health, Skin Health, Healthy Ageing) are well-styled tags.
- 🟢 "Tomato is at its best in the UK summer" — seasonal context is a real differentiator.
- 🟡 **No active sidebar nav state.** Food detail pages are not reachable from the main sidebar, so no item highlights. A user arriving here via a Planner deep-link or search result has no visual anchor in the nav.
- 🟢 "← Back" breadcrumb is present.
- 🟡 The full-page screenshot clips just below "In The Cookbook" — further content below the fold (e.g. "YOUR KITCHEN" section partially visible) is present. The page is scrollable and well-structured.

---

### 11. My Diary (`/my-diary`)

**Screenshots:** `10-my-diary-desktop-1440-fold.png`

**Observations:**
- 🟢 Five meal slots (Breakfast, Lunch, Dinner, Snacks, Drinks) with "+ Add" buttons render cleanly in a left panel.
- 🟢 "Health Snapshot" panel shows BMI (not set), kcal/day (not set), Activity (Moderate / Optimal) — appropriate empty state for a demo user.
- 🟢 Daily Signals panel (Weight input, Mood, Energy) with Save / +CSV buttons is clear.
- 🟢 "Looking forward to…" card on the right with "+" button is a nice motivational touch.
- 🟢 Day navigation with date ("Fri, 26 Jun") and ‹ › arrows is clean and functional.
- 🟢 "Want to eat less processed food?" awareness banner at the top with "Learn our approach →" is a useful content nudge.
- 🟡 The three-column layout (meal log | daily signals | looking forward) is slightly cramped at 1440px — columns are ~390px, ~270px, and ~170px respectively. The "Daily Signals" panel is narrower than it needs to be, making the weight input field feel tight.
- 🟢 "My Diary" is correctly highlighted as the active sidebar item.

---

### 12. Partners (`/partners`)

**Screenshots:** `11-partners-desktop-1440-fold.png`, `11-partners-desktop-1440-full.png`

**Observations:**
- 🟢 **Best above-the-fold experience in the app.** The Partners hero — "Support your health beyond the basket" — on the full-width orchard background with "Explore Partners" and "Become a Partner" CTAs is compelling and launch-ready.
- 🟢 "Curated Wellness Partners" badge above the headline adds trust signalling.
- 🟢 Three featured partner cards (Calm Orchard Yoga, Rooted Nutrition Studio, Still Morning Meditation) render with avatar initials, "THA Recommended" + "Featured" badges, and descriptive copy.
- 🟢 The orchard background is used to full effect here — the wide layout breathes at 1440px.
- 🟡 Partner cards use coloured square avatars with initials (CO, RN, SM) in place of logos. Before launch, real partner logos or photography would significantly upgrade trust.
- 🟢 The sidebar is present and shows the authenticated nav — this page works well in both authenticated and potentially public contexts.

---

## Route Map Findings

| Route | Status | Notes |
|-------|--------|-------|
| `/` | ✅ 200 | Renders Quick List (shopping-list entry) |
| `/planner` | ✅ 200 | Week grid + assistant panel |
| `/cookbook` | ✅ 200 | Meal card grid (images broken) |
| `/basket` | ✅ 200 | Basket review — actual shopping route |
| `/shopping-list` | ✅ 200 | Quick List (same as `/`) |
| `/analyse-basket` | ✅ 200 | Same component as `/basket` |
| `/shopping` | ❌ 404 | **Dead route — verify no nav links point here** |
| `/pantry` | ✅ 200 | Food Pantry + Household Essentials |
| `/plant-diversity` | ✅ 200 | Household Nutrition Centre |
| `/profile` | ✅ 200 | User profile settings |
| `/foods/tomato` | ✅ 200 | Food detail page |
| `/my-diary` | ✅ 200 | Daily diary + wellbeing signals |
| `/partners` | ✅ 200 | Wellness partners (public-facing) |

---

## Consolidated Issue Register

| # | Severity | Page | Issue |
|---|----------|------|-------|
| 1 | 🔴 Critical | Shopping | `/shopping` → 404. Verify no sidebar/email/link references this route. Correct routes: `/basket`, `/shopping-list` |
| 2 | 🔴 Critical | Cookbook | All meal card images broken/missing in demo session. Food cards without images look unfinished. |
| 3 | 🟠 High | Basket | Content renders in a ~460px centred column at 1440px. Large empty side margins — layout doesn't scale to wide viewports. |
| 4 | 🟠 High | Planner | Dinner row cut off at fold on 1440×900. Intelligence cards + headers consume ~440px, leaving only ~360px for the grid. |
| 5 | 🟡 Medium | Profile | Background is pinkish/lavender — inconsistent with the warm cream/orchard palette used everywhere else. |
| 6 | 🟡 Medium | Cookbook | Meal card title "Baked Salmon with Tenderstem Broccoli" truncated. Cards slightly compressed in 4-column layout. |
| 7 | 🟡 Medium | Planner | Plant variety chips ("Fruit · Vegetables · Whole grains…") truncate off-screen at right edge of the panel. |
| 8 | 🟡 Medium | Nutrition Centre | No active sidebar nav state — page appears detached from the nav when accessed directly. |
| 9 | 🟡 Medium | Food Detail | No active sidebar nav state on `/foods/*` pages. |
| 10 | 🟡 Medium | Dashboard | Authenticated landing = empty Quick List text box with no orientation for new users. Consider a welcome card or first-visit nudge. |
| 11 | 🟢 Low | Basket | "No quantity set" label on items looks like missing data; consider hiding when null. |
| 12 | 🟢 Low | Pantry | "+ Need" button meaning is not immediately obvious — tooltip or label on hover would help. |
| 13 | 🟢 Low | Profile | Demo profile is entirely empty ("Not set") — pre-populate with example data for demo/launch context. |
| 14 | 🟢 Low | Partners | Partner avatars are coloured initials. Real logos would increase perceived credibility before launch. |
| 15 | 🟢 Info | All pages | Demo trial countdown banner ("Trial expires in 19:50") works correctly and dismisses with ✕. |
| 16 | 🟢 Info | Browser console | React "invalid hook call" and "unique key prop" warnings on WeeklyPlannerPage — not visible to users but should be addressed post-launch. |

---

## Design System Consistency

| Aspect | Status | Notes |
|--------|--------|-------|
| Orchard background | ✅ Consistent | Visible on all pages except Profile (🟡) |
| Sidebar navigation | ✅ Consistent | Present on all authenticated pages; active state works on main nav items |
| Demo trial banner | ✅ Consistent | Visible and dismissible on all pages |
| Top bar (logo centred, basket icon) | ✅ Consistent | Clean, uncluttered throughout |
| DM Sans headings | ✅ Consistent | Used correctly on all page H1s |
| Card style (shadow-none, border) | ✅ Consistent | Cards have appropriate borders throughout |
| Warm cream/sage palette | ⚠️ 1 exception | Profile page uses a different background tint |

---

## Launch Readiness Summary

| Area | Assessment |
|------|-----------|
| Visual identity / brand | ✅ Strong — Calm Orchard system is well-executed |
| Navigation structure | ⚠️ `/shopping` 404 must be resolved |
| Core page rendering | ⚠️ Cookbook images broken; Planner fold truncation |
| Wide-viewport layout | ⚠️ Basket narrow-column issue at 1440px |
| Empty states | ✅ Generally handled well with helpful copy |
| Cross-page consistency | ⚠️ Profile background mismatch |
| Mobile (not captured) | ⚪ Not in scope for this audit — recommend separate mobile audit |

**Recommended fixes before launch (in priority order):**
1. Resolve `/shopping` → 404 (or redirect to `/basket`)
2. Fix cookbook meal images for the demo dataset
3. Widen Basket layout at large viewports (or use a two-column layout above 1200px)
4. Fix Profile page background to use the orchard/warm-cream palette
5. Reduce Planner above-fold content height so the grid is visible without scrolling

---

*Report generated from 40 automated browser screenshots (20 fold + 20 full-page) across 13 routes at 1440×900 and 1280×800. No application code was modified during this audit.*
