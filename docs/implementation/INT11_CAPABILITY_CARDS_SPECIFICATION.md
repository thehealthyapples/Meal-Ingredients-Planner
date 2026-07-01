# INT11 — Capability Cards (EPIC 1: Profile, Household, Partners, Meals, Templates, Analyser) — Specification

**Status:** COMPLETE
**Date:** 2026-06-30
**Branch:** `int1-intelligence-platform`
**Workstream:** INT11 (EPIC 1)
**Produced using:** [INT7A Intelligence Capability Factory](../architecture/INTELLIGENCE_CAPABILITY_FACTORY.md) fill-in template + the [Developer Capability Registry](../architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md)

> **Scope note.** This workstream produces **Capability Cards only** — completed INT7A fill-in templates, grounded in direct codebase evidence. **No code was written. No bindings were created. No runtime file was modified.** This is the explicit instruction for EPIC 1: investigate, document, decide nothing that requires execution. Cards marked with an "Open decision" line require a governance call before any future implementer starts Step 0 of the Factory.

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Rollback tag | `int11-rollback-pre-capability-cards` → `a5294f80265a245d4120e6786a170775eeecbeb9` |
| Code modified | None |
| Bindings created | None |
| Runtime modified | None |
| Schema modified | None |
| Files created | This report; updates to the Developer Capability Registry (documentation only) |

To restore: `git checkout int11-rollback-pre-capability-cards`

---

## ARCHITECTURE BOOTSTRAP (gate)

- [x] Read `docs/architecture/README.md` — no conflicts found.
- [x] Read `docs/architecture/INTELLIGENCE_CAPABILITY_FACTORY.md` (INT7A) — fill-in template used verbatim as the card structure.
- [x] Read `docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` (INT9A) — existing Phase 2 stub entries used as the starting point, then verified/corrected against live code.
- [x] Confirmed all six target capabilities exist in `server/intelligence/capability-registry.ts` with `availability: "registered"` (not `"never"`) — verified by direct read of the file (lines 80–223).
- [x] Confirmed `diary` (the seventh Phase 2 capability) is **out of scope** here — it was already bound under INT10 (`server/intelligence/bindings/diary.ts` exists, `bindDiaryReadCapability` is wired into `intelligence-platform.ts:51`).

---

## ARCHITECTURE COMPLIANCE

| Check | Result |
|---|---|
| One canonical Intelligence Platform | ✅ Pass — not touched |
| One Capability Registry | ✅ Pass — not touched; cards describe binding to existing entries only |
| One Intent Engine | ✅ Pass — not touched |
| No new owner created | ✅ Pass — every card identifies an *existing* owner; where the stub's claimed owner was wrong, the card corrects it to the real existing owner (never invents one) |
| No duplicate state | ✅ Pass — no code, no state of any kind |
| No code, schema, routes, UI, or bindings created | ✅ Pass — pure documentation |
| Runtime Capability Registry remains sole runtime source of truth | ✅ Pass — `server/intelligence/capability-registry.ts` unchanged |
| Honest gaps preserved | ✅ Pass — every card lists honest-gap cases per capability; no fabricated read scopes |

**Gate result: PASS**

---

## HOW THIS DIFFERS FROM THE EXISTING PHASE 2 STUBS

The Developer Capability Registry (INT9A) already listed these six capabilities under "Phase 2 — Planned Bindings," but those entries were **placeholders** written without codebase verification — they recorded the *registry's* owner-service guess, not confirmed read methods. This workstream re-investigated each owner service directly (file:line evidence) and found four corrections worth flagging before any future binding work starts:

| Capability | Stub said | Evidence shows |
|---|---|---|
| Household | Owner = `server/lib/household.ts` | That file is a thin session resolver + **dead-code** middleware (`requireHouseholdRole` is never wired into a route). The real owner of household reads is `server/storage.ts` (Household System + Eaters sections). `household-meal-matcher.ts` is unrelated business logic, not a household read surface. |
| Templates | Owner = `server/template-migration.ts` | That file is a one-time backfill script with no read methods. The real owner is `server/storage.ts` (meal-template + plan-template methods). `meal-food-intelligence.ts` lives at `server/services/`, not `server/lib/`, and is unrelated to templates. |
| Meals | Access scope = "household-scoped" | The owner (`storage.getMeals`/`getMeal`) scopes by **`userId`**, not `householdId`. There is no household-level meal scoping anywhere in the owner. |
| Partners | apiSurface includes `/api/routing` and `/api/savings/*` as retailer/comparison reads | `/api/routing` returns a UI-navigation hint (`quicklist`/`planner`/`cookbook`/`analyser`), not a retailer. `/api/savings/aggregates` returns behavioural savings (takeaway avoided, pantry used), not retailer price comparison. Neither belongs to "Partners / Supermarkets" as the capability is actually described. |
| Analyser | apiSurface includes `/api/scan`; SoT cites "product analysis tables" | `/api/scan` is recipe/shopping-list/planner OCR extraction (`recipeParser.ts`), unrelated to product/UPF analysis. No product-analysis table exists anywhere in the schema — `analyzeProduct`/`analyzeProductUPF` are pure live computations over freshly-fetched OpenFoodFacts data, not stored reads. |

These corrections are carried into the cards below and into the Developer Capability Registry update. They are findings, not implementation — nothing here changes runtime behaviour or the registry's `apiSurface` strings (those remain as recorded in `capability-registry.ts`; only the *developer-facing planning document* is corrected).

---

## CAPABILITY CARD — Profile / Preferences

```
Capability ID:          profile
Capability name:        Profile / Preferences
Owner service:          server/storage.ts — getUser() (line 395), getUserPreferences() (line 840).
                         NOTE: server/lib/sanitizeUser.ts is a sanitizer, not the owner — and is not
                         actually called by any of the routes below. server/routes.ts's local
                         buildProfileResponse() (lines 851–918) is the route-layer composer, not
                         a reusable owner method.
Source of Truth:        SoT D7, D26, D27 — `users` table (shared/schema.ts:8–41) +
                         `user_preferences` table (shared/schema.ts:642–676)
Access scope:           own-data only (user-scoped). Enforced structurally: every existing GET route
                         derives the id exclusively from req.user!.id (session), never from a param —
                         confirmed at server/routes.ts:921–924, 5277–5278, 6905–6907, 6953–6955.
Supported read intents: read, explain, add (per capability-registry.ts:114)
Executable intents:     read   — explain has no stored rationale to surface; add is a write.
Allowed scopes:         profile   — id, username, displayName, firstName, profilePhotoUrl,
                                    measurementPreference, preferredPriceTier, onboardingCompleted,
                                    isBetaUser, emailVerified, dietPattern, dietRestrictions,
                                    eatingSchedule, role, subscriptionTier/Status/ExpiresAt, isDemo,
                                    demoExpiresAt, createdAt, lastLoginAt, lastSeenAt,
                                    customMetricDefs, diaryExtraMetrics
                         preferences — all 32 fields on user_preferences (diet types, exclusions,
                                    health goals, budget, stores, calorie/height/weight, household
                                    counts, feature/planner toggles) — none are sensitive
Honest gaps:            explain verb — no stored rationale for any profile field — gap
                         add verb — write — gap
                         household eater dietary overrides (household_eaters table) — belong to
                           the household capability, not profile — gap if requested here
Permission model:       req.isAuthenticated() → 401 if not; id always taken from req.user!.id,
                         never from params/body, for every read route inspected. No explicit
                         "is this my own profile" check exists because the id can never be anyone
                         else's — own-data is structural, not a runtime branch.
Port methods:           getUser(userId)            → storage.getUser(userId)
                         getUserPreferences(userId) → storage.getUserPreferences(userId)
Handler responsibilities: read verb composes a profile projection (mirror buildProfileResponse's
                         allowlist) + a preferences projection (all 32 fields, none excluded).
                         OPEN DECISION: neither existing GET route calls sanitizeUser() — the route
                         layer uses its own explicit allowlist instead. A future binding must define
                         its own explicit allowlist (do not call storage.getUser() and forward the
                         raw row — it includes password, emailVerificationToken,
                         emailVerificationExpires, passwordResetToken, passwordResetExpires).
Binding registration:   PROFILE_EXECUTABLE_INTENTS = ["read"]
Tests required:         Standard INT7A Step 6 sections, plus an explicit assertion that
                         password / emailVerificationToken / emailVerificationExpires /
                         passwordResetToken / passwordResetExpires never appear in handler output.
Documentation updates:  server/intelligence/README.md row (future binding only)
Data impact:            Reads only — no writes, no schema change
Trust rules:            Never surface another user's profile (structural, not a runtime check —
                           still must be tested). Never surface password/token fields. Never pull
                           household_eaters overrides into a profile read.
```

---

## CAPABILITY CARD — Household

```
Capability ID:          household
Capability name:        Household
Owner service:          server/storage.ts — Household System section (line 2354 onward) +
                         Eaters section (line 2730 onward). Specifically:
                           getHouseholdWithMembers(householdId)   — line 2426 (read)
                           getHouseholdDietaryContext(userId)     — line 2700 (read)
                           getHouseholdEaters(householdId)        — line 2760 (read)
                         server/lib/household.ts contributes only getHouseholdForUser(userId)
                         (line 17 — resolves the caller's active householdId from session).
                         household-meal-matcher.ts is NOT a household read surface — it duplicates
                         a raw Drizzle read for unrelated meal-compatibility scoring logic; excluded.
Source of Truth:        SoT D16 — households / household_members / household_eaters
                         (shared/schema.ts:1063–1096)
Access scope:           own-data only (household-scoped). Scoping always flows from the
                         authenticated session via getHouseholdForUser(req.user!.id) — there is no
                         /api/household/:id route and no client-suppliable household id anywhere in
                         this surface, so there is no id-enumeration path to leak another
                         household's existence.
Supported read intents: read, explain, add, delete (capability-registry.ts:170)
Executable intents:     read   — explain has no stored rationale; add/delete are writes.
Allowed scopes:         household        — id, name, members (via getHouseholdWithMembers)
                         dietary-context  — aggregated diet types/exclusions across active members
                                            (getHouseholdDietaryContext)
                         eaters           — household_eaters rows, enriched at read time for adult
                                            (userId != null) eaters from users.dietPattern /
                                            users.dietRestrictions (mirrors server/routes.ts:8526–8541)
Honest gaps:            explain — no stored rationale on membership/eater records — gap
                         add/delete — write — gap
                         caller belongs to no household — getHouseholdForUser() throws; the handler
                           must translate this into gap, not a fabricated empty household
Permission model:       req.isAuthenticated() → 401; householdId resolved only from
                         getHouseholdForUser(req.user!.id) (server/lib/household.ts:17). Note:
                         requireHouseholdRole (household.ts:41) is unused dead code — not relevant
                         to a read-only binding's permission model.
Port methods:           getHouseholdForUser(userId)        → household.getHouseholdForUser(userId)
                         getHouseholdWithMembers(householdId) → storage.getHouseholdWithMembers(id)
                         getHouseholdDietaryContext(userId)   → storage.getHouseholdDietaryContext(userId)
                         getHouseholdEaters(householdId)      → storage.getHouseholdEaters(id)
Handler responsibilities: resolve householdId from session once; delegate per scope; project results.
                         OPEN DECISION: the live human route returns households.inviteCode to members
                         (server/routes.ts:8387). Recommend EXCLUDING inviteCode from the AI-facing
                         projection even though the human UI shows it — an AI capability is a new,
                         broader-blast-radius consumer of a join secret. This is a recommendation for
                         the implementer to confirm with a governance owner, not a decision made here.
Binding registration:   HOUSEHOLD_EXECUTABLE_INTENTS = ["read"]
Tests required:         Standard set + "caller has no household → gap, not denied" test +
                         inviteCode-exclusion trust-rule assertion (pending the open decision above).
Documentation updates:  server/intelligence/README.md row (future binding only); the Developer
                         Capability Registry's prior owner-service field (household.ts) is corrected
                         by this card.
Data impact:            Reads only
Trust rules:            Never surface another household's membership or eaters. Never fabricate
                         dietary restrictions. inviteCode handling per the open decision above.
```

---

## CAPABILITY CARD — Partners / Supermarkets

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

## CAPABILITY CARD — Meals / Cookbook

```
Capability ID:          meals
Capability name:        Cookbook / Meals
Owner service:          server/storage.ts — getMeals(userId) (line 433), getMeal(id) (line 437),
                         getMealsSummary(userId) (line 1040), getSystemMeals()/
                         getSystemMealsSummary() (lines 1000/1044), getMealItems(mealId)
                         (line 3408), lookupMeals(query) (line 1406).
                         NOT server/lib/meal-service.ts (starter-meals onboarding flow only — no
                         general list/get/search). NOT recipe-swap-engine.ts (write/generation
                         logic — applyRecipeSwaps mutates ingredients, no read surface). NOT
                         server/meal-resolution-service.ts (resolves meal-plan template slots, a
                         different concern from cookbook browsing/search).
Source of Truth:        SoT D12 — meals + meal_items tables (shared/schema.ts:95–133, 1260–1268).
                         Nutrition is a SEPARATE table (shared/schema.ts:135–145), joined by mealId
                         — not embedded in the meal record.
Access scope:           CORRECTION to prior stub: own-data is USER-scoped (storage.getMeals filters
                         by userId at the query, server/storage.ts:434), not household-scoped, plus
                         system meals (shared across all authenticated users, isSystemMeal=true).
                         There is no household-level meal scoping anywhere in the owner.
Supported read intents: read, explain, search, recommend, generate, add, replace, delete, import,
                         share (capability-registry.ts:86)
Executable intents:     read — search is a documented open decision (see gap below); ship read-only
                         first, add search once the scoping question is resolved.
Allowed scopes:         list    — getMeals(userId) + getSystemMeals(), merged (mirrors
                                  server/routes.ts:1160)
                         summary — getMealsSummary(userId) + getSystemMealsSummary()
                         detail  — getMeal(id) + getMealItems(mealId), WITH a mandatory ownership
                                  check (see Permission model — the owner method itself does not
                                  filter)
Honest gaps:            recommend — the existing /api/meals/recommended route computes ranking
                           (rankMealsByPreferences) INLINE AT THE ROUTE LAYER, not via a single
                           delegate-only owner method. Reimplementing that ranking in a capability
                           handler would be business logic in the handler (forbidden by INT7A
                           §"Avoiding Duplicate Business Logic") — gap until the owner exposes one
                           method that returns an already-ranked list.
                         generate/add/replace/delete/import/share — write — gap
                         explain — no stored rationale field on meals — gap
                         meal id not owned by caller and not a system meal — denied (see below)
                         search (lookupMeals) — OPEN DECISION, see below
Permission model:       CRITICAL FINDING: storage.getMeal(id) and storage.getMealItems(mealId) have
                         NO ownership filter at the storage layer — any id returns its row regardless
                         of caller. Ownership is enforced entirely at the ROUTE layer:
                         `meal.userId !== req.user!.id && !meal.isSystemMeal` → 404
                         (server/routes.ts:1183, duplicated at :1295, :1310, :10086, :10097).
                         A capability handler MUST replicate this exact check before returning detail/
                         items data — the owner does not expose a scoped method to delegate to. This
                         is a documented, narrow exception to "owner remains owner": the check is an
                         ownership/auth gate (analogous to requireUserId), not domain business logic,
                         so it is permitted in the handler per INT7A's allowed-list — but the
                         implementer should flag to the owner that a scoped getMealForUser(id, userId)
                         method would be architecturally cleaner.
                         OPEN DECISION — search: storage.lookupMeals(query) has ZERO scoping — it
                         ILIKE-matches meals.name across the ENTIRE table, including other users'
                         private (non-system) meals (server/storage.ts:1406–1423). The existing route
                         (server/routes.ts:5244) only checks isAuthenticated(), not ownership. Binding
                         this as-is would let any caller search other users' private meal names — NOT
                         safe to bind without a decision: either (a) the owner adds user/system
                         scoping to lookupMeals, or (b) the capability filters results post-hoc by
                         userId/isSystemMeal in the handler (defensible as a "safety filter," not
                         business logic, but flagged here for governance review before
                         implementation), or (c) gap the search verb entirely until resolved.
Port methods:           getMeals(userId)         → storage.getMeals(userId)
                         getSystemMeals()         → storage.getSystemMeals()
                         getMealsSummary(userId)  → storage.getMealsSummary(userId)
                         getSystemMealsSummary()  → storage.getSystemMealsSummary()
                         getMeal(id)              → storage.getMeal(id)
                         getMealItems(mealId)     → storage.getMealItems(mealId)
                         lookupMeals(query)       → storage.lookupMeals(query)  [pending open decision]
Binding registration:   MEALS_EXECUTABLE_INTENTS = ["read"]  (add "search" only after the open
                         decision above is resolved)
Tests required:         Standard set + explicit ownership-denial test for detail/items (id not owned,
                         not system → denied) + (once search ships) a test proving search cannot
                         leak another user's private meal.
Documentation updates:  server/intelligence/README.md row (future binding only). Developer Capability
                         Registry's "household-scoped" access-scope field is corrected to "user-scoped
                         + system meals" by this card.
Data impact:            Reads only
Trust rules:            Never fabricate ingredient quantities or nutritional values — nutrition is a
                         separate table, joined by mealId; gap if absent, never estimate. Never expose
                         another user's private meal via detail or (until resolved) search.
```

---

## CAPABILITY CARD — Plan Templates

```
Capability ID:          templates
Capability name:        Plan Templates
Owner service:          server/storage.ts — getMealTemplates() (line 926), getMealTemplate(id)
                         (line 930), getMealTemplateByName(name) (line 935), listTemplates()
                         (line 1515), getPublishedGlobalTemplates(tier) (line 1522),
                         getAllGlobalTemplatesAdmin() (line 1553), getUserPrivateTemplates(userId)
                         (line 1577), getTemplateWithItems(id) (line 1488), getDefaultTemplate()
                         (line 1505), countUserPrivateTemplates (line 1601).
                         CORRECTION to prior stub: server/template-migration.ts is a ONE-TIME
                         BACKFILL SCRIPT (runTemplateMigration(), line 5) with no read methods — not
                         a live owner. server/lib/meal-food-intelligence.ts does not exist at that
                         path; the actual file is server/services/meal-food-intelligence.ts and it is
                         unrelated to templates (per-meal ingredient intelligence).
Source of Truth:        SoT D13 — meal_templates (shared/schema.ts:48–77) + meal_plan_templates
                         (865–883) + meal_plan_template_items (885–901)
Access scope:           own-data (user-scoped private templates, ownerUserId = userId) PLUS public
                         (published global templates, ownerUserId IS NULL AND status = "published").
                         Publish/unpublish is admin-gated (isAdmin, server/lib/access.ts:6, assertAdmin
                         line 21).
Supported read intents: read, explain, search, recommend, generate, add, import, delete, share
                         (capability-registry.ts:184)
Executable intents:     read — search has no owner method (see gap below), so it is not executable.
Allowed scopes:         meal-templates list/detail — getMealTemplates() / getMealTemplate(id)
                         plan-templates library     — getPublishedGlobalTemplates(tier) +
                                                       getUserPrivateTemplates(userId) — own private
                                                       + published global only
                         plan-templates mine         — getUserPrivateTemplates(userId)
                         plan-templates default       — getDefaultTemplate()
                         plan-template detail by id  — getTemplateWithItems(id), WITH a mandatory
                                                       ownership/publish gate the handler must apply
                                                       itself (see Permission model — the existing
                                                       human route does NOT apply one)
Honest gaps:            search — NO search-by-name/tag method exists anywhere in storage.ts or
                           template-migration.ts (grepped; zero matches for searchTemplates /
                           searchMealTemplates / searchPlanTemplates / templatesByTag). Only an
                           exact-match getMealTemplateByName(name) exists (case-insensitive ilike,
                           not a search) — gap until the owner adds one.
                         recommend/generate/add/import/delete/share — write/generation — gap
                         explain — no stored rationale — gap
                         unpublished or other-user template requested by a non-owner, non-admin
                           caller — denied (see Permission model; this is STRICTER than the existing
                           human route)
Permission model:       mealPlanTemplates.ownerUserId distinguishes global (NULL) vs private
                         (=userId). getPublishedGlobalTemplates() filters isNull(ownerUserId) AND
                         status="published" + tier (server/storage.ts:1542–1546). Admin gate via
                         isAdmin()/assertAdmin (server/lib/access.ts:6,21), requiring
                         ownerUserId===null on admin routes.
                         CRITICAL FINDING: GET /api/plan-templates/:id (server/routes.ts:7522) has NO
                         owner/published/admin check at all in the live route — it returns ANY
                         template by id regardless of draft/owner status via getTemplateWithItems(id).
                         A capability handler must NOT simply delegate this as-is; it must apply the
                         same gate used elsewhere in the codebase (template.ownerUserId === null &&
                         status === "published") || ownerUserId === callerId || isAdmin(caller) —
                         otherwise the AI capability would be a NEW way to read other users' draft
                         templates that the existing human route already (under-)guards inconsistently
                         elsewhere. This is a documented stricter-than-existing-route decision the
                         card recommends, not a default the implementer should assume is already safe.
Port methods:           getMealTemplates()                  → storage.getMealTemplates()
                         getMealTemplate(id)                 → storage.getMealTemplate(id)
                         getPublishedGlobalTemplates(tier)   → storage.getPublishedGlobalTemplates(tier)
                         getUserPrivateTemplates(userId)     → storage.getUserPrivateTemplates(userId)
                         getTemplateWithItems(id)             → storage.getTemplateWithItems(id)
                                                                 [handler applies the gate above]
                         getDefaultTemplate()                 → storage.getDefaultTemplate()
Binding registration:   TEMPLATES_EXECUTABLE_INTENTS = ["read"]
Tests required:         Standard set + an explicit test that an unpublished/other-user template id
                         returns denied (not the existing route's permissive pass-through) + an
                         admin-vs-regular-user template visibility test.
Documentation updates:  server/intelligence/README.md row (future binding only). Developer Capability
                         Registry's owner-service field corrected from template-migration.ts → storage.ts;
                         meal-food-intelligence.ts path corrected.
Data impact:            Reads only
Trust rules:            Never surface an admin-unpublished or other-user's draft template to a
                         regular caller — the binding must be stricter here than the existing
                         under-gated human route.
```

---

## CAPABILITY CARD — Analyser (Product / UPF)

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

## SUMMARY TABLE

| Capability | Recommended executable intents | Owner correction needed? | Open decision before implementation |
|---|---|---|---|
| Profile | `read` | No | Define an explicit field allowlist (existing routes don't use `sanitizeUser()`) |
| Household | `read` | Yes — owner is `storage.ts`, not `household.ts` | inviteCode exclusion from AI-facing projection |
| Partners | `read` (retailer list only) | Yes — `/api/routing` and `/api/savings/*` don't belong here | Whether live external price fetches are ever in-scope for a "read-only" binding |
| Meals | `read` (search deferred) | No (owner confirmed) | Access scope is user-scoped not household-scoped; `lookupMeals` search leaks other users' private meals as-is |
| Templates | `read` | Yes — owner is `storage.ts`, not `template-migration.ts` | Handler must apply a stricter publish/ownership gate than the existing under-guarded `GET /api/plan-templates/:id` route |
| Analyser | `read` (additives only) | No (no stored owner exists for product/UPF results) | SoT D19 "product analysis tables" claim appears inaccurate; whether live OpenFoodFacts fetches are ever in-scope |

---

## DATA IMPACT

| | |
|---|---|
| Reads existing data | ❌ No — documentation only (the agents that produced this report read code; this report itself writes no runtime data) |
| Writes new data | ❌ No |
| Changes meaning of existing data | ❌ No |
| Schema changes | ❌ None |
| Code modified | ❌ None |
| Bindings created | ❌ None |
| Runtime behaviour changed | ❌ None |

---

## TRUST CHECK

| Rule | Verified |
|---|---|
| Every owner cited is an existing service/method, never invented | ✅ Every Port method line cites file:line evidence gathered by direct codebase investigation |
| No capability card claims an executable intent without a confirmed live code path | ✅ `recommend`/`compare`/`search`/`analyse`/`report` are gapped wherever no safe stored read exists |
| Corrections to the existing Developer Capability Registry stubs are evidence-based, not guesses | ✅ Each correction cites the specific file/line that contradicts the prior stub |
| No runtime file touched | ✅ `server/intelligence/capability-registry.ts` and all binding/handler/port files unchanged |
| Open governance decisions are flagged, not silently resolved | ✅ Each card states "OPEN DECISION" inline where a judgement call is required before implementation |

---

## FILES CREATED / MODIFIED

| File | Action |
|---|---|
| `docs/implementation/INT11_CAPABILITY_CARDS_SPECIFICATION.md` | **Created** — this report |
| `docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` | **Modified** — Phase 2 stub entries for profile, household, partners, meals, templates, analyser replaced with the completed cards above |

---

## DEFINITION OF DONE

- [x] Capability Card produced for Profile, Household, Partners, Meals, Templates, Analyser
- [x] Every card follows the INT7A fill-in template structure
- [x] Every field is grounded in direct codebase evidence (file:line), not assumption
- [x] Corrections to prior Developer Capability Registry stubs are explicit and cited
- [x] Open governance decisions are flagged rather than resolved unilaterally
- [x] No code, bindings, schema, or runtime behaviour changed
- [x] Rollback tag created before any file was written
- [x] Developer Capability Registry updated with the completed cards
- [x] One report produced (this document)
