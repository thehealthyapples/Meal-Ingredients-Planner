/**
 * Nutrition Report Capability Binding (COMP-DET8)
 * ===================================================
 * Activates the TWENTY-FOURTH live capability on the THA Intelligence Platform: binds
 * the read-only Nutrition Report handler to the `nutrition-report` capability, flipping
 * its availability from "registered" to "available". Reuses the exact Port -> Handler ->
 * Binding pattern proven by every capability before it.
 *
 * The handler delegates to the real owning services (nutrition-centre-assembler.ts,
 * household.ts, storage.ts) via a port built with DYNAMIC imports, so binding here does
 * NOT open a database connection at import time.
 *
 * Idempotent: binding twice simply re-binds the same handler.
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { IntentVerb } from "../types.js";
import { createNutritionReportReadHandler, NUTRITION_REPORT_EXECUTABLE_INTENTS } from "../handlers/nutrition-report-read-handler.js";
import { createNutritionReportReadPort, type NutritionReportPort } from "../handlers/nutrition-report-read-port.js";

export const NUTRITION_REPORT_CAPABILITY_ID = "nutrition-report" as const;

export const NUTRITION_REPORT_BINDING_EXECUTABLE_INTENTS: readonly IntentVerb[] =
  NUTRITION_REPORT_EXECUTABLE_INTENTS as unknown as IntentVerb[];

export function bindNutritionReportReadCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<NutritionReportPort> = createNutritionReportReadPort,
): void {
  platform.registerHandler(
    NUTRITION_REPORT_CAPABILITY_ID,
    createNutritionReportReadHandler(resolvePort),
    NUTRITION_REPORT_BINDING_EXECUTABLE_INTENTS,
  );
}
