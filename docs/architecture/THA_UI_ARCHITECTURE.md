# THA UI Architecture — Governing Document

**Status:** GOVERNING ARCHITECTURE — required reading before any user-facing visual or presentation work
**Classification:** Experience Governance (canonical)
**Adopted:** 2026-07-10 (UIA2), from the approved discovery [`UIA1_UI_ARCHITECTURE_DISCOVERY.md`](../investigations/ux/UIA1_UI_ARCHITECTURE_DISCOVERY.md)
**Governed by:** [`THA_EXPERIENCE_ARCHITECTURE.md`](./THA_EXPERIENCE_ARCHITECTURE.md) (EXP1) — **where this document and the Experience Architecture conflict, the Experience Architecture wins**
**Governing documents:** [`ARCHITECTURE_PRINCIPLES.md`](./ARCHITECTURE_PRINCIPLES.md), [`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`](./THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md), [`ENGINEERING_WORKFLOW.md`](./ENGINEERING_WORKFLOW.md)
**Related experience principles:** [`INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md`](./INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md), [`THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md`](./THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md)
**Adjacent, non-overlapping:** [`THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`](./THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md) — it owns *what a surface is*; this document owns *how it looks* (§ 2.1)
**Enforced by:** the **UI Governance Checklist** (§ 18), mandatory for every user-facing implementation via the Experience & UI Governance Compliance block in [`ENGINEERING_WORKFLOW.md`](./ENGINEERING_WORKFLOW.md)

> **What this document is.** The visual constitution of The Healthy Apples. The Experience Architecture governs how THA must *behave and feel*; this document governs how that feeling must *look*. It expands the Experience Architecture's principles into visual law — one visual language, one hierarchy of emphasis, one owner per visual concern — while remaining strictly subordinate to it. It is timeless, framework-independent, and implementation-independent: it never names a technology, library, component file, or pixel framework. Implementations change; this document does not change with them. Every future UI decision is made under this document; a design that conflicts with it must **STOP, explain why, and not continue until approved**.

---

## 1. PURPOSE OF UI ARCHITECTURE

The Experience Architecture deliberately disclaims the visual layer: colours, typography, spacing, and components are declared implementation-level. History shows what happens in that vacuum — visual foundations are authored, partially adopted, never retired, and the product slowly diverges into competing greens, competing headers, competing states. The discovery (UIA1) established that THA's visual problem has never been bad design; it is **ungoverned convergence**.

UI Architecture exists to close that gap with law rather than another foundation:

- **It governs the look.** How THA's calm, honest character is expressed visually: language, hierarchy, layout, colour, type, spacing, imagery, motion, and state.
- **It governs ownership.** Every visual concern has exactly one canonical owner, and successors retire their predecessors.
- **It governs admission.** New visual patterns, tokens, and building blocks enter through this document's governance, not by accretion.

It is deliberately **not**:

- a behaviour or journey specification (that is the Experience Architecture, which this document may never contradict);
- a component library, token file, or style sheet (implementations *satisfy* this document; they are pointed to, never embedded);
- a redesign mandate (the visual language it adopts already exists and was judged coherent; the debt is codification and convergence, not invention).

## 2. RELATIONSHIP TO THE EXPERIENCE ARCHITECTURE

> **The Experience Architecture governs behaviour. The UI Architecture governs presentation. Where any conflict exists, the Experience Architecture takes precedence.**

The two documents divide the experience cleanly:

| Question | Owner |
|---|---|
| What may interrupt a person, and when? | Experience Architecture |
| How does an interruption look when permitted? | **UI Architecture** |
| What is the one primary action of a surface? | Experience Architecture |
| How is the primary action visually distinguished? | **UI Architecture** |
| What must an error say, and where may a journey go? | Experience Architecture |
| How does an error state look, and with what colour and weight? | **UI Architecture** |
| What may never be fabricated? | Experience Architecture (with the Core Principles) |
| How are evidence, confidence, and uncertainty rendered? | **UI Architecture** |

Every section of this document elaborates a named Experience principle into visual terms; none introduces behaviour. Like the Experience Architecture, this document consumes and never owns: no visual surface owns a fact, an entity, or a decision — it renders canonical truth from its single owner and renders honest absence where truth is absent (Core Principle 6). If a visual decision would require changing behaviour, journeys, data ownership, or intelligence conduct, it is not a UI decision — it must be taken to the owning architecture.

### 2.1 Relationship to the Product Knowledge Registry

The [`THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`](./THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md) (`PKR1`/`PKR2`) owns **what THA is** — which surfaces exist, what each is for, and who may be told about them. This document owns **how they look**. The two never overlap, and the boundary is stated here because there is one place they touch closely and one place they could quietly collide.

**Where they touch — the Screenshot Library.** The registry owns *which screenshots exist, what each depicts, and which surface each is the canonical image of.* This document owns *whether the screenshot is any good* — whether the surface it depicts obeys Calm Orchard, the hierarchy, and the state law. The registry never judges a design; this document never keeps a list of images. Photography and imagery *style* is § 10 of this document; the *inventory* of images is the registry's (`PKR1` § 4.5).

**Where they could collide — two things called a register.** This document mandates an **adoption register** (§ 17); the platform now also has a **Product Knowledge Registry**. They enumerate different facts about the same surfaces, and neither may drift into the other:

| | UI adoption register (§ 17) | Product Knowledge Registry (`PKR1`) |
|---|---|---|
| **Answers** | Which surfaces have adopted which canonical visual pattern — and which are exempt, and why | Which surfaces **exist**, what each is **for**, and who may be **told** about them |
| **Fact it owns** | Visual convergence and its exemptions | Product knowledge — purpose, ownership, visibility |
| **Nature** | **Operational** — it lives beside the implementation and tracks migration debt | **Knowledge** — a canonical, permanently maintained knowledge domain (`PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` § 9) |
| **Lifespan** | A register entry is *closed* when the last consumer migrates and the predecessor is deleted | A registry entry lives as long as the thing it describes, and is corrected, never superseded |

> **Rule: neither register restates the other.** The adoption register never records what a surface is *for* — it points at the registry entry. The Product Knowledge Registry never records which visual pattern a surface uses, whether it has migrated, or whether it is visually exempt — that is implementation state, and a registry that tracked it would become a second source of migration truth that no correction could safely fix. A surface appears in both, describing two different facts, owned in two different places.

**Precedence.** Where this document and the registry conflict about how a surface *looks*, this document wins. Where they conflict about what a surface *is*, the registry wins. Where either conflicts with the Experience Architecture, **the Experience Architecture wins** and both are corrected (§ 2).

## 3. UI PRINCIPLES

These principles have the same standing for presentation that the eight Experience Principles have for behaviour. Every subsequent section elaborates one or more of them.

> **UI Principle 1 — One visual language.** THA speaks exactly one visual language, everywhere. No surface, feature, or campaign introduces a second identity.
>
> **UI Principle 2 — Beauty through consistency.** THA's beauty is the beauty of rhythm and restraint: the same anatomy, the same scale, the same voice, surface after surface. Novelty is never a design goal; recognition is.
>
> **UI Principle 3 — Emphasis is a budget.** Colour, weight, size, and motion are spent, not sprinkled. Each surface spends them on its few most important elements and deliberately withholds them from everything else.
>
> **UI Principle 4 — One canonical owner for every visual concern.** Every visual concern — a header, a card, a rating mark, a state presentation — has exactly one owning pattern. Every other occurrence uses that owner; none re-implements it.
>
> **UI Principle 5 — Retire on introduction.** A successor pattern may only be introduced together with the plan that retires its predecessor. Two owners of one concern is a failure state, however temporary it is claimed to be.
>
> **UI Principle 6 — Semantic before literal.** Surfaces express *meaning* ("success", "muted", "card surface"), never raw values. Meaning is named once and resolved to values in one place, so themes, modes, and densities are value sets — never rewrites.
>
> **UI Principle 7 — Every state is designed.** Empty, loading, error, and disabled are first-class designed states with canonical presentations — never afterthoughts, never blank, never improvised per surface.
>
> **UI Principle 8 — Visual honesty.** The interface never looks more certain, more complete, more urgent, or more alive than the truth behind it. Confidence, evidence, and uncertainty are rendered exactly as strong as they are.

## 4. THE VISUAL LANGUAGE — CALM ORCHARD

THA officially adopts **Calm Orchard** as its governing **Visual Language** (the canonical term; the discovery's "design language" is the same concept, renamed here once and finally). Calm Orchard is the canonical visual identity of The Healthy Apples: the single voice in which every surface, document, and image speaks.

Calm Orchard is defined by its character, not by its current values:

- **A warm, light, natural canvas.** The product feels like daylight in a kitchen: warm neutrals, generous whitespace, an atmosphere of unhurried order. Never clinical white, never dark-and-dramatic by default.
- **One green voice.** A single muted, natural green is the brand's voice — the colour of the primary action and the brand's presence. There is exactly one "THA green"; no neighbouring greens compete with it.
- **One warm accent.** A single warm amber-gold accent provides the language's warmth. It is an accent, not a second voice: used sparingly, never as ambient decoration, and never doubling as an alarm colour.
- **Calm surfaces, on a ground, in one light.** Content sits on soft cards, and those cards rest on a warm ground — never directly on the environment. Depth is shallow, warm, and single-directional: a shadow's whole job is to say how far one surface sits above another. No skeuomorphic depth, no drama, no stage. Elevation remains reserved for what genuinely floats above the page (overlays), so that when depth appears, it means something. The vocabulary this permits is named and bounded below.
- **Realm tinting as orientation.** Each realm of the product (cooking, planning, shopping, and their peers) may carry a quiet identifying tint — a whisper of place that aids orientation. Realm colour is *wayfinding only*: never emphasis, never status, never a second palette inside content.
- **Whitespace as a material.** Space is the language's principal luxury. Density is a designed, governed choice (§ 9), never the accident of cramming.
- **Quiet by default.** Nothing moves, pulses, glows, or saturates without a reason the person would recognise as their own.

Calm Orchard renders **one room, in one light, at one hour**. Its depth and light vocabulary admits **four members, and no more** — each of which describes space; none of which decorates it:

| Member | What it is | Where it may appear |
|---|---|---|
| **The ground plane** | The prepared warm surface a workspace rests on — the room's identity, made material | **One per workspace, never nested.** Any type that must be read legibly gets ground beneath it, without negotiation |
| **One light** | A single product-wide light: one direction, one hour, a perpetual bright morning | Every shadow in the product agrees with it. No surface lights itself; no room keeps its own hour |
| **Warm shadow** | Distance made visible. Its hue is drawn from the room's warm foreground — never black, never grey | Wherever a surface genuinely sits above another, at the strength that distance warrants — never more |
| **The penumbra** | Hierarchy carried by light: the primary stands in the light, support waits in the penumbra, quiet content sits in the shade | Wherever § 5's order is better served by light than by spending colour |

**Depth is a description of space, not a material of its own.** The vocabulary is admitted under one condition and constrained by three prohibitions:

- **It is admitted to describe space.** A ground, a shadow, or a fall of light is lawful exactly when it answers *how far apart are these things* or *what matters here*. Depth that answers neither is decoration — and decoration is what this section has forbidden since the day it was written.
- **It never carries meaning that colour, weight, or words should carry.** Depth is not status, not urgency, not emphasis, and never a second hierarchy competing with § 5. Light demotes; it never alarms.
- **It never becomes a scene.** No parallax, no ambient life, no drifting, no gloss, no glassmorphism, no stage. The person is at home, not inside a rendering. § 11 is unchanged and unbent: this vocabulary is admitted **still**.
- **Its values are tokens, never surface choices.** The four names above are admitted here; every value that resolves them lives in the one definition source and enters by admission (§ 16, § 17). A hand-picked shadow on a surface is a defect exactly as a hand-picked colour is (§ 7).

**Radius descends with resting.** Curvature is how a surface says what it is lying on, so it is governed rather than chosen: **a surface takes the radius step below whatever it rests on** — ground, then what sits on the ground, then what sits on that — from a small named ladder in the one definition source, never an arbitrary value. Two surfaces at the same radius read as the same plane, and a surface curved *more* than its container reads as a mistake the eye notices before the mind does. Depth is limited to those three steps by *one ground per workspace, never nested*: a language that needed a fourth step would be describing a room nobody is standing in. Ungrounded UI keeps the card default, which is deliberately the same step as the ground's support tier — a card on the canvas and a card on the counter are the same object, in different rooms.

**Orchard exposure.** *How much* orchard a room admits is a question about place, not about look: its E0–E3 scale and its per-domain map are the Experience Blueprint's (§ 6.2 and § 5.1 there), and this document does not restate them. What is admitted **here** is their expression — exposure resolves through named semantic tokens (§ 16), set once per domain, never a per-surface or per-component choice, never adjusted for taste mid-feature. The orchard never carries working text, and never animates.

> **Why depth and not flatness.** The previous rule — *"Content sits on soft, flat cards — no heavy shadows, no skeuomorphic depth"* — was written to prevent the failure this document exists to prevent: a product that reaches for drama because it has nothing to say, until every surface competes and none is calm. That danger is real and the rule was right about it. But it defended against the danger by forbidding the *category*, and in doing so it also forbade the one thing a warm, physical, kitchen-table product most needs — a room that reads as a room, in which the eye knows what is near, what is far, and what is merely resting on the counter. Flatness was never the goal; **calm** was, and flatness was one way of buying it cheaply. The amendment keeps the defence and moves it to where the danger actually lives: **not in depth's existence, but in its drama.** Depth that is shallow, warm, single-directional, still, and tokenised cannot become the stage this section feared, because every member above is bounded by the distance it describes, and none of them can be spent for effect. This remains **one visual language with one definition source** — the depth vocabulary is a governed member of Calm Orchard, not an exception to it, and it obeys every other rule in this section, § 5's hierarchy and § 11's stillness included.

Rules of adoption:

- Calm Orchard governs **every** surface a person can see — product, onboarding, sign-in, settings, administrative surfaces, and any document or message THA renders. No surface is exempt as "internal" or "temporary".
- The language **evolves; it is never forked.** Refinements to its values happen in one canonical place and apply everywhere at once (Core Principle 8: evolution over replacement). A feature that "needs its own look" is a feature that has not yet been designed.
- The language is expressed **through the semantic token system (§ 16)** — its values live in exactly one implementation source, which this document deliberately does not restate.

## 5. VISUAL HIERARCHY

The Experience Architecture fixes the attention order of every surface — orientation, state, primary action, supporting detail, depth. This section is that order made visible.

- **The hierarchy is rendered top-down.** Visual prominence descends in exactly the experience order. Nothing below the fold of the hierarchy may out-shout what is above it.
- **Exactly one primary-styled action per surface.** One — rendered in the brand voice. Every other action on the surface takes a visibly subordinate treatment. Two primary-styled actions on one surface is a design failure, not a compromise.
- **The two-second rule.** A two-second glance at any surface must yield three things: what this is (orientation), how things stand (state), and the one obvious next thing (primary action). If a two-second glance yields decoration, promotion, or noise instead, the surface fails.
- **A fact is styled once per surface.** The same value never appears twice in two treatments; emphasis duplicated is emphasis spent twice on one item and stolen from another.
- **Emphasis spends four currencies** — colour, weight, scale, motion — and each currency obeys the budget (UI Principle 3). A surface that highlights everything has, by definition, highlighted nothing.

## 6. LAYOUT

One canonical page anatomy, everywhere:

1. **The shell** — canvas, one header, one primary navigation (the Experience Architecture's canonical navigation, visually frozen: consistent placement, honest location marking, generous touch targets).
2. **Orientation** — the surface's identity: where you are, in the realm's quiet tint.
3. **One content column** — a single, governed reading width. Content never stretches to fill whatever width exists; the column serves reading, not the viewport.
4. **Cards as the unit of grouping** — related information composes into the canonical card (§ 12), stacked in the content column in hierarchy order.

Rules:

- **Workspace surfaces** (the few realms whose work is genuinely two-sided, such as planning against a cookbook) may add **one** docked companion panel, provided through the one canonical panel pattern — never a per-surface invention.
- **No fixed dimensions beyond the system.** Layout adapts through the governed density model (§ 9); hard-coded widths and heights outside it are prohibited.
- **The anatomy is universal.** Administrative and low-traffic surfaces follow the same anatomy; where a surface is genuinely exempt (e.g. a deliberately desktop-only working table), the exemption is recorded in the adoption register (§ 17), not assumed.

## 7. COLOUR

Colour in THA is a four-tier vocabulary, and every tier is semantic (UI Principle 6):

| Tier | Purpose | Law |
|---|---|---|
| **Brand** | The green voice and amber accent of Calm Orchard | One green, one amber, defined once; the green marks primacy and brand presence |
| **Neutral** | Canvas, surfaces, text, borders | Carries almost every surface; calm lives here |
| **Status** | Success, warning, danger, information | The **only** sanctioned way to colour state — see § 14 |
| **Realm** | Orientation tinting per realm | Wayfinding only; never status, never emphasis |

Laws:

- **No raw colour, anywhere.** Every colour a surface uses is a named semantic role resolved in one place. Ad-hoc colour — a hand-picked green here, an improvised red there — is prohibited outright; it is how urgency the design never budgeted leaks into a calm product.
- **One meaning per colour, one colour per meaning.** "Good" has one colour; the brand voice is not also the success colour's understudy; the warm accent is never the warning colour. Where brand green and status green risk confusion, status presentation leans on its mandatory icon-and-text pairing (§ 14).
- **Colour is never the sole carrier of meaning.** Every colour-borne meaning is simultaneously carried by text, icon, or structure (Experience Architecture § 16).
- **Light and dark are value sets, not designs.** Every semantic role resolves in every supported mode from the same single definition. A surface never hand-writes its own dark variant; if a mode is offered, it is offered completely.

## 8. TYPOGRAPHY

THA's typography system admits **three families, and no more** — two that carry the product, and one that is reserved, rationed, and almost never seen.

| Voice | Role | Where it may appear |
|---|---|---|
| **Primary UI typeface** | The text family. Carries the working product. | Everything not claimed by the two voices below |
| **Display typeface** | Identity moments — titles, headings, the brand's structural voice | Page, section and card titles; brand positions |
| **Signature typeface** *(optional)* | **Emotionally significant branded moments only.** THA in its own hand. | Only where the product is *greeting* or *acknowledging* a household — never where it is *working* for them |

**The signature typeface is a brand asset, not a type role.** It is admitted under one condition and constrained by two prohibitions:

- **It is reserved for emotionally significant branded moments.** A moment qualifies only where something is true of the *relationship* — an arrival, a welcome, an honest milestone the household would themselves recognise. It never qualifies because a surface looked plain. (Experience Architecture § 17.9 owns which moments are meaningful; this section owns only how they may look, and adds no moment to that list.)
- **It may never be used for functional UI.** Not in buttons, forms, navigation, tables, cards, modals, or the planner, cookbook, shopping and pantry realms — nor in any label, control, status, or value a household reads in order to *act*. Legibility is not the argument here and neither is taste: a signature that appears in the working product stops being a signature.
- **Its use stays rare and deliberate, by governance rather than by intention.** Each surface permitted to use it is named in the adoption register, one at a time, and the rule that admits it is this one. **A second surface does not follow from the first.** The signature strengthens THA's identity only for as long as it is scarce; the failure state is not ugliness but *familiarity* — the moment it becomes an ordinary UI font, the identity it was admitted to carry is gone and cannot be recovered by using it more.

> **Why three and not two.** The previous rule — *"two voices only; no third typeface, ever"* — was written to prevent the failure this document exists to prevent: a product that accretes typefaces per campaign until it has no voice. That danger is real and the rule was right about it. But it defended against the danger by forbidding the *category*, and in doing so it also forbade THA from ever speaking in its own hand at the one moment a kitchen-table product most needs to — the moment it says hello. The amendment keeps the defence and moves it to where the danger actually lives: **not in the third family's existence, but in its spread.** A typeface admitted for one named moment, forbidden in all functional UI, and extended only by a further governed decision cannot become the fourth competing voice, because nothing about admitting it makes admitting the next one easier. This remains **one canonical typography system with one definition source** (§ 16) — the signature is a governed member of it, not an exception to it, and it obeys every other rule in this section.

- **A named scale, not free sizes.** Type sizes come from a small named scale with fixed roles — page title, section title, card title, body, caption. Surfaces use roles, never arbitrary sizes.
- **Legibility is a floor, not a preference.** Body text is sized for every member of a household, including older eyes and small hands holding phones; a minimum body size is part of the scale's definition, and metadata smaller than the caption role is prohibited. Small-for-density is a decision the density system makes (§ 9), never a per-surface economy.
- **Weight is hierarchy's quietest tool.** A restrained weight range carries structure; heavy weight is reserved for the few numerals and scores that deserve it. Shouting in bold is spending the emphasis budget on the shout.
- **Text scales with the person.** The scale must survive user-enlarged text without loss of content or capability (§ 15).

## 9. SPACING AND DENSITY

- **One spacing scale.** All spacing — padding, gaps, margins — comes from a single small-base scale with named steps. There is exactly one source for that scale; parallel or private spacing systems are prohibited.
- **Density is the responsive model.** THA adapts to context through a small set of named densities (compact, comfortable, expanded — the vocabulary may evolve; its singularity may not). Density is the **only** thing permitted to modulate the spacing and type scales.
- **One breakpoint truth.** What counts as "small", "medium", and "large" is defined exactly once, product-wide. Two surfaces disagreeing about whether the same screen is small is a governance failure, not a detail.
- **Touch is the default.** Interactive targets meet the minimum comfortable touch size everywhere — not only in navigation — regardless of density.
- **Breathing space is content's right.** The calm of Calm Orchard is mostly space. A surface that needs to remove breathing space to fit its content has too much content for one surface (Experience Architecture: split it).

## 10. ICONOGRAPHY AND BRAND IDENTITY ARCHITECTURE

THA's brand is a family of visual marks with one owner each. This is the **Brand Identity Architecture** — the canon of everything that identifies THA.

| Brand asset | What it is | Law |
|---|---|---|
| **THA logos** | The product's name-marks (full logo, compact mark) | One canonical set, one owner; used only in identity positions (entry, header, about); never re-drawn, re-coloured, or embedded in content |
| **The Apple identity** | The apple — THA's signature mark, and the face of its scores and ratings | Exactly one apple. One canonical apple mark, one canonical apple-rating presentation with one semantics. Two apples with different meanings is a brand failure |
| **Domain icons** | The pictorial identity of each realm and recurring concept | One icon library, one stroke style, a small set of sanctioned sizes; each concept maps to one icon, product-wide; **no emoji as interface icons** (emoji remain legitimate inside a person's own content) |
| **Illustration style** | Drawn imagery for identity and empty moments | One hand: a single, named illustration style in Calm Orchard's palette — warm, simple, unhurried. Illustration decorates meaning; it never substitutes for content or fakes it |
| **Photography / image style** | Photographic imagery, above all food | Honest, natural, appetising: real food in real light. Canonical entity images belong to their entities (one image per entity, from its owner); no stock-photo tone, no imagery presenting food the product cannot actually name |
| **Companion imagery** | The visual presence of THA's intelligence | One quiet, consistent mark for the companion wherever it speaks. The companion looks like THA, not like a person: it never takes a human face, a fake avatar's gaze, or emotional theatrics — its imagery obeys the honesty rules of Experience Architecture § 11 |
| **Empty-state imagery** | The face of honest absence | One canonical empty-state presentation (§ 12): at most a quiet icon or illustration in the canonical style, one honest sentence, at most one gentle action. Empty is a designed moment of calm, never a hole to decorate away |

Rules:

- Decorative marks are hidden from assistive technology; meaningful marks are named for it.
- Brand assets are referenced from their canonical source, never copied, restyled, or forked per surface (UI Principle 4).
- Any new brand asset class enters this table by governance (§ 17), not by shipping.

## 11. MOTION

- **Motion is functional, brief, and optional.** Its only sanctioned purposes: confirming a state change, preserving spatial continuity, and the product's few gentle brand moments (a score settling, a companion arriving). Motion as decoration, ambience, or attention-seeking is prohibited.
- **One motion vocabulary.** Durations and easings come from a small named token set defined once. Ad-hoc timing is ad-hoc personality.
- **Nothing loops for attention.** No pulsing, shimmering, or bouncing to be noticed. The Experience Architecture's rule stands: motion is spent only on what genuinely needs it now.
- **Reduced motion is a first-class mode.** A person who asks for reduced motion loses no information and no capability — every meaning motion carries has a still equivalent. This is a guarantee, not an enhancement.

## 12. INTERACTION AND STATE PRESENTATION

Every interactive element renders the full state vocabulary — rest, hover/focus, active, disabled — from its canonical owner, identically product-wide. Focus is always visible. Disabled looks disabled and explains itself where the reason isn't obvious.

The three moments where products betray their character each have exactly one canonical presentation (UI Principle 7):

- **Empty — the canonical empty state.** One product-wide pattern: quiet imagery (or none, § 10), one honest sentence in the companion voice ("Nothing planned for today yet"), at most one gentle action leading to the canonical place. Never filler, never fake content, never guilt (Core Principle 6; Experience Architecture § 6).
- **Loading — shape before spin.** Loading preserves the shape of what is coming: quiet, layout-stable placeholders that prevent the page from lurching. Spinners are demoted to small, in-control feedback for brief operations. Literal "Loading…" text and full-page spinner theatre are retired. Loading is silent — it never toasts, never animates beyond its own quiet placeholder.
- **Error — the calm three tiers** (rendering Experience Architecture § 14):
  1. **Field errors** — inline, beside the field, in the destructive voice, announced to assistive technology.
  2. **Operation errors** — a calm, transient notice stating what happened and the way forward ("Couldn't save — try again"); never blame, never celebration styling.
  3. **Surface failures** — every surface is caught by a recovery boundary rendering a calm recovery card: what happened, what it means for the person's work, one action out (retry or Home). A blank or broken screen is the one unforgivable state.

Alarm styling — the danger tier at full strength — is reserved for genuine data loss and safety, nothing else.

## 13. FORMS

- **One field anatomy, everywhere:** label above, help beneath, error replacing help in the destructive voice — visually identical on every surface and announced identically to assistive technology.
- **Controls share one scale.** Inputs, buttons, and selectors share the control height and radius scale, so a form reads as one instrument rather than assembled parts.
- **The form's primary action obeys § 5:** one primary-styled submission; secondary actions subordinate; destructive submissions guarded proportionally to their consequence (Experience Architecture § 12).
- **Validation is honest and calm:** errors appear when the person can act on them, state plainly what to fix, and never stack into a wall of red. Celebrations are not a validation state — a saved form says "Saved".

## 14. VISUAL TRUST

THA shows households scores, claims, and suggestions about their food and health. The visual layer must carry the platform's honesty (Core Principle 6) — an interface can fabricate with styling just as surely as with words. These are the laws of **Visual Trust**:

- **Evidence presentation.** Anything THA asserts — a score, a recommendation, an insight — visibly offers its working: a quiet, consistent affordance leading to the evidence and methodology in the entity's canonical place. Evidence presentation is one pattern product-wide, calm and secondary; assertion and evidence are never visually severed.
- **Confidence presentation.** The interface renders confidence exactly as strong as it is. Established facts present plainly; derived or partial knowledge presents with visibly lighter commitment (hedged copy, quieter weight — in the language's one hedging style); nothing is styled more authoritatively than its evidence permits. **Precision theatre is prohibited** — no decimal places, gauges, or authoritative numerals beyond what the underlying knowledge supports.
- **Uncertainty presentation.** What THA does not know renders as designed, honest absence: the canonical empty state, an explicit "not enough information yet", or the honest omission of a field a canonical source doesn't expose. Uncertainty is **never** disguised — no invented placeholders styled as facts, no greyed "estimates" a person will read as data, no blurring of the line between knowing and guessing.
- **Semantic colour usage.** Status colour is the trust vocabulary of § 7: success, warning, danger, information — each with one meaning, used **only** for that meaning, and always paired with words or an icon (never colour alone). Status colours never decorate, never brand, never celebrate; spent honestly, they retain the power to mean something when it matters.
- **Status communication.** The status of anything — a plan, an item, an analysis, a sync — is communicated through one canonical status presentation, in the same vocabulary everywhere. Status reflects the canonical owner's truth, is never invented or optimistically pre-rendered as fact, and stale or unknown status says so rather than posing as current. Manufactured urgency — countdown theatre, alarm styling on routine states, red for the merely unfinished — is a lie told in colour, and prohibited.

The test for every trust decision: **a person who believes exactly what the pixels imply must end up believing the truth.**

## 15. ACCESSIBILITY STANDARDS

Experience Architecture § 16 makes accessibility a design input. At the visual layer it becomes measurable floors — checked before adoption, not retrofitted:

- **Contrast is measured**, to recognised accessibility standards as a floor, for every semantic colour pairing in every supported mode — including status and realm tints, in the one place their values are defined.
- **A graded surface is measured at its worst point.** A gradient, wash, or fall of light has no single colour pairing, and therefore has no contrast at all until one is declared. Any graded surface that carries text names the semantic role it is measured *against* and is measured at **the extreme of its range least favourable to what sits on it** — a surface that clears the floor at one end and fails at the other has failed, and the average is not a defence. **A graded surface that carries no text declares a ceiling instead of a pairing**: the strength it may never exceed, named as a token (§ 16), so that ambience cannot be turned up later by taste. Every graded surface has one or the other, and none has neither.
- **Every interactive element** has a visible focus state, a minimum comfortable touch target, and an accessible name — icon-only controls included, without exception.
- **Text scales to at least double size** without loss of content or capability; layout reflows rather than truncates.
- **Meaning is never colour-alone** (§ 7), imagery never carries unnamed meaning (§ 10), and motion never carries meaning without a still equivalent (§ 11).
- **The type floor stands** (§ 8): no essential text below body size, nothing below the caption floor at all.
- **Calm is accessibility.** One primary action, quiet surfaces, consistent anatomy, honest states — the whole of this document is the cognitive-accessibility programme; a surface may not trade calm away and call itself accessible.

## 16. DESIGN TOKEN STRATEGY

The mechanism by which everything above stays true is one semantic naming system:

- **Three tiers.** *Primitive tokens* (the raw scales: colour values, size steps, duration steps, shadow steps, exposure levels) → *semantic tokens* (named intent: surface, muted text, success, card radius, fast duration, ground plane, warm shadow, orchard exposure) → *component tokens* (only where a canonical component needs a governed override).
- **Surfaces speak semantic only.** Pages and components reference the semantic tier exclusively. Primitive values appear in exactly one definition source; a raw value in a surface is a defect.
- **Modes and densities are value sets.** Light, dark, and every density resolve the same semantic names to different values in the one definition source. Offering a mode means resolving *every* name in it — a partially-resolved mode is not offered.
- **One definition source, pointed to.** This document defines token *names and intent* (enduring); their *values* live in exactly one implementation source that this document points to and never copies. The document, the definitions, and the surfaces cannot be allowed to drift apart, and a value's home is therefore singular.
- **Admission by governance.** New semantic names enter through the governance of § 17 — a name is a commitment every future implementation must honour, so names are added rarely and deliberately.

## 17. GOVERNANCE — OWNERSHIP, RETIREMENT, ADMISSION

The discovery's central finding is that ungoverned visual infrastructure fails the same way every time: authored, partially adopted, never retired. This section is the countermeasure.

- **One canonical owner for every visual concern** (UI Principle 4). Header, navigation, card, dialog, form field, empty state, loading state, error boundary, status presentation, rating mark, brand mark, icon set, motion vocabulary, token definitions — each is one concern with exactly one owning pattern. A surface that needs the concern uses the owner. Full stop.
- **Retire on introduction** (UI Principle 5, applying Core Principle 8 to UI). A workstream introducing a successor to any visual concern must, in that same workstream: name the predecessor, migrate or explicitly exempt every consumer, and delete the predecessor. "Dormant" predecessors are prohibited — an unadopted foundation plus an unretired predecessor is the exact failure state this document exists to end.
- **The adoption register.** Every canonical building block carries a visible register: what it owns, which surfaces have adopted it, which are exempt and why. Authored-but-unadopted must be impossible to hide. The register lives beside the implementation (it is operational, not architectural); its *existence* is mandated here.
- **Admission of the new.** A new visual pattern, token name, brand asset class, or building block is admitted only with: the concern it owns named; the conflict check against this document passed; its predecessor (if any) retired per the rule above; and its register entry created. Anything visual that ships without admission is a defect regardless of its quality.
- **Exemptions are explicit.** Any surface exempt from a canonical owner (e.g. a deliberately desktop-only administrative table) is exempt *in the register, with a reason* — never silently.

## 18. UI GOVERNANCE CHECKLIST

Every implementation that changes anything a person sees must pass this checklist. It stands beside the Experience Architecture's UX Governance Checklist (§ 18 there, including its Premium Standard block) and the Architecture Compliance Checklist in `ENGINEERING_WORKFLOW.md`; **if any check fails: STOP, explain why, do not continue until approved.**

```
□ Experience precedence
  Does this change comply with the Experience Architecture? Has any
  behaviour/presentation conflict been resolved in the Experience
  Architecture's favour?

□ One visual language
  Does every touched surface speak Calm Orchard — canvas, one green voice,
  one warm accent, calm surfaces on a ground in one light, realm tint as
  orientation only? Nothing introduces a second identity?

□ Depth, light and ground discipline (§ 4)
  If this surface uses ground, shadow, or the fall of light: does every
  shadow describe a real distance, under the one product-wide light, in a
  hue drawn from the room rather than from black? Is there exactly one
  ground, unnested, beneath any type that must be read? Is the depth still
  — no parallax, no ambience, no stage? Does it carry no meaning that
  colour, weight or words should carry? Is every value a token admitted
  through governance, and every exposure level a per-domain constant rather
  than a per-surface choice?

□ Beauty through consistency
  Does the change reuse the canonical anatomy, scale, and patterns rather
  than introducing novelty? Would a person recognise this as the same
  product they used yesterday?

□ Visual hierarchy
  Is exactly one action primary-styled per surface? Does prominence descend
  in the canonical order? Does a two-second glance yield orientation, state,
  and the primary action? Is every fact styled once?

□ Canonical ownership
  Does every visual concern touched use its one canonical owner (header,
  card, dialog, form field, states, marks)? Has nothing been re-implemented
  beside its owner?

□ Retire on introduction
  If any successor pattern is introduced, is its predecessor migrated,
  exempted explicitly, and deleted in this same workstream? Is the adoption
  register updated?

□ Semantic before literal
  Does every colour, size, spacing, and duration reference a semantic name?
  Zero raw values in surfaces? New names admitted through governance?

□ Colour law
  Status colours only for status, always paired with icon/text? Realm tint
  only for orientation? One green? No colour as sole carrier of meaning?

□ Typography and spacing
  Only named type roles and spacing steps? Body floor respected? Density
  modulation only through the one density system, one breakpoint truth?

□ Signature typeface discipline (§ 8)
  If the signature voice is used at all: is this an emotionally significant
  branded moment rather than a plain-looking surface? Is it absent from every
  functional control, label, status and value? Is the surface named in the
  adoption register — and is it the ONLY surface, unless a further governed
  decision added one?

□ Brand identity
  Do logos, the apple, icons, illustration, photography, companion imagery,
  and empty-state imagery come from the canonical brand set, in the
  canonical style? No emoji as interface icons? No second apple?

□ Motion
  Is all new motion functional, brief, from the one vocabulary, loop-free,
  and fully degradable under reduced motion without loss of meaning?

□ States designed
  Do empty, loading, error, and disabled states use the canonical
  presentations? Is every touched surface inside a recovery boundary?
  No blank failure possible?

□ Visual trust
  Does every assertion offer its evidence? Is confidence styled no stronger
  than it is? Is uncertainty honest, never disguised? No precision theatre,
  no manufactured urgency, no optimistic status posing as fact?

□ Accessibility floors
  Contrast measured, focus visible, targets comfortable, controls named,
  text scalable to double, meaning never colour-alone or motion-alone?

□ Token integrity
  Any mode or density touched resolved completely? Values still live in the
  single definition source? Nothing hand-writes a variant?
```

---

*Required reading before any user-facing visual or presentation work.*
*Subordinate to the Experience Architecture: it governs how THA looks; the Experience Architecture governs how THA behaves and feels, and prevails in any conflict.*
*Rollback: this document only — `git checkout HEAD docs/architecture/THA_UI_ARCHITECTURE.md` (or delete the file to revert).*
