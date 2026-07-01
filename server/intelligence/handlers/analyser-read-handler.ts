/**
 * Analyser Read Handler (INT17 — eleventh live capability binding)
 * ===================================================================
 * The ELEVENTH execution handler bound to the THA Intelligence Platform. It makes the
 * `analyser` capability *executable* for a single, narrow READ-ONLY scope, by
 * delegating to the existing Analyser owner through an {@link AnalyserReadPort}. It
 * proves the reusable Port → Handler → Binding pattern (first established for the
 * Planner in INT2) against an eleventh, independent owner.
 *
 * HARD BOUNDARIES (the reason this binding is safe — per the canonical Capability Card,
 * docs/architecture/capabilities/analyser.md):
 *   • READ-ONLY, ONE SCOPE ONLY. Only the "read" verb executes, and only for
 *     `scope: "additives"`. There is NO code path here for `explain`, `analyse`, or
 *     `report` — the Card found no safe, grounded STORED-read owner for any of them.
 *   • NO UPF/PRODUCT-ANALYSIS FABRICATION. This handler never surfaces a UPF
 *     classification, health score, or NOVA group for a product. The only code paths
 *     that could produce those (`product-analysis.ts`, `upf-analysis-service.ts`) are
 *     PURE COMPUTATION over caller-supplied text, or a live OpenFoodFacts fetch
 *     recomputed fresh on every call — neither is a stored read, and presenting either
 *     as a fact would be a fabrication (Principle 6). This binding does not touch
 *     either path.
 *   • DELEGATION ONLY. The additives list comes from the owning service via the port,
 *     unmodified. This file contains NO additive business logic, NO scoring, and NO
 *     synthesis of its own.
 *   • PERMISSION-AWARE. The additives table is not user-owned (no ownership scoping
 *     applies), but all three live routes named in the registry's apiSurface
 *     (additives/barcode/scan) require an authenticated caller — this handler mirrors
 *     that gate.
 *   • HONEST GAPS. A missing or unsupported `scope` parameter returns a structured gap
 *     naming the one supported scope, never a fabricated answer.
 *
 * The handler is built by {@link createAnalyserReadHandler} with a port provider, so the
 * production binding injects the real owning service and tests inject an in-memory owner.
 */

import type { CapabilityHandler, IntelligenceContext, Intent } from "../types.js";
import type { AnalyserReadPort, AdditiveRef } from "./analyser-read-port.js";
import { requireUserId, gap, readOnlyVerbGuard } from "./_read-kit.js";

// ---------------------------------------------------------------------------
// Result shapes (read projections — the owner's stored fields, surfaced unmodified)
// ---------------------------------------------------------------------------

/** An additive as the read binding surfaces it — a direct passthrough of the owner's fields. */
export interface AdditiveView {
  readonly id: number;
  readonly name: string;
  readonly type: string;
  readonly riskLevel: string;
  readonly description: string | null;
  readonly isRegulatory: boolean | null;
  readonly aliases: string[] | null;
}

export interface AnalyserAdditivesReadResult {
  readonly scope: "additives";
  readonly additiveCount: number;
  readonly additives: readonly AdditiveView[];
  readonly source: "additives-reference";
}

// ---------------------------------------------------------------------------
// Read projections (stored fields only — no fabrication)
// ---------------------------------------------------------------------------

function toAdditiveView(a: AdditiveRef): AdditiveView {
  return {
    id: a.id,
    name: a.name,
    type: a.type,
    riskLevel: a.riskLevel,
    description: a.description,
    isRegulatory: a.isRegulatory,
    aliases: a.aliases,
  };
}

// ---------------------------------------------------------------------------
// Verb implementations
// ---------------------------------------------------------------------------

/**
 * Read the static additives reference table. Requires `scope: "additives"` — the only
 * scope this capability has a safe, fabrication-free owner for (per the Capability
 * Card). Any other scope, or a missing scope, is an honest gap naming the supported
 * scope.
 */
async function handleRead(intent: Intent, port: AnalyserReadPort): Promise<AnalyserAdditivesReadResult> {
  const params = intent.parameters ?? {};
  const scope = params.scope as string | undefined;

  if (scope !== "additives") {
    throw gap(
      `Unsupported analyser read scope ${JSON.stringify(scope)}. ` +
        'Supported scope: "additives" (the static additives reference table). ' +
        "Barcode/product UPF analysis is not part of this capability's safe, grounded reads " +
        "— it has no stored result, only a live recompute on every call.",
    );
  }

  const additives = await port.getAllAdditives();
  return {
    scope: "additives",
    additiveCount: additives.length,
    additives: additives.map(toAdditiveView),
    source: "additives-reference",
  };
}

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

/**
 * Create the analyser read-only handler. `resolvePort` provides the owning-service
 * surface (production: real owner; tests: in-memory owner). The returned handler is
 * what the Capability Registry binds to the `analyser` capability (INT17).
 */
export function createAnalyserReadHandler(
  resolvePort: () => Promise<AnalyserReadPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    // Read-only binding, single scope: only "read" executes. "explain", "analyse", and
    // "report" are all in the analyser allow-list but all out of scope for this
    // binding — the Card found no safe, grounded STORED-read owner for any of them.
    // There is no code path here that fabricates a UPF classification, health score,
    // or NOVA group.
    readOnlyVerbGuard(intent, ["read"], "Analyser");

    // The additives table is not user-owned, but all three live routes named in the
    // registry's apiSurface require an authenticated caller — mirrored here rather
    // than relaxed.
    requireUserId(context, "Analyser");
    const port = await resolvePort();

    return handleRead(intent, port);
  };
}
