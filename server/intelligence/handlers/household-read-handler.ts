/**
 * Household Read Handler (INT13 — seventh live capability binding)
 * ===================================================================
 * The SEVENTH execution handler bound to the THA Intelligence Platform. It makes the
 * `household` capability *executable* for READ-ONLY intents only, by delegating every
 * read to the existing Household owner through a {@link HouseholdReadPort}. It proves the
 * reusable Port → Handler → Binding pattern (first established for the Planner in INT2)
 * against a seventh, independent owner.
 *
 * HARD BOUNDARIES (the reason this binding is safe):
 *   • READ-ONLY. Only the "read" verb executes. "explain" (no stored rationale on
 *     membership/eater records) and "add"/"delete" (writes) all fall through
 *     `readOnlyVerbGuard` and return an honest gap — there is NO code path here that
 *     creates a household, invites/removes a member, or adds/edits an eater.
 *   • DELEGATION ONLY. All data comes from the owning service via the port. This file
 *     contains NO household business rule of its own. The one exception — adult eater
 *     enrichment from `users.dietPattern` / `users.dietRestrictions` — is not invented
 *     logic; it is a direct mirror of the existing owner-adjacent route projection at
 *     `server/routes.ts:8526–8541`, exactly as the canonical Capability Card requires for
 *     the "eaters" scope. Household (storage) remains the owner (Principles 2 & 7).
 *   • EXPLICIT PROJECTION, NOT A RAW FORWARD. `inviteCode` (a join secret) is returned by
 *     the human `/api/household` route but is DELIBERATELY EXCLUDED from this AI-facing
 *     projection — resolving the canonical Capability Card's documented OPEN DECISION: an
 *     AI capability is a new, broader-blast-radius consumer of a join secret, so it is
 *     never surfaced here.
 *   • PERMISSION-AWARE / OWN DATA ONLY. The caller must be an authenticated user; every
 *     read is scoped to that user's own household, resolved exclusively from
 *     `getHouseholdForUser(userId)` (never a client-suppliable household id — there is no
 *     id parameter on this binding's read, so cross-household access has no code path).
 *   • HONEST GAPS + THA TRUST RULES. A request the Household owner holds no safe answer
 *     for returns a structured gap, never a fabricated answer (Principle 6). A caller with
 *     no active household membership is an honest gap, never a fabricated empty household.
 *
 * The handler is built by {@link createHouseholdReadHandler} with a port provider, so the
 * production binding injects the real owning service and tests inject an in-memory owner.
 */

import type { CapabilityHandler, IntelligenceContext, Intent } from "../types.js";
import type { HouseholdReadPort } from "./household-read-port.js";
import { requireUserId, gap, readOnlyVerbGuard } from "./_read-kit.js";
import type { HouseholdEaterRow } from "@shared/schema";
import type { HouseholdDietaryContext } from "../../storage.js";
import { dbEaterToHouseholdEater } from "@shared/household-eater.js";

// ---------------------------------------------------------------------------
// Result shapes (read projections — owned data, surfaced honestly)
// ---------------------------------------------------------------------------

/** A household member as the read binding surfaces it — mirrors `GET /api/household`'s member projection. */
export interface HouseholdMemberView {
  readonly userId: number;
  readonly displayName: string;
  readonly role: string;
  readonly status: string;
}

/**
 * The caller's household — an EXPLICIT projection. Never includes `inviteCode` (a join
 * secret the human `/api/household` route returns, but which this AI-facing binding
 * deliberately excludes — see the OPEN DECISION note in the file header).
 */
export interface HouseholdView {
  readonly scope: "household";
  readonly id: number;
  readonly name: string;
  /** The caller's own role in this household; "member" if no membership row is found (mirrors server/routes.ts:8388). */
  readonly myRole: string;
  readonly members: readonly HouseholdMemberView[];
}

export interface HouseholdDietaryContextView {
  readonly scope: "dietary-context";
  readonly members: HouseholdDietaryContext["members"];
  readonly aggregated: HouseholdDietaryContext["aggregated"];
}

/** A household eater row as the read binding surfaces it — stored fields, enriched for adults at read time. */
export interface HouseholdEaterView {
  readonly id: string;
  readonly displayName: string;
  readonly kind: "user" | "child";
  readonly userId: number | undefined;
  readonly defaultDietTypes: readonly string[];
  readonly hardRestrictions: readonly string[];
}

export interface HouseholdEatersView {
  readonly scope: "eaters";
  readonly eaters: readonly HouseholdEaterView[];
}

export type HouseholdReadResult = HouseholdView | HouseholdDietaryContextView | HouseholdEatersView;

// ---------------------------------------------------------------------------
// Diet-pattern enrichment (mirrors server/routes.ts:8526–8541 exactly — same mapping
// table the route, server/lib/household-meal-matcher.ts, and the Profile binding's owner
// already use; not new business logic, a direct mirror of an existing read-time projection).
// ---------------------------------------------------------------------------

const DIET_PATTERN_TO_DIET_TYPE: Record<string, string> = {
  Vegan: "vegan",
  Vegetarian: "vegetarian",
  Flexitarian: "flexitarian",
  Keto: "keto",
  "Low-Carb": "low-carb",
  Paleo: "paleo",
  Carnivore: "carnivore",
  Mediterranean: "mediterranean",
  DASH: "dash",
  MIND: "mind",
};

// ---------------------------------------------------------------------------
// Read projections (stored fields only — no fabrication)
// ---------------------------------------------------------------------------

function toMemberView(row: { member: { userId: number; role: string; status: string }; user: { displayName: string | null; username: string } }): HouseholdMemberView {
  return {
    userId: row.member.userId,
    displayName: row.user.displayName || row.user.username,
    role: row.member.role,
    status: row.member.status,
  };
}

/**
 * Enrich one eater row for the "eaters" scope. Adult rows (userId != null) store empty
 * arrays by design — the authoritative source is the user's own profile, read at this
 * point in time, never written back. Child rows (userId == null) are returned unchanged.
 * This is a direct mirror of server/routes.ts:8526–8541, not new business logic.
 */
export async function enrichEater(row: HouseholdEaterRow, port: HouseholdReadPort): Promise<HouseholdEaterView> {
  const base = dbEaterToHouseholdEater(row);
  const eaterUserId = base.userId;

  if (eaterUserId == null) {
    return {
      id: base.id,
      displayName: base.displayName,
      kind: base.kind,
      userId: undefined,
      defaultDietTypes: base.defaultDietTypes,
      hardRestrictions: base.hardRestrictions,
    };
  }

  const userRow = await port.getUser(eaterUserId);

  let defaultDietTypes: string[];
  if (userRow?.dietPattern) {
    const mapped = DIET_PATTERN_TO_DIET_TYPE[userRow.dietPattern];
    defaultDietTypes = mapped ? [mapped] : [userRow.dietPattern];
  } else {
    defaultDietTypes = [];
  }
  const hardRestrictions: string[] = userRow?.dietRestrictions ?? [];

  return {
    id: base.id,
    displayName: base.displayName,
    kind: base.kind,
    userId: eaterUserId,
    defaultDietTypes,
    hardRestrictions,
  };
}

// ---------------------------------------------------------------------------
// Verb implementation
// ---------------------------------------------------------------------------

const SUPPORTED_SCOPES = ["household", "dietary-context", "eaters"] as const;
type ReadScope = (typeof SUPPORTED_SCOPES)[number];

/**
 * Read the caller's own household, dietary context, or eaters. No id parameter exists on
 * this binding — the household is always resolved server-side from `getHouseholdForUser`,
 * so cross-household access has no code path. A caller with no active household membership
 * is an honest gap (the owner throws; this is the translation point), never a fabricated
 * empty household.
 */
async function handleRead(intent: Intent, userId: number, port: HouseholdReadPort): Promise<HouseholdReadResult> {
  const params = intent.parameters ?? {};
  const scope = params.scope as string | undefined;

  if (!scope || !(SUPPORTED_SCOPES as readonly string[]).includes(scope)) {
    throw gap(
      `Unsupported household read scope ${JSON.stringify(scope)}. Supported read scopes: ` +
        '"household" (id, name, members), "dietary-context" (aggregated diet types/exclusions ' +
        'across active members), and "eaters" (household_eaters rows, enriched for adults).',
    );
  }

  let householdId: number;
  try {
    householdId = await port.getHouseholdForUser(userId);
  } catch {
    throw gap(
      "Honest gap: you do not have an active household membership, so there is no household " +
        "to report. The Intelligence Platform will not fabricate a household.",
    );
  }

  switch (scope as ReadScope) {
    case "household": {
      const { household, members } = await port.getHouseholdWithMembers(householdId);
      const myMembership = members.find((m) => m.member.userId === userId);
      return {
        scope: "household",
        id: household.id,
        name: household.name,
        myRole: myMembership?.member.role ?? "member",
        members: members.map(toMemberView),
      };
    }
    case "dietary-context": {
      const context = await port.getHouseholdDietaryContext(userId);
      return { scope: "dietary-context", members: context.members, aggregated: context.aggregated };
    }
    case "eaters": {
      const rows = await port.getHouseholdEaters(householdId);
      const eaters = await Promise.all(rows.map((row) => enrichEater(row, port)));
      return { scope: "eaters", eaters };
    }
  }
}

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

/**
 * Create the household read-only handler. `resolvePort` provides the owning-service
 * surface (production: real storage; tests: in-memory owner). The returned handler is
 * what the Capability Registry binds to the `household` capability (INT13).
 */
export function createHouseholdReadHandler(
  resolvePort: () => Promise<HouseholdReadPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    // Read-only binding: only "read" executes. "explain" (no stored rationale on
    // membership/eater records) and "add"/"delete" (writes — household creation,
    // member invite/removal, eater create/update remain owned by the Household service)
    // are all out of scope for this read-only binding and return an honest gap via the
    // guard below. There is no code path here that creates, invites, removes, or edits.
    readOnlyVerbGuard(intent, ["read"], "Household");

    const userId = requireUserId(context, "Household");
    const port = await resolvePort();

    return handleRead(intent, userId, port);
  };
}
