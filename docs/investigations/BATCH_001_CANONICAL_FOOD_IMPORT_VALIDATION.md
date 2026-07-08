# Batch 001 — Canonical Food Import Validation

**Date:** 2026-07-07
**Author:** Claude Code (validation run, read-only)
**Batch:** `batch-001-core-everyday-vegetables` (30 foods, core everyday vegetables)
**Scope:** Validate + stage only. **No production import. No dev import performed.**
**Verdict:** ⛔ **NOT SAFE for import as-is** (dev or production) — 5 canonical-identity duplicate/conflict findings that the current importer cannot catch. Vocabulary is 100% clean. See §Recommendation.

---

## 0. Governing architecture followed

Read `docs/architecture/README.md` (Architecture Bootstrap, mandatory entry point). Governing documents applied here:

- **GOV2 — Canonical Alias Principle** (`docs/architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md`): one identity, one display name, unlimited aliases; every ingest path resolves through the single resolver; unknown terms are rejected, never minted.
- **NK1 — Canonical Nutrition Knowledge Platform**: one canonical identity per food; no duplicate entities; honest gaps over fabrication.
- Each draft's own `nk_controls`: *"Unresolved nutrients, benefits, aliases or identity conflicts must be rejected for review, not silently minted"* and `duplicate_policy: stop_on_slug_conflict_or_merge_only_with_explicit_approval`.

Per the Bootstrap rule, where the batch conflicts with governing architecture I **STOPPED and reported** rather than importing.

---

## 1. Rollback identifier

| Item | Value |
|---|---|
| **Rollback git tag** | `rollback/batch-001-canonical-validation` |
| **Points at commit** | `45443a8f81c8a28ede0586192dd2965ba3aaf87a` |
| **Branch** | `int1-intelligence-platform` |
| **Working tree at anchor** | pre-existing unstaged/untracked changes only (unchanged by this task) |

**Rollback command:** `git reset --hard rollback/batch-001-canonical-validation` (working-tree state). No database rollback is required **because no database write was performed** (see §3).

---

## 2. Files extracted

The named archive `canonical-foods-batch-001-core-everyday-vegetables.zip` was **not present** in the workspace. The batch was **already extracted** into the target path (untracked in git), matching the manifest exactly — so no unzip was needed; extraction was **confirmed**, not re-performed.

- **Target path:** `docs/knowledge/canonical-foods/drafts/batch-001-core-everyday-vegetables/`
- **Structure confirmed:** ✅ **individual YAML files, one food per file** — NOT one combined multi-food YAML.
- **Count:** 30 food YAMLs + `manifest.yaml` + `README.md` + `CLAUDE_VALIDATE_BATCH_001_PROMPT.md` (matches manifest `food_count: 30`).

Food files: asparagus, aubergine, beetroot, butternut-squash, cabbage, carrot, cauliflower, celery, courgette, cucumber, fennel-bulb, garden-peas, garlic, green-beans, kale, leek, lettuce, onion, parsnip, potato, pumpkin, radish, shallot, spring-onion, swede, sweetcorn, sweet-pepper, sweet-potato, tomato, turnip.

---

## 3. Validation commands run — and why NOT the write-mode importer

### Importer compatibility gap (STOP condition triggered)

The NK6D importer (`server/lib/canonical-foods-importer.ts`, CLI `server/cli/import-canonical-foods.ts`) **has no dry-run / validation-only mode**. Its only flag is `--force-upsert`. Every invocation performs **real writes** — `db.insert(knowledgeFoods)`, `db.insert(knowledgeFoodNutrients)`, `db.insert(knowledgeFoodBenefits)` — against `process.env.DATABASE_URL`.

`DATABASE_URL` **is set** and points to `helium/heliumdb` — the app's single configured live database. I **cannot confirm it is non-production**. Given the explicit "do not import to production" and "run the safest available dry-run/validation mode first" constraints, running `npm run import:canonical-foods` was **not safe** and was **not run**.

**The manifest's suggested commands would have written to the DB:**
```
npm run import:canonical-foods .../carrot.yaml            # ← REAL insert, not a dry run
npm run import:canonical-foods .../{carrot,onion,tomato}.yaml
npm run import:canonical-foods .../*.yaml
```

### Safest available validation mode (what was actually run)

A **read-only harness** that reuses the importer's **exact** parse + extract logic and the **single GOV2 resolver** (`resolveNutrientTerm` / `resolveBenefitTerm` — pure, DB-free), performing **zero DB writes**. It additionally checks canonical-identity duplicates against the `FOOD_SEED` source of truth (slug **and** alias collisions) — a check the real importer does **not** perform. Escalation order per the task:

```
# 1 file
npx tsx <harness> .../carrot.yaml
# 3 files
npx tsx <harness> .../carrot.yaml .../onion.yaml .../tomato.yaml
# full batch
npx tsx <harness> .../*.yaml
```
The harness was a throwaway (scratchpad), deleted after the run; nothing was committed and no tracked file was modified by validation.

---

## 4. Smoke results

### 4a. One-file (`carrot.yaml`)
- Parse ✅ · vocabulary **100% resolved** (fibre, vitamin-c, polyphenols → all *exact*; gut-health, heart-health → *exact*). 0 rejected.
- ⛔ **Canonical-identity conflict:** slug `carrot` is an **alias of the existing canonical food `carrots`**; batch alias `carrots` collides with existing slug `carrots`. The importer checks slug-in-DB only (`carrot` ≠ `carrots`) → it would **silently insert a duplicate identity**.

### 4b. Three-file (`carrot`, `onion`, `tomato`)
| File | Vocabulary | Identity outcome |
|---|---|---|
| carrot | ✅ all exact, 0 rejected | ⛔ duplicate identity — alias of `carrots` |
| onion | ✅ all exact, 0 rejected | ⚠ slug `onion` already exists → importer would **reject** (no dup created) |
| tomato | ✅ all exact, 0 rejected | ⛔ duplicate identity — alias of `tomatoes` |

### 4c. Full batch (31 `*.yaml`, incl. `manifest.yaml`)
- Parse: 30/30 food files parse ✅. `manifest.yaml` is matched by the `*.yaml` glob and has no `record.canonical_slug` → the real importer would emit a **per-file error** for it (operational note: the glob should target food files, not the manifest).
- **Vocabulary: 0 rejected nutrients, 0 rejected benefits across all 30 files.** Every term resolved **exact** (no alias even required, no new vocabulary minted):
  - Nutrients (7 distinct): `fibre, vitamin-c, polyphenols, folate, vitamin-k, plant-protein, anthocyanins`
  - Benefits (3 distinct): `gut-health, heart-health, bone-health`
- **Canonical identity (the blocker):**

| Outcome | Count | Foods |
|---|---|---|
| Slug already canonical (importer would **reject** w/o `--force-upsert`) | 25 | onion, garlic, shallot, spring-onion, leek, celery, cucumber, aubergine, courgette, cauliflower, cabbage, kale, lettuce, beetroot, parsnip, swede, turnip, radish, potato, sweet-potato, butternut-squash, pumpkin, asparagus, green-beans, garden-peas |
| **Slug is an alias of an existing food** (importer would **silently duplicate**) | 3 | `carrot`→`carrots`, `tomato`→`tomatoes`, `sweetcorn`→`corn` |
| **New slug whose alias is an existing food** (importer would **silently duplicate**) | 1 | `fennel-bulb` (alias `fennel` = existing `fennel`) |
| Genuinely new, no collision | 1 | `sweet-pepper` (⚠ soft: editorial overlap with existing `red-pepper` — review before insert) |

---

## 5. Unresolved terms

**None.** Zero unresolved/rejected nutrient or benefit terms across the whole batch. No term was routed to Knowledge Review because none needed to be, and — critically — **no new vocabulary would be minted** by this batch (GOV2 Rule 4/7 satisfied on the vocabulary axis). The drafts were authored conservatively against the existing canonical vocabulary.

---

## 6. Duplicate risks

The vocabulary axis is clean; the **identity axis is not**. The importer's duplicate guard is **slug-equality against the DB only** — it does **not** consult aliases. Therefore:

1. **3 alias-of-existing collisions** — `carrot` (existing `carrots`), `tomato` (existing `tomatoes`), `sweetcorn` (existing `corn`). Slug differs from the existing canonical slug, so the guard passes and a **second canonical identity for the same food is inserted**. Direct violation of "one canonical identity per food" / "no duplicate foods".
2. **1 new-slug/alias-collision** — `fennel-bulb` carries alias `fennel`, which is already a canonical food. Same duplicate-identity outcome.
3. **25 exact slug duplicates** — safe *only because* the importer rejects them; but a run with `--force-upsert` would **overwrite** 25 existing canonical foods (destructive). Do not use `--force-upsert` on this batch.
4. **1 soft overlap** — `sweet-pepper` vs existing `red-pepper`: not a slug/alias collision in seed data, but likely the same editorial identity; confirm before insert.

Duplicate nutrients / benefits / aliases created: **none** (importer dedupes bindings and uses `onConflictDoNothing`; and no new vocabulary is introduced).

---

## 7. Is Batch 001 safe for dev import?

**No — not as-is.** Two independent reasons:

1. **Importer safety gap:** no dry-run mode; the only configured DB (`heliumdb`) cannot be confirmed non-production. A safe *dev* import first needs a confirmed dev/throwaway `DATABASE_URL` (or a real `--dry-run` flag added to the importer).
2. **Canonical-identity conflicts the importer can't catch:** `carrot`, `tomato`, `sweetcorn`, `fennel-bulb` would create duplicate identities of `carrots`/`tomatoes`/`corn`/`fennel`. Per each draft's own `duplicate_policy: stop_on_slug_conflict_or_merge_only_with_explicit_approval`, these must be reconciled (align the draft slug to the existing canonical slug, or route the alias to the existing identity) **before** any import.

Once (a) a dev `DATABASE_URL` is confirmed and (b) the 4 identity conflicts + `sweet-pepper`/`red-pepper` overlap are reconciled, the remaining foods either import cleanly or are safely rejected as existing — and the vocabulary axis is already green.

**Recommendation: BLOCK import; REVISE batch identities + confirm dev DB target.** The batch is *editorially* strong and vocabulary-clean; the blockers are identity reconciliation and importer/DB-target safety, not content.

### Suggested next steps (not performed — require approval)
- Reconcile the 4 identity conflicts (rename draft slugs to existing canonical slugs, or fold the batch's richer metadata into the existing foods via a governed merge).
- Confirm/point `DATABASE_URL` at a dev database, or add a genuine `--dry-run` flag to `canonical-foods-importer.ts` (writes nothing; reports resolved/rejected/duplicate) so the manifest's smoke commands become safe.
- Exclude `manifest.yaml` from the import glob (target explicit food files, not `*.yaml`).

---

## 8. Report location

`docs/investigations/BATCH_001_CANONICAL_FOOD_IMPORT_VALIDATION.md` (this file).
