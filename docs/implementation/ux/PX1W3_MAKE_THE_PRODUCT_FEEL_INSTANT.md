# PX1-W3 — Make the Product Feel Instant

**Status:** Implemented.
**Date:** 2026-07-12. **Owner:** Colin Clapson.
**Rollback:** tag `rollback/PX1-W3-make-the-product-feel-instant-20260712` (@ `16893b2d`, the PX1-W2 commit) · `refs/snapshots/PX1W3_ROLLBACK` (`de0062c` — the pre-existing dirty tree, preserved).

**Parent:** [`PX1_PLATFORM_EXPERIENCE_DISCOVERY_AND_ARCHITECTURE.md`](./PX1_PLATFORM_EXPERIENCE_DISCOVERY_AND_ARCHITECTURE.md) § 10, workstream **PX1-W3** ("Make it fast").
**Predecessors:** [`PX1W0`](./PX1W0_STOP_MISINFORMING_THE_HOUSEHOLD.md) · [`PX1W1`](./PX1W1_MAKE_THE_PRODUCT_RESPOND.md) · [`PX1W2`](./PX1W2_MAKE_THE_PHONE_WORK.md) — all complete.

**Governing architecture (cited, never restated):**
[`THA_EXPERIENCE_ARCHITECTURE.md`](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) (EXP1/EXP2 — §17 Premium lens: *the perceptible result of care taken on the household's behalf*) ·
[`THA_UI_ARCHITECTURE.md`](../../architecture/THA_UI_ARCHITECTURE.md) (UIA2 — §17 *retire-on-introduction, one owner per concern*) ·
[`REPOSITORY_CONVENTIONS.md`](../../architecture/REPOSITORY_CONVENTIONS.md).

---

## 1. What this workstream was for

PX1 found that **every household downloads the entire admin world to see tonight's
dinner.** One 3.83 MB JavaScript chunk, served uncompressed because the one line of
middleware that would gzip it was never installed. Home — the first screen after
login — fetched the household's full cookbook, ingredients and instructions
included (measured live: **1.07 MB**), to render **three meal names**. Thirty-plus
call sites re-triggered that download after nearly every mutation. The cookbook
search box janked on the household's own library and fired a network POST per
keystroke. And 3.7 MB of the first paint was decoration: a 2 MB background, a
1.45 MB apple rendered at 38 px, and a render-blocking request for ~25 font
families of which the product uses **two**.

W3 is the subset of PX1 that makes the product fast. It is deliberately **not** a
redesign: no surface looks different, no interaction changes, no new UX pattern
exists. Every change is structural — what is downloaded, when, how big, and how
often — and behaviour is preserved to the point that the harness in § 8 asserts
the *same* screens render the *same* content, only sooner and over far fewer bytes.

**Scope discipline.** W3 implements PX1 §10's W3 table (3.1–3.5) and nothing else.
Defects on surfaces W3 touched that belong to later workstreams — the dead files
(W4.7), the loading-vocabulary convergence (W4.8), server-side image resizing —
were left alone and are listed in § 6.

---

## 2. Findings addressed

All five W3 items, and the eight findings they resolve. Every number below was
**measured against the running app**, not estimated.

| PX1 §10 | Finding | What was broken | What is true now |
|---|---|---|---|
| 3.1 | `fnd-px-no-compression` | `server/static.ts` was a bare `express.static`; the `compression` package was not installed. Every byte shipped raw: the JS bundle 3.83 MB, the 1.07 MB meals payload, all of it. | `compression()` is mounted first in `server/index.ts`, ahead of static and API alike. Measured: the entry JS ships **216,030 B** on the wire; `/api/meals` drops **1,074,522 → 60,849 B** (17.7×). The middleware negotiates brotli where the client accepts it (§ 8 check 5 observed `content-encoding: br`) and never touches streaming responses — the server has none (verified: zero `text/event-stream`/`res.write` sites). |
| 3.2 | `fnd-px-no-route-splitting` | `App.tsx` had 34 eager page imports — 12 of them admin — and the build produced a **single 3,829,460 B chunk** (965,407 B gzipped). A household downloaded the Observation Workbench, the Behaviour Workbench, Development World, `recharts` and `@zxing` to see tonight's dinner. | Every page is a `React.lazy` chunk (145 chunks). The entry is **733,443 B** (216,030 B wire). `recharts` (376 KB) and `@zxing` (412 KB) live in lazy chunks a household never fetches (§ 8 check 6). The Suspense fallback *inside* the shell reuses the exact spinner the app always showed while the session loads — the header and bottom nav stay painted during navigation (§ 8 check 8b), and no new loading vocabulary was invented (that convergence is W4.8's). |
| 3.3 | `fnd-px-home-fetches-whole-cookbook` | Home fetched full `/api/meals` rows — ingredients and instructions — to read `name` + `imageUrl` for ≤3 planner entries. Measured live: **1,074,522 B** to render three meal names. | Home consumes the canonical `useMealsSummary()` — the same hook, and therefore the **same cache entry**, the Dashboard already reads; the pair now fetch it once between them. Measured: **690,844 B raw → 28,260 B on the wire** with compression. `/api/meals` is not requested on Home at all (§ 8 check 4a). |
| 3.3 | `fnd-px-meals-invalidation-storm` | 30+ call sites invalidated/refetched `["/api/meals"]` after mutations, each one re-downloading the 1 MB library uncompressed. Worse — and found during W3 — **not one of them invalidated `/api/meals/summary`**, so the Dashboard's (and now Home's) summary cache was never told the library changed. | One owner: **`invalidateMealLibrary()`** in `hooks/use-meals.ts` — the ONE way to say "the meal library changed" — invalidates both caches coherently. All **32 call sites** across 16 files route through it; zero direct invalidations of either key remain outside the owner (verified by grep, § 8). The refetch that does still happen ships gzipped (60 KB, not 1.07 MB), and Home no longer holds a full-library subscription to storm at all. |
| 3.5 | `fnd-px-cookbook-search-refetch` | The visible-set nutrition query was keyed off ids derived from `searchTerm` — a new cache entry and a new POST **per keystroke**, undebounced. | The filter pipeline runs on `useDeferredValue(searchTerm)`, so intermediate keystrokes never reach the query key; `placeholderData` holds the previous nutrition on screen instead of blanking every badge while the new set loads. Measured live: typing "chicken" (7 keys) fires **1 POST** (§ 8 check 9). |
| 3.5 | `fnd-px-cookbook-search-jank` | Per keystroke, for 884+ meals, `[meal.name, ...meal.ingredients].join(' ').toLowerCase()` allocated a multi-hundred-char string per meal before fuzzy-scoring, and the whole 6,800-line page re-rendered synchronously with the input. | The lowercased meal text is built **once per library load** (`mealSearchText`, keyed by meal id — the same pattern as the `scoreCache` the file already had, which PX1 named as the seed). The input renders from `searchTerm` immediately; the heavy filter runs against the deferred value, interruptibly. Search results are unchanged (§ 8 check 10). |
| 3.4 | `fnd-px-oversized-assets` | Measured: `orchard-bg.png` 2,023,987 B (every protected page), `tha-apple.png` 1,449,727 B (rendered at 38 px), `favicon.png` 295,207 B — plus a render-blocking Google Fonts request for **~25 families**. PNGs do not gzip; compression could not save them. | `orchard-bg` → **WebP, 56,986 B** (35.5×; a soft watercolour at 0.9 opacity is the ideal lossy case — visually verified). `tha-apple.png` → 256 px, **22,095 B** (65.6×; largest render is 48 px, ×3 retina = 144 px). `favicon.png` → 192 px palette, **9,263 B**. Same defect found during W3 on two more first-paint assets, same fix: `apple-logo.png` 233,997 → **21,466 B**, `logo-long.png` 505,688 → **42,398 B**. The font request now names **exactly the two families the type system defines** (`Inter`, `DM Sans` — `index.css:40–41`; `--font-serif`/`--font-mono` were never defined, so nothing else ever rendered). Referenced decoration: **4.51 MB → 152 KB** (29.6×). |
| 3.4 | `fnd-px-images-not-lazy` | `MealImageWidget`'s `<img>` — 48 cards at once — loaded every household photo eagerly at full resolution, while the web-results grid in the same page already did this correctly. | `loading="lazy"` + `decoding="async"`. The container already sizes the image (`w-full h-full object-cover`), so no layout shift is possible from the change. `srcset` needs the server-side resizing that does not exist (`sharp` is not installed) — recorded in § 6, not silently skipped. |

---

## 3. Components adopted

Per PX1's thesis — the defects are defects of **adoption** — W3 adopted the
canonical implementation wherever one existed:

| Adopted | Where it already was | What now uses it |
|---|---|---|
| **`/api/meals/summary` + `useMealsSummary()`** | The slim contract existed (`routes.ts:855`), consumed by exactly one surface (Dashboard). PX1 §9 names it "the default list contract". | Home. Same hook → same query key → same cache entry as the Dashboard: one fetch serves both. |
| **`compression`** | The canonical Express middleware, absent. | Every response the server sends — static, API, HTML. |
| **`React.lazy` / `Suspense`** | The platform's own splitting primitive, unused (zero dynamic imports). | All 34 pages. The fallback reuses the app's existing session-loading spinner — no new loading vocabulary. |
| **The `scoreCache` pattern** (`meals-page.tsx`) | PX1 §10 3.5 names it "the pattern to copy" — compute once, key by meal id. | `mealSearchText` — the lowercased search text, built once per library load instead of per meal per keystroke. |
| **`useDeferredValue`** | React's own mechanism for exactly this: urgent input, deferrable derived work. | The cookbook search pipeline (filter, fuzzy score, nutrition query key, pagination reset). |
| **`.webp` / palette PNG / intrinsic sizing** | Standard asset delivery, unused. | The five referenced decoration assets in § 2. |

**One new owner was created**, for a concern with no owner and 30+ rival
treatments (UIA §17's admission bar):

| New owner | What it owns | Promoted from (the seed) |
|---|---|---|
| `hooks/use-meals.ts` — **`invalidateMealLibrary(qc)`** | "The meal library changed." Invalidates the full-rows cache **and** the summary cache together, so a surface reading either can never be told stale meal names. | The `qc.invalidateQueries({ queryKey: ["/api/meals"] })` idiom copy-pasted across 16 files — each a correct half of the truth that had no way to learn about the other half. |

## 4. Components retired

Per UIA §17 (*retire-on-introduction* — name the predecessor, migrate every
consumer, delete it in the same change):

| Retired | Replaced by | Consumers migrated |
|---|---|---|
| **Direct invalidation/refetch of the meal-library keys** — 32 call sites in 16 files (`use-planner-operations`, `weekly-planner-page` ×5, `meal-detail-page` ×6, `quick-meal-page` ×3, `meals-page` ×4, `MealUpliftPanel` ×2, `scan-confirm-dialog` ×2, and 9 more) | `invalidateMealLibrary()` | All 32. Zero direct invalidations of either key remain outside the owner (grep-verified). `scan-confirm-dialog.tsx` is dead code on W4.7's deletion list; it was migrated anyway so no live-looking file models the retired idiom. |
| **`client/public/orchard-bg.png`** (2,023,987 B) | `orchard-bg.webp` (56,986 B) — same image, same URL scheme | All 6 reference sites (`orchard-backdrop`, `ui/dialog`, `onboarding`, `shopping-workspace`, `shopping-list`, `list-page`). The PNG is deleted, not left beside its successor. |
| **The ~25-family Google Fonts request** | A 2-family request for exactly what `index.css` defines | The one `<link>` in `client/index.html`. Un-ported scaffold, same lineage as W1's `hover-elevate`. |
| **Home's full-library subscription** (`useQuery(["/api/meals"])` on `home-experience-page`) | `useMealsSummary()` | The one consumer. The full contract remains canonical for surfaces that need ingredients (Cookbook search, Planner) — see § 5's deviation note. |
| **The per-keystroke meal-text rebuild** (`join(' ').toLowerCase()` inside the filter loop) | `mealSearchText`, computed once per library load | The one call site. |

---

## 5. What changed, by file

**New (1):** this document. **Deleted (1):** `client/public/orchard-bg.png`.

| File | Change |
|---|---|
| `server/index.ts` | `compression()` mounted before all handlers. The only `server/` change in W3. |
| `package.json` / `package-lock.json` | `compression` + `@types/compression`. |
| `client/src/App.tsx` | 34 eager page imports → `React.lazy`; `RouteFallback` (the existing spinner) inside the shell's `ErrorBoundary` so navigation never blanks the chrome; an outer `Suspense` for the routes outside the shell (auth, onboarding, shared, logged-out home). |
| `client/index.html` | Font request trimmed to `Inter` + `DM Sans`. |
| `client/src/hooks/use-meals.ts` | Exports `invalidateMealLibrary()`; its own two mutations adopt it. |
| `client/src/pages/home-experience-page.tsx` | Full-rows query → `useMealsSummary()`. Loading/error/empty behaviour (W0's) preserved exactly. |
| 14 files (`use-planner-operations`, `scan-confirm-dialog`, `PlannerAssistantPanel`, `AdaptationReviewSheet`, `RecipeScanReview`, `create-meal-modal`, `AddToWeekModal`, `PlannerAnalyserContent`, `MealUpliftPanel`, `PlannerMealPickerPanel`, `weekly-planner-page`, `quick-meal-page`, `meal-detail-page`, `meals-page`) | Direct meal-library invalidations → `invalidateMealLibrary()`. Per-meal keys (`[path, mealId]`) untouched. |
| `client/src/pages/meals-page.tsx` | `useDeferredValue` on the search pipeline; `mealSearchText` precomputed; nutrition query gains `placeholderData`; pagination reset keyed to the deferred term. |
| `client/src/components/MealImageWidget.tsx` | `loading="lazy"` + `decoding="async"` on the meal photo. |
| 6 files (backdrop, dialog, onboarding, shopping ×2, list-page) | `/orchard-bg.png` → `/orchard-bg.webp`. |
| 5 binary assets | Recompressed as § 2's table records. |

**One deliberate deviation from PX1's 3.3, recorded rather than papered over.**
PX1 says "Point Home **and `use-meals.ts`** at `/api/meals/summary`." Home is
pointed. `useMeals()`'s list is **not**, because its one list consumer is the
Cookbook, whose search matches on `meal.ingredients` (`meals-page.tsx`,
`scoreMealSearch`) — and the summary deliberately carries no ingredients.
Repointing it would have broken ingredient search: a product-behaviour change,
which this workstream is forbidden. PX1 itself grades effort as "a hint to be
checked against the code each finding cites"; checked, the hint was wrong. The
storm PX1 attributed to that repointing is defused by the other half of 3.3
(the invalidation owner) plus 3.1 (the refetch that remains ships at 60 KB, not
1.07 MB) — and the measured outcome (§ 8) is what the finding actually asked for.

**A working-tree note for HHP3.** `home-experience-page.tsx` carries HHP3's
uncommitted `import { HOUSEHOLD_HEALTH_PATH } from "@/pages/plant-diversity-page"`
— a page-to-page static import, the only one in the client. Under route splitting
it chains the plant-diversity chunk (246 KB) into Home's first load. It is not in
the W3 commit (it is HHP3's hunk, left exactly as found), but whoever lands HHP3
should move that constant to a non-page module so Home's chunk stays slim.

---

## 6. Remaining PX1 findings

**W3 closes 8 findings** (6 P1 · 2 P3). With W0's 10, W1's 9 and W2's 5, **32 of
PX1's 60 are closed; 28 remain**, unchanged and unstarted.

**P1 — 5 of 20 remain**, all W4's: `fnd-px-no-empty-state-owner` (W4.8) ·
`fnd-px-forms-unlabelled` (W4.1) · `fnd-px-icon-buttons-unnamed` /
`fnd-px-keyboard-unreachable` / `fnd-px-companion-not-a-dialog` (W4.2).

**P2 — 18 of 25 remain** (W3 closed none; W1 closed 4, W2 closed 3).
**P3 — 6 of 10 remain** (closed by W3: `fnd-px-oversized-assets`,
`fnd-px-images-not-lazy`; by W1: `fnd-px-undefined-utilities`,
`fnd-px-toast-over-nav`).

**Boundaries W3 touched and deliberately did not cross:**

- **`srcset` / server-side image resizing** does not exist (`sharp` not
  installed) and W3 did not build it; a household's 8 MB photo still downloads
  at 8 MB into a thumbnail — now lazily, off the first paint. The 15 MB upload
  limit (`routes.ts`) is likewise untouched.
- **The unreferenced decoration** (`apple-rating-1..5.png`, `logo-square.png`,
  ~2.7 MB) ships in `dist` but is never fetched by a household, so it is not a
  perceived-performance defect. Deleting dead assets is W4.7's hygiene sweep.
- **`Loader2` as the route fallback** is a deliberate reuse of the app's existing
  session-loading treatment, not an endorsement — the loading-vocabulary
  convergence onto `Skeleton` is W4.8's, and the fallback should adopt whatever
  W4.8 crowns.
- **`scan-confirm-dialog.tsx` and `ui/chart.tsx` stay dead** (0 importers, W4.7's
  list). W3 migrated the former's invalidations and left both files alive.

**The Adoption Register (PX1 §6 / W5.1) is still not built.** W3 changed row 13's
neighbourhood (the payload owner `/api/meals/summary` went from one consumer to
two) and created one owner of its own (`invalidateMealLibrary`) that is itself
unregistered — precisely the failure mode PX1 §4 describes. W5.1 remains the
workstream that ends it.

---

## 7. Architecture Compliance

- **Canonical ownership maintained.** W3 introduces no second owner:
  `invalidateMealLibrary` replaces an idiom that had no owner; every other change
  adopts an owner that already existed (`/api/meals/summary`, `useMealsSummary`,
  `compression`, `React.lazy`, the `scoreCache` pattern).
- **Retire-on-introduction honoured** (UIA §17): § 4's table — predecessors
  named, every consumer migrated, deletions in the same change.
- **No new experience principles, no new UX patterns, no redesign.** No surface
  looks or behaves differently; the harness asserts the same content renders.
  The one new visible state — the in-shell route fallback during a lazy load —
  is the app's existing spinner in the app's existing "content loading" slot.
- **EXP §17 Premium lens** — speed as *the perceptible result of care*: the
  product now downloads what the household needs, when they need it, once.
- **Intelligence architecture untouched.** No capability, binding, handler,
  engine or prompt was changed. W3's single server-side change is transport-level
  middleware.

### Definition of Done
- **Success:** every response compresses; a household's first load carries no
  admin code; Home renders from the summary without ever fetching the full
  library; mutations invalidate both meal caches through one owner; cookbook
  typing is responsive and fires ~1 nutrition request per search, not per key;
  the five referenced decoration assets total ~152 KB. **Verified — § 8.**
- **Must not break:** W0's loading/error/empty truth-telling on Home and
  Dashboard (same hooks, same flags — Home now reads them from the canonical
  summary hook); W2's touch behaviour; cookbook ingredient search (preserved by
  the § 5 deviation); the planner's meal resolution (full rows still fetched
  where consumed); every existing invalidation trigger (same triggers, one owner,
  two caches instead of one-and-a-half).
- **Manual test steps:** § 8's assertions are the executable form.

### Product Registry Impact
- **Registry affected: NO.** W3 adds no surface, route, page, dialog, capability,
  setting or claim. The same surfaces exist, reachable the same ways, rendering
  the same content — delivered smaller, later-what-can-wait, and compressed. The
  registry describes what THA *is*, and nothing about what THA is changed.
- Entries created: **NONE** · updated: **NONE** · retired: **NONE**
- Product knowledge written into a prompt, template, or fallback string: **NO**

### Data Impact
- Reads existing data: **YES** (Home reads the summary contract that already
  existed; no new reads) · Writes new data: **NO** · Changes meaning of existing
  data: **NO** · Requires backfill: **NO**.

### Trust Check
- **Could this mislead the user?** No. The nearest risk was cache staleness —
  a summary cache that outlives a mutation would show stale meal names in Home's
  "Today's Meals". That is exactly the defect `invalidateMealLibrary` closes,
  and it closes it for the Dashboard too, which had been quietly exposed to it
  since the summary contract was introduced.

---

## 8. Verification

| Gate | Result |
|---|---|
| `npm run typecheck:ci` | **PASS** — 168 known errors, baseline unchanged. **Zero** in `client/`. |
| `npx vite build` | **PASS** — entry 733,443 B (was 3,829,460 B single-chunk); 145 chunks. |
| `.engineering/scripts/repo-structure-verify.sh` | **PASS** — repository structure clean. |
| Built-artifact + wire assertions (below) | **PASS — 8 / 8.** |
| Behavioural harness (Playwright, live app, demo household) | **PASS — 14 / 14.** |
| W3-commit-in-isolation typecheck (the W0 § 9 method) | **PASS** — the commit stands without work it does not own. |

Built-artifact and wire assertions — the production build served by the
production server (`node dist/index.cjs`), measured with curl:

| # | Assertion | Measured | |
|---|---|---|---|
| 1 | Entry JS on the wire (Accept-Encoding: gzip) | **216,030 B** (was 965,407 B gzip-equivalent of the single chunk — and it shipped *raw* at 3,829,460 B) | PASS |
| 2 | `/api/meals` on the wire | 1,074,522 → **60,849 B** | PASS |
| 3 | `/api/meals/summary` on the wire | 690,844 → **28,260 B** | PASS |
| 4 | `dist/public` chunk count ≥ 100 (route splitting real) | **145** | PASS |
| 5 | `orchard-bg.png` absent from `dist`; `.webp` present at 56,986 B, `image/webp` | both | PASS |
| 6 | `tha-apple` hashed asset ≤ 25 KB | **22,095 B** | PASS |
| 7 | Built `index.html` font request names exactly 2 families | **2** | PASS |
| 8 | No direct `invalidateQueries`/`refetchQueries` on either meal key outside `invalidateMealLibrary` | **0** (grep, `client/src`) | PASS |

The behavioural harness (the W0–W2 method — chromium against the live dev server
and a real demo household at 390×844; dev because production cookies are `Secure`
per TRUST1-S2 and a plain-http harness cannot hold a session) asserted each
finding's condition as the browser computes it:

| # | What was asserted against the live app | Observed | |
|---|---|---|---|
| 1 | Demo household session established | `POST /api/demo/start → 201` | PASS |
| 2 | Home renders the greeting through the lazy route + Suspense | rendered | PASS |
| 3 | Served HTML's font request carries the two defined families only | `families=2`, no Poppins/Roboto/Montserrat | PASS |
| 4a | `/api/meals` (full rows) never requested on Home | 0 requests | PASS |
| 4b | `/api/meals/summary` requested on Home | requested | PASS |
| 5 | The summary response is compressed | `content-encoding: br` | PASS |
| 6 | No admin / recharts / zxing module fetched to render Home | 0 | PASS |
| 7 | The backdrop requests `orchard-bg.webp` | the webp, nothing else | PASS |
| 8a | Cookbook module loads on demand, not at first paint | on navigation | PASS |
| 8b | The shell (bottom nav) survives the lazy navigation | visible throughout | PASS |
| 9 | Typing "chicken" (7 keystrokes) fires ≤3 nutrition POSTs | **1 POST** | PASS |
| 10 | Search results still render (behaviour preserved through deferral) | 48 meal elements | PASS |
| 11 | Cookbook still fetches full rows (ingredient search intact) | fetched | PASS |
| 12 | The heaviest page (Planner) lazy-loads and renders | rendered | PASS |

Reproduce (the PDA1/W2 chromium method — Nix shared libraries on
`LD_LIBRARY_PATH`, 64-bit ELF only, glibc core excluded; demo-start rate limit
relaxed per W0):

```
PORT=<port> AUTH_RATE_LIMIT_MODE=log_only npm run dev &
NODE_PATH=<repo>/node_modules LD_LIBRARY_PATH=<chromium-libs> npx tsx <harness>
```

The harness itself is not committed, for W0's reason: it drives the app, it is
not part of it. Its fourteen assertions are reproduced above so they can be
re-derived.

---

## 9. What was committed

**Only PX1-W3.** The working tree carried, and still carries, ~100 files of other
workstreams' uncommitted work. Several files W3 had to change also contained some
of it — `meals-page.tsx` (CBK2), `home-experience-page.tsx` (HHP3, including the
chunk-chaining import § 5 flags), `weekly-planner-page.tsx` and
`PlannerAssistantPanel.tsx` (PLAN2), the shopping pages (SHOP1), and others.

Those files were committed with **W3's hunks only** — derived as the diff from
the `PX1W3_ROLLBACK` pre-work snapshot (which preserved the other workstreams'
state) to the finished tree, applied onto the PX1-W2 commit — and the other
workstreams' hunks were left uncommitted, exactly as they were found, exactly as
W0 (§ 9), W1 (§ 9) and W2 (§ 9) did. The commit's tree was then type-checked in
isolation (a detached worktree of the commit, W0's method) to prove W3 stands up
without work it does not own. It does.

---

_Implementation PX1-W3. It changes no law and adds no principle: it is the product finally delivering what [EXP §17's Premium lens](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) always demanded — care the household can feel, here as the absence of waiting for bytes they were never going to use. The remaining 28 findings are [PX1](./PX1_PLATFORM_EXPERIENCE_DISCOVERY_AND_ARCHITECTURE.md)'s, and the register that would have prevented all 60 is still W5.1's._
