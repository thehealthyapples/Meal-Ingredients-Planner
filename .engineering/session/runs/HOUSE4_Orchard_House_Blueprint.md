# Session: HOUSE4_Orchard_House_Blueprint

| Field | Value |
|---|---|
| **Session ID** | `HOUSE4_Orchard_House_Blueprint` |
| **Rollback ID** | `rollback/HOUSE4-orchard-house-blueprint-20260716` → `7d1dd2ce` |
| **Start time** | 2026-07-16T17:40:00Z UTC |
| **Current stage** | Waiting for User |

## Objective
Define the **complete Orchard House** — the governing experiential architecture for the *entire house* rather than any individual domain — from the existing Experience architecture together with `PLAN1`, `COOK1` (the mission said "BOOK1"; no such file exists), `PANTRY1` and `SHOP2`. Eight deliverables: philosophy of the house · purpose of every room · **how the rooms connect** · how households move through the house · how the Orchard surrounds the home · where the Companion belongs · **where future rooms naturally fit** · what should never change. **No screens. No implementation.** Investigation only.

## Files being modified
- `docs/investigations/ux/HOUSE4_ORCHARD_HOUSE_BLUEPRINT.md` — the deliverable (new)
- `.engineering/session/CURRENT.md` + this run file — session recovery bookkeeping

**Four deviations, reported in the deliverable § 0:**
1. **Filing** (§ 0.1) — mission specified `docs/investigations/` (root); violates `REPOSITORY_CONVENTIONS.md:47`, fails `repo-structure-verify.sh:52-54`. Filed under `ux/`, same as all five siblings. Gate re-run: **PASS**.
2. **Status** (§ 0.2) — mission asked for *"the **governing** experiential architecture"* **stored under `docs/investigations/`**. Mutually exclusive (`README.md:4`). Written as an investigation; `ORCH1 § 0.1`'s precedent.
3. **ID** (§ 0.3) — `HOUSE1` (= `docs/implementation/ux/HOUSE1_THE_ENTRANCE_HALL.md`), `HOUSE2` (= Repository Conventions) and `HOUSE3` (= repo structure workstream, `4c89cc0`) are **all taken** → `HOUSE4`.
4. **Noun** (§ 0.4) — *"The Orchard House Blueprint"* is one word from the governing **Orchard House *Design* Blueprint** (`OHDB1`). Title kept as instructed; the free ID `OHB1` **refused** (one letter from `OHDB1`); § 15.7 recommends against promotion, which is what stops the two names ever coexisting as law.

**Rollback tag note:** cut as `rollback/HOUSE1-…` before the ID collision was found; **renamed to `rollback/HOUSE4-…` within the same session, before being reported or referenced anywhere**. Both point at `7d1dd2ce`. `SHOP2 § 0.1` declined an equivalent rename on the grounds that renaming *after the fact* is worse — that reasoning is right and did not apply here. Recorded in § 0.3 so the two decisions are not read as inconsistent.

No other file touched. All seven governing Experience docs **byte-untouched**. `docs/architecture/README.md` untouched. No code, no schema, no UI.

## Checkpoints
<!-- Append one line per checkpoint. Newest at the bottom. -->
- [x] Architecture Bootstrap read (`docs/architecture/README.md`)
- [x] Git status confirmed; rollback branch created → `7d1dd2ce`; session registered
- [x] **`BOOK1` does not exist** — no such file anywhere in the repo. The Cookbook blueprint is `COOK1`; treated as the intended reference and recorded
- [x] `THA_EXPERIENCE_BLUEPRINT.md` read in full; `ORCH1`, `PLAN1`, `COOK1`, `SHOP2`, `PANTRY1` read as the direct sibling precedents — gate method, filing decision and composition-not-law shape inherited
- [x] **NORTH2 gate applied to all 8 deliverables — 5 owned with no remainder.** Deliverable is composition + citation, plus three real gaps (§ 5, § 6, § 9) and two house-only findings (§ 11, § 12)
- [x] **Ownership sweep delegated + independently re-verified by grep.** Question: does *anything* own how rooms connect? **Answer: nothing.** Searched all 36 `docs/architecture/*.md` for threshold/doorway/door/adjacent/connect/circulation/corridor/hall/between rooms/leads to/handoff
- [x] **HEADLINE — the house is completely specified room-by-room and completely unspecified between the rooms, and every word for the difference is spent.** The map (`BLUEPRINT § 5.1`) has **six columns and no adjacency column** — a list of rooms, not a plan of a house. *"A room, in this canon, is a monad"*
- [x] **The hall chain verified end-to-end and it is broken.** `BLUEPRINT:224` E0 = *"Lit from the hall"*; `:181` Admin = *"The study off the hall"*; `OHDB:302` cites *"(Experience Language § 5.9; Experience Blueprint § 5.1)"* for *"the main hall"* — **EXPLANG contains "hall" ZERO times** (grep, whole file) and **§ 5.1's only hall is the four words OHDB is citing it for**. Only description is `OLB:98` — the book that *"invents nothing and legislates nothing"* (`:10`)
- [x] **The loop closes on a fourth doc** — `docs/implementation/ux/HOUSE1_THE_ENTRANCE_HALL.md` is the only file named for the circulation; it is about **Home**, is **implementation**, says it *"creates no rule"* — and governing `TRANSLATION1` cites it **29×** incl. its Layout/Spacing/Interaction facets. **Recorded, explicitly not graded**
- [x] **The vocabulary is spent — four for four, each by a governing doc**: *doorway* = **the one primary action** (`TRANSLATION1:148`); *corridor* = **only ever a failure** (`BLUEPRINT:156`, `:424`; `TRANSLATION1:158`); *threshold* = **the top of one surface** (`TRANSLATION1 § 4.1`, + Home `:171`, + Shopping); *hall* = § 5.1 above. **Second occurrence of `PLAN1 § 6.1`'s naming trap in one week — the concepts THA has not owned are exactly the ones whose names it has spent**
- [x] **`BLUEPRINT:138` declares a category and never populates it** — *"a room, **a doorway**, or a note"*. Nothing says what a doorway connects. The house's constitutional sentence names three things and defines two
- [x] **A rule in force cannot be checked** — `EXP ARCH:178` *"The shortest honest path wins"*. A path needs a graph; no doc defines the graph. `PKCA:169` Rule KC8 at experience scale
- [x] **The ownership partition is exhaustive and the topology falls through it** — `EXPLANG:302`'s parenthetical splits the transition into *feeling* (EXPLANG B/D) + *mechanics* (UIA § 11). **Neither half is *which rooms connect***. `TRANSLATION1:151` repeats the same partition and cites the same two owners
- [x] **`UIA:132` is the canon's ONLY acknowledged adjacency** — *"planning against a cookbook"* — governed **presentationally**, as permission to dock one panel; which realms are "two-sided" never enumerated
- [x] **§ 9 — the Experience Test fails a new room by existing.** `BLUEPRINT:416-419` Q1 is a **closed-map conformance test**; a new room's failure mode is identical to a defective screen's, and it does not reference § 18's escape. `ORCH1:591` routed **Community** to exactly this gate (§ 9.4). § 18 owns the **procedure**, never a **criterion**; the only statement of *where* a room attaches is a **parenthetical** (`BLUEPRINT:132`)
- [x] **§ 11 — the strongest section, and written entirely from the siblings' own findings.** Four shapes, eleven presentations, **zero visible from inside the reporting room**: `card.tsx:12` orchard bleed (3 rooms — *"it is not a room defect… it is everywhere"*, `COOK1:516`); the fabricated zero (2 rooms, same `?? 0`, same metric); the last inch (3 fields, 3 mechanisms — *"THA does not have a confidence problem. It has a last-inch problem"*, `SHOP2 § 6.2`); the private book (`meals.userId`, 1 line of scope, 3 rooms)
- [x] **`SHOP2:351` is the argument for this document, written by a room that hit its ceiling** — *"The two rooms' defects compose into something worse than either. Recorded here because **neither investigation could see it alone**"*. Compound: SHOP1 refused the pantry read on Principle 2 **while ~141 pantry items are fabricated** — a generation path deducting the pantry would delete real groceries from a real list
- [x] **The exposure scale is a per-domain constant implemented as a product-wide literal** (§ 7.1) — 4 rooms, 4 assigned window sizes, **one rendered**; `--orchard-opacity` defined at `index.css:73`/`:155` and **never consumed**. No room investigation could find that; each found its own third
- [x] **The meta-shape now found SIX times** — `ORCH1:57` named it at three (TIME1/TIME2/ORCH1); `COOK1:109`, `SHOP2:235`, `PANTRY1 § 5.1` add three more. *"The canon and the engine writing the same law in the same voice without ever having been introduced."* `COOK1:47`: **"a directory that does not read itself"**
- [x] **§ 12 — the perimeter: three doors, three documents, none owned as one thing.** Front door (`ORCH1:181` — *"THA's world begins at the door"*, a boundary not a gap) · shop door (`SHOP2:218` — *"The house ends at the door… the code brought the shop indoors without anyone writing down how that should feel"*; **zero hits** for price/commerce/checkout across all 7 Experience docs, while `POST /api/basket/checkout` is live) · kitchen door (`ORCH1 § 3` — *"it does not follow them in"*). **Two are silences the canon chose; one is a door the code walked through**
- [x] **Every asserted citation independently verified by grep/sed before use** — E0, the Admin row, `BLUEPRINT:138`, `TRANSLATION1:148`, the corridor set, EXPLANG's zero halls, `OHDB § 13.9`, `OLB:10`/`:98`, HOUSE1's status line + the 29 citations
- [x] **NORTH2 gate applied to my own output** — no rule created; §§ 5/6/9 gaps **named and routed, not filled** (no name proposed for the circulation, no hall row, no adjacency column, no route graph, no admission criterion, no seventh beat). `ORCH1`'s routings (Community, co-authorship, outcome boundary) **not re-routed**
- [x] Repo structure gate re-run: `docs/investigations/ has no loose files` **PASS** *(pre-existing unrelated FAIL on `.glibcheck.txt`/`.libdirs_uxhome.txt` at root persists — untracked before this session; also noted by ORCH1/PLAN1/COOK1/SHOP2)*
- [x] Investigation delivered

**Last checkpoint:** Investigation delivered — `docs/investigations/ux/HOUSE4_ORCHARD_HOUSE_BLUEPRINT.md`

## Next action
None — complete. Awaiting review.

**Recommended follow-on (deliverable § 15), by value:**
1. **Resolve the hall — do this first; it is not a design question.** `OHDB:302` cites two governing docs for *"the main hall"* and **neither contains it**. That is a defect in governing architecture *today*, independent of everything else. Either **(a) admit the hall** (a `BLUEPRINT § 5` sentence or `§ 5.1` row — E0 and the Admin row already depend on it) or **(b) retire the word** (rename E0, correct `BLUEPRINT:181` and `OHDB:302`). Cheap either way; **not optional either way**.
2. **Populate or retire the doorway category** — `BLUEPRINT:138`. One sentence in its owner; and it cannot use the word *doorway* (`TRANSLATION1:148` spends it).
3. **The room-admission criterion — an amendment to `BLUEPRINT § 18`, not a new document.** § 18 gains the criterion it lacks; `§ 15.3` Q1 gains the escape § 18 already implies. **Live**: `ORCH1` routed Community to a gate that would reject it. `ORCH1:591` — *"its window closes the day the lane opens."*
4. **Name and route the circulation — the most valuable item, and the only one that is not a fix.** Nothing owns the space between two rooms; three governed things depend on it (E0, `BLUEPRINT:138`, `EXP ARCH:178`). Shape: (a) **name it** — all four candidates spent; (b) decide whether hub-and-spoke is **law or habit**; (c) test `UIA:132` as precedent; (d) record `SHOP2 § 7.2`'s *"one owner, one funnel"* as the house's best-built connection, unnamed. **Do not skip (a)** — `EXP ARCH:211` binds it.
5. **The shop door → route to `ORCH1 § 13` rec 1's existing amendment**, not a new document. Three doors, one amendment, no eighth document.
6. **The house-level fixes the rooms correctly declined — workstreams, not architecture:** `card.tsx:12` + `orchard-backdrop.tsx:18` (one `UIA § 4` amendment, three rooms; **read § 13.2 first** — this is the item most likely to cause the unrecoverable *cold* failure); the fabricated zero (one workstream, two rooms); the last inch (three fields); the Companion's chair **sequenced across four rooms** (`NTC-P2` before the Cookbook offers a first chair).

**Explicitly not recommended:** **promoting this document** (§ 15.7) — same reasoning as `ORCH1 § 13` rec 5, harder: §§ 11–12 are composed entirely of five investigations' findings and go stale the day any is actioned. *"The house is not a rule either — it is already `BLUEPRINT`, and `BLUEPRINT` is not missing."* Also not recommended: **a second word for the space between rooms** before it has a first (§ 13.1).
