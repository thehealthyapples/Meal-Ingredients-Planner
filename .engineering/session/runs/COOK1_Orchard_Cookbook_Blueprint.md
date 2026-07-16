# Session: COOK1_Orchard_Cookbook_Blueprint

| Field | Value |
|---|---|
| **Session ID** | `COOK1_Orchard_Cookbook_Blueprint` |
| **Rollback ID** | `rollback/COOK1-orchard-cookbook-blueprint-20260716` → `7d1dd2ce` |
| **Start time** | 2026-07-16T16:05:00Z UTC |
| **Current stage** | Waiting for User |

## Objective
Define the Cookbook as **the family's cookbook**, in principles, from the existing Experience architecture + the Orchard Blueprint. Nine deliverables: philosophy · feeling · how family favourites are collected · how new meals are discovered · how traditions are preserved · how seasonal cooking naturally appears · Companion participation · moments of delight · anti-patterns. **No screens. No implementation.** Investigation only.

## Files being modified
- `docs/investigations/ux/COOK1_ORCHARD_COOKBOOK_BLUEPRINT.md` — the deliverable (new)
- `.engineering/session/CURRENT.md` + this run file — session recovery bookkeeping

**One deviation, reported in the deliverable § 0.1:**
1. **Filing** — mission specified `docs/investigations/` (root). That path violates `REPOSITORY_CONVENTIONS.md:47` and fails `repo-structure-verify.sh`. Filed under `ux/` — the Experience workstream, same as `PLAN1`/`ORCH1`/`TIME2`. A `cookbook/` folder exists but covers recipe **content/meal modelling**, not place; `PLAN1` made the identical call with `planner/` present. Gate re-run: **PASS**.

**No noun deviation** — unlike `PLAN1`, the mission's noun *is* the canon's own (`BLUEPRINT:147`). The finding is that the **platform** does not honour it (§ 0.2).

No other file touched. All governing docs byte-untouched (7 Experience docs, both Capability Cards, Recipe Acquisition Architecture). `docs/architecture/README.md` untouched. No code, no schema, no UI.

## Checkpoints
<!-- Append one line per checkpoint. Newest at the bottom. -->
- [x] Architecture Bootstrap read (`docs/architecture/README.md`)
- [x] Git status confirmed; rollback branch created → `7d1dd2ce`; session registered
- [x] `PLAN1` read as the direct sibling precedent — shape, gate method, and filing decision inherited
- [x] **NORTH2 gate applied to all 9 deliverables — 6 owned with no remainder.** Deliverable is composition + citation, not law
- [x] **The mission's noun is the canon's own** (`BLUEPRINT:147` — *"the family's living cookbook"*). Inverts PLAN1: PLAN1's brief named the room wrongly and the canon was right; COOK1's brief names it exactly right and the **platform** is wrong
- [x] **HEADLINE — the room's name makes two claims and the platform backs neither.** *family*: `meals.userId` notNull, **no `householdId` on `meals` at all** (`schema.ts:88-137`), `getMeals` user-scoped (`storage.ts:469-471`), no `getMealsForHousehold` anywhere → the family's cookbook is *N* private books. *living/well-thumbed*: **no cook record exists in ninety tables**
- [x] **The gap was already written down twice, in one directory, by two docs never read together** — `capabilities/meals.md:29-32` (governing) already says *"There is no household-level meal scoping anywhere in the owner."* Experience Governance vs Architecture→Capabilities. **Not a discovery; a directory that does not read itself**
- [x] **4 of the mission's 9 deliverables are already built — in another room.** favourites · discovery · traditions · seasonal = 4 of 5 WS10 story types (`shared/stories/types.ts:27-32`), 752-line engine + test suite. Only UI consumer is `PantryKnowledgeHub.tsx` over **`/api/pantry/stories`**. *"Family favourites"* is a Pantry Explore topic with a ❤️ between *"gut health"* and *"seasonal foods"* (`:121`)
- [x] **`.slice(0, 2)`** (`PantryKnowledgeHub.tsx:828`) + fixed section order (`engine.ts:244/372/519/584/665`) + empty-never-pushed (`:706`) ⇒ **traditions render only for a household with ≤1 of {favourites, discovery}**. *"Friday became pizza night" is visible only to a household with no favourite foods.* 3 of 5 story types have no reachable render path
- [x] **The tradition drifts with the query date** — `familyTraditions` keys on `e.date.getDay()` (`engine.ts:418`) over `household-history.ts:44-46`'s back-projected `approxDate`; `planner_entries` has no date/`createdAt`. Same "Monday roast" = Monday or Thursday depending on when the report runs. **Rule HT7's fabrication, live**
- [x] **The builder's own docblock is falsified by its consumers** — `household-history.ts:18-20` justifies the approximation as *"used only for recency ordering"*; `engine.ts:418` reads it as a **weekday**, `:534` as a **season**. Neither is ordering
- [x] **`TIME3:401`'s duplicate fabricated-date builder confirmed** — `routes.ts:11364-11400` is a verbatim copy of `household-history.ts`; **6 story routes call the copy**, 1 caller uses the extraction
- [x] **Seasonal: the canon's answer is exact and stated 4×** (`OLB:151`, `:155`, `:177`, `:188`) — *"It reads the family's season in what they cook, not in a calendar."* Season appears in the **food**, never the room. Seasonal dressing declined categorically (`OHDB § 11:193`; `EXP5:788-790`). WS11 implements the law correctly **on top of a fabricated clock**
- [x] **3 season implementations confirmed exactly as `TIME3:400` counted** — all behaviourally consistent (fixed UK meteorological), all `date.getMonth()` = server-process-local. Duplication is maintenance risk, **not** live divergence — distinguished from TIME2's five-that-disagree
- [x] **Expected PLAN1-shaped findings did NOT appear — 3 PASSes recorded** (§ 13.1): arrival is **clean** (no lobby; 2 layout divs to the first card); card grid is **canonically correct** (E2 shelf + object-cards is this room's posture, opposite of Planner's one-table); strip **does not fabricate a zero** (quadruple-gated, `?? 0` consumed only by `> 0`). **The Planner needs clearing; the Cookbook needs connecting**
- [x] **The one live breach: "Cooked N times"** (`CookbookMealIntelligenceStrip.tsx:93`, `:183-186`; spread to `routes.ts:5691-5696`) — ORCH1's *"only place in the codebase that breaks the trust model"*. **New find: the honest sentence already exists one page away for the same field** — `food-detail-page.tsx:85-96`, *"has featured in your plans N times"*, under the comment *"household history (careful language)"*
- [x] **Correction recorded, not amended (§ 13.2)** — `BLUEPRINT § 12.2:312`'s *"Cook/plan counts"*: one of those two does not exist. Routed, not filled (PKR1 R7)
- [x] Two live-code audits run in parallel; **every asserted fact carries a file:line and was verified before citation**
- [x] **10 of my own OLB citations found drifted (~2 lines) on verification and corrected** (`:73`→`:74`, `:74`→`:76`/`:78`, `:153`→`:155`, `:158`→`:157`, `:175`→`:177`, `:187`→`:188`); BLUEPRINT/engine/trust citations verified correct as written
- [x] Repo structure gate: `docs/investigations/ has no loose files` **PASS** *(pre-existing unrelated FAIL on `.glibcheck.txt`/`.libdirs_uxhome.txt` at root persists — untracked before this session; also noted by ORCH1/PLAN1)*
- [x] Investigation delivered

**Last checkpoint:** Investigation delivered — `docs/investigations/ux/COOK1_ORCHARD_COOKBOOK_BLUEPRINT.md`

## Next action
None — complete. Awaiting review.

**Recommended follow-on (deliverable § 15), by value:**
1. **Stop saying "Cooked"** — copy the honest sentence from `food-detail-page.tsx:91-96`. One sentence, blocked by nothing.
2. **Delete `.slice(0, 2)`** (`PantryKnowledgeHub.tsx:828`) — verify a considered limit is not wanted first, but "the family with the most history sees the least of it" is not defensible.
3. **`COOK2`? — give the Cookbook its family's stories.** A re-pointing, not a build. Must apply `BLUEPRINT § 12.2`'s ceiling (story *cards* may exceed a room whose Living Detail is *warmth*) and route via `COMPANION_CARD:97`, not a new panel.
4. **Name and route the family's book** — `meals` has no household scope; `capabilities/meals.md:29-32` already records it. Sharper than PLAN1 § 6's seam (the Planner at least *has* a `householdId`). Cannot be settled by an investigation.
5. **`TIME4` reaches this room** — traditions + seasons ride the HT7 fabrication; stories engines absent from TIME2's consumer matrix. Cheap adjacent win: delete the `routes.ts:11364-11400` copy.
6. **Offer the Companion a chair — last.** The Cookbook is the only room with no ambient channel to evict, so it can adopt the Companion Card correctly first time; let `NTC-P2` converge the Planner first.

**Explicitly not recommended:** a Cookbook visual prototype (`EXP5:951` — P1/Home has not run); **a favourite button** (§ 5.1, § 10.3 — its absence is *compliance*; a declared favourite is a rank, forbidden by `BLUEPRINT:312` and `stories/types.ts:13`).
