import React from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PlannerEntry } from "@shared/schema";

export interface DragItemData {
  type: "planner-entry";
  entryId: number;
  entry: PlannerEntry;
  dayId: number;
  mealType: string;
  audience: string;
  isDrink: boolean;
}

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
    data: { type: "planner-entry", entryId: entry.id, entry, dayId, mealType, audience, isDrink } as DragItemData,
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
    data: { type: "planner-entry", entryId: entry.id, entry, dayId, mealType, audience, isDrink } as DragItemData,
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
