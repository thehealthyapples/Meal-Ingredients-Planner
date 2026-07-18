# NORTH4 — Home Concept Exploration

**Three entrance halls for The Healthy Apples.**
Discovery only. No concept implemented. No CSS written into the product.

| | |
|---|---|
| **Session** | `NORTH4_Home_Concept_Exploration` |
| **Date** | 2026-07-17 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `rollback/NORTH4-home-concept-exploration-20260717` → `a9116faa` (tag `north4-wip-snapshot-a9116faa`) |
| **Status** | **Awaiting owner decision.** Three concepts; two of them need a named amendment before they may be built. |
| **Product changed** | **None.** `home-experience-page.tsx` byte-untouched. `index.css` byte-untouched by this session. |
| **Added** | 2 analysis scripts, 3 standalone mockups, 15 rendered screenshots, this report. |

---

## 1. What this session did, and did not

**Did not:** touch Home, author a colour token, amend a document, or author a substitute orchard asset. The canonical `ORCHARD.png` is read in place and is byte-untouched.

**Did:** measure the orchard's actual pixels, derive a palette from them, and compose three genuinely different rooms around it — rendered at desktop, tablet and mobile, and verified for collisions rather than eyeballed.

The mockups are standalone HTML under `scripts/north4-concepts/`. Nothing in the app imports them. They reference the real artwork by path, so what you see is the real orchard, not an impression of it.

**Read before starting:** `docs/architecture/README.md` (the mandatory Bootstrap), the Experience Blueprint (§ 5.1, § 6, § 7, § 8, § 16), the Orchard House Design Blueprint, the Kept Room Translation, the Experience Language (§ 3A), all five North Star v2 renders, both v1 kitchen concepts, and the new `ORCHARD.png`.

---

## 2. The finding: why Home does not feel like the orchard

The current Home is well engineered and it still reads as a beautifully designed web application. The reason is measurable, and it is not composition. **It is the colour.**

I decoded every one of `ORCHARD.png`'s 1,573,538 pixels and built a hue histogram of the 1,544,214 that carry any chroma at all.

| Hue band | What lives there | Share of the orchard's chroma |
|---|---|---|
| **30°–80°** | gold, olive, oak, leaf, blossom, shadow — *the entire artwork* | **94.37%** |
| 85°–160° | any cool green whatsoever | 1.12% |
| **110°–140°** | **THA's mint / sage** | **0.01%** |

Home's three most load-bearing colours are:

```css
--primary:    132 14% 44%;   /* every button, every link, the ring */
--foreground: 120 14% 14%;   /* every word on the page */
--accent:     118 19% 94%;
```

**All three sit in a hue band that accounts for one hundredth of one percent of the orchard.** Not a small share — an absence. There is effectively no pixel in the artwork that is the colour of THA's own primary.

That is why the room does not belong to the orchard. Every word the household reads, and every button they press, is painted in a hue the orchard does not contain. No amount of recomposition fixes that, and it is not a matter of taste — it is arithmetic.

The one token already living in the orchard's world is `--secondary: 42 89% 61%`, which sits almost exactly on the artwork's sunlit foliage (`hsl(47 79% 44%)`). It is the only one.

> Reproduce: `npx tsx scripts/extract-orchard-palette.ts`

---

## 3. The Orchard Palette

Derived, not invented. Every value below was sampled from the artwork by k-means over the region where that material actually lives.

### 3.1 The six materials, as measured

| Role | Value | HSL | Where it came from |
|---|---|---|---|
| **Morning light** | `#f8eada` | `33 69% 91%` | sky + flare — 51.6% of the lit region |
| Morning light, warm | `#f0ca8c` | `37 76% 74%` | the flare itself — 6.1% |
| **Blossom white** | `#fdf1da` | `39 90% 92%` | lit petals — **the brightest honest white in the orchard** |
| Blossom, shaded | `#fbe5c7` | `35 88% 88%` | lit petals — 66.2% |
| **Warm stone** | `#e4d9cc` | `32 31% 85%` | the pale ground — 46.7% |
| Stone, cool | `#c7c4bc` | `45 9% 76%` | the pale ground — 14.8% |
| **Natural oak**, lit | `#c0962e` | `43 62% 47%` | gate timber — 18.7% |
| Natural oak, body | `#80631a` | `43 66% 30%` | gate timber — 24.2% |
| Natural oak, shadow | `#4a3d15` | `45 56% 19%` | gate timber — 57.1% |
| **Fresh green**, sunlit | `#c9a317` | `47 79% 44%` | foliage in sun — 24.6% |
| Fresh green, body | `#9a801a` | `48 71% 35%` | foliage — 31.2% |
| Fresh green, deep | `#6b6118` | `52 63% 26%` | foliage — 37.2% |
| **Leaf in shade** | `#39450d` | `73 68% 16%` | grass in shadow, p15 |
| Leaf, deepest | `#2b3208` | `70 72% 11%` | orchard rows, p15 |
| **Soft shadow** | `#292708` | `56 69% 9%` | the dark end — 41.7% |
| Shadow, deep | `#1c1d05` | `62 71% 7%` | the dark end — 38.0% |

### 3.2 Three things this measurement settles

**1. THA's white is `#fdf1da`, not `#ffffff`.** The brightest honest surface in the orchard is a warm ivory at hue 39. Pure white appears nowhere in the picture except as blown-out specular highlight. Every card in Home is currently near-white; the palette says ivory.

**2. THA's shadow is olive, never grey.** The artwork's entire dark end is hue 56–70 — `#292708`, `#1c1d05`. A neutral grey shadow is a foreign object in this house. (`--shadow-support` should be tinted, not black at low alpha.)

**3. THA's green is hue 73, not 132.** The orchard's foliage reads gold (hue 47–52) *because of the golden hour*. The only greens **not** overwhelmed by that sun are the leaves in shade — and three independent regions agree on **hue 70–74**. That is the honest source of a THA green. It is 59° warmer than the one Home ships.

### 3.3 The rule the palette must obey

> **The artwork's hues are law. Its saturations are not.**
>
> Grass at 7am is `hsl(47 79% 44%)` because the light is gold. A 200×48 button filled with that value is **mustard** — the same colour, the wrong result, because a button is not lit by that sun. What transfers verbatim is the **hue family** (30–80°) and the **relationships** (light is warmer than shadow; shadow is olive; white is ivory). What must be re-derived per surface is **saturation and lightness**, because the screen supplies its own light.

This is the line between deriving a palette and transcribing a photograph. Transcribing it produces a mustard interface that is provably "from the orchard" and unusable. The translated set used in all three mockups is in `scripts/north4-concepts/_palette.css`, with every raw source value beside its translation.

---

## 4. Findings that are not mine to settle

These are conflicts between the new brand asset, the governing architecture, and what Home currently ships. Per the Architecture Bootstrap, I am reporting them rather than resolving them.

### 4.1 🔴 The Exposure Scale forbids two of these three concepts

Experience Blueprint § 6 fixes the orchard's exposure per room. Home's row is unambiguous:

> **E3 — The open view.** *The orchard visible as itself, generously; sparse content on its ground; the view* is *part of the room's purpose.* **Home only.**

And E2's definition carries a clause that matters enormously here:

> **E2 — The window.** *A framed, partial presence in one committed region… Framed by composition, **never by a drawn frame**.*

Measured against that:

| Concept | Exposure it actually is | Verdict |
|---|---|---|
| **B** — Panoramic living room | **E3.** The open view, generously, sparse content on its ground. | ✅ **Complies as written.** |
| **A** — Quiet entrance hall | ~E2, and the aperture is **a drawn frame** (the arch). | ❌ Under-exposes Home, and engages the drawn-frame clause. |
| **C** — Modern family kitchen | **E2**, and the window is **a drawn frame** (steel glazing bars). | ❌ Under-exposes Home, and engages the drawn-frame clause. |

**The tension is real and worth naming.** The mission says *think in architecture, think in interior design*. But architecture frames views **with drawn frames** — an arch, a mullion, a reveal, a sill. That is what a window *is*. The Blueprint's "framed by composition, never by a drawn frame" was written to stop decorative picture-frames around wallpaper, and it is a good rule against that failure. Applied to a real room, it forbids the window.

So: **A and C are not "riskier" than B. They are, today, unlawful**, and each needs a specific, named amendment to Blueprint § 6 before a line of their CSS may be written. B needs none.

### 4.2 🔴 The new orchard's sun is in the wrong place

Blueprint § 7, verbatim:

> **One sun, one direction, one hour.** The morning sun sits **upper-left, forever**, in every room; every shadow on every surface in every domain agrees.

Measured mean luminance of `ORCHARD.png` by ninth:

```
        left   mid  right
top       91   161    165      ← the light is up-RIGHT
middle    97   117     95
bottom    89   101     59
```

The sun is a visible flare at roughly **x 93%, y 26% — the upper right.** The artwork contradicts § 7 directly.

This is not new. NORTH3 recorded the same defect on the old asset and observed that *"the one-morning law is currently kept by a CROP, not by the picture."* The new asset does not fix it; it inherits it.

**The crop is the compliance mechanism, and each concept crops differently** — which is why this matters now rather than later:

- **A** crops to the artwork's centre (the mown path). The sun is **out of frame**. § 7 is not engaged. Light reads as coming from ahead, through the door.
- **B** shows the panorama nearly whole. The sun is **in frame, upper right.** § 7 is breached on the most visible surface THA has.
- **C** puts the window upper-right *because that is where the light is*. Honest to the asset; **breaches § 7.**

Three ways out, none of them mine to pick:

1. **Mirror the artwork.** Sun moves to upper-left; § 7 satisfied at zero cost; no new asset. But it flips the gate to the left, and the orchard is a brand asset with canonical ownership held elsewhere — mirroring it is arguably authoring a variant, which NORTH3 was expressly forbidden from doing.
2. **Amend § 7** to admit upper-right, and re-light every room to agree. Large blast radius; § 7's whole power is that it is absolute.
3. **Keep composing by crop** — the status quo, which works and is fragile, because it means the law is kept by a `background-position` that any future change can silently break.

### 4.3 🟠 The North Star's greeting is a serif. Home ships a marker pen.

Every North Star v2 render sets *"Welcome home, Colin"* in an elegant **serif**, ranged left, with a small leaf glyph. NORTH1 shipped it in **Caveat** — `--font-signature: 'Caveat', 'Segoe Script', 'Bradley Hand', cursive` — a marker pen. NORTH3 already flagged this as "worth re-examining."

There is a governance reason it exists: Blueprint § 5.1 names Home's one Living Detail as **"The greeting in THA's hand."** *In THA's hand* reasonably reads as handwriting.

So the artwork and the Blueprint disagree about what Home's signature is, and the disagreement has been shipping since NORTH1. **All three mockups follow the artwork** and set the greeting in a serif (Fraunces, standing in for whatever the real face becomes). If the owner prefers the Blueprint, all three concepts absorb that change without any recomposition — it is a font swap, not a layout.

### 4.4 🟢 The quiet day is the *default* day — and it is the strongest argument for the room

CONV1 P8 established that **192 of THA's 195 households resolve to `anchored: false`, permanently.** Home's honest output for almost every household is *"nothing planned, list is clear, 0 of 30 plants."*

Look at what that does to the current Home (`docs/ui-audit/north3-home/after-desktop-viewport.png`): a dashboard reporting zeroes in every cell. A dashboard full of zeroes reads as **broken, or as nobody home.**

Now look at what it does to a room. A hall with nothing on the console table is not broken — **it is a quiet morning.** A counter with nothing on it is not an error; it is a clean counter.

**This is the real case for the entrance hall, and it is evidence-based rather than aesthetic:** THA's most common state is emptiness, and the dashboard is the one composition that cannot hold emptiness with dignity. Every concept below is therefore designed for the quiet day first, and all three mockups render the empty state — not a showreel state.

Blueprint § 6 already anticipates the trap: *"A full-strength landscape behind an empty room reads as nobody home, not as calm."* That warning lands hardest on Concept B.

---

## 5. What all three concepts preserve

Identical across A, B and C. No API, hook, contract or state was added, removed or altered — only re-composed.

| Preserved | Where it went |
|---|---|
| `text-home-greeting`, `text-home-signature`, `text-home-date` | the greeting, in every concept |
| `card-home-companion` | the note — on the wall (A, C) or propped under the sill (B) |
| `card-home-glance` + `glance-meals` / `glance-shopping` / `glance-plants` | the console (A, B) or the things on the counter (C) |
| `button-home-primary` | the one action, in every concept |
| `home-doors` (×4) | the doors, in every concept |
| `ground-home`, `home-room` | the floor (A), the room below the sill (B), the counter (C) |
| loading / error / empty / **unanchored** states | every one still has a home; the unanchored copy is what the mockups render |
| `link-home-dashboard`, `list-home-reminders`, `list-home-shopping`, `list-home-todays-meals` | unchanged; below the composed arrival |
| Every hook — `useCurrentPlannerWeek`, `useMealsSummary`, `useCompanionNotices`, `useFoodOpportunities`, … | untouched |

**Everything visual is open. Nothing behavioural moves.**

---

## 6. Concept A — The Quiet Entrance Hall

> ### "I'm inside. It's quiet. The house was expecting me."

![Concept A — desktop](../ui-audit/north4-concepts/concept-a-desktop.png)

**The composition is vertical, centred, and symmetrical.** One axis. You are standing at one end of a hall; at the other end a door stands open onto the orchard, and the morning is coming through it and falling across the floor towards you. Your name stands in that light.

**The orchard is not a view here — it is a source of light.** The aperture is 300px wide on a 1440px screen. You see the orchard's *light* far more than you see the orchard. It is the only saturated thing in the room, which is exactly why it reads as light rather than as wallpaper: everything else is warm stone and soft shadow.

**The architectural moves that carry it:**
- **A wall and a floor meeting at a line.** Without that line this is a beige plain. With it, it is a hall. The door's base lands exactly on the floor line — a door stands *on* the floor.
- **The lightfall** starts at exactly the door's width and widens toward the viewer. Light through a doorway does this and nothing else does.
- **The walls fall into shadow at the edges,** pushing the eye down the centre. That vignette is the whole trick, and it is what keeps the emptiness from reading as empty.
- **Nothing sits on the photograph.** The light comes to the name; the name never goes into the light.

| Tablet | Mobile |
|---|---|
| ![A tablet](../ui-audit/north4-concepts/concept-a-tablet.png) | ![A mobile](../ui-audit/north4-concepts/concept-a-mobile.png) |

**A survives the phone better than either other concept** — arguably it is *better* on the phone, because a corridor is naturally a portrait shape. ([full page](../ui-audit/north4-concepts/concept-a-mobile-full.png))

### Emotional intention
Arrival before work. A hall is the one room in a house where you are *not* expected to do anything — you arrive, you put your bag down, you choose a door. It asks for nothing in the first three seconds. Its confidence is in what it leaves out.

### Why it feels like The Healthy Apples
It is the *"calm before capability"* principle built as a room rather than asserted as a rule. It is the only concept whose quiet day is indistinguishable from its full day — the hall is the same hall either way, which is the honest answer for 192 of 195 households. And "composed emptiness — everything present is meant" is the Orchard House Design Blueprint's own interior philosophy (§ interior design); A is that sentence as a picture.

### Trade-offs
- ❌ **Unlawful as written.** It is E2-with-a-drawn-frame where the Blueprint mandates E3 for Home (§ 4.1 above). Needs a named amendment.
- ❌ **The least orchard.** The mission says the orchard is *the defining architectural feature of the room*. In A it is defining but small. A reasonable person could say A doesn't do what the mission asked.
- ❌ **Ceremony risk.** A symmetric, centred, sparse arrival is one step from a splash screen — a Blueprint anti-pattern. It is saved only by the fact that all the content is genuinely there and reachable.
- ❌ **Lowest information density of the three.** The doors fall below the fold on mobile (the shell's bottom nav already carries the same four, so nothing is lost — but the composition doesn't know that).
- ✅ Cheapest to build. No photographic contrast problems anywhere. Ages well.

---

## 7. Concept B — The Panoramic Living Room

> ### "The whole wall is glass. It's a beautiful morning. I want to stay."

![Concept B — desktop](../ui-audit/north4-concepts/concept-b-desktop.png)

**The composition is horizontal bands.** Glass above, room below, an oak sill between them. The orchard runs edge to edge at **full opacity** across the top 44% of the screen. It is not behind the content — it is *above* it, the way a window is above a sill.

**The architectural moves that carry it:**
- **The mullions.** Three bays, thin, structural. They are what make it a *window* instead of a hero image. Remove them and B collapses into a marketing landing page — that is not a figure of speech, it is the entire difference.
- **The sill is the boundary, and it is absolute.** Everything the household reads sits below it. **Nothing sits on the glass**, because text over the orchard needs a scrim, and a scrim is fog — the Blueprint's *"second sun"* (§ 16), the exact breach NORTH3 found in the old asset.
- **The room is lit by its own window.** The wall below is brightest at the sill and falls away toward the floor. That gradient is the second thing keeping B a room; without it the lower half is a beige panel with text on it.
- **The furniture echoes the room.** The three facts are a long, low, horizontal console — the same proportion as the window above them.

| Tablet | Mobile |
|---|---|
| ![B tablet](../ui-audit/north4-concepts/concept-b-tablet.png) | ![B mobile](../ui-audit/north4-concepts/concept-b-mobile.png) |

### Emotional intention
Generosity, and permission to stay. B is the only concept that gives the orchard what the mission actually asked for: *the defining architectural feature of the room*. The feeling is a good morning happening whether or not you do anything about it.

### Why it feels like The Healthy Apples
It **is** the Blueprint's E3, executed literally: *"the orchard visible as itself, generously; sparse content on its ground; the view* is *part of the room's purpose."* It is also the closest of the three to the North Star v2 Home render, which puts a real photographic orchard down the right side of the room with blossom entering the frame. If the North Star is the target, B is nearest it.

### Trade-offs
- ⚠️ **It is one design decision away from a landing page, forever.** The mullions and the sill are load-bearing *in perpetuity*. Any future hand that "cleans up" those 7px oak bars silently converts THA's Home into a hero banner, and the person doing it will think they are simplifying. That is a real maintenance hazard, not a hypothetical.
- ❌ **The empty-room trap, at maximum.** Blueprint § 6: *"A full-strength landscape behind an empty room reads as nobody home, not as calm."* B is a full-strength landscape, and 192 of 195 households arrive at an empty room. **B is the concept most exposed to THA's most common state.**
- ❌ **Breaches § 7 most visibly.** At full width the sun is in frame, upper right (§ 4.2).
- ❌ **Costs the most on mobile.** The panorama becomes a letterbox and one of three bays is dropped; the concept's generosity is the first thing the small screen takes.
- ✅ **The only concept that is lawful today.** No amendment required.

---

## 8. Concept C — The Modern Family Kitchen

> ### "Someone's already up. There's coffee. Dinner's handled."

![Concept C — desktop](../ui-audit/north4-concepts/concept-c-desktop.png)

**The composition is depth planes, asymmetric.** Not bands, not an axis — *distance*. Far: the orchard, through a window. Mid: the wall, the steel frame. Near: the island counter in warm oak, running off the bottom of the screen at your waist. **You are standing at it.**

**The architectural moves that carry it:**
- **The counter is the ground plane** (Blueprint § 8), and in Home it is the counter you stand at. It occupies the bottom 42% and is a *material* — oak, with grain, and light falling across it — not a panel.
- **The light is a pool, not a wedge.** The window is upper-right, and the counter is brightest beneath it, falling off with distance. (The first attempt used a hard clip-path parallelogram; it read as a geometric graphic. No amount of blur rescues a polygon — light had to be drawn as light.)
- **The window is an opening, not a picture.** Its shadows fall *inside* the reveal, and it runs off the right edge of the screen. A drop shadow beneath the frame would mount it on the wall like a framed print; a reveal shadow cuts it through.
- **The content is objects.** C is the only concept where the facts are *things left out on the counter* — ivory on oak, each with a real contact shadow. That contact shadow is the whole difference between a thing on a counter and a card on a page.

| Tablet | Mobile |
|---|---|
| ![C tablet](../ui-audit/north4-concepts/concept-c-tablet.png) | ![C mobile](../ui-audit/north4-concepts/concept-c-mobile.png) |

### Emotional intention
Being cared for. The kitchen is where a household is actually fed, and this is the only concept where somebody has evidently *already been here* — the light is on, the counter is warm, the things are out. It is the warmest and the least ceremonial of the three.

### Why it feels like The Healthy Apples
It is the direct descendant of the v1 kitchen concept (`attached_assets/design/north_star/v1/`), which is the single most THA-feeling image in this repository. It is also the most literal expression of the governing vision — *"a modern home in an ancient orchard, where technology quietly supports timeless family life"* — because it is the only concept containing a *home* rather than an architectural abstraction.

### Trade-offs
- ❌ **Unlawful as written.** E2 with a drawn frame, where Home is E3 (§ 4.1).
- ❌ **Closest to the theme park.** C is one bowl of apples away from skeuomorphism — the Blueprint's named anti-pattern (*the theme park, the costume*). It is the concept most likely to be *charming* rather than *calm*, and charm is what Experience Language § 7 warns against.
- ❌ **It is a landscape idea, and it does not survive portrait.** At tablet the counter becomes a large empty oak plain; at mobile the three planes stack and the window becomes a band above you — **which is Concept B's idea, not C's.** C stops being itself on a phone. Given that most households arrive on a phone, this is the most serious objection to it.
- ❌ **Hardest to keep honest.** A counter implies abundance. On the quiet day, a kitchen with nothing on the counter reads as *nobody has been here* — the exact opposite of its intended feeling.
- ✅ The warmest arrival of the three, by a distance, and the best answer to "why does this brand exist."

---

## 9. How different are they, really?

The mission's test was: *if two concepts feel similar, start again.* They are not variations — they differ on the axis that actually matters, which is **what the orchard is for**.

| | **A** | **B** | **C** |
|---|---|---|---|
| **The orchard is…** | **light** | **the view** | **a glimpse while you're busy** |
| Composition | vertical axis, symmetric | horizontal bands | depth planes, asymmetric |
| Ground plane | a stone floor | the wall below a sill | an oak counter |
| Content is… | marks on plaster | a long low console | objects on a surface |
| Leading materials | warm stone + soft shadow | morning light + fresh greens | natural oak + blossom |
| Where light enters | from ahead, through the door | from the whole wall | from the upper right window |
| Exposure | ~E2 | **E3** | E2 |
| Best breakpoint | **mobile** | desktop | **desktop only** |
| On the quiet day | **unchanged — still a hall** | at risk — "nobody home" | at risk — "nobody's been here" |
| Lawful today | no | **yes** | no |

Each leans on a different pair of the six materials, and each takes a different position on the one question the current Home never asks: *what is the orchard doing here?*

---

## 10. Recommendation

**Build B's exposure with A's discipline.** If I had to choose one to develop, I would develop **B**, for three reasons that are not aesthetic:

1. **It is the only one that is lawful.** A and C both need Blueprint § 6 amended before any CSS. B needs nothing.
2. **It is what the mission asked for.** *"The orchard is no longer a background. It is the defining architectural feature of the room."* Only B does that.
3. **It is closest to the North Star.** If those five renders are the target, B is nearest.

But I would carry **A's answer to the empty room** into it, because B's one serious weakness is the state 192 of 195 households actually arrive in. Blueprint § 6 already supplies the mechanism in reverse (*"empty states may open the window one level, never two"*) — the inverse move is available and honest: **on a genuinely quiet day, B closes one level toward the room and lets the sill and the wall carry the arrival**, rather than presenting a full-strength landscape behind an empty room.

**And I would not discard C.** It is the warmest thing produced in this session and it answers "why does this brand exist" better than either sibling. But it is a landscape idea, and THA's households arrive on phones. C is a beautiful room in the wrong aspect ratio.

**The strongest single move in this document is none of the three.** It is § 2: **Home's primary, foreground and accent are drawn from a hue band that occupies 0.01% of the orchard.** That is true of every concept here, of the current Home, and of every room in the house. Fixing it is a token change, it is independent of which composition wins, and it would move Home closer to the orchard than any recomposition on this page.

---

## 11. Decisions needed before anything is built

| # | Decision | Owner's, because |
|---|---|---|
| **D1** | **The palette.** Adopt the derived hues (§ 3)? This is platform-wide — `--primary` is every button in every room, not just Home. | Blast radius is the whole product. |
| **D2** | **The Exposure Scale.** Amend Blueprint § 6 to admit a drawn frame and an E-level for Home below E3 — or rule A and C out and proceed with B alone. | Governing architecture; a rule, not a taste. |
| **D3** | **The sun (§ 4.2).** Mirror the asset, amend § 7, or keep composing by crop. | The orchard is a brand asset with canonical ownership held elsewhere; mirroring it is arguably authoring a variant. |
| **D4** | **The signature (§ 4.3).** Serif, as every North Star render shows — or Caveat, as Blueprint § 5.1's *"greeting in THA's hand"* implies and NORTH1 shipped. | The artwork and the Blueprint disagree; picking by taste would create a third treatment. |
| **D5** | **Which concept**, if any, proceeds to a build. | The point of the session. |

Still open from NORTH3, unaddressed here and unchanged: Home's header still reads **"Home"** above "Welcome home, Chloe"; the doors sit above the same four in the bottom nav. Neither is a NORTH4 finding; both survive into all three concepts.

---

## 12. Verification

| Check | Result |
|---|---|
| Product source modified | **None.** `home-experience-page.tsx`, `index.css`, every component — byte-untouched. |
| Canonical orchard asset | **Byte-untouched.** Referenced in place; no substitute authored (NORTH3 owner ruling honoured). |
| Palette provenance | Every value traced to a sampled region; script committed and re-runnable. |
| PNG decoder | Verified by re-encoding the decode and viewing it — it is the orchard, so the pixels are trustworthy. |
| Mockups × breakpoints | 3 × 3 rendered at `deviceScaleFactor: 2` — 15 screenshots. |
| Collision check | **9/9 clear.** Programmatic: greeting, action, Companion and facts 1 & 3 checked against the doors and the fold at every breakpoint. |
| Defects caught by measuring | **4.** Three vertical-rhythm collisions hidden behind absolutely-positioned layouts that reported "fits", and one primary action rendered invisible behind C's doors on mobile. |
| Type | Fraunces resolved and loaded — the serif in these renders is real, not a fallback. |
| Migration | **None.** |
| Gates | Not run — no product code changed. |

**Artifacts**

```
scripts/extract-orchard-palette.ts        the measurement (pure Node; decodes PNG via zlib)
scripts/north4-concepts/_palette.css      the derived palette, each value beside its source
scripts/north4-concepts/concept-{a,b,c}.html
scripts/north4-concepts/render.ts
docs/ui-audit/north4-concepts/            15 renders
```

> **Note on tooling.** Chromium could not launch in this sandbox (missing `libglib`). Rather than skip the renders, the browser was revived against a curated 64-bit library set from the nix store with glibc excluded. Documented because the next session will hit the same wall; the recipe is in the run file.

---

*NORTH4 — discovery only. Nothing implemented, by instruction.*
