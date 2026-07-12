---
entry: ntf-streak-milestone
name: Streak milestone notice
section: notifications
status: hidden
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Streak milestone notice

> A quiet acknowledgement each seventh day of an unbroken streak.

## What it is

A quiet acknowledgement that appears each seventh day of an unbroken streak. It
is a `medium`-priority notice that reads the household's existing streak row and
only surfaces when the current streak is a multiple of seven — a stateless,
honest heuristic for "worth mentioning," never a fabricated "you just crossed
this" claim. A zero streak is silence, not a notice. It is fully implemented and,
today, cannot reach a household.

## Where it lives

| | |
|---|---|
| Source | `server/intelligence/conversation/notice-engine.ts#L198` |

## Why it cannot reach a household

This notice is produced by the Companion Notice Engine, whose output the client
never receives. The client fetches `/api/intelligence/companion/observations`
while the server only serves `/api/intelligence/companion/notices`, so every
fetch 404s and Home's Reminders section renders empty. The notice exists and is
fully implemented, but it cannot currently reach a household. See
[[hid-notice-engine]] for the full endpoint mismatch and the one-line fix.

## Related

- [[hid-notice-engine]] — the unreachable engine that produces this notice

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
