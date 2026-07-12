---
entry: cap-nutrition-knowledge
name: Nutrition & Food Knowledge
section: knowledge-capabilities
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-12
version: 2
---

# Nutrition & Food Knowledge

> Ask about any food, nutrient, benefit or way of preparing it, and get an answer
> traced to a reviewed fact — never an invented one.

## What it means for the household

Ask Apple about a food, a nutrient or a health benefit and it answers from THA's
reviewed food knowledge. The household can approach the same knowledge from any
side — by a food's name, by a nutrient like iron, or by a benefit like gut
health — and get back what THA actually holds about it.

Since PHASE5A it also answers **how a food is prepared**: whether people eat it
raw, frozen, tinned, roasted, smoked, rolled or ground — and whether that changes
anything.

## Preparation: what THA says, and what it deliberately does not

THA will happily tell a household that a preparation **exists** — that people eat
oats rolled, or salmon smoked. That costs nothing to say and is plainly true.

Whether a preparation **changes the nutrition** is a different kind of statement.
It is a health claim, and it goes through exactly the same gate as every other
health claim THA makes: a citation from a trusted source, and a named human who
signed it off.

**Today, no preparation effect has been signed off.** So when a household asks
whether roasting broccoli changes anything, Apple's honest answer is that THA does
not have a reviewed note on it. That is not a missing feature — it is the correct
answer, and giving it is the whole point.

And a distinction that matters more than it looks: THA keeps *"we have evidence it
doesn't meaningfully change"* and *"nobody has reviewed this"* as two different
answers, and will never let the second one dress up as the first. A household
deserves to know which one they are hearing.

## What it will never do

It will never invent an answer. Every fact it gives traces back to a reviewed
entry in the knowledge registry; if no reviewed fact links a food to a benefit,
Apple has nothing to say rather than guessing. A food-to-benefit link is only
shown because someone reviewed and recorded it — never inferred from a nutrient
amount alone.

It will never claim a preparation is *better* on evidence it does not have, and it
will never let a preparation invent a health benefit. Smoking salmon does not make
it good for your heart; the omega-3 was always there.

## Where it lives

| | |
|---|---|
| Registry | `server/intelligence/capability-registry.ts` (`nutrition-knowledge`) |
| Owner service | `server/services/nutrition-knowledge-registry.ts` |
| Architecture | `docs/architecture/NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md` |
| Preparation design | `docs/investigations/knowledge/WS5A_PREPARATION_KNOWLEDGE_ARCHITECTURE.md` |

These own the architecture; this entry only says what the capability means for a
household.

## Related

- [[dom-nutrition]] — the domain this capability serves
- [[page-food-detail]] — where the household reads this knowledge
- [[cap-product-knowledge]] — the sibling capability that answers questions about THA itself

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-12._
