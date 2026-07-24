import "./larder-room.css";

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
  Loader2, ChevronRight, Trash2, ShoppingCart, Sparkles,
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
import {
  larderJarAssetRegister,
  larderProduceAssetRegister,
} from "@/components/layout/living-details-manifest";
import {
  JOINERY_METRICS, JAR_METRICS, PRODUCE_METRICS, JAR_LABEL_FRACTION,
  contentBox, canvasCmHeight, canvasCmWidth,
  type LarderAssetMetrics, type JoineryId,
} from "@/pages/larder-room-metrics";

// ── The governed production artwork (the ONE declared mouth — J7) ─────────────
// Only APPROVED assets are imported: every import below resolves to a Life/House
// Register entry whose bytes are checksum-locked to a recorded Home Owner
// approval. Candidate assets (the 20 procedural jars, the empty and fallback
// jars) are NOT imported — they stay out of runtime until approved.
import imgShelfWide from "@/assets/living-home/larder/joinery/tha-larder-joinery-floating-shelf-oak-wide.png";
import imgShelfMedium from "@/assets/living-home/larder/joinery/tha-larder-joinery-floating-shelf-oak-medium.png";
import imgShelfShort from "@/assets/living-home/larder/joinery/tha-larder-joinery-floating-shelf-oak-short.png";
import imgSpiceRack from "@/assets/living-home/larder/joinery/tha-larder-joinery-floating-spice-rack-oak.png";
import imgCupboardDouble from "@/assets/living-home/larder/joinery/tha-larder-joinery-cupboard-oak-double.png";
import imgCupboardSingle from "@/assets/living-home/larder/joinery/tha-larder-joinery-cupboard-oak-single.png";
import imgDrawerDeep from "@/assets/living-home/larder/joinery/tha-larder-joinery-drawer-unit-oak-deep.png";
import imgDrawerShallow from "@/assets/living-home/larder/joinery/tha-larder-joinery-drawer-unit-oak-shallow.png";
import imgPrepTable from "@/assets/living-home/larder/joinery/tha-larder-joinery-preparation-table-oak.png";
import imgWorktable from "@/assets/living-home/larder/joinery/tha-larder-joinery-side-worktable-oak.png";
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
 * The Living Larder — the production room (LIVING_LARDER_PRODUCTION_IMPLEMENTATION,
 * 2026-07-24). A FRONT-ON REALISTIC ELEVATION built from the governed production
 * PNG assets: one warm oak household larder the family reads by looking.
 *
 * Ownership is unchanged (LARDER1 §2). Every action routes through an existing
 * owner and nothing else:
 *   • staples  → Domain 30 (`/api/pantry`, `server/storage.ts` the sole writer)
 *   • shopping → Domain 15 (`/api/shopping-list`) — adding NEVER removes the
 *     staple (LARDER1 §8); only the explicit Bin gesture does, reversibly
 *   • identity → Domain 2 (server-side, on add)
 *   • artwork  → the Life/House Registers (checksum-locked, Home-Owner-approved)
 *
 * Presentation law:
 *   • The furniture is constant (LARDER4 LI2 — furniture before products); the
 *     household's REAL items decide what stands on it, at read time.
 *   • A staple renders as its approved production visual where one exists
 *     (jar / produce master). Where none exists the gap is HONEST: a chalk tag
 *     carrying the household's own words — never a redrawn jar, never a guessed
 *     food (Principle 6).
 *   • No quantity, fill, freshness or expiry is represented anywhere (LARDER1
 *     §16). "Running low" is the existing Domain-30 flag, shown as text.
 *   • Drag is an enhancement, never the only way (LARDER1 §10): every drag
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

// ── The household's own storage places (LARDER1 §3) ───────────────────────────
// A `category` is a real piece of furniture in the elevation — never a tab.
interface Area {
  cat: string;
  label: string;
  short: string;
  icon: React.ComponentType<{ className?: string }>;
}

const AREAS: Area[] = [
  { cat: "larder", label: "Larder shelves", short: "Larder", icon: Archive },
  { cat: "fruit", label: "Fruit, on the table", short: "Fruit & veg", icon: Apple },
  { cat: "fridge", label: "Fridge drawers — kept cold", short: "Fridge", icon: Refrigerator },
  { cat: "freezer", label: "Freezer drawers — kept frozen", short: "Freezer", icon: Layers },
  { cat: "household", label: "Household cupboard", short: "Household", icon: Home },
  { cat: "pet", label: "Pet corner", short: "Pet", icon: PawPrint },
];
const areaOf = (cat: string) => AREAS.find(a => a.cat === cat) ?? AREAS[0];

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
      map.set(normName(m), { kind: "jar", src, metrics, sizeClass: r.sizeClass ?? "large" });
    }
  }
  for (const r of larderProduceAssetRegister) {
    if (r.availabilityState !== "available") continue;
    const src = PRODUCE_IMAGE[r.id];
    const metrics = PRODUCE_METRICS[r.id];
    if (!src || !metrics) continue;
    for (const m of r.canonicalFoodMappings) {
      map.set(normName(m), { kind: "produce", src, metrics, sizeClass: "large" });
    }
  }
  return map;
})();

const visualFor = (item: PantryItem): ResolvedVisual | null =>
  VISUAL_BY_NAME.get(normName(nameOf(item))) ?? VISUAL_BY_NAME.get(normName(item.ingredientKey)) ?? null;

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

function Joinery({ id, className }: { id: JoineryId; className?: string }) {
  const src: Record<JoineryId, string> = {
    "shelf-wide": imgShelfWide,
    "shelf-medium": imgShelfMedium,
    "shelf-short": imgShelfShort,
    "spice-rack": imgSpiceRack,
    "cupboard-double": imgCupboardDouble,
    "cupboard-single": imgCupboardSingle,
    "drawer-deep": imgDrawerDeep,
    "drawer-shallow": imgDrawerShallow,
    "prep-table": imgPrepTable,
    "side-worktable": imgWorktable,
  };
  return <AssetImg src={src[id]} metrics={JOINERY_METRICS[id]} className={className} />;
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

  const otherAreas = AREAS.filter(a => a.cat !== item.category);

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

/** A staple with an approved jar visual: the production jar + its runtime chalk label. */
function JarObject({ item, visual, actions, dragDisabled }: {
  item: PantryItem; visual: ResolvedVisual; actions: ItemActions; dragDisabled: boolean;
}) {
  const plate = JAR_LABEL_FRACTION[visual.sizeClass];
  const c = contentBox(visual.metrics);
  const imgH = canvasCmHeight(visual.metrics);
  const imgW = canvasCmWidth(visual.metrics);
  return (
    <LarderObject item={item} actions={actions} dragDisabled={dragDisabled} className="is-jar">
      <AssetImg src={visual.src} metrics={visual.metrics} />
      <span
        className="lv-jar-label"
        aria-hidden
        style={{
          left: `calc(var(--lvcm) * ${((plate.left - c.left) * imgW).toFixed(2)})`,
          top: `calc(var(--lvcm) * ${((plate.top - c.top) * imgH).toFixed(2)})`,
          width: `calc(var(--lvcm) * ${(plate.width * imgW).toFixed(2)})`,
          height: `calc(var(--lvcm) * ${(plate.height * imgH).toFixed(2)})`,
          fontSize: `calc(var(--lvcm) * ${visual.sizeClass === "small" ? 1.3 : 1.6})`,
        }}
      >
        {nameOf(item)}
      </span>
    </LarderObject>
  );
}

/** A staple with an approved produce visual. Name is a quiet caption beneath. */
function ProduceObjectVisual({ item, visual, actions, dragDisabled }: {
  item: PantryItem; visual: ResolvedVisual; actions: ItemActions; dragDisabled: boolean;
}) {
  return (
    <LarderObject item={item} actions={actions} dragDisabled={dragDisabled} className="is-produce">
      <AssetImg src={visual.src} metrics={visual.metrics} />
      <span className="lv-caption">{nameOf(item)}</span>
    </LarderObject>
  );
}

/** The HONEST GAP: a staple with no approved visual — a chalk tag with the
 *  household's own words. Never a redrawn jar, never a guessed food. */
function TagObject({ item, actions, dragDisabled }: {
  item: PantryItem; actions: ItemActions; dragDisabled: boolean;
}) {
  return (
    <LarderObject item={item} actions={actions} dragDisabled={dragDisabled} className="is-tag">
      <span className="lv-tag">{nameOf(item)}</span>
    </LarderObject>
  );
}

/** Render any staple as its resolved physical presence. */
function StapleObject({ item, actions, dragDisabled }: {
  item: PantryItem; actions: ItemActions; dragDisabled: boolean;
}) {
  const visual = visualFor(item);
  if (visual?.kind === "jar") return <JarObject item={item} visual={visual} actions={actions} dragDisabled={dragDisabled} />;
  if (visual?.kind === "produce") return <ProduceObjectVisual item={item} visual={visual} actions={actions} dragDisabled={dragDisabled} />;
  return <TagObject item={item} actions={actions} dragDisabled={dragDisabled} />;
}

// ── Furniture with a door: cupboards / drawer units / the pet worktable ───────
// The door opens onto the REAL contents of the household's own category — never
// a fabricated interior (opening is supported exactly by real data).
function OpeningStore({
  area, joineryId, items, actions, dragDisabled, open, onToggle,
}: {
  area: Area; joineryId: JoineryId; items: PantryItem[]; actions: ItemActions;
  dragDisabled: boolean; open: boolean; onToggle: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `area-${area.cat}`, data: { kind: "move", category: area.cat } });
  const Icon = area.icon;
  return (
    <section
      ref={setNodeRef}
      className={`lv-store${isOver ? " is-over" : ""}`}
      data-testid={`lardr-area-${area.cat}`}
      aria-label={area.label}
    >
      <button
        type="button"
        className="lv-store-door"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`lv-inside-${area.cat}`}
        data-testid={`lardr-appliance-toggle-${area.cat}`}
      >
        <Joinery id={joineryId} />
        <span className="lv-store-plate">
          <Icon className="h-4 w-4" aria-hidden />
          <b>{area.label}</b>
          <small>{items.length} {items.length === 1 ? "item" : "items"} · {open ? "close" : "open"}</small>
        </span>
      </button>
      {open && (
        <div className="lv-inside" id={`lv-inside-${area.cat}`}>
          {items.length === 0 ? (
            <p className="lardr-shelf-empty">Nothing kept in the {area.short.toLowerCase()} yet — add something with search below.</p>
          ) : (
            <div className="lv-inside-row">
              {items.map(i => <StapleObject key={i.id} item={i} actions={actions} dragDisabled={dragDisabled} />)}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LarderRoomPage() {
  const { data: items = [], isPending: isLoading, isError, refetch } =
    useQuery<PantryItem[]>({ queryKey: ["/api/pantry"] });
  const { toast } = useToast();
  const qclient = useQueryClient();
  const invalidatePantry = useCallback(() => qclient.invalidateQueries({ queryKey: ["/api/pantry"] }), [qclient]);

  const [openStore, setOpenStore] = useState<Record<string, boolean>>({});
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

  // Domain 30 — move to a different storage location (its `category`).
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

  const byArea = useMemo(() => {
    const m = new Map<string, PantryItem[]>();
    for (const a of AREAS) m.set(a.cat, []);
    for (const i of items) { const arr = m.get(i.category); if (arr) arr.push(i); }
    return m;
  }, [items]);
  const lowCount = useMemo(() => items.filter(i => i.needQuantityValue !== null).length, [items]);
  const emptyAreas = AREAS.filter(a => (byArea.get(a.cat)?.length ?? 0) === 0).length;

  // ── The Dry Store's physical split: jars on shelves, small jars on the rack,
  //    everything else behind the larder cupboard's doors. Distribution is a
  //    PRESENTATION reading of the data — it stores nothing.
  const larderItems = byArea.get("larder") ?? [];
  const dryStore = useMemo(() => {
    const largeJars: PantryItem[] = [];
    const smallJars: PantryItem[] = [];
    const cupboard: PantryItem[] = [];
    for (const i of larderItems) {
      const v = visualFor(i);
      if (v?.kind === "jar" && v.sizeClass === "small") smallJars.push(i);
      else if (v?.kind === "jar") largeJars.push(i);
      else cupboard.push(i);
    }
    // Shelf capacity is physical (board length), not a data claim.
    return {
      shelfA: largeJars.slice(0, 5),
      shelfB: largeJars.slice(5, 9),
      shelfC: largeJars.slice(9, 12),
      rack: smallJars.slice(0, 4),
      cupboard: [...cupboard, ...smallJars.slice(4), ...largeJars.slice(12)],
    };
  }, [larderItems]);

  const larderDrop = useDroppable({ id: "area-larder", data: { kind: "move", category: "larder" } });
  const fruitDrop = useDroppable({ id: "area-fruit", data: { kind: "move", category: "fruit" } });

  // The table top is physical: a bounded standing row (approved visuals first);
  // the rest lives in the table's real drawers, opened on demand.
  const fruitItems = byArea.get("fruit") ?? [];
  const fruitTable = useMemo(() => {
    const withVisual = fruitItems.filter(i => visualFor(i));
    const withoutVisual = fruitItems.filter(i => !visualFor(i));
    const ordered = [...withVisual, ...withoutVisual];
    return { top: ordered.slice(0, 5), inDrawers: ordered.slice(5) };
  }, [fruitItems]);

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
      <div data-realm="pantry" className="lardr-room lv-room" data-testid="larder-room">
        <div className="lv-light" aria-hidden />

        <div className="lardr-inner lv-inner">
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

              {isLoading ? (
                <div className="lardr-loading">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
                </div>
              ) : (
                <div className="lv-elevation">
                  {/* ── The wall: the Dry Store (category `larder`) ─────────── */}
                  <section
                    ref={larderDrop.setNodeRef}
                    className={`lv-wall-band${larderDrop.isOver ? " is-over" : ""}`}
                    data-testid="lardr-area-larder"
                    aria-label="Larder shelves"
                  >
                    <div className="lv-cupboard-bay">
                      <OpenableCupboard
                        open={!!openStore.larder}
                        onToggle={() => setOpenStore(s => ({ ...s, larder: !s.larder }))}
                        items={dryStore.cupboard}
                        actions={actions}
                        dragDisabled={busy}
                      />
                    </div>

                    <div className="lv-shelf-stack">
                      <ShelfWithJars joineryId="shelf-wide" items={dryStore.shelfA} actions={actions} dragDisabled={busy} />
                      <ShelfWithJars joineryId="shelf-medium" items={dryStore.shelfB} actions={actions} dragDisabled={busy} />
                      {dryStore.shelfC.length > 0 && (
                        <ShelfWithJars joineryId="shelf-short" items={dryStore.shelfC} actions={actions} dragDisabled={busy} />
                      )}
                    </div>

                    <div className="lv-rack-bay">
                      <div className="lv-rackgroup" aria-label="Herbs, spices and seeds — spice rack">
                        <div className="lv-rack-seated">
                          {dryStore.rack.map(i => <StapleObject key={i.id} item={i} actions={actions} dragDisabled={busy} />)}
                        </div>
                        <Joinery id="spice-rack" />
                      </div>
                    </div>
                  </section>

                  {/* ── The floor: cold stores flanking the preparation table ── */}
                  <div className="lv-floor-band">
                    <div className="lv-order-2">
                      <section
                        ref={fruitDrop.setNodeRef}
                        className={`lv-tablegroup lv-store${fruitDrop.isOver ? " is-over" : ""}`}
                        data-testid="lardr-area-fruit"
                        aria-label="Fruit, on the table"
                      >
                        <div className="lv-table-seated">
                          {fruitTable.top.length === 0 ? (
                            <p className="lardr-shelf-empty lv-table-empty">Nothing on the table yet.</p>
                          ) : (
                            fruitTable.top.map(i => <StapleObject key={i.id} item={i} actions={actions} dragDisabled={busy} />)
                          )}
                        </div>
                        <button
                          type="button"
                          className="lv-store-door"
                          onClick={() => setOpenStore(s => ({ ...s, fruit: !s.fruit }))}
                          aria-expanded={!!openStore.fruit}
                          aria-controls="lv-inside-fruit"
                          data-testid="lardr-appliance-toggle-fruit"
                        >
                          <Joinery id="prep-table" />
                          <span className="lv-store-plate">
                            <Apple className="h-4 w-4" aria-hidden />
                            <b>Fruit, on the table</b>
                            <small>
                              {fruitItems.length} {fruitItems.length === 1 ? "item" : "items"}
                              {fruitTable.inDrawers.length > 0 && ` · ${fruitTable.inDrawers.length} in the drawers`}
                              {" · "}{openStore.fruit ? "close" : "open"}
                            </small>
                          </span>
                        </button>
                        {openStore.fruit && (
                          <div className="lv-inside" id="lv-inside-fruit">
                            {fruitTable.inDrawers.length === 0 ? (
                              <p className="lardr-shelf-empty">Everything is out on the table.</p>
                            ) : (
                              <div className="lv-inside-row">
                                {fruitTable.inDrawers.map(i => <StapleObject key={i.id} item={i} actions={actions} dragDisabled={busy} />)}
                              </div>
                            )}
                          </div>
                        )}
                      </section>
                    </div>

                    <div className="lv-order-1">
                      <OpeningStore
                        area={areaOf("fridge")} joineryId="drawer-deep"
                        items={byArea.get("fridge") ?? []}
                        actions={actions} dragDisabled={busy}
                        open={!!openStore.fridge}
                        onToggle={() => setOpenStore(s => ({ ...s, fridge: !s.fridge }))}
                      />
                    </div>

                    <div className="lv-order-3">
                      <OpeningStore
                        area={areaOf("freezer")} joineryId="drawer-shallow"
                        items={byArea.get("freezer") ?? []}
                        actions={actions} dragDisabled={busy}
                        open={!!openStore.freezer}
                        onToggle={() => setOpenStore(s => ({ ...s, freezer: !s.freezer }))}
                      />
                    </div>
                  </div>

                  <div className="lv-floor-band is-second">
                    <OpeningStore
                      area={areaOf("household")} joineryId="cupboard-single"
                      items={byArea.get("household") ?? []}
                      actions={actions} dragDisabled={busy}
                      open={!!openStore.household}
                      onToggle={() => setOpenStore(s => ({ ...s, household: !s.household }))}
                    />
                    <OpeningStore
                      area={areaOf("pet")} joineryId="side-worktable"
                      items={byArea.get("pet") ?? []}
                      actions={actions} dragDisabled={busy}
                      open={!!openStore.pet}
                      onToggle={() => setOpenStore(s => ({ ...s, pet: !s.pet }))}
                    />
                  </div>
                </div>
              )}

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

        <Dock dragging={dragging} onOpenShopping={() => navigate("/shopping-workspace")} />
      </div>

      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <div className="lardr-drag-overlay lv-drag-overlay">
            <DragGhost item={activeItem} />
            <span>{nameOf(activeItem)}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/** A floating shelf with its jars seated on the measured board line. */
function ShelfWithJars({ joineryId, items, actions, dragDisabled }: {
  joineryId: JoineryId; items: PantryItem[]; actions: ItemActions; dragDisabled: boolean;
}) {
  return (
    <div className="lv-shelfgroup">
      <div className="lv-shelf-seated">
        {items.map(i => <StapleObject key={i.id} item={i} actions={actions} dragDisabled={dragDisabled} />)}
      </div>
      <Joinery id={joineryId} />
    </div>
  );
}

/** The larder cupboard — doors onto the dry goods that have no jar visual yet. */
function OpenableCupboard({ open, onToggle, items, actions, dragDisabled }: {
  open: boolean; onToggle: () => void; items: PantryItem[];
  actions: ItemActions; dragDisabled: boolean;
}) {
  return (
    <div className="lv-store">
      <button
        type="button"
        className="lv-store-door"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="lv-inside-larder-cupboard"
        data-testid="lardr-appliance-toggle-larder"
      >
        <Joinery id="cupboard-double" />
        <span className="lv-store-plate">
          <Archive className="h-4 w-4" aria-hidden />
          <b>Larder cupboard</b>
          <small>{items.length} {items.length === 1 ? "item" : "items"} · {open ? "close" : "open"}</small>
        </span>
      </button>
      {open && (
        <div className="lv-inside" id="lv-inside-larder-cupboard">
          {items.length === 0 ? (
            <p className="lardr-shelf-empty">Nothing behind these doors yet.</p>
          ) : (
            <div className="lv-inside-row">
              {items.map(i => <StapleObject key={i.id} item={i} actions={actions} dragDisabled={dragDisabled} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** The drag overlay ghost — the same production visual the object shows. */
function DragGhost({ item }: { item: PantryItem }) {
  const visual = visualFor(item);
  if (visual) return <AssetImg src={visual.src} metrics={visual.metrics} />;
  return <span className="lv-tag">{nameOf(item)}</span>;
}

// The two always-visible drop destinations: Shopping (keeps the staple) and the
// Bin (takes it out, reversibly).
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
