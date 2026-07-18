/**
 * Diary Capability Binding (INT10 read-only; COMP_ACT1 adds write)
 * =================================================================
 * Activates the live `diary` capability on the THA Intelligence Platform. INT10 bound the
 * read-only handler; COMP_ACT1 COMPOSES that read handler (unchanged) with a new write
 * handler so "add" (log a meal) becomes executable, reusing the exact Port → Handler →
 * Binding pattern the Planner/Shopping/Pantry write paths proved — the platform gains a
 * diary write without gaining any diary logic.
 *
 * Handlers delegate to the real owning service (storage) via ports built with DYNAMIC
 * imports, so binding here does NOT open a database connection at import time — the owner
 * is only touched on first invocation.
 *
 * Idempotent: binding twice simply re-binds the same handler (the registry replaces it).
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { CapabilityHandler, Intent, IntelligenceContext, IntentVerb } from "../types.js";
import { createDiaryReadHandler } from "../handlers/diary-read-handler.js";
import { createStorageDiaryReadPort, type DiaryReadPort } from "../handlers/diary-read-port.js";
import { createDiaryWriteHandler } from "../handlers/diary-write-handler.js";
import { createStorageDiaryWritePort, type DiaryWritePort } from "../handlers/diary-write-port.js";

/** The capability id this binding activates. */
export const DIARY_CAPABILITY_ID = "diary";

/**
 * The verbs this binding actually executes: "read"/"explain" (INT10, read-only) and
 * "add" (COMP_ACT1, write — log one meal on a known date). The remaining allow-listed
 * verbs (delete, import) return an honest gap. Declared here so the registry can surface
 * truthful executableIntents and discovery cannot over-advertise (INT6A).
 */
export const DIARY_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read", "explain", "add"];

/** Compose the read and write handlers into one capability-level dispatcher. */
function composeDiaryHandler(
  readHandler: CapabilityHandler,
  writeHandler: CapabilityHandler,
): CapabilityHandler {
  return (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    if (intent.verb === "add") return writeHandler(intent, context);
    return readHandler(intent, context);
  };
}

/**
 * Bind the composed (read + COMP_ACT1 write) Diary handler to a platform.
 *
 * Production: call with only `platform` — the real storage ports are used by default.
 * Tests: pass in-memory port factories so the binding and test share the same
 * registration entry point (INT6B recommendation C4).
 */
export function bindDiaryReadCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<DiaryReadPort> = createStorageDiaryReadPort,
  resolveWritePort: () => Promise<DiaryWritePort> = createStorageDiaryWritePort,
): void {
  platform.registerHandler(
    DIARY_CAPABILITY_ID,
    composeDiaryHandler(
      createDiaryReadHandler(resolvePort),
      createDiaryWriteHandler(resolveWritePort),
    ),
    DIARY_EXECUTABLE_INTENTS,
  );
}
