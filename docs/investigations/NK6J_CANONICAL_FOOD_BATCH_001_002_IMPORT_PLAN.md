# NK6J — Canonical Food Batch 001 & 002 Import Plan (Validation, No Import)

**Date:** 2026-07-07
**Author:** Claude Code (validation + plan)
**Branch:** `int1-intelligence-platform`
**Scope:** Validate Batch 001 and Batch 002 through the **NK6I-fixed alias-aware canonical food identity resolver**. **No import performed. No `--force-upsert`. No duplicate foods/nutrients/benefits created. No `manifest.yaml`/`README`/prompt files touched.**
**Governing architecture read first:** `docs/architecture/README.md` (Architecture Bootstrap) → **GOV2 Canonical Alias Principle** applied throughout.
**Predecessor:** `docs/investigations/NK6I_CANONICAL_FOOD_IDENTITY_RESOLUTION_AUDIT.md` (fixed the importer to reconcile identity through the one resolver before minting).

---

## 0. Rollback identifier

| Item | Value |
|---|---|
| **Rollback tag (HEAD anchor, from NK6I — still present)** | `NK6I-rollback-pre-investigation` → `45443a8f81c8a28ede0586192dd2965ba3aaf87a` |
| **Rollback stash (full pre-NK6I working tree — still present)** | `git stash@{0}` — "NK6I_ROLLBACK: pre-investigation snapshot 2026-07-07T20:00:54Z" |
| **Current HEAD** | `45443a8f81c8a28ede0586192dd2965ba3aaf87a` (identical to the tag — no commits since NK6I) |
| **Restore committed state** | `git reset --hard NK6I-rollback-pre-investigation` |
| **Restore full working tree** | `git stash apply stash@{0}` (non-destructive) |
| **Database rollback** | **None required — this task performed ZERO DB writes** (read-only validation only). |

**Confirmation:** NK6I's rollback protection **still exists** (tag + stash both verified present). Because HEAD is unchanged since NK6I and this task wrote nothing to disk-tracked state or the database, **no new rollback point was needed**; the existing `NK6I-rollback-pre-investigation` fully covers this work.

---

## 1. Database target confirmation — Replit dev (lower) environment

| Marker | Value | Meaning |
|---|---|---|
| `DATABASE_URL` host / db | `helium` / `heliumdb` (user `pos***`) | app's single configured DB |
| `REPL_ID` | `a6376337-…` (set) | inside a Replit workspace |
| `REPLIT_DEPLOYMENT` | **unset** | **dev workspace, NOT a deployment** |
| `REPLIT_DEV_DOMAIN` | `…spock.replit.dev` (set) | interactive dev domain |
| `NODE_ENV` | unset | not production-flagged |

**Assessment:** This is the **Replit dev workspace (lower environment)** — consistent with NK6I §6. It is not a deployment. As NK6I noted, there is no separate dev/prod DB split visible from here, so `heliumdb` cannot be cryptographically proven throwaway — but the environment markers confirm lower/dev, and **regardless, nothing was written** this task.

---

## 2. Validation method — read-only replay (safest possible "dry-run")

**The importer has no `--dry-run` flag.** `importCanonicalFood()` commits DB writes (`db.insert(knowledgeFoods)`, nutrient/benefit binds) on success — running it *is* an import. The safest validation is therefore a **read-only replay** that reuses the importer's **exact** identity logic without ever calling it:

- Harness: `scripts/nk6j-validate-batches.ts` — faithful copies of the importer's private `extractFoodIdentity` + `reconcileFoodIdentity` (the NK6I fix) and the GOV2 vocabulary resolvers (`resolveNutrientTerm` / `resolveBenefitTerm`).
- **Only DB touch: a single read-only `SELECT slug FROM knowledge_food`** (265 existing identities) to detect exact-slug duplicates — the same check the importer's Step 3b makes. **Zero inserts/updates/deletes.**
- `manifest.yaml`, `README.md`, and `CLAUDE_VALIDATE_*_PROMPT.md` are explicitly filtered out and never processed.

Classification maps 1:1 to importer behaviour:

| Class | Importer behaviour | Action |
|---|---|---|
| 🟢 **safe new import** | no collision, slug absent → would insert cleanly | importable |
| 🔵 **existing exact identity** | slug already in `knowledge_food` → Step 3b blocks (no `--force-upsert`) | already present; enrichment only |
| 🟠 **alias-resolved merge candidate** | NK6I hard block: own identity resolves to a *different* existing food | **merge, human-approved — never import** |
| 🟡 **soft overlap — editorial review** | declared alias resolves to a different existing identity | review scope before any import |
| ⛔ **blocked conflict** | parse error / missing slug / genuine unresolved conflict | blocked |

---

## 3. Batch 001 dry-run result — `batch-001-core-everyday-vegetables`

30 draft YAMLs (3 non-drafts skipped: `manifest.yaml`, `README.md`, `CLAUDE_VALIDATE_BATCH_001_PROMPT.md`).

| Class | Count | Foods |
|---|---|---|
| 🟢 safe new import | **0** | — |
| 🔵 existing exact identity | 25 | asparagus, aubergine, beetroot, butternut-squash, cabbage, cauliflower, celery, courgette, cucumber, garden-peas, garlic, green-beans, kale, leek, lettuce, onion, parsnip, potato, pumpkin, radish, shallot, spring-onion, swede, sweet-potato, turnip |
| 🟠 alias-resolved merge candidate (BLOCK) | 4 | `carrot`→**carrots**, `fennel-bulb`→**fennel**, `sweetcorn`→**corn**, `tomato`→**tomatoes** |
| 🟡 soft overlap — review | 1 | `sweet-pepper` (alias "red pepper" → existing **red-pepper**) |
| ⛔ blocked conflict | 0 | — |

**Verdict:** **No cleanly-new foods.** Entire batch is merge/enrichment of existing identities. Matches NK6I §5 exactly. **Do not import.**

---

## 4. Batch 002 dry-run result — `batch-002-extended-greens-brassicas-salad-pods-shoots`

30 draft YAMLs (3 non-drafts skipped: `manifest.yaml`, `README.md`, `CLAUDE_VALIDATE_BATCH_002_PROMPT.md`).

| Class | Count | Foods |
|---|---|---|
| 🟢 safe new import | **8** | alfalfa-sprouts, chinese-leaf, cress, frisee, lambs-lettuce, mizuna, pea-shoots, samphire |
| 🔵 existing exact identity | 18 | baby-corn, bamboo-shoots, bean-sprouts, broad-beans, brussels-sprouts, celeriac, chicory, kohlrabi, mangetout, okra, pak-choi, radicchio, rocket, runner-beans, spring-greens, sugar-snap-peas, water-chestnuts, watercress |
| 🟠 alias-resolved merge candidate (BLOCK) | 3 | `globe-artichoke`→**artichoke**, `romanesco`→**cauliflower**, `swiss-chard`→**chard** |
| 🟡 soft overlap — review | 1 | `fresh-chilli-pepper` (alias "red chilli" → existing **chilli**) |
| ⛔ blocked conflict | 0 | — |

**Vocabulary note (read-only):** `broad-beans` names nutrient "protein", which the GOV2 vocabulary resolver rejects (not a canonical nutrient slug). Non-blocking for identity, but recorded — it would be dropped/queued at import, not minted.

**Verdict:** Batch 002 **contains identity conflicts** — 3 alias-resolved merge candidates (`globe-artichoke`, `romanesco`, `swiss-chard`) plus 1 soft overlap (`fresh-chilli-pepper`). Per task guardrail **#9 ("If Batch 002 has unresolved identity conflicts, STOP and report")**, this triggers a **STOP**. Batch 002 is also **not "safe new foods only"** (8 new vs 22 existing/merge/overlap) — so the "import safe-new-only" branch does **not** apply.

---

## 5. Decision — no import performed this round

Two independent task rules force **import nothing**:

1. **Guardrail #9 (Batch 002 STOP):** Batch 002 has unresolved identity conflicts (3 merge candidates + 1 soft overlap) → STOP and report.
2. **"Import only if safe new foods *only*":** Neither batch is safe-new-only. Batch 001 = 0 new. Batch 002 = mixed. → falls to **"most foods are merge/enrichment → do not import; produce a merge/enrichment plan instead."**

The 8 Batch-002 foods that classify 🟢 *are* genuinely new (no slug collision, no foreign-identity resolution) and would import cleanly **in isolation** — but importing them while Batch 002 as a whole is under a STOP condition would violate guardrail #9. They are therefore held as **"ready to import on explicit go-ahead"**, not auto-imported.

### Foods safe to import
- **Batch 001:** none.
- **Batch 002 (held, pending go-ahead — NOT imported):** `alfalfa-sprouts`, `chinese-leaf`, `cress`, `frisee`, `lambs-lettuce`, `mizuna`, `pea-shoots`, `samphire` (8).
  Pre-import editorial check before any go-ahead: confirm none of the 8 duplicate an existing food under a name the editorial seed doesn't yet know, and that their declared aliases don't overlap each other.

### Foods needing merge/enrichment approval (governed, human-approved — never a silent import)
| Draft | Merge into existing | Batch |
|---|---|---|
| `carrot` | **carrots** | 001 |
| `fennel-bulb` | **fennel** | 001 |
| `sweetcorn` | **corn** | 001 |
| `tomato` | **tomatoes** | 001 |
| `globe-artichoke` | **artichoke** | 002 |
| `romanesco` | **cauliflower** | 002 |
| `swiss-chard` | **chard** | 002 |

Plus **43 existing-exact-identity** drafts (25 in B001, 18 in B002) that are pure enrichment of an already-present identity — fold richer draft metadata (nutrients/benefits/aliases) into the existing food via a governed merge; **do not** insert a second row.

### Foods needing editorial (soft-overlap) review
| Draft | Overlapping alias → existing | Batch | Ruling needed |
|---|---|---|---|
| `sweet-pepper` | "red pepper" → **red-pepper** | 001 | Is `sweet-pepper` a distinct identity, or does its alias set overlap `red-pepper`? |
| `fresh-chilli-pepper` | "red chilli" → **chilli** | 002 | Is `fresh-chilli-pepper` distinct from existing `chilli`, or a merge? |

### Foods blocked (hard conflict / parse)
- **None** (⛔ = 0 in both batches). The 🟠 merge candidates are blocked *from import as-new* by the NK6I guard, but resolve cleanly to a known target — they are merge decisions, not unresolved conflicts.

---

## 6. Merge / enrichment plan (next actions, all human-approved)

1. **Reconcile the 7 merge candidates** — for each, either (a) realign the draft's `canonical_slug` to the existing identity (`carrot`→`carrots`, `swiss-chard`→`chard`, …) then re-run enrichment, or (b) fold the draft's nutrients/benefits/aliases into the existing food. Never mint a second identity. `--force-upsert` must **not** be used to bypass the NK6I block.
2. **Rule on the 2 soft overlaps** (`sweet-pepper`, `fresh-chilli-pepper`) — editorial decision: distinct identity vs merge. Record the ruling before any import.
3. **Enrichment pass for the 43 existing-exact drafts** — bind only genuinely-new nutrient/benefit/alias rows (importer already uses `onConflictDoNothing`, so no duplicate nutrients/benefits/aliases are created); confirm the dev DB target first.
4. **(On go-ahead only) import the 8 Batch-002 new foods** into the lower environment only, one batch invocation, after the editorial pre-check in §5.
5. Fix `broad-beans` nutrient "protein" (map to a canonical nutrient slug or queue for vocabulary review) before its enrichment.

---

## 7. Guardrail compliance

- ✅ Used the **NK6I-fixed** alias-aware identity resolver (`resolveCanonicalFood`) — no second resolver.
- ✅ **No import performed** (read-only replay; single `SELECT` only).
- ✅ `--force-upsert` **not** used.
- ✅ No blocked/merge-candidate foods imported; no duplicate canonical foods/nutrients/benefits/aliases created.
- ✅ `manifest.yaml` / `README` / prompt files excluded from processing.
- ✅ Batch 002 identity conflicts → **STOPPED and reported** (guardrail #9).
- ✅ Rollback protection confirmed present (NK6I tag + stash); DB rollback N/A (zero writes).

---

## 8. Exact commands run

```bash
# Pre-action
cat docs/architecture/README.md
git status
git tag | grep -iE 'NK6I|rollback'          # confirmed NK6I-rollback-pre-investigation
git show -s NK6I-rollback-pre-investigation  # → 45443a8 (== HEAD)
git stash list                               # confirmed stash@{0} NK6I_ROLLBACK snapshot

# DB target confirmation (env only — no query)
node -e 'const u=new URL(process.env.DATABASE_URL); ...'   # host=helium db=heliumdb, REPLIT_DEPLOYMENT unset

# Read-only validation (ZERO writes; single SELECT of existing slugs)
npx tsx scripts/nk6j-validate-batches.ts \
  docs/knowledge/canonical-foods/drafts/batch-001-core-everyday-vegetables \
  docs/knowledge/canonical-foods/drafts/batch-002-extended-greens-brassicas-salad-pods-shoots
```

No `npm run import:canonical-foods` was executed. No mutating command was run.

---

## 9. Report location

`docs/investigations/NK6J_CANONICAL_FOOD_BATCH_001_002_IMPORT_PLAN.md` (this file).
Validation harness: `scripts/nk6j-validate-batches.ts` (read-only).
**Related:** `NK6I_CANONICAL_FOOD_IDENTITY_RESOLUTION_AUDIT.md`, `BATCH_001_CANONICAL_FOOD_IMPORT_VALIDATION.md`, `docs/architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md`.
