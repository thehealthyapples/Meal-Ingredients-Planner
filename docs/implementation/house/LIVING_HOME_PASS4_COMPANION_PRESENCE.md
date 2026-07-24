# Living Home Experience Pass 4 — Companion Presence (`LHXP4`)

| Field | Value |
|---|---|
| **Programme ID** | `LHXP4` (Living Home Experience Pass 4) |
| **Date** | 2026-07-22 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback ID** | `rollback/LIVING-HOME-PASS4-20260722` → `ed2a3cc3` (annotated tag, object `340abde6`, created before any change) |
| **Kind** | Presentation-only refinement of the Companion's UI surface. **No AI behaviour, no capability, no prompt, no conversation flow, no owned word.** |
| **Governing parents** | `HOME_OWNER_ARCHITECTURE.md` (HOMEOWNER1 — feeling, not functionality; approval on character) · `GOVERNING_EXPERIENCE_ARCHITECTURE.md` (**GEA15** silence is the default · **GEA16** intelligence is a better answer, never a visible mechanism · **GEA2** a more capable THA is a quieter THA · **GEA21–23** rooms report / Companion interprets / household decides) · `THA_COMPANION_PLATFORM_ARCHITECTURE.md` + `COMP_AUTH1` (the Companion Constitution — the § 0 invariant: it changes *how* something is said, never *what is true*) · `THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md` · `UI_CANONICAL_EXPERIENCE_OWNERSHIP.md` (UIOWN1 § 3 — the Companion owns presentation decisions and conversation history, no business fact) · `LIVING_HOME_COMPLETION_PROGRAMME.md` (LHC1 — Maturity Model, item **I** / Companion 1–4) · `LIVING_HOME_PASS3_TRUST_AND_CLARITY.md` (LHXP3 — whose § Recommendations scoped this pass) |
| **Predecessor passes** | Pass 1 (`LHXP1`) *balanced* the rooms; Pass 2 (`LHXP2`) *warmed* them; Pass 3 (`LHXP3`) made them *trustworthy*. All three deliberately left the **Companion** untouched — its words and behaviour are owned. This pass refines the one surface that remained: how the Companion is *present* in the house. |

---

## 0 · What this pass is, and what it is not

**Objective.** Make the Companion feel like a calm, trusted member of the household — *quietly present when needed, respectfully absent when not.* Every interaction is validated against one question: **"Does this feel like someone quietly helping?"** — and against the five things the Companion must never do: **interrupt · demand attention · dominate · behave like a chatbot · compete with the room.**

It is a **presentation-only pass** on the Companion's UI (`client/src/components/conversation/FloatingAssistant.tsx`). Every change is a `className`, a conditional render of an already-computed element, or restyled chrome. It ships **no** AI behaviour, prompt, capability, intent, conversation flow, business logic, API, schema, permission, or navigation change, and it **amends no governing document**. Not one word the Companion *says* was touched — those are the Behaviour Engine's, the registry's, and INT21's (the Companion Constitution's § 0 invariant, held).

### The line this pass held — the Companion Constitution

The Companion's **words, reasoning, and conversation** are owned (`THA_COMPANION_PLATFORM_ARCHITECTURE.md`, `COMP_AUTH1`, the Behaviour Engine, INT21). This pass touches **only the glass the presence is seen through** — never the presence's voice. The distinction UIOWN1 § 3 draws exactly: the Companion owns *presentation decisions* and *how it is said*; this pass refines a presentation decision (how a suggestion and a header *look*) and changes nothing about *what is said* or *when*. Every string, every notice, every enrichment sentence, every quick-action, the persona labels, the state-priority logic, and every `onClick` were read and **left byte-untouched**.

---

## 1 · Changes shipped

Two edits, both on the Companion's presentation, both named explicitly in the brief's § 8 review list, both decidable by reading the code (no running product required to know they are correct in direction), both preserving all logic and owned words.

| # | Surface | Change | Why it is a presence win |
|---|---|---|---|
| 1 | **Drawer header — the duplicate "Apple"** | The persona badge is now suppressed on the **floating** surface, where it merely repeated the title. It still renders on all 11 **room** surfaces, where it names *which room's context* the Companion is answering in ("Planner", "Larder", "Cookbook", …). | On the floating surface the header read **"Apple" / "Apple"** — the title, and a badge stacked beneath it saying the same word. A calm presence introduces itself **once.** The badge's real job — telling you *whose room* the Companion is speaking into — is unchanged everywhere it carries information; it is dropped only where it was pure repetition. **Resolves the LHXP1-recorded blocker** (the de-dup "would leave `PersonaLabel` dead"): the component still renders on every room surface, so nothing is dead — the guard is `SURFACE_LABEL[surface] !== "Apple"`, a presentation conditional over an already-computed label. LHC1 Companion 3; LHXP3 rec #2. |
| 2 | **Enrichment note — the suggestion affordance** | The enrichment item container (Insight / Good to know / Suggestion / Learn) was restyled from a fully-rounded bordered accent chip to a **passive left-rule note** (`border-l-2 border-primary/20 bg-muted/25`, no pill border). | An enrichment item is a *quiet aside* the Companion offers — **nothing to tap.** But its old chrome (`rounded-lg border border-border/30 bg-accent/30`) shared the vocabulary of the tappable action chips right beside it (which are bordered pills with `active:scale-95`), so a "Suggestion" **read as a withheld or broken button** — the household reached for an affordance that was never there. It now reads unmistakably as a *margin note* — present, offered, not demanding to be pressed. The tappable "Next step" / "Next steps" chips keep their button chrome, so the two are now **visually honest about which is an action and which is an offer.** No `onClick` was added (there is none — that would be new behaviour); only the container's look changed. LHC1 Companion 2; LHXP3 rec #1. |

**Both changes answer the pass's one question** — *does this feel like someone quietly helping?* The header stops introducing itself twice (quieter presence); the suggestion stops pretending to be a button the household must press (a genuine offer, not a demand). Neither interrupts, dominates, or behaves like a chatbot; both make the Companion recede a little further into calm helpfulness (GEA2, GEA16).

---

## 2 · Every Companion surface — reviewed, and the verdict

The brief's § 6 / § 8 lists were each walked in code. Most were found **already exemplary** — the Companion surface has been carefully tended (UX3, PRESENCE1/2, and the in-code design comments show it). Honest review means recording what was reviewed and *deliberately left well*, not manufacturing change for its own sake (HOMEOWNER1 Principle 9 — emotional consistency over novelty; a change that does not strengthen the feeling of home is noise).

| Surface (§ 6 / § 8) | Current state | Verdict |
|---|---|---|
| **Floating launcher (resting state)** | A carved-apple ceramic emblem (`.companion-emblem`), a furniture drop-shadow, fully static at idle. The old `bg-primary shadow-lg` fill was deliberately retired (in-code). | **Already exemplary — left untouched.** It rests like an object in the room, not a button demanding a press. |
| **Notification glow / attention cue** | An apple-shaped warm amber bloom (`.companion-light`) with a slow 4.2s breathing keyframe. **No dot, no ring, no count, no bounce** — the in-code comments explicitly forbid a "red dot / unread count". | **Already exemplary — left untouched.** This is the model of a calm attention cue: it *offers* attention, never demands it (GEA15). |
| **Opening sequence** | Panel springs in from the right (`x:"100%"→0`, opacity fade, `spring damping 30 stiffness 300`). Scrim `bg-black/20` on mobile, transparent on desktop, 0.2s fade. | **Reviewed — left untouched.** Well-damped (a firm slide, not a bounce). Retuning motion *feel* is a running-product judgement; the current curve is restrained. |
| **Scrim / blur** | **No `backdrop-blur`** — the panel is opaque `bg-popover`. A recorded UX3 decision ("the Companion is furniture, not glass"). | **Left untouched — re-adding blur would reverse a recorded owner decision (UX3).** |
| **Closing sequence** | Symmetric exit (same spring, same 0.2s scrim). Dismiss via X, scrim-tap, Escape (Radix-owned). | **Reviewed — left untouched.** Symmetric, calm, standard. |
| **Empty drawer** | `justify-center` (LHXP1 shipped this), a Leaf in a soft circle, the introduction + invitation (owned words), quick questions beneath. | **Left untouched — LHXP1 already balanced it; the words are owned.** |
| **Waiting / thinking state** | An in-thread three-dot indicator + a gentler, slower emblem `speaking` light (3.4s, "a friend thinking, not a machine processing"). | **Reviewed — left untouched.** Softening the dot motion is a running-product feel judgement (see § 3, staged). |
| **Drawer hierarchy** | Header → notices → thread/empty → input. Notices are box-free `text-[15px]` with an inline "Why?" (UX3 "dissolved the box"). | **Reviewed — left untouched** except the header de-dup (§ 1). |
| **Suggestion presentation** | Enrichment items rendered as chip-like containers. | **Fixed (§ 1 #2).** |
| **Action presentation** | Tappable "Next step" / card "Next steps" render as bordered/filled pills with `active:scale-95`. | **Left untouched — correct as-is**; the enrichment restyle now makes them *distinct* from non-actions. |
| **Duplicate "Apple"** | Title + badge stacked on floating. | **Fixed (§ 1 #1).** |
| **Relationship with every room** | The badge names the room context on all 11 room surfaces; the persona/voice adapts by surface (owned). | **Strengthened** by § 1 #1 (the badge now only speaks when it has room-context to add). |

---

## 3 · What was deliberately **staged**, and why

Honest restraint: the changes that would need the **running drawer** to judge, or that would touch owned words/behaviour, were not shipped.

- **Waiting-state motion softening** — the three-dot `animate-bounce` could read a touch more restrained as a gentle opacity pulse. **Staged:** motion *feel* (and whether a 2s pulse still reads as "actively thinking") is exactly the pixel/timing judgement the standing discipline says to make on the running product, not guess. The current indicator is a calm, established convention.
- **Opening/closing motion curve** — whether the spring should be a hair softer for "quiet confidence". **Staged:** running-product feel judgement; the current curve is already well-damped.
- **Any change to the Companion's words** — the introduction, invitation, notice text, enrichment sentences, quick-action prompts, persona labels. **Never in scope:** these are owned by the Behaviour Engine / registry / INT21 (item 10, item 11). This pass changed how a suggestion *looks*, never what it *says*.
- **Making an enrichment "Suggestion" tappable** — the most literal reading of "suggestion affordance" would be to give it an action. **Refused:** that is **new behaviour / a new conversation flow** (item 11), and an action must compose an existing capability with the Companion's owners in the loop. The presentation-only fix (make it read honestly as a *non-action*) achieves the clarity goal without crossing the line.

---

## 4 · Reading against the Living Home Maturity Model

LHC1's **Level 3 — Hospitable** requires *calm · balanced · warm · inviting · comfortable*, and the Companion is the presence that must embody all five without dominating. This pass moves it there on the two dimensions it fell short:

| Surface | Dimension moved | How |
|---|---|---|
| Drawer header | **Calm · uncluttered** (was: a stacked duplicate name) | introduces itself once; the badge speaks only when it adds room-context |
| Enrichment note | **Honest · comfortable** (was: a non-action wearing button chrome) | an offer that looks like an offer, distinct from the actions |

Levels 1–2 (the Companion exists, works, and owns its conversation) are untouched. Level 4 (Environmental Dressing) remains gated and untouched. The Companion's Constitution — one presence, one chair, sole owner of interpretation, held to its five permanent conditions — is byte-unchanged.

---

## 5 · The forbidden list — confirmed untouched (item 10 · item 11)

Not one byte of: **Companion capabilities · Capability Registry · Intent Engine · Behaviour Engine · Conversation architecture · Intelligence Platform · Canonical ownership · new AI behaviour · new prompts · new capabilities · new conversation flows · business logic · APIs · schemas · permissions · navigation.** No server or shared file was touched. Both edits are on one client component: a conditional render of an already-computed badge, and a container `className`. No `data-testid` was removed (the badge keeps `persona-label` on room surfaces; the enrichment items keep `companion-enrichment-item-*`); no `onClick`, mutation, hook, or state expression was changed.

---

## Architecture Compliance

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================
☑ One canonical identity — no entity touched; one Companion, one chair.
☑ One owner per fact — no fact re-owned. The persona label strings, the
  enrichment content, and the notice text stay their owners' (registry /
  Behaviour Engine / INT21); only their PRESENTATION chrome changed (UIOWN1 § 3
  — the Companion owns presentation decisions).
☑ No duplicate entities / ownership / state — nothing created; the header de-dup
  REMOVES a duplicate presentation, adds nothing.
☑ Extends existing architecture — restyles existing chrome; adds no component,
  pattern, or layer.
☑ Progressive enrichment — additive/subtractive presentation; every change
  reversible by reverting one className / one conditional.
☑ Knowledge domain compliance — no knowledge domain touched; Product Registry
  impact nil.
☑ Honest gaps over fabricated information — a non-action now looks like a
  non-action; nothing presented as an affordance it does not have.
☑ No permanent synchronisation bridge — none.
☑ Evolution over replacement — nothing retired; PersonaLabel still renders on
  every room surface.

Experience Constitution Check (before design):
  hospitality — the Companion is quieter and more honest; it introduces itself
                once and offers rather than demands (GEA1, GEA15).
  outcome     — reduced felt weight; the household is not asked to press a note
                that was never a button, nor read a name twice.
  weight      — lighter: a duplicate removed, button-mimicry removed.
  voice       — NOT ONE WORD the Companion says was changed; only how a
                suggestion and a header LOOK (COMP_AUTH1 / CPA1 § 0 invariant).
  ownership   — the Companion still owns interpretation; the household still owns
                every decision (GEA22/23); the enrichment note offers, never
                decides.
  restraint   — presentation softened/de-duplicated; no motion added, no ornament
                applied (GEA2, GEA15).
  layer       — Experience Implementation only; originates no law (GEA20).
```

## AI Architecture Compliance

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
✓ Uses the canonical Intelligence Platform — only by reference; nothing reached.
  No capability, intent, prompt, Context View, notice category, or persona was
  created, changed, or removed.
✓ Capability Registry / Intent Engine / Behaviour Engine — byte-untouched. The
  enrichment items still come from their producing capabilities verbatim; this
  pass restyled the container they render in, never the pipeline.
✓ Conversation architecture — untouched. No turn, reference, mutation, streaming
  path, or conversation state was touched; every onClick/sendTurn is unchanged.
✓ Does not create another assistant — one Companion, one chair. This pass makes
  that one presence quieter, it does not add a second.
✓ Companion ownership unchanged — the § 0 invariant holds: what is true, what is
  said, and when, are unchanged; only how a suggestion and a header LOOK changed.
✓ Permission-aware access — access.ts untouched; no reach widened; the notice
  set, its order, and its Silence-Rules gating are the Notice Engine's, untouched.
✓ Honest gaps over fabricated knowledge — a non-actionable note no longer wears
  an action's chrome.
```

## Definition of Done

- **Success looks like:** this document exists at `docs/implementation/house/LIVING_HOME_PASS4_COMPANION_PRESENCE.md`; the Companion's floating header no longer stacks a duplicate "Apple"; an enrichment suggestion reads as an offer, not a withheld button; every Companion surface was reviewed and either refined or recorded as deliberately left well; typecheck / build / adoption baseline-identical; rollback reported; the running-product judgements staged; Pass 5 recommended.
- **What must not break:** nothing runtime — no capability, prompt, conversation flow, or owned word changes; the forbidden list (§5) is byte-untouched; the badge still renders on every room surface; the enrichment items still render.
- **Manual test steps:** `git diff --stat <rollback-tag>..HEAD` shows only `FloatingAssistant.tsx` + this doc + session files; typecheck 88 (baseline, 0 client, 0 in FloatingAssistant); build exit 0; adoption 100·0·9.
- **Product Registry impact:** none — no capability, route, claim, or surface added or removed; presentation chrome is not a registry fact.

## Data Impact

- **Reads existing data:** no new read. The header reads the *same* `surface` it already read; the enrichment block reads the *same* `enrichment` items it already read.
- **Writes new data:** NO.
- **Changes meaning of existing data:** NO. The persona badge is *hidden* on one surface (its value is unchanged and it still shows everywhere else); the enrichment content is unchanged (only its container's look changed).
- **Requires backfill:** NO. **Special-category data:** none read, moved, or exposed. No conversation content, no notice content, no household fact was touched.

## Trust Check

- **Could this mislead the user?** No — the pass *increases* honesty: a non-action stops looking like an action, and a name stops appearing twice. Nothing the Companion asserts changed.
- **Could this fabricate certainty?** No. No number, claim, observation, or word was added or changed. The Companion says exactly what it said before.
- **Is anything guessed but shown as real?** No — the reverse: a suggestion no longer *looks* like a tappable affordance it never had.
- **Was any owned word or behaviour changed?** **NO.** Every string, notice, enrichment sentence, persona label, quick-action, and `onClick` is byte-identical. Only presentation chrome moved (COMP_AUTH1 § 0 invariant held).
- **What happens if the system is wrong?** A presentation defect, corrected by reverting one `className` or one conditional.
- **No trust surface, consent ledger, permission path, or conversation store touched.**

## Rollback Plan

- **Rollback identifier:** `rollback/LIVING-HOME-PASS4-20260722` → `ed2a3cc3` (annotated tag, object `340abde6`, on `int1-intelligence-platform`, created **before any change**).
- **Coverage caveat:** a tag protects committed state only. At tag time the working tree held one uncommitted change not authored by this pass — `.engineering/session/CURRENT.md` (the session heartbeat); not covered, not discarded.
- **To revert:** `git revert` the pass commit, or `git checkout rollback/LIVING-HOME-PASS4-20260722 -- client/src/components/conversation/FloatingAssistant.tsx`. Each change is one conditional / one className; reverting restores the previous rendering exactly.
- **Blast radius:** one client component (the Companion drawer), presentation only. No data, schema, building block, route, capability, prompt, token, or governing document.

## Scope Lock

- **Shipped:** two presentation-only Companion refinements (§1) + this document + session artefacts.
- **Explicitly NOT done (and why):** the **waiting-state** and **open/close motion** feel (running-product judgements — staged §3); making the enrichment **tappable** (that is new behaviour/a new flow — refused, item 11); any change to the Companion's **words** (owned by the Behaviour Engine / registry / INT21 — items 10/11); re-adding **scrim blur** (a recorded UX3 no-blur decision); **all** Environmental Dressing (DECLARED-NOT-BUILT); no capability/registry/intent/behaviour-engine/conversation/API/schema/permission/navigation change; **no governing document amended.**
- **Functionality unchanged** everywhere; only presentation moved.

## Manual Verification

- `npm run typecheck` → **88 errors — byte-identical to baseline**; **0 in `client/`**, **0 in `FloatingAssistant.tsx`** (confirmed by filtering the error list).
- `npm run build` → **exit 0**; `dist/index.cjs` emitted; the esbuild `import.meta` warnings are pre-existing.
- `npm run adoption:check` → **100 · 0 · 9** — identical to baseline; no building block touched.
- No `data-testid`, route, handler, `onClick`, or state expression changed. `persona-label` still renders on every room surface (the guard only hides it on `floating`); `companion-enrichment-item-*` and `companion-enrichment-block` are intact; the server test `test-intelligence-companion-enrichment.ts` exercises the enrichment *capability output* (not the client container's `className`) and is unaffected.
- **No authenticated live walk-through was performed** — this pass is non-interactive. Both shipped changes were chosen to be decidable by *reading*: the double-"Apple" is a proven duplicate (title literal `"Apple"` + `SURFACE_LABEL.floating === "Apple"`), and the enrichment note is a proven non-action (a `<div>` with no `onClick`) wearing action chrome. Every change whose correctness needs the running drawer — the motion feel — was deliberately staged (§3), per the standing discipline (HOSP1 / ROOM1 / PRESENCE1-2 / LARDER_NS1 / LHC1 / LHXP1-3).

## User Acceptance Evidence

- **Pre-state evidence:** `docs/investigations/house/HOMEOWNER2_LIVING_HOME_REVIEW.md` (the Home Owner's Apple-Design-Award-bar critique — which circled the Companion's stacked "Apple" and its plain-text suggestions), `LIVING_HOME_COMPLETION_PROGRAMME.md` item **I** (Companion 1–4), and `LIVING_HOME_PASS3_TRUST_AND_CLARITY.md` § Recommendations (which scoped this Companion Presence pass).
- **This pass** discharges the two *decidable-by-reading, presentation-only* items of that scope — the de-dup (Companion 3) and the suggestion affordance (Companion 2) — while honouring the discipline that the motion-feel items (Companion 1/4) are judged on the running drawer, and that the Companion's *words and behaviour* are never this pass's to touch.
- **Outstanding acceptance step (the gate):** the Home Owner opens the Companion from the floating launcher on Home (does the header now read "Apple" once, cleanly?), opens it on a room surface (does the room badge still frame the context — "Planner", "Larder"?), and triggers an enrichment suggestion (does it now read as a quiet offer rather than a button that won't press?); then directs the staged motion-feel refinements on the running drawer. Consistent with the outstanding walk-throughs recorded for LHC1 / HOSP1 / ROOM1 / PRESENCE1-2 / LARDER_NS1 / LHXP1-3.

---

## Recommendations for Living Home Experience Pass 5 — Delight & Craftsmanship

Pass 1 balanced the rooms; Pass 2 warmed them; Pass 3 made them trustworthy; Pass 4 made the Companion quietly present. The house is now calm, warm, honest, and well-attended — Level 3 (Hospitable) is substantially held across every room. What remains between *hospitable* and the **Award bar** is the last, hardest layer: **the perceptible result of care** in the small moments — *premium through restraint*, delight that is earned and rationed, never applied (Experience Language § 3A; the Premium Experience Principles, EXP2 § 17; GEA joy as a *positive* principle). Recommended scope, all on the running product with the Home Owner judging:

1. **The motion pass, judged live.** The items this arc kept staging because feel cannot be guessed: the Companion's open/close curve and waiting-state indicator (Pass 4 §3), the room-transition motion, the empty-state entrances. One consistent, restrained motion language — *what little moves, moves with quiet confidence* (UIA motion law; the stillness default).
2. **Earned micro-delight.** The Experience Language names delight as *rationed and earned* — a genuine moment of craft at a real completion (a week planned, a shop finished), never confetti, never for ordinary use (GEA13). Pass 5 is where the one or two truly-earned moments are found and made lovely — and where every *unearned* flourish is refused.
3. **The count reconciliations, finally closed** (LHXP3 §2, LHC1 item D). Shopping "12 vs 3" and Nutrition "17 vs 18" — traced, understood, and now due for the authenticated-session reconciliation that turns *legible* into *resolved*.
4. **The judged copy passes** the arc deferred as too large to blind-swap: the Cookbook/meal/recipe and basket/list/shop terminology (LHXP3 §2), and the uppercase-tracking micro-label typographic decision (HOSP1/LHXP2 deferred). One judged hand, once.
5. **Craftsmanship in the details** — title contrast over washed heroes, faint-control strengthening, the Cookbook photography Owner Decision (B), the desktop-nav posture Owner Decision (C) — the LHC1 **[Visual]/[Owner]** roadmap items that raise the finish from *done* to *beautiful* (HOMEOWNER1: *good enough is never a reason to stop improving*).

Pass 5 is the craftsmanship finish — the pass that asks, of every surface the previous four made *correct*, the Home Owner's last question: **is it beautiful enough for this house?**

---

*Pass `LHXP4`. The Companion says its name once now, and offers its suggestions as offers — a quiet aside with a soft left rule, no longer a button that will not press. Nothing it says changed; only the glass it is seen through is a little clearer. It rests as an object in the room, breathes a slow amber breath when it has something to offer, and asks for attention exactly never. The presence the first three passes kept for last is, at last, quietly at home.*
