# NORTH3 — Home Reimagined: the entrance hall

**Session:** `NORTH3_Home_Reimagined` · **Date:** 2026-07-17 · **Owner:** Colin Clapson
**Rollback:** `rollback/NORTH3-home-reimagined-20260717` → `f62b5839`
**Brief:** *"Reimagine the Home experience as the emotional entrance hall of The Healthy Apples
while preserving all approved behaviour and architecture."*

---

## 0. The one-paragraph version

**Home's room was never the problem. Its view was, and its view is not this repository's to
paint.** NORTH1 built the window, NORTH2 graded what was behind it, and both discovered the same
thing: the asset in that window is a watercolour **meadow** with no apple trees. Colin Clapson
ruled on 2026-07-17 that the orchard is a **core THA brand asset with its own canonical ownership,
supplied separately** — so NORTH3 was instructed to author no substitute, and did not: the asset is
**byte-untouched**. What NORTH3 did instead was build the room the view will one day open onto, and
in doing so it found that **two of Home's own deliberate, shipped, carefully-argued design
decisions had never actually taken effect** — killed silently by a CSS layer, invisible to every
gate, discoverable only by measuring the rendered page. NORTH3 is three moves: **the type roles
were freed**, **the doors became doors**, and **the room now fits inside the house**.

---

## 1. The decision that shaped this change

The brief's own words were *"the orchard is not a background — it is part of the architecture; it
should feel like another room beyond the glass."* NORTH3 opened with the finding that made that
instruction unbuildable here, put it to the owner, and was answered:

> *"Do not author the canonical orchard asset inside this engineering implementation. The orchard
> is now recognised as a core THA brand asset with its own canonical ownership. Continue NORTH3
> using the existing asset and complete every improvement that is independent of the orchard image.
> Assume the canonical orchard will be supplied separately and adopted through the existing owner
> with no code changes, exactly as NORTH2 prepared for. Record the orchard as an external brand
> dependency rather than implementing a substitute."*

**That ruling is now recorded in the adoption register** (`orchard-environment.externalDependency`)
rather than in this report alone, because a report is read once and a register row is the thing the
next session is measured against (PKR1 Risk R7).

**Consequences, stated plainly, because they bound everything below:**

- `client/public/orchard-bg.webp` is **byte-untouched by NORTH3**. No procedural, generated,
  illustrated or placeholder orchard exists anywhere in the tree.
- **The fog fix is out of scope too.** NORTH3 found white mist across the asset's bottom third
  (§ 4.3) and did not remove it. Editing the asset is the brand owner's act now, whatever the size
  of the edit — an engineering session quietly repainting a brand asset is exactly the second
  ownership the ruling exists to prevent.
- **Home's emotional focal point remains a watercolour meadow doing an orchard's job, and that is
  still the ceiling on everything in this document.** NORTH2 said so; it is still true; NORTH3
  neither closed it nor pretended to.

---

## 2. What changed — three moves

### 2.1 The type roles were freed *(the root cause, and the one that matters most)*

`client/src/index.css` — `.title-page` · `.title-section` · `.title-card` · `.text-table` ·
`.text-numeric` · `.text-signature` moved from `@layer utilities` to `@layer components`.

They were declared inside `@layer utilities` **at line 593 — after `@tailwind utilities` at line
10**. A role and a Tailwind utility are both single-class selectors, so specificity ties and
**source order decided every contest: the role always won.** Any utility aimed at a role was dead
on arrival — silently, with no error, no warning, and no way to see it except by measuring the
rendered page.

**This had already killed two of Home's shipped intentions:**

| What the code says | What it rendered | Why |
|---|---|---|
| NORTH2: `title-page font-normal` on "Welcome home," — with a paragraph quoting UIA § 8's *"shouting in bold is spending the emphasis budget on the shout"* | **font-weight 600** | `.title-page{font-weight:600}` beat `.font-normal` |
| NORTH1: `leading-[1.02]` on the household's name | **line-height 1.15** | `.text-signature{line-height:1.15}` beat `.leading-[1.02]` |

**NORTH2's re-voicing of the salutation never happened.** The change was reasoned, argued from the
governing law, reviewed, and shipped — and the salutation stayed semibold, which is the exact thing
the change was written to stop. The comment describing the fix outlived the fix.

**Now measured, live:** salutation **600 → 400**; signature box **101px → 90px** (88 × 1.02).
**Verified in the compiled production CSS**, not merely in source: `.font-normal` (byte 70923) and
`.leading-\[1\.02\]` (71400) both fall after `.title-page` (18212) and `.text-signature` (18604).

**The rule this establishes:** *a role is a starting point, not a cage.* If a role must ever be
un-overridable, that is a decision stated out loud in the register — never a side-effect of which
`@layer` block someone pasted it into.

**Blast radius: one surface, measured before the move and verified after.**
A grep of every `title-*` in `client/src` for an adjacent weight or size utility returns **exactly
one hit** — NORTH2's `font-normal`. Nothing else in the codebase tries to override a role, so
nothing else can change when overriding starts working. Verified by looking as well as by grep:
five other rooms captured before and after are **byte-identical** (§ 5.2).

This admits **no new pattern** under UIA § 17. Tailwind's layer order (base → components →
utilities) exists to express exactly this relationship; the move applies the pattern the layer
system already had to the one block that had opted out of it.

### 2.2 The doors became doors

`home-experience-page.tsx` — each door was a **164px** box holding an icon, a name, a marketing
line, and a chevron in a disc stranded at the bottom of ~40% dead space. **Icon · Title · Tagline ·
CTA is the anatomy of a pricing page**, and four in a row is a landing page's "features" strip
standing in the hall of a house.

A door is a **name and a handle**, at hand height, on one line. **58px.**

`DOOR_LINES` is **retired** — "Plan your meals with ease" · "Discover recipes and inspiration" ·
"See what you have at home" · "Your list and reminders". These were the last strings on Home with
**no owner and no source**: not facts about the household, not facts from a canonical owner.
**NORTH1 § 5.7 had already deleted the render's "Nourishing food. Happy home." from this very room
as *a marketing line inside the product* — and then kept four more of exactly that on the doors.**
Kept Room ordering law 8: **truth before charm.**

**Nothing was removed from the house.** The four hrefs, labels, glyphs and `data-testid`s are
byte-identical and still come from UX1's one list via `roomsByHref`. Only the brochure left.

### 2.3 The room now fits inside the house

**Measured at 1440×900 — the commonest laptop in the world:**

| | before | after | |
|---|---|---|---|
| Doors of the house (bottom edge) | **y = 936** | **y = 787** | nav starts at **y = 839** |
| "See your full dashboard" | y = 993 | y = 844 | |
| Greeting top edge | y = 121 | **y = 89** | Companion card top: **y = 89** |

**The bottom 60% of every door in this house was behind the toolbar**, and "See your full
dashboard" was never seen at all. NORTH2 fixed precisely this for the **one** door — *"a door you
must scroll to find is a door the room did not offer"* — and did not look 100px lower, where four
more were sliced in half. On the quiet day the **entire room** now stands above the nav.

**`lg:pt-8` is gone from the greeting**, and the two things at the top of the room now rest on
**one shelf**. It had pushed the household's name 32px *below* the Companion's card in the same
grid row: the room's first horizontal line was drawn by a notice from the software, and the person
came second, by 32 pixels, on the surface whose entire job is to greet them. Nothing was designed
to do that — a padding did it, quietly.

**NORTH2's pause is byte-untouched.** The air between the arrival and the work (`lg:mt-16`) is
exactly as NORTH2 set it. Every pixel NORTH3 reclaimed came from **dead space above the first
word** — which is where NORTH2's own finding said air should come from.

---

## 3. What was refused, and by whose rule

**Being able to name what you did not do is the difference between art direction and decoration.**

| Asked for | Refused because | Owner |
|---|---|---|
| **The North Star's left rail** | *"There is exactly one primary navigation structure, identical in content and order everywhere."* The shell is byte-identical everywhere, and **an emotional or experimental surface earns no exception to it.** | EA § 8; Blueprint § 14; EL Principle E |
| **Authoring an orchard** | The owner's ruling (§ 1). NORTH3 *could* have rendered one via headless Chromium; it was offered and declined. | Colin Clapson, 2026-07-17 |
| **Removing "Home" from the header** | Blueprint § 18 open item 2 names this as an **unclosed governance item**: *"one must be canonical or the exception recorded."* Resolving it by taste would be inventing a third treatment. **Reported, not fixed** (§ 6.1). | Blueprint § 18 |
| **Changing the signature typeface** | Caveat was ruled **ADOPT** by the owner on 2026-07-17. A typeface is a UIA § 8 value; changing it needs admission, not an opinion. **Reported** (§ 6.2). | UIA § 8; register row 37 |
| **Warming `--ground-plane` so the counter reads as a plane** | It is a governed token value (ODL2's, from Study A). **It turned out not to be needed:** bounding the counter (§ 2.3) made it legible as a plane without touching a value. | UIA § 16 |
| **Photographic props on the doors** | *"Data-borne or dead."* Unchanged from NORTH1. | Blueprint § 12.1 |

---

## 4. What was found by looking

### 4.1 Two shipped intentions that never happened
§ 2.1. **Both passed every gate.** A typecheck cannot see a dead CSS override; a build cannot;
the adoption register cannot. Only measuring the rendered page can — which is why
`scripts/measure-north3-home.ts` now exists rather than the numbers being quoted from a session
that is over.

### 4.2 The "orchard concepts" are not orchard concepts
NORTH2 established that all four copies of the asset are byte-identical (md5 332f82…) but named two
of them only by path. **NORTH3 opened them.** `attached_assets/orchard_background_concept_*.png` are
**the same watercolour meadow** — ungraded originals of the shipped asset, not concepts at all
despite the filename. **Nothing in this repository has ever depicted an apple orchard.**

### 4.3 🔴 Two further breaches in the shipped asset that NORTH2 did not record
Both are now in the register's `externalDependency`, and **no grade can fix either**:

1. **Fog.** The bottom third is white mist. Blueprint § 16 names fog *explicitly* as **the second
   sun** — *"a room at dusk, **in fog**, in spa-light, or under drama"* — and Experience Language
   § 3A fixes the orchard against *"gloomy, misty, melancholy"* by name.
2. **The sun is on the horizon, not upper-left.** Blueprint § 7: *"the morning sun sits upper-left,
   **forever**, in every room; every shadow on every surface in every domain agrees."* The asset's
   sun sits low and centre-left — a sunrise, not a bright morning. It is *why* `orchard-backdrop.tsx`
   must crop the sun **out** of Home's window to stop it blowing out. **The house's one-morning law
   is currently kept by a crop, not by the picture.**

### 4.4 ⚠️ A concurrent session's work landed inside NORTH3's evidence
**A CONV1 P9 session was live in this workspace throughout**, and P10 started before NORTH3 closed.
HEAD moved twice under this session (`5c4611e8` → `f62b5839` → `a9116faa`). This is not trivia:
**the dashboard capture differed from its baseline, and the obvious reading was that NORTH3's CSS
had done it.** It had not. Isolated properly:

- CSS **reverted** to HEAD → dashboard **still differs** from NORTH2's 10:14 baseline.
- CSS **applied vs reverted** → **byte-identical** (md5 equal, 339622 bytes).

The drift was P9's Stories-engine edits (`shared/stories/engine.ts`, 10:57), which the dashboard
renders. **A concurrent session's work is indistinguishable from your own in a screenshot**, and the
only defence is isolation rather than inference.

---

## 5. Gates and verification

### 5.1 Gates — nothing added, nothing masked

| Gate | Result | |
|---|---|---|
| `adoption:check` | **80 · 0 · 2** | Was 79·0·2. **+1 pass** = the `type-roles` row NORTH3 created. **Same 2 pre-existing failures**, unmasked: `button-primitive` (539 v ceiling 538) and orphan `HouseholdNutritionPanel.tsx`. **Proven not mine:** zero raw `<button>` in my files at HEAD *and* now; `HouseholdNutritionPanel` is not in my diff. The button ceiling was **not** raised. |
| `typecheck:ci` | **32 regressions — identical set** | P7 and P8 both recorded "32 — identical set". **All 32 are in `server/`; zero in `client/src`.** NORTH3's diff is client-only. |
| `npm run build` | **clean** | Warnings pre-existing (`import.meta` in a benchmark bundle). |
| Compiled CSS | **verified** | § 2.1 — byte offsets in the production bundle, not the dev server. |

### 5.2 The platform was looked at, not just the room
NORTH2's rule: *"a palette that flatters Home and breaks the Planner is not a warmer house; it is a
prettier front door on a worse building."* A CSS layer change is platform-wide by construction, so
all five other rooms were captured and compared:

| Room | Result |
|---|---|
| planner · cookbook · pantry · shopping | **byte-identical** |
| dashboard | differs — **proven to be CONV1 P9's**, not NORTH3's (§ 4.4) |

Artefacts: `docs/ui-audit/north3-home/` (before/after at 1440×900 viewport + fullPage, 1440×2000,
1024, 820, 390, 390×1800, quiet day desktop + mobile, room-material, room-doors, room-full) and
`docs/ui-audit/north3-home/rooms/`.

### 5.3 Behaviour preserved
No API, query, hook, resolver, route, `data-testid`, or component contract changed. `todayLabel()`,
`useCurrentPlannerWeek`, `resolveHomePrimaryAction`, the Notice Engine's verbatim sentences, the
three-state WAITING/BROKEN/EMPTY discipline and the unanchored-Home state are all byte-untouched.
**No migration. Code and one generated register document only.**

---

## 6. Open items — reported, not fixed

### 6.1 🔴 Home's header still says "Home" *(Blueprint § 18 open item 2, still open)*
A tinted realm bar reading **"Home"** sits directly above a greeting reading **"Welcome home,
Chloe"**. *You do not put a sign saying "Entrance Hall" in your entrance hall*, and it is the first
thing the eye meets in a room whose whole job is to say hello. It is also, by some distance, the
least homelike element NORTH3 leaves behind.

**It was not fixed, and that is deliberate.** Blueprint § 18 item 2 names this as unresolved
governance: *"the live Home and the realm surfaces currently present two shell treatments; one must
be canonical or the exception recorded in the register (§ 14)."* The two lawful closures are (a)
make one canonical — a shell decision, the owner's — or (b) record the exception. **Picking a
winner by taste would be inventing a third treatment**, which is the one thing § 14 forbids
outright. **Recommendation: Home passes no `title`, and the exception is recorded.** Owner's call.

### 6.2 The signature is a marker pen
Caveat reads as a whiteboard marker or a craft-fair chalkboard. The North Star's hand is a light,
refined, humanist stroke — *"a modern home in an ancient orchard"*, not a greeting card. This is a
UIA § 8 **value**, ruled ADOPT by the owner on 2026-07-17, and NORTH3 will not overturn a ruling by
opinion. **Recommendation: worth re-examining against the North Star plate, as its own decision.**

### 6.3 The doors of the house sit 60px above the same four doors in the nav
Planner · Cookbook · Pantry · Shopping appear **twice**, with the same glyphs, 60px apart. NORTH1
justified the tiles by Blueprint § 5.1 (*one home, many places*), and the North Star has them —
**but the North Star has a left rail and no bottom nav, so there they are the only way in.** Here
they are a second navigation above the first. NORTH3 made them quiet and honest rather than
deleting them, because deleting them is a behaviour change and this was not the session for it.
**Named so the next audit does not rediscover it.**

### 6.4 Inherited, unchanged
`orchard-environment.openMigration` — **five surfaces still mount `/orchard-bg.webp` without its
owner** (`dialog.tsx:48` puts the orchard behind *every dialog in the product*), and the gate is
enforced on the wrong noun so it reports green. NORTH2 found it; NORTH3 did not fix it; it is
architecture, not art direction. **`signature-typography.openMigration`** — the eight arrival
prototypes, still deferred by the owner's explicit decision.

---

## 7. Governance compliance

**Experience Test** (Blueprint § 15.3) — **Which room?** Home, the entrance hall (§ 5.1 map).
**How should someone feel?** Expected. Welcomed before being asked for anything. **The one thing?**
*Arrive, be oriented, step through the one right door* — which is now, measurably, possible without
scrolling.

**Blueprint Checks** (§ 15.2) — *One home*: shell byte-identical; no exception claimed. *A room,
not a theme*: no new palette, architecture, navigation or costume; four marketing lines **removed**.
*The map respected*: E3 unchanged. *Orchard law*: **asset byte-untouched**; exposure untouched; no
type on the view. *One morning*: no light, hour, season or shadow touched. *Material honesty*: one
ground, never nested; nothing new on the environment; **air kept generous** — and the air reclaimed
was dead, not breathing. *Living Detail discipline*: still exactly one (the greeting), still
data-borne; **none added**. *The Companion in its chair*: unchanged. *The walls untouched*: **yes**.
*The governance path*: **no value shipped** — no colour, token, radius, shadow, duration or exposure
was created or changed. A `@layer` correction sets no value.

**Design Character Check** (OHDB § 16.2) — *Architectural character*: nothing faux added; four
applied taglines removed. *Interior philosophy*: **composed emptiness** — the doors' 40% dead space
was bare emptiness pretending to be composure. *Timeless, not fashionable*: a feature-card strip is
a fashion; a name and a handle is not. *Design disappears*: **the strongest claim here** — the
household will not name any of this; they will find the doors are all there. *The room reading
honoured*: § 13.1's *"compact counter — the view keeps its share"* is **more true** than before.

**Experience Language § 3A** — *"Calm must never become lifeless."* The risk in this change is that
removing four sentences cools the room. It does not: the sentences were about **THA**, not about the
household, and the room's warmth comes from the household's name and their real plan.

**Product Registry** — Home's entry: the four door taglines no longer exist and should be dropped
from any surface inventory that quotes them. **Flagged for the registry's owner; no runtime code
reads it (PKR21).**

---

## 8. The honest closing

**A first-time visitor still arrives in a beautifully made room with a field outside the window.**
NORTH3 made the room quieter, truer and whole — the brochure is gone, the doors are doors, the
person is greeted before the software speaks, and nothing in the house is sliced by a toolbar. It
also found that Home had been shipping two decisions it was not actually making, and freed every
future surface from the same trap.

**But the brief asked for the feeling of the North Star, and the North Star's feeling is carried by
an orchard.** That is now an **external brand dependency** with a named owner, a full spec, and a
room built to receive it with no code change. **When the picture lands, this room is ready for it.**
Until then, everything above is the ceiling that NORTH2 named and NORTH3 could not raise — because
raising it was, correctly, taken out of engineering's hands.

*If every piece of text disappeared, would the page be instantly recognisable as The Healthy
Apples? Not yet. It would be recognisable as a calm, warm, well-made room. The apples are still
outside the window, waiting to be painted.*
