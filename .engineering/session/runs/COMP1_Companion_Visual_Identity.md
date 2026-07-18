# Session: COMP1_Companion_Visual_Identity

| Field | Value |
|---|---|
| **Session ID** | `COMP1_Companion_Visual_Identity` |
| **Rollback ID** | `rollback/COMP1-companion-visual-identity-20260717` → `7bfad50c` |
| **WIP snapshot** | tag `comp1-wip-snapshot-7bfad50c` |
| **Start time** | 2026-07-17 |
| **Current stage** | Delivered — awaiting owner decision + one governance ratification |

## Objective
**Lock the Companion's visual identity** as a permanent part of THA's design language. Design
implementation only — **no behavioural or AI logic changes.** Lock ten decisions: the Companion is the
single **embossed THA apple** (not a chat icon / sparkle / robot / speech bubble); a **soft sage-green
circular button** in THA's material language; the apple **embossed into** the button (depth, not flat);
**calm when idle**; a **gentle breathing halo** when it has something meaningful to say (presence, never
urgency — no badges/counts/attention animations); on open the **light draws inward** before the Companion
appears; it feels like a **permanent architectural element**, using the **same embossed-apple language**
(BRAND2 "The Pressed Apple") for one coherent identity.

Deliver: updated implementation doc · refined interaction spec (idle · aware · speaking · listening) ·
motion guidance (timing · easing · intensity) · accessibility (reduced motion · contrast · focus) ·
desktop + mobile placement · a small concept prototype demonstrating the interaction.

## Outcome
Ten decisions locked. Current launcher mapped: `FloatingAssistant.tsx:1449` — a 48px `bg-primary`
`rounded-full` FAB showing a **`MessageSquare` chat bubble** (exactly the widget the mission rejects);
`--primary` sage `132 14% 44%`; `useCompanionNotices` exists but is not wired to the button. Kept the
sage circle + placement; replaced the icon (→ embossed BRAND2 apple), added material depth (emboss) and
the presence language (calm idle · warm breathing aware halo · speaking inner luminance · listening ring
· open draws the light inward, panel a beat later).

Delivered: `docs/implementation/COMP1_COMPANION_VISUAL_IDENTITY.md` (locked decisions · four-state spec ·
motion timing/easing/intensity · accessibility reduced-motion/contrast/focus · desktop+mobile placement ·
governance). Interactive prototype published as an Artifact
(https://claude.ai/code/artifact/d09424cb-fd94-4f99-85d2-a669f7708eb8), source at
`docs/implementation/assets/comp1-companion-prototype.html`, renders in `docs/ui-audit/comp1/`.

**One governance conflict surfaced, not silently violated:** the breathing halo is a second Companion
presence signal, which Blueprint § 320 currently forbids ("the proven beat; no other presence signal,
ever") and § 12 ("Living Details do not animate"). The smallest amendment (extend the existing Companion
motion exception to admit the aware light as the second-and-final signal, scoped: presence not urgency,
sub-threshold, no badge/count, still-equivalent under reduced motion) is **proposed, not applied** — the
halo is held behind ratification. Decisions 1–5, 8–10 need no amendment.

## Refinement pass — 2026-07-17 (emblem, § 4.5)
Refined the prototype so the button reads as the **embossed THA emblem itself**, not a green button with an
icon. Rollback: tag `comp1-emblem-refinement-rollback-20260717` → working-tree snapshot `9a9ae977`. Five
visual-only moves, behaviour/AI untouched: (1) canonical `tha-apple` is the sole identity — the mask was
already this apple, now the disc *reads* as it; (2) scale ~58 % → ~80 % with a balanced rim; (3) shallow
two-line emboss → **deep three-layer intaglio** (contact-shadow + recess face w/ interior gradient +
stronger rim relief); (4) refined lighting — upper rim catches the arch's morning, recess pools shadow,
lower lip catch-light; (5) halo now **apple-shaped, blooms from within the carved apple** (old outer ring
reduced to a faint contained bleed). Sage ceramic + calm/architectural feel kept; no badge/text/new
colour/gloss. Reduced-motion still-equivalents extended to the new light.
Delivered: refined `docs/implementation/assets/comp1-companion-prototype.html` (interactive Artifact updated
in place — `d09424cb`), new `docs/implementation/assets/comp1-companion-before-after.html` (live before/after,
Artifact `0aa0a2eb`), and doc `COMP1_COMPANION_VISUAL_IDENTITY.md` (§ 4.5 + updates through § 12).
Note: `docs/ui-audit/comp1/` PNG stills predate the refinement — the headless browser is unavailable in this
environment to re-render them; the two live Artifacts + HTML sources are the current design.

## Next action
Owner decision on the identity + ratification of the § 320 aware-light amendment. If approved, a later
visual-only change swaps the icon in `FloatingAssistant.tsx` + adds a scoped `index.css` emboss/halo
block (behaviour/AI untouched); presence-wiring of `useCompanionNotices` is a separate change.

## Product changed
**None (design spec + prototype + comparison).** `FloatingAssistant.tsx` and all Companion behaviour
byte-untouched. Added: this run file, the report, the prototype HTML + the before/after comparison HTML
(both published as Artifacts), and `docs/ui-audit/comp1/` renders (pre-refinement).
