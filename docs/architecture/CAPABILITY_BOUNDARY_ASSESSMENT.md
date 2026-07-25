# THA Capability Boundary Assessment

**Document ID:** `CAPBOUND1`
**Date:** 2026-07-25
**Status:** GOVERNING — the standard every implementation follows **before it stops working**. Governance only: nothing built, no runtime behaviour, no schema, no asset, no deployment.
**Rollback identifier:** `rollback/CAPBOUND1-capability-boundary-assessment-20260725` → `deb63a13`
**Author of record:** Colin Clapson (Home Owner) · drafted by Claude under the Engineering Workflow
**Classification:** Platform Governance — implementation practice, platform-wide. Subordinate to [`ARCHITECTURE_PRINCIPLES.md`](./ARCHITECTURE_PRINCIPLES.md) (bound in particular by **Principle 6** — *honest gaps over invented facts*) and a non-overriding sibling of [`ENGINEERING_WORKFLOW.md`](./ENGINEERING_WORKFLOW.md), which owns the gates this document supplies content to.
**Governing parents (cited, never restated):** [`ARCHITECTURE_PRINCIPLES.md`](./ARCHITECTURE_PRINCIPLES.md) · [`ENGINEERING_WORKFLOW.md`](./ENGINEERING_WORKFLOW.md) · [`THA_CRAFTSMANSHIP_CONSTITUTION.md`](./THA_CRAFTSMANSHIP_CONSTITUTION.md) (`CRAFT1`) · [`GOVERNING_EXPERIENCE_ARCHITECTURE.md`](./GOVERNING_EXPERIENCE_ARCHITECTURE.md) (**GEA20**) · [`HOME_OWNER_ARCHITECTURE.md`](./HOME_OWNER_ARCHITECTURE.md) (`HOMEOWNER1`) · [`THA_BRAND_CONSTITUTION.md`](./THA_BRAND_CONSTITUTION.md) (the One Question)

> **What this document is.** The standard **Capability Boundary Assessment**: the classification every implementation performs **before it stops**, and the **Implementation Completion Report** that carries it. It exists to enforce one sentence — ***a limitation of the tool implementing THA is never reported as a limitation of THA*** — and one consequence: **work continues to the true boundary, and only the work that genuinely requires another capability waits for it.** It creates **no** route, capability, entity, token, component, string, asset, schema, migration, or business logic, and **no runtime code reads it.**

---

## 0. Why this document exists

THA's canon already forbids the two dishonest ways an implementation can end. `LIVING_LARDER_IMPLEMENTATION_CONSTITUTION.md` § 2 (`LARDER4`, cited) states the trigger in one line — *"STOP. Report the constraint. Do not silently approximate the design."* — and names the reason it is load-bearing: *"a silent approximation is the most dangerous outcome this document exists to prevent, precisely because it is invisible: the room still renders, the demo still works, and the substance is gone."* `ARCHITECTURE_PRINCIPLES.md` Principle 6 forbids the other — inventing what is not known rather than showing a gap. Between them, the canon says clearly what must **not** happen at the end of an incomplete implementation.

What no document owned is what must **happen** there:

> **When an implementation cannot be completed, whose limitation is it, how much of the work should already be finished, and what exactly must the report say?**

That gap has a cost, and it is recorded in this repository rather than argued in the abstract. Two entries, both point-in-time history, cited as evidence and not as rule:

- `docs/implementation/pantry/LARDER_PRODUCTION_ASSET_GENERATION.md` § 1 got it **right**, and had to invent the wording to do so: *"This environment has no photographic or AI-image generation capability; the generator … is the highest-fidelity deterministic medium available."* The medium was disclosed, the artefacts were labelled candidates, the aesthetic verdict was routed to the seat that owns it, and the work that did not need the missing capability was **finished**. That is this document's standard, discovered once, by one session, with no standard to follow.
- `.engineering/session/runs/LARDER6_North_Star_Implementation.md` records the same boundary handled **wrongly**: *"The prior session stalled on whether the room could be built at all without new photographic assets. Resolved on the Home Owner's instruction (2026-07-25): it can, and it is to be."* A session stopped, in full, on a boundary that was never an architecture question — and it took the Home Owner's time to establish that the room was buildable from the assets that already existed. Nothing about THA blocked that work. The stop was attributed to the project, and the project was not the cause.

The second case is the failure mode this document exists to end, and it is worth naming precisely, because its two halves cost different things:

1. **Misattribution.** A missing capability in the *implementer* is reported as a missing answer in the *architecture*. The two demand opposite responses: an architecture gap is closed by an owner making a decision; a model capability gap is closed by using a different tool for one narrow step and changing nothing else. Misattributed, the project is invited to amend a document that was never wrong — and **a canon amended to accommodate a tool is a canon weakened for no reason**, permanently, long after the tool has changed.
2. **Premature stopping.** Work that did not depend on the boundary stops with it. One unavailable artefact halts a whole room, when the room's shell, plan, light, furniture, interactions and honest placeholders were all reachable.

This document closes that gap **as a standard, not as a new rule of the product**. It adds no law about what THA is, does, looks like, or feels like. It governs the honesty of the *report about the work* — which is Principle 6 applied one level up: **the same non-fabrication guarantee THA gives a household about its food, THA gives its own owner about its own progress.**

---

## 1. What this document owns — exactly, and nothing else

It owns **three** things and no fourth:

1. **The Capability Boundary Assessment** — the mandatory classification of every item of remaining work into exactly one of five kinds, with the discriminating test that assigns it (§ 3–§ 5).
2. **The Implementation Completion Report** — the standard shape in which completion and remaining work are declared: *Architecture Complete · Engineering Complete · Interaction Complete · Existing Assets Used · New Assets Required · Remaining Gaps*, with the five required fields on every gap (§ 6–§ 7).
3. **The rules that bind a stop** — `CB1`–`CB12` (§ 8): attribution, maximum completion, no silent substitution, no architectural compromise, the smallest next action, and the recording obligation.

It owns **nothing else.** Every already-owned concern is **cited, never copied**:

| Concern | Canonical owner (cited, never re-owned here) |
|---|---|
| The eight engineering principles; non-fabrication (**Principle 6**) | [`ARCHITECTURE_PRINCIPLES.md`](./ARCHITECTURE_PRINCIPLES.md) |
| The implementation gates, the mandatory report sections, the Completion Gate, `STEP 1`–`STEP 9` | [`ENGINEERING_WORKFLOW.md`](./ENGINEERING_WORKFLOW.md) |
| The process of a session — rollback, open, verify, build, review, commit, push | [`.engineering/OPERATING_MANUAL.md`](../../.engineering/OPERATING_MANUAL.md) |
| Rollback identifiers, and what a tag does *not* protect | [`.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`](../../.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md) |
| **Risk rating, scope lock, and out-of-scope discoveries** | [`.engineering/standards/RISK_AND_SCOPE_STANDARD.md`](../../.engineering/standards/RISK_AND_SCOPE_STANDARD.md) |
| The report shape a completion report is a section of | [`.engineering/templates/IMPLEMENTATION_TEMPLATE.md`](../../.engineering/templates/IMPLEMENTATION_TEMPLATE.md) |
| The standard of craft, and the design method (architecture first, existing code last) | [`THA_CRAFTSMANSHIP_CONSTITUTION.md`](./THA_CRAFTSMANSHIP_CONSTITUTION.md) (`CRAFT1`) |
| The direction authority flows — downward, never up from pixels (**GEA20**) | [`GOVERNING_EXPERIENCE_ARCHITECTURE.md`](./GOVERNING_EXPERIENCE_ARCHITECTURE.md) |
| **Final aesthetic approval**; refusal on character; *an unrecorded approval is not an approval* | [`HOME_OWNER_ARCHITECTURE.md`](./HOME_OWNER_ARCHITECTURE.md) (`HOMEOWNER1`) |
| The specification of every Larder object, and its 21 dimensions | [`LIVING_LARDER_ASSET_LIBRARY.md`](./LIVING_LARDER_ASSET_LIBRARY.md) (`ASSET1`) |
| The visual/material admission standard for an admitted object | [`LIVING_HOME_DESIGN_CONSTITUTION.md`](./LIVING_HOME_DESIGN_CONSTITUTION.md) (`LHDC1`) |
| The **Larder build's** STOP-on-conflict trigger, its rejection criteria and its Definition of Done | [`LIVING_LARDER_IMPLEMENTATION_CONSTITUTION.md`](./LIVING_LARDER_IMPLEMENTATION_CONSTITUTION.md) (`LARDER4`) § 2, § 9, § 10 |
| Where every document lives | [`REPOSITORY_CONVENTIONS.md`](./REPOSITORY_CONVENTIONS.md) |

**Restate-no-rule** (the `LIVINGHOME2` / `LHDC1` / `CRAFT1` discipline, cited). Any sentence in this document later found to duplicate an owned rule is a defect in *this* document and is corrected to a citation. **On any question of *rule*, the rule's owner prevails and this document is corrected.**

### 1.1 Its relationship to `LARDER4` § 2 — one trigger, one content

`LARDER4` § 2 owns the **trigger** for the Larder build: *when* to stop, and the prohibition on silent approximation. This document owns **what happens at the stop** — the classification, the attribution, and the report. Neither restates the other, `LARDER4` is **byte-untouched**, and within the Larder `LARDER4` prevails on anything it states. What this document adds is that the trigger is no longer one room's discipline discovered by one session: it is the platform's, and the report it produces has a standard shape.

### 1.2 A naming boundary that must not be blurred

THA already uses the phrase **"capability boundary"** for something entirely different: `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` § 6 (cited) uses it for the **runtime authorisation** boundary — the Capability Registry's role→intent allow-list, enforced server-side at invoke time by `server/lib/access.ts`, *"the LLM's output is advisory; the server is authoritative."* That meaning is **unchanged and remains solely TIP's.**

This document owns the phrase **"Capability Boundary Assessment"** and nothing shorter. It concerns the capabilities of **the implementer of THA**, never the capabilities a household or a role may invoke **inside** THA. The two never appear in one sentence, and a Capability Boundary Assessment **can never authorise anything** — it classifies work and recommends a next action. No permission, tier, role, or access decision follows from any word in it.

### 1.3 What is **not** a capability boundary

Three things are routinely mistaken for one. Each has an owner, and misfiling them here would create a second owner of it:

| Not a boundary | What it actually is | Owner |
|---|---|---|
| Work deliberately not attempted | **Scope Lock** — *excluded scope* and *SUGGESTION* | `RISK_AND_SCOPE_STANDARD.md`; `ENGINEERING_WORKFLOW.md` `STEP 5` |
| Something built wrongly | A **defect** — fixed at the cause, or recorded as a defect | the owning workstream |
| Work that is merely hard | **Difficulty** — met with craft, not with a stop | `LARDER4` § 2; `CRAFT1` § 3 |

The distinction between the first row and this document's **Remaining Gaps** is load-bearing and is stated as a rule at `CB6`: *excluded scope is a decision taken; a remaining gap is a boundary met.* Filed under Scope Lock, a boundary is never classified, and the misattribution this document exists to prevent happens silently instead.

**Difficulty is never a boundary.** This document is emphatically **not a licence to stop at the first obstacle** (`LARDER4` § 2, cited: *"Difficulty is met with craft; genuine conflict is met with STOP"*). Its whole first half is the requirement to **keep going**; the classification exists to make the *rare* honest stop legible, not to make stopping easy.

---

## 2. The governing distinction

> ### A project limitation is a fact about The Healthy Apples. A model capability limitation is a fact about the tool holding the pen. They are never the same statement, and they never have the same remedy.

Everything in this document follows from that sentence.

THA's architecture, repository, assets and dependencies are **the project**. They can be genuinely incomplete, and when they are, saying so is valuable: it is how an owner learns what to decide, what to build, and what to commission. Reporting a project limitation honestly is a service to THA.

The model and environment implementing THA are **not the project**. They change — a different tool, a different session, a later month — while the architecture endures. A limitation there is a temporary property of the pen, and reporting it as a property of the house is **false**. It is false in the specific way THA cares most about: it is a confident, plausible, unfalsifiable-looking claim about something the reader cannot easily check, which is exactly the shape of the fabrication Principle 6 exists to forbid (*"Trust is the product … This is non-negotiable"*, cited).

Two consequences, both binding:

- **A Model Capability Gap is never a defect in THA, and never an amendment proposal.** It produces no architecture change, no exception, no relaxed rule, no permanent gap in the canon (`CB5`, `CB10`). The architecture that could not be built today by this tool is not thereby wrong; it is *unbuilt by this tool*, which is a different sentence with a different remedy.
- **A project limitation is reported plainly and without apology.** An honest *"THA does not yet answer this question, and here is the smallest decision that would"* is worth more than any amount of work built past it — because work built past an unanswered architectural question is work built on an invented answer (`CB4`, `CB5`).

---

## 3. The Attribution Test

Every item of remaining work is classified by **one question**, asked before anything else:

> ### If a different implementer — with this same repository, this same governing architecture, and this same approval state — sat down right now, would this item still be blocked?
>
> - **YES** → the boundary belongs to **the project**. It is an **Architecture Gap**, a **Repository Gap**, an **Asset Gap**, or an **External Dependency**.
> - **NO** → the boundary belongs to **the implementer**. It is a **Model Capability Gap**.

The test is deliberately mechanical, because the failure it prevents is not a failure of honesty but of *framing*: it is genuinely easy, and feels accurate at the time, to write *"the architecture requires photographic assets that do not exist"* when the true statement is *"the architecture specifies photographic assets; this tool cannot produce photographs; the specification is complete and correct."* The first sentence points at THA. The second points at the pen. Only the second is true, and only the second produces the right next action.

**When the answer is genuinely unclear, the classification is NOT "Model Capability Gap".** Uncertainty is resolved by looking: read the architecture for an owner, search the repository for the module, check the asset register for the artefact. The classification is evidence-based, and each gap must cite the evidence that assigned it (`CB2`, `CB11`). Guessing a classification is the same defect as guessing a fact.

**Misclassification is corrected, not defended.** A gap recorded as a Model Capability Gap that a later session closes with a tool it did have was misclassified; the correction is recorded in the same change that discovers it, in the same manner the canon already corrects a stale claim (`ARCHITECTURE_PRINCIPLES.md` § *Dietary Preferences*, `THA_HOUSEHOLD_TIME_ARCHITECTURE.md`'s in-place corrections, cited as precedent). A classification is a finding, never a position to hold.

---

## 4. The Stop Test

The Attribution Test says *whose* boundary it is. A second question says whether it is time to stop **at all**:

> ### Is there any remaining work that does not depend on this boundary?
>
> - **YES** → **it is not time to stop.** Do that work. Ask again.
> - **NO** → the boundary is genuine for the remaining scope. Assess, report, stop.

A boundary blocks **the items that require it**, never the implementation. One unavailable photograph does not block a room's shell, its plan, its light, its furniture, its interactions, its verification, its report, or an honestly-labelled placeholder standing in the artefact's place under `CB4`. The correct output of a session that met a boundary early is a nearly-complete implementation with one precisely-named gap — never an early stop with a long list of things that were never attempted.

**The ordering is fixed** (`CB6`): classify → complete everything that does not depend on the boundary → then report. Reporting first and working second is how premature stopping is dressed as diligence.

---

## 5. The five classifications

Every remaining item receives **exactly one** (`CB2`). The four project classifications partition what a project can lack — *an answer · code · an artefact · something outside itself* — and the fifth is what the implementer can lack. A candidate sixth kind is one of these five mislabelled.

### 5.1 Architecture Gap

**Definition.** The governing architecture does not answer the question the implementation reached. No owner exists for a required fact, rule, boundary or decision — or two owners disagree and neither has been corrected.

**Test.** *Which document owns this, and what does it say?* If the honest answer is "none" or "two, differently", it is an Architecture Gap.

**Why stopping is correct.** Building past an unanswered architectural question means **inventing the answer in code**, which mints an owner by accident — the precise defect `ARCHITECTURE_PRINCIPLES.md` Principle 2 and `GEA20` exist to prevent, and the one THA has paid for most often. The canon's own remedy is already established: **declare the owner first, build second** (the `TIME3` precedent, cited).

**Recommended next action.** *Architecture decision required* — routed to the owner of the rule in question; to the **Home Owner** where the question is one of feeling, atmosphere or aesthetic character (`HOMEOWNER1`, cited), and to the rule's document owner where it is one of rule. Where no owner exists at all, the next action is to **declare one**.

**Never.** An Architecture Gap is never closed by the implementation choosing an answer, and never by the existing code being treated as the answer (`CRAFT1` § 7 — *existing implementation is reference material, never design authority*, cited).

### 5.2 Repository Gap

**Definition.** The architecture answers the question. The code, schema, migration, module, route, test, script, or configuration needed to realise it does not exist yet.

**Test.** *Is the design decided, and is the only thing missing the building of it?*

**Why this is almost never a reason to stop.** A Repository Gap **is the work.** It is named as a classification precisely so that it can be distinguished from the four boundaries that genuinely block — and so that "the repository does not have this yet" can never be presented as a limitation of anything. A Repository Gap stops an implementation in only two circumstances, both of which are really something else wearing its clothes: it exceeds the **approved scope** (a Scope Lock item — § 1.3), or building it would require a decision (an Architecture Gap — § 5.1).

**Recommended next action.** *Continue implementation* — or, where the missing piece is a durable shared foundation rather than this task's own code, *Extend repository assets*.

### 5.3 Asset Gap

**Definition.** A governed **non-code artefact** does not exist: artwork, photography, an illustration master, an icon, a font, a sound, a dataset, a legal text, a reference image.

**The distinction that makes this classification useful.** A *specification* and an *artefact* are different things with different owners. `ASSET1` may specify an object across 21 dimensions while no file exists; the specification being complete is exactly what makes the gap narrow, nameable, and closable by someone else. **State which of the two is missing** — a missing specification is an **Architecture Gap**, a missing file is an **Asset Gap**. They look identical in a screenshot and have nothing else in common.

**Why stopping is sometimes correct, and often is not.** An Asset Gap blocks only the surfaces that require that artefact. Where a governed, honestly-labelled placeholder is lawful, the implementation continues behind it (`CB4` — labelled, never passed off). Where no honest stand-in exists, that surface waits.

**Recommended next action.** *Generate governed asset using ChatGPT Image Generation* · *commission the artefact* · *photograph the subject* · *author the text* — whichever capability can actually produce it, named narrowly.

**The rule that makes this safe** (`CB9`). An artefact produced by **any** external capability enters THA through **the existing asset governance, entirely unchanged**: the specification it must satisfy (`ASSET1`), the visual and material admission standard (`LHDC1`), the candidate → verification → checksum → recorded-approval lifecycle already built for the Larder jars, and **final aesthetic approval by the Home Owner** (`HOMEOWNER1`). Naming an external producer is a statement about *who can make the file*. It is **never** a route around the lifecycle, and an asset arriving from outside is *more* subject to the gates, not less — it was made by something that has never read THA's canon.

### 5.4 External Dependency

**Definition.** Completion requires something outside both the repository and the implementer: a third-party API, a credential or key, a paid service, a provider integration, production data, a legal review, or a decision reserved to a named human authority.

**Test.** *Is the thing that must happen next an act by someone or something that is not this repository and not this implementer?*

**Why stopping is correct.** Nothing the implementation does can close it. Simulating it would be worse than waiting — a mocked provider presented as an integration, or an assumed legal position, is a fabricated fact about the world (Principle 6), and THA has recorded what that costs at the surface where it matters most (`BUS1`'s placeholder company facts; `BUS2A`'s withdrawn discount claim — both cited as history).

**Recommended next action.** Name the party and the act: *Home Owner aesthetic approval required* · *legal review required* · *provider credential required* · *dataset required*. Where the dependency is an **approval**, note that the pending approval is the lifecycle working correctly rather than a defect (`HOMEOWNER1`, cited).

### 5.5 Model Capability Gap

**Definition.** The architecture answers the question, the repository is ready or reachable, the artefact is specified, and no external party is owed anything — and the only missing thing is a capability **the implementing model or its environment does not have.** For example: producing a photographic image; a subjective aesthetic verdict; perceiving media it cannot perceive; an operation the environment forbids; or work that genuinely exceeds the context it can hold at once.

**Test.** The Attribution Test (§ 3) returning **NO** — a different implementer, with this same repository and this same architecture, would **not** be blocked.

**What it is.** A true, useful, and entirely unembarrassing statement about the tool. Recording it is what lets the smallest possible capability be applied to the smallest possible step, so the project continues immediately rather than waiting on a decision nobody needed to make.

**What it is never.** It is **never** a limitation of THA, never a defect in the architecture, never a reason to amend a governing document, never a reason to lower a standard, and never a reason to stop work that does not require the missing capability (`CB3`, `CB5`, `CB6`, `CB10`).

**Recommended next action.** The **narrowest** capability that closes it (`CB7`): *Generate governed asset using ChatGPT Image Generation* · *human aesthetic judgement* · *an image-capable pipeline for these N files* — one step, not a re-plan, not a rewrite, not a new programme of work.

**The wording rule.** A Model Capability Gap is written as a statement about the implementer, in the implementer's own voice, and is never phrased as a property of the architecture or the repository:

| Never write | Write |
|---|---|
| *"The architecture requires photographic assets that cannot be produced."* | *"The specification is complete; this environment cannot produce photographic images. 27 files are specified and unproduced."* |
| *"The Larder cannot be built without new artwork."* | *"The room's shell, plan, furniture and interactions are built from the existing assets. Four surfaces specify artwork this tool cannot generate; each shows a labelled placeholder."* |
| *"This is blocked."* | *"Item X is blocked on capability Y. Items A–W are complete."* |

### 5.6 The five at a glance

| Classification | What is missing | Whose boundary | Blocks the remaining scope? | Recommended capability |
|---|---|---|---|---|
| **Architecture Gap** | An answer — an owner, a rule, a decision | The project | **Yes** — building past it invents an owner | *Architecture decision required* (the rule's owner; the Home Owner for character) |
| **Repository Gap** | Code, schema, module, test, script | The project | **Almost never** — it *is* the work | *Continue implementation* · *Extend repository assets* |
| **Asset Gap** | A governed non-code artefact | The project | Only the surfaces needing it | *Generate governed asset using ChatGPT Image Generation* · commission · photograph |
| **External Dependency** | An act by a third party or named authority | The project | **Yes** for the dependent items | Named party + named act |
| **Model Capability Gap** | A capability of the implementing tool | **The implementer** | Only the items needing it | The narrowest tool that closes it |

---

## 6. The Implementation Completion Report

Every implementation ends with an **Implementation Completion Report** — **a section of the implementation report the workflow already requires** (`ENGINEERING_WORKFLOW.md` `STEP 5`, `STEP 9`; `.engineering/templates/IMPLEMENTATION_TEMPLATE.md`), never a second document and never a rival Definition of Done. It is required whether the implementation completed fully or not: on a full completion it is short and its Remaining Gaps read **NONE**, which is itself a claim worth making explicitly.

It has six declarations. Each is stated with **evidence** — a command that ran, a file that exists, a rule that was satisfied. A percentage may be given only if it is evidence-based and cites its denominator, on the standing rule the workflow already applies to convergence figures (*"never estimate without citing the current architecture"*, `STEP 8`, cited).

### 6.1 Architecture Complete

**Declares:** every governing rule that applies to this work has been satisfied, or its non-satisfaction is a named gap below. The design was **realised, not reinterpreted** (`LARDER4` § 2; `CRAFT1` § 7, cited).

**States:** which governing documents bind this change; which of their rules this work had to satisfy; and — the load-bearing item — **any rule that was not satisfied**, which is a gap, never a silence.

### 6.2 Engineering Complete

**Declares:** the code exists, typechecks, builds, and passes the gates that apply to it, with pre-existing failures distinguished from any introduced by this work.

**States:** the commands that actually ran and what they returned. A gate not run is declared as not run, with the reason (`.engineering/templates/IMPLEMENTATION_TEMPLATE.md` → *Validation Performed*, cited: *"If the build was not run, say so and say why."*).

### 6.3 Interaction Complete

**Declares:** every behaviour the design promises is **reachable and reaches its outcome** — on every input method the design names, and by every equivalent route the design requires (a governing example, cited not restated: `LARDER1`'s rule that *every drag outcome has a non-drag equivalent*).

**States:** which interactions were exercised and how. A surface that renders but cannot be reached is **not** Interaction Complete — the failure recorded in the `LARDER6` run file, where *"the worktop, the fitted run, the floor and the door were rendered but unreachable"*, is the canonical example of work that would have passed a screenshot and failed this declaration.

### 6.4 Existing Assets Used

**Declares:** what this implementation stood on — the components, modules, tokens, owners, artefacts, and registers it consumed rather than recreated.

**Why it is a declaration and not a courtesy.** It is the evidence for *"extends existing architecture"* (`ENGINEERING_WORKFLOW.md` Architecture Compliance Checklist, cited) and the counter-evidence against the platform's most-recorded defect: authoring a rival owner beside a correct one (`PX1` via `THA_UI_ARCHITECTURE.md` § 17, cited). An implementation that used nothing existing should be able to say why.

### 6.5 New Assets Required

**Declares:** every artefact this work needs that does not exist — each with its **specification status** (specified where? or unspecified?), the surface waiting on it, and **what stands in its place meanwhile**, labelled.

**Never** a bare list of filenames. An entry that does not say whether the artefact is *specified* cannot be acted on by anyone: a specified missing file is a production task, an unspecified one is an architecture task, and they go to different places (§ 5.3).

### 6.6 Remaining Gaps

**Declares:** everything required and not completed. **Every entry carries five fields** (§ 7). Where nothing remains, it reads **NONE** — a claim, made deliberately.

**Distinct from Scope Lock** (`CB6`, § 1.3): *excluded scope* is work **deliberately not attempted**; a *remaining gap* is a boundary **met**. Both sections appear in the same report and neither absorbs the other.

---

## 7. The five required fields on every remaining gap

No gap is recorded with fewer.

| Field | What it must contain | The failure it prevents |
|---|---|---|
| **Classification** | Exactly one of the five (§ 5), with the evidence that assigned it | The unclassified gap — *"needs assets"* — which nobody can act on and which hides misattribution |
| **Reason** | Why it could not be completed, in one or two sentences, in the correct voice (§ 5.5) | Blaming the project for the pen |
| **Impact** | What is not true for the household or the platform because of it — including **NONE**, where the gap is invisible to a household | The alarming gap that mattered to nobody, and the quiet gap that mattered enormously, presented identically |
| **Recommended next action** | The **smallest** act that closes it (`CB7`) | The re-plan — a boundary answered with a programme of work instead of a step |
| **Recommended capability to complete it** | Who or what can perform that act: *Continue implementation* · *Generate governed asset using ChatGPT Image Generation* · *Extend repository assets* · *Architecture decision required* · a named external party or authority | The gap that names a problem and no route out of it |

**Impact is stated for the household first, and for the build second.** THA's One Question is about what the household is left holding (`THA_BRAND_CONSTITUTION.md`, cited); a gap's impact is measured there before it is measured in files.

### 7.1 The copyable block

Copy this into the implementation report. It is the canonical form of the assessment.

```
IMPLEMENTATION COMPLETION REPORT
================================

Architecture Complete:   YES / PARTIAL / NO
  Governing documents bound: [list]
  Rules satisfied:           [evidence]
  Rules NOT satisfied:       [each is a gap below, or NONE]

Engineering Complete:    YES / PARTIAL / NO
  Commands run and outcome:  [typecheck / build / verifiers / tests]
  Gates not run, and why:    [or NONE]
  Pre-existing failures:     [distinguished from any introduced here]

Interaction Complete:    YES / PARTIAL / NO
  Interactions exercised:    [what, on which input methods]
  Reachable but unproven:    [or NONE]

Existing Assets Used:
  [owners, components, modules, tokens, artefacts, registers consumed]

New Assets Required:
  [artefact — specified where (or UNSPECIFIED) — surface waiting on it
             — what stands in its place, labelled]      or NONE

Remaining Gaps:          [N gaps, or NONE]

  GAP 1
    Classification:      Architecture Gap / Repository Gap / Asset Gap /
                         External Dependency / Model Capability Gap
      Evidence:          [what assigned this classification]
      Attribution Test:  [would another implementer still be blocked? YES/NO]
    Reason:              [why it could not be completed]
    Impact:              [household first, then platform — or NONE]
    Recommended next action:
                         [the smallest act that closes it]
    Recommended capability to complete it:
                         [Continue implementation / Generate governed asset
                          using ChatGPT Image Generation / Extend repository
                          assets / Architecture decision required / named party]

  GAP 2 …

Stop Test:               [Is any remaining work independent of these gaps?
                          MUST BE NO before stopping — see § 4]
```

---

## 8. The rules — `CB1`–`CB12`

Binding on every implementation.

**`CB1` — No implementation stops without a Capability Boundary Assessment.** A stop without a classified, reported boundary is indistinguishable from abandoning the work, and reads to the owner as a limitation of THA. An implementation that completes fully still files the report, with Remaining Gaps: **NONE**.

**`CB2` — Every remaining item carries exactly one classification, with its evidence.** One gap, one kind (the discipline of *one owner per fact*, `ARCHITECTURE_PRINCIPLES.md` Principle 2, applied to the record of the work). Two classifications on one item means it is two items. A classification without evidence is a guess, and a guessed classification is the same defect as a guessed fact.

**`CB3` — A limitation of the implementing tool is never attributed to THA.** Never to its architecture, its governance, its repository, or its assets. This is the rule the document exists for; § 5.5's wording table is how it is obeyed in practice.

**`CB4` — No silent substitution, ever.** An unsuitable asset never stands in for a specified one unlabelled; an approximation is never presented as the design (`LARDER4` § 2, cited). A placeholder is lawful only when it is **declared** — in the report, and wherever a person could otherwise mistake it for the real thing. The medium is disclosed rather than passed off (the standard `LARDER_PRODUCTION_ASSET_GENERATION.md` § 1 set, cited as precedent).

**`CB5` — The approved architecture is never compromised for implementation convenience.** Not simplified, not partially applied, not quietly reinterpreted. A genuine conflict is surfaced to the rule's owner as a decision; it is never resolved by the implementation (`GEA20`; `CRAFT1` § 7; `HOMEOWNER1`'s *authority through the documents, never around them*, all cited). **Convenience is never a reason, and a capability limitation is never a reason.**

**`CB6` — Maximum completion before stopping.** Everything that does not depend on the boundary is finished first (§ 4). Remaining Gaps records **boundaries met**; Scope Lock records **work deliberately not attempted**; neither is filed as the other, because a boundary filed as excluded scope is never classified.

**`CB7` — Recommend the smallest next action.** The narrowest act, and the narrowest capability, that reaches completion. Never a re-plan, a rewrite, a new programme, or a request for a decision that is not actually required.

**`CB8` — A stop is a report, not a silence.** The assessment is written before the session ends, not after it is asked for.

**`CB9` — An externally-produced artefact enters through the existing governance, unchanged.** Specification (`ASSET1`), admission standard (`LHDC1`), the candidate → verification → checksum → recorded-approval lifecycle, and Home Owner approval (`HOMEOWNER1`) all apply in full. Naming an external producer states *who can make the file*; it is never a route around a gate.

**`CB10` — A Model Capability Gap creates no amendment, no exception, and no permanent gap in the canon.** It changes no governing document. A canon amended to accommodate a tool is a canon weakened for no reason, permanently, long after the tool has changed.

**`CB11` — An unrecorded assessment is not an assessment.** It is recorded where THA already records decisions: the **implementation report** (§ 6), and the **session run file**'s Blockers and Next action (`.engineering/protocols/ENGINEERING_SESSION_RECOVERY_PROTOCOL.md`, cited) — so that a resumed session inherits the classification instead of rediscovering the boundary. This mirrors `HOMEOWNER1`'s *an unrecorded approval is not an approval*, cited.

**`CB12` — Completion is claimed only where it is true.** *Complete* means complete; *partial* is written as partial, with the remainder in Remaining Gaps. No gap is omitted because it is small, embarrassing, or belongs to the implementer. This is Principle 6 pointed at the report: **honest gaps over invented progress.**

---

## 9. Anti-patterns — the six dishonest endings

Each is a real shape, and each is refused by a named rule.

| Anti-pattern | What it looks like | Refused by |
|---|---|---|
| **The Blamed Architecture** | *"The architecture requires X, which is impossible"* — where X is merely outside the implementing tool | `CB3` |
| **The Silent Substitution** | A lesser artefact in place of the specified one, unlabelled; the surface renders and the substance is gone | `CB4` |
| **The Silent Downgrade** | The design quietly simplified to what could be built; nothing reported, because nothing visibly failed | `CB5` |
| **The Premature Stop** | Stopped at the first boundary with independent work still available and never attempted | `CB6` |
| **The Vague Handover** | *"Needs assets"* / *"blocked"* — no classification, no reason, no impact, no next action, no capability | `CB1`, `CB2`, § 7 |
| **The Overclaimed Completion** | Reported complete, with gaps unnamed or renamed as scope | `CB12`, `CB6` |

The first and third are the dangerous ones, for the same reason `LARDER4` § 2 gives about silent approximation: **they leave no trace.** A vague handover is at least visibly unfinished. A blamed architecture invites an amendment to a document that was never wrong, and a silent downgrade produces a product that passes every gate and is not the thing that was designed.

---

## 10. How this is enforced

This document is reachable by anyone following the workflow, which is the whole difference between a standard and a preference. THA has recorded the alternative: `ARCH-VERIFY1` (2026-07-11) found two governance checklists that each declared they *"stand beside the Architecture Compliance Checklist"* while `ENGINEERING_WORKFLOW.md` had never referenced either — *"leaving both checklists unreachable by anyone actually following the workflow"* (cited via `README.md`). This document is wired in at three points, in the same change that creates it:

| Where | What it adds |
|---|---|
| [`ENGINEERING_WORKFLOW.md`](./ENGINEERING_WORKFLOW.md) — **CAPABILITY BOUNDARY COMPLIANCE** | The gate: no implementation stops or reports completion without the assessment |
| [`ENGINEERING_WORKFLOW.md`](./ENGINEERING_WORKFLOW.md) `STEP 9` — Completion Gate | The Completion Gate item that makes an unassessed stop an incomplete task |
| [`.engineering/templates/IMPLEMENTATION_TEMPLATE.md`](../../.engineering/templates/IMPLEMENTATION_TEMPLATE.md) | The report section, so the form is copied rather than remembered |

It adds **no automated check.** That is stated as a known limitation rather than left to be discovered: the honesty of a classification is not mechanically verifiable — a script can assert that the section *exists*, never that its Attribution Test was answered truthfully. The gate is therefore a discipline, held by the report and the owner reading it, in the same class as the Trust Check. **This is a disclosed enforcement gap** (`ENGINEERING_WORKFLOW.md`'s declared-vs-enforced discipline, `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` Rule KC8, cited): naming it now is cheaper than discovering it later.

---

## 11. Compliance

### 11.1 Architecture Compliance

- **One canonical identity.** No entity is touched. The one term this document coins — *Capability Boundary Assessment* — is held in one place, and is explicitly distinguished from TIP's runtime *capability boundary* (§ 1.2), which is untouched and remains solely TIP's.
- **One owner per fact.** This document owns the classification, the report shape, and `CB1`–`CB12`. Every other concern is cited to its owner (§ 1). The trigger to stop stays `LARDER4` § 2's for the Larder; the gates stay `ENGINEERING_WORKFLOW.md`'s; the session-record fields stay the recovery protocol's; the scope vocabulary stays `RISK_AND_SCOPE_STANDARD.md`'s.
- **No duplicate entities · no duplicate ownership · no duplicate state.** No store, register, table, or file of record is created. The assessment lives inside documents that already exist, in sections that did not.
- **Extends existing architecture.** It extends `ENGINEERING_WORKFLOW.md`'s existing gate pattern (a named compliance block + a Completion Gate item + a template section) — the identical mechanism `PKR2`, `PX1-W5` and `ARCH-VERIFY1` each used. It invents no new workflow.
- **Progressive enrichment.** N/A — no knowledge entity, no transactional state.
- **Knowledge domain compliance.** N/A. This is engineering practice, not a knowledge domain: it publishes no fact about food, nutrition, a recipe, a household, or the product. No row in `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` § 1.1 is created or extended.
- **Honest gaps over fabricated information.** This document *is* that principle, applied to the report about the work rather than to the product (`CB12`, § 2). Its own enforcement gap is disclosed rather than implied (§ 10).
- **No permanent synchronisation bridge.** None. The rules exist once, here; the three wiring points **invoke** them and must never restate them — a copy of `CB1`–`CB12` in `ENGINEERING_WORKFLOW.md` or the template would be exactly the second owner Principle 2 forbids.
- **Evolution over replacement.** Nothing is replaced or retired. `LARDER4` § 2 remains in force, byte-untouched, and remains the Larder's owner of the STOP trigger.

### 11.2 AI Architecture Compliance

**Not applicable — and the reason is worth stating, because the subject matter invites the opposite conclusion.** This document concerns the *implementer* of THA, not THA's Intelligence. It touches no capability, registry, intent, prompt, Context View, conversation state, or model call; it creates no assistant; the Companion neither reads it nor is affected by it; and **no runtime code reads it.** It grants no permission and authorises nothing (§ 1.2) — `server/lib/access.ts` remains the sole authority on who anyone is, and the Capability Registry remains the sole authority on what may be invoked.

### 11.3 Experience & UI Governance

**Not applicable.** No user-facing surface, route, component, token, string, colour, or behaviour is created or changed. A household cannot perceive this document's existence. It is subordinate to `GEA20` in one direction only: it exists to protect the downward flow of authority from architecture to implementation, and it **originates no experience law** (`GOVERNING_EXPERIENCE_ARCHITECTURE.md` § 2.1's Implementation layer, cited).

### 11.4 Product Registry Impact

**Registry affected: NO.** A person's answer to *"what is THA?"* is unchanged — this governs how THA is built, not what it is. No entry created, updated, or retired. No product knowledge enters a prompt, template, or fallback string (Rule PKR27).

### 11.5 Adoption Register Impact

**Register affected: NO.** No component, hook, token, utility class, or shared client pattern is created, adopted, or retired.

### 11.6 Data Impact

- Reads existing data: **NO** (repository documents only)
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**
- Database writes: **NONE**

### 11.7 Trust Check

- **Could this mislead the user?** No — a household never encounters it. It exists to stop the *owner* being misled about the state of the work.
- **Could this fabricate certainty?** No. It forbids one specific fabrication — a confident claim that THA is the reason something stopped — and requires evidence for every classification.
- **Is anything guessed but shown as real?** No. Where the classification is unclear, § 3 requires looking rather than guessing, and § 10 discloses that no script can verify an honest answer.
- **What happens if the system is wrong?** A misclassification is a recorded finding, corrected in the change that discovers it (§ 3). The worst case is a boundary attributed to the wrong side — which is exactly what this document makes visible and correctable, rather than invisible and permanent.
- No architectural duplication introduced: **YES** (none).
- No new source of truth created: **YES** (none — one document owns three things).
- No runtime behaviour altered: **YES** (governance only).

### 11.8 Trust Check — the One Question

*(`THA_BRAND_CONSTITUTION.md`, cited.)* **"Does this leave the household with less to carry, and could they trust everything it tells them?"**

*Less to carry?* Indirectly, and genuinely: this document's whole effect is that rooms get **finished** to the last independent item rather than stopped at the first boundary, and that a boundary is closed by the smallest correct act instead of by an amendment to the architecture that produced the house.

*Could they trust everything it tells them?* It protects exactly that. A house built by a process that quietly downgrades the design when the design is inconvenient (`CB5`), or that substitutes an unsuitable asset without saying so (`CB4`), is a house whose every other claim is a little less believable. `LARDER5` states this in its own domain — *a room that lies about its own light will not be believed about a household's allergens* — and this document is the same reasoning applied to the act of building: **the honesty THA promises a household begins with the honesty of the report about the work.**

---

## 12. Impact

**In scope (declared, and it is all this document does):** the Capability Boundary Assessment and its five classifications; the Attribution Test and the Stop Test; the Implementation Completion Report and its six declarations; the five required fields on every gap; `CB1`–`CB12`; the six anti-patterns; the three wiring points (§ 10).

**Explicitly not in scope:** no automated verifier (§ 10, disclosed); no amendment to `LARDER4`, `CRAFT1`, `HOMEOWNER1`, `ASSET1`, `LHDC1`, or any Experience Governance document — all byte-untouched; no change to the risk/scope vocabulary; no change to the session recovery protocol's fields; no new workstream folder; no runtime code, schema, migration, route, capability, asset, token, component, string, or business logic; **no deployment.**

**Reusability — the Definition of Done.** The assessment is reusable by every future implementation because it is (a) **indexed** in `README.md`, so the Architecture Bootstrap reaches it; (b) **gated** in `ENGINEERING_WORKFLOW.md`, so a stop without it is an incomplete task; and (c) **templated** in `.engineering/templates/IMPLEMENTATION_TEMPLATE.md`, so its form is copied rather than remembered. A standard that is only written is the authored-but-unadopted state `THA_UI_ARCHITECTURE.md` § 17 exists to end (cited).

---

*This is governance. It creates no route, capability, entity, token, component, string, asset, schema, migration, or business logic; it changes no user-facing surface; and no runtime code reads it. Every rule of the product stays with its owner. This document owns only what happens at the moment an implementation cannot go further: **finish everything that does not depend on the boundary, classify what remains honestly, name whose limitation it is, recommend the smallest act that closes it — and never let a limitation of the tool holding the pen be recorded as a limitation of the house.***
