// WS10 — Household Stories Engine.
//
// Given a household's meal history (assembled from planner_entries and
// food_diary_entries by the route layer), generate stories — memories —
// across five types: Favourite Foods, Discovery, Family Traditions, Seasonal
// Habits, Food Journeys.
//
// Stories face BACKWARD — they recognise what happened. They do not prescribe
// what to do next (Discovery / Alternatives). They do not measure how well
// the household ate (Weekly Nutrition Report). They only say: "here is what
// your kitchen remembers."
//
// The design contract:
//   • Count up, never down — every number is an accumulation, never a shortfall.
//   • Observations, never verdicts — habits are noticed, not graded.
//   • Honest provenance — "featured in your meals" (planned) vs "your household
//     enjoyed" (logged). Never claim eating when only planning is evidenced.
//   • Empty is silent — sparse history gets no story, not a padded one.
//   • Trust by non-computation — deficit/comparison/gamification primitives
//     are NEVER implemented, so they cannot leak into future edits.
//
// API design rationale: stories(request) — one endpoint, optional context bag.
// This is the same shape as discover(request) (WS8) and alternatives(request)
// (WS9): absent context = all stories; timeframe narrows Discovery and Seasonal
// Habits; types narrows which story types are generated.
//
// Built on: canonical food identity (WS2E) for variety detection; the UK
// season model (months → spring/summer/autumn/winter). Does NOT traverse
// Layer 1 (the food–food graph) — that is WS8's domain.

import { CANONICAL_SEED } from "../canonical/foods";
import { isTextTrustworthy } from "./trust";
import { JOURNEY_CLUSTERS } from "./journey-map";
import {
  SECTION_TITLES,
  type MealEntry,
  type StoryCard,
  type StoryFact,
  type StoryRequest,
  type StorySection,
  type StoriesResult,
  type StoryType,
  type TimeWindow,
  type UKSeason,
} from "./types";

const DEFAULT_LIMIT = 5;

// ── Thresholds ─────────────────────────────────────────────────────────────────
// These are the FAVOURITE RULES and DISCOVERY RULES recommended after
// investigation (see §"Favourite Rules" and §"Discovery Rules" in the doc).

/** Favourite: minimum appearances to qualify. */
const FAVOURITE_MIN_COUNT = 3;
/** Favourite: maximum days since last appearance (recency gate). */
const FAVOURITE_MAX_DAYS = 180;

/**
 * Discovery: minimum uses before a food is considered "confirmed" (not a
 * one-off). RECOMMENDATION: 2 uses — first use = discovery happened; second
 * use = it wasn't a one-off, worth celebrating. Below 2 would surface every
 * single ingredient tried once, which is spam. Above 2 would miss genuine
 * discoveries the household repeated only twice (e.g., a seasonal food).
 */
const DISCOVERY_CONFIRM_COUNT = 2;

/**
 * Tradition: minimum occurrences of the same meal/food pattern to be named
 * a tradition. RECOMMENDATION: 3 — enough to be deliberate, not accidental.
 * 2 is a coincidence; 3 is a pattern.
 */
const TRADITION_MIN_COUNT = 3;
/** Tradition: fraction of total uses that must fall on the same day-of-week. */
const TRADITION_DAY_FRACTION = 0.5;

/** Go-to: rolling-window size in days for "regular go-to" detection. */
const GOTO_WINDOW_DAYS = 30;
/** Go-to: minimum uses within the rolling window to qualify. */
const GOTO_MIN_COUNT = 4;

/** Seasonal habits: minimum entries in a season to generate a habit card. */
const SEASON_MIN_ENTRIES = 5;

/** Journey: minimum confirmed cluster foods to generate a journey card. */
const JOURNEY_MIN_FOODS = 3;
/** Journey: minimum days spanning first to latest food (shows progression). */
const JOURNEY_MIN_SPAN_DAYS = 60;

// ── Canonical food index ──────────────────────────────────────────────────────

/**
 * Maps every slug (canonical + varieties) to its canonical parent's
 * { slug, name }. Used for grouping variety uses under their parent food,
 * and for sourcing the correct canonical display name.
 */
let _foodIndex: Map<string, { slug: string; name: string }> | null = null;

function foodIndex(): Map<string, { slug: string; name: string }> {
  if (_foodIndex) return _foodIndex;
  const idx = new Map<string, { slug: string; name: string }>();
  for (const entry of CANONICAL_SEED) {
    const parent = { slug: entry.food.slug, name: entry.food.name };
    idx.set(entry.food.slug, parent);
    for (const v of entry.varieties ?? []) {
      idx.set(v.slug, parent);
    }
  }
  _foodIndex = idx;
  return idx;
}

/** Resolve a slug to its canonical parent. Returns the slug itself as fallback. */
function resolveCanonical(slug: string): { slug: string; name: string } {
  return foodIndex().get(slug) ?? { slug, name: slug };
}

// ── Shared utilities ──────────────────────────────────────────────────────────

function daysBetween(a: Date, b: Date): number {
  return Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * Recency multiplier applied to raw counts to weight recent engagement
 * over historical frequency. A food used once last week ranks above a food
 * used twenty times two years ago.
 */
function recencyFactor(lastSeen: Date, now: Date): number {
  const d = daysBetween(lastSeen, now);
  if (d <= 30) return 1.0;
  if (d <= 90) return 0.75;
  if (d <= 180) return 0.5;
  if (d <= 365) return 0.25;
  return 0.1;
}

function seasonOf(date: Date): UKSeason {
  const m = date.getMonth() + 1;
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "autumn";
  return "winter";
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatSeason(date: Date): string {
  return `${seasonOf(date)} ${date.getFullYear()}`;
}

/** Build a StoryCard, applying the trust gate. Returns null if headline is unsafe. */
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

// ── 1. Favourite Foods ─────────────────────────────────────────────────────────
//
// FAVOURITE RULES — recommendation:
//   A favourite is a food with ≥ 3 appearances AND last seen within 180 days,
//   sorted by recency-weighted frequency.
//
// Rationale: 3 appearances = a deliberate choice, not coincidence. 180 days =
// still current, not a stale memory. Recency weighting = the favourite you
// love NOW, not the one you ate most 3 years ago. Variety slugs are resolved
// to their canonical (cherry-tomato → tomato) so a household's tomato love
// is counted as one story, not fragmented across 4 entries.

function favouriteFoods(
  entries: MealEntry[],
  now: Date,
  limit: number,
): StorySection | null {
  // Group by canonical slug — all tomato varieties count toward "tomato".
  const byCanonical = new Map<
    string,
    { name: string; entries: MealEntry[]; meals: Set<string> }
  >();

  for (const e of entries) {
    const { slug, name } = resolveCanonical(e.food);
    const existing = byCanonical.get(slug);
    if (existing) {
      existing.entries.push(e);
      if (e.mealName) existing.meals.add(e.mealName);
    } else {
      const meals = new Set<string>();
      if (e.mealName) meals.add(e.mealName);
      byCanonical.set(slug, { name, entries: [e], meals });
    }
  }

  const candidates: Array<{
    slug: string;
    name: string;
    count: number;
    lastSeen: Date;
    score: number;
    meals: string[];
  }> = [];

  for (const [slug, { name, entries: food, meals }] of Array.from(byCanonical)) {
    const count = food.length;
    if (count < FAVOURITE_MIN_COUNT) continue;
    const lastSeen = new Date(Math.max(...food.map((e) => e.date.getTime())));
    if (daysBetween(lastSeen, now) > FAVOURITE_MAX_DAYS) continue;
    const score = count * recencyFactor(lastSeen, now);
    candidates.push({ slug, name, count, lastSeen, score, meals: Array.from(meals) });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);

  const cards: StoryCard[] = [];
  for (const c of candidates.slice(0, limit)) {
    const headline =
      c.count >= 10
        ? `${c.name} became a household favourite.`
        : c.count >= 5
          ? `${c.name} quietly appeared in more and more meals.`
          : `${c.name} featured regularly in your household.`;

    const facts: StoryFact[] = [
      {
        text: `${c.name} featured in ${c.count} meal${c.count !== 1 ? "s" : ""}.`,
      },
    ];
    if (c.meals.length >= 2) {
      facts.push({ text: `Across: ${c.meals.slice(0, 4).join(", ")}.` });
    }

    const card = makeCard(headline, facts, c.slug, c.name);
    if (card) cards.push(card);
  }

  if (cards.length === 0) return null;
  return {
    type: "favourite_foods",
    title: SECTION_TITLES.favourite_foods,
    cards,
  };
}

// ── 2. Discovery Stories ───────────────────────────────────────────────────────
//
// DISCOVERY RULES — recommendation:
//   A food is discovered on its first appearance. It becomes a confirmed
//   discovery (surfaced in a story) after ≥ 2 total uses.
//
// Rationale: First use = discovery happened. Second use = not a one-off,
// worth celebrating. Surfacing every single first use would be overwhelming;
// requiring 3+ would miss genuine discoveries repeated only twice.
//
// Variety exploration: group slugs by canonical parent. When ≥ 2 distinct
// slugs share the same canonical (e.g., tomato + cherry-tomato), surface a
// "you explored N varieties" card.

function discoveryStories(
  entries: MealEntry[],
  timeframe: TimeWindow | undefined,
  limit: number,
): StorySection | null {
  // Per-slug stats across the full history
  const bySlug = new Map<
    string,
    { name: string; firstSeen: Date; totalCount: number }
  >();
  for (const e of entries) {
    const existing = bySlug.get(e.food);
    if (!existing) {
      bySlug.set(e.food, { name: e.foodName, firstSeen: e.date, totalCount: 1 });
    } else {
      if (e.date < existing.firstSeen) existing.firstSeen = e.date;
      existing.totalCount++;
    }
  }

  const cards: StoryCard[] = [];

  // 2a. New foods (confirmed discoveries, optionally filtered by timeframe)
  const discovered = Array.from(bySlug.entries())
    .filter(([, v]) => {
      if (v.totalCount < DISCOVERY_CONFIRM_COUNT) return false;
      if (timeframe) {
        return v.firstSeen >= timeframe.start && v.firstSeen <= timeframe.end;
      }
      return true;
    })
    .sort(([, a], [, b]) => a.firstSeen.getTime() - b.firstSeen.getTime());

  if (discovered.length >= 3) {
    const intro = timeframe?.label
      ? `${timeframe.label} your household discovered:`
      : "Your household discovered:";
    const names = discovered
      .slice(0, 5)
      .map(([, v]) => v.name)
      .join(", ");
    const card = makeCard(
      `${intro} ${names}.`,
      discovered.slice(0, 5).map(([, v]) => ({
        text: `• ${v.name} — first ${timeframe ? "tried this period" : `tried ${formatSeason(v.firstSeen)}`}.`,
      })),
    );
    if (card) cards.push(card);
  } else {
    for (const [slug, v] of discovered.slice(0, limit)) {
      const card = makeCard(
        `${v.name} made its way into your kitchen.`,
        [
          {
            text: `First tried ${formatSeason(v.firstSeen)}, and featured ${v.totalCount} time${v.totalCount !== 1 ? "s" : ""}.`,
          },
        ],
        slug,
        v.name,
      );
      if (card) cards.push(card);
    }
  }

  // 2b. Variety exploration: group all used slugs by canonical parent.
  // When ≥ 2 distinct slugs map to the same canonical, surface a variety card.
  const byCanonical = new Map<
    string,
    Array<{ slug: string; name: string; firstSeen: Date }>
  >();
  for (const [slug, v] of Array.from(bySlug)) {
    const { slug: cSlug } = resolveCanonical(slug);
    const group = byCanonical.get(cSlug) ?? [];
    group.push({ slug, name: v.name, firstSeen: v.firstSeen });
    byCanonical.set(cSlug, group);
  }

  for (const [canonicalSlug, items] of Array.from(byCanonical)) {
    // Need at least 2 distinct slugs (one of which must be a variety, not the canonical)
    const hasVariety = items.some((i) => i.slug !== canonicalSlug);
    if (!hasVariety || items.length < 2) continue;

    const canonicalEntry = CANONICAL_SEED.find(
      (e) => e.food.slug === canonicalSlug,
    );
    const canonicalName = canonicalEntry?.food.name ?? canonicalSlug;

    const sorted = [...items].sort(
      (a, b) => a.firstSeen.getTime() - b.firstSeen.getTime(),
    );
    const varietyNames = items.map((i) => i.name).join(", ");

    const card = makeCard(
      `Your household explored ${items.length} ${canonicalName.toLowerCase()} varieties.`,
      [
        { text: `Varieties: ${varietyNames}.` },
        {
          text: `First variety tried ${formatSeason(sorted[0].firstSeen)}.`,
        },
      ],
      canonicalSlug,
      canonicalName,
    );
    if (card) cards.push(card);
  }

  if (cards.length === 0) return null;
  return {
    type: "discovery",
    title: SECTION_TITLES.discovery,
    cards: cards.slice(0, limit),
  };
}

// ── 3. Family Traditions ───────────────────────────────────────────────────────
//
// TRADITION RULES — recommendation:
//   A tradition is a pattern that recurs ≥ 3 times in the same context.
//   Two types:
//     (a) Day-of-week: a meal/food on the same weekday ≥ 3 times AND
//         ≥ 50% of all appearances fall on that day.
//     (b) Regular go-to: a food/meal appearing ≥ 4 times in any rolling
//         30-day window.
//
// Rationale: 3 = enough to be deliberate, not accidental. 50% concentration
// on one day prevents a Monday bias from naming every common food "Monday food".
// The 30-day / 4-uses go-to threshold catches "quick weekday curry" patterns
// without requiring day-of-week regularity.

function familyTraditions(
  entries: MealEntry[],
  limit: number,
): StorySection | null {
  const cards: StoryCard[] = [];
  const seen = new Set<string>();

  // Group by mealName (preferred) or foodName (fallback) for tradition detection
  const byPattern = new Map<
    string,
    Array<{
      slug: string;
      displayName: string;
      day: number;
      date: Date;
    }>
  >();

  for (const e of entries) {
    const key = e.mealName ?? e.foodName;
    const slug = e.food;
    const group = byPattern.get(key) ?? [];
    group.push({
      slug,
      displayName: e.mealName ?? e.foodName,
      day: e.date.getDay(),
      date: e.date,
    });
    byPattern.set(key, group);
  }

  // 3a. Day-of-week traditions
  for (const [patternName, group] of Array.from(byPattern)) {
    if (group.length < TRADITION_MIN_COUNT) continue;

    const dayCounts = new Array(7).fill(0) as number[];
    for (const e of group) dayCounts[e.day]++;
    const peakDay = dayCounts.indexOf(Math.max(...dayCounts));
    const peakCount = dayCounts[peakDay];

    if (
      peakCount >= TRADITION_MIN_COUNT &&
      peakCount / group.length >= TRADITION_DAY_FRACTION
    ) {
      const key = `day:${patternName}:${peakDay}`;
      if (!seen.has(key)) {
        seen.add(key);
        const card = makeCard(
          `${DAY_NAMES[peakDay]} became ${patternName.toLowerCase()} night.`,
          [
            {
              text: `${patternName} appeared on ${DAY_NAMES[peakDay]}s ${peakCount} time${peakCount !== 1 ? "s" : ""}.`,
            },
          ],
          group[0].slug,
          group[0].displayName,
        );
        if (card) cards.push(card);
      }
    }
  }

  // 3b. Regular go-to: rolling 30-day window.
  // Deduplicate by mealName to prevent multiple ingredients of the same meal
  // each generating a separate go-to card (e.g., tomato + olive oil in Greek Salad).
  const sortedEntries = [...entries].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
  const byFood = new Map<string, MealEntry[]>();
  for (const e of sortedEntries) {
    // Key by mealName when present — same-meal entries share one go-to slot
    const key = e.mealName ?? e.food;
    const g = byFood.get(key) ?? [];
    g.push(e);
    byFood.set(key, g);
  }

  for (const [key, foodEntries] of Array.from(byFood)) {
    const slug = foodEntries[0].food;
    const mealName = foodEntries.find((e) => e.mealName)?.mealName;
    const displayName = mealName ?? foodEntries[0].foodName;
    const goToKey = `goto:${key}`;
    if (seen.has(goToKey)) continue;

    // Find peak 30-day window count
    let peakCount = 0;
    for (const anchor of foodEntries) {
      const windowEnd = new Date(
        anchor.date.getTime() + GOTO_WINDOW_DAYS * 86_400_000,
      );
      const inWindow = foodEntries.filter(
        (e) => e.date >= anchor.date && e.date <= windowEnd,
      ).length;
      if (inWindow > peakCount) peakCount = inWindow;
    }

    if (peakCount >= GOTO_MIN_COUNT) {
      // Only generate if not already captured by a day-of-week tradition
      const alreadyDayTradition = cards.some((c) => c.slug === slug);
      if (alreadyDayTradition) continue;

      seen.add(goToKey);
      const weekdayCount = foodEntries.filter(
        (e) => e.date.getDay() >= 1 && e.date.getDay() <= 5,
      ).length;
      const isWeekday = weekdayCount / foodEntries.length >= 0.6;
      const label = isWeekday
        ? `${displayName} became your go-to weekday meal.`
        : `${displayName} became a household regular.`;

      const card = makeCard(
        label,
        [
          {
            text: `${displayName} featured ${foodEntries.length} time${foodEntries.length !== 1 ? "s" : ""}${isWeekday ? ", mostly on weekdays" : ""}.`,
          },
        ],
        slug,
        foodEntries[0].foodName,
      );
      if (card) cards.push(card);
    }
  }

  if (cards.length === 0) return null;
  return {
    type: "family_traditions",
    title: SECTION_TITLES.family_traditions,
    cards: cards.slice(0, limit),
  };
}

// ── 4. Seasonal Habits ─────────────────────────────────────────────────────────
//
// Only observed behaviour. A season with < 5 entries generates no habit card.
// Top 3 foods (by count) in each qualifying season are surfaced. Only the
// canonical food name is used (cherry-tomato → Tomato) to avoid fragmentation.

function seasonalHabits(entries: MealEntry[], limit: number): StorySection | null {
  const bySeason = new Map<UKSeason, MealEntry[]>();
  for (const e of entries) {
    const season = seasonOf(e.date);
    const g = bySeason.get(season) ?? [];
    g.push(e);
    bySeason.set(season, g);
  }

  const SEASON_ORDER: UKSeason[] = ["spring", "summer", "autumn", "winter"];
  const SEASON_VERB: Record<UKSeason, string> = {
    spring: "Spring became:",
    summer: "Summer became:",
    autumn: "Autumn brought:",
    winter: "Winter brought:",
  };

  const cards: StoryCard[] = [];

  for (const season of SEASON_ORDER) {
    const seasonEntries = bySeason.get(season) ?? [];
    if (seasonEntries.length < SEASON_MIN_ENTRIES) continue;

    // Group by canonical slug for counting
    const foodCounts = new Map<string, { name: string; count: number }>();
    for (const e of seasonEntries) {
      const { slug, name } = resolveCanonical(e.food);
      const existing = foodCounts.get(slug);
      if (existing) {
        existing.count++;
      } else {
        foodCounts.set(slug, { name, count: 1 });
      }
    }

    const topFoods = Array.from(foodCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    if (topFoods.length < 2) continue;

    const foodList = topFoods.map((f) => f.name).join(", ");
    const card = makeCard(
      `${SEASON_VERB[season]} ${foodList}.`,
      topFoods.map((f) => ({
        text: `• ${f.name} — featured ${f.count} time${f.count !== 1 ? "s" : ""} this ${season}.`,
      })),
    );
    if (card) cards.push(card);
  }

  if (cards.length === 0) return null;
  return {
    type: "seasonal_habits",
    title: SECTION_TITLES.seasonal_habits,
    cards: cards.slice(0, limit),
  };
}

// ── 5. Food Journeys ───────────────────────────────────────────────────────────
//
// A journey is generated ONLY IF the evidence exists:
//   • ≥ 3 confirmed foods from a cluster (each used ≥ 2 times)
//   • First and latest cluster food ≥ 60 days apart (progression, not coincidence)
// Never invented; never forward-looking.

function foodJourneys(entries: MealEntry[], limit: number): StorySection | null {
  const bySlug = new Map<
    string,
    { name: string; firstSeen: Date; count: number }
  >();
  for (const e of entries) {
    const existing = bySlug.get(e.food);
    if (!existing) {
      bySlug.set(e.food, { name: e.foodName, firstSeen: e.date, count: 1 });
    } else {
      if (e.date < existing.firstSeen) existing.firstSeen = e.date;
      existing.count++;
    }
  }

  const cards: StoryCard[] = [];

  for (const cluster of JOURNEY_CLUSTERS) {
    const tried = cluster.foods
      .filter((slug) => {
        const stats = bySlug.get(slug);
        return stats !== undefined && stats.count >= DISCOVERY_CONFIRM_COUNT;
      })
      .map((slug) => {
        const stats = bySlug.get(slug)!;
        return {
          slug,
          name: stats.name,
          firstSeen: stats.firstSeen,
          count: stats.count,
        };
      })
      .sort((a, b) => a.firstSeen.getTime() - b.firstSeen.getTime());

    if (tried.length < JOURNEY_MIN_FOODS) continue;

    const spanDays = daysBetween(
      tried[0].firstSeen,
      tried[tried.length - 1].firstSeen,
    );
    if (spanDays < JOURNEY_MIN_SPAN_DAYS) continue;

    const start = tried[0].name;
    const latest = tried[tried.length - 1].name;
    const midIndex = Math.floor(tried.length / 2);
    const middle = tried.length > 2 ? tried[midIndex].name : tried[1].name;

    const headline = cluster.template
      .replace("{start}", start)
      .replace("{middle}", middle)
      .replace("{latest}", latest);

    const allNames = tried.map((t) => t.name).join(", ");
    const facts: StoryFact[] = [
      {
        text: `Started with ${start} (${formatSeason(tried[0].firstSeen)}).`,
      },
      {
        text: `Explored ${tried.length} foods in this family: ${allNames}.`,
      },
    ];

    const card = makeCard(headline, facts);
    if (card) cards.push(card);
  }

  if (cards.length === 0) return null;
  return {
    type: "food_journey",
    title: SECTION_TITLES.food_journey,
    cards: cards.slice(0, limit),
  };
}

// ── Orchestrator ───────────────────────────────────────────────────────────────

const ALL_TYPES: StoryType[] = [
  "favourite_foods",
  "discovery",
  "family_traditions",
  "seasonal_habits",
  "food_journey",
];

/**
 * The SINGLE public entry point. One endpoint, all five story types — the
 * caller chooses which via `types`. Empty sections are omitted entirely
 * (empty is silent, never padded). Stories are generated at read time from
 * in-memory history; nothing is stored.
 *
 * API recommendation: stories(request) with an optional context bag mirrors
 * the WS8 and WS9 shapes. Absent context = all stories; timeframe and types
 * narrow the result. This allows a single endpoint to power Pantry Explore,
 * Food Reports, Seasonal Stories, and Food Wrapped without API redesign.
 */
export function stories(request: StoryRequest): StoriesResult {
  const {
    household,
    types = ALL_TYPES,
    timeframe,
    now = new Date(),
    limitPerType = DEFAULT_LIMIT,
  } = request;

  const { entries } = household;
  const wanted = new Set(types);
  const sections: StorySection[] = [];

  const push = (section: StorySection | null) => {
    if (section && section.cards.length > 0) sections.push(section);
  };

  if (wanted.has("favourite_foods")) {
    push(favouriteFoods(entries, now, limitPerType));
  }
  if (wanted.has("discovery")) {
    push(discoveryStories(entries, timeframe, limitPerType));
  }
  if (wanted.has("family_traditions")) {
    push(familyTraditions(entries, limitPerType));
  }
  if (wanted.has("seasonal_habits")) {
    push(seasonalHabits(entries, limitPerType));
  }
  if (wanted.has("food_journey")) {
    push(foodJourneys(entries, limitPerType));
  }

  return { sections, window: timeframe };
}

// ── Demo formatter (not for production rendering) ─────────────────────────────

export function formatStories(result: StoriesResult): string {
  const lines: string[] = [];
  const windowLabel = result.window?.label;
  lines.push(
    `\n══ ${windowLabel ? `Stories — ${windowLabel}` : "Household Stories"} ══`,
  );
  if (result.sections.length === 0) {
    lines.push(
      "  (not enough history yet — staying silent rather than inventing)",
    );
    return lines.join("\n");
  }
  for (const section of result.sections) {
    lines.push(`\n${section.title}:`);
    for (const card of section.cards) {
      lines.push(`\n  ${card.headline}`);
      for (const fact of card.facts) {
        lines.push(`    ${fact.text}`);
      }
    }
  }
  return lines.join("\n");
}
