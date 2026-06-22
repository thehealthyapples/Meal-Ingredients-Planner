// WS11 — Seasonal Stories Engine.
//
// Generates a season's story from a household's history by ORCHESTRATING the
// engines that already exist:
//   • WS10 Stories  (memory)        → Discoveries, Favourite Moments, Habits
//   • WS8  Discovery (looking ahead) → next season's foods at their UK peak
// plus ONE block WS11 owns: the Season Summary (how many meals, how many foods,
// what you cooked most with).
//
// Nothing is stored. The story is assembled at read time and returned. The only
// persisted data is the meal history the route layer hands in. There is no
// "season report" table, no cached favourite, no saved summary — by design, so
// a seasonal scorecard cannot quietly accrete.
//
// Design contract (inherited from WS10, sharpened for WS11):
//   • Count UP, never down — every number is an accumulation, never a shortfall.
//   • Memory, never report card — a season is recalled, never graded.
//   • Reuse, never re-derive — favourite/discovery/habit logic lives in WS10;
//     seasonal foods live in WS8. WS11 only frames and composes.
//   • Empty is silent — a barely-cooked season yields few or no blocks, never a
//     padded "you only…" consolation.
//   • Trust by non-computation — no ranking of seasons, no "best", no progress
//     metric is ever calculated, so none can leak into a future edit.
//
// API: seasonalStories(request) — one entry point, optional context bag. Same
// shape as discover(request) (WS8), alternatives(request) (WS9) and
// stories(request) (WS10). Absent season = the season of `now`; blocks narrows
// which of the five are generated. One endpoint can therefore power Pantry
// Explore, a Dashboard card, and a future Food Wrapped without redesign.

import { CANONICAL_SEED } from "../canonical/foods";
import { discover } from "../discovery/engine";
import { stories } from "../stories/engine";
import type { MealEntry, StoryCard, StoryFact, UKSeason } from "../stories/types";
import { isTextTrustworthy } from "./trust";
import {
  BLOCK_TITLES,
  type SeasonalBlock,
  type SeasonalBlockType,
  type SeasonalStoriesRequest,
  type SeasonalStory,
  type SeasonRef,
  type SeasonWindow,
} from "./types";

const DEFAULT_LIMIT = 5;

/**
 * Season Summary: minimum meal occasions before a summary is written. Below
 * this, the season stays silent rather than offering a thin "you cooked 2
 * meals" memory that reads as a deficit. RECOMMENDATION: 3 — the same "a
 * pattern, not a coincidence" threshold WS10 uses for traditions.
 */
const SUMMARY_MIN_MEALS = 3;

/** How many seasonal foods to surface in Looking Ahead. */
const LOOKING_AHEAD_LIMIT = 5;

/** How many of the season's top foods seed Looking Ahead's familiarity ranking. */
const SEASON_TOP_FOODS_SEED = 6;

// ── Canonical food index (slug + varieties → canonical parent) ─────────────────
//
// Mirrors WS10's index: all tomato varieties count toward "tomato" so a season's
// tomato love is one food explored, not four. Kept local to WS11 (WS10 does not
// export its index) — the cost is one small map, the benefit is no cross-engine
// private coupling.

let _foodIndex: Map<string, { slug: string; name: string }> | null = null;

function foodIndex(): Map<string, { slug: string; name: string }> {
  if (_foodIndex) return _foodIndex;
  const idx = new Map<string, { slug: string; name: string }>();
  for (const entry of CANONICAL_SEED) {
    const parent = { slug: entry.food.slug, name: entry.food.name };
    idx.set(entry.food.slug, parent);
    for (const v of entry.varieties ?? []) idx.set(v.slug, parent);
  }
  _foodIndex = idx;
  return idx;
}

function resolveCanonical(slug: string): { slug: string; name: string } {
  return foodIndex().get(slug) ?? { slug, name: slug };
}

// ── Season model ───────────────────────────────────────────────────────────────
//
// FIXED UK meteorological seasons (Spring = Mar–May, Summer = Jun–Aug,
// Autumn = Sep–Nov, Winter = Dec–Feb). This matches WS10's seasonOf and WS8's
// seasonForDate exactly — three engines, one season truth. Hemisphere/location
// awareness is deliberately deferred (see investigation §"Season Definitions"
// and SUGGESTION); the entire current food catalogue and seasonal seed are UK,
// so a Southern-hemisphere season model would point at the wrong produce anyway.

function seasonOf(date: Date): UKSeason {
  const m = date.getMonth() + 1;
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "autumn";
  return "winter";
}

const SEASON_LABEL: Record<UKSeason, string> = {
  spring: "Spring",
  summer: "Summer",
  autumn: "Autumn",
  winter: "Winter",
};

const SEASON_LOWER: Record<UKSeason, string> = {
  spring: "spring",
  summer: "summer",
  autumn: "autumn",
  winter: "winter",
};

/**
 * The season containing a date, with its label-year. Winter is labelled by its
 * Jan/Feb year, so December belongs to NEXT year's winter ("Winter 2027" begins
 * Dec 2026).
 */
function currentSeasonRef(now: Date): SeasonRef {
  const season = seasonOf(now);
  let year = now.getFullYear();
  if (season === "winter" && now.getMonth() === 11) year += 1;
  return { season, year };
}

/** The season that follows `ref` (the one Looking Ahead points at). */
function nextSeasonRef(ref: SeasonRef): SeasonRef {
  switch (ref.season) {
    case "spring":
      return { season: "summer", year: ref.year };
    case "summer":
      return { season: "autumn", year: ref.year };
    case "autumn":
      return { season: "winter", year: ref.year + 1 };
    case "winter":
      return { season: "spring", year: ref.year };
  }
}

/** The concrete, inclusive date window for a season+year. */
function windowFor(ref: SeasonRef): SeasonWindow {
  const { season, year } = ref;
  const label = `${SEASON_LABEL[season]} ${year}`;
  const lastMoment = (y: number, monthIndex0: number) =>
    new Date(y, monthIndex0 + 1, 0, 23, 59, 59, 999); // day 0 of next month = last day
  switch (season) {
    case "spring":
      return { start: new Date(year, 2, 1), end: lastMoment(year, 4), label };
    case "summer":
      return { start: new Date(year, 5, 1), end: lastMoment(year, 7), label };
    case "autumn":
      return { start: new Date(year, 8, 1), end: lastMoment(year, 10), label };
    case "winter":
      // Dec (year-1) through Feb (year)
      return { start: new Date(year - 1, 11, 1), end: lastMoment(year, 1), label };
  }
}

function inWindow(date: Date, w: SeasonWindow): boolean {
  return date >= w.start && date <= w.end;
}

// ── Card trust helper ──────────────────────────────────────────────────────────

/** Build a card, applying the WS11 trust gate. Returns null if unsafe. */
function makeCard(
  headline: string,
  facts: StoryFact[],
  slug?: string,
  name?: string,
): StoryCard | null {
  if (!isTextTrustworthy(headline)) return null;
  const cleanFacts = facts.filter((f) => isTextTrustworthy(f.text));
  return { headline, facts: cleanFacts, slug, name };
}

/** Drop any card (from a reused engine) that fails the seasonal trust gate. */
function filterTrust(cards: StoryCard[]): StoryCard[] {
  return cards.filter(
    (c) =>
      isTextTrustworthy(c.headline) &&
      c.facts.every((f) => isTextTrustworthy(f.text)),
  );
}

// ── Season aggregates (the one computation WS11 owns) ─────────────────────────

interface SeasonAggregate {
  /** Distinct meal occasions: (day + slot + meal name). */
  mealCount: number;
  /** Distinct canonical foods that appeared. */
  foodCount: number;
  /** Top canonical foods by appearances, most-frequent first. */
  topFoods: Array<{ slug: string; name: string; count: number }>;
}

function aggregateSeason(entries: MealEntry[]): SeasonAggregate {
  const occasions = new Set<string>();
  const canonical = new Map<string, { name: string; count: number }>();

  for (const e of entries) {
    const day = `${e.date.getFullYear()}-${e.date.getMonth()}-${e.date.getDate()}`;
    occasions.add(`${day}|${e.mealSlot ?? ""}|${e.mealName ?? ""}`);

    const { slug, name } = resolveCanonical(e.food);
    const existing = canonical.get(slug);
    if (existing) existing.count++;
    else canonical.set(slug, { name, count: 1 });
  }

  const topFoods = Array.from(canonical.entries())
    .map(([slug, v]) => ({ slug, name: v.name, count: v.count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return {
    mealCount: occasions.size,
    foodCount: canonical.size,
    topFoods,
  };
}

// ── Block 1: Season Summary (WS11-owned) ──────────────────────────────────────
//
// "You cooked 62 meals together. You explored 14 foods. You cooked most often
// with Tomatoes, Olive oil and Onions." Pure accumulation — every number counts
// UP. No averages, no targets, no comparison to other seasons. Stays silent
// below SUMMARY_MIN_MEALS.

function seasonSummary(
  agg: SeasonAggregate,
  season: UKSeason,
): SeasonalBlock | null {
  if (agg.mealCount < SUMMARY_MIN_MEALS) return null;

  const facts: StoryFact[] = [];
  if (agg.foodCount > 0) {
    facts.push({
      text: `You explored ${agg.foodCount} food${agg.foodCount !== 1 ? "s" : ""}.`,
    });
  }
  if (agg.topFoods.length >= 2) {
    const names = agg.topFoods.slice(0, 3).map((f) => f.name);
    const list =
      names.length === 3
        ? `${names[0]}, ${names[1]} and ${names[2]}`
        : names.join(" and ");
    facts.push({ text: `You cooked most often with ${list}.` });
  }

  const card = makeCard(
    `This ${SEASON_LOWER[season]} you cooked ${agg.mealCount} meal${agg.mealCount !== 1 ? "s" : ""} together.`,
    facts,
  );
  if (!card) return null;
  return { type: "season_summary", title: BLOCK_TITLES.season_summary, cards: [card] };
}

// ── Block 5: Looking Ahead (WS8 Discovery, next season) ───────────────────────
//
// The one block that faces FORWARD. It reuses WS8's seasonal discovery for the
// NEXT season, seeded with the foods this household cooked most this season so
// the suggestions lean familiar. Framed as invitation ("you may enjoy"), never
// instruction ("you should").

function lookingAhead(
  next: SeasonRef,
  seedEnjoys: string[],
  now: Date,
  limit: number,
): SeasonalBlock | null {
  const result = discover({
    household: { enjoys: seedEnjoys },
    season: next.season,
    types: ["seasonal"],
    now,
    limitPerType: limit,
  });
  const seasonal = result.sections.find((s) => s.type === "seasonal");
  if (!seasonal || seasonal.suggestions.length === 0) return null;

  const facts: StoryFact[] = seasonal.suggestions.map((s) => ({
    text: `${s.name} — ${s.reason}`,
  }));
  const card = makeCard(
    `Looking ahead to ${SEASON_LOWER[next.season]}, you may enjoy ${seasonal.suggestions
      .map((s) => s.name)
      .slice(0, 3)
      .join(", ")}.`,
    facts,
  );
  if (!card) return null;
  return { type: "looking_ahead", title: BLOCK_TITLES.looking_ahead, cards: [card] };
}

// ── Orchestrator ───────────────────────────────────────────────────────────────

const ALL_BLOCKS: SeasonalBlockType[] = [
  "season_summary",
  "discoveries",
  "favourite_moments",
  "seasonal_habits",
  "looking_ahead",
];

/**
 * The SINGLE public entry point. Generates a season's story at read time by
 * composing WS10 Stories and WS8 Discovery; nothing is persisted. Empty blocks
 * are omitted entirely (empty is silent). The caller chooses which blocks via
 * `blocks`; absent `season` defaults to the season containing `now`.
 */
export function seasonalStories(
  request: SeasonalStoriesRequest,
): SeasonalStory {
  const {
    household,
    now = new Date(),
    blocks = ALL_BLOCKS,
    enjoys = [],
    limitPerBlock = DEFAULT_LIMIT,
  } = request;

  const ref = request.season ?? currentSeasonRef(now);
  const window = windowFor(ref);
  const wanted = new Set(blocks);

  const seasonEntries = household.entries.filter((e) => inWindow(e.date, window));
  const agg = aggregateSeason(seasonEntries);

  const out: SeasonalBlock[] = [];
  const push = (block: SeasonalBlock | null) => {
    if (block && block.cards.length > 0) out.push(block);
  };

  // 1. Season Summary — WS11-owned aggregation over the season's entries.
  if (wanted.has("season_summary")) {
    push(seasonSummary(agg, ref.season));
  }

  // 2. Discoveries — WS10 discovery stories scoped to the season window. WS10
  //    keys discovery off FIRST appearance, so timeframe = the season is exactly
  //    "foods first met this season".
  if (wanted.has("discoveries")) {
    const r = stories({
      household,
      types: ["discovery"],
      timeframe: { start: window.start, end: window.end, label: `This ${SEASON_LOWER[ref.season]}` },
      now,
      limitPerType: limitPerBlock,
    });
    const cards = filterTrust(r.sections.find((s) => s.type === "discovery")?.cards ?? []);
    if (cards.length > 0) {
      push({ type: "discoveries", title: BLOCK_TITLES.discoveries, cards });
    }
  }

  // 3. Favourite Moments — WS10 favourites + traditions, computed over the
  //    season's own entries (now = season end) so a favourite is one that
  //    featured within THIS season, and a tradition is one that recurred in it.
  if (wanted.has("favourite_moments")) {
    const r = stories({
      household: { entries: seasonEntries },
      types: ["favourite_foods", "family_traditions"],
      now: window.end,
      limitPerType: limitPerBlock,
    });
    const cards = filterTrust(r.sections.flatMap((s) => s.cards));
    if (cards.length > 0) {
      push({ type: "favourite_moments", title: BLOCK_TITLES.favourite_moments, cards });
    }
  }

  // 4. Seasonal Habits — WS10 seasonal habits over the season's entries. Because
  //    every entry falls in one season, WS10 emits a single habit card for it.
  if (wanted.has("seasonal_habits")) {
    const r = stories({
      household: { entries: seasonEntries },
      types: ["seasonal_habits"],
      now: window.end,
      limitPerType: limitPerBlock,
    });
    const cards = filterTrust(r.sections.find((s) => s.type === "seasonal_habits")?.cards ?? []);
    if (cards.length > 0) {
      push({ type: "seasonal_habits", title: BLOCK_TITLES.seasonal_habits, cards });
    }
  }

  // 5. Looking Ahead — WS8 seasonal discovery for the NEXT season, seeded with
  //    the season's top foods + any explicit enjoys.
  if (wanted.has("looking_ahead")) {
    const seedEnjoys = Array.from(
      new Set([
        ...enjoys,
        ...agg.topFoods.slice(0, SEASON_TOP_FOODS_SEED).map((f) => f.slug),
      ]),
    );
    push(lookingAhead(nextSeasonRef(ref), seedEnjoys, now, LOOKING_AHEAD_LIMIT));
  }

  return {
    season: ref.season,
    year: ref.year,
    label: window.label,
    window,
    blocks: out,
  };
}

// ── Demo formatter (not for production rendering) ─────────────────────────────

export function formatSeasonalStory(story: SeasonalStory): string {
  const lines: string[] = [];
  lines.push(`\n══ ${story.label} ══`);
  if (story.blocks.length === 0) {
    lines.push("  (not enough of a season yet — staying silent rather than inventing)");
    return lines.join("\n");
  }
  for (const block of story.blocks) {
    lines.push(`\n${block.title}:`);
    for (const card of block.cards) {
      lines.push(`\n  ${card.headline}`);
      for (const fact of card.facts) lines.push(`    ${fact.text}`);
    }
  }
  return lines.join("\n");
}
