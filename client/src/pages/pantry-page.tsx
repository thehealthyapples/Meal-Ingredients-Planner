import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTrackedMutation } from "@/hooks/use-tracked-mutation";
import { useLocation, useSearch } from "wouter";
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors,
  useDraggable, useDroppable, type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core";
import {
  Refrigerator, Archive, Layers, Home, PawPrint, Apple, Search, X, Plus,
  Loader2, ChevronRight, ChevronDown, Trash2, ShoppingCart, Sparkles,
  ArrowRightLeft, CircleDot, Info,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadError } from "@/components/ui/load-error";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { pageContainerClass } from "@/components/workspace-header";
import { PantryKnowledgeHub } from "@/components/PantryKnowledgeHub";
import PantryIntelligencePanel from "@/components/PantryIntelligencePanel";
import { usePublishCompanionContext } from "@/components/conversation/companion-context";
import { openCompanion } from "@/components/conversation/companion-open";
import { deriveForm, variantOf, type PhysicalForm } from "@/lib/larder-forms";

/**
 * The Larder — a physical, interactive room (LARDER1).
 *
 * This is a REBUILD, not a restyle: the room is constructed from separate,
 * directly-manipulable storage objects — shelving, cupboards, a fridge and a
 * freezer that open, baskets and drawers — with the household's REAL Domain 30
 * staples rendered as physical objects (jars, tins, bottles, packets, boxes,
 * baskets, tubs) that sit on real shelves. It replaces the card → modal →
 * CRUD-list room entirely.
 *
 * Ownership is unchanged (LARDER1 §2). Every action routes through an existing
 * owner:
 *   • staples  → Domain 30 (`/api/pantry`, `server/storage.ts` the sole writer)
 *   • shopping → Domain 15 (`/api/shopping-list`)
 *   • identity → Domain 2 (canonical resolution, server-side, on add)
 * The physical *form* of each object is a deterministic PRESENTATION reading of
 * data the owner already holds (LARDER1 §3) — it is never stored and never a
 * claim. The load-bearing rule holds: sending to Shopping never removes the
 * staple (LARDER1 §8); only the explicit Bin gesture takes it out, reversibly
 * (LARDER1 §4.2/§4.3).
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

// ── The household's own storage places (LARDER1 §3) ───────────────────────────
// A `category` becomes a place in the room — a real piece of furniture — never a
// tab. The room reads the column that already exists; it owns no new categorisation.
type Furniture = "shelving" | "baskets" | "appliance" | "cupboard" | "drawer";

interface Area {
  cat: string;
  label: string;        // the furniture's name, as the household would say it
  short: string;
  furniture: Furniture;
  icon: React.ComponentType<{ className?: string }>;
  opensClosed?: boolean; // fridge / freezer — a door that opens
}

const AREAS: Area[] = [
  { cat: "larder",    label: "Larder shelves",     short: "Larder",    furniture: "shelving",  icon: Archive },
  { cat: "fruit",     label: "Fruit & veg baskets", short: "Fruit & veg", furniture: "baskets", icon: Apple },
  { cat: "fridge",    label: "Fridge",             short: "Fridge",    furniture: "appliance", icon: Refrigerator, opensClosed: true },
  { cat: "freezer",   label: "Freezer",            short: "Freezer",   furniture: "appliance", icon: Layers, opensClosed: true },
  { cat: "household", label: "Household cupboard", short: "Household", furniture: "cupboard",  icon: Home },
  { cat: "pet",       label: "Pet corner",         short: "Pet",       furniture: "drawer",    icon: PawPrint },
];
const areaOf = (cat: string) => AREAS.find(a => a.cat === cat) ?? AREAS[0];

// ── A product, drawn as the physical object it lives as ───────────────────────
// A deterministic reading of the record (LARDER1 §3). The label is always the
// household's real name; the shape is only how the room shows what they keep.
// Availability is approximate and read by looking — a fuller vs a lower object,
// never a number (LARDER1 §3/§14) — and it is ALSO carried in text/shape (the
// "low" tag), so it is never conveyed by fill or colour alone (LARDER1 §10).
function ProductGlyph({ form, low, id }: { form: PhysicalForm; low: boolean; id: number }) {
  // Fill: stocked reads fuller, running-low reads lower. Approximate, not a measure.
  const fill = low ? 0.42 : 0.82;
  const v = variantOf(id, 3); // deterministic per-item variation so a shelf isn't clones
  const tint = ["#d9c7a1", "#cbb488", "#e0d2b0"][v];
  const contents = low ? "var(--lardr-low-fill)" : "var(--lardr-fill)";

  switch (form) {
    case "bottle":
      return (
        <svg viewBox="0 0 40 56" className="lardr-glyph" aria-hidden>
          <rect x="17" y="3" width="6" height="7" rx="1.5" fill="var(--lardr-lid)" />
          <path d="M15 10 h10 v6 l3 5 v29 a3 3 0 0 1-3 3 H15 a3 3 0 0 1-3-3 V21 l3-5 z" fill="var(--lardr-glass)" stroke="var(--lardr-edge)" strokeWidth="1" />
          <path d="M13 30 h14 v20 a3 3 0 0 1-3 3 H16 a3 3 0 0 1-3-3 z" fill={contents} opacity="0.85" />
          <rect x="14" y="34" width="12" height="9" rx="1.5" fill="var(--lardr-label)" opacity="0.9" />
        </svg>
      );
    case "tin":
      return (
        <svg viewBox="0 0 40 56" className="lardr-glyph" aria-hidden>
          <rect x="9" y="12" width="22" height="38" rx="3" fill="var(--lardr-metal)" stroke="var(--lardr-edge)" strokeWidth="1" />
          <ellipse cx="20" cy="12" rx="11" ry="3.4" fill="var(--lardr-metal-top)" />
          <rect x="9" y="22" width="22" height="18" fill="var(--lardr-label)" opacity="0.92" />
          <rect x="9" y="22" width="22" height="18" fill={contents} opacity="0.18" />
        </svg>
      );
    case "packet":
      return (
        <svg viewBox="0 0 40 56" className="lardr-glyph" aria-hidden>
          <path d="M10 12 l20 0 l-2 4 l2 4 l-2 4 l2 26 a2 2 0 0 1-2 2 H12 a2 2 0 0 1-2-2 l2-26 l-2-4 l2-4 l-2-4 z" fill={tint} stroke="var(--lardr-edge)" strokeWidth="1" />
          <rect x="12" y="26" width="16" height="16" rx="1" fill="var(--lardr-label)" opacity="0.88" />
          <rect x="12" y="26" width="16" height={16 * fill} rx="1" fill={contents} opacity="0.25" />
        </svg>
      );
    case "box":
      return (
        <svg viewBox="0 0 40 56" className="lardr-glyph" aria-hidden>
          <rect x="9" y="9" width="22" height="43" rx="2" fill={tint} stroke="var(--lardr-edge)" strokeWidth="1" />
          <rect x="9" y="9" width="22" height="8" fill="var(--lardr-lid)" opacity="0.55" />
          <rect x="12" y="22" width="16" height="24" rx="1" fill="var(--lardr-label)" opacity="0.9" />
          <rect x="12" y={22 + 24 * (1 - fill)} width="16" height={24 * fill} rx="1" fill={contents} opacity="0.22" />
        </svg>
      );
    case "tub":
      return (
        <svg viewBox="0 0 40 56" className="lardr-glyph" aria-hidden>
          <rect x="8" y="20" width="24" height="30" rx="3" fill="var(--lardr-glass)" stroke="var(--lardr-edge)" strokeWidth="1" />
          <ellipse cx="20" cy="20" rx="13" ry="4" fill="var(--lardr-lid)" />
          <rect x="8" y="30" width="24" height="20" fill={contents} opacity="0.5" />
          <rect x="11" y="33" width="18" height="10" rx="1.5" fill="var(--lardr-label)" opacity="0.9" />
        </svg>
      );
    case "basket":
      return (
        <svg viewBox="0 0 40 56" className="lardr-glyph" aria-hidden>
          <circle cx="14" cy="24" r="6.5" fill={low ? "#c7b27e" : "#b7863f"} />
          <circle cx="24" cy="22" r="7" fill={low ? "#cdbb86" : "#c78a3c"} />
          <circle cx="20" cy="27" r="6" fill={low ? "#c1ad7a" : "#a9762f"} />
          <path d="M6 26 h28 l-3 20 a3 3 0 0 1-3 3 H12 a3 3 0 0 1-3-3 z" fill="var(--lardr-basket)" stroke="var(--lardr-edge)" strokeWidth="1" />
          <path d="M6 26 h28 l-1 6 H7 z" fill="var(--lardr-basket-rim)" />
        </svg>
      );
    case "herbs":
      return (
        <svg viewBox="0 0 40 56" className="lardr-glyph" aria-hidden>
          <path d="M20 8 c-5 2-8 8-7 16 M20 8 c5 2 8 8 7 16 M20 6 v22" stroke={low ? "#8a9b5f" : "#5f7d34"} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <circle cx="13" cy="18" r="3" fill={low ? "#93a76a" : "#6f8f3e"} />
          <circle cx="27" cy="18" r="3" fill={low ? "#93a76a" : "#6f8f3e"} />
          <path d="M11 30 h18 l-2 18 a3 3 0 0 1-3 3 H16 a3 3 0 0 1-3-3 z" fill="var(--lardr-pot)" stroke="var(--lardr-edge)" strokeWidth="1" />
        </svg>
      );
    case "generic":
      return (
        <svg viewBox="0 0 40 56" className="lardr-glyph" aria-hidden>
          <path d="M12 14 h16 a2 2 0 0 1 2 2 v34 a2 2 0 0 1-2 2 H12 a2 2 0 0 1-2-2 V16 a2 2 0 0 1 2-2 z" fill={tint} stroke="var(--lardr-edge)" strokeWidth="1" strokeDasharray="0" />
          <path d="M12 14 c2-4 14-4 16 0" fill="none" stroke="var(--lardr-edge)" strokeWidth="1" />
          <rect x="13" y="30" width="14" height="14" rx="1" fill="var(--lardr-label)" opacity="0.85" />
        </svg>
      );
    case "large-jar":
    case "jar":
    default: {
      const tall = form === "large-jar";
      const top = tall ? 8 : 12;
      return (
        <svg viewBox="0 0 40 56" className="lardr-glyph" aria-hidden>
          <rect x="12" y={top - 4} width="16" height="5" rx="1.5" fill="var(--lardr-lid)" />
          <rect x="10" y={top} width="20" height={50 - top} rx="4" fill="var(--lardr-glass)" stroke="var(--lardr-edge)" strokeWidth="1" />
          <rect x="10" y={top + (50 - top) * (1 - fill)} width="20" height={(50 - top) * fill} rx="3" fill={contents} opacity="0.9" />
          <rect x="13" y={30} width="14" height="12" rx="1.5" fill="var(--lardr-label)" />
        </svg>
      );
    }
  }
}

// ── Item action menu (the non-drag equivalent for EVERY drag outcome) ──────────
// LARDER1 §10: "Drag is an enhancement, never the only way." Selecting a product
// (click / tap / keyboard Enter) opens this menu; every move a drag can make is
// here as a button, so keyboard, switch and touch users reach identical outcomes.
interface ItemActions {
  toShopping: (i: PantryItem) => void;
  toBin: (i: PantryItem) => void;
  moveTo: (i: PantryItem, cat: string) => void;
  toggleLow: (i: PantryItem) => void;
  busy: boolean;
}

function ProductObject({
  item, actions, dragDisabled,
}: { item: PantryItem; actions: ItemActions; dragDisabled: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const form = deriveForm({ name: nameOf(item), category: item.category });
  const low = item.needQuantityValue !== null;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `item-${item.id}`,
    data: { itemId: item.id },
    disabled: dragDisabled,
  });

  // A drag must never leave a menu hanging open behind the drag overlay.
  useEffect(() => { if (isDragging) { setMenuOpen(false); } }, [isDragging]);

  const otherAreas = AREAS.filter(a => a.cat !== item.category);

  return (
    <Popover open={menuOpen} onOpenChange={(o) => { setMenuOpen(o); if (!o) { setShowMove(false); setShowAbout(false); } }}>
      <PopoverTrigger asChild>
        <button
          ref={setNodeRef}
          type="button"
          {...listeners}
          {...attributes}
          className={`lardr-product${low ? " is-low" : ""}${isDragging ? " is-dragging" : ""}`}
          aria-label={`${nameOf(item)}${low ? ", running low" : ", in stock"} — open actions`}
          data-testid={`lardr-product-${item.id}`}
        >
          <ProductGlyph form={form} low={low} id={item.id} />
          <span className="lardr-product-name">{nameOf(item)}</span>
          {low && <span className="lardr-product-flag" data-testid={`lardr-low-${item.id}`}>Low</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="lardr-menu" align="center" side="top" data-testid={`lardr-menu-${item.id}`}>
        <div className="lardr-menu-head">
          <span className="lardr-menu-title">{nameOf(item)}</span>
          <span className="lardr-menu-sub">{areaOf(item.category).label} · {low ? "running low" : "in stock"}</span>
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
            {otherAreas.map(a => (
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

// ── A real shelf / drop surface (LARDER1 §4: "genuine placement and drop surfaces") ─
function ShelfSurface({
  items, actions, dragDisabled, emptyHint,
}: { items: PantryItem[]; actions: ItemActions; dragDisabled: boolean; emptyHint: string }) {
  if (items.length === 0) {
    return <p className="lardr-shelf-empty">{emptyHint}</p>;
  }
  return (
    <div className="lardr-shelf-row">
      {items.map(i => (
        <ProductObject key={i.id} item={i} actions={actions} dragDisabled={dragDisabled} />
      ))}
    </div>
  );
}

// A piece of open storage furniture (larder shelving, baskets, cupboard, drawer).
// The whole interior is a droppable — dropping a product here MOVES it here.
function StorageFurniture({
  area, items, actions, dragDisabled,
}: { area: Area; items: PantryItem[]; actions: ItemActions; dragDisabled: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: `area-${area.cat}`, data: { kind: "move", category: area.cat } });
  const Icon = area.icon;
  // Split into two shelf boards for the larder so it reads as real shelving.
  const boards = area.furniture === "shelving" && items.length > 5
    ? [items.slice(0, Math.ceil(items.length / 2)), items.slice(Math.ceil(items.length / 2))]
    : [items];

  return (
    <section
      ref={setNodeRef}
      className={`lardr-furniture lardr-${area.furniture}${isOver ? " is-over" : ""}`}
      data-testid={`lardr-area-${area.cat}`}
      aria-label={area.label}
    >
      <header className="lardr-furniture-head">
        <Icon className="h-4 w-4" />
        <h2>{area.label}</h2>
        <span className="lardr-furniture-count">{items.length} {items.length === 1 ? "item" : "items"}</span>
      </header>
      <div className="lardr-furniture-body">
        {boards.map((board, bi) => (
          <div className="lardr-board" key={bi}>
            <ShelfSurface items={board} actions={actions} dragDisabled={dragDisabled}
              emptyHint={`Nothing kept in the ${area.short.toLowerCase()} yet — add something with search below.`} />
            <div className="lardr-board-plank" aria-hidden />
          </div>
        ))}
      </div>
    </section>
  );
}

// The fridge / freezer: a real appliance with a door that OPENS to reveal the
// actual inventory inside constructed racks, shelves and drawers/compartments
// (LARDER1 §3 — categories are places; the door reveals the `fridge`/`freezer`
// category's real items).
function ApplianceFurniture({
  area, items, actions, dragDisabled, open, onToggle,
}: {
  area: Area; items: PantryItem[]; actions: ItemActions; dragDisabled: boolean;
  open: boolean; onToggle: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `area-${area.cat}`, data: { kind: "move", category: area.cat } });
  const Icon = area.icon;
  const isFreezer = area.cat === "freezer";
  // Three constructed compartments: rack (top), shelf (middle), drawer (bottom).
  const compartments = isFreezer
    ? ["Top compartment", "Middle compartment", "Bottom drawer"]
    : ["Top rack", "Middle shelf", "Salad drawer"];
  const groups = compartments.map((_, gi) => items.filter((_, idx) => idx % 3 === gi));

  return (
    <section
      ref={setNodeRef}
      className={`lardr-furniture lardr-appliance${open ? " is-open" : ""}${isOver ? " is-over" : ""}${isFreezer ? " is-freezer" : ""}`}
      data-testid={`lardr-area-${area.cat}`}
      aria-label={area.label}
    >
      <button
        type="button"
        className="lardr-appliance-door"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`lardr-appliance-inside-${area.cat}`}
        data-testid={`lardr-appliance-toggle-${area.cat}`}
      >
        <span className="lardr-appliance-handle" aria-hidden />
        <span className="lardr-appliance-label">
          <Icon className="h-5 w-5" />
          <span>
            <b>{area.label}</b>
            <small>{items.length} {items.length === 1 ? "item" : "items"} inside · {open ? "tap to close" : "tap to open"}</small>
          </span>
        </span>
        <ChevronDown className={`h-5 w-5 lardr-appliance-chev${open ? " is-open" : ""}`} aria-hidden />
      </button>

      {open && (
        <div className="lardr-appliance-inside" id={`lardr-appliance-inside-${area.cat}`}>
          {items.length === 0 ? (
            <p className="lardr-shelf-empty">
              The {area.short.toLowerCase()} is empty — add something with search below.
            </p>
          ) : (
            compartments.map((name, gi) => (
              <div className="lardr-compartment" key={name} data-testid={`lardr-compartment-${area.cat}-${gi}`}>
                <span className="lardr-compartment-label">{name}</span>
                <ShelfSurface items={groups[gi]} actions={actions} dragDisabled={dragDisabled}
                  emptyHint="" />
                <div className="lardr-board-plank is-cold" aria-hidden />
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}

// The two always-visible drop destinations: Shopping (keeps the staple) and the
// Bin (takes it out, reversibly). A sticky dock so they are reachable throughout
// a drag, and each is a genuine droppable.
function Dock({ onOpenShopping, dragging }: { onOpenShopping: () => void; dragging: boolean }) {
  const shopping = useDroppable({ id: "shopping", data: { kind: "shopping" } });
  const bin = useDroppable({ id: "bin", data: { kind: "bin" } });
  return (
    <div className={`lardr-dock${dragging ? " is-dragging" : ""}`} role="group" aria-label="Drop here">
      <button
        ref={shopping.setNodeRef}
        type="button"
        onClick={onOpenShopping}
        className={`lardr-dock-target is-shop${shopping.isOver ? " is-over" : ""}`}
        data-testid="lardr-dock-shopping"
        aria-label="Shopping — drop a product here to add it to your shopping list"
      >
        <ShoppingCart className="h-5 w-5" />
        <span>Shopping</span>
      </button>
      <div
        ref={bin.setNodeRef}
        className={`lardr-dock-target is-bin${bin.isOver ? " is-over" : ""}`}
        data-testid="lardr-dock-bin"
        aria-label="Bin — drop a product here to take it out of your larder"
      >
        <Trash2 className="h-5 w-5" />
        <span>Bin</span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PantryPage() {
  const { data: items = [], isPending: isLoading, isError, refetch } =
    useQuery<PantryItem[]>({ queryKey: ["/api/pantry"] });
  const { toast } = useToast();
  const qclient = useQueryClient();
  const invalidatePantry = useCallback(() => qclient.invalidateQueries({ queryKey: ["/api/pantry"] }), [qclient]);

  const [openAppliance, setOpenAppliance] = useState<Record<string, boolean>>({});
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

  // Domain 30 — restore (Undo of the Bin). Its own writer, added under LARDER1 §4.3.
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
      // Undo is offered on the SAME record — restore brings back exactly this item.
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
      // On a FAILED write the record was never removed — the query refetch below
      // restores the object on screen (LARDER1 §4: never destructive without recovery).
      failure: "Couldn't take that out",
      failureDescription: "It's still in your larder. Please try again.",
    },
    onError: invalidatePantry,
  });

  // Domain 30 — move to a different storage location (its `category`). Writes the
  // SAME canonical record; no duplicate is ever created (LARDER1 §4).
  const moveMutation = useTrackedMutation({
    mutationFn: ({ item, cat }: { item: PantryItem; cat: string }) =>
      apiRequest("PATCH", `/api/pantry/${item.id}`, { category: cat }),
    onSuccess: invalidatePantry,
    feedback: {
      success: (_d, { item, cat }: { item: PantryItem; cat: string }) => `${nameOf(item)} moved to ${areaOf(cat).label}`,
      failure: "Couldn't move that",
      failureDescription: "It's still where it was. Please try again.",
    },
  });

  // Domain 30 — approximate availability toggle (running low / stocked). Reads and
  // writes the existing `needQuantityValue` flag; surfaces NO number (LARDER1 §16).
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

  // ── Companion context — the area a product was last selected/opened in ──────
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

  // ── Availability at a glance — three honest readings, never a quantity ──────
  const byArea = useMemo(() => {
    const m = new Map<string, PantryItem[]>();
    for (const a of AREAS) m.set(a.cat, []);
    for (const i of items) { const arr = m.get(i.category); if (arr) arr.push(i); }
    return m;
  }, [items]);
  const lowCount = useMemo(() => items.filter(i => i.needQuantityValue !== null).length, [items]);
  const emptyAreas = AREAS.filter(a => (byArea.get(a.cat)?.length ?? 0) === 0).length;

  // ── Explore mode (the wider knowledge larder) — preserved, deep-linkable ────
  const [, navigate] = useLocation();
  const search = useSearch();
  const mode: "room" | "explore" =
    new URLSearchParams(search).get("mode") === "explore" ? "explore" : "room";
  const setMode = (m: "room" | "explore") =>
    navigate(m === "explore" ? "/pantry?mode=explore" : "/pantry");

  if (mode === "explore") {
    return (
      <div data-realm="pantry" className={`${pageContainerClass(true)} space-y-3`}>
        <button onClick={() => setMode("room")} className="lardr-link" data-testid="button-larder-back">
          ← Back to the larder
        </button>
        <div className="pb-8"><PantryKnowledgeHub /></div>
      </div>
    );
  }

  const handleAdd = () => {
    const q = addQuery.trim();
    if (!q) return;
    addMutation.mutate({ name: q, cat: addCat });
  };

  const dragging = activeItem !== null;

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
      <div data-realm="pantry" className="lardr-room" data-testid="larder-room">
        {/* The room's living materials — a warm, sunlit larder wall. Presentation
            only; carries no data and makes no claim (LARDER1 §15). The real,
            interactive storage furniture is constructed below, in front of it. */}
        <div className="lardr-wall" aria-hidden />

        <div className="lardr-inner">
          <p className="lardr-tagline" data-testid="larder-tagline">
            Our pantry, organised and ready.<span>Good food. Less waste. More time.</span>
          </p>

          {isError ? (
            <div className="lardr-panel">
              <LoadError
                what="your larder"
                onRetry={() => refetch()}
                description="Nothing has been lost — what's in your larder is safe. This is a problem at our end."
                data-testid="error-larder"
              />
            </div>
          ) : (
            <>
              {/* Availability at a glance — read by looking, never a quantity. */}
              <div className="lardr-status" role="group" aria-label="What your larder needs">
                <span className="lardr-chip is-stocked">Well stocked</span>
                <span className="lardr-chip is-low" data-testid="lardr-status-low">{lowCount} running low</span>
                <span className="lardr-chip is-empty" data-testid="lardr-status-empty">{emptyAreas} {emptyAreas === 1 ? "place" : "places"} to fill</span>
              </div>

              {/* The constructed storage furniture, each holding the real items. */}
              {isLoading ? (
                <div className="lardr-loading">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
                </div>
              ) : (
                <div className="lardr-furniture-stack">
                  {AREAS.map(area => (
                    area.opensClosed ? (
                      <ApplianceFurniture
                        key={area.cat}
                        area={area}
                        items={byArea.get(area.cat) ?? []}
                        actions={actions}
                        dragDisabled={busy}
                        open={!!openAppliance[area.cat]}
                        onToggle={() => setOpenAppliance(s => ({ ...s, [area.cat]: !s[area.cat] }))}
                      />
                    ) : (
                      <StorageFurniture
                        key={area.cat}
                        area={area}
                        items={byArea.get(area.cat) ?? []}
                        actions={actions}
                        dragDisabled={busy}
                      />
                    )
                  ))}
                </div>
              )}

              {/* Search — the single add-item gesture (LARDER1 §6). Resolves
                  identity against Canonical Food (Domain 2) server-side. */}
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
                <div className="lardr-add-where" role="group" aria-label="Where does it go?">
                  {AREAS.map(a => (
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
            </>
          )}
        </div>

        {/* Always-present drop destinations. */}
        <Dock dragging={dragging} onOpenShopping={() => navigate("/shopping-workspace")} />
      </div>

      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <div className="lardr-drag-overlay">
            <ProductGlyph
              form={deriveForm({ name: nameOf(activeItem), category: activeItem.category })}
              low={activeItem.needQuantityValue !== null}
              id={activeItem.id}
            />
            <span>{nameOf(activeItem)}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
