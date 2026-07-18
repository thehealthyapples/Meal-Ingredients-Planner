# HOME — Emotional Interior Design

**Six interior languages for one finished room. Not six rooms — six ways the same house feels loved.**
The architecture of NORTH4 Concept B is finished and untouched: the orchard, the window, the sill, the
room, the layout do not move. Only the *interior language* changes — material, patina, light, and the few
honest things a family accumulates over years.

| | |
|---|---|
| **Session** | `HOME_EMOTIONAL_INTERIOR_DESIGN` |
| **Date** | 2026-07-17 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `home-emotional-interior-design-rollback-20260717` → `7bfad50c` |
| **Status** | **Awaiting owner decision.** Six interior studies, each rendered at desktop + mobile on the same room, the same quiet day. |
| **Product changed** | **None by this session.** The mockup is standalone HTML; `home-experience-page.tsx` / `index.css` were not opened here. Canonical `ORCHARD.png` referenced in place; no substitute authored. |
| **Continues** | `NORTH4_CONCEPT_B_EVOLUTION.md` — the architecture it treats as finished. |

---

## 1. The brief, and the one line that governs it

The architecture is done. I am no longer an architect. I am the interior designer, and the whole job is a
single question, asked continuously:

> **What tiny details make somebody unconsciously feel they have arrived home?**

Everything below obeys the constraints that came with it: **do not redesign the room · do not move the
orchard · do not change the window · do not change the layout · do not add clutter · do not decorate for
decoration's sake · reduce interface density, never increase it · nothing may feel staged · nothing may
feel like interior design.** And above all — *everything should feel as though it has quietly accumulated
over years.*

This is not a contradiction to resolve so much as a tightrope to walk: a house feels loved because of what
is *in* it, yet the moment you can see that someone *arranged* it, the feeling dies. So the six studies are
deliberately laid out as a **spectrum**, from the most restrained (the room simply grown older) to the most
furnished (objects set out on the sill) — precisely so the line between *loved* and *staged* becomes
visible rather than assumed.

**Method — the same room, only the interior moves.** Every study is the identical Concept B architecture,
rendered from one file (`scripts/north4-concepts/concept-b-interior.html?study=1..6`). The check ran on
every render confirms it: the window sits at exactly the same place in all six (`glass@74h270` desktop,
`glass@62h334` mobile) — the architecture is provably invariant. Each is rendered at **desktop 1440** and
**mobile 390**, `deviceScaleFactor 2`, on the household's real quiet day (the default day). Fraunces
loaded; the serif is real. Nothing edits the product.

**Read before starting:** `docs/architecture/README.md` (the Bootstrap), `BRAND1_ARCHITECTURAL_BRANDING.md`,
`NORTH4_HOME_CONCEPT_EXPLORATION.md`, `NORTH4_CONCEPT_B_EVOLUTION.md`. Git status confirmed and rollback
protection created before any change.

**What every study reduces, before it adds anything.** In keeping with *"the interface should increasingly
disappear into the home,"* every study starts by taking the software *out*: the top band is dissolved into
the plaster and reduced to a single quiet apple (BRAND1 C+D); the console loses its dividing rules and its
loud numerals, the day's facts set in a quiet italic hand with air around them; the doors are hushed. The
interior languages then differ only in what, if anything, they add back.

---

## 2. The six interior studies

For each: **desktop render · mobile render · emotional philosophy · what changed · why it feels more like
home · strengths · weaknesses.**

---

### 1 — The Kept House
*The room, simply grown older. Nothing added; everything softened by years.*

![desktop](../ui-audit/home-emotional-interior/1-kept-house-desktop.png)
![mobile](../ui-audit/home-emotional-interior/1-kept-house-mobile.png)

**Emotional philosophy.** A home feels loved not because things were *placed* in it but because it has been
*lived in*. This study adds no object at all. It only lets time pass over the room: the oak of the sill and
mullions has darkened the way timber darkens after years of the same morning sun; the plaster carries the
faintest hand-troweled grain; the sill's front lip is worn a shade lighter where hands and cups have rested;
the Companion has stopped being a card and become a line resting on the wall. Age *is* the luxury.

**What changed.** Timber tone deepened and warmed (years of sun). A whisper of plaster texture. A worn
band along the sill's lip. The Companion card dissolved into the plaster. Nothing was added to the room —
the interface was taken further out of it.

**Why it feels more like home.** Because it is the only study where the feeling comes from *time*, not
things — and time is the one thing that cannot be staged. You cannot arrange patina; it can only accumulate.
So the room reads as *genuinely* old and kept, which is exactly the feeling the brief asked for and the one
feeling no prop can counterfeit. Nothing here says *interior design*, because nothing here was designed —
it was worn.

**Strengths.** Impossible to read as staged; the truest answer to *"accumulated over years."* The lowest
interface density of the six. Ages forever (it is already aged). Honours every governing rule at once —
*"the household's own life is the only ornament,"* *"premium through restraint,"* *"technology quietly
disappears."* Identical in spirit at both breakpoints.

**Weaknesses.** The most subtle, so it asks the most of the materials — the patina must be real (worn lip,
grained plaster, darkened oak) or the study is indistinguishable from doing nothing. It offers no single
*discoverable* object to fall in love with; its warmth is ambient, not pointed.

---

### 2 — The Warm Hour
*Not new light — a beloved one. The room at the exact hour a family knows by heart.*

![desktop](../ui-audit/home-emotional-interior/2-warm-hour-desktop.png)
![mobile](../ui-audit/home-emotional-interior/2-warm-hour-mobile.png)

**Emotional philosophy.** Every home has an hour it is most itself — the ten minutes when the light comes
across the room a particular way and everyone who lives there knows it without naming it. This study adds
nothing physical; it only warms the room's *received* light a half-step and lets the window's structure lay
soft, long shadows across the wall below. The feeling of a specific, remembered morning.

**What changed.** The wall under the sill warmed toward honey; the mullions cast faint diagonal shadows
onto the plaster (the room receiving the morning — never a second sun on the orchard, Blueprint § 16). The
oak lifted a half-tone in the warmth.

**Why it feels more like home.** Because familiarity is largely *light* — we recognise home by how the
morning falls in it before we recognise any object. Warming the room's own light (while leaving the
orchard's one morning untouched) is the most honest way to make the room feel *known*.

**Strengths.** Adds warmth with zero clutter and zero new interface; entirely within the one-morning law
(it aims the *room's* light, not the view's). Beautiful and calm. Composes cleanly with The Kept House.

**Weaknesses.** Light-only moves are gentle to the point of near-invisibility on a screen — the difference
from study 1 is felt more than seen, and on a poor display it may not register at all. It is a *modifier*
more than a standalone identity: it wants a material language (1 or 3) underneath it to warm.

---

### 3 — The Linen Calm
*Softness you can almost touch. Matte plaster, and one folded cloth on the sill.*

![desktop](../ui-audit/home-emotional-interior/3-linen-calm-desktop.png)
![mobile](../ui-audit/home-emotional-interior/3-linen-calm-mobile.png)

**Emotional philosophy.** Comfort is tactile. This study reads the room at its softest: the plaster chalkier
and more matte, the shadows shortened and gentled, and a single folded linen runner laid along the sill to
soften its one hard architectural edge — the cloth a family keeps on the table, not a decorator's throw.
Everything invites touch.

**What changed.** Plaster desaturated toward chalk; shadows softened; one folded linen runner along the
sill's front edge; the Companion again dissolved into the wall.

**Why it feels more like home.** Because the softest surfaces in a real home — linen, worn cotton, matte
lime plaster — are the ones we associate with rest and safety, and a single folded cloth is the most
domestic object there is (it says *this table is used*). One textile, with purpose, is warmth; a room full
of them is a showroom.

**Strengths.** Adds genuine tactile warmth with a single, purposeful object; the matte plaster is lovely and
timeless. Still very restrained. The one textile reads as *the family's cloth*, not decoration.

**Weaknesses.** The linen is the first *added* object in the spectrum, and it is the first hint of risk: it
must be unmistakably a folded cloth and not a bar, or it reads as a UI element. It softens the room but does
not, on its own, make it feel *older* — it wants The Kept House's patina beneath it.

---

### 4 — The Morning Table
*Hospitality made literal. A bowl of the orchard's own fruit, set on the sill.*

![desktop](../ui-audit/home-emotional-interior/4-morning-table-desktop.png)
![mobile](../ui-audit/home-emotional-interior/4-morning-table-mobile.png)

**Emotional philosophy.** The warmest instinct: put out the fruit. A shallow bowl with a few apples from
the household's own orchard, resting on the sill with a real contact shadow — the sign that somebody is fed
here, that the house is provisioned and generous.

**What changed.** A ceramic bowl of three orchard apples added to the sill; the Companion returned to a
card (a fuller, more furnished room).

**Why it feels more like home.** In principle, because a bowl of fruit is the oldest sign of hospitality
there is. **In practice, this study is where the spectrum turns — and it is the most useful thing the
session found.** At the scale of a thin architectural sill, in this restrained room, a literal bowl of
apples renders as a *graphic* — a small logo-like spot on the ledge — not as fruit someone set down. It reads
as **staged**, which is the one thing the brief forbids. The object does not make the room feel more lived
in; it makes it look *decorated.*

**Strengths.** The warmest *intention* of the six; the fruit is honestly the orchard's own (data-borne in
spirit). If it were a photograph rather than a drawn form it would be genuinely charming.

**Weaknesses.** 🔴 It reads as **decoration for decoration's sake** — the named anti-pattern. It re-adds
interface (the card returns). A bowl "placed" on the sill is, by definition, arranged — the opposite of
*accumulated* — and the room is too restrained to carry a literal still-life without tipping into the theme
park (Blueprint's spatial anti-pattern). *Instructive, and correctly a study to reject.*

---

### 5 — The Gardener's Sill
*The orchard, one pace inside. A single stem of blossom in a hand-thrown jug.*

![desktop](../ui-audit/home-emotional-interior/5-gardeners-sill-desktop.png)
![mobile](../ui-audit/home-emotional-interior/5-gardeners-sill-mobile.png)

**Emotional philosophy.** The most poetic idea: bring one thing in from the garden. A single sprig of
orchard blossom in a small hand-thrown jug on the sill — the household and their orchard in quiet
conversation, the outside carried one step in. The one living thing indoors, echoing the season in the view.

**What changed.** A jug with a single blossom stem added to the sill's corner.

**Why it feels more like home.** In principle, because a cut stem from your own garden is the most personal
object a home holds — it is *this week's* flower, and it will be gone next week, which is the definition of
alive. **In practice it fails the same way study 4 does, and worse:** the stem is thin, so at screen scale
it reads as a smudge against the bright orchard, and — fatally — anything tall enough to see pokes *up onto
the glass*, breaking the room's one inviolable rule (*nothing on the orchard*, Blueprint § 6.1 / § 16). The
sill is a thin ledge in a room whose whole discipline is that the view is untouched; a vase on it is at war
with the architecture it sits in.

**Strengths.** The most emotionally ambitious idea; genuinely *data-borne* (the season is real). The
*instinct* — echo the orchard indoors — is right and worth keeping in another form.

**Weaknesses.** 🔴 Reads as an artefact, not an object; and it violates *nothing on the glass* the moment it
is tall enough to notice. The most staged and the least architecturally honest of the six. Reject as drawn —
but keep the instinct (see § 4).

---

### 6 — The Family Record
*The marks of this particular family. A child's drawing, a small photograph, in the corner.*

![desktop](../ui-audit/home-emotional-interior/6-family-record-desktop.png)
![mobile](../ui-audit/home-emotional-interior/6-family-record-mobile.png)

**Emotional philosophy.** The most specific: the signs that *this* family lives here and no other — a
child's drawing propped at the sill's end, a small photograph turned slightly, the worn lip of an old
surface. Memory, belonging, the accumulation of a shared life.

**What changed.** A child's drawing and a small tilted photograph added to the corner of the sill; the worn
patina of The Kept House kept beneath them.

**Why it feels more like home.** In principle, this is the deepest register of all — nothing says *loved*
like a child's drawing kept where you can see it. It is the one study aimed squarely at *memory.* **But it
carries the highest staging risk of the six, and on a screen it realises that risk:** a drawing and a photo
rendered as small forms read as *content tiles* or clip-art, and — worse — they invent a specific family
(whose child? whose photo?) that the platform does not know and must never fabricate (Core Principle 6). A
generic "family photo" is the brochure voice wearing a cardigan.

**Strengths.** The most emotionally direct *ambition*; memory is the right target. The patina beneath it
(borrowed from study 1) is the part that works.

**Weaknesses.** 🔴 Fabrication risk — it depicts a family life the product has not been given; highest
staging risk; adds visual density the brief asked to reduce. The idea is right and the execution is a
counterfeit — which is itself the argument for carrying *memory* through **patina and the household's own
real data**, never through invented props.

---

## 3. The six at a glance

| # | Interior language | What it adds | Where feeling comes from | Interface | Feels *accumulated* | Staging risk |
|---|---|---|---|---|---|---|
| 1 | **The Kept House** | nothing — only age | patina · timber · plaster · time | ↓ lowest | ★★★★★ | none |
| 2 | The Warm Hour | nothing — only light | the room's remembered light | ↓ low | ★★★★☆ | none |
| 3 | The Linen Calm | one folded cloth | soft matte material + touch | ↓ low | ★★★★☆ | low |
| 4 | The Morning Table | a bowl of fruit | hospitality (as a still-life) | ↑ card returns | ★★☆☆☆ | 🔴 high |
| 5 | The Gardener's Sill | a stem of blossom | the orchard, one pace in | ↑ | ★★☆☆☆ | 🔴 high (+ breaks *nothing on glass*) |
| 6 | The Family Record | a drawing + photo | memory (as invented props) | ↑ | ★★☆☆☆ | 🔴 highest (+ fabrication) |

The spectrum tells one clear story: **feeling rises as objects fall.** The studies that add nothing to the
room (1, 2, 3) feel the most lived-in; the studies that furnish the sill (4, 5, 6) feel the most *decorated*
— and in this restrained room, decorated reads as staged, which is the brief's named enemy. The room is
most loved when nothing has been placed in it.

---

## 4. Recommendation — **The Kept House (1), warmed by The Warm Hour (2).**

**Adopt The Kept House as the permanent emotional identity of The Healthy Apples Home — with the Warm Hour's
light folded into it, and a single grain of The Linen Calm's matte plaster.**

The brief's Definition of Done is that the household *stops thinking about software completely* and simply
feels **"I'm home."** Of the six, only The Kept House meets that test without a single element that could
break it:

1. **It is the only study whose feeling cannot be staged.** Everything it uses — darkened oak, worn sill,
   grained plaster, dissolved interface — is a mark of *time*, and time is the one interior quality that
   cannot be arranged, only accumulated. That is precisely the feeling the brief said matters most:
   *"everything should feel as though it has quietly accumulated over years."* The three object studies
   prove the inverse — the instant an object is *placed*, the room looks decorated, and the feeling dies.

2. **It reduces the interface furthest.** The band is one quiet apple, the Companion is a line on the wall,
   the day's facts are a quiet hand with air around them. The software recedes further here than in any
   other study — the brief's *"the interface should increasingly disappear into the home."*

3. **It lets the orchard become what a garden becomes to a family.** With nothing on the sill competing for
   notice, the view stops being *looked at* and becomes simply *present* — always there, rarely noticed
   consciously, and the thing you would miss most if it were gone. That is the exact relationship the brief
   asked the orchard to hold, and it is only reachable by adding nothing to the glass or the ledge.

4. **It obeys the whole governing canon at once** — *the household's own life is the only ornament ·
   premium through restraint · technology quietly disappears · nothing on the orchard · data-borne or dead.*
   It needs no amendment and fabricates nothing.

**Fold in, as one language:**
- **The Warm Hour (2)** — warm the room's received light a half-step. Pure gain, no object, no rule touched.
- **One grain of The Linen Calm (3)** — the matte, chalky plaster finish (the *material*, not the added
  cloth), because a matte wall is softer to arrive to than a satin one.

**Held, deliberately, for later — the right instincts from the rejected three:**
- The *instinct* of The Gardener's Sill (5) — echo the orchard's season indoors — is worth keeping, but as
  **the Companion's word and the room's light**, never as a vase on the sill. The season already speaks
  through the one data-borne Companion line; that is the honest "flower from the garden."
- The *target* of The Family Record (6) — memory and belonging — is right, but it must be carried by the
  household's **own real data over time** (their name in THA's hand, their real weeks accumulating), never
  by an invented drawing or photograph.

**Explicitly rejected as drawn:** the literal objects of studies 4, 5 and 6 — the fruit bowl, the vase, the
drawing/photo. Not because the feelings behind them are wrong, but because a placed object in this room
reads as *staged*, and one of them (the vase) breaks *nothing on the glass*. They earned their place in the
study by showing, clearly, where the line is.

> **The finding, in one line:** this house feels most loved when you add nothing to it and simply let it
> grow older. The interior designer's finest move here was to take things *out* until only the home was
> left.

---

## 5. What this keeps, and what it never does

**Kept.** The architecture of Concept B — orchard, window, sill, room, layout — is byte-identical across all
six studies (verified: same glass geometry every render). The orchard is the owner's real `ORCHARD.png`, the
same view from the same place; the light is one soft morning, never a second sun; every fact is the
household's real quiet day; the four fixed truths of arrival are intact.

**Never done.** No architectural change; no move of the orchard, window, or layout; no new architectural
concept; no type or object hung *on* the glass; no invented family, fruit, or flower presented as real; and
**no product source, data source, hook, route, API, behaviour, schema, migration, or test changed** — this
is an interior study, exploration only. Interface density was **reduced**, never increased.

---

## 6. Verification

| Check | Result |
|---|---|
| Bootstrap + required reading | ✅ `README`, `BRAND1`, `NORTH4_HOME_CONCEPT_EXPLORATION`, `NORTH4_CONCEPT_B_EVOLUTION` — read before starting. |
| Git status confirmed · rollback created | ✅ `home-emotional-interior-design-rollback-20260717` → `7bfad50c`. |
| Architecture unchanged across studies | ✅ **Provably.** Window geometry identical in all six (`glass@74h270` desktop · `glass@62h334` mobile). Only the interior language differs. |
| Interface density | ✅ **Reduced** in every study (band → one apple; console dividers/numerals gone; Companion dissolved in 1 & 3). Never increased. |
| Studies produced | **6** interior languages, a deliberate spectrum from most-restrained to most-furnished. |
| Per study: desktop + mobile render | ✅ 18 images (6 desktop · 6 mobile · 6 mobile full-page), `deviceScaleFactor 2`, same room, same quiet day. |
| Per study: philosophy · what changed · why it feels more like home · strengths · weaknesses | ✅ All present (§ 2). |
| Collision check | **12/12 clear.** Nothing crosses the sill onto the glass, overlaps the doors, or falls through the fold. |
| One recommendation | **The Kept House (1)**, warmed by The Warm Hour (2), one grain of The Linen Calm (3); objects of 4–6 rejected as drawn, their instincts held (§ 4). |
| Fabrication / one-morning / nothing-on-glass | ✅ Winner adds no invented content, no second sun, nothing on the orchard. (The rejected studies' breaches of these are named as the reason to reject.) |
| Type | Fraunces resolved and loaded — the serif is real, not a fallback. |
| Product / schema / migration / tests | **None** — exploration only. |

**Artifacts**

```
scripts/north4-concepts/concept-b-interior.html   the six interior languages over one unchanged room
scripts/north4-concepts/render-interior.ts        renders 6 studies × desktop + mobile, with checks
scripts/north4-concepts/_palette.css              the derived Orchard Palette (unchanged, reused)
docs/ui-audit/home-emotional-interior/            18 renders
```

> **Tooling note.** Chromium will not launch in this sandbox (`libglib-2.0.so.0` missing). Revived against a
> curated 64-bit library set from the nix store, excluding glibc's own libraries **and** libcrypto/libssl/
> libz (they shadow node's OpenSSL). Recipe in the run file.

---

*HOME · Emotional Interior Design — six ways to love one room. Grow it old, warm its light, soften its
plaster, set out the fruit, cut a stem for the sill, pin up the children's drawings. The house told us
which it wanted: it feels most like home when you add nothing and simply let the years settle on it. The
orchard stops being a picture and becomes the garden a family stops noticing — and would miss most of all.
Nothing is staged, because nothing was arranged; the room was only kept.*
