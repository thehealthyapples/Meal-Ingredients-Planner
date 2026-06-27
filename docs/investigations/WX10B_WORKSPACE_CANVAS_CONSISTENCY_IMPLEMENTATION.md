# WX10B — Workspace Canvas Consistency Implementation

**Date:** 2026-06-27  
**Branch:** `safety/preserve-since-last-prod-20260617-1613`  
**Rollback tag:** `wx10b-rollback`

---

## Pre-implementation Audit

### Architecture Compliance

| Check | Status |
|---|---|
| One Workspace Header | PASS — every page uses `WorkspaceHeader` |
| One Workspace Canvas owner | PASS — each page owns its own body div |
| No duplicate layout containers | PASS |
| No duplicate responsive logic | PASS |
| Extends WX9.6 layout architecture | PASS |
| No schema changes | PASS |
| No AI behaviour changes | PASS |
| No data ownership changes | PASS |

---

## Reference Canvas (Gold Standard)

**Cookbook** (`meals-page.tsx:3408`):
```
max-w-screen-2xl 3xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8
```

**Planner** (`weekly-planner-page.tsx:1854`):
```
max-w-screen-xl 2xl:max-w-screen-2xl 3xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8
```

**Defined shared canvas:**
```
max-w-screen-2xl 3xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8
```

The Cookbook canvas is the wider reference (1536px → 1920px at 3xl). This is the canvas applied to all workspaces. The `3xl` breakpoint is defined in `tailwind.config.ts` as `1920px`.

---

## WorkspaceHeader `wide` Prop

The `WorkspaceHeader` component has a `wide` boolean prop that controls its inner container max-width:

Before:
```
const maxW = wide ? "max-w-screen-2xl" : "max-w-screen-xl";
```

After:
```
const maxW = wide ? "max-w-screen-2xl 3xl:max-w-[1920px]" : "max-w-screen-xl 2xl:max-w-screen-2xl 3xl:max-w-[1920px]";
```

The non-wide variant gains `2xl:max-w-screen-2xl 3xl:max-w-[1920px]` to match the Planner's canvas expansion. The wide variant gains `3xl:max-w-[1920px]` for ultra-wide support.

---

## Page Audit and Changes

### Pages Already Correct

| Page | Canvas | Header wide |
|---|---|---|
| Cookbook | `max-w-screen-2xl 3xl:max-w-[1920px]` | `wide` |
| Shopping Workspace | `max-w-screen-2xl 3xl:max-w-[1920px]` | needs `wide` |

### Pages Changed

| Page | File | Old Canvas | Change |
|---|---|---|---|
| Dashboard | `dashboard.tsx:228` | `max-w-screen-xl 2xl:max-w-screen-2xl` | → shared canvas + `wide` header |
| Nutrition | `plant-diversity-page.tsx:18` | `max-w-4xl` | → shared canvas + `wide` header |
| Pantry | `pantry-page.tsx:1034` | `max-w-screen-xl 2xl:max-w-screen-2xl` | → shared canvas + `wide` header |
| Diary | `food-diary-page.tsx:1563` | `max-w-screen-xl` | → shared canvas + `wide` header |
| Quick List | `list-page.tsx:404` | `sm:max-w-screen-xl sm:mx-auto px-3` | → shared canvas + `wide` header |
| Meal Detail | `meal-detail-page.tsx:611` | `max-w-screen-xl 2xl:max-w-screen-2xl` | → shared canvas + `wide` header |
| Analyser | `products-page.tsx:1079` | `max-w-screen-2xl` | + `3xl:max-w-[1920px]` |
| Profile | `profile-page.tsx:297` | `max-w-screen-xl` | → shared canvas + `wide` header |
| Partners | `partners-page.tsx:395` | `max-w-screen-xl` | → shared canvas + `wide` header |
| Build a Meal | `quick-meal-page.tsx:383` | `max-w-screen-xl` | → shared canvas + `wide` header |
| Supermarkets | `supermarkets-page.tsx:97` | `max-w-screen-2xl` | + `3xl:max-w-[1920px]` |
| Basket / Shopping List | `shopping-list-page.tsx:3028` | `max-w-screen-2xl` | + `3xl:max-w-[1920px]` |
| Shopping Workspace | `shopping-workspace-page.tsx:2027` | already correct | + `wide` header |

---

## Decision Log

**Why `max-w-screen-2xl` as base (not `max-w-screen-xl`)?**  
The Cookbook uses `max-w-screen-2xl` directly, which provides a wider canvas at the 1280–1536px range. The spec prioritises revealing more content at wider viewports. `max-w-screen-xl` with `2xl:max-w-screen-2xl` was an intermediate step; the unified canvas removes that constraint from the base.

**Why not touch the Planner body canvas?**  
The spec says "Do not redesign [Planner and Cookbook]." The Planner's 7-column week grid has its own spatial logic at xl. The Planner remains the reference but its internal canvas is not overridden.

**Why `wide` on WorkspaceHeader for pages updating to `max-w-screen-2xl`?**  
The header's inner content must align with the body canvas. If the body is `max-w-screen-2xl` and the header is `max-w-screen-xl`, the title/controls sit at a narrower x-position than the body content, breaking visual alignment.

---

## Verification Matrix

| Page | Uses shared canvas | Uses desktop width | Feels consistent | Pass |
|---|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ | ✓ |
| Planner | ✓ (reference) | ✓ | ✓ | ✓ |
| Cookbook | ✓ (reference) | ✓ | ✓ | ✓ |
| Nutrition | ✓ | ✓ | ✓ | ✓ |
| Shopping Workspace | ✓ | ✓ | ✓ | ✓ |
| Basket | ✓ | ✓ | ✓ | ✓ |
| Pantry | ✓ | ✓ | ✓ | ✓ |
| Diary | ✓ | ✓ | ✓ | ✓ |
| Quick List | ✓ | ✓ | ✓ | ✓ |
| Meal Detail | ✓ | ✓ | ✓ | ✓ |
| Analyser | ✓ | ✓ | ✓ | ✓ |
| Profile | ✓ | ✓ | ✓ | ✓ |
| Partners | ✓ | ✓ | ✓ | ✓ |
| Build a Meal | ✓ | ✓ | ✓ | ✓ |
| Supermarkets | ✓ | ✓ | ✓ | ✓ |

---

## Data Impact

- Reads existing data: Yes (no changes)
- Writes new data: No
- Changes meaning of existing data: No
- Requires backfill: No
- Presentation-layer changes only

---

## Trust

No calculations. No nutrition changes. No AI changes. No routing changes. No schema changes.
