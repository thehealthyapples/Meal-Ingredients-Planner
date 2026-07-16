
# Session: HOME3_Home_Primary_Action_Implementation

| Field | Value |
|---|---|
| **Session ID** | `HOME3_Home_Primary_Action_Implementation` |
| **Rollback ID** | `rollback/HOME3-home-primary-action-implementation-20260716` → `7d1dd2ce` |
| **Start time** | 2026-07-16T12:40:00Z UTC |
| **Current stage** | Waiting for User |

## Objective
Implement the **Home Primary Action Resolver** specified by `HOME2` § 4 — a pure, total, zero-I/O
resolver over the four-tier ladder (Safety → week unplanned → trip pending → floor), closing
`NORTH1` § 8.3 / `EXPCOMP2`'s headline FAIL (*Home has no door*).

**The first implementation in the North Star → Blueprint → Behaviour → Compliance chain.**
Every link above it is delivered; nothing has yet touched the product.

**Scope (set by the user): only what is blocked by nothing.** The six architectural conflicts
`EXPCOMP2` routed stay reported and untouched. No governed amendment is sought.

## Files created (2 code, 1 doc, 1 config) — nothing existing rewritten
- `shared/home/home-primary-action.ts` — **the resolver** (new; pure, zero-I/O, total, clock-free)
- `server/tests/test-home2-home-primary-action.ts` — 47 assertions (new)
- `docs/investigations/platform/HOME3_THE_TWO_CURRENT_WEEKS.md` — the finding, surfaced on instruction (new)
- `package.json` — test registered in **both** required places (own script + master `test` chain)

No architecture modified. No schema. No migration. No route. No UI. No governing document touched.

## Checkpoints
<!-- Append one line per checkpoint. Newest at the bottom. -->
- [x] Architecture Bootstrap read (`docs/architecture/README.md`, STEP 2)
- [x] `HOME2` decision model read in full — the spec being implemented
- [x] Rollback tag created → `7d1dd2ce`; session registered
- [x] Code surface mapped (Home page · planner/shopping reads · DEC1 bundle · INT21 voice · test convention)
- [x] Resolver implemented — 4-tier ladder + unconditional floor, per `HOME2` § 4.1/§ 4.2
- [x] Reuses `orderByAttention` + `clampLimit(MAX_DOORS)`; declares no module-local sort/clamp (DEC1 § 4)
- [x] 47/47 pass · typecheck clean · dec1 (49) · attn1 (29) · behaviour (119) · OD1 (60) · notice (65) all green
- [x] **Negative assertions mutation-tested** — 9/10 had teeth; the 10th was **vacuous** and was replaced
- [ ] Call-site decision — **the boundary of the chosen scope** (see Blockers)

**Last checkpoint:** Resolver delivered and verified. Awaiting the call-site decision.

## Deviations from HOME2, and why (HOME2 is an investigation, not law — its own § 12)
1. **`destination` is a DOMAIN, not a route.** `HOME2` § 4.1 words the output as *"the canonical
   route of an existing room"*. Writing `/planner` here would create a second owner of the route
   table: `domainLandingPath()` is already *"the single place ref/domain → THA path is decided"*
   (`companion-card.ts:162`, `:196`). The resolver returns `"planner" | "shopping" | "pantry"` —
   the producers' own `FoodOpportunityDomain` vocabulary (`opportunity-engine.ts:116`), the same
   three keys `DOMAIN_LANDING` already maps. **Architecture Principle 2 prevails; no new vocabulary.**
2. **No `trust` input.** `HOME2` § 7.2 case 2 rules that a producer outage only costs Tier 0. An
   empty `criticals` array therefore conflates "none exist" with "couldn't check" — deliberate, and
   documented at the field: there is nothing honest the resolver could do with the flag.

## Findings — reported, not fixed
1. **The Adoption Register gate cannot see `shared/`.** It walks `client/src` only
   (`adoption-register-gate.ts:47`, `:158`). UIA § 17's promise — *"authored-but-unadopted must be
   impossible to hide"* — therefore holds for `client/src` and **not** for `shared/`. This resolver
   is itself currently authored-but-unadopted, and the gate is green about it because it does not
   look there. Not an invented rule; the gap is recorded, not filled (EXPCOMP1 § 4.3).
2. **`npm run adoption:check` fails on `main`, 2 failures, neither caused here** — `[button-primitive]`
   rival count 539 vs ceiling 538, and `[orphans] client/src/components/HouseholdNutritionPanel.tsx`
   (0 importers). Both pre-date this session.
3. **The two "current week" definitions disagree** — server `max(weekNumber)` (`routes.ts:11503`) vs
   client `localStorage["planner:active-week"]` defaulting to 1 (`home-experience-page.tsx:48-61`).
   `TIME1` already found `max(weekNumber)` ≡ the constant 6. The resolver takes `week` as an input,
   so **the caller must choose one deliberately** — this is a live input to the call-site decision.

## Decisions taken by the user this session
1. **Call site → a new dedicated route** (`GET /api/home/primary-action`). Avoids `/api/home/intelligence`
   entirely, so it neither subsumes nor deepens **NTC-P2**'s chartered convergence debt (INT20 § 7.2),
   and skips that route's N+1×M serial loop. **Not yet built** — blocked by decision 2.
2. **Current week → surface the disagreement first**, rather than pick a definition. Delivered as
   `docs/investigations/platform/HOME3_THE_TWO_CURRENT_WEEKS.md`.

## The finding that blocks the route (`HOME3_THE_TWO_CURRENT_WEEKS.md`)
**THA has two current weeks, they can never agree, and Home already contradicts itself because of it.**
- **Server** `max(weekNumber)` (`routes.ts:11503-11505`) ≡ **the constant 6** — all six weeks are created
  eagerly in one transaction at first touch (`storage.ts:1220` `for (let w = 1; w <= 6; w++)`), ceiling 6
  (`routes.ts:7182`). Confirms `TIME1` independently.
- **Client** `localStorage["planner:active-week"]` ≡ **1** by default (`home-experience-page.tsx:54`);
  **five readers, one writer** (`weekly-planner-page.tsx:276`, fires only on a manual pick), **never seeded**
  from the server. Device-local, so it is not household state at all.
- **Live defect, new to the canon:** Home renders **Week 1's meals** (`:139`) beside **Week 6's plant count**
  (`:160`) — one component, one screen, twenty-one lines apart. Sharper than `EXPCOMP2`'s *"unfalsifiable"*:
  Home does not merely fail against a calendar, **it fails to agree with itself**, deterministically.
- **Both candidates refused**, and for different reasons — each would falsify `HOME2` § 6.1's *theorem*
  (*the door changes when the household's state changes*): `max(weekNumber)` never moves; `localStorage`
  moves when you change **device**. Neither is a household fact. **The resolver is correct; there is
  nothing correct to feed it.**
- **Routes to `TIME1`'s `planner_weeks.weekStartDate` (D14) and to `TIME2`'s consumer audit** — the Home
  door is exactly the consumer `TIME2` exists to enumerate.

## Next action
**Not the route.** Resolve what a week means first — `TIME1`'s `weekStartDate` anchor, via `TIME2`
(interrupted at "Rollback Complete", census dispatched, no dashboard row until this session).
The resolver needs **no further work**: it is total without a week (`week: null` → floor, test § 2 case 3),
so the route is a small, mechanical step **the moment a week means something**.

## Blockers
**The week.** `TRANSLATION1` *Morning Rhythm* § 8 is law and unimplementable; `HOME2` § 8.1 named the
planner's missing calendar anchor as the real blocker. This session found the bill for that gap: it is
no longer only a *future refinement* of the door — **it is why the door cannot be aimed at all**, and it
is already producing a visible contradiction on Home with no door built.
**Home still has no door: the function exists, nothing calls it.**

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
