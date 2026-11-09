import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pool } from '../server/db';
import { claimReviewSummary, getClaim, getClaimHistory, recordClaimSourceChange, type ClaimEdge } from '../server/lib/knowledge-claim-review-store';
import { isEvidenceBackedClaim, isSourceAllowedForClaim, sourceForReview, validateSourceRef, type KnowledgeSourceRef } from '../shared/knowledge/evidence';

// Owner-authorized, development-local importer for official benefit evidence.
// It records candidate citations only; the named human review gate is unchanged.
type PreparedEdge = Exclude<ClaimEdge, 'composition'>;
type Entry = { id: number; edge: PreparedEdge; subject: string; sourceRef: KnowledgeSourceRef };

function sameRef(a: KnowledgeSourceRef, b: KnowledgeSourceRef): boolean {
  return Object.entries(b).every(([key, value]) => (a as any)[key] === value);
}

async function main() {
  const [manifestPath, receiptPath, mode = 'preview'] = process.argv.slice(2);
  if (!manifestPath || !receiptPath || !['preview', 'apply', 'verify'].includes(mode)) throw new Error('Provide manifest, receipt and preview/apply/verify.');
  if (process.env.NODE_ENV !== 'development') throw new Error('Development mode required.');
  const host = new URL(process.env.DATABASE_URL!).hostname.replace('-pooler.', '.');
  if (host !== 'ep-dark-feather-a20l9yyd.eu-central-1.aws.neon.tech') throw new Error('Target must be the verified development-local endpoint.');
  const branch = execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim();
  if (branch !== 'feat/integrated-dev') throw new Error('Integrated Dev branch required.');

  const entries: Entry[] = JSON.parse(fs.readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, ''));
  if (!entries.length || new Set(entries.map(e => `${e.edge}:${e.id}`)).size !== entries.length) throw new Error('Empty or duplicate manifest.');
  const before = await claimReviewSummary();
  const snapshots = [];

  for (const entry of entries) {
    if (entry.edge === 'composition' || !entry.subject || !Number.isInteger(entry.id)) throw new Error(`Invalid prepared claim identity ${entry.id}`);
    const ref = entry.sourceRef;
    const errors = validateSourceRef(sourceForReview(ref, ref.preparedOn ?? ''));
    if (errors.length || ref.preparedBy !== 'Codex' || ref.lastReviewed) throw new Error(`Invalid prepared source ${entry.edge}:${entry.id}`);
    if (!isSourceAllowedForClaim(ref, { sourceRefs: [], reviewedAt: null, benefitSlug: true } as any)) throw new Error(`Source role does not support ${entry.edge}:${entry.id}`);

    const claim = await getClaim(entry.edge, entry.id);
    if (!claim || claim.subject !== entry.subject || claim.edge !== entry.edge || claim.status !== 'pending' || !claim.isActive) throw new Error(`Claim changed ${entry.edge}:${entry.id}`);
    const matches = claim.sourceRefs.some(existing => sameRef(existing, ref));
    if (mode === 'verify') {
      if (!matches || isEvidenceBackedClaim({ ...claim, reviewedAt: null })) throw new Error(`Citation/state verification failed ${entry.edge}:${entry.id}`);
      const history = await getClaimHistory(entry.edge, entry.id);
      if (!history.some(h => h.action === 'source-attached' && h.actorKind === 'llm' && h.detail?.includes('Codex'))) throw new Error(`Missing agent audit ${entry.edge}:${entry.id}`);
    } else if (claim.sourceRefs.length) {
      throw new Error(`Claim already has evidence ${entry.edge}:${entry.id}`);
    }
    snapshots.push({ entry, claim, alreadyAttached: matches });
  }

  if (mode !== 'apply') {
    console.log(JSON.stringify({ mode, claims: entries.length, alreadyAttached: snapshots.filter(s => s.alreadyAttached).length, summary: before }));
    return;
  }

  const receipt: any = { target: 'development-local', before, snapshots, outcomes: [] };
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2), { flag: 'wx' });
  for (const snapshot of snapshots) {
    if (snapshot.alreadyAttached) continue;
    const { entry } = snapshot;
    const result = await recordClaimSourceChange({
      edge: entry.edge,
      claimId: entry.id,
      reviewer: 'Codex',
      sourceRef: entry.sourceRef,
      preparedClaim: { edge: entry.edge, subject: entry.subject },
    });
    receipt.outcomes.push({ edge: entry.edge, claimId: entry.id, auditId: result.auditId });
    fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));
  }
  receipt.after = await claimReviewSummary();
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify({ attached: receipt.outcomes.length, before, after: receipt.after }));
}

main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
