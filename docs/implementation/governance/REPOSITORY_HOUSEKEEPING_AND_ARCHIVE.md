# Repository Housekeeping & Archive

**Type:** Implementation report
**Date:** 2026-07-24
**Scope:** Archive historical prompt pastes and unused/duplicate `attached_assets`, cleaning the directory down to only files the repository still references. No application behaviour changed.

> **Filing note.** The task brief named `docs/implementation/REPOSITORY_HOUSEKEEPING_AND_ARCHIVE.md` (the loose tree root). That location is forbidden by `REPOSITORY_CONVENTIONS.md` §4 and would fail `repo-structure-verify.sh` check #3 ("`docs/implementation/` has no loose files"). This report is therefore filed under the `governance/` workstream, matching its sibling precedent `docs/implementation/governance/REPOSITORY_HOUSEKEEPING_AND_STRUCTURE.md` (the `HOUSE2` housekeeping report). Location honours the conventions; content is unchanged.

---

## Rollback identifier

**Annotated tag `rollback/repo-housekeeping-archive-20260724` → commit `77e907d7d194ddf37d923c03da232296b4c7e5f9`**
(`77e907d7 Update project documentation and session tracking files`). Working tree was clean when the tag was created.

To roll back everything in this change:
```
git reset --hard rollback/repo-housekeeping-archive-20260724
```
Every change in this task is a pure `git mv` rename (no file content was modified), so a reset fully restores the prior state.

---

## Architecture compliance

Confirmed before and after the change (`docs/architecture/README.md` bootstrap → `REPOSITORY_CONVENTIONS.md`):

- **One canonical owner.** Every moved file has exactly one home after the move (`attached_assets/` → `archive/`). No file exists in two places.
- **No duplicate assets remain in `attached_assets`.** Verified: `sha1sum` across the 48 kept files returns no repeated content.
- **No duplicate documentation.** `repo-structure-verify.sh` "no duplicate documents" check stays green; `archive/` is outside `docs/` and its (historical) duplicate pastes are not policed by that check.
- **No duplicate prompts introduced.** Duplicate pastes were archived, not copied; the count is recorded below.
- **No runtime behaviour change.** Only files with **zero references anywhere in the tracked repository** were moved. The three runtime-relevant assets (below) were left in place. `git status` shows renames only.

### The archive/ location decision (recorded, per bootstrap)

`REPOSITORY_CONVENTIONS.md` §1 rule 1 states the root "contains only project configuration, application entry files, and standard project files." A new top-level `archive/` directory is **not** in the §2 folder-ownership table. It was created here because:

1. The task brief explicitly and repeatedly specifies `archive/prompts/` and `archive/assets/`.
2. The mechanical enforcer `repo-structure-verify.sh` inspects **files** at the root (`find -maxdepth 1 -type f`), not directories — `archive/` (a directory) does not trip it, exactly as the pre-existing non-config top-level directories `attached_assets/`, `uploads/`, `data/`, `seed/`, `public/` do not.
3. There is no sanctioned home in the conventions for raw Replit prompt pastes and pasted screenshots — they are neither reports, investigations, nor architecture.

This is surfaced rather than hidden. If the Home Owner / conventions owner prefers a different location or a conventions amendment, the change is fully reversible via the rollback tag.

---

## Stage 1 — Audit of `attached_assets`

**Total tracked files: 324** — 209 `.txt` (prompt pastes), 113 `.png` (images/screenshots), 2 `.md`.

Classification was by **reference**: for every file, its basename was searched across the entire tracked repository *except* `attached_assets/` itself. A dynamic/glob-import safety sweep (`import.meta.glob`, `require`) found none, so basename reference is authoritative.

| Class | Count | Meaning |
|---|---:|---|
| **ACTIVE** (referenced) | **15** | Referenced by the runtime app, docs, dev scripts, session runs, or agent metadata. **Kept in place.** |
| **UNUSED** (no reference) | **309** | No reference anywhere in the tracked repo. |
| — of which archived (root pastes/images) | 276 | Moved to `archive/` (see Stages 2–3). |
| — of which kept (design evidence set) | 33 | Individually uncited `.png` inside the curated `attached_assets/design/north_star/` subtree; kept (see below). |
| **DUPLICATE** | 11 image + 14 prompt groups | Content-identical files (subset of UNUSED, plus two groups whose *referenced* copy was kept). |
| **EXPERIMENTAL** | (subset of UNUSED) | The pasted concept images / `concept_pages_*` / early apple-score explorations — archived with the rest, not separately deleted. |

### The 15 ACTIVE files (kept)

**Runtime-relevant (3):**
- `attached_assets/new_single_apple_transparent_1772836544576.png` — `import` in `client/src/pages/auth-page.tsx` (bundled by Vite).
- `attached_assets/thehealthy_apples_logo_cropped.png` — `import` in `client/src/pages/auth-page.tsx` (bundled by Vite).
- `attached_assets/design/north_star/v2/ORCHARD.png` — read by `scripts/extract-orchard-palette.ts` and 11 `scripts/north4-concepts/*.html` prototypes; cited as the colour source in `client/src/index.css` and `client/src/components/layout/orchard-backdrop.tsx` comments. (The *shipped* backdrop is `/orchard.webp`; `ORCHARD.png` is the source, not bundled — but it is actively read by tooling, so it stays.)

**Cited by docs / session runs / agent metadata (12):** `The healthy apples recommneds.png`, `The_Healthy_Apples_Master_Product_Guide.md`, `orchard_background_concept_1772752768712.png`, and 9 files in `design/north_star/` (`v1/kitchen concept.png`, `v1/kitchen concept 1.png`, `v2/NORTH_STAR.md`, `v2/NORTH_STAR_V2_HOME_DESKTOP_MOBILE.png`, `v3/North star atmosphere pantry.png`, `v3/northstar final.png`, `v3/pantry new.png`, `v3/evidence/before/home-mobile.png`, `v3/evidence/after/home-mobile.png`).

### Why the `design/north_star/` subtree was kept whole (43 files)

This subtree is a deliberately curated design-history archive (`v1`/`v2`/`v3`, with `evidence/before` and `evidence/after` matched screenshot sets), not loose paste debris. 10 of its files are cited by governing/implementation docs and session runs; the remaining 33 are the uncited siblings of a matched before/after evidence set. Moving the cited ones would break inbound citations (`REPOSITORY_CONVENTIONS.md` §5 forbids citation-breaking moves for cosmetic gain); moving only the uncited siblings would vandalise an evidence set for no benefit. The whole subtree therefore stays in place.

---

## Stage 2 — Prompts archived

**209 `Pasted-*.txt` prompt pastes** moved `attached_assets/` → **`archive/prompts/`** via `git mv`.

These are raw prompt/spec pastes from prior Replit sessions (execution rules, feature briefs, audit instructions). None is referenced by any tracked file. They were kept (archived, not deleted) because they carry historical value as the platform's build history.

**Categorisation:** kept **flat** in `archive/prompts/`. The conventions' suggested categories (architecture/implementation/ui/…) map onto *reports*, not onto ad-hoc prompt pastes whose filenames are the opening words of the prompt; forcing a taxonomy here would be arbitrary. "Organise by category where appropriate" — it was not clearly appropriate.

**No scratch prompts were deleted** — none were zero-value throwaway; all are coherent prompts with historical value.

---

## Stage 3 — `attached_assets` cleaned

**67 unused `.png`** (root-level pasted images/screenshots — apple-score explorations, ChatGPT concept images, `Screenshot_*`, `image_*`, `concept_pages_*`, brand/logo explorations) moved `attached_assets/` → **`archive/assets/`** via `git mv`. All had historical/design value → archived, not deleted.

**Nothing referenced by the application was moved or deleted.** Every runtime reference was verified first (Stage 1) and re-verified after (Verification section).

**Result:** `attached_assets/` now holds **48 files** — the 15 ACTIVE files + the 33-file design-evidence remainder of the cited `design/north_star/` subtree. No internal duplicates remain.

---

## Stage 4 — Repository housekeeping (wider sweep)

| Candidate | Finding | Action |
|---|---|---|
| Duplicate images | 11 content-identical `.png` groups (see below) | Redundant copies archived; where a group's referenced copy was in `attached_assets`, only the twin moved out — so `attached_assets` is now duplicate-free. |
| Duplicate prompts | 14 content-identical `.txt` groups | All archived under `archive/prompts/`. |
| Obsolete screenshots | `Screenshot_2026-02-23_*`, `evidence/*` | Root screenshots archived; the `design/` evidence set kept whole (cited). |
| Temporary exports / old zip files | `thehappyapplesexport1.zip` (340 MB, **git-ignored**) at repo root | **Flagged, not touched** — see below. |
| Generated files | `dist/` (git-ignored, build output) | Left as-is (build artefact; release gate checks it). |
| `uploads/` | 11 tracked runtime upload files | Left as-is (runtime data). |
| Abandoned prototypes | `scripts/north4-concepts/*.html` | Left as-is — they reference `ORCHARD.png` and are dev tooling under the sanctioned `scripts/` owner. |

### `thehappyapplesexport1.zip` — flagged for the owner, deliberately not deleted

A 340 MB git-ignored full-project export sits at the repository root. It is disposable in principle (git-ignored, reproducible), but it is **the user's own data snapshot that this task did not create**, so it was **not** deleted unilaterally. Recommendation: the owner can remove it with `rm thehappyapplesexport1.zip` to reclaim ~340 MB; it has no git or runtime effect either way.

### Duplicate groups found

**Prompt (`.txt`) — 14 groups** (all in `archive/prompts/`): including a 6-copy group of `Pasted-THA-Replit-Execution-Rules-Modify-only-*`, and 3-copy groups of `…Work-in-the-most-cost-efficient…`, `…Upgrade-SmartMeal-Planner…`, and `…Implement-Pantry-as-a-first-class-feature…`; the remaining 10 are 2-copy groups.

**Image (`.png`) — 11 groups:** `apple_score_1_white_512_v4` (×3), `apple_score_2/3_white_512_v4` (×2 each), `Screenshot_2026-02-23_at_17.00.41 / 17.00.55 / 17.01.03` (×2 each), `ChatGPT_Image_Feb_23…04_20_29` (×2), `image_1771409789949/…327792` (×2), `concept_pages` (×2), and two **cross-boundary** groups where the referenced copy was kept and the twin archived:
- `orchard_background_concept_1772752768712.png` (kept, cited by `adoption-register.json`) ≡ `…1772753707742.png` (archived).
- `new_single_apple_transparent_1772836544576.png` (kept, runtime import) ≡ `master_apple_logo_1772744482850.png` (archived).

---

## Files moved / deleted

- **Files moved:** **276** (`git mv`, content-preserving renames) — 209 → `archive/prompts/`, 67 → `archive/assets/`.
- **Files deleted:** **0.**
- **Files kept in `attached_assets`:** 48 (15 ACTIVE + 33 design-evidence).

---

## Stage 5 — Manual verification

All run against the post-change working tree:

| Check | Result |
|---|---|
| All 15 ACTIVE files still present | ✓ 0 missing |
| 3 runtime-relevant assets present on disk | ✓ all present |
| `@assets/*` imports in `client/` resolve | ✓ both resolve |
| `attached_assets/…` path references in repo resolve | ✓ no *new* breakage (see note) |
| No duplicate content remains inside `attached_assets` | ✓ none |
| `repo-structure-verify.sh` — no **new** violations | ✓ byte-identical to baseline (see note) |
| `verify:release-packaging` (REL1, 5 checks) | ✓ **5 passed, 0 failed** (incl. "Asset directories fully committed" and "Build artefact complete") |
| `tsc --noEmit` | Pre-existing failures only (see note); none in any file touched here |
| `git status` is renames-only | ✓ 276 renames, 0 content changes |

**Pre-existing conditions (not caused by, and not addressed by, this task):**
- `repo-structure-verify.sh` was already red at the rollback commit on three unrelated items: loose files under `docs/implementation/` and `docs/investigations/`, and four unindexed `LIVING_LARDER_*` architecture docs. This change adds **no** new violation — the output is identical before and after.
- One stale reference, `attached_assets/North Star/kitchen concept.png` in `docs/implementation/house/NORTH1_THE_VISUAL_NORTH_STAR.md`, points at a path that **never existed** (present identically at the rollback commit). Not caused by this change.
- `tsc --noEmit` fails on pre-existing type errors in `server/tests/*`, `server/intelligence/handlers/*`, and `server/scripts/*` — none reference assets, none in a file this task touched. The production build (`script/build.ts` via esbuild/Vite) is unaffected and the REL1 build-artefact check passes.

---

## Final summary

- `attached_assets/` reduced from **324 → 48** tracked files: only the assets the repository actually references remain, plus the whole cited `design/north_star/` design-evidence subtree.
- **209** historical prompt pastes archived to `archive/prompts/`; **67** unused images archived to `archive/assets/`. **0** files deleted.
- **No duplicate assets remain** in `attached_assets`; duplicate prompts (14 groups) and images (11 groups) are recorded and preserved in the archive.
- **No runtime behaviour changed** — every change is a content-preserving rename of an unreferenced file; all runtime references verified intact; the release-packaging gate passes.
- **Rollback identifier:** `rollback/repo-housekeeping-archive-20260724` → `77e907d7`.
- One item awaits the owner's decision: the 340 MB git-ignored `thehappyapplesexport1.zip` at the root (flagged, not deleted).

**Definition of Done:** met, with two recorded caveats — the design-evidence subtree remains (kept intentionally because it is cited and curated, so `attached_assets` holds cited history plus runtime assets rather than runtime assets *alone*), and the pre-existing `repo-structure-verify.sh` reds are unrelated to this task and left for their owners.
