---
entry: hid-devworld-prod
name: Development World in production
section: hidden-experiences
status: hidden
visibility: admin
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Development World in production

> The Development World admin card is shown to admins in production, where the
> server refuses to serve it.

## What it is

The admin dashboard shows a "Development World" card — a read-only view of the 50
Development World households — to every admin, with `status: "active"` and a link
to `/admin/development-world`. In production this card is a dead end: an admin
can see and click it, but the server refuses to serve the world, because the
Development World exists in development only.

## Where it lives

| | |
|---|---|
| Client card | `client/src/pages/admin-page.tsx#L63` |
| Server guard | `server/development-world/world-reader.ts#L43` |

## Why it is unreachable

The mismatch is between what the client shows and what the server allows. The
admin dashboard renders `ADMIN_SECTIONS` unconditionally — there is no
environment check on the Development World card, so it appears for admins in
production despite its own "(DEV only)" description. The server, however, gates
the feature: `developmentWorldAllowed()` returns
`process.env.NODE_ENV !== "production"` (`world-reader.ts#L43`), and the
companion `assertDevelopmentWorldAllowed()` throws in production. So in
production the surface is visible but not servable — clicking it reaches a server
that refuses.

## What it would take to reach it

Match the client to the server's gate. Hiding or disabling the Development World
card when the client is running against a production environment (mirroring the
`NODE_ENV !== "production"` guard the server already enforces) would remove the
dead-end card. The alternative — serving the world in production — is explicitly
refused by design.

## Related

- [[adm-development-world]] — the Development World admin surface itself

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
