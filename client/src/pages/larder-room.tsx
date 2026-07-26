import "./larder-room.css";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTrackedMutation } from "@/hooks/use-tracked-mutation";
import { useLocation, useSearch } from "wouter";
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors,
  useDraggable, useDroppable, type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core";
import {
  Refrigerator, Archive, Layers, Home, PawPrint, Apple, Search, X, Plus,
  Loader2, ChevronRight, ChevronLeft, Trash2, ShoppingCart, Sparkles,
  ArrowRightLeft, CircleDot, Info,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadError } from "@/components/ui/load-error";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-adaptive-density";
import { apiRequest } from "@/lib/queryClient";
import { PantryKnowledgeHub } from "@/components/PantryKnowledgeHub";
import PantryIntelligencePanel from "@/components/PantryIntelligencePanel";
import { usePublishCompanionContext } from "@/components/conversation/companion-context";
import { openCompanion } from "@/components/conversation/companion-open";
import { OrchardCasement } from "@/components/layout/orchard-backdrop";
import { resolveRoomExposure } from "@/components/layout/app-shell";
import {
  larderJarAssetRegister,
  larderProduceAssetRegister,
} from "@/components/layout/living-details-manifest";
import {
  JOINERY_METRICS, JAR_METRICS, PRODUCE_METRICS, JAR_LABEL_FRACTION,
  contentBox, canvasCmHeight, canvasCmWidth,
  type LarderAssetMetrics, type JoineryId,
} from "@/pages/larder-room-metrics";
import {
  LARDER_SHELVES, shelfForStaple,
  type LarderShelf, type LarderPiece,
} from "@/pages/larder-shelves";

// ── The governed production artwork (the ONE declared mouth — J7) ─────────────
// Only APPROVED assets are imported: every import below resolves to a Life/House
// Register entry whose bytes are checksum-locked to a recorded Home Owner
// approval. Candidate assets (the 20 procedural jars, the empty and fallback
// jars) are NOT imported — they stay out of runtime until approved.
//
// This refinement introduces NO new artwork. It returns seven pieces of ALREADY
// APPROVED joinery to service — the cupboards, drawer units, spice rack and
// tables the House Register has held byte-locked since the production pass —
// because a room needs furniture, and inventing some would be the fabrication
// this platform exists to refuse.
import imgShelfWide from "@/assets/living-home/larder/joinery/tha-larder-joinery-floating-shelf-oak-wide.png";
import imgShelfMedium from "@/assets/living-home/larder/joinery/tha-larder-joinery-floating-shelf-oak-medium.png";
import imgShelfShort from "@/assets/living-home/larder/joinery/tha-larder-joinery-floating-shelf-oak-short.png";
import imgSpiceRack from "@/assets/living-home/larder/joinery/tha-larder-joinery-floating-spice-rack-oak.png";
import imgCupboardDouble from "@/assets/living-home/larder/joinery/tha-larder-joinery-cupboard-oak-double.png";
import imgCupboardSingle from "@/assets/living-home/larder/joinery/tha-larder-joinery-cupboard-oak-single.png";
import imgDrawerDeep from "@/assets/living-home/larder/joinery/tha-larder-joinery-drawer-unit-oak-deep.png";
import imgDrawerShallow from "@/assets/living-home/larder/joinery/tha-larder-joinery-drawer-unit-oak-shallow.png";
import imgPrepTable from "@/assets/living-home/larder/joinery/tha-larder-joinery-preparation-table-oak.png";
import imgJarRolledOats from "@/assets/living-home/larder/jars/tha-larder-jar-rolled-oats.png";
import imgJarWhiteRice from "@/assets/living-home/larder/jars/tha-larder-jar-white-rice.png";
import imgJarBrownRice from "@/assets/living-home/larder/jars/tha-larder-jar-brown-rice.png";
import imgJarWhitePenne from "@/assets/living-home/larder/jars/tha-larder-jar-white-penne.png";
import imgJarPlainFlour from "@/assets/living-home/larder/jars/tha-larder-jar-plain-flour.png";
import imgJarSugar from "@/assets/living-home/larder/jars/tha-larder-jar-sugar.png";
import imgJarChiaSeeds from "@/assets/living-home/larder/jars/tha-larder-jar-chia-seeds.png";
import imgProduceApple from "@/assets/living-home/larder/produce/tha-larder-produce-apple-red.png";
import imgProduceBroccoli from "@/assets/living-home/larder/produce/tha-larder-produce-broccoli.png";

/**
 * THE LIVING LARDER — the canonical Living Home room
 * (`LIVING_LARDER_CANONICAL_EXPERIENCE_REFINEMENT`, 2026-07-24).
 *
 * ── WHAT CHANGED, AND WHY ────────────────────────────────────────────────────
 * The room worked and did not yet feel like a room: a grid of boards floating on
 * a wash, under a picture of an orchard laid across the top of the page. This
 * pass makes it ONE ARCHITECTURAL SPACE — a pantry with a wall, a window, a
 * built-in dresser, a worktop, a run of fitted furniture, and a flagstone floor,
 * all in one elevation, from one camera, at one scale, under one morning.
 *
 * The composition, and what each part is FOR:
 *   • THE CASEMENT — the orchard, seen from inside the home through a real
 *     opening in the wall, with the wall's own thickness returning around it.
 *     The asset, its crop and its exposure are `<OrchardCasement />`'s (one
 *     owner, one asset, the governed `--orchard-exposure-e2`); the joinery is
 *     the room's own CSS. Nothing is ever laid on the glass.
 *   • THE DRESSER — a built-in with a cornice, stiles and back boards. Each dry
 *     store category is a STRETCH OF SHELF inside it with a written card on the
 *     board's edge. The furniture IS the navigation.
 *   • THE WORKTOP — one oak slab across the room, and the room's still point.
 *     Opening a category does not navigate: the household takes it DOWN and it
 *     is set out on the counter, in the same room, under the same light.
 *   • THE RUN — the cold cupboard, the deep drawers and the little drawers,
 *     fitted beneath the worktop and touching; the tall store cupboard ends the
 *     wall; the worktable stands forward on the flagstones.
 *
 * ── OWNERSHIP IS UNCHANGED (LARDER1 § 2) ─────────────────────────────────────
 * Every action routes through an existing owner and nothing else:
 *   • staples  → Domain 30 (`/api/pantry`, `server/storage.ts` the sole writer)
 *   • shopping → Domain 15 (`/api/shopping-list`) — adding NEVER removes the
 *     staple (LARDER1 § 8); only the explicit Bin gesture does, reversibly
 *   • identity → Domain 2 (server-side on add; and, for the shelf a staple
 *     rests on, `@shared/canonical/resolver` — the ONE resolver, read-only)
 *   • artwork  → the Life/House Registers (checksum-locked, Home-Owner-approved)
 *   • orchard  → `orchard-backdrop.tsx` (the one asset owner)
 * No schema, no migration, no new endpoint, no new fact.
 *
 * ── PRESENTATION LAW ─────────────────────────────────────────────────────────
 *   • The room's ARCHITECTURE is constant — wall, window, worktop, floor: a room
 *     does not lose its walls because a household keeps nothing on one shelf.
 *     The FURNITURE follows the household: a berth or piece the household keeps
 *     nothing in is simply not there (the pet-corner precedent, LARDER2 § I.8),
 *     never an empty state to clear.
 *   • Which shelf a staple lives on is a READING of Domain 2's own family; an
 *     unresolved food rests honestly on the general larder shelf, never a guess.
 *   • A staple renders as its approved production visual where one exists. Where
 *     none exists the gap is HONEST: a wooden tag carrying the household's own
 *     words — never a redrawn jar, never a guessed food.
 *   • No quantity, fill, freshness or expiry is represented anywhere (LARDER1
 *     § 16). "Running low" is the existing Domain-30 flag, shown as text.
 *   • Drag is an enhancement, never the only way (LARDER1 § 10): every drag
 *     outcome exists as a button in each item's menu (keyboard/tap/switch).
 */

function isAlreadyExists(err: unknown): boolean {
  return /already_exists/.test(String((err as Error)?.message ?? ""));
}

interface PantryItem {
  id: number;
  userId: number;
  ingredientKey: string;
  displayName: string | null;
  category: string;
  isDefault: boolean;
  isDeleted: boolean;
  notes: string | null;
  needQuantityValue: number | null;
  needUnit: string | null;
}

const nameOf = (i: PantryItem) => i.displayName || i.ingredientKey;
const normName = (s: string) => s.trim().toLowerCase();

// ── The household's own storage places (Domain 30 `category`) ─────────────────
// These are the six places the owner enforces. They are where a thing is KEPT —
// the room uses them to say where something lives and to carry it somewhere else.
interface Place {
  cat: string;
  label: string;
  short: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PLACES: Place[] = [
  { cat: "larder", label: "Larder shelves", short: "Larder", icon: Archive },
  { cat: "fruit", label: "Fruit & veg", short: "Fruit & veg", icon: Apple },
  { cat: "fridge", label: "Kept cold", short: "Cold", icon: Refrigerator },
  { cat: "freezer", label: "Kept frozen", short: "Frozen", icon: Layers },
  { cat: "household", label: "Household", short: "Household", icon: Home },
  { cat: "pet", label: "Pet corner", short: "Pet", icon: PawPrint },
];
const placeOf = (cat: string) => PLACES.find(a => a.cat === cat) ?? PLACES[0];

// ── Approved visual resolution (register-driven, curated, never inferred) ─────
const JAR_IMAGE: Record<string, string> = {
  "tha-larder-jar-rolled-oats": imgJarRolledOats,
  "tha-larder-jar-white-rice": imgJarWhiteRice,
  "tha-larder-jar-brown-rice": imgJarBrownRice,
  "tha-larder-jar-white-penne": imgJarWhitePenne,
  "tha-larder-jar-plain-flour": imgJarPlainFlour,
  "tha-larder-jar-sugar": imgJarSugar,
  "tha-larder-jar-chia-seeds": imgJarChiaSeeds,
};
const PRODUCE_IMAGE: Record<string, string> = {
  "tha-larder-produce-apple-red": imgProduceApple,
  "tha-larder-produce-broccoli": imgProduceBroccoli,
};

interface ResolvedVisual {
  kind: "jar" | "produce";
  src: string;
  metrics: LarderAssetMetrics;
  sizeClass: "large" | "small";
  /** The register's curated ingredient family (also the shelf's second reading). */
  family: string;
}

/** name → approved visual, from the registers' curated mappings only. */
const VISUAL_BY_NAME: ReadonlyMap<string, ResolvedVisual> = (() => {
  const map = new Map<string, ResolvedVisual>();
  for (const r of larderJarAssetRegister) {
    if (r.availabilityState !== "available") continue;
    const src = JAR_IMAGE[r.id];
    const metrics = JAR_METRICS[r.id];
    if (!src || !metrics) continue;
    for (const m of r.canonicalFoodMappings) {
      map.set(normName(m), { kind: "jar", src, metrics, sizeClass: r.sizeClass ?? "large", family: r.family });
    }
  }
  for (const r of larderProduceAssetRegister) {
    if (r.availabilityState !== "available") continue;
    const src = PRODUCE_IMAGE[r.id];
    const metrics = PRODUCE_METRICS[r.id];
    if (!src || !metrics) continue;
    for (const m of r.canonicalFoodMappings) {
      map.set(normName(m), { kind: "produce", src, metrics, sizeClass: "large", family: r.family });
    }
  }
  return map;
})();

const visualFor = (item: PantryItem): ResolvedVisual | null =>
  VISUAL_BY_NAME.get(normName(nameOf(item))) ?? VISUAL_BY_NAME.get(normName(item.ingredientKey)) ?? null;

/** Which shelf a staple lives on — a reading of Domain 2, never a stored fact. */
const shelfOf = (item: PantryItem): string =>
  shelfForStaple(item.category, item.displayName, item.ingredientKey, visualFor(item)?.family ?? null);

// ── Physical rendering: an asset drawn as its CONTENT box (measured, cm-true) ─
function AssetImg({ src, metrics, className }: { src: string; metrics: LarderAssetMetrics; className?: string }) {
  const c = contentBox(metrics);
  const imgH = canvasCmHeight(metrics);
  const imgW = canvasCmWidth(metrics);
  return (
    <span
      className={`lv-asset${className ? ` ${className}` : ""}`}
      style={{
        width: `calc(var(--lvcm) * ${(imgW * c.width).toFixed(2)})`,
        height: `calc(var(--lvcm) * ${metrics.cmHeight.toFixed(2)})`,
      }}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        style={{
          width: `calc(var(--lvcm) * ${imgW.toFixed(2)})`,
          height: `calc(var(--lvcm) * ${imgH.toFixed(2)})`,
          left: `calc(var(--lvcm) * ${(-c.left * imgW).toFixed(2)})`,
          top: `calc(var(--lvcm) * ${(-c.top * imgH).toFixed(2)})`,
        }}
      />
    </span>
  );
}

/**
 * THE ROOM'S FURNITURE PLAN — a presentation piece → the approved joinery master
 * that depicts it. Every entry is a House Register row that already exists and
 * is already byte-locked; this table only says which of them the room uses where.
 */
const PIECE_JOINERY: Record<LarderPiece, JoineryId> = {
  "shelf": "shelf-medium",
  "spice-rack": "spice-rack",
  "cold-cupboard": "cupboard-double",
  "deep-drawer": "drawer-deep",
  "small-drawers": "drawer-shallow",
  "worktable": "prep-table",
  "store-cupboard": "cupboard-single",
};

const JOINERY_IMAGE: Partial<Record<JoineryId, string>> = {
  "shelf-wide": imgShelfWide,
  "shelf-medium": imgShelfMedium,
  "shelf-short": imgShelfShort,
  "spice-rack": imgSpiceRack,
  "cupboard-double": imgCupboardDouble,
  "cupboard-single": imgCupboardSingle,
  "drawer-deep": imgDrawerDeep,
  "drawer-shallow": imgDrawerShallow,
  "prep-table": imgPrepTable,
};

function Joinery({ id, className }: { id: JoineryId; className?: string }) {
  const src = JOINERY_IMAGE[id];
  if (!src) return null;
  return <AssetImg src={src} metrics={JOINERY_METRICS[id]} className={className} />;
}

/** The jar's own chalk plate — runtime text only, never baked wording. */
function JarPlate({ visual, children }: { visual: ResolvedVisual; children: React.ReactNode }) {
  const plate = JAR_LABEL_FRACTION[visual.sizeClass];
  const c = contentBox(visual.metrics);
  const imgH = canvasCmHeight(visual.metrics);
  const imgW = canvasCmWidth(visual.metrics);
  return (
    <span
      className="lv-jar-label"
      aria-hidden
      style={{
        left: `calc(var(--lvcm) * ${((plate.left - c.left) * imgW).toFixed(2)})`,
        top: `calc(var(--lvcm) * ${((plate.top - c.top) * imgH).toFixed(2)})`,
        width: `calc(var(--lvcm) * ${(plate.width * imgW).toFixed(2)})`,
        height: `calc(var(--lvcm) * ${(plate.height * imgH).toFixed(2)})`,
        /* Legible at the room's one scale: the plate is small, so the wording
           is bounded below by a real reading size rather than shrinking with
           the wall. Nothing else in the room is sized in px. */
        fontSize: `max(8px, calc(var(--lvcm) * ${visual.sizeClass === "small" ? 1.5 : 1.9}))`,
      }}
    >
      {children}
    </span>
  );
}

// ── Item action menu — the non-drag equivalent for EVERY drag outcome ─────────
interface ItemActions {
  toShopping: (i: PantryItem) => void;
  toBin: (i: PantryItem) => void;
  moveTo: (i: PantryItem, cat: string) => void;
  toggleLow: (i: PantryItem) => void;
  busy: boolean;
}

/** The shared interactive wrapper: Popover menu + dnd-kit drag + a11y naming. */
function LarderObject({
  item, actions, dragDisabled, children, className,
}: {
  item: PantryItem; actions: ItemActions; dragDisabled: boolean;
  children: React.ReactNode; className?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const low = item.needQuantityValue !== null;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `item-${item.id}`,
    data: { itemId: item.id },
    disabled: dragDisabled,
  });

  useEffect(() => { if (isDragging) setMenuOpen(false); }, [isDragging]);

  const otherPlaces = PLACES.filter(a => a.cat !== item.category);

  return (
    <Popover open={menuOpen} onOpenChange={(o) => { setMenuOpen(o); if (!o) { setShowMove(false); setShowAbout(false); } }}>
      <PopoverTrigger asChild>
        <button
          ref={setNodeRef}
          type="button"
          {...listeners}
          {...attributes}
          className={`lv-object${low ? " is-low" : ""}${isDragging ? " is-dragging" : ""}${className ? ` ${className}` : ""}`}
          aria-label={`${nameOf(item)}${low ? ", running low" : ", in stock"} — open actions`}
          data-testid={`lardr-product-${item.id}`}
        >
          {children}
          {low && <span className="lardr-product-flag" data-testid={`lardr-low-${item.id}`}>Low</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="lardr-menu" align="center" side="top" data-testid={`lardr-menu-${item.id}`}>
        <div className="lardr-menu-head">
          <span className="lardr-menu-title">{nameOf(item)}</span>
          <span className="lardr-menu-sub">{placeOf(item.category).label} · {low ? "running low" : "in stock"}</span>
        </div>

        {!showMove && !showAbout && (
          <div className="lardr-menu-actions">
            <button className="lardr-menu-btn" onClick={() => { actions.toShopping(item); setMenuOpen(false); }} disabled={actions.busy} data-testid={`lardr-act-shop-${item.id}`}>
              <ShoppingCart className="h-4 w-4" /> Add to shopping
            </button>
            <button className="lardr-menu-btn" onClick={() => { actions.toggleLow(item); setMenuOpen(false); }} disabled={actions.busy} data-testid={`lardr-act-low-${item.id}`}>
              <CircleDot className="h-4 w-4" /> {low ? "Mark as stocked" : "Mark as running low"}
            </button>
            <button className="lardr-menu-btn" onClick={() => setShowMove(true)} disabled={actions.busy} data-testid={`lardr-act-move-${item.id}`}>
              <ArrowRightLeft className="h-4 w-4" /> Move to…
            </button>
            <button className="lardr-menu-btn" onClick={() => setShowAbout(true)} data-testid={`lardr-act-about-${item.id}`}>
              <Info className="h-4 w-4" /> About this
            </button>
            <button className="lardr-menu-btn is-danger" onClick={() => { actions.toBin(item); setMenuOpen(false); }} disabled={actions.busy} data-testid={`lardr-act-bin-${item.id}`}>
              <Trash2 className="h-4 w-4" /> Take out of larder
            </button>
          </div>
        )}

        {showMove && (
          <div className="lardr-menu-actions">
            <button className="lardr-menu-back" onClick={() => setShowMove(false)}>← Back</button>
            {otherPlaces.map(a => (
              <button key={a.cat} className="lardr-menu-btn" onClick={() => { actions.moveTo(item, a.cat); setMenuOpen(false); }} disabled={actions.busy} data-testid={`lardr-move-${item.id}-${a.cat}`}>
                <a.icon className="h-4 w-4" /> {a.label}
              </button>
            ))}
          </div>
        )}

        {showAbout && (
          <div className="lardr-menu-about">
            <button className="lardr-menu-back" onClick={() => setShowAbout(false)}>← Back</button>
            <PantryIntelligencePanel name={nameOf(item)} data-testid={`lardr-about-${item.id}`} />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/**
 * THE HONEST GAP, standing at true scale (`LARDER6`, a governed placeholder).
 *
 * The Life Register holds seven approved jars and two produce masters, so most
 * of what a household actually keeps has no approved artwork. The room must
 * still be a ROOM: a shelf carrying nothing but floating words is a list in a
 * costume, and it breaks the architecture's first principle outright (`RC1` —
 * a room is a volume, nothing in it floats on a field).
 *
 * So a staple with no approved visual stands as a PLAIN UNMARKED PACKET at its
 * own depicted size, in the room's own paper, under the room's one light,
 * carrying the household's OWN WORDS on its label. It is drawn in CSS and
 * introduces no artwork. Its honesty is that **it does not depict the food** —
 * it claims only that something is kept here, which is exactly what the room
 * knows. Never a redrawn jar; never a guessed food (Core Principle 6).
 *
 * It is a placeholder, recorded as an implementation gap. The gap closes as the
 * Life Register grows, and each packet that becomes a jar does so without this
 * room changing at all.
 */
function Packet({ children }: { children: React.ReactNode }) {
  return <span className="lv-tag"><span>{children}</span></span>;
}

/** Render any staple as its resolved physical presence, standing on a surface. */
function StapleObject({ item, actions, dragDisabled, labelled }: {
  item: PantryItem; actions: ItemActions; dragDisabled: boolean;
  /** Set out on the worktop, every object carries its name on the board's edge. */
  labelled: boolean;
}) {
  const visual = visualFor(item);
  const kindClass = visual ? (visual.kind === "jar" ? "is-jar" : "is-produce") : "is-tag";
  return (
    <LarderObject item={item} actions={actions} dragDisabled={dragDisabled} className={kindClass}>
      {visual ? (
        <>
          <AssetImg src={visual.src} metrics={visual.metrics} />
          {visual.kind === "jar" && <JarPlate visual={visual}>{nameOf(item)}</JarPlate>}
        </>
      ) : (
        <Packet>{nameOf(item)}</Packet>
      )}
      {labelled && visual && <span className="lv-caption">{nameOf(item)}</span>}
    </LarderObject>
  );
}

/**
 * The same object at rest where it is kept: seen, not handled.
 *
 * It carries its own chalk plate on the wall, because the room's purpose is
 * served by BEING SEEN, not by being used (`LARDER5` § 3) — a household who has
 * to open a shelf to find out what is on it is reading, not looking, and the
 * blank plate was the room quietly failing its one job.
 */
function PreviewObject({ item }: { item: PantryItem }) {
  const visual = visualFor(item);
  return (
    <span className="lv-object is-preview" aria-hidden>
      {visual ? (
        <>
          <AssetImg src={visual.src} metrics={visual.metrics} />
          {visual.kind === "jar" && <JarPlate visual={visual}>{nameOf(item)}</JarPlate>}
        </>
      ) : (
        <Packet>{nameOf(item)}</Packet>
      )}
    </span>
  );
}

/** One board with things standing on it. */
function Board({ joineryId, children, seatedClass }: {
  joineryId: JoineryId; children?: React.ReactNode; seatedClass?: string;
}) {
  return (
    <div className="lv-board">
      <div className={`lv-seated${seatedClass ? ` ${seatedClass}` : ""}`}>{children}</div>
      <Joinery id={joineryId} />
    </div>
  );
}

/** The written card slipped into a shelf edge, or standing at a piece's foot. */
function Card({ shelf, count }: { shelf: LarderShelf; count: number }) {
  return (
    <span className="lv-card">
      <b>{shelf.label}</b>
      <small>{count} {count === 1 ? "thing" : "things"}</small>
    </span>
  );
}

/** How a berth or piece announces itself, and what happens when it is opened. */
interface BerthProps {
  shelf: LarderShelf;
  items: PantryItem[];
  open: boolean;
  onOpen: () => void;
}

function useBerthDrop(shelf: LarderShelf) {
  return useDroppable({
    id: `shelf-${shelf.id}`,
    data: { kind: "move", category: shelf.category },
    disabled: shelf.kind !== "place",
  });
}

const berthLabel = (shelf: LarderShelf, n: number, open: boolean) =>
  `${shelf.label} — ${n} ${n === 1 ? "thing" : "things"} you keep. ` +
  (open ? "Put it back." : "Take it down to the worktop.");

/** A stretch of shelf inside the dresser — one dry store category. */
function Berth({ shelf, items, open, onOpen }: BerthProps) {
  const { setNodeRef, isOver } = useBerthDrop(shelf);
  const joinery = PIECE_JOINERY[shelf.piece];
  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`lv-berth${isOver ? " is-over" : ""}${open ? " is-open" : ""}`}
      onClick={onOpen}
      aria-expanded={open}
      aria-label={berthLabel(shelf, items.length, open)}
      data-testid={`lardr-shelf-${shelf.id}`}
    >
      <Board joineryId={joinery} seatedClass="is-preview">
        {items.slice(0, 3).map(i => <PreviewObject key={i.id} item={i} />)}
      </Board>
      <Card shelf={shelf} count={items.length} />
    </button>
  );
}

/** A piece of furniture standing on the floor — one storage place. */
function Piece({ shelf, items, open, onOpen }: BerthProps) {
  const { setNodeRef, isOver } = useBerthDrop(shelf);
  const joinery = PIECE_JOINERY[shelf.piece];
  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`lv-piece${isOver ? " is-over" : ""}${open ? " is-open" : ""}`}
      onClick={onOpen}
      aria-expanded={open}
      aria-label={berthLabel(shelf, items.length, open)}
      data-testid={`lardr-shelf-${shelf.id}`}
    >
      <span className="lv-piece-art"><Joinery id={joinery} /></span>
      <Card shelf={shelf} count={items.length} />
    </button>
  );
}

/**
 * SET OUT ON THE WORKTOP. Opening a category takes it DOWN into the room's own
 * working surface rather than navigating to a page about it: the wall stays
 * exactly where it was, the light is the same light, and the household is simply
 * standing at the counter with the thing in front of them.
 */
function SetOut({ shelf, items, actions, busy, onPutBack, perBoard, boardId }: {
  shelf: LarderShelf; items: PantryItem[]; actions: ItemActions; busy: boolean;
  onPutBack: () => void; perBoard: number; boardId: JoineryId;
}) {
  const { setNodeRef, isOver } = useBerthDrop(shelf);
  const rows: PantryItem[][] = [];
  for (let i = 0; i < items.length; i += perBoard) rows.push(items.slice(i, i + perBoard));
  if (rows.length === 0) rows.push([]);

  return (
    <section
      ref={setNodeRef}
      className={`lv-setout${isOver ? " is-over" : ""}`}
      aria-label={`${shelf.label}, set out on the worktop`}
      data-testid={`lardr-shelfview-${shelf.id}`}
    >
      <div className="lv-setout-head">
        <button type="button" className="lv-putback" onClick={onPutBack} data-testid="lardr-shelf-back">
          <ChevronLeft className="h-4 w-4" aria-hidden /> Put back
        </button>
        <h2>{shelf.label}</h2>
      </div>

      {items.length === 0 && (
        <p className="lv-empty" data-testid={`lardr-shelf-empty-${shelf.id}`}>
          Nothing kept here yet — this is where {shelf.holds} would go.
        </p>
      )}

      <div className="lv-setout-boards">
        {rows.map((row, idx) => (
          <Board key={idx} joineryId={boardId}>
            {row.map(i => (
              <StapleObject key={i.id} item={i} actions={actions} dragDisabled={busy} labelled />
            ))}
          </Board>
        ))}
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LarderRoomPage() {
  const { data: items = [], isPending: isLoading, isError, refetch } =
    useQuery<PantryItem[]>({ queryKey: ["/api/pantry"] });
  const { toast } = useToast();
  const qclient = useQueryClient();
  const isMobile = useIsMobile();
  const invalidatePantry = useCallback(() => qclient.invalidateQueries({ queryKey: ["/api/pantry"] }), [qclient]);

  const [addQuery, setAddQuery] = useState("");
  const [addCat, setAddCat] = useState<string>("larder");
  const [activeId, setActiveId] = useState<number | null>(null);

  // ── Mutations: every write goes through an existing Domain 30 / 15 owner ────

  // Domain 15 — add to shopping. NEVER removes the staple (LARDER1 §8).
  const shoppingMutation = useTrackedMutation({
    mutationFn: (item: PantryItem) => apiRequest("POST", "/api/shopping-list", {
      productName: nameOf(item),
      quantityValue: item.needQuantityValue ?? 1,
      unit: item.needUnit || "unit",
      category: item.category,
      source: item.category === "household" ? "household" : "pantry",
    }),
    onSuccess: () => qclient.invalidateQueries({ queryKey: ["/api/shopping-list"] }),
    feedback: {
      success: (_d, item: PantryItem) => `${nameOf(item)} added to shopping`,
      successDescription: "It's still in your larder — we've just noted you need to buy more.",
      failure: "Couldn't add that to your shopping",
      failureDescription: "Nothing changed in your larder. Please try again.",
    },
  });

  // Domain 30 — restore (Undo of the Bin).
  const restoreMutation = useTrackedMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/pantry/${id}/restore`),
    onSuccess: invalidatePantry,
    feedback: {
      satisfied: (err) => isAlreadyExists(err) && { title: "Already back in your larder" },
      failure: "Couldn't put that back",
      failureDescription: "Please try again from your larder.",
    },
  });

  // Domain 30 — take out of the larder (soft-delete). Reversible via restore.
  const binMutation = useTrackedMutation({
    mutationFn: (item: PantryItem) => apiRequest("DELETE", `/api/pantry/${item.id}`),
    onSuccess: (_res, item: PantryItem) => {
      invalidatePantry();
      toast({
        title: `${nameOf(item)} taken out of your larder`,
        description: "It no longer counts as something you keep.",
        action: (
          <ToastAction altText="Undo" onClick={() => restoreMutation.mutate(item.id)} data-testid="lardr-undo-bin">
            Undo
          </ToastAction>
        ),
      });
    },
    feedback: {
      failure: "Couldn't take that out",
      failureDescription: "It's still in your larder. Please try again.",
    },
    onError: invalidatePantry,
  });

  // Domain 30 — move to a different storage place (its `category`).
  const moveMutation = useTrackedMutation({
    mutationFn: ({ item, cat }: { item: PantryItem; cat: string }) =>
      apiRequest("PATCH", `/api/pantry/${item.id}`, { category: cat }),
    onSuccess: invalidatePantry,
    feedback: {
      success: (_d, { item, cat }: { item: PantryItem; cat: string }) => `${nameOf(item)} moved to ${placeOf(cat).label}`,
      failure: "Couldn't move that",
      failureDescription: "It's still where it was. Please try again.",
    },
  });

  // Domain 30 — approximate availability toggle (running low / stocked).
  const lowMutation = useTrackedMutation({
    mutationFn: ({ item, low }: { item: PantryItem; low: boolean }) =>
      apiRequest("PATCH", `/api/pantry/${item.id}`, { needQuantityValue: low ? 1 : null, needUnit: null }),
    onSuccess: invalidatePantry,
    feedback: {
      failure: "Couldn't update that",
      failureDescription: "Your larder still shows what it did before. Please try again.",
    },
  });

  // Domain 30 — add a new staple. Resolves identity against Domain 2 server-side.
  const addMutation = useTrackedMutation({
    mutationFn: ({ name, cat }: { name: string; cat: string }) =>
      apiRequest("POST", "/api/pantry", { ingredient: name, displayName: name, category: cat }),
    onSuccess: () => { invalidatePantry(); setAddQuery(""); },
    feedback: {
      satisfied: (err) => isAlreadyExists(err) && { title: "Already in your larder", description: "This is already something you keep." },
      failure: "Couldn't add that to your larder",
      failureDescription: "It hasn't been saved. Please try again.",
    },
  });

  const busy = shoppingMutation.isPending || binMutation.isPending || moveMutation.isPending || lowMutation.isPending;

  const actions: ItemActions = useMemo(() => ({
    toShopping: (i) => shoppingMutation.mutate(i),
    toBin: (i) => binMutation.mutate(i),
    moveTo: (i, cat) => { if (cat !== i.category) moveMutation.mutate({ item: i, cat }); },
    toggleLow: (i) => lowMutation.mutate({ item: i, low: i.needQuantityValue === null }),
    busy,
  }), [shoppingMutation, binMutation, moveMutation, lowMutation, busy]);

  usePublishCompanionContext({ selectedPantryCategory: addCat });

  // ── Drag orchestration (pointer + touch; keyboard is served by the menu) ────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
  );

  const itemsById = useMemo(() => new Map(items.map(i => [i.id, i])), [items]);

  const onDragStart = (e: DragStartEvent) => {
    const id = e.active.data.current?.itemId as number | undefined;
    setActiveId(id ?? null);
  };
  const onDragEnd = (e: DragEndEvent) => {
    const id = e.active.data.current?.itemId as number | undefined;
    setActiveId(null);
    const over = e.over?.data.current as { kind: string; category?: string } | undefined;
    if (id == null || !over) return;
    const item = itemsById.get(id);
    if (!item) return;
    if (over.kind === "shopping") actions.toShopping(item);
    else if (over.kind === "bin") actions.toBin(item);
    else if (over.kind === "move" && over.category && over.category !== item.category) actions.moveTo(item, over.category);
  };

  const activeItem = activeId != null ? itemsById.get(activeId) ?? null : null;

  // ── The room's furniture, filled from the household's own staples ───────────
  // The plan is the room's (fixed); only the CONTENTS come from the data.
  const byShelf = useMemo(() => {
    const m = new Map<string, PantryItem[]>();
    for (const s of LARDER_SHELVES) m.set(s.id, []);
    for (const i of items) {
      const arr = m.get(shelfOf(i));
      if (arr) arr.push(i);
    }
    return m;
  }, [items]);
  const kept = useMemo(
    () => LARDER_SHELVES.filter(s => (byShelf.get(s.id)?.length ?? 0) > 0),
    [byShelf],
  );
  const dryStore = kept.filter(s => s.zone === "dry-store");
  const workingWall = kept.filter(s => s.zone === "working-wall");
  const underRun = kept.filter(s => s.zone === "under-run");
  const terminus = kept.find(s => s.zone === "terminus") ?? null;
  const foreground = kept.find(s => s.zone === "floor") ?? null;
  const lowCount = useMemo(() => items.filter(i => i.needQuantityValue !== null).length, [items]);

  // ── Where the household is standing: at the wall, or at the worktop ─────────
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const mode: "room" | "explore" = params.get("mode") === "explore" ? "explore" : "room";
  const openShelfId = params.get("shelf");
  const openShelf = openShelfId ? LARDER_SHELVES.find(s => s.id === openShelfId) ?? null : null;
  const setMode = (m: "room" | "explore") =>
    navigate(m === "explore" ? "/pantry?mode=explore" : "/pantry");
  const openShelfAt = (id: string) => navigate(id === openShelfId ? "/pantry" : `/pantry?shelf=${id}`);
  const putBack = () => navigate("/pantry");

  // Taking something down brings the worktop to the household rather than
  // making them look for it. Honest with reduced motion: the jump is instant.
  const setOutRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!openShelf || !setOutRef.current) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    setOutRef.current.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  }, [openShelfId, openShelf]);

  if (mode === "explore") {
    return (
      <div data-realm="pantry" className="lardr-room lv-room" data-testid="larder-room">
        <span className="lv-ceiling" aria-hidden />
        <div className="lardr-inner lv-hall">
          <button onClick={() => setMode("room")} className="lardr-link" data-testid="button-larder-back">
            ← Back to the larder
          </button>
          <div className="pb-8"><PantryKnowledgeHub /></div>
        </div>
      </div>
    );
  }

  const handleAdd = () => {
    const q = addQuery.trim();
    if (!q) return;
    addMutation.mutate({ name: q, cat: addCat });
  };

  const dragging = activeItem !== null;
  // Set-out boards are longer than shelf boards because the household is at the
  // counter rather than across the room. Both are approved joinery; the length
  // is physical, so a phone gets the shorter board and fewer things on it.
  const setOutBoard: JoineryId = isMobile ? "shelf-short" : "shelf-wide";
  const perBoard = isMobile ? 3 : 5;
  const exposure = resolveRoomExposure("/pantry");

  const berthProps = (s: LarderShelf) => ({
    shelf: s,
    items: byShelf.get(s.id) ?? [],
    open: s.id === openShelfId,
    onOpen: () => openShelfAt(s.id),
  });

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
      <div data-realm="pantry" className="lardr-room lv-room" data-testid="larder-room">
        {/* The building: the wall has thickness above the room, and the morning
            falls in from the upper-left. Presentation only — it claims nothing. */}
        <span className="lv-ceiling" aria-hidden />
        <span className="lv-daylight" aria-hidden />

        {isError ? (
          <div className="lardr-inner lv-hall">
            <div className="lardr-panel">
              <LoadError
                what="your larder"
                onRetry={() => refetch()}
                description="Nothing has been lost — what's in your larder is safe. This is a problem at our end."
                data-testid="error-larder"
              />
            </div>
          </div>
        ) : isLoading ? (
          <div className="lardr-inner lv-hall">
            <div className="lardr-loading">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
            </div>
          </div>
        ) : (
          <>
            <div className="lardr-inner lv-hall">
              {/* The room names itself on its own wall — it draws its own
                  threshold (app-shell `ROOMS_OWN_THRESHOLD`). */}
              <header className="lv-sign">
                <h1 data-testid="lardr-room-name">Larder</h1>
                <p>See what you keep.</p>
                {lowCount > 0 && (
                  <p className="lv-note" data-testid="lardr-status-low">
                    {lowCount} {lowCount === 1 ? "thing is" : "things are"} running low.
                  </p>
                )}
              </header>

              {/* ── THE BODY OF THE ROOM ────────────────────────────────────
                  The three walls, the worktop and the fitted run, in ONE
                  elevation sharing one floor line at its foot, one head height
                  and one light. This is what makes the room a VOLUME rather
                  than a stack of bands (LARDER5 § 5, RC1). */}
              <div className="lv-body">
                <div className="lv-walls">
                  {/* THE LEFT RETURN — the working wall: the room's one
                      aperture, its only light, and the spice rack hung beneath
                      the sill where LARDER5 § 9.2 puts it. */}
                  <div className="lv-return" data-testid="lardr-working-wall">
                    <div className="lv-casement-well">
                      <div className="lv-lintel" aria-hidden />
                      <div className="lv-casement">
                        <OrchardCasement exposure={exposure} />
                        <span className="lv-casement-frame" aria-hidden />
                      </div>
                      <div className="lv-casement-sill" aria-hidden />
                    </div>
                    {workingWall.length > 0 && (
                      <div className="lv-hangings">
                        {workingWall.map(s => <Berth key={s.id} {...berthProps(s)} />)}
                      </div>
                    )}
                  </div>

                  {/* THE BACK WALL — the Dry Store: the room's focal plane, and
                      the surface the household came to look at. */}
                  <div className="lv-dresser">
                    <div className="lv-cornice" aria-hidden />
                    <div className="lv-drystore">
                      <div className="lv-bays" data-testid="lardr-wall">
                        {dryStore.length === 0 ? (
                          <p className="lv-empty" data-testid="lardr-wall-empty">
                            The shelves are ready. Add the first thing you keep and it will find its place.
                          </p>
                        ) : (
                          dryStore.map(s => <Berth key={s.id} {...berthProps(s)} />)
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Set out ON the slab — the household takes a category down
                    into the room's own working surface. Nothing navigates, the
                    wall stays where it was, and the viewpoint does not move. */}
                {openShelf && (
                  <div ref={setOutRef}>
                    <SetOut
                      shelf={openShelf}
                      items={byShelf.get(openShelf.id) ?? []}
                      actions={actions}
                      busy={busy}
                      onPutBack={putBack}
                      perBoard={perBoard}
                      boardId={setOutBoard}
                    />
                  </div>
                )}

                {/* THE WORKTOP — one oak slab across the room, passing IN FRONT
                    of the run beneath it. That occlusion is the room's depth. */}
                <div className="lv-worktop" aria-hidden />

                {/* THE RUN — fitted furniture standing on the floor beneath the
                    slab, touching, as a fitted larder does. */}
                <div className="lv-run" data-testid="lardr-run">
                  {underRun.map(s => <Piece key={s.id} {...berthProps(s)} />)}
                </div>

                {/* THE TERMINUS — the tall store cupboard ending the wall on
                    the right, rising past the worktop from the floor. */}
                {terminus && (
                  <div className="lv-terminus">
                    <Piece {...berthProps(terminus)} />
                  </div>
                )}
              </div>
            </div>

            {/* ── THE FLOOR ──────────────────────────────────────────────────
                One continuous ground running forward from the foot of every
                wall to the near edge — full-bleed to the room's own walls,
                because a floor that stops short of them is a rug. The room's
                own worktable stands on it in the morning; the doorway and the
                shopping basket stand at the household's feet, where LARDER5
                § 10.4 puts them. */}
            <div className="lv-floorline">
                <div className="lardr-inner lv-hall">
                  <div className="lv-floor-plan">
                    <div>
                      {foreground && (
                        <div className="lv-foreground">
                          <Piece {...berthProps(foreground)} />
                        </div>
                      )}
                    </div>

                    <div className="lv-door">
                      <Destinations
                        carrying={activeItem}
                        onOpenShopping={() => navigate("/shopping-workspace")}
                      />

                      {/* Search — the single add-item gesture (LARDER1 §6). */}
                      <div className="lardr-add">
                        <div className="lardr-add-row">
                          <Search className="lardr-add-search h-4 w-4" aria-hidden />
                          <input
                            type="text"
                            value={addQuery}
                            onChange={e => setAddQuery(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleAdd()}
                            placeholder="Add something you keep…"
                            aria-label="Add something you keep to your larder"
                            className="lardr-add-input"
                            data-testid="lardr-add-input"
                          />
                          {addQuery && (
                            <button type="button" onClick={() => setAddQuery("")} className="lardr-add-clear" aria-label="Clear">
                              <X className="h-4 w-4" />
                            </button>
                          )}
                          <button type="button" className="lardr-add-btn" onClick={handleAdd} disabled={!addQuery.trim() || addMutation.isPending} data-testid="lardr-add-btn">
                            {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            <span>Add</span>
                          </button>
                        </div>
                        <div className="lardr-add-where" role="group" aria-label="Where do you keep it?">
                          {PLACES.map(a => (
                            <button
                              key={a.cat}
                              type="button"
                              className={`lardr-add-chip${addCat === a.cat ? " is-active" : ""}`}
                              onClick={() => setAddCat(a.cat)}
                              aria-pressed={addCat === a.cat}
                              data-testid={`lardr-add-where-${a.cat}`}
                            >
                              <a.icon className="h-3.5 w-3.5" /> {a.short}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Smart suggestions — advice is the Companion's (GEA8; LARDER1 §9). */}
                      <button type="button" className="lardr-suggest" onClick={() => openCompanion()} data-testid="button-larder-suggestions">
                        <Sparkles className="h-5 w-5" />
                        <span>
                          <b>Smart suggestions</b>
                          <small>Ask Apple what you can make from what you keep</small>
                        </span>
                        <ChevronRight className="h-5 w-5" aria-hidden />
                      </button>

                      <button onClick={() => setMode("explore")} className="lardr-link" data-testid="button-larder-explore">
                        Explore the wider larder →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
          </>
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <div className="lv-drag-overlay">
            <DragGhost item={activeItem} />
            <span>{nameOf(activeItem)}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/** The drag overlay ghost — the same production visual, at the same one scale. */
function DragGhost({ item }: { item: PantryItem }) {
  const visual = visualFor(item);
  if (visual) return <AssetImg src={visual.src} metrics={visual.metrics} />;
  return <Packet>{nameOf(item)}</Packet>;
}

/**
 * THE DOORWAY AND THE BASKET — the room's two permanent destinations, standing
 * on the floor where they physically are (`LARDER5` § 10.4).
 *
 * ── WHY THIS IS NOT A DOCK ───────────────────────────────────────────────────
 * It replaces a bar fixed to the bottom of the viewport. `LARDER5` § 12 names
 * that shape and refuses it — *"a bar pinned to the bottom of the screen, which
 * would be a navigation control by another name"* — and § 10.4 requires the
 * opposite: **places, not modes.** The basket is a basket whether or not
 * anything is being carried; the doorway is the way the household came in.
 *
 * Both sit at the near edge of the floor, at the household's feet, so both
 * destructive-feeling acts are a movement TOWARD THE VIEWER AND DOWN — the
 * physical motion of putting something in a basket, or carrying it out of the
 * house. Neither requires a long traverse across the room.
 *
 *   • the basket  → Domain 15. **The provision stays on its shelf** (`LARDER1`
 *                   § 8, the load-bearing rule).
 *   • the doorway → Domain 30 soft-delete. Reversible.
 *
 * The other places in the house appear only while something is being carried,
 * because where to put a thing down is only a question when a thing is in the
 * hand. **None of it is required:** every outcome here lives in each object's
 * own menu, reachable by keyboard, tap and switch (`LARDER1` § 10).
 */
function Destinations({ onOpenShopping, carrying }: {
  onOpenShopping: () => void; carrying: PantryItem | null;
}) {
  const shopping = useDroppable({ id: "shopping", data: { kind: "shopping" } });
  const bin = useDroppable({ id: "bin", data: { kind: "bin" } });
  return (
    <div className="lv-destinations" role="group" aria-label="The door of the larder">
      <button
        ref={shopping.setNodeRef}
        type="button"
        onClick={onOpenShopping}
        className={`lv-place is-basket${shopping.isOver ? " is-over" : ""}`}
        data-testid="lardr-dock-shopping"
        aria-label="The shopping basket by the door — put something in it to add it to your shopping. It stays in your larder."
      >
        <span className="lv-place-art" aria-hidden />
        <span>Shopping basket</span>
      </button>
      <div
        ref={bin.setNodeRef}
        className={`lv-place is-doorway${bin.isOver ? " is-over" : ""}`}
        data-testid="lardr-dock-bin"
        aria-label="The doorway — carry something out through it to take it out of your larder. You can bring it back."
      >
        <span className="lv-place-art" aria-hidden />
        <span>Out the door</span>
      </div>
      {carrying && (
        <div className="lv-carrying">
          {PLACES.filter(p => p.cat !== carrying.category).map(p => (
            <PlaceTarget key={p.cat} place={p} />
          ))}
        </div>
      )}
    </div>
  );
}

/** One place a carried thing can be set down in (Domain 30 `category`). */
function PlaceTarget({ place }: { place: Place }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `place-${place.cat}`,
    data: { kind: "move", category: place.cat },
  });
  const Icon = place.icon;
  return (
    <div
      ref={setNodeRef}
      className={`lv-carry-target${isOver ? " is-over" : ""}`}
      data-testid={`lardr-dock-place-${place.cat}`}
      aria-label={`${place.label} — set it down here to keep it there`}
    >
      <Icon className="h-4 w-4" />
      <span>{place.short}</span>
    </div>
  );
}
