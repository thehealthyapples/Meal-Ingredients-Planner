// WS8 — Food Discovery Engine: public surface.
//
// The single entry point is `discover()`. Everything else is supporting type or
// curated seed data. See docs/investigations/WS8_DISCOVERY_ENGINE.md.

export { discover, formatDiscovery } from "./engine";
export {
  BANNED_TERMS,
  validateReason,
  isReasonTrustworthy,
  assertTrustworthy,
} from "./trust";
export { CUISINE_SEED, getCuisine, getCuisinesForFood } from "./cuisine-map";
export { SEASON_SEED, seasonForDate } from "./seasonal-map";
export type {
  DiscoveryType,
  UKSeason,
  HouseholdContext,
  DiscoverRequest,
  DiscoverySuggestion,
  DiscoverySection,
  DiscoveryResult,
} from "./types";
