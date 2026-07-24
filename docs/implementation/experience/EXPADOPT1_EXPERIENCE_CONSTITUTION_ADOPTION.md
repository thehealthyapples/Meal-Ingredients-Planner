# EXPADOPT1 — Experience Constitution Adoption

**Workstream:** `EXPADOPT1` (2026-07-20)
**Type:** Experience Adoption programme. **No new functionality.**
**Rollback:** `rollback/expadopt1-experience-constitution-adoption-20260720` → `b0cfffc8`
**Evidence:** [`docs/ui-audit/expadopt1-adoption/`](../../ui-audit/expadopt1-adoption/) — 32 captures, 8 rooms × 2 widths × before/after
**Session record:** [`.engineering/session/runs/EXPADOPT1_Experience_Constitution_Adoption.md`](../../../.engineering/session/runs/EXPADOPT1_Experience_Constitution_Adoption.md)

---

## 1. What this is

The first **constitutional experience implementation** — the first change made under
`GOVERNING_EXPERIENCE_ARCHITECTURE.md` (`EXPGOV1`, 2026-07-20) whose objective is not to
build anything, but to make the live product visibly conform to the law it already has.

`EXPGOV1` audited the implementation against the Constitution and reached one conclusion,
which `PX1` had reached first: **THA's experience defects are not defects of knowledge.
They are defects of adoption.** Not one of its sixteen findings was a missing rule. Every
one was an owner authored and not consumed, a predecessor not retired, or a governed map
the implementation had quietly stopped matching.

This workstream is the first instalment of the correction. It changes **no** business
logic, permission, route, canonical owner, or AI architecture, and it adds no capability.

**The one-line summary:** the orchard was a fact of one screen; it is now a fact of six.

---

## 2. The Experience Constitution Check (§ 18.2), answered before design

Run first, as the Constitution requires, because it is the only gate that can fail a
change which is correct in every particular and wrong in conception.

**✓ HOSPITALITY (§ 3.1).** No welcome was traded for efficiency. The trade this change
*could* have made — leaving the Cookbook's six columns because more meals visible is more
efficient — is exactly the one `GEA1` decides against, and the room is now calmer.

**✓ OUTCOME (§ 3.5).** Outcome 1, *less on their mind*. A household that has learned one
room has now learned more of them: five rooms that stood at the wrong exposure now stand
where the map says, so the house is one house in one more respect. Outcome 2, *more
confidence*, follows from the Cookbook's titles no longer truncating at four columns.

**✓ WEIGHT (§ 3.3, GEA2).** No room is heavier. Every room touched is **lighter**: the
Cookbook shows 20 cards where it showed 30+, and no room gained a panel, badge or strip.
Capability was not added at all, which is the cheapest possible way to pass this check.

**✓ VOICE (§ 7, GEA8/GEA9).** Nothing here speaks. No string was authored, no sentence
adapts, and Companion convergence (`EXPGOV1` § C1) was deliberately **not** continued —
per the brief, and because it was not required for compliance with anything below.

**✓ RESTRAINT (§ 9 / § 13 / § 15).** `GEA11` is the change's largest single item: surplus
space became air rather than two more columns. Nothing scores, streaks or rewards
(`GEA13` untouched — and the live streak `EXPGOV1` § C4 found is reported below, not
fixed, because retiring it touches API call sites). Nothing new is said (`GEA15`).

**✓ LAYER (§ 2.1, GEA20).** Every change sits at **Layer 3, Implementation**, and
originates no law. Each one names the Layer-2 owner whose rule it realises:

| Change | Layer-2 owner it realises |
|---|---|
| The E2 window in five rooms | `THA_EXPERIENCE_BLUEPRINT.md` § 5.1 (the map), § 6.2 (the scale) |
| Grid caps | `THA_UI_ARCHITECTURE.md` § 6, § 9 — via the Constitution's own `GEA11` |
| The Orchard realm block | `THA_EXPERIENCE_BLUEPRINT.md` § 5 (a room differs by light) |
| The Pantry hue correction | `THA_UI_ARCHITECTURE.md` § 7, § 16 (one definition source) |
| Retiring `OrchardOpenView` | `THA_UI_ARCHITECTURE.md` § 17, UI Principle 5 |

**Nothing was written UP**, because nothing durable and unowned was discovered. One
correction to an existing report is recorded at § 6 below; that is a factual fix, not a
new principle.

---

## 3. What changed, by the owner's seven priorities

### Priority 2 — The Orchard *(the largest item; taken first because 1, 3 and 7 rest on it)*

> **Constitutional principle adopted.** `GEA6` — *the orchard is a permanent fact of the
> site, not a feature of a room. A room at E0 is shuttered, not relocated.* Realising
> `THA_EXPERIENCE_BLUEPRINT.md` § 5.1's map and § 6.2's Exposure Scale.

**Previous implementation.** `--orchard-exposure-e2: 0.55` was defined, in light and
dark, and **read by nothing**. So were `e0` and `e1`. Only `e3` had a consumer, and two of
its three apparent consumers were inside `OrchardOpenView` — a shape UX2 had superseded
with `OrchardWindow` and left standing, with **zero importers**, which made the scale look
better adopted than it was. In practice the orchard existed on `/home`, `/auth`,
`/onboarding` and the logged-out landing, and nowhere else. Five rooms the governing map
puts at **E2** — Cookbook, Pantry, Nutrition, Diary, Orchard — stood at E1.

The probe, run against the pre-change build across eight rooms at two widths, returned
`window=false` in **all sixteen cases** while `--orchard-exposure-e2` resolved to `0.55`
in all sixteen. That is the defect stated as a measurement.

**New implementation.** `OrchardOpenView` and its three orphaned mask constants are
**deleted** — 176 lines, the retirement UX2 owed and did not pay (UI Principle 5;
`GEA18`). In its place, `OrchardRoomWindow` is the first consumer `--orchard-exposure-e2`
has ever had. It is mounted **once**, in `app-shell.tsx`, from a `ROOM_EXPOSURE` map that
is a straight projection of Blueprint § 5.1 — no value in it is a judgement made here.
It renders `null` below E2, so E1 and E0 rooms cost a household no element, no image
request and no paint.

**Why this is a window and not the wallpaper `CONV1 BEH-7` retired.** BEH-7 correctly
removed `fixed inset-0` behind every room at one strength — *"everywhere at once is
nowhere in particular"* (§ 16). What it left behind was a house in which only one room had
ever had a window. This is the opposite move: a committed region, at each room's own
governed constant, rendered for five rooms and for no others. The exposure is a per-domain
constant (§ 6.2 rule 1) resolved from the token; a room is never asked what it wants.

**A defect the measurement could not see, and the screenshot did.** The first build laid
the band `absolute … z-0` behind the room's content. Every probe passed. The capture
showed the Cookbook's section label — *"WHOLEFOOD SUGGESTIONS · 500"* — sitting directly
on the orchard, which is a straight violation of § 6.1 (*"the orchard never carries text …
without negotiation"*) and the same defect `ODL2` § 3.5 rejected EXP4's Studies B and C
for. § 6.2's own words are the fix: E2 is *"one committed region the content deliberately
does not cover"*, and content flowing over the band is content covering it. The band is
now **in flow**, and the room begins beneath it. The reasoning is recorded at the
component, not only here.

This is `ODL2`'s lesson arriving a second time: *a claim with no picture attached is a
claim nobody checked.* The probe answered "is the element present"; the law asks "is type
sitting on it". Only the second one is the rule.

**Verification.** After: `window=true` for the five E2 rooms at both widths;
`window=false` for Planner and Shopping (E1) and for Home (E3 — it draws its own window,
and must not be given a second). Admin resolves E0.

### Priority 6 — Space

> **Constitutional principle adopted.** `GEA11` — *surplus space becomes air and view,
> never additional interface.* The rule EXPGOV1 promoted to governing law after finding it
> rested only on `HOUSE1` § 19.3, a document explicitly marked *not governing*.

**Previous implementation.** `grid-cols-2 lg:3 xl:4 2xl:5 3xl:6` at **seven sites** in
`meals-page.tsx`, plus `2xl:grid-cols-4` in `meal-detail-page.tsx`. The Cookbook doubled
its card count between `lg` and `3xl`; at 1920 the capture shows **18+ meal cards**, each
with an ingredient table, three tabs and six action icons, and **every title truncated**.

**New implementation.** The escalation is capped at `xl:grid-cols-4`; `2xl` and `3xl`
steps retired at all eight sites. The measure now holds from `xl` up, and the content
column's existing 1536px cap turns everything beyond it into margin — which is `GEA11`'s
"the column holds its measure" already implemented by `workspace-header.tsx` and finally
matched by what sits inside it.

**The honest line.** `GEA11` says the item count *does not increase*. This caps rather
than freezes: the room still goes 2 → 3 → 4. The reasoning is that across `lg` → `xl` the
*card measure* is roughly constant (1024/3 ≈ 341px, 1280/4 = 320px), so that step is the
measure holding rather than density rising; beyond `xl` the column caps and the cards
grow, which is air. Freezing at `lg:grid-cols-3` would give 512px cards at the cap and is
the stricter reading. **This is a judgement, and it is recorded as one** so the owner can
overrule it with eyes open.

**Verified in the picture:** at 1920 the Cookbook now shows 4 columns, and the titles that
read *"Australian cafe-Style Black Bean, Cabbag…"* now read in full.

### Priority 5 — Colour

> **Constitutional principle adopted.** `GEA17`/`GEA18` and `THA_UI_ARCHITECTURE.md` § 7
> (*one meaning per colour, one colour per meaning*) and § 16 (*values live in exactly one
> implementation source*).

**Two findings, one of them not in EXPGOV1's list.**

**(a) The Orchard room had no light.** `orchard` has been a declared `PageRealm` since
`COMM2` admitted the room, and the navigation shelf has lit it at hue 20 ever since — but
`index.css` had **no `[data-realm="orchard"]` block**, in either mode. So the one room in
the house that faces outward inherited whatever the previous realm left behind. Blueprint
§ 5 differentiates a room by purpose, **light**, material and one sign of life; the
Orchard had three of the four. Both blocks are added, at COMM2's governed terracotta —
which is a citation of an existing decision, not a new one.

**(b) The measured drift, corrected in the right direction.** `nav-bar.tsx` lit the Pantry
at hue **115** while `index.css` titled it at **118** — one room, two colours, which is
`EXPGOV1` § C2's evidence that a second colour authority had already begun to drift. The
**nav was moved to the token, not the token to the nav**, and `index.css` is now named in
its own text as the canonical owner of a realm's hue.

### Priority 4 — Identity

> **Constitutional principle adopted.** `GEA12` — *identity marks are placed by the
> architecture, never applied for reinforcement.*

**Already true, and worth recording as such.** The constitutional treatment Priority 4
describes — embossed, carved, material, lit, built into the environment rather than placed
upon it — **already exists in the product**. `.brand-mark` (the header), `.wall-apple`
(Home) and `.companion-emblem` are each a CSS relief masked to the canonical apple, with
the two-rim physics `BRAND2` specified: a dark rim above and a lit rim below, agreeing
with the room's one upper-left morning. The canonical logo is retained and was not
redesigned. **No new treatment was invented, and none was needed.**

**What changed.** Two genuinely orphaned assets deleted — `tha-apple-sort.png` and
`The healthy apples recommneds.png`, 2.68 MB, zero references.

**A correction to `EXPGOV1` § C5.** That finding states `_brand1-apple.png` and
`_brand2-apple.png` are *"unreferenced"* and that `public/tha-apple.png` is one of four
redundant copies. **Both claims are wrong**, and acting on them would have broken things:

- `_brand1/_brand2-apple.png` are referenced by **four capture harnesses**
  (`capture-brand1-concepts.ts`, `capture-brand2-embossed-apple.ts`,
  `capture-home-final-concepts.ts`, `capture-home-interior-architecture.ts`).
- `client/public/tha-apple.png` is **live and load-bearing**: it is the `url()` mask source
  for all three CSS reliefs (`index.css` × 4 rules). A JSX grep does not see it.

They are not deleted. The error is recorded so the next audit does not repeat it.

### Priorities 1, 3, 7 — The House, Room Identity, Atmosphere *(partial)*

These three are the same question at three altitudes, and this workstream advances them
by exactly one mechanism rather than seven.

> **Constitutional principle adopted.** Blueprint § 5 — *a room is differentiated by
> purpose, light, material, and one sign of life — never by its own architecture,
> navigation, palette, or theme.*

**Previous implementation.** `EXPGOV1` § I1: *"Eight of nine rooms are pages."* Only
`/home` had a room identity; the rest were the same warm canvas with cards on it,
**differentiated only by a realm tint** — which is differentiation by *colour*, the one
means § 5 explicitly excludes.

**New implementation.** Five rooms now differ by **light** — the second of the four
governed means, and the first time any room but Home has used one. The Cookbook, Pantry,
Nutrition, Diary and Orchard have a window; the Planner, Shopping and Analyser do not, and
their not having one is now a *stated architectural fact* rather than an absence nobody
had implemented. The orchard is the visual beginning of six rooms instead of one, which is
Priority 1's *"the orchard should become the visual beginning of the experience"* — for
the rooms the map allows it, and no further.

**What is NOT done.** The ground plane. `--ground-plane`, `--ground-plane-border` and
`--ground-blur` are valued in both modes and have **no JSX consumer anywhere** — read only
from inside `index.css`. Material, the third governed means, therefore remains unadopted
outside Home, and Priority 7's *materials* and *shadow* are correspondingly incomplete.
This is the largest single item left and it is stated plainly at § 5.

---

## 4. Verification

1. **Before/after captured, and the after was LOOKED AT.** 32 screenshots,
   `docs/ui-audit/expadopt1-adoption/`. The `absolute` → in-flow correction at § 3
   exists solely because the picture was opened; every automated signal was green while
   type sat on the orchard.
2. **The claim has a measurement beside it.** The harness probes each room for the window
   element, the resolved `--orchard-exposure-e2`, and the active realm, and prints them —
   so *"five rooms gained a window and three did not"* is a printed table, not a
   description. Before: `window=false` × 16. After: `true` for the five E2 rooms at both
   widths, `false` for Planner, Shopping and Home.
3. **`npm run adoption:check` — 99 passed · 0 notices · 9 failed.** The baseline was
   **measured, not assumed**: the same command on the stashed pre-change tree returns
   **99 · 0 · 9**. Byte-identical. All nine failures name files this workstream never
   touched (`SpellSuggestions`, `UltraProcessedNoticeModal`, `food-knowledge-modal`,
   `whole-food-selector`, `food-confidence`, `json-utils`, `source-helpers`,
   `unit-display`, `tone`). **Not masked and not "fixed"** — raising a ceiling to green a
   red gate is the one thing the register forbids doing quietly.
   `orchard-environment` passes, at 4 importers (3 before — `app-shell` is the new one).
4. **Client typecheck clean.** `tsc --noEmit` reports **zero** errors under `client/`. The
   107 remaining lines are all under `server/tests` and `server/intelligence`,
   pre-existing and unrelated.
5. **Production build clean**, and the tokens are in the bundle rather than merely in the
   source: `--orchard-exposure-e2: .55` (light) and `.12` (dark), and both
   `[data-realm=orchard]` blocks, verified in the compiled CSS.
6. **The shell is byte-stable in what a household sees.** `app-shell.tsx` gained a map, a
   resolved constant and one mounted element inside `main`. The header, the navigation,
   the Companion and the error boundary are untouched — Blueprint § 14's *"the walls
   untouched"* check.

---

## 5. Remaining constitutional adoption gaps

Stated in the order EXPGOV1 recommends sequencing them, and honestly rather than
optimistically. **Nothing below was attempted and abandoned; each is named because it is
out of this workstream's scope or its brief.**

### Out of scope by the owner's instruction

- **`C1` — Coaching has twelve owners** (`GEA8`, `GEA9`). Twelve advisory surfaces speak
  in their own voice outside the Companion's composition path; `/planner` alone renders
  four simultaneously. The brief said not to continue Companion convergence unless
  compliance required it, and nothing in Priorities 1–7 did. **The largest open
  constitutional violation in the product, untouched.**
- **`I4` — `/dashboard` is a rival Home** (`GEA5`). It answers Home's question with 9
  cards, a "THA Score" and its own 13-constant palette. Ruling on it is a route decision.
- **`C4` — THA gamifies** (`GEA13`, `GEA3`). A live streak API is called on **every**
  product analysis and rendered to nobody; four rival scoring systems; an `AppleRating`
  tier labelled **"Elite"**; self-rated mood and energy scored in apples. Retiring the
  streak touches API call sites, which the brief excluded. **This is the single cheapest
  and highest-value item left** — it is unrendered, so removal is user-invisible.

### In scope, not reached

- **The ground plane has no consumer.** The material vocabulary `ODL2` valued is still
  read only from inside `index.css`. Until a room consumes it, Blueprint § 8's middle
  ground — *"the whole trick of many places"* — is unused outside Home, and Priority 3
  and Priority 7 are one governed means short.
- **Legacy platform colour: ~1,601 literal Tailwind palette utilities** across
  `client/src`, of which ~253 are the generic SaaS residue (blue 119, violet 38, sky 26,
  slate 12, gray 10, purple 15, cyan 9, pink 14, stone 6, indigo 4) and ~1,225 are a
  hand-rolled traffic-light scale duplicating `--primary`/`--destructive`/`--secondary`.
  `tailwind.config.ts` already names this defect in its own comments. Priority 5 asked for
  removal *"where safe to do so"*; safe removal here means reading each of 1,601 sites for
  meaning, which is its own workstream. **Two of six colour authorities remain**
  (`dashboard.tsx`'s 13 raw HSL constants and `AppleRating.tsx`'s 23-value hex table).
- **Two orchards, still.** `/orchard.webp` (the real orchard — apple trees, blossom, the
  oak gate) is used by Home's window and now by the five E2 rooms. Arrival, `/auth`,
  `/onboarding` and the logged-out landing still show the pale meadow `/orchard-bg.webp`.
  Blueprint § 6.1 says **one orchard**. This change did not converge them — picking one
  is an art-direction decision with an owner, and quietly choosing would have been the
  wrong kind of tidy. **It is now the more visible defect**, because five more rooms show
  the real one.
- **24 of 43 pages hand-roll their own container**, across 33 distinct max-width
  declarations; all 14 admin pages bypass `pageContainerClass` entirely. `GEA19` — *a room
  may not fork the house.*
- **`data-orchard-exposure` on `orchard-page.tsx:267` is still inert** — an attribute no
  CSS selector matches. The new component sets the same attribute meaningfully, which
  makes the stale one more confusing, not less.
- **`OrchardRoomWindow`'s E2 crop is unverified against a real orchard asset.** The band's
  `object-position` was chosen by looking at the current `/orchard.webp`; if that asset is
  replaced (`NORTH2` § 5 specifies a better one), the crop must be re-judged.

### Filing

This report is at `docs/implementation/EXPADOPT1_…` **as the brief specified**. Note the
tension the brief could not have known about: `EXPGOV1` § E5 records **two unresolved
filing precedents** for exactly this path, and `repo-structure-verify.sh` already fails on
pre-existing loose files under `docs/implementation/`. `EXPGOV1`'s own report went to
`docs/implementation/experience/`. **The explicit instruction was followed and the
conflict is surfaced rather than silently resolved** — it belongs to
`REPOSITORY_CONVENTIONS.md`, and one of the two precedents needs an owner ruling.

---

## 6. Corrections to existing documents

- **`EXPGOV1` § C5** claims `_brand1-apple.png` and `_brand2-apple.png` are unreferenced
  and `public/tha-apple.png` is a redundant fourth copy. Both are false; see § 3
  (Priority 4). No document was edited — the finding is a point-in-time audit and this
  report is the correction of record.
- **`orchard-backdrop.tsx`'s header** said the file exposed *"exactly two shapes"* and
  named `<OrchardOpenView />` as Home's. It was wrong in both directions at once: it named
  a dead shape and omitted the live one (`OrchardWindow`). Corrected in the same change.

---

## 7. Rollback

```
rollback/expadopt1-experience-constitution-adoption-20260720 → b0cfffc8
```

**The tree was clean at tag time.** The three generated artefacts that were dirty when
this session opened (a benchmark history record, its report, the history index entry) plus
the Stop-hook heartbeat were committed first, as `b0cfffc8`, precisely so that this tag
means what it says — unlike `EXPGOV1`'s, which had to disclaim four files.

Selective revert:

```
git checkout rollback/expadopt1-experience-constitution-adoption-20260720 -- \
  client/src/components/layout/orchard-backdrop.tsx \
  client/src/components/layout/app-shell.tsx \
  client/src/components/nav-bar.tsx \
  client/src/index.css \
  client/src/pages/meals-page.tsx \
  client/src/pages/meal-detail-page.tsx \
  client/src/assets/icons/
```

Then `npm run adoption:check` to confirm the **99 · 0 · 9** baseline returns. This report,
the session record and `docs/ui-audit/expadopt1-adoption/` are additive and may simply be
deleted.
