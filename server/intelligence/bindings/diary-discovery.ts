/**
 * Diary Discovery Binding (INT32)
 * ====================================
 * Wires the `diary-discovery` capability into an IntelligencePlatform instance.
 *
 * PRODUCTION:  `createProductionDiaryDiscoveryPort` (lazy DB import).
 * TESTS:       Pass a custom `resolvePort` factory that returns an in-memory stub.
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { IntentVerb } from "../types.js";
import {
  createDiaryDiscoveryHandler,
  DIARY_DISCOVERY_EXECUTABLE_INTENTS,
} from "../handlers/diary-discovery-handler.js";
import {
  createProductionDiaryDiscoveryPort,
  type DiaryDiscoveryPort,
} from "../handlers/diary-discovery-port.js";

export const DIARY_DISCOVERY_CAPABILITY_ID = "diary-discovery" as const;

export const DIARY_DISCOVERY_BINDING_EXECUTABLE_INTENTS: readonly IntentVerb[] =
  DIARY_DISCOVERY_EXECUTABLE_INTENTS as unknown as IntentVerb[];

export function bindDiaryDiscoveryCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<DiaryDiscoveryPort> = createProductionDiaryDiscoveryPort,
): void {
  platform.registerHandler(
    DIARY_DISCOVERY_CAPABILITY_ID,
    createDiaryDiscoveryHandler(resolvePort),
    DIARY_DISCOVERY_BINDING_EXECUTABLE_INTENTS,
  );
}
