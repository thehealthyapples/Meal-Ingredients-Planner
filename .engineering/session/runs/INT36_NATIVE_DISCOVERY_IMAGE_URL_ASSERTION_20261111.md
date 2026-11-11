# INT36 Native Discovery Image URL Assertion — 2026-11-11

## Governance preflight

- Repository: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`; branch `feat/integrated-dev`; base HEAD `0c924c1ba931ac58f574ffc640e05559ebbc33b3`; initial worktree clean.
- Request: narrow the native discovery test's absolute-URL invariant to permit a canonical meal image only in `entities[].imageUrl`, while retaining detection everywhere else. Do not change production code; do not commit or push.
- Risk: Green, test-only assertion and regression coverage. Direct user request permits implementation: YES.
- Governing files read: root `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`, `docs/architecture/ARCHITECTURE_PRINCIPLES.md`, `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `docs/architecture/THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`, `docs/ai-operating-model/README.md`, `principles.md`, and `rollback-and-output.md`; source/test evidence: `server/intelligence/conversation/native-discovery.ts`, `server/tests/test-intelligence-native-discovery.ts`, `server/lib/media-storage.ts`.
- No authority conflict found. Rollback tag `rollback/INT36-native-discovery-image-url-test-20261111` resolves to base HEAD; it protects committed state only.

## Finding and edit

- Verified: `ThaDiscoveryCard` has one optional `imageUrl`, populated by `mealDiscoveryCard` only for `kind: "meal"` cards; generic cards carry no image URL. Absolute HTTPS media URLs are legitimate canonical meal photo locations.
- Changed only `server/tests/test-intelligence-native-discovery.ts`: the URL check now masks the string `imageUrl` on `entities[]` meal cards before applying the unchanged `https?://` regex to the complete response. A synthetic external URL in a meal title is asserted detectable. All other fields, including ids, titles, subtitles, summaries, actions, and references remain checked.
- Existing separate tests for `sourceUrl` absence and numeric THA references remain in place. Search found one blanket URL assertion in this suite; no other assertion was relaxed.

## Verification and boundaries

- `git diff --check` for the test file: pass.
- Normal sandbox run of `npm run test:intelligence-native-discovery`: incomplete, stopped at Gateway/Postgres `EACCES` before reaching the changed §5 assertion.
- Elevated rerun of the same suite: pass, **83 assertions / 0 failures**. The original 82 assertions pass, plus the new title-leak regression. The output explicitly includes nutrition image propagation, title-leak rejection, and all domain URL checks.
- No production code, schema, configuration, service, or deployment changed. The elevated test connected to the configured development Postgres through Gateway; no migration command was run and no database mutation was intentionally performed. No secret or connection string was printed.
- User acceptance: review the test diff; expected behavior is allowance only for a meal card's canonical image URL and rejection of URLs elsewhere. No live browser acceptance is needed for this test-only correction.
- No commit or push. Rollback: revert only the test-file diff; keep unrelated state.
