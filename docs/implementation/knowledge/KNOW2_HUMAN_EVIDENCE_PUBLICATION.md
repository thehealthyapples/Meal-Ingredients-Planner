# KNOW2 — Human Evidence Publication

**Status:** ✅ Complete — the review workflow is finished and the Admin review experience is built. **No evidence was signed off, and none was fabricated.**
**Date:** 2026-07-19
**Branch:** `int1-intelligence-platform`
**Rollback:** `rollback/KNOW2-human-evidence-publication-20260719` → `772eb6ed`
**Governing architecture:** [`CANONICAL_PUBLICATION_ARCHITECTURE.md`](../../architecture/CANONICAL_PUBLICATION_ARCHITECTURE.md) · [`PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`](../../architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md) · [`ARCHITECTURE_PRINCIPLES.md`](../../architecture/ARCHITECTURE_PRINCIPLES.md)
**Follows:** [`KNOW1`](./KNOW1_NUTRITION_EVIDENCE_PUBLICATION.md) findings **F5** and **F6** · [`KNOW5`](./KNOW5_SAFE_KNOWLEDGE_EXPANSION.md)

> **Naming note.** `KNOW2` is already taken by [`KNOW2_KNOWLEDGE_FOOD_OWNERSHIP_CONVERGENCE.md`](./KNOW2_KNOWLEDGE_FOOD_OWNERSHIP_CONVERGENCE.md). This document is the mission's `KNOW2`; the collision is recorded rather than silently resolved, exactly as `KNOW1` recorded its own.

---

## 1. Executive summary

The mission asked for the trusted human evidence publication workflow to be **completed**, not built — and the audit confirms that framing was right. Of the six things it named, **four already existed and worked**: reviewer attribution (`reviewed_by`), review timestamps (`reviewed_at`), publication status (derived by `isEvidenceBackedClaim()`), and the publication pipeline itself. `KNOW1` had already proven the pipeline sound and had already named what was left, as findings **F5** and **F6**.

**Two things were genuinely missing, and one of them was a trust defect rather than a feature gap.**

The feature gap is F6: there was no Admin surface, so the only way to publish was a command line. That is built.

The trust defect is F5, and it is the substance of this workstream. **`reviewed_at IS NULL` carried two different meanings at once** — *"nobody has looked at this yet"* and *"a qualified reviewer looked at this and refused it"* — and no query could tell them apart. A database with no way to say *no* has three consequences, all silent:

1. A refused health claim is offered back to **every future reviewer, forever**.
2. The next reviewer, shown no record of the refusal, **may approve what a colleague already rejected** — and nothing anywhere marks that it happened.
3. `npm run knowledge:signoff` is **approve-all-valid over whatever is pending**, so a claim rejected on Monday is silently re-approved by the next bulk run on Tuesday.

Rejection was not merely unrepresented. It was **unrepresentable**, and the existing bulk publication path would actively undo it.

**This workstream gives rejection a terminal state, gives every decision a permanent audit row, converges the two writers into one, and builds the per-claim Admin review experience.** It writes no evidence, signs off no claim, and does not touch the Trust Gate except to assert it intact — which is now asserted in two more places than before.

---

## 2. Audit — what already existed versus what was missing

| Element the mission named | State before | Where it lives |
|---|---|---|
| Individual claim **approval** | ⚠️ Partial — approve-all-valid only | `signoff-knowledge-claims.ts` |
| Individual claim **rejection** | ❌ **Unrepresentable** | — |
| **Reviewer attribution** | ✅ Built (KNOW5) | `reviewed_by` on all four claim tables |
| **Review timestamps** | ✅ Built (KNOW5) | `reviewed_at` on all four claim tables |
| **Publication status** | ⚠️ Two states where three were needed | `isEvidenceBackedClaim()` |
| **Audit history** | ❌ Missing for claims | *(ledger existed, for vocabulary only)* |
| **Admin review experience** | ❌ Missing (KNOW1 F6) | — |
| Publication **pipeline** to all consumers | ✅ Built and verified sound | `nutrition-knowledge-registry.ts` |

### 2.1 The distinction that had to be got right

There are **two separate review lifecycles** in THA's knowledge platform, and `KNOW1` finding F6 warned in as many words that they are *"easily mistaken for one"*:

| | Knowledge Review Workbench (KQ1B–KQ1F) | Nutrition Claim Review (this workstream) |
|---|---|---|
| Decides | Which **string** means which nutrient | Whether a **health claim** may be shown at all |
| Owner | `knowledge_review_decisions` | The claim row's own review columns |
| Surface | `/admin/knowledge-review` | `/admin/knowledge-claims` |

`signoff-knowledge-claims.ts:29-33` proposed routing claim sign-off *"through the existing `knowledge_review_decisions` state machine"*. **That was declined, with reason.** That table is FK-bound `NOT NULL` to `knowledge_review_queue` (a vocabulary term) and `knowledge_review_batches` (an import package); a claim has neither. Forcing claims through it would have meant making both keys nullable and adding a discriminator — which is not reuse, it is *two lifecycles wearing one table*, and it would have made the confusion F6 warned about structural.

**What was reused instead is the part that genuinely generalises: the ledger.** `knowledge_review_audit` is already append-only, already carries before/after JSONB snapshots, and already distinguishes `human` / `llm` / `system` actors. Its `entity` column is free text with an existing `(entity, entity_id)` index, so claim decisions extend its vocabulary (`claim:composition`, `claim:food-benefit`, `claim:nutrient-benefit`, `claim:preparation-effect`) exactly as that table's own header comment anticipates. **No second ledger was created**, and a test asserts none appears later.

---

## 3. What was implemented

### 3.1 Rejection as a terminal state

Three nullable columns — `rejected_at`, `rejected_by`, `rejection_reason` — on all four claim tables, plus the pure vocabulary in `shared/knowledge/evidence.ts` (`deriveClaimReviewStatus`, `validateClaimLifecycleState`, `allowedClaimReviewActions`, `canApproveClaim`), which is zero-I/O and sits beside the entity spine under Principle 5.

Two database CHECK constraints carry the invariants, and the choice of *where* is deliberate:

| Constraint | What it forbids |
|---|---|
| `CHECK (reviewed_at IS NULL OR rejected_at IS NULL)` | A claim being approved **and** rejected |
| `CHECK (rejected_at IS NULL OR (rejected_by IS NOT NULL AND rejection_reason <> ''))` | An anonymous or unexplained refusal |

The first is enforced in Postgres rather than in TypeScript because **`reviewed_at` is what the Trust Gate reads**: a row holding both states would be a claim a human refused that renders to households anyway, and TypeScript does not run inside the database. It is the rejection-side twin of KNOW5's *"a sign-off must name its reviewer"*.

**No row is back-filled.** The 21 pre-KNOW5 sign-offs stay approved; the 3,299 uncited rows stay pending. Neither has been rejected by anyone, and marking them so would be the fabrication this architecture exists to prevent.

### 3.2 The transition rules, and the one that matters

```
pending  → approve | reject
approved → reject              (a withdrawal — evidence found wrong later)
rejected → reopen              (back to pending, for re-examination)
```

**`rejected → approve` is deliberately not permitted in one step.** Reversing a colleague's refusal of a health claim must be an explicit two-part act — reopen, then approve — so it can never be a mis-click, and so the reopening is itself a recorded decision with its own named reviewer.

Approval additionally requires the claim to carry a structurally valid Layer-1 citation. **A reviewer's judgement is necessary but never sufficient**: approval writes the very column the Trust Gate reads, so a reviewer may not vouch a claim past a missing source.

### 3.3 One writer, not two — a convergence

`server/lib/knowledge-claim-review-store.ts` is now **the single authorised writer** of every review column on every claim table. `signoff-knowledge-claims.ts` — previously declared *"the ONLY writer of `reviewed_at`"* — now **delegates to it and issues no UPDATE of its own.**

This was not tidiness. Adding an Admin surface with its own UPDATE beside the script's own UPDATE would have created a second owner of the publication fact (Principle 2), and the two would have drifted in exactly the way the platform has been burned by before. The convergence also gives the CLI two properties it could not have had alone: **each claim now gets its own audit row**, and each is approved individually rather than in one undifferentiated `UPDATE ... WHERE id IN (...)`.

Approve-all-valid still exists — but only behind the command line, where a reviewer must read a printed list and type a confirmation flag. **The Admin surface has no bulk button and no bulk endpoint**, and a test asserts it stays that way. That division is now deliberate rather than a gap: F5's rubber-stamp risk is confined to the path where a human must type.

### 3.4 The audit write is not best-effort

`knowledge-review-store.ts:recordAudit` catches and logs its own failures. That is right for a vocabulary alias and **wrong for a health claim**: an approval that succeeds while its audit row is lost is a published health claim that no one can be asked about or told to withdraw — the exact condition KNOW5's reviewer-identity rule exists to prevent, arriving through a different door.

So `recordClaimDecision` writes the claim row and its audit row **in one transaction**, under `SELECT ... FOR UPDATE`. If the history cannot be recorded, the decision does not happen. The row lock is not defensive either: two reviewers opening the same pending claim is the ordinary case, and without it the second one's approval would silently overwrite the first one's rejection.

Both sides of every decision snapshot the citations **verbatim**. A reviewer approves a claim as it read at that moment; if its `source_refs` are edited afterwards, the audit row is the only remaining evidence of what was actually vouched for.

### 3.5 The Admin review experience

`/admin/knowledge-claims`, registered with the shared admin banner and added to the admin navigation — because a review surface nobody can find reviews nothing. Every route is guarded by `assertAdmin` (`server/lib/access.ts` remains the sole authorisation authority; this workstream creates no second one).

Three properties are deliberate:

- **The citation is the page.** A reviewer cannot judge a claim from its slugs, so every source is rendered as a real, openable link with its publisher and the date it was last checked. Approving without opening the source remains possible — no interface can prevent that — but nothing here encourages it.
- **Each claim type states what approval means.** Approving a composition row is not approving that the nutrient is good for you; it is approving that this food is a notable source of it. The server sends that sentence per edge so the page cannot invent or drift from it. For preparation effects the exact household-facing sentence is shown, because **the wording is the claim**.
- **The reviewer's name comes from their session, never from the request body.** A client-supplied reviewer name would let one operator sign a health claim in a colleague's name, which would make KNOW5's attribution worthless precisely when it mattered.

Rejection requires a typed reason before it can be submitted, and refusals from the store are surfaced **calmly with their own words** rather than in the red reserved for genuine data loss — a 409 *"reopen it first"* is the workflow explaining a rule, and raising it as a failure would train reviewers to dismiss the one message telling them what to do next.

### 3.6 Verification made executable

Two new `fail`-severity checks on publication domain 23:

| Check | Asserts |
|---|---|
| `ne-rejection-terminal` | No claim is simultaneously approved and rejected — notices if the CHECK constraint is ever dropped |
| `ne-decisions-audited` | Every claim decided on/after 2026-07-19 has an audit row |

`ne-signoff-backlog` now excludes rejected claims. Without that change, **a refused claim would be reported as "PUBLISHABLE NOW" forever** — the precise bug the rejection state exists to fix, reappearing in the instrument that measures it.

`ne-decisions-audited` grandfathers pre-KNOW2 decisions at the `2026-07-19` boundary, in the same deliberate way `ne-review-identity` grandfathers pre-KNOW5 sign-offs: no audit row was ever written for them, and **inventing one now would be fabricating a decision history**.

---

## 4. Definition of Done

| Requirement | State | Evidence |
|---|---|---|
| A qualified reviewer can **approve** individual claims | ✅ | `/admin/knowledge-claims`; §10b lifecycle test |
| A qualified reviewer can **reject** individual claims | ✅ | Terminal state + mandatory reason |
| Every decision is **permanently auditable** | ✅ | `knowledge_review_audit`, same transaction; `ne-decisions-audited` |
| Approved claims become available **everywhere** automatically | ✅ | §5 — same column, same gate, same one mouth |
| **No Trust principle weakened** | ✅ | `isEvidenceBackedClaim()` byte-unchanged; `ne-gate-intact` |
| **No architectural principle weakened** | ✅ | Writers 2 → 1; no new ledger; no new authorisation authority |

---

## 5. End-to-end publication verification

**The most important thing to say about objective 4 is that it required no code.**

Approving a claim writes `reviewed_at` on the claim row. Food Intelligence, Meal Intelligence, Pantry Intelligence, Planner Intelligence, the Companion, nutrition reports and Plant Diversity were **already** reading that column, through the single gated read path (`nutrition-knowledge-registry.ts`), and were **already** showing nothing because it was `NULL`. There is no fan-out, no notification step, and no cache to invalidate, because **approval does not push a claim outwards — it stops withholding it.**

That is why this workstream added no consumer code, and why adding any would have been a defect: a second delivery path would be the duplicate publication logic the mission forbids.

The full lifecycle was exercised **against a real claim row and rolled back** (`§10b`):

```
✓ the chosen claim starts pending and dark
✓ approving sets reviewedAt and names the reviewer
✓ an approved claim now PASSES the Trust Gate — it becomes visible everywhere at once
✓ approving wrote an audit row in the same transaction
✓ an approved claim can be withdrawn
✓ a withdrawn claim goes dark again through the EXISTING gate
✓ the withdrawal recorded its reason
✓ a rejected claim CANNOT be re-approved in one step
✓ reopening returns the claim to pending
✓ every decision left its own permanent audit row (approve → reject → reopen)
✓ each audit row names the reviewer who made it
✓ the claim is left exactly as found — nothing was published
✓ the verification left no audit trace behind
```

### 5.1 The four guarantees the mission asked to verify

| Guarantee | How it holds |
|---|---|
| **Unpublished claims never surface** | `isEvidenceBackedClaim()` refuses `reviewedAt === null`. Unchanged from KNOW5. |
| **Rejected claims never surface** | A rejected row has `reviewed_at` **NULL**, so the *existing* gate already refuses it. **No new filter was added** — and that is the strongest available guarantee, because a second filter is a second thing that can be got wrong. |
| **Every published claim is auditable** | Decision + audit row in one transaction; `ne-decisions-audited` at `fail` severity. |
| **No duplicate publication logic** | A test greps every server/shared source for a drizzle write to a claim table's review columns and asserts exactly one file matches. |

### 5.2 Results

- `npm run test:know2-human-evidence-publication` — **72 passed, 0 failed**
- `npm run test:know5-evidence-contract` — **112 passed, 0 failed**
- `npm run test:knowledge-evidence-gate` — **116 passed, 0 failed**
- `npm run test:knowledge-claim-coverage` — **14 passed, 0 failed**
- `npm run adoption:check` — **83 passed, 0 failed**
- `npm run verify:publication` — domain 23 `needs-attention` (3 warns, **0 fails**); platform failures **unchanged at 4**; migration coverage **96/96**
- `tsc --noEmit` — clean on every touched file

**Behavioural change to any household-facing surface: none.** No row was written, no gate was altered, and the same 64 claims remain publishable and unpublished.

---

## 6. Architecture Compliance

☑ **Architecture Bootstrap read** — `docs/architecture/README.md` before implementation.
☑ **Canonical Publication Architecture** — the knowledge variant's five elements are reused, not rebuilt. Owner, Publication, Projection, Runtime Read Path and Verification are the same ones KNOW1 verified sound; this workstream completes the *human decision* that feeds them.
☑ **Principle 2 (one owner per fact)** — writers **converged 2 → 1**. The publication fact has exactly one writer, asserted by test.
☑ **Principle 5 (pure modules beside the spine)** — the review vocabulary is zero-I/O in `shared/knowledge/evidence.ts`.
☑ **Principle 6 (non-fabrication)** — no row back-filled, no reviewer invented, no decision history synthesised for pre-KNOW2 rows.
☑ **Principle 8 (retire on introduction)** — the CLI's own UPDATE path is deleted, not deprecated alongside the new one.
☑ **No new domain, store, write funnel, ledger, or authorisation authority.** `server/lib/access.ts` remains the sole authority.
☑ **Rule KC9** — automation authors candidates, never publishes. Unchanged and reinforced.
☑ **Rule KC8** — declared-is-not-enforced: both new invariants have running checks.
☑ **Migration** — one reviewed migration appended to `server/migrations/runner.ts`, the only path that may change a production schema (TRUST1-O8).

## 7. AI Architecture Compliance

☑ **No AI may approve a health claim.** The decision path is `assertAdmin` → an authenticated human → their session-derived name. There is no model, capability, prompt, or automated caller anywhere in it, and `recordClaimDecision` refuses an unnamed reviewer before it reads the database.
☑ **No capability, prompt, intent, or model path touched.** No Intelligence Platform surface changed.
☑ **No second assistant, no conversation state, no new capability registered.**
☑ **The ledger's `actor_kind` remains `human` for every claim decision** — the column can express `llm`, and this workstream never writes it. If an automated actor is ever admitted, it will be visible in the audit rather than indistinguishable from a person.
☑ **Honest gaps over fabricated knowledge** — §11 states what remains open rather than closing it cosmetically.

## 8. Data Impact

| Change | Kind | Risk |
|---|---|---|
| `rejected_at`, `rejected_by`, `rejection_reason` × 4 tables | **Additive, nullable** | None — no existing row is read or written |
| 2 CHECK constraints × 4 tables | Additive | None — every existing row already satisfies both (all have `rejected_at IS NULL`) |
| 1 partial index × 4 tables | Additive | None |
| `knowledge_review_audit` | **Extended vocabulary only** | None — no schema change; new `entity` values in an existing free-text column |
| Rows written | **Zero** | The migration back-fills nothing and the verification rolls back |

**Reversibility:** every column is nullable and every constraint is `DROP CONSTRAINT IF EXISTS`-guarded. Dropping the three columns restores the exact prior schema; the claim rows themselves are untouched either way.

**Personal data:** none added. `knowledge_review_audit.actor_user_id` is an existing FK to `users.id`; a claim decision records an operator, never a household member. The BUS1 personal-data registry already covers this table.

## 9. Trust Check

| Question | Answer |
|---|---|
| Is the Trust Gate weakened? | **No.** `isEvidenceBackedClaim()` is byte-unchanged, and `ne-gate-intact` asserts it. |
| Can a claim reach a household without a named human approving it? | **No.** Unchanged from KNOW5, and now additionally: a rejected claim cannot reach one either. |
| Can AI approve a health claim? | **No.** §7. |
| Can a decision be made anonymously? | **No.** Refused at three layers: the store, the API (session-derived name), and a database CHECK. |
| Can a decision be erased or edited? | **No.** The ledger is append-only, written in the same transaction, and never updated or deleted. |
| Can a rejection be silently overturned? | **No.** It requires an explicit reopen, itself recorded. The bulk CLI path skips rejected claims entirely. |
| Was any claim published in this workstream? | **No.** §12. |
| Was any evidence fabricated? | **No.** No back-fill, no invented reviewer, no synthesised history. |

## 10. Rollback Plan

**Identifier:** `rollback/KNOW2-human-evidence-publication-20260719` → `772eb6ed` (annotated tag).

```bash
git reset --hard rollback/KNOW2-human-evidence-publication-20260719
```

Code rollback is complete and sufficient. The schema change is **additive and inert**: with the code reverted, the three columns and two constraints simply go unread — every existing query behaves exactly as it did before, because all rows have `rejected_at IS NULL`. Dropping them is therefore optional, and only if desired:

```sql
ALTER TABLE knowledge_food_nutrients      DROP COLUMN rejected_at, DROP COLUMN rejected_by, DROP COLUMN rejection_reason;
ALTER TABLE knowledge_food_benefits       DROP COLUMN rejected_at, DROP COLUMN rejected_by, DROP COLUMN rejection_reason;
ALTER TABLE knowledge_nutrient_benefits   DROP COLUMN rejected_at, DROP COLUMN rejected_by, DROP COLUMN rejection_reason;
ALTER TABLE knowledge_preparation_effects DROP COLUMN rejected_at, DROP COLUMN rejected_by, DROP COLUMN rejection_reason;
```

**One caveat, stated plainly:** if any claim has been decided through this workflow before a rollback, dropping the columns discards those rejections while the audit rows survive — history without state. Reopening the affected claims first, or leaving the columns in place, avoids that.

## 11. Scope Lock

**Built:** rejection state · per-claim decisions · audit history · writer convergence · Admin review experience · verification.

**Deliberately NOT done, each with a reason:**

| Not done | Why |
|---|---|
| **No claim was approved or rejected** | A sign-off is a named human taking responsibility for a health claim (Rule KC9). Doing it under an assistant's name is the rubber stamp the gate exists to forbid. KNOW1 §3.3 put this to the user, who chose verification without sign-off; **that decision stands and was not re-litigated.** |
| **KNOW1 F2** — gating `getFoodsForNutrient()` | Order matters and has not changed: closing it before the composition edge is published would darken every nutrient page rather than light one. Still blocked on F1. |
| **KNOW1 F3** — food→benefit citations | Curation work, not engineering. The edge is now *reviewable* here, which is the engineering half. |
| **KNOW1 F4** — 3,299 uncited claims | Curation backlog. Unchanged and still separately reported. |
| **No bulk approve in the Admin UI** | §3.3 — it would be the rubber stamp F5 warns about. |
| **No change to the KQ1 vocabulary Workbench** | A different lifecycle (§2.1). Its files are byte-untouched. |
| **No governing architecture document amended** | This workstream implements existing law; it creates none. |

## 12. Manual Verification Steps

1. Start the server. The migration `2026-07-19_know2_claim_rejection_state` applies at boot (already applied in dev; confirm `[Migrations] Schema at head`).
2. Sign in as an admin and open **Admin → Claim Review** (`/admin/knowledge-claims`).
3. Confirm the summary reads **64 publishable now**, **3,299 awaiting a source**, **21 approved**, **0 rejected**.
4. Pick a pending composition claim. Confirm its NHS citation is an openable link showing the publisher and the date it was last checked, and that the page states what approving a composition claim means.
5. Click **Reject**. Confirm the button stays disabled until a reason is typed. Enter a reason and confirm.
6. Confirm the claim shows **Rejected**, with your name and your reason; switch the status filter to *Awaiting review* and confirm **it is gone from the queue**.
7. Open **History** on that claim and confirm one row naming you.
8. Run `npm run knowledge:signoff` (dry run). Confirm the rejected claim **does not appear** in the printed list.
9. Click **Reopen for review**, then **Approve**. Confirm the two-step requirement — there is no direct approve on a rejected claim.
10. Confirm the food's benefit chip behaviour is unchanged unless **both** edges of its chain are approved (KNOW5).
11. Withdraw the claim to restore the original state, or reject-then-reopen to return it to pending.
12. Run `npm run verify:publication` and confirm domain 23 shows no `fail`.

## 13. User Acceptance Evidence

Automated, reproducible, and listed in full at §5.2 — **72 KNOW2 assertions, 0 failures**, including the complete approve → withdraw → reopen lifecycle executed against a live claim row and rolled back with proof that nothing survived.

**Not yet obtained:** human acceptance of the Admin surface by a qualified reviewer working real claims. That is the natural next step and is deliberately not claimed here — the workflow is verified to *work*; whether it is the right workflow *to review by* is a judgement only a reviewer using it can make.

## 14. Remaining Risks

| # | Risk | Severity | Mitigation / status |
|---|---|---|---|
| **R1** | **64 claims remain unpublished.** The blocker is unchanged and is not technical: it needs a named, qualified human. It is now a two-click act per claim instead of a command, which lowers the barrier but does not remove the requirement. | High (opportunity) | Awaiting a reviewer — see §15 |
| **R2** | A reviewer can approve without opening the citation. No interface can prevent this; the page shows the source prominently and states what approval asserts, but the judgement is unverifiable by software. | Medium | Accepted and stated — the audit trail makes it *attributable*, which is the available guarantee |
| **R3** | The CLI's approve-all-valid path still exists and is still a rubber stamp at import scale. It now skips rejected claims and audits each row individually, but it does not read citations for the reviewer. | Medium | Confined to a typed command behind a printed list; §3.3 |
| **R4** | `getFoodsForNutrient()` remains ungated (KNOW1 F2). Unchanged by this workstream and still correctly ordered behind F1. | Medium | Recorded in domain 23 `knownGaps` |
| **R5** | Pre-KNOW2 decisions have no audit rows and are grandfathered. Their history genuinely does not exist and cannot honestly be reconstructed. | Low | Stated in the check's own pass message rather than hidden |
| **R6** | `reviewed_by` is free text while `actor_user_id` is an FK — the same person can appear under two identities if their display name changes. | Low | Both are recorded; the FK is authoritative. Converging them would change KNOW5's column semantics and was out of scope |

## 15. Recommended follow-on work

**1. Publish the 64 claims (KNOW1 F1) — still the highest-value item in the platform, and now a UI task.**
A qualified reviewer opens `/admin/knowledge-claims`, works the 49 NHS composition claims and 15 nutrient→benefit claims against their sources, and approves or rejects each. `ne-published-chain` moves from *0 benefit chips render* to a live count — Food Intelligence becoming visible **because trusted evidence was published**. This is the success criterion KNOW1 set and it is now reachable without a terminal.

**2. Then close KNOW1 F2** — gate `getFoodsForNutrient()`, in that order, never before.

**3. Curation for F3/F4** — the 3,299 uncited claims and the food→benefit edge. Reviewable here the moment they carry a citation; no further engineering is required to review them.

**4. Consider converging `reviewed_by` onto `users.id`** (R6) — a KNOW5 column-semantics change, worth doing only alongside other claim-table work.

**5. A reviewer-facing acceptance session** (§13) before the workflow is relied on at volume.

---

## 16. Files changed

| File | Change |
|---|---|
| `shared/knowledge/evidence.ts` | **+** claim review lifecycle vocabulary (pure, zero-I/O). Gate unchanged. |
| `shared/schema.ts` | **+** `rejected_at` / `rejected_by` / `rejection_reason` on four claim tables |
| `server/migrations/runner.ts` | **+** `2026-07-19_know2_claim_rejection_state` (additive; 2 CHECKs, 1 index per table) |
| `server/lib/knowledge-claim-review-store.ts` | **NEW** — the single authorised writer; per-claim decisions + transactional audit |
| `server/seeds/signoff-knowledge-claims.ts` | Converged — delegates to the store; issues no UPDATE of its own |
| `server/routes.ts` | **+** 5 `assertAdmin`-guarded routes under `/api/admin/knowledge-claims` |
| `client/src/pages/admin-knowledge-claims-page.tsx` | **NEW** — the Admin review experience |
| `client/src/App.tsx` · `client/src/components/admin-banner.tsx` | Route registration + admin navigation entry |
| `server/verification/publication-register.ts` | Domain 23: **+** 2 `fail` checks; backlog made rejection-aware; writer/gaps updated |
| `server/tests/test-know2-human-evidence-publication.ts` | **NEW** — 72 assertions across 11 sections |
| `server/tests/test-know5-evidence-contract.ts` | One assertion re-pointed at the converged writer, and strengthened (§ below) |
| `server/tests/test-knowledge-food-ownership.ts` | Writer constant re-pointed; **a hole in the ownership guard closed** (§ below) |
| `package.json` | **+** `test:know2-human-evidence-publication`, added to the aggregate chain |
| `docs/product/**` | **+** 2 registry entries (`page-admin-knowledge-claims`, `adm-knowledge-claims`); routes map; inventory regenerated 162 → 164 |

### 16.1 Two existing tests were changed — disclosed rather than buried

Both broke because the writer moved (§3.3), and in both cases the property being tested remained true. **No assertion was deleted or weakened; both ended up stronger.**

**`test-know5-evidence-contract.ts`** asserted *"the sign-off gate covers the composition edge"* by matching `knowledgeFoodNutrients` **inside the CLI file**. It now checks the property at **both** ends — the CLI covers every edge the store defines, and the store writes that table.

**`test-knowledge-food-ownership.ts`** enforces *"exactly two modules write the knowledge food tables"*. Re-pointing its writer constant was expected. What was not expected is what re-pointing it **exposed**:

> **The ownership guard could be evaded by aliasing.** It scanned for `.update(knowledgeFoodNutrients)` — a table named *at the call site*. The new store maps the four claim tables into a lookup and writes `tx.update(table)`, so **it was not detected as a writer at all.** The guard whose entire job is to catch a second owner of these tables would have silently ignored one.

That hole is closed: the scan now follows the alias chain (`const TABLES = { … }` → `const table = TABLES[edge]` → `.update(table)`). A first attempt — *"mentions a table and writes something"* — was rejected because it flagged `knowledge-review-store.ts`, which reads these tables for its health figures and writes only its own; **a false alarm teaches the next person to ignore the check**, which is worse than the gap. The index-based comparison of the two writers was also made order-independent, since the sorted order only ever held by alphabetical accident (`server/seeds/` before `server/lib/`).

This was found by the workstream rather than fixed by it in passing, so it is recorded here as a finding: **KNOW2 strengthened an existing guard it did not set out to touch.**

No claim was published. No gate was altered. No governing architecture document was amended.
