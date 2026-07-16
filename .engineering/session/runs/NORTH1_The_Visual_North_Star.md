# Session: NORTH1_The_Visual_North_Star

| Field | Value |
|---|---|
| **Session ID** | `NORTH1_The_Visual_North_Star` |
| **Rollback ID** | `rollback/NORTH1-visual-north-star-20260716` → `7d1dd2ce` |
| **Start time** | 2026-07-16T09:30:00Z UTC |
| **Current stage** | Waiting for User |

## Objective
Evaluate the North Star reference images (`attached_assets/North Star/`) as a
product designer against the governing canon (Experience Blueprint, Orchard
House Design Blueprint, Orchard Living Book, Kept Room Translation, DESIGN1).
Extract the timeless principles that should govern every future THA screen;
name what must NOT be copied; state how the render translates into a
professional software interface rather than a concept render; identify the
first UI changes. **Produce a design report only — implement no UI.**

## Files being modified
- `docs/implementation/ux/NORTH1_THE_VISUAL_NORTH_STAR.md` — the design report (new)
- `.engineering/session/runs/NORTH1_The_Visual_North_Star.md` — this run file
- `.engineering/session/CURRENT.md` — dashboard row

No governing document is amended; no code, component, or token is touched.

## Checkpoints
- [x] Read both reference images (`kitchen concept.png`, `kitchen concept 1.png`)
- [x] Read the five named documents: EXPBLUE1/2, OHDB1, OLB1, TRANSLATION1, DESIGN1 (+ ORCHARD3 concept lineage)
- [x] Establish rollback tag (`→ 7d1dd2ce`)
- [x] Fact-check the live product against the render (Home surface, tokens, shell, bottom nav, orchard backdrop)
- [x] Author the design report
- [x] Reconcile run file + dashboard

**Key finding (fact-checked against code):** the live product already paints a
photographic orchard at `opacity: 0.90` behind *every* room with a 10px
parallax (`client/src/components/layout/orchard-backdrop.tsx:9`;
`--orchard-parallax-strength`, `index.css:73-75`). That is the Blueprint's
*wallpaper* and *rendered world* anti-patterns (§ 16), shipped. The reference
image's real lesson is the **aperture** — the orchard admitted through framed
openings with solid wall between them. Adopting the North Star therefore means
**deleting the backdrop, not enriching it**. Second finding: `--card: 0 0% 100%`
(`index.css:11`) is pure white — the working surface, the "counter", is the one
cold plane in an otherwise warm palette (`--background: 42 27% 95%`).

**Last checkpoint:** Report delivered. The recommendation is that the image be
adopted as a **reference (the feeling to design toward), never a specification
(a picture to draw)** — its literal room, props, wall aphorism, tagline, and
six-tile launcher are anti-patterns the canon already forbids. Adoption into
the governing set is *recommended, not made*: it needs its "do not copy" list
attached in the same decision, per Experience Blueprint § 18.

**Next action:** Awaiting review. Decide (a) whether the image is admitted as a
canonical reference under the status line in report § 7, and (b) whether to
open `NORTH2` for the first change — retiring the orchard backdrop in favour
of one composed aperture at Home. Nothing ships until the Blueprint's § 18 open
items (orchard owner, Home's header) and the UIA § 4 amendment land.
