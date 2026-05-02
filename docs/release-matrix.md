# The Healthy Apples — Release Matrix

## Purpose

This matrix defines **when and how changes can be released to production**, based on:

* **Risk** (technical / data / AI impact)
* **User Impact** (visibility / UX change)

This ensures:

* consistent release decisions
* protection of user trust
* controlled production behaviour

---

## Risk Definitions

* 🟢 **LOW RISK**
  UI, text, display-only changes
  No logic, data, or system behaviour impact

* 🟡 **MEDIUM RISK**
  Behaviour, UX, state handling
  No schema or data integrity risk

* 🔴 **HIGH RISK**
  Data, schema, AI matching, pricing, persistence, production-critical logic

---

## Impact Definitions

* **LOW IMPACT**
  User is unlikely to notice

* **MEDIUM IMPACT**
  Noticeable but not disruptive

* **HIGH IMPACT**
  Core experience change or highly visible

---

## Release Matrix

| Risk      | Impact | Timing             | Requirements                               | Notes                    |
| --------- | ------ | ------------------ | ------------------------------------------ | ------------------------ |
| 🟢 Low    | Low    | Batched release    | Minimal verification                       | Reduce change fatigue    |
| 🟢 Low    | Medium | Anytime            | Standard verification                      | UI improvements          |
| 🟢 Low    | High   | Anytime            | Standard verification                      | Visible but safe         |
| 🟡 Medium | Low    | Anytime            | Full verification                          | Behaviour change         |
| 🟡 Medium | Medium | Anytime            | Full verification                          | Monitor after release    |
| 🟡 Medium | High   | Flexible timing    | Full verification + monitoring             | UX-heavy changes         |
| 🔴 High   | Low    | Low-traffic window | Full verification + rollback plan          | System/data changes      |
| 🔴 High   | Medium | Low-traffic window | Full verification + rollback plan          | Careful monitoring       |
| 🔴 High   | High   | STRICT window only | Full verification + rollback + manual test | Block if ANY uncertainty |

---

## Critical Hotfix Override

This overrides timing rules ONLY when:

* the app is broken
* users are blocked
* data is incorrect
* trust is at risk

### Must still:

* perform minimum verification
* define rollback plan
* monitor immediately after deploy
* document reason

### Never allowed:

* skipping verification
* unclear changes
* non-critical improvements

---

## Core Rule

If behaviour is not explicitly verified → **DO NOT RELEASE**


## Prompt Constraint Alignment

All changes are issued to Claude using short, scoped prompts.

Implication:
- Each change is isolated
- Risk must be evaluated per change
- No bundled changes are permitted

If multiple risks are present:
→ they must be split into separate decisions
