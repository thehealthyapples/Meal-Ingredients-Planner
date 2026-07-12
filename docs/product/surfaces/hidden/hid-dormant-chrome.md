---
entry: hid-dormant-chrome
name: Dormant navigation and header components
section: hidden-experiences
status: hidden
visibility: admin
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Dormant navigation and header components

> Four fully built navigation and header components — DesktopSidebar, TopBar,
> BrandBanner and PageHeader — that no surface uses.

## What it is

Four fully built chrome components exist but no surface renders any of them:
`DesktopSidebar`, `TopBar` and `BrandBanner` (all in `nav-bar.tsx`) and
`PageHeader` (its own file). `DesktopSidebar` is explicitly described in the code
as "retired-but-retained ... kept dormant for safe rollback." The other three
are dormant by the same evidence — exported but never rendered. `PageHeader` is
not even labelled retired.

## Where it lives

| | |
|---|---|
| Source | `client/src/components/nav-bar.tsx` (TopBar #L384, BrandBanner #L570, DesktopSidebar #L590) |
| Source | `client/src/components/PageHeader.tsx#L143` |

## Why it is unreachable

None of the four is rendered as JSX anywhere: searches for `<DesktopSidebar`,
`<TopBar`, `<BrandBanner` and `<PageHeader` return nothing. The canonical
navigation is `BottomNav` on all screen sizes (`nav-bar.tsx#L35-37`), which
displaced the desktop sidebar. `PageHeader` has zero importers.

## What it would take to reach it

A render site each. Any of these could be revived by rendering it in the shell —
but they are retained deliberately for rollback, not pending release. See the
known defect below for the retirement-hygiene issue.

## Known defects

- `fnd-unretired-predecessors` — predecessor components kept in the tree without
  being fully retired. See PDA1.

## Evidence

> nav-bar.tsx itself calls them "retired-but-retained ... kept dormant for safe
> rollback"; PageHeader has zero importers and is not even labelled retired.

Confirmed. `nav-bar.tsx#L35-37` reads: "ONE ordered list is the single source of
truth for every navigation surface (the canonical BottomNav on all screen sizes,
and the retired-but-retained DesktopSidebar kept dormant for safe rollback)."
The verbatim "retired" label names only `DesktopSidebar`; `TopBar` and
`BrandBanner` are dormant by the same evidence (no importers, no JSX) but are not
explicitly labelled retired. `PageHeader.tsx` has no importer and carries no
retired or deprecated note.

## Related

_None._

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
