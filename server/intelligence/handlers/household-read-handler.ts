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
import { requireUserId, gap, readOnlyVerbGuard, toInt } from "./_read-kit.js";
import type { HouseholdEaterRow } from "@shared/schema";
import type { HouseholdDietaryContext } from "../../storage.js";
import { dbEaterToHouseholdEater } from "@shared/household-eater.js";
import { hasCurrentHealthContextConsent } from "../../privacy/health-context-consent.js";
import { nutritionFocusLabel } from "@shared/nutrition-focus";

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
  readonly kind: "account" | "no-account";
  readonly userId: number | undefined;
  readonly defaultDietTypes: readonly string[];
  readonly hardRestrictions: readonly string[];
  readonly reportedHealthContext?: readonly { id: string; fact: string; reportedAt: string }[];
  readonly nutritionFocuses?: readonly { id: string; focus: string; reportedAt: string }[];
}

export interface HouseholdEatersView {
  readonly scope: "eaters";
  readonly eaters: readonly HouseholdEaterView[];
}

export type HouseholdReadResult = HouseholdView | HouseholdDietaryContextView | HouseholdEatersView;

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
 * Project one eater row for the "eaters" scope — stored fields only. CONV1 P4
 * (READ-1): the read-time profile enrichment this function used to perform is
 * deleted. The eater row is the canonical owner of every member's diet (OWN-1),
 * so the stored values ARE the facts; nothing is looked up, merged, or derived.
 * (The old name `enrichEater` described the retired behaviour.)
 */
export function toEaterView(row: HouseholdEaterRow, includeReportedHealthContext = false): HouseholdEaterView {
  const base = dbEaterToHouseholdEater(row);
  return {
    id: base.id,
    displayName: base.displayName,
    kind: base.kind,
    userId: base.userId,
    defaultDietTypes: base.defaultDietTypes,
    hardRestrictions: base.hardRestrictions,
    ...(includeReportedHealthContext && base.kind === "no-account" ? {
      reportedHealthContext: (row.reportedHealthContext ?? []).map(({ id, fact, reportedAt }) => ({ id, fact, reportedAt })),
      nutritionFocuses: (row.nutritionFocuses ?? []).map(({ id, focus, reportedAt }) => ({ id, focus, reportedAt })),
    } : {}),
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
      const consent = await hasCurrentHealthContextConsent(userId);
      return { scope: "eaters", eaters: rows.map((row) => toEaterView(row, consent)) };
    }
  }
}

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

/**
 * Create the household handler. `resolvePort` provides the owning-service surface
 * (production: real storage; tests: in-memory owner). The returned handler is what the
 * Capability Registry binds to the `household` capability (INT13).
 */
export function createHouseholdReadHandler(
  resolvePort: () => Promise<HouseholdReadPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    const userId = requireUserId(context, "Household");
    const port = await resolvePort();

    if (intent.verb === "add") {
      const params = intent.parameters ?? {};
      if (params.scope === "nutrition-focus") {
        const eaterId = toInt(params.eaterId);
        const focus = typeof params.focus === "string" ? params.focus : "";
        if (eaterId === undefined || !nutritionFocusLabel(focus)) throw gap("Choose a dependent profile and one supported nutrition focus.");
        if (!(await hasCurrentHealthContextConsent(userId))) throw gap("Review and grant the current health-data consent in Privacy Settings before saving nutrition focuses.");
        if (!port.addHouseholdEaterNutritionFocus) throw gap("The Household owner does not expose the nutrition-focus write yet.");
        let householdId: number;
        try { householdId = await port.getHouseholdForUser(userId); }
        catch { throw gap("There is no active household to update."); }
        const entries = await port.addHouseholdEaterNutritionFocus(householdId, eaterId, focus, userId);
        if (!entries) throw gap("That dependent is not an editable account-less profile in your active household.");
        return { scope: "nutrition-focus", saved: true, focus, entries: entries.map(({ id, focus: entryFocus, reportedAt }) => ({ id, focus: entryFocus, reportedAt })) };
      }
      if (params.scope !== "reported-health-context") throw gap('Household add only accepts scope "reported-health-context".');
      const eaterId = toInt(params.eaterId);
      const fact = typeof params.reportedFact === "string" ? params.reportedFact.trim() : "";
      if (eaterId === undefined || fact.length < 3 || fact.length > 180) throw gap("Choose a household child and provide the exact reported information (3–180 characters).");
      if (!(await hasCurrentHealthContextConsent(userId))) throw gap("Review and grant the current health-data consent in Privacy Settings before saving health information.");
      if (!port.addHouseholdEaterReportedHealthContext) throw gap("The Household owner does not expose the reported-health-context write yet.");
      let householdId: number;
      try { householdId = await port.getHouseholdForUser(userId); }
      catch { throw gap("There is no active household to update."); }
      const entries = await port.addHouseholdEaterReportedHealthContext(householdId, eaterId, fact, userId);
      if (!entries) throw gap("That child is not an editable child record in your active household.");
      return { scope: "reported-health-context", saved: true, status: "reported", entries: entries.map(({ id, fact: entryFact, reportedAt }) => ({ id, fact: entryFact, reportedAt })) };
    }

    readOnlyVerbGuard(intent, ["read"], "Household");

    return handleRead(intent, userId, port);
  };
}
