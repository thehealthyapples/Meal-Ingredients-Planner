# THA UI Canonical Experience Ownership

**Document ID:** `UIOWN1`
**Date:** 2026-07-20
**Status:** GOVERNING — law in force · governance only, nothing built or changed
**Rollback identifier:** `rollback/UIOWN1-ui-canonical-experience-ownership-20260720` → `5c9ddb5d`
**Author of record:** Colin Clapson (owner) · drafted by Claude under the Engineering Workflow

---

# Purpose

**UI renders published state. It never owns business state.**

Every visible element in The Healthy Apples exists because some canonical owner published a fact, and the interface drew it. The owner is a store, module, or engine registered in the governing architecture — the Source of Truth Register's 38 domains (`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`), the Intelligence engines, and the Experience canon. The interface is, in every case, a **consumer**: it may read, assemble, and present; it may never compute, cache-as-truth, default, round, or invent a fact (**GEA17** — *the presentation layer owns no fact*, cited).

This document exists to make that checkable **per experience**. The canon already owns the two ends of the chain: the Register owns *which store owns which fact*, and `GOVERNING_EXPERIENCE_ARCHITECTURE.md` § 17 owns *which document owns which experience question*. What no document held was the middle: **for each user-facing experience, the assembled statement of exactly which owners it renders from, what it must never own, and who consumes it.** Before this document, that mapping was re-derived from the Register on every UI implementation — and a mapping that is re-derived is eventually re-derived differently (`GOVERNING_EXPERIENCE_ARCHITECTURE.md` on unrecorded reasoning, cited).

### Position in governance

- A **Layer 2 Experience Architecture document** (`GOVERNING_EXPERIENCE_ARCHITECTURE.md` § 2.1). Subordinate to `THA_EXPERIENCE_ARCHITECTURE.md` (behaviour prevails), to `ARCHITECTURE_PRINCIPLES.md` and the Source of Truth Register on every question of *fact ownership*, and to each Intelligence engine's own architecture on its boundary. On any question of rule owned elsewhere, **the owner prevails and this document is corrected** — the two-axis position of the Brand Constitution and the Experience Constitution (GEA § 2.3, cited).
- **Canonical owner of exactly two things:** (1) the **per-experience ownership map** (§ Canonical Experience Owners) — the assembled experience→owner binding, every cell of which cites the owner it binds; (2) the **UI Composition Rules** as an assembled statement (each rule cited to its owner where one exists).
- **Restate-no-rule** (`ARCHITECTURE_PRINCIPLES.md` Principle 2): every statement of already-owned law here is a citation. Where this document and an owner disagree, this document is wrong.
- **This document names owners; it never creates them.** Where the canon has no owner for something (noted honestly below), this document records the absence and the path to an owner — it does not fill the gap by fiat.
- **Facts are one axis; feeling is the other.** This document binds every visible element to the owner of its *fact*. The authority over its *feeling* — final aesthetic and emotional approval, exercised through the Experience canon's gates — is the **Home Owner** (`HOME_OWNER_ARCHITECTURE.md`, `HOMEOWNER1`). Neither touches the other's axis: the Home Owner cannot rebind a fact, and no fact-owner's publication makes a surface belong in the house. A surface is done when both are satisfied. *(Cross-reference added under `HOMEOWNER1`, 2026-07-20.)*

---

# Governing Principles

Each principle is stated once with its owner cited; this section creates none of them.

1. **Every visible UI element has exactly one owner.** The fact it renders has one owner (`ARCHITECTURE_PRINCIPLES.md` Principle 2); the visual concern it uses has one owner (`THA_UI_ARCHITECTURE.md` § 17); the experience concern it belongs to has one owner (**GEA18**). An element whose owner cannot be named is a defect, not a curiosity.
2. **UI is a consumer, never the owner of business state.** A room may not compute, cache, default, or invent a fact; where the owner has nothing, it shows honest absence (**GEA17**; `ARCHITECTURE_PRINCIPLES.md` Principle 6). Client-side readers are *presentation only, never a security boundary* (Register, Domain 26's `use-entitlements.ts` clause, cited); `server/lib/access.ts` is the only authorisation authority (TIP2 § 5.2; CPA1 § 3; COMP_AUTH1, cited).
3. **Owners publish; experiences compose.** Knowledge owners publish projections verified equal to the owner (`CANONICAL_PUBLICATION_ARCHITECTURE.md`, cited); runtime consumes **one assembled model per entity** and never re-resolves identity (`ARCHITECTURE_PRINCIPLES.md` Principle 4, cited). An experience assembles owners' outputs; it adds no fact of its own.
4. **The Companion enriches experiences but never owns business data.** It may change *how something is said, or which already-true fact is surfaced and when — never what is true, what is permitted, or what requires confirmation* (`THA_COMPANION_PLATFORM_ARCHITECTURE.md` § 1, cited). Its conversation store holds turns and references, never business rows (TIP3 § 4.1, cited).
5. **Extend existing architecture rather than duplicate logic.** Capabilities bind to existing owners and reuse business services; a second copy of planner or nutrition logic anywhere means the architecture has failed (TIP2 § 1 Findings 2 and 5, cited).
6. **Cross-domain information always comes from the authoritative owner.** A surface reads another domain's fact through that owner's read path — never by re-deriving it, importing a static copy, or reading a rival store (Register Rules 3 and 6; Principle 7's bridge test, cited). Context shapes relevance; it never raises reach (COMP_AUTH1 § 10 law 3, cited).
7. **No duplicate ownership.** One owner per capability, per fact, per visual concern, per experience concern (TIP2 § 5.3; Principle 2; UIA § 17; GEA18 — all cited). A successor retires its predecessor in the same change (Principle 8; UIA § 17, cited).
8. **No duplicate state.** No parallel stores (Register Rule 3); no derived fact persisted where a read-time derivation serves (`THA_HOUSEHOLD_TIME_ARCHITECTURE.md` HT3 pattern, cited); no permanent synchronisation bridge between two owners (Principle 7, cited).

---

# Canonical Experience Owners

For each experience: **Responsibilities** (what the experience is for) · **Owns** (the facts/decisions genuinely owned, with the registered owner named) · **Does Not Own** (the boundary, with the true owner named) · **Primary Consumers**. Domain numbers are the Source of Truth Register's.

## 1. Living Home

- **Responsibilities:** the one constant house every experience renders inside — shell, geography, rooms-as-viewpoints, and the lawful ways the home evolves (`LIVING_HOME_EXPERIENCE_ARCHITECTURE.md`, `LIVINGHOME1`).
- **Owns:** the Living Home Principle and the Traditions & Celebrations domain *as declared law* (LIVINGHOME1 § 2.2); the Environmental Dressing layer's law (`LIVINGHOME2`). The shell itself is implementation under the Blueprint's place ownership (Blueprint § 5.1; EXP1) — **owned as experience definition, not as business state: the Living Home owns no business fact at all.**
- **Does Not Own:** the season answer (Domain 11, `shared/seasonal/season-rule.ts`); the household's clock (Household Time module + Domain 16's `timeZone`); any word the Companion says (Behaviour Engine); any datum shown within it (each room's owners below).
- **Primary Consumers:** every room; the Companion's fixed chair; arrival.

## 2. Household

- **Responsibilities:** the family record — who lives here, who eats here, and the household-grained facts everything else depends on.
- **Owns:** Domain 16 — `households`, `household_members`, `household_eaters` (write funnels per Register); per-person diet patterns and hard restrictions (Domain 7, on `household_eaters` — converged 2026-07-16); `households.timeZone` (the home's clock — a property of the home, never the device); the future `household_traditions` owner when built (LIVINGHOME1 § 7, declared not built).
- **Does Not Own:** diet *rules* (Domain 6, `shared/dietRules.ts`) or the restriction *library* (Domain 5); membership/entitlement (Domain 26); community membership (Domain 37 — which owns no household data in return).
- **Primary Consumers:** Planner eater assignments; every safety filter; the Household room; Household Time; Companion capabilities (through their owners).

## 3. Companion

- **Responsibilities:** the one presence that understands — interpretation, coaching, and conversation, as an **orchestration and presentation layer** over the Intelligence Platform (CPA1 § 0).
- **Owns:** the conversation history — one store, turns and entity references only (TIP3 § 4.1); the presentation decisions of its engines: which true fact is surfaced and when (Notice Engine's Silence Rules — its *single canonical possession*, INT20 § 3), how it is said (Behaviour Engine + Personality Registry), how the model is grounded (INT17 — every grounding byte), and the Companion Card structural contract + closed interaction vocabulary (CPA1 § 3).
- **Does Not Own:** **any business fact** — planner rows, meals, pantry, roster, nutrition facts live with their TIP2 owners and are never copied into conversation state (TIP3 § 4.1); truth, permissions, or confirmation tiers (CPA1 § 1; `access.ts`); observations it did not receive from a registered producer (LH10; INT20 § 2.3 — it computes no metric of its own).
- **Primary Consumers:** every room (the fixed chair); the Notice channel; Home's Companion beat.

## 4. Planner

- **Responsibilities:** the family table — the week's plan as household-authored transactional state.
- **Owns:** Domain 14 — `planner_weeks`, `planner_days`, `planner_entries`, eater assignments; the week anchor `planner_weeks.weekStartDate` (written only at creation, never back-filled — HT7).
- **Does Not Own:** meal identity (Domain 12); templates (Domain 13); diet facts (Domains 5/6/7); what day it is (Household Time); a planner entry's calendar date beyond the anchor lookup (derived on read, never stored — the `approxDate` retirement, CONV1 P9).
- **Primary Consumers:** the Planner room; Home's cards (resolved from one canonical planner state — CONV1 P8); Shopping generation; Stories; Companion capabilities.

## 5. Cookbook

- **Responsibilities:** the household's living recipe book, and the platform's meal catalogue behind it.
- **Owns:** Domain 12 — meal identity (`meals`, write funnel `storage.createMeal()`); Domain 13 — meal templates; the curation vocabulary `shared/cookbook/curation.ts` (authored vs generated — COOKBOOK1's owner, retiring eight predecessors).
- **Does Not Own:** food identity (Domain 2); nutrition knowledge (Domain 1); ingredient normalisation (Domain 25); what the household planned (Domain 14) or ate (Domain 21).
- **Primary Consumers:** the Cookbook room; Planner (meal resolution); Shopping (ingredients); the Food Report adapter.

## 6. Pantry

- **Responsibilities:** what the household has in the house.
- **Owns:** Domain 30 — `user_pantry_items`, household-grained, `server/storage.ts` the only writer. Transactional: household-authored, no owner-to-projection contract (Register, cited).
- **Does Not Own:** food identity or varieties (Domain 2); seasonality (Domain 11); discovery/alternatives reasoning (Domains 8/9); freshness *knowledge* (knowledge owners) as opposed to the household's own item facts.
- **Primary Consumers:** the Pantry room; seasonal pantry surface (`GET /api/pantry/seasonal` — Domain 11 ∩ Domain 30); Shopping; future Life-register bindings (EXP3 § 8.1's double key).

## 7. Shopping

- **Responsibilities:** the list by the door — preparing to leave the house.
- **Owns:** Domain 15 — `shopping_list`, `shopping_list_extras`, `shopping_fulfilment_memory`.
- **Does Not Own:** product analysis (Domain 19); partners/supermarkets (their capability card); restriction checking (Domains 5/7 through their owners); when to *remind* anyone of anything (the Notice Engine's decision, alone).
- **Primary Consumers:** the Shopping room; the Notice Engine's `shopping-opportunity` producers; Planner round-trips.

## 8. Nutrition

- **Responsibilities:** the noticeboard by the garden view — nutrition knowledge rendered without judgement.
- **Owns:** nothing as a room. The knowledge it renders is Domain 1 (WS0 Knowledge Registry — nutrients, benefits, "why it matters", with Principle 6's sourcing law); preparation knowledge is Domain 28; the plant-diversity *rule* is `plantDiversityGroup()` + `diversity_group` (Domains 4/22).
- **Does Not Own:** any verdict on the household — no target, score, streak, or grade exists to own (**GEA13**; PRESENCE1 removed the room's number and this document records the space as *closed, not vacant*); the diary's facts (Domain 21); uplift rules (Domain 17).
- **Primary Consumers:** the Nutrition room; Food Report (Domain 23's adapter); Companion capabilities.

## 9. Canonical Food Platform

- **Responsibilities:** what a food *is* — the identity spine every food-shaped surface resolves against.
- **Owns:** Domain 2 — canonical food identity (`shared/canonical/foods.ts` → published projection `canonical_food` etc., verified equal — PUB1); Domain 3 — the food graph; Domain 23 — the Food Report assembler (an assembler over owners, no query-time duplication); Domains 24/25 — ingredient catalogue and normalisation funnel.
- **Does Not Own:** nutrition knowledge content (Domain 1); dietary rules (Domain 6); what any household holds, plans, or eats (Domains 30/14/21).
- **Primary Consumers:** every food-rendering surface, via one assembled model per entity (Principle 4) — never by re-resolving identity locally.

## 10. Diary

- **Responsibilities:** the window seat — the household's own record of days.
- **Owns:** Domain 21 — `food_diary_days`, `food_diary_entries`, `food_diary_metrics` (including the household's own 1–5 how-you-felt values — theirs, unbranded, ungraded).
- **Does Not Own:** the day boundary (Household Time — the diary day resolves through the household's clock, CONV1 P6); interpretation of what the record means (the Companion's, GEA22); any countdown/occasion store (the `localStorage` countdown widget is a named predecessor for the Traditions domain to converge or retire — LIVINGHOME1 § 8.5).
- **Primary Consumers:** the Diary room; Stories; Evidence & Learning (Domain 31, through its own store).

## 11. Community

- **Responsibilities:** the room that looks outward — households as neighbours, as presences.
- **Owns:** Domain 37 — `communities`, `community_members`, `community_invitations`, owned solely by `server/lib/community.ts`; membership at **household grain, never user** (CM1); membership is not a read grant — the port returns `{householdId, role}` and nothing else (CM2); one owner of "who may join" (CM3).
- **Does Not Own:** any household's data (Domain 16 stays behind its own door — the SEC1-shaped leak is foreclosed by the isolation test, cited); referral/invitation-to-THA facts (Domain 38); traditions sharing (refused — LIVINGHOME1 § 11's not-phased list inherits the recorded disagreement).
- **Primary Consumers:** the Orchard room (`/orchard` — Domain 37's only client consumer; Overview/Neighbourhoods/Village/High Street are page state, not routes); the Companion's read-only `community` room.

## 12. Profile

- **Responsibilities:** the person's own record and settings, inside the family record.
- **Owns:** Domain 27 — `user_preferences` (non-dietary display/settings only); user identity and live tier sit on `users` under Domain 26's projection rules.
- **Does Not Own:** diet preferences or restrictions (**Domain 7, on `household_eaters`** — the converged owner; `user_preferences.dietTypes` was a bridge, deleted); entitlement resolution (Domain 26's `entitlement-service.ts` — a household maximum, never a precedence chain); household facts it displays (Domain 16).
- **Primary Consumers:** the Household/Profile room; every surface reading display preferences.

## 13. Administration

- **Responsibilities:** the study off the hall — operator visibility and control, at E0, with no Living Detail.
- **Owns:** **nothing.** Administration is deliberately a pure consumer: no numbered Register domain exists for it, and this document records that as correct, not missing. Authorisation is `server/lib/access.ts` alone (`assertAdmin`); the audit trail is `admin_audit_log` (TIP2 § 5.2); operator telemetry is Domain 32 (OBS1 — read-only views, never an input to behaviour); registry visibility tiers are Domain 29's (classify, never authorise).
- **Does Not Own:** any household or business fact; any write path that bypasses a domain's write funnel; impersonation authority (COMP_AUTH1 — impersonation changes the effective identity, and the Companion serves the effective user).
- **Primary Consumers:** admin-gated rooms and workbenches only.

## 14. Notifications

- **Responsibilities:** everything the platform proactively says to a household, unprompted.
- **Owns:** the **Notice Engine** (INT20) owns the *decision* — what is noticed, how often, in what order, under the Silence Rules (cap, priority, de-dupe, notability, honest absence, determinism) — and that decision is its only possession (INT20 § 3). Around it, each part has its own owner, cited: the **facts** belong to their registered producers (closed seven-category taxonomy, each category with exactly one producing owner); the **phrasing** is the Behaviour Engine's; the **delivery lifecycle** is OD1's `opportunity_deliveries`; **interruption is reserved for safety** (TIP3 § 11.2).
- **Does Not Own:** any fact it notices (verbatim from producers — it computes no metric, threshold, or cluster of its own); any push channel — **none exists**: no web push, no OS push, no notifications table; notices are in-app only, and this document records that any future push channel must arrive as a delivery adapter under the same one decision-owner, never as a second notice channel (INT20 § 9).
- **Primary Consumers:** the Companion Card/panel (the one mouth); Home's Companion beat.
- **Recorded debt, inherited not created:** INT20's own architecture records that the canonical chain is currently dormant while **parallel ungoverned notice channels are live** (`GET /api/home/intelligence`, `GET /api/planner/weeks/:weekId/intelligence`, the WX7 pantry-opportunities block). This document takes no side and adds no deadline; it records that **no new consumer may bind to the ungoverned channels**, which are convergence debt owned by INT20's roadmap.

## 15. Seasonal / Environmental Dressing

- **Responsibilities:** the quiet passage of the year — as fact, as the household's seasonal life, and (declared, not built) as the home's own dressing.
- **Owns:** the **season fact** has one owner — `shared/seasonal/season-rule.ts` (Domain 11), whose input Household Time supplies and whose answer nothing else may derive (HT17); seasonal stories are Domain 11's engine; the **Environmental Dressing layer** is governed by `LIVINGHOME2` (ED1–ED12) with its future Dressing Register — **DECLARED, NOT BUILT**, and unlawful to ship until LIVINGHOME2 § 10.2's owner amendments pass review.
- **Does Not Own:** anything about any household (ED2/ED3 — dressing reads no household data and claims nothing); the house's constancy (House Register — the orchard admits no season and no dressing, Blueprint § 6.1/ED5); celebration permission (the household's, through the future traditions domain — LIVINGHOME2 § 7.2).
- **Primary Consumers:** seasonal pantry surface (Domain 11 ∩ Domain 30); Stories; the Notice Engine's `seasonal-highlight` producers; the future Dressing Register mouth.

---

# UI Composition Rules

How an experience assembles many owners without becoming one. The general law, then the four named compositions.

**The general rules (owners cited):**

1. **Compose from published state only** — the owner's projection or assembled model (Principle 4), through the owner's read path. Never a static client copy (Register Rule 6), never a local re-derivation (HT17's pattern generalised: consume answers, don't re-answer).
2. **Composition persists nothing.** A composed view holds no store, writes no derived fact, and caches nothing that can disagree with its owner (Principle 7; HT3 pattern).
3. **Composition adds no voice.** Rooms observe the way a window observes; interpretation is the Companion's alone; decisions are the household's (GEA21–GEA23; GEA8/GEA9).
4. **Composition never widens authority.** The room shapes relevance; it can never raise reach (COMP_AUTH1 § 10 law 3); what may be drawn is decided by what the server returned, and `access.ts` decided that.
5. **Absence composes honestly.** Where any input owner has nothing, the composition shows nothing for that input — no placeholder facts, no defaults presented as data (GEA17; Principle 6).

**Home** composes: the greeting (Behaviour Engine's words over Household Time's phase — words and doors, never light, HT13) · the doors (HOME2's resolver over canonical planner state — CONV1 P8) · stories (Domain 10, trust-gated) · notices (the Notice Engine's decision, capped) · the Companion beat. Home owns none of it: every Home card resolves from one canonical state, and Home holds no `localStorage`, no private week, no private season (the CONV1 P8 convergence, cited). Home is the proof-case: the most composed room in the house owns the least.

**Planner** composes: its own Domain 14 state (the one thing it owns) · meal facts resolved by primary key from Domain 12 · eaters and restrictions from Domains 16/7 (through their owners, for safety filtering by the owning services) · the week anchor through Household Time. It renders no coaching, no interpretation strip, no truncated advice (the UX3/PRESENCE1 rulings, now GEA8, cited).

**Companion** composes by construction: intent → registered capability (TIP2) → owner's business service → Context View (INT17, the only composer of grounding bytes) → model → Behaviour Engine (the only transform to words) → the Companion Card contract. Every byte traceable to an owner; nothing retained but turns and references. The Companion is the platform's *model* of lawful composition — an orchestration layer that enriches every experience precisely because it owns no business fact it could get wrong.

**Community (the Orchard)** composes: Domain 37's port returns — presences (`{householdId, role}`), never profiles · Domain 38's invitation and referral summaries through their two owners · nothing else. The room that looks outward is the room with the strictest composition diet, because its failure mode (reading Domain 16 through a Domain 37 door) is the platform's named leak shape (SEC1, foreclosed by isolation test, cited).

---

# Ownership Decision Matrix

Worked examples. Each names **exactly one canonical owner** of the element — the owner whose fact or decision the element *is* — with input owners cited where the element composes.

| Visible element | The one canonical owner | Notes (inputs, boundaries) |
|---|---|---|
| **Welcome Home message** | **Behaviour Engine** (INT21 — the words) | Phase-of-day fact from Household Time via `households.timeZone` (HT13: words and doors, never light). No room may template its own greeting (the four-copy convergence, CONV1 P6). |
| **Household celebrations** | **Future `household_traditions` owner** (LIVINGHOME1 § 7 — declared, not built) | Empty by default; never inferred (LH1). Until built, *no surface may render a celebration* — the honest state is nothing. Observed rhythms (Domain 10) are interpretation, never promoted silently (LH5). |
| **Planner cards** | **Domain 14** (`planner_entries`) | Meal facts by primary key from Domain 12; date by anchor lookup or null — never invented (the `approxDate` retirement). |
| **Plant diversity** | **`plantDiversityGroup()` + `diversity_group`** (Domains 4/22) | Rendered as fact, never as target or score — the room holds no number to measure a family against (GEA13; PRESENCE1). |
| **Shopping reminders** | **Notice Engine** (the decision) | Fact from Domain 15's producers, verbatim; phrasing the Behaviour Engine's; silence first-class. No room banner, no second channel. |
| **Companion observations** | **The producing engine** (Domain 10 Stories / Domain 31 Evidence & Learning) | The Companion speaks them (sole interpreter, GEA22) and may never invent one (LH10; INT20 § 2.3). A single notice never becomes a preference (EL1's boundary). |
| **Orchard dressing** | **Nobody — refused.** Blueprint § 6.1 (one orchard, one season) with LIVINGHOME2 ED5 | The orchard admits no dressing, no season, no variant, ever. The one orchard asset's component owner is `orchard-backdrop.tsx` (Adoption Register row 40). |
| **Seasonal decorations** | **Future Dressing Register** under `LIVINGHOME2` (ED1–ED12) | Declared, not built; unlawful until LIVINGHOME2 § 10.2's amendments pass. Season key consumed from Domain 11 (HT17); never personalised, never a claim. |
| **Referral invitations** | **Domain 38** — `server/lib/household-invitation.ts` (the link) with `server/lib/referral.ts` (the attribution) | Two facts, two owners, by design; addressed to an email, never a household id (HI1); attribution on the registration path only; no amount or price (commercial boundary — BUS2A). |
| **Community activity** | **Domain 37** (`server/lib/community.ts`) | Presences, never profiles (CM2); household grain (CM1); the Orchard renders exactly what the port returns. |

**The matrix method, for every future element:** name the fact → find its Register owner (or the engine whose decision it is) → the element renders that owner's published output → anything the element would need to *compute* belongs to an owner, not to the element. If no owner exists, **stop**: the element waits for a declared owner (the TIME3/LIVINGHOME1 precedent — law first), and this document is amended to record the new binding.

---

# Architecture Compliance

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================
☑ One canonical identity
  Explain: No entity created; every experience binds to the Register's existing
  identities; the document itself has one home and is indexed once.
☑ One owner per fact
  Explain: The document's whole content — every element bound to exactly one
  owner; every binding cites the Register domain or engine that owns it (§ 2.3
  restate-no-rule).
☑ No duplicate entities
  Explain: Nothing created. Absent owners (traditions, dressing register,
  push delivery) are recorded as absent with their declared path — not filled.
☑ No duplicate ownership
  Explain: This document owns only the per-experience map and the assembled
  composition rules — the one gap between the Register (facts→stores) and
  GEA § 17 (questions→documents). Where GEA § 17, UIA § 17, TIP2 § 5.3 or the
  Register already own a mapping, this document cites and does not restate.
☑ No duplicate state
  Explain: No state created; composition rule 2 forbids composed state; no
  derived fact persisted anywhere by this governance.
☑ Extends existing architecture
  Explain: Assembles LIVINGHOME1/2, the Register, the Intelligence canon and
  the Experience canon downward into one per-experience map; invents no layer.
☑ Progressive enrichment where appropriate
  Explain: Knowledge experiences (Food Platform, Nutrition) bind to enrichable
  owners; transactional experiences (Planner, Shopping, Pantry, Diary) bind to
  single-owner state (Principle 3's split, applied not altered).
☑ Knowledge domain compliance
  Explain: No knowledge domain touched; Domain 29 (Product Knowledge) impact
  is nil — governance documents are not registry surfaces.
☑ Honest gaps over fabricated information
  Explain: Composition rule 5; GEA17 cited throughout; three honest absences
  recorded (no Admin domain — correct; no push channel — correct; no
  celebrations surface until the owner exists).
☑ No permanent synchronisation bridge
  Explain: None created; principle 8 restates nothing and binds future
  compositions to Principle 7.
☑ Evolution over replacement
  Explain: Nothing retired; the Notice Engine's recorded convergence debt is
  inherited with its existing owner and roadmap, not re-owned here.

If any item cannot be checked, implementation must stop and explain why.
```

# AI Architecture Compliance

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------

✓ Intelligence Platform reused — every AI-touching binding in this document
  routes through the existing spine (TIP1's index-of-pointers; no second copy
  of any fact); no new intelligence surface is defined.
✓ Capability Registry respected — actions remain registered (intent ×
  capability) pairs bound to existing owners (TIP2); this document registers
  nothing and binds no new capability.
✓ Intent Engine reused — no bypass path; the Companion composition chain
  (§ UI Composition Rules) is the existing chain, cited not designed.
✓ Companion remains an orchestration layer — it owns conversation history and
  presentation decisions only (§ 3); every business fact stays with its TIP2
  owner; the CPA1 § 1 invariant is cited as this document's principle 4.
✓ Business ownership unchanged — not one owner moves. This document assigns
  no fact to a new owner; it records existing owners and refuses elements
  whose owner does not exist yet.

If any check fails: STOP. Explain why. Do not continue.
```

# Impact

**This document introduces governance only.**

- **No schema changes.** No table, column, index, or migration.
- **No runtime behaviour changes.** No code path, route, or component is touched; nothing renders differently.
- **No persistence changes.** No store created, altered, or retired.
- **No APIs.** No endpoint added, changed, or removed.
- **No implementation.** Every binding above describes what already is (with its owner cited) or what is declared-not-built (with its declaring document cited). Where this document and running code disagree, the code has a defect *or this document does* — the resolution is the cited owner's text, and this document is corrected if it misread the owner.

**Cross-check results (mission-required), recorded:** conflicts found during authoring and their resolutions are recorded in `docs/implementation/architecture/UI_CANONICAL_EXPERIENCE_OWNERSHIP_IMPLEMENTATION.md` § 3. None required amending any owner; every conflict resolved by citing the owner's existing text or recording the debt the owner already records.

---

*One entity. One owner. One source of truth. The interface is the house's glass: everything seen through it is real, nothing seen through it lives in it — and when the glass is clean, nobody notices the glass.*
