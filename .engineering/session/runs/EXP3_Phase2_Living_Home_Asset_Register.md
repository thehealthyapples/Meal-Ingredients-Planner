# Session: EXP3_Phase2_Living_Home_Asset_Register

| Field | Value |
|---|---|
| **Session ID** | `EXP3_Phase2_Living_Home_Asset_Register` |
| **Rollback ID** | `rollback/EXP3-PHASE2-living-home-asset-register-20260722` → `d5e91dde` (annotated tag; created before any change; covers committed state only — tree clean apart from the CURRENT.md heartbeat) |
| **Start time** | 2026-07-22 |
| **Current stage** | Complete — committed on `int1-intelligence-platform`; awaiting owner acceptance |

## Objective
Build EXP3 § 13 **Phase 2** — the canonical Living Home asset infrastructure the Environmental Dressing Register is gated behind: House Register (byte-locked) + Household Life Register (empty manifest) + `verify:living-home-assets`. **Infrastructure/tooling only. No Environmental Dressing assets. No visible product change. No owner component.**

## Ordering note (recorded decision, not a blocker)
EXP3 Phase 2's gate reads "Phase 1; the verifier green on the real tree." **Phase 1 (two-orchard convergence) has NOT shipped** — both orchard.webp + orchard-bg.webp still exist. Decision: register BOTH at their real bytes (strictly more protective; makes the eventual convergence a deliberate register-row update). The "verifier green on the real tree" half is met and demonstrated.

## Checkpoints
- [x] Read required docs (README; EXP3 § 4/§ 7/§ 13; LIVINGHOME2; ED1; HOME_OWNER principles).
- [x] git status confirmed; annotated rollback tag created (`d5e91dde`) & reported before any change.
- [x] House Register `docs/implementation/assets/house-asset-register.json` — 2 orchard assets, one owner (orchard-backdrop.tsx), real sha256s; brand marks deliberately excluded (UIA § 10 owns them — no duplicate ownership).
- [x] Empty Life manifest `client/src/components/layout/living-details-manifest.ts` — full § 7.2 type shape (forbidden fields inexpressible; `binding` required = the Life/Dressing boundary) + `export const livingDetailsManifest = {}`. No consumer (mouth lands Phase 3).
- [x] Verifier `scripts/ci/verify-living-home-assets.ts` — 5 checks (§ 7.4) + empty `dressingChecks()` seam for ED2; wired `verify:living-home-assets` into package.json.
- [x] Verifier GREEN on real tree (5/5, exit 0); drift test proved it FAILs on a tampered hash (exit 1), then restored.
- [x] Adoption: empty manifest tripped the orphan gate (0 client importers, by design); recorded it in adoption-register.json as a KNOWN, owned, pending-Phase-3-adoption module (gate's sanctioned remedy); ran adoption:record to regenerate the .md.
- [x] Verified: typecheck 88 (0 client, 0 new-file); build exit 0; adoption 101·0·9 (9 failed = baseline set unchanged; +1 passing known entry).
- [x] Wrote deliverable with all 9 required sections.
- [ ] Commit; record commit hash here + dashboard.

## What shipped
- **House Register** (JSON): orchard.webp `a6da6a31…` + orchard-bg.webp `c0405f55…`, both owned by orchard-backdrop.tsx, cited (Blueprint § 6.1 / EXP1 § 8.2 / NORTH2 grade), pre-convergence noted. `extensionPoints.dressingRegister` marks the third register as a separate future artefact.
- **Life Register** (module): empty, typed, inert (nothing imports it in the client tree).
- **Verifier**: House constancy · Life well-formed · no occasion keys · one mouth · no orphans. `dressingChecks()` declared empty (ED1 § 2 Amendment 4 — built with ED2).
- **package.json**: +1 line.
- **adoption-register.json** (+generated .md): +1 known-orphan entry (the empty manifest).

## Forbidden list — confirmed absent from the diff
No Environmental Dressing register/item (bowls, flowers, pumpkins, blankets, books, candles); no room dressing; no renderer; no composition mouth/resolver; no seasonal activation; no animation; no visual/room asset; no schema/migration/route/token/component-render change. No orchard asset modified.

## Verification
- `verify:living-home-assets` → PASS exit 0 (5/5); drift test → FAIL exit 1 → restore → PASS.
- typecheck 88 (baseline; 0 client; 0 in living-details-manifest.ts / verify-living-home-assets.ts).
- build exit 0. adoption 101 passed · 0 notices · **9 failed (baseline set unchanged)**.
- Diff = 7 intended files only; no stray path.

## Next action
Owner acceptance of the register/verifier shape + the § 0.1 ordering decision. Then **ED2 — Environmental Dressing Register (empty register only)**: both prerequisites now cleared (ED1 amendments + this Phase 2). ED2 builds the empty Dressing Register + fills the `dressingChecks()` seam — still no item, no renderer, no seasonal activation, no visible change. NOT deployed.

## Blockers
None. EXP3 Phase 1 (orchard convergence) remains an independent open item (not required by the Dressing Register gate); registering both assets now makes it a deliberate future register-row update.

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
