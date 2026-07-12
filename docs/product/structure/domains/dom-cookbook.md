---
entry: dom-cookbook
name: Cookbook
section: domains
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Cookbook

> The household's own collection of recipes — saved, imported, scanned or
> spoken — in one place.

## What it is

The Cookbook is where a household keeps its recipes. It groups them into the
household's own cookbook, wider recipe finds, freezer meals, and packaged
items, and lets a household search across them. New recipes can be added by
hand, imported from a web address or pasted text, scanned from an image, or
described by voice for the form to fill in. Meals from the Cookbook feed the
Planner and, through it, the shopping list.

Meals are user-scoped — a household sees its own saved recipes plus the shared
system meals. The canonical definition of what the underlying capability reads,
and where its honest gaps are, lives in its own card.

## Where it lives

| | |
|---|---|
| Route | `/cookbook` (also `/meals`) |
| Source | `client/src/pages/meals-page.tsx` |
| Capability | [Meals / Cookbook](../../../architecture/capabilities/meals.md) |

## Related

- [[page-cookbook]] — the page that renders this domain
- [[page-meal-detail]] — a single recipe in full
- [[jrn-add-recipe]] — adding a recipe
- [[cap-meals]] — the meals capability

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
