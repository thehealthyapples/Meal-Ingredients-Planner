---
title: Knowledge Claim Sign-off Report — for Codex
date: 2026-11-06
author: Claude (Sonnet 5), at the direction of Colin Clapson
audience: Codex (nutrition-source review task)
status: snapshot — figures drift as both agents work the same queue concurrently
---

# Knowledge Claim Sign-off Report — 2026-11-06

This is a handoff report for Codex, which is researching sources for the
remaining **uncited** claims in `/admin/knowledge-claims`. This report covers
the opposite half of the queue — claims that **already had citations** and
were waiting on human sign-off — which were reviewed and published today.
It exists so Codex doesn't spend research time on claims that are now done,
and so Codex's own count-verification step starts from current numbers
rather than the figures in its original brief.

## What happened today

Two batches were run through `npm run knowledge:signoff` (the CLI sign-off
gate documented in `server/seeds/signoff-knowledge-claims.ts`), after a dry
run confirmed every claim carried a structurally valid Layer-1 citation
(real source body/title/URL, no `[BAD]` entries, zero citation problems).
Both batches were approved under the reviewer identity
`"THA Editorial — authority-sourced"` — chosen deliberately: the owner
(Colin) is not personally certifying the medical/nutritional fact, he is
confirming each claim correctly cites a named regulatory or government
authority (USDA FoodData Central, Health Canada's Canadian Nutrient File, UK
CoFID, NHS, EFSA Regulation 432/2012). Every decision is permanently recorded
in `knowledge_review_audit`.

| Batch | Composition | Food→benefit | Nutrient→benefit | Total |
|---|---:|---:|---:|---:|
| Batch 1 | 888 | 6 | 15 | 909 |
| Batch 2 | 27 | 39 | 0 | 66 |
| **Newly approved today** | **915** | **45** | **15** | **975** |

Separately, **48 pre-existing composition claims** (approved 2026-11-05 under
the reviewer name "Crazy Col") were **relabeled only** — same claim, same
citation, same original approval date — to the same reviewer identity, for
attribution consistency. This is not a new sign-off; see
`signoff-manifest-20261106-relabeled.csv`.

A benefit chip only ever renders where **both** halves of its evidence chain
are signed off (`food → nutrient` composition claim AND `nutrient → benefit`
claim, or a direct `food → benefit` claim). Nothing was force-published —
claims with no structurally valid citation were left exactly as found.

## Corrected totals (supersedes the original brief's "2,340" figure)

The original brief said *"2,340 claims awaiting sources: 987 composition,
1,321 food-benefit, 32 nutrient-benefit."* That was already stale before
today's sign-off, and sign-off doesn't change the uncited count anyway (it
only touches claims that already had citations). Live totals as of this
report (**will keep drifting** — both agents are working the same tables
concurrently, confirmed by `cited_pending` rising again between two checks
minutes apart during this session):

| Edge | Uncited (no source) | Cited, awaiting sign-off | Approved | Total rows |
|---|---:|---:|---:|---:|
| Composition | 1,018 | 7 | 963 | 1,988 |
| Food→benefit | 1,312 | 9 | 45 | 1,366 |
| Nutrient→benefit | 31 | 3 | 36 | 70 |
| **Total uncited** | **2,361** | — | — | — |

Recommend re-querying these counts immediately before starting work rather
than trusting this table either — it's already a few minutes old.

## What this means for Codex's task

- **Do not research sources for anything in the attached manifests** — those
  975 claims are already cited, reviewed, and live.
- The **"cited, awaiting sign-off"** column (7 + 9 + 3 = 19 claims right now)
  is new since this report's figures were pulled, which means a citation
  attachment process is running concurrently with this report. If that's
  Codex's own output landing live, no action needed; if it's something
  else, worth a sanity check before the next sign-off pass.
- Everything in the **uncited** column (2,361 claims) is exactly what the
  original brief asked Codex to research. That queue is untouched by
  today's work.

## Manifests (claim-keyed, as requested in the original brief)

All in `docs/investigations/knowledge/`, one row per claim, with the claim
ID, food/nutrient/benefit slugs, the stored source (body/title/URL), and the
approval date — so claim IDs can be diffed directly against the live queue:

- `signoff-manifest-20261106-composition.csv` (915 rows)
- `signoff-manifest-20261106-food-benefit.csv` (45 rows)
- `signoff-manifest-20261106-nutrient-benefit.csv` (15 rows)
- `signoff-manifest-20261106-relabeled.csv` (48 rows — relabel only, not a new approval, see note column)

## Scope note

This work used the existing, governed sign-off CLI — no app code, schema, or
UI was touched, and no claim's citation or wording was authored or altered;
the tool only writes `reviewed_at` / `reviewed_by` on claims that already
carried a valid citation. Full detail of the fix session that preceded this
(Companion field-exposure and intent-routing work) is unrelated and not
included here.
