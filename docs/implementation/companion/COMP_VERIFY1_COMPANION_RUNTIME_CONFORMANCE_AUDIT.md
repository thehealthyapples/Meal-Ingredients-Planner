# COMP_VERIFY1 — The Companion Runtime Conformance Audit

**One authoritative audit of the *live* Companion runtime against its governing architecture, showing exactly
what remains to make the Companion production-ready.**

Audit only. **No implementation. No schema changes. No AI logic changes.** App source byte-untouched. Every
verdict is grounded in the live code with `file:line` evidence.

| | |
|---|---|
| **Doc ID** | `COMP_VERIFY1` |
| **Date** | 2026-07-17 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `comp-verify1-rollback` → HEAD `7bfad50ca198f2b86f6501a4f82d8ae41af9260b` |
| **Status** | **Authoritative conformance audit. The single reference for what is built, what is partial, and what remains before the Companion is production-ready.** |
| **Product changed** | **None.** An audit document. No component, route, data, schema, migration, test, or AI logic touched. |

---

## 0. PRE-FLIGHT (as required)

- **Git status confirmed.** Branch `int1-intelligence-platform`, HEAD `7bfad50c`. The working tree carries a
  large set of uncommitted changes from prior sessions (COMP1/2/3, COMP_INT1, home/brand explorations); **none
  were touched by this audit.** This document and its session run file are the only additions.
- **Rollback protection created.** Annotated tag **`comp-verify1-rollback`** → `7bfad50ca198f2b86f6501a4f82d8ae41af9260b`.
- **Rollback identifier reported:** **`comp-verify1-rollback`**. Undo with `git reset --hard comp-verify1-rollback` — it removes only this document, because nothing else changed.

---

## 1. WHAT WAS AUDITED, AND AGAINST WHAT

The live runtime under `server/intelligence/` (≈130 files), `server/routes.ts` (the conversation seam), and the
client Companion surface under `client/src/components/conversation/` + `client/src/components/intelligence/`,
reviewed against the six governing documents:

| Governing doc | Owns | Doc status today |
|---|---|---|
| **COMP1** (`docs/implementation/ux/COMP1_COMPANION_VISUAL_IDENTITY.md`) | The Companion's visual identity (embossed sage-ceramic apple, aware light) | **Design spec — "nothing shipped; nothing wired."** Awaiting one governance ratification. |
| **COMP2** (`.../COMP2_COMPANION_PRESENCE_AND_CONVERSATION.md`) | Daily presence & manners (silence-default, one offer, clean exit) | **Design spec — "nothing shipped; nothing wired."** |
| **COMP3** (`.../COMP3_LIVING_RELATIONSHIP.md`) | The years-long relationship (growth by subtraction, felt-not-displayed) | **Design philosophy — "nothing shipped; nothing wired."** |
| **COMP_INT1** (`.../COMP_INT1_COMPANION_INTEGRATION_AUDIT.md`) | Per-room integration of the one resident | **Design blueprint — "nothing shipped; nothing wired."** |
| **COMP_AUTH1** (`docs/architecture/COMP_AUTH1_COMPANION_AUTHORITY_MODEL.md`) | Effective-identity authority & permissions | Governing architecture. |
| **INTARCH1** (`docs/architecture/INTARCH1_INTELLIGENCE_REASONING_ARCHITECTURE.md`) | The 10-stage reasoning pipeline | Governing architecture. |

> **The central framing for this audit.** COMP1/2/3/COMP_INT1 are, by their own headers, **design documents
> that ship nothing.** The runtime therefore cannot "fail" to implement them — it *predates* them. What the
> audit measures is: (a) how much of what those designs describe already exists in some form, and (b) how far
> the runtime the platform *did* build (INT2–INT50, CONV1, OD1, EL1, PHASE5) conforms to the two *governing
> architectures* (COMP_AUTH1, INTARCH1). The honest headline is that **the trust spine is strong and the
> experience/action surface is thin.**

---

## 2. OVERALL CONFORMANCE

### 2.1 The headline number

> ## ≈ 72% overall conformance
>
> A **secure, single-spine, single-owner foundation** (the trust dimensions score 80–92%) carrying a **thin
> action-and-experience surface** (write-action coverage ≈ 15%; visual identity & cross-room UX 35–55%).

The number is a deliberate blend of two very different halves. Reported separately, so the blend is not
mistaken for uniform readiness:

| Half | Dimensions | Conformance | Reading |
|---|---|---|---|
| **Trust spine** (built, governed, verified) | One Companion · Identity & Permissions · Capability Registry · Context Composition · Knowledge Retrieval · Delegation *integrity* | **≈ 85%** | Production-grade. Single spine, one owner per fact, permission-before-retrieval, honest gaps, EFSA-gated evidence. |
| **Product surface** (designed, largely unbuilt) | Reasoning-pipeline *structure* · Write-action *coverage* · Visual identity · Cross-room UX · Living relationship | **≈ 50%** | Not yet production-ready. The Companion is a secure read-mostly assistant that does not yet look, feel, or act like the designed resident. |

### 2.2 Per-dimension scorecard

| # | Audit dimension | Verdict | Conformance | One-line basis |
|---|---|---|---|---|
| 1 | **One Companion** | 🟢 Complete | **92%** | One endpoint, one gateway singleton, one platform singleton, one globally-mounted `FloatingAssistant`; no forks. |
| 2 | **Identity & Permissions** | 🟡 Substantial | **80%** | Effective identity works, role-keyed, before-composition, fails closed; but emergent-not-typed, no `household` class, actor not audited per turn. |
| 3 | **Reasoning Pipeline (INTARCH1)** | 🟡 Partial | **65%** | Read-path order largely holds (retrieval-before-generation, honest gaps strong); evidence-gate-as-turn-stage missing; permission not resolved up front; no declared 10-stage object. |
| 4 | **Capability Registry** | 🟢 Complete | **90%** | 24 capabilities, one owner each, validated discovery graph, single allow-list, deterministic server-side confirmation, developer plane isolated. |
| 5 | **Context Composition** | 🟢 Substantial | **82%** | One engine, 600-token budget, deterministic, legacy truncation removed; Context Views not yet capability-owned (7 native specs); engine has no permission awareness of its own. |
| 6 | **Knowledge Retrieval** | 🟡 Substantial | **80%** | Reads single owners, permission-filtered, Product Knowledge Registry wired (154 entries), EFSA-gated citation-or-drop at read; Tier 2–3 enrichment is a stub. |
| 7 | **Business-Service Delegation** | 🟡 Split | **60%** | *Integrity* complete (clean Port→service, no direct DB, confirm-before-mutate); *coverage* ≈15% (only `planner.add` + `shopping.add` execute real writes). |
| 8 | **UX across every THA area** | 🟠 Partial | **55%** | One resident universally present; but COMP1 identity unbuilt, Household room missing, deixis on 4/8 surfaces, two Homes, COMP3 infra-only. |

**Governing-document conformance (the six named docs):**

| Doc | Verdict | Conformance | Basis |
|---|---|---|---|
| **COMP_AUTH1** (effective identity) | 🟡 Substantial | **80%** | Effective identity enforced; 3-tier vs 4-tier class model; per-turn actor audit missing (§6). |
| **INTARCH1** (reasoning pipeline) | 🟡 Partial | **65%** | 4 stages Complete, 5 Partial, 1 (evidence validation) Missing as a turn stage. |
| **COMP1** (visual identity) | 🟠 Partial | **35%** | Consistent single mark/corner/name exists; embossed-apple identity & aware light absent (gated). |
| **COMP2** (presence & manners) | 🟡 Partial | **50%** | Silence-default, confirm-before-act, honest gaps, six voices, arrival-withhold present; full manners design unbuilt. |
| **COMP3** (living relationship) | 🟡 Partial | **45%** | Durable memory + growth signal + evidence-learning exist; no felt maturing arc; one display-tension. |
| **COMP_INT1** (per-room integration) | 🟡 Partial | **50%** | The one-resident principle shipped; situated understanding half-wired; missing rooms & surface fall-throughs. |

---

## 3. DIMENSION FINDINGS (Complete / Partial / Missing)

Each dimension records what is **Complete**, what is **Partial**, and what is **Missing**, with evidence.

### 3.1 One Companion — 🟢 Complete (92%)

**Complete.** There is exactly one Companion, structurally.
- One user-facing turn endpoint — `POST /api/intelligence/conversation/turn` (`server/routes.ts:12134`), the
  only production caller of `conversationGateway.processUserTurn` (`:12156`).
- One gateway singleton (`conversation-gateway.ts:1435-1437`), one platform singleton
  (`intelligence-platform.ts:280`), one grounded-response builder with one system prompt.
- One client surface — `FloatingAssistant` mounted **once, globally**, inside the authenticated shell
  (`client/src/App.tsx:257`, wrapped by one `CompanionContextProvider` at `:206`) — so it is present on every
  authenticated route. No `AdminCompanion`/`SupportCompanion`/`HouseholdCompanion` fork exists.
- The admin surface **explicitly reuses** the same seam ("Runs through the one Companion seam (processUserTurn)
  against your live household" — `client/src/pages/admin-intelligence-page.tsx:467`).
- Other server LLM callers (`matcher-suggester`, `companion-learning-recommender`, `openai-enrichment`) are
  non-conversational domain/analytics services, not a second Companion.

**Partial.** Surface *framing* falls through to a generic persona in a few rooms (§3.8) — a UX seam, not a
fracturing of the one presence.

**Missing.** Nothing material.

### 3.2 Identity & Permissions — 🟡 Substantial (80%)

**Complete.**
- **Effective identity is honoured.** The impersonation route does `req.login(owner, …)`
  (`server/routes.ts:8717-8735`), so under impersonation `req.user` *is* the impersonated user;
  `resolveContext(user)` derives role solely from that user (`permissions.ts:36-43`) and never reads the actor
  — the Companion reasons as the effective identity, never the admin actor.
- **Keyed on role, not tier.** `isAdmin(user)` sets role; `premium` is resolved but **never** consulted by
  `canInvokeCapability`/`canAccessKnowledgeClass` (`permissions.ts:63-106`).
- **Permission before retrieval, filtered before composition.** `canInvokeCapability` runs at
  `intent-engine.ts:164-168` (the PERMISSION step) before INVOKE; only `ok-data` results reach
  `composeContext` (`conversation-gateway.ts:954-969`), so filtering is strictly upstream of the single prompt.
- **Fails closed.** Exact-match role/class grants only; developer-class is unreachable in this plane (no
  `developer` role is producible); the developer capability is `availability:"never"`
  (`capability-registry.ts:761-772`).
- **No location-as-authority.** `surface`/`surfaceHints` reach only relevance/hints, never `resolveContext`
  or `canInvokeCapability`.

**Partial.**
- **Effective identity is emergent, not first-class.** Correctness depends entirely on `req.login` being the
  sole writer of `req.user`; there is no explicit Actor/Effective type (COMP_AUTH1 §2). Robust today, fragile
  for any future impersonation surface.
- **Knowledge-class model is 3-tier, not the PKR 4-tier.** Runtime `KnowledgeClass` is
  `public | admin | developer` (`permissions.ts:63-73`); there is **no `household` class**. Household data is
  protected by `ownershipScoped:true` at the owning service instead. Closed and safe, but a collapse of
  COMP_AUTH1/PKR's `public ⊂ household ⊂ admin ⊂ developer`.

**Missing.**
- **Per-turn actor audit (COMP_AUTH1 §6).** The actor id lives only in the session; Companion turns persist the
  *effective* `userId` only (`conversation-gateway.ts:1305-1349`), and entering impersonation is **not**
  written to `admin_audit_log` (`server/routes.ts:8717-8740`). The record COMP_AUTH1 requires — "admin A,
  acting as user U, held this conversation" — does not exist at turn granularity. *(Not a permission leak; an
  attribution gap.)*

### 3.3 Reasoning Pipeline (INTARCH1) — 🟡 Partial (65%)

Trace: `routes.ts:12134` → `processUserTurn` → `buildGroundedResponse` (`conversation-gateway.ts:379`) →
resolver → `intelligencePlatform.handle` → `intent-engine.routeInner` → `assembleKnowledge` → `composeContext`
→ `llmProvider.complete` → behaviour-engine voicing.

| # | Stage | Verdict | Evidence / gap |
|---|---|---|---|
| 1 | Intent | 🟢 Complete | `intentResolver.resolve` → typed `ResolvedIntent[]` (`pattern-intent-resolver.ts:2890-2991`). |
| 2 | Effective Identity | 🟡 Partial | `contextFor(user)` → `{role,userId,premium}`; no actor/effective model, no `tier`/`householdScope` (§3.2). |
| 3 | Permission Resolution | 🟡 Partial | Resolved per-capability at invoke (`intent-engine.ts:165`), **not** as one set fixed before retrieval; no `household` class; composition adds no filtering. |
| 4 | Context Composition | 🟡 Partial | INT17 engine composes once, budgeted, deterministic (`:954`) — but **after** retrieval, not before selection/retrieval as §3.4 places it. |
| 5 | Capability Selection | 🟡 Partial | Fused into intent parse; the pattern resolver both parses and routes. Registry allow-list still enforced (`intent-engine.ts:136,146`). |
| 6 | Knowledge Retrieval | 🟢 Complete | `Promise.all(queryCapability)` → bound handler → owning service; permission-filtered per capability. |
| 7 | **Evidence Validation** | 🔴 **Missing (as a turn stage)** | The gate `shared/knowledge/evidence.ts` (Rule E1) runs only inside *producers*, not on the turn; no citation-or-drop between retrieval and the LLM, and **no citations carried into the prompt or response**. Only the honest-gap (empty-set) half exists. |
| 8 | Reasoning | 🟢 Complete | `llmProvider.complete` (`:1074`) after composition and after the fallback short-circuit; system-prompt HARD RULES constrain to context-only. |
| 9 | Response | 🟢 Complete | Behaviour-engine voicing; carries `entityRefs` (but no citations — nothing to preserve from stage 7). |
| 10 | Action | 🟡 Partial | Not executed in the turn — writes refused as honest gaps (`:473`); real actions run through a *separate* confirmed route (`intent-engine.ts:170-193`). Confirm-before-invoke is correct where it runs. |

**Order integrity.** *Retrieval-before-generation* is cleanly and strongly enforced (the LLM is reached only
after retrieval, with three honest-gap short-circuits before generation — `:473`, `:521`, `:772`).
*Permissions-before-retrieval* holds **locally** (each capability's check precedes its own handler) but not as a
single up-front ceiling. **There is no declared 10-stage pipeline object** — the reasoning stages are implicit
and interleaved inside `buildGroundedResponse`; the only explicitly-ordered pipeline (`engine.route`:
LOCATE→VALIDATE→PERMISSION→CONFIRM→INVOKE→RESPOND) is a *per-invocation* order, not the reasoning spine.

### 3.4 Capability Registry — 🟢 Complete (90%)

**Complete.**
- 24 capabilities in one seed (`capability-registry.ts:370-778`); **every capability names exactly one SoT
  owner; no two own the same fact** — verified structurally by `validateDiscoveryRelationships()`
  (`:992-1013`), which throws on self-reference, dangling owner, or two siblings claiming one owner.
- The registry is the **single allow-list** used by routing (`registry.supports`), permission
  (`canInvokeCapability`), executability (`isExecutable`/`getHandler`), and confirmation (`confirmationFor`) —
  no second registry or parallel role table.
- Privileged capabilities correctly modelled: `administration` is `minimumRole:"admin", audited:true`
  (`:747`); `developer` is `availability:"never"` (`:761-772`), physically excluded from this plane.
- Deterministic, server-side confirmation tiers (`permissions.ts:113-142`): read→none, add→light,
  move/replace/generate/import→required, delete/share/export/order/review/approve→strong, any audited→strong.

**Partial.** `administration` has no `companionDomain` and no bound handler — declared but not Companion-reachable
(correct today, but the admin-capability surface is unbuilt). Two `owningService` strings share *files* across
distinct SoT owners (`meal-service.ts` on planner+meals; `price-lookup.ts` on shopping+partners) — descriptive
overlap of files, **not** dual ownership of a fact.

**Missing.** Nothing structural.

### 3.5 Context Composition — 🟢 Substantial (82%)

**Complete.** One engine owns the prompt's grounding — `composeContext` is the single assembly point
(`conversation-gateway.ts:954`, "THE ONE PLACE THE LLM'S GROUNDING CONTEXT IS ASSEMBLED"). A whole-block token
budget (`CONTEXT_TOKEN_BUDGET = 600`, `context-composition-engine.ts:123`) is enforced; output is deterministic
(relevance→resolver-index ordering, no clock/randomness/Map-iteration, `:427`); the legacy mid-object
truncation is gone, replaced by valid-JSON `clipDeep` (`:351-387`); overruns are reported, not hidden.

**Partial.**
- **Context Views not yet capability-owned.** Only **7** capability:verb pairs have native specs
  (`context-view.ts:363-473`); all others fall to generic structural derivation. The governing target ("every
  capability exposes its own Context View") is unmet — the central derivation is an interim seam.
- **The engine has no permission awareness of its own.** It is deliberately permission-agnostic and relies
  wholly on upstream handler projection; `keep` allowlists are explicitly *not* redaction (`context-view.ts:169-174`),
  so a new top-level scalar on any Full Result would flow to the model unfiltered.

**Missing.** Nothing — this is the most complete built layer.

### 3.6 Knowledge Retrieval — 🟡 Substantial (80%)

**Complete.**
- Reads route to the fact's single owner via Port→service (nutrition-knowledge-registry, food-intelligence,
  product-knowledge-registry), all bound at startup.
- Permission-filtered: the Product Knowledge port takes the resolved visibility tier as a mandatory first arg,
  making an over-tier read *untypeable* (`product-knowledge-read-port.ts:24-34`); above-tier and unknown ids are
  indistinguishable to the caller.
- **Product Knowledge Registry is wired and populated** — reads `docs/product/inventory/product.json`
  (`product-knowledge-registry.ts:172,213`), **154 entries**, no prose-in-code.
- **Evidence gate at read (EFSA firewall).** `shared/knowledge/evidence.ts` enforces citation-or-drop:
  human sign-off (`reviewedAt`) + ≥1 valid `SourceRef` on a trusted domain (`efsa.europa.eu`, `nhs.uk`, …,
  `:32-72`); editorial self-confidence is ignored. Honest gaps are non-fabricating and state-specific
  (`turn-fallback.ts`).

**Partial.** `assembleKnowledge` — described as "the single authoritative stage" — has a **pass-through stub** for
Tier 2–3 enrichment (`knowledge-assembly.ts:129-132`); real enrichment reaches the model via a *parallel* path
(capability-owned enrichment builders). The single-owner-of-content claim is only partly realised.

**Missing.** A **post-generation** citation validator — the gate is source-side (at registry read), not on the
model's emitted prose, which relies on prompt HARD RULES plus retrieval-gating.

### 3.7 Business-Service Delegation — 🟡 Split: integrity Complete, coverage Missing (60%)

**Complete (integrity).** Handlers never touch the DB directly — the only `storage` import in a handler body is
`import type` (`household-read-handler.ts:42`). Writes delegate through Port→service: `planner-write-port.ts:49-60`
→ `storage.addPlannerEntry` (the exact call the HTTP route makes); `shopping-write-port.ts:40-46` →
`storage.addShoppingListExtra`. Confirmation is enforced server-side before invoke (`intent-engine.ts:170-180`).
No business logic is re-implemented — each write handler is a single forward with an `add`-only verb guard.
`opportunity-delivery`/`evidence-learning` writes touch only the platform's own governance tables (Law 8 holds —
a confirmed learning signal never mutates a preference).

**Missing (coverage).** **Only 2 of ~13 supported write verbs execute a real business mutation** —
`planner.add` and `shopping.add`. Six write/destructive-class capabilities expose **zero** executable writes:

| Capability | Supported writes | Executable | Unbound (the gap) |
|---|---|---|---|
| planner | generate, add, move, replace, delete, import, share | **add** | **generate**, move, replace, delete-entry, import, share |
| meals | generate, add, replace, delete, import, share | **none** | **swap/replace** (`recipe-swap-engine.ts` exists, unbound), generate, add, delete |
| shopping | add, delete, generate | **add** | generate-from-plan, delete |
| diary | add, delete | **none** | **log entry**, delete |
| profile | add | **none** | update preference |
| pantry | add, delete | **none** | add / remove item |
| templates | generate, add, import, delete, share | **none** | all |
| household | add, delete | **none** | add / remove member |

**Partial (a tracked weakness).** The two write handlers **replicate** the route's ownership check rather than
sharing one guard (`planner-write-handler.ts:86-98`, header: "OWNERSHIP CHECKS ARE REPLICATED, NOT
REINVENTED") — a divergence risk if the route's check changes.

### 3.8 UX Across Every THA Area — 🟠 Partial (55%)

**Complete.** One real conversational surface, universally present: `FloatingAssistant.tsx` (1,659 lines) is a
genuine chat/turn UI — scrollable thread of turn bubbles, textarea ("Ask Apple anything…"), quick-action chips,
**server-persisted turns**, Companion Cards → Next Steps into canonical pages, Companion Actions with
confirm-before-act, surface-aware persona label, six selectable voices, per-turn feedback. Passive intelligence
widgets sit alongside it across most rooms.

Area-by-area:

| Area | Presence | What exists | Gap |
|---|---|---|---|
| **Home** | 🟢 Complete | Global FAB (arrival-withheld); `AmbientIntelligence`; notices | Publishes no deixis pointers; richer `HomeIntelligenceCompanion` stranded on legacy `/dashboard` — a two-home fork |
| **Planner** | 🟢 Complete (richest) | FAB "Planner" persona + quick-actions; publishes week/day/slot pointers; strip; ambient | — |
| **Shopping** | 🟢 Context-thin | FAB "Shopping"; ambient; per-item panel | No pointers → deixis ("is *it* on my list?") unavailable |
| **Pantry** | 🟢 Context-thin | FAB "Pantry"; panel; ambient | No pointers |
| **Food detail / compare** | 🟢 Complete | Publishes `currentFoodSlug`; comparison view | `/compare` unmapped in `useSurface()` → generic "Apple" persona |
| **Meals / Cookbook** | 🟢 Complete | FAB "Cookbook"; strip; meal-detail publishes `selectedMealId` | — |
| **Diary** | 🟡 Partial | FAB "Diary" persona only | No passive intelligence, no pointers — chat only |
| **Admin** | 🟡 Partial | Global FAB on `/admin/*`; two steward monitoring dashboards | Generic persona on `/admin`; no operational framing |
| **Household** | 🔴 **Missing** | **Nothing** — `HouseholdNutritionPanel` is imported nowhere (dead code); **no `/household` route**; the `"household"` conversation surface is defined but **unreachable** | An entire missing room |

**COMP1 visual identity — Partial (35%).** There *is* a single consistent mark, corner (`fixed right-6 z-40`),
and name ("Apple") across all rooms — the *consistency* COMP1 demands. But it is a generic circular FAB using a
`MessageSquare` icon (`FloatingAssistant.tsx:1500`) with a `Leaf`-icon avatar (`:937-938`) — **not** the
embossed sage-ceramic apple, and the **aware-light presence signal is absent** (governance-gated per COMP1 §10).
It reads as a competent chat widget — precisely the "another AI chat widget" COMP1 says it must not be.

**COMP3 living relationship — Partial (45%).** Infrastructural, not experiential: the thread is server-persisted
and reloaded (cross-session memory, `conversation-store.ts:196`), a growth/trend signal exists
(`companion-growth.ts`), and confirmed household learning exists (EL1). But there is no *felt* maturing arc, and
one design-tension: the `household-learning` notice *displays* learned preferences verbatim
(`notice-engine.ts:394-417`), which COMP3's "felt, never displayed" philosophy forbids — to be reconciled at
COMP3's gated memory-design review.

### 3.9 The five Companion-Platform layers (supporting evidence)

| Layer | Verdict | Evidence |
|---|---|---|
| Personality Registry | 🟢 Complete | 6 pure-data voices (`shared/companion-personality.ts:13-32`; `personality-registry.ts:301-544`); read fresh per turn. |
| Behaviour Engine | 🟢 Complete | Pure phrasing transforms only; appended after the hard rules, "voice only — never overrides rules" (`conversation-gateway.ts:1051`). **Invariant holds — no fact injection.** |
| Notice Engine | 🟢 Complete | Zero-I/O adapter; 8 categories; every fact carries provenance; dedupe+rank+cap-2 the single choke point; uncited items dropped. |
| Companion Growth | 🟢 Complete | One honest trend signal, `MIN_SAMPLES_PER_WINDOW=5`, returns null when thin. |
| Guidance + Experience | 🟡 Partial | Guidance gated through `canExecute`; greetings live; but `avatarId`/`colorTheme`/`voiceProfileId` visual scaffold **unrendered**, and cross-session silence memory (`companion_observation_log`) **unbuilt** (notices can repeat across sessions). |

**The platform hard invariant holds in the live runtime:** no layer changes what is true, what is permitted, or
what requires confirmation.

---

## 4. THE COMPLETE GAP REGISTER

Every implementation gap the audit found, deduplicated across dimensions:

| ID | Gap | Dimension | Severity |
|---|---|---|---|
| G1 | Only `planner.add` + `shopping.add` execute real writes; meal-swap, planner-generate/move/replace/delete, shopping-generate/delete, diary-log, pantry/profile/household/template writes all unbound | Delegation coverage | 🔴 Critical |
| G2 | Evidence validation is not a turn stage; no citation-or-drop between retrieval and the LLM; **responses carry no citations** | Reasoning pipeline (INTARCH1 stage 7) | 🔴 Critical |
| G3 | Per-turn actor audit missing; impersonation entry not written to `admin_audit_log` | Identity (COMP_AUTH1 §6) | 🟠 High |
| G4 | Effective identity is emergent, not a first-class Actor/Effective type | Identity | 🟠 High |
| G5 | No `household` knowledge class (3-tier vs PKR 4-tier); household protected only by ownership-scoping | Identity / permissions | 🟡 Medium |
| G6 | No declared 10-stage pipeline object; permission not resolved as one up-front ceiling; stages 1&5 fused; stage 4 after retrieval | Reasoning pipeline | 🟡 Medium |
| G7 | COMP1 visual identity unbuilt — `MessageSquare`/`Leaf` "Apple" FAB, not the embossed apple; no aware light | UX / COMP1 | 🟠 High |
| G8 | Household is a missing room — no route, dead `HouseholdNutritionPanel`, unreachable `"household"` surface | UX / COMP_INT1 | 🟠 High |
| G9 | Deixis pointers published on only 4/8 surfaces (Shopping, Pantry, Diary, Home publish none) | UX / COMP_INT1 §4.5 | 🟡 Medium |
| G10 | Surface fall-throughs — `/compare`, `/admin`, household resolve to generic "Apple" persona | UX | 🟡 Medium |
| G11 | Two Homes — richer `HomeIntelligenceCompanion` stranded on legacy `/dashboard` | UX | 🟡 Medium |
| G12 | Context Views not capability-owned (7 native specs); engine has no permission awareness of its own | Context composition | 🟡 Medium |
| G13 | `assembleKnowledge` Tier 2–3 enrichment is a pass-through stub; real enrichment via a parallel path | Knowledge retrieval | 🟡 Medium |
| G14 | No cross-session silence memory (`companion_observation_log` unbuilt) — notices can repeat across sessions | Platform / Notice Engine | 🟡 Medium |
| G15 | `ExperienceProfile` visual scaffold (`avatarId`/`colorTheme`/`voiceProfileId`) unrendered on the client | Platform / experience | 🟢 Low |
| G16 | Replicated (not shared) ownership check in the two write handlers | Delegation integrity | 🟢 Low |
| G17 | COMP3 display-tension — confirmed-learning notice *displays* learned preferences | UX / COMP3 | 🟢 Low |
| G18 | Documentation drift — `server/intelligence/README.md` stuck at INT17; CPA doc lists retired routes & fewer notice categories than runtime | Hygiene | 🟢 Low |

---

## 5. PRIORITISED IMPLEMENTATION BACKLOG

Ordered by production-readiness impact. Each item is scoped to reuse a proven pattern and touches no governing
rule.

### P0 — Production blockers

**P0-1 · Companion Write Activation (G1).** Bind the headline write verbs to their existing owning services
using the proven INT40 Port→Handler pattern (confirmation is already wired). Priority order by product value ×
low risk: **meal swap** (`recipe-swap-engine.ts` already exists, unbound) → **planner generate** (smart-meal
engine) → planner move/replace/delete-entry → **shopping generate-from-plan** + delete → **diary log**. Each is
one handler delegating to a service that already enforces its own rules. *This is the single biggest step from
"secure read-mostly assistant" to "useful resident."*

**P0-2 · Evidence-as-a-turn-stage + citations in responses (G2).** Carry `EvidenceCitation` from retrieval
through composition into the prompt *and* the response, and enforce citation-or-drop at the turn (not only at
registry read). Directly realises INTARCH1 stage 7 and the "Why was this recommended?" worked example — the
Companion should be able to *show its sources*. No new evidence store; the gate already exists in
`shared/knowledge/evidence.ts`, it must be threaded onto the turn.

**P0-3 · Effective-identity audit + first-classing (G3, G4).** Persist the actor id onto Companion turns under
impersonation; write impersonation entry/exit to `admin_audit_log`; introduce an explicit Actor/Effective
identity type so correctness no longer rests on `req.login` being the sole writer of `req.user`. COMP_AUTH1 §6
compliance — a GA gate for any product that ships admin impersonation.

### P1 — High (conformance + trust hardening)

**P1-1 · Declare the 10-stage pipeline & resolve permission up front (G6, G5).** Refactor `buildGroundedResponse`
into a named, ordered pipeline; compute one permission set (visibility ceiling + capability allow-list) before
retrieval; add the `household` knowledge class to match the PKR 4-tier model.

**P1-2 · Context-composition boundary hardening (G12).** Either give the engine its own permission filter or
formally certify the upstream-only contract with a guard test; migrate the remaining capabilities to
capability-owned Context Views.

**P1-3 · Real knowledge enrichment stage (G13).** Replace the `assembleKnowledge` Tier 2–3 stub with the single
owning enrichment stage, or retire the stub and canonicalise the parallel path.

### P2 — The designed experience (COMP1/2/3/COMP_INT1)

**P2-1 · COMP1 visual identity (G7, G15).** Ship the embossed sage-ceramic apple mark and render the
`ExperienceProfile` scaffold; ratify + ship the aware-light presence signal (currently governance-gated).

**P2-2 · Household room + surface framing (G8, G10).** Add the `/household` route, wire `HouseholdNutritionPanel`,
and make `/compare`, `/admin`, and household resolve to their situated personas.

**P2-3 · Situated understanding everywhere (G9, G11).** Publish on-screen deixis pointers from Shopping, Pantry,
Diary, and Home; reconcile the two Homes onto one surface.

**P2-4 · Cross-session silence memory (G14).** Build `companion_observation_log` so notices don't repeat across
sessions and milestones can be genuinely dated.

### P3 — Hygiene

**P3-1** Extract the shared planner/shopping ownership guard (G16). · **P3-2** Reconcile the COMP3 display-tension
at the gated memory review (G17). · **P3-3** Refresh `server/intelligence/README.md` and the CPA doc to match the
live runtime (G18).

---

## 6. RECOMMENDED NEXT IMPLEMENTATION

> **Start with P0-1 — Companion Write Activation — beginning with meal swap and planner generate, run as one
> workstream paired with P0-2 (citations in responses).**

**Why this, now.** The audit's clearest finding is an asymmetry: the trust spine is production-grade (≈85%),
but the Companion **cannot yet do the things a household would ask it to do** — it is a secure assistant that can
explain almost anything and *change* almost nothing (2 of ~13 write verbs). P0-1 is the highest-leverage,
lowest-risk move because:
- the delegation pattern is **already proven** (INT40) and the confirmation gate **already works**, so each verb
  is one thin handler over a service that already owns its rules;
- the owning services already exist — `recipe-swap-engine.ts` for meal swap, the smart-meal engine for planner
  generate — so **no business logic is written**, only bound;
- it directly unblocks INTARCH1's own worked examples ("Plan meals for next week", "Publish…") that today
  dead-end at an honest gap.

Pairing it with **P0-2** ensures the newly-active Companion is also *trustworthy*: when it recommends or acts, it
shows its grounded sources. Together they convert the Companion from "secure and quiet" to "useful and
accountable" — the two properties a production Companion most needs and most lacks today.

**P0-3 (effective-identity audit)** should run in parallel as the compliance gate: it is small, self-contained,
and required before any GA that includes admin impersonation, but it does not block the write/citation work.

---

## 7. DEFINITION OF DONE

- [x] Git status confirmed; rollback protection created; identifier reported — **`comp-verify1-rollback`** → `7bfad50c` (§0).
- [x] Live runtime reviewed against **COMP1, COMP2, COMP3, COMP_INT1, COMP_AUTH1, INTARCH1** (§1, §3).
- [x] Every audited area recorded as **Complete / Partial / Missing** with `file:line` evidence — One Companion,
      Identity & Permissions, Reasoning Pipeline, Capability Registry, Context Composition, Knowledge Retrieval,
      Business-Service delegation, UX across every THA area (§3).
- [x] Every implementation gap identified — the 18-row Gap Register (§4).
- [x] **Overall conformance %** produced — ≈72% overall, split into an ≈85% trust spine and an ≈50% product
      surface (§2).
- [x] **Prioritised implementation backlog** produced — P0→P3 (§5).
- [x] **Recommended next implementation** named — P0-1 Companion Write Activation + P0-2 citations (§6).
- [x] Audit only — no implementation, no schema change, no AI-logic change.

**This is the one authoritative audit of what remains to make the Companion production-ready:** a strong, secure,
single-spine, single-owner foundation whose next job is to *act* (write coverage) and *account* (citations,
effective-identity audit), then to *look and feel* like the resident COMP1–COMP_INT1 designed.

---

## 8. GOVERNANCE, SCOPE & METHOD

**Scope.** Audit only. No component, route, data, schema, migration, test, or AI logic was touched. The sole
artifacts are this document and its session run file.

**Method.** The runtime was traced from the conversation seam (`routes.ts:12134`) through the gateway, intent
engine, capability registry, permission model, context-composition engine, knowledge handlers, and client
surface, across ≈130 intelligence files and the client Companion components. Findings were cross-checked against
the six governing documents. Every verdict cites live `file:line` evidence; where the code is ahead of a
governing doc (e.g. `README.md` at INT17 vs a runtime with 24 capabilities, writes, and a conversation layer),
the drift is recorded as a hygiene gap (G18), not counted against the runtime.

**Rollback.** `git reset --hard comp-verify1-rollback` (→ `7bfad50ca198f2b86f6501a4f82d8ae41af9260b`) removes
this document with no other effect.
