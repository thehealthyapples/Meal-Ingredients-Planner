# The Healthy Apples — UI Audit Package

This folder contains the full UI Audit Package for The Healthy Apples, designed to support launch-readiness visual reviews.

---

## Purpose

The UI Audit Package provides a single, self-contained snapshot of the application's visual state at a point in time. It allows designers, product managers, and AI reviewers (e.g. ChatGPT) to assess the full user interface without needing access to a running instance of the app.

---

## Folder Structure

```
docs/ui-audit/
├── README.md                          ← this file
├── index.html                         ← HTML gallery (open in browser)
│
├── reports/
│   └── WX9A_LAUNCH_EXPERIENCE_VISUAL_AUDIT.md   ← audit report
│
└── screenshots/
    ├── desktop/   ← 1440 × 900
    ├── laptop/    ← 1280 × 800
    ├── tablet/    ← 768 × 1024
    └── mobile/    ← 390 × 844
```

---

## Screenshot Naming Convention

Each screenshot file follows the pattern:

```
{page-number}-{page-slug}-{viewport}.png
```

Examples:
```
01-dashboard-desktop.png
01-dashboard-laptop.png
01-dashboard-tablet.png
01-dashboard-mobile.png
02-planner-desktop.png
03-cookbook-desktop.png
04-meal-detail-overnight-oats-desktop.png
05-food-page-tomato-desktop.png
06-shopping-desktop.png
07-pantry-desktop.png
08-household-nutrition-centre-desktop.png
09-profile-desktop.png
10-my-diary-desktop.png
11-partners-desktop.png
```

Rules:
- Use lowercase, hyphens only — no spaces
- Prefix with a two-digit page number for consistent ordering
- Use the same page number across all viewports for the same page

---

## How to Add New Screenshots

1. Place the new `.png` file in the correct viewport subfolder:
   `docs/ui-audit/screenshots/desktop/`, `laptop/`, `tablet/`, or `mobile/`

2. Use the naming convention above.

3. Regenerate the gallery (see below) or add the image path manually to `index.html`.

---

## How to Regenerate the Gallery

The gallery (`index.html`) is a static HTML file. To regenerate it from scratch, run the capture scripts in `scripts/`:

```bash
# Capture desktop (1440px)
node scripts/audit-capture-desktop.mjs

# Capture all viewports (laptop 1280px, tablet 768px, mobile 390px)
node scripts/audit-capture-all-viewports.mjs
```

Both scripts require:
- The app running at `http://localhost:5000`
- Node.js with Playwright installed (`npx playwright --version`)
- Chromium available at the nix store path used in the script

After capturing, the `index.html` gallery auto-discovers all `.png` files in the `screenshots/` subfolders.

---

## How to Open the HTML Gallery Locally

Open `docs/ui-audit/index.html` directly in any modern browser. No server required — all images use relative paths.

```bash
# macOS
open docs/ui-audit/index.html

# Linux
xdg-open docs/ui-audit/index.html

# Windows
start docs/ui-audit/index.html
```

The gallery groups screenshots by page, shows all viewports side by side, and includes a lightbox for full-resolution viewing.

---

## Audit Reports

All written audit reports live in `docs/ui-audit/reports/`. Future audits should be named clearly with a reference code and date:

```
WX9A_LAUNCH_EXPERIENCE_VISUAL_AUDIT.md   ← June 2026
```

---

## Pages Covered

| # | Page | Route |
|---|------|-------|
| 01 | Dashboard / Quick List | `/` |
| 02 | Planner | `/planner` |
| 03 | Cookbook | `/cookbook` |
| 04 | Meal Detail | `/meals/:id` |
| 05 | Food Page — Tomato | `/foods/tomato` |
| 06 | Shopping / Basket | `/basket` |
| 07 | Pantry | `/pantry` |
| 08 | Household Nutrition Centre | `/plant-diversity` |
| 09 | Profile | `/profile` |
| 10 | My Diary | `/my-diary` |
| 11 | Partners | `/partners` |
