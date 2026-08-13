# Real Book ↔ Legacy Grid Cookbook Functional Parity

Status: FUNCTIONAL PARITY VERIFIED LOCALLY — Home Owner visual/acceptance review pending
Owner: ChatGPT integration; Codex bounded implementation; Colin acceptance
Baseline: approved Phase 1 `616e547cc3bca4a96fee12db73e4253914874473`

## Binding requirement
The Real Book must preserve the functional capabilities of the legacy grid Cookbook while expressing them as a physical book rather than reproducing cards, rails, or dashboard chrome.

## Recipe-domain capabilities

| Legacy grid capability | Real Book before remediation | Required disposition |
|---|---|---|
| Browse saved household recipes | Present | Preserve |
| Browse canonical Cookbook shelves/categories | Present | Preserve |
| Local recipe/ingredient search | Present, but mislabeled ambiguously | Preserve as explicit **My Cookbook** search |
| Trusted web recipe search after meaningful query | **Missing — integration failure** | Implement using canonical shared search hook/endpoint |
| Distinguish saved and external results | **Missing** | Explicit **My Cookbook / Trusted recipe sources** modes |
| External source/provider attribution | **Missing** | Show source on every external result |
| External recipe preview (ingredients/method) | **Missing** | Preview before save; retain source link |
| Save/import external recipe into household Cookbook | **Missing** | Implement; preserve source URL and acquisition provenance |
| Web-result loading/empty/error states | **Missing** | Implement accessibly |
| Additional web-result pages | **Missing** | Implement compact Previous/Next or Load more behavior |
| Household dietary safety for external discovery | Legacy route has recorded fail-open gap | Correct server route to canonical household gate; fail closed |
| Create/build recipe | Present | Preserve |
| Import from URL/text | Present via Import Recipe route | Preserve |
| Scan printed/handwritten recipe | **Missing from Real Book** | Restore accessible entry to canonical scan/import flow |
| Select recipe and read full details | Present | Preserve |
| Add selected recipe to Planner | Present | Preserve |
| Ask Companion about selected recipe | Present | Preserve |
| Pagination through saved recipes | Present | Preserve |
| Keyboard and pointer access | Present | Preserve and extend to web results |

## Adjacent legacy Cookbook workspace domains

These existed on the broader legacy Meals/Cookbook workspace but are not all controls of the recipe collection page. They must remain reachable in the application and must not be falsely reported as implemented inside the physical recipe spread:

- Freezer inventory and portion actions — remains a separate household storage domain.
- Packaged product search and barcode scanning — remains a product-library domain, not recipe web discovery.
- Grid/list display toggle — presentation-specific to the retired grid; not a capability the physical-book view must mimic.
- Advanced category/audience/diet/UPF filters — category shelves remain in the book; household dietary safety is mandatory for external discovery. A later physical-book filter treatment may expose non-safety preferences without adding dashboard chrome.
- Wider canonical recipe library opening — saved/canonical recipe search must continue to reach all intended searchable meals rather than only six visible items.

## Acceptance gates

1. RED parity test observed before production implementation.
2. Canonical household safety resolution and fail-closed behavior tested server-side.
3. Browser proves local search, web search, preview, save/import, source attribution, error/loading/empty states, and keyboard access.
4. Existing Cookbook contract, 28-check seed safety and production build pass.
5. Desktop/mobile rendered artifact remains a physical book and bottom navigation remains bottom-only.
6. Colin reviews the real artifact; technical passes do not grant approval.

## Verification record — 2026-08-13

- RED observed for missing shared web-discovery path before implementation.
- Legacy-grid parity contract: PASS.
- Canonical scan-entry contract: PASS.
- Search/preview household-safety contract: PASS.
- Existing Real Book contract: PASS.
- Canonical Cookbook seed suite: 28/28 PASS.
- Safety-gate convergence: 160/160 PASS; external search and preview now fail closed through the canonical household gate.
- Production build: PASS.
- `git diff --check`: PASS.
- Deterministic Playwright desktop 1440×900 and mobile 390×844: local search, trusted search, keyboard preview selection, sparse-result preview, source attribution, original link, explicit save, return to My Cookbook, and saved-recipe rendering PASS.
- Final browser console/page/HTTP errors: none.
- Evidence: `artifacts/cookbook-real-book-functional-parity-review-diagnostic/`.

### Visual caveats retained for Home Owner review

- Functional controls are visibly present in the physical book, but trusted-preview typography is too small.
- Desktop trusted-result labels are cramped.
- Mobile page-turn/bottom-navigation treatment remains visually weak.
- These are Page Correctness/visual acceptance issues; this functional verification does not approve or checkpoint them.
