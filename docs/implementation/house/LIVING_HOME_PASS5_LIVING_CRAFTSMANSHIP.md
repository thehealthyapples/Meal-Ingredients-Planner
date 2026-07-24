# Living Home Experience Pass 5 — Living Craftsmanship (`LHXP5`)

| Field | Value |
|---|---|
| **Programme ID** | `LHXP5` (Living Home Experience Pass 5) |
| **Date** | 2026-07-22 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback ID** | `rollback/LIVING-HOME-PASS5-20260722` → `87d5797e` (annotated tag, object `fa5f86a5`, created before any change) |
| **Kind** | Presentation-only craftsmanship finish across the household rooms. **No feature, no behaviour, no decoration added.** The pass's filter is *removal and consistency*, not addition. |
| **Governing parents** | `HOME_OWNER_ARCHITECTURE.md` (HOMEOWNER1 — Principle 2 *beauty is intentional*, Principle 11 *good enough is never a reason to stop improving*; the Decision Framework's *is this beautiful enough?*) · `GOVERNING_EXPERIENCE_ARCHITECTURE.md` (**GEA2** quieter, **GEA11** surplus → air, **GEA15** restraint) · `LIVING_HOME_EXPERIENCE_ARCHITECTURE.md` (LIVINGHOME1 — the Living Home Principle; the house holds still) · `LIVING_HOME_COMPLETION_PROGRAMME.md` (LHC1 — the Maturity Model this pass reads the house against; the [Visual] roadmap) · `THA_EXPERIENCE_ARCHITECTURE.md` § 17 (Premium — *the perceptible result of care*: if the household would not feel the care it is decoration; if they would feel its absence it is craft) · `LIVING_HOME_PASS1..4` (the arc this pass completes) |
| **Predecessor passes** | Pass 1 (`LHXP1`) *balanced*; Pass 2 (`LHXP2`) *warmed*; Pass 3 (`LHXP3`) made *trustworthy*; Pass 4 (`LHXP4`) made the Companion *quietly present*. This pass is the **craftsmanship finish** — the last Level-3 pass, removing the remaining rough edges so the household stops noticing software. |

---

## 0 · What this pass is, and what it is not

**Objective.** Make every interaction feel intentionally crafted; remove every remaining rough edge; let the household **stop noticing the software.** The whole pass is run through one filter (brief item 9):

> **"Would anyone notice if this was missing? If not, remove it."**

This makes Pass 5 a **restraint pass, not an addition pass.** It ships **no** feature, capability, behaviour, Environmental Dressing, business logic, API, schema, navigation, or ownership change (item 11), and it **amends no governing document.** Every change is a `className` or the removal of a redundant element on a **consumer** surface.

### The honest constraint — the same one the whole arc worked under

Craftsmanship is largely a matter of *feel* — motion timing, animation quality, the exact weight of a shadow — and feel is judged on the **running product**, not guessed from source. This pass was authored **non-interactively** (no authenticated live walk-through). So, exactly as Passes 1–4 did, it ships **only the craftsmanship fixes that are decidable by reading the code** — an objective inconsistency, an abrupt state change with no transition, a provably-redundant element — and **stages** every refinement that needs a human eye (motion curves, composition, proportion) for the Home Owner's walk-through (§3). Shipping feel-changes blind would violate the discipline this pass is required (item 12) to validate against.

An honest finish pass also reports what it found **already excellent.** Two of the review's richest categories — gratuitous decorative animation, and a house-wide transition sweep — came back **essentially empty**: the rooms are already disciplined (§2). Manufacturing change there would be noise, not craft (HOMEOWNER1 Principle 9).

---

## 1 · Changes shipped

Three edits, each objective, each decidable by reading, each zero-layout-risk and reversible, each mapping to a brief item.

| # | Room | File · line | Change | Brief item |
|---|---|---|---|---|
| 1 | **Household / Profile** | `profile-page.tsx` ×4 (Help/Contact + Privacy nav links) | Added `transition-colors` to the four identical settings-nav `<Link>` rows, whose `hover:text-primary` previously **snapped** with no easing. | §8 *abrupt state changes* · §7 *hover behaviour* |
| 2 | **Orchard** | `orchard-page.tsx` (the part-selector button) | Added `transition-colors` to both branches of the orchard tab, whose `hover:bg-muted` snapped — while **every other tab/segmented control in the house** (Larder, Nutrition) already transitions. The one outlier now matches. | §8 *abrupt state changes · inconsistent* · §7 *hover* |
| 3 | **Home** | `home-experience-page.tsx` (`PlantRing`) | Removed a **redundant `sr-only` caption** that made assistive tech announce the plant count **twice** (the ring's screen-reader copy, then the visible "N different plants this week" beside it). The ring is decorative (`aria-hidden` SVG); the visible text carries the accessible name. The now-unused `count` prop was dropped with it. | §9 *would anyone notice? no → remove* · §7 *accessibility polish* · §8 *redundant info* |

**Each answers the filter.** #1 and #2 remove an *abrupt* edge (a colour that jumps instead of eases) — the household would feel the roughness of the snap even if they could not name it (Experience Architecture § 17: *feel its absence → craft*). #3 removes a *redundant* thing a screen-reader user would notice as a stutter — the rooms' quiet echo of the LHXP4 double-"Apple": say the count once. None adds anything; all three make the house a little more evidently *meant* (HOMEOWNER1 Principle 2).

---

## 2 · The craftsmanship audit — reviewed, and the verdict

The whole house (all ten rooms) was walked in code against brief items 7 and 8. The dominant, honest finding is that **the house is already well-crafted** — five passes and the PRESENCE/HOSP/ROOM/UX3 programmes have done their work. Recording what was reviewed and *found sound* is as much a part of an honest finish as the edits.

| Category (§7 / §8) | Finding | Verdict |
|---|---|---|
| **Gratuitous decorative animation** (item 9's prime target) | **None exists.** Every `animate-pulse` / `animate-spin` / `animate-bounce` is a functional loading or live-listening state (pending buttons, the voice mic, skeletons, "Importing recipe…"). No `animate-ping`, no shimmer, no decorative motion. | **Already restrained — nothing to remove.** |
| **Abrupt state changes (transitions)** | **Not a house-wide defect.** Every toggle/tab/segmented control built with a template-literal className already carries `transition-colors`/`transition-all`; only a handful of ad-hoc links/buttons missed it. | **Two clearest outliers fixed (§1 #1, #2); the ~15 remaining scattered one-offs staged** — sweeping them all blind would drift into a house-wide change that needs the running product. |
| **Inconsistent radii / shadows** | One real case: Shopping's "Recent Lists" uses `rounded-2xl` (mobile) vs `rounded-xl` (desktop) — but the two are behind `lg:hidden`/`hidden lg:flex` and **never on screen together**. | **Staged.** Real in code, invisible in use, possibly a deliberate per-breakpoint choice — a Home-Owner call, low payoff. |
| **Inconsistent icon sizing** | No clear same-role divergence found worth a blind edit; icon sizes track their structural role. | **Sound — left untouched.** |
| **Redundant / duplicate info** | The `PlantRing` double-announcement (fixed §1 #3). The decorative ring-around-a-leaf and the brass `home-door-handle` are item-9 candidates but are **documented, deliberate** metaphor payoffs. | **The provable redundancy fixed; the intentional marks staged for the owner's eye.** |
| **Motion / transition / animation *quality* & *timing*** | The Companion (LHXP4) and rooms use restrained, well-damped motion. | **Feel — staged (§3).** Cannot be judged from source. |
| **Typography hierarchy · card proportions · empty-space composition · alignment** | Largely settled by LHXP1 (composition) and the room passes. | **Feel — staged (§3)** where any change remains; no objective defect to ship. |

---

## 3 · What was deliberately **staged**, and why

Honest restraint — every item whose correctness is a matter of *feel* or a recorded design intent was **not** shipped blind:

- **The motion-quality pass** (item 7) — open/close curves, animation timing, hover/focus *feel*, mobile/desktop polish, "performance perception". This is the item the whole arc has kept staging (LHXP4 §3, LHXP1 §4) because motion feel cannot be guessed. **The Home Owner's running-product walk-through is its home.**
- **The remaining ~15 ad-hoc missing-transition buttons** (Meals/Planner one-offs) — safe individually, but shipping them all blind becomes a house-wide sweep better done once, with eyes, at the widths the review used.
- **Shopping "Recent Lists" radius** — invisible in use, possibly deliberate per-breakpoint; low payoff, owner's call.
- **The decorative `PlantRing` circle and the `home-door-handle`** — documented, intentional metaphor marks; removing them is an aesthetic judgement (item 9 asks "would anyone notice?" — the docblocks argue *yes, the metaphor would thin*), so they wait for the owner.
- **The Larder "In Larder" group label on the Home/Pet section** — a copy/semantics fix (a household item is not "in the larder"), staged as a judged copy call, not a flourish removal.
- **A dead `handleCategoryChange` in `pantry-page.tsx`** — non-visual dead JS; noted for a later code cleanup, out of scope for a presentation pass.

---

## 4 · Reading against the Living Home Maturity Model

LHC1's **Level 3 — Hospitable** requires *calm · balanced · warm · inviting · comfortable*. This pass targets the last of the finish — the **craft** beneath "comfortable": edges that ease rather than snap, and nothing said twice.

| Room | Dimension moved | How |
|---|---|---|
| Household / Profile | **Comfortable · crafted** (was: abrupt hover snaps) | the settings links ease |
| Orchard | **Consistent · crafted** (was: the one tab that snapped) | matches every other tab in the house |
| Home | **Considered** (was: a doubled screen-reader announcement) | the count is spoken once |

Levels 1–2 (identity, ownership, workflow) are untouched. **Level 4 (Living)** remains deliberately gated behind Environmental Dressing (LIVINGHOME2, DECLARED-NOT-BUILT) — see §*Assessment* and §*Transition* below. The full maturity assessment is the headline deliverable of this final pass, recorded after the compliance blocks.

---

## 5 · The forbidden list — confirmed untouched (item 11)

Not one byte of: **new features · new capabilities · new behaviours · Environmental Dressing · business logic · APIs · schemas · navigation · ownership.** No server or shared file was touched. Every change is a `className` addition or the removal of a redundant presentational element on a consumer. No route, no data-testid removed (`link-help-centre`, `link-contact-us`, `link-privacy-settings`, `link-legal-policies`, `orchard-part-*`, `text-home-plant-summary` all intact), no handler, no state.

---

## Architecture Compliance

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================
☑ One canonical identity — no entity touched.
☑ One owner per fact — no fact re-owned; every edit is a consumer's presentation
  (GEA17 / UIOWN1). The plant count still comes from its owner; the ring simply
  stopped repeating it to assistive tech.
☑ No duplicate entities / ownership / state — nothing created; one duplicate
  REMOVED (the sr-only echo).
☑ Extends existing architecture — adds `transition-colors` (the house's existing
  motion vocabulary) to two outliers; invents no pattern, no token, no component.
☑ Progressive enrichment — additive/subtractive presentation; every change
  reversible by reverting one className / restoring one span.
☑ Knowledge domain compliance — no knowledge domain touched; Product Registry
  impact nil.
☑ Honest gaps over fabricated information — nothing fabricated; a redundancy removed.
☑ No permanent synchronisation bridge — none.
☑ Evolution over replacement — nothing retired but a redundant span; no component
  removed, no behaviour changed.

Experience Constitution Check (before design):
  hospitality — the house is a touch calmer and more considered; edges ease,
                the count is spoken once (GEA1/GEA2).
  outcome     — reduced felt roughness; a screen-reader user is not made to hear
                the same fact twice.
  weight      — lighter: a redundant element removed, no ornament added (GEA15).
  voice       — no room gained a voice; nothing the Companion or a room SAYS
                changed (GEA8/21).
  ownership   — nothing re-owned; the household still owns every decision (GEA23).
  restraint   — the pass IS restraint: consistency + removal, never addition
                (GEA11/GEA15).
  layer       — Experience Implementation only; originates no law (GEA20).
```

## AI Architecture Compliance

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
✓ Uses the canonical Intelligence Platform — not reached at all. No capability,
  intent, prompt, Context View, notice, or persona created or changed.
✓ Capability Registry / Intent Engine / Behaviour Engine — untouched. No Companion
  surface was touched by this pass (LHXP4 finished that work).
✓ Does not create another assistant — none touched.
✓ Companion ownership unchanged — no interpretation, observation, or word added
  anywhere; the three edits are on room chrome, not the Companion.
✓ Honest gaps over fabricated knowledge — nothing guessed shown as real; a
  redundant assistive-tech echo removed.
```

## Definition of Done

- **Success looks like:** this document exists at `docs/implementation/house/LIVING_HOME_PASS5_LIVING_CRAFTSMANSHIP.md`; three objective craftsmanship defects are fixed (two abrupt-hover outliers eased, one redundant screen-reader echo removed); the whole house is reviewed with the sound parts recorded as sound and the feel-dependent finish staged; the Living Home maturity is assessed; the Environmental Dressing transition is recommended; typecheck / build / adoption baseline-identical; rollback reported.
- **What must not break:** nothing runtime — no data, workflow, route, identity, ownership, or behaviour changes; the forbidden list (§5) is byte-untouched.
- **Manual test steps:** `git diff --stat <rollback-tag>..HEAD` shows only the three room files + this doc + session files; typecheck 88 (baseline, 0 client, 0 edited-file); build exit 0; adoption 100·0·9.
- **Product Registry impact:** none — a transition class and a removed redundant span are not registry facts.

## Data Impact

- **Reads existing data:** no new read. `PlantRing` no longer even reads the `count` it is passed (it stopped needing it); the settings links and orchard tabs read nothing new.
- **Writes new data:** NO.
- **Changes meaning of existing data:** NO. The plant count's value and source are unchanged; only a duplicate *announcement* of it was removed.
- **Requires backfill:** NO. **Special-category data:** none read, moved, or exposed.

## Trust Check

- **Could this mislead the user?** No — nothing the house asserts changed. A count is now announced once instead of twice; two hovers ease instead of snap.
- **Could this fabricate certainty?** No. No number, claim, or state was added, removed, or blind-edited.
- **Is anything guessed but shown as real?** No.
- **Was any owned word or number changed?** NO. The `PlantRing` change removed a *duplicate* of the visible caption, not the caption; the visible fact is byte-identical.
- **What happens if the system is wrong?** A presentation defect, corrected by reverting one className or restoring one span.
- **No trust surface, consent ledger, permission path, or conversation store touched.**

## Rollback Plan

- **Rollback identifier:** `rollback/LIVING-HOME-PASS5-20260722` → `87d5797e` (annotated tag, object `fa5f86a5`, on `int1-intelligence-platform`, created **before any change**).
- **Coverage caveat:** a tag protects committed state only. At tag time the working tree held one uncommitted change not authored by this pass — `.engineering/session/CURRENT.md` (the heartbeat); not covered, not discarded.
- **To revert:** `git revert` the pass commit, or `git checkout rollback/LIVING-HOME-PASS5-20260722 -- <the three files>`. Each change is one className / one restored span / one prop; reverting restores the previous rendering exactly.
- **Blast radius:** three consumer surfaces, presentation only. No data, schema, building block, route, capability, token, or governing document.

## Scope Lock

- **Shipped:** three presentation-only craftsmanship refinements (§1) + this document + session artefacts.
- **Explicitly NOT done (and why):** the motion-quality/timing pass (feel — needs the running product); the ~15 remaining scattered missing-transition one-offs (would become a blind house-wide sweep); the Shopping "Recent Lists" radius (invisible in use, possibly deliberate); the decorative `PlantRing` ring and `home-door-handle` (documented intentional marks — owner's eye); the Larder "In Larder" label (judged copy call); the dead `handleCategoryChange` (non-visual, later cleanup); **all** Environmental Dressing (DECLARED-NOT-BUILT — and the subject of the transition recommendation below, not this pass); no feature/capability/behaviour/logic/API/schema/navigation/ownership change; **no governing document amended.**
- **Functionality unchanged** everywhere; only presentation moved.

## Manual Verification

- `npm run typecheck` → **88 errors — byte-identical to baseline**; **0 in `client/`**, **0 in any of the three edited files**.
- `npm run build` → **exit 0**; `dist/index.cjs` emitted; the esbuild `import.meta` warnings are pre-existing.
- `npm run adoption:check` → **100 · 0 · 9** — identical to baseline; no building block touched.
- No `data-testid`, route, handler, or state changed. The `PlantRing` prop removal is internal to `home-experience-page.tsx` (definition + one caller, both updated); the server test that grep-matched "different plant" is nutrition-data, not the Home UI, and is unaffected.
- **No authenticated live walk-through was performed** — this pass is non-interactive. Each shipped change is decidable by reading (a `hover:*` with no `transition`; a `sr-only` provably duplicating an adjacent visible caption). Every feel-dependent refinement was staged (§3), per the standing discipline (HOSP1 / ROOM1 / PRESENCE1-2 / LARDER_NS1 / LHC1 / LHXP1-4).

## User Acceptance Evidence

- **Pre-state evidence:** `docs/investigations/house/HOMEOWNER2_LIVING_HOME_REVIEW.md` (the Home Owner's Apple-Design-Award-bar critique), `LIVING_HOME_COMPLETION_PROGRAMME.md` (the [Visual] roadmap items K/craft), and `LIVING_HOME_PASS4_COMPANION_PRESENCE.md` § Recommendations (which scoped this Craftsmanship pass).
- **This pass** discharges the *decidable-by-reading* slice of that craftsmanship scope — two abrupt-hover outliers eased and one redundant screen-reader echo removed — while honouring the discipline that the motion/composition *feel* is the Home Owner's on the running product.
- **Outstanding acceptance step (the gate):** the Home Owner walks the settings links (do the hovers now ease?), the Orchard tabs (does the one that snapped now match the rest?), and Home with a screen reader (is the plant count announced once?); then directs the staged motion-quality finish and rules on the intentional-mark item-9 candidates. Consistent with the outstanding walk-throughs recorded across LHC1 / HOSP1 / ROOM1 / PRESENCE1-2 / LARDER_NS1 / LHXP1-4.

---

## Assessment of Living Home maturity

*Read against LHC1's Living Home Maturity Model, after five experience passes.*

**Level 1 — Constructed** (*the house has walls and doors*): **complete and long-held.** Every room has a route, a place in `NAV_ITEMS`, and a canonical owner.

**Level 2 — Functional** (*the room works*): **complete and long-held.** Every room fulfils its `ROOM_PURPOSE`; ownership is canonical (no fact re-owned by the UI — the UIOWN1/CONV1 convergences); workflows are whole.

**Level 3 — Hospitable** (*the room is a pleasure to be in*): **substantially complete across every room — the achievement of this five-pass arc.** Reading the five dimensions:
- **Calm** — nothing engineered to hurry or grade; the trial countdown was removed (LHC1), the Planner flame confirmed as calories not a grade (LHXP1), no streaks or scores anywhere (GEA13 held).
- **Balanced** — surplus became air, not absence (LHXP1: Shopping void, Orchard centre, Companion drawer).
- **Warm** — the family record invites rather than accuses, the clinical dash is gone, the rooms report without counselling (LHXP2).
- **Inviting · trustworthy** — every number is legible or honestly absent; estimates declare themselves; no fabricated certainty (LHXP3). The Companion is quietly present, introduces itself once, and offers rather than demands (LHXP4). The last abrupt edges now ease (LHXP5).
- **Comfortable** — the cumulative result: a house a household can be in without friction, doubt, or clutter.

Two honest qualifications on Level 3: (a) **its final certification is the Home Owner's**, on the running product — this arc *moved every room to the threshold of Level 3 and across most of it*, but "a pleasure to be in" is a felt judgement no checklist completes (HOMEOWNER1 Decision Framework); and (b) a handful of **feel-dependent finish items remain staged** (the motion-quality pass, the intentional-mark calls, the count reconciliations from LHXP3) — the *craft* is at the threshold, awaiting eyes, not architecture.

**Level 4 — Living** (*the room is alive*): **deliberately gated, and correctly so.** Its defining layer — *quiet environmental life, the home's own hospitality layer* — is **Environmental Dressing** (`LIVINGHOME2`), which is **DECLARED, NOT BUILT** and hard-blocked until its owner amendments land. The other Level-4 dimensions the house already reaches *lawfully*: seasonal presence through the household's food (never the house's light), household awareness (the rooms show what is true of *this* household or nothing), and "feels cared for even when nothing new has happened" (the still house, kept). What Level 4 *adds* — and what the house does not yet have — is the environmental dressing itself.

**Overall:** The Living Home stands at **Level 3, held across every room, with the finish at the Home Owner's threshold — and Level 4's one unbuilt layer lawfully gated ahead of it.** The house's identity and atmosphere are governed and built; the five-pass arc has closed the Level-2→3 finish that HOMEOWNER2 circled. The remaining distance is (1) the Home Owner's live certification of Level 3, (2) the small staged feel-finish, and (3) the deliberate, gated step into Level 4 — which is exactly the transition below.

---

## Recommendation — transition into Environmental Dressing (the step into Level 4)

The five-pass Living Home Experience arc is complete: the rooms are balanced, warm, trustworthy, quietly companioned, and now crafted. **The next move is not another experience pass over the same rooms — it is the deliberate, governed step from Level 3 (Hospitable) into Level 4 (Living), whose defining and only-missing layer is Environmental Dressing.** This is the natural and correct transition, and it must be made *through* the governance, never around it (HOMEOWNER1: the Home Owner exercises authority through the governing documents, never around them).

**What Environmental Dressing is** (LIVINGHOME2): the home's own *quiet environmental life* — a claim-free, non-personalised hospitality layer that turns only with the year, reads as the *home's warmth* and never as *this room's information* (ED3), has exactly one future owner (the Dressing Register), one mouth, and never a channel (ED11). It is the layer that turns *"a room that is a pleasure to be in"* into *"a room that feels alive."*

**Why it is the right next step — and why it is not this arc's to ship:**

1. **It is Level 4's substance.** The house already holds Level 4's *other* dimensions lawfully (seasonal presence via the household's food, household awareness, the kept-still house). Environmental Dressing is the one piece that remains — so it *is* the transition from Hospitable to Living.
2. **It is DECLARED-NOT-BUILT and hard-blocked.** Nothing dressing-shaped may ship until the **four owner amendments in `LIVINGHOME2` §10.2** land in their owners' files: Blueprint §12.1.2 (the prop ban refined), OHDB §11 / EXP5 §5.3 (the "seasonal dressing declined" verdict annotated), LIVINGHOME1 (three bounded §5.2 / ladder / §10.4 amendments), and EXP3 (the Dressing Register added). Each is made in the owner's own file, at its own review — **this is the transition's first concrete task.**
3. **It is the recorded Owner Decision A** (LHC1), *deferred three times* (HOSP1, LARDER_NS1, LHC1). The five-pass arc deliberately spent its effort on the Level-3 finish that *was* lawful to ship, and left the gated layer gated. The gate is now the only thing between the house and Level 4.

**The recommended transition, in order (each a separate governed act with its own rollback, gates, and report — LIVINGHOME1 §11 roadmap):**

- **Step 0 — the Home Owner's Level-3 certification.** Walk the running product; certify Hospitable across the rooms; clear the staged feel-finish (the motion-quality pass, the count reconciliations, the intentional-mark calls). *Finish the floor before building the next storey.*
- **Step 1 — open (or hold) the §10.2 amendment path.** The Home Owner decides Owner Decision A: make the four amendments, or record the hold. **Until this, Environmental Dressing cannot lawfully begin.** Holding is a legitimate, recorded outcome — the atmosphere already praised (the window/ground/light/voice system) stands regardless.
- **Step 2 — declare the Dressing Register** (LIVINGHOME2 §10.3) in the Source of Truth Register: one owner, one mouth, the season key consumed from Domain 11 (HT17), never personalised, never a claim.
- **Step 3 — build the first dressing**, one item at a time, honest-in-absence, still, data-borne-or-dead — under the placement law (no produce in the Larder, no books in the Cookbook, no meals in the Planner; ED3/§5.1) and the graded-surface ceiling (UIA §15).

**The line that must hold through the whole transition:** the house holds still; the life moves (LIVINGHOME1). Environmental Dressing is the *home's* quiet warmth turning with the year — never the household's data, never a claim, never a second sun. Done through its amendments it is the lawful realisation of the "make it feel like a real place" that HOMEOWNER2 asked for; done around them it is the theme park the canon forbids. **The five-pass arc leaves the house Hospitable and the gate clearly marked; the step through it is the Home Owner's to open.**

---

*Pass `LHXP5`. The settings links ease instead of snapping, the one orchard tab that jumped now moves like all the others, and the plant count is spoken once rather than twice. Three small edges made smooth — and a house-wide search that mostly found the house already well-made, which is its own kind of good news. The Living Home is Hospitable across every room now; what remains is the Home Owner's eye on the finish, and the gate — clearly marked, lawfully shut — through which the home would, one governed amendment at a time, quietly come alive.*
