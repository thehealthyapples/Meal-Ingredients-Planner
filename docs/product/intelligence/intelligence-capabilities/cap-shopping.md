---
entry: cap-shopping
name: Shopping capability
section: intelligence-capabilities
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Shopping capability

> Apple can read the shopping list and prepare a basket; it can never place an
> order.

## What it means for the household

Ask Apple what is on the shopping list and it will read it back, and it can
prepare a basket ready to hand to a supermarket. It turns the week's needs into
something the household can act on in one step.

## What it will never do

It can never place an order. Apple prepares a basket and hands it over; the
household completes the purchase itself. There is no checkout, no payment, and
no order placed on anyone's behalf — buying is always a deliberate human act,
never something Apple does.

## Where it lives

| | |
|---|---|
| Registry | `server/intelligence/capability-registry.ts` (`shopping`) |

The registry owns the architecture, including the recorded gap that "prepare a
basket" is not "place an order"; this entry only says what the capability means
for a household.

## Related

- [[dom-shopping]] — the domain this capability serves

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
