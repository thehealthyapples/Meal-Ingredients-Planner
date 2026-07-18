# COMP_AUTH1 — The Companion Authority Model

**The governing authority model for Companion identity, permissions and impersonation. The Companion's
accessible knowledge, capabilities and actions are determined *solely* by the effective authenticated
identity — never by the administrator performing an impersonation, and never by where in the product the
conversation happens to occur.**

Architecture work. **No implementation. No schema changes. No AI logic changes.** This document defines the
law; it wires nothing.

| | |
|---|---|
| **Doc ID** | `COMP_AUTH1` |
| **Date** | 2026-07-17 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `comp-auth1-companion-authority-model-rollback-20260717` → working-tree snapshot `d5901e8e` |
| **Status** | **Governing architecture. The authority model every future Companion implementation, context-composition decision and permission check must obey.** |
| **Product changed** | **None.** An architecture document. No component, route, data, schema, or AI logic touched. |

---

## 0. What this document is, and what it governs

This is the **constitution of Companion authority**. It sits above every existing Companion architecture and
binds all future ones. It defines: who the Companion *is*, whose permissions it reasons under, what changes
under impersonation and what must never change, and the audit obligation the platform carries independently of
what the Companion sees.

It **restates no rule** it does not own and **cites** its governors rather than duplicating them:

- **`THA_COMPANION_PLATFORM_ARCHITECTURE.md`** — the Companion as a single platform surface. COMP_AUTH1
  supplies the identity-and-permission law that surface runs under.
- **`THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md`** — how the Companion's working context is assembled.
  COMP_AUTH1 governs *whose* identity that composition keys on: always the **effective** identity.
- **`THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`** — the registry of what the Companion *can* do.
  COMP_AUTH1 governs *which* of those capabilities are reachable in a given turn: exactly those the effective
  identity holds.
- **The Product Knowledge Registry permission model** (`THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`;
  register § "Permission model"): per-entry visibility `public ⊂ household ⊂ admin ⊂ developer`, **monotonic**,
  **fails closed to `developer`**, keyed on **role, never subscription tier**, and **filtered before prompt
  composition**. This is the primary enforcement surface COMP_AUTH1 governs: it must filter on the **effective**
  identity's role.
- **COMP1 / COMP2 / COMP3** — the Companion's single identity, presence and long-term relationship. "One
  Companion" (§ 3 below) is the authority-model expression of the identity those documents already lock.

**It changes no behaviour, no schema, and no AI logic.** It states the invariants that any implementation of
those things must satisfy. Where it names the current impersonation mechanism (§ 9), it does so only to bind
the law to the real system — it proposes no code and no schema.

---

## 1. The problem this model closes

Two failure modes, both latent wherever a privileged operator can step into a normal user's shoes, and both
fatal to a household product built on trust:

1. **Location as authority.** The Companion is *one presence in every room* (COMP1/§ 13). It appears in
   household experiences, in support experiences, and in admin experiences. The hazard is that the *place* a
   conversation occurs silently confers *power* — that the Companion, because it was opened on an admin page,
   would answer with admin knowledge regardless of who is actually there. **Location must be context, never
   authority.**
2. **Impersonation privilege leakage.** An administrator can act *as* a user (today, benchmark-household
   impersonation; § 9). The hazard is that the Companion, reasoning from the administrator's latent power
   rather than the impersonated user's, would disclose engineering knowledge, admin capabilities, or
   operational procedures *into a session that is supposed to be reproducing an ordinary user's experience* —
   leaking privileged knowledge across an identity boundary, and simultaneously destroying the one thing
   impersonation is *for*: seeing exactly what the user sees.

COMP_AUTH1 closes both by making a single quantity — the **effective authenticated identity** — the sole
source of Companion authority, and by separating that quantity cleanly from the **actor** the platform must
still hold for audit.

---

## 2. The core model — Actor Identity and Effective Identity

Two identities exist in every Companion turn. The platform always knows both. **The Companion reasons only
from one.**

- **Actor Identity** — *who is operating the session.* The authenticated principal at the keyboard. The
  platform retains this for audit, governance and security **at all times, without exception.**
- **Effective Identity** — *who the Companion is reasoning as.* The identity whose permissions, knowledge and
  context define the entire Companion experience for this turn.

| Situation | Actor Identity | Effective Identity | The Companion reasons as |
|---|---|---|---|
| **Normal operation** | the user | the user | the user (**Actor = Effective**) |
| **Impersonation** | the administrator | the impersonated user | **the impersonated user** (Actor ≠ Effective) |

The entire model is the discipline of this one line: **the platform records the Actor; the Companion serves
the Effective.** Everything below is a consequence.

---

## 3. Principle 1 — One Companion

**There is exactly one Companion in The Healthy Apples.** It has **no** household edition, **no** support
edition, and **no** admin edition. There is not a "household Companion" that becomes an "admin Companion" on an
admin page. There is one presence, one identity (COMP1), one voice, whose *reach* — what it can see and do —
is set entirely by the effective identity it is currently serving.

This is the authority-model reading of the identity COMP1–COMP3 lock: the Companion does not *become* a
different entity when permissions differ. **The same Companion, different reach.** An administrator and a
household member talk to the *same* Companion; it simply knows and can do different things for each, because
they are different effective identities — not because they are talking to different Companions.

**Consequence.** No implementation may fork the Companion by audience. There is no `AdminCompanion`,
`SupportCompanion`, or `HouseholdCompanion` as distinct entities. Differences in reach are always expressed as
differences in the effective identity's permissions, resolved against one Companion — never as differences in
*which* Companion is instantiated.

---

## 4. Principle 2 — Permission-aware intelligence (context, not authority)

**The Companion's accessible knowledge is determined solely by the effective authenticated identity.**

**Location within the application provides context. It never grants authority.**

Where a conversation happens tells the Companion *what the person is looking at and likely cares about* — the
Planner, the pantry, an admin observation workbench, a support view. That context legitimately shapes
*relevance*: what to foreground, what the person is probably asking about. It must **never** shape *reach*.
Opening the Companion on an admin page does not make admin knowledge available; opening it in a support
experience does not unlock support-only capability. **The page sets the subject; the effective identity sets
the permissions.**

Concretely, against the PKR permission model: context composition may use *location* to decide **which**
household- or public-tier material is most relevant, but the **visibility filter that decides what tier is
permitted at all** keys on the **effective identity's role** — filtered *before* prompt composition, monotonic,
failing closed to `developer`. A room can never raise the tier. Only identity can.

**The test:** if moving the same conversation, with the same effective identity, from one room to another would
change what the Companion is *permitted* to know or do, the model is violated. Relevance may change with the
room; authority may not.

---

## 5. Principle 3 — Effective identity governs everything the Companion does

**The Companion always reasons as the effective user.** In normal operation the effective identity *is* the
actor; under impersonation the effective identity is the impersonated user and the actor is the administrator.
Either way, the Companion uses the **effective identity, and only the effective identity**, for all seven of
the following — the complete surface of what a Companion turn produces:

1. **Capability access** — which registered capabilities (`THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`)
   are reachable this turn.
2. **Knowledge retrieval** — which knowledge-registry entries and household facts are readable (PKR visibility,
   keyed on the effective role).
3. **Permission checks** — every authorisation decision the Companion's reasoning depends on.
4. **Context composition** — whose household, whose rhythms, whose experience the working context is assembled
   from (`THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md`).
5. **Information disclosure** — what the Companion is allowed to *say*: it may disclose only what the effective
   identity is permitted to know.
6. **Actions** — anything the Companion does or delegates (`INT40`-class assisted actions) executes with, and
   is bounded by, the effective identity's authority.
7. **Recommendations** — even suggestions are shaped only from what the effective identity may see; the
   Companion cannot recommend on the basis of knowledge the effective identity does not hold.

There is **no eighth channel.** If a Companion turn produces anything — a word, a card, a Next Step, a
delegated action — its authority was drawn from the effective identity. **Fail closed:** where the effective
identity is uncertain, the Companion reasons at the *lowest* reach consistent with what is known, never the
highest (mirroring PKR's fail-closed posture).

---

## 6. Principle 4 — Audit separation

**The platform must always retain both identities.** For every Companion turn, independently of what the
Companion is permitted to see, the platform holds:

- **Actor Identity** — who was operating (the administrator, under impersonation).
- **Effective Identity** — who the Companion served.

This pairing is the permanent record for **audit, governance and security**: *"administrator A, acting as user
U, held this conversation."* It answers the questions the Companion is deliberately blind to — who did this,
under whose real authority, and on whose behalf.

**The separation is the point.** The **Companion reasons only from the Effective Identity** — it neither knows
nor uses the actor — while the **platform records both.** The Companion's blindness to the actor is not a gap
in the audit trail; the audit trail lives *outside* the Companion, in the platform, precisely so that the
Companion can serve the effective user faithfully while the platform holds the operator accountable. Neither
identity may ever be dropped: an effective-only record cannot attribute the operator; an actor-only record
cannot reproduce what was served.

---

## 7. Principle 5 — No privilege leakage across the identity boundary

**During impersonation, the Companion experience must reproduce *exactly* the experience the impersonated
account would receive — no more, and no less.** The administrator's latent power does not cross the boundary
into the impersonated session.

Specifically, while impersonating, and unless the impersonated account *itself* holds them:

- **administrator capabilities are unavailable;**
- **engineering knowledge is unavailable;**
- **operational procedures are unavailable;**
- **support-only capabilities are unavailable.**

The qualifier is exact and symmetric: a capability is available under impersonation **if and only if** the
*impersonated* identity would have it in an ordinary session. Impersonation neither adds the administrator's
privileges nor subtracts the impersonated user's own. The effective identity is reproduced faithfully, whole.

**Why this is non-negotiable.** Impersonation exists to let an operator *see what the user sees* — to diagnose,
to support, to verify the real experience. A Companion that leaked admin knowledge into an impersonated session
would (a) disclose privileged information across an identity boundary — a security failure — and (b) show the
operator a *fiction* rather than the user's actual experience, defeating the only purpose impersonation has.
Faithful reproduction is simultaneously the security guarantee and the feature.

**Consequence.** No capability, knowledge tier, or procedure may be reachable in an impersonated turn on the
strength of the *actor's* permissions. Reach is computed from the effective identity alone, exactly as in a
genuine session belonging to that user.

---

## 8. Principle 6 — Exiting impersonation

**When impersonation ends, the Effective Identity returns to the administrator, and the Companion immediately
regains administrator permissions.** The transition is clean and total in both directions:

- **Entering** impersonation: Effective Identity becomes the impersonated user; the Companion's reach
  collapses to that user's; the platform continues to record the administrator as Actor.
- **Exiting** impersonation: Effective Identity returns to the administrator; the Companion's reach is restored
  to the administrator's, with no residue of the impersonated session's context, knowledge, or narrowed reach.

There is no partial or lingering state. The effective identity is always exactly one principal, switched
atomically. The Companion holds nothing across the boundary — neither elevated reach *into* an impersonation
nor the impersonated user's context *out of* one. **The Companion is the same Companion throughout; only the
effective identity it serves changed, and then changed back.**

---

## 9. Binding the model to the real system *(grounding only — no implementation)*

The law above governs the mechanism that already exists, without amending its code or schema. Today,
impersonation is the session-scoped benchmark-household facility: the session carries
`benchmarkImpersonation = { adminUserId, … }` while the authenticated login is switched to the impersonated
household user, and exiting re-establishes the administrator's session (`server/routes.ts`, the
`/api/admin/benchmark-households/:id/impersonate` and `/api/benchmark-impersonation/stop` routes).

Read through COMP_AUTH1, that mechanism already embodies the two-identity model:

- the retained **`adminUserId` is the Actor Identity** — the platform's held record of who is operating;
- the **switched login is the Effective Identity** — whom the Companion must reason as.

COMP_AUTH1 therefore adds **no new store and no new schema**. It names the invariants the mechanism must honour:
the Companion's context composition, capability access and disclosure must key on the **effective** (switched)
identity, never on the retained `adminUserId`; and the platform must continue to retain both for audit (§ 6).
Any future impersonation surface beyond benchmark households (e.g. support impersonation) inherits this model
unchanged — the vocabulary (Actor / Effective) is deliberately mechanism-independent so it governs all of them.

**This section asserts requirements, not changes.** Whether the current implementation already satisfies them
in full is a verification question for a later, separately-gated review — not a change made here.

---

## 10. The governing laws

The architectural laws of Companion authority. Every future Companion implementation, context-composition
decision and permission check is subject to them.

1. **The Companion has one identity.** One Companion in THA; no household, support, or admin editions — the
   same Companion, with reach set by the effective identity. *(§ 3)*
2. **Authority comes from permissions, never location.** What the Companion may know or do is set by the
   effective identity's permissions alone. *(§ 4)*
3. **Context comes from the current experience; context never grants authority.** The room shapes relevance;
   it can never raise reach. *(§ 4)*
4. **Impersonation changes the effective identity, not the Companion.** The Companion is unchanged; only whom
   it serves changes. *(§ 3, § 8)*
5. **The audit trail records the actor; the Companion serves the effective user.** The platform always retains
   both identities; the Companion reasons only from the effective one. *(§ 6)*
6. **No privileged knowledge may leak across an identity boundary.** Under impersonation the Companion
   reproduces exactly the impersonated user's experience — capabilities, knowledge and procedures available if
   and only if that user holds them. *(§ 7)*
7. **Effective identity is the sole source of Companion authority.** Capability access, knowledge retrieval,
   permission checks, context composition, disclosure, actions and recommendations all derive from it and from
   nothing else. *(§ 5)*
8. **Fail closed.** Where the effective identity or its reach is uncertain, the Companion reasons at the lowest
   permission consistent with what is known, never the highest. *(§ 5, PKR fail-closed posture)*

---

## 11. Definition of Done

COMP_AUTH1 is **the governing authority model for every future Companion implementation, context-composition
decision and permission check.** It is done when it is in force as law:

- Every Companion context composition keys on the **effective** identity (§ 5). ✅ *stated as binding law.*
- Every Companion permission and disclosure check resolves against the **effective** identity's permissions,
  fail-closed (§ 4, § 5). ✅ *stated.*
- Impersonation reproduces the impersonated user's Companion experience exactly, with no actor-privilege
  leakage (§ 7), and exits cleanly to the administrator (§ 8). ✅ *stated.*
- The platform retains **both** Actor and Effective identities for audit, independently of the Companion (§ 6).
  ✅ *stated.*
- The eight governing laws (§ 10) are the reference any future Companion authority question is decided against.
  ✅ *this document is that reference.*

Whether the *current* code already satisfies each law is a matter for a later, separately-gated conformance
review; this document establishes the law that review will check against. It changes no code, schema, or
behaviour to do so.

---

## 12. Governance & scope

- **Architecture only.** COMP_AUTH1 defines invariants. It ships nothing, wires nothing, and writes no code,
  schema, migration, or AI logic. Every clause is a constraint on future work, not an act of it.
- **No schema change, no new store.** The Actor/Effective model is a *reading* of identity, not a new column.
  The current mechanism already retains both quantities (§ 9); this document names their roles and obligations.
- **Registration.** As governing architecture, COMP_AUTH1 should be entered into
  `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` and cited by the Companion platform, context-composition, and
  capability-registry architectures. That registration is a documentation follow-up, listed here as the next
  action rather than performed as a change in this workstream.
- **Relationship to COMP1–COMP3.** Those govern what the Companion *is* and how it is *lived with*; COMP_AUTH1
  governs whose authority it *acts under*. "One Companion" (§ 3) is the shared hinge: one identity, one
  presence, one voice — with reach set by the effective user, and never by the operator or the room.

---

## 13. Verification

| Check | Result |
|---|---|
| Git status confirmed · rollback created · identifier reported | ✅ `comp-auth1-companion-authority-model-rollback-20260717` → snapshot `d5901e8e`. |
| Implementation / schema / AI logic changed | **None.** Architecture document only; app source byte-untouched. |
| Principle 1 — One Companion (no household/support/admin editions) | ✅ § 3. |
| Principle 2 — Permission-aware intelligence; location is context, never authority | ✅ § 4. |
| Principle 3 — Effective identity governs the seven Companion channels | ✅ § 5. |
| Principle 4 — Audit separation (platform retains both; Companion reasons from Effective) | ✅ § 6. |
| Principle 5 — No privilege leakage; impersonation reproduces the user's experience exactly | ✅ § 7. |
| Principle 6 — Exiting impersonation restores the administrator cleanly | ✅ § 8. |
| Actor vs Effective identity model (normal + impersonation table) | ✅ § 2. |
| Governing architectural laws | ✅ § 10 — eight laws, incl. all six the brief requires. |
| Bound to the real impersonation mechanism without changing it | ✅ § 9 — grounding only, no code/schema. |
| Definition of Done — governing model for all future Companion authority decisions | ✅ § 11. |
| Code / schema / route / migration / tests | **None** — architecture workstream. |

---

*COMP_AUTH1 — there is one Companion. It draws every ounce of its authority from one place: the effective
authenticated identity it is currently serving. The room it is opened in tells it what you are looking at; it
never tells it what it may know. When an administrator steps into a user's shoes, the Companion steps with them
— becoming, exactly, the Companion that user would meet, with none of the operator's power leaking across the
line — while the platform, quietly and always, remembers who was really there. Authority from permissions,
never location. The audit trail records the actor; the Companion serves the effective user. This is the law.*
