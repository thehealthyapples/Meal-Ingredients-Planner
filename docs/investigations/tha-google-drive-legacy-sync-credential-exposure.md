# THA Google Drive legacy sync — confirmed live-credential exposure

**Status: URGENT. Read-only investigation only. No Drive setting, file, permission, account,
credential, or ACL was changed. No credential file's contents were opened at any point — every
claim below is from Google Drive's own sync-metadata database (file size, modified time, and
Drive's own internal version counters), never from the files themselves.**

## Scope and approval

Found during Phase 1 of "THA — DEVELOPMENT INFRASTRUCTURE COMPLETION" (Colin, Governance
Owner, 2026-10-19), which asked specifically whether the Google Drive sync covering
`Incoming\Agent Reports` might expose excluded reports. The investigation found something more
serious: a **second, independent, legacy sync root** that the entire Knowledge Base
classification system has no visibility into at all, and which contains live credential
files already confirmed fully uploaded to Google Drive. Per the Governance Owner's explicit
instruction on being told this, all other planned work for this task (automatic report
collection, Codex isolation) was stopped so this could be written up as its own, prioritised
report.

## Existing configuration and confirmed exposure (Verified, not Inferred)

Google Drive for Desktop (account folder
`C:\Users\Colin\AppData\Local\Google\DriveFS\116877340072218088282\`) maintains its own local
SQLite sync-state database, `mirror_sqlite.db`, with a `mirror_item` table recording, per
synced file: local path, Drive's own cloud copy's size/mtime, and local/cloud version
counters. Reading this database (read-only connection, `mode=ro`) is how every claim below was
established — not by inspecting file content, not by inference from folder names.

That database records **two separate, independently-configured sync roots**, not one:

| Root display name | Confirmed local path | How confirmed |
|---|---|---|
| "Agent Reports" | `G:\The Healthy Apples\Incoming\Agent Reports` | Exact match on both the real NTFS volume GUID (`{7057ceb6-0000-0000-0000-080000000000}`, G:'s actual volume, via `mountvol`) and the real NTFS file ID (`fsutil file queryfileid`) — not assumed from the folder name alone. |
| "The Healthy Apples" | **`C:\Users\Colin\The Healthy Apples`** | Same method: exact volume-GUID and file-ID match against C:. **This is the legacy project root referenced throughout `PROJECT_GOVERNANCE.md` as "previous source worktrees" — a folder this project's own governance already treats as historical, not as the authoritative, currently-worked-in tree.** |

The `C:\Users\Colin\The Healthy Apples\` tree being an active Drive sync root is itself new
information — nothing in this project's prior investigations (including the two immediately
preceding agent reports on Agent Report collection and Google Drive-adjacent topics) had
identified it.

**That tree contains five real `.env` files (not `.env.example` templates), and Drive's own
sync-state database confirms every one of them is fully, successfully uploaded to the cloud**
— `local_size` exactly equals `cloud_size`, `local_mtime` exactly equals `cloud_mtime`, and
`cloud_version` is ahead of `local_version` for each (Drive's own marker that the cloud copy
reflects a completed upload, not a pending or partial one):

| File | Size (bytes) | Sync status |
|---|---|---|
| `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\.env` | 246 | **Fully synced** |
| `C:\Users\Colin\The Healthy Apples\GitHub\tha-integrated-dev\.env` | 468 | **Fully synced** |
| `C:\Users\Colin\The Healthy Apples\GitHub\tha-living-larder-authoritative\.env` | 670 | **Fully synced** |
| `C:\Users\Colin\The Healthy Apples\GitHub\tha-living-larder-v2\.env` | 283 | **Fully synced** |
| `C:\Users\Colin\The Healthy Apples\GitHub\tha-living-larder-v2\.claude\worktrees\larder-assets\.env` | 179 | **Fully synced** |

No file's content was opened to produce this table — only `fsutil file queryfileid` (a file
identity lookup) and a read-only query against Drive's own metadata database. **[Verified]**

**What this almost certainly means** (**Inferred**, not independently confirmed by opening any
file): given everything established in this session about how `tha-chatgpt-bridge`,
`tha-integrated-dev`, and the living-larder backend are configured, these `.env` files very
likely contain the real `THA_BRIDGE_TOKEN`/`DATABASE_URL`/`SESSION_SECRET`-class values this
project has spent considerable effort protecting elsewhere (credential relocation to
`G:\THA-Private\`, profile-protected folders, ACL hardening). Whether the *specific current,
still-valid* credentials are among them, versus older/rotated/superseded values, was not and
should not be determined by opening these files — that determination itself belongs to
whoever responds to this report, ideally by treating every value in them as compromised,
exactly as this project's own established practice already does for any other confirmed or
suspected exposure.

## What is explicitly NOT yet known (Remaining unknowns)

- How long this C: sync root has been configured, and therefore how long these files have
  been exposed — Drive's local metadata does not retain a creation history for the root
  itself in a way this investigation extracted.
- Whether these specific files were the subject of any PRIOR session's credential-rotation
  work (several `.env` files elsewhere in this same C: tree are themselves old/historical —
  the governance text explicitly calls the whole C: tree "previous source worktrees" — so
  "exposed" does not necessarily mean "currently live and trusted," only that it has been
  present in cloud storage without ever going through this project's classification/exclusion
  system).
- Whether any *other* file type beyond `.env` in this same C: tree (private keys, other
  credential-shaped files) is similarly fully synced — this investigation searched
  specifically for `.env`/credential/gate5/gate9-named files and found these five; a broader
  sweep was not performed, by design, to keep this report narrow and immediately actionable
  rather than delaying it further.
- Whether this C: sync root is still actively watched/uploading right now, or was a one-time
  historical sync that has since been effectively dormant (the files' `.tmp.driveupload`/
  `.tmp.drivedownload` staging folders exist at the tree root, consistent with active sync
  machinery, but this was not conclusively timed against the present moment).

## Canonical owner

Google Drive for Desktop's own sync configuration is a **Windows-account-level, Colin-owned**
setting — not something any THA governance document assigns ownership of today (confirmed:
neither `PROJECT_GOVERNANCE.md` nor `AGENTS.md` mentions Google Drive sync configuration at
all). The **content** of the exposed files (THA credentials) is owned by whichever governed
mechanism issued them (Gate 5/Gate 9 credential provisioning, documented elsewhere in this
project's `docs/implementation/GATE5_CREDENTIAL_RELOCATION_*`/`GATE9_CREDENTIAL_RELOCATION_*`
reports).

## A/B/C repair options

**A. Remove the C: folder from Google Drive's sync scope (stop syncing it going forward).**
Addresses future exposure immediately. Does **not** remove the files already uploaded to
Drive's cloud copy — those remain in Drive (and in Drive's trash/version history, depending on
Drive's own retention) until separately deleted there. Lowest local complexity; requires
Colin's own action in the Drive for Desktop UI (Preferences → the specific synced folder →
remove), since this investigation was not authorised to change sync settings itself.

**B. A + explicitly delete the already-uploaded copies from Google Drive itself** (not just
stop future sync). Fully closes the exposure, but deleting from Drive is itself an action with
its own blast radius (affects Drive's version history/trash for that file; needs confirming
nothing else depends on those specific cloud copies) and was explicitly out of this
investigation's authority to perform.

**C. A + B + treat every credential value in the five identified files (and any sibling `.env`
file not yet individually checked) as compromised and rotate it**, following this project's
own already-established credential-recovery/rotation discipline (the same process used for the
prior Gate 9 bearer-token and database-credential incidents recorded in this project's own
Knowledge Base). This is the only option that closes the exposure **and** removes any residual
risk from the exposure having already occurred, rather than only stopping it from continuing.

## Recommended approach

**C**, specifically because this project's own established practice (visible throughout the
Knowledge Base's held-report review: "treat the token as compromised" language recurring
through roughly a dozen reports) already treats *any* confirmed exposure of a live credential
as grounds for rotation regardless of how briefly or how it occurred — a credential sitting
fully synced in Google Drive for an unknown, possibly extended period is at least as serious as
the prior exposures that triggered that standing practice. A and B alone leave the
already-exposed values live and trusted indefinitely.

## Data impact

None directly (no schema/data change). Indirectly: if `C.` is approved and a database
credential is among the rotated values, that follows this project's own existing
database-credential-rotation procedure, not a new one.

## Release timing

Urgent — recommend immediate Governance Owner attention, ahead of the rest of this task's
originally-planned scope (Phase 2 automatic collection, Phase 3 Codex isolation), exactly as
instructed when this finding was raised.

## Rollback

Not applicable to the *investigation* itself (nothing was changed). For whichever repair
option is approved: removing a folder from Drive's sync scope and rotating a credential are
both themselves reversible in the ordinary sense (a folder can be re-added to sync; a rotated
credential can be re-issued again if needed) but are **not** "undo" operations in the git/file
sense — they should be executed under this project's own existing credential-rotation runbook
discipline, with the same durable-identifier and verification standard as any other RED
change.

## Verification plan (once a repair option is approved)

1. Confirm, via the same `mirror_sqlite.db` read-only method used here, that the C: folder no
   longer appears as an active sync root (if Option A/B/C is applied).
2. If credentials are rotated, confirm every consumer (Gate 5, Gate 9, the living-larder
   backend, any MCP/plugin configuration referencing the old value) is updated, using this
   project's own existing consumer-enumeration discipline from its prior credential-relocation
   work.
3. Re-run the same filename/metadata sweep performed here against the C: tree to confirm no
   other credential-shaped file remains in an actively-synced state.

## Deployment checklist

1. Colin confirms which option (A/B/C) to proceed with.
2. If B/C: identify every current consumer of each credential before rotating (reuse the
   existing consumer-enumeration method from the prior Gate 5/Gate 9 credential-relocation
   reports).
3. Rotate/relocate per this project's existing runbook; never regenerate a credential that can
   instead be relocated/reused, per this project's own standing practice, unless rotation is
   specifically required because the value itself (not just its storage location) is
   considered compromised.
4. Remove/adjust the Drive sync scope.
5. Re-verify per the verification plan above.
6. Record the outcome as its own signed agent report.

## Architecture and AI compliance

No new governance engine, classification system, or collector was introduced or proposed to
be introduced. This finding does not require, and this report does not propose, any change to
the existing Knowledge Base classification system — the gap is that an entirely separate,
unrelated sync root exists outside that system's scan scope, not that the classification
system itself is flawed.

## Definition of done for this report

This report's own job — surfacing the finding with enough confirmed, metadata-only evidence to
be immediately actionable — is **COMPLETE**. The underlying security exposure is **NOT**
resolved and requires Colin's explicit decision on A/B/C before any repair proceeds.
