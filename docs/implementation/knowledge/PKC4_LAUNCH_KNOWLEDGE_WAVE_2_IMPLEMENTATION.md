# PKC4 — Launch Knowledge Wave 2 — Implementation

**Date:** 2026-07-04
**Branch:** `int1-intelligence-platform`
**Risk:** 🟡 AMBER
**Reason:** No schema change and no change to any route's URL/method contract, but this phase both narrows a client-writable API input schema (`POST /api/meals`) and changes what several live UI surfaces render (admin recipe-sources page, meal detail page, meal search results). Narrowing a write contract can only ever reject previously-accepted fields (no legitimate caller loses functionality — verified below), and the render changes are additive/corrective, but both classes of change touch live, reachable surfaces, so this is held to the same verify-before-trust bar as PKC1–3 rather than treated as routine.

---

## GOVERNING ARCHITECTURE

**`docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`** (PKCA1), specifically:

- **Rule KC4 ("one owner, one mouth")** — every knowledge entity type has exactly one owning store and exactly one adapter permitted to render facts about it; no surface re-derives, re-phrases, or independently writes the same fact.
- **§7 Phase 2** — *"Name the 'one mouth' adapter for every Cluster A/B/C entity type still missing one … Food Relationships, Preparation Knowledge (once built), recipe licence/attribution detail."*
- **§2.1's "one mouth" register** — names an owning adapter for Food, Meal, Product, and Household evidence, but explicitly leaves Recipe licence/attribution unfilled, naming it an open item for the roadmap, not yet a violation, "because none of those surfaces currently has *more than one* narrator" — this phase is the first to check whether that is still true.
- **Rule KC9 ("automation authors candidates, never publishes")** and the platform's evidence-first/anti-fabrication principle (`ARCHITECTURE_PRINCIPLES.md` Principle 6) — a claim of provenance ("this recipe comes from a licensed source") must never be something a user request can author.

Also read as background/precedent: `docs/implementation/knowledge/PKC0_CLAIM_TRUST_ENFORCEMENT_IMPLEMENTATION.md`, `docs/implementation/knowledge/PKC1_CANONICAL_KNOWLEDGE_CONVERGENCE_IMPLEMENTATION.md`, `docs/implementation/knowledge/PKC2_ONE_MOUTH_CONVERGENCE_IMPLEMENTATION.md`, `docs/implementation/knowledge/PKC3_LAUNCH_KNOWLEDGE_WAVE_1_IMPLEMENTATION.md` (the three prior phases of this roadmap — PKC3 in particular named this phase's exact scope as its own "Next Planned Milestone"), `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (Rules 3/4/6 — no parallel stores, no identical copies, static client files are not knowledge stores), `docs/architecture/THA_RECIPE_ACQUISITION_ARCHITECTURE.md` (FS3 — the acquisition policy this phase's adapter reads from).

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-pkc4-launch-knowledge-wave2-20260704` → `ff3b2cf` |
| Working tree | Intentionally dirty — carries prior uncommitted, unrelated workstreams (EWO2 Companion Personality, EWX1 Living Companion Experience, FI5 Food Intelligence UI Activation, Platform Resilience & Operations, Companion Platform Architecture, Platform Quality Architecture, EWO MealDB API Activation, PKC0–3) untouched by this work |
| This task's writes | See "Rollback Plan" below |
| Rollback command | `git checkout rollback/before-pkc4-launch-knowledge-wave2-20260704 -- <file>` per file |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md`
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md`
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md`
- [x] `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` (the governing architecture for this workstream)
- [x] `docs/implementation/knowledge/PKC0_CLAIM_TRUST_ENFORCEMENT_IMPLEMENTATION.md`
- [x] `docs/implementation/knowledge/PKC1_CANONICAL_KNOWLEDGE_CONVERGENCE_IMPLEMENTATION.md`
- [x] `docs/implementation/knowledge/PKC2_ONE_MOUTH_CONVERGENCE_IMPLEMENTATION.md`
- [x] `docs/implementation/knowledge/PKC3_LAUNCH_KNOWLEDGE_WAVE_1_IMPLEMENTATION.md`
- [x] `docs/implementation/planner/EWO_MEALDB_API_ACTIVATION.md` (the concurrent workstream PKC3 said would need to land before this phase could safely proceed)
- [x] `shared/recipe-acquisition.ts`, `server/lib/recipe-source-gate.ts`, `server/lib/auto-import-service.ts`, `server/storage.ts`, `shared/schema.ts`, `shared/routes.ts` (read in full before editing any of them)

---

## HOW THE WAVE 2 SCOPE WAS CHOSEN

PKC3 (Wave 1) closed the one live row-level identity defect in WS0/WS2A and named its own explicit next milestone: *"A future phase that verifies (not assumes) recipe licence/attribution's 'one mouth' status once the concurrent MealDB-activation workstream in this working tree lands, per PKCA1 §7 Phase 2."* That workstream (`docs/implementation/planner/EWO_MEALDB_API_ACTIVATION.md`) is now present in the working tree (config-only credential activation, does not touch the licence/attribution policy shape) — clearing the blocker PKC3 named.

Before writing any code, an Explore agent was tasked with verifying — against current HEAD, not against any document's claim — whether Recipe licence/attribution actually has a single "one mouth" adapter today. It does not. The investigation found a concrete, three-part Rule KC4 gap:

1. **A latent, ungated write path.** `POST /api/meals` (`api.meals.create`) parses its body with `insertMealSchema.extend(...)`, which — via `.pick()` in `shared/schema.ts` — includes `licenceRef` and `attributionText` as client-settable fields. Every legitimate write path (`auto-import-service.ts`, the only true owner of these two fields) constructs its insert object as a plain server-side literal and never goes through this Zod schema; no client UI today happens to send these two fields. But the wire contract itself permits any authenticated user to set them on their own request — a user could, today, POST a hand-typed "scratch" meal with `attributionText: "Recipe from TheMealDB (themealdb.com)"` and have it stored and (per finding 2, once fixed) rendered as if it were genuinely licensed content. This is a fabrication risk at the write layer, not merely a rendering inconsistency — a direct violation of "one owner" (Rule KC4) for this specific fact.
2. **Zero mouths ever render the actual mandated fact.** `ACQUISITION_SOURCE_REGISTER[...].attributionText` — the string a licence (TheMealDB's, specifically) requires THA to display — was, before this phase, never read by any client component. A recipe imported via TheMealDB had its attribution snapshotted onto the `meals` row at import time (`auto-import-service.ts`) and then never shown to a user anywhere.
3. **Three-to-four uncoordinated narrators for the weaker "which source" fact**, none derived from the canonical register:
   - `client/src/pages/meals-page.tsx`'s `SOURCE_STYLES` map hardcoded `label` values identical to (but independent of) `ACQUISITION_SOURCE_REGISTER[...].label`.
   - `client/src/pages/admin-recipe-sources-page.tsx`'s `SOURCE_LABELS` map, a second independent hardcoded copy of the same vocabulary.
   - `server/lib/recipe-source-gate.ts`'s own `ALL_SOURCES`/`SourceMeta.label` field — a **third**, server-side copy, found while tracing consumers — which had **already drifted** from the register (`"API-Ninjas Recipes"` vs the register's `"API-Ninjas"`) despite being read by zero consumers anywhere in the codebase. This is the exact "identical copy left to rot" failure the SoT Register's Rule 4 exists to prevent, caught here for the first time because nothing had ever needed to reconcile it.
   - The admin API (`getAllSourceSettings()`) already computed `licenceState`/`licenceNote`/`acquirable` correctly server-side, but the admin page's TypeScript interface omitted those fields entirely — the one real compliance disclosure in the system (TheMealDB's `conditional` state: *"production use requires the supporter key, not the shared test key"*) was computed correctly and then silently discarded before reaching any screen, admin or user.

This is exactly the shape PKCA1 §7 Phase 2 describes ("name the one-mouth adapter... before the second narrator is [built], not after") — except the second, third, and fourth narrators already exist. Two other candidates were considered and set aside in favour of this one:

- **Evidence & Learning's first real reporter/consumer (§7 Phase 3)** — requires product decisions and real household data flow, not a same-session engineering fix; explicitly named in PKCA1 as still-zero-built on both sides.
- **Preparation Knowledge (§7 Phase 4)** — explicitly gated to come *after* Phase 2 per Rule KC1/LT1 phase-gating; starting it early would itself violate the roadmap's own sequencing.

Recipe licence/attribution was the one candidate with a live, verifiable, safely-fixable defect spanning both the write layer and the render layer — the same "found by running a check against HEAD, not by trusting a document" discipline PKC3 used for the WS0/WS2A identity audit.

---

## WHAT THIS PHASE DID

No schema change, no new table, no new adapter file. The fix converges every writer and every reader of this fact onto the one policy module that already existed for this purpose (`shared/recipe-acquisition.ts`) and the one persisted snapshot column pair (`meals.licence_ref` / `meals.attribution_text`) that already existed to carry it — this phase retires duplicate/dead copies and wires the existing register to its consumers, rather than inventing anything new.

### 1. Closed the ungated write path (`shared/routes.ts`)

`api.meals.create.input` now omits `licenceRef`/`attributionText` from the client-parseable contract:

```ts
input: insertMealSchema.omit({ licenceRef: true, attributionText: true }).extend({
  nutrition: nutritionSchema.optional(),
}),
```

`insertMealSchema`/`InsertMeal` (the internal type `auto-import-service.ts` and `storage.ts` still use) are untouched — this only narrows the one Zod schema that parses a request body coming over the wire. Verified: a crafted `POST /api/meals` payload carrying both fields now has them silently stripped by Zod before `storage.createMeal` ever sees them (script output below). No other `createMeal` call site (`saveProduct`, `copy`, `smart-create`, variant/fork creation — traced at `server/routes.ts:1270,1342,9686,10653`) ever sent these fields in the first place; only `auto-import-service.ts:89-101` legitimately sets them, and it does so via a plain object literal, never through this Zod schema — so this change has zero effect on any legitimate write path.

### 2. Rendered the actual mandated fact for the first time (`client/src/components/meal-detail/MealTrustSummary.tsx`)

The meal detail page's trust-summary card now shows `meal.attributionText` (linked to `meal.sourceUrl` when present) when the persisted field is non-null:

```tsx
{meal.attributionText && (
  <p className="text-xs text-muted-foreground pt-1 border-t border-border/40 mt-1">
    {meal.sourceUrl ? (
      <a href={meal.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" ...>{meal.attributionText}</a>
    ) : meal.attributionText}
  </p>
)}
```

This reads the **persisted snapshot** taken at import time, not a live re-lookup of the policy register — the correct choice per Rule KC7-style reasoning: what attribution was true when THA imported the recipe is what must be shown, even if the register's policy for that source changes later. Rows with no `attributionText` (every row that predates this snapshot column, or that was never externally sourced) render nothing here — an honest gap, not a fabricated attribution, per Principle 6.

The card's own early-return (`if (displayedReasons.length === 0) return null`) was widened to `if (displayedReasons.length === 0 && !meal.attributionText) return null`, so a recipe with attribution but no other "reasons" (category/diet/allergen-free) still surfaces its attribution rather than being silently dropped by an unrelated guard clause.

### 3. Retired three duplicate/drifted label vocabularies, converged on the one register

- **`client/src/pages/meals-page.tsx`** — `SOURCE_STYLES` no longer carries a `label` field; `WebSourceBadge` now resolves the label via `getPolicyForSourceLabel(recipe.source)?.label` from `@shared/recipe-acquisition`. `className`/`logo` (genuinely presentation-only, not a platform fact) remain local.
- **`client/src/pages/admin-recipe-sources-page.tsx`** — the `SOURCE_LABELS` map is deleted; a `sourceLabel(sourceKey)` helper reads `getAcquisitionSourcePolicy(sourceKey)?.label` from the same shared module (importable directly by the client — the module has zero server dependencies, the same pattern `shared/dietRules.ts` already established for shared logic). Used for both the source-row label and the audit-log source-name column (the latter is keyed by `sourceKey`, confirmed by tracing `logAuditEvent({ sourceName: importSourceKey, ... })` at `server/routes.ts:2660` — not a label, so the same resolver applies correctly).
- **`server/lib/recipe-source-gate.ts`** — the dead, drifted `label` field is deleted from `SourceMeta`/`ALL_SOURCES` outright (not reconciled to match the register) since it was confirmed, by tracing every read of `ALL_SOURCES`, to have zero consumers anywhere in the codebase. Removing a duplicate that nothing reads is strictly safer than updating it to stay in sync with a register it should never have copied from.

### 4. Surfaced the previously-dropped compliance disclosure (`client/src/pages/admin-recipe-sources-page.tsx`)

`RecipeSource`'s client-side interface now includes `licenceState`/`licenceNote` (both already sent by the existing `/api/admin/recipe-sources` response — no server change needed here). `SourceRow` renders an amber note under any source whose `licenceState === "conditional"` — today, only TheMealDB — showing the outstanding compliance action:

> *Licence action outstanding: Open recipe API. Compliance action outstanding: production use requires the supporter key, not the shared test key...*

This is the exact disclosure the investigation found "computed correctly server-side, discarded client-side."

### 5. Verification performed this session

- Adversarial parse test: constructed a `POST /api/meals`-shaped payload carrying `licenceRef: "themealdb-api"` and `attributionText: "Recipe from TheMealDB (themealdb.com)"` on an otherwise-ordinary scratch meal, parsed it through the (now-modified) `api.meals.create.input` schema directly. **Result: both fields absent from the parsed output** — confirmed the fix, not merely inspected the diff.
- Resolved every label through the register both ways: all 5 client-search-result labels (TheMealDB/BBC Good Food/AllRecipes/Jamie Oliver/Serious Eats) round-trip correctly through `getPolicyForSourceLabel`; all 9 `ACQUISITION_SOURCE_REGISTER` keys resolve a label through `getAcquisitionSourcePolicy` — including confirming `apininjas` now canonically resolves to `"API-Ninjas"` (the register's value), where the admin page previously showed the drifted `"API-Ninjas Recipes"`.
- Confirmed `themealdb`'s `licenceState`/`licenceNote` resolve exactly as the admin UI now displays them.
- Traced every other `storage.createMeal` call site (`server/routes.ts:1270` saveProduct, `:1342` copy, `:9686` variant creation, `:10653` fork) to confirm none constructs its insert object with `licenceRef`/`attributionText` — the schema narrowing changes nothing for any of them.
- `npx tsc --noEmit`: zero new errors in any file this phase touched (`shared/routes.ts`, `server/lib/recipe-source-gate.ts`, `client/src/pages/admin-recipe-sources-page.tsx`, `client/src/pages/meals-page.tsx`, `client/src/components/meal-detail/MealTrustSummary.tsx`, `client/src/pages/meal-detail-page.tsx`) — checked by grepping the full `tsc` output for each file individually, since the baseline (178 pre-existing error lines, confirmed via `git stash`) is large and unrelated to this domain.
- `npx tsx server/tests/test-food-report-adapter.ts` — 102 passed, 1 pre-existing failure (the same "lentils" WS0.8 test-data staleness PKC2/PKC3 already named as unrelated) — re-confirmed unrelated, since this phase touches no food/knowledge files.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No new key space. Recipe source identity remains keyed by the existing
  SourceKey vocabulary (shared/recipe-acquisition.ts / recipe-source-gate.ts).

☑ One owner per fact
  licenceRef/attributionText: sole legitimate writer remains
  auto-import-service.ts (unchanged); the one latent second writer (the
  public POST /api/meals contract) is closed. Source display label: sole
  owner is now ACQUISITION_SOURCE_REGISTER[...].label — the two client
  duplicates and one dead server-side duplicate are retired, not reconciled.

☑ No duplicate source of truth
  Three independent label vocabularies converged to one (meals-page.tsx,
  admin-recipe-sources-page.tsx, recipe-source-gate.ts's dead SourceMeta.label)
  — 0 remaining, verified by removing each and re-typechecking, not sampled.

☑ Honest gaps, never fabrication
  Attribution renders only when a real, persisted attributionText exists
  (import-time snapshot). No row is backfilled or guessed. A user can no
  longer inject a false attribution/licence claim via the create-meal API.

☑ Extends existing architecture, does not invent new architecture
  Uses the existing shared/recipe-acquisition.ts register, the existing
  meals.licence_ref/attribution_text columns, and the existing
  /api/admin/recipe-sources response shape — no new table, adapter,
  endpoint, or lifecycle stage.
```

---

## PLATFORM QUALITY COMPLIANCE

```
PLATFORM QUALITY COMPLIANCE CHECKLIST
======================================

☑ Security — closes a real write-layer gap: an authenticated user could
  previously set arbitrary licenceRef/attributionText values on their own
  meal row via a direct API call (no client UI exercised this, but the
  wire contract permitted it). No new attack surface introduced by the fix
  (a schema narrowing can only reject, never newly accept, a field).
☑ Privacy — no user/household data touched; this phase concerns recipe
  provenance metadata only.
☑ Performance — negligible: one extra object-lookup per rendered source
  badge/admin row (in-memory map lookup, not a query); one extra
  conditional paragraph on the meal detail page.
☑ Observability — no logging/monitoring surface changed.
☑ Accessibility — the new attribution link uses standard <a> semantics;
  the widened MealTrustSummary early-return does not change any existing
  ARIA/testid attribute.
☑ Trust — this is the core Trust action of this phase: before it, a
  licensed recipe's mandated attribution was invisible everywhere, a user
  request could fabricate a licence/attribution claim on their own meal,
  and three label vocabularies (one already silently drifted) disagreed
  about a source's own name. All three are closed at their root.
```

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Recipe Acquisition (licence/attribution) — not a Source-
  of-Truth register domain by name, but the exact "one mouth" gap PKCA1
  §7 Phase 2 and §2.1 name for Recipe licence/attribution detail.
Declared SoT: unchanged — shared/recipe-acquisition.ts
  (ACQUISITION_SOURCE_REGISTER) for policy; DB meals.licence_ref /
  meals.attribution_text for the per-row import-time snapshot. This phase
  wires existing consumers/writers to the already-declared owner; it does
  not change who the owner is.
New store created? NO.
Existing store extended? NO — no schema change; no new column, table, or
  field. RecipeSource's client-side TS interface gained two fields that
  the server API was already sending (no server response shape change).
Consumer created? YES — one new consumer:
  MealTrustSummary.tsx now reads meal.attributionText/meal.sourceUrl.
  Reads from the declared SoT (the persisted snapshot column)? YES.
Consumer retired? NO consumer file deleted, but three duplicate label
  vocabularies were retired in favour of reading the declared SoT
  (shared/recipe-acquisition.ts) directly:
    - meals-page.tsx's SOURCE_STYLES.label → getPolicyForSourceLabel(...)
    - admin-recipe-sources-page.tsx's SOURCE_LABELS → getAcquisitionSourcePolicy(...)
    - recipe-source-gate.ts's SourceMeta.label → deleted outright (dead, 0 consumers)
Writer closed? YES — api.meals.create.input (shared/routes.ts) no longer
  accepts licenceRef/attributionText from a client request body.
```

---

## ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Recipe licence/attribution "one mouth" adapter (PKCA1 §7 Phase 2; named
  as this phase's own scope by PKC3's "Next Planned Milestone").

Current Canonical Owner:
  Unchanged — shared/recipe-acquisition.ts (ACQUISITION_SOURCE_REGISTER,
  policy) + DB meals.licence_ref/attribution_text (per-row snapshot).

Current Runtime Consumer(s):
  meals-page.tsx (WebSourceBadge), admin-recipe-sources-page.tsx
  (SourceRow, audit log), MealTrustSummary.tsx (new) — all now read
  through the one register/one persisted snapshot; auto-import-service.ts
  remains the sole writer.

Duplicate Owners Remaining:
  NONE newly found for this specific fact. The three label-vocabulary
  duplications found and closed this phase (two client, one dead server-
  side) were the only "one mouth" violations this phase's trace uncovered
  for Recipe licence/attribution.

Duplicate State Remaining:
  NONE for the checks this phase ran: 0 remaining independent label
  copies (was 3, one already drifted); 0 rendering surfaces silently
  bypass the persisted attribution snapshot (there was 1 gap — total
  absence of rendering — now closed); 0 client-writable paths accept
  licenceRef/attributionText (was 1 latent path, now closed).

Duplicate Workflows Remaining:
  SmartReviewPanelContent.tsx's generic "View original recipe" link and
  MealTrustSummary's getMealHeading() heading logic were investigated and
  deliberately left unchanged — neither renders a specific fact that
  duplicates the register (no source name, no attribution text, just a
  generic link/heading), so there is no drift risk to close, the same
  judgement PKC3 applied to green-beans/runner-beans' shared alias.

Current Convergence (%):
  Recipe licence/attribution "one mouth" convergence (the specific check
  this phase ran, first time checked against HEAD rather than assumed
  converged by PKC3's provisional note): 100% for the write path and the
  label-display path, verified by script and by exhaustive call-site
  trace, not sampled. The deeper "does every recipe surface disclose
  attribution" question is now answerable (the field renders when
  present) but not retroactively complete — pre-existing rows imported
  before this phase, or via any path other than auto-import-service.ts,
  have no attributionText to show (see Residual Risk below), which is an
  honest gap, not a false convergence claim.

Target Convergence (%):
  100% for the specific gap this phase closed (write-layer + label-
  display "one mouth"). Not claimed: retroactive backfill of
  attributionText for meals imported before this column existed — that is
  a distinct, larger data-completeness task, named as residual risk below,
  not silently assumed done.

Next Planned Milestone:
  A future phase could backfill attributionText for pre-existing
  TheMealDB-sourced rows (detectable via acquisitionSourceKey = "themealdb"
  with a null attributionText) so historical imports also carry visible
  attribution, not just meals imported after this phase. Not started here
  — named so a future phase does not need to re-discover the gap.
```

---

## DEFINITION OF DONE

**What success looks like:**
- `POST /api/meals` can no longer be used to set `licenceRef`/`attributionText` from a client request body (verified by direct schema-parse test, not by inspection alone).
- The one attribution string a licence (TheMealDB's) requires THA to display now renders on the meal detail page whenever it has been persisted, linked to the recipe's source URL when available.
- Every recipe-source display label in the codebase resolves through `shared/recipe-acquisition.ts`'s `ACQUISITION_SOURCE_REGISTER` — zero independent copies remain (was 3, one already silently drifted from the register it copied).
- The admin recipe-sources page now surfaces the licence-compliance disclosure (`licenceNote` for `conditional` sources) that the server was already computing but the client was silently discarding.

**What must not break:**
- Every existing `createMeal` call site continues to behave identically — traced individually, none relied on the now-removed client-writable `licenceRef`/`attributionText` fields.
- `npx tsc --noEmit` shows zero new errors in any file this phase touched.
- `test-food-report-adapter.ts` and other existing suites show no new failures (pre-existing, previously-named failures excepted).

**Manual verification (performed this session):** see "Verification performed this session" above — every check is reproducible against current HEAD.

---

## DATA IMPACT

- Reads existing data: YES — `shared/recipe-acquisition.ts`, `server/lib/recipe-source-gate.ts`, `server/lib/auto-import-service.ts`, `shared/schema.ts`, `shared/routes.ts`, and their client consumers.
- Writes new data: NO new facts. No migration. No schema change.
- Changes meaning of existing data: NO for persisted rows. The *display* of a source's label now resolves to the register's canonical value in the one place it had drifted (`apininjas`: "API-Ninjas Recipes" → "API-Ninjas" in the admin UI only — a display-string correction, not a data change).
- Requires backfill: NO for this phase's own scope. A future phase's optional backfill of pre-existing `attributionText` values is named above as a residual, not performed here.

---

## TRUST CHECK

- **Could this mislead the user?** No — the opposite. Before this phase, a licensed recipe's legally-required attribution was invisible to every user, and a user's own hand-typed recipe could (via a direct API call) have carried a fabricated "licensed" attribution string with nothing to contradict it anywhere in the UI. Both are closed.
- **Could this fabricate certainty?** No. The new render path only ever shows a real, previously-persisted `attributionText` — it derives nothing, guesses nothing, and renders nothing for rows that lack it.
- **Is anything guessed but shown as real?** No. Every label displayed is the register's own literal `label` string; every attribution shown is a snapshot taken at genuine import time by `auto-import-service.ts`.
- **What happens if the system is wrong?** If a future audit finds a fourth undiscovered label copy, or a recipe surface this phase didn't trace, the correction is the same shape this phase performed: trace every reader/writer of the fact, converge on the one existing register/snapshot, verify by script.
- No architectural duplication introduced: **YES**.
- No new source of truth created: **YES**.
- No runtime behaviour altered beyond the declared scope: **YES** — every change is confined to (a) what `POST /api/meals` accepts, (b) what three specific UI surfaces render for recipe source/attribution.

---

## ROLLBACK PLAN

- Rollback identifier: `rollback/before-pkc4-launch-knowledge-wave2-20260704` → `ff3b2cf`.
- Files changed by this phase:
  - `shared/routes.ts` — `api.meals.create.input` now omits `licenceRef`/`attributionText`.
  - `server/lib/recipe-source-gate.ts` — `SourceMeta.label` field and all 9 `ALL_SOURCES` `label:` values deleted (dead, drifted duplicate).
  - `client/src/pages/admin-recipe-sources-page.tsx` — `SOURCE_LABELS` map deleted; `sourceLabel()` helper added (reads `@shared/recipe-acquisition`); `RecipeSource` interface gained `licenceState`/`licenceNote`; `SourceRow` renders the conditional-licence disclosure.
  - `client/src/pages/meals-page.tsx` — `SOURCE_STYLES` no longer carries `label`; `WebSourceBadge` resolves label via `getPolicyForSourceLabel`; new import of `@shared/recipe-acquisition`.
  - `client/src/components/meal-detail/MealTrustSummary.tsx` — renders `meal.attributionText`/`meal.sourceUrl` when present; early-return guard widened to account for it.
  - `docs/implementation/knowledge/PKC4_LAUNCH_KNOWLEDGE_WAVE_2_IMPLEMENTATION.md` — this file, new.
- Rollback commands: `git checkout rollback/before-pkc4-launch-knowledge-wave2-20260704 -- shared/routes.ts server/lib/recipe-source-gate.ts client/src/pages/admin-recipe-sources-page.tsx client/src/pages/meals-page.tsx client/src/components/meal-detail/MealTrustSummary.tsx` reverts all five edited files; `rm docs/implementation/knowledge/PKC4_LAUNCH_KNOWLEDGE_WAVE_2_IMPLEMENTATION.md` removes the new one.
- Verification after rollback: `git diff rollback/before-pkc4-launch-knowledge-wave2-20260704 -- shared/routes.ts server/lib/recipe-source-gate.ts client/src/pages/admin-recipe-sources-page.tsx client/src/pages/meals-page.tsx client/src/components/meal-detail/MealTrustSummary.tsx` shows no differences.

---

## SCOPE LOCK

**Implemented scope (this phase):** exactly PKC4 Wave 2 as scoped by this session's own candidate survey — verify (against actual repository state, not PKC3's provisional note) Recipe licence/attribution's Rule KC4 "one mouth" status now that the concurrent MealDB-activation workstream has landed; find and close the ungated write path for `licenceRef`/`attributionText` on `POST /api/meals`; render the previously-nowhere-rendered `attributionText` fact on the meal detail page; retire three duplicate/drifted label vocabularies (two client, one dead server-side) in favour of the one existing policy register; surface the previously-computed-but-discarded licence-compliance disclosure in the admin UI.

**Explicitly excluded (out of scope — not implemented by this phase):**
- Any backfill of `attributionText`/`licenceRef` for meals imported before this column existed, or via any path other than `auto-import-service.ts` — named as a residual, real gap for a future phase, not silently left unexamined.
- Any change to `SmartReviewPanelContent.tsx`'s generic "View original recipe" link or `MealTrustSummary.tsx`'s `getMealHeading()` — investigated, confirmed neither duplicates a specific register-owned fact, deliberately left unchanged.
- Any change to `canonical-map.json`, Plant Diversity, Dietary Preferences, or any other Wave 1 (PKC3) domain — untouched, out of this phase's scope.
- PKCA1 §7 Phases 3–6 (Evidence & Learning's first reporter/consumer, Preparation Knowledge build-out, demand-driven prioritisation, Retailer/Partner scope decisions) — unrelated to this phase's Recipe licence/attribution scope, and Phase 4 is explicitly gated to come after this one.
- Any change to the other workstreams sitting uncommitted in the same working tree (EWO2, EWX1, FI5, Platform Resilience & Operations, Companion Platform Architecture, Platform Quality Architecture, the MealDB activation work itself) — untouched, left exactly as found.

**Suggestions (not implemented without approval):**
- Backfill `attributionText`/`licenceRef` for any pre-existing `meals` row where `acquisitionSourceKey` is set (or derivable via `deriveAcquisitionFromLegacy`) but `attributionText` is null, so historical TheMealDB imports also carry visible attribution rather than only meals imported after this phase. Not implemented here because it is a data-backfill task with its own verification shape (comparable to PKC3's migration), distinct from this phase's write/render-path fix.
- Extend the same "one mouth" convergence check performed here to Food Relationships (PKCA1 §2.1's other still-unfilled adapter row) — PKC2 already confirmed no live second narrator exists there today, so it remains correctly deferred, not urgent.
