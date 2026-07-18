# HOUSE_ACT2 — Intelligence Doors

**Session ID:** `HOUSE_ACT2_Intelligence_Doors`
**Objective:** Surface production-ready intelligence naturally throughout the household experience — give existing capabilities a door, create none.
**Rollback ID:** `rollback/HOUSE_ACT2-intelligence-doors-20260718` → `6e326d9f`
**Stage:** Complete — awaiting owner review
**Started:** 2026-07-18

---

## Rollback

Tag on `6e326d9f` (HOUSE_ACT1 completion). No checkpoint commit needed — the tree held only three uncommitted Markdown files belonging to a concurrent **PROD2** session, deliberately **not** captured. (HOUSE_ACT1 swept another session's work into its checkpoint; this is the correction.) Baseline build verified 🟢 before any change, and the tag restores a **building** tree.

## Checkpoints

- [x] Architecture Bootstrap read; rollback created and reported
- [x] Executable contracts traced for all 8 unsurfaced capabilities (handlers, ports, result shapes)
- [x] HTTP reachability investigated — **no generic capability-execution endpoint exists**
- [x] Door 1 — household learning room-scoped to Planner, Pantry, Shopping, Cookbook
- [x] Door 1a — `household-learning-presentation` registered; gate 81 → **82 passed · 0 · 0**
- [x] Build 🟢 · client typecheck 0 errors · total 94 (unchanged baseline, 0 introduced)
- [x] Report filed at `docs/implementation/house/HOUSE_ACT2_INTELLIGENCE_DOORS.md`

## The finding that reshaped the mission

**Four of the seven priorities should not be built.** `pantry-discovery` searches `user_pantry_items` — the Pantry room already searches the same store, and better: `pantry-page.tsx:300` records a WX7 canonical index that matches *by meaning* and states it "reuses canonical knowledge; **never a second search engine**." A discovery box there would be exactly that second engine. Same for shopping, diary, planner, household discovery.

These engines are **not unsurfaced features — they are Companion grounding, already correctly placed.** Declining them is what the mission's own "reuse existing UI, do not duplicate intelligence" requires.

Second finding: there is **no generic capability-execution endpoint** (`routes.ts` has none; every `handle()` call site hardcodes one intent). The only door is `POST /conversation/turn` — natural language, resolver-routed, lossy projection. So "give it a door" means authoring HTTP routes.

## Delivered

**Door 1** — household learning moved from **1 room to 5**. Profile keeps the household-wide view; Planner/Pantry/Shopping/Cookbook each show only Patterns learned in that room. Domain key space verified to source (`opportunity-delivery/framework.ts:268`), not inferred.

Filtering is **client-side by deliberate choice**, mirroring `AmbientIntelligence` (`:85-95`): five mounts, **one fetch**, no server/route/descriptor change. Server-side filtering was available (`evidence-learning-handler.ts:181`) and rejected — it would fragment one shared cache into one request per room.

## Next action

**Owner to review** `docs/implementation/house/HOUSE_ACT2_INTELLIGENCE_DOORS.md`.

Manual verification steps are specified in the report and **have not been executed** — no browser session, no acceptance evidence. Step 3 (one fetch, not five) is the one that proves the architectural choice; step 1 needs a household seeded with pending Patterns.

Recommended next: **`HOUSE_ACT3 — The Food Page Intelligence`** — Nutrition Enhancement (the strongest remaining door; rendered by no room at all) plus a decision on `meal-discovery`. Check first that `conversation-gateway.ts:1021` static enrichment does not starve both nutrition sources via `MAX_ENRICHMENT_ITEMS`.
