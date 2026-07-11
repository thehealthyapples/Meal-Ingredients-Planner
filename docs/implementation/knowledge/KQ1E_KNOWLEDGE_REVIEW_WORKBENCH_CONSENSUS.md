# KQ1E — Knowledge Review Workbench, Phase 3 (Consensus & Comparison)

**Status:** ✅ Complete — a **Consensus & Comparison** workspace: multiple reviewer/LLM packages can now be imported for the *same* review item, their proposals are grouped by item and compared side-by-side, consensus (agreement, not truth) is computed and displayed, conflicts are highlighted, and a four-count dashboard (Awaiting Review · Awaiting Consensus · Conflicting Reviews · Awaiting Approval) surfaces the backlog. The human approve/reject gate remains the only thing that resolves a term. Verified end-to-end against the live DB.
**Date:** 2026-07-07
**Branch:** `int1-intelligence-platform`
**Design:** [`KQ1A_KNOWLEDGE_REVIEW_WORKBENCH_DESIGN.md`](../../investigations/knowledge/KQ1A_KNOWLEDGE_REVIEW_WORKBENCH_DESIGN.md)
**Builds on:** [`KQ1B`](./KQ1B_KNOWLEDGE_REVIEW_WORKBENCH_PHASE0.md) · [`KQ1C`](./KQ1C_KNOWLEDGE_REVIEW_WORKBENCH_PHASE1.md) · [`KQ1D`](./KQ1D_KNOWLEDGE_REVIEW_WORKBENCH_PHASE2.md)
**Governing architecture:** [`GOV2_CANONICAL_ALIAS_PRINCIPLE.md`](../../architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md)

---

## 1. Executive summary

Phase 2 (KQ1D) imported a *single* reviewed package and materialised each item's decision as a `proposed` record behind a human gate — but it **stopped a second package for the same term** ("term already has an active proposal — skipped"). That was the correct idempotency guard for a one-reviewer world; it is exactly what a consensus workflow must relax.

Phase 3 turns the proposal layer into a **Consensus & Comparison workspace**. Several reviewers/LLMs can each submit a package covering the same review items; THA now keeps **every** distinct proposal, **groups them by review item**, and computes a **consensus verdict per item** — *agreement between reviewers, never a claim of truth*. Conflicting proposals are flagged for a human. A dashboard counts the backlog across the four requested states. The human **approve** action is still the only gate, and — as in every prior phase — **it applies nothing to canonical space**: no alias is written, no vocabulary or entity changes, nothing reaches the resolver, and there is no rollback.

**Verified against the live DB:** two reviewers' packages for the same two terms both import (4 proposals, not 2); re-importing an identical package is still a no-op (2 skipped); a term where both reviewers agree is classed **consensus** (1 option, 2 reviewers, `agreed=true`); a term where they disagree (alias vs new_identity) is classed **conflict** (2 options); the dashboard reports `conflicting=1, awaitingApproval=1`; approving one proposal on the conflict term **supersedes** the sibling and resolves the term (`conflicting` drops to 0, `approved`→1); and the canonical nutrient slug set + alias table are **unchanged** across the whole flow (30→30 slugs, 10→10 aliases).

---

## 2. Scope — implemented vs deferred

| Task requirement | Status | Where |
|---|---|---|
| Multiple imported packages for the same review item | ✅ | per-proposal fingerprint idempotency (§4.1) |
| Compare proposals from different reviewers/LLMs | ✅ | consensus groups; comparison table per term |
| Group proposals by review item | ✅ | `getConsensusDashboard()` groups by `termId` |
| Display reviewer · model · confidence · rationale · proposed decision · proposed canonical target | ✅ | comparison table columns (§6) |
| Calculate consensus (agreement only, not truth) | ✅ | `decisionSignature` + agreement tally (§4.2) |
| Highlight conflicting proposals | ✅ | `conflict` state, red-outlined card, vote spread |
| Compare all evidence before approval | ✅ | all proposals (incl. history) shown per term |
| Dashboard: Awaiting Review · Awaiting Consensus · Conflicting Reviews · Awaiting Approval | ✅ | four clickable tiles → filter (§6) |

**Explicitly NOT built (per "Do not"):** applying aliases, modifying canonical vocabularies, creating canonical entities, writing to the resolver, and rollback. Approval records the human decision and supersedes competing proposals for the term — it performs **no** canonical write. Apply (alias overlay + new-identity hand-off) and rollback remain KQ1A Phases 3–4 of §10 (the "apply" phase, distinct from this comparison phase).

---

## 3. What "consensus" means here

Consensus is **agreement between reviewers, not correctness.** Each proposal reduces to a GOV2-shaped **decision signature** — the dimension reviewers must match to agree:

| Decision type | Signature | Two proposals agree iff |
|---|---|---|
| `alias` | `alias:<targetCanonicalSlug>` | they bind the term to the **same** canonical identity |
| `new_identity` | `new_identity:<proposedNewSlug>` | they propose the **same** new slug |
| `reject` / `defer` | `reject` / `defer` | same terminal intent |

Over a term's **active** (still-`proposed`) proposals:

- **1 active proposal** → `awaiting_consensus` (a single, un-corroborated opinion).
- **≥2 active, all one signature** → `consensus` (ready for the human approval gate).
- **≥2 active, >1 signature** → `conflict` (a human must resolve).
- **a proposal already approved** → `approved` (resolved; nothing applied to canonical space).
- **no active proposals on an open term** → `awaiting_review` (backlog).

This deliberately measures *reviewer agreement only*. Even a unanimous consensus is not "true" until a human approves it — and approval still applies nothing (GOV2: the single resolver and TS-owned vocabularies remain untouched).

---

## 4. Server — store changes (`server/lib/knowledge-review-store.ts`)

### 4.1 Multiple packages per term (relaxed idempotency)

The Phase 2 guard ("skip if the term has *any* active proposal") is replaced by a **per-proposal fingerprint**. On import, a proposal is skipped only if an **identical active proposal already exists** — same `reviewer` **and** `reviewerModel` **and** `decisionSignature`. Consequences:

- Re-importing the **same file** → identical fingerprints → still a no-op (idempotent). ✓
- A **different reviewer**, or the **same reviewer with a different decision**, for the same term → a distinct fingerprint → a new `proposed` proposal accumulates for comparison. ✓

The term's status is set to `proposed` on first opinion, but a term a human has already **`approved` is never downgraded**.

### 4.2 Consensus computation (pure read)

- `decisionSignature(d)` — the agreement fingerprint above (exported; reused by import dedupe and consensus).
- `buildConsensusGroup(term, decisions)` — projects proposals, tallies the distinct signatures among *active* proposals into ranked **options** (the vote spread), computes the `state`, and an `agreement` summary (`agreed`, `majoritySignature`, `majorityCount`, `ratio`, `reviewerCount`). Approved/rejected/superseded proposals are retained for history but **do not vote**.
- `getConsensusDashboard()` — loads all queue terms + all decisions, groups decisions by `termId`, classifies each term, and returns `{ counts, groups }`. `counts` are the four dashboard tiles (+ `approved`, `totalTerms`, `totalProposals`); `groups` are the per-term comparison objects (only terms that carry ≥1 proposal), sorted **conflicts first**.

### 4.3 Approve supersedes competing proposals

`approveDecision` now, after approving the chosen proposal and marking the term `approved`, sets the term's remaining **`proposed`** siblings to a new **`superseded`** status (added to `DECISION_STATUSES`). They keep their audit trail but leave the active vote. Still a proposal-layer change only — **no canonical write**. `rejectDecision` is unchanged (a term with no remaining active proposal returns to `in_review`).

### 4.4 Reviewer provenance

The export `decision` stub and CSV gain a `reviewer` field (the human/agent identity, distinct from `reviewerModel`); import persists it. Because the `decision` object is excluded from the source checksum (KQ1D §3), this is **fully backward-compatible** — KQ1C/KQ1D packages (no `reviewer`) validate and import unchanged.

---

## 5. Data-model impact — one additive column (no new table)

Phase 3 needs no new table — it reads the existing `knowledge_review_queue` + `knowledge_review_decisions` and groups them. One additive, nullable column:

| Table | Column | Role |
|---|---|---|
| `knowledge_review_decisions` | `reviewer` (text, null) | reviewer/agent identity, shown next to `reviewer_model` |

> Applied via the idempotent `scripts/apply-knowledge-review-phase3-columns.ts` (`ADD COLUMN IF NOT EXISTS`), matching the KQ1B–D DDL approach; it mirrors the Drizzle definition exactly, so a later `drizzle-kit push` is a no-op. The `superseded` decision status needs **no** DDL (`status` is free text). No `knowledge_*` entity/vocabulary table changed.

---

## 6. Client — `client/src/pages/admin-knowledge-review-page.tsx`

A third tab, **Consensus** (`GitCompare` icon), between Queue and Proposals; a successful import now lands here.

- **Dashboard:** four clickable tiles — **Awaiting Review** · **Awaiting Consensus** · **Conflicting Reviews** · **Awaiting Approval** — each doubling as a state filter, plus a totals line (terms / proposals / approved).
- **Comparison groups:** one card per review item, sorted conflicts-first. Header shows the term, domain, active/total counts and a colour-coded **state badge**; **conflict cards are red-outlined** with an alert icon. A one-line **consensus summary** explains the verdict ("Consensus — 2 proposals from 2 reviewers agree on …", "Conflict — 2 distinct decisions … a human must resolve"). A **vote-spread** row renders each distinct option with its support count (minority options flagged on conflicts).
- **Evidence table** per card — the required columns **Reviewer · Model · Confidence · Decision · Canonical target · Rationale · Status** — with per-proposal **Approve/Reject** (shown only while `proposed`); superseded/rejected rows are dimmed but visible for full evidence.

Same `react-query` + `apiRequest` + shadcn `Table.calm-table` conventions; `← Admin` back-link retained. All mutations invalidate the consensus, decisions, batches and queue query keys so every tab stays in sync.

### Route (server, `assertAdmin`-guarded)

| Method & path | Purpose |
|---|---|
| `GET /api/admin/knowledge-review/consensus` | The dashboard: four counts + per-term comparison groups with computed consensus. Pure read. |

---

## 7. GOV2 / ownership compliance

| Guarantee | How Phase 3 honours it |
|---|---|
| Do not apply aliases | Consensus is a read + classify; approval supersedes siblings and records intent — nothing is written to `NUTRIENT_ALIASES`/`BENEFIT_ALIASES` or any overlay. |
| Do not modify canonical vocabularies | No write to `nutrients.ts`/`health-benefits.ts`; canonical slug sets read-only. |
| Do not create canonical entities | No insert into any `knowledge_*` entity table; new-identity proposals stay proposals. |
| Do not write to the resolver | The resolver is neither imported for mutation nor fed; only `normaliseVocabularyTerm` tidies suggested slugs. |
| Do not implement rollback | No rollback route or reactivation logic; `superseded` is a forward-only proposal-layer state. |
| Human approval the only gate | Consensus never auto-approves; agreement is advisory. Only a human `approve` resolves a term, and it applies nothing. |
| Consensus = agreement, not truth | The UI states this explicitly; the model tallies reviewer agreement only and defers correctness to the human gate. |

---

## 8. Verification

Exercised the real store end-to-end against the live DB (seed two terms → import two reviewers' packages → re-import → dashboard → human gate → canonical check → cleanup):

```
[2] import A → created=2 skippedExisting=0            (reviewer Alice: both terms)
[3] import B → created=2 skippedExisting=0            (reviewer Bob: agrees on term1, differs on term2)
[4] re-import A → created=0 skippedExisting=2          (idempotent — identical fingerprints)
[5] counts: awaitingReview=24 awaitingConsensus=0 conflicting=1 awaitingApproval=1 approved=0
    consensus term → state=consensus active=2 options=1 agreed=true reviewers=2
    conflict term  → state=conflict  active=2 options=2 majority=1/2 reviewers=2
[6] after approve conflict → alias:approved, new_identity:superseded  term.status=approved
    conflict term now state=approved; dashboard conflicting=0 approved=1
[7] canonical nutrient slugs 30→30; aliases 10→10     (UNCHANGED)
✅ ALL CHECKS PASSED
```

| Definition of Done | Result |
|---|---|
| Multiple review packages can be compared | ✅ two reviewers' packages coexist as 4 proposals across 2 terms; grouped by item |
| Consensus is displayed | ✅ agreeing term → `consensus` (1 option, 2 reviewers, `agreed`); summary + vote spread shown |
| Conflicts are clearly identified | ✅ disagreeing term → `conflict` (2 options), red-outlined card, `Conflicting Reviews` tile |
| Human approval the only gate before canonical changes | ✅ approval records intent + supersedes siblings; canonical slugs/aliases unchanged; nothing applied |

- **Types:** `tsc --noEmit` clean for all new/modified files (`schema.ts`, `knowledge-review-store.ts`, `routes.ts`, `admin-knowledge-review-page.tsx`, the apply script).
- **Backward compatibility:** the `reviewer` field lives in the checksum-excluded `decision` object, so KQ1C/KQ1D packages import unchanged.

Reproduce: browse `/admin/knowledge-review` → **Export ▸ Entire queue ▸ JSON** → have two reviewers each fill the `decision` objects (set `decision.reviewer`) → **Import package** twice → **Consensus** tab → compare, then Approve/Reject.

---

## 9. Files changed

**New**
- `scripts/apply-knowledge-review-phase3-columns.ts` — idempotent `reviewer` column DDL.

**Modified**
- `shared/schema.ts` — additive `reviewer` column on `knowledge_review_decisions`.
- `server/lib/knowledge-review-store.ts` — `reviewer` in the decision envelope + CSV; `decisionSignature`; per-proposal fingerprint idempotency (multi-package); no-downgrade of approved terms; `superseded` status + supersede-on-approve; consensus types + `buildConsensusGroup` + `getConsensusDashboard`.
- `server/routes.ts` — `GET /api/admin/knowledge-review/consensus`.
- `client/src/pages/admin-knowledge-review-page.tsx` — Consensus tab, dashboard tiles, `ConsensusPanel` (comparison groups, vote spread, evidence table, human gate).

**Unchanged (as required)**
- Canonical vocabularies (`nutrients.ts`/`health-benefits.ts`), the single resolver, all `knowledge_*` entity/relationship tables. No alias overlay, no apply, no rollback (later phases).

---

*KQ1E Phase 3 complete: multiple reviewer/LLM packages for the same review item are imported, grouped by item, and compared side-by-side; consensus (agreement, not truth) is computed and shown; conflicts are highlighted across a four-count dashboard; and a human approve/reject remains the only gate — with no alias applied, no canonical vocabulary or entity changed, nothing written to the single GOV2 resolver, and no rollback, exactly as scoped.*
