# Session: PDA1_Platform_Discovery_And_Experience_Audit

| Field | Value |
|---|---|
| **Session ID** | `PDA1_Platform_Discovery_And_Experience_Audit` |
| **Rollback ID** | `27ed7f2` (last commit before session; working tree untracked-only) |
| **Start time** | 2026-07-11T00:00:00Z UTC (resumed after disconnect) |
| **Current stage** | Complete |

## Objective
Complete PDA1 — discover the platform, populate the Product Knowledge Registry
(`docs/product/`), capture the screenshot baseline, and produce the investigation
report, JSON/YAML inventory and prioritised UX transformation roadmap.
PDA1 **discovers and records only** — it implements no product change.

## State inherited from the interrupted session
The previous session left **no run file**, so this section reconstructs its state
from the working tree. Completed before the interruption:

- `docs/product/inventory/product.yaml` — **154 authored records across 22 sections** (the single act of authorship, Rule PKR17).
- `docs/product/inventory/product.json` — generated form.
- `docs/product/inventory/schema/product-schema.json` — the 28-section schema.
- `scripts/build-product-inventory.ts` — YAML → JSON generator (fails closed on visibility, Rule PKR22).
- `scripts/verify-product-inventory.ts` — the registry's own completion gate.

**Not started:** prose entries, navigation docs, screenshots, report, roadmap.

## The completion gate
`npx tsx scripts/verify-product-inventory.ts` is the objective test for this
session. At resume it reported:

```
154 inventory records / 0 prose entries / bijection: BROKEN
155 failure(s), 39 warning(s)
```

PDA1 is not complete until it exits 0 with `bijection: TOTAL`.

## Files being modified
- `docs/product/**` — the registry: prose entries, README/OWNERS/VISIBILITY, screenshot index.
- `docs/investigations/platform/PDA1_*.md` — the investigation report (Rule PKR3: discovery ≠ ownership).
- `docs/investigations/platform/PDA1_*_ROADMAP.md` — the prioritised UX roadmap.

## Checkpoints
<!-- Append one line per checkpoint. Newest at the bottom. -->
- [x] Inherited state reconstructed; verify gate identified as the resume signal
- [ ] Prose entries written (154) — bijection TOTAL
- [ ] Navigation docs written (README, OWNERS, VISIBILITY)
- [ ] Screenshot baseline captured
- [ ] Investigation report written
- [ ] UX transformation roadmap written

- [x] **Screenshot capture UNBLOCKED** — see finding below
- [x] Prose entries fanned out to 8 parallel agents (153 of 154 entries in flight)

- [x] Screenshot baseline CAPTURED — 18/18 surfaces (real chromium, demo household)
- [x] 7/8 prose agents done; security findings self-verified

- [x] **VERIFY GATE GREEN** — 154/154 prose, bijection TOTAL, 0 failures, 39 PKR23 warns (advisory, triaged)
- [x] Navigation docs written: README.md, OWNERS.md (154 rows), VISIBILITY.md (27/69/51/7 + PKR23 triage)
- [x] product.yaml corrected (7 fixes) + product.json regenerated + prose blockquotes synced
- [x] Generators added: scripts/build-registry-nav.ts, scripts/capture-product-screenshots.ts
- [x] PDA1 investigation report — defines all 31 fnd-* ids (parity checked both ways)
- [x] UX transformation roadmap — 6 phases, findings graded by household impact
- [x] All 31 findings evidence-backed; 3 recorded as PARTIAL (home-dashboard-rivalry,
      food-detail-chrome, pkr27-prompt-knowledge — last is largely refuted, recorded honestly)

**Last checkpoint:** PDA1 COMPLETE — all deliverables produced, gate green

## Final state — all deliverables produced
- Product Knowledge Registry: 154 prose entries, all 28 sections, bijection TOTAL, 0 failures.
- Machine inventory: product.yaml (authored, 7 corrections applied) → product.json (generated).
- Nav docs: README.md, OWNERS.md (154 rows), VISIBILITY.md (27/69/51/7 + 39-link PKR23 triage).
- Screenshot baseline: 18 surfaces, real chromium capture vs live demo household.
- Investigation report: docs/investigations/ux/PDA1_PLATFORM_DISCOVERY_AND_EXPERIENCE_AUDIT.md.
- UX roadmap: docs/investigations/ux/PDA1_UX_TRANSFORMATION_ROADMAP.md.
- Scripts: build-product-inventory, verify-product-inventory (inherited), build-registry-nav,
  capture-product-screenshots (new).

## Recommendations for follow-up (NOT done — out of PDA1 scope)
- Wire `scripts/verify-product-inventory.ts` into `npm test` so the bijection/visibility
  gate is enforced on every change (closes PKCA Rule KC8's declared-vs-enforced gap for the
  Product Knowledge domain). Deliberately not done — it edits the tracked build config.
- Phase 0 of the roadmap (2 confirmed unauth write classes + unenforced premium) warrants a
  focused security review before any fix ships.
- No commit/push performed (mission: discovery only; commit only when asked).

## Security findings — SELF-VERIFIED (not inherited on trust)
Both api-surface known_defects confirmed by reading the code directly:
- `fnd-unprotected-admin-endpoints` — 3 routes have a no-op `(req,res,next)=>next()`
  where an admin guard belongs, then run bulk data mutations tolerating an
  anonymous caller (`req.user?.id ?? 0`): routes.ts:10740 backfill-classifications,
  10758 normalise-categories, 10771 backfill-ambiguous-categories. CONFIRMED.
- `fnd-public-template-writes` — 5 unauthenticated template CRUD routes:
  routes.ts:5085 POST, 5097 PATCH, 5115 DELETE meal-templates, 5135 POST products,
  5147 DELETE template-products. CONFIRMED (read POST + PATCH directly).
- Endpoint count 322 confirmed by the integrations agent (308 routes.ts + 14 auth.ts).

## product.yaml corrections required (Rule PKR15 — corrected, never defended)
Discovered during grounding; must be applied + product.json regenerated + prose blockquote synced:
1. `mkt-founding-story` — **BUILD FAILURE** (§8s20): no substantiation, no gap. Add substantiation_gap.
2. `routes-map` purpose — "eight aliases" is wrong; code has 5 aliases + 2 redirects.
3. `page-admin-companion-intelligence` + `adm-companion-intelligence` — claim personality
   editing; page is a read-only health/recommendations dashboard. Remove the claim.
4. `ntf-shopping-opportunity` source path — `server/intelligence/opportunity-engine.ts`
   → `server/intelligence/food-intelligence/opportunity-engine.ts` (real path).
5. `hid-routing-telemetry` purpose — "still silently recording correction events" is
   false; the hook is inert (`_routingLanding` is never set). Soften to reflect reality.

## Screenshot finding (overturns inherited assumption)
The inherited `shot-manifest` record and `fnd-no-screenshot-baseline` claimed
*"no browser binary can be installed in the current environment."* **That is
false.** Chromium (`chrome-headless-shell-1223`) is installed; it failed only for
missing system shared libraries. All 20 are present in the Nix store (inside the
`sonixd` and `cozydrive` FHS bundles). Symlinking them — **excluding the glibc
core**, which must stay system — into a scoped `LD_LIBRARY_PATH` lets chromium
launch and screenshot successfully (verified: real PNG at mobile viewport).

Repro:
```
LIBDIR=<scratchpad>/chromium-libs   # 795 libs symlinked, glibc core excluded
LD_LIBRARY_PATH="$LIBDIR" node -e "chromium.launch({args:['--no-sandbox','--single-process',...]})"
```
The bundle paths and exclude regex are in the scratchpad build step. Consequence:
PDA1 CAN capture a real baseline; `shot-manifest` and `fnd-no-screenshot-baseline`
must be corrected from "impossible/specified" to "captured".

## Next action
1. Await 8 prose agents; run the verify gate; fix orphans/§10.1 violations.
2. Boot dev server (PORT=5000, DB reachable) → capture real screenshot baseline
   across canonical routes → write `shot-manifest` entry + MANIFEST + capture script.
3. Write README/OWNERS/VISIBILITY nav docs.
4. Write PDA1 investigation report (defines all 31 fnd-* ids) + UX roadmap.
5. Green the gate (bijection TOTAL, 0 failures); triage 39 warnings.

## Blockers
none

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
