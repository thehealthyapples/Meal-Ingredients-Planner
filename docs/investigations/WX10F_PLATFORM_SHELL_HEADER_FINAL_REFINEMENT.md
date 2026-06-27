# WX10F_PLATFORM_SHELL_HEADER_FINAL_REFINEMENT.md

## Summary

Final refinement of the authenticated application shell by reducing header height, permanently displaying the full The Healthy Apples logo, and aligning branding with workspace titles to maximise usable workspace without changing platform architecture.

---

# IMPORTANT

This is the final refinement of the platform shell.

This is **not** a redesign.

WX10 has already established the canonical platform shell.

This task simply removes unnecessary vertical space and strengthens branding.

No unrelated refactoring.

Remain fully compliant with all previous WX10 decisions.

---

# Rollback Protection (MANDATORY)

Before making any changes:

- Confirm git status.
- Create rollback tag/commit.
- Report rollback identifier.
- Save this specification as:

`docs/investigations/WX10F_PLATFORM_SHELL_HEADER_FINAL_REFINEMENT.md`

No implementation begins until rollback protection has completed.

---

# Architecture Compliance

Before implementation confirm:

✓ One canonical application shell

✓ One owner of branding

✓ One owner of navigation

✓ One owner of workspace commands

✓ No duplicate headers

✓ No duplicate logo ownership

✓ No duplicate navigation

If any fail:

STOP.

Report findings.

---

# Objective

Reduce the visual height of every authenticated page while making branding significantly stronger.

The application should immediately feel larger, calmer and more professional.

---

# Current issue

The current shell effectively creates:

```
Logo Row

↓

Workspace Header

↓

Workspace Navigation

↓

Content
```

This wastes valuable vertical space.

The logo also becomes visually detached from the workspace.

---

# Required Layout

Replace with:

```
────────────────────────────────────────────────────────

THA Long Logo

Page Title

Search

Workspace Actions

Basket

Profile

(all on ONE row)

────────────────────────────────────────────────────────

Workspace Tabs
Filters
Stages
Secondary Navigation

────────────────────────────────────────────────────────

Workspace Content
```

The first row becomes the permanent application header.

The second row becomes page-specific navigation only.

---

# 1. Full THA Logo

The full horizontal The Healthy Apples logo becomes permanently visible.

Never replace it with the single apple on desktop.

The single apple remains available only where explicitly required (mobile, compact icons etc.).

The logo is now the primary application brand.

---

# 2. Inline Workspace Title

The page title must sit on the same horizontal line as the logo.

Example:

```
THA Logo      Planner

THA Logo      Cookbook

THA Logo      Pantry

THA Logo      Shopping

THA Logo      Nutrition Report

THA Logo      Diary
```

NOT

```
THA Logo

Planner
```

---

# 3. Fixed Workspace Alignment

When collapsing or expanding the sidebar:

The workspace title must never move.

The content column owns the page title.

Only the sidebar width changes.

This creates a much more stable application.

---

# 4. Sidebar Position

The sidebar begins immediately below the permanent header.

It never extends behind the logo.

It never pushes the logo.

It never owns branding.

Ownership becomes:

```
Brand Header

↓

Sidebar

↓

Workspace
```

---

# 5. Workspace Commands

Search

Basket

Profile

Workspace actions

remain aligned in consistent locations across every page.

Every workspace uses identical positioning.

---

# 6. Reduce Vertical Height

The permanent application header should consume as little height as practical.

Target:

approximately one standard toolbar.

The result should recover significant vertical workspace on every page.

---

# 7. Preserve Workspace Navigation

Only workspace-specific navigation remains on the second row.

Examples:

Planner

• Week selector
• Planner actions

Cookbook

• My Cookbook
• Recipes
• Freezer

Shopping

• Add
• Review
• Prep
• Shop

Pantry

• Inventory
• Explore
• Larder
• Fridge
• Freezer

etc.

Nothing else should occupy this row.

---

# 8. Branding Hierarchy

The visual hierarchy becomes:

```
Brand

↓

Workspace

↓

Workspace Navigation

↓

Content
```

This should immediately reinforce product identity.

---

# 9. Consistency

Every authenticated page must follow exactly the same structure.

Planner

Cookbook

Shopping

Pantry

Nutrition

Diary

Dashboard

Meal Detail

Settings

No page-specific exceptions unless functionally required.

---

# 10. Preserve Existing WX10 Rules

Do NOT change:

Navigation ownership

Workspace ownership

Platform colours

Sidebar behaviour

Responsive rules

Desktop/mobile architecture

Only refine the shell.

---

# Deliverables

Provide:

• Before/after screenshots

• Desktop comparison

• Tablet comparison

• Mobile comparison

• Height reduction achieved

• Files modified

---

# Definition of Done

✓ Full THA logo permanently visible

✓ Logo inline with workspace title

✓ Sidebar starts below header

✓ Header reduced to single compact workspace row

✓ Workspace navigation remains second row

✓ Sidebar collapse never affects branding

✓ Page titles remain fixed

✓ More usable vertical workspace

✓ Identical shell across every authenticated page

✓ Existing functionality preserved

---

# Data Impact

Reads existing UI

No schema changes

No persistence changes

No backfill required

---

# Trust Check

This is a visual architecture refinement only.

No application behaviour changes.

---

# Scope Lock

Do not redesign pages.

Do not redesign workspaces.

Do not alter workflows.

Do not introduce new navigation.

Only refine the authenticated platform shell.
