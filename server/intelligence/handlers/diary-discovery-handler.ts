/**
 * Diary Discovery Handler (INT32)
 * ====================================
 * Routes `diary-discovery/search` intents to the DiaryDiscoveryPort.
 *
 * VERB CONTRACT (read-only):
 *   search  → discover food diary entries matching the query.
 *             An empty query returns recent entries (up to the engine cap).
 *
 * PERMISSION: auth-required.
 * OWNERSHIP:  no data mutation — pure read.
 */

import type { CapabilityHandler, IntelligenceContext, Intent } from "../types.js";
import type {
  DiaryDiscoveryPort,
  DiaryDiscoverySearchResult,
} from "./diary-discovery-port.js";
import { requireUserId, readOnlyVerbGuard } from "./_read-kit.js";

export const DIARY_DISCOVERY_EXECUTABLE_INTENTS = ["search"] as const;

async function handleSearch(
  intent: Intent,
  userId: number,
  port: DiaryDiscoveryPort,
): Promise<DiaryDiscoverySearchResult> {
  const params = intent.parameters ?? {};
  const rawQuery = typeof params.query === "string" ? params.query.trim() : "";

  const items = await port.discover(rawQuery, userId);

  return {
    scope: "diary-search",
    query: rawQuery,
    totalCount: items.length,
    results: items,
    source: "diary-discovery",
  };
}

export function createDiaryDiscoveryHandler(
  resolvePort: () => Promise<DiaryDiscoveryPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    readOnlyVerbGuard(intent, DIARY_DISCOVERY_EXECUTABLE_INTENTS, "Diary Discovery");
    const userId = requireUserId(context, "Diary Discovery");
    const port = await resolvePort();
    return handleSearch(intent, userId, port);
  };
}
