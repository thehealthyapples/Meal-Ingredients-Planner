---
entry: dom-companion
name: Apple
section: domains
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Apple

> THA's companion — ask it about your food, your plan or your pantry, and
> it answers from what THA actually knows.

## What it is

Apple is THA's companion — a single assistant a household can ask about its
food, its plan, its pantry and more, reached through a panel that slides in from
the right on any screen. When the thread is empty it offers a few pre-filled
questions suited to wherever the household currently is, and it frames itself
contextually to the surface it is opened on (Planner, Shopping, Cookbook,
Analyser and so on), presenting as "Apple" on the general home surface. There is
one companion and one conversation throughout.

Apple is governing architecture: it never becomes a second assistant or a second
copy of a mechanism the platform already owns, and it may change how something
is said or which already-true fact is surfaced, but never what is true or what is
permitted. That blueprint is defined separately.

## Where it lives

| | |
|---|---|
| Source | `client/src/components/conversation/FloatingAssistant.tsx` |
| Architecture | [THA Companion Platform Architecture](../../../architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md) |

## Related

- [[cap-companion]] — the companion capability
- [[gls-apple]] — the glossary entry for Apple

## Known defects

- `fnd-pkr27-prompt-knowledge` — tracked under PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
