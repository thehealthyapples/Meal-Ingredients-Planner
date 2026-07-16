# Session: VIS1_Orchard_House_Visual_Design_Programme

| Field | Value |
|---|---|
| **Session ID** | `VIS1_Orchard_House_Visual_Design_Programme` |
| **Rollback ID** | `rollback/VIS1-orchard-house-visual-design-programme-20260716` → `7d1dd2ce` |
| **Start time** | 2026-07-16T18:00:00Z UTC |
| **Current stage** | Waiting for User |

## Objective
Begin the **Orchard House Visual Design Programme**. Produce designer-quality **concept boards** expressing the existing Experience Architecture for five rooms — the Entrance Hall (Home) · the Family Table (Planner) · the Family Cookbook · the Honest Cupboard (Pantry) · the Threshold (Shopping). For each: atmosphere · materials · light · depth · hierarchy · emotional intention · interaction principles · relationship to the Orchard. **NOT production UI. NOT React components. NOT a design system.** Stop creating new architectural investigations.

## The deciding constraint (read before continuing)
`NORTH1:16`, the visual programme's own artefact condemning itself: *"The image is the most valuable artefact the visual programme has produced, **and it must never be built**… **it is so persuasive that a team will copy the picture instead of extracting the principle**, and copying it produces *the theme park* — **the single most-forbidden thing in the entire document set**."*
`HOUSE5 § 1` records that the predicted failure **already happened, with a date** — `PLAN1 § 0` found the render's noun in a mission brief one day later.

## The form decision
Three forms exist. Two are taken; this programme is the third.

| Form | Answers | Failure mode |
|---|---|---|
| **The render** (`NORTH1`) | *"Is the Kept Room warm?"* — yes, decisively | Copied → the theme park. **Condemned by its own author.** |
| **The plan** (`HOUSE5`) | *"What is the plan of the house?"* | None available — but graphite **cannot show warmth**, which is exactly what this mission asks for |
| **The specimen board** (VIS1) | *"What is the light, material, depth and hierarchy of each room?"* | Guarded by construction: **no screen-shaped composition exists in it** |

Two self-imposed rules, stated on the board:
1. **Nothing on this board is a screen.** Every figure is an instrument — specimen, section, ladder, aperture, massing. Ground posture is drawn as **massing** (solidity and nesting), never as layout — a plan of the Planner's cells *would be* the Planner's grid.
2. **The board is graphite; the only warmth in it is a real material specimen carrying a real cited value.** It practices the law it describes (`OHDB § 12`; `TRANSLATION1 § 5.3`).

## Files created
- `docs/ui-audit/vis1-orchard-house-visual-concepts/shared.css` — the board register (drafting office, continuous with `HOUSE5`)
- `docs/ui-audit/vis1-orchard-house-visual-concepts/index.html` — the presentation: form decision · the common visual language (light · grounds · exposure · materials · hierarchy · rhythm) · refusals · contents
- `.../A-200_entrance_hall.html` · `A-300_family_table.html` · `A-400_family_cookbook.html` · `A-500_honest_cupboard.html` · `A-600_threshold.html` — the five room boards
- `.engineering/session/CURRENT.md` + this run file — bookkeeping

## Deviations
1. **"Canonical UI design location" — no document names one.** `REPOSITORY_CONVENTIONS.md` § 3's table has rows for investigations, implementation, architecture, capabilities, scripts and tooling — **and no row for visual artefacts**. `docs/ui-audit/<workstream>/` is the de facto convention (`HOUSE5`, `EXP4`, `DESIGN1`, `ARRIVAL1`) and is cited once in `PKR1`. Followed `HOUSE5`'s precedent — the nearest sibling in this same programme. **Reported, not resolved: a convention with four precedents and no rule is not canonical, it is habitual.**
2. **"Produce a visual language that every future production screen can inherit" — already owned.** `TRANSLATION1 § 6` is *"THE COMPLETE VISUAL LANGUAGE OF THE HEALTHY APPLES"*, governing since 2026-07-15. Per `NORTH2 § 2`'s gate, producing one would be a **restatement**, which every document in the set forbids. The mission's own next line resolves it — *"begin producing visual concept work that **expresses the existing architecture**"* — and that is what was built: the language is **expressed**, never authored.
3. **"The Threshold (Shopping)" — the noun is contested.** `SHOP2` earns it (*"Shopping is not the market. It is the threshold before it"*), but `TRANSLATION1 § 4.1` already owns **THRESHOLD** as the *arrival* — the door **in**. Kept the mission's noun; the board names both and marks the collision. (`The Entrance Hall`, `The Family Table`, `The Family Cookbook`, `The Honest Cupboard` are all clean — `HOUSE1`, `OHDB § 13.2`, `BLUEPRINT:147`, and `PANTRY1`'s *"the noun of the room is not the food, it is the honesty"* respectively.)
4. **Status.** Concept only. Creates no rule, no token, no component, no second owner. Authority: **none**.

## Checkpoints
- [x] Architecture Bootstrap read (`docs/architecture/README.md`)
- [x] Git status confirmed — HEAD `7d1dd2ce`, branch `int1-intelligence-platform`
- [x] Rollback branch cut → `rollback/VIS1-orchard-house-visual-design-programme-20260716` → `7d1dd2ce`
- [x] Governing inputs read: `OHDB` (full) · `TRANSLATION1 §§ 4–6` · `BLUEPRINT §§ 5.1, 6.2, 7, 8.1, 8.2` · `PLAN1` · `COOK1` · `PANTRY1` · `SHOP2` · `NORTH1` · `NORTH2` · `HOUSE4` · `HOUSE5` · `HOUSE1` header
- [x] **The form decision made and bound** (above) before a single line was drawn
- [x] Boards built — 6 files under `docs/ui-audit/vis1-orchard-house-visual-concepts/`
- [x] **Rendered and verified in Chromium** (playwright + nix `ungoogled-chromium-131`; the bundled headless shell cannot launch here — missing `libglib-2.0.so.0`, which two untracked root files `.glibcheck.txt`/`.libdirs_uxhome.txt` show a prior session also hit and did not resolve). **6/6 clean: zero page errors, zero failed requests, zero horizontal overflow, CSS resolves, all SVG present.**
- [x] **Self-imposed rules verified mechanically:** motion count **0** (the only `@keyframes|animation:|transition:` match in the tree is the comment in `shared.css:22` declaring there is none) · `<img>`/`<script>`/`http(s)://`/`data:image`/`base64` count **0** across all six files
- [x] **The one-morning law verified on the board itself:** rendered under `prefers-color-scheme: dark` — board chrome re-themes, **specimens do not re-light**
- [x] Observations reported

## Verification evidence
Screenshots (scratchpad, not committed — the boards are the artefact, not pictures of them):
`index.png` (h=12924) · `A-200` (4425) · `A-300` (5147) · `A-400` (5186) · `A-500` (5650) · `A-600` (6288) · `clip-specimens.png` / `clip-specimens-dark.png` (the fixed-specimen proof) · `clip-exposure.png`.

## Observations (the mission asked for these only)
1. **“The canonical UI design location” does not exist.** `REPOSITORY_CONVENTIONS.md § 3` has no row for visual artefacts. `docs/ui-audit/<workstream>/` has four precedents and no rule. *A convention with four precedents and no rule is not canonical, it is habitual.*
2. **The mission's first objective is already owned.** `TRANSLATION1 § 6` is the complete visual language, governing. The mission's own next line (*"express the existing architecture"*) is the safe reading, and the one taken.
3. **“The Threshold” is the fifth spent spatial word.** `HOUSE4 § 5.2` found four (hall · doorway · threshold · corridor); this mission's own room list supplies the fifth collision. *The house is still running out of names, and now for its rooms as well as its artefacts.*
4. **The white card and the orchard bleed are one defect, load-bearing on each other.** Neither is new; their interlock is what a specimen board makes visible, because it is the one instrument that puts the value and the bleed on the same sheet. **The house must get clearer without getting colder — in all four rooms at once, or in none.**
5. **1 of 4 Living Details in this set actually works.** Shopping's crossing-off is met to the word. The Planner's is unimplementable, the Cookbook's is fabricating its missing half, the Pantry's is dead. `PANTRY1 § 14.5` already recommended auditing all ten against their named data sources — *"whether the library is a design and a plan, or a design and a wish."* This set is the fourth artefact to arrive at that question independently.
6. **A third visual form was available and neither prior artefact found it.** The render could show warmth and had to be condemned; the plan is safe and cannot show warmth. The specimen board shows warmth without a room. *The gap was not in the canon — it was in the instrument set.*

## Next action
None — observations only were requested, and no follow-on work is recommended or implied. If the boards are adopted as reference, the natural sequel is the four rooms this set did not draw (Diary · Profile/Household · Analyser · Nutrition · Admin) — **but that is a fresh decision, not a queued one.**
