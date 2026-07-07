# THA Platform Quality Architecture

**Status:** GOVERNING ARCHITECTURE — promoted from investigation `PLATFORM_QUALITY_ARCHITECTURE_INVESTIGATION.md` (workstream `EWO-PQA1`), 2026-07-03. No code, schema, runtime, or API changes.
**Classification:** Platform Governance (canonical, cross-cutting — applies to every domain, not Intelligence-specific)
**Governing documents:** `docs/architecture/ARCHITECTURE_PRINCIPLES.md`, `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`, `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`
**Source investigation:** `docs/investigations/PLATFORM_QUALITY_ARCHITECTURE_INVESTIGATION.md`

---

## 0. MANDATE

**Every capability THA ships must automatically inherit six qualities — Security, Privacy, Performance, Observability, Accessibility, Trust — from the platform it is built on. No capability may earn these qualities by re-implementing them itself.**

This is the same discipline the Source of Truth Register applies to facts (one owner, no duplication) and the Intelligence Platform applies to business logic (the Intent Engine holds none — it routes to owners), generalised to a third axis: **quality is owned by the platform spine, not authored per-capability.** A capability that reinvents its own auth check, its own logging format, its own accessibility pattern, or its own claims-sourcing rule is not "being careful" — it is creating a second, divergent owner of a platform concern, exactly the failure mode the SoT Register was built to eliminate.

This document does not replace any existing quality mechanism. It **names, federates, and closes gaps in** what already exists (`access.ts`, the Capability Registry's permission metadata, the Conversation Gateway's turn classification, the EFSA/`SourceRef` trust firewall, the Companion Card Experience Principle) and establishes the missing dimensions (Performance, Accessibility, structured Observability) as first-class platform responsibilities going forward.

---

## 1. THE QUALITY SPINE

Quality is enforced at exactly one seam per dimension, never inside individual capabilities:

```
                        ┌───────────────────────────────────────┐
   ENGINEERING           │  New capability is authored             │
   (per-capability)       │  → declares metadata, does not          │
                          │    re-implement enforcement             │
                          └───────────────────┬─────────────────────┘
                                              │ registers
                        ┌───────────────────────▼─────────────────────────┐
   PLATFORM              │  Capability Registry                             │
   (the spine — quality   │  permissions · capabilityClass · aiAccess ·      │
    lives here once)      │  (proposed additive: perfBudget · a11yProfile)   │
                          └───────────────────┬─────────────────────────────┘
                                              │ every turn reads this metadata
                        ┌───────────────────────▼─────────────────────────┐
   RUNTIME               │  Gateway + Conversation Gateway + turn-fallback  │
   (enforced request      │  identity · role/tier · knowledge_class filter · │
    by request, not       │  audit log · turn classification · honest gaps  │
    opted into)           └───────────────────┬─────────────────────────────┘
                                              │ every release checked against
                        ┌───────────────────────▼─────────────────────────┐
   RELEASE               │  Engineering Workflow gates                      │
   (nothing ships         │  Platform Quality Compliance Checklist ·         │
    without passing)      │  Definition of Done · Trust Check                │
                          └───────────────────┬─────────────────────────────┘
                                              │ feeds back
                        ┌───────────────────────▼─────────────────────────┐
   OPERATIONS             │  Operational Excellence                          │
   (closes the loop)      │  quality-debt audit · incident review ·          │
                          │  convergence-style reporting                     │
                          └───────────────────────────────────────────────────┘
```

A capability that is registered correctly gets Security, Privacy, Trust, and Observability enforcement **for free** — the Gateway and Registry apply them uniformly to every registered entry. Performance and Accessibility do not yet have a metadata anchor on the Capability record (see §11) — until they do, they are the two dimensions engineering must still reason about by hand, and this document names that gap explicitly rather than pretending it is closed.

---

## 2. THE SIX QUALITY DOMAINS

| Domain | Definition for THA | Canonical enforcement point today | Status |
|---|---|---|---|
| **Security** | Only an authenticated identity, holding the correct role/tier, may reach a capability — enforced server-side, never by prompt or client trust. | `server/lib/access.ts` (`isAdmin`, `getTier`, `hasPremiumAccess`, `assertAdmin`, `requirePremium`) + Capability Registry `permissions.minimumRole` + TIP Gateway identity boundary | **Mature** — declared, enforced, audited |
| **Privacy** | A user's own data, and only their own data, is reachable by their own requests; privileged knowledge classes are never placed in a context they can't hold. | `knowledge_class` (`public`/`admin`/`developer`) retrieval filtering + Capability Registry `permissions.ownershipScoped` + `admin_audit_log` + turn-fallback's PII-scrubbed logging (no user IDs, no payloads) | **Mature** — declared, enforced, audited |
| **Performance** | Every user-facing operation has a bounded, known latency character; nothing degrades silently as data or usage grows. | Ad hoc — memoised deterministic engines (`computePlantData`, uplift engine) and the "derived, rebuildable index" pattern (never live-recomputed per request) exist as *practice*, but no Capability Registry field, budget, or platform-wide gate exists | **Gap** — practice without a governing mechanism |
| **Observability** | Every unsuccessful outcome is classified, not swallowed; the platform can answer "what failed, how often, where" without reading source code. | `turn-fallback.ts` — four canonical failure states (`no-route`, `no-knowledge`, `no-results`, `internal-error`), bounded 200-entry in-memory log, per-call `try/catch` isolation; durable sink `platform_turn_outcomes` (`turn-outcome-store.ts`) + admin operations endpoint, added under EWO-PRO1 (2026-07-03) | **Partial → substantially closed (EWO-PRO1)** — classification is durable across restarts and surfaced at `/api/admin/platform/operations`; alerting remains open |
| **Accessibility** | Every surface — visual, voice, or companion-mediated — is usable by a person using a screen reader, keyboard-only navigation, or reduced-motion settings, and every conversational surface renders in a structurally consistent, non-hostile layout. | `THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md` constrains the *conversation* surface structurally (fixed layout, no raw markdown, no external links) — a real but narrow accessibility discipline; no platform-wide standard (WCAG level, keyboard/screen-reader/motion requirements) exists for the rest of the product | **Gap** — one surface is disciplined, nothing else is governed |
| **Trust** | The platform never states more than it knows; every claim is sourced or explicitly marked as a gap; personality/voice may change *how* something is said, never *what* is true. | Architecture Principle 6 (no fabricated knowledge), `SourceRef` + EFSA wording firewall, TIP's RAG-only/honest-gap rule, Companion Platform's "changes how, never what" invariant, `companion-growth.ts` minimum-sample-size rule | **Mature** — THA's most developed quality dimension; this document generalises it, it does not invent it |

Security, Privacy, and Trust are **mature and declared** — this document's job for them is to name the existing mechanism as the permanent platform responsibility and stop it from being re-litigated per capability. Performance, Observability, and Accessibility are **real but incomplete** — this document establishes them as governing responsibilities now, with the closing work deferred to a named future workstream (§11), consistent with Architecture Principle 8 (evolution, not a rewrite).

---

## 3. OWNERSHIP

Ownership here is architectural, not organisational — it answers "which layer is accountable," not "which team." Three tiers, matching the Quality Spine:

| Tier | Owns | Does not own |
|---|---|---|
| **Platform** | The one enforcement mechanism per quality domain (§4) — the Gateway, the Capability Registry's permission/quality metadata schema, the audit log, the turn-classification log, the trust firewall, the Companion Card structural constraint. Changes to these mechanisms are governed architecture changes (Rule 8 review). | Business logic, business facts, domain knowledge — those stay with their SoT Register owners. |
| **Engineering** | Declaring correct, honest metadata when registering a capability (role, ownership scope, knowledge class, capability class, and — once added — performance budget and accessibility profile) and following the platform's existing patterns (progressive enrichment, honest gaps, structural conversation layout). | Re-implementing auth, logging formats, retrieval filtering, or claims-sourcing rules from scratch. If a capability needs a quality guarantee the platform doesn't yet provide, the fix is a platform change (Rule 8), not a bespoke one-off in the capability. |
| **Runtime** | Enforcing every declared guarantee on every request, uniformly, whether or not the calling engineer remembered to check — role/tier gating, retrieval-class filtering, ownership scoping, turn-outcome classification, honest-gap rendering. | Deciding what *should* be true (that is Engineering's declaration + Platform's schema) — Runtime only enforces what was declared. |

**The test for any new quality mechanism:** if a rule can only be satisfied by every capability author remembering to do the right thing, it is not yet a platform responsibility — it is a hope. Move it up a tier until Runtime enforces it without engineering having to remember.

---

## 4. PLATFORM RESPONSIBILITIES

What the shared spine provides once, so no capability provides it twice.

- **Security:** One identity/session boundary (existing auth), one role/tier resolution (`access.ts`), one place a capability declares its `minimumRole` (Capability Registry). A capability never authenticates itself.
- **Privacy:** One `knowledge_class` taxonomy, applied at retrieval time before any model or handler sees a candidate — never after. One `ownershipScoped` flag meaning "this capability's data reads are automatically scoped to the caller's own household/user." One audit log (`admin_audit_log`) for every privileged read or action.
- **Performance:** (Gap being closed, §11) One place a capability declares its performance class (e.g. real-time / cached / batch-acceptable) so the platform can apply the right timeout, caching, and degradation behaviour without each capability inventing its own.
- **Observability:** One turn-outcome classification (`turn-fallback.ts`'s four states), applied to every capability invocation without the capability needing its own error taxonomy. One place the platform decides what is safe to log (truncated utterance, surface, capability/verb/status — never payloads, never user identifiers).
- **Accessibility:** One structural contract for conversational output (Companion Card Experience Principle) that every capability's response is rendered through — a capability cannot emit raw markdown, an external link, or an unstructured wall of text that breaks the accessibility contract, because it never renders its own output; the platform renders it.
- **Trust:** One non-fabrication contract (Principle 6): honest gaps over invented answers, `SourceRef`-backed claims, the EFSA wording firewall, and the Companion invariant that voice/personality changes phrasing only, never truth, permission, or confirmation requirements. A capability cannot opt out of this by choosing its own phrasing rules.

---

## 5. ENGINEERING RESPONSIBILITIES

What an engineer adding or changing a capability must do — declare truthfully, extend, never re-implement.

**Platform Quality Compliance Checklist** (companion to the existing Architecture Compliance Checklist in `ENGINEERING_WORKFLOW.md` — intended for insertion there as a governed follow-up, not amended by this document):

```
PLATFORM QUALITY COMPLIANCE CHECKLIST
======================================

□ Security — declares minimumRole honestly; no client-side-only gating
□ Privacy — declares knowledge_class and ownershipScoped honestly;
  no retrieval path bypasses the class filter
□ Performance — capability's cost profile is known (real-time / cached /
  batch); no unbounded per-request computation over growing data
□ Observability — failures surface through the platform's turn
  classification, not a swallowed exception or a bespoke log line
□ Accessibility — conversational output renders through the platform's
  structural contract; no raw markdown, no ad hoc layout
□ Trust — every claim traces to a SourceRef or an existing sourced
  registry; gaps render as gaps, never as invented content
```

If any box cannot be checked truthfully, the capability does not ship until it can — the same hard-stop discipline as the existing Architecture Compliance Checklist.

---

## 6. RUNTIME RESPONSIBILITIES

What the deployed system enforces on every request, regardless of what any individual engineer remembered:

- Reject before resolving: a request for a capability the caller's role does not permit is refused **before** any handler runs (mirrors TIP's "capability boundary is server-side, not prompt-based").
- Filter before retrieving: privileged knowledge classes are excluded from the candidate set before a model ever sees them — never redacted after the fact.
- Scope before reading: ownership-scoped capabilities resolve the caller's own household/user context automatically; there is no code path that reads unscoped data "by mistake."
- Classify every outcome: every capability invocation that does not succeed is classified into one of the platform's canonical failure states and logged through the platform's PII-scrubbed mechanism — never silently swallowed, never logged with raw payloads.
- Render, don't trust: all conversational output is passed through the platform's structural rendering contract, not emitted directly by the capability.
- Gap, don't guess: any claim without a source, and any question the knowledge plane cannot ground, renders as an honest gap — never a fabricated answer, regardless of which capability produced it.

---

## 7. RELEASE QUALITY GATES

Nothing ships without passing the existing `ENGINEERING_WORKFLOW.md` gates, extended (as a governed follow-up, §11) with the Platform Quality Compliance Checklist above. Concretely, before any capability-affecting release:

1. **Architecture Compliance Checklist** passes (existing, `ENGINEERING_WORKFLOW.md`).
2. **AI Architecture Compliance** block passes for any AI-touching change (existing).
3. **Platform Quality Compliance Checklist** passes (§5, this document) — all six boxes checked truthfully.
4. **Trust Check** section of the implementation document (existing Mandatory Section) explicitly confirms: could this mislead, could this fabricate certainty, is anything guessed but shown as real.
5. For 🔴 RED implementations, **Architecture Convergence Status** is reported for any domain touched (existing) — quality gaps introduced or closed must be visible in the same way fact-duplication convergence already is.

A release that cannot honestly check all six quality boxes is incomplete, not "shippable with a follow-up ticket" — the same discipline the SoT Register applies to fact duplication applies here to quality debt.

---

## 8. OPERATIONAL EXCELLENCE

Quality is not a one-time gate — it decays if nothing watches it after release.

- **Quality-debt audit, cadence-based:** periodically (recommended: at each major workstream boundary, not on a fixed calendar this document cannot enforce) review the six domains for drift, in the same spirit as the Source of Truth Register's duplication audits — count what has converged, name what hasn't.
- **Incident feedback loop:** any production incident that stems from a missing quality guarantee (a leak across the knowledge-class boundary, a fabricated claim, an unclassified failure, an inaccessible surface) must produce a governing-document update, not just a code fix — the same discipline that keeps the SoT Register accurate as domains are resolved.
- **Convergence-style reporting:** where a quality gap is being closed over multiple workstreams (e.g. adding performance budgets across all registered capabilities), report progress the same way `ENGINEERING_WORKFLOW.md` STEP 8 already requires for fact convergence — a percentage with cited evidence, never an estimate.
- **No silent regression:** a capability that passed the Platform Quality Compliance Checklist at registration is re-checked whenever its `permissions`, `capabilityClass`, or `aiAccess` metadata changes — quality is attached to the capability's declared contract, not to a one-time review.

---

## 9. INTEGRATION WITH THE INTELLIGENCE PLATFORM, CAPABILITY REGISTRY, AND COMPANION PLATFORM

This document does not sit beside those three — it names the quality behaviour they already exhibit and closes the gaps they already have.

**Intelligence Platform (TIP).** TIP's own defence-in-depth model (`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` §6) — identity boundary, knowledge boundary, capability boundary, prompt-injection resistance-as-defence-in-depth — *is* the Security and Privacy domain's canonical enforcement point. TIP's RAG-only/honest-gap rule *is* the Trust domain's canonical enforcement point for AI-generated answers. This document does not add a second security or trust model next to TIP's — it declares TIP's Gateway as the one place these domains are enforced for every AI-mediated capability, and extends the same discipline to non-AI capabilities that share the Capability Registry.

**Capability Registry.** The Registry's existing declarative fields (`permissions.minimumRole`, `permissions.knowledgeClass`, `permissions.ownershipScoped`, `permissions.audited`, `capabilityClass`, `aiAccess`) are the literal mechanism of "automatic inheritance" this document mandates: a capability that registers itself honestly with these fields gets Security, Privacy, and audit-backed Trust enforcement from the Gateway without writing a line of enforcement code. This is why Performance and Accessibility are named as gaps rather than declared mature — they have no equivalent field yet (see §11), so today they can only be reasoned about by the engineer, not enforced by the Registry. Closing that gap is the direct, concrete way to bring all six domains to the same maturity level.

**Companion Platform.** The Companion Platform (personality, behaviour engine, observation engine) is architecturally a pure presentation/phrasing layer over the Conversation Gateway's already-resolved answers — it introduces no new data owner and no new capability. Its own stated hard invariant — personality and observation may change *how* something is said, never *what* is true, permitted, or requires confirmation — is a direct instance of the Trust domain (§2) applied to voice. Its observation engine's non-fabrication discipline (minimum sample sizes before claiming a trend, no invented "just achieved" moments) is the Trust domain applied to companion-generated commentary. Its rendering through the Companion Card Experience Principle is the Accessibility domain's one mature enforcement point today. Because the Companion Platform adds no new capability and no new data path, it inherits Security, Privacy, and Observability automatically from the Gateway and Capability Registry it wraps — it has nothing to enforce that isn't already enforced upstream. Any future companion capability that *does* invoke a new capability (rather than re-phrasing an existing answer) must register through the Capability Registry like any other capability and pass the same six-box checklist — personality is never a side channel around platform quality.

---

## 10. NON-NEGOTIABLES

Hard stops, extending `ENGINEERING_WORKFLOW.md` STEP 7:

- Any capability that reaches a data store outside its declared `ownershipScoped` boundary — stop.
- Any knowledge claim, anywhere, displayed without a `SourceRef` — stop (existing, Principle 6).
- Any capability that fails silently instead of classifying through the platform's turn-outcome states — stop.
- Any conversational surface (including any future companion or persona) that renders output outside the platform's structural contract — stop.
- Any personality, persona, or voice layer that changes *what* is claimed, permitted, or requires confirmation (not just *how* it is phrased) — stop.
- Any new performance-sensitive capability shipped without a stated cost profile (real-time / cached / batch) once §11's schema work lands — stop.

---

## 11. OPEN ITEMS DEFERRED TO IMPLEMENTATION

This document is architecture, not implementation (Rule 8 applies — governance review before any new schema). It authorises no code change. The following are named so they are not lost, and are explicitly **not** performed here:

1. **Add `performanceBudget` metadata to the Capability Registry** (e.g. `real-time` / `cached` / `batch-acceptable`), so Performance gains the same registry-anchored enforcement Security and Privacy already have.
2. **Add `accessibilityProfile` metadata to the Capability Registry** (or equivalent), so surfaces beyond the conversation plane inherit a declared accessibility contract rather than relying on ad hoc review.
3. **Give the Observability turn-classification log an external, durable sink** (it is currently an in-memory, 200-entry, process-local ring buffer per `turn-fallback.ts`) so operational excellence (§8) has evidence to audit against beyond a single process's uptime.
   ✅ **Closed under EWO-PRO1 (2026-07-03):** `platform_turn_outcomes` table, sole owner `server/intelligence/conversation/turn-outcome-store.ts`, wired as a fire-and-forget sink registered at startup; bounded retention (30 days / 5,000 rows); admin read at `/api/admin/platform/turn-outcomes`. The in-memory ring buffer remains as the process-local recent-window cache the INT35B/C aggregations read — the durable table is the canonical historical record. See `docs/implementation/PLATFORM_RESILIENCE_AND_OPERATIONS_IMPLEMENTATION.md`.
4. **Insert the Platform Quality Compliance Checklist (§5) into `ENGINEERING_WORKFLOW.md`** as a mandatory section, alongside the existing Architecture Compliance Checklist and AI Architecture Compliance block.
   ✅ **Closed under EWO-PRO1 (2026-07-03):** inserted as the "PLATFORM QUALITY COMPLIANCE CHECKLIST" section of `ENGINEERING_WORKFLOW.md`, with a matching section added to the implementation template.
5. **Adopt a platform-wide accessibility standard** (a stated WCAG conformance level and the keyboard/screen-reader/motion requirements that follow from it), rather than the current single-surface discipline in the Companion Card Experience Principle.

Each of these is a governed workstream in its own right (Rule 8: governance review before any new store or schema field) — none is authorised by this document.

---

*Required reading before any implementation that registers a new capability, adds a new conversational surface, or touches security, privacy, performance, observability, accessibility, or trust behaviour anywhere in THA.*
*Source investigation: `docs/investigations/PLATFORM_QUALITY_ARCHITECTURE_INVESTIGATION.md`.*
*Rollback: this document only — `git checkout HEAD docs/architecture/PLATFORM_QUALITY_ARCHITECTURE.md` (or delete the file to revert). No code was changed to produce it.*
