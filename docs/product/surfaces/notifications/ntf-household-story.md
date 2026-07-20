---
entry: ntf-household-story
name: Household observation notice
section: notifications
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-20
version: 1
---

# Household observation notice

> Something true THA has noticed about how this household actually eats.

## What it is

A `low`-priority notice carrying one headline from the Story Engine — a
statement about this household's own eating, in the engine's own words:
*"Lentils quietly appeared in more and more meals."* · *"Friday became pizza
night."* · *"This spring you discovered artichokes."*

It **observes and does not advise.** The headline crosses the Behaviour Engine
verbatim, with no guidance prefix and no per-personality rewording — all six
voices say it identically, because the voice may change how THA sounds and never
what it claims is true. Whether anything further is appropriate is a separate
decision the Companion makes afterwards; the noticing itself arrives unadorned.

It is always `low` priority, so it can never displace a safety signal or an
actionable gap from the Companion's two-notice attention budget.

## Where it comes from

| | |
|---|---|
| Shaped by | `server/intelligence/conversation/notice-engine.ts` (`noticeHouseholdStory`) |
| Derived by | `server/lib/household-companion-fields.ts` (`deriveHouseholdCompanionFields`) |
| Owned by | `shared/stories/engine.ts` — the Story Engine (WS10) |
| Read at | `GET /api/intelligence/companion/notices` |

**No observation logic was created for it.** PRESENCE2 gave an existing
derivation a reader. `deriveHouseholdCompanionFields` has computed these
headlines on every Home and Planner load since PHASE5B; `UX3` then removed the
grid that rendered them — correctly, because a room may not speak about a
household in that register (GEA8) — and gave them to nobody. They were derived,
serialised and discarded at the client until PRESENCE2 routed them to the
Companion, which is the owner GEA8 names.

## When it stays silent

Often, and by design.

- **No date anchor, no story.** The Story Engine refuses to produce anything from
  planner entries it cannot date (WS10's date gate, `CONV1 BEH-5`). Most THA
  households have no `weekStartDate` anchor and never will, so for most
  households this notice is permanently silent. That is the honest answer, not a
  defect: THA cannot say when this family ate what.
- **No history, no story.** An empty history yields nothing rather than a
  fabricated stand-in.
- **Trust-banned phrasing is dropped**, headline and facts alike, by the Story
  Engine's own ban list — which forbids gamification, deficit framing, decline
  comparison and health verdicts before this notice ever sees a sentence.

## Why it exists

It is the answer to `PRESENCE1`'s owner decision 2 — *where should the noticing
be spoken?* — settled as **(a) the Companion, and only the Companion**.

## Related

- [[ntf-seasonal-highlight]] — its sibling; same pass-through shape, different owner
- [[cap-companion]] — the one voice permitted to say it
- [[ntf-streak-milestone]] — what it replaced
- [[ntf-diversity-milestone]] — what it replaced

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-20._
