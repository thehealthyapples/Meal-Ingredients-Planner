-- M4.5 — Fermented Food Attribute
-- Adds the canonical fermented boolean to canonical_food.
-- Default: false (existing foods are not fermented unless explicitly set by the seed).
-- See: docs/investigations/knowledge/M4_5_FERMENTED_FOOD_ATTRIBUTE_IMPLEMENTATION.md
ALTER TABLE "canonical_food" ADD COLUMN "fermented" boolean DEFAULT false NOT NULL;
