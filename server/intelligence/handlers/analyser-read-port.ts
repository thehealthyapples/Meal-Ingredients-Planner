/**
 * Analyser Read Port (INT17)
 * ===========================
 * The NARROW, read-only delegation surface the Analyser capability handler is allowed
 * to call. The single method here is a 1:1 forward to an EXISTING owning-service
 * method — `storage.getAllAdditives()` (`server/storage.ts:869`), the static additives
 * reference table. This port adds NO analyser business logic; it is a typed seam so
 * that:
 *   • the handler delegates (never re-implements) the additives read, and
 *   • tests can inject an in-memory owner to prove delegation without a live import.
 *
 * SCOPE, PER THE CANONICAL CAPABILITY CARD (docs/architecture/capabilities/analyser.md):
 * this is the ONLY safe, fabrication-free stored read in the "Analyser (Product / UPF)"
 * capability. `server/lib/product-analysis.ts` (`analyzeProduct`, `detectUPF`,
 * `calculateProductHealthScore`, `generateWarnings`, `parseProductIngredients`) and
 * `server/lib/upf-analysis-service.ts` (`analyzeProductUPF`, `detectAdditives`,
 * `calculateUPFScore`, `calculateTHAAppleRating`, etc.) are PURE COMPUTATION functions
 * over caller-supplied text/nutriments — not reads of any stored analysis result.
 * Barcode lookup (`GET /api/products/barcode/:barcode`) live-fetches from OpenFoodFacts
 * and recomputes analysis fresh on every call; no result is ever persisted to a
 * product-analysis table. None of those are exposed by this port.
 *
 * GOVERNANCE: the additives table is not user-owned (`ownershipScoped: false` in the
 * registry), but all three live routes named in the registry's apiSurface
 * (additives/barcode/scan) require `req.isAuthenticated()` — the handler mirrors that
 * gate. This port has NO write methods by construction (INT17 is read-only).
 */

/** An additive as the owner stores it — the full reference-table row. */
export interface AdditiveRef {
  readonly id: number;
  readonly name: string;
  readonly type: string;
  readonly riskLevel: string;
  readonly description: string | null;
  readonly isRegulatory: boolean | null;
  readonly aliases: string[] | null;
}

/**
 * The read-only owning-service surface. The single method forwards to the existing
 * Analyser owner's static additives reference list.
 */
export interface AnalyserReadPort {
  /** Analyser owner — the static additives reference table. */
  getAllAdditives(): Promise<AdditiveRef[]>;
}

/**
 * Build the production port over the real owning service. The import is DYNAMIC so
 * that loading the Intelligence Platform module never opens a database connection at
 * import time — the owner is only touched on first invocation.
 */
export async function createStorageAnalyserReadPort(): Promise<AnalyserReadPort> {
  const { storage } = await import("../../storage.js");
  return {
    getAllAdditives: () => storage.getAllAdditives(),
  };
}
