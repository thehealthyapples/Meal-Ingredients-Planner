# HOME_ARRIVAL_PRODUCTION_LOCK — Session Run File

| | |
|---|---|
| **Session ID** | `HOME_ARRIVAL_PRODUCTION_LOCK` |
| **Objective** | Lock the agreed emotional design language for THA Arrival and prepare it for production implementation. **No exploration, no redesign** — implement the agreed lock. |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `rollback/HOME-ARRIVAL-PRODUCTION-LOCK-20260717` → `7bfad50c` (tag `home-arrival-production-lock-wip-snapshot-7bfad50c`; working-tree snapshot `507e2123`) |
| **Stage** | **Complete** — locked, rendered production-ready, report written. |
| **Started** | 2026-07-17 |

---

## The Design Lock (fixed — do not re-open)

- **Architecture** — NORTH4 Concept B: panoramic orchard (glass above), permanent Arrival viewpoint, oak sill, calm plaster room below, doors along the floor. Unchanged.
- **Interior** — **The Kept House**, warmed by **The Warm Hour** light, with one grain of **The Linen Calm** matte plaster: subtle aged oak, soft matte plaster, gentle lived-in patina. **No decorative props** (bowl/stem/books/record/linen all removed).
- **Brand** — the prominent band mark is retired; the sole identity is a **subtle monochrome embossed THA apple pressed into the plaster wall** (BRAND2 "The Pressed Apple") — tone-on-tone, part of the architecture, *discovered rather than displayed*.
- **Companion** — the **THA single apple** as the permanent Companion identity (COMP1): a soft sage embossed-apple button, quiet, elegant, always available, never visually dominant; its voice a data-borne line resting on the wall.
- **Preserve** — hospitality before productivity · technology quieter as it gets better · the orchard as the emotional anchor · arrival feels like coming home.

## Deliverables

- [x] Production-ready **desktop** design (rendered — full + quiet)
- [x] Production-ready **tablet** design (rendered — full + quiet)
- [x] Production-ready **mobile** design (rendered — full + quiet)
- [x] Final implementation report → `docs/implementation/HOME_ARRIVAL_PRODUCTION_LOCK.md`
- [x] Small production polish list (before implementation) — report § 6

## Checkpoints

- [x] Bootstrap read (`README`), NORTH4 Concept B Evolution, Emotional Interior, BRAND1/BRAND2, COMP1 read.
- [x] Git status confirmed · rollback protection created + identifier recorded.
- [x] Run file opened.
- [x] Production-lock mockup built (`scripts/north4-concepts/home-arrival-lock.html`).
- [x] Render harness built + Chromium revived (curated libs); apple mask inlined as data-URI.
- [x] Rendered desktop · tablet · mobile × (full + quiet day); **collision checks 12/12 clear**; Fraunces real.
- [x] Final report written.
- [x] Run file + CURRENT.md reconciled to Complete.

## Outcome
The four agreed decisions (Concept B · The Kept House · Pressed Apple · Companion apple) are assembled into
one composition and rendered production-ready on both honest days at three breakpoints. Two build notes for
the gated implementation step: the pressed apple must be rebuilt from the room's real light model and
re-judged on device (BRAND2 § 7); the Companion ships as the calm carved emblem, with the aware light held
behind the COMP1 § 320 amendment. No product source, data, hook, route, schema, migration, or test changed.

## Defect caught by measuring
The `file://` mask-image for the apple loaded **empty** (the pressed apple and Companion carve were
invisible — the BRAND2 visibility-floor failure, at zero). Diagnosed by forcing the face solid and counting
pixels; fixed by inlining the apple as a **data-URI mask** (contrast 13 → 99 spread). One collision (full
desktop console over the doors at 900px) closed by easing the full-day sill one notch + a one-line full-day
Companion string.

## Tooling (Chromium revival)
Chromium won't launch: `libglib-2.0.so.0` missing. Curate a lib dir from
`/nix/store/995nd0yj67pshcgyyi4v3drxvdizxmcp-ytmdesktop-1.13.0-usr-target/lib` — symlink every `*.so*`
**except** glibc's own (libc/libm/libpthread/libdl/librt/ld-linux/libgcc_s/libstdc++/libresolv/libutil)
**and except** libcrypto/libssl/libz (they shadow node's OpenSSL → segfault). Then
`LD_LIBRARY_PATH=<curated-dir> npx tsx scripts/north4-concepts/render-arrival-lock.ts`.

## Constraints (held)
Exploration/design lock only. **No product source, data, hook, route, API, behaviour, schema, migration, or
test changed.** `home-experience-page.tsx` / `index.css` not opened. Canonical `ORCHARD.png` referenced in
place; no substitute authored. Architecture byte-identical to Concept B.

## Next action
**None — session complete.** The next, separate, owner-gated step is the visual-only implementation into
`home-experience-page.tsx` · `index.css` · `FloatingAssistant.tsx` (report § 7), behind the two governance
gates (BRAND2 mark approval; COMP1 § 320 amendment only if the aware light ships).
