# HOUSE5_KITCHEN_EXPERIENCE — Session Run File

| | |
|---|---|
| **Session ID** | `HOUSE5_KITCHEN_EXPERIENCE` |
| **Objective** | Define the permanent **Kitchen** room — the emotional blueprint that governs the Cookbook experience. Same house as Arrival, its own personality. **Design/exploration only** — no product source changed. |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `rollback/HOUSE5-KITCHEN-EXPERIENCE-20260717` → `7bfad50c` (tag `house5-kitchen-experience-wip-snapshot-7bfad50c`; working-tree snapshot `3cc05f9f`) |
| **Stage** | **Complete** — blueprint designed, rendered at 3 breakpoints × 2 views, report written. |
| **Started** | 2026-07-17 |

---

## The canon this room is built on (do not re-derive — cite)

- **Cookbook row (Experience Blueprint § 5.1, line 173):** *"The recipe book by the window · **E2** · **warm side-light across the page** · **Shelf; recipe cards as objects you pick up** · The well-thumbed page."* This is the whole brief in one line.
- **E2 (Blueprint § 6, line 222):** a framed, partial presence in **one committed region the content deliberately does not cover**; the working area on solid ground. → the orchard is a **side window**, never wallpaper behind the cards (the live defect, COOK1 § 12.2).
- **Light:** warm **side-light across the page** — the morning rakes in from the side, versus Arrival's full overhead E3 wall. This is the Kitchen's distinct signature and the main personality difference.
- **Ground:** shelf; recipe cards as objects you pick up (the one room where discrete cards are the *canonical* posture — COOK1 § 12.3).
- **Warmth = the food itself** (EXP5:362 — *"the food itself is the colour"*). Real photography is the room's decoration; where absent, honest fallback, never cold (COOK1 § 4, § 11.6).
- **Living Detail — the well-thumbed page:** a half-step surface warmth; **never a badge, rank, label, score** (Blueprint § 12.2). Recognition, not choosing (OLB:74).
- **Season appears in *what the family cooks*, never in the room's light/orchard/a date** (COOK1 § 8 — no seasonal dressing = the theme park).
- **No drawn book / page-turns** (the theme park). **Not a store** (discovery must not arrange the family's book like a shop). **No "Cooked N times"** — *"has featured in your plans N times"* (COOK1 § 5.3).
- **Companion:** the friend leaning on the counter — invited, suggesting never deciding, silence valid (OLB:78; TRANSLATION1).
- **House language kept:** NORTH4 Concept B · The Kept House · The Warm Hour · pressed apple (BRAND2) · Companion apple (COMP1) · hospitality before productivity · technology quieter · every object earns its place.

## Deliverables (mission)
- [x] Emotional philosophy · Architectural blueprint · Interior language · User journey from Arrival (report §§ 2–5)
- [x] Desktop / tablet / mobile concepts (rendered — shelf + recipe views)
- [x] Production recommendations · Rules every future Cookbook feature must follow (report §§ 7–8)
- [x] Report → `docs/implementation/HOUSE5_KITCHEN_EXPERIENCE.md`

## Checkpoints
- [x] Bootstrap read (`README`), HOME_ARRIVAL_PRODUCTION_LOCK, BRAND1, COOK1, Blueprint Cookbook row, TRANSLATION1 kitchen-island/shelving read.
- [x] Git status confirmed · rollback protection created + recorded.
- [x] Run file opened.
- [x] Kitchen mockup built (`scripts/north4-concepts/kitchen-experience.html`) — two views: the shelf (arrival) + the recipe, opened.
- [x] Render harness built; rendered desktop · tablet · mobile × 2 views; **E2 sanity 6/6 clear**; Fraunces real.
- [x] Report written; run file + CURRENT.md reconciled to Complete.

## Outcome
The Kitchen is the same house as Arrival (Concept B · Kept House · Warm Hour · pressed apple · Companion)
with **one move for its own personality: the window turns to the side (E2), the light rakes across the page,
and the hero shifts from the view to the food on the shelf.** Twelve rules (K1–K12) govern every future
Cookbook feature, each cited to an owner (no second owner created). The design honours every COOK1 hard
finding: no "cooked" claim, no favourite star, season in the food not the room, orchard as a committed
window not wallpaper. **Timing note:** COOK1 § 15 gated Cookbook visual work behind "P1 (Home) has run" —
the Arrival lock satisfied that, so this is EXP5-P2 on schedule. No product source/data/schema/route
changed.

## Tooling (Chromium revival — same as the Arrival line)
Curated lib dir at `…/scratchpad/chromium-libs` (708 libs from the ytmdesktop nix store target, excluding glibc's own + libcrypto/libssl/libz). Apple mask must be inlined as a **data-URI** (`file://` mask-image loads empty headless).
`LD_LIBRARY_PATH=<curated> npx tsx scripts/north4-concepts/render-kitchen.ts`.

## Constraints (held)
Design/exploration only. **No product source, data, hook, route, API, behaviour, schema, migration, or test changed.** `meals-page.tsx` / `index.css` not opened. Canonical `ORCHARD.png` referenced in place; no substitute authored; no fabricated specific dish presented as a real household's meal (warm placeholders stand in for the household's own photography, as Arrival used a placeholder name).

## Next action
**None — session complete.** The next, separate, owner-gated step is the visual-only build into
`meals-page.tsx` · `index.css` (report § 8), whose highest-value move is retiring the live
orchard-as-wallpaper for the committed E2 side window, and adopting the honest history sentence. The deeper
dependency (naming/scoping the family's book — `COOK1 § 15.4`) is above this document.
