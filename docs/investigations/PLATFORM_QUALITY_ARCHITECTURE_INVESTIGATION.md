# PLATFORM QUALITY ARCHITECTURE — Investigation

**Status:** Investigation — promoted to governing architecture at `docs/architecture/PLATFORM_QUALITY_ARCHITECTURE.md`
**Workstream:** `EWO-PQA1`
**Date:** 2026-07-03
**Branch:** `int1-intelligence-platform`
**Mode:** Architecture Investigation
**Scope:** Investigation only. No code, schema, runtime, or API changes.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| HEAD at start | `34605193032d75c496cb14a375c7ccb3f36366a5` |
| Rollback tag created | `rollback/before-platform-quality-architecture-20260703` |
| Tag points to | `34605193032d75c496cb14a375c7ccb3f36366a5` |
| Working tree | Intentionally dirty — pre-existing uncommitted Companion Platform work (EWO1/EWO2/EWX1/EL2) already in progress on this branch before this investigation began; none of it was touched by this investigation |
| This investigation's writes | Two new files only: this document and `docs/architecture/PLATFORM_QUALITY_ARCHITECTURE.md` |
| Action on rollback | `git checkout rollback/before-platform-quality-architecture-20260703` (restores pre-investigation HEAD; does not touch the pre-existing uncommitted work, which is not part of HEAD) |

---

## MANDATE

Design the canonical Platform Quality Architecture for THA: a governing document describing how every future capability automatically inherits **Security, Privacy, Performance, Observability, Accessibility, and Trust** — defining ownership, platform responsibilities, engineering responsibilities, runtime responsibilities, release quality gates, operational excellence, and integration with the Intelligence Platform, the Capability Registry, and the Companion Platform. Platform-first. No implementation detail. Suitable for permanent adoption.

---

## STEP 2 — ARCHITECTURE BOOTSTRAP (read before starting)

Read in full before any design work, per `ENGINEERING_WORKFLOW.md` STEP 2:

- `docs/architecture/README.md` — canonical index
- `docs/architecture/ARCHITECTURE_PRINCIPLES.md` — the eight governing principles
- `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` — domain ownership register
- `docs/architecture/ENGINEERING_WORKFLOW.md` — release/compliance workflow
- `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` — the Intelligence Platform (TIP), whose Gateway/permission/security model this investigation must integrate with, not duplicate
- `server/intelligence/capability-registry.ts`, `server/intelligence/conversation/conversation-gateway.ts`, `server/intelligence/conversation/turn-fallback.ts` — the runtime Capability Registry and the one place conversation turns are currently classified/logged
- `docs/architecture/THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md` — the existing structural/accessibility discipline on conversational output
- Companion Platform in-progress material: `docs/investigations/EWO1_COMPANION_PLATFORM_FOUNDATION.md`, `docs/implementation/EWO2_COMPANION_PERSONALITY_PLATFORM_IMPLEMENTATION.md`, `docs/implementation/EWX1_LIVING_COMPANION_EXPERIENCE.md`, `server/intelligence/conversation/behaviour-engine.ts`, `companion-growth.ts`, `observation-engine.ts`, `personality-registry.ts`, `shared/companion-personality.ts`, `shared/companion-interaction.ts`

---

## ARCHITECTURE COMPLIANCE REVIEW (gate)

Before any design, the proposal was checked against the eight governing principles. Mandate: if any proposal fails these principles — STOP, explain, do not continue.

| Principle | Platform Quality Architecture compliance | Verdict |
|---|---|---|
| 1 — One canonical identity per entity | PQA introduces no entity. It is a cross-cutting policy layer over existing capabilities, not a new domain object. | ✅ Pass |
| 2 — One owner per fact | PQA **owns no facts**. Every mechanism it names (auth, knowledge-class, audit log, turn-classification, trust firewall) already has a declared owner; PQA federates the naming, it does not create a second copy of any of them. | ✅ Pass |
| 3 — Progressive enrichment / single-owner state | Not directly applicable — quality metadata is neither a knowledge entity nor transactional state. It is closest to TIP's own "governance layer" classification: policy metadata attached to existing capability records, not a new enrichable entity. | ✅ Pass (by analogy to TIP's own compliance finding) |
| 4 — Runtime consumes one assembled model | PQA reinforces this: the Gateway + Capability Registry remain the single enforcement seam. PQA explicitly rejects "each capability re-implements its own security/logging" as a violation of this principle, generalised from facts to quality. | ✅ Pass |
| 5 — Reference vocabularies stay beside the spine | The six Quality Domains are exactly this: a shared taxonomy (like `knowledge_class` or the diet-pattern enum) that sits beside the Capability Registry and applies across every domain, never merged into any one capability. | ✅ Pass |
| 6 — No fabricated knowledge | The Trust domain (§2/§9 of the governing doc) **is** Principle 6, generalised and named as a permanent platform responsibility rather than an implicit rule. PQA does not weaken it — it makes it the anchor of one of six domains. | ✅ Pass |
| 7 — No permanent synchronisation bridge | Named explicitly as a constraint on the Observability gap (§11 of the governing doc): any future durable log/sink must be an append-only, derived record of what happened — never a second owner of business state kept in sync with anything. | ✅ Pass (conditional — binding constraint on future observability work) |
| 8 — Evolution over replacement | PQA replaces nothing. It names five real gaps (Performance and Accessibility metadata, an external observability sink, checklist insertion into `ENGINEERING_WORKFLOW.md`, a stated accessibility standard) and explicitly defers all of them to a future governed workstream (Rule 8) rather than implementing them here. | ✅ Pass |

**Gate result: PASS.** The investigation proceeds on the same footing as `TIP1` — a governance/naming layer over existing mechanisms, with any genuinely new schema or mechanism (Performance/Accessibility metadata, an observability sink) explicitly deferred to a future Rule-8-governed workstream rather than authorised here.

---

## GROUNDING — WHAT THA ACTUALLY HAS TODAY, PER QUALITY DOMAIN

This investigation is grounded in the live codebase and governing documents, not a greenfield assumption. Each domain below cites what exists today; nothing here is invented.

### Security — Mature

- `server/lib/access.ts`: `isAdmin()`, `getTier()`, `hasPremiumAccess()`, `assertAdmin`, `requirePremium` middleware.
- `users.role` (`'user' | 'admin'`), `users.subscriptionTier` (`'free' | 'premium' | 'friends_family'`) — `shared/schema.ts`.
- Capability Registry (`server/intelligence/capability-registry.ts`): each `Capability` declares `permissions.minimumRole`; execution is checked server-side at invoke time, never trusted from the model's output (TIP §6.2, boundary 3 — "the LLM's output is advisory; the server is authoritative").
- TIP's four defence-in-depth boundaries (identity, knowledge, capability, prompt-injection-resistance-as-defence-in-depth) are the existing, declared security model for every AI-mediated capability (`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` §6).

### Privacy — Mature

- `knowledge_class` taxonomy (`public` / `admin` / `developer`), assigned at index time from source location, never inferred by the model — retrieval-filtered **before** anything reaches model context (TIP §6.2, boundary 2, the primary defence: "you cannot leak what was never placed in context").
- Capability Registry `permissions.ownershipScoped` — capability reads are scoped to the caller's own household/user.
- `admin_audit_log` (`shared/schema.ts:921`) — every privileged read/action is recorded.
- `turn-fallback.ts`'s unsuccessful-query log is explicitly PII-scrubbed: it records only a truncated utterance, surface, and `(capability, verb, status)` — never a user ID, never a capability payload, never parameters. This is a genuine, already-implemented privacy discipline at the observability seam, not a gap.

### Performance — Practice without a governing mechanism

- `THA_MASTER_EVOLUTION_ROADMAP.md` records real, already-shipped performance discipline: `computePlantData`/sorting memoised, the uplift engine sub-30ms, deterministic engines used deliberately to avoid live recomputation cost.
- TIP's knowledge index is explicitly designed as "derived, rebuildable, cached" rather than recomputed per request (`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` §3.1) — a performance-motivated architectural choice, though framed there as a fact-ownership rule (Principle 7), not a performance rule.
- **Gap confirmed by search:** no `docs/architecture/*.md` file states a platform-wide latency budget, a performance classification taxonomy, or a Capability Registry field for cost profile. Performance is currently achieved capability-by-capability, by individual engineering diligence, with no registry-level anchor and no release gate. This is exactly the "hope, not a platform responsibility" failure mode the governing document's §3 test names.

### Observability — Partial

- `server/intelligence/conversation/turn-fallback.ts` defines four canonical, closed failure states: `no-route`, `no-knowledge`, `no-results`, `internal-error`. This is real, working classification — not a gap.
- `conversation-gateway.ts` wraps every capability query and every LLM call independently in `try`/`catch`, so one failure cannot abort an entire turn — genuine fault isolation.
- `logUnsuccessfulQuery`/`getUnsuccessfulQueryLog` maintain a bounded, 200-entry, **in-memory, single-process** ring buffer.
- **Gap confirmed:** there is no external telemetry sink, no persistence across process restarts, no dashboard, and no alerting on failure-rate thresholds. The classification mechanism is correct; its durability and visibility are not yet a platform guarantee — an operator cannot answer "how often did capability X fail last week" once the process has restarted.

### Accessibility — One disciplined surface, no platform standard

- `docs/architecture/THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md` (adopted, governing) constrains all conversational output to a fixed Summary → Cards → Next Steps structure, forbidding raw markdown, external URLs, provenance links, or in-card editing. This is a genuine, if narrow, accessibility discipline: it guarantees the conversation surface never degrades into an unstructured, unpredictable wall of text.
- **Gap confirmed by search:** `grep -ril "accessib|wcag|aria-" docs/` returns dozens of files, but none in `docs/architecture/` — every hit is a feature-level investigation (plant diversity, meal dialogs, density audits) making local UI decisions, not a platform-wide accessibility standard. There is no stated WCAG conformance level, no keyboard-navigation requirement, no screen-reader requirement, no reduced-motion requirement anywhere in the governing architecture. Accessibility today is a per-feature judgment call, exactly the pattern the Source of Truth Register calls a "prototype-era workaround" when applied to facts — here applied to a quality dimension instead.

### Trust — THA's most mature quality dimension

- Architecture Principle 6 (`ARCHITECTURE_PRINCIPLES.md`): honest gaps over fabricated knowledge, `reviewedAt` required for uplift rules, `SourceRef` (NHS/BNF/NIH ODS/EFSA + URL + `lastReviewed`), EFSA wording firewall, `emerging` benefits never shown as `established`.
- TIP's Knowledge Plane: RAG-only, zero retrieval hit → honest gap, never an invented answer (`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` §4.3).
- Companion Platform's stated hard invariant across both EWO2 and EWX1: personality/observation may change **how** something is said, never **what** is true, permitted, or requires confirmation. `companion-growth.ts` returns `null` rather than fabricate familiarity below a minimum sample size; `observation-engine.ts` only fires on "notable" thresholds, never claiming an undated "just achieved" moment.
- `THA_MASTER_EVOLUTION_ROADMAP.md` independently confirms trust messaging discipline is already enforced (`HEALTH_DISCLAIMER`, banned/allowed vocabulary, "associations not causation").

**Summary of grounding:** Security, Privacy, and Trust are mature, declared, and enforced today — this investigation's contribution for them is to name the existing mechanism as a permanent, cross-cutting platform responsibility rather than an implicit convention that could silently erode. Performance, Observability, and Accessibility are real in practice but have no registry-anchored, platform-wide enforcement mechanism — this investigation names them as first-class gaps and defers closing them to a governed follow-up, rather than either ignoring them or attempting to close them inside an architecture-only investigation.

---

## WHY A SEPARATE DOCUMENT, NOT AN EXTENSION OF AN EXISTING ONE

Checked against Source of Truth Register Rule 8 (governance review before any new knowledge store) and Architecture Principle 8 (evolution over replacement), applied here to *documents* rather than data stores:

1. **Is there an existing store for this domain?** No. `ARCHITECTURE_PRINCIPLES.md` governs entity/fact architecture. `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` governs the AI/intelligence plane specifically. Neither states a platform-wide position on performance budgets, accessibility standards, or observability durability — confirmed by grep across `docs/architecture/*.md` (see Grounding above). No document currently answers "what does every capability, AI or not, owe the user in terms of quality."
2. **If yes, why is it insufficient?** N/A.
3. **If no, this is genuinely a different domain:** quality is cross-cutting across *all* capabilities (business-domain and AI-mediated alike), whereas the Intelligence Platform document is scoped to the AI plane and the SoT Register is scoped to fact ownership. A capability like the Shopping List (no AI involved) still owes the user privacy, performance, and accessibility guarantees that neither existing document states. This document is the first to make quality itself the subject, rather than a side-effect of another document's subject.

This satisfies Rule 8's governance check and confirms the new document is not a parallel or duplicate of an existing one.

---

## DOMAIN IMPACT DECLARATION

Per `ENGINEERING_WORKFLOW.md` STEP 6:

```
DOMAIN IMPACT
=============
Domain affected: None (cross-cutting governance document, not a data domain)
Declared SoT: N/A — this document names existing SoTs (access.ts, knowledge_class,
  admin_audit_log, turn-fallback.ts, ARCHITECTURE_PRINCIPLES.md Principle 6), it does
  not become a new SoT for any of them
New store created? NO
  N/A
Existing store extended? NO — two additive Capability Registry fields
  (performanceBudget, accessibilityProfile) are PROPOSED for a future workstream
  (§11 of the governing document) but not created here
Consumer created? NO
```

No answer creates a duplication. No implementation is authorised by this document.

---

## RECOMMENDED ARCHITECTURE (summary — full detail in the governing document)

**The Quality Spine.** Six Quality Domains, enforced at the same seams TIP already established (Gateway, Capability Registry, Engineering Workflow gates), never re-implemented per capability. The Capability Registry's existing declarative metadata (`permissions.minimumRole`, `permissions.knowledgeClass`, `permissions.ownershipScoped`, `permissions.audited`, `capabilityClass`, `aiAccess`) is the concrete mechanism of "automatic inheritance" for Security, Privacy, Trust, and (partially) Observability — a capability that registers itself honestly gets these enforced by the Gateway without writing enforcement code. Performance and Accessibility lack an equivalent registry anchor today; this is named as the priority closing work rather than solved inline.

**Ownership** is architectural, not organisational: Platform owns the one enforcement mechanism per domain; Engineering owns honest declaration at registration time; Runtime owns uniform enforcement on every request regardless of what any engineer remembered. The test for whether a rule is a genuine platform responsibility yet: *"if it can only be satisfied by every engineer remembering, it isn't a platform responsibility yet — move it up a tier."*

**Release gates** extend the existing Architecture Compliance Checklist with a six-box Platform Quality Compliance Checklist (§5/§7 of the governing document), to be inserted into `ENGINEERING_WORKFLOW.md` as a follow-up governed change — not performed by this investigation.

**Operational excellence** mirrors the SoT Register's own duplication-audit discipline and `ENGINEERING_WORKFLOW.md` STEP 8's convergence-percentage reporting, applied to quality debt instead of fact duplication: cite evidence, never estimate, and treat any incident traceable to a missing quality guarantee as requiring a governing-document update, not just a code fix.

**Integration:**
- **Intelligence Platform (TIP):** TIP's Gateway *is* the canonical Security/Privacy enforcement point and its RAG-only/honest-gap rule *is* the canonical Trust enforcement point for AI answers. PQA does not duplicate TIP's security model — it declares TIP's Gateway as the seam for every capability that shares the Capability Registry, AI-mediated or not.
- **Capability Registry:** the literal mechanism of inheritance (see above). Closing the Performance/Accessibility gap means adding two fields here, not building a parallel system.
- **Companion Platform:** architecturally a pure phrasing/observation layer over already-resolved answers, introducing no new data owner or capability of its own — it inherits Security/Privacy/Observability automatically from the Gateway it wraps, and its own stated invariant ("changes how, never what") is a direct instance of the Trust domain. Its rendering through the Companion Card Experience Principle is the one mature Accessibility enforcement point that exists today. Any future companion capability that invokes something new (rather than re-phrasing an existing answer) must register through the Capability Registry like any other capability — personality is never a side channel around platform quality.

---

## RISKS

| ID | Risk | Severity | Mitigation |
|---|---|---|---|
| Q1 | Performance and Accessibility remain "hope, not enforcement" indefinitely because no workstream is ever scheduled to add the registry fields | 🟠 High | Named explicitly in §11 of the governing document as deferred-but-tracked; each is a discrete, small, additive schema change (two optional fields), not a rewrite |
| Q2 | A future observability sink is built as a second owner of business/user state (e.g. duplicating user identifiers into a logging store) rather than a derived, append-only record | 🔴 Critical if realised | Principle 7 compliance is stated as a binding constraint on this specific future work (Compliance Review, Principle 7 row) |
| Q3 | The six-box checklist is added to `ENGINEERING_WORKFLOW.md` in name only and not actually enforced before releases | 🟠 High | Framed identically to the existing Architecture Compliance Checklist's "if any item cannot be checked, stop" discipline — same enforcement culture, not a new one |
| Q4 | Accessibility standard-setting (WCAG level, keyboard/screen-reader/motion) is deferred so long that per-feature ad hoc decisions (already visible across dozens of investigation docs) continue to diverge | 🟡 Medium | Named as open item §11.5; the governing document is explicit that the Companion Card Principle is a narrow instance, not a substitute for a platform standard |
| Q5 | "Ownership" is read as assigning blame to individuals rather than as an architectural accountability model | 🟢 Low | §3 of the governing document explicitly frames ownership as "which layer is accountable," not an org chart |

---

## PHASED FOLLOW-UP (not authorised here — named for future governed workstreams)

1. **Checklist insertion** — add the Platform Quality Compliance Checklist to `ENGINEERING_WORKFLOW.md`. Lowest risk, pure documentation, no schema change.
2. **Performance metadata** — add `performanceBudget` to the Capability Registry schema; classify existing ~23 capabilities. Additive field, no behaviour change on its own.
3. **Accessibility metadata + standard** — state a WCAG conformance level; add `accessibilityProfile` to the Capability Registry schema.
4. **Observability durability** — give the turn-classification log an external, durable sink, preserving its existing PII-scrubbing discipline (Principle 7 constraint, Risk Q2).
5. **Enforcement wiring** — once (2) and (3) exist, wire Gateway-level enforcement (timeouts/degradation by performance class; rendering checks by accessibility profile) so Performance and Accessibility reach the same "runtime enforces it automatically" maturity Security and Privacy already have.

Each step is independently valuable and does not require the next to have value, consistent with TIP's own phased-roadmap discipline.

---

## DEFINITION OF DONE — CHECK

| Requirement | Met by this investigation |
|---|---|
| Read the governing architecture before starting | Architecture Bootstrap section above; all listed documents read in full |
| Architecture Compliance Review against the eight principles | Gate table above — PASS |
| Grounded in the live codebase, not invented | Grounding section cites real files/mechanisms for all six domains, including explicit gap confirmation by search where a mechanism does not exist |
| Ownership, platform/engineering/runtime responsibilities, release gates, operational excellence defined | Governing document §3–§8 |
| Integration with Intelligence Platform, Capability Registry, Companion Platform | Governing document §9; summarised above |
| Platform-first, no implementation detail | Governing document contains no code, no schema DDL, no file-level implementation instructions; open items explicitly deferred (§11) |
| Suitable for permanent adoption | Structured identically to existing adopted governing documents (`ARCHITECTURE_PRINCIPLES.md`, `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`) — status header, compliance gate, ownership, hard stops, rollback footer |
| Rollback identifier reported before beginning | Top of this document: `rollback/before-platform-quality-architecture-20260703` → `34605193032d75c496cb14a375c7ccb3f36366a5` |
| Project documentation requirement (STEP 9) | This file |

---

## TRUST CHECK

- Could this mislead the user? No new claims are made about the product; every "mature" classification is backed by a cited file/mechanism, and every "gap" is confirmed by an actual search rather than assumed.
- Could this fabricate certainty? No — Performance, Observability, and Accessibility are explicitly labelled as gaps rather than presented as already-solved.
- Is anything guessed but shown as real? No — where evidence was not found (e.g. no accessibility standard in `docs/architecture/`), this is stated as "confirmed by search," not inferred.
- No architectural duplication introduced: confirmed — no new store, no new owner of any existing fact.
- No new source of truth created: confirmed — this document names existing SoTs; the two proposed Capability Registry fields are explicitly deferred, not created.
- No runtime behaviour altered: confirmed — governance-only work.

---

## ROLLBACK PLAN

- Rollback identifier: `rollback/before-platform-quality-architecture-20260703` → `34605193032d75c496cb14a375c7ccb3f36366a5`
- Files created by this investigation: `docs/investigations/PLATFORM_QUALITY_ARCHITECTURE_INVESTIGATION.md`, `docs/architecture/PLATFORM_QUALITY_ARCHITECTURE.md`, and an update to `docs/architecture/README.md`'s index (adding this document to Platform Governance)
- Rollback commands: `git checkout rollback/before-platform-quality-architecture-20260703 -- docs/investigations/PLATFORM_QUALITY_ARCHITECTURE_INVESTIGATION.md docs/architecture/PLATFORM_QUALITY_ARCHITECTURE.md docs/architecture/README.md` (removes/reverts only these three files; leaves all pre-existing uncommitted Companion Platform work untouched)
- Verification after rollback: `git status` shows the three files reverted/removed; no other file affected

---

## SCOPE LOCK

**Implemented scope:** Two governing documents (this investigation and `docs/architecture/PLATFORM_QUALITY_ARCHITECTURE.md`), plus indexing the new governing document in `docs/architecture/README.md`.

**Explicitly excluded scope:**
- No Capability Registry schema change (`performanceBudget`, `accessibilityProfile` are named, not added)
- No change to `turn-fallback.ts`, `capability-registry.ts`, `conversation-gateway.ts`, or any other runtime file
- No change to `ENGINEERING_WORKFLOW.md` (the Platform Quality Compliance Checklist is specified but not inserted)
- No WCAG conformance level chosen
- No code, test, or schema of any kind changed

**Suggestions (not implemented without approval):**
- Insert the Platform Quality Compliance Checklist into `ENGINEERING_WORKFLOW.md` as the next, low-risk follow-up (pure documentation change).
- Classify the existing ~23 registered capabilities against a first-draft `performanceBudget` taxonomy as a scoping exercise before committing to the schema shape.

---

*Investigation only. No implementation performed.*
*Rollback: `git checkout rollback/before-platform-quality-architecture-20260703`.*
