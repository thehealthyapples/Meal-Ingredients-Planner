/**
 * notice-gateway.ts — NTC-P2 Notice Platform Convergence
 * =========================================================================
 * THE ONE PLACE A NOTICE IS OBTAINED.
 *
 * Every surface in THA that tells a household something it did not ask about calls this
 * module, and nothing else. It gathers from the registered owners, hands each one's
 * output to the Notice Engine's own pure producers, lets `applySilenceRules` decide
 * volume and order, and voices the survivors through the Behaviour Engine.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS MODULE EXISTS — and why it is not a second engine
 * ---------------------------------------------------------------------------
 * The Notice Engine Architecture (§7.2) named three live, ungoverned notice channels:
 * `/api/home/intelligence`, `/api/planner/weeks/:weekId/intelligence`, and the WX7
 * pantry-opportunities block. It called them convergence debt rather than defects,
 * because they predate the framework. NTC-P2 is their scheduled convergence.
 *
 * But the interesting question is not how they got there — it is why they were INEVITABLE.
 * Until this module, the entire gather-select-voice pipeline lived INLINE inside one
 * Express handler (`GET /api/intelligence/companion/notices`). It was correct, it was
 * governed, and it was reachable by exactly one caller. Any second surface that wanted to
 * say something unprompted had two options: copy 130 lines of route handler, or assemble
 * its own facts. All three bypasses chose the second, and any future surface would have
 * done the same. **A governed pipeline that only one caller can reach will grow bypasses
 * forever, and no amount of documentation prevents it.** Converging the three channels
 * without fixing that would have fixed three symptoms and left the cause.
 *
 * So this module is the pipeline, extracted from the route, given a front door.
 *
 * IT IS AN I/O ORCHESTRATOR, NOT AN ENGINE. It holds no rule, no threshold, no ranking,
 * no cap and no phrasing of its own. Architecture §5.2 is explicit about the split it
 * implements:
 *
 *   "every producer read flows through `intelligencePlatform.handle()` PERFORMED BY THE
 *    CALLING ROUTE, NOT BY THE ENGINE — the engine receives plain data and stays a
 *    zero-I/O pure module."
 *
 * This is that calling code. `notice-engine.ts` does not import this file, holds no
 * reference to the platform, and remains exactly as pure as it was. This is the same
 * "pure reasoning core, thin I/O orchestrator" split FI4's opportunity engine already
 * uses — applied to the one seam that lacked it.
 *
 * ---------------------------------------------------------------------------
 * WHAT IT MAY NEVER DO
 * ---------------------------------------------------------------------------
 *  - It never re-sorts, re-slices, re-caps or re-words what `applySilenceRules` emitted.
 *    The Silence Rules are the ONE attention budget (§6) and this module is their caller,
 *    never their competitor. A second `.slice()` here would be a second attention budget,
 *    which is precisely the defect PHASE5E removed from the client.
 *  - It never computes a fact. Every string it returns was written by a named owner.
 *  - It never reaches around a capability to a producer's internals. Opportunities arrive
 *    ONLY through `opportunity-delivery:report`, and learning signals ONLY through
 *    `evidence-learning:search` — so OD1's muting, de-duplication and terminal-status
 *    suppression, and EL1's confirmation gate, have already been applied before a Notice
 *    exists.
 *  - It never persists anything. A Notice is request-scoped and stored nowhere.
 *
 * Run tests: npx tsx server/tests/test-intelligence-notice-convergence.ts
 */

import type { User } from "@shared/schema";
import { storage } from "../../storage";
import { getHouseholdForUser } from "../../lib/household";
import { assembleNutritionCentre } from "../../lib/nutrition-centre-assembler";
import { buildHouseholdHistory } from "../../lib/household-history";
import { deriveHouseholdCompanionFields } from "../../lib/household-companion-fields";
import { intelligencePlatform } from "../index.js";
import { phraseNotice, resolveBehaviour } from "./behaviour-engine.js";
import {
  applySilenceRules,
  noticeCelebration,
  noticeDiversity,
  noticeFoodDiscovery,
  noticeHouseholdInsight,
  noticeLearning,
  noticeNutritionTrend,
  noticeOpportunities,
  noticeSeasonal,
  noticeStreak,
  MAX_NOTICES_PER_MOMENT,
  type ConfirmedLearningLike,
  type Notice,
  type NoticeCategory,
  type OpportunityLike,
} from "./notice-engine.js";

// ---------------------------------------------------------------------------
// Surface scopes
// ---------------------------------------------------------------------------

/**
 * A scope names WHICH CATEGORIES A SURFACE IS THE MOUTH FOR.
 *
 * IT IS NOT A SECOND ATTENTION BUDGET, and the distinction is structural rather than
 * asserted: a scope is applied at GATHER time — an out-of-scope producer is never run at
 * all — so `applySilenceRules` still receives everything that was gathered and remains
 * the only thing that decides volume and order (§6). Nothing is ever selected and then
 * discarded.
 *
 * It is the notice analogue of `AmbientIntelligence`'s `domains` prop, and it is
 * sanctioned by the same architecture paragraph (§5.2): "Two presentation channels over
 * one capability are legitimate... Neither is a duplicate owner."
 *
 * WHY THE NARROW SCOPE IS REQUIRED FOR CORRECTNESS, not merely convenient.
 * Every narrative category is `low` priority, because a calm fact about a household's own
 * history is never a demand for attention. So in an unscoped gather they rank below every
 * opportunity, always. An UNSCOPED Home companion card would therefore be permanently
 * starved by any planner gap or restriction conflict — and would render exactly the
 * opportunities that `AmbientIntelligence` already renders, two components below it, on
 * the same page. Convergence would have produced the duplicate presentation it exists to
 * remove. The scope is what prevents that.
 *
 * No harm signal is lost to it: the dashboard, planner, pantry and shopping surfaces all
 * mount `AmbientIntelligence`, which auto-expands on `critical` (ATTN1 A3). The critical
 * keeps its own mouth; the narrative card simply is not it.
 *
 * Scopes are declared HERE, once, and named. A surface picks one; it may not invent an
 * ad-hoc category list of its own, because that is how the closed taxonomy quietly
 * reopens.
 */
export const NOTICE_SCOPE = {
  /**
   * Every category. The full ambient channel — the Companion's own notice surface
   * ("A gentle reminder" on Home), which is a mouth for anything the platform noticed.
   */
  companion: [
    "nutrition-trend",
    "streak-milestone",
    "diversity-milestone",
    "planner-gap",
    "pantry-opportunity",
    "shopping-opportunity",
    // HHP2 — the household's own health opportunities. The Companion is a mouth for
    // anything the platform noticed, and until HHP2 it was the one thing the platform
    // noticed about a household's health that it could not say.
    "nutrition-opportunity",
    "seasonal-highlight",
    "celebration",
    "household-insight",
    "food-discovery",
    "household-learning",
  ],

  /**
   * The four narrative categories the Home Intelligence Companion and the Planner
   * Intelligence Strip exist to tell. These are the four fields those two routes were
   * assembling by hand, ungoverned and unvoiced, before NTC-P2 — the same facts, from the
   * same owners, now under the attention budget and through the voice seam.
   */
  household: [
    "celebration",
    "seasonal-highlight",
    "food-discovery",
    "household-insight",
  ],
} as const satisfies Readonly<Record<string, readonly NoticeCategory[]>>;

export type NoticeScope = readonly NoticeCategory[];

// ---------------------------------------------------------------------------
// The voiced notice
// ---------------------------------------------------------------------------

/**
 * A Notice plus the sentence the Behaviour Engine gave it.
 *
 * `fact` is deliberately retained alongside `text`: the surface renders the sentence, but
 * the underlying fact stays inspectable, so a notice can never become a claim whose
 * supporting data has been thrown away.
 */
export interface VoicedNotice extends Notice {
  readonly text: string;
}

export interface VoicedNoticeBundle {
  readonly notices: readonly VoicedNotice[];
  /**
   * `gatheredCount` is what the owners honestly offered; `notices` is what the attention
   * budget allowed through. Reporting both is what makes the silence AUDITABLE rather
   * than indistinguishable from having had nothing to say.
   */
  readonly trust: {
    readonly sources: readonly string[];
    readonly gatheredCount: number;
    readonly cap: number;
    readonly personalityId: string;
  };
}

// ---------------------------------------------------------------------------
// The gather
// ---------------------------------------------------------------------------

/**
 * Gather every notice this user's data honestly supports within `scope`, select under the
 * Silence Rules, and voice the survivors.
 *
 * Takes a `User`, never a `userId`: every read below is keyed on the authenticated user's
 * own identity, and there is no parameter through which a caller could ask for someone
 * else's data.
 *
 * Each owner is fetched INDEPENDENTLY and best-effort (progressive enrichment, Principle
 * 3). A household with no planner, no streak, or no household row simply contributes no
 * notice from that owner: it never blocks the others, and it never yields a fabricated
 * stand-in. An empty result is a correct, complete answer — the platform never pads it.
 */
export async function gatherNotices(
  user: User,
  scope: NoticeScope = NOTICE_SCOPE.companion,
): Promise<VoicedNoticeBundle> {
  const userId = user.id;
  const wants = new Set<NoticeCategory>(scope);
  const gathered: Notice[] = [];
  const sources: string[] = [];

  /**
   * Run a producer only if this surface is a mouth for at least one category it can
   * produce. This is the gather scope: an out-of-scope owner is never READ, so its cost
   * is not paid and its output never exists to be discarded.
   */
  const wanted = (...categories: NoticeCategory[]): boolean =>
    categories.some((c) => wants.has(c));

  // 1. Planner gaps, pantry usage, shopping conflicts and (HHP2) household health — through
  //    the registered `opportunity-delivery` capability, on the ordinary Intent Engine path.
  //    Never by importing OD1's framework or its store, so the delivery lifecycle,
  //    `mutedOpportunityTypes`, EL1's household learning and the seen-yields-to-unseen
  //    ordering all apply exactly once, where they live.
  //
  //    ONE call serves every category below, because the Decision Engine fans out across all
  //    registered producers itself. HHP2 therefore added a category to this gate and NOT a
  //    second capability call — a second call would have re-fetched, re-ranked and
  //    re-budgeted the same bundle beside the one that already exists.
  if (
    wanted("planner-gap", "pantry-opportunity", "shopping-opportunity", "nutrition-opportunity")
  ) {
    try {
      const outcome = await intelligencePlatform.handle(
        { capabilityId: "opportunity-delivery", verb: "report" },
        intelligencePlatform.contextFor(user),
      );
      if (outcome.status === "ok") {
        const opportunities =
          (outcome.result as { opportunities?: readonly OpportunityLike[] } | null | undefined)
            ?.opportunities ?? [];
        gathered.push(...noticeOpportunities(opportunities));
        sources.push("opportunity-delivery");
      }
    } catch (err) {
      console.error("[NTC] opportunity-delivery unavailable:", err);
    }
  }

  // 2. Nutrition trend — the honest signal THA actually owns. NOT a "nutrition gap": no
  //    reference intake, RDA or target value is stored anywhere in this codebase, so no
  //    gap against a target can be computed without fabricating the target.
  if (wanted("nutrition-trend")) {
    try {
      const trends = await storage.getUserHealthTrends(userId, 90);
      gathered.push(...noticeNutritionTrend(trends));
      sources.push("user_health_trends");
    } catch (err) {
      console.error("[NTC] health trends unavailable:", err);
    }
  }

  // 3. Streak milestone.
  if (wanted("streak-milestone")) {
    try {
      const streak = await storage.getUserStreak(userId);
      gathered.push(...noticeStreak(streak));
      sources.push("user_streaks");
    } catch (err) {
      console.error("[NTC] streak unavailable:", err);
    }
  }

  // 4. Plant diversity — read from the existing household owner
  //    (`assembleNutritionCentre`), never recounted here. Plant diversity is a CONTESTED
  //    domain (ARCHITECTURE_PRINCIPLES.md); a second count computed in this module would
  //    be another owner and would move convergence backwards.
  if (wanted("diversity-milestone")) {
    try {
      const householdId = await getHouseholdForUser(userId);
      if (householdId != null) {
        const centre = await assembleNutritionCentre(householdId);
        // `overview` is null for a household with no planner history — that owner's own
        // honest gap. A gap is silence here, never a fabricated `plantDiversity: 0`.
        if (centre.available && centre.overview) {
          gathered.push(...noticeDiversity(centre.overview.plantDiversity));
          sources.push("nutrition-centre");
        }
      }
    } catch (err) {
      console.error("[NTC] nutrition centre unavailable:", err);
    }
  }

  // 5. NTC-P2 — the four HOUSEHOLD-HISTORY facts, from ONE derivation.
  //
  //    `deriveHouseholdCompanionFields` is the single owner of these four headlines: it
  //    calls `stories()`, `seasonalStories()` and `discover()` and reads the first card of
  //    each already-ordered section. It scores nothing and sorts nothing.
  //
  //    THIS IS WHERE THE DUPLICATE DIED. Before NTC-P2 the seasonal headline was derived
  //    in TWO places by the same rule — once here (in the notices route's own inline
  //    block) and once in `household-companion-fields.ts` for the Home and Planner routes
  //    — which is exactly the duplication Architecture §7.2 recorded: the bypasses
  //    "re-surface the same seasonal headline the Notice Engine would." There is now one
  //    derivation, one owner, and one seasonal notice, and every surface reads it from
  //    here.
  const historyCategories: NoticeCategory[] = [
    "celebration",
    "seasonal-highlight",
    "food-discovery",
    "household-insight",
  ];
  if (wanted(...historyCategories)) {
    try {
      const history = await buildHouseholdHistory(userId);
      const fields = deriveHouseholdCompanionFields(history);

      // Gathered in the order the narrative surfaces have always rendered them. All four
      // are `low` priority, so `orderByAttention` is a stable sort over them and this
      // order decides which two survive the cap — deterministically, with no clock and no
      // randomness (Silence Rule 6). Each is dropped silently if this surface is not its
      // mouth, or if its owner had nothing to say.
      if (wants.has("celebration")) {
        gathered.push(...noticeCelebration(fields.celebration?.headline ?? null));
      }
      if (wants.has("seasonal-highlight")) {
        gathered.push(...noticeSeasonal(fields.seasonalHighlight?.headline ?? null));
      }
      if (wants.has("food-discovery")) {
        gathered.push(...noticeFoodDiscovery(fields.opportunity?.text ?? null));
      }
      if (wants.has("household-insight")) {
        gathered.push(...noticeHouseholdInsight(fields.householdInsight?.headline ?? null));
      }
      sources.push("household-stories");
    } catch (err) {
      console.error("[NTC] household history unavailable:", err);
    }
  }

  // 6. What the household has CONFIRMED about itself (NTC-P4).
  //
  //    CONFIRMED signals only. A `pending_confirmation` signal is a QUESTION for the
  //    household — it belongs on the Profile's learning panel, where it can be answered —
  //    never a notice. THA does not tell a household what it has learned about them until
  //    they have agreed it is true. (`noticeLearning` enforces this structurally too, so a
  //    caller passing the wrong query cannot announce an unconfirmed preference.)
  if (wanted("household-learning")) {
    try {
      const outcome = await intelligencePlatform.handle(
        { capabilityId: "evidence-learning", verb: "search", parameters: { status: "confirmed" } },
        intelligencePlatform.contextFor(user),
      );
      if (outcome.status === "ok") {
        const signals =
          (outcome.result as { signals?: readonly ConfirmedLearningLike[] } | null | undefined)
            ?.signals ?? [];
        gathered.push(...noticeLearning(signals));
        sources.push("household-learning");
      }
    } catch (err) {
      console.error("[NTC] evidence-learning unavailable:", err);
    }
  }

  // THE ATTENTION BUDGET. The Silence Rules are the only place order and volume are
  // decided, and this module does not touch their output afterwards.
  const notices = applySilenceRules(gathered);

  // THE VOICE SEAM. Voicing happens AFTER selection, never before: the Behaviour Engine
  // may change how a notice SOUNDS; it may never change which one is shown, nor what it
  // says is true (CPA1 §0).
  const personalityId = resolveBehaviour(
    (await storage.getUserPreferences(userId))?.companionPersonality ?? null,
  ).personalityId;

  const voiced: VoicedNotice[] = notices.map((notice) => ({
    ...notice,
    text: phraseNotice(notice, personalityId),
  }));

  return {
    notices: voiced,
    trust: {
      sources,
      gatheredCount: gathered.length,
      cap: MAX_NOTICES_PER_MOMENT,
      personalityId,
    },
  };
}

/**
 * NTC-P2 — project a governed bundle into the `{ celebration, seasonalHighlight,
 * opportunity, householdInsight }` shape the Home Intelligence Companion and the Planner
 * Intelligence Strip already render.
 *
 * The architecture permits precisely this: "Existing UI contracts may keep their response
 * shapes as thin projections; what converges is the SOURCE and GOVERNANCE, not the
 * pixels" (§8, NTC-P2). Both clients keep their markup; what changed is that each field
 * now arrives having passed the Silence Rules and the voice seam.
 *
 * A field is `null` when its owner had nothing to say OR when the attention budget
 * declined it. Both are honest silence, and the caller reports `gatheredCount` against
 * `cap` so the two remain distinguishable to anyone auditing.
 *
 * `text` — the VOICED sentence — is what every field carries, not the raw headline. That
 * is the point of converging: these four facts previously reached households having never
 * met the one voice every other Companion output passes through.
 */
export function projectHouseholdFields(bundle: VoicedNoticeBundle): {
  celebration: { headline: string } | null;
  seasonalHighlight: { headline: string } | null;
  opportunity: { text: string } | null;
  householdInsight: { headline: string } | null;
} {
  const find = (category: NoticeCategory): VoicedNotice | undefined =>
    bundle.notices.find((n) => n.category === category);

  const celebration = find("celebration");
  const seasonal = find("seasonal-highlight");
  const discovery = find("food-discovery");
  const insight = find("household-insight");

  return {
    celebration: celebration ? { headline: celebration.text } : null,
    seasonalHighlight: seasonal ? { headline: seasonal.text } : null,
    opportunity: discovery ? { text: discovery.text } : null,
    householdInsight: insight ? { headline: insight.text } : null,
  };
}
