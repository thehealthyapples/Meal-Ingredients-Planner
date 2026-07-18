# EXPERIENCE_VERIFY1 — Household Experience Verification

**Session ID:** `EXPERIENCE_VERIFY1_Household_Experience_Verification`
**Objective:** Restore end-to-end browser verification and prove the household experience works before further product implementation.
**Rollback ID:** `rollback/EXPERIENCE_VERIFY1-household-experience-verification-20260718` → `8e25c195`
**Stage:** Complete — awaiting owner review
**Started:** 2026-07-18

---

## Rollback

Tag on `8e25c195` (HOUSE_ACT3). Concurrent **PROD3/PROD4** work across `client/`, `server/`, `package.json` deliberately **not** captured. **No product source modified by this programme.**

## Checkpoints

- [x] Architecture Bootstrap + LAUNCH1 / PROD2 / PROD3 / PROD4 located and read for context
- [x] Rollback created and reported
- [x] Reproduced PROD2's blocker exactly (`libglib-2.0.so.0`, exit 127)
- [x] **Environment fixed** — no package install, no root, no code change
- [x] Existing suite proven unblocked (`capture-north2-rooms.ts`, unmodified, 5/5)
- [x] 7 rooms verified, 7 screenshots + `verify-results.json` captured
- [x] Caught and corrected a **false PASS** in my own harness before reporting
- [x] 7 UX defects recorded; report filed

## Headline

**Browser verification is restored — it was environmental, not architectural.** Playwright's bundled Chromium is a generic Linux binary and this Ubuntu 24.04 Replit image lacks glib/GTK. The nix store already had a fully-wired `playwright-browsers-chromium`, so the two binaries under `.cache/ms-playwright` (**gitignored**) were symlinked to it, originals preserved as `*.unusable`.

**`chromium.launch()` now works unmodified, so all ~28 pre-existing capture scripts are unblocked without editing one.**

## Results

**7/7 rooms render — 0 HTTP errors, 0 uncaught page errors.** Home is calm and welcoming; the Companion opens with real pantry-derived suggestions and the line *"nothing changes until you confirm"*.

🔴 **My harness lied first.** The initial Companion PASS was false — `verify-companion.png` was byte-identical (MD5) to `verify-home.png`; the selector had hit Home's static Companion *card*. Corrected to assert `assistant-panel` becomes visible. *A click that changes nothing is not evidence.*

## Defects (7, none critical)

D1 Planner React key warning (**not located** — reported, not speculatively patched) · D2 Shopping placeholder contrast over backdrop · D3 Shopping empty void, no empty state · D4 Home's header mark differs from the other six · D5 Nutrition shows 1/30 plants against 75 ingredients (**two honest readings, not asserted as a bug**) · D6 pantry rows clipped mid-height · D7 planner insights truncate mid-word.

**No product fix made** — every defect needed a design or architecture decision the mission placed out of bounds. Stated rather than padded.

## Next action

**Owner to review** `docs/implementation/EXPERIENCE_VERIFY1_HOUSEHOLD_EXPERIENCE_VERIFICATION.md`.

⚠️ **The fix is NOT durable** — a symlink into `/nix/store` inside a gitignored cache. It survives neither a fresh clone nor a nix GC, so **CI still cannot verify**. Recommended next: **`EXPERIENCE_VERIFY2 — Durable Verification`** (R1 declare the browser dependency, R2 discharge the three outstanding HOUSE_ACT acceptance debts now that a browser exists, R7 widen to mobile/dark/write paths). **R1 first: until the browser survives a fresh clone, the next programme can ship blind again.**
