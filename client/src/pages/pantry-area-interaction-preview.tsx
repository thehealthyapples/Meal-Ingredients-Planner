import "./pantry-area-interaction-preview.css";
import "./living-home-room.css";
import "./fridge-interaction-preview.css";

import { useState } from "react";
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useAskCompanion } from "@/components/conversation/companion-context";
import { openCompanion } from "@/components/conversation/companion-open";

type AreaKind = "shelves" | "cupboard";
type AreaItem = { name: string; id?: string; src?: string; x: number; y: number; w: number; h: number };

type ProductPlacement = { asset: string; left: number; top: number; width: number; height: number };
const PRODUCT_PLACEMENTS: Record<string, ProductPlacement> = {
  "plain-flour": { asset: "plain-flour", left: 84, top: 138, width: 149, height: 188 }, "granola": { asset: "granola", left: 232, top: 138, width: 150, height: 188 }, "brown-rice": { asset: "brown-rice", left: 382, top: 138, width: 149, height: 188 }, "white-penne": { asset: "penne", left: 530, top: 138, width: 149, height: 188 },
  "rolled-oats": { asset: "rolled-oats", left: 680, top: 138, width: 149, height: 188 }, "chickpeas": { asset: "chickpeas", left: 828, top: 138, width: 149, height: 188 }, "cannellini-beans": { asset: "cannellini-beans", left: 978, top: 138, width: 149, height: 188 }, "wholemeal-penne": { asset: "penne", left: 1126, top: 138, width: 149, height: 188 },
  "evoo": { asset: "evoo", left: 1300, top: 132, width: 57, height: 194 }, "balsamic-vinegar": { asset: "balsamic-vinegar", left: 1372, top: 132, width: 57, height: 194 },
  "white-beans": { asset: "cannellini-beans", left: 48, top: 397, width: 149, height: 188 }, "red-lentils": { asset: "red-lentils", left: 200, top: 397, width: 149, height: 188 }, "green-lentils": { asset: "green-lentils", left: 372, top: 397, width: 149, height: 188 }, "sugar": { asset: "sugar", left: 524, top: 397, width: 149, height: 188 },
  "pearl-barley": { asset: "pearl-barley", left: 676, top: 397, width: 147, height: 188 }, "white-rice": { asset: "white-rice", left: 828, top: 397, width: 149, height: 188 }, "wholemeal-fusilli": { asset: "fusilli", left: 1206, top: 397, width: 152, height: 188 }, "white-fusilli": { asset: "fusilli", left: 1358, top: 397, width: 152, height: 188 },
  "plain-flour-lower": { asset: "plain-flour", left: 376, top: 645, width: 149, height: 188 }, "brown-rice-lower": { asset: "brown-rice", left: 524, top: 645, width: 149, height: 188 }, "granola-lower": { asset: "granola", left: 671, top: 645, width: 150, height: 188 }, "white-rice-lower": { asset: "white-rice", left: 820, top: 645, width: 149, height: 188 },
  "rolled-oats-lower": { asset: "rolled-oats", left: 968, top: 645, width: 149, height: 188 }, "granola-cereal": { asset: "granola-cereal", left: 1114, top: 645, width: 152, height: 188 },
};
const productSrc = (placement: ProductPlacement) => `/images/living-home/room/pantry-shelves-standardized/${placement.asset}.png?v=exact-v2`;

const SHELF_LABELS: Record<string, { x: number; y: number; w: number; h: number }> = {
  "plain-flour": { x: 10.77, y: 20.07, w: 5.73, h: 6.05 }, "granola": { x: 19.92, y: 22.90, w: 5.53, h: 5.86 }, "brown-rice": { x: 29.52, y: 21.48, w: 6.38, h: 6.54 }, "white-penne": { x: 38.90, y: 23.24, w: 5.34, h: 5.57 }, "rolled-oats": { x: 47.40, y: 21.58, w: 5.92, h: 6.54 }, "chickpeas": { x: 56.80, y: 23.44, w: 5.73, h: 7.91 }, "cannellini-beans": { x: 65.85, y: 23.10, w: 5.60, h: 6.05 }, "wholemeal-penne": { x: 76.89, y: 22.27, w: 4.75, h: 6.15 },
  "white-beans": { x: 7.75, y: 48.88, w: 5.92, h: 6.25 }, "red-lentils": { x: 16.24, y: 48.97, w: 5.60, h: 5.86 }, "green-lentils": { x: 29.52, y: 49.02, w: 5.60, h: 6.05 }, "sugar": { x: 38.87, y: 48.44, w: 5.79, h: 6.15 }, "pearl-barley": { x: 48.40, y: 48.93, w: 5.47, h: 5.76 }, "white-rice": { x: 57.65, y: 49.02, w: 5.34, h: 5.57 }, "wholemeal-fusilli": { x: 67.48, y: 49.02, w: 4.95, h: 5.57 }, "white-fusilli": { x: 84.18, y: 49.07, w: 4.88, h: 5.66 },
  "plain-flour-lower": { x: 28.55, y: 73.97, w: 4.69, h: 5.27 }, "brown-rice-lower": { x: 37.14, y: 74.02, w: 5.21, h: 5.37 }, "granola-lower": { x: 44.50, y: 74.07, w: 4.95, h: 5.27 }, "white-rice-lower": { x: 52.44, y: 73.78, w: 4.17, h: 5.27 }, "rolled-oats-lower": { x: 62.30, y: 73.34, w: 5.27, h: 5.37 }, "granola-cereal": { x: 70.80, y: 73.68, w: 4.95, h: 5.47 },
};

const AREAS: Record<AreaKind, { title: string; image: string; empty?: string; items: AreaItem[] }> = {
  shelves: {
    title: "Pantry shelves",
    image: "/images/living-home/room/pantry-shelves-standardized/full.png?v=approved-full-v1",
    empty: "/images/living-home/room/pantry-shelves-standardized/empty.png?v=exact-v2",
    items: [
      { name: "Plain flour", id: "plain-flour", src: "plain-flour.png", x: 9.8, y: 5.7, w: 8.3, h: 22.9 }, { name: "Granola", id: "granola", src: "granola.png", x: 18.7, y: 8.4, w: 7.9, h: 20 }, { name: "Brown rice", id: "brown-rice", src: "brown-rice.png", x: 27.2, y: 5.4, w: 8.1, h: 23.1 }, { name: "Penne", id: "white-penne", src: "white-penne.png", x: 35.8, y: 9, w: 7.8, h: 19.5 }, { name: "Rolled oats", id: "rolled-oats", src: "rolled-oats.png", x: 44.7, y: 4.1, w: 8.3, h: 24.4 }, { name: "Chickpeas", id: "chickpeas", src: "chickpeas.png", x: 53.5, y: 6.8, w: 8.2, h: 21.7 }, { name: "Cannellini beans", id: "cannellini-beans", src: "cannellini-beans.png", x: 62.4, y: 7.2, w: 8.1, h: 21.3 }, { name: "Penne", id: "wholemeal-penne", src: "wholemeal-penne.png", x: 71.6, y: 8, w: 8.8, h: 20.5 },
      { name: "White beans", id: "white-beans", src: "cannellini-beans.png", x: 9.5, y: 32.2, w: 8.9, h: 25 }, { name: "Red lentils", id: "red-lentils", src: "red-lentils.png", x: 18.5, y: 31.2, w: 8.6, h: 25.9 }, { name: "Green lentils", id: "green-lentils", src: "green-lentils.png", x: 28.2, y: 32.7, w: 8.8, h: 24.4 }, { name: "Sugar", id: "sugar", src: "sugar.png", x: 38, y: 31.1, w: 8.8, h: 26.1 }, { name: "Pearl barley", id: "pearl-barley", src: "pearl-barley.png", x: 48.1, y: 33.2, w: 8.8, h: 23.9 }, { name: "White rice", id: "white-rice", src: "white-rice.png", x: 57.7, y: 32.9, w: 8.5, h: 24.3 }, { name: "Fusilli", id: "wholemeal-fusilli", src: "wholemeal-fusilli.png", x: 73.7, y: 32.8, w: 8.6, h: 24.3 }, { name: "Fusilli", id: "white-fusilli", src: "white-fusilli.png", x: 83.5, y: 32.7, w: 8.8, h: 24.7 },
      { name: "Plain flour", id: "plain-flour-lower", src: "plain-flour.png", x: 29.1, y: 63.5, w: 8.1, h: 24.4 }, { name: "Brown rice", id: "brown-rice-lower", src: "brown-rice.png", x: 38.1, y: 62.7, w: 8.5, h: 25.2 }, { name: "Granola", id: "granola-lower", src: "granola.png", x: 47.1, y: 63.5, w: 8.1, h: 24.4 }, { name: "White rice", id: "white-rice-lower", src: "white-rice.png", x: 56.2, y: 63.0, w: 8.1, h: 24.9 }, { name: "Rolled oats", id: "rolled-oats-lower", src: "rolled-oats.png", x: 65.3, y: 62.5, w: 8.1, h: 25.4 }, { name: "Granola cereal", id: "granola-cereal", src: "granola.png", x: 74.9, y: 61.8, w: 9.1, h: 26.1 },
      { name: "EVOO", id: "evoo", x: 86.5, y: 12.9, w: 3.8, h: 18.9 }, { name: "Balsamic vinegar", id: "balsamic-vinegar", x: 91.2, y: 12.9, w: 3.8, h: 18.9 },
    ],
  },
  cupboard: {
    title: "Low-down cupboard",
    image: "/images/living-home/room/low-down-cupboard-open.png?v=arrival-cupboard",
    items: [
      { name: "Tinned fish", x: 42, y: 73, w: 7, h: 17 }, { name: "Soups", x: 50, y: 73, w: 7, h: 17 }, { name: "Beans", x: 59, y: 73, w: 7, h: 17 }, { name: "Pasta", x: 69, y: 73, w: 7, h: 17 },
      { name: "Tinned tomatoes", x: 42, y: 88, w: 7, h: 13 }, { name: "Chickpeas", x: 51, y: 88, w: 7, h: 13 }, { name: "Rice", x: 60, y: 88, w: 7, h: 13 }, { name: "Lentils", x: 69, y: 88, w: 7, h: 13 },
    ],
  },
};

function Destination({ id, label, sub, className, children }: { id: string; label: string; sub: string; className: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return <div ref={setNodeRef} className={`lh-drop fridge-preview-destination ${className}${isOver ? " is-over" : ""}`} aria-label={`${label} — ${sub}`}><div className="lh-drop__art" aria-hidden>{children}</div><span className="lh-drop__label"><b>{label}</b><small>{sub}</small></span></div>;
}

function AreaObject({ item, selected, removed, onSelect }: { item: AreaItem; selected: boolean; removed: boolean; onSelect: (item: AreaItem) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id ?? item.name, data: { item }, disabled: removed });
  const placement = item.id ? PRODUCT_PLACEMENTS[item.id] : undefined;
  const style = placement
    ? { left: `${placement.left / 15.36}%`, top: `${placement.top / 10.24}%`, width: `${placement.width / 15.36}%`, height: `${placement.height / 10.24}%` }
    : { left: `${item.x}%`, top: `${item.y}%`, width: `${item.w}%`, height: `${item.h}%` };
  const label = item.id ? SHELF_LABELS[item.id] : undefined;
  return <><button ref={setNodeRef} type="button" {...listeners} {...attributes} onClick={() => onSelect(item)} className={`pantry-area-target${placement ? " is-exact-product" : ""}${selected ? " is-selected" : ""}${removed ? " is-removed" : ""}${isDragging ? " is-dragging" : ""}`} style={style} aria-label={`Move ${item.name}`} />{label && !removed && <span className="pantry-area-chalk-label" style={{ left: `${label.x}%`, top: `${label.y}%`, width: `${label.w}%`, height: `${label.h}%` }}>{item.name}</span>}</>;
}

function ShelfLabel({ item, removed }: { item: AreaItem; removed: boolean }) {
  const box = item.id ? SHELF_LABELS[item.id] : undefined;
  if (!box || removed) return null;
  return <span className="pantry-area-chalk-label" style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%` }}>{item.name}</span>;
}

function ShelfLabels({ items, removed }: { items: AreaItem[]; removed: Set<string> }) {
  return <div className="pantry-area-labels">{items.map(item => <ShelfLabel key={`label-${item.id ?? item.name}`} item={item} removed={removed.has(item.id ?? item.name)} />)}</div>;
}

function ShelfJarGhost({ item }: { item: AreaItem }) {
  const placement = item.id ? PRODUCT_PLACEMENTS[item.id] : undefined;
  return placement ? <img className="pantry-area-drag-ghost" src={productSrc(placement)} alt={item.name} draggable={false} /> : null;
}

function EmptyShelfPatch({ item, empty }: { item: AreaItem; empty: string }) {
  if (item.id === "plain-flour") return null;
  const id = `empty-shelf-${item.id ?? item.name.replace(/\W+/g, "-")}`;
  const jarPath = `M ${item.x - item.w * .43} ${item.y + item.h * .98} L ${item.x - item.w * .43} ${item.y + item.h * .22} Q ${item.x - item.w * .38} ${item.y + item.h * .04} ${item.x - item.w * .2} ${item.y + item.h * .03} L ${item.x + item.w * .2} ${item.y + item.h * .03} Q ${item.x + item.w * .38} ${item.y + item.h * .04} ${item.x + item.w * .43} ${item.y + item.h * .22} L ${item.x + item.w * .43} ${item.y + item.h * .98} Z`;
  return <svg className="pantry-area-empty-patch" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden><defs><filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0.28" /></filter><mask id={id}><rect width="100" height="100" fill="black" /><path d={jarPath} fill="white" filter={`url(#${id}-soft)`} /></mask></defs><image href={empty} x="0" y="0" width="100" height="100" preserveAspectRatio="none" mask={`url(#${id})`} /></svg>;
}

export default function PantryAreaInteractionPreview({ kind }: { kind: AreaKind }) {
  const area = AREAS[kind];
  const [active, setActive] = useState<AreaItem | null>(null);
  const [selected, setSelected] = useState<AreaItem | null>(null);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const askCompanion = useAskCompanion();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 1 } }), useSensor(TouchSensor, { activationConstraint: { delay: 80, tolerance: 8 } }));

  const act = (destination: string, item: AreaItem) => {
    setSelected(null);
    if (destination === "shopping") toast({ title: `${item.name} added to Shopping`, description: "It stays in place until you choose to remove it." });
    if (destination === "companion") { askCompanion({ utterance: `Tell me about ${item.name} — its nutrition, health benefits and recipes.`, hints: {} }); openCompanion(); }
    if (destination === "bin") { const identity = item.id ?? item.name; setRemoved(current => new Set(current).add(identity)); toast({ title: `${item.name} removed`, description: "The shelf keeps its empty space.", action: <ToastAction altText="Undo" onClick={() => setRemoved(current => { const next = new Set(current); next.delete(identity); return next; })}>Undo</ToastAction> }); }
  };
  const onDragEnd = (event: DragEndEvent) => { setActive(null); const item = event.active.data.current?.item as AreaItem | undefined; const destination = event.over?.id ? String(event.over.id) : undefined; if (item && destination) act(destination, item); };

  const baseImage = area.image;
  return <main className="pantry-area-page"><DndContext sensors={sensors} onDragStart={(event: DragStartEvent) => setActive(event.active.data.current?.item as AreaItem)} onDragCancel={() => setActive(null)} onDragEnd={onDragEnd}><section className="pantry-area-room" aria-label={area.title}><div className="pantry-area-canvas" style={{ backgroundImage: `url("${baseImage}")` }}><button type="button" className="pantry-area-back" onClick={() => history.back()}>Back to pantry</button>{area.empty && area.items.filter(item => removed.has(item.id ?? item.name)).map(item => <EmptyShelfPatch key={`empty-${item.id ?? item.name}`} item={item} empty={area.empty!} />)}<div className="pantry-area-targets">{area.items.map(item => <AreaObject key={item.id ?? item.name} item={item} selected={selected?.id === item.id} removed={removed.has(item.id ?? item.name)} onSelect={setSelected} />)}</div></div><div className="fridge-preview-destinations pantry-area-destinations" aria-label="Item destinations"><Destination id="shopping" label="Shopping list" sub="drop to add" className="lh-drop--pad"><span className="lh-pad"><span className="lh-pad__scribble">Shopping</span><i className="lh-pad__line" /><i className="lh-pad__line" /><i className="lh-pad__line" /></span></Destination><Destination id="companion" label="Companion" sub="drop to ask" className="lh-drop--companion"><span className="lh-companion-mark"><span className="companion-emblem" aria-hidden><i className="c-occ" /><i className="c-rim-up" /><i className="c-rim-lo" /><i className="c-face" /></span></span></Destination><Destination id="bin" label="Kitchen bin" sub="drop to take out" className="lh-drop--bin"><span className="lh-bin"><span className="lh-bin__lid" /><span className="lh-bin__body" /></span></Destination></div></section><DragOverlay>{active ? <ShelfJarGhost item={active} /> : null}</DragOverlay></DndContext></main>;
}
