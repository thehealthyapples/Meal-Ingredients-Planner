# WX2_5 — Intelligence Experience System

**Status:** Implemented
**Date:** 2026-06-26
**Rollback identifier:** git tag `wx2-5-rollback-point` (at commit `a8a912a`)

---

## Summary

A reusable **Intelligence Experience System** that standardises how intelligence
is *presented* throughout The Healthy Apples. It defines one visual language, one
set of interaction/disclosure rules, and one tone — so the same intelligence
always looks the same regardless of page.

This workstream creates **presentation components only**. It owns no intelligence,
holds no state, fetches no data, and introduces no business logic.

---

## Architecture Compliance

### Canonical ownership — UNCHANGED

This workstream creates presentation components only. It owns no intelligence.
All intelligence continues to be produced by its existing canonical owners:

- Meal Intelligence Assembler (WX1)
- Home Intelligence (WX2)
- Canonical Food
- Discovery (WS8)
- Planner
- Household (WS10)
- Nutrition Enhancement
- Seasonality (WS11)

The components in this system are **pure** — they receive already-validated
intelligence via props and render it. They never call an API, never compute, and
never persist.

### Duplicate state — NONE

- No duplicated ownership — components own nothing.
- No duplicated persistence — components persist nothing.
- No duplicated calculations — components compute no intelligence.
- No synchronisation layer — there is no state to synchronise.

### Progressive enrichment — ENFORCED

Every component returns `null` when it has no validated content to show. There are
no placeholders, no skeleton-forever states, no fabricated content. A card that has
nothing to say simply disappears.

---

## What was created

All under `client/src/components/intelligence/`:

| File | Purpose |
| --- | --- |
| `intelligence-tokens.ts` | Single source of visual tokens: spacing, padding, icon/chip sizing, tone, and the canonical chip colour palette. |
| `IntelligenceChip.tsx` | Reusable chip + chip-group, one styling per intelligence kind (nutrient, benefit, seasonal, discovery, household, planner). |
| `IntelligenceCard.tsx` | Generic container: title, icon, body, optional chips, optional action, optional progressive disclosure. |
| `CelebrationCard.tsx` | Celebrate one genuine achievement. |
| `OpportunityCard.tsx` | Surface one gentle, actionable improvement. |
| `SeasonalCard.tsx` | Highlight food worth enjoying now. |
| `HouseholdInsightCard.tsx` | Surface one meaningful household observation. |
| `SimplyBetterChoiceCard.tsx` | Present one nutrition enhancement (from Nutrition Enhancement). |
| `index.ts` | Barrel export for the whole system. |

No existing page or component was modified. No migration was performed (that is
explicitly future work — see Scope Lock).

---

## Experience rules (enforced in code)

1. **One celebration.** `CelebrationCard` renders a single achievement.
2. **One opportunity.** `OpportunityCard` renders a single suggestion.
3. **Celebrate before improving.** Documented ordering; cards stack celebration → opportunity.
4. **Never punish.** No failure language; opportunities are framed as "You could…".
5. **Hide missing intelligence.** Every card returns `null` with no content.
6. **No confidence percentages.** No component accepts or renders a confidence value.
7. **Compact + progressive disclosure.** `IntelligenceCard` supports an optional collapsible detail region.
8. **Consistent across pages.** All colour/spacing/typography flow from `intelligence-tokens.ts`.

---

## Visual guidelines

Defined in `intelligence-tokens.ts` and consumed by every component:

- **Card padding:** `px-5 py-4` (compact), `rounded-xl`, soft border `border-border/30`.
- **Card surface:** `bg-background/60 backdrop-blur-sm` — calm, warm, never clinical.
- **Heading hierarchy:** card title `text-sm font-medium`; eyebrow label `text-[10px] uppercase tracking-wider text-muted-foreground/60`.
- **Body:** `text-sm text-foreground/80 leading-relaxed`.
- **Icon sizing:** `h-4 w-4` inline, rendered at reduced opacity to stay calm.
- **Chip sizing:** `text-[10px] rounded-full px-2 py-0.5 leading-none`, colour by kind.
- **Spacing:** vertical rhythm `space-y-3` inside a card, `gap-1` between chips.
- **Loading:** components do not own loading; callers pass content only when ready. If a caller needs a placeholder it uses the existing skeleton primitives — these cards never show their own spinner.
- **Empty:** return `null`.

---

## Accessibility

- All cards render semantic regions with `role` / `aria-label` where helpful.
- Optional disclosure uses a real `<button>` with `aria-expanded`.
- Optional actions are real `<button>` elements, keyboard reachable, with visible focus rings (`focus-visible:ring-2 ring-ring`).
- Colour is never the only signal — every chip pairs colour with text, every card pairs colour with an icon and label.
- Contrast: chip palettes mirror the already-shipped variety/benefit chips that meet contrast in light and dark themes.

---

## Trust principles

- Never fabricate — components render only what they are given.
- Never estimate — no computation happens here.
- Never invent confidence — no confidence prop exists.
- Never create placeholder achievements — `CelebrationCard` returns `null` without a real achievement.
- Every card traces back to validated intelligence supplied by a canonical owner.

---

## Data impact

| Question | Answer |
| --- | --- |
| Reads existing data | NO |
| Writes new data | NO |
| Changes meaning of existing data | NO |
| Requires backfill | NO |

---

## Manual verification

1. Rollback protection created — tag `wx2-5-rollback-point` ✅
2. Report created at `docs/investigations/ux/WX2_5_INTELLIGENCE_EXPERIENCE_SYSTEM_IMPLEMENTATION.md` ✅
3. Components compile — `tsc` typecheck passes ✅ (see Verification section below)
4. No existing pages changed — `git status` shows only new files under `intelligence/` + this doc ✅
5. No business logic introduced — components are pure presentation ✅
6. No schema changes ✅
7. Existing application behaviour unchanged — nothing imports the new system yet ✅

---

## Rollback plan

`git reset --hard wx2-5-rollback-point` (or delete the new
`client/src/components/intelligence/` directory and this document). No existing
page behaviour is affected because nothing imports the new system yet.

---

## Suggested future Intelligence components (DO NOT IMPLEMENT)

Documented for future workstreams only:

- **Food Story** — narrative arc for a single canonical food.
- **Meal Story** — narrative arc for a meal across time.
- **Discovery Timeline** — chronological discoveries.
- **Seasonal Journey** — what's coming into and going out of season.
- **Family Memories** — household memories and milestones.
- **Weekly Highlights** — the week's most meaningful moments.
- **Nutrition Journey** — long-run nutrition trends framed positively.
- **Shopping Insights** — gentle shopping-list intelligence.

These are presentation patterns only; each would still read from existing
canonical owners and follow the same trust + experience rules.

---

## Migration (FUTURE WORK — not in scope here)

Existing surfaces (`HomeIntelligenceCompanion`, `CookbookMealIntelligenceStrip`,
`MealFoodIntelligenceSection`, planner/pantry panels) will be migrated to consume
these components in later workstreams. This workstream intentionally does **not**
migrate them — it only establishes the reusable system.
