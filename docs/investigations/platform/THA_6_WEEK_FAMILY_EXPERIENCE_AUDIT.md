# THA 6-WEEK FAMILY EXPERIENCE AUDIT

**Date:** 2026-06-23
**Branch:** safety/preserve-since-last-prod-20260617-1613
**Rollback tag:** `rollback/pre-6week-experience-audit-20260623`
**Previous audits protected:** YES — THA_FULL_SYSTEM_LAUNCH_READINESS_AUDIT.md, WS2_PANTRY_EXPLORE_V2.md, WS2_PANTRY_EXPLORE_V2_IMPLEMENTATION.md all present and unmodified.
**Scope:** Investigation only. No implementation. No fixes. No refactors.

---

## PREAMBLE

This audit asks one question:

> Would real households genuinely enjoy using THA every week?

Everything else is noise until this is answered.

The answer as of this audit: **Not yet. But the bones are remarkable.**

THA has built genuinely intelligent features — Discovery, Stories, Alternatives, Seasonal Stories, Smart Planner, PantryKnowledgeHub — that most consumer health apps do not have. The problem is that real families will never find them. The visible surface of THA is a competent meal planning app. The hidden interior is a food intelligence platform. The gap between what users see and what exists is the audit's central finding.

---

## MANDATORY FIRST STEP: ROLLBACK PROTECTION

**Git status at audit start:** 2 modified files (client/src/components/PantryKnowledgeHub.tsx, server/routes.ts), 3 untracked investigation files.

**Previous audits:** All three untracked investigation files confirmed present.

**Rollback tag created:** `rollback/pre-6week-experience-audit-20260623` on HEAD commit f531216.

**Rollback restoration command:** `git checkout rollback/pre-6week-experience-audit-20260623`

**Status:** PROTECTED. Audit proceeds.

---

## THE FIVE USER TYPES — SIX WEEK SIMULATION

---

### USER TYPE 1: NEW PARENT

**Profile:** Sarah, 34. Partner and two kids (ages 4 and 7). Heard about THA from a friend. Health-anxious but time-poor. No food app history.

---

**Week 1 — Landing and Sign Up**

Sarah lands on the home page. The headline is clean: *"Eat better. Without overthinking it."* The subtext — *"Scan food, understand what's in it, make confidently better choices"* — is fine. The story section mentions a family navigating health challenges. She connects with this.

**Delight:** The "Try free for 20 minutes" button removes friction. She can explore before committing. The orchard visual is warm and distinctive.

**First confusion:** What does THA actually do? The three value blocks — Scan & Understand, Make Better Choices, Build Better Habits — describe benefits, not actions. After 30 seconds she still doesn't know if THA is a shopping app, a recipe app, or a diet tracker. She clicks Create Account.

**Onboarding — 12 steps:**

This is the most critical experience problem in THA.

Step 1: Welcome. Fine.
Step 2: Values. She's asked about what she values. Warm, but vague.
Step 3: Approach. More values. Why two steps?
Step 4: Real Food. Still framing.
Step 5: About You — height, weight, activity level. Medical. Unexpected. She pauses.
Step 6: Allergies. Expected and useful.
Step 7: Diet. Expected and useful.
Step 8: Style. Eating schedule. A little unexpected.
Step 9: Choices. UPF preferences, budget, store. Long.
Step 10: Features — she picks one area to start. First concrete thing.
Step 11: Tracking — toggles for different data types. Feels like settings.
Step 12: Begin. Finally.

**Abandonment risk: HIGH.**

12 steps is 4-5 steps too many. Steps 2-4 are values-framing that could be a single paragraph at the start. Steps 10-11 could be deferred to first use. A first-time parent with two kids will hit step 5 (height/weight/BMI) and seriously wonder if this is a diet app.

**Post-onboarding landing:**

The app routes her based on onboarding choices. If she chose "Cookbook" she goes to /cookbook. Clean. But there's no "here's what to do first" moment. No welcome state. No tutorial. She stares at an empty cookbook.

**What Delights:** The apple progress indicator in onboarding is charming. The orchard backdrop is distinctive. The option to start free without signup.

**What Confuses:** Why 12 steps. Why medical metrics before any value has been delivered. Why the landing page doesn't show her a screenshot of the actual product.

**What Feels Unfinished:** No post-onboarding welcome screen. No "here's your first suggested action." No scaffolding for the empty state.

**Abandonment Risk:** HIGH during onboarding (steps 5-9). MEDIUM after reaching the app.

---

**Weeks 2-3 — Building a Routine**

Sarah starts adding meals to the Cookbook. The interface is clear. She can create a meal, import from URL, or scan. Creating a meal by hand is fine. She adds three family favourites.

She finds the Planner and tries to plan Monday's dinner. She drags her pasta to Monday/Dinner. It works. She plans three days.

She notices "Smart Planner" and tries it. A sidebar appears. Results come back — suggestions, explanations. This feels intelligent. She plans her whole week in 4 minutes.

**Delight:** Smart Planner is a genuine time-saver. The household compatibility check ("Finn can eat this, Maya may need adaptation") is exactly what a parent needs.

**Confusion:** "What's a Nutrition Boost?" She sees "Simply Better Choices" on a meal card. She taps it. A panel opens showing ingredient swaps. It's interesting but she doesn't quite understand the difference between a Boost and a Choice.

**Abandonment risk at Week 3:** LOW for the Planner workflow. She is finding value.

---

**Weeks 4-6 — Discovery and Drop-Off**

She goes to Pantry for the first time (it's been 3 weeks). She sees a list interface. She adds some items. She notices an "Explore" button at the top. She taps it. She finds the PantryKnowledgeHub.

She reads about oats — health benefits, nutrients, varieties, seasonal notes. She reads about salmon. She reads about seasonal vegetables. She spends 20 minutes here.

**This is THA's best experience. She found it in week 4 by accident.**

**Delight:** The PantryKnowledgeHub is genuinely interesting. The Stories section is warm and readable. Discovery suggestions feel intelligent. Seasonal content connects food to the real world.

**Frustration:** Why wasn't she shown this earlier? Why is this buried behind "Pantry > Explore"? Why isn't this on the Dashboard?

**The would-they-pay test:** She'd keep the subscription for the Planner + Smart Planner. The Pantry Explore is a bonus she'd never have known to ask for. She would not pay specifically for the Diary or Dashboard in their current form.

---

### USER TYPE 2: BUSY FAMILY

**Profile:** James and Kate, 38 and 36. Three kids. Kate manages most of the food planning. Uses a paper list. Wants to "get organised." Picked THA because it had a planner.

---

**Week 1 — They want the Planner immediately**

James creates an account. He skips onboarding values and nutrition steps impatiently ("I just want to plan meals"). He reaches the Planner.

The Planner is visually rich — days of the week, meal slots, meal cards, chip indicators. He tries to add a meal. He needs to go to the Cookbook first. He goes to the Cookbook. He adds "Chicken Pasta." He comes back to the Planner. He adds it to Wednesday dinner.

**Friction:** The Planner requires pre-existing Cookbook content. A new user has 0 meals. You cannot plan meals without building the Cookbook first. This is the right data model but the wrong onboarding journey.

**What Delights:** Once he has meals, the drag-and-drop planning is fast and satisfying. The weekly view is clean.

**What Confuses:** What is "Quick List" vs "Shopping List" vs "Shop"? He sees three navigation items that seem to be about shopping. He tries Quick List, finds a simple text list. He tries the "Shop" option, finds something called a Shopping Workspace with stages (Prep, Shop, Done). He doesn't know which one to use for his weekly shop.

---

**Week 2 — Planner → Shopping**

Kate takes over. She uses the Planner to assign meals for the week. She clicks "Send to Shopping List." The system generates a list from the planned meals. She is impressed.

She goes to the Shopping List. The list is organised by ingredient. She sees THA ratings on some items. She finds the Analyser linked from some items. She scans a ready meal. She gets a NOVA group, health score, ingredient breakdown, UPF warning. She is shocked by what's in their usual frozen pizza.

**Delight:** The Shopping → Analyser loop is powerful. The revelation that their usual products have 15+ UPF ingredients is a genuine "ah-ha" moment. This is exactly why THA exists.

**Confusion:** She can't figure out what the "THA Score" means. Is it a nutrition score? A health grade? A ranking against other products? The apple rating system isn't explained on the page. She has to look for an info tooltip.

**Week 3-6 — Routine**

They use the Planner every week. Shopping generation works well. They start using the Analyser more. Kate occasionally checks the Diary.

**Drop-off risk:** LOW for the Planner core. MEDIUM for features beyond Planner+Shopping. Kate never finds the Pantry Explore, Stories, or Discovery. These remain invisible.

---

### USER TYPE 3: HEALTH-CONSCIOUS USER

**Profile:** Nina, 29. Solo household. Health-focused. Reads food labels. Already knows about UPF. Downloaded THA for the Analyser.

---

**Week 1 — Analyser First**

Nina skips straight to the Analyser. She scans three products on her kitchen counter. The NOVA groups are correct. The ingredient breakdowns are detailed. The "UPF warning" system is clear. She's impressed.

She finds "Whole Food Analysis" — suggestions for real food alternatives. She loves this.

**Delight:** The Analyser is genuinely good for her use case. The ingredient parsing is credible. The health score feels trustworthy. The "Simply Better Choices" panel on meal detail pages is excellent — real substitutions, not generic advice.

**Confusion:** The Analyser is called "Analyser" in the nav but the route is /analyser and the page is /products. She notices the URL mismatch. Minor but tells her the naming is inconsistent internally.

---

**Week 2 — Food Reports**

Nina finds the Food Report feature via the Pantry Explore. She reads about broccoli — nutrients, benefits, varieties. She reads the nutrient section and finds detailed information about sulforaphane. This is credible and specific.

She finds the Plant Diversity Report via a link in the Planner. She checks her week's plant diversity score. 18 plants. She works out which meals add the most variety.

**Delight:** The Plant Diversity Report is exactly the kind of tool she wanted. The breakdown by category is intelligent. The suggestion to add more fungi and seaweeds is specific.

**Confusion:** The Plant Diversity Report is accessed from the Planner, but it reports on the whole week. If she's not using the Planner, she can't access this report. There's no independent route to it from the main nav.

---

**Weeks 3-6 — Power use**

Nina explores the Pantry Explore deeply. She reads Stories. She reads Seasonal content. She uses Discovery to find foods she's never tried (she finds celeriac in a "seasonal curiosity" suggestion and actually buys it).

**Delight moment:** She finds the "Alternatives" section on a food page. She's looking at white rice. The alternatives section shows: brown rice, quinoa, pearl barley, freekeh — with specific reasons for each. This is the kind of intelligent food guidance she has never seen in a consumer app.

**Would they tell a friend?** YES. Nina would absolutely tell health-conscious friends about the Analyser and Pantry Explore. These are differentiated features.

**Would they pay?** YES. The Analyser + Pantry Explore combination is unique in the market.

---

### USER TYPE 4: POWER USER

**Profile:** Marcus, 42. Tech-comfortable. Uses multiple apps. Has a large household (2 adults, 3 kids with different dietary needs — one is lactose intolerant, one is a fussy eater, one is pescatarian). He wants THA to manage the complexity of feeding this household.

---

**Week 1 — Setting Up Household**

Marcus creates his account and goes to Profile to set up household members. He finds household management buried inside Profile. He adds three children as "Eater" profiles. He sets dietary restrictions for each.

**Friction:** Household management is deeply nested in Profile → Household. Finding it requires scrolling through several profile sections. There is no "Household" item in the main nav. For Marcus, this is the most important feature of THA — and it's the hardest to find.

---

**Week 2 — Testing Household Compatibility**

Marcus plans the week's meals in the Planner. He sees compatibility chips on meal cards — green for all eaters, amber for some restrictions. He opens a meal card with amber. It shows which family member has a restriction and offers adaptations.

**Delight:** The household compatibility system is sophisticated and exactly what he needed. The adaptation suggestions ("use oat milk instead of dairy for this meal") are practical.

**Confusion:** The meal cards are dense. Each card has: meal name, image, meal type chip, nutrition chips, household fit indicator, boost/uplift indicator, adaptation count. On mobile, this is overwhelming. He can't quickly scan the week to see which meals need attention.

---

**Weeks 3-4 — Using Everything**

Marcus uses the Smart Planner to generate a week. He filters by "all household compatible." The suggestions honour the household restrictions. He is genuinely impressed.

He finds the Diary and uses it to log foods. He connects it to the Health Snapshot in Profile. He sets daily calorie targets. He starts tracking weight and blood pressure.

**Confusion:** The Diary and the Dashboard both offer to log weight. The Dashboard has a "Log Today's Weight" quick action. The Diary also tracks weight. He logs it in both places once, then tries to understand which is canonical. (Answer: both write to the same diary metrics table. But there's no visual indication of this.)

---

**Weeks 5-6 — Return and Exploration**

Marcus finds the Pantry Explore and spends real time there. He reads about foods his lactose-intolerant child eats. He uses the Alternatives section to find dairy-free alternatives that are nutritionally equivalent. He reads the Stories section and finds one about "Household eating patterns."

**Delight:** The Household Stories in PantryKnowledgeHub are remarkable. They tell real narratives about food families. He wants to show these to his partner.

**Would they tell a friend?** YES — specifically about the household compatibility system and the Pantry Explore. These are things no other app does.

**Would they pay?** YES. But he would have left by week 2 if he hadn't found household compatibility. It's too hard to discover.

---

### USER TYPE 5: RETURNING USER

**Profile:** Priya, 31. Used THA 3-4 months ago. Stopped using it — life got busy. She vaguely remembers the Planner. She's downloaded it again because she wants to "eat better this summer."

---

**Re-entry Experience**

She opens THA. She lands on the Dashboard. It shows her old stats — 12 meals in her Cookbook from 4 months ago. The "This Week" chart shows 0 days with meals (she hasn't planned anything this week).

**What's missing:** There is no "Welcome back, Priya" moment. No "Here's what's changed since you were last here." No suggestion for where to start. No seasonal prompt ("It's summer — here's what's good right now"). The dashboard is silent about her absence.

**Confusion:** She looks at the nav and sees "Pantry." She clicks it. She sees her old pantry list. She sees the "Explore" mode. She never found this before. She explores it. She discovers the Seasonal Stories section — it's about summer produce. This is exactly the kind of content that would have brought her back.

**Opportunity missed:** There is no re-engagement hook. No notification. No email. No "seasonal roundup." No "your meal plan from last month — ready to reuse?" The product has no memory of her. It just resumes exactly where she left off.

**Would they stay?** UNCERTAIN. If she finds Pantry Explore within her first 10 minutes back, she might re-engage. If she doesn't, the Dashboard's emptiness will drive her away within 2 sessions.

---

## AREA-BY-AREA AUDIT

---

### 1. DASHBOARD

**Experience Score: 52/100**

**First Impression:** Clean, professional, a little empty. Four stat cards (Cookbook count, Basket count, This Week days, THA Score) feel like admin. The weekly plan bar chart is visually clean but empty for new users.

**What Delights:**
- The personalised greeting (Good morning / afternoon / evening) is a small but warm touch.
- Meal mix pie chart is genuinely interesting for established users.
- "Log Daily Signals" captures a broader health picture than most apps.

**What Confuses:**
- The "THA Score" card shows "-" when the basket is empty. This is the Dashboard's first health signal for new users — and it's blank. A new user sees nothing.
- "Log Daily Signals" includes blood pressure, blood sugar, heart rate BPM. This is medical. Most users will be confused why a food app is tracking blood pressure. No context is given.
- "Analyse Basket" as a quick action sends users to /basket, not to the scanner. Users expect "analyse" to mean scan something.
- There is no contextual suggestion — no "you haven't planned this week," no "it's Thursday — time to shop," no seasonal nudge.

**What Feels Unfinished:**
- The Dashboard has no narrative. It presents numbers but tells no story.
- For a new user with 0 data, the Dashboard is completely empty and offers no path forward except "Add Your First Meal."
- The health journal signals (blood pressure etc.) are captured but never surfaced anywhere on the Dashboard itself. You can log them but you can't see a trend.
- No "recently cooked" or "meals from this week" section.

**Discoverability:** Good — it's in the nav. But the value isn't clear.

**Launch Risk:** 🟡 Needs Polish

**Path To Green:**
- SUGGESTION: Replace the "THA Score" blank state with a welcoming callout: "Scan your first product to see your food health score."
- SUGGESTION: Add a seasonal nudge card when data is sparse ("It's June — stone fruits are in season. Check Pantry Explore.").
- SUGGESTION: Remove blood pressure / blood sugar / BPM from the "Log Daily Signals" quick form on Dashboard. Keep that in Diary where users have context. The Dashboard form should only capture mood, energy, weight, sleep.
- SUGGESTION: Add a "What to do today" card that rotates based on day of week, planner state, and season.
- Effort: 2-3 prompts.

---

### 2. COOKBOOK

**Experience Score: 70/100**

**First Impression:** Clean grid of meal cards. Good use of imagery. The filter/sort options are well thought out. Creating a meal from scratch is straightforward.

**What Delights:**
- Importing from URL is genuinely useful and a differentiator.
- The recipe scan (camera) is impressive when it works.
- Meal categorisation (breakfast/lunch/dinner) is intuitive.
- The search with spell correction is above expectation.

**What Confuses:**
- Route is /cookbook in nav but also /meals. Users who type /meals see the same page. Not harmful, but tells you the naming evolved.
- The cookbook shows both user meals and THA system meals. It's not immediately clear which meals are "yours" vs THA's. The watermark system exists but is subtle.
- "Add to Week" from the cookbook takes you back to the Planner mentally — but the modal opens in-context. Slightly jarring.

**What Feels Unfinished:**
- No "recently used" or "frequently planned" section in the Cookbook.
- No "cook this tonight" shortcut that checks what's in the Planner for today.
- The empty state for a brand new user is just a prompt to add a meal. No suggested starter meals or THA library browsing.

**Discoverability:** Excellent — second item in sidebar nav.

**Launch Risk:** 🟢 Ready

**Path To Green:**
- SUGGESTION: Add a "THA Favourites" section at the top for new users with zero meals — a curated selection of 4-6 THA system meals to browse.
- SUGGESTION: Make the THA watermark more visible so users clearly understand the source of meals.
- Effort: 1-2 prompts.

---

### 3. MEAL DETAIL PAGES

**Experience Score: 74/100**

**First Impression:** Rich and detailed. The meal card opens to show: image, name, categories, ingredients, nutrition chips, household fit, Simply Better Choices, adaptation options. For an engaged user this is excellent.

**What Delights:**
- Family Confidence panel showing which household members can eat this meal.
- Meal Trust Summary (ingredient sourcing, processing level) builds genuine trust.
- Simply Better Choices / Nutrition Boost panel is intelligently designed — real food swaps, not generic advice.
- Household Adaptations Summary — knowing that "Maya can eat this if you swap the milk" is exactly what busy parents need.

**What Confuses:**
- The meal detail page is very information-dense. On mobile, the user must scroll through several panels to see all the information.
- "Nutrition Boost" and "Simply Better Choices" serve overlapping purposes. A user cannot easily distinguish between them.
- The "Add to Week" flow: clicking a slot, then choosing a day, then choosing a meal type, involves 3-4 taps. Could be 1.

**What Feels Unfinished:**
- No "cook this" flow. You can view a meal and add it to the planner, but there's no "start cooking" mode with step-by-step instructions.
- No "I cooked this" button. No feedback loop from cooking to diary.
- No "similar meals" or "you might also like."

**Discoverability:** Good — reachable from Cookbook and Planner.

**Launch Risk:** 🟡 Needs Polish (density and cooking flow gap)

**Path To Green:**
- SUGGESTION: Collapse the "Simply Better Choices" and "Nutrition Boost" panels into a single "Improve this meal" panel with internal tabs.
- SUGGESTION: Add a "Mark as cooked today" button that auto-logs to the Diary.
- Effort: 2 prompts.

---

### 4. PLANNER

**Experience Score: 62/100**

**First Impression:** The weekly grid is clean and clear on desktop. On mobile, it condenses into a scrollable day-by-day view. The meal slots (breakfast/lunch/dinner/snack) are intuitive.

**What Delights:**
- Drag and drop works on desktop and is satisfying.
- The meal card in the planner shows nutrition variety chips — this is intelligent and visually clear.
- The "Send to Shopping List" action is one of the most powerful things in THA — it collapses the plan-to-shop journey into a single tap.
- The week-to-week navigation (previous/next week) is smooth.
- Sharing a plan with a partner is a thoughtful feature.

**What Confuses:**
- The Planner page file is enormous (the component imports 25+ icons, 10+ component types, DnD kit, framer-motion, etc.). The user experiences this as: the page is slow to load on first visit.
- There are too many visible action items on each meal card. On a mobile device, the meal card has chips for meal type, nutrition dots, household fit, boost indicators — all competing for space.
- The "Quick add" flow requires users to go to the Cookbook first. A new user cannot add meals from inside the Planner without having pre-built their Cookbook.
- Week navigation: there's no "this week" button to jump back to the current week from weeks ahead.

**What Feels Unfinished:**
- No "how did this week go?" end-of-week summary.
- No "copy last week's plan" shortcut (this would be the most-requested feature from busy families).
- The "Nutrition Report" (Plant Diversity) is accessible from a button within the Planner, but its position changes based on view state. A new user may never find it.

**Discoverability:** Good — prominent in nav. But depth of features is low.

**Launch Risk:** 🟡 Needs Polish

**Path To Green:**
- SUGGESTION: Add "Copy last week" as a primary action in the Planner header.
- SUGGESTION: Add a "This week" jump button when viewing past/future weeks.
- SUGGESTION: On mobile, collapse meal card to name + primary restriction indicator only. Let users tap to expand.
- Effort: 2-3 prompts.

---

### 5. SMART PLANNER

**Experience Score: 68/100**

**First Impression:** Found via a button or wand icon in the Planner header. Opens a side panel. Suggests meals for the week based on household profile, restrictions, variety goals, and past meals.

**What Delights:**
- The suggestions respect household dietary restrictions. This is not trivial and it works.
- Meal explanations ("High in plant variety, good for this household") feel intelligent.
- The ability to lock certain meals and regenerate the rest is excellent.
- The speed of generation is impressive.

**What Confuses:**
- The entry point for Smart Planner is not obvious. It's a sparkle/wand icon that many users will not recognise.
- The difference between "Smart Planner" and manually adding meals is unclear on first encounter. Why would I use this instead of just picking meals I like?
- After generating a plan, the user must manually accept each meal slot. There is no "accept all" primary action.

**What Feels Unfinished:**
- No history of previous smart-planned weeks. The system doesn't learn from which suggestions you kept vs. deleted.
- No explanation of why a particular week's suggestions differ from the previous week.

**Discoverability:** Poor — buried in Planner header behind an icon.

**Launch Risk:** 🟡 Needs Polish (discovery is the issue, not quality)

**Path To Green:**
- SUGGESTION: Add a persistent "Generate my week with Smart Planner" banner at the top of an empty Planner week.
- SUGGESTION: Add an "Accept all" button to the Smart Planner panel alongside the individual accept actions.
- Effort: 1 prompt.

---

### 6. PANTRY INVENTORY

**Experience Score: 60/100**

**First Impression:** A list of ingredients. Tabs for Larder, Fridge, Freezer, Fruit. A Home section for Household and Pet. Clean but utilitarian.

**What Delights:**
- The "expand" chevron on each ingredient reveals nutrition knowledge inline. This is a hidden gem.
- The "Need" quantity feature (flagging an item as needing restocking) is useful for regular shopping.
- The "Send to Basket" multi-select with quantity is efficient once you understand it.

**What Confuses:**
- The Pantry is split: Food (Larder/Fridge/Freezer/Fruit) takes 2/3 of the screen on desktop. Home (Household/Pet) takes 1/3. On mobile, Home is hidden in a drawer triggered by... what? The user doesn't know about the drawer.
- The mobile Home section requires tapping the Pantry nav item twice (repeat-tap opens the Home drawer). This is a completely undiscoverable interaction pattern.
- The "expand" knowledge panel on ingredients appears behind a tiny chevron that many users will never tap. There is no hint text explaining that knowledge exists here.
- The MICRO_INSIGHTS text at the top ("A tiny nutritional reminder, changed daily") is tiny and italic. No user will read it.

**What Feels Unfinished:**
- No quantity tracking ("I have 200g of oats"). The "Need" field is one-directional — it tracks what you need, not what you have.
- No "running low" indicator or integration with the shopping list for auto-replenishment.
- No visual hierarchy between "staples I always have" and "items I should buy soon."

**Discoverability:** Average — it's in the nav, but what it does is unclear to new users.

**Launch Risk:** 🟡 Needs Polish

**Path To Green:**
- SUGGESTION: Add a tooltip or banner hint: "Tap ↓ next to any item to see why it matters for your health."
- SUGGESTION: Make the mobile Home drawer discoverable — add a "Home" tab button visible in the Pantry header rather than relying on repeat-tap.
- Effort: 1 prompt.

---

### 7. PANTRY EXPLORE V2 (PantryKnowledgeHub)

**Experience Score: 78/100**

**First Impression (if found):** Genuinely impressive. A food knowledge platform hidden inside a pantry page. Browse by category, search foods, get benefits, nutrients, varieties, discovery suggestions, alternatives, stories, seasonal content.

**What Delights:**
- The food detail view is the richest food knowledge UI I have seen in a consumer health app.
- Benefits displayed with category icons (Heart Health, Immune Support, Sleep, etc.) are immediately understandable.
- Varieties section (e.g., "Types of oats: rolled, steel-cut, instant...") is educational without being lecturing.
- Discovery suggestions ("Try making oat milk" / "Mix rolled oats with...") are concrete and actionable.
- Alternatives section is intelligently contextualised — shows goal-oriented options, not just generic swaps.
- Stories section reads warmly and personally. Not clinical. Not preachy.
- Seasonal Stories feel alive and timely.
- The "Explore Topics" section (browse by health benefit) is a genuinely engaging entry point.
- The "Your Household" section personalises the exploration to the user's dietary context.

**What Confuses:**
- It is inside Pantry → Explore mode. Most users never find it.
- The transition from Inventory to Explore is a toggle in the page header, not a separate nav item.
- The breadcrumb navigation inside PantryKnowledgeHub (Home → Food → Salmon → Alternatives) is good, but on mobile the back button is small and easily missed.
- "Your Household" section in Explore: it's unclear what this shows. The section heading alone doesn't tell users why these foods are relevant to their household.

**What Feels Unfinished:**
- The seasonal content has no date context. A user reading a "Summer produce" story has no confirmation that it's actually summer content.
- Stories are not dated or attributed. Who wrote these? Are they AI-generated or editorial? Trust is lower without attribution.
- The Explore home has "Recent Searches" — but it says nothing when there are no recent searches. A first-visit user sees an empty section where guidance could live.

**Discoverability:** Hidden — Poor.

**Launch Risk:** 🟡 Needs Polish (the feature is excellent; the discovery path is broken)

**Path To Green:**
- SUGGESTION: Add a "Food Knowledge Hub" card to the Dashboard that rotates a seasonal food daily. One tap enters Pantry Explore on that food's page.
- SUGGESTION: Add "Discover this ingredient" links from meal detail pages that open Pantry Explore for that ingredient.
- SUGGESTION: Add a "Seasonal this week" section to the Dashboard linking directly to Pantry Explore seasonal content.
- Effort: 2 prompts.

---

### 8. SHOPPING (Quick List / Shopping Workspace / Shopping List)

**Experience Score: 48/100**

**First Impression:** There are three shopping-related destinations in THA:
1. **Quick List** (/shopping-list / /list) — a manual shopping list
2. **Shopping List** (/basket / /analyse-basket) — the basket with THA product scores
3. **Shop** (/shopping-workspace?stage=shop) — a staged shopping flow (Prep → Shop → Done)

No user will understand how these relate to each other without being told.

**What Delights:**
- The Shopping List basket with THA health scores on each item is genuinely useful.
- The Analyser integration from the basket (scan items from the shop) is excellent.
- The Planner → Shopping List generation is the most powerful workflow in THA.
- The retailer price comparison feature (finding cheaper alternatives at different stores) is a premium differentiator.

**What Confuses:**
- Three separate "shopping" pages with overlapping purpose creates constant user confusion. A busy parent doesn't want to decide between them.
- The nav has "Quick List" as the first item. But "Quick List" is not what most users think of when they think "shopping list." The name undersells it.
- The Shopping Workspace has three stages (Prep, Shop, Done) but the stages are not explained. Why "Prep"? What do I prep?
- The basket score system (THA apple ratings) is used on the basket page, but the explanation for the rating is buried in a tooltip. A first-time user doesn't know that 3 apples = "average" vs "good."

**What Feels Unfinished:**
- No "previous shopping lists" or "this week vs last week comparison."
- No completion state — when you've shopped everything, there's no sense of accomplishment.
- The "Done" stage in Shopping Workspace doesn't return the user anywhere useful. It ends at a blank state.

**Discoverability:** Average for Quick List (it's first in nav). Poor for the relationship between the three shopping pages.

**Launch Risk:** 🔴 Launch Blocker (the naming and three-way split is confusing)

**Path To Green:**
- SUGGESTION: Rename the nav to a single "Shopping" item that opens a unified shopping hub — showing both the manual Quick List and the plan-generated list in one place.
- SUGGESTION: Add an onboarding tooltip or first-visit hint explaining: "Your meal plan generates your shopping list automatically. Add anything extra here."
- SUGGESTION: Add a completion screen in the Shopping Workspace "Done" stage.
- Effort: 2-3 prompts.

---

### 9. ANALYSER

**Experience Score: 72/100**

**First Impression:** A search bar with a camera scan option. You can search by product name or scan a barcode. Results show: NOVA group, THA health score, apple rating, ingredient breakdown, UPF indicators, additive flags.

**What Delights:**
- The barcode scanner is fast and gives immediate results.
- The NOVA group explanation (what is ultra-processed food?) is well-presented.
- "Simply Better Choices" (whole food alternatives) is a differentiator — showing what you could buy instead.
- The ingredient breakdown with UPF highlighting is visually clear.
- The history feature (recently scanned items) is useful on repeated use.

**What Confuses:**
- The Analyser is navigated to as "Analyser" in the nav, but the underlying URL is /analyser which loads /products. Minor URL inconsistency.
- The THA apple score (1-5 apples) is the primary health indicator, but its meaning is never explained inline. Users are left to infer: 5 apples = good? Or healthy? Or what exactly?
- The "WholeFoodAnalysisCard" component appears within the Analyser but shows below the fold. New users will often not scroll to it and miss the most actionable insight.
- The RestrictionSafetyPanel appears in the Analyser detail view but only shows household-level restriction info. For single users without a household set up, this panel shows nothing — creating blank space.

**What Feels Unfinished:**
- No "save to collection" from the Analyser. If you scan something interesting you can't bookmark it.
- No "worst products in my basket" summary after scanning multiple items.
- The "compare two products" use case is not supported.

**Discoverability:** Good — prominent in nav.

**Launch Risk:** 🟡 Needs Polish

**Path To Green:**
- SUGGESTION: Add inline explanation of the apple rating scale on every Analyser result page: "5 apples = minimally processed, whole food. 1 apple = ultra-processed."
- SUGGESTION: Elevate the "Simply Better Choices / Whole Food Alternative" card above the fold, before the detailed ingredient breakdown.
- Effort: 1 prompt.

---

### 10. DIARY

**Experience Score: 48/100**

**First Impression:** A day-by-day food log with meal slots (Breakfast, Lunch, Dinner, Snack, Drink). Shows health metrics: weight, mood, energy, sleep. Has a calendar to navigate days. Can import from the Planner.

**What Delights:**
- The "Import from Planner" feature collapses two workflows — if you planned it, log it automatically.
- The DayVarietySummary showing nutrition variety from the day's entries is clever.
- The health snapshot (BMI, calorie targets, weight trend chart) in the Diary gives it a wellness dimension.
- The "Stuck to plan" toggle is a simple habit-tracking insight.

**What Confuses:**
- The Diary and the Dashboard both offer weight logging, signal logging (mood, energy, sleep), and health tracking. Users don't know which is "official."
- The Diary has an embedded Profile panel (HealthSnapshot, GoalsPreferences, CalorieSettings). Why is the profile inside the diary? This is architecturally confusing to users.
- The Diary navigation is date-based (left/right arrows). New users don't understand that the Diary is historical — it looks like a blank form to fill in.
- There are too many sections on the Diary page: metrics form, planner import, custom metrics, health snapshot, calorie settings, goals. It reads as a cluttered settings page.

**What Feels Unfinished:**
- No weekly or monthly diary summary.
- No "what I ate this week" summary.
- The calorie tracking (if enabled) shows daily numbers but no progress towards a target in a visual way.
- The "Export diary" feature exists but is a raw data export, not a readable report.

**Discoverability:** Average — it's "My Diary" in the nav.

**Launch Risk:** 🟡 Needs Polish

**Path To Green:**
- SUGGESTION: Remove the embedded Profile components from the Diary page. They belong in Profile.
- SUGGESTION: Add a "This week" summary tab to the Diary showing patterns across 7 days.
- SUGGESTION: Clarify Dashboard vs Diary role: Dashboard = today's snapshot. Diary = historical record. Make this distinction explicit to users.
- Effort: 2 prompts.

---

### 11. PROFILE

**Experience Score: 65/100**

**First Impression:** A settings-heavy page. Avatar, display name, health metrics, dietary preferences, household members, notification preferences. Comprehensive but dense.

**What Delights:**
- The health calculation (BMI, estimated daily calories from height/weight/activity) is a nice personalisation touch.
- Dietary restrictions are comprehensive and well-organised (diet patterns, allergies/intolerances).
- Household eater management is functional and well-structured.

**What Confuses:**
- The Profile page is used for both personal settings AND household management. These are different mental models — "my preferences" vs "my family's needs." They should be separated.
- The measurement preference (metric/imperial) is buried at the bottom of the page.
- The "store preferences" section (preferred retailer) is in Profile, but it affects the Shopping List and Analyser. Users won't know to look here when something behaves unexpectedly.
- Custom metric definitions (for the Diary) live inside Profile but most users will never know they can add custom tracking metrics.

**What Feels Unfinished:**
- No profile completion indicator. A user doesn't know if they've set up everything that would make THA work well for them.
- No onboarding reminder for items they skipped ("You haven't added household members yet — this improves meal suggestions").

**Discoverability:** Good — in top bar.

**Launch Risk:** 🟡 Needs Polish

**Path To Green:**
- SUGGESTION: Split Profile into "My Profile" (personal data, health, preferences) and "My Household" (separate nav item or prominent card on Dashboard).
- SUGGESTION: Add a profile completion progress bar ("Your profile is 60% complete — add household members to improve suggestions").
- Effort: 2 prompts.

---

### 12. HOUSEHOLD MANAGEMENT

**Experience Score: 58/100**

**First Impression:** Found inside Profile → scroll down → Household section. Add eaters (adults, children, babies). Set dietary restrictions per person. Works well once found.

**What Delights:**
- The per-eater dietary restriction system is powerful and genuinely useful for mixed households.
- Child vs adult distinction affects meal compatibility calculations.
- The guest eater concept (someone temporarily with different needs) is thoughtful.

**What Confuses:**
- It is buried 3+ scrolls into Profile. For families, this is the most important setup step — and it's the hardest to find.
- The "Eater" label is slightly clinical. Most families would say "Add family member" not "Add eater."
- The difference between a "Household eater" and a "Guest eater" is not explained.

**What Feels Unfinished:**
- No "household dashboard" — a view showing all family members, their restrictions, and how this week's meals suit each person.
- Household members have no names in some contexts — they appear as "Child 1" or "Eater 2."

**Discoverability:** Poor — 3+ scrolls deep in Profile.

**Launch Risk:** 🔴 Launch Blocker (for family users — this is their primary value prop)

**Path To Green:**
- SUGGESTION: Add "Set up your household" as a prominent onboarding step or a persistent Dashboard card for users who haven't added household members.
- SUGGESTION: Add "Household" as a direct nav item or Dashboard shortcut, not buried in Profile.
- Effort: 1-2 prompts.

---

### 13. DIETARY RESTRICTIONS

**Experience Score: 70/100**

**First Impression:** Accessible via Profile and during onboarding. Covers diet patterns (Vegan, Vegetarian, Keto, etc.), allergies and intolerances (Gluten, Dairy, Nuts, etc.), and eating schedules. Well structured.

**What Delights:**
- The info tooltip on each diet option (what is keto?) adds trust and clarity.
- The allergy/intolerance distinction is correct and matters for safety.
- Restrictions propagate through the whole system — Planner, Smart Planner, Analyser all respect them.

**What Confuses:**
- "Diet Pattern" vs "Diet Restrictions" — the naming is slightly technical. Users might expect a single "Dietary needs" section.
- Setting restrictions only in Profile (and not as a first-run step) means users may forget to set them and wonder why THA is suggesting incompatible meals.

**What Feels Unfinished:**
- No "restriction audit" — a way to see which of your planned meals this week are compliant vs not compliant with restrictions.

**Discoverability:** Average — inside Profile.

**Launch Risk:** 🟢 Ready (the feature is solid)

**Path To Green:**
- SUGGESTION: Add a dietary restrictions widget to the Dashboard for users who haven't set restrictions yet.
- Effort: 1 prompt.

---

### 14. NUTRITION BOOST / SIMPLY BETTER CHOICES

**Experience Score: 65/100**

**First Impression:** Appears as a panel on meal detail pages. Shows ingredient-level improvements ("swap white rice for brown rice") with nutritional context.

**What Delights:**
- The suggestions are specific and credible — not generic "eat more vegetables" advice.
- The provenance display (which ingredients are driving the suggestion) is transparent.
- Household-aware suggestions ("suitable for your household's dietary needs") add contextual trust.

**What Confuses:**
- "Nutrition Boost" and "Simply Better Choices" appear to be the same feature under different branding. The rename history is visible in the codebase (SIMPLY_BETTER_CHOICES_RENAME.md exists in investigations). Users see an inconsistency.
- The panel appears collapsed by default. A new user may never expand it.
- The suggestion to "add more [ingredient]" without explaining the specific benefit misses the "why" that makes it actionable.

**What Feels Unfinished:**
- No summary of "how many meals this week have Boosts/Better Choices available" — a whole-week view would increase engagement.

**Discoverability:** Average — present on meal detail but collapsed by default.

**Launch Risk:** 🟡 Needs Polish

**Path To Green:**
- SUGGESTION: Ensure consistent naming — choose either "Nutrition Boost" or "Simply Better Choices" and use it everywhere.
- SUGGESTION: Auto-expand the panel when a meal has high-value suggestions.
- Effort: 1 prompt.

---

### 15. FOOD REPORTS

**Experience Score: 72/100**

**First Impression:** Accessible from within Pantry Explore (food detail page). Shows a food's history, nutritional profile, benefits, and context.

**What Delights:**
- The food report for common ingredients (salmon, oats, broccoli) is genuinely educational.
- Nutrient listings are specific and credible.
- The "storage guidance" and "seasonality" information is practical, not just nutritional.

**What Confuses:**
- "Food Reports" is not a named feature in the nav. Users reach it via Pantry Explore. There is no way to say "show me the food report for X" without going through Pantry Explore first.
- Not all foods have full reports. For less common foods, the report may be sparse or absent. Users don't know in advance what they'll find.

**Discoverability:** Poor — requires Pantry Explore → Food → Report flow.

**Launch Risk:** 🟡 Needs Polish

**Path To Green:**
- SUGGESTION: Add "Learn about this ingredient" links from meal detail pages and ingredient lists that deep-link to the Food Report.
- Effort: 1 prompt.

---

### 16. PLANT DIVERSITY REPORT

**Experience Score: 75/100**

**First Impression:** A nutrition report showing plant variety across the week's planned meals. Categories (grains, legumes, vegetables, fruits, nuts, seeds, herbs, fungi, etc.) with counts.

**What Delights:**
- The category breakdown is genuinely illuminating. Most users have never thought about fungi and seaweeds as a separate diversity category.
- The counter (18 plants this week) is an engaging, gamified metric.
- The suggestion system ("add more legumes to improve variety") is specific.

**What Confuses:**
- Accessed only from the Planner — means it's invisible to users who don't use the Planner.
- The report title changed from "30 Plants This Week" to "Nutrition Report" — the URL is /plant-diversity, the page says "Nutrition Report." Slight inconsistency.
- The "back to your week" link goes back to the Planner. There's no link to Pantry Explore for discovery of the missing plants.

**What Feels Unfinished:**
- No historical comparison ("last week you had 14 plants, this week 18 — improving!").
- No sharing. The plant diversity score would be highly shareable social content.

**Discoverability:** Average — accessible from Planner only, not from main nav.

**Launch Risk:** 🟡 Needs Polish

**Path To Green:**
- SUGGESTION: Add a plant diversity counter to the Dashboard (not just the Planner) with a "View report" link.
- SUGGESTION: From the Plant Diversity Report, add "Discover [missing plant category]" links that open Pantry Explore filtered to that category.
- Effort: 1-2 prompts.

---

### 17. DISCOVERY

**Experience Score: 80/100**

**First Impression (if found):** Within Pantry Explore, on a food's detail page. Shows 4-6 types of discovery suggestions: "Try this differently," "Try this with," "Explore further," "Seasonal opportunity," etc.

**What Delights:**
- The discovery suggestions are intelligent and specific to the food in context.
- The reason text ("oats are versatile — try them as a savoury dish") is engaging and non-preachy.
- Discovery suggestions are different from Alternatives — they expand what you can do with a food, not replace it.
- The engine is aware of household context and season.

**What Confuses:**
- The distinction between "Discovery" and "Alternatives" within Pantry Explore is not clear to most users. Both appear on the food detail page.
- Discovery is not surfaced anywhere outside Pantry Explore.

**What Feels Unfinished:**
- No "save this discovery" or "add to my list" from a discovery suggestion.

**Discoverability:** Hidden — requires Pantry Explore.

**Launch Risk:** 🟡 Needs Polish (feature is excellent; discovery path broken)

**Path To Green:**
- SUGGESTION: Surface one "Discovery of the day" on the Dashboard, rotating daily.
- SUGGESTION: Add a "What could I do with [ingredient]?" entry point from the Cookbook and Pantry Inventory.
- Effort: 1-2 prompts.

---

### 18. ALTERNATIVES

**Experience Score: 76/100**

**First Impression (if found):** Within Pantry Explore, below Discovery on a food's detail page. Shows goal-oriented alternatives: cheaper option, seasonal substitute, nutrition upgrade, household-compatible version, etc.

**What Delights:**
- The goal-orientation is excellent ("if you want to spend less," "if you want more protein," etc.).
- The household suitability tags ("suitable for your household") are trust-building.
- The variety of alternative types (not just "similar foods" but goal-driven options) is sophisticated.

**What Confuses:**
- Alternatives appear below Discovery, which appears below Benefits, Nutrients, Varieties. By the time users reach Alternatives, they may have scrolled through 200px of content.
- No "add this alternative to my shopping list" direct action from the Alternatives panel.

**Discoverability:** Hidden — deep in Pantry Explore food detail view.

**Launch Risk:** 🟡 Needs Polish

**Path To Green:**
- SUGGESTION: Surface "Alternatives" contextually in the Analyser — when a user scans a product with a low THA score, show food alternatives from the Alternatives engine.
- Effort: 1 prompt.

---

### 19. STORIES

**Experience Score: 74/100**

**First Impression (if found):** Within Pantry Explore, on a food's detail page. A narrative section with headline + bullet facts. Warm, human, not clinical.

**What Delights:**
- The story cards are genuinely readable. They don't feel AI-generated (even if they are). They feel like something a knowledgeable friend would tell you.
- The Household Stories type is distinctive — tells the story of how this food fits a family context.
- Multiple story types (cultural, practical, science, seasonal) give variety.

**What Confuses:**
- Stories are a section within a food detail page. They are not surfaced as a "feed" or browsable collection.
- There is no way to read all stories without browsing food by food.
- The stories have no author attribution or timestamp. Trust is reduced.

**What Feels Unfinished:**
- No "Story of the day" — a single rotating story surface on the Dashboard or landing area.
- No way to share a story.

**Discoverability:** Hidden — inside Pantry Explore food detail.

**Launch Risk:** 🟡 Needs Polish

**Path To Green:**
- SUGGESTION: Add "Story of the day" as a card on the Dashboard.
- SUGGESTION: Add a "Stories" collection page within Pantry Explore where all recent stories are shown as a feed.
- Effort: 2 prompts.

---

### 20. SEASONAL STORIES

**Experience Score: 78/100**

**First Impression (if found):** Within Pantry Explore. Shows seasonal arcs — foods that are in season now, what to look forward to next, what to watch for. The content is timely and grounded.

**What Delights:**
- The "looking ahead" feature (what's coming next season) is genuinely useful for meal planning.
- The seasonal arc structure (now / coming soon / worth noting) creates narrative tension.
- Connecting seasonal produce to health outcomes is specific and credible.
- The trust guard prevents the engine from surfacing content outside its confidence window.

**What Confuses:**
- Seasonal Stories are inside Pantry Explore → Home → "This Season" section. It takes 3-4 taps to reach from the main nav.
- The seasonal content doesn't say which hemisphere it's targeting. For a UK-based app this is likely correct (northern hemisphere summer in June), but international users would be confused.
- The seasonal label ("Summer 2026") is not always visible on the story cards themselves.

**What Feels Unfinished:**
- No seasonal landing page. The best seasonal content in THA is buried 4 taps deep.
- No email or push notification for "Summer seasonal content is now available."

**Discoverability:** Very Poor — deepest feature in the product.

**Launch Risk:** 🟡 Needs Polish

**Path To Green:**
- SUGGESTION: Add a "What's in season now" card to the Dashboard, linking to Pantry Explore seasonal content.
- SUGGESTION: Create a dedicated seasonal landing page accessible from the main nav or Dashboard — even just a banner with "🌞 Summer — What's in season?" that links to the seasonal section of Pantry Explore.
- Effort: 1-2 prompts.

---

## WHOLE JOURNEY REVIEW

---

### WEEK 1 — Sign Up, First Meal, First Plan

**Delight:** The orchard visual, the warm onboarding tone, the apple progress indicator.

**Confusion:** Why 12 onboarding steps. Why medical metrics before any value. Why is the app empty when I first arrive.

**Drop-off risk:** HIGH — specifically between onboarding steps 5-8 (medical questions, style, choices). A user who just wants to eat better doesn't understand why THA needs their height, weight, activity level, blood pressure tracking preferences before they've seen anything useful.

**Wow moments:** None in week 1 for most users. The first wow moment is usually the Analyser result — seeing that a "healthy" product has 22 ingredients. But this requires finding the Analyser.

**Recommendation:** SUGGESTION: Compress onboarding to 6 steps: Name → Dietary needs → Allergies → Goals → Household → Choose your starting feature. Move health metrics to post-onboarding "complete your profile" prompts.

---

### WEEK 2 — Import Meals, Try Smart Planner, Use Analyser

**Delight:** Smart Planner generates a week. Shopping list generates from the plan. These are genuine time-savers.

**Confusion:** "What's Simply Better Choices?" "What's a Nutrition Boost?" "What's the difference between Quick List and Shopping List?"

**Drop-off risk:** MEDIUM — users who haven't found the Analyser or Smart Planner yet may feel THA is just a recipe organiser. If they only use Cookbook and don't plan, the value proposition is unclear.

**Wow moments:** For the user who tries Smart Planner: immediate delight. For the user who scans their first ultra-processed product: genuine revelation.

---

### WEEK 3 — Pantry Explore, Discover Foods, Use Reports

**Delight:** The PantryKnowledgeHub. If a user finds it, it's the most engaging content in the app.

**Confusion:** How to get to Pantry Explore. The two-mode toggle in the Pantry header is not obvious.

**Drop-off risk:** MEDIUM — week 3 is where users either develop a routine (Planner + Shopping) or drift away because no new feature has been revealed.

**Wow moments:** Finding the Pantry Explore for the first time. Reading a story about a food they thought they knew. Discovering seasonal alternatives.

---

### WEEK 4 — Household Restrictions, Meal Adaptation

**Delight:** The household compatibility system working correctly — seeing per-person fit on meal cards.

**Confusion:** For users who haven't set up a household, week 4 is unchanged from week 3. There's no prompt to set up household management.

**Drop-off risk:** LOW for users who have household members set up. HIGH for users who set up THA as a "solo" user and haven't explored household features.

**Wow moments:** Seeing "Finn can eat this with one adaptation" on a complex meal. The system knowing more than the user expected.

---

### WEEK 5 — Routine Shopping, Planning, Cooking

**Delight:** The rhythm is established. Plan on Sunday, generate shopping list, shop on Tuesday, cook through the week.

**Confusion:** The "cooking" part of THA is missing. There is no step-by-step recipe mode. No "start cooking" flow. No ingredient check-off.

**Drop-off risk:** LOW for established users. The routine is valuable enough to sustain.

**Wow moments:** Fewer new discoveries. The product needs to surface new content to keep Week 5 engaging.

---

### WEEK 6 — Return to Pantry, View Discoveries, Stories, Seasonal Content

**Delight:** If a user has been building their Pantry and exploring, week 6 has seasonal content, stories, and new discovery suggestions based on what they've logged.

**Confusion:** None of this is surfaced proactively. The user must navigate to Pantry Explore to see it.

**Drop-off risk:** MEDIUM — without push/email engagement hooks, returning to THA in week 6 requires active motivation. The product has nothing to pull the user back.

**Wow moments:** The seasonal story for summer. The "Your Household" section showing personalised food guidance.

---

## THE "WOULD THEY PAY?" TEST

| Feature | Increases Retention? | Increases Trust? | Increases Referrals? | Justifies Premium? |
|---|---|---|---|---|
| Dashboard | LOW | LOW | NO | NO |
| Cookbook | MEDIUM | LOW | NO | NO |
| Meal Detail | MEDIUM | HIGH | NO | YES (adaptations) |
| Planner | HIGH | MEDIUM | YES | YES |
| Smart Planner | HIGH | HIGH | YES | YES |
| Pantry Inventory | LOW | LOW | NO | NO |
| Pantry Explore V2 | HIGH | HIGH | YES | YES |
| Shopping List | HIGH | MEDIUM | YES | YES |
| Analyser | HIGH | HIGH | YES | YES |
| Diary | LOW | LOW | NO | NO |
| Profile | MEDIUM | MEDIUM | NO | NO |
| Household | HIGH | HIGH | YES | YES |
| Plant Diversity | MEDIUM | HIGH | YES | YES |
| Discovery | HIGH | HIGH | YES | YES |
| Alternatives | MEDIUM | HIGH | NO | YES |
| Stories | MEDIUM | MEDIUM | YES | YES |
| Seasonal Stories | MEDIUM | HIGH | YES | YES |

**Features that justify premium:** Planner, Smart Planner, Pantry Explore, Analyser, Household, Plant Diversity, Discovery, Stories, Seasonal Stories.

**Problem:** 8 of these 9 premium-justifying features are either hidden (Pantry Explore, Discovery, Stories, Seasonal) or require significant setup before delivering value (Household, Plant Diversity).

---

## THE "WOULD THEY TELL A FRIEND?" TEST

| Area | Would they say "You should try this"? | Why / Why not |
|---|---|---|
| Dashboard | NO | Nothing surprising. Looks like every health app dashboard. |
| Cookbook | NO | Every app has a recipe organiser. |
| Planner | MAYBE | Smart Planner is the differentiator. If they find it: yes. |
| Analyser | YES | Scanning a product and seeing "22 ingredients, 14 UPF" is genuinely revelatory. |
| Pantry Explore | YES | If found. "There's this food knowledge section that's incredible" — but they have to find it first. |
| Shopping | MAYBE | Plan → shop generation is genuinely good. The split confuses the story. |
| Household | YES | For family users. "It knows which meals work for every person in my family." |
| Stories | YES | If found. "It tells you stories about food — like why seasonal salmon tastes different." |
| Seasonal Stories | YES | If found. "It tells you what's in season right now and why it matters." |
| Plant Diversity | MAYBE | Niche. Health-conscious users yes. Mainstream families maybe. |
| Discovery | YES | If found. "It suggests things to try with foods you already know." |

**Referral bottleneck:** THA's most shareable features are its least discoverable. A user who describes THA to a friend based only on the visible surface would say "it's a meal planner with a barcode scanner." That is accurate but not compelling. The compelling description requires having found Pantry Explore.

---

## THE "REMOVE IT" TEST

| Page | If removed tomorrow: Would anyone care? |
|---|---|
| Dashboard | MAYBE. It's a starting point but not a destination. If removed, most users would just start at Cookbook or Planner. |
| Cookbook | YES. Core data store. Cannot be removed. |
| Meal Detail | YES. Core viewing experience. |
| Planner | YES. Most-used feature. Removing it would end THA for most households. |
| Smart Planner | YES. Differentiator. Would be missed immediately. |
| Pantry Inventory | MAYBE. Useful as a list, but the "send to basket" feature is the real value. Could be merged into Shopping. |
| Pantry Explore | YES (for users who've found it). NO (for users who haven't). This asymmetry is the problem. |
| Quick List | MAYBE. Overlaps with Shopping List. |
| Shopping List | YES. Core workflow. |
| Shopping Workspace | MAYBE. The staged flow is useful but not unique. |
| Analyser | YES. Core differentiator. |
| Diary | MAYBE. Overlaps with Dashboard signals. Most users would not notice. |
| Profile | YES (settings needed). But most of it could live elsewhere. |
| Household Management | YES for family users. |
| Plant Diversity | MAYBE. Niche but memorable. |
| Discovery | YES (for users who've found it). Most users haven't. |
| Alternatives | YES (for health-conscious users). |
| Stories | MAYBE. Delightful but not load-bearing. |
| Seasonal Stories | MAYBE. Uniquely delightful. |

---

## PRODUCT COHERENCE

### Does THA feel like one product or several products connected together?

Honestly: **several products connected together, with one being much better than the others.**

The product families are:

**Product A: Meal Planning Suite** (Cookbook + Planner + Smart Planner + Shopping)
> Works together coherently. Clear value loop: save meals → plan meals → generate shopping list → shop. Navigation is logical. This is the "visible" THA.

**Product B: Food Intelligence Platform** (Pantry Explore + Discovery + Alternatives + Stories + Seasonal + Plant Diversity + Analyser)
> Extraordinary depth. Largely invisible. Disconnected from Product A in the user's journey. This is the "hidden" THA.

**Product C: Health Tracking Dashboard** (Dashboard + Diary + Profile signals)
> Feels like a third product that was added later. The signals (blood pressure, blood sugar, BPM) suggest a health monitoring app. The Diary feels like a separate lifestyle app. These features don't connect cleanly to Product A or Product B.

### Connection analysis:

| Connection | Quality |
|---|---|
| Dashboard ↔ Planner | WEAK. Dashboard shows a bar chart of the week but doesn't link to individual days. |
| Planner ↔ Shopping | STRONG. The "send to shopping list" flow works well. |
| Planner ↔ Pantry | MISSING. There is no connection between what's in your pantry and what you plan. |
| Pantry ↔ Food Pages | WEAK. The Pantry Inventory and PantryKnowledgeHub are modes of the same page but feel disconnected. |
| Analyser ↔ Shopping | WEAK. The Analyser lives inside the Shopping List page but is not highlighted as the primary value of going shopping. |
| Cookbook ↔ Planner | STRONG. Adding meals to the plan from the Cookbook works. |
| Stories ↔ Pantry | CONNECTED (inside Explore) but the connection isn't surfaced. |
| Discovery ↔ Pantry | CONNECTED (inside Explore) but the connection isn't surfaced. |
| Alternatives ↔ Planner | MISSING. There is no "find an alternative for this meal ingredient" path from the Planner. |

### Duplicated journeys:
- Weight logging: Dashboard AND Diary
- Signal logging (mood/energy/sleep): Dashboard AND Diary
- Viewing meal/food health information: Analyser AND Pantry Explore (no clear which to use when)
- Shopping: Quick List AND Shopping List AND Shopping Workspace (no clear primary)

### Hidden features:
- Pantry Explore (hidden in Pantry modes)
- Discovery (hidden in Pantry Explore)
- Alternatives (hidden in Pantry Explore)
- Stories (hidden in Pantry Explore)
- Seasonal Stories (hidden in Pantry Explore)
- Household Management (hidden in Profile)
- Plant Diversity Report (hidden in Planner)
- Smart Planner (hidden in Planner header icon)

---

## EMOTIONAL AUDIT

### Pages that create CONFIDENCE:
1. Analyser — after scanning, users feel informed and in control
2. Planner with Household Compatibility — "I know this week works for everyone"
3. Smart Planner result — "I have a week planned in 4 minutes"
4. Pantry Explore food page — "I understand this food now"

### Pages that create CURIOSITY:
1. Pantry Explore — genuinely draws users deeper
2. Discovery section — "what else can I do with this?"
3. Seasonal Stories — "what's in season that I'm missing?"
4. Alternatives — "I didn't know there was a better version of this"

### Pages that create DELIGHT:
1. Smart Planner — instant, accurate, household-aware
2. Seasonal Stories — warm, timely, personal
3. Stories section — human, readable, not preachy
4. Meal card with household fit indicators — feeling understood

### Pages that create TRUST:
1. Analyser — ingredient transparency
2. Household Compatibility system — restrictions enforced
3. Simply Better Choices — specific, not generic
4. Plant Diversity Report — credible nutritional framing

### Pages that create FRUSTRATION:
1. Onboarding (12 steps) — length vs. value delivered
2. Shopping (three overlapping pages) — confusion about which to use
3. Dashboard (empty states) — "what is this for?"
4. Diary (Medical density) — "is this a health tracker or a food app?"

### Pages that create OVERWHELM:
1. Meal detail page (information density on mobile)
2. Planner meal card (chips, indicators, boosts)
3. Diary (too many sections in one place)

### Pages that create CONFUSION:
1. Pantry (two modes, mobile drawer, Home section hidden)
2. Shopping (three destinations)
3. Dashboard + Diary duplication
4. Nutrition Boost vs Simply Better Choices branding

### Ranking (most positive to most negative):
1. Pantry Explore V2 — CURIOSITY + DELIGHT + TRUST
2. Smart Planner — CONFIDENCE + DELIGHT
3. Analyser — CONFIDENCE + TRUST
4. Planner — CONFIDENCE (when working well)
5. Household Compatibility — TRUST + DELIGHT
6. Cookbook — NEUTRAL (functional)
7. Dashboard — FRUSTRATION (empty state) → NEUTRAL (with data)
8. Shopping — CONFUSION
9. Diary — OVERWHELM + CONFUSION
10. Onboarding (12 steps) — FRUSTRATION

---

## TOP 20 ISSUES

| # | Issue | Why It Matters | User Impact | Effort | Launch Blocker? |
|---|---|---|---|---|---|
| 1 | 12-step onboarding with medical metrics before value delivery | First impressions define retention. Medical questions before any value = abandonment. | All new users | Medium | YES |
| 2 | Shopping has 3 destinations (Quick List, Shopping List/Basket, Shopping Workspace) with overlapping purpose | Users cannot choose the right tool. This is the most confusing navigation decision in THA. | All users who shop | Low | YES |
| 3 | Household Management buried 3+ scrolls inside Profile | For family users this is the core value proposition. They won't find it. | Family users | Low | YES |
| 4 | Pantry Explore (Discovery, Stories, Alternatives, Seasonal) hidden behind Pantry → Explore mode toggle | THA's best features are invisible to most users | All users | Low | YES |
| 5 | Dashboard is empty and directionless for new users | The daily return point is uninspiring. Users won't build a habit. | All users | Medium | YES |
| 6 | Smart Planner entry point is an icon in the Planner header | THA's most impressive automation is hidden. | Planner users | Low | NO |
| 7 | No "copy last week's plan" in the Planner | Most-wanted family feature. Routine households do the same meals weekly. | Family users | Low | NO |
| 8 | Plant Diversity Report accessible only from Planner | A shareable, engaging feature hidden behind a nav requirement. | Health-conscious users | Low | NO |
| 9 | Dashboard and Diary both offer weight/signal logging with no clear canonical source | Duplicate workflows erode trust. Users don't know where data "really" goes. | All users | Low | NO |
| 10 | No "what's in season" surface on the Dashboard or main nav | Seasonal Stories is THA's most timely content. It has no entry point on launch day. | All users | Low | NO |
| 11 | THA apple score rating is used everywhere but never explained inline | The primary health metric is unexplained. Users can't trust what they don't understand. | All users | Low | YES |
| 12 | No post-cooking feedback loop (no "I cooked this" → Diary auto-log) | The plan → cook → diary loop is broken. Friction reduces diary engagement. | Planner users | Medium | NO |
| 13 | Nutrition Boost and Simply Better Choices use inconsistent branding | Trust requires consistency. Seeing different names for the same feature is confusing. | All meal detail users | Low | YES |
| 14 | Mobile Home drawer in Pantry requires repeat-tap navigation — completely undiscoverable | The Home section of the Pantry is invisible on mobile. | Mobile users | Low | NO |
| 15 | No "Welcome back" state for returning users (no seasonal hook, no re-engagement prompt) | Returning users who find an empty Dashboard may not return again. | Returning users | Medium | NO |
| 16 | Diary contains embedded Profile panels (Health Snapshot, Calorie Settings) | The Diary feels like a cluttered settings page. | Diary users | Medium | NO |
| 17 | No "similar meals" or "you might also like" in Cookbook or meal detail | Discovery of the meal library is random. Users find only meals they add. | Cookbook users | Medium | NO |
| 18 | No step-by-step cooking mode from meal detail | THA plans meals but doesn't help cook them. The loop is incomplete. | Planner users | High | NO |
| 19 | Seasonal content doesn't show hemisphere or region confirmation | International users will not trust the seasonal guidance without confirmation. | International users | Low | NO |
| 20 | No sharing / social proof anywhere in the product | THA's best features could be viral. Nothing is shareable. | All users | High | NO |

---

## TOP 10 FIXES BEFORE LAUNCH

**If this were my company launching in 30 days, these are the 10 changes I would insist on:**

---

**1. Fix the Onboarding (Most important)**

Cut from 12 steps to 6. Remove medical metrics (height, weight, activity level) from onboarding — defer to Profile completion. Steps: Welcome → Dietary needs → Allergies → Goals → Household → Start.

*Why:* Every user who abandons onboarding is gone. This is the highest-priority fix in the product.

*Estimated effort:* 2 prompts.

---

**2. Consolidate the Shopping Experience**

Unify Quick List, Shopping List, and Shopping Workspace under a single "Shopping" nav item. The primary view should be the plan-generated list (Shopping List). The manual add (Quick List) should be a secondary mode. The Shopping Workspace stages should be prominent within the unified view.

*Why:* Three overlapping destinations is the #1 navigation confusion point.

*Estimated effort:* 3 prompts.

---

**3. Surface Household Management Earlier**

Add "Set up your household" as a persistent card on the Dashboard for users who have never added household members. Remove the requirement to scroll through Profile to find it.

*Why:* Household compatibility is THA's strongest family differentiator. It is currently invisible.

*Estimated effort:* 1 prompt.

---

**4. Make Pantry Explore Discoverable**

Add a "Food Knowledge Hub" entry point to the Dashboard — a rotating seasonal food card (updated daily) that, when tapped, opens Pantry Explore on that food's page. Add "Learn about this ingredient" links from meal detail pages.

*Why:* THA's best features live here. Currently only users who explore the Pantry by accident find this.

*Estimated effort:* 2 prompts.

---

**5. Explain the Apple Rating Score**

Add a persistent, inline explanation of the THA apple rating (1-5) on every page where it appears: "5 apples = whole food, minimally processed. 1 apple = ultra-processed." One tooltip or legend, everywhere.

*Why:* The primary health metric is unexplained. This is a trust issue.

*Estimated effort:* 1 prompt.

---

**6. Make Smart Planner Discoverable**

When a user's Planner week is empty, show a full-width CTA: "Let THA plan your week — tell us what you like and we'll build a household-compatible meal plan in seconds." This replaces the current empty week state.

*Why:* Smart Planner is THA's most impressive feature. An icon in the header is not enough.

*Estimated effort:* 1 prompt.

---

**7. Add Seasonal Content Entry Point**

Add a "What's in season" card to the Dashboard that changes by month. Single tap opens the Seasonal Stories section of Pantry Explore. This gives Seasonal Stories an entry point and makes the Dashboard feel alive.

*Why:* Seasonal content is timely, shareable, and differentiating. It currently has no permanent entry point.

*Estimated effort:* 1 prompt.

---

**8. Unify Nutrition Boost / Simply Better Choices Naming**

Pick one name. Apply it everywhere. Remove the other. Ensure the panel is auto-expanded when high-quality suggestions exist.

*Why:* Brand consistency is trust. Two names for the same feature breaks trust.

*Estimated effort:* 1 prompt.

---

**9. Fix the Dashboard Empty State**

Replace the current empty Dashboard (for new users with no data) with a guided "first week" checklist:
- Add 3 meals to your Cookbook ✓
- Plan your first week ✓
- Generate your shopping list ✓
- Scan a product ✓

*Why:* The Dashboard is the first thing most users see after onboarding. It must give direction.

*Estimated effort:* 1 prompt.

---

**10. Add Plant Diversity Counter to Dashboard**

Show this week's plant diversity score on the Dashboard alongside the other 4 stat cards. Tapping it opens the Plant Diversity Report.

*Why:* The plant diversity score is THA's most differentiating health metric. It should be front-and-centre.

*Estimated effort:* 1 prompt.

---

## FINAL SCORECARD

```text
THA Experience Readiness
═══════════════════════════════════════════════════════════

Overall Experience Score:        62 / 100

Overall Launch Risk:              🔴 NOT READY — significant
                                  navigation and discoverability
                                  issues would harm retention

═══════════════════════════════════════════════════════════

Most Delightful Areas (ranked):
  1. Pantry Explore V2 (Discovery, Stories, Seasonal)   78/100
  2. Smart Planner                                       68/100
  3. Analyser                                            72/100
  4. Household Compatibility                             (in Planner/Meal Detail)
  5. Plant Diversity Report                              75/100
  6. Alternatives Engine                                 76/100
  7. Seasonal Stories                                    78/100

Weakest Areas (ranked):
  1. Shopping (three overlapping destinations)           48/100
  2. Diary (cluttered, duplicates Dashboard)             48/100
  3. Dashboard (empty, directionless)                    52/100
  4. Pantry Inventory (utility without delight)          60/100
  5. Household Management (buried)                       58/100

Launch Blockers (by user impact):
  🔴 Onboarding — 12 steps with medical metrics
  🔴 Shopping — 3 overlapping destinations
  🔴 Household Management — buried in Profile
  🔴 Apple rating — unexplained primary metric
  🔴 Pantry Explore — THA's best features are invisible
  🔴 Dashboard — empty and directionless for new users
  🔴 Nutrition Boost / Simply Better Choices — inconsistent branding

Estimated Prompts to Green:       14-18 prompts
Estimated Time to Green:          3-5 weeks focused sprint

═══════════════════════════════════════════════════════════
```

---

## FINAL QUESTION

> Would you personally launch THA in its current state?

**Answer: C. No.**

**Why:**

THA has built something genuinely remarkable: a food intelligence platform with real household awareness, intelligent discovery, warm editorial stories, seasonal guidance, ultra-processed food analysis, and sophisticated meal planning. This is a serious product with serious depth.

But what real households see on their first visit — and for the first 2-3 weeks — is a competent but unremarkable meal planner with a barcode scanner.

The gap between what THA is and what it appears to be is fatal for consumer launch. The features that would generate referrals, justify premium subscription, and create genuine retention are hidden behind navigation paths that the majority of users will never discover through normal use.

The highest-value features in THA — Pantry Explore V2, Discovery, Stories, Seasonal Stories, Smart Planner, Household Compatibility — require either:
(a) the user to already know they exist, or
(b) the user to accidentally explore the right pages in the right order.

Neither is a viable go-to-market strategy.

The 10 fixes above would not require rewriting the product. They would require routing, surfacing, and naming fixes. They are achievable in 3-5 weeks. They would transform the launch experience from "meh, it's a meal planner" to "this is unlike anything I've seen before."

Launch after those fixes. Not before.

---

*This is an investigation document. All items listed are SUGGESTIONS. No implementation, fixes, refactors, or schema changes were made during this audit.*

*File location: docs/investigations/platform/THA_6_WEEK_FAMILY_EXPERIENCE_AUDIT.md*
*Rollback tag: rollback/pre-6week-experience-audit-20260623*
