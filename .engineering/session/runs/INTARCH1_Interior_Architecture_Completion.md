# Session: INTARCH1_Interior_Architecture_Completion

| Field | Value |
|---|---|
| **Session ID** | `INTARCH1_Interior_Architecture_Completion` |
| **Rollback ID** | `rollback/INTARCH1-interior-architecture-completion-20260720` → `7aa63d76` |
| **Start time** | 2026-07-20T09:05:00Z UTC |
| **Current stage** | Complete — committed (`0580ff81`), pushed; awaiting owner review |

## Objective
Complete the Interior Architecture of the house: every room to feel like part of one
home rather than a collection of pages. Visual/architectural adoption only — no
business logic, routes, permissions, AI architecture or canonical ownership.

## Rollback caveat (stated, per ROLLBACK_PROTECTION_PROTOCOL.md § 3)
The tree was **not** clean at tag time. One tracked file was modified —
`.engineering/session/CURRENT.md`, the automated Stop-hook heartbeat. The tag does
not cover it. No other uncommitted work existed.

## What was found
The material vocabulary — `--ground-plane`, `--ground-plane-border`, `--ground-blur`,
`--surface-primary`, `--surface-support`, `--shadow-support`, `--radius-ground`,
`--surface-blur` — was fully valued in both modes and had **zero `var()` consumers**
anywhere in the client, including inside `index.css` itself. `EXPADOPT1` § 5 reported
this of the ground plane alone and generously ("read only from inside index.css");
the honest count was zero, across eight tokens.

Consequence: `EXPADOPT1` gave five rooms **light** (a window), but the rooms beneath
those windows were still pages — cards on a flat canvas, resting on nothing. Blueprint
§ 5's third means of room differentiation (**material**) was unimplemented everywhere
except Home.

## What was done
1. `.room-ground` in `index.css` — the first consumer of the material vocabulary. A
   **plane, not a panel**: top-two-corner radius, top-edge-only joint, open at the
   foot, so it reads as architecture rather than as another object in the room (GEA2).
2. `ROOM_GROUND` in `app-shell.tsx` — a straight projection of Blueprint § 5.1's
   *Ground posture* column. Mounted **once**, in the shell, below the window.
3. Home resolves to `none` — § 8.2, *one ground per workspace, never nested*. Home
   already owns `.home-room`. Verified byte-identical before/after.
4. `resolveShellGround` handles `/admin` and `/profile` by path, because both resolve
   to realm `home` and would otherwise silently draw no floor.

## Correction made mid-implementation (caught by the picture, not by a check)
First build used `clamp(0px, 2vw, 2rem)` — took air at every width, narrowed the room
by 58px at 1440, and **re-introduced the Cookbook title truncation `EXPADOPT1` had
just fixed**. Now `clamp(0px, calc((100vw - 1536px) × rate), ceiling)`: air is drawn
from the surplus beyond the content column's cap and never from the measure. GEA11 as
arithmetic.

## Files modified
- `client/src/index.css`
- `client/src/components/layout/app-shell.tsx`

## Files added
- `docs/implementation/INTARCH1_INTERIOR_ARCHITECTURE_COMPLETION.md`
- `scripts/capture-intarch1-interior-architecture.ts`
- `docs/ui-audit/intarch1-interior-architecture/` (44 captures)

## Verification
- 44 captures, 11 rooms × 2 widths × before/after; the after set was opened and read.
- Probe: **before `ground=0` × 22**; after `ground=1` everywhere except Home (`0`, by
  architectural requirement).
- Home control **byte-identical** (SHA-1) before/after at both widths.
- `npm run adoption:check` — **99 · 0 · 9**, matching a baseline measured before the
  change. No failure masked, none "fixed".
- `tsc --noEmit` — zero client errors, matching baseline.
- Production build clean; `.room-ground` verified present in compiled CSS.

## Not verified
`/admin` was **not visually verified** — the harness account is a household owner,
not an administrator, so `/admin` renders the not-found room. No picture of the study
off the hall exists in this evidence set.

## Next action
Owner to review `docs/implementation/INTARCH1_INTERIOR_ARCHITECTURE_COMPLETION.md`
§ 8 (decisions requiring owner approval).
