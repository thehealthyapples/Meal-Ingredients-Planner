# SHOP1 — Intelligent Shopping Evolution

**Date:** 2026-07-12
**Branch:** `int1-intelligence-platform`
**Risk:** 🟡 AMBER
**Reason:** Additive extension of one existing engine. No new engine, no new capability, no schema change, no new store, no client change — but it puts new cards in front of households on a live surface.

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Rollback tag | `rollback/SHOP1-intelligent-shopping-evolution-20260712` |
| Commit SHA | `b4a63af861b2ec14fc5f09b69db7441c81115fab` |
| Rollback to committed state | `git checkout rollback/SHOP1-intelligent-shopping-evolution-20260712` |

> **⚠️ The working tree was DIRTY when this tag was taken** (79 modified/untracked files from PHASE5B–PHASE5E, authored by others). Per `ROLLBACK_PROTECTION_PROTOCOL.md` §3, a tag protects **committed state only** — it does **not** cover those uncommitted changes. They were snapshotted out-of-repo before any edit:
>
> - `…/scratchpad/SHOP1-pre-change-snapshot/tracked-uncommitted.patch` (209 KB)
> - `…/scratchpad/SHOP1-pre-change-snapshot/untracked/` (26 files)
>
> SHOP1 touched none of that pre-existing work except where a type change mechanically required it (the two `ShoppingReadPort` test fakes below).

---

## 1. SUMMARY

Shopping was the platform's least intelligent surface. It could add, price, and basket — but it could not *think*. It never asked whether the household already owned the thing, whether a better-rated product was already sitting in its own matched-products list, or whether a less-processed option existed.

SHOP1 makes Shopping opportunity-, household-, pantry- and nutrition-aware **without building a shopping engine**, because the platform already had every part required and had simply never joined them.

The whole of SHOP1 is **three new generators inside the engine that already existed** (`server/intelligence/food-intelligence/opportunity-engine.ts`), added at the extension point its own type union already advertised:

> *"Extending this union (Rule 8 — evolution over replacement) is how a future workstream adds a new opportunity generator without replacing any existing one."*

Everything else — suppression, ranking, the attention budget, muting, lifecycle, household learning, surface routing, the sealed `DeliveryDecision`, and the Decision→Evidence loop — was inherited for free, because it is owned by the Decision Engine and nowhere else.

### What SHOP1 cost, measured

| | |
|---|---|
| New engines | **0** |
| New capabilities | **0** (live count stays 23 — no binding test touched) |
| Lines added to `OPPORTUNITY_SOURCES` | **0** (`food-intelligence` was already enrolled) |
| Lines added to `DOMAIN_SURFACE` | **0** (`shopping → shopping` already existed) |
| Schema changes / migrations | **0** |
| New HTTP routes | **0** |
| Client changes | **0** |
| New product scores or ranking rules | **0** |

Zero client changes is not an accident: PHASE5C already mounted `AmbientIntelligence` with `domains={["shopping"]}` on the shopping workspace, and `FoodOpportunityCard` keys on the *domain*, not the *type*. Cards emitting `owningDomain: "shopping"` therefore render on arrival.

### The four faces of intelligent shopping

| Face | Opportunity type | Owner reused | Status |
|---|---|---|---|
| **Household-aware** | `shopping-restriction-conflict` | `resolveIngredientRestrictions` (`shared/restrictions`) | **Pre-existing** — unchanged |
| **Pantry-aware** | `shopping-item-already-in-pantry` | `resolveCanonicalFood` + pantry owner (SoT D8–11) | **New (SHOP1)** |
| **Nutrition-aware — PRODUCT** | `shopping-higher-rated-product-available` | **Analyser** `calculateTHAAppleRating` (SoT D19) | **New (SHOP1)** |
| **Nutrition-aware — FOOD** | `shopping-less-processed-option` | **WS9 Alternatives** (`shared/alternatives`) | **New (SHOP1)** |
| **Opportunity-aware** | *(all of the above)* | Decision Engine (DEC1/OD1) | **Inherited** |
| **Reasoning / explanations** | `evidence[]` + `subject` | Rule E1 citations; PHASE5E subject | **Inherited** |

---

## 2. THE LOAD-BEARING DECISION — "healthier product recommendations" is two questions, not one

This is the only part of SHOP1 that required judgement rather than wiring, and it is the part most likely to be undone by a future edit that does not understand it.

The brief asked for *healthier product recommendations*. The codebase contains a governing document that **forbids exactly that phrase**:

`shared/alternatives/trust.ts` (WS9) bans `"healthier"`, `"better option"`, `"better for you"`, `"should swap"`, `"good for you"` — and **fails closed**, silently dropping any option whose reason carries one. Its stated grammar test:

> *"Could a kind, knowledgeable friend say this sentence to your face, about a food you just chose, without it sounding like a correction? If not, it is banned."*

Building "healthier recommendations" on WS9 would have violated a governing trust guard. Watering the brief down to avoid it would have under-delivered. Both were wrong, because **one phrase was hiding two different questions with two different owners**:

| | **FOOD level** | **PRODUCT level** |
|---|---|---|
| The question | *"What else could fill this role?"* | *"Is this specific branded product well-rated?"* |
| Owner | **WS9 Alternatives** (`shared/alternatives`) | **The Analyser** (`upf-analysis-service.ts`, SoT D19) |
| May it rank? | **No** — possibilities, never a verdict on the anchor | **Yes** — a rating is literally what it computes |
| SHOP1's voice | WS9's own words, verbatim; `low` attention | The Analyser's two numbers, stated plainly; `medium` |

So SHOP1 answers **each question in its owner's voice**:

- The **product** card says *"The Analyser rates 'Hovis Soft White' 2/5. A product already matched to this line — 'Seeded Wholemeal' at Tesco — it rates 4/5."* It **states** the Analyser's ratings. It does not editorialise them, and it authors no score of its own.
- The **food** card says *"Less processed options could fill a similar role to 'Cereal': Porridge Oats, Bircher Oats, Muesli"*, and every reason is **copied verbatim** from WS9's curated editorial source. The word "healthier" appears nowhere.

`test-shop1-intelligent-shopping.ts` §1.4 asserts that **every string SHOP1 emits — including the Analyser's — is clean against WS9's ban list.** That is deliberately *stricter* than WS9 requires of the Analyser. It is the check that stops a future edit from quietly turning a rating into a judgement.

### The candidate set was already there

The product-level recommendation needed a set of alternative products to compare against. It searches for none. `product_matches` (schema `shared/schema.ts:235`) already stores **every retailer product matched to a shopping line, each carrying a `thaRating` the Analyser already computed**. SHOP1 reads two numbers THA had already written and stated them. Nothing is fetched from a retailer; no product the household has not already been offered is invented.

---

## 3. ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  Shopping lines keyed on shopping_list.id; pantry on user_pantry_items.id;
  matches on product_matches.shoppingListItemId. Food identity across shopping↔pantry
  resolves through the ONE canonical resolver (resolveCanonicalFood) that
  identifyPantryUnusedOpportunities already uses. No second identity mapping created.

☑ One owner per fact
  Product rating → the ANALYSER (calculateTHAAppleRating, SoT D19). SHOP1 authors no score.
  Food alternatives → WS9 (shared/alternatives). SHOP1 authors no reason; copies verbatim.
  Restrictions → shared/restrictions. SHOP1 authors no matcher; calls the resolver.
  Shopping rows → SoT D15. Pantry rows → SoT D8–11. SHOP1 writes to none of them.

☑ No duplicate entities
  No new entity. Three new *types* on an existing closed union; subject entity reuses
  the existing "shopping-item". No new table, no new column, no migration.

☑ No duplicate ownership
  No attribute given a second owner. See §7 for the ONE pre-existing duplicate
  (client analyser-choice.ts) that SHOP1 deliberately does NOT extend, and its
  retirement plan.

☑ No duplicate state
  No user state written at all. Every generator is a PURE function over rows fetched
  from their existing owners. SHOP1 has no store.
  Note: shopping_list.cupboardQuantity is deliberately NOT read or written — it is a
  separate hand-edited field not derived from the pantry, and deriving it here would
  give one fact two owners.

☑ Extends existing architecture
  Extends the FI4 Food Opportunity Engine at the extension point its own type union
  documents. Inherits the DEC1/OD1 Decision Engine wholesale: 0 lines of suppression,
  ranking, budgeting, lifecycle, learning or delivery code written.

☑ Progressive enrichment where appropriate
  Each read is independently optional (Architecture Principle 3). No pantry → no
  pantry-aware card. No product_matches → no product card. No WS9 anchor → silence.
  One domain failing never blocks another's honest opportunities.

☑ Knowledge domain compliance
  Introduces NO knowledge domain. Consumes four existing ones (Food, Nutrition,
  Household, Product). Closest §1.1 analogue: none needed — no new lifecycle invented.

☑ Honest gaps over fabricated information
  An UNRATED shopping line is an honest gap, never a 0 the Analyser can "beat"
  (asserted, §1.2). An unknown WS9 anchor is SILENT, never a guessed alternative
  (asserted, §1.3). A malformed card is skipped by the framework, never coerced.

☑ No permanent synchronisation bridge
  None. SHOP1 reads owners at request time and writes nothing back. It does not sync
  the pantry to the shopping list, and deliberately does not populate cupboardQuantity.

☑ Evolution over replacement
  Nothing replaced. The pre-existing shopping-restriction-conflict generator is
  untouched and still the platform's sole `critical` emitter.
```

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
✓ Uses the canonical Intelligence Platform  — reached via intelligencePlatform.handle()
                                              through the food-intelligence `report` verb
✓ Uses the Capability Registry              — no registry change; capability count stays 23
✓ Uses the Intent Engine                    — the Decision Engine's producer fetch, unchanged
✓ Reuses existing business services         — Analyser, WS9, restrictions, canonical resolver,
                                              pantry owner, shopping owner. Zero new services.
✓ Does not create another assistant         — no prompt, no model call, no LLM anywhere in SHOP1
✓ Does not duplicate conversation state     — no conversation state touched
✓ Uses registered capabilities only         — food-intelligence (already enrolled as a producer)
✓ Uses permission-aware access              — household-scoped by the owner from userId alone;
                                              no client-supplied household id can reach a port
✓ Produces honest gaps rather than fabricated knowledge — see the checklist item above
```

```
----------------------------------------
EXPERIENCE & UI GOVERNANCE COMPLIANCE
----------------------------------------
✓ UX Governance Checklist (EXPERIENCE § 18, incl. Premium Standard § 17) — completed.
    Calm before capability: the ambient surface stays COLLAPSED by default; SHOP1's cards are
    medium/low attention and never force it open (only `critical` may, and no SHOP1 type is).
    One primary action: each card carries exactly one suggestedAction, and it is a SUGGESTION —
    SHOP1 removes nothing from a list and swaps nothing on a household's behalf.
    Premium standard — the care is felt precisely where it is invisible: THA declining to tell a
    household a product is "worse" when all it actually knows is a number.
✓ UI Governance Checklist (UI § 18) — completed. ZERO new visual patterns. Cards render through
    the existing FoodOpportunityCard on the existing AmbientIntelligence surface.
✓ Conflicts resolved in EXPERIENCE's favour — none arose.
✓ Nothing owns a fact/decision at the presentation layer — SHOP1 adds NO client code. Every
    value shown is read from its single owner server-side. (The pre-existing client-side
    violation, analyser-choice.ts, is named in §7 and is NOT extended by SHOP1.)
✓ Any new visual pattern retired its predecessor — N/A, no new visual pattern.
```

```
----------------------------------------
PRODUCT REGISTRY COMPLIANCE
----------------------------------------
✓ Registry impact assessed — YES, "what is THA?" now answers differently: Apple can reason
    about a shopping list, not merely read it back.
✓ Every new surface has an entry — no new page, route, dialog, integration or setting was
    created. The affected capability entry is UPDATED (below).
✓ Every entry names a human owner — Colin Clapson (unchanged).
✓ Visibility declared deliberately — `household` (unchanged). These cards are about a
    specific household's own list; they are meaningless and invisible without one.
✓ Visibility keys on ROLE, never tier — unchanged; SHOP1 gates nothing on subscription.
✓ Registry labels; access.ts authorises — SHOP1 reads no registry value at runtime.
✓ Permission filtering before composition — household scoping happens in the owner, before
    any card exists. No card is built and then withheld.
✓ NO product knowledge in a prompt/template/fallback (Rule PKR27) — SHOP1 contains no prompt
    and no model call of any kind.
✓ Predecessor entries retired — none replaced.
✓ Shipped-but-unlinked → Hidden Experiences — N/A, nothing unlinked.
✓ New claims have a Marketing Message entry — SHOP1 makes NO new marketing claim. It
    deliberately avoids the claim ("healthier") the brief's wording invited.
✓ The report names every entry touched — below.
```

**Entries created:** NONE
**Entries updated:** `cap-shopping` — "what it means for the household" now states that Apple reasons about the list (pantry duplicates, Analyser ratings, less-processed options), and that it still never places an order. `last_verified` → 2026-07-12, `version` → 2.
**Entries retired:** NONE

---

## 4. DOMAIN IMPACT DECLARATION

```
DOMAIN IMPACT
=============
Domain affected: Shopping (SoT D15), reading Pantry (D8–11), Analyser (D19),
                 Household (D16), and WS9 Alternatives (curated, shared/)
Declared SoT: DB shopping_list / shopping_list_extras / product_matches (D15)
New store created? NO
Existing store extended? NO — no schema change, no migration, no column added
Consumer created? YES — three pure generators inside the existing FI4 engine
  If YES: reads from declared SoT? YES — every read goes through an existing
          owner's port. SHOP1 opens no database connection of its own.
```

---

## 5. DATA IMPACT

- Reads existing data: **YES** — `shopping_list`, `product_matches`, `user_pantry_items`, `household_eaters`
- Writes new data: **NO** — SHOP1 writes nothing. (The Decision Engine's existing delivery-record insert is unchanged and is not SHOP1's.)
- Changes meaning of existing data: **NO** — `thaRating` still means exactly what the Analyser made it mean
- Requires backfill: **NO**

---

## 6. TRUST CHECK

**Could this mislead the user?** The sharpest risk in SHOP1, and the one §2 exists to answer. A rating comparison invites the inference *"the thing you chose is bad."* SHOP1 refuses that inference: it states two numbers the Analyser computed and stops. It never says "healthier", "better", or "you should swap" — asserted mechanically against WS9's ban list for **every** string it emits (§1.4).

**Could this fabricate certainty?** No. An unrated line produces no card rather than being treated as a zero to beat. An unknown food produces silence rather than a guessed alternative. A product with no matches produces no comparison.

**Is anything guessed but shown as real?** No. Every card cites the owner it was read from (Rule E1 — no citation, no card), asserted for all four shopping generators.

**What happens if the system is wrong?** The worst case is a household is shown a card suggesting they check something they had already decided about. Nothing is added, removed, swapped, or bought. Every card is a suggestion; SHOP1 has no write path and cannot act on a household's behalf. A wrong card can be dismissed, and dismissal is already a first-class terminal state that feeds the Decision→Evidence loop.

**The honest one:** the pantry-duplicate card can be *right about the food and wrong about the intent* — a household may knowingly be restocking. This is why the card asks *"Check whether you still need this"* rather than asserting *"you don't need this"*, and why it is `medium`, not `high`. SHOP1 deliberately does **not** auto-decrement, auto-remove, or write `cupboardQuantity`.

- No architectural duplication introduced: **YES** (none introduced; one pre-existing duplicate named in §7)
- No new source of truth created: **YES**
- No runtime behaviour altered for existing cards: **YES** — the restriction-conflict generator is untouched; golden-identity DEC1 tests still pass

---

## 7. ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Shopping Intelligence (product selection & alternatives reasoning)

Current Canonical Owner:
  Product rating      → server/lib/upf-analysis-service.ts (Analyser, SoT D19)
  Food alternatives   → shared/alternatives (WS9)
  Opportunity delivery→ server/intelligence/opportunity-delivery/framework.ts (DEC1)
  Shopping rows       → DB shopping_list / product_matches (SoT D15)

Current Runtime Consumer(s):
  Shopping Workspace (AmbientIntelligence, domains=["shopping"]), Home/Dashboard
  aggregate view, Companion notices — all via the ONE Decision Engine bundle.

Duplicate Owners Remaining:
  1. client/src/lib/analyser-choice.ts — rankChoices() + buildWhyBetter() rank products
     by thaRating and author a "why better" string ON THE CLIENT, in untyped (`any`) code.
     This is a DECISION owned at the presentation layer, which EXPERIENCE/UI compliance
     forbids. It PRE-DATES SHOP1.
  2. client/src/lib/whole-food-alternatives.ts — a second, hard-coded, client-side
     alternatives map, parallel to WS9. PRE-DATES SHOP1.

Duplicate State Remaining:
  shopping_list.cupboardQuantity is a hand-edited "how much I already have" field that
  duplicates the intent of user_pantry_items but is NOT derived from it. SHOP1 deliberately
  did not bridge them (a bridge would create the second owner this checklist forbids).

Duplicate Workflows Remaining:
  ONE. "Which product here is better, and why" is now answered in two places: SHOP1's
  server-side generator (canonical, cited, trust-guarded) and analyser-choice.ts (client,
  untyped, ungoverned). SHOP1 did NOT extend, call, or entrench the client copy.

Current Convergence (%):
  ~60%. Evidence, counted: of the FIVE unconnected "alternatives/better product" systems
  found in the codebase (WS9 shared/alternatives; client analyser-choice.ts; client
  whole-food-alternatives.ts; server recipe-swap-engine.ts; server uplift-engine.ts),
  SHOP1 routes Shopping's reasoning through the canonical two (WS9 + Analyser) and adds a
  sixth to none. Three client/server duplicates remain unretired, and the dead
  GET /api/product-alternatives endpoint (routes.ts:3190, zero client callers) remains.

Target Convergence (%):
  100%

Next Planned Milestone:
  SHOP2 — retire client-side product reasoning. Move rankChoices/buildWhyBetter behind the
  Analyser (server-side, typed, cited), rewire WorkspaceAnalyserSheet.tsx and
  shopping-list-page.tsx to render server output, delete analyser-choice.ts and
  whole-food-alternatives.ts, and delete the dead /api/product-alternatives route.
  Explicitly deferred from SHOP1 (approved): it touches two large UI files and carries real
  regression risk in the Analyser modal, which would have been bundled invisibly into a
  server-side reasoning change.

Remaining Architectural Risks:
  The client ranker and the server generator can DRIFT. They answer the same question with
  different rules today (the client also weighs NOVA group and additive counts; the server
  states only the Analyser's rating). A household could therefore see the Analyser modal and
  the shopping card disagree about which product is preferable. This is a real, user-visible
  inconsistency, it pre-dates SHOP1, and SHOP2 is the plan to end it.
```

---

## 8. CHANGES MADE

### Modified (4)

| File | Change |
|---|---|
| `server/intelligence/food-intelligence/opportunity-engine.ts` | **The whole of SHOP1.** 3 new types on the existing closed union; 3 new PURE generators (`identifyShoppingPantryDuplicateOpportunities`, `identifyShoppingHigherRatedProductOpportunities`, `identifyShoppingLessProcessedOpportunities`); orchestrator now hoists the pantry read (used twice, fetched once) and adds an independently-optional `product_matches` read. |
| `server/intelligence/handlers/shopping-read-port.ts` | One method: `getProductMatchesForUser(userId)`, a 1:1 forward to the existing `storage.getProductMatchesForUser` (already present, storage.ts:737). No new business logic. |
| `server/tests/test-intelligence-shopping-binding.ts` | Mechanical: 3 `ShoppingReadPort` fakes gain the new method. No assertion changed. |
| `server/tests/test-intelligence-companion-actions.ts` | Mechanical: 1 `ShoppingReadPort` fake gains the new method. No assertion changed. |

### Created (2)

| File | Purpose |
|---|---|
| `server/tests/test-shop1-intelligent-shopping.ts` | 34 assertions. §1 pure core (pantry / product / food generators, honest gaps, determinism, attention). **§1.4 is the trust guard** — every string SHOP1 emits, from every generator, asserted clean against WS9's ban list. §2 the Decision Engine producer contract. |
| `docs/implementation/shopping/SHOP1_INTELLIGENT_SHOPPING_EVOLUTION.md` | This report. |

### Updated — Product Knowledge Registry (1)

| File | Change |
|---|---|
| `docs/product/intelligence/intelligence-capabilities/cap-shopping.md` | `version` 1→2, `last_verified` → 2026-07-12; states that Apple now reasons about the list, and restates that it still never places an order. |

### Deliberately NOT changed

- **`OPPORTUNITY_SOURCES`** — `food-intelligence` was already enrolled. SHOP1's enrolment cost was **zero lines**, which is the measure of whether OD1's enrolment door was real. It was.
- **`DOMAIN_SURFACE`** — `shopping → shopping` already existed.
- **`capability-registry.ts`** — no new capability; live count stays **23**, so none of the ~20 binding tests that assert that count needed touching.
- **All client code** — the shopping workspace already mounts `AmbientIntelligence domains={["shopping"]}` (PHASE5C), and `FoodOpportunityCard` keys on domain, not type.
- **`client/src/lib/analyser-choice.ts`** — see §7. Not extended, not entrenched, not called.

---

## 9. VALIDATION PERFORMED

```
npx tsx server/tests/test-shop1-intelligent-shopping.ts           34 passed, 0 failed
npx tsx server/tests/test-intelligence-food-opportunity-binding.ts 40 passed, 0 failed
npx tsx server/tests/test-intelligence-shopping-binding.ts         38 passed, 0 failed
npx tsx server/tests/test-intelligence-companion-actions.ts        62 passed, 0 failed
npx tsx server/tests/test-dec1-decision-engine.ts                  49 passed, 0 failed
npx tsx server/tests/test-intelligence-opportunity-delivery-binding.ts  60 passed, 0 failed
                                                                  ─────────────────────
                                                                  283 passed, 0 failed
```

`npx tsc --noEmit` — **168 errors before SHOP1, 168 after; zero in any file SHOP1 touched.** The change is typecheck-neutral. (The 168 are pre-existing and unrelated — chiefly a `FoodIntelligenceReadPort` fake missing `assembleFoodComparison`, and a `DatabaseStorage`/`ShoppingDiscoveryStorage` mismatch.)

**Delivery path verified end-to-end by inspection, link by link:**
`report` verb (`food-intelligence-read-handler.ts:324`) → `port.identifyOpportunities` (`:238`) → `opportunityEngine.identifyOpportunities` (`food-intelligence-read-port.ts:55`) → **SHOP1's three generators** → `OPPORTUNITY_SOURCES["food-intelligence"]` *(already enrolled)* → `collectOpportunities` → `prioritiseAndGroup` → `grouped["shopping"]` → `GET /api/intelligence/food-opportunities` → `use-food-opportunities` → `AmbientIntelligence domains={["shopping"]}` (`shopping-workspace-page.tsx:2300`) → `FoodOpportunityCard` (`DOMAIN_LABEL.shopping = "Shopping list"`).

**Not performed:** no live end-to-end run against a seeded household in a browser. The generators are pure and are covered by unit assertions; the delivery path is covered by the existing OD1/DEC1 suites; but nobody has yet *watched* a SHOP1 card appear on the shopping workspace. That is the honest state.

---

## 10. DEFINITION OF DONE

**What success looks like:** a household with a pantry, a shopping list, and matched products sees, on the shopping workspace, up to three new kinds of quiet card — *you already have this*, *the Analyser rates a matched product higher*, *less processed options could fill this role* — each citing exactly where it came from, none of them telling them they were wrong.

**What must not break:** the `shopping-restriction-conflict` critical safety card (unchanged, still the sole `critical` emitter); DEC1's golden-identity ordering; the Analyser modal.

**Manual test steps:**
1. Sign in as a household with pantry items.
2. Add to the shopping list an item that is already in the pantry (e.g. a pantry staple).
3. Run `POST /api/shopping-list/auto-smp` and `POST /api/shopping-list/lookup-prices` so `thaRating` and `product_matches` are populated.
4. Add "Cereal" to the list (a known WS9 anchor with less-processed options).
5. Open `/shopping-workspace` → expand *"Worth a look before you shop"*.
6. Expect: a pantry-duplicate card, a rating card naming a specific higher-rated match, and a less-processed card listing Porridge Oats / Bircher Oats / Muesli.
7. Confirm no card anywhere reads "healthier", "better", or "you should swap".

---

## 11. SCOPE LOCK

**Implemented:** opportunity-, household-, pantry- and nutrition-aware shopping; healthier product recommendations at the product level (Analyser) and less-processed options at the food level (WS9); shopping reasoning and explanations via `evidence[]` + `subject`.

**Explicitly excluded (NOT done):**
- Retiring `client/src/lib/analyser-choice.ts` and `whole-food-alternatives.ts` (SHOP2 — approved deferral, §7).
- Deleting the dead `GET /api/product-alternatives` route (zero client callers).
- Deducting the pantry during shopping-list generation (`POST /api/shopping-list/from-meals` still never consults the pantry — SHOP1 *surfaces* the duplicate, it does not *prevent* it).
- Bridging `cupboardQuantity` to `user_pantry_items`.
- Wiring WS9's dietary/cuisine/household-adaptation sections into Shopping (only `lower_upf` is used).
- Any client change whatsoever.

**Suggestions (observed, not implemented, do not action without approval):**
- **The WS9 curated seed is the binding constraint on food-level intelligence.** It holds **10 anchors, of which only 6 carry `lower_upf` options** (`greek-yoghurt`, `bacon`, `pizza-base`, `beef-mince`, `tomato-sauce`, `breakfast-cereal`). The less-processed generator is therefore correct but will fire *rarely*. This is a content gap, not an engineering one — WS9 is Tier-3 curated by design because lower-UPF alternatives "cannot be safely derived algorithmically". Growing that seed is the single highest-leverage follow-up.
- The pantry↔shopping disconnect at *generation* time is the deeper fix: SHOP1 tells a household they already own something *after* it lands on the list.

### ⚠️ Coverage gap: SHOP1's cards do not reach `/basket`

The registry already records `fnd-shopping-duplicate` — *"the Shopping domain is served by two distinct pages: the Shopping Workspace (`/shopping-workspace`) and the Basket (`/basket`, `/analyse-basket`)"*.

Only the **Shopping Workspace** mounts `AmbientIntelligence`. `shopping-list-page.tsx` (the Basket) does not. **A household working from `/basket` will therefore not see a single SHOP1 card.**

This is a direct, user-visible consequence of a pre-existing defect, not a SHOP1 defect — but SHOP1 *inherits* it, and it materially limits reach. It was not fixed here because mounting a second ambient surface on the duplicate page would entrench the duplication rather than resolve it (Experience Principle 6 — one canonical place for everything). **The correct fix is to resolve `fnd-shopping-duplicate` itself**, which is PDA1/SHOP2 territory and out of SHOP1's approved scope.

---

## 12. REPOSITORY CONVENTIONS NOTE

This report materialises `docs/implementation/shopping/`, a workstream folder **not currently in `REPOSITORY_CONVENTIONS.md` §4's table**. The path was explicitly requested. It passes the mechanical gate (`repo-structure-verify.sh` enforces *no loose files*, not a folder allowlist), and there is live precedent in this working tree (`docs/implementation/health/`, `docs/implementation/nutrition/` — both new, both absent from §4).

Per §4, *"adding one is a governance decision, not a filing convenience."* **Recommendation:** amend the §4 table to admit `shopping/` (Shopping list, basket, supermarket matching, product selection, shopping intelligence), so the vocabulary and the tree agree. Flagged, not silently assumed.
