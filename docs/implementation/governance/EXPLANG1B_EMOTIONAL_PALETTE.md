# EXPLANG1B — The Emotional Palette of THA (Implementation Report)

**Workstream:** governance
**Status:** COMPLETE — enhancement adopted into governing architecture
**Date:** 2026-07-15
**Rollback Identifier:** `rollback/EXPLANG1B-emotional-palette-20260715` → `b3c650cd`
**Enhances:** [`docs/architecture/THA_EXPERIENCE_LANGUAGE.md`](../../architecture/THA_EXPERIENCE_LANGUAGE.md) (EXPLANG1, previously enhanced by EXPLANG1A)
**Source of the palette:** the Arrival prototype reviews — `EXP2` ([`docs/implementation/ux/EXP2_ARRIVAL_EXPERIENCE_EXPLORATION.md`](../ux/EXP2_ARRIVAL_EXPERIENCE_EXPLORATION.md)) and `EXP3` ([`docs/implementation/ux/EXP3_ARRIVAL_SYNTHESIS_PROTOTYPES.md`](../ux/EXP3_ARRIVAL_SYNTHESIS_PROTOTYPES.md))

---

## 1. What this workstream did

Enhanced the existing governing **THA Experience Language** with the emotional identity discovered during the Arrival prototype reviews. It is an **enhancement only** — no existing principle was rewritten, no existing guidance was duplicated, no ownership boundary was changed, and no production code, UI, schema, token, colour, or component was touched.

The reviews exposed a gap the document could not previously catch: a surface can honour § 3's seven feelings and every § 4/§ 4A principle and still drift toward *stillness* — misty, hushed, spa-like, beautifully dead. § 3 forbade the loud counterfeits of calm; nothing forbade the quiet one. The enhancement adds one new section — **§ 3A, The Emotional Palette of THA** — closing that side, and extends § 6 (Experience Review Questions) and § 7 (Experience Anti-Patterns) *only* where the palette genuinely required an additional check.

## 2. What § 3A contains

| Part | Content |
|---|---|
| **§ 3A.1 — What THA must never feel** | cold · clinical · empty · silent · sterile · luxury for luxury's sake · funeral parlour calm · emotionally distant. Each named as calm's *failure state*, explicitly reconciled with Principle 8 (deliberate breathing space and honest empty states remain correct — the list forbids only the temperature they are sometimes mistaken for). |
| **§ 3A.2 — What THA must always feel** | The seven-note palette: **Calm** (never rushed, never overwhelming) · **Warm** (somebody has thoughtfully prepared something for you) · **Energised** (full of life, freshness and optimism — never loud or busy) · **Thoughtful** (anticipates rather than interrupts) · **Comforting** (a warm cup of tea; familiar, relaxing, reassuring) · **Decisive** (quiet confidence; recommendations considered rather than hesitant) · **Curious** (gentle exploration; discovery invited, never demanded). |
| **The one-sentence feel** | *"A warm, lived-in home where someone has already thought about dinner"* — stated as § 1.1's calm kitchen with the palette's addition made explicit: **lived-in**. |
| **§ 3A.3 — The orchard represents life** | The orchard means **life — not silence, not stillness, not decoration**; it must feel bright · growing · healthy · optimistic · welcoming, and never gloomy, misty, or melancholy. |
| **§ 3A.4 — Calm must never become lifeless** | The new governing principle: *the platform should always feel alive without becoming noisy*, with the felt examples — **Good:** warm morning light, freshness, breathing space, optimism, quiet confidence; **Avoid:** empty luxury, spa-like stillness, meditation-retreat aesthetics, overly desaturated palettes, excessive silence, emotional coldness. |

§ 3A was placed **between § 3 and § 4** (the same device EXPLANG1A used with § 4A) so **no existing section number moved** — every load-bearing cross-reference to § 6 and § 7 in `README.md` and `ENGINEERING_WORKFLOW.md` remains correct.

## 3. Files changed

| File | Change |
|---|---|
| `docs/architecture/THA_EXPERIENCE_LANGUAGE.md` | **Enhancement.** (1) Added **§ 3A** (five parts, § 2 above). (2) Extended **§ 6** with a new *Warmth & Life* group of four review questions. (3) Extended **§ 7** with five new anti-patterns (*Calm becoming lifeless* · *Clinical minimalism* · *Cold luxury* · *Emotionally distant experiences* · *Beautiful but unwelcoming interfaces*). (4) Recorded the § 3A admission in **§ 8** (Governance and Admission). (5) Added the EXPLANG1B `Enhanced:` line to the header metadata and the EXPLANG1B tag to the rollback footer. |
| `docs/architecture/README.md` | Added one sentence to the Experience Language prose block naming the EXPLANG1B enhancement and the palette, so the architecture census stays accurate. |
| `docs/implementation/governance/EXPLANG1B_EMOTIONAL_PALETTE.md` | **New** — this report. |
| `.engineering/session/runs/EXPLANG1B_Emotional_Palette.md` | Run-file bookkeeping (session recovery). |
| `.engineering/session/CURRENT.md` | Dashboard row (session recovery). |

## 4. No-duplication discipline (the hard requirement)

Four of the palette's seven notes overlap a § 3 feeling, and the brief's question and anti-pattern lists partially overlapped existing guidance. The reconciliation applied:

- **Palette notes that touch an existing feeling or principle cite it and add only the temperature.** *Calm* cites § 3's baseline and Principle 2 and adds only *warm quiet, never cold*; *Thoughtful* cites § 3's *intelligent* and Principle 7 and adds only the felt register (*thought of, not watched*); *Comforting* cites § 3's *reassuring* and adds only the domestic warmth it must land in; *Warm* is tied to § 3's definition of premium-as-care rather than redefining welcome. **Energised, Decisive, and Curious are genuinely new** and are stated in full. *Decisive* is explicitly reconciled with the existing honesty rules: it is confidence in what *is* known, never the certainty theatre § 7 already forbids.
- **§ 3A.1's never-feel list is reconciled with Principle 8**, so *empty/silent/sterile* cannot be read as a rule against deliberate breathing space or honest empty states — the list forbids a temperature, not a technique.
- **§ 6 was extended by four questions, not five.** The brief's *"Does this reduce invisible stress?"* already exists verbatim in intent in the *Place & Promise* group (Principle A, added by EXPLANG1A) — re-adding it would have created a duplicate check, so it was **not** added. Only the four genuinely new lenses were: warm-as-well-as-calm, alive-not-still, family-welcomed-not-impressed, and somewhere-you-would-enjoy-spending-time.
- **§ 7 was extended by five anti-patterns, all genuinely absent.** The existing entries (*Visual noise*, *Fabricated feeling*, *Attention seeking*, etc.) all forbid the **loud** counterfeits; none named the **quiet** failure the reviews found. Each new entry is anchored to the § 3A part that governs it and written to be distinct: lifelessness (the counterfeit of calm) · clinical minimalism (the counterfeit of Principle 8's space) · cold luxury (the counterfeit of premium) · emotional distance (correctness without care) · beautiful-but-unwelcoming (admired, not lived in).
- **§ 1.1 was not rewritten.** The brief's one-sentence feel is stated in § 3A as the palette's compression of § 1.1 — citing the kitchen sentence and adding only *lived-in* — rather than replacing or restating it.

## 5. Architecture compliance (ownership preserved)

The enhancement introduces **no ownership overlap** and changes **no boundary**:

- **Experience Architecture owns behaviour.** The palette adds no behaviour rule. *Decisive* governs how a recommendation must *feel*, not what the companion or any engine may do; *Curious* governs the feeling of exploration, not any navigation or disclosure behaviour.
- **Experience Language owns emotional intent.** All of § 3A is stated purely as feeling and temperature, consistent with § 2.
- **UI Architecture owns visual implementation.** Where the palette brushes a visual concern it defers explicitly: the orchard's *drawing* remains the UI Architecture's (§ 3A.3 says so inline); *"overly desaturated palettes"* is named **only as a feeling** — the sense that the colour of food and daylight has been bled out — with actual palette values remaining UI Architecture § 7 (§ 3A.4 says so inline).
- **Precedence unchanged.** Experience Architecture (behaviour) > Experience Language (feeling), beside the UI Architecture (look). § 8's precedence statement is untouched; its admission bullet now records that § 3A entered by governance, as § 8 requires.

## 6. Verification performed

- **Enhancement only — no rewrite.** § 3's seven feelings, the thirteen § 4 Principles of Feeling, and the eight § 4A Place Principles are unchanged and unrenumbered. § 3A is inserted between § 3 and § 4, so **no existing section number moved**; § 5, the original § 6 questions, and the original § 7 anti-patterns are unchanged except for the additive extensions.
- **No second owner created.** Overlapping palette notes cite rather than restate (§ 4 above); the duplicate review question from the brief was detected and excluded.
- **No production surface touched.** Docs only — no code, UI, schema, token, colour, component, or route. No runtime dependency created; the document remains description, never dependency (§ 2.3).
- **Rollback protection in place.** Tag `rollback/EXPLANG1B-emotional-palette-20260715` → `b3c650cd` pins the pre-enhancement state; every EXPLANG1B change is confined to the five files in § 3.

## 7. Confirmation

**EXPLANG1B is complete.** The THA Experience Language now carries the emotional palette discovered in the Arrival prototype reviews, as governing architecture: THA must feel calm, warm, energised, thoughtful, comforting, decisive, and curious — like *a warm, lived-in home where someone has already thought about dinner* — and it may never feel cold, clinical, empty, silent, sterile, gratuitously luxurious, funereally calm, or emotionally distant. The orchard is fixed as *life*, and **"Calm must never become lifeless"** stands as a governing principle with the review questions and anti-patterns that make it checkable. Every future user-facing implementation is now evaluated on whether it feels alive as well as calm.

---

*Rollback: `git checkout HEAD docs/architecture/THA_EXPERIENCE_LANGUAGE.md docs/architecture/README.md` reverts the enhancement and the README note once committed; before commit, restore those two files from the tag and delete this report. Tag `rollback/EXPLANG1B-emotional-palette-20260715` → `b3c650cd` pins the pre-enhancement state.*
