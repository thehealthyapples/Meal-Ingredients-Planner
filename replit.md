# The Healthy Apples

## Overview
The Healthy Apples is a full-stack web application designed to optimize meal preparation, grocery shopping, and healthy eating through personalized meal planning and intelligent tools. It enables users to create meal plans, import recipes, generate shopping lists, and leverage AI for nutritional analysis, allergen detection, and healthier ingredient swaps. The project aims to provide a seamless and personalized experience to foster healthier lifestyles.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Core Technologies
The application utilizes a React and TypeScript frontend with Vite, `wouter` for routing, and `@tanstack/react-query` for state management. UI components are built with `shadcn/ui` (new-york style) and Tailwind CSS, enhanced with `framer-motion` for animations. The backend is an Express.js server on Node.js with TypeScript, using PostgreSQL managed by Drizzle ORM. Session-based authentication is handled via `passport`, and shared Zod schemas ensure type-safe validation across the stack.

### UI/UX Decisions
The "Calm Orchard" design system features a warm cream/sage palette (HSL tokens), DM Sans for headings, and Inter for body text. The layout includes a slim 48px sticky top bar and a collapsible left sidebar (220px expanded / 64px collapsed, persisted via localStorage). A fixed `orchard-bg.png` covers the entire app shell. The top bar is brand-only, while the sidebar houses navigation (Dashboard, Planner, My Meals, Pantry, Basket, Profile), search, support, and logout. The Basket icon displays a live numeric badge. Main content is a flex-1 area with `.main-safe` for mobile clearance. Cards use `shadow-none border-border`, and data tables utilize `.calm-table` for warm alternating rows. The dashboard includes a gradient hero (sage→cream). "Analyse Basket" highlights best price cells with `bg-secondary/15` and a "✓ Best" badge. Custom apple artwork is used for visual rating systems.

### Technical Implementations
-   **Meal Planning & Management**: Supports CRUD for meal plans, AI suggestions, plan duplication, and consolidated shopping list generation. A 6-week planner allows bulk meal assignments.
-   **Weekly Planner Matrix Layout**: Displays a 6-week grid with day names and meal categories. Cells show meal names and an add button. Clicking a meal name opens a modal for details. Daily calorie summaries are shown below the grid. Week titles are inline-editable.
-   **Recipe Integration**: Multi-source recipe search and import (e.g., TheMealDB, BBC Good Food) with JSON-LD extraction and a flexible scraper.
-   **Nutrition & Health Analysis**: Calculates nutritional values, detects allergens, suggests healthier ingredient swaps, and computes a health score using OpenFoodFacts data, including UPF detection, NOVA classification, and additive risk assessment.
-   **Shopping List & Grocery Management**: Generates consolidated shopping lists with ingredient normalization, unit conversion, categorization, and product lookup/pricing via OpenFoodFacts and Spoonacular. Features a price tier system and per-item store selection.
-   **Supermarket Integration**: Exports shopping lists to supermarket search pages and enables direct basket creation.
-   **User Personalization**: Onboarding captures user preferences (diet, allergens, health goals, budget, stores, UPF sensitivity, calorie targets) for personalized meal recommendations.
-   **Diet Filtering**: Advanced client-side and server-side diet filtering based on user profiles.
-   **Product Intelligence**: Advanced analysis includes additive detection, a UPF scoring algorithm, SMP apple rating system, and processing indicator detection.
-   **Ingredient Normalization**: Canonical ingredient registry for consistent display, internal storage in grams/ml, and density-based unit consolidation.
-   **Meal Template Architecture**: Separates generic meal concepts from specific implementations using a `meal_templates` table and a resolution engine.
-   **Smart Suggestions Auto-Import**: Automatically imports external recipes, creating local meals and templates.
-   **Freezer Meals System**: Tracks pre-cooked frozen meals with portion management and expiry tracking.
-   **Calorie Display System**: Shows per-meal and daily calorie counts in the planner using a bulk nutrition endpoint.
-   **Global Meal Library Import**: Admin-triggered import of meals from OpenFoodFacts API, including nutrition data, images, barcodes, and brand information.
-   **Environment-Aware Auth System**: Dual environment support (development/beta vs. production) with conditional registration and beta user gating. Includes email verification and password reset flows.
-   **Plan Templates Preview + Import**: Two-layer template system (global THA templates and user private templates). Templates panel shows a read-only 6x7 preview grid with granular import controls.
-   **Premium Profile Page**: A `/profile` page acting as a health control center, household configuration, and nutrition control panel, with editable user details, health snapshot, and account settings.
-   **Authorization + Subscription Foundation**: Implements `role` (user/admin) and `subscription_tier` (free/premium/friends_family) for access control.
-   **Admin User Management**: Admin-only page at `/admin/users` for searching users and changing subscription tiers, with audit logging.
-   **Share 6 Week Plan via Link**: Users can share saved private plan templates via a secure public link. Recipients can view and import.
-   **Pantry (First-Class Feature)**: Dedicated `/pantry` page with "Food Pantry" (Larder/Fridge/Freezer) and "Household Essentials" sections. Household essentials can be sent to the shopping list.
-   **Meal Components**: A `kind` column (`'meal'|'component'`) on the `meals` table allows admins to mark reusable building blocks as components.
-   **Pairings Suggestions**: Admin-curated `meal_pairings` table links meals to suggested companions, appearing in the Day View Drawer.
-   **Admin Preferred Products (THA Picks)**: Admin-curated `ingredient_products` table maps normalized ingredient keys to specific preferred retail products. These are displayed in the basket after product matching.
-   **Household System**: Introduces `households` and `household_members` tables for multi-user management. Users have an invite code, can view members, rename the household, remove members, join, and leave.
-   **Scan Recipes & Meal Plans**: Users can photograph or upload recipe/meal-plan images. OCR via Tesseract.js extracts text, and a regex/heuristic parser structures it. GPT-4o-mini optionally upgrades parse quality. A confirmation dialog allows editing before saving.
-   **Recipe Source Controls**: Admin-controlled toggles for recipe sources stored in `recipe_source_settings`. A central gating module checks enabled flags and credential availability. Admin UI at `/admin/recipe-sources` manages sources and shows audit logs of blocked requests.

## External Dependencies

-   **PostgreSQL**: Relational database.
-   **Cheerio**: Server-side HTML parsing.
-   **TheMealDB API**: Recipe data.
-   **OpenFoodFacts API**: Grocery product lookup, nutrition, and UPF data.
-   **Spoonacular API**: Grocery product search, matching, and price data.
-   **Google Fonts**: Custom typography.
-   **@zxing/browser + @zxing/library**: Barcode scanning functionality.
-   **recharts**: Charting library.
-   **Nodemailer + Namecheap SMTP**: Email delivery.