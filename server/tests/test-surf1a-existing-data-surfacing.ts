/**
 * SURF1A — Existing Data Surfacing verification.
 *
 * DCA1 measured a 20-point gap between what THA *knows* and what a household can
 * *see*, and named its clearest illustration: preparation knowledge was 100%
 * published, correctly owned, correctly served over the wire — and rendered by
 * exactly zero React components. The client's own type dropped the field.
 *
 * That is a defect class, not a one-off: A FIELD ON THE WIRE THAT NO SURFACE
 * REFERENCES IS INVISIBLE, and nothing in the platform failed when it happened.
 * Publication verification (CPV1) passed throughout — because the fact *was*
 * published. It just never reached a person.
 *
 * These checks are the missing half. They assert the whole chain, end to end:
 *
 *     Canonical Owner → Publication → API → Frontend Type → UI
 *
 * and they fail if any link drops a field again.
 *
 * Three layers:
 *   1. SURFACE  — static, over the client source tree. The field is referenced by
 *                 a component, and it is in the type that parses the payload.
 *                 This is the layer that would have caught the original bug.
 *   2. TRUST    — the WS5A three-state contract survives the surfacing. An
 *                 unreviewed preparation still says nothing, and exactly one
 *                 component in the codebase is allowed to render approved wording.
 *   3. LIVE     — DB-backed. The runtime APIs really do carry the fields, for real
 *                 foods, through both chains. Only runs when DATABASE_URL is set.
 *
 * Run with:  npm run test:surf1a-existing-data-surfacing
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean, detail = "") {
  if (ok) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function read(rel: string): string {
  const p = join(ROOT, rel);
  if (!existsSync(p)) throw new Error(`expected file missing: ${rel}`);
  return readFileSync(p, "utf8");
}

/** Source with line and block comments stripped — a comment is not a render. */
function code(rel: string): string {
  return read(rel)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

// The two surfaces a household can actually reach, and the fields each must show.
const PANTRY_HUB = "client/src/components/PantryKnowledgeHub.tsx";
const FOOD_PAGE = "client/src/pages/food-detail-page.tsx";
const PREP_LIST = "client/src/components/intelligence/FoodPreparationList.tsx";
const ASSEMBLER = "server/lib/food-intelligence-assembler.ts";
const REGISTRY = "server/services/nutrition-knowledge-registry.ts";

async function run() {
  console.log("\nSURF1A — Existing Data Surfacing\n");

  // ── 1. SURFACE ──────────────────────────────────────────────────────────────
  //
  // The exact defect DCA1 found: the payload carried `preparations`, the client's
  // FoodDetail type omitted it, react-query parsed it away. Both halves are
  // asserted — the type carries the field AND a component references it.

  console.log("1. SURFACE — the field reaches a component");

  const hub = code(PANTRY_HUB);
  const page = code(FOOD_PAGE);

  // A NOTE ON WHY THESE ASSERT A RENDER MARKER AND NOT JUST THE FIELD NAME.
  //
  // `storageGuidance` and `aliases` were BOTH already present in
  // PantryKnowledgeHub's FoodDetail type before SURF1A. They were on the wire and
  // in the type, and still no household ever saw them — because no JSX referenced
  // them. A test that asserted `source.includes("storageGuidance")` would have
  // passed happily throughout, which makes it worse than no test: it would have
  // certified the exact gap DCA1 had to be written to find.
  //
  // So each field is pinned to something only a RENDER produces — a `data-testid`
  // on the element, or the one component permitted to draw it. Presence in a type
  // is not visibility. That distinction is the entire point of this workstream.
  const RENDERS: Array<{ surface: string; src: string; field: string; marker: string }> = [
    { surface: "PantryKnowledgeHub", src: hub, field: "preparations", marker: "<FoodPreparationList" },
    { surface: "PantryKnowledgeHub", src: hub, field: "storageGuidance", marker: 'data-testid="food-storage-guidance"' },
    { surface: "PantryKnowledgeHub", src: hub, field: "aliases", marker: 'data-testid="food-aliases"' },
    { surface: "Food page (/foods/:slug)", src: page, field: "preparations", marker: "<FoodPreparationList" },
    { surface: "Food page (/foods/:slug)", src: page, field: "storageGuidance", marker: 'data-testid="food-storage-guidance"' },
    { surface: "Food page (/foods/:slug)", src: page, field: "aliases", marker: 'data-testid="food-aliases"' },
    { surface: "Food page (/foods/:slug)", src: page, field: "commonForms", marker: 'data-testid="food-varieties"' },
  ];

  for (const r of RENDERS) {
    check(
      `${r.surface} RENDERS ${r.field} (not merely types it)`,
      r.src.includes(r.field) && r.src.includes(r.marker),
      !r.src.includes(r.field)
        ? `no reference to \`${r.field}\``
        : `\`${r.field}\` is referenced but never rendered — missing ${r.marker}`,
    );
  }

  // The precise line whose absence was the bug. A field the wire type does not
  // declare is discarded before any component can render it.
  check(
    "PantryKnowledgeHub's FoodDetail type declares `preparations`",
    /interface FoodDetail\s*\{[\s\S]*?preparations\s*:[\s\S]*?\n\}/.test(hub),
    "the FoodDetail wire type drops the field the API sends",
  );

  // The assembler is the link that dropped these on the /foods/:slug chain: the
  // knowledge existed, and the API never put it on the wire.
  const assembler = code(ASSEMBLER);
  for (const field of ["preparations", "storageGuidance", "aliases", "commonForms"]) {
    check(
      `FoodIntelligence assembler puts ${field} on the wire`,
      assembler.includes(field),
      `assembler never composes \`${field}\``,
    );
  }

  // Composed from the canonical owner, not re-derived. The assembler owns nothing.
  check(
    "assembler reads preparations from the domain's one mouth",
    assembler.includes("getPreparationsForFood"),
    "assembler must call the registry, never query preparation tables itself",
  );
  check(
    "assembler reaches knowledge over the WS2A identity bridge",
    assembler.includes("knowledgeFoodSlug"),
    "the canonical→knowledge seam is the only permitted join",
  );

  // ── 2. TRUST ────────────────────────────────────────────────────────────────
  //
  // WS5A §4.3: a household must be able to tell "we know it doesn't matter"
  // (no-change — an evidenced finding) from "nobody knows yet" (unreviewed — an
  // absence). Surfacing the domain is only correct if that distinction survives.

  console.log("\n2. TRUST — the three-state contract survives surfacing");

  const prep = code(PREP_LIST);

  check(
    "the preparation owner switches on `state`",
    prep.includes('"no-change"') && prep.includes("state"),
    "a renderer that ignores `state` collapses the two facts it exists to separate",
  );
  check(
    "an unreviewed preparation renders no claim",
    prep.includes("approvedWording !== null") || prep.includes("!preparation.approvedWording"),
    "the claim row must be gated on approved wording existing",
  );
  check(
    "no-change and unreviewed do not render alike",
    /reassuring/.test(prep),
    "the evidenced 'no-change' finding must be visually distinct from silence",
  );
  check(
    "citations are rendered with the claim they earned",
    prep.includes("sourceRefs"),
    "an evidence-backed claim must show the evidence",
  );

  // ONE OWNER: exactly one component in the entire client may print approved
  // wording. If a second surface starts composing its own preparation sentence,
  // the domain has two mouths and this check fails.
  const clientFiles = [PANTRY_HUB, FOOD_PAGE, PREP_LIST];
  const wordingRenderers = clientFiles.filter((f) => code(f).includes("approvedWording"));
  check(
    "exactly one client component renders approved wording",
    wordingRenderers.length === 1 && wordingRenderers[0] === PREP_LIST,
    `renderers: ${wordingRenderers.join(", ") || "none"}`,
  );

  // Both surfaces go through that owner rather than re-implementing it.
  check(
    "both food surfaces render preparations through the one owner",
    hub.includes("FoodPreparationList") && page.includes("FoodPreparationList"),
    "a surface rendering preparations by hand is a second mouth",
  );

  // The server still refuses to speak without evidence — the gate we are
  // surfacing behind, unchanged.
  const registry = code(REGISTRY);
  check(
    "the server still gates effects on the evidence validator",
    registry.includes("isEvidenceBackedClaim"),
    "surfacing must not have loosened the Layer-2 gate",
  );

  // ── 3. LIVE ─────────────────────────────────────────────────────────────────
  //
  // The static checks prove the code references the fields. These prove the
  // running platform actually serves them, for real foods, through both chains.

  if (!process.env.DATABASE_URL) {
    console.log("\n3. LIVE — skipped (no DATABASE_URL)");
  } else {
    console.log("\n3. LIVE — the runtime APIs carry the fields");

    const { getFoodDetailView } = await import("../services/nutrition-knowledge-registry");
    const { getFoodIntelligence } = await import("../lib/food-intelligence-assembler");
    const { CANONICAL_SEED } = await import("@shared/canonical/foods");
    const { db } = await import("../db");
    const { knowledgeFoodPreparations, knowledgeFoods } = await import("@shared/schema");
    const { eq, isNotNull, and } = await import("drizzle-orm");

    // Chain A — /api/knowledge/foods/:slug (the Pantry food directory).
    const prepLinks = await db
      .select({ foodSlug: knowledgeFoodPreparations.foodSlug })
      .from(knowledgeFoodPreparations)
      .where(eq(knowledgeFoodPreparations.isActive, true));

    const foodsWithPreps = Array.from(new Set(prepLinks.map((r) => r.foodSlug)));
    check(
      "published preparation links exist to surface",
      foodsWithPreps.length > 0,
      "no active food→preparation links in the database",
    );

    let served = 0;
    for (const slug of foodsWithPreps.slice(0, 25)) {
      const detail = await getFoodDetailView(slug);
      if (detail && detail.preparations.length > 0) served++;
    }
    check(
      "chain A: /api/knowledge/foods/:slug serves preparations",
      served > 0,
      `0 of the first 25 foods with published links served any preparation`,
    );

    // The three-state contract, against live rows rather than the type system.
    let stateViolations = 0;
    for (const slug of foodsWithPreps.slice(0, 25)) {
      const detail = await getFoodDetailView(slug);
      for (const p of detail?.preparations ?? []) {
        const validState = ["effect", "no-change", "unreviewed"].includes(p.state);
        const silentWhenUnreviewed =
          p.state !== "unreviewed" ||
          (p.approvedWording === null && p.sourceRefs.length === 0 && p.confidence === null);
        const speaksWhenReviewed =
          p.state === "unreviewed" || p.approvedWording !== null;
        if (!validState || !silentWhenUnreviewed || !speaksWhenReviewed) stateViolations++;
      }
    }
    check(
      "live preparations honour the three-state contract",
      stateViolations === 0,
      `${stateViolations} row(s) either spoke without evidence or fell silent with it`,
    );

    // Storage guidance and aliases — served on chain A.
    const storageFoods = await db
      .select({ slug: knowledgeFoods.slug })
      .from(knowledgeFoods)
      .where(and(eq(knowledgeFoods.isActive, true), isNotNull(knowledgeFoods.storageGuidance)))
      .limit(5);

    check(
      "published storage guidance exists to surface",
      storageFoods.length > 0,
      "no active food carries storage guidance",
    );

    if (storageFoods.length > 0) {
      const detail = await getFoodDetailView(storageFoods[0].slug);
      check(
        "chain A: /api/knowledge/foods/:slug serves storageGuidance",
        !!detail?.food.storageGuidance,
        `${storageFoods[0].slug} has storage guidance in the store but not on the wire`,
      );
    }

    // Chain B — /api/foods/:slug/intelligence (the food page). This is the chain
    // where the ASSEMBLER, not the client, was dropping the fields.
    const knowledgeToCanonical = new Map<string, string>();
    for (const entry of CANONICAL_SEED) {
      if (entry.food.knowledgeFoodSlug) {
        knowledgeToCanonical.set(entry.food.knowledgeFoodSlug, entry.food.slug);
      }
    }

    const canonicalWithPreps = foodsWithPreps
      .map((k) => knowledgeToCanonical.get(k))
      .filter((s): s is string => !!s);

    check(
      "canonical foods are bound to preparation-carrying knowledge",
      canonicalWithPreps.length > 0,
      "no canonical food bridges to a food with published preparations",
    );

    let pageServed = 0;
    let pageStorage = 0;
    let pageAliases = 0;
    for (const slug of canonicalWithPreps.slice(0, 15)) {
      const intel = await getFoodIntelligence(slug);
      if (intel.preparations.length > 0) pageServed++;
      if (intel.food?.storageGuidance) pageStorage++;
      if ((intel.food?.aliases.length ?? 0) > 0) pageAliases++;
    }

    check(
      "chain B: /api/foods/:slug/intelligence serves preparations",
      pageServed > 0,
      "the assembler still drops preparations before the wire",
    );
    check(
      "chain B: the assembler serves storageGuidance",
      pageStorage > 0,
      "no sampled food carried storage guidance to the food page",
    );
    check(
      "chain B: the assembler serves aliases",
      pageAliases > 0,
      "no sampled food carried aliases to the food page",
    );

    // Honest gap, never a fabricated default: a food with no knowledge binding
    // gets empty fields, not invented ones.
    const unbound = CANONICAL_SEED.find((e) => !e.food.knowledgeFoodSlug);
    if (unbound) {
      const intel = await getFoodIntelligence(unbound.food.slug);
      check(
        "an unbound canonical food surfaces empty knowledge, not fabricated knowledge",
        intel.preparations.length === 0 &&
          intel.food?.storageGuidance === null &&
          intel.food?.aliases.length === 0,
        `${unbound.food.slug} invented knowledge it has no binding for`,
      );
    }

    console.log(
      `\n  measured: ${foodsWithPreps.length} foods with published preparations, ` +
        `${pageServed}/${Math.min(15, canonicalWithPreps.length)} sampled canonical foods now surfacing them.`,
    );
  }

  console.log(`\n${failed === 0 ? "✅" : "❌"} ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
