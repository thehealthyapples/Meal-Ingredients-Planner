# HOUSE2 — Daily Household Experience

**Status:** Complete
**Session:** `HOUSE2_Daily_Household_Experience`
**Rollback:** `rollback/HOUSE2-daily-household-experience-20260719` → `772eb6ed`
(annotated, `rollback-verify.sh` PASS); worktree snapshot `refs/snapshots/HOUSE2-worktree-20260719` → `fd029a7e`
**Date:** 2026-07-19

---

## 1. Mission and scope lock

Complete the everyday household experience — arrival, Today, and the movement between
Planner, Shopping, Pantry, Cookbook, Nutrition, Analyser and Companion — using **only
what the platform already has**.

Scope lock, held throughout: no new intelligence, no new architecture, no new
capabilities, no schema changes, existing services only. Every change below is a
friction removal, a reuse of an existing owner, or a deletion of duplicate UX. **No new
component was written.** The two components doing the work — `EmptyState` and
`LoadError` — already existed as canonical owners; HOUSE2 adopted them where they had
not been adopted.

## 2. HOUSE2 did not re-derive the friction inventory

The inventory this programme would otherwise have produced **already existed**:
`docs/investigations/ux/PDA1_PLATFORM_DISCOVERY_AND_EXPERIENCE_AUDIT.md` (31 findings,
`fnd-*` ids). HOUSE2's job was therefore not to re-audit but to establish **which
findings are still true of the code today**, and close the everyday-household ones.

That verification changed the picture materially — five findings were already closed by
later programmes, and **two of the remaining premises turned out to be wrong** (§5).

| Finding | Status verified against code | Closed by |
|---|---|---|
| `fnd-dead-reminders` | CLOSED (pre-existing) | PHASE5E / NTC-P1 |
| `fnd-derived-today` | CLOSED (pre-existing) | CONV1 P7/P8 |
| `fnd-two-apples` | CLOSED (pre-existing) | PX1-W4 (`7990f8a0`) |
| `fnd-notfound-dead-end` | CLOSED (pre-existing) | PROD1 |
| `fnd-broken-shopping-link` | CLOSED (pre-existing) | route consolidation |
| `fnd-food-detail-chrome` | **CLOSED by HOUSE2** | §3.1 |
| `fnd-food-detail-back` | **CLOSED by HOUSE2**, on revised grounds | §3.1 |
| `fnd-home-dashboard-rivalry` | **Premise wrong** — not a code defect | §5.1 |
| `fnd-shopping-duplicate` / `fnd-alias-sprawl` | **Declined** — not duplicates | §5.2 |
| `fnd-observation-as-modal` | **Declined** — safety decision, escalated | §5.3 |
| `fnd-cooked-never-reaches-diary` | Blocked — no diary endpoint exists | out of scope |
| `fnd-destructive-guard-inverted` | Open, admin-only | out of scope |

## 3. What changed

Six files. All client-side.

### 3.1 The food page became a room, not a lesser surface
`client/src/pages/food-detail-page.tsx`

A food page is reachable from **five rooms** — Pantry, Shopping, Nutrition, Cookbook and
the Companion. It rendered **no header at all** (unlike every meal page) and a bespoke
inline "Back" hardcoded to `/cookbook`, so a household arriving from the Pantry was
ejected into the Cookbook.

Both are now the canonical `WorkspaceHeader` slot. Two decisions worth recording:

- **The parent is Nutrition, not Cookbook.** That is the realm the platform *already*
  assigns this route — `FloatingAssistant.tsx:90` maps `/foods` → `"nutrition"`. The old
  Back was the outlier, not the classification.
- **Back stays hierarchy-resolving, not `window.history.back()`.** PDA1 framed this
  finding as "should use browser history". That is **superseded by platform canon**:
  PX1-W4.5 settled it for every Back in the product (`profile-page.tsx:281`, EXP §8
  "hierarchy over history"), having explicitly tried and rejected the history approach.
  A page reachable from five rooms is precisely the case that rule exists for. The
  finding is closed by giving it the *right* parent, not by breaking the canon.

The bespoke back link is deleted — one job, one control.

### 3.2 A failed load no longer claims the food doesn't exist
`client/src/pages/food-detail-page.tsx`

The query threw one undifferentiated error for **every** non-OK response, so a 500 and a
404 both rendered *"We don't know this food yet."* A server outage was telling a
household a confident falsehood about their food. 404 and non-404 are now separated:
not-found renders `EmptyState`, a failed load renders `LoadError` with a retry.

This is exactly the conflation `EmptyState`'s own contract forbids — *"a failed load is
none of these variants"*. The not-found state also gained the next action it lacked.

### 3.3 The Nutrients tab no longer renders a blank page
`client/src/components/HouseholdNutritionCentre.tsx`

The worst empty state in the product. The Centre did `return null` on **every** absence
— no data, still loading, and failed load alike. It *is* the entire Nutrients tab, so a
new household clicked a tab promising a feature and got **whitespace**, with no way to
tell empty from broken.

The original reasoning was recorded in the file and was sound *when written*: the Centre
could vanish because it left "the weekly report below as the sole experience". That
report has since moved to the **Foods** tab. The rule outlived its premise.

Now three distinct branches: `Skeleton` while loading, `LoadError` on failure, and an
`EmptyState` naming the one next action ("Plan a meal"). Progressive enrichment still
governs the *sections* — each still withholds itself when unvalidated — it just cannot
govern the room itself.

### 3.4 The Planner tells a household what an empty week is
`client/src/pages/weekly-planner-page.tsx`

The Planner had a loading branch (PX1-W4.8) and a failed-load branch (PROD1) but **no
empty branch** — seven blank columns and no words. This is the room Home's primary CTA
sends a new household to first. The only orientation was a dismissible `FirstVisitHint`;
once dismissed, the room was permanently silent.

The grid **stays rendered** — its cells *are* the affordance, so replacing them with a
card would remove the very thing to act on. The state sits above them and carries the
action. Verified: 49 cells, 58 add buttons and 7 day headers all survive alongside it.

Two secondary gains, both from reuse rather than addition:
- The action calls the existing `setAssistantMode("smart")` handler. "Plan" is otherwise
  `hidden md:inline-flex` — desktop-only, with mobile reaching it through a drawer — so
  on a phone this is the first place the action becomes **directly reachable**.
- **Duplicate UX removed:** the `FirstVisitHint` and the empty state both said "tap Plan
  to get suggestions", stacked one above the other. The hint now yields while the week
  is empty and returns once there are meals, where it still earns its place explaining
  templates and send-to-basket.

### 3.5 The Analyser has a first run
`client/src/pages/products-page.tsx`

Every content branch was gated on `hasSearched`, and the history card on having history.
A household that had never analysed anything **fell through all of them** — a search box
above an empty page. Now an `EmptyState` names both ways in (search, barcode). It points
at the header controls rather than duplicating them.

### 3.6 The Pantry's dead ends now name a next step
`client/src/pages/pantry-page.tsx`

Six category empties rendered as 12px grey italic text, of which *"No freezer items
yet."* and *"No household items yet."* named no way forward at all. All six now render
through `EmptyState` — which the file **already imported two lines away** — and every
category suggests something concrete.

Deliberately **no action button**: the add input sits immediately above this slot, so a
button here would be a second control for one job. The description points at the control
that already exists.

### 3.7 Logo target corrected (no runtime effect — stated plainly)
`client/src/components/nav-bar.tsx`

`BrandBanner` targeted `/dashboard` while both canonical logos target `/home`. Corrected
for consistency — but see §5.1: **this component is mounted nowhere**, so the change has
no user-facing effect. It is recorded as cleanup, not as a fix.

## 4. Verification

Every claim below was executed, not asserted.

| Check | Result |
|---|---|
| `tsc --noEmit` | **88 errors — baseline exactly restored, 0 introduced** |
| `npm run build` | **PASS** — 3305 modules transformed, client + server bundles emitted |
| Browser, authenticated | **PASS** — all six surfaces, 0 page errors |

The session baseline of 88 pre-existing `tsc` errors was measured on the inherited dirty
tree *before* any HOUSE2 edit, and re-measured after every change. No client-side error
was introduced at any point.

**Browser verification contradicts four prior programmes.** EXPERIENCE_VERIFY1 R1, PROD4
rec#1 and UX_REFINE1 R8 each rank "durable browser verification" as the #1 unresolved
blocker. In this environment it does not reproduce: Playwright chromium launches,
Postgres accepts connections, and the app serves on `:5000`. HOUSE2 therefore **verified
in a real browser rather than asserting**, authenticating as the existing Development
World household (`scripts/capture-ux-evidence.ts`) — reusing the established mechanism.

Empty and error branches cannot be reached by a household that has data, so they were
driven by **intercepting the API at the network layer** and returning empty and 500
payloads. This proves the branch renders without mutating anyone's data:

| Probe | Expected | Result |
|---|---|---|
| `/api/nutrition-centre` → `available:false` | empty state + plan link | **PASS** (1, 1) |
| `/api/nutrition-centre` → 500 | `LoadError`, **not** empty | **PASS** (error 1, empty 0) |
| `/api/foods/*/intelligence` → 500 | `LoadError`, **not** not-found | **PASS** (error 1, not-found 0) |
| `/api/planner/full` → entries blanked | empty week + button, **grid intact** | **PASS** (1, 1, 49 cells) |
| `/api/pantry` → `[]` | empty states, no italic dead ends | **PASS** (2 states, 0 italics) |
| `/foods/zzz-not-a-real-food` | not-found + Nutrition link | **PASS** (1, 1) |
| `/foods/broccoli` | header renders, old back link gone | **PASS** (header 2, old link 0) |
| `/products` first run | first-run state | **PASS** (1) |

The two rows proving a 500 renders as an error and **not** as "you have nothing" are the
ones that matter most — they are the defects §3.2 and §3.3 existed to remove, and they
are confirmed by the negative case, not just the positive one.

## 5. What HOUSE2 declined to do, and why

Three intended targets were **not** changed. In each case investigation showed the
premise was wrong or the change exceeded the scope lock. Recording these is the point.

### 5.1 `fnd-home-dashboard-rivalry` — the identified mechanism is dead code
The session's own working note named `nav-bar.tsx:417` as "the live mechanism behind
`fnd-home-dashboard-rivalry`". **It is not.** `BrandBanner` is exported and referenced
**nowhere in the repository** — verified by grep across all of `client/`, `server/` and
`shared/`, and confirmed in the browser (`brand-banner` count: 0; logos pointing at
`/dashboard`: 0).

Home's remaining link to the Dashboard is *deliberate* and reads as such in the code — a
"Quiet way back to the full dashboard" (`home-experience-page.tsx:952`). Two overview
surfaces with one designed doorway between them is an intentional hierarchy, not
rivalry. **There is no code defect here.** Whether the Dashboard should exist alongside
Home is a product decision, not a friction fix, and HOUSE2 had no mandate to make it.

### 5.2 `fnd-shopping-duplicate` — the two pages are not duplicates
PDA1 records two shopping pages "both rendering the basket". Investigation shows they
are **partially-overlapping surfaces mid-migration, in both directions**:

- Only `shopping-list-page` has: the per-item `ShoppingIntelligencePanel`, the
  multi-retailer price engine (cheapest-per-item, per-retailer totals, persisted
  retailer selection), shop mode, the three-way compare UI, the additive knowledge
  modal, and freezer-meal integration.
- Only `shopping-workspace-page` has: `AmbientIntelligence`, `LearningSignalsPanel`, the
  `WorkspaceAnalyserSheet`, household eater restrictions, and `EmptyState`/`LoadError`.

Retiring either would **delete live capability**. It is also linked from five places
in-app, and `server/lib/routing.ts:104` maps `/analyse-basket` → `analyser` for the
intelligence layer. Completing this migration is a real programme — it is not a friction
fix, and doing it under a "no new capabilities" lock would mean losing some.

### 5.3 `fnd-observation-as-modal` — a safety divergence, escalated not resolved
The Highly-UPF warning is a blocking modal on `shopping-list-page` and PDA1 rules it a
defect ("a wall instead of informing calmly"). The canonical workspace **already** does
the calm thing — it informs inline via `AppleRating` and never blocks.

But that is not merely a styling difference. **The two surfaces disagree on safety
behaviour**: in the workspace a household can silently swap in a 0-apple NOVA-4 product;
on `/basket` they cannot without dismissing a modal. Meanwhile `workspace-header.tsx:174`
treats both routes as one realm, so they are *presented as the same destination*.

Converging them means either removing a safety confirmation or adding friction the audit
called a defect. **Removing a safety gate is a product and safety decision, not a UX
refinement**, and HOUSE2 declined to make it unilaterally. Escalated in §7.

### 5.4 Product Knowledge Registry staleness — deprioritised on evidence
The working assumption was that stale `known_defects` entries meant "the product is
telling a household something false in its own voice". **That premise is wrong.**
`known_defects` has **zero runtime consumers** — `grep` across `server/`, `client/` and
`shared/` returns nothing, and `product-knowledge-registry.ts:128` does not parse the
field. The Companion cannot surface a defect and no user-facing surface reads one.

It is governance documentation, not household-facing, so it is out of HOUSE2's mission.
Recorded in §7 with the exact remediation for whoever picks it up.

## 6. Rollback and working-tree integrity

The tree was **already dirty at session start** — 55 modified tracked files and 2 staged
deletions from prior sessions (NUTPLAN1, COMP3, COMP4, HNP2, KNOW2, PLAN2), none
authored by HOUSE2. Per `ROLLBACK_PROTECTION_PROTOCOL` §3 that work is **untouched and
uncommitted** by this session, and is captured in
`refs/snapshots/HOUSE2-worktree-20260719`.

Of HOUSE2's six files, **four were clean** (`nav-bar.tsx`,
`HouseholdNutritionCentre.tsx`, `pantry-page.tsx`, `products-page.tsx`) and **two carry
prior-session work** (`food-detail-page.tsx`, `weekly-planner-page.tsx`). HOUSE2 edited
its own regions in those two and committed nothing, so no prior work was swept up. The
commit decision is deliberately left to the operator.

## 7. Recommended next programme

**`SHOP3` — Shopping Surface Convergence.**

It is the single highest-value remaining programme, and the only finding HOUSE2 met that
is actively **unsafe rather than merely rough**:

1. **It is a live safety divergence, not a cosmetic one.** Two surfaces the product
   presents as one destination disagree about whether a household may silently add a
   0-apple, NOVA-4 product to their basket. Every other open finding costs a household
   clarity; this one costs them the guard rail the platform's own audit says they have.
2. **It is the last structurally-duplicated room.** Every other room now has one surface,
   one header, one back, one empty state. Shopping has two of everything and a migration
   abandoned mid-way in both directions.
3. **It unblocks three findings at once** — `fnd-shopping-duplicate`, `fnd-alias-sprawl`
   and `fnd-observation-as-modal` all resolve together, and none can be resolved alone.
4. **HOUSE2 has already done its discovery.** §5.2 enumerates precisely what each surface
   uniquely owns, with file:line evidence, plus the five in-app links and the one server
   route mapping that must move. The programme starts with a known work-list.

It needs a mandate HOUSE2 explicitly did not have: to **move capability between surfaces
and make a safety-behaviour ruling**. That is why it is the next programme and not part
of this one.

Lower-priority follow-ups, recorded so they are not lost:
- **`fnd-route-name-drift`** — plant diversity is "Plants enjoyed" in-room, "Nutrition"
  in the nav, `/nutrition` as the route. One feature, three names.
- **PKR hygiene** — remove the five closed `fnd-*` ids from `product.yaml` (lines 225,
  308, 501, 808, 1154, 1954), then regenerate via `scripts/build-product-inventory.ts`
  and `scripts/build-registry-nav.ts`. The schema has **no** "closed" status and is
  `additionalProperties: false`, so removal is the only valid edit — do not invent a
  status field. `hid-notice-engine` additionally carries an `evidence` sentence and a
  `status: hidden` that are now false. Zero runtime risk; `publication-register.ts:1168`
  will flag any YAML edit left un-regenerated.
- **Dead code** — `BrandBanner` (`nav-bar.tsx:409`) is exported and used nowhere.
- **`fnd-cooked-never-reaches-diary`** — genuinely blocked; no diary endpoint exists.
