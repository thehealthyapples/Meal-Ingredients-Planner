# `Home` — Experience Compliance Audit

**Status:** AUDIT — point-in-time analysis against the THA Experience Compliance Standard. It is **history the moment it is written** and is never to be read as law (`docs/architecture/README.md`; PKR1 § 4.4). It **creates no rule**, and **changes nothing**.
**Classification:** Experience Governance (investigation)
**Date:** 2026-07-16
**Workstream / Audit ID:** `EXPCOMP2`
**Rollback ID:** `rollback/EXPCOMP2-home-experience-compliance-audit-20260716` → `7d1dd2ce80e9b6e23f73212d70886ddaaf79cda2`
**Assessed by:** Claude Opus 4.8 (AI implementation agent) — **built by:** not the assessor *(Standard § 4.3; Home predates this session by months. The § 4.3 "extra obligation" — do not infer a rule — is honoured: every grade below cites an owner, and where the canon is silent the silence is recorded in § 7 rather than filled.)*
**Supersedes:** none — **first audit**, of any surface. This is the first application of the `EXPCOMP1` standard, on the subject `EXPCOMP1` § 7.4 nominated.

**The mission's sixteen named areas map onto the Standard's nineteen** (§ 4.1 below). The Standard forbids adding or removing an area (§ 1.2; Template § 1.5), so all nineteen are graded and the mission's list is mapped into them rather than replacing them.

---

## 1. SURFACE UNDER REVIEW

| Field | Value |
|---|---|
| **Surface** | **Home** — the live household Home at `/home` |
| **Room in the house** | **The threshold and the heart** (Experience Blueprint § 5.1) |
| **The one thing it helps them do** | *See § 1.2 — this is the audit's headline finding* |
| **Governed exposure** | **E3 — the open view.** § 6.2: *"**Home only**"* — Home is the sole room for which E3 is legal |
| **Mapped Living Detail** | **The greeting in THA's hand** (§ 12.2; ceiling: signature voice arrival-only, at most once per day) |
| **Routes / files assessed** | `client/src/pages/home-experience-page.tsx` (398 lines, the surface) · `client/src/App.tsx:160-260` (route + shell) · `client/src/components/layout/orchard-backdrop.tsx` · `client/src/components/workspace-header.tsx` · `client/src/components/nav-bar.tsx` · `client/src/components/ui/card.tsx` · `client/src/components/conversation/FloatingAssistant.tsx` · `client/src/hooks/use-companion-notices.ts` · `client/src/hooks/use-adaptive-density.tsx` · `client/src/index.css` · `tailwind.config.ts` · `server/routes.ts:11489-11552`, `:11660-11800` · `server/lib/household-companion-fields.ts` · `shared/schema.ts:420-454` · `docs/implementation/ux/ADOPTION_REGISTER.md` |
| **States assessed** | populated · empty · loading · error · slow-connection · edges (no planner week · cleared localStorage · long meal name · 200% text). **All assessed by reading the code path that produces them; none observed rendered — see § 8, gap 1.** |
| **Sizes assessed** | mobile · tablet · desktop — **from the breakpoint classes, not from a browser** (§ 8, gap 1) |
| **Modes assessed** | light · reduced motion · 200% text. **Dark mode does not ship** (nothing sets the `dark` class) — § 8, gap 2 |

**Note on scope.** `client/src/pages/home-page.tsx` is the **unauthenticated marketing landing page** (`/` when logged out) — the street outside the house, not a room in it. It is **not** this audit's subject and is not graded. The household's Home is `/home` → `HomeExperiencePage`; `/` redirects there after login (`App.tsx:176`).

### 1.1 The Experience Test (Blueprint § 15.3) — answered before anything else

| Question | Answer | Clear? |
|---|---|---|
| Which room of the home is this? | Home — the threshold and the heart (§ 5.1) | **yes** |
| How should someone feel here? | Welcomed, oriented, and *expected*; calm **and** warm (EXPLANG § 5.1, § 3A; OHDB § 13.1) | **yes** |
| What is the ONE thing this room helps them do? | **The canon answers this. The shipped surface does not.** | **see § 1.2** |

### 1.2 Why the audit continues rather than stopping

The Template instructs: *"If any answer is unclear: STOP the audit and say so… the Experience Test assesses whether the room was designed at all."*

**Q3's answer is not unclear — it is clear in the canon and absent from the code.** Home is the most-designed room THA has: `DESIGN1`, `HOUSE1`, `ORCHARD2`, `NORTH1`, and — five days ago — `HOME2`, which specified the answer precisely as a total resolver returning **a departure**: *"the Home Primary Action is a departure… the resolver returns where to go and why; it never returns something to be done at Home."*

The room **was** designed. The surface diverges from the design. That is a conformance defect, which is exactly what an audit is for — so the audit proceeds, and Q3's divergence is graded as **Area 1**, not as a reason to stop.

> **This distinction is the single most important sentence in this report.** Blueprint § 15.3 stops work on an **undesigned** room. Home is a **designed room that was never built to its design**. Stopping here would file the finding as *"Home needs designing"* — and Home has been designed five times. It needs **building**.

---

## 2. GOVERNING DOCUMENTS CONSULTED

*(Read, not remembered — Standard § 4.1. The canon is uncommitted and moving; state recorded.)*

| Document | Version / state at audit | Read in full? |
|---|---|---|
| `THA_EXPERIENCE_ARCHITECTURE.md` (EXP1/EXP2) | Committed; last touched 2026-07-11 (`ARCH-VERIFY1`) | §§ 4–5, 7–9, 11–12, 16–18 read; cited only where read |
| `THA_EXPERIENCE_BLUEPRINT.md` (EXPBLUE1/2) | **Uncommitted**, 2026-07-15 | yes — §§ 5.1, 6.2, 7, 12, 13, 14, 15.2–15.3, 16, 18 |
| `THA_EXPERIENCE_LANGUAGE.md` (EXPLANG1/1A/1B) | **Uncommitted**, 2026-07-15 | §§ 3, 3A, 4A, 5, 6, 7 |
| `THA_UI_ARCHITECTURE.md` (UIA2) | Committed 2026-07-14 | §§ 5, 6, 8, 9, 12, 14, 15, 16, 17 |
| `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` (OHDB1) | **Uncommitted**, 2026-07-15 | §§ 4, 11, 13.1, 14, 16.2 |
| `THA_KEPT_ROOM_TRANSLATION.md` (TRANSLATION1) | **Uncommitted**, 2026-07-15 | *Space*, *Light*, *Thresholds*, *Morning Rhythm*, *Patina*, *Household Presence*; §§ 5.2, 5.6–5.7 |
| `THA_ORCHARD_LIVING_BOOK.md` (OLB1) | **Uncommitted**, 2026-07-15 | Ch. 1–3 + The Orchard Promise (adds no rule; read for the feeling protected) |
| `docs/implementation/ux/ADOPTION_REGISTER.md` | v1.0.0, 2026-07-13, generated | consulted for areas 7, 9, 17, 18 |
| `EXPCOMP1` Standard + Audit Template | **Uncommitted**, 2026-07-16 | yes — both in full |
| `HOME1`, `HOME2`, `NORTH1`, `NORTH2` | **Uncommitted**, 2026-07-16 | as **context and prior analysis, never as law** |

**Open items standing over this audit** *(they change what a FAIL means — a surface cannot fail for not shipping something the governance path has not yet admitted)*:

| Open item | Touches Home? | Effect on this audit |
|---|---|---|
| **Blueprint § 18.1 — the orchard has no named owner** | **Yes, decisively** | Exposure cannot be a governed token until this lands. Area 2 is graded **WARNING, not FAIL**, because of it. |
| **Blueprint § 18.2 — Home's header / two shell treatments** | **Yes, by name** | Area 9's WARNING is this open item, live. |
| **Blueprint § 18.3 — the UIA § 4 amendment (depth/light vocabulary)** | **Yes** | Home ships `shadow-none` everywhere. Areas 3 and 8's depth concerns are **not failed** — the vocabulary is not admitted yet. |
| **Blueprint § 18.4 — dark mode** | **Yes** | Dark mode does not ship. Home's 8 `dark:` literals are dead code. Not failed; recorded (§ 8, gap 2). |
| **Standard § 6.1 — the workflow cannot reach OHDB / TRANSLATION1 / OLB** | Yes | The Design Character Check is applied via Area 19 regardless, as § 6.1 instructs. |
| **Standard § 6.2 — Performance has no owner** | Yes | Area 16 is graded on the fragments only; **no threshold invented** (§ 7, conflict 4). |

---

## 3. COMPLIANCE SUMMARY

Home is **NON-COMPLIANT (3/19)** — seven conformance defects against adopted law, of which one is the reason all the others are hard to see: **Home has no door.** Its calm, its warmth, its honest error copy, and its genuinely excellent progressive disclosure are all real and all intact; what is missing is the one thing the room exists to give, and its absence is indistinguishable from restraint. The three most valuable fixes are a deletion, a one-line honesty correction, and a character removed from a colour class — none of which is blocked by anything.

**Headline finding:** A household arrives Home, is greeted warmly by name, is shown three equally-weighted cards with three identical chevrons, and is asked — **literally, in the subtitle** — *"How can I help your family today?"* The room that exists to know what they need is asking them. Every fact THA holds is on the screen; none of it is spent aiming the household anywhere. **The product's prioritisation work has been billed back to the family as a question**, and it reads as hospitality.

---

## 4. THE COMPLIANCE TABLE

| # | Area | Owner of the rule | Verdict | Evidence |
|---|---|---|---|---|
| 1 | One Door | EXP ARCH Principle 4, § 7 | **FAIL** | `home-experience-page.tsx:199, 207-394` — zero `<Button>`; 3 identical `<Link><Card hover-elevate border-border/40>`; 3 identical chevrons |
| 2 | Orchard Exposure | EXPBLUE § 6.2, § 5.1 | **WARNING** | `orchard-backdrop.tsx:18` `opacity: 0.90` hardcoded, no props, no route/realm variance; `index.css:73` `--orchard-opacity: 0.72` — **zero consumers**; `grep -i exposure client/` → **0 hits** |
| 3 | One Morning | EXPBLUE § 7, § 16 | **PASS** | No clock/season/mood drives any appearance; one static `<img>`; `todayLabel()` (`:81-91`) is data-borne text, permitted by § 12.2 |
| 4 | Air & Space | EXPBLUE § 8.2 · UIA § 9 | **WARNING** | Air is the resting state (`:183` `py-8 sm:py-12`, `:185` `mb-8 sm:mb-10`, `:207` `space-y-4`) — none of it from `--space-1..8` (`index.css:69-76`, unused here) |
| 5 | Truthful Objects | EXPBLUE § 12.1 r2 · OHDB § 4 · TRANSLATION1 *Patina* | **PASS** | Zero props. Every object data-borne from a named owner. *(Absence-honesty on the plant card is real and is counted once, under Area 6.)* |
| 6 | Honest Data | EXP ARCH Principle 7, § 12 · UIA § 14 | **FAIL** | `:160` `plantCount ?? 0` → **"0 of 30 plants"** where server returns `null` for *no validated data*; `:138-157` "Today's Meals" is unfalsifiable — no calendar anchor exists (`schema.ts:420-454`) |
| 7 | Living Details | EXPBLUE § 12 | **WARNING** | Mapped detail *"the greeting in THA's hand"* **not adopted** — `:193` renders the ordinary UI font. Exemption recorded: `ADOPTION_REGISTER.md:117` |
| 8 | Companion Presence | EXPBLUE § 13 · EXP ARCH § 11 · EXPLANG Principle 7 | **FAIL** | § 13: *"In every room, the Companion joins **after** the person has arrived."* Home never calls `useWithholdCompanion` (`companion-context.tsx:290-298`); default `false` → arrives simultaneously |
| 9 | Canonical Navigation | EXP ARCH § 8 · EXPBLUE § 14 · UIA § 6 | **WARNING** | One nav ✓, Home in anchor position ✓ (`nav-bar.tsx:40`), shell inherited ✓. But `:183` hand-rolls `max-w-3xl` — **only 1 of 16** `WorkspaceHeader` pages not using `pageContainerClass`; no exemption in the register |
| 10 | Progressive Disclosure | EXP ARCH § 5, Principle 2 | **PASS** | Three honest layers; every summary leads to its canonical page (`:216, :273, :317`); no glance-card-with-no-door; Home works if layer 3 is never opened |
| 11 | Visual Hierarchy | UIA § 5 · EXP ARCH § 9 | **FAIL** | Two-second glance yields **two** of three required answers — never the action. Canonical order (§ 9) missing its middle rung. Two competing `<h1>`s (`workspace-header.tsx:289` @17px vs `:192` @30-36px) |
| 12 | Calm Without Emptiness | EXPLANG § 3A.4, § 3A.1 · OHDB § 4 | **WARNING** | `index.css:11` `--card: 0 0% 100%` (pure white) in a `42 27% 95%` cream house; `card.tsx:12` `bg-card/82 backdrop-blur-md` → warm **only** by an 18% cream bleed |
| 13 | Household First | TRANSLATION1 *Household Presence*, § 5.6–5.7 · EXPBLUE § 1.5 | **WARNING** | Household is genuinely the subject; no streaks/trophies/guilt. But the Promise's **reduce effort** answers **no** (`:199` asks the household to prioritise) |
| 14 | Trust & Explainability | EXP ARCH § 12 · UIA § 14 | **WARNING** | **Zero dark patterns.** `LoadError` copy is exemplary. But the Reminders card asserts a voiced sentence with no evidence path — and Home **discards** the `trust` envelope its own owner returns (`routes.ts:11798`) |
| 15 | Accessibility | EXP ARCH § 16 · UIA § 15 | **FAIL** | **Measured:** `:187` `text-muted-foreground/70` @ `text-[11px]` = **3.40:1** (floor 4.5:1); focus ring `index.css:188-190` = **1.51:1** (floor 3:1); `MealCard.tsx:143` `truncate` clips at 200% |
| 16 | Performance & Responsiveness | **none — Standard § 6.2**; fragments: EXPLANG Principle 2 · UIA § 12 · EXP ARCH § 17.1 | **WARNING** | Skeletons preserve shape ✓; cache shared ✓. But Reminders (`:134`) reads no `isLoading` → pops in after the page; slow-connection state undesigned |
| 17 | Mobile Consistency | UIA § 9, § 6 · EXP ARCH § 16 | **FAIL** | Home switches at `sm` (640px); canonical truth is `MOBILE_BREAKPOINT = 768` (`use-adaptive-density.tsx:8`). **A second breakpoint truth** — § 9: *"a governance failure, not a detail."* Density system not consumed at all |
| 18 | Architectural Consistency | UIA Principles 4–5, § 16, § 17 | **FAIL** | **24 raw literals in 398 lines** — 15 `hsl()`, 8 sizes, 1 tracking. § 16: *"a raw value in a surface is a defect"* |
| 19 | Emotional Character | EXPLANG § 3, § 3A, § 6, § 7 · OHDB § 16.2 | **WARNING** | Calm ✓ welcoming ✓ reassuring ✓ timeless ✓ no anti-pattern ✓ the design disappears ✓. But **effortless** fails, and the care is **inferable rather than felt** |

**Counts:** **3** PASS · **9** WARNING · **7** FAIL · **0** N/A

### 4.1 The mission's sixteen areas, mapped

*(The mission named sixteen; the Standard owns nineteen and forbids substituting a different set. No area was dropped; four the mission did not name are graded because the Standard requires them — and three of those four are FAILs, which is the argument for not letting a mission edit the instrument.)*

| Mission's area | Standard's area(s) | Verdict |
|---|---|---|
| Arrival | *Not an area — a **beat** (EXPLANG § 5), assessed through* 1, 10, 12, 19 | see those |
| One Door | **1** | FAIL |
| Home Primary Action (HOME2) | **1** (HOME2 is the *specification* of the door; the *rule* is Principle 4's) | FAIL |
| Orchard House | **2**, **3** (+ OHDB § 4 / § 13.1 / § 16.2 read across 12, 19) | WARNING, PASS |
| Experience Language | **12**, **19** | WARNING, WARNING |
| Truthful Objects | **5** | PASS |
| Air & Space | **4** | WARNING |
| Progressive Disclosure | **10** | PASS |
| Household First | **13** | WARNING |
| Companion Presence | **8** | FAIL |
| Honest Data | **6** | FAIL |
| Canonical Navigation | **9** | WARNING |
| Emotional Character | **19** | WARNING |
| Mobile Behaviour | **17** | FAIL |
| Accessibility | **15** | FAIL |
| Performance | **16** | WARNING |
| *(not named by the mission)* | **7** Living Details · **11** Visual Hierarchy · **14** Trust · **18** Architectural Consistency | WARNING, **FAIL**, WARNING, **FAIL** |

---

## 5. KEY FINDINGS

*(Every WARNING and FAIL, worst first. Each carries the four things a finding must carry — Standard § 4.2 — plus the mission's requested fields.)*

---

### FAIL 1 — Home has no door

- **The rule:** Experience Architecture **Principle 4** — one primary action, and it is *the person's most likely intent*, not the product's most desired behaviour. **§ 7**: a surface with no door has not finished being designed. UIA **§ 5**: the two-second rule requires **three** answers — orientation, state, **and the one primary action**.
- **The evidence:** `home-experience-page.tsx:207-394`. The entire "Today's focus" section contains **zero `<Button>` elements**. Three cards are structurally identical:
  - `:216-259` `<Link href="/planner"><Card className="group cursor-pointer hover-elevate transition-all duration-200 border-border/40">`
  - `:273-305` `<Link href="/shopping-workspace"><Card className="h-full group cursor-pointer hover-elevate transition-all duration-200 border-border/40">`
  - `:317-354` `<Link href="/plant-diversity"><Card className="h-full group cursor-pointer hover-elevate transition-all duration-200 border-border/40">`

  Each carries an identical `<ChevronRight className="h-4 w-4 text-muted-foreground/40 ml-auto">` (`:230`, `:287`, `:331`). A fourth door sits in the footer (`:386-393`, *"See your full dashboard"*). **Four exits, no door.**
- **The failure, as a person would experience it:** They arrive. They are greeted by name. They are shown three things that are true. And then — `:199` — they are asked: **"How can I help your family today?"** The room built to know what they need is asking them what they need. A household with a critical allergy conflict sitting in their shopping list, an unplanned week, and a pending trip sees all three rendered at exactly the same weight as a plant count. **THA knows which of those matters. It declines to say.**
- **Why it conflicts:** Principle 4 requires the primary action to be *the person's most likely intent*. Home offers four equal intents and lets the household resolve the ranking — which is the product's job, done by the family. HOME1 § 4 already drew this conclusion from the other direction: *"a display succeeds when you look at it; THA succeeds when you leave."* Home currently succeeds at being looked at.
- **Recommended implementation:** Build `resolveHomePrimaryAction(state: HomeState) → HomePrimaryAction` exactly as `HOME2` § 4 specifies — a **pure, zero-I/O, deterministic, clock-free total resolver**; a **4-tier ladder with an unconditional floor** (Safety → Week unplanned → Trip pending → *Floor: the week*); first match wins; **exactly one** output, never zero, never two. Render its output as the single primary-styled action, with the other three sections visibly subordinated to it. **The output is a departure, not an operation** — Home stays read-only in spirit. The label is voiced at the Behaviour Engine seam, never hardcoded beside the route (HOME2 § 4.1). **No schema change, no new service, no new fact** — HOME2 verified it is buildable today.
- **Priority:** **High** — this is the room's reason to exist.
- **Complexity:** **Medium.** The resolver is small and pure; the ladder's four facts already have owners (DEC1's `critical`, the planner's week, the shopping list). The cost is the visual re-hierarchy around it, not the logic.
- **Inherited or introduced:** **Inherited.** Predates the entire visual programme. `NORTH1` § 8.3 first named it in July 2026; `HOME1` § 8 warned that the ambient-display hypothesis would have converted it *from a defect into a design intent*. **It survived because absence of a primary action looks exactly like restraint** (Standard, Area 1).

---

### FAIL 2 — Home fabricates a plant count that was never measured

*(New in this audit. Not previously recorded anywhere in the canon.)*

- **The rule:** Experience Architecture **Principle 7** and **§ 12** — *never fabricate*. **Core Principle 6** — honest gaps over invented facts. Blueprint **§ 12.1 r3** — *honest in absence*. UIA **§ 14** — nothing may look more certain or complete than the truth behind it.
- **The evidence:** `home-experience-page.tsx:160`:
  ```ts
  const plantCount = homeIntel?.weeklyProgress?.plantCount ?? 0;
  ```
  The server is explicit that `null` is a **deliberate honest gap** — `server/routes.ts:11486-11487`: *"Each field is null when no validated data exists — progressive enrichment, never fabrication"*, and `:11495-11502` returns `weeklyProgress: null` when the household has no planner weeks at all. **Home's `?? 0` converts that null into a measurement.** The Plant Diversity card has **no empty state and no null branch** — `:338`'s `else` renders unconditionally:
  ```tsx
  <span className="font-semibold text-foreground">{plantCount}</span> of {WEEKLY_PLANT_TARGET} plants
  ```
  → **"0 of 30 plants"**, with a 0%-width bar (`:343-348`).

  **The same codebase refuses this exact coercion, one route away** — `server/routes.ts:11717-11718`: *"A gap is silence here, never a fabricated `plantDiversity: 0`."*
- **The failure, as a person would experience it:** A family who has never opened the planner is told they have eaten **0 of 30 plants this week**. They have not eaten zero plants. THA does not know what they have eaten, and says a number anyway — rendered identically to a real measurement, in the same weight, with the same progress bar, on the same card that says *"This week"*. **A person who believes exactly what the pixels imply ends up believing something false** — the sharpest test in the canon (UIA § 14), failed.
- **Why it conflicts:** This is not a styling question. It is `null` (*we don't know*) silently becoming `0` (*we measured, and it's none*) at the one layer that is supposed to be honest about gaps. It is the same class of defect as the `= []` pattern this file's own header (`:19-26`) claims to have eradicated — *"Three states were rendered as one"* — **surviving in the one card that has no empty state.**
- **Recommended implementation:** Delete the `?? 0`. Carry the null. Give the card a designed empty state that says what is true — *nothing is known yet* — rather than a number. Per Blueprint § 12.1 r3 the honest option is the object being **absent**, and per Area 12 the empty state should be the **warmest** state, not a zeroed bar. **Do not invent copy in this audit** — the wording is the Behaviour Engine's seam and a design decision.
- **Priority:** **High** — it is a live falsehood told to households today, and it is one line.
- **Complexity:** **Low.** Remove one operator; add one branch. No schema, no owner change, no governance path.
- **Inherited or introduced:** Inherited. Survived PX1-W0's three-states sweep, which fixed the other three cards and missed this one.

---

### FAIL 3 — "Today's Meals" is an unfalsifiable claim

- **The rule:** Experience Architecture **Principle 7** / **§ 12** — *never fabricate*; **§ 12** — *show the working on request*. UIA **§ 14** — Visual Trust.
- **The evidence:** `home-experience-page.tsx:138-157` derives "today" from **`localStorage`**, not from a date:
  - `:48-61` `loadActiveWeek()` reads `planner:active-week` — the last week the household *clicked in the planner UI*, persisted across sessions. Defaults to **1**.
  - `:139` `fullPlanner.find((w) => w.weekNumber === activeWeek)`
  - `:141` `const todayDow = new Date().getDay()`

  **There is no calendar anchor in the planner schema.** `shared/schema.ts:420-454` — `plannerWeeks` has `weekNumber`, `weekName`, and **no** `startDate`/`weekStart`/`date`/timestamp; `plannerDays` has `dayOfWeek` and nothing else. `weekNumber` is an unanchored ordinal. The file's own comment concedes it (`:136-137`): *"The planner is week-number based (no stored date), so 'today' is derived, not queried."*
- **The failure, as a person would experience it:** A household who last browsed **Week 4** in the planner, arriving Home on a Wednesday, is shown **Week 4's Wednesday entries** under the heading *"Today's Meals"* and the subtitle *"What's planned for today"* — **directly beneath a real, correct calendar date** rendered from the actual clock (`:81-91`, `:190`). Two claims sit in one viewport with equal confidence: one is true, one cannot be checked. A household who has never opened the planner is shown **Week 1's** entries as today's. A household who cleared their browser data is silently reset to Week 1 with no signal.
- **Why it conflicts:** The claim is not merely wrong sometimes — **it is unfalsifiable by construction.** There is no date in the system to check it against, so neither the household nor the code can detect the mismatch. `HOME2` reached the same floor independently: *"THA cannot answer 'what is planned for today'"*, and named `buildHouseholdHistory`'s date fabrication (`routes.ts:11370`) as the sibling defect of the same missing anchor.
- **Recommended implementation:** **Two steps, and the first is not the fix.** (1) **Immediately:** stop claiming "today" with a week-ordinal — either qualify the claim honestly to what is actually known (*the active week's Wednesday*) or route the card's heading through what the data supports. (2) **Properly, and blocked:** give the planner a calendar anchor. `HOME2` records this as a **platform gap**, not an architecture defect, and notes it is also what makes `TRANSLATION1` *Morning Rhythm* § 8 currently **unimplementable**. **This audit does not design the anchor** — it is a schema decision with an owner (SoT Domain 14).
- **Priority:** **High** value, **but step 2 is blocked** — see § 6.
- **Complexity:** step 1 **Low**; step 2 **High** (schema + migration + every planner consumer).
- **Inherited or introduced:** Inherited and systemic — `schema.ts:590-591` and `:903-904` show the week-ordinal model is platform-wide, not local to Home.

---

### FAIL 4 — The Companion does not arrive a beat after the household

- **The rule:** Experience Blueprint **§ 13**: *"**It arrives a beat after you.** In every room, the Companion joins **after** the person has arrived — manners rendered as motion meaning (§ 12.2). **That beat is its entire sign of life**: no pulsing, no typing theatrics, no simulated mood, no face."* § 12.2 library: *Arrives a beat after you | Companion | Withheld-channel timing | **Manners** | The proven beat.*
- **The evidence:** The mechanism **exists and is proven**. `client/src/components/conversation/companion-context.tsx:290-298` exports `useWithholdCompanion`; `FloatingAssistant.tsx:1477` applies `withheld && "opacity-0 translate-y-1 pointer-events-none"` plus `aria-hidden`/`tabIndex={-1}` (`:1457-1458`). **Home never calls it.** `home-experience-page.tsx` imports nothing from `companion-context`. The only callers are dev-only prototypes (`client/src/pages/dev/arrival-*.tsx`). Default is `useState(false)` (`companion-context.tsx:131`). `FloatingAssistant.tsx:1223-1224` states it plainly: *"`false` everywhere else in the product, which is **every surface's behaviour today**."*
- **The failure, as a person would experience it:** The friend is already standing at the counter, at full presence, at the exact instant the household walks in — every single time. Nothing else about the Companion is wrong: no face, no pulse, no simulated mood (`:1466`, `:1500` — a `MessageSquare` icon; the panel uses a `Leaf`, not a face), and its typing dots (`:1001-1020`) are gated on a **real in-flight request** (`:1087`), so they are honest rather than theatre. **The one sign of life § 13 grants it is the one thing it does not do.**
- **Why it conflicts:** § 13 states the beat as law for *"every room"*, and grants the Companion **no other** presence signal — so a Companion without the beat has no sign of life at all, which is precisely the *"correct but nobody is home"* failure EXPLANG § 3A.2 names.
- **Recommended implementation:** One `useWithholdCompanion` call on Home, using the beat the dev prototypes already proved. Nothing else changes.
- **Priority:** **Medium.**
- **Complexity:** **Low** — the hook, the styling, and the timing all exist and ship today; only the call site is missing.
- **Inherited or introduced:** Inherited. The mechanism was built for the ARRIVAL1/EXP2 prototypes and never graduated to the live product.

**Recorded, not failed:** the FloatingAssistant FAB is `bg-primary … shadow-lg shadow-primary/20` (`:1466`) and its panel `bg-background/97 backdrop-blur-md … shadow-2xl` (`:1542-1544`) — the strongest depth on a surface that otherwise ships `shadow-none`, trending toward the *"differently-lit companion becomes a stage"* § 13 forbids. **Not graded FAIL:** the depth/light vocabulary is unshippable until Blueprint § 18.3's UIA § 4 amendment lands, and a surface may not fail for not shipping what governance has not admitted.

---

### FAIL 5 — Accessibility floors breached (measured, not judged)

- **The rule:** UIA **§ 15** — *"Every interactive element has a visible focus state, a minimum comfortable touch target, and an accessible name"*; *"Text scales to at least double size without loss of content or capability; **layout reflows rather than truncates**"*; *"the type floor stands (§ 8)"*. UIA **§ 8** — *"Surfaces use roles, **never arbitrary sizes**"*. EXP ARCH **§ 16** — accessibility as a design input.
- **The evidence — computed with the WCAG relative-luminance formula, alpha composited in sRGB:**

  | Site | Pairing | Measured | Floor | Verdict |
  |---|---|---|---|---|
  | `:187` | `text-muted-foreground/70` @ `text-[11px]` on the card | **3.40:1** | 4.5:1 (normal text) | **FAIL** |
  | `index.css:188-190` | focus ring `hsl(var(--primary)/0.35)`, `outline-offset:2px`, on page bg | **1.51:1** | 3:1 | **FAIL** (product-wide) |
  | `:223, :280, :324` | the three realm-tint chips | 6.54 / 7.01 / 6.64:1 | 3:1 (graphical) | pass |
  | card body text | `--muted-foreground` on `bg-card/82` | 6.92:1 | 4.5:1 | pass — **but contingent** |

  Additional, verified:
  - **`hover-elevate` has no `:focus-visible` counterpart.** `index.css:471` defines `:hover` only; `.hover-reveal` at `:497-498` *does* pair them. Worse, `hover-elevate` sits on the **Card** while focus lands on the parent `<a>` — so a keyboard user gets only the 1.51:1 outline where a mouse user gets a tint lift.
  - **`MealCard.tsx:143`** `<span className="text-sm truncate">{meal.name}</span>` — at 200% a long meal name **clips to an ellipsis rather than reflowing**, against § 15's *"reflows rather than truncates"*.
  - **`text-[11px]` and `text-[1.9rem]`** (`:187`, `:193`) are arbitrary values — § 8's *"never arbitrary sizes"*, independent of any floor. `sm:text-4xl` (36px) matches no rung either; `.title-page` is 32px. **The page's `<h1>` does not use the named scale at all.**
  - **Two competing `<h1>`s:** `workspace-header.tsx:289`/`:348`/`:387` renders `"Home"` at 17px; `home-experience-page.tsx:192` renders `"Welcome Home, …"` at 30–36px. The visually dominant title is the second h1 in document order.
  - **Footer `/dashboard` link** (`:386-393`): computed target ≈ **150 × 20px** — `text-sm` line-box, no padding, no `min-h`.
  - **Reduced motion: passes.** `index.css:526-539` gates every CSS transition globally, covering Home's `transition-all duration-200`.
- **The failure, as a person would experience it:** The date above the greeting — the first line of the room — is the least readable text on the page, and it is the one thing on Home a user **cannot enlarge by raising their browser's default font size**, because it is set in `px`. A keyboard user tabbing Home gets a focus ring at 1.51:1 against the background: **on a bright screen it is effectively invisible**, so the room cannot be navigated without a mouse with any confidence.
- **Why it conflicts:** § 15 calls these floors, not preferences, and § 16 calls accessibility a design input rather than a compliance pass. *"Calm is accessibility"* cuts both ways — **an inaccessible surface is not calm; it is calm-for-some.**
- **Recommended implementation:** Drop the `/70` on `:187` (3.40 → 6.92:1 — one character). Move `text-[11px]`/`text-[1.9rem]`/`sm:text-4xl` onto the named scale. Raise the focus ring to ≥3:1 (**product-wide, not Home's alone** — route to UIA § 15's owner). Pair `hover-elevate` with `:focus-visible`, on the focusable element. Replace `truncate` with reflow on `MealCard`'s row variant. Resolve the duplicate `<h1>`. Give the footer link a comfortable target — **or delete it** (see § 7 conflict 5).
- **Priority:** **High.**
- **Complexity:** **Low** individually; the focus ring is a one-line token change with product-wide blast radius, so it wants its own change.
- **Inherited or introduced:** Inherited; the focus ring predates Home.

---

### FAIL 6 — Home is a second breakpoint truth, and does not consume the density system

- **The rule:** UIA **§ 9** — *"**One breakpoint truth.** What counts as 'small', 'medium', and 'large' is defined exactly once, product-wide. **Two surfaces disagreeing about whether the same screen is small is a governance failure, not a detail.**"* And: density is the responsive model; *"touch is the default… regardless of density."*
- **The evidence:** The declared owner is `client/src/hooks/use-adaptive-density.tsx:1-8`, whose own comment says *"this file is the one owner of breakpoint truth… **Do not re-derive this number anywhere else**"* and exports `MOBILE_BREAKPOINT = 768`. `tailwind.config.ts:111-116` corroborates: *"`md` (768px) is the CSS face of MOBILE_BREAKPOINT… Change them together or not at all."*

  **Home switches at `sm` (640px)** — `:263` `grid grid-cols-1 sm:grid-cols-2`. Its single↔two-column decision, the whole of its mobile story, is made **128px from the canonical boundary**. Between 640px and 767px, `use-adaptive-density` calls the viewport **mobile** while Home has already committed to its two-column desktop layout.

  **Home does not import the density system at all** (`:28-43`; zero references to `use-adaptive-density` or `density-tokens`). It hardcodes `p-5` (`:221`, `:278`, `:322`) and `gap-4` (`:263`) at every density. The canonical system exists and is populated (`client/src/lib/density-tokens.ts`, ~10 consumers).
- **The failure, as a person would experience it:** On a large phone in landscape, or a small tablet, Home silently becomes a two-column desktop layout while the rest of the product still considers the device a phone. The household gets a room that disagrees with its own house about what device they are holding.
- **Why it conflicts:** § 9 does not describe this as an aesthetic mismatch — it names it *a governance failure*. Home never imports the owner, so the owner cannot correct it.
- **Recommended implementation:** Consume the canonical density system, and let the owner decide the boundary. Do **not** simply swap `sm:` for `md:` — that hardcodes a second copy of the number the owner exists to hold.
- **Priority:** **Medium.**
- **Complexity:** **Low** — but see § 7 conflict 3: **the owner itself holds three numbers**, so this fix should follow that conflict's resolution rather than pick one.
- **Inherited or introduced:** Inherited; predates PX1-W2's consolidation, which Home was never brought into.

---

### FAIL 7 — Twenty-four raw values in a 398-line surface

- **The rule:** UIA **§ 16** — *"Surfaces speak semantic only. Pages and components reference the semantic tier exclusively. Primitive values appear in exactly one definition source; **a raw value in a surface is a defect**."* **Principle 4** — one canonical owner per visual concern.
- **The evidence:** 15 raw `hsl()` colours, 8 raw sizes, 1 raw tracking — **24 in 398 lines**, with **zero** token references among them:

  | Type | Lines | Examples |
  |---|---|---|
  | Colour (15) | `:223`, `:280`, `:324`, `:343`, `:345` | `bg-[hsl(172,20%,92%)]`, `text-[hsl(190,42%,26%)]`, `bg-[hsl(145,34%,52%)]` |
  | Size (8) | `:187`, `:193`, `:224`, `:281`, `:325` | `text-[11px]`, `text-[1.9rem]`, `style={{ width: 18, height: 18 }}` ×3 |
  | Tracking (1) | `:187` | `tracking-[0.14em]` |

  **The tokens already exist, and Home's literals are near-misses of them:**

  | Home's raw value | The pre-existing token | Location |
  |---|---|---|
  | `bg-[hsl(172,20%,92%)]` (`:223`) | `[data-realm="planner"]` `--realm-bg: hsl(172,28%,89%)` | `index.css:211-216` |
  | `bg-[hsl(190,24%,92%)]` (`:280`) | `[data-realm="shopping"]` `--realm-bg: hsl(190,28%,90%)` | `index.css:259-263` |
  | `bg-[hsl(145,20%,91%)]` (`:324`) | `[data-realm="nutrition"]` `--realm-bg: hsl(145,22%,90%)` | `index.css:253-258` |

  **Same hue, drifted saturation and lightness — the exact drift § 16 exists to prevent.**

  Two compounding facts:
  - **8 of the 15 colours are dead code.** The `dark:` variants are unreachable — nothing in `client/src` sets the `dark` class (`ADOPTION_REGISTER.md:178` records this as an unowned concern).
  - **`h-4.5 w-4.5`** (`:224`, `:281`, `:325`) are **non-existent classes** — Tailwind's scale jumps 3.5→4→5 and `tailwind.config.ts` adds no `spacing` extension. They compile to nothing. The inline `style={{ width: 18, height: 18 }}` beside them is **the workaround for the dead class** — the raw numeric and the dead utility are one defect, not two.
- **The failure, as a person would experience it:** Nothing, today — and that is the point. This is invisible to the household and expensive to the house: three chips whose colours will drift away from their rooms' colours the first time the realm tokens are tuned, and nobody will connect the two.
- **Why it conflicts:** § 16 admits no judgement here — *a raw value in a surface is a defect*, stated flatly. And § 16 is **not machine-enforced anywhere**: `scripts/ci/adoption-register-gate.ts` checks owners, rivals, retired predecessors, and orphan modules — **zero** hits for `hsl`, `token`, or `raw`; there is **no ESLint and no Stylelint config in the repo**. Its only checkpoint is a human reading UIA § 18's checklist.
- **Recommended implementation:** Move every literal onto its owner. **Partially blocked** — see § 7 conflict 2: `--realm-*` is scoped to `[data-realm]` on the header wrapper, and Home's `WorkspaceHeader` is a *sibling* of its content column, so **`var(--realm-accent)` is not in scope for the page body at all**. That explains the hardcoding and does not exempt it. Delete the 8 dead `dark:` literals and the 3 dead `h-4.5 w-4.5` classes **now** — they are deletions, and blocked by nothing.
- **Priority:** **High** for the deletions; **Medium** for the token migration.
- **Complexity:** **Low** mechanically; **Medium** once conflict 2 is routed.
- **Inherited or introduced:** Inherited.

---

### WARNING 1 — Home is at E3 only because every other room is wrongly at E3

*(The most consequential WARNING in this report, and the clearest example of why the grade exists.)*

- **The rule:** Blueprint **§ 6.2**, rule 1: *"Exposure is a per-domain constant (§ 5.1), set once by design and **expressed as governed values in the one token source** (UIA § 16) — **never a per-surface or per-component choice**."* § 6.2's table: **E3 — the open view — "Home only."**
- **The evidence:** `client/src/components/layout/orchard-backdrop.tsx` is 23 lines. Line `:18`: `opacity: 0.90` — a **hardcoded literal**. The component takes **no props**, reads **no context**, reads **no CSS variable**, and has **no conditional logic**. `App.tsx:210` renders it bare, inside `ProtectedRoute`, **identically behind every authenticated room**.

  `grep -i "exposure" client/` → **zero hits.** No E0/E1/E2/E3 token, type, enum, prop, or attribute exists anywhere in the client. **The Orchard Exposure Scale is not implemented at all.**

  And the token source **disagrees with the shipped value**: `index.css:73` defines `--orchard-opacity: 0.72` (and `:155` `0.18` for dark) — **zero consumers**. The governed value is 0.72; the surface renders 0.90; nothing connects them.
- **The mechanism by which it is currently true — REQUIRED:** Home is mapped **E3, the maximum**, and the uniform wallpaper is at **0.90, near the maximum**. So the one room permitted the most orchard receives approximately the right amount of orchard — **by coincidence of being at the top of a scale nobody implemented.** Home reads correct because *the defect's value happens to land near Home's mapped value*.
- **What removes it:** **Any fix aimed at another room.** `NORTH1` § 8.1 correctly names the uniform backdrop a live defect; the correct remedy is to implement the scale, which means the Planner, Shopping, and the Analyser drop to **E1 — light only**. If that is done the obvious, cheap way — by lowering the global opacity — **Home silently loses the open view that § 6.2 says is part of its purpose**, and no one will connect the two changes. Home's compliance here is a hostage to a defect being fixed carelessly.
- **Why it conflicts:** Home's *level* is right and its *mechanism* is illegal: rule 1 forbids a per-component choice and requires a governed token, and the surface has a raw literal contradicting an orphaned token.
- **Recommended implementation:** **Blocked, deliberately.** Blueprint § 18.1 — *the orchard has no named canonical owner, and "it needs one before exposure levels become governed tokens."* Name the owner first; then admit the exposure values as tokens; then Home's E3 becomes true **by construction**. Do not touch the backdrop's opacity before that, in either direction.
- **Priority:** **High** value, **blocked** — it cannot start.
- **Complexity:** **High** — governance first, then a platform-wide visual change across eleven rooms.
- **Note for the next auditor:** the same evidence that is a **WARNING for Home is a FAIL for every other room.** A Planner or Pantry audit will find *"uniform exposure across domains (wallpaper)"* — Area 2's named FAIL condition — from these identical three lines. **Home is the one room where this defect is invisible, which is precisely why it survived.**

---

### WARNING 2 — Every card is warm only because it is see-through

- **The rule:** Experience Language **§ 3A.4** — *calm must never become lifeless*; **§ 3A.1** — the eight never-feelings (cold · clinical · sterile · …). OHDB **§ 4** — *composed emptiness, never bare emptiness*.
- **The evidence:** `index.css:11` — `--card: 0 0% 100%` — **pure white**, in a house whose `--background` is `42 27% 95%` (warm cream, `index.css:8`). It is **the only cold value in the palette.** `client/src/components/ui/card.tsx:12`:
  ```
  "shadcn-card rounded-xl border bg-card/82 backdrop-blur-md border-border text-card-foreground shadow-none"
  ```
  Composited: `255 × 0.82 + 245.69 × 0.18` → **rgb(253.3, 253.0, 252.1)** — warm, by an **18% cream bleed-through**. Home inherits this on all four of its cards (`:217`, `:274`, `:318`, `:360`).
- **The mechanism by which it is currently true — REQUIRED:** **Warmth by translucency, not by material.** The card is not a warm surface; it is a white surface you can partly see the warm room through.
- **What removes it:** **The codebase already removes it, in one place, for a perfectly good reason** — `index.css:588-593`:
  ```css
  /* Cards and panels inside modals sit on top of the orchard background,
     so they must be fully opaque to remain readable */
  [role="dialog"] .shadcn-card {
    background-color: hsl(var(--card));
    backdrop-filter: none;
  }
  ```
  **The system has already conceded that 82% is not the intended material** — and where it reverts to the *actual* token, the card is pure white. Any future readability fix, performance pass (`backdrop-blur` is expensive), or dark-mode work that removes the opacity crutch turns every card in the house cold, and the change that does it will look completely unrelated.
- **Why it conflicts:** § 3A.4's *"calm must never become lifeless"* is currently satisfied by an accident of compositing rather than by the palette. `NORTH1` § 8.2 named this; this audit verifies both citations exactly and adds the dialog rule as proof it is a crutch.
- **Recommended implementation:** Make `--card` warm **by construction** — a value in the house's own temperature — and retire the opacity crutch in the same change. **Not blocked by the UIA § 4 amendment**: this changes an existing token's value, it does not introduce the depth/light vocabulary.
- **Priority:** **High.**
- **Complexity:** **Medium** — one token, product-wide blast radius; wants its own change and its own visual verification.

---

### WARNING 3 — Home's one sign of life was mapped and never adopted

- **The rule:** Blueprint **§ 12.2** — Home's Living Detail is *"**The greeting in THA's hand**"*, data source *clock + household name*, meaning *"You were expected"*, ceiling *"signature voice stays arrival-only (§ 10); at most once per day."* § 5.1 lists it as Home's one sign of life.
- **The evidence:** `home-experience-page.tsx:192-204` renders the greeting in the **ordinary UI font**: `className="text-[1.9rem] sm:text-4xl font-semibold tracking-tight text-foreground leading-tight"`. No signature voice. **Home has zero adopted Living Details** where the map gives it one.

  The exemption **is recorded** — `ADOPTION_REGISTER.md:117`, concern *Signature typography*, exempt surface *"Every household-facing surface, **including the live Home (`/home`)**"*: *"Not an exemption from the owner — an exemption from USING it… UXHOME1 amended the law and built the prototype, and **deliberately did NOT adopt it into the live Home in the same change**."*
- **The mechanism by which it is currently true:** Home does not breach the one-per-domain ceiling — **because it has none.** Its Living Detail count is compliant **by omission, not by restraint**. The room reads as disciplined; it is actually unfurnished.
- **What removes it:** Nothing removes the compliance — but nothing closes the gap either. A recorded exemption with no close date is how *"deliberately not yet"* becomes *"apparently never"*, and the register's own thesis is that **authored-but-unadopted must be impossible to hide** (UIA § 17).
- **Why it conflicts:** It doesn't, today — which is the whole content of a WARNING. The map says Home has a sign of life; Home has none; the difference is recorded and unclosed.
- **Recommended implementation:** Adopt the greeting in THA's hand through the governed path — **one Living Detail at a time** (Blueprint § 2.4) — respecting the § 12.2 ceiling (arrival-only, once per day), and close the register's exemption in the same change.
- **Priority:** **Medium.**
- **Complexity:** **Low–Medium** — the prototype exists (UXHOME1); the law is already amended; only the adoption is missing.

---

### WARNING 4 — The two-second glance yields no action *(Area 11)*

- **The rule:** UIA **§ 5** — the two-second rule: a glance must yield **orientation, state, and the one primary action**. EXP ARCH **§ 9** — the canonical attention order: orientation → state → **primary action** → detail → depth.
- **The evidence:** Glancing at Home for two seconds yields: *"I'm home, it's Thursday 16 July"* (orientation ✓) and *"three meals planned, 4 items to buy, 12 of 30 plants"* (state ✓). **The third answer does not exist on the surface.** The canonical order's middle rung is absent, and the eye's path runs greeting → card → card → card, all at one weight (`:216`, `:273`, `:317` — identical class strings).
- **Why this is a FAIL and not a WARNING:** it is graded **FAIL** in § 4 — the rule requires three answers and the surface yields two, which is the rule broken as written, not drift toward breaking it.
- **Recommended implementation:** Falls out of FAIL 1 entirely. Build the door, and the third answer appears; withhold emphasis from the other three, and the order resolves. **No separate work.**
- **Priority:** **High** (as FAIL 1). **Complexity:** none of its own.
- **Also:** the duplicate `<h1>` (`workspace-header.tsx:289` vs `:192`) is a small independent hierarchy defect, reported under FAIL 5.

---

### WARNING 5 — Home is the only room that hand-rolls its container *(Area 9)*

- **The rule:** UIA **§ 6** (the one page anatomy) · **Principle 4** (one canonical owner per visual concern). The owner's own docstring, `workspace-header.tsx:488-500`: *"The canonical page content column… Before this existed, the container string was copy-pasted 17 times and the top padding diverged seven ways (**48px on Home** → none at all on the Cookbook)… **One owner, one rhythm**: it reads the SAME `wide` flag as `WorkspaceHeader`, so **a page's content column can no longer disagree with its own banner about how wide the page is**."*
- **The evidence:** `home-experience-page.tsx:181` passes `wide` to its banner (→ `max-w-screen-2xl`, `workspace-header.tsx:501`), and `:183` hand-rolls its column:
  ```
  <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
  ```
  **Home is the only one of sixteen** `WorkspaceHeader` pages that does not call `pageContainerClass` — verified per-file: all 15 others ≥1 call, Home = **0**. Its `py-8 sm:py-12` is **the 48px the docstring cites at `:492` as the original defect** — still present, in the one file the owner never reached. No exemption exists in the register.

  *(`NORTH1` § 8.4's claim is **verified**, with one correction: it cites the docstring at `:494-495`; the quoted intent is at `:494-496`. Substance correct.)*
- **The mechanism by which it is currently true:** Home **looks** canonical because everything except the one thing it owns is inherited from the shell (`App.tsx:202-249`) — the header, the nav, the backdrop, the error boundary, the Companion. Only the content column diverges, and a divergent column is invisible next to an identical everything-else.
- **What removes it:** **The obvious fix, applied carelessly, is worse than the defect** — see § 7 conflict 1. `pageContainerClass(true)` is `max-w-screen-2xl` (1536px); Home's column is `max-w-3xl` (**768px**). Adopting the owner as written would **double Home's column width** and destroy § 5.1's mapped ground posture for Home — *"compact counter — **the view keeps its share**"* — filling with widgets the width TRANSLATION1 *Space* § 4 says must become **air and view**. The narrow rung (1280px) does not reproduce it either.
- **Why it conflicts:** Blueprint **§ 18.2** names this open item by name: *"the live Home and the realm surfaces currently present two shell treatments; one must be canonical or the exception recorded in the register."* Neither has happened.
- **Recommended implementation:** **Do not adopt the container as-is.** Route § 7 conflict 1 to the container's owner first: the owner needs a rung for Home's mapped posture, or Home needs a recorded exemption with a reason. **Name it; do not pick.**
- **Priority:** **Medium.**
- **Complexity:** **Medium** — trivial as a code change, and it is not a code decision.

---

### WARNING 6 — Air is right, and none of it is from the scale *(Area 4)*

- **The rule:** Blueprint **§ 8.2** (*air is a material*) · UIA **§ 9** (one spacing scale; density as the only modulator).
- **The evidence:** Home is genuinely generous — `:183` `py-8 sm:py-12`, `:185` `mb-8 sm:mb-10`, `:207` `space-y-4`, `:221` `p-5`. **Air is the resting state, and nothing is compressed.** But `--space-1`…`--space-8` exist (`index.css:69-76`) and Home uses **none of them**; every value is a Tailwind stock number. Density is not modulated by the one density system (FAIL 6).
- **The mechanism by which it is currently true:** Home's air is correct because **one developer chose good numbers**, and it is preserved by nothing. On a large viewport the extra width becomes **air and view** — TRANSLATION1 *Space* § 4 satisfied — **by the same hand-rolled `max-w-3xl` that fails Area 9.** Home's best spatial property and its container defect are the same line of code.
- **What removes it:** Fixing Area 9 naively (WARNING 5) removes the air in the same stroke. These two findings must be resolved **together or not at all**.
- **Recommended implementation:** Resolve with § 7 conflict 1; migrate to the named scale in the same change.
- **Priority:** **Medium.** **Complexity:** **Low**, once the container question is settled.

---

### WARNING 7 — The Promise's first question answers no *(Area 13)*

- **The rule:** TRANSLATION1 *Household Presence* / **§ 5.6–5.7** (*household before technology*; *people before data*) · EXPLANG **§ 4A Principle A** (the THA Promise: does this **reduce effort**, **increase confidence**, **give time back**?).
- **The evidence:** Home passes the hard half convincingly — the household **is** the subject; there are **no** streaks, trophies, guilt copy, notification piles, or engagement furniture; the greeting names a person (`:196`); the data shown is *their* week, *their* list, *their* plants. Against the Promise:
  - **Reduce effort? — No.** `:199` *"How can I help your family today?"* + four equal doors hands the ranking back.
  - **Increase confidence? — Partly.** It shows what is true; it never says what it means.
  - **Give time back? — Partly.** Three summaries in one glance is real value.
- **The mechanism by which it is currently true:** Two of the Promise's three questions carry the third — exactly Area 13's WARNING wording. Home is household-first **in what it shows** and product-first **in what it asks**.
- **What removes it:** Nothing, until FAIL 1 is fixed. This WARNING is FAIL 1 seen from the household's side, and it closes when the door opens.
- **Priority:** **High** (as FAIL 1). **Complexity:** none of its own.
- **Also recorded:** the footer *"See your full dashboard"* (`:391`) is the only product furniture on the surface — and it is the **sole live door to a room with no row on the map** (§ 7 conflict 5).

---

### WARNING 8 — The Reminders card asserts, and drops its own trust envelope *(Area 14)*

- **The rule:** EXP ARCH **§ 12** — *show the working on request*; UIA **§ 14** — how evidence and confidence are rendered.
- **The evidence:** **Home has zero dark patterns** — no scarcity, no guilt, no confirm-shaming, no friction on leaving, nothing destructive on the surface at all. The `LoadError` copy is exemplary and worth naming as a positive: *"Nothing has been lost — this is a problem at our end, not with your data."*

  But `:359-381` renders the Behaviour Engine's voiced sentence verbatim (correctly — `:374-375`) with **no path to why THA said it**, no provenance, and no way to mute it from Home. And the server returns a trust envelope — `server/routes.ts:11798`: `res.json({ notices: voiced, trust: {...} })` — which **Home destructures away** (`:134` takes only `data`).
- **The mechanism by which it is currently true:** The notices themselves are honest, governed, and silence-ruled server-side, so nothing on screen is false. The evidence path is missing rather than broken — and the three *other* cards each reach their canonical page in one tap, so Home's evidence story is inconsistent rather than absent.
- **What removes it:** A notice that a household disagrees with, and no way to ask why or to stop it. The trust data to answer them is already on the wire and thrown away.
- **Recommended implementation:** Consume the `trust` envelope the owner already returns; give the reminder a path to its evidence consistent with the other three cards.
- **Priority:** **Low–Medium.** **Complexity:** **Low.**

---

### WARNING 9 — The happy path is calm; the slow path is undesigned *(Area 16)*

- **The rule:** **No owner** — Standard § 6.2. Graded on the fragments only, and **no threshold invented**: EXPLANG **Principle 2** (*fast where the person is waiting; calm where the person is deciding*) · UIA **§ 12** (*shape before spin*; layout-stable placeholders) · EXP ARCH **§ 17.1** (a feature is not done until its **slow-connection state** is designed).
- **The evidence:** Genuinely good: skeletons preserve shape and layout for three of four cards (`:234-237`, `:290`, `:334-336`); no full-page spinner on `/home`; no literal "Loading…"; `useMealsSummary` shares the Dashboard's cache entry so the data is fetched **once between them** (`use-meals-summary.ts:4-17`); PX1-W3 already removed a ~1 MB cookbook fetch.

  Against that:
  - **The Reminders section reads no `isLoading` and no `isError`** (`:134` destructures only `data`) — so it **pops into existence** after the rest of the page has settled. This is the `= []` pattern the file's own header (`:19-26`) claims to have eliminated — *"Each section below now separates them"* — and **"each section below" excludes this one.** EXPLANG Principle 1 names content reflowing or popping in as the person watches an anti-pattern.
  - **The slow-connection state is undesigned** — it is what happens, not what was decided (§ 17.1).
  - `/` shows a full-page `Loader2` spinner (`App.tsx:163-168`) before redirecting to `/home` — the arrival's first frame is loading theatre, at the one moment Principle 1 protects.
- **The mechanism by which it is currently true:** Home is calm on a fast connection because the skeletons are good and the caches are shared. Neither of those was designed for the slow path; both happen to help it.
- **Recommended implementation:** Read `isLoading`/`isError` on the notices query, as the other three sections do. Design the slow state. **Do not add a threshold** — there is no owner to cite (§ 7 conflict 4).
- **Priority:** **Medium.** **Complexity:** **Low.**

---

### WARNING 10 — The care is inferable rather than felt *(Area 19)*

*(Assessed last, after areas 1–18, per the Standard.)*

- **The rule:** EXPLANG **§ 3** (the seven feelings) · **§ 3A** (the palette; *calm must never become lifeless*) · **§ 6** (the Review Questions) · **§ 7** (the anti-patterns) · OHDB **§ 16.2** (the Design Character Check — applied here regardless of Standard § 6.1's workflow gap, as § 6.1 instructs).
- **The evidence, against the seven feelings:** calm ✓ · welcoming ✓ (the greeting is genuinely warm and names a person) · reassuring ✓ (the error copy is the best writing on the surface) · **effortless ✗** (it asks the household to choose) · **intelligent — partly** (it shows what it knows; it never uses it) · **premium — partly** · **quietly memorable ✗** (the signature is unadopted).

  **No § 7 anti-pattern is adopted.** Nothing on Home is datable — no frosted glass on the surface itself, no signature effect, no marketing gimmick in the workspace. **The design does disappear.** Home is timeless (OHDB § 14.2): it would look right in ten years.
- **The mechanism by which it is currently true — the finding:** **Extraordinary care went into this file, and none of it is felt.** The comments record it: PX1-W0's three-states fix (*"a household with a full week planned… was told 'Nothing planned for today yet'"*), PHASE5E's removal of a latent second attention budget, PX1-W3's cookbook-fetch fix. That care is **inferable by reading the source** and **invisible from the doorway**. The premium standard's test is precise: *if the household would not feel the care, it is decoration; if they would feel its absence, it is craft.* The household would not feel any of this care — **they would feel the absence of the one thing that isn't there.**
- **What removes it:** Nothing; it is already the state. Home sits one step from EXPLANG § 3A.2's named failure — *behaviourally and visually correct but feels like nobody is home*. It is warm, and it is a menu.
- **The North Star tie-breaker** (*when two designs both pass every gate, choose the one the household would feel and could not name*): Home currently offers nothing to feel and nothing to name.
- **Priority:** **High**, and it is not separate work — it closes when FAIL 1, WARNING 2, and WARNING 3 close.
- **Complexity:** none of its own.

---

## 6. RECOMMENDED IMPROVEMENTS

*(Ordered by **value**, which is not severity — the difference is the useful part of an audit. **An audit recommends; it never implements.**)*

| # | Improvement | Closes | Type | Blocked by | Value |
|---|---|---|---|---|---|
| 1 | **Build the door** — HOME2 § 4's resolver; render its one output as the primary action; subordinate the rest | FAIL 1, W4 (Area 11), W7 (Area 13), W10 (Area 19) | behaviour change | **nothing** — HOME2: no schema, no new service, buildable today | It is the room's reason to exist. Four findings close on one change. |
| 2 | **Stop the fabrication** — delete `?? 0`; give the plant card an honest empty state | FAIL 2 | conformance fix | nothing | A live falsehood told to households, removed by deleting one operator |
| 3 | **Delete the false header comment** (`:13-15`) | *(no area — a defect in the record)* | **deletion** | nothing | It misleads every future reader about a live system. It misled the first pass of this audit. |
| 4 | **The accessibility floors** — `/70` alpha, `text-[11px]`, the 1.51:1 focus ring, `truncate`→reflow, the duplicate `<h1>` | FAIL 5 | conformance fix | nothing (focus ring is product-wide) | Measured, unarguable, mostly one-character |
| 5 | **`--card` warm by construction**; retire the opacity crutch | W2 (Area 12) | token change | nothing — an existing token's **value**, not new vocabulary | Removes the canon's own worked example of accidental correctness |
| 6 | **The Companion's beat** — one `useWithholdCompanion` call | FAIL 4 | conformance fix | nothing — hook, styling, timing all ship | Restores the Companion's only permitted sign of life |
| 7 | **Delete the dead code** — 8 `dark:` literals, 3 `h-4.5 w-4.5` classes | part of FAIL 7 | **deletion** | nothing | Unreachable code that reads as intent |
| 8 | **Reminders: read `isLoading`/`isError`** | W9 (Area 16), part of W8 | conformance fix | nothing | Completes the fix this file's own header claims to have made |
| 9 | **Raw values → realm tokens** | FAIL 7 | token change | **§ 7 conflict 2** (tokens out of scope for page bodies) | Stops a drift that is invisible now and permanent later |
| 10 | **Density + breakpoint** — consume the canonical system | FAIL 6 | conformance fix | **§ 7 conflict 3** (the owner holds three numbers) | Closes a named governance failure |
| 11 | **The container** — Home's column vs its banner | W5 (Area 9), W6 (Area 4) | governance → conformance fix | **§ 7 conflict 1** + Blueprint § 18.2 | Must not be done naively; the naive fix destroys the map's posture |
| 12 | **The greeting in THA's hand** — adopt Home's Living Detail | W3 (Area 7) | design + governed adoption | governed path: one detail at a time (Blueprint § 2.4) | Home's only sign of life |
| 13 | **Exposure as a governed token** — E3 by construction | W1 (Area 2) | governance → token | **Blueprint § 18.1** — the orchard has no owner | Home's compliance is currently a hostage |
| 14 | **The planner's calendar anchor** | FAIL 3 (step 2) | schema + platform | **HOME2's named platform gap** | Makes "today" answerable at all — and `TRANSLATION1` *Morning Rhythm* § 8 implementable |

**Deliverable now** — needs no amendment, no new law, and removes a violation or a defect rather than adding a vocabulary: **1, 2, 3, 4, 5, 6, 7, 8** — and **FAIL 3 step 1** (stop claiming "today" with a week-ordinal).

> *(NORTH1 § 8's structure is the pattern worth copying: its first recommendation was a **deletion**. Three of the eight above are deletions or one-character changes, and **the highest-value item in the table is blocked by nothing.**)*

**Blocked until the governance path lands — do not start:** **9** (conflict 2) · **10** (conflict 3) · **11** (conflict 1 + § 18.2) · **12** (one detail at a time) · **13** (§ 18.1 — the orchard's owner) · **14** (the platform gap).

**And one that must not be started at all yet:** **do not "fix" the orchard backdrop's opacity in either direction** before § 18.1 names an owner. Lowering it to correct the Planner silently takes Home below E3; raising it deepens the wallpaper. The value is not the decision — **the owner is.**

---

## 7. ARCHITECTURAL CONFLICTS

*(Where the surface is not wrong but the **architecture** is unclear, silent, or unreachable. Routed to owners; **none resolved here, none picked between, none filled.**)*

| # | Conflict | Documents involved | Effect on this audit | Recommendation |
|---|---|---|---|---|
| 1 | **The canonical container has no rung for Home's mapped ground posture.** `pageContainerClass` offers WIDE (`max-w-screen-2xl`, 1536px) and NARROW (`max-w-screen-xl`, 1280px). Blueprint § 5.1 requires Home to be a *"compact counter — **the view keeps its share**"* at **E3**, which the surface achieves with `max-w-3xl` (**768px**). **Neither rung reproduces it.** Adopting the owner destroys the map's requirement; keeping the hand-roll breaches the owner. | Blueprint § 5.1, § 18.2 · UIA § 6, Principle 4 · TRANSLATION1 *Space* § 4 · `workspace-header.tsx:488-513` | Area 9 → WARNING not FAIL; Area 4's WARNING is the same line of code. It made the "obvious" fix unrecommendable. | Route to the container's owner **and** Blueprint § 18.2 together. Either the owner gains a rung for E3 rooms, or Home takes a recorded exemption with a reason. **Name it; do not pick.** |
| 2 | **The realm token system is unreachable from page bodies.** `--realm-*` is scoped to `[data-realm]`, set only on the header wrapper (`workspace-header.tsx:243`), which **portals into the shell slot** (`App.tsx:215`) and is a *sibling* of page content. So `var(--realm-accent)` is **not in scope** for any page body. UIA § 16 requires surfaces to speak semantic only — **and the semantic tier is out of reach.** | UIA § 16, Principle 4 · `index.css:194-327` · `workspace-header.tsx:243` | Explains FAIL 7's 15 raw literals and **does not exempt them**. It makes recommendation 9 unstartable as written. | Route to UI Architecture § 16's owner. The scope is the defect, not the surface. |
| 3 | **"One breakpoint truth" is three numbers, inside the owner.** `use-adaptive-density.tsx:1-8` declares itself *"the one owner of breakpoint truth… Do not re-derive this number anywhere else"* and exports `MOBILE_BREAKPOINT = 768`; its own `deriveDensity` (`:60-63`) uses **640** and **1280**. | UIA § 9 · `use-adaptive-density.tsx` · `tailwind.config.ts:111-116` · PX1-W2 | Home's `sm:` (640) matches the owner's *density* boundary and not its *mobile* truth. FAIL 6 stands (Home imports neither), but the fix cannot be "use the owner's number" — **there are three.** | Route to UIA § 9's owner. PX1-W2's consolidation is narrower than its comment claims. |
| 4 | **Performance has no owner** — inherited from Standard § 6.2. | Standard § 6.2 · EXPLANG Principle 2 · UIA § 12 · EXP ARCH § 17.1 | Area 16 graded on fragments only. Home's popping-in section is citable (Principle 1); *"is Home fast enough"* is **not**. | Already recorded as an open item by EXPCOMP1. **No threshold invented here.** |
| 5 | **`/dashboard` is a live room with no row on the map — and Home is its only door.** `App.tsx:381`, 923 lines, `<h1>Dashboard</h1>`, actively maintained, sanctioned in-file as *"the ONE sanctioned aggregate view"*, **not in `NAV_ITEMS`**. Its sole live door in the entire application is `home-experience-page.tsx:386-393`. | Blueprint § 5.1, § 15.2, § 15.3 Q1 (*a placeless surface cannot be one home*) · EXPLANG Principle G · HOME1 § 8.2–8.3 | Home's footer link is the thing keeping a placeless room reachable — so Home cannot resolve it, and cannot delete the link unilaterally either (that would strand a maintained page). Affects Area 9 and Area 13. | **HOME1 § 8.2 already routed this.** Restated here only because this audit is the first to note the dependency runs *through Home*: whatever is decided about `/dashboard`, Home's footer changes with it. Do not delete the link before the decision. |
| 6 | **The type floor and the touch floor are rules with no operand.** UIA § 8 and § 15 both invoke *"the caption floor"*; the scale (`index.css:378-406`) defines `.title-page`/`.title-section`/`.title-card`/`.text-table`/`.text-numeric` — **no caption or body rung exists**. § 9/§ 15 require *"a minimum comfortable touch target"* and **never give a number**. | UIA § 8, § 9, § 15 · `index.css:378-406` | Area 15 could not cite a THA floor for `text-[11px]` or for the 20px footer link. **Graded against what could be cited** — the arbitrary-value rule (§ 8) and measured WCAG contrast — and the silence recorded rather than filled. | Route to UI Architecture § 8/§ 15's owner. A floor invoked by two sections and defined by neither is *"not enforced; it is hoped for"* (`ARCH-VERIFY1`). |

### 7.1 Three stale claims in the canon, corrected with evidence

*(Not conflicts — factual corrections. Recorded because each is currently cited in the present tense, and an audit that repeated them would be wrong.)*

1. **`hover-elevate` is defined.** PX1's *"consumed by every control and defined nowhere"* was **true when written and closed by PX1-W1.1**. It is defined at `index.css:456-481`, backed by `--elevate-1`/`--elevate-2` (`:102-103`), and the register records it as row 24, ✅ governed, machine-enforced. *(Its missing `:focus-visible` pair is a **separate, live** defect — FAIL 5.)*
2. **`PageHeader.tsx` does not exist.** It was **deleted** in PX1-W4 (`7990f8a0`); the register records it retired by PX1-W4.7 with a permanent zero-occurrence gate. It is not a live unadopted successor. **But the pattern has a live instance the register does not list:** `PageContainer` (`workspace-header.tsx:512`) is exported with **zero consumers** beside `pageContainerClass`'s fifteen — authored, unadopted, and unregistered.
3. **NORTH1 § 8.1's backdrop citations are wrong in two places.** The opacity is at `orchard-backdrop.tsx:18`, not `:9` (`:9` is the `src`). And it asserts *"a **parallax** (`--orchard-parallax-strength: 10px`)"* — **the component is a static `<img>` with no parallax at all**; the token has zero consumers. **NORTH1's headline claim is otherwise correct and is verified by this audit:** one uniform photographic backdrop, mounted globally, behind every room.

---

## 8. GAPS THIS AUDIT COULD NOT ASSESS

*(Honest absence applies to audits too — Experience Principle 7. **An unstated gap reads as a PASS.**)*

| Area | What could not be assessed | Why | What would close it |
|---|---|---|---|
| **All — read first** | **The surface was never observed rendered.** Every state, size, and mode below was assessed by **reading the code path that produces it**, not by driving the application. | The audit was conducted by static analysis. Standard § 4.1.3 requires the surface *at three sizes and in every state*. | Drive `/home` at three sizes, in every state, on a throttled connection. **This would strengthen areas 12 and 19 most** (feeling cannot be fully read from source) and would change little in 1, 6, 15, 17, 18, which are mechanical and were **measured**. |
| 3 | **The orchard image's internal light direction** — whether `/orchard-bg.webp` carries one sun, upper-left. | The `.webp` was not opened; the code says only `objectFit: cover`. | Inspect the asset. *(Area 3's shadow half is trivially satisfied — Home ships `shadow-none` everywhere, which is itself because Blueprint § 18.3's depth vocabulary is unadmitted.)* |
| 15, 3, 12 | **Dark mode** — entirely. | **The mode does not ship.** Nothing in `client/src` sets the `dark` class (`ADOPTION_REGISTER.md:178`); Home's 8 `dark:` literals are unreachable. Blueprint § 18.4 records it as unexplored design work. | The § 18.4 open item. Contrast for the dark pairings **was computed** (all pass) and is recorded as pre-work, not as a verdict. |
| 16 | **Whether Home is fast enough.** | **No owner** — Standard § 6.2. There is no threshold to cite. | Governance must name an owner. **Not invented here.** |
| 16 | The **slow-connection** state, observed. | Not driven (gap 1). | Throttle and watch it as a person. |
| 14, 16 | The **Reminders error state**. | **Unreachable** — `:134` reads no `isError`; a 500 renders as silence, identical to the Notice Engine's first-class silence. | Recommendation 8 makes the state exist before it can be assessed. |
| 8 | Whether the Companion is **dismissible**, against a cited rule. | The FAB toggles the panel (`:1451`); nothing hides it. Area 8's PASS definition requires dismissible — but the *conduct* owner is EXP ARCH § 11, which this audit **read only in part**. | Read § 11 in full and grade dismissibility against it. **Not inferred** (Standard § 4.3). |
| 2 | Whether Home is *actually* at E3 as a viewer perceives it. | The composite is `bg-background/25` (`App.tsx:219`) over `opacity: 0.90` — computable, but "the orchard visible **as itself, generously**" is a perceptual judgement (gap 1). | Observe it. The **mechanism** finding (WARNING 1) does not depend on this and stands either way. |

---

## 9. OVERALL COMPLIANCE

| | |
|---|---|
| **Applicable areas** | **19** (no N/A — every area had an instance on this surface) |
| **PASS** | **3** — Areas 3, 5, 10 |
| **WARNING** | **9** — Areas 2, 4, 7, 9, 12, 13, 14, 16, 19 |
| **FAIL** | **7** — Areas 1, 6, 8, 11, 15, 17, 18 |
| **Score** | **3 / 19** |
| **Band** | **NON-COMPLIANT** |
| **Expires** | On material change to this surface, or on any amendment to an owning document (Standard § 5) |

**What the band means for this surface, in one sentence:** Home is a warm, honest, well-disclosed room that does not do the one thing a threshold exists to do — and seven of its nineteen areas break adopted law today, of which the three most valuable to fix are blocked by nothing at all.

> **This score never travels without its findings** (Standard § 5). The band is set by the **worst grade present**, never by the ratio: 7 FAILs is NON-COMPLIANT whatever the other twelve say. **No percentage. No ranking of people. No averaging.** Every FAIL here is **inherited** — the door, the cold card, the wallpaper, and the focus ring each predate anyone who would now be asked to fix them (Standard § 2.2).

### 9.1 What the first use of the instrument revealed about the instrument

*(Recorded for `EXPCOMP1`'s owner, since this is the standard's first application — the standard invited exactly this in § 7.4: *"If the standard cannot produce a useful verdict on Home, it will not produce one anywhere."*)*

- **It produced a useful verdict**, and its central bet paid: **WARNING carried the report.** Nine of nineteen, and the two most valuable insights in this audit are both WARNINGs — Home's E3 held hostage by a defect (W1), and every card warm only by translucency (W2). A binary gate says *"correct — continue"* to both.
- **The § 2.1 mechanism test did the work.** *"Would this still be true if the thing currently making it true were removed for an unrelated reason?"* applied cleanly to W1, W2, W3, W6 and W10 — and W6 revealed that **Home's best spatial property and its container defect are the same line of code**, which no per-area reading would have found.
- **Two grade bands did not cleanly fit.** Area 8's beat is **absent**; the FAIL list names six failures and not that one, while the PASS definition requires it. Graded FAIL on *rule broken as written*. Area 7's *mapped-but-unadopted-with-a-recorded-exemption* fits no band precisely either. **Recorded, not resolved** — the bands are the standard's, not this audit's.
- **§ 4.3's "do not infer a rule" bound three times** and is why § 7 conflicts 4 and 6 exist rather than three invented thresholds.
- **The evidence standard's weakest point in practice is § 4.1.3** — see § 8 gap 1. A static audit can *measure* more than a clicking one and *feel* almost nothing. The standard may want to say which areas are unassessable without observation. **Recorded as feedback; not written as a rule.**

---

## 10. DEFINITION OF DONE — for a **compliant Home**

*(The mission's deliverable 3. This is the bar the surface must clear, **not** the bar this audit must clear — that is § 11. Every line cites the owner it closes; none of it is new law.)*

```
□ ONE DOOR — exactly one primary action, nameable as a verb, resolved by HOME2 § 4's
  total resolver (4-tier ladder + unconditional floor), visually primary, and it is a
  DEPARTURE not an operation. Never zero, never two.        (EXP ARCH Principle 4, § 7)

□ THE TWO-SECOND GLANCE yields all THREE answers — orientation, state, AND the one
  action; prominence descends in the canonical order.              (UIA § 5; EXP ARCH § 9)

□ ZERO FABRICATION — no `?? 0`; every gap an honest absence; "today" is a claim the
  household could check, against a real calendar anchor.  (EXP ARCH Principle 7, § 12;
                                                            Core Principle 6; UIA § 14)

□ E3 BY CONSTRUCTION — Home's exposure is a governed token from the one source, not a
  wallpaper it shares with ten rooms that should not have it.   (EXPBLUE § 6.2 rule 1;
                                                                        § 18.1 first)

□ EVERY PLANE WARM BY CONSTRUCTION — `--card` warm in its own value; no opacity crutch;
  the EMPTY state is the WARMEST state.                (EXPLANG § 3A.4; OHDB § 4; UIA § 12)

□ ONE SIGN OF LIFE — the greeting in THA's hand, adopted within its § 12.2 ceiling
  (arrival-only, once a day), and the register's exemption closed.    (EXPBLUE § 12; § 12.2)

□ THE COMPANION ARRIVES A BEAT AFTER THE HOUSEHOLD — in this room as in every room.
                                                                        (EXPBLUE § 13)

□ THE SHELL AND THE COLUMN FROM THEIR OWNERS — no hand-rolled container; the column
  agrees with its own banner; and the rung preserves "compact counter — the view keeps
  its share".                     (UIA § 6, Principle 4; EXPBLUE § 5.1; § 18.2 resolved)

□ ZERO RAW VALUES — every colour, size, spacing and duration from a semantic name that
  is REACHABLE from the surface; no dead classes; no dead `dark:` literals. (UIA § 16)

□ THE FLOORS MEASURED AND MET — contrast on solid ground (no contingent panel); focus
  ring ≥ 3:1, paired with hover on the focusable element; type from the named scale;
  reflow not truncate at 200%; one `<h1>`.                    (EXP ARCH § 16; UIA § 15)

□ ONE BREAKPOINT TRUTH — the canonical density system consumed; no second boundary
  authored on the surface; touch comfortable at every density.            (UIA § 9)

□ EVERY STATE DESIGNED — populated, empty, loading, error, slow-connection, and the
  awkward edges; nothing pops in as the person watches.  (EXP ARCH § 17.1; EXPLANG P1;
                                                                             UIA § 12)

□ THE FEELING PRODUCED — all seven, at the palette's temperature; the care FELT and not
  merely inferable; the design disappears.            (EXPLANG § 3, § 3A, § 6, § 7;
                                                                        OHDB § 16.2)

□ RE-AUDITED against this standard by someone other than whoever built it, with the
  band set by the worst grade present.               (Standard § 4.3, § 5; this audit
                                                       named as superseded in the header)
```

### 10.1 Recommended implementation order

*(The mission's deliverable 4. **Order is not value** — value is § 6's table. This is sequence: what unblocks what, what costs least, and what must not be done first. **Nothing below is authorised by this audit** — the six gates bind every one of these changes regardless of any grade here.)*

| Step | Work | Why **here** |
|---|---|---|
| **1** | **Delete the false header comment** (`:13-15`) | A deletion. Zero risk, zero dependency. It currently tells every reader — and told this audit's first pass — that a live, governed, voiced system is dead. **Fix the record before working from it.** |
| **2** | **Stop the fabrication** — `?? 0` + the plant card's empty state | A live falsehood, told today, removed by one operator. Nothing depends on it; it depends on nothing. |
| **3** | **The accessibility floors** — `/70`, `text-[11px]`, focus ring, `truncate`, duplicate `<h1>` | Measured and unarguable. Mostly one-character. **Before** the door, because the door adds a focusable primary control to a surface whose focus ring is invisible — build the door *into* a room where focus works. |
| **4** | **Delete the dead code** — 8 `dark:` literals, 3 `h-4.5` classes | A deletion; shrinks FAIL 7 before anyone reasons about it. |
| **5** | **THE DOOR** — HOME2's resolver + the visual re-hierarchy | The highest-value change in the report, and fifth because 1–4 cost hours, block nothing, and make the room it lands in honest and navigable. It closes FAIL 1, Area 11, Area 13 and most of Area 19 **at once**. |
| **6** | **The Companion's beat** — one hook call | After the door: the beat is *manners on arrival*, and arrival is not finished being designed until step 5 lands. |
| **7** | **Reminders: `isLoading`/`isError`** | Small; completes the promise this file's header already makes. |
| **8** | **`--card` warm by construction** | Own change, product-wide blast radius, wants its own visual verification. Not before the door — do not change how the whole house looks and how Home behaves in one step. |
| **9** | **Route conflicts 1, 2, 3 and 6 to their owners** | **Governance, not code.** Steps 10–12 are unstartable until these return. Start this *early in wall-clock time* — it runs in parallel with 1–8 — and land it here. |
| **10** | **Raw values → realm tokens** *(after conflict 2)* | The tokens must be reachable before a surface can be told to speak them. |
| **11** | **Density + breakpoint** *(after conflict 3)* | The owner must hold one number before a surface can consume it. |
| **12** | **The container** *(after conflict 1 + § 18.2)* | **Do not do this early and do not do it naively** — `pageContainerClass(true)` doubles Home's column and destroys the mapped posture. This is the one step where the obvious fix is worse than the defect. |
| **13** | **Name the orchard's owner** *(Blueprint § 18.1)* → **exposure as a governed token** | Governance first. **Until it lands, do not touch the backdrop's opacity in either direction** — Home's E3 is currently hostage to that literal. |
| **14** | **The greeting in THA's hand** *(one Living Detail at a time)* | Last of the Home-local work: a room earns its sign of life after it works. |
| **15** | **The planner's calendar anchor** *(the platform gap)* | Largest, slowest, most valuable long-term — it is what finally makes "Today's Meals" a claim rather than a guess, and `TRANSLATION1` *Morning Rhythm* § 8 implementable. Sequenced last because it is a schema decision with its own owner, and steps 1–14 do not wait on it. |

> **The two sequencing rules worth stating plainly.** *(1)* **The first four steps are deletions and one-liners** — the standard's own observation that *"the first change is usually a deletion"* held exactly. *(2)* **Step 9 is not code and must start first.** Four of the last six steps are blocked on a governance answer, and the answer takes longer than the work.

---

## 11. DEFINITION OF DONE — for **this audit**

```
☑ The Experience Test answered for the surface, in one sentence each (§ 1.1) — and the
  Q3 divergence explained rather than used as a reason to stop (§ 1.2)
☑ Every governing Experience document READ — not remembered — with its state recorded (§ 2)
☑ All nineteen areas graded; no area removed; no twentieth added; no N/A claimed
☑ The mission's sixteen areas mapped onto the Standard's nineteen, none dropped (§ 4.1)
☑ Every WARNING and FAIL carries the rule (cited to its OWNER), the evidence (file:line
  or state+size), the failure as a person would experience it, and — for a WARNING — the
  mechanism by which it is currently true (Standard § 4.2)
☑ The mission's extra fields carried on every finding: governing document reference,
  current behaviour, why it conflicts, recommended implementation, priority, complexity
☑ Every state assessed, not only the good day — populated, empty, loading, error,
  slow-connection, and the awkward edges — BY CODE PATH, with the observation gap
  stated first and prominently rather than buried (§ 8, gap 1)
☑ Every size and mode assessed, or listed in § 8 as a gap (dark mode: does not ship)
☑ The mechanical areas MEASURED, not judged — contrast computed with working shown
  (15), raw values counted and enumerated (18), exposure grepped to zero (2)
☑ Architectural conflicts recorded and ROUTED to their owners — six of them, none
  resolved here, none picked between, none filled (§ 7)
☑ Three stale claims in the canon corrected with evidence rather than repeated (§ 7.1)
☑ Gaps recorded rather than passed over (§ 8)
☑ Recommendations separated into deliverable-now vs blocked-by-the-governance-path, and
  none of them jumps it (§ 6); the one change that must NOT be started is named
☑ No new principle created — nineteen areas, nineteen owners, zero rules. Where the
  canon is silent (performance thresholds, the caption floor, the touch floor), the
  silence is a GAP routed to an owner, never a value invented here
☑ No screen redesigned, no UI implemented, no mock-up produced, no architecture
  modified, no governing document touched — verified: this session wrote two files,
  both new, neither under docs/architecture/
☑ The band set by the worst grade present, not by the ratio; no percentage stated
☑ Assessed by someone other than the sole author of the surface (Standard § 4.3)
☑ Filed at docs/investigations/ux/HOME_COMPLIANCE_AUDIT_20260716.md, and never edited
  afterward — an audit is history; the next audit supersedes it
☑ The previous audit of this surface named in the header as superseded — none; first
```

---

*An audit — point-in-time analysis of one surface against the THA Experience Compliance Standard. It records verdicts against rules owned elsewhere; it creates no rule, sets no value, adds no gate, designs nothing, and implements nothing. It is diagnostic and never binding on a change: the six governance gates bind every change regardless of any grade here (Standard § 1.3). Subordinate to the Experience Architecture, which prevails in any conflict.*
*Rollback: this document is new and uncommitted — to revert entirely, delete this file. Rollback tag for the `EXPCOMP2` workstream: `rollback/EXPCOMP2-home-experience-compliance-audit-20260716` → `7d1dd2ce80e9b6e23f73212d70886ddaaf79cda2` (the tag protects committed state only; this untracked file is not covered by it).*
