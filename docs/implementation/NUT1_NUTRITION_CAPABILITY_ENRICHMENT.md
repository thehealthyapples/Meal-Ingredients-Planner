# NUT1 — Nutrition Capability Enrichment

**Status:** 🟢 IMPLEMENTED
**Date:** 2026-07-02
**Branch:** int1-intelligence-platform
**EWO:** EWO-NUT1 (🟡 AMBER)
**Builds on:** [`INT41_CAPABILITY_ENRICHMENT.md`](./INT41_CAPABILITY_ENRICHMENT.md) · [`INT39_CAPABILITY_GUIDANCE_REGISTRY_AND_GOAL_COMPLETION.md`](./INT39_CAPABILITY_GUIDANCE_REGISTRY_AND_GOAL_COMPLETION.md)
**Governing architecture:** [`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](../architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) · [`THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`](../architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md) · [`THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md`](../architecture/THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md)
**Tests:** `npm run test:nutrition-enrichment` (22 assertions, new) — added to the `npm test` chain, run immediately after `test:intelligence-companion-enrichment`. Full chain re-run with zero regressions.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Working tree at start | Already dirty with prior uncommitted INT35–INT41 work on this branch (see `git status`), unrelated to this workstream except where it extends INT41's enrichment framework |
| HEAD at start | `4a2da735f5b80bac2da4dd306c387adeb5e431de` — "Document investigation into why some assistant capabilities are not being reached" |
| This task's writes | See §10 Files changed — one new file, two small additive edits to two existing INT41 files, one new test file, two `package.json` lines |
| Rollback | No new tag created (the working tree already carried substantial uncommitted prior work, so a clean pre-task tag would not isolate this change). To revert NUT1 specifically: delete `server/intelligence/conversation/nutrition-enrichment.ts` and `server/tests/test-nutrition-enrichment.ts`; in `conversation-gateway.ts` revert the `nutrition-enrichment.ts` import and restore the single-line `const enrichment = buildEnrichment(enrichmentSources);`; in `companion-enrichment.ts` revert `MAX_ENRICHMENT_ITEMS` to a private (non-exported) const; in `capability-registry.ts` revert the two added `nutrition-knowledge` ENRICHMENT items; remove the two added `package.json` lines. Every edit is additive and independently revertible — nothing else in the codebase reads any of the new exports. |

---

## 1. Objective

EWO-NUT1 asks for "the next evolution of the Nutrition capability": richer, evidence-based enrichment; better contextual explanations, recommendations and educational guidance drawn from *existing* nutrition knowledge; and — new relative to INT41 — meaningful **personal relevance** where trusted data is available, without abandoning INT41's honest-gap and capability-ownership discipline.

INT41 gave `nutrition-knowledge` two generic, capability-wide static enrichment items (the same prose regardless of which food/nutrient/benefit a turn was actually about, and the same prose regardless of who was asking — explicitly "no per-user personalisation... by design"). NUT1 keeps that static table but adds two new, independent, deterministic sources layered on top of it:

1. **Richer, evidence-based, turn-specific context** — when a turn's nutrition-knowledge answer names a specific canonical food, surface that food's own already-curated evidence line (`shared/canonical/nutrition-context.ts`, the same content the Food Report already displays) instead of only the generic capability-wide prose.
2. **Personal relevance, honestly gated** — when the caller has a stated diet pattern or restriction (their own profile data) and the food actually being discussed genuinely conflicts with it under the same diet-compliance rules already used elsewhere in the app (`shared/dietRules.ts`), surface one real, rule-detected insight. Silent in every other case — this is never a fabricated "this fits your goals" claim, only a real, deterministic conflict check.

Neither addition invents a new nutrition fact, a new health claim, or a new inference. Both reuse content/logic that already exists and is already governed elsewhere in the codebase.

## 2. Why this needed more than a bigger static table

INT41's `CapabilityEnrichmentItem` is static prose, declared once, identical for every turn and every user (types.ts §"Capability Enrichment" docstring: "never a live computation, never personalised, never fabricated per-turn"). That discipline is preserved *unchanged* here — the static table still behaves exactly as INT41 specified it.

But "richer, evidence-based" and "personal relevance" are turn-specific and user-specific by definition — they cannot be expressed as one-size-fits-all static prose without either (a) being too generic to be "richer" than INT41 already was, or (b) fabricating a claim about a food or a user the platform hasn't actually checked. So NUT1 adds a **second, parallel enrichment source** — `server/intelligence/conversation/nutrition-enrichment.ts` — composed at the gateway from data the platform has *already read this turn*, rather than extending `CapabilityEnrichmentItem` itself into something no longer static (which would weaken the guarantee every other capability's declared items still rely on).

### Ownership boundary — the reason this is safe

`nutrition-knowledge-read-handler.ts` documents a hard boundary: it is general/public knowledge only and must never touch diary/profile data ("User-specific / diary-linked summaries are out of scope and return an honest gap" — see its `report` verb). `profile-read-handler.ts` is equally explicit that it never pulls another capability's data in. NUT1 does not weaken either boundary: **neither handler is touched.** The new module is called from `conversation-gateway.ts` — already the one place in the codebase that reads *across* capabilities for a single turn (it already does this for discoveries, actions, and guidance) — with each capability's *own, already-computed* result for the turn:

```
queryResults.get("nutrition-knowledge")?.outcome?.result   // nutrition-knowledge's own read, unchanged
queryResults.get("profile")?.outcome?.result                // profile's own read, unchanged — always-on baseline query, already fetched every turn
```

Nothing here is a new database read, a new port, or a new cross-capability call. It is a read of two results the platform already produced this turn, composed once, at the one layer that already has legitimate visibility into every capability's turn output.

## 3. Source #1 — richer evidence-based context (no fabrication)

`shared/canonical/nutrition-context.ts` already holds short, evidence-based, editorial context lines for ten canonical foods (tomato, spinach, mushroom, chickpeas, lentils, flaxseed, chia-seeds, walnuts, extra-virgin-olive-oil, avocado), keyed by the same canonical food slug `nutrition-knowledge`'s own `read`/`explain` results already carry (`result.slug` / `result.foodSlug`). This content was already authored, already reviewed against the EFSA/health-claim firewall, and already shown elsewhere (the Food Report) — NUT1 does not author a single new fact; it looks the slug up and surfaces the *same* line as a turn-specific enrichment item when the turn was actually about that food. A food with no curated line (e.g. broccoli) yields nothing — an honest gap, not a generic filler.

## 4. Source #2 — personal relevance (real data, real existing logic, honestly gated)

`profile-read-handler.ts` already exposes the caller's own `dietPattern` and `dietRestrictions` (`ProfileView`) — real, permission-scoped, already-read-every-turn data (the profile capability is queried as an always-on "baseline" intent on every turn, per `pattern-intent-resolver.ts`). `shared/dietRules.ts`'s `shouldExcludeRecipe(text, { dietPattern, dietRestrictions })` is the same, already-in-production keyword-based compliance check used to filter recipes elsewhere in the app — not a new inference engine written for this workstream.

NUT1 concatenates the discussed food's own name/category/subcategory/description (from nutrition-knowledge's own "food" scope read — the only scope with enough text to check honestly) and runs it through that same function. When it returns `true` (a genuine, rule-detected conflict — e.g. asking about "Chicken Breast" while the caller's profile is set to "Vegan"), one `insight`-kind item is surfaced naming the caller's own stated diet. When it returns `false` (the common case — most foods don't conflict with most diets), **nothing is added** — this deliberately never asserts a positive "this fits your diet" claim, only a real negative-match conflict, because a positive claim would require verifying every possible hidden ingredient the platform has no data on.

Every gate is deliberately conservative:
- No profile query this turn (not authenticated, or the baseline query didn't run) → nothing.
- Profile has no stated `dietPattern` and empty `dietRestrictions` → nothing (there is no real signal to check against).
- The food result's scope is `"food-benefits"` / `"food-benefit"` (the `explain` path) rather than the full `"food"` read → nothing (not enough text — category/description are absent — to check honestly; guessing from a food name alone would be a low-confidence claim, not an honest one).
- The diet pattern is one `dietRules.ts` only scores rather than hard-excludes (Mediterranean, DASH, MIND, Flexitarian) → nothing (there is no hard-conflict signal for these patterns; NUT1 does not invent one).

## 5. Wiring

`conversation-gateway.ts`'s `buildGroundedResponse()` already computed `enrichmentSources`/`buildEnrichment()` for INT41's static table. NUT1 adds one call alongside it, then combines and re-applies the *same* cap INT41 already enforces (`MAX_ENRICHMENT_ITEMS`, now exported from `companion-enrichment.ts` for reuse rather than redeclared):

```ts
const staticEnrichment = buildEnrichment(enrichmentSources);
const nutritionEnrichment = buildNutritionEnrichment(
  queryResults.get("nutrition-knowledge"),
  queryResults.get("profile"),
);
const enrichment = [...staticEnrichment, ...nutritionEnrichment].slice(0, MAX_ENRICHMENT_ITEMS);
```

This sits in exactly the same successful-only branch INT41 already gated on — every unsuccessful-turn branch (write-intent guard, provider unavailable, the four INT35 fallback states, an LLM transport failure) still returns `enrichment: []` unchanged, because `nutritionEnrichment` is only ever computed from `queryResults`, which is never populated on those branches.

## 6. Presentation — no client change

The combined array is still exactly `CompanionEnrichmentItem[]` — the same shape INT41 already wired through `FloatingAssistant.tsx`'s `EnrichmentBlock`. NUT1's two new sources use the existing `kind` vocabulary (`"explanation"` for evidence context, `"insight"` for personal relevance) and carry no new field. **Zero client-side changes were needed or made** — the existing read-only rendering (kind label + title + body, no button, no click handler) already renders these items correctly, and the existing firewall against navigation/mutation already applies to them.

## 7. Definition of Done

- **What success looks like:** a successful nutrition-knowledge turn about a specific food now surfaces (a) that food's own curated evidence line when one exists, and (b) — only when the caller has a stated diet that genuinely conflicts with the food — one honest personal-relevance insight naming their own diet. Both are additional to, not a replacement for, INT41's existing generic static items (now also expanded from two to four, covering `explain` and `search`, still 100% static/generic).
- **What must not break:** every existing capability's enrichment, guidance, discoveries, Companion Actions, and the four INT35 fallback states. Proven by the unchanged `npm test` chain (30 suites; INT41 was the 29th, `test:nutrition-enrichment` is the 30th) — zero regressions.
- **Manual verification:** `npx tsc --noEmit` — no new errors introduced by any file this workstream touched (the pre-existing, unrelated `household-discovery-handler.ts` baseline error INT40/INT41 already documented is present and unchanged).

## 8. Data Impact

- Reads existing data: **NO new reads.** `nutrition-enrichment.ts` reads only `queryResults` entries the gateway already populated this turn for `nutrition-knowledge` and `profile` — both already-bound, already-executed reads with no changes to either handler or port.
- Writes new data: **NO** — no new table, no new column, no persistence. Composed per turn, held only in the same ephemeral client state (`enrichmentByTurn`) INT41 already established.
- Changes meaning of existing data: **NO** — `shared/canonical/nutrition-context.ts` and `shared/dietRules.ts` are read exactly as they already are; neither is modified by this workstream.
- Requires backfill: **NO.**

## 9. Trust Check

- **Could this mislead the user?** No — the evidence-context item is the *same* curated line already shown elsewhere (Food Report); the personal-relevance item only ever fires on a real, rule-detected conflict using the caller's own stated data, never a guess about data the platform doesn't have.
- **Could this fabricate certainty?** No — a food with no curated context line yields nothing; a diet with no hard-exclusion rule in `dietRules.ts` (Mediterranean/DASH/MIND/Flexitarian) yields nothing; a profile with nothing stated yields nothing. Silence is the default in every branch, exactly like INT41's `[]`-on-nothing-declared discipline.
- **Is anything guessed but shown as real?** No — `extractFoodRef`/`extractDietContext` only ever read fields that are actually present on the real result shapes; a malformed or unrecognised shape returns `null`/`[]`, never a best-effort guess (see §4 test: "a profile result missing its 'profile' field is treated as no data, not a crash").
- **What happens if the system is wrong?** Worst case is a missed personal-relevance insight (silence) — there is no mutation, no navigation, and the only claim ever made (a diet conflict) is backed by the same keyword logic already trusted for recipe filtering elsewhere in the app, not a new judgement invented for this workstream.
- No architectural duplication introduced: **YES** confirmed — the evidence-context lookup and the diet-compliance check each have exactly one existing owner (`shared/canonical/nutrition-context.ts`, `shared/dietRules.ts`); NUT1 adds no second copy of either.
- No new source of truth created: **YES** confirmed — no new table, no new registry, no new static-content table parallel to INT41's `ENRICHMENT`.
- No runtime behaviour altered for capabilities outside this slice: **YES** confirmed — `buildNutritionEnrichment` returns `[]` immediately unless `nutrition-knowledge` itself produced `ok-data` this turn; every other capability's enrichment, guidance, and action flow is untouched.

## 10. Governance compliance

- **Reuses the existing Capability Enrichment framework — does not replace or fork it.** INT41's `ENRICHMENT` table, `CapabilityEnrichmentItem`/`CapabilityEnrichment` types, `buildEnrichment()`, and the gateway's success-only gating are all unchanged in behaviour; NUT1 only expands the `nutrition-knowledge` seed (still 100% static) and adds a second, independent, equally-deterministic source composed the same way — no LLM in either path, no new content ownership pattern.
- **Existing ownership boundaries preserved.** `nutrition-knowledge-read-handler.ts` and `profile-read-handler.ts` are byte-for-byte unchanged — neither gains a new data dependency. The cross-capability composition happens only in `conversation-gateway.ts`, the pre-existing seam already trusted to read across capabilities for a single turn.
- **Honest gaps preserved.** Every branch in `nutrition-enrichment.ts` that lacks real data returns `[]`, never a fabricated default — proven by 9 of the 22 new test assertions exercising exactly this (§1, §2, §4).
- **Deterministic, no LLM call.** `buildNutritionEnrichment` is pure — identical input yields byte-identical output (§4 test), matching `buildEnrichment`'s own purity guarantee.
- **Companion Card Experience Principle preserved.** The new items carry no `href`, no mutation handler, and reuse the existing read-only `EnrichmentBlock` rendering unchanged — structurally incapable of navigation or mutation, same as every other enrichment item.
- **EFSA/health-claim firewall preserved.** No new nutrition or medical claim is authored anywhere in this workstream; the evidence-context content is pre-existing, pre-reviewed editorial prose, and the personal-relevance content is a dietary-pattern-compliance note, never a health-outcome claim.

---

## 11. Scope Lock

**Implemented:**
- Four static `nutrition-knowledge` enrichment items (was two) — two new items scoped to `explain` and `search` respectively, still 100% static/generic per INT41's discipline (`server/intelligence/capability-registry.ts`).
- `server/intelligence/conversation/nutrition-enrichment.ts` (new) — `buildNutritionEnrichment()`, composing (1) curated per-food evidence context from `shared/canonical/nutrition-context.ts` and (2) honestly-gated personal relevance via the caller's own profile diet fields run through `shared/dietRules.ts`'s existing `shouldExcludeRecipe()`.
- Gateway wiring: `conversation-gateway.ts` combines the static and NUT1 enrichment sources and re-applies the existing `MAX_ENRICHMENT_ITEMS` cap (now exported from `companion-enrichment.ts` for reuse, not redeclared).
- 22 new automated assertions (`test-nutrition-enrichment.ts`), added to the `npm test` chain immediately after INT41's enrichment suite.

**Explicitly excluded (honest gaps, not implemented):**
- No positive "this food fits your diet" claim — only real, rule-detected conflicts are surfaced (§4). A future workstream could add a genuinely verified positive-match signal if a real, non-guessed data source for it exists; not fabricated here.
- No personal relevance for diet patterns `dietRules.ts` only scores rather than hard-excludes (Mediterranean, DASH, MIND, Flexitarian) — an honest gap, not an oversight; extending this would require new compliance logic outside this workstream's scope.
- No personal relevance on the `explain` (food-benefits) read scope — it carries no category/description text to check honestly; extending it would require either a second read (out of scope, delegation-only boundary) or a lower-confidence guess (rejected as dishonest).
- No expansion of `shared/canonical/nutrition-context.ts` itself (still 10 foods) — authoring new evidence-based context lines is editorial work for the Nutrition / Knowledge owner, not this workstream.
- No client-side visual distinction between "static" and "personal" enrichment items — both render through the existing `EnrichmentBlock` unchanged; a future workstream could add a "Personal" badge if a real product need arises.
- No dashboard/analytics extension — enrichment still has no click-through event to measure (unchanged from INT41 §3).

**Suggestions for follow-up workstreams (not implemented without approval):**
- If the Nutrition / Knowledge owner authors more `NUTRITION_CONTEXT` entries, they surface automatically with zero code change here — the lookup is by slug, not by an enumerated list.
- A future workstream could extend personal relevance to `excludedIngredients` (also on `ProfilePreferencesView`) using the same conflict-only, honestly-gated pattern established here.

---

## 12. Files changed

| File | Change |
|---|---|
| `server/intelligence/capability-registry.ts` | `nutrition-knowledge` ENRICHMENT: two new static items (`explain`-scoped, `search`-scoped) alongside the existing two |
| `server/intelligence/conversation/companion-enrichment.ts` | `MAX_ENRICHMENT_ITEMS` exported (was private) so the gateway can reuse the same cap |
| `server/intelligence/conversation/nutrition-enrichment.ts` | **New** — `buildNutritionEnrichment()`: evidence-context + personal-relevance composition |
| `server/intelligence/conversation/conversation-gateway.ts` | Combines `buildEnrichment()` output with `buildNutritionEnrichment()` output, re-capped at `MAX_ENRICHMENT_ITEMS` |
| `server/tests/test-nutrition-enrichment.ts` | **New** — 22 assertions across 4 sections |
| `package.json` | + `test:nutrition-enrichment`, added to the `test` chain after `test:intelligence-companion-enrichment` |

Full chain (`npm test`, 30 suites) passes with zero regressions. `tsc --noEmit` introduces no new errors on any file this workstream touched (pre-existing, unrelated baseline error in `household-discovery-handler.ts` confirmed present and unchanged before/after this workstream, same baseline INT40/INT41 documented).
