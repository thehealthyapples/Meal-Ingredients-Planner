---
entry: mkt-build-habits
name: Build Better Habits
section: marketing-messages
status: live
visibility: public
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Build Better Habits

> Small changes that add up over time.

## What it is

The third value block on the landing page, carried by a trending-up icon. It
tells a household that THA will help them build lasting habits — that the small
better choices they make will compound into something durable. It is a claim
about change over time, not about a single scan.

## Where it lives

| | |
|---|---|
| Source | `client/src/pages/home-page.tsx#L8-L24` |

## Substantiation gap

**This claim outruns the product.** The mechanism that would reinforce a habit
over time — the Companion's proactive notices, which would notice a pattern and
nudge the household toward it — is built but unreachable. THA promises "small
changes that add up over time," but nothing in the product today follows a
household across days to make them add up.

- **Claimed:** that THA helps a household build better habits, with small
  changes that accumulate over time.
- **Missing:** any reachable feature that observes behaviour over time and acts
  on it. The proactive-notice engine that would do this exists in the codebase
  but is not wired to any surface a household can reach — see
  [[hid-notice-engine]].

This is not softened here on purpose. THA is telling households something on its
landing page that the product does not currently keep.

## Related

- [[page-landing]]
- [[hid-notice-engine]]

## Known defects

- `fnd-unsubstantiated-habits-claim` — the landing page claims a habit-building
  mechanism the product does not currently deliver. See PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
