# THA Current Interface — Visual Evidence Snapshots

_Captured 2026-07-14 for [`UX_CURRENT_INTERFACE_VISUAL_EVIDENCE.md`](../../investigations/ux/UX_CURRENT_INTERFACE_VISUAL_EVIDENCE.md). Owner: Colin Clapson._

**137 images · 41 unique captures · desktop 1440×900 and mobile 390×844.**

This is a photograph of the product as it exists today, taken so that a design
direction can be argued from the real interface rather than from memory. It
**recommends nothing** and it **changed nothing**.

## What this is not

This is **not** the Product Knowledge Registry's Screenshot Library
(`docs/product/assets/screenshots/`). That library owns *the* canonical image of
each surface under **Rule PKR10 — one owner per screenshot**, and it holds exactly
one mobile image per surface. This directory is *UX evidence*: many images per
surface, at two widths, across states and components, for a design investigation.
It follows the precedent of `docs/ui-audit/wx9a-snapshots/` (WX9A) and makes no
claim on PKR10's ownership.

## How it was captured

```bash
# dev server must be running on :5000
LD_LIBRARY_PATH=<chromium-libs> npx tsx scripts/capture-ux-evidence.ts
```

`scripts/capture-ux-evidence.ts` is the single reproducer. `manifest.json` is its
machine-readable output: one record per image, carrying **route, viewport, state,
component, session, and how the state was induced**.

**On the library path.** The environment ships chromium but not the system shared
libraries it links. All are present in the Nix store; putting the 64-bit ones on
`LD_LIBRARY_PATH` (the store also holds 32-bit builds, which fail with
`wrong ELF class: ELFCLASS32`) lets chromium launch. Same method as PDA1.

## Data — real, and nobody's

Two pre-existing, fictional, DEV-only households. No production data, no invented data.

| Session | Account | Why |
|---|---|---|
| `household` | `price.single.parent.owner@dev.thehealthyapples.dev` (Chloe Price) | A **Development World** household — the richest realistic data THA has: 28 planner entries, 142 pantry items, 8 diary entries |
| `benchmark` | `john.harris.auto@benchmark.thehealthyapples.dev` (Harris Family) | The only household with a **real 7-item shopping list**. Dev-world shopping lists are derived on demand and never seeded, so Shopping could not otherwise be shown populated |
| `public` | none | Landing, Sign in, Not Found |

## Zero-write — verified

The capture performs **no database write of any kind**. It creates no account and
invents no data. Row counts were taken immediately before and after the run:

```
BEFORE  shopping_list(177): 7 | basket_items(177): 0 | basket_items(all): 54 | shopping_list(all): 1318
AFTER   shopping_list(177): 7 | basket_items(177): 0 | basket_items(all): 54 | shopping_list(all): 1318
```

The one interaction that would normally write — the click behind the success toast —
fires **two** writes (`POST /api/user-basket` and `POST /api/shopping-list/from-meals`).
Both are intercepted in the browser and answered locally with `200`, so the toast is
genuine UI and neither write reaches the server.

## Natural vs induced

A shot is **natural** unless `manifest.json` marks it `induced`. Loading, error and
unresolved cannot be reached by looking at a healthy surface, and the data that
produces them exists on no household we can authenticate as. Those four are induced
**in the browser only** (Playwright `page.route`), never in the database:

| Shot | How it was induced |
|---|---|
| `30-loading` | every `/api/**` response delayed 15s, so the skeletons stay on screen |
| `31-error` | `500` on `/api/home/intelligence` **only** — every other endpoint healthy |
| `31b-error-total-api-failure` | `500` on **every** `/api/**` |
| `34-unresolved` | `GET /api/shopping-list` rewritten to set `needsReview` on **3 of the household's own 7 real items**. No item invented |

Everything else — including both empty states, every modal, both drawers, and the
success toast — is the product behaving normally.

## Naming

`<id>-<surface>-<desktop-1440\|mobile-390>-<fold\|full>.png` — the WX9A convention.
`fold` is above-the-fold; `full` is the whole scrollable page. Component close-ups
(buttons, cards, search, nav) carry no `fold`/`full` suffix.

## Not captured

- **Admin** (`/admin` + 11 sub-routes). Gated on `user.role === 'admin'`; the three
  admin accounts are real. Reaching them needs a temporary privilege or credential
  change, which was **declined by explicit decision**. Recorded, not hidden.
- **`/shared/:token`** (public shared-plan view) — needs a live share token.
- **`/onboarding`, `/import-recipe`, `/quick-meal`, `/supermarkets`, `/products`,
  `/foods/:slug`** — reachable, out of scope for this pass.
