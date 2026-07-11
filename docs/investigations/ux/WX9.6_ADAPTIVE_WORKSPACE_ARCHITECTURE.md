# WX9.6 — Adaptive Workspace Architecture

## Summary

Design and implement a single adaptive workspace layout system that automatically scales every major workspace according to available screen width while preserving The Healthy Apples visual identity.

## Rollback

Tag: `wx9.6-before-adaptive-layout` (commit `265cadd`)
Restore: `git checkout wx9.6-before-adaptive-layout`

---

## Breakpoint Tiers

| Tier           | Tailwind token | Width     | Representative |
|----------------|---------------|-----------|----------------|
| Laptop         | `lg`          | 1024px+   | 13" MacBook    |
| Desktop        | `xl`          | 1280px+   | 24" monitor    |
| Large Desktop  | `2xl`         | 1536px+   | 27" monitor    |
| Ultra-wide     | `3xl`         | 1920px+   | 34"+ ultra-wide|

`3xl` is a custom breakpoint added to `tailwind.config.ts`.

---

## Layout Rules Per Workspace

### Cookbook (`/cookbook`)
| Tier          | Card columns | Container max-width |
|---------------|-------------|---------------------|
| Mobile (< lg) | 2           | full                |
| Laptop (lg)   | 3           | screen-2xl          |
| Desktop (xl)  | 4           | screen-2xl          |
| Large (2xl)   | 5           | screen-2xl          |
| Ultra (3xl)   | 6           | 1920px              |

### Meal Detail (`/meals/:id`)
| Tier          | Main grid | Container max-width |
|---------------|-----------|---------------------|
| Mobile (< md) | 1 col     | screen-xl           |
| Desktop (md+) | 3 col     | screen-xl           |
| Large (2xl)   | 4 col     | screen-2xl          |

### Planner (`/weekly-planner`)
| Tier          | Grid label col | Container max-width |
|---------------|---------------|---------------------|
| Desktop (sm+) | 100px         | screen-xl           |
| Large (2xl)   | 120px         | screen-2xl          |
| Ultra (3xl)   | 120px         | 1920px              |

### Shopping (`/shopping-workspace`)
| Tier          | Container max-width |
|---------------|---------------------|
| Desktop       | screen-2xl          |
| Ultra (3xl)   | 1920px              |

### Dashboard (`/`)
| Tier          | Stats grid | Container max-width |
|---------------|-----------|---------------------|
| Desktop (lg)  | 4 col      | screen-xl           |
| Large (2xl)   | 4 col      | screen-2xl          |

### Pantry (`/pantry`)
| Tier          | Category grid | Container max-width |
|---------------|--------------|---------------------|
| Desktop (lg)  | 3 col         | screen-xl           |
| Large (2xl)   | 4 col         | screen-2xl          |

---

## Implementation

### 1. tailwind.config.ts
Added `screens: { '3xl': '1920px' }` to `theme.extend`.

### 2. index.css
Added `--ws-col-label` CSS variable that scales from `100px` → `120px` at 2xl+ (used by planner grid).

### 3. Per-page changes

**meals-page.tsx (Cookbook)**
- Container `max-w-screen-2xl` → `max-w-screen-2xl 3xl:max-w-[1920px]`
- All card grids: add `2xl:grid-cols-5 3xl:grid-cols-6`

**meal-detail-page.tsx**
- Container: `max-w-screen-xl` → `max-w-screen-xl 2xl:max-w-screen-2xl`
- Main 3-col grid: add `2xl:grid-cols-4`

**weekly-planner-page.tsx**
- Container: `max-w-screen-xl` → `max-w-screen-xl 2xl:max-w-screen-2xl 3xl:max-w-[1920px]`
- Planner label column: `100px` → `var(--ws-col-label)` (scales at 2xl)

**shopping-workspace-page.tsx**
- Container: `max-w-screen-2xl` → `max-w-screen-2xl 3xl:max-w-[1920px]`

**dashboard.tsx**
- Container: `max-w-screen-xl` → `max-w-screen-xl 2xl:max-w-screen-2xl`

**pantry-page.tsx**
- Container: `max-w-screen-xl` → `max-w-screen-xl 2xl:max-w-screen-2xl`
- Category grid: `lg:grid-cols-3` → `lg:grid-cols-3 2xl:grid-cols-4`

---

## Extra Width Reveals More, Not Just Stretches

- **Cookbook**: extra columns show more recipes in the viewport without scrolling — more browsing, less paging
- **Meal Detail**: 4th column on large screens hosts the food intelligence / discovery panel alongside ingredients+nutrition rather than below
- **Planner**: wider label column gives day names more breathing room; longer planner grid fills screen width naturally
- **Shopping**: category panels expand to fill natural width rather than hitting an artificial cap

---

## Visual Identity Preservation

- Maximum content width capped at 1920px (never stretches to fill extreme ultra-wide monitors)
- Spacing and gap values remain consistent — only column counts increase
- Realm colour system, typography, and card designs unchanged
- No new components; layout classes only
