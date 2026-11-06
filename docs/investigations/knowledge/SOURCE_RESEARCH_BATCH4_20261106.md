---
title: Uncited Claim Source Research — Batch 4 (coordination pivot)
date: 2026-11-06
author: Claude (Sonnet 5) autonomous fork, at the direction of Colin Clapson
audience: Codex (nutrition-source review task) and human reviewer
status: mixed — one citation actually attached (prepared, not approved); rest is research + coordination findings
---

# Batch 4 — resolving the Codex overlap, then a small verified attach

This batch is different from 1–3: it starts by resolving a real
coordination problem (two agents working the same live queue), then does a
small amount of genuinely new, verified work once the exclusion set was
clean.

## The Asiago/bocconcini contradiction — resolved

Batch 1 said Asiago (4998–5000) and bocconcini (5001–5003) had "no USDA
record — leave uncited." Codex's handoff doc listed these as already
sourced. Checked the live `source_refs` directly: Codex used **Health
Canada's Canadian Nutrient File (CNF 2026)**, not USDA — a source family
this research hadn't checked. Real, specific citations (exact CNF food IDs
7732/7743, sample counts, lab-analysis source codes):

- 4998 asiago→protein: CNF 2026 food 7732, 25.48 g/100g
- 4999 asiago→calcium: CNF 2026 food 7732, 809 mg/100g
- 5001 bocconcini→protein: CNF 2026 food 7743, 18.82 g/100g
- 5002 bocconcini→calcium: CNF 2026 food 7743, 426 mg/100g
- 5000/5003 (iodine, both foods): still uncited — CNF doesn't carry it either. Genuine gap, not an oversight.

**Not an error on either side** — just two different valid primary-source
families. Worth both agents checking CNF alongside USDA/CoFID going
forward; USDA-only research (Batches 1–3's method) will keep missing real
matches that exist in Canada's database.

## Building the exclusion set

Queried the live database directly rather than parsing the ~140 report
files in `Incoming\Agent Reports\` (files lag reality — both agents write
concurrently). As of this batch: **153 claims cited-pending, 100% prepared
by Codex** (141 composition, 9 food-benefit, 3 nutrient-benefit) — zero
prior overlap with anything I'd actually attached (my batches 1–3 never
wrote to the database, only to markdown reports, so there was no DB-level
collision despite the claim-ID overlap on paper).

One live collision during this batch: attempted to attach
`plant-protein → muscle-recovery` (claim 5), found via EFSA Reg 432/2012
("Protein contributes to the maintenance of muscle mass") — the write was
rejected because the claim had gone `is_active = false` between my survey
and the attach attempt (seconds apart). Not a bug — the governed function's
own concurrency guard working correctly. Re-pulled live state before
retrying anything further.

## Nutrient-benefit: real research, zero new safe attachments

Checked the remaining ~29 active uncited nutrient-benefit claims against
the actual EUR-Lex text of Regulation 432/2012 (not search-engine
summaries — fetched the regulation directly). Result: **every candidate
either had no exact-match authorized claim, or only a narrower/different
nutrient had the claim**:

- `unsaturated-fats → brain-health`: the authorized DHA→brain claim is
  specific to DHA, not the broader "unsaturated fats" category this app
  tracks. Not the same nutrient — not attached.
- `selenium → anti-inflammatory-support` / `vitamin-e → skin-health`: both
  nutrients have an authorized "protection of cells from oxidative stress"
  claim, but that is not the same claim as anti-inflammatory support or
  skin health specifically. Not attached.
- `protein → energy-support`: no EFSA claim mentions energy/fatigue for
  protein (only muscle/bone claims exist). Not attached.
- `vitamin-d → mood-support`, `beta-carotene → healthy-ageing`,
  `folate → healthy-ageing`: confirmed no matching authorized claim exists
  in the regulation at all.
- The phytochemical nutrient-benefit claims (polyphenols/flavonoids/
  anthocyanins/lycopene/sulforaphane/allicin/nitrates/live-cultures ×
  various benefits) weren't individually re-researched this pass — they're
  a different question from the Batch 3 composition finding (this is about
  physiological *effect*, which EFSA/NHS genuinely can authorize even for
  compounds USDA doesn't track as food content), but need their own
  dedicated research pass, not blanket dismissal.

**This is an honest zero, not a failure** — the brief explicitly says not
to stretch a source to reduce the queue count, and every one of these was a
real stretch.

## Food-benefit: one verified attach

`860: yoghurt → digestive-comfort` — attached, prepared (not approved).
Source: NHS, "Good foods to help your digestion" —
*"Probiotics are so-called 'friendly bacteria'... available as supplements
from health food shops, or in live yoghurt, which is a good natural
source."* Yoghurt is named explicitly; this isn't a generic probiotics
claim stretched onto an unnamed food.

**A genuinely useful negative finding** from the same page: garlic, onion,
chillies, tomatoes, citrus fruit, caffeine, and dairy are all named on this
page as IBS/heartburn **triggers for some people**, not digestive-comfort
supporters. If any of those foods have a pending `→ digestive-comfort` or
`→ gut-health` claim in the queue, this specific NHS page is the *wrong*
source for it — using it would misrepresent what the page actually says.
Worth checking whether any already-attached citations accidentally did
this.

Checked ginger, mint, fennel, chicory, kefir, kimchi, miso, and sauerkraut
against both the NHS IBS page and the NHS digestion page directly (not
search summaries) — none are named on either page. A search-engine summary
suggested an NHS trust PDF covers ginger/peppermint/fennel for digestion,
but the PDF wasn't text-extractable to verify the exact wording, so it was
not used. These foods remain uncited pending either a readable primary
source or acceptance that NHS's consumer pages don't cover them
individually.

## Live totals at end of this batch

| Edge | Uncited | Cited-pending | Approved |
|---|---:|---:|---:|
| Composition | 879 | 146 | 963 |
| Food-benefit | 1,311 | 10 | 45 |
| Nutrient-benefit | 31 | 3 | 36 |

Composition moved from Codex's continued concurrent work during this
batch (141→146), unrelated to this fork. One new food-benefit citation
(860) is this batch's sole database change.

## What's next

Food-benefit has the most headroom (1,311 uncited) and the lowest
cross-agent contention so far. The limiting factor isn't claim volume, it's
finding real, specific, named-food NHS/EFSA/gov.uk sources rather than
generic category statements — this batch's low attach-to-research ratio
(1 attached after checking ~10 foods across 2 edges) reflects genuine
source scarcity, not under-effort. A dedicated pass through
`nutrition.org.uk` (British Nutrition Foundation, also Layer-1 trusted) may
surface matches NHS's consumer pages don't carry.
