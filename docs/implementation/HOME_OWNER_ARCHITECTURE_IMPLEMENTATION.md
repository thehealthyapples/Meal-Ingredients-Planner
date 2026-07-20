# HOMEOWNER1 — Home Owner Architecture: Implementation Report

**Date:** 2026-07-20
**Status:** COMPLETE — governance only; no implementation changes made
**Deliverable:** `docs/architecture/HOME_OWNER_ARCHITECTURE.md` (`HOMEOWNER1`)
**Rollback identifier:** `rollback/HOMEOWNER1-home-owner-architecture-20260720` → `f36dfece` (annotated tag)
**Session:** `.engineering/session/runs/HOMEOWNER1_Home_Owner_Architecture.md`

> **Filing note:** this report sits at the mission-specified path (`docs/implementation/` root). The structure gate's "no loose files" check already fails at the rollback tag (pre-existing loose reports); this follows the `PLANNER_MEALS1`/`UIOWN1` precedent and the mission's explicit path.

---

## 1. Governance added

One governing architecture document, `docs/architecture/HOME_OWNER_ARCHITECTURE.md`, indexed in `docs/architecture/README.md` (Experience Governance) and cross-referenced from `UI_CANONICAL_EXPERIENCE_OWNERSHIP.md` (mission-directed). It establishes:

- **The Home Owner role** — the single creative authority for THA's emotional, aesthetic and hospitality character. Feeling, not functionality.
- **The rule-vs-judgement distinction** the document rests on: every aesthetic *rule* stays with its existing owner (UIA, Experience Language, Blueprint, OHDB, Kept Room Translation, LIVINGHOME1/2); the Home Owner holds the *judgement* those owners' gates already required of "the owner" without defining the seat — approvals, refusals, and amendment initiative, exercised **through the governing documents, never around them**.
- **Ten governing principles**, an **Owns table** (decision authority per concern, rule-owner cited unchanged for each), an explicit **Does Not Own** list (each excluded concern's true owner named, plus the GEA23 boundary: authority over the product's character, never over a household), **relationships** with Living Home, UIOWN1, Intelligence Platform, Companion, Community, Household and Planner, the **eight-question Decision Framework** (complementing, never replacing, the existing gate stack), and **Design Authority** (teams propose; the Home Owner approves; engineering never substitutes convenience for experience quality without explicit, recorded approval).
- **Role holder at adoption:** the platform owner (Colin Clapson), recorded in the document header; succession only by amendment.

## 2. Conflict check performed, and the one conflict resolved

The mission's "Owns" list named concerns whose rules are already owned (visual identity/palette/typography/motion — `THA_UI_ARCHITECTURE.md`; atmosphere/tone/calm/joy — `THA_EXPERIENCE_LANGUAGE.md`; materials/lighting/layout — Blueprint/OHDB/Translation; dressing — `LIVINGHOME2`; North Star quality — EXP1/Blueprint § 17). Read as rule-ownership, the document would have created duplicate ownership of most of the Experience canon — forbidden by Principle 2, GEA18, and `UIOWN1`.

**Resolution:** the document defines the Home Owner as a **role holding decision authority**, not a rival owner of rules. Every row of the Owns table cites the unchanged rule-owner; the binding law states that a Home Owner decision contradicting a governing rule is an amendment proposal to that rule's owner, never an exception. This also fills a genuine gap the canon itself records: its aesthetic gates all terminate in an undefined "owner approval" (`EXP3` Verdict 3, `LIVINGHOME2` § 10.2 reviews, every admission). No other conflicts were found; no existing owner was amended. The one edit outside the new document and the README is the mission-directed cross-reference added to `UI_CANONICAL_EXPERIENCE_OWNERSHIP.md` § Position in governance (the facts-axis/feeling-axis split) — an addition to a document authored this session, restating no rule.

## 3. Architecture compliance — confirmed

Both compliance blocks are completed in the architecture document itself: **no duplicate ownership** (the role owns judgement; every rule cited to its unchanged owner) · **no duplicate business logic** · **no duplicate state** (approvals recorded in existing decision records; no new store) · **existing owners remain unchanged** (not one rule, value, domain, or engine moves) · **governance only** · **extends existing architecture** (completes the canon's own "owner approval" pattern; preserves the full gate stack). AI side: **no new AI capability · Companion ownership unchanged · Intelligence Platform unchanged · Capability Registry unchanged · Intent Engine unchanged.**

## 4. No implementation changes — confirmed

- No application code, schema, migration, API, route, token, asset, string, component, store, or test was touched.
- `git diff --stat` against the rollback tag shows only: the new architecture document, the README index (row + summary), the one-bullet cross-reference in `UI_CANONICAL_EXPERIENCE_OWNERSHIP.md`, this report, and the two `.engineering/session/` files.
- `repo-structure-verify.sh`: "every architecture document indexed in README.md" **PASS**; the two loose-file failures are pre-existing at the tag (see filing note).
- No build, typecheck, or test surface affected; none claimed re-run beyond confirming the diff contains no code path.

## 5. State

**Waiting for User.** Acceptance is the owner's review — the role defined is the owner's own seat, so the review question is simply whether its bounds are the ones intended: judgement through the gates, rules with their owners, amendment never exception.
