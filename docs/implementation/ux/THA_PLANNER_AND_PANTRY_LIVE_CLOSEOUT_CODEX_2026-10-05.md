# THA Planner Proposal and Pantry Live Closeout

**Reviewer:** Codex  
**Signed:** 5 October 2026  
**Scope:** G: integrated development worktree and existing managed DEV browser session.  
**Result:** Proposal panel repair verified in the live UI; one nonempty BW03 review generated and canceled. BW04/BW08 profiles verified, but no proposals generated for them. Pantry/fridge scene visually reviewed without moving items.

## Executive summary

The remaining Smart Suggest failure was caused by the Planner assistant panel reserving too much vertical space. At the 898×612 browser viewport, the proposal button lay below the visible area and near the fixed bottom navigation. The previous `/orchard` landing is consistent with the navigation overlay receiving the click; this exact click target was not captured, so that part is an **Inferred** explanation. I reduced the height cap for both Planner assistant panel variants and retained the panel’s internal scrolling.

After the change hot-reloaded in the existing session, one normal proposal action produced a Smart Review with 18 proposed meals and remained on `/planner`. The UI displayed total meals 18, estimated cost £72, and average UPF “Unknown.” I inspected one internal and one external Preview, then closed them and used **Cancel**. No proposal was applied. The hook temporarily cached the review in tab `sessionStorage`; Cancel cleared that review state. No household, planner, shopping, diary, or profile records were changed.

The Pantry and Fridge views look coherent overall at 898×612, with no obvious floating jars or detached products in the static scenes. The Fridge canvas extends 34px beneath the fixed bottom navigation. Claude’s empty-image fix is live: the fridge has 33 hotspots, zero empty-source image elements, and zero broken image sources. No Pantry/fridge files were edited. A wider viewport was unavailable through the exposed in-app browser controls.

## Environment and session evidence

- **Verified:** initial active browser tab was the app at `http://127.0.0.1:5001/admin/benchmark-households`; document title was **The Healthy Apples**. The Admin page described the Benchmark World as DEV-only and listed ten seeded benchmark households.
- **Verified:** HTTP health checks returned 200 for `127.0.0.1:5000/`, `127.0.0.1:5001/`, `127.0.0.1:8789/health`, and `127.0.0.1:8791/health`.
- **Verified:** current listener PID and process start-time pairs matched the existing ownership receipt `G:\The Healthy Apples\Infrastructure\tha-chatgpt-bridge\logs\managed-dev\20261004T201150016Z\ownership-receipt.json`: 5000/27708/2026-10-04T20:11:50.8017763Z; 5001/14560/2026-10-04T20:11:51.3718383Z; 8789/27060/2026-10-04T20:11:52.0313425Z; 8791/35120/2026-10-04T20:11:52.6269790Z. This supports continuity with the approved G: managed DEV runtime. No services were started, stopped, or restarted.
- **Not established:** the current database branch identity and fresh executable argument/parent-chain evidence were not independently verified during this run. No `.env`, credential store, token, or secret content was accessed or recorded.

## Planner proposal trace and result

### Source path

1. `PlannerAssistantPanel.tsx` renders **Propose My Plan** with `onClick={onRunSmartSuggest}`.
2. `weekly-planner-page.tsx` supplies `onRunSmartSuggest: () => runSmartSuggest()` through the Planner workspace context.
3. `use-smart-suggest.ts` sends `POST /api/meal-plans/smart-suggest`, parses the response as `SmartSuggestResult`, calls `setSmartResult(data)`, and calls `onReviewReady()`; the Planner callback changes the assistant mode to `smart-review`. The hook’s catch path displays a “Plan generation failed” toast. No Planner or Orchard navigation is part of this success path.
4. `server/routes.ts` authenticates the request, reads profile, meal, eater, safety, preference, nutrition and category data, calls `generateSmartSuggestion`, then returns JSON. It does not persist a plan or shopping entry. The service can make source lookups through its existing source gate. Apply/import and planner-item writes are separate client actions and were not activated.

This confirms the user-facing control uses the previously reviewed read-only generation route. The live request was initiated only through the normal Planner UI after the panel repair.

### Verified defect and repair

**High severity functional issue, now repaired:** the fixed bottom navigation begins at y=547 in the 612px viewport. Before this task, the Smart assistant used `max-h-[calc(100vh-6rem)]`, allowing the sticky panel to extend below the available space and placing **Propose My Plan** outside the visible region. In the earlier live layout, the button was around y=768 and the Orchard navigation item occupied the same lower viewport area after scrolling. The proposal hook contains no navigation to Orchard. The exact pre-fix hit target was not captured; therefore the previous Orchard landing’s connection to this collision is **Inferred (high confidence)**, not a directly observed hit-test.

**Change:** both the idle and active Planner assistant panels now use `max-h-[calc(100dvh-11.5rem)]`. Their existing `overflow-y-auto` content region can scroll the form inside the height reserved above bottom navigation. The Return to Admin control and review safety actions were preserved.

### Live proposal evidence

- **Verified:** at `/planner` under BW03, the Smart Review appeared immediately after one normal UI proposal action. It displayed 18 proposed meals; the summary read “Total meals 18,” “Est. cost £72,” and “Avg UPF Unknown.” The URL remained `/planner`; no failure toast appeared. This is user-visible evidence of a nonempty proposal result rather than an empty review or a discarded navigation.
- **Network limit:** the available browser event API supports only download/file chooser events, not request/response capture. The managed backend log had no current-session request trace (its matching older entry predated this run). Accordingly, the exact HTTP status, duration and raw response were not captured. The rendered review is the evidence used for the outcome; I do not claim a network-observed 200.
- **External Preview — Jamaican Cornmeal Porridge:** visible ingredients were water, coconut milk, fine yellow cornmeal, vanilla extract, ground cinnamon, ground nutmeg, ground allspice and sweetened condensed milk. No meat or fish was visible. Milk is present in the condensed milk; BW03’s live profile did not show a dairy allergy. Ingredient text does not establish cross-contact or source reliability.
- **Internal Preview — Shakshuka:** visible ingredients were free-range eggs, tinned chopped tomatoes, red pepper, onion, smoked paprika and feta. No meat or fish was visible. The review card stated “Fits all household members.” Ingredient text does not establish cross-contact.
- **Verified:** both Preview panels opened in-place on `/planner`; each had a Close control. They exposed no import/apply action. I closed both and clicked the review’s **Cancel**, which cleared the visible review. I did not click Apply, Add to basket, Analyse nutrition, Add to freezer, regenerate, planner-save, or any other write-capable control.
- **Scope:** only the two requested candidate previews were ingredient-inspected. The remaining candidates and any ingredient provenance/cross-contact conditions were not independently inspected. No per-member swaps were expanded; the internal sample’s visible fit statement was the only adaptation evidence recorded.

## Synthetic household results

All identities below were selected through Admin → Benchmark Households → **Impersonate** and verified by the BW alias, household row, session banner and live Household/Profile UI. Member names are omitted from this report.

| Account / household alias | Live eater facts | Proposal outcome |
|---|---|---|
| **BW03 — Patel Household (Auto)** | Two adult eaters. Both show Vegetarian, Meat under other dietary restrictions, and Fish under allergies/intolerances. | One review rendered with 18 suggestions. The sampled external porridge and internal Shakshuka previews contained no visible meat or fish. Internal card said “Fits all household members.” Only these samples were checked; full ingredient-level fulfilment is not established. |
| **BW04 — Reeves Household (Auto)** | Two adult eaters. Both show Vegan; Fish, Dairy and Eggs under allergies/intolerances; Meat and Honey under other restrictions. | Profile verified only. No proposal generated under the one-bounded-proposal limit. |
| **BW08 — Okafor Family (Auto)** | Two adults and one child. Signed-in adult’s Profile summary says “Nothing noted.” Household Eaters separately lists Tree nuts and Sesame for the child. | Profile verified only. No proposal generated under the one-bounded-proposal limit. The difference between the adult summary and child card is a **display-scope risk**, not evidence that Smart Suggest ignored the child’s allergies. |

The Admin flow returned to `/admin/benchmark-households` between BW03, BW04 and BW08 sessions. The visible Return to Admin control was used each time. After the visual pass under BW08, the session was returned to Admin again. No profile, household or pantry data was edited.

## Pantry and Fridge visual review

**Viewport:** 898×612 CSS pixels. Visual screenshots were inspected in the live browser and not saved, to avoid retaining account or household context. No item was dragged or moved.

- **`/pantry` — verified:** the whole-room scene rendered at x=45, y=21, 808×539. Shelf rows and jar groupings appeared aligned in the photograph; baskets and worktop objects appeared grounded. No obvious floating or misplaced pantry object was seen. The fixed bottom navigation begins at y=547 and covers the final 13px of the scene plate.
- **`/pantry/fridge-preview` — verified:** the static fridge scene rendered at x=50, y=59, 783×522 (3:2 canvas). The central shelves, door jars, produce and drawer looked coherent; no obvious floating product, displaced jar, or broken-image icon was visible. The fixed navigation begins at y=547 and covers the lowest 34px of the canvas, including part of the lower fridge casing. **Severity: Low, visual/clipping.** Expected: the scene remains visible above navigation. Observed: the canvas extends to y=581 behind the bar. Impact: a small strip of the lower scene is obscured. Recommendation: reserve the bottom-navigation height in the scene canvas sizing or make the scene scroll fully clear of the bar.
- **Fridge image fix — verified live:** 33 interaction hotspots; zero `<img>` elements with empty `src`; zero hotspot image sources with `naturalWidth=0`. This confirms the seven hidden empty-source drag-thumbnail elements reported by Claude are no longer present. It does not establish image completeness for drag ghosts; no item was dragged.
- **Destination overlay — verified:** Shopping list, Companion and Kitchen bin destinations are visible at the lower-right of the scene. The shopping pad contains a visible “Shopping” mark; Companion and bin are pictograms. Their smaller drop instruction labels are hidden visually at desktop width by the current CSS, though destination names/subtext remain in accessible labels. **Severity: Low usability/accessibility risk.** Recommendation: consider showing concise labels on hover/focus or persistently if users do not recognize the pictograms.
- **Vegetable drawer:** opened by its UI button; the browser auto-scrolled the page to main scrollTop 127, placing the canvas top at y=-68. The resulting top crop followed that scroll position, so it is not recorded as an image defect. No food item was moved.
- **Wider viewport:** not tested. The in-app browser controls exposed no resize operation; Ctrl-minus did not change the reported viewport dimensions (still 898×612). No claim is made about wider layouts.

## Changed files, checks and safety

Files changed in this task:

- `client/src/components/PlannerAssistantPanel.tsx` — reduced the assistant panel’s viewport height cap for both variants.
- `server/tests/test-planner-smart-suggest-entry-layout.ts` — extended the focused contract to cover the visible proposal handler, hook-to-route wiring, response-to-review state update, assistant height cap and internal scroll region.
- `docs/implementation/ux/THA_PLANNER_AND_PANTRY_LIVE_CLOSEOUT_CODEX_2026-10-05.md` — this signed closeout.

Existing work from the previous Planner-layout task (`weekly-planner-page.tsx`, `client/src/styles/planner-physical.css` and its test) was preserved. No Pantry/fridge source, asset, configuration, `.env`, authentication, safety-enforcement or household data was changed.

Checks:

- `npx tsx server/tests/test-planner-smart-suggest-entry-layout.ts` — passed.
- `npx tsx server/tests/test-synthetic-review-ui-contract.ts` — passed (4 contracts).
- `git diff --check -- client/src/components/PlannerAssistantPanel.tsx server/tests/test-planner-smart-suggest-entry-layout.ts` — passed.
- Live BW03 Planner proposal/Review/Preview/Cancel — passed at the user-visible level.
- Live BW03/BW04/BW08 identity/profile inspection — passed through normal Admin UI.
- Live Pantry/Fridge rendering and empty-image check — passed; lower scene clipping and hidden visual drop labels noted above.

At task start the worktree contained extensive dirty and untracked files, including unrelated Pantry/fridge work. No staging, commit, stash, reset, clean, branch switch, push, service restart or tracker change was performed. No milestone status, percentage or RAG was changed.

## Remaining limits and next safe action

The proposal flow is now reachable and produced a nonempty BW03 review. The exact network status/body was not captured. BW04 and BW08 Smart Suggest results remain untested; only their live Profile/eater summaries were checked. The BW03 sample review does not prove every suggestion safe, does not prove cross-contact status, and does not validate every household member adaptation.

Next: capture a browser/network trace in an approved read-only manner and run one normal proposal review for BW04 and BW08 if continued archetype coverage is required. Inspect visible Preview ingredients against each verified household’s hard restrictions/allergies, Cancel each review, and return to Admin. Separately address the low-severity Pantry/Fridge bottom-bar overlap without changing household data.

**Signed,**  
Codex  
5 October 2026
