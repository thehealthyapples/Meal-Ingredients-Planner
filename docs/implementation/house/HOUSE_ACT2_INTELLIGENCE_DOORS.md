# HOUSE_ACT2 — Intelligence Doors

**Date:** 2026-07-18
**Branch:** `int1-intelligence-platform`
**Risk:** 💡 Premium Reasoning
**Reason:** Activate the existing Intelligence Platform by surfacing production-ready intelligence naturally throughout the household experience. Give existing capabilities a door; create none.

---

## ROLLBACK PROTECTION

| | |
|---|---|
| **Rollback identifier** | `rollback/HOUSE_ACT2-intelligence-doors-20260718` |
| **Commit** | `6e326d9f` — HOUSE_ACT1 completion |
| **Baseline build** | 🟢 verified passing before any change |

**Rollback command:**
```
git reset --hard rollback/HOUSE_ACT2-intelligence-doors-20260718
```

Unlike HOUSE_ACT1, no checkpoint commit was needed: the tree held only three uncommitted Markdown files belonging to a concurrent **PROD2** session. Those were deliberately **not** captured — HOUSE_ACT2 authors no commit on another session's behalf. HOUSE_ACT1's report recorded that mistake; this is the correction.

---

## REFERENCE DOCUMENTS READ

`docs/architecture/README.md` (Architecture Bootstrap) and, through it: `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`, `THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md` (INT17), `INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md`, `THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md`, `ARCHITECTURE_PRINCIPLES.md` (Principles 2, 6), `THA_EXPERIENCE_ARCHITECTURE.md` §18, `THA_UI_ARCHITECTURE.md` §17–18, `THA_EXPERIENCE_LANGUAGE.md` §6–7, `THA_EXPERIENCE_BLUEPRINT.md` §15.2–15.3, plus source evidence in `capability-registry.ts`, all eight discovery/knowledge bindings and handlers, `conversation-gateway.ts`, and `opportunity-delivery/framework.ts`.

---

## THE FINDING THAT RESHAPED THE MISSION

HOUSE_ACT1 reported eight built capabilities with zero UI and recommended doors for all of them. Reading the handlers changed that conclusion in two ways.

### Finding 1 — There is no generic capability-execution endpoint

`server/routes.ts` (12,963 lines) exposes **no** route accepting a capability id + verb. Every `intelligencePlatform.handle()` call site constructs a **hardcoded intent literal** for one specific capability (`:11774, :11858, :11954, :12011, :12048, :12106, :12494`). The action-confirm route replays a **pre-stored** draft, not a client-supplied intent.

One door exists: `POST /api/intelligence/conversation/turn`. Its body is `{ utterance, surface, surfaceHints }` — **no `capabilityId`, no `query`.** You submit natural language and the resolver decides. The Full Result never reaches the client intact: `outcome` is narrowed to `{ status, message }` (`:12219`), and the only structured path is `buildNativeDiscoveryResponse`, a **lossy transform**. Fields that exist in the Full Result — `sourcesQueried`, `weeksScanned`, `filter`, `householdName`, `isAlreadySaved`, `importable`, `hardRestrictions` — are unreachable over HTTP.

**So "give it a door" means authoring HTTP routes.** That is legitimate — a route is not a capability — but it is a materially larger change than HOUSE_ACT1 assumed.

### Finding 2 — Most discovery capabilities *should not* get a door

This is the load-bearing finding, and it **contradicts three of the mission's seven priorities**.

`pantry-discovery` searches `user_pantry_items`. The Pantry room already searches `user_pantry_items` — and does it better. `pantry-page.tsx:300` records why:

> *"WX7 — canonical search index: maps each pantry item to its canonical TERMS (benefits, nutrients, attributes, seasonality) so search matches by meaning, not just by name. **Reuses canonical knowledge; never a second search engine.**"*

A `pantry-discovery` search box in the Pantry room would be **exactly the second search engine that comment refuses**, and a weaker one — the discovery engine matches on name; WX7 matches on meaning. The same holds for `shopping-discovery` (Shopping already filters its list), `diary-discovery` (Diary already searches entries), and `planner-discovery` (the Planner shows the week on screen).

**These engines are not unsurfaced features. They are Companion grounding, and they are already correctly placed.** They exist so that when a household *asks* "what flour do I have?", the Companion can answer from the real store. Their absence from the UI is the architecture working, not a gap in it.

The mission says *"reuse existing services and UI"* and *"do not duplicate intelligence."* Honouring those instructions means **declining** priorities 3 and 7 for pantry, shopping, diary and planner. That refusal is the finding, and it is reported rather than quietly skipped.

---

## COMPLETED INTELLIGENCE DOORS

### 🚪 Door 1 — Household Learning, in the rooms where the behaviour happened

**Priority 1. Delivered.**

**Before:** every Pattern THA had learned about a household was visible in exactly **one place** — a single unfiltered mount on Profile (`profile-page.tsx:436`). A household that never opened Profile never learned that THA had noticed anything about it.

**After:** Profile keeps the household-wide view, unchanged. **Planner, Pantry, Shopping and Cookbook** each additionally show only the Patterns learned from behaviour *in that room* — so the household meets its own learning where the behaviour occurred.

| Room | Domain | Eyebrow |
|---|---|---|
| Planner | `planner` | *What we've noticed about your planning* |
| Pantry | `pantry` | *What we've noticed about your pantry* |
| Shopping | `shopping` | *What we've noticed about your shopping* |
| Cookbook | `cookbook` | *What we've noticed about your cooking* |
| Profile | *(all)* | *Something we've noticed* — unchanged |

**Why the domain key space is sound, not guessed.** A signal's `domain` is written from the opportunity's `owningDomain` (`opportunity-delivery/framework.ts:268`, reported at `:943`) — the same `planner | pantry | shopping | cookbook` keys the rooms already scope `AmbientIntelligence` by, and the same keys `DOMAIN_SURFACE` maps at `framework.ts:295-301`. The four mounts sit directly beneath the existing ambient strip in each room, so the two intelligence surfaces read as one voice.

**Why filtering is client-side — a deliberate architectural choice.** The `evidence-learning` handler *does* accept a `domain` parameter (`evidence-learning-handler.ts:181-190`), and `routes.ts:12048` hardcodes it away. Forwarding it server-side was the obvious move and is the **wrong** one: it would fragment one shared, 5-minute-stale, TanStack-deduped query into **one network request per room** for a list the hook already holds in full. Every signal already carries its `domain`.

Instead this mirrors the sibling owner exactly. `AmbientIntelligence` takes `domains?: readonly string[]` and filters the shared bundle client-side (`:85-95`). `LearningSignalsPanel` now does the same. **The result: five mounts, one fetch, no server change, no route change, no capability-descriptor change.**

**Files:**
- `client/src/components/LearningSignalsPanel.tsx` — added `domains`, `eyebrow`; filter is `domains ? signals.filter(s => domains.includes(s.domain)) : signals`, then the existing cap. Omitting `domains` is unchanged behaviour, which is what keeps Profile byte-identical in effect.
- `client/src/pages/weekly-planner-page.tsx`, `pantry-page.tsx`, `shopping-workspace-page.tsx`, `meals-page.tsx` — one mount + one import each.

**Honest absence is preserved.** The panel still returns `null` while pending or when nothing matches (`:40`). A room with no Patterns yet shows **nothing** — never an empty-state placeholder implying something is missing. In Cookbook the panel is additionally hidden while searching, on the same reasoning the ambient strip already used: it never competes with a search the household began.

**No new intelligence, no new UI.** The capability, route, hook, card and panel all already existed. This change adds a filter and four mounts.

### 🚪 Door 1a — Household learning became a governed concern

`LearningSignalsPanel` had **1 consumer and no register entry**: a cross-room presentation owner invisible to the instrument whose whole purpose is that *"authored-but-unadopted must be impossible to hide"* (UIA §17). At 5 consumers that blind spot is no longer acceptable.

Registered as `household-learning-presentation`, `adoptionFloor: 4`, measured live at **5 importers**. Gate: **82 passed · 0 notices · 0 failed** (was 81/0/0 — one new governed concern, nothing loosened).

---

## DECLINED, WITH EVIDENCE

| Priority | Capability | Verdict |
|---|---|---|
| **3** | `pantry-discovery` | **Declined** — Pantry's WX7 canonical index already searches the same store *by meaning*; a discovery box would be the "second search engine" that code explicitly refuses, and weaker |
| **3** | `planner-discovery` | **Declined** — the Planner renders the week on screen; searching it is a worse way to see it. Also returns `weeksScanned: -1` hardcoded (`planner-discovery-handler.ts:46`) |
| **4** | `shopping-discovery` | **Declined** — Shopping already filters its own list. *Shopping Intelligence proper is already surfaced* (`ShoppingIntelligencePanel`, verified in HOUSE_ACT1) |
| **7** | `household-discovery` | **Declined** — Profile's `HouseholdEatersSection` already lists members, diets and restrictions from the same stores |
| — | `diary-discovery` | **Declined** — same shape as the above |

These five are **correctly placed already** as Companion grounding. Building UI for them would duplicate room-native surfaces and violate the mission's own *"reuse existing UI, do not duplicate intelligence."*

---

## NOT ATTEMPTED — AND WHY

| Priority | Capability | Why not, honestly |
|---|---|---|
| **2** | **Nutrition Enhancement** | **The strongest remaining door, deliberately not rushed.** Genuinely rendered by **no room** — `buildNutritionEnrichment` and `buildHouseholdNutritionEnrichment` are consumed only by `conversation-gateway.ts:1007,:1017`. But both take a **gateway query-result** (`nutritionQuery`, `profileQuery`), not a food. A route would have to synthesise that shape, which risks **duplicating gateway composition logic** — the precise thing the mission forbids. The clean seam exists (`composeHouseholdNutritionEnrichment(food, household)` is pure, `:136`), but doing it right needs its own change with its own verification, not the tail of this one |
| **3** | `meal-discovery` | The **one genuinely additive** discovery engine — cross-source over personal cookbook + THA library + templates, with `isAlreadySaved` / `importable`. Cookbook already browses system/web recipes (`meals-page.tsx:3322`), so whether this is additive or duplicative needs a real read of that surface first |
| **5** | Product Knowledge | Its natural room is **Support/Help, which does not exist** (HOUSE_ACT1 §1.1). It also has no HTTP route and is absent from the native-discovery table, so its results reach the client only as LLM prose. Blocked on a product decision |
| **6** | Food Comparison | `/compare` works standalone and is already linked from `food-detail-page.tsx:212`. The gap is *entering* comparison without first picking a food — but **choosing which room hosts that entry is a product decision**, and guessing would add the visual noise HOUSE_ACT1 was asked to remove |

---

## ARCHITECTURE COMPLIANCE CHECKLIST

- ☑ **One canonical identity** — no entity touched. A learning signal's identity remains `(householdId, domain, subjectType, subjectKey, direction)`, owned by `household_learning_signals`.
- ☑ **One owner per fact** — no fact acquired an owner. The `domain` filter *selects from* what `evidence-learning` already returned; it computes nothing.
- ☑ **No duplicate entities** — none created.
- ☑ **No duplicate ownership** — `LearningSignalsPanel` remains the single presentation owner of Patterns; the four rooms consume it, none re-implements it.
- ☑ **No duplicate state** — no state added. One shared query key, unchanged.
- ☑ **Extends existing architecture** — the `domains` prop is copied deliberately from `AmbientIntelligence`'s existing shape, so the two intelligence surfaces scope identically. No new pattern.
- ☑ **Progressive enrichment** — N/A; no knowledge entity.
- ☑ **Knowledge domain compliance** — N/A; no knowledge domain introduced or extended.
- ☑ **Honest gaps over fabricated information** — preserved exactly: `null` while pending, `null` when nothing matches. A room with no Patterns says nothing. **And §"Declined" reports five capabilities as correctly-absent rather than inventing surfaces for them.**
- ☑ **No permanent synchronisation bridge** — none.
- ☑ **Evolution over replacement** — nothing replaced.

## AI ARCHITECTURE COMPLIANCE

- ✓ **Uses the canonical Intelligence Platform** — Door 1 reaches `evidence-learning` through the existing `/api/intelligence/learning-signals` route, which calls `intelligencePlatform.handle()`. No bypass.
- ✓ **Uses the Capability Registry** — unchanged; **no descriptor edited**, no `apiSurface` altered, no capability registered.
- ✓ **Uses the Intent Engine** — untouched. The intent literal at `routes.ts:12048` is unmodified.
- ✓ **Reuses existing business services** — no service touched; no new read.
- ✓ **Does not create another assistant** — **none.** Door 1 adds no conversational surface. The Companion remains the single `FloatingAssistant` presence, and §"Declined" explicitly keeps five engines as *its* grounding rather than promoting them into rival UI.
- ✓ **Does not duplicate conversation state** — no conversation state touched.
- ✓ **Uses registered capabilities only** — only `evidence-learning`, already registered and bound.
- ✓ **Uses permission-aware access** — unchanged. The route's 401 gate, the nine-field projection stripping `householdId`/`supportingEventIds`, and household scoping all still apply. **Client-side filtering narrows what is *shown*, never what is *authorised*** — the server had already scoped the payload to this household before it left.
- ✓ **Produces honest gaps rather than fabricated knowledge** — `!data.resolved` still yields `[]`, so a degraded read renders as absence, never as "nothing to notice".

## EXPERIENCE & UI GOVERNANCE COMPLIANCE

- ✓ **UX Governance Checklist** (EXP §18 + Premium §17) — *calm before capability*: the panel is capped at 2 per room, sits beneath the existing ambient strip, and disappears entirely when empty. **Premium as "the perceptible result of care"**: being told what THA noticed *about your shopping, on your shopping list* is care; being made to visit Profile to find it is not.
- ✓ **UI Governance Checklist** (UIA §18) — no colour, token, spacing, type role or motion value introduced. Reuses `LearningSignalCard` → `IntelligenceCard` → `ui/card`.
- ✓ **Experience Review Questions** (EXPLANG §6) — the feelings served are **intelligent** and **reassuring**. Anti-patterns avoided: nothing nags (terminal confirm/decline is unchanged), nothing announces itself when it has nothing to say, and nothing was made theatrical.
- ✓ **Experience Test** (EXPBLUE §15.3) — *Pantry: this is the room where the household knows what it has; they should feel stocked and unhurried; the one thing it helps them do is see what is on the shelves.* A Pattern learned from how they keep the pantry belongs on those shelves, not in a settings page.
- ✓ **Blueprint Checks** (EXPBLUE §15.2) — no room's place character, orchard, light, material, shell constancy or Living Detail changed. **The Companion's place is explicitly protected**: Door 1 adds presence without adding a room, and §"Declined" keeps five engines as its grounding.
- ✓ Conflicts resolved in the Experience Architecture's favour — one arose: the mission's priorities 3/4/7 versus *"reuse existing UI, do not duplicate intelligence."* Resolved for the architecture; the refusal is documented rather than silent.
- ✓ Nothing owns a fact at the presentation layer — the panel renders `rationale` **verbatim** from the producer and computes no text.
- ✓ Any new visual pattern retired its predecessor — **no new visual pattern introduced.**

## PRODUCT REGISTRY COMPLIANCE / IMPACT

- **Registry affected:** NO.
- Entries **created**: NONE · **updated**: NONE · **retired**: NONE.
- No page, route, journey, capability, dialog, integration or setting was added, removed or renamed. Door 1 places an **existing** component in four **existing** rooms; no navigable surface changed, so "what is THA?" does not answer differently.
- Any entry set to `public`/`household`: N/A.
- Product knowledge written into a prompt, template or fallback string: **NO** (Rule PKR27).

## ADOPTION REGISTER IMPACT

- **Register affected:** YES.
- Owners **created**: `household-learning-presentation` — `client/src/components/LearningSignalsPanel.tsx` — first consumers Profile, Planner, Pantry, Shopping, Cookbook (**5 live, floor 4**). It is not new code; it is newly *governed* code that had been a 1-consumer blind spot.
- Owners **adopted**: Planner, Pantry, Shopping and Cookbook moved onto the household-learning owner.
- Predecessors **retired**: NONE — nothing was replaced.
- **Rival ceilings raised: NONE.**
- Exemptions **added**: NONE.
- `npm run adoption:check` passes: **YES** — **82 passed · 0 notices · 0 failed**.

---

## DEFINITION OF DONE

**Success looks like:** a household encounters what THA has learned about it while *using* the room the learning came from — without opening Profile, without asking the Companion, and without a single fabricated or duplicated surface.

**What must not break:** Profile's existing unfiltered panel; the single shared learning-signals fetch; the confirm/decline terminal flow; `AmbientIntelligence` in all seven of its mounts; and the honest-absence rule in every room.

---

## VALIDATION PERFORMED

| Command | Outcome |
|---|---|
| `npx vite build` (baseline, before changes) | 🟢 PASSED |
| `npx vite build` (after Door 1) | 🟢 **PASSED** |
| `npx tsc --noEmit` — `client/` only | 🟢 **0 errors** |
| `npx tsc --noEmit` — total | **94** — identical to the HOUSE_ACT1 baseline; **0 introduced** |
| `npm run adoption:check` | 🟢 **82 passed · 0 notices · 0 failed** |
| Register live measurement | `Household learning (Patterns) — 5 importer(s)` ✅ matches the 5 intended mounts |

The 94 type errors are the pre-existing `server/tests/*.ts` population HOUSE_ACT1 recorded; this change touches no server file and adds none.

**Not run:** the full test suite, and **no browser verification**. The four mounts are unproven visually — see below.

---

## MANUAL VERIFICATION STEPS

**1 — Room-scoped learning appears (the door itself)**
- *Starting page:* `/planner`, signed in as a household with at least one **pending** Pattern in the `planner` domain
- *Action:* look beneath the "Gaps in your week" ambient strip
- *Expected:* eyebrow *"What we've noticed about your planning"* with up to 2 cards
- *Success criteria:* only `planner`-domain Patterns appear — never a pantry or shopping one
- *Regression checks:* Profile still shows **all** domains; confirming a Pattern in Planner removes it from Profile's list too (one shared cache)

**2 — Honest absence**
- *Starting page:* `/pantry` as a household with **no** pantry Patterns
- *Expected:* **nothing renders** — no heading, no empty card, no placeholder
- *Success criteria:* zero layout shift; the room reads exactly as it did before

**3 — One fetch, not five**
- *Action:* open DevTools → Network, filter `learning-signals`, visit Planner → Pantry → Shopping → Cookbook
- *Expected:* **one** request, then cache hits for 5 minutes
- *Success criteria:* four room visits do not produce four requests — this is the whole reason filtering is client-side

**4 — Cookbook search is never interrupted**
- *Starting page:* `/cookbook`; type in the search box
- *Expected:* both the ambient strip and the learning panel disappear while searching

## USER ACCEPTANCE EVIDENCE

**None captured.** The four steps above **have not been executed** — no browser session, no screenshots. Door 1 is verified by build, typecheck and the register's live 5-importer measurement, which prove it *compiles and is wired*; they do not prove it *looks right in a room*. Step 1 in particular needs a household with pending Patterns, which I did not seed. Stating this plainly rather than implying visual confirmation that did not happen.

---

## DATA IMPACT

- **Reads existing data:** YES — `household_learning_signals`, via the existing route. No new read; the same single request now serves five mounts.
- **Writes new data:** NO.
- **Changes meaning of existing data:** NO. A signal's `domain` was always the owning domain; Door 1 is the first consumer to *read* it.
- **Requires backfill:** NO.

No schema, migration, column, store or server file was touched.

## TRUST CHECK

- **Could this mislead the user?** No. Each room shows a strict subset of what Profile already showed, from the same fetch. A Pattern cannot appear in a room it was not learned in.
- **Could this fabricate certainty?** No. `rationale` is rendered **verbatim** from the producer; the panel composes no sentence. The confirm/decline gate is untouched, so nothing becomes "understood" without an explicit household act.
- **Is anything guessed but shown as real?** No — and the domain key space was **verified to its source** (`framework.ts:268`) rather than inferred from the room names it happens to match.
- **What happens if the system is wrong?** If a domain string ever failed to match, the room renders **nothing** — the honest-absence path, not a wrong Pattern. Profile's unfiltered view remains the complete record either way.
- **No architectural duplication introduced:** YES — and §"Declined" refuses five duplications the mission asked for.
- **No new source of truth created:** YES.
- **No runtime behaviour altered:** NO — deliberately altered: four rooms now render a panel they did not.
- **Every "verified" claim backed by a command that ran:** YES. Claims not backed by a command are marked **not run** or **not captured**.

## ROLLBACK PLAN

- **Rollback identifier:** `rollback/HOUSE_ACT2-intelligence-doors-20260718` → `6e326d9f`
- **Files modified:** `client/src/components/LearningSignalsPanel.tsx`, `client/src/pages/weekly-planner-page.tsx`, `client/src/pages/pantry-page.tsx`, `client/src/pages/shopping-workspace-page.tsx`, `client/src/pages/meals-page.tsx`, `docs/implementation/ux/adoption-register.json`, `docs/implementation/ux/ADOPTION_REGISTER.md`, and this report.
- **Rollback commands:** `git reset --hard rollback/HOUSE_ACT2-intelligence-doors-20260718`
- **Verification after rollback:** `npx vite build` 🟢 and `npm run adoption:check` → back to **81 passed** (the `household-learning-presentation` concern disappears with the change that earned it). Unlike HOUSE_ACT1's tag, this one restores a **building** tree.

## SCOPE LOCK

**Implemented:** Door 1 (household learning in Planner, Pantry, Shopping, Cookbook) and Door 1a (the register concern that makes it measurable).

**Explicitly excluded — NOT done:**
- Nutrition Enhancement surfacing (priority 2) — the strongest remaining door; needs its own change
- Any UI for the seven discovery capabilities — five **declined with evidence**, `meal-discovery` deferred pending a read of Cookbook's existing cross-source browsing
- Product Knowledge surfacing (priority 5) — blocked on Support/Help not existing
- A second entry point for `/compare` (priority 6) — placement is a product decision
- Any server, route, schema or capability-descriptor change
- Server-side `domain` filtering — **deliberately rejected**, see Door 1
- Execution of the manual verification steps

**Suggestions observed outside scope (not implemented):**
- `planner-discovery-handler.ts:46` returns `weeksScanned: -1` hardcoded while its doc comment claims a real count — a small honesty defect in a capability nothing currently reads
- `bindings/nutrition-discovery.ts:29` hardcodes `["search"]` while the handler exports `NUTRITION_DISCOVERY_EXECUTABLE_INTENTS` that the binding ignores — two sources of truth for one fact (Principle 2)
- `product-knowledge`'s descriptor requires `minimumRole: "user"` while its handler is written to serve anonymous callers at `public` tier — the registry gate fires first, so the anonymous path the handler documents is unreachable
- `conversation-gateway.ts:1021` orders static enrichment first, so it can consume all 3 `MAX_ENRICHMENT_ITEMS` slots and **starve both nutrition enrichment sources** — worth checking before priority 2 is built

---

## REMAINING OPPORTUNITIES — PRIORITISED

| # | Opportunity | Value | Cost |
|---|---|---|---|
| **1** | **Nutrition Enhancement door.** Two services no room has ever rendered. Compose via the pure `composeHouseholdNutritionEnrichment(food, household)` seam onto `food-detail-page`; do **not** re-synthesise gateway query results. Check the `MAX_ENRICHMENT_ITEMS` starvation above first | 🔴 High | M |
| **2** | **Fix the 94 `server/tests/*.ts` type errors** (carried from HOUSE_ACT1) | 🔴 High | M |
| **3** | **Decide `meal-discovery`.** Read Cookbook's existing cross-source browsing; if it does not already reach templates + library with `isAlreadySaved`/`importable`, this is a real door | 🟠 Med-High | M |
| **4** | **A second entry to `/compare`** — needs a product decision on which room hosts it | 🟠 Med | S |
| **5** | **Retire or adopt `ui/overlay.tsx`** — still 1 importer against 14 rivals (HOUSE_ACT1 #6) | 🟠 Med | M |
| **6** | Fix the three honesty defects in Scope Lock (`weeksScanned`, the nutrition-discovery intent duplication, the product-knowledge role mismatch) | 🟡 Low-Med | S |
| **7** | Decide Support/Help — unblocks Product Knowledge (priority 5) | 🟡 Low | — |

### Suggested follow-on programme

**`HOUSE_ACT3 — The Food Page Intelligence`** — opportunity 1 and 3 together. Both land on food and meal surfaces, share the `FoodRef` seam, and are the last two genuinely-unsurfaced capabilities in the house.

---

## OUTCOME

**One door opened, five refused with evidence, four deferred with reasons.**

Household learning moved from **one room to five**: a household now meets what THA has noticed about its planning on the planner, its shopping on the shopping list, its pantry on the shelves, and its cooking in the cookbook — through one shared fetch, one existing capability, one existing component, and **no new intelligence of any kind**.

The mission's own instruction — *reuse existing services and UI, do not duplicate intelligence* — is what produced the refusals. Five discovery engines are not unsurfaced features waiting for a door; they are Companion grounding that is already correctly placed, and the rooms they would have been built into already search the same stores better. **The most valuable thing HOUSE_ACT2 found is that four of its seven priorities should not be built.**

The strongest remaining door is **Nutrition Enhancement** — genuinely rendered by no room — and it is left undone deliberately, because the clean way to build it is a change of its own rather than the tail of this one.
