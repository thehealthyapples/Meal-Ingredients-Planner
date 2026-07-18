# ENGINT1 — Engineering Intelligence Foundation (Phase 1–2)

**THA can now answer questions about its own engineering — architecture, investigations, implementation reports, roadmap, releases and git history — from its own record, with a `path:line` citation behind every claim and an explicit gap wherever the record is silent. It did so by activating a capability that had been declared and unbuilt since TIP1, not by adding one: `developer` already owned "repo + docs/ + SoT Register", and a second capability beside it would have given one body of knowledge two owners. The headline finding is in what it refuses to say — the roadmap records no per-workstream completion anywhere, so "which workstreams are complete?" returns the evidence and the absence, and never a verdict THA never wrote.**

| | |
|---|---|
| **Session** | `ENGINT1_Engineering_Intelligence_Foundation` |
| **Date** | 2026-07-18 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `rollback/ENGINT1-engineering-intelligence-foundation-20260718` → `7bfad50ca198f2b86f6501a4f82d8ae41af9260b` |
| **Risk** | 🟡 AMBER |
| **Reason** | Touches the canonical Capability Registry seed, which every capability reads. Production behaviour is unchanged: the capability remains `availability: "never"` on the user plane and is bound only on an env-gated developer plane that is off in production. |
| **Status** | **Implemented and verified.** 34/34 assertions pass against the live repository; 4 existing intelligence suites re-run green. |
| **Product changed** | Nothing user-facing. No route, no UI, no household-visible behaviour. |

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/ENGINT1-engineering-intelligence-foundation-20260718` → `7bfad50ca198f2b86f6501a4f82d8ae41af9260b` |
| Working tree | **Intentionally dirty** — 248 modified/untracked entries from prior sessions (FI18, ADMIN1 and others) were present at tag time. The tag captures **committed state only**; it does **not** capture those uncommitted changes, and rolling back to it would not restore them. |
| This task's writes | 6 new files, 3 modified files (listed under IMPLEMENTATION) |
| Rollback to committed state | `git checkout rollback/ENGINT1-engineering-intelligence-foundation-20260718` |
| Rollback of this task only | Delete the 6 new files; revert the ENGINT1 hunks in `capability-registry.ts`, `index.ts`, `package.json`. Nothing else read or wrote them. |

> A tag protects committed state only. The tree was dirty before ENGINT1 began; the uncommitted work of other sessions is **not** covered by this tag.

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` — **§3.1, §3.2, §3.3, §4.2, §6.3, §6.4, §7, §8, §13 (R1)**. The governing document for this work.
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md` — Architecture Compliance Checklist, AI Architecture Compliance, Completion Gate
- [x] `docs/architecture/REPOSITORY_CONVENTIONS.md` — §1–§5 (filing, naming, root rules)
- [x] `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` — Rule KC14 (currency as the evidence standard for a self-describing domain)
- [x] `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md` — Rules PKR21/PKR26/PKR27 (the read-only knowledge-capability precedent)
- [x] `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`
- [x] `.engineering/templates/IMPLEMENTATION_TEMPLATE.md`

---

## THE GOVERNING CONFLICT, AND HOW IT WAS RESOLVED

The mission asked for Engineering Intelligence as a registered capability of the existing Companion, and listed manual verification in the form *"Verify that **Companion** can correctly answer: What architecture governs Food Intelligence?"*. Read literally against the household Companion, that is **prohibited by the governing architecture**, and the Architecture Bootstrap requires a STOP rather than a workaround. Two findings drove the design; both were raised and approved before any code was written.

### Finding 1 — the capability already existed

`server/intelligence/capability-registry.ts` has registered `developer` since TIP1: *"Architecture/workflow knowledge — isolated developer plane only; never user plane"*, `owner: "repo + docs/ + SoT Register"`, `supportedIntents: ["read", "explain", "report"]`, `availability: "never"`.

Creating an `engineering-intelligence` capability beside it would have failed the Architecture Compliance Checklist on **No duplicate entities** and **No duplicate ownership** — two capabilities owning one body of knowledge. So ENGINT1 **activated the existing declaration** and created no new capability id. This is a stricter reading of the mission's own "One Capability Registry" principle than a new registration would have been.

### Finding 2 — §7 forbids the household Companion endpoint

> *"It is **not** a more-permissive user assistant on the same endpoint — sharing an endpoint would make boundary 2 a single misclassification away from a leak. Same architecture, separate deployment."* — §7
>
> What users must never see: *"Source code, git history, SQL, schema, file paths… Developer investigations, ADRs, internal architecture… Unpublished roadmap"* — §4.2

That list is a precise description of everything Engineering Intelligence reads, and §13 Risk R1 rates a developer-class chunk reaching a user as 🔴 **Critical**.

The mission's *principles* survive this intact, because §7 itself defines Developer Intelligence as *"the **same plane** with the `developer` knowledge class and developer capabilities unlocked"*. One Intelligence Platform, one Companion, one Capability Registry, one source of truth — **instantiated twice, unlocked differently, never joined**. Only the *endpoint* was contested, and the isolated developer plane was the approved resolution.

### What this cost, stated plainly

The household Companion **cannot** answer engineering questions and must not be made to. The manual verification below was therefore run against the developer-plane Companion — the same `IntelligencePlatform`, `CapabilityRegistry`, `IntentEngine` and pipeline, in a separate instance. Anyone wanting these answers on the household endpoint must first amend §7 and §4.2 through governance; this implementation deliberately makes that impossible to do by accident.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

**□ One canonical identity**
Each entity touched has exactly one key space. The only identity introduced is the **document pointer**, keyed on its repo-relative path, with the EWO id (`ENGINT1`) as a secondary address parsed from the filename. No new persisted entity, no new table, no new id space.

**□ One owner per fact**
No attribute has two stores that must always agree. Every engineering fact keeps its existing owner: `docs/architecture/` owns the rules, `docs/investigations/` owns the analysis, `docs/implementation/` owns the record of what was built, the roadmap owns the plan, git owns the history. The registry holds **pointers and metadata only** — path, title, date, status, heading outline, mtime — and reads excerpts from the file at answer time. Delete this module and no engineering fact is lost.

**□ No duplicate entities**
No new entity is created. The `developer` capability already existed; ENGINT1 activated it. A new `engineering-intelligence` capability was explicitly **considered and rejected** for this reason.

**□ No duplicate ownership**
No attribute is given a second owner. This is the checklist item the whole design turns on — see Finding 1 above.

**□ No duplicate state**
No user state is split. The capability holds no user state at all: it is read-only over files and git, and writes nothing anywhere.

**□ Extends existing architecture**
Built on the read-only capability triad this platform already uses eleven times over (port → handler → binding), copied from the `product-knowledge` precedent (PHASE5A) down to `readOnlyVerbGuard`, the `_read-kit` honest-failure constructors, and the dynamic-import port factory that keeps binding I/O-free. The developer plane reuses `IntelligencePlatform` and `CapabilityRegistry` unchanged — both already accepted an injected seed, so **no architectural change was needed to isolate the plane**.

**□ Progressive enrichment where appropriate**
Not a knowledge entity in the graduation sense and not transactional state. It is a derived index over documents that already exist, treated as a cache (Principle 7) and rebuilt from source on mtime change. No enrichment pipeline is added.

**□ Knowledge domain compliance**
This introduces **no new knowledge domain**. Engineering knowledge is not a fifth PKCA §1.1 row: it has no candidate→gate→confirm→publish lifecycle, because its "publication" *is* the Engineering Workflow and its PR review, which already exist and are unchanged. The closest analogue is **Product Knowledge** (PKCA §9) — also self-describing, also read-only, also owned by documents rather than a database — and ENGINT1 follows its shape. It diverges on one point, deliberately: PKR21 requires the generated JSON to be the only machine-readable form, which is right for knowledge authored rarely; engineering knowledge changes several times per session, so a generated artefact would be **stale within the session that generated it** — the exact failure Rule KC14 names. Hence live read with mtime invalidation.

**□ Honest gaps over fabricated information**
The central design property. Every reasoning function returns evidence with citations **or** a structured `EngineeringGap` naming the question, the reason, and what was searched. There is no code path returning a confident sentence with nothing behind it. Specifically: `whoGoverns` will not nominate an owner the architecture has not declared; `implementationHistory` distinguishes *"the repository does not record it"* from *"it was never done"*; and `roadmapPosition` returns `completionRecorded: false` permanently rather than deriving completion. Verified by 12 assertions in Part B.

**□ No permanent synchronisation bridge**
No bridge exists. The index is a one-way derived cache with a single direction of flow (files → index → answer) and no write path back. Nothing must be kept in sync with anything, because there is only ever one copy.

**□ Evolution over replacement**
Nothing is replaced and nothing is retired. The `developer` capability descriptor was **extended** — `search` added to `supportedIntents`, description and `owningService` updated to name the new owner — with its id, class, posture, permissions and `availability` untouched (Principle 8: extension, not replacement).

---

## AI ARCHITECTURE COMPLIANCE

✓ **Uses the canonical Intelligence Platform** — `IntelligencePlatform`, unmodified. The developer plane is a second instance of the same class, not a second platform.
✓ **Uses the Capability Registry** — `CapabilityRegistry`, unmodified. `developerPlaneSeed()` derives from the one seed rather than declaring a second table, so a capability added later appears on both planes automatically.
✓ **Uses the Intent Engine** — every question travels the standard LOCATE → VALIDATE → PERMISSION → CONFIRM → INVOKE → RESPOND pipeline. No bespoke path.
✓ **Reuses existing business services** — reuses `_read-kit.ts` (`gap`, `readOnlyVerbGuard`), the port/handler/binding pattern, and `permissions.ts` in full. The only new service is the knowledge owner itself, which had no existing equivalent.
✓ **Does not create another assistant** — no second Companion, no second conversation surface, no separate engineering assistant. This was an explicit scope prohibition and is met by construction: the developer plane runs the same Companion code.
✓ **Does not duplicate conversation state** — the capability is stateless and holds no conversation.
✓ **Uses registered capabilities only** — one registered capability, `developer`, which pre-existed this work.
✓ **Uses permission-aware access** — `minimumRole: "developer"`, `knowledgeClass: "developer"`, `audited: true`, all unchanged from TIP1. Enforcement is `permissions.canInvokeCapability`, untouched.
✓ **Produces honest gaps rather than fabricated knowledge** — see the checklist item above and Part B evidence.

**Additionally, on §7 isolation** — four independent locks, each asserted alone in Part A because defence in depth is worthless if the layers are only tested together:

| Lock | Mechanism | Fails safe because |
|---|---|---|
| 1 — Seed | User-facing seed keeps `developer` at `availability: "never"` | `canInvokeCapability` rejects `"never"` **before** any role check |
| 2 — Binding | The engineering handler is bound only to the developer-plane instance | The user-facing singleton holds no handler to invoke |
| 3 — Role | `resolveContext()` cannot mint the `developer` role from a live session | The only factory that can is in the env-gated module |
| 4 — Environment | Every entry point throws unless `THA_DEVELOPER_PLANE=1` | Unset in production |

---

## PRODUCT REGISTRY IMPACT

- Registry affected: **NO**
- Entries created / updated / retired: **NONE**
- Any entry set to `public` or `household`: **N/A**
- Product knowledge written into a prompt, template, or fallback string: **NO** (Rule PKR27)

**Justification.** The Product Knowledge Registry is the census of what THA *is* to the people who use it. ENGINT1 ships no page, route, journey, dialog, notification, integration, API or setting, and changes nothing a household or admin can perceive — the capability is unreachable on the user plane by four independent mechanisms. `docs/product/developer-experiences/` describes developer-facing surfaces, but every entry there is a surface reachable in a running THA deployment; this one is reachable only on a separate deployment that production never runs. Adding an entry would assert a surface exists where it does not, which is the staleness Rule KC14 exists to prevent. **If the developer plane is ever actually deployed, that deployment is user-facing to developers and must create the entry in the same change.**

## ADOPTION REGISTER IMPACT

- Register affected: **NO** — no client-side building block added, changed, or retired. This work is entirely server-side; no file under `client/` was touched.
- `npm run adoption:check` passes: **not run — not applicable.** No building block was touched, so the gate does not apply to this change.

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Engineering Knowledge (documentation + repository; not a Source-of-Truth Register domain)
Declared SoT: docs/architecture/ · docs/investigations/ · docs/implementation/ ·
              docs/architecture/THA_MASTER_EVOLUTION_ROADMAP.md ·
              RELEASE.md / docs/release-notes.md / docs/release-matrix.md ·
              .engineering/protocols/ · git history
New store created? NO
  The index is a derived, in-memory cache over files that already exist. It is
  not a store: it persists nothing, and it is rebuilt from source on mtime change.
Existing store extended? NO
Consumer created? YES
  Reads from declared SoT? YES — directly from the owning files at answer time.
  No intermediate copy, no generated artefact, no database.
```

**No Source-of-Truth Register domain is created.** Engineering documentation is not a runtime data domain: no code branches on it, no household sees it, and its lifecycle is the Engineering Workflow's PR review, not a publication contract. Registering it as a domain would imply a publication/projection/verification lifecycle it does not have.

---

## IMPLEMENTATION

### New files (6)

| File | Lines | What it is |
|---|---|---|
| `server/services/engineering-knowledge-registry.ts` | 896 | **The owner-side read surface.** Phase 1 indexing (live filesystem walk, dual header-dialect parsing, mtime cache) and Phase 2 reasoning (`whoGoverns`, `implementationHistory`, `roadmapPosition`, `recentWork`, `openRisks`). Stores pointers and metadata only; reads excerpts at answer time. |
| `server/intelligence/handlers/engineering-knowledge-read-port.ts` | 79 | Delegation interface onto the owner. Read-only by construction — no write method exists. Dynamic-import factory so binding performs no I/O. |
| `server/intelligence/handlers/engineering-knowledge-read-handler.ts` | 311 | Executes `read`/`search`/`explain`/`report`. Every result carries citations or a structured gap. |
| `server/intelligence/bindings/engineering-knowledge.ts` | 56 | Binds the handler to the **existing** `developer` capability. Creates no capability. |
| `server/intelligence/developer-plane.ts` | 111 | **The §7 isolation boundary.** Env-gated factories for the developer-plane platform and the `developer`-role context. |
| `server/tests/test-intelligence-engineering-knowledge-binding.ts` | 385 | Part A isolation · Part B non-fabrication · Part C the eight manual-verification questions, against the live repository. |

### Modified files (3)

| File | Change |
|---|---|
| `server/intelligence/capability-registry.ts` | Extended the `developer` descriptor (description, `owningService`, `apiSurface`, `search` added to `supportedIntents`); `availability: "never"` **preserved and annotated as load-bearing**. Added exported `developerPlaneSeed()`. |
| `server/intelligence/index.ts` | Re-exported the binding, handler, port and developer-plane entry points, with a comment stating that exporting them does not make the capability reachable. |
| `package.json` | Registered `test:intelligence-engineering-knowledge-binding` and added it to the aggregate `test` chain. |

### Phase 1 — Engineering knowledge

Indexes **796 documents**: 45 architecture · 1 roadmap · 420 investigations · 323 implementation reports · 4 protocols · 3 release documents. Both live header dialects are parsed (the template's `**Date:**` bold lines and the newer `| **Date** | … |` metadata table); templates with placeholder dates are excluded so a placeholder can never be cited as evidence.

Retrieval is ranked by **inverse document frequency with a term-coverage gate**. This was not gold-plating — the first working version answered *"which document owns Planner architecture?"* with `ARCHITECTURE_PRINCIPLES.md`, because in a corpus of 796 engineering documents the word "architecture" carries almost no information. That is not a weak answer but a **wrong** one, and a confidently wrong owner is the single most damaging thing this capability could produce. Rare terms now dominate, and a document must match at least half the question's meaningful terms (minimum two) to be reported at all. Below that floor the answer is a gap.

### Phase 2 — Engineering reasoning

Five reasoning functions connect information across documents. The load-bearing one is `roadmapPosition()`, and its behaviour is the most important thing in this report:

**The roadmap records no per-workstream completion status.** It declares six launch workstreams (WS0–WS5) and rates each for whether it *gates* launch; its §8 emoji legend rates production *dimensions*, not workstreams; and every §9 Definition-of-Done checkbox is unchecked. So "which workstreams are complete?" is **not answerable from the repository**, and the implementation says so — returning `completionRecorded: false` permanently, alongside the declared workstreams and the implementation reports that name each one, as evidence for a human judgement.

Deriving "WS3 is complete" from the presence of reports mentioning WS3 would have been trivial, would have looked authoritative, and would have been fabrication. It is the most tempting failure in this capability and is refused explicitly, in code and in test.

---

## DEFINITION OF DONE

**What success looks like** — Engineering Intelligence answers engineering questions from existing project knowledge; responses reference the correct governing documents; no knowledge is duplicated; the Companion remains the single Intelligence Platform. **All met** — see VALIDATION PERFORMED.

**What must not break** — (a) the household Companion must not gain access to developer-class knowledge; (b) the existing capability registry and its bindings must continue to behave identically; (c) no user-facing behaviour changes. Verified: Part A asserts (a) across four locks; four existing suites re-run green for (b); no `client/` file and no route was touched for (c).

**Manual test steps** — `npm run test:intelligence-engineering-knowledge-binding`. Part C prints each of the eight verification questions with the documents and `path:line` citations it answered from.

---

## VALIDATION PERFORMED

| Command | Outcome |
|---|---|
| `npx tsc --noEmit` | **No errors in any ENGINT1 file.** 256 errors remain repo-wide, all in pre-existing test files (`test-intelligence-compound-resolver.ts` ×44, `test-plan2-planner-evolution.ts` ×38, …), none in a file this work touched. ENGINT1 did introduce one error during development — an `es6`-only regex flag in the registry — which is fixed; the count went 256 (pre-existing) → 257 (with that defect) → 256 (after the fix), so the net is zero introduced. |
| `npm run test:intelligence-engineering-knowledge-binding` | **34 passed, 0 failed** |
| `npm run test:intelligence-registry-executability` | **PASS** (registry-wide executability invariants) |
| `npm run test:intelligence-platform` | **PASS** |
| `npm run test:intelligence-product-knowledge-binding` | **PASS** (nearest analogue; unaffected) |
| `npm run test:mat1-registry-conformance` | **PASS** |
| `bash .engineering/scripts/repo-structure-verify.sh` | 9 PASS, 2 FAIL — **both pre-existing**, confirmed against the rollback tag (loose files at the `docs/implementation/` and `docs/investigations/` roots existed before ENGINT1). This change introduces no new violation and its own report is correctly filed under `engineering/`. |

The full build was **not** run: this change adds server modules with no client surface and no route, and `tsc --noEmit` across the whole repository already type-checked every touched file.

### Manual verification evidence — the eight questions

Run against the **live repository**, not a fixture. Output from Part C:

| # | Question | Answered with | Result |
|---|---|---|---|
| 1 | What architecture governs Food Intelligence? | `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md:1` (ranked first), then `INTARCH1_INTELLIGENCE_REASONING_ARCHITECTURE.md:110`, `NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md:6` | ✅ correct governing owner |
| 2 | Which implementation completed Companion Action Activation? | `docs/implementation/COMP_ACT1_COMPANION_ACTION_ACTIVATION.md:1` (2026-07-18), `COMP_ACT2_COMPANION_ACTION_SURFACING.md`, `INT40_COMPANION_TASK_DELEGATION_AND_ASSISTED_ACTIONS.md` | ✅ correct report |
| 3 | What workstreams remain before production? | All six roadmap workstreams with gating status — WS0 Knowledge Foundations *(Yes — first)* · WS1 Plant Diversity Launch *(Yes)* · WS2 Knowledge Layer V1 *(Yes, for benefits-bearing surfaces)* · WS3 Pantry Explore V2 *(Yes, the knowledge hub)* · WS4 Weekly Nutrition Report *(Yes, the story)* · WS5 Choose Better *(Partial — positive half only)* — plus `completionRecorded: false` | ✅ evidence + honest absence |
| 4 | Which roadmap items are unfinished? | Unchecked Definition-of-Done items at `THA_MASTER_EVOLUTION_ROADMAP.md:291, :295, :297, :300, …` | ✅ cited |
| 5 | Which document owns Planner architecture? | `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`, `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md:3` — **all from `docs/architecture/`, no investigation offered as a rule** | ✅ governing sources only |
| 6 | Summarise the last implementation reports. | Newest-first: `AFI1_AMBIENT_FOOD_INTELLIGENCE.md`, `AFI2_PLANNER_AMBIENT_INTELLIGENCE.md`, `AFI3_5_…COMPLETION.md`, `COMP_ACT1_…md` (all 2026-07-18) + git commit log | ✅ documents and git history |
| 7 | Explain why a feature exists using implementation history. | *Household Time*: built by `CONV1_PHASE_P6_COMPLETION.md`, `CONV1_PHASE_P7_COMPLETION.md`; decided in `TIME1_HOUSEHOLD_TIME_FOUNDATION.md`, `TIME2_HOUSEHOLD_TIME_CONSUMER_AUDIT.md` — **WHAT and WHY returned in separate fields, never merged** | ✅ correct separation |
| 8 | Report when information is unavailable rather than inventing an answer. | *"blockchain loyalty programme"* → status `gap`: *"No document in docs/architecture/ matches this topic. That is an honest gap…"* | ✅ refused to invent |

---

## DATA IMPACT

- Reads existing data: **YES** — engineering documentation, the repository, the roadmap, and git history. All read-only.
- Writes new data: **NO** — nothing beyond the implementation files themselves. No table, no column, no file written at runtime.
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**

---

## TRUST CHECK

**Could this mislead the user?** The household user cannot reach it at all. A developer could be misled by a *stale* answer, which is why the index is read live with mtime invalidation rather than generated — and by a *plausible wrong owner*, which is why weak matches are refused rather than ranked (see the IDF/coverage gate above).

**Could this fabricate certainty?** This was the primary design risk and is refused in three named places: no completion status is derived from the roadmap; no governing owner is nominated that the architecture has not declared; and absence of an implementation report is reported as *"the repository does not record it"*, never as *"it was not done"*. Twelve Part B assertions hold these down.

**Is anything guessed but shown as real?** No. Every returned claim carries a `path:line`. Where the header dialect yields no date or status, the field is `null` rather than inferred.

**What happens if the system is wrong?** A developer reads a citation that does not support the claim — and can tell immediately, because the citation is a path and a line number they can open. The failure is *visible and checkable*, which is the property that was designed for.

- No architectural duplication introduced: **YES** — the existing capability was activated, not duplicated.
- No new source of truth created: **YES** — pointers only; every fact keeps its existing owner.
- No runtime behaviour altered: **YES** for the user plane — the capability remains `never`, no route or client file was touched, and four existing suites confirm no regression.
- Every "verified" claim backed by a command that ran: **YES** — see VALIDATION PERFORMED; every row is a command with its actual output.

---

## SCOPE LOCK

**Implemented scope** — Phase 1 (engineering knowledge indexing over architecture, investigations, implementation reports, roadmap, protocols and release documentation) and Phase 2 (cross-document reasoning: governance ownership, implementation history, roadmap position, recent work, open risk), read-only, on the isolated developer plane.

**Explicitly excluded** — and none of it was begun:

- No code generation, no automated deployment, no production modification
- No autonomous engineering agents
- No release orchestration, commit generation, or automated reporting
- No second Companion, no second Intelligence Platform, no second Capability Registry
- No duplicated engineering documents and no duplicated business logic
- **No HTTP route, no UI, no user-plane exposure** — and none may be added without amending §7 and §4.2 first
- No pattern-matcher entries in `pattern-intent-resolver.ts` — deliberate: the resolver serves the user-plane utterance path, and adding engineering matchers there would place engineering vocabulary on the household surface. The developer plane calls `platform.handle()` with an explicit intent.
- No `CONTEXT_VIEW_SPECS` entry — the generic INT17 derivation handles these projections, exactly as `product-knowledge` relies on it
- No Engineering Automation, no Remote Operations

**Suggestions (not implemented, not approved)** — (1) the roadmap could carry a per-workstream status field, which is the one change that would make "which workstreams are complete?" answerable at all; (2) `docs/implementation/` and `docs/investigations/` have pre-existing loose files at their roots that the structure gate fails on; (3) a developer-plane deployment target would need a Product Registry entry and an `admin_audit_log` wiring for the `audited: true` posture, which is unexercised while the plane is never deployed.

---

## OUTCOME

THA can now be asked about its own engineering and will answer from its own record — 796 documents plus git history — with a `path:line` behind every claim, or an explicit statement that the record is silent. The capability that does this is the one TIP1 declared and never built, so the platform gained a faculty without gaining an owner, an assistant, or a duplicate. The household Companion is byte-unchanged and, by four independent mechanisms, cannot reach any of it.

The most useful thing it does is refuse. Asked what remains before production, it returns the six declared workstreams, their gating status, the unchecked Definition-of-Done items, and the reports referencing each — and then says that **the roadmap records no completion status anywhere**, rather than inventing the verdict it would have been so easy to derive. That refusal is the capability working, and it surfaces a real gap in THA's engineering record that no amount of reading had made visible before.

## NEXT STEPS

- **Awaiting approval:** nothing is deployed. The developer plane has no deployment target and `THA_DEVELOPER_PLANE` is unset everywhere; deploying it is a separate, explicitly-approved decision.
- **Uncommitted:** the working tree carries 248 pre-existing entries from prior sessions. ENGINT1's own files are committed with this report.
- **If the developer plane is ever deployed:** create its Product Knowledge Registry entry in that same change, and wire `admin_audit_log` for the capability's `audited: true` posture.
- **Not scheduled and not begun:** Engineering Automation and Remote Operations remain out of scope per the Scope Lock.
