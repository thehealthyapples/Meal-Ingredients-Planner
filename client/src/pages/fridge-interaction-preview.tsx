import "./living-home-room.css";
import "./fridge-interaction-preview.css";
import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { apiRequest } from "@/lib/queryClient";
import { useAskCompanion } from "@/components/conversation/companion-context";
import { openCompanion } from "@/components/conversation/companion-open";

type PickupShape = "round" | "leafy" | "long" | "cluster";
type FridgeObject = { name: string; src: string; x: number; y: number; h: number; w: number; camera?: "drawer"; pickupShape?: PickupShape; pickupBox?: { x: number; y: number; w: number; h: number } };

const OBJECTS_ALL: FridgeObject[] = [
  { name: "Strawberry jam", src: "/images/living-home/room/fridge-labelled-master/strawberry-jam.png", x: 21.7, y: 21.3, w: 4.2, h: 8.6 },
  { name: "Smooth peanut butter", src: "/images/living-home/room/fridge-labelled-master/smooth-peanut-butter.png", x: 26.1, y: 21.4, w: 4.2, h: 8.1 },
  { name: "Dijon mustard", src: "/images/living-home/room/fridge-labelled-master/dijon-mustard.png", x: 22.0, y: 37.4, w: 4.4, h: 10.4 },
  { name: "Branston pickle", src: "/images/living-home/room/fridge-labelled-master/branston-pickle.png", x: 26.4, y: 37.4, w: 4.0, h: 9.2 },
  { name: "Honey mustard dressing", src: "/images/living-home/room/fridge-labelled-master/honey-mustard-dressing.png", x: 22.0, y: 55.7, w: 4.1, h: 10.9 },
  { name: "Hot sauce", src: "/images/living-home/room/fridge-labelled-master/hot-sauce.png", x: 26.1, y: 55.7, w: 3.6, h: 11.3 },
  { name: "Tomato ketchup", src: "/images/living-home/room/fridge-labelled-master/tomato-ketchup.png", x: 21.8, y: 75.7, w: 4.4, h: 12.7 },
  { name: "Caesar dressing", src: "/images/living-home/room/fridge-labelled-master/caesar-dressing.png", x: 26.2, y: 75.7, w: 3.8, h: 13.0 },
  { name: "Beef stew", src: "/images/living-home/room/fridge-labelled-master/beef-stew.png", x: 37.9, y: 26.0, w: 8.9, h: 6.9 },
  { name: "Cooked chicken", src: "/images/living-home/room/fridge-labelled-master/cooked-chicken.png", x: 48.2, y: 26.0, w: 9.1, h: 6.9 },
  { name: "Grapes", src: "", x: 59.0, y: 27.2, w: 9.3, h: 10.4 },
  { name: "Whole milk", src: "/images/living-home/room/fridge-labelled-master/whole-milk.png", x: 35.4, y: 65.1, w: 5.6, h: 15.8 },
  { name: "Orange juice", src: "/images/living-home/room/fridge-labelled-master/orange-juice.png", x: 40.3, y: 65.1, w: 5.0, h: 15.1 },
  { name: "Fresh cream", src: "", x: 44.7, y: 65.0, w: 4.0, h: 10.5 },
  { name: "Lemon cordial", src: "", x: 49.2, y: 65.0, w: 4.7, h: 13.4 },
  { name: "Yoghurt", src: "/images/living-home/room/fridge-labelled-master/yoghurt.png", x: 40.2, y: 38.1, w: 5.5, h: 9.4 },
  { name: "Brie", src: "/images/living-home/room/fridge-labelled-master/brie.png", x: 48.7, y: 38.3, w: 7.1, h: 5.7 },
  { name: "Eggs", src: "", x: 58.1, y: 38.2, w: 12.4, h: 5.5 },
  { name: "Strawberries", src: "", x: 37.7, y: 48.0, w: 8.3, h: 6.4 },
  { name: "Blueberries", src: "", x: 45.4, y: 48.0, w: 6.4, h: 5.8 },
  { name: "Mature cheddar", src: "/images/living-home/room/fridge-labelled-master/mature-cheddar.png", x: 52.3, y: 48.1, w: 7.2, h: 6.5 },
  { name: "Red Leicester", src: "/images/living-home/room/fridge-labelled-master/red-leicester.png", x: 60.0, y: 48.1, w: 7.1, h: 6.5 },
  { name: "Ketchup", src: "/images/living-home/room/fridge-labelled-master/ketchup.png", x: 71.8, y: 57.7, w: 4.9, h: 14.2 },
  { name: "Pickles", src: "/images/living-home/room/fridge-labelled-master/pickles.png", x: 53.8, y: 64.9, w: 4.6, h: 10.5 },
  { name: "Tomato juice", src: "/images/living-home/room/fridge-labelled-master/tomato-juice.png", x: 61.5, y: 64.9, w: 4.8, h: 10.5 },
  { name: "Horseradish sauce", src: "", x: 57.9, y: 64.8, w: 3.4, h: 10.2 },
  { name: "Salsa", src: "/images/living-home/room/fridge-labelled-master/salsa.png", x: 71.7, y: 21.3, w: 4.2, h: 8.4 },
  { name: "Hummus", src: "/images/living-home/room/fridge-labelled-master/hummus.png", x: 76.3, y: 21.3, w: 4.1, h: 8.1 },
  { name: "Door pickles", src: "/images/living-home/room/fridge-labelled-master/door-pickles.png", x: 71.7, y: 37.4, w: 4.2, h: 10.5 },
  { name: "Mayonnaise", src: "/images/living-home/room/fridge-labelled-master/mayonnaise.png", x: 76.3, y: 37.4, w: 4.1, h: 10.4 },
  { name: "Garlic aioli", src: "/images/living-home/room/fridge-labelled-master/garlic-aioli.png", x: 76.4, y: 56.0, w: 3.9, h: 12.4 },
  { name: "Real mayonnaise", src: "/images/living-home/room/fridge-labelled-master/real-mayonnaise.png", x: 72.0, y: 75.9, w: 4.5, h: 13.3 },
  { name: "English mustard", src: "/images/living-home/room/fridge-labelled-master/english-mustard.png", x: 76.4, y: 75.9, w: 3.9, h: 12.2 },
];

// This is a dedicated, overhead camera of the same single drawer. Its targets
// are intentionally larger and separated so the pointer selects the food the
// household sees, rather than a small region in the wide fridge camera.
const DRAWER_OBJECTS: FridgeObject[] = [
  { name: "Lettuce", src: "", x: 17, y: 40, w: 21, h: 29, camera: "drawer", pickupShape: "leafy" },
  { name: "Spinach", src: "", x: 35, y: 32, w: 13, h: 19, camera: "drawer", pickupShape: "leafy" },
  { name: "Kale", src: "", x: 52, y: 35, w: 15, h: 24, camera: "drawer", pickupShape: "leafy" },
  { name: "Carrots", src: "", x: 73, y: 53, w: 13, h: 25, camera: "drawer", pickupShape: "long" },
  { name: "Celery", src: "", x: 89, y: 35, w: 13, h: 42, camera: "drawer", pickupShape: "long" },
  { name: "Spring onions", src: "", x: 31, y: 50, w: 14, h: 24, camera: "drawer", pickupShape: "long" },
  { name: "Red pepper", src: "", x: 46, y: 47, w: 8, h: 10, camera: "drawer", pickupShape: "round" },
  { name: "Green pepper", src: "", x: 56, y: 53, w: 8, h: 10, camera: "drawer", pickupShape: "round" },
  { name: "Yellow pepper", src: "", x: 48, y: 63, w: 9, h: 10, camera: "drawer", pickupShape: "round" },
  { name: "Cucumbers", src: "", x: 68, y: 64, w: 14, h: 22, camera: "drawer", pickupShape: "long" },
  { name: "Broccoli", src: "", x: 84, y: 78, w: 17, h: 25, camera: "drawer", pickupShape: "cluster" },
  { name: "Radishes", src: "", x: 27, y: 66, w: 15, h: 15, camera: "drawer", pickupShape: "cluster" },
  { name: "Tomatoes", src: "", x: 36, y: 77, w: 16, h: 18, camera: "drawer", pickupShape: "cluster" },
  { name: "Mushrooms", src: "", x: 53, y: 80, w: 13, h: 9, camera: "drawer", pickupShape: "cluster" },
  { name: "Fresh herbs", src: "", x: 15, y: 79, w: 21, h: 14, camera: "drawer", pickupShape: "leafy" },
];

// The full labelled master is the visual source of truth. These are transparent
// interaction targets in its exact source coordinates: they never redraw or
// rearrange the fridge.
const MAIN_OBJECTS = OBJECTS_ALL;

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function DraggableFood({ item, removed, selected, onSelect }: { item: FridgeObject; removed: boolean; selected: boolean; onSelect: (item: FridgeObject) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `fridge-preview-${slug(item.name)}`, data: item });
  if (removed) return null;
  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`fridge-preview-object${item.pickupShape ? ` fridge-preview-object--${item.pickupShape}` : ""}${isDragging ? " is-dragging" : ""}${selected ? " is-selected" : ""}`}
      style={{ left: `${item.x}%`, top: `${item.y - item.h}%`, width: `${item.w}%`, height: `${item.h}%` }}
      aria-label={`Move ${item.name}`}
      {...listeners}
      {...attributes}
      onClick={() => onSelect(item)}
      aria-pressed={selected}
    >
      <img src={item.src} alt="" draggable={false} style={{ visibility: "hidden" }} />
    </button>
  );
}

function DrawerFoodGhost({ item }: { item: FridgeObject }) {
  const sourceBox = item.pickupBox ?? item;
  const top = sourceBox.y - sourceBox.h;
  const isShaped = Boolean(item.pickupShape);
  const cropWidth = isShaped ? sourceBox.w * 0.94 : sourceBox.w;
  const cropHeight = isShaped ? sourceBox.h * 0.94 : sourceBox.h;
  const cropX = sourceBox.x - cropWidth / 2;
  const cropY = top + (sourceBox.h - cropHeight) / 2;
  const clipId = `drawer-ghost-${slug(item.name)}`;
  return <svg className="fridge-preview-drawer-ghost" viewBox={`${cropX} ${cropY} ${cropWidth} ${cropHeight}`} aria-label={item.name}>
    {isShaped && <defs><clipPath id={clipId}>{item.pickupShape === "long" ? <rect x={cropX} y={cropY} width={cropWidth} height={cropHeight} rx={cropWidth * .25} /> : <ellipse cx={sourceBox.x} cy={top + sourceBox.h / 2} rx={cropWidth / 2} ry={cropHeight / 2} />}</clipPath></defs>}
    <image href="/images/living-home/room/fridge-labelled-master/produce-drawer-overhead.png?v=drawer-camera" x="0" y="0" width="100" height="100" clipPath={isShaped ? `url(#${clipId})` : undefined} />
  </svg>;
}

function DrawerSelectionOutline({ item }: { item: FridgeObject }) {
  const top = item.y - item.h;
  const common = { fill: "none", stroke: "#fff6d2", strokeWidth: 0.42, vectorEffect: "non-scaling-stroke" as const };
  if (item.pickupShape === "long") return <svg className="fridge-preview-selection-outline" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden><rect x={item.x - item.w / 2} y={top} width={item.w} height={item.h} rx={Math.min(item.w, item.h) * .18} {...common} /></svg>;
  if (item.pickupShape === "leafy") return <svg className="fridge-preview-selection-outline" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden><path d={`M ${item.x - item.w * .42} ${top + item.h * .2} Q ${item.x - item.w * .22} ${top - item.h * .06} ${item.x} ${top + item.h * .1} Q ${item.x + item.w * .28} ${top - item.h * .05} ${item.x + item.w * .44} ${top + item.h * .3} Q ${item.x + item.w * .5} ${top + item.h * .68} ${item.x + item.w * .18} ${top + item.h * .94} Q ${item.x - item.w * .14} ${top + item.h * 1.06} ${item.x - item.w * .43} ${top + item.h * .78} Q ${item.x - item.w * .55} ${top + item.h * .42} ${item.x - item.w * .42} ${top + item.h * .2}`} {...common} /></svg>;
  return <svg className="fridge-preview-selection-outline" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden><ellipse cx={item.x} cy={top + item.h / 2} rx={item.w / 2} ry={item.h / 2} {...common} /></svg>;
}

function RemovedFoodPatch({ item, source = "/images/living-home/room/fridge-labelled-master/empty-plate.png?v=labelled-master", softEdge = false }: { item: FridgeObject; source?: string; softEdge?: boolean }) {
  const patchId = `fridge-removal-${slug(item.name)}`;
  const top = item.y - item.h;
  return (
    <svg className="fridge-preview-removal" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <defs><clipPath id={patchId}>{softEdge ? <ellipse cx={item.x} cy={top + item.h / 2} rx={item.w / 2} ry={item.h / 2} /> : <rect x={item.x - item.w / 2} y={top} width={item.w} height={item.h} />}</clipPath></defs>
      <image href={source} x="0" y="0" width="100" height="100" preserveAspectRatio="none" clipPath={`url(#${patchId})`} />
    </svg>
  );
}

function DropDestination({ id, label, sub, className, children }: { id: string; label: string; sub: string; className: string; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef} className={`lh-drop fridge-preview-destination ${className}${isOver ? " is-over" : ""}`} aria-label={`${label} — ${sub}`}><div className="lh-drop__art" aria-hidden>{children}</div><span className="lh-drop__label"><b>{label}</b><small>{sub}</small></span></div>;
}

export default function FridgeInteractionPreview() {
  const [active, setActive] = useState<FridgeObject | null>(null);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<FridgeObject | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { toast } = useToast();
  const askCompanion = useAskCompanion();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 1 } }), useSensor(TouchSensor, { activationConstraint: { delay: 80, tolerance: 8 } }), useSensor(KeyboardSensor));

  const toShopping = async (item: FridgeObject) => {
    await apiRequest("POST", "/api/shopping-list", { productName: item.name, source: "pantry", purchaseIntent: true });
    toast({ title: `${item.name} added to Shopping`, description: "It stays in the fridge until you choose to remove it." });
  };

  const toCompanion = (item: FridgeObject) => {
    askCompanion({ utterance: `Tell me about ${item.name} — its nutrition, health benefits and a few recipes our household could make.`, hints: {} });
    openCompanion();
  };

  const toBin = (item: FridgeObject) => {
    setRemoved((current) => new Set(current).add(item.name));
    toast({ title: `${item.name} removed`, description: "The fridge keeps its empty space.", action: <ToastAction altText="Undo" onClick={() => setRemoved((current) => { const next = new Set(current); next.delete(item.name); return next; })}>Undo</ToastAction> });
  };

  const act = (destination: string, item: FridgeObject) => {
    setSelected(null);
    if (destination === "shopping") void toShopping(item);
    if (destination === "companion") toCompanion(item);
    if (destination === "bin") toBin(item);
  };

  const openDrawer = () => {
    setSelected(null);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setSelected(null);
    setDrawerOpen(false);
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActive(null);
    const item = event.active.data.current as FridgeObject | undefined;
    if (item && event.over?.id && ["shopping", "companion", "bin"].includes(String(event.over.id))) act(String(event.over.id), item);
  };

  return (
    <main className="fridge-preview-page">
      <DndContext sensors={sensors} onDragStart={(event: DragStartEvent) => { const item = event.active.data.current as FridgeObject; setActive(item); setSelected(item); }} onDragCancel={() => setActive(null)} onDragEnd={onDragEnd}>
        <section className="fridge-preview-room" aria-label="Interactive fridge">
          <div className={`fridge-preview-canvas${drawerOpen ? " is-drawer-open" : ""}${!drawerOpen && removed.has("Orange juice") ? " is-object-removed" : ""}`}>
            {!drawerOpen && [...removed].filter((name) => name !== "Orange juice").map((name) => {
              const item = MAIN_OBJECTS.find((candidate) => candidate.name === name);
              return item ? <RemovedFoodPatch key={name} item={item} /> : null;
            })}
            {drawerOpen ? <>
              <button type="button" className="fridge-preview-close-drawer" onClick={closeDrawer}>← Back to fridge</button>
              {selected?.camera === "drawer" && !removed.has(selected.name) && <DrawerSelectionOutline item={selected} />}
              {[...removed].map((name) => {
                const item = DRAWER_OBJECTS.find((candidate) => candidate.name === name);
                return item ? <RemovedFoodPatch key={name} item={item} source="/images/living-home/room/fridge-labelled-master/produce-drawer-empty.png?v=drawer-camera" softEdge /> : null;
              })}
              <div className="fridge-preview-objects fridge-preview-drawer-objects">
                {DRAWER_OBJECTS.map((item) => <DraggableFood key={item.name} item={item} removed={removed.has(item.name)} selected={selected?.name === item.name} onSelect={setSelected} />)}
              </div>
            </> : <>
              <button type="button" className="fridge-preview-drawer-trigger" onClick={openDrawer} aria-label="Open the vegetable drawer"><span>Open vegetable drawer</span></button>
              <div className="fridge-preview-objects">
                {MAIN_OBJECTS.map((item) => <DraggableFood key={item.name} item={item} removed={removed.has(item.name)} selected={selected?.name === item.name} onSelect={setSelected} />)}
              </div>
            </>}
          </div>
          <div className="fridge-preview-destinations" aria-label="Item destinations">
            <DropDestination id="shopping" label="Shopping list" sub="drop to add" className="lh-drop--pad"><span className="lh-pad"><span className="lh-pad__scribble">Shopping</span><i className="lh-pad__line" /><i className="lh-pad__line" /><i className="lh-pad__line" /></span></DropDestination>
            <DropDestination id="companion" label="Companion" sub="drop to ask" className="lh-drop--companion"><span className="lh-companion-mark"><span className="companion-emblem" aria-hidden><i className="c-occ" /><i className="c-rim-up" /><i className="c-rim-lo" /><i className="c-face" /></span></span></DropDestination>
            <DropDestination id="bin" label="Kitchen bin" sub="drop to take out" className="lh-drop--bin"><span className="lh-bin"><span className="lh-bin__lid" /><span className="lh-bin__body" /></span></DropDestination>
          </div>
        </section>
        <DragOverlay>{active ? <div className="fridge-preview-drag-ghost">{active.camera === "drawer" ? <DrawerFoodGhost item={active} /> : active.src ? <img src={active.src} alt="" /> : <span>{active.name}</span>}</div> : null}</DragOverlay>
      </DndContext>
    </main>
  );
}
