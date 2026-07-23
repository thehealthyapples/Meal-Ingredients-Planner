# LARDER_PRODUCTION_ASSET_GENERATION — Living Larder Jar Production Masters

**Status:** DELIVERED — 27 candidate masters generated, verified and registered; **nothing approved** (Home Owner review pending)
**Date:** 2026-07-23
**Rollback identifier:** `rollback/larder-production-asset-generation-20260723` → `03578305`
**Report location:** `docs/implementation/LARDER_PRODUCTION_ASSET_GENERATION.md`
**Commit hash:** recorded in the follow-up hash-recording commit (repo precedent: `a8b22162`)

## 1. What was produced

The first production Living Larder jar asset library: **27 transparent PNG
masters** (25 ingredient jars + 1 empty shopping-state jar + 1 visual-gap-green
fallback jar) under `client/src/assets/living-home/larder/jars/`, generated in
full compliance with the `LARDER_ASSET_GOVERNANCE_FOUNDATION` (confirmed
present and 26/26 green **before** this task began), validated by the existing
verifier with **zero bypasses**, registered as **candidates** with checksums,
and laid out on an equal-scale contact sheet for Home Owner review.

**The medium, stated honestly:** the masters are **deterministic procedural
illustration approaching realism** — one parametric jar drawn from the governed
shared spec plus seeded per-family procedural contents, rasterised by Chromium
to 512×768 8-bit RGBA — not photography. This environment has no photographic
or AI-image generation capability; the generator
(`scripts/generate-larder-jar-masters.ts`) is the highest-fidelity deterministic
medium available, and it makes the shared-geometry requirement *mechanical*
(every file draws the identical jar). Whether this medium meets the
photorealistic production bar is **exactly the judgement reserved to the Home
Owner**, whom the governance lifecycle already appoints: these are candidates,
rejection is first-class, and nothing can reach runtime or an export without a
checksum-bound approval. No claim of photographic realism is made anywhere.

## 2. Requirements → how each is met

| Requirement | How it is met |
|---|---|
| 512×768 transparent PNG | Chromium `omitBackground` masters; J5 verifies exact IHDR canvas, 8-bit RGBA, decoded transparent corners, genuine alpha (~50% fully transparent pixels per file) |
| One jar per file, front-on 90° elevation, floating | Single orthographic jar per canvas; no furniture; minimal blurred contact shadow only |
| Traditional clamp-top glass jar / clear glass / brushed silver clasp / off-white seal | The one parametric jar: clear-glass body + glass lid (alpha ≈ 10–30%), silver-gradient bail + hinge plates, `#efe8d9` sealing ring |
| Soft frontal daylight above-left, minimal contact shadow | Shared daylight gradient + restrained left highlight; one soft shadow ellipse |
| Photorealistic ingredients, true scale | Per-family procedural contents at true-to-life particle scale (oat flakes ~8–12 px ≈ real proportion to a 300 px-wide jar); honest-medium caveat in § 1 |
| Representative 70% fill, never quantity, natural settling | Fill surface at 70% of interior height ± deterministic per-family settling (±8 px, inside the governed ±3%); fill declared non-semantic by the register |
| Shared geometry, no cropping differences, pixel-perfect family consistency | All geometry from one set of shared constants — identical in all 27 files by construction |
| Runtime label area blank / scalloped chalkboard / no baked wording | Governed rectangle (x106 y438 300×112) drawn as a scalloped matte chalkboard with subtle grain and **no glyphs anywhere**; J5 also rejects label-like PNG text metadata |
| No background / borders | Fully transparent ground; nothing outside the jar + shadow |
| Validate with existing verifier, no bypasses | 26/26 PASS; the two mid-task failures were **fixed at the cause, not bypassed** (§ 6) |
| Checksums calculated, candidates registered | sha256 per file recorded in `LARDER_JAR_CANDIDATE_CHECKSUMS`; records promoted `planned → candidate` **through the register's own `promoteJarToCandidate` law**, never hand-edited |
| Contact sheet, equal scale, all 27 | `docs/reference-assets/living-larder-review/larder-jar-candidate-contact-sheet-20260723.png` (all 27 at 50%) |
| No approval / no promotion to approved / no derivatives / no WebP | All 27 remain `candidate` + `unavailable`; `visualApproval: null`; PNG masters only — nothing else generated |

## 3. Architecture Compliance

- **One owner per fact:** checksums live once in the register; the review-dir
  `checksums-20260723.json` is a labelled projection. The register derives
  candidacy by applying its own lifecycle function — no second path to state.
- **Existing owners extended, nothing new:** no new register, no new verifier,
  no schema, no route, no runtime behaviour. The generator is a `scripts/`
  developer utility (repo convention: flat, kebab-case, tsx — the same class as
  the existing `capture-*.ts` Playwright scripts).
- **Honest gaps over fabricated claims (P6):** medium disclosed (§ 1); the
  in-pixel wording check remains a disclosed automation gap; candidates are
  labelled candidates everywhere (register, README, contact sheet header).
- **Home Owner authority (HOMEOWNER1):** nothing here approves anything; the
  review sheet exists to put the aesthetic verdict before the one seat that
  owns it. **AI architecture compliance:** not applicable. **Product Registry
  impact:** none (no user-visible surface changed). **Adoption Register
  impact:** none (no component/hook/token; assets have no client consumer —
  J7 enforces that none may exist while 0 are approved).

## 4. Data Impact

- Reads existing data: repository governance metadata only.
- Writes new data: 27 PNG masters, candidate checksums in the register, review materials.
- Changes meaning of existing data: no. Requires backfill: no. Business database writes: none.

## 5. Files created / changed

| File | Change |
|---|---|
| `client/src/assets/living-home/larder/jars/tha-larder-jar-*.png` | **27 new candidate masters** |
| `scripts/generate-larder-jar-masters.ts` | New deterministic generator (parametric jar + 27 family renderers + contact sheet) |
| `client/src/components/layout/living-details-manifest.ts` | Inventory renamed to `LARDER_JAR_PLANNED_INVENTORY`; `LARDER_JAR_CANDIDATE_CHECKSUMS` added; register now derived via `promoteJarToCandidate` |
| `scripts/ci/verify-living-home-assets.ts` | J6 strengthened (candidate bytes must match registered checksum); J9 self-test fixed to build its own synthetic planned record; J3 message made state-accurate |
| `client/src/assets/living-home/larder/jars/README.md` | State updated: candidates present, approval pending |
| `docs/reference-assets/living-larder-review/` | Contact sheet PNG + `checksums-20260723.json` + README (new directory) |
| `docs/implementation/LARDER_PRODUCTION_ASSET_GENERATION.md` | This report |
| `.engineering/session/runs/LARDER_PRODUCTION_ASSET_GENERATION.md`, `CURRENT.md` | Session tracking |

## 6. Verifier results (no bypasses)

Final: **26/26 PASS** (`npm run verify:living-home-assets`) — all 14
pre-existing checks unchanged and green; J1–J12 green over the real files:
J4 (27 files, lifecycle-consistent, no strays), J5 (27 files: exact canvas,
RGBA, transparent corners, genuine alpha, no baked-label metadata), J6 (27
candidates byte-match their checksums), J7/J8 (nothing reaches runtime or
exports; export set honestly `0 included / complete: false`).

Two failures occurred mid-task and were **fixed at the cause**:

1. **J6 — 24 stale checksums.** The first generation run's checksums were
   recorded, then the artwork was regenerated (clasp/lid craft fix) — J6
   correctly refused the drift. Fix: re-recorded all 27 checksums from the
   actual bytes. This failure is itself evidence the gate works.
2. **J9 — self-test assumed `records[0]` is planned.** True at the foundation,
   false the moment real candidates landed. Fix: the self-test now constructs
   its own synthetic planned record, so it exercises the full lifecycle path
   regardless of the register's real state.

Other gates: `npm run build` **PASS** (✓ built); `npx tsc --noEmit` — **zero
errors in the changed files** (the 16 pre-existing `server/tests/*` baseline
regressions remain, untouched, as recorded in the foundation report).

## 7. Manual verification and User Acceptance Evidence

- **Visual inspection during the run** (evidence: this session): single jars
  reviewed at full scale (rolled-oats, empty, mixed-nuts, fallback-green) and
  the full contact sheet reviewed. One craft defect found and fixed before
  candidacy: a stray clasp-lever stroke reading as a floating wire; the glass
  lid also gained a defining bottom rim line. All 27 regenerated after the fix.
- **Alpha probe of the acid-test asset** (empty jar): corner alpha 0; body
  centre alpha 36/255 (~14% — genuinely clear glass); 52.3% of pixels fully
  transparent. The white cast in previews is the preview backdrop, not paint.
- **Family consistency:** the contact sheet shows one identical jar 27 times —
  geometry, seal, clasp, label and shadow are byte-derived from one constant
  set; only contents differ.
- **Distinguishability:** white vs wholemeal pasta, red vs green lentils,
  black vs kidney vs cannellini beans, the four powders, and the non-food green
  fallback all read apart at 50% scale. Reviewer note for the Home Owner:
  `sunflower-seeds` sits tonally near `pearl-barley` at small scale (the
  register's curated `confusableWith` risk lists remain the authority).
- **Lifecycle**: all 27 records are `candidate`; `buildJarExportSet()` returns
  `0 included / 27 excluded / complete: false`; availability everywhere
  `unavailable` (J2/J3/J8 prove this mechanically on every run).

## 8. Trust Check

No runtime surface changed; no asset can appear anywhere until a checksum-bound
Home Owner approval is recorded; the fill is presentation-only and never
quantity; the fallback jar remains deliberately non-food; the medium is
disclosed rather than passed off as photography; and both verifier failures
during the task were repaired at their cause with the gates left stricter than
before (candidate byte-binding is now enforced, not just approved-stage).

## 9. Rollback Plan

- Tag: `rollback/larder-production-asset-generation-20260723` → `03578305`.
- To roll back: `git reset --hard rollback/larder-production-asset-generation-20260723`
  (or revert the two commits), then `rm -rf docs/reference-assets/living-larder-review`
  and delete the generated PNGs if untracked remnants remain.
- Post-rollback verification: `npm run verify:living-home-assets` returns to the
  foundation state (26/26 with all 27 records `planned`, J4 honest-vacuity).

## 10. Remaining honest gaps

1. **Home Owner review is pending** — the whole point of the candidate stage.
   Approval (or rejection, equally first-class) is a separate recorded act.
2. **The medium** is procedural illustration approaching realism, not
   photography (§ 1). If the Home Owner's bar requires photographic masters, the
   path is rejection + regeneration under a future image-capable pipeline; the
   governance (checksums, lifecycle, exports) carries over unchanged.
3. **ASSET1 21-dimension specs for the empty and fallback jars** remain
   outstanding (inherited from the foundation report). This work order
   explicitly included both in the 27 generated candidates; the ASSET1
   amendment should land before their **approval**.
4. **In-pixel wording detection** remains a disclosed automation gap, bound to
   the checksum-locked approval (inherited, unchanged).
5. Chromium rasterisation is deterministic in drawing but **not guaranteed
   byte-stable across environments** — regeneration elsewhere may yield new
   checksums, which the lifecycle handles by design (new bytes = new candidate
   checksums in the same commit; J6 enforces).

## 11. Scope Lock

Only the approved artwork generation was implemented: no runtime UI, no
approvals, no derivatives, no WebP, no ZIP export, no register/verifier beyond
the strengthening noted, no unrelated changes. SUGGESTIONs (not implemented):
the foundation report's standing list, plus — consider recording per-family
reviewer notes in the register after Home Owner review.
