---
entry: jrn-first-run
name: First run
section: journeys
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# First run

> A new household signs up, tells THA who they are across twelve steps, and lands somewhere useful.

## What it is

The path a brand-new household walks the very first time, from the sign-in
screen through a twelve-step introduction and out onto a page they chose. It
crosses two surfaces — the auth page and the onboarding wizard — and is gated
by email verification in the middle.

## The path

1. **`/auth` — create an account.** The household registers with an email and
   password, or takes the secondary "Start a free trial" route
   (`POST /api/demo/start`, a time-boxed demo that skips signup entirely).
2. **Check your email.** Registration returns `needsVerification`, and the page
   switches to a "Check your email" panel. The household cannot proceed until it
   clicks the verification link — there is a resend button but no way past this
   step in-app.
3. **Verify and sign in.** The link returns to `/auth?verified=1` (a green
   confirmation banner), where the household signs in.
4. **Redirect into onboarding.** Once there is a session, `App.tsx` redirects any
   user whose `onboardingCompleted` is false to `/onboarding`.
5. **Twelve steps.** The wizard ([[wiz-onboarding]]) walks Welcome, Values,
   Approach, Real Food, About You, Allergies, Diet, Style, Choices, Features,
   Tracking, Begin. The four preferences steps (Allergies through Eating style)
   carry a Skip button; all tracking toggles start off.
6. **Choose where to start.** The final step offers five start areas — Cookbook,
   Analyser, Planner, Diary, Pantry.
7. **Land somewhere useful.** "Get started" posts `/api/user/complete-onboarding`
   and routes to the chosen area's route (or `/` if none was picked).

## Where it lives

| | |
|---|---|
| Source | `client/src/pages/auth-page.tsx` |
| Source | `client/src/pages/onboarding-page.tsx` |

## Related

- [[page-auth]] — the sign-in surface this journey begins on
- [[page-onboarding]] — the page that hosts the twelve steps
- [[wiz-onboarding]] — the wizard itself

## Known defects

- `fnd-onboarding-not-resumable` — the wizard's step index is React local state
  (`useState(0)`) and nothing persists progress. If the household leaves before
  the final "Get started", `App.tsx` sees `onboardingCompleted` still false and
  redirects it back to `/onboarding`, where it restarts at step 1 of 12. There is
  no resume. See PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
