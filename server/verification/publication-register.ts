/**
 * CPV1 — Canonical Publication Register.
 *
 * The single declarative home of every canonical domain's publication
 * contract: Canonical Owner → Authorised Writers → Publication Path →
 * Runtime Read Path. One entry per domain audited by CPI1
 * (docs/investigations/platform/CPI1_CANONICAL_PUBLICATION_INTEGRITY_AUDIT.md).
 *
 * CPI1's findings are deliberately not fixed here — they are converted into
 * the executable checks below, so every one of them is now an automated
 * verification failure instead of a paragraph in an audit. Check severity
 * mirrors CPI1's considered per-domain risk rating: a check whose violation
 * made CPI1 rate the domain 🔴 fails; one behind a 🟡 rating warns.
 *
 * This register DESCRIBES ownership; it never grants it. The Source of Truth
 * Register (docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md)
 * remains the governing owner of ownership — sotRegisterRef cites its rows.
 */

import fs from "node:fs";
import path from "node:path";
import { CANONICAL_SEED } from "@shared/canonical/foods";
import { DIVERSITY_GROUP_SEED } from "@shared/canonical/diversity-groups";
import { KNOWLEDGE_SEED_COUNTS, NUTRIENT_SEED } from "@shared/knowledge";
import { PREPARATION_SEED } from "@shared/knowledge/preparations";
import { ACQUISITION_SOURCE_REGISTER } from "@shared/recipe-acquisition";
import { UPLIFT_RULES } from "../lib/uplift-rules";
import { CapabilityRegistry } from "../intelligence/capability-registry";
import type { DomainDeclaration, PublicationCheck } from "./publication-types";
import {
  customCheck,
  fileAbsenceCheck,
  parseObjectLiteralKeys,
  seedCountCheck,
  sourceCheck,
  sqlCheck,
  writerCensusCheck,
} from "./publication-checks";

/** Both the server and the CLI run from the repository root. */
const REPO_ROOT = process.cwd();

const CANONICAL_VARIETY_COUNT = CANONICAL_SEED.reduce(
  (sum, entry) => sum + (entry.varieties?.length ?? 0),
  0,
);
const CANONICAL_ALIAS_COUNT = CANONICAL_SEED.reduce(
  (sum, entry) => sum + (entry.aliases?.length ?? 0),
  0,
);
const FORBIDDEN_SOURCE_KEYS = Object.entries(ACQUISITION_SOURCE_REGISTER)
  .filter(([, policy]) => policy.storagePolicy === "forbidden" || policy.licenceState === "unlicensed")
  .map(([key]) => key);

export const CANONICAL_PUBLICATION_REGISTER: DomainDeclaration[] = [
  // ── 1. Food Identity ───────────────────────────────────────────────────────
  {
    id: "food-identity",
    name: "Food Identity",
    variant: "identity",
    canonicalOwner: "shared/canonical/foods.ts (CANONICAL_SEED)",
    authorisedWriters: ["server/seeds/seed-canonical-food.ts"],
    publicationPath: "npm run seed:canonical → canonical_food / food_variety / canonical_food_alias",
    runtimeReadPath: "the seed directly (identity variant — the DB tables are a published projection)",
    sotRegisterRef: "D2",
    knownGaps: [
      "validateCanonicalSeed() is DB-blind: it cannot see rows the seed did not author (CPI1 S2-5).",
    ],
    checks: [
      writerCensusCheck({
        id: "fi-writer-census",
        law: "authorised-writers",
        title: "canonical_food is written only by its declared seed runner",
        severity: "warn",
        cpi1: "S2-5",
        schemaIdent: "canonicalFoods",
        tableName: "canonical_food",
        authorisedWriters: ["server/seeds/seed-canonical-food.ts"],
      }),
      // PUB1 — these three count the PUBLISHED projection, not every row in the table.
      //
      // Two kinds of row legitimately sit in these tables without being a publication,
      // and counting either against the owner's declaration asks a question nobody
      // asked:
      //
      //   RETIRED rows — the platform's retirement law is soft (KNOW5; schema.ts:2236
      //   "identities are retireable, never deleted"). A row the owner drops is set
      //   status='retired' / is_active=false and KEEPS its id and history. Counting it
      //   as published would make the reconcile sweep — the correct behaviour these
      //   checks exist to demand — register as drift the moment it did its job.
      //
      //   DRAFT candidates — the 309 WS0.11 USDA rows are Stage 1 (CANDIDATE) of the
      //   graduation pipeline (PKCA §1.1), awaiting human promotion. A candidate is not
      //   a stale publication; it is a food THA has not yet decided to know.
      //
      // Neither is swept under the carpet: `fi-unowned-rows` below counts every row in
      // canonical_food the owner does not author and names it, so the candidate pool
      // stays visible and an unowned row can never hide behind this narrowing.
      seedCountCheck({
        id: "fi-food-publication",
        law: "no-stale-projections",
        title: "canonical_food projection matches the owner's declaration",
        severity: "warn",
        cpi1: "§4.3",
        tableName: "canonical_food",
        where: "status = 'active'",
        expected: CANONICAL_SEED.length,
        ownerLabel: "CANONICAL_SEED",
      }),
      seedCountCheck({
        id: "fi-variety-publication",
        law: "no-stale-projections",
        title: "food_variety projection matches the owner's declaration",
        severity: "warn",
        cpi1: "§4.3",
        tableName: "food_variety",
        where: "status = 'active'",
        expected: CANONICAL_VARIETY_COUNT,
        ownerLabel: "CANONICAL_SEED varieties",
      }),
      seedCountCheck({
        id: "fi-alias-publication",
        law: "no-stale-projections",
        title: "canonical_food_alias projection matches the owner's declaration",
        severity: "warn",
        cpi1: "§4.3",
        tableName: "canonical_food_alias",
        where: "is_active",
        expected: CANONICAL_ALIAS_COUNT,
        ownerLabel: "CANONICAL_SEED aliases",
      }),
      customCheck({
        id: "fi-unowned-rows",
        law: "one-owner",
        title: "Every row in canonical_food is authored by the owner",
        severity: "warn",
        cpi1: "S2-5",
        run: async (ctx) => {
          const rows = await ctx.query(`SELECT slug, status, tier FROM canonical_food`);
          const authored = new Set(CANONICAL_SEED.map((e) => e.food.slug));
          const unowned = rows.filter((r) => !authored.has(String(r.slug)));
          if (unowned.length === 0) {
            return { violated: false, detail: `All ${rows.length} rows in canonical_food are owner-authored.` };
          }
          const byTier = new Map<string, number>();
          for (const r of unowned) {
            const k = `${r.tier ?? "?"}/${r.status ?? "?"}`;
            byTier.set(k, (byTier.get(k) ?? 0) + 1);
          }
          const breakdown = Array.from(byTier.entries()).map(([k, n]) => `${n} ${k}`).join(", ");
          return {
            violated: true,
            detail:
              `${unowned.length} row(s) in canonical_food the owner never authored (${breakdown}) — ` +
              `the WS0.11 USDA candidate pool, deposited by the unauthorised writer above. ` +
              `They are quarantined out of the published projection (status='draft') and no runtime path reads them, ` +
              `but the declared owner still cannot reproduce its own table until they are promoted or retired.`,
          };
        },
      }),
      sourceCheck({
        id: "fi-reconcile-sweep",
        law: "no-publication-drift",
        title: "The seed runner can retire a published row (reconcile sweep)",
        severity: "warn",
        cpi1: "§4.3",
        file: "server/seeds/seed-canonical-food.ts",
        pattern: /deactivateAbsentRows|reconcile/i,
        expect: "present",
        violationDetail:
          "seed-canonical-food.ts has no reconcile sweep — a correction removed from the seed can never be retired from the projection.",
        passDetail: "Seed runner carries a reconcile sweep.",
      }),
    ],
  },

  // ── 2. Food Knowledge ──────────────────────────────────────────────────────
  {
    id: "food-knowledge",
    name: "Food Knowledge",
    variant: "knowledge",
    canonicalOwner: "shared/knowledge/ (FOOD_SEED and companions)",
    authorisedWriters: ["server/seeds/seed-knowledge-registry.ts"],
    publicationPath: "npm run seed:knowledge → knowledge_* tables",
    runtimeReadPath: "server/services/nutrition-knowledge-registry.ts (the one mouth)",
    sotRegisterRef: "D1",
    knownGaps: [],
    checks: [
      seedCountCheck({
        id: "fk-food-publication",
        law: "no-stale-projections",
        title: "knowledge_foods projection matches the owner's declaration",
        severity: "warn",
        tableName: "knowledge_foods",
        expected: KNOWLEDGE_SEED_COUNTS.foods,
        ownerLabel: "FOOD_SEED",
      }),
      customCheck({
        id: "fk-orphan-nutrients",
        law: "no-publication-drift",
        title: "Every published nutrient is authored by the owner (no orphan rows)",
        severity: "fail",
        cpi1: "§4.3 (KNOW1 residue)",
        run: async (ctx) => {
          // PUB1 — `is_active` is the published set. KNOW5's reconcile RETIRES an orphan
          // (is_active = false) rather than deleting it, deliberately: the row keeps its id,
          // its citations and its sign-off history, which is what makes a bad import
          // reversible. Counting a retired row as published would mean the only way to
          // satisfy this check was a hard delete — the one thing the owner's publication
          // law forbids. A retired nutrient renders nowhere; it is not published.
          const rows = await ctx.query(`SELECT slug FROM knowledge_nutrients WHERE is_active`);
          const authored = new Set(NUTRIENT_SEED.map((n) => n.slug));
          const orphans = rows
            .map((r) => String(r.slug))
            .filter((slug) => !authored.has(slug));
          if (orphans.length > 0) {
            return {
              violated: true,
              detail: `${orphans.length} published nutrient(s) no owner authors: ${orphans.join(", ")} — live KNOW1 residue.`,
            };
          }
          return { violated: false, detail: `All ${rows.length} published nutrients are owner-authored.` };
        },
      }),
      fileAbsenceCheck({
        id: "fk-residue-fixture",
        law: "no-sync-bridges",
        title: "No CI fixture preserves a known defect to keep tests green",
        severity: "fail",
        cpi1: "§4.5",
        file: "scripts/ci/seed-know1-residue.ts",
        violationDetail:
          "scripts/ci/seed-know1-residue.ts re-inserts the plant-protein defect into CI so tests keep passing — a synchronisation bridge whose synchronised artefact is a bug.",
      }),
      sqlCheck({
        id: "fk-legacy-overlap",
        law: "one-owner",
        title: "food_knowledge does not duplicate knowledge_foods on any slug",
        severity: "warn",
        cpi1: "S2-8",
        sql: `SELECT fk.slug FROM food_knowledge fk JOIN knowledge_foods kf ON kf.slug = fk.slug`,
        evaluate: (rows) =>
          rows.length > 0
            ? {
                violated: true,
                detail: `${rows.length} slug(s) carry a second editorial narrative in food_knowledge: ${rows.map((r) => r.slug).join(", ")}.`,
              }
            : { violated: false, detail: "No slug collision between food_knowledge and knowledge_foods." },
      }),
      sourceCheck({
        id: "fk-boot-writer",
        law: "no-sync-bridges",
        title: "food_knowledge is not published by an undeclared boot-time writer",
        severity: "warn",
        cpi1: "§4.2",
        file: "server/index.ts",
        pattern: /seedFoodKnowledge\(\)/,
        expect: "absent",
        violationDetail:
          "server/index.ts runs seedFoodKnowledge() on every boot — an undeclared publication path beside npm run seed:*.",
        passDetail: "No boot-time writer for food_knowledge.",
      }),
      sourceCheck({
        id: "fk-early-return",
        law: "no-publication-drift",
        title: "The food_knowledge seed can re-publish a corrected entry",
        severity: "warn",
        cpi1: "§4.3",
        file: "server/lib/seed-food-knowledge.ts",
        pattern: /existing\.length\s*>=\s*ENTRIES\.length/,
        expect: "absent",
        violationDetail:
          "seed-food-knowledge.ts returns early once rows exist — every future edit to the owner is permanently unpublishable.",
        passDetail: "Seed runner re-publishes corrections.",
      }),
    ],
  },

  // ── 3. Plant Diversity ─────────────────────────────────────────────────────
  {
    id: "plant-diversity",
    name: "Plant Diversity",
    variant: "identity",
    canonicalOwner: "shared/canonical/diversity-groups.ts (DIVERSITY_GROUP_SEED)",
    authorisedWriters: ["server/seeds/seed-canonical-food.ts"],
    publicationPath: "npm run seed:canonical → diversity_group",
    runtimeReadPath: "the seed directly (identity variant)",
    sotRegisterRef: "D4",
    knownGaps: [
      "Five plant counters with three dedup keys exist across surfaces (CPI1 duplicate-runtime-identity verdict).",
    ],
    checks: [
      seedCountCheck({
        id: "pd-publication",
        law: "no-stale-projections",
        title: "diversity_group projection matches the owner's declaration",
        severity: "fail",
        cpi1: "§4.3",
        tableName: "diversity_group",
        // PUB1 — the published set, for the same reason as Food Identity above: a group
        // the owner retires is deactivated, never deleted.
        where: "is_active",
        expected: DIVERSITY_GROUP_SEED.length,
        ownerLabel: "DIVERSITY_GROUP_SEED",
      }),
      sourceCheck({
        id: "pd-counter-dedup",
        law: "no-duplicate-runtime-identity",
        title: "The 30-plants counter dedupes by diversity group, not ingredient slug",
        severity: "fail",
        cpi1: "S1-2",
        file: "server/routes.ts",
        pattern: /if \(isPlantIngredient\(slug\)\) plantSlugs\.add\(slug\)/,
        expect: "absent",
        violationDetail:
          "routes.ts dedupes plants by ingredient slug — kale and cavolo nero count as two plants where the canonical owner says one.",
        passDetail: "Counter no longer dedupes by raw ingredient slug.",
      }),
      sourceCheck({
        id: "pd-rival-owner",
        law: "one-owner",
        title: "No rival 'is this a plant' owner beside the canonical diversity groups",
        severity: "warn",
        cpi1: "S2-9",
        file: "server/services/meal-food-intelligence.ts",
        pattern: /PLANT_CATEGORIES\s*=\s*new Set\(/,
        expect: "absent",
        violationDetail:
          "meal-food-intelligence.ts owns a hardcoded PLANT_CATEGORIES set — a second answer to 'is this a plant' beside diversity_group.",
        passDetail: "No rival plant classifier remains.",
      }),
    ],
  },

  // ── 4. Meals ───────────────────────────────────────────────────────────────
  {
    id: "meals",
    name: "Meals",
    variant: "transactional",
    canonicalOwner: "DB meals (household- and system-authored rows)",
    authorisedWriters: ["server/storage.ts", "scripts/import-tha-founding-cookbook-500.ts"],
    publicationPath: "storage.createMeal() — the declared single write funnel",
    runtimeReadPath: "server/storage.ts",
    sotRegisterRef: "D13",
    knownGaps: [
      "Six direct readers bypass the storage read layer (CPI1 summary table).",
    ],
    checks: [
      writerCensusCheck({
        id: "ml-writer-census",
        law: "authorised-writers",
        title: "meals is written only through the declared write funnel",
        severity: "fail",
        cpi1: "S2-1",
        schemaIdent: "meals",
        tableName: "meals",
        authorisedWriters: ["server/storage.ts", "scripts/import-tha-founding-cookbook-500.ts"],
      }),
      sqlCheck({
        id: "ml-provenance",
        law: "no-publication-drift",
        title: "Every meal row carries acquisition provenance",
        severity: "warn",
        cpi1: "S2-1",
        sql: `SELECT count(*)::int AS missing FROM meals WHERE acquisition_lane IS NULL`,
        evaluate: (rows) => {
          const missing = Number(rows[0]?.missing ?? 0);
          return missing > 0
            ? { violated: true, detail: `${missing} meal row(s) carry no acquisition provenance — their owner cannot reproduce them.` }
            : { violated: false, detail: "Every meal row carries acquisition provenance." };
        },
      }),
      sourceCheck({
        id: "ml-boot-image-wipe",
        law: "authorised-writers",
        title: "No boot-time writer mutates rows it does not own",
        severity: "warn",
        cpi1: "§4.2",
        file: "server/lib/seed-ready-meals.ts",
        pattern: /\.set\(\{ imageUrl: null \}\)/,
        expect: "absent",
        violationDetail:
          "seed-ready-meals.ts nulls image_url on ALL system meals at every boot — including the 500 Founding Cookbook rows it does not own.",
        passDetail: "Boot seeding no longer mutates rows outside its ownership.",
      }),
    ],
  },

  // ── 5. Founding Cookbook (500) ─────────────────────────────────────────────
  {
    id: "cookbook-500",
    name: "Founding Cookbook (500)",
    variant: "knowledge",
    canonicalOwner: "data/cookbook/tha_original_founding_cookbook_500/ (committed JSON)",
    authorisedWriters: ["scripts/import-tha-founding-cookbook-500.ts"],
    publicationPath: "npm run seed:cookbook → meals (is_system_meal, tha_library provenance)",
    runtimeReadPath: "server/storage.ts",
    knownGaps: [],
    checks: [
      customCheck({
        id: "cb-seed-verified",
        law: "no-publication-drift",
        title: "The published cookbook equals the committed owner (CBK1 gate, 8 checks)",
        severity: "fail",
        run: async () => {
          const [{ verifyCookbookSeed }, { pool }] = await Promise.all([
            import("../../scripts/ci/verify-cookbook-seed"),
            import("../db"),
          ]);
          const checks = await verifyCookbookSeed(pool);
          const failed = checks.filter((c) => c.status === "FAIL");
          if (failed.length > 0) {
            return {
              violated: true,
              detail: `${failed.length}/${checks.length} CBK1 checks fail: ${failed.map((c) => c.name).join("; ")}.`,
            };
          }
          return { violated: false, detail: `${checks.length}/${checks.length} CBK1 publication checks pass.` };
        },
      }),
      customCheck({
        id: "cb-diet-labels-derived",
        law: "no-publication-drift",
        title: "Every published diet label is what the recipe's own ingredients prove (SURF1C1)",
        severity: "fail",
        run: async (ctx) => {
          const { classifyDietLabels } = await import("@shared/dietRules");
          const rows = await ctx.query(
            `SELECT name, ingredients, diet_types FROM meals
             WHERE is_system_meal = true AND acquisition_source_key LIKE 'tha_original:%'`,
          );

          const drifted: string[] = [];
          for (const row of rows as Array<Record<string, any>>) {
            const published = ((row.diet_types ?? []) as string[])
              .filter((l) => l === "vegan" || l === "vegetarian")
              .sort();
            const derived = classifyDietLabels({
              name: row.name,
              ingredients: (row.ingredients ?? []) as string[],
            }).labels.slice().sort();

            if (published.join(",") !== derived.join(",")) {
              drifted.push(`${row.name}: published [${published}] ≠ derived [${derived}]`);
            }
          }

          if (drifted.length > 0) {
            return {
              violated: true,
              detail:
                `${drifted.length} of ${rows.length} founding recipes carry a diet label their own ingredients do not ` +
                `prove. The label is a projection of the ingredients, not a second fact: ${drifted.slice(0, 3).join("; ")}.`,
            };
          }
          return {
            violated: false,
            detail: `All ${rows.length} founding recipes' diet labels equal what the canonical classifier derives from their ingredients.`,
          };
        },
      }),
      sourceCheck({
        id: "cb-starter-copies",
        law: "no-duplicate-runtime-identity",
        title: "Cookbook recipes are not duplicated into unkeyed user rows",
        severity: "warn",
        cpi1: "S2-2",
        file: "server/lib/meal-service.ts",
        pattern: /preloadStarterMeals/,
        expect: "absent",
        violationDetail:
          "preloadStarterMeals copies cookbook recipes into user rows with no acquisition_source_key — the owner cannot reproduce or repair the copies.",
        passDetail: "No unkeyed duplication of cookbook rows.",
      }),
    ],
  },

  // ── 6. Meal Templates ──────────────────────────────────────────────────────
  {
    id: "meal-templates",
    name: "Meal Templates",
    variant: "knowledge",
    canonicalOwner: "server/seeds/seed-meal-shell-templates.ts (declared)",
    authorisedWriters: ["server/seeds/seed-meal-shell-templates.ts"],
    publicationPath: "npm run seed:meal-shells → meal_templates",
    runtimeReadPath: "server/storage.ts / templates-read-port.ts",
    sotRegisterRef: "D13",
    knownGaps: [],
    checks: [
      sourceCheck({
        id: "mt-boot-bridge",
        law: "no-sync-bridges",
        title: "No boot-time bridge projects meals into meal_templates",
        severity: "fail",
        cpi1: "§4.2 / S2-3",
        file: "server/index.ts",
        pattern: /runTemplateMigration\(\)/,
        expect: "absent",
        violationDetail:
          "server/index.ts runs runTemplateMigration() on every boot — a permanent meals → meal_templates synchronisation bridge the platform's own read-port calls a one-time backfill.",
        passDetail: "No boot-time template bridge.",
      }),
      writerCensusCheck({
        id: "mt-writer-census",
        law: "authorised-writers",
        title: "meal_templates is written only by its declared owner",
        severity: "fail",
        cpi1: "S2-3",
        schemaIdent: "mealTemplates",
        tableName: "meal_templates",
        authorisedWriters: ["server/seeds/seed-meal-shell-templates.ts"],
      }),
      sqlCheck({
        id: "mt-stub-ratio",
        law: "no-stale-projections",
        title: "Published templates carry shell structure (not boot-job stubs)",
        severity: "fail",
        cpi1: "S2-3",
        sql: `SELECT count(*)::int AS total, count(*) FILTER (WHERE shared_base_components IS NULL)::int AS stubs FROM meal_templates`,
        evaluate: (rows) => {
          const total = Number(rows[0]?.total ?? 0);
          const stubs = Number(rows[0]?.stubs ?? 0);
          return stubs > 0
            ? { violated: true, detail: `${stubs} of ${total} meal_templates rows carry no shell structure — boot-job stubs, not owner-published templates.` }
            : { violated: false, detail: `All ${total} templates carry shell structure.` };
        },
      }),
      sqlCheck({
        id: "mt-duplicate-identity",
        law: "no-duplicate-runtime-identity",
        title: "No duplicate template identities",
        severity: "warn",
        cpi1: "S2-3",
        sql: `SELECT name, count(*)::int AS n FROM meal_templates GROUP BY name HAVING count(*) > 1`,
        evaluate: (rows) =>
          rows.length > 0
            ? { violated: true, detail: `${rows.length} duplicate template identit(ies): ${rows.slice(0, 5).map((r) => `${r.name} ×${r.n}`).join(", ")}.` }
            : { violated: false, detail: "No duplicate template identities." },
      }),
    ],
  },

  // ── 7. Recipe Sources ──────────────────────────────────────────────────────
  {
    id: "recipe-sources",
    name: "Recipe Sources",
    variant: "knowledge",
    canonicalOwner: "shared/recipe-acquisition.ts (ACQUISITION_SOURCE_REGISTER)",
    authorisedWriters: ["shared/recipe-acquisition.ts (editorial)"],
    publicationPath: "committed module — read directly at runtime",
    runtimeReadPath: "server/lib/recipe-source-gate.ts",
    knownGaps: [],
    checks: [
      sourceCheck({
        id: "rs-gate-reads-register",
        law: "approved-read-path",
        title: "The runtime gate reads the acquisition register",
        severity: "fail",
        file: "server/lib/recipe-source-gate.ts",
        pattern: /@shared\/recipe-acquisition/,
        expect: "present",
        violationDetail: "recipe-source-gate.ts no longer reads the canonical acquisition register.",
        passDetail: "Gate reads shared/recipe-acquisition.ts.",
      }),
      sqlCheck({
        id: "rs-forbidden-rows",
        law: "no-publication-drift",
        title: "No meal rows persist under forbidden / unlicensed source keys",
        severity: "warn",
        cpi1: "S3-8",
        sql: `SELECT acquisition_source_key AS key, count(*)::int AS n FROM meals WHERE acquisition_source_key = ANY($1) GROUP BY acquisition_source_key`,
        params: [FORBIDDEN_SOURCE_KEYS],
        evaluate: (rows) => {
          if (rows.length === 0) return { violated: false, detail: "No rows under forbidden or unlicensed source keys." };
          const total = rows.reduce((s, r) => s + Number(r.n), 0);
          return {
            violated: true,
            detail: `${total} meal row(s) persist under forbidden/unlicensed keys: ${rows.map((r) => `${r.key} ×${r.n}`).join(", ")}.`,
          };
        },
      }),
    ],
  },

  // ── 8. Planner ─────────────────────────────────────────────────────────────
  {
    id: "planner",
    name: "Planner",
    variant: "transactional",
    canonicalOwner: "DB planner_weeks / planner_days / planner_entries",
    authorisedWriters: ["server/storage.ts"],
    publicationPath: "household-authored at runtime via storage",
    runtimeReadPath: "server/storage.ts",
    sotRegisterRef: "D14",
    knownGaps: [
      "Four assemblers read planner state beside the storage layer (CPI1 summary table).",
    ],
    checks: [
      sqlCheck({
        id: "pl-dead-store",
        law: "no-duplicate-runtime-identity",
        title: "The retired meal_plans store holds no rows and gains no writes",
        severity: "warn",
        cpi1: "S3-10",
        sql: `SELECT (SELECT count(*)::int FROM meal_plans) AS plans, (SELECT count(*)::int FROM meal_plan_entries) AS entries`,
        evaluate: (rows) => {
          const plans = Number(rows[0]?.plans ?? 0);
          const entries = Number(rows[0]?.entries ?? 0);
          // CONV1 WRITE-4 corrected this detail: it used to end "— and
          // template-migration still writes it at boot", which stopped being true
          // the moment that backfill was retired. Nothing writes this store now;
          // the rows below are residue, not intake. A gate's prose goes stale
          // exactly like a document's, and a check that reports a fixed cause is
          // how a real finding gets dismissed as noise.
          return plans + entries > 0
            ? { violated: true, detail: `Dead store still populated: meal_plans=${plans}, meal_plan_entries=${entries} — residue only; no writer remains.` }
            : { violated: false, detail: "meal_plans / meal_plan_entries are empty." };
        },
      }),
    ],
  },

  // ── 9. Household Dietary Preference ────────────────────────────────────────
  //
  // CONVERGED 2026-07-16 (CONV1 P4). The owner CPI1 found contested is settled the
  // way the governing architecture always declared it (ARCHITECTURE_PRINCIPLES.md
  // Principle 2, 2026-06-25; Register Domain 16, corrected by DOC-1):
  // `household_eaters` owns every member's diet — pattern (as its canonical diet
  // type in default_diet_types) and hard restrictions. users.diet_pattern /
  // users.diet_restrictions are DROPPED (OWN-1); the read-time enrichments are
  // deleted (READ-1); the self-declared Bridge is deleted (WRITE-1).
  // user_preferences.diet_types is NOT a rival owner — it is Domain 27's own soft
  // preference list (Register Domain 7 note, DOC-1). The checks below are now
  // RATCHETS: each detects the retired shape returning.
  {
    id: "household",
    name: "Household Dietary Preference",
    variant: "transactional",
    canonicalOwner: "DB household_eaters (Register Domain 16)",
    authorisedWriters: ["server/storage.ts (updatePersonDiet / updateHouseholdEater / createHouseholdEater)"],
    publicationPath: "household-authored at runtime via storage",
    runtimeReadPath: "server/lib/household-dietary-safety.ts (canonical resolver) + storage.getPersonDiet",
    sotRegisterRef: "D7 / D16",
    knownGaps: [],
    checks: [
      customCheck({
        id: "hh-dropped-restrictions",
        law: "approved-read-path",
        title: "Dietary restrictions reach the AI-facing household context",
        severity: "fail",
        cpi1: "S1-1",
        run: async (ctx) => {
          const storage = ctx.sources.get("server/storage.ts") ?? "";
          const hardcoded = /dietRestrictions:\s*\[\]/.test(storage);
          return hardcoded
            ? {
                violated: true,
                detail: "storage.ts hardcodes dietRestrictions: [] in the household dietary context — every allergen and restriction is dropped before the AI reads it.",
              }
            : { violated: false, detail: "Household context no longer hardcodes dietRestrictions to []." };
        },
      }),
      sourceCheck({
        id: "hh-sync-bridge",
        law: "no-sync-bridges",
        title: "No self-declared bridge synchronises diet across owners",
        severity: "fail",
        cpi1: "S2-4 / §7",
        file: "server/routes.ts",
        pattern: /Bridge: sync users\.diet_pattern/,
        expect: "absent",
        violationDetail:
          "routes.ts carries a self-declared, one-way, best-effort 'Bridge' syncing users.diet_pattern → user_preferences.diet_types — the platform's only self-confessed permanent synchronisation bridge. Deleted by CONV1 P4 (WRITE-1); its return is a regression.",
        passDetail: "The diet-preference bridge is gone (CONV1 P4 / WRITE-1).",
      }),
      customCheck({
        id: "hh-contested-owner",
        law: "one-owner",
        title: "Dietary preference has a single canonical owner",
        severity: "fail",
        cpi1: "S2-4",
        run: async (ctx) => {
          // Ratchet: the retired users.diet* shadow (CONV1 P4 / OWN-1) must not
          // return to the schema, and the owner must still be declared.
          // user_preferences.diet_types is Domain 27's own soft-preference fact,
          // not a rival owner of the person diet fact (Register Domain 7, DOC-1) —
          // CPI1's original check counted it as one, which DOC-1 corrected.
          const schema = ctx.sources.get("shared/schema.ts") ?? "";
          const shadowReturned = /dietPattern: text\("diet_pattern"\)|dietRestrictions: text\("diet_restrictions"\)/.test(schema);
          const ownerDeclared = /defaultDietTypes/.test(schema) && /hardRestrictions/.test(schema);
          if (shadowReturned) {
            return {
              violated: true,
              detail: "users.diet_pattern / users.diet_restrictions have RETURNED to shared/schema.ts — the shadow CONV1 P4 (OWN-1) retired is live again, and the diet fact has two owners.",
            };
          }
          if (!ownerDeclared) {
            return {
              violated: true,
              detail: "household_eaters no longer declares default_diet_types / hard_restrictions — the canonical owner of the person diet fact has lost its columns.",
            };
          }
          return { violated: false, detail: "Single owner: household_eaters.default_diet_types / hard_restrictions (Register Domain 16)." };
        },
      }),
      sqlCheck({
        id: "hh-unprojected",
        law: "no-stale-projections",
        title: "Every active member has an eater row (the owner of their diet)",
        severity: "warn",
        cpi1: "S2-4",
        sql: `SELECT count(*)::int AS missing,
                     (SELECT count(*)::int FROM household_members WHERE status = 'active') AS total
              FROM household_members hm
              WHERE hm.status = 'active'
                AND NOT EXISTS (
                  SELECT 1 FROM household_eaters he
                  WHERE he.household_id = hm.household_id AND he.user_id = hm.user_id
                )`,
        evaluate: (rows) => {
          const missing = Number(rows[0]?.missing ?? 0);
          const total = Number(rows[0]?.total ?? 0);
          return missing > 0
            ? { violated: true, detail: `${missing} of ${total} active memberships have no eater row — those members' diets have no owner row (WRITE-3 creates one at every membership event).` }
            : { violated: false, detail: `All ${total} active memberships have an eater row.` };
        },
      }),
    ],
  },

  // ── 10. Shopping ───────────────────────────────────────────────────────────
  {
    id: "shopping",
    name: "Shopping",
    variant: "transactional",
    canonicalOwner: "DB shopping_list (+ shopping_list_extras)",
    authorisedWriters: ["server/storage.ts"],
    publicationPath: "household-authored at runtime via storage",
    runtimeReadPath: "server/storage.ts",
    sotRegisterRef: "D15",
    knownGaps: [],
    checks: [
      writerCensusCheck({
        id: "sh-writer-census",
        law: "authorised-writers",
        title: "shopping_list is written only through storage",
        severity: "warn",
        cpi1: "S2-7",
        schemaIdent: "shoppingList",
        tableName: "shopping_list",
        authorisedWriters: ["server/storage.ts"],
      }),
    ],
  },

  // ── 11. Pantry ─────────────────────────────────────────────────────────────
  {
    id: "pantry",
    name: "Pantry",
    variant: "transactional",
    canonicalOwner: "DB user_pantry_items",
    authorisedWriters: ["server/storage.ts"],
    publicationPath: "household-authored at runtime via storage",
    runtimeReadPath: "server/storage.ts (one path)",
    knownGaps: [
      "activity_summary lifetime_* columns are blind increments and can never be re-derived (CPI1 S1-5).",
    ],
    checks: [
      sqlCheck({
        id: "pn-activity-drift",
        law: "no-stale-projections",
        title: "activity_summary pantry counts equal the canonical household-scoped read",
        severity: "fail",
        cpi1: "S1-5",
        sql: `SELECT a.user_id, a.current_pantry_items,
                     (SELECT count(*)::int FROM user_pantry_items p WHERE p.household_id = a.household_id) AS canonical
              FROM activity_summary a`,
        evaluate: (rows) => {
          const drifted = rows.filter(
            (r) => Number(r.current_pantry_items) !== Number(r.canonical),
          );
          return drifted.length > 0
            ? {
                violated: true,
                detail: `${drifted.length} of ${rows.length} activity_summary rows drifted from the canonical pantry count (e.g. user ${drifted[0].user_id}: cached ${drifted[0].current_pantry_items}, canonical ${drifted[0].canonical}).`,
              }
            : { violated: false, detail: `All ${rows.length} activity_summary rows match the canonical read.` };
        },
      }),
      sourceCheck({
        id: "pn-onconflict-block",
        law: "no-publication-drift",
        title: "The pantry-knowledge publisher can re-publish a corrected key",
        severity: "warn",
        cpi1: "S3-12",
        file: "server/storage.ts",
        pattern: /seedStaticPantryKnowledge[\s\S]{0,3000}?onConflictDoNothing/,
        expect: "absent",
        violationDetail:
          "seedStaticPantryKnowledge uses onConflictDoNothing — an existing row permanently blocks the editorial owner from publishing that key.",
        passDetail: "Pantry knowledge publisher can re-publish corrections.",
      }),
      sourceCheck({
        id: "pn-boot-writer",
        law: "no-sync-bridges",
        title: "pantry_ingredient_knowledge is not published by an undeclared boot writer",
        severity: "warn",
        cpi1: "§4.2",
        file: "server/index.ts",
        pattern: /seedPantryKnowledge\(\)/,
        expect: "absent",
        violationDetail:
          "server/index.ts runs seedPantryKnowledge() on every boot — an undeclared publication path.",
        passDetail: "No boot-time pantry knowledge writer.",
      }),
    ],
  },

  // ── 12. Nutrition — Boost / Uplift ─────────────────────────────────────────
  {
    id: "nutrition-uplift",
    name: "Nutrition — Boost / Uplift",
    variant: "knowledge",
    canonicalOwner: "server/lib/uplift-rules.ts (UPLIFT_RULES)",
    authorisedWriters: ["server/routes.ts (uplift acceptance endpoint)"],
    publicationPath: "committed module — applications recorded in meal_uplift_applications",
    runtimeReadPath: "server/lib/uplift-engine.ts",
    sotRegisterRef: "D17",
    knownGaps: [],
    checks: [
      customCheck({
        id: "up-phantom-rules",
        law: "no-duplicate-runtime-identity",
        title: "Every applied uplift cites a rule its owner authored",
        severity: "fail",
        cpi1: "S1-3",
        run: async (ctx) => {
          const rows = await ctx.query(
            `SELECT rule_id, count(*)::int AS n FROM meal_uplift_applications GROUP BY rule_id`,
          );
          const authored = new Set(UPLIFT_RULES.map((r) => r.id));
          const phantoms = rows.filter((r) => !authored.has(String(r.rule_id)));
          if (phantoms.length > 0) {
            const total = phantoms.reduce((s, r) => s + Number(r.n), 0);
            return {
              violated: true,
              detail: `${total} application row(s) cite rule id(s) the owner never authored: ${phantoms.map((r) => `${r.rule_id} ×${r.n}`).join(", ")}.`,
            };
          }
          return { violated: false, detail: `All ${rows.length} applied rule id(s) are owner-authored.` };
        },
      }),
      sourceCheck({
        id: "up-client-publisher",
        law: "authorised-writers",
        title: "No client code mints uplift rule identities",
        severity: "fail",
        cpi1: "S1-3",
        file: "client/src/pages/weekly-planner-page.tsx",
        pattern: /fallback-deterministic-boosts/,
        expect: "absent",
        violationDetail:
          "weekly-planner-page.tsx mints 'fallback-deterministic-boosts' — a rule identity that exists nowhere on the server, published into a server-owned projection under a false provenance stamp.",
        passDetail: "Client mints no rule identities.",
      }),
      fileAbsenceCheck({
        id: "up-rival-display",
        law: "one-owner",
        title: "No rival client-side boost vocabulary beside the canonical rules",
        severity: "warn",
        cpi1: "§4.4",
        file: "client/src/lib/nutrition-boosts.ts",
        violationDetail:
          "client/src/lib/nutrition-boosts.ts owns a second boost vocabulary beside server/lib/uplift-rules.ts.",
      }),
    ],
  },

  // ── 13. Nutrition — Preparation ────────────────────────────────────────────
  {
    id: "nutrition-preparation",
    name: "Nutrition — Preparation",
    variant: "knowledge",
    canonicalOwner: "shared/knowledge/preparations.ts (PREPARATION_SEED)",
    authorisedWriters: ["server/seeds/seed-knowledge-registry.ts"],
    publicationPath: "npm run seed:knowledge → knowledge_preparations / knowledge_food_preparations",
    runtimeReadPath: "server/services/nutrition-knowledge-registry.ts",
    knownGaps: [],
    checks: [
      seedCountCheck({
        id: "pr-publication",
        law: "no-stale-projections",
        title: "knowledge_preparations matches the owner's declaration",
        severity: "fail",
        tableName: "knowledge_preparations",
        expected: PREPARATION_SEED.length,
        ownerLabel: "PREPARATION_SEED",
      }),
      customCheck({
        id: "pr-unrendered",
        law: "approved-read-path",
        title: "Published preparation knowledge reaches at least one surface",
        severity: "warn",
        cpi1: "S3-11",
        run: async (ctx) => {
          let consumers = 0;
          for (const [file, content] of ctx.sources) {
            if (!file.startsWith("client/src/")) continue;
            if (/preparation/i.test(content)) consumers++;
          }
          return consumers === 0
            ? { violated: true, detail: "0 client surfaces consume preparation knowledge — architecturally exemplary and rendered nowhere." }
            : { violated: false, detail: `${consumers} client file(s) reference preparation knowledge.` };
        },
      }),
    ],
  },

  // ── 14. Nutrition — Product / UPF / Additives ──────────────────────────────
  {
    id: "product-analysis",
    name: "Nutrition — Product / UPF / Additives",
    variant: "knowledge",
    canonicalOwner: "server/lib/product-analysis.ts + server/lib/upf-analysis-service.ts",
    authorisedWriters: ["server/seeds/run-additives-seed.ts"],
    publicationPath: "npm run seed:additives → additives",
    runtimeReadPath: "server/routes.ts / server/storage.ts",
    sotRegisterRef: "D19",
    knownGaps: [
      "Four rival processing vocabularies own 'what is a processing signal' (CPI1 S3-2).",
      "client/src/lib/basket-item-classifier.ts widens the canonical Apple Score gate (CPI1 S3-3).",
    ],
    checks: [
      customCheck({
        id: "pa-type-risk-coverage",
        law: "no-publication-drift",
        title: "Every published additive type has a declared risk weighting",
        severity: "warn",
        cpi1: "S3-1",
        run: async (ctx) => {
          const source = ctx.sources.get("server/lib/upf-analysis-service.ts") ?? "";
          const declared = new Set(
            parseObjectLiteralKeys(source, "ADDITIVE_TYPE_RISK").map((k) => k.toLowerCase()),
          );
          const rows = await ctx.query(`SELECT DISTINCT type FROM additives`);
          const missing = rows
            .map((r) => String(r.type))
            .filter((t) => !declared.has(t.toLowerCase()));
          return missing.length > 0
            ? {
                violated: true,
                detail: `${missing.length} published additive type(s) have no declared risk and fall through to the LOWEST weighting: ${missing.join(", ")}.`,
              }
            : { violated: false, detail: `All ${rows.length} published additive types carry a declared risk.` };
        },
      }),
      sqlCheck({
        id: "pa-dead-stores",
        law: "one-owner",
        title: "Declared-authoritative stores are alive (rows and readers)",
        severity: "warn",
        cpi1: "S3-10",
        sql: `SELECT (SELECT count(*)::int FROM grocery_products) AS gp, (SELECT count(*)::int FROM product_additives) AS pa`,
        evaluate: (rows) => {
          const gp = Number(rows[0]?.gp ?? 0);
          const pa = Number(rows[0]?.pa ?? 0);
          return gp === 0 && pa === 0
            ? { violated: true, detail: "grocery_products and product_additives are declared authoritative in the SoT Register yet hold 0 rows — dead projections." }
            : { violated: false, detail: `grocery_products=${gp}, product_additives=${pa}.` };
        },
      }),
      sourceCheck({
        id: "pa-onconflict-block",
        law: "no-publication-drift",
        title: "The additives publisher can re-publish a corrected risk level",
        severity: "warn",
        cpi1: "§4.3",
        file: "server/seeds/run-additives-seed.ts",
        pattern: /DO NOTHING|onConflictDoNothing/i,
        expect: "absent",
        violationDetail:
          "run-additives-seed.ts publishes with ON CONFLICT DO NOTHING — a corrected risk level in the seed can never reach the projection.",
        passDetail: "Additives publisher re-publishes corrections.",
      }),
    ],
  },

  // ── 15. Companion / Notice ─────────────────────────────────────────────────
  {
    id: "companion-notice",
    name: "Companion / Notice",
    variant: "platform",
    canonicalOwner: "conversation-gateway.ts",
    authorisedWriters: ["server/intelligence/conversation/"],
    publicationPath: "one assistant, one conversation state",
    runtimeReadPath: "server/intelligence/conversation/conversation-gateway.ts",
    /**
     * P0 Food Intelligence Recovery (2026-07-17) — NTC-P2 is NOT BUILT.
     *
     * `notice-gateway.ts` was retired here rather than repaired: it could not load
     * (it imported three producers `notice-engine.ts` does not export, and scoped four
     * categories absent from the closed `NoticeCategory` taxonomy), and it had zero
     * runtime importers. Repairing it would have meant opening that taxonomy — which is
     * NTC-P2's own separately-gated rollout (Notice Engine Architecture §8), refused by
     * §9: "any new notice category without a registered owner behind it — stop."
     *
     * So there is no notice DELIVERY SCOPE owner to verify, and this domain declares that
     * as a gap rather than greping for one. The `cn-undeclared-category` check that stood
     * here is deleted, not replaced: it read `notice-gateway.ts` as text and tested for a
     * `cookbook-opportunity` category that exists in NEITHER file — so it passed
     * vacuously, over a module that threw `SyntaxError` on import. A green check that
     * verifies nothing is worse than an absent one, because it answers "is this covered?"
     * with yes. This is CONV1 P10's finding at a second gate: THE GATE IS A TEXT GREP.
     */
    knownGaps: [
      "NTC-P2 not built: the three ungoverned notice channels (/api/home/intelligence, " +
        "/api/planner/weeks/:weekId/intelligence, the WX7 pantry block) remain live and " +
        "unconverged. No notice delivery-scope owner exists to verify.",
    ],
    checks: [
      sourceCheck({
        id: "cn-one-assistant",
        law: "no-duplicate-runtime-identity",
        title: "Exactly one conversation gateway owns the assistant",
        severity: "fail",
        file: "server/intelligence/conversation/conversation-gateway.ts",
        pattern: /export const conversationGateway = new ConversationGateway\(/,
        expect: "present",
        violationDetail: "The single conversation gateway singleton is gone.",
        passDetail: "One assistant, one gateway singleton.",
      }),
    ],
  },

  // ── 16. Intelligence Platform ──────────────────────────────────────────────
  {
    id: "intelligence-platform",
    name: "Intelligence Platform",
    variant: "platform",
    canonicalOwner: "server/intelligence/intelligence-platform.ts (singleton)",
    authorisedWriters: ["server/intelligence/"],
    publicationPath: "runtime module — the singleton is the publication",
    runtimeReadPath: "one handle() choke point",
    knownGaps: [],
    checks: [
      sourceCheck({
        id: "ip-singleton",
        law: "no-duplicate-runtime-identity",
        title: "One platform singleton",
        severity: "fail",
        file: "server/intelligence/intelligence-platform.ts",
        pattern: /export const intelligencePlatform = new IntelligencePlatform\(\)/,
        expect: "present",
        violationDetail: "The intelligence platform singleton export is gone.",
        passDetail: "Single intelligencePlatform singleton.",
      }),
      sourceCheck({
        id: "ip-choke-point",
        law: "approved-read-path",
        title: "One handle() choke point routes every intent",
        severity: "fail",
        file: "server/intelligence/intelligence-platform.ts",
        pattern: /handle\(intent: Intent/,
        expect: "present",
        violationDetail: "The single handle() choke point is gone.",
        passDetail: "handle() remains the one routing door.",
      }),
    ],
  },

  // ── 17. Capability Registry ────────────────────────────────────────────────
  {
    id: "capability-registry",
    name: "Capability Registry",
    variant: "platform",
    canonicalOwner: "server/intelligence/capability-registry.ts",
    authorisedWriters: ["server/intelligence/capability-registry.ts (editorial)"],
    publicationPath: "committed module — the registry is the publication",
    runtimeReadPath: "the registry itself, via the Intelligence Platform",
    knownGaps: [],
    checks: [
      customCheck({
        id: "cr-domain-bridge",
        law: "no-sync-bridges",
        title: "No parallel capability list gates registered capabilities out",
        severity: "fail",
        cpi1: "S1-6",
        run: async (ctx) => {
          const guidance =
            ctx.sources.get("server/intelligence/conversation/companion-guidance.ts") ?? "";
          const bridgeIds = new Set(parseObjectLiteralKeys(guidance, "CAPABILITY_DOMAIN"));
          if (bridgeIds.size === 0) {
            return { violated: false, detail: "No CAPABILITY_DOMAIN bridge remains." };
          }
          const registered = new CapabilityRegistry().list().map((c) => c.id);
          const gatedOut = registered.filter((id) => !bridgeIds.has(id));
          return gatedOut.length > 0
            ? {
                violated: true,
                detail: `CAPABILITY_DOMAIN (${bridgeIds.size} ids) is used as a hard gate against a registry of ${registered.length} — silently unreachable: ${gatedOut.join(", ")}.`,
              }
            : { violated: false, detail: `CAPABILITY_DOMAIN covers all ${registered.length} registered capabilities.` };
        },
      }),
      customCheck({
        id: "cr-docs-drift",
        law: "no-publication-drift",
        title: "The published capability documentation matches the runtime registry",
        severity: "warn",
        cpi1: "S2-6",
        run: async () => {
          const docsDir = path.join(
            REPO_ROOT,
            "docs/product/intelligence/intelligence-capabilities",
          );
          let files: string[];
          try {
            files = fs.readdirSync(docsDir).filter((f) => f.startsWith("cap-") && f.endsWith(".md"));
          } catch {
            return { violated: true, detail: `${docsDir} is unreadable — the published capability list cannot be verified.` };
          }
          const documented = new Set(files.map((f) => f.replace(/^cap-/, "").replace(/\.md$/, "")));
          const registered = new CapabilityRegistry().list().map((c) => c.id);
          const undocumented = registered.filter((id) => !documented.has(id));
          const phantom = [...documented].filter((id) => !registered.includes(id));
          if (undocumented.length === 0 && phantom.length === 0) {
            return { violated: false, detail: `All ${registered.length} registered capabilities are documented, with no phantom entries.` };
          }
          const parts: string[] = [];
          if (undocumented.length > 0) parts.push(`${undocumented.length} registered but undocumented (${undocumented.join(", ")})`);
          if (phantom.length > 0) parts.push(`${phantom.length} documented but unregistered (${phantom.join(", ")})`);
          return { violated: true, detail: `Capability documentation drift: ${parts.join("; ")}.` };
        },
      }),
    ],
  },

  // ── 18. Decision Engine ────────────────────────────────────────────────────
  {
    id: "decision-engine",
    name: "Decision Engine",
    variant: "platform",
    canonicalOwner: "server/intelligence/opportunity-delivery/framework.ts",
    authorisedWriters: ["server/intelligence/opportunity-delivery/"],
    publicationPath: "runtime module — one enrolment door",
    runtimeReadPath: "the framework's delivery pipeline",
    knownGaps: [],
    checks: [
      sourceCheck({
        id: "de-framework",
        law: "approved-read-path",
        title: "The canonical delivery contract remains the one enrolment door",
        severity: "fail",
        file: "server/intelligence/opportunity-delivery/framework.ts",
        pattern: /OpportunityDeliveryBundle/,
        expect: "present",
        violationDetail: "The opportunity delivery framework contract is gone.",
        passDetail: "One enrolment door, one delivery contract.",
      }),
    ],
  },

  // ── 19. Product Knowledge ──────────────────────────────────────────────────
  {
    id: "product-knowledge",
    name: "Product Knowledge",
    variant: "knowledge",
    canonicalOwner: "docs/product/inventory/product.yaml (single act of authorship, PKR17)",
    authorisedWriters: ["scripts/build-product-inventory.ts"],
    publicationPath: "scripts/build-product-inventory.ts → docs/product/inventory/product.json",
    runtimeReadPath: "product.json only (PKR21), via the registered capability",
    sotRegisterRef: "D29",
    knownGaps: [
      "Prose front-matter drift across docs/product/ entries is not yet machine-checked (CPI1 S3-7).",
    ],
    checks: [
      customCheck({
        id: "pk-yaml-json-parity",
        law: "no-publication-drift",
        title: "The published product.json equals the authored product.yaml",
        severity: "fail",
        cpi1: "S3-7",
        run: async () => {
          let yamlText: string;
          let jsonText: string;
          try {
            yamlText = fs.readFileSync(path.join(REPO_ROOT, "docs/product/inventory/product.yaml"), "utf8");
            jsonText = fs.readFileSync(path.join(REPO_ROOT, "docs/product/inventory/product.json"), "utf8");
          } catch (err) {
            return { violated: true, detail: `Inventory unreadable: ${(err as Error).message}` };
          }
          const yamlIds = [...yamlText.matchAll(/^\s*- id:\s*(\S+)/gm)].map((m) => m[1]);
          let jsonIds: string[] = [];
          try {
            const parsed = JSON.parse(jsonText) as { entries?: Array<{ id?: string }> };
            jsonIds = (parsed.entries ?? []).map((e) => String(e.id));
          } catch (err) {
            return { violated: true, detail: `product.json does not parse: ${(err as Error).message}` };
          }
          const missing = yamlIds.filter((id) => !jsonIds.includes(id));
          const extra = jsonIds.filter((id) => !yamlIds.includes(id));
          if (missing.length === 0 && extra.length === 0) {
            return { violated: false, detail: `product.json carries all ${yamlIds.length} authored entries; no drift.` };
          }
          const parts: string[] = [];
          if (missing.length > 0) parts.push(`authored but unpublished: ${missing.join(", ")}`);
          if (extra.length > 0) parts.push(`published but unauthored: ${extra.join(", ")}`);
          return { violated: true, detail: `Publication drift (${parts.join("; ")}).` };
        },
      }),
      customCheck({
        id: "pk-generators-wired",
        law: "no-publication-drift",
        title: "The publication and verification generators are wired to npm",
        severity: "warn",
        cpi1: "S3-9",
        run: async () => {
          let pkg: { scripts?: Record<string, string> };
          try {
            pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "package.json"), "utf8"));
          } catch (err) {
            return { violated: true, detail: `package.json unreadable: ${(err as Error).message}` };
          }
          const scripts = Object.values(pkg.scripts ?? {}).join("\n");
          const unwired = ["build-product-inventory", "verify-product-inventory"].filter(
            (s) => !scripts.includes(s),
          );
          return unwired.length > 0
            ? { violated: true, detail: `Publication generators reachable only by hand — not in any npm script: ${unwired.join(", ")}. Correctness rests on human discipline alone.` }
            : { violated: false, detail: "Publication generators are npm-wired." };
        },
      }),
    ],
  },

  // ── 20. Benchmarks ─────────────────────────────────────────────────────────
  {
    id: "benchmarks",
    name: "Benchmarks",
    variant: "knowledge",
    canonicalOwner: "server/tests/benchmark/history.ts",
    authorisedWriters: ["server/tests/benchmark/ (operator-invoked runs)"],
    publicationPath: "benchmark runs → docs/intelligence/benchmark/history/",
    runtimeReadPath: "admin API",
    knownGaps: [
      "Benchmark history currency is not machine-checked (CPI1: stale since 2026-07-10).",
    ],
    checks: [
      sourceCheck({
        id: "bm-runtime-writes-docs",
        law: "authorised-writers",
        title: "The runtime does not publish into docs/",
        severity: "warn",
        cpi1: "S3-6",
        file: "server/tests/benchmark/history.ts",
        pattern: /writeFileSync/,
        expect: "absent",
        violationDetail:
          "history.ts writeFileSyncs into docs/intelligence/benchmark/history/ from a runtime API route — collapsing the owner→publication boundary, silently lossy on an ephemeral filesystem.",
        passDetail: "Runtime no longer writes into docs/.",
      }),
    ],
  },

  // ── 21. Community ──────────────────────────────────────────────────────────
  {
    id: "community",
    name: "Community",
    variant: "platform",
    canonicalOwner: "shared/recipe-acquisition.ts (reserved 'community_cookbook' lane)",
    authorisedWriters: [],
    publicationPath: "none — reserved vocabulary, no runtime feature yet (by design)",
    runtimeReadPath: "none (dormant)",
    knownGaps: [],
    checks: [
      sourceCheck({
        id: "cm-reserved-lane",
        law: "one-owner",
        title: "The community lane is reserved in the canonical vocabulary",
        severity: "fail",
        file: "shared/recipe-acquisition.ts",
        pattern: /community_cookbook/,
        expect: "present",
        violationDetail: "The reserved community_cookbook lane is gone from the acquisition vocabulary.",
        passDetail: "Reserved lane declared exactly once, with documented dormancy.",
      }),
      sqlCheck({
        id: "cm-no-phantom-rows",
        law: "no-publication-drift",
        title: "The dormant lane holds no rows before the feature exists",
        severity: "warn",
        sql: `SELECT count(*)::int AS n FROM meals WHERE acquisition_lane = 'community_cookbook'`,
        evaluate: (rows) => {
          const n = Number(rows[0]?.n ?? 0);
          return n > 0
            ? { violated: true, detail: `${n} meal row(s) occupy the dormant community_cookbook lane — a phantom owner.` }
            : { violated: false, detail: "Dormant lane is empty, as designed." };
        },
      }),
    ],
  },

  // ── 23. Household Time (TIME3) ─────────────────────────────────────────────
  // Landed by CONV1 P5 / OWN-4, in the SAME CHANGE as the module it verifies —
  // THA_HOUSEHOLD_TIME_ARCHITECTURE.md § 16 requires exactly that, and CONV1's
  // risk R1 ("the declared owners are never built") is closed by this entry
  // existing at all: a convergence is finished when a gate can fail (CP10).
  //
  // Household Time has NO PROJECTION, and stating why is the point. It is not
  // seed-owned (no seed), not knowledge (no claim, no source, no reviewedAt), and
  // not database-owned (it owns the RULES of household time and none of its data).
  // Its owner is the module; its publication is nothing; its runtime read path is
  // the module itself. So:
  //
  //   VERIFICATION IS THAT NO SECOND IMPLEMENTATION EXISTS (HT18).
  //
  // For a pure vocabulary, drift is not a stale row — it is a RIVAL COPY. The gate
  // that matters is the one that fails when someone writes a sixth getGreeting().
  // These checks are therefore RATCHETS over source, not queries over data.
  {
    id: "household-time",
    name: "Household Time (TIME3)",
    variant: "platform",
    canonicalOwner: "shared/time/household-time.ts (reference vocabulary, Principle 5 — no DB owner)",
    authorisedWriters: [],
    publicationPath: "none — the module IS the publication (no projection, by design)",
    runtimeReadPath: "shared/time/household-time.ts (direct import)",
    sotRegisterRef: "Appendix A (Household Time) / D14 / D16",
    knownGaps: [
      "BOTH FACTS NOW EXIST: the module (P5/OWN-4), households.timeZone (P5/SCH-1) and planner_weeks.weekStartDate (P7/SCH-2, 2026-07-17). The declaration is fully discharged. This entry previously read 'planner_weeks.weekStartDate does NOT [exist]' — corrected in the same change that made it false (DOC-4).",
      "EVERY WEEK THAT EXISTED BEFORE 2026-07-17 IS UNANCHORED, AND STAYS THAT WAY FOREVER (HT7). resolvePlannerWeek answers anchored:false for them, and that is the honest floor, NOT a defect and NOT a migration backlog: the only moment THA could know what those weeks meant has passed. Only weeks created from P7 onward carry an anchor. The one legitimate route to anchoring an existing week is the household DECLARING it (TIME1 § 6.2) — an extension point, not built.",
      "Phase 3 (CONV1 P6) is DONE for the T2/T3 consumers: the Companion's temporal anchor (READ-4), the freezer's write/comparison (BEH-6), the diary's day and copy-from-planner (SCH-4), and the four getGreeting() copies now read the owner. NO T5 CONSUMER HAS CONVERGED: the five rival 'current weeks', streaks and savings still guess, and now have an anchor to read — that is CONV1 P8, not P7. product_history.scannedAt and user_health_trends.date still compare text dates across frames.",
      "user_streaks.weekStartDate is a SIXTH private notion of a week (schema.ts, written by routes.ts via upsertUserStreak from a rival Monday). It is a different fact on a different table and is deliberately NOT gated by the anchor checks here, which are scoped to plannerWeeks. Converging it is CONV1 P8 (OWN-2/BEH-9). Recorded rather than swept in: a gate that fires falsely is worse than no gate (CONV1 R2).",
      "The greeting's WORDS are still client-side strings outside the Personality Registry. That is INT21's, not Household Time's: § 9 schedules it as CP3. CONV1 P6 converged the clock and collapsed four copies to one site, which is CP3's remaining surface.",
    ],
    checks: [
      sourceCheck({
        id: "ht-owner-exists",
        law: "one-owner",
        title: "The declared owner of household time exists (HT1)",
        severity: "fail",
        file: "shared/time/household-time.ts",
        pattern: /export function householdToday/,
        expect: "present",
        violationDetail:
          "shared/time/household-time.ts does not exist or no longer exports the contract. The Source of Truth Register's Appendix A declares it the owner of household time; a declared owner nobody builds is a 21st time implementation with better manners (CONV1 R1).",
        passDetail:
          "The canonical owner exists and exports the § 6 contract (CONV1 P5 / OWN-4).",
      }),
      customCheck({
        id: "ht-reads-no-clock",
        law: "one-owner",
        title: "The owner reads no clock — `now` is a parameter (HT5)",
        severity: "fail",
        run: async (ctx) => {
          const src = ctx.sources.get("shared/time/household-time.ts");
          if (src === undefined) {
            return { violated: true, detail: "shared/time/household-time.ts is missing." };
          }
          // Comments discuss the rule; only code may violate it.
          const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
          const ambient = /new Date\(\)|Date\.now\(\)|getTimezoneOffset/.test(code);
          return ambient
            ? {
                violated: true,
                detail:
                  "household-time.ts reads an ambient clock. HT5: `now` is a parameter, never an ambient read — it is what makes the module testable, replayable and incapable of disagreeing with itself.",
              }
            : { violated: false, detail: "The module reads no clock; every instant is supplied by the caller (HT5)." };
        },
      }),
      customCheck({
        id: "ht-no-rival-season",
        law: "no-duplicate-runtime-identity",
        title: "The season rule has exactly one implementation (HT17, OWN-3)",
        severity: "fail",
        run: async (ctx) => {
          // The retired shape: a month read followed directly by a season return.
          // CONV1 OWN-3 found this THREE times — and two of them used different
          // month bases, so a reviewer diffing them saw different numbers and
          // could not tell they agreed.
          const rivals: string[] = [];
          ctx.sources.forEach((content, file) => {
            if (file === "shared/seasonal/season-rule.ts") return;
            if (file.startsWith("server/tests/")) return;
            if (file.startsWith("server/verification/")) return;
            const code = content.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
            if (/getMonth\(\)[\s\S]{0,400}?return\s+"(spring|summer|autumn|winter)"/.test(code)) {
              rivals.push(file);
            }
          });
          return rivals.length > 0
            ? {
                violated: true,
                detail: `${rivals.length} rival season implementation(s) re-derive the season from a month: ${rivals.join(", ")}. The declared owner is shared/seasonal/season-rule.ts (Register Domain 11); CONV1 P5 (OWN-3) converged three into one.`,
              }
            : {
                violated: false,
                detail: "One season rule: shared/seasonal/season-rule.ts (Domain 11). Three implementations converged to one (CONV1 P5 / OWN-3).",
              };
        },
      }),
      customCheck({
        id: "ht-time-owns-no-season",
        law: "one-owner",
        title: "Household Time supplies the season's input, never its answer (HT17)",
        severity: "fail",
        run: async (ctx) => {
          const src = ctx.sources.get("shared/time/household-time.ts") ?? "";
          const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
          return /"(spring|summer|autumn|winter)"/.test(code)
            ? {
                violated: true,
                detail:
                  "household-time.ts computes a season. HT17: season is NOT Household Time — a season computed inside the time module is the second owner Principle 2 forbids. The module supplies a civil date; shared/seasonal/season-rule.ts answers.",
              }
            : { violated: false, detail: "The time module owns no season (HT17)." };
        },
      }),
      customCheck({
        id: "ht-no-rival-greeting",
        law: "no-duplicate-runtime-identity",
        title: "The time-of-day greeting has exactly one implementation (§ 14 target 3)",
        severity: "fail",
        run: async (ctx) => {
          // THE GATE § 16 NAMES BY NAME: "the gate that matters is the one that
          // fails when someone writes a sixth getGreeting()".
          //
          // CONV1 P6 converged four (dashboard.tsx, HomeIntelligenceCompanion.tsx
          // — boundary 17; two arrival prototypes — boundary 18) onto
          // client/src/lib/greeting.ts, which reads householdPhase() and never an
          // ambient hour. The retired shape is exact: an ambient hour read
          // reaching a greeting word. Four authors each wrote it privately, and a
          // phone left on US time said "Good evening" to a household eating
          // breakfast in London.
          const rivals: string[] = [];
          ctx.sources.forEach((content, file) => {
            if (file.startsWith("server/tests/")) return;
            if (file.startsWith("server/verification/")) return;
            const code = content.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
            if (/getHours\(\)[\s\S]{0,400}?"Good (morning|afternoon|evening)"/.test(code)) {
              rivals.push(file);
            }
          });
          return rivals.length > 0
            ? {
                violated: true,
                detail: `${rivals.length} rival greeting implementation(s) derive a greeting from an ambient hour: ${rivals.join(", ")}. The phase belongs to shared/time/household-time.ts (householdPhase — the household's hour, not the device's) and the one greeting site is client/src/lib/greeting.ts. CONV1 P6 converged four into one; the words themselves are INT21's and are scheduled as CP3.`,
              }
            : {
                violated: false,
                detail: "One time-of-day greeting: client/src/lib/greeting.ts, over householdPhase(). Four copies converged to one (CONV1 P6); no surface reads an ambient hour to greet.",
              };
        },
      }),
      customCheck({
        id: "ht-companion-anchor-is-the-households",
        law: "one-owner",
        title: "The Companion's TODAY is the household's, not UTC's (READ-4, HT12)",
        severity: "fail",
        run: async (ctx) => {
          const file = "server/intelligence/conversation/context-frame-assembler.ts";
          const src = ctx.sources.get(file);
          if (src === undefined) {
            return { violated: true, detail: `${file} is missing — the temporal anchor has no home.` };
          }
          const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
          // The retired line, verbatim: `new Date().toISOString().slice(0, 10)`.
          // Its own doc comment claimed it "grounds the LLM to today"; it grounded
          // the LLM to UTC's today, and it became BOTH the `TODAY:` in the system
          // prompt AND the diary day the Companion reads and writes. It is the
          // single highest-leverage line in the platform (CONV1 READ-4).
          if (/toISOString\(\)\s*\.\s*slice\(\s*0\s*,\s*10\s*\)/.test(code)) {
            return {
              violated: true,
              detail: `${file} serialises an instant through UTC to make a civil date. HT12 — the device may supply the instant; it may never decide the day. The anchor must be formatCivilDate(householdToday(now, zone)) over the household's own zone (CONV1 P6 / READ-4).`,
            };
          }
          if (!/householdToday\s*\(/.test(code)) {
            return {
              violated: true,
              detail: `${file} no longer derives its temporal anchor from householdToday(). The Companion's TODAY must come from the one owner of household time (HT1), or it is a 21st private clock.`,
            };
          }
          return {
            violated: false,
            detail: "The Companion's temporal anchor is the household's civil date, derived by shared/time/household-time.ts from the household's zone (CONV1 P6 / READ-4).",
          };
        },
      }),
      customCheck({
        id: "ht-nothing-derived-is-stored",
        law: "no-sync-bridges",
        title: "Nothing derived from household time is stored (HT3)",
        severity: "fail",
        run: async (ctx) => {
          // A column holding today / this week / the phase / the current planner
          // week is a permanent sync bridge (Principle 7): it is wrong the moment
          // the clock moves, and a job to refresh it is the bridge itself.
          const schema = ctx.sources.get("shared/schema.ts") ?? "";
          const stored = [
            /\btodayDate\b|"today_date"/,
            /\bcurrentWeekNumber\b|"current_week_number"/,
            /\bphaseOfDay\b|"phase_of_day"/,
            /\bcachedToday\b|"cached_today"/,
          ].filter((p) => p.test(schema));
          return stored.length > 0
            ? {
                violated: true,
                detail:
                  "shared/schema.ts declares a column holding a household-time DERIVATION (today / current week / phase). HT3: nothing derived is stored — determinism, not memoisation. activity_summary is the register's own cautionary precedent (a derived cache that drifted).",
              }
            : {
                violated: false,
                detail: "No derivation of household time is stored; today, this week and the phase are computed (HT3).",
              };
        },
      }),
      customCheck({
        id: "ht-instant-domains-clean",
        law: "one-owner",
        title: "The five MUST-NOT-consume domains hold no clock of the household's (HT10, CP6)",
        severity: "fail",
        run: async (ctx) => {
          // A PERMANENT VERDICT, not a backlog. Trial, Auth, Learning, Caching and
          // Observation are correct BECAUSE they are INSTANT: a duration is not a
          // date. "Converging" one would be a new defect wearing a canonical badge.
          const forbidden: Array<[string, string]> = [
            ["server/lib/access.ts", "Trial / Subscription"],
            ["server/intelligence/evidence-learning/evidence-learning-store.ts", "Learning / Evidence"],
          ];
          const offenders: string[] = [];
          for (const [file, domain] of forbidden) {
            const content = ctx.sources.get(file);
            if (content === undefined) continue;
            if (/from ["'].*time\/household-time|householdToday|householdPhase/.test(content)) {
              offenders.push(`${domain} (${file})`);
            }
          }
          return offenders.length > 0
            ? {
                violated: true,
                detail: `An INSTANT domain consumes Household Time: ${offenders.join(", ")}. HT10/CP6 — a trial's length or an evidence window must never depend on where a family lives. This is a permanent verdict, not a migration backlog.`,
              }
            : {
                violated: false,
                detail: "The INSTANT domains consume no household clock — correct because a duration is not a date (HT9).",
              };
        },
      }),
      customCheck({
        id: "ht-zone-is-the-homes",
        law: "one-owner",
        title: "The zone is a property of the home, and there is one of it (HT4, HT2)",
        severity: "fail",
        run: async (ctx) => {
          const schema = ctx.sources.get("shared/schema.ts") ?? "";
          // Parse each table's own declaration block. A bare regex over the whole
          // file cannot answer "which TABLE declares this column" — it matches the
          // word `users` anywhere within reach of the column and reports a
          // split-brain that does not exist. A gate that fires falsely is worse
          // than no gate (CONV1 R2), so the question is asked per table.
          const householdKeys = parseObjectLiteralKeys(schema, "households");
          if (!householdKeys.includes("timeZone")) {
            return {
              violated: true,
              detail:
                "households.timeZone is not declared in shared/schema.ts. HT2: the zone is one of Household Time's two facts, owned by Domain 16 — the platform cannot answer 'what time is it for this household' without it (CONV1 P5 / SCH-1).",
            };
          }
          // HT4 — per-member zones are refused: a split-brain over one shared plan.
          const rivalScopes = (["users", "householdMembers", "userPreferences"] as const).filter(
            (table) => parseObjectLiteralKeys(schema, table).includes("timeZone"),
          );
          return rivalScopes.length > 0
            ? {
                violated: true,
                detail: `A time zone is declared on ${rivalScopes.join(", ")} as well as households. HT4: the zone is a property of the HOME, never of the device, the session or the member — per-member zones are a split-brain over one shared plan.`,
              }
            : {
                violated: false,
                detail: "One zone, on the household (Domain 16) — a clock is a property of the home (HT4).",
              };
        },
      }),
      customCheck({
        id: "ht-anchor-is-the-planners",
        law: "one-owner",
        title: "The anchor exists, on the planner week, and the rejected household epoch does not (HT2, SCH-2)",
        severity: "fail",
        run: async (ctx) => {
          const schema = ctx.sources.get("shared/schema.ts") ?? "";
          if (!parseObjectLiteralKeys(schema, "plannerWeeks").includes("weekStartDate")) {
            return {
              violated: true,
              detail:
                "planner_weeks.weekStartDate is not declared in shared/schema.ts. HT2: the anchor is the second of Household Time's two facts, owned by Domain 14 — without it resolvePlannerWeek can only answer anchored:false, and every T5 consumer (the five rival 'current weeks', streaks, savings) stays unconvergeable (CONV1 P7 / SCH-2).",
            };
          }
          // TIME1 § 6.1 design (a) — "slot 1 began on date D", derive slot N = D + 7(N−1)
          // — was REJECTED: it assumes the six slots stay calendar-consecutive, which
          // nothing enforces, and that is the assumption approxDate already makes and is
          // already wrong about. A household epoch would encode today's fabrication as a
          // schema. The anchor is PER WEEK so a household who skips a week is
          // representable, and resolution is a LOOKUP, never arithmetic.
          const epochScopes = (["households", "users", "userPreferences"] as const).filter((table) => {
            const keys = parseObjectLiteralKeys(schema, table);
            return keys.some((k) => /^(plannerEpoch|plannerStartDate|weekEpoch|plannerWeekStartDate)$/.test(k));
          });
          return epochScopes.length > 0
            ? {
                violated: true,
                detail: `A planner epoch is declared on ${epochScopes.join(", ")}. TIME1 § 6.1 REJECTED design (a): deriving slot N from a household-level start date assumes the six slots are calendar-consecutive, and nothing enforces that. The anchor is per-week (Domain 14) so that a household who skipped a week is representable and resolution stays a lookup.`,
              }
            : {
                violated: false,
                detail: "One anchor, per planner week (Domain 14) — the per-week design TIME1 § 6.1 adopted; no household epoch exists (CONV1 P7 / SCH-2).",
              };
        },
      }),
      customCheck({
        id: "ht-anchor-is-never-back-filled",
        law: "one-owner",
        title: "The anchor is never back-filled — NULL is the answer, not a bug (HT7, CONV1 R5)",
        severity: "fail",
        run: async (ctx) => {
          // THE R5 GATE. The column is trivial; the danger is the one-line UPDATE that
          // "fixes" the NULLs and looks like housekeeping. THA cannot know which calendar
          // week a household's existing Week 3 meant (TIME1 § 6.2) — a back-filled anchor
          // is approxDate with a schema, indistinguishable from a real one, which is what
          // makes it worse than an absent one. A comment cannot stop this; a gate can.
          const strip = (s: string) =>
            s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

          // 1. The sanctioned DDL path: no migration may UPDATE the anchor, and none may
          //    add it with a DEFAULT — a DEFAULT back-fills every existing row silently,
          //    which is the same fabrication wearing an ALTER's clothes.
          const runner = strip(ctx.sources.get("server/migrations/runner.ts") ?? "");
          if (/UPDATE\s+planner_weeks[\s\S]{0,400}?week_start_date/i.test(runner)) {
            return {
              violated: true,
              detail:
                "A migration UPDATEs planner_weeks.week_start_date. HT7 is absolute: the anchor is written ONLY at creation and NEVER back-filled. Existing rows stay NULL forever — the moment THA could honestly know what those weeks meant has passed, and guessing is the approxDate this architecture exists to retire (CONV1 R5).",
            };
          }
          if (/ADD\s+COLUMN[\s\S]{0,120}?week_start_date[\s\S]{0,120}?DEFAULT/i.test(runner)) {
            return {
              violated: true,
              detail:
                "A migration adds planner_weeks.week_start_date WITH A DEFAULT. That back-fills every existing row in one statement — the same fabrication as an UPDATE, wearing an ALTER's clothes. The column must be nullable with no default: NULL is the honest answer for every week created before the anchor existed (HT7, CONV1 R5).",
            };
          }

          // 2. The application: no update path may set it. Scoped to plannerWeeks by
          //    parsing the .set({...}) that belongs to `.update(plannerWeeks)` — because
          //    user_streaks carries its OWN weekStartDate (a different fact, and the sixth
          //    private notion of a week), and a gate that fires falsely is worse than no
          //    gate (CONV1 R2).
          const offenders: string[] = [];
          for (const [file, raw] of Array.from(ctx.sources)) {
            if (file.startsWith("server/verification/") || file.startsWith("server/tests/")) continue;
            const code = strip(raw);
            if (!/plannerWeeks|planner_weeks/.test(code)) continue;
            const updates = Array.from(
              code.matchAll(/\.update\(\s*plannerWeeks\s*\)[\s\S]{0,200}?\.set\(\s*\{([\s\S]*?)\}\s*\)/g),
            );
            for (const m of updates) {
              if (/weekStartDate/.test(m[1])) offenders.push(file);
            }
            if (/UPDATE\s+planner_weeks[\s\S]{0,200}?week_start_date/i.test(code)) offenders.push(file);
          }
          if (offenders.length > 0) {
            return {
              violated: true,
              detail: `${Array.from(new Set(offenders)).join(", ")} updates planner_weeks.weekStartDate after creation. HT7: the anchor is an observation of the present made at the moment the six slots are made consecutive — it is never revised and never back-filled. The only legitimate route to anchoring an existing week is the HOUSEHOLD declaring it (TIME1 § 6.2), which is an extension point and is not this (CONV1 R5).`,
            };
          }
          return {
            violated: false,
            detail:
              "No migration and no code path back-fills the anchor. Weeks created before CONV1 P7 hold NULL and keep it, which resolvePlannerWeek states honestly as anchored:false (HT6/HT7).",
          };
        },
      }),
      customCheck({
        id: "ht-one-planner-week-owner",
        law: "no-duplicate-runtime-identity",
        title: "There is ONE answer to 'which planner week is this household living in?' (HT1, READ-3)",
        severity: "fail",
        run: async (ctx) => {
          // CONV1 P8 / READ-3. THA had FIVE answers and none was a computation:
          // three server `max(weekNumber)` variants (≡ the constant 6), the dashboard's
          // `plannerFull[0]` (≡ 1) and Home's localStorage (≡ 1). The gate that matters is
          // the one that fails when someone writes a sixth.
          const owner = "server/lib/household-planner-week.ts";
          if (!ctx.sources.has(owner)) {
            return {
              violated: true,
              detail: `${owner} is missing — the one server-side answer to "which planner week is this household living in?" has no home. Without it every consumer derives its own, which is the five rivals READ-3 retired.`,
            };
          }
          const strip = (s: string) =>
            s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
          // A rival is any consumer picking the household's current week out of the rota
          // itself: reduce/sort/max over weekNumber, or the first row of the planner.
          const RIVALS: Array<[RegExp, string]> = [
            [/\.reduce\(\s*\((?:\w+),\s*(?:\w+)\)\s*=>[\s\S]{0,120}?weekNumber\s*>/, "reduce(max weekNumber) — the constant 6, not a computation"],
            [/Math\.max\([\s\S]{0,60}?\.map\(\s*\w+\s*=>\s*\w+\.weekNumber/, "Math.max over weekNumber"],
            [/plannerFull\s*\[\s*0\s*\]/, "plannerFull[0] — a fact about array order, not the household"],
            [/localStorage\.getItem\(\s*["'`]planner:active-week/, "localStorage — HOME3 §4: not household state"],
          ];
          const offenders: string[] = [];
          for (const [file, raw] of Array.from(ctx.sources)) {
            if (file.startsWith("server/verification/") || file.startsWith("server/tests/")) continue;
            // The owner itself, and the planner's own view state, are not rivals.
            if (file === owner) continue;
            // The planner page and its helpers legitimately track WHICH WEEK AM I EDITING
            // — device-local view state, which is nobody's idea of a household fact. The
            // defect OWN-6 retired was HOME reading it as the CURRENT week.
            if (
              file === "client/src/pages/weekly-planner-page.tsx" ||
              file === "client/src/hooks/use-week-meal-entries.ts" ||
              file === "client/src/components/AddToWeekModal.tsx" ||
              file.startsWith("client/src/pages/dev/")
            ) continue;
            const code = strip(raw);
            // CONV1 P9 DELETED THE EXCISION P8 LEFT HERE, exactly as P8 instructed:
            // "WHEN P9 RETIRES approxDate, DELETE THIS BLOCK — it is the only thing
            // standing between that function and this gate."
            //
            // P8 had to excise `buildHouseholdHistory`'s body by name, because its
            // `maxWeek` ordered the rota to fabricate a date and converging it before the
            // fabricator was retired would have made a fabricated date precisely wrong
            // ("the worst outcome available" — CONV1 R3/§4.1). BEH-5 retired the
            // fabricator on 2026-07-17: `maxWeek`, `weeksAgo`, `now` and both copies of
            // the function are gone. **The exemption has nothing left to protect, so the
            // whole of routes.ts is held to this gate again** — which is the point of
            // writing a temporary exemption down instead of leaving it to be discovered.
            for (const [pattern, why] of RIVALS) {
              if (pattern.test(code)) offenders.push(`${file} (${why})`);
            }
          }
          return offenders.length > 0
            ? {
                violated: true,
                detail: `${offenders.length} rival "current week" implementation(s) derive the household's planner week without asking the owner: ${offenders.join("; ")}. HT1 — a second implementation of any T1–T5 derivation is an architecture violation on arrival. Ask ${owner} (READ-3).`,
              }
            : {
                violated: false,
                detail: `One answer to "which planner week is this household living in?", in ${owner}, over resolvePlannerWeek (CONV1 P8 / READ-3). The five rivals are retired.`,
              };
        },
      }),
      customCheck({
        id: "ht-unanchored-is-never-filled-in",
        law: "one-owner",
        title: "No consumer invents a week when the owner says it cannot know (HT6, BEH-3)",
        severity: "fail",
        run: async (ctx) => {
          // THE GATE FOR THE GOVERNING DECISION OF 2026-07-17 (§ 13.1, as amended).
          //
          // 192 of 195 households are unanchored FOREVER (HT7), so `anchored: false` is
          // the ORDINARY answer, and the temptation to paper over it with `?? 1` or
          // "the latest week" is exactly how the platform grew five rivals. BEH-3 forbids
          // it by name: "do not pick a week to fix it". A comment cannot stop this; a
          // gate can.
          const strip = (s: string) =>
            s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
          const offenders: string[] = [];
          for (const [file, raw] of Array.from(ctx.sources)) {
            if (file.startsWith("server/verification/") || file.startsWith("server/tests/")) continue;
            const code = strip(raw);
            if (!/anchored/.test(code)) continue;
            // `!anchored → substitute a week number` in any of its idioms.
            const FILLS: Array<[RegExp, string]> = [
              [/anchored\s*\?[\s\S]{0,80}?:\s*\{?\s*weekNumber:\s*\d/, "a literal weekNumber substituted when unanchored"],
              [/(?:weekNumber|activeWeek|currentWeek)\s*=\s*[\s\S]{0,40}?\?\?\s*1\b/, "?? 1 — the localStorage default, resurrected"],
              [/!\s*\w*[Aa]nchored[\s\S]{0,60}?return\s+weeks\[weeks\.length - 1\]/, "the latest week substituted when unanchored"],
            ];
            for (const [pattern, why] of FILLS) {
              if (pattern.test(code)) offenders.push(`${file} (${why})`);
            }
          }
          return offenders.length > 0
            ? {
                violated: true,
                detail: `${offenders.join("; ")} fills in a week the owner said it could not know. HT6 — "anchored: false" is a first-class ANSWER, not a gap to paper over, and it is the permanent truth for the 192 of 195 households whose weeks predate the anchor (HT7). Render the honest state; do not pick a week (BEH-3; THA_HOUSEHOLD_TIME_ARCHITECTURE.md § 13.1 as amended by CONV1 P8).`,
              }
            : {
                violated: false,
                detail: "No consumer substitutes a week when the owner answers `anchored: false`. The unanchored state is stated, not filled in (CONV1 P8 / BEH-3).",
              };
        },
      }),
      customCheck({
        id: "ht-no-fabricated-dates",
        law: "one-owner",
        title: "No date is invented from a week number (BEH-5, Core Principle 6)",
        severity: "fail",
        run: async (ctx) => {
          // CONV1 P9 / BEH-5 — the last live fabrication in the time family.
          //
          // `approxDate = now − (weeksAgo × 7 + max(0, 6 − dayOfWeek))` reduced to
          // `reportedDay = (now.getDay() + dayOfWeek + 1) mod 7`: the weekday Stories
          // reported was THE DAY THE HOUSEHOLD OPENED THE APP. "Friday became curry
          // night" was a fact about the request. It existed in TWO copies (TIME3 § 14
          // target 5 — "2 → 0"), one of them a closure duplicating the very module
          // extracted to prevent it.
          //
          // A date is now a LOOKUP over `planner_weeks.weekStartDate`, or it is null.
          // The shape this gate forbids is the one that made the defect possible:
          // deriving a calendar position from a week NUMBER and a clock.
          const strip = (s: string) =>
            s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
          const offenders: string[] = [];
          for (const [file, raw] of Array.from(ctx.sources)) {
            if (file.startsWith("server/verification/") || file.startsWith("server/tests/")) continue;
            const code = strip(raw);
            if (/\bapproxDate\b/.test(code)) {
              offenders.push(`${file} (approxDate — a date invented at request time)`);
              continue;
            }
            // The arithmetic itself, under any name: a clock, minus a multiple of a week
            // index, to make a calendar position.
            if (/now\.getTime\(\)\s*-\s*\([\s\S]{0,120}?week[\s\S]{0,60}?\*\s*7/i.test(code)) {
              offenders.push(`${file} (a date derived from now − weeks × 7 — approxDate under another name)`);
            }
          }
          if (offenders.length > 0) {
            return {
              violated: true,
              detail: `${offenders.join("; ")} invents a date from a week number and a clock. BEH-5 — the planner's weekNumber is a SLOT LABEL, not a time coordinate (TIME1 § 3.1); a date built from it is fiction, and every story told on top of it is an invented fact about a household's life told in the household's own voice. A planner entry's date is a LOOKUP over planner_weeks.weekStartDate (CONV1 P7), or it is null (HT6 / Core Principle 6).`,
            };
          }
          return {
            violated: false,
            detail: "No date is invented from a week number. A planner entry is dated from its week's anchor, or it is honestly undated (CONV1 P9 / BEH-5).",
          };
        },
      }),
      customCheck({
        id: "ht-stories-tell-no-undated-story",
        law: "one-owner",
        title: "A story may only be told about an entry THA can date (BEH-5, HT6)",
        severity: "fail",
        run: async (ctx) => {
          // The fabricator is gone; this is the gate that stops it growing back in a new
          // shape. Every one of the five story types makes a claim about WHEN — the
          // weekday, the 180-day favourite gate, "this spring", the season, the journey's
          // ordering — so a story engine that accepts an undated entry has re-opened the
          // defect, whatever it does with it.
          const types = ctx.sources.get("shared/stories/types.ts") ?? "";
          if (!/date:\s*Date\s*\|\s*null/.test(types)) {
            return {
              violated: true,
              detail:
                "shared/stories/types.ts no longer declares `date: Date | null`. An entry THA cannot date must be REPRESENTABLE as undated, or the route layer is forced to invent one — which is precisely how approxDate was born (BEH-5). 192 of 195 households have planner weeks that predate the anchor and can never be dated (HT7).",
            };
          }
          if (!/export function isDated/.test(types)) {
            return {
              violated: true,
              detail:
                "The `isDated` guard is gone. It is the seam that makes an undated entry unrepresentable inside a story function, so a future story cannot forget the rule (BEH-5).",
            };
          }
          const engine = (ctx.sources.get("shared/stories/engine.ts") ?? "")
            .replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
          if (!/household\.entries\.filter\(isDated\)/.test(engine)) {
            return {
              violated: true,
              detail:
                "shared/stories/engine.ts no longer filters to dated entries at its seam. Every story type claims a WHEN; telling one about an undated entry is the fabrication BEH-5 retired. Silence is the honest answer, and Stories' own first principles already require it ('Memory, never report card'; 'Trust by non-computation').",
            };
          }
          const seasonal = (ctx.sources.get("shared/seasonal/engine.ts") ?? "")
            .replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
          if (!/isDated\(e\)\s*&&\s*inWindow/.test(seasonal)) {
            return {
              violated: true,
              detail:
                "shared/seasonal/engine.ts windows entries without checking they are dated. A season is a claim about WHEN — an undated entry is not outside the window, it has no place on the calendar at all (BEH-5).",
            };
          }
          return {
            violated: false,
            detail:
              "Undated entries are representable and no story is told about one: `date: Date | null`, `isDated` at both engines' seams (CONV1 P9 / BEH-5).",
          };
        },
      }),
      customCheck({
        id: "ht-home-door-is-the-resolvers",
        law: "no-duplicate-runtime-identity",
        title: "Home's one door is aimed by HOME2's resolver, never by a device (BEH-9)",
        severity: "fail",
        run: async (ctx) => {
          const file = "client/src/pages/home-experience-page.tsx";
          const raw = ctx.sources.get(file);
          if (raw === undefined) return { violated: true, detail: `${file} is missing.` };
          const code = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
          // Home hand-rolled `todaysMeals.length === 0 ? "Plan today" : "Open today's plan"`
          // while shared/home/home-primary-action.ts sat built, total, 47-tests-green and
          // with ZERO production consumers. Worse, that door was aimed THROUGH
          // todaysMeals → activeWeek → localStorage, which HOME3 §4 refused by name.
          if (!/resolveHomePrimaryAction\s*\(/.test(code)) {
            return {
              violated: true,
              detail: `${file} does not use HOME2's canonical resolver. Home has exactly one door and one owner of where it points (shared/home/home-primary-action.ts); a hand-rolled label ladder is the rival BEH-9 retired, and a resolver with no consumers is a rival copy in waiting (CONV1 R3).`,
            };
          }
          if (/localStorage\.getItem\(\s*["'`]planner:active-week/.test(code)) {
            return {
              violated: true,
              detail: `${file} reads planner:active-week. OWN-6/HOME3 §4 — localStorage is not household state; a door aimed at it moves when the household changes DEVICE, which breaks HOME2 §6.1's theorem (the door changes when the household's state changes) at its root.`,
            };
          }
          if (/new Date\(\)\s*\.\s*getDay\(\)/.test(code)) {
            return {
              violated: true,
              detail: `${file} derives the day of week from the device. HT12 — the client renders household time; it never derives it. The day arrives with the week from one resolution (HT11).`,
            };
          }
          return {
            violated: false,
            detail: "Home's door is aimed by HOME2's resolver over household facts; the week and the day both come from the one owner (CONV1 P8 / BEH-9, OWN-6).",
          };
        },
      }),
      customCheck({
        id: "ht-anchor-is-stamped-from-the-owner",
        law: "no-duplicate-runtime-identity",
        title: "The anchor is stamped at creation, from the owner's week arithmetic (HT1, HT11)",
        severity: "fail",
        run: async (ctx) => {
          const file = "server/storage.ts";
          const raw = ctx.sources.get(file);
          if (raw === undefined) {
            return { violated: true, detail: `${file} is missing — the planner's single write funnel has no home.` };
          }
          const code = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
          const funnel = /async createPlannerWeeks\s*\([\s\S]*?\n  \}/.exec(code)?.[0] ?? "";
          if (funnel === "") {
            return {
              violated: true,
              detail: `${file} no longer declares createPlannerWeeks. It is the Planner's existing single write funnel and the ONLY moment the anchor may be written (HT7; TIME1 § 6.2).`,
            };
          }
          if (!/weekStartDate/.test(funnel)) {
            return {
              violated: true,
              detail:
                "createPlannerWeeks does not stamp weekStartDate. The anchor must be written at creation or never: it is the one moment THA can honestly know which calendar week a slot means (HT7). A week created without one is unanchored forever.",
            };
          }
          // HT11 — all of it, or none of it. A funnel that took today from the owner but
          // hand-rolled its own Monday would compare the household against two calendars
          // at once, and half-converged is worse than unconverged.
          if (!/householdWeekOf\s*\(\s*householdToday\s*\(/.test(funnel)) {
            return {
              violated: true,
              detail:
                "createPlannerWeeks derives the anchor without householdWeekOf(householdToday(...)). HT1/HT11: the week convention (Monday-first, ISO) is the owner's, not the planner's — a private Monday here is a rival copy, and a consumer that takes today from the owner but keeps its own week arithmetic compares the household against two calendars at once.",
            };
          }
          if (/getDay\(\)|toISOString\(\)\s*\.\s*slice\(\s*0\s*,\s*10\s*\)/.test(funnel)) {
            return {
              violated: true,
              detail:
                "createPlannerWeeks derives a civil date from an ambient/UTC frame (getDay() or toISOString().slice(0,10)). HT12: the device may supply the instant; it may never decide the day. The anchor a household lives by would be stamped in the wrong frame for anyone west of Greenwich.",
            };
          }
          return {
            violated: false,
            detail:
              "The anchor is stamped in the Planner's single write funnel, from the owner's own week arithmetic — mondayOf(householdToday(now, zone)) + 7 × (N−1) (CONV1 P7 / SCH-2; TIME1 § 6.2).",
          };
        },
      }),
    ],
  },

  // ── 22. Learning (EL1) ─────────────────────────────────────────────────────
  {
    id: "learning",
    name: "Learning (EL1)",
    variant: "transactional",
    canonicalOwner: "server/intelligence/evidence-learning/evidence-learning-store.ts",
    authorisedWriters: ["server/intelligence/evidence-learning/"],
    publicationPath: "evidence events → learning signals (human-confirmed)",
    runtimeReadPath: "Decision Engine (confirmed signals only)",
    knownGaps: [
      "No replay path: a naive replay would destroy human confirmations that have no event log (CPI1 S3-4).",
      "EL1 asserts SoT registration in shipped code, but the SoT Register holds no row for it (CPI1 §4.4).",
    ],
    checks: [
      sqlCheck({
        id: "el-confirmed-signals",
        law: "approved-read-path",
        title: "Learning contributes a non-empty set to the Decision Engine",
        severity: "warn",
        cpi1: "S3-4",
        sql: `SELECT count(*)::int AS total, count(*) FILTER (WHERE status = 'confirmed')::int AS confirmed FROM household_learning_signals`,
        evaluate: (rows) => {
          const total = Number(rows[0]?.total ?? 0);
          const confirmed = Number(rows[0]?.confirmed ?? 0);
          return confirmed === 0
            ? { violated: true, detail: `0 of ${total} learning signals are confirmed — the Decision Engine reads only confirmed signals, so learning currently contributes an empty set.` }
            : { violated: false, detail: `${confirmed} of ${total} signals confirmed and readable.` };
        },
      }),
    ],
  },

  // ── 23. Nutrition Evidence — Publication (KNOW1) ───────────────────────────
  //
  // CANONICAL_PUBLICATION_ARCHITECTURE.md § "Three Domain Variants" defines the
  // knowledge variant by exactly one property no other variant has:
  //
  //   "Verification: Published rows are reviewed (gate: isEvidenceBackedClaim()).
  //    Empty renders for unreviewed claims. No fabrication."
  //   "Knowledge is the only domain type where reviewedAt and reviewedBy are
  //    mandatory for publication."
  //
  // That verification was declared and never built. The `food-knowledge` contract
  // above verifies the ENTITY tables (counts, orphans, writers) and not one of its
  // six checks reads `reviewed_at` or `source_refs` — so the publication step that
  // defines the variant was the only one nothing watched. This is Rule KC8
  // ("declared is not enforced") holding in the document that names the rule.
  //
  // The cost of the gap is measured, not theoretical. HOUSE_ACT3 hand-counted
  // these tables, found "0 of 3,354 rows reviewed", and concluded the blocker was
  // curation. Half of that was right. The other half is that a sourced, valid,
  // publishable backlog was sitting in the database with nothing reporting it —
  // so it read as one undifferentiated curation problem and no one ran the
  // publication step that already existed. These checks separate the two failures
  // that look identical from a row count and are not the same problem at all:
  // a claim with no citation (curation — a human must find a source) versus a
  // claim with a good citation and no sign-off (publication — a human must run
  // one command). Only the second is engineering's to unblock.
  //
  // Nothing here writes, and nothing here relaxes: the gate is asserted intact
  // (`ne-gate-intact`), never widened. This contract makes the publication state
  // VISIBLE. It does not make it true — only a named human reviewer does that.
  {
    id: "nutrition-evidence",
    name: "Nutrition Evidence (KNOW1)",
    variant: "knowledge",
    canonicalOwner:
      "shared/knowledge/claim-sources.ts + composition-sources.ts (citations); a named human reviewer (the sign-off)",
    authorisedWriters: [
      "server/lib/knowledge-claim-review-store.ts (KNOW2 — the ONLY writer of reviewed_at/reviewed_by/rejected_at; both the CLI and the Admin surface delegate to it)",
    ],
    publicationPath:
      'Admin → Claim Review (/admin/knowledge-claims), per claim; or npm run knowledge:signoff -- --confirm REVIEWED --reviewer "Name" for approve-all-valid',
    runtimeReadPath: "server/services/nutrition-knowledge-registry.ts, gated by isEvidenceBackedClaim()",
    sotRegisterRef: "D1",
    knownGaps: [
      "getFoodsForNutrient() (nutrition-knowledge-registry.ts:181) reads the composition edge with no evidence gate, while getFoodsForBenefit() applies the full chain. Gating it is correct but must follow the composition sign-off, not precede it — closing it first would darken every nutrient page rather than light one up (KNOW1 finding F2).",
      "knowledge_food_benefits carries no citations at all (0 of 1,366) and the sign-off script has no food→benefit edge. That edge is optional corroboration in deriveEvidenceConfidence(), so it blocks no chip — but 'Established' confidence is currently unreachable platform-wide (KNOW1 finding F3).",
    ],
    checks: [
      sqlCheck({
        id: "ne-signoff-backlog",
        law: "no-stale-projections",
        title: "No cited nutrition claim is stranded unpublished",
        severity: "warn",
        sql: `
          SELECT 'composition' AS edge, count(*)::int AS pending
            FROM knowledge_food_nutrients
           WHERE is_active AND reviewed_at IS NULL AND rejected_at IS NULL
             AND jsonb_array_length(COALESCE(source_refs, '[]'::jsonb)) > 0
          UNION ALL
          SELECT 'nutrient-benefit', count(*)::int
            FROM knowledge_nutrient_benefits
           WHERE is_active AND reviewed_at IS NULL AND rejected_at IS NULL
             AND jsonb_array_length(COALESCE(source_refs, '[]'::jsonb)) > 0
          UNION ALL
          SELECT 'preparation-effect', count(*)::int
            FROM knowledge_preparation_effects
           WHERE is_active AND reviewed_at IS NULL AND rejected_at IS NULL
             AND jsonb_array_length(COALESCE(source_refs, '[]'::jsonb)) > 0`,
        evaluate: (rows) => {
          const pending = rows.map((r) => ({ edge: String(r.edge), n: Number(r.pending ?? 0) }));
          const total = pending.reduce((n, p) => n + p.n, 0);
          if (total === 0) {
            return { violated: false, detail: "No cited claim is awaiting sign-off — every citable claim has been published or has no citation yet." };
          }
          const breakdown = pending.filter((p) => p.n > 0).map((p) => `${p.n} ${p.edge}`).join(", ");
          return {
            violated: true,
            detail:
              `${total} claim(s) carry a Layer-1 valid citation and have never been signed off (${breakdown}). ` +
              `These are PUBLISHABLE NOW and dark only because the publication step has not been run: ` +
              `npm run knowledge:signoff -- --confirm REVIEWED --reviewer "Name". ` +
              `This is a publication gap, not a curation gap — see ne-uncited-claims for the curation one.`,
          };
        },
      }),
      sqlCheck({
        id: "ne-published-chain",
        law: "approved-read-path",
        title: "Nutrition evidence reaches a household through the full chain",
        severity: "warn",
        sql: `
          SELECT count(*)::int AS chips, count(DISTINCT fn.food_slug)::int AS foods
            FROM knowledge_food_nutrients fn
            JOIN knowledge_nutrient_benefits nb
              ON nb.nutrient_slug = fn.nutrient_slug AND nb.is_active
           WHERE fn.is_active
             AND fn.reviewed_at IS NOT NULL
             AND nb.reviewed_at IS NOT NULL`,
        evaluate: (rows) => {
          const chips = Number(rows[0]?.chips ?? 0);
          const foods = Number(rows[0]?.foods ?? 0);
          // KNOW5: a benefit chip requires BOTH edges signed off. Reporting either
          // edge alone reads as progress while the household still sees nothing —
          // which is how a half-published chain stayed invisible for a fortnight.
          return chips === 0
            ? {
                violated: true,
                detail:
                  "0 benefit chips render: no food→nutrient→benefit chain has both edges signed off, so " +
                  '"why this food is good" is dark on every food page. Both edges are required (KNOW5) — ' +
                  "signing off one edge alone changes nothing a household can see.",
              }
            : { violated: false, detail: `${chips} benefit chip(s) render across ${foods} food(s) through a fully signed-off chain.` };
        },
      }),
      sqlCheck({
        id: "ne-review-identity",
        law: "authorised-writers",
        title: "Every post-KNOW5 sign-off names the human who made it",
        severity: "fail",
        sql: `
          SELECT 'composition' AS edge, count(*)::int AS anon
            FROM knowledge_food_nutrients
           WHERE reviewed_at >= '2026-07-09' AND reviewed_by IS NULL
          UNION ALL
          SELECT 'nutrient-benefit', count(*)::int
            FROM knowledge_nutrient_benefits
           WHERE reviewed_at >= '2026-07-09' AND reviewed_by IS NULL
          UNION ALL
          SELECT 'preparation-effect', count(*)::int
            FROM knowledge_preparation_effects
           WHERE reviewed_at >= '2026-07-09' AND reviewed_by IS NULL`,
        evaluate: (rows) => {
          // The 2026-07-09 boundary is KNOW5's date, and the grandfathering is
          // deliberate, not lenient: validateReviewState() is enforced at the
          // sign-off boundary and never at render, so pre-KNOW5 anonymous
          // sign-offs stay valid and are not retroactively invalidated
          // (shared/knowledge/evidence.ts:106-113). Every row signed off on or
          // after that date went through a writer that refuses --reviewer-less
          // runs, so an anonymous one can only mean a write that bypassed it.
          const anon = rows.reduce((n, r) => n + Number(r.anon ?? 0), 0);
          return anon > 0
            ? {
                violated: true,
                detail:
                  `${anon} claim(s) signed off on/after KNOW5 (2026-07-09) carry no reviewed_by. ` +
                  "The sign-off writer refuses to run without --reviewer, so these were written by something else — " +
                  "a health claim was approved and no one can be asked why, or told to withdraw it.",
              }
            : { violated: false, detail: "Every post-KNOW5 sign-off names its reviewer. (Pre-KNOW5 anonymous sign-offs are grandfathered by design and are not counted.)" };
        },
      }),
      sqlCheck({
        id: "ne-uncited-claims",
        law: "no-publication-drift",
        title: "Published claim rows can, in principle, be published",
        severity: "warn",
        sql: `
          SELECT 'composition' AS edge, count(*)::int AS uncited
            FROM knowledge_food_nutrients
           WHERE is_active AND jsonb_array_length(COALESCE(source_refs, '[]'::jsonb)) = 0
          UNION ALL
          SELECT 'food-benefit', count(*)::int
            FROM knowledge_food_benefits
           WHERE is_active AND jsonb_array_length(COALESCE(source_refs, '[]'::jsonb)) = 0
          UNION ALL
          SELECT 'nutrient-benefit', count(*)::int
            FROM knowledge_nutrient_benefits
           WHERE is_active AND jsonb_array_length(COALESCE(source_refs, '[]'::jsonb)) = 0`,
        evaluate: (rows) => {
          const uncited = rows.map((r) => ({ edge: String(r.edge), n: Number(r.uncited ?? 0) }));
          const total = uncited.reduce((n, u) => n + u.n, 0);
          if (total === 0) return { violated: false, detail: "Every active claim row carries at least one citation." };
          const breakdown = uncited.filter((u) => u.n > 0).map((u) => `${u.n} ${u.edge}`).join(", ");
          return {
            violated: true,
            detail:
              `${total} active claim row(s) carry no citation at all (${breakdown}) and can never clear the gate, ` +
              "however many times sign-off is run. This is the CURATION gap: a human must find a Layer-1 source " +
              "for each. It is reported separately from ne-signoff-backlog because a row count alone cannot tell " +
              "the two apart, and conflating them is what made a publishable backlog look like a curation backlog.",
          };
        },
      }),
      sourceCheck({
        id: "ne-gate-intact",
        law: "approved-read-path",
        title: "The Trust Gate still requires a human sign-off",
        severity: "fail",
        file: "shared/knowledge/evidence.ts",
        pattern: /if\s*\(!row\.reviewedAt\)\s*return false;/,
        expect: "present",
        violationDetail:
          "isEvidenceBackedClaim() no longer refuses a claim with no reviewedAt. The gate has been weakened, and " +
          "unreviewed nutrition claims can now reach a household. The only sanctioned way to light up a claim is " +
          "to sign it off — never to lower the bar it has to clear.",
        passDetail: "isEvidenceBackedClaim() still refuses any claim without an explicit human sign-off.",
      }),
      sqlCheck({
        id: "ne-rejection-terminal",
        law: "approved-read-path",
        title: "A rejected claim is never also approved",
        severity: "fail",
        sql: `
          SELECT 'composition' AS edge, count(*)::int AS both
            FROM knowledge_food_nutrients WHERE reviewed_at IS NOT NULL AND rejected_at IS NOT NULL
          UNION ALL
          SELECT 'food-benefit', count(*)::int
            FROM knowledge_food_benefits WHERE reviewed_at IS NOT NULL AND rejected_at IS NOT NULL
          UNION ALL
          SELECT 'nutrient-benefit', count(*)::int
            FROM knowledge_nutrient_benefits WHERE reviewed_at IS NOT NULL AND rejected_at IS NOT NULL
          UNION ALL
          SELECT 'preparation-effect', count(*)::int
            FROM knowledge_preparation_effects WHERE reviewed_at IS NOT NULL AND rejected_at IS NOT NULL`,
        evaluate: (rows) => {
          // KNOW2's central safety property, asserted rather than assumed. A row
          // holding both states is a claim a qualified human REFUSED that renders
          // to households anyway, because the Trust Gate reads reviewed_at and
          // would never look at rejected_at. A database CHECK constraint makes
          // this unreachable; this check is what notices if the constraint is
          // ever dropped.
          const both = rows.reduce((n, r) => n + Number(r.both ?? 0), 0);
          return both > 0
            ? {
                violated: true,
                detail:
                  `${both} claim(s) are simultaneously approved and rejected. A claim a reviewer refused is ` +
                  "reaching households, because the Trust Gate reads reviewed_at and never looks at rejected_at. " +
                  "The *_review_exclusive_check constraint has been dropped or bypassed.",
              }
            : { violated: false, detail: "No claim holds both an approval and a rejection — the two states remain exclusive." };
        },
      }),
      sqlCheck({
        id: "ne-decisions-audited",
        law: "authorised-writers",
        title: "Every KNOW2-era decision left an audit row",
        severity: "fail",
        sql: `
          WITH decided AS (
            SELECT id, reviewed_at, rejected_at, 'claim:composition' AS entity FROM knowledge_food_nutrients
            UNION ALL SELECT id, reviewed_at, rejected_at, 'claim:food-benefit' FROM knowledge_food_benefits
            UNION ALL SELECT id, reviewed_at, rejected_at, 'claim:nutrient-benefit' FROM knowledge_nutrient_benefits
            UNION ALL SELECT id, reviewed_at, rejected_at, 'claim:preparation-effect' FROM knowledge_preparation_effects
          )
          SELECT count(*)::int AS unaudited
            FROM decided d
           WHERE COALESCE(d.reviewed_at, d.rejected_at) >= '2026-07-19'
             AND NOT EXISTS (
               SELECT 1 FROM knowledge_review_audit a
                WHERE a.entity = d.entity AND a.entity_id = d.id
             )`,
        evaluate: (rows) => {
          // The 2026-07-19 boundary is KNOW2's date, and the grandfathering is the
          // same deliberate kind as ne-review-identity's: the 21 pre-KNOW5 and any
          // pre-KNOW2 sign-offs pre-date the ledger and are not retroactively
          // invalid — no audit row was ever written for them, and inventing one
          // now would be fabricating a decision history.
          //
          // Every decision on or after that date went through
          // recordClaimDecision(), which writes the claim row and its audit row in
          // ONE transaction. So an unaudited decision can only mean a write that
          // bypassed the single authorised writer.
          const unaudited = Number(rows[0]?.unaudited ?? 0);
          return unaudited > 0
            ? {
                violated: true,
                detail:
                  `${unaudited} claim(s) decided on/after KNOW2 (2026-07-19) carry no audit row. The decision and its ` +
                  "audit row are written in one transaction, so these were written by something that bypassed " +
                  "knowledge-claim-review-store — a health claim was decided and no one can reconstruct by whom or why.",
              }
            : {
                violated: false,
                detail:
                  "Every claim decided since KNOW2 has its full decision history in knowledge_review_audit. " +
                  "(Pre-KNOW2 sign-offs pre-date the ledger and are grandfathered by design.)",
              };
        },
      }),
    ],
  },
];

// ── Cross-cutting checks (CPI1 §4 — belong to no single domain) ──────────────

export const CROSS_CUTTING_CHECKS: PublicationCheck[] = [
  customCheck({
    id: "xc-migration-coverage",
    law: "no-publication-drift",
    title: "Every declared table is created by a reviewed migration",
    severity: "fail",
    cpi1: "§4.1",
    run: async (ctx) => {
      const schema = ctx.sources.get("shared/schema.ts") ?? "";
      const runner = ctx.sources.get("server/migrations/runner.ts") ?? "";
      const declared = new Set(
        [...schema.matchAll(/pgTable\(\s*["']([^"']+)["']/g)].map((m) => m[1]),
      );
      const migrated = new Set(
        [...runner.matchAll(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+"?([a-z0-9_]+)"?/gi)].map((m) =>
          m[1].toLowerCase(),
        ),
      );
      migrated.delete("schema_migrations");
      const uncovered = [...declared].filter((t) => !migrated.has(t));
      if (uncovered.length === 0) {
        return { violated: false, detail: `All ${declared.size} declared tables have a reviewed migration.` };
      }
      const pct = Math.round(((declared.size - uncovered.length) / declared.size) * 100);
      return {
        violated: true,
        detail:
          `${uncovered.length} of ${declared.size} declared tables (coverage ${pct}%, upper bound) have no reviewed migration — ` +
          `the schema cannot rebuild itself. Includes: ${uncovered.slice(0, 8).join(", ")}${uncovered.length > 8 ? ", …" : ""}.`,
      };
    },
  }),
  customCheck({
    id: "xc-boot-publication",
    law: "no-sync-bridges",
    title: "No undeclared boot-time publication mechanism",
    severity: "fail",
    cpi1: "§4.2",
    run: async (ctx) => {
      const index = ctx.sources.get("server/index.ts") ?? "";
      const bootWriters = [
        "runTemplateMigration()",
        "seedReadyMeals()",
        "seedFoodKnowledge()",
        "seedPantryKnowledge()",
      ].filter((w) => index.includes(w));
      return bootWriters.length > 0
        ? {
            violated: true,
            detail: `server/index.ts runs ${bootWriters.length} writer(s) on every boot, none declared in the SoT Register: ${bootWriters.join(", ")}. The declared mechanism is npm run seed:* — this one is invisible.`,
          }
        : { violated: false, detail: "No undeclared boot-time writers." };
    },
  }),
  customCheck({
    id: "xc-register-currency",
    law: "no-publication-drift",
    title: "The Source of Truth Register agrees with the owners it governs",
    severity: "warn",
    cpi1: "§4.4",
    run: async () => {
      let register: string;
      try {
        register = fs.readFileSync(
          path.join(REPO_ROOT, "docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md"),
          "utf8",
        );
      } catch (err) {
        return { violated: true, detail: `SoT Register unreadable: ${(err as Error).message}` };
      }
      const drift: string[] = [];
      if (register.includes("188 foods") && KNOWLEDGE_SEED_COUNTS.foods !== 188) {
        drift.push(`says "188 foods", owner declares ${KNOWLEDGE_SEED_COUNTS.foods}`);
      }
      if (register.includes("239 entries") && CANONICAL_SEED.length !== 239) {
        drift.push(`says "239 entries", owner declares ${CANONICAL_SEED.length}`);
      }
      if (/Plant Diversity[\s\S]{0,400}?Contested/.test(register)) {
        drift.push("still marks Plant Diversity Contested (resolved by M4)");
      }
      return drift.length > 0
        ? { violated: true, detail: `The register that owns ownership is itself stale: ${drift.join("; ")}.` }
        : { violated: false, detail: "No known register drift detected." };
    },
  }),
];
