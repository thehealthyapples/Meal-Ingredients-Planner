# The Healthy Apples — Product Knowledge Registry

**This is the canonical knowledge of what The Healthy Apples _is_.** Its domains,
pages, routes, journeys, capabilities, hidden and admin surfaces, dialogs,
integrations, settings, claims, benefits, glossary, and screenshots — the list
none of the other architectures holds. Platform governs how THA is _built_; the
Source of Truth Register governs which store owns which _fact_; Intelligence
governs how THA _reasons_; Experience governs how a person _encounters_ THA; UI
governs how THA _looks_. This registry owns what THA _is_.

Governed by [`THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`](../architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md),
under the platform-wide [`PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`](../architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md) §9.
**Populated by investigation `PDA1` (2026-07-11).**

---

## The one distinction that makes this work

**Investigations discover; the registry owns; implementations maintain.**

An investigation (in `docs/investigations/`) is history the moment it is written
and is never edited. A registry entry here is **present-tense**, carries a named
human owner, and is **corrected** rather than superseded — staleness in it is a
defect, not drift (Rule PKR15). The PDA1 investigation that populated this
registry cites these entries; it does not restate them, and it did not become
them (Rule PKR3).

For a self-describing domain, **currency is the evidence standard** (Rule KC14):
a food fact is wrong because it was never true; a product fact is wrong because it
_stopped_ being true. Fabrication is nearly impossible here; **staleness is the
whole risk.** Every entry carries `last_verified` and a named owner accountable
for it being true _now_.

## How to use it

- **Find what something is** — browse the section folders below, or open
  [`OWNERS.md`](./OWNERS.md) / [`VISIBILITY.md`](./VISIBILITY.md).
- **Ask who owns it** — [`OWNERS.md`](./OWNERS.md), one flat table (Rule PKR12).
- **Ask who may be told** — [`VISIBILITY.md`](./VISIBILITY.md), the disclosure
  surface: one truth, four audiences, monotonic (Rule PKR23).
- **Read it from code** — you don't. Intelligence reads only the generated
  [`inventory/product.json`](./inventory/product.json) (Rule PKR21), and even then
  _reads, never obeys_ it: no code may branch on the registry (Rule PKR19).

## The two forms, one truth

[`inventory/product.yaml`](./inventory/product.yaml) is the **single act of
authorship** (Rule PKR17). [`inventory/product.json`](./inventory/product.json) is
**generated** from it and never hand-edited. Every record maps to exactly one
prose entry, and every prose entry to exactly one record — a total, bijective
mapping (Rule PKR11) asserted mechanically by
[`scripts/verify-product-inventory.ts`](../../scripts/verify-product-inventory.ts).
Where the two forms disagree, the build is broken — not the reader's
understanding.

```
npx tsx scripts/build-product-inventory.ts    # product.yaml -> product.json
npx tsx scripts/verify-product-inventory.ts   # asserts the registry is true
npx tsx scripts/build-registry-nav.ts         # regenerates OWNERS.md + VISIBILITY.md
```

## The 28 canonical sections

| Group | Sections | Where |
|---|---|---|
| **Structure** | Domains · Pages · Routes · Journeys · Capabilities | [`structure/`](./structure/) |
| **Intelligence** | Intelligence · Companion · Knowledge Capabilities | [`intelligence/`](./intelligence/) |
| **Surfaces** | Admin · Hidden · Developer · Notifications · Dialogs · Wizards | [`surfaces/`](./surfaces/) |
| **Connections** | Integrations · APIs · Settings | [`connections/`](./connections/) |
| **Narrative** | Marketing · Benefits · Competitive Advantages · Help | [`narrative/`](./narrative/) |
| **Assets** | Screenshots · Glossary | [`assets/`](./assets/) |
| **Machine-readable** | JSON · YAML | [`inventory/`](./inventory/) |

> **Hidden Experiences is the reason this registry exists.** Hidden surfaces are
> the fastest-decaying knowledge in any product, and the only record of them is
> usually the memory of whoever built them. See [`surfaces/hidden/`](./surfaces/hidden/) —
> eleven surfaces THA has fully built and links to from nowhere.

## What this registry contains today

154 entries, populated by PDA1: 27 public · 69 household · 51 admin · 7 developer.
An 18-surface [screenshot baseline](./assets/screenshots/) captured against a live
demo household. And, cited throughout, **31 audit findings** — recorded in the
[PDA1 investigation report](../investigations/ux/PDA1_PLATFORM_DISCOVERY_AND_EXPERIENCE_AUDIT.md),
not here, because the registry records what _is_ and the investigation records
what is _wrong_.

---

_This registry is a description, never a dependency. No runtime code reads
`docs/product/`. It is corrected, never defended (Rule PKR15). Owner: Colin Clapson._
