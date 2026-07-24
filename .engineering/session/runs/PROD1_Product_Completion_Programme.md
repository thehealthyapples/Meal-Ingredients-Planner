
# Session: PROD1_Product_Completion_Programme

| Field | Value |
|---|---|
| **Session ID** | `PROD1_Product_Completion_Programme` |
| **Rollback ID** | `rollback/PROD1-product-completion-programme-20260718` |
| **Start time** | 2026-07-18T09:51:08Z UTC |
| **Current stage** | Planning |

## Objective
Complete the remaining product experience using the existing THA architecture — household journeys, house/room experiences, cross-domain UX, commercial readiness, production polish, product consistency, delight and trust. No new architecture, no duplicate capabilities.

## Rollback protection
- Annotated tag `rollback/PROD1-product-completion-programme-20260718` → `729dcb91` (ENGINT2)
- Dirty-tree snapshot `stash@{0}` → `797025208154b3` (231 files; `git stash create`/`store`, tree NOT disturbed)

## SCOPE LOCK
Two independent audits produced one theme: **PX1 built the canonical state owners (`EmptyState`, `LoadError`, `Skeleton`) and rolled them out to Home/Dashboard/Profile, but never to the six rooms in the bottom nav.** PROD1 completes that rollout. It builds NO new component, capability, route, entity or owner.

**IN SCOPE (the rooms rollout + the polish that surrounds it)**
- R1 **Server errors must stop rendering as "you have nothing."** `queryClient.ts:57` sets `retry: false`, so one failed request yields `undefined` forever. Every room then shows its EMPTY state. A household at the supermarket is told their shopping list is empty and invited to retype it. Adopt `LoadError` + `isError`/`refetch` per room.
- R2 Adopt `EmptyState` with the correct `variant` for genuine absences (empty vs filtered).
- R3 404 page — was developer-facing copy (*"Did you forget to add the page to the router?"*) outside the design system.
- R4 `ErrorBoundary` coverage holes — auth, onboarding, `/shared/:token`, logged-out home and the outer `Suspense` have none; a lazy-chunk 404 after redeploy is a white screen.
- R5 Brand logo lands on `/dashboard` while `/home` is canonical (App.tsx:174) — two competing homes.
- R6 `index.html` has no `<title>`, description, or `og:`/`twitter:` tags — `/shared/:token` is the only viral loop and previews as a bare URL.
- R7 Production console drop — 57 `console.*` ship; the repo already recorded a household's recipe reaching a browser console.

**OUT OF SCOPE — reported, deliberately NOT built (each would breach the brief)**
- Billing/payment integration — a new capability and new architecture. The brief forbids both.
- Terms of Service / Privacy Policy — I will not fabricate legal text for an app holding special-category health data. Needs the business, not engineering.
- Enforcing the three `TODO [PREMIUM]` limits — a pricing decision that changes what existing free households can do. Not an engineering call.

## Discovery note — an adoption trap this session hit and corrected
Adopting `EmptyState` on a room WITHOUT adding its `isError` branch makes the defect worse, not better: the false "you have nothing" becomes more confident and better designed. `load-error.tsx`'s own header records exactly this ("The household could not tell 'the server is down' from 'you have nothing'"). The two owners are therefore adopted as a PAIR, per room, never separately.

## Files being modified
- `client/src/pages/{shopping-workspace,meals,weekly-planner,food-diary,pantry,products,meal-detail}-page.tsx` — R1/R2
- `client/src/pages/not-found.tsx` — R3
- `client/src/App.tsx`, `client/src/main.tsx` — R4
- `client/src/components/nav-bar.tsx` — R5
- `client/index.html`, `vite.config.ts` — R6/R7

## Checkpoints
- [x] Architecture read + compliance confirmed; git status confirmed; rollback created
- [x] R3 404 page rewritten in THA's voice + design system
- [ ] R1/R2 rooms rollout
- [ ] R4 ErrorBoundary coverage
- [ ] R5/R6/R7 polish
- [ ] docs/implementation/production/PROD1_PRODUCT_COMPLETION_PROGRAMME.md

- [x] R1/R2 rooms rollout — shopping, cookbook, planner, diary, pantry, analyser
- [x] R4 ErrorBoundary now wraps the outer Suspense (auth, onboarding, /shared/:token, logged-out home, lazy-chunk 404s)
- [x] R6 index.html metadata + og/twitter; verified in the SHIPPED dist/public/index.html
- [x] R7 production console drop; verified 0 `console.*` in the shipped client bundle
- [x] Acceptance capture 7/7 — each room driven with its OWN api call aborted

## Four things the forced-failure capture caught that reading the code did not
0. **Half the Pantry was still lying.** The screenshot showed an honest error card in the Food section and, in the same failure directly below it, "No household items yet." Both sections read the SAME `/api/pantry` query; only one had been fixed. A room is not fixed until every section fed by the failed read stops claiming an absence.
0b. **The checker missed it, then over-corrected.** Literal-string matcher: "No household items" does not contain "no items", so the Pantry passed while visibly failing. Broadened to a shape matcher: it then failed the Cookbook on "No frozen meals yet" — NOT a defect (own `/api/freezer` query, loaded fine, genuinely empty). Now scoped per room to the false claim that room would make about ITS OWN failed data.

1. **The shopping error state was unreachable where it mattered.** The first fix put the `isError` branch inside the `mode !== "add"` block — and the room DEFAULTS to `add` mode, so on a failed load the household was dropped silently into the "add items" composer, which implies an empty list by its mere presence. A load error belongs to the ROOM, not to a mode; it is now a banner across every mode and the composer stays usable.
2. **R5 (logo → wrong home) was a FALSE POSITIVE and is withdrawn.** The audit read `nav-bar.tsx`'s `TopBar`, which is exported with **zero consumers** and never renders at any route or viewport (probed both). The logo a household actually taps is `workspace-header.tsx:272` and already pointed at `/home`. My change to the dead component was reverted rather than claimed as a fix. `TopBar` being unrendered is recorded as debt instead.

**Last checkpoint:** all implementation complete; acceptance 7/7; full `npm test` running

## Verification
- **Acceptance: 7/7** — each room driven with its OWN api request aborted; assertions on RENDERED TEXT, scoped per room to the false claim that room would make about its own failed data.
- `npx tsc --noEmit`: 251 errors, all pre-existing (252 at session start); **zero** in any PROD1-touched file.
- `NODE_ENV=production npm run build`: exit 0. Shipped bundle: **0** `console.*`. Shipped `index.html`: title + description + og + twitter + theme-color + apple-touch-icon all present.
- `npm run adoption:check`: EmptyState 3 → 6 importers, LoadError 9 → 14; the 4 failures are pre-existing and unchanged.
- **`npm test`: exit 0 — 131 suites, 0 failures.** Run after all implementation was complete.
- **Verification account REMOVED** — user 927 / household 561 deleted and confirmed absent (0 rows remaining for both).

## Deliverable
`docs/implementation/production/PROD1_PRODUCT_COMPLETION_PROGRAMME.md` — written, with all nine required sections. Product completion assessed at **~72%**.

## Next action
Confirm the `npm test` aggregate exits 0, then hand to owner. **Owner decisions are the gate on everything material that remains** — billing (no payment SDK exists at all), Terms/Privacy (blocks App Store submission and is a live GDPR exposure for special-category health data), and the three unenforced `TODO [PREMIUM]` limits. All are evidenced with file:line in the report §8 and none was attempted, per the brief.

**Closeout will be REFUSED** by `session-complete.sh` — the DOCGOV1 filing gate was already failing before this session (7 loose reports in `docs/implementation/`, 6 of them pre-existing). Not PROD1's to resolve unilaterally.

## Blockers
<none>

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
