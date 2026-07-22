/**
 * The Environmental Dressing mouth — LH1 (the Standing Welcome).
 *
 * This is the ONE surface that paints admitted Environmental Dressing items
 * (LIVINGHOME2 ED1–ED12; the runtime is `@/lib/living-home/dressing-register`). It is
 * the DOM-painting mouth ED2 declared and deferred to the first admitted item, mounted
 * now by the shell's room threshold into the committed E2 window band — the "sill" of
 * the orchard window, the one region the content deliberately does not cover
 * (EXP3 § 5 / § 7.1; the `orchard-backdrop.tsx` manner).
 *
 * WHAT IT IS, BY CONSTRUCTION (ED7 · LHDC1 § 13, § 16):
 *   • STILL — a single still image; no motion, no transition, no interactive state.
 *   • WORDLESS & DECORATIVE-DECLARED — `aria-hidden`, empty `alt`, `pointer-events-none`.
 *     It carries zero information; removing it loses no capability or state (ED4).
 *   • ZERO-BYTE WHERE THERE IS NO VIEW — renders NOTHING below E2 (E1/E0 rooms gain
 *     nothing; the E1/E0 zero-byte invariant holds — EXP3 § 10 · LHDC1 § 13).
 *   • CLAIM-FREE — it reads only the pure resolver's output (season + room), never any
 *     household data. Season is CONSUMED from Domain 11's owner, never derived (HT17).
 *   • BENEATH THE EMPHASIS BUDGET — one declared strength ceiling (`--dressing-strength`,
 *     ED7 · LHDC1 § 4), never tuned per surface (UIA § 15/§ 16).
 *
 * It is the single lawful importer of `@/assets/living-home/dressing/` (one mouth —
 * LIVINGHOME2 § 10.3; verify:living-home-assets D7).
 */

import { seasonOfLocalDate } from "@shared/seasonal/season-rule";

import bowlOfApples from "@/assets/living-home/dressing/standing-welcome-bowl-of-apples.svg?url";
import springFlowers from "@/assets/living-home/dressing/spring-flowers.svg?url";
import summerFruit from "@/assets/living-home/dressing/summer-fruit.svg?url";
import autumnPumpkins from "@/assets/living-home/dressing/autumn-pumpkins.svg?url";
import autumnFoldedBlanket from "@/assets/living-home/dressing/autumn-folded-blanket.svg?url";
import winterEvergreens from "@/assets/living-home/dressing/winter-evergreens.svg?url";
import {
  resolveRoomDressing,
  toRenderPlan,
  type RoomId,
  type SeasonKey,
} from "@/lib/living-home/dressing-register";

/**
 * The one map from a registered `assetId` to its bundled, content-hashed URL. Every
 * dressing asset the mouth can paint lives here, imported exactly once. An item whose
 * `assetId` is not in this map paints nothing (honest absence, never a broken image).
 */
const DRESSING_ASSETS: Record<string, string> = {
  "standing-welcome-bowl-of-apples": bowlOfApples,
  "spring-flowers": springFlowers,
  "summer-fruit": summerFruit,
  "autumn-pumpkins": autumnPumpkins,
  "autumn-folded-blanket": autumnFoldedBlanket,
  "winter-evergreens": winterEvergreens,
};

/**
 * Per-region composition geometry. The item declares a logical committed region
 * (§ 5.1); the mouth owns how that region is painted. `room-threshold-sill` sits the
 * object on the sill at the foot of the E2 window band, in the right-hand gutter —
 * opposite the room's left-aligned title, so identity type and the home's warmth never
 * contest space (EXP3 § 5.3). Domestic, believable scale (LHDC1 § 9).
 */
const REGION_CLASS: Record<string, string> = {
  "room-threshold-sill":
    "absolute bottom-0 right-[clamp(12px,5vw,56px)] " +
    "w-[clamp(84px,11vw,128px)] h-auto select-none",
};

export function DressingLayer({
  room,
  exposure,
}: {
  room: RoomId;
  /** The room's governed orchard exposure. Dressing composes only where the house
   *  commits a view — E2. Below E2 there is no committed region, so nothing renders. */
  exposure: "e0" | "e1" | "e2";
}) {
  // Zero-byte where there is no view: only E2 rooms commit a window band for the sill.
  if (exposure !== "e2") return null;

  // Season is CONSUMED from Domain 11's owner (HT17), never derived here — the mouth
  // reads it and hands it to the pure, clock-free resolver. The Standing Welcome is
  // year-round, so the value does not change what renders today; wiring it now keeps
  // the mouth correct for the seasonal collection (LH2), where it will decide.
  // (Transitional client adapter; HT17's household-time season resolution is LH2's to
  //  wire when a seasonal item first depends on it.)
  const season: SeasonKey = seasonOfLocalDate(new Date());

  // At most ONE object on a room's sill (ED7 restraint): a season-specific item takes it
  // when the season has one, else the year-round standing welcome remains.
  const item = resolveRoomDressing({ room, season });
  if (!item) return null;
  const [d] = toRenderPlan([item]).descriptors;
  const src = d && DRESSING_ASSETS[d.assetId];
  if (!d || !src) return null; // honest absence — never a broken image
  const regionClass = REGION_CLASS[d.region] ?? REGION_CLASS["room-threshold-sill"];

  return (
    <img
      src={src}
      alt=""
      aria-hidden
      data-testid={`dressing-${d.assetId}`}
      className={`pointer-events-none ${regionClass}`}
      style={{ opacity: `var(${d.strengthToken})` }}
    />
  );
}

export default DressingLayer;
