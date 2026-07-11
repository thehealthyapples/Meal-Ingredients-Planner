# Verification Standard

**Status:** Canonical engineering standard. `EOM1` (2026-07-10).
**Invoked by:** [`../OPERATING_MANUAL.md`](../OPERATING_MANUAL.md) Steps 6–8.

Verification is the difference between "I changed the code" and "I know what the
code now does". The three steps are distinct and none substitutes for another.

| Step | Question | Not a substitute for |
|---|---|---|
| **Verify** | Does it do what I claim, when exercised? | Build |
| **Build** | Does it still compile and bundle? | Verify |
| **Review** | Would a reader accept this diff? | Either |

A green build proves nothing about behaviour. A passing test proves nothing about
the path you did not test.

---

## 1. Exercise it

**Observe the behaviour you claim, in the form its caller would meet it.**

- Run the relevant tests — `npm test`, or the specific `npm run test:*` target.
- Drive the affected path end-to-end where a runtime surface exists.
- For a script or hook, *run it*, including its failure path (what happens when
  the file it reads is absent?).
- For a claim like "the hook stays silent when idle", construct the idle state
  and show that it is silent.

Reading the code and concluding it must work is not verification.

## 2. Prove negatives with commands

Claims of the form "no X remains", "nothing references Y", "no duplicates exist"
must be backed by a command whose output you show. Structural proofs beat keyword
proofs:

- *"It cannot declare a table"* → the directory contains zero `.ts`/`.sql` files.
- *"Nothing references it"* → `grep -rIl <path> .` returns nothing.
- *"These are duplicates"* → identical `sha1sum`, not identical filenames.

Beware the self-matching grep: a script that greps for a pattern contains that
pattern. Exclude it, or the check fails on itself and teaches you nothing.

## 3. Separate new breakage from old

**A failing test does not mean you broke it.** Before reporting a failure as
pre-existing, prove it:

```bash
# check out the rollback tag in a temporary worktree and run the same check
git worktree add --detach /tmp/baseline rollback/<tag>
( cd /tmp/baseline && <the same command> )
git worktree remove --force /tmp/baseline
```

Report both numbers: *baseline had N failures; the tree now has M*. This is the
only honest way to claim "pre-existing", and the only way to notice the one
regression you actually introduced.

Equally: a file that is merely *modified in the working tree* is not necessarily
modified by you. Check before you claim authorship of a change — or innocence of
one.

## 4. Build

Run `npm run build` if **any code file changed** — including a change confined to
a comment. If only documentation or `.engineering/` files changed, the build is
not required; **state that it was not run, and why**. Silence reads as a passing
build.

Distinguish warnings you introduced from warnings that were already there, on
lines you never touched.

## 5. Report honestly

- If tests fail, say so, and show the output.
- If a step was skipped, say which and why.
- If a claim is unverified, mark it unverified rather than hedging it into
  ambiguity.
- If verification found a bug in your own work, report the bug **and** the fix.
  A verification pass that never finds anything is usually a verification pass
  that never ran.
- State what you did not do as plainly as what you did.

## 6. Regression tests for bugs found in tooling

When verification uncovers a defect in engineering tooling, fix it *and* add the
check that would have caught it to the relevant verify script. A bug found once
and not pinned will return.
