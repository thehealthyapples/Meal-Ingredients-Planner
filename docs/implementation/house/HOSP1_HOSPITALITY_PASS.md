# HOSP1 — Hospitality Pass 1

**Document ID:** `HOSP1`
**Date:** 2026-07-21
**Status:** Implemented (code) · **Waiting for User** (Home Owner review)
**Rollback identifier:** `rollback/HOSP1-hospitality-pass-ee624d9a` → `ee624d9ae337d40e509dba48d19431e576092f72`
**Author of record:** Colin Clapson (owner / Home Owner) · implemented by Claude under the Engineering Workflow
**Session run file:** [`.engineering/session/runs/HOSP1_Hospitality_Pass_1.md`](../../../.engineering/session/runs/HOSP1_Hospitality_Pass_1.md)
**Governing parents:** `LIVING_HOME_EXPERIENCE_ARCHITECTURE.md` (LIVINGHOME1) · `LIVING_HOME_ENVIRONMENTAL_DRESSING_ARCHITECTURE.md` (LIVINGHOME2) · the Experience Governance canon

---

## 1. What this pass is — and the one thing it deliberately is not

The mission was to bring **warmth and hospitality** to the Living Home *through hospitality,
not features* — reviewing every room for warmth, composition, balance, whitespace, material
quality and sense of care, removing anything cold, corporate, visually heavy or unnecessary,
and *"implementing appropriate Environmental Dressing **where permitted**."*

The last clause is where this pass met a governing boundary, and the Architecture Bootstrap's
STOP-on-conflict rule required it be surfaced before any code was written:

> **Environmental Dressing is `DECLARED, NOT BUILT`.** `LIVINGHOME2` § 10.1 ships *"Nothing"*;
> § 10.2 states that **no dressing may ship until four named owner amendments land in their
> owners' own files** and the Dressing Register (its Phase 2) is built. Verified in code: there
> is no Dressing Register and no `verify:living-home-assets` dressing verifier; the layer sits
> at **Phase 0**. Therefore the mission's own examples — **bowls of apples, flowers, blankets,
> mugs, baskets, watering cans, seasonal hospitality objects** — are exactly the objects the
> architecture forbids shipping today. *"Where permitted"* resolves, for literal dressing
> objects, to **nowhere, right now.**

The owner (Colin Clapson) was shown this conflict and chose **Path A — the warmth-craft pass
only**: deliver hospitality through composition, whitespace, material and *care*, and by
removing cold/corporate tone — and add **no** literal dressing objects. The Environmental
Dressing layer stays unbuilt; this pass does not touch it, and does not make any of the § 10.2
amendments. (This is the same discipline `HOMEROOM1` recorded three days earlier: *"No
Environmental Dressing added — DECLARED-NOT-BUILT, LIVINGHOME2 § 10."*)

### 1.1 The second boundary this pass found: the house is already warm

The token, material, palette, shadow, whitespace and depth layers have already been warmed
platform-wide by prior programmes — `NORTH2` (the material warmth; *"white cards are the
universal signature of software"*), `INTARCH1`/`INTARCH2` (the ground plane and the two
surfaces standing on it), `ODL2`, `EXP1`, `UX2`/`UX3` (one house, one header), `UX_NAV1`. Every
token in `index.css` carries a documented owner decision. **Warming them again would fight
decisions already made and violate one-owner-per-fact.** The canonical empty/error owners
(`EmptyState`, `LoadError`) already speak in a warm, human voice (*"Nothing has been lost —
this is a problem at our end, not with your data"*).

That raised the integrity bar. Under the Premium Standard (`EXP2` § 17 — *"if the household
would not feel the care, it is decoration; if they would feel its absence, it is craft"*) and
ED8's refusal of *decoration-for-decoration's-sake*, a hospitality pass here must warm the
**genuinely cold spots that remain**, never manufacture a diff. So the pass was scoped from a
concrete cold-spot inventory of the household-facing rooms, coldest first.

---

## 2. Experience Constitution Check (§ 18.2 — answered before design)

- **Hospitality** — the change *is* the hospitality: it removes the coldest, most corporate
  moments a household meets (system-voice error toasts) and replaces them with the house's own
  warm, reassuring voice. Hospitality before productivity (GEA1).
- **Outcome** — the household is left with *less to carry*: an error now tells them what it
  means for their data and that nothing is lost, instead of reporting the software's own
  operation status.
- **Weight** — nothing is added to any room. No new surface, element, motion, or capability;
  felt weight goes *down*, not up (GEA2).
- **Voice** — rooms still only *report* (a failed save, an absent record); no room gained
  coaching, encouragement, or interpretation (GEA8/GEA21–23). The Companion is untouched.
- **Restraint** — copy only, plus two conversions onto an existing owner and one glyph swap; no
  ornament introduced (GEA-restraint).
- **Layer** — the work lives entirely at the Experience Implementation layer (strings and one
  component adoption); it originates **no** law and moves no rule (GEA20, downward-only).
- **Ownership / Agency** — no canonical ownership changed; nothing now decides on the
  household's behalf.

---

## 3. What changed — the warm voice, converged not invented

The house already contained the warm error voice (`weekly-planner-page.tsx`: *"Couldn't save
your week — your planner is unchanged, nothing has been lost"*). The cold remnants were the
un-passed call-sites still speaking in software's voice. Every change below **converges onto
that existing owned voice**; none invents a new one.

### 3.1 The cold error voice → the house's warm voice (copy only)

Bare `"Failed to …"` titles, the content-free `"Something went wrong - try again"`, the
stack-trace `"Scan Error"` label, and cold `"Import failed"` fallbacks were replaced with
`"Couldn't …"` + a short, honest reassurance / way-forward, across **every household-facing
room** (Companion, admin and dev surfaces deliberately excluded):

| Room / component | Warmed |
|---|---|
| Cookbook — `meal-detail-page` | 7 toasts (create copy, save, save-as, delete, add-to-basket ×2, import) |
| Cookbook — `meals-page` | 11 (add product ×2, barcode ×2, import meals, import recipe, add-to-basket ×3, add-to-planner, editable copy) + 1 internal fallback |
| Planner — `weekly-planner-page` | 11 toasts (settings, eaters, boost, item, diet ×2, guest ×2, rename, link ×2) |
| Planner — `day-view-drawer`, `PlannerBulkAssignPanel`, `AddToWeekModal`, `meal-completion-dialog` | 6 |
| Pantry — `pantry-page` | 2 (add to basket) |
| Shopping — `shopping-workspace-page` | 3 (clear list, clear items, read list) |
| Diary — `dashboard`, `import-diary-modal` | 3 (weight, save, file parse) |
| Products — `products-page` | 3 (barcode ×2, add product) |
| Quick meal — `quick-meal-page` | 3 (save recipe, basket list, save meal) |
| Household — `profile-page` | 6 (password ×2, leave/rename/remove household, apply template) |
| Sharing — `share-plan-dialog`, `shared-plan-page`, `templates-panel` | 8 |
| Scanning — `BarcodeScanner`, `SmartReviewPanelContent` | 2 |
| Auth — `auth-page` | 3 (reset ×2, verification) |

Formula, kept consistent: title *"Couldn't ⟨do the thing, in the household's words⟩"*; a
one-line description that reassures (*"Nothing has been lost — try again."*), names a way
forward (*"Try again in a moment."*), or gives an honest orientation (*"It's still in your
cookbook — try again."*). `variant: "destructive"`, control flow, and every mutation are
**unchanged** — only the words a household reads changed.

### 3.2 Two hand-rolled cold states → the warm `EmptyState` owner (composition)

- `meal-detail-page` — the bare `"Meal not found."` line + "Back to Meals" button → the
  canonical `EmptyState` (`variant="unavailable"`, ChefHat), *"This recipe isn't here — it may
  have been removed, or the link may be out of date. Your cookbook is waiting whenever you
  are."*, action *"Back to your cookbook"*. A warm, oriented, on-owner treatment instead of a
  cold 404 sentence.
- `supermarkets-page` — the hand-rolled `"No supermarkets found"` block → `EmptyState`
  (`variant="filtered"`, Store), *"No shops for this country yet — try another country, and
  we'll show what's nearby."* This is one of the UINORTH1-deferred inline empties, now
  converged onto its owner.

### 3.3 Spreadsheet `N/A` → a quiet, honest em-dash (copy)

`products-page` comparison table — the five literal `N/A` cells (THA Score / NOVA / analysis)
became a quiet `—` with a `title="Not yet known"`. `N/A` reads as a spreadsheet reporting
missing data; a dash is the gentle, un-corporate way to say *"we don't know this yet"* in a
dense table.

**Total: 22 files, +95 / −84.** No file outside the household-facing client was touched.

---

## 4. What was deliberately NOT done (recorded, not swept)

Held back on the same no-blind-sweep discipline UINORTH1/HOMEROOM1 established — each needs
per-surface visual verification, which is the Home Owner's judgement, not a blind transform:

1. **Environmental Dressing objects** — refused by governance today (§ 1); the layer stays
   `DECLARED, NOT BUILT`. Not deferred by taste — **forbidden until LIVINGHOME2 Phases 1–2
   land.**
2. **The token / material / palette / whitespace layer** — already warmed and owned; re-tuning
   it would fight prior owner decisions (§ 1.1).
3. **The pervasive uppercase-tracking micro-labels** (dozens across many rooms) — often
   deliberate hierarchy; a blind sweep risks flattening intent. Needs the Home Owner's
   per-surface eye.
4. **The spreadsheet-style comparison / diversity tables** — a composition redesign, not a
   copy pass; too heavy for Pass 1.
5. **Remaining `Loader2` page/section spinners → `Skeleton`** — UINORTH1 owns that convergence
   and explicitly staged the remainder; each needs a faithful per-page skeleton and visual
   verification.
6. **Internal `throw new Error("Failed to …")` plumbing** — error-handling strings consumed by
   react-query that do **not** surface to households (the visible toasts are warm); left as
   engineering plumbing rather than chased into control flow.

---

## 5. Architecture Compliance

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================
☑ One canonical identity
  Explain: One home, one voice. The change converges cold call-sites ONTO the
  house's existing warm error voice and the existing EmptyState owner; it invents
  no new voice, component, or variant.
☑ One owner per fact
  Explain: No token, colour, or rule touched. Toast copy is authored per-call-site
  (no canonical string owner exists for it); two hand-rolled empties were moved
  onto their real owner (EmptyState), reducing rival treatments, not adding one.
☑ No duplicate entities
  Explain: No entity, component, or store created. EmptyState/LoadError are reused,
  not re-implemented.
☑ No duplicate ownership
  Explain: Canonical ownership unchanged. Companion, navigation, business logic,
  workflows, AI, and tokens are byte-untouched.
☑ No duplicate state
  Explain: No state created or changed; every mutation, query, and control path is
  identical — only user-visible strings and one component adoption changed.
☑ Extends existing architecture
  Explain: Warms surfaces onto existing owners; adds nothing beside them.
☑ Progressive enrichment where appropriate
  Explain: A first measured hospitality pass; the deferred items (§ 4) are staged,
  not abandoned (continual-care, HOME_OWNER Principle 11).
☑ Knowledge domain compliance
  Explain: No knowledge domain touched; Product Registry impact is copy-only (§ 7).
☑ Honest gaps over fabricated information
  Explain: Strengthened. Errors now say what happened and that nothing was lost;
  "N/A" became an honest "not yet known"; absence states stay honestly empty.
☑ No permanent synchronisation bridge
  Explain: None; no scheduler, no derived store.
☑ Evolution over replacement
  Explain: Nothing retired; cold copy replaced in place by the warm voice already
  in the house.

If any item cannot be checked, implementation must stop and explain why.
```

### AI Architecture Compliance

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
No AI surface, capability, prompt, Context View, or Companion behaviour is created,
altered, or consumed. FloatingAssistant (the Companion) is byte-untouched and was
explicitly excluded from the sweep. No capability registered or consumed; no
conversation state; nothing here observes, interprets, or speaks.
```

---

## 6. Definition of Done

- **What success looks like:** every household-facing room speaks the house's warm, reassuring
  voice at its cold moments (errors, absences, unknown values), with no room redesigned, no
  feature added, and no dressing object shipped; this report exists and is indexed with the
  session record; the change is committed and pushed with the rollback identifier reported.
- **What must not break:** business logic, navigation, AI, Companion, workflows, canonical
  ownership, tokens — all **byte-untouched** (verified: no Companion/admin/dev/`index.css`/
  schema/routes/server file in the diff). Client typecheck clean; adoption gate at baseline;
  production build green.
- **Manual test steps:** `git diff --stat rollback/HOSP1-hospitality-pass-ee624d9a..HEAD`
  shows only household-facing `client/src` files + `docs/` + `.engineering/session/`; trigger a
  failed action (e.g. save with the server unreachable) and confirm the warm toast; open a
  missing meal URL and confirm the warm EmptyState; open the products comparison with an
  un-analysed product and confirm the quiet `—`.
- **Product Registry impact:** copy-only. No route, capability, page, or claim changed; the
  affected surfaces' entries (error/empty presentation tone) are refreshed in the same spirit,
  with no inventory field touched.

---

## 7. Data Impact

- **Reads existing data:** NO change — the same queries and fields are read; `meal-detail`'s
  EmptyState and `products`' dash render from data already in hand.
- **Writes new data:** NO. No mutation, schema, or migration touched.
- **Changes meaning of existing data:** NO. Only the words presenting outcomes changed.
- **Requires backfill:** NO.

---

## 8. Trust Check

- **Could this mislead the user?** No — it makes the product *more* honest: a failed operation
  now states what it means for the household's data (nothing lost) instead of a bare system
  status; an unknown value now says "not yet known" instead of the ambiguous "N/A".
- **Could this fabricate certainty?** No. Reassurances are literally true (the failed mutations
  changed nothing) and generic where they must be ("try again in a moment").
- **Is anything guessed but shown as real?** No. No inference, no dressing, no personalisation
  — the copy is identical for every household.
- **What happens if the system is wrong?** A copy defect, corrected by a one-line edit; no data
  or behaviour path can be affected because none was touched.
- **Special-category exposure:** none — no household data is read, shown, or inferred.
- **No architectural duplication introduced:** YES. **No new source of truth:** YES. **No
  runtime behaviour altered:** YES (strings + one component adoption only).

---

## 9. Rollback Plan

- **Rollback identifier:** `rollback/HOSP1-hospitality-pass-ee624d9a` → `ee624d9ae337d40e509dba48d19431e576092f72` (annotated tag; tree clean at tag time apart from the session dashboard's heartbeat line).
- **Files modified:** 22 household-facing `client/src` files (§ 3 table) · `docs/implementation/house/HOSP1_HOSPITALITY_PASS.md` (this report) · `.engineering/session/CURRENT.md` (dashboard row) · `.engineering/session/runs/HOSP1_Hospitality_Pass_1.md` (session record).
- **Rollback command:**
  ```
  git checkout rollback/HOSP1-hospitality-pass-ee624d9a -- client/
  git commit -m "Rollback HOSP1 (revert hospitality copy pass)"
  ```
- **Verification after rollback:** `git diff rollback/HOSP1-hospitality-pass-ee624d9a -- client/` is empty; typecheck / adoption / build return to the pre-HOSP1 baseline.

---

## 10. Scope Lock

- **Implemented scope:** warm error/empty/unknown-value copy across household-facing rooms
  (converged onto the house's own voice); two hand-rolled cold states → `EmptyState`; five
  `N/A` cells → an honest em-dash. Report, session record, dashboard row.
- **Explicitly excluded (byte-untouched):** **all Environmental Dressing** (LIVINGHOME2 stays
  `DECLARED, NOT BUILT`; the four § 10.2 amendments are NOT made) · every design token and
  `index.css` · the Companion (`FloatingAssistant`) · navigation · business logic · schema ·
  routes · state · workflows · canonical ownership · admin and dev surfaces · AI capabilities,
  prompts, and Context Views.
- **Deferred, recorded, not taken (§ 4):** the uppercase-tracking sweep · the spreadsheet-table
  redesign · the remaining `Loader2 → Skeleton` conversions · internal non-surfaced `throw`
  strings — each awaiting the Home Owner's per-surface visual judgement.

---

## 11. Manual Verification

1. `git status` confirmed clean before work apart from the session heartbeat; the rollback tag
   `rollback/HOSP1-hospitality-pass-ee624d9a` was created and verified to resolve to
   `ee624d9a` **before** any file was written, and reported.
2. The Architecture Bootstrap conflict (Environmental Dressing `DECLARED, NOT BUILT`) was
   surfaced and the owner's Path-A decision recorded before any code was written.
3. A cold-spot inventory of the household-facing rooms drove the scope; changes were made
   coldest-first and confined to copy + two owner-adoptions + one glyph swap.
4. `git diff --name-only` confirmed **no** Companion / admin / dev / `index.css` / schema /
   route / server file is in the diff.
5. Gates re-run after the full edit set (results in § 12); no build/behaviour path exists in
   the diff, and none is claimed to have been exercised beyond confirming the diff is
   copy/presentation only.

---

## 12. Verification results

- **Client typecheck:** clean. `npm run typecheck` reports **zero `client/` errors** (verified
  by `grep -E '^client/'` → none). The only errors are pre-existing **server-side** ones
  (`server/tests/*`, `server/intelligence/*`, `server/scripts/*`) — and the diff touches **no
  `server/` or `shared/` file at all** (`git diff --name-only …-- server/ shared/` is empty),
  so every server error is definitionally pre-existing and none is attributable to this pass.
  (An earlier "server/tests only" characterisation reflected a `tail`-truncated view of the
  same output; the full list is broader and equally pre-existing.)
- **Adoption gate:** `npm run adoption:check` → **100 passed · 0 notices · 9 failed** — byte-identical
  to the UINORTH1/HOMEROOM1 baseline; the 9 are pre-existing, zero introduced. (Converging two
  hand-rolled empties onto EmptyState adds no rival treatment, so no ceiling moved.)
- **Production build:** `npm run build` → **exit 0** (4 pre-existing warnings).

---

## 13. User Acceptance Evidence

- **State: Waiting for User.** Acceptance is the Home Owner's review of the warmed surfaces.
- **The decision this pass records rather than assumes:** that *"appropriate Environmental
  Dressing where permitted"* means, today, **no dressing objects** — because LIVINGHOME2 forbids
  shipping any until its Phase 1–2 amendments land. The owner confirmed this (Path A) rather
  than have it assumed. The hospitality the mission asked for is delivered by the means the
  canon *does* permit now: the house's own warm voice, reaching the cold moments it had not yet
  reached.
- **Evidence for review:** this report; the session record at
  `.engineering/session/runs/HOSP1_Hospitality_Pass_1.md`; the diff (22 files, +95/−84, copy +
  two EmptyState adoptions + em-dash); and the deferred backlog (§ 4) for the next pass.

---

*A home is warm before its family walks in — but its warmth is in how it speaks to them when
something goes wrong, not in props on the shelf. This pass gave the whole house one warm voice
at its coldest moments, and left the bowl of apples for the day the architecture is ready to
set it down.*
