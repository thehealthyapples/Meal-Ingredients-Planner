// WS10 — Household Stories Engine: public surface.
//
// The single entry point is `stories()`. Everything else is supporting type
// or curated seed data. See docs/investigations/knowledge/WS10_HOUSEHOLD_STORIES_ENGINE.md.

export { stories, formatStories } from "./engine";
export {
  BANNED_TERMS,
  STORIES_EXTRA_BANNED,
  validateText,
  isTextTrustworthy,
  assertTrustworthy,
} from "./trust";
export { JOURNEY_CLUSTERS, getClustersForFood } from "./journey-map";
export type {
  StoryType,
  UKSeason,
  MealSource,
  MealEntry,
  HouseholdHistory,
  TimeWindow,
  StoryRequest,
  StoryFact,
  StoryCard,
  StorySection,
  StoriesResult,
} from "./types";
