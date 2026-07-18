<!-- An implementation report records what was BUILT and proves it works. -->

# SUP3 — Support Hub Check-in Experience — Implementation Report

**Date:** 2026-07-17
**Branch:** `int1-intelligence-platform`
**Type:** Implementation — client landing-page surface. **No backend, no new API, no new calculation, no schema/route/migration.**
**Risk:** 🟢 GREEN (one client file; reads only existing, read-only, admin-guarded GETs; every tool, route, guard and behaviour unchanged)
**Author:** Colin Clapson (via Claude Code)
**Design priors:** [`SUP2_STEWARD_DASHBOARD.md`](./SUP2_STEWARD_DASHBOARD.md) (the four-question dashboard this transforms), [`ADMIN2_SUPPORT_HUB_EXPERIENCE.md`](../investigations/admin/ADMIN2_SUPPORT_HUB_EXPERIENCE.md) (the study off the hall; calm before capability; UNKNOWN≠green), [`ADMIN1_ADMIN_CONSOLE_ENGINEERING_HEALTH_AUDIT.md`](../investigations/admin/ADMIN1_ADMIN_CONSOLE_ENGINEERING_HEALTH_AUDIT.md) (the existing signals and where they live).

---

## OBJECTIVE

Transform the Support Hub from a **dashboard** into a **calm daily check-in**. The first
thing an operator should discover is simply: *"Is everything okay?"* — answered in one line,
with only the things that need attention surfaced beneath it. Healthy systems should quietly
collapse into a simple confirmation rather than demanding equal visual weight.

---

## ROLLBACK INFORMATION

| Item | Value |
|------|-------|
| **Rollback tag** | `rollback/SUP3-support-hub-checkin-20260717` → `7bfad50ca198f2b86f6501a4f82d8ae41af9260b` |
| Working tree | **Intentionally dirty** at session start — sibling sessions hold uncommitted changes across the tree. The tag covers **committed state only** (it does *not* capture the uncommitted SUP1/SUP2 `admin-page.tsx` this builds on, nor any other session's dirty files). SUP3 touches exactly **one product file** (`client/src/pages/admin-page.tsx`), listed below. |
| Rollback | `git checkout rollback/SUP3-support-hub-checkin-20260717 -- client/src/pages/admin-page.tsx` restores the file to the **committed** `7bfad50c` state (the pre-SUP1 Admin landing). To return only to SUP2's dashboard, revert the SUP3 hunks in that one file. No schema, migration, route, endpoint, or data was changed, so nothing else needs reverting. |

---

## WHAT WAS BUILT

SUP2 left the Support Hub with a **Steward Dashboard**: four question-cards — *How is THA
today? · What needs my attention? · Can I safely release? · What has changed?* — laid out in a
**2×2 grid of equal visual weight**. That is a dashboard: four things competing for the eye,
each demanding to be read, whether or not anything is wrong.

SUP3 replaces that grid with a **check-in**. The page now opens on a single **executive
summary** — the first and largest thing on it — that answers *"Is everything okay?"*:

> **THA is healthy today.** · No action required.

or, when something is wrong:

> **Three things need your attention.** · Here's what to look at, and where to go. Everything else is fine.

Beneath the summary, **only the items that need attention are surfaced**. Every healthy signal
stays silent — it folds into the summary rather than occupying a card of its own. When
everything is well, the page is one calm green line and nothing else. The operator understands
the health of THA within a few seconds, and nothing competes for that first read.

### Every attention item carries three things

The brief asks that each attention item contain a short explanation, why it matters, and one
recommended action linking to the owning tool. Each item is a single card:

| Part | What it is | Example (real capture) |
|---|---|---|
| **What** (headline) | A short, plain explanation of the item | *"4 canonical domains have failed publication"* |
| **Why it matters** | One sentence on the consequence for the household | *"What THA publishes may no longer match its declared owner, so a household could be shown stale or incorrect information."* |
| **Where to go** (action) | One recommended action, linking **directly to the owning tool** | *Open Publication Integrity →* (`/admin/canonical-publication-integrity`) |

Items are ranked by severity — a real failure (red) above a "worth a look" caution (amber)
above an honest "couldn't be checked" (muted) — so the most consequential thing is read first.

### The signals — all existing, none recreated

Every signal is one SUP2 already read: an **existing, read-only, `assertAdmin`-guarded GET** a
tool page owns. SUP3 recomputes nothing and adds no endpoint; it re-uses the same TanStack
query keys, so requests are **deduped** with the tool pages. Each signal resolves to exactly one
of *still loading · quietly healthy (silent) · an attention item*:

| Signal (existing GET) | Healthy → silent | Becomes an attention item when | Severity |
|---|---|---|---|
| `GET /api/admin/canonical-publication-integrity` → `summary.publicationFailure` / `needsAttention` | all domains healthy | `publicationFailure > 0` → *"N canonical domains have failed publication"* · else `needsAttention > 0` → *"N need a look"* | attention / caution |
| `GET /api/admin/knowledge-review/health` → `backlog.outstandingReviews` | queue empty | `> 0` → *"N knowledge terms are awaiting review"* | caution |
| `GET /api/intelligence/learning/dashboard` → `recommendationCounts.pending` | nothing pending | `> 0` → *"N learning recommendations are pending"* | caution |
| `GET /api/intelligence/benchmark/runs` → latest run `verdict` | last run `PASS` | `FAIL` → *"The last benchmark did not pass"* · `PARTIAL` → *"passed only partially"* · none/error → honest *"couldn't be determined"* | attention / caution / unknown |

**What SUP3 deliberately dropped from SUP2:** the *"What has changed?"* card (recent knowledge
releases + last benchmark). Recent activity is *informational* — it is not something that needs
attention, and in a check-in it would compete with the summary for the operator's eye. The
brief is explicit: *"Nothing else should compete for attention."* So the releases GET is no
longer read from this surface (it remains owned by Knowledge Review, unchanged).

### The rules it obeys (each carried, none invented)

- **Reuse all existing health signals and calculations.** Every value shown is a field the
  server *already computes* and a tool page *already reads*. SUP3 classifies nothing new — for
  each signal it surfaces the server's own status (a domain failure, a queue count, a benchmark
  verdict). It **does not compute a composite health score**; the summary count is simply *how
  many signals raised an item*.
- **Do not duplicate functionality. Do not recreate data.** Zero server files touched. The four
  GETs are the exact read-only endpoints the tool pages own; every recommended action is a link
  *to* that tool, not a re-implementation of it.
- **It never triggers work.** The check-in reads benchmark *history from disk*
  (`/benchmark/runs`); it **never** calls `POST /benchmark/run`, `POST …/run-benchmark`, or
  `POST …/snapshot`. Visiting the page runs no benchmark and publishes nothing.
- **If a signal cannot be determined, state that honestly rather than assuming healthy**
  (Visual Trust, `THA_UI_ARCHITECTURE.md` §14 — UNKNOWN ≠ green). A signal that fails to load
  becomes an honest **"couldn't be checked"** item (muted, never green) *and* the summary softens
  to *"THA looks calm — but not everything could be checked… this isn't a clean bill of health."*
  A green "healthy today" is shown **only when every signal actually resolved and every one is
  clear**.
- **The release answer never poses as current.** The benchmark item is explicitly the **last
  run** with its score and timestamp (*"It scored 76.4/100 7 days ago"*), so a week-old verdict
  is never read as a fresh evaluation.
- **Maintain the calm THA experience.** Plain sentences in the one voice; a reassuring first
  line; healthy signals that disappear rather than shout. The page feels like a check-in, not an
  operations console.

---

## SCREENSHOTS

Captured against the live dev server (`localhost:5000`) using the Replit-provided Chromium, via
a **disposable admin created AND deleted within the same run** (verified: **0** leftover
`sup3-shot` rows by direct query). The throwaway capture harness was **removed after use** (SUP1
discipline). The attention state shown is **real platform state** at capture time, not mocked —
which is why it honestly reads *"4 canonical domains have failed publication"* against the
current dirty working tree.

### Attention state — desktop (1280), real data

The executive summary is the primary focus; three real attention items are ranked failure-first;
healthy signals (the learning queue was empty) have quietly collapsed and are not shown.

![Support Hub check-in — desktop, attention state](./assets/SUP3/support-checkin-desktop.png)

### Attention state — mobile (390), real data

Single-column responsive stacking; the same summary-first hierarchy holds.

![Support Hub check-in — mobile, attention state](./assets/SUP3/support-checkin-mobile.png)

### Healthy state — the reassuring confirmation

*Simulated via mocked responses to demonstrate the all-clear UI state — **not** live data.* When
every signal resolves healthy, the entire check-in collapses to a single calm line and **nothing
else** — no cards, no equal-weight grid. This is the "quietly collapse into a simple
confirmation" the brief asks for.

![Support Hub check-in — healthy confirmation](./assets/SUP3/support-checkin-healthy-sim.png)

---

## FILES CHANGED

**One product file. No backend, schema, migration, route, endpoint, or API.**

| File | Change |
|---|---|
| `client/src/pages/admin-page.tsx` | Replaced SUP2's `StewardDashboard` (four equal `QuestionCard`s + `LinkList`) with a `SupportCheckIn` component: the same four read-only `useQuery` calls (minus the releases query, now unused), a per-signal evaluator that resolves each to *loading · healthy (silent) · attention item*, an executive-summary computation, and an `AttentionItemCard` presenter (what / why / one action link). Added a small `Severity` vocabulary + count-word helpers; kept `relativeTime`. **Removed:** the `QuestionCard`, `LinkList`, `KnowledgeRelease` interface, `slug` helper, and `releases` query (all now unused). Everything else — `TOOLS`, `GROUPS`, `ToolCard`, `GroupSection`, the admin role guard, and `data-testid="admin-page"` — is **unchanged**. |

**Documentation / assets (non-product):**
- `docs/implementation/SUP3_SUPPORT_HUB_CHECKIN.md` (this report)
- `docs/implementation/assets/SUP3/support-checkin-{desktop,mobile,healthy-sim}.png`
- `.engineering/session/runs/SUP3_Support_Hub_Checkin.md`, `.engineering/session/CURRENT.md` (row)

---

## VERIFICATION

- **Typecheck:** `tsc --noEmit` reports **zero errors in `admin-page.tsx`** and **zero in any
  `client/src` file**. The gate's 293 error lines are **all pre-existing `server/` sibling debt**
  in the dirty tree (`server/tests` 249, `server/lib` 11, `server/verification` 7, `server/scripts`
  4, `server/intelligence` 4) — SUP3's delta is **0 new type errors**.
- **Build:** `vite build` exits **0** with the change applied (3286 modules transformed, 16.1s).
- **Runtime (proved end-to-end, not just compiled):** under a real authenticated admin session at
  both viewports, `data-testid="support-checkin"` renders with **live real data** and **0 console
  errors**. The captured state:
  - **Summary:** *"Three things need your attention."* (red) · *"Here's what to look at, and where to go. Everything else is fine."*
  - **Item 1 (attention/red):** *"4 canonical domains have failed publication"* → *Open Publication Integrity*.
  - **Item 2 (caution/amber):** *"24 knowledge terms are awaiting review"* → *Open Knowledge Review*.
  - **Item 3 (caution/amber):** *"The last benchmark passed only partially"* — *"scored 76.4/100 7 days ago, with 0 gates fired"* → *Review in Intelligence*.
  - **Healthy signal collapsed:** the learning queue (`pending: 0`) raised no item and is not shown.
  - **Healthy state (simulated):** with all four signals mocked clear, the summary reads *"THA is healthy today."* and **no items render** — verified in the same run.
- **No behaviour changed:** the admin role guard (`role !== "admin"` → `<NotFound/>`) is
  byte-identical; every tool card still links to its original route; no mutation, benchmark run,
  or publish is triggered; the four queries reuse the tool pages' query keys (deduped,
  `staleTime: Infinity`).
- **No new component/token/button:** the check-in uses the canonical `ui/card` and `wouter`
  `Link` owners and existing lucide icons; **0** raw `<button>`/`<Button>` added (all actions are
  `Link`ed `<span>`s), so no adoption-register entry is required (`THA_UI_ARCHITECTURE.md` §17),
  and the 538 raw-button ceiling is untouched.
- **No data left behind:** the disposable screenshot admin was deleted in the same run; **0**
  leftover `sup3-shot` rows confirmed by direct query.

---

## SUCCESS CRITERIA — MET

A returning operator immediately knows:

- **Is everything okay?** → the executive summary is the first and largest thing on the page: *"THA is healthy today."* or *"N things need your attention."*
- **If not, what needs attention?** → only the items that need attention are surfaced beneath it; healthy signals are silent.
- **Why?** → each item states the consequence for the household in one sentence.
- **Where should I go?** → each item's one recommended action links directly to the tool that owns it.
- **Nothing else competes for attention** → the "what has changed" activity feed was removed; a healthy page is one calm line.

---

## ARCHITECTURE COMPLIANCE

- **`THA_UI_ARCHITECTURE.md` §12 / §14** — every state is designed (loading = *"Checking on
  things…"*, healthy = one green confirmation, failure/unrun = honest *"couldn't be
  determined"*); **status never poses as current** (the benchmark item is explicitly the *last*
  run with its timestamp); **UNKNOWN is never shown as green** — an undetermined signal both
  raises an honest item and prevents the "healthy today" summary.
- **`THA_EXPERIENCE_LANGUAGE.md` §453** — the study "off the hall" stays *calm, honest, never a
  second product, never louder, never anxious*: the page opens by reassuring, plain questions in
  the one voice, healthy signals disappear rather than shout.
- **`THA_EXPERIENCE_BLUEPRINT.md` §4.1** — the admin surface is a room in the same house (E0,
  calm); a daily check-in is exactly what "the study off the hall" should feel like on arrival.
- **Reuse over rebuild (`ARCHITECTURE_PRINCIPLES.md` Principle 2 — one owner per fact)** — the
  check-in surfaces the tool pages' own status and links back to them; it owns no health fact of
  its own and duplicates no functionality.

---

## FOLLOW-ON RECOMMENDATIONS

1. **A cached `/api/health` readout (ADMIN1 QW-1/QW-2, carried from SUP2).** The publication
   signal runs a full verification pass per visit (the same call the tool makes). A cached
   composite readout would let the check-in load instantly and would give THA the wired
   engineering-health endpoint ADMIN1 found missing (`buildOperationsStatus()` has zero callers).
   Out of scope here (backend/API forbidden by brief).
2. **Progressive summary while signals load.** Today the summary shows *"Checking on things…"*
   until all four signals resolve. Once a cached readout exists, the summary could settle
   instantly and refine in place — even calmer.
3. **Operator activity log** (the retired "what has changed" content) belongs in its own quiet
   place — a *History* view a curious operator opens deliberately — rather than competing with the
   check-in. A candidate home is Knowledge Review, which already owns the releases GET.
4. **Banner "Overview" → "Support Hub / Check-in" nav rename (ADMIN1 QW-4).** The banner still
   labels this route "Overview"; a coherent rename is a small governance follow-on, deferred as it
   touches shared nav.
