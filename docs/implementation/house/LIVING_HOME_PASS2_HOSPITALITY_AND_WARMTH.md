# Living Home Experience Pass 2 — Hospitality & Warmth (`LHXP2`)

| Field | Value |
|---|---|
| **Programme ID** | `LHXP2` (Living Home Experience Pass 2) |
| **Date** | 2026-07-22 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback ID** | `rollback/LIVING-HOME-PASS2-20260722` → `5fe253c2` (annotated tag, created before any change) |
| **Kind** | Copy / microcopy only — hospitality & warmth across the household rooms. **No behaviour, no decoration.** |
| **Governing parents** | `HOME_OWNER_ARCHITECTURE.md` (HOMEOWNER1) · `GOVERNING_EXPERIENCE_ARCHITECTURE.md` (GEA1 hospitality-first · GEA8/GEA21 *rooms report, they do not counsel* · GEA13 no grading · GEA17 honest absence) · `THA_EXPERIENCE_LANGUAGE.md` (§ 3A the Emotional Palette — *never clinical, never cold*) · `LIVING_HOME_COMPLETION_PROGRAMME.md` (LHC1 — Maturity Model, roadmap item G) · `LIVING_HOME_PASS1_COMPOSITION_AND_BALANCE.md` (LHXP1) |
| **Predecessor pass** | `HOSP1` (Hospitality Pass 1) already warmed the **error voice** and converted hand-rolled empty/load states to the canonical `EmptyState`/`LoadError` owners. This pass does **not** re-own that work — it warms what HOSP1 deferred: the honest-absence walls and the clinical/administrative microcopy. |

---

## 0 · What this pass is, and what it is not

**Objective:** make every room feel *prepared for the household's arrival* — as though someone cared enough to ready the room before they walked in. **This is not decoration; it is hospitality.**

It is a **copy / microcopy pass only.** Every change is a user-visible **string** on a consumer surface. It ships **no** component, layout, token, capability, prompt, behaviour, route, schema, or business logic, and it **amends no governing document**.

The seven principles, applied consistently (each cited to an owner):

- **Hospitality before productivity** (GEA1) · **calm before capability** (GEA2).
- **Gentle invitations instead of instructions** — an unset preference now *invites* ("Add yours") rather than *reports a deficiency* ("Not set").
- **Honest absence instead of empty forms** (GEA17; Blueprint § 12.1 *honest in absence*) — the canonical `EmptyState` tone (warm, one sentence, one gentle next step) extended to the inline blanks it never reached.
- **Warmth instead of administration** — the family record stops leading with account chrome and database language.
- **Presence instead of noise · restraint instead of decoration** — nothing added; cold words *removed or softened*, never ornament applied.

### The one governance line this pass held carefully

**Rooms report; they do not counsel** (GEA8 / GEA21). Warm copy is a constant risk of drifting into the Companion's voice — encouragement, coaching, interpretation. Every string here was checked to remain a **room's fact, gently framed**, never advice. The clearest example: the Nutrition room's intro was *"Track your household's nutrient intake over time and **identify gaps in your diet**"* — diagnostic, and the beginning of a verdict on the household. It now **reports what the room shows** — *"See the nutrients your household's meals bring to the table, week by week"* — and leaves interpretation where it belongs, with the Companion (GEA22).

---

## 1 · Honest absence — the family record (the biggest win)

The Household / Profile room is a *family record*, yet its unconfigured rows read like an unfinished admin form: a column of grey **"Not set" / "No preference" / "None" / "-"**. Task item 10 names exactly these as never to expose. They are replaced with the house's honest-absence tone — a **gentle invitation**, not a deficiency notice.

| File · line | Before | After | Note |
|---|---|---|---|
| `profile-page.tsx` `SettingRow` | `Not set` | **Add yours** | the default for any collapsed, unconfigured preference row |
| `profile-page.tsx` `HealthSnapshot` ×3 | `Not set` | **Add yours** | BMI / kcal / Activity sub-captions |
| `profile-page.tsx` `HealthSnapshot` ×3 | big `-` | ` ` (non-breaking) | the stark clinical dash is gone; height held, so the grid never shifts; the gentle invite beneath carries the meaning |
| `profile-page.tsx` cuisine / schedule / stores ×3 | `No preference` | **Add yours** | unset preference summaries |
| `profile-page.tsx` goals | `None set` | **Add yours** | |
| `profile-page.tsx` allergies | `None` | **Nothing noted** | *deliberately not "Add yours"*: for a safety-relevant field, "Nothing noted" honestly says **the household has not told us** — it never implies THA has confirmed there are no allergies (the safer sentence). |

Because `HealthSnapshot` is shared, this single change also warms the **Diary's** clinical daily greeting (the *"– BMI / – kcal · Not set"* line LHC1 flagged as Diary 1) — the Diary now opens without a row of empty clinical slots.

---

## 2 · Warmth across the other rooms

Every string below is room-voice (a fact, gently framed), honest, and arrival-facing.

| Room | File | Before → After | Principle |
|---|---|---|---|
| **Home** | `home-experience-page.tsx` | `Nothing planned` → **An open day** (today's glance) — emptiness reframed as *openness*, the Planner's own emotional intention (*open evenings, not blank rows*). | hospitality; honest absence |
| **Home** | `home-experience-page.tsx` | `Not linked to dates` → **Not tied to a week yet** — a database-plumbing phrase becomes plain, honest household language (the planner has meals but no dated week). | de-technicalise; honest |
| **Orchard** | `orchard-page.tsx` | `Nothing is waiting.` → **No invitations waiting just now.** · `Nowhere yet.` → **No neighbourhoods yet.** | gentle absence |
| **Planner** | `weekly-planner-page.tsx` | `Weekly Provisioning` → **The week's provisions** (a larder word, not a logistics one); the description shed *"These inform shopping and availability"* (technical); the empty state dropped the *"Use Add to Week from the Analyser…"* instruction for a gentle **"Anything you add for the whole week — rather than a single day — gathers here."** | warmth; invitation-not-instruction |
| **Nutrition** | `plant-diversity-page.tsx` | clinical *"identify gaps in your diet"* → room-voice **"See the nutrients your household's meals bring to the table, week by week."** | rooms report, not counsel (GEA8) |
| **Nutrition** | `PlantDiversityReport.tsx` | report empty state → **"Once your week has a few meals, the variety on your table will show here."**; *"No plant-based ingredients found this week."* → **"…on the table this week yet."**; per-section empties gain a gentle **"…this week yet."** | honest absence; de-query-ify |
| **Cookbook** | `meals-page.tsx` | nutrition-widget `N/A` → **—** (the house's established honest-absence for a genuinely-unknown value, per HOSP1). | honest absence |
| **Larder** | `pantry-page.tsx` | `No additional info available yet.` → **Nothing more to add here just yet.** | warmth |
| **Shopping** | `shopping-workspace-page.tsx` | `All items accounted for` (a stock-audit phrase) → **That's everything** (the warm completion the sub-line already spoke). | warmth; success state |

**Nine rooms carry a warmth improvement.** The **Companion** is the one household surface deliberately **left untouched**: its words are produced by their owners (the registry's introduction string — PRESENCE2; INT21 / the Behaviour Engine), and task item 12 forbids Companion behaviour changes. Warming the Companion's copy here would be authoring in a voice this pass does not own.

---

## 3 · Reading against the Living Home Maturity Model

Pass 2 targets **Level 3 — Hospitable**'s *warm* and *inviting* dimensions (LHC1). Every change reinforces the test *"someone cared enough to prepare this room before I arrived"*:

| Room | Was | Now |
|---|---|---|
| Household / Profile | administrative (a wall of "Not set") | **warm · inviting** — gentle invitations, the family before the form |
| Diary | clinical greeting (empty BMI/kcal slots) | **warm** — opens without a clinical dash |
| Home | a plumbing leak ("Not linked to dates") | **inviting** — "an open day" |
| Nutrition | clinical / diagnostic ("identify gaps") | **warm** — the room reports the table, the Companion interprets |
| Planner | administrative ("Weekly Provisioning") | **warm** — "the week's provisions" |
| Orchard · Larder · Cookbook · Shopping | terse / database / audit tone | **calm · warm** — gentle absence, plain success |

Levels 1–2 are untouched (no identity, ownership, or workflow changed). Level 4 (Environmental Dressing) remains gated and untouched.

---

## 4 · The forbidden list — confirmed untouched (task item 12)

Not one byte of: **Environmental Dressing · Seasonal decoration · Companion behaviour · new capabilities · new prompts · business logic · navigation · canonical ownership · APIs · schemas · permissions · the Intelligence Platform.** No server or shared-schema file was touched (one shared **client component**, `PlantDiversityReport.tsx`, was edited — copy only). Every change is a string on a consumer.

---

## Architecture Compliance

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================
☑ One canonical identity — no entity touched.
☑ One owner per fact — no fact re-owned; only presentation strings changed (GEA17/UIOWN1).
☑ No duplicate entities / ownership / state — nothing created; no store, no derived fact.
☑ Extends existing architecture — extends the canonical honest-absence/EmptyState tone
  (UIA §17) to the inline blanks it had not reached; invents no pattern.
☑ Progressive enrichment — additive warmth; every change reversible by reverting one string.
☑ Knowledge domain compliance — no knowledge domain touched; Product Registry impact nil.
☑ Honest gaps over fabricated information — the whole pass: cold absence → honest, warm absence;
  the allergies field made SAFER ("Nothing noted" never implies a confirmed absence).
☑ No permanent synchronisation bridge — none.
☑ Evolution over replacement — nothing retired.

Experience Constitution Check (before design):
  hospitality — every room reads warmer and more prepared (GEA1).
  outcome     — reduced felt weight; blanks invite rather than accuse.
  weight      — lighter: administrative/clinical words removed, not added.
  voice       — rooms still only REPORT; the one diagnostic line ("identify gaps") was
                REMOVED to protect the boundary (GEA8/21); no room gained the Companion's voice.
  ownership   — nothing re-owned; the household still owns every decision (GEA23).
  restraint   — copy softened/removed, never ornament applied (GEA15).
  layer       — Experience Implementation only; originates no law (GEA20).
```

## AI Architecture Compliance

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
✓ Uses the canonical Intelligence Platform — only by reference; nothing reached.
✓ Capability Registry / Intent Engine — untouched; no capability, intent, or prompt added.
✓ Does not create another assistant — the Companion is the one surface left UNTOUCHED,
  precisely because its words are owned (registry / INT21 / Behaviour Engine); no persona,
  greeting, notice, or Context View changed.
✓ Reuses existing business services — none touched.
✓ Companion ownership unchanged — no interpretation, coaching, or observation added to any
  room; the Nutrition "identify gaps" diagnostic was removed to keep interpretation the
  Companion's alone (GEA22).
✓ Honest gaps over fabricated knowledge — the pass's whole subject; nothing guessed shown as real.
```

## Definition of Done

- **Success looks like:** this document exists at `docs/implementation/house/LIVING_HOME_PASS2_HOSPITALITY_AND_WARMTH.md`; nine rooms read warmer and more prepared; every "Not set / No preference / None / -" honest-absence violation in the family record and daily rooms is warmed; every change validated against Level 3 and the *"someone prepared this room"* test; typecheck / build / adoption baseline-identical; rollback reported; deferred gaps staged.
- **What must not break:** nothing runtime — no data, workflow, route, identity, or Companion behaviour changes; the forbidden list (§4) is byte-untouched.
- **Manual test steps:** `git diff --stat <rollback-tag>..HEAD` shows only the nine room/component files + this doc + session files; typecheck 88 (baseline, 0 client); build exit 0; adoption 100·0·9.
- **Product Registry impact:** none — no capability, route, claim, or surface added or removed; microcopy warmth is not a registry fact.

## Data Impact

- **Reads existing data:** no new read. Every changed string is a *fallback* or *label*; the data behind it is unchanged (e.g. `dietRestrictions` still drives allergies; only the empty-case word changed).
- **Writes new data:** NO.
- **Changes meaning of existing data:** NO — with one deliberate honesty *improvement*: the allergies empty-case now reads **"Nothing noted"** rather than **"None"**, which more truthfully distinguishes *"the household reported no allergies"* from *"the household has not told us"* — a safer sentence, not a changed fact.
- **Requires backfill:** NO. **Special-category data:** none read, moved, or exposed.

## Trust Check

- **Could this mislead the user?** No — the pass *increases* honesty: cold absence became honest absence, and the safety-relevant allergies blank was made less presumptuous ("Nothing noted").
- **Could this fabricate certainty?** No. No number, state, or claim was invented or blind-edited. Where a metric is unset, the room now *invites* ("Add yours") instead of asserting a stark "-".
- **Is anything guessed but shown as real?** No.
- **What happens if the system is wrong?** A copy defect, corrected by reverting one string.
- **The count reconciliations remain untouched** (Shopping "12 vs 3", Nutrition "17 vs 18" — LHC1 item D): a number changed without understanding its source is how trust is *spent*. These are **Trust & Clarity (Pass 3)** work, on the running product — see § Recommendations.
- **No trust surface, consent ledger, or authorisation path touched.**

## Rollback Plan

- **Rollback identifier:** `rollback/LIVING-HOME-PASS2-20260722` → `5fe253c222762a223f5728a99661a8c368aa62dc` (annotated tag on `int1-intelligence-platform`, created **before any change**).
- **Coverage caveat:** tags protect committed state only. At tag time the tree held one uncommitted change not authored by this pass — `.engineering/session/CURRENT.md` (heartbeat); not covered, not discarded.
- **To revert:** `git revert` the pass commit, or `git checkout rollback/LIVING-HOME-PASS2-20260722 -- <the nine files>`. Every change is a single string; reverting restores the previous words exactly.
- **Blast radius:** nine consumer surfaces, copy only. No data, schema, building block, route, capability, token, or governing document.

## Scope Lock

- **Shipped:** ~24 user-visible string refinements across nine rooms (§1, §2) + this document + session artefacts.
- **Explicitly NOT done (and why):** Companion copy (registry/INT21-owned; item 12); the pervasive **uppercase-tracking micro-labels** (a consistent typographic decision HOSP1 deferred — needs a single judged pass, not blind string edits); the **count reconciliations** (Trust — Pass 3, on the running product); the deeper **HealthSnapshot demote-when-unset** composition (a Pass-1-style change needing eyes); deep price-table `-` cells and edge-case DB-value fallbacks (marginal, low arrival-value); **all** Environmental Dressing (DECLARED-NOT-BUILT); no component/layout/token/capability/route/schema/logic/ownership/navigation change; **no governing document amended.**
- **Functionality unchanged** everywhere; only words moved.

## Manual Verification

- `npm run typecheck` → **88 errors — byte-identical to baseline**; **0 in `client/`**, **0 in any of the nine edited files**.
- `npm run build` → **exit 0**; `dist/index.cjs` emitted; the 4 esbuild `import.meta` warnings are pre-existing.
- `npm run adoption:check` → **100 · 0 · 9** — identical to baseline; no building block touched.
- No `data-testid`, route, or handler changed; every edit is a display-string swap, so no structural test is affected. A residual "Weekly Provisioning" remains only in a **code comment** (non-user-facing), verified by grep.
- **No authenticated live walk-through was performed** — this pass is non-interactive. Copy changes are lower-risk than composition changes (they are decidable by reading), and were each checked against the room-voice boundary (GEA8/21) and honesty (GEA17); the walk-through is the acceptance gate below.

## User Acceptance Evidence

- **Pre-state evidence:** `HOMEOWNER2_LIVING_HOME_REVIEW.md` (the *"wall of No preference / None / Not set"* under Household 3, and the clinical Diary greeting Diary 1), and LHC1 roadmap item **G** (*warm the blank rooms — honest-absence for "– / Not set / No preference / None"*), which this pass discharges.
- **This pass** turns those cold blanks into gentle invitations and warms the clinical/administrative microcopy across nine rooms, while holding the *rooms-report-not-counsel* boundary.
- **Outstanding acceptance step (the gate):** the Home Owner walks the nine rooms as a demo session — especially the Household/Profile record with unset preferences, and the Diary's daily greeting — and confirms each reads as *prepared and welcoming*, never as an unfinished form; and reviews the staged gaps (§ Scope Lock) and the Pass 3 recommendations below.

---

## Recommendations for Living Home Experience Pass 3 — Trust & Clarity

Pass 1 balanced the rooms; Pass 2 warmed them. The natural next pass makes them **trustworthy and legible** — because a warm room that shows a number the household can't trust is still not a home. Recommended scope:

1. **Reconcile the honest numbers, on the running product** (LHC1 item D). Shopping's *"12 items"* vs 3 shown, and Nutrition's *"17 vs 18"* count mismatch — reconcile the measures or make the different measures legible. **Never blind-edit a number** (a number changed without understanding its source spends trust). This is the single highest-value Trust item and needs an authenticated session.
2. **Label provenance wherever a figure is derived or approximate.** Extend the pattern Shopping already uses (*"incl. estimates"*): the Nutrition plant-count carries an *"approximation based on ingredient names"* disclaimer — surface it calmly and consistently; distinguish *known* from *estimated* everywhere a value could be mistaken for measured.
3. **Confirm no number is shown without the household understanding its source** (Core Principle 6). Audit BMI/kcal provenance (household-entered vs derived), the Planner calorie "flame" (confirmed calories in LHXP1 — keep, but ensure it reads as *the food's energy*, not a verdict), and any place a computed figure could read as a grade (GEA13).
4. **The uppercase-tracking micro-label typographic pass** — clarity of hierarchy. HOSP1 and this pass both deferred it as a single judged decision; Pass 3 is its home (sentence-case where it warms, retained where it genuinely orients).
5. **Companion clarity of action** (the parts this pass could not touch): the *"Apple" labelled twice* de-dup, and proactive suggestions rendered as **plain body text** rather than tappable offers — a clarity-of-what's-actionable fix, owned with the Companion's surface, best done with eyes.
6. **Honest-absence consistency across the deep surfaces** — the remaining price-table `-` cells → the house's `—`, and the raw DB-value fallbacks (e.g. Orchard's `c.kind`) → household language — so absence looks the same calm way everywhere.
7. **The HealthSnapshot demote-when-unset composition** (Pass-1-style, needs the running product): when a metric is genuinely unset, whether the clinical card should demote rather than hold three blank slots — the deeper move Pass 2's copy warming set up but did not make.

---

*Pass `LHXP2`. Nine rooms, warmed by their words: the family record invites instead of accusing, the clinical dash is gone, the Nutrition room reports instead of diagnosing, and every blank now reads as a gentle "when you're ready" rather than a cold "Not set". The house is a little more clearly readied for whoever walks in — and the Companion's own voice was left, rightly, to the Companion.*
