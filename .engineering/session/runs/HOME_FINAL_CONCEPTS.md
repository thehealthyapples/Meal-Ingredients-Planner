# Session: HOME_FINAL_CONCEPTS

| Field | Value |
|---|---|
| **Session ID** | `HOME_FINAL_CONCEPTS` |
| **Rollback ID** | `rollback/HOME-FINAL-CONCEPTS-20260717` → `7bfad50c` |
| **WIP snapshot** | tag `home-final-concepts-wip-snapshot-7bfad50c` |
| **Start time** | 2026-07-17 |
| **Current stage** | Complete — awaiting owner decision |

## Objective
Create the **final five Home concepts** for The Healthy Apples before the Home experience is
permanently locked. **DO NOT redesign** the orchard, room, arch, furniture or layout — the ARRIVAL1
room is canonical and byte-untouched. Explore how the Home **experience should feel**: branding,
banner, greeting, typography, composition, materials, lighting, arrival sequence, emotional emphasis,
and the relationship between the greeting, apple and arch. Five genuinely different concepts on the
same room, optimised for emotional response (*the household should smile slightly every time they
arrive Home*), each premium, calm, warm and unmistakably THA:

- **A — The Signature Wall**
- **B — The Family Home**
- **C — The Architect's House**
- **D — The Orchard House**
- **E — Claude's Best Idea**

For each: rendered images (desktop + mobile) · design philosophy · emotional feeling · first-time
experience · everyday experience · strengths · weaknesses · why someone would love it. Close by
recommending **ONE** concept to become the permanent Home, with reasons.

## Method
Each concept is injected into the **live canonical `/home`** in the browser at render time only
(`scripts/capture-home-final-concepts.ts`, the BRAND1/BRAND2 discipline) — nothing edits app source.
Every image is the *same room*, changing only the expression of the experience. Renders in
`docs/ui-audit/home-final-concepts/`.

## Outcome
Five genuinely different **experiences** of the one canonical ARRIVAL1 room, each rendered on the live
`/home` at desktop + mobile by injecting the treatment in the browser only (app source byte-untouched):
**A The Signature Wall** (banner→apple · Pressed Apple · oak signature — *made by hand*) · **B The
Family Home** (golden light · "Morning," · warm daily line · floor plaque — *you are cared for*) · **C
The Architect's House** (cool museum light · refined serif name · more air · no mark — *composed
emptiness*) · **D The Orchard House** (green-gold halo · amplified one-morning · recessive greeting · no
mark — *a window onto life*) · **E "The House That Was Expecting You"** (warm dawn · "Good morning," ·
one true line of good news · Pressed Apple · banner→apple — *you were expected*).

**Recommendation: E** — it wins the mission's own test (*smile on arrival*) without surrendering
premium/calm/warmth, refuses the B-vs-C choice by holding both, is built almost entirely from
already-blessed decisions (BRAND1 banner reform + BRAND2 Pressed Apple + the room's own hand + D's one
morning) plus ONE new honest beat, and is unmistakably THA. **B is the warmth-first fallback; C the
timeless/cool fallback.** The one honesty caveat recorded so E is buildable not mocked: the good-news
line must be **data-borne, one-owner (Behaviour Engine), verbatim, and say less when there is less** —
no fabricated or templated greeting (Core Principle 6 · Blueprint §12.1 · NORTH1 §5.7); light is a
composition of the room's one morning, never a second sun.

Report: `docs/implementation/HOME_FINAL_CONCEPTS.md` (+ 12 renders under
`docs/ui-audit/home-final-concepts/`).

## Next action
Owner decision on which of the five becomes the permanent Home. **Nothing implemented** — if E (or any)
is chosen, a later separately-scoped change builds it on the room, honouring the §6 caveat.

## Product changed
**None (exploration only).** Room byte-untouched. Adds: this run file, the report, a render harness,
and the renders (+ reuse of the throwaway injected apple asset).
