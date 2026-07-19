# KNOW1 — Nutrition Evidence Publication

**Status:** ✅ Complete — root cause found and corrected; the missing Verification element of the knowledge publication variant is built. **No evidence was signed off, and none was fabricated.**
**Date:** 2026-07-18
**Branch:** `int1-intelligence-platform`
**Rollback:** `rollback/KNOW1-nutrition-evidence-publication-20260718` → `8e25c195`
**Governing architecture:** [`CANONICAL_PUBLICATION_ARCHITECTURE.md`](../../architecture/CANONICAL_PUBLICATION_ARCHITECTURE.md) · [`PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`](../../architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md)
**Follows:** [`HOUSE_ACT3`](../house/HOUSE_ACT3_FOOD_INTELLIGENCE_EXPERIENCE.md) opportunity 1 · [`KNOW5`](./KNOW5_SAFE_KNOWLEDGE_EXPANSION.md)

> **Naming note.** `KNOW1` is already taken by [`KNOW1_FOOD_INTELLIGENCE_EXPANSION.md`](./KNOW1_FOOD_INTELLIGENCE_EXPANSION.md) (an earlier workstream whose residue the `fk-orphan-nutrients` check still watches for). This document is the mission's `KNOW1`; the collision is recorded rather than silently resolved.

---

## 1. Executive summary

The mission asked which of five things blocks nutrition evidence: missing publication, missing review workflow, missing `reviewed_at` lifecycle, missing evidence ownership, or missing publication process.

**Four of the five already exist and work.** The review workflow, the `reviewed_at`/`reviewed_by` lifecycle, evidence ownership, and a governed publication process (`npm run knowledge:signoff`) were all built by PKC Phase 0 and KNOW5 and are correct. The answer is **missing publication** — in the most literal sense available: **the publication step exists, is correct, and has never been run.**

**64 nutrition claims carry valid NHS citations and are publishable right now.** Signing them off would light **89 benefit chips across 29 foods** — through the existing gate, with no rule relaxed. That backlog has been sitting in the database, invisible, because nothing reported it.

It was invisible for a structural reason, and that reason is the actual finding. `CANONICAL_PUBLICATION_ARCHITECTURE.md` defines the **knowledge** variant by exactly one property no other variant has — *"Verification: Published rows are reviewed (gate: `isEvidenceBackedClaim()`)"* and *"Knowledge is the only domain type where `reviewedAt` and `reviewedBy` are mandatory for publication."* **That verification was declared and never built.** The `food-knowledge` publication contract holds six checks; not one of them reads `reviewed_at` or `source_refs`. The step that *defines* the variant was the only one nothing watched — Rule KC8 (*"declared is not enforced"*) holding inside the architecture that names the rule.

**This workstream builds that missing Verification element and nothing else.** It writes no evidence, signs off no claim, and does not touch the Trust Gate except to assert it intact.

---

## 2. Root cause analysis

### 2.1 The correction to HOUSE_ACT3

HOUSE_ACT3 hand-counted these tables, found **0 of 3,354 rows reviewed**, and concluded:

> *"This is a knowledge-curation gap, not a UI gap… it needs a named reviewer signing off `reviewed_at` on real sources."*

That is **half right, and the half it missed is the actionable half.** A row count cannot distinguish two failures that look identical from the outside:

| | Rows | What is missing | Who can fix it |
|---|---|---|---|
| **Curation gap** | 3,299 | A citation. No source exists on the row at all. | A human must *find* a Layer-1 source for each |
| **Publication gap** | **64** | A signature. Citation present and valid. | A human runs **one command** |

HOUSE_ACT3 saw `0 reviewed` and reported one undifferentiated curation problem. So the 64 publishable rows were filed behind 3,299 unresearched ones, and the command that would publish them was never run. **The diagnosis was not wrong about the big number; it was wrong about there being only one number.**

### 2.2 Measured state (live database, 2026-07-18)

| Edge | Total | Active | Cited | Reviewed | **Publishable now** |
|---|---|---|---|---|---|
| `knowledge_food_nutrients` (composition) | 1,988 | 1,950 | 49 | 0 | **49** |
| `knowledge_nutrient_benefits` | 70 | 68 | 36 | 21 | **15** |
| `knowledge_food_benefits` | 1,366 | 1,366 | **0** | 0 | 0 |
| `knowledge_preparation_effects` | 0 | 0 | 0 | 0 | 0 |

The 49 composition citations are all **NHS**, covering 29 everyday foods (salmon, eggs, spinach, chickpeas, oats, lentils, broccoli…). The 15 pending nutrient→benefit claims are all `established`.

### 2.3 Why 21 reviewed rows still render nothing

`knowledge_nutrient_benefits` already has **21 signed-off rows** — and **0 benefit chips render**. This is not a defect; it is KNOW5 working exactly as designed. A chip requires **both** edges signed off (`deriveEvidenceConfidence`, `evidence.ts:211`), and **zero composition rows are signed off**. So the entire chain is blocked by one edge.

This is the most load-bearing fact in the report: **signing off only the nutrient→benefit edge changes nothing a household can see.** The composition edge is the sole blocker, and 49 of its rows are ready.

### 2.4 The pipeline is verified sound

| Element (CPuBA § lifecycle) | State | Evidence |
|---|---|---|
| Canonical Owner | ✅ | `shared/knowledge/claim-sources.ts`, `composition-sources.ts` |
| Authorised Writers | ✅ | `signoff-knowledge-claims.ts` is the **only** writer of `reviewed_at` — verified by exhaustive grep |
| Publication | ✅ | `npm run knowledge:signoff` (`package.json:106`); refuses anonymous sign-off (`:148`) |
| Projection | ✅ | `knowledge_*` tables |
| Runtime Read Path | ⚠️ | one mouth (`nutrition-knowledge-registry.ts`), **one hole** — see F2 |
| **Verification** | ❌ → ✅ | **did not exist. Built here.** |

The seed writes `sourceRefs` and never `reviewedAt` (`seed-knowledge-registry.ts:135,140,224`) — Rule KC9 (*automation authors candidates, never publishes*) is correctly implemented.

---

## 3. What was implemented

### 3.1 The Nutrition Evidence publication contract (primary deliverable)

`server/verification/publication-register.ts` — domain 23, `nutrition-evidence`, variant `knowledge`. Five checks, all live against the database:

| Check | Law | Sev | Reports |
|---|---|---|---|
| `ne-signoff-backlog` | no-stale-projections | warn | Cited-but-unsigned claims — **publishable now**, with the exact command |
| `ne-published-chain` | approved-read-path | warn | Chips actually reaching households through **both** edges |
| `ne-review-identity` | authorised-writers | **fail** | Post-KNOW5 sign-offs with no `reviewed_by` |
| `ne-uncited-claims` | no-publication-drift | warn | Rows that can *never* clear the gate — the curation gap, stated separately |
| `ne-gate-intact` | approved-read-path | **fail** | `isEvidenceBackedClaim()` still requires `reviewedAt` |

Two design decisions worth recording:

**`ne-signoff-backlog` and `ne-uncited-claims` are deliberately two checks, not one.** Merging them would reproduce the exact confusion that caused this workstream — a single number that hides an actionable backlog behind an unresearched one.

**`ne-review-identity` grandfathers pre-KNOW5 sign-offs at the `2026-07-09` boundary.** The 21 existing anonymous sign-offs date from `2026-07-05`, and `evidence.ts:106-113` is explicit that they are *not* retroactively invalidated. Any row signed off on or after KNOW5 went through a writer that refuses `--reviewer`-less runs, so an anonymous one can only mean a write that bypassed the writer. The check therefore runs at `fail` severity with **zero false alarms today** — a bar that is meaningful rather than merely loud.

**`ne-gate-intact` is the mission's *"without weakening the Trust Gate"* clause made executable.** The only sanctioned way to light a claim is to sign it off; lowering the bar is now a detected publication failure.

### 3.2 A false trust guarantee corrected

`server/intelligence/food-intelligence/engine.ts` claimed under Rule E1:

> *"there is no code path that can produce an uncited recommendation."*

**This was not true.** `getFoodsForBenefit()` (`nutrition-knowledge-registry.ts:197`) applies the full KNOW5 chain gate; `getFoodsForNutrient()` (`:181`) filters on `is_active` alone. A nutrient-scope recommendation may rest on a composition edge that is unreviewed, uncited, or both. The comment is corrected to state the scope limit and the reason it is reported rather than closed (§5, F2). A comment that overstates a trust guarantee is more dangerous than one that states a gap, because it is believed.

### 3.3 What was deliberately NOT done

**The 64 claims were not signed off.** A sign-off is a named human taking responsibility for a health claim (Rule KC9). Executing it under an assistant's name would be precisely the rubber stamp `evidence.ts:106-113` and `signoff-knowledge-claims.ts:23-27` exist to forbid — the gate would report a human where there was none. **This was put to the user, who chose verification without sign-off.**

The distinction from HOUSE_ACT3's refusal matters: HOUSE_ACT3 declined to mark 3,354 rows reviewed, which would have been **fabrication**. Declining here is narrower and different — the evidence is real and the claims are genuinely publishable; what is missing is only the accountable human, and no engineering may supply that.

---

## 4. Verification

```
🟡 Nutrition Evidence (KNOW1)  [knowledge]
   ⚠ [WARN] No cited nutrition claim is stranded unpublished
       64 claim(s) carry a Layer-1 valid citation and have never been signed off
       (49 composition, 15 nutrient-benefit). These are PUBLISHABLE NOW …
   ⚠ [WARN] Nutrition evidence reaches a household through the full chain
       0 benefit chips render …
   ⚠ [WARN] Published claim rows can, in principle, be published
       3299 active claim row(s) carry no citation at all …
   ✓ [PASS] ne-review-identity
   ✓ [PASS] ne-gate-intact
```

- `npm run verify:publication` — domain reports `needs-attention`; both `fail`-severity checks **pass**; platform failures unchanged at 4 (this domain adds no red).
- `npm run test:knowledge-evidence-gate` — **116 passed, 0 failed**
- `npm run test:know5-evidence-contract` — **111 passed, 0 failed**
- `tsc --noEmit` — clean on both touched files.

Behavioural change to any household-facing surface: **none.** No row was written; no gate was altered.

---

## 5. Remaining knowledge gaps

| # | Gap | Size | Owner |
|---|---|---|---|
| **F1** | **64 cited claims await a named reviewer.** One command lights 89 chips across 29 foods. **The highest-value item in the platform, and it is now one step, not a programme.** | S | A human reviewer |
| **F2** | `getFoodsForNutrient()` is ungated while `getFoodsForBenefit()` applies the full chain. **Order matters: publish the composition edge first, then gate.** Closing it today would empty every nutrient page rather than light one. | M | Engineering, *after* F1 |
| **F3** | `knowledge_food_benefits`: **0 of 1,366 rows carry any citation**, and the sign-off script has no food→benefit edge. Optional corroboration, so it blocks no chip — but `Established` confidence is unreachable platform-wide; the best any claim can reach is `Strong`. | L | Curation + engineering |
| **F4** | 3,299 active claim rows carry no citation. The genuine curation backlog, now measured and separated from F1. | XL | Curation |
| **F5** | Sign-off is approve-all-valid, not per-claim approve/reject. Honest at 64 rows; a rubber stamp at import scale (`signoff-knowledge-claims.ts:29-33`, KNOW5C). | M | Engineering, before any large import |
| **F6** | No admin UI for claim sign-off — the Knowledge Review Workbench (KQ1B–KQ1F) governs **vocabulary aliases only** and never touches claim evidence. The two lifecycles are easily mistaken for one. | M | Engineering |

### Recommended next step

**F1.** Run `npm run knowledge:signoff` as a dry run, review the 49 NHS composition citations and 15 nutrient→benefit claims against their sources, then:

```
npm run knowledge:signoff -- --confirm REVIEWED --reviewer "Your Name"
```

`ne-published-chain` will move from `0 benefit chips render` to a live count — Food Intelligence becoming visible **because trusted evidence was published**, which is the success criterion this mission set.

---

## 6. Compliance

**Architecture Compliance** — ☑ Architecture Bootstrap read · ☑ Canonical Publication Architecture reused (existing register, existing check factories, no new mechanism) · ☑ one owner per fact (the contract *reads*; it writes nothing and owns no evidence) · ☑ no new domain, store, or write funnel · ☑ Principle 6 (non-fabrication) — the central holding of the workstream · ☑ Rule KC8 (declared-is-not-enforced) closed for the knowledge variant.

**AI Architecture Compliance** — ☑ No capability, prompt, or model path touched · ☑ no second assistant · ☑ no conversation state · ☑ **produces honest gaps rather than fabricated knowledge** — §3.3 and F1–F6 are the instances.

**Experience & UI / Product Registry / Adoption Register** — N/A: no user-facing surface, component, token, or product entry changed. The one behavioural claim corrected (§3.2) is a source comment, not a rendered string.

**Trust Gate preservation** — `isEvidenceBackedClaim()` is **byte-unchanged**. No filter was loosened, no threshold lowered, no bypass added. The gate is now additionally *asserted* by `ne-gate-intact`.

---

## 7. Files changed

| File | Change |
|---|---|
| `server/verification/publication-register.ts` | **+** domain 23 `nutrition-evidence` with five checks (§3.1) |
| `server/intelligence/food-intelligence/engine.ts` | Rule E1 docstring corrected — scope limit stated (§3.2) |
| `docs/implementation/knowledge/KNOW1_NUTRITION_EVIDENCE_PUBLICATION.md` | This report |

No schema change. No migration. No data written.
