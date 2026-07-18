# NORTH4 · Concept B, Evolved — The Definitive Arrival

**The Panoramic Living Room, refined into the Arrival experience of The Healthy Apples.**
Not a redesign. No new architectural idea. The approved concept, polished — calmer, warmer, more
premium, and more emotionally memorable — and rendered on both of THA's honest days.

| | |
|---|---|
| **Session** | `NORTH4_CONCEPT_B_EVOLUTION` |
| **Date** | 2026-07-17 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `north4-concept-b-evolution-wip-snapshot-7bfad50c` → `7bfad50c` |
| **Status** | **Awaiting owner decision.** One concept, evolved; rendered at desktop · tablet · mobile on the full day and the quiet day. |
| **Product changed** | **None by this session.** The mockup is standalone HTML; `home-experience-page.tsx` and `index.css` were not opened or edited here (any working-tree changes to them predate this session). The canonical `ORCHARD.png` is referenced in place — no substitute authored. |
| **Continues** | `NORTH4_HOME_CONCEPT_EXPLORATION.md` (Concept B — *The Panoramic Living Room*), on its own recommendation: *"Build B's exposure with A's discipline."* |

---

## 1. What this session did, and did not

**Did not:** redesign the concept, introduce a new architectural idea, touch Home, author a colour
token, amend a governing document, or author a substitute orchard asset.

**Did:** take Concept B exactly as approved — glass above, oak sill between, room below, doors along the
floor — and polish the five weaknesses B's own report named, then render the result on **both** of THA's
real days so the refinement is verified rather than asserted.

This is a **refinement study**. The mockup is `scripts/north4-concepts/concept-b-evolved.html`; it
references the real artwork by path, so what you see is the real orchard, not an impression of it.

**The agreed principles this evolution is measured against** (unchanged, and honoured throughout):

- The orchard is the hero, not the arch.
- Arrival always presents the same familiar view.
- The orchard is a real landscape, never decoration.
- Hospitality comes before productivity.
- Technology should become quieter as it becomes better.
- The experience should feel like arriving home, not opening software.
- Every refinement must make the experience calmer, warmer, more premium and more emotionally memorable.

**Read before starting:** `docs/architecture/README.md` (the Architecture Bootstrap),
`BRAND1_ARCHITECTURAL_BRANDING.md`, `HOME_FINAL_CONCEPTS.md`, `HOME_INTERIOR_ARCHITECTURE.md`,
`HOME_ARRIVAL_REIMAGINED.md`, and `NORTH4_HOME_CONCEPT_EXPLORATION.md`. Git status confirmed and the
rollback tag verified before any change.

---

## 2. The concept, unchanged — and why it is the right one to make definitive

Concept B is *"The whole wall is glass. It's a beautiful morning. I want to stay."* Its architecture is
**horizontal bands**: the orchard runs edge to edge at full opacity across the top; an oak sill is the
absolute boundary; the room lives below it, lit by its own window; the four doors run along the floor.

It is the right concept to make definitive for reasons that are not aesthetic, established in NORTH4 § 10
and re-confirmed by every session since:

1. **It is the only concept that was lawful as written** — E3, *"the orchard visible as itself,
   generously; sparse content on its ground; the view* is *part of the room's purpose"* (Experience
   Blueprint § 6). Concepts A and C each required a Blueprint amendment before a line of CSS. B needed none.
2. **It is what the mission asked for** — *the orchard is the defining architectural feature of the room*,
   not a background. Only B commits the whole upper wall to the view.
3. **It is the direction every later exploration converged on.** `HOME_ARRIVAL_REIMAGINED` set the arch
   down entirely and recommended *The Threshold* — the whole orchard, from the same place, a quiet sill
   below. That is Concept B's own thesis, arrived at independently. B is the buildable, lawful, framed
   expression of the same idea: **the orchard is the hero; you come home to the same familiar view.**

So this session does not re-open the choice. It makes the chosen room the best version of itself.

---

## 3. The five refinements — each a named weakness of B, polished

NORTH4 § 7 listed B's weaknesses with unusual candour. Every one of them is a polishing target, not a
reason to change the concept. Each refinement below cites the weakness it answers.

### R1 — The quiet day is now a *quiet morning*, not "nobody home" *(B's most serious weakness)*

> **The weakness (NORTH4 § 7).** *"The empty-room trap, at maximum. A full-strength landscape behind an
> empty room reads as nobody home, not as calm. 192 of 195 households arrive at an empty room."*

This is the single most important refinement, and NORTH4 § 10 already prescribed it:

> *"On a genuinely quiet day, B closes one level toward the room and lets the sill and the wall carry the
> arrival, rather than presenting a full-strength landscape behind an empty room."*

Built literally. Arrival now has **two honest days**, driven by whether the household's day is anchored:

- **The full day** (`?day=full`) — a planned day. The window opens to its full E3 generosity; the console
  carries the three real facts (*3 meals planned · nothing left to fetch · 28 / 30 this week*).
- **The quiet day** (`?day=quiet`) — the default for 192 of 195 households (CONV1 P8). **The blind lowers
  one level:** the sill rises, the window closes from the open view toward a contained window, and more
  wall carries the arrival. The console does not report zeroes — it says the absence with dignity:
  *A clear morning · List is clear · Blossom this week*. The Companion speaks the one warm, true, seasonal
  line the platform already has.

Crucially, **the view never moves.** Only *how much* of the same orchard is opened changes. The crop is
anchored high, so when the sill rises on a quiet day only the near ground is trimmed and the skyline stays
put — the same familiar window, opened a little less. That satisfies two principles at once: *arrival
always presents the same familiar view*, and *hospitality before productivity* (a quiet morning is
hospitable; a grid of zeroes is not).

This is the inverse of Blueprint § 6's own mechanism (*"empty states may open the window one level, never
two"*), applied honestly: a quiet room does not pretend to be full, and a full landscape is never hung
behind an empty one.

### R2 — The window is now unmistakably architecture, and permanently so

> **The weakness (NORTH4 § 7).** *"It is one design decision away from a landing page, forever. Any future
> hand that 'cleans up' those 7px oak bars silently converts THA's Home into a hero banner."*

The mullions and the sill are load-bearing **in perpetuity**, so the refinement is to make them read as
*structure*, not decoration — impossible to mistake for a line that could be tidied away:

- **The mullions** gained a lit inner edge and a cast shadow, so they read as timber *holding glass up*,
  not bars drawn *on* a photo.
- **The head of the window** is a deeper reveal (a wall with thickness above the glass), and the reveal
  now **returns down the jambs** — the glass is held by a wall with depth rather than bleeding to the
  screen edge like a full-bleed image.
- **The sill** is a real oak object: a lit front lip catching the one morning, a body, and a contact
  shadow cast onto the wall — a sill you could set a cup on, not a rule.

The CSS says so in plain words at each of these blocks, so the next hand is warned before it edits. This
is the difference, stated by NORTH4, between *a window* and *a hero banner* — now defended in the markup.

### R3 — The sun stays composed by crop (the § 7 question, left to its owner)

> **The tension (NORTH4 § 4.2, decision D3).** The asset's sun sits **upper-right**; Blueprint § 7 fixes
> the morning sun **upper-left, forever**. B shows the panorama nearly whole, so at full width the flare
> is in frame.

This is **not mine to settle** — the orchard is a brand asset with canonical ownership held elsewhere, and
mirroring it is arguably authoring a variant (forbidden since NORTH3). So the evolution keeps the sanctioned
status quo (D3): **compose by crop.** The crop is anchored high and slightly left of the flare so the sun
reads as one soft morning in the corner rather than a centred glare, and the CSS marks the `object-position`
as the § 7 compliance mechanism that must be preserved. The renders show the flare honestly in the right
bay; the § 7 decision (mirror · amend · keep-cropping) remains open and is restated in § 6.

### R4 — Warmth on the wall, never a second sun

> **The principle.** *Calmer, warmer, more premium* — without breaching Blueprint § 16 (*"the second
> sun"*: no scrim, no second light source).

The wall below the sill is warmed a half-step **at the sill** and falls away toward the floor — the room
lit by its own window. This gradient (not the photograph) is what keeps the lower half a *room* and not a
beige panel with text on it. It is a **wash on plaster**, explicitly not a light source: no glow is added
to the orchard, no scrim is laid over it, and nothing is ever set on the glass. The warmth is in the
*room*, where a screen may honestly supply its own light; the *view* is left exactly as the sun left it.

### R5 — Mobile keeps the orchard generous

> **The weakness (NORTH4 § 7).** *"Costs the most on mobile. The panorama becomes a letterbox and one of
> three bays is dropped; the concept's generosity is the first thing the small screen takes."*

Refined: on a phone the window stands **tall and portrait** rather than collapsing to a letterbox, so the
orchard stays the hero and the concept keeps its whole point. The mobile crop shows the mown path leading
to the oak gate — the most emotionally direct frame the asset holds. Two bays (one mullion) are honest at
this width; the sill is still the boundary; the room reads below. B is no longer punished by the small
screen — it is arguably at its warmest there.

### R6 — The greeting remains the one Living Detail

> **The rule.** Blueprint § 5.1 names Home's single Living Detail as *"the greeting in THA's hand."*

Unchanged, deliberately. The household's name is the hero of the room, set in THA's serif; the Companion
is one note propped under the sill, its line **data-borne or dead** — verbatim from the Notice Engine,
never invented, quieter when the day is quiet (Core Principle 6; the discipline `HOME_FINAL_CONCEPTS` § 6
recorded). No second Living Detail was added — that would be a new idea, and the brief forbids it.

---

## 4. The two days, at a glance

| | **The full day** | **The quiet day** *(the default — 192 / 195 households)* |
|---|---|---|
| Window | open — full E3 generosity | closed one level toward a contained window |
| The wall carries… | the greeting, below a generous view | more of the arrival; the room does the welcoming |
| The console | three real facts | three honest absences, said with dignity |
| The Companion | *"Three meals planned, the greens are at their best…"* | *"The orchard is in blossom — a good week for something green and simple."* |
| Reads as | a good morning, already planned | a quiet morning, clear and calm |
| Never reads as | — | **"nobody home"** — the trap this refinement exists to close |

**The same room, the same view, two honest weathers of the household's own life.** The house never
pretends the day is fuller than it is, and never hangs a full landscape behind an empty room.

---

## 5. Renders

Rendered headless at **desktop 1440 · tablet 834 · mobile 390**, `deviceScaleFactor 2`, on both days.
Fraunces resolved and loaded — the serif is real, not a fallback. Every render passed a **programmatic
collision check**: nothing the household reads may cross the sill onto the glass, overlap the doors, or
fall through the fold.

### The full day
![full · desktop](../ui-audit/north4-concept-b-evolution/b-evolved-full-desktop.png)

| Tablet | Mobile |
|---|---|
| ![full · tablet](../ui-audit/north4-concept-b-evolution/b-evolved-full-tablet.png) | ![full · mobile](../ui-audit/north4-concept-b-evolution/b-evolved-full-mobile.png) |

### The quiet day *(the default day)*
![quiet · desktop](../ui-audit/north4-concept-b-evolution/b-evolved-quiet-desktop.png)

| Tablet | Mobile |
|---|---|
| ![quiet · tablet](../ui-audit/north4-concept-b-evolution/b-evolved-quiet-tablet.png) | ![quiet · mobile](../ui-audit/north4-concept-b-evolution/b-evolved-quiet-mobile.png) |

*(Full-page captures for tablet and mobile — where the room legitimately continues below the fold — are
alongside each viewport render in `docs/ui-audit/north4-concept-b-evolution/`.)*

---

## 6. Recommendation

**Adopt Concept B, evolved, as the definitive Arrival — and build the quiet day first.**

The concept was already chosen; this session's job was to make it worthy of being permanent, and it is.
The evolution earns the recommendation on the mission's own terms:

- **Calmer** — the quiet day, the state almost every household actually arrives in, is now a calm morning
  rather than a dashboard of zeroes. That is the largest single gain, and it lands on the most common day.
- **Warmer** — the room is lit by its own window and warmed at the sill, honestly, with no second sun.
- **More premium** — the window is real joinery with depth, the sill an object, the type a serif; nothing
  reads as software.
- **More emotionally memorable** — you come home to the same orchard every morning, and on a phone you
  come home *up the path to your own gate.* That is a view a household would know in a decade.

**Build the quiet day first, not the full day.** B's whole risk was always the empty room, and the empty
room is the default. A definitive Arrival that is beautiful when full and dignified when quiet is complete;
one that is only beautiful when full is a showreel. The quiet day is the honest one, and it is now the
strong one.

**One decision remains open, and it is the owner's:** the sun (§ 3, R3 / NORTH4 D3) — *mirror the asset,
amend Blueprint § 7, or keep composing by crop.* The evolution keeps composing by crop and breaks no rule
that is mine to break; the § 7 question is unchanged and unresolved. Two further platform-wide decisions
from NORTH4 remain above this document and independent of it: **D1 the Orchard Palette** (the strongest
single move in the whole NORTH4 study — Home's `--primary`/`--foreground`/`--accent` occupy a hue band
that is 0.01% of the orchard) and **D4 the signature** (serif, as every render shows, or Caveat, as § 5.1
implies). None of the three blocks adopting the composition; each changes a token or a font, not the room.

---

## 7. What this keeps, and what it never does

**Kept.** The orchard is the owner's real `ORCHARD.png`, the same view from the same place every morning;
the light is one soft morning, never a second sun (Blueprint § 6 / § 16); every fact is the household's
real day; the four fixed truths of arrival are intact — *modern living in a traditional orchard ·
hospitality before productivity · technology becoming quieter · arrival is coming home.*

**Never done.** No new architectural idea; no redesign of the approved concept; no text hung on the glass;
no invented good news (absences render as calm quiet, never a fabricated line); and **no product source,
data source, hook, route, API, behaviour, schema, migration, or test changed** — this is a refinement
study, exploration only.

---

## 8. Verification

| Check | Result |
|---|---|
| Bootstrap + required reading | ✅ `README`, `BRAND1`, `HOME_FINAL_CONCEPTS`, `HOME_INTERIOR_ARCHITECTURE`, `HOME_ARRIVAL_REIMAGINED`, `NORTH4` — read before starting. |
| Git status confirmed · rollback verified | ✅ `north4-concept-b-evolution-wip-snapshot-7bfad50c` → `7bfad50c`. |
| Concept unchanged (no redesign, no new architecture) | ✅ Glass · sill · room · doors — the approved bands, polished only. |
| Product source modified | **None by this session.** `home-experience-page.tsx`, `index.css` and every component were not opened or edited here (pre-existing working-tree changes predate this session). |
| Canonical orchard asset | **Byte-untouched.** Referenced in place; no substitute authored (NORTH3 ruling honoured). |
| Both honest days rendered | ✅ full + quiet, each at desktop · tablet · mobile, `deviceScaleFactor 2` — 10 images. |
| Collision check | **6/6 clear.** Programmatic: name · action · Companion · console · date checked against the sill line, the doors, and the fold at every breakpoint. |
| Defect caught by measuring | **1.** The full-desktop console overlapped the doors under the generous window; the window was eased one notch and the console rhythm tightened until clear. |
| Type | Fraunces resolved and loaded — the serif is real, not a fallback. |
| The § 7 sun | Left open (D3); composed by crop; documented, not resolved. |
| Migration / gates | **None** — no product code changed. |

**Artifacts**

```
scripts/north4-concepts/concept-b-evolved.html    the evolved concept — standalone, nothing imports it
scripts/north4-concepts/render-b-evolution.ts     renders 3 breakpoints × 2 days, with collision checks
scripts/north4-concepts/_palette.css              the derived Orchard Palette (unchanged, reused)
docs/ui-audit/north4-concept-b-evolution/         10 renders (6 viewport + 4 full-page)
```

> **Tooling note.** Chromium will not launch in this sandbox (`libglib-2.0.so.0` missing). Revived against
> a curated 64-bit library set from the nix store, **excluding glibc's own libraries *and* libcrypto/
> libssl/libz** (including them shadows node's OpenSSL and segfaults `node` on `OPENSSL_3.4.0`). The recipe
> is in the run file; the next session will hit the same wall.

---

*NORTH4 · Concept B, Evolved — the room was already chosen; this made it worth keeping. The orchard is the
hero, the window is real joinery, and the same familiar view meets the household every morning — generous
when the day is full, and a genuinely quiet morning when it is not. The one it needed to get right was the
empty room, because the empty room is the default — and now the empty room is calm.*
