# KNOW5 — Safe Knowledge Expansion Foundations — Implementation

**Date:** 2026-07-09
**Branch:** `int1-intelligence-platform`
**Risk:** 🔴 RED
**Reason:** Changes what the application appears to know. Every benefit chip on every food surface goes dark until its composition premise is cited and a human signs it off. That reduction is the deliverable, not a side effect.

**Source investigation:** `docs/investigations/knowledge/KNOW5_KNOWLEDGE_EXPANSION_READINESS.md`
**Implements:** KNOW5A (composition evidence contract), KNOW5B (reversible publish), part of KNOW5C (reviewer identity, composition sign-off)
**Imports:** nothing. No food was added. KNOW5 makes importing safe; KNOW6 imports.

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Rollback tag | `rollback/before-know5-20260709` → `f0ab371033fbf221830da0dabe348d60211cd47c` |
| Working tree at start | Intentionally dirty — pre-existing KNOW4 / COMP2 / PLAN1 / LEARN1 work, untouched and preserved |
| Database migration | `migrations/0002_know5_composition_evidence.sql` — applied |
| Database rows written | **none** (0 inserted, 0 updated, 0 deleted) |
| Rollback to committed state | `git checkout rollback/before-know5-20260709` |
| Rollback the migration | `ALTER TABLE knowledge_food_nutrients DROP COLUMN IF EXISTS source_refs, DROP COLUMN IF EXISTS reviewed_at, DROP COLUMN IF EXISTS reviewed_by;` then `DROP COLUMN IF EXISTS reviewed_by` on `knowledge_food_benefits` and `knowledge_nutrient_benefits` |

Dropping the columns restores the previous render behaviour exactly, because no row's data was altered. The 755 chips return, defects included.

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md`
- [x] `docs/investigations/knowledge/KNOW5_KNOWLEDGE_EXPANSION_READINESS.md`
- [x] `shared/knowledge/evidence.ts`, `claim-sources.ts`, `index.ts` (the existing Layer-1/Layer-2 implementation)

---

## 1. WHAT WAS WRONG

A food's benefit chip rendered when three edges lined up:

```
  food → benefit        AI-drafted, ungated (the editorial assertion)
  food → nutrient       AI-drafted, ungated, NO evidence columns existed
  nutrient → benefit    SourceRef + reviewedAt  ← the only gated edge
```

The chip inherited the **nutrient claim's** citation. That citation attests *fibre supports gut health*. It does not attest *this food is a notable fibre source* — and that premise, the part that is actually food knowledge, was the one link in the chain with no source, no reviewer, and no column to hold either.

755 chips rendered. 382 rested solely on an AI-drafted premise no human had reviewed. Among them, `plain-wheat-flour → gut-health` and `arrowroot → heart-health`, both wearing a genuine NHS citation, both resting on the false premise that refined white starch is a notable fibre source.

Separately, `seed-knowledge-registry.ts` was a pure upsert. It contained no `DELETE` and no deactivation sweep, so the database was a superset of its owner and could only grow. `plant-protein` had been retired from the nutrient vocabulary and still sat live with 38 composition rows pointing at it. **A bad import could not be undone by fixing the seed and re-running it.**

---

## 2. WHAT WAS BUILT

### 2.1 Composition evidence contract

`knowledge_food_nutrients` now carries the same Layer-2 shape the nutrient↔benefit edge already had:

| Column | Purpose |
|---|---|
| `source_refs jsonb` | ≥1 `KnowledgeSourceRef`, Layer-1 validated (https, trusted domain, ISO `lastReviewed`) |
| `reviewed_at timestamptz` | Human sign-off, per claim |
| `reviewed_by text` | Reviewer identity |

No backfill. `NULL reviewed_at` means "not reviewed", which is the truth for all 1,988 pre-KNOW5 rows. The authored `confidence` column — which 671 AI-drafted rows set to `'established'` about themselves — is **storage only** and is read by nothing in the gate.

`reviewed_by` was added to all three claim tables. Rows signed off before KNOW5 keep a `NULL reviewed_by`; they are not retroactively invalidated, but no new anonymous sign-off can be created.

### 2.2 Benefit claims require the full chain

`backedBenefitsViaNutrientBridge()` and `getFoodsForBenefit()` now require **both** edges to pass `isEvidenceBackedClaim()`. A chip renders only when:

```
  food → nutrient      cited + signed off      ← NEW
    ⋈
  nutrient → benefit   cited + signed off
    ∩
  food → benefit       editorially declared (the selector)
```

The chip now carries the citations for **both** edges, deduplicated by URL — the user sees the source for "salmon is an oily fish rich in omega-3" alongside "omega-3 contributes to normal heart function".

The `food → benefit` row's own `source_refs` / `reviewed_at` — **gap G4**, previously written by nothing and read by nothing — now have exactly one defined meaning: a directly cited food-specific claim, which lifts a chip from **Strong** to **Established**. It can only ever *add* evidence. It can never license a chip on its own, which is asserted by test.

The reverse lookup was gated identically. Without that, a benefit page would list a food whose own page refuses to show the chip.

### 2.3 A cited composition pack

`shared/knowledge/composition-sources.ts` — 49 cited composition claims across 15 nutrients and 29 foods. It is the composition edge's answer to `claim-sources.ts`, and it obeys the same two rules:

- **Citations only.** Every `(food, nutrient)` pair must already exist in `FOOD_NUTRIENT_SEED`. 19 candidate pairs were dropped during authoring because no such link existed (`kale → calcium`, `cheddar → zinc`, `liver → copper` …). *A citation may not introduce a claim.* Enforced by `validateKnowledgeSeed()`.
- **Layer-1 trusted sources only.** No allowlist widening was required — the NHS states food-specific composition directly, on `nhs.uk`, already trusted. The proposed governance decision to admit USDA FDC / `gov.uk` CoFID (investigation §20 item 2) was **not needed and was not taken**.

Every `title` quotes the source page verbatim, and every page was fetched and read on 2026-07-09. Where the page names a category rather than the food (`"red meat"`, `"oily fish – such as salmon…"`), the verbatim quote makes the instance-of step visible so a reviewer can accept or reject it. That judgement belongs to the reviewer, which is why nothing here renders unsigned.

The pack cites **no flour, starch, oil, yeast or spice** (§10.3 portion plausibility). The NHS calcium page explicitly excludes spinach — `"green leafy vegetables – such as curly kale, okra but not spinach"` — so `spinach → calcium` is uncited and its chips stay dark. That is the pack working as intended, and it is asserted by test.

### 2.4 Reversible publish

`seed-knowledge-registry.ts` gained reconciliation. A row the owner no longer authors is **deactivated** (`is_active = false`), never hard-deleted. It keeps its id, citations and sign-off history. Re-adding it to the seed reactivates it on the next run — that symmetry is what makes an import reversible.

```
npm run seed:knowledge                # upsert, then reconcile
npm run seed:knowledge -- --dry-run   # report what WOULD change; write nothing
npm run seed:knowledge -- --no-reconcile
```

There is no `DELETE` in the file, and a test asserts there never is one.

### 2.5 The sign-off gate

`npm run knowledge:signoff` now covers the **composition edge** as well as nutrient↔benefit, and `--reviewer` is **mandatory**:

```
npm run knowledge:signoff -- --confirm REVIEWED --reviewer "Your Name"
```

An anonymous `reviewed_at` records that *someone* approved a health claim without recording who, so it can never be audited, attributed, or withdrawn. Confirming without `--reviewer` exits 1 and writes nothing.

---

## 3. THE EVIDENCE CONFIDENCE MODEL

Four levels, derived **solely from the evidence chain and the review status**. Never authored, never stored, never inherited from a `confidence` / `evidence_strength` column.

| Level | Label | Condition | Renders? |
|---|---|---|---|
| `under-review` | **Under Review** | Any required edge is unsourced, untrusted, or unreviewed | **No** — honest gap |
| `emerging` | **Emerging** | Chain complete; its weakest valid citation is `emerging` | Yes, as Emerging |
| `strong` | **Strong** | Every edge established; the claim is *derived* through the nutrient bridge — no source names this food and this benefit together | Yes |
| `established` | **Established** | Every edge established **and** the `food → benefit` claim is itself directly cited and signed off | Yes |

Rules the implementation enforces, each with a test:

- **The weakest link governs.** A chain is never stronger than the edge that supports it least. An `emerging` composition premise drags an `established` nutrient claim down to Emerging.
- **A missing edge is a gap, not a weak claim.** It yields `under-review` and renders nothing, rather than degrading to Emerging.
- **An `emerging` claim is never presented as `established`** (`ENGINEERING_WORKFLOW.md` STEP 7 hard stop).
- **An authored `confidence: 'established'` column cannot lift an uncited premise.** The gate reads citations and sign-off, and nothing else.
- **Direct corroboration can only add.** An evidence-backed `food → benefit` row raises Strong → Established; on a broken chain it still yields `under-review`.

Where several nutrients reach the same benefit, the best-evidenced route wins and every qualifying route's citations are merged onto the chip.

Surfaced on `DisplayBenefit.confidence` and, for the composition edge, on `FoodNutrientLink.evidenceConfidence`. No UI was changed — rendering the label is a product decision outside this scope.

---

## 4. BEFORE / AFTER CLAIM COUNTS

All figures measured against the live database this workspace is configured against. "Chips" = rendering `food → benefit` claims.

### 4.1 The claim surface

| State | Chips | Foods with ≥1 chip | Cited composition rows | Signed-off composition rows |
|---|---|---|---|---|
| **Before KNOW5** | **755** | 486 | 0 of 1,988 | 0 |
| **After KNOW5 (now — code + migration, nothing seeded, nothing signed)** | **0** | 0 | 0 | 0 |
| After `npm run seed:knowledge` | 0 | 0 | **49** | 0 |
| After `npm run knowledge:signoff … --reviewer` (composition only) | **38** | 29 | 49 | 49 |
| After signing off **both** edges (the default run) | **48** | 29 | 49 | 49 |

The drop to 0 is the gate, not the data: the same rows, evaluated under the old gate, still compute 755. Nothing was deleted, deactivated, or edited to achieve it.

The `755 → 0` step is honest and temporary. The `0 → 48` step requires a human to read 49 citations and take responsibility for them. That is Rule KC9 working, not a bug.

### 4.2 What does and does not come back

Of the 48 chips a full sign-off restores, **every premise is cited to an NHS page**. Zero belong to F1's defect class:

| Food | Before | After full sign-off |
|---|---|---|
| `plain-wheat-flour → gut-health [NHS]` | rendered | **dark, permanently** |
| `arrowroot → heart-health [NHS]` | rendered | **dark, permanently** |
| `cornflour`, `potato-starch`, `tapioca-flour`, `semolina-flour`, `active-dry-yeast` | rendered | **dark, permanently** |
| `salmon → heart-health` | rendered on an uncited premise | rendered on `NHS: oily fish → omega-3` |
| `lentils → gut-health` | rendered on an uncited premise | rendered on `NHS: beans, lentils or chickpeas → fibre` |
| `spinach → calcium` chips | rendered | **dark** — the NHS calcium page excludes spinach by name |

707 of the 755 chips do not return under the current pack. They are not lost knowledge; they are claims THA cannot presently source. Each returns the moment someone cites its composition premise.

### 4.3 Reconciliation (dry run — nothing written)

`npm run seed:knowledge -- --dry-run` reports exactly the F2 fixture and nothing else:

| Table | Rows the seed no longer owns |
|---|---|
| `knowledge_nutrients` | 1 — `plant-protein` |
| `knowledge_food_nutrients` | 38 — every `* → plant-protein` link |
| `knowledge_nutrient_benefits` | 2 — `plant-protein → muscle-recovery`, `→ energy-support` |
| `knowledge_foods` | 0 |
| `knowledge_food_benefits` | 0 |
| **Total** | **41**, all soft-deactivated, none deleted |

That the other three tables report 0 is itself evidence: the database is otherwise exactly its owner. This closes KNOW2 SUGGESTION 2, correctly, for the first time — the rows survived re-seeding because the seed physically could not remove them.

---

## 5. MANUAL VERIFICATION

Performed against the live database. Every step left it unchanged.

**1. The defect is gone at the route users actually hit** (`getFoodIntelligence`):

```
plain-wheat-flour    healthBenefits=[]  keyNutrients=["Fibre","Manganese","Protein"]
tomato               healthBenefits=[]  keyNutrients=["Lycopene","Vitamin C","Potassium"]
spinach              healthBenefits=[]  keyNutrients=["Folate","Iron","Vitamin K"]
```

Composition still shows. Only *claims* are gated. A food showing its nutrients and no benefit chip is honest; `plain-wheat-flour → gut-health [NHS]` was not.

**2. The gate, not the data, caused the drop.** Same rows, old gate: 755. Same rows, new gate: 0.

**3. The sign-off gate refuses to publish anonymously:**

```
$ npx tsx server/seeds/signoff-knowledge-claims.ts --confirm REVIEWED
Refusing to sign off anonymously: --reviewer is required.
exit code 1
```

**4. Reconciliation dry run** reported the 41 `plant-protein` rows and wrote nothing.

**5. Reversibility proven end-to-end, not asserted.** `test-know5-evidence-contract.ts` §7 imports the seed runner's own `deactivateAbsentRows()` and `upsertFoodNutrients()`, drives them against the real database inside a transaction, and rolls back:

- reconcile deactivates exactly 38 composition + 1 nutrient + 2 nutrient↔benefit rows;
- the table's **total row count is unchanged** — nothing is deleted;
- a row deactivated by hand is **reactivated** by re-running the upsert;
- re-seeding attaches 49 citations and grants **zero** sign-offs;
- after rollback the database is byte-identical to before.

**6. Database state after the entire session** — identical to the baseline:

```
fn_total=1988  fn_active=1988  plant_protein_active=38  cited=0  signed=0  nutrients_active=36
```

**7. Test suites.** `test-know5-evidence-contract` — 109 passed / 0 failed (66 with no DB). Full knowledge + downstream intelligence set green:

```
knowledge-evidence-gate · knowledge-claim-coverage · knowledge-food-ownership · knowledge-registry
canonical-knowledge-binding · know4-graduated-food-reports · know5-evidence-contract
intelligence-nutrition-knowledge-binding · int50-food-intelligence-composition · comp1-food-comparison
intelligence-food-intelligence-binding · nutrition-enrichment          →  all PASS
```

`tsc --noEmit` reports 192 errors, exactly the pre-existing count on `f0ab371`. None are in KNOW5 files.

### 5.1 Two existing tests were changed, and why

**`test-know4-graduated-food-reports.ts` §7a asserted the defect.** It required `plain-wheat-flour` to surface ≥1 evidence-backed benefit, and the seven KNOW3 bindings to reach 13 such claims. Both were true, and both were the bug: the citation backing each chip attested a nutrient-level sentence while the food-specific premise was an unreviewed AI draft. The assertions are inverted — the seven now surface 0 benefit claims and still surface their graduated nutrients — and a new check names `plain-wheat-flour` explicitly. **This is the single most important line item in this document: a green test suite was encoding the error.**

**`test-knowledge-food-ownership.ts` enforced one writer.** The sign-off gate now writes `knowledge_food_nutrients`, so the check would fail. It was not loosened; it was made precise. The boundary is a **column split, not a table split**:

- `seed-knowledge-registry.ts` owns the **facts** (identity, links, citations, `is_active`) and is asserted never to write `reviewed_at` / `reviewed_by`;
- `signoff-knowledge-claims.ts` owns the **review** (`reviewed_at`, `reviewed_by`) and is asserted to write nothing else.

That split already governed `knowledge_nutrient_benefits` before KNOW5. Rule KC9 requires it: if automation authors candidates and a human publishes them, the publishing write cannot live in the seed. `server/tests/` is excluded from the runtime-writer scan, because a test is a driver of an owner, not an owner.

---

## 6. ARCHITECTURE COMPLIANCE CHECKLIST

```
☑ One canonical identity
  No new entity or key space. Claims are keyed on the existing (food, nutrient)
  and (nutrient, benefit) pairs.

☑ One owner per fact
  seed-knowledge-registry.ts remains the sole writer of knowledge FACTS.
  signoff-knowledge-claims.ts remains the sole writer of the REVIEW columns —
  a pre-existing split, now enforced by test rather than convention.

☑ No duplicate entities
  composition-sources.ts creates no link. It may only cite links that already
  exist; validateKnowledgeSeed() refuses to seed if it does otherwise.

☑ No duplicate ownership
  Evidence Confidence is DERIVED at read time and stored nowhere. It cannot
  drift from the evidence chain because it has no independent existence.

☑ No duplicate state
  No user state touched.

☑ Extends existing architecture
  The composition edge is given the Layer-2 shape the nutrient↔benefit edge has
  had since PKC Phase 0. Same validator, same gate function, same sign-off
  script. No new pipeline (Rule R1).

☑ Progressive enrichment
  Identity → composition → benefits. A food may hold identity and composition
  with no benefit claim; §10.3 requires exactly this for spices, oils and
  refined starches.

☑ Honest gaps over fabricated information
  The central act of this workstream. 755 chips became 0 rather than let an
  uncited food-specific premise wear a real NHS citation.

☑ No permanent synchronisation bridge
  None. Citations attach at the single writer.

☑ Evolution over replacement
  No store replaced. The bulk `--confirm REVIEWED` path is narrowed (reviewer
  required, composition covered) and named for retirement under KNOW5C.
```

**AI ARCHITECTURE COMPLIANCE:** no assistant, capability, intent, or conversation state is created or altered. Item 9 — *produces honest gaps rather than fabricated knowledge* — is the purpose of the work.

**Conflict with governing architecture:** none. KNOW5 closes the second declared-not-enforced gap (Rule KC8) that `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` §4.1 did not name: Layer 2 was closed for one of the three edges a chip depends on.

---

## 7. DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Food / Nutrition Knowledge (SoT Register Domain 1)
Declared SoT:    shared/knowledge/ → server/seeds/seed-knowledge-registry.ts
                 → knowledge_* tables
New store created? NO
Existing store extended? YES — three nullable columns on knowledge_food_nutrients,
                 one on each of knowledge_food_benefits and knowledge_nutrient_benefits.
                 One new editorial dataset (composition-sources.ts) which owns
                 CITATIONS for existing links and no links of its own.
Consumer created? NO — existing consumers read the same helpers, now gated.
                 Reads from declared SoT? YES
```

---

## 8. ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Food / Nutrition Knowledge — claim trust (Layer 2)

Current Canonical Owner:
  shared/knowledge/ → server/seeds/seed-knowledge-registry.ts → knowledge_* tables
  (SoT Register Domain 1). Review columns: server/seeds/signoff-knowledge-claims.ts.

Current Runtime Consumer(s):
  server/services/nutrition-knowledge-registry.ts (the only benefit reader),
  reached via food-report-evidence.ts, food-intelligence-assembler.ts,
  meal-intelligence-assembler.ts, Pantry Explore routes, INT4 knowledge binding.

Duplicate Owners Remaining:
  NONE for facts. The review columns have a second, deliberate writer
  (the sign-off gate), enforced as a column split by test-knowledge-food-ownership.

Duplicate State Remaining:
  NONE. Evidence Confidence is derived, never stored.

Duplicate Workflows Remaining:
  ONE — the bulk `knowledge:signoff --confirm REVIEWED` path duplicates, in
  spirit, the per-claim state machine that knowledge_review_decisions already
  implements for vocabulary aliases. Retirement plan: KNOW5C.

Current Convergence (%):
  Claim-trust enforcement: 3 of 3 evidence-bearing edges now gated (was 1 of 3).
  Counting the edges a rendered chip depends on: composition (gated, NEW),
  nutrient→benefit (gated), food→benefit (gated as optional corroboration, NEW).
  = 100% of the render path. Previously 33%.

  Claim-trust COVERAGE (claims that can actually cite a source):
  49 of 1,950 composition links cited = 2.5%. This is low and it is honest.
  Before KNOW5 the figure was 0%, reported as 100% by 755 rendering chips.

Target Convergence (%):
  Enforcement 100% (reached). Coverage: raised by KNOW5E (composition source
  ingestion) and KNOW6 (import), not by this workstream.

Next Planned Milestone:
  KNOW5C — route claim review through the existing knowledge_review_decisions
  state machine (per-claim approve/reject, terminal `rejected`, audit row).
  KNOW5D — Layer 3 EFSA wording firewall.
  KNOW5E — USDA FDC / gov.uk CoFID composition reader.

Remaining Architectural Risks:
  G3 (bulk sign-off is approve-all and unauditable) — narrowed, not closed.
  G5 (no wording firewall), G6 (category vocabulary split), G7 (canonical↔knowledge
  bridge at 12%), G8 (25 duplicate identities), G9 (SoT Register stale: claims 188
  foods, actual 610), G10 (no external composition importer). All tracked, none
  regressed by this work.
```

---

## 9. DEFINITION OF DONE

**Success looks like:** no benefit claim reaches a user unless every evidence-bearing edge beneath it carries a Layer-1 valid citation and a named human sign-off; retired knowledge can be withdrawn and restored without a hard delete; every claim reports an Evidence Confidence derived only from that chain.

**What must not break:** food composition still renders (it is not a health claim); the seed remains the one writer of facts; no citation may introduce a claim; re-seeding never grants or revokes a sign-off; `getFoodsForBenefit` and `getFoodBenefitsForDisplay` never disagree.

**Manual test steps:** §5 above. Reproduce the counts with `npm run seed:knowledge -- --dry-run` and `npm run test:know5-evidence-contract`.

---

## 10. DATA IMPACT

- Reads existing data: **YES**
- Writes new data: **NO** — 0 rows inserted, updated or deleted. The only database change is additive DDL.
- Changes meaning of existing data: **NO** — but it changes what is *rendered* from it. An uncited composition row meant "reviewed and established" by implication; it now means "Under Review", which is what it always was.
- Requires backfill: **NO.** Deliberately. `NULL reviewed_at` is the truth.

---

## 11. TRUST CHECK

- **Could this mislead the user?** The opposite, and that is the point. It removes 755 claims, 382 of which rested on an unreviewed AI premise and 32 of which were demonstrably false, in exchange for 0 — rising to 48 fully cited claims once a human signs them off. A user who sees no benefit chip is not misled. A user who saw `plain-wheat-flour → gut-health [NHS]` was.
- **Could this fabricate certainty?** No. Every citation quotes a page fetched and read on 2026-07-09, verbatim, with the URL beside it. Where a page names a category (`"red meat"`) rather than the food, the quote exposes the inference so the human reviewer decides. Nothing renders before that decision.
- **Is anything guessed but shown as real?** No. 19 candidate citations were dropped rather than invent the links they would have cited. Numeric composition remains uncited and unused — a public-health page supports "notable source of", never a gram figure. `amount` stays unused until KNOW5E.
- **What happens if the system is wrong?** If the pack over-cites, a reviewer rejects a claim at sign-off and it never renders. If a signed-off claim later proves wrong, reconciliation deactivates it reversibly. If the whole workstream is wrong, `DROP COLUMN` restores the previous behaviour exactly, because no row was altered.
- No architectural duplication introduced: **YES**
- No new source of truth created: **YES** (composition-sources.ts owns citations for links it does not own)
- Runtime behaviour altered: **YES, intentionally** — this is a 🔴 RED implementation and §4 records the reduction.

---

## 12. SCOPE LOCK

**Implemented:**
- Composition evidence contract on `knowledge_food_nutrients` (`source_refs`, `reviewed_at`, `reviewed_by`).
- Full-chain gate: both evidence-bearing edges required before a benefit renders, forward and reverse.
- `knowledge_food_benefits.reviewed_at` given a defined meaning and a reader (G4 closed).
- Evidence Confidence model (Established / Strong / Emerging / Under Review), derived solely from the evidence chain and review status.
- Reversible publish: reconciliation by soft deactivation; no hard deletes; reactivation by re-seed; `--dry-run`.
- Reviewer identity mandatory on sign-off; sign-off extended to the composition edge.
- 49 NHS-cited composition claims (citations only — no new links, no new foods).
- `test-know5-evidence-contract.ts` (109 checks), wired into `npm test`.

**Explicitly excluded — not done:**
- **No foods imported.** No draft graduated. No YAML touched.
- **No database rows written.** Migration only. The seed and sign-off are left for a human to run.
- **No sign-off performed.** Chips stay at 0 until a named reviewer signs the 49 composition claims.
- **No trusted-domain allowlist change.** The proposed USDA FDC / CoFID admission was not needed and not taken.
- Observation Engine, Behaviour Engine, Household Learning, Planner Intelligence: **untouched**.
- KNOW5C (per-claim approve/reject through `knowledge_review_decisions`), KNOW5D (wording firewall), KNOW5E (composition source ingestion), KNOW6 (the import): specified in the investigation, not built.
- No governing document amended, including the stale SoT Register (G9).
- No UI renders the Evidence Confidence label yet — it is returned by the service, not displayed.

**SUGGESTION (out of scope — do not implement without approval):**

1. **The 707 dark chips are a backlog, not a loss.** Most are one NHS citation away from returning. The cheapest next unit of value is not KNOW6 — it is extending `composition-sources.ts` to the foods users see most.
2. **`knowledge:signoff` still approves all valid pending claims at once.** At 49 composition claims a human can read the printout and mean it. At import scale it becomes a rubber stamp. KNOW5C should land before any large import, as the investigation argued.
3. **G9 (SoT Register says 188 foods; the true figure is 610)** remains uncorrected and is now further out of date. KNOW5 establishes the figures; correcting the register needs approval.
4. **`test-know4-graduated-food-reports.ts` asserted the defect and passed.** Worth asking which other suites encode current behaviour as intent. A test that pins a claim to a number should say which citation earned that number.
