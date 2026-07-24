# EXPREVIEW1 — First-Time Household Experience Review

**Type:** Experience review. Point-in-time criticism, not architecture, not implementation.
**Date:** 2026-07-20
**Stance:** Written as an experience critic walking through The Healthy Apples for the first time, as a household would — not as an engineer reading a repository.
**Assumption, per the brief:** the implementation is technically correct. Nothing below is a bug report.
**Judged against:** `GOVERNING_EXPERIENCE_ARCHITECTURE.md` (the Experience Constitution) and, through it, the house the Experience Governance canon describes.

---

## 0. How I looked, and what I could not see

I walked the house through the current evidence set — the after-captures at
`docs/ui-audit/intarch2-material-surfaces/`, eleven rooms at 1440 and 1920, plus the
invitation doorstep and the arrival sequence. Everything below is a description of
something I actually looked at.

Four honest limits, stated first so the review can be weighed properly:

1. **I never saw this house on a phone.** The last photograph of the mobile experience in
   the repository is six days old and predates all three of the recent experience
   workstreams. A household lives in this product at 390px, standing in a kitchen. I
   reviewed a house nobody has photographed at the size most people will live in it.
2. **I never saw it move.** Arrival, transitions, the Companion's entrance — all stills.
3. **I never saw it at night.** Dark mode is valued everywhere and pictured nowhere.
4. **I never saw a household that had lived here for six months.** Every room I visited is
   either empty or filled with generated demonstration content, which is exactly the
   condition a first-time household arrives in — so for *this* review that limit is
   mostly a feature.

---

# PART ONE — THE WALKTHROUGH

## 1. First impression: the doorstep

Before there is a house, there is an invitation. Somebody I know has told The Healthy
Apples that I might like it, and I have clicked a link.

What I find is **a bordered rectangle on an empty beige field.** Roughly a fifth of the
screen is used; the rest is nothing. There is no orchard. There is no apple. There is no
building. The typography is competent and cold. It reads like a well-mannered SaaS
transactional page — the confirmation screen of a service I have not yet decided to care
about.

The *words* are excellent, and worth saying so: *"A household already using The Healthy
Apples thought you might like it too."* and *"Nothing is joined until you say so."* That
second sentence is one of the finest things in the entire product — it is trustworthy,
unhurried, and it anticipates the exact anxiety a person feels at that moment. Somebody
who understood hospitality wrote it.

But it is written on a blank wall. **The one moment in the entire lifetime of this
relationship when a household knows nothing about The Healthy Apples — the moment the
whole thing is decided — is the moment the house is least present.** I am told, in
words, that I have been invited somewhere. I am shown nowhere. The Constitution says the
orchard is *a permanent fact of the site, not a feature of a room* (`GEA6`). The front
door does not know the orchard exists.

**How does this make me feel?** Politely handled. Not welcomed. I would not be able to
tell you, from this screen, that The Healthy Apples is about food.

**Does it feel like a home or software?** Software, unambiguously — and, worse, generic
software. This screen could belong to a project-management tool.

---

## 2. Arrival: crossing the threshold

Then something genuinely lovely happens, and then it half-breaks.

The arrival sequence gives me a still, warm field and my own name — *Welcome home,
Chloe* — before it gives me any interface at all. This is `GEA1` made visible:
hospitality taking a beat that a productivity tool would have deleted. It is the single
most confident decision in the product. Somebody was brave enough to spend a second of a
household's time on nothing but welcome, and they were right.

Two things spoil it, and both are craftsmanship rather than concept.

**The sentence changes clothes between one breath and the next.** In the arrival, *Welcome
home* is set in the handwritten face and *Chloe* is set in the plain one. Two seconds
later, on Home, *Welcome home,* is plain and **Chloe** is handwritten. The same six words,
inverted. It is a small thing and it is the kind of small thing a household feels without
being able to name: the house said hello twice, in two different voices, and did not
notice.

**And the welcome is cut off.** In the arrival capture the word *home* runs out of its own
container mid-letter — *"Welcome hom‸"*. The very first sentence The Healthy Apples speaks
to a household is clipped by its own layout.

**Does the room communicate its purpose?** Beautifully. This is *arrival*, and I know it
instantly.

**What breaks the illusion?** The house welcomed me twice in two typefaces, and truncated
itself doing it.

---

## 3. Home

And then I am home, and it is genuinely, unaffectedly beautiful.

An orchard fills the top third of the screen — apple blossom in the near foreground, a
mullioned window frame, hills receding into a low golden morning sun, a warm brass sill
running the full width beneath it. It is not a photograph *of* an orchard placed on a
page. It reads as **a view out of a window in a room I am standing in.** The light falls
from the upper left and everything beneath it agrees. At 1920 it is one of the most
convincing pieces of atmosphere I have seen in a piece of software.

Beneath it: *Welcome home,* / **Chloe** / *Monday, July 20*. Enormous air. No card, no
panel, no badge. A household is the subject; the product is the setting. This is exactly
what § 6.2 means by a room rather than a page, and Home is the one place in the house
where I could feel it without being told.

**Would I want to spend time here?** Yes. Genuinely yes. I would open this in the morning.

And then I read the words, and the room deflates.

*Today at a glance* — **"Your planner isn't linked to the calendar yet."**

Then three cards. The first says **Meals — Not linked to dates**, and beneath it:
*"Your planner's weeks aren't linked to calendar dates yet, so THA can't tell which one is
this week. Your plan is all still there."* The second says *"Nothing to fetch — the
cupboards are as you left them."* The third says *"Your week's variety will appear here
as meals are planned."*

So the emotional centre of the house, on my first morning, spends its entire content area
telling me **what it does not know, cannot tell, and does not have yet.** Two of the three
cards are absences. The headline beneath *Today at a glance* is an apology.

I want to be careful here, because the honesty is not the defect — the honesty is
correct and hard-won, and a house that invented a week rather than admit it did not know
one would be a far worse house. `GEA15` and the non-fabrication law are right, and the
copy is *kind* about it (*"Your plan is all still there"* is a genuinely thoughtful
sentence).

**The defect is that honest absence has been allowed to become the room's atmosphere.**
The Constitution's own distinction (§ 15.1) is exactly this: silence as *restraint* reads
as composure; silence as *absence* reads as neglect. Home currently reads as a beautifully
lit room in which someone has left three notes explaining what is missing. It is tended,
and it is apologising. A guest arriving to *"less on their mind"* (§ 3.5, outcome 1) has
instead been handed a small technical worry they did not previously have — **what is a
calendar link, and have I done something wrong?**

And one bruise on the finish: the Meals card carries two links, stacked — *Open the
planner ›* and, immediately beneath it, *View planner ›*. Two doors to the same room, six
pixels apart, on the most looked-at card in the product.

**How does this room make me feel?** For two seconds, delighted. Then mildly worried,
then faintly managed.

**Home or software?** The upper half is a home. The lower half is a status dashboard
written in a warm voice.

---

## 4. The hall: moving between rooms

There are nine doors along the bottom of the screen: Home, Planner, Cookbook, Shopping,
Pantry, Nutrition, Diary, Analyser, Orchard. They are always there, always in the same
order, and they never move. That constancy is worth a great deal and I noticed it in a
good way — I learned the house in one visit.

But **nine doors is not a house, it is a corridor.** A home has adjacency: you plan, you
check the cupboard, you write the list, you go. This house presents all nine rooms as
equally near and equally likely, permanently, in a flat rank. The Constitution names
*relationship* as the third defining property of a room (§ 6.1) and observes that a room
reachable only from the menu is *a page with a door drawn on it*. Every room here is
reachable only from the menu. **There are no interior doors in this house — only a
lobby.**

And moving between rooms is not walking. It is switching. Nothing carries over, nothing
recedes, nothing arrives. I do not feel that I have gone somewhere; I feel that the
contents of the frame have been replaced. The shell is constant, which is correct and
valuable — but constancy alone produces *a consistent application*, not *a place*.

One break in the shell, and it is loud: **the Shopping door and the basket icon are
blue.** Everything else in this house is green, cream, brass and terracotta. The blue is
from another product entirely, and it sits in the permanent furniture where a household
will see it every day of every visit.

---

## 5. The Planner

I open the Planner and the temperature drops about ten degrees.

There is no window here. The room begins immediately with a toolbar, and then it is **a
seven-column spreadsheet.** Breakfast, Lunch, Dinner, Snacks, Kids Breakfast down the
left; Monday to Sunday across the top; 35 cells; a `+` in every empty one. Down the right,
a control panel of **eleven buttons in three labelled groups** — PLAN (Smart, Scan,
Templates, Analyse), ADD & IMPORT (Idea, Search, Build, Scan, a text field, a dropdown,
Stage), MANAGE (Options, Multi, Share).

This is the family planning table. It has been built as a **project management grid with
a build toolbar bolted to its side.** It communicates its purpose instantly and it
communicates it as *work*.

Above the grid, a strip: a red-apple pill reading **"This Week"**, then **"39/30"** with a
leaf, then two sentences that do not fit and are cut off — *"Looking ahead to autumn, you
may…"* · *"At its best in the UK summer — a…"* — and an "Insights ˅" control on the right.

I want to be precise about why this strip is the worst thing in the room. It is not that
it is ugly. It is that **the house is speaking to me in a voice I have not met, saying
something I cannot finish reading.** Somebody is advising me about autumn, and I do not
know who, and I only get half the sentence. `GEA8` says rooms report and the Companion
advises; `GEA9` says advice is composed, never authored. This strip is neither reporting
nor conversing — it is a ticker of amputated opinions.

And in the top right: **"14/28 meals planned."** A denominator I did not set, on a target
I did not choose, counting a family's dinners. Nobody in this household said they wanted
28 meals. It is presented as a completion state, and completion states have a below.

**How does this room make me feel?** Behind. Which is the precise emotion this product
exists to remove.

**Would I want to spend time here?** No. I would do the minimum and leave.

---

## 6. The Cookbook

This is the room that broke the house for me, and I want to describe it carefully because
the failure is not a design failure at all.

The window is here, and at 1920 it is *lovely* — a long band of orchard rows in low
sunlight running the full width above the room. Beneath it, the ground plane. Beneath
that, the recipes.

And the recipes are these:

> Apple, Oat & Cinnamon Morning Bowl
> Australian cafe-Style Black Bean, Cabbage & Cucumber Rice Bowl
> Australian cafe-Style Black Bean, Celery & Beetroot Rice Bowl
> Australian cafe-Style Black Bean, Celery & Cucumber Rice Bowl
> Australian cafe-Style Butter Bean, Cabbage & Beetroot Rice Bowl
> Australian cafe-Style Butter Bean, Cabbage & Cucumber Rice Bowl
> Australian cafe-Style Butter Bean, Celery & Beetroot Rice Bowl
> Australian cafe-Style Cannellini Bean, Cabbage & Beetroot Rice Bowl
> Australian cafe-Style Cannellini Bean, Celery & Beetroot Rice Bowl
> Australian cafe-Style Cannellini Bean, Celery & Cucumber Rice Bowl
> Australian cafe-Style Chicken Thigh, Cabbage & Tomato Rice Bowl
> **Australian cafe-Style Chicken Thigh, Cabbage & Tomato Rice Bowl 2**

Twelve cards. One combinatorial engine. A visible loop over {black bean, butter bean,
cannellini bean, chicken thigh} × {cabbage, celery} × {beetroot, cucumber, tomato}. And
at the end of it, a recipe whose name ends in the digit **2**, because the machine
collided with itself and appended an integer.

Above it all, a section header: **WHOLEFOOD SUGGESTIONS · 500.**

**And there is not one photograph of food anywhere in this room.** Every card carries the
same grey wand glyph where a picture of dinner should be. In a product about food. In the
room whose entire job is to make a household want to cook something.

I understand precisely what the architecture intended here — *"the shelf; recipe cards as
objects you pick up"*. The material work has been done: the cards are opaque plaster now,
they cast an honest shadow, they sit on a floor. They *are* objects you could pick up.
**They are five hundred identical objects generated by a machine, and picking one up
tells you nothing, because the one beside it is the same object with the cabbage
swapped.**

This is where the illusion does not merely crack, it inverts. The Constitution's § 12.2 is
exactly right and exactly diagnostic: *life comes from the household, not from
decoration; the fix for a lifeless room is more of the household, not more of THA.* This
room has been filled to the brim with THA's own output and it is the deadest room in the
house. A cookbook is supposed to be the warmest object a family owns — stained, annotated,
opened to the page that always falls open. This is a search index with a view.

And the card itself: each one carries a `⌘4` badge in the corner, a three-dot menu that
overlaps its own title, a tab strip (Ingredients · Nutrition · Why Good) *inside* the
card, a two-column ingredient list truncated with "+5 more", and **six unlabelled icon
buttons** along the bottom. Six. On a recipe card. Multiply by twelve and the room
contains seventy-two unlabelled controls.

To the right, a Search/Create/Display panel that is visibly made of a different, older
material than the cards it sits beside — grey where they are plaster, flat where they have
weight.

**How does this room make me feel?** Suspicious. This is the room where a household works
out whether the intelligence is real, and the answer it gives is *"we generated five
hundred of these."*

**What breaks the illusion?** *Rice Bowl 2.*

---

## 7. The Pantry

Two large white panels. In the left one, headed **Food**, an "Add to larder…" field and a
column of checkboxes: *rice, chickpeas, black beans, tuna tins, tinned tomatoes, lentils,
garlic*. In the right one, headed **Home**, another column: *Toilet roll, Kitchen roll,
Tissues, Washing up liquid, Dishwasher tablets, Laundry detergent, Fabric conditioner.*

Every row has a checkbox, a ghost "+ Need" pill and a chevron. Above them, "Select all".

This is a **stock-control interface.** It is competent, it is legible, and it has
absolutely nothing to do with a pantry. § 5.1 gives this room *"shelf strata"* — the
particular pleasure of a cupboard is that you can *see* what is in it, in strata, at a
glance: the jars at the front, the tins ranked behind. What is here is a two-column
inventory audit with select-all.

The lowercase is telling: *rice*, *chickpeas*, *garlic*. Not styled, not capitalised, not
cared for — raw strings a household typed once, displayed exactly as typed. That is
honest, and it is also the visual signature of a database table.

And the window above it is a **ghost.** This is the first room where I noticed what the
orchard actually looks like away from Home: pale, desaturated, low-contrast, and washed
almost to white at the top — more like a faded photograph left in the sun than a view. At
Home the orchard is *alive*. In the rooms it is a memory of itself.

**Warm, calm, beautiful, alive?** Calm, yes. Warm, barely. Beautiful, no. Alive, not at
all.

---

## 8. Shopping

And then, unexpectedly, one of the best rooms in the house.

A single wide sheet of paper. Three lines on it, in a soft italic hand:

> *milk, eggs*
> *oven chips*
> *bananas, yoghurt*

A hairline rule near the bottom, and beneath it three quiet grey glyphs — a microphone, a
camera, an image. That is all. No cards, no counters, no panels, no score.

**This is the note on the kitchen counter, and it is exactly right.** It knows what it is
in the first quarter-second. It asks nothing. The italic is a lovely touch — it reads as
handwriting without pretending to be handwriting. `GEA2` and `GEA15` are both honoured
here without appearing to try. If the whole house felt like this room, this review would
be a very short and very happy document.

Two things stop it being perfect.

**Below the note, six hundred pixels of nothing.** Not air — *void*. The note ends and the
room simply stops, leaving a large grey field with a single orphaned footnote stranded in
it: *"Full product database also available in the Analyser."* That sentence is the
plumbing on the outside of the wall — the phrase "product database" belongs to the people
who built this, not to a family writing *bananas, yoghurt*. It is the one sentence in the
room and it is written in the wrong language.

**And there is no window.** Shopping is *preparing to leave the house* — the room where a
household is most literally about to go outside. It is the room with the strongest case
for a view and it has none.

---

## 9. Nutrition

Here is where I stopped being uneasy and started being concerned.

Three tiles at the top: **PLANTS 39 / 30** with a full green progress bar. **INGREDIENTS
75** this week. **PLANT CATEGORIES 6 / 9** covered.

Below, a section headed *Plant Based*, and inside it, again: **30 PLANTS THIS WEEK**,
**39 / 30 plants**, a second full-width green progress bar, and the sentence:

> *"You've hit 30 plants this week — brilliant variety."*

Then **CATEGORIES COVERED** — a checklist with ticks against Vegetables, Whole Grains,
Herbs & Spices, Fruits, Olive Oil, Legumes, and **empty circles against Seeds, Nuts,
Fermented Foods.**

Read that as a household rather than as an architect. I have been **given a target I did
not set** (30), **scored against it** (39), **shown a progress bar** toward it, **praised
for clearing it** in the product's own voice, and then shown **three empty circles**
naming precisely what my family did not eat this week.

`GEA13` forbids *scores presented as a verdict on the household*, *progress bars toward a
target the household did not set*, and gives the test: *does this measure the food, or
grade the household?* Three unticked circles labelled Seeds, Nuts and Fermented Foods do
not measure food. **They grade a family's week, and they manufacture a small deficit on a
weekly schedule** — in a product whose Constitution states plainly that households in this
domain already carry guilt about food and that a scoring mechanism does not measure that
guilt, it produces it.

And *"brilliant variety"* — however kindly meant — is the room praising me. Rooms report.
A compliment has a speaker, and there is no one here.

I saw the same **39/30** on the Planner's strip earlier. So the score follows me between
rooms. It is becoming the house's opinion of me.

**How does this room make me feel?** Assessed. And a little bit caught out about seeds.

---

## 10. The Diary

The room where the household is most exposed, and therefore the room where hospitality is
most tested.

At the top, a dismissible banner: *"Want to eat less processed food? Awareness beats
restriction. Learn our approach →"* — an authored opinion, in a room, with an × to make it
go away. It is well-intentioned and gently phrased and it is still a stranger's voice on
my diary page.

Beneath it, **Health Snapshot**: **— BMI, Not set** · **— kcal / day, Not set** ·
**Moderate / Activity / Optimal** in bright green.

BMI. In the family food diary. On the first visit, with two dashes where the numbers
should be — so the room's most prominent element is *an empty clinical measurement waiting
for my body.* § 12.1 of the Constitution names the clinical register and rejects it for a
plain reason: it frames food as a health problem being managed. A "Health Snapshot"
leading with BMI and kilocalories has argued the clinic's case before the household reads
a word.

Then the day itself: Breakfast *Empty*, Lunch *Empty*, Dinner *Empty*, Snacks *Empty*,
Drinks *Empty*. Five greyed rows saying *Empty*, each with an "+ Add" button. This is a
form telling me five times that I have not filled it in.

To the right, **Daily Signals** — and this is the moment I would have closed the product
if I were the household it is aimed at. A weight field (*e.g. 72.5*), and then **Mood** and
**Energy**, each rated **in a row of five little green apples.**

The mark of this house — the apple, its identity, the thing on the door — is the unit in
which I am being asked to score **how I feel today.** Not a jar of sauce. My mood. § 11.2
names exactly this: identity borrowed to lend authority to a number. And `GEA13`'s test
answers itself — this does not measure food at all.

Beside it, a **+ CSV** button. In a family's diary.

Below the panel, floating unattached in the empty area at the bottom left, the words
*"I want to support…"* — a truncated fragment of something, going nowhere, resting on
nothing.

**Does this feel warm, calm, beautiful, alive?** It feels like a wellness dashboard that
has been given a beautiful window. And the window makes it worse, not better, because it
raises the promise the room then fails.

---

## 11. The Orchard

The room I most wanted to love.

At the top, the window. Then an enormous, near-empty room, with text set left, quite
small, floating about a third of the way down:

> **Your orchard is quiet.**
> *You don't belong to a neighbourhood yet. When someone invites your household to one,
> it will be waiting here.*
> *A neighbourhood only ever tells your neighbours that you share it. Nothing about your
> household — your plans, your food, who lives with you — is ever visible to them.*

The **words are outstanding** — among the best in the product. Calm, complete, entirely
honest, and it answers the privacy question before I have finished forming it. Nobody is
being sold anything. This is honest absence done with genuine grace.

But the *composition* is not composed. Two paragraphs pushed to the left edge of a very
large room, with roughly seven hundred pixels of empty warm grey beneath them and nothing
to the right. § 15.1's distinction again: *a silent room feels empty; a restrained room
feels tended*, and *the discriminator is whether the household can tell that a choice was
made.* I cannot tell. This reads as a page whose content did not arrive.

The cruelty of it is the name. This room is called **Orchard**, and the orchard is the one
thing this product renders more beautifully than anything else — and the Orchard room
gives me the same thin, washed-out band the Pantry gets, and then an empty floor. **The
room named after the view has the least of it in the house.**

---

## 12. The Analyser

A search field, a scan button, and a filter reading **"Min rating: 1🍏 2🍏 3🍏 4🍏 5🍏"** —
the brand apple again, this time as a quality scale, in a row of five.

Then a single centred card: *"Analyse anything with a label"* — *"Search a product by
name, or scan its barcode with the button in the header. You'll get its ingredients,
additives, NOVA group and THA rating — and less processed alternatives where they exist."*

Then an enormous grey void, roughly two-thirds of the screen.

The card's copy is clear and useful. But this is the room where a household stands in a
supermarket aisle holding a packet and needs an answer they can trust in four seconds, and
what greets them is an empty tool bench with a jargon word on it (*NOVA group*, unglossed)
and a five-apple scale before they have scanned anything.

And here the apple has now appeared, in one session, as: the mark on the door, a
five-apple rating of a food product, a five-apple rating of **my mood**, and a five-apple
filter control. Four meanings. § 11.1's ending, arriving on schedule: *the household sees
five apples that mean four different things, and the mark has stopped identifying
anything.*

---

## 13. Profile

A settings screen, and a decent one. An avatar, my name, three chips — *Flexitarian* ·
*1 Adult • 2 Children* · *Moderately Active* — and then labelled rows: Dietary Pattern,
Allergies & Intolerances (**None**), Eating Schedule, Activity Level, Goals (*Not set*),
Budget, Preferred Stores (*Not set*), UPF Preference (*A balanced approach*).

§ 5.1 calls this room *"the family record"*, and there is one flash of that: **1 Adult •
2 Children** is a *household* fact, warmly put, and for a second the room is about a
family. Everything else is a preferences pane — four *Not set*s, and the room's own
character is a form.

The most important row in the entire product is here: **Allergies & Intolerances**. It sits
in the middle of a list, at the same size, in the same weight, as *Budget* and *Preferred
Stores*. This is the fact on which a household's trust and a child's safety rest, and
architecturally it is furniture of the same class as a shopping preference.

And in the top-right corner of the card: a small apple with the word **THA** beneath it.
The product's mark, placed inside a room, as decoration, on the page about *me*. `GEA12`
exactly: *a room that wants a mark for warmth wants light, material or air instead.*

---

# PART TWO — WHAT I FELT ACROSS THE WHOLE HOUSE

## Atmosphere

There is a real atmosphere here, and it is worth saying plainly: **this does not feel like
most software.** The palette is warm, the type is unusually good, nothing shouts, nothing
blinks, nothing is trying to make me click. Placed beside any mainstream meal-planning
product, this one is quieter, more considered, and better mannered by a wide margin.

The atmosphere fails in one specific, consistent way: **it is applied at the top of each
room and abandoned below the fold.** Every room has a warm, atmospheric band across its
head — a window, a title, a soft light — and then, four hundred pixels down, becomes a
competent grey application. The house has a beautiful facade one room deep.

## Room identity

Nine rooms. **Two of them know what they are** — Home (a room you stand in) and Shopping
(a note on a counter). The Orchard *would* if it had anything in it. The other six are the
same room: warm canvas, a title, a tab strip, cards.

The Constitution says a room is differentiated by purpose, light, material and one sign of
life. The recent work has genuinely delivered **light** to five rooms and **material** to
all of them, and both are real improvements — the plaster and the floor are honest, and
the rooms are measurably lighter than they were. But those two means alone produce
*consistency*, not *identity*. The Planner and the Diary have the same light, the same
floor, the same material, the same tab strip. **They are the same room with different
data in it.** Purpose is not expressed in their form, and no room but Home has a single
sign of life.

## Orchard presence

The orchard now appears in six rooms rather than one, and that is a genuine advance —
walking the house, I did feel that the rooms belonged to one site.

But there are **two orchards, and a household meets both.** The vivid, three-dimensional,
sunlit view at Home; and the pale, flattened, washed-out band everywhere else. They are not
the same place seen from two rooms. They read as **one photograph and one photocopy of
it.** § 6.1 says one orchard, and a household will believe the Home window and quietly
discount the others.

And it is always **the same morning, at the same intensity, forever.** That constancy is
deliberate law and I understand the argument for it. Lived with for a year, the honest
risk is that the view stops being a view and becomes a header image — the one thing § 6.1
says the orchard must never be. It is not wallpaper yet. It is one degree of familiarity
away from becoming wallpaper.

## Light and colour

The light is the best-executed idea in the product. One sun, upper-left, obeyed
consistently by the window, the sill, the ground and now the plaster surfaces. Depth is
readable without borders. The house genuinely feels *lit* rather than *coloured*, which
is rare and hard.

Colour is where the discipline visibly frays. Green is the house. But the Shopping door
and basket are **blue** — permanently, in the shell. The Diary's *Optimal* and *Moderate*
are a brighter, more saturated green than anything around them, and read as a status
light. Nutrition's progress bars are a third green again. Realm tints distinguish room
titles so subtly that I could not reliably name a room by its colour, which means the tint
is paying a complexity cost and buying nothing.

## Materials and craftsmanship

The material system is the most technically accomplished thing here. Surfaces are opaque
plaster now; they cast a soft, single-source shadow; they rest on a floor; the border has
fallen from a drawn ring to a whisper. Against the before-captures the difference is real
— rooms that read as *lines drawn on a floor* now read as *objects standing on one*.

Craftsmanship, though, is where I would fail this product in a design review, and it is
death by a hundred small cuts. In a single hour's walk I found: a truncated welcome
sentence; two typographic treatments of the same greeting; two links to the same room
stacked on the most important card in the house; two truncated advisory sentences in the
Planner's strip; a recipe named *Rice Bowl 2*; three-dot menus overlapping card titles;
an orphaned *"I want to support…"* fragment; a stranded *"Full product database…"*
footnote; a right-hand panel in the Cookbook made of visibly older material than the cards
beside it; unlabelled six-icon rows on every recipe card; and *NOVA group* used
unexplained.

None of these is serious. **Together they are the difference between a home somebody
maintains and a house somebody is still building.** The Constitution defines premium as
*the perceptible result of care taken on the household's behalf* and offers the test: *if
they would feel its absence, it is craft.* A household would feel every one of these.

## Warmth

Warmth in this product comes almost entirely from **light and language**, and hardly at
all from **content**.

The language is frequently superb. *"Nothing is joined until you say so."* *"Nothing to
fetch — the cupboards are as you left them."* *"Your plan is all still there."* *"A
neighbourhood only ever tells your neighbours that you share it."* Somebody with a real
ear wrote these, and they are the warmest thing in the house.

But warmth in a home comes from **the household's own life being visible in it**, and the
household is almost invisible here. I saw Chloe's name, her three preference chips, seven
lowercase pantry strings and a three-line shopping list. Everything else on every screen
was generated by the product. § 12.2 states the rule exactly: *an interface that feels
lived in has the household's own life in it.* This one has THA's output in it, warmly lit.

## Joy and delight

I looked hard for the moment described in § 13 — the pleasure of being noticed accurately,
*"you have cooked with lentils eleven times this year"*, the small true unearned thing.

**I did not find one anywhere in the house.**

What I found instead, occupying the space where joy should be, was its counterfeit:
**39/30**, a full progress bar, *"brilliant variety"*, three unticked circles, *14/28
meals planned*, five apples for my mood, an *Elite* tier I am told exists. Every one of
those is a *reward* or a *grade*. Not one is a *noticing*.

This is the most important paragraph in this review. The product has built the entire
apparatus of gamified motivation — targets, bars, tiers, praise, coverage checklists —
and has built **none** of the quiet accuracy its own Constitution names as the only joy it
wants. It has the debt-producing mechanism and not the compounding one.

## The Companion

A small green circle with an apple in it, bottom right, in every room. It never
introduced itself. It never said anything. I never learned its name, what it can do, or
whether it is worth opening.

Meanwhile the house talks to me constantly — an autumn tip on the Planner, *"brilliant
variety"* on Nutrition, *"Awareness beats restriction"* on the Diary, a gentle reminder on
Home. **The advice is everywhere and the adviser is nowhere.** A household will conclude
that the coaching *is* the product and the circle is a help button. That is the four
failures of § 7.1 arriving together — the voice cannot be honest, cannot be declined,
cannot remember, and cannot be governed — and it is the reason the product's intelligence
currently reads as *content* rather than as *someone who knows this family*.

## Emotional flow between rooms

Tracing the arc of my visit:

**Doorstep** — polite, cold, generic.
**Arrival** — a genuine lift. Warmth, welcome, my own name.
**Home** — the peak, then a deflation into three apologies.
**Planner** — a sharp drop. Work, a toolbar, a target, a half-sentence.
**Cookbook** — the floor. Beautiful window, machine output, *Rice Bowl 2*.
**Pantry** — flat. Inventory.
**Shopping** — a real lift. The best-judged room in the house.
**Nutrition** — assessed and mildly judged.
**Diary** — clinical, and the mood-apples.
**Orchard** — lovely words in an empty room.
**Analyser** — an empty bench.
**Profile** — a form, with one warm chip.

That is not a flow. **It is a spike at the door followed by a long descent, with one
recovery in Shopping.** The emotional high point of the entire experience is in the first
eight seconds, before I have done anything — which means the product is at its most
appealing precisely when it is least useful, and the rest of the visit spends the goodwill
that arrival earned.

There is a structural reason, and it is worth naming as the review's central observation.
**Home was designed as a room. Everything else was designed as a feature and then
decorated to match.** The window, the floor and the plaster are excellent decoration
honestly applied — but you cannot reach *room* from *page* by adding materials, because
the difference is not what a surface is made of. It is whether the household is the
subject.

---

# PART THREE — THE VERDICTS

## 1. The five biggest emotional gaps

**1. The Cookbook is machine output, and there is no food in it.**
Five hundred combinatorially generated titles, one ending in the digit 2, and not a single
photograph of a meal in the entire room. This is the room that must make a family want to
cook, in a product whose whole subject is food. It currently proves the opposite of what
it needs to prove: it demonstrates that the intelligence generates volume rather than
knows my family. Everything else in this review is recoverable. A household reaching
*Rice Bowl 2* stops believing the house.

**2. The house grades the household, and calls it help.**
39/30 with a full progress bar. Three empty circles named Seeds, Nuts, Fermented Foods.
14/28 meals planned. Five apples for my mood. *"Brilliant variety."* A BMI field waiting
for my body on the diary page. Each is individually defensible and the sum is a product
that has an opinion about how my family is doing — in a domain where the household already
carries guilt, and in a house whose own constitution forbids it in the plainest terms it
uses anywhere.

**3. There is no one home.**
The house advises constantly and has no speaker. Four different rooms coached me in four
registers; the one presence that could have owned any of it sat silent in the corner for
the entire visit. The result is that intelligence arrives as *content* — anonymous,
unaskable, undeclinable — and the warmest promise in the product, that somebody has
already thought about dinner, has no somebody in it.

**4. Home apologises on arrival.**
The most beautiful screen in the product spends its content on *"isn't linked to the
calendar yet"*, *"Not linked to dates"*, *"can't tell which one is this week"*, *"will
appear here as meals are planned."* The honesty is right and the atmosphere it creates is
wrong. A guest is welcomed into a lovely room and handed three notes about what is
missing, and leaves with slightly *more* on their mind than they arrived with — which is
the one outcome the product exists to prevent.

**5. Nothing in the house has ever noticed me.**
Not once did anything say a small, true, specific thing about this household that I had
not put in myself. The space reserved for that is fully occupied by scores. A product
whose entire emotional case is *"someone has already thought about you"* did not, in nine
rooms, demonstrate a single act of attention.

## 2. The five most magical moments

**1. The window at Home, at 1920.** Blossom in the foreground, hills in low golden light,
a brass sill running the width of the room. For a few seconds I forgot I was looking at an
application. Nothing else in this product comes close, and very little software anywhere
achieves it.

**2. *"Welcome home, Chloe."*** Arriving before working. A whole beat spent on nothing but
welcome. It is the bravest decision in the product and it is correct.

**3. The Shopping note.** Three italic lines on a sheet of paper and nothing else. It knows
exactly what it is, asks for nothing, and is the only room besides Home where I felt
*at ease* rather than *in an interface*.

**4. *"Nothing is joined until you say so."*** On the doorstep, before I have committed to
anything, the house anticipates my hesitation and settles it in seven words. That sentence
is worth more than most features.

**5. The Orchard's honesty.** *"Your orchard is quiet… Nothing about your household — your
plans, your food, who lives with you — is ever visible to them."* An empty room that
answers the privacy question before it is asked, without selling me anything. This is what
honest absence sounds like when someone takes it seriously.

Note what these five have in common: **four of them are words, and one is a picture. Not
one of them is a feature.** The product's magic currently lives entirely in its voice and
its light — which is very good news, because it means the soul is real and present, and
the problem is distribution rather than absence.

## 3. The single change that would most transform how the product feels

**Fill the house with the household's own food, photographed, and delete the five hundred
generated suggestions.**

If I could make one change, it is this — not a redesign, not a new room, not a rule.

The Cookbook is the room that decides whether this product is a warm home or a content
farm, and it currently decides it in the wrong direction within two seconds. Replace five
hundred combinatorial titles with a **small, real, photographed collection** — twenty
recipes a person actually chose, with pictures of the food, named the way a family names
food — and four things change at once, without touching anything else:

- The Cookbook stops proving the intelligence is a generator and starts proving it has
  taste. **Restraint reads as curation; volume reads as automation.**
- The house acquires the one thing it is missing everywhere — *life that belongs to the
  household rather than to the product*. Photographs of food are the household's life. Grey
  wand glyphs are the product's machinery.
- The room finally becomes what the architecture already says it is: a shelf of objects
  you pick up. **You cannot pick up a card that has no face.**
- And the scores lose their purpose. A room that can show a family *what they ate*, in
  pictures, has no need to tell them *39/30*. Most of the gamification in this house exists
  because the rooms have nothing real to show and a number is the cheapest thing to put in
  an empty room.

It is also the change most likely to be resisted, because it trades a large number for a
small one, and 500 looks like more product than 20. It is not. **Every one of those five
hundred cards is a withdrawal from the account the household's trust is kept in.**

## 4. Does The Healthy Apples feel like a place people would love returning to?

**Not yet — but it is much closer than that answer sounds, and closer than most products
ever get.**

There is a place here. Home is a room, not a page, and I could feel the difference without
being told. The light is real and consistent. The voice, when it speaks in its own
register, is better than almost any product I can think of. The restraint is genuine and
hard-won, and there is not one dark pattern in the house — nothing tried to hook me, nag
me, or manufacture urgency.

But a household returns to a place for one of two reasons: **it is easier there, or it is
lovely there.**

Right now, the loveliness is one room deep and the ease is not yet delivered. On my first
morning the product told me it could not work out which week it was, offered me half a
sentence about autumn, showed me five hundred rice bowls without pictures, gave me a
target of thirty plants, noted that I had not eaten seeds, and asked me to score my mood
in apples. I would return because the window is beautiful. I would stop returning when
the window stopped being new — which is roughly the third visit.

The house is built and lit. **It is not yet inhabited.**

## 5. The overall score

> **"I would happily recommend somebody I love use this every day."**
>
> ## **5.5 / 10**

**Why not lower.** This product has something most never acquire: a genuine point of
view, executed with real skill in at least two places. The arrival, the Home window, the
Shopping note and the quality of the writing are the work of people who understand
hospitality. It is honest — conspicuously, sometimes awkwardly honest — and it never once
tried to manipulate me. If the question were *"is there something real here?"* the answer
would be an emphatic yes.

**Why not higher, and this is the part that matters.** I was asked whether I would
recommend it **to somebody I love**, **every day**. Picture that person specifically: a
parent, tired, at six o'clock, already carrying some quiet guilt about the last three
days of dinners.

I would be sending them to a product that, on their first evening, would show them a
progress bar against a target they did not set, three unticked circles naming what their
family failed to eat, a BMI field on the page where they record what they fed their
children, and a request to rate their mood out of five apples. I would be sending them to
a cookbook of five hundred machine-generated rice bowls with no pictures of food. I would
be sending them somewhere that talks to them constantly and has nobody in it.

For a person who is *fine*, that is a mild annoyance. **For the person this product is
actually for — the one carrying the load it was built to lighten — it is a small,
repeated, daily judgement, and it comes from a house that is beautiful enough to be
believed.** That combination is worse than a plain tool, not better, because the warmth
buys credibility that the scoring then spends.

So: I would show it to someone I love. I would say *look at this window, read these
sentences, this is going to be lovely.* I would not yet tell them to live in it.

**The gap between 5.5 and 9 is not a redesign.** Nothing in this review asks for a new
visual language, a new structure, or a new idea — the ideas are all present and most of
them are excellent. The gap is: **stop grading the household, put real food in the
cookbook, give the advice a speaker, and let Home say something true and warm instead of
something absent.** Four changes, none of them structural, and the house would be
genuinely inhabitable.

The reason to be optimistic is the reason this review is worth reading at all: **every
single failure above is a failure of *inhabitation*, not of *architecture*.** The house is
right. It is beautifully lit, honestly built, and standing on good ground. Nobody has
moved in yet.

---

*This is a point-in-time experience review. It proposes no code, no CSS, and no
implementation. It records how The Healthy Apples felt to a household walking through it
for the first time on 2026-07-20, judged against the Experience Constitution.*
