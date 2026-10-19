# Living Larder — 3D Milk POC Decision (RED)

**STATUS: READY FOR DECISION** — but with one **CRITICAL blocker**: the app currently
does **not compile** (see §2), introduced by the interrupted POC edit. No option may be
implemented, and the app cannot run, until that is resolved with your approval.

Author: Claude · Date: 2026-08-05 · Risk: 🔴 RED (rendering architecture + dependency change)
Worktree: `tha-living-larder-authoritative` · Branch: `feat/living-larder-authoritative` · HEAD `0f59b189`

> **Do not implement until the Home Owner approves one option after reading this.**

---

## Header

- **PROJECT ROOT:** `C:/Users/Colin/The Healthy Apples/GitHub/tha-living-larder-authoritative` (matches expected)
- **BRANCH:** `feat/living-larder-authoritative` (matches expected)
- **HEAD:** `0f59b189bc6e548c2fc956e6a5cc23a850ec36a0`
- **CURRENT CHANGES:** uncommitted working tree — pre-existing Living Larder fridge work **plus** newly-introduced 3D POC scaffolding (mixed; classified in §3)
- **3D DEPENDENCIES ADDED:** **YES** — `three@^0.169.0`, `@react-three/fiber@^8.18.0`, `@react-three/drei@^9.122.0` are in `package.json` and `package-lock.json`, and installed under `node_modules/` (with transitive deps `three-stdlib`, `three-mesh-bvh`, `zustand`, `fflate`, `scheduler`).

---

## 1. REPOSITORY STATE

- `git rev-parse --show-toplevel` → the expected worktree root ✔
- `git branch --show-current` → `feat/living-larder-authoritative` ✔
- `git rev-parse HEAD` → `0f59b189…` (commit "Fridge: remove glass reflections… soften seams")
- `git worktree list` → 18 worktrees off `Meal-Ingredients-Planner` (main repo). **Only this worktree was touched.**
- Tracked modifications (`git diff --stat`): `client/src/App.tsx (+2)`, `client/src/pages/living-home-room.tsx (±46)`, `client/src/pages/living-home-room.css (±19)`, three fridge PNGs, one evidence PNG, `package.json (+3)`, `package-lock.json (+736)`.

Exact dependency change (`git diff -- package.json`): added `@react-three/drei`, `@react-three/fiber`, `three`.
`package-lock.json` grew ~736 lines (the three libs + transitive tree).

---

## 2. CHANGES CLAUDE ALREADY MADE  ⚠️ INCLUDES A CRITICAL BREAKAGE

| File | Change | Class |
|---|---|---|
| `package.json`, `package-lock.json` | Added 3 runtime deps (three, r3f, drei) + transitive tree | **New 3D POC** |
| `node_modules/` | `npm install` of the above (ran; install scripts left pending per npm warning) | **New 3D POC** |
| `client/src/pages/poc-milk3d.tsx` | New file — r3f Canvas, lathe glass bottle, milk, cap, ContactShadows, OrbitControls, Environment preset | **New 3D POC** |
| `client/src/App.tsx` | Added `<Route path="/poc-milk3d" component={PocMilk3d} />` **but the `PocMilk3d` import was never added** | **New 3D POC — BROKEN** |
| `scripts/gen-fridge-milk-svg.ts` | SVG milk generator (superseded, abandoned approach) | Temporary diagnostic |

### 🔴 CRITICAL: the app does not compile
`App.tsx:305` references `PocMilk3d`, which is **not imported/declared**. This is a
`ReferenceError` / TS error that breaks the entire client build — **all** pre-existing
Pantry/Fridge work is currently unreachable in the running app. This was caused by the
interruption landing between the route edit and the import edit. **Per your instructions I
have not modified it.** The minimal safe restore is in §11 and needs one word from you.

---

## 3. PRE-EXISTING WORK THAT MUST BE PRESERVED

Classified; **nothing to be discarded.**

**Pre-existing Living Larder work (this session, before the POC):**
- `client/src/pages/living-home-room.tsx` — fridge item layout (owner-specified: door drinks, right-door sauces, top-shelf jars, cheese/cream shelves, crisper produce), positions, shadow prop wiring.
- `client/src/pages/living-home-room.css` — contact-shadow rework, occlusion band re-tuning, `--fridge-step` zoom, **plate cache-bust `?v=arrival2`**.
- Modified assets: `tha-fridge-milk.png`, `tha-fridge-juice.png`, `tha-fridge-yoghurt.png` (installed + gash-repaired).
- Untracked assets: `tha-fridge-apple-juice / bbq-sauce / cheddar / cream / eggs / jalapenos / olives .png` (photoreal AI products, in use).

**Generated output (safe to keep or prune, not code):**
- `artifacts/living-home-fridge-products/`, `artifacts/living-home-environment-plates/*`, `artifacts/rollback/`, `docs/implementation/pantry-final-evidence/*.png`.

**Temporary diagnostics:** `artifacts/_fridge-full.html`, `artifacts/_juice-tilt.html`, `scripts/preview-fridge-full.ts`, `scripts/preview-juice-tilt.ts`, `scripts/generate-fridge-product.py`, `scripts/gen-fridge-milk-svg.ts`, `docs/.../juice-tilt-*.png`, `.../proto-milk.png`, `.../fridge-full-offline.png`. Note one mis-named file literal: `docs/implementation/pantry-final-evidence/juice-tilt-${tilt}.png` (a shell-expansion artefact) — harmless, deletable.

**Uncertain:** `tha-fridge-milk-svg.png` (abandoned SVG approach output) — retain until decision.

**Safest isolation:** the pre-existing Living Larder work and the 3D POC are cleanly
separable by path — the POC touches only `package.json`, `package-lock.json`,
`node_modules/`, `poc-milk3d.tsx`, and 2 lines of `App.tsx`. **No pre-existing file needs
to be touched to remove the POC.** A preservation tag is recommended before any change:
`git tag rollback/pre-3d-poc-2026-08-05` (points at working state; created only on your go —
tags don't absorb working-tree changes, so this is safe but I have not run it).

---

## 4. GOVERNING ARCHITECTURE

Sources: `docs/architecture/LIVING_HOME_CANONICAL_PRODUCTION_ASSET_ARCHITECTURE.md` (the
LOCKED constitution), `LIVING_HOME_DESIGN_CONSTITUTION.md`, `LIVING_LARDER_ARCHITECTURE.md`,
`docs/investigations/LIVING_HOME_STAGE_AND_INTERACTIVE_PROPS_ARCHITECTURE.md`.

- **Rendering model — Verified.** Every Working Position is a *fixed camera inside the one
  room* (§8.2). The scene is an **Environment Plate (still photograph) + Living Objects that
  composite into it**. Plates crossfade in 2D ("stepping closer, never a page flip", §8.6).
- **Camera Acceptance Test — Verified (§8.3, l.283):** *"if it could not be a photograph
  taken from a different spot in the one room, it is rejected."* Lighting is **fixed (one
  morning, light from camera-right)** and is the **mandatory object-lighting spec** so every
  object composites into the same room.
- **Camera Truth — Verified (§8.1.2):** "A camera records reality. It never invents it."
- **LOCKED — Verified (§7, §14):** the Living Home Concept, Architecture, Working-Position
  Architecture, Navigation, **Living Object Model**, Shopping Intent and Companion are
  **🔒 LOCKED (2026-08-04)**. *"Architecture now gives way to craftsmanship… No further
  architectural redesign unless a genuine deficiency is first demonstrated."*
- **3D / WebGL — Verified absence.** A full-text search of `docs/architecture/` for
  `webgl | three.js | three-fiber | real-time 3d | glb | gltf | game engine` returns **zero
  hits.** A runtime 3D layer is **not contemplated** by the locked constitution.

**Ownership:**
- Canonical owner of the room / plates / cameras: the **Living Home Production Asset
  Architecture** (Environment Plates, Cameras, Lighting are governed production assets). *Verified.*
- Canonical owner of Living Objects: the **Living Object Model (LOCKED)**; runtime instance
  is `FRIDGE_OBJECTS` in `living-home-room.tsx`, rendered by `LivingObject`. *Verified.*
- Canonical owner of asset rendering: **2D DOM composite** — CSS background-image plate +
  absolutely-positioned transparent-PNG objects + CSS occlusion/shadow. *Verified (code).*
- Consumers of the fridge object representation: the `LivingObject` render, **dnd-kit
  drag-and-drop** (to Shopping / Companion / Bin), the `removed`/bin removal path, hover/label
  affordances. Any change to object representation must keep all of these working. *Verified (code).*

**Permitted / prohibited / unspecified:** Adding a runtime WebGL/three.js rendering layer is
**unspecified but out-of-model** — it replaces the photograph-composite model with a live-render
model the locked constitution does not describe, so it constitutes an **architectural redesign**,
which §14 prohibits *"unless a genuine deficiency is first demonstrated."* No such deficiency has
been demonstrated (see §5). **Drift: pursuing Option C without owner sign-off conflicts with the
LOCK.**

---

## 5. ROOT CAUSE ASSESSMENT

I tested my own premise against evidence and it **does not hold**.

| Claim I made | Verdict | Evidence |
|---|---|---|
| 1. Flat assets *necessarily* can't sit on the fridge shelves | **FALSE** | The pantry jars are flat transparent PNGs and sit convincingly — because they are shot at the pantry camera. The architecture's *entire* model is flat objects composited as photographs. |
| 2. Problem *requires* true 3D | **FALSE / unproven** | The defect is reproducible as a 2D camera mismatch; no evidence a 2D fix fails. |
| 3. React-three-fiber is the lowest-cost solution | **FALSE** | It is the **highest**-cost (new rendering stack, bundle, GPU, mobile, dnd-kit re-integration). |
| 4. One 3D object coexists cleanly with the 2D room | **Doubtful** | A live-rendered object beside a still photo introduces a second lighting/edge model → new seam risk. |
| 5. 3D vessels solve the mismatch without a new mismatch | **Doubtful** | A perfectly-lit 3D object still has to match a *fixed photograph's* camera & light; mismatch just moves. |
| 6. The plate camera/geometry/light can be reproduced in a separate 3D scene | **Unverified** | FOV/height were **never recorded** (§8.2 notes them as "to be measured & locked"). Reproducing an unmeasured camera is guesswork. |

**True root cause (Verified/Inferred):** the fridge object PNGs were generated **front-on
(eye-level catalogue)**, but the fridge Working Position camera looks **slightly down onto
receding shelves**. That is a **wrong object-camera / perspective mismatch**, compounded by
**no baked contact shadow** and **object lighting not matched to the room's fixed camera-right
light**. It is *not* an inherent 2D limitation and *not* a background-plate limitation.

Distinguished failure modes: **wrong object camera** ✅ primary · **wrong contact point / no
baked shadow** ✅ secondary · **wrong lighting** ✅ secondary · wrong scale/mask ➖ minor ·
inherent-2D ❌ · inherent-plate ❌.

This is exactly what the **Camera Acceptance Test** exists to catch. The architecture already
prescribes the fix: make each object pass the test (or change the camera). No new tech needed.

---

## 6. OPTION A — Perspective-matched 2D assets  *(architecture-compliant)*

Generate/render each object at the **fridge camera** (front face square, viewed slightly from
above so a sliver of top shows), with **room-matched lighting (camera-right)** and a **baked
soft contact shadow**, as transparent PNG Living Objects. Optionally also make the fridge
camera itself more front-on (a legitimate new Camera per §8.2) so objects sit even more easily.

- Visual fidelity: **High** — matches the jars' proven look; passes the Camera Acceptance Test.
- Interactivity: **Unchanged** — same transparent-PNG Living Objects; dnd-kit untouched.
- Asset cost: **Low–moderate** — image regeneration (£~0.19/item) *or* free if produced via the
  existing SVG/procedural jar pipeline for vessels.
- Performance / responsive / mobile: **Unchanged** (no new runtime).
- Complexity: **Low** — no architecture change; craftsmanship only (per §14).

## 7. OPTION B — Pre-rendered 3D → 2D Living Objects  *(architecture-compliant)*

Model/source objects in 3D, render them **offline from the fridge camera** with matched light
+ baked shadow, then ship the resulting transparent PNGs into the **existing 2D runtime**.

- Visual fidelity: **Highest achievable** for hero/organic items (true form, refraction).
- Interactivity: **Unchanged** (still 2D PNGs).
- Asset cost: **High** — needs a 3D pipeline/models; **no 3D-model generator is available in
  this environment** (only OpenAI images); organic produce would need sourced/paid GLBs.
- Performance / responsive / mobile: **Unchanged** (offline render; runtime stays 2D).
- Complexity: **High** offline, **zero** runtime; keeps the locked model intact.

## 8. OPTION C — Runtime WebGL / react-three-fiber objects  *(out-of-model)*

A live 3D scene renders fridge contents in the browser.

- Architectural impact: **Replaces the photograph-composite model** → redesign the LOCK forbids
  without demonstrated deficiency. **Non-compliant as things stand.**
- Bundle size: **+~150–600 KB gzip** (three + r3f + drei + transitive). *Inferred, not measured.*
- Rendering cost: continuous GPU/rAF; **mobile frame-rate & battery risk**. *Inferred.*
- Accessibility: canvas objects aren't DOM → keyboard/AT affordances must be rebuilt.
- Browser support: WebGL2 broadly available but variable on low-end mobile. *Inferred.*
- Coexistence with dnd-kit drag: **hard** — dnd-kit is DOM; 3D picking/drag is a separate system
  → the locked drag-to-Shopping/Companion/Bin flow would need re-plumbing.
- Responsive scaling: manual (camera/viewport) vs today's CSS.
- Produce pipeline: still needs 3D models — **the same blocker as B**, now at runtime.
- Slippery slope: one 3D object beside a 2D plate looks wrong under one light; "fixing" it tends
  to pull the **whole room** toward 3D — i.e. re-architecting the locked Living Home.
- Testing/maintenance: new stack, new failure surface, ongoing three/r3f version churn.

---

## 9. RECOMMENDATION

**Adopt Option A. Do not pursue Option C. Reserve Option B only for specific hero/organic items
if A proves insufficient after a fair attempt.**

Rationale: the demonstrated defect is a **2D camera/lighting/contact mismatch**, which the
**locked** architecture already governs via the Camera Acceptance Test — a **craftsmanship**
problem (§14), not an architecture problem. Option C is the highest-cost path, is **out of the
locked model**, carries real mobile/accessibility/coexistence risk, and does **not** actually
remove the produce blocker. "Highest technology" here is **not** highest fidelity: the jars prove
that correctly-shot flat objects already meet the bar.

**Therefore: revert the 3D POC scaffolding and dependencies (§11), fix the compile breakage, and
re-approach the fridge as Option A.**

---

## 10. POC PASS/FAIL CRITERIA  *(only if the Owner still elects Option C)*

Isolation requirements: one milk object only · **dev-only feature flag** (e.g.
`import.meta.env.DEV && flag`) · does **not** replace the fridge path · no production behaviour
change · no Living-Object data-ownership change · no schema/data change · dnd-kit outside the
test untouched · **lazy-loaded** chunk · measured bundle + runtime · complete removal path · no
production data · **£0 image credits** · tested at desktop **and** mobile viewports.

Pass/fail (all must pass): visibly **rests** on the shelf · perspective **matches** the fridge
plate camera · lighting **belongs** to the room (camera-right) · **no floating** · **no
compositing seam** against the plate · interaction (select/drag) remains usable · **≥30 fps on a
mid mobile** · **bundle increase within an agreed budget** (proposed ≤200 KB gzip lazy) ·
**removal restores the exact prior bytes** (git clean).

---

## 11. ROLLBACK PLAN  *(awaiting approval — not executed)*

Ordered, reversible, touches **only** POC files:

1. `git tag rollback/pre-3d-poc-2026-08-05` (preservation marker; optional).
2. Restore `App.tsx` to remove the 2 added lines → **fixes the compile breakage immediately**
   (`git checkout -- client/src/App.tsx` restores it to committed state; the file had **no other
   pre-existing edits this session**, verified — so this is safe and loses no other work).
3. Delete `client/src/pages/poc-milk3d.tsx` and (if abandoned) `scripts/gen-fridge-milk-svg.ts`,
   `tha-fridge-milk-svg.png`.
4. Remove deps: `git checkout -- package.json package-lock.json` then `npm ci` (or
   `npm uninstall three @react-three/fiber @react-three/drei`) to prune `node_modules/`.
5. Verify: `git diff -- package.json package-lock.json App.tsx` is empty; app compiles; the
   pre-existing Living Larder diff (tsx/css/assets) is **unchanged**.

**Minimal urgent variant (to un-break the app now):** step 2 alone restores compilation; deps can
stay installed harmlessly until a full revert. **I will run nothing here without your word.**

---

## 12. DATA IMPACT

**None.** No schema, migration, API, or data-ownership change. `FRIDGE_OBJECTS` remains the
runtime Living-Object list; the Living Object Model (LOCKED) is untouched. The POC uses no
production data.

## 13. PERFORMANCE IMPACT

- Option A / B: **none at runtime** (2D unchanged).
- Option C: adds three+r3f+drei to the bundle (**~150–600 KB gzip, Inferred — not built/measured
  here**) and a continuous WebGL render loop. Current app is 2D DOM/CSS with no GPU scene.

## 14. MOBILE IMPACT

- Option A / B: **none** — CSS/responsive behaviour unchanged; the room already scales via
  `aspect-ratio` + `min(88dvh…)`.
- Option C: WebGL render loop is a **battery/thermal/frame-rate risk on low-end mobile**, plus a
  larger initial download. *Inferred; not measured.* This alone is a strong reason to avoid C for a
  consumer household app.

## 15. HIGHEST-RISK UNVERIFIED CLAIM

> *"Flat assets cannot be made to sit convincingly on the fridge shelves, so we need true 3D."*

This was **my** claim and it is **most likely false**: the pantry jars (flat PNGs) already sit
correctly, and the architecture's own acceptance test explains why the fridge objects don't
(wrong object camera + unmatched light + no baked contact). If this claim is false — and evidence
says it is — then the entire justification for adding a 3D engine collapses, and Option A is both
sufficient and the only architecture-compliant path. **This is the claim the Owner should weigh
most before authorising any 3D work.**
