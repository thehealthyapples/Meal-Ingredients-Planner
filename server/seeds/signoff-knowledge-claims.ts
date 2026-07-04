/**
 * PKC Phase 0 — the human sign-off gate for sourced nutrition claims.
 *
 * Rule KC9 (PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md §5): automation
 * authors candidates, never publishes them. Seeding attaches citations
 * (source_refs) but leaves reviewed_at NULL, so nothing renders. THIS script
 * is the explicit confirmation step: a human reviews the printed claims and
 * their sources, then re-runs with the confirmation flag to set reviewed_at —
 * the moment the claims "light up" across every consuming surface.
 *
 * Usage:
 *   npm run knowledge:signoff                       # dry run — list claims awaiting review
 *   npm run knowledge:signoff -- --confirm REVIEWED # sign off all structurally valid claims
 *
 * Scope: knowledge_nutrient_benefits only. Food-level benefit chips derive
 * their right to render from these rows via the nutrient bridge — they carry
 * no independent sign-off.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import pg from "pg";
import * as schema from "@shared/schema";
import { validateSourceRef } from "@shared/knowledge/evidence";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function run() {
  const args = process.argv.slice(2);
  const confirmIdx = args.indexOf("--confirm");
  const confirming = confirmIdx !== -1 && args[confirmIdx + 1] === "REVIEWED";

  const pending = await db
    .select()
    .from(schema.knowledgeNutrientBenefits)
    .where(and(
      isNull(schema.knowledgeNutrientBenefits.reviewedAt),
      eq(schema.knowledgeNutrientBenefits.isActive, true),
      sql`jsonb_array_length(${schema.knowledgeNutrientBenefits.sourceRefs}) > 0`,
    ));

  if (pending.length === 0) {
    console.log("No sourced claims awaiting sign-off.");
    await pool.end();
    return;
  }

  console.log(`${pending.length} sourced claim(s) awaiting sign-off:\n`);
  const valid: number[] = [];
  for (const row of pending) {
    const problems = row.sourceRefs.flatMap((ref) => validateSourceRef(ref));
    const status = problems.length === 0 ? "OK " : "BAD";
    console.log(`  [${status}] ${row.nutrientSlug} → ${row.benefitSlug}  (${row.evidenceStrength})`);
    for (const ref of row.sourceRefs) {
      console.log(`         • ${ref.body}: ${ref.title}`);
      console.log(`           ${ref.url}  (link checked ${ref.lastReviewed})`);
    }
    if (problems.length > 0) {
      for (const p of problems) console.log(`         ✗ ${p}`);
    } else {
      valid.push(row.id);
    }
  }

  if (!confirming) {
    console.log(
      `\nDry run — nothing signed off. Review each claim against its source, then run:` +
        `\n  npm run knowledge:signoff -- --confirm REVIEWED`,
    );
    await pool.end();
    return;
  }

  if (valid.length === 0) {
    console.log("\nNo structurally valid claims to sign off.");
    await pool.end();
    return;
  }

  await db
    .update(schema.knowledgeNutrientBenefits)
    .set({ reviewedAt: new Date() })
    .where(inArray(schema.knowledgeNutrientBenefits.id, valid));
  console.log(`\nSigned off ${valid.length} claim(s) — reviewed_at set. These claims now render.`);

  await pool.end();
}

run().catch((err) => {
  console.error("Sign-off failed:", err);
  process.exit(1);
});
