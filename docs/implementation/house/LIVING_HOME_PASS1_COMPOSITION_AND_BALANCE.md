# Living Home Experience Pass 1 — Composition & Balance (`LHXP1`)

| Field | Value |
|---|---|
| **Programme ID** | `LHXP1` (Living Home Experience Pass 1) |
| **Date** | 2026-07-22 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback ID** | `rollback/LIVING-HOME-PASS1-20260722` → `df44399b` (annotated tag, created before any change) |
| **Kind** | Presentation-only refinement pass — composition & balance across the household rooms. **No redesign.** |
| **Governing parents** | `HOME_OWNER_ARCHITECTURE.md` (HOMEOWNER1, esp. Principle 11 — *completion is a milestone, refinement is continuous*) · `GOVERNING_EXPERIENCE_ARCHITECTURE.md` (GEA1/2/3/11/13/17) · `UI_CANONICAL_EXPERIENCE_OWNERSHIP.md` (UIOWN1) · `LIVING_HOME_EXPERIENCE_ARCHITECTURE.md` (LIVINGHOME1) · `LIVING_HOME_COMPLETION_PROGRAMME.md` (LHC1 — the roadmap this pass draws from) |
| **Reads against** | LHC1's Living Home **Maturity Model** — the goal is to move every room closer to **Level 3 — Hospitable** |

---

## 0 · What this pass is, and what it is not

This is an **experience pass, not a room pass**: one consistent hand applying the same composition principles across every household room, so the whole home feels calmer, more balanced and more intentional — as though *someone cared enough to arrange it*.

It is **refinement, not redesign** (HOMEOWNER1 Principle 11). It ships **presentation-only** changes to **consumer** surfaces: max-widths, centring, spacing rhythm, and colour-opacity softening. It creates **no** route, capability, entity, schema, token, component, business logic, navigation, or second assistant, and it **amends no governing document**.

The principles applied everywhere (the brief's own list, each cited to an owner):

- **Clear visual hierarchy · better balance across desktop widths · reduce visual weight** — GEA2 (*a more capable THA is a quieter THA*).
- **Remove unnecessary containers · remove empty dead space · whitespace as "air"** — **GEA11** (*surplus space becomes air and view, never absence*): the single most-repeated defect in the house was a content column pinned left inside the wide (`max-w-screen-2xl` ≈ 1536px) reading rail, spending its surplus as **absence** rather than **air**.
- **A clear focal point · improve reading flow · improve alignment consistency** — the Experience Test (*which room is this · how should someone feel · what is the one thing*).

### The honest constraint this pass worked under

The repository's standing discipline — set by HOSP1, ROOM1, PRESENCE1/2, LARDER_NS1 and LHC1 one day earlier — is that **room-body composition changes ship with a live Home Owner walk-through, never blind**, because their correctness is a matter of proportion best judged on the running product at the widths the review used (1440 / 1280 / 390). This pass was authored in a **non-interactive environment** (no authenticated live walk-through was possible).

The pass therefore ships **only the changes whose correctness is decidable by composition reasoning rather than by pixel-guessing** — symmetric-air centring, spacing rhythm, opacity softening, and one redundant-value suppression — and **stages** every change that genuinely needs live judgement (Home's recorded air decision, Nutrition's stat hierarchy, the deeper Planner/Diary body work) as a precise, prioritised walk-through checklist (§ 4). Shipping those blind would violate the discipline this pass is required (task item 11) to validate against.

---

## 1 · Changes shipped, room by room

Every change is a `className`-only edit on a consumer. No JSX structure removed, no `data-testid` changed, no logic touched.

| # | Room | File | Change | Principle |
|---|---|---|---|---|
| 1 | **Shopping** | `shopping-workspace-page.tsx` | The list card, the price-comparison strip, and the "Always in basket" card each constrained to `max-w-4xl mx-auto`. The list stretched the full ~1536px rail, so each row was name-left / score-right with a dead horizontal middle, and the finite list ended into a **vast empty void**. Now the list is a composed, centred column and the surplus becomes symmetric **air**. | GEA11 · "eliminate empty voids · improve list composition · visual confidence" |
| 2 | **Orchard** | `orchard-page.tsx` | The empty state (`Your orchard is quiet.` + the privacy line — *the warmest writing in the room*) was pinned to the **left third** of the wide rail. Added `items-center justify-center text-center`: the room's best asset is now the **composed centre** and the orchard reads as the focal point. | "centre the experience · let the orchard be the focal point" |
| 3 | **Companion** | `FloatingAssistant.tsx` | The empty-state drawer used `justify-end`, pinning the welcome to the bottom and leaving a large **empty vertical gap** above it. Changed to `justify-center` — a balanced, composed first meeting. | "improve drawer balance · spacing · visual focus" |
| 4 | **Cookbook** | `meals-page.tsx` | All six recipe/product **card shelves** went `gap-3 → gap-4` — consistent card spacing across *every* shelf, now matching the Household Variants grid (already `gap-4`). More air between cards; one rhythm across the room. | GEA11 · "card spacing · shelf balance" |
| 5 | **Larder** | `pantry-page.tsx` | The two-section shelf grid (Food / Home) went `gap-5 → gap-6` — a touch more air between the shelves. | "improve shelf composition" |
| 6 | **Household / Profile** | `profile-page.tsx` | The raw login **email** printed under the household name (`colin.clapson@googlemail.com`) read as account chrome on the one room whose subject is the *family*. It is suppressed in the identity header (the friendly `@handle` still shows; a login email does not) and **remains in its proper place, the Account section**. The line is kept as ` ` so the layout never shifts. | HOMEOWNER1 · "reduce administrative appearance · warmth" |
| 7 | **Planner** | `weekly-planner-page.tsx` | The week grid's structural borders (`border-border` on the day-header, row-label, day-cell and summary-row) softened to `border-border/60`. A hard-ruled full-opacity grid reads as a **spreadsheet**; the fainter hairlines still delineate every cell but let the table breathe. Pure opacity — no layout shift. | GEA2 · "reduce spreadsheet feeling · reduce visual weight" |
| 8 | **Diary** | `food-diary-page.tsx` | The five meal slots sat in a hard `divide-y divide-border` box that read as a **clinical checklist of chores**. Box border → `/70`, dividers → `/60` — the daily log reads warmer and less ruled. Pure opacity. | Experience Language § 3A (*never clinical, never cold*) · "reduce clinical appearance · better spacing" |

**Eight rooms refined.** A ninth finding was *resolved without a change*: **the Planner "🔥 62" flame renders plain total daily calories** (`day.entries` summed, formatted `1.2k`), **not a grade or score** — it measures the food's energy, not the household's week, so it **complies with GEA13** and is correctly kept. This closes LHC1's open **Owner Decision D** as *verified: it is calories, keep*.

---

## 2 · Reading against the Living Home Maturity Model

Per LHC1's model, **Level 3 — Hospitable** requires *calm · balanced · warm · inviting · comfortable to spend time in*. This pass targets the **balanced** and **warm** dimensions specifically. Movement recorded (the pass moves rooms *closer to* Level 3; it does not, alone, certify arrival — that is the Home Owner's judgement at § 6):

| Room | Level-3 dimension moved | How |
|---|---|---|
| Shopping | **Balanced** (was: void as absence) | surplus → symmetric air; the list is composed, not stranded |
| Orchard | **Balanced · Inviting** (was: left-third) | the reassuring copy is centred and becomes the focal point |
| Companion | **Balanced · Comfortable** (was: dead vertical gap) | the welcome is composed, not bottom-pinned |
| Cookbook | **Calm · Balanced** | one consistent card rhythm; more air |
| Larder | **Calm** | more air between shelves |
| Profile | **Warm** (was: administrative) | the family, not the login email, is the subject |
| Planner | **Calm** (was: spreadsheet) | softer rules, less ruled-grid weight |
| Diary | **Warm** (was: clinical) | the daily log reads less like a form |

Levels 1 (Constructed) and 2 (Functional) are already held by every room; this pass changes nothing about identity, ownership, or workflow, so it neither adds nor risks them. Level 4 (Living) remains deliberately gated behind Environmental Dressing (`LIVINGHOME2`, DECLARED-NOT-BUILT) and is untouched here.

---

## 3 · The nine forbidden classes — confirmed untouched

Per task item 9, this pass changes **none** of:

- **Canonical ownership** — every edit is a consumer; no fact re-owned (UIOWN1 / GEA17). `NAV_ITEMS`, `ROOM_EXPOSURE`, `ROOM_GROUND`, `ROOM_PURPOSE`, `REALM_STYLES` **byte-unchanged**.
- **Navigation architecture** — the one bottom nav, the shell, the rail: untouched. No route added, moved, or renamed.
- **Environmental Dressing** — DECLARED-NOT-BUILT; not a byte shipped, no `LIVINGHOME2` amendment.
- **Living Behaviour** — the season rule, Stories, greeting words, the re-aimed door: untouched.
- **Companion capabilities** — no capability, prompt, Context View, notice channel, or persona created or changed. The one Companion edit is the drawer's *empty-state flex alignment* — presentation, not capability.
- **Business logic · APIs · schemas · data models · permissions** — no server/shared file touched; no query, field, migration, or `access.ts` change.
- **Intelligence Platform** — untouched; no spine component reached.

---

## 4 · Remaining Level 3 gaps — staged for the Home Owner walk-through

Precisely what this pass deliberately did **not** ship, and why. Each needs the running product or is a recorded owner decision. None was swept blind.

- **Home** — the hero's right-hand air is a **recorded owner decision** (`HOMEROOM1`, 2026-07-21): the two-column Companion bay was removed and the space returned to *air and view* on purpose (GEA11). Re-weighting it here would re-litigate a decision made one day ago. The script-name size, the gold windowsill band and the desktop-nav posture are LHC1 **[Owner]/[Visual]** items (roadmap C/F/K). **Left untouched by design.**
- **Nutrition** — the "number soup" (the *Plants this week* figure appears at `text-xl` in `ReportSummary` **and** `text-3xl` in `ThirtyPlantsTracker`) and the six sort chips live in `PlantDiversityReport.tsx`. Choosing the one primary figure and demoting the rest is a composition judgement that needs the running report. **Staged (LHC1 item M / Nutrition 2–3).**
- **Cookbook** — the "From the Web" banner still competes with "Your recipes" by rendering first with a filter toolbar (a placement decision, not a size one); food photography is **Owner Decision B**.
- **Larder** — consolidating the 6 + 3 competing tab systems is **structural** (LHC1 item M) and needs a walk-through.
- **Planner** — the fuller grid calming (introducing gaps, a *today* marker, day-header hierarchy, the cluttered sub-toolbar, the eleven co-equal rail buttons with no primary) is LHC1 item J — staged. The border-softening shipped here is its safe first step.
- **Shopping** — the add-mode composer still sits alone when the history sidebar is absent (a second empty-half case); the capture tools (mic/scan/upload) remain faint at 45% (LHC1 items E/K).
- **Diary** — the BMI-first clinical greeting (`HealthSnapshot`, a component **shared with Profile** — changing it touches both rooms) and the daily-log body redesign (ROOM1 § 4) need eyes.
- **Companion** — "Apple" is labelled twice (title + `PersonaLabel` badge). The clean de-dup was deferred rather than shipped, because removing the badge's only render leaves the `PersonaLabel` component dead, and confirming the header still reads well needs the running drawer (LHC1 item I). Suggestions-as-offers and the desktop scrim (a recorded UX3 *no-blur* decision) also stay staged.

---

## Architecture Compliance

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================
☑ One canonical identity — no entity touched; every room binds to its existing owner.
☑ One owner per fact — no fact re-owned; every edit is a consumer (GEA17 / UIOWN1).
☑ No duplicate entities — nothing created.
☑ No duplicate ownership — no second owner of any name, hue, exposure, ground or purpose.
☑ No duplicate state — no store, no derived fact persisted; nothing stateful edited.
☑ Extends existing architecture — refinement inside room bodies; no rival layer, no new system.
☑ Progressive enrichment — additive presentation only; every change reversible by opacity/width revert.
☑ Knowledge domain compliance — no knowledge domain touched; Product Knowledge Registry impact nil.
☑ Honest gaps over fabricated information — the deferred items are named, not papered over (§4).
☑ No permanent synchronisation bridge — none created.
☑ Evolution over replacement — nothing retired; no component removed.

Experience Constitution Check (before design):
  hospitality — the house is calmer and more welcoming, not more capable (GEA1).
  outcome     — reduced felt weight in every room touched (GEA2).
  weight      — lighter: softer rules, more air, fewer competing figures.
  voice       — no room gained a voice; rooms still only report (GEA8/21).
  ownership   — nothing re-owned; agency untouched (GEA22/23).
  restraint   — GEA3 (no engineered urgency) / GEA11 (surplus → air) / GEA13 upheld.
  layer       — Experience Implementation only; originates no law (GEA20).
```

## AI Architecture Compliance

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
✓ Uses the canonical Intelligence Platform — only by reference; no spine component reached.
✓ Capability Registry — no capability added, moved, or removed.
✓ Intent Engine — untouched; no intent, path, or bypass.
✓ Reuses existing business services — no service touched.
✓ Does not create another assistant — one Companion, one chair; the single Companion edit is the
  drawer's empty-state flex alignment (presentation), not a capability, prompt, or persona change.
✓ Does not duplicate conversation state — none touched.
✓ Registered capabilities only — none created or changed.
✓ Permission-aware access — access.ts untouched; no reach widened.
✓ Honest gaps over fabricated knowledge — deferred items named (§4); no Companion word changed.
```

## Definition of Done

- **Success looks like:** this document exists at `docs/implementation/house/LIVING_HOME_PASS1_COMPOSITION_AND_BALANCE.md`; eight rooms carry a lawful, presentation-only composition/balance refinement; every change validated against the Maturity Model as movement toward Level 3; typecheck / build / adoption are baseline-identical; the rollback identifier is reported; the deferred gaps are staged, not swept.
- **What must not break:** nothing runtime — no room's data, workflow, route, or identity changes; the forbidden nine classes (§3) are byte-untouched.
- **Manual test steps:** `git diff --stat <rollback-tag>..HEAD` shows only the eight room files + this doc + session files; `npm run typecheck` = 88 (baseline, 0 client); `npm run build` = exit 0; `npm run adoption:check` = 100 · 0 · 9 (baseline).
- **Product Registry impact:** none — no user-facing capability, route, claim, or surface added or removed; composition polish is not a registry fact.

## Data Impact

- **Reads existing data:** NO new read. The Profile change reads the *same* `profile.username` field it already read.
- **Writes new data:** NO. Nothing writes.
- **Changes meaning of existing data:** NO. The Profile email is not deleted or altered — it is not *displayed in the header*; it renders unchanged in the Account section (`profile-page.tsx:2108`).
- **Requires backfill:** NO.
- **Special-category data:** none read, moved, or exposed.

## Trust Check

- **Could this mislead the user?** No. No number, claim, or state changed. The Planner flame was *confirmed* to be honest daily calories (not a grade) and kept.
- **Could this fabricate certainty?** No — the opposite: softening the spreadsheet/clinical surfaces removes false gravity, and no figure was blind-edited. (The Shopping "12 vs 3" and Nutrition "17 vs 18" count reconciliations remain **[Trust]** items for the running product — LHC1 item D — and were **not** touched here, exactly because a number changed without understanding its source is how trust is spent.)
- **Is anything guessed but shown as real?** No.
- **What happens if the system is wrong?** For this pass: a composition defect, corrected by reverting one `className`.
- **The suppressed email** is a presentation choice, not a data change: the login email stays fully visible in the Account section; the household identity header simply stops leading with account chrome.
- **No architectural duplication introduced · no new source of truth · no runtime behaviour altered beyond presentation:** YES to all.

## Rollback Plan

- **Rollback identifier:** `rollback/LIVING-HOME-PASS1-20260722` → `df44399b2e1cb8fdad52255b14d86cf6c21e6374` (annotated tag on `int1-intelligence-platform`, created **before any change**).
- **Coverage caveat:** a tag protects **committed state only**. At tag time the working tree had one uncommitted modification not authored by this pass — `.engineering/session/CURRENT.md` (the session heartbeat); the tag does not cover it and this pass did not discard it.
- **To revert everything:** `git revert` the pass commit, or `git checkout rollback/LIVING-HOME-PASS1-20260722 -- <the eight room files>`. Every change is a `className` opacity/width/alignment tweak; reverting restores the previous rendering exactly.
- **Blast radius:** eight room consumers, presentation only. No data, schema, shared building block, route, capability, token, or governing document.

## Scope Lock

- **Shipped:** eight presentation-only composition/balance refinements (§1) + this document + the session recovery artefacts.
- **Explicitly NOT done (and why):** Home hero re-weighting (recorded HOMEROOM1 air decision); Nutrition stat hierarchy (needs the running report); Larder tab consolidation (structural); Planner grid gaps / today-marker / toolbar / rail (needs a walk-through); Cookbook web-banner reorder + photography (Owner Decision B); the count reconciliations (Trust — never blind-edited); the Companion "Apple" de-dup (would leave dead code without eyes); the Diary clinical-greeting hierarchy (shared component, needs eyes); **all** Environmental Dressing (DECLARED-NOT-BUILT); no schema / data / capability / token / component / route / business-logic / ownership / navigation change; **no governing document amended.**
- **Functionality is unchanged** everywhere; only presentation moved.

## Manual Verification

- `npm run typecheck` → **88 errors — byte-identical to the recorded baseline**; **0 in `client/`**, **0 in any of the eight edited files** (confirmed by filtering the error list).
- `npm run build` → **exit 0**; `dist/index.cjs` emitted; the 4 esbuild `import.meta` warnings are pre-existing.
- `npm run adoption:check` → **100 passed · 0 notice · 9 failed** — identical to baseline; no building block added, adopted, or retired (consumers only edited).
- No `data-testid` was removed or renamed; no JSX structure removed; every change is a `className` opacity / max-width / flex-alignment tweak, so no test that asserts on structure or ids is affected.
- **No authenticated live walk-through was performed** — this pass is non-interactive. The shipped changes were chosen to be high-confidence-correct by composition reasoning (symmetric-air centring, spacing rhythm, opacity softening, redundant-value suppression), not pixel-guesses; every change that genuinely required live judgement was deliberately staged (§4), per the repo's standing discipline (HOSP1 / ROOM1 / PRESENCE1-2 / LARDER_NS1 / LHC1).

## User Acceptance Evidence

- **Pre-state evidence:** `docs/investigations/house/HOMEOWNER2_LIVING_HOME_REVIEW.md` (the Home Owner's Apple-Design-Award-bar critique, 7/10) and `docs/implementation/house/LIVING_HOME_COMPLETION_PROGRAMME.md` (LHC1), whose roadmap items **E** (own the empty desktop half), **I** (Companion presence & focus), **J** (calm the Planner grid), **K** (spacing / faint controls), **L** (hide the machine email) and **M** (over-tabbed / spacing) this pass discharges the high-confidence slices of.
- **This pass** ships the reasoning-decidable slices of E (Shopping void → air, Orchard centre), I (Companion balance), J (Planner weight — first step), K (Cookbook/Larder spacing), L (email), plus the Diary warmth touch — and **resolves Owner Decision D** (the flame is calories; kept).
- **Outstanding acceptance step (the gate):** the Home Owner walks the eight refined rooms as a demo session on desktop (1440 / 1280) and mobile (390) and confirms each reads calmer and more balanced without any loss of function; and reviews the staged Level-3 gaps (§4) to direct the next pass. This is consistent with the outstanding walk-throughs already recorded for LHC1 / HOSP1 / ROOM1 / PRESENCE1-2 / LARDER_NS1 / HOMEROOM1.

---

*Pass `LHXP1`. Eight rooms, one hand: the surplus becomes air, the rules soften, the family comes before the login. Refinement, not redesign — and the moves that need the running product are staged, not guessed. The house is a little calmer, and a little more evidently arranged by someone who cared.*
