# The Healthy Apples (THA) — Project Overview & SWOT Analysis

**Generated:** 2026-06-09
**Rollback Point:** `rollback/project-overview-investigation-20260609-202306` → commit `1e83f32`
**Branch:** main
**Investigation type:** Read-only architectural analysis
**Risk level:** GREEN — No application code modified

---

## 1. Executive Summary

The Healthy Apples (THA) is a full-stack web and mobile application that combines AI-assisted meal planning, household dietary management, real-time grocery intelligence, and food science analysis into a single integrated platform. It is designed for UK households seeking to eat more healthily without abandoning the social reality of family cooking — the core product philosophy is "one meal with adaptations" rather than lowest-common-denominator restriction cooking.

The platform is not a recipe aggregator with a shopping list bolted on. It is a reasoning system: every layer from ingredient classification to planner generation involves deterministic rule engines or AI inference to ensure meals are genuinely compliant with each household member's dietary profile, not just labelled as such.

---

## 2. Target Purpose & User Segment

**Primary user:** UK households with mixed dietary requirements — families where one member is Vegetarian, another is Gluten-Free, a child has a nut allergy, and the adults want to track macros. The product is explicitly designed for household plurality, not single-user diet tracking.

**Core jobs-to-be-done:**
1. Plan a week of meals the whole household can eat without separate cooking sessions
2. Shop from that plan with a consolidated, store-optimised shopping list
3. Understand what is in their food (UPF score, additives, allergens, nutrition)
4. Improve their dietary quality over time without prescriptive restriction

**Subscription tiers:** Free / Premium / Friends & Family. Admin users have access to meal library management, product curation, and source control.

---

## 3. System Architecture

### 3.1 Technology Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite |
| Client routing | wouter |
| Server state | @tanstack/react-query |
| UI component system | shadcn/ui (new-york style) + Radix UI primitives |
| Styling | Tailwind CSS + Framer Motion |
| Backend | Node.js + Express.js (TypeScript, ESM) |
| Database | PostgreSQL (via Neon/hosted) |
| ORM | Drizzle ORM + drizzle-kit for migrations |
| Schema validation | Zod (shared across client + server) |
| Authentication | Passport.js (session-based) |
| AI/LLM | Anthropic Claude SDK (`@anthropic-ai/sdk ^0.89.0`) |
| OCR | Tesseract (eng.traineddata bundled) |
| Barcode scanning | @zxing/browser + @zxing/library |
| Email | Nodemailer + Namecheap SMTP |
| Mobile | Capacitor (iOS + Android wrapping) |
| Charts | Recharts |
| Drag and drop | @dnd-kit/core + @dnd-kit/sortable |

**Runtime:** tsx (TypeScript execution without compilation in development). Production build via esbuild through a custom `script/build.ts`.

### 3.2 Repository Structure

```
/
├── client/src/
│   ├── pages/          (23 pages: planner, diary, pantry, profile, admin, etc.)
│   ├── components/     (103 React components)
│   ├── hooks/          (custom React hooks: use-smart-suggest, use-planner-scan, etc.)
│   ├── contexts/       (PlannerContext)
│   └── lib/            (shared constants, planner-types, shared-options)
│
├── server/
│   ├── lib/            (30+ service modules — the core engine)
│   ├── routes.ts       (10,107-line API definition — single-file, all routes)
│   ├── storage.ts      (database access layer)
│   ├── auth.ts         (Passport authentication)
│   ├── seeds/          (data seed scripts)
│   ├── tests/          (unit/integration test scripts)
│   └── migrations/     (schema migration runner)
│
├── shared/
│   ├── schema.ts       (Drizzle table definitions + Zod schemas — single source of truth)
│   └── restrictions/   (restriction resolver, restriction types)
│
└── migrations/         (Drizzle migration journal)
```

### 3.3 Core Data Model

The schema (`shared/schema.ts`) defines the following principal tables:

| Table | Purpose |
|---|---|
| `users` | Auth + profile: diet pattern, diet restrictions, subscription tier, role, health goals, calorie targets |
| `user_preferences` | Extended preferences: budget, stores, UPF sensitivity, household settings |
| `meals` | User meal library: ingredients, instructions, nutrition, diet tags, format, kind, variant flags |
| `meal_templates` | Component meal shells: shared base, protein/carb/veg/topping/sauce slots, compatible diets, timing, cost band |
| `meal_plans` | Named weekly meal plans per user |
| `meal_plan_entries` | Day + slot assignments within a plan |
| `households` | Household group record |
| `household_members` | User membership in a household |
| `household_eaters` | Per-member dietary profile: hard restrictions, diet types, excluded/preferred ingredients |
| `planner_week_eater_overrides` | Per-week per-eater planner overrides |
| `shopping_list_items` | Line items with normalised ingredient, unit, quantity, store assignment |
| `food_diary_entries` | Daily nutrition log (4 meal slots per day) |
| `pantry_items` | Larder/fridge/freezer items |
| `ingredient_swaps` | Curated swap rules (original → replacement, goal-tagged) |
| `uplift_rules` | Nutrition uplift suggestions (reviewed, zero-AI, deterministic) |
| `additives` | Additive database for E-number detection and risk scoring |
| `meal_pairings` | Admin-curated meal companion suggestions |
| `ingredient_products` | THA-curated preferred products per normalised ingredient key |

### 3.4 API Surface

All API routes are defined in `server/routes.ts` (10,107 lines). The surface spans:

- `/api/profile` — user profile CRUD
- `/api/meals/*` — meal library CRUD, image generation, ingredient analysis
- `/api/meal-plans/*` — plan management, smart suggestion, auto-import
- `/api/smart-suggest/*` — smart suggest with auto-import pipeline
- `/api/shopping-list/*` — list management, price lookup, supermarket basket creation
- `/api/nutrition/*` — per-meal and bulk nutrition endpoints
- `/api/search/*` — product search, recipe search (multi-source)
- `/api/import/*` — recipe import from URL, text, image OCR
- `/api/diary/*` — food diary CRUD, wellbeing metrics
- `/api/pantry/*` — pantry management
- `/api/household/*` — household and member management
- `/api/admin/*` — user management, recipe source controls
- `/api/meal-templates/*` — component meal template management

---

## 4. Core Engine Mechanics

### 4.1 Smart Planner (`smart-suggest-service.ts`)

The Smart Planner generates a 7-day meal plan using a multi-tier candidate selection algorithm:

**Tier 1 — Local library (user-owned meals):** Filters the user's meal library using the shared `dietRules.ts` engine (case-insensitive substring exclusion against ingredient text). Premium and subscriber-only meals are blocked from the candidate pool.

**Tier 2 — External API backfill:** When local candidates are insufficient, external recipe APIs (TheMealDB, Spoonacular) are queried using a dietary search prefix derived from the user's profile. Results are enriched and injected into the candidate pool.

**Tier 3 — Controlled repeat fallback:** When a slot has no candidates after Tier 1 and Tier 2, a compliant meal from earlier in the week is repeated in a controlled manner rather than leaving a slot empty.

**Tier 4 — Component meal shell recovery (in development):** When all tiers return zero candidates for a slot (typically for multi-restriction households like Vegetarian + Gluten-Free + Dairy-Free + Egg-Free), a component meal template is deployed. The template's shared base is safe for all household members; protein, carb, and topping slots are filtered per member using `scoreTemplate()`.

Candidate scoring (`meal-scoring-service.ts`) evaluates: dietary match, budget fit, UPF sensitivity, calorie proximity, cuisine preference, and ingredient reuse across the week.

### 4.2 Diet Rules Engine (`dietRules.ts`)

A deterministic, zero-AI keyword exclusion system used as the single source of truth for dietary compliance across the entire platform (smart suggest, recipe search, planner compliance gate, ingredient swap engine).

Key dictionaries:
- `GLUTEN_KEYWORDS` — 22 entries covering wheat, bread, pasta, soy sauce, hoisin
- `DAIRY_KEYWORDS` — 30 entries covering milk, cream, cheese, yogurt, ghee, casein
- `MEAT_KEYWORDS` — 30+ entries covering all common meats, sausages, lard
- `FISH_SEAFOOD_KEYWORDS` — 35+ entries
- `KETO_EXCLUDE` / `LOW_CARB_EXCLUDE` — built from 10 sub-dictionaries (sugars, bakery, grains, legumes, starchy veg, high-sugar fruit, processed carbs)
- `DISH_NAME_MEAT_OR_SEAFOOD` — title-level blocklist for recipes without ingredient lists

The engine also implements `shouldExcludeRecipe()` — a single gating function consumed by both the planner and recipe search routes.

### 4.3 UPF & Additive Analysis (`upf-analysis-service.ts`, `product-analysis.ts`)

THA implements its own Ultra-Processed Food scoring system independent of standard NOVA classification:

- **E-number pattern matching** against a seeded additives database, with per-additive risk level (low/moderate/high) and type-based risk scoring (colouring = 3, flavour enhancer = 3, preservative = 2, etc.)
- **Processing indicator detection** via keyword matching against ingredient lists
- **Regulatory additive tagging** (e.g. UK flour fortification requirements) — counted separately to avoid penalising legally required additives
- **THA Apple Rating** (1–5 apples) derived from UPF score, additive count, and ingredient complexity
- **NOVA classification** as a reference layer alongside the proprietary score

### 4.4 Household Meal Matcher (`household-meal-matcher.ts`)

The `matchMealsForHousehold()` function scores component meal templates against the full household dietary profile using a weighted multi-dimension model:

| Dimension | Weight | What it measures |
|---|---|---|
| Compatibility | 25% | Fraction of members with no diet conflicts in the template |
| Shared base | 20% | Size and universality of the shared ingredient base |
| Swap simplicity | 15% | Complexity of per-member ingredient swaps required |
| Time fit | 10% | Whether cook time is within household's `maxTotalCookTime` |
| Cost fit | 10% | Whether cost band matches household's `budgetLevel` |
| Health alignment | 10% | Alignment with household health goals |
| Preference confidence | 10% | Match against preferred/excluded ingredient signals |

The function reads household eaters from `household_eaters` table and applies `getEffectiveDietProfile()` per member before scoring. As of commit `1e83f32`, this function has been migrated to use `household_eaters` (previously only `user_preferences` was consulted — household members without user accounts were invisible).

### 4.5 Nutrition Uplift Engine (`uplift-engine.ts`)

A deterministic, zero-AI, zero-DB-write suggestion engine that identifies nutritional improvement opportunities within a planned week:

- Reverse-indexed by ingredient token, meal name token, category, and slot
- Only reviewed rules are indexed (approval gate via `reviewedAt` field)
- Sub-30ms evaluation target for normal weekly payloads
- Each suggestion traces back to an explicit rule with full explainability

### 4.6 Recipe Import Pipeline

Multi-source recipe import with three entry points:
1. **URL import** — HTTP fetch + Cheerio HTML parsing + JSON-LD extraction + regex heuristics
2. **Text import** — regex/heuristic parser for photographed recipe cards
3. **Image/OCR import** — Tesseract OCR → text parser → optional GPT-4o-mini quality upgrade

Imported recipes are normalised through `ingredient-normalization-service.ts` (canonical registry, gram/ml internal storage, density-based unit consolidation) before entering the user's meal library.

### 4.7 Recipe Swap Engine (`recipe-swap-engine.ts`)

Goal-tagged rule tables (Vegetarian, Keto, lower-cost, less-processed, household, under-time) map ingredient keywords to replacements. The engine applies rules in priority order, returning structured `ChangedIngredient[]` with reason strings for explainability. Household-specific swaps are assembled from `household_eaters.excludedIngredients` and the shared `ingredient_swaps` table.

### 4.8 Ingredient Normalisation & Product Intelligence

- **Canonical registry** (`productCanonicaliser.ts`): Maps raw ingredient text to canonical keys for consistent display and cross-recipe ingredient reuse
- **SMP Rating** (THA Apple Score): Per-product 1–5 rating derived from additive analysis, UPF score, and processing indicators — used to surface "THA Picks" in the shopping basket
- **Whole-food recognition** (`smp-rating-service.ts`): Maintains a 200+ entry whole-food set to ensure fresh produce always receives maximum apple ratings without running through the additive pipeline
- **Price intelligence**: Spoonacular product matching + OpenFoodFacts fallback, with per-item store selection and a price tier preference system (budget/standard/premium)

---

## 5. Key Differentiators

The following properties separate THA from standard recipe-aggregation + shopping-list applications:

### 5.1 Household-First Architecture

Most food planning applications are single-user: one profile, one set of restrictions, one diet. THA's data model centres on the `household` as the unit of planning. The `household_eaters` table records per-member dietary profiles independently of whether the member has a THA account (children, guests, and non-user household members are first-class eaters). Every planner, every template score, and every shopping list is computed against the aggregate household dietary profile — not just the logged-in user's preferences.

### 5.2 "One Meal with Adaptations" Component Shell Architecture

Rather than finding a recipe that everyone can eat unchanged (which forces the household toward the intersection of all restrictions), THA introduces component meal templates: shells with a universally safe shared base and per-member variable slots. A household with a Gluten-Free member, a Keto member, and an omnivore can all eat Fajita Night from the same pan — shared peppers and spiced protein, different carb carriers (corn tortilla / lettuce cup / flour tortilla). This is architecturally distinct from any recipe recommender system in the consumer food app market.

### 5.3 Deterministic Dietary Compliance Engine

The `dietRules.ts` engine is the single source of truth for dietary exclusions across the entire platform — smart suggest, recipe search, planner compliance gate, ingredient swap engine, and household meal scorer all consume the same keyword dictionaries. This prevents compliance drift between product surfaces (a recipe that passes the search filter cannot fail the planner compliance gate for the same diet). The engine operates in sub-millisecond time with zero AI inference, providing auditable, reproducible safety guarantees for allergen-adjacent restrictions.

### 5.4 Proprietary UPF Scoring

The standard academic approach to Ultra-Processed Food classification (NOVA groups 1–4) is a coarse category label, not a gradient score. THA computes a continuous UPF score from: additive count × risk level, processing indicator density, and ingredient complexity. The THA Apple Rating (1–5) makes this score actionable for consumers without requiring them to understand NOVA. Regulatory additives (e.g. UK flour fortification) are tagged and reported separately, preventing legally mandated fortification from penalising nutritionally sound products.

### 5.5 Transparent AI with Explainability Layer

AI features (recipe image generation, OCR quality upgrade, smart suggestion explanations) are always accompanied by structured explainability output from `explainability-service.ts`. Every Smart Planner suggestion includes a human-readable explanation of why that meal was selected for that household on that day. AI is used for content generation and quality upgrade, not for safety-critical dietary compliance decisions — those remain deterministic.

### 5.6 Tier-Based Recipe Source Governance

An admin-controlled recipe source gate (`recipe-source-gate.ts`) governs which external recipe APIs are active, which credentials are available, and whether premium/subscriber-only recipes can enter the planner candidate pool. Premium recipes are explicitly blocked from the Smart Planner (preventing the planner from recommending meals a free-tier user cannot access). This is a commercial architecture concern that most OSS meal planners do not model.

### 5.7 Full-Stack Type Safety via Shared Schema

`shared/schema.ts` exports both Drizzle table definitions and Zod validation schemas. Client forms, API request validation, and database access all consume types derived from the same single file. This eliminates the client/server type drift that causes subtle data corruption bugs in applications where the frontend and backend evolve independently.

### 5.8 Nutrition Uplift Without AI Dependency

The Uplift Engine provides actionable nutrition improvement suggestions (e.g. "swap white rice for quinoa in Thursday's grain bowl — adds 6g protein") without making any AI calls. All rules are human-reviewed before indexing, all outputs trace back to explicit rules, and the engine has no external I/O. This is a deliberate architectural choice to ensure uplift suggestions are explainable, auditable, and available regardless of AI API availability or cost.

---

## 6. SWOT Analysis

### 6.1 Strengths

**S1 — Household dietary model is architecturally differentiated**
The `household_eaters` table and the multi-member scoring pipeline in `household-meal-matcher.ts` represent genuine IP. No consumer meal planning application in the UK market models per-member dietary profiles with independent slot-level filtering for non-account-holding household members (children, guests). The component meal shell architecture ("one meal with adaptations") is a product and technical moat.

**S2 — Deterministic compliance engine prevents safety regressions**
Using `dietRules.ts` as a single source of truth across all surfaces means dietary compliance cannot silently degrade as features are added. A keyword added to `GLUTEN_KEYWORDS` automatically propagates to recipe search, smart suggest, planner compliance, and the household matcher simultaneously. This is the correct architecture for an application where dietary safety has consumer trust implications.

**S3 — Proprietary food scoring stack**
The combination of E-number database, processing indicator detection, regulatory additive separation, and the THA Apple Rating gives THA a food science credibility layer that generic recipe apps cannot replicate from public APIs. OpenFoodFacts + Spoonacular provide commodity data; the scoring layer is THA's own.

**S4 — Full-stack type safety**
Shared Zod/Drizzle schemas eliminate client-server type drift. The `release:check` script enforces typecheck + test + build before any release. The schema-vs-migrations audit rule (every schema column must have a corresponding migration) prevents silent schema drift in production.

**S5 — Mobile delivery via Capacitor**
The Capacitor iOS/Android wrapper means THA ships a native app experience from a single React codebase. Camera access (barcode scanning, OCR recipe import) is available natively. This is significant for a food app where in-store scanning and recipe photography are core use cases.

**S6 — Explainability-first AI integration**
AI inference is used only for content enhancement (recipe OCR, image generation, plan explanations) — not for safety-critical dietary compliance. Every AI output is accompanied by human-readable reasoning. This prevents the "black box" trust problem that plagues AI-driven health applications.

---

### 6.2 Weaknesses

**W1 — routes.ts monolith (10,107 lines)**
All API route handlers are defined in a single file with no modular decomposition. As the surface grows, this file becomes increasingly difficult to navigate, test, and maintain. There is no route-level middleware isolation, no separation of authentication middleware from business logic, and no consistent error-handling pattern across routes. This is the single largest structural debt item in the codebase.

**W2 — `matchMealsForHousehold()` is unconnected to any route**
The household meal matcher — one of THA's primary architectural differentiators — is confirmed dead code as of the current branch. It cannot serve any household until a Tier-4 planner path wires it to the smart suggest pipeline. The component meal shell architecture is built but not deployed.

**W3 — Smart Planner candidate pool depth for restricted households**
The live candidate pool trace confirms: 0 Vegan breakfast candidates, 2 Keto breakfast candidates from a 206-meal library. Until the component meal shell recovery (Tier-4) is wired, households with compound restrictions (Vegetarian + GF + DF + EF) will receive empty breakfast slots in their generated plans. This is a quality-of-service failure for THA's most differentiated user segment.

**W4 — `compatibleDiets` case normalisation inconsistency**
Live validation identified a case mismatch between `user_preferences.diet_types` (stored lowercase: "gluten-free") and `household_eaters.hardRestrictions` (stored title-case: "Gluten-Free"). The `scoreTemplate()` function uses exact equality matching. This silently degrades compatibility scoring for adult household members whose diet types are stored via the `user_preferences` path. No automated validation catches this at seed time.

**W5 — Vegetarian protein slot exclusion gap (Issue 2)**
The substring matcher cannot exclude "pork sausages" from Vegetarian members' slot options because "vegetarian" is not a substring of "pork sausages". Meat proteins in component meal shells are offered to all members regardless of vegetarian restriction until a diet-pattern-aware slot filter is implemented. This is a compliance gap specifically for the component meal architecture.

**W6 — Test coverage is script-based, not framework-based**
The `server/tests/` directory contains 30+ test scripts executed via `tsx`. There is no test runner (Jest/Vitest), no coverage reporting, no snapshot testing, and no CI-enforced test gate beyond `npm run test` running a curated subset of scripts. Frontend code has no test coverage at all. Regressions in route handlers or scoring logic may not surface until manual QA.

**W7 — Single-file storage layer**
`server/storage.ts` contains all database access functions in a single file. Combined with the routes.ts monolith, the entire backend has two large files with no domain separation. This makes onboarding new engineers difficult and increases the risk of cross-domain side effects when modifying shared query patterns.

---

### 6.3 Opportunities

**O1 — Tier-4 component meal recovery — immediate revenue protection**
Wiring `matchMealsForHousehold()` into the smart suggest pipeline as Tier-4 recovery directly addresses the largest quality-of-service gap for restricted households. This is the highest-leverage near-term engineering investment: the scoring engine is built, the templates are being seeded, and the candidate pool gap is documented. Closing this gap enables THA to market confidently to Vegan, Gluten-Free, and multi-restriction households — the fastest-growing segment in UK food retail.

**O2 — Household adaptability as a marketing differentiator**
The "one meal with adaptations" model is not only architecturally differentiated — it is a marketable value proposition that directly addresses the pain point of households who currently cook separate meals. No competing UK consumer meal planning application (Gousto, HelloFresh, BBC Good Food planner) models per-member dietary adaptation from a shared base. THA has a genuine category-creating feature.

**O3 — UPF awareness as a cultural tailwind**
UK media and government focus on Ultra-Processed Food is accelerating (NOVA classification in NHS guidance, parliamentary questions on UPF in school meals). THA's proprietary UPF scoring and THA Apple Rating are positioned to benefit from this awareness cycle. The Uplift Engine provides actionable suggestions that translate UPF awareness into behaviour change — a gap no current consumer app fills.

**O4 — Grocery API partnership**
The supermarket basket creation feature (Tesco, Sainsbury's, etc.) is a direct commercial integration opportunity. A formal API partnership with a major UK grocer would enable live price data, basket submission, and potentially affiliate commission on completed shopping — the most direct monetisation path beyond subscriptions.

**O5 — B2B2C — healthcare and employer wellness**
The household dietary compliance engine, explainability layer, and nutrition uplift system have direct applications in corporate wellness programmes, NHS digital health pathways, and private healthcare plans. A white-label or API-accessible version of the compliance engine could serve dietitians, GPs, and health coaches as a decision-support tool.

**O6 — AI meal creation from pantry state**
The pantry system (`pantry_items`) records what food is in the household's larder, fridge, and freezer. An AI-assisted "what can I cook tonight?" feature that generates meal suggestions from pantry inventory + household dietary profiles is a natural extension of the existing architecture. The `smart-meal-creation-engine.ts` module already exists as a foundation.

---

### 6.4 Threats

**T1 — Well-capitalised recipe platform entry**
BBC Good Food, Yummly (acquired by Whirlpool), and international platforms (Mealime, PlateJoy) have existing user bases and brand recognition. If any of these platforms add household dietary profile modelling to their existing content libraries, THA's technical moat narrows. The component meal shell architecture is THA's most defensible differentiation — it must ship before competitors replicate the surface-level feature.

**T2 — LLM API cost and availability dependency**
Recipe image generation, OCR quality upgrades, and smart plan explanations depend on the Anthropic Claude API. Cost at scale, rate limits, and API deprecation cycles are external risks. The current architecture correctly isolates AI calls from safety-critical paths, but feature velocity depends on API cost remaining economically viable as user volume grows.

**T3 — OpenFoodFacts data quality**
The grocery product database, nutrition data, and additive information depend significantly on OpenFoodFacts, a community-maintained dataset with inconsistent coverage of UK-specific products. False negatives in allergen detection (a product that contains an allergen but is not tagged in OpenFoodFacts) represent consumer safety and regulatory risk. The additive database is THA-seeded, but the ingredient list data it runs against is only as reliable as the source product entry.

**T4 — UK food labelling regulation change**
The UK Food Standards Agency periodically updates allergen labelling requirements (Natasha's Law 2021 being the most recent major change). A regulatory update that changes how allergens are declared could require significant updates to the `dietRules.ts` engine and the allergen detection pipeline. The deterministic architecture is well-positioned to adapt, but compliance auditing on every regulatory update is an ongoing operational cost.

**T5 — Mobile platform policy risk**
The Capacitor-wrapped native app is subject to App Store and Google Play review policies. A policy update affecting health or food apps (e.g. tighter restrictions on nutrition claims, required disclaimers for dietary advice) could delay releases or require feature modifications. The PWA fallback provides some resilience, but camera-dependent features (barcode scan, OCR import) require native permissions.

**T6 — routes.ts monolith as a scaling bottleneck**
The 10,107-line single-file route definition is already at the upper bound of maintainability for a team of more than two engineers. As feature velocity increases, merge conflicts in this file will become the primary source of engineering friction. If THA scales its engineering team before this is refactored, onboarding cost and defect rate will increase non-linearly.

---

## 7. Architecture Diagram (Logical)

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT (React)                       │
│  Pages: Planner │ Diary │ Pantry │ Profile │ Shop │ Admin │
│  State: @tanstack/react-query                             │
│  Design: shadcn/ui + Tailwind + Framer Motion             │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP / REST API
┌──────────────────────────▼──────────────────────────────┐
│                EXPRESS SERVER (Node.js)                   │
│                                                           │
│  routes.ts (10,107 lines — all routes)                    │
│  auth.ts (Passport session)                               │
│                                                           │
│  ┌─────────────────────────────────────────────────┐     │
│  │                  CORE ENGINES                    │     │
│  │  smart-suggest-service  │  household-meal-matcher│     │
│  │  dietRules              │  recipe-swap-engine    │     │
│  │  uplift-engine          │  meal-scoring-service  │     │
│  │  upf-analysis-service   │  explainability-service│     │
│  │  ingredient-normaliser  │  smp-rating-service    │     │
│  └──────────────┬──────────────────────────────────┘     │
│                 │                                         │
│  ┌──────────────▼──────────────────────────────────┐     │
│  │            DATA LAYER (storage.ts)               │     │
│  │            Drizzle ORM                           │     │
│  └──────────────┬──────────────────────────────────┘     │
└─────────────────┼───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                    POSTGRESQL DATABASE                    │
│  users │ meals │ meal_templates │ households             │
│  household_eaters │ shopping_list_items │ food_diary     │
│  pantry_items │ uplift_rules │ additives │ ingredient_swaps│
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                  EXTERNAL SERVICES                        │
│  Anthropic Claude API  │  OpenFoodFacts API              │
│  Spoonacular API       │  TheMealDB API                  │
│  Namecheap SMTP        │  Google Fonts                   │
└─────────────────────────────────────────────────────────┘
```

---

*Investigation complete. No application code modified. No schema changed.*
