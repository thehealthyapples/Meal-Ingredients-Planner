# CRAFT1 — THA Craftsmanship Constitution (Implementation Report)

**Workstream:** `CRAFT1` — the final governing design constitution
**Date:** 2026-07-22
**Branch:** `int1-intelligence-platform`
**Deliverable:** [`docs/architecture/THA_CRAFTSMANSHIP_CONSTITUTION.md`](../../architecture/THA_CRAFTSMANSHIP_CONSTITUTION.md)
**Rollback identifier:** `rollback/CRAFT1-craftsmanship-constitution-20260722` → annotated tag object `e645bbed`, points at committed `65e39ca9`
**Status:** Documentation → Waiting for User (Home Owner acceptance)

> **What was done.** Created the **Craftsmanship Constitution** — the final governing design constitution, defining **HOW** every future room is designed and built to standard, and marking the transition of the project into implementation-only mode. Governance only: no route, capability, entity, token, component, string, schema, migration, or business logic; no runtime code reads it. It restates no rule any owner already holds — it assembles the completed canon into one standard of craft and one method of work, and owns only those two.

---

## Architecture Compliance

The Architecture Bootstrap (`ENGINEERING_WORKFLOW.md` STEP 2) was performed before any change: `docs/architecture/README.md` and the mandated governing inputs were read, and the document was checked against every governing owner it touches.

- **One owner per fact.** The document owns exactly two facts no document previously owned in one place — **the Craftsmanship Standard** and **the Design Method** (§ 1). Every other value it names is a **citation** to its existing owner (the § 1 table): feelings → `THA_EXPERIENCE_LANGUAGE.md`; colour/token/motion → `THA_UI_ARCHITECTURE.md`; principles → `GOVERNING_EXPERIENCE_ARCHITECTURE.md`; place/light/materials → the Blueprint / `OHDB1` / `TRANSLATION1`; final aesthetic approval → `HOME_OWNER_ARCHITECTURE.md`; per-fact rendering owner → `UIOWN1`; each room's destination → its North Star.
- **Restate-no-rule (the `LIVINGHOME2`/`LHDC1` discipline).** Any sentence later found to duplicate an owned value is a defect in this document, corrected to a citation. It adds no second source of experience governance and no gate.
- **Subordination stated.** On any question of *rule*, the rule's owner prevails and this Constitution is corrected (`GOVERNING_EXPERIENCE_ARCHITECTURE.md` § 2.3, cited). The document governs *how well* and *in what order*, never a *what*.
- **Experience Constitution Check** (`GOVERNING_EXPERIENCE_ARCHITECTURE.md` § 18.2) answered in full for the governance declared — hospitality · outcome · weight · voice · ownership · agency · restraint · layer — recorded in the document § 11 and summarised below (Trust Check / Definition of Done).
- **Layer discipline (GEA20).** The document sits at the craftsmanship-and-method altitude of the Implementation layer, names the Experience Constitution above it and the Experience Architecture owners beside it, and originates no implementation law — it governs the *manner of the descent* from architecture to a built room, which is precisely the gap GEA20 leaves unspecified.
- **No AI surface.** AI Architecture Compliance passes trivially (§ 12 of the document): no capability, prompt, Context View, or Companion behaviour is created or altered.

**No check fails. No governing rule is contradicted.**

## Definition of Done

Per the mission's Definition of Done, success means all four of the following, each satisfied:

- **THA now has a permanent implementation standard.** ✅ The Craftsmanship Standard (§ 3–§ 6) and the Quality Standard (§ 8) state, permanently and in one place, the execution quality every finished user experience must meet.
- **Future rooms are rebuilt from architecture, not legacy UI.** ✅ The Design Method (§ 7) makes architecture-first mandatory: every room is designed *as though it has never existed* — read the architecture, design the room, then judge existing code.
- **Existing pages are no longer treated as design authority.** ✅ Stated as the document's load-bearing principle (§ 7.3): *the architecture owns the design; the existing implementation does not — existing implementation is reference material, never design authority.*
- **This is the final governing design constitution before implementation.** ✅ The Completion Rule (§ 9) marks the end of architectural design work; after approval, work is normally implementation, refinement, and verification only, and new architecture is introduced only on a genuine architectural conflict.

The document exists at `docs/architecture/THA_CRAFTSMANSHIP_CONSTITUTION.md`, is indexed in `docs/architecture/README.md` (Experience Governance table + a governing summary), and this report exists — the deliverable is complete pending Home Owner acceptance.

## Data Impact

- **Reads existing data:** NO — governing document only.
- **Writes new data:** NO — no table, column, row, migration, or write path.
- **Changes meaning of existing data:** NO.
- **Requires backfill:** NO.

No household data, no personal data, no special-category data, no Domain is touched. Nothing runtime reads or is read.

## Trust Check

*(The One Question — `THA_BRAND_CONSTITUTION.md`, cited: "Does this leave the household with less to carry, and could they trust everything it tells them?")*

- **Could this mislead the household?** No runtime change reaches any household. The document *strengthens* THA's honesty discipline: it forbids manufactured confidence and decorative charm a room cannot substantiate (§ 4, § 5), and elevates *beautifully real — never fantasy, never gamified* as a permanent boundary on all craft.
- **Could it fabricate certainty?** No. It asserts nothing to any household; Core Principle 6 (*trust is the product*) is cited, untouched.
- **Is anything guessed but shown as real?** No — the standard bans exactly the register (fantasy, gamification, decoration for its own sake) that would let a room seem more than it is.
- **What happens if the system is wrong?** For this change: a documentation defect, corrected by amendment to one file. There is no runtime surface to fail.
- **No architectural duplication introduced:** YES. **No new source of truth created:** YES (it owns a standard and a method nobody owned; it re-owns no existing fact). **No runtime behaviour altered:** YES.

## Rollback Plan

- **Rollback identifier:** `rollback/CRAFT1-craftsmanship-constitution-20260722` → annotated tag object `e645bbed`, points at committed `65e39ca9` (created **before any change**; covers committed state — the working tree held only the automated `.engineering/session/CURRENT.md` heartbeat, not covered).
- **Files modified:** `docs/architecture/THA_CRAFTSMANSHIP_CONSTITUTION.md` (new) · `docs/implementation/architecture/CRAFT1_CRAFTSMANSHIP_CONSTITUTION.md` (new, this report) · `docs/architecture/README.md` (index entry + governing summary) · `.engineering/session/CURRENT.md` (dashboard row) · `.engineering/session/runs/CRAFT1_Craftsmanship_Constitution.md` (session record, new).
- **To revert:** `git checkout rollback/CRAFT1-craftsmanship-constitution-20260722 -- docs/architecture/README.md .engineering/session/CURRENT.md` and `git rm` the two new documents and the session record; or `git revert` the CRAFT1 commit. No runtime surface exists to restore.
- **Verification after rollback:** `git diff rollback/CRAFT1-craftsmanship-constitution-20260722 -- docs/ .engineering/` is empty; no runtime surface existed to verify.

## Scope Lock

- **Implemented scope:** the governing document; this implementation report; the README index entry and governing summary; the session record + dashboard row. **Nothing else.**
- **Explicitly excluded (byte-absent from the diff):** every route, component, token, string, asset, schema, migration, persistence, capability, prompt, and business-logic change; every existing owner's rules, values, and tokens (all byte-untouched); every gate (none added; the existing gate stack is preserved and cited).
- **Decisions recorded, not taken:** none deferred to a later owner — the document is a complete standard and method. The *transition into implementation-only mode* it declares is itself the Home Owner's to accept (User Acceptance Evidence).

## Manual Verification

Documentation-only change; verification is diff-scope and citation-integrity, not build/test:

1. `git status` confirmed clean apart from the automated session heartbeat before work; the annotated rollback tag was created and verified to resolve to tag object `e645bbed` pointing at committed `65e39ca9` **before any file was written.**
2. The mandated inputs were read (`docs/architecture/README.md` and its full canon summaries; `HOME_OWNER_ARCHITECTURE.md` and `LIVING_HOME_DESIGN_CONSTITUTION.md` in full; `LARDER_ROOM_NORTH_STAR_ARCHITECTURE.md` in full; `GOVERNING_EXPERIENCE_ARCHITECTURE.md`, `THA_UI_ARCHITECTURE.md`, and `THA_EXPERIENCE_BLUEPRINT.md` via the README's governing summaries, which quote each document's owned concerns and principle numbering).
3. Every value in the document was verified to be a **citation** to an existing owner (§ 1 table), not a new definition; the Architecture-Bootstrap conflict check confirmed no owned feeling, colour, token, material, principle, or law is re-owned.
4. `git diff --stat` at commit time confirmed the change touches only the five files named in the Rollback Plan — all under `docs/` and `.engineering/session/`, with no `.ts/.tsx/.json/.css`/migration/asset path.
5. No build, typecheck, or test surface is affected; none is claimed to have been re-run beyond confirming the diff contains no code path. The repository-structure filing gate (DOCGOV1) is satisfied by indexing the new architecture document in `docs/architecture/README.md`.

## User Acceptance Evidence

- **State: Waiting for User.** This is the final governing design constitution; acceptance is the **Home Owner's** — both that this is the right permanent standard of craft and method for the house, and, specifically, that the project may now **shift its centre of gravity from architecture to implementation** (§ 9, the Completion Rule).
- **The decision this document records rather than assumes:** that architectural design work is **complete**, and that future work should normally be implementation · refinement · verification only, with new architecture introduced only on a genuine architectural conflict. This is a governance decision with real consequences (it changes the default answer to *"should we write new architecture for this?"* to **no**), and it is placed with the Home Owner deliberately.
- **The standard this establishes, named so it cannot be crossed silently:** no room is *finished* until it meets the Craftsmanship Standard (§ 3–§ 6), was designed by the architecture-first Method (§ 7), and passes the Quality Standard's one question — *"Would I happily spend time here?"* (§ 8). A room that passes every gate but fails that question is not finished.
- **Evidence for review:** the governing document at `docs/architecture/THA_CRAFTSMANSHIP_CONSTITUTION.md`; this report; the README index entry and governing summary; the session record at `.engineering/session/runs/CRAFT1_Craftsmanship_Constitution.md`.

---

*The drawings are done. This report records the moment the house passes from being designed to being built — and the single standard by which every room, from here on, is judged worthy of the household who will live in it.*
