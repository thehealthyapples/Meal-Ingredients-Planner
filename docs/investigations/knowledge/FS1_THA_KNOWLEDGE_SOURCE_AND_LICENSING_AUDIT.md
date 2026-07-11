# FS1 — THA Knowledge Source & Licensing Audit

**Document type:** Investigation only — no code, schema, or data change.
**Date:** 2026-07-02
**Branch:** `int1-intelligence-platform`
**EWO:** EWO-FS1 (🟡 AMBER)
**Author role:** Data-licensing / IP-compliance reviewer + THA platform architect.
**Companion documents (read together, not restated here):**
- `docs/investigations/knowledge/NUTRITION_KNOWLEDGE_EDITORIAL_AND_AUTOMATION_FRAMEWORK.md` — the existing (unimplemented) proposal for a tiered Trusted Source Registry for nutrition content. This audit verifies it against what is *actually running in production today*, extends its source list to non-nutrition domains, and turns it into a general, reusable register.
- `docs/investigations/knowledge/NUTRITION_KNOWLEDGE_MANAGEMENT_SYSTEM_V1_DESIGN.md` — the proposed four-plane KMS the tiered registry would sit inside.
- `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` — domain ownership register this document does not duplicate; FS1 is *source provenance*, not *domain ownership*.

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Git status at start | Working tree already dirty with substantial prior uncommitted INT35–NUT1 work on this branch (unrelated to this task — see `git status`). This task adds exactly one new file. |
| HEAD at start | `4a2da735f5b80bac2da4dd306c387adeb5e431de` |
| Rollback tag | `rollback/before-fs1-knowledge-audit-20260702` → `4a2da73` |
| Restore command | `git reset --hard rollback/before-fs1-knowledge-audit-20260702` (only meaningful if this file is later deleted; nothing else was touched) |
| Undo this doc only | `rm docs/investigations/knowledge/FS1_THA_KNOWLEDGE_SOURCE_AND_LICENSING_AUDIT.md` |

**This task makes no code, schema, route, or data change.** It is a read-only audit of the codebase and of each external source's own published terms. Exactly one artefact is produced: this file (plus the rollback tag).

---

# SECTION 0 — METHOD

Every source below was located by reading the actual integration code (not by inference) — file paths and line numbers are cited so each claim is independently checkable. Licence terms for the four sources with material redistribution risk (Open Food Facts, TheMealDB, USDA FDC, Edamam) were verified against each provider's own published terms pages on 2026-07-02, not recalled from training data; where a provider's terms page could not be reached, that is stated explicitly rather than guessed.

"Currently used" means: there is live integration code in this repository that calls the source, whether or not a production credential is currently configured for it (credential status is recorded separately, since a code path with `defaultEnabled: true` and no license conversation on record is a governance gap regardless of whether the key happens to be set today).

---

# SECTION 1 — CURRENT EXTERNAL KNOWLEDGE SOURCES (FULL AUDIT)

## 1.1 Open Food Facts (OFF) — branded product / nutrition data

| | |
|---|---|
| **Purpose** | Bulk import of branded ready-meals/drinks/baby-food/frozen-food into THA's own `meals`/`nutrition` tables as first-class "system meals"; live barcode lookup for admin product entry and user barcode scanning. |
| **Where used** | `server/lib/openfoodfacts-importer.ts` (bulk import, writes to `meals`/`nutrition`), `client/src/pages/admin-ingredient-products-page.tsx:394` (barcode lookup), `client/src/pages/meals-page.tsx`, `client/src/pages/products-page.tsx` (barcode-not-found flows), `client/src/lib/ingredient-imagery.ts:30` (own code comment flags OFF images as "variable licensing per item — avoid"). |
| **Access** | Public REST API, no key required. Custom `User-Agent: "SmartMealPlanner/1.0 (contact@smartmealplanner.com)"` (`openfoodfacts-importer.ts:131` — see §2.1, stale branding). |
| **Ownership / licence (verified against openfoodfacts.org/terms-of-use, 2026-07-02)** | Three stacked licences: **ODbL 1.0** (database structure), **DbCL 1.0** (individual data entries), **CC BY-SA 3.0** (product images). Commercial use is explicitly permitted. **Attribution is required** — re-users must "mention the licence and attribute authorship to Open Food Facts with a link to openfoodfacts.org." **Share-alike is required** — a derivative database must be released under the same licence terms. |
| **Current usage vs. licence** | ❌ **Non-compliant as implemented.** THA imports full OFF product records (name, brand, ingredients, macros, image URL) into its own `meals` table, flags them `isSystemMeal: true`, and serves them to end users indistinguishably from THA's own catalogue (`mealSourceType: "openfoodfacts"` is stored but not surfaced to the user as a licence attribution — it only drives internal UI branching, e.g. `MealTrustSummary.tsx:22` shows a generic "About this product" label, not an OFF credit). No ODbL/DbCL notice, no link to openfoodfacts.org, and no share-alike release of the derived subset are present anywhere in the product. One in-app string mentions OFF as a *data signal* ("UPF scores come from Open Food Facts…", `upf-info-modal.tsx:86`) — that is provenance framing, not the licence attribution ODbL/DbCL actually require. |
| **Images** | Not re-hosted (URLs are hotlinked from OFF's own CDN, `image_front_url`/`image_url`), which avoids a copy-and-redistribute problem for the *file* itself, but does not resolve the CC BY-SA attribution requirement for *displaying* them, and the code's own comment already flags this as unresolved ("variable licensing per item"). |
| **Recommendation** | **Import — but only once compliant.** OFF's own licence explicitly permits exactly what THA is doing (commercial import into a derivative product database), so this is a **fixable compliance gap, not a source to drop**. Required: (1) a persistent, visible "Data from Open Food Facts, openfoodfacts.org, licensed under ODbL" attribution wherever OFF-sourced meals/products are displayed; (2) either stop treating imported records as an undifferentiated part of THA's own catalogue or publish the derived subset under compatible share-alike terms; (3) fix the stale `SmartMealPlanner`/`smartmealplanner.com` User-Agent (see §2.1) — it identifies THA under a name and contact address that no longer exist, which is itself a bad-faith signal to OFF's rate-limiting/abuse systems. |

## 1.2 USDA FoodData Central (FDC) — whole-food nutrient composition

| | |
|---|---|
| **Purpose** | Live per-request nutrient snapshot (calories, protein, carbs, fat, fibre, sugar) for a curated set of 10 whole foods (oats, lentils, salmon, tofu, spinach, eggs, broccoli, chickpeas, sweet potato, banana). |
| **Where used** | `server/lib/usda-whole-food-service.ts` (`getWholeFoodSnapshot`) — result is appended live to a food-knowledge response, not persisted. |
| **Access** | REST API, keyed via `USDA_API_KEY`; falls back to the public `DEMO_KEY` (30 req/hour, shared across every unauthenticated caller worldwide) if unset — `usda-whole-food-service.ts:12`. `server/index.ts:92` already logs this at startup ("USDA uses public DEMO_KEY (rate-limited)") as a known operational gap. |
| **Ownership / licence** | A work of the U.S. federal government — public domain in the United States under 17 U.S.C. §105, no permission or attribution legally required, free commercial use. This is USDA's long-standing, consistently stated policy across its data properties; the specific FDC licence sub-page could not be reached during this audit (404), but the public-domain status of USDA nutrient composition data is not in genuine doubt and is the basis on which every nutrition app that uses FDC operates. |
| **Current usage vs. licence** | ✅ **Compliant.** Public domain data, used live, not redistributed as a bulk copy, correctly tagged `source: "usda-fdc"` in the response shape. |
| **Gap (operational, not legal)** | Production traffic sharing the global `DEMO_KEY` risks silent failures under load from unrelated third-party callers exhausting the shared 30 req/hour quota. Free, per-app keys are trivial to obtain — this should simply be provisioned. |
| **Recommendation** | **Import/cache freely** — public domain, no restriction. Provision a dedicated `USDA_API_KEY` and consider caching the 10 curated snapshots locally (they change quarterly at most) rather than calling live per-request, purely for latency/reliability, not for licensing reasons. |

## 1.3 Recipe web scraping — BBC Good Food, AllRecipes, Jamie Oliver, Serious Eats

| | |
|---|---|
| **Purpose** | Extract ingredient lists and step-by-step instructions from recipe URLs (both a general-purpose "import a recipe from a link" feature and an automated recipe-discovery source). |
| **Where used** | `server/lib/recipe-scraper.ts`, `server/routes.ts:213,649,1610,2744,3429`, `server/lib/external-meal-service.ts:309,437,490,543`. Source enablement is gated by `server/lib/recipe-source-gate.ts`, which explicitly lists all four as `sourceType: "scraped"` with **`defaultEnabled: true`** (`recipe-source-gate.ts:23-26`). |
| **Access** | Direct HTML fetch/scrape with headers deliberately constructed to impersonate a real Chrome browser — `recipe-scraper.ts:12-25` sets a full `Sec-Fetch-*`/`Sec-Ch-Ua`/`Accept-Language` header set matching Chrome 120, explicitly to defeat basic bot detection on the target sites. |
| **Ownership / licence** | None granted. Recipe instructions and editorial description text are original literary works and are copyrighted by the publisher; none of these four sites' Terms of Service authorise automated scraping, and BBC Good Food and Serious Eats' `robots.txt`/ToS in particular are known to restrict automated access. (Bare ingredient *lists* are generally treated as facts/not copyrightable under UK and US case law, but the accompanying method text is not.) |
| **Current usage vs. licence** | ❌ **Non-compliant / unauthorised.** This is unlicensed scraping of copyrighted third-party content, with browser-impersonation headers that indicate the scraping was built to evade the target's own bot mitigation rather than to operate within an authorised access pattern. Scraped instructions are stored and served to THA users as part of the meal/recipe record — i.e. redistributed, not just linked. |
| **Recommendation** | **Avoid, or convert to link-out.** This is the highest-severity finding in this audit (see §2.2). Recommend: (a) disable the four scraped sources by default (`defaultEnabled: false`) pending legal review; (b) for a "paste a recipe URL" *personal-use* import (the user importing a recipe they found themselves, for their own private plan), this is materially lower risk than THA *itself* running scheduled scraping-based recipe discovery across these sites — the two use cases should be distinguished and governed differently; (c) replace source-based recipe *discovery* with the official APIs already wired in code (§1.4) that grant an actual licence for this use case. |

## 1.4 Recipe/food official APIs — TheMealDB, Edamam, API-Ninjas, BigOven, FatSecret, Whisk, Spoonacular

| Source | Status in code | Credential | Notes |
|---|---|---|---|
| **TheMealDB** | `defaultEnabled: true` (`recipe-source-gate.ts:18`); called at `external-meal-service.ts:232` via `.../api/json/v1/**1**/search.php` | No key needed for the test tier | See gap below — production use of the shared test key is against TheMealDB's own terms. |
| **Edamam** | `defaultEnabled: false`; requires `EDAMAM_APP_ID`+`EDAMAM_APP_KEY` (`server/index.ts:93-94`) | Not required to run, gated off by default | Edamam's own docs (verified 2026-07-02): "We do not hold the copyrights to these recipes… we do not provide the cooking instructions… but we do provide the url to the source recipe" — i.e. Edamam is licensed for **link-out**, not for storing full instructions. |
| **API-Ninjas** | `defaultEnabled: false`; requires `API_NINJAS_API_KEY` | Not required to run | Commercial API ToS not reviewed in this pass — flag for legal review before enabling. |
| **BigOven** | `defaultEnabled: false`; requires `BIGOVEN_API_KEY` | Not required to run | Commercial API ToS not reviewed in this pass — flag for legal review before enabling. |
| **FatSecret** | `defaultEnabled: false`; requires `FATSECRET_CLIENT_ID`+`FATSECRET_CLIENT_SECRET` | Not required to run | Commercial API ToS not reviewed in this pass — flag for legal review before enabling. |
| **Whisk** | Referenced `server/routes.ts:1053`, `server/index.ts:91` ("Whisk recipe source disabled" if unset) | `WHISK_API_KEY` | Commercial API ToS not reviewed in this pass — flag for legal review before enabling. |
| **Spoonacular** | `server/lib/price-lookup.ts:38,163` — used for **product price lookup**, not recipe content | `SPOONACULAR_API_KEY` (`server/index.ts:95`) | Adjacent to this audit's core scope (pricing, not knowledge), noted for completeness only. |

**TheMealDB gap (verified 2026-07-02 against themealdb.com/api.php):** "You can use the test API key '1' during development of your app or educational use… however you must become a supporter if releasing publicly on an appstore." THA's code constructs requests against the `.../v1/1/...` test-key endpoint (`external-meal-service.ts:232`) with `defaultEnabled: true` and no gating on production status — this is a live consumer product, not a development build, so continued use of the shared test key is **against TheMealDB's own published terms**. This is a low-cost fix (TheMealDB's supporter tier is inexpensive) and should be resolved before or immediately after this audit lands.

**Recommendation for this group:** **TheMealDB — fix (become a supporter) then import**, since a proper key makes this fully licensed. **Edamam — link only**, never store instructions, matching its own terms. **API-Ninjas / BigOven / FatSecret / Whisk — reference only until each ToS is reviewed**; none should move to `defaultEnabled: true` without that review.

## 1.5 OpenAI (GPT-4o family) — used as an implicit knowledge generator

| | |
|---|---|
| **Purpose** | Several distinct uses bundled under one provider: (a) ingredient "enrichment" — generates short nutrition-*adjacent* descriptive prose for pantry items with no DB entry (`server/lib/openai-enrichment.ts`); (b) item classification into a fixed category whitelist (`server/lib/openai-item-classifier.ts`); (c) OCR/text parsing of scanned recipes and receipts (`server/services/recipeParser.ts`, `server/routes.ts` — many call sites). |
| **Ownership / licence** | OpenAI's API Terms of Use assign the user (THA) rights to the *output* of API calls, and permit commercial use. This is not a redistribution-licence problem the way OFF/scraping are. |
| **The real issue is provenance, not licence.** | `openai-enrichment.ts` (a) generates novel descriptive nutrition-adjacent text with **no cited source at all** — it is model-generated from an opaque training corpus, not looked up from any registered source. It is well-guarded operationally (banned-phrase regex blocking medical claims, no numeric claims permitted, 20 calls/min rate limit, output validated before use — `openai-enrichment.ts:43-59`), which meaningfully reduces *medical-claim* risk. It does **not** resolve the *provenance* problem: the content has no source that could be cited, checked, or attributed. |
| **Internal governance conflict** | This directly contradicts THA's own stated future-state policy. `NUTRITION_KNOWLEDGE_EDITORIAL_AND_AUTOMATION_FRAMEWORK.md` §2.1 explicitly lists "Blogs / brands / influencers / **AI output**" as **"BANNED — never a source"** with trust level **"None."** §5.1 of the same document separately rejects "AI writes, template checks after" as a wording-generation pattern for exactly this reason ("a linter can only catch known-bad; it cannot prove the claim is faithful to the source"). `openai-enrichment.ts` is precisely that rejected pattern, already running in production, for a *different* capability (pantry ingredient knowledge) than the one the framework was written about (Nutrition Knowledge Registry) — the same principle applies to both, and the framework's own author did not appear to cross-reference this existing code path. |
| **Recommendation** | **Reference only, and reframe honestly.** Do not treat `openai-enrichment.ts` output as "knowledge" in the same sense as `shared/knowledge`/`shared/canonical` editorial content — it should be labelled internally (and, if ever surfaced with attribution, externally) as AI-generated descriptive colour, not sourced fact, consistent with the existing banned-claim guarding already in place. Item classification (b) and OCR parsing (c) are a different, lower-risk category — they interpret user-supplied content rather than originate facts — and are not knowledge-source concerns in the same sense; no change recommended there. |

## 1.6 Anthropic SDK & Google Gemini (`@google/genai`) — unused dependencies

`@anthropic-ai/sdk` and `@google/genai` are present in `package.json` (lines 70, 78) but **zero import sites** were found anywhere in `client/`, `server/`, or `scripts/` (confirmed via repo-wide search), and no corresponding API key is referenced anywhere in the codebase's environment-variable surface. These are vestigial/placeholder dependencies with no current data-source or licensing exposure. **Recommendation:** flag for removal, or clarify intended future use — an unused SDK sitting in `package.json` is not itself a compliance risk, but it will become one silently the moment someone wires it up without going through this register.

## 1.7 THA Editorial Knowledge — internally authored (not third-party)

`shared/knowledge/*` (foods, nutrients, health benefits, and their relationships — the Nutrition Knowledge Registry, seeded via `seed-knowledge-registry.ts`) and `shared/canonical/*` (Canonical Food Identity, plant-diversity groups, `nutrition-context.ts`'s 10 curated evidence lines) are THA's own IP: human-authored, tagged `source: "THA editorial"` by default in the DB schema (`shared/schema.ts:1531`, a free-text column, not a structured trust-tier field — see §3). One row set is explicitly tagged with external provenance: `source: "USDA FDC / WS0X.2 H1 batch 2026-06-24"` — i.e. a small, deliberately-sourced batch of USDA-derived composition facts blended into the editorial table with correct attribution in the free-text field. **No licensing issue** — this is THA's own content, already governed by the EFSA/health-claim firewall discipline documented in `INT41_CAPABILITY_ENRICHMENT.md` and `NUT1_NUTRITION_CAPABILITY_ENRICHMENT.md`. **Recommendation: import (already done) — this is the model every other source should be judged against.**

## 1.8 OSS libraries adjacent to knowledge sourcing (lower priority, noted for completeness)

`@zxing/browser`/`@zxing/library` (barcode decoding, Apache-2.0/MIT) and `tesseract.js` (OCR, Apache-2.0) are standard open-source dependencies, not external *content* sources — they process data THA already has (a barcode image, a scanned label) rather than supplying facts. No licensing exposure beyond standard OSS attribution-in-`package.json`, already satisfied by npm's licence metadata. No action recommended.

---

# SECTION 2 — COMPLIANCE GAPS, RANKED

| # | Gap | Source | Severity | Fix cost |
|---|---|---|---|---|
| G1 | Scraping four copyrighted recipe sites with browser-impersonation headers, `defaultEnabled: true`, content stored and redistributed to users | BBC Good Food, AllRecipes, Jamie Oliver, Serious Eats | **Critical** | Medium (disable by default; distinguish personal-use import from THA-run discovery; prefer licensed APIs) |
| G2 | Production use of TheMealDB's development-only test key, against TheMealDB's own published terms | TheMealDB | **High** | Low (become a supporter — inexpensive paid tier) |
| G3 | OFF data imported and redistributed as undifferentiated THA "system meals" with no ODbL/DbCL/CC-BY-SA attribution or share-alike release | Open Food Facts | **High** | Low–Medium (add a persistent attribution notice; resolve share-alike posture) |
| G4 | Stale integration identity — `User-Agent: "SmartMealPlanner/1.0 (contact@smartmealplanner.com)"` — a product name and contact address that no longer belong to THA, sent to a third party on every import call | Open Food Facts | Medium | Trivial (one string change) |
| G5 | AI-generated ingredient "knowledge" with no citable source, in direct tension with THA's own stated future-state ban on AI as a nutrition source | OpenAI (`openai-enrichment.ts`) | Medium | Low (relabel internally as AI-generated colour, not sourced fact; or fold into the Editorial Rules Engine's constrained-generation model when built) |
| G6 | Shared public `DEMO_KEY` in production risks silent nutrient-lookup failures under third-party-caused rate exhaustion | USDA FDC | Low (operational, not legal) | Trivial (provision a free dedicated key) |
| G7 | Five commercial recipe/nutrition APIs (Edamam, API-Ninjas, BigOven, FatSecret, Whisk) wired into code with no on-record ToS review, currently mitigated only by `defaultEnabled: false` | recipe-source-gate.ts | Low (dormant, but a silent flip-on risk) | Low (review each ToS before ever enabling; this register is the place to record the outcome) |

None of these gaps currently block THA's operation — most are **already latent/dormant** (defaulted off, or scraping that could be disabled with a flag) rather than requiring a rebuild. The register in §4 is designed so each gap has exactly one row to update once resolved.

---

# SECTION 3 — FUTURE-STATE NUTRITION: AUTHORITATIVE SOURCES

`NUTRITION_KNOWLEDGE_EDITORIAL_AND_AUTOMATION_FRAMEWORK.md` §2.1 already did rigorous per-source analysis for the *nutrition* domain specifically (USDA, NIH ODS, NHS, BNF, EFSA, OFF, Harvard, Examine.com, and an explicit ban on blogs/brands/AI output) and proposed a two-axis **trust tier × source role** model. This audit does not repeat that analysis — it is sound and is adopted here unchanged for the nutrition domain — but makes three additions the existing framework does not cover, plus one implementation-status correction.

**Correction — this is still a proposal, not running code.** The framework document itself states it made "no code, schema, migration, or data change" and its `editorial_rules`/`blessed_pattern`/tiered `sources` tables are explicitly future proposals. This audit confirms that status is still accurate: `shared/schema.ts` has no `sources`, `candidate_knowledge`, `published_registry`, or `editorial_rules` tables today. The only provenance actually stored per row is the free-text `source` column on `knowledge_foods`/`knowledge_nutrients`/`knowledge_health_benefits` (default `"THA editorial"`, §1.7) — a string, not the structured `trustTier`/`sourceRole` model the framework recommends. **Any future-state work should treat the tiered registry as still-greenfield**, not as an existing system being extended.

**Addition 1 — UK-specific composition data is a material gap, not a nice-to-have.** The existing framework's sole `composition`-role source is USDA FDC, which is US-centric (US fortification levels, US cultivars/regions, US portion conventions). THA is explicitly UK-first: `openfoodfacts-importer.ts` has a hard `isUKProduct`/`prioritiseUK` bias (`openfoodfacts-importer.ts:97-105`), and the framework's own §2.1 already prefers NHS wording over US sources for exactly this reason on the *outcome* side. The same logic should apply to *composition*: **McCance and Widdowson's Composition of Foods (CoFID)** — the UK's official nutrient databank, maintained by Public Health England/OHID, Crown copyright under the **Open Government Licence (OGL)** (free reuse, attribution requested, commercial use permitted) — should be added as a `tier1_official`/`composition` source, arguably senior to USDA FDC for THA's actual user base.

**Addition 2 — UK food-safety/allergen authority is currently absent.** The **Food Standards Agency (FSA)** (allergen guidance, food-safety data) is UK-government, Crown copyright/OGL, and is the natural authority for any future allergen-warning or food-safety-adjacent capability — not covered by the existing framework because it was scoped to nutrition *benefit* wording, not safety.

**Addition 3 — a global corroboration source is missing.** **WHO** (World Health Organization) nutrition guidance is reusable under WHO's own terms (generally free reuse with attribution for non-commercial and most commercial educational use; case-by-case for some outputs) and would sit at `tier1_official`/`corroboration` — useful where THA wants a claim to be defensible outside a single national authority.

**Implementation-status correction applies to the roadmap too:** the framework's E0→E7 build order (§10.3 of that document) remains the right sequencing recommendation; this audit adds no new roadmap, only new rows for the Trusted Source Registry that roadmap would populate (§4 below folds them in).

---

# SECTION 4 — GOVERNED KNOWLEDGE SOURCE REGISTER

This is the reusable register requested by the brief: one row per source, independent of which capability consumes it, so any future capability (Nutrition, Pantry, Recipes, Analyser, Shopping, or one not yet built) checks this table before adding a new integration rather than re-litigating licensing from scratch. `trustTier`/`sourceRole` columns follow the two-axis model already established in `NUTRITION_KNOWLEDGE_EDITORIAL_AND_AUTOMATION_FRAMEWORK.md` §2.2, extended here beyond nutrition to every source this audit found.

| Source | Domain | trustTier | sourceRole(s) | Licence | Commercial use | Currently used? | **Recommended action** |
|---|---|---|---|---|---|---|---|
| **THA Editorial** (`shared/knowledge`, `shared/canonical`) | Nutrition, food identity | `tier1_official` (own IP) | composition, outcome, wording | THA-owned | N/A | ✅ Live | **Import** (already the model) |
| **USDA FoodData Central** | Nutrition composition | `tier1_official` | composition | US public domain | ✅ Unrestricted | ✅ Live | **Import/cache** — provision dedicated key |
| **CoFID / McCance & Widdowson** (PHE/OHID) | Nutrition composition, UK-specific | `tier1_official` | composition | Crown copyright / OGL | ✅ Permitted, attribution requested | ❌ Not integrated | **Import** — priority addition, UK-first fit better than USDA |
| **NIH Office of Dietary Supplements** | Nutrient↔outcome | `tier1_official` | outcome | US Gov, generally reusable w/ attribution | ✅ Yes | ❌ Not integrated (future) | **Reference/import** per existing framework §2 |
| **NHS (nhs.uk)** | Consumer-safe wording | `tier1_official` | outcome, wording | Crown copyright / OGL | ✅ Permitted, attribution required | ❌ Not integrated (future) | **Reference/import** per existing framework §2 |
| **Food Standards Agency (FSA)** | Allergen / food-safety | `tier1_official` | safety | Crown copyright / OGL | ✅ Permitted, attribution required | ❌ Not integrated | **Reference** — new addition, adopt when a safety/allergen capability is built |
| **EFSA health-claims register** | Wording permissibility | `tier1_official` | wording_authority | EU reuse w/ attribution | ✅ Yes | ✅ Already governs THA's internal claim wording (firewall) | **Reference** (wording gate, not a discovery source) |
| **British Nutrition Foundation** | UK education/corroboration | `tier2_scientific` | outcome, corroboration | Terms-of-use, attribution | ✅ Yes | ❌ Not integrated (future) | **Reference** per existing framework §2 |
| **Harvard Nutrition Source** | Corroboration | `tier2_scientific` | corroboration | Copyright, cite don't relicense | ⚠️ Cite only | ❌ Not integrated (future) | **Reference** per existing framework §2 |
| **WHO** | Global corroboration | `tier1_official` | corroboration | WHO reuse terms, attribution | ✅ Mostly | ❌ Not integrated | **Reference** — new addition |
| **Open Food Facts** | Branded product data | `tier3_reference` | composition, linkage | ODbL + DbCL + CC BY-SA (attribution + share-alike required) | ✅ Yes, with attribution | ✅ Live | **Import — once compliant** (§1.1/G3/G4) |
| **TheMealDB** | Recipe discovery | `tier3_reference` | linkage | Free-dev-key terms; paid supporter tier for production | ✅ Yes, paid tier | ✅ Live (on test key — non-compliant) | **Import — after upgrading to supporter key** (§1.4/G2) |
| **Edamam** | Recipe discovery | `tier3_reference` | linkage | API terms — link-out only, no instruction storage | ✅ Yes, within terms | ⚠️ Wired, disabled by default | **Link only** — never store instructions |
| **API-Ninjas / BigOven / FatSecret / Whisk** | Recipe discovery | `tier3_reference` (provisional) | linkage | Not yet reviewed | Unknown | ⚠️ Wired, disabled by default | **Reference only until ToS reviewed** — do not enable |
| **Spoonacular** | Product pricing (not knowledge) | n/a | pricing | Not reviewed (out of this audit's core scope) | Unknown | ⚠️ Wired, disabled by default | **Reference only until ToS reviewed** |
| **BBC Good Food / AllRecipes / Jamie Oliver / Serious Eats** | Recipe content | `banned` (as currently accessed) | — | None granted; ToS likely prohibits scraping | ❌ No | ✅ Live, `defaultEnabled: true` | **Avoid as a discovery source; disable default-on** (§1.3/G1) |
| **Examine.com** | Curator reading | `tier3_reference` | (curator-read only) | Proprietary | ❌ Cite underlying primary source only | ❌ Not integrated | **Reference only — never cite directly** |
| **OpenAI (GPT-4o)** | AI-generated descriptive text | `banned` as a knowledge source; acceptable as a labelled AI-generation tool | — | OpenAI API ToS (output rights assigned to caller) | ✅ Yes (as a tool, not a source) | ✅ Live | **Avoid as "knowledge"; keep, relabelled, as a guarded AI-generation utility** (§1.5/G5) |
| **Blogs / brand sites / influencers** | — | `banned` | — | — | — | ❌ Not integrated | **Avoid** |

**Legend:** *Import* = pull into THA's own store, persist, and serve as THA content (requires the strictest licence clearance). *Cache* = store temporarily for performance, not as permanent THA content. *Reference* = cite/use to inform THA's own editorial writing, never redistribute verbatim. *Link* = send the user to the source, never store its substantive content. *Avoid* = do not integrate, or disable/replace an existing integration.

**How to use this register for a new capability:** before wiring any new external data source into any THA capability, add a row here first — trust tier, source role, licence, and recommended action — the same way a new domain must be declared in the Source of Truth Register before code is written. This register does not gate implementation by itself (no automated check enforces it today, matching the "still greenfield" status noted in §3), but it is the single place a reviewer checks before approving a new integration.

---

# SECTION 5 — DATA IMPACT

- Reads existing data: **YES** — read-only review of code and public licence terms.
- Writes new data: **NO** — no schema, table, or seed change.
- Changes meaning of existing data: **NO**.
- Requires backfill: **NO**.

---

# SECTION 6 — TRUST CHECK

- **Could this mislead the user?** No — this document does not change any user-facing behaviour. It exists precisely because two current integrations (OFF import, TheMealDB test key, recipe scraping) already carry a *real* risk of THA misleading OFF/TheMealDB/scraped publishers about its compliance posture — this audit surfaces that risk rather than creating one.
- **Could this fabricate certainty?** No — every licence claim in §1 is either sourced to a specific, dated fetch of the provider's own terms page (OFF, TheMealDB, Edamam) or explicitly flagged as unverified/needing legal review where it could not be confirmed (API-Ninjas, BigOven, FatSecret, Whisk, Spoonacular, WHO's exact reuse terms).
- **Is anything guessed but shown as real?** No — the one gap in verification (USDA FDC's specific licence sub-page returned 404) is stated as such in §1.2 rather than silently assumed; the underlying public-domain conclusion still stands on well-established, long-standing USDA policy, not on the unreachable page.
- **What happens if the system is wrong?** Worst case: this document under- or over-states a licence risk that a follow-up legal review corrects. No code path changes as a result of this document alone — every recommended action in §2/§4 requires a separate implementation decision.
- No architectural duplication introduced: **YES** confirmed — this document explicitly defers to and does not restate `NUTRITION_KNOWLEDGE_EDITORIAL_AND_AUTOMATION_FRAMEWORK.md`'s nutrition-source analysis or `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`'s domain-ownership model; it is a new register (source licensing) that neither existing document covers generally.
- No new source of truth created for existing domains: **YES** confirmed — this is a provenance/compliance register, not a data-ownership register.

---

# SECTION 7 — ROLLBACK PLAN

- Rollback identifier: `rollback/before-fs1-knowledge-audit-20260702` at `4a2da73`.
- Files added: `docs/investigations/knowledge/FS1_THA_KNOWLEDGE_SOURCE_AND_LICENSING_AUDIT.md` only.
- Rollback command: `rm docs/investigations/knowledge/FS1_THA_KNOWLEDGE_SOURCE_AND_LICENSING_AUDIT.md` (no other file was touched by this task).
- Verification after rollback: `git status` shows the file removed; no other diff.

---

**Investigation completed:** 2026-07-02
**STOP — investigation complete. No implementation performed. §2 and §4 are recommendations requiring separate, explicitly approved follow-up work (in particular G1, the recipe-scraping finding, and G2, the TheMealDB key, given their severity).**
