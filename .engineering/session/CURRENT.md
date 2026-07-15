<!-- ESR:ACTIVE -->
<!--
  Engineering Session Recovery — ACTIVE-SESSION DASHBOARD
  Keep the marker above as "ESR:ACTIVE" while ANY session below is live.
  Change it to "ESR:IDLE" only when every session has moved to the archive
  (INDEX.md) and the table is empty. The Claude Code hooks read this marker.
-->

# Active Sessions — Recovery Dashboard

This is the first file to read when recovering an interrupted session.
Find the active session, open its run file, and continue from **Next action**.

| Session ID | Stage | Rollback ID | Next action | Run file |
|---|---|---|---|---|
| `DCA1_User_Visible_Data_Coverage_Audit` | Waiting for User | `rollback/DCA1-user-visible-data-coverage-audit-20260714` → `f9c23c97` | `SURF1A` (W1) delivered. Await direction on the remaining `SURF1` phases — W0 (household safety) is the highest. | [`runs/DCA1_User_Visible_Data_Coverage_Audit.md`](./runs/DCA1_User_Visible_Data_Coverage_Audit.md) |
| `SURF1A_Existing_Data_Surfacing` | Complete | `rollback/SURF1A-existing-data-surfacing-20260714` → `f9c23c97` | None — complete. Recommends DCA1 gap #1 (`dietRestrictions` never reach the Companion) next. | [`runs/SURF1A_Existing_Data_Surfacing.md`](./runs/SURF1A_Existing_Data_Surfacing.md) |
| `SURF1B3_Onboarding_Allergy_Safety_Routing` | Complete | `rollback/SURF1B3-onboarding-allergy-safety-routing-20260714` → `194f7af2` | None — complete. Recommends SURF1B2 limitation #1 next: the Vegan/Vegetarian **pattern** path still has meat-keyword holes the restriction path no longer has. | [`runs/SURF1B3_Onboarding_Allergy_Safety_Routing.md`](./runs/SURF1B3_Onboarding_Allergy_Safety_Routing.md) |
| `SURF1B5_Starter_Meal_Safety_Convergence` | Complete | `rollback/SURF1B5-starter-meal-safety-convergence-20260714` → `933dfabe` | None — complete. Its limitation #1 was closed by `SURF1C1` (below), which found the cookbook was never thin — only unlabelled. | [`runs/SURF1B5_Starter_Meal_Safety_Convergence.md`](./runs/SURF1B5_Starter_Meal_Safety_Convergence.md) |
| `SURF1C1_Starter_Cookbook_Diet_Classification` | Complete | `rollback/SURF1C1-starter-cookbook-diet-classification-20260714` → `e2fa1fbc` | None — complete. Its top gap, the **asparagus/`ragu` gate defect**, was fixed by `SURF1C2` (below). | [`runs/SURF1C1_Starter_Cookbook_Diet_Classification.md`](./runs/SURF1C1_Starter_Cookbook_Diet_Classification.md) |
| `SURF1C2_Canonical_Restriction_Matcher_Boundary_Safety` | Complete | `rollback/SURF1C2-canonical-restriction-matcher-boundary-safety-20260714` → `9e0b831d` | None — complete. Fixed the resolver so derived/hidden terms match only at a word boundary (`ragu` ⊄ `asparagus`); 0 matches added across the corpus, 8 fail-closed false positives removed, 52 asparagus recipes relabelled. Possible follow-up: a linter for short (<5 char) library terms. | [`runs/SURF1C2_Canonical_Restriction_Matcher_Boundary_Safety.md`](./runs/SURF1C2_Canonical_Restriction_Matcher_Boundary_Safety.md) |
| `ARRIVAL1_Arrival_Experience_Prototype` | Waiting for User | `rollback/ARRIVAL1-refine-welcome-header-sheen-20260715` → `3176c62d` (orig: `rollback/ARRIVAL1-arrival-experience-prototype-20260715`) | Delivered + **refined**. `/dev/arrival` — dev-only Arrival Experience (cream → deep-green "Welcome home" held then slowly faded → orchard emerges → canonical header parity → one sunrise sheen across the long logo → gentle glide into a one-viewport Home workspace). Live Home untouched. Screenshots + close-ups + recording in `docs/ui-audit/arrival-experience/`. Awaiting ADOPT / REJECT. | [`runs/ARRIVAL1_Arrival_Experience_Prototype.md`](./runs/ARRIVAL1_Arrival_Experience_Prototype.md) |
| `RM1_Canonical_Ready_Meal_Role` | Waiting for User | `rollback/RM1-canonical-ready-meal-role-20260715` → `0f0615aa` | Investigation delivered (`docs/investigations/platform/RM1_CANONICAL_READY_MEAL_ROLE.md`). Recommends: keep ready meals as `meals` identity (not a new Product entity), Analyser as read lens, Planner stores `mealId` (option c). Next workstream **RM2** (Analyser→Planner "Add to Planner" journey, no schema change); follow-on **RM3** retires dead `meal_template_products`. Nothing implemented/migrated. | [`runs/RM1_Canonical_Ready_Meal_Role.md`](./runs/RM1_Canonical_Ready_Meal_Role.md) |
| `RM2A_Analyser_To_Planner_Journey` | Complete | `rollback/RM2A-analyser-to-planner-journey-20260715` → `0f0615aa` | None — complete. Delivered the Analyser→Planner journey: idempotent resolve-or-create meal by barcode (`storage.resolveOrCreateProductMeal`) wired into both product routes, plus a direct "Add to Planner" action on the in-Planner Analyser reusing `AddToWeekModal`. No schema change, no new entity. 14/14 RM2A test; analyser/planner/meals/dedup regressions green. Next: **RM3** (retire `meal_template_products`, RM1 §8). | [`runs/RM2A_Analyser_To_Planner_Journey.md`](./runs/RM2A_Analyser_To_Planner_Journey.md) |
| `EXPLANG1_THA_Experience_Language` | Waiting for User | `rollback/EXPLANG1-tha-experience-language-20260715` → `0f0615aa` | Delivered governing **THA Experience Language** (`docs/architecture/THA_EXPERIENCE_LANGUAGE.md`) — how THA must *feel*: 7 target feelings, 13 Principles of Feeling, the 6-beat Experience Rhythm across every realm, Experience Review Questions, Experience Anti-Patterns. Indexed in `README.md` (Experience Governance). Docs only; no UI, nothing implemented; no conflicts (subordinate to Experience Arch, sibling to UI Arch, restates neither). Optional follow-up: wire § 6 questions into `ENGINEERING_WORKFLOW.md` compliance gate. | [`runs/EXPLANG1_THA_Experience_Language.md`](./runs/EXPLANG1_THA_Experience_Language.md) |

> Multiple rows may be active at once — simultaneous Claude Code sessions are
> supported. Each session owns exactly one run file named by its Session ID, so
> concurrent sessions never write to the same file, and writes to this dashboard
> are serialised with a lock.

When a session reaches **Complete**, move its row out of this table and add a
line to [INDEX.md](./INDEX.md) — `.engineering/scripts/session-complete.sh` does
both. If no active sessions remain, set the top marker to `ESR:IDLE`.

_Last automatic heartbeat (Stop hook): 2026-07-15T10:26:39Z UTC_
