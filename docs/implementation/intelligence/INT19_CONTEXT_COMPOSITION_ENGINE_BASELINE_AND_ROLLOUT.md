# INT19 — Context Composition Engine: Committed Baseline and Context View Rollout Plan

> **Status: COMPLETE.** The Context Composition Engine (INT17/INT18) is **committed** to
> `int1-intelligence-platform`. A fresh **3-run** full benchmark, executed against the
> committed tree, is recorded here as the **new platform baseline** — discharging the
> "baseline is n=1" caveat both INT17 §7 and INT18 §7 left open. Every registered
> capability is audited and classified by Context View status, and a rollout plan
> prioritises which capabilities should gain a **native** Context View next.
>
> **No business logic changed in this workstream.** BENCH4's resolver matchers — the only
> business-logic change in the working tree — were committed **separately and ahead** of
> the engine (commit `cb314cc`), so the engine commit (`e65bc1f`) can be, and is, asserted
> to change no capability, handler, port, binding or registry entry.

**Classification:** Intelligence Governance → Context Composition (`server/intelligence/context/`)
**Date:** 2026-07-08
**Branch:** `int1-intelligence-platform`
**Governing document:** `docs/architecture/THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md`
**Design record:** `docs/implementation/intelligence/INT17_CONTEXT_COMPOSITION_ENGINE.md`
**Verification record:** `docs/implementation/intelligence/INT18_CONTEXT_COMPOSITION_ENGINE_IMPLEMENTATION.md`

---

## 0. ROLLBACK — created before any file was modified

`git status` was confirmed first: the tree was clean except the untracked INT18 measurement
harness (`.int18-tmp/`) and 80 uncommitted benchmark artefacts. Both rollback tags from the
predecessor workstreams were verified to resolve before anything was committed.

| Identifier | Object | Restores |
|---|---|---|
| **`int19-rollback-20260708`** | `fb2f188` | The complete pre-INT19 working tree, tracked **and untracked** |
| `int18-rollback-20260708` | `dcba3d1` | Pre-INT18 tree (before the verification workstream) |
| `int17-rollback-20260708` | `11196b8` | Pre-INT17 tree (before the engine existed) |

```bash
git show --stat int19-rollback-20260708      # inspect
git checkout int19-rollback-20260708 -- .    # restore everything
```

The INT19 snapshot was built through a temporary `GIT_INDEX_FILE`, so the real index was
never touched — verified by comparing `git write-tree` before and after
(`de394bba…` both times). `.gitignore` was honoured.

---

## 1. What was committed, and how it was split

Two deliberate commits, ahead of this document, so the "no business logic" claim is
provable at the commit boundary rather than asserted over a mixed diff.

| Commit | Subject | Contents | Business logic? |
|---|---|---|---|
| `cb314cc` | Implement BENCH4 — route food-intelligence:report | `pattern-intent-resolver.ts` (+85), BENCH4 doc | **Yes** — routing. Owned by BENCH4, not INT17/INT18. |
| `e65bc1f` | Implement INT17/INT18 — the Context Composition Engine | engine (3 modules, 1,738 lines), 105-assertion suite, gateway seam, `package.json`, README + governing architecture doc, INT16/17/18 records, benchmark history | **No** — 0 capability/handler/port/binding/registry lines. |

**Why the split matters.** Every token and benchmark figure in INT17/INT18 was measured with
BENCH4's resolver present (both name it in their *Subject* line), because it is what makes
`food-intelligence` reachable and lets the engine show 3/3 evidence groups. Committing the
engine without it would leave a HEAD from which the recorded baseline **does not reproduce**.
Committing them together would put a routing change inside the commit that claims to change no
business logic. Two ordered commits satisfy both: HEAD carries BENCH4, and the engine commit
is clean.

Verification at commit time:

| Check | Result |
|---|---|
| `test:intelligence-context-composition` | **105 passed, 0 failed** |
| `npx tsc --noEmit` | **178 errors — unchanged pre-existing count.** 0 in `server/intelligence/context/`; the 1 gateway error (`companionPersonality`, line 950) is pre-existing and outside the INT17 seam |
| `git diff` of engine commit touches a capability/registry | **no** |
| INT16 files deleted | confirmed — never committed; exist only in the `int17`/`int18` rollback snapshots (deleted, not deprecated) |
| Benchmark history append-only | all 82 prior index entries intact; 39 added; 0 mutated, 0 deleted |

> **One pre-existing data inconsistency, recorded not fixed.** `2026-07-08T14-19-37Z__8b01fff`
> is a complete, scored run (75.9) whose entry was never appended to `index.json`. It is
> committed as-is. The append-only index was **not** rewritten to backfill it — editing an
> append-only ledger to insert a historical row is exactly the kind of silent mutation the
> history model exists to forbid.

---

## 2. The new platform baseline (n = 3, committed tree)

`npm run test:companion-benchmark -- --mode=full --user=1`, `worldMode: single-world`, judge
tier off, executed **three times** against the committed HEAD `e65bc1f`. The runs are tagged
`__e65bc1f`, not `__8b01fff`: the baseline is measured against the state a future workstream
will actually branch from, so it **reproduces from HEAD**.

| run | score | IRA | entityRefs | q w/ refs | halluc | hard gates | routing gates | honest-gap | verdict |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| BENCH4 legacy baseline (n=1, pre-engine) | 75.7 | 0.852 | 121 | 23 | 0% | 0 | 12 | 100% | PARTIAL |
| INT18 confirmation (n=1) | 76.1 | 0.852 | 153 | 31 | 0% | 0 | 12 | 100% | PARTIAL |
| **INT19 baseline run 1** `21-04-44Z` | 76.0 | 0.852 | 170 | 29 | 0% | 0 | 12 | 100% | PARTIAL |
| **INT19 baseline run 2** `21-07-13Z` | 76.3 | 0.852 | 176 | 32 | 0% | 0 | 12 | 100% | PARTIAL |
| **INT19 baseline run 3** `21-09-43Z` | 76.1 | 0.852 | 154 | 30 | 0% | 0 | 12 | 100% | PARTIAL |
| **BASELINE (median)** | **76.1** | **0.852** | **170** | **30** | **0%** | **0** | **12** | **100%** | **PARTIAL** |

**Median score 76.1 · mean 76.13 · spread 0.3 · n=3.** The spread is well inside INT16's
~1.2-point noise floor — three runs of the committed engine cluster within a third of a point.

**This is now the number every future Context Composition workstream compares against.** It is
recorded as a **median of three**, against the ~1.2-point noise floor INT16 §6.2 established by
running identical code eleven times. The single-run baselines above (BENCH4's 75.7, INT18's
76.1) could not resolve ±0.5; this one can, and it discharges INT17 §7 item 7 / INT18 §7 item 7.

What the baseline establishes and does **not**:

- **Establishes:** the committed engine holds every safety and honesty invariant — 0
  hallucinations, 0 hard gates, 100% honest-gap, 12 routing gates on the same 12 questions,
  IRA 0.852 (deterministic routing, untouched), verdict PARTIAL — at the 20.6% lower prompt
  cost INT18 measured exactly.
- **Does not establish** any composite-score *gain*. The movement over the legacy baseline
  remains inside the noise floor and is **not claimed**. The durable quality signal is
  `entityRefs` (121 legacy → 170 median) and 3/3 evidence-group coverage — not the score.
- **IRA is capped at 0.852 by 12 misroutes, not by the engine.** The engine cannot change
  routing; those 12 are a resolver concern (releaseReadiness warns IRA 85% is below the 90%
  floor). Out of scope here, named for the rollout.

Artefacts (append-only, newest tagged `__e65bc1f`):

```
docs/intelligence/benchmark/history/2026-07-08T21-04-44Z__e65bc1f.{json,report.md}   # run 1  (76.0)
docs/intelligence/benchmark/history/2026-07-08T21-07-13Z__e65bc1f.{json,report.md}   # run 2  (76.3)
docs/intelligence/benchmark/history/2026-07-08T21-09-43Z__e65bc1f.{json,report.md}   # run 3  (76.1)
```

The INT18 measurement harness that produced the exact-token and entity-preservation numbers,
previously untracked scratch in `.int18-tmp/`, is preserved at
`server/tests/benchmark/context-composition-verification/` (imports re-pathed, logic
unchanged) so those claims are re-runnable — closing the gap INT18 §3 recorded, that INT17's
harness had to be rebuilt from scratch.

---

## 3. Capability Context View audit

Every capability owes the model a **Context View** — the LLM-facing projection of its Full
Result — but only two capabilities *declare* one today; the rest fall through the engine's
**generic derivation** (shape without meaning). This section classifies all 23 registered
capabilities into three buckets, so the rollout in §4 is a prioritisation over a complete map,
not a guess.

The engine has a `CONTEXT_VIEW_SPECS` table with exactly **2** entries. INT18 §2 states the
same: 2 declared, 21 without a spec. This audit refines that 21 by separating capabilities that
genuinely *use* generic derivation to ground a user turn from those that emit **no LLM grounding
at all** and therefore need no view of either kind.

**Legend.**
**Native** — a registered `ContextViewSpec` (`context-view.ts`): the capability names its own
pinned constraints / collections / kept fields.
**Generic** — no spec; the engine derives shape structurally (group-by, first-item-per-group,
noise-field drop, redundant-string clip). Correct and safe, but blind to which fields *matter*.
**None** — the capability does not ground a user-plane LLM turn, so a Context View is moot.

### 3.1 Native Context View (2)

| Capability : verb | Why it earned a native view | Measured effect (INT18 §4.1) |
|---|---|---|
| `profile:read` | Pins the user's dietary constraints (`dietPattern`, `dietRestrictions`, `dietTypes`, `excludedIngredients`, `healthGoals`), emitted **always, even when empty** — absence ≠ emptiness (HARD RULE 3). Strips the ~1,200 chars of plumbing (`emailVerified`, `subscriptionExpiresAt`, `soundEnabled`, …) the model can never use. | 69 turns, **102,396 → 19,934 chars (−81%)**. The single largest reduction on the platform — `profile` was 44.8% of every context byte. |
| `food-intelligence:report` | Groups Food Opportunities by `type` and keeps `owningDomain`, `explanation`, `suggestedAction`, `evidence` — so all three evidence groups reach the model, not just the priority-sorted first. | 2 turns, 3,626 → 3,138 chars; **evidence groups 1/3 → 3/3**. |

### 3.2 Generic Context View — produce grounding, no spec (used by the engine's generic path)

Ordered by measured AFTER-footprint (INT18 §4.1) — this ordering *is* the input to §4.

| Capability | n turns | AFTER chars | generic Δ | Notes for rollout |
|---|---:|---:|---:|---|
| `meals` | 24 | 32,511 | −25% | Largest generic surface. Highest turn-count leverage. |
| `nutrition-knowledge` | 15 | 17,017 | −12% | **Contains the `scope=foods` 611-food registry dump** — the CB-022 regression cause. |
| `pantry` | 8 | 12,707 | −12% | Generic performing acceptably. |
| `analyser` | 6 | 10,650 | **−2%** | **15 groups, `MAX_GROUPS_SHOWN` seats 8.** Barely compressed. |
| `shopping` | 6 | 6,459 | −19% | Acceptable. |
| `food-intelligence` | *(native — above)* | | | |
| `meal-discovery` | 2 | 1,239 | −64% | Generic works well. |
| `household` | 8 | 2,752 | **+21%** | Grows (adds honest `_context`); tiny absolute — cosmetic (INT18 §6.3). |
| `diary`, `partners`, `templates`, `planner`, `nutrition-discovery`, and the six `*-discovery` search capabilities | *(the "9 further capabilities")* | small | — | Low footprint; generic is fit for purpose. `planner` usually returns `no-knowledge` for user 1, so it rarely grounds. |

### 3.3 No Context View required (do not ground a user-plane LLM turn)

| Capability | aiAccess | Why no view | 
|---|---|---|
| `developer` | **never** | Physically isolated developer plane (TIP1 §7); never reaches the user-plane LLM by construction. |
| `administration` | W! (admin) | Admin operations behind human-confirmation; not a Companion grounding surface. Never fires in the companion corpus. |
| `opportunity-delivery` | W | Cross-cutting delivery framework; **has no resolver matcher**, so no user turn routes to it today (BENCH4 note). Its output is a verbatim projection of `food-intelligence:report`, which already owns a native view. |
| `evidence-learning` | W | Platform learning framework; `report`/`search` are not resolver-reachable in a companion turn today. |

> `opportunity-delivery` and `evidence-learning` are **dormant, not exempt.** The day a
> workstream gives either a resolver matcher, it will begin grounding turns through generic
> derivation and should be re-triaged into §3.2 — and, per §4, `opportunity-delivery` would
> inherit `food-intelligence`'s native view shape since it re-projects the same opportunities.

---

## 4. Rollout — which capabilities gain a native Context View next

**Prioritisation basis.** The composite score is inside the noise floor, so "benchmark impact"
is measured honestly as **(a)** token/char cost recovered from the guaranteed core, **(b)**
specific benchmark questions a view fixes or improves, and **(c)** `entityRefs` — never as
projected composite points. The three inputs are §3.2's footprint table and the two documented
failure modes (CB-022; analyser's 15-groups-seats-8).

Each candidate is a **pure move** across the seam the architecture already defines (§2.1): the
engine cannot tell whether a view came from a spec or from generic derivation, so adding a
`ContextViewSpec` changes no capability and no business logic — exactly the property this
workstream preserved.

### Priority 1 — `nutrition-knowledge:read scope=foods` · **CRITICAL**

The whole 611-food Food Knowledge Registry is routed in as grounding on some questions. It is
**reference data, not evidence about the user**, and its ~40 `type` groups exhaust
`MAX_GROUPS_SHOWN = 8` and the guaranteed core *per group*, starving co-resident capabilities.

- **Benchmark impact:** the direct cause of **CB-022** — the *only* genuine answer-quality
  regression in INT17/INT18 (§6.3): `nutrition-knowledge scope=foods` seated 8 core items and
  left `meals` only 2, so the two meals that answer *"which meals need better data?"* (ids 2151,
  2139) never reached the model. A view fixes a *known regressed question*.
- **Shape:** either a `ContextViewSpec` that collapses the registry to a compact reference
  summary (counts + a bounded, intent-relevant sample) rather than 40 groups of rows, **or** a
  resolver change that does not route the whole registry into a per-meal question. The engine
  cannot know a registry dump is reference rather than evidence — only a declared view can.

### Priority 2 — `meals:read` · **HIGH**

Largest generic surface after profile (24 turns, 32,511 chars, only −25% under generic) and the
highest turn-count leverage on the platform.

- **Benchmark impact:** the meal-quality question class (**CB-017** "least processed / whole-food
  based"; **CB-022** "need better data") depends on the model seeing `mealSourceType`,
  `ingredientCount` and nutrition fields *first*, not buried. A view pinning those would both cut
  the largest still-uncompressed section and raise `entityRefs` on the CB-0xx block.
- **Shape:** pin `id`/`name`/`mealSourceType`/`ingredientCount`/nutrition; group by
  `mealSourceType`; keep the capability's own top item as each group's representative (the
  CB-017 lesson, INT17 §5.1).

### Priority 3 — `analyser:read` · **HIGH**

15 groups, `MAX_GROUPS_SHOWN` seats 8; generic compressed it just **−2%** — the least-compressed
capability on the platform.

- **Benchmark impact:** 6 turns; the additives/UPF question class. A view that summarises the
  additive/UPF groups (kept fields + counts) instead of seating 8 raw groups recovers core budget
  and lets more of the *analysis* — not the raw group rows — reach the model.
- **Shape:** a `ContextViewSpec` with a `collections` entry that keeps the verdict-bearing fields
  and declares the rest by count. Same class of fix as Priority 1, smaller blast radius.

### Priority 4 — Enrichment · **MEDIUM (not a capability, but owed a view)**

Enrichment is free text, budgeted last, and **starved**: it reached the model on only 20 of the
56 turns that previously carried it, because the guaranteed core alone exceeds the 600-token
(≈2,100-char) global budget on 47/88 turns (INT18 §6.1).

- **Benchmark impact:** no measured score cost, but a silent reduction in what the model is shown —
  the exact class of thing the engine exists to make explicit. The WEAVE ENRICHMENTS prompt rule
  has nothing to weave on two-thirds of enrichment turns.
- **Shape:** give enrichment a **reserved floor**, or make it a Context View so it can be *ranked*
  against evidence rather than truncated by arrival order. **Raising the global budget is a named
  hard stop** (architecture §7) and is not the fix.

### Priority 5 — `pantry:read`, `shopping:read`, `household:read` · **LOW**

Generic derivation is fit for purpose (−12% / −19% / cosmetic +21%). No documented failure. Give
these native views only after Priorities 1–4, and only if a specific question regresses.

### Explicitly out of scope for the rollout

- The **12 misroutes** capping IRA at 0.852 are a **resolver** concern, not a Context View one.
  The engine composes what routing hands it; it cannot fix a wrong route. Named here so the
  rollout is not mistaken for the path to 90% IRA.
- The **judge tier is hardcoded off** (INTA1 §6.4): 68 of 100 weight points are deterministic
  proxies, so every quality number here is a lower bound. A native-view rollout should be
  re-measured with the judge on before its answer-quality effect can be claimed.
- `CHARS_PER_TOKEN = 3.5` remains an estimator (~5% conservative, up to ~4% dense-block overrun).
  Bounded and carried forward from INT17 §7 / INT18 §7; not a rollout item.

---

## 5. Definition of Done

| Requirement | Status | Evidence |
|---|---|---|
| Commit completed | ✅ | `cb314cc` (BENCH4 routing) + `e65bc1f` (engine, no business logic); tree clean afterwards |
| New benchmark baseline recorded | ✅ | §2 — **n=3 median 76.1, spread 0.3**, tagged `__e65bc1f`, reproduces from HEAD; discharges INT17/INT18 §7 "baseline is n=1" |
| Capability rollout plan produced | ✅ | §3 audit (23 capabilities: 2 native / generic / none) + §4 priority-ranked native-view rollout |
| No business logic changes | ✅ | engine commit `e65bc1f` touches 0 capability/handler/port/binding/registry lines; BENCH4's routing landed separately in `cb314cc` |
| Rollback confirmed before changes | ✅ | §0 — `int19-rollback-20260708` → `fb2f188` (tracked + untracked), real index verified untouched; `int17`/`int18` tags re-verified |
| Measurement harness preserved | ✅ | `server/tests/benchmark/context-composition-verification/` — closes INT18 §3's lost-harness gap |

**The rollout plan is a prioritisation over a complete audit, not a wish-list: every one of the
23 registered capabilities is classified, the two documented failure modes (CB-022, analyser)
anchor the top two priorities, and every candidate is a pure move across a seam that changes no
business logic — the same discipline that let the engine itself ship without touching a single
capability.**
