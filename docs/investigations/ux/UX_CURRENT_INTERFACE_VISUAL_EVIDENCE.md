# UX — Current Interface Visual Evidence

**Investigation.** Point-in-time analysis, 2026-07-14. Owner: Colin Clapson.
**Status:** Complete.
**Governing architecture:** [`THA_EXPERIENCE_ARCHITECTURE.md`](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md),
[`THA_UI_ARCHITECTURE.md`](../../architecture/THA_UI_ARCHITECTURE.md),
[`REPOSITORY_CONVENTIONS.md`](../../architecture/REPOSITORY_CONVENTIONS.md).

**Rollback identifier:** `rollback/UX-current-interface-visual-evidence-20260714` → `f9c23c979a485f15df94f40de5b8f7bfd7dbd491`

> **This document photographs; it does not judge.** Its whole purpose is to make the
> current interface *visible* so that a design direction can later be argued from the
> real product rather than from memory. It therefore contains **no recommendation, no
> proposed visual direction, and no verdict on whether anything is good.** Where it
> records something surprising — a state with no owner, two components owning one
> concern — it records it as *what the camera saw*, not as a defect to fix. The
> judging happens next, somewhere else.

---

## 1. Mandate

Capture THA's current interface at desktop and mobile widths — every named surface,
plus representative components and every canonical state — using realistic
development-world data, fabricating no production data, and changing no UI,
behaviour, data or code.

## 2. Evidence location

| | |
|---|---|
| **Images** | [`docs/ui-audit/current-interface-snapshots/`](../../ui-audit/current-interface-snapshots/) — **137 images, 41 unique captures** |
| **Manifest** | `docs/ui-audit/current-interface-snapshots/manifest.json` — route, viewport, state, component, session, and induction method per image |
| **Method** | `docs/ui-audit/current-interface-snapshots/README.md` |
| **Reproducer** | `scripts/capture-ux-evidence.ts` |

**On the convention.** UX visual evidence lives in `docs/ui-audit/<slug>-snapshots/`
with a companion document — the precedent set by `WX9A` (40 tracked images at
`docs/ui-audit/wx9a-snapshots/`). This is deliberately **not**
`docs/product/assets/screenshots/`, which is the Product Knowledge Registry's
Screenshot Library and is bound by **Rule PKR10 — one owner per screenshot** (one
canonical image per surface). Writing 137 alternates into it would have created the
second owner that rule exists to forbid. This directory makes no claim on PKR10.

## 3. Data

Two pre-existing, fictional, DEV-only households — no production data, none invented.

| Session | Account | Contents |
|---|---|---|
| `household` | Chloe Price — `price.single.parent.owner@dev.thehealthyapples.dev` | **Development World.** 28 planner entries, 142 pantry items, 8 diary entries. The richest realistic data THA holds |
| `benchmark` | Harris Family — `john.harris.auto@benchmark.thehealthyapples.dev` | The **only** household with a real 7-item shopping list |
| `public` | none | Landing, Sign in, Not Found |

The Development World household has **no shopping list** — dev-world shopping lists
are derived on demand and never seeded. That is why Shopping appears twice below:
genuinely empty for the dev-world household, and populated for the benchmark one.
Both are real.

## 4. Viewports

| | |
|---|---|
| Desktop | **1440 × 900** |
| Mobile | **390 × 844** (iPhone-class; THA is mobile-first per the UI Architecture) |

Each surface is captured twice per width: `fold` (above the fold) and `full` (the
whole scrollable page).

---

## 5. Surfaces captured

All at both widths, in their natural state, on real Development World data.

| # | Surface | Route | State | Session |
|---|---|---|---|---|
| 01 | Home | `/home` | populated | household |
| 02 | Planner | `/planner` | populated | household |
| 03 | Cookbook | `/cookbook` | populated | household |
| 04 | Meal detail | `/meals/3653` | populated | household |
| 05 | Shopping workspace | `/shopping-workspace` | **empty** (this household has no list) | household |
| 05b | Shopping workspace | `/shopping-workspace` | **populated** (7 real items) | benchmark |
| 06 | Pantry | `/pantry` | populated (142 items) | household |
| 07 | Nutrition | `/plant-diversity` | populated (0 of 30 plants) | household |
| 08 | Profile / Household | `/profile` | populated | household |
| 09 | My Diary | `/my-diary` | populated | household |
| 10 | Analyser | `/analyser` | populated | household |
| 11 | Dashboard | `/dashboard` | populated | household |
| 12 | Partners | `/partners` | populated | household |
| 13 | Basket | `/basket` | populated | household |
| 13b | Basket | `/basket` | populated (7 real items) | benchmark |
| 14 | Landing (logged out) | `/` | populated | public |
| 15 | Sign in | `/auth` | form | public |
| 16 | Not Found | `/this-route-does-not-exist` | 404 | public |
| 21 | **Companion** | `/home` | drawer open | household |

**The Companion is not a page.** It is a floating button plus a right-side drawer
(`FloatingAssistant.tsx`), mounted once inside `ProtectedRoute` and therefore present
on *every* authenticated surface. It is captured closed (`20-companion-fab`) and open
(`21-companion-open`).

## 6. Components and interactions captured

| # | Component | Route | Note |
|---|---|---|---|
| 24 | `MealCard` | `/cookbook` | |
| 26a | Insight card — "A gentle reminder" | `/home` | |
| 26b | Insight card — Plant Diversity | `/home` | |
| 27a | **Primary** button | `/cookbook` | desktop: inline on the card · mobile: inside the action sheet |
| 27b | **Secondary** button | `/cookbook` | as above |
| 25 | Search | `/cookbook` | desktop: header input · mobile: a *different* input behind a toggle |
| 29a | Profile settings rows | `/profile` | |
| 29b | Profile feature toggles (`Switch`) | `/profile` | |
| 15 | Form (sign-in, react-hook-form) | `/auth` | the app's only real `<form>` — see §8 |
| 28 | `BottomNav` | `/home` | mobile |
| 36 | **Compact modal** — `AddToWeekModal` | `/cookbook` | `ui/dialog-foundation.ts` |
| 38 | Modal — "Who's eating this meal?" | `/cookbook` | audience picker, shown *before* an add completes |
| 22 | **Large workspace** — `CookbookWorkspacePanel` | `/cookbook` | desktop (`Overlay` → Dialog) |
| 23 | **Mobile bottom sheet** — same panel | `/cookbook` | mobile (`Overlay` → Drawer) |
| 37 | Meal action sheet (`vaul` Drawer) | `/cookbook` | **mobile only** |

## 7. States captured

| # | State | Where | Natural or induced |
|---|---|---|---|
| 30 | **Loading** — `Skeleton` / `RouteFallback` | `/home` | induced: every `/api/**` delayed 15 s |
| 32 | **Empty** — `EmptyState` (`variant=empty`) | `/shopping-workspace` | **natural** — the household genuinely has no list |
| 33 | **Empty** — filtered / no results | `/cookbook?q=…` | **natural** — a real search with no matches |
| 31 | **Error** — designed `LoadError` | `/home` | induced: `500` on `/api/home/intelligence` **only** |
| 31b | **Error** — total API failure | `/home` | induced: `500` on **every** `/api/**` |
| 16 | **Error** — 404 | `/this-route…` | **natural** |
| 34 | **Unresolved + Warning** — "Needs attention" | `/basket` | induced: `needsReview` flipped on **3 of the household's own 7 real items** |
| 35 | **Success feedback** — toast "Added to basket" | `/cookbook` | **natural interaction**; its two writes intercepted so nothing persisted |

**Induced means browser-only.** Loading, error and unresolved cannot be reached by
looking at a healthy surface, and the data that produces them exists on no household
we can authenticate as. They are induced by intercepting the API response the client
receives (Playwright `page.route`) — never by writing to the database. Every induced
shot carries its exact mechanism in `manifest.json`. No item, meal or household was
invented; the unresolved shot flips flags on items that already exist.

---

## 8. What the camera saw

Recorded as observations, not as findings to act on. This document proposes nothing.

**Warning has no owner of its own.** The unresolved state renders as an amber
`⚠ Check item` badge, but there is no `Alert` component and `Badge` has no `warning`
variant — warning is expressed ad hoc with amber classes and `AlertTriangle` across
roughly twenty files. `EmptyState` deliberately has no error variant; `LoadError`
owns error. So of the four states UI Principle 7 calls first-class (empty, loading,
error, disabled), **warning is the one with no canonical owner** — and it is the one
the product uses to tell a household something needs their attention.

**Total API failure renders a blank white page** (`31b`). The shell never mounts, so
neither `ErrorBoundary` nor `LoadError` is ever reached. Verified on `/home`,
`/dashboard` and `/pantry`, and still true with `/api/user` left healthy. The
designed error state (`31`) only appears when a *single section* fails while the rest
of the page stays up. There is no designed state for everything failing at once.

**Two components own the search concern.** At mobile width the canonical
`input-workspace-search` is in the DOM but hidden, and a second element,
`input-workspace-search-mobile`, is what the person actually types into.

**The mobile meal card is not the desktop meal card with less room.** The card's
primary and secondary buttons are present in the DOM at mobile width but hidden; the
same actions reappear inside a bottom sheet (`sheet-action-*`). Desktop has no action
sheet at all. The two widths use different mechanisms, not one responsive one.

**THA has almost no HTML `<form>`.** `/home`, `/profile` and `/cookbook` contain
zero `<form>` elements. Profile — the most form-like surface in the product — is
rows, switches and tabs. `useForm` appears in exactly two pages; the only genuine
form is the sign-in page.

**An "add" is a two-step interaction.** Adding a meal to the basket does not go
straight to feedback: it first asks *"Who's eating this meal?"* (`38`), and the
success toast only appears on the far side of that modal.

---

## 9. Surfaces NOT accessible

| Surface | Why | Consequence |
|---|---|---|
| **Admin** — `/admin` + 11 sub-routes | Gated on `user.role === 'admin'`. The three admin accounts are real (one is the product owner's). Reaching them requires a temporary privilege or credential change | **Declined by explicit decision** — the alternatives (promote a dev-world account, or set a temporary password on the `test1@test.com` test admin, the documented `BENCH1B`/`BENCH2` precedent) were both offered and both refused in favour of zero data change. **No admin visual evidence exists.** Any design work on admin will need this gap closed first |
| `/shared/:token` | Needs a live share token | Not captured |
| `/onboarding`, `/import-recipe`, `/quick-meal`, `/supermarkets`, `/products`, `/foods/:slug` | Reachable, but outside this pass's named scope | Not captured |

**Unresolved data does exist in the database** — 12 `needs_review` shopping items —
but every one belongs to an account whose password is unknown (`test1`–`test5`,
`colinclapson*`). That is why `34-unresolved` is induced rather than photographed
directly, and it is the only reason.

---

## 10. Changes made

**None to the product.** No UI, behaviour, data or code was changed.

Three files were **added**, all outside the application:

| File | Purpose |
|---|---|
| `scripts/capture-ux-evidence.ts` | The reproducer. Dev-only; imports nothing from the app; writes only into the snapshot directory |
| `docs/ui-audit/current-interface-snapshots/` | 137 images + `manifest.json` + `README.md` |
| `docs/investigations/ux/UX_CURRENT_INTERFACE_VISUAL_EVIDENCE.md` | This document |

**Zero-write, verified.** Database row counts taken immediately before and after the
capture run:

```
BEFORE  shopping_list(177): 7 | basket_items(177): 0 | basket_items(all): 54 | shopping_list(all): 1318
AFTER   shopping_list(177): 7 | basket_items(177): 0 | basket_items(all): 54 | shopping_list(all): 1318
```

**One correction is recorded rather than hidden.** While *discovering* which endpoint
produced the success toast, an exploratory probe let a real write through: it created
3 rows in `shopping_list` and 1 row in `basket_items` on the fictional benchmark
household. Both were identified, deleted, and the household verified back to its
seeded state (7 shopping rows, 0 basket rows) **before** the final capture run. The
final reproducer intercepts both write paths and persists nothing, which is what the
before/after counts above demonstrate. No dev-world household, and no real account,
was ever written to.

## 11. Rollback

| | |
|---|---|
| Tag | `rollback/UX-current-interface-visual-evidence-20260714` |
| Commit | `f9c23c979a485f15df94f40de5b8f7bfd7dbd491` |
| Covers | Committed state only |
| Does **not** cover | The pre-existing dirty working tree (uncommitted `.replit` / `docs/architecture/README.md` edits and ~40 untracked files, none authored here) |

The change is purely additive, so rollback is deleting the three added paths. Nothing
this work touched needs the tag to recover.

## 12. Next

A visual direction is **not** proposed here and must not be inferred from this
document. The evidence now exists; the argument comes next.
