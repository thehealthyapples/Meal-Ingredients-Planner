# THA Codex OS-enforced read-containment investigation

**Status**: Investigation only. No live changes were made. No file outside this report and
its companion agent report was created, edited, or deleted.

## Scope and approval

Approved by Colin, THA Governance Owner, 2026-10-19, as an investigation-only task ("THA —
CODEX OS-ENFORCED READ-CONTAINMENT INVESTIGATION"). Risk declared: RED (security, execution
authority, architecture, filesystem access). This task follows directly from this same
repository's own disclosed limitation in
`docs/implementation/tha-bridge-worker-trust-enforcement-option-b.md`: Codex's
`workspace-write` sandbox protects writes and network but explicitly does not protect reads,
and no CLI flag or config key exists to close that gap.

## Phase 1 — Governing architecture

1. **Canonical ownership of delegated task authority** — `PROJECT_GOVERNANCE.md`: the
   Governance Owners (Colin, Lindsay) own root governance; the delegated Claude/Codex
   contract itself is the "Delegated-agent contract" section (previous two rounds' subject).
   **[Verified]**
2. **Canonical ownership of execution identity and permissions** — `PROJECT_GOVERNANCE.md`:
   "Gate 9 remains the sole normal governed implementation execution authority... Gate 8 may
   execute only against [a bound decision]." Gate 8 is the isolated implementation/
   verification executor; Gate 9 is the sole approval/binding/readiness authority. Neither
   document assigns execution-identity ownership for the Gate-5-controlled *delegation*
   pathway specifically (Claude/Codex workers invoked via `delegation-adapters.mjs`) — that
   pathway is a newer capability than the governance text's Gate 8/9 execution model, and its
   own canonical owner is the code itself (`delegation-adapters.mjs`'s `claudeAdapter`/
   `codexAdapter`), confirmed in the two prior rounds' reports. **[Verified]**
3. **Gate 5 and Gate 9 responsibilities** — Gate 5 (`server.gate5.mjs`, port 8789):
   read/prep/investigate/delegate operations, proposal-only. Gate 9 (`server.gate9.mjs`, port
   8791): decision/execution governance, the sole normal implementation-execution authority.
   Delegated Claude/Codex workers are dispatched by Gate 5 and are explicitly proposal-only —
   `createResultPacket()`'s `authorityToWrite` is hardcoded `false`; a delegated worker never
   writes to the authoritative repository and never reaches Gate 9 directly. **[Verified,
   confirmed again by reading the current source this round]**
4. **Existing worktree lifecycle and cleanup** — `withDisposableWorktree`/`disposeWorktree`
   (`delegation-adapters.mjs`): a `git worktree add --detach` scratch directory under
   `delegation-worktrees/`, always removed in a `finally` block regardless of outcome, with no
   copy-back step. **[Verified]**
5. **Existing security and isolation mechanisms** — as of the previous round: disposable git
   worktrees (isolate working-tree *content*, not OS-level filesystem access); for Claude,
   `--disallowedTools`/`--strict-mcp-config`/`--settings
   blockReadsOutsideWorkingDirectories` (Claude-Code-internal tool-permission enforcement,
   confirmed real but explicitly application-level, not OS-level); for Codex,
   `--sandbox workspace-write` (OS-level for writes/network on this platform, explicitly not
   for reads, per Codex's own documentation). **None of these is OS-enforced read
   containment for Codex — that is precisely this investigation's subject.** **[Verified]**
6. **Every existing consumer of the affected execution mechanism** — only
   `delegation-adapters.mjs`'s `codexAdapter` invokes a real Codex subprocess through the
   Bridge. `scripts/mcp/gate5-readonly.mjs`'s stdio adapter cannot trigger delegation at all
   (its `allowedKeys` rejects `allowDelegation`, reconfirmed unchanged this round). Codex's
   own *interactive* CLI sessions (run directly by Colin, not through the Bridge) are outside
   this investigation's reach by construction, exactly as the previous two reports already
   scoped. **[Verified]**
7. **Does the proposed isolation extend existing architecture or create duplication?** — See
   "A pre-existing, partially-built mechanism was found" below: this investigation found an
   **already-provisioned but never-connected** restricted-account mechanism
   (`CodexSandboxOffline`/`CodexSandboxOnline` local Windows accounts, `CodexSandboxUsers`
   group) that is the natural extension point, not a new concept. **[Verified — see evidence
   below]**

No contradiction between current repository state and governing architecture was found that
would require a STOP under this phase's own rule. The delegation pathway's execution-identity
ownership gap (item 2) is a genuine absence, not a conflict, and is named in "Phase 5" as
something the governed decision should explicitly assign.

## Phase 2 — Current environment (read-only; no credential values were read)

- `tha-chatgpt-bridge`: branch `main`, HEAD `f5b1806e132ddcbc2e83114bf78e99d6f4e82a8e`, 2
  untracked/dirty entries (artifacts of the immediately preceding task; not touched by this
  investigation). `tha-integrated-dev`: branch `feat/integrated-dev`, HEAD
  `bffc533d65f58ae30c1faf7d3026b50dcc17be89`, 1 dirty entry. **[Verified]**
- Gate 5 execution identity: a plain `node.exe server.gate5.mjs` process, confirmed running
  as `Z420\Colin` (via the previous task's own restart-script verification). Gate 9: same
  account, confirmed by the same mechanism, unaffected by this investigation. **[Verified]**
- Bridge delegation subprocess identity: `claudeAdapter`/`codexAdapter` spawn `claude`/`codex`
  as direct child processes of the Gate 5 Node process — i.e., **as `Z420\Colin`, with no
  account change of any kind today.** This is the entire problem: a Codex (or Claude) worker
  subprocess currently runs with exactly Colin's own effective filesystem permissions.
  **[Verified, by direct reading of `delegation-adapters.mjs`, unchanged by this
  investigation]**
- Codex executable/CLI version: `codex-cli 0.156.1` (npm install, `C:\Users\Colin\AppData\Roaming\npm\codex.cmd`
  shim, confirmed via `where codex`). **[Verified]**
- Current sandbox configuration: `--sandbox workspace-write` plus (added in the previous
  round) explicit `-c sandbox_workspace_write.network_access=false`. Per Codex's own
  documentation (developers.openai.com/codex, re-confirmed this round): workspace-write
  confines *writes* to the workspace and disables *network* by default, but does **not**
  restrict *reads* — "the agent can read SSH keys, browser profiles, and dotfiles by
  default." **[Verified]**
- Windows account/token permissions: this workstation is **Windows 10 Pro, build 19045**.
  `HyperVisorPresent: False`. Critically, `systeminfo`'s own Hyper-V Requirements check
  reports **"Virtualization Enabled In Firmware: No"** — the CPU/firmware itself has
  virtualization disabled at the BIOS/UEFI level, not merely the Windows feature. The
  `Containers-DisposableClientVM` (Windows Sandbox) and `Microsoft-Hyper-V-All` optional
  features are both `State: Disabled`. No Docker installation was found on `PATH`. `wsl.exe`
  exists at `C:\Windows\System32\wsl.exe` but `wsl --status` returned no usable output in this
  check. **[Verified — this is the single most decisive environmental fact for Phase 4
  below]**
- Existing isolated worktree root: `delegation-worktrees/` under `tha-chatgpt-bridge`
  (`C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\delegation-worktrees\`, per
  `WORKTREE_ROOT` in `delegation-adapters.mjs`). **[Verified]**
- Relevant filesystem ACL inheritance (metadata only; no file content was read): `G:\THA-Private`
  grants only `Z420\Colin:(F)`, `NT AUTHORITY\SYSTEM:(F)`, `BUILTIN\Administrators:(F)` —
  **no `CodexSandboxUsers` entry, no `Everyone`/`Users` entry.** `C:\Users\Colin` grants only
  `SYSTEM`, `Administrators`, and `Z420\Colin` — standard Windows per-profile isolation,
  already excluding every other local account, including the two below, by default.
  `delegation-worktrees/` itself carries a broader, inherited ACL including
  `Z420\CodexSandboxUsers:(I)(OI)(CI)(M)`, `BUILTIN\Users:(I)(RX)`, and four unresolved SIDs
  (likely orphaned entries from deleted/renamed accounts — not investigated further, out of
  scope for an ACL-metadata-only check). **[Verified]**
- **A pre-existing, partially-built mechanism was found**: a local Windows group
  `CodexSandboxUsers` ("Codex sandbox internal group (managed)") already exists, containing
  two already-provisioned, **enabled** local user accounts: `CodexSandboxOffline` and
  `CodexSandboxOnline`. Both are plain members of only `CodexSandboxUsers` and the built-in
  `Users` group — no elevated rights, no Administrators, no Remote Desktop Users. Both have
  `PasswordRequired: True`. `CodexSandboxOffline` has a real profile directory and a logon as
  recent as today; `CodexSandboxOnline`'s last recorded logon was 2026-10-08. Three
  pre-existing documents in `tha-chatgpt-bridge` (`GATE5_CREDENTIAL_RELOCATION_TO_SHARED_G_DRIVE_FOLDER.md`,
  the Gate 9 restart-ownership investigation from 2026-10-18, and the Gate 9 provisioning
  script's own comments) independently corroborate that this group has existed for some time
  with "deliberately reduced rights," was *previously* granted broader credential-folder
  access and then had that access **removed** once it was confirmed "the live Gate5/9 MCP
  adapter runs as the owning account, not that group." **No code path anywhere in
  `delegation-adapters.mjs` references either account or the group** — this is provisioned
  infrastructure that was never wired into the actual delegation execution path. The
  `Offline`/`Online` naming strongly suggests the original design intent already anticipated
  a two-tier split matching this investigation's own threat model (a network-denied tier and
  a network-permitted tier). **[Verified that the accounts/group exist and are unused by the
  delegation path; Inferred that "Offline"/"Online" naming reflects an original
  network-access design split — no document naming that specific rationale was found]**
- **One unresolved, time-coincidental observation, disclosed rather than chased further**: a
  Windows Security event log entry shows `CodexSandboxOffline` was logged on (type 2,
  interactive, via `svchost.exe`/`seclogo`, subject `Colin`) at **10:48:59** today — a few
  minutes after this investigation's immediately preceding task restarted Gate 5 at 10:45:12.
  No scheduled task targeting either account exists right now (consistent with the same
  register-run-delete ephemeral-task pattern the existing Gate 5 restart script itself uses
  for its *own* principal). Direct reading of `start-tha-services.ps1` (the only script this
  or the preceding task invoked) confirms it never references either account. The
  Task-Scheduler operational log was not accessible in this check (likely disabled by
  default) to locate the responsible task by name. This is reported as an open question, not
  attributed to this investigation's own actions (which referenced neither account), and not
  further pursued given this task's explicit read-only, no-isolation-testing scope.
  **[Inferred: unrelated to this investigation's own commands; unresolved as to true cause]**
- Existing Windows sandbox/container/virtualisation facilities: none currently usable (see
  above). **[Verified]**
- Relevant executable/Git/runtime dependencies: `git`, `node20` (`G:\...\toolchains\node20\node.exe`),
  `claude`/`codex` npm global shims — all already resolved and used by the existing adapters;
  no new dependency would be required by the Option A design recommended below.
- Existing Development Centre startup/restart ownership: `start-tha-services.ps1`, with a
  proven `-RestartGate5Only` mode that relaunches Gate 5 via a temporary, uniquely-named,
  identity-verified Windows scheduled task running under a specific principal (Colin's own
  limited token today), then deletes that task — **this exact mechanism (register a scoped,
  single-use scheduled task for a specific principal, run it once, verify, delete it) is the
  reusable pattern this investigation's recommended design extends to a different principal**,
  rather than inventing a new cross-account launch mechanism. **[Verified]**
- Whether Claude and Codex already share any containment machinery: no. Claude's containment
  (previous round) is entirely Claude-Code-internal (tool denial, `--settings`); Codex's
  (`--sandbox workspace-write`) is entirely Codex-CLI-internal. Neither shares anything with
  the other, and neither currently shares anything with the dormant `CodexSandboxOffline`/
  `CodexSandboxOnline` accounts. **[Verified]**

## Phase 3 — Threat model

What must be protected against, with each item marked **Actual** (a real, currently-possible
exposure given today's code) or **Hypothetical** (would require a different, not-currently-
true precondition):

| Threat | Status | Why |
|---|---|---|
| Reading `G:\THA-Private` or credential stores | **Actual** | Codex runs as Colin today; Colin's own account has full read access there. No technical control stops a Codex subprocess from reading it if instructed to (confirmed structurally; not re-tested, per this task's own "do not access a synthetic credential directory to prove it" instruction already satisfied by not testing). |
| Reading user-profile files outside the authorised workspace | **Actual** | Same reasoning — Codex runs as Colin, with Colin's full profile access. |
| Traversing parent directories | **Actual** | `--sandbox workspace-write` does not block reads at all; nothing stops `cd ..` followed by a read. |
| Following junctions/symlinks/reparse points outside the sandbox | **Actual** | No read-side protection exists to evaluate a symlink target against; this is a direct consequence of the same read gap, not a separate mechanism to defeat. |
| Access through Git metadata and linked worktrees | **Actual** | A disposable worktree shares the repository's object store (`.git`) with the main checkout; nothing prevents Codex from reading `.git`'s packed history, including content from other branches or deleted-but-still-packed commits, if it chooses to look. |
| Inherited filesystem permissions | **Actual** | Codex inherits Colin's full effective permission set; there is no narrower inherited set today. |
| Subprocess and shell access | **Actual** | Codex's own operating model is built around running shell commands in its sandbox; those subprocesses inherit the same Windows access token Codex itself runs under (Colin's), so any OS-level fix must restrict the *token*, not try to intercept each subprocess individually. |
| Temporary directories | **Actual** | `%TEMP%` for Colin's own account is fully readable/writable by Colin; a worktree-adjacent temp file (as this repository's own adapters now create for Claude) is no more protected than any other file Colin can read. |
| Profile/environment exposure | **Actual** | Environment variables set for the Gate 5 process (and inherited by its Codex child) are visible to the child; `delegation-adapters.mjs` already explicitly scopes Codex's environment to two named variables (`THA_DELEGATION_WORKTREE`/`THA_DELEGATION_LAST_MESSAGE`) rather than the full ambient environment, which already reduces — but, running under Colin's own token, does not eliminate — this exposure, since the account's own ambient OS environment (`USERPROFILE`, etc.) is still visible. |
| Network and IPC escape routes | **Partially mitigated today** | `sandbox_workspace_write.network_access=false` (added previous round) blocks outbound network for Codex's own sandboxed shell commands; this is OS/sandbox-enforced per Codex's own documentation, a real, working control already in place, distinct from the read gap this investigation addresses. |
| Access to other repositories and worktrees | **Actual** | Nothing distinguishes "this disposable worktree" from any other path on disk Colin's account can read, including a different repository entirely. |
| Existing hooks and helper processes | **Hypothetical, flagged but not confirmed** | `tha-integrated-dev`'s own committed `.claude/settings.json` registers `SessionStart`/`Stop` hooks (noted in the previous round's report as a Claude-specific finding). Whether an equivalent concern applies to Codex (e.g. via its own project-trust/hook-like mechanisms) was not found in this investigation — Codex's documented mechanisms reviewed so far (AGENTS.md discovery, `model_instructions_file`) are instruction-delivery, not process-execution, mechanisms. |
| Cleanup failures | **Actual, low-severity** | A pre-existing, unrelated (2026-09-15) leftover disposable worktree (`wt-0770493b7dcb`) was observed and reconfirmed present in both previous rounds — proof that disposal can fail to run to completion at least occasionally, independent of anything this investigation changed. |
| Escalation into Gate 5 or Gate 9 | **Hypothetical** | No `.mcp.json` is committed in either repository (reconfirmed in the previous round), so a worktree checkout does not automatically grant a worker MCP-level access back into Gate 5/9. A worker running as Colin could, in principle, reach Gate 5's own HTTP port directly (it is a local, token-authenticated service) if it both knew the real task-workflow credential and chose to use it — it does not have that credential today (it is never placed in the worker's environment or prompt), so this remains hypothetical, not actual. |

## Phase 4 — Comparing real implementation options

| Criterion | A. Restricted Windows user/token | B. OS sandbox/container (Windows Sandbox / Docker / WSL2) | C. Disposable VM |
|---|---|---|---|
| Reads restricted by the OS | **Yes** — NTFS DACLs are enforced by the filesystem driver for every process under that token, including subprocesses. A standard new account has no access to Colin's profile, `G:\THA-Private`, or other accounts' profiles by Windows's own default ACL behaviour (verified above). | Yes, if available. | Yes, if available. |
| Writes restricted | Yes — grant write only on the delegation-worktree subtree the new account needs. | Yes. | Yes. |
| Network deniable | Yes — Windows Filtering Platform / firewall rules scoped to the account's SID, or simply no network credential/route configured for it. | Yes. | Yes. |
| Subprocess inheritance | **Yes — this is the core property that makes this option work at all.** A Windows access token is inherited by every child process by default, exactly like POSIX UID/GID inheritance; Codex's own shell-command subprocesses are bound by the same restricted token regardless of what Codex itself does or doesn't enforce. | Yes, for processes inside the container/sandbox boundary. | Yes, for processes inside the VM. |
| Codex CLI runs correctly | **Likely, unverified** — Codex has no documented dependency on running as a specific account; it is a standard console application. Not tested in this investigation (no isolation test was authorised). | Likely, but adds a containerisation/compatibility variable not present today. | Likely, but adds a full OS-boot variable. |
| Git/worktree handling functional | **Likely** — `git worktree add` already supports a worktree whose files are readable by a different account, provided that account is granted read on the repository's `.git` object store and read/write on the worktree path itself; this is an ACL-grant exercise, not a Git limitation. | Likely, with added complexity (bind-mounting the worktree into the container/sandbox). | Likely, with added complexity (sharing the worktree into the VM, e.g. via a network share — itself a new escape-route class to re-analyse). |
| Runtime dependencies remain available | Yes — same filesystem, same Node/Codex install, just a different account's read grant on those specific paths. | Only if explicitly provisioned inside the container/sandbox image — a new maintenance burden. | Only if explicitly provisioned inside the VM image — a larger maintenance burden. |
| Secrets/credentials inaccessible | **Yes, already true today without any new grant** — `G:\THA-Private`'s ACL already excludes `CodexSandboxUsers`/`Everyone`/`Users` entirely (verified above); a new restricted account inherits exactly that same exclusion by doing nothing. | Yes, if the container/VM boundary itself is trustworthy and credentials are never mounted in. | Yes, under the same condition. |
| Gate 5 can create/monitor safely | **Yes, by extending the exact mechanism `start-tha-services.ps1` already uses for its own restart** (register a scoped, single-use scheduled task for a specific principal, run it, wait, verify, delete it) — no new cross-account launch primitive needs inventing. | Requires a new container/sandbox orchestration layer Gate 5 does not have today. | Requires a new VM orchestration layer (start, wait for boot, inject task, retrieve result, tear down) Gate 5 does not have today. |
| Results returned without wider access | Yes — the worktree itself (the only thing the restricted account can write) is the return channel, identical to today's disposable-worktree diff-capture already used for both providers. | Yes, via a bind-mounted/shared path, with its own new access-boundary question. | Yes, via a shared path or network transfer, with its own new access-boundary question. |
| Requires new Windows configuration/privileges/services | **Minimal** — create two local accounts (already done, unused) or new ones, set a handful of `icacls` grants, and a scheduled-task registration pattern the repository already has working code for. | **Currently blocked**: Windows Sandbox requires Hyper-V/virtualization, and this workstation's firmware has virtualization disabled (`Virtualization Enabled In Firmware: No`) — enabling it requires a BIOS/UEFI-level change and at least one restart, a disruptive, not-purely-software action. Docker Desktop and WSL2 both carry the same underlying virtualization dependency on Windows and are not currently installed. | **Currently blocked for a local VM**, same virtualization dependency. A remote/cloud VM avoids the local virtualization requirement but introduces a new network dependency, new credential-transfer surface, and materially higher complexity — working against this task's own "lowest-complexity" instruction. |
| Setup/maintenance complexity | **Low** — extends existing, proven scripts; two accounts already exist. | **High right now** (firmware change, feature enablement, reboot, new image/container maintenance) given the current environment. | **High** (VM image maintenance, boot-time latency, teardown reliability) regardless of local/remote. |
| Performance/resource impact | Negligible — same process model as today, just a different token. | A container/sandbox adds real startup latency and resource overhead once available. | A VM adds the most startup latency and resource overhead of the three. |
| Failure/recovery behaviour | Simple — the existing worktree-disposal and task-deletion patterns already handle this class of cleanup; a failed account-switch simply fails the delegation closed (no worker invoked). | More failure modes (container/image corruption, sandbox launch failure) to design recovery for, none of which exist in this codebase today. | Most failure modes (VM boot failure, network-share failure, snapshot/teardown failure) of the three. |
| Rollback complexity | **Low** — remove the ACL grants / disable the two accounts; no code path depends on them existing today (they are currently unused), so rollback is a pure subtraction. | Low once built, but building it is itself the large, non-trivial change. | Same. |
| Compatibility with existing THA architecture | **High** — reuses the proven Task-Scheduler cross-principal launch pattern, the existing disposable-worktree lifecycle, and the existing `codexAdapter` call shape; only the executing identity changes. | Would require materially restructuring how `codexAdapter` invokes the worker (through a container runtime instead of a direct child process) — a bigger architectural change than this task's "lowest-complexity" framing calls for, and currently blocked anyway. | Same restructuring concern, worse. |

**Does an existing mechanism already solve this, and can it be reused?** Yes, in two
independent ways, both already real and already working in this exact repository today: (1)
the `CodexSandboxOffline`/`CodexSandboxOnline` accounts are already provisioned, enabled, and
correctly excluded from every protected path's ACL (`G:\THA-Private`, `C:\Users\Colin`) simply
by being ordinary, unprivileged accounts no one has granted anything extra to; (2) the
Task-Scheduler-based cross-principal launch pattern `start-tha-services.ps1 -RestartGate5Only`
already uses for its own purposes is directly extensible to launch a Codex worker as one of
these accounts instead of as Colin. **No second delegation platform is proposed — this
recommendation is entirely an extension of `delegation-adapters.mjs`'s existing
`codexAdapter` plus the existing restart script's existing launch pattern.**

**Recommendation: Option A** (restricted Windows user/token), for the reasons in the table
above — most decisively, because Options B and C are not currently available on this
workstation without a disruptive firmware/feature/reboot change that this investigation was
not authorised to make and does not recommend making solely for this purpose, while Option A
reuses infrastructure that already exists, is already unprivileged-by-default, and is already
proven launchable via an existing, working mechanism.

## Phase 5 — Recommended design

1. **Authoritative owner of the isolation mechanism**: `delegation-adapters.mjs` (the
   existing, sole owner of `codexAdapter`/worker invocation) plus `start-tha-services.ps1`
   (the existing, sole owner of cross-principal process launch). No new owner, file, or
   service is introduced.
2. **How Gate 5 requests isolation**: `codexAdapter` requests a scoped, single-use launch
   (mirroring `-RestartGate5Only`'s own registration/run/delete sequence) targeting
   `CodexSandboxOffline` (or `CodexSandboxOnline` only for a task type that has been
   separately approved to need network access), instead of spawning `codex` as a direct child
   of its own process.
3. **How worker identity is established**: the existing Task-Scheduler principal-registration
   pattern — a one-time, already-stored credential for the target account (Task Scheduler's
   own secure credential storage, the same mechanism already proven for Gate 5's own limited
   relaunch), never a plaintext password passed at invocation time.
4. **How allowed files enter the sandbox**: unchanged — the existing disposable-worktree
   creation (`withDisposableWorktree`) already copies only the admitted source-view files in;
   the only new step is granting the target restricted account read/write on that one
   worktree path (and read on the shared `.git` object store) for the lifetime of that single
   invocation, via a scoped `icacls` grant applied to the worktree directory at creation and
   removed at disposal.
5. **How forbidden filesystem paths remain inaccessible**: by **not granting** access —
   Windows's own default-deny behaviour for a standard account already excludes every
   protected path (verified above for `G:\THA-Private` and `C:\Users\Colin`); no explicit deny
   rule needs to be written for those paths, only the single explicit allow grant on the one
   worktree directory per invocation.
6. **How Git worktree metadata is handled securely**: the restricted account needs read
   access to the repository's `.git` directory to resolve the worktree at all; this is an
   unavoidable, narrow grant (read-only, not write) that should be scoped to `.git` plus the
   one worktree subtree, never the whole repository checkout, so the worker still cannot read
   sibling worktrees or other repositories' content.
7. **How results leave the sandbox**: unchanged — `proposedPatchFrom`'s existing `git diff`
   capture, run from the *authoritative* account (Colin, via the Gate 5 process) against the
   worktree *after* the restricted account's process has exited and the grant has been
   revoked, so reading the result never itself requires widening the restricted account's own
   access.
8. **How cleanup is verified**: extend the existing worktree-disposal check with an explicit
   post-invocation `icacls` removal of the restricted account's grant on that worktree path,
   verified (not merely issued) before the worktree itself is deleted — mirroring this
   repository's own existing pattern of verifying, not assuming, successful cleanup.
9. **How audit evidence is recorded**: reuse the existing `readEvent()` structured-event
   mechanism already used throughout `server.gate5.mjs` for delegation events — a new event
   type (e.g. `delegation_isolated_worker_invoked`) carrying the account name, worktree path,
   and grant/revoke timestamps, no new persistence layer.
10. **What happens if isolation cannot be established**: fail closed — if the scoped account
    launch, the ACL grant, or the grant-removal verification fails at any step, the task
    returns a result identical in shape to the existing `worker_command_failed`/
    `delegation_governance_unavailable` failure modes, and no Codex process is ever invoked
    under the wider (Colin) identity as a fallback.
11. **How Codex delegation fails closed**: explicitly — there is no silent fallback to
    running Codex as Colin if the restricted-account path is unavailable; that would defeat
    the entire point of this investigation.
12. **How Claude's existing successful arrangement remains unaffected**: entirely — this
    design touches only `codexAdapter`; `claudeAdapter` and its already-verified
    `--disallowedTools`/`--settings` controls are untouched.
13. **How existing Gate 5/Gate 9 governance remains authoritative**: entirely — this is a
    Gate-5-internal worker-invocation change; it does not touch Gate 9, does not create a
    second execution authority, and does not change what a delegated worker is authorised to
    do (still proposal-only, `authorityToWrite: false`, unchanged).

No duplicated governance records or persistent task state are introduced anywhere in this
design.

## Phase 6 — Security verification design (prepared, not run)

A safe, reproducible acceptance matrix, using only synthetic markers (never real credentials)
and disposable fixtures, to be run only once a governed implementation exists:

| # | Test | Expected (OS-enforced) result |
|---|---|---|
| 1 | Read an allowed file inside the granted worktree | Succeeds |
| 2 | Write an allowed temporary file inside the granted worktree | Succeeds |
| 3 | Read a synthetic marker file placed outside the worktree (e.g. in Colin's own profile) | **Denied by the OS** (access-denied error from the filesystem, not a worker's text refusal) |
| 4 | Write outside the worktree | **Denied by the OS** |
| 5 | Follow a symlink/junction created inside the worktree pointing outside it | **Denied by the OS** when the target is resolved, exactly as for a direct path |
| 6 | Read a different worktree under the same `delegation-worktrees/` root | **Denied by the OS** |
| 7 | Read an unrelated user-profile location (e.g. `C:\Users\Colin\Documents`) | **Denied by the OS** |
| 8 | Read a synthetic "credential" directory with no real secret in it, created solely for this test, with an ACL matching `G:\THA-Private`'s real shape | **Denied by the OS** |
| 9 | Spawn a subprocess (e.g. a shell command) that attempts test #3 or #7 itself | **Denied by the OS**, identically to #3/#7 — this is the test that specifically proves subprocess inheritance, the property application-level tool denial cannot provide |
| 10 | Attempt a network connection | Denied (already covered by the existing `sandbox_workspace_write.network_access=false` control; re-run here only to confirm it still holds under the new account) |
| 11 | Read an inherited environment variable not explicitly granted to the restricted account's process | Not present / inaccessible |
| 12 | Attempt to use Git metadata or a hook to reach outside the worktree (e.g. a crafted `.git/hooks` entry committed to a synthetic test fixture) | **Denied by the OS** if it attempts a file read outside the grant; this test specifically exercises the "Git metadata/hooks" threat-model item |

Every result must be confirmed by an **independent, observable OS-level signal** (an
access-denied error code, a `GetOwner`/`icacls` check, an absent file handle) — never by
reading the worker's own natural-language account of what happened, consistent with the two
previous rounds' explicit finding that a worker's own narrative is not proof of what actually
occurred. Cleanup must be verified (grant removed, worktree deleted, no orphaned restricted
process) as its own separate, checked step, not assumed from a zero exit code.

## Phase 7 — Governed implementation decision (prepared; not started)

- **Recommended option**: A (restricted Windows user/token), reusing the existing
  `CodexSandboxOffline`/`CodexSandboxOnline` accounts and the existing Task-Scheduler
  cross-principal launch pattern.
- **Alternatives**: B (OS sandbox/container) and C (disposable VM), both currently blocked by
  this workstation's disabled firmware virtualization and not recommended unless that
  changes for independent reasons.
- **Architectural justification**: extends two already-existing, already-proven mechanisms
  (`codexAdapter`, `start-tha-services.ps1`'s cross-principal launch); introduces no new
  service, platform, or persistent state.
- **Exact expected files/components affected**: `delegation-adapters.mjs` (`codexAdapter`,
  and a new, small, pure helper for building the scoped launch/grant/revoke sequence, in the
  same spirit as the existing pure command builders); `start-tha-services.ps1` or a new
  sibling script following its exact existing pattern (register/run/verify/delete a scoped
  scheduled task); a new, small regression test mirroring
  `test-gate5-worker-trust-enforcement.mjs`'s existing shape.
- **Canonical owners and all consumers**: owner is `delegation-adapters.mjs`/
  `start-tha-services.ps1`, unchanged from today. Sole consumer is `codexAdapter`'s own
  Gate-5-delegation pathway (confirmed in Phase 1, item 6) — no other code path is affected.
- **Implementation scope**: Gate-5-controlled Codex delegation only. Claude, Gate 9,
  `scripts/mcp/gate5-readonly.mjs`, and any interactive/manual CLI usage are explicitly out of
  scope, unchanged.
- **Risks and mitigations**: (a) the restricted account's own Codex CLI installation/config
  must be independently verified reachable under that account (mitigation: a preflight check,
  mirroring `start-gate5-limited-task.ps1`'s own preflight pattern, before any real task is
  dispatched); (b) granting even narrow `.git`-directory read access could theoretically let
  a worker read packed history from other branches (mitigation: named explicitly as a
  residual, accepted risk — equivalent exposure already exists for Colin's own account today,
  and is not widened by this design, only inherited at a narrower scope); (c) ACL
  grant/revoke timing bugs could leave a stale grant (mitigation: the verified-removal step
  in Phase 5, item 8, with its own regression test).
- **Release timing**: no timing constraint stated by the Governance Owner; this is an
  investigation deliverable only.
- **Data impact**: none — no schema, database, or production-data change of any kind.
- **Security impact**: a net, material reduction in exposure for Codex delegation
  specifically, closing the one gap this repository's own previous report named as
  unresolved.
- **Prerequisites**: explicit, separate Governance Owner approval to implement (this task
  authorised investigation only); confirmation of which of `CodexSandboxOffline`/
  `CodexSandboxOnline` (or a newly named account) is the intended target, and for which Codex
  task types network access should ever be granted, if any; a decision on exactly which paths
  the restricted account receives a scoped grant on (this report recommends: the one
  worktree-in-use plus read-only `.git`, nothing else).
- **Gate 5/Gate 9 approval dependencies**: this is a Gate-5-internal change; it does not
  require a Gate 9 decision under today's governance text (Gate 9 governs implementation
  *execution*, and a delegated worker remains proposal-only throughout), but the Governance
  Owner may choose to require one anyway given the RED risk classification — flagged
  explicitly as a decision for the owner, not assumed either way by this report.
- **Durable rollback strategy**: a git commit/tag rollback point (the same pattern used in
  the previous two rounds) before any file is touched, plus a trivial infrastructure rollback
  (disable or remove ACL grants on the two existing, currently-unused accounts) — low
  complexity, since the accounts exist today specifically in an unused, harmless state.
- **Detailed verification plan**: Phase 6's matrix above, run for real, with OS-level evidence
  for every result, plus the existing full regression suite re-run to confirm Claude and
  local/Hermes paths remain unaffected.
- **Deployment checklist**: (1) confirm target restricted account and its Codex CLI
  configuration are independently reachable; (2) confirm the scoped-grant/revoke script
  passes a dry run against a disposable test worktree; (3) run the full Phase 6 matrix; (4)
  re-run the full existing regression suite; (5) real end-to-end acceptance exactly as the
  previous two rounds performed for Claude/Codex, now including the adversarial reads from
  Phase 6.
- **Definition of done**: COMPLETE only if every Phase 6 test produces the OS-enforced
  expected result (not a worker's text refusal), cleanup is independently verified on every
  run including a deliberately-forced failure path, the existing regression suite and both
  providers' real acceptance remain passing, and rollback is proven. Otherwise PARTIAL/
  BLOCKED, naming the exact remaining boundary — exactly the same honesty standard the
  previous two rounds' reports already applied to themselves.
- **User acceptance starting point, action, expected result, regression checks**: starting
  point is the existing `/v1/tha/investigate/start` HTTP endpoint with `allowDelegation: true`
  and a worker pinned to Codex; action is a real delegated investigation task; expected
  result is a successful, proposal-only Codex response with the restricted account's identity
  confirmed (not Colin's) for the duration of that one invocation; regression checks are the
  full existing suite plus a reconfirmation that Claude's pathway and local/Hermes paths are
  byte-for-byte unaffected.
- **Highest-risk remaining Inferred/Assumed claim**: that granting the restricted account
  read access to the shared `.git` object store does not meaningfully widen its exposure
  beyond "the one worktree it was given" — this is **Inferred**, not independently verified
  in this investigation (no isolation test was authorised), and should be the first thing the
  Phase 6 matrix (test #12 especially) actually proves or disproves once implementation is
  approved.

**Explicitly flagged as requiring separate Governance Owner approval**: implementing any part
of this design; choosing which existing account(s) to use or whether to provision new ones;
deciding whether Codex delegation should ever be permitted network access at all (i.e.
whether `CodexSandboxOnline` should ever actually be used) or whether every Codex delegation
should be `Offline`-only; whether this change requires its own Gate 9 decision despite not
being strictly required by today's governance text.

## Compliance summary

- **Architecture compliance**: this design extends `delegation-adapters.mjs` and
  `start-tha-services.ps1` only; introduces no new governance engine, manifest, service, or
  persistent state; does not touch Gate 9; does not touch Claude's already-verified
  arrangement.
- **AI compliance**: explicitly rejects prompt/instruction content (including
  `AGENTS.override.md`) as any part of the containment boundary itself — per this task's own
  instruction, and consistent with the previous round's own finding that worker compliance is
  not enforcement. The recommended design's entire security property comes from the OS
  kernel's own access-control enforcement on a Windows token, not from anything Codex is told.
- No live change was made. No account was created or modified. No ACL was changed. No service,
  scheduled task, or process was created, restarted, or stopped by this investigation (the one
  process restart referenced in Phase 2 belongs to the *previous*, separate task, not this
  one). No credential value, private file, or secret was read.

## Remaining unknowns

- The true cause of the `CodexSandboxOffline` logon at 10:48:59 today (see Phase 2) was not
  conclusively determined.
- Whether Codex's CLI, config, and plugin registrations (visible in `~/.codex/config.toml`,
  read in the previous round) are independently reachable/correct under either
  `CodexSandboxOffline` or `CodexSandboxOnline` was not tested (no isolation test was
  authorised).
- Whether `tha-integrated-dev`'s Claude-specific hooks finding has any Codex equivalent was
  not resolved (Phase 3).
- No accessible Agent Reports Knowledge Base index was found at the locations checked; this
  investigation relied on direct `Grep` searches across `Incoming\Agent Reports` and the
  Bridge repository instead.
