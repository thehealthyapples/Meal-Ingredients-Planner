# KNOW3 Lublin composition source and winter-savory citation — 2026-11-17

## Task and scope
Under the owner's explicit approval, admit the University of Life Sciences in Lublin journal domain as composition-only and attach its direct, peer-reviewed winter-savory Vitamin C measurement to pending claim #4386. No claim approvals/rejections or amount edits.

## Repository, governance, risk
- Owning repository/area: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`, WS0 Knowledge Registry / KNOW3.
- Branch / HEAD: `feat/integrated-dev` / `fdfaef0ef261c95a94bf6022ccb7d6db903540de`.
- Risk: 🔴 Red — source trust policy and development-local claim evidence.
- Governing files read for this task: workspace `G:\The Healthy Apples\AGENTS.md`; repo `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs\architecture\README.md`; `docs\architecture\ENGINEERING_WORKFLOW.md`; `.engineering\protocols\ROLLBACK_PROTECTION_PROTOCOL.md`; `docs\ai-operating-model\README.md`; `docs\ai-operating-model\evidence-and-architecture.md`; `docs\ai-operating-model\rollback-and-output.md`; `docs\architecture\PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`; `docs\architecture\NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`; `docs\implementation\knowledge\KNOW3_SOURCE_ATTACHMENT_WORKFLOW_20261105.md`; and `shared\knowledge\evidence.ts`.
- Canonical owner remains the existing knowledge registry, evidence gate, and audited claim-review workflow; no parallel state or writer added.
- Rollback tag: `rollback/KNOW3-lublin-composition-20261117` → `fdfaef0ef261c95a94bf6022ccb7d6db903540de`.
- Pre-change dirty trust-policy snapshot: `G:\The Healthy Apples\Incoming\Rollback Evidence\KNOW3-Lublin-20261117\evidence.ts.pre-change`, SHA-256 `052EA59EE7D7737C1EFA235415B22F0BF56E5A0076C98896EC80C9A300B8298B`. Existing unrelated worktree changes were preserved.

## Source policy change
Added `czasopisma.up.lublin.pl` to `TRUSTED_SOURCE_DOMAINS` and to the existing `compositionOnly` domain list in `shared\knowledge\evidence.ts`, per user approval. Manual gate check returned allowed for a food-to-nutrient row and denied for a food-benefit row.

## Evidence and citation
Source: Nurzyńska-Wierdak, Zawiślak & Najda, “Ontogenetic variability in the quantity and quality of winter savory (*Satureja montana* L.) herb yield,” *Acta Scientiarum Polonorum Hortorum Cultus* 16(6), 67–79 (2017), DOI 10.24326/asphc.2017.6.6. [Publisher article](https://czasopisma.up.lublin.pl/asphc/article/view/2390).

The peer-reviewed original study measured L-ascorbic acid in raw winter savory herb across one- and two-year-old plants and harvest stages. Table 4 reports an overall mean 25.89 mg/100 g fresh weight and stage-by-age values from 19.80 to 31.31 mg/100 g. The citation excerpt notes the variation and explicitly says no amount was entered into THA.

Claim #4386 (`winter-savory → vitamin-c`) was freshly verified active, pending, with no source before write. Used `scripts\attach-reviewed-composition-evidence.ts` in preview → apply → verify order. Exactly one citation is present after the write. Fresh DB read confirms `amount=null`, `reviewed_at=null`, `reviewed_by=null`, `rejected_at=null`, `is_active=true`.

Manifest: `G:\The Healthy Apples\Incoming\Agent Reports\2026-11-17__codex__KNOW3-lublin-winter-savory-4386.json`.
Receipt: `G:\The Healthy Apples\Incoming\Agent Reports\2026-11-17__codex__KNOW3-lublin-winter-savory-4386-receipt.json`.

## Queue and verification
Post-write guarded summary from development-local branch `br-gentle-sun-a2yw79ge`:
- Composition: 173 pending / 156 cited = 17 uncited.
- Food-benefit: 369 pending / 306 cited = 63 uncited.
- Nutrient-benefit: 10 pending / 10 cited = 0 uncited.
- Total pending uncited: **80**, down from 81 due only to #4386.
- Guarded preview, apply, and verify passed. Fresh DB read confirms pending state and unchanged null amount. No automated tests run.

## Data and deployment boundary
One guarded `source_refs` addition to development-local claim #4386 only. No raw SQL write, approval, rejection, amount edit, review timestamp update, migration, restart, production access, deployment, commit, or Claude handoff. Existing unrelated modified/untracked worktree files were left untouched.

## Completion
This scoped source admission and citation is complete. The broader uncited-claim review is incomplete: 80 pending uncited claims remain. Continue exact-match research with citations only through guarded writers; keep claims pending.
