import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pool } from '../server/db';
import { claimReviewSummary, getClaim, getClaimHistory, recordClaimSourceChange } from '../server/lib/knowledge-claim-review-store';
import { isEvidenceBackedClaim, sourceForReview, validateSourceRef, type KnowledgeSourceRef } from '../shared/knowledge/evidence';

// Owner-authorized, development-local research import. Each row uses the canonical
// transaction and audit writer. No claim decision is made by this script.
type Entry = { id: number; foodSlug: string; nutrientSlug: string; sourceRef: KnowledgeSourceRef };
async function main() {
  const [manifestPath, receiptPath, mode = 'preview'] = process.argv.slice(2);
  if (!manifestPath || !receiptPath || !['preview', 'apply', 'verify'].includes(mode)) throw new Error('Provide manifest, receipt and preview/apply/verify.');
  if (process.env.NODE_ENV !== 'development') throw new Error('Development mode required.');
  const host = new URL(process.env.DATABASE_URL!).hostname.replace('-pooler.', '.');
  if (host !== 'ep-dark-feather-a20l9yyd.eu-central-1.aws.neon.tech') throw new Error('Target must be the verified development-local endpoint.');
  const branch = execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim();
  if (branch !== 'feat/integrated-dev') throw new Error('Integrated Dev branch required.');
  const entries: Entry[] = JSON.parse(fs.readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, ''));
  if (!entries.length || new Set(entries.map(e => e.id)).size !== entries.length) throw new Error('Empty or duplicate manifest.');
  const before = await claimReviewSummary();
  const snapshots = [];
  for (const entry of entries) {
    const ref = entry.sourceRef;
    const errors = validateSourceRef(sourceForReview(ref, ref.preparedOn ?? ''));
    if (errors.length || ref.preparedBy !== 'Codex' || ref.lastReviewed) throw new Error(`Invalid prepared source ${entry.id}`);
    const claim = await getClaim('composition', entry.id);
    if (!claim || claim.subject !== `${entry.foodSlug} → ${entry.nutrientSlug}` || claim.status !== 'pending' || !claim.isActive) throw new Error(`Claim changed ${entry.id}`);
    const existing = claim.sourceRefs.find(r => r.url === ref.url && JSON.stringify(r) === JSON.stringify(ref));
    // JSONB key ordering may differ; compare the supplied fields individually.
    const matches = existing ?? claim.sourceRefs.find(r => Object.entries(ref).every(([key, value]) => (r as any)[key] === value));
    if (claim.sourceRefs.length && !matches) throw new Error(`Claim already has other evidence ${entry.id}`);
    if (mode === 'verify') {
      if (!matches || isEvidenceBackedClaim({ ...claim, foodSlug: entry.foodSlug, nutrientSlug: entry.nutrientSlug } as any)) throw new Error(`Citation/state verification failed ${entry.id}`);
      const history = await getClaimHistory('composition', entry.id);
      if (!history.some(h => h.action === 'source-attached' && h.actorKind === 'llm' && h.detail?.includes('Codex'))) throw new Error(`Missing agent audit ${entry.id}`);
    }
    snapshots.push({ entry, claim, alreadyAttached: Boolean(matches) });
  }
  if (mode !== 'apply') {
    console.log(JSON.stringify({ mode, claims: entries.length, alreadyAttached: snapshots.filter(s => s.alreadyAttached).length, summary: before }));
    return;
  }
  const receipt: any = { target: 'development-local', before, snapshots, outcomes: [] };
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2), { flag: 'wx' });
  for (const snapshot of snapshots) {
    if (snapshot.alreadyAttached) continue;
    const entry = snapshot.entry;
    const result = await recordClaimSourceChange({ edge: 'composition', claimId: entry.id, reviewer: 'Codex', sourceRef: entry.sourceRef, preparedComposition: { foodSlug: entry.foodSlug, nutrientSlug: entry.nutrientSlug } });
    receipt.outcomes.push({ claimId: entry.id, auditId: result.auditId });
    fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));
  }
  receipt.after = await claimReviewSummary();
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify({ attached: receipt.outcomes.length, before, after: receipt.after }));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
