# HOME — The Final Five Concepts

**The last exploration before the Home experience is permanently locked.**
Five genuinely different *experiences* of the one canonical room. The ARRIVAL1 architecture — orchard,
room, arch, oak console, stone floor, layout — is **byte-untouched**. Only the feeling changes.

| | |
|---|---|
| **Session** | `HOME_FINAL_CONCEPTS` |
| **Date** | 2026-07-17 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `rollback/HOME-FINAL-CONCEPTS-20260717` → `7bfad50c` (tag `home-final-concepts-wip-snapshot-7bfad50c`) |
| **Status** | **Awaiting owner decision.** 5 concepts, each rendered on the live room at desktop + mobile. |
| **Product changed** | **None.** Every concept injected in the browser only; app source byte-untouched. |

---

## 1. What this is, and what it is not

**Not:** a redesign. The mission is explicit and it is honoured to the letter. The orchard, the room,
the arch, the oak console, the stone floor and the layout of ARRIVAL1 are **canonical and untouched**.
Nothing here changes a data source, a hook, a route, an API, or a behaviour.

**Is:** the final question before Home is locked — *how should arriving Home **feel**?* Where BRAND1
asked **where** THA's identity lives and BRAND2 perfected **the mark**, this asks the whole-experience
question the room has never been asked in one place: greeting, banner, typography, composition,
materials, lighting, arrival sequence, emotional emphasis, and the relationship between the **greeting,
the apple and the arch** — the three things a household meets first.

**Method — rendered on the real room.** Each concept is injected into the **live canonical `/home`** in
the browser at render time only (`scripts/capture-home-final-concepts.ts`, the BRAND1/BRAND2
discipline); nothing edits app source. So every image is the *same room* — same arch, same orchard,
same oak, same day's data — changing **only the experience of THA**. Renders are in
`docs/ui-audit/home-final-concepts/`, each concept at **desktop (1440)** and **mobile (430)**,
`deviceScaleFactor 2`, on a populated household (3 meals · 5 shopping · 28/30 plants · one Companion
line) so the room is directly comparable to the BRAND2 study.

**Read before starting** (and read): `docs/architecture/README.md` (the Bootstrap),
`ARRIVAL1_DEFINITIVE_HOME.md` (the room), `BRAND1_ARCHITECTURAL_BRANDING.md` (where identity lives),
`BRAND2_EMBOSSED_APPLE_EXPLORATION.md` (the Pressed Apple). Git status confirmed and rollback
protection created before any work.

---

## 2. The one instruction that governs all five

> **Optimise for emotional response. The household should smile slightly every time they arrive Home.**

That is the test each concept is measured against, and it is the reason this document does **not**
optimise for subtlety. It also names the trap: the Emotional Palette (`THA_EXPERIENCE_LANGUAGE.md`
§ 3A) warns that **"calm must never become lifeless"** — that THA must never feel *cold · clinical ·
sterile · funeral-parlour calm · emotionally distant*. A room can be beautiful and premium and still
fail this test by being *cool*. So the five concepts deliberately span the range — from the most
restrained (C) to the warmest (B, E) — precisely so the trade-off between *composure* and *the smile*
is visible, not assumed.

The five are not five decorations of one idea. They are **five different answers to "what is a home
for"** — a signed piece of craft (A), a family you belong to (B), an architect's calm (C), a window
onto life (D), and a house that was expecting you (E).

---

## 3. The five concepts

For each: **renders (desktop + mobile) · design philosophy · emotional feeling · first-time experience
· everyday experience · strengths · weaknesses · why someone would love it.**

---

### A — The Signature Wall
*The whole room is one signed piece.*

![A desktop](../ui-audit/home-final-concepts/A-desktop.png)
![A mobile](../ui-audit/home-final-concepts/A-mobile.png)

**Design philosophy.** THA is a **maker**, and this is the home it built and signed. The identity is not
placed on the room — it *is* the room, at three scales of one gesture: the household's **name in THA's
own hand** (the largest signature), the **Pressed Apple** in the plaster beside the arch (BRAND2's
canonical mark, the middle scale), and **"The Healthy Apples" routed into the oak** of the console like
a cabinetmaker's signature on the piece they made (the smallest). The top banner dissolves into the
plaster and leaves a single quiet apple where the logo was (BRAND1 § 4, C+D). Everything says the same
thing in three materials: *someone made this, for you, and stood behind it.*

**Emotional feeling.** Craft, pride, permanence. The warmth of a hand-made object — a signed print, a
maker's stamp on the base of a bowl. Not loud; *earned*.

**First-time experience.** The room reads as considered the moment you arrive; then, over the first few
mornings, the signatures are discovered one by one — the apple in the wall, the script in the wood.
Each is a small "oh, they signed it" — the exact register of BRAND2's "there's an apple in the wall."

**Everyday experience.** The signatures stop being brand and become *details of their wall and their
furniture* — the quiet constant a home earns by being lived in. The name in their own hand greets them
every day; the marks recede into familiarity without ever disappearing.

**Strengths.** The most *ownable* identity system — it extends to every room (each room's plaster and
furniture carries the same signatures). Deeply premium-through-craft. Already 90% blessed: it is
BRAND1's recommendation and BRAND2's canonical, assembled.

**Weaknesses.** Three marks is three marks — the discipline that keeps it from tipping into
*over-signed* is real, and the oak script is the most "logo-like" of the family (BRAND1 C4's
contrast-on-wood caveat). It celebrates *the maker* slightly more than *the household* — the room is
proud of who built it, where B and E are proud of who lives in it.

**Why someone would love it.** Because it feels **made for them by hand**, not generated by software —
and in a category full of dashboards, a home that is visibly *crafted* is rare and quietly flattering.

---

### B — The Family Home
*Not a premium showroom — a home with people in it.*

![B desktop](../ui-audit/home-final-concepts/B-desktop.png)
![B mobile](../ui-audit/home-final-concepts/B-mobile.png)

**Design philosophy.** The warmest, most human reading. Everything is tuned toward **belonging**: a
**lived-in golden morning** (the light warmed a half-step, as if the sun has been up a while), a
**personal hello** ("Morning, Chloe" rather than the formal "Welcome home"), a **warm line of the day**
under the name ("The kitchen's yours today — three meals planned, the greens are at their best, and
there's nothing left to fetch"), the **Companion foregrounded** like a friend already leaning on the
counter, and a small **family maker's-mark plaque** low in the stone floor ("· a home, est. ·"). The
banner reforms to a single quiet apple. Premium here is *warmth*, not polish.

**Emotional feeling.** Being *expected and welcomed* — the feeling of walking into a kitchen where
someone you love has already put the kettle on. Cosy, generous, unhurried.

**First-time experience.** Immediately disarming — it does not greet you like an app greets a user; it
greets you like a home greets a person. The warmth lands in the first second, before any feature is
noticed.

**Everyday experience.** The daily line changes with the day (data-borne), so the hello never goes
stale; the room feels like it *has been thinking about you*. The plaque and the warm light become the
familiar temperature of the place.

**Strengths.** Best-in-class on the mission's actual test — this is the concept most likely to raise a
literal smile. It is unmistakably a *home*, which is THA's whole thesis ("a warm, lived-in home where
someone has already thought about dinner").

**Weaknesses.** Warmth has a ceiling before it tips into *sentimental* — the daily line must be genuine
and data-borne or it becomes the "brochure voice" NORTH1 § 5.7 evicted. The golden light is lovely but
must not drift toward the "second sun" the Blueprint forbids; here it is a wash on the wall, not a
second light source, and that discipline has to hold. Slightly less *timeless* than C.

**Why someone would love it.** Because it makes them feel **cared for** — the rarest feeling in
software, and the one a household comes home for.

---

### C — The Architect's House
*Composed emptiness. The architecture is the brand.*

![C desktop](../ui-audit/home-final-concepts/C-desktop.png)
![C mobile](../ui-audit/home-final-concepts/C-mobile.png)

**Design philosophy.** The purest restraint. **No visible mark at all** — no apple, no wordmark, no
banner; the band dissolves entirely into plaster and the room carries the whole identity by its
architecture (BRAND1 Concept 1). The household's name is re-set from the handwritten flourish into a
**refined light editorial serif** — precise, quiet, gallery-grade — and the composition is given
**more air**, the console stepping back so the wall breathes. The light is cooled a half-step to an
even, museum daylight. This is *premium through restraint*, taken to its logical end: a home so sure of
itself it signs nothing.

**Emotional feeling.** Calm, clarity, quiet confidence. The composure of a beautifully proportioned
empty room with morning light in it. Expensive in the way silence is expensive.

**First-time experience.** Arresting for the design-literate — the taste is obvious and the confidence
reads instantly. A small risk of "whose is this?" in the first second, answered by the room's
coherence and the name in the light.

**Everyday experience.** Ages the best of all five — impossible to date, nothing to tire of. A returning
household never needs to be told the name of the house they live in; the architecture is the
recognition.

**Strengths.** The most timeless and the highest design ceiling; the safest against ever looking dated;
the truest to "the household's own life is the only ornament." The one concept that would still look
current in a decade untouched.

**Weaknesses.** 🔴 **The coolest of the five — and coolness is the mission's named enemy.** Push the
restraint one notch too far and it becomes the *"funeral-parlour calm"* and *"emotionally distant"*
temperature the Emotional Palette forbids. It is the least likely to raise a *smile*: it earns
admiration more than affection. The serif greeting is beautiful but loses the intimacy of the
household's name in a human hand.

**Why someone would love it.** Because it treats them as someone with **taste** — it never shouts,
never sells, and trusts them to feel quality without being told.

---

### D — The Orchard House
*The view is the hero. Step back and let the world in.*

![D desktop](../ui-audit/home-final-concepts/D-desktop.png)
![D mobile](../ui-audit/home-final-concepts/D-mobile.png)

**Design philosophy.** The orchard leads. The arch's own morning is **amplified into a luminous
green-gold halo** that spills onto the wall around the opening, and a living green-gold light washes the
whole room, so the view **breathes into** the space rather than sitting framed within it. The greeting
**steps back** — smaller, softer — so the *world* is the first thing you meet, not your name. No mark:
the identity lives in the orchard itself (BRAND1 Concept 10 — *the arch is the apple, the orchard is the
logo*). This is THA as a **window onto life**: bright, growing, optimistic, exactly the orchard the
Emotional Palette fixes as *life*.

**Emotional feeling.** Openness, calm, quiet joy. The lift of standing at a window on a good morning —
the room is a frame for something alive.

**First-time experience.** The view does the welcoming; it is genuinely beautiful and it earns an
involuntary breath. The room feels like it *opens onto somewhere real*.

**Everyday experience.** The orchard is the constant that a household returns to; because THA's light is
one fixed morning (Blueprint § 6), the view is a stable, reliable calm — the same good morning, every
morning, for the household's changing life to return to.

**Strengths.** The most *alive* and the most optimistic; the strongest antidote to "cold/clinical." The
most unownable-by-anyone-else (no competitor has *this* orchard). Leans entirely on the room's single
best asset.

**Weaknesses.** By stepping the greeting back, it makes the room slightly **less about the household** —
the person is greeted second, after the view. The amplified light is the most delicate to execute
honestly: it must stay *one* morning intensified, never tip into a theatrical or "second sun" glow
(Blueprint anti-patterns). Least room for THA's own mark, by design.

**Why someone would love it.** Because it gives them a **moment of beauty** before it gives them a task
— arriving Home feels like opening the curtains, not opening an app.

---

### E — Claude's Best Idea · *"The House That Was Expecting You"*
*The synthesis, tuned for one thing: the smile.*

![E desktop](../ui-audit/home-final-concepts/E-desktop.png)
![E mobile](../ui-audit/home-final-concepts/E-mobile.png)

**Design philosophy.** Take the best of the other four and unite them under one emotional idea: **the
house was ready before you walked in.** A warm **first-light dawn** rises from the arch (D's living
light, held to one morning); the household's name stays in **THA's own hand** (A's/the room's signature
warmth); the banner dissolves to a **single quiet apple** and the **Pressed Apple** sits beside the arch
as the built-in "made for you" mark (A + BRAND2); and — the one genuinely new beat none of the others
has — the room greets you with **a single warm, true line of good news**: *"The house is ready for you.
The kettle's on, today's already planned — and the first thing worth knowing is that the greens are at
their best."* Not a dashboard reporting status; **a friend telling you the one good thing about today.**
That is the whole difference: A is *made for you*, B is *cared for*, D is *a beautiful view* — E is
**expected**.

**Emotional feeling.** Recognition and reassurance — *someone thought about my day before I got here.*
Warm, calm, quietly delighted. The feeling of a note left on the counter in a hand you know.

**First-time experience.** The line is the moment. Being *told one good thing* on arrival — instead of
being shown a grid to parse — is disarming and memorable in exactly the "quietly memorable" register the
Experience Language asks for. The Pressed Apple is discovered a beat later as the quiet signature under
the good news.

**Everyday experience.** Because the line is **data-borne** (see the caveat below), it is different and
true every morning — so the house never repeats itself and never lies. The smile is renewable: the
household comes to look forward to *what the house has noticed today.* On a quiet day it says less, and
that honesty is part of why the good days feel warm rather than manufactured.

**Strengths.** Best fulfils the mission's north star while staying premium, calm and warm — it does not
choose between the smile (B) and composure (C); it **holds both**. It is built almost entirely from
already-blessed decisions (BRAND1's banner reform, BRAND2's Pressed Apple, the room's own hand, D's one
morning), so its novelty is concentrated in **one** new element that is cheap to build and honest by
construction.

**Weaknesses.** 🔴 **Everything rests on the good-news line being real.** If it is ever templated,
generic, or fabricated, it becomes the brochure voice NORTH1 § 5.7 evicted and breaks Core Principle 6
(non-fabrication) and Blueprint § 12.1 (*data-borne or dead*). It must be produced by an owner — the
Behaviour Engine's voice over a real, chosen fact — verbatim, and must **say less when there is less to
say.** That is a genuine engineering constraint, not a decoration (see § 6). Slightly busier than C's
pure restraint.

**Why someone would love it.** Because it makes them feel **known** — the house noticed something worth
telling them, and told them warmly. That is the smile the mission is asking for.

---

## 4. The five at a glance

| # | Concept | The one idea | Temperature | Greeting voice | THA's mark | Smile on arrival | Timelessness |
|---|---|---|---|---|---|---|---|
| **A** | The Signature Wall | *made by hand, for you* | warm-neutral | hand | apple + oak + banner-apple | ★★★★☆ | ★★★★☆ |
| **B** | The Family Home | *you are cared for* | warmest | "Morning," + hand | small plaque + banner-apple | ★★★★★ | ★★★☆☆ |
| **C** | The Architect's House | *composed emptiness* | coolest | light serif | **none** | ★★☆☆☆ | ★★★★★ |
| **D** | The Orchard House | *a window onto life* | green-gold | recessive hand | **none** (the orchard) | ★★★★☆ | ★★★★☆ |
| **E** | The House Expecting You | *you were expected* | warm dawn | "Good morning," + hand | Pressed Apple + banner-apple | ★★★★★ | ★★★★☆ |

They do not converge. A signs the room; B fills it with people; C empties it to its architecture; D
opens it to the world; E has it waiting for you. Same walls, five different homes.

---

## 5. Recommendation — **E, "The House That Was Expecting You."**

**Adopt E as the permanent Home of The Healthy Apples.**

The mission set exactly one test — *the household should smile slightly every time they arrive Home* —
and E is the concept built against that test without surrendering anything THA cannot afford to lose:

1. **It wins the mission's own test while staying premium.** B is its only rival on the smile, and C is
   its only rival on composure. E refuses the choice: it is as warm as B in its first line and its dawn
   light, and as calm as C in its restraint (one line, generous air, one quiet mark). The other three
   each sacrifice something E keeps — A celebrates the maker over the household, C risks the *cold* the
   Emotional Palette forbids, D greets the view before the person.

2. **Its warmth is renewable and honest, not decorative.** A pretty room is admired once and then
   ignored (C's risk). E's smile is **renewable** because the good-news line is different and true every
   morning — the household returns to find out *what the house noticed today.* That is the difference
   between a logo you stop seeing and a signature that becomes yours (BRAND2's own closing distinction),
   applied to the whole arrival rather than to a mark.

3. **It is mostly already approved.** E is not a sixth direction; it is the **assembly of decisions THA
   has already reached** — BRAND1's banner reform (dissolve + single apple), BRAND2's canonical Pressed
   Apple, the room's own handwritten greeting, and D's one-morning light — plus **one** new beat. That
   makes it the lowest-risk of the five to build and the easiest to keep coherent with everything
   already shipped.

4. **It is unmistakably The Healthy Apples.** The apple is pressed into the wall the great one is cut
   into; the orchard is real and beyond it; the day is honest; the voice is the Companion's. It could
   belong to no other product.

**Runner-up: B (The Family Home)** — if the owner wants to lean fully into warmth and worry less about
composure, B is the purest expression of the smile and is the correct fallback. **C is the safe,
timeless choice** and the right answer *only if* the platform later decides Home should read cooler and
more gallery-like than the Emotional Palette currently allows — a decision that would sit above this
document.

---

## 6. The one thing that makes E honest (and buildable)

E's power and its only real risk are the same element: **the good-news line.** For E to be built rather
than mocked, that line must obey the canon the room already obeys — so this is recorded now, not
discovered later:

- **Data-borne or dead** (Blueprint § 12.1). The line is composed from a **real, chosen fact** the
  platform already knows (a planned meal, a cleared list, a seasonal note the Companion surfaced) — never
  a generic greeting, never a fabricated one (Core Principle 6). On a genuinely quiet day it says less,
  or nothing beyond the hello. *A home that invents good news is worse than one that stays quiet.*
- **One owner, one voice.** The sentence is the **Behaviour Engine's**, voiced in the household's chosen
  personality and rendered **verbatim**, exactly as the Companion card already renders its notice — not a
  second string this page invents (the NORTH1 § 5.7 / Notice Engine discipline). Home composes; it does
  not write.
- **It aims words, never the light.** The dawn warming and the halo are a *composition* of the room's one
  existing morning, not a new light source or a time-of-day effect (Blueprint § 6 / § 16; Household Time
  aims *words and doors, never light*).
- **The Pressed Apple and the banner reform** ship on the paths BRAND1/BRAND2 already fixed (one relief
  treatment on the `.home-arrival` wall; the band dissolved to plaster with a single apple).

Built that way, E adds **no** new data, store, route, capability or fabricated content — it is the
canonical room, its already-chosen mark, and one true warm sentence the platform already has an owner
for. That is what makes *"the house was expecting you"* a fact the house can honestly claim.

---

## 7. Verification

| Check | Result |
|---|---|
| Room / arch / orchard / furniture / layout modified | **None.** Every concept injected in the browser only; app source byte-untouched. |
| Concepts rendered | **5** (A–E) **+ baseline**, each at **desktop 1440 + mobile 430**, `deviceScaleFactor 2`, populated household. |
| Per-concept analysis | design philosophy · emotional feeling · first-time · everyday · strengths · weaknesses · why loved — all present. |
| The greeting · apple · arch relationship | Explored per concept (signed trio · warm hello · serif restraint · recessive-to-view · pressed-beside-arch). |
| Banner fate | Decided per concept (dissolve→apple · dissolve→apple · dissolve→none · dissolve→none · dissolve→apple), on BRAND1 § 4. |
| Governance honesty | E's one new element (the good-news line) constrained to data-borne / one-owner / verbatim (§ 6). |
| One recommendation | **E — "The House That Was Expecting You"** (§ 5), with B and C named as the fallbacks. |
| Product / schema / migration / tests | **None** — exploration only. |

**Artifacts**
```
scripts/capture-home-final-concepts.ts       the render harness (injects the five experiences on the canonical room)
docs/ui-audit/home-final-concepts/           baseline · A..E, each -desktop.png and -mobile.png
client/public/_brand2-apple.png              reused throwaway apple asset for browser-side injection
```

---

*HOME_FINAL_CONCEPTS — five homes in one room. A signs it, B fills it with people, C empties it to its
architecture, D opens it to the orchard, and E has it waiting for you with the kettle on. The room never
changed; only who it decided to be when you walked in. The recommendation is the one that makes you
smile because it noticed you — and can prove it noticed something true.*
