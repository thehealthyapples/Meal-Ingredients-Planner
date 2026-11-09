---
entry: routes-map
name: Route Map
section: routes
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-11-05
version: 8
---

# Route Map

> Every client page address declared by the active application router, and the page each one resolves to.

## What it is

The client router is the `wouter` `<Switch>` in `client/src/App.tsx`. This map mirrors all 51 declared route patterns there, including aliases, redirects, protected pages, and parameterized routes. Most household pages are protected; signed-out visitors are sent to `/auth`, and incomplete onboarding is sent to `/onboarding`.

## Public routes

| Path | Resolves to |
|---|---|
| `/auth` | Auth page |
| `/onboarding` | Onboarding page |
| `/legal` | Legal index |
| `/legal/:slug` | Legal document |
| `/shared/:token` | Shared plan |
| `/invitation` | Invitation page |

## Home and household pages

| Path | Resolves to |
|---|---|
| `/` | Signed-out visitors see the public welcome; signed-in households see Home; incomplete onboarding goes to `/onboarding` |
| `/dashboard` | Dashboard |
| `/profile` | Profile |
| `/privacy-settings` | Privacy settings |
| `/help` | Help centre |
| `/contact` | Contact |

## Food, cookbook, and meal pages (protected)

| Path | Resolves to |
|---|---|
| `/food` | Food and plant diversity |
| `/nutrition` | Redirects to `/food` |
| `/plant-diversity` | Redirects to `/food` |
| `/foods/:slug` | Food detail |
| `/compare` | Food comparison |
| `/products` | Product analyser |
| `/analyser` | Product analyser (same page as `/products`) |
| `/meals/:id` | Meal detail |
| `/cookbook` | Cookbook real-book view |
| `/cookbook/grid` | Cookbook Grid |
| `/import-recipe` | Import recipe |
| `/quick-meal` | Quick meal |

## Planning and household spaces (protected)

| Path | Resolves to |
|---|---|
| `/planner` | Weekly planner |
| `/weekly-planner` | Weekly planner (same page as `/planner`) |
| `/pantry` | Pantry |
| `/pantry/:group` | Pantry category |
| `/pantry/fridge-preview` | Fridge interaction preview |
| `/pantry/shelves-preview` | Shelf interaction preview |
| `/pantry/cupboard-preview` | Cupboard interaction preview |
| `/orchard` | Orchard |
| `/supermarkets` | Supermarkets |

## Shopping and diary (protected)

| Path | Resolves to |
|---|---|
| `/shopping-workspace` | Shopping workspace |
| `/diary` | Diary |

## Admin (protected)

| Path | Resolves to |
|---|---|
| `/admin` | Admin overview |
| `/admin/users` | Users |
| `/admin/ingredient-products` | Ingredient products |
| `/admin/recipe-sources` | Recipe sources |
| `/admin/companion-intelligence` | Companion intelligence |
| `/admin/intelligence` | Intelligence dashboard |
| `/admin/benchmark-households` | Benchmark households |
| `/admin/development-world` | Development world households |
| `/admin/development-world/:id` | Development world household detail |
| `/admin/observations` | Observation workbench |
| `/admin/behaviour` | Behaviour workbench |
| `/admin/activity` | Activity monitor |
| `/admin/knowledge-review` | Knowledge review |
| `/admin/knowledge-claims` | Knowledge claims |
| `/admin/nutrient-reference-review` | Nutrient reference review |
| `/admin/canonical-publication-integrity` | Canonical publication integrity |

## Redirects and aliases

There are two redirects (`/nutrition` and `/plant-diversity` to `/food`) and two same-page aliases (`/analyser` to Products and `/weekly-planner` to Planner). Home has one address, `/`, with signed-out and signed-in views. Diary has one route: `/diary`. Shopping has one route: `/shopping-workspace`. `/home`, `/my-diary`, `/shopping-list`, `/list`, `/basket`, and `/analyse-basket` are not registered and render the not-found page.

## Fallback

Any address that does not match a registered route renders the friendly NotFound page.

## Source

`client/src/App.tsx` is authoritative for the declared route patterns and ordering. Dynamic segments such as `:id`, `:slug`, `:group`, and `:token` stand for record-specific values.

---

_Registry entry. Last verified against the active router on 2026-11-05._
