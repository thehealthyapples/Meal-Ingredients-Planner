# Session: LH1_Standing_Welcome

| Field | Value |
|---|---|
| **Session ID** | `LH1_Standing_Welcome` |
| **Programme** | Living Home First Experience (LH1 → LH2 → LH3), one controlled implementation programme, a commit after each stage |
| **Rollback ID (programme)** | `rollback/LH-living-home-first-experience-20260722` → `03a51d25` (annotated tag; created **before any work**; covers committed state only — the working tree held one uncommitted `.engineering/session/CURRENT.md` heartbeat, not covered) |
| **Start time** | 2026-07-22 |
| **Current stage** | Documentation → Waiting for User (committed; awaiting Home Owner walk-through) |

## Objective
Implement **LH1 — Standing Welcome**: the **first admitted Environmental Dressing object** — a **bowl of apples**, year-round (`year-round` season key), the home's standing signature (`LIVINGHOME2` § 5). This is `LIVINGHOME2` Phase 3 / the "first visible object" that ED2 (`8d5039cd`) and ED3/LHDC1 (`e1759926`) both explicitly deferred and recommend as the next act.

Deliver, as one governed admission:
- `client/src/components/layout/dressing-layer.tsx` — the DOM mouth (deferred by ED2 to the first item; the `orchard-backdrop.tsx` manner: `aria-hidden`, empty `alt`, `pointer-events-none`, still, in-flow).
- Runtime adoption — mount the dressing layer / adopt the ED2 runtime (`client/src/lib/living-home/dressing-register.ts`) at the first renderer integration point.
- One admitted object: **Standing Welcome — bowl of apples**, registered in the Dressing Register with season key `year-round` + admission-doc id + checksum recomputed in the same commit.
- Checksum update (register bytes ↔ registered checksum).
- Admission document — full LHDC1 § 21 evidence (11 items) + § 18 with-and-without review + § 19 rejection-criteria clearance.
- Home Owner approval path — recorded approval (Colin Clapson, Home Owner) per `HOMEOWNER1` § 20 / LHDC1 § 20.
- Verification updates — `dressingChecks()` now sees one admitted item (was 0); `verify:living-home-assets` green.
- Implementation report `docs/implementation/LH1_STANDING_WELCOME.md` — 9 required sections.

**No other object may be implemented** (mission Scope Lock). Only the bowl of apples.

## Constraints the object must satisfy
- **Living Home Design Constitution (LHDC1)** — object-level visual/material admission standard; § 18 with-and-without (all 6), § 19 rejection criteria (trips none), § 20 Home Owner approval, § 21 admission evidence (all 11).
- **LIVINGHOME2** — ED1–ED12; claim-free (ED3), wordless/still (ED7), hospitality-named (ED8), one-at-a-time registered (ED10), beneath words (ED12); § 4.3 classification (Dressing); § 5.1 placement law (no produce dressing in the Larder/Pantry room).
- **ED Runtime (ED2)** — register + resolver + renderer interface at `client/src/lib/living-home/dressing-register.ts`; the mouth `dressing-layer.tsx` lands here.
- **House Register / EXP3 asset system** — checksum discipline; zero-byte where no view (E1/E0); one mouth, one register.
- **Experience Blueprint** — one home, one morning, one orchard; §12.1.2 prop-ban (refined by ED1 — a registered claim-free object is not a prop); Living Detail discipline; Blueprint Checks §15.2 + Experience Test §15.3.

## Gate status
All prerequisite gates cleared before this stage:
- Phase 1 owner amendments — landed by **ED1** (`a9440761`).
- EXP3 Phase 2 base registers/verifier — shipped (`be7b8301`).
- ED runtime (empty register) — shipped by **ED2** (`8d5039cd`).
- Object visual admission standard (LHDC1) — in force (`e1759926` / renamed `03a51d25`).

## Checkpoints
- [x] Read required docs (README full; LIVINGHOME2; LHDC1; EXP3 asset system; HOMEOWNER1; Blueprint; UIA). Confirmed lineage via ED1/ED2/EXP3 run files.
- [x] git status confirmed; annotated **programme** rollback tag created (`03a51d25`) & reported before any modification.
- [x] Mapped the ED2 runtime API + verifier (13 checks) + season vocabulary (5 keys) + mount point (`RoomThreshold` E2) + committed regions + adoption gate.
- [x] Authored the still asset `standing-welcome-bowl-of-apples.svg` — matte, hand-drawn, Calm Orchard palette, one-morning light, wordless.
- [x] Registered `STANDING_WELCOME_BOWL_OF_APPLES` (`year-round`; refused pantry/larder/nutrition); recomputed item checksum (`d3e66b75…`) + register checksum (`75aef6f8…`) in the same commit.
- [x] Built `dressing-layer.tsx` (the one mouth); mounted it in `app-shell.tsx` `RoomThreshold` (E2 branch); added `--dressing-strength` token (both modes).
- [x] Verifier: scoped the dressing subdir out of the Life orphan/mouth checks; strengthened D6 (resolve/refuse assertion); alias-safe D7 needle; added D8 (asset byte-lock). `verify:living-home-assets` 13/13 PASS.
- [x] Adoption register: retired the `dressing-register.ts` orphan (now adopted); added the mouth + token concerns; regenerated `.md`. `adoption:check` 103·0·9 (no regression).
- [x] Authored the admission document (LHDC1 § 21 · § 18 with-and-without · § 19 clearance · § 20 Home Owner approval recorded).
- [x] Wrote `docs/implementation/LH1_STANDING_WELCOME.md` (all 9 sections).
- [x] Verified: verify 13/13 · typecheck 88 pre-existing / 0 in touched files · build exit 0 (SVG bundled to `dist/public/assets/`) · adoption 103·0·9.
- [x] Commit; record hash here + dashboard.

## Result
_Work commit: `__LH1_COMMIT__`._
Committed on `int1-intelligence-platform`. One admitted Environmental Dressing object — the Standing Welcome (a bowl of apples), year-round — renders on the sill of the E2 window band in Cookbook, Diary and the Orchard room; refused in Pantry/Larder and Nutrition and everywhere with no view. The register is byte-locked (item + register checksums); the mouth is the one lawful importer of the dressing assets; the object is claim-free, still, wordless, and beneath words. No household data read; no schema/migration; no governing rule changed.

## Next action
**Home Owner walk-through** of `/cookbook`, `/my-diary`, `/orchard` (bowl present on the sill), `/pantry` + `/nutrition` (none), and the working rooms + Home (unchanged). Then **Stage 2 — LH2 (First Seasonal Collection)**: admit the season-keyed items (spring flowers, subtle summer fruit, autumn small pumpkins + folded blanket, winter evergreen wreath) one at a time, each its own admission against LHDC1, wiring the Domain-11 season answer (HT17) into the mouth for real seasonal resolution.

## Blockers
None — all four prerequisite gates cleared; LH1 is the sanctioned next act (ED2/ED3 both recommend it).

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
