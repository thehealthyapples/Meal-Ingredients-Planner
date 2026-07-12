---
entry: page-cookbook
name: Cookbook
section: pages
status: live
visibility: household
owner: Colin Clapson
route: /cookbook
aliases:
  - /meals
last_verified: 2026-07-11
version: 1
---

# Cookbook

> Where the household keeps its recipes, and adds new ones by link, photo, voice or hand.

## What it is

The household's recipe shelf. Saved meals are grouped and filtered across My
Cookbook, Recipes (imported from the web), My Freezer, and Packaged, with a search
box to find anything by name. The primary action is Add Recipe, which opens one
unified capture where a household can paste a link or recipe text, dictate it by
voice, scan a photo of a recipe, or simply fill it in by hand — THA structures
whatever it is given into a recipe card. Each meal card opens to its own detail
page and offers the actions that follow from a saved recipe.

## Where it lives

| | |
|---|---|
| Route | `/cookbook` |
| Source | `client/src/pages/meals-page.tsx` |

## Aliases

- `/meals` — an older address for the same page; it still resolves to the Cookbook.

## Related

- [[dom-cookbook]] — the domain this page belongs to
- [[jrn-add-recipe]] — the journey of adding a recipe
- [[page-meal-detail]] — where a single saved recipe opens

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
