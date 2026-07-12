---
entry: cap-diary
name: Diary capability
section: intelligence-capabilities
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Diary capability

> Apple can read back what the household recorded, exactly as recorded.

## What it means for the household

Ask Apple what the household ate and it will read the food diary back — exactly
as it was recorded, nothing added and nothing interpreted away. It is the
household's own log, returned faithfully.

## What it will never do

It will not embellish, correct or reinterpret an entry. Apple reads the diary
exactly as recorded and does not write to it — logging what was eaten stays with
the household. What was recorded is what Apple reports.

## Where it lives

| | |
|---|---|
| Registry | `server/intelligence/capability-registry.ts` (`diary`) |

The registry owns the architecture; this entry only says what the capability
means for a household.

## Related

- [[dom-diary]] — the domain this capability serves

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
