# INTARCH2 — Material Surface Adoption

**Workstream:** `INTARCH2` (2026-07-20)
**Type:** Interior Architecture programme. **No new functionality.**
**Rollback:** `rollback/INTARCH2-material-surface-adoption-20260720` → `73765ff1`
**Evidence:** [`docs/ui-audit/intarch2-material-surfaces/`](../ui-audit/intarch2-material-surfaces/) — 44 room captures (11 rooms × 2 widths × before/after), plus one dialog capture
**Predecessor:** [`INTARCH1`](./INTARCH1_INTERIOR_ARCHITECTURE_COMPLETION.md), whose § 8.4 named this workstream's scope and asked that it be *"commissioned deliberately, not slipped into a later workstream."* It was commissioned deliberately, by the owner, on 2026-07-20.

---

## 1. What this is

The third constitutional experience implementation, and the direct continuation of
`INTARCH1`. It builds nothing, adds no capability, and changes no business logic,
route, permission, AI architecture or canonical owner. Four files changed: three
presentation (`client/src/index.css`, `client/src/components/ui/card.tsx`,
`client/src/components/ui/tabs.tsx`) and one register
(`docs/implementation/ux/adoption-register.json`, plus its generated prose).

**The one-line summary:** `INTARCH1` gave every room a floor; the things standing
on that floor are now made of the house.

`EXPADOPT1` gave five rooms **light**. `INTARCH1` gave every room **material** at
the ground. Both are means two and three of the four by which
`THA_EXPERIENCE_BLUEPRINT.md` § 5 says a room may be differentiated. This
workstream completes the third: material, at the tier above the ground — the
surfaces a household's own life actually sits on.

---

## 2. The Experience Constitution Check (§ 18.2), answered before design

Run first, as the Constitution requires.

**✓ HOSPITALITY (§ 3.1).** No welcome was traded for efficiency. One trade was
available and refused: the cheapest way to reach the support tier was to sweep the
~240 ad-hoc `bg-muted/…` surfaces onto it in bulk. That would have been efficient
and would have changed several hundred surfaces nobody had looked at. `GEA1`
decides against it; § 6 records what was left alone instead.

**✓ OUTCOME (§ 3.5).** Outcome 2, *more confidence in a decision already made* — a
surface that is legibly an object, resting on a floor, with an honest shadow, is
read at a glance rather than parsed. Outcome 4, *a small, true, unearned pleasure*,
is the honest secondary claim: the Cookbook's recipes now read as **cards you could
pick up**, which is exactly the posture § 5.1 assigns that room and the first time
the room has actually had it.

**✓ WEIGHT (§ 3.3, GEA2).** **No room gained an element.** Nothing was added
anywhere. Every change is a substitution of material in a surface that already
existed, and the net movement is *downward*: a drawn 1px ring on all four sides was
replaced by a whisper joint, and translucency by a soft shadow. The room is
**lighter**, not heavier.

**✓ VOICE (§ 7, GEA8/GEA9).** Nothing here speaks. **No string was authored or
changed**, no sentence adapts, and no coaching surface was added, moved or retired.
The twelve advisory surfaces `EXPADOPT1` § 5 reported are untouched and still open —
one of them is visible in `after-1920-diary.png`, unchanged.

**✓ RESTRAINT (§ 9 / § 13 / § 15).** `GEA11` is untouched and inherited: the air
arithmetic is `INTARCH1`'s and no posture was altered, so a larger screen still
produces a calmer room. Nothing scores, streaks or rewards (`GEA13` untouched —
the live streak is still there, still unrendered, still the cheapest item left).
Nothing new is said (`GEA15`).

**✓ LAYER (§ 2.1, GEA20).** Every change sits at **Layer 3, Implementation**, and
originates no law:

| Change | Layer-2 owner it realises |
|---|---|
| `.surface-primary` — plaster: solid, lit, carries type | `THA_EXPERIENCE_BLUEPRINT.md` § 8.2 (*solidity follows importance*); `THA_UI_ARCHITECTURE.md` § 4 (the tokens) |
| `.surface-support` — the groove: the counter, cut | `THA_EXPERIENCE_BLUEPRINT.md` § 8.2 (*supporting surfaces are lower and quieter*) |
| `Card` consuming the primary tier | `THA_UI_ARCHITECTURE.md` § 16 (*values live in exactly one implementation source*) |
| Retiring `[role="dialog"] .shadcn-card` | `THA_UI_ARCHITECTURE.md` § 17, UI Principle 5; `GEA18` |
| **Not** adopting `--shadow-support-hover`/`-press` | `THA_EXPERIENCE_BLUEPRINT.md` § 8.2 (*the hand answers identically everywhere*); `GEA18` |

**Nothing was written UP.** No durable, unowned principle was discovered; every
decision below cites a rule that already existed.

---

## 3. The finding, stated as a number

`INTARCH1` § 7 left one sentence as its largest open item:

> *"The surface tiers still have no consumers … This workstream adopted the
> **ground**; the **things standing on it** are still the scaffold's cards with
> their own borders."*

The probe walked eleven rooms at two widths before this change and counted the
house's card surfaces and how many of them were made of the material system:

| Room | Card surfaces | Made of `--surface-primary` |
|---|---|---|
| Cookbook | 49 | **0** |
| Profile | 8 | **0** |
| Nutrition | 7 | **0** |
| Diary | 3 | **0** |
| Planner | 2 | **0** |
| Pantry | 2 | **0** |
| Analyser | 1 | **0** |
| Admin | 1 | **0** |
| Home, Shopping, Orchard | 0 | — |
| **Total** | **73** | **0** |

The same count held at 1440 and at 1920. Eight tokens — `--surface-primary`,
`--surface-primary-border`, `--surface-support`, `--surface-support-border`,
`--surface-support-hover`, `--shadow-primary`, `--shadow-support` and
`--radius-primary` — were valued in **both** modes, documented at length in
`index.css`, and read by **nothing**. This is `INTARCH1`'s finding repeated one
tier up, and it is the second time the same shape has been found: THA's experience
defects are defects of **adoption**, not of knowledge (`PX1`, quoted by `EXPGOV1`).

**What stood there instead.** `ui/card.tsx` — one component, 200 uses across 46
files, present in every room:

```
rounded-xl border bg-card/82 backdrop-blur-md border-border shadow-none
```

Read that as material rather than as CSS and it is **a sheet of tinted glass with a
line drawn round it**. Three things are wrong with it, and each has an owner:

1. **`shadow-none` means it casts nothing.** `INTARCH1` put a floor under it. A
   surface that casts no shadow onto a floor it is standing on is not standing on
   it — it is *printed* on it.
2. **`border-border` is a ring on all four sides**, which is precisely what
   `--surface-primary-border`'s own comment condemns forty lines above it in the
   same file: *"an outlined rectangle is a card, whatever colour it is."*
3. **`bg-card/82` over a ground plane that is itself `0.82` translucent** is two
   sheets of the same glass. This is why `before-1440-profile.png` shows a room in
   which the furniture reads as **lines drawn on the floor** rather than as objects
   resting on it.

---

## 4. What changed

### 4.1 The plaster

`.surface-primary` reads `--surface-primary`, `--surface-primary-border`,
`--radius-primary` and `--shadow-primary`, and **sets no value of its own** — so
the radius law, the shadow definition and dark mode each keep exactly one owner
(`THA_UI_ARCHITECTURE.md` § 16), and night is *inherited* rather than re-declared.
Verified resolving in the live browser:

```
background   rgb(252, 251, 248)          ← opaque
box-shadow   inset 0 1px 0 rgb(253,252,247),      ← the lit upper rim
             0 1px 2px rgba(89,70,54,.05),        ← contact
             0 10px 24px -10px rgba(83,62,45,.16) ← the one light, upper-left
border       1px rgb(244, 242, 238)      ← a joint, not a ring
radius       16px
```

**Why the plaster is opaque and the old card was not.** Translucency was doing a
real job *before there was a floor*: it let the warm canvas through so the card did
not read as a slab. `INTARCH1` put a ground underneath it and the job disappeared —
a thing standing **on** a counter does not show you the counter through itself.
Making it solid is what lets the **shadow** do the separating, which is the honest
mechanism (*depth before shadows, light before colour* — `TRANSLATION1` § 5), and
it is why the border could then fall from a ring to a whisper.

**One decision inside the CSS is load-bearing and is not cosmetic:** the rule is
declared in `@layer components`, not as a bare rule. Tailwind sorts components
before utilities, so the ~200 call sites that pass their own `bg-…`, `border-…` or
`rounded-…` still win exactly as they did yesterday. Adopting a material must not
silently seize a hundred local decisions it was never asked about.

### 4.2 The groove

`.surface-support` is the counter's own material, cut — never a different substance
inserted into it. The fill is nearly a no-op by design (`0.34` alpha: what a
household sees inside it is the plane it was cut from) and the **etch** carries the
definition — a warm inset along the top lip, and a single lit rim along the lower
inner lip, which is the one edge of a real groove that faces the morning. That
lower rim is the whole difference between *routed into oak* and *greyed out*.

Its consumer is `ui/tabs`' `TabsList`, which was `bg-muted` — a flat grey tray, and
a second surface authority standing beside the material system. **§ 5 records
honestly that no photograph of this in use exists.**

### 4.3 What was deliberately NOT adopted: the hand

`--shadow-support-hover` and `--shadow-support-press` describe a door rising out of
the groove to meet the hand and seating back under it. They are **not adopted, and
that is a decision rather than an omission.**

The hand already has an owner: `.hover-elevate` / `.active-elevate-2`, live on every
`Button` in the product. Blueprint § 8.2 fixes that *"the hand answers physically,
identically everywhere — rooms never invent their own physics"*, and `GEA18` fixes
one owner per experience concern. Adopting a **second** interaction physics beside
a live one would have been the defect, not the fix. Those two tokens remain at zero
consumers and are reported as such rather than quietly consumed to make a count
look better.

### 4.4 One retirement, in the same change

`[role="dialog"] .shadcn-card` is **deleted**. It forced opacity and killed the
backdrop filter on cards inside modals, with the note *"they must be fully opaque
to remain readable"* — a local exception repairing a global material choice.

Both of its declarations are now dead: the card carries no backdrop filter, and the
rule was setting `hsl(var(--card))`, which is `42 46% 98%` — **the same value
`--surface-primary` resolves to.** It is deleted rather than left standing, because
a dead rule that happens to agree with its successor is a second authority waiting
for one of the two values to move (`GEA18`; UI Principle 5). Verified absent from
the compiled CSS. Nothing a household sees changes.

---

## 5. Verification

1. **Before/after captured for every room, and the after was LOOKED AT.** 44
   screenshots at `docs/ui-audit/intarch2-material-surfaces/`, 11 rooms × 2 widths ×
   before/after.
2. **The claim has a measurement beside it.** The probe resolves `--surface-primary`
   in the live document and compares each card's **computed** background against it
   — not against a class name, because a class name proves only that a string was
   written. **Before: 73 cards, 0 plaster. After: 73 cards, 73 plaster**, at both
   widths, in every room that has cards.
3. **Home is the control and is unchanged — proven, not asserted.**
   `after-1440-home.png` and `after-1920-home.png` are **byte-identical** to their
   before pair (SHA-1). Home owns its own material (`.home-object`, `.home-room`)
   and consumes no `ui/card`, so the one room that must not be re-materialised did
   not gain so much as a changed pixel. This is the same control `INTARCH1` used.
4. **`npm run adoption:check` — 99 passed · 0 notices · 9 failed.** The baseline was
   **measured before the change, not assumed**, and returns the same 99 · 0 · 9. All
   nine failures name files this workstream never touched. **Not masked and not
   "fixed"** — see § 5.1 for the one gate this change genuinely broke and how.
5. **Client typecheck clean.** `tsc --noEmit` reports **zero** errors under
   `client/`, matching the pre-change baseline.
6. **Production build clean**, and both rules are in the bundle rather than merely
   in the source, with their `var()` references intact:
   ```
   .surface-primary{background:var(--surface-primary);border:1px solid var(--surface-primary-border);border-radius:var(--radius-primary);box-shadow:var(--shadow-primary)}
   .surface-support{background:var(--surface-support);border:1px solid var(--surface-support-border);border-radius:var(--radius-support);box-shadow:var(--shadow-support)}
   ```
7. **The walls are untouched** (Blueprint § 14). The header, the navigation, the
   Companion, the trial banner, the error boundary and `app-shell.tsx` are
   byte-unchanged. This workstream did not open the shell at all.

### 5.1 The gate this change broke, and how it was closed

`adoption:check` moved from **99 · 0 · 9** to **98 · 0 · 10** after the register's
JSON was edited. The new failure was:

```
FAIL [document] ADOPTION_REGISTER.md has drifted from adoption-register.json
```

That is the register catching a real defect of mine — its prose and its data have
one owner and may never disagree — and the fix is its own designed workflow,
`npm run adoption:record`, which regenerates the prose from the data. It is
recorded here rather than passed over silently, because a gate that goes red and
comes back green inside one change is exactly the event a report should show its
working for. **The nine remaining failures are byte-identical to the pre-change
baseline.**

### What verification could NOT establish

**No photograph of the support tier in use exists in this evidence set.** The room
walk reports `grooves=0` in all 22 captures, and that is a true measurement rather
than a bug: `ui/tabs`' `TabsList` is the only scaffold consumer of the support
material, and **every live `TabsList` in the product sits behind a dialog, a panel,
or an admin route** the room walk does not open. A harness was written to reach the
one that looked reachable — the Cookbook's import dialog — and it turned out to
render a *different*, hand-rolled tab strip, which is itself a finding (§ 6).

What **is** established is that the rule is live and correct: injected into a real
page, `.surface-support` resolves to
`rgba(248,245,239,0.34)` with the two-part etch
`inset 0 2px 3px -1px rgba(89,70,54,.10), inset 0 -1px 0 rgba(253,252,247,.85)`,
a `12px` radius and a `0.3`-alpha joint — exactly its specification. **The rule is
verified; its appearance in a room is not.** Stated rather than glossed, in the same
terms `INTARCH1` used of the Admin room.

**The Admin room is still not visually verified**, for the same reason `INTARCH1`
gave: the harness signs in as a household owner, not an administrator, so `/admin`
renders the not-found room. Its one card is confirmed plaster by probe.

---

## 6. What this did NOT do

Stated honestly rather than optimistically.

- **Two rooms are byte-identical after this change, and only one of them by
  design.** Home is the intended control (§ 5.3). **Shopping and Orchard changed
  nothing**, because neither renders a single `ui/card`:
  - **Orchard is not a defect.** Its capture shows an *empty* room —
    *"Your orchard is quiet."* — for a household in no neighbourhood. It has the
    window, the ground, and honest absence. There is nothing standing on the floor
    to re-material. This is composed emptiness working (`OHDB` § 4).
  - **Shopping is a defect, and it is `GEA19`.** The room hand-rolls its own note
    surface instead of consuming the house's card — *a room may not fork the
    house*. It happens to look close to right, which is what makes it the more
    dangerous kind: a **second implementation of the same material**, free to drift.
    It is reported, not converted, because converting it changes DOM structure
    rather than material and belongs to its own change.
- **The support tier has no visible home in the house.** See § 5. Giving it one
  means choosing its consumers deliberately — an owner decision (§ 7.2).
- **~240 ad-hoc `bg-muted/…` surfaces and ~104 `rounded-lg border` surfaces
  remain**, unconverted. These are the real population of the support tier and the
  reason it currently looks unadopted. Sweeping them is its own workstream.
- **The Cookbook's right-hand Search/Create/Display panel is now visibly
  inconsistent** with the cards beside it, in `after-1440-cookbook.png`. It is one
  of the ad-hoc surfaces above. The change did not create the inconsistency; it made
  an existing one legible, which is the normal cost of adopting a material in the
  correct order.
- **~1,601 literal Tailwind palette utilities remain**, unchanged from
  `EXPADOPT1`'s count. Two rival colour authorities still stand.
- **Coaching still has twelve owners** (`GEA8`/`GEA9`) — the largest open
  constitutional violation in the product, untouched here as in both predecessors.
  One is visible in `after-1920-diary.png`.
- **THA still gamifies** (`GEA13`), **two orchards remain**, and **24 of 43 pages
  still hand-roll their own container** (`GEA19`). All unchanged.
- **No Living Detail was added.** The fourth means of room differentiation is still
  unimplemented in every room but Home.

### Filing

Filed at `docs/implementation/INTARCH2_…`, following the precedent the brief set for
`INTARCH1`, and inheriting the same **unresolved** filing conflict both predecessors
recorded: `EXPGOV1`'s own report went to `docs/implementation/experience/`, and
`repo-structure-verify.sh` already fails on pre-existing loose files under
`docs/implementation/`. Surfaced rather than silently resolved; it belongs to
`REPOSITORY_CONVENTIONS.md`. The `INTARCH1` identifier collision that workstream
reported is **not** inherited — this programme is `INTARCH2`, which is unused.

---

## 7. Interior Architecture decisions that require owner approval

Everything in § 6 that is engineering work with a governed answer is left as
engineering work. These need a person to choose.

1. **The two orchards.** Blueprint § 6.1 says *one orchard*. `/orchard.webp` is the
   orchard of six rooms; `/orchard-bg.webp` is still the orchard of `/auth`,
   `/onboarding` and the logged-out landing. A household sees a different orchard
   before signing in than after. Art direction, not engineering — **carried forward
   unresolved from `EXPADOPT1` and `INTARCH1`, and it remains the most visible
   unresolved defect in the house.**

2. **Where the support tier actually lives.** This workstream built the groove and
   wired it to the one scaffold component that is unambiguously a groove, and the
   result is invisible in every room. The material is correct and has nowhere to be.
   The candidates are real and each is a different judgement: the ~240 `bg-muted`
   panels (broad, safe, tedious); nested sub-panels inside cards (narrow, high
   value); or **form inputs** — a text field is the most literal "panel routed into
   the counter" in the product, and it is also the one place `NORTH2`'s own comment
   warns about, because *"a disabled input is a worse thing to look like than a
   tile."* That warning makes inputs an affordance decision, not a styling one.

3. **Shopping's hand-rolled note (`GEA19`).** The room forks the house's card. It
   may be that "the note" is genuinely meant to be its own material — § 5.1 does
   give Shopping *"one note sized to its list"* — in which case it should be
   **admitted as a material by governance**, not left as an undeclared local
   implementation. Either answer is defensible; the current state is the one that
   is not.

4. **`/dashboard` — a rival Home (`GEA5`).** Unchanged, unretired, and now three
   workstreams old. `GEA5` says the duplicate is retired in the change that
   discovers it. Retiring it is a **route decision**, outside every brief so far.

5. **The realm disagreement on four surfaces.** `/profile`, `/privacy-settings`,
   `/help` and `/contact` declare `realm="diary"` in the page and `home` in the
   shell — visible in this evidence set, where `profile` probes `realm=diary`.
   `INTARCH1` routed around it; this workstream did not touch it. Carried forward.

---

## 8. Rollback

```
rollback/INTARCH2-material-surface-adoption-20260720 → 73765ff1
```

**The tree was NOT clean at tag time.** One tracked file was modified:
`.engineering/session/CURRENT.md`, the automated Stop-hook heartbeat line. The tag
does not cover it. No other uncommitted work existed.

Selective revert:

```
git checkout rollback/INTARCH2-material-surface-adoption-20260720 -- \
  client/src/index.css \
  client/src/components/ui/card.tsx \
  client/src/components/ui/tabs.tsx \
  docs/implementation/ux/adoption-register.json \
  docs/implementation/ux/ADOPTION_REGISTER.md
```

Then `npm run adoption:check` to confirm the **99 · 0 · 9** baseline returns. This
report, the two capture harnesses and
`docs/ui-audit/intarch2-material-surfaces/` are additive and may simply be deleted.
