---
entry: jrn-add-recipe
name: Add a recipe
section: journeys
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Add a recipe

> A household captures a recipe — from a link, a photo, their voice or their head — and saves it to the Cookbook.

## What it is

The single capture flow behind the Cookbook's "Add Recipe" button. Whatever form
the recipe arrives in, it funnels through one gateway, is structured into a recipe
card, and — once saved — offers the household what to do next.

## The path

1. **Open the gateway.** "Add Recipe" opens a dialog offering five ways in:
   - **Import from URL** — paste a recipe link (`POST` to the import endpoint);
     on a low-confidence parse it falls back to a text tab pre-filled with
     whatever the server could scrape.
   - **From social media** — the same importer in social mode (Instagram, TikTok,
     YouTube and more).
   - **Scan Image** — photograph or upload a recipe, reviewed via the scan-review
     dialog.
   - **Speak to input recipe** — dictate via the browser's SpeechRecognition; the
     transcript pre-fills the create form.
   - **Add new recipe** — type it in from scratch.
2. **Structure and save.** Each mode lands in the create-meal form, which saves
   the recipe to the Cookbook.
3. **Decide what's next.** On save, the meal-completion wizard opens
   ([[wiz-meal-completion]]) — plan it, add it to the basket and shopping list, or
   nothing.

## Where it lives

| | |
|---|---|
| Source | `client/src/pages/meals-page.tsx` |
| Source | `client/src/components/meal-completion-dialog.tsx` |

## Related

- [[page-cookbook]] — the surface this journey saves into
- [[wiz-meal-completion]] — the "what next" step after saving
- [[hid-add-meal-gateway]] — the gateway dialog that fans out the five capture modes

## Known defects

- `fnd-import-not-resumable` — the import and scan flows run entirely in ephemeral
  dialog state (the URL, the pasted text, the in-flight request are React local
  state with no persistence). If the household closes the dialog or leaves the page
  mid-import, nothing is saved to come back to; the capture starts over. See PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
