/**
 * PKC Phase 0 / KNOW5 — the human sign-off gate for sourced nutrition claims.
 *
 * Rule KC9 (PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md §5): automation
 * authors candidates, never publishes them. Seeding attaches citations
 * (source_refs) but leaves reviewed_at NULL, so nothing renders. THIS script
 * is the explicit confirmation step: a human reviews the printed claims and
 * their sources, then re-runs with the confirmation flag to set reviewed_at —
 * the moment the claims "light up" across every consuming surface.
 *
 * Usage:
 *   npm run knowledge:signoff                                        # dry run
 *   npm run knowledge:signoff -- --confirm REVIEWED --reviewer "Ada L"
 *   npm run knowledge:signoff -- --edge composition --confirm REVIEWED --reviewer "Ada L"
 *
 * KNOW5 changes two things.
 *
 * 1. SCOPE. It now covers the COMPOSITION edge (knowledge_food_nutrients) as
 *    well as knowledge_nutrient_benefits. A food-level benefit chip requires
 *    both, so signing off only the second published a cited conclusion on an
 *    unreviewed premise — the defect KNOW5 exists to close.
 *
 * 2. REVIEWER IDENTITY. `--reviewer` is mandatory. An anonymous reviewed_at
 *    records that *someone* approved a health claim without recording who, so it
 *    can never be audited or withdrawn. Rows signed off before KNOW5 keep their
 *    NULL reviewed_by — they are not retroactively invalidated, and they are not
 *    re-signed here — but no new sign-off may be anonymous.
 *
 * STILL OUTSTANDING (KNOW5C, not this script): per-claim approve/reject with a
 * terminal `rejected` state and an audit row. This remains an approve-all-valid
 * gate over whatever is pending, which is honest at today's volume and becomes a
 * rubber stamp at import scale. It must be routed through the existing
 * knowledge_review_decisions state machine before any large import.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import pg from "pg";
import * as schema from "@shared/schema";
import { validateSourceRef, type KnowledgeSourceRef } from "@shared/knowledge/evidence";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

type Edge = "composition" | "nutrient-benefit";

interface PendingClaim {
  id: number;
  label: string;
  sourceRefs: KnowledgeSourceRef[];
}

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i !== -1 ? args[i + 1] : undefined;
}

async function pendingComposition(): Promise<PendingClaim[]> {
  const rows = await db
    .select()
    .from(schema.knowledgeFoodNutrients)
    .where(and(
      isNull(schema.knowledgeFoodNutrients.reviewedAt),
      eq(schema.knowledgeFoodNutrients.isActive, true),
      sql`jsonb_array_length(${schema.knowledgeFoodNutrients.sourceRefs}) > 0`,
    ));
  return rows.map((r) => ({ id: r.id, label: `${r.foodSlug} → ${r.nutrientSlug}  (composition)`, sourceRefs: r.sourceRefs }));
}

async function pendingNutrientBenefit(): Promise<PendingClaim[]> {
  const rows = await db
    .select()
    .from(schema.knowledgeNutrientBenefits)
    .where(and(
      isNull(schema.knowledgeNutrientBenefits.reviewedAt),
      eq(schema.knowledgeNutrientBenefits.isActive, true),
      sql`jsonb_array_length(${schema.knowledgeNutrientBenefits.sourceRefs}) > 0`,
    ));
  return rows.map((r) => ({ id: r.id, label: `${r.nutrientSlug} → ${r.benefitSlug}  (${r.evidenceStrength})`, sourceRefs: r.sourceRefs }));
}

/** Print the claims, return the ids whose citations are structurally valid. */
function review(edge: Edge, pending: PendingClaim[]): number[] {
  console.log(`\n── ${edge} — ${pending.length} sourced claim(s) awaiting sign-off ──\n`);
  const valid: number[] = [];
  for (const row of pending) {
    const problems = row.sourceRefs.flatMap((ref) => validateSourceRef(ref));
    console.log(`  [${problems.length === 0 ? "OK " : "BAD"}] ${row.label}`);
    for (const ref of row.sourceRefs) {
      console.log(`         • ${ref.body}: ${ref.title}`);
      console.log(`           ${ref.url}  (link checked ${ref.lastReviewed})`);
    }
    if (problems.length > 0) for (const p of problems) console.log(`         ✗ ${p}`);
    else valid.push(row.id);
  }
  return valid;
}

async function run() {
  const args = process.argv.slice(2);
  const confirming = flag(args, "--confirm") === "REVIEWED";
  const reviewer = flag(args, "--reviewer")?.trim();
  const edgeArg = flag(args, "--edge") as Edge | undefined;

  if (edgeArg && edgeArg !== "composition" && edgeArg !== "nutrient-benefit") {
    console.error(`Unknown --edge "${edgeArg}". Use "composition" or "nutrient-benefit".`);
    process.exit(1);
  }
  const edges: Edge[] = edgeArg ? [edgeArg] : ["composition", "nutrient-benefit"];

  // Reviewer identity is required BEFORE anything is written, not after.
  if (confirming && !reviewer) {
    console.error(
      "Refusing to sign off anonymously: --reviewer is required.\n" +
        '  npm run knowledge:signoff -- --confirm REVIEWED --reviewer "Your Name"\n\n' +
        "A sign-off is a human taking responsibility for a health claim. A reviewed_at\n" +
        "with no reviewed_by cannot be audited, attributed, or withdrawn.",
    );
    process.exit(1);
  }

  const pending: Record<Edge, PendingClaim[]> = {
    composition: edges.includes("composition") ? await pendingComposition() : [],
    "nutrient-benefit": edges.includes("nutrient-benefit") ? await pendingNutrientBenefit() : [],
  };

  const total = edges.reduce((n, e) => n + pending[e].length, 0);
  if (total === 0) {
    console.log("No sourced claims awaiting sign-off.");
    await pool.end();
    return;
  }

  const valid: Record<Edge, number[]> = { composition: [], "nutrient-benefit": [] };
  for (const edge of edges) valid[edge] = review(edge, pending[edge]);

  if (!confirming) {
    console.log(
      "\nDry run — nothing signed off. Review each claim against its source, then run:" +
        '\n  npm run knowledge:signoff -- --confirm REVIEWED --reviewer "Your Name"',
    );
    await pool.end();
    return;
  }

  const validTotal = edges.reduce((n, e) => n + valid[e].length, 0);
  if (validTotal === 0) {
    console.log("\nNo structurally valid claims to sign off.");
    await pool.end();
    return;
  }

  const reviewedAt = new Date();
  console.log("");
  if (valid.composition.length > 0) {
    await db
      .update(schema.knowledgeFoodNutrients)
      .set({ reviewedAt, reviewedBy: reviewer })
      .where(inArray(schema.knowledgeFoodNutrients.id, valid.composition));
    console.log(`Signed off ${valid.composition.length} composition claim(s) as "${reviewer}".`);
  }
  if (valid["nutrient-benefit"].length > 0) {
    await db
      .update(schema.knowledgeNutrientBenefits)
      .set({ reviewedAt, reviewedBy: reviewer })
      .where(inArray(schema.knowledgeNutrientBenefits.id, valid["nutrient-benefit"]));
    console.log(`Signed off ${valid["nutrient-benefit"].length} nutrient→benefit claim(s) as "${reviewer}".`);
  }
  console.log("\nA benefit chip renders only where BOTH its composition premise and its");
  console.log("nutrient→benefit claim are now signed off. Everything else stays an honest gap.");

  await pool.end();
}

run().catch((err) => {
  console.error("Sign-off failed:", err);
  process.exit(1);
});
