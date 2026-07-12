---
entry: hid-add-meal-gateway
name: Add a Recipe gateway dialog (never rendered)
section: hidden-experiences
status: hidden
visibility: admin
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Add a Recipe gateway dialog (never rendered)

> A five-way "how would you like to add a recipe?" chooser, fully built with
> test ids, that is never rendered.

## What it is

`AddMealGatewayDialog` is a fully built chooser dialog offering five ways to add
a recipe, each with its own test id: import from URL, from social media, scan an
image, speak to input the recipe, and add a new recipe manually. It is complete
but never appears — no surface renders it.

## Where it lives

| | |
|---|---|
| Source | `client/src/pages/meals-page.tsx#L5527` |

## Why it is unreachable

The only reference to `AddMealGatewayDialog` in the entire repository is its own
function declaration at `meals-page.tsx#L5527`. It is never used as JSX, never
imported, never conditionally shown. It is built but wired to nothing.

## What it would take to reach it

One render site. Adding `<AddMealGatewayDialog onScan={...} />` behind an "add a
recipe" trigger — with state controlling its open flag — would surface the whole
chooser. The five branches it offers already exist.

## Evidence

> Its only reference in the codebase is its own function declaration.

Confirmed: a repository-wide search for `AddMealGatewayDialog` returns exactly
one hit, the declaration itself. The five options each carry a `data-testid`
(`button-gateway-import`, `-social`, `-scan`, `-speak`, `-manual`).

## Related

- [[jrn-add-recipe]] — the add-a-recipe journey this chooser was built for

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
