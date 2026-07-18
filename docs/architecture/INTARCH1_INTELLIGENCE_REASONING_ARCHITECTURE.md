# INTARCH1 — The Intelligence Reasoning Architecture

**The governing architecture for *how* THA Intelligence reasons. It defines the one canonical pipeline that
turns a request into a trusted answer or a trusted action — Intent → Effective Identity → Permission
Resolution → Context Composition → Capability Selection → Knowledge Retrieval → Evidence Validation →
Reasoning → Response → Action — and fixes, for each stage, its purpose, its single authoritative owner, and
the boundary it must never cross.**

Architecture work. **No implementation. No schema changes. No AI logic changes.** This document defines the
law of the pipeline; it wires nothing and re-authors no stage's internal rules.

| | |
|---|---|
| **Doc ID** | `INTARCH1` |
| **Date** | 2026-07-17 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `intarch1-rollback` → HEAD `7bfad50ca198f2b86f6501a4f82d8ae41af9260b` |
| **Status** | **Governing architecture. The reasoning pipeline every current and future Intelligence Platform implementation must follow.** |
| **Classification** | Intelligence Governance (canonical, cross-cutting — applies to every Companion turn, every capability, every surface) |
| **Product changed** | **None.** An architecture document. No component, route, data, schema, migration, test, or AI logic touched. |

---

## 0. MANDATE

**There is one Intelligence Platform and one way it reasons. Every request THA's intelligence answers —
whether it ends in a spoken sentence, a rendered card, or a mutation of business state — travels the same
pipeline, in the same order, under the same laws. Permissions are resolved before knowledge is retrieved.
Knowledge is retrieved before anything is generated. Evidence is validated before it is reasoned over.
Reasoning composes what is already true; it never authors what is true. And when the grounded evidence does
not answer the question, the platform returns an honest gap rather than a fabricated certainty.**

This is the reasoning constitution. It sits above every existing Intelligence architecture and binds all
future ones. It owns exactly one thing that no other document owns: **the shape of the pipeline and the order
of its stages.** It owns no stage's internal rules — each stage names its existing authoritative owner, and
this document defers to that owner completely.

---

## 1. WHAT THIS DOCUMENT IS, AND WHAT IT GOVERNS

THA already has each *part* of a reasoning system, and each part already has a governing document:

- an **Intent Engine** that turns natural language into a typed, routable intent
  (`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` §5);
- an **AI Capability Registry & Intent Taxonomy** that enumerates every capability the model may touch and
  binds each to exactly one owning service (`THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`);
- a **Context Composition Engine** that owns every byte the model reads as grounding
  (`THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md`);
- a **Product Knowledge Registry** — the single source of truth for what THA is, permission-aware
  (`THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`);
- a **Companion Platform** — the one user-facing assistant that speaks the result
  (`THA_COMPANION_PLATFORM_ARCHITECTURE.md`);
- a **Decision Engine** that owns which already-true items surface, and why the rest did not
  (`THA_DECISION_ENGINE_ARCHITECTURE.md`);
- and **COMP_AUTH1**, the authority model that fixes *whose* identity all of the above reason under
  (`COMP_AUTH1_COMPANION_AUTHORITY_MODEL.md`).

What has **never** been written down is the **sequence**: how those parts compose into a single, ordered act
of reasoning, and what must be true at each hand-off for the whole to remain trustworthy. Today that sequence
is reconstructed — turn by turn, reviewer by reviewer — from seven documents that each describe their own
piece. This document writes the sequence down once, so that "how does the Companion get from a question to a
trusted answer?" has a single, canonical answer that every future implementation is measured against.

**It restates no rule it does not own, and cites its governors rather than duplicating them.** Where a rule
belongs to a stage's owner — the honest-gap guarantee (Intelligence Platform Principle 6), the permission
model (Product Knowledge Registry §11 / COMP_AUTH1), the composition invariant (Context Composition Engine
§0), the evidence gate (Decision Engine Rule E1) — this document points at the owner and inherits the rule
unchanged. Its own contribution is the pipeline that threads them together and the laws that keep the order
inviolable.

It is deliberately **not**:

- **a second Intelligence Platform** — there is one (`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`); this is the
  reasoning discipline *inside* it;
- **a capability registry** — capabilities and their owners live in TIP2; this document reads that registry,
  it never adds to it;
- **a permission system** — `server/lib/access.ts` is the sole authority on identity and role, and the
  Product Knowledge Registry / COMP_AUTH1 own the visibility model; this document only fixes *where in the
  pipeline* permissions are resolved (before retrieval);
- **a prompt or an AI-logic specification** — it changes no prompt and no model behaviour; it governs the
  order in which inputs reach whatever prompt exists;
- **the Decision Engine's surfacing pipeline** — DEC1's Evidence → Attention → Decision governs *which
  proactive opportunities surface now*; INTARCH1's pipeline governs *how a request becomes a trusted
  response or action*. They are distinct pipelines that meet at two points, named in §4.7 and §5.

---

## 2. THE REASONING PIPELINE — OVERVIEW

Every intelligence request travels ten stages. Data flows down the pipeline; **authority never flows up** — a
later stage may narrow what an earlier stage produced, never widen it, and never overrule the owner an earlier
stage deferred to.

```
   ┌──────────────────────────────────────────────────────────────────────┐
   │  REQUEST  (natural language + session, from any interface)            │
   └───────────────────────────────┬──────────────────────────────────────┘
                                    ▼
 1  INTENT                What is being asked?            owner: Intent Engine (TIP1 §5) + Registry (TIP2)
                                    ▼
 2  EFFECTIVE IDENTITY    Who is this, really?            owner: COMP_AUTH1 + access.ts
                                    ▼
 3  PERMISSION RESOLUTION What may this identity see/do?  owner: PKR §11 model + Capability Registry + access.ts
                                    ▼                     ── nothing below this line escapes the permission set ──
 4  CONTEXT COMPOSITION   What grounding is assembled?    owner: Context Composition Engine (INT17)
                                    ▼
 5  CAPABILITY SELECTION  Which capability answers this?  owner: AI Capability Registry (TIP2)
                                    ▼
 6  KNOWLEDGE RETRIEVAL   What governed facts apply?      owner: the fact's owner (PKR / NK1-NK2 / Food Intelligence / index)
                                    ▼
 7  EVIDENCE VALIDATION   Is it true, and may it render?  owner: evidence gate (shared/knowledge/evidence.ts, Rule E1)
                                    ▼
 8  REASONING             Compose an answer from evidence owner: LLM reasoning under the Companion Platform invariant
                                    ▼
 9  RESPONSE              Say it, in voice, with citation owner: Companion Platform (CPA1) — Behaviour Engine
                                    ▼
10  ACTION  (if any)      Execute the confirmed mutation  owner: the existing business service (Intent Engine invokes)
```

**The two structural rules that give the order its meaning:**

1. **Permissions before retrieval (the line at stage 3).** Nothing is retrieved, composed, selected, reasoned
   over, or executed outside the permission set resolved at stage 3 against the *effective* identity resolved
   at stage 2. A fact a person may not see is never placed where reasoning can reach it — you cannot leak what
   was never retrieved (Intelligence Platform §6.2, boundary 2).
2. **Retrieval before generation (stages 6–7 before stage 8).** No knowledge claim is generated that was not
   first retrieved from its owner and passed the evidence gate. Reasoning is a transform over validated
   evidence, never a source of new facts.

Stage 10 is conditional: read-only requests terminate at stage 9. An action is reached only when the intent
is a state-changing capability, the identity holds it, and (for mutating or destructive intents)
confirmation has been given.

---

## 3. STAGE DEFINITIONS

Each stage is defined by six fields: **purpose**, **authoritative owner**, **inputs**, **outputs**,
**responsibilities**, and **what it must never own**. The "must never own" field is the load-bearing one — it
is what keeps each stage from absorbing a neighbour's authority and collapsing the pipeline into a monolith.

### 3.1 Stage 1 — INTENT

| Field | Definition |
|---|---|
| **Purpose** | Turn a natural-language (or voice-transcribed) request into a *candidate typed intent* — a structured object naming the action or question, distinct from free text. |
| **Authoritative owner** | The **Intent Engine** (`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` §5) for the parse; the **AI Capability Registry & Intent Taxonomy** (TIP2) for the typed-intent *contract* the parse must fill. |
| **Inputs** | Raw utterance/text; conversation history; the interface it arrived on (web, voice STT, card). |
| **Outputs** | A candidate typed intent `{ kind: question \| action, capability?, parameters }`, or "no recognised intent". |
| **Responsibilities** | Extract structure; classify question vs action; leave entity names *unresolved* (resolution is a later, deterministic step). |
| **Must never own** | Business logic; entity resolution; permission judgement; the decision to execute. The LLM's parse is **advisory** — it proposes; the server disposes. An action with no registered intent cannot be expressed here: there is no freeform execution (TIP1 §5.2). |

### 3.2 Stage 2 — EFFECTIVE IDENTITY

| Field | Definition |
|---|---|
| **Purpose** | Resolve *who the platform is reasoning as* — the **effective authenticated identity**, which under impersonation is the impersonated user, never the administrator performing it, and never a function of where in the product the conversation occurs. |
| **Authoritative owner** | **COMP_AUTH1** (`COMP_AUTH1_COMPANION_AUTHORITY_MODEL.md`) defines the Actor/Effective model; **`server/lib/access.ts`** is the sole runtime authority on identity, role, and tier. |
| **Inputs** | The authenticated session; any active impersonation record (actor identity + effective identity). |
| **Outputs** | The effective identity: `{ userId, role, tier, householdScope }`, plus the retained actor identity for audit only. |
| **Responsibilities** | Distinguish actor from effective identity; expose the effective identity as the *only* one downstream stages key on; keep the actor identity available to the audit obligation, which is independent of what the Companion sees (COMP_AUTH1). |
| **Must never own** | The permission set itself (stage 3 derives it); any widening of access because an admin is the actor. Identity is *who*, not *what-they-may-do*. Location in the app confers no authority. |

### 3.3 Stage 3 — PERMISSION RESOLUTION

| Field | Definition |
|---|---|
| **Purpose** | Derive, from the effective identity, the exact set of knowledge classes it may read and capabilities it may invoke — **before** any knowledge is retrieved or any capability is selected. |
| **Authoritative owner** | The **Product Knowledge Registry permission model** (`THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md` §11) for knowledge visibility — `public ⊂ household ⊂ admin ⊂ developer`, **monotonic**, **fails closed to `developer`**, keyed on **role, never subscription tier**; the **AI Capability Registry** (TIP2 §5) for the capability allow-list; **`access.ts`** (`assertAdmin`, `requirePremium`, ownership checks) as the runtime gate. |
| **Inputs** | The effective identity from stage 2. |
| **Outputs** | A resolved permission set: the readable knowledge classes and the invokable capability ids. |
| **Responsibilities** | Compute the visibility ceiling and the capability allow-list once, so every later stage filters *against a set already fixed*; default-deny on any unclassified knowledge. |
| **Must never own** | Identity resolution (that is stage 2); knowledge content; the enrolment of capabilities (TIP2 owns which capabilities exist). It resolves permissions; it does not author them, and it is keyed on the *effective* role only (COMP_AUTH1). |

> **This is the pipeline's most important line.** Everything below stage 3 operates strictly inside the set it
> produces. A retrieval filter, a capability rejection, or a context-composition omission that contradicts
> stage 3 is a security defect, not a behaviour choice.

### 3.4 Stage 4 — CONTEXT COMPOSITION

| Field | Definition |
|---|---|
| **Purpose** | Assemble the grounding the model will read — from Context Views, under one budget, deterministically — within the permission set from stage 3. |
| **Authoritative owner** | The **Context Composition Engine** (`THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md`, INT17). It is the *only* component permitted to serialise, truncate, order, or budget the prompt's CONTEXT DATA block. |
| **Inputs** | The resolved permission set; the effective identity; the capability's Context View(s); the request. |
| **Outputs** | One composed, budgeted, deterministic grounding payload of valid, permission-filtered context. |
| **Responsibilities** | Select relevance; keep within budget; guarantee determinism (identical inputs → identical prompt); emit only valid, self-consistent context. |
| **Must never own** | **What is true.** Per the Engine's own invariant (§0), it may change *how much* of an already-true fact the model sees and *in what shape* — it may **never** change what is true, invent a fact, re-rank a capability's judgement, or hide an omission. Context guides relevance; it is never a source of authority. |

### 3.5 Stage 5 — CAPABILITY SELECTION

| Field | Definition |
|---|---|
| **Purpose** | Choose which registered capability answers the intent, and (for actions) which single owning service will execute it. |
| **Authoritative owner** | The **AI Capability Registry & Intent Taxonomy** (`THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`, TIP2). Each capability maps to **exactly one** owning service (TIP2 §5, the Ownership Matrix). |
| **Inputs** | The typed intent (stage 1); the resolved capability allow-list (stage 3). |
| **Outputs** | A selected capability id (or an ordered set for a composed request), each bound to its one owning service; or "no capability" → honest gap. |
| **Responsibilities** | Route by lookup, not by branching business logic; compose multiple capabilities where a request spans domains (§4.7); reject any capability outside the allow-list. |
| **Must never own** | Business logic or execution; the definition of new capabilities; a capability that appears under two owners (duplicate ownership is a TIP2 §5.3 violation). Selection orchestrates; it never executes. |

### 3.6 Stage 6 — KNOWLEDGE RETRIEVAL

| Field | Definition |
|---|---|
| **Purpose** | Fetch the governed facts the selected capability needs — always from each fact's single authoritative owner, always permission-filtered. |
| **Authoritative owner** | The **fact's owner**, never the retriever: **Product Knowledge Registry** for knowledge about THA; **NK1/NK2** via `nutrition-knowledge-registry.ts` for nutrition knowledge; **Food Intelligence** for food reasoning inputs; the **derived, permission-classified knowledge index** (TIP1 §3) for document/help corpus; the owning **business service** for the person's own transactional data. The **Source of Truth Register** names the owner for every domain. |
| **Inputs** | The selected capability; the resolved permission set; resolved entity ids. |
| **Outputs** | Retrieved, permission-filtered candidate facts, each carrying its source reference. |
| **Responsibilities** | Read from the one owner; filter by knowledge class *before* results return; scope own-data reads through ownership-scoped services; return *nothing* rather than a fabricated fact when the owner has none. |
| **Must never own** | Any fact — it reads, never authors; a second copy of a fact (the index is a derived, rebuildable projection, never an editable store — TIP1 §3.1, Principle 7); cross-tenant data (own-data reads are scope-filtered — Intelligence Platform Risk R7). |

### 3.7 Stage 7 — EVIDENCE VALIDATION

| Field | Definition |
|---|---|
| **Purpose** | Admit only facts that are true *and* permitted to render, each with a citation, before any of them reaches reasoning. |
| **Authoritative owner** | The **evidence gate** — `shared/knowledge/evidence.ts` and **Decision Engine Rule E1** (`THA_DECISION_ENGINE_ARCHITECTURE.md`): *no citation, no card*. Each admitted item carries an `EvidenceCitation { source, detail }`. Nutrition/health claims additionally pass the source-gated registry and its EFSA wording firewall (Intelligence Platform §4.3). |
| **Inputs** | Retrieved candidate facts with source references. |
| **Outputs** | Validated evidence set — every item cited and permitted; uncited candidates dropped. |
| **Responsibilities** | Enforce citation-or-drop; carry the source reference forward so the response can cite it; mark the *absence* of qualifying evidence explicitly (an empty validated set is the honest-gap trigger for stage 8). |
| **Must never own** | The generation of evidence (it validates what stage 6 retrieved); the phrasing (stage 9); the decision to soften or invent a claim to fill a gap. A gap surfaced here becomes an honest gap, never a fabrication. |

### 3.8 Stage 8 — REASONING

| Field | Definition |
|---|---|
| **Purpose** | Compose an answer *from the validated evidence* — synthesise, explain, compare, sequence — using LLM reasoning for language and judgement of relevance, not for facts. |
| **Authoritative owner** | LLM reasoning, operating **under the Companion Platform invariant** (`THA_COMPANION_PLATFORM_ARCHITECTURE.md` §0) and the honest-gap guarantee (Intelligence Platform Principle 6). Deterministic business judgements remain owned by business services and the **Decision Engine** (DEC1). |
| **Inputs** | The validated evidence set; the composed context; the effective identity's frame. |
| **Outputs** | A grounded draft answer, or an explicit honest-gap signal, each tied to its supporting citations; for actions, a proposed plan to confirm. |
| **Responsibilities** | Reason only over admitted evidence; carry citations through; flag uncertainty as confidence, not as invented certainty; defer every deterministic computation to its owning service. |
| **Must never own** | **Facts.** It may not introduce a claim absent from the validated set, re-derive a number a business service owns, re-rank a capability's judgement, or convert an honest gap into a confident answer. It reasons over truth; it does not manufacture it. |

### 3.9 Stage 9 — RESPONSE

| Field | Definition |
|---|---|
| **Purpose** | Deliver the grounded answer in the Companion's voice, with citations and honest confidence, in the shape the surface expects (sentence, card, spoken reply). |
| **Authoritative owner** | The **Companion Platform** (`THA_COMPANION_PLATFORM_ARCHITECTURE.md`, CPA1) — the **Behaviour Engine** phrases; the Personality Registry supplies voice; Companion Cards / Experience supply rendering. |
| **Inputs** | The grounded draft (stage 8) with its citations. |
| **Outputs** | The final user-facing response — phrased, cited, honest — plus, where a mutation is proposed, a confirmation request. |
| **Responsibilities** | Apply voice as a pure phrasing transform over already-produced output; preserve citations and honest gaps through phrasing; make confirmation legible (especially in voice, where there is no screen — TIP1 §11). |
| **Must never own** | What is true, what is permitted, or what requires confirmation — the Companion Platform may change *how* something is said or *which* already-true fact surfaces, never those three (CPA1 §1). It may not phrase a gap into a certainty. |

### 3.10 Stage 10 — ACTION *(where appropriate)*

| Field | Definition |
|---|---|
| **Purpose** | Execute a confirmed state-changing intent by invoking the one existing business service that owns that mutation. |
| **Authoritative owner** | The **existing business service** (planner, shopping, meal, household, diary, canonical publication, …). The **Intent Engine** only *invokes* it (TIP1 §5.1, INVOKE); the service enforces every business rule and ownership check. |
| **Inputs** | The confirmed typed intent; resolved canonical ids; the effective identity. |
| **Outputs** | The service's real result (success or its own error), reported faithfully. |
| **Responsibilities** | Delegate execution wholly to the owner; require confirmation for mutating/destructive/bulk intents; surface the service's actual result — never a fabricated success or a silent-rollback claim. |
| **Must never own** | Business logic (the service owns it); the decision that the identity may act (stage 3 resolved it); the truth of the outcome (the service reports it). Capabilities orchestrate; business services execute. |

---

## 4. GOVERNING PRINCIPLES

These principles govern *how* reasoning moves through the pipeline. Each names the stage(s) it binds and the
owner it inherits from.

### 4.1 Deterministic business logic vs LLM reasoning
The LLM owns **language and relevance judgement**; deterministic business logic — scores, compliance,
rankings, publication integrity, planner rules — is owned by business services and the Decision Engine, and is
never re-implemented in a prompt. The line: *if getting it wrong is a correctness bug rather than a phrasing
choice, a deterministic service owns it.* (Stages 8, 10.)

### 4.2 Capability orchestration
The Intelligence Platform **orchestrates** capabilities from the registry; it does not contain them. Routing is
a lookup from intent to capability to one owning service — never branching domain logic in the router.
(Stage 5.)

### 4.3 Retrieval before generation
No knowledge claim is generated that was not first retrieved from its owner and validated. Generation is a
transform over retrieved evidence, never a first source of fact. This is the RAG discipline the platform was
founded on (Intelligence Platform Principle 6, Risk R2). (Stages 6–7 before 8.)

### 4.4 Evidence-based responses
Every knowledge claim in a response carries a citation to its source; the evidence gate drops any candidate
that cannot cite (Rule E1, *no citation, no card*). Nutrition/health claims additionally clear the
source-gated registry and EFSA firewall. (Stages 7, 9.)

### 4.5 Honest gaps over fabricated answers
When the validated evidence set is empty, the platform says so — *"I don't have documented guidance on that
yet"* — and never invents an answer to fill the silence. An honest gap is a correct outcome of the pipeline,
not a failure of it. (Stages 7, 8, 9; Intelligence Platform Principle 6.)

### 4.6 Confidence handling
Uncertainty is expressed as **calibrated confidence**, not hidden and not inflated. Low-confidence reasoning is
surfaced as such ("this looks like…, but I'm not certain"), ambiguous intents trigger a clarifying question
(§5), and confidence is never manufactured to sound authoritative. Confidence qualifies grounded evidence; it
never substitutes for it. (Stages 8, 9.)

### 4.7 Capability composition
A request spanning domains composes **multiple registered capabilities**, each still bound to its one owner —
it never grows a new combined capability that owns two domains. "Plan next week and add the gaps to shopping"
is planner-capability + shopping-capability composed, not a new planner-shopping owner. (Stage 5.)

### 4.8 Delegation to existing business services
Every action delegates wholly to the existing service that owns the mutation; the platform adds a typed front
door, never a second implementation. The day a capability needs its own copy of planner or shopping logic is
the day the architecture has failed (Intelligence Platform §12). (Stage 10.)

### 4.9 Permission-aware reasoning
Reasoning happens *inside* the permission set resolved at stage 3, against the *effective* identity resolved at
stage 2. Permission is enforced by retrieval filtering and capability denial — structurally — never by asking
the model nicely (Intelligence Platform §6.2; COMP_AUTH1). (Stages 2–3 gate 4–10.)

### 4.10 Progressive enrichment
Reasoning **enriches** existing workflows and knowledge; it never becomes a second owner of them. Confirmed,
recurring gaps can be promoted — by a named human owner — into governed knowledge (FAQ, Known-Issues, Product
Knowledge Registry entries), closing the loop so the next request is answered from grounded knowledge. The
promotion is an owned editorial act, never a silent platform-internal write (Intelligence Platform §9; PKR).

### 4.11 Graceful failure
Every stage fails **closed and honest**: a retrieval miss → honest gap; an ambiguous intent → clarifying
question; a service error → the service's real error, faithfully surfaced; an unclassified knowledge chunk →
denied (default-deny). A failure never degrades into a fabricated success or a widened permission. (All
stages.)

---

## 5. THE DECISION — WHAT THE PLATFORM DOES WITH A REQUEST

At the head of the pipeline, once the intent is typed (stage 1) and the permission set is resolved (stage 3),
every request resolves to exactly one of six outcomes. This is the reasoning platform's routing logic — itself
deterministic, not a model whim.

```
                    ┌─ intent unrecognised or ambiguous? ──────────────► ASK A CLARIFYING QUESTION
                    │
   typed intent ───►┼─ a state-changing capability the identity holds? ─► PERFORM AN ACTION  (confirm → invoke owner)
                    │
                    ├─ a registered read capability? ──────────────────► INVOKE A CAPABILITY (retrieve → validate → reason)
                    │
                    ├─ answerable from governed knowledge? ────────────► RETRIEVE GOVERNED KNOWLEDGE  (RAG → cite)
                    │
                    ├─ answerable from conversation alone,
                    │     needing no fact and no capability? ──────────► ANSWER DIRECTLY
                    │
                    └─ no permitted evidence / no capability / denied? ─► RETURN AN HONEST GAP
```

| Outcome | When it is chosen | What runs |
|---|---|---|
| **Answer directly** | The request needs no governed fact and no capability — a greeting, a restatement, a meta-question about the conversation itself. | Stages 1–3, then 8–9. No retrieval, because there is nothing to retrieve; still never asserts an ungrounded *fact*. |
| **Retrieve governed knowledge** | A knowledge question answerable from an owned store the identity may read. | Full read path: 4 → 6 → 7 → 8 → 9, cited. |
| **Invoke a registered capability** | The intent maps to a read capability that assembles domain intelligence (e.g. explain a recommendation). | 4 → 5 → 6 → 7 → 8 → 9. |
| **Perform an action** | A state-changing intent the effective identity holds, once confirmed. | Full pipeline through stage 10; confirmation mandatory for mutating/destructive/bulk. |
| **Ask a clarifying question** | The intent is unrecognised, under-specified, or an entity resolves ambiguously. | Short-circuit to stage 9 with a question; resumes on the reply. Preferred over guessing (§4.6). |
| **Return an honest gap** | No permitted evidence exists, no capability matches, or permission denies the only path. | Stages terminate at 9 with an honest gap — never a fabricated answer (§4.5). |

**Precedence.** Permission (stage 3) outranks everything: a request that *would* be an action or a knowledge
answer but for which the effective identity lacks the capability or the knowledge class resolves to an honest
gap — the platform never reveals *that* a privileged path exists by phrasing the denial as capability. Within
the permitted set, prefer the most grounded outcome: a governed-knowledge answer over a direct answer, a
clarifying question over a low-confidence guess, an honest gap over any fabrication.

**Relationship to the Decision Engine.** When the request is *"why was this surfaced / recommended?"*, stage 6
retrieves the **sealed `DeliveryDecision`** the Decision Engine already recorded (DEC1) — the platform explains
an existing decision; it does not re-run or second-guess the surfacing pipeline. The two pipelines meet here
(explanation) and at the shared evidence gate (stage 7); they never merge.

---

## 6. WORKED EXAMPLES

Each traces one request through the pipeline. These are illustrative walkthroughs, not new behaviour.

### 6.1 "Why was this meal recommended?"
*Outcome: invoke a registered capability (read) — explain an existing decision.*

1. **Intent** → `{ kind: question, capability: explain-recommendation, subject: <mealId> }`.
2. **Effective identity** → the signed-in household member (or, under impersonation, the impersonated user).
3. **Permission resolution** → own-household scope; `public` + `household` knowledge; read capability allowed.
4. **Context composition** → the meal's Context View + the household frame, budgeted and deterministic.
5. **Capability selection** → `explain-recommendation`, bound to meal-intelligence / the Decision Engine reader.
6. **Knowledge retrieval** → the **sealed `DeliveryDecision`** for that meal (DEC1) plus the meal-intelligence
   evidence that fed it — read from their owners, household-scoped.
7. **Evidence validation** → each reason carries its `EvidenceCitation`; uncited reasons drop.
8. **Reasoning** → compose the *recorded* reasons into a plain-language explanation; add nothing the decision
   did not contain.
9. **Response** → *"It fits your week because it uses the chicken you have and adds a new plant you haven't had
   this week — based on your plan and pantry."* Cited. **No action.**

*If the decision record or evidence is missing:* honest gap — *"I don't have a recorded reason for that one"* —
never a plausible-sounding invention.

### 6.2 "Publish Canonical Foods."
*Outcome: perform an action — privileged, confirmed, delegated.*

1. **Intent** → `{ kind: action, capability: canonical.publish }`.
2. **Effective identity** → resolved; role read from `access.ts`. Under impersonation, the **impersonated**
   role governs — an admin impersonating a user **cannot** publish (COMP_AUTH1).
3. **Permission resolution** → is `canonical.publish` in this effective role's allow-list? If the effective
   role is `user` → **denied → honest gap** (§5 precedence), and the platform does not reveal the capability
   exists. If `admin`/authorised → continue.
4. **Context composition** → the publication pre-flight view (candidate counts, integrity state), budgeted.
5. **Capability selection** → `canonical.publish`, bound to the **one** owning publication service
   (`server/verification/publication-register.ts` / the Canonical Publication Architecture).
6. **Knowledge retrieval** → current publication integrity + what would publish — read from the owner.
7. **Evidence validation** → integrity evidence cited; if integrity fails its gate, the action is blocked with
   the real reason.
8. **Reasoning** → assemble a confirmation plan: *"Publish 142 canonical foods? 3 have unresolved integrity
   warnings."*
9. **Response** → the confirmation request (mandatory — this mutates shared state).
10. **Action** → on confirm, **invoke the publication service**, which enforces every integrity rule and
    ownership check and returns its real result. The platform reports that result verbatim-in-spirit — never a
    fabricated "Published ✓". Audited to `admin_audit_log`.

### 6.3 "How do I recover production?"
*Outcome: depends entirely on the effective identity — the clearest permission case.*

1. **Intent** → `{ kind: question, subject: production-recovery }`.
2. **Effective identity** → resolved.
3. **Permission resolution** → production-recovery runbooks are **`developer`-class** knowledge. The model
   `public ⊂ household ⊂ admin ⊂ developer` **fails closed to `developer`**, so only a developer-classed
   identity may read them.
4–7. **For a `user` or `admin`:** retrieval returns **nothing permitted** → the validated evidence set is
   empty. **For a developer:** the runbook is retrieved, permission-filtered, and validated with citations.
8–9. **User/admin →** honest gap: *"That's operational guidance I can't help with from here."* The denial does
   not leak the runbook's existence or contents (Intelligence Platform §6.2). **Developer →** a grounded,
   cited recovery answer from the developer-class knowledge, in an isolated developer plane user traffic never
   reaches (Intelligence Platform §7). **No production action** is performed from the user-facing plane.

*Same sentence, two identities, two lawful outcomes — proof that permission is resolved before retrieval, not
patched afterward.*

### 6.4 "Compare these two foods."
*Outcome: retrieve governed knowledge + a deterministic comparison.*

1. **Intent** → `{ kind: question, capability: compare-foods, subjects: [foodA, foodB] }`.
2. **Effective identity** → resolved; `public` nutrition knowledge is readable by all roles.
3. **Permission resolution** → `public` class; `compare-foods` read capability allowed.
4. **Context composition** → both foods' Context Views, budgeted so both fit and neither is truncated into
   invalid JSON (the exact defect INT17 fixed).
5. **Capability selection** → `compare-foods`, bound to **Food Intelligence** (NK1/NK2 methodology).
6. **Knowledge retrieval** → both canonical food reports from `nutrition-knowledge-registry.ts` — the one
   owner — each with `SourceRef`.
7. **Evidence validation** → every nutrition claim cited and cleared through the source-gated registry + EFSA
   firewall; uncited claims drop.
8. **Reasoning** → the **deterministic** comparison (which is higher in what, per NK2 methodology) is computed
   by Food Intelligence; the LLM *presents* the differences, it does not compute or invent them.
9. **Response** → a cited side-by-side (the `FoodComparisonView` surface). **No action.**

*The division is the principle in miniature: the business service owns the comparison; reasoning owns the
sentence.*

### 6.5 "Plan meals for next week."
*Outcome: perform an action — multi-step, composed, delegated, confirmed.*

1. **Intent** → `{ kind: action, capability: planner.generateWeek, target: next-week }`.
2. **Effective identity** → the household member; own-data scope.
3. **Permission resolution** → own-data write capability allowed (no privileged class needed).
4. **Context composition** → household preferences, restrictions, pantry, existing plan — budgeted,
   deterministic, own-scope only.
5. **Capability selection** → `planner.generateWeek` (composing the smart-meal engine + planner service); a
   follow-on shopping capability may compose if requested — each still bound to its one owner (§4.7).
6. **Knowledge retrieval** → household constraints and pantry from their owning services, household-scoped.
7. **Evidence validation** → constraints cited (e.g. *"no nuts — from your household restrictions"*).
8. **Reasoning** → assemble a proposed week and a confirmation plan; deterministic meal selection stays in the
   smart-meal engine.
9. **Response** → *"Here's a plan for next week — 7 dinners, within your no-nuts restriction and using the mince
   you have. Add it to your planner?"* — confirmation, because it mutates the plan.
10. **Action** → on confirm, **invoke the planner / smart-meal service**, which owns every rule; report its
    real result. If a day cannot be filled, surface *that* honestly — never a fabricated full week.

---

## 7. GOVERNING ARCHITECTURAL LAWS

These are the inviolable laws of the reasoning pipeline. Every future Intelligence Platform implementation is
measured against them.

1. **One Intelligence Platform.** There is one intelligence platform, not one per surface, persona, or
   capability. New capability is a new profile over the one spine, never a new platform.

2. **One reasoning pipeline.** Every intelligence request — question, explanation, or action; text or voice —
   travels the same ten stages in the same order. There is no side path and no freeform execution.

3. **One owner per fact.** Every fact has exactly one authoritative owner (the Source of Truth Register). The
   pipeline *reads* owners; it never becomes a second owner of any fact, and the knowledge index is a derived,
   rebuildable projection, never an editable store.

4. **Retrieval before generation.** No knowledge claim is generated that was not first retrieved from its owner
   and passed the evidence gate. Generation transforms evidence; it never sources it.

5. **Permissions before retrieval.** The permission set is resolved from the effective identity before any
   knowledge is retrieved, any capability selected, or any action taken. Nothing downstream escapes it.

6. **Context guides relevance, never authority.** The Context Composition Engine may change how much of an
   already-true fact the model sees and in what shape; it may never change what is true, invent a fact,
   re-rank a capability's judgement, or hide an omission.

7. **Capabilities orchestrate; business services own execution.** The platform routes and composes
   capabilities; every mutation is executed by the one existing service that owns it. The engine holds zero
   domain logic.

8. **Intelligence enriches workflows; it does not replace business logic.** Deterministic business
   judgements — scores, compliance, rankings, publication integrity — stay in their owning services and the
   Decision Engine. Intelligence adds a reasoning and language layer over them, never a second copy of them.

9. **Honest gaps over fabricated certainty.** When permitted, grounded evidence does not answer the question,
   the platform returns an honest gap. A gap is a correct outcome of the pipeline; a fabrication is a defect of
   it.

**Corollary — effective identity is the only identity.** Every law above that says "the identity" means the
**effective authenticated identity** (COMP_AUTH1). Impersonation changes whose permissions the pipeline reasons
under; it never widens them, and the audit obligation on the actor is independent of what the Companion sees.

---

## 8. DEFINITION OF DONE

- [x] Extends the existing Intelligence Platform architecture; references its parts rather than duplicating
      them (§1, every stage cites its owner).
- [x] Defines the complete reasoning pipeline — ten stages, in order — with purpose, authoritative owner,
      inputs, outputs, responsibilities, and what-it-must-never-own for each (§2–§3).
- [x] States the governing principles: deterministic-vs-LLM, orchestration, retrieval-before-generation,
      evidence-based, honest gaps, confidence, composition, delegation, permission-aware, progressive
      enrichment, graceful failure (§4).
- [x] Describes how the platform decides to answer directly / retrieve / invoke / act / clarify / return a gap
      (§5).
- [x] Includes the five worked examples, each traced through the pipeline (§6).
- [x] Concludes with the nine governing architectural laws (§7).
- [x] Architecture only — no implementation, no schema change, no AI-logic change. Rollback identifier
      reported before any change: `intarch1-rollback`.

**This document is now the governing reasoning architecture for every future Intelligence Platform
implementation.** All Companion reasoning follows this one canonical pipeline, preserving single ownership,
permission-aware access, and governed knowledge.

---

## 9. GOVERNANCE, SCOPE & FOLLOW-UPS

**Scope.** Architecture only. No component, route, data, schema, migration, test, or AI logic was touched. The
sole artifacts of this workstream are this document and its session run file.

**What this document owns:** the shape of the reasoning pipeline and the order of its stages. **What it does
not own:** any stage's internal rules — those remain wholly with the owners cited in §3 (Intent Engine,
COMP_AUTH1 + `access.ts`, Product Knowledge Registry, Context Composition Engine, AI Capability Registry,
NK1/NK2 + Food Intelligence, the evidence gate, the Decision Engine, the Companion Platform, and the owning
business services). This document restates none of them and defers to each completely.

**Follow-ups (documentation, deliberately not performed here to avoid modifying tracked index/register files —
the same discipline COMP_AUTH1 followed on 2026-07-17):**
1. Register INTARCH1 in `docs/architecture/README.md` under **Intelligence Governance**, and in
   `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`.
2. Add citations to INTARCH1 from the Intelligence Platform, Capability Registry, Context Composition,
   Companion Platform, and COMP_AUTH1 documents as the pipeline they collectively realise.
3. A later, separately-gated **conformance review** verifying that the live Companion runtime already executes
   the ten stages in this order — this document asserts the law that review checks against; it changes nothing.

**Rollback.** `git reset --hard intarch1-rollback` (→ `7bfad50ca198f2b86f6501a4f82d8ae41af9260b`) removes this
document with no other effect, because nothing else was changed.
