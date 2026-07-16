# TRANSLATION1 — The Kept Room Translation — Implementation Report

**Workstream:** TRANSLATION1 — translate The Kept Room into the permanent UI language of The Healthy Apples
**Date:** 2026-07-15
**Author session:** `TRANSLATION1_Kept_Room_Into_UI_Language`
**Rollback identifier:** `rollback/TRANSLATION1-the-kept-room-into-ui-language-20260715` → `b3c650cd`
**Type:** Documentation only — a governing translation guide. **No code, no React, no production components, no design tokens, no colour values.** No product behaviour, schema, or runtime touched.

---

## 1. What was asked

Translate the Orchard House into software *without losing its soul*. The philosophy, architecture, and visual identity are complete; the objective was **not** to implement code, create React, or build production components, but to author the **governing translation guide between architecture and interface**: for every major architectural characteristic, how it becomes software (across behaviour, layout, spacing, typography, motion, interaction, and what must never happen); then the governing UI principles; then the complete visual language of THA described without reference to any individual screen. Store it in the canonical design location with an implementation report.

## 2. What was delivered

**The canonical translation guide** — `docs/architecture/THA_KEPT_ROOM_TRANSLATION.md`:

- **§ 1–2 — Purpose and governance.** Why a translation is its own document (translate, don't redesign); what it owns (the translation itself) and never owns (no vision, no value, no feeling, no behaviour, no design character); precedence; the governance path it jumps none of; and the deliberate decision to add **no new gate** — the existing gates verify every translation, read against this dictionary.
- **§ 3 — The translation schema.** The nine facets every characteristic is translated across, plus the two disciplines that hold across all of them: a material is translated as a *feeling produced by light and honesty, never a picture*, and every translation carries warmth and life, never coldness.
- **§ 4 — The twenty translations**, grouped Structure · Materials · Atmosphere · People, each across all nine facets:
  - **Structure:** Light · Space · Thresholds · Rooms · Windows · Orchard views
  - **Materials:** the Kitchen island (counter) · Oak · Stone · Linen · Handmade ceramics · Shelving
  - **Atmosphere:** Quiet corners · Morning rhythm · Patina · Permanence · Calm · Warmth
  - **People:** Household presence · Companion presence
  - *(All twenty characteristics the mission named — "including but not limited to" — are covered.)*
- **§ 5 — The governing UI translation principles.** The nine ordering laws the mission named and their peers — space before decoration · light before colour · materials before effects · depth before shadows · calm before information · household before technology · people before data · truth before charm · restraint before expression — closing on the two the whole document protects: *technology should quietly disappear* and *the household should always feel present*.
- **§ 6 — The complete visual language, stated whole** — THA as one interface identity described *without reference to any individual screen*, as the mission required: warm-before-anything, one morning, one green voice and one accent, one quiet human voice, three grounds with only the middle varying, soft warm shallow depth, generous space, oriented to an ancient orchard, decorated only by the household's real life, moving almost never, answering the hand identically, framed by unchanging walls, honest in everything, timeless not fashionable, technology gone and the household remaining.
- **§ 7 — Governance and admission** — the yield clause, the jumps-no-path clause, and the inherited open items.

**The README index** — `docs/architecture/README.md`: a table row under Experience Governance and a full descriptive paragraph consistent with the five sibling documents, so the governing translation is not invisible-by-navigation.

**This report** — `docs/implementation/architecture/TRANSLATION1_KEPT_ROOM_TRANSLATION.md`.

## 3. Files created / modified

| File | Change | Nature |
|---|---|---|
| `docs/architecture/THA_KEPT_ROOM_TRANSLATION.md` | **created** | The governing translation guide |
| `docs/implementation/architecture/TRANSLATION1_KEPT_ROOM_TRANSLATION.md` | **created** | This implementation report |
| `docs/architecture/README.md` | **modified (additive)** | Experience Governance table row + one descriptive paragraph |
| `.engineering/session/runs/TRANSLATION1_Kept_Room_Into_UI_Language.md` | **created** | Session run file (developer tooling) |
| `.engineering/session/CURRENT.md` | **modified** | Dashboard row (developer tooling) |

No source code, component, token, schema, migration, test, or runtime file was touched. The five documents this guide translates — the Experience Blueprint, the Orchard House Design Blueprint, the Orchard Living Book, the UI Architecture, and the Experience Language — are **byte-untouched**.

## 4. Architecture compliance

- **Restates no rule; creates no second owner.** Every one of the ~180 facet statements cites its owner and adds only the *translation*. The document owns exactly one unowned thing — the architecture-word → interface-consequence mapping, across nine facets, plus the ordering principles that settle it. This is the one-owner-per-rule discipline the corpus is built on (Experience Blueprint § 18; Architecture Principle 2), applied to the document itself: § 7.3 states that any line found to duplicate an owned rule is the defect and is corrected to a citation.
- **Sets no visual value.** No colour, hex, token, radius, shadow value, duration, easing, type size, or pixel appears anywhere. Every value remains the UI Architecture's (§ 7, § 8, § 9, § 11, § 16).
- **Adds no gate.** Deliberately introduces no tenth checklist — the Experience Test, Blueprint Checks, Design Character Check, UI Governance Checklist, UX Governance Checklist, and Experience Review Questions verify every translation, read against this dictionary (§ 2.5). This mirrors the Orchard Living Book's decision to add no gate.
- **Jumps no governance path.** The Kept Room's material/light/depth translations ship only through the path the Experience Blueprint fixed — the Kept Room's graduation by amendment, the UIA § 4 amendment, tokens by admission, one Living Detail at a time (§ 2.4, § 7.4). Nothing here ships a pixel ahead of that path.
- **Inherits, does not re-open, the four Blueprint open items** (orchard owner · Home header · UIA § 4 amendment · dark mode); creates no new open item (§ 7.5).
- **Correctly subordinate and sibling.** Subordinate to the Experience Blueprint (and, through it, the Experience Architecture, which prevails in any conflict); a non-overriding sibling of the UI Architecture, the Experience Language, and the two blueprints and the living book it translates (§ 2.3).
- **Repository conventions.** The governing document sits in `docs/architecture/` (the canonical governing location, as the mission's "canonical design location") beside the documents it translates; the report sits in `docs/implementation/architecture/` beside the EXPBLUE1/OHDB1/OLB1 reports. Placement matches `HOUSE2` Repository Conventions and the pattern of every sibling workstream.
- **Governance gate self-checks** (the guide is a design guide, not an implementation, so these are applied to the guide itself):
  - *Experience Test:* the guide's "room" is the whole house's translation; its feeling is *the soul kept in the crossing from architecture to software*; its one job is *to translate each architectural characteristic into interface without losing its soul*. **Passes.**
  - *Blueprint Checks / Design Character Check:* every translation upholds one home, a room not a theme, the orchard laws, one morning, material honesty, Living Detail discipline, the Companion in its chair, the walls untouched, structural honesty, composed emptiness, and timeless-not-fashionable — and names the mistranslation of each as its ninth facet. **Passes.**
  - *One owner per rule:* every facet cites an owner; the document creates none. **Passes.**

## 5. Relationship to all Orchard and House documents

| Document | Relationship |
|---|---|
| **THA Experience Blueprint** (`EXPBLUE1`/`EXPBLUE2`) — the vision and the place | **Translated and extended.** The guide translates the Blueprint's owned concerns — One Home Many Places, the Exposure Scale, the one morning, the three grounds, the Living Details, the shell — into interface facets. It cites the Blueprint throughout and restates none of it. Subordinate to it; inherits its four open items and its § 2.4 governance path verbatim. |
| **THA Orchard House Design Blueprint** (`OHDB1`) — the design language | **Translated and extended.** The guide is the interface-facing counterpart of OHDB's design character: where OHDB says what the house *looks and feels like as design*, the guide says what each characteristic *becomes as interface*. Cites OHDB's architectural character (§ 3), interior philosophy (§ 4), material/light/colour/type readings (§§ 5–9), per-room readings (§ 13), and the timeless doctrine (§ 14). Non-overriding sibling; restates no OHDB rule. |
| **THA Orchard Living Book** (`OLB1`) — the lived account | **Translated.** The guide turns the felt moments of the Living Book (First Light, Quiet Moments, Returning Home, Cooking Together, the seasons) into interface behaviour — e.g. *Returning Home* → the returns-are-not-arrivals behaviour under Permanence and Morning Rhythm; *Quiet Moments* → Quiet Corners. Cites the Living Book; adds no gate, exactly as it does. Non-overriding sibling. |
| **ORCHARD2 — First Light** (design spec) | **Built on.** Cited as the arrival moment the Thresholds and Morning Rhythm translations rest on (the one light moment, the greeting, the Companion's beat). Not restated. |
| **ORCHARD3 — The Kept Room / Visual Concept Exploration** (design exploration) | **The sensibility being translated.** The guide takes The Kept Room (ORCHARD3 § 5 — warm minimalism, *modern bones, warm skin*) as given, on the mission's instruction, and translates it — warm ground before anything, warmth from light and material never ornament, patina by data never paint, modern restraint so warmth never tips rustic, the disciplined view and warm orchard light grafted from Concepts A and C (ORCHARD3 § 5.2–§ 5.3). Explicitly notes the Kept Room is a *recommended* direction, not yet a governing amendment (§ 2.4). |
| **HOUSE1 — The Entrance Hall** (design spec) | **Built on.** Home's worked design is cited as the first and clearest expression of every translation — the counter, the one morning across the day, the returns, the empty state, the gold-standard grammar every room inherits. The guide generalises HOUSE1's one-room translation to the whole-house characteristic level. Not restated. |
| **UI Architecture** (`UIA2`) | **Never overridden; every value deferred to it.** The guide sets no value; each facet that names a look points at UIA (§§ 4–16). Sibling. |
| **Experience Architecture** (`EXP1`/`EXP2`) | **Prevails in any conflict.** Behaviour facets cite it (Principles 2, 4, 5, 8; §§ 4, 8, 11, 14, 17). The top of the precedence chain. |
| **Experience Language** (`EXPLANG1`/`1A`/`1B`) | **Never overridden.** Every emotional-purpose facet and the two disciplines of § 3 cite the seven feelings, the Emotional Palette, and the Principles of Feeling. Sibling. |

## 6. What this is not, and what comes next

- It is **not** an amendment to any governing document and changes **no** visual law. It is the translation dictionary the existing gates are read against.
- It does **not** graduate the Kept Room, amend UIA § 4, admit any token, or close any open item — all of that remains the governance path of Experience Blueprint § 2.4, unchanged.
- If the guide is adopted, the proper next step remains a **governance amendment** naming the Kept Room as THA's canonical visual sensibility inside the Orchard House Design Blueprint / UI Architecture (ORCHARD3 § 5.4) — *not* an implementation — followed only then by the UIA § 4 amendment and a dev-only prototype. The guide makes that eventual build *safer* by fixing, in advance, what each architectural word must and must not become.

## 7. Status

**Complete.** Documentation only. The guide is authored, indexed, and reported; the five documents it translates are byte-untouched; every rule is still owned exactly once; no value is set, no gate added, no governance path jumped. Awaiting review/adoption.

---

*Rollback: `rollback/TRANSLATION1-the-kept-room-into-ui-language-20260715` → `b3c650cd`. To revert entirely: delete `docs/architecture/THA_KEPT_ROOM_TRANSLATION.md`, delete this report, and revert the additive README index block.*
