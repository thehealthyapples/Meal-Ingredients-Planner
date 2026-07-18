# BRAND1 — Architectural Branding

**How THA's identity becomes part of the *architecture* of the Home — built in, not placed on top.**
Exploration only. The ARRIVAL1 room is canonical and byte-untouched. Only the expression of THA changes.

| | |
|---|---|
| **Session** | `BRAND1_Architectural_Branding` |
| **Date** | 2026-07-17 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `rollback/BRAND1-architectural-branding-20260717` → `7bfad50c` (tag `brand1-wip-snapshot-7bfad50c`) |
| **Status** | **Awaiting owner decision.** 10 concepts + 4 banner fates, all rendered on the identical room. |
| **Product changed** | **None.** The room, arch, orchard and furniture are untouched. |

---

## 1. What this is, and what it is not

**Not:** a redesign. The room, the archway, the orchard, the oak console, the stone floor, every data
source and behaviour — all of ARRIVAL1 — are assumed canonical and are **byte-untouched**. This
explores only **where and how the identity of The Healthy Apples lives inside that room.**

**Is:** an architect's study. Each concept is **rendered on the real, live `/home`** — the canonical
ARRIVAL1 room — by injecting the branding treatment in the browser at render time only
(`scripts/capture-brand1-concepts.ts`; nothing edits app source). So every image below is the *same
room*, changing *only* the expression of THA. Renders are in `docs/ui-audit/brand1/`.

**Read before starting:** `docs/architecture/README.md` (the Bootstrap), `ARRIVAL1_DEFINITIVE_HOME.md`
(the room being branded), and the two brand assets (`/logo-long.png`, the apple icon).

---

## 2. The finding that reframes the whole question

> **THA's identity is already in the room. The arch *is* the apple, opened to architectural scale.**

Look at the brand's own apple mark: inside the apple is a **sunrise over a winding path through green
fields** — light breaking over a receding path. Now look at the ARRIVAL1 arch: the orchard through it
is **a sunrise over a mown path receding through the trees.** They are the same picture at two scales.
The apple is a miniature of the view; the view is the apple, enlarged until you can walk into it.

This changes what "branding the Home" even means. The instinct — *put the logo somewhere* — treats
identity as a sticker. But the strongest architectural branding is not applied; it is **revealed**: the
household is already standing inside the logo. So the concepts below are ordered from *loudest applied
mark* to *quietest revealed identity*, and the exploration's bias — stated up front so it can be
argued with — is that **the room brands itself, and the most premium move is the most restrained.**

This is consistent with the governing canon the room already obeys: *"technology should quietly
disappear; the household should always feel present"* (Experience Blueprint § 1.5), *"premium through
restraint"* (Experience Language § 4A), and *"the household's own life is the only ornament"* (Orchard
House Design Blueprint). A corporate logo stamped on the wall of a home you live in is exactly the
*"placed on top"* the mission warns against — you do not hang a company's logo in your own hallway.

---

## 3. The current state (baseline)

![baseline](../ui-audit/brand1/baseline.png)

Today the identity lives **only in the top banner**: the full colour `logo-long.png` (apple + "The
Healthy Apples" script + "CONFIDENTLY CHOOSE BETTER, Simply") at the left, plus the realm title
"Home". It is a **web-app header** — the one element of the screen that still reads as software rather
than as a room. It sits *on top of* the architecture, in a tinted band, and it is the same on every
screen. Every concept below is measured against it.

**The top-banner question is inseparable from the branding question,** so it is decided first (§ 4),
then the ten in-room concepts (§ 5) assume the banner has been resolved.

---

## 4. The top banner — should it disappear, dissolve, join the orchard, or reform?

Four fates were rendered. *Do not assume any answer* — each is argued on its merits.

| | Render | What it does |
|---|---|---|
| **A · Disappear** | `banner_a_gone.png` | The banner is removed entirely; the room begins at the top of the wall. |
| **B · Dissolve** | `banner_b_dissolve.png` | The wordmark goes; the apple stays as a faint tone-on-tone watermark in the band. |
| **C · Join the orchard** | `banner_c_orchard.png` | The band takes the plaster/light of the room, so it stops reading as a separate chrome bar and becomes the top of the wall. |
| **D · Reform** | `banner_d_reform.png` | The long logo becomes a **single quiet apple** at the left; the wordmark and tagline are gone. |

**A (disappear) is too far.** The banner also carries the cart, notifications and the profile menu —
real controls a household needs. Removing the whole band strands them, and a home with *no* threshold
sign at all can feel unplaced on first arrival. Disappearing the *brand* is right; disappearing the
*band* is not.

**C (join the orchard) is the most architecturally honest of the band itself** — the top chrome stops
being a coloured strip and becomes plaster, so the "shell" reads as the top of the same wall the arch
is cut into. This is the correct treatment of the *band*, independent of what mark it carries.

**D (reform to a single apple) is the right treatment of the *mark*.** A house has a small sign by the
door, not a billboard. One quiet apple says *whose home this is* without shouting a wordmark across the
top of a room whose entire design language is restraint. The full script logo — beautiful as a
marketing asset — is a **brochure voice** inside a lived-in home (the same objection NORTH1/NORTH3
raised about marketing lines on this page).

**Recommendation for the banner: C + D together** — the band dissolves into the plaster wall (C) and
carries a single small apple where the logo was (D). The wordmark and tagline retire from Home. This is
rendered as the starting point for the in-room concepts below (most of them hide the long logo so the
architectural mark can carry the identity alone).

> **The challenge to current thinking:** the top banner is the *least* architectural place THA's
> identity can live. Every concept in § 5 asks whether the identity belongs **in the room** — in
> plaster, oak, stone, light or the orchard itself — rather than in a bar bolted above it.

---

## 5. The ten concepts

Each is rendered on the identical room. For every concept: the **emotional feeling**, the **first-time**
and **returning** experience, **strengths**, **weaknesses**, and **long-term brand implications**.
The concepts run from *no mark* through *applied marks* to *revealed identity*.

---

### Concept 1 — No visible branding at all
*The room is the brand.*

![none](../ui-audit/brand1/c1_none.png)

The banner brand is gone; there is no apple, no wordmark, anywhere. The archway, the orchard, the oak,
the plaster — and the household's own name in THA's hand — carry the entire identity.

- **Emotional feeling.** Pure calm, pure arrival. Nothing is being sold to you; you are simply home.
  The most confident possible statement — a brand so sure of itself it signs nothing.
- **First-time user.** Slight risk of *"where am I / whose is this?"* for the very first second, before
  the room's coherence answers it. The greeting ("Welcome home, Chloe" in the signature hand) is the
  only naming, and it names *the household*, not the company.
- **Returning user.** Ideal. The room is instantly recognisable by its architecture alone; a returning
  household never needs to be told the name of the house they live in.
- **Strengths.** The most premium and most timeless option; ages forever; impossible to look dated;
  perfectly obeys "premium through restraint" and "the household is the only ornament."
- **Weaknesses.** No brand recall for screenshots shared out of context; no answer to a stakeholder who
  asks *"where's the logo?"*; leans entirely on the room being strong enough to stand alone (it is, but
  it is a bet).
- **Long-term brand implication.** Bets the whole identity on the *architecture* being the trademark —
  the arch becomes the logo. Powerful and durable, but only if the arch is protected as rigorously as a
  logo would be. This is the Apple/Aesop end of the spectrum: the product is the brand.

---

### Concept 2 — Embossed apple in plaster
*A maker pressed their mark into the wall.*

![apple in plaster](../ui-audit/brand1/c2_apple_plaster.png) · close-up: `c2_apple_plaster-mark.png`

A single apple, tone-on-tone, **debossed into the plaster wall** beside the arch — visible only by the
soft shadow on its pressed edges, the way a relief in real plaster is.

- **Emotional feeling.** Quiet craft. Someone made this wall, and signed it the way a plasterer presses
  a motif into a finished surface. Warm, hand-made, unhurried.
- **First-time user.** May not consciously see it at all on the first visit — and that is the point. It
  is *felt* before it is read; discovered on the third or fourth morning, which is a small gift.
- **Returning user.** Becomes a familiar detail of *their* wall — a reason to feel the room is real.
- **Strengths.** Deeply architectural (it is *in* the plaster, not on it); premium; unmistakably THA
  (the apple) without a single word; scales to any wall.
- **Weaknesses.** Contrast is fragile — too subtle and it vanishes on low-quality screens; too strong
  and it becomes a printed sticker. Needs the plaster material to be real (ARRIVAL1's is).
- **Long-term brand implication.** Establishes the **apple as an architectural relief motif** that can
  recur across every room (each room's plaster carries the same pressed apple), giving the whole house
  one quiet signature. Very ownable.

---

### Concept 3 — Embossed long wordmark in plaster
*The name, set into the wall like a lintel inscription.*

![wordmark in plaster](../ui-audit/brand1/c3_wordmark_plaster.png) · close-up: `c3_wordmark_plaster-mark.png`

"THE HEALTHY APPLES" embossed low into the plaster beneath the arch — tone-on-tone, like carved
lettering over a doorway.

- **Emotional feeling.** Institutional permanence — a building with its name cut into the stone above
  the entrance. Dignified, established, a little formal.
- **First-time user.** Clearly answers *"whose home is this"* — more legible than the apple alone.
- **Returning user.** Can begin to feel like signage rather than a home; a household does not need to
  read the company's full name every morning on their own wall.
- **Strengths.** Unambiguous brand recall; premium if the relief is genuine; good for first-run and
  onboarding confidence.
- **Weaknesses.** The most "corporate" of the emboss family; a full wordmark is a lot of words for a
  room whose whole language is restraint; risks the brochure-voice objection. Long — awkward on narrow
  screens.
- **Long-term brand implication.** Anchors the *name* into the architecture, which is safe and legible
  but caps the premium ceiling — you can always read who owns the building, which is subtly less
  intimate than a home that simply feels like yours.

---

### Concept 4 — Carved oak signature
*The furniture is signed, the way a maker signs a piece.*

![carved oak](../ui-audit/brand1/c4_carved_oak.png) · close-up: `c4_carved_oak-mark.png`

"The Healthy Apples" in a flowing script **routed into the oak of the console** — a cabinetmaker's
signature on the underside of the piece they built.

- **Emotional feeling.** The warmest, most human option. This is the mark of a craftsperson who is
  proud of the work — it says *made for you*, by hand.
- **First-time user.** A lovely discovery on the furniture the day's information rests on — brand and
  utility in the same glance, without competing.
- **Returning user.** Grows fonder over time; a signed piece of furniture becomes a possession.
- **Strengths.** Ties the identity to the *material* (oak) and to *craft*, which is the truest
  expression of THA's premium-through-care standard; the script echoes the real logo's own hand.
- **Weaknesses.** The console is near the fold and near the bottom nav, so the signature has limited
  room and can crowd the primary action if oversized; script legibility is contrast-dependent on wood.
- **Long-term brand implication.** Positions THA as a **maker** rather than a platform — every surface
  in every room is "furniture" someone built and signed. A rich, defensible, warm brand story.

---

### Concept 5 — Brass apple inlay
*A small precious mark set into the wood.*

![brass inlay](../ui-audit/brand1/c5_brass_inlay.png) · close-up: `c5_brass_inlay-mark.png`

A tiny **brass apple inlaid into the oak console** — the one material in the room that catches and
returns light, like a maker's escutcheon on fine cabinetry.

- **Emotional feeling.** Quiet luxury. A single point of precious metal in a warm, matte room reads as
  *considered* and *expensive* without any loudness.
- **First-time user.** The eye finds the one thing that glints; a small, pleasurable moment of quality.
- **Returning user.** A reliable little jewel — the kind of detail that makes a product feel worth
  paying for.
- **Strengths.** The clearest "premium" signal of any concept; introduces a **metal** to the material
  palette (a new, ownable brand material — brass = THA's precious mark); tiny footprint, high impact.
- **Weaknesses.** Metal is the one material *not* currently in the orchard palette, so it must be
  introduced deliberately or it reads foreign; overuse would tip from tasteful to blingy; a glint can
  compete with the arch for the eye if placed too prominently.
- **Long-term brand implication.** Gives THA a **signature material** (brass) the way luxury houses own
  a metal — a strong, expandable system (brass apple on every piece of furniture, every room).

---

### Concept 6 — Etched stone threshold
*The name underfoot, at the point of entry.*

![etched stone](../ui-audit/brand1/c6_etched_stone.png) · close-up: `c6_etched_stone-mark.png`

"THE HEALTHY APPLES" etched into the **stone floor** near the threshold — a doorstep inscription, the
name you cross to come in.

- **Emotional feeling.** Ceremonial, grounding. Crossing a named threshold is a small ritual of
  *arriving somewhere that matters.*
- **First-time user.** Evocative if noticed, but the floor is the least-looked-at plane on first
  arrival (the eye goes up, to the arch and the name).
- **Returning user.** A quiet, dignified constant underfoot.
- **Strengths.** Architecturally true (thresholds *are* inscribed in real buildings); ties identity to
  the *stone* ground; ceremonial without being loud.
- **Weaknesses.** 🔴 **The ARRIVAL1 floor is already furnished** — the four doors and the "See your full
  dashboard" link sit on it, so an etched wordmark competes for the busiest surface in the room and had
  to be shrunk into a thin band to avoid colliding with the door labels (see the render). This is a
  genuine finding: the floor is the wrong plane for a mark *in this specific room* because it is
  already doing navigational work.
- **Long-term brand implication.** Beautiful in principle but constrained here; would work far better
  in a room with an empty floor. A reason to prefer wall/oak/arch over floor for THA's primary mark.

---

### Concept 7 — Branding revealed only by light
*The mark is there only when the morning finds it.*

![light reveal](../ui-audit/brand1/c7_light_reveal.png) · close-up: `c7_light_reveal-mark.png`

An apple in the plaster that is **visible only where the arch's light rakes across the wall** — present
in the morning glow, invisible in shadow. The identity depends on the room's one light.

- **Emotional feeling.** Magical, alive, a secret the light tells. The most *poetic* of the concepts.
- **First-time user.** A genuine "did I just see that?" moment — memorable in the exact way "quietly
  memorable" (Experience Language) asks for.
- **Returning user.** Becomes a small daily event tied to the light — a reason the morning feels
  different from the evening.
- **Strengths.** The most differentiated and quietly-memorable idea; ties identity to the room's
  defining element (light); impossible to screenshot as a static logo, which is *itself* a statement.
- **Weaknesses.** The hardest to execute reliably (it depends on the light gradient being exactly
  right, and Home's light is a fixed morning, so "only in some light" is more concept than literal on a
  screen); risks being missed entirely; subtle to the point of invisibility on poor displays.
- **Long-term brand implication.** Positions light as a **brand carrier** — a sophisticated, ownable
  idea, but a demanding one that needs real craft to avoid feeling like a gimmick.

---

### Concept 8 — Architectural maker's mark (foundation stone)
*A small plaque, the way a builder marks the house they raised.*

![maker's mark](../ui-audit/brand1/c8_makers_mark.png) · close-up: `c8_makers_mark-mark.png`

A small **foundation-stone plaque** set low in a corner — an apple, "THA", "· est. ·" — like the datestone
a builder sets into a house. The identity as a *builder's mark*, not a brand banner.

- **Emotional feeling.** Rooted, trustworthy, quietly proud. This house was *built*, by someone, who
  stands behind it — the same reassurance a foundation stone gives a real building.
- **First-time user.** Reads instantly as heritage and permanence without any marketing tone; answers
  *"who made this"* in the register of a craftsman, not a company.
- **Returning user.** A stable, unobtrusive corner detail — never in the way, always there.
- **Strengths.** The most *architectural* framing of identity (a maker's mark is literally an
  architectural convention); combines apple + name in a tiny, dignified footprint; sits out of the way
  of the arch and the day's work; expandable ("est." can carry a year, a place).
- **Weaknesses.** Low corner is easy to miss; must be genuinely small or it becomes a badge; the ARRIVAL1
  lower-left corner is near the floor/nav, so placement needs care.
- **Long-term brand implication.** Frames THA as a **builder of homes** — a coherent, premium, durable
  story that scales across the whole product (every "room" carries the same maker's mark). Strong
  candidate for the primary identity system.

---

### Concept 9 — Keystone apple
*The apple crowns the arch, holding it up.*

![keystone apple](../ui-audit/brand1/c9_keystone_apple.png) · close-up: `c9_keystone_apple-mark.png`

The apple as the **keystone at the crown of the arch** — the wedge stone at the top of a real arch,
the one that carries the load. The brand mark becomes a structural element.

- **Emotional feeling.** Inevitability and integration — the identity isn't *on* the architecture, it
  *is* the architecture; the apple holds the arch together.
- **First-time user.** Reads as intentional and built; the eye is already going to the arch, so the
  keystone is seen without any competing pull.
- **Returning user.** Becomes inseparable from the arch itself — you cannot picture the arch without
  its apple keystone, which is the strongest possible brand lock.
- **Strengths.** The single most *"built into the architecture"* concept — a keystone is load-bearing,
  not decorative; unites the room's focal point (the arch) with the brand (the apple) in one move;
  deeply ownable (THA's arch has an apple keystone).
- **Weaknesses.** Places a mark on the room's emotional focal point, so it must be exquisitely subtle
  or it steals the arch's calm; tone-on-tone plaster is right, colour would be fatal; risks gilding the
  one thing that was already perfect.
- **Long-term brand implication.** Fuses brand and architecture permanently — the arch *and its
  keystone* become the trademark together. The highest-ceiling concept, and the highest-risk, because
  it touches the room's most sacred element.

---

### Concept 10 — Orchard-integrated identity
*The identity is already in the view; the arch is the apple.*

![orchard integrated](../ui-audit/brand1/c10_orchard_integrated.png) · close-up: `c10_orchard_integrated-mark.png`

The most conceptual: the identity lives **in the orchard itself.** The apple's inner scene (§ 2) *is*
the view through the arch, so the render places only the faintest script whisper on the light of the
view — or, taken to its logical end, *nothing at all*, because the orchard is already the logo.

- **Emotional feeling.** Seamless, almost subliminal — the brand and the world are the same thing; you
  are inside the apple.
- **First-time user.** Unlikely to consciously register a "brand" — which is either the highest
  sophistication or a missed opportunity, depending on your view.
- **Returning user.** The identity is felt through the *view* they return to every morning, not through
  any mark.
- **Strengths.** The truest expression of § 2's finding; utterly unownable-by-anyone-else (no
  competitor has *this* orchard); zero clutter.
- **Weaknesses.** So integrated it may not read as branding at all; a script whisper on the view risks
  breaking the arch's "no type on the orchard" law (Blueprint § 6.1) — so in practice this concept
  argues *for Concept 1* (no mark) rather than for a mark on the view.
- **Long-term brand implication.** The philosophical endpoint: **the orchard is the logo.** It makes the
  case that THA's most powerful branding decision is to protect the view and add nothing — which loops
  back to Concept 1 as the disciplined, buildable expression of the same idea.

---

## 6. The concepts at a glance

| # | Concept | Plane / material | Loudness | Premium ceiling | Risk | Ownability |
|---|---|---|---|---|---|---|
| 1 | No branding | — (the room) | silent | ★★★★★ | needs a strong room | the arch is the mark |
| 2 | Embossed apple | plaster wall | whisper | ★★★★☆ | contrast fragility | high |
| 3 | Embossed wordmark | plaster wall | quiet | ★★★☆☆ | corporate/brochure | medium |
| 4 | Carved oak signature | oak furniture | quiet | ★★★★☆ | crowds the fold | high (craft) |
| 5 | Brass apple inlay | oak + metal | soft glint | ★★★★★ | foreign material | high (a metal) |
| 6 | Etched stone threshold | stone floor | quiet | ★★★☆☆ | 🔴 floor already busy | medium |
| 7 | Revealed by light | plaster + light | flickering | ★★★★☆ | execution / invisibility | very high |
| 8 | Maker's mark plaque | corner stone | small | ★★★★★ | easy to miss | very high |
| 9 | Keystone apple | the arch itself | subtle | ★★★★★ | touches the focal point | very high |
| 10 | Orchard-integrated | the view | subliminal | ★★★★★ | may not read as brand | absolute |

---

## 7. Recommendation

**Primary: Concept 8 (maker's mark) + Concept 2 (embossed apple), with the banner reformed to C+D.**

The strongest architectural branding for THA is the family that treats identity as something a
*builder* leaves in a home they made, discovered over time rather than announced on arrival:

1. **Reform the top banner (§ 4, C+D):** dissolve the band into the plaster wall and replace the long
   logo with a **single quiet apple**. Retire the wordmark and tagline from Home. This alone removes the
   one un-architectural element in the room.
2. **Set a maker's mark (Concept 8)** low in the room — apple + "THA · est." — as the primary,
   discoverable identity: THA as a *builder of homes*, not a platform stamping a logo.
3. **Let the apple recur as an embossed plaster relief (Concept 2)** across rooms, so the whole house
   carries one quiet signature in its walls.
4. **Protect the arch.** The keystone apple (Concept 9) is the most exciting idea in this document and
   the most dangerous; it should be **prototyped but held**, because the arch's calm is the room's most
   valuable asset and a mark on it is irreversible in feel. Concept 1 (no branding) is the honest
   fallback if any in-room mark ever competes with the arch — *and it is a legitimate destination, not
   a failure.*

**The challenge to current thinking, restated:** the current top banner is the *least* THA place the
brand can live. Everything premium about the ARRIVAL1 room argues that identity here should be **built
into plaster and oak and discovered by light**, not bolted above the room in a coloured bar. The apple
already contains this house; the job of branding is to reveal that, quietly, and then get out of the
way.

---

## 8. Verification

| Check | Result |
|---|---|
| Room / arch / orchard / furniture modified | **None.** Every concept injected in the browser only; app source byte-untouched. |
| Concepts rendered | **10 branding concepts + 4 banner fates**, all on the identical live `/home` (populated state), at 1440×1400 · `deviceScaleFactor 2`. |
| Close-ups | Auto-clipped to each injected mark's bounding box (`*-mark.png`) so subtle in-material marks are legible. |
| Each concept analysed | emotional feeling · first-time · returning · strengths · weaknesses · long-term brand implication. |
| Top-banner question | A/B/C/D all rendered and decided (§ 4). |
| Product / schema / migration / tests | **None** — exploration only. |

**Artifacts**
```
scripts/capture-brand1-concepts.ts              the render harness (injects on the canonical room)
docs/ui-audit/brand1/                            baseline · c1..c10 (+ -mark close-ups) · banner_a..d
client/public/_brand1-apple.png                  a copy of the apple icon, for browser-side injection
                                                 (throwaway — nothing imports it; safe to delete)
```

---

*BRAND1 — exploration only. The room is unchanged; only the expression of THA moves. The finding
that frames it all: the arch is the apple, opened to the size of a home — so the most premium branding
is the branding you barely see.*
