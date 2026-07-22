# Living Home Completion Programme (`LHC1`)

| Field | Value |
|---|---|
| **Programme ID** | `LHC1` |
| **Date** | 2026-07-22 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback ID** | `rollback/LIVING-HOME-COMPLETION-20260722` → `56628c7a` (annotated tag) |
| **Status** | Governance + one lawful, owner-aligned presentation fix. Awaiting Home Owner walk-through. |
| **Governing parents** | `LIVING_HOME_EXPERIENCE_ARCHITECTURE.md` (LIVINGHOME1) · `LIVING_HOME_ENVIRONMENTAL_DRESSING_ARCHITECTURE.md` (LIVINGHOME2) · `HOME_OWNER_ARCHITECTURE.md` (HOMEOWNER1) · `UI_CANONICAL_EXPERIENCE_OWNERSHIP.md` (UIOWN1) · `GOVERNING_EXPERIENCE_ARCHITECTURE.md` (GEA1–GEA23) |
| **Motivated by** | `docs/investigations/HOMEOWNER2_LIVING_HOME_REVIEW.md` (Apple-Design-Award-bar critique, 7/10) — point-in-time history, not a source of rule |

---

## What is a Living Home?

*A constitutional definition, added by `LHC1`. It is a **synthesis of law already owned** — it restates no rule (each idea cites its owner, per LIVINGHOME1 §2.3 restate-no-rule) and creates **no runtime behaviour, ownership, capability, token, route, or gate**. It exists so that "complete the house" has one shared meaning a decade of contributors can check a room against.*

A Living Home is not an application that happens to be organised into pages. It is **software that quietly cares for a household** — a place a family arrives in and moves through, kept by someone whose care the home simply shows (HOMEOWNER1: *"Someone cares for it… in a real home that person has no job title; the home simply shows their care"*, cited).

Its constitutional purpose rests on six commitments, each owned elsewhere and assembled here:

- **It cares for a household, quietly.** The home's job is to leave the household with *less to carry*, not more to attend to — *"a warm, lived-in home where someone has already thought about dinner"* (Experience Blueprint, cited). Care is felt, not announced.
- **Hospitality before productivity.** Where welcome and efficiency conflict, welcome wins (**GEA1**, cited). The home is measured first by how it feels to be in, and only then by what it lets a household get done.
- **Rooms represent places, not features.** Each room is a viewpoint into one house — differentiated by purpose, light and material, never by its own architecture (LIVINGHOME1 §4 *"Rooms are viewpoints, not environments"*; Blueprint *One Home, Many Places*, cited). A room is somewhere you *are*, not a screen you are *on*.
- **Intelligence supports rather than directs.** The Companion enriches; it never takes the decisions that are the household's. The rooms observe, the Companion understands, the household decides (**GEA21–GEA23**, cited); intelligence is felt as *a better answer, never a visible mechanism* (**GEA16**, cited).
- **Technology becomes quieter as trust grows.** A more capable THA is a *quieter* THA (**GEA2**, cited), and the house is never engineered to be returned to more often (**GEA3**, cited). As a household comes to trust the home, the technology recedes and the household stays present (Blueprint Technology Principle, cited).
- **The home should feel cared for even when nothing new has happened.** Calm must never become lifeless (Experience Language §3A.4, cited); the still house is worth returning to precisely because it is *kept* — *"the care that keeps the still house worth returning to never finishes"* (HOMEOWNER1 Principle 11, cited). An empty day in a Living Home still feels tended, not vacant.

The founding distinction holds beneath all six: **the house holds still; the life moves** (LIVINGHOME1 §3, cited). A Living Home is the constant place, quietly kept, in which a household's own changing life is shown truthfully — and nothing else.

---

## Living Home Maturity Model

*A governing evaluation model, added by `LHC1`. It is a **lens for assessing the experience quality of a room**, not a mechanism: it introduces **no new runtime behaviour**, no schema, no ownership, and no gate that duplicates an existing gate. It ranks nothing about a **household** (GEA13) — it assesses the **house's** care for the household, which is the Home Owner's proper subject (HOMEOWNER1). It exists so that "done" is legible: a room is not finished when it works; it is finished when it feels like home.*

Every room sits at one of four architectural maturity levels. The levels are **cumulative** — a room reaches a level only by holding every level beneath it.

**Level 1 — Constructed.** *The house has walls and doors.*
- The room exists (a route, a page).
- Navigation reaches it (`NAV_ITEMS`).
- Ownership exists (its facts have a canonical owner).

**Level 2 — Functional.** *The room works.*
- The room fulfils its purpose (its `ROOM_PURPOSE`).
- Canonical ownership is complete (no fact re-owned by the UI — GEA17 / UIOWN1).
- Business workflows are complete.

**Level 3 — Hospitable.** *The room is a pleasure to be in.*
- **Calm** — nothing engineered to hurry or to grade (GEA3 / GEA13).
- **Balanced** — surplus space becomes air and view, never absence (GEA11).
- **Warm** — the house's materials and voice, not a cold or clinical form (Experience Language §3A).
- **Inviting** — the threshold welcomes; controls read as offers, not chores.
- **Comfortable to spend time in** — no anxiety, no clutter, no clinical note.

**Level 4 — Living.** *The room is alive.*
- **Quiet environmental life** — the home's own hospitality layer, present without claiming (Environmental Dressing, LIVINGHOME2 — *gated*).
- **Seasonal presence** — the year turns through the household's life, never the house's light (LIVINGHOME1).
- **Household awareness** — the room shows what is true of *this* household, or nothing.
- **Feels cared for** — tended even when nothing new has happened.
- **Feels like a real home rather than software.**

**How this programme reads against the model.** Most THA rooms today hold **Level 2** solidly and reach into **Level 3**: identity, ownership and workflows are complete, and the atmosphere frame — window, ground, light, voice — is built (§1). What HOMEOWNER2 circled is largely the **Level 2 → 3 finish** (composition, balance, honest content, trust in the numbers) — the §6 roadmap. **Level 4** is deliberately gated: its environmental life is the declared-not-built Environmental Dressing layer (§2, §4), which no instruction may ship around (HOMEOWNER1). This model changes none of that governance; it only names where each room stands and what "up" means.

---

## 0 · What this programme is, and what it is not

The Living Home has reached the point where **room identity is a core product capability, not a future enhancement.** This programme completes the house: it makes the Living Home the **governing source for room identity and atmosphere**, and it defines *done* for every room.

It is **not a redesign of THA.** It creates **no** new route, capability, entity, schema, token, component, business logic, navigation system, or second assistant. It introduces **no duplicate ownership.** Every room's identity is expressed through **owners that already exist** — the shell's room-identity system and the Living Home governance stack — this document only assembles them into one map and names the gaps.

The one honest thesis of the whole programme:

> **The house's identity and atmosphere are already governed and largely built. What remains is (1) finishing room bodies to the Award bar — composition, balance, honest content, trust in the numbers — which are owner-visual-judgement increments, not new architecture; (2) the deliberately-gated Environmental Dressing layer, which stays gated behind its named owner amendments; and (3) one true identity gap — the Support Hub has no governed voice.**

This is why the programme is mostly governance and only one line of shipped code. It follows the discipline the LARDER_NS1 and HOSP1 sessions already set: **govern first, implement only what is lawful and owned, and record the larger visual moves as owner decisions rather than shipping them as exceptions** (HOMEOWNER1: *the Home Owner exercises authority through the governing documents, never around them*).

---

## 1 · The room-identity mechanism already exists and is owned

Nothing below invents a way to give a room identity. THA already has one canonical, centrally-owned system. This programme's first act is to **name it as the governing implementation of Living Home room identity**, so it is never re-derived ad hoc again (the TIME3/PKR1 lesson: *investigations discover; the owner owns*).

| Concern | Owner (file) | Mechanism |
|---|---|---|
| The room list (names, routes, doors) | `client/src/components/nav-bar.tsx` → `NAV_ITEMS` | single source of truth for every nav surface; `label` is the room's name everywhere |
| Each room's identity light (hue) | `nav-bar.tsx` → `REALM_STYLES` | per-realm hue; the lit room shown by light, `--nav-hue` |
| Each room's window depth | `client/src/components/layout/app-shell.tsx` → `ROOM_EXPOSURE` (EXPADOPT1) | E0/E1/E2/E3 per Blueprint §6.2 (exposure ∝ 1/density) |
| Each room's ground posture | `app-shell.tsx` → `ROOM_GROUND` (INTARCH1) | full / room / air / none — the one thing a room may vary |
| Each room's voice, said once | `app-shell.tsx` → `ROOM_PURPOSE` (EXP1) | one threshold line per room; a **fact**, never coaching (GEA21) |
| The threshold + orchard window | `app-shell.tsx` → `RoomThreshold`; `orchard-backdrop.tsx` → `OrchardWindow` (E3, Home) / `OrchardRoomWindow` (E2) | the orchard seen through real joinery; `null` when shuttered (E0) |
| The one Companion door | `conversation/FloatingAssistant.tsx`, mounted once in `app-shell.tsx` | the friend at the counter — a presence, not a room (Blueprint) |

**Consequence for "does every room have an identity?"** — Yes. Every nav room already resolves a name (`NAV_ITEMS`), a light (`REALM_STYLES`), a window depth (`ROOM_EXPOSURE`), a ground (`ROOM_GROUND`) and — for the nine threshold rooms — a voice (`ROOM_PURPOSE`). The atmosphere HOMEOWNER2 praised ("the orchard windows are genuinely lovely") is this system, already built. The gaps it circled are almost all in **room bodies** (composition, content, controls) or in the **one unbuilt layer** (dressing), not in the identity frame.

---

## 2 · Environmental Dressing: evolved from "optional enhancement" to governing layer

The brief asks that Environmental Dressing be evolved into governing Living Home architecture "rather than treating it as an optional enhancement." **It already is governing law** — `LIVINGHOME2` is GOVERNING for the layer it defines. What this programme adds is to **seat it explicitly inside the Living Home room-identity model** as the home's third layer, and to record the standing owner decision about building it.

The Living Home is now stated whole, as three layers (LIVINGHOME2 §0), governing **every** room:

| Layer | Law | Owner | Built? |
|---|---|---|---|
| **House** | *Never changes.* Walls, one orchard, one morning, palette, tokens, nav, geography. | `THA_UI_ARCHITECTURE.md`, Blueprint, the shell's identity system (§1) | **Built.** |
| **Environmental Dressing** | *The home quietly lives.* A claim-free, non-personalised hospitality layer that turns only with the year. | `LIVINGHOME2` (ED1–ED12) | **Declared, not built.** Blocked until the §10.2 amendments land. |
| **Household Life** | *The household's true data*, shown truthfully or not at all. | Each domain's canonical owner (UIOWN1) | **Built** per domain. |

**The owner decision this programme records (not makes).** Building the dressing layer requires the four owner amendments named in `LIVINGHOME2 §10.2` — Blueprint §12.1.2 (the prop ban refined), OHDB §11 / EXP5 §5.3 (the "seasonal dressing declined" verdict annotated), LIVINGHOME1 (three bounded amendments to §5.2 / LH3+ladder / §10.4), and EXP3 (the Dressing Register added) — **each made in the owner's own file, at its own review.** This programme does **not** make them (HOMEOWNER1: a change contradicting a governing rule is an *amendment proposal to the rule's owner*, never an exception granted here). It elevates the decision to the top of the roadmap (§6) as **Owner Decision A**, because HOMEOWNER2's "make it feel like a real place" is, in its lawful form, exactly this layer — and it has now been deferred three times (HOSP1 Path A, LARDER_NS1 §7, and here). The placement law stands regardless: **no produce dressing in the Larder, no book dressing in the Cookbook, no meal-shaped dressing in the Planner** (LIVINGHOME2 §5.1) — dressing must read as *the home's warmth*, never as *this room's information* (ED3).

No duplicate systems are created: dressing has exactly one future owner (the Dressing Register, LIVINGHOME2 §10.3), one mouth, and never a channel (ED11).

---

## 3 · Room-by-room completion definitions

Each room is defined across the eleven dimensions the brief requires. "Gaps" cite the HOMEOWNER2 note number and, where the gap is already owned elsewhere, the owning decision. **HOMEOWNER2 items are finishing defects unless marked (ARCH), which means they need a governed amendment or an owner decision.**

### 3.1 · Home — `/home`

- **Architectural identity:** The hearth and the arrival. The emotional centre of the house (Experience Architecture); the only room that draws its **own E3 window** (`OrchardWindow`, real joinery + mullions) over its own plaster ground (`.home-room`).
- **Purpose:** The first breath; today at a glance; the doors on the counter (`roomsByHref`).
- **Emotional intention:** *"A warm, lived-in home where someone has already thought about dinner."* Calm, welcoming — never hurried.
- **Permanent architectural elements:** the E3 orchard window; `.home-room` ground; the greeting; the doors-on-the-counter; the one morning, one sun.
- **Living Home atmosphere:** E3 — the deepest view in the house, because Home is the least dense room (exposure ∝ 1/density).
- **Seasonal behaviour:** the household's food in season, shown truthfully; **the house's light and orchard never change** (LIVINGHOME1: the house holds still).
- **Household-aware behaviour:** greeting word by the household's hour (Household Time / INT21); primary door aimed by the HOME2 resolver; today's meals / plan / shopping cards from their canonical owners.
- **Companion relationship:** the floating door rests here, top-right; it introduces itself on a first visit (PRESENCE2) and speaks only when it has something worth saying (GEA15).
- **Functional boundaries:** Home **composes** from owners; it persists nothing, owns no business state, and raises no reach (UIOWN1 composition rules).
- **Existing architecture to reuse:** `OrchardWindow`, `.home-room`, `roomsByHref`, the HOME2 door resolver, `home-experience-page.tsx`.
- **Remaining gaps:** ~~ticking trial countdown (Home 1)~~ **fixed this pass (§5)**; heavy gold "windowsill" band (Home 2); oversized script name inverts hierarchy (Home 3); left-weighted balance / empty right half (Home 4 — GEA11 *surplus space becomes air and view*, being spent as absence); glance truncated at the fold (Home 5); ten-door bottom nav on desktop (Home 6, **ARCH** — see §6 Owner Decision C); faint Companion launcher colliding with the banner close (Home 7).

### 3.2 · Cookbook — `/cookbook`

- **Architectural identity:** The living cookbook — the household's own shelf. E2 window, ground "room", hue 38.
- **Purpose:** "Discover, create and cook meals your household will love." (`ROOM_PURPOSE`).
- **Emotional intention:** appetite and warmth; a shelf that looks cooked-in.
- **Permanent architectural elements:** E2 orchard band; the room ground; the kitchen/library shelves (COOKBOOK1 — `shared/cookbook/curation.ts`).
- **Living Home atmosphere:** E2; shelves named, not counted.
- **Seasonal behaviour:** none in the house; the household's meals are the life.
- **Household-aware behaviour:** the household's own recipes are the hero; the THA kitchen (10 authored) sits above the demoted library (490 generated), still searchable and planner-reachable.
- **Companion relationship:** may enrich only through the registered `meals` capability; owns no recipe data.
- **Functional boundaries:** presentation renders the authored/generated distinction from its owner (`curation.ts`), never re-owns it (GEA17/18).
- **Existing architecture to reuse:** `curation.ts`, 4:3 image + name-beneath layout, `meals-page.tsx`.
- **Remaining gaps:** identical placeholder ghosts / **no food photography** (Cookbook 1, **ARCH/Owner Decision B** — COOKBOOK1 §8: commission photography); action rail looks disabled (Cookbook 2); ambiguous multi-chip selection (Cookbook 3); low-contrast title over the washed hero (Cookbook 4); web-search banner outweighs "Your recipes" (Cookbook 5).

### 3.3 · Larder — `/pantry`

- **Architectural identity:** The household larder — *what you keep.* Renamed Pantry → Larder (LARDER1 / LARDER_NS1). E2 window, ground "room", hue 118.
- **Purpose:** "See what you keep." (`ROOM_PURPOSE`).
- **Emotional intention:** the quiet reassurance of a well-kept larder read *by looking*.
- **Permanent architectural elements:** E2 orchard band; room ground; the staple shelves (Domain 30, `user_pantry_items`).
- **Living Home atmosphere:** E2. **No produce dressing here** (LIVINGHOME2 §5.1 — a bowl of apples in the Larder would become a claim about your stock, ED3).
- **Seasonal behaviour:** none in the house; staples are the household's own fact.
- **Household-aware behaviour:** staples are Domain 30; "what needs buying" stays Shopping (Domain 15); moving an item to Shopping must **not** clear its staple status (LARDER1).
- **Companion relationship:** enriches only via the registered `pantry` capability; owns no Larder/Shopping data.
- **Functional boundaries:** no quantities, no freshness/expiry, no second owner of buying or food identity (Domain 30 owns no time).
- **Existing architecture to reuse:** the LARDER1 North Star (physical-larder interface); `pantry-page.tsx`; Domain 30.
- **Remaining gaps:** "+ Need" pill on every row (Pantry 1); 6+3 competing tab sets (Pantry 2 & 5); hollow checkboxes dominate (Pantry 3); two add-item styles (Pantry 4). The fully-dressed physical Larder (LARDER1 North Star realised) is **ARCH/Owner Decision A** (Blueprint + LIVINGHOME2 amendment path).

### 3.4 · Planner — `/planner`

- **Architectural identity:** The family planning table (Blueprint). E1 window, ground "full", hue 172.
- **Purpose:** "The week's meals, planned around your household."
- **Emotional intention:** an open table with room to breathe — open evenings, not blank database rows.
- **Permanent architectural elements:** E1 morning light; the full working ground; the continuous dated timeline (PLANNER1 — `planner_weeks`, unbounded ordinal + `weekStartDate`).
- **Living Home atmosphere:** E1 (a working surface earns less window than a browsing room).
- **Seasonal behaviour:** the household's plan is the life; no house season.
- **Household-aware behaviour:** the current dated week lands on arrival; unbounded prev/next; meals planned around the household's diets.
- **Companion relationship:** may suggest through registered capabilities; the room **reports**, the Companion **advises** (GEA8).
- **Functional boundaries:** no scoring, ranking or streaks on the household's week (GEA13); PRESENCE1 already retired the interpretation grids from both the expanded panel and the compact row.
- **Existing architecture to reuse:** PLANNER1 timeline; `weekly-planner-page.tsx`; `PlannerProvider`.
- **Remaining gaps:** spreadsheet density (Planner 1); eleven co-equal rail buttons, no primary (Planner 2); the "🔥 62" flame framing under each day (Planner 3 — **verify vs GEA13**: if it grades the week it is refused, if it is plainly-labelled calories it is de-flamed; owner call, code-check first); "N boost ideas" repeated per cell (Planner 4); cluttered sub-toolbar (Planner 5).

### 3.5 · Shopping — `/shopping-workspace`

- **Architectural identity:** Preparing to leave the house (Blueprint). E1 window, ground "air", hue 190.
- **Purpose:** "One list, ready for the shop."
- **Emotional intention:** a calm, confident, single list — not a barren void.
- **Permanent architectural elements:** E1 light; the air ground; the one list (Domain 15, the sole owner of what needs buying).
- **Living Home atmosphere:** E1.
- **Seasonal behaviour:** none; the list is the household's own.
- **Household-aware behaviour:** the household's list, plus Larder staples surfaced (LARDER1 originates entries, holds no rival list).
- **Companion relationship:** enriches via the registered `shopping` capability; owns no list data.
- **Functional boundaries:** one owner of the list (Domain 15); no second list.
- **Existing architecture to reuse:** `shopping-workspace-page.tsx`; Domain 15.
- **Remaining gaps:** vast empty void below the list (Shopping 1 — GEA11); **"12 items in list" vs 3 shown (Shopping 2 — TRUST**, §Trust Check); committed items styled like placeholder text (Shopping 3); tiny, near-invisible capture tools (Shopping 4).

### 3.6 · Nutrition — `/nutrition`

- **Architectural identity:** The variety on the household's table. E2 window, ground "room", hue 145. `plant-diversity-page.tsx`.
- **Purpose:** "The variety on the household's table."
- **Emotional intention:** quiet encouragement of variety — never a grade.
- **Permanent architectural elements:** E2 orchard band; room ground.
- **Living Home atmosphere:** E2.
- **Seasonal behaviour:** none in the house.
- **Household-aware behaviour:** the plant-diversity count reflects the household's real week.
- **Companion relationship:** interprets diversity as encouragement, never the room; the room reports the count (GEA21/22).
- **Functional boundaries:** **Nutrition owns nothing as a room** (UIOWN1) — knowledge is Domain 1's, the diversity rule Domains 4/22's, and **no target, score or streak exists to own** (GEA13).
- **Existing architecture to reuse:** Domains 1/4/22; `plant-diversity-page.tsx`; `data-realm="nutrition"` (added ROOM1).
- **Remaining gaps:** hollow container wrapping two tabs (Nutrition 1); competing figures / "number soup" (Nutrition 2); six sort chips (Nutrition 3); **17-vs-18 count mismatch (Nutrition 4 — TRUST**).

### 3.7 · Diary — `/my-diary`

- **Architectural identity:** A quiet record of the household's days. E2 window, ground "air", hue 348. `food-diary-page.tsx`.
- **Purpose:** "A quiet record of the household's days."
- **Emotional intention:** warm remembrance — never a clinical health tracker (Emotional Palette: never *clinical*, never *cold*).
- **Permanent architectural elements:** E2 band; air ground.
- **Living Home atmosphere:** E2.
- **Seasonal behaviour:** none in the house; the day is the household's.
- **Household-aware behaviour:** the day's meals and optional signals reflect what the household recorded.
- **Companion relationship:** may notice across days ("lentils have quietly become a habit"); the room shows the day (GEA22 — the window vs the person).
- **Functional boundaries:** no BMI/kcal verdicts as the greeting; signals are optional and secondary (GEA13, honest-absence).
- **Existing architecture to reuse:** `food-diary-page.tsx`; `EmptyState`/`Skeleton` owners (UINORTH1).
- **Remaining gaps:** greets with two blank dashes "– BMI / – kcal · Not set" (Diary 1 — honest-absence: hide unset or invite gently); boldest stat is the least meaningful (Diary 2); clinical "Daily Signals" form leads with weight (Diary 3); five empty meal accordions read as chores (Diary 4). The daily-log body redesign is an **owner visual-judgement** increment (ROOM1 §4).

### 3.8 · Household / Profile — `/profile`

*The brief lists "Household" and "Profile" separately; in the house they are one room — the nav door is **Household**, and **Profile** is the Personal tab within it. One owner, no duplication.*

- **Architectural identity:** The family record — the people this home cooks for. Ground "air", hue 30. `profile-page.tsx` (tabs: Personal / Household / Account).
- **Purpose:** "The people this home cooks for."
- **Emotional intention:** a warm portrait of the people, not an administrative settings form full of blanks.
- **Permanent architectural elements:** the air ground; the household record (Domain 16); the personal record (Domain 35 personal-data registry).
- **Living Home atmosphere:** E1 (unmapped → safe direction; a record room earns quiet, not a window).
- **Seasonal behaviour:** none.
- **Household-aware behaviour:** the members, diets, allergies and goals the household declared.
- **Companion relationship:** does not intrude on the record; may reference declared facts only through registered, permission-aware capabilities.
- **Functional boundaries:** Household owns Domain 16; the person's special-category data is Domain 35's; no scoring of the family.
- **Existing architecture to reuse:** Domains 16/35; `profile-page.tsx`.
- **Remaining gaps:** hollow container wrapping three tabs (Household 1); **raw machine email under the name (Household 2 — TRUST/warmth**); a wall of "No preference / None / Not set" (Household 3 — honest-absence: gentle optional invitations or hide); plain grey-initial avatar (Household 4).

### 3.9 · Community / Orchard — `/orchard`

- **Architectural identity:** The neighbourhood beyond the fence — the orchard seen through the window, never walked into as a wall. E2 → E3 when empty; ground "room", hue 20. `orchard-page.tsx`.
- **Purpose:** "The neighbourhood beyond the fence."
- **Emotional intention:** calm, private, reassuring ("Your orchard is quiet" + the privacy line is the warmest writing in the room).
- **Permanent architectural elements:** the orchard asset (one owner, `orchard-backdrop.tsx`); the E2/E3 window.
- **Living Home atmosphere:** E2, opening to E3 when the orchard is quiet (the empty state earns more view).
- **Seasonal behaviour:** the orchard keeps its one season absolutely (Blueprint §6.1).
- **Household-aware behaviour:** community presence reflects the household's real connections; nothing about the household is ever visible to others.
- **Companion relationship:** does not narrate the orchard; the room's own copy carries it.
- **Functional boundaries:** GEA6 — the orchard is a permanent fact of the site; a quiet orchard is *shuttered by content*, not relocated.
- **Existing architecture to reuse:** `orchard-backdrop.tsx`, `orchard-page.tsx`, the empty→E3 opening.
- **Remaining gaps:** empty gap between hero and message (Orchard 1); empty state jammed into the left third (Orchard 2 — GEA11); the room's best asset (its copy) under-presented (Orchard 3 — let it be the composed centre).

### 3.10 · Companion (Apple) — floating

- **Architectural identity:** **Not a room — a presence at the counter** (Blueprint). One door, top-right, the embossed single apple (`FloatingAssistant`).
- **Purpose:** the friend who keeps an eye on the household's food and plans so they don't have to hold it all in their head.
- **Emotional intention:** warm, present, never dominating (GEA: the Companion enriches, never dominates).
- **Permanent architectural elements:** the one embossed-apple door; the drawer; the six personalities' voices.
- **Living Home atmosphere:** inherits the room it opens over; deepens focus when open.
- **Seasonal behaviour:** none (dressing is *beneath words* — ED12; the Companion never narrates it).
- **Household-aware behaviour:** speaks from the household's real state via INT17 Context View; introduces itself once (PRESENCE2); surfaces observations verbatim (`noticeHouseholdStory`).
- **Companion relationship:** *is* the relationship — it is the sole owner of interpretation, coaching and encouragement (GEA21/22, COMP_AUTH1), held to its five permanent conditions.
- **Functional boundaries:** owns no business facts (TIP); never invents an observation; prefers silence to weak guidance (GEA15); never raises reach (COMP_AUTH1).
- **Existing architecture to reuse:** `FloatingAssistant.tsx`; the Notice Engine; INT17; the six voices.
- **Remaining gaps:** empty vertical gap in the panel (Companion 1); proactive suggestions render as plain grey body text, not offers (Companion 2); "Apple" labelled twice, stacked (Companion 3 — a clean de-duplication); weak scrim doesn't claim focus (Companion 4). Presence at rest (launcher warmth) overlaps Home 7.

### 3.11 · Admin — `/admin`

- **Architectural identity:** The back office. **E0 — shuttered, deliberately not a hospitable room** (`app-shell.tsx` forces `/admin*` to E0; UIOWN1: *Administration owns nothing*).
- **Purpose:** operational clarity for the operator, not warmth for a household.
- **Emotional intention:** calm competence; it is correct that Admin does **not** feel like the household's home.
- **Permanent architectural elements:** solid working ground (INTARCH1 → full); no threshold, no window (E0).
- **Living Home atmosphere:** none by design — a room at E0 is shuttered, not relocated (GEA6). **This is not a gap.**
- **Seasonal / Household-aware / dressing behaviour:** none — Admin is outside the hospitality surface.
- **Companion relationship:** none in the household sense; admin surfaces are operator tools.
- **Functional boundaries:** a **pure consumer** over `server/lib/access.ts` + `admin_audit_log` + Domain 32 read-only views; **no Admin domain exists, and that is correct** (UIOWN1).
- **Existing architecture to reuse:** `withAdminBanner`, `access.ts`, the admin-*-page family.
- **Remaining gaps:** none of identity — Admin's shuttered character is the governed answer. (HOMEOWNER2 did not capture Admin; it is out of the household hospitality scope.)

### 3.12 · Support Hub — `/help`, `/contact`, `/privacy-settings`

- **Architectural identity:** Where the household reaches a person and manages their rights. Hangs off the Household room (`help-centre-page.tsx`, `contact-page.tsx`, `privacy-settings-page.tsx`).
- **Purpose:** honest help, a human on the other end, and the household's control over its own data (Trust & Compliance, Domain 35).
- **Emotional intention:** reassurance — the calm certainty that *someone is there*.
- **Permanent architectural elements:** the shell walls; the household record's privacy surface.
- **Living Home atmosphere:** currently unmapped (falls to E1 quiet).
- **Seasonal / Household-aware behaviour:** none in the house; privacy settings reflect the household's real consents (append-only ledger, TC-rules).
- **Companion relationship:** the Companion may point toward help but never replaces the human channel (Trust & Compliance: reach a person).
- **Functional boundaries:** support vocabulary is `shared/support/support-request.ts`; privacy is Domain 35; no second authorisation authority.
- **Existing architecture to reuse:** the support/privacy owners; the shell; the `ROOM_PURPOSE` mechanism.
- **Remaining gaps — THE ONE TRUE IDENTITY GAP:** the Support Hub has **no governed threshold voice** in `ROOM_PURPOSE`, and its surfaces are not seated in the room-identity map. **Roadmap R1** (§6): give the Support Hub a governed voice via the existing EXP1 mechanism (owner-worded) — the single genuinely-missing piece of room identity in the house.

---

## 4 · Environmental Dressing review & evolution — summary

Reviewed `LIVINGHOME2` in full. Findings, and how this programme treats them:

1. **It is already governing, not optional.** The evolution the brief asks for is a *seating* of the layer inside the room-identity model (§2), not a promotion — done here without touching a byte of `LIVINGHOME2`.
2. **It remains DECLARED-NOT-BUILT and hard-blocked.** Nothing dressing-shaped may ship until the four §10.2 owner amendments land in their owners' files. This programme makes none of them; it records the decision to open (or hold) that path as **Owner Decision A**.
3. **The placement law governs every room's atmosphere** (§5.1) and is folded into the per-room definitions above (no produce in the Larder, no books in the Cookbook, no meals in the Planner).
4. **The "real place" feeling HOMEOWNER2 wants is, lawfully, this layer.** The photoreal dressed rooms in the North Star reference images are the dressing layer plus per-room environments — both gated. Capturing their *atmosphere* through owned mechanisms (window, ground, light, voice) is lawful now and already largely done; capturing them *literally* is the amendment path.

No duplicate ownership, no new store, no channel introduced (ED11).

---

## 5 · Implemented changes this pass

Exactly **one** lawful, owner-aligned, governance-cited, presentation-only change was shipped. Everything else is governed as roadmap/owner decisions (§6, §7).

**Home — the trial banner no longer opens with a ticking clock.**
`client/src/components/TrialBanner.tsx` — the **calm arrival state** (the "first breath" of the house) no longer renders the live per-second "Trial expires in m:ss." countdown. It keeps the honest line *"You have full access to The Healthy Apples. Changes are temporary."* (Core Principle 6 — still honest), and the **<2-minute warning state keeps its countdown** (an honest heads-up before unsaved preview data is discarded is hospitality, not pressure). The expiry timer effect (→ `/auth?trial=expired`) is **untouched**, so functionality is unchanged.

- **Why it is lawful without an amendment:** it *complies with* existing rules rather than contradicting one — **GEA3** (nothing may be engineered to increase urgency / return frequency; engagement is inverted for this product), the Experience Language anti-pattern (*anxiety* / the *funeral-parlour-vs-panic* temperatures the palette forbids), and **GEA1** (hospitality wins where it conflicts with efficiency). It is also exactly what HOMEOWNER2 #1 and the reviewer's own top-five recommend.
- **Scope:** one JSX block; presentation only; no data, field, route, schema, capability, token, or building-block change (TrialBanner is a *consumer*).

---

## 6 · Remaining roadmap

Ordered by the reviewer's priority, each item tagged by kind: **[Owner]** = recorded owner decision; **[Visual]** = owner visual-judgement increment (needs a live authenticated walk-through); **[Trust]** = an honest-number defect; **[Build]** = clean lawful build-out.

| # | Item | Rooms | Kind | Governing note |
|---|---|---|---|---|
| A | Open (or hold) the Environmental Dressing / per-room-environment amendment path (LIVINGHOME2 §10.2 ×4) | all | **[Owner]** | The lawful route to the photoreal "real place." Deferred 3× — now the top decision. |
| B | Commission / vary Cookbook food imagery | Cookbook | **[Owner]** | COOKBOOK1 §8; the single biggest missed-delight moment (Cookbook 1). |
| C | Desktop navigation posture (10-door bottom bar → calmer top/side with hierarchy) | Home + shell | **[Owner]** | `DesktopSidebar` exists but is mounted nowhere; UX1 owns canonical bottom nav — any change is an owner+UIA decision, not an ad-hoc rebuild. |
| R1 | Give the **Support Hub** a governed threshold voice (`ROOM_PURPOSE`) | Support Hub | **[Build]** | The one true identity gap; uses the existing EXP1 mechanism. |
| D | Reconcile on-screen counts | Shopping ("12 vs 3"), Nutrition ("17 vs 18") | **[Trust]** | §Trust Check — reconcile or clearly distinguish the measures; never blind-edit a number. |
| E | Own the empty desktop half (centre/compose arrivals) | Home, Shopping, Analyser, Orchard | **[Visual]** | GEA11 — surplus space must become *air and view*, not absence. |
| F | Rescue the Home "glance" (reduce hero/greeting height) | Home | **[Visual]** | Home 5 / Home 3 (script size step). |
| G | Warm the blank rooms (honest-absence for "– / Not set / No preference / None") | Diary, Household | **[Visual]** | Diary 1, Household 3 — HOSP1 warmed copy; the unset-values pattern remains. |
| H | De-clinicalise the Diary daily log (demote weight/mood/energy) | Diary | **[Visual]** | Diary 3/4 — ROOM1 §4 deferred body redesign. |
| I | Give the Companion presence & focus (launcher warmth, deeper scrim, de-dup "Apple", suggestions as offers) | Companion, Home | **[Visual]** | Companion 1–4, Home 7. |
| J | Calm the Planner grid; verify the flame framing vs GEA13; collapse "N boost ideas"; consolidate the sub-toolbar; reduce the rail | Planner | **[Visual]**/**[Owner]** | Planner 1–5; the flame is a code-check-then-owner call. |
| K | Thin the Home "windowsill" band; guarantee title contrast over washed heroes; strengthen faint controls | Home, Cookbook, Shopping, Analyser | **[Visual]** | Home 2, Cookbook 4, Shopping 3/4, Analyser 2/3/4. |
| L | Hide the machine email; warm the default avatar | Household | **[Visual]** | Household 2/4. |
| M | Consolidate over-tabbed rooms | Larder (6+3), Nutrition, Household | **[Visual]** | Pantry 2/5, Nutrition 1, Household 1. |

**Why so much is [Visual] rather than shipped here:** every one is a change to a room *body* whose correctness is a matter of composition and proportion that must be judged **on the running product**, at the widths HOMEOWNER2 used (1440 / 1280 / 390). This pass is non-interactive — no authenticated visual verification was possible — and the repo's standing discipline (HOSP1, ROOM1, PRESENCE1/2, LARDER_NS1) is that such increments ship one at a time *with* a Home Owner walk-through, never blind. Shipping them here would violate that discipline and risk exactly the "looked right in the diff, wrong on screen" failures the register exists to prevent.

---

## 7 · Recorded owner decisions (open)

Recorded here because *an unrecorded approval is not an approval* (HOMEOWNER1), and because `PLATFORM_KNOWLEDGE_COMPLETION` KC12 requires a declined/deferred discovery to be recorded so no future audit re-asks it.

- **Owner Decision A — Environmental Dressing / per-room environments.** Open the LIVINGHOME2 §10.2 amendment path, or hold. Consequence of holding: the photoreal "real place" cannot ship; the atmosphere stays expressed through the owned window/ground/light/voice system (which HOMEOWNER2 already praised).
- **Owner Decision B — Cookbook food photography.** Commission real/varied imagery (COOKBOOK1 §8), or accept the illustration. The one item a jury would photograph as "unfinished."
- **Owner Decision C — Desktop navigation posture.** Whether to promote a calmer desktop nav (the retired `DesktopSidebar`) with real hierarchy, or keep the canonical single bottom nav (UX1). A UIA + Home Owner decision, never an ad-hoc rebuild.
- **Owner Decision D — the Planner flame.** Whether "🔥 62" is refused as grading the household's week (GEA13) or kept as plainly-labelled calories — pending a code check of what it actually reports.

---

## Architecture Compliance

- **One owner per fact (Principle 2) / retire-on-introduction (Principle 8):** No new owner of any fact. Room identity is expressed through the existing shell owners (`NAV_ITEMS`, `ROOM_EXPOSURE/GROUND/PURPOSE`, `RoomThreshold`, `orchard-backdrop.tsx`) and the Living Home stack. No duplicate navigation, business logic, or UI system introduced.
- **Render owners' published state, never re-own (UIOWN1 / GEA17):** the programme is a map over existing owners; the one code change edits a *consumer* (`TrialBanner`), owning nothing.
- **Experience Constitution Check (before design):** *hospitality* — the countdown change removes an anti-hospitality clock at the threshold (GEA1); *outcome* — reduces felt weight (GEA2); *weight* — the room is lighter, not heavier; *voice* — no room gains a coaching voice (rooms report, GEA8/21); *ownership/agency* — nothing decides on the household's behalf (GEA22/23); *restraint* — GEA3/GEA13/GEA15 upheld; *layer* — this change names GEA3 above it and the Commercial/Trust owner beside it (untouched).
- **Home Owner governance (HOMEOWNER1):** the larger visual/atmosphere moves are routed as recorded owner decisions and amendment proposals, never as exceptions granted here.
- **No governing document was amended.** `LIVINGHOME1`, `LIVINGHOME2`, and the four §10.2 owners remain byte-untouched; the standing refusals remain in force.

## AI Architecture Compliance

- Uses the canonical Intelligence Platform only by reference. **No** capability, prompt, Context View, notice channel, or persona was created or changed. **No second assistant.** Every per-room "Companion relationship" (§3) restates that the Companion enriches through **registered, permission-aware capabilities** and **owns no business facts** (TIP, COMP_AUTH1, PKR26–28).
- Dressing stays **beneath words** (ED12): it never enters a prompt, Context View, or capability, and the Companion never narrates it.
- Honest gaps over fabricated knowledge: the programme names absences (unset values, unbuilt dressing, the Support Hub voice) rather than papering over them.

## Data Impact

- **No schema, migration, table, column, or seed change.** No data written, migrated, or back-filled. No data meaning changed.
- The single code change (`TrialBanner`) reads the **same** `user.isDemo` / `user.demoExpiresAt` fields it already read; it writes nothing. The expiry behaviour (redirect at 0) is preserved.
- No personal or special-category data is read, moved, or exposed by this programme.

## Trust Check

- **The countdown change preserves honesty:** the banner still states the session is temporary and still expires; only the engineered per-second urgency is removed. No claim was added or hidden (Core Principle 6; consistent with BUS2A, which withdrew a *false* claim from this same file).
- **The count mismatches are treated as trust defects, not cosmetics** (Shopping "12 vs 3", Nutrition "17 vs 18") and are **not blind-edited** — a number changed without understanding its source is how trust is *spent*, not saved. Roadmap D: reconcile the figures or make the different measures legible, on the running product.
- **The machine email under the household name** (Household 2) is logged as a trust/warmth defect (Roadmap L).
- No trust surface, consent ledger, or authorisation path was touched.

## Rollback Plan

- **Rollback identifier:** `rollback/LIVING-HOME-COMPLETION-20260722` → `56628c7a` (annotated tag on `int1-intelligence-platform`, created before any change).
- **To revert everything:** `git revert` the programme commit, or reset to the tag. The only runtime change is one JSX block in `TrialBanner.tsx`; reverting it restores the previous banner exactly. All other artefacts are documentation.
- **Blast radius:** one demo-only banner (renders solely when `user.isDemo`), plus new/updated Markdown. No data, no schema, no shared building block, no other room.

## Scope Lock

- **Shipped:** exactly one presentation change — the Home trial banner's calm-state countdown (§5) — plus this programme document and the session recovery artefacts.
- **Explicitly NOT done (and why):** no Environmental Dressing (declared-not-built, §10.2 amendments not made); no navigation rebuild (Owner Decision C); no Cookbook photography (Owner Decision B); no count "fixes" (Trust Check — needs the running product); no room-body redesigns (owner visual-judgement increments); no schema/data/capability/token/component change; no governing document amended; the internal `pantry` identifiers stay as-is (LARDER1 §15).
- **Functionality is unchanged** except where explicitly governed (the countdown, under GEA3), and even there the *function* (session expiry + redirect) is preserved — only its presentation changed.

## Manual Verification

- `npm run typecheck` → **88 errors, all pre-existing server-test files, 0 in `client/`, 0 in `TrialBanner`** — byte-identical to the recorded baseline (prior session: "88 server pre-existing"). Confirmed by unique-file diff.
- `npm run build` → **exit 0** (`dist/index.cjs` emitted; the 4 esbuild `import.meta` warnings are pre-existing).
- `npm run adoption:check` → **100 passed · 0 notice · 9 failed** — identical to the recorded baseline; no building block was added, adopted, or retired (a consumer was edited), so the register is unchanged.
- `grep` confirmed **no test references** the removed calm-state countdown testid, so no suite is broken by the change.
- **No live screenshot / authenticated walk-through was taken** — this pass is non-interactive. Per the repo's standing discipline (HOSP1, ROOM1, PRESENCE1/2, LARDER_NS1), the visual increments in §6 are staged for a Home Owner walk-through and are deliberately not shipped blind.

## User Acceptance Evidence

- **Pre-state evidence:** `docs/investigations/HOMEOWNER2_LIVING_HOME_REVIEW.md` — the Home Owner's own Apple-Design-Award-bar critique (7/10) with annotated captures of all eleven rooms. It *is* the acceptance baseline: its top-five "if this were my product" list opens with *"Kill the ticking countdown on Home — a home says welcome, never hurry."*
- **This pass discharges that #1 item** (§5) and converts the remaining critique into a governed, prioritised, owner-decision-tagged roadmap tied to each room's completion definition.
- **Outstanding acceptance step:** the Home Owner walks `/home` on desktop (1440) as a demo session and confirms the arrival no longer opens with a ticking clock while the honest "changes are temporary" line and the <2-minute heads-up remain; and reviews the §3 room definitions and §7 owner decisions. This is the acceptance gate for the programme, consistent with the outstanding walk-throughs already recorded for HOSP1/ROOM1/PRESENCE1/2/LARDER_NS1.

---

*Programme `LHC1`. Governance + one lawful presentation fix. The house's identity and atmosphere are governed and largely built; the finish is staged, and the one unbuilt layer stays lawfully gated.*

---

## North Star

The Living Home is complete when opening The Healthy Apples no longer feels like opening an application.

- A household **enters a beautifully kept home**, not a set of screens — the arrival is a threshold, and someone has evidently been here caring for the place before them.
- **Every room feels distinct yet belongs to one house** — each with its own purpose, light and material, none with its own architecture; a household always knows which room it is in, and never doubts it is still home.
- **Intelligence quietly supports the household** — the Companion notices, offers and reassures, then gets out of the way; the household keeps every decision that is theirs.
- **Trust grows while technology becomes less visible** — the more the home earns a household's confidence, the quieter it becomes; capability is spent on removing weight, never on adding surface.
- **Success is measured by households feeling at home**, not by households being impressed by technology — the home that succeeds is the one a family stops noticing, because it has become the calm, dependable place they simply live in.

This is the standard every future room, feature and refinement is checked against — the Home Owner's two questions, asked of the whole house: *does this feel welcoming, and does it belong here?* (HOMEOWNER1, cited). Completion is a release milestone; the care that keeps the house worth returning to is continuous (HOMEOWNER1 Principle 11, cited).

> **"The highest compliment The Healthy Apples can receive is:**
> **'It simply feels like home.'"**
