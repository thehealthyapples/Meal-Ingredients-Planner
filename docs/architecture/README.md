# THA Governing Architecture

**This directory is the single canonical home for The Healthy Apples' governing architecture.**
Established 2026-06-30 (GOV-AI1). Architecture documents no longer live in `docs/investigations/` — investigation files there are point-in-time analysis and history only.

Anything in this directory is **governing**: required reading before significant implementation, and enforced by the Architecture Compliance Checklist in `ENGINEERING_WORKFLOW.md`.

> **Architecture Bootstrap (mandatory entry point).** This README is the first thing to read before any significant investigation, recommendation or implementation. The documents listed below are the governing architecture; every proposal and implementation must comply with them. If a proposed change conflicts with the governing architecture: **STOP, explain why, and do not continue until approved.** This bootstrap is enforced as STEP 2 of `ENGINEERING_WORKFLOW.md` (added GOV-AI2, 2026-06-30).

---

## Platform Governance

| Document | File |
|---|---|
| THA Core Architecture Principles | [`ARCHITECTURE_PRINCIPLES.md`](./ARCHITECTURE_PRINCIPLES.md) |
| THA Source of Truth Register | [`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`](./THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md) |
| THA Engineering Workflow | [`ENGINEERING_WORKFLOW.md`](./ENGINEERING_WORKFLOW.md) |
| THA Platform Knowledge Completion Architecture | [`PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`](./PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md) |
| THA Master Evolution Roadmap | [`THA_MASTER_EVOLUTION_ROADMAP.md`](./THA_MASTER_EVOLUTION_ROADMAP.md) |
| THA Recipe Acquisition Architecture | [`THA_RECIPE_ACQUISITION_ARCHITECTURE.md`](./THA_RECIPE_ACQUISITION_ARCHITECTURE.md) |

## Intelligence Governance

| Document | File |
|---|---|
| THA Intelligence Platform Architecture | [`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](./THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) |
| THA AI Capability Registry & Intent Taxonomy | [`THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`](./THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md) |
| THA AI Experience & Conversation Architecture | [`THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`](./THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md) |
| THA Context Composition Engine Architecture | [`THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md`](./THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md) |
| THA Intelligence Discovery & Presentation Principle | [`INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md`](./INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md) |
| THA Companion Card Experience Principle | [`THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md`](./THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md) |

## Domain Intelligence

| Document | File |
|---|---|
| NK1 — Canonical Nutrition Knowledge Platform | [`NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`](./NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md) |
| NK2 — THA Nutrition Methodology | [`NK2_THA_NUTRITION_METHODOLOGY.md`](./NK2_THA_NUTRITION_METHODOLOGY.md) |
| THA Food Intelligence Platform Architecture | [`THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](./THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) |

> Domain Intelligence sits between the domain-agnostic Intelligence Platform above and the Business Domains below: a deterministic, cited reasoning layer that enriches Business Domain data over the Intelligence Platform's Capability Registry, and never owns it. The Nutrition Domain Intelligence comprises NK1 (canonical knowledge definition, promoted under GOV2) and NK2 (decision methodology, promoted under GOV2), which together define what THA should know about nutrition and how to apply that knowledge to help households eat better. These are complementary: NK1 defines the knowledge architecture, coverage, and governance model; NK2 defines the decision principles and practical guidance philosophy that govern how that knowledge is used. Food Intelligence is the reasoning engine that uses both (promoted from investigation `NUT2` under EWO-FI1, 2026-07-03). Future domain-specific reasoning layers belong in this section, not in Intelligence Governance (platform-generic) or Architecture → Capabilities (per-capability cards).

## Architecture → Capabilities

| Document | File |
|---|---|
| Profile / Preferences | [`capabilities/profile.md`](./capabilities/profile.md) |
| Household | [`capabilities/household.md`](./capabilities/household.md) |
| Partners / Supermarkets | [`capabilities/partners.md`](./capabilities/partners.md) |
| Meals / Cookbook | [`capabilities/meals.md`](./capabilities/meals.md) |
| Plan Templates | [`capabilities/templates.md`](./capabilities/templates.md) |
| Analyser (Product / UPF) | [`capabilities/analyser.md`](./capabilities/analyser.md) |

> The Context Composition Engine Architecture (INT17, 2026-07-08) is the single owner of every byte the language model reads as grounding. It names the second view every capability owes — the **Context View** (LLM) alongside the **Full Result** (UI / reports) — and is the only component permitted to serialise, truncate, order, or budget the prompt's CONTEXT DATA block. It supersedes the INT16 Context Compaction Layer, which is deleted, not deprecated. Indexed here at creation, rather than left invisible-by-navigation as `INTA1` §4.1 found four other governing documents to be.

> Each document in `docs/architecture/capabilities/` is the **single canonical Capability Card** for that Intelligence capability — governing architecture, required reading before implementing a binding for it. Promoted from the INT11 Capability Cards specification under EPIC 1.5 (2026-06-30). The Developer Capability Registry below indexes these documents (status, executable intents, owner, link) but does not duplicate their content — the full card exists in exactly one place.

## Implementation Guidance

| Document | File |
|---|---|
| Intelligence Capability Factory | [`INTELLIGENCE_CAPABILITY_FACTORY.md`](./INTELLIGENCE_CAPABILITY_FACTORY.md) |
| Intelligence Developer Capability Registry | [`INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md`](./INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md) |

> Implementation guidance translates the governing architecture into reusable step sequences. It is mandatory reading before implementing the pattern it covers, but it is not governing architecture — it cannot override the documents above.
>
> The Developer Capability Registry is planning documentation only. It records each capability's owner, files, status, and next actions to reduce codebase discovery time for future bindings. It is **not** the Runtime Capability Registry (`server/intelligence/capability-registry.ts`), which owns runtime metadata. Runtime behaviour must not depend on the Developer Capability Registry. For the six capabilities with a canonical Capability Card, the registry indexes the card; it does not restate it — see [Architecture → Capabilities](#architecture--capabilities) above.

---

## Compliance

Every significant implementation must pass the **Architecture Compliance Checklist** in `ENGINEERING_WORKFLOW.md`.

Every **AI-related** implementation must additionally pass the **AI ARCHITECTURE COMPLIANCE** block in `ENGINEERING_WORKFLOW.md`, which confirms it uses the canonical Intelligence Platform, the Capability Registry, and the Intent Engine; reuses existing business services; creates no second assistant; duplicates no conversation state; uses registered capabilities only with permission-aware access; and produces honest gaps rather than fabricated knowledge. **If any check fails: STOP, explain why, do not continue.**

---

## History

The original investigation documents remain at their former `docs/investigations/` paths as short pointer stubs (link stability only). The promoted Intelligence Governance documents were investigations `TIP1`–`TIP3`; the Master Evolution Roadmap was formerly `THA_LAUNCH_ROADMAP.md`. The Nutrition Domain Intelligence documents (NK1 and NK2) were promoted from investigations under GOV2 (2026-07-07) and together establish the canonical knowledge platform and methodology for nutrition guidance across all THA surfaces. The Food Intelligence Platform Architecture document was promoted from investigation `NUT2` (`NUT2_FUTURE_STATE_NUTRITION_VISION.md`) under EWO-FI1 (2026-07-03); the architectural domain was renamed Nutrition → Food Intelligence at promotion — the underlying Food Knowledge stores it consumes keep their existing names and owners, unchanged. The source investigation for the Core Architecture Principles (`docs/investigations/THA_CORE_ARCHITECTURE_PRINCIPLES.md`) is unchanged and remains a genuine historical investigation, distinct from the governing principles here. The Platform Knowledge Completion Architecture was promoted from investigation `docs/investigations/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE_INVESTIGATION.md` under `EWO-PKCA1` (2026-07-03); it names the shared graduation-pipeline/evidence/ownership shape already present across WS0X, WS4B/WS5A/WS6, FS1/FS2, and EL1/EL2, generalising it platform-wide without altering any of those documents — placed in Platform Governance because its scope spans every knowledge domain, not only Food Intelligence.
