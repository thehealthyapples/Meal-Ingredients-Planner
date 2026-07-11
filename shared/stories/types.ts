// WS10 — Household Stories Engine: public types.
//
// Stories answer ONE question: "What is the story our household has built with
// food?" They face BACKWARD — recognising what happened, not prescribing what
// to do next. Stories are memory, not measurement.
//
// This is NOT Discovery (WS8) or Alternatives (WS9). Discovery asks "what else
// might I enjoy?"; Alternatives ask "what else could work here?"; Stories ask
// "what has our household enjoyed together?" The three lenses are deliberately
// separate — see docs/investigations/knowledge/WS10_HOUSEHOLD_STORIES_ENGINE.md.
//
// Stories are deliberately:
//   • NO rankings, NO scores, NO streaks, NO achievements
//   • NO deficits ("only X times", "fell short")
//   • NO comparisons to other households or to past-self-as-a-deficit
//   • NO judgement on what the household ate or didn't eat
//   • NO verdicts — only observations, only recognition
// Every story is a memory. The household should think: "Yes… I remember that."
//
// Trust model: planned/cooked/eaten gap (see investigation §2.3).
// planner_entries witness PLANNING, not eating. food_diary_entries witness
// LOGGING (adults only). Children have no diary. The verb vocabulary must
// match the evidence — "featured in your meals" (planned) is always safe;
// "ate" (logged) is only warranted when source is a confirmed diary entry.

/** The five — and only five — story types WS10 implements. */
export type StoryType =
  | "favourite_foods"   // 1. Tomatoes became a family favourite.
  | "discovery"         // 2. This spring you discovered artichokes.
  | "family_traditions" // 3. Friday became pizza night.
  | "seasonal_habits"   // 4. Summer became: Tomatoes, Basil, Courgettes.
  | "food_journey";     // 5. Chickpeas → butter beans → cannellini beans.

export type UKSeason = "spring" | "summer" | "autumn" | "winter";

/** Provenance of a meal entry — shapes the verbs used in story text. */
export type MealSource = "planned" | "logged";

/**
 * One food appearing in one meal, assembled by the route layer from
 * planner_entries or food_diary_entries. The engine is pure — it takes
 * in-memory history, never touches the DB directly.
 */
export interface MealEntry {
  /** Canonical slug — the resolution key for all food identity operations. */
  food: string;
  /** Display name for the food (e.g., "Tomato", "Cherry Tomato"). */
  foodName: string;
  /**
   * Optional: the meal this food appeared in ("Pizza", "Greek Salad").
   * Required for day-of-week tradition detection ("Friday became pizza night").
   */
  mealName?: string;
  /** When this entry occurred (createdAt on planner entry / date on diary day). */
  date: Date;
  /**
   * Slot the meal occupied. Optional — informs breakfast habit and seasonal
   * habit stories.
   */
  mealSlot?: "breakfast" | "lunch" | "dinner" | "snack";
  /**
   * Eater name for per-eater notes within household stories. Undefined = the
   * entry is household-level (not linked to a specific eater).
   * NOTE: children without accounts have no diary — their entries come ONLY
   * from planner_entry_eaters and source will always be "planned".
   */
  eater?: string;
  /**
   * Provenance: "planned" = from planner_entries; "logged" = from
   * food_diary_entries. Governs the verbs used in story text — "featured in
   * your meals" (planned) vs "enjoyed" (logged). Never claim eating when
   * only planning is evidenced.
   */
  source: MealSource;
}

/** The household's food history — in-memory, assembled by the route layer. */
export interface HouseholdHistory {
  entries: MealEntry[];
}

/** Optional date window to narrow a story to a specific period. */
export interface TimeWindow {
  start: Date;
  end: Date;
  /** Human-readable label ("this spring", "summer 2026"). */
  label?: string;
}

// ── Story output types ────────────────────────────────────────────────────────

/** A single observable fact supporting a story card. */
export interface StoryFact {
  /** Supporting detail ("27 times across Pasta sauce, Greek salad, Pizza"). */
  text: string;
}

/**
 * A single story card — one memory, one recognition.
 * The headline is the sentence a kind friend would say out loud.
 * Facts are supporting detail for a richer rendering.
 */
export interface StoryCard {
  /** The headline story sentence ("Tomatoes became a household favourite."). */
  headline: string;
  /** Supporting facts — bullet-point detail. */
  facts: StoryFact[];
  /** The focal food slug (if this card is about one specific food). */
  slug?: string;
  /** The focal food name (display). */
  name?: string;
}

/** A group of story cards of the same type. Empty sections are never emitted. */
export interface StorySection {
  type: StoryType;
  /** Invitational section heading — observation-tone, never verdict. */
  title: string;
  cards: StoryCard[];
}

/** The full result returned by stories(). Empty sections are omitted entirely. */
export interface StoriesResult {
  sections: StorySection[];
  /** The time window these stories were generated for (if one was supplied). */
  window?: TimeWindow;
}

// ── Request ───────────────────────────────────────────────────────────────────

export interface StoryRequest {
  /** The household's meal history, assembled by the route from DB tables. */
  household: HouseholdHistory;
  /**
   * Restrict to specific story types. Default: all five types.
   * An empty sections result is still possible if the history is sparse.
   */
  types?: StoryType[];
  /**
   * Optional date window — narrows Discovery and Seasonal Habits to a period
   * ("this spring", "summer 2026"). Absent = all-time lens.
   */
  timeframe?: TimeWindow;
  /**
   * Reference date for recency calculations (favourite detection, tradition
   * recency). Defaults to current date.
   */
  now?: Date;
  /** Maximum story cards per section. Default: 5. */
  limitPerType?: number;
}

// ── Section titles ────────────────────────────────────────────────────────────

/**
 * Invitational section headings. Observation-tone: noticing what happened,
 * never grading it. "your household", "your", "you" — the household's own story.
 */
export const SECTION_TITLES: Record<StoryType, string> = {
  favourite_foods: "Foods your household loves",
  discovery: "Foods your household has discovered",
  family_traditions: "Your household traditions",
  seasonal_habits: "Your seasonal habits",
  food_journey: "Your food journeys",
};
