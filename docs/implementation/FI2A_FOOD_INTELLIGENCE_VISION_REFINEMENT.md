# FI2A — Food Intelligence Vision Refinement — Implementation

**Date:** 2026-07-03
**Branch:** `int1-intelligence-platform`
**EWO:** EWO-FI2A (🟢 GREEN — documentation refinement only. No code, schema, runtime, or API changes.)
**Risk:** 🟢 GREEN
**Reason:** Refines the already-approved `FI2_FUTURE_STATE_FOOD_INTELLIGENCE_EXPERIENCE.md` in place — adds a governing mission statement, adds the Learning Loop as a sixth core experience principle, and strengthens existing philosophy language. No new surface, capability, conversation pattern, or roadmap phase is introduced; nothing is renumbered or removed.
**Companion documents:** `docs/investigations/FI2_FUTURE_STATE_FOOD_INTELLIGENCE_EXPERIENCE.md` (the document refined by this task); `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (the governing architecture FI2 sits on, cited but not modified).

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-fi2a-food-intelligence-vision-refinement-20260703` |
| Working tree at start | Dirty with substantial prior uncommitted INT35–NUT1/FS-series/FI1/FI2-series work on this branch — pre-existing, unrelated to this task |
| This task's writes | Modified: `docs/investigations/FI2_FUTURE_STATE_FOOD_INTELLIGENCE_EXPERIENCE.md` (in place). New: `docs/implementation/FI2A_FOOD_INTELLIGENCE_VISION_REFINEMENT.md` (this file) |
| Code modified | None |
| Schema modified | None |
| Runtime modified | None |

**This is a documentation refinement only.** No application code, database schema, services, routes, or prompts were touched.

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (canonical entry point)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md` (workflow steps, GREEN classification)
- [x] `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (the governing architecture FI2's experience sits on — three-layer separation, four-plane model, Rules T0–T2/G1/P1–P3/E1–E2/GO1–GO2/LT1–LT3/S1/FI1, signal ladder, phased roadmap)
- [x] `docs/investigations/FI2_FUTURE_STATE_FOOD_INTELLIGENCE_EXPERIENCE.md` (the approved investigation being refined — full read)
- [x] `docs/implementation/FI1_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE_PROMOTION.md` (precedent for how a Food Intelligence documentation task records its compliance and rollback)

---

## OBJECTIVE

EWO-FI2 produced an approved future-state experience vision for Food Intelligence. EWO-FI2A's job is narrower than a new design: **refine that already-approved vision in place** with three additions the brief named explicitly:

1. Introduce the governing Food Intelligence mission.
2. Add the Learning Loop as a core Food Intelligence principle.
3. Strengthen the philosophy that Food Intelligence exists to help households spend less time thinking about nutrition and more time enjoying food together.

The brief also required one constraint: **preserve the existing architecture, roadmap, and implementation phases** — meaning §3 (ambient surfaces), §9 (phased experience roadmap), and every citation into FI1's own architecture and phased build roadmap were to be left structurally unchanged. Nothing in FI2's approved content is re-litigated; this task adds exactly three pieces of governing framing and leaves everything else, including section numbering, untouched apart from the new §0 and §2.4 insertions.

---

## WHAT THIS TASK DID

All changes are inside `docs/investigations/FI2_FUTURE_STATE_FOOD_INTELLIGENCE_EXPERIENCE.md`. No section was renumbered, removed, or reordered; two new subsections were added and one existing paragraph gained one sentence.

### 1. Added a refinement note to the document header

A **Refined:** line was added directly under the existing "What this document is not" paragraph, dated 2026-07-03, naming EWO-FI2A, listing exactly what changed (§0, §2.4, the §1/§2.1 philosophy strengthening), and stating explicitly that the architecture (§3, §11), the phased roadmap (§9), and the implementation phases are unchanged. This follows the same "state what changed and what didn't, right at the top" discipline the FI1 promotion used in its own header.

### 2. Introduced the governing Food Intelligence mission (new §0)

A new **SECTION 0 — THE GOVERNING FOOD INTELLIGENCE MISSION** was inserted between the ROLLBACK PROTECTION block and the existing SECTION 1 (Executive Summary):

> **Food Intelligence exists so a household spends less time thinking about nutrition, and more time enjoying food together.**

This is deliberately placed *above* the two statements FI2 already had (the design brief "Confidently Choose Better. Simply." in §1, and the one-sentence experience test in §2.1): those describe *how* the mission is delivered; §0 states *why* it exists at all. §0 draws two direct consequences that govern the existing scenes in §3 and §5 without altering them: thinking-about-nutrition time is a cost to be minimised, not a feature to be maximised; and time-together is the thing every ambient surface exists to protect. §0 closes by stating explicitly that it changes no FI1 architectural rule — it only states why FI1's existing rules (ambient enrichment, silence-by-default, one verb per moment) were the right rules to write.

### 3. Added the Learning Loop as a core Food Intelligence principle (new §2.4)

A new subsection, **2.4 The Learning Loop — a sixth core experience principle**, was added immediately after the existing §2.3 ("What the future-state experience is deliberately NOT") and before §3. It states the loop in household-experience terms — ordinary actions (accepting a swap, dismissing a suggestion, trying a new plant) quietly make next week's Food Intelligence better at being *this household's* Food Intelligence — and grounds every claim in FI1 rules already governing (Rule P1 — learning re-weights, never authors; Rule P2 — decay over delete for negatives; Rule P3 — per-person learning, per-household action; the FI1 §8 Phase 2 gate requiring learned weights to be individually explainable with opt-out/reset shipped before learning ships).

**Why this is additive, not new architecture:** FI1 already specified Rules P1–P3 and the Personalisation Event Log (FI1 §4.2, §7.2) governing learning. §2.4 names, for the first time at the *experience* layer, that closing this loop is a first-class design commitment rather than an implementation detail buried in FI1's Phase 2 roadmap entry — it cites FI1's existing rules and gate, it does not add a new one.

### 4. Strengthened the existing philosophy (one sentence added to §1)

The Executive Summary's second paragraph — which already described Food Intelligence's job as making decisions easier "without ever asking [households] to think about 'nutrition' as a subject" — gained one closing sentence making the "less time thinking about nutrition, more time enjoying food together" philosophy explicit as the document's measure of success, cross-referencing the new §0 mission statement. No existing sentence in that paragraph was removed or altered.

### What was deliberately left untouched

- §3 (ambient surfaces across Planner/Shopping/Cookbook/Pantry/Companion/Community/partners) — unchanged, per the brief's explicit "preserve the existing architecture" instruction.
- §9 (the phased experience roadmap: At Launch / Medium Term / Long Term, gated against FI1 §8) — unchanged, per the brief's explicit "preserve the existing... roadmap and implementation phases" instruction.
- §5 (ideal Companion conversations), §6 (Food Story), §7 (magical moments), §8 (simplicity contract), §10 (permanent exclusions) — unchanged; the Learning Loop and mission are additive framing that these sections already implicitly satisfy (e.g. §7's "swap that shows its work" and §6.2's "first month" row already describe learning-shaped behaviour; §2.4 is the first place that behaviour is named as a principle in its own right).
- §11–§18 (architecture compliance, domain impact, convergence status, definition of done, data impact, trust check, rollback plan, scope lock) — unchanged. These describe the original FI2 investigation task's own compliance record and remain historically accurate; this task's own compliance record is below, in this file, following the same pattern the FI1 promotion used rather than rewriting FI2's original record.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No entity created. §0 and §2.4 name no new entity — they frame existing
  FI1-governed concepts (Rules P1-P3, the Personalisation Event Log) at the
  experience layer.

☑ One owner per fact
  Unchanged. §2.4 explicitly attributes every claim to an FI1 rule already
  governing learning (P1, P2, P3) rather than asserting new authority.

☑ No duplicate entities
  No new entity, store, or document. This task edits one existing
  investigation file in place and adds one implementation record.

☑ No duplicate ownership
  §0 and §2.4 both state explicitly that they change no FI1 architectural
  rule -- they cite FI1's Rule FI1, P1-P3, and the §8 Phase 2 gate as fixed
  constraints, exactly as the rest of FI2 already does for every other claim.

☑ No duplicate state
  N/A -- no state is introduced. The Learning Loop describes the existing
  FI1-named Personalisation Event Log; it does not propose a second copy of
  it or a second learning mechanism.

☑ Extends existing architecture
  §0 extends (does not replace) the existing design brief in §1 and the
  one-sentence test in §2.1. §2.4 extends (does not replace) the five
  properties already listed in §2.2, explicitly framed as a sixth property
  that keeps the other five true over time.

☑ Progressive enrichment where appropriate
  N/A -- no knowledge entity or transactional store is created or modified.

☑ Honest gaps over fabricated information
  §2.4 is explicit that the Learning Loop depends on FI1 Phase 2 components
  (Personalisation Event Log, learned-weight explainability, opt-out/reset)
  that are not yet built -- it cites the FI1 §8 Phase 2 gate rather than
  implying the loop is live today. §9's "what's honestly not yet there at
  launch" callout is untouched and still governs.

☑ No permanent synchronisation bridge
  N/A -- no bridge introduced; this is a documentation edit.

☑ Evolution over replacement
  Nothing in FI2 is replaced. §0 and §2.4 are pure additions; the one
  sentence added to §1 supplements rather than contradicts the existing
  paragraph; every other section is byte-for-byte unchanged.
```

**AI ARCHITECTURE COMPLIANCE:** Not an AI implementation — no assistant, capability binding, intent, or conversation state is created or altered. §2.4 governs *future* learning behaviour already named in FI1 (Phase 2, not yet built); it implements none of it and introduces no new capability or write path.

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Documentation only. Refines the Food Intelligence
  Experience vision (docs/investigations/FI2_...); touches no code-owned
  domain.
Declared SoT: unchanged for every domain (per SoT Register). This task adds
  no current-state claim about any store or service.
New store created? NO
Existing store extended? NO
Consumer created? NO
```

---

## DEFINITION OF DONE

**Success looks like:**
- `docs/investigations/FI2_FUTURE_STATE_FOOD_INTELLIGENCE_EXPERIENCE.md` contains a governing Food Intelligence mission (§0), stated above and distinct from the existing design brief (§1) and one-sentence test (§2.1) ✅
- The Learning Loop is named as a core Food Intelligence experience principle (§2.4), grounded in FI1's existing Rules P1–P3 and Phase 2 gate, not a new rule ✅
- The philosophy that Food Intelligence exists to reduce time spent thinking about nutrition and increase time spent enjoying food together is stated explicitly, both at §0 and reinforced in §1 ✅
- §3 (architecture), §9 (roadmap), and every implementation-phase reference are unchanged — verified by section-heading diff below ✅
- This implementation record exists at `docs/implementation/FI2A_FOOD_INTELLIGENCE_VISION_REFINEMENT.md` ✅

**What must not break:** nothing can — this task touched only one file under `docs/investigations/` plus this new file under `docs/implementation/`. No `.ts`, `.tsx`, schema, or route file was opened for writing.

**Manual test steps:**
1. `git status` shows exactly two files changed for this task: `docs/investigations/FI2_FUTURE_STATE_FOOD_INTELLIGENCE_EXPERIENCE.md` (modified) and `docs/implementation/FI2A_FOOD_INTELLIGENCE_VISION_REFINEMENT.md` (new).
2. Open `FI2_FUTURE_STATE_FOOD_INTELLIGENCE_EXPERIENCE.md` — SECTION 0 appears before SECTION 1, and §2.4 appears after §2.3 and before SECTION 3.
3. `grep -n "^# SECTION" docs/investigations/FI2_FUTURE_STATE_FOOD_INTELLIGENCE_EXPERIENCE.md` shows SECTION 0 through SECTION 18 in order, with no gaps or renumbering of SECTION 1 through SECTION 18.
4. `git tag -l 'rollback/before-fi2a*'` shows the rollback tag (once created per the Rollback Plan below).

---

## DATA IMPACT

- Reads existing data: **NO** (documentation reads only)
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**

---

## TRUST CHECK

- **Could this mislead the user?** No user-facing output exists. §2.4 is explicit that the Learning Loop depends on unbuilt FI1 Phase 2 components; it does not imply learning is live today.
- **Could this fabricate certainty?** No. Every claim in §0 and §2.4 is either a framing statement (why the mission matters) or cites an FI1 rule that already exists (P1–P3, the §8 Phase 2 gate).
- **Is anything guessed but shown as real?** No. This task added no new current-state claim about the codebase; it reframes existing FI2/FI1 content.
- **What happens if the system is wrong?** If the mission framing or the Learning Loop principle proves wrong in practice, it is corrected by a successor refinement, exactly as this document sits alongside (not above) FI2 and FI1.
- No architectural duplication introduced: **YES**
- No new source of truth created: **YES**
- No runtime behaviour altered: **YES**

---

## ROLLBACK PLAN

- Rollback identifier: `rollback/before-fi2a-food-intelligence-vision-refinement-20260703`
- Files modified: `docs/investigations/FI2_FUTURE_STATE_FOOD_INTELLIGENCE_EXPERIENCE.md`
- Files added: `docs/implementation/FI2A_FOOD_INTELLIGENCE_VISION_REFINEMENT.md`
- Rollback commands: `git checkout rollback/before-fi2a-food-intelligence-vision-refinement-20260703 -- docs/investigations/FI2_FUTURE_STATE_FOOD_INTELLIGENCE_EXPERIENCE.md` then delete this file.
- Verification after rollback: `git status` shows only the pre-FI2A dirty set; `FI2_FUTURE_STATE_FOOD_INTELLIGENCE_EXPERIENCE.md` no longer contains SECTION 0 or §2.4.

---

## SCOPE LOCK

**Implemented scope:**
- Reviewed the approved FI2 investigation in full
- Introduced the governing Food Intelligence mission (new §0)
- Added the Learning Loop as a core Food Intelligence experience principle (new §2.4), grounded in FI1's existing Rules P1–P3 and Phase 2 gate
- Strengthened the existing philosophy that Food Intelligence exists to help households spend less time thinking about nutrition and more time enjoying food together (one sentence added to §1, reinforced by §0)
- Preserved the existing architecture (§3, §11), roadmap (§9), and every implementation-phase reference exactly as approved
- Created `docs/implementation/FI2A_FOOD_INTELLIGENCE_VISION_REFINEMENT.md` (this file)
- No runtime behaviour changed; no schema changed; no business logic changed

**Explicitly excluded (out of scope — not implemented):**
- Any change to §3 (ambient surfaces), §9 (phased roadmap), or any implementation-phase content in FI2
- Any change to `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` or any other governing architecture document
- Any implementation of the Learning Loop itself (Personalisation Event Log, learned-weight explainability, opt-out/reset UI) — all remain FI1 Phase 2 future work, named only
- Any rename, renumbering, or removal of any existing FI2 section
- Any change to FI2's own original ROLLBACK PROTECTION, ARCHITECTURE COMPLIANCE, DOMAIN IMPACT, CONVERGENCE STATUS, DEFINITION OF DONE, DATA IMPACT, TRUST CHECK, ROLLBACK PLAN, or SCOPE LOCK sections (§11–§18) — these remain FI2's own historical compliance record for its original authoring task

---

*Documentation refinement only. No code was changed in the production of this document.*
*Rollback: `rollback/before-fi2a-food-intelligence-vision-refinement-20260703`.*
