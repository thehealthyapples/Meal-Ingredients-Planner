# NORTH2 — The Home Refinement: material, light, and the honest gap

**Date:** 2026-07-17
**Status:** Delivered — awaiting review. **One headline requirement could not be met, and it is § 5.**
**Rollback:** `rollback/NORTH2-home-refinement-20260717` → `8fcb3d72` (tag protects committed state only; the tree carries uncommitted work from concurrent CONV1 sessions — untouched by this change. File-level baselines: `§ 11`)
**Reference:** [`attached_assets/design/north_star/v2/NORTH_STAR_V2_HOME_DESKTOP_MOBILE.png`](../../attached_assets/design/north_star/v2/NORTH_STAR_V2_HOME_DESKTOP_MOBILE.png)
**Evidence:** [`docs/ui-audit/north2-home/`](../ui-audit/north2-home/) — before/after at six widths, the quiet day, the material close-up, and **five other rooms** (`rooms/`)
**Predecessor:** [`NORTH1_HOME_IMPLEMENTATION.md`](./NORTH1_HOME_IMPLEMENTATION.md)

---

## 1. What this change is

Art direction, executed as craft. It made **no architectural decision**, amended **no governing
document**, created **no component, route, store, fetch or query**, and changed **no behaviour**.
Every workflow, every loading state, every empty state and every honest gap NORTH1 built is
byte-identical in behaviour.

What changed is **the material the house is made of**.

Two decisions were the owner's and were taken before any code moved (Colin Clapson, 2026-07-17):

| Decision | Ruling |
|---|---|
| **The orchard asset cannot be "restored"** — there is nothing richer in the history (§ 5) | Do everything else; the asset comes later. Treat the orchard as richly as the current one allows. |
| **Warming the palette is platform-wide**, not Home-scoped | Platform-wide. Warm the real tokens. |

---

## 2. The verdict, honestly

**The room is warmer, deeper, quieter and more premium than it was, and it is still not the
North Star — because the North Star's emotional centre is a photograph this product does not
have.** That is § 5, it is named rather than dressed around, and it is the single most important
sentence in this document.

**What genuinely changed, and would be felt:**

- **Nothing in the house is pure white any more.** This is the whole change in one line. Every
  surface was `hsl(0 0% 100%)` — zero hue, zero saturation — in a room whose only light is a warm
  morning. **White cards are the universal signature of software**, and no natural material is
  white: plaster, linen, oak and stone all carry the colour of the light that falls on them.
- **The doors are cut into the counter instead of sitting on it.** The depth inverted: no drop
  shadow, an etched top lip, a rim of light on the lower one. They are the counter, carved.
- **The orchard has life in it.** Graded in the asset itself, so every consumer gets the same
  morning — including the five that bypass its owner (§ 6).
- **The welcome is a welcome.** Larger, lighter, unhurried, with the day mentioned *after* the
  household's name rather than announced before it.

**Where it is weaker than the reference, stated plainly:**

- **The reference's orchard is a photographic apple orchard with blossom overhanging the frame.
  Ours is a graded watercolour of a meadow.** No amount of craft closes that, and § 5 is the proof
  rather than the excuse.
- **The desktop composition still splits left-cream / right-orchard.** NORTH1 § 5.2 established
  that this is forced by Blueprint § 6.1 (the orchard never carries text, "without negotiation"),
  and that the reference *breaks* that law. NORTH2 did not revisit it — the split is still the best
  available composition under the law, and the law is still right.
- **The upper-middle of the desktop room is quiet to the point of being empty.** It is composed
  emptiness rather than bare emptiness only because the orchard now carries it; on a smaller
  screen, where the band does the work, the room is stronger. This is the surface a reviewer is
  most likely to want to argue about.

---

## 3. Before and after

| | Before | After |
|---|---|---|
| Desktop 1440×900 | `before-desktop-viewport.png` | `after-desktop-viewport.png` |
| `lg` (1024) | `before-lg-narrow-viewport.png` | `after-lg-narrow-viewport.png` |
| Tablet (820) | `before-tablet-viewport.png` | `after-tablet-viewport.png` |
| Phone 390×844 | `before-mobile-viewport.png` | `after-mobile-viewport.png` |
| **The material, close up** | `before-room-material.png` · `before-room-doors.png` | `after-room-material.png` · `after-room-doors.png` |
| The quiet day | `before-quiet-day-*.png` | `after-quiet-day-*.png` |
| **Five other rooms** | — | `rooms/after-{planner,cookbook,pantry,shopping,dashboard}.png` |

**The close-up is new, and it is the shot that found the change.** NORTH1 judged Home at
1440×900, where a surface is forty pixels tall and its material is invisible. `before-room-doors.png`
is four near-white rounded rectangles with hairline borders — *application tiles*, exactly as the
brief said. You cannot see that in a viewport thumbnail. **A material is a thing you have to look
at closely, so the harness now does.**

---

## 4. What was built

### 4.1 The palette — the light gets a material to fall on

`--card` · `--popover` · `--sidebar` · `--surface-primary` were `hsl(0 0% 100%)`. They are now
plaster, `42 46% 98%` — warm, saturated, and **brighter than the room** so they read as *lit*.

The physics is the argument, not the taste: the room has exactly one light (`--light-rim: 48 60% 98%`,
ambient `46 85% 90%`), and **a surface standing in warm light cannot be neutral**. Pure white in a
warm-lit room is not a material — it is the absence of a decision, and it is why the page read as
software.

**The value range narrowed, deliberately.** Before, canvas 95% → card 100% with saturation
collapsing 27 → 0: the card was not merely brighter than the room, it was a *different material
family*, which is exactly the "sitting on top of it" the brief names. After, canvas 94% → plaster
98% with saturation **rising** 28 → 46, toward the light. Same family, one light. Planes are now
read from the shadow beneath them and the rim along their top edge — how a real counter is read
against a real wall — and never from a jump to a foreign colour. *Depth before shadows, light
before colour* (TRANSLATION1 § 5).

**No law changed.** UIA § 7 fixes the semantic *structure* — one definition source, no raw colour
in a surface, one meaning per colour, light and dark as value sets — and every clause still holds:
the same named roles, resolved in the same one place, and **not one surface anywhere gained a
colour of its own**. § 7 never fixed the values, and the values were what was wrong.

`--primary-foreground` and `--sidebar-primary-foreground` stay pure white on purpose: they are
**ink on a saturated green fill**, not materials standing in the light. Warming ink buys nothing a
household could feel while spending contrast § 15 measures.

### 4.2 The doors — etched, not stacked

Support inverted. There is no drop shadow, because **a recess is not floating**:

- `inset 0 2px 3px -1px` warm shadow — the counter's upper lip holding light off the groove.
  **Top only.** The morning is upper-left and forever (Blueprint § 7), so a recess is dark at its
  top and nowhere else. A shadow inset on all four sides is the **disabled-input tell**, and a
  disabled input is a worse thing to look like than a tile.
- `inset 0 -1px 0` light rim — the morning catching the **lower inner lip**, the one edge of a
  groove that faces the sun. This single warm line is what separates *etched into oak* from
  *greyed out*: a disabled control never has it.

The fill is the counter's own material one whisper deeper, at 0.34 — **mostly transparent, so what
a household sees inside a door is the counter showing through it.** The door *is* the counter,
carved, not a different substance inserted into it. The border went from a 7-point outline to a
sub-4-point joint, because **an outlined rectangle is a card whatever colour it is**.

Hover lifts the door out of the groove to meet the hand; press seats it back. This still answers
the hand physically, which is what `--shadow-support-*` always meant; what changed is the resting
state it answers *from*. **The house is still until you touch it.**

*Scope note:* `--surface-support` and `--shadow-support` are consumed by `index.css` and Home and
nothing else, so this treatment is Home-scoped in practice despite being platform tokens.

### 4.3 The welcome — given room, and given manners

- **"Welcome home,"** was `title-section`: DM Sans **semibold at 22px**, standing under an **84px**
  hand. The weight was there to be heard next to something four times its size, and it lost. UIA
  § 8 says so in the law rather than in hindsight: *"Weight is hierarchy's quietest tool … Shouting
  in bold is spending the emphasis budget on the shout."* It is now `title-page` at `font-normal` —
  the named role for the title of a page, which this literally is — carried at the one weight that
  lets **the household's name be the loudest thing in the room.** The emphasis was never supposed
  to be on the greeting.
- **The day** was `text-xs uppercase tracking-[0.16em]`, *above* the greeting: micro-size, all-caps,
  wide-tracked — the typographic signature of a dashboard widget header, and the **first thing the
  room said**. A house does not announce the date before it says hello. It is now sentence case,
  quiet, beneath the name.
- **The air**: `lg:mt-16` between the welcome and the counter, reclaimed from dead padding above
  the greeting (§ 7.1).

⚠️ `todayLabel()` is **byte-untouched**. This moved and re-voiced a string; it did not read a clock
differently, add a second one, or resolve a civil date. Household Time (HT1–HT18) owns that read,
**CONV1 P8 is still to converge it**, and NORTH1 § 5.6 left this line for the convergence — it is
still left for it.

### 4.4 The orchard — graded in the file, not in the browser

Saturation 1.28, contrast 1.06, applied once at 1536×1024 and **baked into `/orchard-bg.webp`**.
Saturation puts life back in the greens — the orchard is *life* (Experience Language § 3A.3), and a
desaturated orchard is the "gloomy, misty, melancholy" § 3A fixes it against **by name**. Contrast
gives the hills their distance back, which is what makes it a place rather than a wash.

It adds no second light and moves no sun: **a grade changes how a negative is printed, never where
the morning comes from.** Every shadow in every room still agrees with the same upper-left sun.

**The asset got smaller doing it: 56,986 → 51,722 bytes.** PX1-W3's performance budget ("Make the
Product Feel Instant") is improved, not spent.

Why the file and not a CSS `filter:` — that is § 6, and it is the most important finding here.

---

## 5. 🔴 The orchard asset — the requirement that could not be met

**The brief's first and largest instruction was: *"Restore the richer, more realistic orchard as
the hero banner and primary emotional focal point."* It cannot be done, and nothing in this
change should be read as having done it.**

The evidence, gathered before any code moved:

1. **There is exactly one orchard image in the repository.** All four copies —
   `client/public/orchard-bg.webp`, `client/dist/public/orchard-bg.png`, and both
   `attached_assets/orchard_background_concept_*.png` — are **byte-identical**: `md5 332f8222db76d68d589f017bc25604`.
2. **Nothing was lost in compression, so nothing can be restored by re-encoding.** PX1-W3 converted
   a 2MB PNG to a 57KB webp during a performance pass, which is what the word *"restore"* pointed
   at. Both were decoded and compared: **visually indistinguishable.** The webp was not a
   degradation.
3. **The asset is not an orchard.** It is a pale watercolour of a **meadow**: rolling hills, a
   winding path, a few generic trees on the horizon, a sunrise. **No apple trees. No rows. No
   blossom. No fruit.** Nothing that makes an orchard an orchard.

The North Star's orchard is a **photographic apple orchard**, with blossom-laden branches
overhanging the top-right of the frame, real bokeh, and real depth. That image is the reference's
entire emotional centre. **No CSS closes the gap between a photograph of a blossoming orchard and a
watercolour of a field.** The grade (§ 4.4) makes the weak asset carry as far as it can and no
further. **No grade adds a tree.**

### The spec, so the gap can be closed without another investigation

When the asset is commissioned or supplied, it drops into `client/public/orchard-bg.webp` and
**requires no code change** — the geometry, masks, exposure and crops are already built around it:

| Requirement | Value | Why it is not negotiable |
|---|---|---|
| **Subject** | A real apple orchard — rows, trunks, canopy, blossom or fruit in season | It is the one thing the current asset lacks and the whole reason the room is called what it is |
| **Dimensions** | ≥ 1536 × 1024, landscape | The window crops to 168% and anchors right; less resolution magnifies |
| **The sun** | Upper-**left**, low, warm morning | Blueprint § 7: one sun, upper-left, forever. Every shadow in every room already agrees with it. An asset lit from the right makes the whole house wrong |
| **Life below the horizon** | The orchard's substance in the lower two-thirds | The window anchors `objectPosition: 100% 82%` — NORTH1 § 6.4 found that anchoring high gives "a warm haze with nothing in it" |
| **A readable horizon** | Present and roughly level | The band unzooms from `sm` up to hold the whole scene; without a horizon it is an abstract green wash (NORTH1 § 6.6) |
| **No text, no props, no people** | — | Blueprint § 12.1: data-borne or dead. The household's life is the only ornament |
| **One season, one morning** | Mature, timeless, bright | Blueprint § 6.0–6.1: the orchard never changes hour or season; the family's life is what changes |
| **Weight** | ≤ ~90KB at 1536×1024 webp | PX1-W3's budget. The current graded file is 51,722 bytes — that is the bar to beat, not 2MB |
| **Mood** | Bright, growing, optimistic | Experience Language § 3A: never gloomy, misty or melancholy. "Calm must never become lifeless" |

**Until it exists, Home's emotional focal point is a graded watercolour meadow doing an orchard's
job, and it is the ceiling on everything else in this document.**

---

## 6. 🔴 What was found by looking: five second owners of the orchard

**This is the most serious finding in this change, it is pre-existing, and NORTH2 did not fix it.**

The grade was a CSS `filter:` first, applied in `orchard-backdrop.tsx` to the three shapes that
file owns — under a comment I wrote asserting that one constant on every shape kept Blueprint
§ 6.1's *one orchard* intact. **That assertion was false**, and a screenshot of the Shopping
workspace is what proved it: there was an orchard in it that NORTH2 had not graded.

**Five surfaces mount the asset without its owner**, straight from `url('/orchard-bg.webp')`:

```
client/src/components/ui/dialog.tsx:48          ← behind EVERY dialog in the product
client/src/pages/list-page.tsx:417
client/src/pages/shopping-list-page.tsx:3014
client/src/pages/onboarding-page.tsx:454
client/src/pages/shopping-workspace-page.tsx:2328
```

So:

- The owner file's header — *"One asset, one owner, two governed shapes"* — **is false.**
- The register row's `adoptionFloor` — *"two permitted surfaces (arrival, and `/home`) · nothing
  else"* — **is false.**
- Both were false **before** NORTH2. Neither was caused by it.

**Why no gate caught it: the rule is enforced on the wrong noun.** The row forbids *mounting the
export*. These five never touch an export — they use the **asset path**. The machine check is
green, has always been green, and is checking a thing that is true while the concern it exists to
protect is violated. A pattern rule on `orchard-bg.webp` outside the owner would catch all five.

**A CSS filter would have shipped two orchards in one house** — graded on arrival and Home,
ungraded behind every dialog, list, onboarding step and the Shopping workspace. That is the same
defect as two suns (Blueprint § 16) wearing different clothes.

**So the grade was moved into the asset**, which makes § 6.1's one orchard true **by construction
rather than by discipline**: every consumer gets the same morning whether it asks the owner for it
or not, and no future bypass can fork it either. It also costs no runtime filter and will not
double-grade the real photograph when it lands.

**That makes the fork moot. It does not make the bypass correct.** Un-forking five pages is
architecture, not art direction, and this change was scoped to craft — so it is recorded in the
register (`orchard-environment.openMigration`), in the owner file, and here, rather than quietly
corrected or quietly ignored.

---

## 7. What else was found by looking

Every one of these typechecked, built, and passed every gate. None was findable by reading. This is
NORTH1 § 6's lesson repaid: **a claim with no picture attached is a claim nobody checked.**

### 7.1 Breathing space ate the front door
The brief asked for more room around the welcome; `lg:mt-24` gave it, beautifully, and pushed
**"Open today's plan" off the bottom of a 1440×900 desktop, behind the nav.** That is the one
door — the only primary action on the page, the element NORTH1 § 8.3 named as the reference's most
serious failure for lacking — and **a door you must scroll to find is a door the room did not
offer.** Home's whole job is *arrive, be oriented, step through the one right door*; two thirds of
that is not the job. The air was taken from the dead padding **above** the greeting instead, where
it cost nothing. Breathing space is worth a great deal and it is not worth the door.

### 7.2 The material was invisible at the size it was being judged
NORTH1 signed off Home at 1440×900. At that size a door is forty pixels tall and you cannot tell
plaster from paper. The close-up harness (`*-room-material.png`, `*-room-doors.png`) is the whole
reason the white-card diagnosis was possible at all, and it is captured every run so it cannot
quietly stop being true.

### 7.3 The element crop lied
The first `-room-doors` shot cropped the `home-doors` element — which has a transparent background,
so Playwright composited the doors against nothing. They looked like tiles floating in a void
because they *were*, in that image. **A material can only be judged against the material it sits
on.** The counter shot (`-room-material`) is the honest one.

---

## 8. Compliance

**Architecture Bootstrap** (`docs/architecture/README.md`) read first. No governing document was
amended; none needed to be.

- **The Experience Test (EXPBLUE § 15.3).** *Which room?* Home. *How should someone feel?* Arrived,
  welcomed, unhurried, known by name. *The one thing it helps them do?* Step through the one right
  door for the hour — and § 7.1 is that check catching a real regression.
- **The Blueprint Checks (§ 15.2).** One home ✓ (walls untouched) · a room, not a theme ✓ (nothing
  drawn; no kitchen) · the map respected ✓ (E3 unchanged; no room's exposure moved) · orchard law ✓
  (one orchard — **now by construction**, § 6; no text on it at any width; still, no drift, no
  parallax) · one morning ✓ (the grade prints the negative; it does not move the sun) · material
  honesty ✓ (**this change is the material honesty** — warm opaque plaster, no faux material, no
  glass) · Living Detail discipline ✓ (Home's one ornament is still the greeting, still data-borne)
  · the governance path ✓ (token values only; no new visual law).
- **The Design Character Check (OHDB § 16.2).** Architectural character ✓ · composed emptiness ✓
  (the quiet day is captured every run) · **timeless not fashionable ✓** — plaster and morning, no
  frosted glass, no trend · the design disappears ✓ (the most memorable thing in the frame is still
  the household's own name).
- **UI Governance (UIA § 18).** One visual language ✓ (**amended never forked** — the platform-wide
  ruling is exactly what kept it one) · depth/light/ground ✓ (one ground, one light, one direction;
  the etch is the one light read against a cut edge) · tokens ✓ (no raw value in a surface; the page
  names no colour) · motion ✓ (nothing moves unasked; reduced motion unaffected) · **contrast ✓ —
  every surface carrying type is solid, so it is measurable once (§ 15), and every room was
  inspected**.
- **UX Governance / Premium Standard (EXP § 18).** One primary action ✓ (§ 7.1) · calm before
  capability ✓ · honest gaps ✓ (§ 5 is the largest one this product has) · *"if the household would
  not feel the care, it is decoration; if they would feel its absence, it is craft"* — the white
  cards are the test case, and their absence is felt.
- **Platform-wide verification.** `--card`/`--background`/`--popover`/`--sidebar` are read by every
  room, so every room was captured at 1440×900 and **inspected, not assumed**: Planner, Cookbook,
  Pantry, Shopping, Dashboard — no contrast or legibility regression (`docs/ui-audit/north2-home/rooms/`).
  **Dark mode is byte-untouched**: it is a separate value set (UIA § 7), derives `--surface-primary`
  from its own `--card`, and its shadows were already `none`.
- **Adoption Register.** **76 passed · 0 notices · 2 failed** — **byte-identical to NORTH1's
  baseline** (`button-primitive` 539 > 538; `HouseholdNutritionPanel` orphan). Both are pre-existing
  and owned by concurrent sessions. **Not masked, not "fixed"** — raising a ceiling to green a red
  gate is the one thing the register forbids doing quietly. Two rows updated: `depth-light-ground`
  (the re-valuation and its reasoning) and `orchard-environment` (the grade, plus § 6 as an
  `openMigration`).
- **Product Registry.** Home's behaviour, data and routes are unchanged; this change is presentation.
  Flagged: if the registry's Home entry carries a *visual* description, it needs the warmed material
  and the etched doors — and its orchard description should not claim an orchard (§ 5).
- **Typecheck / build.** Client typecheck **clean**; `vite build` clean. The compiled CSS was
  checked rather than trusted: `--card: 42 46% 98%` ships, `--surface-support: hsl(40 38% 95.5% / .34)`
  ships, and **no `--card: 0 0% 100%` survives in light mode**. The `server/*` errors are the
  concurrent sessions' uncommitted work, unrelated and unchanged.

---

## 9. Files changed

| File | Change |
|---|---|
| `client/src/index.css` | **The material.** Every pure-white surface → plaster; canvas deepened; ground → warm stone at 0.82; support → translucent linen at 0.34; the primary border → a joint; **`--shadow-support` inverted to an etch**. No law, no new token, no role renamed. |
| `client/public/orchard-bg.webp` | **Graded in the file** (saturation 1.28, contrast 1.06 from the 2MB PNG source). 56,986 → **51,722 bytes**. Makes "one orchard" true by construction (§ 6). |
| `client/src/components/layout/orchard-backdrop.tsx` | The CSS filter added and then **removed** (§ 6); the grade documented at the asset; the five bypasses named at the owner. Behaviour, geometry, masks, crops and exposure **unchanged**. |
| `client/src/pages/home-experience-page.tsx` | The welcome re-voiced (`title-page font-normal`), the day moved below the name and de-capitalised, the air rebalanced (§ 7.1). `todayLabel()` byte-untouched. No data, query, state or door changed. |
| `docs/implementation/ux/adoption-register.json` (+ regenerated `.md`) | Two rows: `depth-light-ground` re-valued with reasoning; `orchard-environment` graded, **with § 6 recorded as an open migration**. |
| `scripts/capture-north2-home.ts` | **New.** NORTH1's harness plus the close-up that found the change (§ 7.2). |
| `scripts/capture-north2-rooms.ts` | **New.** The five other rooms — the obligation that comes with a platform-wide change. |
| `docs/ui-audit/north2-home/` | **New.** Before/after ×6 widths, the quiet day, the material, and `rooms/`. |

---

## 10. What this change deliberately did not do

- **No architectural decision.** No governing document amended. No new token, role, component,
  hook, route, store, fetch or query key.
- **No behaviour change.** Every workflow, loading state, error state and empty state is the one
  NORTH1 built. The Notice Engine's list is not re-sliced or re-ranked.
- **No new visual law.** UIA § 7 fixes structure, not values; the values moved and the structure did
  not.
- **No clock.** `todayLabel()` is byte-untouched and still belongs to CONV1 P8.
- **No red gate made green.** The two pre-existing failures are reported, not masked.
- **The five orchard bypasses were not fixed** (§ 6) — named, recorded, and left to a change that
  is allowed to touch architecture.
- **The eight arrival prototypes are still not deleted** — NORTH1 § 8's inherited item, unchanged
  and still blocked on the same `time-of-day-greeting` floor. Not this change's, and not quietly
  adopted by it.
- **Nothing deleted that belonged to another session.**

---

## 11. Rollback

The material is four files and one binary:

```
git checkout rollback/NORTH2-home-refinement-20260717 -- \
  client/src/index.css \
  client/src/pages/home-experience-page.tsx \
  client/src/components/layout/orchard-backdrop.tsx \
  client/public/orchard-bg.webp \
  docs/implementation/ux/adoption-register.json \
  docs/implementation/ux/ADOPTION_REGISTER.md
```

then `npm run adoption:check` to confirm the 76·0·2 baseline returns.

> ⚠️ The tag is at `8fcb3d72`, which also carries **NORTH1's client work and CONV1 P6/P7** (NORTH1
> § 11). Use the path-scoped restore above; **do not `git revert 8fcb3d72`.**

File-level baselines taken before the first edit, if the tag is unreachable:
`/tmp/claude-1000/-home-runner-workspace/59579e5e-f20d-4aef-b38d-da3c5b3c5ab2/scratchpad/north2-baseline/`
and the pre-grade asset at `…/scratchpad/orchard/orchard-bg-PRE-NORTH2.webp`.

*`scripts/capture-north2-*.ts`, `docs/ui-audit/north2-home/` and this document are additive and may
simply be deleted.*

### 11.1 This change's commit history — NORTH1 § 11, repeated exactly

**Part of NORTH2's work is committed inside `5c4611e8`, "chore: preserve workspace before CONV1
Phase P8 (Household Time: the T5 convergence)" — a *different session's* commit.** Nothing is lost
and nothing is wrong with the code, but anyone reverting needs to know it, so it is recorded rather
than left to be discovered.

**CONV1 P8 opened at 10:01:22 while this session was mid-flight.** The repository's
workspace-preservation pattern commits **the whole tree**, so it swept up NORTH2's in-progress
files: `client/src/index.css` (+130 lines — the warmed palette and the etched doors),
`client/src/pages/home-experience-page.tsx`, `scripts/capture-north2-home.ts`, and the
`docs/ui-audit/north2-home/` captures taken up to that minute. That is the cost of four sessions
sharing one working tree, and it is nobody's mistake. **NORTH1 § 11 recorded the identical event
against P7 nine hours earlier — it is a pattern, not an accident, and it is worth someone owning.**

**What that commit contains is a coherent partial, which was luck rather than design** — verified
rather than assumed:

| At `5c4611e8` | State |
|---|---|
| `index.css` | ✅ The warmed palette and the etched doors |
| `orchard-backdrop.tsx` | ✅ **No CSS filter** — the commit lands *before* the filter attempt, so **the two-orchard state of § 6 was never committed** |
| `client/public/orchard-bg.webp` | ⚠️ **56,986 bytes — the PALE, ungraded asset.** The graded 51,722-byte file is uncommitted |

So `5c4611e8` holds Home with a warm material and a pale orchard: incomplete, but internally
consistent and shippable. **The grade, the § 6 finding, this report, the register rows and
`capture-north2-rooms.ts` are all uncommitted.**

> ⚠️ **Do not `git revert 5c4611e8` to undo NORTH2.** That commit is CONV1 P8's opening state.
> Use the path-scoped restore above, which is unaffected. The tag at `8fcb3d72` predates every
> line of NORTH2, so it remains a safe floor.

---

*An implementation report. It applies the governing architecture and owns only this implementation;
it restates no rule, sets no value beyond the token values it records, adds no gate, and jumps no
governance path. Subordinate to the Experience Architecture, which prevails in any conflict.*
