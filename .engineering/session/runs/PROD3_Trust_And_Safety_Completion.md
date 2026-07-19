
# Session: PROD3_Trust_And_Safety_Completion

| Field | Value |
|---|---|
| **Session ID** | `PROD3_Trust_And_Safety_Completion` |
| **Rollback ID** | `rollback/PROD3-trust-and-safety-completion-20260718` |
| **Start time** | 2026-07-18T21:20Z UTC |
| **Current stage** | Complete — awaiting owner review |

## Objective
Complete THA Trust & Safety by CONNECTING the safety architecture that already
exists. No new AI capability, no new safety system, no new architecture, no
duplicated business logic.

## Rollback protection
- Annotated tag `rollback/PROD3-trust-and-safety-completion-20260718` → `6e326d9f` (HOUSE_ACT1)
- Dirty-tree snapshot `stash@{0}` → `fd880809d679fe8d4c32e5c320f39267281fcba6`
  (`git stash create`/`store` — the working tree was NOT disturbed)
- **Coverage per ROLLBACK §3:** tag = committed state only; snapshot = the 3
  modified tracked files and **NONE of the 32 untracked** (concurrent sessions').

## The finding
THA has had a canonical, fail-closed household dietary safety gate since SURF1B
(`server/lib/household-dietary-safety.ts`), pinned by six suites, whose own
header names "the AI prompt blocks, chiefly" as an intended consumer.

    grep -rl "household-dietary-safety" server/intelligence/   →  NO MATCHES

The Companion consumed it nowhere. Five defects, all verified before change:
1. `meal-discovery-engine.ts:61` READ `m.ingredients` to match a query and
   dropped them at `:81`; `DiscoveryItem` has no ingredients field; no gate.
2. HARD RULES 1–5 (`conversation-gateway.ts:1166`) never mentioned allergies.
3. Restrictions reached the model only when `household:read` happened to be
   routed — a meal-discovery turn carried NO restriction fact.
4. Response validation was type-shape only, with two raw-output bypasses, and
   `mergeEntityRefs` ADDED meal refs the model never cited.
5. Food Intelligence Rule T0 failed OPEN: a FAILED household read returned the
   same signal as "no household", so an empty restriction list admitted all.

🔴 **PROOF IT SHIPPED:** `test-intelligence-native-discovery.ts:248` — passing,
in `npm test` — asserted meal 42 arrives for user 1. Meal 42 = "Pasta Bake Test"
(`300g pasta`); user 1's household = **Gluten-Free**. A green aggregate test was
pinning delivery of a gluten-bearing meal to a gluten-free household.

📊 **EXPOSURE:** 100 of 327 live users (30.6%) have an ACTIVE safety gate — 27
with hard restrictions, 95 with a diet pattern.

## Design decision — which engine
The mission named `restriction-safety.ts`. Wiring it as a GATE would have been
wrong: it is a REPORTING function with three early `return []` paths (unknown
restriction, no eaters, no restrictions) that a filter reads as SAFE. Wired
`isMealSafeForHousehold` instead — the gate SURF1B built, which fails CLOSED and
covers diet patterns. Both reach the same `restriction-resolver` underneath, so
this is one owner by the right door, not two engines.
**Corrected PROD2:** `restriction-safety.ts` has 3 CLIENT consumers (analyser),
not "zero anywhere" — the true claim is zero SERVER-side.

## Delivered
- Meal discovery gated (personal meals too; slotless templates withheld —
  "cannot see what's in this" ≠ safe); exclusions COUNTED, not silent.
- HARD RULE 6 + always-on safety block from the canonical owner; personality
  invariant extended to "never softens rule 6"; unresolved → explicit refusal.
- `validateResponseSafety` on BOTH return paths incl. the raw-output fallback,
  over the MERGED refs. Validates REFS not PROSE — scanning prose would block
  "you've told us about Ava's peanut allergy, so avoid satay", which is correct.
- Rule T0 fail-open closed (`resolutionFailed`). Opportunity engine CHECKED and
  needed no change (`:1076` already returns empty when `!resolved`).

## Verification
- NEW `test-prod3-companion-restriction-safety.ts` — 418 lines, **36 assertions,
  0 failed**, wired into `npm test` (10 layers incl. fail-closed + live pin).
- 13/13 safety suites · 17/17 intelligence suites · **30 suites, 0 failures**.
- tsc **94, unchanged**, none in touched files; adoption **82 passed, 0 failed**;
  build exit 0.
- PRODUCTION engine + live data, user 1 (Gluten-Free+Keto):
  `pasta` 15→0 (68 excluded) · **`chicken` 15→15 (unaffected)** · salad 6 ·
  curry 9 · soup 11 · fish 9 · eggs 7. **0 unsafe items leaked.**
- Fail-closed forced: unavailable ctx → 0 returned, 2 withheld, status surfaced.
- Real captured system prompt shows the block on a PROFILE turn (household
  capability not routed) — the exact gap that existed.

## One existing test changed (not a workaround)
`test-intelligence-native-discovery.ts` §4 moved user 1 → user 2 (unrestricted)
so INT36's MERGE is the only thing under test. The withholding assertion moved
to PROD3 §5, which runs the same fixture against user 1 and REQUIRES meal 42 to
be refused. Both fixture meals are unsafe for user 1 (42=gluten, 100=Keto), so
no id substitution could have preserved it there.

## Deliberately NOT gated (stated, not skipped)
pantry / shopping / diary / planner discovery surface the household's OWN
recorded data — reporting, not recommending; filtering would hide a household's
own data from them. If any starts to SUGGEST, it must adopt the gate then.

## Next action
Owner to review `docs/implementation/PROD3_TRUST_AND_SAFETY_COMPLETION.md`.
Top recommendations: (1) parallelise `npm test` — an aggregate that cannot run
is a safety suite that does not run; (2) populate template slot data, now the
binding constraint on recommendation breadth for restricted households;
(3) pseudonymise named children's allergies sent to OpenAI (`routes.ts:9563`) —
untouched here and now the largest remaining trust exposure in this area.
