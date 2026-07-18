# COMP1 — The Companion's Visual Identity

**Locking the Companion as the embossed THA apple — a permanent part of the design language, not another AI chat widget.**
Design specification + concept prototype. **No behavioural or AI logic changes.** App source byte-untouched.

| | |
|---|---|
| **Session** | `COMP1_Companion_Visual_Identity` |
| **Date** | 2026-07-17 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `rollback/COMP1-companion-visual-identity-20260717` → `7bfad50c` (tag `comp1-wip-snapshot-7bfad50c`); **refinement pass:** tag `comp1-emblem-refinement-rollback-20260717` → working-tree snapshot `9a9ae977` |
| **Status** | **Decisions locked; emblem refined (§ 4.5). Awaiting ratification of one governance amendment before the halo ships.** |
| **Product changed** | **None.** The spec + interactive prototype + before/after comparison. `FloatingAssistant.tsx` and all Companion behaviour untouched. |

---

## 1. What this locks, and what it does not touch

**Locks:** the Companion's **visual identity and its interaction language** — what it *is* (the embossed
THA apple), what its button looks like, and how it behaves across idle · aware · speaking · listening.
These are fixed here as a permanent part of THA's design language.

**Does not touch:** any behaviour or AI logic. The Companion's reasoning, its notices, its conversation,
the `useCompanionNotices` data, the Radix dialog it opens, its withheld-channel timing — all unchanged.
This document changes *how the Companion looks and feels*, never *what it does or says*.

**Continues** the design line already drawn: BRAND1 found *the arch is the apple, opened to the size of
a home*; BRAND2 refined that apple into **"The Pressed Apple"** — an apple pressed into the plaster,
tone-on-tone, found by the light. COMP1 takes exactly that language and presses the same apple into the
Companion's button, so the friend at the counter is signed with the house's own mark. **One apple,
three scales: the arch you walk toward, the mark in the wall, the button you reach for.**

---

## 2. The ten locked decisions

| # | Decision | Locked as |
|---|---|---|
| 1 | The Companion is the **single embossed THA apple**. | The launcher carries the canonical apple mark (BRAND2), nothing else. |
| 2 | **Not** a chat icon, sparkle, robot, or speech bubble. | The current `MessageSquare` chat-bubble icon is **retired** (§ 3). |
| 3 | A **soft sage-green circular button** in THA's material language. | `--primary` sage, `rounded-full`, the same material (light-washed surface, inset rim, soft shadow) as the room's oak/plaster/ivory. |
| 4 | The apple is **embossed into** the button — depth, not flat. | A two-rim deboss (dark rim up, lit rim down), the Pressed-Apple physics, on sage instead of plaster. |
| 5 | **Calm when idle.** | No halo, no badge, no motion. The friend at rest. |
| 6 | A **gentle breathing halo of light** when it has something meaningful to say. | The "aware" state (§ 4.2). Requires the one governance amendment (§ 7). |
| 7 | The glow is **presence, never urgency** — no badges, counts, or attention-grabbing animation. | Sub-threshold, warm, breathing; no number, no red, no bounce, no colour-alarm. |
| 8 | On open, the **light draws inward** before the Companion appears. | The open sequence (§ 5): halo pulls in (400 ms), panel arrives a beat later (+140 ms). |
| 9 | The Companion feels like a **permanent architectural element**, not an overlay added afterward. | Built from the house's own material and light; a constant of the shell, in the same place in every room (§ 6). |
| 10 | Use the **same embossed-apple language** established elsewhere for one coherent identity. | The BRAND2 "Pressed Apple" mark and its emboss physics, reused verbatim — one house, one signature. |

---

## 3. The current state (what is being replaced)

Today the launcher is `client/src/components/conversation/FloatingAssistant.tsx:1449` — a 48 px
`rounded-full` button, `bg-primary text-primary-foreground shadow-lg`, fixed bottom-right, showing a
**`MessageSquare` chat-bubble icon** (line 1500) that rotate-swaps to an `X` when open. There is **no**
presence indicator on it; the notice data (`useCompanionNotices` → `notices[]`, `trust.gatheredCount`)
exists but is **not wired to the button**.

The chat bubble is precisely *"another AI chat widget"* — the generic signifier the mission rejects. The
sage circle and its placement are already right and are **kept**; only the *icon* (→ embossed apple), the
*material depth* (→ emboss), and the *presence language* (→ aware halo, calm idle) change.

---

## 4. Refined interaction specification — the four states

The Companion has exactly four visual states. Each is a **material or light** condition of the one
button — never a new element, never a badge.

### 4.0 The button itself (constant across all states)
A 48 px sage-green circle in the house's material language:
- **Fill:** `--primary` sage (`132 14% 44%` light · `132 14% 52%` dark), as a soft top-lit surface — a
  radial morning-light at the top over a gentle vertical body, the same way the oak console is lit from
  the arch above.
- **Rim:** an inset light line at the top and an inset shade at the bottom (the material has a lip), plus
  a soft drop shadow — solidity that says *furniture*, not sticker.
- **The apple, carved in:** the **canonical THA single apple** (`client/src/assets/icons/tha-apple.png` —
  the same mark `ThaAppleIcon` uses across the product), sized to **~80 %** of the button with a balanced
  sage rim, carved into the surface as a deep **recess**. It is a **three-layer intaglio** of the one apple
  silhouette: a **contact shadow** (the apple sits *sunk* in the material, not printed on it), the **recess
  face** (an interior gradient — darker sage at the shadowed top, light pooling toward the lit lower lip),
  and rim relief — a **dark rim along its top** and a **lit rim along its bottom**, lit from the arch's one
  morning, exactly like the Pressed Apple in plaster. Depth you could feel with a fingertip, not a printed
  glyph. The apple is decorative (`aria-hidden`); the button carries the accessible name. **The button *is*
  the apple** — a green disc containing an icon is precisely what this retires.

### 4.1 Idle — *the friend at the counter, at rest*
The button alone. **No halo, no badge, no motion, no count.** The room is quiet and so is the Companion.
This is the resting state 95 % of the time, and it must feel complete and calm — presence without
demand.

### 4.2 Aware — *it has something meaningful to say*
A **gentle breathing light** of warm morning blooms **from within the carved apple itself** — an
apple-shaped luminance that escapes the recess and spills softly past the button's edge, rather than a ring
drawn around the outside of the disc. It is the house's own morning
(`hsl(43 74% 80%)`, the arch's petal-light), **never** a status colour, **never** red or amber-alert. It
breathes slowly, below the threshold of attention: you notice it only if you look. It says *"I'm here
when you want me,"* never *"look now."* **No number, no dot, no bounce, no ring of urgency.** It is the
calm replacement for a notification badge — the presence a friend has when they've thought of something,
not the interruption of an alert. (Driven by the existing `useCompanionNotices`; wiring is behaviour and
out of COMP1's scope.)

### 4.3 Speaking — *the light has drawn inward; a reply is forming*
When the Companion is composing or delivering, the halo has **drawn into** the button (it pulled inward
on open, § 5) and a **soft inner luminance** breathes at the apple's recess — slower and smaller than the
aware halo. The feeling is *a friend talking*, unhurried — never a machine "processing" spinner. The
panel is open; the button is its origin.

### 4.4 Listening — *it is attending to you*
When the input is focused and the household is addressing it, a **receptive ring** — cooler and steadier
than the warm aware halo, in the Companion's own sage — sits close around the button and **gently
settles** as words arrive. The visual of *being heard*, without waveforms, equalizers, or theatrics.

### 4.5 The emblem refinement — *the button becomes the mark*
A refinement pass (2026-07-17) took the identity from *a green button carrying an apple icon* to *the
embossed THA emblem itself* — a premium physical object that would read as THA even with the screen off.
Five visual moves, no behaviour or AI logic touched:

1. **Sole identity.** The **canonical THA single apple** (the product's own `tha-apple.png`, `ThaAppleIcon`'s
   mark) is the whole button. It was already the source silhouette; the refinement makes the disc *read* as
   the apple, not as an icon placed on a disc.
2. **Scale.** The apple grew from **~58 % → ~80 %** of the button diameter, keeping a balanced outer sage
   rim. At this size the mark owns the object.
3. **Depth.** The shallow two-line emboss became a **deep three-layer intaglio** — contact shadow (ambient
   occlusion), a recess face with an interior top-to-bottom gradient, and stronger rim relief — so the apple
   feels **carved into the material**, not printed on it.
4. **Lighting.** The arch's one morning now **catches the upper rim** while the recess **pools a realistic
   shadow**, with a soft **catch-light on the lower lip** — the Pressed-Apple physics, deepened.
5. **Halo.** The aware light is now **apple-shaped and blooms from within the carved apple**, spilling softly
   past the edge — it *escapes the emblem* rather than surrounding the outside of the disc. The old outer
   circular halo is reduced to a faint, contained bleed so the light never clips the screen edge.

Preserved exactly: the **sage ceramic** material and premium finish, the calm/understated/architectural
feel, the 48 px target, placement, focus ring, and **all behaviour**. **No** badges, **no** text on the
button, **no** new colours, **no** glossy or futuristic effects. Reduced-motion still-equivalents were
extended to the new apple-shaped light (a static warm light held in the apple). The refinement lives in the
prototype and in a new **before/after comparison** (§ 9).

---

## 5. The open sequence — *the light draws inward, then the Companion arrives*

1. **0 ms** — the household taps the button.
2. **0 → 400 ms** — the halo **draws inward**: it scales down toward the button's centre and fades, as if
   the light is being gathered in. Easing `cubic-bezier(0.22, 1, 0.36, 1)` (a decisive, settling pull).
3. **+140 ms after the draw** — the Companion panel **arrives a beat later**, fading and rising a few
   pixels into place. This is the *same* "arrives a beat after you" manners the Companion already keeps
   (Experience Blueprint § 13) — reused, not invented.
4. **Close** — the reverse, quicker (~280 ms): the panel settles away and the button returns to idle (or
   aware, if a notice still waits).

Total open ≈ **560 ms** — a single, calm, purposeful gesture. The light is never *switched*; it is
*moved*.

---

## 6. Placement — desktop and mobile

The button is a **constant of the shell** (Experience Blueprint § 14): the same corner, the same size, in
every room — *always in the same place, never following the household around the house* (§ 13).

| | Desktop | Mobile |
|---|---|---|
| **Anchor** | Fixed **bottom-right**, `right-6` (24 px), clearing content. | Fixed **bottom-right**, above the BottomNav — `bottom: calc(env(safe-area-inset-bottom) + 5rem)`. |
| **Size** | **48 px** (WCAG 2.5.5 target; do not shrink below 44 px). | **48 px** — identical; never smaller on small screens. |
| **Layer** | `z-40` — **below** the bottom nav (keep; PX1-W1 fixed the FAB-over-nav bug). | Same; the nav always wins the corner. |
| **Halo containment** | The aware halo must **not reach the viewport edge** — cap its bleed to ≤ ~18–20 px (contained within a ~120 px dock) so it never clips against the screen edge or the nav. | Same; additionally never bleed under the BottomNav or the safe-area (notch / home indicator). |
| **Entrance** | The existing `withheld` "arrive after the room settles" fade is **kept** (opacity/translate), unchanged. | Same. |

The current offsets are correct and are kept; COMP1 adds only the **halo-containment** rule so the new
light never fights the screen edge.

---

## 7. Motion guidance — timing · easing · intensity

| State / event | Property | Timing | Easing | Intensity (ceiling) |
|---|---|---|---|---|
| **Idle** | — | — | — | **No motion.** |
| **Aware** (breathe) | halo scale + opacity | **4.2 s** cycle, infinite | `ease-in-out` (a slow inhale/exhale) | scale **±6 %**, opacity **0.40–0.82** |
| **Speaking** (inner luminance) | halo drawn-in, slow pulse | **3.4 s** cycle | `ease-in-out` | scale 0.46–0.58×, opacity **0.32–0.60** |
| **Listening** (receptive ring) | ring scale + opacity | **2.6 s** cycle | `ease-in-out` | scale **±3 %**, opacity 0.55–0.90 |
| **Open** (draw inward) | halo scale → 0.2, fade | **400 ms** | `cubic-bezier(.22,1,.36,1)` | one-shot |
| **Open** (panel arrives) | fade + rise | **~340 ms**, **+140 ms** delay | `cubic-bezier(.22,1,.36,1)` | rise ≤ 8 px |
| **Close** | reverse | **~280 ms** | `ease` | — |
| **Hover / press** | lift / scale | **200 ms** | `ease` | lift ≤ 1 px, press `scale(.97)` |

**The intensity law (what makes it presence, never urgency):** nothing moves faster than the breath
except the one intentional open/close; halo opacity never exceeds **0.9**; scale change never exceeds
**6 %**; the light stays in the **warm-morning / sage** family and never enters a status colour
(no red, amber, or blue); and there is **no** bounce, spin, flash, shake, or repeat-on-a-timer. If a
motion would make a person *look up from what they are doing*, it is too much.

---

## 8. Accessibility guidance

- **Reduced motion is a guarantee, not an enhancement** (UI Architecture § 231). Under
  `prefers-reduced-motion: reduce` (and a user toggle), **every meaning the light carries has a still
  equivalent**: the breathing aware halo becomes a **static soft ring of light** (present, unmoving); the
  speaking luminance becomes a steady inner glow; the open "draw inward" becomes a **crossfade**. No
  information and no capability is lost — the *fact* "there is something to share" is still shown, just
  without movement.
- **The glow is never the only signal.** Presence conveyed by light alone would exclude screen-reader and
  reduced-motion users and fail WCAG 1.4.1 (colour/graphic alone) and 1.3.3. So the "aware" fact is also
  carried in **words**: the button's `aria-label` reflects state (*"Companion — something to share"* vs
  *"Companion"*), and the notice remains available in the existing Companion surface. The light is
  **grace, not the message**.
- **Contrast.** The button is a UI component: its boundary against the plaster must meet **≥ 3:1** (WCAG
  1.4.11) — sage `132 14% 44%` on plaster `36 46% 94%` (light) and sage `132 14% 52%` on the dark ground
  (dark) both pass comfortably as a solid, shadowed shape. The embossed apple is decorative
  (`aria-hidden`, no text-contrast bar) but must stay **perceivable** — the two-rim relief guarantees a
  visible edge in both themes, so the recess is a *darker sage*, never pure tone-on-tone that could vanish
  on a poor screen.
- **Focus.** Keep the canonical visible focus ring (`focus-visible:ring-2 ring-ring ring-offset-2`,
  already in `FloatingAssistant.tsx`), legible in both themes and offset from the button. **The halo never
  substitutes for the focus ring** — an aware glow and a keyboard-focus ring are different things and both
  must be able to show at once.
- **Target size.** 48 px meets WCAG 2.5.5; keep ≥ 44 px on every breakpoint.
- **Theme.** The identity is fully specified for **light and dark** (see the prototype); the halo warms in
  light and softens in dark, never inverting into a cold or alarming tone.

---

## 9. The concept prototype

An interactive prototype demonstrates the whole interaction on a plaster stage, in the house's own
materials — the embossed apple button, the four states, the open sequence, and both accessibility
toggles (reduced motion, dark theme).

- **Live (interactive):** published Artifact — <https://claude.ai/code/artifact/d09424cb-fd94-4f99-85d2-a669f7708eb8>
  (updated in place to carry the § 4.5 refinement).
- **Before / after (live comparison):** published Artifact —
  <https://claude.ai/code/artifact/0aa0a2eb-f7b3-4c55-9737-9ca1d2fb0f1f> — the flat-icon button beside the
  carved emblem, both discs live, with state and theme toggles.
- **Source (self-contained HTML):** `docs/implementation/assets/comp1-companion-prototype.html` (the
  interactive prototype) and `docs/implementation/assets/comp1-companion-before-after.html` (the comparison).
  The canonical THA apple is inlined as a data-URI mask; no external assets.
- **Renders:** `docs/ui-audit/comp1/` — `idle.png` · `aware.png` · `speaking` = `open-speaking.png` ·
  `listening.png` · `dark-aware.png` · `reduced-aware.png`. *(These PNGs capture the pre-refinement
  prototype; the live Artifacts above and the two HTML sources are the current, refined design — the
  headless browser is unavailable in this environment to re-render the stills.)*

It uses THA's real tokens (plaster, sage `--primary`, the arch's warm light) and the real emboss physics
from BRAND2, so it is a faithful preview, not a mock. It is a **prototype**, not shipped code (§ 11).

---

## 10. Governance — the one amendment this requires

Nine of the ten decisions need **no** amendment: an embossed-apple button in sage is squarely within the
existing material and colour law, and the open/close transition is ordinary functional motion. **One
decision conflicts with the governing canon and must be named, per the Architecture Bootstrap:**

> **The conflict.** Decision 6/7 — the **aware breathing halo** — is a *second Companion presence signal*
> and a *second sanctioned ambient motion*. But the Experience Blueprint currently forbids exactly that:
> § 320 records the Companion's arrival beat as *"the proven beat; **no other presence signal, ever**"*;
> § 12 states *"Living Details do not animate"*; and § 9 / § 274 admit *"the one governed exception … the
> Companion's arrival beat"* and nothing else that *"moves for its own sake."*

**The smallest amendment (proposed — requires ratification before the halo ships).** Extend the *existing*
Companion motion exception (Blueprint § 13 / § 9) to admit the aware halo as the Companion's **second —
and final — sanctioned presence signal**, tightly scoped so it opens no general door:

> **The Companion's aware light.** The one Companion (§ 13) may show a **breathing halo of warm light**
> when it holds something meaningful to say. It is **not** a Living Detail (those are per-room,
> data-borne, and still — § 12 stands): it belongs to the single Companion presence, which already holds
> the house's one motion exception. It means **presence and manners, never urgency**: it is
> sub-threshold (breathing, not blinking), carries **no** count, badge, or status colour, appears in
> **exactly one place**, and has a **still equivalent** under reduced motion (a static ring of light).
> The § 320 line is amended from *"no other presence signal, ever"* to name the **two** sanctioned
> Companion signals — the **arrival beat** and the **aware light** — **and no third.**

This extends one existing exception rather than loosening the motion law; the orchard stays still (§ 6.1),
light still does not sweep (§ 7), and no room gains an animation. **COMP1 does not apply this amendment
in this session** — it is proposed for ratification, and the halo is the one piece held behind it. The
rest of the identity (decisions 1–5, 8–10) is clear to build the moment the visual language is approved.

---

## 11. Implementation readiness (a later, gated step — not done here)

When approved, shipping this is a **small, self-contained, visual-only** change to one file — **no**
behaviour, data, route, or AI logic:

- **`client/src/components/conversation/FloatingAssistant.tsx:1490–1500`** — replace the `MessageSquare` /
  `X` icon swap with the **carved-apple emblem** (the three co-registered `tha-apple` mask layers of § 4.5,
  at ~80 %). Keep the button, its `bg-primary`, `rounded-full`, placement, `aria-label`, focus ring,
  `withheld` entrance, and testid (`button-open-assistant`) exactly.
- **`client/src/index.css`** — add a small, scoped block for the **three-layer intaglio** (contact-shadow
  layer, recess face with interior gradient, deepened two-rim filter), the **apple-shaped aware light**
  (breathing keyframes + a faint contained outer bleed + the reduced-motion still light), the **listening
  ring**, and the **open draw-inward** — all behind `prefers-reduced-motion` still-equivalents.
- **Presence wiring (behaviour — a separate change, explicitly out of COMP1):** feed the existing
  `useCompanionNotices` "has something to say" signal to the button's `data-state`, and reflect it in the
  `aria-label`. COMP1 specifies the *look* of that state; it does not wire the data.

**Two gates before it ships:** (1) the BRAND2 embossed-apple language is approved as the house mark; (2)
the § 320 aware-light amendment (§ 10) is ratified. Both are owner/governance decisions.

---

## 12. Verification

| Check | Result |
|---|---|
| Git status confirmed · rollback created · identifier reported | ✅ COMP1: `rollback/COMP1-companion-visual-identity-20260717` → `7bfad50c` (tag `comp1-wip-snapshot-7bfad50c`). Refinement pass: tag `comp1-emblem-refinement-rollback-20260717` → working-tree snapshot `9a9ae977`. |
| App source / Companion behaviour / AI logic modified | **None.** `FloatingAssistant.tsx` byte-untouched; spec + prototype + comparison only. |
| Emblem refinement (§ 4.5) — canonical apple sole identity · ~80 % scale · deep intaglio · refined lighting · halo escapes the apple · sage ceramic kept · no badge/text/new-colour/gloss | ✅ Applied in the prototype + the before/after comparison; behaviour/AI untouched. |
| Ten decisions locked | ✅ § 2 — each with how it is fixed. |
| Interaction spec (idle · aware · speaking · listening) | ✅ § 4, refined per state. |
| Motion guidance (timing · easing · intensity) | ✅ § 7, with the intensity law. |
| Accessibility (reduced motion · contrast · focus) | ✅ § 8 — reduced-motion still-equivalents, ≥3:1 boundary, canonical focus ring, glow-is-not-sole-signal. |
| Desktop & mobile placement | ✅ § 6 — same corner both, 48 px, halo containment. |
| Concept prototype demonstrating the interaction | ✅ § 9 — interactive Artifact + self-contained HTML + renders across states and themes. |
| Governance conflict surfaced (not silently violated) | ✅ § 10 — the § 320 "no other presence signal" conflict named; smallest amendment proposed, **not** applied; halo held behind ratification. |
| Product / schema / migration / tests | **None** — design specification. |

---

*COMP1 — the Companion is the apple, carved into the wall. Not a chat bubble, a sparkle, or a robot, and no
longer a green button with an icon on it: the canonical THA apple is pressed deep into a soft sage ceramic
disc so the button *is* the mark — calm at rest, a warm light escaping from within the carved apple only
when it has something to share, and drawing that light inward as it opens. The friend at the counter,
signed with the house's own mark — a permanent architectural element, tactile and timeless, not a widget
bolted on.*
