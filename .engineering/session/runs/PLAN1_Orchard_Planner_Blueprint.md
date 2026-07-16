
# Session: PLAN1_Orchard_Planner_Blueprint

| Field | Value |
|---|---|
| **Session ID** | `PLAN1_Orchard_Planner_Blueprint` |
| **Rollback ID** | `rollback/PLAN1-orchard-planner-blueprint-20260716` → `7d1dd2ce` |
| **Start time** | 2026-07-16T15:10:00Z UTC |
| **Current stage** | Waiting for User |

## Objective
Define the Planner as a **place**, in principles, from the existing Experience architecture + EXP1–EXP5 + the North Star reference. Seven deliverables: philosophy · feeling · how households plan together · Companion participation · Orchard language · moments of delight · anti-patterns. **No screens. No implementation.** Investigation only.

## Files being modified
- `docs/investigations/ux/PLAN1_ORCHARD_PLANNER_BLUEPRINT.md` — the deliverable (new)
- `.engineering/session/CURRENT.md` + this run file — session recovery bookkeeping

**Two deviations, both reported in the deliverable § 0:**
1. **Filing** — mission specified `docs/investigations/` (root). That path violates `REPOSITORY_CONVENTIONS.md:47`,`:74` and fails `repo-structure-verify.sh:52-54`. Filed under `ux/`. Same as TIME2/ORCH1. Gate re-run: **PASS**.
2. **The noun** — "define the Planner as **the kitchen**" cannot be carried out as worded (see Checkpoints). Intent granted, word declined, working shown in § 2.

No other file touched. All seven governing Experience docs byte-untouched. `docs/architecture/README.md` untouched. No code, no schema.

## Checkpoints
<!-- Append one line per checkpoint. Newest at the bottom. -->
- [x] Architecture Bootstrap read (`docs/architecture/README.md`)
- [x] Git status confirmed; rollback tag created → `7d1dd2ce`; session registered
- [x] **The noun is unavailable.** Planner already named 4×: `BLUEPRINT:172` "The family table" · `:146` "the family's planning table" · `OHDB:230` · `OLB:61`. Renaming forbidden 2× independently: `EXP ARCH:211` (one name per concept) · `BLUEPRINT:132` (the home is never renamed)
- [x] **"Kitchen" is the house, not a room** — spent 4×: the product's one-sentence feeling (`EXPLANG:36-38`, `:123`) · the Companion's address (`BLUEPRINT:325`) · THA's voice (`EXP ARCH:208`, `:276`) · **the theme park's first noun** (`BLUEPRINT:439` "illustrated kitchens"). `NORTH1:99` — *"There is no kitchen in the software. There never was."*
- [x] **…and the canon already grants the intent, verbatim** — `EXP5:316-354`: *"Room / place analogy. **The kitchen table** with the week laid out on it."* The house is the kitchen; the Planner is the table in it. Mission's instinct correct, noun refused
- [x] **The mission is the first live instance of the risk NORTH1 predicted** (`NORTH1:18` — *"so persuasive that a team will copy the picture instead of extracting the principle"*) — the render's noun arriving in a brief one day later, attached to a room. Recorded as evidence NORTH1 was right, not as criticism
- [x] **NORTH2 gate applied to all 7 deliverables — 6 owned with no remainder, 1 gap.** Deliverable is composition + citation, not law. NORTH2's verdict holds unmodified: the architecture *"needs obeying"*
- [x] **The gap (§ 6): nothing owns "together"** — the word the canon uses most about this room (`BLUEPRINT:146`, `OHDB:232`, `OLB:70`, `:21`). D14 owns week state, D16 owns people, **nothing owns the relationship**. Named + routed, not filled (PKR1 R7)
- [x] Live claims verified before citation — **2 of EXP5 § 7's Planner claims are STALE in the household's favour** (§ 12)
- [x] Two of my own citations found wrong on verification and corrected (`EXPLANG:391`→`392`; `OLB:64`→`67`)
- [x] Repo structure gate: `docs/investigations/ has no loose files` **PASS**
- [x] Investigation delivered

**Last checkpoint:** Investigation delivered — `docs/investigations/ux/PLAN1_ORCHARD_PLANNER_BLUEPRINT.md`

## Next action
Await direction. Recommended, in order (§ 14 of the deliverable) — **the first three are blocked by nothing and are deletions or one-liners**:
1. **Delete the fabricated zero** — `PlannerIntelligenceStrip.tsx:152-156` renders unconditionally; on an empty week `plantCount` computes locally to `0` (`:120`) → the strip greets a household that has planned nothing with **"🍎 This Week · 🌱 0/30"**. Same defect class + same metric as EXPCOMP2's Home finding → **one workstream should fix both**; a third instance is likelier than not.
2. **Clear the lobby** — 5 always-on strips between the room's edge and the first cell of the week; the Planner has no Arrival beat (`EXPLANG:392`, owned + unbuilt). Start with the 2 `FirstVisitHint` banners (pure deletions). **Note WX13's trap: it fixed this by *compressing* the panel, and the compressed panel is now item 5. The move is removal, not compression.**
3. **Retire the strip into the Companion** — `NTC-P2`, already chartered (`NOTICE_ENGINE:226`). Planner runs **two** stacked ungoverned notice channels; `COMPANION_CARD:97` names Planner **first** among domains that must adopt the card framework, and no Planner card exists.
4. **Name and route co-authorship (PLAN2?)** — the most valuable item and the only one that is not a fix. **"Shared Plan" is already taken** (= the public `/shared/:token` plan). Must decide whether `meals.userId` is defect or design — *a member cannot put another member's recipe on the family week* (`routes.ts:6039-6042`), invisible in every single-member household.
5. **TIME4 unblocks the Planner's one moment of life** — "the sun on today" waits on `planner_weeks.weekStartDate` (D14, HT7, declared+unbuilt). Nothing visual on this path. **The Planner should be recorded as a consumer in TIME2's matrix — it is not, and it is the room the anchor exists for.**
6. **The warmth, last** — the 18% orchard bleed through the grid (`card.tsx:12` `bg-card/82`) violates *"the orchard is never behind working text"*. **Most likely item to cause the opposite defect** (clinical white — the one failure the canon calls unrecoverable). It is a UIA § 4 amendment question, not a Planner fix.

**Explicitly NOT recommended:** any Planner visual prototype. `EXP5:951` fixed the sequence (P1 Home → P2 Cookbook → P3 Planner, each a fresh decision) and **P1 has not run** — the reference photograph every room is calibrated against does not exist. *"If the concept survives the Planner, it survives everywhere"* is a reason to go there **last**.

## Blockers
None. No amendment proposed. No conflict with governing architecture found — the mission's noun conflicted, the mission's *intent* did not, and § 2 resolves it. **Note:** the repo structure gate carries a pre-existing FAIL unrelated to this work (`.glibcheck.txt`, `.libdirs_uxhome.txt` at root, untracked before this session; also noted by ORCH1).

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
