# SHOP1 — Shopping Persistent Notepad

**Date:** 2026-11-04  
**Repository:** `tha-integrated-dev-g-native-20261003`  
**Branch / base:** `feat/integrated-dev` / `3467abad4eca8d82ffc52756fee13874e389597f`  
**Risk:** 🟡 Amber workflow presentation, with a narrowly approved 🔴 architecture amendment for the exact Shopping photograph and a route-specific header exception.  
**Approval:** Colin approved implementation of the notepad concept, then refined the layout: keep the basket scene frozen while content scrolls on the paper; make Add a dedicated stage/page; keep Add, Review, Prep and Shop as clean stage tabs below the rings; and keep Review, Prep and Shop on the same stable list.  
**Release:** Local implementation only. No deployment or promotion was authorized or performed.

## Scope and outcome

Shopping now uses the existing responsive photos of a hand-held blank notepad over a market basket. A fixed viewport background keeps the scene in place while page content scrolls. Add, Review, Prep and Shop are clean stage tabs on the paper below the binder rings. Add opens a dedicated blotter page; the list is not rendered underneath or pushed down by its composer. The other three stages share the same list rows and ordering, with stage-specific row actions. These controls and labels remain usable on mobile and desktop, including fullscreen. The household list is rendered as live UI over the blank page.

Review, Prep and Shop render one shared filtered and sorted item array. Checked, found, deferred and pantry-related states do not move rows to different sections when a stage changes. Existing row controls respond to the selected stage. Add is a separate composer page. After quick items are submitted, the existing add API appends them to the canonical list; the workspace returns to Review with the source filter set to All so the new rows appear alongside existing items. This workflow does not clear or replace existing rows. User-selected filters or sort order can still intentionally alter the visible list.

The Shopping page no longer renders `WorkspaceHeader`, a page title, or a top-left brand mark. The shell treats `/shopping-workspace` as an immersive room and suppresses its fallback header and threshold. The shared BottomNav remains the sole primary navigation and identifies Shopping as selected.

## Governing authority actually read

- `G:\The Healthy Apples\AGENTS.md`
- Repository `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `README.md`
- `docs/architecture/README.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`, `docs/ENGINEERING_WORKFLOW.md`, `docs/change-control.md`
- `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`, `THA_EXPERIENCE_BLUEPRINT.md`, `THA_EXPERIENCE_LANGUAGE.md`, `THA_UI_ARCHITECTURE.md`, `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`
- `docs/ai-operating-model/README.md`, `principles.md`, `risk-and-approval.md`, `rollback-and-output.md`, `evidence-and-architecture.md`, `implementation-and-compliance.md`
- `client/src/pages/shopping-workspace-page.tsx`, `client/src/components/layout/app-shell.tsx`, and the live adoption-register schema and generator

No missing or conflicting governing authority was identified. **Verified:** the Shopping domain’s existing canonical list owner and existing business mutations remain unchanged; this work adds no second list, service, state store, or workflow. **Verified:** the E1 orchard exposure mapping remains unchanged and no orchard asset is used. The photo is admitted only by the explicit exact-byte Shopping exception below.

## Files and architecture

- `client/src/pages/shopping-workspace-page.tsx` — dedicated Add page; Add / Review / Prep / Shop stage tabs on the paper; Review / Prep / Shop share the stable ordered list; successful quick additions append through the existing list API and return to All items in Review; removed mode-specific status/category sections and the now-inert “Split by shop” control.
- `client/src/components/layout/app-shell.tsx` — suppresses shell title/header and room threshold for Shopping; shared navigation remains.
- `client/src/index.css` — fixed responsive photo composition and stage-control spacing below the binder rings.
- `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md` — exact-byte, Shopping-only exception for `shopping-notepad-background-desktop.png` (SHA-256 `03C65AF71A90FAA9DA5B52027CE291534106593154299B46FA8350762CB51500`) and `shopping-notepad-background-mobile.png` (SHA-256 `DF2266855ED98C9196B1B11682DB4D026ACD80AB54CABD965D6AF4F7B34E8422`). Both images are still blank of text and controls; live application content is overlaid. No orchard or other route is admitted.
- `docs/implementation/ux/adoption-register.json` and generated `ADOPTION_REGISTER.md` — records the Shopping route’s header exception. The shared header remains governed for other routes.
- `.engineering/session/CURRENT.md` and `.engineering/session/runs/SHOP1_Persistent_Notepad_20261104.md` — session record.
- `client/public/images/shopping/shopping-notepad-background-desktop.png` and `shopping-notepad-background-mobile.png` — exact approved responsive image assets referenced by the page. Their directory was already untracked in the working tree during this session.

## Data, trust and rollback

- **Data impact:** no database, schema, API, persistence, or household-list ownership changes. Existing list rows and mutations remain the single source of truth.
- **Add behavior review:** the frontend posts each parsed quick item to the existing `api.shoppingList.add.path`; the server's existing POST handler writes via the existing shopping-list storage path. The post-submit `sourceFilter` is reset to `all`, preventing the prior Quick List-only filter from hiding older rows. The visible count is derived from the current list response; no rows were removed or rewritten during this review.
- **Trust check:** no live service, database, scheduler, or configuration was touched. No external provider received project or household data.
- **Rollback:** annotated tag `rollback/SHOPPING-persistent-notepad-20261104` points to base `3467abad4eca8d82ffc52756fee13874e389597f`. Byte-exact prestate copies of pre-existing dirty target files are stored at `G:\The Healthy Apples\Incoming\Rollback Evidence\THA-SHOPPING-PERSISTENT-NOTEPAD-20261104\prestate`, with SHA-256 manifest. The `index.css` prestate was reconstructed by removing only the SHOP1 block from the current file. Roll back this feature by restoring only the scoped target-file prestate and removing the SHOP1 CSS/assets references; do not reset or clean the repository.
- **Scope lock:** the route, two exact assets, stage controls and stable list are the complete implementation scope. No unrelated dirty work was reverted or included in a commit.
- **Definition of done:** implementation compiles; stage renders share one ordered collection; no Shopping page or shell header is mounted; architecture and adoption exceptions are recorded; report is saved in both required locations. Live user acceptance and deployment remain outside this local task.

## Verification

- `npm run typecheck:ci` — **PASS**; baseline 14 TypeScript errors, current 14, no new errors.
- `npm run build` — **PASS**; client and server built. Existing non-fatal warnings remain for stale Browserslist data, PostCSS `from`, four `import.meta`/CJS warnings, and large chunks.
- `npm run adoption:check` — Shopping header owner/floor **PASS**; 100 checks passed, 0 notices, 12 failures remain elsewhere in the pre-existing working tree (including unadopted modules); this task introduced no new building block.
- `npm run adoption:record` — generated register and Markdown from the JSON source of truth; updated the measured dark utility count to 670.
- `git diff --check` — reported trailing whitespace only in the pre-existing, untouched `PROJECT_GOVERNANCE.md`; no SHOP1-specific whitespace issue was reported.
- No tests were run. No new live browser walkthrough or screenshot was performed in this follow-up; visual acceptance remains with Colin in the local app.

## Repository state

At task start, the working tree had 124 pre-existing status entries, including dirty files this implementation needed to touch. The rollback tag and byte-exact snapshots were created before the main implementation; the additional `index.css` prestate snapshot was reconstructed and added to the manifest. The latest stage-button refinement has a reconstructed immediate prestate at `G:\The Healthy Apples\Incoming\Rollback Evidence\THA-SHOPPING-PERSISTENT-NOTEPAD-20261104\stage-polish-prestate`. Existing unrelated work was preserved. No commit was made because the branch contains extensive unrelated dirty work and no commit authorization was given; no deployment occurred.

**User-acceptance evidence:** explicit approval of the visual concept and implementation, followed by layout corrections in the current conversation. A local CUA accessibility snapshot confirmed the separate Add toggle and the three notepad stage tabs. **Remaining verification:** owner visual review in the running application; CUA screenshot capture timed out.

## Follow-up review — dedicated Add page and additive quick entry

**Reviewed after Colin clarified that Add is its own stage/page and quick additions must sit alongside the existing household list.** The Add tab remains in the stage strip; selecting it renders only the Add blotter/composer, not the list beneath it. Review, Prep and Shop render the same filtered/sorted list in the same order. After successful quick-entry posts, the page selects Review and source filter `all`. The existing server route and database owner are unchanged. The apparent “60 items” in the earlier screenshot is a count from the currently loaded list/filter, not a replacement operation; this follow-up performed no data mutation or deletion.

**Current verification:** `npm run typecheck:ci` passed with the repository baseline unchanged at 14 errors; `npm run build` passed (existing Browserslist, PostCSS, CJS/import.meta and large-chunk warnings); `npm run adoption:check` passed 100 checks and reported 12 adoption failures outside this scoped change. No tests were run and no live browser capture was made. No live service, database, scheduler, or configuration was touched.

## Follow-up visual refinement — 2026-11-04

Colin asked for the notepad image to sit higher with less top margin and for the stage tabs, filters, “to buy” status, sort control and menu to share one line.

- `client/src/index.css` — shifted the fixed scene upward by 28px on desktop and 18px on mobile; reduced the stage toolbar's top spacing; added a single-row toolbar with subtle section separators and horizontal overflow for narrow screens.
- `client/src/pages/shopping-workspace-page.tsx` — combined the stage tabs, filters/status/sort and menu into one non-wrapping toolbar bounded to the notepad content width; made the sort control narrower on mobile. The notepad image asset itself remains unchanged.
- **Scope / architecture:** visual presentation only; no list workflow, persistence, canonical ownership, or data behavior changed. The list remains owned by the existing `shopping_list` database/API path. No new component or state store was introduced.
- **Rollback:** `rollback/SHOPPING-notepad-toolbar-20261104` → `3467abad4eca8d82ffc52756fee13874e389597f`; byte-exact target snapshots and manifest are at `G:\The Healthy Apples\Incoming\Rollback Evidence\THA-SHOPPING-PERSISTENT-NOTEPAD-20261104\toolbar-refinement-prestate`.
- **Verification:** `npm run typecheck:ci` passed (14 baseline errors, no new errors); `npm run build` completed with existing Browserslist, PostCSS, CJS/import.meta and large-chunk warnings. The local Edge window capture timed out twice. Per computer-use recovery guidance, no further UI capture was attempted; visual behavior at desktop/mobile widths remains unconfirmed. No tests, data, live service, scheduler, or configuration were touched.

## Follow-up bounded-paper scroll and list lettering — 2026-11-04

Colin clarified that the photograph must remain fixed while the list scrolls inside the notepad boundaries, and asked for more handwritten-looking item text.

- `client/src/pages/shopping-workspace-page.tsx` — the Shopping room now sizes to its available shell viewport instead of forcing page-level scrolling. The toolbar stays in place; Add/list and supporting content scroll inside a focusable, named paper region.
- `client/src/index.css` — the photo remains a viewport-fixed layer. The scroll region is constrained to paper width, clips content at its visible side boundaries, contains scroll chaining, and exposes a restrained scrollbar. The shell remains the owner of bottom-navigation clearance (the fullscreen path retains `.main-safe`).
- Item names use the existing UI font at body size with medium italic styling. **The handwritten signature typeface is intentionally not used:** `THA_UI_ARCHITECTURE.md` §8 reserves it for the Home greeting and explicitly excludes functional Shopping values. No typography architecture amendment was made.
- **Architecture / data:** no API, database, workflow, or list ownership changes. Shopping rows remain owned by the existing database/API path. No duplicate list state or new shared building block was introduced.
- **Rollback:** `rollback/SHOPPING-bounded-notepad-scroll-20261104` → `3467abad4eca8d82ffc52756fee13874e389597f`; exact prestate copies and hashes are at `G:\The Healthy Apples\Incoming\Rollback Evidence\THA-SHOPPING-PERSISTENT-NOTEPAD-20261104\bounded-scroll-prestate`.
- **Verification:** `npm run typecheck:ci` passed (14 baseline errors, none added); `npm run build` passed with existing Browserslist, PostCSS, CJS/import.meta and chunk-size warnings. No tests or live browser walkthrough were run. The local Edge capture previously timed out twice, so the fixed-image/inner-scroll visual still needs owner confirmation in the app.
- **Scope / trust:** no household data, live service, database, scheduled task, or configuration was touched. No deployment or commit was made.

## Item text size refinement — 2026-11-04

Colin asked to make the shopping font smaller. Item names changed from `text-base` (16px) to `text-sm` (14px), retaining the existing UI font, medium weight and italic treatment. Other text and controls are unchanged. `npm run typecheck:ci` passed with the baseline unchanged at 14 errors. Rollback: `rollback/SHOPPING-item-font-size-20261104` → `3467abad4eca8d82ffc52756fee13874e389597f`; exact prestate files and hashes are at `G:\The Healthy Apples\Incoming\Rollback Evidence\THA-SHOPPING-PERSISTENT-NOTEPAD-20261104\item-font-size-prestate`. No data, API, service, build output, or deployment was changed.
