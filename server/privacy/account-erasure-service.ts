// BUS1 — Right to Erasure (UK GDPR Article 17).
//
// Governing architecture: docs/architecture/THA_TRUST_AND_COMPLIANCE_ARCHITECTURE.md
//
// This service owns NO knowledge of what personal data exists. Every table it
// touches, and what happens to that table, is declared in
// ./personal-data-registry.ts — the one owner. This file owns only the ORDER,
// the receipt, and the safety rules.
//
// ─── WHY THERE IS NO TRANSACTION AROUND ALL OF THIS ──────────────────────────
// The obvious shape is one transaction over every step. It was considered and
// deliberately not used, for two reasons:
//
//   1. It would hold write locks across ~45 tables — including `meals` and
//      `knowledge_*`, which every other household is reading — for the whole
//      erasure. On a shared table set that is a platform-wide stall.
//   2. It is not needed, because every step is IDEMPOTENT and the ordering
//      makes the operation RESUMABLE. Each step is `DELETE ... WHERE user_id =`
//      or `UPDATE ... SET user_id = NULL WHERE user_id =`; running it twice
//      affects zero rows the second time. And the `users` row is deleted LAST,
//      so any failure before that point leaves the account fully intact and the
//      whole erasure safely retryable from the beginning.
//
// The failure mode that matters — "we said we deleted it and we did not" —
// is therefore impossible to reach silently: either the account row is gone,
// which can only happen once every reference to it has been removed, or the
// account is still there and the caller got an error.
// ─────────────────────────────────────────────────────────────────────────────

import { db } from "../db";
import { privacyActivityLog } from "@shared/schema";
import {
  PERSONAL_DATA_REGISTRY,
  resolveScope,
  type PersonalDataScope,
} from "./personal-data-registry";

/**
 * The order erasure steps run in.
 *
 * This is load-bearing and is NOT the order the registry happens to be written
 * in. Three constraints fix it:
 *
 *   • `operator-audit` must run FIRST. Those columns are foreign keys to
 *     users.id with no ON DELETE action, so until they are nulled the final
 *     delete is blocked by the database.
 *   • `account` must run LAST. It removes the users row, and every other step
 *     needs it to still exist.
 *   • `household` must run after `household-membership`, because whether the
 *     household itself is erased depends on whether anyone else is still in it.
 *
 * Every registry entry must appear here exactly once. `assertOrderIsComplete()`
 * fails at startup of the erasure if one is missing — so adding a personal-data
 * category without deciding when it is erased is impossible, rather than
 * silently skipped.
 */
const ERASURE_ORDER: readonly string[] = [
  "operator-audit",
  "sessions",
  "companion",
  "observations",
  "activity",
  "food-diary",
  "product-history",
  "pantry",
  "shopping",
  "planner",
  "meal-plans",
  "plan-templates",
  "meals",
  "eater-profile",
  "consents",
  "support-requests",
  "security-records",
  "preferences",
  // COMM1 — before the household, because the household's deletion is what
  // cascades these rows away. The category itself erases nothing directly
  // (`erase: null`): a community membership belongs to the HOUSEHOLD, so one
  // member erasing their account must not withdraw the whole household from a
  // neighbourhood. It is named here because ERASURE_ORDER must account for
  // every registered category — a category with no position makes the platform
  // refuse to erase at all, which is how this entry was caught.
  "community-membership",
  // COMM1A — same position and same reasoning as community membership: both are
  // household-grained and both are removed by the household cascade, so neither
  // performs a delete of its own.
  "household-invitations-and-referrals",
  "household-membership",
  "household",
  "account",
];

function assertOrderIsComplete(): void {
  const registered = PERSONAL_DATA_REGISTRY.map((e) => e.id);
  const ordered = new Set(ERASURE_ORDER);
  const missing = registered.filter((id) => !ordered.has(id));
  if (missing.length > 0) {
    throw new Error(
      `[privacy] Personal data categories have no erasure position: ${missing.join(", ")}. ` +
        `Add them to ERASURE_ORDER in server/privacy/account-erasure-service.ts. ` +
        `Refusing to erase, because a partial erasure reported as complete is worse than no erasure.`,
    );
  }
  const unknown = ERASURE_ORDER.filter((id) => !registered.includes(id));
  if (unknown.length > 0) {
    throw new Error(`[privacy] ERASURE_ORDER names unknown categories: ${unknown.join(", ")}.`);
  }
}

export interface ErasureReceipt {
  userId: number;
  erasedAt: string;
  /** Rows affected per personal-data category. */
  categories: Record<string, number>;
  totalRowsAffected: number;
  /** True when the household was erased because this was its last member. */
  householdErased: boolean;
}

/**
 * Erase everything THA holds about a person.
 *
 * Irreversible. The caller is responsible for having confirmed intent — this
 * function does not ask, and there is no undo behind it.
 */
export async function eraseAccount(userId: number): Promise<ErasureReceipt> {
  assertOrderIsComplete();

  // Resolved ONCE, up front, while every parent row still exists. The child
  // rows of `meals`, `planner_weeks` and `shopping_list` are reachable only
  // through their parents and none of those declares a cascade, so collecting
  // the ids after deleting a parent would strand them permanently.
  const scope: PersonalDataScope = await resolveScope(userId);

  const byId = new Map(PERSONAL_DATA_REGISTRY.map((e) => [e.id, e]));
  const categories: Record<string, number> = {};
  let total = 0;

  for (const id of ERASURE_ORDER) {
    const entry = byId.get(id);
    if (!entry) continue;
    if (entry.erase === null) {
      categories[id] = 0;
      continue;
    }
    const affected = await entry.erase(scope);
    categories[id] = affected;
    total += affected;
  }

  const receipt: ErasureReceipt = {
    userId,
    erasedAt: new Date().toISOString(),
    categories,
    totalRowsAffected: total,
    householdErased: (categories["household"] ?? 0) > 0,
  };

  // The one record that outlives the account. It holds the integer id, the
  // action, the date and the per-category counts — and nothing that could
  // reconstitute who this person was. See the table's declaration for why it
  // deliberately has no foreign key.
  await db.insert(privacyActivityLog).values({
    userId,
    action: "account-erasure",
    detail: { ...receipt.categories, totalRowsAffected: total },
  });

  console.log(
    `[privacy] Erased account ${userId} — ${total} rows across ${Object.keys(categories).length} categories`,
  );

  return receipt;
}
