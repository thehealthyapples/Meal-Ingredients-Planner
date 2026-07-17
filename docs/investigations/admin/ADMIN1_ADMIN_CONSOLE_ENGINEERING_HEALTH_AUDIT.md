<!-- An investigation ANALYSES and RECOMMENDS. It changes nothing. -->

# ADMIN1 — Admin Console & Engineering Health Audit — Investigation

**Date:** 2026-07-17
**Branch:** `int1-intelligence-platform`
**Type:** Investigation only. No code, schema, route, or capability change.
**Risk:** 🟢 GREEN (read-only investigation)
**Author:** Colin Clapson (via Claude Code)

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/ADMIN1-admin-console-engineering-health-audit-20260717` → `10573dd20baa9497975c4ed05837b75162305410` |
| Working tree | **Intentionally dirty** — sibling sessions (NORTH3/4/5, FI18, P0, CONV1 P10) hold uncommitted changes at session start. The tag covers **committed state only**; ADMIN1 authors documents only and touches **no product source** (the `git status` modified-list is byte-identical to session start). |
| This task's writes | `docs/investigations/admin/ADMIN1_ADMIN_CONSOLE_ENGINEERING_HEALTH_AUDIT.md`, `.engineering/session/runs/ADMIN1_Admin_Console_Engineering_Health_Audit.md`, `.engineering/session/CURRENT.md` (row) |
| Rollback | `git checkout HEAD -- docs/investigations/admin/ADMIN1_ADMIN_CONSOLE_ENGINEERING_HEALTH_AUDIT.md` (or delete the file). No code was changed. |

> **Filing-location note (governance over the brief's literal path).** The brief named
> `docs/investigations/ADMIN1_ADMIN_CONSOLE_ENGINEERING_HEALTH_AUDIT.md` — a folder root.
> `REPOSITORY_CONVENTIONS.md` §4 and `ENGINEERING_WORKFLOW.md` STEP 5 forbid writing a report
> to a tree root (the only file permitted there is the index `README.md`), and
> `.engineering/scripts/repo-structure-verify.sh` fails it. The brief also says *"Follow the
> governing architecture."* Those two instructions conflict, and governance wins: this report is
> filed under the `admin` workstream — `docs/investigations/admin/…` — the folder the same
> conventions already reserve for *"Admin domain shell, navigation, admin regressions."*

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md`, `REPOSITORY_CONVENTIONS.md` §4
- [x] `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`, `ENGINEERING_SESSION_RECOVERY_PROTOCOL.md`
- [x] `docs/architecture/PLATFORM_QUALITY_ARCHITECTURE.md` (the governing owner of engineering health)
- [x] `docs/architecture/THA_OBSERVATION_ENGINE_ARCHITECTURE.md` (the one operator-telemetry system)
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` §Domain 32 (Platform Observations), §Domain 33 (Benchmark World)
- [x] `docs/architecture/THA_MASTER_EVOLUTION_ROADMAP.md` §8 (Production Readiness), §10 (Post-launch)
- [x] Product source: 13 `client/src/pages/admin-*-page.tsx`, `App.tsx`, `admin-banner.tsx`, `server/routes.ts`, `server/lib/platform-status.ts`, `server/lib/access.ts`, `server/migrations/runner.ts`, `server/verification/publication-register.ts`, `server/intelligence/observation/*`, `.github/workflows/ci.yml`, `package.json`

---

## QUESTION

**What is the Admin Console today, what should it become, and what engineering-health signals and
alerts should it surface — without duplicating monitoring or creating a second owner of any signal?**

---

## METHOD

Three read-only exploration passes (client admin surface, server admin surface, platform
health-signal processes), each returning file:line evidence, reconciled against the governing
architecture. Numeric claims verified directly: admin page/route inventory from `App.tsx:386–398`;
guard usage by `grep -c assertAdmin`; publication-register domain count by counting `canonicalOwner:`
entries (**23**, not the 26 one pass estimated); `buildOperationsStatus` caller count by repo-wide
grep (**zero**); the CI gate set from `.github/workflows/ci.yml`; the `release:check` chain from
`package.json:88`. Where two passes disagreed, the file was re-read and the report states the checked
number. Distinctions between **observed**, **inferred**, and **unknown** are kept explicit in FINDINGS.

---

## EXECUTIVE SUMMARY

The Admin Console is **13 pages behind one role guard, and it is healthier than its reputation** —
there is **no orphaned admin page, no obsolete page, and no true duplicate page.** What it has instead
is **drift at the edges and one systemic blindness**:

1. **🔴 THE HEADLINE — THA can see its *Intelligence* runtime in exquisite detail and is *blind to its
   own production and engineering health.*** The Intelligence Platform has **two full telemetry
   workbenches** over a durable store (`platform_observations`), a benchmark score, a publication-integrity
   page, and a learning dashboard. Meanwhile the function that computes the platform's **operational
   health** — service uptime, memory, database reachability, outbound-dependency circuit state, and
   environment configuration — `buildOperationsStatus()` (`server/lib/platform-status.ts:180`) — **has
   zero callers.** No `/api/admin/platform/operations` route exists; no page renders it. Yet the
   governing `PLATFORM_QUALITY_ARCHITECTURE.md` records this exact gap as *"substantially closed
   (EWO-PRO1) … surfaced at `/api/admin/platform/operations`"* (§2, §11). **It is written, and it is
   called by nothing.** This is the same *authored-but-never-adopted* failure class P0 found in the
   dead `npm test` chain and FI18 found in the unmounted recommender — a fully-built capability that
   the platform's own documentation records as live.

2. **🔴 There is NO `/health` or readiness endpoint anywhere in the server.** External liveness/readiness
   monitoring of production is **impossible today** — the only liveness signal is the process holding
   port 5000. Every CI quality gate (the 141-suite `test` chain, typecheck, adoption, coherence, schema
   coverage, build) is **ephemeral CI stdout with no operator surface** — the precise condition under
   which P0's test chain rotted silently for two days.

3. **🟠 Duplicated monitoring is real, and the brief's "no duplicated monitoring" rule already has two
   violations to resolve.** *Companion health* is computed **three times from two disagreeing stores**
   (durable `platform_observations` vs a volatile in-memory ring buffer); *benchmark / intent-quality*
   is rendered on **three admin pages from one engine**. One authoritative owner must be named for each
   before any dashboard reads them.

4. **🟠 The Admin information architecture has two rival declarations that disagree.** The hub cards
   (`admin-page.tsx`, 12 cards) and the banner nav (`admin-banner.tsx`, 9 links) are **independent
   hand-maintained lists**; the banner silently omits Development World, Knowledge Review, and Canonical
   Publication Integrity. One nav is not a complete nav. This is *one-owner-per-fact* (Principle 2)
   applied to navigation, and it is violated.

5. **🟠 Admin authorisation is enforced three ways for one decision.** The canonical guard `assertAdmin`
   (`server/lib/access.ts:21`) protects 76 routes; nine `/api/admin/*` routes re-implement the check
   inline, and `ProtectedRoute` (`App.tsx:179`) **never checks role at all** — every admin page carries
   its own client guard, and they disagree (`<NotFound/>` vs a blank `null` vs server-only 403; one page,
   `admin-recipe-sources`, has **no client guard**). Nothing is *unguarded*, but the decision lives in
   three copies of the place `PLATFORM_QUALITY_ARCHITECTURE.md` §2 says it should live once.

**The good news is that the fix is mostly *surfacing*, not building.** Most health signals already have
a source of truth; the missing dashboard is largely a **read/link surface plus wiring the operations
function that already exists** into the hub's permanently-stubbed **"Overview"** card
(`admin-page.tsx:14–21`). The governance is already written: the Engineering Health Dashboard and Alert
Framework are the **Operations layer of the Platform Quality Architecture** (§1 Quality Spine, §8
Operational Excellence) and the closing of its §2 Observability "**alerting remains open**" — *not* a new
quality owner, and *not* a second telemetry engine (which `THA_OBSERVATION_ENGINE_ARCHITECTURE.md` §7
forbids outright).

---

## PART 1 — ADMIN CONSOLE INVENTORY

### 1.1 The 13 pages (all routed, all role-gated, none orphaned)

Routes: `client/src/App.tsx:386–398`. Lazy imports: `:37–49`. Hub cards: `admin-page.tsx:13–110`.

| # | Page (`client/src/pages/…`) | Route | Lines | Domain | Purpose | Backing API |
|---|---|---|---|---|---|---|
| 1 | `admin-page.tsx` | `/admin` | 204 | Hub | Landing grid of admin cards | none (nav) |
| 2 | `admin-users-page.tsx` | `/admin/users` | 572 | Access & Users | Accounts, roles, subscriptions, onboarding/fix tools, site banner | `/api/admin/users/*`, `/api/admin/site-settings/banner` |
| 3 | `admin-ingredient-products-page.tsx` | `/admin/ingredient-products` | 529 | Content & Knowledge | Curate "Picks" ingredient products | `/api/admin/ingredient-products` (inline guard) |
| 4 | `admin-recipe-sources-page.tsx` | `/admin/recipe-sources` | 334 | Content & Knowledge | Enable/disable recipe sources, audit logs | `/api/admin/recipe-sources`, `/recipe-audit-logs` |
| 5 | `admin-companion-intelligence-page.tsx` | `/admin/companion-intelligence` | 1130 | Intelligence | Review **learning** recommendation queue; learning dashboard; fallback distribution | `/api/intelligence/learning/*` |
| 6 | `admin-intelligence-page.tsx` | `/admin/intelligence` | 1062 | Intelligence | Run/inspect **benchmark**; Intelligence Score; release-safety gating; Companion Health | `/api/intelligence/benchmark/*` |
| 7 | `admin-benchmark-households-page.tsx` | `/admin/benchmark-households` | 505 | Testing / DEV | Seed/reset/impersonate synthetic benchmark households | `/api/admin/benchmark-households/*` |
| 8 | `admin-development-world-page.tsx` | `/admin/development-world` | 314 | Testing / DEV | Read-only list of 50 Development World households (DEV) | `/api/admin/development-world` |
| 9 | `admin-development-world-household-page.tsx` | `/admin/development-world/:id` | 346 | Testing / DEV | Read-only detail (drill-down of #8) | `/api/admin/development-world/:id` |
| 10 | `admin-observation-workbench-page.tsx` | `/admin/observations` | 1209 | Intelligence | Fleet-wide runtime telemetry (9 tabs) | `/api/intelligence/observation/*` |
| 11 | `admin-behaviour-workbench-page.tsx` | `/admin/behaviour` | 1195 | Intelligence | Per-session execution timeline; which voice fired & why | `/api/intelligence/observation/timeline/*`, `/behaviour` |
| 12 | `admin-knowledge-review-page.tsx` | `/admin/knowledge-review` | 1491 | Content & Knowledge | Review/approve unresolved knowledge terms; publish/rollback releases | `/api/admin/knowledge-review/*` |
| 13 | `admin-canonical-publication-integrity-page.tsx` | `/admin/canonical-publication-integrity` | 302 | Platform (Data health) | Verify 23 canonical domains vs declared owners | `/api/admin/canonical-publication-integrity` |

### 1.2 Server admin surface (~85 endpoints)

- **Canonical guard:** `assertAdmin` (`server/lib/access.ts:21`, over `isAdmin` at `:6`) — Express middleware, 403 unless authenticated **and** `role === "admin"`. Applied to **76** route registrations in `server/routes.ts`.
- **Endpoint groups:** Users & site (7), Plan templates (7), Meal templates (2), Meals import/export (3), Meal pairings (2), Ingredient products (4), Recipe sources (3), Knowledge review (17), Publication integrity (1), Benchmark households / impersonation (8), Development world (2), Intelligence benchmark (5), Ingredient classifications & backfills (7), Observation workbench (14), Companion observability (2), Companion learning (5).

### 1.3 Navigation & entry points

- Hub reached from `nav-bar.tsx:293/396` and `workspace-header.tsx:126`, each behind an `isAdmin` conditional.
- `withAdminBanner` HOC (`App.tsx:274`) wraps every admin route **except** `/admin/knowledge-review` (`:397`, routed unwrapped) — the one admin page with **no persistent cross-nav**.

---

## PART 2 — DUPLICATE, OBSOLETE & OWNERSHIP ANALYSIS

### 2.1 Duplicate / obsolete **pages** — NONE

Every one of the 13 files is routed; the only non-hub page (#9) is an intended `:id` drill-down. No page duplicates another's function. The four Intelligence pages **look** overlapping but split cleanly across two backend namespaces and four distinct concerns:

| Page | Namespace | Concern | Unique |
|---|---|---|---|
| Companion Intelligence (#5) | `/intelligence/learning/*` | Learning **approval queue** | the only *action* intelligence page |
| Intelligence Dashboard (#6) | `/intelligence/benchmark/*` | Benchmark **score & release gate** | Intelligence Score over time |
| Observation Workbench (#10) | `/intelligence/observation/*` | **Aggregate** runtime telemetry | 9-tab fleet view |
| Behaviour Workbench (#11) | `/intelligence/observation/timeline/*` | **Single-interaction** timeline | which voice fired, why |

**Verdict:** keep all four; the defect is *naming*, not duplication (see 2.4).

### 2.2 Duplicated **monitoring** — TWO real violations (the brief's core concern)

| Signal | Computed in | From | Problem |
|---|---|---|---|
| **Companion health** | (a) `/observation/companion` · (b) `/observability/companion` · (c) `/learning/dashboard` | (a) durable DB `platform_observations`; (b)+(c) the **same** in-memory ring buffer (`companion-observability.ts:127`) | **Two stores can disagree**: the Observation Workbench and the Companion Intelligence page report the same "companion health" from different data. (b) is an **orphan** (no client); (c) supersedes it. |
| **Benchmark / intent quality** | (1) `/observation/benchmarks` · (2) `/intelligence/benchmark/*` · (3) `/admin/benchmark-households/run-benchmark` | (2)+(3) execute the **same engine** `server/tests/benchmark/`; (1) reports its DB shadow | **Three admin pages render benchmark scores from one engine** — no single authoritative "latest score". |

**These must be resolved before a dashboard reads them**, or the dashboard inherits the disagreement (see Alert Framework §5, and Quick Win QW-3).

### 2.3 Orphan **server** surface (registered, guarded, no client)

- `GET/POST /api/intelligence/observability/companion` + `/suggest-matchers` (`routes.ts:12703,12716`) — **superseded** by the learning dashboard; dead surface. *(Retire.)*
- `GET/PATCH/POST /api/admin/ingredient-classifications` + approve/reject (`routes.ts:10938–10999`) — no UI.
- `POST /api/admin/backfill-classifications`, `/normalise-categories`, `/backfill-ambiguous-categories` (`routes.ts:11019–11050`) — CLI/manual maintenance ops, no UI (acceptable, but undocumented).
- `GET /api/admin/meals/export` (`routes.ts:7562`) — no client reference.

### 2.4 Incorrect ownership / drift

| Issue | Evidence | Class |
|---|---|---|
| **Two rival admin-nav declarations** | hub `ADMIN_SECTIONS` (`admin-page.tsx`, 12) vs banner `ADMIN_NAV` (`admin-banner.tsx`, 9, omits Dev World / Knowledge Review / CPI) | one-owner-per-fact (Principle 2) violated for navigation |
| **Three admin-auth enforcement styles** | `assertAdmin` (76×) vs inline `role === "admin"` (9 routes: `routes.ts:7102,7562,7601,8020,8054,8075,8087,8120,8151`) vs `ProtectedRoute` doing **no** role check (`App.tsx:179`) | `PLATFORM_QUALITY_ARCHITECTURE.md` §2: security enforced once, in `access.ts` |
| **Inconsistent client non-admin fallback** | `<NotFound/>` (4 pages) vs bare `null` blank screen (8) vs server-only 403 (`admin-recipe-sources`, no client guard) | UX consistency; no security hole (server `assertAdmin` holds) |
| **Naming collisions** | "Companion Intelligence" (learning) vs "Intelligence Dashboard" (benchmark); "benchmark" = two subsystems | operator confusion |
| **"Overview" card is a permanent stub** | `admin-page.tsx:14–21` (`status:"coming-soon"`, `href:null`) | the natural home for the Engineering Health Dashboard sits empty |

---

## PART 3 — RECOMMENDED CANONICAL ADMIN INFORMATION ARCHITECTURE

Group the 13 surfaces under **five domains**, and make the domain map the **single source of the nav**
(one config consumed by both the hub and the banner — retiring the second declaration).

```
ADMIN CONSOLE
├── Platform  ← engineering & operational health (mostly NEW surfacing, little new code)
│   ├── Overview / Engineering Health   (fills the dead "Overview" stub — Part 4)
│   ├── Operations                       (surface the already-written buildOperationsStatus)
│   └── Publication Integrity            (existing #13 — data health)
├── Intelligence
│   ├── Benchmark & Release   (rename #6 "Intelligence Dashboard")
│   ├── Learning Queue        (rename #5 "Companion Intelligence")
│   ├── Observations          (#10, aggregate telemetry)
│   └── Behaviour & Timeline  (#11, per-session)
├── Content & Knowledge
│   ├── Picks (#3) · Recipe Sources (#4) · Knowledge Review (#12)
├── Access & Users
│   └── Users (#2)
└── Testing / Development  (DEV-only)
    ├── Benchmark Households (#7) · Development World (#8/#9)
```

**Three IA rules to adopt (each a governed, later change — not this investigation):**

1. **One nav owner.** A single `ADMIN_SECTIONS` config (domain → sections) consumed by *both* the hub
   and the banner. Kills the hub/banner divergence and makes "a new admin page that forgets the nav"
   impossible. *(UI Principle 5 / adoption-register discipline.)*
2. **One admin guard.** Add a role check to `ProtectedRoute` (or a thin `AdminRoute` wrapper) so admin
   authorisation is declared once at the route, and migrate the 9 inline server guards to `assertAdmin`.
   Standardise the client fallback to `<NotFound/>` (never a blank `null`). *(No security hole exists
   today — this is convergence to one owner, not a fix for a leak.)*
3. **Names match namespaces.** "Learning Queue" and "Benchmark & Release" rather than two things both
   called "Intelligence"; distinguish "Benchmark **Households**" (test fixtures) from "**Benchmark** &
   Release" (the score).

---

## PART 4 — ENGINEERING HEALTH DASHBOARD RECOMMENDATIONS

**Governing frame.** The dashboard is the **Operations** layer of `PLATFORM_QUALITY_ARCHITECTURE.md`
(§1 Quality Spine → Operations; §8 Operational Excellence) and the closing of its §2 Observability
"*alerting remains open*". It is **admin-only, read-only**, and it **must not** become a second
telemetry store (`THA_OBSERVATION_ENGINE_ARCHITECTURE.md` §7) — Intelligence signals are surfaced as
**projections/links to existing endpoints**, never re-recorded. CI/gate results are **CI facts, not
observations** — their SoT is the CI run (GitHub Actions API) or the existing baseline files, never a
new DB table.

Complexity legend: **XS** = link an endpoint that already exists · **S** = wire an already-written
function to a route+card · **M** = new read endpoint over existing data · **L** = needs a new store or
external integration.

### 4.1 Engineering (developer / CI) signals

| Metric | Owner | Source of truth | Purpose | Complexity |
|---|---|---|---|---|
| Test-suite status (141 suites, **per-suite** not aggregate) | Engineering | GitHub Actions run of `npm test` (`ci.yml`) — ephemeral today | Catch the P0 failure mode: a fail-fast chain hides ~139 downstream suites | **M** (read Actions API) |
| Typecheck regression | Engineering | `scripts/ci/typecheck-baseline.json` (175 frozen) + `typecheck:ci` | New type error vs baseline | **S** |
| Adoption register | UX / Platform | `docs/implementation/ux/adoption-register.json` + `adoption:check` | Unadopted foundation / risen rival ceiling | **S** |
| Governing-doc coherence | Governance | `verify:coherence` output | Doc drifted from code | **S** |
| Schema→migration coverage | Platform | `verify:schema-coverage` (table-level) | A table no migration can rebuild | **S** |
| Build | Engineering | `npm run build` exit | Bundle broken | **M** |
| **`release:check` vs CI divergence** | Engineering | `package.json:88` vs `ci.yml` | **CI omits `adoption:check`, `verify:deployment-config`, `verify:release-packaging`** — three gates run only in the local `release:check`, never automatically | **XS** (a documented fact to display) |

### 4.2 Production / runtime signals

| Metric | Owner | Source of truth | Purpose | Complexity |
|---|---|---|---|---|
| Service uptime / version / memory | Platform Ops | `buildOperationsStatus()` (`platform-status.ts:180`) — **written, uncalled** | Basic liveness & leak detection | **S** (wire the existing fn) |
| Database reachability + latency | Platform Ops | `checkDatabase()` (`platform-status.ts:135`) | DB down / slow | **S** |
| Outbound dependency circuit state | Platform Ops | `getDependencyHealthReport()` (`platform-resilience.ts`) | A tripped circuit to USDA/Whisk/etc. | **S** |
| Required env present | Platform Ops | `auditStartupEnvironment()` (`platform-status.ts:65`) | Misconfig surfaced as *presence* (never values) | **S** |
| **LLM provider availability** | Intelligence Platform | `provider.isAvailable` (`llm-provider.ts`, `gpt-4o-mini`) | Today `OPENAI_API_KEY` absence **silently** degrades to a NoOp — no alert | **M** |
| Auth rate-limit mode & hits | Security | DB `auth_rate_limits` (TRUST1-S5) | Rate-limiter disabled, or under attack | **M** |
| Migration head parity (DB vs code) | Platform | `expectedMigrationHead()` + `verify:prod` | Prod schema behind code | **S** |
| **Readiness / liveness endpoint** | Platform Ops | **DOES NOT EXIST** — recommend adding `GET /api/health` | External uptime monitoring | **M** |

### 4.3 Intelligence signals (surface = *link*, never re-record — OBS §7)

| Metric | Owner | Source of truth | Purpose | Complexity |
|---|---|---|---|---|
| Capability health / intent quality / context grounding | Observation Engine (Domain 32) | DB `platform_observations` | Runtime quality of the Companion | **XS** (exists at `/observation/*`) |
| Companion health snapshot & learning gaps | Companion Learning | DB `companion_health_snapshots` / `_recommendations` | Routing misses, capability-gap clusters | **XS** (exists) |
| **Intelligence Score + Release-Readiness verdict** | Benchmark World (Domain 33) | files `docs/intelligence/benchmark/history/` + `benchmark-run` observations | Is the Companion safe/good enough to release | **XS** (exists) |
| Registry executability | Intelligence Platform | `test:intelligence-registry-executability` | A registered capability that can't execute | **S** |

### 4.4 Data signals

| Metric | Owner | Source of truth | Purpose | Complexity |
|---|---|---|---|---|
| Publication integrity (23 domains + 3 cross-cutting) | Canonical Publication (CPuBA1) | computed (DB SELECT + source snapshot) via `runPublicationVerification` | Projection ≠ owner anywhere | **XS** (exists at `/canonical-publication-integrity`) |
| Knowledge evidence / claim / ownership coverage | Knowledge Registry | DB `knowledge_*` + `test:knowledge-*` | Uncited claim / orphan nutrient | **S** |
| **Cited-food coverage (`NUTRITION_CONTEXT`)** | Food Intelligence (editorial) | `shared/canonical/nutrition-context.ts` (**~10 of 610 slugs**) | The real ceiling on Food Intelligence cards (FI18) — **measured & surfaced nowhere** | **M** |
| Unowned `canonical_food` rows (309 USDA drafts) | Food Identity | publication check `fi-unowned-rows` | Draft rows with no owner | **XS** (exists, warn) |

**Design conclusion.** ~60% of the signals **already have an endpoint** and need only linking into one
Overview. The genuinely missing pieces are: (a) **wiring `buildOperationsStatus` in** (S), (b) a
**`/api/health` endpoint** (M), (c) **surfacing CI gate results** (M — read the Actions API; do not
build a store), and (d) making **LLM availability and cited-food coverage** visible (M each).

---

## PART 5 — ENGINEERING ALERT FRAMEWORK

**Principle (from the brief, enforced here):** *every alert has exactly one authoritative owner and no
duplicated monitoring.* Where §2.2 found a signal computed in more than one place, the framework names
**one** owner and marks the others **retire** or **link-only**.

**Severity:** 🔴 Critical (production/data integrity at risk — act now) · 🟠 Warning (degraded or
trending bad — act this cycle) · 🔵 Informational (worth knowing, no action) · 🟢 Healthy (steady state).

**Notification strategy — realistic to what exists today:** the only channels present are **structured
log ERROR** (already elevated in production by `auditStartupEnvironment`, consumable by a log
aggregator) and **SMTP email** (`SMTP_HOST` configured). There is **no paging/Slack integration** — so
"Notify" below means *log-ERROR + optional email digest + dashboard badge*, and standing up a real
paging channel is itself a roadmap item (R-7).

### 5.1 Production / runtime

| # | Alert | Sev | Trigger | Owner | Operator action | Notify | Dashboard |
|---|---|---|---|---|---|---|---|
| P-1 | Server not ready | 🔴 | `GET /api/health` fails / no boot within N s | Platform Ops | Investigate boot log; migrations fail-closed so suspect DB/env | log-ERROR + email | Operations tile |
| P-2 | Database unreachable | 🔴 | `checkDatabase()` `ok=false` | Platform Ops | Check DB service & `DATABASE_URL` | log-ERROR + email | Operations tile |
| P-3 | Required env missing | 🔴 | `auditStartupEnvironment()` returns non-empty | Platform Ops | Set `DATABASE_URL`/`SESSION_SECRET` (boot already `exit(1)`) | boot crash + log | Operations tile |
| P-4 | Dependency circuit open | 🟠 | `getDependencyHealthReport()` state = open | Platform Ops | Inspect the failing outbound (USDA/Whisk/…) | log-ERROR | Operations tile |
| P-5 | **LLM provider unavailable** | 🟠 | `provider.isAvailable === false` in a non-dev env | Intelligence Platform | Set `OPENAI_API_KEY`; Companion is running as NoOp | log-ERROR + badge | Operations tile |
| P-6 | Auth rate-limiter not enforcing | 🟠 | `AUTH_RATE_LIMIT_MODE ≠ enforce` in production | Security | Re-enable enforcement | log-ERROR | Operations tile |
| P-7 | Memory trending to cap | 🔵 | `heapUsed/heapTotal` over threshold, sustained | Platform Ops | Watch for leak; correlate with uptime | badge | Operations tile |

### 5.2 Engineering / CI

| # | Alert | Sev | Trigger | Owner | Operator action | Notify | Dashboard |
|---|---|---|---|---|---|---|---|
| E-1 | CI gate red on `main` | 🔴 | `typecheck · test · build` job fails on `main` | Engineering | Fix or revert the landing commit | GH status + email | Engineering tile |
| E-2 | **Test chain fail-fast masking** | 🔴 | any `test:*` fails (⇒ ~139 suites unrun) | Engineering | Fix the failing suite; **treat downstream as UNKNOWN, not green** (the P0 lesson) | GH status | Engineering tile (per-suite) |
| E-3 | Typecheck regression | 🟠 | `typecheck:ci` new error vs baseline | Engineering | Fix or (deliberately) re-baseline | GH status | Engineering tile |
| E-4 | Adoption register breach | 🟠 | `adoption:check` fails | UX / Platform | Adopt the owner / retire predecessor | GH status | Engineering tile |
| E-5 | Coherence / schema-coverage red | 🟠 | `verify:coherence` or `verify:schema-coverage` fail | Governance / Platform | Reconcile doc/migration | GH status | Engineering tile |
| E-6 | **CI ≠ `release:check` drift** | 🔵 | `ci.yml` gate set ≠ `release:check` chain | Engineering | Decide whether `adoption:check` / packaging gates belong in CI | badge | Engineering tile |

### 5.3 Intelligence (owner = the engine; dashboard **links**, never re-computes)

| # | Alert | Sev | Trigger | Owner | Operator action | Notify | Dashboard |
|---|---|---|---|---|---|---|---|
| I-1 | Release-Readiness = FAIL | 🔴 | benchmark verdict FAIL (blocker fired) | Benchmark World (Domain 33) | Do not release; open the Benchmark page | badge | Intelligence tile |
| I-2 | Intelligence Score regression | 🟠 | latest score < prior − threshold | Benchmark World | Inspect regressions on `/admin/intelligence` | badge | Intelligence tile |
| I-3 | **Companion health degraded** | 🟠 | routing-miss rate over threshold | **Companion Learning (ONE owner — DB snapshot)** | Triage learning queue | badge | Intelligence tile |
| I-4 | Capability not executable | 🟠 | `registry-executability` fails | Intelligence Platform | Fix the binding | GH status | Intelligence tile |

> **De-duplication ruling for I-3:** name **Companion Learning's DB snapshot**
> (`companion_health_snapshots`) the single authoritative owner of "companion health". Mark
> `/observation/companion` **link-only** (a telemetry lens, not the alert source) and **retire** the
> orphan `/observability/companion` (§2.3). One signal, one owner — as the brief requires.
>
> **De-duplication ruling for benchmark (I-1/I-2):** name the **benchmark engine's saved run history**
> (`docs/intelligence/benchmark/history/`, Domain 33) the authoritative "latest score & verdict"; the
> `benchmark-run` observation and the two run-trigger pages are **views**, not owners.

### 5.4 Data

| # | Alert | Sev | Trigger | Owner | Operator action | Notify | Dashboard |
|---|---|---|---|---|---|---|---|
| D-1 | Publication integrity failure | 🔴 | any domain check `fail` (projection ≠ owner) | Canonical Publication | Open Publication Integrity; fix owner/projection | badge + email | Platform tile |
| D-2 | Schema table without reviewed migration | 🔴 | cross-cutting check fails | Platform | Add the migration (SCH-3 discipline) | GH status | Platform tile |
| D-3 | Publication needs-attention | 🟠 | any check `warn`/`skipped` | Canonical Publication | Review the warn (e.g. `fi-unowned-rows` 309 drafts) | badge | Platform tile |
| D-4 | **Cited-food coverage floor** | 🟠 | `NUTRITION_CONTEXT` slugs / canonical foods < target (today ~10/610) | Food Intelligence (editorial) | Author nutrition context — this is the real Food Intelligence ceiling (FI18) | badge | Platform tile |

**🟢 Healthy** is the steady state of every row above: green when the trigger is false **and** the signal
actually ran. A signal that *did not run* (skipped check, unrun test suite, volatile store lost on
restart) renders as **UNKNOWN**, never as 🟢 — this is the single most important rule in the framework,
and it is the exact rule P0 proved was missing (a fail-fast chain that stops early "passes" like one
that ran).

---

## PART 6 — ENGINEERING OPERATIONS (missing processes worth adding)

Ranked; none duplicates an existing capability. Each is a **governed workstream in its own right**
(Rule 8), named so it is not lost — *not* authorised by this investigation.

1. **A `GET /api/health` readiness/liveness endpoint** (public, unauth, no data) — the one true gap for
   external monitoring. `checkDatabase()` already exists to back it.
2. **Persist CI gate outcomes** — read the GitHub Actions API into the dashboard (do **not** build a
   store; CI is the SoT). Ends the "was the suite green?" blindness that P0 named.
3. **A single admin-nav config** consumed by hub + banner (Part 3, rule 1).
4. **Converge admin authorisation** to one guard (Part 3, rule 2).
5. **A quality-debt / staleness cadence** — `PLATFORM_QUALITY_ARCHITECTURE.md` §8 already mandates a
   cadence-based quality-debt audit; nothing runs it. `SourceRef.lastReviewed` staleness (roadmap §10
   "Staleness monitoring — alert-only") folds in here.
6. **Retire the orphan endpoints** in §2.3 (observability/companion, and document the CLI-only
   maintenance ops) so the surface matches what is reachable.
7. **A real alert channel** (the framework above degrades to log-ERROR + email because nothing else
   exists). Standing up a paging/Slack sink is prerequisite to §5 being more than a dashboard.

---

## OPTIONS (for the dashboard, once approved)

| Option | Description | Cost | Risk | Reversible? |
|---|---|---|---|---|
| **A — Surface-first** (recommended) | Fill the "Overview" stub with a read/link dashboard over **existing** endpoints + wire `buildOperationsStatus`; add `/api/health`; read CI status | Low–Med | Low (read-only, admin-only) | Fully |
| B — Full build | New aggregated health store with history/trends for every signal | High | Med — risks a **second telemetry store** (OBS §7 stop) | Costly |
| C — Do nothing | Leave engineering health in CI stdout | Zero | **High** — this is the P0 blindness, unaddressed | n/a |

---

## RECOMMENDATION

**Adopt Option A.** The Admin Console needs *surfacing and convergence, not construction*: fill the
permanently-stubbed "Overview" card with a read-only Engineering Health Dashboard that **links the
signals that already have endpoints** and **wires in the operations function that is already written but
called by nothing**, add the one missing `GET /api/health` endpoint, and read CI gate status from the
GitHub Actions API. Resolve the two duplicated-monitoring signals to one owner each **before** the
dashboard reads them. This closes `PLATFORM_QUALITY_ARCHITECTURE.md` §2's open "alerting" and §8
Operational Excellence with almost no new runtime code and **no new store** — respecting the Observation
Engine's §7 "no second telemetry system" stop.

**What would change this recommendation:** if the owner wants **historical trending** of production
metrics (memory/latency over weeks), that requires a persistence decision (Option B) which is a Rule 8
governed workstream — because the honest way to store it is *not* a second observation store, and that
choice needs its own review.

---

## ARCHITECTURE COMPLIANCE

The recommendation **complies** and is deliberately shaped by three governing constraints:

- **`PLATFORM_QUALITY_ARCHITECTURE.md`** — the dashboard is the **Operations** layer (§1, §8) and the
  closing of §2 Observability's "alerting remains open". It creates **no new quality owner**; every
  metric is attributed to its existing owner.
- **`THA_OBSERVATION_ENGINE_ARCHITECTURE.md` §6/§7** — Intelligence signals are surfaced as **links to
  the existing operator views**, never re-recorded. No second telemetry store, seam, or aggregation
  layer is proposed. CI/gate facts are explicitly **not** observations.
- **`ARCHITECTURE_PRINCIPLES.md` Principle 2** — the IA and alert framework name **one owner per fact**
  (nav config, admin guard, companion health, benchmark score), retiring rivals rather than bridging
  them.

No conflict found. Any change beyond Option A (a new store for history) must **STOP** for Rule 8 review.

---

## DATA IMPACT

None — investigation only. No data read into behaviour, no store created, no schema change.

---

## TRUST CHECK

- **Stated more confidently than the evidence supports?** No. The headline (`buildOperationsStatus` has
  zero callers) is a repo-wide grep result, re-verified. The publication-domain count (23) was
  corrected from one pass's estimate (26) by counting `canonicalOwner:` in the file.
- **Guessed but presented as measured?** No. Severity ratings in the Alert Framework are labelled
  **recommendations**; the "no `/health` endpoint" and "CI ≠ `release:check`" claims are from reading
  `ci.yml` and `package.json:88`.
- **Unknowns listed as plainly as findings?** Yes: CI gate results, LLM availability, and cited-food
  coverage are marked **not surfaced / invisible**; the in-memory companion store is marked **volatile
  (lost on restart)**; historical trending is named as requiring an unmade persistence decision.

---

## OUTCOME

The Admin Console is inventoried (13 pages, ~85 endpoints, one canonical guard applied three ways),
proven to contain **no orphaned or obsolete page**, and its real defects located precisely: a **blind
spot for production and engineering health** (a written-but-uncalled operations function; no `/health`
endpoint; CI gates invisible), **two duplicated-monitoring signals**, and **navigation/authorisation
drift** across rival declarations. A canonical five-domain IA, a four-category health dashboard (each
metric with owner, SoT, purpose, complexity), and a one-owner alert framework (each alert with trigger,
owner, action, notification, visibility) are specified — all as the **Operations layer the Platform
Quality Architecture already mandates**, achievable mostly by surfacing what exists.

## NEXT STEPS

Owner decision on **Option A vs B** (surface-first vs build-with-history). Option A unblocks a set of
low-risk, read-only, admin-only changes (fill the Overview stub, wire `buildOperationsStatus`, add
`/api/health`, one nav config, converge the admin guard, retire orphan endpoints) — each a normal
decision-gated implementation under `ENGINEERING_WORKFLOW.md`, none authorised here.

---

## FUTURE OPPORTUNITIES (not approved)

- **Historical health trending** with an honest persistence model (Option B) — Rule 8 review required.
- **A real alerting channel** (paging/Slack) so §5 is more than a dashboard.
- **Automated quality-debt cadence** enforcing `PLATFORM_QUALITY_ARCHITECTURE.md` §8.
- **Registry-anchored Performance & Accessibility metadata** (`PLATFORM_QUALITY_ARCHITECTURE.md` §11
  open items 1–2) — the two quality domains still reasoned about by hand.
- **Cited-food coverage as a first-class editorial pipeline metric** (FI18's real ceiling: 10/610).

---

## SCOPE LOCK

- **Implemented scope:** none — investigation and this document only.
- **Explicitly excluded:** every code, route, schema, endpoint, and UI change; nothing was built.
- **Suggestions (do not implement without approval):** the entire Roadmap, Quick Wins, and Future
  Opportunities above are recommendations pending owner decision.

### Prioritised roadmap

| Phase | Item | Sev | Complexity |
|---|---|---|---|
| **Quick wins** | QW-1 Wire `buildOperationsStatus` → route + fill the "Overview" stub | 🔴 | S |
| | QW-2 Add `GET /api/health` (readiness/liveness) | 🔴 | M |
| | QW-3 Resolve companion-health & benchmark to one owner each; retire orphan `/observability/companion` | 🟠 | S |
| | QW-4 One `ADMIN_SECTIONS` config for hub + banner | 🟠 | S |
| **Phase 1** | Read CI gate status into the dashboard; per-suite test visibility (the P0 fix) | 🔴 | M |
| | Surface LLM availability, auth-rate-limit mode, migration head parity | 🟠 | M |
| | Converge admin guard to one owner; standardise client fallback | 🟠 | M |
| **Phase 2** | Cited-food coverage metric; publication-integrity trend; quality-debt cadence | 🟠 | M |
| **Phase 3 (governed)** | Historical trending store (Option B) + real alert channel | 🔵 | L |
