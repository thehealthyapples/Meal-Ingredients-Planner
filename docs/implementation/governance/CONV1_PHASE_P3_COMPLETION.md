# CONV1 Phase P3 — The Free Renames and Off-By-Ones

**Workstream:** `CONV1_Phase_P3_Renames_And_Off_By_Ones`
**Date:** 2026-07-16
**Rollback identifier:** `rollback/CONV1-phase-p3-renames-and-off-by-ones-20260716` → `7d1dd2ce`
**Status:** ✅ **COMPLETE** — all three items closed. Two of the three were not what the census said.

> **Scope.** CONV1 Phase **P3** only: `BEH-1` · `BEH-4` · `BEH-7`. No unrelated refactoring.
> Implementation report — it creates no rule, and where it and any governing document disagree,
> **this document is the defect.**

---

## 0. THE HEADLINE

**CONV1 filed `BEH-1` as *"a correct-by-accident name and a loaded gun … correct today, correct for
the wrong reason, one innocent change from wrong"*, with the architectural impact recorded as
**"A rename"**. It was already wrong, and the innocent change had already been made.**

The census's load-bearing claim — *"**No production code branches on `kind`** — the only
`kind === "child"` read is a test assertion"* — **is false.** Four live client sites branch on it,
and they do not merely read the word, they draw it:

> **THA renders a 👶 baby icon beside every household member who does not have an account, prints
> the raw value `child` to the household in a badge, and tags them `child` twice more in the
> Planner.** A live-in grandparent without an account is not *"to the Companion, a child"* — as
> CONV1 puts it — **they are a baby on the household's own Profile page.**

`kind` was never about age. It is `row.userId != null` — *does this person have a THA account*. The
platform holds **no age for anyone** (that is `SEC-5`'s open legal gate and `BEH-2`'s block), so no
derivation here could be about age even in principle. **The gun was not waiting to be picked up. It
had been fired, into the UI, and the census counted it as unloaded.**

**The second finding is `BEH-1`'s `"guest"` limb, which CONV1 records as a rival word and which is
worse than that.** `shared/household-eater.ts:8` already defines **`GuestEater`** — a *real* guest:
a visitor at a single planner entry, stored in `planner_entries.guestEaters`, who is **not a member
of the household at all**. So THA used one word for two opposite things, and both reached the model.
And `household-discovery-engine.ts` fabricated it against **its own stated hard boundary**, three
lines of documentation above the code:

> *"HARD BOUNDARIES: • **No fabrication: every field in `HouseholdDiscoveryItem` comes from a stored
> row.**"* — an account-less eater has no `household_members` row, so `role: "guest"` **came from no
> stored row.** The file breached its own boundary, in the same file, under the boundary.

**`BEH-4` was exactly right about the behaviour and wrong about the blast radius** (§ 3.1). **`BEH-7`
was the only item that was as advertised** — and it is one deletion (§ 5).

---

## 1. WHAT WAS COMPLETED

| Workstream | Verdict | Gate |
|---|---|---|
| **`BEH-4`** — starter meals seeded on the wrong days | ✅ **CLOSED** | **Executed against the real database:** pre-fix `Sunday, Monday, Tuesday, Wednesday` → post-fix `Monday, Tuesday, Wednesday, Thursday` |
| **`BEH-1`** — `kind: "child"` means *has no account*, and it reaches the language model | ✅ **CLOSED** | 295 assertions green across the 5 eater/household/context suites; the retired `"guest"` role is now **asserted absent** |
| **`BEH-7`** — the orchard runs behind every room as wallpaper | ✅ **CLOSED** | `adoption:check` **64 → 66 pass**; the new `orchard-exposure` ratchet **proven to fire** by re-introducing the defect |

---

## 2. THE MEASURE — re-run for this phase, never inherited (`CP11`)

| Signal | P2 close (baseline, re-run here) | **After P3** | Δ |
|---|---|---|---|
| `adoption:check` | 64 pass · 0 notice · **2 fail** | **66 pass** · 0 notice · **2 fail** | **+2 pass**; the 2 fails **identical and not P3's** |
| **Orchard mounted outside arrival** | **1 — `App.tsx:210`, behind every room** | **0 — and machine-enforced** | **the anti-pattern is gone AND cannot return silently** |
| **Starter-meal landing days** (executed) | **Sun · Mon · Tue · Wed** | **Mon · Tue · Wed · Thu** | **the code and the household now agree** |
| `typecheck:ci` | 32 regressions / 11 files | **32 regressions / 11 files — identical** | **0 added by P3** |
| Tests (11 affected suites) | — | **629 assertions, 0 failed** | — |
| `npm run build` | passes | **passes** | — |
| `verify:publication` | 22 domains: 🟢5 · 🟡12 · 🔴5 | **untouched — P3 owns no publication contract** | — |

**The 2 `adoption:check` failures are pre-existing and neither is P3's**, proved rather than
asserted: `[button-primitive]` raw `<button>` 539 vs ceiling 538, and `[orphans]`
`HouseholdNutritionPanel.tsx` — both present at HEAD before P3 touched a file, both from concurrent
sessions, both recorded identically in P2's report.

**Typecheck: 32 regressions exist; not one is P3's.** Proof, not assertion: the 32 span exactly 11
files — `notice-gateway.ts`, `household-nutrition-assembler.ts`, `pantry-intelligence-assembler.ts`,
`publication-checks.ts`, `publication-register.ts`, and six `test-*` files — and **P3 touched none of
them.** This is the same set P2 proved was not its own.

### 2.1 What could NOT be verified, stated rather than skipped

**`BEH-7` is a visual change and it was not visually verified.** Headless Chromium cannot launch in
this sandbox — `libglib-2.0.so.0: cannot open shared object file` — so no screenshot of a room
without the wallpaper exists. *(A concurrent session hit the same wall: the `.glibcheck.txt` and
`.libdirs_uxhome.txt` strays in the tree are its residue.)* What **was** verified instead: the source
(exactly 2 `<OrchardBackdrop>` mounts, both arrival), the machine gate (fires on re-introduction,
naming the file), and the client build. **A reviewer should look at a room before this ships.**

---

## 3. `BEH-4` — what was actually done

`server/storage.ts` — four readers, changed from `0,1,2,3` to `1,2,3,4`. **The key space was NOT
renumbered** (`HT8` — *"renumbering silently rotates every planner consumer by one day and no test
would catch it"*).

### 3.1 The correction: it is not "every new household"

> CONV1: *"**Every new THA household's starter meals** land on Sunday–Wednesday … It is the first
> thing a new household sees."*

**The seeder is `seedDemoData`, and it is reached from exactly one place: `POST /api/demo/start`
(`auth.ts:475`).** Registration (`/api/register`) calls `seedDefaultHouseholdItems` and
`seedDefaultFoodPantryItems` — **never** `seedDemoData`. A normally-registered household gets **no
starter meals at all**.

**So the reach is every *demo/trial* household, not every household.** The item still stands: the
trial *is* what a prospective household sees first, and it was off by one. **But the census
overstated it, and P3 reports the narrower truth rather than inheriting the wider claim.**

### 3.2 The key space, confirmed at the surface rather than assumed

CONV1 rests `BEH-4` on the converters at `storage.ts:1832/1863/1882` (`d.dayOfWeek === 0 ? 7 : …`).
Those are real, **and the decisive evidence is better**: the primary planner surface renders
`DAY_NAMES[day.dayOfWeek]` where **`DAY_NAMES[0] === "Sunday"`**
(`weekly-planner-page.tsx:102`), ordered for display by `MONDAY_FIRST_ORDER = [1,2,3,4,5,6,0]`
(`:104`) — **exactly `HT8`: stored `0 = Sunday`, the household's week starts Monday.**

So the household *saw* `dayOfWeek === 0` as **Sunday** while the code called that variable `monday`,
and because display is Monday-first, the stray Sunday meals appeared at the **far end** of the week —
a plan with a gap on Thu/Fri/Sat and a lone Sunday, where Monday–Thursday was intended.

### 3.3 It was executed, not reasoned

The fix was driven through the **real `seedDemoData` path against the real database**, reading back
the actual rows and naming them with the planner's own array. Then the four lines were reverted and
the same harness re-run, to prove the defect rather than describe it:

```
PRE-P3  → Landed on: Sunday, Monday, Tuesday, Wednesday   ← the live defect, reproduced
POST-P3 → Landed on: Monday, Tuesday, Wednesday, Thursday ← intended
```

*(The harness was temporary and is deleted; it authored nothing and is not a test.)*

---

## 4. `BEH-1` — what was actually done

**The vocabulary:** `"user" | "child"` → **`"account" | "no-account"`**, and the fabricated
`role: "guest"` → **`"no-account"`**. One derivation, one vocabulary, and it states the only thing
actually known: whether the person has a THA account.

**Server / shared (the word that reaches the model):**
- `shared/household-eater.ts` — the type, the derivation, and the doc comment, which now says what
  `kind` *is* and, explicitly, what it is **not** (an age; a guest).
- `server/intelligence/handlers/household-read-handler.ts:81` — the view type, the surface INT17
  composes into CONTEXT DATA.
- `server/intelligence/services/household-discovery-engine.ts` — the `"guest"` fabrication, retired.
- `server/routes.ts:9084` — a comment that told the next reader the wrong thing.

**Client (the four sites CONV1 said did not exist), per the user's direction — *say what is known;
drop it where it is irrelevant*:**

| Site | Was | Now | Why |
|---|---|---|---|
| `profile-page.tsx` icon | **`<Baby />`** for `kind === "child"` | `<PersonStanding />` for everyone | THA holds no age for anyone. It may not draw one. |
| `profile-page.tsx` badge | **`{eater.kind}`** — the raw value, printed | `No account`, and **only** on account-less eaters | The badge now earns its place: it explains why *those* eaters are the editable ones. |
| `profile-page.tsx` edit gate | `kind === "child"` | `kind === "no-account"` | **Unchanged in behaviour and now correct in meaning** — it always meant account-backing. |
| `weekly-planner-page.tsx` ×2 | `(child)` / `child` chips | **deleted** | **Not mislabelled — irrelevant.** Whether someone holds a THA account has no bearing on whether a meal suits them, which is the only question those rows ask. |

**Tests:** the fixtures that pinned the old words are updated, and `childMember` is renamed
`accountlessMember` — a fixture asserting `kind: "no-account"` under the name `childMember` would be
the exact confusion the item exists to remove. `test-intelligence-household-discovery-binding.ts`
now **asserts the retired word is gone** (`role !== "guest"`), so `BEH-1` cannot silently return.

### 4.1 What was found and deliberately NOT fixed

`household-discovery-engine.ts` also fabricates **`roleMap.get(uid) ?? "member"`** — an
account-backed eater with no `household_members` row is *told* to be a "member". **Same expression,
same fabrication class, same breached boundary — and outside `BEH-1`**, which names only the
`"guest"` rival. It changes behaviour for account-*backed* eaters, which is `OWN-1`/P4's ground.
**Recorded here as backlog rather than smuggled into P3.**

---

## 5. `BEH-7` — what was actually done

**One deletion:** `<OrchardBackdrop />` is gone from `App.tsx`, the mount that put a photographic
orchard — `position: fixed; inset: 0; objectFit: cover; opacity: 0.90` — behind **every room**. The
now-unused import is gone, and `main`'s `bg-background/25` scrim with it: a 25%-opacity scrim exists
only to soften wallpaper, and there is no longer any wallpaper to soften.

**No new principle was written.** That is the item's whole point — `NORTH2`'s refusal, and CONV1
risk `R8` (*"a new principle is written instead of obeying an existing one — the `BEH-7` reflex"*).
The canon was already right; the render was wrong.

### 5.1 The correction: one prohibition was breached, not three

> CONV1: *"a photographic orchard … **with a parallax** … **Three separate prohibitions breached by
> one component**."*

**There is no parallax.** The live component is 20 lines: a `fixed inset-0` div and an `<img>`. No
motion, no transform, no scroll listener. **§ 6.1's *"the orchard never animates"* limb was already
clean**, and § 16's *"the rendered world"* is not engaged by a still photograph. **One prohibition
was breached — *"the orchard is never wallpaper"* — and one is enough.** P3 reports the narrower
finding rather than inheriting the count.

### 5.2 The scope boundary: arrival is not a room

CONV1 names one mount. **There are three.** The other two are `orchard-shell.tsx` (→ `/auth`,
`/onboarding`) and `home-page.tsx` (the unauthenticated marketing landing). **Both were left
untouched, deliberately:** they are **arrival, not rooms**, and Experience Blueprint **§ 6.2 rule 3**
expressly permits it — *"The arrival may stand at E3 for its beat and settle into the destination
room's level."* § 6.1's law is about **rooms** (*"No **room** contains the orchard"*). Retiring
arrival's orchard would have obeyed a rule that was never written.

### 5.3 What the rooms stand in now — and the gap, declared rather than hidden

Removing the wallpaper drops every room onto the warm canvas (`--background: 42 27% 95%`), which is
**the Blueprint's own E1**: *"the orchard as illumination and warmth, not image: warm canvas, the
orchard's light direction and hue … The room is bright because the orchard is outside; you don't see
it while working."*

| Room | Governed exposure (§ 5.1) | After P3 | |
|---|---|---|---|
| Planner · Shopping · Analyser · Household/Profile | **E1** | **E1** | ✅ **at their governed level** |
| Home | **E3** — the open view | E1 | ⚠️ **gap — declared** |
| Cookbook · Pantry · Nutrition · Diary | **E2** — the window | E1 | ⚠️ **gap — declared** |
| Admin | **E0** | E1 | ⚠️ minor gap — declared |

**This is a move from a *violation* to an *under-build*, and the difference matters.** Wallpaper is
forbidden by name; under-exposure is a gap with a governed path. **Home's E3 and the E2 window are
not P3's to build**: § 2.4 fixes their path — the UIA § 4 amendment, tokens by admission, one Living
Detail at a time — and P3 is *"the free renames and off-by-ones"*. **Building an E3 composition here
would have jumped the governance path in the very item whose lesson is *do not invent, obey what is
written*.** The gap is reported, not papered over. **This was put to the user, not decided.**

### 5.4 The register entry — and the gate that would have caught this

`ADOPTION REGISTER COMPLIANCE` is mandatory here: P3 retired a client-side building block's
adoption. It is recorded as concern **`orchard-exposure`** — **and recorded as a ratchet, because
CONV1 § 9's own lesson is that a record is not enough:**

> *"**`BEH-7` proves a checklist cannot catch a component nobody re-read.** Needs a conformance
> sweep, not a new rule."*

The entry uses the register's `retired` check with `excludePaths` set to the two arrival files, which
states the Blueprint's rule **mechanically**: *`<OrchardBackdrop>` must have **zero** occurrences
anywhere but arrival.*

**It was proven to fire, not assumed to.** Re-introducing the exact defect — the mount back in
`App.tsx` — produces:

```
FAIL [orchard-exposure] RETIRED predecessor is live again: the global orchard wallpaper …
     (retired by CONV1-P3 (BEH-7)) — 1 occurrence(s) in code: client/src/App.tsx:1
```

**It names the file.** Reverted, the gate returns to green. This is CONV1 § 8.1's strategy applied
to the one item that most needed it — *"stop finding divergence with investigations and start failing
on it with gates"* — and it **creates no law**: the register is explicitly *"operational, not
architectural — it creates no law."* The Blueprint's rule is unchanged and unrestated; it is merely
now checkable. **`adoption:check` 64 → 66 passing.**

---

## 6. CORRECTIONS TO CONV1'S INVENTORY (verified at source — `L1`)

1. **`BEH-1`: "No production code branches on `kind`" is FALSE.** Four live client sites do, and they
   render a baby icon, the raw value, and two chips. **The item's grade was wrong, not just its
   line numbers** — this is not a latent hazard, it is live user-visible output.
2. **`BEH-1`: the `"guest"` rival collides with a live, legitimate, opposite `"guest"`** —
   `GuestEater`, a visitor at a planner entry. CONV1 does not mention it. **The rename un-collides a
   live domain term; it is not cosmetic.**
3. **`BEH-1`: `role: "guest"` breached the engine's own written hard boundary** (*"No fabrication:
   every field … comes from a stored row"*). CONV1 does not mention it.
4. **`BEH-4`: not "every new THA household" — every *demo/trial* household.** `seedDemoData` is
   reached only from `POST /api/demo/start`; registration never calls it.
5. **`BEH-7`: no parallax exists.** One prohibition breached, not three.
6. **`BEH-7`: three mount sites, not one.** Two are arrival and are correctly out of scope.
7. **Every `file:line` in all three items has rotted.** `storage.ts:3345` → `:3378`;
   `household-eater.ts` → `shared/household-eater.ts`. **`L2` holds again: the facts were right and
   the lines had rotted** — which is exactly why P2 built `verify:coherence`, and exactly why it
   cannot see this class (a *count* or a *grade* that has rotted resolves fine).

> **The pattern across P1, P2 and P3 is now unmistakable.** Every phase has found the census's
> **numbers and names** stale while its **findings** hold. `BEH-1` is the first item where a
> **grade** was wrong — *"correct today"* described something that had been wrong all along, in the
> UI, in front of the household. **A census ages from the edges in: paths first, counts next, and
> eventually the verdict.**

---

## 7. WHAT WAS REFUSED

- **Renumbering the `dayOfWeek` key space** to make `0 = Monday` and the seeder "read right"
  (`HT8` — it silently rotates every planner consumer and no test would catch it).
- **Fixing `roleMap.get(uid) ?? "member"`** — the same fabrication, one expression away, and
  outside `BEH-1` (§ 4.1).
- **Building Home's E3 view inside P3** — it would jump the governance path § 2.4 fixes, in the item
  whose whole lesson is to obey what is already written.
- **Retiring arrival's orchard** — obeying a rule about *rooms* on a surface that is not one.
- **Rewording the Planner chips instead of deleting them** — honest and still noise; account backing
  is irrelevant to meal suitability.
- **Writing a new Experience principle for `BEH-7`** — `NORTH2`'s refusal; CONV1 `R8`.
- **Touching the 2 pre-existing `adoption:check` failures or the 32 typecheck regressions** — none is
  P3's, and adopting other sessions' debt would make P3's own measure unreadable.

---

## 8. THE REMAINING CONV1 BACKLOG

**Closed to date:** P1 (`DOC-1`·`DOC-2`·`DOC-3`·`DOC-4`·`OWN-5`) · P2 (`WRITE-4`·`BEH-8` + two
coherence gates) · **P3 (`BEH-1`·`BEH-4`·`BEH-7`)** — **10 of 24 items.**

| Phase | Contains | Status |
|---|---|---|
| **P4 — The Household Person** ★ | `WRITE-3` → `WRITE-2` → `OWN-1` → `READ-1` + `READ-2` + `WRITE-1` | **open — the largest; carries all the risk** |
| **P5 — Household Time: the module and the zone** | `OWN-4` → `OWN-3` → `SCH-1` | open |
| **P6 — Household Time: T2/T3** | `READ-4` ★ → `BEH-6` ★ → `SCH-4` → the greeting ×4 | open |
| **P7 — The anchor** ★ | `SCH-2` | open |
| **P8 — The T5 convergence** | `READ-3` · `OWN-6` · `BEH-3` · `OWN-2` · `BEH-9` | open — needs P7 |
| **P9 — Retire the fabricator** | `BEH-5` | open — needs `SCH-2` |
| **P10 — The long game** | `SCH-3` | open |
| **P—** | `SEC-5` → a birth date → `BEH-2` | **behind the legal gate** |

**New backlog raised by P3** (neither in CONV1's 24-item census):
- **`roleMap.get(uid) ?? "member"`** — a second fabrication in `household-discovery-engine.ts`,
  against the same written boundary (§ 4.1). Small; belongs with `OWN-1`.
- **Home's E3 and the E2 window are now a *declared, unbuilt* exposure gap** (§ 5.3). This is the
  honest consequence of P3 and should not be left to rot into the next census.
- **`Domain 6` + `Domain 18`** — P2's coherence reds, still open. **`verify:coherence` is now wired
  into `release:check`** (`package.json:83`) by a concurrent session, which P2 explicitly declined to
  do while it was red. **That gate is red on defects nobody has fixed** — CONV1 `R2` is now live in a
  release gate.

---

## 9. RECOMMENDED NEXT WORKSTREAM

> **Correct `Domain 6` + `Domain 18`, immediately — ahead of P4.**

P2 recommended this and it did not happen; since then **`verify:coherence` was wired into
`release:check`**. It is two one-line factual corrections (Domain 6 names `server/lib/dietRules.ts`
for a file that lives at `shared/dietRules.ts`; Domain 18 declares a contest with
`nutrition-benefit-library.ts`, **which exists nowhere**) — **zero rule change, zero ownership
change** — and until they land, **THA's release gate is red for reasons unrelated to whatever is
being released.** That is `R2` (*"a permanently-red gate is indistinguishable from no gate"*)
graduating from a risk into the release path. It is the cheapest item in the whole programme and it
now blocks everything.

**Then P4 — The Household Person.** It is the largest convergence and the only one where a mistake
reaches a plate, and **P3 has just strengthened the case for it**: `BEH-1` proves the eater model's
vocabulary was reaching households as fabricated fact, and P4 is where `childrenCount` /
`babiesCount` — *"the model is told on ~9 turns in 10 that there is a baby in the house, by a
platform with no rule about babies and no age for anyone"* — are finally derived from eater rows
and retired.

**Do not take P5–P8 first.** They are well-sequenced and none is blocked, but P4 requires P1's
corrected canon and is the item whose delay costs the most.

---

*Rollback: `rollback/CONV1-phase-p3-renames-and-off-by-ones-20260716` → `7d1dd2ce`. **The tag is a
marker, not a restore point** — it predates every uncommitted P0/P1/P2 correction in a tree dirty
from ~9 concurrent sessions, and a tag checkout would destroy them. To roll back P3, revert these
files individually: `server/storage.ts` · `shared/household-eater.ts` ·
`server/intelligence/handlers/household-read-handler.ts` ·
`server/intelligence/services/household-discovery-engine.ts` · `server/routes.ts` ·
`client/src/App.tsx` · `client/src/pages/profile-page.tsx` ·
`client/src/pages/weekly-planner-page.tsx` · `docs/implementation/ux/adoption-register.json` ·
`docs/implementation/ux/ADOPTION_REGISTER.md` · and the five `server/tests/test-*` files listed in
§ 4.*
