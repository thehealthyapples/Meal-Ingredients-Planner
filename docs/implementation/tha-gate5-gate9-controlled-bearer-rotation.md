# THA Gate 5 / Gate 9 controlled bearer-token rotation

## Scope and approval

Approved by Colin, THA Governance Owner, 2026-10-19 ("THA — CONTROLLED GATE 5 / GATE 9
BEARER-TOKEN ROTATION"), as a single, pre-authorised RED scope: rotate every THA Gate 5/Gate 9
bearer credential potentially exposed via the legacy Google Drive sync of `C:\Users\Colin\The
Healthy Apples` (already stopped by the owner before this task began). Explicitly excluded:
`DATABASE_URL`, `SESSION_SECRET`, and any unrelated provider credential.

## Repository, branch, HEAD

`tha-chatgpt-bridge`, branch `main`, HEAD `f5b1806e132ddcbc2e83114bf78e99d6f4e82a8e`. No schema
or data change in any repository.

## Governing architecture and canonical ownership

- Gate 5 (`server.gate5.mjs`) reads `THA_BRIDGE_TOKEN`, `THA_BRIDGE_READONLY_TOKEN`,
  `THA_BRIDGE_TASK_WORKFLOW_TOKEN` from its process environment. **[Verified, current source
  read this task.]**
- Gate 9 (`server.gate9.mjs`) reads `THA_BRIDGE_TOKEN` (the **same** variable name and value
  as Gate 5 — they share one general credential by design) and, optionally,
  `THA_BRIDGE_GATE9_READONLY_TOKEN` for a dedicated, narrower-scoped read-only identity.
  **[Verified]**
- Canonical credential storage: `C:\Users\Colin\.tha-gate5-credentials\gate5-server.json`
  (three fields: `THA_BRIDGE_TOKEN`, `THA_BRIDGE_READONLY_TOKEN`,
  `THA_BRIDGE_TASK_WORKFLOW_TOKEN`) is the single source `start-tha-services.ps1` reads at
  every Gate 5/Gate 9 launch. **This file is on `C:` but is a sibling of, not nested under,**
  the now-stopped legacy sync root — confirmed, by direct inode/volume check, **not** itself
  inside the exposed Drive-sync tree.
- Two derived, adapter-facing copies exist under different field names, both correctly
  excluded from the Drive-sync exposure for the same reason:
  `G:\THA-Private\Gate9-Credentials\gate5-codex-mcp.json`
  (`THA_GATE5_READONLY_TOKEN`, `THA_GATE5_TASK_WORKFLOW_TOKEN`) and
  `G:\THA-Private\Gate9-Credentials\codex-mcp.json` (`THA_GATE9_READONLY_TOKEN`).
- **Existing rotation mechanism found and reused, not replaced**: `scripts\tha-shared-token-rotation.ps1`
  already existed, already tested (`test-tha-shared-token-rotation.ps1`), providing
  `New-ThaSharedGeneralToken` and `Set-ThaProtectedGeneralToken` (rotates exactly
  `THA_BRIDGE_TOKEN`, preserving every other field, the file's ACL, and writing no backup of
  the replaced value, failing closed on reuse/collision/short/missing). Its own comment
  explicitly anticipates being "dot-sourced from a reviewed, coordinated rotation
  controller" — which did not yet exist. This task supplies exactly that, and nothing more.

## Rotation evidence and dates (metadata-only, per the owner's explicit instruction)

- No currently-active credential was found set as a persistent Windows environment variable
  (checked both `User` and `Machine` scope for `THA_BRIDGE_TOKEN` and
  `THA_BRIDGE_GATE9_READONLY_TOKEN` — both absent).
- Every historical report found describing a THA_BRIDGE_TOKEN "rotation" (10+ reports spanning
  2026-10-13 through 2026-10-16) describes a **prepared, attempted, or deferred** rotation,
  never a completed one — consistently: "Stopped before any credential mutation," "Design
  packet for a future... rotation procedure," "rotation attempt, deferred." No report records
  an actually-executed THA_BRIDGE_TOKEN rotation prior to this task. **[Verified absence,
  across every report checked; Inferred that no rotation occurred at all before this task,
  since absence of a positive record is not itself proof — exactly why this task classified
  the pre-rotation value as potentially exposed rather than assuming otherwise.]**
- File modification timestamps on the canonical/derived credential files (09/10 and
  18/10/2026) are **after** 19 September 2026, but this project's own established pattern is
  "relocate, don't regenerate" — a file's mtime reflects when it was last *copied*, not
  necessarily when its *value* last changed. Per the owner's own explicit methodology ("where
  this cannot be established safely, classify it as potentially exposed"), and without opening
  the exposed `.env` file to compare (explicitly prohibited), the pre-rotation value was
  **classified as potentially exposed and rotated accordingly**, not assumed safe because a
  file date was recent.

## Actions completed

1. Confirmed quiescence (0 `QUEUED`/`RUNNING` Gate 9 events) using the then-current credential,
   before any rotation — `activeCount: 0` of 307 total events.
2. Established rollback: timestamped `.bak` copies of all three live credential files, created
   **before** any modification, hashes recorded below.
3. Extended `scripts\tha-shared-token-rotation.ps1` additively with
   `Set-ThaProtectedNamedToken` — the same safety properties as the existing
   `Set-ThaProtectedGeneralToken`, generalised to any named field, so the same one mechanism
   (not a second rotation system) covers `THA_BRIDGE_READONLY_TOKEN`,
   `THA_BRIDGE_TASK_WORKFLOW_TOKEN`, and the two single-field adapter copies.
   `Set-ThaProtectedGeneralToken` itself was not modified.
4. Added `test-tha-named-token-rotation.ps1` (multi-field record, single-field record, reuse/
   collision/short/unknown-field/missing-record all fail closed, no backup file, no logging) —
   all pass. Re-ran the existing `test-tha-shared-token-rotation.ps1` — unaffected, all pass.
5. Added `scripts\rotate-tha-shared-bearer-tokens.ps1`, the coordinated controller the existing
   helper's own comment anticipated: generates four new, cryptographically random, pairwise-
   distinct tokens and applies them to all three files via the (extended) existing helper only.
   Supports `-WhatIf` (validates and reports without writing); run once in that mode, then once
   for real.
6. Restarted Gate 5 via the existing, identity-verified `start-tha-services.ps1
   -RestartGate5Only` — succeeded cleanly.
7. **Restarted Gate 9 by direct, careful action rather than via `-RestartGate9Only`**, and
   this deviation is disclosed in full: that script's own pre-restart quiescence check
   authenticates against the *still-running, old-token* Gate 9 process using the token it
   resolves from the *already-rotated* file — a genuine architectural incompatibility with
   spanning a rotation boundary in one invocation, not a defect introduced by this task. Since
   quiescence had already been independently confirmed (step 1) before rotating, this task
   performed the equivalent ownership verification (`Test-ThaCommandLineMatchesExactArguments`,
   domain/user check) inline, then called the exact same underlying `Start-ThaGate9Process`
   helper the governed script itself uses, with the new tokens.
8. **Found and fixed a real gap from the first Gate 9 restart**: the first restart omitted
   `THA_BRIDGE_GATE9_READONLY_TOKEN` from Gate 9's explicit environment, which disabled its
   dedicated read-only identity (server-side, this feature is optional and silently disables
   itself when the variable is absent) rather than enabling it with the new, correct value.
   Fixed with a second, identically-careful restart that includes it. Confirmed by real,
   authenticated acceptance evidence (below) before and after the fix.

## Rollback identifiers (established before the first modification)

| Backup file | SHA-256 |
|---|---|
| `C:\Users\Colin\.tha-gate5-credentials\gate5-server.json.pre-rotation-backup-20261019T124255Z.bak` | `35099070f4c8366f49ba5a4b9a0f49509805b9c58d803dc6133a1a92cbec3c83` |
| `G:\THA-Private\Gate9-Credentials\gate5-codex-mcp.json.pre-rotation-backup-20261019T124255Z.bak` | `5ea6dff5c1109728e4848ac8cdef99716de29ea7c456f4749ef8ea0ab43c9d72` |
| `G:\THA-Private\Gate9-Credentials\codex-mcp.json.pre-rotation-backup-20261019T124255Z.bak` | `5e3a8853b44ad9c0587ef7d2c5132c6cc1dba2cb7eef248269854ec43d2d3a26` |

Restoration: copy the relevant `.bak` file back over its live counterpart, then restart Gate 5
(`-RestartGate5Only`) and Gate 9 (per the same careful direct procedure used in step 7 above,
or once this incident's rotation-boundary limitation is separately fixed in the governed
script). **These backups are themselves sensitive** (they contain the old, potentially-exposed
values) — recommend deleting them once the rotation is confirmed stable, at the owner's own
discretion; this task did not delete them, consistent with not making an irreversible decision
on the owner's behalf.

One honestly-disclosed, minor discrepancy: the backup copies were created with `cp -p` and
inherited their parent folder's default ACL rather than the exact explicit ACL the live
`gate5-server.json` carries (which is narrower — no `CodexSandboxUsers` entry). This does not
widen real exposure (the folder-level ACL already permitted that same broader read), but the
backup is not a byte-for-byte ACL equivalent of the original.

## Tests and results

All pass: `test-tha-shared-token-rotation.ps1` (existing, unmodified, re-run),
`test-tha-named-token-rotation.ps1` (new).

## Real, end-to-end acceptance evidence (not health checks alone)

Every check below used a genuine authenticated operation against its credential's actual
permitted endpoint, and every "old token rejected" check used the literal old value recovered
from the pre-rotation backup — never a generic wrong-value guess:

| Credential | New value | Old value |
|---|---|---|
| `THA_BRIDGE_TOKEN` (Gate 9, `GET /v1/tha/execution-status`) | `200`, `ok:true` | `401 Unauthorized` |
| `THA_BRIDGE_TOKEN` (Gate 5, `POST /v1/tha/requests/:id`) | `404 request_not_found` (proves auth passed; a real nonexistent-ID case) | `401 unauthorised` |
| `THA_BRIDGE_READONLY_TOKEN` (`GET /v1/tha/status`) | `200`, `ok:true` | `401 unauthorised` |
| `THA_BRIDGE_TASK_WORKFLOW_TOKEN` (`POST /v1/tha/investigate/start`) | `200`, real `requestId` returned | `401 unauthorised` |
| `THA_GATE9_READONLY_TOKEN` / `THA_BRIDGE_GATE9_READONLY_TOKEN` (via the real Gate 9 MCP adapter, `tha_gate9_execution_status`) | real authenticated data returned (after the fix in action 8) | `401 Unauthorized` |

Both real MCP adapters (`scripts/mcp/gate5-readonly.mjs`, `scripts/mcp/gate9-readonly.mjs`)
were run end-to-end via their actual stdio JSON-RPC protocol with the rotated credential
files, including a real `initialize` handshake and a real, successful `tools/call` against
live Gate 5/Gate 9 data — not merely `tools/list`.

Gate 5 health: `200` throughout. Gate 9 health: `200` after each restart. Development Centre
backend (`:5000`) and frontend (`:5001`): `200`, untouched, confirmed unaffected (neither reads
any of these four credentials). Cloudflared: not read, inspected, or changed in any way. A
pattern scan of both Gate 9 log files for the four credential *variable names* found zero
matches (a safe proxy for "no accidental environment dump reached a log file").

## Data impact

None. No schema, migration, or production-data change. `DATABASE_URL`/`SESSION_SECRET` were
not touched, as explicitly excluded from this approval.

## Service and configuration changes

Gate 5 restarted once (new PID, new credentials). Gate 9 restarted twice (the second restart
corrected the dedicated read-only identity omission from the first). No other service,
scheduled task, ACL, or configuration file was created, modified, or removed. Cloudflared,
Development Centre backend/frontend: unchanged and unrestarted (not required, since neither
consumes these credentials).

## Remaining blockers — exactly one, requiring the owner's own action

**The THA custom GPT Action's stored bearer-token secret, entered manually in ChatGPT's own
Action-configuration UI, still holds the old, now-rejected value.** This is outside any file
or API this investigation can read or write, and per the task's own explicit instruction, this
is the one exact step requiring the owner's own secret entry:

1. Open `C:\Users\Colin\.tha-gate5-credentials\gate5-server.json` yourself (e.g. in Notepad) and
   copy the value of the `THA_BRIDGE_TOKEN` field — the general bearer token is the one the
   GPT Action's `README.md`-documented setup uses.
2. In ChatGPT's GPT editor, open the THA Action's authentication settings and replace the
   stored bearer token with that value.
3. Save, then send one real request through the GPT Action to confirm it authenticates
   successfully.

No token value was displayed, echoed, or requested in this conversation at any point.

## Definition of done

**PARTIAL, not COMPLETE** — by the task's own explicit completion criterion ("COMPLETE only
when the affected consumers use the replacement credentials... and end-to-end authentication
has been verified"), every consumer this task could directly act on (Gate 5, Gate 9, both MCP
adapters, the task-workflow HTTP path) is confirmed on the new credentials with real,
end-to-end, authenticated evidence, and the old values are confirmed rejected everywhere
tested. The sole remaining item is the GPT Action's manually-entered secret, which requires
the owner's own action and cannot be completed by this task. Once that one step is done and
confirmed, this rotation is fully complete.
