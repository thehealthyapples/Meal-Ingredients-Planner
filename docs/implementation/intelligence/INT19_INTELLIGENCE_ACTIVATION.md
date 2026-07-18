# INT19 — Intelligence Activation — Implementation

**Status:** Complete — awaiting review
**Date:** 2026-07-17
**Branch:** `int1-intelligence-platform`
**Type:** Activation only. **No new engine, no new capability, no schema change, no new behaviour.**
**Source investigation:** `docs/investigations/intelligence/FI18_HOUSEHOLD_FOOD_INTELLIGENCE_EXPERIENCES.md` (QW1, QW2)
**Predecessor:** `docs/implementation/intelligence/P0_FOOD_INTELLIGENCE_RECOVERY.md` (fixed the defects that blocked activation)
**Governing architecture:** `THA_DECISION_ENGINE_ARCHITECTURE.md` (DEC1 §7 — the one enrolment door; §3 — the engine's boundaries) · `THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md` (§6 budget, §9 stop rules) · `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (Rule FI1, E1) · `THA_EXPERIENCE_ARCHITECTURE.md` / `THA_UI_ARCHITECTURE.md` (user-facing gates) · `THA_EXPERIENCE_BLUEPRINT.md` (Home as the arrival room)

---

## ROLLBACK PROTECTION

**Rollback identifier: `rollback/INT19-intelligence-activation-20260717` → commit `10573dd20baa9497975c4ed05837b75162305410`**

```bash
git diff rollback/INT19-intelligence-activation-20260717 -- client/   # inspect this session's edits
git checkout rollback/INT19-intelligence-activation-20260717 -- client/src/pages/home-experience-page.tsx client/src/components/WorkspaceAnalyserSheet.tsx   # restore
```

**Working tree at start was intentionally dirty — NOT THIS SESSION'S.** Uncommitted work from sibling sessions (NORTH3, NORTH4, CONV1 P10, P0 recovery) was present and was **not touched, not committed, not reverted**. The tag protects committed state only. Every "pre-existing" claim below was verified against a **clean `git worktree` at this tag**, never by mutating the dirty tree.

---

## THE MISSION, AND THE ONE DECISION THAT SHAPED IT

The mission: **activate the Food Intelligence that already exists** — mount it, connect it, enable it through the canonical path — while adding **no engine, capability, schema, or behaviour.** That mandate is the scope filter over FI18's eight surfaces, and it excludes more than it includes. Stated plainly:

> **INT19 mounts two already-built components through two doors the architecture already opened. It writes no producer, verb, capability, schema, or notice category.**

Everything in FI18 that would *add* something — a second `OPPORTUNITY_SOURCES` producer, a resolver matcher that must invent a slug, an extended evidence context, a converged notice channel — is a separately-gated workstream and is listed under **Remaining Activation Opportunities**, not done here. That is not timidity; it is the mandate. "Activate what exists" and "build the next producer" are different instructions, and only the first was given.

---

## ACTIVATED INTELLIGENCE

### QW1 — Home gains the ONE ambient surface (mission §1, §5)

**File:** `client/src/pages/home-experience-page.tsx`

`<AmbientIntelligence surfaceKey="home" title="Things you could do" />` is mounted at the foot of the arrival room, below the doors and above the quiet dashboard link. It is a **mount, not a channel**:

- It composes the **same `useFoodOpportunities` bundle Home already fetched** (`:337`) — until now read *only* to feed the door's safety tier (`:481`) and rendered nowhere. TanStack dedupes on the one canonical query key, so there is **no new request, no new endpoint, no new ownership**.
- It re-ranks nothing: the Decision Engine already ordered, budgeted and suppressed the bundle, and the client renders that order verbatim (DEC1 §3 — the boundary `AmbientIntelligence`'s own header names).
- Home is the **one sanctioned aggregate view** alongside the dashboard, so no `domains` filter — every domain's opportunities, in the engine's order.

**Why below the doors.** Home's job is *arrive → orient → one door*, and the counter's primary action must never fall behind the bottom nav — the exact collision NORTH2/NORTH3 fought and fixed. A collapsed row at the foot of the room changes no layout above it. For the **192/195 unanchored households** (CONV1 P8) the surface renders **nothing at all** (`isPending || items.length === 0 → null`), so the quiet day stays quiet. A `critical` — the shopping restriction conflict, THA's one safety signal — **auto-opens** the surface itself.

**On the pairing with the Companion card.** Home already renders Companion notices (`useCompanionNotices` → `/api/intelligence/companion/notices`), which gather the **same `opportunity-delivery` producer**, silence-ruled to ≤2 and phrased by the Behaviour Engine. So Home was never silent about opportunities — it spoke them only as phrased sentences, never as the resolvable, evidence-carrying card that feeds Evidence back into Household Learning on accept/dismiss. This mount adds exactly that surface, and it mirrors the pairing **the dashboard already ships** (`HomeIntelligenceCompanion` beside `AmbientIntelligence`, `dashboard.tsx:329-340`): the Companion card speaks the phrased notice; the ambient surface carries the resolvable card with its evidence. This is a **presentation** pairing the platform already sanctioned, not a second Notice Engine.

### QW2 — the Shopping workspace regains its per-item food story (mission §3)

**File:** `client/src/components/WorkspaceAnalyserSheet.tsx`

`<ShoppingIntelligencePanel name={item.canonicalName ?? item.productName} />` is mounted at the top of the per-item analyser sheet's scrollable content — the food story before the score's mechanics, exactly as WX6 intends and as the legacy `/basket` `ProductInsightDialog` still does (`shopping-list-page.tsx:895`). The workspace is the **live** shopping route; its per-item surface **lost this panel in the legacy→workspace move**, and this restores it.

It is a mount of an already-built component: it reads `/api/shopping/intelligence`, which resolves the item to a canonical food and delegates to the existing Food Intelligence assemblers (seasonal, meal support, connected foods, the one "simply better" opportunity). It **owns nothing**, hides entirely when the item is not a recognised food or nothing is validated (its own trust gate), and the Analyser's score and alternatives below it are its own — never duplicated here.

---

## FILES CHANGED

| File | Change | Lines |
|---|---|---|
| `client/src/pages/home-experience-page.tsx` | Import `AmbientIntelligence`; mount `<AmbientIntelligence surfaceKey="home">` at the foot of the room | +1 import, +~20 (comment + mount) |
| `client/src/components/WorkspaceAnalyserSheet.tsx` | Import `ShoppingIntelligencePanel`; mount it at the top of the per-item sheet | +1 import, +~15 (comment + mount) |
| `docs/implementation/intelligence/INT19_INTELLIGENCE_ACTIVATION.md` | This report | new |
| `.engineering/session/runs/INT19_Intelligence_Activation.md` | Session run file | new |
| `.engineering/session/CURRENT.md` | One dashboard row | +1 row |

**No server file, no schema, no migration, no capability registry, no `OPPORTUNITY_SOURCES`, no resolver, no notice engine, no route was touched.**

---

## USER-VISIBLE IMPROVEMENTS

1. **On Home**, a household with a live Food Opportunity now sees a calm, collapsed "Things you could do" surface at the foot of the room — and can **act on it** (accept / dismiss / "Why this?"), which the phrased Companion reminder never allowed. A restriction-conflict **critical** auto-opens it. For almost every household today (unanchored) it shows nothing, so the arrival stays calm.
2. **On the Shopping workspace**, opening any item's analyser now shows the food's story — in season, the meals it supports in your Cookbook, foods it's often enjoyed with, and the one "simply better" choice — at the moment the purchasing decision is made. This intelligence existed and was reachable only on the legacy basket page.

Both improvements are **latent capability made visible**: no new intelligence was computed; two built surfaces were connected to the rooms the household actually uses.

---

## REMAINING ACTIVATION OPPORTUNITIES

In honest priority order. **None is done here; each is its own gated workstream, and the first is not engineering at all.**

1. **Extend `NUTRITION_CONTEXT` beyond 10 foods (FI18 F8) — EDITORIAL, not engineering.** `engine.ts:217` resolves evidence for **10 of 610** foods; Rule E1 ("no citation, no card") means the other 600 cannot render a Food-page or micro-learning card at all. This is the true ceiling on Food Intelligence, and no mount raises it. **Blocking owner question (unchanged from FI18): is the 10-food ceiling deliberate KMS throughput, or an accident?** The answer decides whether this domain's constraint is editorial capacity or engineering.
2. **Enrol PANTRY1's assembler as the second `OPPORTUNITY_SOURCES` producer (NTC-P3).** The `pantry-intelligence-assembler.ts` is fully built with **zero importers**. Enrolling it adds platform-wide noticing behaviour through DEC1 §7's one door — **new behaviour, out of INT19's mandate**, and FI18's own next producer.
3. **Converge the three ungoverned notice channels (NTC-P2).** `/api/home/intelligence`, `/api/planner/weeks/:id/intelligence`, and the WX7 pantry block still bypass OD1's governance; the Planner still renders two ambient channels side by side. Converging them retires the last duplicated *paths* (mission §4 in full) and is Notice-Engine work, separately gated.
4. **Give COMP1 a UI.** 712 lines of cited comparison reasoning, reachable by the Companion (`compare` routes) but with no canonical-page surface. Cookbook's natural question ("which of these two is better for us?") needs a producer, its own gated EWO.

### Deliberately NOT done, with reason (so the next reader does not re-ask)

- **QW3 — `usePublishCompanionContext` on Pantry/Shopping/Diary.** The pointer contract `CompanionSurfaceHints` has **no field** for a pantry item, a shopping item, or a diary entry (only planner week / meal / food slug / planner day+slot / opportunity id). Publishing on those pages sends empty hints. Adding pointers extends the contract = new ownership. **Cookbook's meal pointer is already published** (`meal-detail-page.tsx:102`), so the Companion is not blind there.
- **QW4 — resolver matcher for `food-intelligence:recommend`/`:explain`.** FI18's "the Domain Intelligence layer is mute" is **stale**: the resolver already routes `food-intelligence:report` (BENCH4) and `:compare` (COMP1). Emitting `recommend`/`explain` requires a benefit/nutrient **slug** the resolver would have to invent from the utterance — the fabrication the resolver's own hard boundaries (`pattern-intent-resolver.ts:36-39, 1246-1249`) forbid. Verified: nutrient/benefit questions ("what foods are high in iron?") already route to `nutrition-knowledge`, an existing owner.

---

## ARCHITECTURE COMPLIANCE

The change complies by construction — it does nothing except mount two existing components through two existing doors.

| Rule | Compliance |
|---|---|
| **No new engine / capability / schema / ownership** | ✅ Zero server, schema, registry, `OPPORTUNITY_SOURCES`, resolver, route changes. Two client mounts of built components. |
| **DEC1 §3 — engine boundaries** | ✅ `AmbientIntelligence` re-ranks/re-budgets/re-derives nothing; renders the sealed bundle verbatim. |
| **Notice Engine §6 / §9 — budget & no second channel** | ✅ `MAX_NOTICES_PER_MOMENT` untouched; no cap raised. The Home pairing mirrors the dashboard's sanctioned composition (phrased Companion + resolvable ambient), not a new channel. The three ungoverned channels are **named for convergence**, not extended. |
| **Rule FI1 — enrichment, not ownership** | ✅ Both panels own nothing; every byte is a projection of an existing owner's output. |
| **Rule E1 — no citation, no card** | ✅ Both surfaces hide on honest absence; the 600-food evidence ceiling is **named** (Remaining §1), not worked around. |
| **Experience Architecture — Home is the calm arrival room** | ✅ Collapsed-by-default, renders nothing on the quiet (default) day, placed so it never displaces the one door; a safety critical auto-opens. |
| **Core Principle 6 — honest gaps** | ✅ No placeholder, no padding, no fabricated "all clear". |

**Product Registry / Adoption impact:** none. INT19 authors **no** client building block (component, hook, token, utility) — it consumes existing owners (`AmbientIntelligence`, `ShoppingIntelligencePanel`), which are already recorded. No registry entry is created, changed, or retired.

---

## VERIFICATION

| Gate | Result | Attribution |
|---|---|---|
| **`typecheck:ci`** | **Clean HEAD + my two edits = 0 errors** (proven on a fresh `git worktree` at the tag). Neither edited file appears in any error. | The dirty main tree's 27 are entirely sibling-session debt (P0/NORTH/CONV1 uncommitted work); INT19's delta is **0**. |
| **`adoption:check`** | 2 failures — `button-primitive` ceiling (539/538) and the `HouseholdNutritionPanel` orphan | **Both present at the committed tag with and without my edits.** My edits add **0** raw `<button>` (home: 0; the sheet's 15 are pre-existing at HEAD) and touch no orphan. Exactly the 2 failures P0 recovery documented. |
| **`verify:publication`** | `🟢 Companion / Notice [platform]`; 5 reds across 4 pre-existing domains (Meals, Meal Templates, Pantry, Nutrition Uplift) | Client mounts cannot affect server publication contracts; the Companion/Notice domain this work presents stays **green**. |
| **`repo-structure-verify`** | 3 FAILs (root + `docs/implementation/` + `docs/investigations/` loose files) | Sibling untracked reports (NORTH3/NORTH4 at `docs/implementation/` root). This report is filed under the `intelligence/` workstream — compliant, like P0's. |

---

## DEFINITION OF DONE

- [x] Architecture bootstrap read before implementation (`docs/architecture/README.md`)
- [x] `git status` confirmed; rollback tag created and resolved
- [x] `INT19_INTELLIGENCE_ACTIVATION.md` created (this file), plus session run file
- [x] **QW1** — `<AmbientIntelligence>` mounted on Home; data already fetched, query key dedupes; renders nothing on the quiet day; critical auto-opens
- [x] **QW2** — `ShoppingIntelligencePanel` remounted on the workspace's per-item analyser sheet
- [x] No new engine, capability, schema, migration, `OPPORTUNITY_SOURCES` entry, resolver matcher, notice category, or route
- [x] Every scope exclusion (QW3, QW4, PANTRY1, NUTRITION_CONTEXT, NTC-P2, COMP1) named with a reason, so none is silently dropped or re-asked
- [x] Gates run; every failure attributed to pre-existing sibling debt on a clean worktree at the tag; INT19's own delta is 0 typecheck, 0 adoption, 0 publication
- [x] Companion/Notice publication domain stays 🟢
- [ ] **Owner review** — and the one blocking question INT19 inherits from FI18: **is the 10-food `NUTRITION_CONTEXT` ceiling deliberate?** It gates whether the next-highest activation is editorial or engineering.

---

*Activation only. Two mounts of existing components; no intelligence was created, and no ownership moved.*
*Rollback: `rollback/INT19-intelligence-activation-20260717` → `10573dd2`.*
