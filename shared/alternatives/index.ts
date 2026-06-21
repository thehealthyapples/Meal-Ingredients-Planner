// WS9 — Food Alternatives Engine: public surface.
//
// The single entry point is `alternatives()`. Everything else is supporting type
// or curated seed data. See docs/investigations/WS9_ALTERNATIVES_ENGINE.md.

export { alternatives, formatAlternatives } from "./engine";
export {
  BANNED_TERMS,
  ALTERNATIVES_EXTRA_BANNED,
  validateReason,
  isReasonTrustworthy,
  assertTrustworthy,
} from "./trust";
export {
  ALTERNATIVES_SEED,
  resolveAnchorKey,
  anchorKeys,
} from "./alternatives-map";
export type {
  AlternativeType,
  Diet,
  AlternativeOption,
  AlternativeSection,
  Eater,
  HouseholdContext,
  AlternativeContext,
  AlternativeRequest,
  HouseholdAdaptationMember,
  HouseholdAdaptation,
  AlternativesResult,
} from "./types";
