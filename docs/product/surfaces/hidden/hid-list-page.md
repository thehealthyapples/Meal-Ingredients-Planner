---
entry: hid-list-page
name: Quick List page (dead file)
section: hidden-experiences
status: hidden
visibility: admin
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Quick List page (dead file)

> A full voice/camera/manual list-capture screen that is not routed at all —
> superseded by Shopping but never deleted.

## What it is

`list-page.tsx` is a complete list-capture screen. It offers three ways to add
items: voice (speech recognition with a microphone button), camera (a native
`capture="environment"` photo input), and manual entry (a text area). It was
superseded by the Shopping workspace and never deleted, so the file survives but
is wired to nothing.

## Where it lives

| | |
|---|---|
| Source | `client/src/pages/list-page.tsx` (772 lines) |

There is no route. The `/list` address exists but redirects elsewhere (see
below).

## Why it is unreachable

The file is not imported anywhere in the client — no `import ... from
"@/pages/list-page"` exists. The only three occurrences of "list-page" are
comments. Separately, the `/list` route does not render this page: it redirects
to `/shopping-workspace` (`App.tsx#L238`). So there is no path, alias, or link
that reaches this screen; it is dead code, not merely unlinked.

## What it would take to reach it

A route line. Adding `<Route path="/list" component={ListPage} />` (in place of
the current redirect) and importing the file would make the whole voice/camera/
manual capture screen reachable. Given that Shopping superseded it, the deliberate
choice is more likely deletion than revival.

## Evidence

> Not imported anywhere in App.tsx; /list redirects to /shopping-workspace
> instead.

Confirmed: no importer of `list-page.tsx` exists, and `App.tsx#L238` reads
`<Route path="/list" component={() => <Redirect to="/shopping-workspace" />} />`.

## Related

- [[page-shopping-workspace]] — the Shopping workspace that superseded this

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
