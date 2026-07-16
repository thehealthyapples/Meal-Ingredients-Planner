# PDA1 — Platform Discovery & Experience Audit

**Investigation.** Point-in-time analysis, 2026-07-11. Owner: Colin Clapson.
**Status:** Complete.
**Governing architecture:** [`THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`](../../architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md),
under [`PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`](../../architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md) §9,
[`THA_EXPERIENCE_ARCHITECTURE.md`](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md),
[`THA_UI_ARCHITECTURE.md`](../../architecture/THA_UI_ARCHITECTURE.md).

> **This document discovers; it does not own.** Under Rule PKR3, an investigation
> populates the registry but never becomes it. Every _fact_ PDA1 discovered about
> what THA **is** now lives in the [Product Knowledge Registry](../../product/) as a
> present-tense, owned, correctable entry. This report keeps only what the registry
> does not: the **narrative of the discovery**, the **method**, and the **31 audit
> findings** — the things that are _wrong_, which the registry cites by id but does
> not house, because the registry records what _is_. This file is history the moment
> it is written and will never be edited (Rule PKR3); the registry is corrected
> forever (Rule PKR15).

---

## 1. Mandate

PDA1 was asked to discover The Healthy Apples end to end — every surface, journey,
capability, integration, claim and hidden corner — and to **populate the Product
Knowledge Registry** that `PKR1`–`PKR3` had defined but deliberately left empty
(`docs/product/` did not exist). Alongside the registry it was to produce a
screenshot baseline, machine-readable inventory, this report, and a prioritised UX
transformation roadmap. **PDA1 implements no product change**; it discovers,
records, and recommends.

## 2. What PDA1 produced

| Deliverable | Where | Shape |
|---|---|---|
| **Product Knowledge Registry** | [`docs/product/`](../../product/) | 154 prose entries across all 28 canonical sections, each owned and dated |
| **Machine-readable inventory** | [`product.yaml`](../../product/inventory/product.yaml) → [`product.json`](../../product/inventory/product.json) | 154 records; YAML authored, JSON generated (Rule PKR17) |
| **Screenshot baseline** | [`docs/product/assets/screenshots/`](../../product/assets/screenshots/) | 18 surfaces, real capture against a live demo household |
| **Navigation surfaces** | [`README`](../../product/README.md) · [`OWNERS`](../../product/OWNERS.md) · [`VISIBILITY`](../../product/VISIBILITY.md) | index, ownership table, disclosure table |
| **This investigation report** | this file | narrative, method, 31 findings |
| **UX transformation roadmap** | [`PDA1_UX_TRANSFORMATION_ROADMAP.md`](./PDA1_UX_TRANSFORMATION_ROADMAP.md) | findings prioritised by household impact |

The registry is **internally true**: `scripts/verify-product-inventory.ts` asserts
the prose↔inventory bijection (Rule PKR11), a named owner on every entry (PKR12), a
valid fail-closed visibility on every entry (PKR22), and substantiation or a stated
gap on every claim (§8s20). It passes with zero failures.

## 3. Method

Discovery worked from the code outward, never from memory:

1. **Routing spine.** `client/src/App.tsx` gives the true set of pages, aliases and
   redirects — the skeleton every Pages/Routes entry hangs on.
2. **Surface read.** Each page, dialog, wizard, notification and integration entry
   was written against the source file it cites, not a description of it. Where a
   record and the code disagreed, the **code won** (Rule PKR15) and the divergence
   became a finding or a registry correction.
3. **Reachability sweep.** Every routed page and built component was checked for
   inbound links. The surfaces with none became the **Hidden Experiences** section —
   the reason the registry exists.
4. **Claim substantiation.** Every marketing message, benefit and competitive
   advantage was traced to the product truth that backs it. Three claims outran the
   product and are recorded with an honest `substantiation_gap`; one brand-narrative
   claim is marked as unfalsifiable-by-design.
5. **Screenshot baseline.** A live dev server and a real demo household
   (`POST /api/demo/start`) were driven with Playwright to capture one canonical
   image per household- and public-facing surface. (See §6 — this overturned an
   inherited assumption.)
6. **Adversarial verification.** Every security-shaped and reachability-shaped
   finding was confirmed by a second independent read before being recorded. No
   finding rests on a single pass.

## 4. What THA is — the discovery in one page

THA is a **household** food platform — the unit is the table, not the dieter — built
around six things a household does: **plan** the week, keep a **cookbook**, **shop**
the plan, track a **pantry**, keep a light **diary**, and **analyse** any packaged
product for how processed it is. A companion named **Apple** sits over all of it,
answering from what THA actually knows and refusing to guess. An **admin** world of
twelve workbenches curates knowledge and watches the intelligence platform.

The platform is **larger than it appears from the outside**, and that gap is the
single most important thing PDA1 found. THA has built, to completion, a great deal
that no household can reach: a proactive **notice engine** (the entire reason Home
has a "Reminders" section), a **quick meal-builder**, a **supermarket directory**, a
five-way **"add a recipe" chooser**, an alternate **shopping surface**, and four
**navigation chrome** components. Eleven finished surfaces link to nothing. The
product a household experiences is a strict subset of the product that exists.

The other recurring shape is **naming drift**. The same concept wears different
names across surfaces — the 1–5 apple rating is called five things (one of which,
"Health Score", is a _different_ 0–100 number); the basket is called Basket,
Shopping, Shopping List and List across five routes; plant diversity is "Plants
enjoyed", "Nutrition", and `/plant-diversity` depending where you stand. None of
this is broken code. All of it is a household being spoken to in more than one
dialect by a product that means one thing.

## 5. The registry, by the numbers

154 entries: **27 public · 69 household · 51 admin · 7 developer**. The largest
sections are Pages (34), Admin & Hidden Experiences (23 together), Notifications
(11), Intelligence Capabilities (10), Journeys (10). Every entry names Colin Clapson
as owner today; ownership will follow the product as it grows (§9.2). The full
ownership table is [`OWNERS.md`](../../product/OWNERS.md); the disclosure table,
including the review of all 39 cross-tier links, is [`VISIBILITY.md`](../../product/VISIBILITY.md).

## 6. The screenshot baseline — an inherited assumption, overturned

The registry inherited a claim that **no browser could run in this environment**, and
on that basis a screenshot baseline had been _specified_ but not _captured_. PDA1
tested the claim rather than accepting it. It was false. The environment ships
chromium (`chrome-headless-shell`); it failed only for missing system shared
libraries, and every one of those libraries is present in the Nix store. Placing
them on `LD_LIBRARY_PATH` — **excluding the glibc core**, which must stay the
system's — lets chromium launch and screenshot cleanly. The baseline is real: 18
surfaces, captured against a live demo household, reproducible via
[`scripts/capture-product-screenshots.ts`](../../../scripts/capture-product-screenshots.ts).
The finding `fnd-no-screenshot-baseline` was **downgraded** accordingly — from "no
baseline exists" to "the admin/developer tiers are not yet captured." This is the
audit doing its job on its own inherited state: reality is right, and the entry was
corrected (Rule PKR15).

---

## 7. Findings

31 findings, each carrying a stable `fnd-*` id that registry entries cite. Severity
is graded by **household impact** — what it costs the person using THA — not by
engineering effort. Every finding was confirmed against source; security and
reachability findings were confirmed twice.

### P0 — Safety: the household is told more than it is defended

| id | Surface | What is wrong (evidence) | Household impact |
|---|---|---|---|
| `fnd-unprotected-admin-endpoints` | API | Three `/api/admin/*` maintenance routes carry a no-op `(req,res,next)=>next()` where an admin guard belongs and run bulk data mutations, tolerating an anonymous caller (`req.user?.id ?? 0`): `routes.ts:10740` backfill-classifications, `:10758` normalise-categories, `:10771` backfill-ambiguous-categories. | Anyone on the internet can trigger heavy, data-rewriting jobs over `shopping_list` items. Confirmed twice. |
| `fnd-public-template-writes` | API | Five meal-template write routes have no `isAuthenticated` check and no guard; the only `/api` middleware passes anonymous requests through: `routes.ts:5085` POST, `:5097` PATCH, `:5115` DELETE templates, `:5135` POST products, `:5147` DELETE template-products. | An unauthenticated caller can create, edit and delete global meal templates. Confirmed twice. |

### P1 — Broken core journeys and unkept promises

| id | Surface | What is wrong (evidence) | Household impact |
|---|---|---|---|
| `fnd-dead-reminders` | Home | Client fetches `/api/intelligence/companion/observations` (`use-companion-observations.ts:30`); server only serves `/api/intelligence/companion/notices` (`routes.ts:11540`). Every fetch 404s. Second mismatch: even aligned, payload keys disagree (`{notices,trust}` vs `{observations}`). | Home's entire Reminders section — the whole reason it exists — silently renders empty. A complete notice engine reaches no one. |
| `fnd-cooked-never-reaches-diary` | Planner→Diary | `toggleCooked` writes only to `localStorage` `planner:cooked-entries` (`weekly-planner-page.tsx:1573`); no diary endpoint is ever called. | Marking a meal cooked looks like it records the meal — it reaches the Diary never. The journey stops at a tick. |
| `fnd-broken-shopping-link` | Shopping | The workspace "Basket" menu item links to `/shopping` (`shopping-workspace-page.tsx:2147`), a route absent from `App.tsx` → falls through to Not Found. | A primary navigation control dead-ends on a 404. |
| `fnd-no-product-knowledge-capability` | Companion | No `product-knowledge` capability is registered in `capability-registry.ts` (23 are: planner…administration, developer). | The Companion cannot answer a single question about THA itself. |
| `fnd-premium-unenforced` | Subscriptions | `hasPremiumAccess()` (`access.ts:16`) is real and gates template/sharing features, but the three headline free-tier caps are stubbed `TODO [PREMIUM]` with no check: meals >3 (`routes.ts:845`), analyses limit (`routes.ts:3216`), planner >2 days/week (`routes.ts:5857`). | The free/premium line the product advertises is largely cosmetic; the caps that would motivate upgrade are not enforced. |
| `fnd-no-upgrade-path` | Subscriptions | Profile subscription row shows a Free/Premium badge with no upgrade control anywhere; tier is changeable only by an admin. `TrialBanner` offers 25% off with no pricing page and nothing to buy. | A household that wants to pay cannot. The trial's discount points at a door that does not exist. |
| `fnd-unfulfilled-guidance-promise` | Onboarding→everywhere | Onboarding's final step promises THA will guide the household on arrival; it stores `tha_preferred_start_area`, which no file reads. The only guidance shipped is `FirstVisitHint` — one dismissible sentence on six surfaces. | A promise made at the most hopeful moment of the product is never kept. |
| `fnd-shopping-duplicate` | Shopping | Two live shopping pages both render the basket — `shopping-workspace-page.tsx` and `shopping-list-page.tsx` — reachable across five routes. | Two different shopping experiences for one basket; whichever a household lands on, the other is unmaintained. |

### P2 — Confusion, drift, and journeys that stop one step short

| id | Surface | What is wrong (evidence) | Household impact |
|---|---|---|---|
| `fnd-score-name-collision` | Analyser/global | The 1–5 apple rating is called five things — "THA Score", "Apple Score", "Apple Rating"/"Min Apple Rating", casing-drift "THA score" — and "Health Score"/"THA Health Score" is a *different* 0–100 number (`routes.ts:1650` = `100 - thaRating*20`). | The household's central quality signal means two different things under five names. |
| `fnd-two-apples` | Components | Two rating components coexist: `components/AppleRating.tsx` (labelled, clamps 1–5) and `components/ui/apple-rating.tsx` (unlabelled, clamps 0–5). | The same score renders two ways with two ranges depending on the surface. |
| `fnd-shared-plan-intent-lost` | Share a plan | Import posts only `{scope:"all",mode:"keep"}` (`shared-plan-page.tsx:115`); the plan's own name/description/season and any sharer rationale are dropped. | A shared week arrives stripped of the context that made it worth sharing. |
| `fnd-onboarding-not-resumable` | Onboarding | Step lives only in component `useState(0)` (`onboarding-page.tsx:255`); progress is committed only on completion (`:330`). | A household interrupted during the 12-step first run restarts from zero. |
| `fnd-import-not-resumable` | Add a recipe | All import state is component-local `useState` (`meals-page.tsx:5641,5880,6086`); no persistence. | Leaving a half-finished import — the slowest step in the cookbook — loses it entirely. |
| `fnd-observation-as-modal` | Analyser/Shopping | The Highly-UPF warning is a blocking modal (`shopping-list-page.tsx:838`, fires `thaRating<=1` OR `nova===4 && additives>5`). | An observation interrupts the household with a wall instead of informing them calmly inline — against the Experience Architecture's "calm before capability." |
| `fnd-food-detail-back` | Food detail | The "Back" link is hardcoded to `/cookbook` (`food-detail-page.tsx:102`), not browser history. | A household arriving at a food from anywhere is always ejected to the Cookbook. |
| `fnd-food-detail-chrome` | Food detail | The page never renders `WorkspaceHeader` (unlike `meal-detail-page.tsx:479`); the bottom nav *is* present. | The food page loses its header chrome, reading as a different, lesser surface. (PARTIAL — nav is intact.) |
| `fnd-derived-today` | Home | "Today's meals" is recomputed client-side from `new Date().getDay()` against a localStorage active-week (`home-experience-page.tsx:110-129`); the code's own comment notes "'today' is derived, not queried." | Home's sense of *today* drifts if the mirrored active-week does — the calmest surface rests on the most fragile derivation. |
| `fnd-home-dashboard-rivalry` | Home vs Dashboard | `/home` and `/dashboard` both show today/shopping/plant stats (`home-experience-page.tsx:169`, `dashboard.tsx:345`); only `/home` is in the bottom nav, but `/dashboard` is reachable from several top-bar controls. | Two overview surfaces compete for the same job; a household is unsure which is *the* overview. (PARTIAL — dashboard has multiple entry points, not one.) |
| `fnd-route-name-drift` | Nutrition | Plant diversity is "Plants enjoyed" (`HouseholdNutritionCentre.tsx:286`), "Nutrition" in the nav (`nav-bar.tsx:45`), and `/plant-diversity` as a route. | One feature, three names, depending where the household is standing. |
| `fnd-alias-sprawl` | Routing | Five aliased paths and two redirects across `App.tsx`; two different pages both render the basket. | URLs multiply faster than surfaces; the route table no longer maps one-to-one to what exists. |
| `fnd-notfound-dead-end` | Not Found | `not-found.tsx` (21 lines) renders only an icon and "404" — no link home, no nav; mounted outside `ProtectedRoute` so it has no bottom nav either (`App.tsx:242`). | A household that mistypes a URL is stranded with no way back into the product. |
| `fnd-unsubstantiated-habits-claim` | Landing | "Build Better Habits" is claimed on the landing page; the mechanism that would reinforce a habit (proactive notices) is built but unreachable (see `fnd-dead-reminders`). | The claim outruns the product; recorded with an honest `substantiation_gap`. |

### P3 — Hygiene, tech debt, and registry integrity

| id | Surface | What is wrong (evidence) | Impact |
|---|---|---|---|
| `fnd-unretired-predecessors` | Nav chrome | Four fully-built nav/header components (`DesktopSidebar`, `TopBar`, `BrandBanner`, `PageHeader`) are unused; `nav-bar.tsx:384-590` calls them "retired-but-retained… kept dormant for safe rollback"; `PageHeader` has zero importers and isn't even labelled retired. | Dead surfaces masquerade as live options; violates UI Principle 5 (retire on introduction). |
| `fnd-dialog-foundation-unadopted` | Modals | 89 modal surfaces across 39 files; only 2 use `dialog-foundation.ts` (`upf-info-modal`, `food-knowledge-modal`), and only its width helper; `DIALOG_PRESETS` is unused. | The canonical dialog foundation governs 2% of dialogs; the other 98% drift independently. |
| `fnd-destructive-guard-inverted` | Alert dialogs | `AlertDialogAction` defaults to the prominent `buttonVariants()`; `AlertDialogCancel` to muted `outline` — so destructive confirms emphasise the dangerous action unless a caller adds `bg-destructive` by hand, which `admin-users-page.tsx` and `admin-benchmark-households-page.tsx` do not. | The "delete" button is visually the safe-looking default; the safe choice is the muted one. |
| `fnd-ephemeral-media` | Media | `media-storage.ts` keeps meal photos on local disk; the code itself flags this unsafe for production. | Household meal photos are lost whenever the filesystem is recycled. |
| `fnd-admin-chrome-inconsistency` | Admin | `/admin/knowledge-review` is registered bare (`App.tsx:230`) without the `withAdminBanner` wrapper every other admin route uses. | One admin page loses the shared admin nav banner. |
| `fnd-no-screenshot-baseline` | Registry | **Downgraded by PDA1.** The household + public baseline is now captured (18 surfaces); admin and developer surfaces are not (they need an admin session). | The residual gap is the admin/developer tiers, not the whole baseline. |
| `fnd-pkr27-prompt-knowledge` | Companion | **Largely refuted.** Product *feature* knowledge is composed into the prompt's CONTEXT DATA from data (`conversation-gateway.ts:1051`, sourced from `capability-registry.ts`), which is PKR27-compliant. The one hard-coded product fact is a single identity line (`conversation-gateway.ts:1024`: "You are Apple… inside The Healthy Apples"). | Narrow: one identity line is embedded rather than read. The broad "Companion duplicates product knowledge" concern does not hold today. |

---

## 8. The through-lines

Five patterns connect the 31 findings. The roadmap is organised around them, because
fixing the pattern is worth more than fixing any one instance.

1. **Built but unreachable.** Eleven finished surfaces and a whole notice engine
   link to nothing. THA's biggest UX opportunity is not to build — it is to _connect_
   what is already built. (`fnd-dead-reminders`, `fnd-unretired-predecessors`, the
   Hidden Experiences section.)

2. **The household is told, but not defended.** Two classes of write —
   `/api/admin/*` maintenance jobs and meal-template CRUD — run without an auth
   guard, and a "premium" tier gates little at runtime. What the product _promises_
   about safety and tiers is ahead of what it _enforces_. (`fnd-unprotected-admin-endpoints`,
   `fnd-public-template-writes`, `fnd-premium-unenforced`.)

3. **One thing, many names.** Naming drift across scores, baskets and nutrition
   makes one product feel like several. (`fnd-score-name-collision`, `fnd-two-apples`,
   `fnd-shopping-duplicate`, `fnd-route-name-drift`, `fnd-alias-sprawl`.)

4. **Journeys that stop one step short.** Cooking never reaches the diary; a shared
   plan's intent is dropped; onboarding and imports don't resume; the guidance THA
   promises on arrival never comes. The starts are built; the finishes are missing.
   (`fnd-cooked-never-reaches-diary`, `fnd-shared-plan-intent-lost`,
   `fnd-onboarding-not-resumable`, `fnd-import-not-resumable`,
   `fnd-unfulfilled-guidance-promise`.)

5. **The product can't yet speak about itself.** The Companion cannot answer a
   single question about THA, because Product Knowledge is not a registered
   capability — and where it does hold self-knowledge, that knowledge is baked into
   prompts rather than read from this registry. Populating the registry (PDA1's own
   work) is the precondition for closing this. (`fnd-no-product-knowledge-capability`,
   `fnd-pkr27-prompt-knowledge`.)

## 9. What PDA1 deliberately did not do

- **It changed no product code.** Every finding is a recommendation; the fixes are
  the roadmap's, not this investigation's.
- **It registered no capability.** `cap-product-knowledge` remains `hidden` /
  `developer`: PDA1 populates the knowledge, and registering it as a queryable
  Companion capability (Rule PKR20) is a separate, later workstream.
- **It captured no admin/developer screenshots.** The baseline is the household
  experience; the admin tier is a stated residual gap.
- **It invented nothing.** Where THA had no answer — pricing, a guided tour, a
  notification-preferences surface — the registry records the _absence_, honestly,
  rather than a plausible-sounding fiction.

---

_Investigation PDA1. Discovered the platform; populated the registry; recommended
the roadmap. It does not own what it found — the [registry](../../product/) does._
