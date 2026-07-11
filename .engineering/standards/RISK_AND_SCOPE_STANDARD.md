# Risk and Scope Standard

**Status:** Canonical engineering standard. `EOM1` (2026-07-10).
**Invoked by:** [`../OPERATING_MANUAL.md`](../OPERATING_MANUAL.md) Step 5.

---

## 1. Risk rating

Every implementation declares one rating, with a one-sentence reason.

| Rating | Means | Examples |
|---|---|---|
| 🟢 **GREEN** | No runtime behaviour change. Reversible by a file move or revert. | Documentation, repository housekeeping, engineering tooling, comment edits |
| 🟡 **AMBER** | Runtime behaviour changes, but within one bounded surface, with no schema or ownership change. | A new UI state, a new read-only capability binding |
| 🔴 **RED** | Architectural: changes a schema, a source of truth, an owner of a fact, or a cross-domain contract. | New table, new store, retiring a store, changing a canonical owner |

**RED implementations must additionally report Architecture Convergence Status**
(see `docs/architecture/ENGINEERING_WORKFLOW.md` STEP 8). Convergence percentages
must be evidence-based — count the duplicates. If you cannot count them, write
"Unknown — requires audit" rather than guessing.

Rating up is cheap; rating down is how incidents happen. When torn between AMBER
and RED, choose RED.

## 2. Scope lock

Every implementation declares, before it starts:

- **Implemented scope** — what is being done.
- **Explicitly excluded scope** — what is *not* being done, named. "Everything
  else" is not an exclusion.
- **Suggestions** — anything useful observed outside scope. **Record it; do not
  implement it.**

Scope lock is what makes a diff reviewable. A change that quietly fixes an
unrelated bug is harder to trust than one that reports the bug and leaves it.

### Out-of-scope discoveries

When you find something broken outside your scope:

1. Do not fix it silently.
2. Record it as a Suggestion in the report, with evidence.
3. If it blocks the declared scope, **stop and report** rather than expanding.

The exception: a defect *introduced by this work*. That is in scope by
definition, and must be fixed and disclosed.

## 3. Trust check

Before declaring done, answer each explicitly:

- Could this mislead the user?
- Could this fabricate certainty?
- Is anything guessed but presented as real?
- What happens if the system is wrong?
- No architectural duplication introduced: YES / NO
- No new source of truth created: YES / NO
- No runtime behaviour altered (for governance-only work): YES / NO

And for the report itself:

- Is every "verified" claim backed by a command that actually ran?
- Are failures I introduced distinguished from failures that already existed?
- Are the things I did *not* do stated as plainly as the things I did?

## 4. Hard stops

Pause and obtain explicit approval:

- A change conflicts with the governing architecture.
- A knowledge claim would render without a `SourceRef` (URL + `lastReviewed`).
- Any AI-generated health claim, anywhere in the product.
- An `emerging` benefit shown as `established`.
- A bridge that keeps two stores of the same fact in sync.
- A new static client file storing knowledge that overlaps a DB store.
- A schema change not in the declared scope.
- Anything would be pushed or deployed.

**If a hard stop is hit: STOP. Explain why. Do not continue until approved.**
