# NSR1 — North Star Reconstruction: Completion Report

**Programme:** North Star Reconstruction (`NSR1`) — Phases 1–3, continuation of `REBUILD1`
**Date:** 2026-07-22
**Rollback identifiers:**
- `rollback/NSR1-north-star-reconstruction-20260722` (annotated → `e16117d5`) — this programme
- `rollback/REBUILD1-room-rebuild-programme-20260722` (annotated → `6799bf84`) — the parent programme

---

## 1. Commit hashes (in order)

| Commit | Work |
|---|---|
| `f2b11ac7` | REBUILD1 Room 1 — Welcome Home (craft refinement) |
| `e16117d5` | REBUILD1 — consolidated audit map (all 13 rooms) |
| `ce2ba349` | **Phase 1** — Profile allergy safety (consistent surfaces) |
| `85f2d0f1` | **Phase 2** — Cookbook |
| `f57f4ed3` | **Phase 2** — Nutrition |
| `03e64cfe` | **Phase 2** — Shopping |
| `88e78671` | **Phase 2** — Diary |
| `7eaefc0a` | **Phase 2** — Planner |
| `836b3dbe` | **Phase 2** — Partners |
| `2b6df9be` | **Phase 2** — Companion |
| `a2e2e191` | **Phase 2** — Companion loader adoption fix |
| `29085596` | **Phase 3** — Larder design + de-risking + build plan |

## 2. Implementation report locations

- `docs/implementation/health/PROFILE_ALLERGY_SAFETY_COMPLETION.md` (Phase 1)
- `docs/implementation/rebuild/NSR1_ROOM_COOKBOOK.md`
- `docs/implementation/rebuild/NSR1_ROOM_NUTRITION.md`
- `docs/implementation/rebuild/NSR1_ROOM_SHOPPING.md`
- `docs/implementation/rebuild/NSR1_ROOM_DIARY.md`
- `docs/implementation/rebuild/NSR1_ROOM_PLANNER.md`
- `docs/implementation/rebuild/NSR1_ROOM_PARTNERS.md`
- `docs/implementation/rebuild/NSR1_ROOM_COMPANION.md`
- `docs/implementation/pantry/LARDER_GROUND_UP_REBUILD.md` (Phase 3)
- `docs/implementation/rebuild/REBUILD1_ROOM01_WELCOME_HOME.md` · `docs/implementation/rebuild/REBUILD1_CONSOLIDATED_AUDIT_MAP.md`

## 3. What was done

**Phase 1 — Profile allergy safety.** Traced the write and read paths: both allergy edit surfaces
(Personal row via `PUT /api/profile`, eater card via `PATCH /api/household/eaters`) write the **same
canonical `household_eaters.hard_restrictions`** the safety filter reads. **No silent DB drop; one
canonical owner already.** The real defect was a stale cross-cache *display* (an edit in one surface
left the other showing old allergies). Fixed presentation-only by cross-invalidating both caches.

**Phase 2 — craft wave (7 rooms).** Removed the two recurring defects the audit found across the house:
- **GEA13 score/grade surfaces** — Cookbook 0–100 Health-Score ring, Nutrition progress bars, Shopping
  basket-average grade, Diary fabricated "£X saved" toasts, Planner dead UPF grading code.
- **GEA8/21 room-voice coaching** — "Healthier Alternatives", "You might enjoy", "Great shop",
  "Better choices today…", "we'll show what's nearby", the diary insight strings.
- Plus GEA16 (Companion AI-magic iconography + chat-widget loader → still), muted nutrient rainbows,
  neutralised appraisal framing, and small legibility/restraint fixes. Each room verified (0 client TS
  errors), committed, and reported; owner-gated items routed out per the case-by-case scope.

**Phase 3 — Larder.** Re-designed from `LARDER1` as-if-new and **verified against the code that the
rebuild is presentation-only** — no new stored fact, migration, or endpoint (availability = existing
`defaultHave` + a visual metaphor; mark-needed = the existing quantity-nullable `POST /api/shopping-list`;
remove/restore = existing soft-delete). The Phase 3 STOP condition (a *necessary* backend change) is
therefore **not met**. Delivered the faithful design, the de-risking finding, and a component-level
build plan; recommends the build run as a **visually-verified** pass (§6 of that report).

## 4. Whole-house coherence review

- **Rooms feel connected** ✅ — the same voice discipline now holds across the house: *rooms report,
  the Companion advises* (GEA8/21). The coaching/grading that made each room speak differently is gone.
- **Craftsmanship consistent** ✅ (improved) — muted house palette over dashboard rainbows; stillness
  over decorative motion; honest empty/broken/waiting states preserved.
- **Hospitality evident** ✅ (improved) — congratulation and counsel that undercut hospitality removed.
- **Usability effortless** ◑ — grades and noise removed; but the flagged larger recompositions (Shopping
  4-mode pipeline, Support ticket console) still add weight.
- **Technology unobtrusive** ✅ (improved) — GEA16: AI-magic marks and capability boasts removed.
- **No room feels like legacy software** ◑ — materially better, but **two rooms still carry a
  ground-up rebuild** (Larder, Partners) and several owner-gated surfaces remain (below). Honest status:
  the house is markedly more coherent; it is not yet uniformly finished.

## 5. Verification

- **0 client-side type errors** introduced across all changes (`tsc --noEmit`).
- **Adoption gate:** 9 failures — all pre-existing, none referencing NSR1 files (verified by name and by
  a baseline worktree at `e16117d5`, which also shows 9). One new **notice** (`dark:` utilities 677→671)
  is a *positive* drift from removing dead/off-palette code; left for the owner to re-date rather than
  broadly re-recording the register.
- **`server/` byte-untouched** across the entire programme. No schema, migration, route, permission, or
  AI-capability change. Every commit is presentation/craft only.

## 6. Remaining owner decisions requiring approval

**Safety/data (Phase 1 follow-ons):** one editable allergy surface (retire the duplicate Personal
editor vs keep both) · whether to consolidate the two write paths (backend).

**Cross-domain surfaces in the wrong room:** Cookbook packaged-product analysis (Domain 19) · Shopping
retailer×tier price-comparison matrix (partners capability) · Diary `SavingsCard` (Domain 17; its "likely
saved" figure is a Core Principle 6 concern) · whether the Nutrition "Nutrients" centre should exist as a
room feature (UIOWN1 §8).

**Health-tracking scope (GEA13):** Profile "Health Score" toggle · Diary BMI/target framing · Shopping
"Apple Score" sort · Planner UPF verdict colour · whether the Cookbook "Analyse" endpoint should exist.

**Ground-up builds:** **Larder** — greenlight the visually-verified build (fully de-risked and specified;
no backend needed). **Partners** — reframe to the household's *chosen* shops (needs a shop-selection data
model + retailer brand-asset rights).

**Character / larger recompositions:** Shopping four-mode pipeline density · Support ticket-console →
warm-counter redesign + its borrowed diary chrome · Companion messenger→counter form (carry the emblem
into the panel, drop leaf-glyph avatars, suggestion chips) · Cookbook food photography · the `/dashboard`
"rival Home" retirement (GEA5) · verify `support@thehealthyapples.com` is a real, monitored mailbox ·
Community self-presence marking + terracotta token · Admin shared shell + single nav registry.

Two rooms are already **at standard** and needed no rebuild: **Welcome Home** (built) and **Community/
Orchard** (clean).
