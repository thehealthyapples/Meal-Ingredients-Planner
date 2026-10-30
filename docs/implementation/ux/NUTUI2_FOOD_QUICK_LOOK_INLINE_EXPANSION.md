# NUTUI2 — Food Quick Look: inline expansion for food detail

**Date:** 2026-10-28
**Branch:** `feat/integrated-dev`
**Risk:** 🟡 AMBER — behaviour/state change (what renders inline vs. navigates); no schema, persistence, or new entity.
**Objective:** Fix `fnd-food-detail-disjointed` — tapping a food inside Nutrition left the room for a separate full-page route that refetched everything from scratch — by giving both Nutrition tabs an in-place expansion, reusing the existing Food Intelligence data and the existing `Collapsible` primitive.

## Rollback protection

| Item | Value |
|---|---|
| Rollback tag | `rollback/nutrition-implementation-plan-20261027` → `bffc533d65f58ae30c1faf7d3026b50dcc17be89` (reused — no git committer identity configured in this environment to create a new tag; same workaround as `NUTRUI1`) |
| Working tree | Intentionally dirty before this task: `NUTRUI1` (2026-10-27), Planner mobile/toolbar work (`PLNUI1-15`), Home exterior (`HOMEEXT1`), Analyser responsive compare (`ANLCMP1`), and ~3,962 files of pre-existing CRLF/LF line-ending noise repo-wide (diagnosed, not caused by this task, left untouched). All preserved. |
| This task's tracked writes | Four files: `food-detail-page.tsx` (one-word export), `HouseholdNutritionCentre.tsx`, `PlantDiversityReport.tsx`, `components/intelligence/index.ts`. One new file: `components/intelligence/FoodQuickLook.tsx`. |
| Rollback to committed state | Inspect first, then restore only the five listed files from the tag. Do not check out the tag as a whole — the working tree contains substantial unrelated edits from other sessions. |

## Reference documents read

Full chain documented in the Governance Preflight Receipt produced earlier in this session (reproduced below). Headline: `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/change-control.md`, `docs/architecture/README.md`, `ARCHITECTURE_PRINCIPLES.md`, `ENGINEERING_WORKFLOW.md` (all STEPs + compliance blocks), `GOVERNING_EXPERIENCE_ARCHITECTURE.md` §18.2, `ROLLBACK_PROTECTION_PROTOCOL.md`, `THA_EXPERIENCE_BLUEPRINT.md` §6.2/§7/§15, `THA_EXPERIENCE_ARCHITECTURE.md` §18, `THA_EXPERIENCE_LANGUAGE.md` §6/§7, `THA_UI_ARCHITECTURE.md` §16-18, `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (Domains 1, 22, 23), `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` §3, `NK1` (grepped, no applicable rule — governs knowledge content, not presentation). **Not read in full:** `NK2`, the full `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md` narrative — this change touches no nutrition methodology/calculation and relied on `ENGINEERING_WORKFLOW.md`'s compliance block text plus `NUTRUI1`'s worked example for the latter.

## Governance Preflight Receipt

```
Repository: G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003
Worktree / branch: feat/integrated-dev
Base HEAD commit: bffc533d65f58ae30c1faf7d3026b50dcc17be89
Git status: ~3,962 files showing modified are CRLF/LF line-ending noise only (byte-verified on
  package.json; no .gitattributes; core.autocrlf/core.eol unset) — cosmetic, left untouched. Real
  dirty set (git -c core.autocrlf=true status --short): 29 modified + 50 untracked, all pre-existing
  in-flight work (Planner, Home exterior, Analyser, NUTRUI1), preserved untouched.
User request: shared inline expand-in-place component for food detail, wired into
  PlantDiversityReport's rows and HouseholdNutritionCentre's FoodLink, reusing
  /api/foods/:slug/intelligence.
Mandatory governance documents actually read: see Reference documents above.
Task-specific governing documents actually read: see Reference documents above.
Existing implementation/assets inspected: plant-diversity-page.tsx, PlantDiversityReport.tsx,
  HouseholdNutritionCentre.tsx, food-detail-page.tsx, ConnectedFoodPanel.tsx, FoodReport.tsx,
  components/ui/collapsible.tsx, components/ui/button.tsx, components/ui/skeleton.tsx, NUTRUI1's
  implementation report, page-food-detail.md, page-nutrition.md.
Authorised scope: one shared expand-in-place component, consuming existing
  /api/foods/:slug/intelligence via the existing Collapsible primitive; wired into both
  PlantDiversityReport rows and HouseholdNutritionCentre's FoodLink, replacing the latter's
  full-page navigation.
Explicit non-goals: no change to what "Over time" shows; no nutrient-amount ranking; no "pairs
  well with" content; no touching Diary; no touching any file outside the four edited files plus
  the one new component file; no line-ending normalization; no touching unrelated in-flight work;
  no fixing the stale registry/architecture docs found along the way (named, not fixed).
Architecture or governance conflicts: NONE blocking. Non-blocking staleness findings:
  ARCHITECTURE_PRINCIPLES.md's contested-domains section and page-food-detail.md's registry entry
  are both out of date relative to current source — pre-existing, not caused by this change.
Decision/risk status: 🟡 AMBER, approved by Colin (Decision 1, Option A). Covered by AGENTS.md's
  standing dev authority for application-dev work on feat/integrated-dev — no separate Gate 9
  decision required.
Implementation permitted: YES.
```

## Architecture compliance

- **One owner per fact — PASS.** No new store. The new component reads `/api/foods/:slug/intelligence` (Food Intelligence Assembler, Domain 1) with the *same* `queryKey` the full Food Page uses, so the two share one react-query cache entry rather than fetching twice.
- **No duplicate entities/state — PASS.** `FoodQuickLook` is a presentation component, not an entity. Expand/collapse is ephemeral UI state (`useState` in `FoodLink`; Radix `Collapsible`'s own state elsewhere), nothing persisted.
- **Deliberately avoids a different duplication:** `FoodQuickLook` omits key-nutrient chips. `PlantDiversityReport`'s rows already show them (the row's own "Key Nutrients" cell, and `FoodReport` — a *different* canonical owner, Domain 23, `shared/canonical/food-report-adapter.ts` — repeats them again on expand). Adding a third rendering of the same fact from the Food Intelligence Assembler would be the same fact shown by two owners' voices at once, which the checklist's "one owner per fact" forbids in spirit even though both owners are individually legitimate. `FoodQuickLook` contributes only what neither existing path already shows: health benefits, and the Connected Food Panel's relationship web (`oftenEnjoyedWith` / similar / seasonal / household).
- **Evolution over replacement, with named retirement (UI Architecture §17 "retire on introduction") — PASS.** `HouseholdNutritionCentre`'s `FoodLink` previously rendered a real `wouter Link` to `/foods/:slug`. That predecessor pattern is migrated to the shared `Collapsible` trigger in this same change, not left dormant beside the new one — every call site of `FoodLink` (trends, discovery, the benefit explorer) is fixed at once because they all go through this one function.
- **Canonical component adoption (UI Architecture, Adoption Register) — PASS, confirmed by measurement, not just intent.** First draft used a raw `<button>` and a raw `<Loader2>` spinner; `npm run adoption:check` correctly flagged both as rival-pattern usage. Replaced with `components/ui/button.tsx` (`variant="ghost"`, custom className to keep the existing pill shape) and `components/ui/skeleton.tsx`. Re-ran the check: both ceilings returned to their exact pre-existing failure state (167/166 and 489/442 — the same baseline that failed before this task touched anything), confirming this change adds zero new rival-pattern debt.
- **Progressive disclosure (`THA_EXPERIENCE_ARCHITECTURE.md` §18) / "paging instead of walking" anti-pattern (`THA_EXPERIENCE_LANGUAGE.md` §7) — this is the change's actual justification, not a box to tick.** The full-page `<Link href="/foods/{slug}">` this replaces already violated both. This implementation doesn't just comply with Progressive Disclosure; it corrects an existing violation of it. That is also the answer to the Experience Constitution Check's LAYER question (the one check left open when the decision was approved): principle served = Progressive Disclosure; architecture owner = `THA_EXPERIENCE_ARCHITECTURE.md`, which prevails over UI in any conflict.
- **Experience Constitution Check (§18.2) — all 8 pass.** Hospitality/Outcome/Weight/Voice/Ownership/Agency/Restraint answered during Decision 1's approval; Layer completed above.

## Product Registry impact

Not updated in this change — explicitly excluded from scope (see non-goals). Two stale entries were found and are named here rather than fixed: `page-food-detail.md` describes two defects (`fnd-food-detail-back`, `fnd-food-detail-chrome`) the live code's comments say are already resolved; `page-nutrition.md`/`page-food-detail.md` do not yet describe this new in-place expansion path.

**SUGGESTION:** Update `page-food-detail.md` to retire its two stale defect entries, and add a registry note for the new in-place expansion journey (reachable from both Nutrition tabs) per Rule PKR14 (predecessor entry retirement) — the predecessor being the implicit "tap a food chip → leave to /foods/:slug" journey, not the `/foods/:slug` route itself, which continues to exist unchanged as a direct destination. Risk: 🟢 GREEN (documentation only). Requires approval before implementation, per Scope Lock.

## Adoption Register impact

No new building block created. This change *adopts* three existing canonical owners more widely: `components/ui/collapsible.tsx` (new consumer: `HouseholdNutritionCentre.tsx`), `components/ui/button.tsx` and `components/ui/skeleton.tsx` (both already adopted elsewhere in the same files; this change adds one more call site each rather than a rival pattern). `npm run adoption:check` ceiling state before and after this change's corrective pass is identical to the pre-existing baseline (see Architecture compliance above) — no ceiling tightened or loosened by this change.

## Changes made

- **New:** `client/src/components/intelligence/FoodQuickLook.tsx` — given a food slug, renders health benefits (via the existing "Why it matters" pattern) and `<ConnectedFoodPanel slug={slug} />`, plus a "View full food page" link to `/foods/:slug`. Loading state uses `Skeleton`; an unknown slug or failed read renders nothing (progressive enrichment — a secondary panel does not report an error for what the full Food Page already handles as a calm not-found state).
- **Exported** from `client/src/components/intelligence/index.ts`.
- **`client/src/pages/food-detail-page.tsx`:** exported the existing `FoodIntelligence` interface (one word, `export`) so `FoodQuickLook` can import the type rather than redeclaring it — avoids a second owner of the same shape.
- **`client/src/components/HouseholdNutritionCentre.tsx`:** `FoodLink` no longer renders a `wouter Link` to `/foods/:slug`. It now renders a `Collapsible` whose trigger (a `Button`, styled to keep the existing pill chip) toggles a `CollapsibleContent` containing `<FoodQuickLook slug={food.slug} />`. The `Collapsible` root uses `className="contents"` so the trigger stays a normal flex-wrap chip when collapsed, and the content becomes a full-width sibling that wraps onto its own line when open — every existing call site (trends, discovery, the benefit explorer) gets the fix at once.
- **`client/src/components/PlantDiversityReport.tsx`:** `ReportRow`'s existing expanded-row block (it already had a per-row expand/collapse mechanism, previously showing only `FoodReport` plant data and the day→meal mapping) now also renders `<FoodQuickLook slug={variety?.canonicalSlug ?? row.canonicalKey} />`, giving every row — not just plant-based ones — the benefits/connected-food content that was previously reachable nowhere in this tab.

## Definition of Done

- **Success:** tapping a food in either tab expands benefits + connected-food content in place, without navigating away; tapping again collapses it; `/foods/:slug` visited directly still renders the full page unchanged.
- **Must not break:** the standalone `/foods/:slug` route and its content; `PlantDiversityReport`'s existing sort options and `FoodReport` content; `HouseholdNutritionCentre`'s aggregate stats, benefit explorer, trends and discovery sections; `NUTRUI1`'s scope-card copy.
- **Manual test steps:** open `/nutrition`; on the Foods tab, click a row to expand it, confirm benefits/connected-food content appears alongside the existing `FoodReport` content with no page navigation, click again to collapse; switch to the Nutrients tab, click a food chip in Trends/Discovery/the Benefit Explorer, confirm the same in-place behaviour (not a route change); confirm keyboard operability (Tab to the chip/row, Enter/Space to toggle); confirm a food with no Food Intelligence data renders nothing extra rather than an error; visit `/foods/:slug` directly by URL and confirm the full page is unaffected.
- **User-acceptance evidence:** not captured in an authenticated live household session — the client build and typecheck passed (below), but viewport/interaction acceptance remains for owner review, same disclosed gap `NUTRUI1` recorded.

## Validation performed

- `npm run typecheck` — same 14 pre-existing diagnostics in unrelated `server/scripts`/`server/tests` files, before and after this change (byte-identical diff of the error output). Zero errors in any of the five files this change touches.
- `npm exec vite -- build --outDir <isolated folder> --emptyOutDir` — passed twice (before and after the Button/Skeleton correction), ~25-49s. Pre-existing large-chunk warning only.
- `git -c core.autocrlf=true diff --check` on the five touched files — passed (the raw `git diff --check` reports every line as "trailing whitespace" repo-wide right now, which is the pre-existing CRLF-vs-committed-LF noise described above, not a real whitespace defect; the autocrlf-normalized check is the meaningful one and it's clean).
- `npm run adoption:check` — run twice. First pass correctly flagged a raw `<button>` and a raw `<Loader2>` as rival-pattern usage; corrected to `Button`/`Skeleton`; second pass confirmed both ceilings returned to their exact pre-existing failure numbers. The other 10 of 12 total register failures are unrelated to this change (quantity-string floor, tone/orphan modules from other work) and were not touched.
- Tests were not run (none exist for this component yet; out of this task's scope). Full `npm run build` was not run — it deletes the existing `dist` directory first, which already holds other output; matches `NUTRUI1`'s same documented reason for using an isolated `--outDir` instead.

## Data impact

- Reads existing data: YES — `/api/foods/:slug/intelligence` (already used by the full Food Page) and `/api/foods/:slug/connected` (already used by `ConnectedFoodPanel` there).
- Writes new data: NO.
- Changes meaning of existing data: NO.
- Backfill/migration: NO.

## Trust check

No new claim, certainty, or health interpretation is introduced — `FoodQuickLook` renders the exact same validated sections (`healthBenefits`, `ConnectedFoodPanel`'s relationship sections) the full Food Page already renders from the same assembler, just in a different place. An unknown or failed slug disappears silently rather than asserting an absence as fact, consistent with the rest of this codebase's progressive-enrichment pattern.

## Rollback plan

- Identifier: `rollback/nutrition-implementation-plan-20261027` → `bffc533d65f58ae30c1faf7d3026b50dcc17be89`.
- Restore only the five files listed under "This task's tracked writes" after reviewing each current diff against this report. Preserve every other dirty path (NUTRUI1, Planner, Home exterior, Analyser, and the line-ending noise) exactly as found.

## Scope lock

- **Implemented:** one shared in-place expansion component; wired into both Nutrition tabs' food references; two canonical-component corrections surfaced by measurement (Button, Skeleton).
- **Excluded for later decisions:** what "Over time" should show per food; ranking foods by nutrient amount ("Highest" sort); "pairs well with" nutrient-complementarity content; Diary's relationship to Nutrition; Product Registry updates for `page-food-detail.md`/`page-nutrition.md` (filed above as a suggestion, not implemented).

**SUGGESTIONS:**
1. Update `page-food-detail.md`'s two stale defect entries and add a registry note for the new in-place journey. 🟢 GREEN. Requires approval.
2. Resolve `ARCHITECTURE_PRINCIPLES.md`'s contested-domains section (M1/M4) — it still names three files confirmed deleted from the repo. Unrelated to this task; found along the way. 🟢 GREEN. Requires approval.

## Capability Boundary Assessment and Implementation Completion Report

**Architecture Complete: YES.** Reuses existing canonical owners throughout (Food Intelligence Assembler, Connected Food Panel, Collapsible, Button, Skeleton); no new entity, store, or calculation.

**Engineering Complete: PARTIAL.** Typecheck, focused build, and adoption-register validation all passed with no new debt. Repository-wide typecheck and the Product Registry verifier retain pre-existing, unrelated failures (noted above); full `npm run build` was not run for the same documented reason `NUTRUI1` gave. No automated test suite exists for this component.

**Interaction Complete: PARTIAL.** Keyboard operability follows from using `CollapsibleTrigger`/`Button` (both already keyboard-accessible by construction) rather than a hand-rolled toggle, but this was not verified in an authenticated live session or at non-default viewport/zoom.

**Existing assets used:** `components/ui/collapsible.tsx`, `components/ui/button.tsx`, `components/ui/skeleton.tsx`, `ConnectedFoodPanel`, `IntelligenceCard`, `IntelligenceChipGroup`, the existing `/api/foods/:slug/intelligence` and `/api/foods/:slug/connected` endpoints.

**New assets required:** NONE.

### Remaining gaps

1. **Repository Gap — no live-session/viewport acceptance.** Attribution Test: YES, another implementer would face the same lack of an authenticated live session in this environment. Impact: the manual test steps above are specified but not executed against a running app. Recommended next action: Colin (or whoever has an authenticated session) runs the Definition of Done's manual test steps. Recommended capability: continue implementation — nothing here is blocked, just unverified live.
2. **Repository Gap — Product Registry entries not updated.** Evidence: `page-food-detail.md`/`page-nutrition.md` now describe a path that no longer matches the live interaction. Attribution Test: YES. Impact: registry staleness, not runtime behaviour. Recommended next action: approve Suggestion 1 above. Recommended capability: continue implementation.

**Stop Test:** no additional in-scope work remains blocked by either gap; both are named above rather than silently left for the next person to rediscover.
