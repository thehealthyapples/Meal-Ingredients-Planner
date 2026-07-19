# PROD4 — Household Experience Completion

**Session:** `PROD4_Household_Experience_Completion`
**Date:** 2026-07-18
**Branch:** `int1-intelligence-platform`
**Rollback ID:** `rollback/PROD4-household-experience-completion-20260718` → commit `b6cc6aaa` (annotated)
**Dirty-tree snapshot:** `stash@{0}` → `69d886dc8b86e17e4cfe242c187ab0ca4f344c28` (8 tracked files; **35 untracked NOT covered**)
**Type:** Implementation. Finishes existing rooms on the existing architecture.
**Mandate:** No new architecture. No new AI capability. No Community/Partner. No commercial. No duplicated workflow.

---

## 1. What this programme is, and what it deliberately is not

PROD4's brief lists ten things to complete across six rooms. **This report does not claim to have completed them, and the Definition of Done marks precisely which were and were not.** Three sessions were already active in this territory when PROD4 began, and the single most valuable thing PROD4 did was find out what was genuinely left — which turned out to be much less than the brief assumes, and in three cases the opposite of what the backlog said.

The territory as it actually stood:

| Session | Owned | Status |
|---|---|---|
| `HOUSE_ACT1` | Household Experience Activation — build repair, the `/shopping` dead link, adoption re-measurement | landed `6e326d9f` |
| `HOUSE_ACT2` | Intelligence Doors — household learning surfaced in Planner, Pantry, Shopping, Cookbook | landed `b6cc6aaa` |
| `HOUSE_ACT3` | The Food Page Intelligence — **running concurrently in the same working tree during this session** | in flight |

PROD4 re-opened none of it. **Its whole contribution is four changes**, and the report is mostly about the things it established should *not* be built.

HOUSE_ACT1's own conclusion is the sentence PROD4 kept testing and could not falsify:

> *"Of four 'defects' reported by reconnaissance, three did not survive verification… **The rooms are in far better condition than a first pass suggests. The gap in THA is not polish.**"*

---

## 2. Architecture Compliance

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No entity touched. One ROUTE was renamed with a redirect, so no bookmark,
  deep link or shared URL changes meaning.

☑ One owner per fact
  Improved in two places. "Which room is Nutrition, and where does it live"
  had a label saying one thing and a path saying another; they now agree.
  "Is this control named for assistive technology" gains its enforcement from
  the module the Adoption Register already records as its owner — no second
  a11y utility was created.

☑ No duplicate entities
  None created.

☑ No duplicate ownership
  None created. The accessible-name enforcement EXTENDS
  `lib/a11y-dev-warnings.ts` rather than adding a rival; the navigation change
  goes through `NAV_ITEMS`, the one navigation list, and touches no second copy.

☑ No duplicate state
  No store, context or cache key added. The enrichment change reorders items
  already assembled this turn and introduces no state.

☑ Extends existing architecture
  Every change adopts something that already exists: the a11y warning owner,
  the one navigation list, the existing enrichment composition.

☑ Progressive enrichment where appropriate
  N/A — no knowledge entity.

☑ Knowledge domain compliance
  N/A — no knowledge domain introduced or extended.

☑ Honest gaps over fabricated information
  Directly served: the enrichment fix stops two nutrition sources being
  structurally silenced, and three proposed features were REFUSED because
  building them would have produced UI that can never contain anything.

☑ No permanent synchronisation bridge
  None introduced.

☑ No duplicate capabilities
  No capability registered, bound or extended. The registry, the Intent Engine
  and INT17 are untouched.
```

### AI Architecture Compliance

**Applicable — one change touches the Companion's turn pipeline, and it is a presentation-ordering change only.**

- **No new AI capability.** Nothing registered, bound, renamed or given a verb.
- **Canonical platform, registry and Intent Engine** — untouched. No new prompt, no new model call, no new context view, no change to what the model reads. PROD3's safety gate and HARD RULE 6 are byte-untouched.
- **No second assistant, no duplicated conversation state.**
- **The enrichment change is deterministic and post-model.** `buildEnrichment`, `buildNutritionEnrichment` and `buildHouseholdNutritionEnrichment` are unchanged; only the order in which their already-produced items are merged into three slots changed. No item is created, reworded or reordered *within* its own source.
- **Honest gaps preserved** — each source still returns nothing when it has nothing to say; round-robin cannot manufacture an item.
- **Companion was NOT given a room**, per HOUSE_ACT1's standing refusal: `FloatingAssistant` is mounted once and owns no page. *"This is compliant and must not be 'fixed' by giving it a page."*

---

## 3. What was delivered

Four changes. `16 files, 94 insertions, 15 deletions`.

### 3.1 Accessibility — 15 icon-only buttons, and the guard that stops the 16th

**PROD1 §8 item 10 said 15 icon-only buttons had no accessible name, and called it "the highest-value item left that needs no decision from anyone."** PROD4 audited it, found **49**, distrusted that, and found its own audit was wrong.

The first checker matched `<Button …size="icon"…>` with a regex ending at the next `>`. An `onClick={() => …}` handler contains a `>` inside its arrow, so the match truncated before any `aria-label` that followed. Rewritten to scan the JSX tag properly — tracking quotes and brace/paren depth — the count is **exactly 15**, matching PROD1 precisely.

That is worth recording for its own sake: **PROD1's number was right, and the tooling built to check it was wrong.** Acting on 49 would have added duplicate `aria-label`s to 34 already-labelled controls.

All 15 now carry a name, including:
- **the destructive delete** on plan templates (`templates-panel.tsx`), which PROD1 singled out;
- **the copy button on the share surface** — the growth loop's one control;
- **five buttons inside Radix `Tooltip`s** (`SmartReviewPanelContent.tsx`). These are the instructive ones: a tooltip supplies `aria-describedby` — a *description* — and never a *name*, so each announced as bare "button" while looking perfectly labelled to a sighted reviewer. Their labels reuse the tooltip's own wording so the two cannot drift.

**The guard.** `client/src/lib/a11y-dev-warnings.ts` is the Adoption Register's recorded owner of accessible-name enforcement, adopted by `Input` and `Textarea` for *form* controls. It gains `warnIfUnnamedIconButton`, and `ui/button.tsx` calls it when `size === "icon"` — the one case where a button has no text to be named by. Development-only; **verified stripped from the production bundle**. No new owner was created: the register's existing row gains its third and fourth consumers.

### 3.2 The nutrition enrichment starvation — intelligence that could never arrive

HOUSE_ACT2 flagged this and explicitly asked that it be checked before its Nutrition door was built:

> *"`conversation-gateway.ts:1021` orders static enrichment first, so it can consume all 3 `MAX_ENRICHMENT_ITEMS` slots and **starve both nutrition enrichment sources** — worth checking before priority 2 is built."*

**It is real, and it is not occasional.** The line was:

```ts
const enrichment = [...staticEnrichment, ...nutritionEnrichment, ...householdNutritionEnrichment]
  .slice(0, MAX_ENRICHMENT_ITEMS);   // MAX = 3
```

Measured against the live registry:

```
nutrition-knowledge declares 4 static enrichment items.   MAX_ENRICHMENT_ITEMS = 3.
```

So on a **nutrition turn** — precisely the turn NUT1's `buildNutritionEnrichment` and FI5's `buildHouseholdNutritionEnrichment` exist to serve — `nutrition-knowledge`'s own static items fill every slot by themselves, and both nutrition sources are starved. **They were starved on exactly the turns they were built for**, which is a large part of why HOUSE_ACT1 could report that *"no room ever renders them."*

The three sources now take turns. Static still takes the first slot, so the previous ordering's intent survives, but no source takes a *second* slot while another waits for its first. Demonstrated against the real counts:

```
BEFORE  static-1 · static-2 · static-3          → nutrition sources shown: 0
AFTER   static-1 · NUT1 · FI5                   → nutrition sources shown: 2
```

This invents no ranking policy, fabricates nothing, and changes no item's content.

### 3.3 The Nutrition room's label and path now agree

HOUSE_ACT1 outstanding recommendation #7: *"`Nutrition` label and `/plant-diversity` path disagree; plant diversity is one part of nutrition."*

It became more wrong after PROD2, which withdrew that room's two "Coming soon" tabs and left it hosting **Foods** and **Nutrients** — so the path named one tab after the whole room. `/nutrition` is now canonical and **`/plant-diversity` redirects**, so every existing bookmark, shared URL and dev prototype still lands. Updated through the one navigation list (`NAV_ITEMS`), its realm styling key, the Planner's link into the room, Home's link, and the room's own mobile-workspace listener. Verified: `/nutrition` ships in the built bundle, and no stale nav reference remains outside the DEV-only arrival prototypes.

### 3.4 What the Companion's turn pipeline did NOT get

No change to routing, confirmation, the safety gate, HARD RULE 6, the prompt, or the model. PROD3's work is byte-untouched.

---

## 4. Three things PROD4 refused to build, with evidence

This is the most useful section, and it follows HOUSE_ACT1's own discipline of verifying each reported gap before treating it as one.

**1. Household learning on Home and Diary — REFUSED. It would be permanently empty UI.**
HOUSE_ACT1 recorded learning as surfaced *"in one room out of thirteen"*, and HOUSE_ACT2 added four rooms — leaving Home and Diary as the apparent remainder. They are not a remainder. A learning signal's `domain` is the opportunity's `owningDomain`, and every value that exists anywhere in the codebase is:

```
owningDomain: "cookbook" | "pantry" | "planner" | "shopping"
```

There is **no `diary` domain and no `home` domain**. HOUSE_ACT2 mounted the panel in exactly the four rooms that can ever hold content. Mounting it on Diary would add a component guaranteed to render nothing for every household forever — which is the placeholder UI this brief asks to *remove*.

**2. Converging the Planner onto the canonical week — REFUSED, and this one is load-bearing.**
LAUNCH1 §3.7 lists *"the convergence is four of five"* — `weekly-planner-page.tsx` still resolves its week from `localStorage` and never imports `useCurrentPlannerWeek`. That is true. Converging it anyway would break the flagship room.

The canonical hook's own contract forbids the only thing that would keep the Planner working:

> *"**A consumer MUST NOT fill it in.** No `?? 1`, no 'latest week', no localStorage fallback… Render the unanchored state instead."*

And the live data says who that hits:

```
planner_weeks: 1,362 total · 252 anchored
households with planner weeks: 227 · with ANY anchored week: 42
→ 185 of 227 households (81.5%) are unanchored
```

So converging the Planner today would leave **four in five households with no week to render in the room they plan in**, with the fallback that currently makes it work explicitly prohibited. LAUNCH1 pairs this item with *"build the week-declaration path"*, and records that path as *"an extension point, not built"* — no route, no UI, no mutation. **That is new capability work, which this brief forbids.** The localStorage read is not the defect; it is the only thing holding the room up until the declaration path exists.

**3. The Nutrition Enhancement door — DEFERRED, deliberately, to its own change.**
HOUSE_ACT2 named it *"the strongest remaining door"* and declined it because both enrichment builders take a **gateway query result**, so a route would risk *"duplicating gateway composition logic — the precise thing the mission forbids."* That reasoning still holds and PROD4 did not overturn it. What PROD4 did instead was remove the defect sitting underneath it (§3.2): **building the door before fixing the starvation would have produced a door onto an empty room.** HOUSE_ACT2 asked for exactly this check first, and it was right to.

---

## 5. Definition of Done

The brief lists ten items. Marked honestly.

| # | Brief item | Status |
|---|---|---|
| 1 | Finish Home and Arrival experience | ❌ **Not done.** Home received one link repoint. Arrival is nine DEV-only prototypes (LAUNCH1 §3.2) whose shipping is a design decision, not a completion task — see §8. |
| 2 | Complete Planner UX and interactions | ❌ **Not done, and refused with evidence** (§4.2). Blocked on the week-declaration path, which is new capability work. |
| 3 | Complete Pantry experience | ❌ **Not done.** LAUNCH1 §3.10's pantry defects are schema-level (no on-hand quantity, no expiry) = new capability. |
| 4 | Complete Diary experience | ❌ **Not done.** The one item PROD4 could have added was refused as permanently-empty UI (§4.1). |
| 5 | Complete Household Nutrition presentation | ⚠️ **Partial.** The room's label/path now agree (§3.3) and the structural blocker on nutrition enrichment is removed (§3.2). The door itself remains HOUSE_ACT2's deferred work. |
| 6 | Complete Companion UX | ❌ **Not done.** No Companion UX change was made; HOUSE_ACT1's refusal to give it a room stands. |
| 7 | Remove remaining placeholder or incomplete UI | ⚠️ **Partial, and mostly not mine.** PROD2 removed the "Coming soon" tabs and the fabricated partners; HOUSE_ACT3 (concurrent) is removing the empty "Simply Better Choices" shell. PROD4 removed none — it found none that survived verification. |
| 8 | Connect existing intelligence into the experience | ✅ **Yes, structurally** — two enrichment sources that could never reach a household now can (§3.2). |
| 9 | Improve consistency, responsiveness and accessibility | ✅ **Accessibility: yes** — 15 unnamed controls fixed, 0 remaining, with a regression guard. **Consistency: partial** — one label/path mismatch resolved. **Responsiveness: no change** (PX1-W2 already shipped it; nothing was found to fix). |
| 10 | Complete production-ready UX polish | ❌ **Not done, and not attempted.** HOUSE_ACT1 excluded *"any typography, spacing, colour, motion or animation change"* and concluded *"the gap in THA is not polish"*; PROD4 found no evidence to contradict that. |

**Three of ten done or partial; seven not done.** Stated plainly rather than rounded up, because a Definition of Done that rounds up is the `HHP2` failure this repository has already recorded: *"'Complete' stops anyone looking."*

---

## 6. Data Impact

**None.** No schema change, no migration, no write path, no new query, no cache-key change. `shared/schema.ts` and `server/migrations/**` are byte-untouched. No row was created, updated or deleted.

Two read-only measurements were taken for evidence: the capability registry's declared enrichment counts, and `planner_weeks` anchor coverage. Both are `SELECT`s.

**One user-visible path changed without changing data:** `/plant-diversity` now redirects to `/nutrition`. No stored URL is invalidated.

---

## 7. Trust Check

| Question | Answer |
|---|---|
| Can any change cause THA to state something untrue? | No. The enrichment change lets *more* true things through and can manufacture nothing — round-robin only reorders items each source already produced. |
| Can a household lose data? | No. No write path is touched. |
| Does anything fabricate? | No. The three refusals in §4 are refusals to build UI that would have implied content THA does not have. |
| Is any household data exposed? | No. No new read, route or field. The `aria-label`s name *controls* ("Delete the plan template"), never household data. |
| Safety-critical paths? | Untouched. PROD3's gate, HARD RULE 6 and the response validator are byte-identical. Verified: `test:prod3-companion-restriction-safety` 36/36 still green. |
| Could the a11y warning leak to production? | No — `import.meta.env.DEV` guarded, and **verified absent from the shipped bundle**. |

---

## 8. Verification

| Check | Result |
|---|---|
| Icon-button accessible-name audit | **74 scanned · 0 without a name** (was 15) |
| `npx tsc --noEmit` | **94 errors — unchanged**, none in any touched file |
| `npm run adoption:check` | **82 passed · 0 notices · 0 failed** |
| `NODE_ENV=production npm run build` | **exit 0** |
| Test suites | **15 run, 15 pass, 0 failures** — incl. `prod3-companion-restriction-safety`, `intelligence-companion-enrichment`, `nutrition-enrichment`, `intelligence-conversation-gateway`, `intelligence-native-discovery`, `home2-home-primary-action`, `time3-p8-t5-convergence` |
| Shipped bundle | `/nutrition` route **present** · accessible names **present** · a11y dev warning **absent** (correctly stripped) |
| Enrichment starvation | Demonstrated **0 → 2** nutrition items against the live registry counts |

### 8.1 The gap that matters most: **no browser verification was possible**

Playwright is installed and its Chromium **cannot launch in this environment** (`libglib-2.0.so.0: cannot open shared object file`), as recorded in PROD2 §7.5.

**For a programme whose brief is to complete a user-facing experience, this is a serious limitation and it should not be glossed.** Nothing in §3 has been *seen*. The build proves the code compiles and ships; the bundle greps prove the strings and route are present; the audit proves no icon button lacks a name. **None of that proves the Nutrition room looks right at `/nutrition`, that the redirect lands cleanly, or that the round-robin enrichment reads well in the Companion panel.**

This is the third consecutive session to report the same gap. HOUSE_ACT1 and HOUSE_ACT2 both closed with *"USER ACCEPTANCE EVIDENCE: None captured"* for the same reason. **Every visual claim made by the last four sessions in this area is unproven in a browser**, and that is now the single largest verification debt in the house.

---

## 9. User Acceptance Evidence

The criterion, from the household's side:

> *Can someone using a screen reader operate this house, and does the intelligence THA has actually reach the person it was built for?*

| Claim | Evidence | Strength |
|---|---|---|
| No icon-only control is unnamed | JSX-aware audit: 74 scanned, **0 unnamed** | **Strong** — mechanical, repeatable |
| A future unnamed icon button is caught | `warnIfUnnamedIconButton` wired into `ui/button.tsx`; verified stripped from production | **Strong** |
| Nutrition enrichment can reach a household | Live registry: 4 static items vs MAX 3 → merge demonstrated **0 → 2** | **Strong** for the mechanism |
| …and does so in a real turn | — | **Not evidenced.** No live turn was driven end-to-end |
| The Nutrition room is reachable and consistent | `/nutrition` in the shipped bundle; no stale nav reference | **Moderate** — presence, not appearance |
| Nothing regressed | 15 suites green, tsc unchanged, adoption 82/0, build exit 0 | **Strong** |

**Honest total: the mechanical claims are well evidenced; every visual claim is not evidenced at all.** No screenshots, no recorded session, and §10's steps have not been executed.

---

## 10. Manual Verification

**Setup.** `npm run dev`, sign in.

1. **The renamed room.** Open **Nutrition** in the bottom nav → expect `/nutrition`, with Foods and Nutrients tabs. Then visit `/plant-diversity` directly → expect a redirect to `/nutrition`, not a 404.
2. **The room's realm styling.** Confirm the Nutrition nav item still shows its green realm colour in active, inactive and mobile states — the styling is keyed by path and the key moved with it.
3. **The mobile workspace.** On a narrow viewport, tap Nutrition again → the workspace drawer must open (it listens on the room's own href).
4. **Screen reader.** With VoiceOver/NVDA, tab to the plan-template delete button and the share-link copy button → each must announce a real name, not "button".
5. **The dev guard.** In `npm run dev` with DevTools open, render any `size="icon"` Button without an `aria-label` → expect a `[a11y]` console warning. In a production build → expect silence.
6. **The enrichment.** Ask the Companion a nutrition question on a household with a diet pattern → expect at most 3 enrichment items, and **not all three from the same source**.
7. **Automated equivalents:** `npm run adoption:check` → 0 failed; `npx tsc --noEmit` → 94; `npm run test:prod3-companion-restriction-safety` → 36/36.

---

## 11. Scope Lock

**In scope, delivered:** accessible names for the 15 unnamed icon controls plus the regression guard; the enrichment starvation fix; the Nutrition label/path convergence.

**Refused with evidence (§4):** household learning on Home/Diary (no such domain exists); the Planner week convergence (81.5% of households would lose their week); the Nutrition Enhancement door (HOUSE_ACT2's deferral upheld).

**Out of scope, nothing attempted:** new architecture; new AI capability; Community, Partner or commercial functionality; Arrival's nine DEV-only prototypes; Pantry's schema-level gaps; typography, spacing, colour, motion or animation; the `ui/overlay.tsx` 1-vs-14 migration (HOUSE_ACT1 #6 — a real defect, but a 14-call-site refactor is its own change).

**Not touched, because they belong to a concurrent session:** `meal-detail-page.tsx` and `components/meal-detail/SimplyBetterChoicesPanel.tsx` appear modified in the working tree. They are **HOUSE_ACT3**'s in-flight work, they are excluded from §3's file list, and PROD4 neither authored nor reviewed them.

---

## 12. Rollback Plan

| Step | Command |
|---|---|
| Inspect | `git show --stat rollback/PROD4-household-experience-completion-20260718` |
| Restore committed state | `git reset --hard rollback/PROD4-household-experience-completion-20260718` |
| Restore the pre-PROD4 tree | `git stash apply 69d886dc8b86e17e4cfe242c187ab0ca4f344c28` |
| Revert only the route rename | `git checkout 69d886dc -- client/src/App.tsx client/src/components/nav-bar.tsx client/src/pages/plant-diversity-page.tsx client/src/pages/weekly-planner-page.tsx client/src/pages/home-experience-page.tsx` |
| Revert only the enrichment fix | `git checkout 69d886dc -- server/intelligence/conversation/conversation-gateway.ts` |

**What the tag does not protect** (`ROLLBACK_PROTECTION_PROTOCOL` §3): the tree was dirty at session start — **8 modified tracked files and 35 untracked**. The tag covers committed state only; the snapshot (`git stash create`, non-destructive) covers the 8 tracked modifications and **none of the 35 untracked**, which belong to concurrent sessions.

Every change is presentation-layer or routing. **No data migration to unwind, no schema change to reverse.** The route rename is additive plus a redirect, so a rollback cannot orphan a URL.

---

## 13. Remaining Recommendations — NOT implemented

1. **Get a browser into the verification loop.** This is now the top item in this area, above any feature. Four consecutive sessions have shipped user-facing changes with zero visual verification because Chromium cannot launch here (`libglib-2.0.so.0`). Installing the system libraries, or running the existing 15 Playwright capture scripts in an environment that has them, would convert a large body of *unproven* UX work into *evidenced* UX work. **Nothing else in this list is worth as much.**
2. **Build the planner week-declaration path** (LAUNCH1 §5 #16, TIME1 §6.2). Until it exists, the Planner's `localStorage` week is load-bearing and must not be "converged" — §4.2. This is the single change that unblocks the last of TIME3's five convergences.
3. **The Nutrition Enhancement door** (HOUSE_ACT2 priority 1). Its structural blocker is now removed (§3.2); the composition seam `composeHouseholdNutritionEnrichment(food, household)` is pure and ready. It needs its own change, as HOUSE_ACT2 said.
4. **`ui/overlay.tsx`: 1 importer against 14 rivals** (HOUSE_ACT1 #6) — UIA §17's named failure shape, and the same one `PageHeader.tsx` had before PX1-W4.7 retired it. Adopt or retire.
5. **Beware the adoption floors.** HOUSE_ACT1 recorded that **five owners sit exactly at their floor** (density ladder 4, greeting 4, form field 2, accessible name 2, overlay 1) — *"losing a single consumer fails CI."* Note that PROD4 moved accessible-name enforcement from 2 consumers to 4, so that particular fragility is now reduced.
6. **Still open from LAUNCH1, untouched here:** `households.time_zone` NULL for 95.7% with a PATCH that has zero client callers; `eaterIds` accepted by the shopping API and never sent; the `takeaway_avoided` £10 savings claim; 827 authored `dark:` utilities with nothing that sets the `dark` class; the four remaining raw-`url()` orchard bypasses.
7. **Carried, and now three sessions old: the 94 `server/tests/*.ts` type errors and the unrunnable `npm test`** (~3.7 h vs a 45-minute CI timeout). Both HOUSE_ACT reports rank this first; PROD2 and PROD3 both closed on it. It has not moved.

---

## 14. Provenance

- Rollback: `rollback/PROD4-household-experience-completion-20260718` → `b6cc6aaa`; snapshot `stash@{0}` → `69d886dc`
- Read first: `docs/architecture/README.md` (the mandatory Bootstrap), `LAUNCH1_THA_LAUNCH_READINESS_AUDIT.md`, `PROD2_PRODUCT_COMPLETION_PROGRAMME.md`, `PROD3_TRUST_AND_SAFETY_COMPLETION.md`, plus `HOUSE_ACT1_HOUSEHOLD_EXPERIENCE_ACTIVATION.md` and `HOUSE_ACT2_INTELLIGENCE_DOORS.md` (mandatory for de-duplication — both landed after LAUNCH1 was written)
- Owners adopted (created by others): `client/src/lib/a11y-dev-warnings.ts` (PX1-W4.1), `NAV_ITEMS` in `client/src/components/nav-bar.tsx` (UX1)
- Constraints honoured: HOUSE_ACT1's refusals (Partners, Support, Community, Companion-has-no-room) and its four retracted false positives; HOUSE_ACT2's five evidence-backed declines
- Session record: `.engineering/session/runs/PROD4_Household_Experience_Completion.md`
