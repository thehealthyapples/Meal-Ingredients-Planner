# INTLANG1 — Intelligence Language Guide

**Session ID:** `INTLANG1_Intelligence_Language_Guide`
**Opened:** 2026-07-17
**Branch:** `int1-intelligence-platform`
**Type:** Governing architecture document — authoring only. **No implementation. No runtime behaviour change. No new capability.**
**Risk:** 🟢 GREEN (a single new Markdown document under `docs/architecture/`; product source byte-untouched)

---

## Rollback

| Item | Value |
|---|---|
| **Rollback identifier** | `rollback/INTLANG1-intelligence-language-guide-20260717` → `7bfad50c` |
| WIP tag | `intlang1-wip-snapshot-7bfad50c` |
| Working tree at start | **Intentionally dirty — NOT MINE.** Pre-existing uncommitted work from sibling sessions (NORTH3/4/5, CONV1 P10, P0, FI18, ADMIN1, INT19). The tag protects committed state only. Not touched, not committed, not reverted. |

---

## Mission

Design the permanent language of THA Intelligence — the governing language for every intelligence interaction. A governing architecture document. **Do not implement. Do not change runtime behaviour. Do not create capabilities.**

Define how THA speaks during: Welcome Home · Quiet moments · Planner suggestions · Pantry discoveries · Shopping guidance · Cookbook exploration · Celebrations · Micro-learning · Household achievements · Safety alerts · Honest uncertainty · Errors · Empty states.

For each moment: Ordinary app language · THA language · Why the THA version feels human · Emotional objective · Anti-patterns to avoid.

Finish with ten enduring principles every future feature must follow before release.

---

## The decision that shapes the session

This document is a **sibling** to the existing voice/feeling owners, not a rival. It must:
- **restate no rule** owned by `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` (the Companion's voice), `THA_EXPERIENCE_LANGUAGE.md` (the feeling), or the Notice/Discovery principles (how facts are surfaced) — it **cites** them;
- own only what none of them owns: **the concrete per-moment word-craft of Intelligence** — the sentence that is spoken at each of the thirteen moments;
- be subordinate to the Experience Architecture (which prevails in any conflict), and a non-overriding sibling of the Experience Language and the AI Experience & Conversation Architecture;
- create **no** colour, token, route, capability, or runtime dependency.

---

## Checkpoints

- [x] Architecture bootstrap read (`docs/architecture/README.md`)
- [x] `git status` confirmed; rollback branch + WIP tag created at HEAD (`7bfad50c`)
- [x] Run file opened
- [x] Sibling voice/feeling/notice owners read (Explore agent); exact rules + canonical phrases gathered to cite (not restate) — TIP3 §9/§11/§12/§13, Experience Language §3/§3A/§4/§4A/§5/§6/§7, Kept Room §5/§7, Notice Engine §0/§2/§6/§9, Discovery Principle, TIP1 §3/§4.3/§5.3, Principle 6
- [x] `THA_INTELLIGENCE_LANGUAGE_GUIDE.md` authored under `docs/architecture/` — 13 moments × 5 faces + 10 enduring principles + Intelligence Language Check
- [x] README index updated (governing document indexed at creation, per INTA1 §4.1 / INT17 precedent) — Intelligence Governance table row + descriptive blockquote
- [x] `repo-structure-verify` run — 3 FAILs, **all pre-existing sibling debt** (stray root `.txt` files; loose files under `docs/implementation/`+`docs/investigations/`); my file sits under `docs/architecture/` (no failing check touches it) and is indexed
- [x] CURRENT.md dashboard row added
- [ ] Owner review

---

## Stage

**Complete — awaiting review.** Governing document `docs/architecture/THA_INTELLIGENCE_LANGUAGE_GUIDE.md` authored and indexed. **No implementation, no runtime change, no capability** — one new Markdown doc + README index edit. Product source byte-untouched.

## Two boundaries fixed before writing (the corrections that shaped the doc)

1. **There is no `critical` notice tier** — Notice priority is only high/medium/low, copied verbatim from producers. The mission's "Safety alerts … critical" was resolved to its real owners: **TIP3 §11.2 rule 3** (*interruption reserved for safety; recalls the canonical immediate interrupt*) for the *licence to interrupt*, and the Notice Engine's verbatim-producer discipline for the *fact*. **No new tier coined** (would trip Notice Engine §9's hard stop).
2. **The doc creates no runtime dependency and no canonical string** — every example sentence in §4 is an *illustration of the register*, never a copy to paste. A household's actual words come from their owners (Notice producer, verbatim; Companion via INT17). The guide governs the *character* of the words, never becomes a second place they live (Principle 2 / one-owner).

## Next action

Owner review. Nothing else pending — the document is self-contained governing architecture and creates no follow-on engineering work.
