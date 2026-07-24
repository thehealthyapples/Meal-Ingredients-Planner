
# Session: PROD4_Household_Experience_Completion

| Field | Value |
|---|---|
| **Session ID** | `PROD4_Household_Experience_Completion` |
| **Rollback ID** | `rollback/PROD4-household-experience-completion-20260718` |
| **Start time** | 2026-07-18T22:05Z UTC |
| **Current stage** | Complete — awaiting owner review |

## Objective
Complete the existing household experience across Home/Arrival, Planner, Pantry,
Diary, Household Nutrition, Companion; remove placeholder UI; connect existing
intelligence; improve consistency/responsiveness/accessibility; UX polish.
No new architecture, no new AI capability, no Community/Partner/commercial.

## Rollback protection
- Annotated tag `rollback/PROD4-household-experience-completion-20260718` → `b6cc6aaa` (HOUSE_ACT2)
- Dirty-tree snapshot `stash@{0}` → `69d886dc8b86e17e4cfe242c187ab0ca4f344c28`
  (`git stash create`/`store` — working tree NOT disturbed)
- **Coverage (ROLLBACK §3):** tag = committed state only; snapshot = 8 modified
  tracked files, **NONE of the 35 untracked** (concurrent sessions').

## De-duplication — THE critical step
Three sessions were already in this territory. PROD4 re-opened none of them:
- `HOUSE_ACT1` (6e326d9f) — build repair, `/shopping`→`/basket`, adoption re-measure
- `HOUSE_ACT2` (b6cc6aaa) — household learning in Planner/Pantry/Shopping/Cookbook
- `HOUSE_ACT3` — **running CONCURRENTLY in this working tree during the session**
  (`meal-detail-page.tsx`, `SimplyBetterChoicesPanel.tsx` are THEIRS, excluded)

Honoured HOUSE_ACT1's refusals (Partners/Support/Community/Companion-has-no-room)
and its 4 retracted false positives; honoured HOUSE_ACT2's 5 evidence-backed
declines ("these are Companion grounding, already correctly placed").

## Delivered — four changes, 16 files, 94 insertions / 15 deletions
1. **15 icon-only buttons named** + regression guard. My FIRST audit said 49; it
   was WRONG — the regex ended at the `>` inside `onClick={() => …}`, truncating
   before any following `aria-label`. A JSX-aware rescan gives **exactly 15,
   matching PROD1 §8 #10 precisely.** Acting on 49 would have added duplicate
   labels to 34 already-labelled controls. Includes the destructive template
   delete, the share-link copy button, and 5 inside Radix Tooltips (a tooltip is
   `aria-describedby` — a DESCRIPTION, never a NAME).
   Guard: `warnIfUnnamedIconButton` added to the EXISTING owner
   (`lib/a11y-dev-warnings.ts`, the register's recorded owner) + wired into
   `ui/button.tsx` for `size="icon"`. Verified stripped from production.
2. **Enrichment starvation fixed.** HOUSE_ACT2 flagged it and asked it be checked
   before its Nutrition door. **It is real and constant:** `nutrition-knowledge`
   declares **4** static enrichment items against `MAX_ENRICHMENT_ITEMS = 3`, and
   the merge was `[...static, ...nutrition, ...householdNutrition].slice(0,3)` —
   so on a NUTRITION turn its own static items filled every slot and both NUT1
   and FI5 were starved on exactly the turns they exist for. Round-robin now:
   demonstrated **0 → 2** nutrition items. No item created, reworded or reordered
   within its source.
3. **`/nutrition` is canonical**, `/plant-diversity` redirects (HOUSE_ACT1 rec #7).
   More wrong after PROD2 left the room hosting Foods + Nutrients — the path named
   one tab after the whole room. No bookmark or shared URL breaks.
4. No Companion UX change; PROD3's safety gate byte-untouched.

## REFUSED with evidence (the most useful output)
- **Learning on Home/Diary** — every `owningDomain` in the codebase is
  `cookbook|pantry|planner|shopping`. **No diary or home domain exists.** ACT2
  mounted it in exactly the 4 rooms that can hold content; adding Diary would be
  permanently-empty UI — the thing this brief asks to REMOVE.
- **Planner week convergence** (LAUNCH1 §3.7 "four of five") — the canonical hook
  FORBIDS any fallback (*"No `?? 1`, no localStorage fallback"*), and live data:
  **185 of 227 households (81.5%) have no anchored planner week.** Converging
  today leaves 4 in 5 households with NO week in the room they plan in. Blocked
  on the week-declaration path = new capability = out of scope. The localStorage
  read is not the defect; it is what holds the room up.
- **Nutrition Enhancement door** — ACT2's deferral upheld; PROD4 removed the
  blocker underneath it instead (building it first = a door onto an empty room).

## Definition of Done — 3 of 10 done/partial, 7 NOT done
Stated plainly, not rounded up (the HHP2 failure: *"'Complete' stops anyone
looking"*). Not done: Home/Arrival · Planner · Pantry · Diary · Companion UX ·
placeholder removal (found none surviving verification) · UX polish (ACT1:
*"the gap in THA is not polish"*).

## Verification
- a11y audit **74 scanned · 0 unnamed** (was 15) · tsc **94 unchanged**, none in
  touched files · adoption **82/0/0** · build exit 0 · **15 suites, 0 failures**
- Bundle: `/nutrition` present · labels present · a11y warning correctly absent
- 🔴 **NO BROWSER VERIFICATION POSSIBLE** (Playwright Chromium: `libglib-2.0.so.0`).
  Third consecutive session with this gap; ACT1 and ACT2 both closed with
  "USER ACCEPTANCE EVIDENCE: None captured". **Every visual claim by the last
  four sessions in this area is unproven in a browser.**

## Next action
Owner to review `docs/implementation/production/PROD4_HOUSEHOLD_EXPERIENCE_COMPLETION.md`.
Top recommendation is NOT a feature: **get a browser into the verification loop**
— it converts a large body of unproven UX work into evidenced work and is worth
more than anything else in the list. Then: the week-declaration path; the
Nutrition Enhancement door; `ui/overlay.tsx` 1-vs-14.
