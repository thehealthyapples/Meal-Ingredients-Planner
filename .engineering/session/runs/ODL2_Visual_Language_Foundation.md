<!-- Copy to .engineering/session/runs/<SESSION_ID>.md at the start of a session. -->

# Session: ODL2_Visual_Language_Foundation

| Field | Value |
|---|---|
| **Session ID** | `ODL2_Visual_Language_Foundation` |
| **Rollback ID** | `rollback/ODL2-visual-language-foundation-20260716` → `35d84533` (tag protects committed state only; tree carries unrelated uncommitted work from concurrent sessions — CONV1 P4 records, server test edits — untouched by this session) |
| **Start time** | 2026-07-16T00:00:00Z UTC |
| **Current stage** | Waiting for User (Phase 2 delivered — no governance blockers remain) |

## Objective
Create the minimum reusable governed visual language required to build the Home North Star: canonical ownership for the orchard environment, orchard exposure (E0–E3), warm natural light, material surfaces, depth & shadows, and signature typography — removing the remaining ODL1 governance blockers (UIA §4 amendment, exposure tokens by admission, named orchard owner, signature ADOPT) without redesigning Home or implementing visuals. Deliverable: `docs/implementation/ODL2_VISUAL_LANGUAGE_FOUNDATION.md`.

## Files being modified
- `docs/architecture/THA_UI_ARCHITECTURE.md` — the governed §4 amendment (depth/light/material vocabulary) + any exposure/signature admissions
- `docs/implementation/ux/ADOPTION_REGISTER.md` — named orchard owner, exposure tokens by admission, signature ADOPT decision recording
- `docs/implementation/ODL2_VISUAL_LANGUAGE_FOUNDATION.md` — the governing deliverable
- `.engineering/session/runs/ODL2_Visual_Language_Foundation.md`, `.engineering/session/CURRENT.md` — session records

## Checkpoints
- [x] Rollback tag created: `rollback/ODL2-visual-language-foundation-20260716` → `35d84533`
- [x] Architecture Bootstrap read (docs/architecture/README.md); NORTH1 + ODL1 reports read
- [x] Governing extracts gathered (UIA, Blueprint, Adoption Register, EXP4/EXP5 vocabulary) — re-run after interruption
- [x] UIA §4 amendment drafted and applied (four members; §16 tiers widened; §18 box added + "flat calm surfaces" corrected)
- [x] Token NAMES admitted (UIA §4/§16); adoption register ownership recorded; adoption:check **66·0·2 vs baseline 65·1·2** — same 2 pre-existing failures, unmasked
- [x] Blueprint yields §§7–8 depth/light ownership to UIA; §18 items 1 & 3 closed; item 5 opened (the values)
- [x] Signature disposition **ADOPT** recorded (Colin Clapson, 2026-07-17) — execution deferred to North Star (edits Home)
- [x] ODL2 foundation document written — `docs/implementation/ODL2_VISUAL_LANGUAGE_FOUNDATION.md`
- [x] CURRENT.md updated; report delivered

**Last checkpoint:** Delivered 2026-07-17. Governance only — **zero client/server/shared files touched**.

## Findings that shape the work
1. **Precedence corrected.** The Blueprint is a **sibling** to the UIA, not its superior (Blueprint §2.3 L99, footer L478). Blueprint §2.2 L93: "No visual values." The UIA owns "How must it look?" — so the **UIA §4 amendment is the authorising act**, and the Blueprint may not decree tokens. Only the Experience Architecture outranks the UIA.
2. **Blueprint must change in the same commit.** §18 L468: when depth/light vocabulary "graduat[es] into the UI Architecture by amendment, this document **yields ownership in the same change** and cites the new owner." So ODL2 is not a UIA-only edit.
3. **Ordering gate.** Blueprint §18.1 L470: the orchard environment asset needs a named canonical owner **before** exposure levels become governed tokens.
4. **Register `.md` is GENERATED** (`gate.ts` renderDoc, byte-exact compare). Author `adoption-register.json`; run `npm run adoption:record`; verify `adoption:check`.
5. **Admission = NAMES, not values** (UIA §16 L264: "New semantic **names** enter through the governance of §17"; L263 values live in one implementation source). This is the lawful split that lets ODL2 admit the vocabulary **without** implementing Home visuals, and without breaching the register's "not permitted to author a foundation and adopt it later" doctrine (`ADOPTION_REGISTER.md` L205–206).
6. **Pre-existing defect surfaced (not ODL2's to fix):** `--orchard-opacity` (index.css:73/155) and `--orchard-parallax-strength` (75/157) are **dead tokens** — zero consumers; `orchard-backdrop.tsx:18` hardcodes `opacity: 0.90` instead (a raw value in a surface = UIA §16 L261 defect). `--orchard-sidebar-opacity` has one consumer (nav-bar.tsx:613) with a fallback `0.40` matching neither definition.
7. **Baseline gate is RED before ODL2:** `button-primitive` rival 539 > ceiling 538, and orphan `HouseholdNutritionPanel.tsx`. Both owned by concurrent sessions. ODL2 must not mask or "fix" these.

## Phase 2 — value admission (scope extension, 2026-07-17)
User directed ODL2 to remove ALL remaining governance blockers: EXP4 study selection, exposure values, depth/light/ground values, gradient contrast rule, nested radius rule, dark equivalents; retire superseded orchard tokens in the same change. Constraints: no Home, no page redesign, no new architecture, **existing UI visually unchanged**.

**Phase 1's deferral reason is re-examined, not repeated.** P1 deferred values because the register forbids authoring a foundation and adopting it later. P2 resolves that properly rather than overriding it: **every token admitted gets a real consumer in this same change** — `--orchard-exposure-e3` ← `orchard-backdrop.tsx` (replacing raw `opacity: 0.90`, a §16 defect), and the depth/light/ground set ← EXP4 **Study A**, migrated off its inline arbitrary values to become the vocabulary's reference implementation. This is the `signature-typography` shape exactly (css owner, dev-only consumer, governed, recorded deletion trigger). No token is defined without a consumer.

**Key findings (P2):**
1. **Study A wins on LAW, not taste.** B and C put type directly on the orchard (headings, reminders, list rows — visible in the composed screenshots). Blueprint §6.1: "The orchard never carries text… without negotiation." UIA §4 as amended says the same. EXP4 itself: "C's naked ink is one step too little." A is the only study with a ground plane. Screenshots were *looked at*, per EXP4's own "made by looking rather than by reading".
2. **`--orchard-sidebar-opacity` is NOT an orchard token.** nav-bar.tsx:613 uses it for a `linear-gradient(180deg, accent→background)` sidebar tint. Misnamed, not superseded by the exposure scale. Renamed `--sidebar-tint-opacity` at identical values (0.65/0.28) — no visual change.
3. **`--orchard-parallax-strength` is now UNLAWFUL, not merely dead.** UIA §4 as amended forbids parallax outright. Retirement is required by the amendment, not just tidiness.
4. **Dark mode has a complete, coherent answer:** the vocabulary IS the morning sun; at night there is no sun. Every warm shadow resolves to `none`, rank carried by tint/border. Study A already encoded this (`dark:shadow-none`, `dark:bg-card/40`). Complete-mode law (§16) satisfied; the old dead `--orchard-opacity` dark value (0.18) corroborates E3-dark.
5. **Tokenising Study A deletes `dark:` utilities** — the tokens resolve per mode, so `dark:` variants vanish. Reduces the theme-colour-mode evidence count.

## Delivered (Phase 1)
The canonical language is **Calm Orchard** (UIA §4) — ODL2 **amended** it rather than authoring a second language ("the language evolves; it is never forked"; §4 retired the term "design language" once and finally, so "ODL" stays a session codename). Amendment follows UXHOME1's §8 precedent exactly. Blueprint yielded ownership in the same change per its §18. Orchard ownership contradiction resolved: the register row owned the **asset** under the name "exposure" — renamed `orchard-environment`, and the E0–E3 scale given its own honestly-ownerless row. Four of six concerns record "no owner" **by design**: admission is of **names**, not values, and values land with their first consumer (register: "not permitted to author a foundation and adopt it later").

## Delivered (Phase 2)
All six decisions made and governed. **Study A** selected on law (B/C set type on the orchard — Blueprint §6.1 forbids it "without negotiation"; EXP4 itself judged C "one step too little"); B and C **deleted** with routes + capture entries. **Exposure valued** E3=0.90 (= arrival's existing hardcoded value, so nothing moved), E2=0.55, E1/E0=0. **Depth/light/ground valued** from Study A verbatim. **Dark completely resolved** — the daylight IS the vocabulary, so at night every warm shadow resolves to `none` and rank is carried by tint/border (a warm shadow at midnight lies about where the light comes from). **Gradient contrast rule** → UIA §15 (worst point if it carries text; a named ceiling if it does not). **Nested radius rule** → UIA §4 (a surface takes the step below what it rests on). **Retired** 2 dead orchard tokens + renamed the misnamed sidebar one, kept dead by pattern.

**Study A survives briefly, deliberately** — migrated onto the tokens as the vocabulary's dev-only reference implementation, because deleting it would leave 21 tokens adopted by nothing (the exact §17 failure state). Deletion trigger recorded: Home's E3 adoption. This is the `signature-typography` shape. It is ODL2's one departure from EXP4 §6, and the report says so.

**Verification caught a silent bug:** `shadow-[var(--x)]` compiles to `--tw-shadow-color` — Tailwind cannot tell a colour from a box-shadow inside `var()` and guesses colour, so every shadow rendered flat while build/typecheck/gate all stayed green. Fixed with the `shadow-[shadow:var(--x)]` type hint. Found by looking at a screenshot, not by reading. Evidence: `docs/ui-audit/odl2-vocabulary/`.

**EXP4's July-15 evidence was clobbered by the capture run and restored** (`git checkout`); ODL2's verification moved to its own dir. A report's screenshots are the state of the world on the day it reported.

## Next action
None — awaiting user review. **North Star Home inherits execution, not decisions:** consume the tokens on `home-experience-page.tsx` for E3; delete `material-a-warm-layers.tsx` + the capture script in that same change (the `depth-light-ground` closing trigger, completing EXP4 §6); execute the signature ADOPT (fold arrival greeting, move Caveat `@import` to index.css, name `/home` as the one permitted surface, delete all 8 arrival prototypes).

## Blockers
**None.** All six Phase-2 decisions are made; Blueprint §18 items 1, 3, 4 and 5 are closed. Two items are open but do NOT block Home, both named in report §7: Blueprint §18.2 (Home's two shells — a shell question, not a visual-language one), and the fact that E2's value and the dark resolution are unverifiable until an E2 room exists and dark mode is reachable.

## Notes for the reviewer
- `npm run adoption:record` is mandatory (the `.md` is generated, byte-compared). It auto-re-dated `theme-colour-mode` evidence 895→888 — a **concurrent session's** `dark:` reduction, not ODL2's. It accounts for the entire 65→66 pass / 1→0 notice delta and rides in this diff.
- The 2 pre-existing failures (`button-primitive` 539>538; `HouseholdNutritionPanel` orphan) were left red deliberately — raising a ceiling to green a gate is the one thing the register forbids doing quietly.

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
