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
      seedCountCheck({
        id: "fi-food-publication",
        law: "no-stale-projections",
        title: "canonical_food projection matches the owner's declaration",
        severity: "warn",
        cpi1: "§4.3",
        tableName: "canonical_food",
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
        expected: CANONICAL_ALIAS_COUNT,
        ownerLabel: "CANONICAL_SEED aliases",
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
          const rows = await ctx.query(`SELECT slug FROM knowledge_nutrients`);
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
          return plans + entries > 0
            ? { violated: true, detail: `Dead store still populated: meal_plans=${plans}, meal_plan_entries=${entries} — and template-migration still writes it at boot.` }
            : { violated: false, detail: "meal_plans / meal_plan_entries are empty." };
        },
      }),
    ],
  },

  // ── 9. Household Dietary Preference ────────────────────────────────────────
  {
    id: "household",
    name: "Household Dietary Preference",
    variant: "transactional",
    canonicalOwner: "CONTESTED — users.diet* vs user_preferences vs household_eaters",
    authorisedWriters: ["server/storage.ts", "server/routes.ts (profile endpoints)"],
    publicationPath: "household-authored at runtime",
    runtimeReadPath: "three competing strategies (routes profile / storage household context / eaters)",
    sotRegisterRef: "D7 / D27",
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
          if (!hardcoded) {
            return { violated: false, detail: "Household context no longer hardcodes dietRestrictions to []." };
          }
          let liveDetail = "";
          try {
            const rows = await ctx.query(
              `SELECT count(*)::int AS n FROM users WHERE diet_restrictions IS NOT NULL AND cardinality(diet_restrictions) > 0`,
            );
            liveDetail = ` ${Number(rows[0]?.n ?? 0)} user(s) carry live restrictions the Companion never sees.`;
          } catch {
            liveDetail = " (live restriction count unavailable — database unreachable).";
          }
          return {
            violated: true,
            detail: `storage.ts hardcodes dietRestrictions: [] in the household dietary context — every allergen and restriction is dropped before the AI reads it.${liveDetail}`,
          };
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
          "routes.ts carries a self-declared, one-way, best-effort 'Bridge' syncing users.diet_pattern → user_preferences.diet_types — the platform's only self-confessed permanent synchronisation bridge.",
        passDetail: "The diet-preference bridge is gone.",
      }),
      customCheck({
        id: "hh-contested-owner",
        law: "one-owner",
        title: "Dietary preference has a single canonical owner",
        severity: "fail",
        cpi1: "S2-4",
        run: async (ctx) => {
          const schema = ctx.sources.get("shared/schema.ts") ?? "";
          const owners: string[] = [];
          if (/dietPattern: text\("diet_pattern"\)/.test(schema)) owners.push("users.diet_pattern/diet_restrictions");
          if (/dietTypes/.test(schema) && /userPreferences = pgTable/.test(schema)) owners.push("user_preferences.diet_types");
          if (/defaultDietTypes/.test(schema)) owners.push("household_eaters.default_diet_types");
          return owners.length > 1
            ? { violated: true, detail: `${owners.length} stores own the same diet fact at the same scope: ${owners.join(", ")}.` }
            : { violated: false, detail: `Single owner: ${owners[0] ?? "none declared"}.` };
        },
      }),
      sqlCheck({
        id: "hh-unprojected",
        law: "no-stale-projections",
        title: "Every user's diet pattern is projected to the eater model",
        severity: "warn",
        cpi1: "S2-4",
        sql: `SELECT count(*)::int AS unprojected,
                     (SELECT count(*)::int FROM users WHERE diet_pattern IS NOT NULL) AS total
              FROM users u
              WHERE u.diet_pattern IS NOT NULL
                AND NOT EXISTS (
                  SELECT 1 FROM household_members hm
                  JOIN household_eaters he ON he.household_id = hm.household_id
                  WHERE hm.user_id = u.id
                )`,
        evaluate: (rows) => {
          const unprojected = Number(rows[0]?.unprojected ?? 0);
          const total = Number(rows[0]?.total ?? 0);
          return unprojected > 0
            ? { violated: true, detail: `${unprojected} of ${total} users with a diet pattern have no eater projection of it.` }
            : { violated: false, detail: `All ${total} diet patterns are projected.` };
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
    canonicalOwner: "conversation-gateway.ts + notice-gateway.ts",
    authorisedWriters: ["server/intelligence/conversation/"],
    publicationPath: "one assistant, one conversation state (NTC-P2 convergence)",
    runtimeReadPath: "server/intelligence/conversation/conversation-gateway.ts",
    knownGaps: [],
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
      customCheck({
        id: "cn-undeclared-category",
        law: "approved-read-path",
        title: "Every notice category has a declared delivery scope",
        severity: "warn",
        cpi1: "S3-5",
        run: async (ctx) => {
          const engine = ctx.sources.get("server/intelligence/conversation/notice-engine.ts") ?? "";
          const gateway = ctx.sources.get("server/intelligence/conversation/notice-gateway.ts") ?? "";
          const undeclared =
            engine.includes("cookbook-opportunity") && !gateway.includes("cookbook-opportunity");
          return undeclared
            ? { violated: true, detail: "'cookbook-opportunity' exists in the notice engine but no surface declared itself its mouth in the notice gateway." }
            : { violated: false, detail: "Every notice category has a declared scope." };
        },
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
