---
entry: cap-partners
name: Partners capability
section: intelligence-capabilities
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Partners capability

> Apple can name the retailers THA can hand a basket to; it will not claim one
> is cheaper than another, because it cannot prove it.

## What it means for the household

Apple can name the supermarkets THA can hand a prepared basket to — the
retailers the household can actually shop with. It answers "who can I send this
basket to?" from a settled list.

## What it will never do

It will not claim one retailer is cheaper than another. THA does not hold proven,
store-by-store prices, so any such comparison would be a guess dressed as fact —
and Apple does not make it. It names who is available; it does not rank them on
price.

## Where it lives

| | |
|---|---|
| Registry | `server/intelligence/capability-registry.ts` (`partners`) |
| Capability Card | `docs/architecture/capabilities/partners.md` |

The Capability Card owns the architecture, including why price comparison is a
recorded gap rather than a feature; this entry only says what the capability
means for a household.

## Related

- [[dom-partners]] — the domain this capability serves
- [[dom-shopping]] — the basket the retailers receive

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
