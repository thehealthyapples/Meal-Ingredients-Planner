# The Healthy Apples

## Overview
The Healthy Apples is a full-stack web application for personalized meal planning, grocery management, and healthy eating. It enables users to create meal plans, import recipes, generate shopping lists, and leverage AI for nutritional analysis, allergen detection, and healthier ingredient swaps. The project aims to provide an intelligent, seamless, and personalized experience to optimize meal preparation and grocery shopping, fostering healthier lifestyles.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Core Technologies
The application uses a React and TypeScript frontend with Vite, `wouter` for routing, and `@tanstack/react-query` for state management. The UI is built with `shadcn/ui` (new-york style) and Tailwind CSS, incorporating `framer-motion` for animations. The backend is an Express.js server on Node.js with TypeScript, using PostgreSQL as the primary database managed by Drizzle ORM. Authentication is session-based via `passport`. Shared Zod schemas ensure type-safe validation.

### UI/UX Decisions
The UI features a new-york style from `shadcn/ui` with Tailwind CSS for styling and `framer-motion` for animations. Key UI elements include a full-width weekly planner with tabbed navigation, inline renaming, and visual cues like badges and color-coded indicators (Nutri-Score, NOVA group, SMP Score). Custom apple artwork images are used for visual rating systems.

### Technical Implementations
-   **Meal Planning & Management**: CRUD operations for meal plans, AI-powered suggestions, plan duplication, and consolidated shopping list generation. A 6-week planner supports bulk meal assignments and detailed entries per slot.
-   **Multi-Recipe Planner Slots**: Each meal slot (Breakfast/Lunch/Dinner/Snacks/Drinks) in the 6-week planner supports multiple recipes. The main grid shows compact "Slot (N)" count badges and the primary meal title only. A Day View drawer (opened per day) provides full add/remove/reorder editing with collision-safe 3-step position swaps. Sorting is deterministic (position ASC, id ASC). Basket generation requires no changes as it already iterates all entries. See `docs/planner-multi-recipes.md`.
-   **Recipe Integration**: Multi-source recipe search and import (e.g., TheMealDB, BBC Good Food) with JSON-LD schema extraction and a flexible scraper.
-   **Nutrition & Health Analysis**: Calculates nutritional values, detects allergens, suggests healthier ingredient swaps, and computes a health score using OpenFoodFacts data, including UPF detection, NOVA classification, and additive risk assessment.
-   **Shopping List & Grocery Management**: Generates consolidated shopping lists with ingredient normalization, unit conversion, categorization, and product lookup/pricing via OpenFoodFacts and Spoonacular. Features a price tier system and per-item store selection.
-   **Supermarket Integration**: Supports exporting shopping lists to supermarket search pages and direct basket creation (e.g., via Whisk API).
-   **User Personalization**: Onboarding captures user preferences (diet, allergens, health goals, budget, stores, UPF sensitivity, calorie targets) for personalized meal recommendations.
-   **Diet Filtering**: Advanced client-side and server-side diet filtering based on user profiles, including canonical diet patterns and restrictions (Gluten-Free, Dairy-Free, Hide High-UPF).
-   **Product Intelligence**: Advanced analysis includes additive detection, a UPF scoring algorithm, SMP apple rating system, and processing indicator detection.
-   **Ingredient Normalization**: Canonical ingredient registry for consistent display, internal storage in grams/ml, and density-based unit consolidation.
-   **Meal Template Architecture**: Separates generic meal concepts from specific implementations (scratch vs. ready meals) using a `meal_templates` table and a resolution engine.
-   **Smart Suggestions Auto-Import**: Automatically imports external recipes, creating local meals and templates, with simplicity bonuses in meal scoring.
-   **Freezer Meals System**: Tracks pre-cooked frozen meals with portion management, expiry tracking, and visual indicators in the planner and shopping list.
-   **Calorie Display System**: Shows per-meal and daily calorie counts in the planner, using a bulk nutrition endpoint for efficient data fetching.
-   **Global Meal Library Import**: Admin-triggered import of meals from OpenFoodFacts API, including nutrition data, images, barcodes, and brand information, categorized into Baby Meal, Kids Meal, and Frozen Meal.
-   **Environment-Aware Auth System**: Dual environment support (Replit dev/beta vs. production) with conditional registration and beta user gating. Includes email verification and password reset flows with secure token management.
-   **Plan Templates Preview + Import**: Two-layer template system — global THA templates (admin-authored, published) and user private templates (personal saved planners). Templates panel in the planner shows a read-only 6×7 preview grid with granular import controls (all/week/day/meal slot) in replace or fill-empty mode. Admins manage full lifecycle (create draft → snapshot from planner → publish/archive/restore). Free users: Standard template + up to 4 private saved; premium: all published + unlimited private. See `docs/templates-preview-import.md`.
-   **Premium Profile Page**: A comprehensive `/profile` page acting as a health control center, household configuration, and nutrition control panel. It includes editable display name, health snapshot (BMI, daily calories), household settings, nutrition targets, goals & diet preferences, feature toggles, and account settings.
-   **Authorization + Subscription Foundation**: Implements `role` (user/admin) and `subscription_tier` (free/premium/friends_family) for access control, with middleware for premium feature requirements and admin-specific routes.
-   **Admin User Management**: Admin-only page at `/admin/users` for searching users (by email/display name) and changing subscription tiers (free/premium/friends_family). All tier changes are recorded in `admin_audit_log` with old/new tier, admin ID, and timestamp. Accessible via "Admin" link in the nav bar for admin users only.
-   **Share 6 Week Plan via Link**: Users can share saved private plan templates via a secure public link (`/shared/:token`). Token is a UUID v4 stored on the template. Recipients see a read-only 6-week grid and can import (logged-in) or are prompted to register. Free users: max 1 shared plan; premium/friends_family: unlimited. Share/unshare from the planner header "Share Plan" button. See `docs/share-plans.md`.

## External Dependencies

-   **PostgreSQL**: Relational database.
-   **Cheerio**: Server-side HTML parsing.
-   **TheMealDB API**: Recipe data.
-   **OpenFoodFacts API**: Grocery product lookup, nutrition, and UPF data.
-   **Spoonacular API**: Grocery product search, matching, and price data.
-   **Google Fonts**: Custom typography.
-   **@zxing/browser + @zxing/library**: Barcode scanning functionality.
-   **recharts**: Charting library.
-   **Nodemailer + Namecheap SMTP**: Email delivery (for verification and password reset).