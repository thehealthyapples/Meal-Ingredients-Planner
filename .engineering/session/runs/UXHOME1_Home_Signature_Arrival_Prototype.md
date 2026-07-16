# UXHOME1 — Home Signature Arrival Prototype

**Session ID:** `UXHOME1_Home_Signature_Arrival_Prototype`
**Rollback identifier:** `rollback/UXHOME1-home-signature-arrival-prototype-20260714` → `e2fa1fbc`
**Stage:** Verifying
**Started:** 2026-07-14

> **Working tree was dirty at tag time** (server-side work by another session, plus
> untracked files — see the opening `git status`). The tag covers **committed state
> only**. This workstream's own files are all NEW or narrowly-scoped edits (listed
> below); it touched none of the pre-existing dirty files.

## Mission

A development-only prototype of the authenticated Home (`home-experience-page.tsx`,
`/home`), proposing a signature arrival moment. Approved to amend UIA §8 to admit a
third, tightly-controlled *signature* typeface first.

## Architecture change (done first, as instructed)

- **UIA §8** rewritten: *"two voices only; no third typeface, ever"* → three families
  (primary UI · display · optional **signature**), with the signature reserved for
  emotionally significant branded moments, forbidden in all functional UI, and kept
  rare by per-surface governance. New checklist item in §18. Rationale recorded in the
  amendment itself and in the report.

## Files changed

- `docs/architecture/THA_UI_ARCHITECTURE.md` — §8 amendment + §18 checklist item.
- `client/src/index.css` — `--font-signature` token, `.text-signature` role,
  `.signature-ink` writing-reveal keyframes.
- `tailwind.config.ts` — comment recording the deliberate absence of a `font-signature` utility.
- `client/src/components/conversation/companion-context.tsx` — additive `withheld`
  channel + `useWithholdCompanion` / `useCompanionWithheld` hooks (default off).
- `client/src/components/conversation/FloatingAssistant.tsx` — reads `withheld` to defer
  its own entrance (still sole owner of its visibility).
- `client/src/App.tsx` — dev-only `lazy()` + `/dev/home-arrival` route.
- `client/src/pages/dev/home-arrival-prototype.tsx` — **NEW** the prototype.
- `scripts/capture-home-arrival-prototype.ts` — **NEW** zero-write screenshot capture.
- `docs/implementation/ux/adoption-register.json` (+ generated `.md`) — new
  `signature-typography` owner; `companion-delight.ts` orphan resolved (now adopted).
- `docs/implementation/ux/UX_HOME_SIGNATURE_ARRIVAL_PROTOTYPE.md` — **NEW** the report.

## Checks

- Typecheck (`typecheck:ci`): 32 pre-existing server-side regressions from the dirty
  tree; **0 in any file this workstream touched** (proven by stashing my files).
- Build (`npm run build`): passes. Prototype chunk **absent** from `dist/` (verified);
  no Caveat font fetch in production CSS.
- Adoption (`adoption:check`): `64 passed · 0 notices · 2 failed` — the 2 failures are
  pre-existing (`HouseholdNutritionPanel.tsx` orphan; 539th raw button), both from the
  dirty tree, **unchanged by this workstream** (proven by stashing my files).

## Next action

Finish desktop + mobile screenshots (chromium lib path being resolved), embed in report,
move row to INDEX.md.
