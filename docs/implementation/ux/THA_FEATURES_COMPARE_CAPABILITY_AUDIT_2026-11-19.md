# Features & compare capability audit — implementation report — 19 November 2026

## Task and scope

Expanded the public Features & compare page with deeper capability coverage and evidence-backed competitor opportunities. This is a static explanatory page and product registry update; no backend, schema, persistence, AI reasoning, production data, live service, configuration, deployment or promotion was touched.

Repository: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`; branch `feat/integrated-dev`; base HEAD `21a9dd1789c32bc2baa70f739276e17b77f3f8b3`. Rollback anchor: `rollback/ux-features-compare-20261119` (reported by the preflight). Task-specific pre-existing dirty changes were preserved and excluded from the commit.

## Governing preflight

Read and applied repository `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, Experience Architecture, Blueprint, Language and UI, Product Knowledge Registry architecture, Architecture Principles, Source of Truth, `ENGINEERING_WORKFLOW.md`, `THA_UI_ARCHITECTURE`, `.engineering/OPERATING_MANUAL.md`, the linked UX operating-model task documents, and the THA operating-model skill. These sources authorize application dev work on `feat/integrated-dev`; no conflict was identified for this static page. Risk is Amber because comparison claims and public user workflows are affected. Explicit user instructions authorized the page work and local commit.

## Changes

- Expanded comparison criteria to 30 concrete tasks and 21 competing apps plus THA; closest-app subset remains prioritized for a one-page scan, with dots opening explanatory evidence.
- Added gaps and capability signals across household/eater restrictions, recipe creation/import/social capture/image scans, plan creation/import/scanning/templates, list/budget/store handoff, nutrition, diary, barcode/offline, pantry, AI tailoring and guided cooking.
- Added six clearly exploratory product opportunity cards; no new functionality is claimed as shipped.
- Replaced unsupported Yuka negatives with Not verified where absence was not established by official sources.
- Added page registry entry and updated page record; regenerated `product.json` using the inventory builder.

Files in approved scope: `client/src/pages/features-compare-page.tsx`, `docs/product/inventory/product.yaml`, `docs/product/inventory/product.json`, `docs/product/structure/pages/page-features-compare.md`, this report, and the investigation report.

## Architecture and AI compliance

**Verified:** The page consumes and describes existing household, meal, planner, shopping, pantry, diary, analyser and nutrition capabilities. Canonical facts and workflows remain with existing services/entities (`household_eaters`, planner, shopping list, diary, pantry/larder and meal/template records). No second owner, duplicated state, workflow, assistant, AI conversation, or access path was introduced. Static competitor data is page presentation, not canonical household state. AI assistance is described as existing reviewed capability; no new model behavior was implemented.

## Definition of done and verification

- 30 detailed rows and expanded app set present in page source.
- Unknown evidence remains grey; no overall winner or aggregate score.
- Public route metadata updated in registry and page record.
- `npm run build` succeeded (Vite client and server bundle). Existing non-fatal stale caniuse-lite/postcss and esbuild warnings remain.
- Browser tab showed title “Features & comparison | The Healthy Apples” at `http://127.0.0.1:5001/features-and-compare` after reload.
- No automated test suite was run.

## Data, trust and rollback

Data impact: reads existing source/docs and static official public app evidence; no data writes or meaning changes. Trust: capability claims are tied to source or official developer links and dated 2026-11-19; absence of evidence is unknown. Highest residual uncertainty: competitor features vary by region, version and subscription tier, and the matrix was not hands-on tested in each app.

Rollback: revert the task-specific local commit or restore the exact pre-edit registry backups kept beside the inventory files. Existing unrelated working-tree changes were neither staged nor included. No push or deploy occurred.

## User acceptance evidence

Start at `/features-and-compare`; verify the full grid, traffic-light dot key, app columns, evidence detail on dot selection, and opportunity cards. Success means the page loads, claims expose evidence, and unverified cells are not shown as No.

## SUGGESTIONS

Prioritize product discovery around pantry scan/use-it-up, meal-photo diary draft, guided cook mode, logged-week nutrition clarity, basket cost confidence and scan explanation. Treat each as a separate capability decision with architecture and trust review before implementation.
