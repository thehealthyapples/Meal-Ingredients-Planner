# UIA1 — UI Architecture Discovery — Investigation

**Date:** 2026-07-10
**Branch:** `int1-intelligence-platform`
**Type:** Investigation only. No code, schema, route, or capability change.
**Risk:** 🟢 GREEN (read-only investigation)

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/UIA1-ui-architecture-discovery-20260710` → `2fa5f610ea9afc995565fb604a3ae1ae6dcedfd5` |
| Working tree | Intentionally dirty — carries staged, uncommitted `.engineering/` (EOM1/ESR2), `docs/architecture/` (incl. the new `THA_EXPERIENCE_ARCHITECTURE.md`, EXP1) and related work authored by a parallel session. Not authored by this session; not touched; not committed by this session. The tag protects committed state only and does **not** cover that work. |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md`
- [x] `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md` (EXP1 — governing; currently uncommitted in the working tree)
- [x] `docs/architecture/THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md`
- [x] `docs/architecture/INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md`
- [x] `docs/architecture/THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` (Part 11, Trust & Personality)
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md`
- [x] `docs/architecture/REPOSITORY_CONVENTIONS.md` (filing/naming)
- [x] Prior UX audits and foundations: `UI1_CANONICAL_UI_OWNERSHIP_AUDIT.md`, `THA_COMPREHENSIVE_UI_DENSITY_AND_BREATHING_SPACE_AUDIT.md`, `THA_ADAPTIVE_DENSITY_FOUNDATION.md`, `THA_DIALOG_FOUNDATION.md`, `THA_DIALOG_WIDTH_STANDARDISATION_AUDIT.md`, `THA_ADAPTIVE_LAYOUT_ENGINE_AUDIT.md`, `WX16_PLATFORM_WORKSPACE_DRAWER_ARCHITECTURE.md`, `docs/ui-audit/WX9A_LAUNCH_EXPERIENCE_VISUAL_AUDIT.md`
- [x] `docs/implementation/ux/UX0_HOME_EXPERIENCE.md`, `docs/implementation/ux/UX1_CANONICAL_BOTTOM_NAVIGATION.md`

---

## QUESTION

What visual design direction should the future governing **THA UI Architecture** take so that every surface expresses the Companion philosophy — calm, family-focused, honest — with visual consistency, and what must that document contain?

---

## METHOD

Three parallel evidence sweeps over the working tree at `2fa5f610` (plus the uncommitted EXP1 work present in the tree):

1. **Design-system foundations audit** — `tailwind.config.ts`, `client/src/index.css`, `components.json`, `client/index.html`, `client/src/components/ui/*`; grep counts of token vs raw-palette usage, text sizes, icon sizes, animation classes.
2. **Page-level consistency audit** — all 35 files in `client/src/pages/`, the app shell (`App.tsx`), headers, cards, forms, dialogs, empty/loading/error handling, responsive and accessibility patterns; per-page component counts.
3. **Prior-documentation review** — the governing experience documents and every prior UX audit/foundation, extracting what is already canon and what was left unresolved.

Counts below are grep-based measurements (commands reproducible from the cited patterns); they are approximate where a pattern can over/under-match, and are labelled as such. Key structural claims (orphaned `PageHeader`, absent dark-mode toggle, absent `EmptyState` component) were independently re-verified by direct grep before writing.

Nothing was changed: no code, no schema, no routes, no capabilities.

---

## CONTEXT — WHERE A UI ARCHITECTURE SITS

The Experience Architecture (EXP1, adopted 2026-07-10) is the governing law for how THA *feels*: eight Experience Principles, a fixed information hierarchy, navigation philosophy, language, error, notification, and accessibility principles, and a mandatory UX Governance Checklist. It **explicitly disclaims** being "a visual style guide (colours, typography, spacing are implementation-level…)" and "a component library specification" (`THA_EXPERIENCE_ARCHITECTURE.md` §1).

That disclaimed territory is exactly the gap this investigation maps. The future **THA UI Architecture** is the visual constitution that sits *beneath* the Experience Architecture and *above* the component code:

```
Experience Architecture (EXP1)   — how THA must feel        (governing, exists)
        ↓
THA UI Architecture (future)     — how that feeling looks    (governing, this gap)
        ↓
Component library & tokens       — how the look is built     (implementation)
```

Every recommendation below is an elaboration of an EXP1 principle into visual terms; none contradicts it.

---

## FINDINGS

### F0 — The root problem is convergence, not absence *(observed)*

THA does not lack design standards; it lacks **adoption and retirement of them**. Authored foundations with measured adoption:

| Foundation | Authored | Adoption today |
|---|---|---|
| `useAdaptiveDensity()` three-tier density model | `hooks/use-adaptive-density.tsx` | 1 page (`meal-detail-page.tsx`) |
| Dialog Foundation (sizes × presentations) | `ui/dialog-foundation.ts` | 2 of ~40 dialogs; presets self-documented as unused (`dialog-foundation.ts:172-177`) |
| Intelligence card system + tokens (WX2_5) | `components/intelligence/*`, `intelligence-tokens.ts` | 7 wrappers + 1 page; barrel bypassed (UI1 §5.5) |
| Typography utilities (`.title-page`, `.title-section`, `.title-card`) | `index.css:339-367` | Marginal; headers hand-roll `text-[22px]`/`text-[17px]` |
| Spacing tokens `--space-1..8` | `index.css:52-57` | Effectively unconsumed in TSX |
| `PageHeader` (realm-aware, scroll-collapse, density-migrated) | `components/PageHeader.tsx` (322 lines) | **Zero importers** — superseded by `workspace-header.tsx` (16 pages), never retired |

Six foundations, one pattern: infrastructure lands, migration never completes, the predecessor is never retired (Core Principle 8 debt). UI1 quantified the residue: 44 orphaned modules, 10 duplicate/competing implementation sets, `useIsMobile` defined six times with disagreeing breakpoints (Planner ≤767px vs Cookbook ≤1023px — WX16). **Any UI Architecture that is merely another foundation will meet the same fate.** It must be a *governing* document with a compliance gate and retire-on-introduction teeth, like EXP1.

### F1 — A real design language exists but is ungoverned *(observed)*

The WX9A launch audit found a "coherent, calm, and branded visual identity" and named it **"Calm Orchard"**: warm cream background (`--background: 42 27% 95%`), muted sage-green primary (`132 14% 44%`), amber secondary (`42 89% 61%`), DM Sans display over Inter body (`index.css:40-41`), frosted `shadow-none` cards (`ui/card.tsx:12` — `bg-card/82 backdrop-blur-md`), an orchard backdrop, and a ten-realm accent system (`index.css:155-294`) tinting each area of the product (cookbook, planner, pantry, analyser, diary, basket, list, home, nutrition, shopping) in light *and* dark variants.

This language is described only in an audit. **No governing style/brand/token document exists anywhere in `docs/`** (grep for style guide / design token / brand / palette across docs/ — only descriptive mentions). The name "Calm Orchard" appears in exactly one file.

### F2 — A two-speed token system *(observed)*

Semantic tokens dominate the neutrals: `text-muted-foreground` ~1,920 uses, `text-foreground` ~510, `text-primary` ~387, `bg-muted` ~343. Buttons are token-pure — 0 raw palette-colour overrides across 532 `<Button` uses; the CVA variant system (`ui/button.tsx:12-24`) is respected.

But the moment a surface needs to express **status or emotion**, it falls off the token system, because none exists for it: there are **no success / warning / info semantic tokens**. Raw Tailwind palette usage in `client/src/**/*.tsx` (approximate grep counts): amber 194, green 141, emerald 113, red 74, blue 54, yellow 41, orange 38, teal 25, rose 23 — **612+ matches** on the narrow green/emerald/amber/red/blue probe alone. Representative: `meal-completion-dialog.tsx:241` (`text-green-500`), `product-picker-sheet.tsx:302-305` (green/red border-text pairs), `ShoppingListScanReview.tsx:156` (six-class emerald light/dark stack).

Consequences: three competing "greens" (token `primary`, `green-*`, `emerald-*`) with no single source of truth for "good"; amber does double duty as brand secondary and ad-hoc warning; every status colour hand-writes its own dark variant (or forgets to).

Token fragments also disagree with each other: `--radius: 0.75rem` (`index.css:36`) vs Tailwind `borderRadius.lg = 0.75rem` (`tailwind.config.ts:8-12`) vs `Card`'s `rounded-xl` (1rem) — three sources for card radius (first flagged by the density audit, still true).

### F3 — Typography: good bones, tiny defaults, duplicated fonts *(observed)*

Inter + DM Sans are the real typefaces (`index.css:1,40-41`; headings take `--font-display` at `index.css:145-148`). Weight discipline is good (medium ~760, semibold ~346, bold only 17). But:

- The measured type-scale usage skews **tiny**: `text-xs` ~1,271 and `text-sm` ~887 versus `text-base` ~105 — the app's de-facto body size is 12–14px. For a family product spanning ages and eyesight, this is a legibility and calm problem, not just a style one.
- The named scale (`.title-page` 32/`.title-section` 22/`.title-card` 16) is under-adopted; the two header components disagree on title size (`PageHeader.tsx:188` `text-[22px]` vs `workspace-header.tsx:245` `text-[17px]`).
- `client/index.html` loads **~30 Google font families** (Architects Daughter, Geist, Poppins, Playfair, …) of which the design uses two — dead payload and a drift hazard.

### F4 — Spacing and density: model endorsed, never applied *(observed)*

The adaptive layout audit endorsed compact/comfortable/expanded as "THE design system for THA"; Phase 1 built `useAdaptiveDensity()` (`use-adaptive-density.tsx:35-39` — <640 / 640–1280 / ≥1280, plus touch/orientation/ultrawide signals). Phases 2–4 (components → pages → CSS tokens) were never executed. Meanwhile five components keep private `useIsMobile` copies with divergent breakpoints, so a 900px tablet is "mobile" in Cookbook and "desktop" in Planner (WX16). Spacing itself is ad-hoc Tailwind utilities; the density audit's chip finding ("four different chip heights in the same application") and sub-minimum mobile touch targets remain unaddressed.

### F5 — Components: one primitive set, many competing descendants *(observed)*

The base is healthy: shadcn/ui "new-york" with 50 primitives (`components.json`), single icon library (lucide-react, 126 files, zero mixed sources), single toast system (`use-toast.ts`, `TOAST_LIMIT = 1`).

Above the primitives, ownership fragments:

- **Headers:** live `WorkspaceHeader` (16 pages) vs orphaned `PageHeader` (0 imports); ~19 pages (admin fleet, auth, onboarding, food-detail, old home) use neither and hand-roll title blocks (`admin-page.tsx:174-178`, `food-detail-page.tsx:152-156`).
- **Cards:** `ui/card.tsx` (33 importers, 154 instantiations) plus 9+ bespoke card components and hand-rolled `rounded-*+border+bg` divs (7 in `shopping-workspace-page.tsx` alone); paddings diverge (`p-4` primitive vs `p-5` on Home vs `p-6`/`p-10` on the old landing page); shadows re-added ad hoc against the `shadow-none` primitive (`admin-page.tsx:115`).
- **Intelligence cards:** two lineages — the documented WX2_5 system (`IntelligenceCard` + trust-specific cards + `intelligence-tokens.ts`) and ~18 older bespoke `*Panel`/`*Companion`/`*Strip` components.
- **Brand marks:** the apple has 3–4 owners; 19 raw PNG imports bypass `ThaAppleIcon`; two live `AppleRating` implementations with the same name and different semantics (UI1 §5.2, §5.4).
- **Dialogs:** 33 Dialog / 12 Drawer / 5 Sheet consumers choosing among 23+ distinct widths (`max-w-sm` ×36 … `max-w-[1920px]` ×19), foundation unadopted.

### F6 — Forms: two pages use the form system; the rest hand-roll *(observed)*

`react-hook-form` + shadcn `Form`/`FormField` appear in exactly 2 pages (`auth-page.tsx`, `meals-page.tsx`). Everything else wires raw `<Input>` + `useState` with ad-hoc labels and error text (food-diary 13 inputs, profile 12, shopping-list 8 …), plus raw HTML `<input>` in places. There is no shared label/help/error presentation, and therefore no consistent accessible error announcement.

### F7 — Empty, loading, and error states: three unowned state vocabularies *(observed)*

- **Empty:** no `EmptyState` component exists (verified). ~19 bespoke "No meals/items/results…" strings; the best examples are UX0's honest one-liners (`home-experience-page.tsx:189,240`), which embody Core Principle 6 but as copy, not as a reusable pattern.
- **Loading:** three coexisting idioms — `Loader2` spinners (22 pages; `meals-page.tsx` has 37 `animate-spin`), literal "Loading…" text (meals 46, planner 20), and skeletons in only 7 mostly-admin pages. The same product loads three different ways.
- **Errors:** toasts are the de-facto channel (309 `toast(` calls, 23 pages); ~10 pages also use inline destructive `Alert`; and there is **no ErrorBoundary anywhere** (verified — 0 matches) — an uncaught render error blanks the app, the least calm failure possible and a direct conflict with EXP1 §14 ("Recovery is one action away", "never stranded on a broken screen").

### F8 — Navigation: recently made canonical; presentation now stable *(observed)*

UX1 established one `NAV_ITEMS` source (`nav-bar.tsx:39-48`), one `BottomNav` across all breakpoints (`nav-bar.tsx:718-752`, `aria-current`, 44px targets), Home-first order, retired-but-dormant `DesktopSidebar`. `App.tsx` is the sole composition root. This is the strongest recent convergence and the model to emulate; the open item is deleting the dormant predecessors.

### F9 — Responsive: sound shell, hostile extremities *(observed)*

The shell adapts on `md:`; but the admin surfaces are wide-table monoliths with no small-screen form (125 table refs in `admin-knowledge-review`, 121 in `admin-observation-workbench`), fixed widths up to `w-[1920px]` (×17) exist, the Planner grid is cut off at the fold at 1440×900 (WX9A, open), and the roadmap itself flags responsive design as "the largest gap".

### F10 — Accessibility: strong where recent, thin elsewhere *(observed)*

Recent work is exemplary (BottomNav: `aria-current`, `aria-label`, 44px targets). Elsewhere: `aria-label` coverage is far below interactive density (`meals-page.tsx`: 82 `<Button>` vs 7 `aria-label`; `shopping-list-page.tsx`: 38 vs 6), `sr-only` is rare outside vendored primitives, only 9 files reference minimum touch-target sizing, `text-[9px]`/10px labels persist below any legibility floor, and reduced-motion is not respected anywhere (no `prefers-reduced-motion` handling found) despite framer-motion in 11 files. EXP1 §16 makes accessibility a design input; the codebase currently treats it as a per-component afterthought. *(Inferred: many icon-only buttons lack accessible names — inferred from count deltas, not from exhaustive per-button inspection.)*

### F11 — Motion: two engines, no policy *(observed)*

`tailwindcss-animate` + framer-motion (11 files) + three brand keyframes (`appleBounce`, `glowPulse`, `appleShake`, `index.css:390-423`) + ~824 ad-hoc `transition-*`/`animate-*` usages with inline durations. No duration/easing tokens, no reduced-motion fallback, no principle for when motion is allowed. EXP1 §6 says motion is "spent only on what genuinely needs it".

### F12 — Dark mode: fully authored, unreachable *(observed)*

A complete `.dark` token set (`index.css:86-133`), dark realm palette, and ~538 `dark:` utilities exist — yet no ThemeProvider, no toggle, no `classList` manipulation anywhere in `client/src` (verified). Users cannot reach a mode the codebase pays continuous maintenance cost for. *(Unknown: whether the Replit host shell ever injects the `.dark` class.)*

### F13 — Where the current UI conflicts with a calm, family-focused experience *(observed + inferred)*

1. **Density extremes** — `meals-page.tsx` (6,868 lines; 82 buttons, 29 badges, 17 cards, 9 tab sets in one surface) and `shopping-list-page.tsx` (4,251 lines) cannot pass EXP1's "one primary action" or "emphasis is a budget" tests. *(Observed counts; the calm judgement is inferred.)*
2. **Toast-as-firehose** — 309 toast calls with a celebratory idiom in places; EXP1 §13 demands "Saved", not "Success!".
3. **Status-colour noise** — 612+ raw palette accents mean many surfaces speak in unsanctioned reds/ambers/greens, i.e. urgency the design system never budgeted (EXP1: "if everything is highlighted, nothing is").
4. **Spinner flicker + "Loading…" text everywhere** reads as machinery, not companionship; skeletons (calm shape-preserving loading) are the minority pattern.
5. **Crash behaviour** — no error boundary; the worst-case experience is a white screen.
6. **12px default body text** strains the very household members a family product must include.
7. **Known open regressions** — Profile page's off-palette background ("looks like a different product" — WX9A), Planner fold cut-off, partner-initials-not-logos.
8. **Emoji used as icons** (~67 pictograph matches) alongside lucide — tonal inconsistency.

### Unknowns

- Whether the host environment ever activates `.dark` (F12).
- Real-user device mix — recommendations assume mobile-first per the Companion Card principle, unverified against analytics.
- Whether `hover-elevate`/`active-elevate-2` (Replit-injected utilities on Button, `button.tsx:9`) are a dependency THA wants to keep — they are not defined in authored CSS.
- Actual WCAG contrast measurements — no contrast audit has been run; the palette's compliance is unmeasured.
- Which admin surfaces need mobile support at all (audience unknown to this investigation).

---

## RECOMMENDATIONS

Technology-independent principles first; current-implementation notes in brackets are illustrative, not binding.

### R1 — Overall design language
Name and govern the existing language: **Calm Orchard** — warm light-neutral canvas, one sage green as the single brand/primary voice, one amber as the single warm accent, frosted flat cards, generous whitespace, realm tinting as *orientation* (a whisper of place, never a second palette for emphasis). The UI Architecture's job is to declare this language canonical, not to invent a new one: the launch audit already found it coherent; the debt is codification, not redesign.

### R2 — Visual hierarchy
Adopt EXP1 §9's five-step attention order (orientation → state → primary action → detail → depth) as the *visual* contract of every surface: exactly one primary-styled action per view; emphasis (colour, weight, motion) treated as a budget spent top-down; a fact styled once per surface. Add one measurable rule: a two-second glance at any page must yield its title, its state, and its primary action.

### R3 — Layout principles
One canonical page anatomy: shell (backdrop + header + bottom nav) → optional realm header → a single content column with a governed max reading width (Home's `max-w-3xl` single column is the reference) → cards as the unit of grouping. Workspace-class pages (Planner, Shopping, Cookbook) may add one docked panel, but through one shared drawer/panel owner (revive WX16's `WorkspaceDrawer` proposal) rather than per-page aside implementations.

### R4 — Navigation presentation
Preserve UX1 as-is: one bottom navigation, all breakpoints, Home-first, boring on purpose. The UI Architecture should freeze its visual grammar (icon+label, `aria-current` marking, 44px minimum targets) and mandate deletion of dormant predecessors (DesktopSidebar/TopBar/BrandBanner) as its first retirement act.

### R5 — Card system
One `Card` primitive, three sanctioned densities (data `p-4` / reading `p-5` / hero `p-6` — the density audit's proposal), one radius from one token, flat (`shadow-none`) with the frosted treatment; elevation/shadow reserved for overlays only. All insight/intelligence presentation converges on the WX2_5 `IntelligenceCard` family (the Companion Card principle already mandates "one card system across every domain"); the ~18 bespoke panels/strips become skins of it or are retired. Hand-rolled card-divs are migrated or exempted explicitly.

### R6 — Button hierarchy
Keep the CVA variant set as the entire vocabulary: default (primary — one per surface), secondary, outline, ghost, destructive. Codify what is already true in practice (0 palette overrides on 532 buttons) and extend it: no raw palette colour on any interactive element; icon-only buttons require an accessible name and the icon size the component enforces.

### R7 — Forms
One form pattern: label above, help below, error replacing help in the destructive voice, announced to assistive tech — delivered through the existing Form/FormField stack (already proven on auth) and adopted page-by-page. Inputs share the control height scale with buttons. Every destructive or irreversible submission follows EXP1 §12's proportional-guard rule.

### R8 — Icons
One library (lucide — already true), one default size token (16px inline / 20px emphasis — today's 597×`h-4` majority), stroke consistency, and **no emoji as UI icons** (emoji remain legitimate inside user content). Decorative icons are `aria-hidden`; meaningful ones are named.

### R9 — Colour philosophy
Three moves: (1) collapse to **one green** — the primary token — and retire `green-*`/`emerald-*` accents; (2) introduce a **semantic status tier** — `success`, `warning`, `danger`, `info` tokens with light+dark values defined once — as the only sanctioned way to colour status (this single change eliminates the bulk of the 612 raw-palette uses and their hand-written dark variants); (3) demote realm colours to orientation-only usage (headers, active nav, subtle tints) — never for status, never for emphasis inside content. Colour is never the sole carrier of meaning (EXP1 §16).

### R10 — Typography
Two families (DM Sans display, Inter text) — and remove the ~28 unused font loads. Govern a compact modular scale with named roles (page title 28–32, section 20–22, card title 16, body **14 minimum**, caption 12 floor for non-essential metadata only) and make 14px the default body size, reversing the `text-xs` drift. Weights capped at medium/semibold for hierarchy; bold reserved for numerals/scores.

### R11 — Spacing system
One 4px-base scale with named steps, expressed as the single source both Tailwind utilities and any CSS variables derive from (today's parallel `--space-*` set is retired or becomes that source). Adopt the density audit's card-padding standard and one chip height. Density adaptation (compact/comfortable/expanded) is the governing responsive model (see R16) and the *only* thing allowed to modulate the scale.

### R12 — Motion and animation principles
Motion is functional, brief, and optional: sanctioned purposes only (state change confirmation, spatial continuity, gentle brand moments like the apple rating), one duration/easing token set (e.g. 150/250/400ms tiers), no attention-seeking loops, and **`prefers-reduced-motion` honoured globally** — reduced motion loses no information or capability. One animation engine for interactive motion; ambient/decorative animation essentially eliminated (EXP1: "the default state of every surface is quiet").

### R13 — Empty states
Create the product's first canonical `EmptyState` building block: quiet icon or nothing, one honest sentence in the companion voice ("Nothing planned for today yet"), at most one gentle action leading to the canonical place. Never filler, never fake content, never guilt (Core Principle 6 + EXP1 §6). UX0's Home copy is the reference tone.

### R14 — Loading states
Skeletons first: shape-preserving placeholders for any content region, preserving layout to avoid shift; spinners demoted to small in-control feedback (button-level operations); literal "Loading…" text retired. Loading is silent — no toast, no motion beyond the skeleton shimmer.

### R15 — Error presentation
Three-tier vocabulary mapped to EXP1 §14: (1) field errors inline via the form pattern; (2) operation errors as calm toasts stating what happened + the way forward ("Couldn't save — try again"), never blame, never celebration-styled; (3) surface failures caught by **error boundaries** (app-level and realm-level — currently absent) rendering a calm recovery card: what happened, what it means for their data, one action (retry / go Home). Alarm styling reserved for data loss and safety.

### R16 — Responsive behaviour
One breakpoint truth: the adaptive density model (compact <640 / comfortable 640–1280 / expanded ≥1280) becomes the *sole* sanctioned responsive vocabulary; all six `useIsMobile` copies and per-page pixel checks retire into it. Mobile-first composition; wide tables get a card fallback or an explicit desktop-only exemption (admin); fixed pixel widths beyond the density system are prohibited. The Planner fold cut-off and Profile background regressions are named convergence targets.

### R17 — Accessibility
Adopt EXP1 §16 as binding visual rules: WCAG AA contrast as a measured floor (run the audit — currently unmeasured); 44px minimum touch targets everywhere, not just nav; every icon-only control named; visible focus on all interactive elements; text scalable to 200% without loss; reduced-motion respected; no colour-only meaning (status tokens always pair with icon/text). Accessibility acceptance becomes part of the UX Governance Checklist pass, not a retrofit.

### R18 — Component consistency
The convergence rule that fixes F0: **every UI concern has exactly one owner component, and introducing a successor requires retiring the predecessor in the same workstream** (Core Principle 8 applied to UI). Immediate ownership decisions the UI Architecture must record: `WorkspaceHeader` is the canonical header (delete `PageHeader`); one `AppleRating`; one apple mark component; `nav-bar.tsx` navigation; WX2_5 for intelligence cards; the dialog foundation for dialog sizing (resolving the width-audit's open questions to, recommended, three sizes + drawer/sheet presentations). A visible adoption register (component → % of eligible surfaces migrated) accompanies every canonical building block so "authored but unadopted" is impossible to hide.

### R19 — Design token strategy
Three tiers, one source of truth: **primitive tokens** (raw scale values: colours, sizes, durations) → **semantic tokens** (intent: `surface`, `text-muted`, `success`, `radius-card`, `duration-fast`) → **component tokens** only where a component needs an override. Components and pages may reference only the semantic tier. Light/dark are two value sets behind the same semantic names (already true for neutrals — extend to status). Reconcile the radius triple-definition into one token. Publish the tokens as the UI Architecture's appendix so the document, the CSS, and the config cannot drift apart — the document defines names and intent (enduring); values live in one implementation file it points to.

### R20 — Simplification and cognitive-load reduction
(1) Decompose the two mega-surfaces (Cookbook, Shopping List) along EXP1's "a surface that cannot name its primary action… should be split". (2) Cap tab sets and card walls on any user-facing surface. (3) Reduce feedback noise: successful routine actions confirm inline/quietly, reserving toasts for outcomes the person must notice. (4) Retire the 23 orphaned product modules and duplicate sets per UI1's pending plan — dead alternates are cognitive load for builders that becomes inconsistency for families.

### R21 — Canonical UI building blocks (existing components to promote)

| Building block | Today | Action |
|---|---|---|
| `ui/*` shadcn primitive set | Healthy, adopted | Declare the primitive tier; additions governed |
| `Card` | 33 importers | Canonical, with the three-density padding rule |
| `Button` | 532 uses, variant-pure | Canonical as-is; decide the Replit `hover-elevate` dependency |
| `BottomNav` / `NAV_ITEMS` | Canonical since UX1 | Freeze; delete dormant predecessors |
| `WorkspaceHeader` | 16 pages | Promote to canonical header; retire `PageHeader`; migrate the 19 hold-out pages |
| `IntelligenceCard` family + `intelligence-tokens.ts` | 1-page adoption | Promote as the one companion-card system (already mandated) |
| `dialog-foundation.ts` | 2 consumers | Resolve open design questions, then mandate |
| `useAdaptiveDensity` | 1 page | Promote as the single responsive/breakpoint source |
| `ScoreBadge`, `AppleRating`, `ThaAppleIcon` | Duplicated/bypassed | Deduplicate, then canonical brand set |
| Toast (`use-toast`, limit 1) | Consistent channel | Canonical, with the R15/R20 usage policy |
| **Missing** — `EmptyState`, skeleton loading pattern, `ErrorBoundary`, `WorkspaceDrawer`, canonical `FormField` recipe | Do not exist | The five new building blocks the UI Architecture must commission |

---

## PRIORITISED RECOMMENDATIONS

Ordered by leverage per unit of effort; 1–3 are the foundation everything else compounds on.

| # | Recommendation | Why this order |
|---|---|---|
| **P1** | Write the governing **THA_UI_ARCHITECTURE.md** (structure below) with a UI Compliance Checklist and the retire-on-introduction rule (R18) | Without governance, every other item repeats the F0 pattern |
| **P2** | **Semantic status tokens + one green** (R9, R19) | Kills the largest measured inconsistency (612+ raw colours), halves dark-mode upkeep, restores calm emphasis |
| **P3** | **Canonical state trio**: `EmptyState`, skeleton loading standard, `ErrorBoundary` (R13–R15) | Highest user-visible calm gain; small build; touches every page's worst moments |
| **P4** | **Header convergence**: promote `WorkspaceHeader`, delete `PageHeader`, migrate hold-outs (R18) | Ends the most glaring dead-code/ownership violation; cheap |
| **P5** | **One responsive truth**: adopt `useAdaptiveDensity` everywhere, delete the six `useIsMobile` variants (R16) | Removes the silent-regression breeding ground flagged by UI1 |
| **P6** | **Typography floor + font-payload cleanup** (R10) | One-file win (index.html) plus a body-size rule with family-wide legibility impact |
| **P7** | **Dialog convergence** — resolve the width questions, mandate the foundation (R18) | Foundation exists; only decisions and migration remain |
| **P8** | **Accessibility baseline**: contrast audit, aria-name sweep, touch-target and reduced-motion rules (R17, R12) | Must be measured before the token values are frozen |
| **P9** | **Mega-surface decomposition** of Cookbook and Shopping (R20) | Largest calm win, largest effort — schedule as its own workstream |
| **P10** | **Dark mode decision**: ship a toggle or formally de-scope and stop paying the 538-usage tax (F12) | Either answer is fine; the current limbo is the only wrong state |

Known open regressions (Profile background, Planner fold, partner logos) ride along with P2/P4/P9 rather than standing alone.

---

## SUGGESTED STRUCTURE FOR THE FUTURE `THA_UI_ARCHITECTURE.md`

Modelled on EXP1's shape (governing, principle-led, checklist-gated), sitting in `docs/architecture/`:

```
THA UI Architecture — Governing Document
  Status / Adopted / Governing documents (EXP1 above it; Core Principles)

  1. Purpose — the visual constitution; what it governs (look) vs what EXP1
     governs (feel) vs what component code owns (build)
  2. Relationship to the Experience Architecture — every section here
     elaborates a named EXP1 principle; conflicts resolve upward
  3. The Design Language — "Calm Orchard" named and defined: canvas, voice,
     accent, realm tinting, flatness, whitespace
  4. Visual Hierarchy — the emphasis budget; one primary action rendered;
     the two-second glance rule
  5. Layout — canonical page anatomy; reading width; the workspace panel
  6. Colour — the semantic tiers (brand / neutral / status / realm); light
     and dark as value sets; colour-never-sole-carrier
  7. Typography — families, the named scale, the 14px body floor
  8. Spacing & Density — the 4px scale; the three densities as the single
     responsive model
  9. Iconography & Brand Marks — one library, sizes, the apple set
 10. Motion — purposes, duration/easing tokens, reduced-motion guarantee
 11. Component Canon — the ownership register: one owner per UI concern;
     the canonical building blocks; the adoption register
 12. Interaction States — hover/focus/active/disabled; loading (skeleton
     standard); empty (EmptyState standard); error (three-tier vocabulary)
 13. Forms — the one field anatomy and validation voice
 14. Accessibility Standards — measurable floors (contrast, targets, focus,
     scaling, reduced motion)
 15. Design Token Strategy — primitive → semantic → component; where values
     live; how light/dark/density consume the same names
 16. Governance — retire-on-introduction for UI; how a new component/token
     is admitted; the UI Compliance Checklist (stands beside EXP1 §17)
  Appendix A — Canonical token reference (pointer to the single
     implementation source, not a copy)
  Appendix B — Adoption & retirement register
```

Sections 3–15 state enduring principles with implementation notes kept to appendices, preserving EXP1's technology-independence discipline at the visual level.

---

## OPTIONS

| Option | Description | Cost | Risk | Reversible? |
|---|---|---|---|---|
| A | **Govern first, converge by priority** — write THA_UI_ARCHITECTURE.md (P1), then execute P2–P10 as gated workstreams under it | Medium, spread over many small workstreams | Low — each step is small, checklist-gated, and rollback-tagged | Yes — document and migrations are individually revertible |
| B | **Converge without governing** — just fix the top inconsistencies (tokens, headers, states) as one-off workstreams | Lower up-front | High — F0 shows exactly this approach produced six unadopted foundations; nothing prevents re-divergence | Yes, but decays |
| C | **Full visual redesign** — new design language, rebuilt component library | Very high | High — discards a language the launch audit already judged coherent; violates "prefer evolution over replacement" | Partially |

## RECOMMENDATION

**Option A.** The evidence is unambiguous that THA's visual problem is *ungoverned convergence*, not bad design: the language is coherent (WX9A), the primitives are healthy, and every past failure was a foundation without governance or retirement (F0). A governing UI Architecture with a compliance gate — the mechanism that is already working for EXP1, navigation (UX1), and the composition root (UI1) — is the only approach that hasn't been tried for the visual layer and the only one that addresses the root cause. Option B repeats the observed failure mode; Option C buys risk with no identified upside.

**What would change this recommendation:** evidence that the Calm Orchard language itself fails households (e.g. contrast audit failures deep enough to force a palette rework, or user research contradicting the calm direction) would move weight toward C for the affected tiers; a decision that THA's UI will be replatformed soon would favour deferring P4–P9 and doing only P1–P3.

---

## ARCHITECTURE COMPLIANCE

- **EXP1 Experience Architecture:** this investigation proposes the visual layer EXP1 explicitly delegates ("colours, typography, spacing are implementation-level"). Every recommendation maps to a named EXP1 principle; none alters EXP1. Note: EXP1 is present in the working tree but **uncommitted** at the time of writing — if it changes before adoption, §CONTEXT and the R-mappings must be re-checked against its final text.
- **Core Principles:** R18/R21 apply Principle 8 (retire on introduction); R13/F7 apply Principle 6 (honest gaps); one-owner-per-component parallels Principles 1–2. No conflicts identified.
- **Companion Card / Discovery principles:** R5 converges on the already-mandated single card system; nothing here creates a second conversation layout or presentation owner.
- **Repository conventions:** filed at `docs/investigations/ux/UIA1_UI_ARCHITECTURE_DISCOVERY.md` (workstream folder + EWO-ID prefix, both mandatory; the originally requested root path is verifier-prohibited).
- This is discovery only: it does **not** create THA_UI_ARCHITECTURE.md and authorises no implementation.

## DATA IMPACT

None — investigation only.

## TRUST CHECK

- Grep counts are approximate and labelled as such; they establish scale, not exact figures.
- The three highest-leverage structural claims (orphaned `PageHeader`, no dark-mode activation path, no `EmptyState`/`ErrorBoundary`) were re-verified by direct search before writing.
- Calm/cognitive-load judgements (F13) are explicitly inference from observed counts, not measurements of user experience — no user research was consulted because none exists in the repo (listed under Unknowns).
- Unknowns (device mix, contrast measurements, dark-mode host behaviour, admin audience, Replit utility dependency) are stated as prominently as findings.

## OUTCOME

It is now established, with evidence, that: THA already has a coherent, nameable design language ("Calm Orchard") that has never been codified; the visual layer's failures are convergence failures (six authored foundations at 0–14% adoption, ten duplicate component sets) rather than design failures; the largest measurable inconsistencies are status colour (612+ raw palette uses, no status tokens), state presentation (no empty/loading/error canon, no error boundary), and responsive truth (six breakpoint definitions); and the Experience Architecture (EXP1) now exists as the governing layer a UI Architecture must elaborate. A prioritised path (P1–P10) and a complete proposed structure for `THA_UI_ARCHITECTURE.md` are recorded above.

## NEXT STEPS

1. **User approval** to commission the governing `THA_UI_ARCHITECTURE.md` (P1) — authored under a new workstream, gated on EXP1 being committed.
2. On adoption of P1, sequence P2–P10 as individual gated workstreams (P2 and P3 first — highest calm-per-effort).
3. Feed the Unknowns into that work: run the contrast audit (P8) and take the dark-mode decision (P10) before token values are frozen.
