# FS2 — Recipe Acquisition Architecture & Licensing Review

**Document type:** Investigation only — no code, schema, or data change.
**Date:** 2026-07-02
**Branch:** `int1-intelligence-platform`
**EWO:** EWO-FS2 (🟡 AMBER)
**Author role:** Data-licensing / IP-compliance reviewer + THA platform architect.
**Companion documents (read together, not restated here):**
- `docs/investigations/knowledge/FS1_THA_KNOWLEDGE_SOURCE_AND_LICENSING_AUDIT.md` — the general knowledge-source licensing register. FS1 §1.3/§1.4 identified recipe scraping as the highest-severity gap (G1) and the TheMealDB test key as G2. FS2 is the deep-dive that G1/G2 called for: it maps *every* recipe acquisition path (FS1 sampled the two biggest), separates the acquisition models the brief asks to distinguish, researches the commercial licensing landscape, and proposes a target architecture. Licence conclusions already verified in FS1 (Edamam link-out terms, TheMealDB supporter terms, OFF licences) are cited, not re-verified.
- `docs/architecture/INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md` — presentation-layer principle FS2's link-out recommendation must stay consistent with.

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Git status at start | Working tree dirty with substantial prior uncommitted INT35–NUT1/FS1 work on this branch (unrelated to this task). This task adds exactly one new file. |
| HEAD at start | `4a2da735f5b80bac2da4dd306c387adeb5e431de` |
| Rollback tag | `rollback/before-fs2-recipe-acquisition-20260702` → `4a2da73` |
| Undo this doc only | `rm docs/investigations/cookbook/FS2_RECIPE_ACQUISITION_ARCHITECTURE_AND_LICENSING_REVIEW.md && git tag -d rollback/before-fs2-recipe-acquisition-20260702` |

**This task makes no code, schema, route, or data change.** One artefact is produced: this file (plus the rollback tag).

---

# SECTION 0 — METHOD

Every acquisition path below was located by reading the integration code; file paths and line numbers are cited so each claim is independently checkable. External facts were verified on 2026-07-02 against primary sources where reachable: `bbcgoodfood.com/robots.txt` was fetched directly; TheMealDB's terms were read from `themealdb.com/api.php`; Edamam's licensed-recipe offering from `developer.edamam.com/recipe-database-licensing`; Spoonacular's caching terms from search results citing `spoonacular.com/food-api/terms`. Where a claim rests on secondary reporting (e.g. the Good Food / Immediate Media corporate history) the sources are listed in §7 and the claim is framed as reported, not verified. Nothing below is a substitute for formal legal advice; this is an engineering-level compliance review that tells THA where a lawyer's time would actually be spent.

**Terminology used throughout:**
- *Import* — recipe content is copied into THA's `meals` table and served from THA's own database thereafter.
- *Discovery* — recipe candidates are shown to a user in search/suggestion UI; content may or may not be persisted at that point.
- *Link-out* — THA shows title/image/attribution and sends the user to the publisher's page for the substantive content.
- *Provenance laundering* — persisting acquired content under a source label that hides where it came from.

---

# SECTION 1 — COMPLETE INVENTORY OF RECIPE ACQUISITION PATHS

Eleven distinct paths were found, grouped into the five models the brief asks to distinguish. This is the full set — no other code writes recipe content (name + ingredients + instructions) into THA's store.

## 1.A User-initiated recipe imports (user chooses a specific recipe; THA fetches/parses it)

### A1 — URL import (`POST /api/import-recipe`)

`server/routes.ts:2606-2979`. The user pastes any recipe URL. Pipeline:

1. **Source gate** — `getSourceKeyForUrl` (`server/lib/recipe-source-gate.ts:88-95`) maps the hostname to a source key and blocks if the admin has disabled it. **The gate only recognises the four hard-coded scraped domains** (BBC Good Food, AllRecipes, Jamie Oliver, Serious Eats). Every other domain on the internet bypasses the gate entirely (`importSourceKey` is `null` → no check, `routes.ts:2638-2648`).
2. **Fetch with browser impersonation** — full Chrome-120 header set including `Sec-Fetch-*`/`Sec-Ch-Ua` (`routes.ts:2650-2664`), native fetch then axios fallback, then a **WordPress REST API fallback** (`/wp-json/wp/v2/posts?slug=…`, `routes.ts:2701-2721`) that retrieves post content even when the HTML page refused to load — i.e. a second, deliberate bypass of the site's front-door blocking.
3. **Parse** — JSON-LD `schema.org/Recipe` first (`routes.ts:2800-2832`), DOM-heuristic fallback (ingredient regex + method selectors, `routes.ts:2855-2930`), nutrition text extraction.
4. **Paywall guard** — imports containing the BBC Good Food premium marker string are rejected with 403 ("This recipe is behind a paywall", `routes.ts:2813-2815`); the search path filters the same marker (`routes.ts:2588-2592`). This is the codebase's only acknowledgement that publisher content has access tiers — and it exists to avoid *broken* imports, not as a licensing control.
5. **Persist** — the parsed result is returned to the client; the client saves via `POST /api/meals` with `mealSourceType: 'imported_website'` and `sourceUrl` (`client/src/pages/meals-page.tsx:6316`). The full instruction text is stored in THA's `meals` table.

### A2 — Social import (Instagram / TikTok URLs)

Same endpoint, platform branch at `routes.ts:2747-2798`. Only `og:title`/`og:description`/`og:image` meta tags are read (the creator's own caption, which creators publish precisely to be shared); no page body is scraped. Saved as `mealSourceType: 'imported_instagram' | 'imported_tiktok'` (`client/src/components/create-meal-modal.tsx:94`).

### A3 — Paste-text import (`POST /api/import-recipe-from-text`)

`routes.ts:2981+`. User pastes raw text; OpenAI `gpt-4o-mini` extracts `{title, ingredients, instructions, servings}` with an explicit no-invention prompt (`routes.ts:3052`). THA never contacts the publisher — the user supplies the content.

### A4 — Photo/scan import

`server/services/recipeParser.ts` — OpenAI vision parses a photo of a recipe (handwritten card, cookbook page, screen) into structured ingredients/steps. As with A3, THA is a transcription tool for user-supplied content.

## 1.B User-initiated recipe discovery (user types a query; THA fans out)

### B1 — Recipe search (`GET /api/search/recipes`)

`routes.ts:2400-2604`. One query fans out **in parallel to nine sources** (`routes.ts:2443-2515`): TheMealDB (official API, shared test key `…/api/json/v1/1/…`), BBC Good Food / AllRecipes / Jamie Oliver / Serious Eats (**live HTML scraping of each site's `/search` page** — `routes.ts:197-256` and `server/lib/external-meal-service.ts:275-577`), and Edamam / API-Ninjas / BigOven / FatSecret (official APIs, all `defaultEnabled: false` and uncredentialed). Each source *is* checked through `isSourceCallable` on this path. Results are interleaved, diet-filtered, and shown with a `source` label and `url`. Persisting happens only if the user then imports (A1 flow).

## 1.C Automated recipe acquisition (THA initiates; no user picked a recipe or a source)

### C1 — Smart Suggest external candidate harvesting

`server/lib/smart-suggest-service.ts:513-523` → `fetchExternalCandidates` (`external-meal-service.ts:748-792`). When a user generates a plan, THA automatically queries TheMealDB **plus all four scraped sites**, then `enrichExternalCandidates` (`external-meal-service.ts:807-850`) **fetches and scrapes each candidate's detail page** (5 concurrent requests) to extract full ingredients and instructions — including a second full sweep with generic queries if the diet-filtered pass returned under 10 candidates (`external-meal-service.ts:773-789`).

**Finding C1-a (new — not in FS1): this path bypasses the admin source gate entirely.** Neither `external-meal-service.ts` nor `smart-suggest-service.ts` imports `recipe-source-gate`; `fetchExternalCandidates` calls all five sources unconditionally. An admin who disables BBC Good Food in the admin UI stops recipe *search* and URL *import*, but Smart Suggest keeps scraping it on every plan generation. The gate protects the two lower-risk paths and misses the highest-risk one.

### C2 — Smart Suggest auto-import (`POST /api/smart-suggest/auto-import`)

`routes.ts:5038-5109` → `autoImportExternalMeal` (`server/lib/auto-import-service.ts:24-103`). When a user accepts a suggestion, the external candidate is persisted as a THA meal. If ingredients are missing it **re-scrapes the source page** (`auto-import-service.ts:55-61`).

**Finding C2-a: provenance laundering.** The created meal is stored with `mealSourceType: "scratch"` (`auto-import-service.ts:73`) — the same label as a meal the user typed in by hand. `sourceUrl` and the candidate's `source` name are kept on the row, but the source *type* — the only field the rest of the codebase branches on — says the user authored it. A scraped BBC Good Food recipe therefore becomes indistinguishable, at the classification level, from user-authored content. A code comment in `smart-suggest-service.ts:588` shows the team has already tripped over this ("Those paths defaulted to 'scratch', which passes the…").

## 1.D Licensed API integrations

| Provider | Code status | Compliance state |
|---|---|---|
| **TheMealDB** | Live, default-on, used by B1 and C1 (`external-meal-service.ts:232`, `routes.ts:2457`) | ❌ Production use of the dev/test key `1`; TheMealDB's terms (verified 2026-07-02): test key is for "development of your app or for educational use… you must become a supporter if releasing publicly". Fix is a cheap PayPal supporter upgrade → upgraded key. FS1 G2. |
| **Edamam** | Wired, `defaultEnabled: false`, no credentials (`external-meal-service.ts:579-611`) | ✅ Code matches Edamam's link-out licence *by accident of shape*: it stores `ingredientLines` but `instructions: []` and keeps `sourceUrl`. Edamam's terms (FS1 §1.4): they are licensed to provide ingredients + link, **not** cooking instructions. If ever enabled, the constraint must become explicit (Edamam candidates must be excluded from any path that scrapes `sourceUrl` for instructions — today `enrichCandidateIngredients` short-circuits only because Edamam rows already have ingredients; nothing *prevents* instruction scraping of Edamam-sourced URLs on the auto-import path, `auto-import-service.ts:55-61`). |
| **API-Ninjas / BigOven / FatSecret** | Wired, off, uncredentialed (`external-meal-service.ts:613-746`) | ⚠️ ToS never reviewed (FS1 G7). Do not enable without review. Note API-Ninjas returns full instruction text (`external-meal-service.ts:627-629`) — its redistribution terms matter most. |
| **Whisk (Samsung Food)** | `WHISK_API_KEY` used only for shopping-basket handoff (`routes.ts:1053-1054`) | Not a recipe *content* source today. Samsung's "Whisk for Business" B2B platform still operates (see §3.6) — a candidate partnership channel, not a current exposure. |
| **Spoonacular** | Price lookup only (`server/lib/price-lookup.ts`) | Not a recipe source today. Its terms are instructive for §4: max 1-hour caching, delete-all-on-termination, no resale — a "live-fetch only" licence model incompatible with THA's current import-and-keep architecture. |

## 1.E THA-authored / owned recipe content

- **Starter meals** — `isSystemMeal: true` rows copied to each new user with `mealSourceType: "starter"` (`server/lib/meal-service.ts:50-151`). **Finding E-a: the provenance of the seeded system-meal rows themselves is not recorded anywhere in the repo** — `getStarterMeals` selects whatever `isSystemMeal` rows exist in the DB; no seed script for recipe-type system meals (with instructions) exists in `server/seeds/`. Whether these are THA-authored, hand-copied, or historic imports is unverifiable from code. This must be established before any of them is treated as THA-owned IP (see §5, R8).
- **Ready-meal catalogue** — `server/lib/seed-ready-meals.ts:60`: name-only rows (`ingredients: [name]`, `instructions: []`), factual product identities. No copyright exposure — there is no expressive content.
- **Meal shell templates** — `server/seeds/seed-meal-shell-templates.ts`: THA-authored structural templates (slots/tags), not recipes. Owned.
- **Recipe swap variants** — `server/lib/recipe-swap-engine.ts` (deterministic rule tables) and the AI vegan/vegetarian conversion path (`routes.ts:9118+`, stored as `mealSourceType: "household-safe-variant"`, `routes.ts:9620`). These generate *derivatives of whatever meal they are applied to* — a variant of a scraped recipe inherits the original's licensing problem (an adaptation of a literary work is itself a restricted act under UK CDPA s.21). Safe on user-authored and licensed content; not a laundering mechanism for scraped content.
- **Open Food Facts products-as-meals** — `mealSourceType: "openfoodfacts"`; products, not recipes; covered by FS1 §1.1/G3 and not re-analysed here.

## 1.F Provenance storage — what the schema can actually record

`shared/schema.ts:104-106`: the `meals` table has exactly two provenance fields — `sourceUrl` (free text, nullable) and `mealSourceType` (free text, default `"scratch"`). Observed values across the codebase: `scratch`, `web` (`client/src/pages/quick-meal-page.tsx:173`, `server/lib/uplift-persistence.ts:177`), `imported_website`, `imported_instagram`, `imported_tiktok`, `starter`, `ready_meal`, `openfoodfacts`, `planner-placeholder`, `household-safe-variant`. There is **no** licence field, no attribution text, no acquisition timestamp/actor, no storage-policy marker, and the taxonomy conflates *how* a meal arrived (`imported_website`) with *what it is* (`ready_meal`) with *pipeline artefacts* (`planner-placeholder`). Two different values (`web`, `imported_website`) mean the same thing on different code paths. The register in §4.3 exists because this free-text pair cannot answer the one question a licensing review asks: *"under what right does THA hold and display this row?"*

---

# SECTION 2 — LEGAL ANALYSIS PER ACQUISITION MODEL

## 2.1 The legal framework (UK-first, matching THA's market)

Four independent legal layers apply; a path can be clean on one and exposed on another:

1. **Copyright in the recipe text.** Under UK law the ingredient *list* and purely functional steps ("bake at 180°C for 20 min") are generally not protectable — facts and functional instructions lack the originality/expression requirement. The *expressive* method prose (BBC Good Food's editorial voice, Serious Eats' explanatory paragraphs), headnotes, and descriptions are literary works; photographs are always protected as artistic works. THA's pipelines copy exactly the protected parts: full instruction text verbatim, plus image URLs.
2. **Sui generis database right.** A recipe publisher's site is a database in which substantial investment has been made; systematic extraction of substantial parts (which repeated automated harvesting across queries is, cumulatively) can infringe the UK database right even where individual recipes' facts are free. This bites hardest on model C (automated, repeated, breadth-first extraction) and barely at all on model A (one user, one recipe).
3. **Contract (Terms of Service).** *Ryanair v PR Aviation* (CJEU C-30/14) established that where database right/copyright do *not* protect the data, the site owner may still restrict scraping contractually. Publishers' ToS uniformly prohibit automated access. The browser-impersonation header sets (`recipe-scraper.ts:12-25`, `routes.ts:2650-2664`) and the WordPress-API fallback are evidence of *knowing* circumvention — the single worst fact in the codebase if a dispute ever arose, because it defeats any "we accessed in good faith" argument.
4. **Robots/access signals.** Fetched 2026-07-02, `bbcgoodfood.com/robots.txt` **explicitly disallows `/search*` and `/search-results/*` for all user agents** — the exact endpoints `searchBBCGoodFood` (`routes.ts:200`) and `searchBBCGoodFoodEnhanced` (`external-meal-service.ts:300`) hit — and declares content signals `ai-input=no, ai-train=no` with the notice "As a condition of accessing this website, you agree to abide by the following content signals." Robots.txt is not itself law, but ignoring an explicit disallow while spoofing Chrome converts "grey-area scraping" into "documented bad faith".

## 2.2 Risk ranking by acquisition model

| Model | Paths | Who initiates | What's copied | Stored & redistributed? | Risk | Reasoning |
|---|---|---|---|---|---|---|
| **C — Automated acquisition** | C1, C2 | THA, at scale, on every plan generation | Full instructions + images from 4 publishers | Yes — as `"scratch"` meals | 🔴 **Critical** | All four legal layers engaged: verbatim literary copying, systematic database extraction, ToS breach with circumvention evidence, robots.txt disallow. THA (not the user) selects sources and harvests breadth-first. Bypasses THA's own admin gate (C1-a) and erases provenance (C2-a). This is the model a publisher's lawyer would lead with. |
| **B — User-initiated discovery** | B1 | User query; THA chooses the 9 sources | Search-result titles/images/URLs; full text only from TheMealDB | Displayed; persisted only on user import | 🟠 **High** | Scraping `/search` pages against an explicit robots disallow, commercially, on every user search. Lighter than C only because the *content* taken per request is thinner (links/titles) and persistence needs a user action. TheMealDB portion is licensed-but-wrong-key (G2). |
| **A1/A2 — User-initiated import** | A1, A2 | User supplies the exact URL | Full recipe from that one page | Yes — private to that user's meal list | 🟡 **Medium-low** | Materially different: the user directs a single acquisition of a recipe they found, for private meal planning — functionally a "read-it-later/personal cookbook" use with real (if untested) personal-use equities; no systematic extraction; not served to other users. Residual exposure: it is still *THA's server* fetching with impersonation headers and a WP-API fallback, and THA hosts the copy. Mitigable (honest User-Agent, respect robots/paywalls, keep private, attribute + link back), not eliminable, without publisher licences. |
| **A3/A4 — User-supplied content** | A3, A4 | User pastes/photographs content they possess | Whatever the user provides | Yes — private | 🟢 **Low (for THA)** | THA is a transcription tool; it never contacts the publisher. Any infringement in the user's own copy is the user's, akin to typing a cookbook recipe into a notes app. Standard platform hygiene applies (ToS clause: users must have the right to store what they upload). |
| **D — Licensed APIs** | TheMealDB, Edamam, etc. | Either | Per licence | Per licence | 🟢 **Low once configured** | The licence *is* the permission — but only inside its bounds: TheMealDB needs the supporter key (G2); Edamam is link-out only, never instructions; the dormant three need ToS review before enabling (G7). |
| **E — THA-authored/owned** | Starter, shells, ready-meal facts | THA | Own content | Yes | 🟢 **None** (pending E-a) | Owned IP — provided the starter-meal provenance question (E-a) is answered. Swap variants inherit the risk class of their base meal. |

## 2.3 The two structural defects (independent of any single source)

1. **The architecture cannot tell its acquisition models apart.** A scraped auto-import, a user's personal URL import, and a hand-typed meal all converge on the same `meals` row shape, with C2 actively mislabelled as `scratch`. Every governance decision FS1/FS2 recommend (attribution, link-out, purge-on-demand, per-source disable) requires distinguishing them — and today the data cannot.
2. **The enforcement point covers the wrong paths.** `recipe-source-gate` gates B1 and A1 (the medium paths) but not C1/C2 (the critical path), and its domain map covers only 4 named sites, so A1 is ungated for the rest of the web. A gate that the riskiest caller doesn't pass through is documentation, not control.

---

# SECTION 3 — PROVIDER LANDSCAPE: OFFICIAL APIS, LICENSING, PARTNERSHIP & AFFILIATE ROUTES

Researched 2026-07-02. Corporate facts are from the press sources listed in §7.

## 3.1 BBC Good Food → "Good Food" (Immediate Media / Burda)

- **Ownership:** BBC Studios sold the Good Food business to Immediate Media (Hubert Burda Media group) in 2018, with the BBC brand and `bbcgoodfood.com` URL under licence. That brand licence has since ended — the product rebranded to plain **"Good Food"** (reported mid-2024/2025; VideoWeek, Dec 2025), precisely so Immediate could pursue commercial partnerships the BBC guidelines prohibited (e.g. the reported Morrisons campaign).
- **Official API:** none public. No developer programme exists.
- **Licensing/syndication:** Good Food **actively syndicates recipe content and imagery** to publishing partners — internationally under the Good Food brand (e.g. the CPI partnership in the Middle East) and unbranded content syndication in other territories. This is an established commercial channel: THA would approach Immediate Media's content licensing/syndication team as a UK B2B licensee of recipe content. Post-BBC, Immediate is explicitly hungrier for commercial revenue lines, which makes this conversation *more* plausible than it was pre-2024.
- **Affiliate:** Good Food monetises via its own premium app/subscriptions and retail partnerships; no recipe-content affiliate programme relevant to THA was found. The realistic commercial routes are (a) content syndication licence, (b) a traffic partnership (THA link-out cards driving referral traffic — publishers value this; it is the *opposite* of scraping), or (c) white-label/brand licensing (heavyweight; not proportionate to THA's stage).
- **Posture toward THA today:** robots.txt disallows the `/search` endpoints THA scrapes and sets `ai-input=no`; recipe content is partially paywalled ("premium" marker THA already filters). Continued scraping is the one thing most likely to poison a future syndication conversation.

## 3.2 Dotdash Meredith (AllRecipes **and** Serious Eats)

Both scraped sites are owned by the same company — Dotdash Meredith (IAC), which acquired Serious Eats in 2020 and owns AllRecipes. No public recipe API. Dotdash Meredith operates a content licensing/permissions function for republication requests; a single conversation covers two of THA's four scraped sources. Same link-out traffic-partnership logic as §3.1 applies.

## 3.3 Jamie Oliver Group

Publisher-owned recipes (jamieoliver.com); no API; licensing via the Jamie Oliver Group brand/licensing team, which is an active licensing business (books, TV, endorsed products). Realistically the least likely of the four to license raw recipe data to an app; link-out or drop.

## 3.4 Edamam — the standout licensed full-content option

Two distinct products, one vendor:
- **Recipe Search API** (already wired, disabled): ~2M recipes, **link-out model** — ingredients + nutrition + URL, no instructions. Free tier exists; paid tiers to ~$999/mo. Correct for discovery cards.
- **Licensed Recipes offering** (verified 2026-07-02 at developer.edamam.com/recipe-database-licensing): **40,000+ recipes from "top recipe publishers" licensed *with* image, title, ingredients, full cooking instructions, nutrition and allergy/diet labels** — i.e. the only found off-the-shelf product that lawfully delivers what THA's scrapers currently steal: full in-app recipe display. Publisher list and pricing are not published; requires a sales conversation. This is the primary candidate for replacing models B/C's full-content needs.

## 3.5 Spoonacular

360k+ recipes with instructions and rich food data; THA already holds a key (price lookup). But its terms impose **max 1-hour caching, delete-everything-on-termination, and no resale** — a live-fetch licence. Compatible with a discovery/search layer that renders live results; incompatible with THA's import-and-keep meal model unless the architecture separates "displayed live" from "saved to my meals" (which §4 recommends anyway). Worth including in the vendor evaluation alongside Edamam since a commercial relationship already exists.

## 3.6 Samsung Food / Whisk for Business

Whisk (acquired by Samsung 2019, rebranded Samsung Food 2023) still operates a **"Whisk for Business"** B2B platform powering food experiences for third parties, including recipe APIs by partnership. THA already integrates Whisk for shopping-basket handoff (`routes.ts:1053`), so a commercial channel is already open — extending that relationship to recipe content is a credible medium-term option, with the strategic caveat that Samsung Food is itself a competing meal-planning consumer product.

## 3.7 TheMealDB, and the dormant three

- **TheMealDB:** supporter upgrade (small PayPal payment → production key, full DB, multi-ingredient filters). The only same-week, near-zero-cost action that converts a live non-compliance into a licence. Content quality/UK-fit is limited; treat as supplementary, not the backbone.
- **API-Ninjas / BigOven / FatSecret:** remain "reference only until each ToS is reviewed" (FS1 G7). None is a strategic answer; review only if a concrete need appears. FatSecret's recipe corpus is US-centric; BigOven's API programme has been intermittently maintained — verify it is even commercially alive before spending review effort.

---

# SECTION 4 — TARGET ARCHITECTURE: LEGALLY ROBUST, UX-PRESERVING

## 4.1 Design principle

**Separate what THA *shows* from what THA *keeps*, and record under what right it does each.** Every current problem traces to one collapse: content THA may at most *point at* is being *kept and relabelled*. The user experiences to preserve are (a) "search recipes and see appealing results", (b) "one-click add a suggestion to my plan", (c) "import a recipe I found into my private cookbook". None of them requires THA to own a copy of a publisher's instruction text — (a) and (b) need a *card* (title, image, nutrition, diet fit) plus either licensed full content or a link; (c) is a private personal copy.

## 4.2 The three-lane model

| Lane | Content | Right held | Storage policy | Serves |
|---|---|---|---|---|
| **Lane 1 — THA catalogue** | THA-authored recipes; content licensed for full redistribution (Edamam Licensed Recipes, TheMealDB with supporter key, future Good Food syndication) | Ownership or explicit redistribution licence | Import & keep; attributed where licence requires | Discovery, Smart Suggest, starter content — the shared pool every user sees |
| **Lane 2 — Live licensed discovery** | Link-out APIs (Edamam Search) and live-fetch APIs (Spoonacular-style) | API licence bounded to display/link | Cache within licence TTL only; never promoted to a meal row without Lane-1 rights; link-out card for instructions | Search results, suggestion candidates beyond the catalogue |
| **Lane 3 — User personal imports** | A1–A4 content the user directed | User's personal-use equities; THA as tool | Private to the importing user, permanently; `sourceUrl` + attribution retained; **never** enters discovery, suggestions, or any other user's view; purge-on-request | "My cookbook" |

Hard rules the lanes imply:
1. **No THA-initiated scraping, at all.** Model C dies; models B's four scraped sources die. Discovery is Lane 1 + Lane 2. (Smart Suggest keeps working: TheMealDB-with-key + Edamam + THA catalogue supply candidates; the auto-import step only persists Lane-1 content, and creates *link-out planner entries* for Lane-2 candidates.)
2. **Personal import survives, cleaned up:** honest User-Agent (`TheHealthyApples/1.0 (+https://thehealthyapples.com/bot)` — fixing FS1 G4's stale-identity pattern at the same time), respect robots.txt disallows and paywalls (keep the premium-marker rejection, extend to any login-walled page), drop the Chrome-impersonation header set and the WP-API fallback, always store `sourceUrl` + display "Imported from {domain} — view original" with a working link. Lane 3 content never syndicates sideways.
3. **Variants inherit lanes.** Swap-engine output carries the base meal's lane; a Lane-3 variant stays Lane 3.
4. **Images:** never re-host publisher images for Lanes 2–3 (hotlink or omit; Lane 3 may cache privately for the importing user); Lane 1 images must be included in the content licence.

## 4.3 Schema & enforcement changes (the implementable core)

1. **Structured provenance on `meals`** — replace the overloaded free-text pair with: `acquisitionType` (`authored | licensed_import | user_import | user_transcription | product | derived`), `sourceKey` (FK into the source registry), `licenceRef` (nullable), `attributionText` (nullable), `acquiredAt`/`acquiredByUserId`, keeping `sourceUrl`. Backfill map for existing values: `scratch→authored` *except* rows with a `sourceUrl` and non-null external source (the C2 laundered rows — backfill those to `user_import` with `sourceKey` recovered from the URL domain); `web/imported_*→user_import`; `starter→authored` (pending E-a); `ready_meal/openfoodfacts→product`; `household-safe-variant→derived`.
2. **Extend `recipe-source-gate` into the runtime half of FS1's source register** — per-source `storagePolicy` (`import | cache_ttl | link_only | forbidden`) and `licenceState` (`licensed | pending_review | unlicensed`), enforced *in the acquisition functions themselves* (`fetchExternalCandidates`, `enrichCandidateIngredients`, `autoImportExternalMeal`), not only in route handlers — closing C1-a permanently. A source without a registry row is unfetchable by construction.
3. **Attribution rendering** — one shared meal-card/detail component branch keyed on `acquisitionType`+`attributionText`, satisfying Edamam/TheMealDB/OFF attribution duties in one place (consistent with `INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md`).

## 4.4 Sequenced plan

**Now (days, no new spend):**
1. Flip `bbcgoodfood/allrecipes/jamieoliver/seriouseats` to `defaultEnabled: false` (`recipe-source-gate.ts:23-26`) and route `fetchExternalCandidates` through `isSourceCallable` (closes C1-a with the existing gate).
2. TheMealDB supporter key; move the URL off `…/v1/1/…` (closes G2).
3. Stop the C2 laundering: `mealSourceType: "smart-import"` (or the §4.3 taxonomy if it lands together), preserving `source`/`sourceUrl`.
4. Replace impersonation headers with an honest UA on the A1 import path; remove the WP-JSON fallback.

**Next (weeks):** §4.3 schema + registry enforcement; Edamam Search enabled as the Lane-2 discovery backbone (link-out cards); Spoonacular recipe evaluation under live-fetch rules; Lane-3 UX polish (attribution banner on imported meals — partially exists via `importBanner`).

**Later (quarters):** Edamam Licensed Recipes commercial evaluation (the 40k full-content corpus) vs. a direct Good Food syndication approach via Immediate Media (§3.1) — the two candidate answers to "full recipes, in-app, lawfully"; grow the THA-authored catalogue as the long-term moat (it is the only lane with zero licence cost, zero counterparty risk, and full brand control — FS1 §1.7 already calls it "the model every other source should be judged against").

---

# SECTION 5 — RECOMMENDATIONS REGISTER

| # | Recommendation | Path(s) | Severity of status quo | Cost |
|---|---|---|---|---|
| R1 | Disable all four scraped sources by default; kill scraping-based discovery permanently once Lane 2 is live | B1, C1 | Critical (FS1 G1, confirmed + worse via C1-a) | Low (flag flip) / Medium (replacement) |
| R2 | Route `fetchExternalCandidates`/`enrichCandidateIngredients`/`autoImportExternalMeal` through the source gate | C1, C2 | Critical | Low |
| R3 | Fix C2 provenance laundering (`"scratch"` → honest acquisition type) + backfill laundered rows via `sourceUrl` domain | C2 | High | Low–Medium |
| R4 | TheMealDB supporter upgrade | B1, C1, D | High (live term breach) | Trivial |
| R5 | Honest User-Agent; remove impersonation headers + WP-API fallback; respect robots/paywalls on user imports | A1 | Medium | Low |
| R6 | Structured provenance schema + storage-policy registry (§4.3) | All | Structural | Medium |
| R7 | Enable Edamam Search (link-out) as discovery backbone; encode "never scrape Edamam `sourceUrl` for instructions" as a registry rule | B1, C1 | — | Low–Medium (+ API fees) |
| R8 | Establish and record starter-meal provenance (E-a) before treating system meals as THA IP | E | Medium (unknown exposure) | Low (archaeology) |
| R9 | Commercial evaluation: Edamam Licensed Recipes vs. Good Food syndication (Immediate Media) vs. Whisk for Business | Strategy | — | Sales conversations |
| R10 | Keep A3/A4 as-is; add a user-content rights clause to THA's own ToS | A3, A4 | Low | Trivial |
| R11 | Lane-3 containment rule: user imports never feed discovery/suggestions for other users (currently true de facto — make it an enforced invariant, not an accident) | A1–A4 | Preventative | Low |

---

# SECTION 6 — DATA IMPACT

- Reads existing data: **YES** — read-only review of code and public provider terms.
- Writes new data: **NO** — no schema, table, or seed change. (One git tag created for rollback bookkeeping.)
- Changes meaning of existing data: **NO** — §4.3's backfill is a *proposal*.
- Requires backfill: **NOT NOW** — R3/R6 would, and §4.3 specifies the mapping.

---

# SECTION 7 — SOURCES CONSULTED (EXTERNAL)

**Primary (fetched 2026-07-02):**
- `bbcgoodfood.com/robots.txt` (direct fetch — `Disallow: /search*`, `Disallow: /search-results/*`, `Disallow: /api/*`; content signals `search=yes, ai-input=no, ai-train=no` framed as a condition of access).
- [TheMealDB API terms](https://www.themealdb.com/api.php) (test key = development/educational only; supporter key required for public release).
- [Edamam — Licensed Recipe Content](https://developer.edamam.com/recipe-database-licensing) (40k+ publisher recipes licensed with full cooking instructions, nutrition, allergy/diet labels).

**Secondary:**
- [Press Gazette — Immediate Media buys BBC Good Food brand](https://pressgazette.co.uk/immediate-media-becomes-uks-largest-food-media-publisher-with-buyout-of-bbc-good-food-brand/); [Digiday — Inside Immediate Media's BBC Good Food acquisition](https://digiday.com/media/inside-immediate-medias-bbc-good-food-acquisition/); [VideoWeek — Fresh from BBC separation, Good Food is baking video into business](https://videoweek.com/2025/12/03/fresh-from-bbc-separation-good-food-is-baking-video-into-business/) (rebrand, commercial partnerships, Morrisons campaign); [FIPP — BBC Good Food business model / syndication](https://www.fipp.com/news/bbc-good-food-in-2020/).
- [Bird & Bird — Intellectual Property Rights in Recipes and Food](https://www.twobirds.com/en/insights/2020/uk/intellectual-property-rights-in-recipes-and-food); [Kluwer Copyright Blog — Ryanair v PR Aviation](https://legalblogs.wolterskluwer.com/copyright-blog/ryanair-ltd-v-pr-aviation-bv-contracts-rights-and-users-in-a-low-cost-database-law/) (UK/EU recipe copyright scope; contractual scraping restrictions).
- [Spoonacular food API](https://spoonacular.com/food-api) and its [terms](https://spoonacular.com/food-api/terms) (1-hour cache, delete-on-termination, no resale); [Edamam Recipe Search API](https://developer.edamam.com/edamam-recipe-api); [Edamam data licensing](https://www.edamam.com/data-licensing/).
- [Samsung Food press](https://samsungfood.com/press/); [Whisk for Business help centre](https://support.samsungfood.com/hc/en-us/categories/360003133591-Whisk-for-Business); [TechCrunch — Samsung Food launch](https://techcrunch.com/2023/08/30/samsung-launches-a-meal-planning-and-recipe-discovery-platform-called-samsung-food/).

---

# SECTION 8 — TRUST CHECK

- **Could this mislead the user?** No user-facing behaviour changes. The document exists because two *current* behaviours mislead third parties (impersonation headers; laundered provenance) — it surfaces them.
- **Could this fabricate certainty?** Legal conclusions are framed as engineering-level risk assessment, not legal advice; every licence/terms claim is either primary-sourced with a fetch date or explicitly marked as reported/unverified (Good Food corporate history; Edamam licensed-recipes pricing and publisher list; BigOven programme liveness).
- **Is anything guessed but shown as real?** The one unverifiable-from-code fact — starter-meal provenance (E-a) — is flagged as unknown and made a recommendation (R8) rather than assumed.
- **What happens if the system is wrong?** Worst case, a risk here is over- or under-weighted and a follow-up legal review corrects it; no code path changes as a result of this document alone.
- No architectural duplication introduced: **YES** — defers to FS1's register (extends it with `storagePolicy`/`licenceState` rather than creating a rival), and to the discovery-presentation principle doc for rendering rules.
- No new source of truth created for existing domains: **YES** — this is an acquisition/compliance analysis; domain ownership is unchanged.

---

# SECTION 9 — ROLLBACK PLAN

- Rollback identifier: `rollback/before-fs2-recipe-acquisition-20260702` at `4a2da73`.
- Files added: `docs/investigations/cookbook/FS2_RECIPE_ACQUISITION_ARCHITECTURE_AND_LICENSING_REVIEW.md` only.
- Rollback command: `rm docs/investigations/cookbook/FS2_RECIPE_ACQUISITION_ARCHITECTURE_AND_LICENSING_REVIEW.md && git tag -d rollback/before-fs2-recipe-acquisition-20260702`.
- Verification after rollback: `git status` shows the file removed; no other diff attributable to this task.

---

**Investigation completed:** 2026-07-02
**STOP — investigation complete. No implementation performed.** §4.4's "Now" items (R1–R5) are the approved-follow-up candidates with the highest severity-to-cost ratio; R1/R2 in particular should not wait for the full §4.3 schema work.
