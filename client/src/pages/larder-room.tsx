import "./larder-room.css";

/**
 * The Living Larder — Pass 2: interior composition (LARDER4 § 8, Pass 2 "Furniture").
 *
 * Pass 1 built the PERMANENT ARCHITECTURE of the room — every furniture element
 * required by LARDER2 § I.4, honestly empty. Pass 2 changes nothing about what
 * the room contains and everything about how it is COMPOSED: the same furniture,
 * now standing in one room rather than floating as separate objects.
 *
 * The composition, wing by wing (LARDER2 § I.3/§ I.5):
 *   • Every wing is an ELEVATION — a wall of plaster with a floor beneath it.
 *     Furniture stands ON the floor and hangs ON the wall; nothing floats.
 *   • Furniture is grouped into RUNS of things that belong together and touch:
 *     the spice rack above the working surface, the deep drawers beneath it, the
 *     bottle pull-out tucked beside it (LARDER2 § I.4 — "narrow, tall runs beside
 *     the working surfaces"); the fridge and freezer as one cold pair; the
 *     breakfast shelf above the tea & coffee cupboard; the seasonal shelf running
 *     straight on into the reserved bay.
 *   • The wings sit differently on their walls — the heart spans the room, the
 *     smaller wings sit to one side or the other — so the eye travels rather than
 *     reading down a left-hand column.
 *
 * SCOPE LOCK (Pass 2 — composition only):
 *   • No products. No placeholders pretending to be products.
 *   • No pantry data is read or bound (no query, no Domain 30/15/2 read).
 *   • No interactions: no drag/drop, no search, no shopping, no CRUD, no
 *     item menus, no controls. The room is a place, not a tool, at this pass.
 *   • No motion. The room is still (Kept Room Translation § 4.2).
 *   • No architectural change: the six wings, their order, and every furniture
 *     element of LARDER2 § I.4 are exactly as Pass 1 built them.
 *
 * The empty room remains a DESIGNED state: composed emptiness, never bare
 * emptiness (LARDER2 § I.8; Kept Room Translation § 4.3). Surplus wall is the
 * room's air and light (GEA11), never a gap waiting to be filled.
 *
 * The room is lit by ONE morning sun, upper-left, exactly as every room of the
 * house is lit (Kept Room Translation § 4.1; Blueprint § 7) — a wash on plaster,
 * never a second sun. Materials are the house's own: warm timber, plaster, stone,
 * oak, woven willow, ceramic — matte, honest, lived-with (Blueprint § 8).
 */

// ── Furniture — each a permanent element, its own unit, owning no fact ─────────
// Every piece below exists whether or not anything is ever kept in it. None reads
// data; none is interactive. They are the room's bones (LARDER2 § I.4). Each is
// named for assistive technology as the physical thing it is (LARDER1 § 10).

/** Open shelving — the ordered strata, legible because they breathe (LARDER2 § I.4).
 *  `tiers` boards of warm timber, each holding light and air.
 *  Variants: `tall` (the dresser of the Dry Store) · `long` (a low, wide run) ·
 *  `wall` (hung above a base unit). */
function Shelving({
  tiers = 3, variant = "tall", label,
}: { tiers?: number; variant?: "tall" | "long" | "wall"; label: string }) {
  return (
    <div className={`lr-shelving is-${variant}`} role="img" aria-label={label}>
      {Array.from({ length: tiers }).map((_, i) => (
        <div className="lr-shelf" key={i}>
          <div className="lr-shelf-space" />
          <div className="lr-plank" />
        </div>
      ))}
    </div>
  );
}

/** A cupboard — enclosed keeping for what is not on show (LARDER2 § I.4).
 *  `doors` timber doors with turned handles; closed and at rest.
 *  Variants: `tall` (floor to above the eye) · `base` (a low unit beneath a shelf). */
function Cupboard({
  doors = 2, variant = "tall", label,
}: { doors?: number; variant?: "tall" | "base"; label: string }) {
  return (
    <div className={`lr-cupboard is-${variant}`} role="img" aria-label={label}>
      {Array.from({ length: doors }).map((_, i) => (
        <div className="lr-door" key={i}>
          <span className="lr-door-panel" />
          <span className="lr-handle" />
        </div>
      ))}
    </div>
  );
}

/** The working surface — warm oak, the still point and baking area (LARDER2 § I.4) —
 *  with the DEEP DRAWERS in its base, where the low, heavy and loose are kept and
 *  read by pulling them toward you (LARDER2 § I.4). Counter and drawers are one
 *  piece of joinery, as they are in a real larder: the surface you work on, and
 *  the store directly beneath your hands. */
function WorkingSurface() {
  return (
    <div className="lr-counter" role="img" aria-label="Working surface, with deep drawers beneath">
      <div className="lr-counter-top" />
      <div className="lr-counter-base">
        <div className="lr-drawer"><span className="lr-drawer-rail" /></div>
        <div className="lr-drawer"><span className="lr-drawer-rail" /></div>
      </div>
    </div>
  );
}

/** A deep drawer unit standing on its own — low and tucked (the pet corner). */
function Drawer({ rows = 1, label }: { rows?: number; label: string }) {
  return (
    <div className="lr-drawers is-low" role="img" aria-label={label}>
      {Array.from({ length: rows }).map((_, i) => (
        <div className="lr-drawer" key={i}>
          <span className="lr-drawer-rail" />
        </div>
      ))}
    </div>
  );
}

/** A shallow spice rack — many small niches at eye level, found by sight, hung on
 *  the wall by where the cooking happens (LARDER2 § I.5-A5). Empty niches, breathing. */
function SpiceRack() {
  return (
    <div className="lr-spice-rack" role="img" aria-label="Spice rack, on the wall above the working surface">
      <div className="lr-spice-row">
        {Array.from({ length: 8 }).map((_, i) => <span className="lr-niche" key={i} />)}
      </div>
      <div className="lr-plank is-slim" />
    </div>
  );
}

/** A narrow pull-out run for bottles beside the working surface (LARDER2 § I.4/§ I.5-A6).
 *  Tall, slim, upright — empty and standing ready. */
function BottleRun({
  variant = "tall", label,
}: { variant?: "tall" | "short"; label: string }) {
  return (
    <div className={`lr-bottle-run is-${variant}`} role="img" aria-label={label}>
      {Array.from({ length: 4 }).map((_, i) => <span className="lr-bottle-slot" key={i} />)}
    </div>
  );
}

/** Woven produce baskets — open holders for things that breathe (LARDER2 § I.5-C1).
 *  Willow, open, honest; empty and settled on the floor, gathered the way baskets
 *  gather in a real larder — nested and overlapping, never lined up. */
function Baskets() {
  return (
    <div className="lr-baskets" role="img" aria-label="Produce baskets">
      {Array.from({ length: 3 }).map((_, i) => (
        <div className="lr-basket" key={i}>
          <span className="lr-basket-weave" />
          <span className="lr-basket-rim" />
        </div>
      ))}
    </div>
  );
}

/** The fridge — a cold door onto compartments (LARDER2 § I.5-C2). Closed, at rest;
 *  a tall door with a long handle. Presentation only; it does not open at this pass. */
function Fridge() {
  return (
    <div className="lr-appliance lr-fridge" role="img" aria-label="Fridge">
      <div className="lr-appliance-door">
        <span className="lr-appliance-seam" />
        <span className="lr-appliance-handle" />
      </div>
    </div>
  );
}

/** The freezer — long cold keeping, stacked drawers (LARDER2 § I.5-C3). Closed. */
function Freezer() {
  return (
    <div className="lr-appliance lr-freezer" role="img" aria-label="Freezer">
      {Array.from({ length: 3 }).map((_, i) => (
        <div className="lr-freezer-drawer" key={i}>
          <span className="lr-freezer-rail" />
        </div>
      ))}
    </div>
  );
}

/** A reserved bay — deliberately unfilled shelving the room keeps in hand so it
 *  can grow without redesign (LARDER2 § I.4/§ F2/§ I.9). Composed emptiness, warm
 *  and intended — never a bare gap. It continues the seasonal shelf's own planks,
 *  a touch lighter: the same run of shelving, with room left in it. */
function ReservedBay() {
  return (
    <div className="lr-reserved" role="img" aria-label="Reserved shelving, room left in hand">
      {Array.from({ length: 3 }).map((_, i) => (
        <div className="lr-shelf" key={i}>
          <div className="lr-reserved-space" />
          <div className="lr-plank" />
        </div>
      ))}
    </div>
  );
}

// ── Composition ───────────────────────────────────────────────────────────────

/** A wing — a warm area of the room answering one rhythm of family life.
 *  The signage is quiet, the way a well-kept pantry is signed: it gives a sense of
 *  place (recognition, not reading — LARDER2 § I.2). It is never a form header,
 *  and it carries no count, status, or control. */
function Wing({
  name, sense, place, children,
}: {
  name: string; sense: string;
  place: "spanning" | "left" | "right" | "centre";
  children: React.ReactNode;
}) {
  return (
    <section className={`lr-wing is-${place}`} aria-label={name}>
      <header className="lr-wing-head">
        <h2 className="lr-wing-name">{name}</h2>
        <p className="lr-wing-sense">{sense}</p>
      </header>
      {/* The elevation — a wall of plaster with a floor beneath it. The furniture
          stands on that floor; the wall above it is the room's air and light. */}
      <div className="lr-elevation">{children}</div>
    </section>
  );
}

/** A run of furniture — the things that belong together and stand together.
 *  Within a run, pieces touch or tuck against one another; between runs there is
 *  breathing space. Grouping is the whole of this pass. */
function Run({ kind, children }: { kind?: string; children: React.ReactNode }) {
  return <div className={`lr-run${kind ? ` lr-run-${kind}` : ""}`}>{children}</div>;
}

/** A bay — one piece standing on the floor with another hung on the wall above it.
 *  The vertical relationship that turns two objects into one place. */
function Bay({ children }: { children: React.ReactNode }) {
  return <div className="lr-bay">{children}</div>;
}

export default function LarderRoomPage() {
  return (
    <div data-realm="larder" className="larder-room" data-testid="larder-room">
      {/* The room's own morning light and plaster — one sun, upper-left, on stone.
          Presentation only; carries no data and makes no claim (LARDER2 § II.12). */}
      <div className="lr-light" aria-hidden="true" />

      {/* The room's identity — its name at the door — is the SHELL's to draw, not
          the room's (EXP1: "a room cannot be trusted to introduce itself
          differently per page"). The shell names this the Larder above; the room
          simply opens, kept, into its wings. */}
      <div className="lr-inner">
        <div className="lr-rooms">
          {/* ── Wing A — The Dry Store (the heart) ───────────────────────────────
              The room's focal wall, and the only wing given the whole width. It
              reads left to right as a family larder does: the tall dresser where
              the morning falls; the working surface at its still centre, drawers
              beneath and spices on the wall above, the bottle pull-out tucked at
              its side; the overflow cupboard closing the run. */}
          <Wing
            name="The Dry Store"
            sense="The heart of the larder — everything the house always keeps in."
            place="spanning"
          >
            <Run kind="dresser">
              <Shelving tiers={5} variant="tall" label="Open shelving" />
            </Run>

            <Run kind="working">
              <Bay>
                <SpiceRack />
                <WorkingSurface />
              </Bay>
              <BottleRun variant="tall" label="Oils and vinegars, in a pull-out beside the working surface" />
            </Run>

            <Run kind="overflow">
              <Cupboard doors={2} variant="tall" label="Overflow cupboard" />
            </Run>
          </Wing>

          {/* ── Wing B — The Daily Rhythm ────────────────────────────────────────
              The breakfast corner: one small, quiet composition — the breakfast
              shelf hung above the tea and coffee cupboard, so the morning is one
              reach. Set to one side, with the rest of the wall left as air. */}
          <Wing
            name="The Daily Rhythm"
            sense="What starts and ends the day — reached for half-awake, every morning."
            place="left"
          >
            <Run kind="breakfast">
              <Bay>
                <Shelving tiers={2} variant="wall" label="Breakfast shelf" />
                <Cupboard doors={2} variant="base" label="Tea and coffee station" />
              </Bay>
            </Run>
          </Wing>

          {/* ── Wing C — The Cool Store ──────────────────────────────────────────
              One cluster, not two objects: the cold pair — fridge and freezer,
              side by side as one run of joinery — with the produce baskets
              gathered on the floor just short of them, where the cool larder
              always sits in a real kitchen. The rest of the wall is left open. */}
          <Wing
            name="The Cool Store"
            sense="What will not keep on a dry shelf — kept cool, kept cold, kept fresh."
            place="right"
          >
            <Run kind="produce">
              <Baskets />
            </Run>

            <Run kind="cold">
              <Fridge />
              <Freezer />
            </Run>
          </Wing>

          {/* ── Wing D — Hospitality ─────────────────────────────────────────────
              Kept together and kept to one side: the hospitality cupboard with the
              drinks standing against it — what the home reaches for when people
              come (GEA1, hospitality before productivity). */}
          <Wing
            name="Hospitality"
            sense="Kept ready for when people come — so a guest is never met with an empty cupboard."
            place="left"
          >
            <Run kind="guests">
              <Cupboard doors={2} variant="tall" label="Hospitality cupboard" />
              <BottleRun variant="short" label="Drinks" />
            </Run>
          </Wing>

          {/* ── Wing E — The Working House ───────────────────────────────────────
              The household cupboard, with the pet corner low at its foot — the
              corner kept for the animals who depend on the house. */}
          <Wing
            name="The Working House"
            sense="What keeps the house itself going — and a corner for the animals who depend on it."
            place="right"
          >
            <Run kind="household">
              <Cupboard doors={2} variant="tall" label="Household cupboard" />
              <Drawer rows={1} label="Pet corner" />
            </Run>
          </Wing>

          {/* ── Wing F — The Seasonal & Growing Room ─────────────────────────────
              One long, low run of shelving that simply keeps going: the seasonal
              shelf, and then the same shelving with nothing yet on it. The room's
              quietest note, and its promise that it will mature (LARDER2 § I.9). */}
          <Wing
            name="The Seasonal & Growing Room"
            sense="What the year brings, and room left in hand for all the family will one day keep."
            place="centre"
          >
            <Run kind="growing">
              <Shelving tiers={3} variant="long" label="Seasonal shelf" />
              <ReservedBay />
            </Run>
          </Wing>
        </div>
      </div>
    </div>
  );
}
