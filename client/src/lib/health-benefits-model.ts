/**
 * health-benefits-model.ts
 * ========================
 * Shared display vocabulary for THA health-benefit surfaces.
 *
 * After M1 convergence, all food knowledge data is read from the WS0 Knowledge
 * Registry via /api/knowledge/* endpoints. This file retains only the
 * HEALTH_DISCLAIMER constant used by PlantDiversityReport, FoodReport, and
 * PantryKnowledgeHub.
 */

export const HEALTH_DISCLAIMER =
  "Health benefits and key nutrients are educational summaries, not medical advice.";
