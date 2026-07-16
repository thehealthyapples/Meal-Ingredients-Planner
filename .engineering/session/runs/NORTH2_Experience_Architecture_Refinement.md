# Session: NORTH2_Experience_Architecture_Refinement

| Field | Value |
|---|---|
| **Session ID** | `NORTH2_Experience_Architecture_Refinement` |
| **Rollback ID** | `rollback/NORTH2-experience-architecture-refinement-20260716` → `7d1dd2ce` |
| **Start time** | 2026-07-16T09:45:00Z UTC |
| **Current stage** | Waiting for User |

## Objective
Refine the governing Experience Architecture using the NORTH1 review, treating
NORTH1 strictly as an **evaluation document, never as architecture**. Assess
five proposed principles (Aperture · Truthful Objects · Presence · Interface as
Guest · Time) for adoption, ownership, conflict, and smallest change. Produce
an Architecture Refinement Report under `docs/investigations/`. **Do NOT
redesign the UI. Do NOT implement. Do NOT create a second visual language.
Update no architecture unless explicitly instructed afterwards.**

## Files being modified
- `docs/investigations/ux/NORTH2_EXPERIENCE_ARCHITECTURE_REFINEMENT.md` — the report (new)
- `.engineering/session/runs/NORTH2_Experience_Architecture_Refinement.md` — this run file
- `.engineering/session/CURRENT.md` — dashboard row

**No governing document amended. No code, component, or token touched.**

## Checkpoints
- [x] Read `docs/architecture/README.md` (Architecture Bootstrap, STEP 2)
- [x] Read the governing Experience documents in full — Experience Architecture, Experience Blueprint (EXPBLUE1/2), Orchard House Design Blueprint, Experience Language (incl. § 3A), Kept Room Translation, Orchard Living Book, UI Architecture section map
- [x] Read the NORTH1 Visual North Star review
- [x] Confirmed git status (clean but for NORTH1's own untracked docs + 2 pre-existing stray root `.txt` files)
- [x] Created rollback tag (`→ 7d1dd2ce`) and reported the identifier
- [x] Assessed all five proposals against the one-owner test
- [x] Authored the report
- [x] `repo-structure-verify.sh` / `session-verify.sh` — pass (only the 2 pre-existing stray root `.txt` files fail; not ours)
- [x] Reconcile run file + dashboard

**Verdicts: 1 of 5 adopted.**
- **Aperture — ADOPT, narrowed.** Owner: Experience Blueprint § 6.1 (extends, +1 bullet). Genuinely new content is only: (a) boundedness binds at **E3**, not just E2 — a full-bleed orchard at Home is *currently legal*, which is the loophole the live wallpaper defect sits in; (b) plurality of openings + the load-bearing ground between them. Must be **narrowed to E2–E3** (silent at E1/E0, or it contradicts the exposure scale) and worded **"bounded"** not "separated" (E2 is one region — nothing to separate).
- **Truthful Objects — DO NOT ADOPT.** Owned 3× (Blueprint § 12.1 r2 *"data-borne or dead… forbidden by construction"* · OHDB § 4 · TRANSLATION1 *Patina*).
- **Presence — DO NOT ADOPT.** Owned by Experience Language § 3A.2 (*lived-in*; the show-home test) / § 3A.4 (*calm must never become lifeless*) + OHDB § 4; all three requested contrasts already drawn (luxury § 3A.1, decoration § 3A.3, minimalism § 7 *clinical minimalism*). EXPLANG1B closed this exact gap in July.
- **Interface as Guest — DO NOT ADOPT.** Sound half owned (Blueprint § 8.2); novel half **conflicts** — *"the room always remains the primary experience"* contradicts § 6.2's inverse law and § 16 *metaphor taxing function* (*"that recession is itself the design… if the concept fights the Planner, the concept loses"*). It would generalise Home's E3 exception into a law.
- **Time — REJECT.** **Conflicts** frontally with Blueprint § 7, § 16 *the second sun*, OHDB § 11, TRANSLATION1 *Morning Rhythm* § 9 (forbids by name, instructs STOP). Time is *already* recognised — through the household's data, never the house's light (*Morning Rhythm* § 3, § 8).

**Headline:** the **Experience Architecture is the wrong document for all five** and stays byte-untouched — it is technology-independent and explicitly not a visual style guide (§ 1, § 2.1); all five are place/design/feeling concerns. NORTH1 produced **zero** behavioural findings not already law. Its big findings (orchard backdrop wallpaper+parallax, Home with no primary action, cold `--card`) are **conformance defects, not architecture gaps** — the canon forbade every one of them in writing before the render exposed them.

**Last checkpoint:** Report delivered. One amendment recommended (Blueprint § 6.1, one bullet), **not applied**, with three conditions incl. the named downstream cost: adopting it means DESIGN1 § 4 / HOUSE1 § 2.2's *sky → light → surface → hand* **horizon is not an aperture** and must be revisited in the same decision (neither is governing, so neither blocks).

**Next action:** Awaiting instruction. If the § 6.1 bullet is approved, apply it as a named governance decision per Blueprint § 18 (citing NORTH1 as discovery source), and open the DESIGN1/HOUSE1 anatomy correction in the same change. Separately: NORTH1 § 8.1 (retire the orchard backdrop) remains the highest-value conformance work and needs no amendment to proceed.
