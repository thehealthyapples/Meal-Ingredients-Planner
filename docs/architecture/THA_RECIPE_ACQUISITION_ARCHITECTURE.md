# THA Recipe Acquisition Architecture

**Status:** GOVERNING — required reading before any implementation that fetches, imports, stores, generates or displays recipe content.
**Adopted:** 2026-07-02 (EWO-FS3)
**Evidence base:** `docs/investigations/FS1_THA_KNOWLEDGE_SOURCE_AND_LICENSING_AUDIT.md`, `docs/investigations/FS2_RECIPE_ACQUISITION_ARCHITECTURE_AND_LICENSING_REVIEW.md`
**Canonical policy owner (code):** `shared/recipe-acquisition.ts`
**Canonical provenance store:** `meals.acquisition_lane / acquisition_type / acquisition_source_key / licence_ref / attribution_text`

---

## 1. The governing principle

**Separate what THA shows from what THA keeps, and record under what right it does each.**

Every recipe row THA holds must be able to answer one question: *"under what right does THA hold and display this content?"* A recipe whose row cannot answer it may not exist. Content THA may at most point at (link-out) is never persisted; content THA persists always carries its lane, acquisition type, source, licence reference and attribution.

## 2. The four acquisition lanes

Every recipe in THA belongs to exactly one lane. The lane is recorded on the row (`meals.acquisition_lane`) and determines visibility, storage rights and attribution duties.

| Lane | Content | Right held | Visibility | Storage policy |
|---|---|---|---|---|
| **THA Library** (`tha_library`) | THA-authored recipes, meal shells, starter meals, factual product identities, future fully-syndicated corpora | Ownership, or explicit full-redistribution licence | All users | Import & keep; attributed where a licence requires |
| **Licensed Discovery** (`licensed_discovery`) | Content from licensed external providers (TheMealDB today; Edamam link-out; future commercial partners) | The provider's API/content licence, within its bounds | All users (discovery surfaces); persisted rows per licence | Per the source's register entry: `import`, `cache_ttl` or `link_only` |
| **Personal Cookbook** (`personal_cookbook`) | Content a user directed into their own cookbook: URL import, paste, photo, hand-typed | The user's personal-use equities; THA acts as a tool | **The importing user only — never discovery, suggestions, or any other user's view** | Private import & keep; `sourceUrl` + attribution retained; purge-on-request |
| **Community Cookbook** (`community_cookbook`) | User-authored recipes explicitly shared to other users | THA ToS rights grant from the sharing user | Users the share reaches | Import & keep under the ToS grant |

The Community Cookbook lane is **defined but dormant**: the vocabulary, schema value and visibility rule exist so that a future sharing feature is a feature implementation, not an architecture change. Only `authored` content by the sharing user may ever enter it — imported or licensed content can never be shared sideways into it.

## 3. Hard rules (invariants)

1. **No THA-initiated scraping, ever.** THA servers do not fetch publisher pages to extract recipe content. The only server-side content fetch permitted is from a source whose register entry sets `allowContentFetch: true` — which requires a licence that permits it. No current source qualifies.
2. **A source without a register entry is unfetchable and unpersistable by construction.** `shared/recipe-acquisition.ts` is the single policy owner; `recipe-source-gate.isSourceCallable` and `autoImportExternalMeal` enforce it. Admin enable/disable toggles operate *below* the policy layer and can never make an unlicensed or unreviewed source callable.
3. **Lane containment.** Personal Cookbook content never feeds discovery, Smart Suggest candidates, or any other user's view. Licensed Discovery content is persisted only where its `storagePolicy` is `import`. `link_only` sources (Edamam) may never have instructions stored or their `sourceUrl` fetched.
4. **Honest provenance, no laundering.** Externally acquired content is never labelled as user-authored. Every persistence path writes `acquisition_lane`, `acquisition_type`, `acquisition_source_key`, `licence_ref`, `attribution_text` (via explicit values or the canonical legacy derivation in `storage.createMeal`).
5. **Variants inherit lanes.** A derived meal (swap variant, household-safe variant) carries `acquisition_type: derived` and stays in its base meal's lane. Derivation is never a laundering mechanism.
6. **User transcription stays clean.** Paste/photo import (the user supplies content they possess) is Personal Cookbook `user_transcription`/`user_import`; THA never contacts the publisher on those paths.
7. **Attribution renders wherever the recipe renders.** `attribution_text` is the single owner of the attribution duty; display surfaces render it when present (consistent with `INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md`).

## 4. The policy vocabulary (owned by `shared/recipe-acquisition.ts`)

- `AcquisitionLane` — `tha_library | licensed_discovery | personal_cookbook | community_cookbook`
- `AcquisitionType` — `authored | licensed_import | user_import | user_transcription | product | derived | community_share`
- `StoragePolicy` — `import | cache_ttl | link_only | forbidden`
- `LicenceState` — `owned | licensed | conditional | pending_review | unlicensed` (only the first three are callable)

Each acquisition source has one `AcquisitionSourcePolicy` register entry recording its lane, storage policy, licence state, licence reference, attribution text, content-fetch permission and the licensing evidence (FS1/FS2 reference).

## 5. Enforcement points

| Layer | File | Enforces |
|---|---|---|
| Policy register | `shared/recipe-acquisition.ts` | The single source of truth for every rule above |
| Source gate | `server/lib/recipe-source-gate.ts` (`isSourceCallable`) | Policy → admin toggle → credentials, in that order; policy is non-overridable |
| Automated discovery | `server/lib/external-meal-service.ts` (`fetchExternalCandidates`) | Every automated source call passes the gate (closes FS2 C1-a) |
| Enrichment | `server/lib/external-meal-service.ts` (`enrichCandidateIngredients`) | Detail pages fetched only where `allowContentFetch` — currently nowhere |
| Persistence | `server/lib/auto-import-service.ts` (`autoImportExternalMeal`) | Only `storagePolicy: import` sources persist; honest `smart_import` provenance (closes FS2 C2-a) |
| Write funnel | `server/storage.ts` (`createMeal`) | Every new meal row receives acquisition provenance (explicit or canonically derived) |

## 6. Commercial extension rule

Adding a licensed provider or publisher partnership (Edamam Licensed Recipes, Good Food syndication via Immediate Media, Whisk for Business, Spoonacular live-fetch — FS2 §3) is **a register entry plus credentials, never an architecture change**:

1. Add/update the source's `AcquisitionSourcePolicy` entry with the negotiated lane, storage policy, licence reference and attribution text.
2. Add credentials to `SOURCE_REQUIRED_CREDS` where applicable.
3. If the licence is `cache_ttl`-bound (Spoonacular-style), content lives in discovery caching only and is never promoted to a meal row.

No consumer code changes: discovery, Smart Suggest, auto-import and attribution rendering already read the register.

## 7. Relationship to other governing documents

- **Source of Truth Register:** Meal Identity remains Domain 12 (`meals` table). This document adds the acquisition/provenance facet of that domain; it creates no second store.
- **`mealSourceType` (legacy):** remains for runtime compatibility at its existing branch points, now with the documented value `smart_import` for persisted licensed candidates. The acquisition columns are the canonical provenance owner; migrating the remaining `mealSourceType` branch points and retiring the column is a planned follow-up workstream.
- **Intelligence Platform:** intelligence capabilities never acquire recipe content directly; they consume the same business services (search, Smart Suggest, meals store), so acquisition policy governs them automatically.

## 8. Known caveats carried forward

- **Starter-meal provenance (FS2 E-a / R8):** the 1,323 starter rows are recorded as `tha_library / authored` pending the provenance archaeology FS2 R8 requires. If any prove to be historic imports, their rows must be re-laned honestly.
- **TheMealDB supporter key (FS1 G2):** licence state is `conditional` until the supporter key replaces the shared test key — a commercial action, tracked in the register entry's `licenceNote`.
- **User URL import hygiene (FS2 R5):** the user-directed import path (`POST /api/import-recipe`) is Personal Cookbook by right, but still fetches with browser-impersonation headers and a WordPress-API fallback. Replacing these with an honest User-Agent and robots/paywall respect is approved follow-up FS2 R5, out of FS3 scope.
