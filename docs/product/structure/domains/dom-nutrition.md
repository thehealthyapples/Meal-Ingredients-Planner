---
entry: dom-nutrition
name: Nutrition
section: domains
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Nutrition

> An honest picture of how varied and how whole the household's food
> actually is, and what to try next.

## What it is

Nutrition shows a household how varied and how whole its eating really is. The
Foods view reports plant diversity for the week — which plant families have
been eaten and how close the household is to a wide range. The Nutrients view
tracks the household's macro and micronutrient intake over time and flags gaps.
Two further views, Benefits and Suggestions, are present in the interface but
marked as coming soon; today they point the household back to the Foods and
Nutrients views and to planning.

What THA canonically knows about nutrition — foods, nutrients, health benefits,
and the evidence gates behind them — is governing architecture defined
separately.

## Where it lives

| | |
|---|---|
| Route | `/plant-diversity` |
| Source | `client/src/pages/plant-diversity-page.tsx` |
| Knowledge | [NK1 Canonical Nutrition Knowledge Platform](../../../architecture/NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md) |

## Related

- [[page-nutrition]] — the page that renders this domain
- [[page-food-detail]] — a single food in full
- [[jrn-understand-nutrition]] — making sense of the household's nutrition
- [[cap-nutrition-knowledge]] — the nutrition knowledge capability

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
