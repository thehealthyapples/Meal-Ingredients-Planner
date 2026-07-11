# Phase C — Remote Backup Confirmation

**Status:** Complete — the branch is backed up off-machine.
**Date:** 2026-07-11
**Branch:** `int1-intelligence-platform`
**Closes:** the "Still outstanding" item in [`PHASE_C_MILESTONE_CHECKPOINTS.md`](./PHASE_C_MILESTONE_CHECKPOINTS.md) § 7.

This document records the off-machine backup of the Phase C milestone commits. It
changed no code, documentation, data or commit history — it is a push and its
verification, nothing more. No migrations were run and no cleanup was performed.

---

## 1. Why this was needed

Phase C left one risk open and said so plainly. At the end of it, the branch carried
**37 commits that existed on no remote**, and the only backup was a Git bundle sitting on
**the same disk as the repository** — protection against a mistaken Git operation, not
against loss of the machine.

The Working Tree Protection Plan's headline finding compounded it: the working tree had
been the sole copy of the code behind four implementation reports (UX0, UX1, ATTN1, DEC1).
Phase C committed that code, but committing it locally does not make it safe. Until this
push, every line of it still lived on exactly one disk.

**That is now closed.**

---

## 2. Result

| | |
|---|---|
| **Remote used** | `origin` — `https://github.com/thehealthyapples/Meal-Ingredients-Planner.git` |
| **Branch pushed** | `int1-intelligence-platform` — new branch, **no force** |
| **Local HEAD** | `7dde4bb220efc9e18a5a340ca7e6e237e908cdf3` |
| **Remote HEAD** | `7dde4bb220efc9e18a5a340ca7e6e237e908cdf3` |
| **Match** | **Confirmed identical** |
| **Upstream** | set to `origin/int1-intelligence-platform` |
| **Commits local-only after push** | **0** (was 37) |

### All ten Phase C milestones verified present on the remote

Each SHA below was confirmed an ancestor of `origin/int1-intelligence-platform`:

| # | SHA | Commit |
|---|---|---|
| 1 | `4c89cc0` | HOUSE3 — Repository structure, document filing, engineering workflow |
| 2 | `64b1ee5` | PKR1/PKR2/PKR3 + EXP2 + UIA2 — Architecture governance |
| 3 | `f704210` | HOUSE3 (cont.) — Doc-path references in source comments |
| 4 | `048e7fd` | KNOW4 + KNOW5 — Composition evidence contract |
| 5 | `e211186` | ATTN1 + DEC1 + LEARN1 + COACH1 + COMP2 + BENCHINT4 — Intelligence platform |
| 6 | `07b16a6` | UX0 + UX1 — Home Experience and the canonical Bottom Navigation |
| 7 | `d9de7b5` | DEVWORLD2 + DEVWORLD3 — Development World reader and admin surfaces |
| 8 | `13afc76` | COOKBOOK2 + COOKBOOK3 — Founding cookbook import |
| 9 | `c273b38` | Phase C — Test wiring (`package.json`) |
| 10 | `7dde4bb` | Phase C — Working tree protection plan and milestone checkpoint record |

---

## 3. `gitsafe-backup` rejected the push — and was not worked around

The instruction was to push to both configured remotes. `origin` succeeded.
**`gitsafe-backup` (`git://gitsafe:5418/backup.git`) refused it:**

```
remote: Error: Only pushes to main branch are allowed
 ! [remote rejected] int1-intelligence-platform (pre-receive hook declined)
```

Its pre-receive hook accepts `main` only. It is a **main-branch mirror, not a
feature-branch backup target** — consistent with the fact that it holds only `main`, at a
SHA unrelated to `origin/main`.

A `--dry-run` to it had reported success beforehand. That is expected and not a
contradiction: **dry-runs do not fire server-side hooks**, so a policy rejection of this
kind can only surface on a real push.

**It was left rejected, deliberately.** The only two ways through would have been to force
the push or to push this branch onto `main`. Both are destructive, both violate the
stated constraints, and either would have been a far worse outcome than one remote
declining a branch it was never meant to hold. `origin` is the genuinely off-machine copy
and it is complete, so nothing is lost by respecting the rule.

---

## 4. Not backed up: the rollback tags

**The commits are safe; the tag *names* are not.** Phase C's rollback tags remain local-only:

| Tag | SHA |
|---|---|
| `rollback/PHASEC-pre-checkpoint-20260711` | `a432400` |
| `rollback/KNOW5-composition-evidence-20260711` | `048e7fd` |
| `rollback/INT-attention-decision-20260711` | `e211186` |
| `rollback/UX-home-bottomnav-20260711` | `07b16a6` |
| `rollback/PHASEC-complete-20260711` | `7dde4bb` |

Every commit they point at is on `origin` as a branch ancestor, so **no history would be
lost** if this machine disappeared. What would be lost is the *mapping* — which SHA was
which rollback point. It would have to be reconstructed from
`PHASE_C_MILESTONE_CHECKPOINTS.md` § 4 rather than read straight out of Git.

Closing that gap is one command:

```
git push origin --tags
```

Held back because the brief was the branch, and pushing tags is an outward-facing action
that was not authorised. It is a convenience gap, not a data-loss risk.

---

## 5. State left behind (unchanged by this operation)

Working tree, verified identical before and after the push:

| Path | State | Why |
|---|---|---|
| `data/development_world/` | Untracked (7.9 MB) | Owner decision: left uncommitted. Git keeps blobs forever; the payload is redundant (same world as 2.5 MB `.json` *and* 1.7 MB `.yaml`). |
| `data/cookbook/` | Untracked (3.7 MB) | Same. ~4× redundancy across `.json` / `.md` / `.csv` / batches. |
| `.engineering/session/CURRENT.md` | Modified (1 line) | Stop-hook heartbeat timestamp — machine churn. |

Commit history untouched: HEAD is still `7dde4bb`, no rewrite, no amend, no force.

> **The untracked data is still single-copy.** It is captured in the local Phase C backup
> archive, but that archive is on the same disk. If the machine is lost, the 11.6 MB of
> Development World and Cookbook data is lost with it — the import scripts are backed up,
> the imported data is not. That is an accepted consequence of the "leave uncommitted"
> decision, not an oversight, but it should be a conscious one.

---

## 6. Readiness

The precondition Phase C set for repository housekeeping and the **Platform Discovery &
Experience Audit** is now fully met. The repository's history tells the truth about what
exists, *and* that history survives the machine it was written on. Both may proceed.
