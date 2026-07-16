# THA Kept Room Translation — The Bridge Between Architecture and Interface

**Status:** CANONICAL TRANSLATION GUIDE — the governing bridge between the Orchard House architecture and the software interface; required reading before any user-facing implementation, so that what is built is the *house*, translated, and not a new thing wearing its words
**Classification:** Experience Governance (canonical)
**Adopted:** 2026-07-15 (TRANSLATION1)
**Adopted visual soul (given):** **The Kept Room** — warm minimalism, *modern bones, warm skin* — recommended by [`../implementation/ux/ORCHARD3_VISUAL_CONCEPT_EXPLORATION.md`](../implementation/ux/ORCHARD3_VISUAL_CONCEPT_EXPLORATION.md) § 5, worked into Home by [`../implementation/ux/HOUSE1_THE_ENTRANCE_HALL.md`](../implementation/ux/HOUSE1_THE_ENTRANCE_HALL.md), and taken here as the sensibility being translated
**Extends:** [`THA_EXPERIENCE_BLUEPRINT.md`](./THA_EXPERIENCE_BLUEPRINT.md) (the vision and the place) · [`THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`](./THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md) (the design language) · [`THA_ORCHARD_LIVING_BOOK.md`](./THA_ORCHARD_LIVING_BOOK.md) (the lived account) — this document is their **translation into interface terms**; it adds no vision, no place, no rule, and owns only the *translation itself* (§ 2)
**Never overrides:** [`THA_EXPERIENCE_ARCHITECTURE.md`](./THA_EXPERIENCE_ARCHITECTURE.md) (behaviour) · [`THA_UI_ARCHITECTURE.md`](./THA_UI_ARCHITECTURE.md) (the binding look — every colour, token, type value, shadow, duration) · [`THA_EXPERIENCE_LANGUAGE.md`](./THA_EXPERIENCE_LANGUAGE.md) (the feeling)
**Governed by:** [`THA_EXPERIENCE_ARCHITECTURE.md`](./THA_EXPERIENCE_ARCHITECTURE.md) (behaviour prevails in any conflict) → [`THA_EXPERIENCE_BLUEPRINT.md`](./THA_EXPERIENCE_BLUEPRINT.md) (the vision and the place) → **this document** (their translation into interface)
**Enforced by:** nothing new. This guide adds **no gate and no check.** A translation is verified by the gates already in force — the three governance gates, the Experience Test (Experience Blueprint § 15.3), the Blueprint Checks (§ 15.2), the Design Character Check (Orchard House Design Blueprint § 16.2), and the UI Governance Checklist (UI Architecture § 18). This document is the *dictionary* those checks are read against, not a new check.

> **What this document is.** The governing documents describe the Orchard House completely — what it must *do* (Experience Architecture), *look like* (UI Architecture), *feel like* (Experience Language), *be* (Experience Blueprint), how it is *designed* (Orchard House Design Blueprint), and what it is *like to live in* (Orchard Living Book). They describe the house in the language of **architecture and feeling**: light, oak, thresholds, morning, patina. Software is built in a different language: behaviour, layout, spacing, type, motion, interaction. Between those two languages there has never been a single, deliberate *translation* — and translation is exactly where a soul is lost. A team that means well can read every rule, pass every gate, and still build a "warm oak counter" as a brown rectangle, a "threshold" as a splash screen, a "kept room" as a decoration — because no document sat between the metaphor and the mechanism and said, plainly, *this architectural thing becomes this interface behaviour, and never that one.* This document is that bridge. For every major architectural characteristic of the house it states, in one place, the interface it becomes — and the interface it must never become. **It restates no rule** (restating a rule creates a second owner of it, which the architecture forbids — Experience Blueprint § 18; Architecture Principle 2): where a translation touches an owned concern it applies the owner's rule and cites it, and adds only the *translation*. It **sets no value** — no colour, token, size, duration, or pixel. And it **jumps no governance path** — the Kept Room's material, light, and depth translations here ship only through the path the Blueprint fixed (§ 2.4). A build that conflicts with this translation should **STOP, explain why, and not continue until approved.**

---

## 1. PURPOSE — WHY A TRANSLATION IS ITS OWN DOCUMENT

The mission that created this document names its own need precisely: *"translate the Orchard House into software without losing its soul."* The three verbs matter in order — **translate**, not redesign; the **Orchard House**, an already-decided thing; **without losing its soul**, which is exactly what a careless translation does.

- **The philosophy is complete.** The house is a *warm, lived-in home where someone has already thought about dinner* (Experience Language § 3A; Experience Blueprint § 1.1) — *a modern home in an ancient orchard* (Experience Blueprint § 1.4).
- **The architecture is complete.** One home, many places; the orchard and its exposure scale; the one morning; the three grounds; the Living Details; the constant shell (Experience Blueprint §§ 4–14).
- **The visual soul is chosen.** The Kept Room — warm minimalism, *modern bones, warm skin* (ORCHARD3 § 5).

What remains is neither invention nor decision. It is **translation**: taking each architectural word the house is described in and answering, once and canonically, *what does this become when it is software?* That answer has, until now, lived scattered across six documents and implied rather than stated. Scattered and implied is precisely how a soul leaks out between the drawing and the build. This document gathers the translation into one place so the leak has nowhere to happen.

> **The one thing this document is for:** so that a designer or developer with an architectural word in hand — *"oak," "threshold," "patina," "morning"* — can find, in one place, the interface it becomes and the interface it must never become, and build the house rather than a picture of it.

## 2. HOW THIS DOCUMENT GOVERNS

### 2.1 One experience, and this document's place in it

THA's user-facing layer is governed by a small constitution, each document owning one question. This document adds a bridge, not a seventh vision:

| Question | Owner |
|---|---|
| What must the experience **do**? | [`THA_EXPERIENCE_ARCHITECTURE.md`](./THA_EXPERIENCE_ARCHITECTURE.md) — behaviour, journeys, the eight Experience Principles, the Premium standard |
| What is the **vision** and the **place** — the house, rooms, orchard, light, materials, signs of life? | [`THA_EXPERIENCE_BLUEPRINT.md`](./THA_EXPERIENCE_BLUEPRINT.md) |
| How must it **look** — every colour, token, type value, shadow, duration? | [`THA_UI_ARCHITECTURE.md`](./THA_UI_ARCHITECTURE.md) — the Calm Orchard visual language and its binding law |
| How must it **feel**? | [`THA_EXPERIENCE_LANGUAGE.md`](./THA_EXPERIENCE_LANGUAGE.md) — the seven feelings, the Emotional Palette, the Principles of Feeling, the Rhythm |
| What is the house's **design character** — its architectural style, interior philosophy, timeless doctrine? | [`THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`](./THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md) |
| What is it **like to live** in the house? | [`THA_ORCHARD_LIVING_BOOK.md`](./THA_ORCHARD_LIVING_BOOK.md) |
| **How does each architectural characteristic of the house become interface** — and what must it never become? | **This document** |

The others describe the house. This document **translates** it — turning each architectural word into an interface consequence across behaviour, layout, spacing, typography, motion, and interaction, and naming the mistranslation to refuse. That mapping is genuinely unowned: it is not the vision, not the look, not the feeling, not the design character, not the lived account. It is the **dictionary** between them.

### 2.2 What this document owns — and what it never owns

The canonical owner of exactly these, none of which any other governing document holds:

1. **The translation schema** (§ 3) — the nine facets every architectural characteristic is translated across.
2. **The translations themselves** (§ 4) — for each major architectural characteristic of the Orchard House, its interface consequence and its forbidden mistranslation.
3. **The governing UI translation principles** (§ 5) — the ordering laws (*space before decoration; light before colour; materials before effects; depth before shadows; calm before information; household before technology; people before data*) that decide any translation the table does not settle.
4. **The complete visual language, stated whole** (§ 6) — the house described as one interface identity, without reference to any individual screen.

And it deliberately owns nothing else:

- **No vision, no place.** *"A modern home in an ancient orchard,"* One Home Many Places, the orchard, the Exposure Scale, the Living Details are the Experience Blueprint's (§§ 1, 4–8, 12). This document translates them; it does not restate or extend them.
- **No visual values.** No colour, hex, token, radius, shadow value, duration, easing, type size, or pixel appears here. Every value is the UI Architecture's (§§ 7, 8, 9, 11, 16), entering only by the governed path (§ 2.4).
- **No feelings beyond citation.** The emotional register is the Experience Language's (§ 3, § 3A); this document quotes its conclusions and adds none.
- **No behaviour, no design character, nothing runtime.** No code reads this document; it creates and retires no component, route, token, or dependency. Its surface is human judgement at the gates that already exist (§ 2.5).

### 2.3 Precedence, stated once

**Experience Architecture (behaviour) > Experience Blueprint (vision and place) > this document (their translation) > nothing.** Beside it, the UI Architecture owns the binding look, the Experience Language owns the feeling, and the Orchard House Design Blueprint owns the design character; this document overrides none of them and is overridden by none. Where it and a sibling appear to conflict, they are describing the same house from two angles and both are corrected until they agree; where a genuine conflict of *rule* remains, the question's owner (§ 2.1) wins, and any conflict that cannot be resolved sideways resolves upward — first to the Experience Blueprint, then to the Experience Architecture.

### 2.4 The governance path — this document jumps none of it

Everything in § 4 that describes the Kept Room's warmth, ground, light, and depth is **translation, not a licence to ship.** It remains bound by the exact path the Experience Blueprint fixed (§ 2.4 there) and the Orchard House Design Blueprint inherited (§ 2.4 there):

- The depth / ground-plane / warm-light vocabulary sits **beyond the UI Architecture's current flat-surface law** (UIA § 4) and may not ship on any surface until the **governed UIA § 4 amendment** admits it. Until then, UIA § 4 as written is the binding law of every shipped surface.
- Exposure and per-domain light values enter only as **semantic tokens by admission** (UIA § 16), never as per-surface choices.
- Each Living Detail is admitted **one at a time** against the Experience Review Questions (Experience Blueprint § 12.1, rule 6).
- **The Kept Room itself is a *recommended* visual direction** (ORCHARD3 § 5.4), not yet a governing amendment. This document translates it on the mission's instruction; the translation *ships* only once the Kept Room graduates into the UI Architecture / Orchard House Design Blueprint by amendment.
- The Blueprint's **four open items** (§ 18 there) — the orchard's canonical owner, Home's header, the pending UIA § 4 amendment, and dark mode — still stand between this translation and any pixel. This document creates no new open item and closes none.

A vivid translation in § 4 changes no visual law. Where it seems to, **this document is the defect** and is corrected to a citation (§ 7.3).

### 2.5 It adds no gate — the existing gates verify the translation

This document deliberately introduces **no new checklist.** A translation is checked by the gates already in force, read against this dictionary:

- the **Experience Test** — *which room · how should they feel · the one thing* (Experience Blueprint § 15.3);
- the **Blueprint Checks** — one home, a room not a theme, the orchard laws, one morning, material honesty, Living Detail discipline, the Companion in its chair, the walls untouched, the governance path (Experience Blueprint § 15.2);
- the **Design Character Check** — architectural character, interior philosophy, timeless not fashionable, design disappears, the room reading (Orchard House Design Blueprint § 16.2);
- the **UI Governance Checklist** — one visual language, emphasis budget, canonical ownership, semantic tokens, colour law, motion, states, visual trust, accessibility floors (UI Architecture § 18);
- the **UX Governance Checklist** and its Premium Standard (Experience Architecture § 18) and the **Experience Review Questions** (Experience Language § 6).

Adding a tenth checklist would create a second owner of checks the architecture already owns once. This document exists so those checks can be applied *knowing what the architectural words mean in interface terms* — that is its whole contribution to enforcement.

## 3. HOW TO READ A TRANSLATION

Every architectural characteristic in § 4 is translated across the same nine facets, in the same order, so the table is a reference and not an essay:

1. **Architectural meaning** — what the thing is in the house (cited to its owner).
2. **Emotional purpose** — why the house has it; the feeling it carries (cited to the Experience Language).
3. **Interface behaviour** — what the software *does* because of it.
4. **Layout** — where it puts things and how they relate.
5. **Spacing** — what it does to air, density, and rhythm.
6. **Typography** — how it shapes the reading voice (never a value — the three voices and the scale are UIA § 8).
7. **Motion** — what, if anything, it may move (the vocabulary is UIA § 11; the test is Experience Language Principle H).
8. **Interaction** — how the hand meets it.
9. **What must never happen** — the mistranslation to refuse, routed to the anti-patterns that own it (Experience Blueprint § 16; Experience Language § 7).

Two disciplines hold across every entry, because the whole document rests on them:

- **The translation is of a *feeling produced by material and light*, never of a *picture*.** *"Oak" does not become a wood-grain texture; it becomes a warm, honest working surface.* The moment a translation becomes a literal image of the architectural thing, it has become **the theme park** (Experience Blueprint § 16) and the soul is lost. This is the single most important discipline in the document, and it governs every "never" below.
- **The translation carries warmth and life, never coldness.** THA's one great risk is that calm renders *cold* — clinical, empty, sterile, funeral-parlour still (Experience Language § 3A.1). Every translation is checked first against *"calm must never become lifeless"* (Experience Language § 3A.4). A translation that is correct but cold is wrong.

## 4. THE TRANSLATIONS

The characteristics are grouped as a house is understood: its **structure** (how the house is shaped and lit), its **materials** (what it is built and furnished from), its **atmosphere** (the quality of being in it), and its **people** (who is present). The grouping is for reading only; each entry stands alone.

---

### 4.1 STRUCTURE — how the house is shaped and lit

---

#### LIGHT

1. **Architectural meaning.** One morning sun, upper-left, one hour, in every room forever; rooms differ by *exposure* (how much of the morning a window admits), never by hour (Experience Blueprint § 7; Orchard House Design Blueprint § 6).
2. **Emotional purpose.** Warmth, welcome, calm, clarity, optimism — and no other meanings (Experience Language Principles 6, F). Light is the fastest carrier of the house's temperature.
3. **Interface behaviour.** The interface has **one lighting condition, always** — it never darkens for the hour, the mood, or "night as atmosphere." A surface's brightness is a designed constant of its exposure, not a response to time or state (HOUSE1 § 6.4). Any legitimate dark *mode* is a complete, warm re-rendering of the same one morning, resolved token-for-token (UIA § 7's complete-mode law), never a mood.
4. **Layout.** Light sets the direction of emphasis: the primary stands where the morning falls; support waits a half-step back in the penumbra; quiet content sits in the shade — depth meaning distance, never drama (Experience Blueprint § 7).
5. **Spacing.** Light needs room to fall; a surface lit by one soft morning is a surface with air around its lit elements — crowding kills the light as surely as it kills the calm (Experience Blueprint § 8.2).
6. **Typography.** Type sits *in* the light on solid ground, never on the view; weight and legibility are read against the accessibility contrast floors before adoption (UIA § 8, § 15) — legibility is never traded for atmosphere (Experience Blueprint § 6.1).
7. **Motion.** Light does not move, sweep, or glow. The house has **lighting, not light shows**; the one sanctioned light *moment* is the arrival's, and it reads as morning sun settling on a surface — once, softly (Experience Blueprint § 7; UIA § 11).
8. **Interaction.** The hand answers by lifting into the light on hover and seating on press — depth felt through the pointer, in one direction, identically everywhere (Experience Blueprint § 8.2).
9. **What must never happen.** No dusk, fog, spa-light, or drama — **the second sun** (Experience Blueprint § 16). No pulsing, sweeping, or glowing light to draw attention. *Quieter is never darker* — a "wind-down" or evening theme breaks the one-morning law and must STOP (HOUSE1 § 6.4). Every value is the UI Architecture's (§ 7), entering by the § 2.4 path.

#### SPACE

1. **Architectural meaning.** Air is a **building material**, not leftover room — generous breathing space is the resting state of every room (Experience Blueprint § 8.2; Orchard House Design Blueprint § 3, *uncluttered planes*).
2. **Emotional purpose.** Space is the house's principal luxury and its calm made physical; it is what makes a room inhabitable rather than furnished to the walls (Experience Language Principle 8; UIA § 4, *whitespace as a material*).
3. **Interface behaviour.** When there is more to say, a surface **discloses it progressively** — it never crowds (Experience Architecture Principle 2; Orchard House Design Blueprint § 4). Content that will not fit with its air intact is too much for one surface, and is split, not compressed (UIA § 9).
4. **Layout.** One governed reading column, not content stretched to the viewport; cards as the unit of grouping, stacked in hierarchy order with generous gaps (UIA § 6). The extra width of a large screen becomes **air and view, never more widgets** (HOUSE1 § 19.3).
5. **Spacing.** All spacing comes from the one named scale; there is exactly one source and no private systems (UIA § 9). Breathing space is content's right — a surface that must remove it to fit has too much content (UIA § 9).
6. **Typography.** Type is set for breathing, not density — generous measure and leading; the house never shrinks type to fit more in, it discloses more instead (Orchard House Design Blueprint § 8; UIA § 8).
7. **Motion.** None of its own. Space is felt in stillness; it needs no animation to be present.
8. **Interaction.** Touch targets stay comfortable at every density; air around a control is part of its target and its calm (UIA § 9).
9. **What must never happen.** No cramming, no dashboards of tiles standing to attention, no "density as an accident of fitting more in." Removing breathing space to gain content is a governance failure, not a trade-off (UIA § 9). Space is spent as generosity, never sold for volume.

#### THRESHOLDS

1. **Architectural meaning.** The house is understood as a series of **thresholds to a landscape**, not a box of pages — Home is the threshold and the heart; every room is entered, and arrival precedes work everywhere (Experience Blueprint § 4; Experience Language Principles C, § 4A).
2. **Emotional purpose.** Crossing a threshold is being *welcomed and expected* before anything is asked — *arrival before information* (Experience Language Principle 1). The first feeling is arrival, never work.
3. **Interface behaviour.** Every surface **opens with a calm posture before its first task** — the session arrives at Home once; every room runs the same arrival in miniature (Experience Language § 5, the fractal rhythm; Experience Blueprint § 11). Entering a surface never greets the person with everything it contains.
4. **Layout.** The threshold is the top of the surface: identity and orientation first, the one door next, depth below and behind (HOUSE1 § 5). A doorway is the **one primary action** — exactly one per surface, always in the same place (Experience Architecture Principle 4; UIA § 5).
5. **Spacing.** The arrival is uncrowded — a name, a line, a door, with air around them; the threshold is the least dense moment of any surface (HOUSE1 § 2, § 16).
6. **Typography.** The threshold is the one place the **signature voice** may appear — THA's own hand, greeting or acknowledging, rationed to the arrival and named in the adoption register (UIA § 8; Experience Blueprint § 10). It is how the house says hello, never how it works.
7. **Motion.** Moving between rooms is **walking, not paging** — spatial continuity preserved so a route change feels like stepping through a doorway, not loading an unrelated document (Experience Language Principle D; UIA § 11). The transition is felt, never watched.
8. **Interaction.** The door is reachable and obvious; the welcome is a gift, never a gate — nothing modals, interrupts, or demands input before the arrival has landed (Experience Architecture Principle 8; HOUSE1 § 17).
9. **What must never happen.** No splash screen, loading theatre, or marketing hero standing between the person and the room (Experience Architecture Principle 8; HOUSE1 § 24). No task thrust forward before the welcome. The threshold is never a wall, a queue, or a sales pitch — *the application shell is constant*, and you are *in the house the moment you are in it* (Experience Language Principle E; HOUSE1 § 1).

#### ROOMS

1. **Architectural meaning.** THA is **one home, many places** — each domain a genuine room the household walks between, differentiated by exactly four things (purpose, light, material, one sign of life) and nothing else (Experience Blueprint § 4, § 5).
2. **Emotional purpose.** A house whose rooms are indistinguishable is a corridor; a house whose rooms fork the architecture is many apps. The rooms give each realm its own emotional job while keeping the household in **one continuous place** (Experience Blueprint § 5; Experience Language Principle B).
3. **Interface behaviour.** A realm expresses its character **entirely within its ground plane and the light that falls on it** — its purpose, its exposure level, its working-surface posture, its one Living Detail — and touches nothing else (Experience Blueprint § 5, § 8.1). Everything above and below the middle ground is constant.
4. **Layout.** Every room draws from the **same canonical page anatomy** — shell, orientation, one content column, cards (UIA § 6). A room is an *arrangement* of the shared anatomy for its purpose, never a new anatomy.
5. **Spacing.** Density is a per-room designed choice within the one density system and the one breakpoint truth — a working bench is denser than a window seat, but both speak the same spacing scale (UIA § 9; Experience Blueprint § 5.1).
6. **Typography.** Identical everywhere — the same type scale and three voices in every room (Experience Blueprint § 5.2; UIA § 8). A room never coins a typeface to feel like itself.
7. **Motion.** Identical everywhere — the one motion vocabulary; rooms never invent their own physics (Experience Blueprint § 5.2; UIA § 11).
8. **Interaction.** One interaction feel, product-wide — hover lifts, press seats, focus is the canonical ring, in every room (Experience Blueprint § 8.2).
9. **What must never happen.** **The costume** — a realm growing its own palette, component styling, decorative border, or motif to "feel like itself" (Experience Blueprint § 16). A room that must break a shared constant to feel like itself *has not been designed yet* (Experience Blueprint § 5.2). And if every room feels the same, there are no rooms at all — difference lives in the four governed ways, not in sameness or in forking.

#### WINDOWS

1. **Architectural meaning.** How much orchard a room admits, on the four-level **Orchard Exposure Scale** (E0–E3), obeying one inverse law: *exposure is inversely proportional to functional density* (Experience Blueprint § 6.2; Orchard House Design Blueprint § 10).
2. **Emotional purpose.** The window is the house *oriented toward* the orchard rather than containing it — the single most recognisable line of the architecture: a working surface with a view held at exactly the right size (Orchard House Design Blueprint § 3).
3. **Interface behaviour.** Each domain's exposure is a **per-domain constant**, set once by design and expressed as governed values in the one token source — never a per-surface or per-component choice, never adjusted for taste mid-feature (Experience Blueprint § 6.2, rule 1). An honestly empty working room may open its window **one level, never two**, and returns the instant content exists (rule 2).
4. **Layout.** The window is a **committed region the content deliberately does not cover** (E2), or illumination alone with the ground plane over most of the surface (E1), or the open view as part of the room's purpose (E3, Home only), or the warm canvas with no orchard image (E0). It is **framed by composition, never by a drawn frame** (Experience Blueprint § 6.2).
5. **Spacing.** The window earns its share of the frame by composition; content keeps its own share on solid ground. Emotional surfaces may spend more window; functional surfaces may not — a form never earns a view upgrade for looking plain (Experience Blueprint § 6.2, rule 3).
6. **Typography.** No type ever sits on the window — any surface where type must read gets ground plane under it, without negotiation (Experience Blueprint § 6.1).
7. **Motion.** The window never animates — no parallax, no depth-on-scroll, nothing game-like (Experience Blueprint § 6.1; § 16, *the rendered world*).
8. **Interaction.** The window is looked *through*, never *into* — it invites no exploration of itself; it is not a control (Orchard House Design Blueprint § 10).
9. **What must never happen.** **All view, no room** — a working surface that is mostly environment, a search box floating on a landscape (Experience Blueprint § 16). And the inverse, **wallpaper** — the orchard applied uniformly behind everything at one strength on one plane (§ 16). A window is a sized, composed, purpose-earned opening; never a backdrop and never a stage.

#### ORCHARD VIEWS

1. **Architectural meaning.** The orchard is THA's world — one canonical environment, one season, always present, mature and ancient, experienced through windows and never walked into (Experience Blueprint § 6, § 6.0, § 6.1).
2. **Emotional purpose.** The orchard **represents life** — bright, growing, in season, optimistic; never gloomy, misty, or melancholy. It is the living presence that keeps the calm from going cold (Experience Language § 3A.3; Experience Blueprint § 6).
3. **Interface behaviour.** One environment, one owner, one season, product-wide; realms get *how much* orchard, never *which* orchard (Experience Blueprint § 6.1). The orchard is a **governed visual concern** requiring one named canonical owner in the adoption register (§ 6.1; UIA § 17) — *open at adoption* (Experience Blueprint § 18.1).
4. **Layout.** The orchard is the **background ground** — behind everything, oriented-toward, never contained; every room faces it, no room holds it (Experience Blueprint § 8.1, § 6.1).
5. **Spacing.** Where the orchard is generous (E3), the working surface stays compact so the view keeps its share; where there is work, the orchard recedes to light alone and the ground plane takes the room (Experience Blueprint § 6.2).
6. **Typography.** The orchard **never carries text** — legibility is never traded for atmosphere (Experience Blueprint § 6.1).
7. **Motion.** The orchard **never animates** — no drifting mist, no swaying trees, no ambient motion. Place survives total stillness; its life is warmth and light, never movement (Experience Blueprint § 6.1).
8. **Interaction.** The orchard is not interactive — it is looked at, not used; the household is at home, not in a scene (Experience Blueprint § 16, *the rendered world*).
9. **What must never happen.** No autumn, dusk, bare branches, weathering, or a cycling calendar — the orchard is timelessly in leaf on one bright morning (Experience Blueprint § 6.0). No wallpaper, no text on the view, no animation, no exploration. *"Ancient" is settled fullness, never decay or a turning year* (Experience Blueprint § 6.0).

---

### 4.2 MATERIALS — what the house is built and furnished from

*(For every material below: the **direction** — the three grounds, the ground plane as the room's identity, air as a material, solidity following importance — is the Experience Blueprint's (§ 8) and the Orchard House Design Blueprint's design reading (§ 5); every **value** — radius law, shadow definition, surface tokens, spacing — is the UI Architecture's (§ 4, § 9, § 16). A material is translated as a **feeling produced by light and honesty**, never as an applied texture. Nothing here ships ahead of the § 2.4 path.)*

---

#### THE KITCHEN ISLAND

*(the primary working surface — the counter)*

1. **Architectural meaning.** The **middle ground**: the one warm working surface where the day's things are set down and the household gathers — the ground plane on which a room becomes itself (Experience Blueprint § 8.1; the counter of Home, HOUSE1 § 2, § 12).
2. **Emotional purpose.** *"Someone has already thought about dinner"* made physical — the prepared, honest surface that holds everything the product could hold on the household's behalf (Experience Language § 3A; Experience Blueprint § 1.2).
3. **Interface behaviour.** The primary content surface is **one solid, lit ground plane, never nested** (Experience Blueprint § 8.2). It carries the surface's orientation, its one primary action, and its working content, and it holds its share of the frame against the view.
4. **Layout.** The island is centred-low where a hand rests, meeting the view at one horizon; it is **compact where the view is part of the purpose** (Home, E3) and takes most of the frame where there is work (E1) (HOUSE1 § 2.2; Experience Blueprint § 5.1).
5. **Spacing.** Generous air on and around the island; when there is more to consider, the island **gives more room — it never crowds the work to fit** (HOUSE1 § 2.3; Experience Blueprint § 8.2).
6. **Typography.** All working type lives on the island's solid ground, in the working voice, at named scale roles (UIA § 8). Never on the view (Experience Blueprint § 6.1).
7. **Motion.** Still. The island does not move; content settles onto it once and rests (Experience Blueprint § 12.5, Living Details still; UIA § 11).
8. **Interaction.** The hand meets the island physically — hover lifts, press seats, focus rings — the one product-wide interaction feel (Experience Blueprint § 8.2).
9. **What must never happen.** **Never nested** — one ground per workspace (Experience Blueprint § 8.2). Never a grid of metric tiles standing to attention (a dashboard, Experience Language Principle G). Never a *drawn* island — no illustrated countertop; the surface is a real warm working plane, not a picture of one (Experience Blueprint § 16, *the theme park*).

#### OAK

1. **Architectural meaning.** The warm, honest, worked material of the primary working surface — oak worn smooth by use; the Kept Room's ground plane made its whole identity (ORCHARD3 § 5.1; Orchard House Design Blueprint § 5).
2. **Emotional purpose.** Warmth carried by *material*, not ornament — the warm-to-the-eye-and-by-implication-to-the-hand surface that makes a room feel kept rather than shipped (Orchard House Design Blueprint § 5, § 12).
3. **Interface behaviour.** The primary surface is **warm before it is anything else** — a warm ground in low morning light, never a white or cool canvas; if a surface feels cold, the fix is warmer light and honester material, never a decorative flourish (ORCHARD3 § 5.3; Orchard House Design Blueprint § 12).
4. **Layout.** Oak is the **solid, lit primary** — the surface with the most presence in the hierarchy, where the primary action stands (Experience Blueprint § 8.2, *solidity follows importance*).
5. **Spacing.** A warm surface reads as warm only with air to breathe — oak crowded to its edges reads busy, not kept (Experience Blueprint § 8.2).
6. **Typography.** The working voice sits on oak, calm and legible, *read never noticed* (Orchard House Design Blueprint § 8).
7. **Motion.** Still and warm; hover lifts it a half-step into the light (Experience Blueprint § 8.2).
8. **Interaction.** The most tactile surface — where the hand rests and the work happens; it answers physically and identically to every room (Experience Blueprint § 8.2).
9. **What must never happen.** **No painted wood-grain, no faux timber texture** — the warmth is carried by light and material honesty, never by an applied grain (Orchard House Design Blueprint § 3, § 9). A drawn oak texture is the theme park (Experience Blueprint § 16). Every warm value is the UI Architecture's (§ 4, § 7).

#### STONE

1. **Architectural meaning.** The solid, grounding, anchoring material — warm stone, the mass a room stands on; the anchored strata beneath the working surfaces (Experience Blueprint § 8.2; ORCHARD3 § 5.1, warm stone in the palette).
2. **Emotional purpose.** Solidity and trust — the sense that the room is on firm ground, that support is *anchored, never naked ink on the environment* (Experience Blueprint § 8.2).
3. **Interface behaviour.** **Solidity follows importance** — supporting surfaces sit lower and quieter than the primary, and **dense data never sits on landscape**; it is anchored to a ground (Experience Blueprint § 8.2). The material palette carries hierarchy so colour and motion need not (Orchard House Design Blueprint § 5).
4. **Layout.** Stone is the **anchored support tier** — the quieter surfaces beneath and beside the primary, holding secondary content in the penumbra (Experience Blueprint § 8.1; HOUSE1 § 4).
5. **Spacing.** Grounded and even; support strata are calm and unshowy, giving the primary room to lead (Experience Blueprint § 8.2).
6. **Typography.** Support type is quieter in weight and secondary in the hierarchy — weight is *hierarchy's quietest tool* (UIA § 8).
7. **Motion.** Still — the ground does not move; only what genuinely floats is elevated (Experience Blueprint § 8.1).
8. **Interaction.** Stable and calm under the hand; anchored surfaces do not lift as eagerly as the primary — solidity is felt (Experience Blueprint § 8.2).
9. **What must never happen.** **No cold, clinical stone** — no clinical white, no synthetic gloss; warmth is the material signature of the *whole* house, support included (Orchard House Design Blueprint § 5, § 12). No dense data floating on the view (Experience Blueprint § 8.2). No heavy drop-shadow pretending stone is a dramatic stage (Orchard House Design Blueprint § 9).

#### LINEN

1. **Architectural meaning.** The soft, textural, human material — unbleached linen; the quiet content that lies directly on the ground *like a note on a counter*; the most air in the house (Experience Blueprint § 8.2; ORCHARD3 § 5.1; the Diary's window seat, Experience Blueprint § 5.1).
2. **Emotional purpose.** Softness and human presence — the gentle, unhurried, breathable quality that keeps warmth from ever becoming hard or clinical (Experience Language § 3A.2; Orchard House Design Blueprint § 5).
3. **Interface behaviour.** The quietest content — a calm line, a note, a trace — **lies directly on the ground**, low and soft, below the emphasis budget; it appears only when there is something true to say and is **absent, and the room still complete, when there is not** (Experience Blueprint § 8.2, § 12.3; HOUSE1 § 2.3).
4. **Layout.** Linen is the **lowest, quietest content tier** — notes on the counter, never tiles on a wall (HOUSE1 § 2.3). It is the reflective, unhurried register (the Diary, the quiet corner).
5. **Spacing.** The most generous air of all — linen is *type set for breathing*, generous measure and leading, the resting state at its most spacious (Orchard House Design Blueprint § 8; Experience Blueprint § 8.2).
6. **Typography.** The humane reading voice — calm, legible, human; warmth in the *setting* (measure and leading), never in decorative letterforms (Orchard House Design Blueprint § 8).
7. **Motion.** Still. Its softness is texture and air, never animation (Experience Blueprint § 12.5).
8. **Interaction.** Lightly interactive at most — a note you can pick up; it never demands, never competes for the hand (Experience Blueprint § 12.4).
9. **What must never happen.** **No applied fabric texture, no illustrated weave** — softness is implied by light, air, and honest material, never painted on (Orchard House Design Blueprint § 3, § 9). No quiet content dressed up to compete with the primary (Experience Blueprint § 12.4). Softness never tips into twee.

#### HANDMADE CERAMICS

1. **Architectural meaning.** The individual objects a household picks up and sets down — matte ceramic in the palette; the recipe cards *as objects you pick up*, the discrete items of a collection, each honest and slightly its own (ORCHARD3 § 5.1; Cookbook, Experience Blueprint § 5.1).
2. **Emotional purpose.** The warmth and imperfection of things made by a hand and kept by a family — the *evidence of use* at the scale of a single object; calm because they are *right*, not because they are styled to be noticed (ORCHARD3 § 2.2, Vervoordt; § 2.2, "super normal").
3. **Interface behaviour.** The discrete unit — the **canonical card** — is one owned pattern used everywhere, never re-implemented per surface (UIA § 6, § 12; Principle 4). Each card differs only by the **true data it holds**, never by bespoke styling — its individuality is the household's real content, not applied variation.
4. **Layout.** Objects compose into the content column as cards in hierarchy order, grouped on the ground; a card is a thing you *pick up* — self-contained, honest, from the one material system (UIA § 6).
5. **Spacing.** Objects have room between them — a shelf of ceramics is not crammed; gaps come from the one spacing scale (UIA § 9).
6. **Typography.** Card titles use the display voice at a named role; card content the working voice — the same anatomy on every card, everywhere (UIA § 8, § 12).
7. **Motion.** A card lifts a half-step into the light on hover and seats on press — the one interaction feel; it never animates for attention (Experience Blueprint § 8.2; UIA § 11).
8. **Interaction.** Picked up and set down — hover, focus, press, all from the canonical state vocabulary, identical product-wide (UIA § 12).
9. **What must never happen.** **No two apples with different meanings** — one canonical apple mark, one rating semantics (UIA § 10). No bespoke per-surface card styling (a second owner, UIA Principle 4). No *drawn* ceramic, no skeuomorphic pot — the object is an honest interface unit, not a picture of pottery (Experience Blueprint § 16). Imperfection is carried by *real data*, never by faux distress.

#### SHELVING

1. **Architectural meaning.** The ordered strata a household stores and finds things on — the Pantry's shelf tiers; the strata of solidity from primary down to quiet content (Experience Blueprint § 5.1, § 8.2).
2. **Emotional purpose.** Legible order — the reassurance of knowing where things are and seeing them honestly, plainly, in their places (Experience Language § 5.6; the Pantry, Orchard Living Book, *The Pantry Shelves*).
3. **Interface behaviour.** Collections are **grouped and ordered by canonical status and true state**, told honestly — never invented fullness, never a warehouse (Experience Blueprint § 5.1; UIA § 14, status communication). Order reflects the owner's truth, never an optimistic pre-render (UIA § 14).
4. **Layout.** Shelving is the **strata of the middle ground** — tiers of grouped cards, solidity descending with importance; cards are the unit of grouping stacked in the column (UIA § 6; Experience Blueprint § 8.2).
5. **Spacing.** Tiers are evenly, calmly spaced from the one scale; a shelf is legible because it breathes, not because it is packed (UIA § 9).
6. **Typography.** Group headings in the section-title role; items in the working voice; the same anatomy on every shelf (UIA § 8).
7. **Motion.** Still; items settle into place once (UIA § 11). The one sanctioned per-item change — an item struck and settled into shade — is data-borne and calm, never a celebration (Experience Blueprint § 12.2, *the crossing-off*).
8. **Interaction.** Items are found, checked, and set — from the canonical state vocabulary; a shelf is scanned, not performed at (UIA § 12).
9. **What must never happen.** **No painted jars, no drawn produce, no fake fullness** — the shelf tells the plain truth of what is there (Experience Blueprint § 16; Orchard House Design Blueprint § 13.4). No status that shames; freshness is *helpful words, never guilt* (Experience Blueprint § 12.2). No shelf pretending to hold more than the data says (UIA § 14).

---

### 4.3 ATMOSPHERE — the quality of being in the house

---

#### QUIET CORNERS

1. **Architectural meaning.** The parts of the house that hold no task — the window seat, the calm corner you stand in doing nothing; **composed emptiness, never bare emptiness** (Orchard House Design Blueprint § 4; Orchard Living Book, *Quiet Moments*).
2. **Emotional purpose.** Stillness that is *warm rather than empty* — the deliberate quiet of a room someone keeps, not the emptiness of a room no one uses. This exact distinction is why the Kept Room was chosen over the cold Glass Pavilion (ORCHARD3 § 4.3, § 5).
3. **Interface behaviour.** The **empty and quiet states are primary, designed states — the warmest, not the coldest** (UIA § 7; § 12). When there is nothing worth saying, the surface **stays quiet and complete** — it does not invent content to fill itself (Experience Language § 3A.4; Experience Blueprint § 12.3).
4. **Layout.** The canonical empty state: at most a quiet mark, one honest sentence in the companion voice, at most one gentle action to the canonical place (UIA § 12). An honestly empty working room may open its window one level to breathe, and returns the moment content exists (Experience Blueprint § 6.2, rule 2).
5. **Spacing.** The most air of any state — a quiet corner is generous and unfilled *on purpose* (Orchard Living Book, *Quiet Moments*).
6. **Typography.** One honest sentence, plainly set — never a wall of apologetic text, never guilt (UIA § 12; Core Principle 6).
7. **Motion.** Still — a quiet corner is not dimmed, not animated to seem alive; *quieter is never darker* (Experience Language § 3A.4; Experience Blueprint § 16).
8. **Interaction.** At most one gentle action; a quiet corner asks nothing and pressures nothing (UIA § 12).
9. **What must never happen.** **Calm curdling into cold or lifeless** — the funeral parlour, the empty white room, the one thing THA must never be (Experience Language § 3A.1, § 3A.4). No filler, no fake content, no guilt, no dimming to signal "reflective." A quiet corner is *tended*, kept warm by the household's own presence (name, orchard, the friend in the chair — HOUSE1 § 15).

#### MORNING RHYTHM

1. **Architectural meaning.** Two joined truths: the house keeps **one unchanging morning**, and every experience moves through the six-beat **Experience Rhythm** — Arrival → Orientation → Confidence → Action → Understanding → Completion (Experience Blueprint § 7, § 11; Experience Language § 5).
2. **Emotional purpose.** A dependable cadence and a place that never changes under you — the calm of *one warm morning* the household returns to through every hour and season of their own life (Orchard Living Book, *How to read this book*; Orchard House Design Blueprint § 11).
3. **Interface behaviour.** A surface's "rhythm of the day" is carried **entirely by what is true right now — the household's data — never by the house's light, theme, palette, or mood** (HOUSE1 § 0.3, § 6.4). The interface reflects the hour by *saying the true and useful thing for it*, and by nothing else.
4. **Layout.** The six beats are the choreography of a surface: arrival at the top, orientation beneath, the one action in the light, understanding as the surface answers, completion with the calm centre one step away (Experience Blueprint § 11). The rhythm doubles as the diagnostic — when a surface feels wrong, walk the six beats and find the missing one (Experience Blueprint § 11).
5. **Spacing.** Arrival is the least dense beat; density rises only into the working beats and never crowds the arrival or the completion (HOUSE1 § 2; Experience Blueprint § 8.2).
6. **Typography.** The greeting word (morning/afternoon/evening) is a plain reading of the clock in the once-a-day greeting only; every later return is quieter and does not re-greet (HOUSE1 § 6.2, § 8).
7. **Motion.** The one sanctioned light *moment* is the arrival's, spent once; the rest of the day and every return have no light moment — the room is *simply, already, there* (HOUSE1 § 6, § 8, § 14).
8. **Interaction.** The one primary action is **re-aimed by relevance** across the day — *look at the week* in the morning, *start tonight's dinner* at the dinner hour — one door, chosen by the product for the hour, taken by the person (HOUSE1 § 6.2; Experience Architecture Principle 5).
9. **What must never happen.** **No evening theme, night mode as atmosphere, or dimmed dinner-hour palette** — that is the second sun, and it breaks the one-morning law; STOP (Experience Blueprint § 7, § 16; HOUSE1 § 6.4). Time shows through the household's *data*, never the house's *weather*.

#### PATINA

1. **Architectural meaning.** The warmth of a surface that has been *used* — the well-thumbed page, the counter worn smooth; the evidence a family lives here, which is the house's **only ornament** (Orchard House Design Blueprint § 4; Experience Blueprint § 12).
2. **Emotional purpose.** *Lived-in* — the single guard against calm going cold; the house is warm because it is *kept*, not because it was *dressed* (Orchard House Design Blueprint § 4, § 12; Experience Language § 3A.4).
3. **Interface behaviour.** Patina is the **Living Detail: always data-borne, honest in absence, below the emphasis budget, still, one per domain, admitted one at a time** (Experience Blueprint § 12.1). Every detail renders something *true* from a canonical owner — a half-step of warmth from real cook counts, the sun on today's real plan, freshness from real data.
4. **Layout.** A patina detail is subordinate — a half-step of surface warmth, never a badge, rank, border, or tile (Experience Blueprint § 12.2). It sits within the room, never competing with the primary.
5. **Spacing.** It changes nothing structural — its loss is felt only as a *slight cooling*, and that felt cooling is the test that it was working (Experience Blueprint § 12.4).
6. **Typography.** Copy, at most — helpful words from true data (e.g. freshness told kindly), never a decorative flourish or a numeral beyond what the knowledge supports (Experience Blueprint § 12.2; UIA § 14, no precision theatre).
7. **Motion.** **Still** — no Living Detail moves; life is warmth and evidence of use, not animation (the one exception being the Companion's arrival beat) (Experience Blueprint § 12.5).
8. **Interaction.** Usually none — patina is felt, not operated; it is removable without functional loss (Experience Blueprint § 12.4).
9. **What must never happen.** **Patina by paint, never by data** — no drawn crumb, faux worn edge, fake steam, applied distress, or decorative charm; a painted prop is *fabricated feeling, forbidden by construction* (Experience Blueprint § 12.2; Orchard House Design Blueprint § 3). Never a second detail in a room; never charm by the batch (Experience Blueprint § 12.1, § 16).

#### PERMANENCE

1. **Architectural meaning.** The house does not change under the household — one warm morning, one still orchard, one small palette, the same walls, forever; the **constant shell** is what makes many rooms one house (Experience Blueprint § 14; Orchard House Design Blueprint § 14; the permanence contract, HOUSE1 § 20).
2. **Emotional purpose.** Trust that compounds with constancy — the particular relief of a place that *kept*; the household relaxes because the house does not shift beneath them (Experience Language Principles 9, 11, E; Orchard Living Book, *Returning Home*).
3. **Interface behaviour.** The **shell is byte-identical everywhere and at every hour** — one frame, one header, one primary navigation, one way home, no exception claimed for emotional or experimental work (Experience Blueprint § 14; Experience Architecture § 8). Nothing rearranges itself to seem fresh between visits (HOUSE1 § 20).
4. **Layout.** The permanent anatomy never moves — a household that has used a surface once knows where everything is forever (HOUSE1 § 3; UIA § 6). Home is in the anchor position, reachable from everywhere, no dead ends (Experience Architecture § 8).
5. **Spacing.** The spacing, scale, and breakpoint truths are constant — the rhythm a returning household never has to relearn (UIA § 9).
6. **Typography.** The type scale and its voices are constant; the product a person used yesterday is recognisably the same today (UIA § 8; Principle 2, *beauty through consistency*).
7. **Motion.** The shell **never moves** or animates; permanence is stillness at the frame (Experience Blueprint § 14; HOUSE1 § 14).
8. **Interaction.** One interaction feel, product-wide and unchanging; returning is not re-orientation — there is nothing to relearn (Experience Blueprint § 8.2; Orchard Living Book, *Returning Home*).
9. **What must never happen.** **No trend, no re-skin, no fashionable redesign** — THA is built to look right in a decade, not fresh this quarter; a trend dates the product and spends the household's trust to look current (Orchard House Design Blueprint § 14). No exception to the shell's constancy for expressive work (Experience Blueprint § 14). Refinement *deepens* the same house; it never replaces it (Orchard House Design Blueprint § 14.3).

#### CALM

1. **Architectural meaning.** The house's resting temperature — carried by air, restraint, and one primary action; *calm before capability* (Orchard House Design Blueprint § 12; Experience Architecture Principle 3).
2. **Emotional purpose.** The household leaves *calmer than they came* — the North Star's test of every visit (Experience Blueprint § 17; Experience Language § 3).
3. **Interface behaviour.** Each surface asks for **one thing at a time** and leaves the rest as composed space (Orchard House Design Blueprint § 12; Experience Architecture Principle 4). A two-second glance yields orientation, state, and the one primary action — never decoration, promotion, or noise (UIA § 5, the two-second rule).
4. **Layout.** Prominence descends in the experience order; exactly one primary-styled action per surface; nothing below out-shouts what is above (UIA § 5). Calm *is* the layout, not a coat applied to it.
5. **Spacing.** Calm is mostly space — the emphasis budget is spent on a few elements and *withheld* from everything else (UIA § 3, § 9).
6. **Typography.** One hierarchy, quiet weights, no shouting in bold; the working voice *read, never noticed* (UIA § 8; Orchard House Design Blueprint § 8).
7. **Motion.** Quiet by default — nothing moves, pulses, glows, or loops for attention; motion is spent only on what genuinely needs it now (UIA § 11; Experience Language Principle 2).
8. **Interaction.** Attention is *borrowed, never taken* — nothing interrupts, and motion yields instantly to intent (Experience Architecture Principle 8; Experience Language Principle 12).
9. **What must never happen.** **Calm must never become lifeless** — cold, clinical, empty, sterile, funeral-parlour still (Experience Language § 3A.4, § 3A.1). No manufactured urgency, no countdown theatre, no red for the merely unfinished (UIA § 14). Calm is the calm of *a kitchen at the good hour*, never of an empty white room (ORCHARD3 § 1.2).

#### WARMTH

1. **Architectural meaning.** The constant temperature of every material and every light in the house — carried by **light and material, never by ornament** (Orchard House Design Blueprint § 12; Experience Language § 3A.2).
2. **Emotional purpose.** *A warm, lived-in home where someone has already thought about dinner* — the one sentence the whole product serves (Experience Language § 3A; Experience Blueprint § 1.1).
3. **Interface behaviour.** The default of every surface is **warm** — a warm ground in warm morning light; there is **no cold surface, no clinical white, no synthetic gloss anywhere** in the palette (Orchard House Design Blueprint § 5, § 12). If a surface feels cold, the fix is warmer light and honester material, never a decorative flourish (ORCHARD3 § 5.3).
4. **Layout.** Warmth is not a region — it is the whole ground; every plane, primary to quiet, is warm (Orchard House Design Blueprint § 5).
5. **Spacing.** Generous air is part of warmth — a crowded surface reads busy and cools; breathing room is inhabited warmth (Experience Blueprint § 8.2).
6. **Typography.** Warmth in the *setting* — generous measure and leading, human and legible — never in decorative or novelty letterforms (Orchard House Design Blueprint § 8).
7. **Motion.** Warmth is carried by warm light on warm material at rest, never by animation; the arrival's single light moment is the only sanctioned warm *motion* (Experience Blueprint § 7).
8. **Interaction.** The hand meets warm, honest surfaces that answer softly and identically everywhere (Experience Blueprint § 8.2).
9. **What must never happen.** **Warmth must never become decoration** — no applied friendliness, no decorative flourish, no dressing a surface to *seem* warm (Orchard House Design Blueprint § 12; Experience Language § 7). And warmth must never be *over-served* into heavy, twee, or rustic — the discipline is warm *minimalism* (ORCHARD3 § 4.3). Every warm value is the UI Architecture's (§ 7).

---

### 4.4 PEOPLE — who is present in the house

---

#### HOUSEHOLD PRESENCE

1. **Architectural meaning.** The household's own life is the **only ornament** of the house — evidence that *this* family lives here, shown through their real data; the household is always the most present thing in the room (Orchard House Design Blueprint § 4; Experience Blueprint § 12; the Orchard Promise, Orchard Living Book).
2. **Emotional purpose.** *People before data* — the family is always the subject; the technology and the design both quietly disappear so the household remains (Experience Blueprint § 1.5; Orchard House Design Blueprint § 1.2).
3. **Interface behaviour.** The household appears as **first-class truth from canonical owners** — their name in the greeting, their plan, their pantry, their history — never as fabricated content and never reduced to fields on a settings screen (Experience Blueprint § 12; Orchard House Design Blueprint § 13.7). People are rendered *first-class* (avatars, names) from real membership, no album theming.
4. **Layout.** The household's presence leads the hierarchy where it belongs — the greeting is the single warmest, most human mark; the family is a record of *people*, not a form (HOUSE1 § 4; Orchard House Design Blueprint § 13.7).
5. **Spacing.** Their presence is given room to be the subject — never crowded by product furniture (Experience Blueprint § 8.2).
6. **Typography.** The signature voice — THA's own hand — is spent on the household at the one moment it says hello, and rationed (Experience Blueprint § 10; UIA § 8).
7. **Motion.** Still — the household's life shows through data, never through animation (Experience Blueprint § 12.5).
8. **Interaction.** The product **orients; the person chooses** — it decides the most useful next step and offers it, and never takes the step for the household (Experience Architecture Principle 5).
9. **What must never happen.** **Never dashboard furniture** in place of the household — no scores as trophies, streaks, notification piles, guilt, or "you haven't…" (Experience Blueprint § 16; HOUSE1 § 5.3). Never fabricated warmth standing in for real presence (Experience Blueprint § 12). Never making a person feel *less capable in their own kitchen* (the Orchard Promise, Orchard Living Book). The household is the subject; the software never is.

#### COMPANION PRESENCE

1. **Architectural meaning.** The **person in the house** — the knowledgeable friend at the kitchen counter; a *presence, not a room*; one fixed chair, comfortable in every room, never following the household around (Experience Blueprint § 13).
2. **Emotional purpose.** *Present, never pushy* — quiet competence on the household's side; its finest hour is the one where you forget it is software at all (Experience Language Principle 7, § 5.7; Orchard Living Book, *Cooking Together*).
3. **Interface behaviour.** **Invited, not intrusive; suggesting, never deciding; honest about its limits; silence a valid state.** It speaks only when there is something worth saying, offers once, and puts back the attention it borrowed (Experience Architecture § 11; Experience Language § 5.7). Its conduct and knowledge are owned by the Intelligence Governance documents (Experience Blueprint § 13); this document translates only its *presence*.
4. **Layout.** **One presence, one fixed chair** — the same position in every room, foreground, so the household never hunts for it. It is *in* the rooms, never a room (Experience Blueprint § 13; HOUSE1 § 9).
5. **Spacing.** Foreground and unobtrusive — it holds the house's warmth, not a view or a stage of its own, and never crowds the room's primary work (Experience Blueprint § 8.1, § 13).
6. **Typography.** The companion voice — plain, low, human; one honest sentence when something genuinely needs the household, never theatrics (UIA § 12, the empty-state/companion voice; Experience Architecture § 11).
7. **Motion.** **It arrives a beat after you** — manners rendered as timing; that beat is its *entire* sign of life. No pulse, no typing dots, no face, no simulated mood (Experience Blueprint § 12.2, § 13; UIA § 10).
8. **Interaction.** It waits; it is queried, not broadcast; it discovers and refers to canonical places rather than duplicating them; the household's choice always stays theirs (Experience Architecture § 11; Experience Blueprint § 13).
9. **What must never happen.** **No face, no fake avatar's gaze, no emotional theatrics, no pulsing or typing performance** (UIA § 10; Experience Blueprint § 13). Never greet *before* the house has; never follow the household room to room; never open a return with everything that happened while they were out; never be lit differently from the room so it becomes a stage (Experience Blueprint § 13; HOUSE1 § 9). It is a friend at the counter, never a chatbot performing presence.

---

## 5. THE GOVERNING UI TRANSLATION PRINCIPLES

The translations in § 4 answer *what each thing becomes*. These principles answer the harder question — *what to do when two correct translations pull against each other, or when a characteristic the table does not name must be translated fresh.* They are **ordering laws**: each names what wins when two goods compete. They are the applied, interface-facing reading of the Technology Principle (Experience Blueprint § 1.5) and the design laws of the Orchard House Design Blueprint (§ 1.2, § 4, § 12), owned here only as the *order of translation*; each routes to an owner and legislates no new value.

> **1 — Space before decoration.** When a surface could hold more or breathe more, it breathes. Air is a material and the resting state of every room; anything decorative yields to it first. *(Experience Blueprint § 8.2; UIA § 9.)*
>
> **2 — Light before colour.** Hierarchy, warmth, and emphasis are carried by light and material before they are ever carried by a hue. If a heavier border and a shift in illumination both express a thing, the house uses illumination. Saturated colour is spent last and sparingly. *(Experience Blueprint § 7; Orchard House Design Blueprint § 6, § 7; UIA § 5.)*
>
> **3 — Materials before effects.** Warmth, depth, and character come from honest materials in honest light — never from an applied texture, gloss, gradient-for-its-own-sake, or filter. A surface is what it appears to be; nothing is faux. *(Orchard House Design Blueprint § 3, § 9; UIA § 14.)*
>
> **4 — Depth before shadows.** Depth means *distance* — three grounds, elevation reserved for what genuinely floats — not a drop-shadow applied for drama. One family of soft, warm, single-direction shadow, and no more. *(Experience Blueprint § 8.1; Orchard House Design Blueprint § 9.)*
>
> **5 — Calm before information.** Orientation, then state, then one action — and everything deeper *disclosed on request*, never displayed at arrival. A calm surface that says less, truly, beats a complete one that says everything. *(Experience Architecture Principles 2, 3; Experience Language Principle 1; UIA § 5.)*
>
> **6 — Household before technology.** When the product's cleverness and the family's presence compete for the surface, the family wins. Technology supports the experience and never becomes it. *(Experience Blueprint § 1.5; Orchard House Design Blueprint § 1.2.)*
>
> **7 — People before data.** A person is never reduced to fields, scores, or a dashboard about themselves. The household is the subject; their data is how the house serves them, never what it displays them as. *(Experience Language Principle G; Orchard House Design Blueprint § 13.7; Experience Blueprint § 16.)*
>
> **8 — Truth before charm.** Every warm thing is *true* — data-borne, honest in absence — before it is ever charming. A painted prop is fabricated feeling, forbidden by construction; charm that must invent content to exist is filler. *(Experience Blueprint § 12; UIA § 14, Visual Trust.)*
>
> **9 — Restraint before expression.** When restraint and expression tie, restraint wins; when a technique is *current* rather than *serving the household*, it does not enter the house. Built to look right in a decade, not fresh this quarter. *(Orchard House Design Blueprint § 14; Experience Language Principle H; Experience Blueprint § 17.)*

And the two the whole document exists to protect, stated last because every principle above serves them (Experience Blueprint § 1.5):

> **Technology should quietly disappear.** The best surface — like the best material and the best light — is one the household *feels and cannot name*. A surface that shows off its own cleverness has made the tool the subject and pushed the family into the background. In THA the tool is invisible and the work is done. *(Experience Blueprint § 1.5; Orchard House Design Blueprint § 1.2; § 17, "noticed the product not at all.")*
>
> **The household should always feel present.** Through every translation, the family is the most present thing in the room — their name, their plan, their pantry, their real life showing warmly through the surface. If a translation leaves the household less present than the product, the translation is wrong, however correct each part of it was. *(Experience Blueprint § 1.5; § 12; the Orchard Promise, Orchard Living Book.)*

> **The one line to settle any translation:** *build the working surface first and honestly; carry its warmth in light and material; let in exactly the right amount of orchard; decorate it only with the household's real life — and then take the design, like the technology, quietly out of the way.*

## 6. THE COMPLETE VISUAL LANGUAGE OF THE HEALTHY APPLES

*(The whole house as one interface identity, described without reference to any individual screen — because the visual language is the sensibility every screen inherits, not any screen itself. This is a **synthesis of owned rules**, cited, not a new specification: every value remains the UI Architecture's, and this section changes no visual law.)*

The Healthy Apples looks and feels like **a warm room someone keeps, on one unchanging morning, with an ancient orchard held at the window and the household the most present thing in it** (ORCHARD3 § 6). Stated whole, as one language:

- **It is warm before it is anything else.** The ground of every surface is a warm, hand-finished-feeling plane in low morning light — never a white or cool canvas, never a clinical surface, never a synthetic gloss. Warmth is the temperature of the whole house, carried by light and material, and it is the first thing every surface must get right (Orchard House Design Blueprint § 5, § 12; Experience Language § 3A).

- **It is lit by one morning, forever.** One soft sun from the upper-left, one warm hour, in every room; every shadow agrees on one direction. Rooms differ by how much of that morning their window admits, never by the hour or the mood. There is no dusk, no night-as-atmosphere, no drama — every room is a morning room (Experience Blueprint § 7; Orchard House Design Blueprint § 6).

- **It is one green voice and one warm accent, spent sparingly.** A single muted natural green marks primacy and the brand's presence; a single amber-gold accent carries warmth as an accent, never a second voice or an alarm. Most of the house is warm neutral ground; saturated colour is spent last, meaningfully, and never for energy or brand presence. Status colour is honest and reserved — success, warning, danger, information, each with one meaning, always paired with words or an icon, never decorating (UIA § 7, § 14).

- **It speaks one quiet, human, legible voice.** A working typeface *read, never noticed*, carrying the whole product; a display voice for identity moments; and THA's own signature hand, rationed to the single moment the house says hello and forbidden in all functional UI. Type is set for breathing — generous measure and leading — never crowded to fit; when there is more to say, the house discloses it, it does not shrink (UIA § 8; Orchard House Design Blueprint § 8; Experience Blueprint § 10).

- **It is built from three grounds, and only the middle one varies.** The world behind (the orchard and its daylight, constant), the room in the middle (the warm working ground plane and its surfaces — the *only* layer that changes from room to room), and what floats in front (overlays and the Companion, constant). This is the whole mechanism by which THA is many particular places and one coherent home (Experience Blueprint § 8.1).

- **Its depth is soft, warm, and shallow.** The depth of a well-lit room, never a dramatic stage. Elevation is reserved for what genuinely floats; the working surfaces sit calmly in the room's light under one family of soft, warm, single-direction shadow. No parallax, no game-like layering, no deep drop-shadows for effect (Experience Blueprint § 8.1; Orchard House Design Blueprint § 9).

- **Its space is generous on principle.** Air is a building material and the resting state of every surface. The interface is mostly calm space; density is a designed, governed choice, never the accident of cramming; a larger screen becomes more air and more view, never more widgets (UIA § 4, § 9; Experience Blueprint § 8.2).

- **It is oriented toward an ancient orchard it never contains.** The orchard — bright, growing, in season, mature, still — is present at every surface's purpose-sized window, from the open view where looking is the point down to warm light alone where there is work. It never becomes wallpaper, never carries text, never animates, and is never walked into. It is the living presence that keeps the calm from ever going cold (Experience Blueprint § 6; Experience Language § 3A.3).

- **It is decorated by exactly one thing: the household's real life.** The only ornament anywhere in the language is the evidence that this family lives here — always true, always data-borne, honest in its absence, below the emphasis budget, still. Never a painted prop, never applied charm, never fabricated feeling (Experience Blueprint § 12; Orchard House Design Blueprint § 4).

- **It moves almost never, and only to mean something.** Motion confirms a state change, preserves the continuity of walking between rooms, or carries one of the few genuine brand moments — the morning light settling on arrival, the Companion arriving a beat behind. The orchard is still, the light does not sweep, Living Details do not animate, the shell never moves. If the person notices the animation before the content, it has failed (UIA § 11; Experience Language Principles 4, 12, H).

- **It answers the hand identically everywhere.** Hover lifts a surface a half-step into the light; press seats it; focus is the one canonical ring. One interaction feel, product-wide; rooms never invent their own physics. Depth is something the household feels through their pointer far more than something they see (Experience Blueprint § 8.2; UIA § 12).

- **It is framed by walls that never change.** One shell, one header, one navigation, one way home — byte-identical in every room and at every hour, the constant frame that makes many rooms one house and lets the household relax into a place they already know (Experience Blueprint § 14; UIA § 6).

- **It is honest in everything it shows.** Nothing looks more certain, complete, urgent, or alive than the truth behind it. Assertions offer their evidence; confidence is styled exactly as strong as it is; uncertainty renders as honest absence, never disguised. Empty, loading, and error are designed, calm, first-class states — never blank, never fake, never guilt (UIA § 7, § 8, § 14).

- **It is timeless, not fashionable.** It follows no UI trend, because a trend is design calling attention to itself as current — the one thing this language forbids. It is built to look right in a decade and to *deepen* into more of itself rather than be re-skinned to look new (Orchard House Design Blueprint § 14).

- **And through all of it, the technology disappears and the household remains.** The design, like the technology it carries, is felt and cannot be named. What a person is left holding is never a screen or an effect but a feeling: *that was calm, that was warm, they had already thought about us.* A household should end every visit having thought about food a little less, trusted it a little more, and noticed the product not at all (Experience Blueprint § 1.5, § 17).

> **The visual language, in one line:** *The Healthy Apples is warm morning light on honest material, generous with air, oriented to an ancient orchard, decorated only by a family's real life, framed by walls that never change — a modern home in an ancient orchard, where technology quietly supports timeless family life* (Experience Blueprint § 17).

## 7. GOVERNANCE AND ADMISSION

### 7.1 This document is a canonical translation guide

It is the governing bridge between the Orchard House architecture and the interface — required reading before any user-facing implementation, so that what is built is the *house translated*, not a new thing wearing its words. It is indexed in the Architecture Bootstrap (`docs/architecture/README.md`) under Experience Governance, beside the documents it translates. It adds **no new gate**; the existing gates (§ 2.5) verify every translation, read against this dictionary.

### 7.2 Change enters by governance, never by shipping

A new characteristic translation, a change to an existing one, or a new governing UI translation principle is admitted the way any governing statement is — named, checked for conflict against this document and its governors, and added deliberately. A build that quietly assumes a translation this document does not carry is a defect regardless of its quality — the translation is *discovered here first*, then built.

### 7.3 One rule, one owner, forever — the yield clause

- If any statement in this document is found to duplicate a rule owned elsewhere, **the statement here is the defect** and is corrected to a citation. This document owns the *translation*, never the rule being translated.
- If a translation owned here later earns a fuller governing home — most importantly, when **the Kept Room graduates into the UI Architecture / Orchard House Design Blueprint by amendment** and the depth/light/material vocabulary is admitted by the UIA § 4 amendment — this document yields the relevant translation in the same change and cites the new owner. One owner per rule survives every migration (Experience Blueprint § 18).

### 7.4 This document jumps no governance path

Every material, light, and depth translation in § 4 ships only through the path the Experience Blueprint fixed (§ 2.4 here; Experience Blueprint § 2.4; Orchard House Design Blueprint § 2.4): the Kept Room's graduation by amendment, the UIA § 4 amendment, tokens by admission, and one Living Detail at a time. Its vivid translations change no visual law and ship no pixel ahead of that path.

### 7.5 Open items inherited, not re-opened

The four open items the Experience Blueprint named (§ 18 there) — the orchard's canonical owner, Home's header, the pending UIA § 4 amendment, and dark mode — remain the Blueprint's to close. This document creates no new open item; it depends on all four being resolved before its § 4 material/light/depth translations can ship, and on the Kept Room's own graduation before any of it becomes binding visual law.

---

*A canonical translation guide — the bridge between the Orchard House architecture and the software interface, translating the Experience Blueprint (the place), the Orchard House Design Blueprint (the design language), and the Orchard Living Book (the lived account) into interface terms, in the adopted Kept Room sensibility (ORCHARD3 § 5).*
*It owns only the translation itself; it restates no rule, sets no value, adds no gate, and jumps no governance path. Subordinate to the Experience Blueprint (and, through it, the Experience Architecture, which prevails in any conflict); a non-overriding sibling of the UI Architecture (the binding look), the Experience Language (the feeling), and the two blueprints and the living book it translates.*
*Rollback: this document is new and uncommitted — to revert entirely, delete the file. Rollback tag for the TRANSLATION1 workstream: `rollback/TRANSLATION1-the-kept-room-into-ui-language-20260715` → `b3c650cd`.*
