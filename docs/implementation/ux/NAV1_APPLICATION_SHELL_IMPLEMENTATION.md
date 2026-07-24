# NAV1 — The Shared THA Application Shell

**Status:** Complete — awaiting owner review
**Date:** 2026-07-19
**Rollback ID:** `rollback/NAV1-application-shell-20260719` → `993e1bc8`
**Session record:** [`.engineering/session/runs/NAV1_Application_Shell.md`](../../../.engineering/session/runs/NAV1_Application_Shell.md)
**Screenshots:** [`docs/ui-audit/nav1-application-shell/`](../../ui-audit/nav1-application-shell/)

---

## 1. Headline

**The shell already existed. What did not exist was a header that could not be
switched off — and the pages that had switched it off were the ones nobody
looked at.**

Most of this brief was already built and shipping: the shared shell, the bottom
navigation, active highlighting, responsive behaviour, and the shared page
content column. The brief's own framing — *"implement the shared application
shell"* — described something the platform had. Rather than rebuild it, this
workstream measured what was actually missing and closed that.

Two things were missing. One was a real defect:

- 🔴 **The top header was opt-in, not permanent.** `WorkspaceHeader` *portals*
  into a slot the shell provides (`workspace-header.tsx:495`), which means a page
  only had a header **if it chose to render one**. Three route groups did not:
  `/compare`, `/import-recipe`, and **all 13 `/admin/*` pages**. Worse, and
  affecting every household on every room: the slot is empty during the shell's
  `isLoading` state, during **every lazy-chunk `Suspense` fallback**, and after
  **every caught render error** — so since PX1-W3 made every page a lazy chunk,
  walking between rooms transiently painted a **headerless app**.
- 🟡 **The Companion had no entry in the header.** It existed only as the
  floating trigger.

And one item in the brief was **stopped and taken to the owner before any code
was written**, which is recorded in § 6.

---

## 2. Scope stop — the navigation list

The mandatory Architecture Bootstrap (`docs/architecture/README.md`) states: *"If
a proposed change conflicts with the governing architecture: **STOP, explain why,
and do not continue until approved.**"*

The brief specified a seven-item navigation list — *Home, Cookbook, Shopping,
Pantry, Intelligence, Planner, Diary*. The canonical `NAV_ITEMS`
(`nav-bar.tsx:46`) holds **nine** and declares itself *"the single source of
truth for every navigation surface"*. Adopting the brief's list would have:

1. **removed `/orchard`** — the room `COMM2` shipped the same day, carrying
   written governance reasoning, whose session is still *Waiting for User*;
2. **removed `/analyser`**, leaving the room reachable only by typed URL;
3. **renamed "Nutrition" to "Intelligence"** — where `PROD4` made `/nutrition`
   canonical *because* the old name described a part rather than the whole, and
   where "Intelligence" is a platform-wide architectural term, not a room;
4. **forked the list Home reads its doors from** (`roomsByHref`, NORTH1).

It also intersected an **open owner decision**: COMM2 § 11.4 had already flagged
that nine rooms do not fit a 390px viewport at the 44px touch floor, and offered
three options that had not been ruled on.

**Owner ruling (2026-07-19): keep the canonical nine.** *"Build the shared
application shell around the existing canonical navigation. This task is about
implementing the shell, not redesigning the information architecture."*

**`nav-bar.tsx` is therefore byte-unchanged by NAV1.** No room was added,
removed, renamed or reordered.

---

## 3. What was built

### 3.1 `AppShell` — the shell, named

`client/src/components/layout/app-shell.tsx` (new).

This did not *create* the shell; it **named** it. The shell was ~50 lines of
inline JSX inside `ProtectedRoute` in `App.tsx`, which meant the walls of the
house had no owner that could be imported, tested, or pointed at. The structure
is **moved, not rewritten** — banners, header region, error boundary, main
column, bottom nav and the one `FloatingAssistant`, in the same order, with the
governing comments carried across intact.

`App.tsx` now routes and does not draw. `ProtectedRoute` fell from ~60 lines to 12.

### 3.2 Header permanence — the defect closed

The header is now the **shell's**, not the page's:

- the shell renders the canonical header **by default**;
- a page that renders its own **replaces** it rather than adding to it;
- presence is tracked by **registration on mount/unmount only** — never on every
  render, which would be a render loop.

Two decisions worth stating, because both had a wrong-looking easy alternative:

**It is not a second header component.** The default is the *same*
`WorkspaceHeader` every room already uses, rendered with `role="shell"` so it
does not register itself and cancel the very fallback it is. One owner of the
banner (Adoption Register row 1), used two ways. Authoring a second header
component would have recreated `PageHeader.tsx` — the unadopted rival PX1-W4.7
deleted.

**Room names are not redeclared.** `NAV_ITEMS` is the single source of truth for
every navigation surface, so a second list of room names would be a second owner
of every room's name. The shell reads labels from there (`resolveShellRoom`) and
adds only what that list does not hold: the realm tint, and names for the
authenticated surfaces that are *not* rooms.

**No page file changed to gain a header.** All 28 pages that draw their own are
untouched; the three route groups that drew none now get the shell's.

### 3.3 The Companion entry

`client/src/components/conversation/companion-open.ts` (new) + a listener in
`FloatingAssistant`.

The Companion is *"the friend at the counter — a presence, not a room"*
(Experience Blueprint § 9), which is why this is a doorway and not a
destination: it opens the one assistant and appears in no navigation list.

The header **asks** rather than controls, via a `tha:open-companion` window
event — the same idiom the bottom nav already uses for `tha:open-workspace`. An
existing pattern followed, not a new one invented. The Companion keeps sole
ownership of its own panel state (PHASE5D: one assistant, one channel), which
lifting the state into the shell would have taken from it.

### 3.4 The contextual rail — built, and honestly unadopted

`client/src/components/layout/shell-slots.tsx` (new) — `RoomActions`.

A desktop-only (`lg`+) rail for **the actions of the room you are standing in**.
UX1 is untouched: nothing in it is navigation, and `BottomNav` remains the sole
primary navigation at every size.

⚠️ **No room renders `RoomActions` today, so the rail never appears** — it is not
rendered at all until a room declares actions, so it costs a household nothing.
This is **recorded in the adoption register as a declared gap, not hidden**
(UIA § 17: *"authored-but-unadopted must be impossible to hide"*), because
deciding what each room's contextual actions *are* is room content, which this
brief expressly placed out of bounds. It should be **adopted or deleted by NAV2**
and must not sit in the tree looking live — that is exactly the `PageHeader.tsx`
failure the register exists to end.

It uses a **portal, not lifted state**, and the reason is not taste: a room's
actions are arbitrary JSX whose identity changes every render, so pushing them
through `useState` sets state during render and loops forever.

---

## 4. Verification

| Gate | Result |
|---|---|
| Browser, 6 routes × 2 viewports | **12/12 passed · 0 page errors** |
| `npm run typecheck:ci` | 16 pre-existing regressions, **0 introduced** (proven, § 4.2) |
| `npm run build` | 🟢 green, **4 warnings — the same 4** prior sessions recorded |
| `npm run adoption:check` | **83 passed** (was 80) · 9 failed, **all pre-existing** (§ 4.3) |
| `npm test` | 🔴 **RED — 2 failures, proven pre-existing at the rollback tag** (§ 4.4) |
| Files changed | 3 modified, 4 added. **Zero server files. Zero page files. `nav-bar.tsx` untouched.** |

### 4.1 The browser evidence

`scripts/capture-nav1-application-shell.ts` → `docs/ui-audit/nav1-application-shell/`.

The route list proves the claim rather than touring the product: `/compare`,
`/import-recipe` and `/admin` **had no header at all** and were **not modified by
NAV1** — so a header in those shots is the shell's, by construction. `/home`,
`/cookbook` and `/pantry` prove the opposite case: the default stands down and
there is **exactly one** header, not two.

```
desktop  /compare        landed=/compare    headers=1 nav=1 companion=1 rail=0 pips=0 err=0
desktop  /import-recipe  landed=/cookbook   headers=1 nav=1 companion=1 rail=0 pips=1 err=0
desktop  /admin          landed=/admin      headers=1 nav=1 companion=1 rail=0 pips=0 err=0
desktop  /home           landed=/home       headers=1 nav=1 companion=1 rail=0 pips=1 err=0
desktop  /cookbook       landed=/cookbook   headers=1 nav=1 companion=1 rail=0 pips=1 err=0
desktop  /pantry         landed=/pantry     headers=1 nav=1 companion=1 rail=0 pips=1 err=0
… identical on mobile (390×844) …
12/12 passed
```

🔴 **My own harness was wrong first, twice, and both are recorded rather than
quietly fixed:**

1. It asserted **DOM counts** and reported `companion: 2` on every route, which
   reads as a duplicated button and is not one — `WorkspaceHeader` renders a
   desktop arm and a mobile arm and hides one with CSS, so the basket and the
   profile menu have *always* been in the DOM twice. The harness now asserts
   **visible** elements. A passing assertion for the wrong reason is worse than a
   failing one.
2. It reported an active nav pip on `/import-recipe`, which is impossible for a
   route in neither `NAV_ITEMS` nor its aliases. Recording the landed URL
   explained it: **`/import-recipe` redirects to `/cookbook`.** So its
   headerless state was real in code but **unreachable in practice** for this
   household — stated plainly, because claiming a fixed visible defect there
   would be a claim this evidence does not support. `/compare` and `/admin` are
   the two genuinely-reachable cases, and both are proven.

### 4.2 Typecheck — 0 introduced, proven not assumed

The gate reports 16 regressions, in four **server test files** NAV1 never
touched. Proven by removing NAV1's own files and re-running: the same four files
failed with the work absent, so they belong to the uncommitted prior-session work
in the tree, not to this change.

🔴 **That proof nearly cost something, and it is recorded as a near-miss.** The
stash was scoped with a pathspec, but `workspace-header.tsx` also carried
**COMM2's uncommitted `| "orchard"` realm addition**, so stashing "my" file
stashed someone else's unfinished work with it — visible as `orchard-page.tsx`
appearing in the baseline's error list. It was restored intact and verified
(`grep -c '"orchard"'` → 1) before continuing. **Do not `git stash` in a tree
holding another session's uncommitted work**, even with a pathspec.

### 4.3 Adoption register

Two rows added (`app-shell`, `shell-slots`), both passing their floors: **80 → 83
passed**. The 9 failures are pre-existing and unrelated — proven by confirming
that none of the nine orphaned modules was ever imported by `App.tsx`, the only
file whose imports NAV1 removed.

`npm run adoption:record` also tightened three ratchets and re-dated one, which
is the ratchet's designed direction but **was measured against a tree containing
other sessions' uncommitted work** — noted so it is not mistaken for a NAV1
claim.

### 4.4 Test suite

`npm test` is ~170 server-side suites. **NAV1 changes no server file**, so the
suite cannot exercise it; it is run as a regression check, not as evidence for
the feature. The feature's evidence is § 4.1.

🔴 **`npm test` is RED, and it was already red before NAV1 existed.**

```
104 suites ran · exit 1
test:benchmark-conversation-isolation — 24 passed, 2 failed
  ✗ question 2 could resolve pronouns against question 1's entityRefs
  ✗ question 1's entityRefs still exist, but only inside question 1's now-closed thread
```

The `&&` chain stops at the first failing suite, so **the ~66 suites after it did
not run** and this is *not* a green-suite claim for them either way.

**Proven pre-existing, not asserted.** The failure is deterministic (identical on
two consecutive runs, not flaky), and it was reproduced **at the rollback tag
`993e1bc8` in a clean detached worktree containing no uncommitted work at all** —
same suite, same `24 passed, 2 failed`. It is therefore not NAV1's, and **not the
COMM1A/COMM2 work this commit carries** either. It is committed-state debt on
this branch.

NAV1 touches **zero server files** (every server file in the working tree belongs
to COMM1A / COMM2 / BUS1), and this suite is server-only — so there is no
mechanism by which a client-side shell change could reach it.

**It is not fixed here.** It belongs to the Benchmark/BENCHINT area, and fixing
another workstream's failing test from a navigation-shell session is the drift
these protocols exist to prevent. It is recorded, and recommended in § 7.

Two earlier attempts to run the suite produced unusable logs — the first was
truncated to its final suite, the second was killed when its launching shell
returned — and **neither was reported as a result**.

---

## 4.5 🔴 This commit carries unreviewed community work

**The commit that ships NAV1 also contains previously uncommitted COMM1A and
COMM2 work, because the changes could not be safely separated.** Stated here
rather than left to be discovered in the diff.

All three files NAV1 modified were **already dirty when this session began**,
carrying another session's work:

| File | Also contains |
|---|---|
| `client/src/App.tsx` | COMM1A's `/invitation` route; COMM2's `/orchard` route |
| `client/src/components/workspace-header.tsx` | COMM2's `\| "orchard"` `PageRealm` |
| `client/src/components/conversation/FloatingAssistant.tsx` | COMM2's orchard surface + label |

This is not merely co-location — it is a **compile dependency**:
`app-shell.tsx` maps `/orchard` to the `"orchard"` realm, so NAV1 does not
typecheck without COMM2's type addition. Committing NAV1 alone would have left
`HEAD` not building.

**Owner ruling (2026-07-19): commit together**, following the precedent of commit
`1f7be63a` — *"Seven prior-session workstreams — committed together because they
cannot be split."*

Consequences, so they are not discovered later:

- **COMM1A and COMM2 were still `Waiting for User` in `CURRENT.md` when this
  landed.** Their own open items are unchanged and still open — in particular
  COMM2 § 11.4 (nine rooms do not fit 390px) and COMM2's finding that no
  household can yet invite another.
- **NAV1 modified none of their work.** It was carried, not edited, not
  reviewed, and not extended. `nav-bar.tsx`, `orchard-page.tsx` and
  `invitation-page.tsx` are untouched by this session.
- Their session records remain the authority on their status; **this commit does
  not constitute their review.**

---

## 5. Compliance

**Architecture Compliance.** No new owner of an existing concern; the shell is an
extraction, and the header keeps its single owner. No schema, migration, route,
capability or business logic touched.

**Experience & UI Governance.** The Experience Test (Blueprint § 15.3) requires
every screen to answer *which room is this* — which is precisely what a headerless
page could not do, and what `resolveShellRoom` now answers even before a page has
loaded. The error boundary stays *inside* the shell, so a broken surface is never
one the household cannot leave (PX1-W0), and the header is now rendered *above*
that boundary rather than by the page inside it — so a caught error keeps its
header by construction. ⚠️ **That last point is verified by reading the
structure, not by test: the captures exercise no error state, and no assertion
covers it.** Stated as a structural property, not as evidence. UX1 is untouched.
Blueprint § 6.1 is untouched: no orchard backdrop was reintroduced.

**Adoption Register Compliance.** Both new owners recorded in the same change;
`npm run adoption:check` passes for both; the unadopted `RoomActions` is declared
rather than hidden.

**Product Registry Compliance.** ⚠️ **Not discharged.** NAV1 changes what a
household sees on three route groups, so `docs/product/` entries describing page
chrome may now be stale. This is named rather than silently skipped.

---

## 6. What was NOT done

- **The navigation list was not changed** — owner ruling, § 2.
- **No room content was redesigned and no business logic changed**, as briefed.
- **No page file was modified.** The header defect was closed in the shell, which
  is why 28 pages needed no edit.
- **The contextual rail is unadopted** — § 3.4.
- **The 9 pre-existing adoption failures and 16 pre-existing type errors were not
  fixed.** They belong to other sessions' uncommitted work; fixing another
  session's unfinished code from this one would be the drift this repository's
  protocols exist to prevent.

---

## 7. Recommended next

1. **BENCHINT3 — the red suite.** `test:benchmark-conversation-isolation`
   fails 2 assertions at `993e1bc8`, which means the branch's `npm test` has been
   red independently of this work, and the ~66 suites chained after it have not
   been running at all. That is the more serious finding in this report.
2. **NAV2 — adopt or delete `RoomActions`.** It must not sit in the tree looking
   live. Each room's contextual actions are that room's decision.
3. **NAV3 — the admin header.** All 13 `/admin/*` pages now inherit the shell's
   default header *above* `AdminBanner`. That is strictly better than nothing,
   but Admin having two stacked bars is a composition question this brief did not
   own.
4. **Product Registry sweep** for the chrome change (§ 5).
5. **Owner decision still open from COMM2 § 11.4** — nine rooms at 390px. NAV1
   deliberately did not resolve it.
