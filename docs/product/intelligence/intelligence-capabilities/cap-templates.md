---
entry: cap-templates
name: Templates capability
section: intelligence-capabilities
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-11-10
version: 1
---

# Templates capability

> Companion can read back meal shell templates and your plan templates;
> it cannot yet search, explain, or build one for you.

## What it means for the household

Ask Companion about meal-plan templates — your own, the default one, or a
specific meal shell template — and it can read and return that record.

## What it will never do

It cannot currently search templates by name or tag, explain why a template
looks the way it does, recommend one, or create or edit one on your behalf —
each of those returns an honest gap rather than a guess, because no stored
rationale or search method exists yet for this capability to read.

## Where it lives

| | |
|---|---|
| Registry | `server/intelligence/capability-registry.ts` (`templates`) |
| Binding | `server/intelligence/bindings/templates.ts` |
| Capability Card | `docs/architecture/capabilities/templates.md` |

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-11-10._
