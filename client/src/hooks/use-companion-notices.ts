// PHASE5E (NTC-P1) — the ONE client-side owner of the Companion notice read.
//
// RETIRES `use-companion-observations.ts`, which fetched
// `GET /api/intelligence/companion/observations` — a route that **does not exist**.
// It was renamed to `/notices` under OBS1 (when "Observation Engine" became the name of
// the platform's telemetry service, and the ambient-notice component became the Notice
// Engine); the server route was renamed and this hook never was. So Home's "A gentle
// reminder" section has been fetching a 404, catching it, and rendering an empty list —
// silently — ever since. Every proactive notice THA computed was thrown away at the
// network boundary. PHASE5D found it (§6, §9.4) and correctly declined to fix it out of
// scope; it is fixed here, because it IS this workstream.
//
// This hook owns NO intelligence. Every field is a verbatim projection of what the route
// already produced:
//   • WHICH notices, and HOW MANY  → the Silence Rules (notice-engine.ts) — at most two
//     per moment, ranked by attention, deduped. Applied server-side, once.
//   • HOW EACH ONE SOUNDS          → the Behaviour Engine (`phraseNotice`), applied
//     server-side AFTER selection, in the household's chosen personality.
// It therefore performs no filtering, no ranking, no capping and no rewording of its own.
// Re-sorting or re-slicing this list on the client would be a second attention budget,
// which is exactly what the Notice Engine Architecture §9 forbids.

import { useQuery } from "@tanstack/react-query";
import type { AttentionLevel } from "@shared/attention/index";

/** One supporting fact, verbatim from the owner that produced it (Rule E1). */
export interface CompanionNoticeEvidence {
  readonly source: string;
  readonly detail: string;
}

export interface CompanionNotice {
  readonly id: string;
  /** The closed notice taxonomy (notice-engine.ts `NoticeCategory`). */
  readonly category: string;
  readonly priority: AttentionLevel;
  /** The named owner this notice's fact was read from — provenance, never content. */
  readonly source: string;
  /**
   * The voiced sentence, from the Behaviour Engine. This is what a surface renders.
   *
   * Before PHASE5E the route returned the raw `fact` and no sentence at all, so there
   * was nothing a surface COULD render — which is the second half of why the reminders
   * section was empty even for households that had something to be told.
   */
  readonly text: string;
  /**
   * The underlying fact, kept alongside the sentence deliberately. A notice must never
   * become a claim whose supporting data has been discarded — if a surface ever needs to
   * show *why*, the evidence is right here, and it is the producer's, not a paraphrase.
   */
  readonly fact: unknown;
}

export interface CompanionNoticesData {
  readonly notices: readonly CompanionNotice[];
  /**
   * What the owners honestly offered (`gatheredCount`) versus what the attention budget
   * allowed through (`notices.length`). Reporting both is what makes THA's silence
   * auditable rather than indistinguishable from having nothing to say.
   */
  readonly trust?: {
    readonly sources: readonly string[];
    readonly gatheredCount: number;
    readonly cap: number;
    readonly personalityId: string;
  };
}

const QUERY_KEY = ["/api/intelligence/companion/notices"] as const;

async function fetchCompanionNotices(): Promise<CompanionNoticesData> {
  const res = await fetch("/api/intelligence/companion/notices", {
    credentials: "include",
  });
  // An unauthenticated caller is an honest empty state, never a thrown error surfaced to
  // a component that may render before auth settles.
  if (res.status === 401) return { notices: [] };
  if (!res.ok) throw new Error("Failed to load companion notices");
  return res.json();
}

export function useCompanionNotices(enabled = true) {
  return useQuery<CompanionNoticesData>({
    queryKey: QUERY_KEY,
    queryFn: fetchCompanionNotices,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
