# LARDER5 — the canonical Living Larder Architecture

**Date:** 2026-07-24 · **Branch:** `claude-work` · **Risk:** 🟢 GREEN (governance + documentation only) · **Deployment:** NOT APPLICABLE — nothing built, nothing deployed

Two pieces of work, recorded together because they shipped in one session:

1. **`LARDER5`** — the canonical architecture of the Living Larder, designed from
   first principles and written to `docs/architecture/LIVING_LARDER_ARCHITECTURE.md`.
2. **The repository structure tidy** — 70 loose reports filed by workstream,
   taking `repo-structure-verify.sh` from 2 FAIL / 9 PASS to **11 PASS**.

**No React UI was modified. No schema, route, capability, token, asset, component
or string was created or changed. No deployment was made or authorised.**

---

## 1. Rollback

| | |
|---|---|
| **Architecture work** | `rollback/larder-architecture-20260724` → annotated tag object `d40190f0`, points at committed `1e0ac8ff` |
| **Repository tidy** | `rollback/repo-tidy-20260724` → annotated tag object `1a4d29c1`, points at committed `8e456d71` |
| **Rollback commands** | `git checkout rollback/larder-architecture-20260724` (undoes everything in this session), or `git revert 45f14909` (undoes only the tidy), or `git revert 30bdb0c5 8e456d71` (undoes only `LARDER5`) |
| **Data to unwind** | **None.** Zero schema changes, zero data changes, zero runtime changes. |

Both tags were created **before** any file in their scope was touched.

## 2. Commits

| Commit | What |
|---|---|
| `30bdb0c5` | `LARDER5` — the canonical Living Larder Architecture |
| `8e456d71` | `LARDER5` — record push-blocked status in the run file and dashboard |
| `45f14909` | Repository structure tidy — file 70 loose reports by workstream |

**All commits are pushed to `origin/claude-work`.** See § 7.

---

## 3. `LARDER5` — what was designed, and why it was needed

### The gap

The Larder already had the most complete canon of any room in the house:
`LARDER1` (what the room is and which owner every fact renders from), `LARDER2`
(the interior — six wings, furniture, product forms, availability language),
`LARDER3` (how it is inhabited — object behaviour, movement, shopping, removal,
memory, search), `LARDER4` (how it is built), `ASSET1` (what each object looks
like).

None of them asks: **where is the household standing, what are they looking at,
and what holds it all up?**

`LARDER2` names the furniture but never the *room the furniture is in* — the
walls it is fixed to, the floor it stands on, the eye it is seen with, the
opening the light comes through, or the plan that says which wing is where. That
silence is load-bearing, because every governing rule of the room quietly depends
on it:

- *"The furniture is built first and holds still"* (`LARDER4` § 6) needs something
  for the furniture to be fixed **to**. Without walls and a floor, "furniture" is
  a set of pictures on a field — a card grid with better artwork, which is the
  exact defect `LARDER4` § 9 rejects.
- *"Composed emptiness, never bare emptiness"* (`LARDER2` § I.8) is impossible
  without a room around the empty shelf. An empty shelf on a blank field is just
  a blank field.
- *"Take the object out of the house"* (`LARDER3` § 6) needs a **way out**.
- *"The room is known by heart"* (`LARDER3` RM2) needs a **fixed viewpoint**.
- *"Solidity descends with importance"* (`LARDER2` § I.4) needs an **eye level to
  descend from**.

This is a genuine architectural gap of the kind `CRAFT1` § 9 reserves new
architecture for — a question the existing canon cannot resolve, in a room whose
implementations have repeatedly been technically correct and spatially absent.

### The method

Designed under `CRAFT1` § 7.2, in order: the governing architecture read first,
the room designed from it as though no implementation had ever existed, and the
built room opened **only afterwards** — as reference material for the
implementation-considerations section, never as design authority.

### What `LARDER5` owns — eight things and no ninth

| | |
|---|---|
| **The Shell** | Floor, back wall, two returns, doorway, and a bounded top with **no ceiling drawn**. Composed entirely within the Blueprint's *middle ground*, so **one ground, never nested — no card, panel or tile may sit on the room**. |
| **The Station Point** | One step inside the door, at standing eye height, facing the Dry Store wall square-on. **Fixed forever** — a room can only be known by heart if it is always seen from the same place. Explicitly never a plan view, never a corner three-quarter view, never a walk-in space. |
| **The Viewing Angle** | The **long-lens one-point elevation**: the focal wall square and legible (legibility *is* the North Star), the returns and window reveal carrying the depth, **a jar never drawn in perspective**, and **no camera** — no zoom, pan, parallax or rotation. |
| **The Aperture** | **One opening, which is both the orchard window and the room's only light**, in the **left return** — because the house's one morning sits upper-left forever and *a window opposite the light is a second sun*. It throws the morning across the room onto the focal wall; the working surface and the produce baskets stand in it. Orchard at **E2**, seen through the wall's own reveal, **never as a page-header band**. |
| **The Plan** | Where each of `LARDER2`'s six wings stands, under three laws: *placement follows reach, not taxonomy* · *enclosure follows exposure*, so **a room can hold more by showing less** · *the plan is permanent*. |
| **Furniture as Navigation** | The room contains **no navigation control of any kind** — no tabs, chips, filters, dropdowns, accordions, breadcrumbs, sort or view-switchers, and no list of categories anywhere, because each is *a second, abstract copy of the room laid over the room*, which the household would learn instead of the room. Three verbs: **look · open · reach**. **Opening is disclosure in place, never replacement**; the room has **one address**. |
| **The two compositions** | **Desktop:** the whole volume in one view; surplus width becomes **air and light, never more content**. **Mobile:** the same room from the same station point through a narrower field of view — three walls transposed into one, entered through its light, **ending on the floor** so the room can be finished rather than scrolled forever. |
| **Personalisation + `RC1`–`RC12`** | The shell, viewpoint, light, plan and navigation are permanently the house's and are **never themed, configured or preferred** — *a room that can be configured cannot be known by heart*. The twelve **Room Composition Principles** are the transferable half, offered for inheritance by every future Living Home room through its own North Star and its own gates. |

### Why drag-and-drop becomes natural

Because the composition supplies **four real destinations**, all visible from the
station point: the shopping basket at the household's feet by the door, the
doorway at the near edge, the object's own shelf, and its home. Both
consequential acts are a short movement **toward the viewer and down** — the
physical motion of putting something in a basket or carrying it out. Nothing
requires a long precise traverse, nothing "enters drag mode", and every outcome
remains reachable by keyboard, screen reader, switch and tap (`LARDER1` § 10).

### Honesty applied to the architecture itself

One light source that agrees with the window it comes from; one scale so a large
jar is genuinely large; a floor so nothing floats. The reasoning is recorded in
the document: **a room that lies about its own light will not be believed about a
household's allergens.**

### What it does not do

It **restates no rule** — `LARDER1`–`LARDER4` and `ASSET1` are byte-untouched and
cited throughout. It **sets no value** — no colour, dimension, ratio, breakpoint,
duration or pixel; every value stays the UI Architecture's and every asset
specification `ASSET1`'s. It mints **no owner of any fact**. Implementation
considerations are recorded in a section of their own and **deliberately not
performed** — `LARDER4` § 14 still governs when a build may begin.

### Compliance

Architecture Compliance Checklist, Experience Constitution Check (all eight
questions), AI Architecture Compliance, Data Impact and Trust Check are answered
in full at `LIVING_LARDER_ARCHITECTURE.md` §§ 15.1–15.5. **No check fails; no
governing rule is contradicted.** Data Impact is nil in every direction: no
table, column, row, migration, capability, route or write path; no change to any
existing data meaning; no backfill.

---

## 4. The repository structure tidy

### Before

`repo-structure-verify.sh`: **2 FAIL / 9 PASS**. `docs/implementation/` held
**66** loose reports at its root; `docs/investigations/` held **4** — both
forbidden by `REPOSITORY_CONVENTIONS.md` § 1 rule 5 and § 4, and failing long
enough that the failure had become background noise.

### What was done

- **70 files moved with `git mv`** (92 renames recorded, history follows each
  file) into **existing** workstream folders. No new workstream folder was
  created — § 4 makes that a governance decision, not a filing convenience.
- **No file was renamed, edited, merged or deleted.** § 5 forbids renaming an
  existing document: a rename breaks every inbound citation for cosmetic gain.
- **Routing rule** applied where the vocabulary left a judgement call: *a report
  whose product is a governing architecture document* → `architecture/`; *a
  report whose product is running experience* → its room, or `house/`. So ED1/ED2
  (dressing runtime) → `house/`, while ED3 (which produced `LHDC1`) →
  `architecture/`, beside `CRAFT1`, `HOMEOWNER1`, `UIOWN1` and the `LHDC1`
  rename record.
- **`HOMEOWNER2_assets/`** travelled with `HOMEOWNER2_LIVING_HOME_REVIEW.md` into
  `investigations/house/`, so its relative image links stay valid.

### Citations repaired in the same change

| | |
|---|---|
| Absolute `docs/{implementation,investigations}/NAME.md` references rewritten | **243**, across **117** files |
| Relative links inside moved files repaired (they descended one level) | **43**, across **14** files |
| Broken-link audit | **154 before → 146 after**: 9 fixed, **0 newly broken** |

The audit was run by resolving every relative markdown link under `docs/` and
`.engineering/` against a checkout of the pre-tidy tag, then diffing the two
sets. The single entry the checker flags as new is a markdown **code span**, not
a link, and it pre-dates this change.

### The two collisions that were *not* resolved

`AFI1_AMBIENT_FOOD_INTELLIGENCE.md` and `FI20_FOOD_INTELLIGENCE_ACTIVATION.md`
each **already existed** in `intelligence/` with a **different body** — divergent
second copies of the same report.

- Both copies of both files entered in **one** commit (`057102ec`, *"Pre-HOUSE_ACT1
  checkpoint"*, 2026-07-18), so git history distinguishes neither.
- They diverge in **opposite directions** — the loose AFI1 is the longer of its
  pair, the loose FI20 the shorter — so no mechanical rule picks a winner.

Choosing between two accounts of the same completed work is a **content
judgement**, not a filing decision: merging would invent a third document nobody
wrote; deleting would discard a real record on a guess. Both were moved
**byte-unchanged** to `docs/implementation/intelligence/unresolved-duplicates/`
with a README naming the defect — so it is visible and owner-decidable rather
than hidden in a root nobody reads. **That folder has a definite end and is
deleted with the last pair.**

### Index corrections

- **The architecture index** (`docs/architecture/README.md`) was missing
  `LARDER2`, `LARDER3`, `LARDER4` and `ASSET1` — **four governing documents that
  had been in force since 22–23 July while invisible by navigation**, the exact
  defect `INTA1` § 4.1 names. The verifier's *"every architecture document
  indexed"* check was **failing** because of it, and now passes (confirmed by
  stashing the README change and re-running).
- **Both tree indexes** were rewritten to match reality. They listed 11 of the 26
  implementation folders and 11 of the 15 investigation folders, and the
  implementation index still assigned *"Companion presence and identity"* to
  `ux/` — which `DOCGOV2` moved to `companion/` on 2026-07-18.

### After

`repo-structure-verify.sh`: **11 PASS / 0 FAIL — "Repository structure is clean."**

---

## 5. Items requiring an owner decision

| # | Item | Why it was not decided here |
|---|---|---|
| 1 | **The aperture is on the left; the approved North Star imagery composes the orchard on the right.** | The one-morning law (Blueprint § 7) forces a single opening upper-left, and the imagery is explicitly *feeling and composition, not a wireframe* — so no rule is broken. But it is a **visible** divergence from an approved image, and the choice is the Home Owner's under `HOMEOWNER1`. Recorded at `LARDER5` § 17, not made quietly. |
| 2 | **The `/pantry` naming divergence**, inherited unchanged from `LARDER1` § 15. | Owned by the Register and the capability owners, not by a room architecture. |
| 3 | **The two divergent duplicate reports** (§ 4 above). | A content judgement about what actually happened. |
| 4 | **`REPOSITORY_CONVENTIONS.md` § 4's vocabulary table does not carry ~13 folders both trees actually use** (`pantry/`, `house/`, `companion/`, `experience/`, `architecture/`, `production/`, `rebuild/`, `repository/`, `nutrition/`, `health/`, `community/`, `shopping/`, `assets/`…). | Amending a governing document's vocabulary is its owner's decision. The divergence is marked with a dagger in both tree indexes so it is visible rather than papered over. |

## 6. Not touched — stated explicitly

Eight untracked items from **prior** sessions remain uncommitted, and were
deliberately left alone rather than swept into this session's commits:

```
.engineering/session/runs/LARDER_CATEGORY_FIRST_Living_Larder_Evolution.md
.engineering/session/runs/LIVING_LARDER_Canonical_Experience_Refinement.md
attached_assets/THA_Living_Larder_Assets/
client/src/pages/larder-shelves.ts
docs/implementation/evidence/2026-07-24-larder-category-first/
scripts/_tmp-larder-shot.ts
scripts/capture-larder-category-first.ts
scripts/verify-larder-category-first.ts
```

These include **source files and scripts from another session's in-flight work**
(one of them named `_tmp-`). Committing another session's uncommitted code as
part of a documentation change would misattribute it and could ship work that was
never finished. **They need the owner's decision: commit, finish, or discard.**

A pre-existing staged set of `attached_assets/ → archive/assets/` renames was
also present in the index throughout and was left untouched — every commit in
this session was made with an explicit pathspec so it was never swept in.

## 7. Push status — DONE

**All commits are pushed to `origin/claude-work`** (new remote branch), verified
by comparing heads:

```
origin/claude-work  4bc4f9f34aa95b0b423a5c5b99150f3b2df1d551
HEAD                4bc4f9f34aa95b0b423a5c5b99150f3b2df1d551   MATCH
```

The first attempt failed — *"Invalid username or token. Password authentication
is not supported for Git operations"* — because git had **no credential helper
configured**, not because no credential existed: `gh` was already authenticated
as `thehealthyapples`. `gh auth setup-git` wired the two together and the push
succeeded on the owner's explicit instruction.

`claude-work` now tracks `origin/claude-work`. **`main` was not touched, no pull
request was opened, and nothing was deployed.**

*(The preceding session recorded the same push as permanently blocked; it was a
missing credential helper, and it is now fixed for every future session in this
environment.)*

## 8. Definition of Done

- [x] Git status confirmed before any change; branch `claude-work`
- [x] Rollback protection created **before** any file change, and both identifiers reported
- [x] Architecture Bootstrap read (`docs/architecture/README.md` and the governing canon it names)
- [x] Room designed from first principles under `CRAFT1` § 7, existing implementation consulted only afterwards
- [x] `LIVING_LARDER_ARCHITECTURE.md` authored with full compliance blocks; no check fails
- [x] Architecture index updated; `repo-structure-verify.sh` index check FAIL → PASS
- [x] Repository structure tidied; verifier 2 FAIL → **0 FAIL**
- [x] Citations repaired and audited; 0 newly broken links
- [x] Session run file and recovery dashboard updated per the ESR protocol
- [x] Committed to `claude-work`
- [x] **Pushed to `claude-work`** — `origin/claude-work` at `4bc4f9f3`, heads verified equal (§ 7)
- [ ] **Home Owner review** of `LARDER5` and the four items in § 5
- [ ] **Implementation — NOT STARTED and NOT AUTHORISED.** `LARDER4` § 14 governs when a build may begin: *"Do not begin implementation on the strength of this document alone."*

---

*This session created no route, capability, entity, token, component, string,
asset, schema, migration or business logic, and changed no runtime behaviour. It
designed one room, and put the filing cabinet in order.*
