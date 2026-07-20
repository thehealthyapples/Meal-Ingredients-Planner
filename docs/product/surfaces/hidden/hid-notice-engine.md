---
entry: hid-notice-engine
name: Companion Notice Engine (reachable since PHASE5E)
section: hidden-experiences
status: internal
visibility: admin
owner: Colin Clapson
last_verified: 2026-07-20
version: 2
---

# Companion Notice Engine (reachable since PHASE5E)

> The proactive notices the Companion holds — gathered from existing owners,
> capped by the Silence Rules, and voiced in the household's chosen personality.

## What it is

The Notice Engine is a server engine that produces proactive notices for the
household from facts existing platform owners already computed. It invents
nothing, applies the Silence Rules server-side (at most two notices per moment,
ranked by attention, deduped), and never reasons on its own behalf.

Its live categories are: nutrition trend, planner gap, pantry opportunity,
shopping opportunity, cookbook opportunity, nutrition opportunity, seasonal
highlight, household learning, and — since PRESENCE2 — **household story**.

## Where it lives

| | |
|---|---|
| Engine | `server/intelligence/conversation/notice-engine.ts` |
| Server route | `GET /api/intelligence/companion/notices` (`server/routes.ts`) |
| Voice seam | `phraseNotice` (`server/intelligence/conversation/behaviour-engine.ts`) |
| Client hook | `client/src/hooks/use-companion-notices.ts` |
| Surface | `client/src/components/conversation/FloatingAssistant.tsx` |

## Corrections — this entry was wrong for nine days

*Corrected 2026-07-20 (PRESENCE2, Rules PKR15 / KC14).* Every substantive claim
in version 1 of this entry is now false, and most of them were already false when
it was last verified as true:

1. **"Unreachable" is wrong.** Version 1 described a double endpoint mismatch —
   the client fetching `/api/intelligence/companion/observations` while the
   server served `/notices`, and a `{ observations }` vs `{ notices }` payload
   disagreement. **PHASE5E fixed both**, retiring
   `use-companion-observations.ts` in favour of `use-companion-notices.ts`. The
   file this entry cites as evidence no longer exists.
2. **"Seven kinds" is wrong.** There are nine live categories, listed above.
3. **"The whole reason Home has a Reminders section" is wrong.** `UX3` removed
   Home's Reminders section entirely and moved the read to the Companion, where
   it lights the emblem's `aware` state in every room rather than speaking in
   one. Rooms report; the Companion interprets (GEA8).
4. **`fnd-dead-reminders` is closed** by the same change.

This is the exact failure mode Rule KC14 names for a self-describing knowledge
domain: a product fact is wrong because it *stopped* being true, and a stale
entry is indistinguishable from a fresh one by reading it.

## What PRESENCE2 changed

- **Two producers retired** under GEA13 — [[ntf-streak-milestone]] and
  [[ntf-diversity-milestone]]. They were the last two scoring surfaces in the
  platform, and both were the Companion's own.
- **One producer added** — [[ntf-household-story]], surfacing the existing Story
  Engine. No observation logic was created.
- **A live defect fixed.** The notices list rendered only when the household had
  no conversation history, while the emblem's `aware` state was set from notice
  count alone in every room. So for any household that had ever sent a message,
  the Companion lit up to say it was holding something and then showed them their
  old thread. `aware` was a promise the panel could not keep.

## Related

- [[cap-companion]] — the one voice permitted to speak a notice
- [[ntf-household-story]] — the category PRESENCE2 added
- [[ntf-nutrition-trend]] — a notice this engine produces
- [[page-home]] — no longer a consumer; see correction 3 above

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-20._
