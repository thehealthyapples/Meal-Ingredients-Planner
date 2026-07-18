# ODL2 — Visual Language Foundation

**Date:** 2026-07-17
**Status:** Delivered — awaiting review. **No governance blockers remain.**
**Rollback:** `rollback/ODL2-visual-language-foundation-20260716` → `35d84533` (tag protects committed state only; the tree carries unrelated uncommitted work from concurrent sessions — CONV1 P4/P5 — untouched by this change)
**Scope:** The governed visual language, its values, and the rules that bound them. Home was not implemented and no page was redesigned.
**Evidence:** [`docs/ui-audit/odl2-vocabulary/`](../ui-audit/odl2-vocabulary/) — the vocabulary rendering from tokens, captured live
**Session record:** [`.engineering/session/runs/ODL2_Visual_Language_Foundation.md`](../../.engineering/session/runs/ODL2_Visual_Language_Foundation.md)

---

## 1. What this change is

ODL1 shipped the lawful subset of the North Star on Home and named three things
it could not ship — the orchard light, the warm depth vocabulary, the signature
hand — each blocked by governance rather than by engineering. ODL2 walks those
paths to the end.

It ran in two phases.

- **Phase 1 — the law.** Amend UIA § 4 to admit the depth and light vocabulary;
  make the Blueprint yield ownership; name the orchard's owner; record the
  signature disposition. Governance only, zero code.
- **Phase 2 — the values.** Choose the study, set the numbers, write the two
  rules that were missing, resolve dark mode, and retire the superseded tokens.

Phase 1 deliberately stopped short of values, on the grounds that the register
forbids authoring a foundation and adopting it later. **Phase 2 did not override
that rule — it satisfied it.** Every token admitted here has a real consumer in
the same change. That is the whole shape of Phase 2, and § 3.5 explains how.

**Nothing a household can see changed.** The proof is in § 6.

---

## 2. The canonical Orchard Design Language — it is Calm Orchard, and there is only one

**Finding: "the Orchard Design Language" is not a language. It is a session
codename for one that already exists, and defining it as a second thing would be
a defect.**

The brief was to *define the canonical Orchard Design Language*. The canonical
answer is that THA already has exactly one visual language, already defined,
already governing — `THA_UI_ARCHITECTURE.md` § 4:

> THA officially adopts **Calm Orchard** as its governing **Visual Language** (the canonical
> term; the discovery's "design language" is the same concept, renamed here once and finally).

Two rules make a separate "Orchard Design Language" unlawful rather than merely
redundant:

- **§ 4 already retired the term.** "Design language" was renamed to "Visual
  Language" *once and finally*. `ODL` is a workstream codename — it is not, and
  must never become, the name of a thing.
- **§ 4: "The language evolves; it is never forked."** A second named language,
  however well-drafted, is the fork that rule exists to prevent.

So ODL2 did not author a new design language. **It amended the one that exists**,
in the one place it lives. That is also what "reuse the existing UI architecture"
required: the UI Architecture is not a component library to be reused, it is the
law to be amended.

| Question | Owner | Where |
|---|---|---|
| How must it **look**? | **UI Architecture** | `THA_UI_ARCHITECTURE.md` § 4 (Calm Orchard), § 7, § 8, § 15, § 16 |
| How must it **feel**? | Experience Language | `THA_EXPERIENCE_LANGUAGE.md` |
| **Where** am I — which room, how much orchard? | Experience Blueprint | `THA_EXPERIENCE_BLUEPRINT.md` §§ 5–8 |
| How must it **behave**? | Experience Architecture | `THA_EXPERIENCE_ARCHITECTURE.md` — prevails over all of the above |

### 2.1 A precedence error, corrected before it did damage

The session began on the premise — inherited from ODL1's framing — that the
Blueprint **outranks** the UI Architecture, and could therefore license the depth
vocabulary. It cannot. The Blueprint says so itself:

> **Precedence, stated once.** Experience Architecture (behaviour) > this blueprint (vision
> and place) > nothing. … Beside it, **the UI Architecture owns the look** … **this blueprint
> overrides neither and is overridden by neither**. — Blueprint § 2.3

And § 2.2: *"**No visual values.** No colour, token, duration, easing, component,
or pixel appears in this document."*

Unchecked, ODL2 would have "admitted" a vocabulary from a document with no
authority to admit it — a governed-looking amendment that was void. The amendment
lands in **UIA § 4**, which owns the question; the Blueprint **yields** to it.

---

## 3. What was decided

### 3.1 The UIA § 4 amendment — the depth and light vocabulary

§ 4 now admits **four named members, and no more**: **the ground plane**
(materiality), **warm shadow** (depth), **one light** and **the penumbra** (warm
light). Not restated here — § 4 is its only home. In summary of its shape:

- The superseded rule (*"Content sits on soft, flat cards — no heavy shadows, no
  skeuomorphic depth"*) is replaced by a **bounded permission**, not deleted.
- Its defence is **relocated, not dropped** — from the *category* of depth to its
  *drama*. Three prohibitions carry it: depth describes space or it is
  decoration; it never carries meaning colour or words should carry; it never
  becomes a scene. § 11's stillness is unbent — the vocabulary is admitted
  **still**.
- A **"Why depth and not flatness"** rationale quotes the old rule verbatim,
  concedes it was right about the danger, and shows where the danger really lives.
- § 18 gains **□ Depth, light and ground discipline (§ 4)**, and its "One visual
  language" box — which still said *"flat calm surfaces"* — was corrected.

This follows, closely and deliberately, the **only amendment this document had
ever had**: UXHOME1's § 8 typography amendment, which admitted a third typeface
by the same four-part move.

**Orchard exposure** is divided rather than seized: *how much* orchard a room
admits is a question about **place**, so its E0–E3 scale and per-domain map stay
the Blueprint's. UIA § 4 admits only their **expression**.

### 3.2 The Blueprint yields ownership — in the same change

Blueprint § 18 required this, and it is the clause most easily missed:

> If a concern owned here later earns a fuller governing home (for example, the depth/light
> vocabulary graduating into the UI Architecture by amendment), **this document yields
> ownership in the same change** and cites the new owner.

Blueprint §§ 7–8 keep their *place* direction and now cite UIA § 4 for the
binding visual law; § 2.4 records that the amendment landed.

### 3.3 A contradiction resolved: the orchard had an owner, under the wrong name

Two live documents disagreed, and both were partly right. **Blueprint § 18.1**
said the environment asset *"has no named canonical owner… it needs one before
exposure levels become governed tokens."* **The adoption register** carried a
concern called *"Orchard exposure"* whose owner was `orchard-backdrop.tsx`.

The row owned **the image**, and its own text disclaimed the scale. So the asset
looked unowned and the scale looked owned — exactly backwards. The row was
misnamed, not miswritten. ODL2 renamed it **`orchard-environment`** and gave the
E0–E3 scale its own row. **Blueprint § 18 item 1 is closed**, and with it the
ordering gate that made exposure tokens unbuildable.

### 3.4 The signature typeface — ADOPT, recorded

The `signature-typography` row had stood since UXHOME1/ARRIVAL1 with a binary
disposition and a named owner: *"a brand decision, not an engineering one… made
by looking rather than by reading."* It was not ODL2's to reason out.

**Colin Clapson ruled ADOPT (2026-07-17).** Recorded in the register; the
**execution is deliberately not ODL2's** — it edits Home. The row is **not
discharged by the ruling**: ADOPT recorded and unexecuted is still an
authored-but-unadopted successor sitting live-looking in the tree. It closes when
the prototypes are deleted, not when the decision is minuted.

### 3.5 EXP4's study selection — A wins, on law rather than taste

EXP4 left three material studies awaiting a decision it said had to be *made by
looking*. So ODL2 looked, at the screenshots EXP4 captured for exactly that
purpose — and found the decision was not a matter of taste at all.

**Studies B and C set type directly on the orchard.** In their own composed
screenshots, the date, the "Today" heading, the state sentence, the reminder and
(in C) whole list rows sit on the landscape with nothing beneath them. That is
not a preference; it is prohibited:

> **The orchard never carries text.** Any surface where type must sit legibly gets ground
> plane under that type, **without negotiation**. Legibility is never traded for
> atmosphere. — Blueprint § 6.1

EXP4 had already reached the same verdict about C from the other direction —
*"C's naked ink is one step too little — support needs an anchor"* — without
naming the law it was bumping into. **Study A is the only study with a ground
plane**, which is the vocabulary's central member.

So A graduates. **B and C were deleted in the same change** (§ 17, retire on
introduction), with their routes and their capture-harness entries.

**A survives, briefly, and for a reason.** This is the one place ODL2 departs
from EXP4 § 6, which said all three studies die on graduation. EXP4 assumed the
ideas would graduate into a *language*; they graduated into *tokens*, and tokens
need a consumer. Deleting A would have left twenty-one tokens defined and adopted
by nothing — the authored-but-unadopted foundation the register exists to make
impossible, and the precise state UIA § 17 says it exists to end. So A was
migrated off its inline values onto the tokens and kept as the vocabulary's
**dev-only reference implementation**, with its deletion trigger recorded: it
dies when Home's E3 adopts the ground plane. This is the shape the register
already blesses for `signature-typography`.

### 3.6 The values

Every value lives in `client/src/index.css` — the one definition source (§ 16) —
and every one is graduated from Study A rather than invented.

**Orchard exposure.** E3 = **0.90**, the open view: exactly what arrival has
always shown, because `orchard-backdrop.tsx` hardcoded that number and now
resolves the token instead. E2 = **0.55**, the window: it must read as image (so
it cannot approach zero) yet never compete with the working content it frames (so
it sits well below E3). E1 and E0 = **0** — neither shows the image at all; E1's
"light only" and E0's warm canvas are `--background`, live since the scaffold and
needing no new token.

**Depth, light and ground.** The ground plane, its border and blur; the rim of
light and the ambient pool; five warm shadows (ground, primary, support, and
support's hover and press); the penumbra's surface tiers; and the radius ladder.
All lifted verbatim from Study A, which is why the reference implementation
renders identically.

**Dark mode is completely resolved** — § 16 forbids a partial mode, and Blueprint
§ 18.4 called this "unexplored design work". The resolution is that **the
daylight *is* the vocabulary, and at night there is no sun.** So every warm
shadow resolves to `none` rather than to a dimmer warm shadow: a warm shadow at
midnight is a lie about where the light comes from, and § 4 admits depth only to
describe space truthfully. Rank is carried instead by tint and border — the same
hierarchy, a different instrument. Study A had independently reached that answer
(`dark:shadow-none`), and the retired image-opacity token carried 0.18 at night
against 0.72 by day, corroborating E3's night value rather than inventing it.

**Two values no surface can yet verify, named as such:** E2 (no E2 room exists)
and the dark resolution (THA's dark theme is unreachable by any household — see
the `theme-colour-mode` row). Both are reasoned decisions with their reasoning
written down, in one place, cheap to correct the day something can show them
wrong.

### 3.7 The two missing rules

**The gradient contrast rule** (UIA § 15). A gradient has no single colour
pairing and therefore no contrast at all until one is declared. The rule: **a
graded surface carrying text is measured at the extreme of its range least
favourable to what sits on it** — clearing the floor at one end and failing at
the other is failing, and the average is not a defence. **A graded surface
carrying no text declares a ceiling instead** — the strength it may never exceed,
named as a token, so ambience cannot be turned up later by taste. This is what
EXP4 asked for when it flagged its own radial pool as needing *"a named token
with a stated ceiling"*; it is now `--light-ambient-ceiling`.

**The nested radius rule** (UIA § 4). EXP4 admitted its 1.75rem ground against
1rem cards *"happens to compose"*. The rule: **a surface takes the radius step
below whatever it rests on**, from a named ladder — ground, then what sits on the
ground, then what sits on that. Two surfaces at the same radius read as the same
plane; a surface curved *more* than its container reads as a mistake the eye
notices before the mind does. Depth is capped at three steps by *one ground per
workspace, never nested*.

---

## 4. The ownership map

| Concern | Law (who decides) | Implementation (what resolves it) | State |
|---|---|---|---|
| **Orchard environment** | Blueprint § 6.1 | `components/layout/orchard-backdrop.tsx` | ✅ **governed** — named by ODL2; closes Blueprint § 18.1; its raw-value defect fixed |
| **Orchard exposure (E0–E3)** | Blueprint § 6.2 (place); **UIA § 4** (expression) | `index.css` — `--orchard-exposure-e0..e3` | ✅ **governed** — valued, consumed by `orchard-backdrop.tsx` |
| **Materiality** (the ground plane) | **UIA § 4** (amended by ODL2) | `index.css` — `--ground-plane*`, `--surface-*`, `--radius-*` | ✅ **governed** — valued from Study A |
| **Depth** (warm shadow) | **UIA § 4** (amended by ODL2) | `index.css` — `--shadow-*` | ✅ **governed** — as above |
| **Warm light** (one light, the penumbra) | **UIA § 4** (amended by ODL2) | `index.css` — `--light-*` | ✅ **governed** — as above |
| **Signature typography** | **UIA § 8** (amended by UXHOME1) | `index.css` — `.text-signature`, `--font-signature` | ✅ **governed** — ADOPT recorded; execution pending |

**Why materiality, depth and warm light are one register row, not three.** EXP4's
central finding is that *"depth is believable exactly when it describes ONE room
— one ground, one light, one direction, every shadow explaining a distance."*
They are one vocabulary; three owners could drift, which is the exact failure the
vocabulary forbids. UIA § 17's *one canonical owner for every visual concern* is
honoured by keeping them one concern (`depth-light-ground`), with all three
questions named inside it.

---

## 5. Files changed

### Phase 2 (the values)

| File | Change |
|---|---|
| `client/src/index.css` | **The values.** Exposure E0–E3, ground, light, five warm shadows, penumbra tiers, radius ladder — light **and** dark. **Retired** two dead orchard tokens (a bare image-opacity, a parallax strength) and **renamed** the misnamed `--orchard-sidebar-opacity` → `--sidebar-tint-opacity` at identical values. |
| `client/src/components/layout/orchard-backdrop.tsx` | Raw `opacity: 0.90` → `var(--orchard-exposure-e3)` (= 0.90). Fixes a § 16 defect; makes the exposure scale's admission lawful by giving it a consumer. |
| `client/src/components/nav-bar.tsx` | `var(--orchard-sidebar-opacity, 0.40)` → `var(--sidebar-tint-opacity)`. Resolves to 0.65 exactly as before. |
| `client/src/pages/dev/material-a-warm-layers.tsx` | Study A migrated off inline arbitrary utilities onto the tokens; becomes the vocabulary's reference implementation. `dark:` variants deleted — the tokens resolve per mode. |
| `client/src/pages/dev/material-b-atmosphere.tsx`, `material-c-restraint.tsx` | **DELETED** — lost the selection (§ 3.5). |
| `client/src/App.tsx` | B and C lazy-imports and routes removed; A's role and deletion trigger recorded. |
| `scripts/capture-exp4-materiality-depth.ts` | B and C targets removed; now A's regression harness. |
| `docs/architecture/THA_UI_ARCHITECTURE.md` | **§ 15 gradient contrast rule**; **§ 4 nested radius rule**. |
| `docs/ui-audit/odl2-vocabulary/` | **New** — the vocabulary rendering from tokens, captured live, with a README. |

### Phase 1 (the law)

| File | Change |
|---|---|
| `docs/architecture/THA_UI_ARCHITECTURE.md` | **The § 4 amendment** — four members, three prohibitions, exposure-expression clause, "Why depth and not flatness". § 16 tiers widened. § 18 box added; "flat calm surfaces" corrected. |
| `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md` | Yields §§ 7–8 ownership to UIA § 4. § 18 **items 1, 3 CLOSED**; item 5 opened in Phase 1 and **closed by Phase 2**. |
| `docs/implementation/ux/adoption-register.json` | Row 38 renamed `orchard-environment`; rows 39–40 added and, in Phase 2, promoted to **governed** css owners with real consumers; signature **ADOPT** recorded. |
| `docs/implementation/ux/ADOPTION_REGISTER.md` | **Regenerated** via `npm run adoption:record` — generated, never hand-edited. |
| `docs/implementation/ODL2_VISUAL_LANGUAGE_FOUNDATION.md` | This document. |
| `.engineering/session/runs/…`, `CURRENT.md` | Session records; rollback `35d84533` preserved. |

---

## 6. Verification

1. **`npm run adoption:check` — 71 passed · 0 notices · 2 failed.** Baseline
   before ODL2 was **65 · 1 · 2**. The two failures are **byte-identical to
   baseline** and owned by concurrent sessions: `button-primitive` 539 > 538, and
   orphan `HouseholdNutritionPanel.tsx`. **Not masked, not "fixed"** — raising a
   ceiling to green a red gate is the one thing the register forbids doing
   quietly.
2. **The UI is unchanged, and this was proven rather than assumed.** In the
   production bundle: `--orchard-exposure-e3` resolves to **`.9`** (light) and
   **`.18`** (dark) — the arrival backdrop's old hardcoded `0.90`, exactly; and
   `--sidebar-tint-opacity` to **`.65`/`.28`** — the sidebar's old values,
   exactly. All three retired tokens are absent from the bundle. No household
   surface's rendering changed because no household surface's *numbers* changed.
3. **A silent bug was caught by looking, and only by looking.** Tokenising Study
   A broke **every shadow**: `shadow-[var(--shadow-primary)]` compiles to
   `--tw-shadow-color`, because Tailwind cannot tell a colour from a box-shadow
   inside a `var()` and guesses colour — so the surfaces rendered flat while the
   build, the typecheck and the gate all stayed green. Fixed with the explicit
   type hint `shadow-[shadow:var(--shadow-primary)]`, and verified in the
   compiled CSS (`--tw-shadow: var(--shadow-primary)` feeding `box-shadow`).
   The lesson is EXP4's own: a claim with no picture attached is a claim nobody
   checked.
4. **The vocabulary renders.** Live capture at 1440×900 and 390×844 —
   `docs/ui-audit/odl2-vocabulary/`. The ground plane, the warm
   single-directional shadows, the rim of light, the primary in the light and the
   support in the penumbra are all intact and identical to Study A's July-15
   material. **The orchard's absence in those shots is not a regression**:
   CONV1-P3 (BEH-7) retired the global wallpaper from rooms after EXP4 captured
   its evidence, so rooms now correctly stand at E1. Home's E3 remains a declared
   gap.
5. **EXP4's evidence was restored, not overwritten.** The capture run clobbered
   EXP4's July-15 screenshots; they were restored with `git checkout` and ODL2's
   verification moved to its own directory. A report's screenshots are the state
   of the world on the day it reported; rewriting them makes the report lie about
   itself.
6. **Build and typecheck clean.** `vite build` succeeds; no client typecheck
   errors. (The 304–305 pre-existing `server/intelligence/*` errors from
   concurrent uncommitted work are unrelated and unchanged.) `dist/` is
   gitignored and not committed.
7. **The `dark:` count fell 888 → 862** — that reduction *is* ODL2's: tokenising
   Study A and deleting B and C removed those variants, because a token that
   resolves per mode needs no `dark:` twin. (The earlier 895 → 888 step was a
   concurrent session's, auto-re-dated by `adoption:record`.)

---

## 7. Remaining blockers before North Star implementation

**None. The Home North Star can be implemented without a further architectural
decision.**

Every gate ODL1 and NORTH1 named is now open, and every decision Phase 2 was
asked to make has been made and written down:

| Was blocking | Now |
|---|---|
| UIA § 4 amendment (depth/light vocabulary unshippable) | ✅ Landed — Blueprint § 18.3 closed |
| The orchard's canonical owner (Blueprint § 18.1) | ✅ Named — `orchard-environment` |
| Exposure values as tokens by admission | ✅ E0–E3 valued, consumed, governed |
| Depth / light / ground values | ✅ Valued from Study A, consumed, governed |
| EXP4 study selection (A/B/C) | ✅ A, on law; B and C deleted |
| Gradient contrast rule | ✅ UIA § 15 |
| Nested radius rule | ✅ UIA § 4 |
| Dark mode equivalents | ✅ Complete — Blueprint § 18.4 closed for this vocabulary |
| Superseded orchard tokens | ✅ Retired, kept dead by pattern |
| Signature disposition | ✅ ADOPT recorded |

**What the North Star workstream inherits — execution, not decisions:**

1. **Build Home's E3** — consume `--orchard-exposure-e3` and the ground/shadow/
   light tokens on `home-experience-page.tsx`. The values exist; the reference
   implementation shows them working.
2. **Delete the reference** — `pages/dev/material-a-warm-layers.tsx` and
   `scripts/capture-exp4-materiality-depth.ts`, in that same change. This is
   recorded as the `depth-light-ground` row's closing trigger, and it completes
   EXP4 § 6's disposition for all three studies.
3. **Execute the signature ADOPT** — fold the arrival greeting into Home, move
   the Caveat `@import` into `index.css` (the webfont becomes a production
   download for the first time — a household's bandwidth, subject to § 15), name
   `/home` as the one permitted surface, and delete all eight arrival prototypes.
   ODL1 already built the greeting in the display voice, so it is one line plus
   the deletions.

**Two items are open but do not block Home**, and are named so they are not lost:

- **Blueprint § 18.2 — Home's two shell treatments.** Untouched by ODL2; the
  Blueprint's own open item, and a Home-shell question rather than a
  visual-language one.
- **E2's value and the dark resolution are unverified by any surface**, because
  no E2 room exists and THA's dark theme is unreachable. Neither blocks Home
  (E3 and daylight), and both are recorded with their reasoning in one place.

---

## 8. What ODL2 deliberately did not do

- **No Home visual was implemented, and no page was redesigned.** The only
  household-facing files touched are `orchard-backdrop.tsx` and `nav-bar.tsx`,
  each a raw-value-to-token swap at an identical number.
- **No new architecture.** UIA § 4 was amended, not forked; the Blueprint yielded
  rather than being overruled; the register's existing `css`-owner shape carried
  both new rows.
- **No red gate was made green.** The two pre-existing failures are reported.
- **No second design language was authored** — § 2.
- **EXP4/EXP5 were read as evidence, never as specification.** Blueprint § 2.4
  says those documents are *"never to be read as law"*, while § 18.3 called the
  amendment *"specified by EXP4 § 6 / EXP5 § 9.2"* — a contradiction the
  Blueprint never resolved. ODL2 resolved it the only lawful way: **the
  specification is UIA § 4's own text.**
- **The study selection was not made by taste.** A won because B and C break
  Blueprint § 6.1. Had all three been lawful, ODL2 would have said so and asked.

---

*Rollback: `git checkout rollback/ODL2-visual-language-foundation-20260716 -- docs/architecture/THA_UI_ARCHITECTURE.md docs/architecture/THA_EXPERIENCE_BLUEPRINT.md docs/implementation/ux/adoption-register.json docs/implementation/ux/ADOPTION_REGISTER.md client/src/index.css client/src/App.tsx client/src/components/nav-bar.tsx client/src/components/layout/orchard-backdrop.tsx client/src/pages/dev/ scripts/capture-exp4-materiality-depth.ts` then `npm run adoption:check` to confirm the 65 · 1 · 2 baseline returns. This document, the session records and `docs/ui-audit/odl2-vocabulary/` are additive and may simply be deleted.*
