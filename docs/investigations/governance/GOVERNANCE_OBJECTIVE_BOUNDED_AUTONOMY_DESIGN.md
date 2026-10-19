# Governance Evolution: Objective-Bounded Autonomy — Design Recommendation

**Date:** 2026-08-27
**Status:** RECOMMENDATION ONLY — NOT APPROVED, NOT IMPLEMENTED
**Author:** Claude (delegated investigation, requested by Colin)
**Risk:** 🔴 RED by classification (this document proposes changing execution-governance mechanics: Gate 8, Gate 9, the decision schema, and `PROJECT_GOVERNANCE.md`), but **this document itself makes no code or governance change**. It is investigation and design only.

This document does not modify `PROJECT_GOVERNANCE.md`, Gate 8, Gate 9, or the decision schema. No implementation may begin from this document without a separate, explicit Governance Owner approval, per the existing root-governance and delegation-gate rules it is analysing.

---

## 1. Why this document exists

During THA Executor work, a recurring pattern has slowed delegated agents without adding real safety:

> approved objective → execution discovers an infrastructure defect → agent stops → new investigation → new decision → new approval → execution → next closely related defect → stop again

The clearest evidence this pattern is real and structurally forced (not just habit) is `PROJECT_GOVERNANCE.md`'s own history: it now contains **five** near-identical hand-drafted "temporary bootstrap appointment" sections (root-binding, repeat-bootstrap ratification, current-decision-owner, Gate 8 dependency-free verifier, bridge governance-pipeline — lines 74–241), each independently re-deriving the same shape: role ID, reason, exact permitted files, prohibited scope, verification matrix, auto-termination, zero residual authority. That repetition is the friction pattern, captured in governance prose.

The goal, per Colin's brief: move from **approval per defect/change** to **approval per bounded objective**, without weakening genuine protections. This document inspects the live mechanism and proposes the smallest coherent change that achieves that.

---

## 2. What was inspected (live architecture)

- `PROJECT_GOVERNANCE.md` (this repo, read in full — root governance, execution delegation, bootstrap appointments, mandatory bootstrap, delegation gate, verification gate)
- `docs/change-control.md`, `docs/architecture/ENGINEERING_WORKFLOW.md` (this repo)
- `docs/ai-operating-model/` (this repo, untracked — `risk-and-approval.md`, `task-prompt-template.md`, and siblings)
- Bridge repo `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge`: `server.gate9.mjs`, `gate8-execute-approved-decision.mjs`, `decision-factory.mjs`, `governed-root-paths.mjs`, `gate8-repair-loop.mjs`, `gate9-lifecycle.mjs`, sample `gate63-*-manifest.json`/`-receipt.json` pairs, the `executions/` ledger, and the bridge repo's own `docs/implementation/` and `docs/investigations/governance/` reports.

### 2.1 How the live pipeline actually works

- **Gate 9** (`server.gate9.mjs`) is a validating gateway, not an executor. On every request it re-derives validity from disk: re-hashes the decision and receipt against `gate9-current-decision.json`, re-checks live git branch/HEAD/status fingerprint against what the decision recorded, re-verifies every protected dirty-pre-state baseline file byte-for-byte, and cross-checks an approval hash chain (`approvedDecisionSha256` vs `originalDecisionSha256`). It trusts nothing carried over from a prior check.
- **Gate 8** (`gate8-execute-approved-decision.mjs`) is the execution engine, only invocable as a Gate-9-spawned subprocess with an active execution-ledger record. It creates an isolated disposable git worktree, runs the AI worker bounded strictly to `decision.scope[]`, runs deterministic verification (typecheck/build/contract tests), then calls **Hermes** — an independent, read-only AI verifier given the diff and told explicitly not to implement anything — and only copies scope files back into the live repo after Hermes returns `VERDICT: PASS`, `SCOPE_COMPLIANT: YES`, `CONTRACTS_PRESERVED: YES`. Any file touched outside the literal `scope[]` list throws immediately (`unexpected.length` check) and the run rolls back.
- **Rollback** is captured before any implementation begins: `decision-factory.mjs` snapshots every currently-dirty file byte-for-byte into a temp package, hashes it, and verifies the copy. Gate 8 restores from this baseline on any failure, in a `finally` block, unconditionally.
- **Gate 8 structurally cannot commit, push, deploy, or migrate** — `safety.commitCreated/pushed/deployed` are hardcoded `false` in its final report. Irreversible/production actions are already outside its reach entirely, regardless of any risk-tier change.
- **The decision schema already carries a `risk` field** (free string, e.g. `'RED'`/`'AMBER'`) — but grep across `decision-factory.mjs`, `server.gate9.mjs`, and `gate8-execute-approved-decision.mjs` finds exactly one reference to it (`server.gate9.mjs:708`), a passthrough into a status-display object. **Nothing branches on it.** A Green-tier doc change and a Red-tier schema change go through mechanically identical gate rigor today.
- **A full Green/Amber/Red taxonomy already exists** — `docs/ai-operating-model/risk-and-approval.md` — but only as a human-facing prompting convention read by delegated agents when planning work. It is not wired to Gate 8/Gate 9 at all.
- **`scope[]` is a static file list frozen at decision-creation time.** There is no concept in the schema or the gates of a scope *family*, an owner boundary, or a risk ceiling — only an exact list of paths. This is the direct cause of the stop-on-every-defect pattern: the moment execution needs to touch a file not on that exact list, Gate 8 fails closed, however closely related the file is.
- **No bootstrap-operator mechanism exists in code anywhere.** Grep across the entire bridge repo (`.mjs` and `docs/`) for `BOOTSTRAP_OPERATOR` returns zero matches. Every one of the five appointments in `PROJECT_GOVERNANCE.md` is a bespoke, hand-drafted, one-off decision expressed in prose, not an instance of a reusable, code-enforced role — despite all five sharing an identical shape.
- **`decision-factory.mjs` already generalises "the hand-rolled pattern used by every `prepare-*-decision.mjs` script"** into one reusable capture-rollback → write-decision → bind-current capability (its own header comment). The project has already done this kind of consolidation once, for decision creation; it has not yet done it for scope admission or for bootstrap appointment.

### 2.2 What this means for the design

The fail-closed machinery — root allowlist, hash/fingerprint re-derivation, isolated worktree, byte-for-byte rollback, independent Hermes verification, structural inability to commit/push/deploy/migrate — is sound and should not be touched. The friction is not caused by too much verification; it is caused by **scope being defined too narrowly and statically**, and by **risk being captured but not enforced**. Both are additive gaps, not structural flaws — which means the fix can be additive too.

---

## 3. CURRENT_FRICTION

- `scope[]` is an exact static list; any file outside it is a hard stop, even a directly-necessary sibling file within the same objective, owner, and risk class.
- `risk` is captured on every decision but never enforced — there is no way to say "anything AMBER-or-below in this family is pre-cleared," so every newly discovered AMBER-risk defect gets RED-level friction (one approval cycle each).
- No mechanism distinguishes "genuinely new risk" from "another instance of the already-approved risk" — every discovery restarts investigation → decision → approval → execution from zero, including a fresh rollback baseline and a fresh Hermes review of a fragment instead of the whole coherent change.
- Bootstrap/self-repair authority for the bridge/executor is re-derived in constitutional prose every time (five near-identical appointments now on file), each requiring the same manual reasoning about permitted files, prohibited scope, and a verification matrix that is structurally the same shape every time.
- Each new approval cycle for a related defect is effectively a fresh investigation, re-deriving context (governing docs, current state, prior findings) the previous execution already held — a real token/wall-clock cost, not just a UX annoyance.

## 4. PROTECTIONS_WORTH_KEEPING

- Gate 9's re-derivation of validity from disk on every request — no state is trusted merely because it was valid a moment ago.
- Gate 8's isolated worktree, with copy-back only after full deterministic + independent verification, and unconditional restore-from-baseline on any failure.
- Independent Hermes verification as the last gate before live copy-back — a second, non-implementing reviewer checking the diff against scope and required outcomes, with an explicit read-only instruction.
- The two-item governed-root allowlist and Gate 8's structural inability to commit, push, deploy, or migrate — already a hard boundary around irreversible/production action, independent of any risk-tier change.
- Fail-closed as the default outcome of anything malformed, unknown, mismatched, or unbound — this default must survive the change unweakened.

## 5. PROTECTIONS_CAUSING_UNNECESSARY_STOPS

- The *narrowness* of what counts as "in scope" (a static list, no notion of family) — not the fail-closed behaviour itself, which should remain the default for anything outside the (now wider) boundary.
- The fact that `risk` is visible on every decision but wired to nothing — a real signal is being thrown away.
- The requirement that every bootstrap-style self-repair be a bespoke constitutional appointment rather than a standing, narrowly bounded, auto-terminating objective class.

---

## 6. RECOMMENDED_GOVERNANCE_MODEL

Introduce two additive concepts into the decision schema and Gate 8/Gate 9, on top of the existing `scope[]`/`risk`/`rollbackGate`/`verificationGates[]` fields, none of which are removed or weakened:

1. **`scopeFamily`** — a bounded set of path patterns / owner domains (referencing the existing `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` where applicable) that a human approves once, wider than the literal `scope[]` captured at creation but still explicit and narrow. Example: today's live bridge-governance-pipeline appointment already states its family in prose — *"the following bridge/executor infrastructure repairs and their directly necessary focused regression tests/helpers"* naming two files plus "directly necessary" tests. `scopeFamily` makes that same sentence machine-checkable instead of self-reported.
2. **`riskCeiling`** — an enum (`GREEN`/`AMBER`/`RED`) that finally gives the existing `risk` field teeth: any newly discovered file admitted into scope must classify at or below the ceiling, checked against a canonical path→minimum-risk mapping the *decision cannot self-certify around* (e.g. anything under `shared/`, `server/db`, migrations, auth, or a canonical SoT file is always RED regardless of what the decision declares).

A decision approved with a `scopeFamily` and `riskCeiling` is an **objective**. Everything within the objective's family, owner, and ceiling proceeds under the AMBER model below without new approval. Everything outside it remains RED and stops, exactly as today.

This is a strict widening of what "in scope" means, gated by the same fail-closed mechanics that already exist — it is not a reduction of verification.

### RED_RULES

Human approval remains mandatory, structurally unchanged from today, for:
- Architecture/ownership changes; canonical-owner changes (checked against `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, not the decision's self-declared owner).
- Security/authentication boundaries.
- Destructive or irreversible operations — already structurally impossible inside Gate 8 (no commit/push/deploy/migrate), so this rule is already enforced; it only needs to be named explicitly as an escalation trigger (§8).
- Migrations with meaningful data risk; production-impacting changes.
- Any file whose canonical path pattern maps to RED in the fixed path→risk table, regardless of the objective's declared `riskCeiling`.
- Expansion beyond the approved `scopeFamily`, or a risk classification above the approved `riskCeiling`.
- Any change to `scopeFamily`, `riskCeiling`, or `verificationGates[]`/acceptance criteria after approval — these are part of what was approved and are bound into the same approval hash chain Gate 9 already enforces for the decision body; widening them silently mid-execution is treated exactly like tampering with the decision today.

### AMBER_RULES

Human approves the bounded objective once (`purpose`, `scopeFamily`, `riskCeiling`, `verificationGates[]`/acceptance criteria, rollback baseline — the same fields already required to create a decision today, plus the two new ones). After approval, within that single objective, Gate 8 may:
- Modify multiple files within the admitted `scopeFamily`.
- Auto-admit a newly discovered defect into scope when it is (a) within the approved `scopeFamily`, (b) owned by the same canonical owner as the approved objective, (c) at or below `riskCeiling` per the fixed path→risk table, and (d) still serves the approved `verificationGates[]`/acceptance criteria without changing them.
- Iterate implementation → deterministic verification → repair, bounded by the existing `MAX_IMPLEMENTATION_ATTEMPTS` plus a new `MAX_INHERITED_DEFECTS` ceiling on how many distinct newly discovered files a single objective may auto-admit before it must stop and report back regardless of family/ceiling fit (a hard cap against unbounded scope creep even within an approved family).
- Each admission is appended to a new `inheritedScopeLedger` on the execution record — file, matched family pattern, matched owner, computed risk, timestamp — so the eventual completion report shows exactly what was auto-admitted and why, without waiting for a human to ask.

No repeated human approval merely because another in-family, in-owner, in-ceiling defect is discovered.

### GREEN_RULES

Routine low-risk work (the existing informal `risk: 'GREEN'` class — docs/copy/visual-polish with no behavioural change) proceeds under the same rollback + deterministic verification + Hermes + audit-evidence machinery as today, but under a **standing pre-authorization** for a narrowly and explicitly defined class (e.g. content/documentation-only changes under `docs/`, no schema/behavioural/canonical-ownership change), so a human does not have to explicitly approve each individual Green decision. Any file outside that narrow class immediately reclassifies at AMBER or RED and requires the normal approval path — Green pre-authorization must not itself have a `scopeFamily` wide enough to reach code, schema, or canonical data.

---

## 7. OBJECTIVE_INHERITANCE_RECOMMENDED: yes

### OBJECTIVE_INHERITANCE_RULE

> A newly discovered defect required to complete an already-approved objective is automatically admitted into scope when, and only when, all of the following hold simultaneously:
> 1. The file is matched by the objective's approved `scopeFamily`.
> 2. The file's canonical owner (per `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, or the same repository-root/domain boundary already enforced by `governed-root-paths.mjs` where no registry entry applies) is identical to the approved objective's declared owner.
> 3. The file's classification in the fixed, decision-independent path→risk table is at or below the objective's approved `riskCeiling`.
> 4. Admitting the file does not require changing the objective's approved `verificationGates[]`/acceptance criteria — it serves the same, already-approved definition of done.
> 5. The objective has not exhausted `MAX_INHERITED_DEFECTS`.
>
> If any condition fails, admission is refused and the execution fails closed exactly as it does today: rollback restores from baseline, the run stops, and the failure — including which condition failed — is reported for a fresh, human-approved decision. Inheritance is opt-in per objective (`objectiveInheritance.enabled`); a decision that omits it, or any older decision predating this schema, behaves exactly as today (fail closed the moment any file leaves the literal `scope[]` list). This preserves full backward compatibility with every existing decision and appointment.

---

## 8. AUTONOMOUS_REPAIR_LOOP

This formalises what `gate8-repair-loop.mjs` and `MAX_IMPLEMENTATION_ATTEMPTS` already do for a single decision's own scope, and extends it across objective-inheritance admissions:

- Within an approved objective, Gate 8 loops: implement → deterministic verification (typecheck/build/contract tests) → repair, up to `MAX_IMPLEMENTATION_ATTEMPTS` per admitted file.
- When a newly discovered defect blocks progress toward the objective's acceptance criteria, the objective-inheritance predicate (§7) runs before any implementation touches it. On admission, the file's dirty pre-state is captured and byte-verified **at the moment of admission** (not only at decision creation), so rollback protection is never weaker for an inherited file than for an originally scoped one.
- The loop continues, potentially across several admitted files, until the objective's `verificationGates[]`/acceptance criteria pass as a whole, or `MAX_IMPLEMENTATION_ATTEMPTS`/`MAX_INHERITED_DEFECTS` is exhausted, or an escalation trigger (§9) fires.
- Independent Hermes verification runs once against the **whole accumulated diff** for the objective before any copy-back — arguably a strengthening versus today's per-fragment review, since Hermes sees one coherent change instead of four disconnected ones.

## 9. ESCALATION_TRIGGERS

An agent working under an approved objective stops and returns to the Governance Owner when:

| Trigger | How it is detected mechanically |
|---|---|
| Canonical owner changes | File's SoT-register owner ≠ objective's declared owner |
| Scope crosses into another protected domain | File not matched by approved `scopeFamily` |
| Risk exceeds the approved ceiling | Fixed path→risk table classifies the file above `riskCeiling` |
| Destructive operation becomes necessary | Any need for commit/push/deploy/migrate — already structurally outside Gate 8's capability; the run stops rather than attempting it |
| Security boundary changes | File matches the auth/security path class — always RED in the fixed table, never admissible regardless of ceiling |
| Application/product scope introduced unexpectedly | Repository-root mismatch, or domain mismatch against the SoT register, for a bridge/executor-maintenance-class objective (§10) |
| Acceptance criteria themselves need changing | Gate 8 concludes the approved `verificationGates[]` cannot be satisfied as stated (not merely "not yet satisfied") |
| Safe implementation cannot be determined | `MAX_IMPLEMENTATION_ATTEMPTS` exhausted without a Hermes PASS — existing behaviour, now named as an explicit escalation category rather than an undifferentiated failure |
| `MAX_INHERITED_DEFECTS` reached | Hard cap on auto-admission count, independent of how well each individual defect fits the family — a backstop against runaway scope even when every single admission was individually correct |

Every trigger above resolves to the same fail-closed action already implemented today: rollback restores baseline, the run stops, and a fresh, human-approved decision is required. Nothing here introduces a new failure mode — it names and routes the existing one more precisely.

---

## 10. EXECUTOR_MAINTENANCE_MODEL

The five hand-drafted bootstrap appointments in `PROJECT_GOVERNANCE.md` are, structurally, the same objective-inheritance pattern applied to Gate 8/Gate 9's own infrastructure, reinvented in prose each time because no standing mechanism exists. Recommendation: introduce one standing, code-enforced objective class — `EXECUTOR_MAINTENANCE_OBJECTIVE` — instead of drafting a new constitutional appointment section per incident.

- **Fixed, hardcoded `scopeFamily`:** Gate 8/Gate 9/executor infrastructure files only (e.g. `server.gate9.mjs`, `gate8-execute-approved-decision.mjs`, `gate8-repair-loop.mjs`, `governed-root-paths.mjs`, `decision-factory.mjs`, and their directly necessary regression tests/helpers) — this family is set once, by joint Governance Owner ratification, and is **never** itself widened by an executor-maintenance objective. It structurally cannot reach product/application code, Cookbook, Pantry, Planner, or Hermes installation, mirroring what every one of the five historical appointments already declared prohibited by hand.
- **`riskCeiling` fixed at AMBER.** Any file in the family that the path→risk table classifies RED (e.g. anything touching security/auth/production data, even inside the bridge repo) is never inheritable under this objective class — it always requires a fresh, explicitly reasoned RED decision, exactly as the existing ratified repeat-bootstrap amendment already requires ("only when Gate 9 cannot execute the change required to restore its own governed capability").
- **Standing but always re-verified and always auto-terminating.** Each activation still requires: an explicit circular-self-repair reason (Gate 9 cannot execute the fix because it needs the fix), a fresh rollback/pre-state package, an explicit verification matrix, and automatic termination — with zero residual authority — the instant that matrix passes. This is identical to today's appointments; the only change is that the *shape* is defined once in code/governance rather than re-drafted in prose each time, and repeat activations are logged as instances of one role rather than as five separate constitutional sections.
- **Does not become a general bypass** because: the family never includes product code; the ceiling never reaches RED; every activation still produces the same rollback/evidence/verification-matrix artifacts as today; and crossing into application scope is, by definition, outside the family and therefore an immediate escalation trigger (§9), routed to a normal human-approved RED decision.

---

## 11. GATE8_CHANGES_REQUIRED

- Replace the current "any file outside `scope[]` → throw" check with: match against `scope[]` (unchanged, still auto-admitted) **or** the objective-inheritance predicate (§7) when `objectiveInheritance.enabled === true`; otherwise throw exactly as today. Decisions without the new fields behave identically to the current implementation — no regression for any existing/historical decision.
- Capture and byte-verify the dirty pre-state of a file **at the moment it is admitted via inheritance**, not only for files present in `scope[]` at decision creation — rollback coverage must never be narrower for an inherited file.
- Add the fixed, decision-independent path→minimum-risk table (owned centrally, not per-decision) that `riskCeiling` checks against, so risk classification cannot be self-certified around.
- Extend `gate8-repair-loop.mjs` to bound total auto-admissions via `MAX_INHERITED_DEFECTS`, in addition to the existing `MAX_IMPLEMENTATION_ATTEMPTS` per-file bound.
- Append every admission event to a new `inheritedScopeLedger` on the execution record, surfaced in the final report (`gate8-last-execution.json`) alongside `applied[]`.
- Run Hermes once against the full accumulated diff for the objective, not per-admission (already how it works for a single decision's `scope[]`; this just confirms it holds when scope grows during execution).

## 12. GATE9_CHANGES_REQUIRED

- Extend the approval hash chain to cover `scopeFamily`, `riskCeiling`, and `verificationGates[]`/acceptance criteria — these are part of what a human approves, and must be exactly as immutable post-approval as the rest of the decision body is today. Any attempt to widen them after approval is a hash mismatch, handled identically to every other tampering case Gate 9 already fails closed on.
- Surface `scopeFamily`, `riskCeiling`, `objectiveInheritance`, and the live `inheritedScopeLedger` on `/v1/tha/current-decision`, so a human can see mid-flight what has been auto-admitted without waiting for the final report.
- Add a distinct, narrowly-typed decision variant/flag for `EXECUTOR_MAINTENANCE_OBJECTIVE` (§10) with its family hardcoded rather than decision-supplied, so it cannot be instantiated with a wider family than the one Governance Owners ratify.

## 13. DECISION_SCHEMA_CHANGES

Purely additive to `THA_IMPLEMENTATION_DECISION_V1` — no existing field removed or reinterpreted:

- `scopeFamily: string[]` — path patterns / owner-domain references, optional; absence = inheritance disabled.
- `riskCeiling: 'GREEN' | 'AMBER' | 'RED'` — optional; absence = inheritance disabled. (This finally gives the existing `risk` field an enforced sibling; `risk` itself continues to describe the objective as a whole.)
- `objectiveInheritance: { enabled: boolean, requiresOwnerMatch: boolean }` — explicit opt-in, defaults to `false`; lets a human deliberately keep any given decision single-shot even if a family/ceiling is declared.
- `inheritedScopeLedger: Array<{ file, matchedFamilyPattern, matchedOwner, computedRisk, admittedAt }>` — populated by Gate 8 during execution, never by the decision author.
- `maxInheritedDefects: number` — optional bound, defaults to a small conservative number (e.g. 5) when inheritance is enabled.

`verificationGates[]` (already in the schema) becomes the canonical carrier of acceptance criteria for the objective — no new field needed there; the change is that it now gates auto-admission decisions, not only final pass/fail.

## 14. GOVERNANCE_DOCUMENT_CHANGES

- `PROJECT_GOVERNANCE.md` gains one short "Objective-Bounded Autonomy" section, sitting beside the existing "Delegation gate" and "Verification gate" sections, stating the RED/AMBER/GREEN model, the objective-inheritance rule, and a reference to `docs/ai-operating-model/risk-and-approval.md` as the single owner of the Green/Amber/Red taxonomy definition — rather than restating it a second time (this itself follows the project's own Architecture Compliance Checklist rule, "one owner per fact").
- The five existing bootstrap-appointment sections are left as an immutable historical record (per the existing "historical decisions remain immutable" rule) and are **not rewritten**. Only new self-repair episodes going forward use the standing `EXECUTOR_MAINTENANCE_OBJECTIVE` class described in §10, replacing the "draft a new appointment section" habit for that narrow, recurring situation.
- `docs/ai-operating-model/risk-and-approval.md` gains a short addition naming `scopeFamily` and `riskCeiling` as the machine-enforced counterparts of the existing human-facing Green/Amber/Red language, so the one taxonomy has one human-facing description and one machine-enforced implementation, explicitly linked.

## 15. TESTS_REQUIRED

Mirroring the existing `test-gate8-repair-loop.mjs` / `test-gate8-verification-scope.mjs` style:

- Inheritance admits an in-family, in-owner, at-or-below-ceiling defect; ledger entry recorded with correct matched pattern/owner/risk.
- Inheritance refuses: cross-family file, cross-owner file, over-ceiling file, and a file whose fix would require a destructive operation — all fail closed exactly as today's static-scope check does, with rollback restored.
- Approval hash chain rejects a decision whose `scopeFamily`/`riskCeiling`/`verificationGates[]` was mutated after approval (extends the existing hash-mismatch test class).
- Rollback restores byte-for-byte for a file admitted via inheritance mid-execution, not only for files present in `scope[]` at creation.
- `MAX_INHERITED_DEFECTS` bound is enforced and reported as a distinct stop reason.
- A decision with no `scopeFamily`/`riskCeiling`/`objectiveInheritance` fields (i.e. every existing historical decision) behaves byte-for-byte identically to current Gate 8 behaviour — regression proof of full backward compatibility.
- `EXECUTOR_MAINTENANCE_OBJECTIVE` cannot be instantiated with a family reaching outside the hardcoded bridge/executor set, and auto-terminates with zero residual authority the instant its verification matrix passes (consolidating what five separate hand-written appointment verification matrices currently prove individually).
- Replay of at least one real historical multi-defect objective (e.g. the current bridge-governance-pipeline appointment's four-file repair) against the new mechanism, confirming it would have resolved in one objective instead of several.

---

## 16. SECURITY_RISKS

- **Scope creep disguised as "same family."** Mitigated by keeping `scopeFamily` narrow and, where possible, tied to the canonical SoT-register owner rather than a loose path glob; by capping total admissions via `MAX_INHERITED_DEFECTS`; and by making the ledger visible in the live decision status, not only the final report.
- **Risk-ceiling gaming** (declaring an artificially high ceiling to admit more). Mitigated by the path→risk table being fixed and decision-independent — a decision cannot self-certify its way past it — and by security/auth/production-data paths being structurally RED in that table regardless of any declared ceiling.
- **Silent redefinition of "done" to escape a stop condition.** Mitigated by locking `verificationGates[]` into the same approval hash chain as the rest of the decision; an in-flight agent cannot loosen its own acceptance test to route around an escalation trigger.
- **Bootstrap-role reuse becoming a general bypass.** Mitigated by hardcoding the `EXECUTOR_MAINTENANCE_OBJECTIVE` family at the code level (not decision-supplied) and fixing its ceiling at AMBER — it can never be instantiated wide enough to reach product code or RED-classified paths.
- **This document's own recommendations, once implemented, are themselves RED work** — they touch Gate 8, Gate 9, the decision schema, and root governance text. They must go through a single, explicit, human-approved RED decision before any code changes, per §17.

## 17. FAIL_CLOSED_BOUNDARIES

All of the following must terminate the run, restore rollback, and require a fresh human-approved decision — none of these are weakened by this proposal:

- File outside `scopeFamily`.
- Owner mismatch against the SoT register.
- Risk above `riskCeiling` per the fixed table.
- A destructive operation (commit/push/deploy/migrate) becomes necessary — structurally impossible for Gate 8 today; stays impossible.
- Acceptance criteria (`verificationGates[]`) cannot be satisfied as approved, or would need to change.
- Hermes returns anything other than `PASS`/`SCOPE_COMPLIANT: YES`/`CONTRACTS_PRESERVED: YES` (unchanged from today).
- `MAX_IMPLEMENTATION_ATTEMPTS` or the new `MAX_INHERITED_DEFECTS` exhausted.
- Approval-hash mismatch on any part of the decision body, including the new `scopeFamily`/`riskCeiling`/`verificationGates[]` fields.
- Malformed, unknown, mixed-root, or missing schema fields — unchanged fail-closed default.

---

## 18. MIGRATION_PATH

1. Governance Owners ratify the RED/AMBER/GREEN model and the objective-inheritance rule at the governance-document level (§14) — a text-only, joint-flavored change, no code yet.
2. Add the new decision-schema fields additively; confirm every existing/historical decision (lacking the new fields) continues to behave byte-for-byte as today — this is a pure regression guarantee, not a new capability yet.
3. Implement the Gate 8 admission predicate and rollback-capture-on-admission behind `objectiveInheritance.enabled`, defaulting to `false` for all new decisions.
4. Build and pass the full regression suite (§15), including the historical-replay test.
5. Pilot on one real bounded AMBER objective with inheritance explicitly enabled and the ledger visible live, human watching.
6. Only after a clean pilot, stand up `EXECUTOR_MAINTENANCE_OBJECTIVE` (§10) and retire the "draft a new constitutional appointment" habit for that narrow, recurring class — the five existing appointments remain untouched historical record.
7. Once confidence is established, consider defaulting `objectiveInheritance.enabled` to `true` for new AMBER-classified objectives; consider the GREEN standing pre-authorization class last, since it is the lowest-value, lowest-risk piece and least urgent.

Steps 2 onward are implementation and require their own RED decision, rollback identifier, deterministic verification, and Hermes review — the same machinery this document proposes to extend, applied to itself.

---

## 19. MOST_IMPORTANTLY — how this would feel, and a concrete comparison

**How it would feel to you as Governance Owner:** instead of being pulled back in every 10–20 minutes to approve "one more closely related file," you approve once, at the start, with a slightly wider but still explicit and bounded declaration — the same kind of sentence you already write by hand in a bootstrap appointment today, just made machine-checkable. You are then only interrupted when something genuinely outside that box happens: a different domain, a schema or security change, something destructive, or the agent itself concluding it can't safely proceed. When the objective finishes, you get one denser completion report with a visible ledger of everything that was auto-admitted and why — instead of a scattered trail of near-identical appointment sections you have to read, reason about, and re-approve one at a time.

**Concrete example — an objective that encounters 4 related defects:**

*CURRENT workflow:*
1. Approve objective A ("restore Gate 8 → Gate 9 path"). Decision created, `scope = [gate9-live-status-check.mjs]`. Approved. Gate 8 executes, discovers defect B in `gate8-execute-approved-decision.mjs` (outside `scope[]`) → throws, rolls back, stops.
2. Fresh investigation into B; a new decision (or, historically, a new hand-drafted bootstrap appointment) is written, reasoned about, and approved. Gate 8 executes B, discovers defect C in a helper test file → throws again, rolls back, stops.
3. Fresh investigation into C; new decision/appointment drafted and approved. Gate 8 executes C, discovers defect D (a needed regression test) → throws again, rolls back, stops.
4. Fresh investigation into D; new decision/appointment drafted and approved. Gate 8 executes D. Verification matrix finally passes.

Net: 4 separate approval cycles, 4 separate rollback baselines, 4 separate investigation write-ups, 4 fragments independently reviewed by Hermes, and — as literally seen in `PROJECT_GOVERNANCE.md` today — up to 4 near-identical hand-drafted constitutional sections reasoning through the same permitted-files/prohibited-scope/verification-matrix shape each time.

*PROPOSED workflow, same 4 defects:*
1. Approve ONE objective: `purpose = "restore Gate 8 → Gate 9 path"`, `scopeFamily = [gate9-live-status-check.mjs, gate8-execute-approved-decision.mjs, "directly necessary regression tests/helpers for these two files"]` (this is, almost verbatim, how the live 2026-08-27 bootstrap appointment is already worded — the proposal just makes that existing sentence enforceable), `riskCeiling = AMBER`, `verificationGates[]` = the same verification matrix already written for that appointment.
2. Gate 8 executes, hits defect B (in-family, same owner, AMBER) → auto-admitted, rollback baseline captured for it, ledger entry recorded, execution continues. Hits C (in-family test helper) → auto-admitted, continues. Hits D (in-family regression test) → auto-admitted, continues.
3. Verification matrix passes across the accumulated change. Hermes reviews the whole coherent diff once. Copy-back happens once.
4. You receive one completion report: one rollback identifier, one Hermes verdict, and a ledger showing exactly which 3 files were auto-admitted, matched against which family pattern and owner, at what computed risk.

Net: 1 approval cycle instead of 4, the same rollback/verification/Hermes rigor applied to the whole change rather than four disconnected fragments, and no new appointment section added to `PROJECT_GOVERNANCE.md`.

---

## Data Impact
- Reads existing data: NO
- Writes new data: NO
- Changes meaning of existing data: NO
- Requires backfill: NO

(This document is investigation and design only; it makes no code, schema, or governance change.)

## Trust Check
- Could this mislead the user? No — every claim above is grounded in a specific file/line cited during investigation (§2), and this document is explicitly labeled RECOMMENDATION ONLY, not an approved change.
- Could this fabricate certainty? The one uncertain area is the exact shape of `gate9-execution-runner.mjs` and the full `approve-*-decision.mjs` scripts, which were not read in full during this investigation (noted as such in the underlying research) — the recommendations do not depend on their internals beyond what Gate 9's own validation already re-derives.
- Is anything guessed but shown as real? No.
- What happens if the system is wrong? Nothing — no code changes were made. If this design is wrong, the cost is a discarded document.

## Outcome
Design recommendation produced. No governance, schema, Gate 8, or Gate 9 change has been made. Awaiting Governance Owner review and, if approved, a separate RED implementation decision covering §11–§15 before any code is touched.

## Next Steps
1. Colin (and, for anything touching the root-of-trust framing in §14, jointly with Lindsay per the existing joint-approval-only clauses) reviews this document.
2. If approved in principle, the migration path in §18 becomes its own governed objective — starting with the governance-document ratification in step 1, which is text-only and does not itself require Gate 8/Gate 9 changes.
3. Implementation of §11–§15 (Gate 8, Gate 9, and schema changes) requires its own explicit RED decision, rollback identifier, deterministic verification, and Hermes review, per the existing mandatory bootstrap in `PROJECT_GOVERNANCE.md`.
