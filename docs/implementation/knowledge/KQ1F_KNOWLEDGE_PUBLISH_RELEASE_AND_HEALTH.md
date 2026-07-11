# KQ1F — Knowledge Publish, Release Notes & Knowledge Health

**Status:** ✅ Complete — the **final governed workflow**: **Publish** (the only operation that changes canonical knowledge, via the governed alias overlay the single GOV2 resolver reads), automatic **Knowledge Release Notes**, rollback points, and a live **Knowledge Health** dashboard. Verified end-to-end against the live DB.
**Date:** 2026-07-07
**Branch:** `int1-intelligence-platform`
**Design:** [`KQ1A_KNOWLEDGE_REVIEW_WORKBENCH_DESIGN.md`](../../investigations/knowledge/KQ1A_KNOWLEDGE_REVIEW_WORKBENCH_DESIGN.md)
**Builds on:** [`KQ1B`](./KQ1B_KNOWLEDGE_REVIEW_WORKBENCH_PHASE0.md) · [`KQ1C`](./KQ1C_KNOWLEDGE_REVIEW_WORKBENCH_PHASE1.md) · [`KQ1D`](./KQ1D_KNOWLEDGE_REVIEW_WORKBENCH_PHASE2.md) · [`KQ1E`](./KQ1E_KNOWLEDGE_REVIEW_WORKBENCH_CONSENSUS.md)
**Governing architecture:** [`GOV2_CANONICAL_ALIAS_PRINCIPLE.md`](../../architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md)

---

## 1. Executive summary

KQ1B–KQ1E built a governed proposal layer: capture → triage → export → import → consensus → **human approval**. Every phase to date deliberately applied **nothing** to canonical space — approval recorded intent only. KQ1F closes the loop with the one operation that is *allowed* to change canonical knowledge: **Publish**.

Publishing takes the **approved** proposals a human has already gated and:

- applies each **alias** decision to the **governed alias overlay** (`knowledge_vocabulary_aliases`) that the **single** GOV2 resolver merges at load — the only canonical-adjacent write the Workbench makes (GOV2 Rule 3: an alias is *content*, not a new identity);
- emits a **hand-off artifact** for each **new-identity** decision — the Workbench **never auto-mints** a canonical entity (TypeScript stays the vocabulary owner, NK6F);
- marks **reject** / **defer** decisions terminal on their terms;
- auto-creates a **Knowledge Release** recording exactly what changed and who approved/published it;
- creates a **rollback point** (a deterministic reverse snapshot);
- appends **append-only audit** rows for every transition;
- **reloads the resolver overlay** so published aliases resolve immediately.

A **Knowledge Health** dashboard reports canonical counts, coverage/consensus ratios, the review backlog, timing, the last release, and a knowledge trend. **Rollback** reverses a release non-destructively (deactivate overlay rows, revert proposal/term state, resolution reverts to pre-release behaviour).

Per the task, the KQ1A design's *"Apply"* step is realised as **"Publish"** — there is no "Apply" operation anywhere; the canonical-change verb is **Publish** throughout.

**Verified against the live DB:** a seeded term is rejected by the resolver pre-publish; after approve → publish, the resolver resolves it to the canonical slug **via the overlay** (single resolver, `via: "overlay"`); the release records the approving + publishing users, the linked proposal, the rollback id, the published alias, the notes, and the audit trail; the TS vocabularies and canonical food-entity table are **byte-for-byte unchanged**; the Health dashboard reports the release + coverage + trend; and **rollback** deactivates the alias (resolver reverts), returns the decision to `approved` (re-publishable), and marks the release `rolled_back`.

---

## 2. Scope — implemented vs the task

| Requirement | Status | Where |
|---|---|---|
| Replace "Apply" with "Publish" | ✅ | the canonical-change op is `publishApprovedDecisions`; UI says "Publish"; no "Apply" op exists |
| Publishing is the only op that changes canonical knowledge | ✅ | only `publishApprovedDecisions` writes the governed overlay (§4) |
| Only approved proposals may be published | ✅ | publish reads `status = "approved"` decisions only; else 400 |
| Publishing creates a rollback point | ✅ | `knowledge_rollback_points` row per release, linked as `rollbackId` |
| Publishing never bypasses GOV2 | ✅ | overlay anti-fork guarded; single resolver; no minted entity (§7) |
| Every publish auto-creates a Knowledge Release | ✅ | `knowledge_releases` row per publish, with all required fields (§3) |
| Release records all required fields | ✅ | id · date · approvedBy · publishedBy · #aliases · #new · #updated · #rejected · #deferred · linked packages · linked proposals · rollbackId · notes |
| Knowledge Health dashboard | ✅ | `getKnowledgeHealth` + Health tab — every listed metric (§5) |
| No duplicate ownership / vocabularies · preserve GOV2 · preserve audit | ✅ | §7 |
| Rollback points created (+ working rollback) | ✅ | `rollbackRelease` reverses a release non-destructively (§4.4) |

---

## 3. Data-model impact — four additive tables (no canonical table changed)

Additive only. No change to any `knowledge_*` **entity** table or the TS-owned canonical vocabularies. Applied via idempotent `scripts/apply-knowledge-review-phase4-tables.ts` (mirrors the Drizzle defs, so `drizzle-kit push` is a no-op).

### 3.1 `knowledge_vocabulary_aliases` — the governed alias overlay
`id · kind (nutrient|benefit) · alias_normalised · canonical_slug · decision_id → decisions · release_id · is_active · created_at · deactivated_at`. A **partial unique index** `(kind, alias_normalised) WHERE is_active` keeps at most **one active** alias per key (GOV2 many-to-one: one string → one identity) while letting a rolled-back alias's inactive row coexist so it can be re-published later. **This is the only canonical-adjacent write in the whole Workbench.**

### 3.2 `knowledge_releases` — the release notes
`id · published_at · approved_by_user_id (+ approved_by_user_ids[] when multi-approver) · published_by_user_id · aliases_published · new_entities · updated_entities · rejected_proposals · deferred_proposals · linked_batch_ids[] · linked_proposal_ids[] · rollback_id · notes · status (published|rolled_back) · rolled_back_at · rolled_back_by_user_id · created_at`. Every field the task requires is a column.

### 3.3 `knowledge_rollback_points` — the reverse snapshot
`id · release_id · snapshot (jsonb: { aliasRowIds[], decisions[{id,prevStatus}], terms[{id,prevStatus}], handoffCount }) · status (active|consumed) · created_at · consumed_at`. Holds exactly what `rollbackRelease` needs to reverse a release deterministically.

### 3.4 `knowledge_review_audit` — append-only history
`id · entity (term|batch|decision|alias|release) · entity_id · action (approved|rejected|published|handed_off|rolled_back|…) · actor_kind (human|llm|system) · actor_user_id · release_id · before · after · detail · created_at`. Nothing updates or deletes these rows — **complete audit history is preserved**.

---

## 4. Server — the publish workflow

### 4.1 The resolver overlay (`shared/knowledge/canonical-vocabulary-resolver.ts`)
GOV2 keeps **one** resolver (Rule 5), so published aliases must resolve through **it**. The resolver gains an injectable in-memory overlay:

- `setVocabularyOverlay({ nutrient, benefit })` installs a normalised alias→slug map **under the same anti-fork guard** as the TS seed tables — a target that is not a canonical slug is **refused and reported**, never installed (Rule 7). It returns the install counts + any rejected entries.
- Resolution order is **exact canonical → TS seed alias → overlay** (`via: "overlay"`). The overlay can only **add** alt-names for existing identities; it never overrides an exact match and never renames a slug.
- The module stays **DB-free**: the server reads the table and calls `setVocabularyOverlay`, so `shared/` gains no DB dependency.

### 4.2 `loadVocabularyOverlayFromDb()` (store)
Reads every **active** `knowledge_vocabulary_aliases` row, groups by kind, and installs it via `setVocabularyOverlay`. Called at **server boot** (`server/index.ts`, best-effort) and after **every publish/rollback**, so published aliases resolve from the first request and rollback propagates at once.

### 4.3 `publishApprovedDecisions({ decisionIds?, userId, notes, publishedAt })`
The **only** canonical-knowledge write. Loads the eligible `approved` decisions (all, or the given subset), then per decision:

| decisionType | Action | Counts toward |
|---|---|---|
| `alias` | validate target is a canonical slug (anti-fork) → insert overlay row (reconciling GOV2 many-to-one against any active alias for the key) → decision `published`, term `published` | `aliasesPublished`; distinct targets → `updatedEntities` |
| `new_identity` | emit **hand-off artifact** (audited) → decision `published`, term `handed_off` — **no entity minted** | `newEntities` |
| `reject` | term `rejected` | `rejectedProposals` |
| `defer` | term `deferred` | `deferredProposals` |

Then it creates the **release** (approver set + publisher + counts + linked batches/proposals + notes), the **rollback point** (reverse snapshot), links them, writes the release audit row, and **reloads the overlay**. `updatedEntities` = distinct canonical targets that gained an alias; `newEntities` = hand-off artifacts emitted (proposed to the TS owner, never minted). Idempotent on re-publish of an already-active alias; a conflicting alias (same key → different identity) is skipped with a warning, never forked.

### 4.4 `rollbackRelease(releaseId, userId, rolledBackAt)`
Non-destructive and exact, from the rollback-point snapshot: deactivate the overlay rows the release created (`is_active=false`), revert each published decision to `approved` (re-publishable), revert each term to its snapshotted prior status, mark the release `rolled_back` + rollback point `consumed`, audit every reversal, and reload the overlay. New-identity hand-offs are **not** auto-unwound (they were never applied to canonical space by the Workbench). Because the overlay is additive, removing a row cannot corrupt canonical data — resolution simply reverts to pre-release behaviour (exact + TS-seed aliases).

### 4.5 `getKnowledgeHealth()`
Pure read. Metric definitions (all documented, monotone):

| Metric | Definition |
|---|---|
| Canonical Foods | `count(knowledge_foods)` (DB-owned entities) |
| Canonical Nutrients / Benefits | `NUTRIENT_SEED` / `HEALTH_BENEFIT_SEED` length (TS-owned canonical vocabulary, NK6F source of truth) |
| Canonical Relationships | `food_nutrients + food_benefits + nutrient_benefits` |
| Vocabulary Coverage % | `canonicalVocab / (canonicalVocab + stillUnknownTerms)` — rises as terms are published/handed-off |
| Alias Coverage % | `allAliases / (canonicalVocab + allAliases)` (TS seed + active overlay) |
| Consensus Rate % | `(awaitingApproval + approved) / (awaitingApproval + conflicting + approved)` over terms that reached a verdict |
| Outstanding Reviews / Awaiting Consensus / Awaiting Approval | from the KQ1E consensus dashboard counts |
| Unknown Terms | queue terms still `unresolved` |
| Deferred / Rejected Reviews | queue terms `deferred` / `rejected` |
| Avg Review Time | mean(`term.updatedAt − firstSeenAt`) over approved/published/handed-off terms |
| Avg Time to Publish | mean(`decision.updatedAt − approvedAt`) over published decisions |
| Last Release / Last Published By / Total Releases / Published Aliases | from `knowledge_releases` + active overlay |
| Knowledge Trend | `improving` if 7-day terms-resolved > terms-captured; `declining` if captured > resolved with unknowns remaining; else `stable` |

### 4.6 Routes (`server/routes.ts`, all `assertAdmin`)

| Method & path | Purpose |
|---|---|
| `POST /api/admin/knowledge-review/publish` | Publish approved proposals (`{ decisionIds?, notes? }`) → a release. 400 if none approved. |
| `GET /api/admin/knowledge-review/releases` | List releases (newest first, usernames resolved). |
| `GET /api/admin/knowledge-review/releases/:id` | Release detail: aliases + linked proposals + audit trail. |
| `POST /api/admin/knowledge-review/releases/:id/rollback` | Roll a release back. |
| `GET /api/admin/knowledge-review/health` | Knowledge Health metrics. |

---

## 5. Client — `client/src/pages/admin-knowledge-review-page.tsx`

Two new tabs join Queue / Consensus / Proposals:

- **Releases** (`Rocket`): a **Publish** control (release-notes textarea + a "Publish N approved" button, disabled when none are approved — the count comes from `GET …/decisions?status=approved`) that states plainly publishing is the only canonical-knowledge write; and the **release history** table (id · published · approved-by · published-by · alias/new/updated/rejected/deferred counts · status · **Details** / **Roll back**). Details expands to the notes, linked packages/proposals, rollback id, the published aliases, and the audit trail.
- **Health** (`Activity`): the Knowledge Health dashboard — Canonical Knowledge tiles, Coverage & Consensus, Review Backlog, Timing & Releases, and a colour-coded **Knowledge Trend** badge.

Same `react-query` + `apiRequest` + shadcn `Table.calm-table` conventions; publish/rollback invalidate the releases, decisions, consensus, queue, and health query keys so every tab stays in sync.

---

## 6. GOV2 / ownership compliance

| Guarantee | How KQ1F honours it |
|---|---|
| Publishing is the ONLY canonical-knowledge change | Only `publishApprovedDecisions` writes `knowledge_vocabulary_aliases`; nothing else mutates canonical-adjacent state. |
| No duplicate vocabularies | The overlay holds *alias pointers*, not vocabulary; the anti-fork guard refuses any target that is not already a canonical slug. |
| No duplicate ownership | TS stays the nutrient/benefit vocabulary owner; foods/relationships stay Knowledge-Platform-owned; the overlay is governed alias *content* the single resolver reads. |
| No minted entity | New-identity decisions become hand-off artifacts; the Workbench inserts into **no** `knowledge_*` entity table. |
| Single resolver preserved | Published aliases resolve through THE resolver via the injected overlay — no second resolver, no private synonym table. |
| Human gate preserved | Only `approved` proposals publish; approval is still the human gate; publish/rollback are admin-only. |
| Complete audit history | Append-only `knowledge_review_audit`; rollback soft-deletes overlay rows (never hard-deletes); releases + rollback points are retained. |

---

## 7. Verification

End-to-end against the live DB (seed → import → approve → publish → resolve → health → rollback → cleanup):

```
[1] seed term → resolver REJECTS it (via=unresolved)                         ✓
[2] import alias decision + approve (human gate) → status=approved            ✓
[3] PUBLISH → 1 alias published, rollback point created, 1 target updated     ✓
[4] resolver now resolves the alias → omega-3 via OVERLAY (single resolver)   ✓
[5] release records approvedBy + publishedBy, linked proposal, rollbackId,
    the published alias, notes, and a 'published' audit row                   ✓
[6] canonical ownership UNCHANGED — TS vocabularies + food entities intact    ✓
[7] health: canonical counts, last release, published aliases, coverage %,
    trend all computed                                                        ✓
[8] ROLLBACK → alias deactivated, resolver reverts (no longer resolves),
    release 'rolled_back', decision back to 'approved' (re-publishable)       ✓
```

| Definition of Done | Result |
|---|---|
| Publishing is the final governed workflow | ✅ `publishApprovedDecisions` — the only canonical-knowledge write, approved-only, admin-gated |
| Automatic Knowledge Release Notes generated | ✅ a `knowledge_releases` row per publish with every required field |
| Every release records approving + publishing users | ✅ `approvedByUserId(s)` + `publishedByUserId`, verified distinct-capable |
| Rollback points are created | ✅ a `knowledge_rollback_points` row per release; `rollbackRelease` reverses non-destructively |
| Knowledge Health dashboard is live | ✅ `getKnowledgeHealth` + Health tab — all listed metrics |
| Canonical ownership remains unchanged | ✅ TS vocabularies + `knowledge_*` entity tables byte-for-byte unchanged; overlay holds alias content only |

- **Types:** `tsc --noEmit` clean for all KQ1F files (`schema.ts`, `canonical-vocabulary-resolver.ts`, `knowledge-review-store.ts`, `routes.ts`, `index.ts`, `admin-knowledge-review-page.tsx`, the phase-4 script). Pre-existing errors elsewhere in the tree (intelligence platform, benchmark scripts) are unrelated.
- **Boot:** the server loads the overlay at startup (`[Startup] Knowledge alias overlay loaded: N nutrient + M benefit alias(es)`).

Reproduce: `/admin/knowledge-review` → **Consensus** (approve proposals) → **Releases** → add notes → **Publish N approved** → the release appears with its counts; **Details** shows the published aliases + audit; **Roll back** reverts it. **Health** shows canonical counts, coverage/consensus, backlog, timing, last release, and trend.

---

## 8. Files changed

**New**
- `scripts/apply-knowledge-review-phase4-tables.ts` — idempotent DDL for the four tables + the partial unique index.
- `docs/implementation/knowledge/KQ1F_KNOWLEDGE_PUBLISH_RELEASE_AND_HEALTH.md` — this document.

**Modified**
- `shared/schema.ts` — `knowledge_vocabulary_aliases`, `knowledge_releases`, `knowledge_rollback_points`, `knowledge_review_audit` (+ insert schemas/types); `uniqueIndex` import.
- `shared/knowledge/canonical-vocabulary-resolver.ts` — injectable governed overlay (`setVocabularyOverlay`/`getVocabularyOverlay`/`clearVocabularyOverlay`), overlay merge in `resolveTerm`, `via: "overlay"`, anti-fork guard.
- `server/lib/knowledge-review-store.ts` — `loadVocabularyOverlayFromDb`, `publishApprovedDecisions`, `listReleases`/`getReleaseDetail`, `rollbackRelease`, `getKnowledgeHealth`, `recordAudit`; `published`/`rolled_back` decision statuses.
- `server/routes.ts` — publish, releases list/detail, rollback, health routes.
- `server/index.ts` — load the alias overlay at boot.
- `client/src/pages/admin-knowledge-review-page.tsx` — Releases tab (publish control + history + detail + rollback) and Health tab (dashboard).

**Unchanged (as required)**
- The TS-owned canonical vocabularies (`nutrients.ts` / `health-benefits.ts`), all `knowledge_*` **entity**/relationship tables, and the single resolver's public contract. The overlay adds governed alias *content* only.

---

*KQ1F complete: Publish is the final governed workflow and the only operation that changes canonical knowledge — applying approved aliases to the governed overlay the single GOV2 resolver reads, handing off new identities to the TS owner without minting, auto-generating Knowledge Release Notes (with approving + publishing users and full change counts), creating rollback points, and feeding a live Knowledge Health dashboard — with canonical ownership, the single resolver, and complete audit history all preserved, and every canonical change reversible.*
