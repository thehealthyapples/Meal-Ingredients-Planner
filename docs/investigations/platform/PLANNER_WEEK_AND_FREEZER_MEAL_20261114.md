# Planner week and freezer meal investigation — 2026-11-14

## Scope and governance
- Read-only investigation; no code or data changed.
- Repository `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`, branch `feat/integrated-dev`, HEAD `834c1d46cdf8c9108e05fed4e6044252b03a3a20`.
- Governing files read: root `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, `docs/ai-operating-model/README.md`. Task-specific source read: `server/intelligence/conversation/action-resolution.ts`, `client/src/components/conversation/FloatingAssistant.tsx`, `client/src/pages/weekly-planner-page.tsx`, `client/src/components/conversation/companion-action.ts`.
- Risk class: Amber topics investigated, but this task performed no behavior changes. Pre-existing dirty worktree preserved. No secrets accessed, no service/database writes, no commits/pushes.

## 1. Explicit week number
**Finding: current behavior is by design, but whether the owner wants a second week-specific prompt remains an experience decision.**

- `action-resolution.ts:276–325` resolves a named week number directly to a planner day. Its comments at lines 44–52 explicitly state that a week the household named (e.g. “Week 1”) is used as given; unresolved calendar phrasing asks which numbered planner week.
- `resolvePlannerAdd` calls `resolvePlannerDay` at line 776. Once `Week 1` resolves, it proceeds to form a proposal; no additional week clarification is asked.
- The proposal is still behind the separate Companion action confirm control. The action view in `companion-action.ts` derives an inline or dialog confirmation presentation from the proposal’s confirmation tier; the action label is rendered by `FloatingAssistant.tsx`.
- User’s reported phrase already names Week 1. Therefore no week-selection clarification is needed under current semantics. If the owner wants “Would you like this for Week 1?” before the action proposal, that is a new extra confirmation turn. If the issue is only that the intended week was hard to see, the smaller scope is to make the target week more prominent in the proposal label/details. I have not selected between those behaviors.

## 2. “The meal was from my freezer”
**Finding: the Planner has a freezer-status badge that could explain this wording, but whether these specific meals had that badge is not verified.**

- `weekly-planner-page.ts:2353`, `2662`, and `3338` calculate `isFrozen` by matching the planned meal ID to a freezer record with `remainingPortions > 0`.
- In the meal detail at lines 3386–3394, `isReadyMeal` renders a “Ready Meal” badge, while `isFrozen` separately renders “In Freezer.” This status badge means the planned meal also has remaining freezer portions; it does not prove Companion selected a freezer inventory record as the source of the meal.
- `FloatingAssistant.tsx:1285–1362` uses browser `SpeechRecognition` and forwards its final transcript through the normal `sendTurn` path at lines 2355–2358. The text is not tagged with a source marker in this client path, so source code alone cannot tell whether a particular utterance was typed or spoken, nor recover a mis-transcription.
- I could not verify current `meals` or freezer rows for meal IDs 1902 and 113. The Neon project lookup available to this session returned no projects, and I did not inspect `.env` or connect through another database route. The provided conversation/action summary is not a substitute for those current row values.
- No evidence in the accessible source indicates that planner `add` automatically consumes freezer portions; the visible UI distinction is a meal status badge. Database/action evidence is needed to determine whether the exact add proposal pointed at a freezer record or just a meal with freezer status.

## Unresolved owner question
When you say “the meal was from my freezer,” do you mean you saw the Planner’s **“In Freezer”** badge on the Spaghetti Bolognese card, or did Companion offer/select a distinct meal that you expected it to take from freezer stock? Also, for the week behavior, do you want an extra verbal question before Companion presents its existing confirm button, or would a more prominent “Week 1 · Thursday dinner” in the proposal be enough?

## Recommendation
Do not change code until the owner answers those two experience questions and the exact meal/freezer rows can be verified through the authorized dev database. The current explicit-week resolution is consistent with the documented design; the freezer wording can plausibly describe a badge, but this specific incident is unconfirmed.
## Owner clarification and follow-up requirement (received 2026-11-14)
The owner clarified the intended semantics: an utterance such as “add X to Wednesday dinner” should resolve to the next calendar Wednesday in the household Planner (their example: 18 November), not to whichever numbered week happens to be active. The freezer wording referred to seeing the Planner's “In Freezer” badge.

This changes the open question from “extra confirmation or clearer Week X label?” to a calendar-resolution requirement. Current `resolvePlannerDay` does not implement it: a weekday without a named week uses `ctx.activePlannerWeekId` (the viewed week), and its file-level calendar-boundary explanation says the Planner has no calendar mapping. The UI does have calendar week anchors (`planner_weeks.weekStartDate`) and presents date ranges; the action resolver appears not to consume them. The existing authoritative household-time architecture and source-of-truth register also describe `weekStartDate` as the planner calendar identity, while warning that old unanchored rows cannot be retroactively dated. This is a real implementation/architecture-consumer mismatch worth scoping as a separate follow-up. Any implementation should use the canonical household time zone/date rules and existing dated planner-week owner; it must not infer a date from a legacy unanchored week number.

Database-specific meal verification remains open: Neon project lookup returned no projects, so I could not confirm ingredients or `is_ready_meal` / `is_freezer_eligible` for IDs 1902 and 113. The owner's clarification resolves the UI wording independently: the badge was seen, rather than Companion selecting freezer stock.