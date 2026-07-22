/**
 * The Life Register — the Living Details manifest (EXP3 § 7.2).
 *
 * This is the single declarative source of truth for the Living Home's Layer-4
 * "Living Details": the household's own life showing through a room's environment
 * band. Every detail is *data-borne or dead* (Blueprint § 12.1) — nothing enters
 * this register without a `binding` to a canonical owner whose true facts decide,
 * at read time, whether the detail appears at all.
 *
 * ── EXP3 Phase 2 status: DELIBERATELY EMPTY. ────────────────────────────────────
 * This module ships the SHAPE and an EMPTY manifest. It has NO consumer and NO
 * owner component yet: the composition mouth (`living-details.tsx`, EXP3 § 7.1) and
 * the resolver (EXP3 § 7.3) land with the FIRST admitted detail — the Cookbook
 * pilot, EXP3 Phase 3 — never before (an authored-but-unadopted foundation is the
 * exact failure UIA § 17 forbids). Nothing imports this file today, so it changes
 * no UI and adds no runtime behaviour.
 *
 * The type shape makes the six Blueprint § 12.1 laws unbreakable by construction:
 * a spec CANNOT carry motion, text/copy, an occasion/tradition key, a colour
 * override, or a per-surface exposure — there is no field for any of them.
 *
 * NOT this register: House assets (immutable architecture — see
 * `docs/implementation/assets/house-asset-register.json`) and Environmental
 * Dressing (the claim-free third register, DECLARED-NOT-BUILT — LIVINGHOME2).
 * A binding is precisely what distinguishes Life from Dressing: Life MUST bind to
 * a household fact; Dressing MUST NOT. The verifier enforces the boundary.
 */

/** Shell realm ids a detail may attach to. Kept as `string` to track the shell's own realm vocabulary. */
export type Realm =
  | "cookbook"
  | "pantry"
  | "orchard"
  | "nutrition"
  | "diary"
  | (string & {});

/** A reference into the shared object library (EXP3 § 6). Resolved to media only by the owner component. */
export interface ObjectRef {
  /** Fact-shaped object id (e.g. "plums"), one file, one owner — never room-shaped. */
  readonly id: string;
}

export interface LivingDetailSpec {
  /** One detail id, admitted by name (Blueprint § 12.1.6). */
  readonly id: string;
  /** The admission's document id — no anonymous charm (EXP3 § 7.2). */
  readonly admittedBy: string;
  /** The predecessor detail retired in the same decision, or null (Blueprint § 12.1.1 — one per domain). */
  readonly retires: string | null;
  /** The data binding — its presence is what makes this the LIFE register, not Dressing. */
  readonly binding: {
    /** The canonical owner read (query key / module), named. */
    readonly source: string;
    /** Human-readable truth condition, e.g. "household has >=1 pantry item in season (Domain 11 n pantry facts)". */
    readonly predicate: string;
  };
  /** Object-library ids; each renders only if its fact holds. */
  readonly objects: ReadonlyArray<ObjectRef>;
  /** Declared visual ceiling, never tuned per surface (UIA § 15). */
  readonly ceiling: {
    readonly maxObjects: number;
    readonly strengthToken: string;
  };

  // Structurally ABSENT, forever — and that absence IS the law made mechanical:
  //   • no motion / animation fields ...... a Living Detail is still (Blueprint § 12.1.5)
  //   • no text / copy fields ............. details never carry text (Blueprint § 6.1)
  //   • no occasion / tradition key ....... LH3 · LIVINGHOME1 § 10.4 (a tradition never carries an asset)
  //   • no colour override ................ UIA § 7 owns colour
  //   • no per-surface exposure ........... UIA § 16 owns exposure tokens
}

/**
 * The one-per-domain law as a type: a realm maps to AT MOST ONE spec.
 * (Partial: most realms have no Living Detail; that is the honest default.)
 */
export type LivingDetailsManifest = Partial<Record<Realm, LivingDetailSpec>>;

/**
 * THE MANIFEST — empty at EXP3 Phase 2 by design.
 *
 * The first entry is admitted at EXP3 Phase 3 (the Cookbook pilot), through the
 * full experience gate stack, retiring "the well-thumbed page" in the same
 * decision. Until then, every room's band renders exactly as it does today.
 */
export const livingDetailsManifest: LivingDetailsManifest = {};
