# Session: LIVING_LARDER_Canonical_Experience_Refinement

| Field | Value |
|---|---|
| **Session ID** | `LIVING_LARDER_Canonical_Experience_Refinement` |
| **Rollback ID** | `rollback/living-larder-canonical-experience-refinement-20260724` → `1e0ac8ff` (branch, created before any work) · dirty-tree snapshot tag `rollback/living-larder-canonical-experience-refinement-20260724-dirty` → `3067d5c0` (`git stash create` object) |
| **Start time** | 2026-07-24 |
| **Current stage** | In progress — implementation |

## Objective
Refine the Living Larder from a web-page-shaped composition into the **canonical Living
Home room**: one believable architectural space (one camera, one perspective, one scale,
one light, one architectural language), category furniture as the navigation, the orchard
seen through a real pantry window, an intentionally-designed mobile recomposition, and a
reviewed interaction language. All existing architecture, ownership, business logic,
Shopping behaviour, Companion integration and accessibility preserved.

## Files being modified
- `client/src/pages/larder-room.tsx` — the room (composition + furniture + window + interaction).
- `client/src/pages/larder-room.css` — the room's architecture and materials.
- `client/src/pages/larder-shelves.ts` — category → furniture berth (presentation only).
- `client/src/components/layout/app-shell.tsx` — the Larder owns its own threshold + ground (the Home precedent).
- `docs/implementation/LIVING_LARDER_CANONICAL_EXPERIENCE_REFINEMENT.md` — the report.
- Product Knowledge Registry entry + adoption register, if affected.

## Checkpoints
- [x] Read `docs/architecture/README.md` + the Experience canon + `LARDER1` North Star.
- [x] Confirm git status; create rollback protection; report the identifier.
- [x] Study the approved North Star imagery (`attached_assets/design/north_star/v3`).
- [ ] Create the implementation document.
- [ ] Build the room (architecture → furniture → interaction → mobile).
- [ ] Verify (typecheck · build · asset verifier · targeted tests · screenshots).
- [ ] Complete the report; commit; push `claude-work` only. Do NOT deploy.

**Last checkpoint:** Rollback created (`1e0ac8ff` / `3067d5c0`). North Star studied.

## Next action
Build the room: architecture first (walls · window · worktop · floor), then the category
furniture, then the interaction pass, then mobile.

## Facts anchored (for resume)
- Staples = Domain 30 `user_pantry_items` / `server/storage.ts`. Shopping = Domain 15. Identity = Domain 2.
- Route stays `/pantry`; `/larder` redirects. Rename is display-only (LARDER1 § 15).
- Approved artwork only: 7 jars + 2 produce (Life Register § J/§ P) + 10 joinery (House Register).
  J7 — only `larder-room.tsx` may import the larder asset subtree. NO new image assets.
- Environmental Dressing (LIVINGHOME2 / `dressing-register.ts`) **refuses the pantry/larder
  room** for produce dressing and every admitted object excludes it via `onlyRooms`. Decorative
  props (linen, scoops, ceramic bowls, dried herbs) are therefore NOT implementable here without
  a Home Owner admission — recorded as a Suggestion, not built.
- One sun, upper-left, forever (Blueprint § 7 / TRANSLATION1 § 4) — the pantry window is on the
  LEFT, not the right as in the North Star image. Deliberate, recorded deviation.
- Orchard: one asset (`/orchard.webp`), one exposure token (`--orchard-exposure-e2`).
