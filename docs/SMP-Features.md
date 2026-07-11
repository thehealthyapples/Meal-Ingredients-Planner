# SmartMeal Planner (SMP) - Complete Feature Guide

## Account & Personalisation

- **Sign up / Log in** - Create an account with username and password. Session-based authentication keeps you signed in.
- **Onboarding wizard** - After registration a 5-step wizard captures your preferences:
  - Diet type (none, vegetarian, vegan, keto, gluten-free, carnivore, UPF-free)
  - Health goals (eat healthier, avoid ultra-processed, save money, build muscle, lose weight)
  - Budget level (budget, standard, premium)
  - Preferred supermarkets (Tesco, Sainsbury's, ASDA, Aldi, Lidl, M&S, Waitrose, Morrisons, Co-op, Ocado)
  - UPF sensitivity (relaxed, moderate, strict)
- **Measurement preference** - Toggle between metric (g, ml, kg, L) and imperial (oz, lb, cups, tbsp) anywhere in the app.
- **Price tier preference** - Choose budget, standard, premium, or organic pricing for shopping list cost estimates.

---

## Dashboard

- Personalised welcome greeting.
- Total meals count with a link to your collection.
- Quick-access card to create a shopping list.
- Quick Start section showing recent meals or a prompt to add your first one.

---

## Meal Management (My Meals)

- **Create meals** - Add a meal with name, ingredients list, category, servings, image URL, source URL, and cooking instructions.
- **Grid and list views** - Switch between a visual card grid and a compact list.
- **Search and filter** - Search meals by name; filter by category.
- **Copy a meal** - Duplicate any meal for editing.
- **Delete meals** - Remove meals you no longer need.
- **Meal detail page** - Full view of a single meal with image, ingredients, instructions, nutrition, allergens, diet badges, and action buttons.
- **Re-import instructions** - Paste a recipe URL to pull in updated cooking instructions for an existing meal.

### Nutrition & Health Analysis

- **Analyse a meal** - One-click analysis calculates:
  - Full nutrition breakdown (calories, protein, carbs, fat, sugar, salt) per meal and per serving.
  - Health score (0-100) displayed as a colour-coded ring.
  - Allergen detection (gluten, dairy, nuts, eggs, fish, shellfish, soy, sesame, celery, mustard, sulphites, lupin, molluscs).
  - Healthier ingredient swap suggestions.
- **Nutrition badges** - Small badges on each meal card showing calories, protein, carbs, and fat at a glance.
- **Diet badges** - Shows which diets a meal is compatible with (vegetarian, vegan, keto, etc.).

### Basket

- **Add to basket** - Mark meals you want to shop for with a single click.
- **Quantity controls** - Increase or decrease the number of servings per meal in your basket.
- **Basket count badge** - The nav bar shows how many meals are currently in your basket.
- **Persistent basket** - Your basket is saved to your account and survives page refreshes and sessions.

---

## Recipe Discovery & Import

- **Multi-source recipe search** - Search for recipes across TheMealDB API and BBC Good Food (web scraping). Results show name, image, source, and ingredients.
- **Diet filter** - Filter search results by diet type.
- **One-click import** - Import any search result directly into your meal collection.
- **URL import** - Paste any recipe URL to automatically extract the title, image, ingredients, and instructions.

---

## Meal Planner

- **Create weekly meal plans** - Name a plan, set the number of people, and assign meals to days and slots (breakfast, lunch, dinner, snack).
- **Drag-and-drop entries** - Add, move, or remove meal entries from the weekly grid.
- **Duplicate plans** - Copy an entire meal plan as a starting point for a new week.
- **Generate shopping list from plan** - One click turns a meal plan into a consolidated shopping list.

### Smart Meal Suggestions (AI-Powered)

- **Auto-generate a full week** - The smart suggestion engine builds a complete 7-day meal plan based on:
  - Your diet preferences and health goals.
  - Budget constraints and UPF sensitivity.
  - Protein variety targets (e.g. max fish per week, max red meat per week).
  - Vegetarian day preferences.
  - Ingredient overlap for bulk-buying efficiency.
  - Cuisine preferences.
- **External meal discovery** - Pulls in meals from TheMealDB and BBC Good Food to supplement your own collection.
- **Lock and regenerate** - Lock meals you like and regenerate only the unlocked slots.
- **Weekly stats** - See estimated weekly cost, average UPF score, protein distribution, ingredient reuse count, and shared ingredients (buy-in-bulk suggestions).
- **"Why this meal?" explainability** - Each suggested meal has an expandable explanation showing why it was chosen:
  - Diet preference match
  - Health goal alignment
  - Budget fit
  - UPF score assessment
  - Protein variety contribution
  - Ingredient overlap with other meals
  - Cuisine match

---

## Shopping List

- **Build from meals** - Select meals and set serving counts; the app consolidates all ingredients into a unified shopping list.
- **Ingredient normalisation** - Quantities are converted to a common unit (grams/ml), duplicates are merged, and items are grouped by category (produce, dairy, meat, pantry, etc.).
- **Category icons** - Each ingredient category has a distinct icon for quick scanning.
- **Inline editing** - Edit product names, quantities, and units directly in the list.
- **Sort by column** - Sort by name, quantity, category, or price.
- **Price lookup** - Fetch real product prices from the Spoonacular API with images, brand, and nutritional data.
- **Price tiers** - Switch between budget, standard, premium, and organic pricing to see cost differences.
- **Total cost** - Running total at the bottom, with per-tier cost comparison.
- **Product matching** - See matched products from Spoonacular with images, prices, and serving info.
- **Ingredient sources** - Track which meals each ingredient came from.
- **Metric / Imperial toggle** - Switch all quantities between measurement systems.
- **Copy to clipboard** - Copy the entire list as text.
- **Delete items** - Remove individual items or clear the whole list.
- **Collapsible meal panel** - Collapse the meal selection panel to give more screen space to the shopping list.
- **Fullscreen mode** - Expand the shopping list to fill the entire screen.

---

## Product Intelligence (Product Analysis)

- **Search packaged foods** - Search the OpenFoodFacts database for any packaged product.
- **Product deduplication** - Duplicate products (same barcode or same name + brand) are automatically removed from results.
- **NOVA classification** - Each product shows its NOVA group (1-4) indicating processing level.
- **Nutri-Score** - Displays the Nutri-Score grade (A-E) when available.
- **Full nutrition panel** - Calories, protein, carbs, fat, sugar, and salt per product.
- **Ingredient breakdown** - Full parsed ingredient list with UPF ingredients and E-numbers highlighted.
- **UPF score** - A 0-100 score measuring how ultra-processed a product is, displayed as a progress bar.
- **SMP apple rating** - A 1-5 apple rating system (the app's own quality score) combining processing level, additive risk, and ingredient complexity.
- **Additive detection** - Scans for 80+ E-numbers with:
  - Additive name and type (emulsifier, preservative, colour, sweetener, acidity regulator, etc.)
  - Risk level (low, moderate, high)
  - Description of what each additive does.
- **Processing indicators** - Flags terms like "modified", "hydrogenated", "flavouring" that indicate processing.
- **Risk breakdown** - Shows separate scores for additive risk, processing risk, and ingredient complexity risk.
- **Health score circle** - Visual 0-100 health score with colour coding.

### Filters

- Hide ultra-processed products (NOVA 4).
- Hide products with high-risk additives.
- Hide products containing emulsifiers.
- Hide products containing acidity regulators.
- Minimum SMP apple rating (1-5 filter).
- Active filter count badge.

### Product Comparison

- Add products to a comparison tray.
- Side-by-side comparison of nutrition, NOVA group, UPF score, and SMP rating.

### Healthier Alternatives

- For any product, find healthier alternatives from the same category.
- Alternatives are scored and sorted by health rating.

---

## Supermarket Integration

- **Supermarket directory** - Browse supermarkets grouped by country (UK, US, EU, Australia, etc.).
- **Country filter** - Filter the supermarket list by country.
- **Export shopping list** - Send your entire shopping list to a supermarket's search page in one click.
- **Search individual items** - Look up a single shopping list item on any supermarket's website.
- **Basket checkout** - Create a shopping basket with supermarkets that support direct basket creation (via Whisk API integration).
- **Supermarket comparison** - Compare availability across different stores.

---

## Data & Intelligence Services

- **Ingredient normalisation engine** - Parses natural language ingredients ("2 cups chopped onions") into structured data with name, quantity, unit, and category.
- **Unit conversion** - Converts between metric and imperial, and normalises all quantities to grams/ml internally.
- **Meal scoring engine** - Multi-factor scoring algorithm considering diet match, goal alignment, budget, UPF score, protein variety, ingredient overlap, and cuisine preference.
- **Recommendation service** - Personalised meal suggestions based on your onboarding preferences.
- **External API integrations**:
  - TheMealDB for recipe search
  - BBC Good Food for recipe scraping
  - OpenFoodFacts for product data and UPF analysis
  - Spoonacular for grocery pricing and product matching
