# Living Home — Shopping Intent Refinement

**Date:** 2026-08-03 · **Risk:** 🟢 GREEN — behavioural refinement inside the approved model (no redesign).
**Branch:** `feat/living-larder-authoritative` · **Rollback:** `rollback/living-home-shopping-intent-base` → `e1b38dc8`.
**Governing (locked):** Model B, Living Home Spatial Blueprint, **Shopping Architecture (Domain 15)**, Working-Position + ownership model — all unchanged.

## The correction

Dragging a Living Object to the Shopping Basket must **never** mean *"I want one physical item."* It means *"I need to buy this."* Purchase **quantity** is not the Living Home's to decide — it belongs to the Shopping domain, which knows pack sizes, retail formats and what the household usually buys.

Previously the Living Home hard-coded `quantityValue: 1, unit: "unit"` on every add — it was minting a quantity it has no authority over. This pass removes that: the Living Home now communicates **intent + product identity only**, and the Shopping domain infers the amount.

## Ownership — who decides what

| Concern | Owner | After this pass |
|---|---|---|
| *Which* product, and *that* I want it | **Living Home** | Sends `{ productName, source, purchaseIntent: true }` — no quantity, no unit |
| Purchase units, pack sizes, retail formats, **how much** | **Shopping (Domain 15)** | `inferPurchaseIntent()` decides `quantityValue` + `unit` at the shopping-list route |
| Accept / adjust the suggestion | **Shopping workspace** | Existing quantity-adjust UI — unchanged, no new UI added |
| Quietly explaining the suggestion | **Companion** | `basis` + `note` available for it to voice — no new surface |

The Living Home no longer knows or states a quantity. The Shopping domain owns every number.

## Inference order (as specified)

1. **Household purchase history** — if they normally buy this in a certain quantity/unit, reuse it.
2. **Household composition** — *reserved*; the function already accepts a history hint so tier 2 can be layered in later without changing callers.
3. **Common retail packaging** — how a UK family normally buys the thing (table below).
4. **Sensible default** — `1 pack`, "one, to start with".

History wins over packaging; packaging wins over the default.

## Files changed

| File | Change |
|---|---|
| `server/lib/shopping-purchase-intent.ts` | **new** — pure Shopping-domain inference (`inferPurchaseIntent`, `InferredPurchase`, UK retail-packaging table). Owns no storage, mints no owner. |
| `server/routes.ts` | On `POST /api/shopping-list`, when `purchaseIntent === true` and no quantity supplied: look up household history for the resolved item, call `inferPurchaseIntent`, and write the inferred `quantityValue`/`unit` through the **existing** shopping-list surface. |
| `client/src/pages/living-home-room.tsx` | `addToShopping` now sends `{ productName, source:"pantry", purchaseIntent:true }` — **no** `quantityValue`/`unit`. Toast copy: *"Still in your larder — Shopping has suggested the usual amount, which you can adjust."* |

No schema change, no new table, no new endpoint, no new UI.

## Inferred quantities (retail-packaging tier)

| Living Object | Suggested purchase | Basis |
|---|---|---|
| Apples | a pack of **6** | pack of six — how apples are sold |
| Satsumas / clementines | **1 bag** | sold by the bag |
| Bananas | **1 bunch** | — |
| Grapes / berries | **1 punnet** | — |
| Carrots / sweet potato | **1 kg** bag | — |
| Potatoes | **2.5 kg** bag | — |
| Onions | **1 bag** | — |
| Milk | **2 litre** bottle | — |
| Eggs | box of **6** | — |
| Butter / cheese | **1 pack** | — |
| Yoghurt | **1 pot** | — |
| Tinned tomatoes | **1 multipack** of tins | — |
| Beans / chickpeas / lentils | **1 multipack** of tins | — |
| Flour / sugar | **1 bag** | — |
| Rice / pasta / oats | **1 pack** | — |
| Oil / vinegar | **1 bottle** | — |
| Tea / coffee | **1 pack** | — |
| Bread | **1 pack / loaf** | — |
| *anything unmatched* | **1 pack** ("one, to start with") | default |

## Verified end-to-end (live server, real route)

Authenticated demo session → `POST /api/shopping-list` with intent-only payloads → read the list back:

```
Apples            →   6 pack        (retail-packaging)
Milk              →   2 litre       (retail-packaging)
Potatoes          → 2.5 kg          (retail-packaging)
Eggs              →   6 box         (retail-packaging)
Tinned tomatoes   →   1 multipack   (retail-packaging)
Yoghurt           →   1 pot         (retail-packaging)
Bananas           →   1 bunch       (retail-packaging)
Carrots           →   1 kg          (retail-packaging)
```

**History tier** — the household was first recorded buying *Cornflakes ×3 box*; a later Living Home intent for Cornflakes correctly **reused 3 box** instead of the generic default:

```
Cornflakes  qty=3 unit=box source=manual   (seeded history)
Cornflakes  qty=3 unit=box source=pantry   (intent → reused household usual)
```

## Example purchase flows

- **"We're low on apples."** Tap apples in the Fruit Bowl → basket. Shopping suggests *a pack of six*. The Companion can add *"the usual way apples are sold — adjust if you want loose."* One tap = one purchase, sized by Shopping.
- **First-ever milk purchase** (no history). Shopping falls to retail packaging → *a 2-litre bottle*.
- **A household that always buys 4 pints of milk.** Once that's in their history, the next milk intent reuses *4 pint* — history overrides the packaging guess.
- **Something exotic with no packaging rule.** Falls to the sensible default — *one, to start with* — never a silent wrong number.

## Regression checks

- **Shopping Architecture unchanged** — same table, same `POST /api/shopping-list`, same resolver, same workspace UI. Inference is additive and gated on `purchaseIntent`.
- **Old callers unaffected** — a normal add that still sends an explicit `quantityValue` skips inference entirely (the `!quantityValue` guard); confirmed live (manual Cornflakes ×3 kept its quantity).
- **No new UI** — the Shopping workspace's existing accept/adjust affordance is the surface; the Living Home added only a toast line.
- **Ownership intact** — Living Home sends intent + identity only; Shopping owns every quantity. No ownership moved, no owner minted.
- App compiles; dev server serves on 5000; live route exercised with no errors.

## Definition of done — status

One drag = one **purchase intent**. The Living Home says *what* and *that*; the Shopping domain decides *how much* — from history, then retail packaging, then a sensible default — and the household accepts or adjusts in the workspace it already has. Shopping Architecture remains LOCKED; no redesign, no ownership change, no new interface.
