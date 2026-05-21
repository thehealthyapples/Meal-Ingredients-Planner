import React from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { PlannerEntry } from "@shared/schema";

// Phase 4A/4B: existing planner-entry drag data
export interface PlannerEntryDragData {
  type: "planner-entry";
  entryId: number;
  entry: PlannerEntry;
  dayId: number;
  mealType: string;
  audience: string;
  isDrink: boolean;
}

// Phase 5D: proposal card dragged from the assistant panel into the grid
export interface ProposalCardDragData {
  type: "proposal-card";
  proposalId: string;
  name: string;
  source: "assistant-panel";
  proposedMealType?: string;
  isDrink?: boolean;
  audience?: string;
}

// Phase 3: search result dragged from Planner Assistant discovery rows
export interface SearchResultDragData {
  type: "search-result";
  mealId: number;
  mealName: string;
  sourceOrigin: "cookbook" | "freezer" | "packaged";
}

export type DragItemData = PlannerEntryDragData | ProposalCardDragData | SearchResultDragData;

export type DropZoneData =
  | { type: "planner-slot"; dayId: number; mealType: string; audience: string; isDrink: boolean }
  | { type: "mobile-day-nav"; dayId: number; dayIndex: number }
  | { type: "provisioning"; weekId: number };

interface EntryProps {
  entry: PlannerEntry;
  dayId: number;
  mealType: string;
  audience: string;
  isDrink: boolean;
  children: React.ReactNode;
}

// Phase 4A: plain draggable (kept for reference; Phase 4B uses SortablePlannerEntry)
export function DraggablePlannerEntry({ entry, dayId, mealType, audience, isDrink, children }: EntryProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `entry-${entry.id}`,
    data: { type: "planner-entry", entryId: entry.id, entry, dayId, mealType, audience, isDrink } as PlannerEntryDragData,
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`touch-none ${isDragging ? "opacity-30" : ""}`}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
}

// Phase 4B: sortable entry — acts as both draggable AND droppable target for within-slot reorder
export function SortablePlannerEntry({ entry, dayId, mealType, audience, isDrink, children }: EntryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `entry-${entry.id}`,
    data: { type: "planner-entry", entryId: entry.id, entry, dayId, mealType, audience, isDrink } as PlannerEntryDragData,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`touch-none ${isDragging ? "opacity-30" : ""}`}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
}

interface DroppablePlannerCellProps {
  dayId: number;
  mealType: string;
  audience: string;
  isDrink: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  idPrefix?: string;
  "data-testid"?: string;
}

export function DroppablePlannerCell({
  dayId,
  mealType,
  audience,
  isDrink,
  children,
  className,
  style,
  idPrefix = "slot",
  "data-testid": testId,
}: DroppablePlannerCellProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `${idPrefix}-${dayId}-${mealType}-${audience}-${isDrink ? "drink" : "food"}`,
    data: { type: "planner-slot", dayId, mealType, audience, isDrink } as DropZoneData,
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className ?? ""} transition-colors ${isOver ? "ring-1 ring-inset ring-primary/40 bg-primary/5" : ""}`}
      style={style}
      data-testid={testId}
    >
      {children}
    </div>
  );
}

// Phase 5D: draggable proposal card from the assistant panel
interface DraggableProposalCardProps {
  id: string;
  name: string;
  proposedMealType?: string;
  children: React.ReactNode;
}

export function DraggableProposalCard({ id, name, proposedMealType, children }: DraggableProposalCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: {
      type: "proposal-card",
      proposalId: id,
      name,
      source: "assistant-panel",
      proposedMealType,
    } as ProposalCardDragData,
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`touch-none ${isDragging ? "opacity-30" : ""}`}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
}

// Mobile: sortable meal entry with a dedicated drag handle (drag activates only from handle)
interface MobileSortableEntryProps {
  entry: PlannerEntry;
  dayId: number;
  mealType: string;
  audience: string;
  isDrink: boolean;
  children: React.ReactNode;
}

export function MobileSortableMealEntry({
  entry,
  dayId,
  mealType,
  audience,
  isDrink,
  children,
}: MobileSortableEntryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `mobile-entry-${entry.id}`,
    data: {
      type: "planner-entry",
      entryId: entry.id,
      entry,
      dayId,
      mealType,
      audience,
      isDrink,
    } as PlannerEntryDragData,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`flex items-center w-full ${isDragging ? "opacity-30" : ""}`}
    >
      <div className="flex-1 min-w-0">{children}</div>
      <div
        ref={setActivatorNodeRef}
        {...listeners}
        className="touch-none flex-shrink-0 px-1.5 py-2 -my-1 -mr-0.5 text-muted-foreground/20 hover:text-muted-foreground/50 cursor-grab active:cursor-grabbing select-none"
        aria-label="Drag to move meal"
      >
        <GripVertical className="h-4 w-4" />
      </div>
    </div>
  );
}

// Phase 3: draggable search result row — drag activates only from the grip handle,
// leaving click/tap behaviour on the row button entirely intact.
interface DraggableSearchResultRowProps {
  mealId: number;
  mealName: string;
  sourceOrigin: "cookbook" | "freezer" | "packaged";
  children: React.ReactNode;
}

export function DraggableSearchResultRow({
  mealId,
  mealName,
  sourceOrigin,
  children,
}: DraggableSearchResultRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `search-result-${mealId}`,
    data: { type: "search-result", mealId, mealName, sourceOrigin } as SearchResultDragData,
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`flex items-center w-full ${isDragging ? "opacity-30" : ""}`}
    >
      <div className="flex-1 min-w-0">{children}</div>
      <div
        ref={setActivatorNodeRef}
        {...listeners}
        className="touch-none flex-shrink-0 px-1.5 py-2 -my-1 text-muted-foreground/25 hover:text-muted-foreground/60 cursor-grab active:cursor-grabbing select-none"
        aria-label="Drag to add to planner"
      >
        <GripVertical className="h-4 w-4" />
      </div>
    </div>
  );
}

// Droppable weekly provisioning area — accepts search-result drags from the assistant panel
interface DroppableProvisioningProps {
  weekId: number;
  children: React.ReactNode;
  className?: string;
  "data-testid"?: string;
}

export function DroppableProvisioning({ weekId, children, className, "data-testid": testId }: DroppableProvisioningProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `provisioning-${weekId}`,
    data: { type: "provisioning", weekId } as DropZoneData,
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className ?? ""} rounded-lg transition-colors ${isOver ? "ring-1 ring-emerald-500/50 bg-emerald-500/5" : ""}`}
      data-testid={testId}
    >
      {children}
    </div>
  );
}

// Mobile: droppable day-nav item used in the horizontal day row during cross-day drag
interface MobileDayDropTargetProps {
  dayId: number;
  dayIndex: number;
  isSelected: boolean;
  label: string;
  onClick: () => void;
}

export function MobileDayDropTarget({
  dayId,
  dayIndex,
  isSelected,
  label,
  onClick,
}: MobileDayDropTargetProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `mobile-day-nav-${dayId}`,
    data: { type: "mobile-day-nav", dayId, dayIndex } as DropZoneData,
  });

  return (
    <div ref={setNodeRef} className="flex-1 min-w-0">
      <button
        type="button"
        onClick={onClick}
        className={`w-full px-1 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[36px] text-center ${
          isSelected
            ? "bg-primary text-primary-foreground"
            : isOver
            ? "bg-primary/15 text-primary ring-1 ring-primary/30"
            : "bg-muted/60 text-muted-foreground hover:bg-muted"
        }`}
      >
        {label}
      </button>
    </div>
  );
}
