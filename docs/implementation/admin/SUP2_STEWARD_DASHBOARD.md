<!-- An implementation report records what was BUILT and proves it works. -->

# SUP2 — Steward Dashboard — Implementation Report

**Date:** 2026-07-17
**Branch:** `int1-intelligence-platform`
**Type:** Implementation — client landing-page surface. **No backend, no new API, no new calculation, no schema/route/migration.**
**Risk:** 🟢 GREEN (one client file; reads only existing, read-only, admin-guarded GETs; every tool, route, guard and behaviour unchanged)
**Author:** Colin Clapson (via Claude Code)
**Design priors:** [`ADMIN2_SUPPORT_HUB_EXPERIENCE.md`](../investigations/admin/ADMIN2_SUPPORT_HUB_EXPERIENCE.md) (Part 2 IA — *Orientation → State → Rooms*; the "operator's *how the house is doing* arrival" named as a future opportunity), [`ADMIN1_ADMIN_CONSOLE_ENGINEERING_HEALTH_AUDIT.md`](../investigations/admin/ADMIN1_ADMIN_CONSOLE_ENGINEERING_HEALTH_AUDIT.md) (the "Overview" stub as the dashboard's natural home; UNKNOWN≠green), [`SUP1_SUPPORT_HUB_FOUNDATION.md`](./SUP1_SUPPORT_HUB_FOUNDATION.md) (the landing this builds on).

---

## ROLLBACK INFORMATION

| Item | Value |
|------|-------|
| **Rollback tag** | `rollback/SUP2-steward-dashboard-20260717` → `7bfad50ca198f2b86f6501a4f82d8ae41af9260b` |
| Working tree | **Intentionally dirty** at session start — sibling sessions hold uncommitted changes. The tag covers **committed state only**; SUP2 touches exactly **one product file** (`client/src/pages/admin-page.tsx`), listed below. |
| Rollback | `git checkout rollback/SUP2-steward-dashboard-20260717 -- client/src/pages/admin-page.tsx` (restores the file to its SUP1 state). No schema, migration, route, endpoint, or data was changed, so nothing else needs reverting. |

---

## WHAT WAS BUILT

The Support Hub landing's **Overview** — which SUP1 left as an *intro + a strip of three static
"Engineering health" links* — is replaced by a true **Steward Dashboard**: the calm first look an
operator takes before deciding where to go. It answers the four questions the brief asks, in the
operator's own words, each with **a simple status and (when appropriate) one recommended action**:

| Question | What it answers | Where it reads from (existing GET) | The simple status shown |
|---|---|---|---|
| **How is THA today?** | Is the platform sound right now? | `GET /api/admin/canonical-publication-integrity` → `summary.{healthy,domains,needsAttention,publicationFailure}`, `generatedAt` | **Healthy** / **Mostly healthy** / **Needs attention** — the worst of the server's own per-domain classifications, with the healthy-domain count and when it was checked. |
| **What needs my attention?** | What's queued for me? | `GET /api/admin/knowledge-review/health` (`backlog.outstandingReviews`) · `GET /api/intelligence/learning/dashboard` (`recommendationCounts.pending`) · publication `summary.needsAttention + publicationFailure` | **Nothing needs your attention** — or a short, ranked list of the open queues, each a link to the tool that owns it. |
| **Can I safely release?** | Is it safe to ship? | `GET /api/intelligence/benchmark/runs` → latest run's `verdict` (PASS/PARTIAL/FAIL), `headlineScore`, `gatesFired`, `executedAt` | **Yes — the last run passed** / **Proceed with care** / **Not yet** — framed as the **last recorded run** with its score and timestamp. |
| **What has changed?** | What moved recently? | `GET /api/admin/knowledge-review/releases` (last publish) + latest benchmark run | **Recent activity** — the most recent knowledge release and benchmark run, each with a relative timestamp and a link. |

The dashboard sits between the arrival header and the five tool groups — **Orientation → State →
Rooms** (ADMIN2 Part 2.1) — so the Overview becomes *"the place an operator visits first before
deciding where to go next"* (the brief), and the five tool "rooms" from SUP1 are unchanged beneath it.

### The design rules it obeys (each carried, none invented)

- **Surface existing information only — no new calculation.** Every value shown is a field the server
  *already computes* and a tool page *already reads*: the per-domain `status` and the `summary` counts
  from publication verification; the benchmark `verdict`; the knowledge-review `backlog` counts; the
  learning `recommendationCounts`. The dashboard **classifies nothing new** — for "How is THA today?" it
  surfaces the *worst existing domain status*, it does not compute a composite health score. It reuses
  the *same query keys* the tool pages use, so TanStack Query **dedupes** and no request is duplicated.
- **No backend, no new API, no new endpoint.** Zero server files touched. The five GETs are the exact,
  read-only, `assertAdmin`-guarded endpoints the tool pages already own.
- **It never triggers work.** The dashboard reads benchmark *history from disk* (`/benchmark/runs`); it
  **never** calls `POST /benchmark/run`, `POST /benchmark-households/run-benchmark`, or
  `POST /learning/snapshot`. Visiting the Overview runs no benchmark and publishes nothing.
- **UNKNOWN ≠ green (Visual Trust, `THA_UI_ARCHITECTURE.md` §14).** A value that has not loaded reads
  **"Checking…"** (neutral, a calm spinner), a value that failed to load or does not exist reads
  **"Can't tell just now" / "No benchmark run yet"** (neutral, muted) — **never** a green "healthy".
  Colour is spent only on a status the server actually reports.
- **The release answer never poses as current.** "Can I safely release?" is explicitly the **last run**
  ("Last run scored … · N gates fired · 7 days ago") with its timestamp, so an operator is never misled
  into reading a week-old verdict as a fresh evaluation.
- **Calm before capability; one primary action.** Each card leads with the plain question, then a
  one-line honest status, then the supporting detail, then — only when there is something to do — one
  quiet action link. A **healthy** card shows **no action** (nothing to chase); the room stays calm.

---

## SCREENSHOTS

Captured against the live dev server (`localhost:5000`) using the Replit-provided Chromium, via a
**disposable admin created AND deleted within the same run** (verified: **0** leftover `sup2-shot-admin`
rows by direct query). The throwaway capture harness was **removed after use** (SUP1 discipline). The
data shown is **real platform state** at capture time, not mocked — which is why the cards honestly read
"Needs attention", "Proceed with care", etc. against the current dirty working tree.

### The four cards (desktop crop)

![Steward Dashboard — the four cards](./assets/SUP2/steward-dashboard-cards.png)

### Desktop (1280) — dashboard in place: Orientation → State → Rooms

![Steward Dashboard — desktop](./assets/SUP2/steward-dashboard-desktop.png)

### Mobile (390) — responsive single-column stacking

![Steward Dashboard — mobile](./assets/SUP2/steward-dashboard-mobile.png)

---

## FILES CHANGED

**One product file. No backend, schema, migration, route, endpoint, or API.**

| File | Change |
|---|---|
| `client/src/pages/admin-page.tsx` | Added a `StewardDashboard` component (five existing read-only `useQuery` calls; a small status-tone vocabulary honouring UNKNOWN≠green; a `QuestionCard` presenter and a `LinkList`; a `relativeTime` helper) and mounted it between the header and the tool groups. **Removed** the SUP1 static "Engineering health" link strip (`HEALTH_LINKS` + its section) — the dashboard supersedes it. Everything else — `TOOLS`, `GROUPS`, `ToolCard`, `GroupSection`, the admin role guard, and `data-testid="admin-page"` — is **unchanged**. |

**Documentation / assets (non-product):**
- `docs/implementation/SUP2_STEWARD_DASHBOARD.md` (this report)
- `docs/implementation/assets/SUP2/steward-dashboard-{cards,desktop,mobile}.png`
- `.engineering/session/runs/SUP2_Steward_Dashboard.md`, `.engineering/session/CURRENT.md` (row)

---

## VERIFICATION

- **Typecheck:** `tsc --noEmit` reports **zero errors in `admin-page.tsx`** and **zero in any client
  file**. The baseline gate's 275 errors are **all pre-existing `server/` sibling debt** in the dirty
  tree (intelligence handlers, tests, verification) — SUP2's delta is **0 new type errors**.
- **Build:** `vite build` exits **0** with the change applied (3286 modules transformed, 17.5s).
- **Runtime (proved end-to-end, not just compiled):** under a real authenticated admin session at both
  viewports, the page renders `data-testid="steward-dashboard"` with all four cards, live real data, and
  **0 console errors**. The captured state:
  - *How is THA today?* → **Needs attention** · "7 of 23 canonical domains healthy. Checked just now." · action *Open Publication Integrity*.
  - *What needs my attention?* → **2 things need your attention** · "24 knowledge terms awaiting review" · "16 canonical domains to review" (each a link).
  - *Can I safely release?* → **Proceed with care** · "Last run scored 76.4/100 · 0 gates fired · 7 days ago" · action *Review in Intelligence*.
  - *What has changed?* → **Recent activity** · "Benchmark partial · scored 76.4 · 7 days ago" (link).
- **No behaviour changed:** the admin role guard (`role !== "admin"` → `<NotFound/>`) is byte-identical;
  every tool card still links to its original route; no mutation, benchmark run, or publish is triggered
  from the Overview; the five queries reuse the tool pages' query keys (deduped, `staleTime: Infinity`).
- **No new component/token/button:** the dashboard uses the canonical `ui/card` and `wouter` `Link`
  owners and existing lucide icons; **0** raw `<button>`/`<Button>` added (all actions are `Link`ed
  `<span>`s), so no adoption-register entry is required (`THA_UI_ARCHITECTURE.md` §17).
- **No data left behind:** the disposable screenshot admin was deleted in the same run; **0** leftover
  rows confirmed by direct query.

---

## ARCHITECTURE COMPLIANCE

- **`THA_EXPERIENCE_ARCHITECTURE.md` §9 / ADMIN2 Part 2.1** — the page now follows the canonical
  information hierarchy **Orientation → State → Rooms**: the header greets, the Steward Dashboard is the
  *State* beat ("here is how the house is doing"), the tool groups are the *Rooms*. This is the
  operator's arrival ADMIN2 named as a future opportunity, now built.
- **`THA_UI_ARCHITECTURE.md` §12 / §14** — every state is designed (loading = "Checking…", empty = "All
  clear", failure/unrun = "Can't tell just now" / "No benchmark run yet"); **status never poses as
  current** (the release card is explicitly the *last* run with its timestamp); **UNKNOWN is never shown
  as green**; colour is spent only on a status the server reports.
- **`THA_EXPERIENCE_LANGUAGE.md` §453 / §3A** — the study "off the hall" stays *calm, honest, never a
  second product*: plain questions in the one voice, a healthy card carries no action, the four feelings
  (calm/thoughtful/decisive/trustworthy) apply — its warmth is that it tells the operator the truth.
- **`THA_OBSERVATION_ENGINE_ARCHITECTURE.md` §7 / `THA_UI_ARCHITECTURE.md` §80** — **no second owner and
  no duplication**: the dashboard *reads and links to* the existing signal owners; it re-computes and
  re-records nothing, and adds no new telemetry store or endpoint.

No conflict found.

---

## AN HONEST NOTE — "surface existing information" vs SUP1's links-only stance

SUP1 deliberately used *links only*, on the honest ground that THA has **no wired operations/health
endpoint** (`buildOperationsStatus()` has zero callers; there is no `/api/health`). SUP2 does not
contradict that — it does not wire a health endpoint or invent a platform-health number. It surfaces the
**status the platform's tools already compute and already return on read**: publication verification's
per-domain `status`, the benchmark `verdict`, the review `backlog` counts, the learning
`recommendationCounts`. That is "surface existing information only" taken literally — reading fields that
exist, presenting the server's own words, adding no computation and no endpoint. A single genuinely-new
health readout (a cached `/api/health` surfacing `buildOperationsStatus()`) remains the backend
follow-on ADMIN1 QW-1/QW-2 named, and is still out of scope here.

**One cost worth flagging:** `/api/admin/canonical-publication-integrity` *runs the full verification
pass on every call* (it is read-only but not a trivial lookup) — the same call the Publication Integrity
tool already makes on mount. The dashboard therefore triggers one verification pass per Overview visit
(admin-only, infrequent, deduped within a visit). A cached/cheap health read is a natural follow-on (see
below) but is a backend change SUP2 was scoped to exclude.

---

## FOLLOW-ON RECOMMENDATIONS

Each is a separate, decision-gated change — **none is implemented here.**

1. **A cheap cached health read for "How is THA today?"** — so the Overview does not run a full
   publication verification pass on every visit. This is the backend readout ADMIN1 QW-1/QW-2 named
   (a cached `/api/health` over `buildOperationsStatus()` + a cached integrity snapshot); it would also
   let the card show live runtime liveness, not just canonical integrity.
2. **Rename the banner "Overview" nav link** to match the room (e.g. "Dashboard") — the persistent
   `admin-banner` still labels this page "Overview"; it points at `/admin`, which is now the Steward
   Dashboard. This is part of ADMIN1 QW-4 (*one nav owner*): drive the banner and the landing from one
   config so the label follows the room. Left untouched here (nav is out of SUP2's scope).
3. **A calm operator activity log** (ADMIN2 "Future opportunities") — "What has changed?" currently shows
   the last release and last benchmark; a fuller, honest history of *what was run, by whom, and how it
   resolved* would deepen the answer without becoming telemetry.
4. **Adopt the Operation Card pattern** (ADMIN2 Part 6 / QW-1/QW-2) — the deeper ADMIN2 work: give every
   operator *action* one canonical pattern with guidance + lifecycle + honest feedback, and gate the two
   silent canonical-knowledge mutations (Publish/Rollback). SUP1 laid the calm landing; SUP2 gave it a
   dashboard; this fixes the silent high-consequence *operations*.

---

## SCOPE LOCK

- **Implemented:** the Steward Dashboard on the Support Hub Overview (one client file) + this report and
  its assets.
- **Explicitly excluded:** all backend, API, schema, migration, route, and endpoint changes; any new
  health calculation or composite score; any change to a tool's own page or behaviour; any triggering of
  benchmarks, publishes, or snapshots; any nav/banner change.
- **Suggestions (do not implement without approval):** the four follow-on recommendations above.
