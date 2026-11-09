/**
 * uplift-provenance-classification.ts
 * ====================================
 * Pure classification logic for the `up-phantom-rules` publication check
 * (server/verification/publication-register.ts). Extracted (Codex review,
 * 2026-11-09, Priority 5) so the partition between "owner-acknowledged
 * legacy identity" and "not owner-acknowledged" — and the invariant that
 * either case keeps the check failed — can be asserted in a unit test with
 * no live database.
 *
 * NAMING: the not-acknowledged bucket is named exactly that — NOT what it
 * sounds like it could be ("unexamined" or "uninvestigated"). This module
 * tracks only whether an owner acknowledgment exists for a rule_id, never
 * whether anyone has looked into it. A rule_id can be fully investigated
 * (test_rule_boundary was, see the Priority 5 Phase 1 investigation) and
 * still land in this bucket, because investigation and owner acknowledgment
 * are different events — do not conflate them in any future label here.
 */

export interface RuleIdCount {
  readonly rule_id: string;
  readonly n: number;
}

export interface PhantomRuleClassification {
  /** True whenever ANY row cites a rule_id outside the authored registry — unconditional. */
  readonly violated: boolean;
  /** Human-readable detail for the check's result, already split into buckets. */
  readonly detail: string;
  /** Rows whose rule_id is outside UPLIFT_RULES but IS in the acknowledgment ledger. */
  readonly acknowledgedLegacy: readonly RuleIdCount[];
  /** Rows whose rule_id is outside UPLIFT_RULES and is NOT in the acknowledgment ledger. */
  readonly notAcknowledged: readonly RuleIdCount[];
}

/**
 * Classify grouped `meal_uplift_applications.rule_id` counts against the
 * authored registry and the acknowledged-legacy ledger. Pure: takes both
 * sets as parameters, reads no module-level state, does no I/O.
 */
export function classifyUpliftRuleRows(
  rows: readonly RuleIdCount[],
  authoredIds: ReadonlySet<string>,
  acknowledgedIds: ReadonlySet<string>,
): PhantomRuleClassification {
  const unauthored = rows.filter((r) => !authoredIds.has(String(r.rule_id)));

  if (unauthored.length === 0) {
    return {
      violated: false,
      detail: `All ${rows.length} applied rule id(s) are owner-authored.`,
      acknowledgedLegacy: [],
      notAcknowledged: [],
    };
  }

  const acknowledgedLegacy = unauthored.filter((r) => acknowledgedIds.has(String(r.rule_id)));
  const notAcknowledged = unauthored.filter((r) => !acknowledgedIds.has(String(r.rule_id)));
  const total = unauthored.reduce((s, r) => s + Number(r.n), 0);

  const parts: string[] = [];
  if (acknowledgedLegacy.length > 0) {
    const n = acknowledgedLegacy.reduce((s, r) => s + Number(r.n), 0);
    parts.push(
      `${n} row(s) cite an OWNER-ACKNOWLEDGED legacy identity (see ACKNOWLEDGED_LEGACY_RULE_IDENTITIES in server/lib/uplift-rules.ts): ${acknowledgedLegacy.map((r) => `${r.rule_id} ×${r.n}`).join(", ")}`,
    );
  }
  if (notAcknowledged.length > 0) {
    const n = notAcknowledged.reduce((s, r) => s + Number(r.n), 0);
    parts.push(
      `${n} row(s) cite a rule id the owner has NOT ACKNOWLEDGED (no entry in ACKNOWLEDGED_LEGACY_RULE_IDENTITIES — not a claim that it is uninvestigated, only that it is undecided): ${notAcknowledged.map((r) => `${r.rule_id} ×${r.n}`).join(", ")}`,
    );
  }

  return {
    // Unconditional: an acknowledgment ledger entry never clears a violation.
    // See ACKNOWLEDGED_LEGACY_RULE_IDENTITIES' own docblock for why.
    violated: true,
    detail: `${total} application row(s) cite rule id(s) outside the authored registry — ${parts.join("; ")}.`,
    acknowledgedLegacy,
    notAcknowledged,
  };
}
