# INT3 — Shopping Capability Binding (Read-only) — Implementation

**Date:** 2026-06-30
**Branch:** int1-intelligence-platform
**Risk:** 🟡 AMBER
**Reason:** Second *executable* binding on the Intelligence Platform — a new read-only port/handler/binding + test against the existing Shopping owner. No schema change, no route, no public endpoint, no UI, no change to any existing user-facing surface. The only runtime change is that the `shopping` capability flips from `registered` to `available` on the canonical singleton (internal-only; nothing calls it yet).

> **Summary:** Bound the **second live capability** to the THA Intelligence Platform: the **read-only Shopping** capability. The reusable **Port → Handler → Binding** pattern proven by the Planner in INT2 is reused unchanged against a second, independent owner. The platform routes read-only shopping intents end-to-end — intent → Capability Registry → permission check → Shopping owner → response — and gained **no shopping logic**: the handler delegates every read to the existing Shopping owner (`server/storage.ts`, SoT D15). The THA trust rules are preserved by construction — it surfaces **only stored** prices/matches, never fabricates a price or a product, keeps unresolved items unresolved, keeps low-confidence matches reviewable, and never falls back to a generic supermarket. Unsupported and unsafe requests return **honest structured gaps**. No write path exists in the binding.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Git status at start | Branch `int1-intelligence-platform`; pre-existing uncommitted governance/INT work (GOV-AI*/TIP*/INT2) in the tree, unrelated to INT3 and left untouched |
| **Rollback tag** | **`rollback/before-INT3-shopping-capability-binding-20260630`** → `a5294f80265a245d4120e6786a170775eeecbeb9` (INT1 foundation commit) |
| This task's writes (new) | `server/intelligence/handlers/shopping-read-port.ts`, `server/intelligence/handlers/shopping-read-handler.ts`, `server/intelligence/bindings/shopping.ts`, `server/tests/test-intelligence-shopping-binding.ts`, this report |
| This task's edits (existing) | `server/intelligence/intelligence-platform.ts` (bind on singleton), `server/intelligence/index.ts` (exports), `server/intelligence/README.md`, `package.json` (+1 test script, appended to `test`), `server/tests/test-intelligence-planner-binding.ts` (one INT2 scope-lock assertion updated — see below) |
| Schema modified | **None** |
| Rollback | `git checkout rollback/before-INT3-shopping-capability-binding-20260630` (or `git reset --hard <tag>`) |

**INT2 test edit, justified:** the INT2 test asserted "*exactly ONE capability is live*" as its scope-lock check **at the INT2 point in time**. INT3 legitimately binds a second live capability, so that single hard-coded count is necessarily superseded. The assertion was changed to its still-true invariant — *the planner remains a live (`available`) capability on the singleton* — preserving the test's real intent. All other INT2 assertions are unchanged and pass.

No implementation began until this rollback protection was confirmed and reported.

---

## REFERENCE DOCUMENTS READ (Architecture Bootstrap)

- [x] `docs/architecture/README.md` (mandatory entry point)
- [x] `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1)
- [x] `server/intelligence/*` (the INT1 foundation + INT2 Planner binding being extended)
- [x] Shopping owner: `server/storage.ts` (`getShoppingListItems`, `getShoppingListExtras` — household-scoped), `shared/schema.ts` (`shopping_list` / `shopping_list_extras`, SoT D15), `server/routes.ts` (`/api/shopping-list/*` read routes)

**Bootstrap result:** No conflict with the governing architecture. The `shopping` capability already existed in the one Capability Registry as a `registered` descriptor of the existing owner. This implementation *extends* the foundation along its designed `registerHandler` seam, reusing the INT2 pattern verbatim. No second platform, registry, engine or assistant is introduced. **STOP not triggered.**

---

## OBJECTIVE — proven

The platform now routes a read-only shopping request through the full pipeline:

```
Intent   →  Capability Registry  →  Permission Check  →  Shopping Service  →  Response
read          shopping (found)         own household        storage reads       list / unresolved /
{scope:list}  available                authenticated        (delegated)         basket summary (honest)
```

No business logic executes inside the Intelligence Platform. The handler is the single seam that calls the owning service, and it only *reads*.

---

## WHAT WAS BUILT

### 1. `handlers/shopping-read-port.ts` — the delegation surface
A narrow, **read-only** interface (`ShoppingReadPort`) whose two methods are 1:1 forwards to existing owner getters: `storage.getShoppingListItems(userId)` and `storage.getShoppingListExtras(userId)`. Both getters resolve the caller's household internally, so the port is **own-data-only by construction** — there is no method that can take another user's or household's id. It has **no write methods** and **no shopping business rule**. `createStorageShoppingReadPort()` builds the production port with **dynamic imports**, so binding opens **no database connection at import time**. The interface is injectable for in-memory tests.

### 2. `handlers/shopping-read-handler.ts` — the second execution handler
- Executes **only** `read` and `explain`. Every other verb (including the write verbs `add`/`delete`/`generate` that are in the shopping allow-list) → honest `gap` ("read-only binding; Shopping remains the owner of all write/add/delete/pricing/basket/ordering/checkout operations").
- **Read scopes:** `list` (current shopping list items + extras), `unresolved` (items the owner has flagged — `needsReview` or a non-settled `resolutionState`), `basket` (pricing summary). Unknown/absent scope → honest `gap`.
- **Permission-aware, own-data only:** requires an authenticated numeric user; ownership is delegated to the household-scoped owner getters. A foreign item id is reported as not-found (`denied`) with no existence leak.
- **THA trust rules enforced in code:**
  - Surfaces a product match / store / price **only when the owner has stored one** (`matchedProductId`, `matchedStore`, `matchedPrice`) — never fabricated, never estimated.
  - The `basket` summary's total is the **sum of stored prices only**; unpriced and unresolved items are listed explicitly so a total can never hide them. **No stored prices → honest `gap`**, never a £0 / invented basket.
  - Never selects a supermarket (no generic fallback); only stored stores are reported.
  - Unresolved items are surfaced **as** unresolved with the owner's stored review reason; they are not auto-resolved, and low-confidence matches keep their stored `confidenceLevel`/`confidenceReason`.
  - `explain` reports only stored item state; an unassessed item (bare-default `raw` state, no other signal) → honest `gap` rather than an invented status.

### 3. `bindings/shopping.ts` — activation
`bindShoppingReadCapability(platform)` registers the handler against the `shopping` capability, flipping its availability `registered → available`. Called once on the canonical singleton in `intelligence-platform.ts`, immediately after the Planner binding.

### 4. No engine change required
INT2 already added `CapabilityExecutionError` and the engine's honest-failure catch. INT3 reuses both unchanged — the Shopping handler throws the same structured `gap`/`denied` and the engine maps it to the honest outcome. This confirms the INT2 honesty seam generalises to a second owner with zero new orchestration code.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
[x] One canonical Intelligence Platform
    Extended the existing singleton; no second platform constructed.

[x] One Capability Registry
    Bound to the existing 'shopping' entry via registerHandler; no new registry,
    no new capability invented.

[x] One Intent Engine
    Unchanged routing and unchanged honest-failure catch. No second engine,
    no business branch added.

[x] Shopping remains the owner of shopping data and shopping business logic
    The handler delegates every read to storage. It holds no shopping rule, no
    product matching, no price lookup, no basket assembly of its own.

[x] No duplicate shopping workflow / no duplicate shopping state
    Read-only delegation; no parallel store, no cached shopping state, no
    re-derived workflow. The port forwards to the single owner (SoT D15).

[x] Existing architecture extended only
    Reused the INT2 Port → Handler → Binding pattern and the registerHandler seam
    exactly as designed.
```

## AI ARCHITECTURE COMPLIANCE

```
[x] Uses the canonical Intelligence Platform        (intelligencePlatform singleton)
[x] Uses the AI Capability Registry                 (binds the existing 'shopping' capability)
[x] Uses the Intent Engine                          (full LOCATE→…→RESPOND pipeline)
[x] Reuses the existing Shopping business service   (storage via the port)
[x] Does not create another assistant               (no assistant, no chat, no LLM)
[x] Does not duplicate conversation state            (none exists; none added)
[x] Uses registered capabilities only                (closed allow-list enforced)
[x] Permission-aware access                          (server-side auth + own-household only)
[x] Produces honest gaps rather than fabricated knowledge  (unknown scope, no prices, no status,
                                                            no fabricated price/product/store)
```

---

## SAFE MATCH / TRUST RULE — preserved

| THA trust rule | How INT3 preserves it |
|---|---|
| No fake products | A match is surfaced only when `matchedProductId` is stored; otherwise `hasMatch: false`. |
| No fake prices | A price is surfaced only when `matchedPrice` is stored; the basket total sums stored prices only; no estimation anywhere. |
| Unresolved items remain unresolved | `unresolved` scope reports owner-flagged items as-is; the handler never auto-resolves. |
| Low-confidence matches stay reviewable | Stored `confidenceLevel`/`confidenceReason` are surfaced unchanged; nothing is promoted. |
| No silent generic supermarket fallback | Only stored `matchedStore` is reported; the handler never picks a store; cross-store totals are labelled honestly. |
| Honest gap when no confident answer | No stored prices → `gap`; unassessed item → `gap`; unknown scope → `gap`. |

---

## DATA IMPACT

| Declaration | Status |
|---|---|
| **Reads existing data** | ✅ Yes — `shopping_list` items + `shopping_list_extras`, via the existing owner, scoped to the caller's household. |
| **Writes new data** | ❌ No — the binding has no write path. |
| **Changes meaning of existing data** | ❌ No. |
| **Requires backfill** | ❌ No. |
| **Schema changes** | ❌ **None** (zero — the preferred outcome per the brief). |

No persistence was needed; **STOP-on-persistence was not triggered.**

---

## TESTING

New: `npm run test:intelligence-shopping-binding` — **38 assertions, all passing**, using an injected in-memory owner (no live DB). Coverage:

- **Capability lookup** — shopping is `available` on the singleton; exactly **two** live capabilities (planner + shopping) — scope lock.
- **Permission validation** — anonymous → `denied`; user 2 reads only their own household (no cross-household leak); user 1 explaining user 2's item → `denied` with no existence leak.
- **Handler invocation + shopping delegation** — `list`/`unresolved`/`basket` return owned data; delegation to the owner getters is observed (spy).
- **Read scopes** — `list` (items + extras), `unresolved` (owner-flagged only), `basket` (stored prices only, unpriced items listed).
- **Explain** — flagged item explained from stored state; unassessed (`raw`) item → honest gap.
- **Unsupported intent** — `review` (not in allow-list) → `unsupported_intent`; unknown/empty scope → `gap`.
- **Read-only enforcement** — `add`/`delete`/`generate` stop at confirmation and, even when `confirmed`, → honest `gap` (no mutation path); `order` → honest `gap` (no checkout endpoint owned).
- **Trust rules** — no fabricated match/price; unresolved stays unresolved; no stored prices → honest gap (not a £0 basket).

Regression: `npm run test:intelligence-platform` — **33/33 passing** (INT1 unchanged). `npm run test:intelligence-planner-binding` — **31/31 passing** (INT2, with the one scope-lock assertion updated for the now-two live capabilities). All new/edited intelligence files are **typecheck-clean** (`tsc --noEmit` reports zero errors under `server/intelligence/`); the repository's pre-existing unrelated `tsc` errors are unchanged from the rollback tag.

---

## TRUST CHECK

- [x] Shopping ownership unchanged — handler only reads via the owner.
- [x] Source of Truth unchanged — no new store, no schema change.
- [x] No duplicate shopping implementation — delegation only.
- [x] Intelligence Platform only orchestrates — no business logic added.
- [x] No fabricated price, product, match or basket — stored data only.
- [x] Unsupported / unsafe requests return honest gaps — verified by test.
- [x] Existing shopping behaviour unchanged — no route/service edited; regression tests green.

---

## SCOPE LOCK — honoured

Implemented **only** the Shopping read-only capability binding. **Not** started: Nutrition, Pantry, Conversation, Voice, Planner writes, Shopping writes (add/delete/price/basket/order/checkout), or a User Assistant.

### SUGGESTION (not implemented)

- **INT4 — third read-only binding (Nutrition / Knowledge):** the `nutrition-knowledge` capability is a natural next read-only owner (already `read-only`/`R` in the registry); follow the same Port → Handler → Binding pattern, surfacing source-gated knowledge with honest gaps.
- **Richer basket pricing via the owner:** a per-store, single-basket total would belong to the Shopping owner's existing cost services (`/api/shopping-list/total-cost`, `supermarket-basket-service.ts`) — surface it through the platform only once the owner exposes a single read it already trusts, rather than computing it in the handler.
- **Confirmed-write execution (much later):** when shopping writes (add/remove/basket) are eventually bound, they must reuse the existing confirmation tiers and delegate mutation wholly to the Shopping service — a separate, governed workstream; ordering/checkout remains a recorded honest GAP until an owning endpoint exists.
- **Thin internal accessor for surfaces:** when a future assistant needs shopping reads, expose them through the platform (not a new route) so permission/honesty stay centralised.
```
