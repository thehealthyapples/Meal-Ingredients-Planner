# HOUSE_ACT1 — Household Experience Activation

**Date:** 2026-07-18
**Branch:** `int1-intelligence-platform`
**Risk:** 💡 Premium Reasoning
**Reason:** Activate The Healthy Apples as one coherent household experience — audit every room, expose existing intelligence, and restore production readiness.

---

## ROLLBACK PROTECTION

| | |
|---|---|
| **Rollback identifier** | `rollback/HOUSE_ACT1-household-experience-activation-20260718` |
| **Commit** | `057102ec` — *Pre-HOUSE_ACT1 checkpoint — capture in-flight programme work* |
| **Created** | Before any implementation, per `ENGINEERING_WORKFLOW.md` STEP 1 |

The working tree held **249 uncommitted paths** from prior programmes (ARRIVAL1, BRAND1/2, COMP\*, AFI\*, CONV1 P10, FI20, HOUSE\*, ENGINT2 session runs). An annotated tag on `HEAD` alone would have protected none of it, and HOUSE_ACT1's changes would have been inseparable from it. A **checkpoint commit** was therefore created first, on the owner's explicit direction, and the tag placed on that commit.

**Deliberately excluded from the checkpoint:** the 32 untracked `docs/ui-audit/` screenshot directories (~490 MB). Untracked files are unaffected by a revert, so committing them buys no rollback protection while roughly doubling repository size permanently. They remain untracked and intact.

**Rollback command:**
```
git reset --hard rollback/HOUSE_ACT1-household-experience-activation-20260718
```
⚠️ Reverting to this tag restores a tree that **does not build** — see Finding H1.

---

## REFERENCE DOCUMENTS READ

`docs/architecture/README.md` (Architecture Bootstrap, STEP 2) and, through it: `ENGINEERING_WORKFLOW.md` (all five compliance blocks), `REPOSITORY_CONVENTIONS.md` §4, `ARCHITECTURE_PRINCIPLES.md` (Principles 2, 6, 8), `THA_EXPERIENCE_BLUEPRINT.md` (§4.1 rooms, §15.2 Blueprint Checks, §15.3 Experience Test), `THA_EXPERIENCE_ARCHITECTURE.md` (§18 UX checklist), `THA_UI_ARCHITECTURE.md` (§17 Adoption Register, §18 UI checklist), `THA_EXPERIENCE_LANGUAGE.md` (§6 Review Questions, §7 Anti-Patterns), `THA_COMPANION_PLATFORM_ARCHITECTURE.md`, `THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`, `CANONICAL_PUBLICATION_ARCHITECTURE.md`, `docs/implementation/ux/ADOPTION_REGISTER.md`.

**Governance conflict declared and resolved.** The mission specified the report path `docs/implementation/HOUSE_ACT1_...md`. `REPOSITORY_CONVENTIONS.md` §4 forbids a loosely-filed report at a tree root and routes House reports (Home · Arrival · North Star · Orchard House · rooms · spatial experience) to `docs/implementation/house/`; `repo-structure-verify.sh` **fails** on the mission's literal path. Governing architecture prevails — filed at `docs/implementation/house/`.

---

## THE HEADLINE

> **HOUSE_ACT1 was asked to activate the household experience. The house did not compile.**

Two unterminated JSX comments — `*/` with no closing `}` — sat in `nav-bar.tsx` and `workspace-header.tsx`, the two components that own **every door in the house**. `npx vite build` at the rollback tag fails outright:

```
✗ Build failed in 485ms
[vite:esbuild] Transform failed with 1 error:
client/src/components/nav-bar.tsx:392:17: ERROR: Expected "}" but found "&&"
```

This also **masked 92 pre-existing type errors**: the parse failure made `tsc` bail early, reporting 2 errors. With the syntax repaired, the true count is 94 — all in `server/tests/*.ts`, none introduced here.

The second finding follows from the first: **the audit's raw defect list was mostly wrong.** Of four "defects" reported by reconnaissance, three did not survive verification — prior programmes (PROD1, PX1-W4, AFI4/CBK2) had already fixed them. The rooms are in far better condition than a first pass suggests. **The gap in THA is not polish. It is that whole rooms do not exist, and that built intelligence has no door.**

---

## 1. HOUSEHOLD EXPERIENCE AUDIT

### 1.1 Room register — the thirteen rooms asked for

| Room | Route | Page | Verdict |
|---|---|---|---|
| Home | `/home` | `home-experience-page.tsx` | ✅ Built, in nav |
| Cookbook | `/cookbook`, `/meals` | `meals-page.tsx` | ✅ Built, in nav |
| Planner | `/planner`, `/weekly-planner` | `weekly-planner-page.tsx` | ✅ Built, in nav |
| Pantry | `/pantry` | `pantry-page.tsx` | ✅ Built, in nav |
| Shopping | `/shopping-workspace` | `shopping-workspace-page.tsx` | ✅ Built, in nav |
| Nutrition | `/plant-diversity` | `plant-diversity-page.tsx` | ⚠️ Built; **label ≠ path** |
| Diary | `/my-diary`, `/diary` | `food-diary-page.tsx` | ✅ Built, in nav |
| Companion | — | `FloatingAssistant.tsx` | ✅ **Correctly not a room** |
| Profile | `/profile` | `profile-page.tsx` | ⚠️ Built; reachable only via AppleMenu |
| Admin | `/admin` + 12 | `admin-page.tsx` | ✅ Built |
| **Partners** | — | `partners-page.tsx` (596 LOC) | 🔴 **Route deliberately withdrawn** |
| **Support** | — | — | 🔴 **Does not exist** (a `mailto:` on Profile) |
| **Community** | — | — | 🔴 **Does not exist at all** |

**Companion is correctly not a room.** `THA_EXPERIENCE_BLUEPRINT.md` places it as *the friend at the counter — a presence, not a room*. `FloatingAssistant` is mounted once inside `ProtectedRoute` (`App.tsx:258`), present in every room and owning none. This is compliant and must not be "fixed" by giving it a page.

### 1.2 The three absent rooms — refused, with evidence

The mission asks for a complete experience across thirteen rooms. **Three cannot be completed, and building them would violate the architecture rather than serve it.**

- **Partners** was not forgotten — it was **withdrawn deliberately**. `PROD2` found all 12 entries in `data/partners.ts` were invented, carrying `example.com` URLs behind a real affiliate-disclosure notice: THA was recommending health and nutrition practitioners **that do not exist**. The route was removed (`App.tsx:55, :423`) and the nav entry closed. Re-opening that door means fabricating partners. **Core Principle 6 forbids it.** The correct state is the current one: page and data retained for a real partner programme, doors closed until the partners are real.
- **Support** exists as a `mailto:` on Profile (`profile-page.tsx:1749`). A Support room would be a genuine addition — but it is **new scope**, not activation, and needs content THA does not yet own.
- **Community** has no page, route, nav entry, or reference anywhere in `client/src`. It is a **concept, not an unfinished room.**

**These are honest absences, and they are reported as absences rather than filled with invented content.** Recommendations are in §7; none was implemented without approval.

### 1.3 Orphaned rooms — built, unreachable

Five surfaces are fully built and reachable only by typing a URL:

| Route | Page | Only entry point |
|---|---|---|
| `/compare` | `food-comparison-page.tsx` | `food-detail-page.tsx:212` |
| `/import-recipe` | `import-recipe-page.tsx` | **none** — import UI re-inlined at `meals-page.tsx:5974` |
| `/quick-meal` | `quick-meal-page.tsx` | **none** |
| `/supermarkets` | `supermarkets-page.tsx` | **none** |
| `/dashboard` | `dashboard.tsx` | `home-experience-page.tsx:954` |

`/compare` is the costly one: it is the **only** household-facing surface of the `food-intelligence` comparison engine, and nothing in the navigation leads to it.

---

## 2. INTELLIGENCE SURFACING AUDIT

The mission's instruction — *"existing intelligence must become visible"* — is where the largest real gap sits.

**Structural finding: of 24 registered capabilities, exactly one has a household-facing HTTP surface of its own** (`opportunity-delivery`, `capability-registry.ts:717`). Every other capability either shares a business route with the ordinary app or is declared *"platform-internal only — no dedicated HTTP route"*.

**The consequence: eight fully-built, bound, executable capabilities have zero UI.** They reach a household only if someone opens the Companion and asks the right question.

| Capability | Binding | Household UI |
|---|---|---|
| `meal-discovery` | `bindings/meal-discovery.ts` | ❌ none |
| `nutrition-discovery` | `bindings/nutrition-discovery.ts` | ❌ none |
| `planner-discovery` | `bindings/planner-discovery.ts` | ❌ none |
| `pantry-discovery` | `bindings/pantry-discovery.ts` | ❌ none |
| `diary-discovery` | `bindings/diary-discovery.ts` | ❌ none |
| `shopping-discovery` | `bindings/shopping-discovery.ts` | ❌ none |
| `household-discovery` | `bindings/household-discovery.ts` | ❌ none |
| `product-knowledge` | `bindings/product-knowledge.ts` | ❌ none |

Against the mission's named list:

| Named intelligence | State |
|---|---|
| Household learning | Built; surfaced **only** in Profile (`profile-page.tsx:436`). Absent from Planner, Shopping, Pantry, Home |
| Food intelligence | `recommend`/`report` reach the UI only via opportunities; `compare` only via the **unlinked** `/compare` |
| **Nutrition enhancement** | 🔴 `nutrition-enrichment.ts` + `household-nutrition-enrichment.ts` consumed **only** by `conversation-gateway.ts:1007,:1017`. **No room ever renders them** |
| Planner intelligence | ✅ `PlannerIntelligenceStrip` at `weekly-planner-page.tsx:2012` |
| **Behavioural insights** | 🔴 `/api/intelligence/observation/behaviour` is `assertAdmin`. **Never shown to a household** |
| **Recommendations** | 🔴 `/api/intelligence/learning/recommendations` is `assertAdmin`. The household-facing `recommend` verb on planner/meals/pantry/templates/partners has **no client caller** |
| Observations | Admin-only by design |
| Shopping intelligence | ✅ Surfaced, per-item |
| Comparisons | ⚠️ Engine + route + page exist; **no navigation entry** |
| Plant diversity | ✅ `HouseholdNutritionCentre` |
| Seasonal guidance | ✅ `SeasonalCard` in three rooms |
| **Progress** | 🔴 No route, no capability. **Does not exist** |

**AmbientIntelligence** is the one genuine cross-room intelligence surface — seven mounts (Home, Dashboard, Planner, Shopping, Pantry, Cookbook, Meal detail) sharing one query key, so TanStack dedupes to a single fetch. It renders `null` when empty and stays collapsed unless a `critical` opportunity forces it open: *quiet when unnecessary*, exactly as the brief requires.

> **Verified, not assumed:** the Cookbook mount (`meals-page.tsx:3599`) declares `domains={["cookbook"]}`, which reconnaissance flagged as a domain the server may never emit. It is **valid** — `framework.ts:300` maps `cookbook → "meals"` under AFI4/CBK2. No defect.

---

## 3. CROSS-ROOM CONSISTENCY AUDIT

Consistency is **substantially better than expected**, because `PX1` already did this work and made it enforceable.

| Concern | Owner | Adoption | State |
|---|---|---|---|
| Header / page shell / back | `workspace-header.tsx` | 24 (floor 15) | ✅ governed |
| Card | `ui/card.tsx` | 47 (floor 35) | ✅ governed |
| Loading | `ui/skeleton.tsx` | 22 (floor 12) | ⚠️ half-adopted |
| Error | `ui/load-error.tsx` | 14 (floor 4) | ✅ governed |
| Empty | `ui/empty-state.tsx` | 6 (floor 3) | ⚠️ thin |
| **Overlay** | `ui/overlay.tsx` | **1** | 🔴 **outnumbered 14:1** |

**`ui/overlay.tsx` is the live successor-with-no-adoption.** It exists to retire per-file overlay choice, yet its two rivals — `<DrawerContent>` (11) and `<SheetContent>` (3) — outnumber it fourteen to one. It escapes the orphan list only because 1 ≠ 0. This is the same failure shape `PageHeader.tsx` had before PX1-W4.7 retired it, and `THA_UI_ARCHITECTURE.md` §17 exists precisely so it cannot hide.

**Ungoverned household rooms:** `food-detail-page.tsx` and `food-comparison-page.tsx` are authenticated rooms with hand-rolled `<header>` + raw `text-2xl font-bold` headings, and **no exemption recorded** in the register. Every other non-adopting page is either Admin (own banner chrome), arrival (`OrchardShell`), or the unauthenticated share view.

**Five owners sit exactly at their adoption floor** — density ladder (4), greeting (4), form field (2), accessible name (2), overlay (1). Losing a single consumer fails CI.

**Corrections to reconnaissance** — three claimed defects that verification disproved:
- `meal-detail-page.tsx` "9 queries, no loading state" — **false.** `isPending` is captured at `:136` and rendered at `:460`, with a `!meal` branch at `:469`. The grep matched `isLoading` only.
- `products-page.tsx` "load failure renders as empty" — **false.** Both empty states are deliberate `variant="filtered"`, authored under PROD1 with the two truths explicitly told apart.
- `nav-bar.tsx` `REALM_STYLES["/home"]` "duplicate keys" — **false.** The green block is `/home`; the amber block is `/dashboard`, a separate key.

---

## 4. IMPLEMENTATION

Three changes. All verified. Nothing speculative.

### H1 — The house now compiles 🔴 → 🟢
`client/src/components/nav-bar.tsx:391` · `client/src/components/workspace-header.tsx:121`

Two unterminated JSX comments (`*/` with no closing `}`) in the PROD2 partner-withdrawal notes. `vite build` failed at `nav-bar.tsx:392` with `Expected "}" but found "&&"`. Both closed to `*/}`.

Consequence beyond the build: the parse failure **masked 92 type errors** by making `tsc` bail early (2 reported → 94 true, all pre-existing in `server/tests/*.ts`).

### H2 — A door that led to a 404
`client/src/pages/shopping-workspace-page.tsx:2181`

```diff
-<Link href="/shopping" asChild>
+<Link href="/basket" asChild>
```
The Shopping workspace's own **"Basket"** menu item pointed at `/shopping` — a route that does not exist in `App.tsx`. It fell through to `NotFound`. `/basket` is the intended target, confirmed by the four sibling links at `dashboard.tsx:433,:503,:745` and `shopping-workspace-page.tsx:2857`.

*A household in the Shopping room, opening their own basket, hit a not-found page. Nothing in the Experience Architecture is served by that.*

### H3 — Adoption register re-measured
`docs/implementation/ux/adoption-register.json` · `ADOPTION_REGISTER.md` (generated)

Three rival ceilings **tightened** in the permitted direction (ceilings may fall, never rise): `<DrawerContent>` 12→11, raw `useMutation` 137→133, raw `<button>` 538→524. The `theme-colour-mode` fact re-measured 855→846 `dark:` utilities, dated 2026-07-18. Gate: **81 passed · 0 notices · 0 failed.**

> **Provenance, stated plainly:** H1 and H3 appeared in the working tree during the audit phase, as a side effect of repository scripts run by reconnaissance, rather than from an edit I authored deliberately. I have read, verified and adopted them — H1 is confirmed correct by a passing build against a failing one, H3 by a green gate. Only H2 was authored by hand. Recording this because attributing work I did not do would be the same failure this programme found elsewhere.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

- ☑ **One canonical identity** — No entity touched. H2 changes a route string; H1 closes two comments; H3 re-measures counts.
- ☑ **One owner per fact** — No fact acquired an owner. `/basket` was already the canonical basket route with four existing consumers.
- ☑ **No duplicate entities** — None created.
- ☑ **No duplicate ownership** — None. `nav-bar.tsx` remains the sole owner of navigation; `workspace-header.tsx` of the header.
- ☑ **No duplicate state** — No state touched.
- ☑ **Extends existing architecture** — All three changes repair existing owners in place. No new pattern, component, hook, token, route or capability.
- ☑ **Progressive enrichment** — N/A; no knowledge entity.
- ☑ **Knowledge domain compliance** — N/A; no knowledge domain introduced or extended.
- ☑ **Honest gaps over fabricated information** — **Load-bearing here.** Partners, Support and Community are reported as absent rather than built from invented content; the Partners door stays closed for exactly the reason PROD2 closed it.
- ☑ **No permanent synchronisation bridge** — None.
- ☑ **Evolution over replacement** — Nothing replaced.

## AI ARCHITECTURE COMPLIANCE

- ✓ Uses the canonical Intelligence Platform — **no intelligence code changed.** The audit reads the Capability Registry; it adds nothing to it.
- ✓ Uses the Capability Registry — read-only.
- ✓ Uses the Intent Engine — untouched.
- ✓ Reuses existing business services — no service touched.
- ✓ **Does not create another assistant** — no second assistant. Companion remains the single `FloatingAssistant` presence; §1.1 explicitly declines to give it a room.
- ✓ Does not duplicate conversation state — untouched.
- ✓ Uses registered capabilities only — no capability invoked.
- ✓ Uses permission-aware access — unchanged; §2 **reports** that behavioural insights and recommendations are `assertAdmin` and does not alter that gate.
- ✓ Produces honest gaps rather than fabricated knowledge — see §1.2.

## EXPERIENCE & UI GOVERNANCE COMPLIANCE

- ✓ **UX Governance Checklist** (EXP §18 + Premium §17) — H2 removes friction (a dead-end 404); H1 restores the shell itself. *Premium is the perceptible result of care; a broken build and a 404 behind your own basket are both felt as its absence.*
- ✓ **UI Governance Checklist** (UIA §18) — no visual value, token, colour, spacing or motion changed.
- ✓ **Experience Review Questions** (EXPLANG §6) — the feelings served are **reassuring** and **effortless**. No anti-pattern adopted; nothing added to any screen.
- ✓ **Experience Test** (EXPBLUE §15.3) — Shopping: *this is the room where the household prepares to leave the house; they should feel ready; the one thing it helps them do is leave with the right basket.* H2 restores the door to that basket.
- ✓ **Blueprint Checks** (EXPBLUE §15.2) — no room's place character, orchard, light, material, Companion place, shell constancy or Living Detail was changed. **The shell's constancy was restored, not altered.**
- ✓ Conflicts resolved in the Experience Architecture's favour — the one conflict was governance-vs-mission on filing path (declared above), resolved for the governing document.
- ✓ Nothing owns a fact at the presentation layer — no value invented; every absence in §1.2 renders as absence.
- ✓ Any new visual pattern retired its predecessor — **no new visual pattern introduced.**

## PRODUCT REGISTRY COMPLIANCE / IMPACT

- **Registry affected:** NO.
- Entries **created**: NONE · **updated**: NONE · **retired**: NONE.
- No page, route, journey, feature, capability, dialog, drawer, wizard, notification, integration, API or setting was added, removed or renamed. H2 repairs a link to an **already-registered** route; H1 and H3 change no surface.
- Any entry set to `public`/`household`: N/A.
- Product knowledge written into a prompt, template or fallback string: **NO** (Rule PKR27).

> ⚠️ **Flagged for the owner, not actioned:** §1.3 lists five built-but-unlinked surfaces. Rule PKR — *"anything shipped-but-unlinked is in Hidden Experiences, visibility: admin"* — suggests `/import-recipe`, `/quick-meal` and `/supermarkets` may need Hidden Experiences entries. Confirming that requires reading the existing entries and is **outside this scope**; recorded in §7.

## ADOPTION REGISTER IMPACT

- **Register affected:** YES.
- Owners **created**: NONE · **adopted**: NONE · **retired**: NONE.
- **Rival ceilings raised: NONE.** Three ceilings **lowered** (H3) — the permitted direction.
- Exemptions **added**: NONE.
- `npm run adoption:check` passes: **YES** — 81 passed · 0 notices · 0 failed.

---

## DEFINITION OF DONE

**Success looks like:** the client builds; no door in the house leads to a not-found page; the adoption gate is green; and the household experience is documented room by room with every gap named honestly rather than filled with invented content.

**What must not break:** navigation (`nav-bar.tsx` owns every door), the header (`workspace-header.tsx`, 24 consumers), the Shopping workspace, the admin-only gating on behavioural insights and recommendations, and the closed Partners door.

---

## VALIDATION PERFORMED

| Command | Outcome |
|---|---|
| `npx vite build` **at rollback tag** | 🔴 **FAILED** — `nav-bar.tsx:392: Expected "}" but found "&&"` |
| `npx vite build` **after H1** | 🟢 **PASSED** — no errors |
| `npx tsc --noEmit` at tag | 2 errors *(parse bail — masking)* |
| `npx tsc --noEmit` after H1 | 94 errors, **all pre-existing in `server/tests/*.ts`**, **0 in `client/`** |
| `npm run adoption:check` | 🟢 **81 passed · 0 notices · 0 failed** |
| `grep -rn 'href="/shopping"' client/src` | 🟢 no matches — dead link eliminated |

**Distinguishing introduced from pre-existing failures:** the 94 type errors are pre-existing and were *revealed*, not caused, by H1 — every one is in `server/tests/*.ts`, a directory this change does not touch, and `client/` typechecks clean. They are **not fixed here**: they are test-harness drift against evolved types, outside this scope, and recorded in §7.

**Not run:** the full test suite, and no browser verification of the Shopping menu. H2 is a one-token route-string correction verified by grep and by the four sibling links proving the target; the manual step is specified below and **has not been performed by me.**

---

## MANUAL VERIFICATION STEPS

**1 — The basket door (H2)**
- *Starting page:* `/shopping-workspace`, signed in
- *Action:* open the workspace overflow (⋯) menu → click **Basket**
- *Expected:* navigates to `/basket`, the Shopping list page renders
- *Success criteria:* the not-found page never appears
- *Regression checks:* "Recalculate Scores" still works; the clear-basket dialog still opens; `/shopping-workspace` remains the nav target for Shopping

**2 — The shell (H1)**
- *Starting page:* any authenticated room
- *Action:* open the apple menu; as an admin, confirm Admin appears; as a non-admin, confirm it does not
- *Expected:* menu renders; Profile present; **Partners absent**
- *Success criteria:* bottom navigation renders all 8 items and the app boots at all
- *Regression checks:* the header renders in all 24 consuming pages; the admin banner still renders on all admin routes

**3 — Intelligence quiet-when-unnecessary**
- *Starting page:* `/cookbook`
- *Action:* observe the ambient strip, then type in search
- *Expected:* the strip is collapsed or absent when there is nothing to say, and **hidden entirely while searching**
- *Success criteria:* it never competes with a search the household began

## USER ACCEPTANCE EVIDENCE

**None captured.** No screenshots, no recorded session, and the three manual steps above **have not been executed**. This section is deliberately empty rather than populated with claims that were not verified — the failure mode this programme found in §3 (three "defects" reported without verification, all false) is the same one that would be committed by asserting acceptance that did not happen.

---

## DATA IMPACT

- **Reads existing data:** YES — read-only audit of the capability registry, routes and client surfaces.
- **Writes new data:** NO.
- **Changes meaning of existing data:** NO.
- **Requires backfill:** NO.

No schema, migration, store, column or runtime data path was touched. No household data was read, written or moved.

## TRUST CHECK

- **Could this mislead the user?** No. H2 removes a misleading door; H1 restores the shell. Nothing new is asserted to a household.
- **Could this fabricate certainty?** No — and this is the programme's central refusal: three rooms were asked for and **three are reported absent** rather than built from invented content. Partners stays closed for the reason PROD2 closed it.
- **Is anything guessed but shown as real?** No. Every finding in §1–§3 carries a `file:line`, and three reconnaissance claims were **retracted** in §3 when verification disproved them.
- **What happens if the system is wrong?** H2's blast radius is one menu item; if `/basket` were wrong the symptom is the identical 404 that exists today. H1 is a syntax repair proven by a passing build against a failing one.
- **No architectural duplication introduced:** YES.
- **No new source of truth created:** YES.
- **No runtime behaviour altered:** NO — H1 and H2 alter runtime behaviour deliberately (the app compiles; a link resolves). H3 is measurement only.
- **Every "verified" claim backed by a command that ran:** YES — see VALIDATION PERFORMED. Claims not backed by a command are marked **not run** or **not captured**.

## ROLLBACK PLAN

- **Rollback identifier:** `rollback/HOUSE_ACT1-household-experience-activation-20260718` → `057102ec`
- **Files modified:** `client/src/components/nav-bar.tsx`, `client/src/components/workspace-header.tsx`, `client/src/pages/shopping-workspace-page.tsx`, `docs/implementation/ux/adoption-register.json`, `docs/implementation/ux/ADOPTION_REGISTER.md`, and this report.
- **Rollback command:** `git reset --hard rollback/HOUSE_ACT1-household-experience-activation-20260718`
- **Verification after rollback:** `npx vite build` — ⚠️ **expected to FAIL** at `nav-bar.tsx:392`. That is the state the tag preserves. To keep the build fix while discarding the rest, revert `shopping-workspace-page.tsx` and the register files only.

## SCOPE LOCK

**Implemented:** H1 (build repair), H2 (dead basket link), H3 (register re-measurement), and the audit deliverables §1–§3 + §7.

**Explicitly excluded — NOT done:**
- Community, Support and Partners rooms — **refused with evidence** (§1.2)
- Any new UI for the eight unsurfaced capabilities (§2) — each needs its own design pass and Product Registry entries
- Navigation entries for the five orphaned surfaces (§1.3)
- Migration of `<DrawerContent>`/`<SheetContent>` onto `ui/overlay.tsx`
- Header adoption for `food-detail-page` / `food-comparison-page`
- The 94 pre-existing `server/tests/*.ts` type errors
- The `Nutrition` label / `/plant-diversity` path mismatch
- Any typography, spacing, colour, motion or animation change
- Execution of the manual verification steps

---

## OUTSTANDING RECOMMENDATIONS — PRIORITISED

| # | Recommendation | Value | Cost |
|---|---|---|---|
| **1** | **Fix the 94 `server/tests/*.ts` type errors.** They were invisible behind the parse failure for as long as it existed; the suite cannot be trusted until they are green | 🔴 High | M |
| **2** | **Give the seven discovery capabilities a door.** Fully built, bound, executable, zero UI — the single largest "make existing intelligence visible" win | 🔴 High | L |
| **3** | **Surface household learning beyond Profile.** It is the household's own behaviour, shown in one room out of thirteen | 🟠 Med-High | M |
| **4** | **Render nutrition enrichment somewhere.** Two enrichment services no room has ever displayed | 🟠 Med-High | M |
| **5** | **Link `/compare`.** The only household surface of the comparison engine, reachable by URL alone | 🟠 Med | S |
| **6** | **Retire the overlay rivals.** Migrate 14 `Drawer`/`Sheet` call sites onto `ui/overlay.tsx`, or retire it. A 1-importer owner beside 14 rivals is UIA §17's named failure | 🟠 Med | M |
| **7** | **Resolve `Nutrition` → `/plant-diversity`.** Label and path disagree; plant diversity is one *part* of nutrition | 🟠 Med | S |
| **8** | **Decide the orphans.** Link, retire, or file `/import-recipe`, `/quick-meal`, `/supermarkets` as Hidden Experiences (PKR) | 🟡 Low-Med | S |
| **9** | **Govern the two ungoverned rooms.** `food-detail` / `food-comparison` onto `WorkspaceHeader`, or record an exemption with a reason | 🟡 Low-Med | S |
| **10** | **Decide Support and Community.** Product decisions, not engineering gaps | 🟡 Low | — |

### Suggested follow-on programmes

- **`HOUSE_ACT2 — The Intelligence Doors`** — recommendations 2, 3, 4, 5. The mission's *"expose existing intelligence"* half, which HOUSE_ACT1 could only audit. Highest value in the house.
- **`TEST1 — Test Harness Type Recovery`** — recommendation 1. Should precede ACT2; nothing else is trustworthy until the suite is.
- **`PX2 — Overlay & Header Convergence`** — recommendations 6, 9, plus the five owners at their adoption floor.
- **`PROD3 — Orphaned Surface Disposition`** — recommendations 7, 8, 10.

---

## OUTCOME

The house compiles, every audited door leads somewhere, and the adoption gate is green. The thirteen rooms are documented with `file:line` evidence, and the three that do not exist are **named as absent rather than invented** — which is the outcome the Brand Constitution's One Question asks for: *does this leave the household with less to carry, and could they trust everything it tells them?*

The mission's deeper request — *make existing intelligence visible* — is **audited but not delivered**. Eight capabilities still have no door. That is `HOUSE_ACT2`, and it is the most valuable work available in this house.
