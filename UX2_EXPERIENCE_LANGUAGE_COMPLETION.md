# UX2 — Experience Language Completion

**Session** `UX2_Experience_Language_Completion`
**Rollback** `rollback/UX2-experience-language-completion-20260719`
**Branch** `int1-intelligence-platform`
**Date** 2026-07-20

Completes the THA experience against the agreed Orchard North Star so the product
reads as one home rather than nine applications wearing one navigation.

---

## 1. The owner decisions this run was waiting on

| Decision | Effect |
|---|---|
| **Orchard green (hue 74) is the canonical platform primary.** | Unblocked NORTH4 D1 — deferred by *every* run since ARRIVAL1 as "the owner's decision, not taken here". Taken below. |
| **Caveat remains THA's signature hand.** | No change required. `--font-signature` already holds it and `/home`'s greeting is its one adopted surface (UIA § 8). Confirmed live in the captures — "Chloe" is set in Caveat. |

---

## 2. What changed

### 2.1 The one green (NORTH4 D1)

`--primary` moved from hue 132 — the scaffold's cool green, chosen before there
was an orchard to answer to — to hue 74, sampled from the canonical `ORCHARD.png`:
leaf-in-shade, the colour of the actual trees the product is named for.

Values are **re-derived per surface, not find-and-replaced.** Hue 74 is more
luminous than 132 at equal HSL lightness, so:

| Token | Light | Dark |
|---|---|---|
| `--primary` | `132 14% 44%` → `74 30% 34%` | `132 14% 52%` → `74 26% 46%` |
| `--ring`, `--sidebar-primary`, `--sidebar-ring` | follow `--primary` | follow `--primary` |
| `--primary-border` | `hsl(132 14% 37%)` → `hsl(74 32% 26%)` | `hsl(132 14% 44%)` → `hsl(74 28% 36%)` |
| `--accent`, `--sidebar-accent` | `118 19% 94%` → `74 24% 93%` | unchanged (near-neutral) |
| `--primary-tint` / `--primary-ink` | **new** — `74 40% 95%` / `74 38% 24%` | **new** — `74 22% 14%` / `74 34% 70%` |

Because `--primary-foreground` stays white and the fill got **darker**, every
white-on-primary pairing in the product **improves** rather than regresses.
Ink-on-tint measures ≈10:1 by day and ≈8:1 at night, against the 4.5:1 § 15
requires.

**ARRIVAL1's Home-scoped override was DELETED, not matched.** While it stood,
Home was still the one room that knew a different green — which is precisely the
shape this brief exists to close. A live assertion now proves Home declares no
`--primary` of its own.

`--nav-hue`'s fallback and the Companion's sage ceramic followed the same green,
so no object in the product is left speaking the scaffold's hue.

### 2.2 The permanent header

The header rendered `realm-header-bg`, so **the top of the application was a
different colour in every room** — teal in the Planner, green in the Pantry, rose
in the Diary, nine in all. Walking from the Cookbook to the Shopping list
repainted the roof of the house. This was the single largest reason THA read as
nine applications.

It is now **one material everywhere** (`.shell-header` — warm plaster catching the
morning from above), with the room named by **light**: a faint light-line along
the header's lower sill in the room's own hue. This is exactly UX_NAV1's move —
nine coloured pills became one shelf lit at the room you are in — applied one
level up, where it matters more. Wayfinding (UIA § 6) is preserved in meaning and
quieter in form; no realm changed hue.

**The basket glyph joined it.** At rest it was a saturated `hsl(190,38%,44%)` cyan
sitting between two `text-muted-foreground` glyphs — photographed, it was the
loudest thing in the header and read as a *notification*, not a door. The room's
hue is now spent on the **lit** state only, as the shelf already does.

### 2.3 The mark

`logo-long.png` — apple, wordmark and tagline at 68px in a 76px header, so **the
logo was the header** — is retired for the pressed relief BRAND1 § 7, BRAND2 § 6
and `HOME_ARRIVAL_PRODUCTION_LOCK` § 2 all specify. A person who has signed in
knows whose software this is; a wordmark and a tagline above their own kitchen is
the brochure, indoors.

**Three duplicate apples were retired.** The account button rendered the canonical
apple at 38px and the Planner's overflow menu at 34px — so those headers carried
the mark twice, the copy larger and louder than the original. One apple, one
meaning; an account takes a person's glyph and an overflow menu takes an overflow
glyph. Same emboss physics now runs at three scales: the wall press, the header
mark, the Companion's emblem.

### 2.4 Home — the arch and the cottage

Retired for Concept B **as already locked**: glass above · oak sill · plaster room
below · doors along the floor. Nothing here is a new design — it is the locked,
collision-checked composition that had been waiting on its "gated implementation
step" since 2026-07-17.

The arch went because a rounded aperture over a heavy oak slab reads as the
*cottage*, and the house is the modern home in the ancient orchard. The oak
console went with it: below the sill the room is plaster, and a second oak slab
three inches under the sill read as two pieces of furniture arguing about which
one was the boundary. **The sill is load-bearing in perpetuity** — everything the
household reads sits below it, which is what stops Home ever being "tidied" back
into a hero banner with type on a photograph.

### 2.5 The Companion

A `bg-primary` disc with a `MessageSquare` chat bubble and a `shadow-lg` — which
is, precisely, "another AI chat widget", the generic signifier COMP1 decision 2
rejects by name — becomes the canonical apple carved into sage ceramic, with an
apple-shaped light blooming from within it.

Three states, obeying COMP1 § 7's intensity law (nothing faster than a breath,
opacity ≤ 0.9, scale ≤ 6%, never a status colour): `aware` (defined, not yet
wired — see § 5), `speaking` (replacing a spinner: a friend thinking, not a
machine processing), `listening` (the input has focus). **Reduced motion keeps
every meaning as a still**, so no information is carried by movement alone.

Page-level colour that duplicated or competed with the Companion's voice was
retired: `SiteBanner`'s `bg-green-600` (a *fourth* green, belonging to nothing),
`TrialBanner`'s raw amber, and `intelligence-tokens.ts`'s `green-*` benefit and
positive tones, which were a second platform green answering to nothing.

---

## 3. Two defects that no gate could have caught

Both shipped **green through build, typecheck and all three gates**, and both were
found only by opening the screenshot — ODL2 § 6.3's rule, again.

**1. All three embossed reliefs were invisible.** They mask themselves with
`/tha-apple.png`, which was never published to `client/public/` — the canonical
apple lives at `client/src/assets/icons/`, reachable by the bundler but *not* by a
CSS `url()`. A mask whose image 404s does not error: **it masks everything away.**
Worse, the dev server answered the missing PNG with the SPA shell, so the request
returned **200 with `text/html`** — a status check would have passed too. Fixed by
publishing the asset; the new verifier asserts the **content type**, never the
status.

**2. The pressed wall apple was laid across the Companion's sentences.** It was
positioned by reasoning — "open plaster, offset right, at eye height" — onto the
exact coordinates the Companion's right-hand column occupies. BRAND2 § 4.7
forbids this at any size. It is now anchored to the **floor** (content stacks
downward and varies with the day; the floor does not move) with its **width
derived from the margin it must fit** — `calc((100vw - 56rem)/2 - 2.5rem)` — so
the collision is closed by arithmetic rather than by a hand-tuned percentage the
next layout change would silently invalidate. Below 1100px there is no open wall,
so the press is omitted rather than shrunk into somewhere it does not belong; the
header's relief still signs the house at every size.

**A genuine design tension surfaced here and is recorded, not resolved:** BRAND2
§ 4.3 specifies the wall press "offset right, at eye height", but the production
lock § 3.4 dissolved the Companion's card into a *line resting on the wall* in
exactly that position. The two governing documents now disagree about who owns
the right-hand wall. Floor-anchoring is the resolution taken; the disagreement is
inherited by whoever revisits either document.

---

## 4. Verification

| Gate | Result |
|---|---|
| `npm run typecheck` | **88 errors — baseline exactly restored, 0 introduced, 0 in `client/`** |
| `npm run build` | **clean** |
| `scripts/ux2-verify-experience-language.ts` | **29 passed, 0 failed** (new — measures the running product) |
| `test:comm2-orchard-experience` | **80 / 80** |
| `test:home2-home-primary-action` | **47 / 47** |
| `verify:coherence` | **FAIL — 2, unchanged and pre-existing** (confirmed present at HEAD) |
| `adoption:check` | **82 passed · 1 notice · 9 failed — unchanged and pre-existing** (none names a file this run touched) |
| `typecheck:ci` | **16 regressions — pre-existing** in `server/tests/test-plan2-planner-evolution.ts`, a file this run did not touch; confirmed present at HEAD |

**The three pre-existing gate failures were confirmed at HEAD before this work**,
by reverting the tree and re-running all three. This report does **not** claim
they pass.

The new verifier deliberately **measures** rather than asserts classes exist:
asset content-type, geometric collision between the relief and every content
block, the sill's position relative to the glass, the header's computed background
across six rooms, and the Companion's resting state and light bounds.

### Aggregate suite
The aggregate `npm run test` halts at suite 103 of 160 (pre-existing, per COMP4),
so suites were run directly and selected by reachability. **This report does not
claim the aggregate passed.**

---

## 5. Screenshots

`docs/ui-audit/ux2-experience-language/{before,after}/` — 12 captures each: six
rooms (home · planner · cookbook · pantry · diary · orchard, spanning the widest
realm-hue spread the house contains) × two viewports (1440×900, 390×844).

Captured by `scripts/capture-ux2-experience-language.ts`, which authenticates as
an existing fictional Development World household and is **zero-write**. The
`before` set was taken by restoring the client from the rollback tag with the work
already committed, so nothing was risked to produce it.

The `planner-desktop` pair is the clearest single comparison: the teal header band,
the full-colour logo-and-tagline, the chat-bubble FAB and the duplicate apple all
give way to one plaster header, a faint teal light-line, a quiet pressed mark and
the carved emblem.

---

## 6. Remaining owner decisions

**1. Home's room hue.** The nine-room wayfinding scale is untouched, so Home's
room hue is still 132 — now the only 132 left in the product. Moving it to 74
would make it collide with the **Analyser**, a live adjacent room already at hue
74. Either Home keeps 132 as a room colour (the platform green and the room scale
are different instruments), or Home takes 74 and the Analyser is re-hued. **This
is a wayfinding/identity decision, so it was not taken.** It does not block
anything.

**2. Companion ownership of reminders and coaching.** A survey found the Companion
is duplicated far more widely than a visual pass may resolve:

- `AmbientIntelligence` ("Things you could do") renders on **8 surfaces**
- a **9-card** intelligence family with coaching eyebrows ("You could", "Something
  we've noticed", "Simply better")
- **5 per-surface intelligence panels**, including one literally named
  `HomeIntelligenceCompanion` — a direct namespace collision with `FloatingAssistant`
- **6 first-visit "Tip:" coaching banners**

Removing these changes **what each room offers**, not how it looks — and the brief
explicitly forbids changing ownership. **Stopped for this decision.** The visual
duplication (a second competing green, page-owned alert colour) *was* closed;
the structural duplication needs an owner's ruling on whether the Companion is the
sole voice of coaching, and if so what replaces those eight surfaces.

**3. Reported, not taken (no decision needed, but worth knowing):**
- **1,613 raw Tailwind palette classes across 73 product files** remain (595 in the
  green family, in three competing idioms: `emerald-*`, `green-*`, `teal-*`). This
  run converted the *platform-identity* greens — the ones that compete with
  `--primary`. The rest are semantic scales (health ratings, safety, per-category
  maps) whose conversion is a scoped programme with real regression risk, not a
  refinement. `client/src/components/ui/` is already 100% tokenised.
- **`REALM_STYLES` in `nav-bar.tsx` hard-codes each realm hue a third time** —
  a convergence with an ownership question attached.
- **`BrandBanner` in `nav-bar.tsx` is exported but mounted nowhere** and still
  renders `logo-long.png`. Dead, and already documented as dead.
- **The 390px bottom nav overflows** — "Cookbook"/"Shopping" collide and "Orchard"
  clips. Visible in `after/home-mobile.png`. **Pre-existing** (nine rooms, one bar)
  and untouched by this run.

---

## 7. Scope honoured

No architecture, route, business-logic or ownership change. `server/` is untouched
but for one renamed test guard (`OrchardArch` → `OrchardWindow`, so the guard keeps
naming every shape the canonical owner exposes rather than ageing into a test of
nothing). No schema, no migration, no new endpoint, no new capability.
