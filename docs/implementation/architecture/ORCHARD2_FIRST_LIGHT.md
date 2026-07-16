# ORCHARD2 — First Light (Implementation Report)

**Workstream:** ux / architecture (experience design)
**Status:** COMPLETE — design specification delivered; no code, no governing rule created; the three documents it builds on left byte-untouched
**Date:** 2026-07-15
**Rollback Identifier:** `rollback/ORCHARD2-first-light-20260715` → `b3c650cd`
**Creates:**
- [`docs/implementation/ux/ORCHARD2_FIRST_LIGHT.md`](../ux/ORCHARD2_FIRST_LIGHT.md) — the First Light arrival design (the ten deliverables)
- [`docs/implementation/architecture/ORCHARD2_FIRST_LIGHT.md`](./ORCHARD2_FIRST_LIGHT.md) — this report
**Built on (cited, never restated):** [`THA_EXPERIENCE_BLUEPRINT.md`](../../architecture/THA_EXPERIENCE_BLUEPRINT.md) (place) · [`THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`](../../architecture/THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md) (design language) · [`THA_ORCHARD_LIVING_BOOK.md`](../../architecture/THA_ORCHARD_LIVING_BOOK.md) (lived account) · and their governors: [`THA_EXPERIENCE_ARCHITECTURE.md`](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md), [`THA_UI_ARCHITECTURE.md`](../../architecture/THA_UI_ARCHITECTURE.md), [`THA_EXPERIENCE_LANGUAGE.md`](../../architecture/THA_EXPERIENCE_LANGUAGE.md)
**Session:** `ORCHARD2_First_Light` ([run file](../../../.engineering/session/runs/ORCHARD2_First_Light.md))

---

## 1. What this workstream did

Designed **First Light** — the experience of walking through the front door of The Healthy Apples for the very first time each day. It is the **first practical design work** built on the Experience Governance blueprints: it takes one moment (arrival at Home, first thing in the morning) and designs it fully — narrative, spatial layout, visual composition, information hierarchy, motion, Companion, light, emotional journey, principles, and the reason behind every decision — so it could be built, and so every future room can be measured against it.

**Design only. No code, no React, no components, no Figma-ready or high-fidelity UI.** The only diagrams are low-fidelity ASCII spatial-composition sketches showing *where things sit and how they relate* — never appearance. No production file was touched.

The design does not move beyond Home, and within Home it designs only the **arrival moment** — not the Home's steady-state working life, not any other room.

## 2. The central design idea

Arrival is designed as **a threshold crossed, not a screen loaded.** The whole product is defined as *a home, not a dashboard* (Experience Blueprint § 4; Experience Language Principle G), so the opening moment had to *feel like entering somewhere* rather than *reporting to someone*. Everything follows from that:

- **Welcome before work.** The greeting (the household's name, in THA's hand, once a day) and a beat of calm land *before* any task; the one primary action appears only after arrival (Experience Language Principle 1; Experience Architecture Principle 2).
- **A generous, quiet view over a compact counter.** Home is E3 — the largest orchard view in the house and the least demanding — sitting above one small, warm, lit working ground that keeps its share so the view keeps its own (Experience Blueprint § 6.2, § 8).
- **The friend a beat behind.** The Companion takes its fixed chair after the person has arrived, and may stay silent (Experience Blueprint § 13).
- **One light moment, felt not seen; constant walls that never move.** The single sanctioned arrival motion reads as morning sun on a counter; the shell is byte-identical and silent (Experience Blueprint § 7, § 14).

The one feeling the whole design exists to produce: **"I've come home."**

## 3. The distinction that shaped it — First Light vs. Returning Home

The mission asked for the arrival *"for the very first time each day."* That phrase is load-bearing and it aligned the design precisely with the greeting's governed ceiling (Living Detail, *at most once per day* — Experience Blueprint § 12.2):

- **First Light** = the *first* entry of the day; the one greeting a day is spent here.
- **Returning Home** = every later entry that day; quieter by design, no greeting re-performed, its warmth carried by *constancy* not repetition (Orchard Living Book, *Returning Home*).

This protects the greeting from the *"worn out by overuse"* failure the Living Book's *First Light* chapter names, and it keeps the design honest about which moment it governs.

## 4. The ten deliverables (as required by the mission)

| # | Deliverable | Where |
|---|---|---|
| 1 | Experience narrative | § 1 |
| 2 | Spatial layout (with ASCII sketches) | § 2 |
| 3 | Visual composition | § 3 |
| 4 | Information hierarchy | § 4 |
| 5 | Motion philosophy | § 5 |
| 6 | Companion behaviour | § 6 |
| 7 | Light and atmosphere | § 7 |
| 8 | Emotional journey — first 30 seconds | § 8 |
| 9 | First Light design principles (ten) | § 9 |
| 10 | Reason behind every major design decision (14 decisions) | § 10 |
| + | How Home becomes the gold standard · What is deliberately absent | § 11, § 12 |

Each of the mission's descriptive requirements — what is seen first, how the space feels, the 30-second journey, hierarchy, composition, light, materials/depth, the orchard relationship, how the Companion quietly enters, what is deliberately absent, and *why every element exists* — is covered and cited to its owner.

## 5. Architecture compliance

This workstream is a **design specification that applies governing rules**, not a change to any governing rule. Its compliance rests on one discipline: **restate no rule; cite every owner; own only the genuinely unowned** — the concrete composition of one moment.

### 5.1 One owner per rule (Experience Blueprint § 18; Architecture Principle 2)
Every governed concern the design touches is cited to its owner and never rewritten:
- **Exposure (E3), light (one morning), materials (three grounds), orchard laws, the Living Detail greeting, the Companion's place, the shell** → cited to the Experience Blueprint (§ 4–14).
- **Architectural/interior character, the room reading of Home, timeless-not-fashionable** → cited to the Orchard House Design Blueprint (§ 3, § 4, § 13.1, § 14).
- **Behaviour** (one primary action, progressive disclosure, product-orients-person-chooses, attention borrowed) → cited to the Experience Architecture.
- **Feeling** (the seven feelings, the Emotional Palette, arrival-before-information, motion-felt-not-seen) → cited to the Experience Language.
- **Every visual value** (colour, type, spacing, radius, shadow, duration, easing) → left to the UI Architecture; none appears in this document.

### 5.2 No governing law created, README untouched
The design is placed in `docs/implementation/` (design work), **not** in `docs/architecture/`, and the Architecture Bootstrap README is **not** amended. This is deliberate: adding it to the governing index would imply it is law and risk making it a second owner of rules the blueprints already hold. It is a *worked example* of the law, not more law.

### 5.3 The governance path is respected, not jumped (Experience Blueprint § 2.4; OHDB § 2.4)
The design explicitly states (§ 0.3) that nothing here ships until: the **UIA § 4 amendment** admits the depth/ground-plane/light vocabulary; exposure and light values enter as **tokens by admission** (UIA § 16); and the **greeting is admitted as its own Living-Detail decision** (Experience Blueprint § 12.1). It also names its dependency on two of the Blueprint's open items (§ 18): the **orchard's canonical owner** and **Home's header**. A vivid description is not a licence to ship, and the document says so in its own frame.

### 5.4 The three experience gates and the two added checks — walked
The design was authored against, and passes, every gate in the Experience & UI Governance Compliance block:
- **Experience Test** (Experience Blueprint § 15.3): *Which room?* Home. *How feel?* Welcomed, expected — "I've come home." *One thing?* Arrive, then orient. All three answered in § 0.1.
- **Blueprint Checks** (§ 15.2): one home ✓; a room not a theme ✓; the map respected (Home = E3, full morning, compact counter, greeting) ✓; orchard law (in-season, still, never wallpaper, never under text) ✓; one morning ✓; material honesty (one ground, text on ground never landscape) ✓; Living Detail discipline (one — the greeting — data-borne, once/day) ✓; the Companion in its chair (foreground, a beat after) ✓; the walls untouched (shell byte-identical) ✓; the governance path (declared, not jumped) ✓.
- **Design Character Check** (OHDB § 16.2): architectural character (structural honesty, glazed toward the orchard, natural light, uncluttered, quietly confident) ✓; interior philosophy (composed emptiness, decorated only by the household's life) ✓; timeless not fashionable (no trend, no confetti, restraint over spectacle) ✓; design disappears (felt, not named) ✓; the room reading of Home honoured (§ 13.1) ✓.

### 5.5 Repository & session compliance
- **Placement** follows the arrival lineage: the design sits in `docs/implementation/ux/` beside the EXP2–EXP4 arrival explorations it graduates into a concrete design; this report sits in `docs/implementation/architecture/` beside the EXPBLUE1/OHDB1/OLB1 reports whose blueprints it applies (Repository Conventions, `HOUSE2`).
- **Session recovery** (ESR): rollback tag created first (`→ b3c650cd`); run file `ORCHARD2_First_Light.md` opened and kept current; `CURRENT.md` dashboard row added; closed to *Waiting for User*.
- **No AI / Product-Registry / Adoption-Register impact:** no capability, no runtime code, no client-side building block created, changed, or retired. Those compliance blocks do not apply to a design document that ships nothing.

## 6. Relationship to the Experience Blueprint

The Experience Blueprint **draws the house and owns the place**; First Light **furnishes and lights one moment inside it** without moving a wall. It applies, and cites:
- **Home's identity** — the threshold and the heart, E3 (the open view, Home only), full morning, compact counter, the greeting in THA's hand (§ 4, § 5.1, § 6.2, § 12.2).
- **The three grounds** — the orchard as background world, the counter as the middle ground that varies by room, the Companion in the foreground (§ 8.1).
- **The one-morning light law, the orchard laws, the Companion's place, the constant shell** (§ 6, § 7, § 13, § 14).
- **The vision and Technology Principle** — *a modern home in an ancient orchard; technology quietly disappears* (§ 1.4, § 1.5) — as the design's north star, quoted once.
It adds no room to the map, no exposure level, no Living Detail, and no spatial anti-pattern; it demonstrates the ones already there.

## 7. Relationship to the Orchard House Design Blueprint

The Design Blueprint **owns the house's design character**; First Light is the first surface designed *in* that character. It applies, and cites:
- **The architectural style** — structural honesty, glazed toward the orchard, natural light and material, uncluttered planes, quiet confidence (§ 3).
- **The interior philosophy** — composed emptiness, everything present is meant, the household's own life as the only ornament (§ 4).
- **The design reading of Home** (§ 13.1) — purpose, emotional tone, light, material emphasis, exposure, signature moment, and the things to avoid — carried through verbatim in intent.
- **Timeless, not fashionable** (§ 14) — the reason First Light refuses confetti, theatrical motion, hero bands, and any of-the-moment styling: it is built to look right in ten years, beside a timeless orchard.
It passes the Design Character Check (§ 16.2) and adds nothing to the design language it renders.

## 8. Relationship to the Orchard Living Book

The Living Book is the **lived, felt account** — written to be read, not built. First Light is the point where its opening chapter becomes **buildable**:
- The design's narrative (§ 1), atmosphere (§ 7), and emotional journey (§ 8) are the felt truth of the Living Book's *First Light* chapter, translated into spatial layout, hierarchy, motion, and decision-reasons a team can implement.
- It honours the Living Book's law that **the house never changes** — one morning, still orchard — and that time shows only through the *household's* life. Hence the First Light / Returning Home distinction (§ 0.2), drawn straight from the Living Book's *Returning Home* chapter, and the greeting rationed to once a day.
- The Living Book's *"what should never happen"* refrains for arrival — a wall of metrics before the welcome, a task before the greeting, the greeting worn out — became this design's *What Is Deliberately Absent* (§ 12) and several of its decision-reasons (§ 10).
First Light adds no chapter and no rule to the Living Book; it makes the feeling the book describes producible.

## 9. Files created / modified

| File | Change |
|---|---|
| `docs/implementation/ux/ORCHARD2_FIRST_LIGHT.md` | **New** — the First Light design (ten deliverables) |
| `docs/implementation/architecture/ORCHARD2_FIRST_LIGHT.md` | **New** — this report |
| `.engineering/session/runs/ORCHARD2_First_Light.md` | **New** — session run file |
| `.engineering/session/CURRENT.md` | **Modified** — dashboard row added |
| git tag `rollback/ORCHARD2-first-light-20260715` | **New** — rollback protection at `b3c650cd` |

**Untouched by design:** every governing document (the three blueprints and their three governors), the Architecture Bootstrap README, all production code, all schema, all runtime. This workstream ships nothing and creates no rule.

## 10. Rollback

- **Rollback identifier:** `rollback/ORCHARD2-first-light-20260715` → `b3c650cd`.
- Everything created is new and uncommitted. To revert entirely: delete the two new `.md` documents and the run file, remove the `CURRENT.md` dashboard row, and delete the git tag. No code, migration, or data is involved.

## 11. Recommended next steps (not done here)

1. **Review and adopt** First Light as the canonical arrival design; on adoption, decide whether Home's arrival grammar (§ 11 of the design) should be lifted into the Experience Blueprint as a cited pattern — a governance decision, not a design one.
2. **Close the two blocking open items** the design depends on (Experience Blueprint § 18): the orchard's canonical owner, and Home's header (one canonical shell treatment).
3. **Land the UIA § 4 amendment** and admit Home's exposure/light as tokens (Experience Blueprint § 2.4) before any implementation.
4. **Admit the greeting** as its own named Living-Detail decision (Experience Blueprint § 12.1).
5. Only then, a **dev-only Home prototype** of First Light (the EXP2–EXP4 pattern: `/dev/…`, screenshots, live Home untouched) — as a *separate* workstream, since this one is design, not code.

---

*Implementation report for ORCHARD2 — First Light. A design specification applying the Experience Blueprint, the Orchard House Design Blueprint, and the Orchard Living Book to the single moment of daily arrival at Home; it creates no governing rule, ships no code, and leaves every governing document byte-untouched.*
