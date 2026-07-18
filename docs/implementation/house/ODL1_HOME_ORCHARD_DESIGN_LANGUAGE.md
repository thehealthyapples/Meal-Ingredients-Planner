# ODL1 — Orchard Design Language for Home

**Date:** 2026-07-16
**Status:** Implemented — production-ready, awaiting review
**Rollback:** `rollback/ODL1-home-orchard-design-language-20260716` → `7d1dd2ce` (tag protects committed state only; the tree carried unrelated uncommitted work from concurrent sessions, untouched by this change)
**Surface:** `client/src/pages/home-experience-page.tsx` (route `/home`) — the authenticated Home
**North Star:** `attached_assets/design/north_star/v2/NORTH_STAR_V2_HOME_DESKTOP_MOBILE.png` (+ `NORTH_STAR.md`: *"inspiration, not pixel-perfect specifications… inherit the design language rather than reproduce the images literally"*)
**Screenshots:** `docs/ui-audit/odl1-home-orchard/` — `before-{desktop,mobile}[-viewport].png` / `after-{desktop,mobile}[-viewport].png`, captured live at 1440×900 and 390×844 against the DEV world household (`scripts/capture-odl1-home.ts`)

---

## 1. What this change is

A visual refinement of the authenticated Home into the Orchard Design Language,
implemented strictly inside current governing law. Architecture, data ownership,
queries, routes, testids and business logic are unchanged. It also closes the
immediately-deliverable findings of today's Home compliance audit
(`docs/investigations/ux/HOME_COMPLIANCE_AUDIT_20260716.md`, EXPCOMP2).

### Changed

| Change | Law / finding it serves |
|---|---|
| Greeting became the arrival identity moment in the **display voice**: quiet "Welcome home," line, the household member's name carrying the room (`.title-section` → `.title-page`), sentence-case per the North Star | UIA §8 (display voice is lawful for identity moments); EXPLANG §4A "Arrival before work" |
| Date line contrast fixed: `text-[11px] … text-muted-foreground/70` → `text-xs … text-muted-foreground`; raw tracking literal → `tracking-widest` | EXPCOMP2 FAIL 5 (3.40:1 → 6.92:1); UIA §8 named scale |
| All raw type sizes moved onto the **named type roles**: greeting `.title-page`/`.title-section`, card headings `.title-card` | EXPCOMP2 FAIL 5; UIA §8/§16 |
| Heading tree repaired on the page's side: greeting `h1` → "Today at a glance" `h2` → card headings `h3` (were all `h2`) | EXPCOMP2 FAIL 5 (partial — see §3.4) |
| New quiet **"Today at a glance"** section heading (from the North Star) labelling the summary group via `aria-labelledby` | North Star; EXPARCH orientation (two-second glance) |
| **Plant diversity honesty**: `plantCount ?? 0` deleted; `weeklyProgress: null` now renders a calm absence ("Your week's variety will appear here as meals are planned.") instead of a fabricated "0 of 30" | EXPCOMP2 FAIL 2; Core Principle 6; UIA §14 |
| **Companion beat**: `useWithholdCompanion(settling)` — the Companion holds its entrance until the room's three queries settle, released automatically on unmount | EXPCOMP2 FAIL 4; EXPARCH §11; Blueprint §13 |
| Reminders card: gentle `fade-in` entrance (`motion-reduce:animate-none`); silence remains first-class (absent when there is nothing to say) | EXPCOMP2 WARNING 9 (pop-in); UIA §11 motion law |
| Deleted 6 dead `dark:` literals and 1 dead `dark:` bar background + 3 phantom `h-4.5 w-4.5` classes | EXPCOMP2 FAIL 7 (deliverable part) |
| False header comment corrected (claimed Reminders dead; live since PHASE5E) | EXPCOMP2 audit order item 1 |
| Air, not width: `py-8 sm:py-12` → `py-10 sm:py-14`; greeting margin opened; container stays `max-w-3xl` (the "compact counter" posture — `pageContainerClass` adoption is a named open item, deliberately not taken) | Kept Room SPACE ("extra width becomes air and view, never more widgets"); EXPCOMP2 conflict list |

### Also in this change (governance obligations)

- `docs/product/structure/pages/page-home.md` — registry entry corrected in the
  same change (Rule KC15/PKR15): stale `fnd-dead-reminders` defect marked fixed
  (verified live), description updated to present tense, `last_verified` 2026-07-16.
- `scripts/capture-odl1-home.ts` — before/after capture harness (zero-write DEV
  login, modelled on the EXP4 capture script).
- Session run file + `CURRENT.md` row per the Engineering Session Recovery Protocol.

## 2. What was deliberately NOT shipped — and the path for each

The North Star's three most visually defining elements are **architecturally
endorsed for Home but governance-gated**. Shipping them now would jump paths the
Experience Blueprint explicitly fixed (§2.4, §18 open items). Per the Architecture
Bootstrap: conflict → stop and explain, do not continue.

1. **Orchard backdrop / soft orchard light at the top of Home.** Home is E3 ("the
   open view" — the one room granted the orchard), but the depth/light vocabulary
   is unshippable until the governed **UIA §4 amendment** lands, exposure values are
   admitted **as tokens**, and the orchard environment asset gets a **named owner in
   the adoption register** (Blueprint §18 open items 1–3). Mounting `<OrchardBackdrop>`
   on Home is additionally a **machine-enforced RETIRED pattern** in the adoption
   register (`orchard-exposure` concern) — the gate would fail the build.
2. **The serif/signature greeting.** No serif family is loaded or admitted; UIA §8
   admits exactly three voices, and the **signature voice on live Home is an open
   ADOPT/REJECT decision owned by Colin Clapson** in the adoption register
   (UXHOME1 migration). The greeting therefore ships in the **display voice** — the
   lawful identity-moment route — and upgrades to the signature hand in one small
   change if/when ADOPT is recorded.
3. **The warm depth/materiality vocabulary** (EXP4 Study A layered warm shadows,
   ground-plane panels) — same UIA §4 amendment gate as (1). Surfaces stay flat,
   frosted and calm, per the binding law as written.

Also intentionally not built from the concept: a Family card and Cookbook/Pantry
room cards (Home is *not the everything page* — EXPARCH §4; the shell's nav is the
canonical wayfinding); the "From the orchard" ring (plant diversity is Nutrition's
Living Detail; its ceiling is "copy + the existing count" — Blueprint §12.2; Home
keeps its existing modest bar); the concept's sidebar (the shell is constant and
byte-untouched — EXPLANG §4A Principle E).

## 3. Verification

1. **Typecheck** — no errors in client code or the changed file. (304–305 errors
   pre-exist in `server/intelligence/*` from concurrent sessions' uncommitted
   work, identical with the working tree stashed; none reference this change.)
2. **HOME2 resolver tests** — `server/tests/test-home2-home-primary-action.ts`:
   **47 passed, 0 failed**. The resolver and its contract are untouched.
3. **`npm run adoption:check`** — 65 passed. The 2 failures are pre-existing and
   owned by concurrent work, not this change: `button-primitive` rival count
   539 > 538 (this diff adds zero raw `<button>` elements) and orphan
   `client/src/components/HouseholdNutritionPanel.tsx` (file untouched here).
   No client building block was created, adopted or retired by ODL1 — it consumes
   already-registered owners (`.title-*` roles, `Card`, `hover-elevate`,
   `useWithholdCompanion`) — so no register entry changes were required.
4. **Driven end-to-end** — real login against the running app; before/after
   screenshots at both viewports; reminders observed rendering live (two Notice
   Engine notices); `/api/home/intelligence` confirmed returning a genuine
   `plantCount: 0` for the capture household (so "0 of 30" in the after shots is
   truth, not the deleted fabrication — the absence path triggers only on `null`).
5. **The remaining audit FAILs are named, not hidden** — see §5.

## 4. Governance checklists

### 4.1 Experience Test (Blueprint §15.3)

- **Which room is this?** Home — the threshold and heart of the house, exposure E3.
- **How should someone feel here?** Welcomed and expected before being informed:
  the date, their name in the house's voice, then a calm answer to "how are we
  doing today?"
- **The one thing this room helps them do:** arrive and orient — see today held
  under control, and step through one doorway if something needs them.

### 4.2 UX Governance Checklist (EXPARCH §18) — key lines

- **Home unharmed / emotional centre:** strengthened — arrival precedes work; no new demands.
- **Progressive disclosure:** unchanged structure; one new quiet section label aids orientation.
- **Calm before capability / one primary action:** Home still presents **zero**
  primary-styled operations (read-only in spirit; every card is a doorway). The
  audit's "Home has no door" FAIL remains open **by design** — the HOME2 resolver
  is built but its wiring is blocked on the two-current-weeks platform work, and
  its label may not be hardcoded page-side (INT21 seam). Not jumped.
- **Canonical ownership:** every figure still read from its owning store; no new state.
- **Honest content:** improved — the last fabricated value on the page (plant zero) removed.
- **Errors and recovery:** untouched (`LoadError` retained everywhere).
- **Accessibility:** date-line contrast 3.40:1 → 6.92:1; heading levels ordered on
  the page; focus/keyboard behaviour unchanged; motion has reduced-motion stills.
- **Premium Standard:** craft completeness (all four states of every section
  designed, including the new honest absence); intentionality (every element
  justifiable aloud — each row of the table in §1 cites its law); no ceremony,
  no decorative motion; refinement not accretion (net content added: one heading).

### 4.3 UI Governance Checklist (UIA §18) — key lines

- **Semantic before literal:** no new raw values introduced; two raw literals
  deleted (tracking, a dead dark bar colour) and 9 dead/phantom classes removed.
  The three pre-existing icon-chip literal tints remain — their migration to realm
  tokens is a **named blocked item** (EXPCOMP2 conflict 2), not silently done.
- **Typography:** all page type now on the named roles; three voices respected;
  **signature discipline:** the signature voice is *not* used (gated; see §2.2).
- **Colour law:** no new colours; one meaning per colour preserved.
- **Motion:** one functional fade, brief, `motion-reduce` safe; nothing loops or pulses.
- **Brand identity:** no second apple, no emoji, no new marks.
- **States designed:** loading / broken / empty / present for all sections, now
  including the plant card's genuine-absence state.
- **Token integrity:** no tokens added or modified; dark mode untouched (dead
  `dark:` literals deleted were unreachable — `darkMode: ["class"]` with no toggler
  on this surface; recorded fact in the register already tracks `dark:` counts).

### 4.4 Blueprint Checks (§15.2)

- **One home / a room, not a theme:** no bespoke architecture; canonical Card,
  header, shell all untouched.
- **The map respected:** Home stays the compact counter (`max-w-3xl`) with the
  view's share of the frame left open; E3 exposure not degraded (backdrop rules
  untouched) and not counterfeited (no wallpaper snuck in).
- **Orchard law / one morning:** no orchard imagery shipped; no visual time, no
  season, no second sun. The North Star's blossom branches and photographic
  orchard were **declined** at this gate.
- **Material honesty:** flat frosted surfaces per binding UIA §4; no nested ground
  planes; air generous.
- **Living Detail discipline:** none added. (The greeting-in-THA's-hand remains
  Home's designated future Living Detail, pending the signature ADOPT decision.)
- **The Companion in its chair:** same chair (FloatingAssistant, bottom-right),
  now arriving a beat after the room settles — its sanctioned sign of life.
- **The walls untouched:** zero bytes changed in shell, header, nav.
- **The governance path:** nothing gated was shipped; every gated element is named
  in §2 with its path.

### 4.5 Design Character Check (OHDB §16.2)

- Reads as the same house — nothing faux, no applied texture, no synthetic gloss.
- Composed emptiness, not bare: the added heading and air organise, they do not fill.
- Timeless: the greeting composition (quiet welcome, the name given the room) will
  still be right in ten years; nothing here is a trend.
- The design disappears: a household would feel the warmer arrival and the honest
  plant card without being able to name either.
- Matches the §13.1 Home reading: open, unhurried, the least furnished room.

### 4.6 Experience Review Questions (EXPLANG §6) — answered

- **Orientation & calm:** the eye lands on the name, then "Today at a glance";
  calmer than before (higher date contrast, ordered headings, more air).
- **Effort & clarity:** the two-second glance now yields orientation (greeting +
  date), state (three cards), and the way onward (doorways) — the primary *door*
  remains platform-blocked, stated honestly.
- **Motion & delight:** one fade that communicates arrival and disappears;
  removing it would not harm meaning (WARNING 9 aside).
- **Intelligence & trust:** nothing fabricated — the page's last invented number
  is gone; the Companion waits its beat; reminders verbatim from the Notice Engine.
- **Identity & endurance:** recognisably THA; shell untouched; nothing that will
  embarrass in five years.
- **Place & promise (§4A):** the welcome is now visually free of work — arrival
  before information; Home still feels like the place the household arrives, not
  a dashboard.
- **Warmth & life (§3A):** warmer without cooling calm into lifelessness — the
  name in the display voice, sentence-case welcome, honest growing-week copy.
  (Full §3A warmth — the orchard light — is exactly what waits on the UIA §4
  amendment; this is stated, not papered over.)

## 5. Honest remainder — open items this change does not close

| Item | Why not | Owner / path |
|---|---|---|
| The orchard backdrop, orchard light, warm depth vocabulary | Gated: UIA §4 amendment + token admission + named orchard owner (Blueprint §18) | Governance session; then a small ODL2 ships the visuals |
| Signature (serif/hand) greeting on live Home | Open ADOPT/REJECT decision in the adoption register, owned by the user | Record ADOPT → one-line greeting upgrade + Caveat `@import` move + prototype deletion |
| "Home has no door" (EXPCOMP2 FAIL 1) | HOME2 resolver built, wiring blocked on two-current-weeks (`HOME3_THE_TWO_CURRENT_WEEKS`); label belongs to the Behaviour-Engine seam | Household Time work (TIME3 Phase), then `GET /api/home/primary-action` |
| Two competing `<h1>`s (page vs `workspace-header.tsx`) | The shell is constant and out of this change's scope | Shell owner; named open item (Blueprint §18.2 header item) |
| `--card` pure white + translucency crutch | Product-wide blast radius; audit says "its own change" | Token owner session |
| Icon-chip raw tints; `sm:` breakpoint | Both blocked by named EXPCOMP2 conflicts (realm-token scope; density owner) | Per audit §10 |
| "Today's meals" derived from localStorage week | Platform defect `fnd-derived-today` | TIME3 / planner calendar anchor |

## 6. Files changed

- `client/src/pages/home-experience-page.tsx` — the refinement (80+/28−)
- `docs/product/structure/pages/page-home.md` — registry correction (Rule KC15)
- `scripts/capture-odl1-home.ts` — capture harness (new)
- `docs/ui-audit/odl1-home-orchard/*` — before/after screenshots (new)
- `.engineering/session/runs/ODL1_Home_Orchard_Design_Language.md`, `.engineering/session/CURRENT.md` — session records
