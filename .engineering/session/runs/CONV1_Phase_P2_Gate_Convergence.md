# CONV1 Phase P2 — Make the gate mean something

**Stage:** Complete
**Date:** 2026-07-16
**Rollback ID:** `rollback/CONV1-phase-p2-gate-convergence-20260716` → `7d1dd2ce`
**Type:** Git tag, created **before any file was touched**.

> ⚠️ **The tag is a marker, not a restore point.** `7d1dd2ce` predates every uncommitted P0/P1
> correction in a tree dirty from ~9 concurrent sessions. **A tag checkout would destroy them.**
> To roll back, revert the named files below individually. This is the same qualification the
> P1 milestone recorded, and it still holds.

**Scope:** CONV1 Phase **P2** only — `WRITE-4` · `BEH-8` · the two "Low cost" coherence checks
(CONV1 § 8.2, Horizon 2). No unrelated refactoring.

---

## Mission

Implement CONV1 Phase P2: complete `WRITE-4` and `BEH-8`, and build the two low-cost coherence
checks CONV1 § 8.2 identifies. Create implementation reports.

## Pre-work checkpoints

- [x] Rollback tag created **before any file was touched**
- [x] `git status` confirmed (branch `int1-intelligence-platform`; dirty tree, ~9 sessions)
- [x] `docs/architecture/README.md` read (Architecture Bootstrap, STEP 2)
- [x] `CONV1_ARCHITECTURE_CONVERGENCE_PROGRAMME.md` read — § 3 (`WRITE-4`, `BEH-8`), § 6 (`R2`),
      § 7 (phases), § 8.2 (the three coherence checks; two graded Low)
- [x] `CONV1_PHASE_P1_COMPLETION.md` read — § 7.2, § 8 rank 1–2, § 8.1 correction #2
- [x] `THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md` read — **supplied `BEH-8`'s discriminator**
- [x] Baseline measured, **not inherited** (`CP11`) — see below

## Baseline — measured for this phase (CP11)

`npm run verify:publication` → **FAIL**
- Domains: 22 — 🟢 5 · 🟡 11 · **🔴 6**
- Checks: 60 — **25 pass · 24 warn · 11 fail**
- Red domains: Meals · Meal Templates · Household Dietary Preference · Pantry ·
  Nutrition — Boost/Uplift · Capability Registry

## Corrections to CONV1's inventory (verified at source — lesson `L1`)

1. **`BEH-8`'s capability list is stale.** CONV1 names *5* gated-out capabilities "of a registry
   of 25", including `household-health`. **The live registry holds 24 capabilities and
   `household-health` does not exist.** The live gated-out set is **6**: `product-knowledge`,
   `food-intelligence`, `opportunity-delivery`, `evidence-learning`, `administration`, `developer`.
2. **Two of those six are gated out CORRECTLY and must stay that way.** `administration`
   (`minimumRole: admin`, `knowledgeClass: admin`) and `developer` (`availability: "never"` —
   TIP1 § 7, the developer plane is physically isolated). **The gate's `cr-domain-bridge` check is
   over-broad**: it demands the bridge cover *all* registered capabilities. Obeying it literally
   would make the admin and developer planes Companion-reachable — a privilege escalation.
3. **`BEH-8`'s impact numbers are EXACTLY right.** "6 registry-declared enrichment items and 1
   guidance block": `food-intelligence` 3 + `opportunity-delivery` 1 + `evidence-learning` 2 = **6**,
   and `food-intelligence` carries the **1** guidance block. `product-knowledge` declares **zero**
   of either — it is gated out, but nothing of it is currently killed (latent, not live).
   **The count was right and the names had rotted** — `L1`/`L2`, again.
4. **`WRITE-4`'s declared mechanism does not exist.** The item says converge onto
   `npm run seed:*`, operator-invoked. **There is no `seed:ready-meals`, `seed:food-knowledge` or
   `seed:pantry-knowledge` script.** Unwiring boot without building them would not converge the
   publication path — it would delete it.
5. **`server/lib/seed-ready-meals.ts` imports `log` from `../index`** — a circular import into the
   server's unguarded boot IIFE. Any CLI runner importing the seed would boot the whole server.
   The cycle must break before the declared mechanism can exist.

## `BEH-8` — the design decision, and who made it

The Card vocabulary has **7 terms** (`meal · planner · shopping · pantry · diary · nutrition ·
household`), sourced from `native-discovery.ts`'s `DISCOVERY_DOMAINS`. Three of the four
user-facing gated-out capabilities are **cross-cutting** and fit none of them. This was **put to
the user, not decided** — assigning a Card domain is user-visible presentation, which the
Experience canon owns.

**The user's direction:** *extend the Companion Card vocabulary so it can represent cross-cutting
platform capabilities rather than forcing them into a House domain; preserve the distinction
between user destinations and platform capabilities.*

**The governing document then supplied the discriminator rather than requiring an invention.**
`THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md` line 60: *"**Next Steps** — result-level actions over
the whole set (e.g. View All), **routing to the domain's canonical landing page**."*

> **A Card domain is a destination, because Next Steps route to it.**

And the registry **already declares** which capabilities are not destinations — in their own
descriptions: `food-intelligence` *"owns zero business-domain data, Rule FI1"*;
`opportunity-delivery` *"owns zero business-domain data and zero producer reasoning"*;
`evidence-learning` *"owns zero business-domain data"*. **A capability that owns no
business-domain data has no landing page to route to, because it has no data of its own to land
on.** Forcing `opportunity-delivery → planner` would route a household to the Planner for a fact
the Planner does not own — the false provenance INT17 § 4.5 forbids.

**The vocabulary extension (zero invention, one new term):**

| Class | Meaning | May be a guidance TARGET? |
|---|---|---|
| one of the 7 rooms | a **user destination** — has a canonical landing page | ✅ yes |
| `platform` | a **cross-cutting capability** — attribution only, no landing page | ❌ **never** |
| *absent* | **not Companion-reachable** (`administration`, `developer`) | ❌ never |

All six enrichment items are explanations of *how the platform reasons* ("No citation, no card";
"Patterns, never a single event") — **attribution, never routing.** `food-intelligence`'s guidance
block targets `meals` and `planner` — **both rooms** — so it resolves correctly as a `platform`
source.

## Outcome

**Report:** `docs/implementation/governance/CONV1_PHASE_P2_COMPLETION.md`.
**Both P2 items CLOSED; both coherence checks BUILT** (`npm run verify:coherence`).

- **`verify:publication`: reds 6 → 5** (Capability Registry 🔴 → 🟡); checks **25→31 pass, 11→8 fail**.
  **CONV1 § 7 demanded 6 → 4. It is 5, and reported as 5** — P1 § 8.1 correction 2 required this be
  resolved by measurement. Meal Templates cannot go green in P2: `storage.ts` is still an
  unauthorised writer (an *ownership* decision) and 1,261 stub rows remain (*destructive data
  surgery*). **Refused the alternative — authorising the remaining writers to force 6 → 4 is turning
  a gate green by lowering it.**
- **Coherence gate red on 2 REAL defects, neither in CONV1's 24-item census:** Domain 6 names
  `server/lib/dietRules.ts` (the file is `shared/dietRules.ts`); Domain 18 declares a contest with
  `nutrition-benefit-library.ts`, **which exists nowhere**. *A gate does not get tired at Domain 6.*
- **36 → 2 findings**: three false-positive classes found by verifying every finding at source and
  fixed before shipping (basename shorthand · the retired rival · positional bare-ref binding).
  Coverage surrendered deliberately each time — a false failure is paid out of the gate's
  credibility.
- **Corrected CONV1 § 8.2's own claim:** COH-2 would **not** have caught `household.md`'s
  `:8526–8541` — `routes.ts` has 12,869 lines, so it *resolves*. That rot was semantic, and no
  `file:line` check can see it (`L2` stands).
- **Tests:** 652 assertions green (74·35·139·323·81), 0 failed. **Typecheck: 32 regressions exist,
  none P2's** — proved via `publication-checks.ts`, modified by nobody, carrying the same NEW error.
- **`adoption:check` 64/2 unchanged; `repo-structure-verify` fails only on 2 untracked strays**
  (`.glibcheck.txt`, `.libdirs_uxhome.txt`) from a concurrent session.
- **Not wired into `release:check`** — it is red on defects P2 may not fix. Wiring in a red gate
  manufactures `R2` rather than curing it.
- **Refused:** giving `administration`/`developer` a Companion domain (the gate's literal demand — a
  **privilege escalation**); deleting `CAPABILITY_DOMAIN` without reviving the 6 dead enrichment
  items (**the gate goes green either way** — § 4.5); correcting Domain 6/18 (governing architecture,
  a separate deliberate act).

## Next action

Complete. **Recommended next: correct Domain 6 + Domain 18** — one-line factual corrections, zero
rule change, zero ownership change, which turn `verify:coherence` green and let it be wired into
`release:check`. Then **P3** (`BEH-1`·`BEH-4`·`BEH-7`).
