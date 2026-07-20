# INTARCH1 — Interior Architecture Completion

**Workstream:** `INTARCH1` (2026-07-20)
**Type:** Interior Architecture programme. **No new functionality.**
**Rollback:** `rollback/INTARCH1-interior-architecture-completion-20260720` → `7aa63d76`
**Evidence:** [`docs/ui-audit/intarch1-interior-architecture/`](../ui-audit/intarch1-interior-architecture/) — 44 captures, 11 rooms × 2 widths × before/after
**Predecessor:** [`EXPADOPT1`](./EXPADOPT1_EXPERIENCE_CONSTITUTION_ADOPTION.md), whose § 5 named this workstream's subject as the largest in-scope gap it left.

---

## 1. What this is

The second constitutional experience implementation, and the direct continuation of
`EXPADOPT1`. It builds nothing, adds no capability, and changes no business logic,
route, permission, AI architecture or canonical owner. Two files changed, both
presentation: `client/src/index.css` and `client/src/components/layout/app-shell.tsx`.

**The one-line summary:** the house had a complete material vocabulary that nothing
was made of; the rooms now stand on it.

`EXPADOPT1` gave five rooms **light** — a window onto the orchard, the second of the
four means by which `THA_EXPERIENCE_BLUEPRINT.md` § 5 says a room may be
differentiated (purpose, light, material, one sign of life). This workstream gives
every room **material**, the third. It is deliberately one mechanism rather than
nine, for the reason § 6.3 of the Constitution gives: character comes from purpose,
light, material and one sign of life, and never from a private implementation.

---

## 2. The Experience Constitution Check (§ 18.2), answered before design

Run first, as the Constitution requires.

**✓ HOSPITALITY (§ 3.1).** No welcome was traded for efficiency. One trade was
offered and refused mid-implementation: the first build took the room's air at every
width, which is more efficient to write and made the Cookbook's titles truncate
again. `GEA1` decides that against the shorter CSS; § 4 records the correction.

**✓ OUTCOME (§ 3.5).** Outcome 1, *less on their mind*. A household that has learned
one room has learned more of the house: every room now expresses its identity through
the same material system, so the rooms are recognisable as rooms of one building
rather than as pages sharing a navigation bar. Outcome 4, *a small, true, unearned
pleasure*, is the honest secondary claim — a room that has a floor is pleasant to be
in, and the household is asked for nothing in exchange.

**✓ WEIGHT (§ 3.3, GEA2).** **No room gained an element.** This is the check the
design was shaped around, and it is the reason the ground is a plane and not a panel
(§ 3 below). Nothing was added to any room; a surface was put *under* what was
already there. No panel, badge, strip or control was introduced anywhere.

**✓ VOICE (§ 7, GEA8/GEA9).** Nothing here speaks. **No string was authored or
changed**, no sentence adapts, and no coaching surface was added, moved or retired.
The twelve advisory surfaces `EXPADOPT1` § 5 reported are untouched and still open.

**✓ RESTRAINT (§ 9 / § 13 / § 15).** `GEA11` is the change's governing rule and is
implemented as arithmetic rather than as intention: the room's air is drawn from the
**surplus** beyond the content column's cap and never from the measure, so a larger
screen produces a calmer room and never a narrower one. Nothing scores, streaks or
rewards (`GEA13` untouched — the live streak `EXPADOPT1` § 5 reported is still there,
still unrendered, still the cheapest item left). Nothing new is said (`GEA15`).

**✓ LAYER (§ 2.1, GEA20).** Every change sits at **Layer 3, Implementation**, and
originates no law:

| Change | Layer-2 owner it realises |
|---|---|
| `.room-ground` — the material, radius, shadow, blur | `THA_EXPERIENCE_BLUEPRINT.md` § 8.2 (one material system); `THA_UI_ARCHITECTURE.md` § 4 (the tokens) |
| `ROOM_GROUND` — which room stands at which posture | `THA_EXPERIENCE_BLUEPRINT.md` § 5.1 (the *Ground posture* column) |
| The air arithmetic | `GOVERNING_EXPERIENCE_ARCHITECTURE.md` § 9.2 (`GEA11`) |
| Home drawing no ground | `THA_EXPERIENCE_BLUEPRINT.md` § 8.2 (*one ground per workspace, never nested*) |
| Admin and Profile resolved by path | `THA_EXPERIENCE_BLUEPRINT.md` § 5.1 (both are named rooms in the map) |

**Nothing was written UP.** No durable, unowned principle was discovered; every
decision below cites a rule that already existed. Two pre-existing inconsistencies
were found and are **reported, not resolved** (§ 6).

---

## 3. The finding, stated as a number

`THA_EXPERIENCE_BLUEPRINT.md` § 8.1 makes the middle ground — the ground plane and
the surfaces on it — **"the only layer that varies by domain"**, and calls it *"the
whole trick of many places"*. § 8.2 specifies it precisely: *"One warm plane — a
counter, a table, a shelf, a note, a bench, a record — sized and postured per domain
(§ 5.1), from one material system: one radius law, one shadow definition, different
proportions and density per room."*

The material system existed. It had been designed with unusual care across `NORTH2`
and `ODL2`, valued in both light and dark, and documented in `index.css` at length.

**It had no consumers. Not few — none.**

| Token | Defined | `var()` uses in the entire client |
|---|---|---|
| `--ground-plane` | ✓ light + dark | **0** |
| `--ground-plane-border` | ✓ light + dark | **0** |
| `--ground-blur` | ✓ light + dark | **0** |
| `--surface-primary` (+ border) | ✓ light + dark | **0** |
| `--surface-support` (+ border, hover) | ✓ light + dark | **0** |
| `--shadow-support` (+ hover, press) | ✓ light + dark | **0** |
| `--radius-ground` | ✓ | **0** |
| `--surface-blur` | ✓ | **0** |

`EXPADOPT1` § 5 reported the ground plane as *"read only from inside `index.css`"*.
That was generous by one: no rule in `index.css` read it either. The honest count was
zero, and it was zero for the eight tokens above, not one.

**The consequence is what the before-captures show.** The probe reports
`ground=0` in all 22 before-captures. In the pictures, the Diary is the clearest
case: an orchard window across the top of the room, and beneath it a banner, an
outlined rectangle, five outlined rows and two floating outlined panels, each
resting on nothing. A window onto an orchard above a spreadsheet is not a room. It
is a page with a view attached — which is precisely `EXPGOV1` § I1's finding
(*"eight of nine rooms are pages"*) surviving the change that was supposed to close
it, because that change could only reach the light.

---

## 4. What changed

### 4.1 The ground plane gets its first consumer

`.room-ground` in `index.css` is the first thing in the product's history to consume
`--ground-plane`, `--ground-plane-border`, `--ground-blur`, `--radius-ground` and
`--shadow-ground` together. It sets no value of its own: every property reads a
token, so `THA_UI_ARCHITECTURE.md` § 16's *values live in exactly one implementation
source* holds, and dark mode is inherited rather than re-declared.

**Why a plane and not a panel.** This is the whole of the design decision and the
reason the change passes `GEA2`.

A closed rounded rectangle around a room's content is a **panel**. It has four edges,
so the eye reads it as an object placed *in* the room, and the room now contains one
more thing than it did. That is weight added, and it is the outcome the brief and
`GEA2` both forbid.

A **ground** is open at the bottom. It rises from beneath the room, meets the light
at a soft top edge, and runs off the foot of the viewport — because you are standing
at it. A counter has no visible bottom edge; a table you are sitting at has no far
side you can see. The radius is therefore applied to the **top two corners only**,
and the border to the **top edge only** — a ring drawn on all four sides is the
outline that makes a card a card, which `index.css` already says in its own words
about `--surface-primary-border` (*"an outlined rectangle is a card, whatever colour
it is"*).

The material is translucent (0.82) and blurred, so the warm canvas and the room's own
light still come through it. That is what keeps it a **middle** ground (§ 8.1) rather
than a second background, and it is why it can never become the wallpaper `CONV1
BEH-7` retired.

### 4.2 The posture map

`ROOM_GROUND` in `app-shell.tsx` is a straight projection of the *Ground posture*
column of § 5.1. No value in it is a judgement made in this workstream; each row is
the governed posture reduced to the **one** thing the material system permits a room
to vary — how much air it holds. Material, radius, shadow and blur are identical in
every room.

| § 5.1 ground posture | Room | Posture here |
|---|---|---|
| "one solid table holding the week" | Planner | `full` |
| "the bench" | Analyser | `full` |
| "solid working ground" | Admin | `full` |
| "shelf; recipe cards as objects you pick up" | Cookbook | `room` |
| "shelf strata" | Pantry | `room` |
| "noticeboard tier over a solid data tier" | Nutrition | `room` |
| "ground plane; neighbours as presences on it" | Orchard | `room` |
| "lap desk; **the most air in the house**" | Diary | `air` |
| "one note sized to its list" | Shopping | `air` |
| "the record; anchored strata" | Profile | `air` |
| "compact counter — the view keeps its share" | **Home** | **`none`** |

**Home's absence is the load-bearing entry.** § 8.2 fixes *one ground per workspace,
never nested*, and Home already has one — the plaster wall beneath its sill
(`.home-room`), which *is* the compact counter § 5.1 gives it. A second plane inside
it is exactly the nesting the law forbids. Home therefore resolves to `none` and
draws nothing, in the same way it resolves to E1 in `ROOM_EXPOSURE` while drawing its
own E3. **The after-capture of Home is byte-identical to the before-capture**, which
is the control this change is verified against.

It is mounted **once**, in `app-shell.tsx`, below the window in the DOM and therefore
below it on the wall — the honest arrangement: the window is glazing in the wall, the
ground is the surface beneath it, and the room's content stands on the ground. It
*wraps* the children rather than sitting beside them, which is what makes it a ground
rather than a backdrop: the content is **on** it, not in front of it. `none` renders
no wrapper at all, so Home and every unmapped surface cost a household no element and
no paint.

### 4.3 The air is drawn from the surplus, never from the measure

**This was got wrong first, and only the picture caught it** — the same lesson
`EXPADOPT1` recorded and the reason its harness pattern was reused.

The first build expressed posture as `clamp(0px, 2vw, 2rem)`. Every automated signal
was green: typecheck clean, adoption baseline unchanged, `ground=1` in every room.
The capture showed the Cookbook's recipe titles truncating again —
*"Australian cafe-Style Black Bean, Cabbage & Cucumber Ri…"* — because a `vw`-based
margin takes its air at **every** width, and at 1440 the room has no surplus to give.
The plane had narrowed the room by 58px and re-introduced, from underneath, the exact
defect `EXPADOPT1` § 3 had just fixed by capping the grid. A ground narrower than the
things standing on it is also simply wrong as furniture.

The posture is now `clamp(0px, calc((100vw - 1536px) × rate), ceiling)`, where 1536px
is the content column's own cap (`max-w-screen-2xl`, owned by `pageContainerClass`).
Below the cap the expression is negative, the clamp floors at zero, and **the plane
meets the walls in every posture** — the room is never made smaller to manufacture
air that was not there. Above it, the surplus opens as air at the room's own rate.

That is `GEA11` written as arithmetic rather than as an intention: *surplus space
becomes air and view, never additional interface*. It also removes the need for any
breakpoint override on phones — at any width below the cap, every posture already
resolves to zero.

**Verified in the picture:** at 1440 the Cookbook's titles read in full again; at
1920 the Diary and Shopping planes stand clear of both walls with the room composed
between them.

---

## 5. Verification

1. **Before/after captured for every room, and the after was LOOKED AT.** 44
   screenshots at `docs/ui-audit/intarch1-interior-architecture/`, 11 rooms × 2
   widths × before/after. The § 4.3 correction exists solely because the picture was
   opened; every automated signal was green while the Cookbook truncated.
2. **The claim has a measurement beside it.** The harness probes each room for
   ground-plane consumers, the orchard window and the active realm, and prints them.
   **Before: `ground=0` × 22.** After: `ground=1` in every room except Home, which is
   `0` by architectural requirement.
3. **Home is the control and is unchanged — proven, not asserted.**
   `after-1440-home.png` and `after-1920-home.png` are **byte-identical** to their
   before pair, verified by SHA-1. The one room that must not gain a ground did not
   gain so much as a changed pixel.
4. **`npm run adoption:check` — 99 passed · 0 notices · 9 failed.** The baseline was
   **measured before the change, not assumed**, and returns the same 99 · 0 · 9. All
   nine failures name files this workstream never touched. **Not masked and not
   "fixed"** — raising a ceiling to green a red gate is the one thing the register
   forbids doing quietly.
5. **Client typecheck clean.** `tsc --noEmit` reports **zero** errors under
   `client/`, matching the pre-change baseline.
6. **Production build clean**, and the rule is in the bundle rather than merely in
   the source — `.room-ground` and `.room-ground--air` verified in the compiled CSS
   with their `var()` references intact.
7. **The walls are untouched** (Blueprint § 14). The header, the navigation, the
   Companion, the trial banner and the error boundary are byte-unchanged.
   `app-shell.tsx` gained a map, a resolver and one conditional wrapper inside
   `main`.

### What verification could NOT establish

**The Admin room was not visually verified.** The capture harness signs in as a
dev-world household owner, who is not an administrator, so `/admin` renders the
not-found room. The probe confirms `ground=1` and the path resolver is exercised, but
**no picture of the study off the hall exists in this evidence set**, and its
posture is therefore unconfirmed by eye. Stated rather than glossed.

---

## 6. Two inconsistencies found, reported and deliberately not resolved

**(a) `/profile`, `/privacy-settings`, `/help` and `/contact` each declare two
realms.** Each page passes `realm="diary"` to its own `WorkspaceHeader`, while
`NON_ROOM_TITLES` in `app-shell.tsx` assigns them `home`. One surface, two realms —
which is `GEA18` (one owner per experience concern) at the wayfinding layer.

This bit here: `/profile` is a named room in § 5.1 (*"the family record"*) and would
have silently drawn no ground, because it resolves to realm `home` and Home is the one
room that must not be grounded. The same was true of every `/admin` route.

**The fix taken was the narrow one** — both are resolved by **path** in
`resolveShellGround`, in the open, rather than by editing `NON_ROOM_TITLES`. Editing
that table would have changed the header's ink and the room's orchard exposure as a
side effect of fixing a floor, and a household would see both. **The realm
disagreement itself is untouched and needs an owner ruling.**

**(b) `/dashboard`, `/privacy-settings`, `/help`, `/contact`, `/supermarkets`,
`/compare` and the two detail routes were given no ground, deliberately.** § 5.1 does
not name any of them as a room. Inventing a posture for a surface the governing map
does not describe is the upward flow `GEA20` forbids — the map is amended by
governance, never by a shell that needed a row. They stand on the warm canvas, as
they did. (`/dashboard` is additionally the rival Home `EXPADOPT1` § 5 reported under
`GEA5`; grounding it would have made a surface that should not exist look more like a
room.)

---

## 7. What this did NOT do

Stated honestly rather than optimistically. Nothing below was attempted and
abandoned; each is named because it is out of scope, or belongs to an owner.

- **The surface tiers still have no consumers.** `--surface-primary`,
  `--surface-support` and `--shadow-support` — the carved-groove physics `NORTH2`
  specified, and the reason "crafted into the house rather than sitting on it" was
  written — remain at zero uses. This workstream adopted the **ground**; the
  **things standing on it** are still the scaffold's cards with their own borders.
  This is the largest single item left, and it is the natural `INTARCH2`.
- **~1,601 literal Tailwind palette utilities remain**, unchanged from `EXPADOPT1`'s
  count. Two rival colour authorities still stand (`dashboard.tsx`'s 13 raw HSL
  constants, `AppleRating.tsx`'s 23-value hex table).
- **Coaching still has twelve owners** (`GEA8`/`GEA9`) — the largest open
  constitutional violation in the product, untouched here as it was in `EXPADOPT1`.
- **THA still gamifies** (`GEA13`) — the live streak, the four scoring systems, the
  "Elite" tier. Still the cheapest and highest-value item left, and still unrendered.
- **Two orchards, still.** `/orchard.webp` and `/orchard-bg.webp`. Unchanged.
- **24 of 43 pages still hand-roll their own container** (`GEA19`). The ground plane
  now sits *beneath* those hand-rolled containers, which does not fix them but does
  mean a room's floor no longer depends on the page agreeing about its walls.
- **No Living Detail was added.** The fourth means of room differentiation (§ 5) is
  still unimplemented in every room but Home.

### Filing

This report is at `docs/implementation/INTARCH1_…` **as the brief specified**, and
inherits the unresolved filing precedent `EXPADOPT1` § 5 recorded: `EXPGOV1`'s own
report went to `docs/implementation/experience/`, and `repo-structure-verify.sh`
already fails on pre-existing loose files under `docs/implementation/`. The explicit
instruction was followed and the conflict is surfaced rather than silently resolved.

**A second filing conflict, new to this workstream:** the identifier `INTARCH1` is
**already in use** — `docs/architecture/INTARCH1_INTELLIGENCE_REASONING_ARCHITECTURE.md`
is a governing document indexed in the Architecture Bootstrap. Two unrelated
workstreams now share a prefix, in two directories. The brief named this file
explicitly, so the instruction was followed; the collision belongs to
`REPOSITORY_CONVENTIONS.md` and needs an owner ruling.

---

## 8. Interior Architecture decisions that require owner approval

Everything else in § 7 is engineering work with a governed answer already on record.
These five are not: each needs a person to choose, because the governing documents
either do not settle them or settle them in two directions.

1. **The two orchards.** Blueprint § 6.1 says *one orchard*. `/orchard.webp` (apple
   trees, blossom, the oak gate) is now the orchard of six rooms; `/orchard-bg.webp`
   (the pale meadow) is still the orchard of `/auth`, `/onboarding` and the logged-out
   landing. A household sees a different orchard before signing in than after.
   Choosing between them is art direction, not engineering, and `EXPADOPT1` correctly
   refused to pick quietly. **It is now the most visible unresolved defect in the
   house.**

2. **`/dashboard` — a rival Home (`GEA5`).** It answers Home's question with nine
   cards, a "THA Score" and its own 13-constant palette. `GEA5` says the duplicate is
   retired in the change that discovers it. It was discovered two workstreams ago and
   is still there. Retiring it is a **route decision**, which is outside every brief
   so far and needs a ruling rather than another report.

3. **The realm disagreement on four surfaces.** `/profile`, `/privacy-settings`,
   `/help` and `/contact` declare `realm="diary"` in the page and `home` in the
   shell. This workstream routed around it rather than picking. Which is right
   determines the header's ink and the room's orchard exposure on four surfaces —
   and § 5.1 names Profile a room in its own right, which suggests neither current
   answer is correct.

4. **How far the material adoption should go (`INTARCH2`'s scope).** The ground is
   adopted; the surfaces standing on it are not. Adopting `--surface-primary` and
   `--surface-support` means retiring the scaffold card's border and drop shadow
   across the product in favour of `NORTH2`'s carved-groove physics. That is the
   change that would most fully deliver *"crafted into the house rather than sitting
   on it"* — and it is also the one with the widest blast radius in the client. It
   should be commissioned deliberately, not slipped into a later workstream.

5. **The `INTARCH1` identifier collision.** `INTARCH1` already names a governing
   document (`docs/architecture/INTARCH1_INTELLIGENCE_REASONING_ARCHITECTURE.md`).
   Two unrelated workstreams now share a prefix. The brief named this file
   explicitly and the instruction was followed; whether this programme is renamed
   belongs to `REPOSITORY_CONVENTIONS.md`.

---

## 9. Rollback

```
rollback/INTARCH1-interior-architecture-completion-20260720 → 7aa63d76
```

**The tree was NOT clean at tag time.** One tracked file was modified:
`.engineering/session/CURRENT.md`, the automated Stop-hook heartbeat line. The tag
does not cover it. No other uncommitted work existed, and nothing in this workstream
depends on it.

Selective revert:

```
git checkout rollback/INTARCH1-interior-architecture-completion-20260720 -- \
  client/src/components/layout/app-shell.tsx \
  client/src/index.css
```

Then `npm run adoption:check` to confirm the **99 · 0 · 9** baseline returns. This
report, the capture harness and `docs/ui-audit/intarch1-interior-architecture/` are
additive and may simply be deleted.
