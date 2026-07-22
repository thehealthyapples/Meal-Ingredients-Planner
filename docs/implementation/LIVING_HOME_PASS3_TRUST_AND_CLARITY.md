# Living Home Experience Pass 3 — Trust & Clarity (`LHXP3`)

| Field | Value |
|---|---|
| **Programme ID** | `LHXP3` (Living Home Experience Pass 3) |
| **Date** | 2026-07-22 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback ID** | `rollback/LIVING-HOME-PASS3-20260722` → `e4182317` (annotated tag, object `977575ba`, created before any change) |
| **Kind** | Copy / label / provenance only — trust & clarity across the household rooms. **No behaviour, no decoration, no number blind-edited.** |
| **Governing parents** | `HOME_OWNER_ARCHITECTURE.md` (HOMEOWNER1, esp. Principle 8 — *every aesthetic decision should support trust*) · `GOVERNING_EXPERIENCE_ARCHITECTURE.md` (GEA8/GEA13 no grading · GEA17 honest absence) · `ARCHITECTURE_PRINCIPLES.md` (**Core Principle 6** — honest gaps over fabricated information; a value is shown with its source or not shown as certain) · `UI_CANONICAL_EXPERIENCE_OWNERSHIP.md` (UIOWN1 — the UI owns no fact; where the owner has nothing, honest absence) · `LIVING_HOME_COMPLETION_PROGRAMME.md` (LHC1 — Maturity Model, roadmap item **D**) · `LIVING_HOME_PASS1_COMPOSITION_AND_BALANCE.md` (LHXP1) · `LIVING_HOME_PASS2_HOSPITALITY_AND_WARMTH.md` (LHXP2 — whose § Recommendations scoped this pass) |
| **Predecessor passes** | Pass 1 (`LHXP1`) *balanced* the rooms; Pass 2 (`LHXP2`) *warmed* them. This pass makes them **trustworthy and legible** — because a warm, well-composed room that shows a number the household cannot trust is still not a home. |

---

## 0 · What this pass is, and what it is not

**Objective.** Every room should answer three questions immediately, on sight:

1. **What am I looking at?** — the label names the thing.
2. **Why should I trust it?** — a value's *provenance* is legible: known, calculated, estimated, or honestly absent.
3. **What happens next?** — the action is clear, and no status is ambiguous.

It is a **copy / label / provenance pass only.** Every change is a user-visible **string, unit, or provenance caption** on a consumer surface, or the removal of a *fabricated* label. It ships **no** component, layout token, capability, prompt, behaviour, route, schema, or business logic, and it **amends no governing document**.

**The one discipline this pass held above all others: never blind-edit a number.** A number changed without understanding its source is how trust is *spent*, not saved (LHC1 Trust Check; carried by LHXP1/LHXP2). Every count flagged by the review was **traced to its source in code first**. Where the source proved a value was a *bug*, or where reconciling two figures needs the running product, the number was **left untouched and the finding staged** — not papered over. Where the source proved a value was **honest but its provenance was hidden**, the provenance was surfaced. Where the source proved a label **asserted certainty the data did not hold**, the fabrication was removed.

### The four levels of certainty this pass makes legible

Task item 9 requires that where values are estimated, the room distinguishes **known · calculated · estimated · unavailable**, and never implies certainty where none exists. Applied:

| Certainty | Meaning | This pass |
|---|---|---|
| **Known** | The household entered it | BMI category, calorie *setting*, declared activity — already shown plainly as "Your setting" (HealthSnapshot, PRESENCE1); left as-is. |
| **Calculated** | Summed/derived from known facts, exactly | The Planner day total (summed meal calories) — now carries its **unit** so it reads as energy, not a verdict. |
| **Estimated** | Approximated (e.g. matched from names) | The Nutrition plant count — its **"approximate, from ingredient names"** provenance now travels *with the number*, not only in a page-foot footnote. |
| **Unavailable** | The owner has nothing | Unset preferences → "Add yours" (LHXP2); an unset activity no longer **fabricates** "Moderately Active". |

---

## 1 · Changes shipped, room by room

Four edits, each on a **consumer**, each a copy/label/provenance change, each decidable by *reading the code that produces the value* — no running product required, no logic touched.

| # | Room | File · line | Change | Why it is a trust win |
|---|---|---|---|---|
| 1 | **Nutrition** | `PlantDiversityReport.tsx` (`ThirtyPlantsTracker`) | Added a quiet caption **"Approximate — counted from ingredient names"** directly beneath the prominent `text-3xl` plant count. | The count is **proven by code** to be an approximation (`plantDiversityGroup()` resolves each ingredient *name* to a diversity group; unmatched names simply read as "not a plant"). The provenance already existed — but only as a `/40`-opacity footnote at the page foot, far from the hero number. The estimate now declares itself where it is read. **Distinguishes *estimated* from *known* at the point of display** (Core Principle 6; Pass-2 rec #2). |
| 2 | **Planner** | `weekly-planner-page.tsx` (weekly summary strip) | Added the unit **"kcal"** after each per-day summary figure (previously a bare number beside a flame icon). | LHXP1 *confirmed* this figure is plain summed meal calories — not a grade (GEA13). But a bare "62" beside a flame, in a cell headed "Summary", **can be misread as a score** — and the meal-detail dialog already labels the identical number "kcal". Naming the unit resolves the internal inconsistency and makes it read as **the food's energy, not a verdict** (Pass-2 rec #3; GEA13). |
| 3 | **Household / Profile** | `profile-page.tsx` (`ProfileSummary` chips) | The activity chip **no longer asserts "Moderately Active" for a household that set no activity level.** Only the three real values (`high`/`low`/`moderate`) map to a chip; unset → `null`, dropped by the existing Boolean filter. | This is the strongest genuine trust *defect* found: the schema defaults `activityLevel` to `"moderate"`, and this chip's catch-all `else → "Moderately Active"` stated an activity level as fact for households who never gave one. HealthSnapshot (**same file, PRESENCE1**) had *already* removed exactly this fabrication and shows honest absence; this chip was the one place still doing it. Now the two agree. **Never imply certainty where certainty does not exist** (GEA17; Core Principle 6). |
| 4 | **Cookbook** | `meals-page.tsx` (Hide High-UPF filter) | Added a hover title **"UPF means ultra-processed food"** to the bare-acronym filter button. | "UPF" is *explained* in Profile (the `UPFInfoModal`) but shown **raw** in the Cookbook — an unexplained abbreviation (task item 10). The gloss makes the same term legible in both rooms, changing no label text and no layout. |

**Four rooms carry a trust improvement.** Each answers one of the three questions more honestly than before: Nutrition answers *why should I trust this number* (it's an estimate, and says so); Planner answers *what am I looking at* (energy in kcal, not a grade); Household stops answering a question the household never asked; Cookbook expands a word the household may not know.

---

## 2 · What was deliberately **staged**, and why — the honest-number discipline

Task item 8 names several surfaces to verify. Each was traced to source. The ones **not** shipped are staged with a precise reason — none was swept, and no number was blind-edited.

- **Shopping count consistency ("12 items" vs ~3 shown)** — LHC1 item **D**; Pass-2 rec #1, which flagged it as *"the single highest-value Trust item"* needing *"an authenticated session."* **Traced in full:** it is **not a miscount.** The basket-total row reads `{items.length}` — the *whole* list (checked + every source) — while the list above renders `sortedFilteredItems` (source-filtered, unchecked-only). They are **two legitimately-scoped measures sharing a screen with no label distinguishing them.** The existing "incl. estimates" provenance on the *price* is exemplary; the *count* and *total* lack the matching "this is the whole basket, not the filtered view" qualifier. **Why staged, not shipped:** which state produced the reviewer's "3 shown" (a source filter active, vs checked items collapsed) determines the right wording, and confirming that needs the running list at the review's widths. Adding a qualifier blind risks a sentence that is wrong in the state I cannot see. **Recommended fix (for the live session):** label the whole-basket measures ("Whole basket · N items") distinctly from the filtered header status ("N to buy"), so the two numbers read as two answers, not a contradiction.
- **Nutrition count consistency ("17 vs 18")** — LHC1 item **D**. **Traced in full:** *within the Nutrition room* the two plant figures share **one** `plantCount` variable and are structurally incapable of disagreeing. A real "17 vs 18" is a **cross-surface** skew (the room computes the count **client-side** from the active week in `localStorage`; the Planner strip renders the **server-side** `weeklyProgress.plantCount`). The *rule* is identical on both sides — the divergence, if any, is **data/window skew** (different active week, cache staleness, or the server's `anchored` gate returning null while the client still computes). **Why staged:** reconciling two computation *sites* is a data-state question only the running product answers; the client copy cannot prove which surface is "right." (The provenance win #1 above *does* make both surfaces more honest in the meantime.)
- **Companion "Apple" labelled twice · suggestions as plain text** — Pass-2 rec #5; LHC1 item **I** (Companion 2/3). Confirmed by reading: on the floating surface the title "Apple" and the `PersonaLabel` badge "Apple" stack; enrichment "Suggestions" render as non-tappable prose. **Why staged:** the Companion is the surface the prior passes deliberately left untouched (its words are owned — registry/INT21/Behaviour Engine), the de-dup would leave `PersonaLabel`'s only floating render dead (the LHXP1 recorded reason), and confirming the header still reads well needs the running drawer. Item 12 keeps Companion behaviour off-limits; these are **Pass 4 — Companion Presence** work (below).
- **Cross-room terminology** — "Cookbook / meal / recipe" (the room is *Cookbook*, the data is *meal*, ~243 UI strings say *recipe*, while Planner/Home say *meals*); "basket / list / shop" for the Shopping items. **Why staged:** these are large, judged copy decisions (which noun is canonical, whether *recipe* vs *meal* is a deliberate distinction) — exactly the kind of single-judged-pass HOSP1 and LHXP2 deferred rather than blind-swap across hundreds of call-sites.
- **Diary "estimated savings" qualifier** — the week figure reads "£X likely saved" (already softened) while the month says "estimated saved"; a minor consistency nit on a savings computation not fully traced here. Staged as low-risk copy rather than touch a £-figure surface without full understanding.

---

## 3 · Reading against the Living Home Maturity Model

LHC1's **Level 3 — Hospitable** requires *calm · balanced · warm · inviting · comfortable*. Trust is the floor beneath all five: a household cannot be *comfortable* in a room whose numbers it cannot trust. This pass strengthens that floor.

| Room | Trust dimension moved | How |
|---|---|---|
| Nutrition | **Trustworthy · comfortable** (was: a prominent number with hidden provenance) | the estimate now declares itself at the number |
| Planner | **Legible · calm** (was: a bare figure readable as a grade) | named as energy (kcal), not a verdict |
| Household / Profile | **Honest** (was: a fabricated activity assertion) | asserts nothing the household did not give |
| Cookbook | **Legible** (was: an unexplained acronym) | "UPF" glossed where it is shown |

Levels 1–2 are untouched (no identity, ownership, or workflow changed). Level 4 (Environmental Dressing) remains gated and untouched.

---

## 4 · The forbidden list — confirmed untouched (task item 12)

Not one byte of: **Business logic · Canonical ownership · Environmental Dressing · Companion capabilities · Navigation · APIs · Schemas · Permissions · the Intelligence Platform.** No server or shared-schema file was touched. Every change is a string, a unit label, a provenance caption, or the removal of a fabricated catch-all — each on a **consumer**. The Companion surface was left untouched (its words are owned); the plant-diversity *rule*, the calorie *sum*, and the activity *fact* were all read, never re-owned.

---

## Architecture Compliance

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================
☑ One canonical identity — no entity touched.
☑ One owner per fact — no fact re-owned. The plant count stays the diversity
  rule's (Domains 4/22); the calorie total stays the meals' nutrition (Domain 1
  via the bulk endpoint); the activity fact stays Domain 27/16's — the UI only
  changed how each is LABELLED, and stopped fabricating one it does not own
  (GEA17 / UIOWN1).
☑ No duplicate entities / ownership / state — nothing created; no store, no
  derived fact, no cached number.
☑ Extends existing architecture — surfaces provenance the code already computed;
  mirrors HealthSnapshot's own honest-absence policy for the Profile chip;
  invents no pattern.
☑ Progressive enrichment — additive labels; every change reversible by reverting
  one string / one ternary branch.
☑ Knowledge domain compliance — no knowledge domain touched; Product Registry
  impact nil (a unit label and a provenance caption are not registry facts).
☑ Honest gaps over fabricated information — the pass's whole subject: an estimate
  now says it is one; a fabricated activity default is removed.
☑ No permanent synchronisation bridge — none.
☑ Evolution over replacement — nothing retired.

Experience Constitution Check (before design):
  hospitality — a home that is honest about its numbers is more welcoming, not
                less (GEA1); trust is a form of care.
  outcome     — reduced felt doubt; a household knows what each figure is and
                whether to trust it.
  weight      — lighter: a fabricated claim removed; two numbers made legible.
  voice       — rooms still only REPORT; the provenance caption is a fact about
                the number, not counsel; no room gained the Companion's voice
                (GEA8/21).
  ownership   — nothing re-owned; the household still owns every decision (GEA23),
                and no longer has one asserted for it.
  restraint   — labels added where a value was ambiguous; a fabrication removed;
                no ornament applied (GEA15).
  layer       — Experience Implementation only; originates no law (GEA20).
```

## AI Architecture Compliance

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
✓ Uses the canonical Intelligence Platform — only by reference; nothing reached.
✓ Capability Registry / Intent Engine — untouched; no capability, intent, or
  prompt added or changed.
✓ Does not create another assistant — the Companion is left UNTOUCHED; its
  double-"Apple" label and its non-tappable "Suggestion" are STAGED for Pass 4,
  precisely because its surface and words are owned (registry / INT21 / Behaviour
  Engine) and confirming a change needs the running drawer.
✓ Reuses existing business services — none touched; the plant-diversity rule and
  the nutrition sum are read through their existing consumers, never re-derived.
✓ Companion ownership unchanged — no interpretation, coaching, or observation
  added to any room. The Nutrition provenance caption reports a fact about the
  count (that it is name-matched); it does not interpret the household (GEA22).
✓ Honest gaps over fabricated knowledge — the pass's whole subject; nothing
  guessed is shown as certain, and one thing that was is now honest.
```

## Definition of Done

- **Success looks like:** this document exists at `docs/implementation/LIVING_HOME_PASS3_TRUST_AND_CLARITY.md`; four rooms read more trustworthy and legible; the Nutrition estimate declares itself, the Planner figure names its unit, the Profile chip stops fabricating an activity, the Cookbook acronym is glossed; every flagged count was traced to source and either made-legible or staged with a reason (never blind-edited); typecheck / build / adoption baseline-identical; rollback reported; remaining Level-3 gaps staged; Pass 4 recommended.
- **What must not break:** nothing runtime — no data, workflow, route, identity, ownership, or Companion behaviour changes; the forbidden list (§4) is byte-untouched.
- **Manual test steps:** `git diff --stat <rollback-tag>..HEAD` shows only the four room/component files + this doc + session files; typecheck 88 (baseline, 0 client, 0 edited-file); build exit 0; adoption 100·0·9.
- **Product Registry impact:** none — no capability, route, claim, or surface added or removed; a unit label and a provenance caption are not registry facts.

## Data Impact

- **Reads existing data:** no new read. Every changed surface reads the *same* fields it already read — the plant count (`plantDiversityGroup` over the week's ingredients), the calorie sum (`nutritionMap` over `day.entries`), the activity level (`prefs.activityLevel || profile.health.activityLevel`).
- **Writes new data:** NO.
- **Changes meaning of existing data:** NO — with one deliberate honesty *improvement*: the Profile activity chip now shows **nothing** where before it showed a fabricated "Moderately Active", which more truthfully reflects that the household set no activity. No stored value changed; only its presentation-when-unset did.
- **Requires backfill:** NO. **Special-category data:** none read, moved, or exposed. (BMI and the health snapshot were **not** touched.)

## Trust Check

- **Could this mislead the user?** No — the pass *increases* honesty on every surface it touched: an estimate now says it is estimated; a summed figure now names its unit; a fabricated activity claim is removed; an acronym is glossed.
- **Could this fabricate certainty?** No — the opposite. Its headline act is **removing** a fabricated certainty (the "Moderately Active" catch-all) and **labelling** an estimate as approximate.
- **Is anything guessed but shown as real?** No — and one thing that *was* (the activity default) no longer is.
- **Was any number blind-edited?** **NO.** Every flagged count (Shopping "12 vs 3", Nutrition "17 vs 18") was traced to source; both proved to be **legibility/skew** issues, not miscounts, and both were **left untouched and staged** for the running product (§2). No displayed figure's value or computation changed.
- **What happens if the system is wrong?** A copy/label defect, corrected by reverting one string or one ternary branch.
- **No trust surface, consent ledger, or authorisation path touched.**

## Rollback Plan

- **Rollback identifier:** `rollback/LIVING-HOME-PASS3-20260722` → `e4182317` (annotated tag, object `977575ba`, on `int1-intelligence-platform`, created **before any change**).
- **Coverage caveat:** a tag protects committed state only. At tag time the working tree held one uncommitted change not authored by this pass — `.engineering/session/CURRENT.md` (the session heartbeat); not covered, not discarded.
- **To revert:** `git revert` the pass commit, or `git checkout rollback/LIVING-HOME-PASS3-20260722 -- <the four files>`. Every change is a single string, unit label, provenance caption, or one ternary branch; reverting restores the previous rendering exactly.
- **Blast radius:** four consumer surfaces, copy/label only. No data, schema, building block, route, capability, token, or governing document.

## Scope Lock

- **Shipped:** four user-visible trust/clarity refinements (§1) + this document + session artefacts.
- **Explicitly NOT done (and why):** the **Shopping** and **Nutrition** count reconciliations (traced to source — legibility/skew, not miscounts — and staged for the running product; **never blind-edited**); the **Companion** double-"Apple" de-dup and "Suggestion"-as-offer (owned surface, needs the running drawer, would leave dead code — staged as **Pass 4**); the **Cookbook/meal/recipe** and **basket/list/shop** terminology unifications (large judged copy decisions across hundreds of call-sites); the **Diary** savings-qualifier consistency (low-risk copy on an untraced £-surface); **all** Environmental Dressing (DECLARED-NOT-BUILT); no component/layout/token/capability/route/schema/logic/ownership/navigation change; **no governing document amended.**
- **Functionality unchanged** everywhere; only labels, a unit, a provenance caption, and one fabricated-default removal moved.

## Manual Verification

- `npm run typecheck` → **88 errors — byte-identical to baseline**; **0 in `client/`**, **0 in any of the four edited files** (confirmed by filtering the error list to the edited paths).
- `npm run build` → **exit 0**; `dist/index.cjs` emitted; the esbuild `import.meta` warnings are pre-existing.
- `npm run adoption:check` → **100 · 0 · 9** — identical to baseline; no building block touched.
- No `data-testid`, route, or handler changed. The Planner figure keeps `text-summary-cal-*`; the plant count keeps `text-plant-count`; the profile summary keeps `profile-summary`; the UPF toggle keeps `toggle-meals-upf-filter`. Every edit is an added label/caption/unit or one ternary branch, so no structural test is affected. The Profile activity change is behaviour-preserving for every household that set an activity (`high`/`low`/`moderate` still render); it only changes the **unset** case from a fabricated chip to honest absence.
- **No authenticated live walk-through was performed** — this pass is non-interactive. Every shipped change was chosen to be decidable by *reading the code that produces the value* (the plant count is proven name-matched; the calorie figure is proven a plain sum; the activity default is proven fabricated against the same file's HealthSnapshot policy; "UPF" is proven glossed elsewhere). Every change that needed the running product — above all the two count reconciliations — was deliberately staged (§2), per the standing discipline (HOSP1 / ROOM1 / PRESENCE1-2 / LARDER_NS1 / LHC1 / LHXP1 / LHXP2) that a number is never changed without understanding its source on the running product.

## User Acceptance Evidence

- **Pre-state evidence:** `docs/investigations/HOMEOWNER2_LIVING_HOME_REVIEW.md` (the Home Owner's Apple-Design-Award-bar critique, 7/10 — which circled the Shopping "12 vs 3" and Nutrition "17 vs 18" counts as trust defects), `LIVING_HOME_COMPLETION_PROGRAMME.md` roadmap item **D** (reconcile on-screen counts), and `LIVING_HOME_PASS2_HOSPITALITY_AND_WARMTH.md` § Recommendations (which scoped this pass's seven Trust & Clarity candidates).
- **This pass** discharges the *decidable-by-reading* slice of that scope — surfacing the Nutrition estimate's provenance (rec #2), naming the Planner figure's unit (rec #3), removing a fabricated activity certainty, and glossing an unexplained acronym — while **honouring the discipline** that the count *reconciliations* (rec #1) and the *Companion* clarity work (rec #5) are done on the running product, not blind.
- **Outstanding acceptance step (the gate):** the Home Owner walks the four rooms as a demo session — the Nutrition plant report (does the "approximate" caption read calm and honest?), a Planner week with meals (does "kcal" make the day figure read as energy?), the Profile summary for a household with **no** activity set (is the chip now absent, not fabricated?), and the Cookbook UPF filter — and confirms each reads *trustworthy and legible*; then directs the two staged count reconciliations (Shopping, Nutrition) and the Companion clarity work on the running product. This is consistent with the outstanding walk-throughs recorded for LHC1 / HOSP1 / ROOM1 / PRESENCE1-2 / LARDER_NS1 / LHXP1 / LHXP2.

---

## Recommendations for Living Home Experience Pass 4 — Companion Presence

Pass 1 balanced the rooms; Pass 2 warmed them; Pass 3 made them trustworthy. The one household surface all three deliberately left untouched — because its words and behaviour are *owned* — is the **Companion**. It is now the clearest remaining Level-3 gap, and it needs its own pass, done **on the running drawer, with the Companion's owners in the loop** (registry / INT21 / Behaviour Engine / COMP_AUTH1). Recommended scope:

1. **Actionable suggestions read as offers.** Enrichment "Suggestions" render as plain prose with no affordance to act, while guidance "Next steps" render as buttons. Either make a recommendation tappable (composed from an existing capability — never a new one) or rename it so the word does not imply an action the UI withholds. A clarity-of-what-is-actionable fix, owned with the Companion's surface (Pass-2 rec #5; LHC1 Companion 2).
2. **The double "Apple".** On the floating surface the title and the persona badge both read "Apple". A clean de-duplication — but the badge's only floating render is the one to remove, which would leave `PersonaLabel` dead there; confirming the header still reads well needs the running drawer (the LHXP1 recorded reason). LHC1 Companion 3.
3. **Presence at rest and focus when open.** The launcher's warmth, the empty-panel balance (LHXP1 shipped the flex-centre first step), and the scrim depth (a recorded UX3 no-blur decision to revisit) — the Companion should feel *present* in the house at rest and *claim focus* when opened, without dominating (GEA: enriches, never dominates). LHC1 item I / Companion 1/4.
4. **Trust in the Companion's own numbers.** Extend this pass's provenance principle *into* the Companion: when it speaks a figure (a plant count, a calorie total, a saving), the same known/calculated/estimated legibility should hold in its voice — grounded through INT17, never templated, so what it says a number *is* matches what the room says it is (closing the cross-surface skew §2 names, from the Companion's side).
5. **One presence, one truth.** The through-line: the Companion should never say something a room contradicts, and never present an interpretation as a fact the household gave. Pass 4 is where the *rooms report / the Companion interprets / the household decides* boundary (GEA21–23) is verified end-to-end on the running product — the natural completion of the four-pass Living Home Experience arc.

---

*Pass `LHXP3`. Four rooms, made honest by their labels: the Nutrition count admits it is an estimate, the Planner figure names itself as energy rather than a grade, the family record stops asserting an activity nobody set, and an acronym learns to explain itself. Not one number was blind-edited — the two the review circled were traced to their source, found to be matters of legibility and skew rather than miscounts, and left for the running product with the wording written down. The house is a little more trustworthy — and the Companion, whose voice the whole arc has kept for last, is now the pass that remains.*
