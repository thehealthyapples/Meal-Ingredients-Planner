---
entry: page-cookbook-grid
name: Cookbook Grid
section: pages
status: live
visibility: household
owner: Colin Clapson
route: /cookbook/grid
last_verified: 2026-11-05
version: 1
---

# Cookbook Grid

> The grid view of the household's saved recipes.

## What it is

The Cookbook Grid presents the same household recipe collection as the real-book
Cookbook, with search, filters, and a grid of recipe cards. Both views read the
same Meals owner and query; changing views does not create or copy recipes.

## Where it lives

| | |
|---|---|
| Route | `/cookbook/grid` |
| Source | `client/src/pages/meals-page.tsx` |
| Domain | [[dom-cookbook]] |

## Related

- [[page-cookbook]] — the real-book view of the same collection
- [[page-meal-detail]] — where a single saved recipe opens

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson._
