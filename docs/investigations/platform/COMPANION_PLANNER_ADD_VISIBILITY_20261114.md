# Companion planner add visibility investigation — 2026-11-14

## Scope and authority
- Task: read-only diagnosis of confirmed Companion planner adds not appearing across weeks.
- Repository: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`, branch `feat/integrated-dev`, HEAD `834c1d46cdf8c9108e05fed4e6044252b03a3a20`.
- Governing files checked: root `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, `docs/ai-operating-model/README.md`. No missing authority identified for this investigation.
- Risk: Amber behavior investigation. No code, database, live service, config, or git state changed. The worktree was already dirty; its state was preserved.

## Finding
**Most likely confirmed cause: the Companion client does not invalidate the Planner query after a successful action confirmation.**

- `client/src/components/conversation/FloatingAssistant.tsx:763` defines `CompanionActionBlock`; lines 773–785 post to `/api/intelligence/conversation/actions/:actionId/confirm` and parse the returned status.
- On `succeeded`, lines 805–809 update the local action card and invalidate only `/api/profile` and `/api/household/eaters`. There is no invalidation for planner actions.
- The Planner page loads its displayed weeks from the React Query key `['/api/planner/full']` at `client/src/pages/weekly-planner-page.tsx:547–548`. Its other planner mutations explicitly invalidate that key (for example lines 688, 880, and 997).
- Therefore, when the user confirms an add while the Planner is open, a successful persisted write can leave the visible Planner backed by cached pre-add data. This explains the reported “confirmed but not visible” behavior across week selections when the same all-weeks query remains cached.

## Server path and alternatives checked
- `server/routes.ts:13981` implements the confirm endpoint. It authenticates and verifies proposal ownership, sends the proposal intent through `intelligencePlatform.handle(..., { confirmed: true })`, then records `succeeded` only when the platform returns `ok`; other outcomes are returned as failed. The UI displays that returned status, so an ordinary backend failure should not be presented as success.
- The planner capability is registered independently at `server/intelligence/intelligence-platform.ts:282`; `server/intelligence/bindings/planner.ts` composes its existing read handler with its planner write handler. The recently changed meals binding is separate. No shared registry replacement or state coupling was found in the registration path.
- The semolina/all-purpose-flour notice uses `/api/intelligence/companion/notices` (`client/src/hooks/use-companion-notices.ts:70–79`, server route `server/routes.ts:13221`) and its own acknowledge/snooze mutations. It is a separate proactive-notice path, not the conversational planner action confirmation or planner cache path. It is unrelated to this symptom based on code ownership and endpoint flow.

## Evidence limits
- The owner supplied a prior script-level case that successfully inserted a `planner_entries` row; I did not independently query the database.
- This was read-only; I did not run the app, click Confirm, call the API, or inspect a live database. So the missing invalidation is a verified code defect that matches the symptom, but this report does not establish which specific owner-reported confirmation returned `succeeded` or whether that exact write persisted.
- No tests were run because the request was to investigate, not implement or verify a patch.

## Recommendation
When authorized to implement, invalidate `['/api/planner/full']` after a successful Companion action whose capability is `planner` (prefer awaiting the invalidation alongside the existing success handling). Keep the notice API unchanged. Then verify one add through the UI, including a week change, and check the confirmed response plus Planner refetch.