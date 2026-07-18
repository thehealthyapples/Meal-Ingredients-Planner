# ARRIVAL1 — The Definitive Home

**NORTH5's chosen arrival, built: the archway · one continuous plaster wall · a bounded oak console · a visible stone floor.**
Implementation. `/home` re-composed as a room. No data, hook, route, API or behaviour changed.

| | |
|---|---|
| **Session** | `ARRIVAL1_Definitive_Home` |
| **Date** | 2026-07-17 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `rollback/ARRIVAL1-definitive-home-20260717` → `10573dd2` (tag `arrival1-wip-snapshot-10573dd2`) |
| **Status** | **Awaiting review.** Built, rendered and verified across every breakpoint and state. |
| **Data impact** | Reads existing data only. **No** new business data, **no** meaning change, **no** backfill, **no** migration. |

---

## 1. What was built

NORTH5 chose the direction and named the composition; ARRIVAL1 builds it. `/home` is no longer a
dissolving open-view over a counter — it is a **room**, composed **wall → furniture → floor**
(NORTH5 § 4), blending **V2's orchard connection · V1's calm restraint · V3's oak materiality**:

- **The archway** — the emotional focal point. A plaster aperture cut into the wall, with the **real
  orchard** genuinely behind it and a blossoming branch crossing the top of the reveal. Seen *through*
  the architecture, never hung on it.
- **One continuous plaster wall** — a single warm-plaster surface behind the arch, the greeting, the
  Companion and the console. Cover the furniture and the wall is continuous behind it (the hand test).
- **A bounded oak console** — the day's information rests on it as **ivory objects on lit oak**, each
  with its own contact shadow. It is furniture: wall visible left and right, a light-pool from the
  arch, a shadow onto the wall behind and a contact shadow onto the floor. **Never** full-width,
  **never** a coloured band.
- **A visible stone floor** — the near ground the console stands on and the doors are set down on.

Everything the room contains — the greeting in THA's own hand, the Companion, the three glance facts
(meals · shopping · plants), the one resolver-aimed action, the four doors, the ambient surface, the
dashboard link, and every loading / error / empty / **unanchored** state — is **preserved unchanged**.
Only the composition and the materials moved.

---

## 2. The governing amendment (made before implementation)

The mission required resolving the documented archway conflict *"through the smallest explicit
governing amendment before implementation."* NORTH4 § 4.1 / NORTH5 G1 recorded it: Home is fixed at
**E3** (Blueprint § 6.2) and E2 carries *"framed by composition, **never by a drawn frame**"* — and an
arch is a drawn frame.

**The smallest amendment: one new rule under § 6.2, plus a pointer on the E3 row.** No value, token,
or other rule changed; every E2 room keeps the drawn-frame prohibition intact.

> **§ 6.2 rule 4 — An architectural aperture is not a drawn frame.** *(Amended ARRIVAL1.)* Home's E3
> open view **may** be composed as a **plaster architectural aperture — an arch cut into the wall, with
> a soft plaster reveal and no hard drawn edge**. What E2's clause forbids is the **decorative
> picture-frame** — the orchard mounted on the wall as a framed print. An **opening in the wall** is
> the opposite thing: the orchard is seen *through* the architecture, not hung *on* it. The line,
> testable: a frame you could lift off the wall and hang elsewhere is decorative and forbidden; a
> reveal the wall turns into, that the orchard is genuinely behind, is architecture and admitted. Home
> only; the aperture carries no type and never animates (§ 6.1 stands); it is a *composition* of the
> one E3 exposure, not a new level.

This is the resolution NORTH4 § 4.1 itself pointed to: *"architecture frames views with drawn frames;
that is what a window is"* — settled in the orchard's favour, for Home alone. `§ 7` (the sun) needed
**no** amendment: the arch's crop keeps the asset's upper-right flare out of the direct frame (V1's
safe crop), so the one-morning law is kept by composition as it always has been.

---

## 3. The composition, requirement by requirement

| Mission requirement | How ARRIVAL1 meets it |
|---|---|
| **Keep the canonical archway** | `OrchardArch` — a plaster aperture, the arch as the focal point at every breakpoint. |
| **One continuous plaster wall** | The `.home-arrival` background is a single plaster surface behind the arch **and** the console; the arch is a hole in it, the console stands in front of it. |
| **A bounded oak console/sideboard** | `.home-console` — `max-w-4xl mx-auto`, wall visible left and right; a lit oak surface (light-pool, faint grain) casting a shadow onto the wall and a contact shadow onto the floor. |
| **Visible stone floor** | `.home-floor` — a warm stone ground at the base of the room; the console stands on it, the doors are set on it. |
| **The orchard beyond the arch** | The real `ORCHARD.png` (converted to `/orchard.webp`) seen through the opening, receding down the mown path, blossom crossing the reveal. |
| **Keep existing data, hooks, routes, APIs, behaviour** | Every query, memo, the HOME2 resolver call, the unanchored logic, all testids — byte-preserved. Only JSX structure and surface classes changed. |
| **wall → furniture → floor** | The load-bearing law; verified by the hand test in the renders (§ 6). |
| **No orchard banner over a dashboard** | The orchard is a *bounded arch* (wall around it), not a full-width strip; the day sits on *furniture*, not a lower panel. |
| **No horizontal colour bands / no full-width oak** | The console is bounded (plaster margins L+R, even on mobile — 16px + rounding + shadow); the floor is stone close to plaster (a receding ground, not a band). |
| **No duplicate state/data/routes/Companion behaviour** | Nothing added to any of these. The Companion card renders the Behaviour Engine's sentences verbatim, as before. |
| **No fabricated content** | The petal-light is a soft glow (not a fake cut-out branch); every fact is data-borne; absences render as calm empty copy. |
| **Quiet state feels intentional and complete** | The unanchored default (192/195 households) reads as a calm counter with honest "nothing yet" copy, the arch still the focal point — a quiet morning, not a broken dashboard (§ 6, `real`/`quiet`). |

---

## 4. Scope decisions

**The orchard asset — the real orchard, adopted (not authored).** Home now shows `/orchard.webp`,
converted (ImageMagick; `sharp`/`cwebp` absent) from the **owner-supplied** canonical
`attached_assets/design/north_star/v2/ORCHARD.png` — the v2 North Star asset with apple trees, blossom
and the oak gate. This honours Colin Clapson's 2026-07-17 ruling (the orchard is a brand asset,
*supplied separately and adopted through the owner*): ARRIVAL1 authored **no** substitute, only a
format/serve conversion (3.1 MB PNG → **393 KB webp**) of the owner's own image, mounted through the
one owner (`orchard-backdrop.tsx`) as a third governed shape. The old meadow `/orchard-bg.webp` is
**byte-untouched**.

**The palette — the orchard *material* palette, Home-scoped.** The wall (plaster), floor (stone),
furniture (oak) and info surfaces (ivory) use the NORTH4-derived orchard materials, and Home's green
+ accent are the orchard's own (leaf-in-shade, **hue 74**) — all scoped under `.home-arrival`, so **no
other room changes**. The global `--primary` (hue 132) is **left byte-untouched**: the platform-wide
green swap (NORTH4 D1) is the owner's decision with product-wide blast radius, deliberately **not**
taken here to honour *"no unrelated refactoring / changes existing meaning: no."*

---

## 5. Files changed

| File | Change |
|---|---|
| `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md` | § 6.2 rule 4 + E3 row note — the archway amendment. |
| `client/src/components/layout/orchard-backdrop.tsx` | Added `OrchardArch` (third governed shape on the one owner), referencing `/orchard.webp`. |
| `client/src/index.css` | Added the `.home-arrival` block: orchard material tokens (Home-scoped), the plaster wall, stone floor, plaster arch, oak console, ivory object, and door classes. |
| `client/src/pages/home-experience-page.tsx` | Re-composed the return as wall → arch → arrival → oak console → floor/doors. All data logic, hooks, states and testids preserved. |
| `client/public/orchard.webp` | **New** served asset — the real orchard, converted from the owner's `ORCHARD.png`. |
| `docs/implementation/ux/adoption-register.json` | Updated the `orchard-environment` entry (third shape `OrchardArch`, the adopted asset, Home's floor). |
| `scripts/capture-arrival1-home.ts` | **New** — the verification harness (states × breakpoints). |
| `docs/ui-audit/arrival1-home/` | **New** — the renders below. |

---

## 6. Screenshots (`docs/ui-audit/arrival1-home/`)

| State / breakpoint | File |
|---|---|
| **Whole room** (wall → furniture → floor, hand test) | `closeup-room-full.png` |
| **The oak console** (ivory objects on oak) | `closeup-console.png` |
| Populated — desktop / tablet / mobile | `populated-desktop.png` · `populated-tablet.png` · `mobile-tall-populated.png` |
| Quiet / unanchored — desktop / tablet / mobile | `quiet-desktop.png` · `quiet-tablet.png` · `quiet-mobile.png` |
| **Real** household (as shipped — the unanchored default) | `real-desktop.png` |
| Loading (skeletons on the console) | `state-loading.png` |
| Error (canonical LoadError on the console) | `state-error.png` |
| Full mobile room element | `mobile-room-populated.png` |

The renders are the **real** authenticated `/home` at `deviceScaleFactor: 2`, driven through the
dev-world login with the states mocked at the API boundary.

---

## 7. Tests

| Test | Result |
|---|---|
| **HOME2 primary-action resolver** (`test:home2-home-primary-action`, in the main suite) — the resolver `/home` consumes to aim its one action | **47 passed · 0 failed.** Unchanged: ARRIVAL1 preserved the resolver call and its inputs exactly. |
| Production build (`npm run build`) | **Clean.** Client + server compile; `dist/public/orchard.webp` emitted. (4 pre-existing `import.meta`-in-cjs warnings in unrelated CI scripts.) |
| Adoption register gate (`adoption:check`) | **80 passed · 2 failed — both pre-existing, provably not mine** (§ 8). |
| Typecheck (the two changed TS files) | **No new errors.** |

**Tests relevant to Home, and the main suite.** The only Home-specific test is the HOME2 resolver
(above), and it **is** in the main `npm test` chain (141 tests) — it is not excluded. There is **no
Home test outside the main suite**: the client page itself has no unit-test harness in this repo
(there is no client component test runner), so it is verified by the rendered states in § 6 rather than
by an excluded test. ARRIVAL1 changes **only** client presentation (TSX/CSS/asset) plus one doc and one
register — it touches **no** server or `shared/` code, so the rest of the 141-test chain (green today
per the P0 session) is not exercised by this change.

---

## 8. Honest gaps and pre-existing failures

- 🟠 **Two orchards in the product.** Home now shows the real orchard; arrival (`/auth`, `/onboarding`,
  the landing) and the five dialog/list bypasses (`dialog.tsx`, `list-page.tsx`,
  `shopping-list-page.tsx`, `onboarding-page.tsx`, `shopping-workspace-page.tsx`) still show the pale
  meadow `/orchard-bg.webp`. Converging every surface onto the real orchard — and closing those five
  `url()` bypasses (the standing `orchard-environment` openMigration) — is platform-wide and **out of
  Home's scope**; recorded, not hidden.
- 🟠 **The global orchard-green palette (NORTH4 D1) is not adopted.** `--primary` is still hue 132
  everywhere except Home. Home speaks the orchard's green in-scope; the platform-wide swap remains the
  owner's decision (blast radius = every button in every room).
- ⚪ **`OrchardOpenView` is now dead** (no consumer) — left in place (with its masks) rather than
  removed, to avoid unrelated refactoring; it documents the prior E3 approach and is retired from
  `/home` in the register.
- ⚪ **Still open from NORTH3, unchanged:** the shell header reads **"Home"** above "Welcome home,
  Chloe"; the four doors duplicate the four in the bottom nav; the signature is Caveat (the serif-vs-
  Caveat decision, NORTH4 D4, is unaddressed here).
- 🔴 **Two pre-existing adoption failures, provably not mine** (both recorded by today's P0 / FI18
  sessions): (1) `button-primitive` rival count 539 vs ceiling 538 — **my two changed files contain
  zero raw `<button>` elements**, so the rise is sibling/pre-existing, not ARRIVAL1; (2) orphan
  `HouseholdNutritionPanel.tsx` — a **sibling-session file** I never touched. Neither can be caused by
  a change that adds no `<button>` and does not create that module.
- ⚪ **`ADOPTION_REGISTER.md`** (the human-readable render) was left as the siblings left it; the
  canonical source is `adoption-register.json`, which I updated and which the gate reads.

---

## 9. Verification summary

| Check | Result |
|---|---|
| Governance amendment before code | ✅ Blueprint § 6.2 rule 4, smallest explicit amendment. |
| wall → furniture → floor (hand test) | ✅ Continuous plaster behind arch + console; bounded oak; stone floor. |
| Desktop / tablet / mobile | ✅ All three; mobile keeps the console as furniture (not a card stack, not a band). |
| Populated household | ✅ 3 meals · 5 shopping · 28/30 plants · Companion · resolver action. |
| Quiet / unanchored household | ✅ Intentional and complete — a calm counter, not a broken dashboard. |
| Companion · primary action · meals/shopping/plant facts · navigation | ✅ All present and correct. |
| Loading · error states | ✅ Skeletons on the console; canonical LoadError on the console. |
| Existing data / hooks / routes / APIs / behaviour | ✅ Unchanged — presentation only. |
| Build · HOME2 tests · adoption (2 pre-existing fails) | ✅ / ✅ 47·0 / ⚠️ not mine. |
| Migration | **None.** |

---

*ARRIVAL1 — the definitive Home, built from NORTH5. The archway is the room's signature, the orchard
is real and beyond it, and the day is placed on oak furniture standing on a stone floor against one
continuous plaster wall.*
