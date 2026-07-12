---
entry: cap-product-knowledge
name: Product Knowledge
section: knowledge-capabilities
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-12
version: 2
---

# Product Knowledge

> Ask what THA is or what it can do, and get an answer from this registry —
> permission-aware, and never a sentence invented by the Companion.

## What it means for the household

Ask Apple "what can you do?", "what is the Planner for?", or "does THA have a
shopping list?" and it answers from this registry — the same entries a person can
read here, in the same words their owner wrote.

Before this capability existed, the Companion could not answer a question about
THA at all. The knowledge sat on disk with nothing able to read it. Now it has a
queryable owner, which is the difference between a product that can explain
itself and one that cannot.

## What it will never do

**It will never invent a fact about THA.** If this registry does not hold an
answer, Apple has none. A question about a surface THA does not have gets an
honest "I don't know" — never a plausible-sounding description of a feature that
was never built. That failure is worse than it sounds: a household has no way to
check a claim about the product, so an invented one is uniquely convincing.

**It will never duplicate what this registry owns.** No sentence about THA is
written into a prompt, a template, or a fallback string. If Apple needs to know
something about THA, it reads it from here (Rule PKR27). A helpful sentence typed
into a prompt would be a second owner of a product fact — never updated when the
product changed, wrong within a quarter, and wrong in the most authoritative
voice THA has.

**It will never tell one household something another may not hear.** Every entry
carries a visibility, and content above the asker's tier is removed *before* Apple
is given anything to read — not shown to it with an instruction to keep quiet.

**It will never explain what it is withholding.** Apple does not say "there's an
admin feature I can't tell you about", because saying so would disclose the very
thing the tier protected. To a household, an admin surface simply does not exist,
and Apple's honest answer is that it does not know — which, at that tier, is true.

## What decides who is told what

The registry **classifies**; it never **authorises**. It labels which audience may
be told a fact. It has no say in who anyone *is* — that remains
`server/lib/access.ts`, unchanged and unshared, so that editing a Markdown file
can never grant anybody access to anything.

Visibility keys on **role**, never on what a household pays. A free household can
be told, fully and accurately, what a premium feature does. They simply cannot use
it. A product that will not explain what it sells is indefensible.

## Where it lives

| | |
|---|---|
| Knowledge | `docs/product/` (authored as `inventory/product.yaml`) |
| Owner service | `server/services/product-knowledge-registry.ts` |
| Capability | `product-knowledge` in `server/intelligence/capability-registry.ts` |
| Architecture | `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md` |
| Implementation | `docs/implementation/knowledge/PHASE5A_KNOWLEDGE_PLATFORM_ACTIVATION.md` |

The architecture document owns the design; this entry records what the capability
is.

## Known defects

- `fnd-pkr27-prompt-knowledge` — **still open.** PHASE5A gives the Companion a
  registry to query, which is what makes Rule PKR27 *possible* to obey. It does
  not prove the rule is *being* obeyed: nobody has yet audited the existing system
  prompts, templates and fallback strings for sentences about THA that duplicate
  this registry. The second narrator is now avoidable. It has not been shown to be
  absent, and this entry will not claim otherwise.

`fnd-no-product-knowledge-capability` is **closed** — the capability exists, is
bound, and is executable.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-12._
