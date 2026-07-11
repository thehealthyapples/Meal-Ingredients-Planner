# Capability: Analyser (Product / UPF)

**Capability ID:** `analyser`
**Classification:** Governing Architecture — Canonical Capability Definition
**Status:** Bound under INT17
**Promoted:** EPIC 1.5 (2026-06-30), from `docs/implementation/governance/INT11_CAPABILITY_CARDS_SPECIFICATION.md` (INT11, EPIC 1, 2026-06-30)

> This document is the single canonical Capability Card for `analyser`. It is governing architecture: required reading before any future binding implementation for this capability. The [Developer Capability Registry](../INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md) indexes this card (implementation status, binding status, executable intents, owner, link) but does not duplicate its content — this is the only place the full card lives. The original investigation evidence and methodology remain in `docs/implementation/governance/INT11_CAPABILITY_CARDS_SPECIFICATION.md`.

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

## Governance decision — the per-product read (BENCHINT4, 2026-07-10)

**Decision: `analyser` does not gain a product-scoped read. A question about a specific product is an honest gap, and that is the correct answer.**

This settles the decision BENCHINT3 §4.11 raised and BENCHINT3 §8 task 14 referred here. It is recorded on the card because it is a capability-ownership decision, not a routing one.

**The question.** `PR-070` — *"Does this product fit my household restrictions?"* The Companion Benchmark's fixture named `product-analysis + household`, which normalises to this capability. The platform routed it to `household:read`, answered from the household's stored restrictions, and was scored a misroute for doing so.

**Why the gap is correct, and the route was not.**

1. **There is no stored per-product analysis to read.** The Honest gaps section above establishes this at file:line: `analyzeProduct` / `analyzeProductUPF` are pure computation over caller-supplied text, and barcode lookup live-fetches OpenFoodFacts and recomputes on every call. Nothing is persisted. A read-only capability binding has nothing to return.
2. **The utterance has no referent.** *"This product"* names nothing. The Companion turn carries `surfaceHints: {}` on both the benchmark and the production `floating` surface, so no product is in scope. There is no product to analyse even if a read existed.
3. **Forcing the one executable scope onto it would fabricate.** `read { scope: "additives" }` returns the static additives reference table. Handing that to the answer generator for a question about a specific product invites it to present a generic additive list as a finding about that product. `analyserUnexecutable()` in `pattern-intent-resolver.ts` exists to refuse exactly this, and the Trust rules above already forbid the fabrication it would enable.

**Consequences, recorded so they are not re-litigated:**

- `explain`, `analyse` and `report` remain declared-but-unbound. Under BENCHINT4's verb-aware expectation record, a fixture naming `analyser.explain` is `registered-unbound` **at verb granularity** and no longer requires a route — which is what an honest gap means, stated in the measurement rather than only in prose.
- `household` is the capability that genuinely owns "my household's restrictions". PR-070's fixture row is re-targeted to `household.read + product-analysis`: household answers, and `product-analysis` is retained as the named secondary precisely to record that the analyser half is a gap.
- **This is not a permanent refusal.** Reversing it requires two things together, and neither alone is sufficient: (a) a stored, product-scoped analysis owned by a real owning service, and (b) a product referent reaching the turn through `surfaceHints`. Until both exist, a per-product read cannot be grounded, and an ungrounded read is the failure mode this platform is built to refuse.

---

**Source investigation:** `docs/implementation/governance/INT11_CAPABILITY_CARDS_SPECIFICATION.md` (INT11, EPIC 1, 2026-06-30)
**Governance decision:** `docs/implementation/benchmarking/BENCHINT4_INTENT_ROUTING_CONVERGENCE.md` §6 (BENCHINT4, 2026-07-10) — closes BENCHINT3 §8 task 14.
