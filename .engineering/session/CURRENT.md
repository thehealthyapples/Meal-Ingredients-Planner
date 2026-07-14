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
| `SURF1C1_Starter_Cookbook_Diet_Classification` | Complete | `rollback/SURF1C1-starter-cookbook-diet-classification-20260714` → `e2fa1fbc` | None — complete. Recommends the **asparagus/`ragu` gate defect** next: the canonical library matches hidden meat terms by forward substring, so `ragu` matches inside `aspARAGUs` and asparagus is refused to every vegetarian, vegan and meat-restricted household. Pinned by a test; needs a safety-gate regression budget. | [`runs/SURF1C1_Starter_Cookbook_Diet_Classification.md`](./runs/SURF1C1_Starter_Cookbook_Diet_Classification.md) |

> Multiple rows may be active at once — simultaneous Claude Code sessions are
> supported. Each session owns exactly one run file named by its Session ID, so
> concurrent sessions never write to the same file, and writes to this dashboard
> are serialised with a lock.

When a session reaches **Complete**, move its row out of this table and add a
line to [INDEX.md](./INDEX.md) — `.engineering/scripts/session-complete.sh` does
both. If no active sessions remain, set the top marker to `ESR:IDLE`.

_Last automatic heartbeat (Stop hook): 2026-07-14T22:24:39Z UTC_
