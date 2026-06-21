# WS0.5 — Knowledge Authoring Pipeline Verification

**Date:** 2026-06-21
**Branch:** safety/preserve-since-last-prod-20260617-1613
**Rollback tag:** `rollback/before-ws0-5-investigation`
**Scope:** Investigation only. No implementation. No schema changes. No food creation.

---

## Purpose

Investigate whether The Healthy Apples already has the foundations required for Claude to safely self-author Canonical Foods and Knowledge Foods at scale, with THA acting as reviewer and approver.

**Central question:**
> Can Claude become The Healthy Apples Food Knowledge Author while remaining trustworthy, reviewable, evidence-based, uncertainty-aware, and aligned with THA philosophy?

---

## Rollback Protection

Confirmed before investigation began:

- Git status: clean (one untracked file `WS1_WS6_FOUNDATION_COMPLETION_AUDIT.md` — not a committed change)
- WS1–WS11 investigations: all present and committed
- Rollback tag created: `rollback/before-ws0-5-investigation`
- No code written, no schema changed, no data modified

---

## Part A — Current Authoring System

### How foods are currently authored

There are **two separate registries** with distinct editorial purposes:

**1. Canonical Food Registry** (`shared/canonical/`)

The identity spine. Defines what a food *is* — its slug, name, category, varieties, and aliases. Structured as a single source of truth in `shared/canonical/foods.ts` using a nested format: one object per food, with varieties and aliases nested inside.

Current inventory:
- **28 canonical foods** (tomato, mushroom, apple, spinach, chickpeas, lentils, walnuts, almonds, and more)
- **18 varieties** across 6 foods (cherry/plum/heirloom tomato; button/chestnut/shiitake/oyster mushroom; baby/mature spinach; red/green/puy/beluga lentil; gala/braeburn/granny-smith apple)
- **~60 aliases** (plural, singular, form, common_name, misspelling)
- **26 diversity groups** (what the 30-plants counter counts as one plant)

Editorial rules are encoded in the source file header (WS1.5 decisions) and embedded in comments:
- Preparations are NEVER canonical foods
- Varieties share a parent food and diversity group
- Fresh/dried forms are aliases, not separate foods
- One alias key → exactly one canonical food (the anti-fork rule)

**2. Knowledge Food Registry** (`shared/knowledge/`)

The editorial knowledge layer. Defines what we *know* about a food — nutrients, benefits, storage, seasonality, forms, description. Four files:
- `foods.ts` — 51 knowledge foods with descriptions, aliases, storage, seasonality, commonForms
- `nutrients.ts` — 30 nutrients with conservative descriptions
- `health-benefits.ts` — 15 benefit categories (gut-health, heart-health, etc.)
- `relationships.ts` — compact maps: FOOD_NUTRIENTS, FOOD_BENEFITS, NUTRIENT_BENEFITS

**A third, older layer** exists in `server/lib/seed-food-knowledge.ts` (12 food knowledge entries: additives, processing flags, individual foods) seeded directly with richer prose. This predates the WS0 registry and is not directly connected to the canonical system.

### How foods are promoted to production

**Both registries follow the same pattern:**

```
Edit TypeScript source files
→ validateCanonicalSeed() / validateKnowledgeSeed() [structural gate]
→ npm run seed:canonical / npm run seed:knowledge
→ Idempotent UPSERT by slug into Postgres
→ Production
```

The seed runner **refuses to run** if validation fails. Both validators check:
- No duplicate slugs within any table
- No dangling foreign keys (knowledge_food_slug → knowledge_foods.slug, etc.)
- For canonical: anti-fork check (one alias_key → exactly one food)
- For canonical: resolver key collision detection

There is **no staging step, no draft table, no approval queue** for the canonical or knowledge registries. Author → validate → seed is the entire pipeline.

### Where the bottlenecks are

**Current bottleneck: human editorial authoring capacity.**

Adding a new canonical food requires:
1. Choosing the right slug and name
2. Deciding what is a variety vs alias vs separate food (a judgment call)
3. Correctly assigning the diversity group
4. Choosing the right `knowledgeFoodSlug` link (or leaving it null)
5. Validating the decision does not conflict with existing aliases
6. Running the seed

Adding a new knowledge food requires:
1. Writing a careful description (educational, not medical)
2. Choosing correct nutrient links (conservative, well-established only)
3. Choosing correct benefit links (evidence-graded but not exposed to users yet)
4. Choosing correct forms, storage, seasonality
5. Running the seed

At 28 canonical foods and 51 knowledge foods, the current authoring rate is sustainable manually. At 150–250 foods, it is not.

### What already behaves like a review pipeline

**Ingredient Classifications** (shopping list domain — `ingredientClassifications` table):
- AI (OpenAI gpt-4o-mini) classifies unrecognised shopping items
- Results land in `reviewStatus: 'pending'`
- Admin routes exist: `POST /api/admin/ingredient-classifications/:id/approve` and `/reject`
- `assertAdmin` middleware gates these routes to admin users only
- Two admin users are hard-coded: colinclapson@hotmail.co.uk and lindsayclapson@outlook.com
- This is an **existing, functioning review pipeline** for AI-proposed ingredient identity

This pattern — AI proposes → stores as pending → admin approves/rejects → applies — is the model for any Claude food authoring pipeline.

**The git PR workflow** also acts as an implicit review pipeline for seed data. Every change to `shared/canonical/foods.ts` or `shared/knowledge/*.ts` is a file diff that a human can read and approve before merging.

---

## Part B — Can Claude Author Canonical Foods?

### Investigation

The canonical food structure is well-defined and constrained:

```typescript
{
  food: { slug, name, category, subcategory, description, knowledgeFoodSlug, diversityGroupSlug },
  varieties: [{ slug, name, description, displayOrder, knowledgeFoodSlug }],
  aliases: [{ alias, aliasType }]
}
```

**What Claude can reliably do:**

- **Propose slugs and names** — the naming pattern is unambiguous from examples
- **Propose aliases** — common names, plurals, forms, and misspellings are deterministic for most foods
- **Propose categories and subcategories** — the existing 26-food set defines clear patterns (Vegetables/Leafy greens, Legumes/Beans, Seeds/Whole seeds, Nuts/Tree nuts, Fruit/Berries, etc.)
- **Propose diversity groups** — rules are clear: all mushroom varieties → one "mushroom" group; distinct herbs each count separately
- **Detect duplicates** — the validator catches slug duplicates and alias_key conflicts before seeding; Claude should also check the CANONICAL_SEED before proposing

**Where Claude must be guided:**

- **Variety vs alias vs separate food** — this is the hardest classification decision. "Cherry tomato" is a variety; "passata" is a form alias; "plum" is a separate food. Claude needs explicit THA rules (WS1.5 decisions) to make consistent choices
- **Diversity group assignment** — whether a new food gets its own group or joins an existing one (e.g. does "mandarin" join "citrus"?) requires editorial judgment
- **knowledgeFoodSlug linkage** — requires knowing whether a WS0 knowledge food already exists for this slug

**Can duplicates be detected?**

YES — the `validateCanonicalSeed()` function already:
1. Checks for duplicate slugs across all three tables
2. Checks that alias_key is unique across all aliases (anti-fork lock)
3. Runs the resolver index and flags any key collision

Claude can also be instructed to check the existing `CANONICAL_SEED` before proposing, surfacing conflicts before validation runs.

**Can Claude distinguish canonical / variety / preparation / product?**

Yes, with clear rules provided. The WS1.5 rules are documented. Examples make the decisions clear. Claude should be given both the rules and the existing seed data as context for any authoring task.

**Can uncertainty be surfaced?**

Yes — Claude can flag:
- Ambiguous categorisation (is this a variety or a separate food?)
- Missing knowledge food link (no WS0 entry exists for this slug yet)
- Novel diversity group decisions (no clear precedent in existing seed)
- Multiple possible alias types for the same alias string

**Assessment: canonical food authoring is structurally feasible for Claude.** The format is well-defined, the rules exist, and the validator is a hard gate that catches structural errors before production.

---

## Part C — Can Claude Author Knowledge Foods?

### Investigation

The knowledge food structure:

```typescript
{
  slug, name, category, subcategory, aliases,
  description, commonForms, storageGuidance, seasonality
}
```

Plus relationships in `relationships.ts`:
- FOOD_NUTRIENTS: food → [nutrient slugs in prominence order]
- FOOD_BENEFITS: food → [benefit slugs in ranking order]
- NUTRIENT_BENEFITS: nutrient → [benefit slugs]

**What Claude can reliably do:**

- **Propose food descriptions** — the editorial style is consistent: 1–2 sentences, plain English, educational, no medical claims. Examples: "A creamy fruit rich in unsaturated fats, fibre and potassium." Claude can match this register
- **Propose commonForms** — practical kitchen forms (whole, sliced, tinned, frozen, dried)
- **Propose storageGuidance** — simple practical advice
- **Propose seasonality** — UK-relevant, year-round or seasonal
- **Propose nutrient links** — for well-known foods, nutrient associations are well-established in nutritional science; Claude can propose the top 3–4 and rank them by prominence
- **Propose benefit links** — these must be conservative; the existing benefit categories (15 total) are the constraint. Claude must pick from the existing set, not invent new ones

**Where Claude can go wrong:**

| Risk | How it manifests | Existing protection |
|------|-----------------|---------------------|
| Overstate evidence | "Proven to lower blood pressure" | No — language check is human |
| Invent benefits | Link a food to "cancer-prevention" (not in benefit set) | YES — benefit slugs must be in HEALTH_BENEFIT_SEED; validator rejects unknown slugs |
| Make medical claims | "Treats inflammation", "Prevents disease" | No — language check is human |
| Create unsafe wording | Health claims that could constitute medical advice | No — language check is human |
| Wrong nutrient ranking | Listing zinc before fibre for lentils | Low risk — display order affects UX not safety |
| Invent nutrient slugs | Reference a nutrient not in NUTRIENT_SEED | YES — `validateKnowledgeSeed()` rejects unknown slugs |

**Critical finding:** The validator prevents structural errors (unknown slugs, duplicate entries) but **does not protect against content-level quality issues**. Language safety, evidence quality, and claim accuracy require human review. The validator is a format gate, not a content gate.

**The existing language pattern is intentionally conservative:**
- "associated with" (not "causes" or "proves")
- "contributes to" (not "cures" or "prevents")
- "rich in" (not "high doses of")
- No disease names
- No treatment language
- Descriptions scoped to "what foods can add" not what they fix

Claude can be instructed to follow this register. But it must always be reviewed by a human before seeding.

---

## Part D — Trust Pipeline

### What stages already exist

**Stage 1 — Source data exists:**
OpenFoodFacts, USDA Whole Food Service, and general nutritional reference data are accessible. The `openfoodfacts-importer.ts` and `usda-whole-food-service.ts` already exist as server-side service files.

**Stage 2 — Structural validation exists:**
`validateCanonicalSeed()` and `validateKnowledgeSeed()` are hard gates. They run before any seed operation and refuse bad data.

**Stage 3 — Admin infrastructure exists:**
Admin user role (`assertAdmin` middleware) exists. Admin routes exist for ingredient classification review. The pattern is proven.

**Stage 4 — Idempotent seeding exists:**
Both seed runners upsert by slug. Re-running is safe. Approved additions can be added without wiping existing data.

### What stages are missing

**Stage M1 — Claude proposal capture:**
There is no table or mechanism for Claude to propose a food addition and have it land in a pending/draft state. The only current path is: edit the TypeScript source files directly, then seed. Claude cannot write to the TypeScript source files autonomously without human review.

**Stage M2 — Review queue for proposed foods:**
The classification review queue (`ingredient_classifications`) exists for shopping items. There is no equivalent for canonical foods or knowledge foods. A proposed canonical food has nowhere to land in "pending" state.

**Stage M3 — Evidence source tracking:**
Nutrient and benefit links have a `source` field that always reads `"THA editorial"`. There is no mechanism for attaching an evidence reference URL or citation to a specific food→nutrient or food→benefit link.

**Stage M4 — Content-level quality gate:**
No automated check that Claude's proposed descriptions use appropriate language. This is a human review responsibility.

### Can approval be all-foods / exceptions-only / confidence-based?

Currently there is no graduated approval mechanism for foods. However, the classification pipeline does implement confidence-based routing: items with `aiConfidence >= 0.7` are applied; lower confidence items are left in `needs_review`. The same pattern could apply to food authoring.

A reasonable confidence-based approach:
- **HIGH confidence** (well-known food, unambiguous category, clear nutrient links): propose for exception-review only — THA scans but does not need to deeply verify every detail
- **MEDIUM confidence** (food is known but variety vs food decision is uncertain, or fewer clear nutrient links): full human review required
- **LOW confidence** (novel food, unusual categorisation, sparse nutrition data): flag explicitly; THA reviews and may reject

### Can Claude flag uncertainty?

YES — this is a design choice, not a technical constraint. Claude can be instructed to include, with every proposed food entry:

```
UNCERTAINTY FLAGS:
- Variety vs food decision: UNCERTAIN (recommend human review)
- Diversity group: CLEAR (joins existing "citrus" group)
- Nutrient links: PARTIAL (fibre and vitamin C well-established; others less certain)
- Evidence quality: note if emerging vs established
- Language: one sentence explaining any wording judgment calls
```

This is not automatic today but requires no infrastructure to implement — it is a prompt design choice.

---

## Part E — Open Source Ingestion

### Existing infrastructure

Two open-source import services exist in the codebase:

**OpenFoodFacts** (`server/lib/openfoodfacts-importer.ts`):
- Already in production for products/meals
- Imports product names, categories, NOVA group, nutrients, ingredients
- Scoped to beverages, baby-foods, ready-meals, frozen-foods
- NOT currently used for canonical/knowledge food authoring
- Data quality: mixed — product names are often inconsistent, ingredient text needs heavy normalisation

**USDA Whole Food Service** (`server/lib/usda-whole-food-service.ts`):
- Server-side service for whole food data
- Contains nutrient data for whole foods
- Could be used as a data source for nutrient link proposals

### What is safe to import automatically

| Data type | Safe for auto-import? | Notes |
|-----------|----------------------|-------|
| Food names (common whole foods) | SUGGEST only | Needs variety/alias/canonical classification |
| Food categories | SUGGEST only | Must match THA's category taxonomy |
| Nutrient data (per-100g values) | SUGGEST only | Needs ranking and prominence judgment |
| Health benefit links | NEVER auto-import | Always human-reviewed |
| Food descriptions | NEVER auto-import | Language safety requirement |
| storageGuidance | SUGGEST only | Can be factual and low-risk |
| Seasonality | SUGGEST only | UK-relevant; needs localisation check |
| Aliases / common names | SUGGEST only | Anti-fork check required before accepting |

**Definition of safe levels:**
- **Auto-import**: can land in production without human review
- **Suggest**: AI proposes, lands in pending, human approves before seeding
- **Never auto-import**: always requires human review and explicit approval

### Can ingestion be staged, validated, repeatable?

YES — the existing seed architecture already supports this:
- **Staged**: a "proposed" TypeScript file or a draft database table can hold proposed entries
- **Validated**: `validateCanonicalSeed()` and `validateKnowledgeSeed()` are the validators; they run as a pre-seed gate
- **Reviewed**: admin routes already exist; the same pattern can cover food review
- **Repeatable**: the upsert-by-slug pattern means re-seeding is idempotent

---

## Part F — Launch Readiness

### Target: 150–250 canonical foods and 150–250 knowledge foods

**Current state:**
- Canonical foods: 28
- Knowledge foods: 51
- Gap: ~120–222 more canonical, ~100–200 more knowledge

### Can the existing architecture support this?

**YES — with caveats.**

**Why YES:**

1. The seed data format is a plain TypeScript array. Adding 200 more entries does not require schema changes, new tables, or new infrastructure.

2. The `validateCanonicalSeed()` and `validateKnowledgeSeed()` validators already handle arbitrary scale — they are O(n) passes over the array.

3. The idempotent upsert seeding pattern scales without limit. Running seed:canonical with 250 foods is no different from running it with 28.

4. The resolver index is built from the seed and cached in memory. 250 foods ≈ ~1000 keys in the map — negligible memory impact.

5. The knowledge registry retrieval layer (`nutrition-knowledge-registry.ts`) uses indexed DB queries. 250 foods is a trivial DB load.

**The caveats:**

1. **Review throughput**: If Claude proposes 200 foods and there is no review queue, THA must review all 200 changes in the TypeScript source. This is feasible but must be batched (e.g. 20–30 foods per review session, grouped by category).

2. **Alias collision risk grows with scale**: More foods = more potential for alias key collisions. The validator catches these but Claude must be given the full existing alias list before proposing new ones.

3. **Diversity group decisions become harder at scale**: With 28 foods, every group decision has clear precedent. At 250 foods, edge cases accumulate (do "raspberries" and "blueberries" share a group? Or are they distinct plants?). THA must maintain an explicit decision log.

4. **Knowledge food language quality must be maintained at scale**: With 51 foods, every description is reviewable. At 250, review fatigue becomes a real risk. A stricter review checklist or a first-pass automated tone check would help.

**Estimated effort for 150–250 foods using Claude as first-pass author:**

- Claude proposes batches of 20–30 foods in seed format
- THA reviews each batch (estimated 60–90 minutes per batch of 25)
- Validation runs on CI before any merge
- Human seeds after approval
- Total: ~6–8 batches × 90 minutes = ~9–12 hours of THA review time to reach 200 foods

Without Claude: same 200 foods would take significantly longer to author from scratch.

**Remaining risks at launch scale:**

- Language drift: later Claude proposals may be subtly less careful than earlier human-authored entries
- Duplicate canonical/knowledge food for the same real food (e.g. "Blueberries" in both registries with different slugs)
- Variety classification errors accumulating (e.g. "raspberries" classified as a variety of "berry" when it should be its own canonical food)

---

## Part G — Confidence Rating

### Rating: AMBER

> Claude can self-author with **significant human oversight**

---

### Why AMBER, not GREEN

**GREEN would require:**
- An automated content-quality gate (not just a structural validator)
- A staging layer where Claude proposals land before human review
- Evidence source tracking for every benefit/nutrient link
- Proven track record with > 50 Claude-authored entries in production

**None of these exist today.** The structural infrastructure is excellent. The content safeguards are human-dependent.

**Why not RED:**

- The architecture has strong structural integrity (validators, anti-fork lock, resolver conflicts)
- Claude already functions as researcher, classifier, and normaliser in this codebase
- The seed format is simple enough that every proposed entry is fully readable in a GitHub diff
- The benefit slug whitelist prevents Claude from inventing new benefit categories
- The nutrient slug whitelist prevents Claude from inventing new nutrients
- The health benefit descriptions already enforce a conservative language register that Claude can match

---

## Trust Check

### Could Claude invent foods?

**YES** — Claude could propose a slug for a food that does not exist (e.g. a brand, a preparation, or a trade name treated as a canonical food). **Prevention**: THA reviews every proposed slug in the PR diff. The validator does not check whether a food is "real" — it only checks for structural consistency.

### Could Claude create duplicates?

**YES** — Claude could propose "blueberry" when "blueberries" already exists, or propose a knowledge food that overlaps an existing one with a different slug. **Prevention**: `validateCanonicalSeed()` catches exact-slug duplicates. Alias key uniqueness catches most surface forms. However, semantic duplicates (same food, different slug) are only caught by human review.

### Could Claude overstate benefits?

**YES** — Claude could write "Rich in antioxidants that prevent heart disease" instead of "associated with heart health in observational studies." **Prevention**: No automatic gate. Human review of all proposed descriptions is required. A reviewer checklist specifying forbidden language patterns would help.

### Could Claude create unsafe health advice?

**YES** — Claude could propose wording that constitutes implied medical advice ("Reduces inflammation", "Supports immunity in immune-compromised individuals"). **Prevention**: No automatic gate. THA must review all description text before seeding.

### Could Claude silently degrade quality?

**YES** — individual entries may appear plausible but be subtly weaker than the THA editorial standard. Descriptions might be longer and less precise; nutrient rankings might be arbitrary; benefit links might be overly generous. **Prevention**: Batch review against existing entries; a checklist; example-based prompting with the current seed as the reference standard.

---

## Recommendations

### R1 — Use the git PR workflow as the approval pipeline (immediate)

The simplest safe path: Claude proposes additions by writing changes to the seed files (`shared/canonical/foods.ts`, `shared/knowledge/*.ts`), a PR is opened, `validateCanonicalSeed()` and `validateKnowledgeSeed()` run on CI, and THA reviews the TypeScript diff before merging.

This requires no new infrastructure. It works today.

**What THA reviews per PR:**
- Every new `{ food: {...} }` entry (slug, name, category, variety decisions)
- Every new alias (alias_key uniqueness is guaranteed by CI; human checks alias type is correct)
- Every new knowledge food description (language, conservatism, accuracy)
- Every new nutrient/benefit link in `relationships.ts`

Recommended batch size: 20–30 foods per PR to keep review tractable.

### R2 — Define a review checklist for Claude-proposed knowledge foods (before first batch)

A short, non-negotiable checklist applied to every proposed description:
- No disease names
- No "prevents", "cures", "treats", "proven"
- Must use "associated with", "contributes to", "rich in", or equivalents
- Maximum 2 sentences
- UK English
- No brand names

### R3 — Give Claude the full existing seed as context for every authoring task

Claude must be able to detect collisions, match the editorial register, and follow variety-vs-alias decisions. The full CANONICAL_SEED and FOOD_SEED should be passed as context in every food authoring prompt.

### R4 — Add `source: 'claude'` tagging to Claude-proposed entries (immediate, low-effort)

Both tables already have a `source` field (defaults to `"THA editorial"`). Claude-proposed entries should be seeded with `source: 'claude'` so they can be queried, audited, or rolled back separately from human-authored content.

### R5 — Build a draft/pending table for food proposals (future, medium effort)

SUGGESTION: A lightweight `proposed_canonical_food` and `proposed_knowledge_food` staging table where Claude's proposals land before a human approves and promotes them. This mirrors the `ingredient_classifications` pipeline but for food authoring. It would support:
- Asynchronous review (THA reviews on their own schedule)
- Partial approval (approve 18 of 25 proposed foods in a batch)
- Rejection with notes (reject a food and Claude can revise)

This is not needed at MVP scale (150–250 foods via PR review is workable) but becomes important at > 500 foods.

### R6 — Maintain an explicit variety/alias/food decision log (ongoing)

As the food count grows, WS1.5-style decisions must be documented and accessible to Claude. Every ambiguous case (is "raspberry" a variety of "berry" or a distinct canonical food?) resolved by THA should be added to a decision document that Claude is given as context. Without this, consistency degrades at scale.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Claude proposes medically unsafe wording | Medium | High | Human review of every description before seeding |
| Semantic duplicates (same food, different slug) | Medium | Medium | THA reviews slug list per batch; validator catches exact duplicates |
| Alias collisions at scale | Medium | Low | Validator catches these; detected before production |
| Variety vs food classification errors | High | Medium | Provide WS1.5 rules and existing examples as context |
| Language quality drift over batches | Medium | Medium | Review checklist; compare against existing entries |
| Evidence overstated (nutrient/benefit links) | Medium | Medium | THA validates all links; benefit slugs are a whitelist |
| Missing diversity group link | Low | Low | Validator detects and refuses |
| Claude invents a nutrient slug | Low | Low | Validator detects and refuses |

---

## Definition of Done Assessment

| Criterion | Status |
|-----------|--------|
| Current authoring pipeline understood | COMPLETE |
| Canonical authoring reviewed | COMPLETE |
| Knowledge authoring reviewed | COMPLETE |
| Trust and approval pipeline assessed | COMPLETE |
| Open-source ingestion investigated | COMPLETE |
| Launch readiness assessed | COMPLETE |
| Confidence rating provided | COMPLETE — AMBER |
| Clear recommendations provided | COMPLETE |

No implementation done. No schema changes. No DB changes. No migrations. No food creation.

---

## Final Answer

### Can Claude become The Healthy Apples Food Knowledge Author?

**YES — with structured oversight.**

**What the approval workflow looks like:**

```
THA defines a batch scope
   (e.g. "propose 25 leafy greens + brassica canonical and knowledge foods")
           ↓
Claude reads CANONICAL_SEED + FOOD_SEED as context
Claude reads WS1.5 decision rules as context
Claude reads review checklist as context
           ↓
Claude proposes additions in exact seed format
Claude flags any uncertainty (variety vs food, missing WS0 link, etc.)
Claude marks source as 'claude'
           ↓
PR opened against main
CI runs validateCanonicalSeed() + validateKnowledgeSeed()
CI gate: MUST PASS before THA review
           ↓
THA editorial review
- Slug and name correct?
- Variety / alias / food classification correct?
- Descriptions follow language rules?
- Nutrient and benefit links defensible?
- Any flagged uncertainty resolved?
           ↓
THA merges → seed scripts run → production
```

**What is missing and must be built before scaling:**

1. A review checklist (document only — no code needed)
2. A source='claude' tagging convention in the seed (one-line change per entry)
3. An explicit decision log for variety/alias/food edge cases (document only)

**What the architecture already provides:**

1. Structural validators that refuse inconsistent data
2. Anti-fork lock (alias uniqueness)
3. Idempotent seeding (safe to re-run)
4. Admin infrastructure (admin role, admin routes)
5. An existing AI-propose → pending → approve pattern (ingredient classifications)
6. A `status` field on canonical_food and food_variety (active | draft | merged | retired)
7. A `source` field on every canonical and knowledge table row

**The architecture is ready. The gap is workflow documentation and review discipline, not engineering.**

---

## SUGGESTION — Future Pipeline Ideas

These are not recommendations for now. Listed for future consideration:

- SUGGESTION: A `proposed_foods` staging table for async review without PR workflow
- SUGGESTION: Automated description tone checker (regex or LLM-based) before human review
- SUGGESTION: Evidence source URL field on food→benefit links (currently no citation mechanism)
- SUGGESTION: A Claude-readable "decision history" file that logs all resolved edge cases
- SUGGESTION: Batch import from USDA FoodData Central as a data source for nutrient link proposals
- SUGGESTION: A confidence score field on food→nutrient links (currently stores 'established' as default for all)
- SUGGESTION: A food report readiness flag on canonical foods indicating whether Food Report content is complete
