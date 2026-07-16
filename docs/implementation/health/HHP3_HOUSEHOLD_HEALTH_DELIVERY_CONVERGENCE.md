# HHP3 — Household Health Delivery Convergence — Implementation

**Status:** Complete
**Date:** 2026-07-12
**Governing architecture:** `docs/architecture/THA_DECISION_ENGINE_ARCHITECTURE.md` (DEC1) — §3 (a surface never re-ranks, re-budgets or re-derives what the engine delivered) and the one-owner-per-fact rule are what this workstream enforces.
**Depends on:** HNP1 (Household Nutrition Platform), HHP2 (Household Health producer enrolment), OD1/DEC1 (Opportunity Delivery Framework = the canonical Decision Engine), PHASE5C (`AmbientIntelligence` — the one ambient surface), ATTN1, LEARN1/EL2, COACH1.
**Closes:** HHP2 Remaining Gap **G2**.

---

## ROLLBACK PROTECTION

**Rollback identifier: `hhp3-rollback` → commit `9b1dea7af3c962d76da9b66490b8fe6927fe391f`**

A full snapshot of the working tree — **tracked modifications *and* untracked files** — taken before any HHP3 change, without touching HEAD, the index, or the working tree. Its parent is `b4a63af8` (*PHASE5E — Proactive Intelligence*).

This identifier was **created by the interrupted session and is preserved, not regenerated** (Rollback Protection Protocol §6). It was verified at resume: the snapshot contains the *pre-HHP3* `HouseholdNutritionPanel.tsx` and HHP2's binding, and does **not** contain HHP3's test file — which is the proof that it is genuinely the pre-HHP3 state rather than a snapshot taken mid-flight.

The branch carried substantial *uncommitted* work at the time (HNP1's and HHP2's own files among it), so a tag at `HEAD` alone would have protected none of the code HHP3 builds on. A second snapshot, `hhp3-inflight-20260712` → `60e7ac060ccc85633efc0750fca621023cd7a1ce`, was taken at resume to protect the *recovered* work before it was touched.

```bash
# Restore every file to its pre-HHP3 state:
git checkout hhp3-rollback -- .

# Inspect what HHP3 changed:
git diff hhp3-rollback
```

---

## THE FINDING THIS WORKSTREAM EXISTS TO FIX

HHP2 enrolled Household Health as a producer on the canonical Decision Engine, and recorded what it had deliberately left undone (its own Remaining Gap G2):

> *"the panel currently renders HNP1's opportunities **directly**, so a household could in principle see an opportunity on the panel that it has already dismissed in the Companion."*

That was live. `GET /api/household-nutrition` shipped HNP1's raw `opportunities` array, and `HouseholdNutritionPanel` rendered it — a **second delivery path that had never heard of dismissal**. A household could dismiss a nutrition opportunity in the Companion and be shown the identical card on the panel, forever, because the panel's copy reached it by a route the lifecycle did not govern.

**One fact, two owners.** HHP3 retires the second owner.

---

## IMPLEMENTATION

### The whole of it, in one sentence

The panel stopped rendering its own opportunities and mounted the **one ambient surface** scoped to the `nutrition` group the engine already assembles — and the read route **stopped sending the field at all**, so the bypass is unreachable rather than merely unused.

### 1. The panel converged (the actual HHP3)

`HouseholdNutritionPanel` no longer holds an opportunity object at all. It mounts `AmbientIntelligence` — the surface every other opportunity consumer in THA already mounts (PHASE5C) — scoped to `domains={["nutrition"]}`, the group **the Decision Engine itself assembled**. The panel *names* a group; it does not select, rank, filter or budget one.

Muting, dismissal, acceptance, the attention budget, LEARN1's re-weighting and COACH1's seen-yields-to-unseen ordering therefore apply on this surface **for free** — because they are applied once, in the engine that owns them, and the panel re-implements not one of them.

It shares the one canonical query key, so there is no second fetch and no second cache.

### 2. The bypass is closed AT THE SOURCE

`GET /api/household-nutrition` now destructures `opportunities` **out** of HNP1's report and serialises only the standing:

```ts
const { opportunities: _delivered, ...standing } = report;
res.json(standing);
```

This is the load-bearing half. Un-rendering the field would have left it on the wire for the next surface to find; **withholding it means a future surface cannot render an opportunity this route does not send.** The panel's wire type no longer names the field either.

The **producer path is untouched.** The `household-health` capability calls HNP1's assembler directly and still receives every opportunity HNP1 composes. The projection belongs to the HTTP read surface; the assembler is not aware it exists.

> **The distinction the whole workstream turns on.** A **standing** (score, dimensions, weekly summary, insights) is a statement about the week that is true whenever you ask it — it has no lifecycle, and you cannot "dismiss" a score. An **opportunity** is *advice*, and advice has a lifecycle: it can be muted, dismissed, accepted, learned from, budgeted and ranked against every other piece of advice competing for the same household's attention. Exactly one component in THA owns that. **Standing is read. Advice is delivered.**

### 3. Navigation — the surface got an address, and then a door

HHP2's G2 also observed that health opportunities were *"voiced, but not deep-linked"* — the Companion had nowhere to send a household who wanted to see more.

- The `nutrients` tab is now **URL-driven**: `/plant-diversity?view=nutrients`, following the existing `/pantry?mode=explore` precedent exactly. No new routing pattern is invented. An unknown or absent `view` falls back to a real tab, so a bad link lands somewhere honest rather than on an empty page.
- `/plant-diversity` now **resolves to the `nutrition` ConversationSurface** in `FloatingAssistant`. It previously resolved to `floating` — so a household standing *on* the Nutrition page was not on the nutrition surface, while HHP2 had been routing every health opportunity *to* that surface since enrolment. The engine's destination and the household's location are now the same place.
- A delivered health card **names its own domain** (`nutrition: "Your household"`) instead of falling through to the `Food` fallback label.
- **Home links to it.** `HOUSEHOLD_HEALTH_PATH` is the one canonical address, owned by `plant-diversity-page`; Home imports the constant rather than spelling the URL, so the link cannot drift from the surface it points at.

> **The gap this closed at resume.** The recovered work had *exported* `HOUSEHOLD_HEALTH_PATH` and **imported it nowhere** — the surface was addressable in principle and undiscoverable in practice. An address nobody can reach is not navigation. Home's entry card is that consumer, and §4 of the test now fails if the export ever loses its last one.

### 4. Home is a door, never a second mouth

Home's card carries the household's **standing** — score, band, and the honest denominator (*"Based on 3 of 4 measures"*) — and links onward. It renders **no opportunity**, and could not if it tried: the route it reads no longer sends any. Advice stays with the engine that owns its lifecycle.

It honours HNP1's **Trust Rule 1**: a household with no score is shown **no card** — never a `0`, never a *"get started!"* placeholder dressed up as a standing. It reuses the panel's exported wire type and the panel's query key, so there is one wire shape and one cache entry, not two.

---

## FILES CHANGED

Eight files. `git diff hhp3-rollback` against the working tree:

| File | Change |
|---|---|
| `client/src/components/HouseholdNutritionPanel.tsx` | **The convergence.** Renders no opportunity; mounts `AmbientIntelligence` scoped to the `nutrition` group. Wire type drops `opportunities` and is exported for Home. |
| `server/routes.ts` | **The bypass, closed at the source.** `GET /api/household-nutrition` withholds `opportunities` from the wire. Producer path untouched. |
| `client/src/pages/plant-diversity-page.tsx` | The `nutrients` tab becomes URL-driven and linkable; owns `HOUSEHOLD_HEALTH_PATH`, the one canonical address; safe fallback for an unknown `view`. |
| `client/src/pages/home-experience-page.tsx` | **Discoverability.** Home entry card → `HOUSEHOLD_HEALTH_PATH`. Standing only; silent when there is no score. |
| `client/src/components/conversation/FloatingAssistant.tsx` | `/plant-diversity` resolves to the `nutrition` surface — the one the engine already routes health opportunities to. |
| `client/src/components/intelligence/FoodOpportunityCard.tsx` | `nutrition` domain label added, so a health card stops announcing itself as `Food`. |
| `server/tests/test-hhp3-household-health-delivery-convergence.ts` | **New.** 39 assertions across 5 sections. |
| `package.json` | Registers `test:hhp3-household-health-delivery-convergence` in the suite. |

**No new capability, producer, adapter, opportunity type, notice category, route, scoring system or delivery logic.** HHP3 *deletes* a delivery path; it adds none.

---

## VERIFICATION

| Check | Result |
|---|---|
| `test:hhp3-household-health-delivery-convergence` | **39 passed, 0 failed** |
| `npm run typecheck:ci` (baselined gate) | **PASS** — baseline 168, current 168. No new type errors; zero errors in any file HHP3 touches. |
| `npm test` (full suite) | **PASS** (exit 0) |
| `npm run build` | **PASS** (exit 0) |

The test proves the convergence through the **real Decision Engine**, not a mock of it: a **dismissed**, a **muted**, and an **accepted** health opportunity are each shown to be absent from the `nutrition` group the panel reads, with each suppression accounted to its rule in the sealed `DeliveryDecision`.

Every source scan runs against **comment-stripped source** — the panel's own header explains at length that it renders no opportunities, and a naive scan would fail it for *saying so*. Stripping comments first makes each assertion mean what it claims, and makes it strictly harder to pass: a violation can no longer hide behind the word that describes it.

The "no second address" scan reads **all 227 client sources** and asserts exactly one file contains the address — its owner. It was checked against a negative control to confirm it is not passing vacuously on an empty file list.

---

## DEFINITION OF DONE

- [x] The Household Nutrition panel is converged onto the canonical Opportunity Delivery pipeline.
- [x] Duplicate opportunity presentation is removed — and removed **at the source**, so it cannot be re-opened by a future surface.
- [x] **Dismissed, muted and resolved** opportunities are respected on this surface — *proven end-to-end through the real engine, not asserted*.
- [x] Navigation to the Household Health surface exists, is addressable, and has at least one **production** consumer.
- [x] No new scoring system, opportunity system or delivery logic — enforced by comment-stripped source scan.
- [x] Typecheck, full test suite, and build all pass.

---

## TRUST CHECK

A household that dismisses a nutrition opportunity in the Companion will **not** see it again on the Household Nutrition panel — and one dismissed on the panel is gone from the Companion. There is now **one** delivery lifecycle rather than two. If the engine delivered nothing, the surface renders nothing: **silence is a correct and complete answer, and this surface never pads it.**

---

## ROLLBACK PLAN

| Item | Value |
|---|---|
| Rollback tag | `hhp3-rollback` → `9b1dea7af3c962d76da9b66490b8fe6927fe391f` |
| In-flight snapshot | `hhp3-inflight-20260712` → `60e7ac060ccc85633efc0750fca621023cd7a1ce` |
| Working tree | **Intentionally dirty** — the branch carries substantial uncommitted work from HNP1, HHP2 and prior phases. Both identifiers above are *snapshot commits* capturing tracked **and** untracked files; a bare tag at `HEAD` would protect none of it. |
| Restore | `git checkout hhp3-rollback -- .` |
| Verify after rollback | `npm run typecheck:ci && npm test && npm run build` |

**The on/off switch.** HHP3 has no feature flag, and needs none: restoring `server/routes.ts` to send `report` rather than `standing`, and the panel to render `OpportunityCard`, reinstates the old behaviour exactly — which is itself the clearest evidence that what was removed was a *path*, not a *capability*.

---

## REMAINING GAPS

**G1 — Product Knowledge Registry entries are still owed** *(inherited from HHP2 G1, unchanged).*
`docs/product/` does not exist; `PKR1`/`PKR3` deliberately define the registry and populate nothing. HHP3 adds a fourth owed entry to HHP2's three: the **Household Health surface** (`/plant-diversity?view=nutrients`) is now a canonical, addressable, Home-linked surface and belongs in the **Journeys/Routes** section the moment the registry is stood up. Recorded rather than silently skipped, per Rule KC12. *Owner: whoever stands up `docs/product/`.*

**G2 — A Companion notice is still not itself tappable.**
HHP2's G2 had two halves. The duplication half is **closed**. The deep-link half is **partially** closed: the surface now has a canonical address, the Companion resolves to the right surface, and Home links to it — but a *voiced notice* is still rendered as text with no destination of its own. Making a notice tappable requires threading a destination through the Notice/Delivery path, which is **new delivery logic** and therefore outside HHP3's scope lock. The address it would point at now exists, so whoever takes it inherits a wiring job rather than a product decision.

**G3 — the live-capability scope lock has 18 owners** *(inherited from HHP2 G3, unchanged).*
Unaffected by HHP3, which registers no capability.

**G4 — Home's entry card is a standing, not a summons.**
Home shows the household's score and links onward. It does **not** indicate that the engine has advice waiting on that surface — deliberately, because knowing *how many* opportunities are pending would require Home to read the delivered bundle, and a count is a claim the attention budget owns. Whether Home should carry such a signal is a genuine product decision, deliberately not taken here.

---

## SCOPE LOCK

HHP3 **converges** a surface and **deletes** a delivery path. It creates no scoring system, no opportunity system, no delivery logic, no capability, no producer, no adapter, no notice category, and no second destination — each enforced by an assertion in §5 of its test suite, not by intention.
