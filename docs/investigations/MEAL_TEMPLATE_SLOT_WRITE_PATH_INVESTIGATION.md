MEAL TEMPLATE SLOT WRITE PATH INVESTIGATION: COMPLETE

---

**Rollback Identifier:** `investigation/meal-template-slot-write-path-20260608-211617`
**Branch:** main
**Commit at investigation start:** `1e83f32`
**Date:** 2026-06-08
**Risk Level:** GREEN — Investigation only. No code changed. No data changed.

---

## Files Reviewed

| File | Lines | Purpose |
|------|-------|---------|
| `shared/schema.ts` | 48–72, 805–845 | mealTemplates table definition, insertMealTemplateSchema |
| `server/routes.ts` | 5307–5450 | All mealTemplate API routes — POST, PATCH, GET, DELETE, resolve |
| `server/storage.ts` | 925–980 | Storage layer — createMealTemplate, updateMealTemplate |
| `server/meal-resolution-service.ts` | Full file | What fields the resolver reads from templates |
| `server/lib/auto-import-service.ts` | Full file | How auto-import creates templates |
| `server/seeds/run-additives-seed.ts` | Full file | Established seed script pattern |
| `server/migrations/runner.ts` | 1–40 | Migration runner pattern |
| `scripts/seed-default-pantry-food.ts` | 1–50 | Seed script via storage pattern |
| `server/template-migration.ts` | Full file | Existing template migration pattern |
| Live database | — | Constraint check, duplicate names, candidate name conflicts |

---

## ROOT FINDING

**The POST /api/meal-templates route CAN accept slot data today and will write it to the database.**

**However, a direct seed script is the safest write path for authored meal shells.**

---

## INVESTIGATION: QUESTION 1 — Can POST create templates with slot data?

### Route Handler

```typescript
// server/routes.ts:5329
app.post("/api/meal-templates", async (req, res) => {
  try {
    const data = insertMealTemplateSchema.parse(req.body);
    const template = await storage.createMealTemplate(data);
    res.status(201).json(template);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: err.errors });
    // ...
  }
});
```

### Schema: insertMealTemplateSchema (shared/schema.ts:805)

```typescript
export const insertMealTemplateSchema = createInsertSchema(mealTemplates).pick({
  name: true,
  category: true,
  description: true,
  imageUrl: true,
  sharedBaseComponents: true,   // ← INCLUDED
  proteinSlots: true,           // ← INCLUDED
  carbSlots: true,              // ← INCLUDED
  vegSlots: true,               // ← INCLUDED
  toppingSlots: true,           // ← INCLUDED
  sauceSlots: true,             // ← INCLUDED
  compatibleDiets: true,        // ← INCLUDED
  estimatedTotalTime: true,     // ← INCLUDED
  estimatedExtraTimePerVariant: true, // ← INCLUDED
  costBand: true,               // ← INCLUDED
  isActive: true,
  // ... other fields
});
```

All slot fields are included in the Zod schema used to parse the POST body.

### Storage Layer

```typescript
// server/storage.ts:939
async createMealTemplate(data: InsertMealTemplate): Promise<MealTemplate> {
  const [result] = await db.insert(mealTemplates).values(data).returning();
  return result;
}
```

`createMealTemplate` does a direct insert of whatever `InsertMealTemplate` contains. No field filtering. Slot data passes straight through to the database.

### Verdict: YES

**POST /api/meal-templates can create templates with all slot fields today.** No schema changes. No route changes. No storage changes.

A POST body of:
```json
{
  "name": "Cooked Breakfast",
  "category": "breakfast",
  "sharedBaseComponents": ["mushrooms", "cherry tomatoes", "fried onions", "avocado"],
  "proteinSlots": ["eggs", "sausages", "chickpea patty"],
  "carbSlots": ["GF roll", "sweet potato hash"],
  "compatibleDiets": ["Vegetarian", "Gluten-Free", "Dairy-Free"],
  "estimatedTotalTime": 25,
  "estimatedExtraTimePerVariant": 5,
  "costBand": "standard"
}
```

Would be accepted by `insertMealTemplateSchema.parse()` and persisted by `createMealTemplate`.

### Critical Risk on the POST Route

**The POST route has no `isAuthenticated()` guard.**

```typescript
// routes.ts context immediately before POST:
app.get("/api/starter-meals", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);  // ← guarded
  // ...
});

// Then:
app.get("/api/meal-templates", async (_req, res) => {  // ← no guard
app.post("/api/meal-templates", async (req, res) => {  // ← no guard
app.patch("/api/meal-templates/:id", async (req, res) => {  // ← no guard
app.delete("/api/meal-templates/:id", async (req, res) => {  // ← no guard
```

All four CRUD operations on `/api/meal-templates` are unauthenticated. **Any HTTP client can create, update, or delete templates without logging in.**

This is a pre-existing condition, not introduced by this investigation. But it means using the POST route to seed authoritative meal shell data carries risk: the same unprotected endpoint is publicly accessible.

---

## INVESTIGATION: QUESTION 2 — Should PATCH be extended to support slot fields?

### Current PATCH Handler

```typescript
// server/routes.ts:5342
app.patch("/api/meal-templates/:id", async (req, res) => {
  try {
    const updateSchema = z.object({
      name: z.string().min(1).optional(),
      category: z.string().optional(),
      description: z.string().nullable().optional(),
      // ← sharedBaseComponents, proteinSlots, carbSlots, vegSlots,
      //   toppingSlots, sauceSlots, compatibleDiets NOT included
    });
    const data = updateSchema.parse(req.body);
    const template = await storage.updateMealTemplate(parseInt(req.params.id), data);
    // ...
  }
});
```

Slot fields sent to PATCH are silently dropped by `updateSchema.parse()`. They do not reach storage.

### Storage Layer PATCH Capability

```typescript
// server/storage.ts:944
async updateMealTemplate(id: number, data: Partial<InsertMealTemplate>): Promise<MealTemplate | undefined> {
  const [result] = await db.update(mealTemplates).set(data).where(eq(mealTemplates.id, id)).returning();
  return result;
}
```

The storage layer accepts `Partial<InsertMealTemplate>` — which includes all slot fields. **The storage can write slot data on update. Only the route blocks it.**

### Verdict: YES, PATCH should be extended — but not yet

**Extending PATCH is the right move for ongoing template management, but should be done after initial templates are seeded and validated.**

The change required is minimal:

```typescript
// Current:
const updateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().optional(),
  description: z.string().nullable().optional(),
});

// Extended (what it would become):
const updateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().optional(),
  description: z.string().nullable().optional(),
  sharedBaseComponents: z.string().array().nullable().optional(),
  proteinSlots: z.string().array().nullable().optional(),
  carbSlots: z.string().array().nullable().optional(),
  vegSlots: z.string().array().nullable().optional(),
  toppingSlots: z.string().array().nullable().optional(),
  sauceSlots: z.string().array().nullable().optional(),
  compatibleDiets: z.string().array().nullable().optional(),
  costBand: z.string().nullable().optional(),
  estimatedTotalTime: z.number().int().nullable().optional(),
  estimatedExtraTimePerVariant: z.number().int().nullable().optional(),
});
```

This is a 10-line change in routes.ts. No storage change. No schema change.

**Stop condition:** Do not extend PATCH before the auth situation is resolved. Extending PATCH on an unauthenticated route enables any HTTP client to overwrite slot data on any template. The PATCH extension and an `isAuthenticated()` guard must be added together.

---

## INVESTIGATION: QUESTION 3 — Is a seed script safer than API creation?

### Comparison

| Factor | POST via API | Seed Script (direct DB) |
|--------|-------------|------------------------|
| Auth requirement | None (unguarded route) | Not applicable — runs server-side |
| Idempotency | No built-in guard — can create duplicates | Can implement `ON CONFLICT DO NOTHING` or lookup-first |
| Reviewability | JSON payload only | Readable TypeScript, code-reviewed before execution |
| Auditability | No trace unless logged | Creates named file in `/server/seeds/` |
| Transaction safety | Single insert per call | Can wrap all inserts in a transaction |
| Environment targeting | Any environment with network access | Only the environment where the script runs |
| Rollback | Manual DELETE required | Can include a dry-run mode |
| Precedent | Not used for authoritative data | `run-additives-seed.ts` follows this exact pattern |

### Existing Seed Pattern (server/seeds/run-additives-seed.ts)

```typescript
// Idempotent — safe to run multiple times
for (const row of ADDITIVES_SEED) {
  const result = await db.execute(sql`
    INSERT INTO additives (name, type, ...)
    VALUES (${row.name}, ${row.type}, ...)
    ON CONFLICT (name) DO NOTHING
  `);
}
```

**Verdict: Seed script is significantly safer.** The POST route creates templates with no idempotency guarantee and no auth protection. A seed script can be written, reviewed as code, tested in dry-run mode, and executed exactly once.

### Name Uniqueness Risk

The `meal_templates` table has **no unique constraint on the `name` column** (confirmed by live database query). Only the primary key is unique.

Live evidence — duplicate names already exist:
```
Bounty       → 2 rows
Snickers     → 2 rows
Beef Lasagne → 2 rows
```

This means the API POST can create duplicates. A seed script must implement its own lookup-first guard:

```typescript
// Pattern: check before insert
const existing = await db.select()
  .from(mealTemplates)
  .where(sql`LOWER(TRIM(${mealTemplates.name})) = LOWER(${templateName})`);
if (existing.length === 0) {
  await db.insert(mealTemplates).values({ name: templateName, ... });
}
```

**None of the 14 candidate meal shell names conflict with existing templates** (confirmed by live database query). All 14 returned 0 matches.

---

## INVESTIGATION: QUESTION 4 — Update existing templates or create new ones?

### Current State of Existing Templates

- 632 templates, all auto-created
- All descriptions are either "Auto-created template from existing meal" or "Auto-created template"
- All slot fields are null
- All are linked to real meals (2,083 meals are linked)
- Templates currently serve as grouping records and resolution source pointers

### Risk of Updating Existing Templates

Updating the 632 existing templates (e.g., to add slot data to "Scrambled Eggs" or "Porridge") would:

1. **Affect meal resolution** — `meal-resolution-service.ts` uses these templates to pick between scratch and ready meal implementations. Adding slot data does not break this, but it changes what `getMealTemplate()` returns for those records.

2. **Create naming collisions** — if a user's "Scrambled Eggs" recipe is linked to template ID 201, and we add slot data to template 201, those slots will now appear on every user's version of that template. This could cause confusion when `scoreTemplate()` is eventually called.

3. **Data ownership conflict** — the existing 632 templates are effectively user-data pointers. They belong to the user-meal linking system. Repurposing them as household meal shells conflates two different concepts.

### Verdict: Create NEW templates — do not modify existing ones

Meal shell templates should be **new records** with a distinct `description` field value (e.g., `"Household meal shell — component-based"`) to distinguish them from auto-created grouping templates.

Reasoning:
- Zero name conflicts exist for the 14 candidate shell names
- New records are additive — they do not touch the 2,083 existing meal-template links
- Existing template functions (grouping, resolution) are completely unaffected
- The new records can be identified and queried distinctly via their description or a future `templateType` field

---

## INVESTIGATION: QUESTION 5 — Should category capitalisation be normalised first?

### Current State

Both "breakfast" and "Breakfast" exist (similarly for dinner, lunch, dessert). Caused by different auto-creation code paths using different casing.

```
dinner    : 289 rows
Dinner    : 26 rows
breakfast : 38 rows
Breakfast : 3 rows
lunch     : 60 rows
Lunch     : 5 rows
dessert   : 41 rows
Dessert   : 2 rows
```

### Impact on Component Template Work

`matchMealsForHousehold()` queries `WHERE is_active = true` — no category filter. So capitalisation does not affect household scoring today.

If a future planner Tier-4 recovery filters templates by slot category (e.g., only breakfast templates for breakfast slots), inconsistent capitalisation would cause misses.

### Verdict: Normalise new templates only — defer bulk fix

New meal shell templates should use consistent **lowercase** category values. The bulk normalisation of 632 existing templates is a separate, low-risk UPDATE but should not block meal shell work. If done, it should be:
1. A standalone migration entry in `server/migrations/runner.ts`
2. Using `UPDATE meal_templates SET category = LOWER(TRIM(category)) WHERE category != LOWER(TRIM(category))`
3. Idempotent by definition

**Stop condition:** Do not normalise existing categories until after the meal shell seed is validated. It is a parallel concern, not a dependency.

---

## INVESTIGATION: QUESTION 6 — Risk to existing meal-template uses

### Use 1: Meal grouping (all 2,083 meals linked to templates)

**Risk: NONE.**

Meal grouping uses `meals.meal_template_id` (foreign key). Adding new templates with slot data does not affect existing `meal_template_id` values or the linked meal records. Existing templates remain unchanged.

### Use 2: Product linking (products-page.tsx)

**Risk: NONE.**

Product linking creates templates with `{ name, category: 'dinner' }` and then links a `mealTemplateProducts` record. New meal shell templates with slot data are separate records. The product linking flow does not interact with slot fields.

### Use 3: Meal resolution (meal-resolution-service.ts)

**Risk: NONE.**

`resolveTemplate()` reads: `template.name`, `template.id`, and the linked `mealTemplateProducts` and `getMealsForTemplate()` results. It **does not read any slot field**. Adding slot data to templates has zero effect on resolution.

### Use 4: auto-import-service.ts

**Risk: NONE.**

Auto-import creates templates with `{ name, category }` only. It looks up templates by name case-insensitively. Since the 14 candidate meal shell names do not exist yet, there is no collision risk. When auto-import encounters "Cooked Breakfast" as a recipe name (unlikely but possible), `getMealTemplateByName` would find the existing meal shell template and link to it — which is the correct behaviour.

### Use 5: household-meal-matcher.ts `scoreTemplate()`

**Risk: NONE (positive impact).**

`scoreTemplate()` currently returns `null` for all templates because all have empty slot arrays. Populating new meal shell templates with slot data enables `scoreTemplate()` to return non-null results for those templates. Existing templates with null slots continue to return null. The function handles this correctly at line 245: `if (allSlotIngredients.length === 0) return null`.

---

## WRITE PATH RECOMMENDATION

### Safest Path: Server-side seed script

**Option A — Seed script (recommended first step)**

Create: `server/seeds/seed-meal-shell-templates.ts`

Pattern: follow `server/seeds/run-additives-seed.ts`

```typescript
// Pseudocode — not implemented
const MEAL_SHELLS = [
  {
    name: "Cooked Breakfast",
    category: "breakfast",
    description: "Household meal shell — component-based",
    sharedBaseComponents: ["mushrooms", "cherry tomatoes", "fried onions", "avocado", "asparagus"],
    proteinSlots: ["eggs", "pork sausages", "plant-based sausages", "chickpea patty"],
    carbSlots: ["gluten-free roll", "sweet potato hash", "GF sourdough"],
    sauceSlots: ["tomato ketchup", "brown sauce"],
    compatibleDiets: ["Vegetarian", "Gluten-Free", "Dairy-Free", "Mediterranean"],
    estimatedTotalTime: 25,
    estimatedExtraTimePerVariant: 5,
    costBand: "standard",
  },
  // ... additional shells
];

// Idempotent: lookup-first, skip if exists (no unique constraint, so cannot use ON CONFLICT ON name)
for (const shell of MEAL_SHELLS) {
  const existing = await db.select()
    .from(mealTemplates)
    .where(sql`LOWER(TRIM(${mealTemplates.name})) = LOWER(${shell.name.trim()})`);
  if (existing.length === 0) {
    await db.insert(mealTemplates).values(shell);
    console.log(`Inserted: ${shell.name}`);
  } else {
    console.log(`Skipped (exists): ${shell.name}`);
  }
}
```

Add to `package.json`:
```json
"seed:meal-shells": "tsx server/seeds/seed-meal-shell-templates.ts"
```

**Why this is safest:**
- Code-reviewable before execution
- Idempotent by design (lookup-first)
- No auth exposure
- No impact on existing templates
- Follows established project pattern
- Can be dry-run tested (add `DRY_RUN=true` flag)
- Full transaction wrapping available

**Option B — POST /api/meal-templates (works but not recommended for authored data)**

The route accepts slot data and the storage will persist it. However:
- No auth guard — publicly accessible
- No idempotency — can create duplicates if called twice
- Less reviewable than a seed script
- Appropriate for tooling or one-off admin operations, not for authoritative seeding

**Option C — Extend PATCH + add auth, then manage templates via API**

Required changes (routes.ts, ~15 lines):
1. Add `isAuthenticated()` guards to all four mealTemplate CRUD routes
2. Extend PATCH `updateSchema` to include slot fields

This is the right long-term approach for ongoing template management. It should be implemented after Option A validates the concept. The storage layer already supports it — only the route validation needs changing.

**Sequencing: A → validate → C.**

---

## SCHEMA CHANGES REQUIRED

**None.** All slot fields exist in the database schema. `insertMealTemplateSchema` includes them. `createMealTemplate` passes them through. The write path requires zero schema changes.

---

## API CHANGES REQUIRED

**For initial seeding: None.** The seed script uses the storage layer directly, bypassing the API.

**For ongoing template management (Option C, later):**
- Add `isAuthenticated()` to POST, PATCH, DELETE routes (~3 lines)
- Extend PATCH `updateSchema` to include slot fields (~10 lines)

---

## DATA BACKFILL REQUIRED

**No** for existing 632 templates. They should be left unchanged.

**New records only.** Meal shell templates are new rows, additive, with no effect on existing data.

---

## RISKS AND STOP CONDITIONS

| Risk | Severity | Stop Condition |
|------|----------|----------------|
| POST route has no auth guard | Amber | Do not use the API to seed authoritative data until auth is added |
| No unique constraint on name | Amber | Seed script must implement lookup-first guard; never use INSERT without existence check |
| Duplicate names already exist (Bounty, Snickers, Beef Lasagne) | Low | Does not affect meal shell work — none of the 14 candidate names conflict |
| Category capitalisation inconsistency | Low | New templates must use lowercase; bulk fix deferred |
| PATCH cannot update slot fields | Amber | Acceptable for initial seeding via script; becomes a blocker when templates need editing |
| scoreTemplate called on null-slot templates | None | Already handled — returns null for templates with no slot data |
| Seed creates template with conflicting name to existing linked meal | Low | Confirmed: 0 conflicts for 14 candidate shell names |
| meal-resolution-service affected by slot data | None | Confirmed: resolution service does not read slot fields |

### Hard Stop Conditions

1. **Do not UPDATE existing 632 templates** — they are user-data pointers. Only INSERT new records.
2. **Do not extend PATCH without adding `isAuthenticated()`** — unguarded slot editing is a security gap.
3. **Do not seed templates in production before validating `scoreTemplate()` output** on a test household in the development environment.

---

## RECOMMENDED NEXT DECISION

Three decisions are now unblocked:

**Decision 1 — Seed script (Option A) — can proceed now**
No code changes. Author `server/seeds/seed-meal-shell-templates.ts` with 5–10 breakfast/lunch/dinner meal shells. Run against dev environment. Validate `matchMealsForHousehold()` output manually.

**Decision 2 — Auth fix (prerequisite for Option C)**
Add `isAuthenticated()` to the four mealTemplate CRUD routes. Low risk, improves security. Should be done regardless of meal shell work.

**Decision 3 — PATCH extension (Option C)**
After Option A validates the concept, extend PATCH to accept slot fields. Enables template editing without rerunning seed scripts. Requires Decision 2 first.

The investigation does not choose between these decisions — that is a product/engineering call. The evidence confirms all three are technically safe and clearly scoped.

---

## Data Impact Declaration

- Reads existing data: Yes (live DB queries, file reads)
- Writes new data: No
- Changes meaning of existing data: No
- Requires backfill: No

---

*Investigation complete. No code changed. No data modified.*
