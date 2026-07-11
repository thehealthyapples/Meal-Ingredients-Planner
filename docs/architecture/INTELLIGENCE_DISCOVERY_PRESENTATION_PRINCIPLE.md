# THA Intelligence Discovery & Presentation Principle — Governing Document

**Status:** GOVERNING ARCHITECTURE — required reading before any Intelligence discovery, response, or presentation work
**Classification:** Intelligence Governance (canonical)
**Adopted:** 2026-07-02 (EWO-ARCH-INT01)
**Governing documents:** [`ARCHITECTURE_PRINCIPLES.md`](./ARCHITECTURE_PRINCIPLES.md), [`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`](./THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md), [`ENGINEERING_WORKFLOW.md`](./ENGINEERING_WORKFLOW.md)
**Sits within:** [`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](./THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) (the platform), [`THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`](./THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md) (the experience)

> **What this document is.** A single governing principle that draws a hard ownership boundary between what the Conversation does, what canonical THA pages do, and what external sources do. It **names and elevates** a rule that the platform architecture already implies (TIP1 "knowledge indexed, never re-owned"; TIP3 "conversation holds references, never business data") and that the Intelligence Platform now enforces structurally in code (see [INT36](../implementation/intelligence/INT36_NATIVE_THA_DISCOVERY_RESPONSES.md)). It introduces **no new entity, owner, service, capability, or business logic** — it clarifies ownership so no future workstream blurs it.

---

## THE PRINCIPLE

> **The Conversation discovers content. Canonical THA pages own presentation and interaction. External sources provide provenance only.**

This is the governing rule for every Intelligence surface that finds THA content and hands it to a human. It is a specialisation of Core [Principle 4](./ARCHITECTURE_PRINCIPLES.md#principle-4--runtime-consumes-one-assembled-model-per-entity) (runtime consumes one assembled model per entity) and Core [Principle 6](./ARCHITECTURE_PRINCIPLES.md#principle-6--no-fabricated-knowledge--honest-gaps-over-invented-facts) (no fabricated knowledge), applied to the discovery→presentation boundary.

---

## OWNERSHIP — THE THREE OWNERS

### 1. The Conversation owns discovery

The Conversation (the one assistant of TIP3, over the TIP1 spine) is responsible for:

- **Understanding intent** — parsing what the human wants (via the Intent Engine / resolvers).
- **Discovering canonical THA entities** — invoking the discovery capabilities to find the relevant Meals, Templates, Planner entries, Shopping items, Pantry items, Diary entries, Foods, Household members.
- **Summarising results** — writing the natural-language answer over what was found.
- **Suggesting next steps** — offering the registered actions that operate on the discovered entities (Open, Add to Planner, Add to Shopping, View All, …).

The Conversation's output is a **summary plus references and actions**. It carries *pointers* to canonical THA entities — never a copy of the entity, never a rendered page, never an external artefact. This is the TIP3 conversation-store rule (references + outcomes, never business data) applied to discovery output.

### 2. Canonical THA pages own presentation and interaction

The canonical THA page for an entity is the single owner of:

- **Presentation** — how the entity looks and reads.
- **Interaction** — how a human acts on it in the UI.
- **Editing** — every mutation of the entity's own fields.
- **Navigation** — the routes into and around the entity.
- **Provenance display** — showing where the entity's content originally came from (e.g. the source website on Meal Detail).

A discovery response **links to** the canonical page; it does not reproduce it. When a human wants to see, act on, or edit a discovered entity, they are taken to that entity's canonical THA page, which is the sole surface that renders and mutates it. The Conversation never becomes a second place where THA content is presented, edited, or navigated.

### 3. External sources own provenance only

External sources (e.g. the original recipe website behind an imported meal) own exactly one thing:

- **Original attribution / provenance** — the record of where the content came from.

External provenance is displayed **only** on the owning canonical THA page (e.g. `sourceUrl` on Meal Detail). It is never promoted into a discovery response as a primary link, a card image source, or a navigation target. An external URL is a provenance artefact, not a THA destination.

---

## OWNERSHIP MAP

| Concern | Owner | Not the owner |
|---|---|---|
| Understanding intent | **Conversation** | canonical pages, external sources |
| Discovering canonical THA entities | **Conversation** | canonical pages, external sources |
| Summarising results | **Conversation** | — |
| Suggesting next steps (actions) | **Conversation** | — |
| Presentation of an entity | **Canonical THA page** | Conversation, external sources |
| Interaction with an entity | **Canonical THA page** | Conversation |
| Editing an entity | **Canonical THA page** | Conversation |
| Navigation | **Canonical THA page** | Conversation |
| Provenance **display** | **Canonical THA page** | Conversation, external sources |
| Original attribution / provenance **record** | **External source** | Conversation, canonical pages |

Each concern appears in exactly one "owner" column. If the Conversation needs presentation, it **links** to the canonical page; if a canonical page needs provenance, it reads the external source's attribution — nothing is copied across the boundary.

---

## THE FIREWALL (the non-negotiable lines)

1. **Discovery links are canonical THA references, never URLs.** A discovery result references a THA entity by `{ type, id }` where `type` is a canonical THA page and `id` is the canonical id. A discovery link can never be an external URL.
2. **The Conversation never renders or edits an entity.** It summarises and refers; presentation, interaction, and editing happen on the canonical page the reference points at.
3. **Provenance stays on the owning page.** External `sourceUrl`/attribution appears only where the entity is owned and displayed (e.g. Meal Detail), never as a primary link inside a discovery response.
4. **No fabricated presentation fields.** Card/summary fields (title, THA image, servings, Apple score, last cooked, …) are populated only when a canonical source exposes them; otherwise they are honestly omitted, never invented — inheriting Core Principle 6 and the platform's non-fabrication discipline.

---

## HOW THIS EXTENDS (does not duplicate) EXISTING GOVERNANCE

This principle is the discovery→presentation face of rules already in force. It restates none of them; it names the boundary they jointly imply.

| Existing governance | What it already says | What this principle adds |
|---|---|---|
| Core Principle 4 — one assembled model per entity | Every surface reads one assembled model; never re-resolves identity | The Conversation is such a surface: it *refers*, the canonical page *presents* |
| Core Principle 6 — no fabricated knowledge | Honest gaps over invented facts | Presentation fields in discovery responses obey the same non-fabrication rule |
| TIP1 §3 — knowledge indexed, never re-owned | TIP is a consumer of every fact, never an owner | Generalises "never re-owned" from knowledge to **presentation and provenance** |
| TIP3 Part 3 — conversation holds references, never business data | One conversation store of turns + references | Discovery output is such a reference set: pointers to canonical pages, not copies |
| TIP3 Part 4 — context is derived, never stored twice | Context Frame is per-turn read state | Discovered entities are referenced, re-read live on the canonical page |

---

## ENFORCEMENT

- **In code (today):** [INT36 — Native THA Discovery Responses](../implementation/intelligence/INT36_NATIVE_THA_DISCOVERY_RESPONSES.md) enforces the firewall structurally — discovery cards carry only `ThaEntityRef` (`{ type, id }`), the builder never reads `sourceUrl`, and provenance remains solely on the Meal Detail read projection. This principle is the governing statement that implementation satisfies.
- **In review:** Any Intelligence discovery, response-shaping, or presentation change must confirm compliance under the **AI ARCHITECTURE COMPLIANCE** block of [`ENGINEERING_WORKFLOW.md`](./ENGINEERING_WORKFLOW.md). A change that lets the Conversation render/edit an entity, that surfaces an external URL as a primary discovery link, or that copies presentation/provenance across the boundary **must STOP, explain why, and not continue until approved.**

**Fail tests:**
- A discovery response whose link resolves to anything other than a canonical THA page → fail.
- The Conversation presenting or editing entity content in place instead of linking to the canonical page → fail.
- An external `sourceUrl` surfaced as a primary discovery link or navigation target → fail.

---

*Required reading before any Intelligence discovery, response, or presentation implementation.*
*Extends — does not supersede — the Intelligence Governance documents above.*
*Rollback: this document only — `git checkout HEAD docs/architecture/INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md` (or delete the file to revert).*
