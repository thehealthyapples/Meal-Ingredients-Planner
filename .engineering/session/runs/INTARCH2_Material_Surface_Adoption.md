# INTARCH2 — Material Surface Adoption

**Session ID:** `INTARCH2_Material_Surface_Adoption`
**Opened:** 2026-07-20
**Type:** Interior Architecture programme. Visual only.
**Rollback:** `rollback/INTARCH2-material-surface-adoption-20260720` → `73765ff1`
**Report:** `docs/implementation/INTARCH2_MATERIAL_SURFACE_ADOPTION.md`
**Evidence:** `docs/ui-audit/intarch2-material-surfaces/` (44 room captures + 1 dialog)

---

## How this session opened

The owner re-issued the `INTARCH1` Interior Architecture brief. **The work it
described was already complete, committed (`0580ff81`), pushed and awaiting
review** — verified before touching anything, rather than re-running it. The state
described in `INTARCH1`'s report was checked against the code rather than trusted:
`.room-ground` had 7 consumers, `--ground-plane` 2, and the surface tier **0**.

That was surfaced to the owner with the fork, rather than either duplicating
finished work or silently executing the item `INTARCH1` § 8.4 had explicitly
escalated (*"should be commissioned deliberately, not slipped into a later
workstream"*). **The owner commissioned INTARCH2 — the surfaces.**

## Boundary held

No business logic, route, permission, AI architecture or canonical ownership.
Four files: `client/src/index.css`, `client/src/components/ui/card.tsx`,
`client/src/components/ui/tabs.tsx`, `docs/implementation/ux/adoption-register.json`
(+ its generated prose). `app-shell.tsx` was **not opened** — the walls are
untouched.

## The finding

73 card surfaces across eleven rooms; **0** made of the material system, at both
widths. Eight tokens valued in both modes and read by nothing. `ui/card.tsx` was
`rounded-xl border bg-card/82 backdrop-blur-md border-border shadow-none` — tinted
glass with a line drawn round it, casting nothing onto the floor `INTARCH1` laid.

## What was done

- `.surface-primary` (plaster) and `.surface-support` (the groove) in
  `@layer components` — the layer choice is load-bearing, so ~200 call-site
  overrides still win.
- `Card` adopts the primary tier. **73/73 plaster after.**
- `TabsList` adopts the support tier, retiring `bg-muted`.
- `[role="dialog"] .shadcn-card` **retired** — dead once the card became opaque, and
  it was setting the same value `--surface-primary` resolves to.
- `--shadow-support-hover`/`-press` **deliberately not adopted**: the hand already
  has an owner (`.hover-elevate`), and a second physics would be the defect.

## Verification

- 44 captures, before/after, 11 rooms × 2 widths. **The after set was opened and
  read**, not just generated.
- Home **byte-identical** (SHA-1) at both widths — the control held.
- `adoption:check` **99 · 0 · 9**, matching a baseline measured *before* the change.
  ⚠️ It went **98 · 0 · 10** mid-change (register prose drifted from its JSON);
  closed with `npm run adoption:record`, its own designed workflow. Recorded in the
  report rather than passed over.
- `tsc` **0** client errors. Production build clean; both rules verified in the
  compiled CSS with `var()` intact; retired rule verified absent.

## Known limits, stated

- 🚫 **No photograph of the support tier in use exists.** `grooves=0` in all 22
  captures — every live `TabsList` sits behind a dialog, panel or admin route the
  room walk cannot open. The rule is verified by computed style; its appearance in
  a room is not.
- 🚫 `/admin` still not visually verified (harness account is not an admin).
- **Shopping** hand-rolls its own note surface (`GEA19` fork) and gained nothing.
  **Orchard** gained nothing because it is legitimately empty for this household.

## Next action

Owner to review `docs/implementation/INTARCH2_MATERIAL_SURFACE_ADOPTION.md` § 7 —
five decisions, of which **§ 7.2 (where the support tier actually lives)** is the
one this workstream created and cannot answer for itself.
