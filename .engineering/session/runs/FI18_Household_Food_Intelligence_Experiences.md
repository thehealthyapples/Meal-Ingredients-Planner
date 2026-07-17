# FI18 — Household Food Intelligence Experiences

**Session ID:** `FI18_Household_Food_Intelligence_Experiences`
**Opened:** 2026-07-17
**Branch:** `int1-intelligence-platform`
**Type:** Investigation only — design, not implementation.
**Risk:** 🟢 GREEN (read-only; authors one document under `docs/investigations/`)

---

## Objective

Define how THA's **existing** Food Intelligence is surfaced throughout the product:
Dashboard observations · Planner intelligence · Pantry discoveries · Cookbook
enrichment · Shopping guidance · Food page intelligence · Companion conversations ·
Micro-learning opportunities.

Constraints from the mission, treated as binding:
- **Do not implement.**
- **Do not change schemas.**
- **Do not create new ownership.**
- Use the **existing architecture** only.
- Prioritise quick wins; identify highest-value experiences.
- Report filed under `docs/investigations/`.

---

## Rollback

| Item | Value |
|---|---|
| Rollback tag | `rollback/FI18-household-food-intelligence-experiences-20260717` → `a9116faa53065f863fc23de81384873d698a878f` |
| Working tree at start | **Intentionally dirty — NOT MINE.** Pre-existing uncommitted work from sibling sessions (NORTH3, NORTH4, CONV1 P10). The tag protects committed state only; it does **not** cover those files. Do not touch, do not commit them. |
| This session's writes | `docs/investigations/<workstream>/FI18_HOUSEHOLD_FOOD_INTELLIGENCE_EXPERIENCES.md`, this run file, one row in `.engineering/session/CURRENT.md` |

---

## Stage

**Investigation → Documentation**

## Checkpoints

- [x] Architecture bootstrap read (`docs/architecture/README.md`)
- [x] `git status` confirmed; rollback tag created and resolved
- [x] Run file opened
- [ ] Governing constraints read (Food Intelligence, Observation/Notice/Decision engines, presentation principles, Experience governance)
- [ ] Existing Food Intelligence mapped in code (what is actually built TODAY)
- [ ] Eight surfaces designed against existing architecture
- [ ] Quick wins + highest-value ranked
- [ ] Report written and committed

## Open question carried into the design

`THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` § 13 (2026-07-03) records **0%
Domain Intelligence layer build-out** and gates Phase 1 (the Food Intelligence
Engine) behind a Phase 0 convergence exit. The mission says surface *existing*
Food Intelligence. **What exists must be measured, not assumed** — if the engine
is still unbuilt, the honest design surfaces the knowledge and capabilities that
DO exist, and says plainly that the engine is not among them.

## Findings carried to the report (all measured, not inferred)

1. **"Dashboard observations" is a naming trap.** The Observation Engine is
   **operator telemetry**; § 7 forbids any user-facing read ("no observation is
   surfaced to a user"). The owner of "a true fact about your own data you did not
   ask for" is the **Notice Engine**. Building "observations" on the Observation
   Engine is a hard stop.
2. **THA's entire ambient intelligence is 3 opportunity types from 1 producer.**
   `OPPORTUNITY_SOURCES` (framework.ts:285-287) = `{ "food-intelligence" }` only.
   Types: `planner-empty-day`, `pantry-item-unused-in-plan`,
   `shopping-restriction-conflict` (opportunity-engine.ts:109-111). Two of three
   are absence-detectors. **Food Intelligence *is* THA's ambient layer.**
3. **Home fetches opportunities and renders none.** `use-food-opportunities`
   at `home-experience-page.tsx:337`, consumed only at `:481` for the door's
   `criticals`. No `<AmbientIntelligence>` mount — the only major room without one.
   **Quick win #1.**
4. 🔴 **`notice-gateway.ts` is BROKEN and unreachable.** It imports
   `noticeCelebration`, `noticeFoodDiscovery`, `noticeHouseholdInsight` from
   `notice-engine.ts` — **none of the three is exported**. It throws
   `SyntaxError` on import; no runtime module imports it; its tests are not in
   `npm test`. NTC-P2 half-landed.
5. 🔴 **HHP2's second producer is recorded "Complete" and is not enrolled.**
   Handler + read port + binding exist; registered **nowhere** (absent from
   `capability-registry.ts`, `intelligence/index.ts`, `OPPORTUNITY_SOURCES`). Its
   source-scan test asserts text that is not in the file, and never runs.
   Authored-but-unadopted — the exact failure `PX1`/UIA § 17 ended for *client*
   blocks, repeated on the *server*, where no adoption register exists.
6. **The publication register names `notice-gateway.ts` a canonical owner** and
   verifies it by **text grep** (`publication-register.ts:993,1018`) — a gate
   greping a module that cannot load. Same class as CONV1 P10's finding.
7. **Silence Rules cap = 2 notices per moment** (DEC1 § 6 budget doctrine).
   Adding surfaces multiplies the same three facts against one fixed budget.
   § 9: *"Improve the producers, not the volume."*

## Next action

Write `docs/investigations/intelligence/FI18_HOUSEHOLD_FOOD_INTELLIGENCE_EXPERIENCES.md`.
**Note the filing deviation:** the mission said `docs/investigations/<file>.md`, but
`REPOSITORY_CONVENTIONS.md` § 4 forbids a report at a tree root (enforced by
`repo-structure-verify.sh`) — filed under the `intelligence` workstream, which
satisfies "under `docs/investigations/`" and complies. Then commit doc + run file
only. **Touch no product source; touch no sibling session's uncommitted work.**
