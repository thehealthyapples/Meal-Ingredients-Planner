# ACTIVITY MONITOR APP CONSUMER READINESS

**Date:** 2026-08-26  
**Risk:** Investigation only — no application implementation authorised  
**Repository:** `C:\Users\Colin\The Healthy Apples\GitHub\tha-integrated-dev`  
**Branch:** `feat/integrated-dev`  
**HEAD:** `a007b37f7f62bd9cbb59c20edf8ced2c22144a56`

## Status

**Verified:** The working tree is intentionally dirty before this investigation. It includes modified application and governance files and many untracked assets and investigation records. In particular, `client/src/App.tsx` is modified and protected. This investigation changed no application source, route, credential, bridge file, or existing document.

## Architecture Compliance

**Verified:** `docs/architecture/README.md` is the governing entry point and requires a stop when a proposal conflicts with governing architecture. `PROJECT_GOVERNANCE.md` names `tha-integrated-dev` on `feat/integrated-dev` as the authorised application development worktree.

**Verified:** `server/lib/access.ts` is the sole application authorisation authority. `assertAdmin` requires an authenticated user with `role === "admin"`; it must remain the server-side gate for any future Activity Monitor API.

**Verified:** The existing Observation and Behaviour workbenches are read-only projections over canonical server-owned data. They explicitly render unknown values as `—`, rather than inventing a success value. This is the appropriate application-side consumer precedent.

**Inferred:** A future Activity Monitor should consume the bridge projection as an external owner’s data, not replicate its request, decision, execution, or lifecycle state in the application database. This follows the one-owner rule and the existing projection pattern.

**Assumed:** The bridge will publish a stable, authenticated, bounded response contract for `GET /v1/tha/activity`. That contract is not defined in this application repository and was deliberately not inspected in the bridge repository.

## Ownership and Precedents

| Concern | Owner / precedent | Claim |
|---|---|---|
| Server-side Activity Monitor integration | `server/routes.ts` is the current application HTTP/API assembly point; server-only external requests use `axios` directly in server routes and server libraries. No shared generic outbound HTTP client was found. | **Verified** |
| External activity lifecycle data | The future bridge Activity Projection, not the application database. | **Inferred** — bridge contract remains unresolved outside this task. |
| Admin authorisation | `server/lib/access.ts` → `assertAdmin`. | **Verified** |
| Client admin route/chrome | `client/src/App.tsx` and `client/src/components/admin-banner.tsx`. | **Verified** |
| Admin landing groups | `client/src/pages/admin-page.tsx`. | **Verified** |
| Read-only workbench UI | `client/src/pages/admin-observation-workbench-page.tsx` and `client/src/pages/admin-behaviour-workbench-page.tsx`. | **Verified** |
| Query defaults | `client/src/lib/queryClient.ts`. | **Verified** |

## Proposed Data Path

```text
Bridge Activity Projection
  → Application server
  → Admin API
  → Activity Monitor
```

- Bridge Activity Projection → Application server: **Inferred.** The bridge endpoint is external to the browser and its credential must remain server-only.
- Application server → Admin API: **Verified.** Existing application routes are server-side Express handlers and admin reads use `assertAdmin`.
- Admin API → Activity Monitor: **Verified.** Existing admin workbenches use authenticated same-origin requests through TanStack Query.

The likely compliant shape is therefore: a narrow server-only bridge client or route-local integration, called only by an `assertAdmin`-protected application API, then a client page that reads only that application API. The eventual bridge response must be adapted at this boundary only if adaptation is necessary to protect credentials, redact fields, or present a stable application view model; the application must not invent missing lifecycle facts.

## Security Model

- **Verified:** Server integrations read credentials from `process.env` in server code. Client code uses `import.meta.env` only for compile-time client configuration; putting a bridge token in a Vite-exposed client value would be unsafe.
- **Verified:** There is no existing THA bridge credential name or shared THA bridge client in this repository. No `.env` file or value was read.
- **Verified:** `assertAdmin` is the server-side gate. The client-side `useUser` checks on Admin pages are presentation gates only and do not replace it.
- **Verified:** The application uses `express-session`; its session cookie is `httpOnly`, `sameSite: "lax"`, and secure in production. The future read-only GET does not introduce a state-changing CSRF operation, but it must continue to rely on the existing authenticated same-origin session and `assertAdmin`.
- **Verified:** Client queries use `credentials: "include"` via `getQueryFn` and `apiRequest`. The browser therefore needs no bridge credential.
- **Verified:** Existing outbound requests set bounded timeouts locally, often with `axios`; errors are mapped by individual routes. There is no shared outbound-error sanitizer to extend.
- **Inferred:** A future Activity API should return one bounded, non-secret application error shape for unreachable, timed-out, unauthenticated, malformed, or non-success bridge responses. Raw upstream bodies, headers, and credentials must not be passed through.

## Contract-Independent Implementation Scope

The following can be decided from application architecture, but remains unimplemented pending a governed application decision:

- **EXISTING** `server/lib/access.ts` — reuse `assertAdmin`; no new authorisation mechanism.
- **EXISTING** `client/src/lib/queryClient.ts` — retain existing authenticated query semantics and global polling default of `false`.
- **EXISTING** `client/src/components/admin-banner.tsx` — extend only when the Activity Monitor route exists.
- **EXISTING** `client/src/App.tsx` — register a lazy, AdminBanner-wrapped, protected route only when the page is ready. This file is currently dirty/protected.
- **EXISTING** `client/src/components/ui/table.tsx`, `badge.tsx`, `skeleton.tsx`, and `load-error.tsx` — reuse rather than create duplicate table, status, loading, or error primitives.

## Contract-Dependent Implementation Scope

The following cannot be safely implemented until the bridge publishes the canonical contract:

- **NEW (likely)** `server/lib/tha-bridge-client.ts` — server-only URL/token configuration, timeout, authentication, bounded response parsing, and error classification. The exact configuration names, header scheme, response shape, and timeout must come from the bridge contract.
- **EXISTING** `server/routes.ts` — add one `assertAdmin`-protected application projection endpoint. Its path and response view model depend on the bridge schema and redaction rules.
- **NEW (likely)** `client/src/pages/admin-activity-monitor-page.tsx` — calm Admin page showing only canonical fields supplied by the application API.
- **EXISTING** `client/src/App.tsx` and `client/src/components/admin-banner.tsx` — route/chrome integration after the page path and product naming are approved.
- **EXISTING** `client/src/pages/admin-page.tsx` — add a Support Hub card only when route, label, and consumer contract are final.
- **NEW or EXISTING focused tests** — exact response fixtures require the canonical bridge schema and terminal-state vocabulary.

## Components to Reuse

- **Verified:** `Table`, table rows/cells, `Badge`, `Skeleton`, `Tabs`, `Collapsible`, and `LoadError` are existing reusable primitives.
- **Verified:** Observation Workbench demonstrates a bounded recent-work list, optional fields rendered honestly, filters, status/severity badges, timestamps, skeleton loading, and a clear unavailable-data state.
- **Verified:** Behaviour Workbench demonstrates a vertical event/timeline presentation and terminal/detail inspection patterns.
- **Inferred:** The Activity Monitor should compose those primitives and page-local mappings. The existing `SeverityBadge` in the Observation page is page-private; it should not be copied into a third status component. If the final bridge vocabulary genuinely requires a shared status renderer, that needs an explicit UI ownership/adoption decision.

## Polling

**Verified:** TanStack Query defaults in `client/src/lib/queryClient.ts` disable automatic polling. The sole current conditional polling precedent is in `client/src/pages/meal-detail-page.tsx`: `refetchInterval` is a function that returns an interval while a server-owned condition is incomplete and `false` once it is complete.

**Inferred:** The lowest-cost compliant pattern is a page-local `useQuery` with `refetchInterval` returning `false` by default and a short interval only while the canonical bridge payload declares a non-terminal active state. The page must not define terminal lifecycle values itself.

## Test Plan

| Proposed future test | What it proves |
|---|---|
| `server/tests/test-admin-activity-monitor-route.ts` | Exact Activity API route uses `assertAdmin`; non-admin and unauthenticated callers receive no bridge data. |
| `server/tests/test-tha-bridge-client.ts` | Server-only credentials are sent upstream but never returned; timeout/unreachable/malformed/upstream-error responses are bounded and sanitised; only the canonical schema is accepted. |
| `client/src/pages/admin-activity-monitor-page.test.tsx` (or the repository’s approved frontend test harness equivalent) | Loading, error, empty, stale/unreachable, normal list, and detail states are distinct; absent data is not rendered as success. |
| `client/src/pages/admin-activity-monitor-page.test.tsx` | Conditional polling is active only for canonical non-terminal data and stops when the canonical contract supplies a terminal state. |
| Existing Admin route/static-security convention, modelled on `server/tests/test-know2-human-evidence-publication.ts` | Route registration, `assertAdmin`, App route, and AdminBanner navigation stay aligned. |

## Duplication Risks

- **Verified:** `server/lib/access.ts` must remain the sole authorisation authority; a page-local role check is insufficient.
- **Inferred:** Persisting bridge lifecycle data in the application database, maintaining a second execution ledger, or calculating lifecycle status in the UI would duplicate a bridge-owned fact.
- **Inferred:** Copying the Observation Workbench’s private severity renderer would create another status vocabulary. Prefer existing primitives and a contract-derived page mapping.

## Open Questions / Blocked by Bridge Contract

1. **Assumed:** Exact schema, field ownership, pagination/bounds, ordering, timestamp semantics, redaction policy, and schema-version behaviour for `GET /v1/tha/activity`.
2. **Assumed:** Bridge authentication configuration and required server-only environment variable names.
3. **Assumed:** Canonical active, terminal, failed, stale, and unavailable values that control polling and presentation.
4. **Assumed:** The bridge’s upstream timeout/retry contract and the safe application-facing error mapping.
5. **Assumed:** Whether the Activity Projection contains a detail endpoint, or the one bounded list response contains sufficient detail for the Admin view.

## Suggestions

**Verified:** `AdminBanner` is the current shared Admin navigation owner, while `admin-page.tsx` owns grouped Support Hub cards. Add any future Activity Monitor to both only as part of its approved feature decision; do not repair unrelated Admin navigation in this work.

## Outcome

**CAN APP IMPLEMENTATION START NOW: NO**

**WHY:** The canonical bridge lifecycle/execution contract and the separate execution-ownership investigation are unresolved. Implementing a client, route response, polling stop condition, or Activity Monitor vocabulary before those owners publish their contract would invent and duplicate state.

**NEXT STEP ONCE CLAUDE FINISHES:** Produce the smallest bounded governed application implementation decision using the verified bridge contract.

## Trust Check

- **Highest-risk claim still Inferred or Assumed:** The exact server-only bridge client contract, including its authentication and terminal lifecycle values, is **Assumed** because it is owned outside this repository.
- **Evidence required to verify it:** The final bridge `GET /v1/tha/activity` contract: authenticated OpenAPI/schema or equivalent canonical record; response/error examples; field ownership/redaction; bounds; timeout/retry semantics; and the canonical terminal-state vocabulary.

