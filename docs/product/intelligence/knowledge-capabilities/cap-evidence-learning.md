---
entry: cap-evidence-learning
name: Evidence & Learning capability
section: knowledge-capabilities
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-11-10
version: 1
---

# Evidence & Learning capability

> THA notices a pattern in how your household eats, but it never treats a
> household preference as confirmed until you say so.

## What it means for the household

When THA spots a repeating pattern in your choices — for example, consistently
picking pasta over seafood — it can record that as a pending signal and ask
Companion to surface it to you. You can confirm it, decline it, or leave it
pending. Companion can also list your current pending signals when you ask.

## What it will never do

It will never treat a noticed pattern as a confirmed household fact on its own.
A signal only changes how THA plans or suggests for your household after you
explicitly confirm it — the three-gate chain (evidence → detection → your
confirmation) means THA's own observation is never the last word.

## Where it lives

| | |
|---|---|
| Registry | `server/intelligence/capability-registry.ts` (`evidence-learning`) |
| Binding | `server/intelligence/bindings/evidence-learning.ts` |

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-11-10._
