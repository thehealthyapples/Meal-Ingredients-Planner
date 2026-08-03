# Living Larder — Canonical Asset Discovery & Runtime Audit

**Date:** 2026-08-01
**Type:** Investigation only — no code change, no generation, no commit, no push.
**Scope searched:** the entire `C:\Users\Colin\The Healthy Apples\` workspace — every repository, worktree, branch checkout, `attached_assets`, `artifacts`, Recovery folder and implementation folder under `GitHub\`, plus `Recovery\` and `openAI\`.
**Headline:** **The highest-quality photoreal Living Larder rooms already exist.** They were produced as design-exploration outputs and never promoted into the running application. **No new room imagery should be generated** — the canonical assets exist and should be promoted into runtime.

## Method

Fast globbed the whole tree for image files, then filtered to Living Larder / Pantry material and deduplicated by content (SHA-256) and by name-across-worktrees. Metadata (dimensions, size, mtime, hash) captured for the canonical candidates. The North Star tree is duplicated across ~18 worktree checkouts (≈740 files ≈ 40 images × 18 worktrees); the *unique* meaningful set is small and is listed below.

## Inventory of Living Larder / Pantry imagery (unique assets)

### A. North Star reference masters (the signed vision) — `attached_assets/design/north_star/`
| File | Dims | Modified | Purpose | Runtime use |
|---|---|---|---|---|
| **v3/North star atmosphere pantry.png** | 1402×1122 | 2026-07-31 | **The signed "Primary Pantry visual master"** (named by `NORTH_STAR_VISUAL_ACCEPTANCE_GATE`): photoreal inhabited pantry + full UI (side nav, status strip, category cards, worktop, orchard window). | Reference only — **not** rendered |
| v3/northstar final.png | 1586×992 | 2026-07-31 | Cross-area polish/atmosphere standard (not Pantry geometry). | Reference |
| v3/pantry new.png | — | — | Later Pantry study (present in some checkouts). | Reference |
| v3/evidence/{before,after}/pantry-desktop.png | — | — | Screenshots of the **running app** pantry before/after remediation (the states D-018 judged). | Evidence |
| v2/NORTH_STAR_V2_PANTRY_DESKTOP_MOBILE.png · v1/kitchen concept*.png | — | — | Superseded earlier Pantry visions. | Archive |

### B. Photoreal EMPTY-ROOM masters (OpenAI-generated) — `tha-living-larder-v2/artifacts/living-larder-v2/openai-shell-candidates/`
| File | Dims | Modified | Purpose | Runtime use |
|---|---|---|---|---|
| **shell-candidate-07-master.png** | 1536×1024 | 2026-07-29 | The empty room shell **reinstated as directional (D-017)** — single right return, deep aperture. | Wired only on the **rejected** v2 branch (`/images/living-larder/scene/shell-candidate-07.png`) |
| shell-candidate-01…06, 08, 09, 10-master.png | 1536×1024 | 2026-07-29 | Alternative/edit empty-room shells (09/10 sill-edit variants). 10 masters total. | Unused |

### C. Photoreal FURNISHED-ROOM concepts — `tha-larder-room-remediation/artifacts/larder-room-remediation/concepts/`
| File | Dims | Modified | Purpose | Runtime use |
|---|---|---|---|---|
| **batch-01/concept-c-quiet-harvest__desktop-1536×1024.png** | 1536×1024 | 2026-07-30 | **North-Star-quality photoreal furnished pantry** — packed jar shelving, produce baskets, herbs, oils, stone worktop, orchard window, "Pantry North Star" sign, bottom nav. | Unused |
| batch-01/concept-a-orchard-workroom, concept-b-provision-cabinet | 1536×1024 | 2026-07-30 | The other two Batch-01 photoreal room concepts (`PHOTOREAL_CONCEPT_BATCH_01`). | Unused |
| batch-02/concept-{a,b,c}__food-group-bundles + CONTACT_SHEET | 1536×1024 | 2026-07-30 | Same rooms with food-group bundle presentation. | Unused |
| product-focus-01/02/…category-focus-v2, walnuts-selected + sequences | 1536×1024 | 2026-07-30 | Photoreal **interaction states** (category focus, product selected → shopping/bin). | Unused |

### D. Coded concept captures (the "seven senior concepts", LARDER7) — `tha-larder-concept-lab/artifacts/larder-concept-lab/captures/`
`concept-00-vestibule … concept-07-gallery-of-plenty` (masters + engaged, desktop 2880×1800 / mobile) + CONTACT_SHEET. Rendered **captures of coded concepts**, not photoreal AI masters. Unused by runtime.

### E. Materiality/atmosphere studies — `tha-bottom-navigation-audit` & `tha-docs-audit` `docs/ui-audit/exp4-materiality-depth/b-atmosphere-*`. Interaction/depth studies. Reference.

### F. Recovered source masters & audit — `Recovery\Replit-Docs-2026-07-28\…\THA_Living_Larder_Assets\` (jars/fruit/vegetables/joinery/rejected — the source of the approved library) and `Recovery\Living-Larder-Asset-Audit-2026-07-29\` (asset-manifest.json, ASSET_AUDIT_SUMMARY.md + contact sheets).

### G. The APPROVED runtime asset library — `client/src/assets/living-home/larder/`
27 jars (7 approved, 20 candidate), 10 joinery, 2 produce, 6 dressing SVGs. **These are what the running app actually uses** (via `larder-room.tsx` as a constructed elevation).

### H. Review/mock-up compositions (this session) — `docs/implementation/assets/larder-room-review/` (`*-experience-desktop/mobile.png`). Asset compositions; superseded by the existing photoreal rooms.

### No "Telegram-generated" images exist under the workspace (searched `*telegram*` — none found).

## Answers

**1. Which single image is the canonical Living Larder room?**
`attached_assets/design/north_star/v3/North star atmosphere pantry.png` — the signed "Primary Pantry visual master" per the Visual Acceptance Gate. Treat it as the signed drawing.

**2. Which image best represents the signed North Star?**
The same file. `northstar final.png` is a cross-area polish standard, not the Pantry. Among *realized* photoreal rooms, `concept-c-quiet-harvest` is the closest match to the signed atmosphere pantry.

**3. Which image should the application actually display?**
A **photoreal room master as the full-bleed background**, with the app's real functional UI (side/bottom nav, status strip, category cards) layered over it — the room-first composition D-018 requires. The best *existing* photoreal room to display is **`concept-c-quiet-harvest`** (or the approved **shell-candidate-07** empty shell if the household's own provisions are to be composited live). It should **not** display the current constructed PNG elevation. (Which exact room is runtime-canonical is a Home-Owner approval, not a generation, decision — the atmosphere pantry is the signed target; concept-c is the realized candidate.)

**4. Which assets already exist but are currently unused?**
Essentially all the photoreal rooms: the 10 shell-candidate masters, the 9 room-remediation concepts (batch-01/02 + product-focus), the North Star atmosphere pantry (reference only), the 7 concept-lab captures, and the exp4 atmosphere studies — **none are rendered by the running authoritative app.** Also unused: the 20 candidate jars (exist, pending approval).

**5. Which assets are duplicates?**
The entire `attached_assets/design/north_star/` tree is duplicated across ~18 worktree checkouts (~740 files). `shell-candidate-07` exists in ≥4 locations (v2 root artifacts, larder-scene worktree, concept-lab scene, dist). The recovered `THA_Living_Larder_Assets` are duplicated into `client/src/assets/living-home/larder/` (the approved library) and `attached_assets` across worktrees. `concept-c` is re-derived across batch-01/02/product-focus.

**6. Which assets should be archived?**
Unselected shell candidates (01–06, 08–10); superseded North Star v1/v2 Pantry; the OpenAI ingredient-vessel batch (already superseded by the recovered masters); this session's review compositions (asset-validation mock-ups); and the concept-lab coded captures **if** the photoreal room-remediation concepts supersede them. Keep: the signed North Star atmosphere pantry, the chosen photoreal room master, and the approved `client/src/assets/living-home/larder/` library.

**7. Why is the running Living Larder not using the best available imagery?**
The running Larder on the authoritative branch is `LIVING_LARDER_PRODUCTION_IMPLEMENTATION` — a **constructed elevation** assembled in `larder-room.tsx` from discrete jar/joinery PNGs via CSS (`--lvcm`). The photoreal room masters were produced as **exploration outputs in `artifacts/`** on *other* worktrees (`room-remediation`, `living-larder-v2`, `concept-lab`) and were **never promoted into `client/public/` nor wired into the authoritative room component.** The `v2` branch *did* wire `shell-candidate-07` as a background, but that composition was **Home-Owner-rejected under D-018** (webpage-over-room). So the best imagery exists but sits unpromoted while a different (elevation) approach ships. (This also corrects this session's earlier "room master is a missing asset" conclusion, which searched only the authoritative branch and missed the sibling worktrees' `artifacts/`.)

**8. What is the minimum work to make the running application visually match the canonical North Star?** *(No generation — the asset exists.)*
1. **Home Owner confirms the one canonical photoreal room** (the signed atmosphere pantry realized as `concept-c-quiet-harvest`, or the approved `shell-candidate-07` shell).
2. **Promote that single image** from `artifacts/` into the runtime asset location and register it in the House/Life Register with a checksum-bound approval (CB9 lifecycle — no bytes change, just promotion).
3. **Re-point `larder-room.tsx`/`.css`** to render it **full-bleed, room-first** (D-018 contract) with the functional UI over it, retiring the constructed elevation.
This is a **promotion + wiring** task, not a generation task.

## Recommendation

Establish **one** canonical Living Larder before any further generation:
- **Canonical room (signed):** `north_star/v3/North star atmosphere pantry.png`.
- **Canonical runtime room to promote (realized, existing):** `tha-larder-room-remediation/…/batch-01/concept-c-quiet-harvest` (pending Home Owner approval of that specific realization), or the approved `shell-candidate-07` shell.
- **Canonical runtime implementation:** one `larder-room.tsx` that displays the promoted photoreal room full-bleed with the functional UI over it.
- **Canonical asset library:** `client/src/assets/living-home/larder/` (jars/joinery/produce) governed by the Life Register.

**Do not regenerate any room imagery** — an equal-or-better photoreal room already exists under `GitHub\`. The next step is a Home-Owner decision on *which* existing room is canonical, then promotion + wiring — not a new image batch.
