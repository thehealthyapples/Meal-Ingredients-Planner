/**
 * Diary Capability Binding (INT10)
 * =================================
 * Activates the FIFTH live capability on the THA Intelligence Platform: it binds the
 * read-only Diary handler to the `diary` capability, flipping its availability from
 * "registered" (metadata only) to "available" (executable). It reuses the exact
 * Port → Handler → Binding pattern proven by the Planner (INT2), Shopping (INT3),
 * Nutrition / Knowledge (INT4), and Pantry (INT8) — the platform gains a fifth live
 * owner without gaining any diary logic.
 *
 * The handler delegates to the real owning service (storage) via a port built with
 * DYNAMIC imports, so binding here does NOT open a database connection at import time —
 * the owner is only touched on first invocation.
 *
 * Idempotent: binding twice simply re-binds the same handler (the registry replaces it).
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { IntentVerb } from "../types.js";
import { createDiaryReadHandler } from "../handlers/diary-read-handler.js";
import { createStorageDiaryReadPort, type DiaryReadPort } from "../handlers/diary-read-port.js";

/** The capability id this binding activates. */
export const DIARY_CAPABILITY_ID = "diary";

/**
 * The verbs this read-only binding actually executes. Only "read" and "explain" have
 * a live code path in the handler; all other allow-listed verbs (add, delete, import)
 * return an honest gap. Declared here so the registry can surface truthful
 * executableIntents and discovery cannot over-advertise (INT6A).
 */
export const DIARY_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read", "explain"];

/**
 * Bind the read-only Diary handler to a platform.
 *
 * Production: call with only `platform` — the real storage port is used by default.
 * Tests: pass an in-memory port factory as the second argument so the binding and
 * test share the same registration entry point (INT6B recommendation C4).
 */
export function bindDiaryReadCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<DiaryReadPort> = createStorageDiaryReadPort,
): void {
  platform.registerHandler(
    DIARY_CAPABILITY_ID,
    createDiaryReadHandler(resolvePort),
    DIARY_EXECUTABLE_INTENTS,
  );
}
