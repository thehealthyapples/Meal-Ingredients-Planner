# REBUILD1 — Consolidated Room Audit Map (all 13 rooms)

**Programme:** `REBUILD1` — first-principles room rebuild per the Craftsmanship Constitution (`CRAFT1`)
**Date:** 2026-07-22
**Rollback:** `rollback/REBUILD1-room-rebuild-programme-20260722` (→ `6799bf84`)
**Method:** each room designed from its governing architecture first, then the existing code judged against it (CRAFT1 §7).
**Home Owner decisions in force:** scope authority = *case-by-case* (presentation-only by default; pause + ask before any backend/data change); priority = *audit all 13 first, then choose builds*.

---

## 1. The map at a glance

| # | Room | Route | Verdict | Effort | Headline |
|---|---|---|---|---|---|
| 1 | Welcome Home | `/home` | ✅ **BUILT** (`f2b11ac7`) | — | Was near-standard; surgical craft done + committed |
| 10 | Community (Orchard) | `/orchard` | ✅ **AT-STANDARD** | S | Clean — no gamification/fake-social-proof; only polish |
| 3 | Cookbook | `/cookbook` | ⟳ Refine | M | Browse rebuilt; a Health-Score ring + advice voice + packaged-analysis survive |
| 4 | Planner | `/planner` | ⟳ Refine | M | Constitutional work done; dead grading code + header density |
| 6 | Nutrition | `/nutrition` | ⟳ Refine | M | Foods tab done; Nutrients tab still has progress-bars + room-voice |
| 7 | Diary | `/diary` | ⟳ Refine | M | Bones good; fabricated "savings" mechanic + coaching voice |
| 9 | Profile (renders "Household") | `/profile` | ⟳ Refine | M | **Safety: allergy has two edit surfaces**; Health-Score toggle; 4-Save model |
| 12 | Support | `/help-centre`,`/contact` | ⟳ Refine | M | Honest but wears help-desk/ticket-console chrome |
| 13 | Administration | `/admin/*` | ⟳ Refine | M | Correct architecture; ~15 pages, no shared shell, 2 nav menus disagree |
| 5 | Shopping | `/shopping-workspace` | ⟳ Refine | L | Honest data; basket-grade + 4-mode pipeline + price-matrix it doesn't own |
| 8 | Companion | integrated | ⟳ Refine (deep) | L | Emblem/grounding excellent; panel interior is a generic chat widget |
| 2 | **Larder** | `/pantry` | ⛏ **GROUND-UP** | L–XL | Inventory-list software vs LARDER1's physical larder; backend-entangled |
| 11 | **Partners** | `/supermarkets` | ⛏ **GROUND-UP** | L | All-retailers directory vs the household's *chosen* shops |

**Bottom line:** the house is in far better shape than "rebuild everything" implies — **2 rooms already meet the bar**, **9 need refinement** (mostly the same handful of defects), and **2 need genuine ground-up rebuilds**. No room is broken; the work is real but bounded.

---

## 2. The four cross-cutting patterns (this is the actual programme)

The same defects recur — earlier passes (PRESENCE1/UX3/COOKBOOK1) removed them from *some* rooms but not all. Fixing them room-by-room is the bulk of REBUILD1.

### Pattern A — Score/grade surfaces that violate GEA13 *(mostly in-scope craft)*
The canon forbids scoring/grading a household. These survive:
- **Cookbook** — `HealthScoreRing` 0–100 traffic-light grade *(craft-in-scope: stop rendering the ring; the field is server-computed)*
- **Nutrition** — `CategoryProgressBlock` progress bars `enjoyed/total` *(craft-in-scope: show the count, delete the bar)*
- **Shopping** — basket **average** Apple Score *(craft-in-scope: drop the average; per-item ratings are fine)*
- **Planner** — dead UPF traffic-light code (3 copies, 2 dead) *(craft-in-scope: delete)*; live UPF verdict colour *(owner: food-fact or grade?)*
- **Profile** — "Health Score tracking" toggle *(owner: does the score exist at all?)*
- **Diary** — `SavingsCard` "£X saved" + "£10 vs takeaway" toasts *(fabricated number = craft-remove; whether savings belongs in Diary = owner)*

### Pattern B — Room-voice coaching/congratulation that violates GEA8/21 *(in-scope craft)*
Rooms must *report*; only the Companion advises/encourages. Strings to strip:
Nutrition ("You might enjoy", "celebrate", "Broaden Your Variety") · Shopping ("Great shop", "score them") · Cookbook ("this meal already uses great ingredients") · Diary (`getInsightText`, "Better choices today") · Partners ("we'll show what's nearby"). All are string/component deletions.

### Pattern C — Cross-domain surfaces living in the wrong room *(owner decisions)*
A room rendering another domain's capability:
- **Cookbook** → packaged-goods/barcode **product analysis** (Domain 19) with Nutri-Score/NOVA/thaRating
- **Shopping** → retailer×tier **price-comparison matrix** (a partners capability Shopping "does not own")
- **Nutrition** → whether the whole "Nutrients" centre should exist as a room feature (UIOWN1 §8 — the room owns nothing)
- **Diary** → `SavingsCard` (Domain 17 uplift)
- **Profile** → **two owners for one person's allergies** (see §3 — this is safety, not taste)

### Pattern D — "Reads as SaaS/dashboard, not a home" *(craft + two full rebuilds)*
Larder (inventory list) · Partners (aggregator directory) · Companion (chat-widget interior) · Support (ticket console + borrowed diary chrome) · Shopping (4-mode pipeline density) · Admin (no shared shell — staff-facing, judged on clarity not hospitality).

---

## 3. ⚠️ The one safety-critical finding (highest priority, needs backend confirmation)

**Profile — a person's allergies have two edit surfaces.** The "Personal" allergies row saves `profile.dietRestrictions` via `PUT /api/profile`, while Household Eaters writes the same person's `hardRestrictions` via `PATCH /api/household/eaters` — the **converged canonical owner the safety filter reads**. Editing the allergy in the prominent, default-expanded Personal row **may not update the eater row**, i.e. a **silently dropped restriction** (Article 9 special-category data; Core Principle 6; household.md fail-closed rule). This is the single most important item in the whole audit and should be confirmed/fixed before anything cosmetic. It is backend/data-dependent → needs your case-by-case go-ahead.

---

## 4. What I can do now with ZERO decisions (the in-scope craft wave)

Under the standing presentation-only authority, needing no owner input and no backend change — committed per room, each verified (typecheck + adoption gate):

1. **Remove the remaining GEA13 score/grade visuals** — Cookbook Health-Score ring, Nutrition progress bars, Shopping basket-average score, Planner's dead UPF code, Diary's fabricated "£X saved" number/toasts.
2. **Strip room-voice coaching (GEA8/21)** across Nutrition, Shopping, Cookbook, Diary, Partners.
3. **Companion interior craft** — carry the carved emblem into the panel, delete the leaf-glyph chat avatars, the `animate-bounce` typing dots and `animate-spin` loaders, and the Sparkles/Wand/Lightbulb "AI-magic" iconography (GEA16).
4. **Small craft cleanups** — Community terracotta token; Planner header de-densify; Nutrition duplicate count / vestigial "30" naming.

This wave alone moves **6 rooms materially toward standard** and closes every remaining GEA13 breach that is presentation-only.

---

## 5. What needs YOUR case-by-case sign-off

**Cross-domain relocations (Pattern C):** where do these belong? — Cookbook packaged-product analysis · Shopping price-comparison matrix · Diary savings card · Nutrition "Nutrients" centre. (Remove from the room / relocate to owner / keep with justification.)

**Ground-up rebuilds:**
- **Larder** — physical-store rebuild. Binary availability *is* surfaceable from existing `defaultHave`; a "running low" third state needs a **new stored fact** (governed); removing the quantity mechanic touches **10+ server consumers**.
- **Partners** — reframe from all-retailers directory to the household's *chosen* shops; needs a **selection data model** that doesn't exist, plus retailer brand-asset rights.

**Backend/data confirmations:** Profile allergy write path (safety, §3) · verify `support@thehealthyapples.com` is a real, monitored mailbox (presented as verified, not flagged placeholder) · admin write endpoints route through domain funnels + `assertAdmin` · Planner's ungoverned `/intelligence` binding.

**Health-tracking scope:** Profile "Health Score" · Diary Progress/BMI/targets · Shopping "Apple Score" sort · Planner UPF verdict colour — how much measurement the house should carry under GEA13.

**Character calls (Home Owner):** Cookbook food photography (still zero images) · Support ticket-console → warm-counter redesign · Companion messenger-vs-counter form · category emoji vs the house's one illustration hand.

---

## 6. Recommended sequence

1. **Safety first** — confirm & fix the Profile allergy dual-owner (§3), if you green-light the backend look.
2. **The in-scope craft wave** (§4) — highest value, lowest risk, no decisions; 6 rooms move toward standard.
3. **Owner-decision batch** (§5) — you rule on the cross-domain relocations and health-tracking scope; I apply.
4. **The two ground-up rebuilds** (Larder, then Partners) — designed from the North Star, with the backend pieces approved case-by-case.
5. **Support + Admin character/shell passes.**
6. **Whole-house coherence review** (one house, one hand) + final report.

Per-room implementation reports will continue under `docs/implementation/rebuild/`.
