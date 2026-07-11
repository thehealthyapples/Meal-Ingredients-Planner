# INT4 — Nutrition / Knowledge Capability Binding (Read-only) — Implementation

**Date:** 2026-06-30
**Branch:** int1-intelligence-platform
**Risk:** 🟡 AMBER
**Reason:** Third *executable* binding on the Intelligence Platform — a new read-only port/handler/binding + test against the existing Nutrition / Knowledge owner. No schema change, no route, no public endpoint, no UI, no change to any existing user-facing surface. The only runtime change is that the `nutrition-knowledge` capability flips from `registered` to `available` on the canonical singleton (internal-only; nothing calls it yet).

> **Summary:** Bound the **third live capability** to the THA Intelligence Platform: the **read-only Nutrition / Knowledge** capability. The reusable **Port → Handler → Binding** pattern proven by the Planner (INT2) and Shopping (INT3) is reused unchanged against a third, independent owner. The platform routes read-only knowledge intents end-to-end — intent → Capability Registry → permission check → Nutrition / Knowledge owner → response — and gained **no nutrition logic, no health-claim logic, no food-science logic, and no evidence interpretation**: the handler delegates every read to the existing source-gated owner (`server/services/nutrition-knowledge-registry.ts`, WS0 `knowledge_*`, SoT D1). THA trust rules are preserved by construction — it surfaces **only** the owner's source-gated, display-safe editorial knowledge, never fabricates a nutrition fact or a health benefit, and never links a benefit to a food the owner did not link. Unsupported and unsourced requests return **honest structured gaps**. No write path exists in the binding.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Git status at start | Branch `int1-intelligence-platform`; pre-existing uncommitted governance/INT work (GOV-AI*/TIP*/INT2/INT3) in the tree, unrelated to INT4 and left untouched |
| **Rollback tag** | **`int4-nutrition-knowledge-binding-rollback-20260630`** → `a5294f80265a245d4120e6786a170775eeecbeb9` (INT1 foundation commit) |
| This task's writes (new) | `server/intelligence/handlers/nutrition-knowledge-read-port.ts`, `server/intelligence/handlers/nutrition-knowledge-read-handler.ts`, `server/intelligence/bindings/nutrition-knowledge.ts`, `server/tests/test-intelligence-nutrition-knowledge-binding.ts`, this report |
| This task's edits (existing) | `server/intelligence/intelligence-platform.ts` (bind on singleton), `server/intelligence/index.ts` (exports), `server/intelligence/README.md`, `package.json` (+1 test script, appended to `test`), `server/tests/test-intelligence-shopping-binding.ts` (one INT3 scope-lock assertion updated — see below) |
| Schema modified | **None** |
| Rollback | `git checkout int4-nutrition-knowledge-binding-rollback-20260630` (or `git reset --hard <tag>`) |

**INT3 test edit, justified:** the INT3 test asserted "*exactly TWO capabilities are live*" as its scope-lock check **at the INT3 point in time**. INT4 legitimately binds a third live capability, so that single hard-coded count is necessarily superseded. The assertion was changed to its still-true invariant — *planner and shopping both remain live (`available`), and every live capability is a read-only binding* — preserving the test's real intent. All other INT3 assertions are unchanged and pass.

No implementation began until this rollback protection was confirmed and reported.

---

## REFERENCE DOCUMENTS READ (Architecture Bootstrap)

- [x] `docs/architecture/README.md` (mandatory entry point)
- [x] `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1)
- [x] `docs/architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` (TIP2 — C3 Nutrition / Knowledge, `read-only`/`R`)
- [x] `server/intelligence/*` (the INT1 foundation + INT2 Planner + INT3 Shopping bindings being extended)
- [x] Nutrition / Knowledge owner: `server/services/nutrition-knowledge-registry.ts` (display-safe, source-gated read helpers), `shared/schema.ts` (`knowledge_*` tables, SoT D1), `server/routes.ts` (`/api/knowledge/*` read routes — public)

**Bootstrap result:** No conflict with the governing architecture. The `nutrition-knowledge` capability already existed in the one Capability Registry as a `registered`, `read-only`/`R` descriptor of the existing owner. This implementation *extends* the foundation along its designed `registerHandler` seam, reusing the INT2/INT3 pattern verbatim. No second platform, registry, engine, knowledge store or assistant is introduced. **STOP not triggered.**

---

## OBJECTIVE — proven

The platform now routes a read-only knowledge request through the full pipeline:

```
Intent          →  Capability Registry      →  Permission Check  →  Nutrition / Knowledge  →  Response
read               nutrition-knowledge (found)  public knowledge      registry reads             food / nutrient /
{scope:food,slug}  available                    role ≥ user           (delegated)                benefit / search (honest)
```

No business logic executes inside the Intelligence Platform. The handler is the single seam that calls the owning service, and it only *reads* the owner's already source-gated, display-safe output.

---

## WHAT WAS BUILT

### 1. `handlers/nutrition-knowledge-read-port.ts` — the delegation surface
A narrow, **read-only** interface (`NutritionKnowledgeReadPort`) whose methods are 1:1 forwards to existing owner helpers in `nutrition-knowledge-registry.ts`: `getFoodDetailView`, `getNutrientDetailView`, `getBenefitDetailView`, `getFoodBenefitsForDisplay`, `searchKnowledgeRegistry`, `listFoodCategories`, `listFoodCards`. Every one of these owner helpers is already **display-safe and source-gated** — they strip the internal `evidenceStrength`/`confidence`/`source` editorial signals before returning. The port adds **no nutrition rule, no scoring, no food-science interpretation** and has **no write method** by construction. `createRegistryNutritionKnowledgeReadPort()` builds the production port with **dynamic imports**, so binding opens **no database connection at import time** (the registry's `db` import is only executed on first invocation). The interface is injectable for in-memory tests.

### 2. `handlers/nutrition-knowledge-read-handler.ts` — the third execution handler
- Executes **only** read-only verbs. `read`, `explain`, `search` resolve to the owner; `analyse`, `compare`, `report` (in the registry allow-list but with **no grounded owner read** that is safe and in-scope here) return an **honest `gap`** explaining the owner does not expose that as a grounded read in this binding — never a fabricated analysis/comparison/report.
- **Read scopes (`read`):** `food` (by `slug` → `getFoodDetailView`), `nutrient` (by `slug`), `benefit` (by `slug`), `categories` (food categories with counts), `foods` (optional `category` filter). Unknown food/nutrient/benefit slug → honest `gap` (unknown key — never an invented fact). Unknown/absent scope → honest `gap`.
- **`search`:** `searchKnowledgeRegistry(query)` over foods / nutrients / benefits. Empty query → honest `gap`.
- **`explain`:** explains a food's benefit(s) using the owner's **source-gated** editorial wording only:
  - `{ foodSlug }` → the food's grounded benefits with their editorial descriptions; food with no stored benefits → honest `gap`.
  - `{ foodSlug, benefitSlug }` → that benefit's grounded description **only if the owner links it to that food**; if the owner records no such link → honest `gap` ("the knowledge owner does not link …; the platform will not fabricate a benefit").
  - `{ benefitSlug }` → the benefit's grounded description and the foods the owner says support it.
  - Unknown food/benefit slug → honest `gap`.
- **No fabrication:** the handler never authors a nutrition fact, never invents a health benefit, never asserts a benefit/food link the owner did not store, and never surfaces the owner's internal evidence/confidence signals.

### 3. `bindings/nutrition-knowledge.ts` — activation
`bindNutritionKnowledgeReadCapability(platform)` registers the handler against the `nutrition-knowledge` capability, flipping its availability `registered → available`. Called once on the canonical singleton in `intelligence-platform.ts`, immediately after the Shopping binding.

### 4. No engine change required
INT2 added `CapabilityExecutionError` and the engine's honest-failure catch; INT3 proved it generalises. INT4 reuses both unchanged — the Nutrition / Knowledge handler throws the same structured `gap`/`denied` and the engine maps it to the honest outcome. A third independent owner is bound with **zero new orchestration code**.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
[x] One canonical Intelligence Platform
    Extended the existing singleton; no second platform constructed.

[x] One Capability Registry
    Bound to the existing 'nutrition-knowledge' entry via registerHandler; no new
    registry, no new capability invented.

[x] One Intent Engine
    Unchanged routing and unchanged honest-failure catch. No second engine,
    no business branch added.

[x] Nutrition / Knowledge remains the owner of nutrition facts and health knowledge
    The handler delegates every read to nutrition-knowledge-registry.ts. It holds no
    nutrition fact, no health-claim wording, no scoring, no food-science rule of its own.

[x] No duplicate nutrition logic / no duplicate knowledge store / no duplicate state
    Read-only delegation; no parallel knowledge store, no cached knowledge, no
    re-derived claims. The port forwards to the single owner (WS0 knowledge_*, SoT D1).

[x] Existing architecture extended only
    Reused the INT2/INT3 Port → Handler → Binding pattern and the registerHandler seam
    exactly as designed.
```

## AI ARCHITECTURE COMPLIANCE

```
[x] Uses the canonical Intelligence Platform        (intelligencePlatform singleton)
[x] Uses the AI Capability Registry                 (binds the existing 'nutrition-knowledge' capability)
[x] Uses the Intent Engine                          (full LOCATE→…→RESPOND pipeline)
[x] Reuses the existing Nutrition / Knowledge service (nutrition-knowledge-registry via the port)
[x] Does not create another assistant               (no assistant, no chat, no LLM, no embeddings)
[x] Does not duplicate conversation state            (none exists; none added)
[x] Uses registered capabilities only                (closed allow-list enforced)
[x] Permission-aware access                          (server-side role gate; public general knowledge,
                                                      mirroring the owner's existing access rules)
[x] Produces honest gaps rather than fabricated knowledge  (unknown slug/scope, unsupported grounded
                                                            read, unlinked benefit → honest gap)
```

---

## NUTRITION TRUST RULES — preserved

| THA trust rule | How INT4 preserves it |
|---|---|
| No fabricated nutrition facts | Only the owner's stored `knowledge_*` foods/nutrients are surfaced; unknown slug → honest gap. |
| No fabricated health benefits | Benefits come only from the owner's stored food↔benefit / nutrient↔benefit links; an unlinked (food, benefit) → honest gap, never invented. |
| No medical advice / diagnosis / treatment claims | The handler returns only the owner's editorial descriptions; it authors nothing and makes no clinical claim. |
| No unsourced claims / source-gated only | Every claim originates in the source-gated registry; the handler never composes a claim of its own. |
| No confidence invention | The owner's internal `evidenceStrength`/`confidence` signals are never surfaced (the owner already strips them in its display helpers); the handler invents none. |
| Honest gaps over speculation | Unknown food/nutrient/benefit, empty search, unlinked benefit, and `analyse`/`compare`/`report` (no safe grounded owner read in scope) all → honest gap. |

---

## DATA IMPACT

| Declaration | Status |
|---|---|
| **Reads existing data** | ✅ Yes — `knowledge_*` foods / nutrients / health benefits and their links, via the existing source-gated owner. General (public) food knowledge only. |
| **Writes new data** | ❌ No — the binding has no write path. |
| **Changes meaning of existing data** | ❌ No. |
| **Requires backfill** | ❌ No. |
| **Schema changes** | ❌ **None** (zero — the preferred outcome per the brief). |

No persistence was needed; **STOP-on-persistence was not triggered.**

---

## PERMISSIONS

General food knowledge is **public** — this mirrors the owner's existing access rules (`/api/knowledge/*` routes are unauthenticated). The platform's server-side capability gate (`canInvokeCapability`) still applies: `nutrition-knowledge` requires role ≥ `user` and `public` knowledge class, enforced before any owner read. The binding exposes **only** general, non-user-specific knowledge, so there is no cross-user surface and no ownership-scoped data. **User-specific / diary-linked nutrition summaries** (e.g. `/api/nutrition-centre`, which is authenticated and household/diary-linked) are deliberately **out of INT4 scope** (scope-lock excludes Diary) and return an honest `gap`, recorded as a future governed authenticated binding under SUGGESTION.

---

## TESTING

New: `npm run test:intelligence-nutrition-knowledge-binding` — **37 assertions, all passing**, using an injected in-memory owner (no live DB). Coverage:

- **Capability lookup** — nutrition-knowledge is `available` on the singleton; **three** live capabilities (planner + shopping + nutrition-knowledge); all live capabilities are read-only bindings — scope lock.
- **Permission validation** — the capability gate permits role ≥ `user`; general food knowledge is public (mirrors the owner's real access rules); no cross-user surface exists.
- **Handler invocation + owner delegation** — `read`/`search`/`explain` return owned data; delegation to the registry helpers is observed (spy).
- **Known food read** — `read { scope: food, slug }` returns the owner's display-safe food detail (benefits/nutrients), no internal evidence signal.
- **Unknown slug handling** — unknown food/nutrient/benefit slug → honest `gap` (never an invented fact).
- **Source-gated explanation** — `explain { foodSlug, benefitSlug }` returns the owner's grounded benefit description.
- **No fabricated benefits** — `explain` of a (food, benefit) the owner does not link → honest `gap`.
- **Unsupported intent** — a verb outside the allow-list → `unsupported_intent`; `analyse`/`compare`/`report` (no safe grounded owner read in scope) → honest `gap`.
- **Honest gap behaviour** — empty search, unknown scope, unlinked benefit, user-specific report → honest `gap`.
- **No write path** — no mutating verb executes; the handler has no write method and the registry port has none.

Regression: `npm run test:intelligence-platform` — **33/33 passing** (INT1 unchanged). `npm run test:intelligence-planner-binding` — **31/31 passing** (INT2 unchanged). `npm run test:intelligence-shopping-binding` — **38/38 passing** (INT3, with the one scope-lock assertion updated for the now-three live capabilities). All new/edited intelligence files are typecheck-clean (`tsc --noEmit` reports **zero** errors under `server/intelligence/` and in the new test); the repository's pre-existing **25** unrelated `tsc` errors (all in `server/scripts/*` and three unrelated `server/tests/*`) are unchanged from the rollback tag.

---

## TRUST CHECK

- [x] Nutrition ownership unchanged — handler only reads via the owner.
- [x] Knowledge ownership unchanged — no new knowledge store, no re-authored claims.
- [x] Source of Truth unchanged — no new store, no schema change.
- [x] No duplicate nutrition implementation — delegation only.
- [x] Intelligence Platform only orchestrates — no business logic added.
- [x] Unsupported requests return honest gaps — verified by test.
- [x] Unsourced claims are suppressed — only source-gated owner output is surfaced; unlinked benefits → gap.
- [x] Existing nutrition/knowledge behaviour unchanged — no route/service edited; regression tests green.

---

## SCOPE LOCK — honoured

Implemented **only** the Nutrition / Knowledge read-only capability binding. **Not** started: Pantry, Diary, Profile, Conversation, Voice, User Assistant, nutrition writes, knowledge ingestion/indexing, LLM generation, or embeddings.

### SUGGESTION (not implemented)

- **Authenticated nutrition-centre / weekly report binding (future, governed):** `/api/nutrition-centre` (and the `nutrition-centre-assembler`) already assemble a safe, read-only household summary. Binding it would let the platform answer user-specific nutrition `report` intents — but it is household/diary-linked, so it requires authenticated own-data scoping and belongs to a workstream that also touches the Diary capability (out of INT4 scope-lock). Surface it through the platform (not a new route) when undertaken.
- **`compare` / `analyse` as grounded reads (only if the owner exposes them):** these stay honest gaps until the Nutrition / Knowledge owner exposes a single grounded comparison/analysis read it already trusts. The platform must never compose the comparison or analysis itself.
- **INT5 — fourth read-only binding (Pantry or Partners):** both are natural next read-only owners (`Pantry` has read discovery/stories; `Partners` is `R+A`); follow the same Port → Handler → Binding pattern with honest gaps.
- **Thin internal accessor for surfaces:** when a future Nutrition Coach persona needs knowledge reads, expose them through the platform (not a new route) so permission/honesty stay centralised — and never give the persona its own copy of nutrition logic (TIP1 §12, the line to hold).
