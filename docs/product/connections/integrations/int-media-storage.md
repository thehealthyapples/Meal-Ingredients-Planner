---
entry: int-media-storage
name: Local media storage
section: integrations
status: live
visibility: developer
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Local media storage

> Where uploaded meal photos are kept — today, the local disk, which the
> code itself flags as unsafe for production.

## What it is

Local media storage is where THA keeps the meal photos a household uploads.
Today that is the server's own local disk, written to directly. The module's own
comments flag this as a production note: local-disk storage is not safe for
ephemeral filesystems or multiple instances, and object storage is the intended
future step.

## Where it lives

| | |
|---|---|
| Source | `server/lib/media-storage.ts` |

## What breaks without it

Because photos live on the local filesystem, they are lost whenever that
filesystem is recycled — a redeploy or an instance change takes the uploaded
images with it. The photo path keeps working; the durability does not.

## Known defects

- `fnd-ephemeral-media` — a defect exists here; see PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
