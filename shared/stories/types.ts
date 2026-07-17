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

// CONV1 P5 / OWN-3: declared with its rule (Domain 11). Re-exported, not re-declared.
export type { UKSeason } from "../seasonal/season-rule";

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
  /**
   * When this entry occurred — or `null` when THA cannot honestly know.
   *
   * CONV1 P9 / BEH-5. This was `date: Date`, and it was NEVER a date. The route layer
   * fabricated it at request time from the planner's week NUMBER:
   *
   *     approxDate = now − (weeksAgo × 7 + max(0, 6 − dayOfWeek)) days
   *
   * which reduces to `reportedDay = (now.getDay() + dayOfWeek + 1) mod 7` — **the weekday
   * this engine reported was the day the household happened to open the app**, correct
   * only on a Saturday and only by coincidence. "Friday became curry night" was a fact
   * about the request, not about the household. All of Stories' arithmetic — the
   * 30/90/180/365 tiers, the 180-day favourite gate, the seasons — was arithmetic on
   * fiction (CONV1 BEH-5).
   *
   * **It is now the real date, or nothing.** A planner entry is dated only when its week
   * carries an anchor (`planner_weeks.weekStartDate`, CONV1 P7 / SCH-2): the entry's date
   * is that Monday plus the day's own offset. A week with no anchor has no dates and
   * never will — the anchor is written only at creation and never back-filled (HT7), so
   * for the households whose weeks predate it, `null` is permanent and true.
   *
   * **`null` is an ANSWER, and every date claim must respect it.** A story that reads a
   * date may only read a DATED entry (`isDated`), and an entry without one is not
   * evidence of *when* anything happened — only of *what* the household plans. That
   * distinction is why `date` is nullable rather than the undated entries being dropped:
   * food identity survives without a calendar (`discover()` needs no date at all), and
   * dropping them would have silenced discovery to fix a defect it never had.
   *
   * A diary entry (`source: "logged"`) is always dated — `food_diary_days.date` is a real
   * civil date the household authored.
   */
  date: Date | null;
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

/**
 * A meal entry THA can honestly place on a calendar.
 *
 * CONV1 P9 / BEH-5. The whole of the fabrication's retirement is this distinction: an
 * entry either has a real date or it has none, and only the first kind may support a
 * claim about WHEN. Narrowing at the seam (rather than guarding at each of the fourteen
 * `.date` reads) is what makes it impossible to forget one.
 */
export type DatedMealEntry = MealEntry & { date: Date };

/**
 * The guard. `null` is not a missing value to be defaulted — it is THA saying it does not
 * know which day this was, which is the truth for every planner week created before the
 * anchor existed and never back-filled (HT7).
 */
export function isDated(entry: MealEntry): entry is DatedMealEntry {
  return entry.date != null;
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
