# BRAND2 — The Embossed Apple

**Refining BRAND1 Concept 2 into the permanent architectural signature of The Healthy Apples Home.**
Exploration only. The ARRIVAL1 room is canonical and **byte-untouched** — only the apple in the plaster is studied.

| | |
|---|---|
| **Session** | `BRAND2_Embossed_Apple_Exploration` |
| **Date** | 2026-07-17 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `rollback/BRAND2-embossed-apple-20260717` → `7bfad50c` (tag `brand2-wip-snapshot-7bfad50c`) |
| **Status** | **Awaiting owner decision.** 12 treatments + 3 investigations + 1 canonical, all rendered on the live room. |
| **Product changed** | **None.** Room, arch, orchard, furniture, layout untouched. Only the expression of the mark moves. |

---

## 1. What this is, and what it is not

**Not:** a redesign. The room, the archway, the orchard, the oak console, the stone floor, the layout —
all of ARRIVAL1 — are canonical and **byte-untouched**. Nothing here changes a data source, a hook, a
route, an API, or a behaviour. This does not revisit BRAND1's ten-concept question of *where* the
identity should live; that decision (an apple pressed into the plaster) is taken as settled.

**Is:** a single-question study. BRAND1 recommended two things — reform the banner, and let *an embossed
apple* recur in the plaster (Concept 2). This document does one job: **perfect that apple.** It explores
twelve genuinely different architectural treatments of the *same idea*, investigates its ideal size,
height, placement, depth, light behaviour, colour and visibility, and recommends **one** canonical
treatment strong enough to be THA's permanent architectural signature.

**Method — rendered on the real room.** Every treatment below is injected into the **live canonical
`/home`** in the browser at render time only (`scripts/capture-brand2-embossed-apple.ts`); nothing edits
app source. So every image is the *same room*, changing *only* the apple in its wall. Renders are in
`docs/ui-audit/brand2-embossed/` — each a full-room `.png` plus an auto-clipped close-up `*-mark.png`
so subtle in-material relief is legible.

**Read before starting:** `docs/architecture/README.md` (the Bootstrap), `ARRIVAL1_DEFINITIVE_HOME.md`
(the room being signed), `BRAND1_ARCHITECTURAL_BRANDING.md` (the exploration this refines).

---

## 2. The one constraint that governs every treatment: the room has one light

The ARRIVAL1 wall is lit by a single morning that falls **from the arch, top-centre**
(`index.css`: `radial-gradient(132% 54% at 50% -8%, --wall-lit …)`). That is not a detail — it is *the*
rule of a real emboss. A shape pressed **into** plaster and lit from above shows a **dark rim along its
top** (the recess's upper wall is in shadow) and a **lit rim along its bottom** (the lower wall catches
the light). A shape standing **proud** of the wall shows the inverse. Every treatment here obeys that one
light; a mark lit from anywhere else would read instantly as a sticker, because it would disagree with
the room it sits in.

This gives the exploration a hard, physical spine: the apple is not a *picture of* an apple placed on the
wall — it is a **displacement of the plaster** that the room's own morning finds. That is the entire
difference between architecture and decoration, and it is measurable in the renders.

---

## 3. The twelve treatments

Each is rendered on the identical room. For every treatment: **render · emotional feeling · premium
quality · discoverability · first-visit impact · six-month impact · implementation complexity.** They run
from the lightest possible press, through material and depth variations, to placement and light studies.

---

### T1 — Shallow plaster emboss
*The lightest possible press, tone-on-tone.*

`t01_shallow.png` · close-up `t01_shallow-mark.png`

- **Render.** A whisper-shallow deboss beside the arch. In the close-up it is barely a breath on the wall.
- **Emotional feeling.** Serene to the point of secrecy — a mark you feel more than see.
- **Premium quality.** High *in principle* (restraint is the house's premium), but premium only counts
  if the care is **perceptible** (Experience Architecture § 17); here it verges on imperceptible.
- **Discoverability.** 🔴 **Below the visibility floor.** On the bright warm plaster the shallow press
  all but vanishes even at `deviceScaleFactor 2`; on an ordinary phone in daylight it would not exist.
- **First visit.** Very likely missed entirely.
- **After six months.** Never discovered by most households — a signature nobody meets is not a signature.
- **Implementation complexity.** Trivial (one relief token). But it fails the only test that matters:
  being seen. **Keep as the lower bound of depth, not as a candidate.**

---

### T2 — Deep carved relief
*A confident, sculptural carve with a real recess.*

`t02_deep_relief.png` · close-up `t02_deep_relief-mark.png`

- **Render.** The clearest, most unmistakable apple of the set — a genuine pressed recess, dark rim above,
  lit rim below, body a shade into the wall. Still entirely tone-on-tone.
- **Emotional feeling.** Assured, crafted, permanent — a mark made by someone confident it belonged.
- **Premium quality.** High. The depth reads as *worked stone/plaster*, not print; it is the most
  obviously hand-made of the tone-on-tone options.
- **Discoverability.** ★★★★☆ — reads on the first visit without shouting; the best-read tone-on-tone press.
- **First visit.** Noticed, quietly. "There's an apple in the wall." A small, good moment.
- **After six months.** Holds — depth ages well; it never flattens into a logo because it has real relief.
- **Implementation complexity.** Low. **The depth benchmark**: the mark must read at least this clearly.
  Its only risk is tipping from *architectural* to *emphatic* if pushed further.

---

### T3 — Lime plaster impression
*Cooler, chalky, matte — a fresco impression.*

`t03_lime.png` · close-up `t03_lime-mark.png`

- **Render.** A soft, cool, chalk-matte apple with gently mottled edges — the finish of a limewashed wall.
- **Emotional feeling.** Old-world calm; the hand-troweled quiet of a real lime room. Timeless, not styled.
- **Premium quality.** High. Lime is the most *architecturally honest* plaster finish — matte, breathable,
  no sheen to betray it as a screen effect. It reads as material, not as an image of material.
- **Discoverability.** ★★★☆☆ — present but soft; the coolness lets it recede a touch more than T2.
- **First visit.** A gentle discovery for the observant; calmer than the deep carve.
- **After six months.** Excellent — the finish most people would call "beautiful" without knowing why.
- **Implementation complexity.** Low–medium (a mottle/edge-irregularity layer). **A leading finish.**

---

### T4 — Smooth polished plaster (tadelakt / Venetian)
*A waxed sheen that catches the morning.*

`t04_polished.png` · close-up `t04_polished-mark.png`

- **Render.** 🔴 Nearly invisible. Polished plaster returns the *same bright plaster tone* as a highlight,
  so a mark made of sheen disappears into a wall that is already bright and warm.
- **Emotional feeling.** Would be luxurious (Venetian gloss), but it reads as almost nothing here.
- **Premium quality.** In theory the "expensive" finish; in this room, **the gloss erases the mark** — the
  highlight it depends on is indistinguishable from the lit plaster around it.
- **Discoverability.** 🔴 Lowest of all — worse than the shallow press.
- **First visit.** Missed.
- **After six months.** Still missed; and a glossy patch, if ever caught, would read as a *screen* artefact,
  breaking "materials before effects" (Kept Room Translation § 5).
- **Implementation complexity.** Medium. **Rejected** — the room is too light for a light-on-light gloss.
  A real finding: the premium finish is the *matte* one here, not the polished one.

---

### T5 — Aged hand-worked plaster
*Troweled, imperfect — a maker's thumbprint.*

`t05_aged.png` · close-up `t05_aged-mark.png`

- **Render.** A slightly irregular apple, a whisker off-true, with faint patina in the recess and a soft
  ghost where the trowel passed twice. The most *human* of the presses.
- **Emotional feeling.** The warmest. Someone's hands made this, and left themselves in it — the exact
  feeling of "the household's own life is the only ornament" applied to the mark itself.
- **Premium quality.** Highest of the tone-on-tone family, because imperfection is the one thing a printed
  logo can never fake. Perfection reads as manufactured; a true hand reads as cared-for.
- **Discoverability.** ★★★★☆ — the irregular edge actually *helps* it catch the light in more places.
- **First visit.** A real discovery — it looks made, not applied.
- **After six months.** The best of the set. A hand-worked mark becomes *their* wall's detail, not a brand's.
- **Implementation complexity.** Medium (irregular edge + patina + a degree of rotation). **The character
  benchmark.**

---

### T6 — Subtle shadow relief
*No fill difference at all — the apple is only a soft shadow.*

`t06_shadow_relief.png` · close-up `t06_shadow_relief-mark.png`

- **Render.** 🔴 Almost nothing — a form defined purely by a soft cast shadow, with no edge, dissolves on
  the bright wall.
- **Emotional feeling.** Ghostly; poetic in intent.
- **Premium quality.** The purest expression of "light before colour," but purity that cannot be seen is
  not craft — it is an idea.
- **Discoverability.** 🔴 Below the floor, with T1 and T4.
- **First visit / six months.** Missed, then missed.
- **Implementation complexity.** Trivial. **Keep the *principle*** (the mark should be defined by light and
  relief, not by fill colour) **and reject the *dose*** (it needs a real recess to survive the room).

---

### T7 — Raised boss
*The apple stands slightly proud of the wall.*

`t07_raised.png` · close-up `t07_raised-mark.png`

- **Render.** A low relief standing out from the plaster — lit on top, shadowed below (the inverse of a press).
- **Emotional feeling.** Confident, a touch more assertive; the apple *arrives* rather than hides.
- **Premium quality.** Good, but a proud boss reads a half-step closer to a *badge* or an *applied plaque*
  than an intaglio does — it sits *on* the wall rather than *in* it, which is subtly the wrong side of
  BRAND1's "built in, not placed on top."
- **Discoverability.** ★★★☆☆ — reads, but softly; the top highlight competes with the already-lit upper wall.
- **First visit.** Seen as a raised motif; slightly more "logo-like" than a press.
- **After six months.** Fine, but never quite loses the feeling of something added.
- **Implementation complexity.** Low. **Second to the deboss** — the press is more *architectural* because
  it is a subtraction from the wall, not an addition to it.

---

### T8 — Integrated into the arch reveal
*Pressed into the plaster soffit of the opening itself.*

`t08_arch_reveal.png` · close-up `t08_arch_reveal-mark.png`

- **Render.** 🔴 Washed out. The crown of the arch is the **brightest zone in the room** (the light spills
  from exactly there), so a mark on the reveal is bleached to nothing — and what little reads sits *on the
  room's sacred focal point.*
- **Emotional feeling.** In theory: the apple belongs to the doorway. In practice: invisible, and intrusive
  where visible.
- **Premium quality.** Undermined on both counts — unseen, and touching the one element ARRIVAL1 protects.
- **Discoverability.** 🔴 Lowest-visibility placement *and* highest-risk placement at once.
- **First visit / six months.** Missed; and any success here would be a **cost**, not a win — it dims the arch.
- **Implementation complexity.** High (must follow the curved reveal). **Rejected** — never mark the arch;
  this is the keystone risk (BRAND1 Concept 9) by another door.

---

### T9 — Beside the arch, at eye height
*The placement study: on the clear plaster, at standing eye level.*

`t09_eye_beside.png` · close-up `t09_eye_beside-mark.png`

- **Render.** The apple in the open plaster to the side of the arch, vertically centred on the arch's
  mid-upper third — clear wall all around it.
- **Emotional feeling.** Settled and natural — exactly where a plasterer would sign a finished wall: at the
  height a person reads, in the space a person's eye rests when it leaves the view.
- **Premium quality.** High — the mark has *room to be a mark*; nothing crowds it.
- **Discoverability.** ★★★★☆ — the single best placement; it occupies otherwise-empty plaster and balances
  the composition (greeting left, arch centre, Companion lower-right, apple upper-right).
- **First visit.** Found the moment the eye leaves the orchard — the natural resting point.
- **After six months.** The quiet constant of the room. **This is the placement the canonical adopts.**
- **Implementation complexity.** Low. **Placement benchmark.**

---

### T10 — Centred above the greeting
*On the room's vertical axis, over "Welcome home."*

`t10_above_greeting.png` · close-up `t10_above_greeting-mark.png`

- **Render.** The apple floated symmetrically above the greeting text.
- **Emotional feeling.** Formal, a little ceremonial — the axis makes it feel *placed by a committee*.
- **Premium quality.** Good, but symmetry reads as **logo composition**, not architecture; walls in real
  homes are signed off-centre, not on the axis of the doorway.
- **Discoverability.** ★★★☆☆ — visible, but it competes with the greeting (the room's other signature, in
  THA's own hand) for the same vertical line.
- **First visit.** Two "signatures" stacked — the hand-written name and the apple — dilute each other.
- **After six months.** The redundancy grates slightly; the greeting already names the household.
- **Implementation complexity.** Low. **Rejected on composition** — the axis belongs to the greeting.

---

### T11 — Offset architectural placement (high)
*High on the wall, off the axis, near a corner.*

`t11_offset_high.png` · close-up `t11_offset_high-mark.png`

- **Render.** The apple pushed high and to the side, up toward the top corner.
- **Emotional feeling.** Deliberately casual — but here it reads as *unanchored*, floating in the upper
  corner with nothing to relate to.
- **Premium quality.** Medium — offset placement is right in spirit (asymmetry is architectural) but this
  particular height detaches it from the eye and from the arch.
- **Discoverability.** ★★☆☆☆ — high corners are the least-looked-at plane after the floor.
- **First visit.** Easy to miss; feels arbitrary if found.
- **After six months.** Never quite becomes "theirs" — it isn't where a hand rests.
- **Implementation complexity.** Low. **Keep the *offset*, lose the *height*** — the canonical is offset
  (beside the arch, not on the axis) but at *eye* level, not up in the corner.

---

### T12 — Discovered only by light
*Present only where the arch's morning rakes the wall.*

`t12_light_discovered.png` · close-up `t12_light_discovered-mark.png`

- **Render.** 🔴 Almost gone. When the mark is made *conditional on* the light gradient, and the room's
  light is a **single fixed morning**, "only in some light" becomes "in almost no light" on a static screen.
- **Emotional feeling.** The most romantic idea in the study — a secret the light tells.
- **Premium quality.** The concept is sophisticated (light as brand carrier); the execution, on a fixed
  morning, tips into invisibility — a gimmick that mostly doesn't fire.
- **Discoverability.** 🔴 Near the floor.
- **First visit / six months.** Mostly missed; occasionally a "did I see that?" — too unreliable to be *the*
  signature.
- **Implementation complexity.** High (the reveal must track the exact light gradient). **Keep the *idea* as
  a modifier, not the mark:** a permanent low relief that the light *deepens* — never a mark the light must
  *create.* (This is the difference the canonical draws.)

---

## 4. The investigations

### 4.1 Ideal size — `study_size.png`
Three presses at **96 / 150 / 210 px** on the desktop room. The **96 is a ghost**; the **150 reads
gently**; the **210 reads clearly.** Presence scales with size, and the visibility floor on this plaster
sits around **~140 px** for a tone-on-tone press. **Verdict: 150–165 px** at the 1440 composition —
roughly **40 % of the arch's width** — large enough to hold, small enough never to rival the arch. As a
responsive rule that tracks the arch: **`clamp(112px, 11vw, 168px)`.**

### 4.2 Ideal height — `study_height.png`
The same apple **low** (by the console), at **eye** level (mid-arch), and **high** (near the top). Low
**competes with the greeting and the day's furniture**; high feels **detached** from where a person looks;
**eye level, in the clear plaster, is the natural resting point** for the gaze as it leaves the orchard.
**Verdict: eye height** — vertically centred on the arch's mid-to-upper third, never near the greeting,
never on the floor plane, never at the top edge.

### 4.3 Ideal placement
From T9 / T10 / T11: **beside the arch, offset to the right, at eye height, in open plaster** wins. On the
axis (T10) it fights the greeting; high in the corner (T11) it floats; on the arch (T8) it dims the focal
point. The right home is the **empty plaster between the arch and the Companion card** — where it also
*balances* the composition rather than adding to a crowded plane.

### 4.4 Ideal depth
T1 (shallow) and T6 (shadow-only) **fall below the visibility floor**; T2 (deep) **reads clearly**. The
sweet spot is **medium-shallow**: deep enough to survive an ordinary screen in daylight, shallow enough to
stay a whisper — in real-plaster terms, a **~1.5–2.5 mm relief**, not a deep gouge. Depth, not colour, is
the honest lever for discoverability (see 4.6).

### 4.5 Interaction with orchard light
The room's one morning is the mark's whole lighting rig (§ 2). The press must be **oriented to it** — dark
rim up, lit rim down — so the light *belongs* to the recess. The best behaviour (from T12's failure) is a
**permanent relief the morning deepens on its near side**, brightening the upper-left of the recess and
letting the far side settle into the wall — *always present, never conditional.*

### 4.6 Should it ever carry colour? — `study_colour.png` — **the assumption, challenged**
Rendered honestly: **tone-on-tone**, a **faint orchard-green** recess, a **faint apple-red** recess.
The empirical result is unambiguous and uncomfortable: **the green apple is the single most legible mark
in the entire exploration.** Colour wins discoverability outright. So the assumption *is* wrong on the
narrow question of "what reads best."

**And yet colour is still rejected — for a reason the visibility test cannot see.** A coloured apple on
the wall stops being a *displacement of the plaster* and becomes a *thing printed on the plaster* — which
is the exact "placed on top" BRAND1 and the mission set out to escape. The deboss has **one** claim to
premium: that it *is the wall*, not an image on it. Pigment breaks that claim in a single stroke; the moment
the apple is green, it is a logo again, and every governing line the room obeys turns against it —
"light before colour," "materials before effects," "tone-on-tone," "the household's own life is the only
ornament," "premium through restraint." The green's legibility is real, but it buys visibility by spending
the one thing that made the mark worth having.

**The resolution keeps both truths:** solve discoverability with **depth, size and the room's own raking
light** (4.1, 4.4, 4.5) — *not* with pigment. The recess may **catch** the orchard's warm morning (a
colour *borrowed* from the room's light, the same warmth on every ivory object in the room), but it holds
**no paint.** Colour that the light brings is architecture; colour that is applied is a sticker.

### 4.7 Visible always, or revealed by light?
T12 shows that a mark *conditional on* light, in a fixed-morning room, mostly fails to appear. The honest
answer is **both, in the right order: always faintly present, and more fully revealed where the light finds
it.** It is a permanent low relief (so a household on any screen, at any glance, meets it) that the arch's
morning **deepens** rather than **switches on.** Presence first, poetry second.

---

## 5. The treatments at a glance

| # | Treatment | Finish / plane | Reads on first visit? | Premium | Verdict |
|---|---|---|---|---|---|
| T1 | Shallow emboss | plaster, tone-on-tone | 🔴 below floor | ★★★★☆ (if seen) | depth lower-bound |
| T2 | Deep carved relief | plaster, deeper recess | ★★★★☆ | ★★★★☆ | **depth benchmark** |
| T3 | Lime impression | lime, matte chalk | ★★★☆☆ | ★★★★★ | **leading finish** |
| T4 | Polished plaster | tadelakt gloss | 🔴 vanishes | ★★☆☆☆ here | rejected (too light-on-light) |
| T5 | Aged hand-worked | troweled, imperfect | ★★★★☆ | ★★★★★ | **character benchmark** |
| T6 | Shadow relief only | no fill, soft shadow | 🔴 below floor | ★★★☆☆ | principle yes, dose no |
| T7 | Raised boss | proud of wall | ★★★☆☆ | ★★★★☆ | 2nd to the press |
| T8 | Arch reveal | on the arch soffit | 🔴 washed + intrusive | ★★☆☆☆ | rejected (never mark the arch) |
| T9 | Beside arch, eye height | placement | ★★★★☆ | ★★★★★ | **placement benchmark** |
| T10 | Above the greeting | axis placement | ★★★☆☆ | ★★★☆☆ | rejected (axis is the greeting's) |
| T11 | Offset high | corner placement | ★★☆☆☆ | ★★★☆☆ | offset yes, height no |
| T12 | Discovered by light | light-conditional | 🔴 unreliable | ★★★★☆ | idea as modifier, not mark |

---

## 6. Recommendation — **the canonical embossed apple**

> ### "The Pressed Apple"
> **An apple in aged hand-worked lime plaster, tone-on-tone, pressed a medium-shallow relief into the
> open wall beside the arch at eye height — always quietly present, and deepened where the arch's morning
> grazes it.**

Render: **`canonical.png`** (in room) · **`canonical-mark.png`** (close-up).

It is the synthesis the twelve treatments and seven investigations converge on — each benchmark, none of
the failures:

| Dimension | Specification | From |
|---|---|---|
| **Finish** | Aged, hand-worked **lime** plaster — matte, chalky, faintly irregular edge, a whisper off-true, a trace of patina in the recess. **Not** polished (T4 vanished), **not** machine-crisp. | T3 + T5 |
| **Colour** | **None.** Tone-on-tone. The recess *catches* the orchard's warm morning; it holds no pigment. | 4.6 |
| **Depth** | **Medium-shallow** deboss (~1.5–2.5 mm in real plaster) — reads on an ordinary screen, stays a whisper. | 4.4 (T1/T6 floor, T2 benchmark) |
| **Orientation** | Dark rim **up**, lit rim **down** — pressed *in*, lit by the room's one morning. | § 2 |
| **Size** | ~150–165 px at the 1440 room (≈ 40 % of the arch); responsive `clamp(112px, 11vw, 168px)`, tracking the arch. | 4.1 |
| **Height** | **Eye level** — centred on the arch's mid-to-upper third. | 4.2 |
| **Placement** | On the open plaster **beside the arch, offset right**, in the space between arch and Companion card; wall visible all around. **Never** on the arch, console, or floor. | 4.3 (T9), 4.7 |
| **Light behaviour** | **Always faintly present**; the morning **deepens** its near (upper-left) side and lets the far side settle into the wall. Never light-*conditional*. | 4.5, 4.7 (T12 as modifier) |

**Why this is the signature, and not any single treatment.** The strongest tone-on-tone press (T2) proves
the mark can *read*; the lime and aged finishes (T3, T5) prove it can be *loved*; the placement study (T9)
proves *where* it belongs; and the failures draw the guardrails — never so shallow it vanishes (T1, T6),
never glossy (T4), never on the sacred arch (T8), never on the greeting's axis (T10), never floating in a
corner (T11), never a mark the light must switch on (T12). The Pressed Apple is what remains when every
one of those errors is removed: **a subtraction from the wall, made by a hand, found by the morning.**

**It satisfies the whole governing canon at once** — "built in, not placed on top" (it *is* the wall);
"premium through restraint" (Experience Language § 4A); "the household's own life is the only ornament"
(the hand-worked imperfection is the only flourish); "light before colour / materials before effects"
(Kept Room Translation § 5); "technology should quietly disappear; the household should always feel
present" (Experience Blueprint § 1.5). And it answers BRAND1's framing finding — *the arch is the apple,
opened to the size of a home* — by pressing the small apple, quietly, into the wall the great one is cut
into: the same mark at two scales, one you walk toward and one your hand could rest beside.

**First visit:** a small, genuine discovery — "there's an apple in the wall" — the moment the eye leaves
the orchard. **After six months of daily mornings:** no longer a brand at all, but a detail of *their*
wall — the quiet constant a home earns by being lived in. That is the difference between a logo, which you
notice and then ignore, and a signature, which you stop noticing because it has become *yours*.

**The recurrence (beyond Home).** Because it is defined as material and relief rather than as a placed
image, the Pressed Apple can recur **once per room**, in each room's plaster — one quiet signature running
through the whole house, exactly as BRAND1 Concept 2 proposed. That is a platform decision beyond Home's
scope and is **recorded, not taken here.**

---

## 7. Honest gaps, and what this is not claiming

- ⚪ **Exploration only — nothing is built.** The canonical is a *rendered specification*, injected on the
  live room, not shipped. Building it is a later, separately-approved change: one relief treatment on the
  `.home-arrival` wall (a masked pseudo-element with the two-rim deboss filter and the lime fill), plus its
  responsive size token — no data, hook, route, API, or behaviour, and the arch untouched.
- ⚪ **Colour is rejected on judgement, not on data.** § 4.6 is explicit that a coloured apple reads *better*;
  the recommendation overrides that measurement on architectural grounds and says so, so the owner can
  overrule it with eyes open. If discoverability ever proves insufficient in the wild, the honest lever is
  **more depth or size**, not pigment.
- ⚪ **Screen fidelity vs. real plaster.** These renders approximate plaster relief with layered
  drop-shadows and masks. On a true implementation the emboss should be built from the room's actual light
  model, and re-judged on real devices in real daylight — the visibility floor (§ 4.4) will shift with the
  final material.
- ⚪ **The banner is assumed already reformed** (BRAND1 § 4, C+D: the band dissolved into plaster, a single
  quiet apple where the logo was). Every treatment here hides the current logo so the wall carries the
  identity alone; this study does not re-open that decision.

---

## 8. Verification

| Check | Result |
|---|---|
| Room / arch / orchard / furniture / layout modified | **None.** Every treatment injected in the browser only; app source byte-untouched. |
| Treatments rendered | **12** distinct architectural treatments + **3** investigations (size · height · colour) + **1** canonical, all on the live `/home` (populated), 1440×1400 · `deviceScaleFactor 2`. |
| Per-treatment analysis | render · emotional feeling · premium quality · discoverability · first-visit · six-month · implementation complexity — all present. |
| Investigations | ideal size · height · placement · depth · light interaction · **colour (challenged)** · visibility (always vs revealed) — all resolved with a verdict. |
| Emboss physics | Every treatment oriented to the room's one light (dark rim up, lit rim down for a press). |
| One canonical recommendation | **The Pressed Apple** — fully specified (§ 6), strong enough to be the permanent signature. |
| Product / schema / migration / tests | **None** — exploration only. |

**Artifacts**
```
scripts/capture-brand2-embossed-apple.ts     the render harness (injects on the canonical room; ONLY=… to re-render one)
docs/ui-audit/brand2-embossed/               baseline · t01..t12 (+ -mark close-ups) · study_size/height/colour · canonical
client/public/_brand2-apple.png              a copy of the apple icon, for browser-side injection
                                             (throwaway — nothing imports it; safe to delete)
```

---

*BRAND2 — the embossed apple, perfected. Not the shallowest press (it vanishes), not the glossiest (it
vanishes), not the coloured one (it becomes a logo), not the one on the arch (it dims the room). The
signature is a hand-pressed apple in lime plaster, tone-on-tone, beside the arch at eye height, that the
morning finds — the arch's own apple, small enough to press into the wall you stand beside. A subtraction
from the plaster, made by a hand, found by the light.*
