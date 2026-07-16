
# Session: ORCH1_Household_Journey_Blueprint

| Field | Value |
|---|---|
| **Session ID** | `ORCH1_Household_Journey_Blueprint` |
| **Rollback ID** | `rollback/ORCH1-household-journey-blueprint-20260716` → `7d1dd2ce` |
| **Start time** | 2026-07-16T13:40:00Z UTC |
| **Current stage** | Waiting for User |

## Objective
Design the complete end-to-end **household journey** — how THA supports a family over months and years, across eleven stages from discovery to indispensability. Investigation only: no UI, no implementation, no feature list, no new platform domains unless the architecture genuinely requires them.

## Files being modified
- `docs/investigations/ux/ORCH1_HOUSEHOLD_JOURNEY_BLUEPRINT.md` — the deliverable (new)
- `.engineering/session/CURRENT.md` + this run file — session recovery bookkeeping

**Filing deviation, reported (same as TIME2):** the mission specified `docs/investigations/ORCH1_…md` (root). That path **violates governing architecture** (`REPOSITORY_CONVENTIONS.md:47`, `:74`; `docs/investigations/README.md:11`) and **fails** `.engineering/scripts/repo-structure-verify.sh:52-54`. Filed under `ux/` — the Experience workstream, where HOME1/HOME2/NORTH2/EXPCOMP1 live. Filename preserved.

No other file touched. All governing architecture byte-untouched. No code, no schema.

## Checkpoints
<!-- Append one line per checkpoint. Newest at the bottom. -->
- [x] Architecture Bootstrap read (`docs/architecture/README.md`)
- [x] Git status confirmed; rollback tag created → `7d1dd2ce`; session registered
- [x] **Gap test passed — the subject is genuinely unowned.** Zero hits for "household journey" / "over months" / "over years" across the whole docs tree. `EXPLANG §5`'s six-beat Rhythm declares its scale as *"a whole session, a single surface, or one journey"*; `EXP ARCH §10` defines a journey as *"intent → resolution"* (hours). **The canon governs the visit exhaustively and the relationship not at all.** The Master Evolution Roadmap governs the *product's* evolution, not the household's
- [x] **Owners identified that bound the deliverables** — `EXP ARCH §17.9` **already owns which moments qualify for delight** (*"a first plan made, a first list completed"* — it does **not** name a first meal); `EXP ARCH §192` declares the success measure *"the household ate better with less effort, never time in the product"*, which bounds "Moments That Build Loyalty"

- [x] Stage-observability audit complete — **the answer is NO**: THA cannot distinguish a planned meal from an eaten one
- [x] **Headline: THA is a product about eating well together, and it can observe everything except eating** — intention at high fidelity, outcome not at all
- [x] **Zero new platform domains invented** — the one candidate (meal outcome) is **already owned by the Diary, Domain 21**; every piece exists (`sourceType`, `sourcePlannerEntryId`, `MealSource="logged"`) and was never wired
- [x] Four Experience Principle candidates tested against NORTH2's "already owned?" gate — **2 refused**
- [x] `EXP ARCH §17.9` identified as the **owner** of qualifying delight moments — applied, not duplicated
- [x] Repo structure gate: `docs/investigations/ has no loose files` **PASS**
- [x] Investigation delivered

**Last checkpoint:** Investigation delivered — `docs/investigations/ux/ORCH1_HOUSEHOLD_JOURNEY_BLUEPRINT.md`

## Next action
Await direction. Recommended, in order:
1. **Fix the live false claim first** — `CookbookMealIntelligenceStrip.tsx:93,183-186` renders `plannerAppearanceCount` as **"Cooked N times"**. A household that planned a meal six times and cooked none is told "Cooked 6 times". It is the **only** surface breaking the trust model `shared/stories/types.ts:20-24` defines. One-surface fix; no new fact needed.
2. **The Stage-3 wire (ORCH2?)** — the Diary is already the outcome owner. Needs: `sourcePlannerEntryId` populated (the column exists), `MealSource="logged"` produced (the type exists), `buildHouseholdHistory` reading the diary (it never has), and the **`planner:cooked-entries` localStorage rival retired**. **No new domain.** Governed act under Register Rules 2/8.
3. **Community's room** (Blueprint §5.1 row + §15.3 Experience Test) — **before** the lane opens. Cheapest governance act available; window closes when code lands.
4. **Onboarding resumability** — breaches `EXP ARCH §10` ("journeys lose nothing") in the first journey a household takes. Fix **before** adding the "who lives here?" question.

## Blockers
None. No amendment proposed. **Note:** the repo structure gate carries a pre-existing FAIL unrelated to this work (`.glibcheck.txt`, `.libdirs_uxhome.txt` at root, untracked before this session).

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
