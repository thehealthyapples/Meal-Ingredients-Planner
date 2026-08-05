# Living Home — Canonical Architecture Lock

**Classification:** 🟡 AMBER — architecture governance. **Implements nothing.** No code, asset, schema, route, dependency, commit, or push because this document exists.
**Document role:** the **governing architecture entry point** for all future Living Home work. A contributor joining the Living Home starts here.
**Evidence standard (THA):** every material claim tagged **[V]erified** (confirmed in code/governing doc), **[I]nferred** (reasoned from verified evidence), **[A]ssumed** (not confirmed).
**Date:** 2026-08-05 · Worktree `tha-living-larder-authoritative` · HEAD `0f59b189`.
**Author of record:** Colin Clapson (Home Owner) · drafted by Claude under the Engineering Workflow.
**Pass 2 (2026-08-05) — Final Governing Architecture Refinement (🟢 GREEN).** Long-term usability only: adds a **Living Home Architecture Map**, a **Recommended Reading Order**, a **Where Implementation Begins** pointer, a strengthened **Change Governance** test, an **Architecture Lifecycle**, and a stronger **final governing declaration**. No architecture redesigned, no concept introduced, no ownership changed, no implementation governance altered.

## Living Home Architecture Status

- Architecture Discovery — Complete
- Architecture Governance — Locked
- Implementation Planning — Complete
- Vertical Slice — Ready
- Implementation — Stage 0 recovery complete, awaiting approval
- Craftsmanship — Pending
- Production — Pending

*(Status block added by the Stage 0 build-recovery pass, 2026-08-05. The locked architecture below is unchanged.)*

---

> **Purpose.** The Living Home architecture has reached sufficient maturity. This document formally transitions the project from **Architecture Discovery** to **Architecture Execution**. It establishes which Living Home documents are now canonical, defines what "locked" means, and rules that future progress comes through **implementation, craftsmanship and refinement** — not further architectural invention. **[I]**

> **Scope boundary (read first).** This lock governs the **Living Home *visual-object* architecture programme** — the home you see and reach into: rooms, Working Positions, Living Objects, their visual states, environmental presence/interaction, hospitality, and the acceptance gate. It does **not** re-open or re-classify the separate THA platform architectures (nutrition, companion/intelligence, commercial, trust, planner, cookbook), which have their own governance. Documents outside this programme are named here only where they are a direct dependency. **[I]**

---

## Living Home Architecture Map

Read top to bottom. Each layer **depends on and inherits from** the one above; every box is owned exactly once (see §3). A new contributor should grasp the whole in under a minute. **[I]**

```
        THA Product Constitution            ← parent product governance (context; outside this lock)
                  │
        Living Home Design Constitution      ← Home Owner · object admission standard
                  │
        Working Position                     ← Working Position · scene truth (camera · plate · light · layout)
                  │
        Working Position Asset Profile        ← WPAP · authoring & acceptance contract (binds object to room)
                  │
        Hospitality Profile                  ← Working Position (inherited by WPAP) · how the place feels
                  │
        Living Object                        ← Living Object asset / Runtime record · the complete PNG
                  │
        Presentation Contract                ← WPAP (upheld by Runtime + Information Layer) · continuity across states
                  │
        Information Layer                    ← Information Layer · runtime title / label, bound to the object
                  │
        Visual State Architecture            ← Runtime · Resting·Focused·Lifted·Dragging·Dropped·Settling
                  │
        North Star Acceptance Gate           ← WPAP acceptance clause · the two questions (both must pass)
                  │
        Home Owner Craft Approval            ← Home Owner · welcoming-before-working sign-off
                  │
        Canonical Living Object              ← Home Owner / Life Register · approved, checksum-bound
                  │
        Production                           ← Runtime · served in the app
```

*The chain is dependency + inheritance, not a redesign: it simply names, in order, owners and contracts already defined in the locked set.* **[I]**

---

## Recommended Reading Order

The order a new engineer should read the Living Home documentation. Each entry says **why it comes next**; none repeats another's content. Times are approximate. **[I]**

| # | Document | Purpose | Why it comes next | ~Time |
|---|---|---|---|---|
| 1 | **This lock** (`LIVING_HOME_CANONICAL_ARCHITECTURE_LOCK.md`) | The entry point: what is canonical, who owns what, how change is governed | Orient before reading any single architecture in depth | 10 min |
| 2 | **Living Home Design Constitution** | The object admission standard and the home's values | Establishes the standard every later document serves | 15 min |
| 3 | **Stage + Interactive Props (Model B)** | The interaction model: byte-constant Stage vs data-borne Props (House vs Life) | Gives the structural mental model of a room before its objects | 15 min |
| 4 | **Layered Rendering Architecture** | The layer / z-stack (plate · object · front-occlusion · portal) | Explains *how* Stage and Props are composited on screen | 10 min |
| 5 | **Living Object Visual State Architecture** | The six states + Environmental Presence/Interaction + Hospitality + North Star Gate + Presentation Contract | The heart: how a Living Object behaves and is judged | 25 min |
| 6 | **Working Position Asset Profile** | The per-room authoring & acceptance contract that binds objects to the camera/light | How the objects in those states are actually authored | 20 min |
| 7 | **North Star Quality Investigation** | The evidence behind the two-question quality bar | Grounds *why* the gate is set where it is | 15 min |
| 8 | **Vertical Slice Proof** | The smallest proof (one jar · one Pantry Shelf · one interaction) | Turns the architecture into a concrete first target | 10 min |
| 9 | **Vertical Slice Implementation Plan** | The staged, governed build (Stop Gate · Failure Ownership · approval pipeline) | How to actually build the proof, safely | 20 min |

---

## Where Implementation Begins

**Architecture discovery is complete. No further architecture is required to begin building.** Implementation starts at the vertical slice: **[V]**

- **`LIVING_OBJECT_VERTICAL_SLICE_PROOF.md`** — *what to prove* (one glass jar · one Pantry Shelf · one full interaction).
- **`LIVING_OBJECT_VERTICAL_SLICE_IMPLEMENTATION_PLAN.md`** — *how to build it* (staged, each stage committable and reversible, with a Stop Gate, single-owner Failure Ownership, and the approval pipeline).

**All further work must extend the locked architecture rather than create additional architecture.** *(Execution precondition, not architecture: clear the Stage 0 build break — `client/src/App.tsx:305` references `PocMilk3d` with no import — before the slice can run.)* **[V]**

---

## 1. Architecture Review

Every document produced or matured during this programme was reviewed for **purpose · owner · dependencies · consumers · status · implementation readiness**. The review conclusion: **[I]**

- The **core canonical set is internally consistent, evidence-tagged, and exhibits single ownership** — the precondition for locking. The Visual State Architecture, the Working Position Asset Profile, the Layered Rendering model, and the Stage + Interactive Props (Model B) architecture agree on one ownership model with no property owned twice. **[V — cross-read of those documents]**
- The architecture is **implementation-ready**: the Vertical Slice Proof and its Implementation Plan (Pass 2, governed) translate the architecture into an executable, staged build with a Stop Gate, single-owner Failure Ownership, and an approval pipeline — with **no unresolved architectural question** blocking the first slice. **[V — the two slice documents]**
- The one open item is **not architectural but implementation-state**: the build is currently broken (`client/src/App.tsx:305` references `PocMilk3d` with no import). This blocks *execution*, not the *lock*. **[V — confirmed in code and in the North Star Quality Investigation]**
- The programme has reached the point the constitution itself anticipates — *"architecture gives way to craftsmanship."* Further value now comes from building and refining, not from new models. **[I]**

**On this basis the architecture is ready to lock.** The register (§2), matrix (§3), and lock definition (§8) formalise it.

---

## 2. Canonical Document Register

For every governing document: **Purpose · Canonical Owner · Consumers · Current Status · Reason for Status.** Only documents that satisfy the THA Evidence Standard **and** exhibit single ownership are marked **LOCKED**.

### 2a. Core canonical set — the Living Object visual-object architecture

| Document | Purpose | Canonical Owner | Consumers | Status | Reason |
|---|---|---|---|---|---|
| `LIVING_HOME_DESIGN_CONSTITUTION.md` (LHDC1) | Object-level visual & material **admission standard** for the Living Home | **Home Owner** (constitutional seat) | every asset/object doc; the acceptance gate | **LOCKED** | Declared **GOVERNING**; single-owner admission standard; cited-never-restated by downstream docs **[V header]** |
| `LIVING_HOME_LAYERED_RENDERING_ARCHITECTURE.md` | The layer/z-stack model (environment plate · object · front-occlusion · UI · drag portal) | **Runtime** (renderer) | Visual State; slice plan; runtime | **LOCKED** | AMBER, fully evidence-tagged; documents an **already-implemented, LOCKED** model; single owner **[V]** |
| `LIVING_HOME_STAGE_AND_INTERACTIVE_PROPS_ARCHITECTURE.md` (Model B) | Canonical **interaction architecture** — House (byte-constant Stage) vs Life (data-borne Props) | **Living Home Experience** (Stage) / **Environmental Interaction** | Visual State; runtime; asset governance | **LOCKED** | Names the architecture THA already has; single ownership; consistent with the constitution **[V header]** |
| `WORKING_POSITION_ASSET_PROFILE_ARCHITECTURE.md` (WPAP) | The per-Working-Position **authoring & acceptance contract** binding object generation to the room's camera/light/contact | **Working Position Asset Profile** | generation pipeline; QA gate; slice plan | **LOCKED** | Fully evidence-tagged; explicit one-owner-per-property matrix; no duplicate ownership **[V]** |
| `LIVING_OBJECT_VISUAL_STATE_ARCHITECTURE.md` | The six visual states + **Environmental Presence/Interaction · Hospitality · North Star Gate · Presentation Contract** | **Runtime** (states) + **Working Position** (Presence/Hospitality) + **WPAP** (gate/contract) — one owner per concern | slice proof/plan; runtime; acceptance | **LOCKED** | Passes 1–4 reconciled; every property maps to exactly one owner; lock-ready verdict recorded in-doc **[V]** |
| `LIVING_OBJECT_NORTH_STAR_QUALITY_INVESTIGATION.md` | The **North Star quality bar** for a Living Object (the two-question standard's evidential basis) | **Working Position Asset Profile** (acceptance clause) | the acceptance gate; slice review | **LOCKED** | COMPLETE; evidence-tagged; feeds the single acceptance owner **[V header]** |

### 2b. Execution documents — active, evolve through implementation

| Document | Purpose | Canonical Owner | Consumers | Status | Reason |
|---|---|---|---|---|---|
| `LIVING_OBJECT_VERTICAL_SLICE_PROOF.md` | Defines the smallest proof (one jar · one Pantry Shelf · one interaction) | **Runtime** (proof surface) | the implementation plan | **ACTIVE** | Execution artefact; correct and stable, but expected to record results as the proof runs **[V]** |
| `LIVING_OBJECT_VERTICAL_SLICE_IMPLEMENTATION_PLAN.md` | The staged, governed build plan (Stop Gate · Failure Ownership · Approval Pipeline · Status) | **Runtime** (execution) | implementers; reviewers; Home Owner | **ACTIVE** | Execution artefact; its per-stage Status advances during the build **[V]** |
| `LIVING_HOME_DYNAMIC_OBJECT_IMPLEMENTATION_REVIEW.md` | Established the **Living Object** model + runtime attributes; approved Phase 0 (Fridge) | **Runtime** / Production Asset Architecture | Phase 0 implementation | **ACTIVE** | APPROVED and implementation-governing; not re-opened by this lock **[V header]** |

### 2c. Superseded / archived — retained for traceability, not governing

| Document | Purpose | Status | Reason |
|---|---|---|---|
| `LIVING_LARDER_CANONICAL_ASSET_DISCOVERY_AND_RUNTIME_AUDIT.md` | Point-in-time (2026-08-01) inventory of existing imagery | **ARCHIVED** | A dated audit; its finding ("promote, don't regenerate") is carried into current governance; not a standing rule-owner **[V]** |
| `living-larder-3d-milk-poc-decision.md` | Decision record on the 3D-milk proof-of-concept | **SUPERSEDED** | The 3D route is the abandoned POC that currently breaks the build; superseded by the 2D layered-rendering direction **[I]** |
| `living-larder-scope-drift-and-fridge-direction.md` | Direction record correcting scope drift toward the fridge | **ARCHIVED** | Point-in-time direction note, its conclusions absorbed into the locked set **[I]** |

### 2d. Related foundational documents (dependencies, outside this programme's re-lock)

The following `docs/architecture/` documents are **direct dependencies** the core set cites and remain **governing in their own right**; this lock does **not** re-open them, and a per-document status audit of this group is a separate governance pass if ever required: `LIVING_HOME_EXPERIENCE_ARCHITECTURE.md`, `LIVING_HOME_ENVIRONMENTAL_DRESSING_ARCHITECTURE.md`, `LIVING_HOME_CANONICAL_PRODUCTION_ASSET_ARCHITECTURE.md`, `LIVING_HOME_VISUAL_REGISTRY.md`, `LIVING_HOME_SPATIAL_BLUEPRINT.md`, `LARDER_ROOM_NORTH_STAR_ARCHITECTURE.md`, `LIVING_LARDER_ARCHITECTURE.md` / `_INTERIOR_` / `_ASSET_LIBRARY` / `_IMPLEMENTATION_CONSTITUTION` / `_INTERACTION_CONSTITUTION` / `_VISUAL_ACCEPTANCE_DECISIONS`, `HOME_OWNER_ARCHITECTURE.md`, `GOVERNING_EXPERIENCE_ARCHITECTURE.md`, `THA_CRAFTSMANSHIP_CONSTITUTION.md`. **Status: ACTIVE — foundational.** **[V exist / A internal status not re-verified here]**

---

## 3. Architecture Status Matrix

**Counts (core programme):** LOCKED **6** · ACTIVE **3** · SUPERSEDED **1** · ARCHIVED **2** (+ a foundational-ACTIVE dependency group in §2d). **[V]**

**Concept → single owner → owning locked document** (confirming no concept is owned twice): **[V/I]**

| Canonical concept | Single owner | Owning LOCKED document |
|---|---|---|
| Living Home admission standard | Home Owner | Design Constitution |
| Layer / z-order stack | Runtime | Layered Rendering |
| Stage vs Interactive Props (interaction model) | Living Home Experience / Environmental Interaction | Stage + Interactive Props (Model B) |
| Working Position (scene truth: camera/plate/light/layout) | Working Position | Visual State (§6) + Constitution §140/§283 |
| Working Position Asset Profile (authoring/acceptance contract) | Working Position Asset Profile | WPAP |
| Living Object (complete asset) + Living Object Model | Living Object asset / Runtime record | Visual State (§7) + Dynamic Object Review |
| Six Visual States (Resting·Focused·Lifted·Dragging·Dropped·Settling) | Runtime | Visual State (§2–§3) |
| Environmental Presence | Working Position | Visual State (§5) |
| Environmental Interaction | Working Position | Visual State (§5) |
| Hospitality Profile | Working Position (inherited by WPAP) | Visual State (§6) |
| North Star Acceptance Gate (two questions) | Working Position Asset Profile (acceptance clause) | Visual State (Gate + §11b), evidenced by North Star Quality |
| Presentation Contract (cross-state continuity) | Working Position Asset Profile (upheld by Runtime + Information Layer) | Visual State (§4a) |
| Information Layer (runtime title/label) | Information Layer | Visual State (§9) |

**No concept has two owners.** Adjacent concepts sharing an owner (e.g. WPAP owns both the gate and the Presentation Contract) is single-ownership-per-concept, not duplication. **[I]**

---

## 4. Implementation Governance

**Implementation is now the primary activity.** From this lock, Living Home work consists of: **[I]**

- **implementation** — building the locked architecture, slice by slice (Pantry-Shelf jar first, then the fridge shelf);
- **craftsmanship** — making each object and room *feel* right (§5);
- **asset refinement** — authoring/re-mastering Living Objects to their WPAP and the acceptance gate;
- **verification** — the Proof Checklist and automated floor;
- **acceptance** — the North Star Gate + Home Owner approval;
- **production readiness** — promotion, registration, and serving.

It does **not** consist of architectural expansion. The default answer to "should we write a new architecture document?" is **no** — see Change Governance (§7).

---

## 5. Craftsmanship Governance

**One final governing principle. The architecture is complete; hospitality is now the primary optimisation.** **[I]**

> From this point on, every implementation asks — **in this order**:
> 1. **"Does this make the Living Home feel more welcoming?"**
> 2. **"Does this work?"**

"Works" remains necessary — nothing ships broken — but **welcoming leads**. A change that works yet makes the home feel colder, busier, or more game-like is a **regression**, even if every automated check passes. This extends, and does not replace, the `THA_CRAFTSMANSHIP_CONSTITUTION.md` and the Hospitality Profile (owned by the Working Position, inherited by the WPAP). Hospitality is measurable — its dimensions (light temperature, contrast, material finish, surface wear, fill density, composition, colour balance) are named in the Visual State Architecture §6 — so "welcoming" is a checkable standard, not a mood. **[V basis]**

---

## 6. Living Object Approval Governance

The canonical approval pipeline every Living Object must pass, **now LOCKED** as governance: **[I]**

```
AI Draft Asset
   ↓
Working Position Asset Profile Validation
   ↓
Technical Review
   ↓
North Star Acceptance Gate
   ↓
Home Owner Craft Approval
   ↓
Canonical Living Object
   ↓
Production
```

- Owners (single per stage): authoring & acceptance → **Working Position Asset Profile**; integration & production → **Runtime**; craft approval & canonicalisation → **Home Owner**. No stage is co-owned. **[I]**
- **Home Owner Craft Approval** applies the Craftsmanship principle (§5) — welcoming before working — and is the seat that turns a gate-passing asset into a **Canonical Living Object**.
- No object reaches **Production** without both North Star answers YES **and** recorded Home Owner approval bound to the asset checksum.
- The pipeline's operational detail (entry/exit/failure per stage) lives in the Vertical Slice Implementation Plan; **this section locks the pipeline shape and its ownership.**

**Status: LOCKED.** **[I]**

---

## 7. Change Governance

**A new architecture document is justified only if ALL of the following are true:** **[I]**

1. a **genuine architectural deficiency** has been demonstrated with evidence (a property that has *no* owner, a contradiction between locked documents, or a required behaviour the locked model cannot express); **AND**
2. the deficiency **cannot be solved by refining an existing canonical document**; **AND**
3. **ownership cannot be expressed within the existing architecture** (no locked owner can hold the concern without duplication); **AND**
4. **explicit Home Owner approval has been granted before investigation begins.**

**Otherwise: Refine. Extend. Implement. Do not invent.**

**Implementation must extend existing architecture before proposing new architecture.** The order of preference is always: **(a) refine a locked document → (b) extend it → (c) only then, and only with all four conditions met, investigate new architecture.** Convenience, taste, or "it would be cleaner" are **not** deficiencies. **[I]**

---

## 8. Definition of Architecture Lock

A **LOCKED** document is canonical: its concepts, ownership, and contracts are settled and may not be reworked casually. Locking governs *how* a document may change — not that it is frozen forever.

**Lock Rules — applied to every LOCKED document:** **[I]**

| Dimension | Rule |
|---|---|
| **What may still change** | Wording clarity; examples; implementation notes; craftsmanship detail (timings, values, art-direction); cross-references; recorded results/evidence. Refinements that **do not** alter concepts or ownership. |
| **What may never change** | The **ownership model** (one owner per concern), the **canonical concepts** the document defines, and any **contract** it locks (states, Presentation Contract, North Star Gate, approval pipeline, layer stack) — except through Change Governance (§7). |
| **What requires investigation** | Any proposed change to concepts/ownership/contracts, or any claimed deficiency, must first be **investigated** (evidence gathered, single-ownership preserved) before it may be adopted. |
| **What requires approval** | **Home Owner approval** is required to: open a new-architecture investigation (§7), change any ownership assignment, or promote a Living Object to Production. |
| **What requires implementation evidence** | Any craftsmanship claim locked "pending proof" (distinct Focused/Lifted/Settling, Environmental Presence generalised beyond the fridge, slot-derived geometry, concrete Hospitality parameter values) becomes settled **only** when demonstrated on the vertical slice — **[V]**erified, not asserted. |

**Per-document specifics (where they differ from the universal rules):** **[I]**
- **Design Constitution** — admission rules are Home-Owner-owned; may never be relaxed to admit an asset that fails; wording may clarify.
- **Layered Rendering** — the z-stack order is fixed; specific pixel/band values are craftsmanship and may change with evidence.
- **WPAP** — the property matrix (one owner each) may never gain a duplicate owner; per-Working-Position parameter values are authored freely within it.
- **Visual State** — the six states and the Presentation Contract/Gate/Hospitality ownership may never change; their *implementation* (timings, transitions) is craftsmanship pending slice evidence.
- **Stage + Interactive Props** — the House-vs-Life (Stage-vs-Props) split may never blur; new rooms instantiate it, they do not redefine it.
- **North Star Quality** — the two-question bar may never weaken; how it is measured may be refined.

---

## 9. Future Working Principles

1. **Start here.** This document is the Living Home architecture entry point; read the locked set (§2a) before building. **[I]**
2. **Extend, don't invent** (§7). Refine a locked document before proposing a new one.
3. **One slice at a time.** Prove the Pantry-Shelf jar, then the fridge shelf; scale by repetition, not reinvention.
4. **Welcoming before working** (§5). Hospitality is the primary optimisation.
5. **One owner per concern.** Never introduce a second owner for anything already owned.
6. **Gate everything that becomes a Living Object** (§6). No Production without the gate + Home Owner craft approval.
7. **Evidence over assertion.** Every material claim carries [V]/[I]/[A]; craftsmanship items are settled only by implementation evidence.
8. **Stop Gates are real.** Execution halts for approval at each stage; nothing auto-continues past a failure.

---

## 9a. Architecture Lifecycle

The Living Home's path — and where it now stands. Progress moves **downward**; it does **not** loop back to redesign. **[I]**

```
   Architecture Discovery          ✓ done
          ↓
   Architecture Review             ✓ done
          ↓
   Architecture Lock          ◀── WE ARE HERE (this document)
          ↓
   Vertical Slice Proof            → next: prove one jar on one Pantry Shelf
          ↓
   Implementation
          ↓
   Craftsmanship
          ↓
   Verification
          ↓
   Home Owner Craft Approval
          ↓
   Production
          ↓
   Continuous Craftsmanship   ──┐  the ongoing loop: refine · re-verify · re-approve
          ↑___________________ ─┘  (refinement, never architectural redesign)
```

After Lock, **future evolution happens through refinement and craftsmanship** — the Continuous Craftsmanship loop — not through repeated architectural redesign. Re-entering "Architecture Discovery" is possible **only** via Change Governance (§7), when all four conditions are met. **[I]**

---

## 10. Formal Lock Statement

The Living Home visual-object architecture — its **constitution, layered renderer, interaction model (Stage vs Props), Working Position Asset Profile, Living Object visual states, Environmental Presence & Interaction, Hospitality Profile, North Star Acceptance Gate, Presentation Contract, and Living Object approval pipeline** — has been reviewed against the THA Evidence Standard, confirmed to hold **exactly one owner per concern with no duplication**, and found **implementation-ready**. The listed core documents (§2a) and the approval pipeline (§6) are hereby **LOCKED**; execution documents (§2b) are **ACTIVE**; and the superseded/archived records (§2c) are retained for traceability only. **[V for the ownership/consistency review; I for the governance transition.]**

---

## Pass 2 — Governing Refinement Summary

**Summary of refinements.** **[I]**
1. **Living Home Architecture Map** — a top-to-bottom dependency/inheritance diagram (Product Constitution → … → Production) with the single owner named on each layer, so a new contributor grasps the whole in under a minute.
2. **Recommended Reading Order** — a nine-step sequence (constitution → interaction model → rendering → visual states → WPAP → quality → proof → plan) with per-document purpose, why-it-comes-next, and approximate reading time; no content duplicated.
3. **Where Implementation Begins** — a short entry-point section stating discovery is complete and directing contributors to the Vertical Slice Proof and Implementation Plan, with "extend, don't invent."
4. **Strengthened Change Governance (§7)** — a new-architecture document now requires **all four** conditions (demonstrated deficiency · unsolvable by refinement · ownership inexpressible in the existing architecture · Home Owner approval before investigation), else *Refine · Extend · Implement · Do not invent*.
5. **Architecture Lifecycle (§9a)** — Discovery → Review → Lock → Slice Proof → Implementation → Craftsmanship → Verification → Craft Approval → Production → Continuous Craftsmanship, marking "we are here" at Lock and showing evolution loops through refinement, not redesign.
6. **Stronger final governing declaration** (below).

**Reasons.** Every addition serves long-term usability of the document as the permanent entry point: the Map and Reading Order make the architecture navigable cold; the Implementation section removes any ambiguity about where to start; the four-condition test raises the bar against needless new architecture; the Lifecycle shows the project's shape and that its future is refinement; the final declaration states the governing posture unambiguously. **No architecture, concept, ownership, or implementation-governance rule was changed** — only orientation, the change-governance threshold, and the closing statement were strengthened. **[I]**

**Remaining assumptions.** **[A]** (a) The reading times are estimates. (b) "THA Product Constitution" is named as the parent product-governance context above the Living Home Design Constitution; it sits outside this lock's scope and is not re-verified here. (c) The **one** substantive assumption inherited from the programme is unchanged: that Hospitality/Character reduces to inheritable generation parameters that satisfy both North Star questions at an acceptable AI hit-rate — to be settled by implementation evidence on the vertical slice, not by this document.

> **Is the Living Home Architecture now ready to become the permanent governing architecture for all future Living Home implementation?**
>
> **Yes. [I]** The core set holds one owner per concern with no duplication, satisfies the THA Evidence Standard, and is implementation-ready; the locked contracts (states, Presentation Contract, North Star Gate, approval pipeline, layer stack, interaction model) are settled; and this Pass 2 makes the document usable as a permanent entry point without altering any of them. The only open item is execution-state (the Stage 0 build break), which the governance correctly treats as an implementation blocker rather than an architectural one. On that basis the architecture is ready to govern all future Living Home implementation.

---

> **The Living Home Architecture is now the canonical governing architecture for all Living Home development.**
>
> **Future implementation must extend these documents.**
>
> **Future craftsmanship must refine these documents.**
>
> **Future architectural work may only begin after a genuine architectural deficiency has been demonstrated, investigated and explicitly approved.**
>
> **The default assumption from this point onward is that the architecture is correct.**
>
> **Implementation, craftsmanship and evidence — not further invention — are now the primary drivers of progress.**

---

**This document is architecture governance only. It implements nothing, generates nothing, and creates no new architecture.**
