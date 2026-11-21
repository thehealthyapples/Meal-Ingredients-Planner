-- Add relationship_label column to household_members table
-- 2026-11-21: Track household member relationships (spouse, child, etc.) for natural-language queries

ALTER TABLE household_members ADD COLUMN relationship_label text;

-- Create index for relationship lookups (useful for "what can't my wife eat?" queries)
CREATE INDEX household_members_relationship_idx ON household_members(household_id, relationship_label)
WHERE relationship_label IS NOT NULL;
