# ENGINT1-FIX1 — Engineering Boundary Restoration

**Date:** 2026-07-18
**Branch:** int1-intelligence-platform
**Risk:** 🟢 GREEN
**Reason:** Retracts one knowledge source from a read-only, never-deployed developer capability; removes no household-facing behaviour, no schema, no route, no owner.

**`.engineering/scripts/session-verify.sh` has been red since `bc360ba5` (ENGINT1), and both ENGINT1 and ENGINT2 shipped claiming verified-clean status. ENGINT1 registered `.engineering/protocols` as an Intelligence Platform source root, which `ENGINEERING_BOUNDARIES.md:29` forbids in terms — `.engineering/` must never "integrate with the Intelligence Platform." Neither the standard nor the checker was amended, and neither report mentions it. This change retracts the source, and the verifier is green for the first time since. The finding that makes it more than housekeeping: `.engineering/` is not an input to `script/build.ts`, so in any deployed artefact that directory does not exist — the capability was reading four documents that are structurally absent from production, and its "796 documents indexed" was reachable only from a source checkout.**

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/ENGINT1-FIX1-boundary-restoration-20260718` → `729dcb9150a795ff5bfbe0ad955c14ad67d39c2c` |
| Working tree | **Intentionally dirty — 233 uncommitted changes (70 modified, 8 deleted, 155 untracked) authored by others.** The tag captures committed state only and does **not** cover any of it. None was touched, staged, or committed by this work. |
| This task's writes | `server/services/engineering-knowledge-registry.ts`, `server/intelligence/handlers/engineering-knowledge-read-handler.ts`, this report, the session run file, `CURRENT.md` |
| Rollback to committed state | `git checkout rollback/ENGINT1-FIX1-boundary-restoration-20260718` |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `.engineering/OPERATING_MANUAL.md`
- [x] `.engineering/standards/ENGINEERING_BOUNDARIES.md`
- [x] `.engineering/protocols/PRE_DEPLOYMENT_VERIFICATION_GATE.md`
- [x] `docs/implementation/engineering/ENGINT1_ENGINEERING_INTELLIGENCE_FOUNDATION.md`

---

## THE DEFECT

### What was breached

`ENGINEERING_BOUNDARIES.md` §2 states `.engineering/` must never:

> - integrate with the Intelligence Platform.

and

> No file under `client/`, `server/`, or `shared/` may import from `.engineering/`.

`server/services/engineering-knowledge-registry.ts:90-95` declared `.engineering/protocols` as a **first-class `SourceRoot` with an owner string**, feeding the Intelligence Platform's `developer` capability. Three readings, two unambiguous:

| Reading | Verdict |
|---|---|
| "may not **import** from" — these were runtime path reads, not ESM imports | ⚠️ Narrowly arguable |
| "must never **integrate with the Intelligence Platform**" | ❌ Breached in terms |
| The enforced check, `session-verify.sh:43` (greps for the literal string) | ❌ Red |

### Attribution — evidenced, not assumed

| Question | Evidence |
|---|---|
| Was the boundary clean before ENGINT1? | Yes. `git grep .engineering 7bfad50c -- client server shared` → **empty** |
| Who introduced it? | `git log --diff-filter=A` → `bc360ba5` *"ENGINT1 — Engineering Intelligence Foundation"* |
| Was `ENGINEERING_BOUNDARIES.md` amended? | No — last touched by `HOUSE3`, long prior |
| Was `session-verify.sh` amended? | No — same |
| Did ENGINT1's report mention it? | **No.** Its only two "boundary" references are the *developer-plane* isolation (§7), a different boundary |

The breach was **silent, not decided**. Had the standard been consciously amended this would be a governance change; it was not.

### The consequence that makes it more than a lint failure

`.engineering/` is **not an input to `script/build.ts`** (verified: `grep -n engineering script/build.ts` → no match), and `ENGINEERING_BOUNDARIES.md:34-39` states this is structural, not incidental. Therefore **in any deployed artefact `.engineering/protocols/` does not exist**, and the registry's protocol source silently indexed **zero** documents there.

ENGINT1's report claims *"Indexes **796 documents**: 45 architecture · 1 roadmap · 420 investigations · 323 implementation reports · **4 protocols** · 3 release documents."* That figure was reachable **only from a source checkout**. The capability was quietly less complete when deployed than when tested — and, per the module's own honest-gap design, it had no way to say so.

---

## IMPLEMENTATION

Two files modified. No file created or deleted in the runtime application.

| File | Change |
|---|---|
| `server/services/engineering-knowledge-registry.ts` | Removed the `.engineering/protocols` `SourceRoot` (−6 lines). Removed `"protocol"` from the exported `EngineeringDocKind` union — it existed *solely* to classify that source and had no other producer. `classify()` now returns `… \| null` and its previously-dead `"protocol"` fallback returns `null`; `buildIndex()` skips an unclassifiable path rather than mislabelling it, matching the file's existing `continue` idiom at the `stat` failure one block above. |
| `server/intelligence/handlers/engineering-knowledge-read-handler.ts` | Removed `"protocol"` from `KINDS` — leaving it would let a caller filter on a kind nothing can produce and receive a silent empty, which is exactly what this capability's honest-gap contract forbids. Corrected the two user-facing gap strings that advertised `.engineering/protocols/` as searched; leaving them would tell a developer the platform read somewhere it did not. |

**`classify()`'s fallback was already dead before this change.** Every path reaching it originates from `SOURCE_ROOTS`, `SOURCE_FILES`, or `ROADMAP_PATH` (`buildIndex()` lines 326-331); the root-prefix loop already matched `.engineering/protocols`. Returning `null` rather than throwing keeps an unreachable branch from becoming a crash that fails the whole index build.

---

## VALIDATION PERFORMED

| Command | Result |
|---|---|
| `grep -rn "\.engineering" client/ server/ shared/` | **NONE** — the violating reference is gone |
| `.engineering/scripts/session-verify.sh` | **exit 0** — `PASS no client/server/shared reference to .engineering`. **Green for the first time since ENGINT1** |
| `npm run test:intelligence-engineering-knowledge-binding` | **ENGINT1: 34 passed, 0 failed** — exactly the pre-change baseline |
| `npm run test:intelligence-engineering-knowledge-graph` | **ENGINT2: 36 passed, 0 failed** — exactly the pre-change baseline |
| `grep -rn '"protocol"' server/ client/ shared/` | **NONE** — no dangling reference to the removed kind |
| `npm run build` | **Succeeded** (`dist/index.cjs`, 2438ms). 4 warnings, all pre-existing and in files not touched here |
| `npm run typecheck:ci` | **20 regressions — none introduced by this change** (see below) |

Index coverage after the change: `796 documents indexed: {"architecture":45,"roadmap":1,"investigation":420,"implementation":327,"release":3}` — the `protocol: 4` bucket is gone.

### Separating introduced failures from pre-existing ones

The typecheck gate is red. Per `VERIFICATION_STANDARD` and Operating Manual §6, this was resolved against the rollback tag in a temporary worktree rather than assumed:

| Tree | Regressions |
|---|---|
| Clean worktree at `rollback/ENGINT1-FIX1-boundary-restoration-20260718` (committed state, none of this work, none of the uncommitted work) | **29** |
| Working tree with this change | **20** |

**This change introduced zero typecheck regressions.** Corroborating: the 7 files carrying regressions — `pantry-intelligence-assembler.ts`, `test-cbk2-intelligent-cookbook.ts`, `test-intelligence-shopping-binding.ts`, `test-pantry1-intelligent-pantry.ts`, `test-plan2-planner-evolution.ts`, `publication-checks.ts`, `publication-register.ts` — include **neither** file modified here, and 6 of the 7 are unmodified committed files.

**Finding, reported not fixed: the committed state at `HEAD` already fails its own CI gate with 29 regressions.** Per `PRE_DEPLOYMENT_VERIFICATION_GATE.md` §3, `typecheck:ci` is inside the one required check, so a pull request from this branch would go red on causes that predate this work. That is out of scope here and is recorded as a Suggestion below.

---

## DATA IMPACT

- Reads existing data: **YES** — engineering documentation on the filesystem, read-only, now four documents fewer.
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**

No schema, migration, table, column, or route. No database is touched.

---

## TRUST CHECK

- **Could this mislead the user?** No — and it removes two strings that did. The gap messages previously named `.engineering/protocols/` among the places searched; the capability no longer reads it, so continuing to claim it would be a false statement about provenance in a capability whose entire contract is provenance.
- **Could this fabricate certainty?** No. It *removes* a fabrication path: `classify()` no longer assigns a kind by fallback, and an unclassifiable document is skipped rather than mislabelled.
- **Is anything guessed but shown as real?** No. The reported index count now reflects what is actually readable in every environment, not only in a source checkout.
- **What happens if the system is wrong?** The developer capability returns four fewer protocol documents and says so by omission from its declared sources. `.engineering/protocols/` remains fully readable by a human at its own path; nothing is deleted.
- No architectural duplication introduced: **YES (none)**
- No new source of truth created: **YES (none)** — one was *retracted*; `.engineering/protocols/` is again owned solely by Engineering Governance.
- No runtime behaviour altered beyond the retraction: **YES**
- Every "verified" claim backed by a command that ran: **YES**

---

## SCOPE LOCK

- **Implemented scope:** Retraction of `.engineering/protocols` as an Intelligence Platform source root, and the coherent removal of the `protocol` document kind that existed only to serve it, returning `session-verify.sh` to green.
- **Explicitly excluded scope:** The 29-regression typecheck baseline; the two pre-existing `repo-structure-verify.sh` FAILs; the ENGINT1 report's now-inaccurate "4 protocols" line; anything belonging to ENGAUTO1.

**SUGGESTIONS — not implemented, not approved:**

1. **The committed state fails its own CI gate (29 typecheck regressions at `HEAD`).** `typecheck:ci` sits inside the single required check, so any PR from this branch goes red for reasons unrelated to its content. Worth a dedicated workstream before the branch is proposed for merge.
2. **`ENGINT1_ENGINEERING_INTELLIGENCE_FOUNDATION.md` still states the index covers "4 protocols."** That is now false. It is a historical report, and this report corrects the record rather than editing it — but if that document is treated as live status anywhere, it needs the same correction ENGINT1 §DOC-4 applied elsewhere.
3. **If the developer capability genuinely should read engineering protocols, the honest route is to amend `ENGINEERING_BOUNDARIES.md` deliberately** — and to solve the production-absence problem, since `.engineering/` cannot ship. That is a governance decision, not an implementation one.
4. **`repo-structure-verify.sh` still fails on two pre-existing loose-file violations** in `docs/implementation/` and `docs/investigations/` — already recorded as an ENGINT1 suggestion and still open.

---

## OUTCOME

The `.engineering/` layer boundary holds again. `session-verify.sh` passes for the first time since `bc360ba5`, and the Intelligence Platform no longer reaches into Engineering Governance — a directory it structurally cannot reach in production anyway, which is the part that made this a correctness defect and not only a governance one. Both ENGINT suites are unchanged at 34/0 and 36/0, the build succeeds, and no typecheck regression was introduced. What is now true that was not true before: the developer capability's declared sources are the sources it can actually read **in every environment**, and the two places where it described its own provenance no longer name a directory it never opens.

## NEXT STEPS

- This work is **committed locally and not pushed**. Pushing requires explicit approval per `COMMIT_PUSH_DEPLOY_PROTOCOL.md`; deployment is a separate approval again and nothing here authorises one.
- **ENGAUTO1 — Engineering Automation** was the requested Phase 1 and is now unblocked: its subject is the engineering verification workflow, which could not be automated honestly while its own verifier was red.
- The 233 uncommitted changes authored by others remain untouched and unprotected by any tag.
