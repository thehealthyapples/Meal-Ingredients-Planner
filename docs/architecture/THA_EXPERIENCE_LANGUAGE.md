# THA Experience Language — Governing Document

**Status:** GOVERNING ARCHITECTURE — required reading before any user-facing experience or implementation work
**Classification:** Experience Governance (canonical)
**Adopted:** 2026-07-15 (EXPLANG1)
**Enhanced:** 2026-07-15 (EXPLANG1A) — added § 4A *The Place Principles*, eight arrival-derived principles of feeling discovered during the ARRIVAL1 experience prototype, plus the review questions and anti-patterns they genuinely require. An enhancement only: no § 4 principle was rewritten and no existing guidance was duplicated.
**Enhanced:** 2026-07-15 (EXPLANG1B) — added § 3A *The Emotional Palette of THA*, the emotional temperature discovered during the Arrival prototype reviews: what THA must never feel, the seven-note palette it must always feel, the orchard as *life*, and the governing principle *"Calm must never become lifeless"* — plus the review questions and anti-patterns the palette genuinely requires. An enhancement only: § 3's seven feelings and every § 4/§ 4A principle are unchanged and unrenumbered, and no existing guidance was duplicated.
**Governed by:** [`THA_EXPERIENCE_ARCHITECTURE.md`](./THA_EXPERIENCE_ARCHITECTURE.md) (EXP1/EXP2) — **where this document and the Experience Architecture conflict, the Experience Architecture wins** (§ 2.1)
**Governing documents:** [`ARCHITECTURE_PRINCIPLES.md`](./ARCHITECTURE_PRINCIPLES.md), [`ENGINEERING_WORKFLOW.md`](./ENGINEERING_WORKFLOW.md)
**Sibling, non-overlapping:** [`THA_UI_ARCHITECTURE.md`](./THA_UI_ARCHITECTURE.md) — it owns *how THA looks*; this document owns *how THA feels* (§ 2.2)
**Related experience principles that sit within the Experience Architecture:** [`INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md`](./INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md), [`THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md`](./THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md)
**Enforced by:** the **Experience Review Questions** (§ 6), which stand beside the UX Governance Checklist (`THA_EXPERIENCE_ARCHITECTURE.md` § 18) and the UI Governance Checklist (`THA_UI_ARCHITECTURE.md` § 18) in the Experience & UI Governance Compliance block of [`ENGINEERING_WORKFLOW.md`](./ENGINEERING_WORKFLOW.md)

> **What this document is.** The governing source for how The Healthy Apples must *feel*. The Experience Architecture governs what the experience must *do*; the UI Architecture governs how it must *look*; this document governs the **feeling those two exist to produce**. It defines THA's emotional architecture — the enduring, technology-independent character every screen, journey, message, and moment of motion must create in the person using it. It names no colour, component, route, token, framework, or device; a design expressed in any of those terms is not an Experience Language decision. Every future UX decision is made under this document; a change that passes the letter of the checklists but does not produce the feeling this document requires is **not finished** — STOP, explain why, and do not continue until approved.

---

## 1. PURPOSE OF THE EXPERIENCE LANGUAGE

THA exists to help households eat better. Whether it succeeds is decided in a register beneath features and beneath layouts: the *feeling* a person has in the first two seconds and carries through every return. A household does not remember the architecture, the data model, or the animation curve. It remembers whether the product felt calm or busy, welcoming or indifferent, effortless or demanding, trustworthy or slippery. That feeling is the product, and until now it has been produced by accident — the sum of many separate decisions, each locally reasonable, none accountable to a stated emotional target.

The Experience Language exists to make that target explicit, shared, and enforceable. It is the answer to a question the other governing documents assume but never state outright: **when everything is built correctly, what should it feel like?**

This document is:

- **Enduring** — it describes a feeling that must survive redesigns, replatforms, and device generations. The feeling does not change when the technology does.
- **Governing** — no user-facing implementation may produce a feeling that contradicts it; a conflict stops work until resolved.
- **Technology-independent** — it never names a framework, library, colour, component, or screen size. It is about emotion, not implementation.

It is deliberately **not**:

- a visual style guide — colours, typography, spacing, and motion values are the UI Architecture's, and may change freely within it;
- a behaviour specification — what may interrupt a person, what a surface's primary action is, what an error must say, are the Experience Architecture's;
- a component library, a token file, or a set of animations. It defines the *feeling*; the other documents and the implementations produce it.

### 1.1 THA feels like walking into a calm kitchen at the right moment

If the whole of this document had to collapse to one sentence, it is this: **THA should feel like walking into a warm, ordered kitchen where someone who knows you has already quietly made things ready.** Not a dashboard reporting to you. Not an app competing for you. A *place* you arrive in, that expected you, that has everything to hand, and that never raises its voice. The household walks in; it does not watch a screen assemble. The product is the room, not the performance in it.

## 2. RELATIONSHIP TO THE GOVERNING ARCHITECTURE

THA's user-facing layer is now governed by three documents that divide one thing cleanly and may never trespass on one another:

| Document | Question it owns |
|---|---|
| **Experience Architecture** (EXP1/EXP2) | What the experience must **do** — behaviour, journeys, principles, the premium standard of craft |
| **UI Architecture** (UIA2) | How the experience must **look** — the Calm Orchard visual language, hierarchy, colour, type, spacing, motion vocabulary, state presentation |
| **Experience Language** (this document) | How the experience must **feel** — the emotional target that behaviour and presentation exist to produce |

The three are one experience seen from three angles: *do*, *look*, *feel*. They must agree, and where they cannot, precedence is fixed (§ 2.1, § 2.2). This document introduces no behaviour and no visual value. It names the feeling, the principles-of-feeling that produce it, and the questions and anti-patterns that check whether it was produced — and it restates neither the eight Experience Principles nor the eight UI Principles, because restating a rule creates a second owner of it, which the architecture forbids.

### 2.1 This document is subordinate to the Experience Architecture

> **The Experience Architecture governs behaviour. This document governs feeling. A feeling is produced by behaviour and presentation, never decreed over them — so where the two conflict, the Experience Architecture prevails and this document is corrected.**

The Experience Architecture's Premium Experience Principles (§ 17 there) already establish the *standard of craft* to which the experience must be built, and much of what a household feels is the perceptible result of that craft. This document does not compete with that section; it is its emotional face. Where the Experience Architecture names a behaviour (one primary action, honest absence, the companion suggests and never decides), this document names the *feeling that behaviour must create* (unhurried certainty, calm trust, an intelligence that is present without being pushy) — and adds no behaviour rule of its own. If honouring a feeling in this document would require changing a behaviour rule, a journey, data ownership, or intelligence conduct, it is no longer an Experience Language decision and must be taken to the owning architecture.

**What this document adds that letter-compliance cannot guarantee:** a change can pass every box on both checklists and still feel cold, theatrical, cluttered, or slippery — because a checklist verifies that rules were followed, not that a feeling was produced. The Experience Language is the standard that catches exactly that gap. When a surface is behaviourally correct and visually correct and *still does not feel like THA*, this document is why it is not done.

### 2.2 This document is a sibling of the UI Architecture, and never a second one

The UI Architecture owns **how THA looks** — including the one motion vocabulary (durations, easings), the Calm Orchard palette, and every state presentation. This document owns **how THA feels**, and expresses that purely as emotion and intent. The boundary is strict and load-bearing:

- This document may say *movement must feel like it is explaining a change, never performing for attention.* It may **not** say what a duration, easing, or curve is — that is UI Architecture § 11, and a value written here would be a second, un-reconcilable source of motion truth.
- This document may say *the canvas should feel like daylight in a kitchen.* It may **not** name a colour — that is UI Architecture § 7 and the Calm Orchard language (§ 4 there).
- This document may say *the shell should feel permanent, like the walls of the room.* It may **not** specify a header, a navigation component, or a layout — that is the Experience Architecture (behaviour) and the UI Architecture (presentation).

Where this document and the UI Architecture appear to conflict, they are describing the same thing from two angles and both are corrected until they agree; where a genuine conflict of *rule* remains, the UI Architecture owns the look and this document owns only the feeling, and neither may overwrite the other. Where either conflicts with the Experience Architecture, **the Experience Architecture wins** and both are corrected (§ 2.1).

### 2.3 It owns nothing runtime, and depends on nothing

This document is description, never dependency. No runtime code reads it, branches on it, or imports a value from it. It creates no component, colour, token, or route, and it retires none. Its only enforcement surface is human judgement, applied through the Experience Review Questions (§ 6) at the same gate as the two checklists. A feeling cannot be asserted by a test; it can only be checked by a person asking the right questions before shipping — which is what § 6 exists to make unavoidable.

## 3. THE FEELING THA MUST PRODUCE

Every surface, however different its job, must leave the same emotional signature. THA must feel:

- **Calm** — the baseline is quiet. Nothing shouts, pulses, or competes. The person's attention is theirs; the product borrows it only when it has something worth the cost, and returns it immediately.
- **Welcoming** — arriving feels like being expected, not assessed. Every household shape, budget, cuisine, diet, and ability is a first-class guest. The product greets; it never audits.
- **Effortless** — the next thing to do is obvious, and the product has already done everything it could on the household's behalf. The person is never asked to hold what the product could hold for them.
- **Intelligent** — the product is quietly, evidently knowledgeable. It anticipates, it prepares, it explains itself when asked — and it never performs its intelligence to be admired.
- **Reassuring** — the emotional constant is *today is under control.* The product tells a household that is doing fine that it is doing fine, and never manufactures anxiety to motivate action.
- **Premium** — everything the person touches has visibly been thought about, and nothing they touch is trying to impress them. Premium is felt as composure and finish, never as ornament, density, or expense.
- **Quietly memorable** — THA leaves a distinct, warm impression that a person could not quite point to. They remember *the feeling of the place*, not any single effect that produced it.

And it must produce all seven **without ever becoming theatrical, gimmicky, or distracting.** This is the hardest constraint in the document, because the lazy route to each feeling is its counterfeit: calm faked with emptiness, welcome faked with a splash screen, intelligence faked with animation, memorability faked with a signature effect. Every counterfeit is louder than the real thing and cheaper to build, and every one is forbidden. The test throughout: **the feeling must be a consequence of care, never a performance of it.** If a household would feel the care, it is the experience; if they would only notice the effect, it is decoration, and it is removed.

> **The one-line standard for this whole document:** *the household should remember that THA felt calm, welcoming and effortless — and be entirely unable to name a single thing that made it so.* The moment they can name the effect, the effect has become the experience, and the experience has been lost.

## 3A. THE EMOTIONAL PALETTE OF THA

This section was discovered during the **Arrival prototype reviews** (`EXP2`/`EXP3`) and admitted by governance (`EXPLANG1B`, 2026-07-15) — the way § 8 requires any governing feeling to enter. Reviewing the arrival candidates exposed a failure mode no existing section named: a surface can honour every feeling in § 3 and every principle in § 4 and still drift, prototype by prototype, toward *stillness* — misty, hushed, spa-like, beautifully dead. § 3 already forbids the loud counterfeits of calm; nothing yet forbade the quiet one. The palette closes that side.

Where § 3 names the seven feelings THA must produce, the palette names the **emotional temperature they must be produced at** — the register the whole product is played in. The two sections are one standard seen from two sides: § 3 says *what* the household must feel; the palette says the feeling must be **warm and alive**, never achieved by cooling the product down. Where a palette note deepens a § 3 feeling or a § 4 principle it **cites** it and adds only what the reviews revealed — it restates nothing, because restating a rule creates a second owner of it (§ 2, § 8).

### 3A.1 What THA must never feel

However calm, however finished, however expensive it looks, THA must **never** feel:

- **cold**
- **clinical**
- **empty**
- **silent**
- **sterile**
- **luxury for luxury's sake**
- **funeral parlour calm**
- **emotionally distant**

Each of these is calm's failure state rather than its achievement. Deliberate breathing space and honest empty states remain exactly what Principle 8 says they are — the product breathing; what this list forbids is the *temperature* those qualities are sometimes mistaken for: quiet that reads as nobody home, restraint that reads as indifference, and finish that reads as a showroom no one is allowed to live in.

### 3A.2 What THA must always feel

The palette has seven notes. Together they are the temperature of every THA surface, in every realm, in every state — including errors, empty states, and admin.

- **Calm** — never rushed, never overwhelming. (The baseline of § 3 and the discipline of Principle 2; the palette adds only that calm is a *warm* quiet, never a cold one.)
- **Warm** — like somebody has thoughtfully prepared something for you. Warmth is the felt evidence of the care § 3 defines premium as; a surface that is correct but cold has withheld it.
- **Energised** — full of life, freshness, and optimism — and never loud or busy. Energy in THA is the freshness of good food and a bright morning, not motion or noise; it is entirely compatible with calm, and the palette exists chiefly to say so.
- **Thoughtful** — the platform quietly thinks ahead for the household; it anticipates rather than interrupts. (The temperature of § 3's *intelligent* and Principle 7's manner — felt as being thought of, not as being watched.)
- **Comforting** — like sitting down with a warm cup of tea. Familiar. Relaxing. Reassuring. (The domestic warmth in which § 3's *reassuring* — "today is under control" — must land.)
- **Decisive** — quiet confidence. Recommendations feel considered rather than hesitant; the product does not hedge, waver, or hand its uncertainty to the household as homework. (Honesty about genuine unknowns is untouched — decisiveness is confidence in what *is* known, never certainty theatre, which § 7 already forbids.)
- **Curious** — the product encourages gentle exploration and invites discovery without ever demanding attention. There is always a little more to wander into, never a next thing being pushed.

> **The one-sentence feel:** THA should feel like **"a warm, lived-in home where someone has already thought about dinner."** This is § 1.1's calm kitchen with the palette's addition made explicit — *lived-in*. A home has life in it: light, warmth, food, evidence of care. A show home has none, however beautiful, and THA must never feel like one.

### 3A.3 The orchard represents life

The orchard is THA's identity (Principle 5) and its environment (Principle B). The palette fixes what the orchard *means*:

> **The orchard represents life. Not silence. Not stillness. Not decoration.**

The orchard should feel **bright · growing · healthy · optimistic · welcoming** — an orchard in morning light, in season, tended. It must never feel gloomy, misty, or melancholy: an orchard at dusk, in fog, or in mourning is still an orchard, and it is still wrong. (Whether orchard character is environment or ornament remains Principle 5's; how it is drawn remains the UI Architecture's. This note governs only the *life* the environment must carry.)

### 3A.4 Calm must never become lifeless

> **Governing principle: calm must never become lifeless. The platform should always feel alive without becoming noisy.**

This is the palette compressed to one rule, and the test the Arrival reviews proved necessary. Calm and life are not in tension — a kitchen on a bright morning is both — and THA is only THA when it is both. A surface that achieved its quiet by draining the life out is not calm; it is empty, and emptiness is on the never-feel list.

- **Good — the feeling of alive calm:** warm morning light · freshness · breathing space · optimism · quiet confidence.
- **Avoid — the feeling of lifeless calm:** empty luxury · spa-like stillness · meditation-retreat aesthetics · overly desaturated palettes · excessive silence · emotional coldness. (What a palette's actual values are is the UI Architecture's § 7; *"overly desaturated"* is named here only as a feeling — the sense that the colour of food and daylight has been bled out of the room.)

## 4. THE EXPERIENCE PRINCIPLES OF FEELING

These thirteen principles are the emotional architecture of THA. They are the *how* beneath § 3's *what*: the disciplines that produce the seven feelings. They are not a rival to the eight Experience Principles or the eight UI Principles — they are the felt result those principles exist to create, stated as emotion so that a person can check for it. Each is given five faces: **why it exists**, **how users should feel**, **practical UX implications**, **things to encourage**, and **things to avoid.** The list is governing but not closed — a fourteenth principle of feeling is admitted the same way any governing rule is (§ 7), never by shipping a surface that assumes it.

---

### Principle 1 — Arrival before information

> **A person should feel they have entered a calm place before they are asked to read, decide, or act.**

- **Why it exists.** The first two seconds set the emotional register for the whole session. A product that opens by presenting data teaches the person that THA is a report to be processed. A product that opens by letting them *arrive* teaches them it is a place they belong. The household walks in; it does not boot up.
- **How users should feel.** *"I'm here. It's calm. Nothing is being demanded of me yet."* A small exhale, not a braced inbox-scan.
- **Practical UX implications.** Orientation precedes density: identity, warmth, and place land before figures and lists. The moment of entry is composed, not assembled in front of the person; the shell is already there when they arrive, so nothing lurches into being. Where an arrival moment exists, it is a *place settling*, never a screen loading.
- **Encourage.** A composed, still first frame; a felt sense of having walked in; the most reassuring fact (today is under control) reaching the person before any detail.
- **Avoid.** Opening on a wall of numbers, cards, or notifications; content reflowing or popping in as the person watches; making arrival a gate the person must sit through (§ 5, the arrival is choreography, never a queue).

### Principle 2 — Calm over speed

> **THA should feel unhurried, and never make the person feel hurried.**

- **Why it exists.** Speed is a real virtue, but *the feeling of being rushed* is not the same as speed, and is corrosive. A product that flashes, races, and urges reads as anxious even when it is fast. Calm is the emotional luxury THA sells; it must never be traded for the appearance of pace.
- **How users should feel.** *"There's no rush. I can look, think, and decide at my own pace."*
- **Practical UX implications.** Nothing counts down, nothing expires for effect, nothing hurries the person toward a decision. Transitions are unhurried enough to be legible and never so slow they cost time. Genuine speed (fast loads, instant saves) is spent on removing waiting, not on producing a sensation of velocity.
- **Encourage.** Fast where the person is waiting; calm where the person is deciding; the product waiting patiently once it has oriented the person.
- **Avoid.** Countdown timers, "hurry" copy, urgency the product invented; racing transitions that read as frantic; confusing *responsive* (good) with *hurried* (bad).

### Principle 3 — One thought at a time

> **Each moment should ask the person to hold exactly one thing in mind.**

- **Why it exists.** Cognitive load is an accessibility concern, not a matter of taste (Experience Architecture § 16, § 17.5). A surface that presents five equal demands forces the person to do the product's prioritisation for it, and that labour is felt as stress even when it is not named.
- **How users should feel.** *"I know exactly what this is about and what to do. I'm not juggling."*
- **Practical UX implications.** One primary thought per surface, one primary action serving it; everything else is visibly subordinate and one step away. A journey presents its decisions one at a time, each with a sensible default, never scattered as accumulating small surprises. When a surface tries to hold two equal thoughts, it is doing two jobs and is split.
- **Encourage.** A clear single focus per screen; pre-reduced choices (a default, a short differentiated list, a recommendation); progressive disclosure of depth by the person's intent.
- **Avoid.** Competing primary actions; undifferentiated walls of equally weighted options; asking the person to remember a value, step, or comparison the product could have held for them.

### Principle 4 — Movement must communicate meaning

> **Every motion should feel like the product explaining a change — never performing for attention.**

- **Why it exists.** Motion is the loudest tool in the interface; it captures the eye involuntarily. Spent on meaning, it is the clearest possible way to show what just happened. Spent on decoration, it is pure noise that trains the person to distrust the next movement. (UI Architecture § 11 owns the motion *vocabulary*; this principle owns the *feeling* motion must carry.)
- **How users should feel.** *"I understood what changed, and I never noticed being shown."*
- **Practical UX implications.** Motion earns its place by doing one of a small set of jobs: confirming a state change, preserving spatial continuity so the person doesn't lose their place, or carrying one of THA's few genuine brand moments. If a motion carries no meaning, its still equivalent is used instead — and a person who has asked for reduced motion loses no meaning at all, because meaning was never in the motion alone.
- **Encourage.** Motion that answers "what just changed?"; transitions that preserve continuity; every motion having a still equivalent that carries the same meaning.
- **Avoid.** Animation that exists to be admired; movement chosen because motion was available; anything that loops, pulses, bounces, or shimmers to be noticed.

### Principle 5 — Nature is the environment, not decoration

> **The natural, orchard character of THA should feel like the room the household is standing in — never like ornaments hung on the walls.**

- **Why it exists.** THA's identity is Calm Orchard: warmth, daylight, growing things, the kitchen. That identity is powerful precisely when it is *atmosphere* — the felt quality of the place — and cheapened the moment it becomes applied graphics. Environment reassures unconsciously; decoration demands to be seen and dates within a year.
- **How users should feel.** *"This feels warm and natural,"* without being able to point to why. The orchard is sensed, not spotted.
- **Practical UX implications.** Nature lives in the canvas, the light, the space, and the calm — the ambient qualities a person feels but does not itemise. It does not live in literal illustrations sprinkled to signal "healthy," in leafy borders, or in a mascot. Realm character is a quiet whisper of place for wayfinding, never a themed costume. (Palette, illustration, and imagery *style* are the UI Architecture's; this principle governs only whether they feel like environment or like ornament.)
- **Encourage.** Warmth and naturalness carried by canvas, light, and space; the orchard as an atmosphere the person breathes; restraint that lets the food itself be the colour.
- **Avoid.** Decorative leaves, vines, or produce added to "feel healthy"; a mascot or character; nature imagery competing with content; theming a surface instead of designing it.

### Principle 6 — Light communicates warmth and welcome

> **The product should feel lit like a kitchen in the morning — warm, natural, and glad you're here.**

- **Why it exists.** Light is the fastest carrier of emotional temperature. Cold, clinical, or dark-by-default light reads as institutional and makes a household feel processed. Warm, natural light reads as home and makes them feel welcome before a single word is read. A food companion that felt clinical would contradict its own reason to exist.
- **How users should feel.** *"This feels warm. I'm welcome here."*
- **Practical UX implications.** The default atmosphere is warm daylight, not clinical white and not dramatic dark. The product's few genuine brand moments may use light the way morning sun catches a surface — once, softly, carrying warmth rather than information — never as a spotlight that performs. Light is used to *welcome*, never to alarm; alarm is reserved for genuine safety (UI Architecture § 14).
- **Encourage.** A warm, light, unhurried canvas; light used to make a moment feel welcoming; brightness that feels like daylight, not like a screen.
- **Avoid.** Clinical white or cold greys as the emotional default; dark-and-dramatic as a style choice; light effects that perform (glows, sweeps, flares) rather than warm; using brightness or colour to create anxiety.

### Principle 7 — Intelligence never interrupts

> **THA's intelligence should feel like a knowledgeable friend who waits to be asked — present, never pushy.**

- **Why it exists.** The single fastest way to make an intelligent product feel like a nagging one is to let it speak unprompted, block the person's own intent, or repeat itself. An intelligence that interrupts is experienced as management, not help — and the trust it spends is the most expensive currency THA has. (Experience Architecture § 11 owns companion *behaviour*; this principle owns the *feeling* the companion must leave.)
- **How users should feel.** *"It clearly knows things, and it's on my side — and it lets me get on with what I came to do."*
- **Practical UX implications.** Intelligence arrives inline, calm, and dismissible — never as a modal wall in front of the person's task. It speaks when spoken to, or when it has something genuinely worth the household's attention, and it never performs helpfulness to seem alive. A dismissed observation stays dismissed; nothing is repeated as if new; nothing escalates. It suggests; the person decides, always without penalty.
- **Encourage.** Insight offered calmly inline; the companion discovering and referring, then stepping back; an intelligence felt as quiet competence.
- **Avoid.** Blocking modals for observations; unprompted interruptions of the person's intent; nagging, repeating dismissed notices, or escalating; the product performing its own cleverness.

### Principle 8 — Silence and breathing space are part of the interface

> **Emptiness and space should feel deliberate and calming — the product breathing, not the product unfinished.**

- **Why it exists.** Space is THA's principal luxury and its principal calm-maker. A product afraid of empty space fills it with filler, and filler is felt as clutter, which is felt as anxiety. Confident products leave room; the room is the message. An honest empty state is one of the most reassuring things THA can show — it says *there is genuinely nothing you need to worry about here.*
- **How users should feel.** *"There's room to breathe. Nothing is crammed. The quiet feels intentional."*
- **Practical UX implications.** Breathing space is content's right, not a leftover; a surface that must remove it to fit its content has too much content and is split. Empty is a designed, calm state — a quiet honest sentence, at most one gentle action — never a hole disguised with placeholders, fake activity, or content-posing filler. Silence (no notification, no motion, no sound) is the default posture, broken only when something has genuinely earned it.
- **Encourage.** Generous, deliberate whitespace; honest, calm empty states; silence as the resting state of the whole product.
- **Avoid.** Filling space because it looked empty; placeholders posing as content; manufactured activity; treating whitespace as waste to be reclaimed.

### Principle 9 — The application shell is sacred

> **The frame of the product — its walls, doors, and floor — should feel permanent, so the person always feels oriented and safe.**

- **Why it exists.** Orientation is the product's promise: *you always know where you are, and you can always get home.* That promise is kept by a shell that never moves, never reinvents itself, and never lets a feature colonise it. A shifting frame makes even correct content feel untrustworthy, the way a room whose walls moved would. Predictability *is* the reassurance.
- **How users should feel.** *"I always know where I am and how to get home. The ground doesn't move under me."*
- **Practical UX implications.** There is one shell — one frame, one primary navigation, one way home — identical everywhere, and no surface, campaign, or feature may alter it, animate it for attention, or grow a private navigation inside it. The shell is boring on purpose. New capability is admitted *into* the existing frame at most as a quiet place in the hierarchy; it never earns a change to the frame itself. Home holds the most reachable position, always.
- **Encourage.** A frozen, dependable shell; current location always visible; Home always one obvious step away; navigation that is predictable to the point of invisibility.
- **Avoid.** Features that modify the shell, chrome, or navigation for their own prominence; adaptive navigation that reorders itself; the frame animating for attention; more than one way to do the one navigational thing.

### Principle 10 — Delight must be earned

> **A moment of delight should feel like a genuine acknowledgement of something real — never a reward dispensed to keep the person engaged.**

- **Why it exists.** Delight is meaningful only when it is rare and true. A product that celebrates every save has abolished the category of celebration, and its constant stimulation habituates, then irritates, then erodes trust. Rationing is what makes a delightful moment mean anything. (Experience Architecture § 17.9 owns *which* moments qualify; this principle owns the *feeling* delight must carry and refuse.)
- **How users should feel.** At a genuine milestone: *"That was quietly acknowledged, and it mattered."* Everywhere else: nothing at all — the interaction simply resolves.
- **Practical UX implications.** Delight is attached only to genuinely meaningful interactions — a first real outcome, the completion of a journey with real effort in it, an honest milestone the household would themselves recognise. Even then it stays in THA's calm register: acknowledgement, not celebration theatre. Everything routine — saves, navigations, edits, dismissals, loads — resolves quietly, without ceremony.
- **Encourage.** Rare, earned, calm acknowledgement of real achievement; delight that comes from things working beautifully rather than from effects.
- **Avoid.** Confetti, reward mechanics, or celebration on routine actions; delight engineered to be compulsive or to extend a session; treating every interaction as a moment.

### Principle 11 — Consistency creates trust

> **THA should feel like one product with one character, so that learning one surface is learning all of them.**

- **Why it exists.** Trust is built by predictability. When the same action looks, behaves, and feels the same everywhere, the person stops having to relearn and starts to relax — and relaxation is trust. Every inconsistency is a small tax levied on every future visit, and enough of them make one product feel like several bolted together. One concept, many names, is how a single product comes to feel like a crowd.
- **How users should feel.** *"I already know how this works — it's the same product I trusted yesterday."*
- **Practical UX implications.** The same interaction has one feeling everywhere; the same concept has one name everywhere; hierarchy, rhythm, and voice are constant across surfaces. A person who has learned one THA surface has learned them all. Convergence on the one canonical pattern always beats adding a variant beside it, because a correction to the canonical pattern improves every surface at once.
- **Encourage.** One interaction style per concept; one name per concept; a recognisable, stable character across every surface; convergence over variation.
- **Avoid.** Duplicated interaction styles for the same action; the same concept named two ways; per-surface reinvention of a solved pattern; inconsistency defended as "local optimisation."

### Principle 12 — Motion should disappear into the experience

> **Motion should be felt but not seen — the person perceives a smooth, coherent experience, never a set of animations.**

- **Why it exists.** The best motion is invisible: it does its job of showing a change or preserving continuity, and the person is left with a sense of smoothness they cannot attribute to any single effect. The moment a person notices "an animation," the motion has stopped serving the experience and started being the experience. (This is the felt counterpart of Principle 4: Principle 4 says motion must *mean* something; this says that even when it does, it must not draw attention to itself.)
- **How users should feel.** *"That felt smooth,"* with no ability to say what moved.
- **Practical UX implications.** Motion is brief, quiet, and subordinate to the content it serves; nothing animates independently for its own sake; nothing captures the scroll, the wheel, or the pointer. Choreography, where it exists, is a set of things settling into place, not a queue of effects the person watches in sequence — and it yields instantly to the person's own intent. The person owns the pace; the product never seizes it.
- **Encourage.** Motion that resolves into a coherent whole; choreography that yields to the person the instant they act; smoothness that is felt, not itemised.
- **Avoid.** Scroll-jacking, parallax, and pointer-hijacking; components animating independently to be noticed; sequences the person must watch; motion so present it becomes the thing they remember.

### Principle 13 — The user should remember the feeling, not the animation

> **What lingers should be that THA felt calm, welcoming, and effortless — never a specific effect, transition, or flourish.**

- **Why it exists.** This is the principle all the others serve, and the truest test of them. An experience succeeds when the household stops noticing the product and simply eats better; it fails, however impressive it looked, when what they remember is a screen. Admiration is not the goal — trust is. A memorable effect is a liability; a memorable *feeling* is the entire point.
- **How users should feel.** Later, away from the product: *"THA is calm and easy — I trust it,"* with no particular screen or animation in mind.
- **Practical UX implications.** Every candidate effect is judged by what it leaves behind: does it deepen the *feeling* of calm competence, or does it make itself the memory? If removing it would leave the experience feeling the same or calmer, it is removed. The measure of a premium THA moment is that the person felt cared for and cannot say how — the care was in the finish, not in a flourish they could point to.
- **Encourage.** Effects that dissolve into an overall feeling; refinement judged by the impression that lasts; the best surface being the one nobody admires because they were busy getting what they came for.
- **Avoid.** Signature effects designed to be remembered; flourishes that become the product's identity in the person's mind; optimising for the screenshot rather than the memory; mistaking "impressive" for "good."

## 4A. THE PLACE PRINCIPLES — WHAT THE ARRIVAL TAUGHT

These eight principles were discovered in practice, during the **Arrival experience prototype** (`ARRIVAL1`), and admitted to this document by governance (`EXPLANG1A`) — the way § 8 requires any principle of feeling to enter, never by a surface quietly assuming it. They do **not** replace or renumber the thirteen Principles of Feeling in § 4; they are the same emotional architecture seen from the one angle the prototype forced into focus: **THA as a *place* a household arrives in and moves through, not a set of pages it operates.** § 1.1 already collapses the whole document to *walking into a calm kitchen*; these principles are the discipline that keeps that literal.

Several of them deepen a § 4 principle rather than introduce a new one. Where they do, they **cite** that principle and add only what the arrival revealed — they never restate it, because restating a rule creates a second owner of it (§ 2, § 8). And like all of § 4, they own **feeling** only: where one touches on behaviour it defers to the Experience Architecture, and where one touches on a visual or motion value it defers to the UI Architecture. Neither boundary is crossed here.

---

### Principle A — The THA Promise

> **THA exists to reduce the invisible stress of everyday family food decisions — so every experience must leave the household with *less* to carry, not more.**

- **Why it exists.** This is the purpose beneath the purpose. § 1 states that THA exists to help households eat better; the Promise states what being helped must *feel* like — the daily, unspoken weight of *what's for dinner, is it good for them, what do we need, have we got it* lifted a little on every visit. A change can add a capability, work perfectly, and still break the promise, because it billed its cost back to the household as new effort, new decisions, or new worry.
- **How users should feel.** *"I'm thinking about food less, and enjoying it more — we have more time to just eat together."*
- **Practical UX implications.** Every design decision is measured against three questions: does it **reduce effort**, does it **increase confidence**, and does it **give time back** to the household? A decision that fails all three is weight wearing the costume of a feature, and the burden of proof is on keeping it.
- **Encourage.** Effort removed on the household's behalf; confidence given plainly and early; time returned to the table.
- **Avoid.** Capability whose real cost is paid by the household in new work or new anxiety; measuring success by engagement or time-in-product rather than by stress removed.

### Principle B — THA is a place

> **The orchard is not decoration; it is the environment the platform lives inside. A household moves between *places* within one familiar home — never between disconnected pages.**

- **Why it exists.** This extends **Principle 5** (nature is the environment, not decoration) and makes § 1.1 literal. A page-shaped product is a stack of documents you open in turn; a place-shaped product is somewhere you *are*, and stay, as you move. That difference is felt as belonging. Principle 5 established that the orchard is the room and not an ornament in it; this principle carries the same truth to the whole product — every realm is a room in one home, and moving between them is walking through the house, not loading the next file.
- **How users should feel.** *"I'm somewhere — and I'm still somewhere when I move."*
- **Practical UX implications.** Movement between realms preserves the sense of one continuous home; the person is carried from room to room, never handed a fresh, unrelated document. (What a transition *is* — its duration, easing, and motion — is the UI Architecture's § 11; that it must *feel* like moving through one place is this principle's.)
- **Encourage.** Continuity of place across every realm; a single home the person never leaves while inside the product.
- **Avoid.** Realms that feel like separate apps bolted together; navigation that reads as opening unrelated documents; the orchard flattened into a backdrop image instead of being the room itself.

### Principle C — Arrival before work

> **Emotional arrival always precedes functional interaction. The household arrives first and works second — a welcome is never combined with a workload.**

- **Why it exists.** This sharpens **Principle 1** (arrival before information) to the harder line the arrival prototype exposed: not only must arrival precede information, the *moment* of welcome must not also be a moment of work. A greeting laid on top of a task is neither — a person cannot arrive and labour in the same breath, and asked to do both they do neither well. Arrival is a beat; work is a later beat; the two must not be fused into one.
- **How users should feel.** *"I was welcomed — and then I got to work. Not both at once."*
- **Practical UX implications.** The welcome beat carries no task and demands nothing; the first action waits until the person has arrived. (That arrival is shown once per session and yields instantly to intent is **behaviour**, owned by the Experience Architecture; the *feeling* that welcome and work are never the same beat is this principle's.)
- **Encourage.** A clean seam between arriving and working; a welcome that asks for nothing at all.
- **Avoid.** Greetings stapled onto forms; onboarding disguised as a welcome; a first surface that demands work in the name of hello.

### Principle D — Walking, not scrolling

> **Scrolling should feel like gentle movement through one continuous place — never like changing slides or paging between disconnected screens. Movement always reinforces place.**

- **Why it exists.** Scrolling is the most frequent motion a household makes, so it is where the sense of place is most often won or lost. If each scroll feels like flipping to an unrelated slide, place dies by a thousand small cuts; if it feels like walking further into the same room, place is renewed every second. This is the constructive counterpart of **Principle 12**: Principle 12 forbids motion that *seizes* the scroll; this principle asks that the scroll the person still owns *feel* like moving through somewhere real.
- **How users should feel.** *"I'm moving through this place"* — never *"I'm advancing through screens."*
- **Practical UX implications.** Content flows as a continuous environment the person moves through at their own pace; nothing resets the sense of place on scroll, and nothing snaps, paces, or hijacks the scroll (that would be scroll-jacking, forbidden by § 7 and Principle 12). The environment simply continues.
- **Encourage.** Continuous, self-paced movement; a place that persists and deepens as the person moves through it.
- **Avoid.** Full-bleed slide decks that page one screen at a time; abrupt context resets on scroll; anything that makes moving feel like navigating between separate documents.

### Principle E — The application shell is constant

> **The header, navigation, and shell create confidence through familiarity: the experience changes, the shell reassures. Emotional experimentation must never be allowed to alter the canonical shell.**

- **Why it exists.** This is **Principle 9** (the application shell is sacred) seen through the one temptation the arrival prototype created and refused. A beautiful new arrival is exactly the kind of *emotional* work that wants to touch the frame — and the prototype held its shell **byte-identical** to the live Home precisely to prove it need not. Principle 9 owns the whole rule; this principle adds only its arrival-specific edge, and defers to Principle 9 for everything else rather than restating it.
- **How users should feel.** (As Principle 9.) *"The ground doesn't move under me, even here."*
- **Practical UX implications.** Everything Principle 9 requires, plus one named guard: an emotional or experimental surface — an arrival, a celebration, a seasonal moment — earns **no** exception to the shell's constancy. The experience *inside* the frame may be as ambitious as it likes; the frame stays exactly what it is on every other surface. (Shell *structure* is the Experience Architecture's behaviour and the UI Architecture's presentation; this governs only the *feeling* of an unshakeable frame.)
- **Encourage.** Emotional ambition spent entirely inside the frame; the shell identical beneath even the most expressive surface.
- **Avoid.** An arrival, campaign, or experiment that restyles, animates, or reflows the canonical header or navigation for its own effect.

### Principle F — Light has meaning

> **Light carries meaning — welcome, warmth, calm, clarity, optimism — and never spectacle, decoration, or gimmick.**

- **Why it exists.** This deepens **Principle 6** (light communicates warmth and welcome) by naming *what* light is permitted to mean and, more importantly, what it must never become. The arrival prototype's single sunrise sheen is the whole boundary in miniature: light used once, softly, to mean *morning — you're welcome here* — and forbidden the instant it becomes a light *show*. The permitted meanings of light are exactly five: **welcome · warmth · calm · clarity · optimism.** Nothing else.
- **How users should feel.** *"It feels like morning light in a kitchen"* — never *"look at that effect."*
- **Practical UX implications.** Light warms, clarifies, and welcomes; it never performs. A light *moment* is permitted only when it carries one of the five meanings and then disappears into the feeling; a glow, sweep, or flare that exists to be admired is spectacle, and is removed. (Actual light values, gradients, and the motion of any light moment are the UI Architecture's §§ 7 and 11; this governs only what light is *for*.)
- **Encourage.** Light that means welcome and clarity; at most one restrained brand light moment that reads like morning sun — once, softly, carrying warmth rather than attention.
- **Avoid.** Light as spectacle — glows, sweeps, flares, or shimmer that mean nothing and exist to impress; light used to alarm outside genuine safety (Principle 6).

### Principle G — Home is not the dashboard

> **Home is the emotional place where the household arrives. The dashboard is only the first workspace within that home. Every future workspace must preserve this distinction.**

- **Why it exists.** The arrival prototype made the distinction concrete: you arrive at a *place*, and the workspace is simply where you land. Collapsing the two turns the household's home into a data screen — and a data screen is something you *check*, not somewhere you *belong*. Home is the emotional centre; the dashboard is one room inside it. Which surface is Home, and what it must *do*, is the Experience Architecture's; this principle owns only the *feeling* that Home is a place and the dashboard is a room within it.
- **How users should feel.** *"I came home"* — never *"I opened my dashboard."*
- **Practical UX implications.** Home carries the arrival, the sense of place, and the calm; the dashboard — and every workspace added after it — is a room reached from within that home, never the home itself. As more workspaces arrive, each is a room, and Home remains the place they are rooms *in*.
- **Encourage.** Home felt as arrival and belonging; each workspace felt as a room within it.
- **Avoid.** Home rebuilt as a metrics dashboard; treating *Home* and *the dashboard* as the same thing; a new workspace that claims to be the home rather than a room in it.

### Principle H — Premium through restraint

> **Premium is the result of restraint, not addition. Its governing test: *if the person notices the animation before they notice the content, the animation has failed.***

- **Why it exists.** The arrival prototype is, in effect, an entire feature built to prove that the most premium version of a moment is the most restrained one — a welcome that lingers and recedes, a single soft sheen, one gentle glide, and nothing else. Premium in THA is reached by *subtraction*: the care shows precisely because nothing is showing off. This states the test that operationalises three things already established — **Principle 13** (remember the feeling, not the animation), **Principle 12** (motion disappears into the experience), and § 3's definition of premium as composure and finish — without restating any of them.
- **How users should feel.** *"This feels expensive, and I couldn't tell you why."*
- **Practical UX implications.** Movement quietly supports understanding; it never competes for attention. The test is kept as one line so it can be quoted in review and settle the question without re-litigation: *if users notice the animation before they notice the content, the animation has failed.* When in doubt, remove — premium is what remains.
- **Encourage.** Premium reached by taking away; motion that supports understanding and is never the first thing seen.
- **Avoid.** Adding effect to *signal* quality; any movement the eye reaches before the content it serves.

## 5. THE CANONICAL EXPERIENCE RHYTHM

Every THA experience — a whole session, a single surface, or one journey — moves through the same six-beat rhythm. The rhythm is the emotional shape of *being helped*: you arrive, you get your bearings, you feel you can trust what you see, you act, you understand what happened, and you are left at rest. Skipping a beat is felt as a jolt; lingering too long on one is felt as friction. The beats are not screens or steps — they are emotional states the experience passes through, sometimes in seconds.

> **Arrival** → **Orientation** → **Confidence** → **Action** → **Understanding** → **Completion**

| Beat | The feeling it must produce | What it does |
|---|---|---|
| **Arrival** | *"I'm here, and it's calm."* | The person enters a composed, warm place before anything is demanded of them (Principle 1). |
| **Orientation** | *"I know where I am and what this is."* | Identity, place, and current state land — the person's bearings, before detail. |
| **Confidence** | *"I can trust what I'm seeing."* | The state reads as honest and under control; evidence is available; nothing feels fabricated or uncertain-in-disguise. |
| **Action** | *"I know the one obvious thing to do, and it's easy."* | The single primary action is clear and effortless; everything the product could prepare, it already has. |
| **Understanding** | *"I know what just happened and what it means."* | The result of the action is shown honestly and calmly — the change explained, not merely performed. |
| **Completion** | *"That's done. I'm at rest."* | The experience resolves to a calm, restful state — never a dead end, never an upsell, never an immediate demand for the next task. |

The rhythm is fractal: a whole session runs it once (arrive at Home … complete the evening's plan), and every surface inside that session runs it again in miniature. Below, the rhythm is applied to each of THA's realms. In each, the beats keep their meaning; only their content changes.

### 5.1 Home
- **Arrival** — the session's true arrival: the household walks into a calm, warm place that expected them.
- **Orientation** — *"how are we doing, and what's next?"* answered at a glance, reassuringly.
- **Confidence** — today reads as under control; the reassurance is honest, never manufactured.
- **Action** — one gentle, obvious next thing (open today's plan, add tonight's meal), never a wall of options.
- **Understanding** — acting moves the person to that thing's canonical place, where the change is understood.
- **Completion** — the person returns to Home, the calm centre, at rest. Home is where every journey ends as well as begins.

### 5.2 Planner
- **Arrival** — the week opens as a calm, ordered surface, not a spreadsheet demanding entries.
- **Orientation** — *"here is the week, here is what's planned, here are the gaps."*
- **Confidence** — the plan reads as trustworthy; suggestions show they are grounded, not invented.
- **Action** — one obvious move at a time (fill this slot, accept this suggestion), each with a sensible default.
- **Understanding** — the plan visibly updates; the person sees exactly what changed and why.
- **Completion** — the week resolves to *"the plan is made"* — a restful, finished state, not a prompt to do more.

### 5.3 Cookbook
- **Arrival** — a warm, appetising place that feels like browsing a shelf, not querying a database.
- **Orientation** — *"here is what I can cook,"* with the food itself carrying the warmth.
- **Confidence** — meals feel real and honestly presented; nothing over-claims; unknowns render as honest absence.
- **Action** — one clear intent per meal (cook it, plan it) — the person's most likely intent, never the product's.
- **Understanding** — choosing a meal leads calmly to its one canonical page, where everything about it lives.
- **Completion** — the meal is planned or begun; the person returns to browsing or to Home, at rest.

### 5.4 Shopping
- **Arrival** — a calm, ready list, not an anxious tally.
- **Orientation** — *"here is what you need, organised the way you'll shop."*
- **Confidence** — the list reflects the plan honestly; quantities and items feel trustworthy and complete.
- **Action** — one uninterrupted flow: work through the list; the product stays out of the way.
- **Understanding** — progress is quietly visible; the person always knows how much remains.
- **Completion** — the list is done — a quiet, satisfying, complete state, with no upsell at the finish line.

### 5.5 Nutrition
- **Arrival** — an unhurried, non-judgemental place; the person is met from where they are, never assessed.
- **Orientation** — the one score or fact that matters, in plain language, before any depth.
- **Confidence** — every figure can show its working; confidence is rendered exactly as strong as the evidence — no precision theatre.
- **Action** — at most one gentle, optional next step; nutrition informs, it never nags or moralises.
- **Understanding** — depth (methodology, evidence, provenance) is available to whoever asks, imposed on nobody.
- **Completion** — the person leaves informed and calm, never guilted, never behind on a target the product invented.

### 5.6 Pantry
- **Arrival** — a calm, ordered store; a sense of *what we have*, not a chore list.
- **Orientation** — *"here is what's in the house,"* legible at a glance.
- **Confidence** — the pantry's state feels accurate; staleness or uncertainty says so plainly rather than posing as current.
- **Action** — one easy motion at a time (mark used, add an item); low-friction upkeep, never bookkeeping.
- **Understanding** — changes reflect immediately and honestly; the person sees the store update.
- **Completion** — the pantry is up to date; the person returns to their day, at rest.

### 5.7 Companion
- **Arrival** — the companion is present and calm, waiting to be addressed; it never pounces on entry.
- **Orientation** — it makes clear what it can help with, plainly and without performance.
- **Confidence** — it is honest about what it knows and does not know; it never fakes certainty, memory, or emotion.
- **Action** — it discovers and refers, handing the person to the one canonical place to see, edit, and act.
- **Understanding** — it summarises what it found and why, in warm, plain language.
- **Completion** — it steps back. The exchange resolves; the companion does not linger, nag, or manufacture a next turn.

### 5.8 Household
- **Arrival** — a warm place that treats the household as it is — every shape first-class, none the "default."
- **Orientation** — *"here is who's in the household and what THA knows,"* clearly and respectfully.
- **Confidence** — data feels owned by the household; what THA knows is visible, correctable, and honest, with no dark corners.
- **Action** — one clear change at a time (add a member, set a preference), each guarded proportionally to its consequence.
- **Understanding** — the effect of a change is shown plainly, including how it will shape future guidance.
- **Completion** — the household settings rest in a clear, trusted state; nothing irreversible ever happened as a side effect.

### 5.9 Admin
- **Arrival** — the same calm shell and character as everywhere; administrative surfaces are not exempt from Calm Orchard or from this rhythm.
- **Orientation** — *"here is the system's state,"* legible and honest, in the same one voice.
- **Confidence** — figures are trustworthy and show their source; the surface never fabricates completeness or optimistic status.
- **Action** — one clear operation at a time; destructive operations guarded proportionally and never as a side effect.
- **Understanding** — the outcome of an operation is stated plainly, with honest success and honest failure.
- **Completion** — the task resolves to a calm, clear state. Admin is quieter and denser by necessity, but never louder, never anxious, and never a second product.

> **The rhythm is a diagnostic, not a script.** A surface that feels wrong can almost always be traced to a missing or malformed beat: it opens on information with no arrival; it presents an action before the person is oriented; it asks for confidence it has not earned; it completes into a dead end or an upsell instead of rest. When a surface feels off and no checklist catches why, walk it through the six beats and find the one that is missing.

## 6. EXPERIENCE REVIEW QUESTIONS

Every future UX implementation is evaluated against these questions **before it is considered complete.** They are the enforcement surface of this document. They do not replace the UX Governance Checklist (`THA_EXPERIENCE_ARCHITECTURE.md` § 18) or the UI Governance Checklist (`THA_UI_ARCHITECTURE.md` § 18) — they stand beside them and ask the one thing a checklist cannot: *did this produce the right feeling?* A change can pass both checklists and fail here, and if it fails here it is not done.

**If the honest answer to any question is wrong: STOP, explain why, and do not continue until the surface is corrected or the exception is approved.**

```
── ORIENTATION & CALM ──────────────────────────────────────────────────
□ Does the eye know where to look first?
□ Does the person feel they have arrived somewhere calm before being asked
  to read, decide, or act?
□ Does this feel calmer than before? (If it is not calmer, why is it here?)
□ Is one thought being asked of the person at a time?
□ Does the quiet on this surface feel intentional — the product breathing —
  rather than unfinished?

── EFFORT & CLARITY ────────────────────────────────────────────────────
□ Does this reduce cognitive load? Does the person now have to hold anything
  the product could have held for them?
□ Is the one obvious next thing genuinely obvious, and genuinely easy?
□ Would a household member who has never seen this surface still know what it
  is and what to do, within two seconds?

── MOTION & DELIGHT ────────────────────────────────────────────────────
□ Does any animation exist only because it looks impressive?
□ Does every motion communicate a real change, and does it disappear into the
  experience rather than becoming the thing the person notices?
□ Would removing an effect improve — or fail to harm — the experience?
  (If removing it changes nothing the person would feel, remove it.)
□ If this adds delight, is it attached to a genuinely meaningful moment, and
  does it stay in THA's calm register?

── INTELLIGENCE & TRUST ────────────────────────────────────────────────
□ Does the product's intelligence feel present without ever being pushy?
□ Does everything shown feel honest — nothing fabricated, nothing more certain
  or complete than the truth behind it?
□ Does the person end this in a restful state, not a dead end or an upsell?

── IDENTITY & ENDURANCE ────────────────────────────────────────────────
□ Is this recognisably THA — the same calm, warm, kitchen-table character as
  every other surface?
□ Does the shell feel untouched, permanent, and dependable?
□ Would this still feel premium in five years, or is it wearing this year's
  fashion?
□ Will the person remember the feeling rather than a specific effect?
□ Would the household feel the care here — or only notice the effect? (Care is
  the experience; a noticed effect is decoration.)

── PLACE & PROMISE (§ 4A) ──────────────────────────────────────────────
□ Does this reduce the household's invisible stress — less effort, more
  confidence, more time back — rather than adding any? (Principle A)
□ Does the person move through THA as one continuous place — scrolling like
  walking, realms like rooms — never paging between disconnected screens?
  (Principles B, D)
□ Was the moment of welcome kept free of work — arrival first, task second,
  never a greeting stapled to a workload? (Principle C)
□ If this is Home, does it still feel like the place the household arrives —
  not merely a dashboard? (Principle G)

── WARMTH & LIFE (§ 3A) ────────────────────────────────────────────────
□ Does this feel warm as well as calm — or has the calm been achieved by
  cooling it down?
□ Does this space feel alive — bright, fresh, optimistic — rather than still,
  misty, or hushed?
□ Would a family feel welcomed here — not merely impressed?
□ Does this feel like somewhere you would enjoy spending time, rather than
  somewhere you admire and leave?
```

## 7. EXPERIENCE ANTI-PATTERNS

These are behaviours THA must **never** adopt, in any surface, for any reason, however well-executed. They are named so they can be pointed at in review and rejected without re-litigation. Each is the counterfeit of a feeling in § 3 — the loud, cheap route to an impression THA must instead earn quietly.

- **Decorative animation.** Motion that exists to be admired rather than to explain a change. It is noise wearing the costume of craft (Principles 4, 12).
- **Unnecessary parallax.** Layered depth-on-scroll that performs sophistication and communicates nothing. It captures the eye, contradicts calm, and dates fast.
- **Motion without meaning.** Any movement that does not confirm a change, preserve continuity, or carry a genuine brand moment. If it has no still equivalent, it had no meaning.
- **Attention seeking.** Pulsing, glowing, bouncing, badging, or shouting to be noticed. Emphasis is a budget; anything that grabs attention it did not earn has stolen it from what needed it (Principle 2, 7).
- **Visual noise.** Filler, ornament, density, and decoration crowding out the content and the space. A surface that fears empty space fills it with anxiety (Principle 8).
- **Duplicated interaction styles.** The same action or concept behaving or looking two different ways in two places. Each duplicate makes one product feel like several and taxes every future visit (Principle 11).
- **Inconsistent spacing.** Rhythm that changes surface to surface, so the product feels assembled from parts rather than made as one. Consistency of rhythm is felt as calm; its absence is felt as unease.
- **Inconsistent hierarchy.** The same kind of thing emphasised differently in different places, so the person must relearn where to look each time. Hierarchy is the product's most repeated promise; breaking it breaks trust quietly.
- **Marketing-style gimmicks inside functional workspaces.** Splash screens, celebratory interstitials, loading theatre, hype copy, exclamation urgency, or "delight" that costs the person time — friction wearing the costume of premium. The working product is never a campaign (Principles 2, 10).
- **Fabricated feeling.** Calm faked with emptiness, welcome faked with a splash screen, intelligence faked with animation, memorability faked with a signature effect, certainty faked with precision theatre. Every counterfeit in § 3 is an anti-pattern; the feeling must be a consequence of care, never a performance of it.
- **Seizing the person's pace or place.** Scroll-jacking, pointer-hijacking, unskippable sequences, and any choreography the person cannot interrupt the instant they act. The person always owns the pace; a welcome you cannot get past is a toll (Principles 2, 12).
- **A shell that performs.** Chrome, navigation, or the frame animating, reordering, or reinventing itself for prominence. The frame is sacred; a moving frame makes even correct content feel untrustworthy (Principles 9, E).
- **Paging instead of walking.** Movement that makes the household feel it is advancing through disconnected slides or documents rather than moving through one continuous place. It is the opposite failure to scroll-jacking — and just as corrosive to the sense of home (Principle D).
- **Home reduced to a dashboard.** Treating the household's place of arrival as a metrics screen — collapsing the home into one of its rooms. A dashboard is checked; a home is belonged to (Principle G).
- **A welcome that is also work.** A greeting fused with a task, so the household must labour at the very moment it should simply arrive. Arrival and work are different beats and must never be made the same one (Principle C).
- **Calm becoming lifeless.** Quiet achieved by draining the life out — stillness, hush, and desaturation posing as serenity. It is the *quiet* counterfeit of calm, exactly as forbidden as the loud ones (§ 3A.4).
- **Clinical minimalism.** Emptiness and sterility wearing the costume of elegance. Principle 8's breathing space is content's room to breathe; this is the room with the furniture removed — reduction pursued until nothing warm survives it (§ 3A.1).
- **Cold luxury.** Premium executed as expense, exclusivity, or showroom polish rather than as care — luxury for luxury's sake. It impresses and does not welcome, which inverts what § 3 defines premium to be (§ 3A.1).
- **Emotionally distant experiences.** Surfaces that are behaviourally and visually correct but feel like nobody is home — no warmth, no anticipation, no evidence anyone thought about this household. Correctness without care is not THA (§ 3A.2).
- **Beautiful but unwelcoming interfaces.** A surface built to be admired rather than lived in — a show home. If the honest reaction is *"impressive"* rather than *"I'm glad to be here,"* the beauty is working against the product (§ 3A.2).

> **The anti-pattern test, in one line:** if a thing would make a person *notice the product* rather than *feel at home in it*, it is an anti-pattern — no matter how well it is made.

---

## 8. GOVERNANCE AND ADMISSION

- **This document is governing architecture.** Every user-facing implementation is made under it. It is required reading in the Architecture Bootstrap alongside the Experience and UI Architectures, and its Experience Review Questions (§ 6) are part of the Experience & UI Governance Compliance gate in `ENGINEERING_WORKFLOW.md`.
- **A new principle of feeling, or a new anti-pattern, is admitted by governance, never by shipping.** § 4's thirteen principles and § 7's anti-patterns are governing but not closed; a fourteenth enters the way any governing rule does — named, checked for conflict against this document and its two governors, and added deliberately — not by a surface quietly assuming it. **§ 4A's eight Place Principles were admitted exactly this way** (`EXPLANG1A`, 2026-07-15): discovered in the ARRIVAL1 prototype, checked for conflict and duplication against § 4, and added by governance — they deepen the thirteen without renumbering or replacing them. **§ 3A's Emotional Palette was admitted the same way** (`EXPLANG1B`, 2026-07-15): discovered in the Arrival prototype reviews (`EXP2`/`EXP3`), checked for conflict and duplication against § 3 and § 4, and added by governance — it fixes the temperature of § 3's seven feelings without rewriting any of them.
- **This document owns feeling and nothing else.** It defines no colour, component, token, route, or motion value, and retires none. It creates no runtime dependency. Where it appears to define look or behaviour, that is a defect in this document to be corrected toward the UI Architecture or the Experience Architecture respectively.
- **Precedence, stated once.** Experience Architecture (behaviour) > this document (feeling) > and beside it the UI Architecture (look), which this document never overrides and which never overrides it. Any conflict resolves upward to the Experience Architecture, and both subordinate documents are corrected.

---

*Required reading before any user-facing experience or implementation work.*
*Subordinate to the Experience Architecture: it governs how THA feels; the Experience Architecture governs how THA behaves, and prevails in any conflict. Sibling to the UI Architecture, which governs how THA looks.*
*Rollback: this document only — `git checkout HEAD docs/architecture/THA_EXPERIENCE_LANGUAGE.md` will fail until it is committed; to revert before commit, delete the file. Rollback tag for the EXPLANG1 workstream (original document): `rollback/EXPLANG1-tha-experience-language-20260715` → `0f0615aa`. Rollback tag for the EXPLANG1A enhancement (§ 4A and its review questions / anti-patterns): `rollback/EXPLANG1A-experience-language-enhancements-20260715` → `b7ddc442`. Rollback tag for the EXPLANG1B enhancement (§ 3A, the Emotional Palette, and its review questions / anti-patterns): `rollback/EXPLANG1B-emotional-palette-20260715` → `b3c650cd`.*
