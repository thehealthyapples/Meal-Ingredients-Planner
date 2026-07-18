# NORTH1 — The Home North Star, Built

**Date:** 2026-07-17
**Status:** Delivered — awaiting review. **One inherited step is NOT done, and it is named in § 8.**
**Rollback:** `rollback/NORTH1-home-implementation-20260717` → `1648fc46` (tag protects committed state only; the tree carries unrelated uncommitted work from the concurrent CONV1 P6 session — untouched by this change, and § 8 is about exactly that)
**Reference:** [`attached_assets/design/north_star/v2/NORTH_STAR_V2_HOME_DESKTOP_MOBILE.png`](../../attached_assets/design/north_star/v2/NORTH_STAR_V2_HOME_DESKTOP_MOBILE.png)
**Evidence:** [`docs/ui-audit/north1-home/`](../ui-audit/north1-home/) — before, after at four widths, and the quiet day
**Session record:** [`.engineering/session/runs/NORTH1_Home_Implementation.md`](../../.engineering/session/runs/NORTH1_Home_Implementation.md)

---

## 1. What this change is

Home stands at **E3 — the open view**. It is the last of the four orchard exposure levels
to exist, and the only room that will ever hold it (Blueprint § 6.2: *"the orchard visible
as itself, generously; sparse content on its ground; the view IS part of the room's
purpose — **Home only**"*).

It is **execution, not decision.** ODL2 § 7 closed every governance gate and said so:
*"the Home North Star can be implemented without a further architectural decision."* This
change made no architectural decision, amended no governing document, and invented no
visual value. Every colour, shadow, radius and exposure on the page resolves a token ODL2
valued in `client/src/index.css`.

Three inherited items, from ODL2 § 7:

| Inherited | State |
|---|---|
| **1. Build Home's E3** — consume the exposure, ground, shadow and light tokens | ✅ Done |
| **2. Delete the reference** — `material-a-warm-layers.tsx` + its capture harness | ✅ Done — the `depth-light-ground` row is **closed** |
| **3. Execute the signature ADOPT** | 🟡 **Partly.** The voice is live on `/home`; the eight arrival prototypes are **not deleted** — § 8 |

---

## 2. The verdict, honestly

**It is recognisably the North Star, and it is not a dashboard.** The three things the
brief asked for that the old Home did not have — the orchard as a *place*, the household's
name in THA's own hand, and warm depth in real light — are all there and all governed.

**The strongest evidence is not the good day. It is the quiet one** (`quiet-day-*.png`).
NORTH1 § 3 scored the reference against *"composed emptiness, never bare emptiness"* and
returned the only honest verdict a render allows:

> **Cannot be assessed, and that is a finding.** … a rendered kitchen *always* looks
> lived-in — even when the household has done nothing. The render cannot fail at the state
> the design most needs to survive.

Software can fail at it. So the room was made to face it — nothing planned, nothing to
buy, no weekly picture, and a Companion with nothing worth saying — and it holds: *"Today
is open."* · *"the cupboards are as you left them."* · no ring drawn, because a ring at
zero is a claim · the Companion's card simply absent, because silence is a first-class
outcome · and the door quietly re-aims itself from *Open today's plan* to *Plan today*.
The room is still warm with nothing in it, which is the proof that **the light and the
material are carrying it, and not the content.** That question is now answered, and it is
answered in a picture that is captured on every run.

**Where it is weaker than the reference, stated plainly:**

- **The reference is warmer in its lower half**, and it buys that warmth with photographs
  of a notebook, a bowl of soup, storage jars and a tote bag. Those are refused (§ 5), and
  the refusal costs something real. What replaces them is the household's own life, which
  is thinner on a household's first day than a stock photograph is — by design, and it is
  the right trade, but it is a trade.
- **The desktop composition splits left-cream / right-orchard**, where the reference lays
  the orchard softly behind everything. That split is not a stylistic preference; it is
  forced by Blueprint § 6.1 (§ 5.2), and the reference breaks that law — NORTH1 § 3 scored
  it *"Broken"* before this implementation existed. Given the law, the split is the best
  available composition; without the law, the reference's is prettier. The tablet and
  phone band (§ 4.2) is the strongest surface in the set precisely because a band has no
  such conflict to resolve.
- **The room tiles duplicate the bottom nav.** § 5.5 argues why they stay and why they are
  lawful. It is the element a reviewer is most likely to want to argue about, so it is
  named here rather than defended only in a comment.

---

## 3. Before and after

| | Before | After |
|---|---|---|
| Desktop 1440×900 | `before-desktop-viewport.png` | `after-desktop-viewport.png` |
| Whole room | — | `after-desktop-full-viewport.png` |
| `lg` (1024) — the tightest geometry | — | `after-lg-narrow-viewport.png` |
| Tablet (820) — the band | — | `after-tablet-viewport.png` |
| Phone 390×844 | `before-mobile-viewport.png` | `after-mobile-viewport.png` |
| **The quiet day** | — | `quiet-day-desktop.png` · `quiet-day-mobile.png` |

**Before:** a calm, correct, flat page. Cards printed on a cream rectangle, no ground, no
light, no orchard, no depth, no signature. It fails nothing and it feels like nothing —
the *"cold, clinical, lifeless calm"* ORCHARD3 § 1.2 names as THA's single greatest visual
risk, and the exact reason EXPLANG1B was written (*"calm must never become lifeless"*).

**After:** a room. The morning comes through a window; the counter stands in front of it
with a world behind it; the household's name is written on the light in THA's own hand.

---

## 4. What was built

### 4.1 The open view — E3, and the asset keeps one owner

`client/src/components/layout/orchard-backdrop.tsx` is the canonical owner of the orchard
environment asset (register row `orchard-environment`). It now exports **two shapes** and
owns the image in both.

This row previously said **"a ROOM may never mount it."** That sentence was **right about
the shape and wrong about the asset**, and Home's E3 is what proved the difference. What
§ 6.1 forbids is the *wallpaper* — `fixed inset-0` behind every room, uniformly, at one
strength — which is what CONV1 BEH-7 retired and what the sentence was written to keep
retired. It does not forbid Home the view its own exposure level is *defined by*. Read
literally it made E3 unbuildable and left the scale with three usable levels and a fourth
nobody could ever reach.

So the open view was added **to that file**, not to a second component: a second file
rendering `/orchard-bg.webp` would be a second owner of one visual concern (UIA § 17) —
the precise thing that row exists to prevent. **One asset · one owner · two shapes ·
two permitted surfaces (arrival, and `/home`) · nothing else.**

### 4.2 A window on a wide wall, a band on a narrow one

The exposure is a **per-domain constant and it is unchanged** (§ 6.2 rule 1): Home is E3
at every size, resolving `--orchard-exposure-e3`. What adapts is the **aperture's shape**,
which is composition — what a room does with the wall it has.

- **`lg` and up — the window.** The orchard opens to the right of the greeting and
  dissolves into the room: leftward before the household's name, downward into the
  counter. The household is *in* the room, looking out.
- **Below `lg` — the band.** At 390px there is no "beside". Split there, the orchard is
  either a stripe too thin to read as a place, or it runs under the name — **and it did**
  (§ 6.1). The narrow room takes its view *over* the counter instead of across it.

This is deliberately **not** the reference's answer. Its own phone plate drops the orchard
entirely and shows cream — which would leave Home at **E1 on the device most households
actually arrive on** (PX1) and make E3 something only a desktop ever sees.

### 4.3 The counter has a world behind it

The view's fade runs *past* the top of the counter at a few percent, so the ground plane
has something behind it. This is Blueprint § 8.1's three grounds — world behind, room in
the middle, what floats — and it is the whole reason the middle ground reads as a plane at
all. **A translucent counter over nothing is not a counter; it is the same cream, and it
disappears.** It did, in the first build: the counter only existed on the right, where the
orchard happened to be behind it.

The fade is spent before the room tiles, and the only thing standing on it in that band is
the glance — which is **solid**. No type on this page ever has the image behind it.

### 4.4 The material

`--ground-plane` · `--shadow-{ground,primary,support,support-hover,support-press}` ·
`--surface-*` · `--light-rim` · `--radius-{ground,primary,support}`. Study A's vocabulary,
verbatim, on the room it was built to describe. The ODL1-era hardcoded HSL chips are gone
with the rest of the token bypass (NORTH1 § 8.5): the page names no colour of its own.

The radius ladder is honoured — ground (1.75rem) → glance (1rem) → doors (0.75rem) — and
there is **one ground per workspace, never nested**.

### 4.5 The signature — the arrival

The household's name, in THA's own hand, with UXHOME1's writing reveal: a soft-edged mask
sweeps left to right so the ink arrives at the speed of a hand. The glyphs are real text
throughout — selectable, translatable, read by a screen reader from the first frame. Under
reduced motion the class is not applied at all, so the name is simply *there*, complete:
**motion here reveals something already present, and never withholds it.**

No name, no hand — a signature is a person's, and if there is nobody to sign for, the
welcome stands in the display voice instead. An honest absence, not a blank.

Caveat now loads from `index.css` (two weights — every weight `.text-signature` can
reach). **This is the first time a household downloads it**, which is a real cost borne on
the one surface that earns it.

### 4.6 The glance, and the door

Three columns in one lit panel — the reference's own composition, carrying THA's real
three: **Meals · Shopping · From the orchard**. The reference's ring is kept because it is
the one element in that frame *already drawing a true number*, and it is still: no sweep,
no count-up, no draw-on. Motion there would be the ring performing the household's diet
back at them.

Then **the one door** — `Open today's plan` / `Plan today`, re-aimed by the truth of
today, and the only primary-styled control on the page. **The reference has no door at
all**, which NORTH1 § 5.4 called its most serious product failure: *"that is a menu, not a
threshold."* Home's whole job is *arrive and be oriented, then step through the one right
door for the hour.*

---

## 5. What the reference asks for and this room refuses

Each refusal is a rule that already had an owner. None is a preference.

### 5.1 The left sidebar
UX1 made the canonical BottomNav the sole primary navigation **at every size** and retired
the DesktopSidebar. Blueprint § 14: the walls never change. NORTH1 § 5.3 had already ruled
— *"ignore the nav in this image entirely."*

### 5.2 Type on the orchard
The reference puts "Welcome home, Colin" directly on the photograph. Blueprint § 6.1: *"The
orchard never carries text. Any surface where type must sit legibly gets ground plane under
that type, **without negotiation.** Legibility is never traded for atmosphere."*

This is not a technicality — it is **the same law that deleted EXP4's studies B and C** two
days ago, and NORTH1 § 3 scored the reference *"Broken"* on it before any of this was
built. A translucent panel or a pale sky behind type has **contingent contrast**: it cannot
be measured once (UIA § 15), which is why the reference's frosted glass is refused too and
the Companion's card is warm and opaque.

**This refusal is what produces the desktop split**, and it is the single largest visual
difference from the reference. It is a cost knowingly paid.

### 5.3 The photographic props
The notebook, the soup, the storage jars, the tote bag, the bowl of apples. Blueprint
§ 12.1 rule 2: *"Data-borne or dead. A painted prop is fabricated feeling, forbidden by
construction."* OHDB § 4: *"The house is warm because it is lived in, not because it was
dressed."* NORTH1 § 5.2 made it constructive: **where the render puts a bowl of apples, the
software puts the household's actual plan.**

### 5.4 "Nourishing food. Happy home."
A marketing line inside the product (NORTH1 § 5.7; TRANSLATION1 *Thresholds* § 9) — the
house telling the household what the house is for. A home does not do that. It is replaced
by the **state sentence** — *"Today is planned." / "Today is open."* — which occupies the
identical slot, is true, and is about the household rather than about THA.

### 5.5 Family and Pantry as glance columns
Home has **no validated data** for either. Inventing them means a new fetch and a
fabricated fact, and not fabricating is the one thing this page has never done (PX1-W0).
The glance keeps THA's real three.

The **room tiles are kept**, because they are the house's doors and *"one home, many
places"* is Home's own idea. They are lawful: the walls are untouched, they are support
surfaces in the penumbra, they are visibly subordinate to the one door, and — the part
that matters — **their hrefs, labels and glyphs are read from UX1's one navigation list**
via the new `roomsByHref`. Home owns only the sentence under each. A private copy would
have been a second owner of every room in the house, and the first rename would have
silently forked it. *(This is the element most in tension with UX1's "the BottomNav is the
sole primary navigation", and it is flagged for the reviewer rather than buried.)*

### 5.6 The clock
The reference shows `9:32 am`. That is a **CIVIL read**, and Household Time (HT1–HT18) owns
it. **CONV1 P6 is converging THA's four `getGreeting()` copies into `client/src/lib/greeting.ts`
right now.** A fifth private clock, added here, in a session that is not the convergence,
is precisely the duplication that architecture exists to retire. The existing date line is
left exactly as it was, for P6 to converge.

---

## 6. What was found by looking

Every one of these typechecked, built, and passed every gate. None was findable by reading.
This is ODL2 § 6.3's lesson repaid with interest: **a claim with no picture attached is a
claim nobody checked.**

### 6.1 The orchard through the greeting — a §6.1 violation, shipped-shaped
The first geometry was a 34% fade on a 72%-wide window. Correct at 1440, where it was
designed and screenshotted. At **768 it laid the orchard straight through the middle of
"Welcome home,"** — the exact violation the mask exists to prevent.

**A percentage cannot express "clear of the words", because it does not know where the
words end.** The fix is `max(700px, 44%)`: the greeting is capped by `max-w-xl` + the
container's padding and cannot exceed **608px**, so the image begins at **700px — 92px of
clear canvas past the worst case — at every width from `lg` up**, and the window simply
grows on a bigger wall. Provable, not lucky. `after-lg-narrow-viewport.png` is the proof
at the tightest width.

### 6.2 The greeting on the band at 820px — a Tailwind variant trap
`pageContainerClass` carries `pt-4 sm:pt-6`. tailwind-merge **only dedupes within a
variant**, so the unprefixed `pt-[clamp(...)]` that clears the band lost to `sm:pt-6` at
every width from 640 up. The room ignored the band entirely and laid the greeting across
the orchard — **while 390px, which is below `sm` and therefore unaffected, looked perfect
and was the only narrow width being looked at.**

### 6.3 Two suns in one room
Home poured `--light-ambient` *and* opened a window with the asset's own sun in it. The
result was the anti-pattern Blueprint § 16 names by name, and it looked exactly like what
it was: the whole upper room blew out to a flat yellow haze and the orchard stopped reading
as a place. **Home now pours no ambient pool at all** — it is the one room that must not.
The pool is the morning for a room with *no* window (E1). At E3 the window is open, and
one sun (§ 7) rises in it.

### 6.4 The sun in the middle of the window
Centred, the sun blew out the window: the room was brightest where it was emptiest, and the
eye went to a white patch instead of to the household's name. Sliding it out of frame keeps
the morning — the sky still glows, the hills are still lit from the left, every shadow in
the room still agrees with it. **You do not put the sun in the window. You put the orchard
in the window, and the sun is why you can see it.**

### 6.5 A ring that claimed progress at zero
A round line-cap on a zero-length dash draws a **dot**. A household who has planted nothing
this week was shown a mark on the ring. An honest nothing is nothing.

### 6.6 One crop cannot serve two shapes
`cover` resolves the shorter dimension, so the window's 168% zoom — correct for a tall
window — cropped an 820×260 band to magnified hillside: an abstract green wash with no
horizon, no trees, nothing to recognise as a place. The band now unzooms from `sm` up and
holds the whole scene.

---

## 7. Compliance

**Architecture Bootstrap** (`docs/architecture/README.md`) read first. No governing
document was amended; none needed to be (ODL2 § 7).

- **The Experience Test (EXPBLUE § 15.3).** *Which room?* Home. *How should someone feel?*
  Arrived, welcomed, unhurried, and known by name. *The one thing this room helps them do?*
  Step through the one right door for the hour — `Open today's plan` / `Plan today`.
- **The Blueprint Checks (§ 15.2).** One home ✓ (the walls are untouched at every size) ·
  a room, not a theme ✓ (nothing is drawn; there is no kitchen) · the map respected ✓ (E3,
  Home only, and no other room's exposure moved) · orchard law ✓ (one orchard, one morning,
  no text on it at any width, **still** — no drift, no sway, no parallax) · one morning ✓
  (§ 6.3 is this check catching a real fault) · material honesty ✓ (no faux material; warm
  opaque panels, not glass) · Living Detail discipline ✓ (Home's one ornament is the
  greeting, and it is data-borne; the ring draws a true number or nothing) · the Companion
  ✓ (a presence at the counter, its sentences verbatim, absent in silence) · the governance
  path ✓ (tokens only; no new visual law).
- **The Design Character Check (OHDB § 16.2).** Architectural character ✓ · composed
  emptiness ✓ — **and tested** (§ 2) · timeless not fashionable ✓ (plaster-and-morning, no
  frosted glass) · the design disappears ✓ (the most memorable thing in the frame is the
  household's own name).
- **UI Governance (UIA § 18).** One visual language ✓ (Calm Orchard, amended, never forked)
  · depth/light/ground discipline ✓ (one ground, one light, one direction, every shadow
  describing distance) · tokens ✓ (no raw value in a surface; the ODL1 chips are gone) ·
  motion ✓ (nothing moves unasked; every transition answers the hand; reduced motion
  removes all of it and withholds no words) · contrast ✓ (every surface carrying type is
  solid, so it is measurable once).
- **UX Governance / Premium Standard (EXP § 18).** One primary action ✓ (the door the
  reference lacks) · calm before capability ✓ · honest gaps ✓ (§ 2) · attention borrowed,
  never taken ✓ (no amber badge greets the arrival).
- **Adoption Register.** **76 passed · 0 notices · 2 failed.** The two failures are
  **byte-identical to the baseline ODL2 recorded** (`button-primitive` 539 > 538;
  `HouseholdNutritionPanel` orphan) and are owned by concurrent sessions. **Not masked, not
  "fixed"** — raising a ceiling to green a red gate is the one thing the register forbids
  doing quietly. Baseline was 65·1·2 before ODL2, 71·0·2 after it, and 76·0·2 now: five
  rows recorded, the same two failures.
- **Product Registry.** Home's entry describes a page whose *behaviour, data and routes are
  unchanged*; this change is presentation. Flagged for the reviewer: if the registry's Home
  entry carries a visual description, it needs the E3 view and the signature greeting added.
- **Typecheck / build.** Client typecheck **clean**; `vite build` clean; the compiled CSS
  confirms `--tw-shadow: var(--shadow-primary)` (**not** `--tw-shadow-color` — ODL2 § 6.3's
  silent bug did not recur) and `family=Caveat:wght@500;600` ships. The 304
  `server/intelligence/*` errors are the concurrent session's uncommitted work, unrelated
  and unchanged.

---

## 8. What is NOT done, and why

**The eight arrival prototypes are not deleted, so the `signature-typography` row does not
close.** That row's own rule is that it *"closes when the prototypes are deleted, not when
the decision is minuted"* — and this must be reported rather than quietly deferred, because
an ADOPT executed on the live surface while three prototypes still reach `.text-signature`
is exactly the authored-but-unadopted state the register exists to make impossible to hide.

**The reason changed mid-session, and both halves are worth recording.**

**First it was a collision.** `pages/dev/arrival-a-welcome.tsx` and
`pages/dev/arrival-s1-quiet.tsx` were being edited *while this session ran* by the
concurrent **CONV1 P6**, converging THA's four `getGreeting()` copies into the new
`client/src/lib/greeting.ts` (Household Time § 14, target 3: 4 → 1). Neither file was
modified at this session's start; both were by the time `git rm` ran, which is how the
collision surfaced. Deleting them would have **destroyed another session's in-flight
change** and **silently altered its arithmetic underneath it** — two of its four consumers
vanishing mid-convergence. So nothing this change did not own was deleted.

**Then P6 landed (`8fcb3d72`), which unblocked the files and revealed the real obstacle —
and it is governance, not collision.** P6's new `time-of-day-greeting` row carries
`adoptionFloor: 4`, and **two of those four importers *are* two of these prototypes**.
Deleting them drops `householdGreeting` to two importers and turns a just-landed,
machine-enforced gate **red**, unless that floor moves to 2 — an edit to a sibling
session's row, made while **CONV1 P7** is live in the same tree.

That floor is *transiently correct and structurally wrong*: it counts dev-only prototypes
that always carried a recorded deletion trigger as adopters. Correcting it is legitimate.
But lowering a floor to keep a gate green is the same class of move as raising a ceiling —
sanctioned **loudly, with a reason**, and never quietly — so it is a decision for the
owner, not an assumption for this change.

**Decision: leave them (Colin Clapson, 2026-07-17).** NORTH1 ships gated green and touches
no sibling session's row.

**Impact: none a household can see** — all eight are `import.meta.env.DEV` only. **The two
remaining moves are one change and must not be separated:** delete the eight prototypes
*and* drop the floor 4 → 2 with the reason recorded. Doing the first without the second
hands another session a red gate. The full file list is in the register row, and it is best
done once CONV1 P7 is also clear of the tree.

**Also open, and not this change's:**
- **Blueprint § 18.2 — Home's two shell treatments.** Home now uses the canonical
  `PageContainer` instead of its hand-rolled `max-w-3xl` (NORTH1 § 8.4), which removes the
  hand-roll. The banner is still `wide` while the body is not; whether that is *the* two
  shells the item means is the Blueprint's question, not this change's.
- **E2 and dark remain unverifiable by any surface** — no E2 room exists and the dark theme
  is unreachable. Unchanged from ODL2 § 3.6, and neither blocks Home.

---

## 9. Files changed

| File | Change |
|---|---|
| `client/src/pages/home-experience-page.tsx` | **The North Star room.** E3, the material vocabulary, the signature greeting, the three-column glance, the ring, the one door, the four doors. Behaviour, data, query keys and the three loading states unchanged. |
| `client/src/components/layout/orchard-backdrop.tsx` | The asset's one owner gains `OrchardOpenView` — the window (`lg`+) and the band (below). `OrchardBackdrop` (arrival) byte-unchanged in behaviour. |
| `client/src/components/nav-bar.tsx` | `NAV_ITEMS` exported + `roomsByHref()` added, so Home's doors read the one navigation list. Nav rendering untouched. |
| `client/src/index.css` | Caveat added to the `@import`; the `--font-signature` comment corrected to the adopted state. No value changed. |
| `client/src/App.tsx` | The `material-a-warm-layers` lazy-import and route deleted. |
| `client/src/pages/dev/material-a-warm-layers.tsx` | **DELETED** — the `depth-light-ground` closing trigger fired. |
| `scripts/capture-exp4-materiality-depth.ts` | **DELETED** — Study A's harness, with Study A. |
| `scripts/capture-north1-home.ts` | **New.** Six viewports (incl. 1024 and 820, the two that caught § 6.1/§ 6.2) + the quiet day. |
| `docs/implementation/ux/adoption-register.json` (+ regenerated `.md`) | Five rows: `depth-light-ground` **closed** · `orchard-environment` second shape + its own text corrected · `orchard-exposure` E3 has a room · `signature-typography` ADOPT executed, row honestly still open · `navigation` third consumer + first export. |
| `docs/ui-audit/north1-home/` | **New** — before, after ×4 widths, the quiet day. |

---

## 10. What this change deliberately did not do

- **No architectural decision.** No governing document amended; ODL2 had closed the gates.
- **No new visual value.** Not one colour, shadow, radius or exposure number was authored.
- **No new data, store, fetch, or route.** Every query key, cache entry, loading state,
  error state and empty state is the one that was there before.
- **No second assistant, and no re-slicing of the Notice Engine's list.** The Companion's
  sentences moved to a card against the view; they were not re-ranked or trimmed to fit the
  new shape, which would have reintroduced from the design side exactly what PHASE5E removed
  from the code side.
- **No red gate made green.** The two pre-existing failures are reported, not masked.
- **Nothing deleted that belonged to another session** — § 8.

---

*An implementation report. It applies the governing architecture and owns only this
implementation; it restates no rule, sets no value, adds no gate, and jumps no governance
path. Subordinate to the Experience Architecture, which prevails in any conflict.*

---

## 11. A note on this change's commit history

**This change's client work is committed inside `8fcb3d72`, "chore: preserve workspace
before CONV1 Phase P7 (Household Time: the anchor)" — a *different session's* commit.**
Nothing is lost, and nothing is wrong with the code; but anyone reverting needs to know it,
so it is recorded rather than left to be discovered.

The repository's workspace-preservation pattern commits **the whole tree**, so a sibling
session opening its own phase swept up NORTH1's in-progress files: `home-experience-page.tsx`,
`orchard-backdrop.tsx`, `nav-bar.tsx`, `index.css`, `App.tsx`, the `material-a-warm-layers.tsx`
and `capture-exp4-materiality-depth.ts` deletions, and `capture-north1-home.ts`. That is the
cost of three sessions sharing one working tree, and it is nobody's mistake.

> ⚠️ **Do not `git revert 8fcb3d72` to undo the North Star.** That commit also carries CONV1
> P6's landed `getGreeting` convergence and P7's opening state. Use the path-scoped rollback
> below, which is unaffected.

**Rollback:** `git checkout rollback/NORTH1-home-implementation-20260717 -- client/src/pages/home-experience-page.tsx client/src/components/layout/orchard-backdrop.tsx client/src/components/nav-bar.tsx client/src/index.css client/src/App.tsx docs/implementation/ux/adoption-register.json docs/implementation/ux/ADOPTION_REGISTER.md`
then `git checkout rollback/NORTH1-home-implementation-20260717 -- client/src/pages/dev/material-a-warm-layers.tsx scripts/capture-exp4-materiality-depth.ts`
to restore the deletions, and `npm run adoption:check` to confirm the 71·0·2 baseline returns.
The tag is at `1648fc46`, which predates every session in the tree, so it is a safe floor.

*This document, `scripts/capture-north1-home.ts`, the session record and
`docs/ui-audit/north1-home/` are additive and may simply be deleted.*
