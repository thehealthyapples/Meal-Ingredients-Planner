# NSR1 Phase 2 — Companion presentation (craft wave)

**Surface:** Companion (integrated) → `client/src/components/conversation/FloatingAssistant.tsx`
**Rollback:** `rollback/NSR1-north-star-reconstruction-20260722` (→ `e16117d5`)
**Owners:** COMP_AUTH1 · THA_COMPANION_PLATFORM_ARCHITECTURE · UIOWN1 §3 (owns no business fact) · CRAFT1 §3 · GEA15/16

## Design (architecture first)
The friend at the counter — the one grounded voice in the house, felt as a presence, not a chat widget.
Its carved emblem/door and grounding plumbing are at standard; the audit found the *panel interior* had
accreted into a generic AI-chat surface. This wave removes the two clearest "reads as a chat widget"
tells that are pure presentation; the deeper form redesign is flagged as an owner character call.

## Changes (presentation-only)
1. **Removed the "AI-magic" iconography** — `Sparkles` on guidance actions, `Wand2` on confirm
   actions, `Lightbulb` on enrichment items (and their now-unused imports). These label the
   Companion's cleverness, which **GEA16** forbids — *intelligence is experienced as a better answer,
   never a visible mechanism.* The action labels and the enrichment items' border/label carry them.
2. **Calmed the loading indicator** — the three `animate-bounce` dots were the stock chat "typing"
   indicator, and a **bounce the emblem's light law bans by name**. Replaced with a soft opacity
   `animate-pulse` (motion-reduce-safe) — *a friend thinking, not a machine processing* (**CRAFT1 §3**).

## Not done — owner-gated / larger redesign (flagged)
- **Carry the carved emblem into the panel / drop the leaf-glyph avatar discs** (header, every assistant
   bubble, empty-state) — the interior still reverts to a flat `Leaf`-in-circle. Removing the discs or
   carrying the emblem touches three sites and their layouts; part of the panel *form* question below.
- **Messenger → "counter" surface redesign** (rounded-2xl left/right bubbles) and the **"QUICK
   QUESTIONS" suggestion chips** (which manufacture reasons to speak, GEA15/GEA3) — a Home Owner
   character call on the Companion's form, not a surgical craft edit.
- **The `aware` second presence signal** set live vs the recorded "no other presence signal" amendment
   — an EXPGOV/owner governance question, not presentation.
- **The `Loader2 animate-spin`** in thread-load/send — the machine spinner the emblem retired; part of
   the same presence-language pass as the avatars.

## Verification
`tsc --noEmit`: 0 errors in `FloatingAssistant.tsx`; the three removed icons are gone from source and
imports. Diff: **12 insertions / 7 deletions**. Live visual review recommended.

## Data / Trust / Scope
No schema/API/business-logic/grounding change; the Companion's voice, grounding (INT17), and selection
are server-owned and untouched. `server/` byte-untouched. Rollback: reset to the NSR1 tag.

## Quality Standard
The panel is quieter and no longer advertises its own magic. A full "presence at the counter" — the
emblem carried inside, the messenger chrome redesigned — is the owner-gated form pass that remains.
