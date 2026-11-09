import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pool } from '../server/db';
import { claimReviewSummary, getClaim, recordClaimSourceChange, type ClaimEdge } from '../server/lib/knowledge-claim-review-store';
import { isSourceAllowedForClaim, validateSourceRef, type KnowledgeSourceRef } from '../shared/knowledge/evidence';

// One-off, owner-authorized script for the narrow case the two standing importers cannot
// handle: attaching a SECOND source reference to a claim that already carries one (the
// preparedComposition/preparedClaim guard refuses whenever refs.length > 0, by design).
// This calls the generic recordClaimSourceChange path instead (reviewer name + sourceRef,
// no prepared* argument) — the same exported function, the human-reviewer call shape.
// Used exactly once, for claim 3571 (lamb-kidney -> muscle-recovery), to add a copy of the
// already-human-approved composition citation from claim 4866 (lamb-kidney -> protein) so the
// benefit row's generic NHS "kidney" wording is anchored to the exact species.
type Entry = { id: number; edge: ClaimEdge; subject: string; sourceRef: KnowledgeSourceRef; expectedExistingRefCount: number };

async function main() {
  const [manifestPath, receiptPath, mode = 'preview'] = process.argv.slice(2);
  if (!manifestPath || !receiptPath || !['preview', 'apply', 'verify'].includes(mode)) throw new Error('Provide manifest, receipt and preview/apply/verify.');
  if (process.env.NODE_ENV !== 'development') throw new Error('Development mode required.');
  const host = new URL(process.env.DATABASE_URL!).hostname.replace('-pooler.', '.');
  if (host !== 'ep-dark-feather-a20l9yyd.eu-central-1.aws.neon.tech') throw new Error('Target must be the verified development-local endpoint.');
  const branch = execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim();
  if (branch !== 'feat/integrated-dev') throw new Error('Integrated Dev branch required.');

  const entries: Entry[] = JSON.parse(fs.readFileSync(manifestPath, 'utf8').replace(/^﻿/, ''));
  if (!entries.length || new Set(entries.map(e => `${e.edge}:${e.id}`)).size !== entries.length) throw new Error('Empty or duplicate manifest.');
  const before = await claimReviewSummary();
  const snapshots: any[] = [];

  for (const entry of entries) {
    const errors = validateSourceRef(entry.sourceRef);
    if (errors.length) throw new Error(`Invalid source ${entry.edge}:${entry.id}: ${errors.join('; ')}`);
    const claim = await getClaim(entry.edge, entry.id);
    if (!claim || claim.subject !== entry.subject || claim.status !== 'pending' || !claim.isActive) throw new Error(`Claim changed ${entry.edge}:${entry.id}`);
    if (claim.sourceRefs.length !== entry.expectedExistingRefCount) throw new Error(`Unexpected existing ref count on ${entry.edge}:${entry.id}: expected ${entry.expectedExistingRefCount}, found ${claim.sourceRefs.length}`);
    if (claim.sourceRefs.some(r => r.url === entry.sourceRef.url)) throw new Error(`Source URL already attached ${entry.edge}:${entry.id}`);
    if (!isSourceAllowedForClaim(entry.sourceRef, { sourceRefs: [], reviewedAt: null, foodSlug: entry.subject.split(' → ')[0], benefitSlug: claim.edge === 'food-benefit' ? true : undefined } as any)) {
      throw new Error(`Source domain not allowed for this edge ${entry.edge}:${entry.id}`);
    }
    snapshots.push({ entry, before: claim });
  }

  if (mode !== 'apply') {
    console.log(JSON.stringify({ mode, claims: entries.length, summary: before }));
    return;
  }

  const receipt: any = { target: 'development-local', note: 'generic recordClaimSourceChange path (no preparedClaim), reviewer=Claude', before, snapshots, outcomes: [] };
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2), { flag: 'wx' });
  for (const snapshot of snapshots) {
    const { entry } = snapshot;
    const result = await recordClaimSourceChange({
      edge: entry.edge,
      claimId: entry.id,
      reviewer: 'Claude',
      sourceRef: entry.sourceRef,
    });
    receipt.outcomes.push({ edge: entry.edge, claimId: entry.id, auditId: result.auditId });
    fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));
  }
  receipt.after = await claimReviewSummary();
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify({ attached: receipt.outcomes.length, before, after: receipt.after }));
}

main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
