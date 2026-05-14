import React from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

export type DragItemData = PlannerEntryDragData | ProposalCardDragData;

export interface DropZoneData {
  type: "planner-slot";
  dayId: number;
  mealType: string;
  audience: string;
  isDrink: boolean;
}

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
  "data-testid": testId,
}: DroppablePlannerCellProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `slot-${dayId}-${mealType}-${audience}-${isDrink ? "drink" : "food"}`,
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
