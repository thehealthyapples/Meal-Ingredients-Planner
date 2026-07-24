# Unresolved duplicates — awaiting an owner decision

**Do not cite anything in this folder.** The canonical copies are one level up, in
`docs/implementation/intelligence/`.

## What this folder is

Each file here is a **second, divergent copy** of a report that is already filed
in `docs/implementation/intelligence/`. Same EWO ID, same title, same opening
paragraphs — **different bodies.** They are not byte-identical, so
`repo-structure-verify.sh`'s duplicate check (which detects duplication by
content, not by filename) never saw them; they were invisible because they sat
loose at the tree root, which the same verifier *did* flag, without ever saying
why there were two.

| File | Canonical copy | Divergence |
|---|---|---|
| `AFI1_AMBIENT_FOOD_INTELLIGENCE.md` | `../AFI1_AMBIENT_FOOD_INTELLIGENCE.md` | 197 vs 192 lines — +8 / −3 |
| `FI20_FOOD_INTELLIGENCE_ACTIVATION.md` | `../FI20_FOOD_INTELLIGENCE_ACTIVATION.md` | 145 vs 171 lines — +24 / −50 |

Note that the divergence runs in **opposite directions** — the loose AFI1 is the
longer of its pair and the loose FI20 the shorter — so neither copy is uniformly
the later or fuller one, and no mechanical rule picks a winner.

## Why they were not merged

Both copies of both files entered the repository in **one** commit — `057102ec`,
*"Pre-HOUSE_ACT1 checkpoint — capture in-flight programme work"* (2026-07-18) —
so git history distinguishes neither, and neither has been touched since.

Choosing between two divergent accounts of the same completed work is a
**content judgement about what actually happened**, not a filing decision.
Merging them would invent a third document that neither author wrote; deleting
one would silently discard a record of real work on the strength of a guess.
Both are refused here under the canon's standing discipline — *surface the
conflict to the owner rather than silently approximate*
([`../../../architecture/LIVING_LARDER_IMPLEMENTATION_CONSTITUTION.md`](../../../architecture/LIVING_LARDER_IMPLEMENTATION_CONSTITUTION.md)
§ 2, cited as the general STOP rule; the Architecture Bootstrap's STOP
discipline).

They were moved here, byte-unchanged and with `git mv` so their history follows
them, purely so that the tree root is loose-file-free
([`../../../architecture/REPOSITORY_CONVENTIONS.md`](../../../architecture/REPOSITORY_CONVENTIONS.md)
§ 1 rule 5, § 4) and so the duplication is **visible and named** rather than
hidden in a root nobody reads.

## What resolving this looks like

For each pair, the owner decides which copy is the true record — or reconciles
the two into one — the surviving copy stays at
`docs/implementation/intelligence/<NAME>.md`, the other is deleted, and **this
folder is deleted with the last pair.** It is a holding area with a definite end,
not a durable workstream folder
([`../../../architecture/REPOSITORY_CONVENTIONS.md`](../../../architecture/REPOSITORY_CONVENTIONS.md)
§ 4 — *a workstream folder is a durable home for a stream of work*; this is not one).

*Recorded 2026-07-24 during the repository structure tidy. No file in this folder
was edited, renamed, merged, or deleted.*
