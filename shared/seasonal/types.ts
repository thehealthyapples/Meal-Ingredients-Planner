// WS11 — Seasonal Stories Engine: public types.
//
// Seasonal Stories answer ONE question: "What did this season of food mean?"
// They help a household look back on a season together — warm, reflective,
// celebratory, grounded in evidence.
//
// They are NOT achievements, NOT scorecards, NOT yearly reviews, NOT
// competitions, NOT nutrition reports. A Seasonal Story is a MEMORY, never a
// report card. See docs/investigations/WS11_SEASONAL_STORIES_ENGINE.md.
//
// IMPORTANT — nothing here is stored. A Seasonal Story is GENERATED at read
// time from the household's history by orchestrating WS10 Stories (memory) and
// WS8 Discovery (looking ahead). The only persisted data is the existing meal
// history. No season summaries, no favourite moments, no seasonal reports are
// ever written. Reads existing data: YES. Writes new data: NO.
//
// WS11 sits one layer ABOVE WS10. Where WS10 asks "what has our household
// enjoyed?", WS11 frames that recognition inside a single season and adds a
// gentle forward glance ("looking ahead to summer…"). It reuses WS10 and WS8
// verbatim — it never re-derives favourite/discovery/habit logic.

import type {
  HouseholdHistory,
  StoryCard,
  UKSeason,
} from "../stories/types";

export type { UKSeason } from "../stories/types";

/** The five — and only five — seasonal story blocks WS11 implements. */
export type SeasonalBlockType =
  | "season_summary" // 1. You cooked 62 meals together. You explored 14 foods.
  | "discoveries" // 2. This spring you discovered artichokes, fennel… (WS10)
  | "favourite_moments" // 3. Tomatoes became a favourite. Friday became pizza. (WS10)
  | "seasonal_habits" // 4. Summer became: Tomatoes, Basil, Courgettes.        (WS10)
  | "looking_ahead"; // 5. Looking ahead to summer: peaches, heirloom tomatoes (WS8)

/**
 * Identifies one season in one year. Winter is labelled by the year of its
 * Jan/Feb months (so "Winter 2027" spans Dec 2026 – Feb 2027) — the common
 * convention, and the one a household intuitively means by "last winter".
 */
export interface SeasonRef {
  season: UKSeason;
  year: number;
}

/** A concrete date window for a season (inclusive of both ends). */
export interface SeasonWindow {
  start: Date;
  end: Date;
  /** Human label — "Spring 2027". */
  label: string;
}

// ── Request ───────────────────────────────────────────────────────────────────

export interface SeasonalStoriesRequest {
  /**
   * The household's meal history — the SAME in-memory shape WS10 consumes,
   * assembled by the route layer from planner_entries / food_diary_entries.
   * The engine is pure: it never touches the DB and never writes.
   */
  household: HouseholdHistory;
  /**
   * Which season to look back on. Default: the season containing `now`.
   * (A household opening "this season's story" mid-summer gets summer.)
   */
  season?: SeasonRef;
  /**
   * Foods the household already enjoys — passed straight to WS8 Discovery for
   * the Looking Ahead block (familiarity ranking only, never judgement).
   * Merged with the season's most-cooked-with foods so the forward glance
   * leans toward what this kitchen actually reaches for.
   */
  enjoys?: string[];
  /** Restrict to specific blocks. Default: all five. */
  blocks?: SeasonalBlockType[];
  /** Reference date (season defaulting + WS10 recency). Default: new Date(). */
  now?: Date;
  /** Max cards per block. Default: 5. */
  limitPerBlock?: number;
}

// ── Result ────────────────────────────────────────────────────────────────────

/**
 * One block of a seasonal story. Cards reuse the WS10 StoryCard shape so a
 * renderer that already speaks "headline + facts" needs no new vocabulary.
 * Empty blocks are NEVER emitted — sparse history stays silent rather than
 * padding the season with a thin, untrue memory.
 */
export interface SeasonalBlock {
  type: SeasonalBlockType;
  /** Warm, observational heading. Never a verdict, never a grade. */
  title: string;
  cards: StoryCard[];
}

/**
 * A complete seasonal story — generated, never stored. If the household barely
 * cooked this season, `blocks` may be empty: that is honest, not a failure.
 */
export interface SeasonalStory {
  season: UKSeason;
  year: number;
  /** "Spring 2027" — the season's name. */
  label: string;
  /** The date window the story was generated for. */
  window: SeasonWindow;
  /** Non-empty blocks only, in canonical block order. */
  blocks: SeasonalBlock[];
}

// ── Block titles ────────────────────────────────────────────────────────────

/**
 * Warm, observational headings. "You", "your" — the household's own season,
 * recalled by a kind friend, never a system reporting on them.
 */
export const BLOCK_TITLES: Record<SeasonalBlockType, string> = {
  season_summary: "Your season together",
  discoveries: "What you discovered",
  favourite_moments: "Favourite moments",
  seasonal_habits: "The shape of the season",
  looking_ahead: "Looking ahead",
};
