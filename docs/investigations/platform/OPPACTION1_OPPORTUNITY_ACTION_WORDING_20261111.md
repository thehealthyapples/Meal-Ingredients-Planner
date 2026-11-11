# OPPACTION1 — Opportunity action wording and critical-tier coverage

Date: 2026-11-11. Read-only scope: `opportunity-engine.ts` suggestedAction templates, critical-tier allowlist and callers, and UI surfaces that render these opportunities. No source changes.

## Part A — Critical-tier allowlist

**Partial — call-site audit not complete.** `shared/attention/index.ts:136` currently defines the closed one-member `CRITICAL_TYPES` set: `shopping-restriction-conflict`. `isCritical()` at `:151` classifies the priority value (`critical` only); `assertCriticalAllowed()` at `:163` enforces type membership at the producer boundary. The canonical budget clamp in `shared/attention/decision.ts:134–150` exempts critical-priority items from the delivery cap. Search command used: `rg -n "CRITICAL_TYPES|isCritical\(" shared/attention/decision.ts shared/attention server client --glob '*.{ts,tsx}'`; callers found in shared attention decision, opportunity-delivery framework filtering/telemetry, `server/intelligence/index.ts` export, and tests. This alone does not prove no other safety-critical notice category exists or that every producer calls the assertion. **No completeness verdict yet.**

## Part B — Suggested-action templates

Each line below is marked **Not yet checked** until its exact object evidence/explanation and user-facing rendering path have been read. The requested line references are not treated as verified findings.

- `opportunity-engine.ts:408` — Not yet checked.
- `opportunity-engine.ts:444` — Not yet checked.
- `opportunity-engine.ts:590` — Not yet checked.
- `opportunity-engine.ts:659` — Not yet checked.
- `opportunity-engine.ts:752` — Not yet checked.
- `opportunity-engine.ts:812` — Not yet checked.
- `opportunity-engine.ts:881` — Not yet checked.
- `opportunity-engine.ts:943` — Not yet checked.
- `opportunity-engine.ts:1015` — Not yet checked.
- `opportunity-engine.ts:1079` — Not yet checked.
- `opportunity-engine.ts:1146` passthrough — Not yet checked (lower priority).

## Rendering path

Partial discovery only: `client/src/hooks/use-companion-notices.ts` and `client/src/hooks/use-food-opportunities.ts` exist; `home-experience-page.tsx` consumes `useFoodOpportunities`. Exact cards, why/expand affordances, and all consumers remain **Not yet checked**.

## Incremental update — critical producer path

**Confirmed:** `opportunity-engine.ts:482` is the only production source assignment `priority: "critical"` found by `rg -n 'priority:\\s*"critical"' server/intelligence/food-intelligence/opportunity-engine.ts server/intelligence --glob '*.ts'`. The source type is `shopping-restriction-conflict` (`opportunity-engine.ts:480–483`). The Opportunity Delivery adapter imports and invokes `assertCriticalAllowed(rec.type, rec.priority)` at `server/intelligence/opportunity-delivery/framework.ts:76,242–258` before returning adapted records. This confirms the known Food Intelligence producer path is guarded. Other `isCritical` callers include delivery filtering/telemetry and shared attention sorting/clamping; full producer coverage and the question of whether every other possible producer reaches this adapter remain **not yet confirmed**. No final allowlist completeness verdict yet.

## Incremental update — action wording (first 4 checked)

Read each opportunity object’s local explanation/evidence and action, at the supplied (now verified) source lines:

- `opportunity-engine.ts:408` — **Terse but clear, no finding.** “Add a meal to [day] in [week].” The adjacent explanation/evidence identifies the empty planner day and count of unplanned days (`:398–405`); action is an unambiguous optional step.
- `:444` — **Terse but clear, no finding.** “Plan a meal that uses [item] from your pantry.” Adjacent explanation/evidence says that pantry item has not appeared in planner history (`:438–443`); reason is specific and the action names the item.
- `:590` — **Terse but clear, no finding.** Action says what ingredient to add when making the named meal. Adjacent explanation names the potential small nutrition lift and ingredient; evidence includes the planner occurrence and the uplift rule’s approved user-facing reason (`:580–589`).
- `:659` — **Terse but clear, no finding.** Batch-cook named meal and portion across named days. Explanation/evidence says it is already planned on multiple days, so the suggested effort-saving action is intelligible (`:651–658`).

UI/reason-path status for these four: **not yet checked**; do not infer access to the fuller explanation from the source object alone.

## Incremental update — action wording (next 6 checked)

- `opportunity-engine.ts:752` — **Terse but clear, no finding.** “Check whether you still need [item] before you shop.” The explanation/evidence immediately above says the unchecked item is on the list while a canonical match is already in the pantry (`:738–751`); action is clear and reason is concrete.
- `:812` — **Terse but clear, no finding.** “Compare [listed product] with [matched product] before you shop.” Its explanation states the two stored THA ratings, and evidence identifies shopping-list and Analyser rating sources (`:796–811`). It avoids claiming that a higher rating means better.
- `:881` — **Terse but clear, no finding.** “Have a look at [option] next time you shop for [anchor].” Explanation states the listed item and the less-processed option; evidence carries WS9’s editorial reason verbatim (`:868–880`).
- `:943` — **Terse but clear, no finding.** “Add [item] to your shopping list.” Explanation says the household recorded a need and it is missing from the current list; evidence gives both facts (`:928–942`).
- `:1015` — **Terse but clear, no finding.** “Cook [recipe] from what you already have.” Explanation/evidence says every required ingredient is present in the pantry (`:1000–1014`).
- `:1079` — **Terse but clear, no finding.** “Adapt [recipe] to work around [ingredient], or keep it as it is.” Explanation names the stored household restriction conflict and evidence identifies recipe ingredient plus active restriction (`:1060–1078`).

`opportunity-engine.ts:1146` is a projection of `opportunity.suggestedAction`, not a separately authored template. Its source is `buildNutritionBalanceOpportunity` in `server/intelligence/food-intelligence/engine.ts`; the original action/explanation trace remains **not yet checked**.

UI trace remains open: these source objects contain explanations/evidence, but this is not proof every presentation surface offers access to them.

## Rendering trace — partial

- **Home food-opportunities consumer:** `client/src/pages/home-experience-page.tsx:188,340` reads `useFoodOpportunities` and passes its opportunity array into Home's `criticals` model. The exact rendering component/affordance has not yet been read; reason path status is **Not yet checked**.
- **Companion notices:** `client/src/hooks/use-companion-notices.ts:20–54` exposes voiced `text` and retains underlying `fact` alongside it; the hook itself presents no UI or action. Notice surface consumer(s) and whether `fact` is shown/expandable remain **Not yet checked**.
- Search command `rg -n "suggestedAction|explanation|foodOpportunities|selectedOpportunity|Why\?|expand" client/src --glob '*.{ts,tsx}'` found opportunity-related Home and Companion references, but a complete consumer-to-component trace is still pending. No surface-level conclusion yet.

## Part A update — cookbook recipe conflict priority

**Verdict: medium is deliberate and consistent with the stated lifecycle distinction; no allowlist expansion finding.** `identifyCookbookRecipeConflictOpportunities` detects an existing cookbook recipe that conflicts with an active hard restriction, but it does not modify, suppress, or prevent use of that user-owned recipe; its explicit two choices are adapt it or keep it (`opportunity-engine.ts:1025–1080`). The adjacent rationale at `:1034–1038` says `shopping-restriction-conflict` is critical because that item is about to be bought, while a recipe merely sitting in the cookbook is not. The shopping generator also excludes checked/actioned list items and targets an unchecked active shopping line (`:453–484`). Thus the platform reserves critical priority for an imminent purchase decision, and treats the cookbook conflict as advisory until the household chooses to cook it. The cookbook action itself names the conflicting ingredient (`:1079`), and its adjacent explanation/evidence names the stored restriction. This is a specific product-policy rationale in the source, not an inferred general rule. It does not prove an already-planned cookbook-conflicting meal cannot create immediate risk; that use case is outside this chunk and no additional critical type is recommended from current evidence.

## Part A update — producer enforcement

Repository search: `rg -n -F 'priority: "critical"' server shared --glob '*.ts'` found one production assignment, at `server/intelligence/food-intelligence/opportunity-engine.ts:482`; other hits were tests. Search `rg -n -F 'assertCriticalAllowed(' server shared --glob '*.ts'` found the production assertion only at `server/intelligence/opportunity-delivery/framework.ts:257` (plus its definition and tests). The adapter’s `adaptFoodIntelligence` calls it for each input record before projection; all opportunities emitted by the Food Intelligence source pass through the framework’s `OPPORTUNITY_SOURCES` adapter path (`framework.ts:242–274` and source registration near `:130–190`). No other production priority assignment or producer bypass was found in these exact literal searches. `isCritical` consumers sort, clamp, filter mutes, or count delivery; they do not create priority values. This supports the closed allowlist as the single enforcement source for the opportunity critical tier. It does **not** govern the separate Notice Engine’s priority vocabulary: architecture explicitly states notice priority has only high/medium/low and recalls have a separate immediate-interruption rule (`docs/architecture/THA_INTELLIGENCE_LANGUAGE_GUIDE.md:51,206`). **Allowlist verdict: complete for opportunity critical-priority emission; one permitted type, and the production producer path is guarded.**

## Rendering-path trace — partial

- **Critical shopping conflict:** Home uses `useFoodOpportunities` and passes the opportunity list into its primary-action selection (`home-experience-page.tsx:188,340`). The hook retrieves the structured API result (`use-food-opportunities.ts:57–80`), which includes `explanation` and `suggestedAction` (`:24–52`). The actual Home card renderer and affordance have not yet been fully traced; do not infer a Why path.
- **Companion notices:** `FloatingAssistant.tsx:1309` consumes `useCompanionNotices`; the hook’s notice model carries voiced `text` and underlying `fact` (`use-companion-notices.ts:20–54`). The separate notice fact-to-UI rendering and whether it is expandable remain to be checked.
- **Dev concepts:** `arrival-experience.tsx` and `exp2-shared.tsx` also call the notices hook; these are prototype pages and their status as user-facing production surfaces is not established here.
- Overall UI verdict: **incomplete**, with Home, FloatingAssistant, and the two dev consumers identified; exact display/reason affordances not yet established.

## Rendering path — completed for production consumers

- **Home:** `home-experience-page.tsx:188` loads opportunities and `:339–349` supplies them to `resolveHomePrimaryAction` as `criticals`. The only downstream use is selecting the Meals glance card destination (`:466–470`); the rendered card shows meal count/status and links to Shopping, Larder, or Planner. It does **not** render an opportunity card, `suggestedAction`, or `explanation`, and has no “Why?” affordance. Thus Home is not a surface showing a terse action without its reason; it uses opportunity state only to choose a destination. `FoodOpportunitiesPanel` was referenced in comments but `rg --files client/src | rg 'FoodOpportunitiesPanel'` returned no matching file; the actual current Home usage above is the verified path.
- **FloatingAssistant:** `FloatingAssistant.tsx:1309` reads notices from `useCompanionNotices`; the list at `:1948–1974` displays each notice’s `n.text` and a tappable `Why?` button calling `handleExplainNotice(n.text)`. This gives a direct reason path for every displayed notice. The button asks the Companion on request rather than expanding `fact` inline. `fact` is retained by the hook (`use-companion-notices.ts:20–54`) but is not directly rendered in this list; the code comment at `FloatingAssistant.tsx:1956–1963` says the follow-up is grounded through the normal conversation channel.

**Part B presentation conclusion:** The ten `opportunity-engine.ts` actions are not shown as standalone action sentences by either of these two traced production consumers: Home uses opportunities only for destination resolution; FloatingAssistant renders separate Notice Engine notices and has a `Why?` path. Therefore no confirmed surface in this requested production path exposes these ten actions without their reason. This does not assert that no other surface exists outside the traced consumers.

## Final status

Part A complete: the opportunity `critical` allowlist has one member, the sole production critical assignment, and its producer records reach the guarded Opportunity Delivery adapter. `cookbook-recipe-household-conflict` is medium by explicit lifecycle rationale (stored recipe, not imminent purchase; user retains control). Part B: all ten requested action strings were read with adjacent explanation/evidence and judged terse but clear; no wording finding. The line 1146 pass-through originates from `buildNutritionBalanceOpportunity` in `server/intelligence/food-intelligence/engine.ts` and is not an independent authored template; no separate notice-wording verdict is required for it.
