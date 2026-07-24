# UX_NAV1 — Orchard Navigation Refinement

**Session ID:** `UX_NAV1_Orchard_Navigation_Refinement`
**Date:** 2026-07-19
**Rollback ID:** `rollback/UXNAV1-orchard-navigation-refinement-20260719` → `5d5ccd09`
**Brief:** Refine the THA navigation to match the North Star Orchard design.
**Class:** Visual refinement only — no routes, no navigation ownership, no page
behaviour, no business logic.

---

## 1. What was wrong

The navigation drew **nine filled pills**, one per room — and it drew them for
the eight rooms you were *not* in as well as the one you were. Every entry in
`REALM_STYLES` carried a `mobileInactive` fill (`bg-[hsl(…,92%)]`) alongside its
`mobileActive` one, so the shelf rendered as a row of nine pastel buttons in nine
different hues, each with its own edge, competing with each other and with the
realm-tinted header above them.

Three smaller defects rode along with it:

- **Three icon stroke weights on one shelf.** The active glyph jumped to
  `stroke-[2.5]`, the other lucide glyphs sat at the default `2`, and the
  hand-drawn `PantryIcon` at `1.75`. Walking between rooms visibly *thickened*
  the glyph you arrived on.
- **Two hard rules bracketing the room.** The header draws a full-weight
  realm-tinted `border-b`; the shelf drew a full-weight `border-t`. The content
  between them read as boxed in rather than as a room.
- **Frosted glass.** `bg-card/95 backdrop-blur-xl` let ~5% of the room's own
  scrolling content read *through* the navigation. See § 4 — this was the
  finding, not the intent.

Nothing about the house is nine of anything. A shelf is one piece of furniture.

## 2. What was done

### 2.1 One continuous shelf

The per-item fills are **gone**. `REALM_STYLES` lost `mobileActive` and
`mobileInactive` and gained `hue` — the single number both strings were always
built out of. The shelf surface itself (one `bg-card` plane, one hairline top
edge) is now the furniture, and the rooms stand on it rather than beside it.

**No realm changed hue.** Each `hue` was read mechanically off the fill string it
replaced, so wayfinding (UIA § 6) means exactly what it meant before and is only
quieter. Realm tint still carries no status and no emphasis.

### 2.2 The lit room

The room you are standing in is shown by **light**, not by a filled rectangle:

- a soft glow rising from the shelf beneath that room
  (`radial-gradient`, realm hue, 0.19 alpha), and
- a thin light-line along its top edge — the under-cabinet light above that
  room's door.

This is the Experience Blueprint's light (§ 7) and `EXPLANG1A` § 4A's **"Light
has meaning"** applied to wayfinding: *the lit room is the one you are in.* Both
are pure decoration, sit behind the label, and cannot intercept a tap.

### 2.3 Consistent glyphs and type

One glyph size (`h-[18px]`) and **one stroke weight (`1.75`)**, lit or not — the
three-weight problem and the thickening-on-arrival jump both go. The label keeps
its size and gains a weight distinction only (`font-normal` → `font-medium` when
lit), so the room is told by light and ink rather than by geometry.

### 2.4 Calmer spacing, better balance with the header

- `py-1.5` and `md:px-5` — air now sits **inside** each room's padding, where it
  reads as spacing.
- Desktop gap came **down** (`md:gap-2` → `md:gap-1`), which is not a typo: gaps
  were what separated nine filled pills, and with the fills gone the same gap
  only pulls one shelf apart again.
- `border-t border-border/45` — the shelf is deliberately the quieter of the two
  horizontal rules. The header names the room you are in; the shelf only offers
  the others.

### 2.5 Where the dark styling went

The 44 `dark:` utilities inside the removed fill strings became `.dark` rules in
`index.css`, beside the `.dark [data-realm]` blocks that already own the header's
dark realm colours. Same convention, one file, and the hue is no longer written
out twice per realm per mode. **See § 6 for why this number must not be read as
progress.**

## 3. The 390px arithmetic is untouched

COMM2 recorded that nine rooms at the 44px touch floor need ~396px against a
390px narrowest viewport, so the row scrolls. That is **unchanged**:
`min-w-[44px]` is unchanged, mobile `px-1.5` is unchanged, and mobile adds no
gap. Nine rooms still need the same width and still scroll, exactly as before.
The label collision visible in both the before and after mobile captures
("Cookbook"/"Shopping") is that same pre-existing overflow, and COMM2 § 11.4's
nine-rooms-at-390px decision remains open and untouched by this change.

## 4. The finding: what the pills had been covering for

The first pass carried the shelf **sheerer** (`bg-card/85`) on the theory that a
lighter surface reads calmer. The captures refuted it immediately: the room's own
content scrolls under a fixed bar, so what read through was not the warm canvas
but **live words — ingredient names sitting inside the navigation.**

Restoring the original `/95` did not fix it either, and that is the interesting
part. **The bleed-through was always there.** At `/95`, 5% of the page has always
shown through the shelf; the nine filled pills simply masked the middle of the
bar, so it only ever showed in the gaps between them. Removing the fills exposed
it end to end. The pills had been covering for a defect nobody had had to look at.

The fix is not a better opacity. **A shelf is furniture, and furniture is
opaque.** Frosted glass is also a technology signature rather than a material one
— the Blueprint grounds a surface in material (§ 8) and asks technology to
disappear (§ 1.5) — so `backdrop-blur` went with it: nothing is left behind that
needs blurring. Legibility is not a thing to spend on atmosphere.

## 5. Files changed

| File | Change |
|---|---|
| `client/src/components/nav-bar.tsx` | `REALM_STYLES` mobile fills → `hue`; `BottomNavItem` relit; shelf surface and spacing |
| `client/src/index.css` | `.nav-shelf-item` / `.nav-shelf-item--lit` — the glow, the light-line, the ink, light and dark |
| `scripts/capture-uxnav1-orchard-navigation.ts` | **new** — before/after capture harness |
| `docs/implementation/ux/adoption-register.json` | Navigation row updated; `dark:` fact re-dated |

**Not changed:** `NAV_ITEMS`, `roomsByHref`, every route, `app-shell.tsx`,
`workspace-header.tsx`, every page file, and `REALM_STYLES`'
`active`/`hover`/`inactive` (the dormant `DesktopSidebar`'s, mounted nowhere).

## 6. Honest accounting

⚠️ **The `dark:` measure fell 737 → 693 and that is a RELOCATION, not 44 units of
debt repaid.** The register's pattern counts `\bdark:` and does not match
`.dark `, so the number moved without the obligation moving. The dark styling
still exists; it lives in `index.css` now. Dark mode remains
**authored-but-unadopted platform-wide** — nothing anywhere sets the `dark`
class, there is no provider, no toggle and no media read, exactly as the
theme-colour-mode row already records. UX_NAV1 neither fixes that nor adds to it.
Recorded in the register's Navigation row rather than left to be inferred from a
falling number.

⚠️ **The dark variants were authored and verified, but are unreachable in the
running product.** They were proven by forcing the `dark` class in a browser
(capture: `shelf-cookbook-desktop-DARK.png`) rather than claimed untested or
claimed live. They are written because every realm block in `index.css` has one,
and a new block without one would be the odd entry out the day a theme owner
lands.

⚠️ **`REALM_STYLES` still hard-codes each realm's hue a third time**, in the
dormant sidebar's `active`/`hover`/`inactive` strings, and `index.css`'s
`[data-realm]` blocks hold the header's copy. Both are pre-existing. UX_NAV1
**reduced** the count (two fill strings per realm → one number) and added no new
copy, but did not converge them: the sidebar is retired code that dies with NAV2,
and converging the header's realm vocabulary with the nav's is an ownership
change a visual-refinement brief may not make.

## 7. Verification

**Browser — 12/12 before, 12/12 after** (6 rooms × 2 viewports, six different
realm hues so the widest colour spread in the house is exercised).

Behaviour is asserted identical rather than eyeballed. Every capture, before and
after, records `headers=1 nav=1 items=9 activePips=1 errors=0` — one header, nine
rooms, exactly one lit, zero page errors. A refinement that changed any of those
numbers would have changed behaviour, which the brief forbids.

| Gate | Result |
|---|---|
| `typecheck:ci` | 16 regressions — **all pre-existing**, all in `server/tests/test-plan2-planner-evolution.ts`; **0 introduced**, none client-side |
| `build` | 🟢 same 4 pre-existing warnings |
| `adoption:check` | **83 passed · 0 notices · 9 failed** — the 9 all pre-existing and unrelated (`SpellSuggestions`, `json-utils`, `source-helpers`, …); matches NAV1's baseline |
| `npm test` | 🔴 **red, and red before this change** — see below |

### The red suite

`npm test` fails at `test:benchmark-conversation-isolation`. The run reproduces
NAV1's record **exactly**:

| | NAV1 (before this change) | UX_NAV1 (after) |
|---|---|---|
| Suites reached | 104 | **104** |
| First failing suite | `test:benchmark-conversation-isolation` | **same** |
| Assertions failed | 2 | **2** (`24 passed, 2 failed`) |

The two are `question 2 could resolve pronouns against question 1's entityRefs`
and `question 1's entityRefs still exist, but only inside question 1's now-closed
thread` — server-side conversation-thread isolation. UX_NAV1 changed two client
presentation files and one capture script and cannot reach them.

NAV1 recorded this suite as failing **deterministically over two runs and
reproduced at `993e1bc8` in a clean detached worktree with no uncommitted work**,
so it is neither this change's nor the community work's. The `&&` chain stops
there, so ~66 suites after it do not run — the pre-existing condition, not a new
one. Not fixed here. NAV1's recommendation stands: **BENCHINT3**.

## 8. Governance

- **Experience Test** (Blueprint § 15.3) — *Which room is this?* The shelf is not
  a room; it is the walls. It answers *which room am I in* by lighting it.
- **UI § 6 wayfinding** — realm tint preserved in meaning, reduced in weight. No
  hue changed. Still no status, still no emphasis.
- **Light has meaning** (`EXPLANG1A` § 4A; Blueprint § 7) — the active room is
  lit rather than filled. One light source, no second sun.
- **Premium through restraint** (`EXP2` § 17) — the change is almost entirely
  *removal*. Nine fills, 44 utilities, one blur and two icon stroke weights went;
  a glow and a light-line arrived.
- **Technology fades into the background** (Blueprint § 1.5) — the frosted-glass
  effect is retired as a technology signature.
- **UX1** — `BottomNav` remains the sole primary navigation at every size.
  Ownership unchanged.
- **Accessibility** — `min-w-[44px]` / `min-h-[44px]` touch floors unchanged;
  `aria-current="page"` unchanged and still the programmatic signal, so the
  active room is not conveyed by colour alone.

## 9. Screenshots

`docs/ui-audit/uxnav1-orchard-navigation/{before,after}/`

- `{room}-{viewport}.png` — full viewport, for the balance-with-header claim
- `shelf-{room}-{viewport}.png` — tight crop of the shelf, because the
  refinement is a matter of a few pixels of tint and a full-page shot hides it
- `shelf-cookbook-desktop-DARK.png` — the dark variants, forced (§ 6)

## 10. Open items

- **BENCHINT3** — the red suite, pre-existing, still unowned (NAV1's).
- **NAV2** — adopt or delete the unadopted `RoomActions` rail; deleting the
  dormant `DesktopSidebar` with it would retire the third copy of every realm hue
  (§ 6).
- **COMM2 § 11.4** — the nine-rooms-at-390px decision, untouched (§ 3).
- **Product Registry sweep** for the chrome change — inherited from NAV1 and
  still open; this change alters no route, page, capability or claim, only the
  finish of the shell both changes share.
