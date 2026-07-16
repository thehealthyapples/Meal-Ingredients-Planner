# SEC4 — Uplift Rule Provenance

**Stage:** Complete
**Date:** 2026-07-16
**Rollback ID:** `rollback/SEC4-uplift-rule-provenance-20260716` → `7d1dd2ce`
**Authority:** CONV1 § 3 (`SEC-4`), § 5 rank 2, § 7 (P0). Source finding: CPI1 S1-3.
**Scope:** CONV1 item `SEC-4` only. **No schema, no migration, no architecture modified.**

---

## Rollback protection

- Annotated tag created **before any file was touched**; resolved with `^{commit}`.
- **⚠️ `server/routes.ts` and `package.json` were ALREADY DIRTY** (LIFE2 + concurrent sessions).
  A tag covers **committed state only**. Their work was preserved and re-verified after each edit.
- **No stash** — it would have destroyed ~20 concurrent sessions' trees.
- All four target files snapshotted **outside the repo** before editing — necessary, because this
  change deletes a file and the tag does not cover the dirty ones.

## What changed

1. **`server/lib/uplift-persistence.ts`** — new pure `resolveAcceptedSuggestions(claimed, rules)`:
   the rule must **exist**, be **reviewed** (`reviewedAt` — the same gate `uplift-engine.ts` applies
   on every match, which had **no counterpart on the write path**), and actually **author** that
   ingredient + action. Returns the **owner's** copy; the caller's is discarded.
2. **`server/routes.ts`** — resolve **before** the system-meal fork, so a rejected request mutates
   nothing. Merge + provenance rows take the owner's `rule.id` / `rule.name` / `suggestion.why`.
   `added_by: 'tha_uplift'` unchanged — and now **true**.
3. **`client/src/pages/weekly-planner-page.tsx`** — `buildFallbackUpliftMatch` + `buildMergedMatches`
   **deleted** (the minted `fallback-deterministic-boosts` identity), 3 call sites simplified,
   5 now-unused imports removed.
4. **`client/src/lib/nutrition-boosts.ts`** — **DELETED** (193 lines, 0 importers after #3).
   **Deleted rather than registered as a known orphan**: the adoption register's own note says its
   entries are *"defects, not exemptions… The gate fails on a **new** one"* — registering an orphan
   I had just created would use the escape hatch to defeat the gate.

## Verification

- **New suite `test:sec4-uplift-rule-provenance` — 24/0**, pure. **No aggregate test drives HTTP**,
  so putting the rule in `uplift-persistence.ts` is what makes it guardable (CONV1 **CP10**).
- **E2E on port 5097** (concurrent 5000 untouched): phantom **400** · invented id **400** ·
  real-but-unreviewed `draft-omelette-rule` **400** · real rule + unauthored `double cream` **400** ·
  **legitimate accept 201 with the caller's "Doctor-approved miracle cure / 700 kg / clinically
  proven" all replaced by the owner's "½ tsp" and reviewer's sentence** · 4 rejections mutated
  nothing · a phantom against a system meal did **not** fork (889 → 889).
- **Gate movement:** `verify:publication` **24 pass/12 fail → 26 pass/11 fail**.
  `up-client-publisher` FAIL→**PASS**; `up-rival-display` WARN→**PASS**. Two green, none red.
- **Regressions:** 311 passed, 0 failed (incl. uplift-engine 45/0, uplift-persistence 39/0).
- **Typecheck 304 → 304** (identical, zero in touched files). **`adoption:check` back to baseline
  64/2** — same 2 pre-existing failures.
- **DB restored to exactly its pre-SEC4 state.** Found and removed **2 `test_rule_boundary` rows**
  left by the unregistered diagnostic script I ran, plus my own E2E row/user/meals.

## Reported, not absorbed

- **The 8 historical phantom rows are NOT cleaned** → `up-phantom-rules` stays red, domain stays 🔴.
  **Deleting them would strand 8 real ingredients in real households' meals**: the row *is* the undo
  path (`DELETE /api/uplift/applications/:id` reads `application.ingredient`). A product/retention
  decision. **No new such row can ever be created** — the red is archaeology, not a live leak.
- **Register D18 / `ARCHITECTURE_PRINCIPLES.md:135` not amended** — it contests "Nutrition Boost
  Display" against `nutrition-benefit-library.ts`, **a file deleted long ago**, and is silent on the
  vocabulary actually retired here. That is CONV1 `DOC-1`/`DOC-4`'s work; an implementation must not
  amend governing architecture as a side effect. **DOC-1's scope is bigger than the diet columns.**
- Households will see **fewer boost suggestions**. Those suggestions were never reviewed and were
  shown as though they were (Principle 6). LIFE2's trade, in another domain.

## Files changed

1. `server/lib/uplift-persistence.ts` (+~60, pure)
2. `server/routes.ts` (~+12/−8, one endpoint)
3. `client/src/pages/weekly-planner-page.tsx` (−~65)
4. `client/src/lib/nutrition-boosts.ts` (**deleted**, recoverable at `7d1dd2ce`)
5. `server/tests/test-sec4-uplift-rule-provenance.ts` (new)
6. `package.json` (+2 lines; LIFE2/HOME3/SEC1 lines preserved, JSON re-validated)
7. `docs/implementation/platform/SEC4_UPLIFT_RULE_PROVENANCE.md` (report)

## Next action

None — complete. **Next CONV1 item: `SEC-2` + `SEC-3`** (auth token timestamps — one change; graded
**latent**, masked by UTC containers). **That closes Tier 0.** Then **Tier 1 `DOC-1`** — and
**`OWN-1` must not start until it lands.**
