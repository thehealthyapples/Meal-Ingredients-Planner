# PDA1 — Prioritised UX Transformation Roadmap

**Investigation output.** 2026-07-11. Owner: Colin Clapson.
**Companion to:** [`PDA1_PLATFORM_DISCOVERY_AND_EXPERIENCE_AUDIT.md`](./PDA1_PLATFORM_DISCOVERY_AND_EXPERIENCE_AUDIT.md).
**Governed by:** [`THA_EXPERIENCE_ARCHITECTURE.md`](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md),
[`THA_UI_ARCHITECTURE.md`](../../architecture/THA_UI_ARCHITECTURE.md),
[`THA_MASTER_EVOLUTION_ROADMAP.md`](../../architecture/THA_MASTER_EVOLUTION_ROADMAP.md).

> **This is a recommendation, not a plan of record.** PDA1 implements nothing. This
> roadmap orders the 31 findings by **household impact** and sequences them so the
> platform gets maximally better per unit of work. Each item cites the finding id it
> resolves; the finding's evidence lives in the audit report, and the surface it
> touches lives in the [registry](../../product/). Nothing here overrides the Master
> Evolution Roadmap — it feeds it.

---

## The organising insight

THA's biggest UX opportunity is **not to build — it is to connect and to name.**
The audit found eleven finished surfaces linking to nothing, a complete notice
engine one endpoint-string away from working, and one product wearing several
names. The highest-leverage work is therefore unusually cheap: much of it is wiring
and renaming, not construction. The roadmap is ordered so that the cheapest,
highest-impact work — and the one genuine safety risk — comes first.

Each item carries a rough **effort** (S/M/L) and the **through-line** it belongs to
(from §8 of the report), because fixing a through-line is worth more than fixing any
single instance.

---

## Phase 0 — Stop the bleeding (do first, regardless of everything else)

The one place where what THA promises is ahead of what it enforces, and the promise
is *safety*. These are not UX niceties; they are the reason to gate this whole
roadmap behind them.

| # | Do this | Resolves | Effort | Why first |
|---|---|---|---|---|
| 0.1 | Add the admin guard (`assertAdmin`) to the three unprotected `/api/admin/*` maintenance routes. | `fnd-unprotected-admin-endpoints` | S | Anonymous callers can trigger bulk data rewrites today. A one-line middleware per route. |
| 0.2 | Require authentication (and ownership) on the five meal-template write routes. | `fnd-public-template-writes` | S | Anonymous global-template CRUD. Same shape of fix. |
| 0.3 | Decide the free/premium line and enforce it — or stop advertising it. Wire the three stubbed `TODO [PREMIUM]` caps, or remove the tiering claims until they are real. | `fnd-premium-unenforced`, `fnd-no-upgrade-path` | M | The tier is currently cosmetic and there is no way to upgrade; either close the loop or stop making the promise. |

> Phase 0 is security-shaped and belongs to engineering as much as to UX. It is in
> this roadmap because a household that is told it is safe, and is not, is a UX
> failure of the most serious kind. **Recommend a focused security review before any
> of these are shipped** — the audit confirmed the three findings, but the fix must
> be verified, not assumed.

## Phase 1 — Connect what is already built (highest leverage)

Through-line: **built but unreachable.** Every item here lights up finished work.
This is where THA gets dramatically better for the least construction.

| # | Do this | Resolves | Effort | Impact |
|---|---|---|---|---|
| 1.1 | Fix the notice-engine wiring: align the client fetch path and the response key so Home's Reminders populate. Two edits (path + payload key), not one. | `fnd-dead-reminders`, `fnd-unsubstantiated-habits-claim` | S | Turns on the entire proactive-notice system — the reason Home has a Reminders section — and makes the "Build Better Habits" claim true. |
| 1.2 | Complete the cook→diary journey: on marking a planned meal cooked, write it to the Diary rather than only to `localStorage`. | `fnd-cooked-never-reaches-diary` | M | The Diary starts reflecting what was actually eaten; the flagship journey stops stopping short. |
| 1.3 | Fix the broken `/shopping` menu link (route it, or point the control at the real route). | `fnd-broken-shopping-link` | S | Removes a primary-nav dead end. |
| 1.4 | Triage the eleven Hidden Experiences: for each, **link it, or retire it.** Quick-meal, supermarkets, the add-recipe chooser and the alternate shopping surface are finished; the dormant chrome and dead files should be deleted. | Hidden Experiences section; `fnd-unretired-predecessors` | M | Converts "unmaintained secret" into either product or clean removal. Nothing built should sit unreachable. |

## Phase 2 — Make one product feel like one product

Through-line: **one thing, many names.** No construction — this is naming, routing
and component consolidation. High perceived-quality return.

| # | Do this | Resolves | Effort | Impact |
|---|---|---|---|---|
| 2.1 | Pick one name for the 1–5 rating (the glossary says **THA Score**) and rename every surface to it. Separately, rename the 0–100 "Health Score" so it never collides with the rating. | `fnd-score-name-collision` | M | The household's central quality signal stops meaning two things under five names. Glossary `gls-tha-score` is the canonical source. |
| 2.2 | Collapse the two rating components into one. | `fnd-two-apples` | S | One score, one range, one render. |
| 2.3 | Choose one basket name and one shopping surface; retire the second (UI Principle 5). Collapse the alias sprawl to one canonical route each. | `fnd-shopping-duplicate`, `fnd-alias-sprawl` (basket naming: `gls-basket`) | L | Ends the two-shopping-experiences split and the five-routes-one-basket confusion. |
| 2.4 | Reconcile the "Nutrition" / "Plants enjoyed" / `/plant-diversity` names to the glossary term. | `fnd-route-name-drift` | S | One feature, one name. |
| 2.5 | Resolve the Home/Dashboard overlap: make one the canonical overview and demote or fold the other. | `fnd-home-dashboard-rivalry` | M | A household stops wondering which screen is *the* overview. |

## Phase 3 — Finish the journeys that stop one step short

Through-line: **journeys that stop one step short.** Each is a start that was built
without its finish.

| # | Do this | Resolves | Effort | Impact |
|---|---|---|---|---|
| 3.1 | Persist onboarding step state so an interrupted first run resumes where it left off. | `fnd-onboarding-not-resumable` | M | The 12-step first run survives an interruption instead of restarting at zero. |
| 3.2 | Persist in-progress recipe imports (the slowest cookbook step) so leaving does not lose them. | `fnd-import-not-resumable` | M | Half-finished imports survive a navigation. |
| 3.3 | Deliver the guidance onboarding promises — a real first-visit tour keyed on the stored `tha_preferred_start_area`, or stop promising it. | `fnd-unfulfilled-guidance-promise` | M | Keeps the promise made at the most hopeful moment of the product. |
| 3.4 | Preserve a shared plan's name/description/season (and ideally sharer context) on import. | `fnd-shared-plan-intent-lost` | S | A shared week arrives with the context that made it worth sharing. |
| 3.5 | Give the food-detail page real back-navigation and its header chrome. | `fnd-food-detail-back`, `fnd-food-detail-chrome` | S | A food stops ejecting the household to the Cookbook and stops reading as a lesser surface. |
| 3.6 | Give the Not Found page a way home. | `fnd-notfound-dead-end` | S | A mistyped URL stops stranding the household. |
| 3.7 | Make Home's "today" robust — derive it from a stored plan date rather than a client `getDay()` against mirrored localStorage. | `fnd-derived-today` | M | The calmest surface stops resting on the most fragile derivation. |

## Phase 4 — Turn the Companion toward THA itself

Through-line: **the product can't yet speak about itself.** PDA1's own output — the
populated registry — is the precondition. This phase is the payoff.

| # | Do this | Resolves | Effort | Impact |
|---|---|---|---|---|
| 4.1 | Register **Product Knowledge** as a queryable Knowledge Capability (Rule PKR20): a Capability Card, registered intents, permission-aware access, reaching the model only as an INT17 Context View over the generated inventory (Rule PKR21). | `fnd-no-product-knowledge-capability` | L | The Companion can finally answer "what is THA / how do I / what does premium do" — from owned, current, permission-filtered knowledge. This is the registry becoming a platform asset. |
| 4.2 | Move the one hard-coded product-identity line out of the system prompt and source it from the registry. | `fnd-pkr27-prompt-knowledge` | S | Closes the single narrow PKR27 gap. Low urgency — the broad concern was refuted. |
| 4.3 | Capture the admin/developer screenshot baseline (admin session), closing the residual gap. | `fnd-no-screenshot-baseline` | S | Completes the visual baseline across all tiers. |

## Phase 5 — Design-system hygiene (ongoing)

Through-line: tech debt that quietly erodes craft. Do continuously, not as a
milestone.

| # | Do this | Resolves | Effort |
|---|---|---|---|
| 5.1 | Adopt the canonical dialog foundation across the 89 modal surfaces, or retire it if it is not the intended standard. | `fnd-dialog-foundation-unadopted` | L |
| 5.2 | Fix the inverted destructive-action defaults so "delete" is never the visually prominent choice. | `fnd-destructive-guard-inverted` | S |
| 5.3 | Move meal-photo storage off the local disk to durable storage. | `fnd-ephemeral-media` | M |
| 5.4 | Wrap `/admin/knowledge-review` in the shared admin banner like every other admin route. | `fnd-admin-chrome-inconsistency` | S |
| 5.5 | Present the Highly-UPF warning as a calm inline observation rather than a blocking modal. | `fnd-observation-as-modal` | M |

---

## Sequencing rationale

- **Phase 0 gates everything** because it is the only *safety* gap and the fixes are
  small.
- **Phase 1 before Phase 2** because connecting built work delivers new capability;
  renaming delivers coherence. New capability first.
- **Phase 4 after the registry exists** — which, as of PDA1, it now does. This is the
  first time turning the Companion toward THA itself is even possible.
- **Effort is a hint, not an estimate.** Every "S" is a claim to be checked against
  the code the finding cites before it is scheduled.

## What this roadmap is not

It is not a commitment, a set of tickets, or an override of the Master Evolution
Roadmap. It is the audit's considered opinion on what would make THA best for the
household, fastest — offered to the roadmap that owns scheduling, and to the
engineer who will verify each finding before acting on it.

---

_Investigation output PDA1. The findings are the audit's; the surfaces are the
[registry](../../product/)'s; the schedule is the [Master Evolution Roadmap](../../architecture/THA_MASTER_EVOLUTION_ROADMAP.md)'s._
