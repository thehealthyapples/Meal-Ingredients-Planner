/**
 * index.ts — DEVWORLD3 Development World (public API)
 * ===================================================
 * The single import surface the admin routes consume. The Development World is
 * DEV-only, READ-ONLY operational infrastructure: it displays the 50 households
 * DEVWORLD2 imported. It owns no write path — no seed, reset, or impersonation —
 * and never touches production (every entry point asserts the environment).
 */

export {
  developmentWorldAllowed,
  assertDevelopmentWorldAllowed,
  DEVELOPMENT_WORLD_VERSION,
  listDevelopmentWorldHouseholdStates,
  getDevelopmentWorldHouseholdDetail,
  developmentWorldValidation,
  type DevelopmentWorldHouseholdState,
  type DevelopmentWorldHouseholdDetail,
  type DwAuthoredStats,
} from "./world-reader.js";
