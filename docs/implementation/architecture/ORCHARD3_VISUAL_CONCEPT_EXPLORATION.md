# ORCHARD3 — Visual Concept Exploration — Implementation Report

**Workstream:** ORCHARD3 — Visual Concept Exploration ("Discover the visual soul of The Healthy Apples")
**Date:** 2026-07-15
**Session ID:** `ORCHARD3_Visual_Concept_Exploration`
**Type:** Design discovery (docs-only). **No code, no React, no production UI, no design tokens, no colour values.**
**Deliverable:** [`docs/implementation/ux/ORCHARD3_VISUAL_CONCEPT_EXPLORATION.md`](../ux/ORCHARD3_VISUAL_CONCEPT_EXPLORATION.md)

---

## 1. Rollback identifier

| Field | Value |
|---|---|
| **Rollback tag** | `rollback/ORCHARD3-visual-concept-exploration-20260715` |
| **Points at** | `b3c650cd` (`b3c650cde2a552f51b8311dbcd0937a401fbde1f`) — HEAD of `int1-intelligence-platform` at session start |
| **To revert entirely** | Delete the two new untracked docs and this report; no tracked file was modified except the `.engineering/session/` records. `git checkout rollback/ORCHARD3-visual-concept-exploration-20260715 -- .` restores tracked state. |

No product code, schema, migration, seed, or token was touched. Reverting is deletion of Markdown.

## 2. Files created / changed

**Created (new):**
- `docs/implementation/ux/ORCHARD3_VISUAL_CONCEPT_EXPLORATION.md` — the exploration: method · the reference world · three complete named concepts (each across fourteen dimensions) · critical evaluation · one recommended canonical direction.
- `docs/implementation/architecture/ORCHARD3_VISUAL_CONCEPT_EXPLORATION.md` — this implementation report.
- `.engineering/session/runs/ORCHARD3_Visual_Concept_Exploration.md` — the session run file.

**Changed (session records only):**
- `.engineering/session/CURRENT.md` — added the ORCHARD3 dashboard row.

**Deliberately NOT touched (byte-untouched):**
- `docs/architecture/README.md` and every governing document under `docs/architecture/` — the Experience Blueprint, the Orchard House Design Blueprint, the Orchard Living Book, the Experience Architecture, the UI Architecture, the Experience Language. This is a **discovery**, not new governing law; touching them would create a second owner (Experience Blueprint § 18; Architecture Principle 2). Any adopted direction enters those documents later, by governed amendment — never from here.
- All product code, tokens, components, routes, schema, seeds.

## 3. What the deliverable does

It discovers THA's **visual soul** — how *"a modern home in an ancient orchard"* could visually feel — and recommends the one identity THA should own for the next decade. It:

1. Frames the problem as *holding the modern↔ancient contrast in one image*, and names THA's single greatest visual risk: **calm curdling into cold/clinical/lifeless** (Experience Language § 3A — the decisive test every concept is judged against first).
2. Studies a **reference world** of real, timeless environments — architecture (Mies, Neutra, Barragán, Zumthor, Bawa), interiors (Vervoordt, Van Duysen, Ilse Crawford, Pawson), hospitality (Aman, Ett Hem, Heckfield, The Newt), galleries/museums (Louisiana Humlebæk, Menil, Beyeler, Kettle's Yard), premium retail (Aesop, Le Labo), and the kept family home — each with *what THA takes* and *what THA leaves*, distilling the five timeless qualities they share. It **explicitly excludes** nutrition apps, Apple, Notion, Linear, and trends, with reasons.
3. Explores **three complete concepts**, each a distinct soul specified across all fourteen mission dimensions:
   - **Concept A — The Glass Pavilion** (modern transparency; the view is the soul).
   - **Concept B — The Kept Room** (warm minimalism; the tended material interior is the soul).
   - **Concept C — The Garden Room** (the loggia; filtered orchard light is the soul).
4. **Critically evaluates** each against the governance and the cold-calm test, in prose and a summary matrix — finding A structurally cold and at war with the exposure law, and C beautiful but built on two governed anti-patterns (wallpaper + moving light).
5. **Recommends Concept B — The Kept Room** as the canonical direction, with six reasons, and **grafts** the disciplined gifts of A (the generous quiet view, kept only at Home's E3) and C (warm orchard light, disciplined to the one morning and exposure scale) — mirroring how EXP3/EXP4 concluded.
6. Stops at **sensibility, not values**, and names the governed path by which an adopted direction becomes real (UIA § 4 amendment · tokens by admission · one Living Detail at a time), so it pre-empts no colour, token, or pixel.

## 4. Architecture compliance

**Governance bootstrap (README STEP 2):** read the README and all four source documents (Experience Blueprint EXPBLUE1/2, Orchard House Design Blueprint OHDB1, Orchard Living Book OLB1, ORCHARD2 First Light) before authoring, plus the Experience Architecture / UI Architecture / Experience Language they cite.

- **One owner per rule (Architecture Principle 2; Experience Blueprint § 18).** The document creates **no rule and no second owner.** Every governed concern it is vivid about — the orchard, the one morning, the exposure scale, the materials, the light, the feeling, timelessness — is *cited to its owner*, never restated. It states this explicitly and adopts the yield clause: any line found to duplicate an owned rule is the defect (OHDB § 16.3).
- **Not governing architecture.** Classified as design discovery (peer of EXP2–EXP5), not law. It recommends; governance decides. This is why the README and the governing docs are byte-untouched.
- **Governance path respected (Experience Blueprint § 2.4; OHDB § 2.4).** It ships nothing and jumps no gate: it sets no value, and states that an adopted direction graduates only by UIA amendment, tokens by admission, and one-at-a-time Living Detail admission — after the two open items (orchard owner, Home header) close.
- **Experience & UI Governance Compliance.** No user-facing surface is created, so no runtime gate is triggered; nonetheless the document is written *through* the gates' lens — it passes the **Experience Test** (§ 0.1: which room / how feel / one thing), honours the **Blueprint Checks** and **Design Character Check** as evaluation criteria for every concept, and is explicitly measured against the **Experience Review Questions'** warmth-and-life additions (Experience Language § 3A).
- **Repository conventions (HOUSE2).** Design deliverable in `docs/implementation/ux/`; implementation report in `docs/implementation/architecture/` — the exact split ORCHARD2 used. No stray root files added. Session tooling confined to `.engineering/`.
- **Adoption Register / Product Registry.** No client-side building block, component, token, route, or user-facing surface was created, changed, or retired — so neither register has an affected entry. (Recorded here to show the checks were considered, per the workflow.)

## 5. Relationship to the Experience Blueprint (EXPBLUE1/EXPBLUE2)

The Blueprint owns the **vision and the place**; ORCHARD3 is the visual *reading* of that vision, and defers to it throughout.

- It takes the governing vision *"a modern home in an ancient orchard"* (§ 1.4) as its literal design brief (§ 1.1), and frames its whole method as *holding that contrast in one image*.
- It treats the **Orchard Exposure Scale** (§ 6.2), the **one-orchard / one-morning / never-animated laws** (§ 6.1, § 7), the **three grounds and the middle-ground-as-identity** rule (§ 8.1), the **Living Details** constitution (§ 12), the **constant shell** (§ 14), and the **spatial anti-patterns** (§ 16) as *fixed law*, and judges every concept against them — rejecting A for fighting the exposure scale (*all view, no room*, § 16) and C for being *wallpaper* + moving light (§ 6.1).
- Its recommendation is anchored in the Blueprint's own reasoning: The Kept Room wins because its soul *is* the warm middle ground (§ 8.1) and because it holds the § 1.4 contrast rather than choosing a pole.
- It creates none of the Blueprint's owned concepts and amends none; it cites them. Any adoption enters the Blueprint's world only by the § 2.4 path.

## 6. Relationship to the Orchard House Design Blueprint (OHDB1)

OHDB1 owns the **design character**; ORCHARD3 is the discovery of *which visual expression of that character THA should own*, and is its most direct downstream document.

- It adopts OHDB's five architectural characteristics (structural honesty, glazed toward the orchard, natural light/material, uncluttered planes, quiet confidence — § 3) and its interior philosophy (composed emptiness, everything meant, the household's life as the only ornament — § 4) as the *criteria* for a valid soul.
- It operationalises OHDB's **"Timeless, not fashionable"** doctrine (§ 14): the exclusion of Apple/Notion/Linear/trends is a direct application of § 14.1 ("trends are the technology becoming the subject"), and the recommendation leans on § 14.3 ("deepen the house instead") to argue The Kept Room *ages better*, not merely *endures*.
- It honours OHDB's **"design disappears"** law (§ 1.2) as a decisive axis — the reason it rejects A's view-as-subject and C's atmosphere-as-subject in favour of B's self-effacing interior.
- It restates none of OHDB's rules and adds no rival design character. It proposes *which* character-expression to canonise; if accepted, that graduates **into OHDB / UIA by amendment** (OHDB § 16.3), not from this file.

## 7. Relationship to the Orchard Living Book (OLB1)

OLB1 is the **lived, felt account**; ORCHARD3 is the attempt to give that felt account a coherent *visual grammar*.

- The recommended concept's name, **The Kept Room**, is taken directly from the vocabulary the Living Book and OHDB § 4 both reach for — *"the quiet of a room someone keeps, not the quiet of a room no one uses"* (Living Book, *Quiet Moments*). The exploration explicitly notes the house was already describing this soul to itself.
- It uses the Living Book's chapters as the emotional yardstick — *First Light*, *Tea Before The Day Begins*, *Rain Against The Glass*, *Quiet Moments* — for judging whether each concept's calm stays warm (the *Rain* chapter's "the house keeps a different weather" is the anti-cold standard B satisfies and A fails).
- It adds no chapter and no rule to the Living Book; it treats the Book as the felt standard to protect and asks which visual soul best keeps *The Orchard Promise*.

## 8. Relationship to ORCHARD2 (First Light)

ORCHARD2 designed **one worked room** (Home's arrival) as the gold standard; ORCHARD3 steps up one level to the **whole-house soul** every room — including Home — is built from.

- It is consistent with, and generalises, ORCHARD2's worked decisions: the *compact counter keeps its share so the view keeps its own* (ORCHARD2 § 2.2), *warmth low and near where a hand rests* (§ 2.2), *the one sanctioned light moment* (§ 5.2), and *arrival before information* all reappear as expressions of The Kept Room's soul.
- It adopts ORCHARD2's **graft-the-best-of-each-candidate** conclusion method (as EXP3 § 5 / EXP4 § 5 did) rather than a winner-take-all one.
- It inherits ORCHARD2's governance discipline verbatim: design intent only, no code/tokens, cite owners, restate no rule, and the § 0.3 governance path (UIA § 4 amendment · tokens by admission · Living Detail admission · the two open items) stands between any adopted direction and a shipped pixel.
- **Directional relationship:** ORCHARD2 proved the vision produces a real *room*; ORCHARD3 proposes the *soul* that keeps every future room the same house. If both are adopted, ORCHARD2 is the reference *room* and ORCHARD3's Kept Room is the reference *sensibility* — and they agree.

## 9. Verification

Design-discovery document — no runtime surface to exercise (the `/verify` skill's own guard: nothing to drive). Verification is editorial and governance-conformance, done by inspection:

- [x] Explores multiple visual directions; concludes with **three complete named concepts** (A/B/C), each covering **all fourteen** mission dimensions (philosophy · architecture · interiors · materials · light · colour · texture · depth · composition · typography feeling · inside/outside · orchard · atmosphere · timelessness).
- [x] References span architecture, interior design, hospitality, galleries, museums, premium retail, and residential — with what THA takes/leaves.
- [x] **Excludes** nutrition apps, Apple, Notion, Linear, and trends, with stated reasons.
- [x] **Critically evaluates every concept** (prose + matrix), including honest weaknesses of the recommended one.
- [x] **Recommends one canonical direction** (The Kept Room) and explains why it best represents THA, for a decade.
- [x] Sets **no** colour/token/value; states "this is not selecting colours."
- [x] Restates no governing rule; cites owners; creates no second owner; leaves README + governing docs byte-untouched.
- [x] Names the governed path an adopted direction must walk; ships nothing.

## 10. Status and next action

- **Status:** Delivered — **Waiting for User**. A design discovery, complete and awaiting a decision.
- **What is asked of the user:** accept, amend, or reject the recommended canonical direction (**The Kept Room**).
- **If accepted:** the next step is a *governance amendment* naming The Kept Room as THA's canonical visual sensibility inside the Orchard House Design Blueprint / UI Architecture — **not** an implementation. Only after that amendment (and the closing of the two open items — the orchard's canonical owner and Home's header, Experience Blueprint § 18) would a dev-only visual prototype (the EXP2–EXP4 pattern) be appropriate.
- **Nothing was implemented, migrated, tokenised, or shipped.**

---

*Implementation report for ORCHARD3 — Visual Concept Exploration. Discovery only; no code, no tokens, no governing law. Subordinate in every respect to the Experience Architecture (which prevails in any conflict), the Experience Blueprint, and the Orchard House Design Blueprint it serves.*
