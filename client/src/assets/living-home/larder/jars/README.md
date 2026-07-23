# Living Larder jar asset masters — governed directory

This directory holds the 27 transparent PNG masters of the Living Larder jar
assets, and **nothing else**. It is governed by the Larder jar section of the
Life Register (`client/src/components/layout/living-details-manifest.ts` § J)
and verified by `npm run verify:living-home-assets` (checks J1–J12).

Rules (enforced, not advisory):

- Every file here must be a **registered filename** (`tha-larder-jar-<family>.png`); strays fail J4.
- A file may land only by promoting its record `planned → candidate` (checksum recorded) **in the same commit** (J4).
- 512 × 768, 8-bit RGBA, transparent corners, genuine alpha, one jar per file, no baked label wording (J5).
- Nothing here may be referenced at runtime until its record is `approved` with a checksum-bound Home Owner approval (J6/J7); the one declared mouth is `client/src/pages/larder-room.tsx`.

Empty at the foundation (2026-07-23): all 27 records are `planned`; absence is
the lawful state.
