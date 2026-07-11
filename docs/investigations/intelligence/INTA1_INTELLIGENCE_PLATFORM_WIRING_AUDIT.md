# INTA1 — Intelligence Platform Wiring Audit

**Status:** INVESTIGATION — point-in-time analysis. No code, schema, runtime or API changes.
**Classification:** Investigation (not governing architecture)
**Date:** 2026-07-08
**Branch:** `int1-intelligence-platform`
**Tree state:** HEAD `45443a8` + uncommitted working tree (see §1.2 — the distinction is material)
**Audited against:** `docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md` (CPA1), `docs/architecture/README.md`
**Supporting governance:** TIP1 `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, TIP2 `THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`, TIP3 `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`
**Rollback:** this document only — `rm docs/investigations/intelligence/INTA1_INTELLIGENCE_PLATFORM_WIRING_AUDIT.md`. No code was changed to produce it.

---

## 0. EXECUTIVE SUMMARY

The Intelligence Platform **spine is real and load-bearing**. The Companion Platform **voice seam is real but degenerate**. The Companion Platform **observation seam does not exist**.

The conversation pipeline — Gateway → Intent Resolver → Intent Engine → Capability Registry → handler → port → business service → LLM → response — is fully wired, permission-checked, confirmation-gated, and exercised on every user turn. Memory is real: prior turns are persisted and re-injected into the prompt. Guidance, discovery, enrichment and delegated actions all reach the user.

Against that, three findings dominate:

1. **The Observation Engine (CPA1 §4.3) is 100% dead.** `GET /api/intelligence/companion/observations` — the route CPA1 §5.2 describes in detail as the observation seam — **has never existed in any commit in the repository's history.** All five `observe*` producers, `applySilenceRules`, `phraseObservation`, `OBSERVATION_CATEGORY_INTERACTION_KIND`, `companion-delight.ts` and `use-companion-observations.ts` have **zero runtime callers**. The Delight layer has zero importers of any kind.

2. **The Personality Platform is unreachable by construction.** `user_preferences.companionPersonality` — described by CPA1 §4.1 as "one additive column, `notNull`, default `'companion'`" — **does not exist in `shared/schema.ts` and never has.** The gateway's read of it (`conversation-gateway.ts:912`) is a live TypeScript error (TS2339). There is no write route, no settings UI, and Zod strips the field. Five of six voices are permanently unreachable; `prioritizeGuidance` is a **verified no-op** for the only voice that can ever run.

3. **The benchmark cannot detect any of this.** A completely unwired capability scores **73.3/100** and passes. In the most recent run, **36 of 100 questions reached no capability at all**, yet scored a mean of **74.3** against **75.0** for questions that did — a 0.7-point difference. Three of five hard gates are never assigned by the scorer. The LLM judge, which owns **68% of the dimension weight**, is hardcoded off (`judge.ts:48-50`).

The through-line: `0b1f2f7` — a single un-reviewed `Replit Agent` checkpoint titled *"Saved progress at the end of the loop"* — is the sole origin commit of the entire Companion Platform runtime, of the governing architecture document that describes it, and of most of that document's cited precedent. **The document describes an intended system, not the built one**, and was authored in the same commit as the code it purports to describe. It is also indexed in neither `docs/architecture/README.md` nor `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, despite being cited as governing by 15 other documents.

**Verdict by layer:**

| Layer | State |
|---|---|
| Intelligence Platform spine (TIP1/TIP2) | ✅ Active |
| Conversation lifecycle | ✅ Active |
| Memory integration | ✅ Active (closed loop) |
| Capability Registry | 🟡 21/23 bound; 3 bound-but-unroutable; 1 phantom |
| Intent Resolver | 🟡 3 of 20 verbs, 18 of 23 capabilities |
| Behaviour Engine | 🟡 Active, one voice, 5 of 12 exports dead |
| Personality Registry | 🔴 Unreachable (no column, no route, no UI) |
| Observation Engine | 🔴 Unwired (no route, never existed) |
| Companion Growth | 🔴 Unwired (only consumer is the dead Observation Engine) |
| Delight layer | 🔴 Unwired (zero importers) |
| Learning pipeline | 🟡 Write-only; in-memory input; durable sink never registered |
| Recommendation pipeline | 🟡 Guidance active; recommender is admin-only, terminal |

---

## 1. METHOD AND EVIDENCE BASIS

### 1.1 Method

Every claim below is grounded in one of four evidence classes, and the class is named at each finding:

- **Grep** — exhaustive symbol search across `server/`, `client/`, `shared/`, excluding `node_modules`. "ABSENT" means grepped with no match.
- **Git history** — `git log -S '<symbol>' --all` to distinguish *never built* from *removed*.
- **Executed** — code run in this session (typecheck, tests, module import, a purpose-built probe). Marked **[EXECUTED]**.
- **Read** — direct file read with line citation.

Route reachability was established by extracting all 207 registered route literals from the only two route-registering files (`server/routes.ts`, `server/auth.ts` — verified as the only files containing `app.<verb>(`) and diffing them against every `/api/intelligence/*` string literal in `client/src`.

### 1.2 Tree state — HEAD vs working tree

This distinction is material and no prior audit records it.

`docs/investigations/platform/AUDIT1_PLATFORM_REGRESSION_AND_FEATURE_AVAILABILITY.md` (F2, HIGH, marked open) reports that the Companion chat is broken at runtime: `conversation-gateway.ts` transitively imports `extractFoodRef` from `nutrition-enrichment.ts`, where it was declared but not exported, throwing `SyntaxError` on module load and 500-ing every conversation endpoint.

**That regression is fixed in the working tree, and the fix is uncommitted.**

```
git show HEAD:server/intelligence/conversation/nutrition-enrichment.ts
  56:interface FoodRef {                          ← no export
  64:function extractFoodRef(...)                 ← no export

working tree (git diff):
  -interface FoodRef {            +export interface FoodRef {
  -function extractFoodRef(...)   +export function extractFoodRef(...)
```

**[EXECUTED]** Module load against the working tree:

```
$ npx tsx -e 'import("./server/intelligence/conversation/conversation-gateway.js")...'
IMPORT OK — exports: ConversationGateway, conversationGateway, detectWriteIntent
```

**Therefore:** AUDIT1 F2 is **resolved in the working tree and RED at HEAD**. Committing the working tree closes it; reverting `nutrition-enrichment.ts` reopens it. Everything else in this audit is evaluated against the working tree, where the Companion chat *does* load.

### 1.3 Global health

**[EXECUTED]** `npx tsc --noEmit` → **178 errors, exit 1**. `npm run release:check` (= `typecheck && test && build`) is therefore **currently RED and cannot pass.**

| Area | Errors |
|---|---|
| `server/tests` | 153 |
| `server/intelligence/conversation` | 10 |
| `server/scripts` | 7 |
| `server/tests/benchmark` | 3 |
| `server/intelligence/handlers` | 3 |
| `server/intelligence/services` | 1 |
| `server/cli` | 1 |
| **`client/`, `shared/`** | **0** |

Ten of these are in live product code under `server/intelligence/conversation/`, including the Companion's personality read.

---

## 2. END-TO-END RUNTIME FLOW TRACE

### 2.1 The one flow that works

`User → Intent → Capability → Business Service → Response`, traced against code:

```
CLIENT
  FloatingAssistant.tsx:1231   POST /api/intelligence/conversation/turn
     │                          (mounted App.tsx:175, inside ProtectedRoute)
     ▼
ROUTE
  routes.ts:11790              auth: inline req.isAuthenticated()
  routes.ts:11811                await import(conversation-gateway.js)
  routes.ts:11812                conversationGateway.processUserTurn(
  routes.ts:11825                  ..., intelligencePlatform.contextFor(user))
     │                                    └─ server-resolved identity; never client-suppliable
     ▼
GATEWAY  conversation-gateway.ts:892  processUserTurn
   1  get/create conversation                        :898
   2  get/open active thread                         :901-904
   2b READ personality  storage.getUserPreferences   :911-912   ⚠ reads a column that does not exist
   3  prior entity refs (pronoun resolution)         :915
   4  assemble Context Frame                         :918-924
   4b read last 7 turns  ← MEMORY                    :937
   5  record user turn                               :955
   ─────────────────────────────────────────────────────────
      buildGroundedResponse                          :336 (called :940)
   6  detectWriteIntent → honest gap, no LLM         :368-395  ⚠ NOT voiced (hardcoded string)
   6b provider-unavailable early return              :399-408  ⚠ undocumented, not voiced
   7  intentResolver.resolve(utterance, hints)       :419      ← patternIntentResolver (:878)
   8  queryCapability × N in parallel                :429
        └─ handleIntent → intelligencePlatform.handle(intent, identity)   :264-265, :293-300
   8b INT42 sequential composition (uplift → FI)     :444-463  ⚠ unreachable, see §3.13
   8c native discovery                               :517
   8d assembleKnowledge (COMP5)                      :524      ← classifyTurn now lives here
   9  fallbackState = knowledgePackage.gapState      :538
      └─ voiceFallback(state, personalityId, …)      :556      ✅ Behaviour Engine
      └─ voiceGuidanceSuggestions(recovery, …)       :582      ✅ Behaviour Engine (inert, §3.5)
      └─ voiceGuidanceSuggestions(success,  …)       :600      ✅ Behaviour Engine (inert, §3.5)
   9b enrichment: companion + nutrition + household  :611,:621,:631
  10  LLM prompt assembly                            :701-734
        identity → HARD RULES 1–5 → context-use →
        food-conversation → PERSONALITY (:725) →
        TODAY → CONTEXT DATA → RESPONSE FORMAT
      ILlmProvider.complete(...)                     (:754 try / :764 voiceFallback on throw)
  11  record assistant turn; persist action proposals :958, :977
      recordGuidanceEvents (write-only)               :988
      return TurnResult                               :1011
     │
     ▼
INTENT ENGINE  intelligence-platform.ts:233  handle() → this.engine.route()
  intent-engine.ts:55   LOCATE      registry.get(capabilityId)
  intent-engine.ts:65   VALIDATE    registry.supports(capabilityId, verb)
  intent-engine.ts:84   PERMISSION  canInvokeCapability()      → permissions.ts:86
  intent-engine.ts:90   CONFIRM     confirmationFor()          → permissions.ts:113
  intent-engine.ts:102  INVOKE      registry.getHandler() → handler(intent, context)
  intent-engine.ts:119  RESPOND     IntentOutcome
     │
     ▼
CAPABILITY  handlers/<cap>-read-handler.ts   verb switch + param coercion, no business logic
     ▼
PORT        handlers/<cap>-read-port.ts      dynamic import — no DB conn at module load
     ▼
BUSINESS SERVICE   server/lib/*.ts | server/storage.ts | server/services/*
     ▼
RESPONSE    routes.ts:11827-11860  { text, entityRefs, discoveries, guidance,
                                     enrichment, actions, fallbackState, outcome }
```

**This flow is intact.** Permission and confirmation are enforced in the engine and cannot be bypassed from the gateway (the gateway passes no `options`, so `confirmed` is `undefined` and any non-read verb returns `confirmation_required` before invoking).

### 2.2 Where the flow breaks

| # | Break | Location | Consequence |
|---|---|---|---|
| B1 | **The observation seam has no route.** | `use-companion-observations.ts:28` fetches a path registered nowhere | Dead-to-dead: the hook has zero importers, so no 404 is ever issued. The feature simply does not exist. |
| B2 | **Personality read returns `undefined`, always.** | `conversation-gateway.ts:912` | `normalizePersonalityId(undefined)` → `"companion"`. Five voices unreachable. TS2339 at this line. |
| B3 | **Write-intent gap bypasses the Behaviour Engine.** | `conversation-gateway.ts:368-395` | Hardcoded refusal string. `personalityId` is in scope and unused. CPA1 §5.1 step 6 claims `voiceFallback()` voices it. |
| B4 | **Provider-unavailable path bypasses everything.** | `conversation-gateway.ts:399-408` | Hardcoded string, `fallbackState: undefined`, `outcome: undefined`. Absent from CPA1's step list. Also poisons the benchmark (§6.4). |
| B5 | **`classifyTurn` is a dead import.** | `conversation-gateway.ts:76` | Imported, never called. Classification moved into `knowledge-assembly.ts:137` under COMP5. |
| B6 | **`prioritizeGuidance` is a no-op.** | `behaviour-engine.ts:90-103` | Ranks by `priorities.indexOf(domain)`, but `priorities` are adjectives, not domains. See §3.5. |
| B7 | **`denied` and `confirmation_required` collapse to `no-knowledge`.** | `conversation-gateway.ts:313` | Safe (gateway is read-only) but lossy: a permission failure is reported to the user as "I don't know that." |
| B8 | **3 capabilities are bound but unroutable.** | `food-intelligence`, `opportunity-delivery`, `evidence-learning` | No resolver matcher, no HTTP route. See §3.12. |
| B9 | **`uplift` is a phantom capability.** | binding + handler + port + gateway consumer exist; no registry entry | `conversation-gateway.ts:444` branch is unreachable. See §3.13. |
| B10 | **`turn-outcome-store` durable sink never registered.** | `turn-outcome-store.ts:150` | `platform_turn_outcomes` never written. Learning input is a 200-entry in-memory array. See §3.17. |

---

## 3. CAPABILITY-BY-CAPABILITY AUDIT

Legend: ✅ Active · 🟡 Partially wired · 🔴 Unwired · ⚪ Architecture only

---

### 3.1 Conversation Lifecycle (Gateway) — ✅ Active

| Field | Value |
|---|---|
| **Architecture owner** | TIP1/TIP3 spine; CPA1 §5.1 (voice seam) |
| **Runtime owner** | `ConversationGateway` singleton |
| **Implementation** | `server/intelligence/conversation/conversation-gateway.ts` (1055 lines) |
| **Entry point** | `POST /api/intelligence/conversation/turn` → `routes.ts:11790` → `processUserTurn` (`:892`) |
| **State** | ✅ Active |

**Evidence.** Singleton constructed at `conversation-gateway.ts:1053`. Sole production caller is `routes.ts:11812`. Two secondary reads: `getRecentTurns` → `routes.ts:11874`; `getConversationState` → `routes.ts:11888`. **[EXECUTED]** module imports cleanly against the working tree (§1.2).

Pipeline drift from CPA1 §5.1's 11-step list: two unlisted stages exist (INT42 composition `:444-463`; `assembleKnowledge` `:524-532`), two unlisted early returns exist (`:399-408`, `:754-773`), and `classifyTurn` is imported but never called (`:76`). The *safety* properties CPA1 asserts all hold; the *step list* is stale.

**User impact.** The Companion answers. This is the platform's only conversational surface and it works.

**Benchmark impact.** Fully exercised — `server/tests/benchmark/companion-turn.ts:34` calls the real `processUserTurn`. However `test-intelligence-conversation-gateway.ts` **is not in `npm test`** (§6.5).

---

### 3.2 Intent Resolver — 🟡 Partially wired

| Field | Value |
|---|---|
| **Architecture owner** | CPA1 §3 ("Intent resolution, NL → typed intent"); TIP2 verb taxonomy |
| **Runtime owner** | `patternIntentResolver` singleton |
| **Implementation** | `pattern-intent-resolver.ts` (1519 lines); interface in `intent-resolver.ts` (types only, no impl) |
| **Entry point** | `conversation-gateway.ts:878` (default injection) → `:419` (`resolve()`) |
| **State** | 🟡 Partially wired |

**Evidence. [EXECUTED]** exhaustive symbol counts over `pattern-intent-resolver.ts`:

```
verbs emitted:        search ×70, read ×17, explain ×6      →  3 of 20 declared verbs
capabilities emitted: 18 distinct
food-intelligence: 0   opportunity-delivery: 0   evidence-learning: 0   uplift: 0
```

**17 of the registry's 20 verbs can never be produced by the resolver:** `recommend, report, review, approve, add, delete, move, replace, generate, import, export, analyse, compare, optimise, share, order, suggest`.

Consequence: **no write verb ever originates from the resolver.** `planner.add` / `shopping.add` are proposed by `companion-actions.ts` (gated on `canExecute`, `:79`) and executed only via `routes.ts:12038`.

**User impact.** Anything phrased outside the ~93 matcher patterns falls through to `no-route` and receives an honest-gap refusal. In the last benchmark run this was **34 of 100 questions**, including `PH-001 "What diet am I following?"` — a `profile.read` question the platform is fully capable of answering.

**Benchmark impact.** Catastrophic and invisible: `no-route` is classified as an *honest gap*, the highest-rewarded outcome (§6.2).

---

### 3.3 Intent Engine — ✅ Active

| Field | Value |
|---|---|
| **Architecture owner** | CPA1 §3 ("Intent Engine — validate → confirm → invoke"); TIP2 §5 confirmation tiers |
| **Runtime owner** | `IntentEngine`, instantiated once |
| **Implementation** | `server/intelligence/intent-engine.ts` (142 lines) |
| **Entry point** | `intelligence-platform.ts:160` (`new IntentEngine(registry)`) → `:234` (`engine.route()`) |
| **State** | ✅ Active |

**Evidence.** `handle()` is a **pure one-line delegation** to the engine — it is not an alternative path:

```ts
// intelligence-platform.ts:233-235
handle(intent, context, options?) { return this.engine.route(intent, context, options); }
```

Contract is a 6-step pipeline (`intent-engine.ts:45`), not the 3-step "validate → confirm → invoke" CPA1 §3 names: **LOCATE → VALIDATE → PERMISSION → CONFIRM → INVOKE → RESPOND**.

- Permission enforced: `intent-engine.ts:84` → `permissions.ts:86`
- Confirmation enforced: `intent-engine.ts:90-99` → `permissions.ts:113`
- Only runtime caller that sets `{ confirmed: true }`: `routes.ts:12038` (action confirm), after re-checking ownership (`:12031`) and idempotency (`:12022`)

Three runtime call sites of `handle()`: gateway (`:265`, no options), action-confirm (`routes.ts:12038`), and `opportunity-delivery/framework.ts:306` (internal fan-out).

**Correction to CPA1:** the gateway holds no reference to the Intent Engine. It calls only the *resolver*. The engine is reached transitively and unavoidably through `handle()`. The gateway therefore **cannot bypass validate/permission/confirm** — a stronger guarantee than CPA1 states.

**User impact.** Strong-tier actions genuinely require assent. Nothing can write without an explicit confirm round-trip.

**Benchmark impact.** Exercised transitively on every turn. Hard-gate G3 (claimed a write instead of proposing) is one of only two gates the scorer can actually assign.

---

### 3.4 Capability Registry — 🟡 Partially wired

| Field | Value |
|---|---|
| **Architecture owner** | CPA1 §3, §7; TIP2 |
| **Runtime owner** | `CapabilityRegistry` (`capability-registry.ts:728`) |
| **Implementation** | `capability-registry.ts` (839 lines) + 22 files in `bindings/` |
| **Entry point** | 21 flat side-effecting `bind*Capability(...)` calls at `intelligence-platform.ts:266-287` |
| **State** | 🟡 Partially wired |

**Evidence.** 23 seed entries (`SEED_CAPABILITIES_BASE`, `:368`). There is **no `registerAll()`** — registration is a flat sequence of 21 module-scope calls.

| Class | Count | Detail |
|---|---|---|
| Bound & `available` | 21 | planner, shopping, nutrition-knowledge, meals, meal-discovery, diary, profile, partners, pantry, analyser, household, templates, + 6 discovery bindings, food-intelligence, opportunity-delivery, evidence-learning |
| Registered, never bound | 2 | `administration` (`:664`), `developer` (`:678`, `availability: "never"`) |
| Bound but **unroutable** | 3 | `food-intelligence`, `opportunity-delivery`, `evidence-learning` — §3.12 |
| **Phantom** (binding, no registry entry) | 1 | `uplift` — §3.13 |

**Three additional registry defects (Grep-verified):**

1. **Dead gap entry.** `capability-registry.ts:716` declares an honest-gap message for `planner`/`delete`. But `findGap()` is only consulted inside the `!supports()` branch (`intent-engine.ts:65-74`), and `planner.supportedIntents` **includes** `"delete"` (`:376`). The message can never surface.
2. **`capabilityClass` and `aiAccess` are write-only decoration.** `types.ts:74` claims `CapabilityClass` "drives the confirmation tier". `confirmationFor()` (`permissions.ts:113-142`) reads only `verb` and `permissions.audited`. Both fields are assigned 23× and **read by nothing** anywhere in `server/`, `client/`, `shared/`.
3. **`ownershipScoped` is not enforced by the platform** (`permissions.ts:83-84` — delegated to each handler). Declared on all 23 capabilities, read by none.

**User impact.** The registry correctly refuses `administration`/`developer`. The three unroutable capabilities represent shipped, tested reasoning engines that no user utterance can reach.

**Benchmark impact.** The fixture's `capability` expectations are normalised through a hand-maintained alias table (`expectations.ts:70-90`). D4 (Capability Routing) is 12% of weight and floors at 3/12 even on total routing collapse (§6.3).

---

### 3.5 Behaviour Engine — 🟡 Partially wired (active but degenerate)

| Field | Value |
|---|---|
| **Architecture owner** | CPA1 §4.2 — "the single phrasing-transform layer" |
| **Runtime owner** | `behaviour-engine.ts` (plain module) |
| **Implementation** | `server/intelligence/conversation/behaviour-engine.ts` (175 lines) |
| **Entry point** | `conversation-gateway.ts:85-89` (import) → 5 call sites |
| **State** | 🟡 Partially wired |

**Evidence — which exports are live:**

| Export | Line | Runtime callers | State |
|---|---|---|---|
| `systemPromptFragment` | `:56` | `conversation-gateway.ts:725` | ✅ live |
| `voiceFallback` | `:64` | `conversation-gateway.ts:556`, `:764` | ✅ live |
| `voiceGuidanceSuggestions` | `:106` | `conversation-gateway.ts:582`, `:600` | 🟡 live but **inert** |
| `prioritizeGuidance` | `:90` | via `voiceGuidanceSuggestions` | 🔴 **no-op** |
| `voiceGuidanceLabel` | `:77` | via `voiceGuidanceSuggestions` | 🔴 no-op under default (`prefix: ""`) |
| `getBehaviourProfile` | `:46` | **ABSENT** (grepped) | 🔴 dead |
| `buildGreeting` | `:127` | tests only | 🔴 dead |
| `buildCelebration` | `:132` | tests only (+ dead `phraseObservation`) | 🔴 dead |
| `phraseGrowth` | `:141` | tests only (+ dead `phraseObservation`) | 🔴 dead |
| `phraseObservation` | `:158` | tests only | 🔴 dead |

CPA1 §4.2 claims *"plus two call sites in `server/routes.ts` (`phraseGrowth` for the growth-insight route, `phraseObservation` for the observations route)"*. **Grep of `routes.ts` for all eleven phrasing/observation/growth symbols: zero matches.** `routes.ts` statically imports exactly one thing from `server/intelligence/`: `intelligencePlatform` (`routes.ts:64`).

**The `prioritizeGuidance` defect. [EXECUTED]** — a purpose-built probe feeding all 7 real Companion Card domains through all 6 personalities:

```
input order: shopping,nutrition,planner,meal,pantry,diary,household

companion  reorder=NO-OP  order=shopping,nutrition,planner,meal,pantry,diary,household
friend     reorder=NO-OP  order=shopping,nutrition,planner,meal,pantry,diary,household
coach      reorder=NO-OP  order=shopping,nutrition,planner,meal,pantry,diary,household
chef       reorder=YES    order=nutrition,shopping,planner,meal,pantry,diary,household
teacher    reorder=NO-OP  order=shopping,nutrition,planner,meal,pantry,diary,household
sergeant   reorder=NO-OP  order=shopping,nutrition,planner,meal,pantry,diary,household
```

**Root cause.** `prioritizeGuidance` ranks by `priorities.indexOf(domain)` (`behaviour-engine.ts:96`). The 7 real domains are `meal, planner, shopping, pantry, diary, nutrition, household` (`companion-guidance.ts:75-92`). But the `priorities` lists are **adjectives, not domains**:

```
companion: ["balanced","trusted","calm","supportive"]        ∩ domains = ∅
friend:    ["encouragement","simplicity","reassurance",…]    ∩ domains = ∅
coach:     ["goals","progress","accountability","action"]    ∩ domains = ∅
chef:      ["flavour","cooking","ingredients","nutrition"]   ∩ domains = {nutrition}
teacher:   ["education","science","explanation",…]           ∩ domains = ∅
sergeant:  ["action","discipline","efficiency",…]            ∩ domains = ∅
```

Every domain ranks `priorities.length`, the stable sort falls through to `originalIndex`, and the function is the identity. `chef` reorders only by the coincidence that `"nutrition"` is both a food adjective and a card domain.

CPA1 §4.2 states: *"Stage 3 — 'each personality prioritises the same intelligence differently.'"* **This has never been true for any personality, and cannot be true for the only reachable one.**

**Prompt-position drift.** CPA1 §5.1 says the fragment is *"a labelled, additive 6th paragraph, always AFTER the 5 hard grounding/firewall rules."* Actual assembly (`conversation-gateway.ts:701-734`): identity → HARD RULES 1–5 → *context-use block* → *food-conversation block (with its own numbered 1.–5. list)* → **PERSONALITY (`:725`, paragraph 8)** → TODAY → CONTEXT DATA → RESPONSE FORMAT. The safety invariant holds (strictly after the hard rules, explicitly labelled "never overrides rules 1–5"). The structural claim is stale, and the food-conversation block's numbered list visually collides with the hard-rule numbering.

**User impact.** The Companion has exactly one voice, and guidance is never reprioritised. `voiceFallback` *does* produce real, personality-shaped honest-gap text under the default voice — this is the one genuinely observable Behaviour Engine behaviour.

**Benchmark impact.** D6 (Voice & Companion Tone) is 5% of weight and scored **3.8/5** — on a run where `personalities: [{"key":"default","n":100}]`. A single degenerate row. The dimension measures nothing.

---

### 3.6 Personality Registry — 🔴 Unwired

| Field | Value |
|---|---|
| **Architecture owner** | CPA1 §4.1 |
| **Runtime owner** | `personality-registry.ts` (pure data) |
| **Implementation** | `personality-registry.ts` (427 lines), `shared/companion-personality.ts` (64 lines) |
| **Entry point** | `conversation-gateway.ts:912` — `normalizePersonalityId(prefs?.companionPersonality)` |
| **State** | 🔴 Unwired |

**Evidence.** CPA1 §3 and §4.1 declare the owner of the user's chosen voice to be *"`user_preferences.companionPersonality` (one additive column, `notNull`, default `'companion'`)"*.

```
grep -n "companionPersonality" shared/schema.ts                     → ABSENT
git show HEAD:shared/schema.ts | grep companionPersonality          → ABSENT
git log --all -S companionPersonality -- shared/schema.ts           → no commits
```

**The column does not exist and has never existed.** The gateway's read is a live TypeScript error:

```
server/intelligence/conversation/conversation-gateway.ts(912,57):
  error TS2339: Property 'companionPersonality' does not exist on type
  '{ id: number; userId: number; dietTypes: string[]; … }'
```

Four further blocks, any one of which alone would pin the voice:

1. **No write route.** `PUT /api/user/preferences` (`routes.ts:5298`) validates through `preferencesSchema` (`:5283`), which omits the field. Zod strips unknown keys — a client PUT is silently dropped. `PATCH /api/user/preferences` (`:1027`) accepts only `measurementPreference`.
2. **No UI.** Grep of `client/` for `companionPersonality` / `PersonalityId` → **zero hits**. The admin tile at `admin-page.tsx:49` describes *"Manage companion personality and behavior"* but links to a page rendering read-only benchmark charts (`admin-intelligence-page.tsx:544`).
3. **`normalizePersonalityId(undefined)` → `"companion"`** (`shared/companion-personality.ts:31`). Always.
4. **The benchmark passes `"default"`** (`routes.ts:8704`, `:8866`, `run-benchmark.ts:55`) — not one of the six valid ids, so it also normalizes to `"companion"`.

**`ExperienceProfile` is worse than CPA1 §4.5 admits.** CPA1 correctly says `avatarId`/`colorTheme`/`voiceProfileId` have no client renderer. It does not say that `greetings`/`celebrations` are also dead: `buildGreeting` and `buildCelebration` have **zero non-test callers**. `FloatingAssistant.tsx:1465` hardcodes `"Hi, I'm Apple!"`.

**User impact.** Six voices are shipped, tested (42 passing assertions) and documented. **Users can reach exactly one and can never change it.**

**Benchmark impact.** Zero — the benchmark's personality axis is a single `"default"` row.

---

### 3.7 Observation Engine — 🔴 Unwired

| Field | Value |
|---|---|
| **Architecture owner** | CPA1 §4.3, §5.2 |
| **Runtime owner** | **none** |
| **Implementation** | `observation-engine.ts` (265 lines) |
| **Entry point** | CPA1 §5.2: `GET /api/intelligence/companion/observations` — **route does not exist** |
| **State** | 🔴 Unwired |

**Evidence.**

```
grep -rn "companion/observations" server/                        → ABSENT
git log --all -S 'companion/observations' -- server/routes.ts    → no commits
git log --all -S 'companion/observations'                        → 0b1f2f7 (the CLIENT HOOK only)
```

**The route has never existed in any commit in the repository's history.** The only two files registering routes are `server/routes.ts` and `server/auth.ts`; there is no `express.Router()` anywhere in `server/`.

The engine's only non-test importer is `behaviour-engine.ts:37`, and it imports **only** `toGrowthPhraseInputs` and the `Observation` *type* — not a single producer:

| Symbol | Line | Runtime callers |
|---|---|---|
| `observeNutritionTrend` | `:114` | none |
| `observeStreak` | `:135` | none |
| `observeDiversity` | `:155` | none |
| `observeOpportunities` | `:191` | none |
| `observeSeasonal` | `:215` | none |
| `applySilenceRules` | `:242` | none |
| `MAX_OBSERVATIONS_PER_MOMENT` | `:233` | none |

**A second Silence Rules mechanism exists.** `knowledge-assembly.ts:185` exports its own `applySilenceRules` (dedupe-by-source, sort-by-priority, cap) — a structurally identical concept, in a different module, over a different item type. It is **also never called** (grep: definition only). CPA1 §12 non-negotiable: *"Any new Behaviour Engine, Observation Engine, or Personality Registry created anywhere else in the codebase, rather than extended in place — stop."* Two dormant copies of the same gate now exist. CPA1 §10's "One Observation Engine — Confirmed" is no longer accurate.

**Client side is equally dead.** `use-companion-observations.ts` has **zero importers** (grep of all `client/`). Were it called, the 404 would fall through to the SPA catch-all, return HTML, and `res.json()` (`:35`) would throw a parse error — not the clean empty-state its comment promises.

**User impact.** The Companion never notices anything. No streak milestone, no plant-diversity milestone, no nutrition-trend reflection, no seasonal highlight, no ambient opportunity. The entire EWX1 "Living Companion Experience" is invisible.

**Benchmark impact.** None — the benchmark cannot see it and does not try. The 100-question fixture contains no observation-shaped question.

---

### 3.8 Companion Growth — 🔴 Unwired

| Field | Value |
|---|---|
| **Architecture owner** | CPA1 §4.4 |
| **Runtime owner** | none |
| **Implementation** | `companion-growth.ts` (103 lines) |
| **Entry point** | CPA1 §4.4 names `GET /companion/growth-insight` — **route does not exist** |
| **State** | 🔴 Unwired |

**Evidence.** `git log --all -S 'growth-insight'` → the string appears only in `0b1f2f7`'s **documentation**. Grep of `server/` and `client/` → **zero hits outside `docs/`**.

CPA1 §11 **G2** states: *"`GET /api/intelligence/companion/growth-insight` **remains registered and functional** but is called by no client code."* This is false on both counts. It is not registered and not functional.

Two implementation records compound the error: `IA4:108` and `IA2:85` both cite the route at a specific line, `server/routes.ts:11401`. That line at HEAD is inside the INT38 guidance-click handler.

`computeGrowthSignal` (`:62`) has exactly two callers: `observation-engine.ts:114` (itself dead) and a test. The module's honest `null`-on-thin-data discipline is sound and untested in production because it never runs.

**User impact.** The Companion never says "your Health Score has moved from X to Y." No growth, no familiarity over time.

**Benchmark impact.** None.

---

### 3.9 Companion Observations (the seam) — 🔴 Unwired

| Field | Value |
|---|---|
| **Architecture owner** | CPA1 §5.2 |
| **Runtime owner** | none |
| **Implementation** | `client/src/hooks/use-companion-observations.ts` (45 lines) — orphan |
| **Entry point** | none |
| **State** | 🔴 Unwired |

**Evidence.** CPA1 §5.2 describes the seam in operational detail: *"`server/routes.ts`'s handler fetches health trends, streak, plant diversity, and opportunities in parallel (each independently best-effort)… applies `applySilenceRules` (cap 2), then voices each surviving observation via the same `phraseObservation`… The client (`use-companion-observations.ts`) calls this exactly once, gated `enabled: isOpen && !hasHistory`."*

**None of this exists.** No handler. No parallel fetch. The hook's real signature is `useCompanionObservations(enabled = true)` (`:38`); the described gate appears nowhere in the codebase. `FloatingAssistant.tsx`'s only `enabled:` is on the turns query (`:1217`, `enabled: isOpen`).

`OBSERVATION_CATEGORY_INTERACTION_KIND` (`shared/companion-interaction.ts:43`) has **zero readers** in `server/` or `client/`.

---

### 3.10 Delight Layer — 🔴 Unwired

| Field | Value |
|---|---|
| **Architecture owner** | CPA1 §3 ownership row ("Motion/delight primitives"); §4.5 classifies it **"Mature"** |
| **Runtime owner** | none |
| **Implementation** | `client/src/lib/companion-delight.ts` (66 lines) |
| **Entry point** | none |
| **State** | 🔴 Unwired |

**Evidence.** `grep -rn "companion-delight" client/` → **zero importers**. `variantForInteraction` (`:45`) and `prefersReducedMotion` (`:63`) are called by nobody. `FloatingAssistant.tsx:17` imports `framer-motion` directly and hand-rolls every transition (e.g. `:1397`, `:1354-1367`).

The module's own header is honest about why: *"consumed only where a NEW moment (the Observation banner, Stage 7) needed a variant."* **That consumer was never built.** The Delight layer is dead because the Observation Engine is dead.

CPA1 §4.5 lists it under **"Mature"**, alongside Companion Cards. It is the only "Mature" item with no consumers.

**Interaction taxonomy.** `INTERACTION_KINDS` declares 9 values. CPA1 G4 says *"6 wired to a real producer."* The actual mapping (`companion-interaction.ts:43-51`) covers 7 categories resolving to **5 distinct kinds** (`reflection, milestone, reminder, discovery, seasonal`), leaving `welcome, encouragement, celebration, completion` unmapped — and the mapping itself has zero readers, so **all 9 are effectively unwired.**

**User impact.** No motion vocabulary, no `prefers-reduced-motion` handling in Companion moments. (FloatingAssistant's own animations are unaffected — framer-motion handles reduced motion internally.)

---

### 3.11 FloatingAssistant / Companion Cards — ✅ Active

| Field | Value |
|---|---|
| **Architecture owner** | CPA1 §3 ("Panel presence, personality label, observation banner"), `THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md` |
| **Runtime owner** | `FloatingAssistant.tsx` (57 KB) |
| **Implementation** | `client/src/components/conversation/FloatingAssistant.tsx`, `companion-card.ts`, `companion-action.ts` |
| **Entry point** | `App.tsx:175`, inside `ProtectedRoute` (auth + onboarding gated, `App.tsx:147-148`) |
| **State** | ✅ Active — with 3 of its 3 CPA1-named extensions absent |

**Evidence.** Mounted globally on every protected route. POSTs to `/api/intelligence/conversation/turn` (`:1231`). Renders server-produced `discoveries` through the pure `buildCompanionCardView` (`companion-card.ts:274`, called `:362`); `sanitizeSummary` (`:915`) strips markdown and URLs per the Card Experience Principle. Hits `/turns`, `/turns/:id/feedback`, `/turns/:id/guidance-click`, `/actions/:id/confirm`, `/actions/:id/cancel`. Companion Cards are **server-produced data, client-transformed presentation** — correct per the principle.

CPA1 §3 says FloatingAssistant owns *"Panel presence, personality label, observation banner (pre-existing, **additively extended**)."* **None of the three extensions exist:** no personality label, no observation banner, and the greeting is hardcoded (`:1465`).

**Dead data, not dead imports.** All 21 lucide icons and every named import are used. But `TurnApiResponse.fallbackState` (`:197`) is declared, documented, and **never read** — no render path branches on it, so the four-state honest-gap taxonomy reaches the client and is discarded. `ConversationSurface` includes `"household"`, `"templates"`, `"voice"` (`:54,58,61`) which `useSurface()` (`:63-74`) can never return.

**[EXECUTED]** `npx tsc --noEmit` → **0 errors in `client/`**. The five staged companion-component deletions broke nothing; they were already orphaned.

**User impact.** The panel works and is the platform's whole visible Companion.

---

### 3.12 Guidance / Recommendation Pipeline — 🟡 Partially wired

| Field | Value |
|---|---|
| **Architecture owner** | CPA1 §4.5 ("Guidance"); INT38/INT39 |
| **Runtime owner** | `companion-guidance.ts` |
| **Implementation** | `companion-guidance.ts` (211 lines), `companion-guidance-analytics.ts`, `companion-learning-recommender.ts` |
| **Entry point** | `conversation-gateway.ts:510` (success), `:582` (recovery) |
| **State** | 🟡 Partially wired |

**Evidence — CPA1's `canExecute` claim holds.** `companion-guidance.ts:106-107` defines `defaultCanExecute` as a direct delegate to `intelligencePlatform.canExecute`; both public builders default to it (`:189-192`, `:207-210`); `:161` hard-filters every candidate. The gateway passes no override. **Verified.**

**But the recommendation pipeline never reaches a user.** `companion-learning-recommender.ts` has exactly one importer: `routes.ts:12228`, inside `app.post("/api/intelligence/learning/snapshot", assertAdmin, …)`. Output → `res.json` → `admin-companion-intelligence-page.tsx:467`, plus `pending` rows read back only by admin routes. `routes.ts:12283-12285` states the intent explicitly: reviewing *"can NEVER change production routing."*

Its **input is not a table.** `generateAndQueueRecommendations` (`:238`) reads `getUnsuccessfulQueryLog()` — a process-local 200-entry ring buffer (`turn-fallback.ts:271-320`), wiped on every restart.

**Three bound-but-unroutable capabilities.** `food-intelligence`, `opportunity-delivery`, `evidence-learning` are bound (`intelligence-platform.ts:285-287`) and executable, but:
- the resolver emits none of them (**[EXECUTED]** grep: 0 hits each);
- no HTTP route invokes them;
- the only `handle(…, {confirmed:true})` caller (`routes.ts:12038`) can only ever build intents for `planner`/`shopping` (`companion-actions.ts:108`, `:130`).

`opportunity-delivery`'s internal fan-out to `food-intelligence` (`framework.ts:306`) is real but is itself only triggered from a capability nothing can reach.

**Both presentation channels over `opportunity-delivery` are dead.** CPA1 §7/G3 carefully names two legitimate channels and warns *"A future engineer must not 'resolve' this apparent overlap by deleting either channel."* In fact:
- Channel A (Companion observations) — route absent, hook orphaned (§3.7).
- Channel B (`FoodOpportunitiesPanel.tsx` / `GET /api/intelligence/food-opportunities`) — **route absent** (`git log --all -S` → never existed); panel has zero importers.

Same for `use-learning-signals.ts` → `GET /api/intelligence/learning-signals`, also unregistered.

**[EXECUTED]** Client-vs-route cross-check, all `/api/intelligence/*` literals in `client/src`:

```
OK       /api/intelligence/benchmark/bundle
OK       /api/intelligence/benchmark/run
OK       /api/intelligence/benchmark/runs
MISSING  /api/intelligence/companion/observations
OK       /api/intelligence/conversation/turn
OK       /api/intelligence/conversation/turns
MISSING  /api/intelligence/food-opportunities
OK       /api/intelligence/learning/dashboard
OK       /api/intelligence/learning/recommendations
MISSING  /api/intelligence/learning-signals
OK       /api/intelligence/learning/snapshot
```

**User impact.** Guidance suggestions *do* reach the user, correctly gated. Ambient opportunities and learning signals reach nobody, on any surface.

---

### 3.13 `uplift` — 🔴 Unwired (phantom capability)

| Field | Value |
|---|---|
| **Architecture owner** | INT42 Capability Composition Foundation |
| **Runtime owner** | none |
| **Implementation** | `bindings/uplift.ts`, `handlers/uplift-read-handler.ts`, `handlers/uplift-read-port.ts`, `capability-composition.ts` |
| **Entry point** | none |
| **State** | 🔴 Unwired |

**Evidence. [EXECUTED]**

```
grep -c 'id: "uplift"' server/intelligence/capability-registry.ts   → 0   (NOT REGISTERED)
grep -c "bindUplift" server/intelligence/intelligence-platform.ts   → 0   (NEVER BOUND)
grep -c "uplift" server/intelligence/pattern-intent-resolver.ts     → 0   (NO MATCHER)
```

INT42 is half-landed. Binding + handler + port + a gateway consumer + a test all exist; the **registry entry and the resolver matcher were never written.**

Consequences:
- `conversation-gateway.ts:444` — `queryable.some(ri => ri.capability === "uplift")` is permanently `false`. `deriveFoodIntelligenceExplainFromUplift` (`capability-composition.ts:102`) never fires. The composition stage (`:444-463`) is dead.
- If `bindUpliftReadCapability` were ever called, `capability-registry.ts:764` would throw `Cannot bind handler: unknown capability "uplift"`.
- `server/tests/test-intelligence-uplift-binding.ts:146` asserts `getCapability("uplift")!.availability === "available"` — **this test cannot pass**. It is not in `npm test`.

**This is the sole path by which `food-intelligence` could ever have been reached from a user turn.**

---

### 3.14 Memory Integration — ✅ Active

| Field | Value |
|---|---|
| **Architecture owner** | CPA1 §3 ("Conversation history", "Context Frame"); TIP3 |
| **Runtime owner** | `DatabaseConversationStore`, `context-frame-assembler.ts` |
| **Implementation** | `conversation-store.ts`, `context-frame-assembler.ts` |
| **Entry point** | `conversation-gateway.ts:937` (history), `:918` (frame) |
| **State** | ✅ Active — the loop is closed |

**Evidence.** Turns persist (`conversation-store.ts:250`, `INSERT INTO conversation_turns`) and are read back (`:284`, `SELECT … ORDER BY created_at DESC LIMIT $2`). The gateway reads the last 7 (`:937`) and injects the last 5 into the prompt:

```ts
// conversation-gateway.ts:691-694, 739-741
const historyLines = recentHistory.slice(-5)
  .map(t => `${t.role === "user" ? "User" : "Apple"}: ${t.utterance}`).join("\n");
messages.push({ role: "system", content: `CONVERSATION HISTORY (most recent last):\n${historyLines}` });
```

**Turns are not stateless. Memory is real.**

**Correction to a common misreading:** the Context Frame does **not** carry history. `ContextFrame` (`context-frame-assembler.ts:71-82`) is pointer IDs + `temporalAnchor` only. Its sole carry-over is `priorEntityRefs` for pronoun resolution (`:120,136,145`). History reaches the LLM on a separate path. CPA1 §3's split ("Conversation history" vs "Context Frame — per-turn derived pointers") is accurate.

**One latent defect.** `closeThread()` (`conversation-store.ts:236`) has **zero callers**. `getActiveThread` selects `WHERE closed_at IS NULL`, so a user's thread is opened once and never closed — one immortal thread accumulating forever. Bounded in the prompt (last 5), unbounded in the table.

---

### 3.15 Companion Actions (delegation) — ✅ Active

| Field | Value |
|---|---|
| **Architecture owner** | INT40 |
| **Runtime owner** | `companion-actions.ts` + `companion-action-store.ts` |
| **Entry point** | `conversation-gateway.ts:645` (propose), `routes.ts:12003` (confirm) |
| **State** | ✅ Active |

**Evidence.** The **only genuinely closed write → read → execute loop in the platform.** Gateway drafts proposals (`:645`), persists them (`:977`, `companion_action_proposals`), the confirm route reads them back (`routes.ts:12011`), re-checks ownership (`:12031`) and idempotency (`:12022`), and executes via `intelligencePlatform.handle(intent, context, { confirmed: true })` (`:12038`) — the only confirmed-write path in the whole application.

Proposals are gated on `canExecute` (`companion-actions.ts:79`) and can only target `planner` (`:108`) or `shopping` (`:130`).

**A safety note on `detectWriteIntent`.** `conversation-gateway.ts:225-229` adds an INTQ8 advisory-frame escape hatch: `if (hasAdvisoryFrame && hasMutationVerb) return null;`. `"can I add chicken to my list"` is reclassified as a *read* and routed to the resolver + LLM, while `"add chicken to my list"` returns the gap. The documented safety argument (`:220-224`) is that the capability layer is read-only anyway — **sound today, and load-bearing on that invariant.** If a write verb ever becomes resolver-reachable, this guard's false negatives become live mutations. Worth naming as a standing constraint.

---

### 3.16 Enrichment / Knowledge Assembly — ✅ Active

| Field | Value |
|---|---|
| **Architecture owner** | INT41 / COMP5 / COMP6 / NUT1 / FI5 |
| **Runtime owner** | `knowledge-assembly.ts`, `companion-enrichment.ts`, `nutrition-enrichment.ts`, `household-nutrition-enrichment.ts` |
| **Entry point** | `conversation-gateway.ts:524`, `:611`, `:621`, `:631` |
| **State** | ✅ Active |

**Evidence.** All four run per turn. `assembleKnowledge` (`:524`) now **owns honest-gap classification** — it calls `classifyTurn` (`knowledge-assembly.ts:137`) and surfaces it as `gapState`, consumed at `conversation-gateway.ts:538`. The gateway's own `classifyTurn` import (`:76`) is dead. CPA1 §5.1 step 9 still attributes classification to the gateway.

Enrichment is merged and capped (`:635-638`) and then **injected into the LLM prompt** as `### Related Context (enrichment)` (`:680-688`) — it crosses the grounding boundary and is presented to the model as ground truth. Correct per COMP6, and worth naming: enrichment content is subject to the same "answer only from CONTEXT DATA" rule it helps populate.

`knowledge-assembly.ts` has **no dedicated test file.**

---

### 3.17 Learning Pipeline — 🟡 Partially wired (write-only)

| Field | Value |
|---|---|
| **Architecture owner** | INT35B/INT35C, EL1 |
| **Runtime owner** | `companion-feedback-store.ts`, `companion-learning-store.ts`, `turn-outcome-store.ts` |
| **Entry point** | writes: gateway `:988` + `routes.ts:11907`, `:11950`. reads: `assertAdmin` routes only |
| **State** | 🟡 Partially wired — **the loop is open** |

**Evidence.** The gateway calls exactly two store methods, **both writes**:

```
conversation-gateway.ts:977   this.actionStore.createProposals(...)
conversation-gateway.ts:988   this.feedbackStore.recordGuidanceEvents(...)
```

Grep of `conversation-gateway.ts` for `companionLearningStore|listFeedback|listGuidanceEvents|listRecommendations|healthSnapshot` → **0 hits**. **No learning, feedback, or outcome table is ever read into a response.** Every read terminates at `admin-companion-intelligence-page.tsx`.

**The durable sink is never registered — the load-bearing defect.**

`turn-outcome-store.ts:145-146` documents itself:

> *"Wire the durable sink into turn-fallback's classification log. Called once at server startup (`server/index.ts`)."*

**This is false.** `registerDurableTurnOutcomeSink` (`:150`) occurs exactly twice in the repo: its own definition, and a comment in a test. `server/index.ts` never imports it. Its only non-test importer is `server/lib/platform-status.ts:187` — and `platform-status.ts` has **zero importers repo-wide**; `buildOperationsStatus` (`:176`) is never called; there is no `/api/ops` route.

Consequence: **`platform_turn_outcomes` is never written and never read.** Everything the learning layer reasons over is `getUnsuccessfulQueryLog()` — a 200-entry in-process array (`turn-fallback.ts:271-320`) that empties on every deploy. (`turn-outcome-store.ts` also fails typecheck: `@shared/schema` exports neither `platformTurnOutcomes` nor `PlatformTurnOutcome`.)

**Evidence & Learning (EL1) is unreachable.** Bound at `intelligence-platform.ts:287`, but no resolver matcher and no HTTP route can invoke it. `household_evidence_events` / `household_learning_signals` are written only by `benchmark/world-seeder.ts`.

**User impact.** Nothing the Companion learns changes what the Companion does. By explicit design for recommendations (`routes.ts:12283`); by accident for everything else.

---

### 3.18 Dead composition subtree — 🔴 Unwired

`service-composition.ts` (`executeProgressiveComposition`, `formatEnrichedGapMessage`, `createStorageScope`) has **zero importers repo-wide — not even tests.** Its only would-be consumer, `capabilities/planner-composition.ts`, likewise has zero importers. `business-service-composition-registry.ts`'s Map is populated by nobody and read by nobody.

Both files import a type that does not exist:

```
service-composition.ts:20                       import type { IIntelligencePlatform } …
business-service-composition-registry.ts:22     import type { IIntelligencePlatform } …
```

`intelligence-platform.ts` exports only the class `IntelligencePlatform` and the const `intelligencePlatform`. Both lines are TS2724 errors.

---

### 3.19 Architecture-only (correctly unbuilt) — ⚪

These are named-not-built in CPA1 §13 and are **correctly** absent. No action beyond keeping them named.

| Item | CPA1 ref |
|---|---|
| `companion_observation_log` table (cross-session Silence Rules, dated milestones) | G6 / §13.2 |
| Household-level personality default/override | G8 / §13.4 |
| Server-owned weekly plant-diversity counter | §13.6 |
| `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` Part 11 reconciliation | G7 / §13.3 |

---

## 4. ARCHITECTURE DRIFT REGISTER

Claims in `THA_COMPANION_PLATFORM_ARCHITECTURE.md` that are **false against the code**. Each was verified by grep, git history, or execution.

| # | CPA1 § | Claim | Reality | Severity |
|---|---|---|---|---|
| D1 | §4.1, §3 | `user_preferences.companionPersonality` is "one additive column, `notNull`, default `'companion'`" | **Column does not exist and never has.** `conversation-gateway.ts:912` is a live TS2339 error | 🔴 Critical |
| D2 | §5.2, §4.3 | `GET /api/intelligence/companion/observations` handler fetches 4 sources, applies `applySilenceRules`, voices via `phraseObservation` | **Route has never existed in any commit.** Handler absent | 🔴 Critical |
| D3 | §11 G2 | `GET /companion/growth-insight` "remains registered and functional" | **Never existed.** `IA2:85` and `IA4:108` cite it at `routes.ts:11401`, which is the guidance-click handler | 🔴 Critical |
| D4 | §4.2 | "plus two call sites in `server/routes.ts` (`phraseGrowth`…, `phraseObservation`…)" | **Zero.** `routes.ts` imports one symbol from `server/intelligence/`: `intelligencePlatform` | 🔴 Critical |
| D5 | §4.2 | `prioritizeGuidance` — "each personality prioritises the same intelligence differently" | **[EXECUTED]** No-op for 5 of 6 voices, including the only reachable one. `priorities` are adjectives; `domain` values are card domains | 🔴 Critical |
| D6 | §3, §4.5 | `companion-delight.ts` is a Companion Platform ownership row, classified **"Mature"** | **Zero importers.** Dead because its only intended consumer (the observation banner) was never built | 🟠 High |
| D7 | §5.2 | Client hook "calls this exactly once, gated `enabled: isOpen && !hasHistory`" | Hook has **zero importers**; that gate exists nowhere in the codebase | 🟠 High |
| D8 | §3 | FloatingAssistant owns "panel presence, **personality label, observation banner** (additively extended)" | Neither extension exists. Greeting is hardcoded `"Hi, I'm Apple!"` (`:1465`) | 🟠 High |
| D9 | §7, §11 G3 | Two legitimate presentation channels over `opportunity-delivery`; "must not be resolved by deleting either" | **Both are dead.** Neither `/companion/observations` nor `/food-opportunities` is registered | 🟠 High |
| D10 | §10 | "One Observation Engine — Confirmed… Exactly one `observation-engine.ts`" | A **second `applySilenceRules`** exists at `knowledge-assembly.ts:185`. Both dormant. §12 non-negotiable | 🟠 High |
| D11 | §5.1 | "Exactly three call sites inside `conversation-gateway.ts`" | Three *functions*, **five calls** (`:556`, `:582`, `:600`, `:725`, `:764`) | 🟡 Medium |
| D12 | §5.1 step 6 | Write-intent gap is voiced by `voiceFallback()` | **Hardcoded string** (`:368-395`). `personalityId` in scope, unused | 🟡 Medium |
| D13 | §5.1 step 9 | Unsuccessful turns classified by `turn-fallback.ts` in the gateway | Moved into `knowledge-assembly.ts:137` (COMP5). Gateway's `classifyTurn` import (`:76`) is **dead** | 🟡 Medium |
| D14 | §5.1 step 10 | Personality fragment is "a labelled, additive **6th paragraph**" | It is the **8th**; two unlisted instruction blocks sit between the hard rules and it. Safety invariant still holds | 🟡 Medium |
| D15 | §5.1 | The 11-step list is complete | Two unlisted stages (INT42 composition, `assembleKnowledge`), two unlisted early returns (`:399-408`, `:754-773`) | 🟡 Medium |
| D16 | §11 G4 | 9 `InteractionKind`s declared, "6 wired to a real producer" | The mapping resolves to **5 distinct kinds** and itself has **zero readers**. Effectively 0 wired | 🟡 Medium |
| D17 | §4.5 | `ExperienceProfile`: "only the text fields (`greetings`, `celebrations`) are wired into the Behaviour Engine" | Wired *into* the engine, but `buildGreeting`/`buildCelebration` have **zero non-test callers**. Also dead | 🟡 Medium |
| D18 | §10 | "No duplicated ownership exists anywhere in the Companion Platform" | `UI1` found a parallel client Companion stack (`CompanionAvatar`, `use-companion-greeting`, …) shipped in the same commit as this claim. Now deleted (staged) | 🟡 Medium |
| D19 | §3 | Gateway performs no direct storage reads | `storage.getUserPreferences` (`:911`) is a direct read. Benign, but the header comment (`:29-30`) does not carve it out | ⚪ Low |
| D20 | §3 (TIP2) | `capabilityClass` "drives the confirmation tier" (`types.ts:74`) | `confirmationFor()` reads only `verb` and `permissions.audited`. `capabilityClass`, `aiAccess`, `ownershipScoped` are **read by nothing** | ⚪ Low |

### 4.1 Governance drift

- **CPA1 is indexed nowhere.** Absent from `docs/architecture/README.md`'s tables (grep: no match) and from `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (grep for "companion": 0 hits). Its own source investigation promised the index update at `:20` and `:246`; commit `0b1f2f7` touched `README.md` but added NK1/NK2 instead. It is nevertheless cited as governing by **15 documents, 31 times** — and `UI1A` correctly halted a deletion because of it.
- **Provenance.** `personality-registry.ts`, `behaviour-engine.ts`, `observation-engine.ts`, `companion-growth.ts` and `THA_COMPANION_PLATFORM_ARCHITECTURE.md` each have a `git log` of **exactly one commit: `0b1f2f7`**, authored `Replit Agent <agent@replit.com>`, subject *"Saved progress at the end of the loop."* The document describing the platform and the platform itself were written in the same un-reviewed checkpoint. **CPA1 §10's verification table ("re-verified directly for this document") cannot have been performed against running code** — three of its five "Confirmed" rows are false.
- **The rollback tag CPA1's investigation names for itself** (`rollback/before-companion-platform-architecture-20260703`) does not exist in `.git/refs/tags/`, though the three EWO/EWX tags do. The documented rollback command would not run.

---

## 5. MISSING RUNTIME WIRING

Ranked by what is absent, not by effort.

| # | Missing | Blocks | Files affected |
|---|---|---|---|
| M1 | `user_preferences.companionPersonality` column | The entire Personality Platform (6 voices) | `shared/schema.ts` |
| M2 | Personality write route + `preferencesSchema` field | Any user ever changing voice | `routes.ts:5283`, `:5298` |
| M3 | Personality settings UI | Discoverability of M1/M2 | `client/src/pages/*` |
| M4 | `GET /api/intelligence/companion/observations` | Observation Engine, Companion Growth, Delight layer, Interaction taxonomy — **4 modules, ~600 lines** | `routes.ts` |
| M5 | Observation banner in `FloatingAssistant` | Any observation reaching a user | `FloatingAssistant.tsx` |
| M6 | `registerDurableTurnOutcomeSink()` call at startup | Durable observability; all learning input | `server/index.ts` |
| M7 | `platformTurnOutcomes` / `PlatformTurnOutcome` schema exports | M6 (typecheck) | `shared/schema.ts` |
| M8 | `uplift` registry entry + resolver matcher | INT42 composition; **the only path to `food-intelligence`** | `capability-registry.ts`, `pattern-intent-resolver.ts` |
| M9 | Resolver matchers for `recommend`/`report` verbs | `food-intelligence`, `opportunity-delivery`, `evidence-learning` (3 bound capabilities) | `pattern-intent-resolver.ts` |
| M10 | `GET /api/intelligence/food-opportunities` (+ `:id/:action`) | `FoodOpportunitiesPanel` (FI5 channel B) | `routes.ts` |
| M11 | `GET /api/intelligence/learning-signals` (+ `:id/:decision`) | `LearningSignalsPanel` | `routes.ts` |
| M12 | `voiceFallback` on the write-intent + provider-unavailable paths | Voice consistency across all honest gaps | `conversation-gateway.ts:368`, `:399` |
| M13 | `closeThread()` caller | Unbounded thread growth | `conversation-gateway.ts` |
| M14 | `IIntelligencePlatform` interface (or fix the imports) | Typecheck; the dead composition subtree | `intelligence-platform.ts` |
| M15 | `npm` scripts for 15 `test-intelligence-*` files | CI coverage of gateway, personality, observation engine, composition | `package.json` |

---

## 6. BENCHMARK INTEGRITY

The benchmark is the platform's only automated statement about its own intelligence. It is **architecturally clean and substantively non-discriminating.**

### 6.1 What it genuinely exercises

Real, no mocks: `companion-turn.ts:34` → the production `conversationGateway.processUserTurn` singleton → real `patternIntentResolver` → real `IntentEngine.route()` → real registry → real handlers → real DB. LLM is real **iff** `OPENAI_API_KEY` is set (`llm-provider.ts:110-115`), else `NoOpProvider`.

### 6.2 An unwired capability passes

**[EXECUTED]** against the latest run, `docs/intelligence/benchmark/history/2026-07-07T22-48-47Z__45443a8.json`:

```
questions:               100
reached a capability:     64
reached NOTHING:          36        ← 36% of the suite touched no capability
no-route turns:           34
  no-route mean composite:  74.3   (min 73.3)
  capability-reaching mean: 75.0
gates fired:               0
headline:  score 74.8   honestGapRate 1.0   questionsScored 100
personalities: [{"key":"default","n":100}]
```

**A capability that does not work costs 0.7 points.**

Why: `scorer.ts:66` puts `"no-route"` in `HONEST_GAP_FALLBACKS`. An honest gap then earns **D2 = 4/4** ("admitting a limit is the best outcome", `:134`) and **D1 = 3/4** (`:141` — because `classifyCorrectAnswer` at `expectations.ts:176-186` **never returns `"grounded"`**), and **D3 = 4/4** (`:124-127`, not a write, not a safety boundary). Floor for a totally dead capability: **73.3**, above the 70 pass threshold.

Concretely: `PH-001 "What diet am I following?"` (`profile.read`) was not routed, answered *"I'm not sure I understood that question…"*, scored **73.3**, and is **not in `failedQuestions`.** The Profile domain reports 73.1 mean, 0 gates.

### 6.3 Three of five hard gates can never fire

**[EXECUTED]** `grep -n 'gate = "' server/tests/benchmark/scorer.ts`:

```
122:    else if (c.success) { d3 = 1; gate = "G3"; }   // claimed a write instead of proposing
180:  if (c.internalError && gate === null) gate = "G5";
```

`GateKey = "G1" | "G2" | "G3" | "G4" | "G5"` (`types.ts:24`). **G1** (asserted a fact that should have been an honest gap), **G2** (breached a dietary hard constraint) and **G4** (surfaced another household's fact) are **never assigned anywhere.** The report's "Safety verdict: ALL CLEAR" and the CI gate at `run-benchmark.ts:77` are vacuous for three of the four gates they check.

`honestGapRate: 100%` is near-tautological: its denominator is the 7 questions with `correctAnswerType === "honest-gap"`; its numerator requires `D2 >= 3` (true for every non-crashing turn) and `gate !== "G1"` (never fires). It means "7 of 7 turns did not crash."

### 6.4 The judge — 68% of the weight — is hardcoded off

```ts
// server/tests/benchmark/judge.ts:48-50
export function resolveJudge(): JudgeClient {
  return disabledJudge;
}
```

`JUDGE_OWNED = [D1, D2, D5, D6]` (`scorer.ts:35`) = 30 + 20 + 13 + 5 = **68 of 100 weight points**, never evaluated for correctness — only for shape. `evidenceExpected` and `trustConcern` are carried in the fixture and read into `ExpectationRecord` (`expectations.ts:203-204`) but **never consumed by the scorer**. `entityRefCount === 0` on 86/100 turns costs exactly one D1 band.

**And if `OPENAI_API_KEY` were unset**, `conversation-gateway.ts:399-409` returns a fixed string with `fallbackState: undefined`, which `scorer.ts:77-79` reads as `success = true` for **every** question → composite **71.25**, above the pass threshold, with the LLM entirely absent.

### 6.5 Nothing runs it, and 15 tests are unreachable

No `.github/`. `.replit` has one workflow (`npm run dev`). **`package.json` contains zero occurrences of the string `benchmark`.** The commands the code documents (`npm run test:companion-benchmark`, `…:validate`) **do not exist**.

There is **no test framework** — every test is a standalone `npx tsx` script. `npm test` is a hand-chained `&&` string of 35 sub-scripts; the first failure silently aborts the rest.

**[EXECUTED]** 15 of the 42 `test-intelligence-*.ts` files have **no npm script at all**, including:

```
test-intelligence-conversation-gateway.ts      ← the gateway
test-intelligence-personality-platform.ts      ← the Behaviour Engine  (42 assertions, all passing)
test-intelligence-observation-engine.ts        ← the dead engine       (42 assertions, all passing)
test-intelligence-capability-composition.ts    ← INT42
test-intelligence-uplift-binding.ts            ← asserts a capability that isn't registered
+ all six *-discovery-binding tests, compound-resolver, conversation-store, llm-provider
```

**[EXECUTED]** `npx tsx server/tests/test-intelligence-observation-engine.ts` → `42 passed, 0 failed`. **A fully green test suite for a module with zero runtime callers, that CI never runs.** This is precisely how D2 survived: the tests assert the engine is correct, and it is. Nothing asserts it is *reached*.

**Blind spots, summarised.** The benchmark reliably catches thrown exceptions (G5) and a claimed write where a proposal was required (G3). Nothing else. It cannot detect an unwired capability, an unregistered route, a pinned personality, a disabled judge, or a missing LLM.

---

## 7. FINDINGS

### 7.1 Fully operational capabilities

| Capability | Entry point | Evidence |
|---|---|---|
| Conversation lifecycle (Gateway) | `POST /api/intelligence/conversation/turn` | `routes.ts:11790` → `conversation-gateway.ts:892`; module loads clean **[EXECUTED]** |
| Intent Engine | `intelligence-platform.ts:234` | LOCATE→VALIDATE→PERMISSION→CONFIRM→INVOKE→RESPOND, unavoidable from the gateway |
| Permission model | `intent-engine.ts:84` → `permissions.ts:86` | Role + knowledge-class enforced pre-invoke |
| Confirmation tiers | `intent-engine.ts:90` → `permissions.ts:113` | Only `routes.ts:12038` passes `{confirmed:true}` |
| Capability Registry (21 of 23) | `intelligence-platform.ts:266-287` | All bound handlers delegate to real ports; no stubs |
| Memory integration | `conversation-gateway.ts:937` → prompt `:740` | Turns persisted and re-injected. Loop closed |
| Context Frame | `conversation-gateway.ts:918` | Per-turn, unconditional, read-only |
| Honest-gap classification | `knowledge-assembly.ts:137` | Four-state taxonomy, voiced under the default personality |
| Guidance suggestions | `conversation-gateway.ts:510`, `:582` | `canExecute`-gated (`companion-guidance.ts:161`) — CPA1's claim **verified** |
| Native discovery | `conversation-gateway.ts:517` | Structured, client-agnostic |
| Enrichment (4 producers) | `:524`, `:611`, `:621`, `:631` | Reaches the LLM prompt (`:680-688`) |
| Companion Actions | `:645` → `routes.ts:12038` | **The only closed write→read→execute loop** |
| FloatingAssistant + Companion Cards | `App.tsx:175` | 0 client typecheck errors; card contract honoured |
| Admin observability & learning dashboard | 7 `assertAdmin` routes | Real, but terminal (§7.2) |

### 7.2 Partially implemented capabilities

| Capability | What works | What doesn't |
|---|---|---|
| **Behaviour Engine** | `systemPromptFragment` + `voiceFallback` produce real, observable text | `prioritizeGuidance` is a verified no-op; `voiceGuidanceLabel` is a no-op under the default voice; 5 of 12 exports have zero runtime callers; write-intent and provider-unavailable gaps bypass it entirely |
| **Intent Resolver** | ~93 matchers over 18 capabilities | 3 of 20 verbs; **no write verb**; 34% of benchmark utterances unrouted |
| **Capability Registry** | 21 bound and executable | 2 unbound (`administration`, `developer` — correct); **3 bound-but-unroutable**; 1 phantom (`uplift`); dead gap entry (`:716`); `capabilityClass`/`aiAccess`/`ownershipScoped` read by nothing |
| **Learning pipeline** | Feedback, guidance events, goal signals all persist | **Nothing is read back into a response.** Input is a 200-entry in-memory ring buffer. Durable sink never registered — `platform_turn_outcomes` permanently empty |
| **Recommendation pipeline** | Guidance reaches users, correctly gated | `companion-learning-recommender` is admin-only and terminal by design (`routes.ts:12283`) |
| **Companion interaction flow** | Panel → turn → cards → actions → confirm | No observation banner, no personality label, no greeting from the registry |
| **Benchmark** | Real seam, real registry, real engine; catches crashes and unauthorised writes | Unwired capability scores 73.3 and passes; 3 of 5 gates never fire; judge (68% of weight) hardcoded off; not run by CI; the npm scripts it documents don't exist |

### 7.3 Architecture drift

Twenty numbered discrepancies in §4, of which five are **Critical** — the architecture document asserts, in operational detail, runtime surfaces that have never existed in any commit:

1. **D1** — the `companionPersonality` column (a live TS2339 error at `conversation-gateway.ts:912`).
2. **D2** — `GET /api/intelligence/companion/observations`.
3. **D3** — `GET /api/intelligence/companion/growth-insight`, described in G2 as *"registered and functional"*, and cited at a specific line by two other implementation records.
4. **D4** — two `routes.ts` call sites for `phraseGrowth` / `phraseObservation`.
5. **D5** — per-personality guidance prioritisation, which has never worked for any voice.

Plus the structural governance drift (§4.1): CPA1, the code it governs, and most of its cited precedent were authored in **one un-reviewed agent checkpoint**; its §10 "One of each — Confirmed" verification table has three false rows; and it is indexed in neither `README.md` nor the Source of Truth Register despite being cited as governing 31 times across 15 documents.

**The pattern is consistent and worth naming plainly:** the document describes the system as designed, and was committed alongside — not after — the code. Its confidence ("Confirmed", "verified directly for this document", "guaranteed by construction, not by convention") is not backed by execution. `UI1A` was right to stop a deletion on its authority, and right to record that three of its claims are false.

### 7.4 Missing runtime wiring

Fifteen items, M1–M15 (§5). The shape of the gap:

- **The observation seam is one missing route.** `GET /api/intelligence/companion/observations` alone strands four modules and ~600 lines of tested, correct code: `observation-engine.ts`, `companion-growth.ts`, `companion-delight.ts`, `companion-interaction.ts`.
- **The personality platform is one missing column.** `user_preferences.companionPersonality` alone strands 427 lines of registry, five of six voices, and the only failing typecheck error in live conversation code.
- **The learning platform is one missing function call.** `registerDurableTurnOutcomeSink()` at startup is the difference between reasoning over durable history and reasoning over an array that empties on every deploy.
- **`food-intelligence` is one missing registry entry.** `uplift`'s absence from `capability-registry.ts` is the sole reason INT42's composition stage is dead code.

Each is small. None is wired. All four are described in governing documents as if they were.

### 7.5 Highest-value implementation order

Sequenced by *risk retired per unit of work*, with the constraint that each step should leave the tree greener than it found it. **None of this is authorised by this document** — each item needs its own workstream under `ENGINEERING_WORKFLOW.md`.

**Tier 0 — Stop the bleeding (hours)**

| # | Action | Why first |
|---|---|---|
| 0.1 | **Commit the `nutrition-enrichment.ts` export fix** (§1.2) | HEAD is RED. Any restart or redeploy 500s every Companion turn. AUDIT1 F2 is fixed on disk and uncommitted — the single highest-risk state in the repo |
| 0.2 | **Correct CPA1's five Critical false claims** (D1–D5) in place | The document is cited as governing 31× across 15 docs and is actively steering decisions (`UI1A` halted a deletion on its authority). Every day it stands, it misleads. Documentation-only, no code |
| 0.3 | **Index CPA1** in `docs/architecture/README.md` and the Source of Truth Register | It is governing-by-content and invisible-by-navigation. Also `PLATFORM_QUALITY_ARCHITECTURE.md`, `GOV2_CANONICAL_ALIAS_PRINCIPLE.md` |

**Tier 1 — Make the platform tell the truth about itself (days)**

| # | Action | Unblocks |
|---|---|---|
| 1.1 | **Fix the benchmark's honest-gap scoring** so `no-route` on a question whose capability *is* registered and executable scores as a **routing failure**, not an honest gap | Everything below. Right now the platform cannot detect its own unwiring — this is why D1–D5 survived. Highest leverage single change in the audit |
| 1.2 | **Implement G1, G2, G4** in `scorer.ts` | "Safety verdict: ALL CLEAR" is currently vacuous for 3 of 4 gates |
| 1.3 | **Add npm scripts for the 15 orphaned tests**; add `test:companion-benchmark` (the scripts the code documents) | Gateway, Behaviour Engine, Observation Engine, INT42 all untested by CI |
| 1.4 | **Green the typecheck** (178 errors; 10 in live conversation code) | `release:check` is RED and cannot gate anything. Fix `IIntelligencePlatform`, `platformTurnOutcomes`, `IntentVerb`/`CapabilityHandler`/`IntelligenceContext` exports |
| 1.5 | **Fail the benchmark when the LLM provider is unavailable** (`conversation-gateway.ts:399-408` currently scores 71.25 with no LLM) | A benchmark that passes without an LLM measures nothing |

> 1.1 before anything else in Tier 2. Wiring a capability without a benchmark that can see it wired is how the platform arrived here.

**Tier 2 — Close the highest-value gaps (weeks)**

| # | Action | Value |
|---|---|---|
| 2.1 | **`registerDurableTurnOutcomeSink()` at startup** + `platformTurnOutcomes` schema export (M6, M7) | One function call. Converts the entire learning layer from a volatile 200-entry array to durable history. Prerequisite for any real learning loop |
| 2.2 | **`uplift` registry entry + resolver matcher** (M8) | One registry row + one matcher. Revives INT42 composition and is the only path to `food-intelligence` — a fully-built, tested Domain Intelligence engine no user can reach |
| 2.3 | **Resolver matchers for `recommend`/`report`** (M9) | Reaches `opportunity-delivery` and `evidence-learning` — two more bound, tested, unreachable capabilities. Together with 2.2, this triples the reachable reasoning surface for the cost of ~3 matchers |
| 2.4 | **`companionPersonality` column + write route + `preferencesSchema` field + settings UI** (M1–M3) | Fixes the only typecheck error in live conversation code. Unlocks 427 lines of shipped, tested voice content and 5 unreachable personalities. **Do 2.5 in the same workstream** |
| 2.5 | **Fix `prioritizeGuidance`** — replace the adjective `priorities` lists with real card domains, or delete the mechanism | Shipping 2.4 without this delivers five voices that all order guidance identically, and makes CPA1 §4.2's "Stage 3" claim newly false rather than historically false |
| 2.6 | **`voiceFallback` on the write-intent (`:368`) and provider-unavailable (`:399`) paths** (M12) | Two call sites. Makes voice consistent across all four honest-gap states, which is what CPA1 §5.1 already claims |

**Tier 3 — Restore the Living Companion (weeks)**

| # | Action | Value |
|---|---|---|
| 3.1 | **`GET /api/intelligence/companion/observations`** (M4) | One route revives four modules and ~600 lines of correct, tested code: Observation Engine, Companion Growth, Delight layer, Interaction taxonomy. Depends on 2.4 (needs a real personality to voice with) |
| 3.2 | **Observation banner in `FloatingAssistant`** (M5) | The only consumer that makes 3.1 visible. Consumes `use-companion-observations.ts` and `companion-delight.ts` as designed |
| 3.3 | **Resolve the duplicate `applySilenceRules`** (D10) — extend `observation-engine.ts`'s in place, delete `knowledge-assembly.ts:185`'s, or rename the latter to say what it is | §12 non-negotiable. Cheap now (both dormant); expensive once 3.1 makes one of them live |
| 3.4 | **Retire or build the FI5 channel-B route** (M10) and the learning-signals route (M11) | Two mounted-nowhere panels calling two unregistered routes. Decide, don't leave |
| 3.5 | **`companion_observation_log`** (CPA1 G6 / §13.2) | Only after 3.1 ships and cross-session repetition is an observed problem, not a predicted one. Requires its own Rule 8 review |

**Tier 4 — Hygiene (opportunistic)**

- Delete the dead composition subtree: `service-composition.ts`, `capabilities/planner-composition.ts`, `business-service-composition-registry.ts` (zero importers, not even tests; both import a non-existent type).
- Remove the dead `classifyTurn` import (`conversation-gateway.ts:76`); update CPA1 §5.1's step list to include `assembleKnowledge` and INT42.
- Remove the unreachable `SEED_GAPS` planner/delete entry (`capability-registry.ts:716`).
- Call `closeThread()` somewhere, or delete it (M13).
- Either enforce `capabilityClass` / `aiAccess` / `ownershipScoped`, or stop declaring them on 23 capabilities (D20).
- Wire or retire `welcome` / `encouragement` / `celebration` / `completion` `InteractionKind`s (CPA1 G4 — note the count in G4 is wrong; see D16).
- Commit the five staged `client/src/components/companion/` deletions — verified safe (`UI1A`; 0 client typecheck errors; reachable-module count unchanged at 181).

---

## 8. STANDING CONSTRAINTS WORTH NAMING

Not defects today. Each becomes one the moment an adjacent assumption changes.

1. **`detectWriteIntent`'s advisory-frame escape hatch** (`conversation-gateway.ts:225-229`) reclassifies `"can I add X"` as a read. Safe **only** because no write verb is resolver-reachable (§3.2). Tier-2 item 2.3 must not introduce one without revisiting this guard.
2. **`denied` and `confirmation_required` collapse to `no-knowledge`** (`conversation-gateway.ts:313`). Safe because the gateway path is read-only. Would silently misreport a permission failure as ignorance the moment it isn't.
3. **Enrichment crosses the grounding boundary** (`conversation-gateway.ts:680-688`). Enrichment content is handed to the model as CONTEXT DATA, i.e. as ground truth, and is therefore subject to the same non-fabrication discipline as capability output. Correct per COMP6, and load-bearing.
4. **One immortal conversation thread per user** (§3.14). Prompt-bounded, table-unbounded.
5. **`normalizePersonalityId` has no error state** — an unknown id silently becomes `"companion"`. This is why M1's absence produced no crash, no log line, and no test failure for the platform's entire existence.

---

*Investigation only. No code, schema, runtime or API change is authorised by this document. Every remediation in §7.5 is a governed workstream in its own right.*
*Evidence base: 4 governing documents read in full; 7 parallel code investigations; 6 executed verifications (typecheck, module import, observation-engine test suite, guidance-priority probe, route/client cross-check, benchmark artefact analysis).*
