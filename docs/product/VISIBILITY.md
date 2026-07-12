# THA Product Knowledge Registry — VISIBILITY

_The disclosure surface (PKR §18, added by PKR2). "What can a household be told? What is public?" answerable in one read, by a person, without running anything. One truth, four audiences; monotonic and cumulative (Rule PKR23: developer superset admin superset household superset public)._

**This document classifies; it never authorises.** It declares what tier a fact belongs to. It never decides what tier a *user* belongs to — identity and role are resolved exclusively by `server/lib/access.ts` (Rule PKR25). A missing or invalid label fails closed to `developer` and is served to no one (Rule PKR22).

_Generated from `docs/product/inventory/product.yaml` by PDA1 — do not hand-edit. 154 entries: 27 public, 69 household, 51 admin, 7 developer._

### public — 27 entries

Anyone, signed in or not. The Companion answers households most from this tier and the household tier below it.

| id | name | section |
|---|---|---|
| `ben-eat-more-plants` | You eat a wider range of plants | benefits |
| `ben-everyone-fed-safely` | Everyone in the house is accounted for | benefits |
| `ben-know-whats-in-it` | You know what is actually in your food | benefits |
| `ben-week-decided` | The week is decided, once | benefits |
| `gls-apple` | Apple (the Companion) | glossary |
| `gls-basket` | Basket | glossary |
| `gls-glossary` | Product Glossary | glossary |
| `gls-plant-diversity` | Plant Diversity | glossary |
| `gls-simply-better-choices` | Simply Better Choices | glossary |
| `gls-tha-score` | THA Score | glossary |
| `hlp-food-knowledge-modal` | Food knowledge | help |
| `hlp-upf-modal` | What is UPF? | help |
| `mkt-better-choices` | Make Better Choices | marketing-messages |
| `mkt-build-habits` | Build Better Habits | marketing-messages |
| `mkt-ethos` | We don't believe in perfect diets | marketing-messages |
| `mkt-founding-story` | The founding story | marketing-messages |
| `mkt-guided-promise` | When you get there, we'll guide you | marketing-messages |
| `mkt-hero` | Eat better. Without overthinking it. | marketing-messages |
| `mkt-partners-trust` | Every partner has been reviewed | marketing-messages |
| `mkt-scan-understand` | Scan & Understand | marketing-messages |
| `mkt-trial-discount` | 25% off your first 6 months | marketing-messages |
| `ntf-email-password-reset` | Password reset email | notifications |
| `ntf-email-verification` | Verification email | notifications |
| `page-auth` | Sign in | pages |
| `page-landing` | Landing | pages |
| `page-not-found` | Not Found | pages |
| `page-shared-plan` | Shared Plan | pages |

### household — 69 entries

Any signed-in household. Everything public, plus the household-facing product itself.

| id | name | section |
|---|---|---|
| `cap-analyser` | Analyser capability | intelligence-capabilities |
| `cap-companion` | Apple | companion-capabilities |
| `cap-diary` | Diary capability | intelligence-capabilities |
| `cap-household` | Household capability | intelligence-capabilities |
| `cap-meals` | Meals capability | intelligence-capabilities |
| `cap-nutrition-knowledge` | Nutrition & Food Knowledge | knowledge-capabilities |
| `cap-pantry` | Pantry capability | intelligence-capabilities |
| `cap-partners` | Partners capability | intelligence-capabilities |
| `cap-planner` | Planner capability | intelligence-capabilities |
| `cap-profile` | Profile capability | intelligence-capabilities |
| `cap-shopping` | Shopping capability | intelligence-capabilities |
| `dlg-bad-apple` | Highly Ultra-Processed warning | dialogs |
| `dom-analyser` | Analyser | domains |
| `dom-companion` | Apple | domains |
| `dom-cookbook` | Cookbook | domains |
| `dom-diary` | Diary | domains |
| `dom-home` | Home | domains |
| `dom-household` | Household & Profile | domains |
| `dom-nutrition` | Nutrition | domains |
| `dom-pantry` | Pantry | domains |
| `dom-partners` | Partners | domains |
| `dom-planner` | Planner | domains |
| `dom-shopping` | Shopping | domains |
| `hlp-first-visit-hints` | First-visit hints | help |
| `jrn-add-recipe` | Add a recipe | journeys |
| `jrn-analyse-product` | Analyse a product | journeys |
| `jrn-cook-from-plan` | Cook from the plan | journeys |
| `jrn-first-run` | First run | journeys |
| `jrn-plan-week` | Plan the week | journeys |
| `jrn-share-plan` | Share a plan | journeys |
| `jrn-shop` | Shop the plan | journeys |
| `jrn-stock-pantry` | Stock the pantry | journeys |
| `jrn-track-eaten` | Track what we ate | journeys |
| `jrn-understand-nutrition` | Understand our nutrition | journeys |
| `ntf-diversity-milestone` | Plant diversity milestone notice | notifications |
| `ntf-nutrition-trend` | Nutrition trend notice | notifications |
| `ntf-pantry-opportunity` | Pantry opportunity notice | notifications |
| `ntf-planner-gap` | Planner gap notice | notifications |
| `ntf-seasonal-highlight` | Seasonal highlight notice | notifications |
| `ntf-shopping-opportunity` | Shopping opportunity notice | notifications |
| `ntf-site-banner` | Site banner | notifications |
| `ntf-streak-milestone` | Streak milestone notice | notifications |
| `ntf-trial-banner` | Trial banner | notifications |
| `page-analyser` | Analyser | pages |
| `page-basket` | Basket | pages |
| `page-cookbook` | Cookbook | pages |
| `page-dashboard` | Dashboard | pages |
| `page-diary` | My Diary | pages |
| `page-food-detail` | Food | pages |
| `page-home` | Home | pages |
| `page-import-recipe` | Import Recipe | pages |
| `page-meal-detail` | Meal | pages |
| `page-nutrition` | Nutrition | pages |
| `page-onboarding` | Onboarding | pages |
| `page-pantry` | Pantry | pages |
| `page-partners` | Partners | pages |
| `page-planner` | Planner | pages |
| `page-profile` | Profile | pages |
| `page-quick-meal` | Build a Meal | pages |
| `page-shopping-workspace` | Shopping | pages |
| `page-supermarkets` | Supermarkets | pages |
| `routes-map` | Route Map | routes |
| `set-companion-personality` | Companion voice | settings |
| `set-diet-types` | Diet, allergies and exclusions | settings |
| `set-inventory` | Household settings | settings |
| `set-notification-preferences` | Notification preferences | settings |
| `set-subscription-tier` | Subscription tier | settings |
| `wiz-meal-completion` | Meal completion wizard | wizards |
| `wiz-onboarding` | Onboarding wizard | wizards |

### admin — 51 entries

Operators. Everything above, plus admin surfaces, hidden experiences, and positioning. Default tier for Hidden Experiences (Rule PKR29) and Competitive Advantages.

| id | name | section |
|---|---|---|
| `adm-behaviour` | Behaviour Workbench | admin-experiences |
| `adm-benchmark-households` | Benchmark Households | admin-experiences |
| `adm-companion-intelligence` | Companion Intelligence Workbench | admin-experiences |
| `adm-development-world` | Development World Browser | admin-experiences |
| `adm-home` | Admin Hub | admin-experiences |
| `adm-ingredient-products` | THA Picks Curation | admin-experiences |
| `adm-intelligence` | Intelligence Benchmarks | admin-experiences |
| `adm-knowledge-review` | Knowledge Review Workbench | admin-experiences |
| `adm-observations` | Observation Workbench | admin-experiences |
| `adm-recipe-sources` | Recipe Source Governance | admin-experiences |
| `adm-site-banner` | Site Banner | admin-experiences |
| `adm-users` | User Management | admin-experiences |
| `adv-honest-gaps` | THA says "I don't know" | competitive-advantages |
| `adv-household-not-individual` | The unit is the household, not the dieter | competitive-advantages |
| `adv-upf-lens` | Processing, not calories | competitive-advantages |
| `cap-administration` | Administration capability | intelligence-capabilities |
| `dom-admin` | Admin | domains |
| `gls-bad-apple` | Bad Apple | glossary |
| `gls-tha-picks` | THA Picks | glossary |
| `hid-add-meal-gateway` | Add a Recipe gateway dialog (never rendered) | hidden-experiences |
| `hid-analyse-basket` | /analyse-basket (unclickable alias) | hidden-experiences |
| `hid-devworld-prod` | Development World in production | hidden-experiences |
| `hid-dormant-chrome` | Dormant navigation and header components | hidden-experiences |
| `hid-import-recipe` | Import Recipe (bounce stub) | hidden-experiences |
| `hid-list-page` | Quick List page (dead file) | hidden-experiences |
| `hid-notice-engine` | Companion Notice Engine (built, unreachable) | hidden-experiences |
| `hid-quick-meal` | Build a Meal (unlinked) | hidden-experiences |
| `hid-routing-telemetry` | Dormant intent-routing engine | hidden-experiences |
| `hid-scan-confirm-dialog` | Scan Confirm dialog (orphaned) | hidden-experiences |
| `hid-supermarkets` | Supermarkets (unlinked) | hidden-experiences |
| `hlp-gaps` | The questions THA cannot answer about itself | help |
| `int-openai` | OpenAI | integrations |
| `int-openfoodfacts` | Open Food Facts | integrations |
| `int-recipe-sources` | External recipe and price sources | integrations |
| `int-smtp` | SMTP email | integrations |
| `int-tesseract` | Tesseract OCR | integrations |
| `int-usda` | USDA FoodData Central | integrations |
| `int-whisk` | Whisk | integrations |
| `page-admin-behaviour` | Admin — Behaviour Workbench | pages |
| `page-admin-benchmark-households` | Admin — Benchmark Households | pages |
| `page-admin-companion-intelligence` | Admin — Companion Intelligence | pages |
| `page-admin-development-world` | Admin — Development World | pages |
| `page-admin-development-world-household` | Admin — Development World Household | pages |
| `page-admin-home` | Admin Hub | pages |
| `page-admin-ingredient-products` | Admin — THA Picks | pages |
| `page-admin-intelligence` | Admin — Intelligence | pages |
| `page-admin-knowledge-review` | Admin — Knowledge Review | pages |
| `page-admin-observations` | Admin — Observation Workbench | pages |
| `page-admin-recipe-sources` | Admin — Recipe Sources | pages |
| `page-admin-users` | Admin — Users | pages |
| `shot-manifest` | Screenshot baseline manifest | screenshots |

### developer — 7 entries

Everything. Honest gap: THA has no `developer` runtime role today — `users.role` is `user` or `admin`. Developer-tier content is reachable only by reading `docs/product/` directly, and is served to no runtime consumer until such a role exists.

| id | name | section |
|---|---|---|
| `api-surface` | THA API surface | apis |
| `cap-product-knowledge` | Product Knowledge | knowledge-capabilities |
| `dev-benchmark-world` | Benchmark World | developer-experiences |
| `dev-capability-registry` | Runtime Capability Registry | developer-experiences |
| `dev-development-world` | Development World dataset | developer-experiences |
| `dlg-inventory` | Dialog, drawer and sheet inventory | dialogs |
| `int-media-storage` | Local media storage | integrations |

## PKR23 monotonicity — the 39 cross-tier links, reviewed

`verify-product-inventory.ts` warns on every `related` link that points from a lower tier to a higher one, asking a human to confirm the link discloses nothing. All 39 were reviewed by PDA1 and cleared:

- **37 are public/household claims pointing at the household feature they describe** (a marketing message to its planner; a benefit to its domain; a glossary term to its page). Safe by **Rule PKR24 — knowing about a feature is not access to it.** A public visitor learning THA has a planner cannot use it; access is enforced by `hasPremiumAccess()` / `access.ts` at the point of use, never by hiding that a feature exists.
- **`hlp-upf-modal` (public) to `adv-upf-lens` (admin)** — a public help modal references an admin-tier positioning entry. The help content is itself public; the link discloses only that THA frames processing as a differentiator, which the public modal already argues. No gated content is reachable through it.
- **`cap-companion` (household) to `cap-product-knowledge` (developer)** — the Companion capability references the not-yet-registered Product Knowledge capability. `cap-companion`'s own household-visible `cannot` field already states it cannot answer questions about THA itself, so the link discloses nothing new.

None of the 39 is a tier inversion that leaks gated content. They are the registry's natural cross-references, and the architecture warns rather than fails on them precisely so a human confirms — which this section is.
