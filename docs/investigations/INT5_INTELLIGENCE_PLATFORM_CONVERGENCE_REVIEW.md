# INT5 — Intelligence Platform Architecture Convergence Review

**Status:** INVESTIGATION ONLY — no code, schema, route, UI, or capability binding changed.
**Classification:** Intelligence convergence review (point-in-time analysis; not governing architecture).
**Date:** 2026-06-30
**Author:** Architecture review (Claude Code)
**Reviews:** INT1 (foundation), INT2 (Planner read-only), INT3 (Shopping read-only), INT4 (Nutrition / Knowledge read-only)
**Governing documents:** `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1), `docs/architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` (TIP2), `docs/architecture/ARCHITECTURE_PRINCIPLES.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Git status at start | INT1–INT4 working tree (modified docs + untracked `server/intelligence/bindings/`, `handlers/`, tests); branch `int1-intelligence-platform` |
| HEAD commit | `a5294f80265a245d4120e6786a170775eeecbeb9` |
| **Rollback tag created** | **`int5-rollback-pre-review`** |
| Tag points to | `a5294f80265a245d4120e6786a170775eeecbeb9` |
| Action on rollback | `git checkout int5-rollback-pre-review` (or `git reset --hard int5-rollback-pre-review`) |
| Code modified | None — this document is the only artifact created |
| Schema / routes / UI modified | None |

**This is a review only.** No application code, schema, services, routes, prompts, or capability bindings were modified. The single output is this document.

---

## ARCHITECTURE BOOTSTRAP (gate)

Read before review: `docs/architecture/README.md` (the mandatory entry point), then TIP1 and TIP2. This review introduces **no proposed change** to runtime behaviour, so no STOP condition can arise from a conflicting proposal. The review instead **audits the existing INT1–INT4 implementation against** the governing architecture. Result of that audit is in §"Architecture Compliance Review" below — **PASS, no STOP**.

---

## 1. EXECUTIVE SUMMARY

After three independent live read-only bindings — Planner (INT2), Shopping (INT3), Nutrition / Knowledge (INT4) — the **Port → Handler → Binding** pattern over the INT1 foundation has **converged and is stable for read-only capabilities.** The architecture holds the governing lines: one platform, one registry, one intent engine, zero duplicated business logic of substance, owners unchanged, honest gaps end-to-end. All 139 binding/foundation tests pass (33 + 31 + 38 + 37).

The three bindings were not three repetitions of one scoping model — they deliberately exercised the **three scoping axes** the remaining capabilities need:

- **Planner** — household-owned data, explicit ownership resolution (entry → day → week → household).
- **Shopping** — household-scoped data, ownership enforced *inside the owner getter* (the port has no cross-household method by construction).
- **Nutrition / Knowledge** — public, non-user-scoped, source-gated knowledge.

That coverage is the strongest single signal for scaling: Pantry/Diary/Household are household-scoped (Planner/Shopping shape), Profile is own-user (a narrower Shopping shape), Partners is public/advisory (Nutrition shape). **The next five capabilities introduce no scoping model the existing three have not already proven.**

**Verdict: GO for additional *read-only* bindings**, conditional on two low-risk pre-scale actions (a metadata-executability fix and a decision on the Shopping interpretation boundary; both §10). **The write/destructive path of the pattern is UNPROVEN** — every live binding is read-only, so the `confirm → invoke` write pipeline has zero live exercise. The first write binding must be treated as a *new* convergence checkpoint, not a continuation of this one.

---

## 2. PATTERN ASSESSMENT

The pattern, as it now stands, is three layers plus the foundation:

```
Capability (registry descriptor)        ← metadata: owner, API, supportedIntents, permissions, class
   → Port      (handlers/*-read-port.ts) ← narrow read-only interface; 1:1 dynamic-import forwards to owner
   → Handler   (handlers/*-read-handler) ← verb-gate + read projection + honest gaps; built by a factory(resolvePort)
   → Binding   (bindings/*.ts)           ← one line: registerHandler(id, createXHandler(createXPort))
   → Business Owner (storage / registry) ← unchanged source of truth
```

| Property | Planner (INT2) | Shopping (INT3) | Nutrition (INT4) | Converged? |
|---|---|---|---|---|
| Narrow read-only Port interface | ✅ | ✅ | ✅ | **Yes** |
| Dynamic-import port factory (no DB at import) | ✅ `createStoragePlannerReadPort` | ✅ `createStorageShoppingReadPort` | ✅ `createRegistryNutritionKnowledgeReadPort` | **Yes** |
| Handler = `create…Handler(resolvePort) → CapabilityHandler` | ✅ | ✅ | ✅ | **Yes** |
| Verb-gate → honest `CapabilityExecutionError("gap")` | ✅ | ✅ | ✅ | **Yes** |
| One-line idempotent binding | ✅ | ✅ | ✅ | **Yes** |
| Test injects in-memory port via handler factory | ✅ | ✅ | ✅ | **Yes** |
| Owner unchanged | ✅ | ✅ | ✅ | **Yes** |

The shape is repeated faithfully enough that the INT4 binding is a near-mechanical transform of INT3. That is the definition of a converged pattern. The remaining sections identify the *small* residual variations and the *structural* gaps that matter before scaling.

---

## 3. PORT REVIEW (Q1 — are the Port interfaces consistent?)

**Consistent. Differences are genuine domain differences, not drift.**

- All three define a `readonly` interface of `Promise`-returning read methods, each a documented 1:1 forward to an existing owner method, plus a `create…Port()` async factory using **dynamic `import()`** so loading `server/intelligence` opens no DB connection. This is uniform and correct (TIP1 Principle 7: the registry/port layer is a derived seam, never a second owner).
- **Scoping is expressed differently, appropriately:**
  - Planner port exposes `getHouseholdForUser` + raw getters; ownership is resolved **in the handler**.
  - Shopping port getters take `userId` and are household-scoped **inside the owner**; the port has *no* method that accepts a foreign id — cross-household reads are structurally impossible at the port boundary. This is the stronger design.
  - Nutrition port takes **no `userId`** at all — it is public knowledge by construction, and forwards only the registry's already display-safe, source-gated helpers (internal `evidenceStrength`/`confidence` stripped upstream).

**Observation P-1 (minor):** the safest scoping idiom is Shopping's — *no port method can express a cross-tenant read.* Planner relies on the handler to enforce ownership after a raw `getPlannerWeek(id)`. Both are correct today, but the Shopping idiom removes a class of future mistake. Recommend it as the **reference idiom** for the household-scoped capabilities to come (Pantry, Diary, Household).

---

## 4. HANDLER REVIEW (Q2 — are Handlers following the same contract?)

**Same contract. Two cosmetic variations, one substantive one.**

Uniform: each handler is a closure `(intent, context) => Promise<unknown>` produced by a factory taking `resolvePort`; each gates on `intent.verb`; each returns **only** typed read projections carrying a `source`/`scope` discriminator; each throws `CapabilityExecutionError` for honest non-results; none calls a DB directly.

- **Variation H-1 (cosmetic):** Planner & Shopping resolve the port **once** after the verb-gate; Nutrition resolves it **inside each verb branch** (`await resolvePort()` per `case`). Same single call per invocation, but the structure differs. Harmless; worth standardising when boilerplate is extracted (§9).
- **Variation H-2 (cosmetic):** Planner & Shopping use a single catch-all gap for "verb not read/explain"; Nutrition emits **per-verb** gap messages for `analyse`/`compare`/`report` plus a catch-all. Nutrition's is richer and more honest; it is the better template.
- **Variation H-3 (substantive — see §6):** the Shopping handler contains the most *interpretation* of stored fields (`isUnresolved`, `RESOLVED_STATES`, `hasStoredMatch`, basket total summation). Planner and Nutrition are nearly pure projections. This is the one place the handler layer edges from "project the owner's data" toward "compute a derived view," and it is the principal convergence risk to watch.

---

## 5. BINDING REVIEW (Q3 — are Bindings consistent and minimal?)

**Maximally minimal and consistent** — each binding is a single `registerHandler(ID, createXHandler(createXPort))` call, idempotent, exporting a stable `*_CAPABILITY_ID`. They are bound eagerly on the singleton in `intelligence-platform.ts` (three lines), and the dynamic-import ports keep that import side-effect DB-free.

**Finding B-1 (doc defect, not behaviour):** every binding's docstring says it is "Used both for the canonical singleton (production) and, **with an injected port, for isolated tests**." The binding function signature is `bind…(platform)` — it takes **no port** and always wires the production port factory. Tests do *not* use the binding; they call `createXHandler(async () => makePort())` + `registerHandler` directly (verified in all three test files). The claim is misleading. Either (a) correct the docstring, or (b) — better for the converged pattern — give each binding an **optional port-factory parameter** (`bind…(platform, resolvePort = createStorageXPort)`) so tests and production share the same binding entry point. Recommended as part of §9. *(No change made — investigation only.)*

---

## 6. PERMISSION REVIEW (Q4 — is permission enforcement correctly centralised?)

**Correctly centralised, with the right split between platform-gate and owner-delegated checks.**

- The **capability gate** is centralised in `permissions.ts::canInvokeCapability`, called exactly once in `intent-engine.ts` step [3], before any handler runs. It enforces `availability !== "never"`, minimum-role, and knowledge-class — all server-resolved, never prompt-derived (TIP1 §6.2 boundary 3). ✅
- The **confirmation gate** (`confirmationFor`) is deterministic and server-side (step [4]). ✅
- **Ownership / own-data checks are correctly *delegated*** to the handler+owner (TIP1 §6.2: the platform does not re-implement ownership). Each read-only handler `requireUserId`s the server-resolved context and scopes every read to the caller's household; cross-household / anonymous reads return `denied` with **no existence leak** (week/day/item "not found in your planner/list"). ✅

**Observation PM-1:** there is a clean division — *class/role* is platform-centralised; *row ownership* is owner-delegated. This is exactly the TIP1 design and it held across all three bindings. Nothing to fix.

**Observation PM-2 (latent):** `confirmationFor` and the whole `confirm → invoke` branch are **never exercised by a live binding** — all three bindings execute only read-only verbs, for which confirmation is always `"none"`. The confirmation machinery is unit-tested in the foundation suite but has **no live write binding** behind it. This is not a defect; it is an *unproven surface* and the core reason the write pattern is a separate checkpoint (§11).

---

## 7. HONEST GAP REVIEW (Q5 — are honest gaps handled consistently?)

**Consistent and disciplined — this is the strongest single property of the implementation.**

- One mechanism end-to-end: a bound handler throws `CapabilityExecutionError(status, message)` with `status ∈ {gap, denied, unsupported_intent}`; the Intent Engine catches it (step [6]) and maps it onto the structured `IntentOutcome` vocabulary. Any *other* throw propagates as a genuine fault — correct (the platform never disguises a real error as a gap, and never fabricates an `ok`). ✅
- The non-fabrication guarantee (Principle 6 / Risk R2) is honoured in every binding and is **explicitly asserted by tests**: Planner refuses to invent a selection rationale and refuses "today"; Shopping refuses a £0 / fabricated basket when nothing is priced and never invents a price or product match; Nutrition refuses unknown slugs, empty search, and unlinked food↔benefit claims. ✅
- Closed-allow-list gaps live in **two complementary places**, correctly: registry-level `SEED_GAPS` (e.g. `shopping.order`, `planner.delete` of a whole week) surface as `gap` at validation; handler-level gaps (verb bound read-only, unsupported scope) surface as `gap` at invoke. Both are honest; the split is intentional (no owner endpoint vs. owner exists but binding is read-only).

**Observation HG-1 (minor):** only Planner & Shopping define both `gap` and `denied` helpers; Nutrition defines only `gap` (it is public, so `denied` never arises). Reasonable, but a shared kit (§9) should provide both so a future user-scoped knowledge read doesn't reinvent `denied`.

---

## 8. CAPABILITY REGISTRY / METADATA REVIEW (Q6, Q7)

**Q6 — is business logic leaking into the platform?** Almost none. The registry is a faithful descriptor of existing owners; the engine holds only schema + routing. The **one** place to watch is Shopping's handler (H-3): `RESOLVED_STATES`, `isUnresolved`, and the basket-total summation are *derived interpretations of stored fields*, not pure pass-throughs. They fabricate nothing (every input is an owner-stored value) and are defensible as read projections — but they encode a **notion of "resolved" and a price aggregation that the Shopping owner, not the platform, should arguably define.** This is the thin end of Risk R4 ("the engine/handler grows business logic"). It is not a violation today; it is the boundary to hold deliberately rather than by accident.

**Q7 — is capability metadata sufficient? Largely yes, with one structural gap.**

**Finding M-1 (structural — most important metadata finding):** `availability` is a **capability-level** flag flipped `registered → available` when *any* handler binds. But each live handler executes only a **subset** of the capability's `supportedIntents`:

| Capability | `supportedIntents` (registry) | Actually executable today |
|---|---|---|
| `planner` | read, explain, recommend, generate, add, move, replace, delete, import, share | **read, explain** (rest → gap) |
| `shopping` | read, explain, add, delete, generate | **read, explain** (rest → gap) |
| `nutrition-knowledge` | read, explain, search, analyse, compare, report | **read, explain, search** (rest → gap) |

So a discovery surface reading the registry sees `planner` as `available` and `add` in its allow-list, and would reasonably infer "planner.add is available" — when at runtime it returns an honest gap. The registry **over-advertises executable surface.** Today this is masked because no surface consumes the catalogue yet, and the runtime is always honest. But the *catalogue is meant to be the thing future surfaces read* (TIP1 §2 "Capability Registry as allow-list"; the README calls `listCapabilities()` "the catalogue future surfaces read"). Before any surface consumes it, metadata needs a **per-verb (or per-capability) notion of "bound/executable" vs "registered/gapped."** Options: a `boundIntents`/`executableIntents` set on the descriptor populated at bind time, or splitting `availability` to verb granularity. This is a pre-scale fix because it gets harder to retrofit with every binding added.

**Observation M-2 (minor):** the `developer` capability is correctly `availability: "never"` in this user-facing registry, and `canInvokeCapability` denies `never` first. Physical-isolation intent (TIP1 §7) is honoured at the metadata layer. Good.

**Q8 — repeated boilerplate worth abstracting?** Yes, and it is now visible across three copies: `toInt`, `requireUserId`, the `gap`/`denied` helper constructors, the verb-gate guard, and the dynamic-import port-factory shape are duplicated in Planner and Shopping (Nutrition shares most). Three is the canonical "rule of three" threshold. A small shared **read-binding kit** (`handlers/_read-kit.ts`: `toInt`, `requireUserId`, `gap`/`denied`, a `readOnlyVerbGuard`) would remove the duplication *without* abstracting away the per-capability projection logic (which should stay explicit). See §10.

---

## 9. ARCHITECTURE COMPLIANCE REVIEW (the gate)

| Check | Verdict | Evidence |
|---|---|---|
| One Intelligence Platform | ✅ | Single `intelligencePlatform` singleton (`intelligence-platform.ts`); constructing others is test-only. |
| One Capability Registry | ✅ | Single `CapabilityRegistry`, seeded C1–C13; bindings only `registerHandler`, never a second registry. |
| One Intent Engine | ✅ | Single `IntentEngine` owned by the platform; the only `route()` path. |
| No duplicate orchestration | ✅ | All three bindings route through the same engine pipeline; no binding has its own dispatch. |
| No duplicate business logic | ⚠️ PASS-with-watch | True except Shopping's stored-state interpretation (H-3 / M-1 boundary). No planner/shopping/nutrition *rule* is re-implemented; the watch item is derived-view computation, not owned logic. |
| No duplicate state | ✅ | No conversation/memory/history anywhere; intents are transient. |
| Business services remain owners | ✅ | Every read forwards to storage / household / registry unchanged; ports have no write methods. |
| Existing architecture extended only | ✅ | Reuses `access.ts`, `storage`, `household`, `nutrition-knowledge-registry`; adds no parallel stack. |

**AI ARCHITECTURE COMPLIANCE:** uses the canonical platform ✅ · uses the registry ✅ · uses the intent engine ✅ · reuses existing services ✅ · creates no second assistant ✅ · duplicates no conversation state ✅ · registered capabilities only ✅ · permission-aware access ✅ · produces honest gaps ✅.

**Gate result: PASS. No STOP condition.** The single watch item (Shopping derived-view interpretation) is a boundary to hold, not a present violation.

---

## 10. RISKS

| ID | Risk | Severity | Mitigation / pre-scale action |
|---|---|---|---|
| C1 | **Registry over-advertises executable surface** (M-1): `available` capability + write verb in `supportedIntents` reads as "executable" but returns a gap at runtime. Misleads the first catalogue-consuming surface. | 🟠 High | Add bind-time `executableIntents`/`boundIntents` to the descriptor (or verb-level availability) **before** any surface consumes `listCapabilities()`. |
| C2 | **Derived interpretation drifts into the handler** (H-3): Shopping's `isUnresolved` / `RESOLVED_STATES` / basket-total are platform-side derived views of owner state. Each new binding may add "just one more" computed view → Risk R4 creep. | 🟠 High | Decide the line explicitly: either accept "pure aggregation of stored fields with no fabrication" as the permitted ceiling (and document it), or push `isUnresolved`/basket-summary down to owner-exposed methods. Hold the line in code review for every future binding. |
| C3 | **Write/destructive path unproven** (PM-2): `confirm → invoke` has no live binding. The pattern is proven READ-ONLY only. | 🟠 High | Treat the first write binding (likely Diary `add` or Pantry `add`) as a **new convergence checkpoint**, not a continuation. Prove confirmation, idempotency, and owner-delegated validation there before scaling writes. |
| C4 | **Binding/test entry-point divergence** (B-1): binding docstrings claim a test-injection capability the function doesn't have; tests bypass the binding. | 🟡 Medium | Add an optional `resolvePort` param to each `bind…` so production and tests share one entry point; or correct the docstrings. |
| C5 | **Boilerplate triplication** (Q8): `toInt`/`requireUserId`/`gap`/`denied`/verb-guard copied per binding → inconsistent fixes as count grows. | 🟡 Medium | Extract a small `handlers/_read-kit.ts`; keep per-capability projection explicit. Do this *before* binding #4–#8, not after. |
| C6 | **Cross-tenant exposure via raw-id port methods** (P-1): Planner's port exposes `getPlannerWeek(id)` with ownership enforced only in the handler; a future careless handler could skip the check. | 🟡 Medium | Adopt Shopping's idiom (no port method can express a foreign-id read) as the reference for household-scoped capabilities. |
| C7 | **Premature declarative generalisation:** turning the pattern into a config-driven generator now would freeze the metadata gap (C1) and interpretation ambiguity (C2) into a framework. | 🟡 Medium | Keep bindings **manual** until C1–C3 are resolved and ≥1 write binding exists; only then consider declarative. |

---

## 11. RECOMMENDATIONS

**Pre-scale (do before binding capability #4):**

1. **Fix capability metadata executability (C1).** Introduce a bind-time record of which verbs are actually executable, so the registry stops over-advertising. Highest-leverage fix; cheapest now.
2. **Decide and document the interpretation ceiling (C2).** Write one paragraph into the platform README / TIP governance defining what a read handler may compute (recommended: "pure aggregation/filtering of owner-stored fields, zero fabrication, zero rule the owner doesn't already encode") and review Shopping's `isUnresolved`/basket-summary against it. Either bless it or push it down to the owner.
3. **Extract the read-binding kit (C5)** — `toInt`, `requireUserId`, `gap`/`denied`, `readOnlyVerbGuard` — and standardise port-resolution placement (H-1) and per-verb gap messaging (H-2, adopt Nutrition's richer style).
4. **Unify the binding entry point (B-1/C4):** optional `resolvePort` param on each `bind…`, used by tests, defaulting to the production factory.
5. **Adopt the Shopping port idiom (P-1/C6)** as the reference for the household-scoped capabilities next in line.

**Scaling guidance (Q9, Q10):**

6. **Keep bindings manual, not declarative (C7)** until the above land and at least one write binding is proven. The pattern is converged but still *settling* its metadata and interpretation contracts; freezing it into a generator now would cement the gaps.
7. **Read-only capabilities are GO.** Pantry, Diary (read), Profile (read), Household (read), Partners map onto already-proven scoping models (household-scoped → Shopping idiom; own-user → narrower; public/advisory → Nutrition idiom). No new scoping axis is introduced.
8. **Writes are a separate checkpoint (C3).** The first `add`/`move`/`delete` binding must re-run a convergence review focused on `confirm → invoke`, idempotency, and owner-delegated business-rule rejection — none of which the three read-only bindings exercise.

---

## 12. GO / NO-GO FOR SCALING ADDITIONAL BINDINGS

> **GO — for additional READ-ONLY capability bindings (Pantry, Diary-read, Profile-read, Household-read, Partners),** conditional on completing pre-scale actions **1 (metadata executability)** and **2 (interpretation ceiling)** first; actions 3–5 are strongly recommended hygiene that get cheaper the sooner they are done.
>
> **CONDITIONAL HOLD — for the first WRITE/DESTRUCTIVE binding.** The `confirm → invoke` path is unproven by any live binding. The first write capability must be gated behind its own convergence checkpoint, not folded into this GO.

**Rationale.** The Port → Handler → Binding pattern has converged across three independent owners and the three scoping models the rest of the roadmap needs; all 139 tests pass; every governing line (one platform / one registry / one engine; owners unchanged; honest gaps; permission-aware) holds. The remaining work is *hardening the metadata and interpretation contracts* and *proving the write path* — refinements on a sound foundation, not a redesign. The architecture is ready to scale read-only bindings now and ready to scale writes after one more proof point.

---

## DEFINITION OF DONE — CHECK

| Requirement | Met |
|---|---|
| INT1–INT4 reviewed | ✅ §2–§9 (foundation, all three bindings, ports, handlers, registry, permissions, tests run green) |
| Reusable binding pattern assessed | ✅ §2 pattern table; §3–§5 port/handler/binding reviews |
| Convergence risks identified | ✅ §10 (C1–C7), with the substantive ones (metadata executability, interpretation creep, unproven write path) called out |
| Recommendations documented | ✅ §11 |
| Clear go/no-go provided | ✅ §12 — GO for read-only (with two conditions), conditional hold for writes |
| Report saved to `docs/investigations/INT5_…` | ✅ this file |
| Rollback identifier reported before beginning | ✅ `int5-rollback-pre-review` |

---

## APPENDIX — CONSTRAINTS COMPLIANCE

✅ No code changes · ✅ No schema changes · ✅ No route changes · ✅ No new capability bindings · ✅ No refactoring · ✅ No UI · ✅ No assistant · ✅ Investigation only.

*Review only. No implementation performed. Rollback: `git checkout int5-rollback-pre-review`.*
