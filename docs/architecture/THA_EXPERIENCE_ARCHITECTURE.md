# THA Experience Architecture — Governing Document

**Status:** GOVERNING ARCHITECTURE — required reading before any user-facing design or implementation work
**Classification:** Experience Governance (canonical)
**Adopted:** 2026-07-10 (EXP1)
**Enhanced:** 2026-07-11 (EXP2) — Premium Experience Principles (§17) and the premium checks in the UX Governance Checklist (§18)
**Governing documents:** [`ARCHITECTURE_PRINCIPLES.md`](./ARCHITECTURE_PRINCIPLES.md), [`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`](./THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md), [`ENGINEERING_WORKFLOW.md`](./ENGINEERING_WORKFLOW.md)
**Subordinate to this document:** [`THA_UI_ARCHITECTURE.md`](./THA_UI_ARCHITECTURE.md) (UI — presentation; **this document prevails in any conflict**, § 2.1)
**Peers:** [`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](./THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) (Intelligence), [`THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`](./THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md) (Product Knowledge — the census to this document's law, § 2.2), the Platform Governance documents (Platform), the Source of Truth Register (Data)
**Named experience principles that sit within this document:** [`INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md`](./INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md), [`THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md`](./THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md), [`THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`](./THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md)
**Enforced by:** the **UX Governance Checklist** (§ 18), mandatory for every user-facing implementation via the Experience & UI Governance Compliance block in [`ENGINEERING_WORKFLOW.md`](./ENGINEERING_WORKFLOW.md)

> **What this document is.** The governing source for how people experience The Healthy Apples. It defines the enduring, technology-independent principles that every screen, journey, message, and interaction must honour. It says nothing about frameworks, components, routes, or devices — those change; these principles do not. Where the Platform, Data, and Intelligence architectures govern what THA *is* and *knows*, this document governs what THA *feels like* to the household using it. Every future UX decision is made under this document; a design that conflicts with it must **STOP, explain why, and not continue until approved**.

---

## 1. PURPOSE OF EXPERIENCE ARCHITECTURE

The Healthy Apples exists to help households eat better. That mission succeeds or fails at the moment a person opens the product: whether they feel oriented or lost, calm or nagged, helped or managed.

Experience Architecture exists to make that moment consistent and deliberate. Without it, every implementation invents its own layout, tone, and interaction patterns, and the product accretes into a collection of features rather than a single companion. With it, every surface — however different its purpose — is recognisably the same THA: the same hierarchy, the same voice, the same respect for the person's attention.

This document is:

- **Enduring** — it describes principles that remain true across redesigns, replatforms, and device generations.
- **Governing** — no user-facing implementation may contradict it; conflicts stop work until resolved.
- **Technology-independent** — it never names a framework, library, screen size, or component. An implementation on any future technology must still satisfy it.

It is deliberately **not**:

- a visual style guide (colours, typography, spacing are implementation-level and may change freely within these principles);
- a feature roadmap (what THA builds is governed elsewhere; this governs how anything built must feel);
- a component library specification (components serve these principles; they are not the principles).

## 2. RELATIONSHIP TO THE GOVERNING ARCHITECTURE

THA is governed by six architectures. Each owns one question; none may answer another's.

| Architecture | Question it owns | Governing sources |
|---|---|---|
| **Platform** | How is THA built and evolved? | Platform Governance documents (`ARCHITECTURE_PRINCIPLES.md`, `ENGINEERING_WORKFLOW.md`, `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`, …) |
| **Data** | What is true, and who owns each fact? | `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` and the eight Core Principles |
| **Intelligence** | How does THA reason, observe, and converse? | Intelligence Governance documents |
| **Experience** | How does a person encounter all of the above? | **This document** |
| **UI** | How does THA look? | [`THA_UI_ARCHITECTURE.md`](./THA_UI_ARCHITECTURE.md) — **subordinate to this document** (§ 2.1) |
| **Product Knowledge** | What *is* THA? | [`THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`](./THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md) (§ 2.2) |

The dependencies flow one way:

- **Experience consumes; it never owns.** No experience surface owns a fact, an entity, or a decision. Every value shown is read from its single owner (Core Principles 1, 2, 4). A screen is a *projection* of canonical truth, never a second store of it.
- **Experience displays honest knowledge only.** What Intelligence does not know, the experience does not show. Gaps render as calm, honest absence — never as invented content (Core Principle 6).
- **Experience shapes, but does not decide.** The Decision and Behaviour engines decide *what* deserves the household's attention; Experience Architecture governs *how* and *when* that attention is requested.
- **Intelligence experience principles nest inside this document.** The Discovery & Presentation Principle and the Companion Card Experience Principle are the Intelligence-specific faces of this architecture. This document does not restate or alter them; it is the general law of which they are special cases.

If an experience decision requires changing data ownership, platform structure, or intelligence behaviour, it is no longer an experience decision — it must be taken to the owning architecture.

### 2.1 The UI Architecture is subordinate to this document

> **This document governs behaviour. The UI Architecture governs presentation. Where the two conflict, this document prevails and the UI Architecture is corrected.**

The `THA_UI_ARCHITECTURE.md` (UIA2, 2026-07-10) is the visual constitution of THA — the Calm Orchard visual language, visual hierarchy, colour/typography/spacing/motion law, Brand Identity Architecture, Visual Trust, and one-owner-per-visual-concern with retire-on-introduction. It exists because § 1 of this document deliberately disclaims the visual layer, and an ungoverned vacuum does not stay empty: it fills with competing greens, competing headers, and competing states.

The division is clean, and neither document may cross it:

- **This document decides *what may happen*** — what may interrupt a person, what the one primary action of a surface is, what an error must say, what may never be fabricated.
- **The UI Architecture decides *how it looks when it happens*** — how an interruption is presented, how the primary action is visually distinguished, how an error state is rendered, how confidence and uncertainty are shown.

A UI decision that would change behaviour, journeys, data ownership, or intelligence conduct is not a UI decision. An experience decision expressed as colour, weight, or spacing is not an experience decision. **Every implementation that touches a person's eyes passes both checklists** — the UX Governance Checklist (§ 18) and the UI Governance Checklist (`THA_UI_ARCHITECTURE.md` § 18) — and, where they disagree, this document's answer stands.

### 2.2 The Product Knowledge Registry is the census this document has always assumed

The Experience Architecture is the **law**; the Product Knowledge Registry is the **census**.

Experience Principle 6 — *one canonical place for everything* — is the principle this document most depends on and has never been able to enforce, for a simple reason: **enforcing it requires a list of the places, and no such list has ever existed.** "Every entity has one page" is uncheckable without an enumeration of the pages, and until now the enumeration was reconstructed from code on every ask.

The Product Knowledge Registry (`PKR1`/`PKR2`, governed as a knowledge domain by `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` § 9) is that enumeration. It owns *what surfaces exist, what each is for, and who may be told about them*. It does not own how any of them behaves — that is this document, unchanged and unshared.

> **The boundary, stated once:** the registry records **that a surface exists and what it is for**. It never records **how a surface should behave, feel, or be sequenced** — that is this document's, and a registry entry that strays into it is a defect in the registry, not a change to the law. Where the two disagree, **this document wins and the registry entry is corrected** (`PKR1` § 4.4, § 4.6).

One consequence is a duty, not merely a relationship: an implementation that adds, changes, or retires a page, journey, dialog, drawer, wizard, or notification **updates the affected registry entries in the same change** — a Definition of Done obligation enforced in `ENGINEERING_WORKFLOW.md` (Rule KC15). A law with an out-of-date census is a law nobody can apply.

## 3. EXPERIENCE PRINCIPLES

These principles have the same standing for user experience that the eight Core Principles have for data and platform. Every subsequent section of this document elaborates one or more of them.

> **Experience Principle 1 — Home is the emotional centre.** Every session begins, and can always return to, one calm place that tells the household how they are doing.
>
> **Experience Principle 2 — Progressive disclosure.** Show the essence first; reveal depth only when the person asks for it.
>
> **Experience Principle 3 — Calm before capability.** However powerful the platform becomes, the surface stays quiet. Capability is never justification for clutter.
>
> **Experience Principle 4 — One primary action.** Every surface has exactly one obvious next thing to do.
>
> **Experience Principle 5 — The product orients; the person chooses.** THA makes the current state and possible actions clear, then waits. It never rushes, traps, or manipulates.
>
> **Experience Principle 6 — One canonical place for everything.** Every entity has one page that presents, edits, and navigates it. Every other surface refers and links; none duplicates.
>
> **Experience Principle 7 — Honest presence.** THA shows what it knows, admits what it doesn't, and never simulates knowledge, urgency, or emotion it does not have.
>
> **Experience Principle 8 — The household's attention is borrowed, never taken.** Every interruption must repay the attention it costs.

These eight principles say *what* THA's experience must do. The **Premium Experience Principles (§17)** say to what *standard of craft* they must be done. They are a lens over these eight, not a rival set: no premium principle may be read as licence to weaken one of the eight, and where a premium principle restates one, the principle above remains its owner.

## 4. HOME AS THE EMOTIONAL CENTRE OF THA

Home is not a menu, a dashboard, or a feed. It is the answer to the question every household member silently asks on arrival: **"How are we doing, and what's next?"**

- **Home is where every session begins.** A signed-in person lands on Home. No campaign, feature launch, or notification may hijack the landing.
- **Home reassures before it informs.** Its first impression is emotional: today is under control. Detail follows for those who look; it is never the opening posture.
- **Home reflects; it does not demand.** Home presents today's state — what is planned, what is progressing, what gently deserves attention. It is read-only in spirit: acting on something means moving to that thing's canonical place.
- **Home is always reachable.** From anywhere in the product, one obvious, consistent gesture returns the person to Home. Nobody is ever more than one step from the centre.
- **Home earns trust through restraint.** An empty Home says so calmly ("Nothing planned for today yet"), and a full Home stays scannable. Home never scolds, never gamifies guilt, and never manufactures urgency to drive engagement.
- **Home is not the everything page.** Sections earn their place on Home only by answering "how are we doing today?" — anything else lives in its own realm and is reached by navigation.

## 5. PROGRESSIVE DISCLOSURE

People come to THA to live their lives, not to study an interface. Depth exists — nutrition methodology, plant diversity, provenance, history — but it is offered in layers.

- **Layer one is the essence:** the few facts that orient a person (a meal's name and image; today's plan; the score that matters).
- **Layer two is the detail:** the canonical page, where the full entity lives — every field, every action, every explanation.
- **Layer three is the reasoning:** why THA believes what it shows — methodology, evidence, provenance — available to whoever asks, imposed on nobody.
- **Every layer is honest about the next.** A summary never pretends to be complete; it visibly leads somewhere deeper. And depth is never *required*: the essential experience works for a person who never opens layer three.
- **Disclosure is by intent, not by accident.** Depth is revealed because the person asked (opened, expanded, followed), never because a screen had spare room to fill.

## 6. CALM BEFORE CAPABILITY

THA's platform grows more capable every month: more knowledge, more intelligence, more automation. The experience must not grow louder with it.

- **Capability is admitted through the same calm surfaces.** A new engine, score, or insight does not earn a new banner, badge, or panel by default. It earns, at most, a quiet place in the existing hierarchy.
- **The default state of every surface is quiet.** Motion, colour, and emphasis are spent only on what genuinely needs them now. If everything is highlighted, nothing is.
- **Intelligence whispers.** Observations and suggestions arrive as calm, dismissible presences — never modal interruptions, never blocking the person's own intent.
- **Empty is a valid, designed state.** A surface with nothing to say says so gracefully, or says nothing. Absence is never disguised with filler, placeholders posing as content, or manufactured activity.
- **When calm and capability conflict, calm wins.** A feature that cannot be presented calmly is not ready to be presented.

## 7. ONE PRIMARY ACTION

Every surface answers "what is the one obvious thing to do here?" before it answers anything else.

- **Exactly one action is visually primary** on any screen or card. Everything else is secondary by design — present, discoverable, but not competing.
- **The primary action is the person's most likely intent,** not the product's most desired behaviour. On a meal: cook or plan it. On a shopping list: work through it. Never "upgrade", "share", or whatever the business currently wishes people did more.
- **Choice is not abolished — it is ranked.** Secondary actions exist; they simply never shout. A person who wants them finds them in one step.
- **A surface that cannot name its primary action is not finished being designed.** If two actions genuinely tie, the surface is doing two jobs and should be split.

## 8. NAVIGATION PHILOSOPHY

Navigation is the product's promise of orientation: *you always know where you are, and you can always get home.*

- **One canonical navigation.** There is exactly one primary navigation structure, identical in content and order everywhere it appears. No surface grows a private, competing navigation.
- **Few, stable destinations.** Primary navigation holds a small number of realms a person can hold in their head. Destinations are added rarely and removed deliberately; navigation is not a feature billboard.
- **Home holds the anchor position.** The centre of the product occupies the most reachable position in the navigation, always.
- **Navigation states are honest.** Where you are is always visibly marked. Navigation never lies about location and never dead-ends: every place in the product has an obvious way back.
- **Hierarchy over history.** A person's mental model is "Home → realm → thing", not a browser trail. Deep links are welcome, but every deep destination still knows its place in the hierarchy and shows it.
- **Navigation is boring on purpose.** It never animates for attention, reorders itself adaptively, or hides destinations behind cleverness. Predictability *is* the feature.

## 9. INFORMATION HIERARCHY

Every surface presents information in the same descending order of claim on attention:

1. **Orientation** — where am I, and what is this? (title, identity, context)
2. **State** — how are things? (today's plan, the score, progress)
3. **The primary action** — the one obvious next thing.
4. **Supporting detail** — the facts that deepen understanding, in order of usefulness.
5. **Secondary actions and depth** — everything else, one step away.

Rules that follow from the hierarchy:

- **The most important fact is visible without any interaction.** If a person glances for two seconds and leaves, they leave correctly informed.
- **Emphasis is a budget, not a garnish.** Each surface spends visual emphasis on the few items at the top of its hierarchy and deliberately withholds it from the rest.
- **Related facts appear together, once.** A fact is presented in one place per surface; the same number never appears twice styled two ways.
- **Hierarchy is consistent across surfaces.** A person who has learned one THA page has learned them all: identity at the top, state next, action next, depth below.

## 10. USER JOURNEY PRINCIPLES

A journey is the path from a household's intent ("what's for dinner this week?") to its resolution. Journeys, not screens, are the unit of experience design.

- **Every journey starts from Home and ends somewhere restful.** A completed journey resolves to a calm state — the plan made, the list ready — never into a dead end or an upsell.
- **Journeys are interruptible and resumable.** Real life interrupts cooking, planning, and shopping. Leaving mid-journey loses nothing; returning resumes gracefully.
- **The shortest honest path wins.** No journey contains a step that exists for the product's benefit rather than the person's. Every added tap must buy the person something.
- **Journeys never fork silently.** When a journey requires a decision, the decision is presented once, clearly, with a sensible default — not scattered across steps as accumulating small surprises.
- **Progress is visible in long journeys.** A person mid-journey always knows how much remains and what happens at the end.
- **Completion is acknowledged, quietly.** Finishing a journey earns calm confirmation — not celebration theatre, not an immediate demand for the next task.

## 11. COMPANION BEHAVIOUR PRINCIPLES

THA's intelligence meets the household as a **companion**: knowledgeable, discreet, and on their side. These principles govern every intelligent presence — conversation, observations, notices, suggestions.

- **The companion is invited, not intrusive.** It speaks when spoken to, or when it has something genuinely worth the household's attention. It never performs helpfulness to seem alive.
- **The companion discovers and refers; canonical pages own presentation and action.** The conversation summarises what it found and links to the one canonical place where the person sees, edits, and acts (this is the governing rule of the Discovery & Presentation Principle and the Companion Card Experience Principle, which sit within this document).
- **The companion is honest about its nature and limits.** It does not fake certainty, emotion, or memory it lacks. What it doesn't know, it says plainly ("I don't have that") — honest gaps over invented facts, always.
- **The companion suggests; the person decides.** Every suggestion is declinable without penalty, and declining teaches it restraint, not persistence. It never nags, never repeats a dismissed notice as if new, never escalates.
- **The companion remembers the relationship, not just the request.** Within what the household has chosen to share, it behaves like something that knows them — without ever revealing one member's private context to another.
- **The companion serves the household's goals, not engagement metrics.** Its success measure is "the household ate better with less effort", never "the household spent more time in the product".

## 12. TRUST AND REASSURANCE PRINCIPLES

Households grant THA intimate knowledge — what they eat, who they live with, what they can afford. Trust is the currency; every principle here protects it.

- **Never fabricate.** No invented facts, scores, or content, anywhere, ever. A gap shown honestly builds more trust than a gap papered over (Core Principle 6, applied to everything a person sees).
- **Show the working on request.** Any score, recommendation, or claim can explain itself — its evidence, its methodology, its provenance — to anyone who asks.
- **Attribute honestly.** Content that came from outside THA carries its provenance in its canonical place. THA never presents others' work as its own.
- **Data belongs to the household.** The experience always makes clear what THA knows, lets the household see it, and lets them correct or remove it. No dark corners.
- **No dark patterns, without exception.** No manufactured scarcity, no guilt-driven copy, no confirm-shaming, no hidden opt-outs, no friction placed deliberately in the path of leaving, downgrading, or deleting.
- **Predictability is reassurance.** The product behaves the same way today as yesterday. Change, when it comes, is announced, explained, and never silently rearranges what people rely on.
- **Destructive actions are guarded proportionally.** Deleting a meal asks once, clearly. Deleting a household's history explains consequences fully. Nothing irreversible ever happens as a side effect.

## 13. LANGUAGE AND TERMINOLOGY PRINCIPLES

THA speaks as one voice: a knowledgeable friend at the kitchen table.

- **Plain, warm, and brief.** Everyday words, short sentences, no jargon. If a nutrition term is unavoidable, it is explained in place the first time it matters.
- **One name per concept, everywhere.** Each concept in THA has exactly one user-facing name, used identically in navigation, pages, messages, and conversation. Internal or technical names never leak to the surface.
- **The person is "you"; the product speaks as itself.** THA addresses the household directly and refers to itself plainly. It does not use the royal "we" to disguise a machine, nor first-person theatrics to fake personhood.
- **Encouraging, never judgmental.** THA talks about food without moralising: no "good/bad food", no "cheat", no "guilt", no shame-flavoured streak language. Progress is framed by what the household did, not what it failed to do.
- **Honest verbs.** Buttons say what they do ("Add to Planner", not "Get started"). Messages say what happened ("Saved", not "Success!"). Marketing tone never enters the working product.
- **Calm punctuation.** No exclamation marks doing the work of substance, no ALL CAPS urgency, no emoji as apology for unclear text.

## 14. ERROR AND RECOVERY PRINCIPLES

Errors are moments of maximum vulnerability for trust. THA's response to failure is where its character shows.

- **The person is never blamed.** Error language describes what happened and what to do next — never what the person "did wrong".
- **Every error states three things:** what happened (honestly, in plain words), what it means for the person's data or task, and the one clear way forward.
- **Work is never silently lost.** The product's first duty in failure is preserving what the person made. If something could not be saved, saying so immediately and visibly is mandatory.
- **Recovery is one action away.** Every error state carries its own way out — retry, go back, go Home. A person is never stranded on a broken screen.
- **Degrade gracefully, and honestly.** When part of the product is unavailable, the rest keeps working, and the unavailable part says so plainly — it does not pretend emptiness or show stale data as fresh.
- **Fail calmly.** Errors use the same quiet visual language as the rest of the product. Alarm is reserved for genuine data loss or safety, not for a failed refresh.

## 15. NOTIFICATION PRINCIPLES

A notification spends the household's attention outside the product — the most expensive attention there is.

- **Every notification must repay its interruption.** The test: would the person, told exactly what this notification says, agree it was worth being interrupted for? If not, it is not sent.
- **Notify about their life, not our product.** Notifications concern the household's food, plans, and goals — never feature announcements, re-engagement bait, or "we miss you".
- **Digest over drip.** What can wait, waits, and arrives together at a respectful time. Only genuine time-sensitivity earns immediacy.
- **Everything is controllable, per kind, honestly.** The household chooses what reaches them, category by category; "off" means off, with no un-optable "important updates" smuggling marketing.
- **Silence is the default posture.** A household that opts out of everything still gets a fully working product with no punishment, nagging, or degraded experience.
- **In-product notices obey the companion rules:** calm, dismissible, never modal, never repeated after dismissal (§ 11).

## 16. ACCESSIBILITY AND INCLUSIVITY PRINCIPLES

THA serves whole households — different ages, abilities, languages, budgets, diets, and household shapes. The experience is designed for all of them, not adapted for them afterwards.

- **Accessibility is a design input, not a compliance pass.** Every surface is designed from the start to be perceivable, operable, and understandable regardless of vision, hearing, motor ability, or cognition — to recognised accessibility standards as a floor, not a ceiling.
- **Everything works by every means of interaction.** No action requires a specific sense or gesture: whatever can be tapped can be reached by keyboard or assistive technology; whatever is shown is available to a screen reader; nothing meaningful is conveyed by colour alone.
- **Calm design is accessible design.** The principles above — one primary action, quiet surfaces, plain language, consistent hierarchy — are themselves accessibility features. Cognitive load is treated as seriously as contrast ratios.
- **No household shape is the "default".** Single people, large families, shared homes, and every configuration in between are first-class. Copy, imagery, and flows never assume a family shape, a gender of cook, or a body type of eater.
- **Food culture is not judged.** THA helps every household eat better *from where they are* — every cuisine, budget, and dietary need is met with the same respect. Better is defined relative to the household, never to an idealised plate.
- **Text scales, time flexes.** People who need larger text, more time, or reduced motion get them without losing any capability.

## 17. PREMIUM EXPERIENCE PRINCIPLES

Everything above governs what THA's experience must *do*. This section governs the standard to which it must be *done*.

**Premium, in THA, is the perceptible result of care taken on the household's behalf.** It is not ornament, density, motion, or expense. It is what a person feels when everything they touch has visibly been thought about — and nothing they touch is trying to impress them. Premium is therefore not a layer that can be added at the end; it is a property of how each principle above was executed, and it is felt long before it is noticed.

These principles are a **lens over Experience Principles 1–8, not a second constitution.** They may never be read as licence to weaken one of the eight. Where a premium principle restates an existing principle, that principle remains its canonical owner and this section adds only what the premium standard demands of it (Experience Principle 6 — one canonical place for everything — binds this document to itself).

> **Premium Principle 1 — Craftsmanship over feature quantity.** THA's worth is what its features are like to use, never how many of them there are. A smaller product, finished, beats a larger product, approximated.
>
> **Premium Principle 2 — Calm before capability.** *Owned by Experience Principle 3 (§3, §6).* The premium standard adds only this: calm is not merely the absence of noise, it is the presence of composure.
>
> **Premium Principle 3 — Quality over novelty.** THA earns familiarity rather than chasing trends. Recognition is the goal; novelty never is.
>
> **Premium Principle 4 — Every interaction feels intentional.** Nothing in THA is accidental — not a default, not a word, not a transition, not a space.
>
> **Premium Principle 5 — Remove friction before adding functionality.** The first answer to "this is hard" is to make it easier, never to add a feature that compensates for it.
>
> **Premium Principle 6 — Reduce cognitive load wherever possible.** THA is not the most important thing in the room, and it never asks the household to hold what the product could hold for them.
>
> **Premium Principle 7 — Moments of delight, not constant stimulation.** Delight is punctuation, not texture.
>
> **Premium Principle 8 — Premium through simplicity, clarity and confidence.** THA's premium signal is that it appears to know what it is doing.
>
> **Premium Principle 9 — Trust is earned through honesty and consistency.** *Owned by Experience Principle 7 and §12.* The premium standard adds only this: trust must be actively re-confirmed, not merely never betrayed.
>
> **Premium Principle 10 — Welcoming, reassuring, family-first.** THA is a kitchen-table product. It speaks to a household, never to a user optimising themselves.
>
> **Premium Principle 11 — Premium moments are reserved for meaningful interactions.** If every interaction is a moment, no interaction is.
>
> **Premium Principle 12 — Continuous refinement, not periodic redesign.** THA improves by a thousand small corrections, never by episodic reinvention.

### 17.1 Craftsmanship over feature quantity (PP1)

- **A feature is not done when it works.** It is done when its empty state, its loading state, its error state, its slow-connection state, and its awkward edge cases have each been designed. Until then it is a demonstration, not a feature.
- **Finishing an existing surface outranks starting a new one.** Refinement and new capability compete for the same budget, and refinement often wins. This is a deliberate constraint on how fast THA grows.
- **An unfinished feature spends trust that a finished one has to earn back.** Shipping it is not neutral; it is a withdrawal.

### 17.2 Quality over novelty (PP3)

- **A new pattern must be demonstrably better than the one it replaces, not merely newer.** Novelty is a cost — every new pattern is a thing the household must learn.
- **The best compliment a THA surface can receive is that it felt obvious.** Nobody should admire the design; they should fail to notice it while getting what they came for.
- **Trends age a product; restraint does not.** THA optimises for how it will look in five years, not how it looks against this year's fashion.

### 17.3 Every interaction feels intentional (PP4)

- **Every default is a decision made on the household's behalf** — and must be the decision most of them would have made themselves.
- **Nothing appears because a screen had room. Nothing moves because motion was available.** Space is a design element; so is stillness.
- **If nobody can say why an element is there, it is not there.** "It was already in the component", "it looked empty", and "other products do it" are not reasons.

### 17.4 Remove friction before adding functionality (PP5)

- **Before any new capability is proposed, the existing path to that outcome is examined for the step that should not exist.** New functionality is the second answer, never the first.
- **A tap removed is worth more than a feature added,** because it pays every household, every time, forever.
- **A feature that works around friction preserves the friction** and adds a second thing to maintain. THA removes causes, not symptoms.

### 17.5 Reduce cognitive load (PP6)

- **The person never holds what the product could hold for them** — a number to remember, a step to keep track of, a comparison to perform in their head.
- **Choice is pre-reduced.** A sensible default, a short differentiated list, or a clear recommendation — never an undifferentiated wall of equally weighted options.
- **Consistency is a cognitive-load feature.** A person who has learned one THA surface has learned them all (§9). Every inconsistency is a small tax levied on every future visit.
- **Cognitive load is treated as seriously as contrast ratio** (§16) — because it is an accessibility concern, not a taste one.

### 17.6 Moments of delight, not constant stimulation (PP7)

- **THA's delight comes from things working beautifully** — a plan that assembles in one tap, an image that is exactly right, a sentence that says precisely the true thing. It does not come from confetti, animation, or reward mechanics.
- **Constant stimulation is the opposite of delight.** It habituates, then irritates, then erodes trust. A product that is always celebrating is a product that has nothing to celebrate.
- **Nothing in THA is engineered to be compulsive.** Delight serves the household's goal; it is never a substitute for achieving it, and never a hook to extend a session.

### 17.7 Premium through simplicity, clarity and confidence (PP8)

- **Simplicity** — the fewest elements that fully do the job. Not the fewest that look minimal; the fewest that *suffice*.
- **Clarity** — every element unambiguous on first read. Anything that needs a second look has failed, however elegant it is.
- **Confidence** — THA states what it knows plainly, without hedging, apologising, or over-explaining, and states what it does not know just as plainly (Experience Principle 7). Confidence without honesty is bluster; honesty without confidence is anxiety. THA needs both.
- **Visual excess is the signature of a product compensating for the absence of these three.** THA has nothing to compensate for.

### 17.8 Welcoming, reassuring, family-first (PP10)

- **Welcoming** — no household shape, budget, cuisine, diet, or ability is a second-class case (§16). Arriving at THA feels like being expected, not being assessed.
- **Reassuring** — the emotional baseline is *today is under control* (§4). THA never manufactures anxiety in order to motivate action; a household that is doing fine is told so.
- **Family-first** — the unit is the household, not the individual optimising themselves. THA never adopts the register of a fitness tracker, a diet app, a productivity tool, or a scoreboard.
- **Warm is not the same as informal.** THA is warm without being cute, and never trades clarity for personality. Character shows in precision and kindness, not in jokes.

### 17.9 Premium moments are reserved for meaningful interactions (PP11)

A **premium moment** — any interaction given deliberate extra care, emphasis, or acknowledgement — is earned only where something real happened for the household. The qualifying moments are few, and they are named:

- a household's **first genuine outcome** (a first plan made, a first list completed);
- the **completion of a journey that had real effort in it** (§10) — not the completion of a step;
- an **honest milestone the household would themselves recognise** as an achievement — never one manufactured to create an occasion.

Everything else — routine saves, navigations, edits, dismissals, successful loads — resolves quietly and without ceremony. And even a qualifying moment stays inside THA's calm register: **acknowledgement, not celebration theatre** (§10). Rationing is what makes these moments mean anything; a product that treats every interaction as special has abolished the category.

### 17.10 Continuous refinement, not periodic redesign (PP12)

- **A redesign is an admission that refinement stopped.** THA does not accumulate experience debt to the point of needing rescue, because rescue always costs the household their familiarity.
- **Every implementation leaves the surface it touched at least as good as it found it.** Refinement is not a scheduled project; it is a standing obligation of all work.
- **Improvement compounds because the visual language converges.** A correction to a canonical pattern improves every surface that uses it — which is why converging on the owner always beats adding a variant beside it (UI Architecture).
- **THA's identity is therefore stable across years.** Change is felt as things quietly getting better, never as the product becoming unfamiliar overnight.

### 17.11 The standard THA measures itself against — and the imitation it refuses

THA holds itself to the quality of **the world's best consumer products**: the ones people trust with their day and then stop thinking about, where nothing is unfinished, nothing shouts, and everything works the first time. That is the standard, and THA claims no discount on it for being small, young, or busy.

But the standard is **a level of craft, not a look** — and it is emphatically not a product to copy.

- **Benchmark the craft, never the artefact.** What is worth taking from a great product is its discipline: the finish, the restraint, the refusal to ship the unfinished, the willingness to remove. What is never worth taking is its colours, its components, its motion, or its voice.
- **THA's identity is its own.** A food companion for a household is not a phone, a bank, a music player, or a productivity tool, and must not sound or look like one. An imported aesthetic arrives without the reasoning that produced it, and always reads as costume.
- **Authenticity outranks aspiration.** Where the prevailing premium aesthetic (sleek, minimal, individual, aspirational) conflicts with THA's identity (warm, honest, household, kitchen-table), **THA's identity wins.** THA would rather be the best version of itself than a lesser version of something else.
- **"Would they have shipped this?" is a fair question. "What would they have made?" is not.** The first sharpens craft. The second surrenders identity.
- **The measure of premium is trust, not admiration.** THA has succeeded when a household stops noticing the product and simply eats better — not when a designer admires the screen.

### 17.12 What premium is not

Premium is most often lost by being mistaken for its symptoms. These are not premium, and none of them may be introduced in its name:

- **Not *more*.** More colour, gradient, depth, density, or motion is not more premium — it is louder. Emphasis remains a budget (§9).
- **Not motion.** Animation that exists to be noticed is decoration; animation that exists to explain a change is craft. Only the second is permitted.
- **Not ceremony.** Splash screens, celebratory interstitials, loading theatre, and "delight" that costs the person time are friction wearing a costume (PP5, PP11).
- **Not exclusivity.** Premium in THA never means gated, elite, or aspirational-by-exclusion. It is the quality *every* household receives — including the ones who pay nothing, opt out of every notification, and never open layer three.
- **Not polish over honesty.** A beautiful surface that conceals a gap is a failure, not a success. Honest absence, plainly stated, is the premium answer (Experience Principle 7, §12).

> **The premium test, in one line:** if the household would not feel the care, it is decoration; if they would feel its absence, it is craft.

## 18. UX GOVERNANCE CHECKLIST

Every future implementation that touches anything a person sees, reads, hears, or does must pass this checklist. It stands beside the Architecture Compliance Checklist in `ENGINEERING_WORKFLOW.md`; **if any check fails: STOP, explain why, do not continue until approved.**

```
□ Home unharmed
  Does Home remain the calm landing and reachable centre? Does this change add
  anything to Home that doesn't answer "how are we doing today?"

□ Progressive disclosure
  Is the essence shown first, with depth revealed only by the person's intent?
  Does any summary honestly lead to its canonical depth?

□ Calm before capability
  Is the default state of every touched surface quiet? Is new capability
  admitted without new noise (banners, badges, motion, interruptions)?

□ One primary action
  Does every touched surface have exactly one visually primary action, and is
  it the person's most likely intent (not the product's)?

□ Canonical ownership respected
  Does every displayed value come from its single owner? Does every reference
  link to the one canonical page rather than duplicating presentation,
  editing, or provenance?

□ Navigation integrity
  Is there still exactly one canonical navigation, unchanged in structure
  unless deliberately governed? Is current location always visible, and is
  Home one obvious step away?

□ Information hierarchy
  Does the surface read in the canonical order — orientation, state, primary
  action, detail, depth? Is the most important fact visible without
  interaction?

□ Journey shape
  Does the affected journey start oriented, remain interruptible and
  resumable, take the shortest honest path, and end in a restful state?

□ Companion conduct
  Do intelligent presences stay invited, dismissible, honest about limits,
  and non-repeating after dismissal? Do they suggest rather than decide?

□ Honest content
  Is nothing fabricated? Do gaps render as calm, honest absence? Can every
  score or claim explain itself on request?

□ Language
  Is every new string plain, warm, non-judgmental, and consistent with the
  one-name-per-concept vocabulary? Do buttons say what they do?

□ Errors and recovery
  Does every new failure state say what happened, protect the person's work,
  and offer a one-step way forward without blame?

□ Notifications
  Does every new interruption repay its cost, respect per-kind controls, and
  default to silence?

□ Accessibility and inclusivity
  Is the change fully usable by every means of interaction, free of
  colour-only meaning, tolerant of large text / reduced motion / more time,
  and free of assumptions about household shape or food culture?

□ Dark patterns
  Is the change free of manufactured urgency, guilt copy, confirm-shaming,
  hidden opt-outs, and friction on leaving?

  ── PREMIUM STANDARD (§17) ──────────────────────────────────────────────

□ Craft completeness
  Are the empty, loading, error, slow-connection, and edge-case states each
  designed — not just the happy path? Is this feature finished, or merely
  functional? (PP1)

□ Friction and cognitive load
  Was the existing path examined for a step that should not exist before new
  capability was added? Does the person now have to hold anything in their
  head that THA could have held for them? Is every choice pre-reduced to a
  sensible default or a short, differentiated list? (PP5, PP6)

□ Intentionality
  Can every element, default, word, space, and transition on the touched
  surface be justified out loud? Is anything present only because there was
  room, or moving only because motion was available? (PP4)

□ Premium moment discipline
  If this change adds delight, emphasis, or acknowledgement, is it attached
  to a genuinely meaningful interaction — a first outcome, a completed
  journey, an honest milestone — rather than a routine save, navigation, or
  dismissal? Does it stay in the calm register (acknowledgement, not
  celebration)? (PP7, PP11)

□ Premium without excess
  Is the change free of decorative motion, ceremony, and gradient / depth /
  density added for its own sake? Is emphasis still a budget? Is premium
  here expressed as simplicity, clarity and confidence rather than as
  *more*? (PP8, §17.12)

□ Authentic identity
  Is the change authentic to THA's warm, honest, household, kitchen-table
  character — rather than an aesthetic imported from another product whose
  reasoning does not apply here? (PP10, §17.11)

□ Refinement, not accretion
  Does this change leave the surface at least as good as it found it? Does it
  converge on the canonical pattern rather than adding a variant beside it?
  (PP3, PP12)
```

---

*Required reading before any user-facing design or implementation work.*
*Sits beside — and never overrides — the Core Architecture Principles; where experience and data/platform governance meet, ownership rules win and presentation adapts.*
*Rollback: this document is not yet committed to `HEAD` — `git checkout HEAD <path>` will therefore fail on it. To revert the EXP2 Premium Experience Principles (§17, §18 premium block) only, restore the pre-EXP2 snapshot recorded in the EXP2 implementation report. To revert the document entirely, delete the file.*
