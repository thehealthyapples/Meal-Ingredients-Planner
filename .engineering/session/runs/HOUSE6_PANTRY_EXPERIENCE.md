# RUN — HOUSE6 · The Pantry Experience

| | |
|---|---|
| **Session** | `HOUSE6_PANTRY_EXPERIENCE` |
| **Date** | 2026-07-18 |
| **Branch** | `int1-intelligence-platform` |
| **HEAD at start** | `7bfad50c` |
| **Rollback** | `rollback/HOUSE6-PANTRY-EXPERIENCE-20260718` → `7bfad50c` (tag `house6-pantry-experience-wip-snapshot-7bfad50c`; working-tree snapshot object `b7d66cbf`) |
| **Mission** | Design the permanent **Pantry** — the next room in the house, after Home (Arrival) and the Kitchen (Cookbook). Do **not** redesign Home or the Kitchen. Blueprint only. |
| **Deliverable** | `docs/implementation/house/HOUSE6_PANTRY_EXPERIENCE.md` (filed in `house/` per repo-structure-verify.sh rules 3 & 8, matching `HOUSE5_KITCHEN_EXPERIENCE.md`; the brief's `docs/implementation/` root path is a loose-file governance violation). |

## The brief the canon already wrote (governing owners)

- **Blueprint § 5.1:** *Pantry · "the pantry, orchard beyond" · **E2 — the smallest window** · Practical, morning-warm · Shelf strata · Freshness, honestly told.*
- **Living Book, "The Pantry Shelves":** the honest truth of the shelves, told kindly; reassurance without guilt; freshness in helpful human words, never a red warning; orchard at its smallest; strata of a real pantry — tiers, shelves, things in their places. Never painted jars / invented fullness / freshness-as-shame.
- **Living Detail ceiling (§ 12.2):** *Freshness, honestly told* — item freshness data — *"the food in here is alive"* — canonical status vocabulary; **helpful words, never guilt.**
- **OHDB § 13.4:** purpose = tell honestly what is in the house now; avoid painted jars, drawn produce, fake fullness, shaming status.
- **IntLang § 4.4 (Pantry discoveries):** THA connects something the household *has* to something they might *do* — welcome noticing, never a scarcity alarm; silence valid; never invents a use the data doesn't support (`pantry-opportunity` notice, verbatim).
- **TRANSLATION1 Shelving:** ordered strata; legible order; the reassurance of knowing where things are; tiers of grouped cards, solidity descending with importance.
- **House language inherited (must carry verbatim):** NORTH4 Concept B · the Kept House interior · the Warm Hour light · the pressed apple · the Companion carved-apple · the constant shell (Arrival lock; Kitchen).

## Product reality noted (not changed)

- `client/src/pages/pantry-page.tsx` already groups into strata: **Food Pantry** (Larder · Fridge · Freezer) + **Home Pantry**. No freshness/expiry field on `PantryItem` today — the *Freshness, honestly told* signature is a named data dependency (design shows the room the platform grows into, as Kitchen did for the family-book gap).
- COOK1 finding: cookbook stories/favourites currently render *in the Pantry* behind a heart emoji — the Kitchen (HOUSE5 § 8.4) claims those; the Pantry design releases them (rule P9).

## Trigger log

- [x] Bootstrap + required reading (README, HOME_ARRIVAL_PRODUCTION_LOCK, HOUSE5_KITCHEN_EXPERIENCE, Blueprint Pantry row, Living Book, OHDB, IntLang, TRANSLATION1).
- [x] Git status confirmed.
- [x] Rollback created + recorded (above).
- [x] Run file created (this file).
- [x] HTML composition authored (`scripts/north4-concepts/pantry-experience.html`) — 2 views (stocked · bare).
- [x] Renders produced: `docs/ui-audit/house6-pantry/` — 6 viewport + 4 full-page, deviceScaleFactor 2. **E2 + honesty sanity 6/6 clear**; Fraunces real; **no freshness label reads as a red alarm** (mechanically checked).
- [x] Deliverable written (`docs/implementation/house/HOUSE6_PANTRY_EXPERIENCE.md`).
- [x] repo-structure-verify.sh: House-misfile check PASSES for HOUSE6 (filed in house/). The one FAIL (loose files) is pre-existing — AFI1/FI20/COMP_ACT1 at the docs/implementation root, untracked, predate this session; HOUSE6 adds no violation.

## Tooling (Chromium revival — reused verbatim)

`libglib-2.0.so.0` missing at launch. Curated lib dir at `…/scratchpad/chromium-libs` (709 libs symlinked from
`/nix/store/995nd0yj67pshcgyyi4v3drxvdizxmcp-ytmdesktop-1.13.0-usr-target/lib`, excluding glibc's own +
libcrypto/libssl/libz). Apple mark inlined as an SVG data-URI mask (`file://` mask-image loads empty headless).
`LD_LIBRARY_PATH=<curated> npx tsx scripts/north4-concepts/render-pantry.ts`.

## Constraints (held)

Exploration/design blueprint only. **No product source, data, hook, route, API, behaviour, schema, migration, or
test changed.** `pantry-page.tsx` / `index.css` not opened. Home and the Kitchen not re-opened. Canonical
`ORCHARD.png` referenced in place; no substitute authored. Architecture byte-identical to Concept B.

## Next action

**COMPLETE.** Blueprint delivered and rendered. Awaiting owner decision, then the gated build (per § 8). No
follow-up owed by this session.
