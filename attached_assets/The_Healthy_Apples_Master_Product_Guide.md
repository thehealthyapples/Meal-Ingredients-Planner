# The Healthy Apples — Master Product Guide

**Version:** May 2026  
**Purpose:** Complete plain-English reference for non-technical readers — founders, support staff, content writers, and future team members.  
**Status:** Based on a full read of the production codebase. Nothing has been changed.

---

## TABLE OF CONTENTS

1. Executive Summary  
2. Complete UI Map  
3. End-to-End User Flows  
4. How the App Works Behind the Scenes  
5. Key Technical Details for Non-Coders  
6. Known Limitations and Risks  
7. Common User Questions / How-To Starters  
8. Support / Troubleshooting Guide  
9. What Is Unclear from Code  

---

## 1. EXECUTIVE SUMMARY

### What the App Is

The Healthy Apples (THA) is a UK-focused web application that helps people eat more healthily without counting calories or feeling pressured. It combines four ideas into one tool:

- A **recipe library and meal planner** to organise what you cook each week
- A **shopping assistant** that turns your meal plan into a grocery list and estimates real prices
- A **food quality analyser** that rates how processed your food is (the "Apple Rating")
- A **personal diary** to track how you feel day to day alongside what you eat

The app is built around the concept of Ultra-Processed Foods (UPF) — the idea that the degree of industrial processing in food matters as much as calories or nutrients. Everything flows from this philosophy.

### Who It Is For

The app is aimed primarily at UK households — parents planning family meals, health-conscious adults who want to understand their food better, and anyone who feels overwhelmed by traditional diet apps. It is deliberately non-clinical: it does not tell users they are fat, does not count calories by default, and avoids medical language.

### The Main Value Proposition

"Plan real meals, shop smarter, understand what's in your food — without the pressure."

A user can: import a recipe from a website, add it to their weekly plan, have the app generate a shopping list with estimated supermarket prices, and then check whether each product in their trolley is minimally processed or highly formulated — all in one place.

---

## 2. COMPLETE UI MAP

### 2a. Top Navigation Bar (Visible on Every Screen)

The bar runs across the very top of the screen on desktop and adapts to a compact version on mobile.

---

**Left side of the top bar:**

| Icon | Label | What It Does |
|------|-------|-------------|
| Grid squares icon | Dashboard | Goes to the home/overview page. Shows weekly progress, health scores, and quick actions. |
| Magnifying glass | Search | Opens a search box to find meals by name or ingredient. |
| Notepad icon | Quick List | Goes to the Quick List entry page — a fast way to type or speak a shopping list without planning a full meal. |

**Centre of the top bar:**

| Element | What It Does |
|---------|-------------|
| THA Logo (long version) | Clicking it always returns you to the Dashboard home page. |

**Right side of the top bar:**

| Icon | Label | What It Does |
|------|-------|-------------|
| Shopping basket icon | Basket | Goes to the Basket / Shopping List page. A small number badge shows how many items are currently in your list. |
| Apple icon (THA brand) | Apple Menu | A dropdown with: Profile, Partners page, and (for admins only) links to admin tools. |

---

**Inside the Apple Menu dropdown:**

| Option | What It Does |
|--------|-------------|
| Profile | Takes you to your personal settings — name, dietary preferences, measurement units, and subscription status. |
| Partners | A page about THA's brand partners or affiliates (exact content confirmed by code; detailed copy not reviewed). |
| Admin: Users | Visible to admins only. Opens the User Management panel. |
| Admin: THA Picks | Visible to admins only. Opens the product curation panel. |
| Admin: Recipe Sources | Visible to admins only. Opens the control panel for external recipe APIs. |

---

### 2b. Left Sidebar (Main Navigation Menu)

On desktop the sidebar sits on the left and can be collapsed to show just icons. On mobile it becomes a bottom navigation bar.

| Menu Item | Icon | What It Does |
|-----------|------|-------------|
| Cookbook | Chef hat | Your saved recipe library. Browse, search, import, and manage all your meals. |
| Planner | Calendar | The weekly meal planner. Assign meals to days and meal types (breakfast, lunch, dinner, snacks). |
| Pantry | Custom apple/jar icon | Your household larder, fridge, and freezer tracker. Records what you already have in stock. |
| Analyser | Microscope | The product analyser. Search individual food products to see their Apple Rating and processing breakdown. |
| My Diary | Open book | Your personal food and health diary. Log what you ate and how you felt each day. |
| Log Out | Arrow icon | Signs you out immediately. |

---

### 2c. Dashboard (Home Page — `/`)

The first page a user sees after logging in. It provides:

- A summary of the current week's planned meals
- Health scores and progress indicators
- Quick-action buttons to jump to the most common tasks
- Any active site-wide announcements (set by admins)

It is an overview screen, not a working screen — you read it rather than do things from it.

---

### 2d. Cookbook (`/meals`)

Your personal recipe library. Everything you import or save ends up here.

**What you can do:**
- Browse your collection with cards showing the meal name, photo, and Apple Rating
- Search and filter by cuisine, diet type, ingredients, or health score
- Import a new recipe (by URL, by typing/pasting text, by uploading an image, or from a social media caption)
- Open any recipe to see full ingredients, method, nutritional notes, and health breakdown
- Add a recipe to the planner from its detail view
- Add a recipe's ingredients directly to your basket
- Mark a batch of a meal as frozen (stored in freezer for later)
- Delete or edit recipes

**Key sub-features visible inside the Cookbook:**
- **Apple Rating badge** on each recipe card — shows 1 to 5 apples
- **Diet tags** — e.g., "Plant-Based", "Gluten-Free", "Family Friendly"
- **Add to Basket button** — sends all ingredients to your shopping list
- **Freeze this meal** — logs a cooked batch in the Freezer Meals tracker

---

### 2e. Weekly Planner (`/weekly-planner`)

A grid-style calendar view showing the current week (or any week) with slots for each day and meal type.

**What you can do:**
- Drag or assign meals to any day and meal type slot
- Use "Smart Suggest" — an AI-powered button that fills gaps in your plan based on your dietary preferences, budget, and what you haven't eaten recently
- Tailor a meal for specific household members (e.g., adapt for a child's allergy)
- Add freezer meals to a day's slot
- Copy a meal from the planner to your diary to log it as eaten
- View which eaters are planned for each slot
- Navigate between weeks using arrow controls

**Smart Suggest — how it works:**  
The app looks at your dietary preferences, your budget preference (budget/standard/premium), which proteins you have eaten recently (to add variety), and how many ingredients overlap with your existing basket — then scores every meal in your library and suggests the best fits. This runs on AI logic in the background; no human is picking the suggestions.

---

### 2f. Pantry (`/pantry`)

A digital version of your physical kitchen stock. It is divided into four sections:

| Section | What It Tracks |
|---------|----------------|
| Larder | Dry and ambient goods — tins, pasta, rice, oils, condiments |
| Fridge | Perishables you currently have — milk, cheese, leftovers |
| Freezer | Both raw frozen ingredients and prepared freezer meals |
| Household | Non-food items — cleaning products, toiletries (if tracked) |

**What you can do:**
- Add items you currently have in stock
- Mark items as "default always in stock" so they are never added to your shopping list
- View "Pantry Knowledge" cards — plain-English information about each ingredient (why it matters, how to choose a good version, storage tips)
- See an overview of how healthy your pantry is based on what you keep in stock

**Key interaction with Shopping List:**  
When you generate a shopping list from your planner, the app checks your pantry first. If you have marked something as "I have this", it will be either excluded from the list or flagged as "already got" — so you don't buy duplicates.

---

### 2g. Analyser / Products (`/products`)

A standalone food product search and health analysis tool. It is separate from your personal recipes — this is about individual supermarket products.

**What you can do:**
- Search for any food product by name (e.g., "Heinz Baked Beans", "Oat Milk")
- See the product's Apple Rating (1–5 apples) and its full ingredient analysis
- Read which specific ingredients triggered any processing penalties
- Use a barcode scanner on mobile to look up a physical product in-store
- Browse a database of products that THA has already rated

**Who uses it:**  
Anyone who wants to understand a specific product without planning a full meal. It is also the engine that powers the basket analysis — when you generate a shopping list, each item is being assessed through the same analysis logic.

---

### 2h. My Diary (`/diary`)

A private daily log combining what you ate with how you felt.

**What you can do:**
- Log meals for any date — either by searching your recipe library, typing freeform, or copying directly from your planner
- Record daily health signals: mood (rated 1–5 apples), energy (rated 1–5 apples), sleep hours, and weight
- Record whether you "stuck to your plan" that day
- Add custom metrics if you want to track something specific
- Look back at previous days to see patterns over time

**Key connection:**  
The diary is intentionally lightweight. It is not a calorie counter. The idea is to notice correlations — "On days I ate mostly whole foods, I had more energy and better mood" — without clinical precision.

---

### 2i. Basket / Shopping List (`/analyse-basket`)

The most complex page in the app. It is the central hub where your meal plan becomes a real shopping trip.

The page works in stages:

**Stage 1 — The Basket (ingredient list):**  
All ingredients from your planned meals are listed here, consolidated and deduplicated. "2 recipes needing onions" becomes "4 onions" in one line. Quantities are calculated automatically.

**Stage 2 — Check Your Cupboards:**  
Before finalising your list, the app asks you to confirm which items you already have. You can tap each item to say "I've got this" and the quantity to buy is adjusted accordingly.

**Stage 3 — Shopping View (Shop Mode):**  
Once cupboards are checked, the list switches to a clean shopping-trip view. Items are grouped by supermarket aisle category (Produce, Dairy, Meat, Pantry, etc.) for easy navigation around the store.

**Key features within the Basket page:**

| Feature | What It Does |
|---------|-------------|
| Supermarket selector | Choose which supermarket you are shopping at (Tesco, Sainsbury's, Aldi, etc.). Prices and product suggestions adjust accordingly. |
| THA Picks | For each ingredient, THA may suggest a specific branded product it has curated as a healthier or better-value option. |
| Price estimates | Each item shows an estimated price based on real supermarket data or category-level fallback estimates. A running total is shown. |
| Apple Rating per item | Each product on your list shows its health rating so you can see at a glance how processed your trolley is. |
| Vague item flag | If an ingredient is too generic to match a real product (e.g., just "milk"), the app prompts you to be more specific. |
| Add to Supermarket | For supported supermarkets (Tesco, Sainsbury's, Ocado), the app can link directly to that product's page on the retailer's website. |
| Basket Analyser summary | An overall health score for your entire planned shop — what percentage is whole food vs. ultra-processed. |

---

### 2j. Quick List (`/list`)

A fast, informal entry point for people who just want to type a shopping list without planning meals.

**What you can do:**
- Type items freeform, one per line or comma-separated (e.g., "milk, eggs, 3 bananas, bread")
- Use your voice (microphone button) — the app listens and converts speech to text
- Take a photo or upload a picture of a handwritten list — the app reads the text (OCR)
- Submit the list to run it through the full THA analysis engine

**What happens after you submit:**  
The app normalises and categorises each item, applies Apple Ratings where it can, and takes you to the Basket / Shop View — so even an ad-hoc shop gets the health analysis treatment. Quick List items are kept separate from your planned shopping in the combined view (you can filter between them).

**History:**  
Recent Quick Lists are saved in your browser so you can recall a previous one easily.

---

### 2k. Profile (`/profile`)

Your personal account settings.

**What you can do:**
- Update your display name and login details
- Change dietary preferences and allergens (these affect Smart Suggest and tailoring)
- Switch between metric and imperial measurements
- Set your preferred price tier (Budget / Standard / Premium)
- View your household and see who else is a member
- View your subscription status

---

### 2l. Onboarding (`/onboarding`)

A 12-step welcome questionnaire that runs the first time a user creates an account (or if an admin resets it for them).

**Steps covered:**
1. Welcome and philosophy overview ("No pressure. Just clearer choices.")
2. Values — reframing what "healthy" means
3. Introduction to Ultra-Processed Foods (UPF)
4. About you — basic profile
5. Allergies and intolerances
6. Diet pattern (Whole Food, Plant-Based, Omnivore, Keto, etc.)
7. Eating styles (Family Friendly, Quick & Easy, etc.)
8. Personalisation choices
9. Feature introduction tour
10. Tracking preferences — what to monitor (all off by default; users opt in)
11. Start area — which part of the app to go to first
12. Completion

The answers here shape the entire app experience — which meals are suggested, which allergens are flagged, and how the diary is configured.

---

### 2m. Admin Tools (Admin users only)

Accessed via the Apple Menu dropdown. Regular users never see these links.

**User Management (`/admin/users`):**
- Search for any registered user
- Manually change their subscription tier (Free / Premium / Friends & Family)
- Force a password reset
- Reset a user's onboarding so they go through the questionnaire again
- Enable or disable a global site-wide banner message shown to all users

**THA Picks (`/admin/ingredient-products`):**
- Add specific product recommendations to the database (e.g., "For 'passata', suggest Brand X Organic Passata")
- Use a barcode scanner to look up products from OpenFoodFacts and add them directly
- Set priority ranking so the most recommended products appear first
- Deactivate picks without deleting them

**Recipe Sources (`/admin/recipe-sources`):**
- Turn external recipe APIs on or off (e.g., Edamam, FatSecret, BBC Good Food)
- View whether API credentials are configured correctly
- See a log of requests that were blocked due to a disabled source

---

## 3. END-TO-END USER FLOWS

### Flow 1: Adding a Recipe by URL

1. User opens **Cookbook** from the left menu.
2. Clicks the **Import Recipe** or **Add Meal** button.
3. Pastes a URL (e.g., from BBC Good Food, Jamie Oliver, or any recipe website).
4. The app visits the page, reads the recipe data (using the site's embedded structured data first, then scraping the page if needed).
5. Ingredients, instructions, and images are extracted automatically.
6. A preview is shown — the user can review and correct anything before saving.
7. The recipe is saved to their Cookbook with an Apple Rating already calculated for each ingredient.

**If the URL fails or is unsupported:** The app falls back to asking the user to paste the raw recipe text instead, which AI then parses.

---

### Flow 2: Importing a Recipe from Text, Image, or Social Caption

1. User opens Cookbook → Add Meal → choose **Paste Text**, **Upload Image**, or **Social Caption**.
2. For image: the app uses OCR (optical character recognition) to read text from the photo.
3. For social captions (Instagram/TikTok style): the user pastes the caption text.
4. The extracted text is sent to the AI (OpenAI) to identify and structure the recipe — ingredients, quantities, and instructions.
5. The user reviews the result and saves.

---

### Flow 3: Searching the Cookbook

1. User opens **Cookbook**.
2. Types in the search bar — searching by meal name, ingredient, cuisine, or diet tag.
3. Filters can be applied: diet type, cooking time, Apple Rating minimum, etc.
4. Cards update in real time to show matching results.
5. Clicking a card opens the full recipe detail.

---

### Flow 4: Adding a Meal to the Planner

**From the Cookbook:**
1. Open a recipe from the Cookbook.
2. Click **Add to Planner**.
3. Select the day, meal type (breakfast/lunch/dinner/snacks), and which household members it is for.
4. The meal appears on the Planner grid.

**From the Planner directly:**
1. Open **Planner**.
2. Click an empty slot on any day.
3. Search for a meal from your library or use Smart Suggest to fill it automatically.
4. Confirm the selection.

---

### Flow 5: Using the Planner Day-to-Day

1. User opens **Planner** each week.
2. Reviews the week — meals are shown in a grid (days across the top, meal types down the side).
3. Uses **Smart Suggest** to fill any empty slots.
4. Taps any slot to see the meal detail, swap the meal, or tailor it for a specific household member.
5. At the end of the week (or anytime), clicks **Generate Shopping List** to move to the Basket page.

---

### Flow 6: Adding a Meal or Item to the Basket

**From the Planner:**
1. Click **Generate Shopping List** or **Add Week to Basket**.
2. All ingredients from all planned meals are consolidated and sent to the Basket page.

**From a single recipe:**
1. Open the recipe in the Cookbook.
2. Click **Add to Basket**.
3. That recipe's ingredients are added to the basket (merged with anything already there).

**From the Quick List:**
1. Go to the Quick List page.
2. Type, speak, or photograph your list.
3. Submit — items land in the Basket.

---

### Flow 7: Generating and Using the Shopping List

1. Go to **Basket / Analyse Basket**.
2. Review the consolidated ingredient list.
3. **Check Cupboards phase:** Go through each item and tick off anything you already have at home. The quantity to buy updates in real time.
4. Select your **supermarket** from the dropdown.
5. The list switches to **Shop View** — items are organised by aisle section.
6. For each item, THA shows a suggested product (THA Pick or best price match), its Apple Rating, and the estimated price.
7. For items flagged as "vague" (too generic for a product match), a prompt asks you to refine the item.
8. The page shows a running **Estimated Total** for your shop.
9. For supported supermarkets (Tesco, Sainsbury's, Ocado), each item has a link to go directly to that product on the retailer's website.

---

### Flow 8: Resolving Vague Items

1. In Shop View, some items appear with a warning flag (e.g., "milk" is too vague).
2. The app prompts: "Did you mean Oat Milk, Whole Milk, or Skimmed Milk?"
3. The user taps their choice.
4. The item is updated with the specific version, a real product match is found, and the Apple Rating appears.

---

### Flow 9: Adjusting Quantities

1. On the Basket page, each ingredient shows the calculated quantity (e.g., "400g").
2. The user can manually increase or decrease any quantity.
3. After the Check Cupboards step, remaining quantities reflect only what still needs to be bought.

---

### Flow 10: Going to the Shop View

1. Complete the Check Cupboards step on the Basket page.
2. The page automatically transitions to Shop View (or the user clicks a button to proceed).
3. Items are now grouped by category: Produce, Meat & Fish, Dairy, Bakery, Pantry, etc.
4. Each item shows: name, quantity, product suggestion, Apple Rating, and estimated price.

---

### Flow 11: Analysing the Basket

1. On the Basket page, a summary panel shows the overall health analysis of the full shop.
2. Metrics shown include: what percentage of items are whole food vs. ultra-processed, the most concerning items, and an overall score.
3. Users can click individual items for a full ingredient breakdown to understand exactly why an item scored the way it did.

---

### Flow 12: Using the Pantry

1. Open **Pantry** from the left menu.
2. Browse the four sections (Larder, Fridge, Freezer, Household).
3. Add items you have at home. Mark any item as "I always keep this in stock" to exclude it permanently from future shopping lists.
4. Read the **Pantry Knowledge** cards for any ingredient — plain-English health information.
5. When your next shopping list is generated, the pantry check automatically subtracts stocked items.

---

### Flow 13: Using the Diary

1. Open **My Diary** from the left menu.
2. Select a date (defaults to today).
3. Log meals:
   - Search your cookbook and select a meal you cooked
   - Type a freeform entry
   - **Copy from Planner** — pulls in whatever was planned for that date
4. Log daily metrics: Mood (1–5 apples), Energy (1–5 apples), Sleep hours, Weight (optional).
5. Mark "Stuck to plan" if you followed your planner that day.
6. Over time, the diary builds a personal health picture alongside food choices.

---

### Flow 14: Freezer / Stored Meal Flow

1. Cook a batch of a freezer-eligible meal (marked with a snowflake icon in the Cookbook).
2. From the recipe detail, click **Freeze this Meal**.
3. Enter how many portions were made and the date frozen.
4. The Freezer section of your Pantry now shows this meal with portions remaining.
5. When planning the next week, the Planner can show available freezer meals as an option for any slot.
6. When you use a portion, tap "Use Portion" — the count decreases.
7. The expiry date serves as a reminder so meals are not forgotten.

---

### Flow 15: Using a Quick List

1. Go to the **Quick List** page (notepad icon in the top bar).
2. Type your list, use the microphone to speak it, or upload a photo of a handwritten list.
3. Click **Analyse** or **Submit**.
4. The app categorises and rates each item.
5. You are taken to the Basket / Shop View with your Quick List items ready to review.
6. Your list history is saved locally in the browser for easy access later.

---

## 4. HOW THE APP WORKS BEHIND THE SCENES

### Where Data Is Stored

All data lives in a **PostgreSQL database** — a structured, industry-standard database system. Think of it as a very large, organised spreadsheet with many interconnected tables. Every user account, recipe, shopping list item, diary entry, and pantry record is a row in one of these tables.

Nothing is stored purely on your phone or device (except your Quick List history, which is held in the browser for speed). Everything syncs to the server.

---

### How Recipes Become Ingredients

When you import a recipe, the app performs several steps:

1. **Fetch the raw content** — either by visiting the URL, reading pasted text, or scanning an image.
2. **Extract structured data** — for websites, the app first looks for hidden recipe data embedded in the page code (a standard called JSON-LD that recipe sites often include). This is the most reliable source.
3. **Fall back to scraping** — if no structured data is found, the app reads the visible page and tries to identify ingredient lines by their format (lines with measurements, numbers, and food words).
4. **AI parsing** — if the text is messy (e.g., from an image or social caption), it is sent to OpenAI's language model, which reads it and returns a clean, structured recipe.
5. **Store the ingredients** — each ingredient is saved with its quantity, unit (grams, cups, etc.), and name.

---

### How Ingredients Become Shopping Items

When you generate a shopping list, the app:

1. **Collects** all ingredients from all meals in your basket.
2. **Normalises** each one — converts all quantities to a common base unit (grams for weight, millilitres for volume) so they can be compared and added together.
3. **Consolidates** — if two recipes both need "onion", the amounts are added together. Smart merging also handles cases where one recipe says "plain flour" and another says "flour" — they are treated as the same thing.
4. **Subtracts** anything you have already marked as "in my pantry" or "got in cupboard".
5. **Converts back** for display — 1500g becomes "1.5 kg" or "3.3 lb" depending on your measurement preference.
6. **Categorises** — each item is sorted into a supermarket section (Produce, Dairy, Meat, Pantry, etc.) using a keyword matching system with 18 possible categories.

---

### How Quantities Work

Quantities go through three stages:

- **As written in the recipe:** "2 tbsp olive oil", "400g tin of tomatoes"
- **As stored internally:** Everything is converted to a base unit (e.g., 2 tbsp = 30ml)
- **As shown to you:** Converted back into readable units based on your preference (metric or imperial)

The conversion tables are built into the app and cover a wide range of units including informal ones like "a handful", "a pinch", or "a knob of butter".

---

### How Categories Work

Every ingredient is assigned to a category using a pattern-matching system that reads the ingredient's name. For example:

- "cherry tomatoes" → Produce
- "cheddar cheese" → Dairy
- "tin of chickpeas" → Tinned
- "self-raising flour" → Pantry / Dry Goods
- "fresh basil" → Produce (even though "basil" alone might suggest Herbs/Pantry)

The system uses a "longest match first" rule — so "tomato sauce" is correctly identified as a Condiment rather than Produce (because "tomato sauce" is a longer, more specific match than "tomato").

When the pattern-matching is not confident enough, an AI classifier is called as a backup to categorise the item using semantic understanding.

---

### How Prices Work

Prices come from two sources:

1. **The Spoonacular API** — an external food product database that returns real product names and prices (originally in US dollars, converted to pounds at a fixed rate of £0.79 per $1).
2. **Category fallback estimates** — if no real product is found, the app uses pre-set average prices per category (e.g., "fresh vegetables cost approximately £X per kg") adjusted for the quantity required.

These estimates are further adjusted by:

- **Supermarket variance** — Aldi prices are scaled down (0.82× of base), Waitrose scaled up (1.12× of base), and so on.
- **Price tier preference** — Budget, Standard, or Premium tier multipliers are applied (0.75× for Budget, 1.45× for Premium, 1.60× for Organic).

The resulting "Estimated Total" is an approximation, not a guaranteed price.

---

### How Apple Ratings Work

The Apple Rating (1–5 apples) measures how industrially processed a product is. It is not a nutritional score — a product can be low in calories but still score 1 apple if it contains many artificial additives.

**How it is calculated:**

The app scans the ingredient list and counts "penalty points" in three buckets:

| Bucket | What It Looks For | Maximum Points |
|--------|-------------------|----------------|
| Bucket 1 — Additives | E-numbers, "flavouring", "yeast extract", "maltodextrin", "dextrose" | 5 points |
| Bucket 2 — Industrial Ingredients | "palm fat", "skimmed milk powder", "whey protein", "hydrogenated fats", "soy flour" | 5 points |
| Bucket 3 — UPF Patterns | Combinations like "sugar + glucose syrup" or multiple dairy fractions | 3 points |

**Total penalty → Apple Rating:**
- 0 points = 5 Apples (minimal processing)
- 1 point = 4 Apples (mild concern)
- 2–3 points = 3 Apples (moderate processing)
- 4–5 points = 2 Apples (clearly ultra-processed)
- 6+ points = 1 Apple (highly formulated)

**Whole food override:** Plain fruits, vegetables, eggs, and unprocessed proteins automatically receive a high rating regardless of the calculation, as long as they do not have any industrial terms in their description.

---

### How the Product Health Score Works

Separate from the Apple Rating (which is about processing), the **Product Health Score** is a 0–100 number that also considers nutrition. It starts at 100 and:

- **Loses points for:** UPF ingredients (−8 each), artificial sweeteners (−15), preservatives (−10), high sugar, high saturated fat, high salt
- **Gains points for:** High protein, high fibre, being organic, being NOVA Group 1 (unprocessed), containing more than 5 whole food ingredients

---

### How AI Is Used

AI (specifically OpenAI's GPT-4o-mini model) is used in several places:

| Where | What AI Does |
|-------|-------------|
| Recipe import (text/image) | Reads messy text and returns a clean, structured recipe |
| Ingredient enrichment | Generates "Pantry Knowledge" — health information about each ingredient |
| Item classification | Categorises ingredients when keyword matching is not certain |
| Smart Suggest | Scores and ranks every meal in your library to suggest the best fit for a given slot |
| Household tailoring | Suggests adaptations to a meal for members with dietary restrictions |

**AI failures:** If OpenAI is unavailable or returns an error, most features fall back gracefully — recipe import shows an error asking the user to try again, ingredient classification uses the keyword system instead, and Smart Suggest uses a simpler rule-based ranking.

---

### What Happens When Pricing Fails

If the Spoonacular API returns no result, the price estimate falls back to category averages. If that also fails (which would be unusual), no price is shown for that item and the running total is marked as a partial estimate. The item is still shown and usable — just without a price.

---

## 5. KEY TECHNICAL DETAILS FOR NON-CODERS

### Frontend vs Backend — What Does That Mean?

The app has two parts:

- **Frontend (what you see):** Everything visible in your browser — the screens, buttons, colours, and text. Built with a framework called React. Runs inside your browser. Communicates with the backend by sending requests over the internet.
- **Backend (what runs on the server):** The invisible engine that stores your data, performs calculations, calls external services (like OpenAI or Spoonacular), and enforces rules (like who can see admin tools). Runs on a server you never see. Built with a framework called Express.

They talk to each other using a standard called an **API** (Application Programming Interface) — the frontend asks for data, the backend checks the request and sends back a response.

---

### The Database

The database is **PostgreSQL** — a well-established, reliable database used by millions of applications worldwide. All your data (recipes, plans, diary entries, shopping lists) is stored here permanently. The database has about 40 tables, each holding a different type of information. These tables are connected — for example, a "planner entry" row points to a "meal" row, which in turn points to "ingredient" rows.

Changes to the database structure (adding new fields, new tables) require a formal process called a **migration**, which updates the structure without losing existing data.

---

### User Accounts and Households

Each person has one **user account** (identified by email and password, with a hashed/encrypted password stored — never the plain password).

Multiple users can belong to one **household** — a shared group that plans meals and shops together. Households have:
- A name
- An invite code (share this to let someone join)
- A list of members with roles (member or admin of the household)

Within a household, there is also a concept of **Eaters** — people who are planned for. Adults in the household are automatically also eaters. Children or dependents who do not have their own accounts are represented as "unlinked eaters" — they appear in the planner and tailoring system but cannot log in.

---

### Subscription Tiers

| Tier | Who It Is For | Access Level |
|------|--------------|-------------|
| Free | Default for all new accounts | Core features with some limits (confirmed limits: family meal plans, advanced tracking, and full Analyser access are restricted) |
| Premium | Paying subscribers | Full access including family plans, advanced health tracking, and full Analyser |
| Friends & Family | Internal users or invited guests | Same access as Premium |

Tier changes are currently made manually by admins via the User Management panel. There is no self-serve payment flow visible in the codebase at the time of this review.

---

### Environment Variables

The app uses several external services (OpenAI, Spoonacular, OpenFoodFacts). These services require secret API keys — strings of characters that authorise the app to use them. These keys are stored as **environment variables** — system-level settings that are never visible in the code itself and never shared publicly. If a key is missing or expired, the feature that relies on it will fail (usually gracefully, with a fallback or error message).

---

### Deployment

The app is hosted on **Replit** — a cloud platform that runs the server 24/7. When a code change is made by a developer, it is tested and then pushed to the live environment. The app runs on a single server (not split across many), which is appropriate for the current scale but would need review if user numbers grew significantly.

---

## 6. KNOWN LIMITATIONS AND RISKS

### Price Estimates Are Not Real Prices

Prices shown in the basket are estimates only. They are based on:
- An external API (Spoonacular) with US-origin data converted to GBP
- Fixed supermarket variance multipliers
- Category-level averages as fallback

Prices will drift as real supermarket prices change. The fixed conversion rate (£0.79 per $1) and fixed multipliers mean the estimates are approximations, not live prices. Users may be surprised if their actual shop costs significantly more or less than estimated.

**Risk:** If users treat the estimated total as a real price, they may be misinformed. The UI should always clearly label prices as estimates.

---

### AI Trust Limitations

The app uses AI (OpenAI) for recipe parsing, ingredient classification, and meal suggestions. AI can and does make mistakes:

- It may misparse an unusual recipe format and create wrong quantities or ingredients
- It may classify an ingredient incorrectly
- Smart Suggest scores are based on rules that may not perfectly match a user's real preferences

AI results are shown to users as fact in several places. There is no visible disclaimer on AI-parsed recipes telling users to verify the output.

---

### Recipe Import Is Not Guaranteed

Not all recipe websites will import cleanly. The app uses:
1. Structured recipe data (works well for BBC Good Food, most major sites)
2. Heuristic scraping (works inconsistently)
3. AI parsing of text (most flexible but most prone to error)

Some sites actively block scraping. Instagram and TikTok links cannot be automatically scraped — users must paste the caption text manually.

---

### Ingredient Consolidation Can Merge Incorrectly

The system that combines duplicate ingredients across recipes uses a combination of keyword matching and unit conversion. Edge cases where items should not be merged (e.g., "cooking chocolate" and "chocolate chips" could be treated as the same "chocolate") may occur, resulting in incorrect combined quantities.

---

### Apple Rating Applies to Ingredient Lists, Not to Whole Products

The Apple Rating is calculated by scanning an ingredient list for known processing signals. This means:

- A product with no ingredient list (e.g., a loose vegetable weighed in store) gets a default high rating
- A product with a very long ingredient list may score low even if all those ingredients are whole foods (e.g., a mixed nut and dried fruit pack)
- The system does not read official NOVA classification data — it infers processing level from keyword signals

---

### Incomplete / Uncertain Features

The following areas have code and data structures present but their full user-facing status is uncertain:

- **Subscription payment flow:** The tiers exist in the database and access control is enforced, but no payment provider integration (e.g., Stripe) is visible in the codebase. Upgrades appear to be manually applied by admins.
- **Partners page:** The page route exists but detailed page content was not reviewed.
- **Demo accounts:** The user schema has `isDemo` and `demoExpiresAt` fields, suggesting a time-limited trial flow was planned or exists, but the full flow was not traced.
- **Usage caps for Free tier:** Documentation and code suggest planned limits (e.g., max 3 saved recipes, max 2 planner days per week for Free users) but their enforcement status was not fully verified.

---

### Confusing Naming

- **"Apple Rating" vs "Health Score":** These are two different things. Apple Rating (1–5) measures processing level. Health Score (0–100) includes nutrition. They can differ. This is not clearly explained in the UI based on the code review.
- **"Eaters" vs "Users":** The internal concept of "Eaters" (people planned for) is separate from "Users" (people who log in). A family member who doesn't use the app is an Eater, not a User. This distinction is internal and may not be apparent to users setting up a household.
- **"Basket" vs "Shopping List":** The terms are used somewhat interchangeably in the UI, but internally they represent different stages (basket = intent to cook; shopping list = derived ingredient list).

---

### Single-Language Support

All AI prompts are written for UK English and the app uses UK food terminology throughout (aubergine, courgette, coriander, etc.). The app is not currently internationalised for other markets or languages.

---

## 7. COMMON USER QUESTIONS / HOW-TO STARTERS

### How Do I Add a Recipe?

Open the Cookbook from the left menu. Click the button to add a new meal. Choose how you want to import it:
- Paste a web address (URL) from any recipe website
- Paste the recipe text directly
- Upload a photo of a printed or handwritten recipe
- Paste a social media caption

The app will read and structure the recipe automatically. Review the result and save it to your Cookbook.

---

### How Do I Find a Meal?

Open the Cookbook. Use the search bar at the top to type any ingredient, meal name, or cuisine. You can also filter by diet type, Apple Rating, or cooking style using the filter buttons.

---

### How Do I Plan a Week?

Open the Planner from the left menu. You will see a grid with the days of the week and slots for breakfast, lunch, dinner, and snacks. Click any empty slot to add a meal from your Cookbook. Or use the Smart Suggest button to let the app fill in recommended meals based on your preferences automatically.

---

### How Do I Use the Basket?

Once your week is planned, go to the Basket page (basket icon in the top bar). The app will have already combined all the ingredients from your planned meals. Go through the Check Cupboards step to tick off anything you already have. Then select your supermarket and switch to Shop View to see your finalised list with price estimates and product suggestions.

---

### How Do I Check Cupboards?

On the Basket page, before entering Shop View, there is a Check Cupboards phase. Each ingredient is listed — tap any item to mark it as "I've got this". The quantity to buy is automatically reduced. You can also do this more permanently by adding items to your Pantry.

---

### How Do I Use the Pantry / Freezer?

Open Pantry from the left menu. Add items you keep regularly at home and tick "I always have this" so they never appear on your shopping list. To use the Freezer section, first freeze a cooked meal from its recipe page (the freeze button appears on freezer-eligible meals). The Freezer tab in the Pantry then tracks your stored portions.

---

### How Do I Understand Apple Ratings?

Apple Ratings measure how industrially processed a food is — not how many calories or nutrients it has. 5 Apples means the food is minimally processed (like an apple, plain oats, or fresh fish). 1 Apple means it contains many industrial additives, emulsifiers, or highly refined ingredients. A food can be low in calories and still score 1 Apple if it is heavily formulated.

---

### Why Are Prices Estimates?

The app estimates prices using a combination of real product data and average prices by food category. These estimates are not pulled live from supermarket websites — they are approximations that may be higher or lower than actual shelf prices. Always use them as a rough guide, not a guaranteed budget.

---

## 8. SUPPORT / TROUBLESHOOTING GUIDE

### Problem: Recipe Did Not Import Correctly — Wrong Ingredients or Quantities

**What the user sees:** Imported recipe has missing ingredients, wrong amounts, or garbled ingredient names.

**Likely cause:**
- The website did not have structured recipe data and the fallback scraper misread the page layout
- An image was low quality or at an angle that reduced OCR accuracy
- The AI parsed an ambiguous text differently from how it was intended

**Safe workaround:** The user can edit any ingredient directly on the recipe detail page after import. Quantities, units, and names can all be corrected manually before saving.

**When it is a bug:** If a major, well-known recipe site (BBC Good Food, etc.) consistently imports incorrectly, that is a bug worth reporting.

---

### Problem: Shopping List Has Duplicate Items or Wrong Quantities

**What the user sees:** The same ingredient appears twice, or the quantity seems far too large or too small.

**Likely cause:**
- Two ingredients with slightly different names that should have been merged (e.g., "plain flour" and "all-purpose flour")
- A unit conversion issue (rare but possible with unusual units)

**Safe workaround:** Items can be manually adjusted or deleted from the basket page. Use the quantity edit field to correct the amount.

**When it is a bug:** If a clearly identical ingredient (same name, same unit) appears twice every time a specific recipe is added, report it.

---

### Problem: Price Shows as Zero or "Estimate Unavailable"

**What the user sees:** An item in the basket shows £0 or no price at all. The Estimated Total is lower than expected.

**Likely cause:** The external pricing service could not find a matching product for that specific ingredient, and the category fallback also failed (unusual).

**Safe workaround:** This does not affect the shopping list itself — just the price estimate. The item can still be purchased; the total just will not include it.

**When it is a bug:** If many items consistently show no price, the external pricing API key may have expired. This requires admin or developer attention.

---

### Problem: Apple Rating Seems Wrong for a Product

**What the user sees:** A product they consider healthy scores 1 or 2 Apples, or a product they consider unhealthy scores 5 Apples.

**Likely cause:**
- The rating is based on ingredient list keywords, not overall nutritional quality. A product with many natural-sounding ingredients could score low if it includes emulsifiers or stabilisers
- A product with no ingredient list available defaults to a high rating, which may be incorrect
- The product being assessed is a loose whole food (which auto-scores 5 Apples) but has been misclassified as a packaged product

**Safe workaround:** Tap the item in the Basket or Analyser to read the full ingredient breakdown. This shows exactly which signals triggered the penalty. Users can compare this to the real product label to judge for themselves.

**When it is a bug:** If a product is scoring incorrectly due to a missing or wrong ingredient list in the database, an admin can update the product record via THA Picks.

---

### Problem: Smart Suggest Keeps Recommending the Same Meals

**What the user sees:** The planner always suggests the same 5–6 meals regardless of what was planned previously.

**Likely cause:**
- The variety score (which penalises recently used proteins) works on the meal library available. If the Cookbook only has a few recipes, variety is limited
- The user's dietary restrictions may be eliminating most options

**Safe workaround:** Import more recipes into the Cookbook to give Smart Suggest a larger pool to work from.

**When it is a bug:** If a user has 50+ recipes and still sees only 3–4 suggestions, report it.

---

### Problem: Household Member's Dietary Restriction Is Not Being Respected

**What the user sees:** A meal is suggested or added despite one household member being allergic to an ingredient.

**Likely cause:**
- The eater's "hard restriction" may not have been saved correctly during setup
- The meal's ingredient list may not contain the allergen keyword in a form the system recognises (e.g., "contains milk" in a note rather than "milk" as an ingredient)

**Safe workaround:** Check the eater's profile under Household settings to confirm restrictions are listed. Also check the recipe's ingredient list to confirm the allergen is visible.

**When it is a bug:** If restrictions are correctly set and the system still suggests or allows an allergenic meal without any warning, that is a significant bug requiring immediate attention.

---

### Problem: Diary Not Syncing with Planner

**What the user sees:** After clicking "Copy from Planner" in the Diary, meals do not appear.

**Likely cause:** The planner may have no meals assigned to that specific date, or the planner entry was assigned to a different household member who is not the current user.

**Safe workaround:** Check the Planner view for that date to confirm meals exist. If they do, try logging out and back in before trying again.

**When it is a bug:** If meals are visibly assigned in the Planner for the correct date and still do not copy to the Diary, report it.

---

## 9. WHAT IS UNCLEAR FROM CODE

The following items cannot be fully confirmed from the codebase alone. They are listed here to avoid future misrepresentation.

---

**1. Self-serve subscription upgrades / payment flow**  
The subscription tiers (Free, Premium, Friends & Family) exist and are enforced, but no payment provider integration (Stripe, Paddle, or similar) is present in the code. It is unclear how users are expected to upgrade from Free to Premium in production — whether this is manual (admin changes the tier), through an external flow not in this codebase, or a planned feature not yet built.

---

**2. Exact Free tier limits in production**  
Documentation and code both mention planned limits (max 3 saved meals, max 2 planner days) for Free users, but it was not possible to confirm that all these limits are actively enforced in the current codebase. Some may be aspirational rather than live.

---

**3. Partners page content**  
The route (`/partners`) exists in the navigation, but the detailed content of the Partners page was not reviewed. It is unclear whether this is informational content, an affiliate programme, or a brand partnership listing.

---

**4. Demo account lifecycle**  
The user schema includes `isDemo` and `demoExpiresAt` fields, which implies a time-limited trial account system. However, the full flow for creating, presenting, and expiring demo accounts was not traced. It may be an older feature, a staff-use feature, or a partially built system.

---

**5. Social media scraping (Instagram / TikTok)**  
The code references the ability to import from social media captions, but platform restrictions mean these sources cannot be automatically scraped. It was not confirmed whether the import UI clearly communicates to users that they must paste the caption text manually rather than pasting a link.

---

**6. Site banner mechanism**  
Admins can enable a global banner through the User Management panel, but the exact behaviour (whether it persists across sessions, how it is dismissed, whether it is per-user or global) was not confirmed in detail.

---

**7. OpenFoodFacts data freshness**  
The barcode scanner in Admin THA Picks pulls product data from OpenFoodFacts. The currency of that data (how recently it was updated, completeness for UK products) is not controlled by THA and may vary.

---

**8. Exact supermarket URL behaviour for "Add to Supermarket"**  
For Tesco, Sainsbury's, and Ocado, the code generates either a direct product link (if a specific product ID is matched) or a search URL. The success rate of these links (how often the correct product is found vs. a generic search landing page) was not measured.

---

**9. Calorie and macro tracking**  
The onboarding questionnaire allows users to opt into calorie and macro tracking. The data fields exist in the schema, but the full depth of the tracking features (whether they display charts, totals, or comparisons) was not fully traced.

---

*End of The Healthy Apples — Master Product Guide*

---

*Prepared from a read-only review of the production codebase, May 2026.*  
*No files were changed. No code was deployed. No migrations were run.*
