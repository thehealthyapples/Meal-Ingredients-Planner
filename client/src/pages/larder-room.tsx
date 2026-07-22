import "./larder-room.css";

/**
 * The Living Larder — Pass 1: the empty room (LARDER4 § 8, Pass 1 "Room structure").
 *
 * This is the PERMANENT ARCHITECTURE of the room, built furniture-first and
 * complete while empty (LARDER4 § 4; LARDER2 § I.4). It renders the six wings of
 * the interior architecture (LARDER2 § I.3/§ I.5) and their permanent furniture —
 * shelving, cupboards, drawers, a fridge, a freezer, a working surface, baskets,
 * and reserved growth areas — and NOTHING ELSE.
 *
 * SCOPE LOCK (Pass 1 only):
 *   • No products. No placeholders pretending to be products.
 *   • No pantry data is read or bound (no query, no Domain 30/15/2 read).
 *   • No interactions: no drag/drop, no search, no shopping, no CRUD, no
 *     item menus, no controls. The room is a place, not a tool, at this pass.
 *   • The prepared photographic assets under client/src/assets/larder are NOT
 *     used: they depict invented products/produce, which LARDER2 § II.12 / ED3
 *     forbid the room from dressing itself with ("if the room put it there, it
 *     is refused"). The room is built from honest materials instead.
 *
 * The empty room is a DESIGNED state: composed emptiness, never bare emptiness
 * (LARDER2 § I.8; Kept Room Translation § 4.3). Empty shelves are warm air and
 * light — an open invitation to keep something — never a blank, an error, or a
 * prompt to fill. If every pantry item disappeared, this is what remains, and it
 * is already a room a household would happily spend time in (CRAFT1 § 8).
 *
 * The room is lit by ONE morning sun, upper-left, exactly as every room of the
 * house is lit (Kept Room Translation § 4.1; Blueprint § 7) — a wash on plaster,
 * never a second sun. Materials are the house's own: warm timber, plaster, stone,
 * oak, woven willow, ceramic — matte, honest, lived-with (Blueprint § 8).
 */

// ── Furniture — each a permanent element, its own unit, owning no fact ─────────
// Every piece below exists whether or not anything is ever kept in it. None reads
// data; none is interactive. They are the room's bones (LARDER2 § I.4).

/** Open shelving — the ordered strata, legible because they breathe (LARDER2 § I.4).
 *  `tiers` boards of warm timber, each holding light and air. */
function Shelving({ tiers = 3, tall = false }: { tiers?: number; tall?: boolean }) {
  return (
    <div className={`lr-shelving${tall ? " is-tall" : ""}`} aria-hidden="true">
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
 *  `doors` timber doors with turned handles; closed and at rest. */
function Cupboard({ doors = 2 }: { doors?: number }) {
  return (
    <div className="lr-cupboard" aria-hidden="true">
      {Array.from({ length: doors }).map((_, i) => (
        <div className="lr-door" key={i}>
          <span className="lr-door-panel" />
          <span className="lr-handle" />
        </div>
      ))}
    </div>
  );
}

/** A deep drawer — for the low, heavy and loose, read by pulling it toward you
 *  (LARDER2 § I.4). Closed and flush; a face with a rail handle. */
function Drawer({ rows = 2 }: { rows?: number }) {
  return (
    <div className="lr-drawers" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="lr-drawer" key={i}>
          <span className="lr-drawer-rail" />
        </div>
      ))}
    </div>
  );
}

/** A shallow spice rack — many small niches at eye level, found by sight
 *  (LARDER2 § I.5-A5). Empty niches, breathing. */
function SpiceRack() {
  return (
    <div className="lr-spice-rack" aria-hidden="true">
      <div className="lr-spice-row">
        {Array.from({ length: 8 }).map((_, i) => <span className="lr-niche" key={i} />)}
      </div>
      <div className="lr-plank is-slim" />
    </div>
  );
}

/** A narrow pull-out run for bottles beside the working surface (LARDER2 § I.4/§ I.5-A6).
 *  Tall, slim, upright — empty and standing ready. */
function BottleRun() {
  return (
    <div className="lr-bottle-run" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => <span className="lr-bottle-slot" key={i} />)}
    </div>
  );
}

/** The working surface — warm oak, the still point and baking area (LARDER2 § I.4).
 *  A clear, calm counter: the one place that is a working surface first. */
function WorkingSurface() {
  return (
    <div className="lr-counter" aria-hidden="true">
      <div className="lr-counter-top" />
      <div className="lr-counter-front" />
    </div>
  );
}

/** Woven produce baskets — open holders for things that breathe (LARDER2 § I.5-C1).
 *  Willow, open, honest; empty and settled, waiting. */
function Baskets({ count = 3 }: { count?: number }) {
  return (
    <div className="lr-baskets" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div className="lr-basket" key={i}>
          <span className="lr-basket-weave" />
          <span className="lr-basket-rim" />
        </div>
      ))}
    </div>
  );
}

/** The fridge — a cold door onto compartments (LARDER2 § I.5-C2). Closed, at rest;
 *  a tall door with a long handle. Presentation only; it does not open at Pass 1. */
function Fridge() {
  return (
    <div className="lr-appliance lr-fridge" aria-hidden="true">
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
    <div className="lr-appliance lr-freezer" aria-hidden="true">
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
 *  and intended — never a bare gap. The room's promise that it will mature. */
function ReservedBay() {
  return (
    <div className="lr-reserved" aria-hidden="true">
      <div className="lr-reserved-space" />
      <div className="lr-plank" />
      <div className="lr-reserved-space" />
      <div className="lr-plank" />
    </div>
  );
}

// ── A wing — a warm area of the room answering one rhythm of family life ───────
// The label is quiet signage in a well-kept pantry, giving a sense of place
// (recognition, not reading — LARDER2 § I.2). It is never a form header, and it
// carries no count, status, or control.
function Wing({
  name, sense, children, wide = false,
}: { name: string; sense: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <section className={`lr-wing${wide ? " is-wide" : ""}`} aria-label={name}>
      <header className="lr-wing-head">
        <h2 className="lr-wing-name">{name}</h2>
        <p className="lr-wing-sense">{sense}</p>
      </header>
      <div className="lr-wing-body">{children}</div>
    </section>
  );
}

/** A named piece of furniture within a wing — a quiet nameplate beneath the piece,
 *  the way a joiner's room is known. Keeps the empty room legible without turning
 *  it into a list. */
function Piece({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="lr-piece">
      <div className="lr-piece-furniture">{children}</div>
      <span className="lr-piece-name">{name}</span>
    </div>
  );
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
          {/* Wing A — The Dry Store (the heart). Open shelving dominates; the
              working surface is the still point; a spice rack, a bottle run, a
              deep drawer, and an overflow cupboard complete the heart of the room. */}
          <Wing
            name="The Dry Store"
            sense="The heart of the larder — everything the house always keeps in."
            wide
          >
            <Piece name="Open shelving"><Shelving tiers={4} tall /></Piece>
            <Piece name="Spice rack"><SpiceRack /></Piece>
            <Piece name="Oils &amp; bottles"><BottleRun /></Piece>
            <Piece name="Working surface"><WorkingSurface /></Piece>
            <Piece name="Deep drawer"><Drawer rows={2} /></Piece>
            <Piece name="Overflow cupboard"><Cupboard doors={2} /></Piece>
          </Wing>

          {/* Wing B — The Daily Rhythm. The few stations touched every morning and
              evening: the breakfast shelf and the tea &amp; coffee station. */}
          <Wing
            name="The Daily Rhythm"
            sense="What starts and ends the day — reached for half-awake, every morning."
          >
            <Piece name="Breakfast shelf"><Shelving tiers={2} /></Piece>
            <Piece name="Tea &amp; coffee station"><Cupboard doors={1} /></Piece>
          </Wing>

          {/* Wing C — The Cool Store. A physical fact, a wing of its own: the
              produce baskets, the fridge, and the freezer. */}
          <Wing
            name="The Cool Store"
            sense="What will not keep on a dry shelf — kept cool, kept cold, kept fresh."
            wide
          >
            <Piece name="Produce baskets"><Baskets count={3} /></Piece>
            <Piece name="Fridge"><Fridge /></Piece>
            <Piece name="Freezer"><Freezer /></Piece>
          </Wing>

          {/* Wing D — Hospitality. What the home keeps ready for other people —
              hospitality is the founding value of the whole house (GEA1). */}
          <Wing
            name="Hospitality"
            sense="Kept ready for when people come — so a guest is never met with an empty cupboard."
          >
            <Piece name="Hospitality cupboard"><Cupboard doors={2} /></Piece>
            <Piece name="Drinks"><BottleRun /></Piece>
          </Wing>

          {/* Wing E — The Working House. The non-food provisions a running home
              needs, and the corner kept for the household's animals. */}
          <Wing
            name="The Working House"
            sense="What keeps the house itself going — and a corner for the animals who depend on it."
          >
            <Piece name="Household cupboard"><Cupboard doors={2} /></Piece>
            <Piece name="Pet corner"><Drawer rows={1} /></Piece>
          </Wing>

          {/* Wing F — The Seasonal &amp; Growing Room. What comes and goes with the
              year, and space deliberately kept in hand so the room can mature for a
              decade without being redesigned (LARDER2 § I.9). */}
          <Wing
            name="The Seasonal &amp; Growing Room"
            sense="What the year brings, and room left in hand for all the family will one day keep."
          >
            <Piece name="Seasonal shelf"><Shelving tiers={2} /></Piece>
            <Piece name="Room to grow"><ReservedBay /></Piece>
          </Wing>
        </div>

        <footer className="lr-foot" aria-hidden="true">
          <span className="lr-foot-mark" />
        </footer>
      </div>
    </div>
  );
}
