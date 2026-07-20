# UX3 — Complete Experience Convergence

**Session** `UX3_Complete_Experience_Convergence`
**Rollback** `rollback/UX3-complete-experience-convergence-20260720` → `ef59ea3fba3172818a1f106109a46a8dd0d0a100`
**Branch** `int1-intelligence-platform`
**Date** 2026-07-20

An Experience Convergence Programme. It completes the emotional, visual and spatial
experience against the Orchard North Star, and changes no architecture, route,
permission, canonical data model or AI architecture.

---

## 1. The owner decision this run was waiting on

UX2 § 6.2 escalated one decision and stopped on it: **is the Companion the sole
voice of coaching, and if so what replaces the eight surfaces that duplicate it?**
It was the right place to stop — removing them changes *what each room offers*, not
how it looks, and a visual brief may not make that change.

The ruling received, verbatim:

> Remove: Ambient Intelligence panels · coaching eyebrows · first visit tips ·
> duplicate coaching surfaces · duplicate recommendation panels · duplicate
> reminder cards.
> Keep: contextual room content · room-specific data · workflow-specific controls.
> Move every piece of coaching, interpretation, recommendation and encouragement
> into Companion.

That line — *remove the advice, keep the data and the controls* — is what made the
convergence executable, because it is the cut that could actually be made surface by
surface. Everything in § 3 follows from it.

---

## 2. The finding that changed the shape of the work

**The Notice Engine already was the canonical owner of proactive coaching. It simply
had no mouth.**

It applies the Silence Rules server-side (at most two notices per moment, ranked by
attention, deduped) and the Behaviour Engine voices each sentence in the household's
chosen personality. All of that already existed and already worked. Its only consumer
was `/home`, under a heading reading **"From your Companion"**.

So the product had two systems saying overlapping things:

| | The Notice Engine | The ambient surfaces |
|---|---|---|
| Attention budget | Yes — the Silence Rules | **None** |
| Voiced in the household's personality | Yes | No |
| Where it spoke | One page | Eight |
| Who it claimed to be | "From your Companion" | the room |

UX2 had already named half of this: *"a boxed panel that lists notices is a PAGE
speaking in the Companion's name."* It dissolved the box, which made the
impersonation quieter without ending it.

**This reframes the convergence as a relocation rather than a deletion.** The
Companion does not gain a new capability here; it gains the one it was always
supposed to have, and eight ungoverned copies stop competing with it.

---

## 3. What changed

### 3.1 The Companion becomes the mouth of the Notice Engine

`useCompanionNotices` moved from `home-experience-page.tsx` into `FloatingAssistant.tsx`.
React Query dedupes on the key, so **Home costs no additional fetch**; the other eight
rooms gain one lightweight query per session, which is the price of the Companion
being genuinely present in them rather than only drawn there.

**`aware` is live for the first time.** UX2 defined it fully in CSS and deliberately
never set it, because it needed exactly this read and COMP1 § 11 scopes that as a
behaviour change a visual refinement may not make silently. It is made here, by owner
ruling, not silently.

It is the **lowest-priority** state, and that ordering is the ethic of the brief:
awareness never interrupts `speaking` or `listening`. It carries no badge, no count,
no colour and no motion beyond the breath the emblem already had — a light on in the
next room, not a hand on your shoulder. If the household never looks, nothing was
lost and nothing was demanded.

Opening the Companion renders the notices verbatim. This surface re-sorts, re-slices,
re-words and pads **nothing** — doing any of those would be a second attention budget,
which the Notice Engine Architecture § 9 forbids.

### 3.2 The eight surfaces, retired

**Deleted (8 files):** `AmbientIntelligence` · `FoodOpportunityCard` · `OpportunityCard`
("You could") · `SimplyBetterChoiceCard` ("Simply better") · `CelebrationCard` ·
`HomeIntelligenceCompanion` · `meal-detail/SimplyBetterChoicesPanel` · `first-visit-hint`.

**Split, not deleted** — these each held room data *and* advice, and only the advice went:

| Panel | Removed | Kept |
|---|---|---|
| `PlannerIntelligenceStrip` | the celebration/opportunity/seasonal/insight grid | the week's plant count + variety legend |
| `PantryIntelligencePanel` | "You could", "Simply better" | seasonal · meal connections · household history · connected foods · discover next |
| `ShoppingIntelligencePanel` | "Simply better" | seasonal · meal support · household history · connected foods |
| `CookbookMealIntelligenceStrip` | the uplift advice line | Supports · Introduces · seasonal note · "Cooked N times" |
| `HouseholdNutritionCentre` | the simply-better list | the whole nutrition picture |
| `LearningSignalsPanel` | its **4 room mounts** | its **Profile mount** |

**`LearningSignalsPanel`'s Profile mount was deliberately kept**, and the reason is
worth recording: it is the only door through which a Pattern becomes Confirmed
Understanding. Removing it would have deleted a capability under cover of removing a
duplicate. The four room copies were duplicates; the fifth was the feature.

**`MealUpliftPanel`, `PlannerAssistantPanel`, `SmartReviewPanelContent` and
`PantryKnowledgeHub` were kept** despite coaching-ish framing, because they mutate
state or browse a library — they are workflow controls and reference content, which
the ruling explicitly protects.

**One capability was checked before it could be lost.** `FoodOpportunityCard`'s
"Why this?" was the client's only entry point to `opportunity-delivery:explain` via
`useAskCompanion`. It is named here rather than discovered later — see § 7.1.

### 3.3 The header stops being browser chrome

UX2 made the header one material in every room. What it left standing was the **1px
rule beneath it** — and a full-width hairline across the top of every screen is the
most recognisable piece of browser chrome there is.

It is retired for a **warm shadow** describing a real distance, in a hue drawn from the
room's warm foreground rather than from black (UIA § 4). The **ruled divider** beside
the brand mark went with it; air separates them now, which is what separates things in
this house.

This also *recovers* the room's light-line. While a hard border sat on the same edge,
the faint coloured light competed with a rule that meant nothing. It is now the only
mark at the sill — so the one thing that glows there is the one thing carrying meaning.

### 3.4 The orchard's five bypasses, all closed

The adoption register's sharpest self-criticism was its own `orchard-environment` row:
*"its `adoptionFloor` says 'No other surface may mount either export' — and it is TRUE,
and it is not enough."* Five surfaces mounted `/orchard-bg.webp` straight from CSS,
bypassing the owner, so the machine check passed while the concern was violated.

Two of the five went when their pages were deleted. **UX3 closed the remaining three,
against the exposure scale rather than by deleting the picture and hoping:**

- **`ui/dialog.tsx` → E0.** The orchard sat behind **every dialog in the product**,
  with working text on top of it — breaking both § 6.2 (overlays are E0) and § 6.1
  ("the orchard never carries text"). The dialog now uses the warm canvas, and
  actually floats: its `shadow-none` became real elevation.
- **`shopping-workspace-page.tsx` → E1.** It mounted the orchard and then hid it under
  an 80%-white sheet — the product was *loading a landscape in order to conceal it*.
  Shopping is a working room: bright because the orchard is outside, not looking at it.
  Its two black shadows became one warm one.
- **`onboarding-page.tsx` → ground.** `OrchardShell` already mounts the canonical
  orchard behind this page; the card mounted it a *second* time and set the onboarding
  questions on top. The view stays behind; the questions sit on the counter.

`grep -rn "orchard-bg.webp" client/src` now returns the owner file and comments only.

### 3.5 The house scales like architecture

`pageContainerClass` ended `3xl:max-w-[1920px]`, so on a large monitor the content
column grew to 1920px and on an ultrawide it stayed there. UIA § 6 says the opposite in
terms: *"Content never stretches to fill whatever width exists; the column serves
reading, not the viewport."* A 1920px measure does not serve reading by any standard.

**That rung is retired.** The column settles at a reading width and the surplus becomes
margin — measured at 192px a side at 1920, 512px a side at 2560.

**A fourth density, `spacious`,** joins the ladder at ≥1920 (reusing Tailwind's existing
`3xl`, not a new number — UIA § 9's one breakpoint truth). UIA § 9 fixes density as *the*
responsive model and says its vocabulary "may evolve; its singularity may not", so a
fourth rung is admitted evolution rather than a fork.

What it changes, and what it deliberately does not:

```
padding  ↑    more air around the content
stack    ↑    more room between things
title    =    IDENTICAL to expanded
text     =    IDENTICAL to expanded
```

A 32-inch monitor does not mean the household's eyes moved further away. Growing the
type would be the room *simply becoming bigger*. What a large room earns is breathing
space: the same well-proportioned furniture, with more air around it.

### 3.6 The Companion is furniture, not glass

**Found by opening the picture, exactly as ODL2 § 6.3 requires.** The panel was
`bg-background/97 backdrop-blur-md`; opened on Home it smeared the orchard straight
through, so the Companion's own name sat on a blurred photograph of a hillside.

Three rules said no and the screenshot said it louder: overlays are E0, the orchard
never carries text, and UX_NAV1 already retired `backdrop-blur` from the nav shelf
because frosted glass is a technology signature (Blueprint § 1.5). The friend at the
counter is a presence in the room, not a pane of glass held in front of the view.

---

## 4. Verification

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | **88 errors — baseline exactly, 0 introduced, 0 in `client/`** |
| `npm run build` | **clean** |
| `scripts/ux3-verify-experience-convergence.ts` | **21 passed, 0 failed** (new) |
| `scripts/ux2-verify-experience-language.ts` | **28 passed, 0 failed** (one assertion amended — below) |
| `test:comm2-orchard-experience` | **80 / 80** |
| `test:home2-home-primary-action` | **47 / 47** |
| `test:tier4-shell-recovery-activation` | **all passed** |
| `npm run adoption:check` | **99 passed · 0 notices · 9 failed** (from 82 · 1 · 9) |
| `.engineering/scripts/repo-structure-verify.sh` | **2 FAIL — pre-existing, confirmed at the rollback tag** |

**Pre-existing failures were confirmed at HEAD before this work**, by running the gate
in a clean detached worktree at the rollback tag: **82 passed · 1 notice · 9 failed**,
matching UX2's reported baseline exactly. This report does not claim they pass.

The aggregate `npm run test` still halts at suite 103 of 160 (`test:benchmark-conversation-isolation`,
pre-existing since at least `993e1bc8`, recorded by NAV1 · UX_NAV1 · COMP4 · UX2 and still
unowned as **BENCHINT3**). Suites were run directly. **This report does not claim the
aggregate passed.**

### 4.1 One inherited assertion was amended, and it is not a convenience

`ux2-verify-experience-language.ts` asserted `state === "idle"` — *"at rest it is idle:
presence, never urgency"*. It failed, reporting `got aware`.

It was correct on the day it was written, for a reason that stopped being true: UX2
defined `aware` and never set it, so "at rest" could only mean idle. The assertion's
real subject was never the string — it was COMP1 § 7, *presence not urgency*, and both
resting states satisfy that. It now accepts `idle` **or** `aware` and excludes
`speaking` and `listening` by name.

Recorded here rather than quietly turned green, because a test edited to pass is the
one thing this repository's reporting culture refuses.

### 4.2 An honest discrepancy in the assertion count

UX2 reported **29 passed**; the same script now runs **28**. One assertion no longer
fires. Section 2 checks the wall relief against each of Home's content blocks, and
Home has one fewer block since `AmbientIntelligence` was removed — so the loop has one
fewer iteration. Nothing was disabled. It is stated because a falling number that
nobody explains is how a real regression hides.

### 4.3 The adoption register

Mandatory under ADOPTION REGISTER COMPLIANCE. **82 passed · 1 notice · 9 failed →
99 passed · 0 notices · 9 failed**, and the nine remaining failures were diffed
line-for-line against the baseline captured at the rollback tag: **identical — none
introduced, none fixed.**

The eight deleted components are registered as **retired predecessors**, so the gate
now keeps them dead forever — a ninth ambient coaching surface cannot quietly grow back.

**Five adoption floors were lowered, each with a recorded reason**, because they fell
*as a direct result of the duplication being removed*: `panel-shell` (8→5),
`semantic-tint` (8→7), `density-ladder` (4→3), `time-of-day-greeting` (4→3), and
`household-learning-presentation` (4→1). The register's rule is that you fix the code
or record the decision with a reason — and the wrong fix here was available and
tempting: re-adding a consumer to satisfy a number would have rebuilt exactly what the
owner ruled out.

`household-learning-presentation`'s drop to **1** is the one worth reading twice: that
one remaining consumer is the Profile mount, and it is the capability rather than a
copy of one.

⚠️ **One falling number is not progress and is flagged rather than banked.** The
`dark:` measure fell **693 → 679**. Those 14 utilities were genuinely deleted with the
components — unlike UX_NAV1's fall, which was a relocation — but the underlying debt is
untouched: dark mode remains authored-but-unadopted platform-wide, with nothing setting
the `dark` class, no provider, no toggle and no media read. This run neither fixed that
nor added to it.

`button-primitive`'s rival ceiling also tightened 454 → 449 via the sanctioned
`adoption:record` path.

---

## 5. Screenshots

`docs/ui-audit/ux3-experience-convergence/{before,after}/` — **40 captures each**:
seven rooms plus the opened Companion, across five viewports.

The viewport spread is the point rather than thoroughness for its own sake: **1280 ·
1440 · 1920 · 2560 · 390**. The scaling claim cannot be shown at one width, and the
`before` set is what makes "the room gained air instead of stretching" checkable rather
than asserted.

The `before` set was captured from a **clean detached worktree at the rollback tag**,
served on a separate port, so nothing was risked to produce it.

Clearest single comparisons:

- **`planner-1440`** — the first-visit tip banner, the ruled divider and the hard header
  rule all go; the room gains roughly 100px of vertical air.
- **`companion-open-1440`** — the Companion speaking the Notice Engine's sentences for
  the first time, on an opaque surface.
- **`cookbook-2560`** — the content capped at a reading width with 512px of margin each
  side, where it previously stretched to 1920px.

---

## 6. Scope honoured

No architecture, route, permission, canonical data model or AI architecture change.
**`server/` is byte-untouched.** No schema, no migration, no endpoint, no capability.
The Decision Engine, the Attention model, the Notice Engine, the Silence Rules and the
Behaviour Engine's voicing are all unchanged — only which surface renders their output.
`NAV_ITEMS` and every route are unchanged.

---

## 7. Remaining architectural experience decisions

**1. The `opportunity-delivery:explain` entry point.** `FoodOpportunityCard`'s "Why
this?" was the client's only route into that verb via `useAskCompanion`. The card is
retired, so the verb is now reachable by no surface. The capability, its handler and its
registration are untouched and intact — but a household can no longer reach it. Either
the Companion gains an affordance for it (it already owns the conversation that would
carry it), or the verb should be retired deliberately. **It must not be left
unreachable-but-registered**, which is the authored-but-unadopted state the register
exists to make impossible to hide.

**2. Home's room hue.** Home is still hue 132 — the retired scaffold green, and now the
only 132 left. Moving it to the orchard's 74 collides with the Analyser, already at 74.
The options are unchanged from UX2 § 6.1, plus one this run surfaced: Home takes **no**
room hue at all, on the reading that the Blueprint calls it *"the threshold and the
heart"* — the hall, not a room among rooms. That option is not free either: realm hue
also lights the Home tab in the bottom nav, so the hall would need another way to say
where you are. **Not taken here** — it is a wayfinding and identity decision, and this
run had no ruling on it.

**3. The four E2 rooms have no orchard at all.** Cookbook, Pantry, Nutrition and Diary
are specified at **E2 — "the window"** in the Blueprint's own map, and render no orchard
whatsoever: `--orchard-exposure-e2` exists as a token with **zero consumers**, and
`orchard-page.tsx` writes a `data-orchard-exposure` attribute that **nothing styles**.
So the orchard is present in two places (arrival and Home) out of nine rooms, against a
brief that asks it to *always feel present*. This is the largest single gap remaining
against the North Star. It was **not built blind**: shipping a new full-image window into
four rooms without design review is precisely how UX2's two invisible defects happened,
and E2's "framed by composition, never by a drawn frame" is a composition decision, not a
token value. It needs a design pass with the owner, then implementation against it.

**4. Home's composition below the sill is left-weighted, and above ~1920 the right
half of the room reads as bare rather than composed.** Visible in
`after/home-1920.png` and `after/home-2560.png`: the greeting, the date and "Today at
a glance" all sit in the left third, and the plaster to their right holds only the wall
relief, which is tone-on-tone and near-invisible by design. The brief names this
failure mode directly — *"avoid layouts that appear stretched, compressed, empty or
crowded"* — and the container cap in § 3.5 makes it more legible rather than causing it.
**Not taken here**, because Home's composition is a *locked* room
(`HOME_ARRIVAL_PRODUCTION_LOCK`, NORTH4 Concept B) and recomposing it on a screenshot,
against a lock, is precisely the drift the lock exists to prevent. It needs the owner
and a design pass, and it is the most visible remaining gap between the house and the
brief's "every additional pixel should improve the feeling of the home".

**5. The 390px bottom navigation still overflows** (COMM2 § 11.4). Nine rooms do not fit
one bar at an accessible touch target: "Orchard" clips, visible in `after/pantry-mobile.png`.
Pre-existing, untouched, and now cited unresolved by COMM2, NAV1, UX_NAV1, UX2 and this
run — five workstreams deep. It is the most-deferred decision in the corpus.

**6. The raw-palette greens are still a second green, and the brief asked for them.**
*"One green. One visual language. Remove remaining legacy colour decisions."* UX2
converted the **platform-identity** greens — the ones competing with `--primary` — and
scoped the rest out with a stated reason: ~1,600 raw Tailwind palette classes across 73
files, in three idioms (`emerald-*`, `green-*`, `teal-*`), most of them semantic scales
(health ratings, safety, per-category maps) whose conversion carries real regression
risk. That reasoning still holds and this run did not overturn it. But the consequence
is visible: `after/nutrition-1440.png` shows a saturated `green-500`-class progress bar
and numeral sitting beside the orchard's own muted 74, and the brighter one wins the
eye. **It is a scoped programme, not a refinement**, and it needs an owner's go-ahead
and its own rollback — but it is the last thing standing between the product and the
brief's "one green".

**7. BENCHINT3 — the red suite — is still unowned.** `test:benchmark-conversation-isolation`
halts the aggregate at suite 103 of 160, so ~57 suites have not run on this branch for
days. Four prior workstreams recorded it and correctly declined to fix it out of scope;
NAV1 called it "the more serious finding in this report". It has now survived five.
