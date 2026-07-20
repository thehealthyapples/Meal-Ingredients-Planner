# EXPGOV1 — Governing Experience Architecture

**Workstream:** `EXPGOV1` (2026-07-20)
**Type:** Architecture programme. **No UX changes were implemented.**
**Rollback:** `rollback/EXPGOV1-governing-experience-architecture-20260720` → `f011b3e7cd8dcdea4623263897ff8a5c33b02505`

---

## 1. What was done

1. Created [`docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`](../../architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md) — the **Experience Constitution**, twenty principles (GEA1–GEA20), the three-layer model, the ownership map and the verification map.
2. Updated `docs/architecture/README.md` — indexed at the head of Experience Governance, named in the Architecture Bootstrap as the mandatory first read for UX/UI/frontend/visual work, and added as an **EXPERIENCE CONSTITUTION COMPLIANCE** entry in the Compliance section.
3. Updated `docs/architecture/ENGINEERING_WORKFLOW.md` — the Experience Constitution Check added as the first item of the **EXPERIENCE & UI GOVERNANCE COMPLIANCE** block. Without this the document would be *declared but unreachable*, which is the exact defect `ARCH-VERIFY1` was created to close: *"a governing rule that only fires when its author happens to remember it is not enforced; it is hoped for."*
4. Audited the current implementation against the new Constitution (§ 3 below).

**No client code was modified.** Every finding below is a recommendation.

## 2. The document's constitutional position

It sits **upstream of the Experience Governance documents on the axis of principle, and downstream of every one of them on the axis of rule.** It is read first because it frames the question; it loses every conflict because it answers a different one. This mirrors the Brand Constitution's two-axis position (`THA_BRAND_CONSTITUTION.md` § 11).

It owns **seven things** (§ 2.4 there) and cites everything else. The two most consequential:

- **`GEA11` — surplus space becomes air and view, never additional interface.** This rule previously existed only in `THA_KEPT_ROOM_TRANSLATION.md` § 4.1 and § 6, both sourced to `HOUSE1` § 19.3 — a document explicitly marked *"DESIGN SPECIFICATION — Not governing architecture"*, scoped to a single room. THA's most quotable spatial principle rested on a non-governing single-room spec. It is now governing law.
- **`GEA8` — coaching is the Companion's, wherever it appears.** This *codifies* the `UX3` owner ruling of 2026-07-19 (`7a5b48cf`), which until now existed only in a commit message and the Adoption Register, and settles it against `HOUSE_ACT2`'s contradicting rationale (`b6cc6aaa`). Both rationales were on record; neither was law.

---

## 3. Architectural gap analysis

Audited against the twenty principles. **Architectural findings only** — defects of ownership, structure and law. Cosmetic refinements are deliberately excluded.

The organising observation, which `PX1` reached first and this audit confirms in every category: **THA's experience defects are overwhelmingly Layer-3 defects — not missing knowledge, but unadopted architecture and unretired predecessors.** The law is unusually good. The product is behind it.

---

### CRITICAL

Violations of a governing principle that are live, load-bearing, and compounding.

---

#### C1 — Coaching has twelve owners. `GEA8`, `GEA9`, `GEA18`

**Finding.** The Companion (`FloatingAssistant.tsx`, mounted once at `app-shell.tsx:233`) is not the only voice. Twelve advisory surfaces coach the household in their own voice, authored outside the Companion's composition path:

`PlannerIntelligenceStrip` · `CookbookMealIntelligenceStrip` · `PantryIntelligencePanel` · `PantryKnowledgeHub` (1,018 lines) · `ShoppingIntelligencePanel` · `MealUpliftPanel` · `HouseholdInsightCard` · `PlannerAssistantPanel` (1,946 lines — *a second assistant, by name*) · `LearningSignalsPanel` · `nutrition-insights-panel` · a hard-coded insight banner (`food-diary-page.tsx:1911-1913`) · and the `intelligence/` discovery cards.

Plus authored guidance strings, e.g. `food-diary-page.tsx:1905` — *"When things drift, we help you find your way back - simply."*

**Why critical.** This is not duplication of a component; it is duplication of a **voice**. Each surface was authored before the household existed, so it is confident by construction and cannot detect that it has become false — non-fabrication (`ARCHITECTURE_PRINCIPLES.md` Principle 6) is unenforceable at these surfaces. None can be declined, none remembers what the others said, and none passes through the composition path that owns every byte the model reads. `/planner` alone renders **four simultaneous advisory panels**.

The codebase already knows: `home-experience-page.tsx:188,:637,:941` and `meal-detail-page.tsx:1214` carry comments stating coaching belongs to the Companion. **Two rooms were cleaned; eight were not.**

**Recommendation.** Adopt `GEA8` as a convergence programme, not a deletion. For each surface, classify every sentence as **report** (a fact the room owns — keep, in the room's factual register) or **advise** (interpretation, suggestion, encouragement — move to the Companion, composed). Retire each panel as its content is reclassified. Sequence by density: Planner (4 panels), Pantry (2), then the rest.

---

#### C2 — Colour has at least six independent authorities. `GEA17`, `GEA18`, `GEA19`

**Finding.** `index.css` is not the source of truth it declares itself to be. Rival colour authorities:

1. `index.css:44-335` / `:336-449` — the tokens (canonical)
2. `index.css:481-602` — 20 realm palettes × 4 vars
3. **`nav-bar.tsx:102-186`** — `REALM_STYLES`, a separate hard-coded HSL table, **35 `hsl()` literals**, whose hues *disagree* with `index.css` (nav Pantry hue **115** vs token hue **118**)
4. **`dashboard.tsx:40-55`** — 13 named raw-HSL constants (`GREEN_DEEP`, `SAGE`, `BASKET_*`…), 26 `hsl()` literals
5. `admin-companion-intelligence-page.tsx:28-31` and `admin-intelligence-page.tsx:122-123` — duplicating #4 verbatim
6. `AppleRating.tsx:39+` — a 23-value hex table; plus Tailwind palette leakage (`meals-page.tsx:133,4530`) and `workspace-header.tsx:250,:524`, whose two branches disagree with each other (30% vs 28% saturation)

**Why critical.** `THA_UI_ARCHITECTURE.md` § 7 — *no raw colour, one meaning per colour* — is the most-violated rule in the codebase, and the violation is structural rather than incidental: the nav bar's hues **already drift** from the tokens, which is the failure mode arriving on schedule. Every future colour decision must now be made six times, and a household sees a room whose nav pill and title disagree about what colour that room is.

**Recommendation.** Retire authorities 3–6 onto the tokens. Priority is `nav-bar.tsx` — it is the shell, it is on every screen, and it is where the drift is already measurable. This is a `GEA18` retire-on-introduction backlog, and it is the single highest-leverage adoption fix available.

---

#### C3 — The interface densifies on large screens. `GEA11`, `GEA2`

**Finding.** The two halves of THA's responsive answer contradict each other.

The column **holds its measure** correctly — `workspace-header.tsx:614-640` caps at 1536px and records that `3xl:max-w-[1920px]` was deliberately retired; `use-adaptive-density.tsx` spends surplus on padding. That half is right.

But inside that fixed column the grids keep adding columns: `meals-page.tsx` declares `grid-cols-2 lg:3 xl:4 2xl:5 3xl:6` at **seven sites** (`:3703,:3959,:3967,:4342,:4461,:4686,:4926`). Aggregate across the codebase: 20× `grid-cols-3`, 19× `grid-cols-4`, 10× `grid-cols-5`, **7× `grid-cols-6`**.

**The Cookbook doubles its card count from 3 to 6 between `lg` and `3xl`.** At 1536px × 6 columns a single screen presents **30+ meal cards**, each carrying a score ring, badges and an intelligence strip.

**Why critical.** This is `GEA11` inverted at THA's busiest room. The household gained space and THA spent it on density — converting an improvement into a cost, silently, because each breakpoint is individually reasonable and the aggregate is never reviewed. Home does it correctly (`home-experience-page.tsx:663-900` holds `max-w-4xl` inside a wide container specifically to leave wall visible), which proves the pattern exists and was simply not adopted.

**Recommendation.** Cap responsive column counts at the point where a card stops being readable — architecturally, adopt Home's pattern: the column holds, the item count holds, surplus becomes air. Where the room's exposure permits it, surplus becomes orchard.

---

#### C4 — THA gamifies. `GEA13`, `GEA3`

**Finding.** No confetti, no points, no badges — but:

- **A live streak.** `products-page.tsx:492-555` queries `/api/user/streak` and POSTs `/api/user/streak/record` on **every product analysis** (`:751`, `:776`). `streakData` is destructured and **never rendered**. Behavioural streak data is being collected on every scan and shown to nobody.
- **Four rival scoring systems**: `HealthScoreRing` labelled *"Health Score"* (`meals-page.tsx:129-148`), a *"THA Score"* card (`dashboard.tsx:489-520`), `AppleRating` whose top tier is labelled **"Elite"** (`AppleRating.tsx:30-36`, 11 render sites), and `ThaAppleScorePicker` — **self-rated mood and energy scored in apples** (`food-diary-page.tsx:169,:1926-1936`).
- A **Progress tab** with BMI, weight and 7-day-change tiles (`food-diary-page.tsx:1899-1924`); a `celebrationPop` variant on `"milestone"` (`companion-delight.ts:32,:53`); a Web Audio tone generator (`use-sound-effects.ts:23-51`).

**Why critical.** `GEA13`'s test — *does this measure the food, or grade the household?* — is failed by four of these. `AppleRating` on a product is legitimate information; the same apples rating **a household's own mood** is a grade. A "THA Score" is a verdict on a family's week. And the streak is the clearest case in the codebase: a mechanism whose only function is engagement, recording data with no household-facing purpose, in a product whose constitution says it should be opened *less* as it succeeds (`GEA3`).

`THA_BRAND_CONSTITUTION.md` § 6 already forbids the gamified treadmill. The treadmill is running.

**Recommendation, in order.**
1. **Retire the streak entirely** — API, mutation, and the two call sites. It is unrendered, so removal is user-invisible and immediate.
2. Rename or retire *"Elite"* as a tier label.
3. Re-present `HealthScoreRing` and *"THA Score"* as **stated, sourced properties of food** with a published basis, or retire them. A score with no visible basis is a verdict.
4. Retire apple-scored self-rating of mood and energy. Scoring a person's feelings against the brand mark is `GEA12` and `GEA13` failing together.

---

#### C5 — The apple has six treatments and four identical copies. `GEA12`, `GEA18`

**Finding.** `THA_UI_ARCHITECTURE.md` § 10 requires *exactly one apple, one canonical mark, one semantics*.

Live: **six distinct apple treatments** — `ThaAppleIcon` (raw `<img>`), `FiveApplesLogo`, `AppleRating` (a 5-apple rating with its own hex table), `.brand-mark` (CSS relief, the canonical header mark), `.wall-apple` (Home only), `.companion-emblem`.

Assets: `public/tha-apple.png`, `src/assets/icons/tha-apple.png`, `_brand1-apple.png`, `_brand2-apple.png` — **all exactly 22,095 bytes; four copies of one image**, two of them unreferenced. Plus 2.7 MB of orphaned assets (`tha-apple-sort.png`, `The healthy apples recommneds.png` — note the typo). `logo-long.png` was retired by `UX2` but is **still live** on the logged-out landing (`home-page.tsx:51`) and in the dead `BrandBanner` (`nav-bar.tsx:456`).

**Why critical.** The apple carries **two meanings** — identity, and a quality rating — which is the precise failure `THA_UI_ARCHITECTURE.md` § 10 names, and which `GEA12.2` identifies as the more serious of the two: an identity mark placed beside a claim reads as endorsement, converting identity into a truth claim with a different owner.

**Recommendation.** Rule on the semantics first — *the mark identifies THA; the rating is a rating and needs its own visual language that is not the mark.* Then converge the six treatments onto the canonical relief plus one rating presentation, delete the three orphans, and execute `UX1`'s never-run retirement of `BrandBanner`/`DesktopSidebar` (which is also where C2's third colour authority lives).

---

### IMPORTANT

Genuine architectural gaps that are not yet compounding, or where the architecture is sound and the adoption is incomplete.

---

#### I1 — Eight of nine rooms are pages. `GEA7`, `GEA19`

Only `/home` has a room identity — `.home-room`, `.home-window`, `.home-sill`, `.wall-apple` (`index.css:1260-1500`), and **zero `<Card>` components**. The other eight are the same warm canvas with cards on it, differentiated *only* by a realm tint on the title and the nav pill.

`THA_EXPERIENCE_BLUEPRINT.md` § 5 says a room is differentiated by **purpose, light, material, and one sign of life**. The product currently differentiates by **colour** — which § 5 explicitly excludes, and which `UX_NAV1`/`UX2` had already begun correcting by moving room identity onto light. The middle ground — *"the whole trick of many places"* (§ 8.1) — is unused outside Home.

**The spread is 7 objects (Home) versus 30+ (Cookbook).** Home is architecturally a different product from the rest of the house.

**Recommendation.** Extend the ground-plane treatment room by room, starting with Planner and Pantry. Not a visual refresh — the adoption of an owner that already exists and has one consumer.

---

#### I2 — The Orchard Exposure Scale is declared and unconsumed. `GEA6`

`--orchard-exposure-e0/e1/e2/e3` are defined (`index.css:173-176`, `:399-402`). **Only E3 is ever read** — three consumers, all in `orchard-backdrop.tsx`. **E0, E1 and E2 have zero consumers.** `orchard-page.tsx:267` sets `data-orchard-exposure` and **no CSS rule matches it** — an inert attribute.

The orchard appears on `/auth`, `/onboarding`, logged-out `/`, and `/home`. **Nowhere else.** And there are **two orchard assets** — `orchard-bg.webp` (51 KB, pale meadow) and `orchard.webp` (393 KB, "the real orchard") — a split the file's own header documents as unresolved (`orchard-backdrop.tsx:123-127`).

Under `GEA6` this is the failure the principle was written to name: the orchard is currently reducible to a few lines on the home page, which means **it is not yet a fact of the site**. It is an image on one screen.

**Recommendation.** Resolve the two-asset question (one orchard, one owner). Then give E1/E2 real consumers so that rooms are *shuttered* rather than *relocated*. Until then `GEA6` is aspirational.

---

#### I3 — Five owners of reduced-motion; no motion vocabulary. `GEA14`, `GEA18`

Coverage is complete and ownership is duplicated **five ways**: `MotionConfig reducedMotion="user"` (`App.tsx:463`), a global `!important` block (`index.css:1107-1116`) that makes the other three CSS mechanisms redundant, plus per-component overrides at `index.css:758`, `:1469`, `:1635`, and a JS check in `companion-delight.ts:69`.

Meanwhile the **motion vocabulary is Companion-only** (`companion-delight.ts` — three variants), while **18 files import framer-motion** with ad-hoc transitions. `THA_UI_ARCHITECTURE.md` § 11 requires *one motion vocabulary*.

Three CSS keyframes loop **infinitely** — `companion-breathe` (4.2s), `companion-speak` (3.4s), `companion-listen` (2.6s) — against `GEA14` (*nothing loops*) and `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` § 13.8, which names a pulse among the things the Companion must never have.

**Recommendation.** Promote `companion-delight.ts`'s variants to a house-wide vocabulary with an owner; converge the 18 ad-hoc consumers; collapse reduced-motion to one owner; rule on the three looping animations.

---

#### I4 — `/dashboard` is a rival Home. `GEA5`

`dashboard.tsx` renders **9 `<Card>`s**, a *"THA Score"*, a *"week progress"* card, and its own 13-constant colour palette. It is not in `NAV_ITEMS`, and `app-shell.tsx:96` titles it *"Dashboard"* via the non-room list.

It answers *"how are we doing, and what's next?"* — which is Home's question (`THA_EXPERIENCE_ARCHITECTURE.md` § 4). Under `GEA5` a second surface answering Home's question **is Home, built twice.** It is also the origin of colour authority #4 (C2) and two of the four scores (C4).

**Recommendation.** Rule on it explicitly: fold into Home, repurpose to a genuinely different question, or retire. Its continued existence is the largest single source of the other findings.

---

#### I5 — Empty and broken have no owner. `GEA15`, `GEA17`

`EmptyState` exists and is adopted by 8 pages, and its tone is genuinely good — honest, calm, no upsell, with recorded decisions *against* false empty states (`dashboard.tsx:556-559`). One deliberate non-adoption is correctly reasoned (`not-found.tsx:20-21`).

But **six surfaces still hand-roll it** (`meals-page.tsx:4454`, `pantry-page.tsx:721`, `food-knowledge-modal.tsx:49`, `PlannerAssistantPanel.tsx:541`, `day-view-drawer.tsx:200`, `partners-page.tsx:512`), and `pantry-page.tsx:773` records a live bug class: **a failed load rendering as "No household items yet"** — an error dressed as an absence, which is `GEA17` (honest absence) failing in the most misleading available direction.

`PX1` § 6 already named this: of `THA_UI_ARCHITECTURE.md` § 17's fourteen concerns, the two with **no owner at all** are *empty* and *broken* — *"the two states a household spends the most time looking at."*

**Recommendation.** Give *empty* and *broken* owners in `THA_UI_ARCHITECTURE.md` § 17, converge the six rivals, and make error-vs-absence structurally impossible to confuse.

---

#### I6 — Three named concerns are still unowned. `GEA18`

`PX1` § 6 specified three additions to `THA_UI_ARCHITECTURE.md` § 17 that **have never been made**:

1. **Meal presentation** — the product's core noun. 16 render sites, 7 thumbnail sizes, no owner.
2. **Food item + quantity row** — ≥9 implementations, no owner.
3. **Breakpoint truth** — *"UIA § 9 names it; § 17 omits it."* Six competing definitions historically; `use-adaptive-density.tsx` now converges them but is not registered as the owner.

**Recommendation.** Add all three to § 17 and the Adoption Register. This is the cheapest item on the list and it is pure `GEA18`.

---

### ENHANCEMENT

Architecture that would be better for being stated, where nothing is currently breaking.

---

#### E1 — The circulation between rooms is undefined. `GEA7`

`HOUSE4` observed that *"a room, in this canon, is a monad"* — every room is defined, and the **space between them** is not. *Doorway* appears in the constitutional sentence and is never defined; the *hall* citation is broken. `GEA7` § 6.1 names **relationship** as the third defining property of a room, and the canon has no owner for it. Candidate owner: `THA_EXPERIENCE_BLUEPRINT.md` § 5.

#### E2 — Money has no place in the house. `GEA1`

Zero hits for how money should feel across all seven Experience documents, while `POST /api/basket/checkout` is live and `THA_COMMERCIAL_ARCHITECTURE.md` governs the commercial rules but not the *experience* of them. Under `GEA1`, the moment a household spends money is the moment hospitality is most tested. Candidate owner: `THA_EXPERIENCE_ARCHITECTURE.md`.

#### E3 — The contextual rail is authored and unmounted. `GEA18`

`app-shell.tsx:205-213` renders a `lg`+ rail; **no room calls `RoomActions`**, and the file says so at `:197-198`. This is `PX1`'s thesis in a single component: authored, never adopted. Adopt it or retire it — the third state is the defect.

#### E4 — Four stale clauses in the governing canon

Correctable in one documentation pass: the Blueprint's arch (§ 6.2 rule 4); Home's header open item (§ 18.2, arguably closed by `UX2`); `home-primary-action.ts:82`'s comment *"THA has no clock"*, false since `CONV1 P5/P7`; and the `--orchard-exposure-e2` token with zero consumers (I2). `KC14` treats a stale entry as a defect, not drift.

#### E5 — Two unresolved filing precedents

`HOUSE_ACT1` ruled *"governing architecture prevails"*; `EXPERIENCE_VERIFY1` followed a loose root path and recorded the tension unresolved; `ef59ea3f` then moved `UX2`'s report. Two precedents, no ruling — and `repo-structure-verify.sh` already fails on 13 pre-existing loose files. Belongs to `REPOSITORY_CONVENTIONS.md`.

---

## 4. Summary

| Priority | Findings | Character |
|---|---|---|
| **Critical** | 5 | Live violations of a governing principle, compounding |
| **Important** | 6 | Sound architecture, incomplete adoption |
| **Enhancement** | 5 | Unstated architecture; nothing breaking |

**The pattern.** Not one finding is a defect of knowledge. Every one is a defect of **adoption** — an owner authored and not consumed (I2, E3), a predecessor not retired (C2, C5, I3), a ruling made in a commit message and never written up (C1), or a concern nobody was ever assigned (I5, I6). `PX1` diagnosed this in July 2026 and it remains the single accurate description of THA's experience state.

The Constitution's contribution is `GEA20`: work flows Constitution → Architecture → Implementation, and anything durable discovered at the bottom is written **up** in the same change. Applied consistently, it is what stops this list regenerating.

**Recommended sequence.** C4's streak retirement first (unrendered, zero user impact, immediate). Then C2's `nav-bar.tsx` convergence (highest leverage, measurable drift already present). Then I4's ruling on `/dashboard`, which is upstream of much of C2, C4 and I1. C1 is the largest and should be sequenced room by room, Planner first.

---

## 5. Verification

- `EXPGOV1` implements **no** UX, UI or frontend change. No file under `client/` was modified.
- The new document creates no route, capability, entity, token, component or string, and no code reads it.
- It restates no rule of any existing owner; every rule referenced is cited to its owner with a section number.
- Where it conflicts with an owner on a question of rule, the owner prevails (§ 2.3).
- `.engineering/scripts/repo-structure-verify.sh` — new architecture document indexed in `docs/architecture/README.md`.

## 6. Rollback

```
rollback/EXPGOV1-governing-experience-architecture-20260720 → f011b3e7cd8dcdea4623263897ff8a5c33b02505
```

The working tree was **dirty at tag time**. The tag protects committed state only and does **not** cover: `.engineering/session/CURRENT.md`, `docs/intelligence/benchmark/history/index.json`, or the two untracked benchmark files under `docs/intelligence/benchmark/history/`. None was authored by this workstream and none was touched by it.
