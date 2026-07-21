# ROOM1 — Room Personality Pass

**Document ID:** `ROOM1`
**Date:** 2026-07-21
**Status:** Implemented (code) · committed `adee7d91` + pushed to `int1-intelligence-platform` · **Waiting for User** (Home Owner review of the seven rooms) · **NOT deployed** (production is a separate human-gated act)
**Rollback identifier:** `rollback/ROOM1-room-personality-pass-20260721` → `4c65d496cac031e8101a6d166a04d4bbe84e11bc`
**Commit:** `adee7d91`
**Author of record:** Colin Clapson (owner / Home Owner) · implemented by Claude under the Engineering Workflow
**Session run file:** [`.engineering/session/runs/ROOM1_Room_Personality_Pass.md`](../../.engineering/session/runs/ROOM1_Room_Personality_Pass.md)
**Governing parents:** `THA_EXPERIENCE_BLUEPRINT.md` § 5 / § 8 (One Home, Many Places; the ground plane) · `GOVERNING_EXPERIENCE_ARCHITECTURE.md` (GEA19 "a room may not fork the house", GEA11) · `THA_KEPT_ROOM_TRANSLATION.md` § 4 (Rooms) · `LIVING_HOME_EXPERIENCE_ARCHITECTURE.md` · the Experience Governance canon

---

## 1. What this pass is — and the one thing it deliberately is not

The mission was to **refine each core room so it has a distinct emotional character while remaining
part of one canonical Living Home** — distinct through *composition, hierarchy, spacing, emphasis
and material treatment*, preferring **refinement and removal over addition**, and creating **no**
separate themes, per-room palettes, duplicate components, new features, or Environmental Dressing.

The governing law fixes exactly how a room may differ from its neighbours. Blueprint § 5:
*"A room is differentiated by purpose, light, material, and one sign of life — never by its own
architecture, navigation, palette, or theme."* GEA19: it *"may not introduce its own shell,
header, navigation, palette, card, loading state or breakpoint."* And Blueprint § 8.1 names the
one lever that varies: *"A domain expresses its character entirely within its ground plane and the
light that falls on it, and touches nothing above or below."* Density is a permitted, per-room
**designed** choice within the one spacing scale (Kept Room § 4.1 ROOMS (5): *"a working bench is
denser than a window seat, but both speak the same spacing scale"*).

So the levers this pass was allowed to pull are narrow and precise: **composition, spacing,
hierarchy and the per-room realm identity — never a palette, theme, shell, or token.**

### 1.1 The boundary this pass found: the house's rooms are already differentiated at the frame

The same discovery `HOSP1` recorded three days earlier — *"the house is already warm"* — applies
here in its own key: **the house's rooms are already differentiated, and the differentiation is
owned.** Prior programmes (`EXP1`, `INTARCH1`, `EXPADOPT1`) built a complete, shell-owned per-room
system that is a straight projection of Blueprint § 5.1, and every value in it already matches each
room's documented character:

- **`ROOM_EXPOSURE`** (`app-shell.tsx`) — the orchard window each room admits: E2 (the window) for
  Cookbook, Pantry, Nutrition, Diary; E1 (morning light only) for Planner, Shopping, Analyser.
- **`ROOM_GROUND`** — the ground-plane posture (how much air a room holds around its working
  surface): `full` (Planner, Analyser), `room` (Cookbook, Pantry, Nutrition), `air` (Diary,
  Shopping). This is the § 8.1 "only layer that varies by domain," and it is already correct.
- **`ROOM_PURPOSE`** — the one line each room speaks at its threshold; already distinct and in
  each room's own voice (a room's fact, never coaching — GEA21).
- **`[data-realm]` hues** (`index.css`) — the room's identity tint (an owned header/ground tint,
  *"never a second palette inside a room's content"*), one hue per room.

**Re-tuning any of that would fight decisions already made and violate one-owner-per-fact
(GEA19, Blueprint § 8.2).** The "walls untouched" Blueprint Check (§ 15.2) forbids touching the
shell at all — *"no exception for emotional or experimental work."* So this pass touches **no
shell file, no design token, no owned CSS value.** Every edit lives **inside a room's own body.**

That raised the integrity bar to exactly where `HOSP1` set it: under the Premium Standard
(`EXP2` § 17 — *"if the household would not feel the care, it is decoration; if they would feel its
absence, it is craft"*), a room-personality pass here must correct the **genuine** places where a
room's own body contradicts its brief — never manufacture a diff across seven rooms to look busy.
So the pass was scoped from a per-room audit of each body against its documented character.

---

## 2. Experience Constitution Check (§ 18.2 — answered before design)

- **Hospitality (§ 3.1)** — a more generous Cookbook and a consistently self-identifying Shopping
  and Nutrition make each room read as *itself* the moment a household walks in; welcome is served,
  and no welcome was traded for efficiency.
- **Outcome (§ 3.5)** — *a small, true, unearned pleasure*: recipe cards with room to breathe read
  as a collection you browse, not a grid you scan; and each room wearing its own identity is a
  quiet confidence that you are *somewhere in particular*.
- **Weight (GEA2)** — nothing is added to any room: no new panel, badge, strip, element, or
  capability. Two changes are a spacing value and one is an existing attribute; felt weight is
  neutral-to-down, never up.
- **Voice (GEA8/GEA9, GEA21–23)** — rooms still only *report*. No room gained coaching,
  encouragement, interpretation, or a new sentence. The Companion is byte-untouched.
- **Ownership / Agency (GEA21/GEA23)** — no statement added; nothing congratulates, persuades, or
  judges; nothing decides on the household's behalf. No canonical ownership changed.
- **Restraint (GEA11/GEA13/GEA15)** — this is GEA11 in the literal: *surplus space becomes air*
  (the Cookbook grid opens 8px → 12px between cards). Nothing scores, streaks, ranks, or rewards.
- **Layer (GEA20)** — the work lives entirely at the Experience Implementation layer (spacing-scale
  classes + one existing attribute); it originates **no** law and moves **no** rule. The principle
  above it is Blueprint § 5 / § 8 and GEA19; no durable rule needed writing up because none was
  authored here.

**Blueprint Checks (§ 15.2):** *One home* ✓ · *A room, not a theme* ✓ (differs only by the owned
purpose/light/material/realm + composition — no architecture, nav, palette, costume, or furniture
introduced) · *The map respected* ✓ · *Orchard law* ✓ (untouched) · *One morning* ✓ (light
untouched) · *Material honesty* ✓ (ground plane untouched) · *Living Detail discipline* ✓ (none
added) · *The Companion in its chair* ✓ · **The walls untouched** ✓ (no shell/token file in the
diff) · *The governance path* ✓ (no token admission needed — only existing scale + existing
attribute). No check failed; no STOP.

### 2.1 Experience Test (§ 15.3) — answered per room, before touching layout

| Room | Which room? | How should someone feel? | The one thing it helps you do | Brief |
|---|---|---|---|---|
| Cookbook | The living cookbook (E2 window, `room` ground) | Unhurried, invited, generous | Discover/create a meal to cook | creative & generous |
| Planner | The family planning table (E1, `full` ground) | In control, ordered, unhurried | Plan the week's meals | calm & ordered |
| Pantry | The pantry shelves (E2, `room` ground) | Practical, reassured, not judged | See what the house has | abundant & practical |
| Shopping | The list by the door (E1, `air` ground) | Brisk, clear, momentary | Ready one list for the shop | clear & purposeful |
| Diary | The lap desk (E2 soft, `air` ground — most air in the house) | Quiet, private, reflective | Record the household's day | reflective & private |
| Nutrition | The noticeboard by the garden view (E2, `room` ground) | Reassured, informed | Understand the table's variety | reassuring & knowledgeable |
| Analyser | The work bench (E1, `full` ground) | Focused, clear-eyed | Look closely at packaged food | focused & investigative |

Every row had a clear answer; the frame (exposure · ground · purpose · realm) already delivers most
of each. The pass changes only where a room's **body** contradicted its own row.

---

## 3. What changed — the genuine mismatches, corrected within each room's body

Three edits, all **inside a room's own content body**, all using the **one** spacing scale or an
**existing** attribute. Total: **3 files, +10 / −8.**

### 3.1 Cookbook — the generous room was rendered tightest (composition)

The Cookbook is briefed *creative and generous* — *"a well-loved book, not a store"* (OHDB § 13.3),
recipe cards as objects you pick up. Yet its recipe-card grids across every tab (My Cookbook,
Recipes, Freezer, Packaged) used the house's **tightest** gap — `gap-2` (8px): the one room asked to
feel most generous was the most tightly packed. All six grids
(`grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`) were opened to **`gap-3`** (12px) — a modest,
tasteful step that lets the collection breathe without becoming sparse. This is GEA11 in one line:
surplus becomes air between the cards. Safe at every breakpoint (2 → 3 → 4 columns): a grid gap only
changes spacing, never overflow; the list-view variant (`flex flex-col gap-2`) is deliberately left
compact.

### 3.2 Shopping & Nutrition — completing the realm identity every other room already wears

Five of the seven rooms declare their realm on their **body** container
(`data-realm="cookbook|planner|pantry|diary|analyser"`), so any control inside the body inherits the
room's own hue. **Shopping declared it nowhere (`data-realm` count: 0); Nutrition only on its mobile
drawer (count: 1) — never on its main content column.** This is the same class of gap `EXPADOPT1`
recorded for the Orchard (*"the one room in the house that faced outward had no light of its own"*):
an identity the owned system grants every other room, missing from two.

- `shopping-workspace-page` — `data-realm="shopping"` added to the body container.
- `plant-diversity-page` (Nutrition) — `data-realm="nutrition"` added to the main content column.

**Honest scope of this change:** today the realm-consuming controls in both rooms (the mode/tab
switchers) render into the **header**, which already carries the realm — so this is a
**consistency/correctness convergence, not a visible re-colour right now.** Its value is that all
seven rooms now follow one convention (*the room's body declares its own realm*), the flagged
inconsistency is closed, and any future body-level control in these two rooms inherits the room's
hue by construction instead of resolving an undefined variable. Adding the attribute paints nothing
on its own — it only defines the room's variables for its own subtree.

### 3.3 The four rooms audited and deliberately left unchanged (recorded, not skipped)

Under the Premium Standard, a room already expressing its brief is **not** re-touched:

- **Planner** — *calm & ordered.* The E1/`full`-ground week table with its compact `gap-3`
  two-column body **is** the ordered family table; opening it blind risks the dense 7-day grid.
  On-character; unchanged.
- **Pantry** — *abundant & practical.* E2/`room` ground, `space-y-3` + a generous `gap-5`
  Food-|-Home grid: practical density with abundance. On-character; unchanged.
- **Diary** — *reflective & private.* Its reflective **air** is carried correctly by its `air`
  ground posture (the widest margins in the house) and its soft E2 window; its daily log is a
  deliberate **compact divided ledger** (one bordered box, `divide-y`), and forcing gaps into a
  ledger would fight its own composition. On-character; unchanged.
- **Analyser** — *focused & investigative.* E1/`full` ground (the bench), tight `gap-2` detail
  panels and clear `space-y-6` section separation: focused, task-first. On-character; unchanged.

---

## 4. What was deliberately NOT done (recorded, not swept)

Held back on the same no-blind-sweep discipline `UINORTH1`/`HOSP1` established — each needs
per-surface visual verification, which is the Home Owner's judgement, not a blind transform:

1. **The shell per-room maps** (`ROOM_EXPOSURE`, `ROOM_GROUND`, `ROOM_PURPOSE`) and the
   `[data-realm]` hues — already correct projections of Blueprint § 5.1 and **owned**; re-tuning
   them would fight prior owners and breach "the walls untouched" (§ 15.2). Byte-untouched.
2. **Per-room Living Details** ("one sign of life") — the *well-thumbed page*, *sun on today*,
   *yesterday's trace*, *the garden filling in*, etc. Each is a **future governed admission** (one
   at a time, data-borne — Blueprint § 12.1), not something to author in a composition pass.
3. **Deeper per-room body redesigns** — e.g. Diary's three-column daily log as a calmer,
   reading-forward single spine; Analyser's results hierarchy on the bench. These are genuine
   composition redesigns needing live desktop/mobile visual verification (Home Owner judgement),
   not a safe class-level edit.
4. **Environmental Dressing** — forbidden today: `LIVINGHOME2` is `DECLARED, NOT BUILT`, and no
   dressing may ship until its § 10.2 owner amendments land. Not touched (as `HOSP1`/`HOMEROOM1`).
5. **Any new per-room palette, theme, or component** — forbidden by GEA19; not created.

---

## 5. Architecture Compliance

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================
☑ One canonical identity
  Explain: One home, one shell, one spacing scale, one realm system. The pass
  converges two rooms ONTO the body-realm convention the other five already use,
  and opens one room's grid within the shared scale. No new identity, theme, or
  palette is created.
☑ One owner per fact
  Explain: No token, colour, exposure, ground posture, or purpose line touched —
  all remain owned by app-shell.tsx / index.css. Only room-body spacing classes
  and one existing attribute changed.
☑ No duplicate entities
  Explain: No entity, component, or store created. data-realm and the grid
  classes are reused, not re-implemented.
☑ No duplicate ownership
  Explain: Canonical ownership unchanged. Shell, navigation, tokens, Companion,
  business logic, workflows, and AI are byte-untouched.
☑ No duplicate state
  Explain: No state created or changed; every query, mutation, and control path
  is identical — only class strings and one attribute changed.
☑ Extends existing architecture
  Explain: Uses the existing per-room differentiation system (realm + spacing
  scale); adds nothing beside it. Prefers refinement (grid gap) and convergence
  (data-realm) over addition.
☑ Progressive enrichment where appropriate
  Explain: A first measured personality pass; the deferred items (§ 4) are staged,
  not abandoned (continual care, HOME_OWNER Principle 11).
☑ Knowledge domain compliance
  Explain: No knowledge domain touched; Product Registry impact is presentation-
  only (§ 7).
☑ Honest gaps over fabricated information
  Explain: Unaffected — no data, inference, or presentation field added. The
  report states plainly where a change is convergence rather than a visible re-
  colour (§ 3.2), rather than overclaiming a diff.
☑ No permanent synchronisation bridge
  Explain: None; no scheduler, no derived store.
☑ Evolution over replacement
  Explain: Nothing retired; one grid gap widened in place, two rooms aligned to an
  existing convention.

If any item cannot be checked, implementation must stop and explain why.
```

### AI Architecture Compliance

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
No AI surface, capability, prompt, Context View, or Companion behaviour is created,
altered, or consumed. The Companion (FloatingAssistant) is byte-untouched. No
capability registered or consumed; no conversation state; nothing here observes,
interprets, or speaks. The pass is presentation-only (spacing + one attribute).
```

---

## 6. Definition of Done

- **What success looks like:** each of the seven rooms reads as *itself* — its documented emotional
  character legible through the owned frame (exposure · ground · purpose · realm) and, where a
  room's body contradicted its brief, corrected within that body — with **no** room redesigned, no
  feature added, no theme/palette created, and no dressing shipped; this report exists and is
  indexed with the session record; the change is committed and pushed with the rollback identifier
  reported.
- **What must not break:** the shell, navigation, tokens, exposure/ground/purpose maps, AI,
  Companion, business logic, workflows, and canonical ownership — all **byte-untouched** (verified:
  no shell/`index.css`/token/schema/route/server file in the diff). Client typecheck clean;
  adoption gate at baseline; production build green.
- **Manual test steps:** `git diff --stat rollback/ROOM1-room-personality-pass-20260721..HEAD` shows
  only three `client/src/pages` files + `docs/` + `.engineering/session/`; open Cookbook and confirm
  the recipe grid breathes (12px gaps) on desktop (4 cols) and mobile (2 cols); open Shopping and
  Nutrition and confirm no regression and that their bodies now declare their realm.
- **Product Registry impact:** presentation-only. No route, capability, page, or claim changed;
  the affected rooms' surface entries keep their meaning, refreshed only in composition tone.

---

## 7. Data Impact

- **Reads existing data:** NO change — same queries and fields; the Cookbook grid renders the same
  cards, more generously spaced.
- **Writes new data:** NO. No mutation, schema, or migration touched.
- **Changes meaning of existing data:** NO. Only spacing and one presentation attribute changed.
- **Requires backfill:** NO.
- **Special-category exposure:** none — no household data is read, shown, or inferred.

---

## 8. Trust Check

- **Could this mislead the user?** No. It changes composition and one identity attribute; it makes
  each room read more clearly as itself and states honestly (§ 3.2) where a change is convergence
  rather than a visible re-colour.
- **Could this fabricate certainty?** No. No inference, personalisation, Living Detail, or dressing
  — the composition is identical for every household.
- **Is anything guessed but shown as real?** No.
- **What happens if the system is wrong?** A spacing defect, corrected by a one-line edit; no data
  or behaviour path can be affected because none was touched.
- **No architectural duplication introduced:** YES. **No new source of truth:** YES. **No runtime
  behaviour altered:** YES (spacing classes + one attribute only).

---

## 9. Rollback Plan

- **Rollback identifier:** `rollback/ROOM1-room-personality-pass-20260721` →
  `4c65d496cac031e8101a6d166a04d4bbe84e11bc` (annotated tag; tree clean at tag time apart from the
  session dashboard's heartbeat line, which is not this work).
- **Files modified:** `client/src/pages/meals-page.tsx` · `client/src/pages/plant-diversity-page.tsx`
  · `client/src/pages/shopping-workspace-page.tsx` · `docs/implementation/ROOM1_ROOM_PERSONALITY_PASS.md`
  (this report) · `.engineering/session/runs/ROOM1_Room_Personality_Pass.md` (session record) ·
  `.engineering/session/CURRENT.md` (dashboard row).
- **Rollback command:**
  ```
  git checkout rollback/ROOM1-room-personality-pass-20260721 -- client/
  git commit -m "Rollback ROOM1 (revert room personality pass)"
  ```
- **Verification after rollback:** `git diff rollback/ROOM1-room-personality-pass-20260721 -- client/`
  is empty; typecheck / adoption / build return to the pre-ROOM1 baseline.

---

## 10. Scope Lock

- **Implemented scope:** Cookbook recipe-card grids `gap-2 → gap-3` (generous browsing, ×6);
  `data-realm` completed on the Shopping and Nutrition body containers (convergence to the five-room
  convention). Report, session record, dashboard row.
- **Explicitly excluded (byte-untouched):** the shell (`app-shell.tsx`) and its `ROOM_EXPOSURE` /
  `ROOM_GROUND` / `ROOM_PURPOSE` maps · every design token and `index.css` (including the
  `[data-realm]` hues and `.room-ground` postures) · the Companion (`FloatingAssistant`) ·
  navigation · business logic · schema · routes · state · workflows · canonical ownership · admin
  and dev surfaces · AI capabilities, prompts, and Context Views · **all Environmental Dressing**
  (`LIVINGHOME2` stays `DECLARED, NOT BUILT`).
- **Deferred, recorded, not taken (§ 4):** per-room Living Details (governed admission, one at a
  time) · deeper per-room body redesigns (Diary's daily log, Analyser's bench hierarchy) — each
  awaiting the Home Owner's per-surface visual judgement.

---

## 11. Manual Verification

1. `git status` confirmed clean before work apart from the session heartbeat; the rollback tag
   `rollback/ROOM1-room-personality-pass-20260721` was created and verified to resolve to
   `4c65d496` **before** any file was written, and reported.
2. The governing per-room law was mapped first (Blueprint § 5/§ 8, GEA19, Kept Room § 4); the
   Experience Test (§ 15.3), Constitution Check (§ 18.2) and Blueprint Checks (§ 15.2) were answered
   per room before any layout was touched — all pass, with "the walls untouched" confirming no shell
   or token edit.
3. Each of the seven room bodies was audited against its documented brief; changes were confined to
   the genuine mismatches (Cookbook's over-tight grid; Shopping/Nutrition missing body realm), and
   the four on-character rooms were left byte-unchanged and recorded (§ 3.3).
4. `git diff --name-only` confirmed **no** shell / `index.css` / token / schema / route / server /
   Companion / admin / dev file is in the diff — only three `client/src/pages` files.
5. Desktop and mobile were reasoned from the responsive class signatures (the Cookbook grid is
   `grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`, so a gap change is safe and felt at 2/3/4 columns;
   `data-realm` defines variables and paints nothing on its own). A live authenticated visual sweep
   of all seven rooms in both viewports is deferred to the Home Owner, per the house norm established
   by `UINORTH1`/`HOSP1` (§ 13).

---

## 12. Verification results

- **Client typecheck:** `npx tsc --noEmit` reports **zero `client/` errors** (verified by
  `grep -cE '^client/'` → 0, and none in the three edited files). The 88 remaining errors are
  pre-existing **server-side** ones (`server/tests/*`, `server/intelligence/*`, `server/scripts/*`);
  the diff touches **no `server/` or `shared/` file**, so every one is definitionally pre-existing.
- **Adoption gate:** `npm run adoption:check` → **100 passed · 0 notices · 9 failed** — byte-identical
  to the `UINORTH1`/`HOSP1` baseline; the 9 are pre-existing, zero introduced. (No client-side
  building block was added, changed, or retired — a spacing value and an existing attribute — so no
  register row moved.)
- **Production build:** `npm run build` → **exit 0** (4 pre-existing warnings).

---

## 13. User Acceptance Evidence

- **State: Waiting for User.** Acceptance is the Home Owner's visual review of the seven rooms on
  desktop and mobile — the judgement the house reserves to that seat (`HOMEOWNER1`), and which
  `UINORTH1`/`HOSP1` established is not substituted by an automated sweep.
- **The decision this pass records rather than assumes:** that "make each room distinct" does **not**
  mean giving each room its own palette, theme, or layout — the canon forbids that (GEA19) — and
  that the house's rooms are **already** differentiated by an owned frame (exposure · ground ·
  purpose · realm) that this pass must respect, not re-author. The honest, in-scope work was to
  correct the genuine places a room's **body** contradicted its brief, and to complete the identity
  convention on the two rooms missing it — delivered by the means the canon permits, and no more.
- **Evidence for review:** this report; the session record at
  `.engineering/session/runs/ROOM1_Room_Personality_Pass.md`; the diff (3 files, +10/−8 — one
  generous grid, two realm-identity completions); the per-room audit table (§ 2.1) and the on-
  character rooms left unchanged (§ 3.3); and the staged backlog (§ 4) for the next pass.

---

*A house does not become seven houses to hold seven rooms. Its rooms are one architecture, one light,
one set of shelves — and they feel different because of what each is for, how much of the morning
each admits, and how closely the things in them are set. This pass let the cookbook's recipes sit a
little further apart, so browsing feels generous again, and gave two quiet rooms the same right to
wear their own name that the others already had — and left the deeper furniture-moving for the day
the Home Owner walks each room with their own eye.*
