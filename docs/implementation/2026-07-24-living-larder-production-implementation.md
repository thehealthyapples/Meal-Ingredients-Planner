# LIVING_LARDER_PRODUCTION_IMPLEMENTATION — the production Living Larder

**Date:** 2026-07-24 · **Branch:** `claude-work` · **Risk:** 🔴 RED · **Deployment:** NOT AUTHORISED — NOT DEPLOYED

The approved Living Larder now runs in the real application: a front-on
realistic elevation composed from the Home Owner's uploaded governed production
PNG assets, bound to the household's real Domain-30 staples, serving the
canonical `/pantry` route with the full interaction law (drag + accessible menu
parity, add-to-Shopping that never removes the staple, reversible removal,
search-to-add).

---

## 1. Architecture and owners (all preserved, none widened)

| Concern | Canonical owner | How this implementation touches it |
|---|---|---|
| Household staples (what the house keeps) | **Domain 30 — Pantry State** (`user_pantry_items`, sole writer `server/storage.ts`) | Read + existing mutations only (`GET/POST/PATCH/DELETE /api/pantry`, `/restore`). No new writer, no schema change. |
| What needs buying | **Domain 15 — Shopping State** (`shopping_list`) | Append-only via existing `POST /api/shopping-list` (`source: "pantry"/"household"`). Adding to Shopping **never** removes the staple (LARDER1 §8, verified live). Removing a staple touches no Shopping row. |
| Food identity | **Domain 2 — Canonical Food** (`shared/canonical/foods.ts`) | Unchanged; resolution stays server-side on add. The registers' `canonicalFoodMappings` remain curated, Domain-2-facing name lists. |
| Visual identity | **Life Register** (`client/src/components/layout/living-details-manifest.ts` §J/§P) + **House Register** (`docs/implementation/assets/house-asset-register.json`) | Extended through their own lifecycle law; verifier extended in the same change (J-checks + new P1–P3, K1–K2). |
| Companion | `pantry` capability | Untouched. The room still only *refers* (Smart suggestions door, About panel); it coaches nothing (GEA8/GEA21). |
| Room shell / navigation | AppShell / the one Home | Untouched. The room composes into `ProtectedRoute`/`AppShell`; no shell fork (GEA19). |

The Pantry→Larder rename remains **display-only** (LARDER1 §15): the route is
`/pantry`, the table is `user_pantry_items`, the capability id is `pantry`.
`/larder` (the old empty Pass-2 preview) now **redirects** to `/pantry` — one
room, no rival.

## 2. Rollback

| | |
|---|---|
| Rollback branch | `rollback/living-larder-production-implementation-20260724` → `77e907d7` |
| Dirty-tree snapshot | tag `rollback/living-larder-production-implementation-20260724-dirty` (`git stash create` object — preserves the pre-existing staged housekeeping and session-file edits without disturbing the index) |
| Rollback plan | `git checkout rollback/living-larder-production-implementation-20260724`; or on `claude-work`, revert the implementation commit(s). Assets under `client/src/assets/living-home/larder/` and the register/verifier changes revert with the same commit — no data migration to unwind (**zero schema/data changes**). |

## 3. Asset inventory

**Uploaded production pack** (`attached_assets/THA_Living_Larder_Assets/`,
untouched in place — the production source of truth; copies under
`client/src/assets/living-home/larder/` are the registered runtime files):

- **Jars (7)** — large: rolled-oats, white-rice, brown-rice, white-penne,
  plain-flour, sugar; small: chia-seeds. All 512×768 8-bit RGBA, transparent,
  blank chalkboard plates (runtime-text law holds).
- **Joinery (10)** — floating shelves (wide/medium/short), spice rack, double +
  single cupboards, deep + shallow drawer units, preparation table, side
  worktable. RGBA, transparent, one warm-oak/brass vocabulary, front elevation.
- **Produce (2)** — red apple (768×768), broccoli (768×768).
- **Recorded rejects (2, not used)** — `rejected/…-rejected-shadow-v1.png`
  (chia, apple) — the Home Owner's own curation, left archived.

**Registration:** the 7 jars replaced their procedural candidates through the
register's own lifecycle law (`promoteJarToCandidate` with new checksums →
`recordJarHomeOwnerApproval` bound to the exact uploaded bytes, citing the
2026-07-24 written instruction: *"The uploaded PNG assets are the production
source of truth"*). The 7 superseded procedural files are archived under
`docs/reference-assets/rejected/living-larder/…-procedural-v1.png` with
rejection records (evidence kept; J12 enforces they never reach runtime).
Produce entered a new §P register section sharing the **same** lifecycle
functions (genericised — one law, no second copy). Joinery entered the House
Register as 10 byte-locked rows (furniture is house-class: constant, no data
binding). **The 20 remaining procedural jar candidates, the empty jar and the
fallback-green jar received no approval and stay candidates: unavailable, out
of runtime** (their Home Owner review remains open).

**Register amendments in the same change:** `sizeClass` artwork fact
(large/small jar); curated mapping extensions to the real household vocabulary
("oats", "rice (basmati)", "flour — plain", "sugar (granulated)", red apple
varieties…) — ambiguous names (bare "rice", "pasta (dried)") deliberately left
unmapped; stale adoption-register orphan record for the manifest removed (it
now has a consumer).

## 4. Calibration result — PASS

Temporary dev-only page `/dev/larder-calibration` (since **deleted** — J7
permits only `larder-room.tsx` to reference the larder asset subtree)
composed: floating shelf + 4 large jars, small jar on the spice rack, double
cupboard, drawer unit, prep table with produce, at one cm→px scale.

Verified: **front-facing camera** on every asset · **believable relative
scale** (declared real-world cm per piece; 26 cm jars vs 80 cm cupboard vs
78 cm table) · **compatible lighting** (one soft warm frontal light, matching
shadows) · **correct baselines** (objects seated by measured alpha-content
boxes, never eyeballed) · **no clipping, blur or transparent halos** (alpha
verified programmatically: transparent corners, 42–84% genuine transparency).
Evidence: `evidence/2026-07-24-living-larder/calibration-desktop.jpg`.
Findings folded into production: small jars sit in front of the rack's solid
back panel (occlusion), penne/chia jars scale by content box (their artwork
sits smaller in-canvas), per-size-class label plate rectangles.

## 5. Files changed

| File | Change |
|---|---|
| `client/src/pages/larder-room.tsx` | **The production room** (was the empty Pass-2 CSS composition). PNG elevation + full interaction layer ported from `pantry-page.tsx`; the one declared asset mouth (J7). |
| `client/src/pages/larder-room.css` | Rewritten: physical composition (`.lv-*`), one `--lvcm` scale, reduced-motion rules, mobile stacking. |
| `client/src/pages/larder-room-metrics.ts` | NEW — measured artwork facts (canvas, alpha content boxes) + declared real-world sizes; pure numbers, no asset imports. |
| `client/src/pages/pantry-page.tsx` | **RETIRED** (deleted) — replaced by the room above (retire-on-introduction, Principle 8). Its interaction law lives on verbatim in `larder-room.tsx` (same mutations, same test ids). |
| `client/src/lib/larder-forms.ts` | RETIRED (deleted) — the SVG-glyph vocabulary the PNG assets replace. |
| `client/src/App.tsx` | `/pantry` → `LarderRoomPage`; `/larder` → redirect; `PantryPage` import removed. |
| `client/src/index.css` | Orphaned `.lardr-` glyph/furniture styles removed; shared interaction chrome (menus, dock, chips, add row) kept — one owner. |
| `client/src/components/layout/living-details-manifest.ts` | §J: 7 production checksums + checksum-bound Home Owner approvals + supersession records + `sizeClass` + curated mapping extensions; §P produce register (NEW); lifecycle functions genericised (one law). |
| `docs/implementation/assets/house-asset-register.json` | +10 byte-locked joinery rows. |
| `scripts/ci/verify-living-home-assets.ts` | +7 archived procedural filenames (J12); new checks P1–P3 (produce), K1–K2 (joinery); two stale pass-detail strings corrected. |
| `client/src/assets/living-home/larder/{jars,joinery,produce}/` | 7 replaced jar masters; 10 joinery + 2 produce files (NEW). |
| `docs/reference-assets/rejected/living-larder/` | 7 archived procedural jars + REJECTION_RECORD.md entries. |
| `docs/product/structure/pages/page-pantry.md`, `docs/product/inventory/product.{yaml,json}`, `docs/product/assets/screenshots/pantry.png` | Product Knowledge Registry entry updated + regenerated + fresh canonical screenshot (PKR Definition of Done). |
| `docs/implementation/ux/adoption-register.json` + `ADOPTION_REGISTER.md` | Stale manifest-orphan record removed; moved facts re-dated via `adoption:record`. |

## 6. Data impact

**None.** No schema change, no migration, no data rewrite, no new store, no
new endpoint. All writes go through the pre-existing Domain-30/15 mutations.
Canonical meaning preserved: the Larder is *what the household normally keeps*
— no quantities, fill percentages, expiry or second inventory were introduced
(the pre-existing `needQuantityValue` running-low flag is used exactly as
before, surfaced as text).

## 7. Accessibility

- **Every drag outcome has a non-drag equivalent**: each object is a `<button>`
  opening an action menu (Add to shopping · Mark running low · Move to… ·
  About · Take out) — keyboard, tap and switch users reach identical outcomes.
- Keyboard-only verified live: Tab → Enter opens the menu → menu buttons act
  (evidence `desktop-keyboard-menu.jpg`).
- Visible focus (`:focus-visible` outlines) on objects and furniture doors;
  cupboards/drawers are buttons with `aria-expanded`/`aria-controls`.
- Object names announce the household's words + state ("…, running low — open
  actions"); state is text, never colour alone ("Low" flag).
- Screen-reader announcements: all mutations speak through the existing toast
  system (radix-toast live regions), including failure messages.
- Reduced motion: the only motions are a hover lift and door-open reveal;
  both null under `prefers-reduced-motion` (evidence
  `desktop-reduced-motion.jpg`). Nothing animates continuously; no parallax,
  bounce or sparkle. Confirmation is always the state change, not the motion.
- Contrast: runtime chalk labels are white on near-black plates (≈15:1);
  captions/tags ≥ 4.5:1 against the plaster.
- **Gap (recorded):** no automated axe/a11y scanner exists in the repo, so no
  automated audit ran — the checks above are scripted-interaction and manual.

## 8. Desktop / tablet / mobile evidence

`docs/implementation/evidence/2026-07-24-living-larder/`:
wall + floor elevations (desktop), open cupboard and cold-store drawers with
real contents, added-to-shopping toast, failed-mutation toast, keyboard menu,
reduced motion, **empty larder** (honest composed emptiness: "0 items",
"Nothing on the table yet"), tablet, and the mobile vertical stack (same
assets, same identity). Horizontal overflow measured **0px at 1440 / 820 /
390**. Touch: dnd-kit TouchSensor (220ms hold) + tap menus; targets ≥ the
object size, min-height tags 26px + padding.

## 9. Tests, gates and build

| Gate | Result |
|---|---|
| `verify:living-home-assets` | **31/31 PASS** (14 pre-existing + J1–J12 + new P1–P3, K1–K2) |
| `tsc --noEmit` (changed files) | **0 errors** in everything this work touched |
| `typecheck:ci` | 16 regressions — **all pre-existing** in untouched `server/tests/*` (verified none reference changed files; this change is client-only). Baseline not re-recorded, per the gate's own rule. |
| `npm run build` | **PASS** (client + server bundles; larder assets emitted) |
| Targeted tests | pantry binding **47/47** · shopping binding **38/38** · SHOP1 **34/34** · pantry discovery **40/40** · shopping discovery **41/41** · canonical food **46/46** |
| `test:shop3-shopping-surface-convergence` | 27/29 — the 2 failures reproduce **identically on the pre-change tree** (verified in a clean worktree at the rollback commit); not introduced here |
| `adoption:check` | 98 passed · 10 failed — **9 identical pre-existing failures** (verified at the rollback commit) + `button-primitive` count 449→451 (+2 from the new furniture-door buttons; ceiling 442 was already breached before this change — recorded honestly, not absorbed) |
| `verify:publication` | 55 passed · 23 warned · 5 failed — the same pre-existing platform reds recorded in the session dashboard; no publication domain is touched by this change |
| Lint | **No lint script exists** in this repo (recorded; nothing skipped) |
| Aggregate `npm test` | **Not run in full** — known halting state (BENCHINT3, pre-existing, recorded in the session dashboard). Relevant suites run individually above. |
| Automated a11y scan | **Not run — no tooling in repo** (see §7 gap). |

## 10. Known limitations / missing assets (honest gaps)

- **Missing furniture assets:** fridge and freezer appliances, produce baskets,
  bottle run (oils & vinegars), tins/preserves shelf furniture. Interim: fridge
  and freezer staples live in the two oak drawer units, truthfully labelled
  "kept cold" / "kept frozen"; oils, vinegars, tins and everything else without
  a visual live behind the larder cupboard's doors as chalk tags.
- **Missing food visuals:** only 7 jar families + 2 produce masters are
  approved. Everything else renders as an honest chalk tag — never a redrawn
  jar or guessed food. The 20 procedural jar candidates await Home Owner
  review (their availability is fail-closed).
- The governed **fallback-green jar is itself unapproved**, so the visual-gap
  jar mechanism is dormant; the chalk tag is the interim gap presentation, and
  `larderVisualGapRegister` stays empty until the fallback jar is approved
  (recording gaps against an unusable fallback would be false).
- Jar chalk labels clamp to two lines (full name always in the accessible
  name); very long household names may render small.
- `button-primitive` adoption count +2 (see §9).
- The 390px nine-room bottom-nav overflow is a **pre-existing, separately
  recorded** platform issue (UX3 dashboard row), untouched here.

## 11. User acceptance steps

1. Open `/pantry` (or `/larder` — it redirects). The room should read as one
   warm oak larder: shelves with your real jars, spice rack, cupboards,
   cold-store drawers, the fruit on the preparation table.
2. Click/tap any jar, apple or tag → menu: **Add to shopping** — confirm the
   Shopping count rises and the item **stays** in the larder.
3. Drag any object onto **Shopping** / **Bin** in the dock; confirm the same
   outcomes; **Undo** on the bin toast restores it.
4. Open the larder cupboard, fridge/freezer drawers, household cupboard, pet
   corner — the doors reveal your real contents (or an honest "nothing yet").
5. Search "chia seeds" → Add → it appears as the small jar on the spice rack.
6. Keyboard only: Tab to an object, Enter, choose an action.
7. On a phone: sections stack vertically, nothing scrolls sideways.
8. OS reduced-motion on: no hover lift, everything still works.
9. Review §3: approve/reject the remaining 20 procedural jar candidates when
   ready (they stay invisible until checksum-bound approval).

---

**Implementation commit:** `50de9a35` on `claude-work`.
**Deployed:** NO.
