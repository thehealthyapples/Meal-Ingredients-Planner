# THA Companion Card Experience Principle — Governing Document

**Status:** GOVERNING ARCHITECTURE — required reading before any Intelligence conversation-presentation work
**Classification:** Intelligence Governance (canonical)
**Adopted:** 2026-07-02 (EWO-ARCH-INT02)
**Extends:** [`INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md`](./INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md) (does **not** alter its ownership boundary)
**Governing documents:** [`ARCHITECTURE_PRINCIPLES.md`](./ARCHITECTURE_PRINCIPLES.md), [`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`](./THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md), [`ENGINEERING_WORKFLOW.md`](./ENGINEERING_WORKFLOW.md)
**Sits within:** [`THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`](./THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md) (the experience), [`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](./THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) (the platform)

> **What this document is.** The single governing statement that **names Companion Cards as the canonical Intelligence Experience pattern**. It is the presentation-layer face of the [Intelligence Discovery & Presentation Principle](./INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md): where that principle draws the ownership boundary (the Conversation discovers; canonical THA pages own presentation; external sources own provenance), this principle names the **one reusable UI vocabulary** the Conversation uses to present what it discovers. It introduces **no new entity, owner, service, capability, or business logic**, and it **does not alter ownership** — it constrains *how* discovery output is rendered so no future workstream invents a domain-specific conversation layout that blurs the boundary.

---

## THE PRINCIPLE

> **Conversation responses are composed from reusable Companion Cards. Canonical THA pages remain the single owner of presentation, interaction, editing and provenance.**

A Companion Card is a compact, mobile-first summary of a canonical THA entity that lives *inside a conversation response*. It is a **companion** to the canonical page, never a replacement for it. It exists to help a human understand quickly and move to the canonical page to act.

---

## WHAT COMPANION CARDS EXIST TO DO

A Companion Card may only:

- **summarise information** — a compact, honest précis of a canonical entity;
- **provide quick understanding** — the few canonical facts that orient a human;
- **surface key insights** — what matters about this entity right now;
- **present appropriate Next Steps** — the registered actions that operate on the entity;
- **navigate to canonical THA pages** — every action is a link to the entity's canonical page.

## WHAT COMPANION CARDS MUST NEVER DO

A Companion Card must never:

- **duplicate canonical pages** — it is a summary, not a second rendering of the entity;
- **own business data** — it holds references (`{ type, id }`) and projected display fields, never the source of truth;
- **own editing** — no mutation happens on a card; editing happens on the canonical page;
- **own provenance** — external attribution stays on the canonical page, never on a card;
- **bypass canonical navigation** — every action routes to a canonical THA page.

This **extends** the Intelligence Discovery & Presentation Principle and **does not alter ownership**: the Conversation still only discovers, summarises and refers; canonical THA pages still own presentation, interaction, editing, navigation and provenance display; external sources still own provenance record only.

---

## THE CANONICAL LAYOUT

Every Intelligence conversation response that presents discovered entities is composed in exactly this order:

```
Summary
   ↓
Companion Cards
   ↓
Next Steps
```

- **Summary** — one honest, human, markdown-free line of what was found.
- **Companion Cards** — one card per discovered canonical entity, each with its own canonical THA actions (e.g. Open Meal · Add to Planner · Add to Shopping).
- **Next Steps** — result-level actions over the whole set (e.g. View All), routing to the domain's canonical landing page.

### Meal Companion Card (the first implemented card)

Displays available **canonical** information only — never fabricated (Core [Principle 6](./ARCHITECTURE_PRINCIPLES.md#principle-6--no-fabricated-knowledge--honest-gaps-over-invented-facts)):

- Meal title
- THA image (the canonical entity image — never an external source image)
- Servings
- Apple Score (when a canonical source exposes it)
- Last cooked (when a canonical source exposes it)

Supported canonical THA actions — every one **navigates** to the meal's canonical THA page, the single owner of those very actions:

- Open Meal
- Add to Planner
- Add to Shopping

---

## THE FIREWALL (the non-negotiable lines)

The conversation must **never** display:

1. **Raw markdown** — summaries are sanitised to plain human text before display.
2. **Markdown image syntax** — images are rendered from the canonical `imageUrl` field as an image source, never as `![…](…)` markup.
3. **External URLs** — no card, action, or Next Step target is ever an external URL; every navigation target is a canonical in-app THA path.
4. **Provenance links** — external attribution (`sourceUrl`) is surfaced **only** on the owning canonical THA page (e.g. Meal Detail), never on a card.

The one URL a card may carry is the entity's own **canonical THA image** (`imageUrl`), which THA owns as part of the entity — an image source, never a navigation target.

---

## REUSE ACROSS EVERY INTELLIGENCE DOMAIN

Companion Cards are a **single, domain-agnostic framework**. Meal discovery gets rich meal cards; every other domain flows through the **same** card framework and the **same** Summary → Cards → Next Steps layout:

> **Planner, Shopping, Pantry, Nutrition, Diary, Household, Profile** must adopt the Companion Card framework rather than creating domain-specific conversation layouts.

A new domain plugs into the existing Native Discovery Response ([INT36](../implementation/intelligence/INT36_NATIVE_THA_DISCOVERY_RESPONSES.md)) contract and renders through the existing card view model — no per-domain conversation UI.

## DESIGN PRINCIPLES

Companion Cards are:

- **compact** — a few canonical facts, not a page;
- **mobile first** — designed for the small viewport, scaling up;
- **touch friendly** — large, tappable action targets;
- **visually consistent** — one card system across every domain;
- **reusable** — the same components serve every Intelligence domain.

---

## HOW THIS EXTENDS (does not duplicate) EXISTING GOVERNANCE

| Existing governance | What it already says | What this principle adds |
|---|---|---|
| Intelligence Discovery & Presentation Principle | Conversation discovers; canonical pages own presentation; external sources own provenance | Names **Companion Cards** as the one reusable vocabulary for presenting discovery output, without moving the boundary |
| Core Principle 4 — one assembled model per entity | Every surface reads one assembled model; never re-resolves identity | A card *refers*; the canonical page *presents and re-reads live* |
| Core Principle 6 — no fabricated knowledge | Honest gaps over invented facts | Card fields (Apple Score, Last cooked, …) render only when a canonical source exposes them |
| TIP3 — conversation holds references, never business data | One conversation store of turns + references | A card is such a reference set — pointers + projected display fields, never a copy or a store |
| TIP3 — context is derived, never stored twice | Per-turn read state | Card view models are derived per turn from the discovery response, held in session memory, never persisted |

---

## ENFORCEMENT

- **In code (today):** [INT37 — Companion Card Experience Implementation](../implementation/ux/INT37_COMPANION_CARD_EXPERIENCE_IMPLEMENTATION.md) renders Native Discovery Responses as Companion Cards in the Conversation UI. The card view model (`client/src/components/conversation/companion-card.ts`) resolves every action to a canonical in-app THA path by construction (it can never emit an external URL) and sanitises summaries of all markdown and URLs. This principle is the governing statement that implementation satisfies.
- **In review:** Any Intelligence conversation-presentation change must confirm compliance under the **AI ARCHITECTURE COMPLIANCE** block of [`ENGINEERING_WORKFLOW.md`](./ENGINEERING_WORKFLOW.md). A change that lets a card render a full canonical page, edit an entity in place, surface an external URL / provenance link, display raw markdown, or introduce a domain-specific conversation layout **must STOP, explain why, and not continue until approved.**

**Fail tests:**
- A conversation response that renders raw markdown, markdown image syntax, an external URL, or a provenance link → fail.
- A Companion Card that edits an entity in place instead of navigating to its canonical page → fail.
- A domain that builds its own conversation layout instead of adopting the Companion Card framework → fail.

---

*Required reading before any Intelligence conversation-presentation implementation.*
*Extends — does not supersede or alter — the [Intelligence Discovery & Presentation Principle](./INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md) and the Intelligence Governance documents above.*
*Rollback: this document only — `git checkout HEAD docs/architecture/THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md` (or delete the file to revert).*
