---
entry: mkt-trial-discount
name: 25% off your first 6 months
section: marketing-messages
status: live
visibility: public
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# 25% off your first 6 months

> The discount offered to a demo household as their twenty minutes run out.

## What it is

The offer in the trial banner. As a demo household's twenty-minute trial counts
down, the banner invites them to save their progress and "get 25% off your first
6 months" by leaving an email; on submit it confirms "Got it! Your 25% discount
code is on its way." It is THA's one moment of commercial ask.

## Where it lives

| | |
|---|---|
| Source | `client/src/components/TrialBanner.tsx#L89` |

## Substantiation gap

**There is nothing for the discount to be applied to.** THA has no pricing page,
no plan description, and no in-product path from free to premium. The banner
offers 25% off a subscription that the product never names, prices, or lets a
household buy.

- **Claimed:** 25% off the first six months, with a discount code sent by email.
- **Missing:** any premium plan, any price the discount reduces, and any route
  from the free product to a paid one. A household that submits its email is
  promised a code against a product that does not exist yet.

Not softened: the offer is live copy, and the thing it discounts is not.

## Related

- [[ntf-trial-banner]]

## Known defects

- `fnd-no-upgrade-path` — THA has no pricing, no plan, and no free-to-premium
  path, so the discount has no referent. See PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
