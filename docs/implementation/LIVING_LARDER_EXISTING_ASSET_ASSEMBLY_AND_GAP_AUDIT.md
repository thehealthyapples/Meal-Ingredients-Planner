# Living Larder — Existing-Asset Assembly & Gap Audit

**Date:** 2026-07-31
**Authoritative branch:** `feat/living-larder-authoritative`
**Rollback:** `rollback/larder-room-assembly-base` → `3af5759e`
**Scope:** Assemble/present the Living Larder room from existing assets; discover gaps. **No image generation.** No push/merge/deploy.

## Header

- **AUTHORITATIVE BRANCH:** `feat/living-larder-authoritative` (commit `3af5759e`)
- **ROLLBACK IDENTIFIER:** `rollback/larder-room-assembly-base` → `3af5759e`
- **EXISTING JARS FOUND:** 27 masters (`client/src/assets/living-home/larder/jars/`) — **7 approved** photoreal clip-top masters (rolled-oats, white-rice, brown-rice, white-penne, plain-flour, sugar, chia-seeds) + **20 candidate** procedural jars (unapproved, kept out of runtime).
- **EXISTING ROOM / SHELF ASSETS FOUND:** 10 joinery masters (`joinery/`): floating-shelf oak wide/medium/short, floating spice-rack, cupboard oak single/double, drawer-unit oak deep/shallow, preparation-table, side-worktable. No photoreal room **shell/backdrop** asset on this branch (Candidate-07 shell was v2-only and tied to the D-018-rejected composition; not carried over).
- **EXISTING PRODUCE / BASKET / CROCK ASSETS FOUND:** 2 produce (`produce/`): apple-red, broccoli. **No baskets. No crocks.** 6 environmental-dressing SVGs (`dressing/`): spring-flowers, summer-fruit, autumn-pumpkins, autumn-folded-blanket, winter-evergreens, standing-welcome-bowl-of-apples.
- **MISSING ASSETS NOT YET PROVEN:** photoreal room shell/backdrop; baskets (produce/bread/potato/onion/garlic); glass bottles (oil/vinegar/milk) + small spice jar; ceramic crocks/bowls; cold storage (fridge/freezer); wider produce range; herbs/pendant light. Full list below.

## Assembly result

The existing room implementation (`client/src/pages/larder-room.tsx`, the single declared Life-asset "mouth") **already assembles the room**: it imports the 10 joinery masters and the 7 **approved** jar masters, places them on shelves via the cm-scaled furniture-plane layout (`larder-room.css`, `--lvcm`), renders the 2 produce items, and — per the Life Register lifecycle (§ J) — keeps the 20 **candidate** jars out of runtime, showing an **honest chalk-tag gap** (the household's own words) where no approved master exists. Interaction (dnd-kit drag + Popover non-drag menu) and responsive behaviour are preserved.

**No code change was required or made** — the room is correctly assembled to spec on the baseline. Forcing the 20 candidates into runtime would violate J7 and require a Home Owner approval I must not declare. This task therefore verifies, presents and audits; it does not modify the room.

## Files changed

- `docs/implementation/LIVING_LARDER_EXISTING_ASSET_ASSEMBLY_AND_GAP_AUDIT.md` (this report).
- `docs/implementation/assets/larder-room-review/larder-room-desktop-review.png`
- `docs/implementation/assets/larder-room-review/larder-room-mobile-review.png`
- `docs/implementation/assets/larder-room-review/approved-jars-contact.png`

(No source/asset/register/verifier files were modified.)

## Exact existing assets used (in the room + review evidence)

- **Shelves:** floating-shelf oak wide / medium / short.
- **Approved jars (7):** rolled-oats, white-rice, brown-rice, white-penne, plain-flour, sugar, chia-seeds.
- **Produce (2):** apple-red, broccoli.
All are RGBA transparent production masters already committed on the branch.

## Review evidence

Static compositions built from the **actual approved production assets** on the real shelf masters (warm asset lighting), at desktop and mobile framings, plus an approved-jars contact sheet — under `docs/implementation/assets/larder-room-review/`.

**Boundary (CAPBOUND1 — honest classification):** a *live* `/pantry` screenshot could not be produced here. The route is data-driven (household staples, Domain 30), auth-gated (`ProtectedRoute`), and runs on a full server (`tsx server/index.ts`) needing `node_modules` (absent in this fresh worktree), a database, and Replit-era packages this baseline predates. **Attribution Test:** a different implementer on the Linux CI with the DB and installed deps *would* render it → **External Dependency / Repository (environment) boundary, not a THA limitation and not a Model Capability Gap of the design.** The review evidence above is a faithful composition of the real assets, explicitly labelled as such — not a live render, and not a substitute for the Home Owner viewing the running room.

## Validation results

`npx tsx scripts/ci/verify-living-home-assets.ts` (verifier run via network-fetched tsx; it only reads files):

- **Every jar / room / produce / joinery check PASSES:** J1–J6, J8–J11 jars; P1–P3 produce; K1–K2 joinery. 27 jars well-formed (512×768 RGBA, transparent, genuine alpha, no baked-label metadata); 7 approved checksum-bound; 20 candidates correctly unavailable; exports honest (7 included / 20 excluded, complete=false); no orphans/strays.
- **Windows path-separator artifact (not real drift):** as-committed, 4 checks (orphans, dressing-mouth, J7 one-mouth, J12 rejected-predecessor) FAIL on Windows because the verifier compares POSIX (`/`) string constants against `relative()` output that uses `\` on Windows — it even flags the declared mouth itself. A temporary local normalization (`relative(...).split(/[\\/]/).join('/')`, reverted, not committed) makes these 4 PASS → **30/31**. On the canonical Linux CI they pass unmodified.
- **1 genuine pre-existing failure (not introduced here, not the jar room):** "Every dressing asset byte-locked to its item checksum" — the 6 SVG dressing assets are not checksum-bound in the Life manifest (the Dressing register ED2/LH1 is not fully built). Recorded as a gap; out of scope for this jar-room task.

No runtime regression introduced (zero code change). Jars remain reusable production assets; desktop and mobile layouts unchanged.

---

## Complete missing-asset list

Legend — **Reuse?** = an existing asset can serve; **Gen?** = new creation required (blocked in this task); **Approval?** = asset exists as candidate, needs Home Owner approval not generation.

### 1. Required structural assets
| Asset | Family | Location | Purpose | Priority | Launch? | Reuse? | Gen? | Owner / register | Depends on |
|---|---|---|---|---|---|---|---|---|---|
| Photoreal room shell/backdrop | room shell | walls/aperture/floor behind furniture | the room itself (North Star warmth, orchard light) | P1 | Required | No (Candidate-07 shell not on this branch) | Yes | LARDER1/LARDER2 · House Register | — |
| Corner shelf | joinery | wall corner | reach the corner storage | P3 | Optional | Partially (existing shelves) | Yes | ASSET1 A1 · House Register | room shell |
| Tall pantry cupboard | joinery | end of a run | bulk/overflow anchor | P3 | Optional | Partially (existing cupboards) | Yes | ASSET1 A2 · House Register | room shell |

### 2. Required storage vessels
| Asset | Family | Location | Purpose | Priority | Launch? | Reuse? | Gen? | Owner / register | Depends on |
|---|---|---|---|---|---|---|---|---|---|
| 20 unapproved staple jars | glass jar | shelves | show the household's real staples instead of chalk gaps | P1 | Required | **Exists as candidate — needs APPROVAL, not generation** | No | Life Register § J | Home Owner review |
| Small spice jar | glass | spice rack | individual spices | P2 | Optional | No | Yes | ASSET1 C4 · Life Register | spice-rack (have) |
| Oil bottle | glass | shelf/counter | cooking oil, read by level | P2 | Optional | No | Yes | ASSET1 C5 · Life Register | — |
| Vinegar bottle | glass | beside oils | vinegar | P3 | Optional | No | Yes | ASSET1 C6 · Life Register | oil bottle |
| Milk bottle | glass | (fridge) | daily milk | P3 | Optional | No | Yes | ASSET1 C7 · Life Register | fridge |
| Flour/salt/sugar crock, tea caddy, coffee jar | ceramic | shelves | ceramic keeping (design currently uses jars for these) | P3 | Optional | Partial (jars cover flour/sugar) | Yes | ASSET1 D1–D5 · Life Register | — |

### 3. Required produce / food assets
| Asset | Family | Location | Purpose | Priority | Launch? | Reuse? | Gen? | Owner / register | Depends on |
|---|---|---|---|---|---|---|---|---|---|
| Produce basket | basket | worktop/lower shelf | hold loose fruit & veg (the "most alive" object) | P2 | Optional | No | Yes | ASSET1 E1 · Life Register | — |
| Bread / potato / onion / garlic baskets | basket | lower shelves/floor | staple produce storage | P3 | Optional | No | Yes | ASSET1 E2–E5 · Life Register | produce basket |
| Wider produce range (orange, carrot, onion, potato, lemon, banana, tomato…) | produce | baskets/bowls | fill baskets/bowls credibly | P3 | Optional | Partial (apple, broccoli exist) | Yes | Produce register (P) | baskets |
| Tin (tomatoes/beans/fish) | packaging | cupboard/shelf | tinned staples | P3 | Optional | No | Yes | ASSET1 F6 · Life Register | — |

### 4. Required environmental dressing
| Asset | Family | Location | Purpose | Priority | Launch? | Reuse? | Gen? | Owner / register | Depends on |
|---|---|---|---|---|---|---|---|---|---|
| Standing-welcome bowl of apples | dressing | worktop | warmth (already an SVG) | P2 | Optional dressing | **Exists (SVG)** — needs checksum byte-lock (D8) | No | LIVINGHOME2/LHDC1 · Dressing register | Dressing register build |
| Herb pot | dressing/decor | shelf/sill | growing herbs (North Star "herbs") | P3 | Optional dressing | No | Yes | ASSET1 H4 · Dressing register | — |
| Pendant light / under-shelf light | decor | above worktop | warm room lighting | P3 | Optional dressing | No | Yes | ASSET1 H1–H2 | room shell |
| Linen cloth, wall hooks | decor | hooks/rail | lived-in detail | P4 | Optional dressing | No | Yes | ASSET1 H3/H7 | room shell |

### 5. Optional seasonal assets
| Asset | Family | Location | Purpose | Priority | Launch? | Reuse? | Gen? | Owner / register | Depends on |
|---|---|---|---|---|---|---|---|---|---|
| Spring flowers / summer fruit / autumn pumpkins / autumn blanket / winter evergreens | seasonal dressing | worktop/shelf | quiet passage of the year | P4 | Optional seasonal | **Exist (SVGs)** — need checksum byte-lock (D8) & celebration-gating | No | LIVINGHOME2 (ED, season-gated) · Dressing register | Dressing register build |
| Christmas wreath | seasonal dressing | door | the one occasion-gated dressing | P4 | Optional (celebration-gated) | No | Yes | LIVINGHOME1 ladder amendment | declared occasion + permission |

### 6. Assets already present and reusable
| Asset | Family | State |
|---|---|---|
| 7 photoreal clip-top jars (oats, white/brown rice, white penne, flour, sugar, chia) | glass jar | **Approved**, in runtime |
| 20 procedural staple jars | glass jar | **Candidate** (files + checksums present; need approval) |
| 3 floating shelves + spice rack + 2 cupboards + 2 drawers + 2 tables | joinery | Approved (House Register) |
| Apple, broccoli | produce | Approved |
| 6 dressing SVGs | dressing | Present (not yet byte-locked / Dressing register incomplete) |

---

## Data impact

No database, schema, migration, API, route, server, register or asset-byte change. Documentation + review images only, added under `docs/`. No household data read or written. No runtime code path altered.

## Rollback plan

`git reset --hard rollback/larder-room-assembly-base` (→ `3af5759e`), or remove the review images + this report. No other branch, register, or asset is affected. Zero-code-change means there is nothing to regress.

## Definition of done

- [x] Room assembled from the existing 27 jars — **7 approved placed; 20 candidates held as honest gaps** (the governed maximum without declaring approval).
- [x] Room and shelves review-ready (desktop + mobile compositions from real assets; live-run boundary disclosed).
- [x] No new images generated.
- [x] Complete missing-asset list produced (6 sections).
- [x] Validation run (every jar/room/produce/joinery check passes; Windows path artifacts and the pre-existing dressing byte-lock failure disclosed).
- [x] Work committed as one commit.
- [x] Next asset batch remains blocked pending Home Owner review + explicit named-batch approval.

## User acceptance evidence

- **Starting location:** `C:\Users\Colin\The Healthy Apples\GitHub\tha-living-larder-authoritative`.
- **Action Colin takes:** open the three images under `docs/implementation/assets/larder-room-review/` (and the 7 approved jars + shelves under `client/src/assets/living-home/larder/`); review the jar placement and the missing-asset list.
- **Expected output:** 7 photoreal clip-top jars on oak shelves, warm light, honest gaps for the 20 unapproved staples; a structured gap list.
- **Success criteria:** Home Owner confirms the existing placement reads true, and selects a **named** next batch (e.g. "approve the 20 candidate staple jars" and/or "generate room shell + produce basket") before any generation begins.
- **Regression checks:** verifier jar/room checks stay green (POSIX basis); no code changed; `git status` shows only the review images + this report.

## Highest-risk remaining Inferred / Assumed claim

**Inferred:** that the review compositions faithfully represent the *live* room's spatial composition. They use the real assets but not the app's cm-metrics CSS layout, and no live `/pantry` render was possible here (environment boundary). The true spatial/lighting composition — and all visual acceptance — must be confirmed by the Home Owner on the running room; this report asserts neither.
