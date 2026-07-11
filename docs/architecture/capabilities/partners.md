# Capability: Partners / Supermarkets

**Capability ID:** `partners`
**Classification:** Governing Architecture — Canonical Capability Definition
**Status:** Bound under INT14 — `read` executable, scoped to the single safe "retailers" read identified below; `explain`/`recommend`/`compare` remain unbound (no safe, grounded owner)
**Promoted:** EPIC 1.5 (2026-06-30), from `docs/implementation/governance/INT11_CAPABILITY_CARDS_SPECIFICATION.md` (INT11, EPIC 1, 2026-06-30)

> This document is the single canonical Capability Card for `partners`. It is governing architecture: required reading before any future binding implementation for this capability. The [Developer Capability Registry](../INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md) indexes this card (implementation status, binding status, executable intents, owner, link) but does not duplicate its content — this is the only place the full card lives. The original investigation evidence and methodology remain in `docs/implementation/governance/INT11_CAPABILITY_CARDS_SPECIFICATION.md`.

---

## Capability Card

```
Capability ID:          partners
Capability name:        Partners / Supermarkets
Owner service:          server/lib/retailIntelligence.ts (static/stored only — confirmed no
                         fetch/axios anywhere in the file) for the one safe scope identified below.
                         product-matching-service.ts and price-lookup.ts are NOT safe owners for a
                         read-only binding (see below).
Source of Truth:        No single SoT table — retailIntelligence.ts encodes static brand/category →
                         store knowledge in-file; getBasketSupermarkets() (server/lib/
                         supermarket-basket-service.ts:224) is a hardcoded static array of 9 UK
                         retailers (name/key/color/hasDirectBasket).
Access scope:           The capability registry marks this `ownershipScoped: false` (public,
                         advisory) — accurate for the data itself. However ALL THREE routes named in
                         the registry's apiSurface (`/api/basket/supermarkets-enhanced`,
                         `/api/routing`, `/api/savings/*`) require req.isAuthenticated() in the live
                         code (server/routes.ts:1135, 5223, 9813) — access is gated even though the
                         underlying data isn't user-owned.
Supported read intents: read, explain, recommend, compare (capability-registry.ts:128)
Executable intents:     read — narrowly, to the static retailer list only. recommend and compare
                         have NO safe, grounded owner read in scope (see gaps below) — neither is
                         executable.
Allowed scopes:         retailers — the static 9-retailer list from getBasketSupermarkets()
                         (name, key, color, hasDirectBasket). Nothing else in this capability's named
                         apiSurface is a stored, fabrication-safe read.
Honest gaps:            MAJOR FINDING — none of the three apiSurface routes the registry lists are
                         what "Partners / Supermarkets" implies:
                           /api/routing — NOT retailer routing. Returns a UI navigation hint
                             ({route: "quicklist"|"planner"|"cookbook"|"analyser"}) computed from the
                             caller's own product_events/activitySummary (server/lib/routing.ts:5–7).
                             Unrelated to retailers — exclude from this capability entirely.
                           /api/savings/aggregates — NOT retailer price-comparison savings. Returns
                             behavioural savings totals (takeaway_avoided/pantry_used/smart_swap flat
                             rates, server/storage.ts:3512, server/lib/savings-config.ts). Unrelated
                             to retailer comparison — exclude from this capability entirely.
                         compare / recommend (price comparison) — the only code path that could serve
                             this, product-matching-service.ts → price-lookup.ts, makes a LIVE call to
                             the Spoonacular API (price-lookup.ts:162, axios.get to
                             api.spoonacular.com) and then SYNTHESIZES per-store prices by applying
                             hardcoded SUPERMARKET_VARIANCE / TIER_MULTIPLIERS constants
                             (price-lookup.ts:80–90, 43–48) to that single live price. Presenting a
                             "Tesco price" derived this way as fact would be a fabrication — gap,
                             pending either a stored price table or an explicit governance decision
                             that live external fetches are in-scope for a "read-only" binding (INT7A
                             assumes a DB-backed owner, not a third-party live fetch).
                           verifyStoreAvailability() (retailIntelligence.ts:841) is an unimplemented
                             stub (no-op) — do not bind, it would imply real verification.
Permission model:       req.isAuthenticated() on all routes inspected; data itself is not
                         user-owned, so no ownership check is needed for the retailers scope.
Port methods:           getBasketSupermarkets() → (server/lib/supermarket-basket-service.ts:224,
                         currently a plain function, not yet exposed as a storage/service method —
                         confirm exact import path at binding time)
Handler responsibilities: read verb returns the static retailer list, nothing else.
Binding registration:   PARTNERS_EXECUTABLE_INTENTS = ["read"]
Tests required:         Standard set, scoped to the single "retailers" read. No price/comparison
                         tests possible until the live-fetch governance decision above is resolved.
Documentation updates:  Recommend the Developer Capability Registry's apiSurface note for this
                         capability be corrected to remove /api/routing and /api/savings/* (they
                         belong to different concerns) — recorded as a recommendation in this card;
                         not applied to the runtime registry (capability-registry.ts) by this
                         workstream, per the "do not modify runtime" instruction.
Data impact:            Reads only (static data)
Trust rules:            Never fabricate a live price or a per-store price derived from a single live
                         source plus a hardcoded multiplier. Never assert a store recommendation that
                         was not actually computed and stored by an owner. Never claim store-stock
                         verification (verifyStoreAvailability is a stub).
```

---

**Source investigation:** `docs/implementation/governance/INT11_CAPABILITY_CARDS_SPECIFICATION.md` (INT11, EPIC 1, 2026-06-30)
