# WS2 — Pantry Explore V2 · The Home of Food

**Status:** Designed (investigation)
**Date:** 2026-06-22
**Branch:** `safety/preserve-since-last-prod-20260617-1613`
**Scope:** A READ-ONLY presentation layer that turns Pantry from a cupboard / food
search page into *the home of food* — the single warm place a household explores
foods, discovers ingredients, learns benefits, sees alternatives, revisits
memories and celebrates seasons.

> Pantry owns **UI**. Pantry does **not** own Discovery, Alternatives, Stories or
> Seasonal Stories. Those are engines Pantry *consumes*.

---

## 0. Rollback protection (mandatory first step — completed)

| Item | Value |
| --- | --- |
| **Rollback tag** | `ws2-pantry-v2-rollback` |
| **Rollback commit** | `f531216` |
| Branch | `safety/preserve-since-last-prod-20260617-1613` |
| Working tree at tag | clean |

**To revert WS2 entirely:**

```bash
git checkout ws2-pantry-v2-rollback     # or: git reset --hard ws2-pantry-v2-rollback
```

### What was confirmed protected, and how

The rollback tag was created **only after** the working tree was made clean. Two
things were uncommitted at task start and would have been lost by a hard reset, so
they were committed first (commit `f531216`):

- the **WS11 Seasonal Stories Engine** (`shared/seasonal/*`, `data/seasonal/*`,
  `server/tests/test-seasonal-stories-engine.ts`, the WS11 investigation doc), and
- a harmless `generatedAt` timestamp regeneration in the WS10 stories report.

Protection audit at the rollback point:

| Workstream | Protected at | Evidence |
| --- | --- | --- |
| WS0.12 (Catalogue Normalisation / Promotion) | `b47afcb` | committed; `ws0.12-rollback-point` tag |
| WS7 (Food Relationship Graph) | `a7eaef5` | committed; `rollback-ws7-start-20260620` tag |
| WS8 (Discovery Engine) | `0a996f8` | committed; `shared/discovery/` (6 files) |
| WS9 (Alternatives Engine) | `52cd86d` | committed; `shared/alternatives/` (5 files) |
| WS10 (Household Stories Engine) | `0dd662a` | committed; `shared/stories/` (5 files) |
| WS11 (Seasonal Stories Engine) | `f531216` | committed this session; `shared/seasonal/` (4 files) |

**No implementation of WS2 begins until this section is true. It is.** Because WS2
writes no data and changes no engine, a code-level revert is a complete rollback.

---

## 1. The one-sentence thesis

When someone opens Pantry V2, the answer to the FINAL QUESTION should be:

> **"I'm curious what's happening in my food world."**

…and *also*, when they actually need it, `"I'm looking for an ingredient"` must be
one tap away and instant. The home is for curiosity; search is for intent. The
design serves the first without taxing the second. (See §15 and §17.)

---

## 2. Architecture

### 2.1 Where WS2 sits

```
Catalogue → Canonical Foods → Knowledge → Relationships(WS7)
                                              ↓
        Discovery(WS8)  Alternatives(WS9)  Stories(WS10)  Seasonal(WS11)
                                              ↓
                                    ┌─────────────────┐
                                    │   WS2 PANTRY V2  │  ← presentation only
                                    │   (read-only)    │
                                    └─────────────────┘
```

Pantry V2 is the **single home** for exploring all of them. It is **READ ONLY**.
Pantry **never** creates stories, computes alternatives, calculates discovery, or
owns relationships. It asks the engines and displays the results beautifully.

### 2.2 The three layers WS2 adds (and the one it reuses)

| Layer | Responsibility | New? |
| --- | --- | --- |
| **Engines** `shared/{discovery,alternatives,stories,seasonal}` | Pure functions: `discover()`, `alternatives()`, `stories()`, `seasonalStories()`. Trust-guarded, no scores exposed, empty-is-silent. | Exist (WS8–11) |
| **Read API** `server/routes` | Thin HTTP wrappers that assemble household context from existing tables and call the engines. **No business logic, no writes.** | New (WS2) |
| **Display service** | Strips internal signals (`source`, `familiar`, provenance) before they reach the client, exactly as WS1 strips `evidenceStrength`/`confidence`. | New (WS2) |
| **UI** `client/src/.../pantry` | Renders home, search, food page. Consumes the read API only. | New (WS2) |

### 2.3 Building on what already exists (do not reinvent)

Pantry **already** has the right skeleton:

- `client/src/pages/pantry-page.tsx` toggles two **URL-driven modes** —
  `inventory` (unchanged) and `explore` (`?mode=explore`). WS2 lives entirely
  inside **Explore**. Inventory is never touched.
- WS1 already shipped `PantryKnowledgeHub` consuming `/api/knowledge/*`
  (foods, nutrients, benefits, food-detail, search). **This is the Food Page's
  spine** — WS2 wraps the four engines *around* it, it does not rebuild it.

So WS2 = **Explore mode, upgraded**: a Home surface in front of the existing
Knowledge Hub, the Knowledge Hub promoted into a full Food Page, and four engine
surfaces threaded through both. Inventory mode is out of scope and untouched.

### 2.4 The engine contract WS2 relies on (and must honour)

Every engine already guarantees the properties that make a *warm, non-clinical*
UI possible. WS2's job is to not break them:

| Guarantee (engine-side) | What WS2 must do |
| --- | --- |
| **No scores / ratings / ordering numbers** exposed — order is array position only | Never render rank numbers, %, "top", or sort controls |
| **Trust guard** strips ranking/judgement/shame language from every `reason`/`headline` | Render reasons verbatim; never compose our own verdict copy |
| **Empty-is-silent**: empty sections are *omitted*, never "nothing yet" | Show nothing, not an empty state, when an engine returns no sections |
| **`familiar` / `source` are internal signals** | Strip in display layer; never render "you already love X" as a verdict |
| **Read-only, pure, no DB access inside engines** | Route layer assembles context from existing tables; engines stay pure |

---

## 3. Read API surface (new, thin, read-only)

Five endpoints, one per engine plus the existing knowledge spine. All `GET`, all
read-only, all returning display-stripped payloads.

| Endpoint | Wraps | Notes |
| --- | --- | --- |
| `GET /api/knowledge/*` | WS0/WS1 (exists) | foods, nutrients, benefits, food-detail, search — the Food Page spine |
| `GET /api/pantry/discover?food=<slug>` | `discover()` (WS8) | `food` optional → household-only discovery for Home |
| `GET /api/pantry/alternatives?food=<slug>&diet=<diet>` | `alternatives()` (WS9) | `diet` optional; household eaters assembled server-side |
| `GET /api/pantry/stories` | `stories()` (WS10) | household history assembled from planner/diary tables |
| `GET /api/pantry/seasonal` | `seasonalStories()` (WS11) | season defaults to "now"; composes WS10+WS8 internally |

The route layer assembles `HouseholdContext` / `HouseholdHistory` from the
**existing** `planner_entries` / `food_diary_entries` / pantry tables. It writes
nothing and stores no summaries (WS11 is explicit: nothing is persisted).

---

## 4. Pantry Home — what appears, and in what order

The brief asks: of `Search / Recent / Discover / Seasonal / Household / Explore`,
what order feels natural, warm and useful? **Recommendation — ONE order:**

```
1. Search            ← always first, always reachable, never demanding
2. Recent            ← your own footprints; warm, zero-cognition re-entry
3. This Season       ← WS11; the single "what's happening" hero moment
4. Discover          ← WS8; gentle curiosity, household-only
5. Your Household    ← WS10; one quiet, celebratory memory
6. Explore Topics    ← evergreen doorways for when nothing else fits
```

### Why this order

- **Search first** because intent must never be taxed. It sits at the top but is
  *quiet* — a calm field, not a wall. A person who came to look something up is
  done in two seconds and never had to scroll past "content".
- **Recent second** because the warmest possible second beat is *your own
  footprints*. It is recognition without judgement, and it makes the page feel
  like *yours* the instant it loads. It also covers the cold-start gap: a brand-new
  household has no Recent, so the page naturally leads with Season/Explore instead.
- **This Season third, as the hero.** Seasonal is the one surface that is *new
  every time you visit* and asks nothing of you. It is the "what's happening in my
  food world" answer made literal. One hero block — not a wall of seasons.
- **Discover fourth.** Curiosity *after* recognition: first "here's your world",
  then "here's a gentle step beyond it". Placed below Season so discovery feels
  offered, never pushed (TRUST: no pressure to discover).
- **Your Household fifth** — a single celebratory memory ("Tomatoes became a
  family favourite"). One card, low on the page, so it lands as a warm surprise,
  not a report.
- **Explore Topics last** as the evergreen floor: always-present doorways
  (Mediterranean, Gut health, Better sleep…) so the page is never empty and there
  is always somewhere kind to go next.

### Cold-start / sparse-history behaviour

Recent, Discover, Household and Season all degrade to **silence** (empty-is-silent
contract), so a new household sees: **Search → This Season (evergreen seasonal
foods, no history needed) → Explore Topics.** Still warm, still useful, never an
apology, never "you have no stories yet".

---

## 5. Search

### What it supports

- **Food names** and **aliases**, resolved to one canonical food:
  `Courgette ↔ Zucchini`, `Eggplant ↔ Aubergine`, `Garbanzo beans ↔ Chickpeas`.
  Alias resolution already lives in the canonical-foods / knowledge layer; search
  consumes `/api/knowledge/search` which matches across names and aliases.
- Nutrients and health benefits (already supported by WS1 search) remain available
  but foods lead the results.

### What a result row shows (recommendation)

| Element | Always? | Why |
| --- | --- | --- |
| Image | yes | recognition is faster by sight than by reading |
| Name | yes | the answer |
| Category | yes | disambiguates ("Pepper" → Vegetable vs spice) |
| One sentence | yes | the food's short description — warm, not clinical |
| Favourite chip | when true | a quiet, earned grace note (from WS10 favourite signal) |
| Seasonal chip | when in season | "in season now" — invitation, never urgency |

**What does NOT belong in a result row:** nutrient scores, health grades, ranking
numbers, calorie counts, "recommended for you" verdicts. A result is an
*identification*, not a judgement. Chips are the only adornment, and both are
positive-only (there is no "out of season" or "not a favourite" chip).

---

## 6. Food Page

Opening **Tomato** shows, in this **recommended ONE order**:

```
1. Hero            Image · Name · Short description
2. Benefits        Supports: heart health, immunity, eye health      (WS0/WS1)
3. Key nutrients   Vitamin C · Lycopene · Potassium                  (WS0/WS1)
4. Varieties       Cherry · Plum · Heirloom                          (WS0/WS1)
5. Discover        "You might enjoy": pepper, aubergine, courgette   (WS8)
6. Alternatives    Passata · tinned tomatoes · roasted peppers       (WS9)
7. Stories         "Tomatoes became a household favourite."          (WS10)
8. Seasonal        "Summer became: tomatoes, basil, courgettes."     (WS11)
```

### Why this order

The page moves from **identity → knowledge → exploration → memory**:

1. **Hero / Benefits / Nutrients / Varieties** answer *"what is this and why is it
   good?"* — the knowledge spine WS1 already renders. Knowledge before suggestion:
   you understand the food before you're invited elsewhere.
2. **Discover then Alternatives** answer *"where could I go from here?"* —
   Discover is expansive ("you might enjoy"), Alternatives is practical ("if you
   need a swap"). Discover first because curiosity is the warmer default;
   Alternatives is a tool you reach for only when you have a constraint (§8).
3. **Stories then Seasonal** answer *"what has this food meant to us?"* — the most
   personal, most celebratory note, saved for last so the page *ends* on warmth.

Every section below the spine is **empty-is-silent**: a food with no household
history simply ends after Varieties. No gaps, no "no stories yet".

---

## 7. Explore Topics — architecture

Can Pantry support: Gut health · Better sleep · Mediterranean · Healthy fats ·
Plant protein · Family favourites · Seasonal foods?

**Recommendation — a three-tier model, not a single mechanism:**

| Topic kind | Source | Examples | How |
| --- | --- | --- | --- |
| **Knowledge-derived** | WS0 benefit/nutrient tables | Gut health, Better sleep, Healthy fats, Plant protein, Mediterranean | A topic = a saved query over existing knowledge data (benefit slug, nutrient group, or cuisine tag). **Derived, not hand-listed.** |
| **Engine-derived** | WS8 / WS10 | Seasonal foods, Family favourites | Thin views over `discover(type:"seasonal")` and the WS10 favourite signal. **No new data.** |
| **Editorial framing** | a tiny config | the *title, blurb, icon, ordering* of the tiles | A small editorial manifest decides *which* topics are doorways and how they read — but the **contents** are always derived live. |

So: **the topic list is editorial; the topic contents are derived.** This is the
right split because it keeps curation human (we choose the warm doorways) while
keeping the foods behind each door truthful and self-updating (no stale
hand-maintained lists, no risk of "Mediterranean" drifting out of sync with the
catalogue). Nothing is hard-coded as a food list. (See §16: new topics need no
redesign — just a manifest entry pointing at an existing query.)

---

## 8. Discover surface (reuse WS8)

- **How many:** **3 per section** on the Food Page (the engine's `limitPerType`
  default is already 3). On Home, **one** discovery section, ≤3 items.
- **Carousel vs grid:** **grid** (a 3-up row that wraps on mobile). Carousels hide
  content and imply "there's more you're missing" — mild pressure. A small,
  fully-visible grid says "here are a few nice ideas" and then stops.
- **When discovery becomes overwhelming:** the moment it (a) exceeds ~3 visible at
  once, (b) shows more than ~2 sections stacked, or (c) implies obligation
  ("you should try"). WS8's friend-voice reasons and the "show few" cap are
  designed precisely to stay below that line. WS2 must not add "see all 40"
  expanders that re-introduce the firehose.

Render `suggestion.reason` verbatim. Never render `familiar`/`source`.

---

## 9. Alternatives surface (reuse WS9)

How should alternatives be presented — hidden, collapsed, or always visible?
**Recommendation: collapsed-by-default, intent-triggered.**

- On the Food Page, Alternatives renders as a **single calm prompt**:
  *"Need a swap?"* with diet pills — *Vegetarian · Dairy-free · Keto · Lower UPF*.
  Tapping a need **expands** the relevant `alternatives()` sections inline.
- **Why collapsed, not always-visible:** alternatives are a *constraint-driven*
  tool. Showing "here's what to use instead of tomato" unprompted subtly implies
  something is wrong with tomato. Collapsing it makes it a *helpful answer to a
  need the user expressed*, never an unsolicited substitution. This directly
  serves the trust rule "never imply failure / shame foods".
- **Why not fully hidden:** discoverability matters — the "Need a swap?" prompt is
  always visible; only the *answers* are behind the tap.
- Render each option's `reason` and honesty `note` verbatim (the `note` prevents
  the "swap and be disappointed" trap, e.g. cauliflower rice). Household
  adaptation (`adaptation`) renders only when eaters were supplied.

---

## 10. Household Stories surface (reuse WS10)

- **How many:** **one** card on Home (a single memory is a gift; a feed is a
  report). On the Food Page, **up to ~3** cards for that food.
- **Can stories change naturally without feeling random?** Yes — by anchoring
  *selection* to stable signals, not shuffling:
  - **Recency-weighted, deterministic:** WS10 already orders by its internal
    recency/strength logic. WS2 picks the **first** card for Home and keeps it
    stable across a session, so a story doesn't flicker on every render.
  - **It changes when the household's food life changes** (a new favourite
    emerges, a habit forms) — i.e. for a *reason* the household would recognise,
    not from RNG. That is the difference between "changes naturally" and "random".
- Render `headline` + `facts` verbatim. Stories are observations, never verdicts.

---

## 11. Seasonal Stories surface (reuse WS11)

- **How it appears on Home:** the **hero** block (§4) — one warm panel:
  *"This season"* → `This summer became: tomatoes, basil, courgettes`
  (`seasonal_habits` / `favourite_moments` blocks), with a single quiet
  *"Looking ahead"* line (`looking_ahead`, from WS8) beneath.
- **How large:** **medium-hero, not full-bleed.** One panel, 2–4 lines of memory
  plus one forward line. Big enough to be the emotional centre of the page; small
  enough that it never becomes a "yearly review" scorecard. WS11 is explicit that a
  seasonal story is a **memory, not a report card** — the UI size must reflect that.
- A full **Season view** (all five blocks: summary, discoveries, favourite
  moments, the shape of the season, looking ahead) is reachable by tapping the
  hero — but it is opt-in, never the landing surface.
- Sparse season → empty blocks omitted → hero falls back to evergreen seasonal
  foods (no history needed). Never "no season yet".

---

## 12. Mobile / tablet / desktop

**Recommendation — the Food Page is a SINGLE SCROLL of cards** (not collapsible
accordions), with the four engine surfaces as cards within that scroll.

### Why single scroll over collapsibles

- A single warm scroll *invites browsing* — the Spotify-artist-page feel. Accordions
  say "this is dense; collapse what you don't need", which is the clinical tone we
  are explicitly avoiding.
- Empty-is-silent means the scroll is never bloated: a food with little history is a
  *short* page, so there's nothing to collapse anyway.
- **One exception:** Alternatives (§9) is intentionally collapsed because that is a
  *trust* decision (intent-triggered), not a length decision.

### Responsive behaviour

| Surface | Mobile | Tablet | Desktop |
| --- | --- | --- | --- |
| Home | single column, sections stacked in the §4 order | 2-col Discover/Explore grids | wider grids, Season hero spans content width; max-width container |
| Search results | full-width rows, image-left | 2-col cards | 3-col cards |
| Food Page | single scroll, 1-up cards; Discover/Alt as 1-col wrap | 2-up grids | 3-up grids; spine + suggestions share a comfortable reading column |

Inventory mode's existing responsive behaviour is untouched.

---

## 13. Trust rules (enforced, not aspirational)

Pantry V2 must **never**: rank households · compare users · shame foods · imply
failure · pressure discovery · show deficits.

How each is *structurally* prevented:

| Rule | Enforcement |
| --- | --- |
| No ranking households / comparing users | There is no cross-household data path in any endpoint. Engines take a single household's own history only. |
| No shaming foods / showing deficits | Engines expose **no scores, no grades, no "unhealthy"**; trust guards strip banned terms from every string. UI renders strings verbatim and adds no verdict copy. |
| No implying failure | Empty-is-silent: absence is silence, never "you haven't…". Chips are positive-only (favourite/in-season); there is no negative chip. |
| No pressure to discover | Discover sits *below* recognition (§4), is capped at 3 (§8), and has no "see all"/"keep going" affordance. |
| Warm / curious / celebratory / human | Friend-voice reasons and observational headlines come from the engines; UI tone (calm search, "your" framing, memory-as-gift sizing) matches. |

**WS2 adds no new copy that makes a claim about a food or a household.** All
evaluative language originates in the trust-guarded engines.

---

## 14. Worked examples

### 14.1 A returning household opens Pantry (Home)

```
🔎  Search foods…

Recent
  🍅 Tomatoes      🥛 Greek yoghurt     🫘 Chickpeas

This season ☀️
  This summer became: Tomatoes · Basil · Courgettes
  Looking ahead: peaches, heirloom tomatoes, fennel        → tap for the full season

Discover — you might enjoy
  🫘 Butter beans     🌿 Artichokes     🥬 Fennel

Your household
  Tomatoes became a family favourite. Friday became pizza night.

Explore
  Mediterranean · Healthy fats · Plant protein · Better sleep · Gut health
```

Nothing clinical, competitive or judgemental. Search is right there; everything
else is an invitation.

### 14.2 A brand-new household opens Pantry (cold start)

```
🔎  Search foods…

This season ☀️
  In season now: Tomatoes · Courgettes · Strawberries · Peas

Explore
  Mediterranean · Healthy fats · Plant protein · Better sleep · Gut health
```

Recent / Discover / Household / season-memory are silent (no history) — the page
is still warm and useful, and never apologises.

### 14.3 Opening the Tomato food page

```
🍅  Tomato
    A sweet, juicy summer fruit used as a vegetable across the world's kitchens.

Benefits      Supports heart health · immunity · eye health
Key nutrients Vitamin C · Lycopene · Potassium
Varieties     Cherry · Plum · Heirloom

Discover — you might enjoy
  Pepper · Aubergine · Courgette

Need a swap?   [Vegetarian] [Dairy-free] [Keto] [Lower UPF]      ← collapsed
  (tap Lower UPF) → Passata · Tinned tomatoes · Roasted peppers
                    "Roasted peppers bring the same sweet depth to a sauce."

Stories
  Tomatoes became a household favourite — 27 times across pasta sauce, salad, pizza.

Seasonal
  Summer became: Tomatoes · Basil · Courgettes.
```

### 14.4 Search with an alias

```
🔎  zucchini
  🥒 Courgette   Vegetable   A tender summer squash, lovely griddled or in ribbons.
                 [in season]
```

`zucchini` resolves to the canonical **Courgette**; the seasonal chip is earned,
positive-only.

---

## 15. Validation — "If Spotify made food…"

Honest assessment against the brief's test:

| Risk | Verdict | Why |
| --- | --- | --- |
| Too busy | **Avoided** | Home is ≤6 sections, most capped at 3 items; empty-is-silent keeps it short; one hero, not a wall. |
| Too clinical | **Avoided** | No scores/grades/percentages anywhere; friend-voice copy; positive-only chips. |
| Too shallow | **Avoided** | Four engines of genuine depth sit behind a calm surface — depth on tap, not on display. |
| Too overwhelming | **Avoided** | Search never taxed; suggestions capped; no "see all 40" firehose; discovery placed after recognition. |

**Would it feel like a place you enjoy visiting even when you aren't planning
meals?** **Yes** — because the home leads with *your* world (Recent, This Season,
Your household), which is new and warm on every visit, the way a Spotify home feels
alive without demanding a task. The single honest caveat: this only holds if the
empty-is-silent contract is respected end-to-end. The moment WS2 adds an empty
state that says "no stories yet", the page becomes a chore-list. **Design rule:
absence is always silence.**

---

## 16. Future — can WS2 surface these without redesign?

| Capability | Without redesign? | How |
| --- | --- | --- |
| ✓ Discovery | Yes | `/api/pantry/discover`; already a Home + Food Page section |
| ✓ Alternatives | Yes | `/api/pantry/alternatives`; collapsed surface already designed |
| ✓ Stories | Yes | `/api/pantry/stories`; Home card + Food Page section |
| ✓ Seasonal Stories | Yes | `/api/pantry/seasonal`; Home hero + opt-in Season view |
| ✓ Food Wrapped | **Yes — as a new *route*, not a redesign** | Wrapped is `seasonalStories()` over a year window, rendered in a dedicated view. The engine + read API already exist; WS2's Season view is the template. **(Not built here — SCOPE LOCK.)** |
| ✓ Household favourites | Yes | A topic tile (§7) over the WS10 favourite signal; or a Food Page chip |
| ✓ Explore topics | Yes | New topic = one manifest entry (§7) pointing at an existing query |

**Why no redesign is needed:** every future surface is *another consumer of an
existing engine through the same thin read-API + card-rendering pattern*. The home
is a stack of independent, self-silencing sections; adding one is appending a
section, not restructuring. The Food Page is a single scroll of cards; adding one
is appending a card. The topic model is editorial-list + derived-contents, so new
doorways are config, not code.

---

## 17. The final question

> When someone opens Pantry, should they think *"I'm looking for an ingredient"*
> or *"I'm curious what's happening in my food world"*?

**They should think the second — and be able to do the first instantly.** The home
is built for curiosity (Recent, This Season, Discover, Your household). Search is
present, calm, and one tap from done, so intent is served without making the page a
search box. Pantry stops being a cupboard you open when you need something and
becomes a place you visit because your food world is alive in it. **That is the
home of food.**

---

## 18. Risks

1. **Empty-is-silent must be honoured end-to-end.** Any "nothing yet" empty state
   re-introduces the chore/deficit feeling. *Mitigation:* a single shared
   `EngineSection` wrapper that renders nothing when sections are empty.
2. **Leaking internal signals.** `familiar`, `source`, provenance, `evidenceStrength`
   must be stripped server-side (as WS1 does). *Mitigation:* display layer + a test
   asserting these keys never appear in API payloads.
3. **Re-introducing ranking by accident.** A "sort by", "top picks", "best", or a %
   badge would violate trust. *Mitigation:* lint/test ban on rank language in WS2
   UI strings; reasons rendered verbatim only.
4. **Stories/Season flicker.** Re-deriving on every render could make memories jump.
   *Mitigation:* stable selection within a session (§10), cache the read queries.
5. **Household context assembly cost.** Building `HouseholdHistory` per request from
   planner/diary tables could be heavy. *Mitigation:* the same query the planner
   already runs; cache per household for the session; engines are pure and fast.
6. **Cold-start emptiness reading as "broken".** *Mitigation:* evergreen This Season
   + Explore Topics always render with no history (§4, §14.2).

---

## 19. Recommendations (summary — the "ONE" answers)

| Question | Recommendation |
| --- | --- |
| Home order | Search → Recent → This Season (hero) → Discover → Your household → Explore Topics (§4) |
| Search result row | Image · Name · Category · one sentence · positive-only Favourite/Seasonal chips (§5) |
| Food Page order | Hero → Benefits → Nutrients → Varieties → Discover → Alternatives → Stories → Seasonal (§6) |
| Topic architecture | Editorial list + derived contents, three tiers (§7) |
| Discover count / shape | 3 per section, grid not carousel, no "see all" (§8) |
| Alternatives presentation | Collapsed, intent-triggered by diet need (§9) |
| Stories count | One on Home, ≤3 on Food Page; deterministic, changes only with the household's food life (§10) |
| Seasonal size | Medium hero + opt-in full Season view; memory, not report card (§11) |
| Mobile/desktop | Single scroll of cards; responsive grids; Inventory untouched (§12) |
| Final question | "Curious what's happening in my food world" — with instant search (§17) |

---

## 20. Definition of done — checklist

- [x] Pantry architecture designed (§2–§3)
- [x] Home page designed (§4)
- [x] Food page designed (§6)
- [x] Search designed (§5)
- [x] Discovery integrated (design) (§8)
- [x] Alternatives integrated (design) (§9)
- [x] Stories integrated (design) (§10)
- [x] Seasonal Stories integrated (design) (§11)
- [x] Mobile considered (§12)
- [x] Trust rules enforced (§13)
- [x] Future expansion possible (§16)

**Out of scope (confirmed not designed/built):** Food Wrapped UI · Social ·
Dashboard redesign · new food engines.

---

## 21. Data impact

| Question | Answer |
| --- | --- |
| Reads existing data | **YES** (knowledge tables + planner/diary history, via engines) |
| Writes new data | **NO** |
| Changes meaning of existing data | **NO** |
| Requires backfill | **NO** |

---

## SUGGESTION (future ideas — not in scope)

- **Food Wrapped** — a yearly/seasonal "wrapped" view; `seasonalStories()` over a
  year window using the Season view as the template (FUTURE §16, not built here).
- **Saved foods / "follow"** — let a household pin foods to a personal shelf
  (would be the first *write* in Pantry V2; deliberately excluded here).
- **Topic editor UI** — turn the §7 editorial manifest into an admin surface.
- **Shared seasonal recap** — an exportable Season card (Social-adjacent; excluded).
- **"Cook with" jump-off** — from a Food Page Discover item straight into the
  planner (cross-feature; out of WS2's read-only presentation scope).

---

## Scope lock (honoured)

Implemented (designed): **Pantry Explore V2** only. **Not** built: Food Wrapped,
Social, Dashboard, or any new food engine. Pantry remains read-only: it consumes
WS8/WS9/WS10/WS11 and displays their results — it owns the UI, nothing else.
