# NK6I — Canonical Food Identity Resolution Audit

**Date:** 2026-07-07
**Author:** Claude Code (investigation + fix)
**Branch:** `int1-intelligence-platform`
**Scope:** Investigate and fix Canonical Food **identity** resolution in the NK canonical-food importer. **No Batch 001 import performed. No `--force-upsert`. No second resolver. No duplicate foods created.**
**Governing architecture read first:** `docs/architecture/README.md` (Architecture Bootstrap) → **GOV2 Canonical Alias Principle** applied throughout.

---

## 0. Rollback identifier

| Item | Value |
|---|---|
| **Rollback stash (working tree, tracked + untracked)** | `e9874962ff4ad4e0df95e9c846f3d7f30d61175c` — `git stash@{0}` "NK6I_ROLLBACK: pre-investigation snapshot 2026-07-07T20:00:54Z" |
| **Rollback tag (HEAD anchor)** | `NK6I-rollback-pre-investigation` → `45443a8f81c8a28ede0586192dd2965ba3aaf87a` |
| **Restore working tree** | `git stash apply e9874962` (non-destructive; original snapshot preserved) |
| **Restore committed state** | `git reset --hard NK6I-rollback-pre-investigation` |
| **Database rollback** | **None required — zero DB writes were performed by this task** (investigation + code change only; no import run). |

The snapshot was created with `git stash create` + `git stash store` so it captured the full pre-change working tree **without** disturbing it.

---

## 1. Does a canonical food identity resolver already exist? — **YES**

There is a single, governed, alias-aware **food identity** resolver:

- **`shared/canonical/resolver.ts`** — `resolveCanonicalFood(input)` / `buildCanonicalIndex()`, re-exported from `shared/canonical/index.ts`.
- It resolves free text → **one** canonical food via an **exact-key** index built from the editorial seed (`shared/canonical/foods.ts` → `CANONICAL_SEED`): canonical name, canonical slug, variety names/slugs, and **aliases** (`CANONICAL_FOOD_ALIAS_SEED`, many-to-one). It is pure/deterministic, records key collisions as anti-fork **conflicts**, and returns an honest `unknown` result rather than inventing an identity — exactly the GOV2 Rule 4/5/7 shape.
- Each canonical food carries a `knowledgeFoodSlug` link to the `knowledge_food` identity the importer actually writes to (e.g. canonical `carrots` → `knowledgeFoodSlug: "carrots"`, canonical `tomato` → `knowledgeFoodSlug: "tomatoes"`, canonical `corn` (name "Sweetcorn") → `knowledgeFoodSlug: "corn"`, canonical `fennel` → `knowledgeFoodSlug: "fennel"`).

> **Not to be confused with** `shared/knowledge/canonical-vocabulary-resolver.ts` (`resolveNutrientTerm` / `resolveBenefitTerm`). That is the **vocabulary** resolver for nutrient/benefit terms — a *different* axis. It is **not** a food-identity resolver, and the importer already used it correctly for nutrients/benefits. The food-identity axis was the gap.

**Conclusion:** a food-identity resolver exists and **supports aliases**. Per the task's decision rule, the correct action is therefore to **wire the importer to it** — not to build anything new.

---

## 2. Did the NK importer use it before insert? — **NO (root cause)**

`server/lib/canonical-foods-importer.ts` resolved **nutrients/benefits** through the vocabulary resolver, but its **food-identity duplicate guard was pure slug equality** against the `knowledge_food` table:

```ts
// (pre-fix) Step 3: Check for duplicate
const existing = await db.query.knowledgeFoods.findFirst({
  where: (t) => eq(t.slug, foodIdentity.slug),   // ← slug equality ONLY
});
if (existing && !forceUpsert) { /* reject */ }
// else → db.insert(knowledgeFoods)               // ← silently mints a new identity
```

The importer **never called `resolveCanonicalFood`**. Aliases of an existing food therefore passed straight through the guard (their slug differs from the existing canonical slug) and were **silently inserted as a second identity** — a direct GOV2 Rule 7 / Core Principle 1 violation.

---

## 3. `carrot.yaml` traced end-to-end (pre-fix)

1. CLI `import-canonical-foods.ts` globs the file → `importCanonicalFood("carrot.yaml")`.
2. Parse YAML → `record.canonical_slug: "carrot"`, `display_name: "Carrot"`, `identity.aliases: [carrots, orange carrot, …]`.
3. `extractFoodIdentity` → `{ slug: "carrot", name: "Carrot", aliases: [...] }`.
4. **Duplicate guard:** `findFirst(eq(knowledgeFoods.slug, "carrot"))`. The existing canonical food is **`carrots`** (plural). `"carrot" ≠ "carrots"` → **no row found** → guard passes.
5. Nutrient/benefit terms resolve cleanly (vocabulary axis is 100% clean for the batch).
6. `db.insert(knowledgeFoods)` with slug **`carrot`** → **a second canonical identity for the same real-world food** now exists alongside `carrots`. ⛔

The alias-aware resolver *would* have caught it — `resolveCanonicalFood("carrot")` → `matchType: "alias"`, canonical `carrots`, `knowledgeFoodSlug: "carrots"` — but it was never consulted.

**Same failure for:** `tomato`→`tomatoes`, `sweetcorn`→`corn`, `fennel-bulb`→`fennel`.
Note `fennel-bulb` is subtle: `normalizeIngredientKey` strips the hyphen without inserting a space (`"fennel-bulb"→"fennelbulb"`), so the **raw slug** does not resolve; it only resolves when fed as **`"fennel bulb"` (slug hyphens→spaces) or the display name** — which the fix does.

---

## 4. Correct fix — **A (wire the importer to the existing resolver)**, with a minimal additive extension

| Option | Verdict |
|---|---|
| **A. Wire the importer to the existing resolver** | ✅ **CHOSEN.** The resolver already supports aliases; GOV2 Rule 4/5 requires every import path to resolve through the one resolver before minting. |
| B. Extend the existing resolver | ✅ *Minimal, additive part of A only:* the resolver did not surface `knowledgeFoodSlug` (the link from the canonical-food model to the `knowledge_food` identity the importer writes). One additive field was added — **not** a behaviour change, **not** a new resolver. |
| C. Add a separate pre-import reconciliation step | ❌ Rejected. A second resolution path invites divergence (GOV2 Rule 5: one resolver, one enforcement point). Reconciliation lives *inside* the importer, calling the *one* resolver. |

### What changed (2 files, additive, no new resolver, no import)

**`shared/canonical/resolver.ts`** — surfaced the already-seeded `knowledgeFoodSlug` on `IndexTarget` + `CanonicalResolution` (varieties honour their own link, else inherit the parent's). Purely additive; the existing resolver test (43 logic assertions) still passes.

**`server/lib/canonical-foods-importer.ts`** — added **Step 3a: GOV2 identity reconciliation** *before* the slug-equality guard and insert:

- **HARD BLOCK (duplicate identity → do not mint):** the food's **own identity** — slug (raw), slug with hyphens→spaces, or display name — resolves to an existing `knowledge_food` under a *different* slug. Returns an error citing the existing identity and stops. A merge is a **governed, human-approved** decision (draft `duplicate_policy: stop_on_slug_conflict_or_merge_only_with_explicit_approval` + GOV2 Rule 7), never a silent importer insert. `--force-upsert` is explicitly **not** allowed to bypass it.
- **SOFT WARNING (review, not blocked):** a **declared alias** resolves to a *different* existing identity (a scope-overlap signal, e.g. `sweet-pepper`'s alias "red pepper" → existing `red-pepper`). Surfaced for editorial review; the food's own identity may be legitimately distinct.
- Result now carries an `identity` block (`draftSlug`, `resolvedToSlug`, `matchedOn`, `outcome`, `aliasOverlaps`) for transparent reporting.

### Verification (read-only, zero DB writes)

- `tsc` on both changed files: **clean** (0 new errors; remaining project errors are pre-existing baseline in unrelated modules).
- Existing resolver test `server/tests/test-canonical-food.ts`: **43/43 logic assertions pass** (the 3 failures are pre-existing "live DB not fully seeded" count checks, unrelated).
- Read-only reconciliation replay over all 30 batch drafts, using the importer's exact candidate logic:

| Signal | Count | Foods |
|---|---|---|
| **HARD BLOCK (duplicate identity prevented)** | **4** | `carrot`→`carrots`, `tomato`→`tomatoes`, `sweetcorn`→`corn`, `fennel-bulb`→`fennel` |
| SOFT alias-overlap (review) | 6 | `cabbage`→{white/red/savoy-cabbage}, `green-beans`→`runner-beans`, `sweet-pepper`→`red-pepper`, `sweetcorn`→`baby-corn` |
| Not blocked → slug-equality guard | 26 | remaining foods (exact existing slugs, or genuinely new) |

The 4 hard blocks match the expected architecture exactly; no DB write occurred at any point.

---

## 5. Should Batch 001 be **import**, **merge**, or **blocked**? — **BLOCKED now → MERGE after reconciliation**

**BLOCKED as-is.** Two independent gates remain (neither is a content-quality problem — the batch is editorially strong and 100% vocabulary-clean):

1. **Identity reconciliation (now enforced by the fix, not silent):** the 4 duplicate-identity drafts (`carrot`, `tomato`, `sweetcorn`, `fennel-bulb`) will be **blocked** by the importer. They are **merges** into existing identities (`carrots`, `tomatoes`, `corn`, `fennel`) — a governed, human-approved decision (align the draft slug to the existing identity, or fold the richer metadata into the existing food). The 6 soft alias overlaps (esp. `sweet-pepper`/`red-pepper`, `green-beans`/`runner-beans`) need an editorial scope ruling before import.
2. **DB target confirmation** (see §6) before *any* import.

**Net classification:** essentially the entire batch is **MERGE / enrichment of existing identities**, not new-identity creation — of 30 drafts, ~29 map to existing canonical foods; there are **no cleanly-new foods** pending the `sweet-pepper` editorial decision. So: **BLOCKED now; becomes a MERGE/enrichment operation** once (a) the 4 identity conflicts are reconciled, (b) the soft overlaps are ruled on, and (c) a dev DB target is confirmed.

---

## 6. DATABASE_URL target confirmation

| Marker | Value |
|---|---|
| `DATABASE_URL` host / db | `helium` / `heliumdb` (user `pos***`) |
| `REPL_ID` | `a6376337-…` (set → inside a Replit workspace) |
| `REPLIT_DEPLOYMENT` | **unset** (→ dev workspace, **not** a deployment) |
| `NODE_ENV` | unset |

**Assessment:** this is the **Replit dev workspace** (interactive workspace, not a deployment). That is consistent with a lower environment. **However**, `heliumdb` is the app's single configured database and there is no separate dev/prod split visible from here — so it **cannot be cryptographically confirmed to be throwaway**. Per the "confirm lower environment before import" constraint: **explicitly confirm/point `DATABASE_URL` at a known dev/throwaway database before any future import.** No import was run in this task, so nothing was written regardless.

---

## 7. Guardrail compliance

- ✅ No second resolver — extended the one existing resolver additively; importer calls only `resolveCanonicalFood`.
- ✅ No duplicate canonical foods created — the fix **prevents** duplicates; zero DB writes performed.
- ✅ Batch 001 **not** imported.
- ✅ `--force-upsert` **not** used (and is now explicitly barred from bypassing identity blocks).
- ✅ Rollback protection created before any change (§0).

---

## 8. Report location

`docs/investigations/NK6I_CANONICAL_FOOD_IDENTITY_RESOLUTION_AUDIT.md` (this file).

**Related:** `docs/investigations/BATCH_001_CANONICAL_FOOD_IMPORT_VALIDATION.md` (prior read-only validation that first surfaced the identity-axis risk), `docs/architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md` (governing principle).
