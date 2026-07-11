-- KNOW5 — Composition Evidence Contract + reviewer identity.
--
-- Additive and reversible. Adds nullable evidence columns to the composition
-- edge (knowledge_food_nutrients), which before KNOW5 carried no evidence
-- contract at all despite being the load-bearing premise of every benefit chip.
--
-- NO BACKFILL, DELIBERATELY. A NULL reviewed_at means "not reviewed", which is
-- the truth for every pre-KNOW5 row: none was ever reviewed. Backfilling a
-- sign-off would fabricate exactly the human review this workstream exists to
-- require. The visible consequence is that benefit chips go dark until a human
-- signs off the composition claims — that is the point, not a regression.
--
-- reviewed_by is added to all three claim tables. Rows signed off before KNOW5
-- keep a NULL reviewed_by; they are not retroactively invalidated, but the
-- sign-off gate refuses to create a new anonymous one.
--
-- Rollback:
--   ALTER TABLE knowledge_food_nutrients
--     DROP COLUMN IF EXISTS source_refs,
--     DROP COLUMN IF EXISTS reviewed_at,
--     DROP COLUMN IF EXISTS reviewed_by;
--   ALTER TABLE knowledge_food_benefits     DROP COLUMN IF EXISTS reviewed_by;
--   ALTER TABLE knowledge_nutrient_benefits DROP COLUMN IF EXISTS reviewed_by;

ALTER TABLE "knowledge_food_nutrients"
  ADD COLUMN IF NOT EXISTS "source_refs" jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "reviewed_by" text;

ALTER TABLE "knowledge_food_benefits"
  ADD COLUMN IF NOT EXISTS "reviewed_by" text;

ALTER TABLE "knowledge_nutrient_benefits"
  ADD COLUMN IF NOT EXISTS "reviewed_by" text;
