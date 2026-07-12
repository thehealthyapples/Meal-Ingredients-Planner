---
entry: mkt-guided-promise
name: When you get there, we'll guide you
section: marketing-messages
status: live
visibility: public
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# When you get there, we'll guide you

> The promise made in the last step of onboarding, that THA will guide the
> household through each area when they arrive.

## What it is

The closing promise of onboarding. On the final "Where would you like to start?"
screen, THA tells the household it will start them on their shopping list and
that they can explore the planner, pantry, cookbook and diary anytime — "When you
get there, we'll guide you." It sets the expectation of guidance waiting in each
area of the product.

## Where it lives

| | |
|---|---|
| Source | `client/src/pages/onboarding-page.tsx#L738` |

## Substantiation gap

**No guided tour or coach-mark system exists.** The promise sets an expectation
of hand-holding through each area of THA. What actually waits when a household
"gets there" is a single dismissible one-line hint, shown once, on six of the
surfaces — and nothing at all on the rest.

- **Claimed:** that THA will guide the household through each area as they arrive
  at it.
- **Missing:** any guided tour, coach-mark, or walkthrough. The only in-product
  guidance is [[hlp-first-visit-hints]] — one sentence per surface, dismissed and
  gone.

Left un-softened deliberately: onboarding promises guidance the product does not
provide.

## Related

- [[page-onboarding]]
- [[hlp-first-visit-hints]]

## Known defects

- `fnd-unfulfilled-guidance-promise` — onboarding promises guidance in each area;
  only a one-line first-visit hint on six surfaces exists. See PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
