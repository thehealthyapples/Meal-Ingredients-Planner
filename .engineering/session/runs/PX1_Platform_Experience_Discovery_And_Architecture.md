# Session: PX1_Platform_Experience_Discovery_And_Architecture

| Field | Value |
|---|---|
| **Session ID** | `PX1_Platform_Experience_Discovery_And_Architecture` |
| **Rollback ID** | `rollback/PX1-platform-experience-discovery-architecture-20260712` (tag @ `b4a63af8`) + stash `PX1_ROLLBACK` + `refs/snapshots/PX1_ROLLBACK` (`6ecfdb5`) |
| **Start time** | 2026-07-12 |
| **Current stage** | Complete |

## Objective
Platform Experience Discovery & Architecture. Audit the **craft-consistency**
dimensions of the platform experience that PDA1 never covered, and build the
Platform Experience Architecture layer that no document owns today.

PX1 **discovers and records only** — it implements no product change and no UI change.

## Premise correction (recorded at session start)
The session was opened as "resume PX1". **PX1 had never been started** — no document,
no rollback, no session file, no commit, no reference anywhere in the repository
(searched code, docs, git history, reflog, stashes). This run file is its first artefact.

Its predecessor **PDA1 is COMPLETE**
(`docs/investigations/ux/PDA1_PLATFORM_DISCOVERY_AND_EXPERIENCE_AUDIT.md`):
31 findings, a 154-entry Product Knowledge Registry, an 18-surface screenshot
baseline, and a 6-phase UX transformation roadmap. PX1 does **not** restart it.

## Scope (confirmed with the owner)
PX1 is PDA1's **successor**, not its replacement.

**Audits only what PDA1 did not:** card systems · layout consistency · interaction
consistency · empty states · loading states · feedback mechanisms · mobile behaviour ·
accessibility · performance · component ownership.

**Creates no rival principles.** Canonical experience principles are owned by
`THA_EXPERIENCE_ARCHITECTURE.md` §3 (EXP1/EXP2); visual/component law by
`THA_UI_ARCHITECTURE.md` (UIA2); domain/surface ownership by `docs/product/OWNERS.md`.
PX1 **cites** all three and restates none — restating them would create the second
owner that UIA §17 and Experience Principle 6 forbid.

## The architectural spine — the register UIA §17 mandates but nobody built
`THA_UI_ARCHITECTURE.md` §17 requires an **adoption register**: for each canonical
visual concern, "what it owns, which surfaces have adopted it, which are exempt and
why… authored-but-unadopted must be impossible to hide." It names 14 concerns
(header, navigation, card, dialog, form field, empty state, loading state, error
boundary, status presentation, rating mark, brand mark, icon set, motion vocabulary,
token definitions).

**That register has never been built.** PX1's canonical deliverable is to build it.
PX1 therefore *enforces* the existing architecture rather than adding to it.

## Files being modified
- `docs/implementation/PX1_PLATFORM_EXPERIENCE_DISCOVERY_AND_ARCHITECTURE.md` — the only output.
- No product code. No UI. No new features.

## Checkpoints
<!-- Append one line per checkpoint. Newest at the bottom. -->
- [x] Premise corrected: PX1 never started; PDA1 complete; scope confirmed with owner
- [x] Rollback protection created (tag + stash + snapshot ref); 105 dirty files preserved intact
- [x] Governing law read: EXP §3/§8/§17, UIA §17/§18, PDA1 report + roadmap, OWNERS.md
- [x] 8 parallel dimension audits launched (cards/layout, empty+loading, feedback, interaction, mobile, a11y, performance, component ownership)
- [x] Audit findings collected and de-duplicated against PDA1's 31 `fnd-*` ids — **60 new `fnd-px-*` findings (5 P0 · 20 P1 · 25 P2 · 10 P3), zero duplicates**
- [x] Every load-bearing claim independently re-verified against source before admission
- [x] Finding-id parity checked **both ways** (60 defined ↔ 60 resolved by a workstream). First pass claimed parity falsely — 20 findings, incl. 4 P1s, had no workstream; corrected rather than the claim softened
- [x] Adoption Register built — 14 UIA §17 concerns + 3 PX1 proposes adding (§6)
- [x] Ownership model written (experience · visual · domain · navigation · component)
- [x] Convergence opportunities (13 clusters) + 7 prioritised workstreams written
- [x] Implementation document saved → `docs/implementation/ux/PX1_PLATFORM_EXPERIENCE_DISCOVERY_AND_ARCHITECTURE.md`
- [x] `repo-structure-verify.sh` PASSES (all 9 checks)

**Last checkpoint:** PX1 COMPLETE — discovery + architecture delivered; no implementation performed.

## Path note
The brief named `docs/implementation/PX1_….md` (repository root of `docs/implementation/`).
That path is **forbidden** by `REPOSITORY_CONVENTIONS.md` §4 and is mechanically rejected by
`.engineering/scripts/repo-structure-verify.sh` ("docs/implementation/ has no loose files").
Filed under `docs/implementation/ux/` — the workstream folder that already holds UIA2, EXP2,
UX0 and UX1 — so the gate passes.

## Headline of the audit
**THA's experience defects are defects of adoption, not of knowledge.** Nearly every canonical
owner already exists and is good; it is simply not adopted, and its predecessor was never
retired — the exact failure state `THA_UI_ARCHITECTURE.md` §17 was written to end. §17 mandates
an **adoption register** so that "authored-but-unadopted must be impossible to hide." It has
never been built. PX1 builds it (§6) and creates no new law.

Three concerns are **inert** — specified in code, executing nothing:
- `hover-elevate`/`active-elevate-2` are in the base class of every Button/Badge/Card and are
  **defined nowhere** (`index.css` has 0 occurrences; button/card/badge have 0 `hover:` classes).
  Every control in THA is dead on hover and press.
- `getDialogPresentationClass` returns `""` for modal, drawer **and** sheet — the dialog
  foundation is a no-op, not merely unadopted.
- `prefersReducedMotion()` has **0 consumers**; no `prefers-reduced-motion` query exists.

Two have **no owner at all**: empty state and error state — the two states a household spends
the most time looking at. There is no `EmptyState` and no `ErrorBoundary` anywhere in the client.

Highest-leverage single fix: **one `aria-label` on the apple rating.** The score is rendered as
N `alt=""` images, so it is silent to a screen reader — THA's core question is unanswerable by
ear — and the text equivalent is already written at `AppleRating.tsx:85`.

## Carried forward from PDA1 — RE-VERIFIED AGAINST THE CODE, NOT INHERITED ON TRUST

PDA1's two **P0 security findings are RESOLVED**. They were closed by the later
`TRUST1-S3` workstream, after the PDA1 report was written. Verified by reading the
routes directly — not assumed:

- `fnd-unprotected-admin-endpoints` — **CLOSED.** All three maintenance routes now
  carry the canonical `assertAdmin` guard (`routes.ts:10839` backfill-classifications,
  `:10857` normalise-categories, `:10870` backfill-ambiguous-categories). The no-op
  `(req,res,next)=>next()` slot is gone; `routes.ts:10836` carries the TRUST1-S3 note
  recording the fix.
- `fnd-public-template-writes` — **CLOSED.** `POST /api/meal-templates` (`:5102`) and
  `POST /api/meal-templates/:id/products` (`:5159`) now check `req.isAuthenticated()`;
  `PATCH` (`:5117`), `DELETE` (`:5138`) and `DELETE /api/meal-template-products/:id`
  (`:5171`) now carry `assertAdmin`, on the stated reasoning that global platform
  content is an admin act.

**The alarm PDA1 raised was real and has been answered.** PX1 records the closure so no
future audit re-raises it. This is the audit doing its job on its own inherited state.

**One Phase-0 item does remain open:** `fnd-premium-unenforced` — the three headline
free-tier caps are still stubbed (`routes.ts:847` meals >3, `:3230` analyses limit,
`:5889` planner >2 days/week). `hasPremiumAccess()` is real and enforced elsewhere
(`:6956`, `:7047`), so this is a **commercial-promise** gap, not a household-safety
gap. It is carried into PX1's workstreams at its true severity, not inflated.

## Next action
**Await owner review.** PX1 is discovery + architecture only; implementation has not begun and
must not begin without approval. When it does, `PX1-W0` (stop misinforming the household) is the
gate: five findings, four of them one-file fixes.

## Blockers
none

## Not done (deliberately)
- **No code changed.** 105 pre-existing modified files in the working tree left exactly as found.
- **No commit, no push.** Mission was discovery; commit only when asked.
- **The Adoption Register is specified (§6), not built.** Building it is `PX1-W5.1`. Specifying
  and building are different acts — conflating them is how the platform acquired the dormant
  foundations this audit is about.

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
