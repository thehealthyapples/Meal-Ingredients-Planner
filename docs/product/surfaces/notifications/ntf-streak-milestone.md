---
entry: ntf-streak-milestone
name: Streak milestone notice
section: notifications
status: retired
visibility: household
owner: Colin Clapson
last_verified: 2026-07-20
version: 2
---

# Streak milestone notice

> **RETIRED** (PRESENCE2, 2026-07-20). A quiet acknowledgement each seventh day of
> an unbroken streak.

## What it was

A `medium`-priority notice that read the household's existing streak row and
surfaced when `currentEliteStreak` was a multiple of seven. It was voiced through
the Personality Registry's celebration templates, so in the coach voice a family
was told: *"Target hit — a 7-day elite streak."*

## Why it is retired

**GEA13** forbids, by name, *"streaks and consecutive-day counts"* and
*"points, XP, levels, badges, trophies, tiers or ranks"*. This notice was both:
a consecutive-day count, presented as an achievement, in a tier called *elite*.

`PRESENCE1` removed nineteen judgement surfaces from eight rooms on the principle
that rooms report and the Companion interprets. This was one of the two that
principle had not reached, because it was not in a room — **it was in the
Companion's own mouth**. A Companion that streaks a household cannot be the
single trustworthy voice the rooms were made quiet for.

## What was NOT retired

`user_streaks` is untouched. The table exists, still holds what it held, and
keeps its other consumers. Only this notice producer was removed — the same
discipline `PRESENCE1` used when it removed consumers of `WEEKLY_PLANT_TARGET`
without touching the constant.

## What replaced it

[[ntf-household-story]] — which states a fact about what a family eats and passes
no verdict on it at all. It is not a gentler score; it is not a score.

## Related

- [[ntf-household-story]] — what replaced it
- [[ntf-diversity-milestone]] — retired in the same change, for the same rule

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-20._
