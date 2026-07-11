# ENGINEERING — Claude Launcher Automation (`call claude`)

**Date:** 2026-07-11
**Type:** Developer tooling. No application behaviour, schema, API, or production change.
**Risk:** 🟢 GREEN — adds four new files under `scripts/dev/`, one shell hook at `.config/bashrc`, and this document. Nothing on the request path, the build, or the deployment is touched.

---

## 1. Mission

Make the project's Claude Code invocation a **permanent, committed command** rather than
something each developer retypes or rediscovers:

```bash
call claude
```

launches Claude Code with `--permission-mode bypassPermissions`, from any shell tab, with
no per-machine setup, surviving a workspace reopen and a fresh clone.

`call` is deliberately a **dispatcher**, not a single-purpose script. Future launchers are
added as one file, with no changes to PATH wiring, `.replit`, or the dispatcher itself
(see §6).

---

## 2. Where the launcher lives

| Path | Tracked | Executable | Role |
|---|---|---|---|
| `scripts/dev/bin/call` | yes | `755` | The dispatcher. The only thing put on `PATH`. |
| `scripts/dev/launchers/claude.sh` | yes | `755` | The Claude launcher. `exec claude --permission-mode bypassPermissions "$@"`. |
| `scripts/dev/shell/replit-bashrc.sh` | yes | `644` (sourced) | Puts `scripts/dev/bin` on `PATH`. |
| `.config/bashrc` | **yes — force-added** | `644` (sourced) | The Replit shell hook. A stub that sources the file above. See §4. |
| `scripts/dev/install.sh` | yes | `755` | Idempotent repair. Not needed in normal operation. See §5. |

---

## 3. How it works

### 3.1 The mechanism: Replit's own bashrc sources a file inside the repository

Replit's `~/.bashrc` is a **read-only symlink into the Nix store**, so it cannot be edited,
and any change to the home directory would not be committable anyway. But that bashrc ends
with a hook (verbatim):

```bash
BASHRC="${REPL_HOME}/.config/bashrc"
if [[ -f "${BASHRC}" ]] && [[ -z "${REPLIT_MODE}" ]]; then
    # If the user has a bashrc, load it up ...
    # They can set their environment there and be happy.
    source "${BASHRC}"
fi
```

`${REPL_HOME}` is `/home/runner/workspace` — **the repository root**. So `.config/bashrc`
is a file that lives in the repo, is sourced automatically by every interactive shell tab,
and can be committed. That is the entire basis of this implementation: it is Replit's
sanctioned extension point, not a trick.

### 3.2 The chain

```
new shell tab
  └─ Replit's ~/.bashrc  (Nix store, read-only)
       └─ sources  .config/bashrc                    ← stub, in the repo, committed
            └─ sources  scripts/dev/shell/replit-bashrc.sh
                 └─ prepends  scripts/dev/bin  to PATH
                      └─ makes  `call`  a command
                           └─ `call claude`  execs  scripts/dev/launchers/claude.sh
                                └─ exec claude --permission-mode bypassPermissions "$@"
```

The PATH prepend is idempotent — re-sourcing the rc does not grow `PATH`.

Extra arguments are forwarded, so `call claude --resume` runs
`claude --permission-mode bypassPermissions --resume`.

### 3.3 Why `.replit`'s `[env]` was not used

Setting `PATH` under `[env]` in `.replit` is the other candidate. It was rejected: that key
*replaces* the environment value rather than extending it, and Replit composes the real
`PATH` from the Nix module set at container build time (Node, Python, Postgres, and the
`replit-runtime-path` entries all arrive that way). Hard-coding a `PATH` there risks
shadowing a toolchain on the next module change, and it is not testable without a container
rebuild. The bashrc hook composes with whatever Replit provides instead of overriding it,
and `.replit` therefore needs **no change at all**.

---

## 4. The one sharp edge: `.config/` is ignored, and not by us

`.config/bashrc` is matched by an ignore rule we do not control:

```
$ git check-ignore -v .config/bashrc
/etc/.gitignore:5:.config/	.config/bashrc
```

That is the **system-wide** excludes file (`git config core.excludesFile` → `/etc/.gitignore`),
owned by the Replit image. It is not in this repository's `.gitignore` and cannot be removed.

The file was therefore committed with a force-add:

```bash
git add -f .config/bashrc
```

Once tracked, git manages it normally: it is checked out on clone, restored by `git checkout`,
and updated by `git pull`, all regardless of the ignore rule — ignore rules only ever apply to
*untracked* files. **This is why a reopened workspace and a fresh clone both work with no setup.**

⚠️ **If `.config/bashrc` is ever deleted from the index, a plain `git add` will silently fail to
re-add it.** Force-add it again, or run `scripts/dev/install.sh`. This is the single fact about
this system worth remembering; everything else is ordinary shell scripting. It is also why the
real logic lives in `scripts/dev/` (normally tracked) and `.config/bashrc` is only a stub — if
the stub is ever lost, nothing of substance is lost with it.

---

## 5. Repair

Not needed in normal operation. Run it only if `call` stops being found — e.g. someone deleted
`.config/bashrc`, or a file lost its `+x` bit:

```bash
bash scripts/dev/install.sh
```

It re-applies the executable bits and restores `.config/bashrc` **only if missing** (it never
clobbers a customised one). Then open a new shell tab, or `source .config/bashrc` in the current one.

---

## 6. How to add a future launcher

Add **one executable file**. Do not touch the dispatcher, the PATH wiring, or `.replit`.

```bash
cat > scripts/dev/launchers/dev.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec npm run dev "$@"
EOF
chmod +x scripts/dev/launchers/dev.sh
git add scripts/dev/launchers/dev.sh
```

`call dev` now works in any new shell tab, and `call` with no arguments lists it automatically:

```
$ call
usage: call <launcher> [args...]

available launchers:
  call claude
  call dev
```

Conventions:

- **Name the file after the command.** `scripts/dev/launchers/<name>.sh` ⇒ `call <name>`.
- **`exec` the target**, so signals and the exit code pass through cleanly and no shell lingers.
- **Forward `"$@"`**, so callers can pass extra flags.
- **Commit the executable bit.** The dispatcher exits `126` with a clear message if it is missing,
  rather than failing obscurely.
- **Check the tool exists** and fail with an actionable message, as `claude.sh` does for a missing
  `claude` CLI (exit `127`).

---

## 7. Verification

All checks run against a **faithful simulation of a fresh Replit shell tab** —
`env -u REPLIT_MODE bash --rcfile ~/.bashrc -i` — which sources the real, unmodified Replit
bashrc and therefore exercises the same hook a reopened workspace does.

| # | Check | Result |
|---|---|---|
| 1 | `call` resolves on `PATH` in a fresh shell tab | ✅ `/home/runner/workspace/scripts/dev/bin/call` |
| 2 | `call claude` invokes Claude with the right flags | ✅ argv: `claude --permission-mode bypassPermissions` |
| 3 | Extra arguments are forwarded | ✅ `call claude --resume --model opus` → `claude --permission-mode bypassPermissions --resume --model opus` |
| 4 | The **real** `claude` binary accepts the flag | ✅ `call claude --version` → `2.1.207 (Claude Code)` |
| 5 | `PATH` is not duplicated when the rc is sourced twice | ✅ `scripts/dev/bin` appears exactly once |
| 6 | Launcher files are executable | ✅ `755` on `call`, `claude.sh`, `install.sh` |
| 7 | Unknown launcher fails clearly | ✅ exit `127`, lists available launchers |
| 8 | **Survives reopen / fresh clone** | ✅ verified by cloning `HEAD` to a scratch directory: `.config/bashrc` is present, mode bits are intact, and `call claude` resolves in the clone |

Check 2 was made exact by putting a shim `claude` earlier on `PATH` that echoes its argv, so the
flags are observed rather than inferred. Check 8 is the one that proves the durability
requirement: a clone of the committed tree is precisely what a reopened workspace materialises.

---

## 8. Files

```
scripts/dev/
├── bin/
│   └── call                    # dispatcher (on PATH)
├── launchers/
│   └── claude.sh               # call claude
├── shell/
│   └── replit-bashrc.sh        # PATH wiring (sourced)
└── install.sh                  # idempotent repair

.config/bashrc                  # Replit shell hook (force-added; see §4)
docs/implementation/engineering/ENGINEERING_CLAUDE_LAUNCHER.md
```

`.replit` is unchanged.
