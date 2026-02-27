/**
 * Seed script: Family Plan Template
 * ==================================
 * Reads seed/family-plan.json and upserts the plan into the
 * meal_plan_templates / meal_plan_template_items tables.
 *
 * Resolution order per dinner slot:
 *   a) mealId present  → direct lookup by primary key
 *   b) sourceUrl present → lookup by source_url (newest wins on collision)
 *   c) title present   → case-insensitive name match (newest wins on collision)
 *
 * Run locally:
 *   npm run seed:family-plan
 *
 * Run on Render (one-off):
 *   Open Render dashboard → your service → Shell → run:
 *   npm run seed:family-plan
 */

import * as fs from "fs";
import * as path from "path";
import { pool } from "../server/db";
import { storage } from "../server/storage";
import { runMigrations } from "../server/migrations/runner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DinnerEntry {
  mealId?: number;
  sourceUrl?: string;
  title?: string;
}

interface DayPlan {
  dayOfWeek: number;
  dinner?: DinnerEntry;
}

interface WeekPlan {
  weekNumber: number;
  days: DayPlan[];
}

interface FamilyPlan {
  name: string;
  description: string;
  isDefault: boolean;
  weeks: WeekPlan[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const log  = (msg: string) => console.log(`[FamilyPlanSeed] ${msg}`);
const warn = (msg: string) => console.warn(`[FamilyPlanSeed] ⚠  ${msg}`);

async function resolveMealId(
  entry: DinnerEntry,
  slot: string
): Promise<number | null> {
  // a) Direct mealId
  if (entry.mealId !== undefined) {
    const { rows } = await pool.query<{ id: number }>(
      "SELECT id FROM meals WHERE id = $1 LIMIT 1",
      [entry.mealId]
    );
    if (rows.length > 0) return rows[0].id;
    warn(`${slot}: mealId=${entry.mealId} not found — trying sourceUrl fallback`);
  }

  // b) sourceUrl match
  if (entry.sourceUrl) {
    const { rows } = await pool.query<{ id: number; name: string }>(
      "SELECT id, name FROM meals WHERE source_url = $1 ORDER BY id DESC",
      [entry.sourceUrl]
    );
    if (rows.length > 1) {
      warn(
        `${slot}: sourceUrl matched ${rows.length} meals: ` +
          rows.map(r => `"${r.name}" (id=${r.id})`).join(", ") +
          ` — using newest (id=${rows[0].id})`
      );
    }
    if (rows.length > 0) return rows[0].id;
    warn(`${slot}: sourceUrl="${entry.sourceUrl}" not found — trying title fallback`);
  }

  // c) Case-insensitive title match
  if (entry.title) {
    const { rows } = await pool.query<{ id: number; name: string }>(
      "SELECT id, name FROM meals WHERE lower(name) = lower($1) ORDER BY id DESC",
      [entry.title]
    );
    if (rows.length > 1) {
      warn(
        `${slot}: title "${entry.title}" matched ${rows.length} meals: ` +
          rows.map(r => `"${r.name}" (id=${r.id})`).join(", ") +
          ` — using newest (id=${rows[0].id})`
      );
    }
    if (rows.length > 0) return rows[0].id;
    warn(`${slot}: title "${entry.title}" — no match found, slot skipped`);
  }

  return null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Ensure migrations are up to date (idempotent)
  log("Running pending migrations…");
  const { newlyApplied } = await runMigrations();
  if (newlyApplied > 0) {
    log(`Applied ${newlyApplied} migration(s)`);
  } else {
    log("Migrations up to date");
  }

  // Load the JSON plan
  const jsonPath = path.resolve(process.cwd(), "seed/family-plan.json");
  if (!fs.existsSync(jsonPath)) {
    console.error(`[FamilyPlanSeed] ✗ JSON file not found at: ${jsonPath}`);
    process.exit(1);
  }
  const plan: FamilyPlan = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  log(`Loaded plan: "${plan.name}" (${plan.weeks.length} weeks)`);

  // Count total dinner slots in the JSON
  const totalSlots = plan.weeks.reduce(
    (acc, w) => acc + w.days.filter(d => d.dinner).length,
    0
  );

  // Resolve each dinner slot
  type TemplateItemInput = {
    weekNumber: number;
    dayOfWeek: number;
    mealSlot: "dinner";
    mealId: number;
  };
  const items: TemplateItemInput[] = [];
  let skipped = 0;

  for (const week of plan.weeks) {
    for (const day of week.days) {
      if (!day.dinner) continue;
      const slot = `W${week.weekNumber}D${day.dayOfWeek}`;
      const mealId = await resolveMealId(day.dinner, slot);
      if (mealId === null) {
        skipped++;
        continue;
      }
      items.push({
        weekNumber: week.weekNumber,
        dayOfWeek: day.dayOfWeek,
        mealSlot: "dinner",
        mealId,
      });
    }
  }

  log(`Resolved ${items.length} / ${totalSlots} dinner slots (${skipped} skipped)`);

  // Upsert the template
  const template = await storage.createOrUpdateTemplate(
    plan.name,
    plan.description,
    plan.isDefault
  );
  log(`Template upserted: "${template.name}" (id=${template.id}, isDefault=${template.isDefault})`);

  // Upsert items
  if (items.length > 0) {
    await storage.upsertTemplateItemsBulk(template.id, items);
    log(`Upserted ${items.length} dinner items`);
  }

  log("✓ Done");
}

main()
  .catch(err => {
    console.error("[FamilyPlanSeed] ✗ Fatal:", err);
    process.exit(1);
  })
  .finally(() => pool.end());
