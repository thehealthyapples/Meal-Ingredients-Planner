# ENGINT2 — Engineering Knowledge Graph (derived relationship reasoning)

**Developer Intelligence can now explain how engineering artefacts relate — 4,882 relationships derived across 796 documents, every one carrying the `path:line` that proves it, none stored anywhere. It created no capability, no registry, no index, no database and no source of truth: the graph is computed from the documents at read time and dies with the query. Its most valuable output is a refusal. An empirical study of the live corpus found that three of the five relationships the mission named cannot be evidenced by this repository — there are no release tags, the `WS<n>` token space is split across three colliding schemes, and `Status:` has 317 distinct values where `Complete` and `Investigation complete` mean opposite things. Those three are reported as structured gaps naming the exact repository change that would make each answerable, rather than approximated into confident fiction.**

| | |
|---|---|
| **Session** | `ENGINT2_Engineering_Knowledge_Graph` |
| **Date** | 2026-07-18 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `rollback/ENGINT2-engineering-knowledge-graph-20260718` → `0efcfc7f388f43f979543d61ea25dfecee5fe181` |
| **Risk** | 🟢 GREEN |
| **Reason** | Purely additive derivation over the ENGINT1 index. No new capability, verb, store, route or user-facing surface; the capability registry seed is byte-untouched. |
| **Status** | **Implemented and verified.** 36/36 ENGINT2 assertions pass against the live repository; ENGINT1's 34 re-run green; 4 further intelligence suites green. |
| **Product changed** | Nothing user-facing. |

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/ENGINT2-engineering-knowledge-graph-20260718` → `0efcfc7f388f43f979543d61ea25dfecee5fe181` |
| Working tree | **Intentionally dirty** — 231 entries from prior sessions at tag time. The tag captures **committed state only** and does not cover them. |
| This task's writes | 1 new test file; 3 modified files (all additive) |
| Rollback to committed state | `git checkout rollback/ENGINT2-engineering-knowledge-graph-20260718` |
| Rollback of this task only | `git revert <this commit>` — self-contained; ENGINT1 remains fully functional without it. |

> A tag protects committed state only. The tree was dirty before ENGINT2 began.

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` — §3.1 (TIP owns an index of pointers, never knowledge), §3.3 (avoiding duplicate knowledge ownership), §4.2, §7
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md` — Architecture Compliance Checklist, AI Architecture Compliance, Completion Gate
- [x] `docs/architecture/REPOSITORY_CONVENTIONS.md`
- [x] `docs/implementation/engineering/ENGINT1_ENGINEERING_INTELLIGENCE_FOUNDATION.md` — the capability this extends
- [x] `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`

---

## THE EMPIRICAL STUDY THAT SHAPED THIS

The mission's rule *"never infer unsupported relationships"* cannot be honoured by writing plausible derivation rules and hoping the corpus matches them. So before any code, the live corpus was measured. The findings determined what was built and what was refused.

### What the repository CAN evidence

| Relationship | Evidence density |
|---|---|
| Implementation → cites → Architecture | **210 of 327** implementation files, 843 citations |
| Implementation → cites → Investigation | **57 of 327** files, 108 citations |
| `REFERENCE DOCUMENTS READ` sections | 77 of 327 implementation docs; ~638 entries, of which ~550 resolve to documents (the rest are source-code paths) |
| Architecture ← promoted from ← Investigation | **12 of 40** architecture docs carry a "promoted from" line |
| Document → Commit | **73.8%** of the last 80 commit subjects begin with an EWO id; 90% contain one |

### What it CANNOT — and why each was refused

**Commit → included in → Release. There is no release ledger.** Of **900** git tags, **750** are `rollback/…`; the remainder are workstream markers (`investigation/…`, `fix/…`, `impl/…`, `audit/…`, `design/…`). Zero denote a release. `git tag --contains` on the most recent commit returns one rollback tag; on an older commit it returns 116 — all rollback points. `RELEASE.md`'s "Restore Points / Baseline Tags" table lists **2** tags and was last updated **2026-05-12**. Deriving "shipped" from any of this would dress a rollback point as a release.

**Roadmap → owns → Workstream. The `WS<n>` token space collides three ways.** The roadmap declares WS0–WS5. But `docs/investigations/knowledge/` holds a larger, unrelated WS series — **27 files** beginning `WS0`, plus a `WS0X_1`…`WS0X_13` sub-series — and WS6–WS11 exist with no roadmap cell at all. `WS0` occurs **~1,369 times** across `docs/`, overwhelmingly the knowledge scheme. No document declares which scheme its reference belongs to. Token-matching would attribute the wrong work to the roadmap, with total confidence.

**Status → shipped / unresolved. The field is effectively free text.** **317 distinct** `Status:` values across ~340 documents. The negative vocabulary scores zero: `BLOCKED` 0, `UNRESOLVED` 0, `NOT SHIPPED` 0, `SUPERSEDED` 0. And `Complete` and `Investigation complete` mean **opposite things** about whether anything shipped — a naive "complete ⇒ shipped" rule would be wrong for ~56 documents.

Each refusal returns `answerable: false`, the evidence, and **the concrete repository change that would make the question answerable**. That is the deliverable, not a shortfall against it.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

**□ One canonical identity** — No new identity. Edges are keyed on the repo-relative paths the ENGINT1 index already established; commits are keyed on their SHA. No new id space.

**□ One owner per fact** — No fact acquires a second owner. A relationship is not stored anywhere: it exists only as a sentence in a file, and this module reads that sentence and returns it with its line number. The document remains the sole owner of its own citations.

**□ No duplicate entities** — No new entity. `EngineeringEdge` is a return shape, not a stored record; it is constructed per query and discarded.

**□ No duplicate ownership** — The load-bearing item. No capability, registry, index, store or source of truth was created — the mission's explicit prohibition, verified by six Part D assertions.

**□ No duplicate state** — No state at all. Two `WeakMap` memos exist, keyed on the index snapshot object, so they are collected when the snapshot is replaced on mtime change. A cache of a derivation (Principle 7), not a store of a fact.

**□ Extends existing architecture** — Extends the ENGINT1 registry module, port and handler in place. **No new verb**: relationship questions ride the already-declared `explain` (via `aspect`) and `report` (via `subject`). The capability descriptor is byte-untouched.

**□ Progressive enrichment where appropriate** — N/A. Not a knowledge entity and not transactional state; a derived view over documents.

**□ Knowledge domain compliance** — No knowledge domain is introduced or extended. ENGINT2 adds no knowledge whatsoever; it reads relationships that were already written down and returns them with citations. This is TIP1 §3.3 exactly — *"the index is derived only… there is never an authored answer that exists only inside TIP."*

**□ Honest gaps over fabricated information** — The defining property, in five places: three structural refusals (`shippingStatus`, `roadmapOwnership`, and the coverage caveat); unresolved ids reported rather than inferred into edges; ambiguous basenames and ambiguous ids resolving to nothing rather than to a guess.

**□ No permanent synchronisation bridge** — None. One-way derivation, no write path, nothing to keep in sync because nothing is copied.

**□ Evolution over replacement** — Nothing replaced, nothing retired. Purely additive.

---

## AI ARCHITECTURE COMPLIANCE

✓ **Uses the canonical Intelligence Platform** — unchanged; ENGINT2 adds no platform surface.
✓ **Uses the Capability Registry** — unchanged. `capability-registry.ts` was **not modified by ENGINT2 at all**.
✓ **Uses the Intent Engine** — relationship questions travel the standard pipeline on existing verbs.
✓ **Reuses existing business services** — extends the ENGINT1 owner service; reuses its index, its `EngineeringCitation`/`EngineeringGap` shapes, and `_read-kit`'s honest-failure constructors.
✓ **Does not create another assistant** — none.
✓ **Does not duplicate conversation state** — stateless.
✓ **Uses registered capabilities only** — one, `developer`, unchanged from ENGINT1.
✓ **Uses permission-aware access** — unchanged: `minimumRole: "developer"`, `knowledgeClass: "developer"`, `audited: true`.
✓ **Produces honest gaps rather than fabricated knowledge** — three structural refusals plus per-query gaps.

**§7 isolation re-verified.** ENGINT2 must not have loosened ENGINT1's four locks. Part D asserts the user-facing plane is still `availability: "never"`, the household Companion still cannot reach engineering relationships, and both planes still hold identical capability sets.

---

## PRODUCT REGISTRY IMPACT

- Registry affected: **NO** · Entries created/updated/retired: **NONE**
- Product knowledge written into a prompt, template, or fallback string: **NO**

Nothing user-facing ships. The capability remains unreachable on the user plane by four independent mechanisms, so no surface exists to describe.

## ADOPTION REGISTER IMPACT

- Register affected: **NO** — no `client/` file touched. `npm run adoption:check` not run; not applicable.

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Engineering Knowledge (documentation + repository)
Declared SoT: unchanged from ENGINT1 — docs/architecture/, docs/investigations/,
              docs/implementation/, the roadmap, .engineering/protocols/, git
New store created? NO — relationships are derived per query and never persisted
Existing store extended? NO
Consumer created? NO — the existing consumer gained derived views
  Reads from declared SoT? YES — directly, at query time
```

---

## IMPLEMENTATION

### Files changed

| File | Change |
|---|---|
| `server/services/engineering-knowledge-registry.ts` | **+~470 lines**, one appended section. Edge derivation (`edgesFor`, `allEdges`), citation/id resolution, `documentGraph`, `commitsForDocId`, `coverageGaps`, `shippingStatus`, `roadmapOwnership`. Two defect fixes (below). |
| `server/intelligence/handlers/engineering-knowledge-read-port.ts` | +4 port methods |
| `server/intelligence/handlers/engineering-knowledge-read-handler.ts` | `explain` gained `aspect: "relationships"`; `report` gained `coverage`, `shipping`, `roadmap-ownership` subjects. **No new verb.** |
| `server/tests/test-intelligence-engineering-knowledge-graph.ts` | **New**, 36 assertions across four parts |
| `package.json` | Registered `test:intelligence-engineering-knowledge-graph` and added it to the aggregate chain |

**`server/intelligence/capability-registry.ts` was not touched.** The capability surface is identical to ENGINT1's — which is the clearest available evidence that no new ownership was created.

### How an edge is derived

For each line of a document: every `.md` token is resolved (full path · relative link · bare filename · backticked variants), and every uppercase-with-digit token is resolved against the id inventory with `-`/`_`/space normalisation. A resolved target becomes an edge carrying that line as evidence. Three refusals are built in — **self-edges are dropped** (every report names its own id repeatedly), **ambiguous basenames and ambiguous ids resolve to nothing** rather than to a guess, and **unresolved ids are reported in their own field**, because most are intra-document rule ids (`KC7`, `BW03`, `SEC-2`) rather than broken links, and that distinction is not machine-decidable from the citation alone.

`promoted-from` is emitted only on an architecture document, only on a line matching `promoted (and renamed) from`, and only when the target is an investigation. `promoted under` is **excluded** — it names the workstream that performed the promotion, not the source — as is `graduated from`, which the corpus uses in an unrelated design-study sense.

Commit links distinguish `delivered-by` from `preceded-by`: a `chore: preserve … before <ID>` snapshot marks the state **before** the work, and classifying it as delivery would credit a workstream to the commit that predates it.

### Two defects found and fixed during this work

**1. False unresolved gaps (ENGINT2, found by reading test output).** The first working version reported `TIME1_HOUSEHOLD_TIME_FOUNDATION` as an *unresolved* reference — a document that plainly exists. The id regex swallowed the whole filename stem, so it never matched the `TIME1` docId. This filled the unresolved list with false gaps, which is the one defect that would make that list worthless, since its entire value is that every entry can be trusted. Fixed with a three-form resolver (id · full stem · leading-segment id) and locked down by two regression assertions. Edge count rose 4,797 → 4,882 and false gaps went to zero; the list now contains genuinely dangling ids (`TIME3`, `CP3`, `SEC-2` — workstream and rule ids with no document), exactly as the empirical study predicted.

**2. A stale verification claim in ENGINT1 (correcting the record).** ENGINT2's first typecheck surfaced a pre-existing error at `engineering-knowledge-registry.ts:380` — a `Set` iteration requiring `--downlevelIteration`, introduced by ENGINT1's IDF ranking change. **ENGINT1's report stated the typecheck was clean, and by the time it was written that claim was stale**: after the final ranking edit I re-ran the test suite but not `tsc`. The error is now fixed. The ENGINT1 report's VALIDATION table should be read with this correction; the process failure was re-running only the fast check after a late edit.

---

## DEFINITION OF DONE

**What success looks like** — Developer Intelligence explains engineering relationships with evidence, while preserving one Intelligence Platform, one Capability Registry, one source of truth, and no duplicated ownership. **All met** — Parts A–D.

**What must not break** — (a) ENGINT1's four isolation locks; (b) the existing capability surface; (c) no user-facing change. Verified: Part D asserts (a) and (b) directly; ENGINT1's 34 assertions and four further suites re-run green; no `client/` file touched for (c).

**Manual test steps** — `npm run test:intelligence-engineering-knowledge-graph`. Each part prints its derived edges, evidence citations and refusals.

---

## VALIDATION PERFORMED

| Command | Outcome |
|---|---|
| `npm run test:intelligence-engineering-knowledge-graph` | **36 passed, 0 failed** |
| `npm run test:intelligence-engineering-knowledge-binding` | **34 passed, 0 failed** (ENGINT1 unbroken) |
| `npx tsc --noEmit` | **No errors in any ENGINT1 or ENGINT2 file**, including the ENGINT1 defect this work fixed. 251 errors remain repo-wide, all in pre-existing sibling test files. |
| `npm run test:intelligence-registry-executability` | **PASS** |
| `npm run test:intelligence-platform` | **PASS** |
| `npm run test:intelligence-product-knowledge-binding` | **PASS** |
| `npm run test:mat1-registry-conformance` | **PASS** |

The full build was not run: server-only change, no client surface, no route; `tsc --noEmit` covered every touched file.

### Verification results — the eight questions

| Question | Answer | Evidence |
|---|---|---|
| Why does this feature exist? | Neighbourhood of a document: what it cites, what cites it | ENGINT1 → 29 outgoing edges, each with `path:line` |
| Which investigation led to this implementation? | `cites` edges into `docs/investigations/` | e.g. ENGINT1 → `TIP1_INTELLIGENCE_PLATFORM_ARCHITECTURE_INVESTIGATION.md`, evidence line 3 |
| Which architecture governs this? | `cites` edges into `docs/architecture/` | ENGINT1 → `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, evidence line 35 |
| Which roadmap item owns this? | **`answerable: false`** + declared workstreams WS0–WS5 still returned | Three colliding WS schemes; ~1,369 `WS0` occurrences |
| Which architecture has no implementation? | **2** of 45 | `THA_BRAND_CONSTITUTION.md`, `THA_INTELLIGENCE_LANGUAGE_GUIDE.md` |
| Which implementations have no governing architecture? | **94** of 323 | newest: `AFI1`, `AFI2`, `COMP_ACT1`, `COMP_ACT2`, `HOUSE_VISUAL_DESIGN`, `HOUSE6` |
| Which investigations remain unresolved? | **285** of 420 | newest: `EXPINT1_INTELLIGENCE_EXPERIENCE.md` (2026-07-17) |
| What has not yet shipped? | **`answerable: false`** + labelled proxy (226 reports with no delivering commit) | 900 tags · 750 rollback · **0 release** |

**4,882 edges** derived across **796** documents.

### The result that validates the derivation

The graph found exactly **two** architecture documents with no implementation — and both are documents that *declare themselves implementation-free*. The Brand Constitution's own index entry states it *"creates **no** entity, owner, service, capability, route, token, component, string, or business logic, and no runtime code reads it."* The Intelligence Language Guide states it *"creates **no runtime dependency**."* The derivation independently identified the only two governing documents that are unimplementable by design, and nothing else. That is a stronger correctness signal than any synthetic fixture could have given.

---

## DATA IMPACT

- Reads existing data: **YES** — documents and git history, read-only.
- Writes new data: **NO** — no relationship is persisted anywhere.
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**

---

## TRUST CHECK

**Could this mislead the user?** The plausible failure is a reader taking the coverage lists as "what has not been built". They are lists of **where the record is thin** — only 57 of 327 implementation reports cite an investigation by path, so the 285 figure over-reports by construction. The caveat is returned *inside the answer*, not appended to this document, and a Part C assertion fails if it is ever removed.

**Could this fabricate certainty?** This is where the work concentrated. Three unanswerable questions return `answerable: false` with evidence rather than approximations; unresolved ids are never inferred into edges; ambiguity resolves to nothing rather than to a guess. The `preceded-by` classification exists specifically so a pre-work snapshot is never counted as delivery.

**Is anything guessed but shown as real?** No. Every edge carries the `path:line` that proves it, asserted for every edge in Part A.

**What happens if the system is wrong?** A reader opens the cited line and sees it does not support the claim. The failure is visible and checkable in one click — the property the design optimised for.

- No architectural duplication introduced: **YES** — no capability, registry, index, store or verb added; `capability-registry.ts` untouched.
- No new source of truth created: **YES** — relationships derived, never stored.
- No runtime behaviour altered: **YES** for the user plane — re-verified by Part D.
- Every "verified" claim backed by a command that ran: **YES** — and where a *previous* report's claim had gone stale, it is corrected above rather than left standing.

---

## SCOPE LOCK

**Implemented** — derived relationship reasoning over the existing engineering record: document neighbourhoods (cites / cited-by / promoted-from / commits / unresolved), coverage gaps, and three evidenced refusals.

**Explicitly excluded, none begun** — no new capability · no new registry · no new index · no new database · no new source of truth · no stored graph · no new verb · no HTTP route, UI or user-plane exposure · no pattern-matcher entries · no code generation, deployment, commit generation, release orchestration or autonomous agents · no Engineering Automation or Remote Operations.

**Suggestions (not implemented, not approved)** — each is a repository change, not a code change:
1. **Release tags**, or a release field on implementation reports — the single change that would make "what has shipped" answerable. Today the tag namespace is a rollback safety net (750/900).
2. **A distinct roadmap workstream identifier**, or an explicit roadmap-workstream field on documents — would resolve the three-way `WS<n>` collision.
3. **A controlled `Status:` vocabulary** — 317 distinct values across ~340 documents, with `Complete` and `Investigation complete` meaning opposite things, makes the field unusable for any automated reasoning.
4. The **94 ungoverned implementation reports** and **285 investigations with no recorded follow-through** are worth a human pass — some will be genuine gaps, most are probably missing citations.

---

## OUTCOME

Developer Intelligence can now be asked how THA's engineering fits together, and answers with 4,882 relationships derived live from the documents themselves, each carrying the line that proves it. Nothing is stored: the graph exists for the duration of a query and is reconstructed from the record every time, so it cannot drift from the truth it describes. The capability surface is unchanged — same capability, same four verbs, same registry, same seals on the user plane — which is the evidence that the extension added reasoning without adding ownership.

What makes it trustworthy is what it declines to say. Asked what has not shipped, it reports that THA keeps no release ledger and names the 900 tags, 750 of them rollback points, rather than calling one a release. Asked which roadmap item owns a piece of work, it reports that three unrelated schemes share the `WS<n>` token space and declines to guess. Both refusals name the exact change that would make the question answerable — so the gaps are not dead ends but a short, evidenced list of what THA would need to record about itself to know these things.

## NEXT STEPS

- **Awaiting owner review.** Nothing is deployed; `THA_DEVELOPER_PLANE` remains unset everywhere.
- **Correction to carry forward:** ENGINT1's report claimed a clean typecheck; that claim was stale and the underlying error is fixed here. Re-running only the fast check after a late edit is the process failure to avoid.
- **Four suggestions above** are repository/process decisions for the owner, none begun.
- **Out of scope and not begun:** Engineering Automation, Remote Operations.
