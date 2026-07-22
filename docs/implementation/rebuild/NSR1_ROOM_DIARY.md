# NSR1 Phase 2 — Diary (craft wave)

**Room:** Diary — `/diary` → `client/src/pages/food-diary-page.tsx`
**Rollback:** `rollback/NSR1-north-star-reconstruction-20260722` (→ `e16117d5`)
**Owners:** UIOWN1 §10 (Diary — the window seat) · CRAFT1 §5 · GEA3/8/9/13/21/22 · Core Principle 6

## Design (architecture first)
The window seat: calm, private, unwatched — a place a household *records* days, not one that grades
them. It reports what was eaten and how they felt; interpretation and encouragement are the
Companion's (GEA8/9/22). Household Time and the felt-scale were already at standard; this pass removes
the fabricated savings praise and the room's authored coaching voice.

## Changes (presentation-only)
1. **Removed the fabricated savings praise** in both log toasts — "Nice, that likely saved about £10
   vs takeaway" and "…likely saved about £10 vs takeaway" → plain "Added to your diary." An invented
   number and a congratulation on every log breach **Core Principle 6** (fabrication) and **GEA13/8**.
2. **Retired `getInsightText` and its render** — authored coaching keyed to logging *consistency*
   ("Small steps add up. Better choices today…", "Every entry helps…"): advice the room does not own
   (**GEA8/9/22**) and a reward for logging frequency (**GEA3** engagement).
3. **Deleted "Better choices today, stronger health over time."** under the meal slots — room-voice
   coaching over a family's food (**GEA21**).
4. **Neutralised the progress empty-state title** "When things drift, we help you find your way back —
   simply." → "Not enough recorded yet" — an honest absence, not counsel (**GEA15/17**).
5. **Removed reassurance microcopy** — "Your numbers don't define you…" (deleted) and "Add something
   to look forward to **— it helps**" → "Add something to look forward to." The room does not
   editorialise the household's own numbers (**GEA8/21**).

## Not done — routed to owners
- **`SavingsCard`** ("This week with THA · £X likely saved · N smarter choices") — whether savings
  belongs in the Diary at all is an owner decision (savings is Domain 17 uplift, not the window seat's);
  and the "likely saved" figure carries the same **Core Principle 6** concern as the toasts above, which
  the owner should weigh. **Flagged for decision; not removed unilaterally** (it is a whole surface, and
  its data source needs verifying before removal). *Recommendation: remove from Diary, or make it the
  Companion's, grounded.*
- **`LookingForwardWidget` countdowns** — `localStorage`-only; UIOWN1 §10 names them a Traditions-domain
  predecessor to converge or retire. Owner/backend.
- **Progress/BMI/target scope** — how much health-tracking the window seat carries (GEA13 "target"
  framing). Owner.

## Verification
`tsc --noEmit`: 0 errors in `food-diary-page.tsx`; no leftover `getInsightText` reference; no
test/e2e asserts a removed string (`data-testid="text-insight"` was its only hook). Diff: **21
insertions / 28 deletions** (net −7). Live visual review recommended.

## Data / Trust / Scope
No schema/API/storage/business-logic change; `server/` untouched. Removing the fabricated £ figures and
the coaching *increases* honesty (Core Principle 6; GEA13/8). Rollback: reset to the NSR1 tag.

## Quality Standard
The window seat is quieter and stops praising with invented money. The full yes waits on the
`SavingsCard` decision — the last fabricated-figure surface — and the health-tracking scope.
