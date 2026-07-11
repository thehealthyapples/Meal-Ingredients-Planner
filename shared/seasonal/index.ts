// WS11 — Seasonal Stories Engine: public surface.
//
// The single entry point is `seasonalStories()`. It GENERATES a season's story
// at read time by composing WS10 Stories and WS8 Discovery — nothing is stored.
// See docs/investigations/knowledge/WS11_SEASONAL_STORIES_ENGINE.md.

export { seasonalStories, formatSeasonalStory } from "./engine";
export {
  BANNED_TERMS,
  SEASONAL_EXTRA_BANNED,
  validateText,
  isTextTrustworthy,
  assertTrustworthy,
} from "./trust";
export {
  BLOCK_TITLES,
} from "./types";
export type {
  SeasonalBlockType,
  UKSeason,
  SeasonRef,
  SeasonWindow,
  SeasonalStoriesRequest,
  SeasonalBlock,
  SeasonalStory,
} from "./types";
