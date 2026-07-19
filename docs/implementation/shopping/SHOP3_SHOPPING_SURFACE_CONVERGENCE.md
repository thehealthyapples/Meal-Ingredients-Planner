# SHOP3 — Shopping Surface Convergence

**Date:** 2026-07-19
**Branch:** `int1-intelligence-platform`
**Risk:** 🔴 RED
**Reason:** Retires a live household-facing surface and deletes 7,773 lines of it. No new intelligence, no new architecture, no schema change — but a household's shopping list is the thing they shop from, and this moves where they do it. The safety argument for doing it is stronger than the risk argument for leaving it.

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Rollback tag | `rollback/SHOP3-shopping-surface-convergence-20260719` |
| Commit SHA | `772eb6edc7f2fe7b5ee1e7c0f7a6f54ee2a94360` |
| Rollback to committed state | `git checkout rollback/SHOP3-shopping-surface-convergence-20260719` |

> **⚠️ The working tree was DIRTY when this tag was taken** — 60 modified tracked files and 2 staged deletions from prior sessions (NUTPLAN1, COMP3, COMP4, GIT1 and others), authored by others. Per `ROLLBACK_PROTECTION_PROTOCOL.md` §3 a tag protects **committed state only**; it does **not** cover that uncommitted work. Snapshotted out-of-repo before any edit:
>
> - `…/scratchpad/pre-SHOP3-snapshot/uncommitted-tracked.patch` (5,464 lines)
> - `…/scratchpad/pre-SHOP3-snapshot/untracked.tar.gz`
> - `…/scratchpad/pre-SHOP3-snapshot/status.txt`
>
> The two files SHOP3 **deleted** were additionally snapshotted at the moment of deletion (§4 of the protocol) to `…/scratchpad/pre-SHOP3-snapshot/deleted/`, and removed with `git rm` so they are recoverable from history rather than only from that copy.
>
> SHOP3 touched no file in the pre-existing dirty set except `package.json` (test registration) and `docs/product/structure/routes/routes-map.md` (route record), both of which it changed additively.

---

## 1. SUMMARY

Shopping was served by **two live surfaces**. One of them could not warn a household about an allergy.

| | `/shopping-workspace` | `/basket`, `/analyse-basket` |
|---|---|---|
| In the nav | ✅ the only Shopping door | ❌ |
| Linked from Dashboard | ❌ | ✅ **three times** |
| Advertised in the other's footer | ✅ (pointed at `/basket`) | — |
| Nav pip lights up | ✅ | ✅ **— aliased to the workspace's pip** |
| **`shopping-restriction-conflict` card** | **✅** | **❌ no `AmbientIntelligence` at all** |
| Household eater profiles in analyser | ✅ | ❌ |

`shopping-restriction-conflict` is the **sole member of the closed `critical` allowlist** (`shared/attention/index.ts:136`) — raised when a product on the list conflicts with a named household member's **stored hard restriction**. A household with a recorded peanut allergy and peanut butter on the list saw a critical card on one door and **nothing** on the other. The server generator (`opportunity-engine.ts:465`) was sound and surface-agnostic throughout; the second client simply never asked.

The alias at `nav-bar.tsx:509` made this worse than a plain duplicate: it lit the "Shopping" pip on the unguarded door, so the household had **no visual signal they were anywhere else**.

**SHOP3 closed the second door.** `/basket` and `/analyse-basket` now redirect to `/shopping-workspace`; the duplicate page and its 3,531-line list renderer are deleted; every inbound link is repointed; and the eighteen capabilities that existed *only* on the retired surface were ported first, so nothing was traded for the safety fix.

### What SHOP3 cost, measured

| Metric | Value |
|---|---|
| Lines deleted | **7,773** (`shopping-list-page.tsx` 4,242 + `ShoppingListView.tsx` 3,531) |
| Lines added to the canonical surface | ~640 |
| Net | **−7,133** |
| New engines / capabilities / routes / tables | **0** |
| Schema changes | **0** |
| Server changes | **0** |
| tsc errors introduced | **0** (88 pre-existing, baseline exactly restored) |
| New assertions | **29** (SHOP3), all failing if the second door reopens |

---

## 2. THE LOAD-BEARING DECISION — port first, then retire

The mission allowed a cheaper fix: mount `AmbientIntelligence` on `/basket` so both doors warn. **SHOP1 had already considered and rejected exactly that** (`SHOP1:425-434`), on the grounds that a second ambient surface would *entrench* the duplication rather than resolve it, and named closing the duplicate as the correct fix. SHOP3 followed SHOP1's reasoning rather than re-deciding it.

That left the sequencing question, and it turned out to be the one that mattered.

### The audit's first answer was wrong, and checking it prevented data loss

The initial audit reported **two** capabilities unique to `/basket`: a "full product database" browse and an "Est. total". Both were wrong in a way that would have caused harm:

- **"Full product database" is not unique.** It is a *third* copy of `/products` + `/analyser` (`products-page.tsx:941` hits the same `/api/search-products` with a **superset** of filters — it adds `includeRegulatory`, `excludedAdditives` and `retailerFilter`). Porting it would have added a fourth. It was deliberately **not** ported; the workspace footer that advertised it now points at `/analyser`, where it actually lives.

- **The real gap was ~18 capabilities in three subsystems**, and one of them was a blocker: **`/shopping-workspace` had no single-item delete.** No `DELETE /api/shopping-list/:id` anywhere in the page. Redirecting `/basket` before porting would have removed the household's **only way to take one line off their shopping list** — a silent capability loss shipped under the banner of a safety improvement.

This is the argument for proving a differential rather than assuming one. The "retire first, port what's missed" sequencing was available and was explicitly rejected for this reason.

### The name collision that nearly merged two different facts

`/shopping-workspace` has a source filter called **`extras`**, meaning *"a manually added list item"* (`isItemInSource`, `shopping-workspace-page.tsx:399`). The retired surface read a table called **`shopping_list_extras`**, meaning *"a saved household staple, always in the basket"*. **Same word, different data, different lifetimes.** Wiring the existing filter to the table — the obvious-looking convergence — would have silently redefined a control the household already uses. They are kept apart, and §4 of the test records why.

---

## 3. ARCHITECTURE COMPLIANCE CHECKLIST

| Rule | Status | Evidence |
|---|---|---|
| No new engine | ✅ | Zero new modules under `server/intelligence/` or `server/lib/` |
| No new capability | ✅ | Capability registry untouched |
| No new route | ✅ | Two routes changed from page-render to redirect; none added |
| No schema change | ✅ | `shared/schema.ts` untouched |
| No server change | ✅ | `server/routes.ts` untouched; clear-by-source is client-side filtering over the existing `DELETE /api/shopping-list/:id` |
| Reuse existing capabilities only | ✅ | Every ported capability calls an endpoint that already existed and already had a caller |
| One owner per fact | ✅ | Shopping now reads the Pantry, the extras table and the price endpoints from **one** place each |
| Fails closed | ✅ | Retired paths redirect; they do not 404 and do not render |

---

## 4. DOMAIN IMPACT DECLARATION

| Domain | Impact |
|---|---|
| Shopping | **Converged.** One destination. Second surface retired. |
| Attention / critical allowlist | **Reach corrected.** `shopping-restriction-conflict` is now unavoidable on the Shopping surface — previously reachable only if the household happened to use the right door. |
| Pantry | Consumer count reduced by one (register updated, `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md:542`). |
| Analyser / Products | Gains the traffic that the retired browse panel was absorbing; footer pointer corrected. |
| Planner | Untouched. |

---

## 5. DATA IMPACT

**No migration. No schema change. No backfill.**

The household's saved state survives the move intact: the ported pricing layer keeps the **identical `localStorage` keys** (`tha-basket-retailers`, `tha-basket-tier`, `tha-basket-category-defaults`), so selected shops, price tier and per-category defaults carry over rather than resetting.

`shopping_list_extras` rows were previously readable **only** from the retired surface — the ~377 rows that `DCA1_USER_VISIBLE_DATA_COVERAGE_AUDIT.md:350` recorded as stranded off-nav. They are now reachable from the canonical room, so this closes a data-coverage defect as a side effect rather than creating one.

---

## 6. TRUST CHECK

| Question | Answer |
|---|---|
| Can this show a household a false safety verdict? | **No — it removes one.** The retired surface printed **"Industrial"** in red about an unrated banana. |
| Can this hide a real safety warning? | **No — it stops one being hidden.** That was the defect. |
| Does anything fabricate a number? | **No.** Estimated prices are rendered with a `~` prefix and the total is labelled *"incl. estimates"*; a total with nothing behind it renders `-`, not `£0.00`; the average Apple Score **excludes** unrated items rather than counting them as zero. |
| Can a household lose data? | **No.** Every capability was ported before the door closed, proven by §4 of the test. |
| Are bookmarks broken? | **No.** Both retired paths redirect rather than 404. |

### The fabrication that was fixed, then deleted

`shopping-list-page.tsx:1150` rendered `(item.thaRating ?? 0) >= 4 ? 'Clean' : … : 'Industrial'`. The guard was `canShowScoreForItem`, which answers *"may this item display a score"* — **not** *"does it have one"*; a whole food passes it with a `null` rating (`basket-item-classifier.ts:55`). So an unrated banana passed the gate, `?? 0` became the worst branch, and the household was told their banana was **Industrial**. SHOP2 ranked fixing it *"first among the fixes"*.

**Reported honestly:** this was fixed early in the session (four sites: the verdict plus three 0-apple renders) as insurance in case the session stopped before retirement landed — and then the file was deleted, which makes the fix moot in the final tree. **The fabrication is gone by deletion, not by correction.** What matters for the shipped product is that the canonical surface never had it: verified, `shopping-workspace-page.tsx` contains no `Industrial` verdict and feeds no `AppleRating` a coerced null (§5 of the test locks both).

---

## 7. ARCHITECTURE CONVERGENCE STATUS

`fnd-shopping-duplicate` — **RESOLVED.**

SHOP1 identified it and declined to fix it in-scope. SHOP2 ranked *"put the safety card on the other door, or close the door"* as its third recommendation and called the restriction-conflict architecture *"the best architecture this 4-room audit touched"* — while noting it was absent from the other door, which it flagged as **"the finding to act on"**. SHOP3 closed the door.

`fnd-alias-sprawl` — **partially reduced.** `/basket` and `/analyse-basket` are no longer a distinct destination. The remaining sprawl (`/meals`+`/cookbook`, `/products`+`/analyser`, `/planner`+`/weekly-planner`, `/diary`+`/my-diary`) is alias-only and **no longer hides a divergent surface** — which was the part that could hurt someone.

---

## 8. CHANGES MADE

### Deleted (2) — 7,773 lines

| File | Lines | Why |
|---|---|---|
| `client/src/pages/shopping-list-page.tsx` | 4,242 | The duplicate Shopping surface |
| `client/src/components/ShoppingListView.tsx` | 3,531 | Its list renderer — consumed by that page **only** |

Verified at the moment of deletion per protocol §4: canonical page present, **zero** importers, snapshot taken, removed with `git rm`.

> `ShoppingListView` was evaluated as a *convergence target* — mounting it inside the workspace would have reused an existing component instead of transcribing one. It was rejected: it carries its own internal phase model (`cupboard_check` / `shopping`) that collides with the workspace's mode model (`review` / `shop` / `prep` / `add`), so mounting it would have put **two list renderers and two mode models inside the canonical surface** — entrenching the duplication one level down. Its props interface was used as a *specification* of the gap instead.

### Modified (9)

| File | Change |
|---|---|
| `client/src/pages/shopping-workspace-page.tsx` | Received all three ported subsystems (~640 lines) |
| `client/src/App.tsx` | `/basket`, `/analyse-basket` → `Redirect`; lazy import removed |
| `client/src/pages/dashboard.tsx` | Three `/basket` links → `/shopping-workspace` |
| `client/src/components/nav-bar.tsx` | Alias removed |
| `client/src/components/workspace-header.tsx` | `isBasketActive` narrowed to the canonical path |
| `client/src/components/conversation/FloatingAssistant.tsx` | Surface regex narrowed to `/^\/shopping/` |
| `scripts/capture-product-screenshots.ts` | `basket` target removed |
| `scripts/capture-ux-evidence.ts` | Three `/basket` captures repointed |
| `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` | Pantry consumer list corrected |
| `docs/product/structure/routes/routes-map.md` | Route record updated |

### Created (1)

| File | Purpose |
|---|---|
| `server/tests/test-shop3-shopping-surface-convergence.ts` | 29 assertions |

### Ported — the three subsystems

**1. Deletion granularity** (the blocker) — `removeItem` mutation with optimistic update and rollback; per-row remove control (`ws-remove-btn-*`); clear-by-source dialog (planned / quick list / all). Clear-by-source is client-side filtering on the `quick_list_` basket-label prefix over the existing single-delete endpoint — **exactly as the retired surface did it**, so no server change.

**2. The pricing layer** — `/api/shopping-list/prices` and `/api/shopping-list/total-cost` had **zero callers** on this surface. Ported: both queries; `selectedRetailers` / `globalBasketTier` / `categoryDefaults` state with identical `localStorage` keys; `getCategoryDefault`, `getEffectiveTier`, `resolveItemPrice`; `clientBestTotal`, `estimatedExtra`, `avgThaRating`, `comparisonMatrix`, `currentByRetailer`; the basket-total strip, the retailer × tier comparison table, the per-item price control, the per-item comparison dialog with item- and category-level tier overrides, and the global tier preference (`/api/user/price-tier`). Plus `basketResult.estimatedTotal`, which was **already carried in this page's state and simply never rendered**.

**3. The extras table** — `/api/shopping-list/extras` had **zero callers** on this surface. Ported: the query, add / delete / update mutations (update optimistic with disclosed rollback, per PX1-W0), and an "Always in basket" section. Kept deliberately separate from the identically-named source filter (§2).

### Deliberately NOT changed

- **`server/lib/routing.ts:104`** — `pathToRoute("/analyse-basket") → "analyser"`. This maps a **stored** routing-correction destination from historic `product_events` rows. It is now arguably wrong (the browser path redirects to Shopping, not the Analyser), but changing it rewrites the meaning of historic household corrections, which is a behaviour change to stored intelligence data and outside this scope lock. **Reported, not fixed** — see §11.
- **The "full product database" browse panel** — a third copy of `/products`; porting it would have made a fourth (§2).
- **The 3-up "compare options" analyser layout** — a presentational duplicate of a serial view the canonical sheet already provides.
- **`/api/ingredient-products/lookup`** — internal catalogue enrichment, not a household capability.
- **The two pre-existing coherence failures** — Domain 34's missing source row and the `pantry-intelligence-assembler.ts:140` citation. Both stem from a *prior* session's staged deletion, present before SHOP3 began. Per protocol §3, uncommitted work authored by others is not touched.

---

## 9. VALIDATION PERFORMED

| Check | Result |
|---|---|
| `npm run test:shop3-shopping-surface-convergence` | **29 passed, 0 failed** |
| **Regression-detection proof** | Reopened `/basket` as a page → **3 assertions failed**; restored → 29 pass. The test is not vacuous. |
| `npx tsc --noEmit` | **88 errors — pre-existing baseline exactly restored, 0 introduced** (checked after each subsystem, not just at the end) |
| `npm run build` | ✅ client + server bundles clean |
| `npm run verify:coherence` | 3 failures → **2**. The one SHOP3 introduced was fixed; the 2 remaining are pre-existing and not SHOP3's to fix. |
| Shopping suites | `shop1` 34/34 · `intelligence-shopping-binding` 38/38 · `intelligence-shopping-discovery-binding` 41/41 |
| Attention / critical allowlist | `attn1` 29/29 · `home2` 47/47 · `dec1` 49/49 · `intelligence-food-opportunity-binding` 99/99 · `hnp2` 43/43 |
| Safety suites | `restriction-safety` 75/75 · `prod3` 36/36 · `prod6` 158/158 · `surf1b` 54/54 |
| Other bindings | `intelligence-platform` 33/33 · `planner` 35/35 · `pantry` 47/47 · `analyser` 30/30 · `mat1` 25/25 · `household-nutrition` 54/54 |

**Total: 771 assertions across 19 suites, 0 failures.**

### Verification caveat, surfaced not buried

The repo's aggregate `npm run test` is **known to halt at suite 103 of 160** (`test:benchmark-conversation-isolation`), a pre-existing failure recorded in COMP4's report. SHOP3 therefore ran targeted suites directly rather than relying on the aggregate, and selected them by *reachability from the changed code* — the shopping domain, the critical allowlist that the safety card belongs to, and the safety suites that would notice if restriction handling moved. **The aggregate was not run to completion, and this report does not claim it was.**

---

## 10. DEFINITION OF DONE

| Objective | Status |
|---|---|
| Audit both Shopping experiences | ✅ Full differential, file:line, 53 capabilities classified |
| Preserve every existing capability | ✅ 18 ported; 4 deliberately not, each with a stated reason; §4 of the test locks the three subsystems |
| Converge duplicate UX | ✅ One list, one mode model, one renderer |
| Resolve the safety behaviour divergence | ✅ The unguarded door no longer exists |
| Remove duplicate ownership | ✅ 7,773 lines deleted; Pantry, extras and price endpoints each have one Shopping consumer |
| Produce one canonical Shopping destination | ✅ `/shopping-workspace`; all other paths redirect to it |

---

## 11. SCOPE LOCK

**Held.** No new intelligence, no new architecture, no schema change, no new capability, no server change. Every ported capability calls an endpoint that already existed and already had a caller elsewhere.

### Follow-ons — reported, not built

1. **`server/lib/routing.ts:104`** (§8). Decide whether historic `/analyse-basket` corrections should resolve to `analyser` or `shopping`. Needs a product decision about stored household corrections, not a code change.
2. **Client-side reasoning drift** — SHOP1's open follow-on stands: `analyser-choice.ts` and `whole-food-alternatives.ts` reason on the client and **can drift from the server generator**, showing a household two different verdicts about the same product. SHOP3 reduced the surface area (one fewer client doing it) but did not close it.
3. **Catalogue-product `?? 0` renders** — `WorkspaceAnalyserSheet.tsx:761` and `analyser/AnalyserDetailV2.tsx:342,391` feed `AppleRating` a coerced null for *analysed catalogue products*. Lower risk than the list-item case fixed here (ranked choices generally carry analysis), but it is the same pattern and should be swept.
4. **No test covered `/basket`.** Nothing in the suite would have failed if that page had been deleted at any point in its life. The new SHOP3 file is the first test to assert anything about which Shopping surfaces exist.

---

## 12. THE HONEST STATE OF IT

The safety divergence is closed, and closed *structurally* — not by adding a second warning, but by removing the place where the warning was absent. A household can no longer reach a Shopping list that cannot tell them about their own allergy, because there is only one Shopping list.

Two things a reviewer should weigh:

- **This is a RED change on a live household surface.** 7,773 lines were deleted. The differential behind that deletion was proven capability-by-capability rather than assumed, and the one capability whose absence would have been silent (single-item delete) was found precisely *because* the differential was proven. But the ported pricing layer is ~640 lines of newly-written UI that has been typechecked, built and asserted against — **not** exercised by a household. Visual verification on the canonical surface is the obvious next step and has not been done.
- **The audit was wrong the first time.** Its two headline findings were both incorrect — one capability was a triplicate that should not be ported, and the real blocker was not on the list at all. That error was caught by demanding file:line proof of the differential before writing code. It is recorded here because the same failure mode is available to the next session that converges two surfaces by reading their feature lists instead of their call graphs.
