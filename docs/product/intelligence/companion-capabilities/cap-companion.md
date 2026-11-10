---
entry: cap-companion
name: Companion
section: companion-capabilities
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-11-09
version: 4
---

# Companion

> Ask Companion about your food, your plan, your pantry, your household or your list; it answers
> from what THA holds, proposes actions you must confirm, and says "I don't
> know" rather than guessing.

## What it means for the household

Companion is the household's way of asking THA a question in plain language. Ask
about your food, your plan, your pantry or your list and Companion answers from what
THA actually holds about you. If you share a health concern about yourself or a
dependent, Companion can propose saving the exact statement as reported context
after current health-data consent. You can also ask Companion to save a voluntary
nutrition focus, such as wanting more protein- or iron-rich foods, for your own
profile or a dependent's profile. Both changes are shown for confirmation first.
Nutrition focuses are food preferences, not restrictions, nutrient targets, or
medical conclusions. A reported concern is not a diagnosis and does not establish
that food treats a condition. And when THA has no answer, Companion says
"I don't know" rather than making one up.

When a question could reasonably mean more than one thing, Companion checks its
understanding with you before routing it. If you say no, it asks what you meant;
it uses that short exchange to interpret your next reply when pattern matching
needs help. It does not create a second conversation or guess what you meant.

## What it will never do

Companion carries a hard limit, and the limit is the point:

- **It cannot place an order.** Companion can prepare, propose and explain; buying
  is always yours to complete.
- **It cannot change anything without explicit confirmation.** Nothing is added,
  moved or removed on your behalf until you say yes.
- **It cannot currently answer a single question about THA itself.** Companion can
  talk about your food and your plan, but not about what THA is or what it can
  do — that product knowledge is not yet a capability it can read (see below).
- **It does not diagnose or treat.** Health statements remain labelled as reported;
  condition-specific food guidance needs separately reviewed evidence.
- **A nutrition focus is not a prescription.** Saving “more iron-rich foods” or
  “more protein-rich foods” records the person's preference only; it does not
  calculate a requirement or establish a deficiency.

## Where it lives

| | |
|---|---|
| Surface | `client/src/components/conversation/FloatingAssistant.tsx` |
| Gateway | `server/intelligence/conversation/conversation-gateway.ts` |

These own the architecture; this entry only says what Companion means for a
household.

## Related

- [[dom-companion]] — the domain Companion belongs to
- [[cap-product-knowledge]] — the self-knowledge Companion cannot yet read

## Known defects

- `fnd-pkr27-prompt-knowledge` — the risk that product knowledge about THA (or
  about Companion itself) is carried in a prompt or in code rather than read from the
  registry, which Rule PKR27 forbids. See PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-11-05._
