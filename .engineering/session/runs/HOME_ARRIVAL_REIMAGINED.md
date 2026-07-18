# HOME_ARRIVAL_REIMAGINED — Arrival, reimagined from first principles

**The orchard as the emotional anchor, not the arch. 6–8 radically different ways of arriving home.**

| | |
|---|---|
| **Session** | `HOME_ARRIVAL_REIMAGINED` |
| **Date** | 2026-07-17 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `rollback/HOME-ARRIVAL-REIMAGINED-20260717` → `7bfad50c` (tag `home-arrival-reimagined-wip-snapshot-7bfad50c`) |
| **Status** | **Complete — awaiting owner decision.** 8 arrivals rendered (desktop + mobile); document delivered. |
| **Product changed** | **None (intended).** Exploration only — self-contained concept renders; app source byte-untouched. |

---

## Mission

Stop designing around the arch. The arch is no longer the defining feature — **the journey home** is,
and the **orchard** is the real landscape surrounding the house, always viewed from the same location.
Produce **6–8 radically different Arrival experiences**, each with desktop render, mobile render, design
philosophy, arrival journey, why the composition works, orchard↔interior relationship, strengths,
weaknesses. Recommend the one people will remember as unmistakably The Healthy Apples — **not the safest.**

**Fixed (never challenged):** modern living in a traditional English orchard · hospitality before
productivity · technology becoming quieter as it becomes better · Arrival is coming home.
**Free to challenge:** banner, hero image, nav placement, the arch, standard layouts.

## Method

Each concept is a **self-contained HTML composition** embedding the real orchard asset
(`client/public/orchard.webp`, the owner's canonical v2 North Star orchard), rendered headless at
**desktop 1440** and **mobile 430**, `deviceScaleFactor 2`. Nothing edits app source. This is the right
method here: the concepts are new-from-scratch architecture, not injections onto the existing room.

## Trigger log / Next action

- [x] Read Bootstrap (`docs/architecture/README.md`), `ARRIVAL1_DEFINITIVE_HOME.md`,
      `HOME_FINAL_CONCEPTS.md`, `HOME_INTERIOR_ARCHITECTURE.md`.
- [x] Confirm git status. Create rollback protection (branch + tag above).
- [x] Create this run file. Verify headless render works (smoke test passed).
- [x] Build the capture harness (`scripts/capture-home-arrival-reimagined.ts`), render 8 concepts ×
      desktop + mobile (16 renders in `docs/ui-audit/home-arrival-reimagined/`), fix Reflection mirror,
      visually verify every render.
- [x] Write `docs/implementation/HOME_ARRIVAL_REIMAGINED.md` — 8 arrivals + recommendation (**The
      Threshold**; The Clearing as north star; The Reflection as most-memorable frame).
- [x] **Done.** No product/schema/migration/test changed — exploration only.

## Recommendation delivered

**1 — The Threshold** (the whole frameless orchard you come home to, the arch set down entirely).
Named alternatives: **8 — The Clearing** (visionary north star: technology disappears into the land)
and **6 — The Reflection** (most memorable single frame). Safest options named and explicitly *not*
recommended: 3 — The Restored Farmhouse, 4 — The Long Light.

## Deliverable

`docs/implementation/HOME_ARRIVAL_REIMAGINED.md` — 8 concepts + one recommendation.
