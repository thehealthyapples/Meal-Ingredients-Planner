# Session: PROD5_Launch_Readiness_And_Trust_Verification

| Field | Value |
|---|---|
| **Session ID** | `PROD5_Launch_Readiness_And_Trust_Verification` |
| **Rollback ID** | `rollback/PROD5-launch-readiness-20260718` |
| **Start time** | 2026-07-18T22:15Z UTC |
| **Current stage** | Complete — awaiting owner review |

## Objective
Verify THA is genuinely launch-ready across nine areas. Do not build capabilities.
Implement only high-value fixes found during verification.

## Rollback protection
- Tag **and** branch `rollback/PROD5-launch-readiness-20260718` → `8e25c195` (HOUSE_ACT3)
- Worktree snapshot `refs/snapshots/PROD5-worktree-20260718` → `e6362f9c` (`git stash create`;
  the working tree was NOT disturbed)
- **Coverage:** tag = committed state; snapshot = tracked modifications only. ~40 untracked
  paths belonging to concurrent sessions are **not** covered and were not touched.

## The de-duplication finding — this reframed the whole session
`docs/investigations/platform/LAUNCH1_THA_LAUNCH_READINESS_AUDIT.md` is a **first-principles launch
readiness audit dated 2026-07-18 — the same day**, at HEAD `24e37d20` (four commits behind
this session). It already reports **~41% build / ~25% commercial readiness** and covers every
area PROD5 names. Re-running it would have produced a second opinion on a six-hour-old
document and called it progress.

So PROD5 was re-scoped, honestly, to what LAUNCH1 could **not** do (its own §8):
1. **Run a browser.** LAUNCH1, HOUSE_ACT1/2/3 and PROD4 all closed "no browser verification".
2. **`npm audit`** — LAUNCH1 explicitly skipped dependency vulnerabilities.
3. **Re-verify at current HEAD** after HOUSE_ACT1/2/3, PROD3/PROD4 and KNOW1.

## Headline: the three-session browser blocker is FALSE
PROD4 recorded, as its top recommendation above any feature, that Playwright Chromium cannot
run here (`libglib-2.0.so.0`) and that **every visual claim by the last four sessions is
unproven**. **It launches fine.** Verified: `chromium.launch()` succeeds, and the full core
journey was driven at 375px — landing → 20-minute demo trial → Home · Planner · Cookbook ·
Pantry · Diary · Nutrition · Analyser.

**Result: all rooms render, zero horizontal overflow at 375px.** That closes the open visual
questions three sessions have been carrying, and it removes the item PROD4 ranked #1.

## 🔴 The most serious finding — the success criterion is NOT met
The mission asked to confirm "every trust gate intact." **They are not.** Two recipe-adaptation
endpoints bypass the household safety gate:

- **`POST /api/planner/entries/:entryId/adapt`** (`routes.ts:9499-9820`) — a **second, ungoverned
  LLM surface**: raw-templates safety data into a prompt, calls `new OpenAI()` directly, embeds a
  weaker rules engine naming only **5** restrictions (canonical library has sesame, soy, shellfish,
  eggs, mustard, fish, peanut — **all absent**), tells the model to substitute *"using best
  culinary judgement"*, **never re-validates the output**, then persists it via `createMeal` as a
  **`household-safe-variant`**. No test covers it.
- **`POST /api/meals/:id/adapt`** (`routes.ts:5375`) — trusts **client-supplied** exclusions; the
  live client sends only `{goal}`, so the list is **always empty**. `recipe-swap-engine.ts` has
  **zero** restriction references (I re-ran the grep: `0`) and proposes **almond flour** (tree
  nut), **smoked tofu** / **soy sauce** (soy).

**All independently re-verified against source before publication.** Reachable harm: a tree-nut
household told to use almond flour; a sesame household offered tahini, saved as "household-safe".

**Why every suite is green anyway:** 19 suites, 1,656 assertions, 0 failures — and **no suite
covers either endpoint**. `test-prod3-companion-restriction-safety.ts:16` greps
`server/intelligence/`, a directory neither hole lives in. The tests enumerate consumers, so they
prove what is connected and can never prove what is missing.

**NOT fixed, deliberately:** 1–2 weeks on two untested endpoints (= LAUNCH1 workstream 3). **A
partially repaired allergy gate is more dangerous than a clearly reported open one.** Escalated to
Phase 0a with "disable the endpoints" offered as the hours-long alternative.

**Self-correction recorded:** PROD5's first draft said "trust gates verified intact" on the
strength of the green suites. That was wrong, and it is the same inference error as the browser
blocker — corrected in place, not quietly amended.

## What was fixed (one change, high-value, verified)
`client/src/pages/onboarding-page.tsx` — `completeMutation` had **no `onError`**. With the
global `retry: false`, one dropped request left the household on step 12/12 with
`onboardingCompleted: false`, and every `ProtectedRoute` redirected them back — a silent,
unrecoverable dead end **at the moment of acquisition**. Added `onError` + destructive toast,
matching the repo's existing convention.
**Verified in a real browser** by aborting the route: the toast renders, the household can retry.

## What was deliberately NOT fixed
- **20 typecheck regressions** (`npm run typecheck:ci` FAILS), incl. shipped source
  `server/lib/pantry-intelligence-assembler.ts`. All the named files are **committed and
  unmodified** — this is committed breakage at HEAD, not concurrent in-flight work. Fixing it
  means building the missing `explainability-service` / `meal-scoring-service` API — feature
  work the mission forbids. **Reported as a launch blocker.**
- The 5 publication FAILs, the licensing exposure, the commercial gaps — all diagnosis, not
  in-scope engineering.

## Verification run
`verify:publication` FAIL (4 red domains, pre-existing) · `verify:coherence` PASS ·
`verify:schema-coverage` PASS 91/91 · `verify:deployment-config` PASS ·
`verify:release-packaging` PASS · `build` exit 0 · `adoption:check` 82/0/0 ·
`typecheck:ci` **FAIL (20 regressions, pre-existing)** · `npm audit` **3 vulns (2 high)**.

## Next action
Owner decision on launch path. Report: `docs/implementation/production/PROD5_LAUNCH_READINESS_AND_TRUST_VERIFICATION.md`.
Top blockers: no payment integration · no account deletion (GDPR) · legal docs written but
unrouted · 20 typecheck regressions · 2 high CVEs · 163 meals under unlicensed source keys.
Highest value / lowest effort remains **KNOW1 F1** — one sign-off command lights 89 benefit
chips; the Nutrition room currently tells households "0 Health benefits supported" **on screen**.
