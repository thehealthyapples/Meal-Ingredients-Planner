# The Healthy Apples

## Overview
The Healthy Apples is a full-stack web application designed to optimize meal preparation, grocery shopping, and healthy eating through personalized meal planning and intelligent tools. It enables users to create meal plans, import recipes, generate shopping lists, and leverage AI for nutritional analysis, allergen detection, and healthier ingredient swaps. The project aims to provide a seamless and personalized experience to foster healthier lifestyles.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Core Technologies
The application utilizes a React and TypeScript frontend with Vite, `wouter` for routing, and `@tanstack/react-query` for state management. UI components are built with `shadcn/ui` (new-york style) and Tailwind CSS, enhanced with `framer-motion` for animations. The backend is an Express.js server on Node.js with TypeScript, using PostgreSQL managed by Drizzle ORM. Session-based authentication is handled via `passport`, and shared Zod schemas ensure type-safe validation across the stack.

### UI/UX Decisions
The "Calm Orchard" design system features a warm cream/sage palette, DM Sans for headings, and Inter for body text. The layout includes a slim sticky top bar and a collapsible left sidebar. A fixed `orchard-bg.png` covers the entire app shell. The top bar is brand-only, while the sidebar houses navigation, search, support, and logout. The Basket icon displays a live numeric badge. Main content is a flex-1 area with `.main-safe` for mobile clearance. Cards use `shadow-none border-border`, and data tables utilize `.calm-table` for warm alternating rows. The dashboard includes a gradient hero. "Analyse Basket" highlights best price cells with `bg-secondary/15` and a "✓ Best" badge. Custom apple artwork is used for visual rating systems.

### Technical Implementations
-   **Meal Planning & Management**: Supports CRUD for meal plans, AI suggestions, plan duplication, and consolidated shopping list generation. A 6-week planner allows bulk meal assignments.
-   **Recipe Integration**: Multi-source recipe search and import (e.g., TheMealDB, BBC Good Food) with JSON-LD extraction and a flexible scraper.
-   **Nutrition & Health Analysis**: Calculates nutritional values, detects allergens, suggests healthier ingredient swaps, and computes a health score using OpenFoodFacts data, including UPF detection, NOVA classification, and additive risk assessment.
-   **Shopping List & Grocery Management**: Generates consolidated shopping lists with ingredient normalization, unit conversion, categorization, and product lookup/pricing via OpenFoodFacts and Spoonacular. Features a price tier system and per-item store selection. Supermarket integration allows exporting lists to search pages and direct basket creation.
-   **User Personalization**: Onboarding captures user preferences (first name, diet, allergens, health goals, budget, stores, UPF sensitivity, calorie targets) for personalized meal recommendations. Advanced client-side and server-side diet filtering based on user profiles. Shared constants in `client/src/lib/shared-options.ts` (GOAL_OPTIONS, STORE_OPTIONS, UPF_OPTIONS, BUDGET_OPTIONS, deriveGoalType) ensure Profile and Onboarding cannot drift. Goals are unified as a multi-select `healthGoals[]` with 6 options; `goalType` is auto-derived for calorie calculations.
-   **Product Intelligence**: Advanced analysis includes additive detection, a UPF scoring algorithm, SMP apple rating system, and processing indicator detection.
-   **Ingredient Normalization**: Canonical ingredient registry for consistent display, internal storage in grams/ml, and density-based unit consolidation.
-   **Meal Template Architecture**: Separates generic meal concepts from specific implementations using a `meal_templates` table and a resolution engine.
-   **Smart Suggestions Auto-Import**: Automatically imports external recipes, creating local meals and templates.
-   **Freezer Meals System**: Tracks pre-cooked frozen meals with portion management and expiry tracking.
-   **Calorie Display System**: Shows per-meal and daily calorie counts in the planner using a bulk nutrition endpoint.
-   **Global Meal Library Import**: Admin-triggered import of meals from OpenFoodFacts API, including nutrition data, images, barcodes, and brand information.
-   **Environment-Aware Auth System**: Dual environment support (development/beta vs. production) with conditional registration and beta user gating. Includes email verification and password reset flows.
-   **Plan Templates Preview + Import**: Two-layer template system (global THA templates and user private templates) with granular import controls.
-   **Premium Profile Page**: A `/profile` page acting as a health control center, household configuration, and nutrition control panel. `firstName` field on users table is the primary identity label (falls back to displayName/username for existing accounts).
-   **Authorization + Subscription Foundation**: Implements `role` (user/admin) and `subscription_tier` (free/premium/friends_family) for access control.
-   **Admin User Management**: Admin-only page at `/admin/users` for searching users and changing subscription tiers, with audit logging.
-   **Share 6 Week Plan via Link**: Users can share saved private plan templates via a secure public link.
-   **Pantry**: Dedicated `/pantry` page with "Food Pantry" (Larder/Fridge/Freezer) and "Household Essentials" sections, with items sendable to the shopping list.
-   **Meal Components**: Allows admins to mark reusable building blocks as components.
-   **Pairings Suggestions**: Admin-curated `meal_pairings` table links meals to suggested companions.
-   **Admin Preferred Products (THA Picks)**: Admin-curated `ingredient_products` table maps normalized ingredient keys to specific preferred retail products, displayed in the basket after product matching.
-   **Household System**: Introduces `households` and `household_members` tables for multi-user management, including invite codes, member management, and joining/leaving.
-   **Household Basket Intelligence**: Shopping list items record `addedByUserId`, with enriched items returned by the API showing `addedByDisplayName` and `sources`. Aggregates member dietary preferences for the household.
-   **Planner Basket Traceability**: The weekly planner shows a subtle green shopping cart icon on cells for meals already in the basket.
-   **Personal Food Diary (My Diary)**: Day-by-day log with four meal slots, add/edit/delete entries, and a "Copy from Planner" feature. Includes wellbeing metrics (weight, BMI, mood, sleep, energy, stuck-to-plan, notes) and a progress tab with charts.
-   **Diary CSV/TXT Import**: Allows importing food diary data from CSV/TXT files with column mapping, validation, and import strategy selection.
-   **Scan Recipes & Meal Plans**: Users can photograph or upload recipe/meal-plan images. OCR extracts text, and a regex/heuristic parser structures it, with optional GPT-4o-mini quality upgrade.
-   **Recipe Source Controls**: Admin-controlled toggles for recipe sources and credential availability, with an admin UI for management.
-   **Demo Mode**: Provides a temporary demo user with pre-seeded data, session-based login, and a countdown banner, expiring after 20 minutes with server-side enforcement.
-   **Healthy Living Partners Page**: Public-facing `/partners` page with featured partners, categories, search, partner cards, trust/transparency section, and a "Partner with THA" CTA.
-   **Basket Refactor — Smart Food-Intent System**: Distinguishes between whole foods and packaged foods in the shopping list, using detailed item typing, variant selections, and attribute preferences with a confidence system.
-   **Basket UI Refinements**: Includes a compact shopping summary with retailer filtering, export dialog integration for the copy button, removal of "Added by" attribution from ingredient cells, and a restructured table with dedicated columns for Variant, Attributes, and Confidence.

### Database Audit Rule
Before every production push, a schema-vs-migrations audit must be performed by verifying that every column in `shared/schema.ts` is covered by a `CREATE TABLE` or `ALTER TABLE ... ADD COLUMN` statement in `server/migrations/runner.ts`.

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