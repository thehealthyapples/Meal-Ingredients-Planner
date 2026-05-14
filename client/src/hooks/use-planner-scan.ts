import { useState, useRef, useMemo } from "react";
import type { PlannerScanData, PlannerDayEntry } from "@/components/PlannerScanReview";
import type { FullWeek } from "@/lib/planner-types";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface UsePlannerScanOptions {
  activeWeekData: FullWeek | undefined;
  onScanReady?: () => void;
}

export function usePlannerScan({ activeWeekData, onScanReady }: UsePlannerScanOptions) {
  const [plannerCameraOpen, setPlannerCameraOpen] = useState(false);
  const [plannerScanOpen, setPlannerScanOpen] = useState(false);
  const [plannerScanData, setPlannerScanData] = useState<PlannerScanData | null>(null);
  const [plannerScanLoading, setPlannerScanLoading] = useState(false);
  const [plannerScanError, setPlannerScanError] = useState<string | null>(null);
  const plannerScanFileRef = useRef<HTMLInputElement>(null);
  const plannerScanCancelledRef = useRef(false);

  const plannerDays = useMemo((): PlannerDayEntry[] => {
    return (activeWeekData?.days ?? []).map(d => ({
      id: d.id,
      dayOfWeek: d.dayOfWeek,
      dayName: DAY_NAMES[d.dayOfWeek] ?? "Unknown",
    }));
  }, [activeWeekData]);

  const handlePlannerScanFile = async (file: File) => {
    plannerScanCancelledRef.current = false;
    setPlannerScanData(null);
    setPlannerScanError(null);
    setPlannerScanLoading(true);
    setPlannerScanOpen(true);
    onScanReady?.();

    const scanId = Math.random().toString(36).slice(2, 10);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("mode", "planner");

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: { "X-Scan-Id": scanId },
      });
      if (plannerScanCancelledRef.current) return;
      const data = await res.json();
      if (plannerScanCancelledRef.current) return;
      if (!res.ok) {
        setPlannerScanError(data.message || "Scan failed.");
      } else {
        setPlannerScanData(data as PlannerScanData);
      }
    } catch {
      if (!plannerScanCancelledRef.current) setPlannerScanError("Scan failed. Please try again.");
    } finally {
      if (!plannerScanCancelledRef.current) setPlannerScanLoading(false);
      if (plannerScanFileRef.current) plannerScanFileRef.current.value = "";
    }
  };

  const handlePlannerScanOpenChange = (open: boolean) => {
    if (!open && plannerScanLoading) {
      plannerScanCancelledRef.current = true;
      setPlannerScanLoading(false);
    }
    setPlannerScanOpen(open);
    if (!open) {
      setPlannerScanData(null);
      setPlannerScanError(null);
    }
  };

  return {
    plannerCameraOpen,
    setPlannerCameraOpen,
    plannerScanOpen,
    plannerScanData,
    plannerScanLoading,
    plannerScanError,
    plannerScanFileRef,
    plannerDays,
    handlePlannerScanFile,
    handlePlannerScanOpenChange,
  };
}
