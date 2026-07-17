# NORTH2 — Home Refinement (the material, the light, and the honest gap)

**Session ID:** `NORTH2_Home_Refinement`
**Started:** 2026-07-17
**Stage:** Waiting for User
**Rollback ID:** `rollback/NORTH2-home-refinement-20260717` → `8fcb3d72`
**Report:** [`docs/implementation/NORTH2_HOME_REFINEMENT.md`](../../../docs/implementation/NORTH2_HOME_REFINEMENT.md)
**Evidence:** `docs/ui-audit/north2-home/` (+ `rooms/`)

---

## Mission

Elevate Home from a polished interface to the emotional North Star. Art direction, not
engineering. Preserve every approved behaviour, architecture and governance. No workflow
change, no functionality change, no new architecture.

## Owner decisions taken (Colin Clapson, 2026-07-17)

1. **The orchard asset cannot be restored** (see finding below) → *do everything else; the asset
   comes later; treat the orchard as richly as the current one allows.*
2. **Palette warmth is platform-wide, not Home-scoped** → *warm the real tokens.*

## What landed

- **The palette.** Every pure-white surface (`--card`, `--popover`, `--sidebar`,
  `--surface-primary`) → warm plaster `42 46% 98%`. Canvas deepened to `42 28% 94%`. Ground →
  warm stone at 0.82. Support → translucent linen at 0.34. Primary border → a joint, not a ring.
  Value range narrowed and saturation now RISES toward the light. No law changed (UIA §7 fixes
  structure, not values).
- **The doors.** `--shadow-support` INVERTED: drop-shadowed card → etched recess (top lip only —
  four-sided is the disabled-input tell — plus a warm rim on the lower lip, the line a disabled
  control never has). Hover lifts out of the groove; press seats back.
- **The welcome.** `title-section` semibold 22px → `title-page font-normal` (UIA §8: "shouting in
  bold is spending the emphasis budget on the shout"). The day moved BELOW the name, out of
  uppercase. `todayLabel()` byte-untouched — still CONV1 P8's.
- **The orchard.** Graded (sat 1.28, contrast 1.06) **into the asset**: 56,986 → **51,722 bytes**
  (PX1-W3's budget improved, not spent).

## Findings (both pre-existing, neither caused here)

- 🔴 **The orchard asset is not an orchard.** All four repo copies byte-identical (md5 332f82…);
  the webp is visually indistinguishable from the 2MB PNG, so **nothing was lost and nothing can
  be restored**. It is a pale watercolour of a MEADOW — no apple trees, no rows, no blossom, no
  fruit. The reference's is a photographic apple orchard. **No CSS closes this.** Full spec for a
  replacement in report §5; it drops in with **no code change**.
- 🔴 **Five second owners of the orchard asset** — `dialog.tsx:48` (behind EVERY dialog),
  `list-page.tsx:417`, `shopping-list-page.tsx:3014`, `onboarding-page.tsx:454`,
  `shopping-workspace-page.tsx:2328`. The owner's "one asset, one owner, two shapes" and the
  register's "nothing else" are **both false**. **The gate is enforced on the wrong noun**: it
  forbids mounting the EXPORT; these use the ASSET PATH, so the check is green while the concern
  is violated. NORTH2's first grade was a CSS `filter:` and would have shipped **two orchards**;
  baking it into the asset made the fork **moot, not fixed**. Recorded as
  `orchard-environment.openMigration`. **Fixing it is architecture — not this change's.**

## Regression caught by looking

- `lg:mt-24` gave the welcome beautiful air and pushed **"Open today's plan" behind the bottom nav
  at 1440×900**. The one door is Home's whole job. Air reclaimed from dead padding ABOVE the
  greeting instead → `lg:mt-16`. Every gate was green throughout.

## Gates

- Adoption **76 · 0 · 2** — byte-identical to NORTH1's baseline; the 2 failures are pre-existing
  (`button-primitive` 539>538, `HouseholdNutritionPanel` orphan) and owned by concurrent sessions.
  **Not masked.**
- Client typecheck **clean**; `vite build` clean. Compiled CSS verified, not trusted: `--card: 42 46% 98%`
  ships; **no `--card: 0 0% 100%` survives** in light mode.
- **Platform-wide change verified beyond Home**: Planner, Cookbook, Pantry, Shopping, Dashboard all
  captured at 1440×900 and inspected — no regression. **Dark mode byte-untouched** (separate value
  set; derives from its own `--card`; shadows already `none`).
- ✅ **Code + one binary asset. No migration. No schema. No behaviour.**

## Next action

**Awaiting review.** Home's material is warm, its doors are carved into the counter, its welcome
is unhurried and its orchard is as alive as a watercolour meadow can be made.

**The one thing that would change Home more than everything in this session combined is the
asset** — report §5 holds the full spec, and it needs no code to land.

Two open items, both named and neither this change's: the **five orchard bypasses** (§6) and
NORTH1 §8's **eight undeleted arrival prototypes** (still blocked on the `time-of-day-greeting`
floor 4→2).
