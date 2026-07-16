# THA Experience Blueprint — Governing Document

**Status:** GOVERNING ARCHITECTURE — the unifying blueprint of Experience Governance; required reading before any user-facing design or implementation work
**Classification:** Experience Governance (canonical)
**Adopted:** 2026-07-15 (EXPBLUE1)
**Extended:** 2026-07-15 (EXPBLUE2) — the refined vision *"A modern home in an ancient orchard"* (§ 1.4), the Technology Principle (§ 1.5), the digital-home reading of the rooms (§ 4.1), the ancient orchard (§ 6.0), the mandatory Experience Test (§ 15.3), and the refined Design North Star headline (§ 17). Extension only — no rule restated, no new document, the three sibling documents untouched.
**Governed by:** [`THA_EXPERIENCE_ARCHITECTURE.md`](./THA_EXPERIENCE_ARCHITECTURE.md) (EXP1/EXP2) — **where this document and the Experience Architecture conflict, the Experience Architecture wins** (§ 2.3)
**Unifies (and never overrides):** [`THA_EXPERIENCE_ARCHITECTURE.md`](./THA_EXPERIENCE_ARCHITECTURE.md) (behaviour), [`THA_UI_ARCHITECTURE.md`](./THA_UI_ARCHITECTURE.md) (look), [`THA_EXPERIENCE_LANGUAGE.md`](./THA_EXPERIENCE_LANGUAGE.md) (feeling)
**Sources graduated into this blueprint:** the arrival and place discoveries — `ARRIVAL1`, `EXP2`–`EXP4` (prototype explorations), and [`EXP5_ONE_HOME_MANY_PLACES.md`](../investigations/ux/EXP5_ONE_HOME_MANY_PLACES.md) (investigation). Those documents remain point-in-time history; the concepts they discovered are owned, from adoption, here (§ 2.4)
**Governing documents:** [`ARCHITECTURE_PRINCIPLES.md`](./ARCHITECTURE_PRINCIPLES.md), [`ENGINEERING_WORKFLOW.md`](./ENGINEERING_WORKFLOW.md)
**Enforced by:** the Experience & UI Governance Compliance block in [`ENGINEERING_WORKFLOW.md`](./ENGINEERING_WORKFLOW.md) — through the three existing gates it already names, plus the Blueprint Checks (§ 15) for the concerns this document alone owns

> **What this document is.** The one place where the whole of THA's experience is legible at once. THA's user-facing layer is governed by three documents that divide one experience cleanly — the Experience Architecture (what it must *do*), the UI Architecture (how it must *look*), the Experience Language (how it must *feel*). Each is complete on its own question and silent on the others, which is correct — and it means no single document has ever held the *vision they all serve*. This blueprint holds it. It states the vision, draws the map that connects the three documents and the spatial concept that binds them, and owns the handful of concerns none of them owns: One Home Many Places, the orchard's exposure, the house's light and materials, the Living Details, and the Design North Star. **It restates no rule from any other governing document** — restating a rule creates a second owner of it, which the architecture forbids — it cites the owner and adds only what has no owner. A design that conflicts with this blueprint must **STOP, explain why, and not continue until approved**.

---

## 1. VISION

### 1.1 What THA is making

The Healthy Apples exists to reduce the invisible stress of everyday family food decisions — the daily, unspoken weight of *what's for dinner, is it good for them, what do we need, have we got it* — so that households eat better with less effort, and have more time to simply eat together (Experience Language § 4A, Principle A: the THA Promise).

Everything a person sees, reads, hears, or does in THA serves one experience:

> **THA is a warm, lived-in home where someone has already thought about dinner.**
>
> Not a dashboard reporting to you. Not an app competing for you. A *place* — one house, on one bright morning, with the orchard outside every window — that a household arrives in, moves through, and leaves calmer than it came.

That sentence is the whole product. The Experience Architecture makes it behave that way; the UI Architecture makes it look that way; the Experience Language makes it feel that way; this blueprint is where the sentence itself lives, and where the *house* it describes is drawn.

### 1.2 The experience in one paragraph

A person opens THA and **arrives** — a calm, warm place that expected them, asking nothing. They are **oriented** in a glance: how the household is doing, what's next, everything under control. They move through the product the way they would move through a home: the walls never change, every room has its own purpose and its own light, and every window looks onto the same orchard — bright, growing, in season, alive. The intelligence in the house behaves like a knowledgeable friend at the counter: present, prepared, never pushy. Work — planning, browsing, checking, examining — happens on honest, well-lit surfaces that hold everything the product could hold on the household's behalf. Nothing shouts, nothing performs, nothing is fabricated. And when the person leaves, what lingers is not a screen or an effect but a feeling: *that was calm, that was easy, they had already thought about us.*

### 1.3 What this blueprint unifies

Between 2026-07-10 and 2026-07-15 THA's experience governance was built in layers: the Experience Architecture (EXP1/EXP2), the UI Architecture (UIA2), the Experience Language (EXPLANG1, enhanced by EXPLANG1A's Place Principles and EXPLANG1B's Emotional Palette), and a sequence of arrival and place discoveries (ARRIVAL1, EXP2–EXP4 prototypes, EXP5's One Home Many Places investigation). Each layer is sound; together they were becoming a library rather than a blueprint — the vision reconstructible only by reading five documents in the right order. This document ends that: one timeless blueprint, every rule still owned exactly once, and the discoveries that had no governing home given one.

### 1.4 A modern home in an ancient orchard

The house and its world, said in one line — the refined statement of the vision above:

> **The Healthy Apples is a modern home in an ancient orchard.**

This is not a themed application, and the orchard is not decoration. **The orchard is the setting, not the ornament** (§ 6, § 16) — the world the house stands in, not a picture hung on its walls.

The two halves are an *intentional contrast*, and the contrast is the whole meaning:

- **The home is contemporary.** Clean architecture, generous natural light, natural materials, calm and uncluttered surfaces, quiet confidence. It is a modern home — not minimal-as-in-cold, but modern-as-in-*considered*: everything that is present is meant, and nothing else is there. *(This character is not new law — it is the reading of the light already governed in § 7, the materials and generous air in § 8, and the restraint the Experience Language owns as Principle H and Place Principle H. Those sections realise it; this line names what they are building.)*
- **The orchard is timeless.** Mature, long-established, in season, always present — experienced through windows and quiet connections rather than as scenery to walk into (§ 6.2, the Orchard Exposure Scale). It does not change with fashion because it never followed one.

That contrast *is* THA:

> **Modern intelligence, in the service of timeless household values.**

The home is the intelligence — clean, current, quietly capable. The orchard is what the intelligence is *for* — a family eating well together, which is as old as families. THA is new technology built to protect something that is not new at all. Every design decision inherits this: the *form* may be as modern as the work requires; the *feeling* it serves is timeless.

### 1.5 Technology should quietly disappear

The governing principle that follows from § 1.4, and the one this blueprint asks every future decision to obey:

> **Technology should quietly disappear. The household should always feel present.**

Technology is how the house is built and lit; it is never what the household is meant to notice. It **supports the experience — it never becomes the experience.** A screen that shows off its own cleverness — its data density, its animation, its configurability, its brand — has made the tool the subject and pushed the family into the background. In THA the family is always the subject.

This principle is the Vision's, owned here; it is the same truth the Experience Architecture enforces as *honest presence* and *attention is borrowed, never taken* (§ 3), that the Experience Language produces as *calm* and *effortless*, and that the Design North Star closes with — *noticed the product not at all* (§ 17). Stated at the top of the blueprint so it can be quoted in any review in five words: **the household present, the technology gone.**

## 2. HOW THIS BLUEPRINT GOVERNS

### 2.1 One experience, seen whole

| Question | Owner | This blueprint's role |
|---|---|---|
| What must the experience **do**? | [`THA_EXPERIENCE_ARCHITECTURE.md`](./THA_EXPERIENCE_ARCHITECTURE.md) — behaviour, journeys, the eight Experience Principles, the Premium standard | Cites it; never restates it |
| How must it **look**? | [`THA_UI_ARCHITECTURE.md`](./THA_UI_ARCHITECTURE.md) — Calm Orchard, hierarchy, colour, type, spacing, motion vocabulary, tokens | Cites it; never restates it |
| How must it **feel**? | [`THA_EXPERIENCE_LANGUAGE.md`](./THA_EXPERIENCE_LANGUAGE.md) — the seven feelings, the Emotional Palette, the Principles of Feeling, the Rhythm | Cites it; never restates it |
| What is the **vision**, and what is the **place** — the house, its rooms, its orchard, its light, its materials, its signs of life? | **This blueprint** | Owns it (§ 2.2) |

### 2.2 What this document owns — and what it never owns

This blueprint is the canonical owner of exactly these concerns, none of which any other governing document holds:

1. **The Vision** (§ 1) — including *"a modern home in an ancient orchard"* (§ 1.4), the **Technology Principle** (§ 1.5), and the **Design North Star** (§ 17).
2. **One Home, Many Places** — the spatial concept (§ 4, § 5): the house, the rooms, and the four things a room may differ by.
3. **The Orchard Exposure Scale** (§ 6) — the governed E0–E3 window sizes and the rules that ride on them.
4. **The house's light and material direction** (§ 7, § 8) — one sun, the three grounds, the ground plane, air as a material.
5. **The Living Details** (§ 12) — their laws and their library.
6. **The Blueprint Checks** (§ 15.2), the **Experience Test** (§ 15.3), and the **spatial anti-patterns** (§ 16).

And it deliberately owns nothing else:

- **No behaviour.** What may interrupt, what a surface's primary action is, how journeys run — Experience Architecture, untouched.
- **No visual values.** No colour, token, duration, easing, component, or pixel appears in this document. Where §§ 6–8 give the house direction, the *binding visual law and every value* remain the UI Architecture's, entering it only by governed amendment and token admission (§ 2.4).
- **No feelings beyond citation.** The emotional register is the Experience Language's; this blueprint quotes its conclusions and adds none.
- **Nothing runtime.** No code reads this document; it creates and retires no component, route, or dependency. Its enforcement surface is human judgement at the governance gate (§ 15).

### 2.3 Precedence, stated once

**Experience Architecture (behaviour) > this blueprint (vision and place) > nothing.** The blueprint is subordinate to the Experience Architecture exactly as the Experience Language and UI Architecture are: a vision is realised by behaviour, never decreed over it. Beside it, the UI Architecture owns the look and the Experience Language owns the feeling; this blueprint overrides neither and is overridden by neither — where it and a sibling appear to conflict, they are describing the same thing from two angles and both are corrected until they agree; where a genuine conflict of *rule* remains, the question's owner (§ 2.1) wins. Any conflict that cannot be resolved sideways resolves upward to the Experience Architecture.

### 2.4 The graduated discoveries, and the governance path for their values

The place concepts in §§ 4–8 and § 12 were discovered in prototypes and investigation (ARRIVAL1, EXP2–EXP5), not invented here. Adopting them into this blueprint makes the **concept** governing: every future surface is designed toward One Home Many Places, and a design that contradicts it stops.

Adoption here changes **no visual law**. Three things remain exactly as the discoveries themselves declared them (EXP4 § 6, EXP5 § 9.2):

- The depth and light **vocabulary** (ground plane, warm shadows, penumbra) sits beyond the UI Architecture's current flat-surface law (UIA § 4) and may not ship on any surface until the **governed UIA amendment** admits it. Until that amendment lands, UIA § 4 as written remains the binding law of every shipped surface.
- The exposure scale and per-domain light values enter as **semantic tokens by admission** (UIA § 16), never as per-surface choices.
- Each Living Detail is admitted **one at a time** against the Experience Review Questions — never as a batch of charm.

The source documents (`EXP2`–`EXP5`, `ARRIVAL1`) remain what they always were: point-in-time analysis and history, never to be read as law. The law, at concept level, is now this document.

## 3. THE EXPERIENCE PRINCIPLES — THE CONSTITUTION IN ONE VIEW

THA's experience constitution is four families of principles, each with one owner. This section is a map, not a copy: the principles are binding **at their owners**, and a reader applying any of them reads the owner, not this table.

| Family | What it governs | Owner |
|---|---|---|
| **The eight Experience Principles** — Home as the emotional centre · progressive disclosure · calm before capability · one primary action · the product orients, the person chooses · one canonical place for everything · honest presence · attention is borrowed, never taken | What the experience must **do** | Experience Architecture § 3 |
| **The twelve Premium Experience Principles** — craftsmanship over quantity, intentionality, friction removal, earned delight, refinement over redesign, and their peers | The **standard of craft** the eight must be done to | Experience Architecture § 17 |
| **The seven feelings and the Emotional Palette** — calm · welcoming · effortless · intelligent · reassuring · premium · quietly memorable, produced warm and alive, never cold, clinical, or lifeless | What the experience must **feel** like, and at what temperature | Experience Language § 3, § 3A |
| **The thirteen Principles of Feeling and the eight Place Principles** — arrival before information, movement as meaning, the sacred shell, earned delight, walking not scrolling, light has meaning, premium through restraint, and their peers | **How** the feelings are produced | Experience Language § 4, § 4A |

One law from the constitution is repeated here by citation because the whole blueprint method rests on it: **every rule has exactly one owner** (Experience Principle 6, applied by every governing document to itself). That is why this blueprint cites where an owner exists and legislates only where none does.

## 4. ONE HOME

THA is **one home**. Not a suite of features, not a set of pages — one house a household lives in, whose character never changes from room to room.

- **The shell is the walls** (§ 14). One frame, one navigation, one way home, identical everywhere. The walls are what make many rooms one house. *(Behaviour: Experience Architecture § 8. Feeling: Experience Language Principles 9 and E.)*
- **Home is the threshold and the heart.** Every session begins there and can always return there; it answers *"how are we doing, and what's next?"* before anything else is asked of anyone. *(Owned by Experience Architecture § 4.)*
- **Home is a place, not a dashboard.** The household *arrives*; the workspace is merely where they land. The dashboard — and every workspace added after it — is a room reached from within the home, never the home itself. *(Feeling owned by Experience Language Principle G; this blueprint adds the spatial consequence: as the house grows, new rooms are added — the home is never renamed.)*
- **Arrival precedes work, everywhere.** The welcome beat carries no task; the first action waits until the person has arrived. This is true of the session's one true arrival at Home and, in miniature, of every room's opening posture. *(Owned by Experience Language Principles 1 and C.)*
- **The household moves through the house; it is never handed documents.** Moving between realms preserves the sense of one continuous place — walking from room to room, never loading unrelated files. Scrolling is walking further into the same room. *(Owned by Experience Language Principles B and D.)*

What this blueprint adds — the sentence the pieces were always implying, stated once as law:

> **THA has one home, and the household never leaves it while inside the product. Every realm, dialog, admin surface, and document is a room, a doorway, or a note inside the same house, on the same morning.**

### 4.1 THA is the household's digital home

Said plainly, so no one mistakes the metaphor for decoration: **THA is the household's digital home.** Not a home *page*, not a home *screen* — the household's *home*, where the ordinary work of feeding a family is kept. The room analogy is not a skin over a set of features; it is what the product *is*, and each domain is genuinely a different room the household walks between within one house.

The purpose of each room, in the household's own words — the *verb* of the room, complementing the place identity and full art direction owned by the map in § 5.1 (which this does not restate):

- **The Planner is the family's planning table** — where the week is laid out and decided together.
- **The Cookbook is the family's living cookbook** — the used, well-thumbed book of what this family cooks, not a catalogue of what anyone could.
- **The Pantry is the household pantry** — what is in the house right now, honestly told.
- **Shopping is preparing to leave the house** — the list gathered by the door before the trip out.
- And every other domain — Home, Nutrition, Diary, Analyser, Household, Admin — is likewise **a different room within one home**, never a separate application wearing the same colours (§ 5, § 16 *the costume*).

This is the human sentence beneath the spatial law of § 5: *one home, many rooms, one family moving between them.* The rooms differ only in the four governed ways (§ 5); what makes them all rooms of the same home is everything in § 5.2.

## 5. MANY PLACES

One home does not mean one room. The Planner is not the Diary and must not feel like it — each realm has a different emotional job, and a house whose rooms are indistinguishable is not a home but a corridor. THA resolves the tension the way a real home does: the walls, the daylight, and the family are constant; the rooms differ in exactly **four** ways, and no others.

> **A room is differentiated by purpose, light, material, and one sign of life — never by its own architecture, navigation, palette, or theme.**

1. **Purpose** — what the household comes there to do, and therefore what the room holds ready. *(Each room's emotional job and six-beat rhythm are owned by Experience Language § 5.)*
2. **Light** — how much of the one morning the room lets in, and what the light falls on (§ 7). Same sun; different windows.
3. **Material** — the posture of its working surface: a counter, a table, a shelf, a note, a bench, a record (§ 8).
4. **One sign of life** — the room is used, and the household's own life shows in it: at most one Living Detail (§ 12).

### 5.1 The map of the house

The canonical place identity of every domain. The analogies are **feelings to design toward, never pictures to draw** (§ 16): the "family table" is produced by material, light, and composition — never by rendering a table.

| Domain | Place in the house | Orchard exposure (§ 6) | Light character (§ 7) | Ground posture (§ 8) | Living Detail (§ 12) |
|---|---|---|---|---|---|
| **Home** | The threshold and the heart | **E3** — the open view | Full morning; the brightest room | Compact counter — the view keeps its share | The greeting in THA's hand |
| **Planner** | The family table | **E1** | Even working light; the sun on today | One solid table holding the week | The sun on today |
| **Cookbook** | The recipe book by the window | **E2** | Warm side-light across the page | Shelf; recipe cards as objects you pick up | The well-thumbed page |
| **Shopping** | The list by the door | **E1** (E2 when clear) | Plain bright; passed through, not lingered in | One note sized to its list | The crossing-off |
| **Pantry** | The pantry, orchard beyond | **E2** — the smallest window | Practical, morning-warm | Shelf strata | Freshness, honestly told |
| **Nutrition** | The noticeboard by the garden view | **E2** | Garden-bright, optimistic | Noticeboard tier over a solid data tier | The garden filling in |
| **Diary** | The window seat | **E2**, softly — quiet, never dim | A gathered pool of the same morning | Lap desk; the most air in the house | Yesterday's trace |
| **Analyser** | The work bench | **E1** (E2 before first use) | The clearest task light in the house | The bench; the examined product as the object on it | Where you left off |
| **Household / Profile** | The family record | **E1** | Even, honest, unshadowed | The record; anchored strata | The family, first-class |
| **Companion** | The friend at the counter — a presence, not a room (§ 13) | — (foreground) | The room it opens in | Floating, as today | Arrives a beat after you |
| **Admin** | The study off the hall | **E0** | Task light; the warmth floor still applies | Solid working ground | None — deliberately |

### 5.2 What keeps the rooms one house

For every room, without exception, these are constant and may never vary per domain: the shell (§ 14) · the canonical component owners · the semantic token system and both palettes · the type scale and its three voices (§ 10) · the motion vocabulary (§ 9) · the state law (loading / empty / error) · the one Companion (§ 13) · the accessibility floors · the two-second rule. **A room that needs to break any of these to feel like itself has not been designed yet.** *(Each constant is owned where it is defined — UI Architecture §§ 4–16, Experience Architecture §§ 8–16; this rule adds only their per-domain invariance.)*

## 6. THE ORCHARD

The orchard is THA's world: the constant outside every window of the house. It is the product's identity made environment — and its meaning is fixed:

> **The orchard represents life. Not silence. Not stillness. Not decoration.** Bright, growing, healthy, optimistic, welcoming — an orchard in morning light, in season, tended. Never gloomy, misty, or melancholy. *(Owned by Experience Language § 3A.3; quoted here because the whole of this section serves it.)*

### 6.0 The ancient orchard — timeless, mature, always present

The orchard is **ancient** (§ 1.4): mature, long-established, tended for generations — the timeless half of *"a modern home in an ancient orchard."* Where the home is contemporary, the orchard is old, and that contrast is the point: the intelligence is new, the thing it serves — a family eating well — is not.

"Ancient" is a matter of *maturity and permanence*, never of age rendered as decay or a turning year — and it does not loosen a single law below:

- The orchard is **always present** — the constant outside every window, in every session, unchanged (§ 6.1). Its timelessness *is* its constancy: it was there before this visit and will be there after, which is exactly why the household never has to tend it.
- It is timelessly **in season and in leaf** — mature, healthy, alive — held in the one bright morning (§ 6.1, § 7). Its age shows as a settled, established fullness, never as autumn, dusk, bare branches, weathering, or a cycling calendar; those would break the one-morning law of § 7 and the one-season law of § 6.1.
- It is **experienced through windows and subtle connections, never walked into** (§ 6.2). An ancient orchard is a place you have always lived beside and quietly trust — not a landscape to explore (§ 16 *the rendered world*). Its permanence is felt precisely because it asks nothing and does nothing.

So "ancient" adds a *temperature and a meaning* to the orchard already governed below — timeless, trusted, always-there — and adds no new environment, variant, season, or motion. Everything in § 6.1–§ 6.2 stands exactly as written.

### 6.1 The laws of the one orchard

- **One orchard.** One canonical environment, one owner, one season: perpetual bright morning, in leaf, tended. Realms never get their own orchard variant, angle, or season — what differs between rooms is *how much* orchard, never *which* orchard.
- **The orchard is never wallpaper.** No room *contains* the orchard; every room is *oriented toward* it. A backdrop applied uniformly behind everything is the flattening the Place Principles forbid — everywhere at once is nowhere in particular.
- **The orchard never carries text.** Any surface where type must sit legibly gets ground plane under that type, without negotiation. Legibility is never traded for atmosphere.
- **The orchard never animates.** No drifting mist, no swaying trees, no ambient motion. Place survives total stillness; life is carried by warmth and light, never by movement.
- **The orchard is a governed visual concern.** Its environment asset requires one named canonical owner in the adoption register, like every visual concern (UIA § 17). *(Open at adoption — § 18.)*

### 6.2 The Orchard Exposure Scale

Each room's "window size" is a governed constant on a four-level scale, obeying one inverse law:

> **Orchard exposure is inversely proportional to functional density. The more a surface asks the eye to work, the further the orchard recedes — first into a glimpse, then into light alone.**

| Level | Name | What it is | Where it belongs |
|---|---|---|---|
| **E3** | **The open view** | The orchard visible as itself, generously; sparse content on its ground; the view *is* part of the room's purpose | **Home only** |
| **E2** | **The window** | A framed, partial presence in one committed region the content deliberately does not cover; the working area on solid ground. Framed by composition, never by a drawn frame | Browsing and reflective rooms: Cookbook, Pantry, Nutrition, Diary |
| **E1** | **Light only** | The orchard as illumination and warmth, not image: warm canvas, the orchard's light direction and hue, the ground plane covering most of the environment. The room is bright because the orchard is outside; you don't see it while working | Working rooms: Planner, Shopping, Analyser, Household, and every dense or form-heavy surface |
| **E0** | **Lit from the hall** | No orchard image; the same warm canvas, tokens, and light temperature. Still unmistakably in the house | Admin, dialogs and overlays, printed or exported documents |

Rules that ride on the scale:

1. **Exposure is a per-domain constant** (§ 5.1), set once by design and expressed as governed values in the one token source (UIA § 16) — never a per-surface or per-component choice, never adjusted for taste mid-feature.
2. **Empty states may open the window one level, never two.** An honestly empty working room may breathe at E2 — the view beyond a clear list is exactly the right calm — and returns to its level the moment content exists. A full-strength landscape behind an empty room reads as *nobody home*, not as calm.
3. **Emotional surfaces may spend more window; functional surfaces may not.** The arrival may stand at E3 for its beat and settle into the destination room's level. A form never earns a view upgrade because it looked plain.

## 7. LIGHT

Light is the fastest carrier of THA's emotional temperature, and the house has exactly one:

- **One sun, one direction, one hour.** The morning sun sits upper-left, forever, in every room; every shadow on every surface in every domain agrees. It is always the same bright morning — no room is ever at dusk, in shade-as-mood, or under artificial light. **Every room in this house is a morning room.**
- **Rooms differ by exposure, never by hour.** A room's light character is how much of the morning its window admits and what the light falls on — the wide-open aspect of Home, the even working light of the Planner's table, the side-light across the Cookbook's page, the gathered pool on the Diary's window seat, the clear task light of the Analyser's bench (§ 5.1).
- **Light carries five meanings and no others: welcome · warmth · calm · clarity · optimism.** It never performs, never alarms outside genuine safety, and is never spectacle. *(Owned by Experience Language Principles 6 and F; the meanings are quoted, not re-legislated.)*
- **Light is hierarchy's quietest instrument.** Within a room, the primary stands in the light, support waits in the penumbra, quiet content sits in the shade — depth meaning distance, never drama — measured against the accessibility floors before any adoption.
- **Rooms have lighting, not light shows.** Light never moves, sweeps, or glows. The house's one sanctioned light *moment* remains the arrival's, and it reads as morning sun on a surface: once, softly, carrying warmth rather than attention.

*(The feeling of light is the Experience Language's; every actual value — hue, gradient, shadow colour, contrast — is the UI Architecture's, entering through the § 2.4 governance path.)*

## 8. MATERIALS

The house is built from a small material vocabulary, spoken identically in every room. Rooms compose from it; no room coins its own.

### 8.1 The three grounds

| Ground | What lives there | Constant or varying |
|---|---|---|
| **Background — the world** | The orchard and the daylight it casts. Soft, atmospheric, behind everything, never carrying text | **Constant** product-wide (one home) |
| **Middle ground — the room** | The workspace: the ground plane and the surfaces on it, in the light hierarchy of § 7 | **The only layer that varies by domain** (many places) |
| **Foreground — what floats** | Overlays, dialogs, the Companion. Elevation reserved for what genuinely floats | **Constant** product-wide |

**The middle ground is the whole trick of many places.** A domain expresses its character *entirely* within its ground plane and the light that falls on it, and touches nothing above or below. This is what makes rooms possible without forking the product.

### 8.2 The material laws

- **The ground plane is the room's identity.** One warm plane — a counter, a table, a shelf, a note, a bench, a record — sized and postured per domain (§ 5.1), from one material system: one radius law, one shadow definition, different proportions and density per room. **One ground per workspace, never nested.**
- **Solidity follows importance.** The primary surface is solid and lit; supporting surfaces are lower and quieter; quiet content lies directly on the ground like a note on a counter. **Support is anchored, never naked ink on the environment** — dense data never sits on landscape.
- **Air is a material.** Generous breathing space is the resting state of every room — what makes it inhabitable rather than furnished to the walls. *(The feeling is Experience Language Principle 8's; the spacing scale is the UI Architecture's.)*
- **The hand answers physically, identically everywhere.** Hover lifts into the light; press seats; focus is the canonical ring. One interaction feel, product-wide — rooms never invent their own physics.

*(Direction owned here; the binding visual law remains UIA § 4 until the governed amendment of § 2.4 admits this vocabulary, and every value enters as tokens by admission. No surface ships this section ahead of that path.)*

## 9. MOTION

The blueprint adds no motion rule — motion is already fully owned — and records only how the owned rules compose into the house:

- **What motion may do** — confirm a state change, preserve spatial continuity, carry one of the few genuine brand moments — and its vocabulary of durations and easings, are the **UI Architecture's** (§ 11 there).
- **What motion must feel like** — the product explaining a change, never performing; felt but not seen; yielding instantly to the person's intent; walking, never paging — is the **Experience Language's** (Principles 4, 12, D; § 4A).
- **In the house**, motion is how moving between rooms stays walking rather than loading, and how the one mannered exception — the Companion arriving a beat after you (§ 13) — means what it means. Nothing else in the house moves for its own sake: the orchard is still (§ 6.1), light does not sweep (§ 7), and Living Details do not animate (§ 12).

> **The one test, quotable in any review** (Experience Language Principle H): *if the person notices the animation before they notice the content, the animation has failed.*

## 10. TYPOGRAPHY

Typography is fully owned by the **UI Architecture** (§ 8 there): three voices and no more — the primary UI typeface that carries the working product, the display typeface for identity moments, and the signature typeface, THA's own hand, admitted only for emotionally significant branded moments and forbidden in all functional UI.

The blueprint adds only the house reading of that law: **the signature voice is how the house says hello, never how it works.** In the map of § 5.1 it appears in exactly one place — the greeting in THA's hand, at Home, at arrival — and each further surface is a separate governed admission, named in the adoption register. Scarcity is the signature's entire value; the day it becomes an ordinary font, the identity it carries is gone.

## 11. RHYTHM

Every THA experience — a session, a surface, a journey — moves through the same six-beat rhythm, owned by the **Experience Language** (§ 5 there):

> **Arrival → Orientation → Confidence → Action → Understanding → Completion**

The rhythm is fractal (the session runs it once; every room runs it again in miniature), each room's beats are given per-realm in Experience Language §§ 5.1–5.9, and it doubles as the house's diagnostic: when a surface feels wrong and no checklist catches why, walk the six beats and find the missing one.

The blueprint adds the spatial reading: the rhythm is the *choreography of moving through the house*. Arrival is the threshold (§ 4); Orientation is knowing which room you are in (§ 5); Confidence is the room being honestly what it appears to be (§ 6–8); Action is the work the room holds ready; Understanding is the room answering; Completion is rest — and rest, in this house, always has somewhere to be: the calm centre is one step away (§ 14).

## 12. LIVING DETAILS

"Lived-in" is the hardest word in the palette and the easiest to fake. A Living Detail is the household's **own life showing through the surface** — never a prop. This section is their constitution and their complete governed library.

### 12.1 The laws of a Living Detail

1. **One per domain, maximum.** Not one kind — one. A second detail in a room retires the first in the same decision.
2. **Data-borne or dead.** Every detail renders something TRUE from a canonical owner — the clock, the plan, cook counts, list state, freshness data, plant counts, diary history, analysis history, household membership. A painted prop (drawn fruit, fake steam, decorative crumbs) is fabricated feeling, forbidden by construction.
3. **Honest in absence.** When the data is silent, the detail is absent, and the room is still complete. A detail that must invent content to exist is filler.
4. **Below the emphasis budget.** A detail never competes with the primary, never carries status meaning, never animates for attention. Removable without functional loss — its loss felt only as a slight cooling. That felt cooling is the test that it was working.
5. **Still.** No Living Detail moves. Life is warmth and evidence of use, not animation. (The one governed exception is the Companion's arrival beat — motion meaning manners, § 13.)
6. **Admitted one at a time**, as a named reviewable decision against the Experience Review Questions — never as a batch of charm.

### 12.2 The library

| Detail | Domain | Data source | What it says | Ceiling |
|---|---|---|---|---|
| **The greeting in THA's hand** | Home | Clock + household name | *You were expected* | Signature voice stays arrival-only (§ 10); at most once per day |
| **The sun on today** | Planner | The calendar | *The week has a "now"* | A half-step of warmth; never a colour, never a border |
| **The well-thumbed page** | Cookbook | Cook/plan counts | *This book is used* | A half-step surface warmth; never a badge, rank, or label |
| **The crossing-off** | Shopping | List item state | *The trip is working* | Struck and settled into shade; no celebration per item |
| **Freshness, honestly told** | Pantry | Item freshness data | *The food in here is alive* | Canonical status vocabulary; helpful words, never guilt |
| **The garden filling in** | Nutrition | Plant-diversity counts | *Variety is growing* | Copy + the existing count; no leaf imagery, no streaks |
| **Yesterday's trace** | Diary | The person's own last entry | *This corner remembers you* | One line, only when true, never analysed back unasked |
| **Where you left off** | Analyser | Analysis history | *A used bench* | One low card; disappears when stale |
| **The family, first-class** | Household | Household membership | *This is a record of people* | Canonical avatar/name treatment; no album theming |
| **Arrives a beat after you** | Companion | Withheld-channel timing | *Manners* | The proven beat; no other presence signal, ever |

Details considered and **declined** — magnetic fridge letters, moving orchard reflections, steam, crumbs, worn edges, seasonal dressing — are recorded with their reasons in `EXP5_ONE_HOME_MANY_PLACES.md` § 5.3, so no future audit rediscovers and re-asks them.

## 13. COMPANION PRESENCE

The Companion is not a room. It is **the person in the house** — the knowledgeable friend at the kitchen counter: always in the same place, comfortable in every room, never following the household around the house talking.

- **Its conduct** — invited not intrusive, honest about its limits, suggesting never deciding, discovering and referring to canonical places — is owned by **Experience Architecture § 11** and the Intelligence experience principles that sit within it.
- **Its feeling** — present, never pushy; quiet competence on the household's side — is owned by **Experience Language Principle 7 and § 5.7**.
- **Its knowledge and voice** — what it may read, compose, and say — are owned by the Intelligence Governance documents (INT17 context composition; PKR2 § 12 for product knowledge).

The blueprint adds only its **place in the house**:

- **One presence, one fixed chair.** One Companion mark, in the same position in every room — the fixed chair at the counter. It is *in* the rooms, never a room; its panel is foreground (§ 8.1) and carries the house's warmth, not a view of its own. It speaks *about* the orchard's world; it does not display it, and it is never differently lit than the room it opens in — a differently-lit companion becomes a stage.
- **It arrives a beat after you.** In every room, the Companion joins *after* the person has arrived — manners rendered as motion meaning (§ 12.2). That beat is its entire sign of life: no pulsing, no typing theatrics, no simulated mood, no face (UIA § 10).

## 14. THE CANONICAL SHELL

The shell is the walls of the house: one frame, one header, one primary navigation, one way home — identical in every room, byte-stable beneath even the most expressive surface.

- **Behaviour** — one canonical navigation, few stable destinations, Home in the anchor position, honest location, no dead ends — is owned by **Experience Architecture § 8**.
- **Presentation** — the one page anatomy, the shell's visual freezing — is owned by **UI Architecture § 6**.
- **Feeling** — the ground that never moves; the frame that reassures precisely because the experience inside it changes — is owned by **Experience Language Principles 9 and E**, including their hardest clause: *emotional experimentation earns no exception to the shell's constancy.* The arrival prototypes proved the point by holding the shell byte-identical while everything inside it changed.

The blueprint adds only the house reading: **the walls are what make many places one home.** Every room in § 5 is possible *because* the shell is untouchable — the moment a room modifies the frame to feel more like itself, the house has lost a wall, and every other room pays for it. There is exactly one shell; a surface that appears to need a second one is either an undocumented drift or an unrecorded exemption, and both are defects to resolve in the adoption register (§ 18).

## 15. EXPERIENCE REVIEW CHECKLIST

### 15.1 The three gates, which this blueprint does not replace

Every user-facing implementation already passes, in full, via the Experience & UI Governance Compliance block of `ENGINEERING_WORKFLOW.md`:

1. the **UX Governance Checklist** — `THA_EXPERIENCE_ARCHITECTURE.md` § 18, including its Premium Standard block;
2. the **UI Governance Checklist** — `THA_UI_ARCHITECTURE.md` § 18;
3. the **Experience Review Questions** — `THA_EXPERIENCE_LANGUAGE.md` § 6.

This blueprint restates none of their checks. It adds only the checks for the concerns it alone owns.

### 15.2 The Blueprint Checks

For every implementation that touches a room's place character, the orchard, the house's light or materials, or a Living Detail — **if any check fails: STOP, explain why, do not continue until approved.**

```
□ One home
  Does the person remain in the same house — same walls, same morning, same
  orchard — throughout this change? Does moving here still feel like walking,
  never like opening an unrelated document? (§ 4)

□ A room, not a theme
  Does this surface differ from its neighbours ONLY by purpose, light,
  material, and at most one Living Detail — never by its own architecture,
  navigation, palette, costume, or literal furniture? (§ 5, § 16)

□ The map respected
  Does the surface honour its domain's place identity — its exposure level,
  light character, and ground posture from the map (§ 5.1)? If this is a NEW
  domain, has its row been added to the map by governance rather than
  improvised?

□ Orchard law
  One orchard, in season, alive — never a variant, never wallpaper, never
  under working text, never animated? Exposure at the domain's governed
  level, opened at most one level for an honest empty state? (§ 6)

□ One morning
  Same sun, same direction, same hour as every other room? No dusk, no fog,
  no mood-shade — and light meaning only welcome, warmth, calm, clarity, or
  optimism? (§ 7)

□ Material honesty
  One ground plane, never nested; support anchored, never naked ink on the
  environment; dense data never on landscape; air kept generous? (§ 8)

□ Living Detail discipline
  At most one per domain; data-borne; honest in absence; below the emphasis
  budget; still; admitted as its own named decision? (§ 12)

□ The Companion in its chair
  One presence, same position, foreground, the room's own light, arriving a
  beat after the person — and nothing else signalling "alive"? (§ 13)

□ The walls untouched
  Is the shell byte-identical beneath this change — no exception claimed for
  emotional or experimental work? (§ 14)

□ The governance path
  If this change ships any of the depth/light vocabulary or an exposure
  value: has the UIA amendment/token admission of § 2.4 actually landed, or
  is this jumping the path?
```

### 15.3 The Experience Test — mandatory for every screen

Before the detailed gates above, every screen of future UX work must first pass one short test. It is deliberately blunt: three questions any screen must be able to answer in one sentence each. A screen that cannot answer all three is not finished being *designed*, whatever state its code is in — **if any question has no clear answer: STOP, resolve it, do not continue.**

```
□ 1. Which room of the home is this?
     Name it against the map (§ 5.1). If the screen belongs to no room —
     or seems to belong to several — its place has not been decided, and a
     placeless surface cannot be one home (§ 4).

□ 2. How should someone feel here?
     Name the feeling in the room's own terms (Experience Language § 3, § 5).
     If the honest answer is "nothing in particular", the room has no
     emotional job and will read as a corridor (§ 5).

□ 3. What is the ONE thing this room helps them do?
     One primary purpose, stated as a verb (§ 4.1). If there are two, the
     room is doing two rooms' work; if there are none, it is decoration.
     (Behaviour owner: Experience Architecture Principle 4 — one primary
     action.)
```

The Experience Test does not replace the Blueprint Checks (§ 15.2) or the three gates (§ 15.1) — it precedes them. The Checks verify a designed room was built correctly; the Test verifies the room was *designed at all*. It restates no rule: each question routes to an owner (the map, the Experience Language, the Experience Architecture) and only forces the answer to be made explicit. It is wired into the Experience & UI Governance Compliance gate beside the Blueprint Checks.

## 16. ANTI-PATTERNS

The general experience anti-patterns — decorative animation, attention seeking, fabricated feeling, lifeless calm, cold luxury, and their peers — are owned by **Experience Language § 7** and are not repeated here. This blueprint names only the **spatial** anti-patterns of the house it draws, so they can be pointed at in review and rejected without re-litigation:

- **The theme park.** Literal rooms: illustrated kitchens, drawn furniture, wood-grain, page-turns, fridge magnets, jar clip-art, photo-corner frames. The "family table" is a feeling produced by material, light, and composition — the moment it becomes a picture of a table, the place has become a costume.
- **The costume.** A realm growing its own palette, component styling, decorative border, or motif to "feel like itself." A room is a *use* of the canonical owners, never a fork of them.
- **Wallpaper.** The orchard applied uniformly behind everything, at one strength, on one plane. Everywhere at once is nowhere in particular — the world flattened into a backdrop is the death of the place, however beautiful the image.
- **All view, no room.** A working surface that is mostly environment — a search box floating on a landscape, a list above two-thirds of raw scenery. It reads as *nobody home*, and it is the empty-state failure and the wallpaper failure at once.
- **The rendered world.** Environment inviting exploration *of itself* — parallax depths, ambient life, anything game-like. The person is at home, not in a scene.
- **Metaphor taxing function.** Any place-character that costs a click, a legibility point, or a frame of scroll performance. On dense working surfaces place recedes to almost nothing — and that recession is itself the design. If the concept ever fights the Planner, the concept loses.
- **The second sun.** A room at dusk, in fog, in spa-light, or under drama — any lighting that breaks the one morning. Quieter never means darker; every room in this house is a morning room.
- **Charm by the batch.** Living Details added in sets, or a second detail because the first was liked. One room, one sign of life, one decision at a time.

> **The spatial anti-pattern test, in one line:** if the household notices the room instead of their work, the room has failed — and if every room feels the same, there are no rooms at all.

## 17. THE DESIGN NORTH STAR

Every decision this blueprint governs — and every tie the checklists cannot break — is settled by one star. The guiding statement, said as the house itself:

> **The Healthy Apples is a modern home in an ancient orchard, where technology quietly supports timeless family life.**

That sentence is the North Star in its shortest form — the vision (§ 1.4) and the Technology Principle (§ 1.5) fused into the one line to steer by. Its test of any visit, unchanged:

> **A household should end every visit having thought about food a little less, trusted it a little more, and noticed the product not at all.**
>
> Build the house so that what lingers is the feeling of the place — calm, warm, alive, already thinking about dinner — and never a screen, an effect, or a feature. When two designs both pass every gate, choose the one the household would *feel* and could not *name*. When restraint and expression tie, choose restraint. When the product and the household tie, there is no tie.

The star is not a rule and adds none; it is the direction all the rules point. A surface that satisfies every owner document but drifts from the star is not in conflict with governance — it is simply not finished, and the Experience Language's standard applies: not done until the feeling is produced.

## 18. GOVERNANCE AND ADMISSION

- **This document is governing architecture.** Every user-facing implementation is made under it, through the gates of § 15. It is indexed in the Architecture Bootstrap (`docs/architecture/README.md`) as required reading beside the three documents it unifies.
- **Change enters by governance, never by shipping.** A new room in the map (§ 5.1), a change to a domain's exposure level, a new or retired Living Detail, or a new spatial anti-pattern is admitted the way any governing rule is — named, checked for conflict against this document and its governors, and added deliberately. A surface that quietly assumes one is a defect regardless of its quality.
- **One rule, one owner, forever.** If any statement in this blueprint is found to duplicate a rule owned elsewhere, the statement here is the defect and is corrected to a citation. If a concern owned here later earns a fuller governing home (for example, the depth/light vocabulary graduating into the UI Architecture by amendment), this document yields ownership in the same change and cites the new owner — one owner per rule survives every migration.
- **Open items at adoption, named so they are not lost:**
  1. **The orchard's owner** — the environment asset has no named canonical owner in the adoption register yet (§ 6.1); it needs one before exposure levels become governed tokens.
  2. **Home's header** — the live Home and the realm surfaces currently present two shell treatments; one must be canonical or the exception recorded in the register (§ 14).
  3. **The UIA § 4 amendment** — the ground-plane/light vocabulary of §§ 7–8 remains unshippable until the governed amendment specified by EXP4 § 6 / EXP5 § 9.2 lands.
  4. **Dark mode** — the entire light vocabulary is designed in daylight; any offering of dark mode must resolve every exposure and light token completely (UIA § 7's complete-mode law) and is unexplored design work.

---

*Required reading before any user-facing design or implementation work — the unifying blueprint beside the three documents it cites.*
*Subordinate to the Experience Architecture, which prevails in any conflict; sibling to the UI Architecture and the Experience Language, each of which owns its own question and is never overridden here.*
*Rollback: this document is new and uncommitted — to revert entirely, delete the file. Rollback tag for the EXPBLUE1 workstream: `rollback/EXPBLUE1-tha-experience-blueprint-20260715` → `b3c650cd`. Rollback tag for the EXPBLUE2 extension (this document's § 1.4, § 1.5, § 4.1, § 6.0, § 15.3, § 17 headline): `rollback/EXPBLUE2-modern-home-ancient-orchard-20260715` → `b3c650cd`; the pre-EXPBLUE2 state of this untracked file is backed up in the session scratchpad.*
