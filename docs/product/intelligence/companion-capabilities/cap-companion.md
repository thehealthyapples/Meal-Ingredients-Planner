---
entry: cap-companion
name: Apple
section: companion-capabilities
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Apple

> Ask Apple about your food, your plan, your pantry or your list; it answers
> from what THA holds, proposes actions you must confirm, and says "I don't
> know" rather than guessing.

## What it means for the household

Apple is the household's way of asking THA a question in plain language. Ask
about your food, your plan, your pantry or your list and Apple answers from what
THA actually holds about you. When something could be done, it proposes the
action and waits for you to confirm it. And when THA has no answer, Apple says
"I don't know" rather than making one up.

## What it will never do

Apple carries a hard limit, and the limit is the point:

- **It cannot place an order.** Apple can prepare, propose and explain; buying
  is always yours to complete.
- **It cannot change anything without explicit confirmation.** Nothing is added,
  moved or removed on your behalf until you say yes.
- **It cannot currently answer a single question about THA itself.** Apple can
  talk about your food and your plan, but not about what THA is or what it can
  do — that product knowledge is not yet a capability it can read (see below).

## Where it lives

| | |
|---|---|
| Surface | `client/src/components/conversation/FloatingAssistant.tsx` |
| Gateway | `server/intelligence/conversation/conversation-gateway.ts` |

These own the architecture; this entry only says what Apple means for a
household.

## Related

- [[dom-companion]] — the domain Apple belongs to
- [[cap-product-knowledge]] — the self-knowledge Apple cannot yet read

## Known defects

- `fnd-pkr27-prompt-knowledge` — the risk that product knowledge about THA (or
  about Apple itself) is carried in a prompt or in code rather than read from the
  registry, which Rule PKR27 forbids. See PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
