# Capability: Analyser (Product / UPF)

**Capability ID:** `analyser`
**Classification:** Governing Architecture — Canonical Capability Definition
**Status:** Bound under INT17
**Promoted:** EPIC 1.5 (2026-06-30), from `docs/implementation/INT11_CAPABILITY_CARDS_SPECIFICATION.md` (INT11, EPIC 1, 2026-06-30)

> This document is the single canonical Capability Card for `analyser`. It is governing architecture: required reading before any future binding implementation for this capability. The [Developer Capability Registry](../INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md) indexes this card (implementation status, binding status, executable intents, owner, link) but does not duplicate its content — this is the only place the full card lives. The original investigation evidence and methodology remain in `docs/implementation/INT11_CAPABILITY_CARDS_SPECIFICATION.md`.

---

## Capability Card

```
Capability ID:          analyser
Capability name:        Analyser (Product / UPF)
Owner service:          server/storage.ts — getAllAdditives() (line 869) is the ONLY confirmed
                         stored-read owner method in this capability's neighbourhood.
                         server/lib/product-analysis.ts (analyzeProduct, detectUPF,
                         calculateProductHealthScore, generateWarnings, parseProductIngredients) and
                         server/lib/upf-analysis-service.ts (analyzeProductUPF, detectAdditives,
                         calculateUPFScore, calculateTHAAppleRating, etc.) are PURE COMPUTATION
                         functions over caller-supplied text/nutriments — not reads of any stored
                         analysis result. Grepping shared/schema.ts and server/storage.ts for
                         "product_analysis"/"productAnalysis" returns nothing — no such table exists.
Source of Truth:        SoT D19 claims "product analysis tables" — THIS APPEARS INACCURATE as of this
                         investigation; no such table exists in shared/schema.ts. The only genuinely
                         stored table in this neighbourhood is `additives` (shared/schema.ts:609–617)
                         + the `productAdditives` join table (619–623), the latter unused by the only
                         additives route (GET /api/additives returns the full reference table,
                         unscoped to any product). Recommend the SoT Register owner re-verify D19.
Access scope:           Registry marks `ownershipScoped: false` (public/advisory) — accurate, the
                         additives table is not user-owned. However all three routes named in the
                         registry's apiSurface require req.isAuthenticated() in the live code
                         (server/routes.ts:5234, 6590, 8319) — access is gated even though the data
                         isn't user-specific.
Supported read intents: read, explain, analyse, report (capability-registry.ts:156)
Executable intents:     read — scoped ONLY to the static additives reference list. Nothing else in
                         supportedIntents has a safe, grounded, stored-read owner.
Allowed scopes:         additives — getAllAdditives(): id, name, type, riskLevel, description,
                                     isRegulatory, aliases
Honest gaps:            MAJOR FINDING — barcode/product lookup (GET /api/products/barcode/:barcode,
                           server/routes.ts:6589) is NOT a stored read. It live-fetches from
                           OpenFoodFacts (axios.get to world.openfoodfacts.net, line 6649) and then
                           recomputes analysis FRESH on every call via analyzeProduct/
                           analyzeProductUPF (lines 6697, 6699). No result is ever persisted to a
                           product-analysis table (only an audit row is written to
                           barcode_lookup_events). Binding this verb would require either a live
                           third-party network call from inside a "read-only" capability binding
                           (questionable under INT7A, which assumes a DB-backed owner) or a stored
                           result table that does not currently exist — gap, pending a governance
                           decision.
                         /api/scan (server/routes.ts:8318) was investigated and found to be RECIPE/
                           SHOPPING-LIST/PLANNER OCR EXTRACTION via recipeParser.ts (modes:
                           shopping_list | recipe | planner), with no call anywhere to
                           analyzeProduct/analyzeProductUPF. The registry's apiSurface listing of
                           /api/scan under "analyser" is incorrect — exclude entirely from this
                           capability's scope.
                         analyse — requires the same live-fetch+compute path as barcode lookup — gap
                         report — user-specific/diary-linked, out of scope — gap
                         explain — additive descriptions are already covered by the additives read
                           scope; no other stored rationale exists
Permission model:       req.isAuthenticated() required on all three routes inspected
                         (additives/barcode/scan) — minimumRole: user per registry; ownershipScoped:
                         false is accurate for additives (not user-owned data).
Port methods:           getAllAdditives() → storage.getAllAdditives()
Handler responsibilities: read verb returns the additives reference list, nothing else.
Binding registration:   ANALYSER_EXECUTABLE_INTENTS = ["read"]
Tests required:         Standard set, scoped to the single "additives" read. No barcode/UPF analysis
                         tests possible until the live-fetch governance decision above is resolved.
Documentation updates:  Recommend the Developer Capability Registry's apiSurface for this capability
                         be corrected to remove /api/scan and recommend the SoT D19 owner re-verify
                         the "product analysis tables" claim — recorded as a recommendation in this
                         card; not applied to capability-registry.ts (runtime) by this workstream.
Data impact:            Reads only (static reference table)
Trust rules:            Never fabricate a UPF classification, health score, or NOVA group for a
                         product — there is no stored result; any such value can only come from a
                         live recompute, which is explicitly NOT in the executable scope. Additives
                         must be surfaced as-is from the reference table.
```

---

**Source investigation:** `docs/implementation/INT11_CAPABILITY_CARDS_SPECIFICATION.md` (INT11, EPIC 1, 2026-06-30)
