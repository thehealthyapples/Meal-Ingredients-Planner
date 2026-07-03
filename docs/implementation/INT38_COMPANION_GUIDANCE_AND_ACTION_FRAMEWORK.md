# INT38 — Companion Guidance & Action Framework

**Status:** 🟢 IMPLEMENTED
**Date:** 2026-07-02
**Branch:** int1-intelligence-platform
**EWO:** EWO-INT38 (🟡 AMBER)
**Builds on:** [`INT36_NATIVE_THA_DISCOVERY_RESPONSES.md`](./INT36_NATIVE_THA_DISCOVERY_RESPONSES.md) · [`INT37_COMPANION_CARD_EXPERIENCE_IMPLEMENTATION.md`](./INT37_COMPANION_CARD_EXPERIENCE_IMPLEMENTATION.md) · [`INT35C_GOVERNED_COMPANION_LEARNING_AND_DASHBOARD.md`](./INT35C_GOVERNED_COMPANION_LEARNING_AND_DASHBOARD.md)
**Governing architecture:** [`THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`](../architecture/THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md) Part 10 (Proactive Intelligence) · [`THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md`](../architecture/THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md) · [`THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`](../architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md)
**Tests:** `npm run test:intelligence-companion-guidance` (56 assertions) · included in the `npm test` chain

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| HEAD at start | `4a2da73` (branch `int1-intelligence-platform`) |
| Working tree | Intentionally dirty at start — prior uncommitted INT35/INT35B/INT35C/INT36/INT37 work already present on this branch, unrelated to this workstream and untouched by it except where noted below |
| This task's writes | See §7 Files changed |
| Rollback | Revert the files listed in §7 (all additive — two new tables, five new modules, one new script, one new test file, targeted extensions to seven existing files). No destructive schema change was made; dropping the two new tables (`companion_response_feedback`, `companion_guidance_events`) is optional and harmless since no other code references them. |

---

## 1. Objective

INT36/INT37 gave the Companion a canonical `Summary → Companion Cards → Next Steps`
shape, but two things were still missing:

1. **"Next Steps" only ever meant "View All" on the same domain** — there was no
   cross-domain nudge ("you just asked about nutrition — want to plan a week around
   it?"), and a plain Q&A turn with no Companion Cards got no next-step at all.
2. **No feedback loop.** The Companion had no way to learn — even advisorially —
   whether an answer or a suggestion was actually helpful, and no signal for whether a
   recommendation ever led anywhere.

INT38 closes both gaps as a **strict extension** of two things that already existed:
the Companion Card action vocabulary (INT36/INT37), and the advisory-only Companion
learning pattern (INT35B/INT35C). No new assistant, no new capability, no LLM call
added to the per-turn hot path, and no write path from feedback or guidance data back
into routing.

| Piece | Role |
|---|---|
| `companion-guidance.ts` (new, pure) | A static, deterministic "where to next" journey graph over the 7 Companion Card domains. Gates every suggestion through the live Capability Registry so a suggestion is only ever offered for a genuinely registered+executable capability. |
| `companion-feedback-store.ts` (new) | Sole owner of the two new tables — anonymous 👍/👎 feedback and guidance shown/clicked events. |
| `companion-guidance-analytics.ts` (new, pure) | Dashboard aggregations: helpfulness rate, feedback trend, top negative reasons, task-completion rate, successful journeys, poor-feedback recommendations, abandonment opportunities. |
| `conversation-gateway.ts` | Computes guidance on the successful path only; best-effort records "shown" events after the assistant turn is persisted. |
| `conversation-store.ts` | + `getTurnOwner()` — the ownership check the new feedback/guidance-click routes use. |
| `routes.ts` | `guidance` on `POST /turn`; new `POST /turns/:id/feedback` and `POST /turns/:id/guidance-click`; `GET /learning/dashboard` extended with `feedback`/`guidance` sections. |
| `companion-card.ts` / `FloatingAssistant.tsx` | Client-side resolution of guidance suggestions to in-app navigation targets, a "Where to next?" UI block, and 👍/👎 feedback controls. |
| `admin-companion-intelligence-page.tsx` | New dashboard cards for every INT38 metric. |

---

## 2. Guidance — cross-domain "Next Step" suggestions

### 2.1 Deterministic, not LLM-generated

`companion-guidance.ts` is a static table, exactly like `native-discovery.ts`'s
`DISCOVERY_DOMAINS`:

- `CAPABILITY_DOMAIN` maps every live capability id (base + `*-discovery`) to one of
  the 7 Companion Card domains (`meal, planner, shopping, pantry, diary, nutrition,
  household`).
- `JOURNEY_MAP` encodes the example journeys from the brief as edges — one row per
  edge, no new code path to add another:

  | From | To (in priority order) |
  |---|---|
  | nutrition | meal ("Find Matching Meals") → planner ("Plan This Week") |
  | meal | planner ("Plan Your Week") → shopping ("Build Shopping List") |
  | shopping | pantry ("Compare with Pantry") → planner ("Review Your Plan") |
  | planner | nutrition ("Check Nutrition Balance") → shopping ("Build Shopping List") |
  | pantry | meal ("Find Meals I Can Cook") → planner ("Plan With What I Have") |
  | diary | nutrition ("See Nutrition Insights") → planner ("Adjust This Week's Plan") |
  | household | planner ("Plan Around Preferences") |

- `buildGuidanceSuggestions(successDomains)` walks the graph from every domain that
  produced real grounding data this turn, filters each candidate through
  `intelligencePlatform.canExecute(capabilityId, verb)`, dedupes by target domain
  (never re-suggesting a domain already answered this turn), and caps at **2**
  suggestions per turn.

This is a deliberate architectural choice: guidance is **not** LLM-generated. It adds
zero latency/cost to the hot path, is fully deterministic and unit-tested (same
discipline as `PatternIntentResolver`), and can never invent a workflow the platform
doesn't actually support — if a target capability is ever unbound or gapped, its
guidance disappears automatically rather than pointing at a dead end (test §1).

### 2.2 Gateway wiring

`conversation-gateway.ts`'s `buildGroundedResponse` computes guidance only on the
**successful** path (`fallbackState === null`), from the domains whose queried
capability actually returned `"ok-data"` this turn. `TurnResult.guidance` is empty on
every unsuccessful turn (no-route / no-knowledge / no-results / internal-error) —
there is nothing to guide towards from a gap (test §2).

`ConversationGateway.processUserTurn` best-effort records a `"shown"` guidance event
per suggestion, after the assistant turn is persisted (so a real turn id exists),
wrapped in try/catch so an analytics write can never fail the turn — advisory data
collection must never be allowed to break the primary conversation. The constructor
gained an optional `feedbackStore` parameter (defaulting to the production singleton),
matching the existing `intentResolver`/`handleIntent` injection pattern.

### 2.3 Client rendering

`companion-card.ts` gained `buildGuidanceActions()`, resolving each suggestion's
`href` through the **existing** `domainLandingPath()` — the same function Companion
Card Next Steps already use — so guidance chips share the exact in-app-path-only
firewall the Companion Card principle requires. `FloatingAssistant.tsx`'s new
`GuidanceBlock` renders a "Where to next?" row **independently of whether the turn
also carries Companion Cards** (turn-level, not entity-scoped), so even a plain
nutrition Q&A with no cards can nudge the user forward. A click both navigates and
fires a best-effort `POST /turns/:id/guidance-click`.

---

## 3. Feedback (👍 / 👎) — advisory only, anonymous

### 3.1 Schema

Two new tables, same privacy class as the existing `companion_health_snapshots` /
`companion_learning_recommendations` (INT35C): **no user id, no household id, no
utterance, no capability result payload.**

```
companion_response_feedback (
  id, conversation_turn_id UNIQUE → conversation_turns(id) ON DELETE CASCADE,
  rating ("up"|"down"), reason_code (nullable, only set alongside "down"),
  note (nullable, length-capped at the route), created_at, updated_at
)

companion_guidance_events (
  id, conversation_turn_id → conversation_turns(id) ON DELETE CASCADE,
  event_kind ("shown"|"clicked"), source_domain, domain, created_at
)
```

The `UNIQUE` constraint on `companion_response_feedback.conversation_turn_id` makes
submission an **upsert-by-turn** — resubmitting a rating overwrites it (test §3).
The only linkage either table carries is `conversation_turn_id`, an opaque integer
pointer, cascade-deleted with the user's own conversation data — a privacy
*improvement* over a fully decoupled analytics table, since a user's erasure removes
their feedback/events too.

Tables were applied via `scripts/apply-companion-guidance-tables.ts` (idempotent
`CREATE TABLE IF NOT EXISTS` DDL), following the established precedent
(`scripts/apply-canonical-tables.ts`) for tables `drizzle-kit push`'s interactive
rename-vs-create prompt cannot apply non-interactively in this environment.

### 3.2 Store & ownership

`companion-feedback-store.ts` is the sole owner of both tables (`ICompanionFeedbackStore`
+ Database/InMemory pair, mirroring `companion-learning-store.ts` exactly).
`conversation-store.ts` gained one additive method, `getTurnOwner(turnId)`, resolving
the owning user id and role via a join (DB) / lookup chain (in-memory) — the check the
new routes use so a user can only submit feedback or a guidance-click against **their
own** turns. Nothing about the submitter is ever written to either new table; the
ownership check gates the write, it does not become part of the row.

### 3.3 Routes (session-authenticated, ownership-checked, no admin gate)

- `POST /api/intelligence/conversation/turns/:turnId/feedback` — `{ rating, reasonCode?,
  note? }`. 404 if the turn doesn't exist, 403 if it belongs to another user, 400 if
  the turn isn't an assistant turn or the reason code isn't in the closed set
  (`not_relevant`, `inaccurate`, `already_knew`, `too_generic`, `other`).
- `POST /api/intelligence/conversation/turns/:turnId/guidance-click` — `{ domain,
  sourceDomain }`. Same ownership check.

### 3.4 Client

`FeedbackControls` renders 👍/👎 under every real (server-persisted) assistant turn.
A 👎 reveals the closed set of reason chips; selecting one submits. Both paths are
fire-and-forget from the UI's perspective (no loading state) — a low-stakes,
optional interaction, exactly as specified.

---

## 4. Observability & Intelligence Dashboard extensions

`companion-guidance-analytics.ts` is pure (array in → plain object out), mirroring
`companion-gap-classifier.ts`'s discipline:

| Function | Metric | Honesty rule |
|---|---|---|
| `computeHelpfulness` | Response helpfulness rate | `null` when no feedback exists (never a fabricated 0%/100%) |
| `computeFeedbackTrend` | Day-bucketed 👍/👎 counts | Empty array when no feedback |
| `computeTopNegativeReasons` | Most common reasons for 👎 | Ranked, zero-count reasons never surfaced |
| `computeTaskCompletion` | Click-through rate on shown guidance | `null` when nothing has been shown |
| `computeSuccessfulJourneys` | (sourceDomain → domain) ranked by completions | Only pairs with ≥1 completion appear |
| `computePoorFeedbackRecommendations` | Guidance shown on turns later rated 👎 | In-memory join by `conversationTurnId`; `reliable: false` below a minimum sample size (3), shown not hidden |
| `computeAbandonmentOpportunities` | Shown often, rarely followed | Same minimum-sample-size discipline |

**"Task completion following a recommendation" is explicitly defined** as a
click-through on a shown guidance suggestion — this is a documented proxy, not a
silent assumption. Deeper cross-page completion tracking (did the user actually
finish adding the meal to the planner?) would require new business-data ownership
this workstream must not introduce, per the governing "no duplicate business logic"
principle.

`GET /api/intelligence/learning/dashboard` (admin-only, unchanged auth) gained two
additive top-level keys, `feedback` and `guidance`, computed from
`companionFeedbackStore.listFeedback()` / `listGuidanceEvents()` — one dashboard
fetch, no new endpoint. `admin-companion-intelligence-page.tsx` gained: Response
Helpfulness Rate and Task Completion Rate stat tiles, a Feedback Trend chart, and
Top Negative Reasons / Most Successful Journeys / Recommendations With Poor Feedback /
Abandonment Opportunities tables — every "low sample" row is labelled, never hidden.

---

## 5. Governance compliance

- **Deterministic routing preserved** — guidance selection is a static table lookup,
  never an LLM call; it cannot alter which capability handles an utterance.
- **Honest gaps preserved** — every rate is `null` below its denominator; every ranked
  list shows real counts with a `reliable` flag rather than hiding sparse data.
- **Permission-aware access preserved** — feedback/guidance-click routes are
  ownership-checked per turn; the dashboard extension inherits the existing
  `assertAdmin` gate unchanged.
- **Advisory-only, proven not just asserted** — test §8 runs
  `patternIntentResolver.resolve()` for a fixed utterance set, submits a batch of
  feedback and guidance events through the new store, re-runs the same resolutions,
  and asserts byte-identical output. There is no `applied` column and no import of
  the resolver's matcher arrays anywhere in this workstream's new files.
- **Prefer existing registered capabilities** — every guidance target is gated
  through `intelligencePlatform.canExecute()`; nothing is suggested that isn't a real,
  bound capability today.
- **Context-aware, not context-limited** — guidance is generated from whichever
  domains actually succeeded this turn, regardless of the current surface; a nutrition
  question answered while the user is on the Planner page still gets nutrition-sourced
  guidance, not planner-only suggestions.

---

## 6. Tests

`server/tests/test-intelligence-companion-guidance.ts` — 56 assertions, no live
database required (in-memory stores throughout), hand-rolled `assert`/`section`
harness matching the rest of the Intelligence test suite:

- §1 `buildGuidanceSuggestions` — journey resolution, dedup, cap-at-2, capability
  gating, no self-loops.
- §2 Gateway wiring — guidance attached only on success; "shown" events recorded
  against the real assistant turn id; nothing recorded on an unsuccessful turn.
- §3–§4 `companion-feedback-store` — upsert-by-turn semantics; guidance event
  recording/listing.
- §5–§6 `companion-guidance-analytics` — every honest-null / minimum-sample-size gate.
- §7 Privacy — serialized feedback/event rows carry no user/household/utterance/
  parameters keys.
- §8 Advisory-only regression — proven empirically (see §5 above).
- §9 `getTurnOwner()` — the new `conversation-store.ts` method.

Added to the `npm test` chain (`test:intelligence-companion-guidance`). Full chain
(23 suites) passes with zero regressions to INT35/INT35B/INT35C/INT36/INT37 behaviour.

---

## 7. Files changed

| File | Change |
|---|---|
| `shared/schema.ts` | + `companion_response_feedback`, `companion_guidance_events` tables/types |
| `scripts/apply-companion-guidance-tables.ts` | **new** — idempotent DDL (drizzle-kit push is interactive in this environment) |
| `server/intelligence/conversation/companion-guidance.ts` | **new** — deterministic journey graph + suggestion builder |
| `server/intelligence/conversation/companion-feedback-store.ts` | **new** — owns both new tables (DB + in-memory) |
| `server/intelligence/conversation/companion-guidance-analytics.ts` | **new** — pure dashboard aggregations |
| `server/intelligence/conversation/conversation-gateway.ts` | Guidance generation + "shown" event recording wired into `buildGroundedResponse`/`processUserTurn`; constructor gained optional `feedbackStore` |
| `server/intelligence/conversation/conversation-store.ts` | + `getTurnOwner()` on `IConversationStore` (both implementations) |
| `server/routes.ts` | `guidance` on `POST /turn`; new `POST /turns/:id/feedback`, `POST /turns/:id/guidance-click`; `GET /learning/dashboard` extended with `feedback`/`guidance` |
| `client/src/components/conversation/companion-card.ts` | + `buildGuidanceActions()`, `GuidanceSuggestion`, `CompanionGuidanceAction` |
| `client/src/components/conversation/FloatingAssistant.tsx` | + `GuidanceBlock`, `FeedbackControls`; extended `TurnApiResponse`/`TurnBubble` |
| `client/src/pages/admin-companion-intelligence-page.tsx` | + helpfulness/trend/reasons/completion/journeys/poor-feedback/abandonment cards |
| `server/tests/test-intelligence-companion-guidance.ts` | **new** — 56 assertions |
| `package.json` | + `test:intelligence-companion-guidance`, added to the `test` chain |
