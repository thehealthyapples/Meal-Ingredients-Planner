import { useState, useEffect } from "react";
import { Camera, Upload, X, Loader2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { AssistantMode } from "@/contexts/PlannerContext";

interface PlannerAssistantPanelProps {
  mode: AssistantMode;
  onClose: () => void;
  onOpenCamera: () => void;
  onUploadFile: () => void;
  scanLoading: boolean;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

interface ScanContentProps {
  onOpenCamera: () => void;
  onUploadFile: () => void;
  scanLoading: boolean;
}

function ScanContent({ onOpenCamera, onUploadFile, scanLoading }: ScanContentProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 bg-muted/40 rounded-lg px-3 py-3">
        <ScanLine className="h-7 w-7 shrink-0 text-primary/60 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Photograph your handwritten or printed meal plan and we'll extract the meals into your planner.
        </p>
      </div>
      <div className="space-y-2">
        <Button
          className="w-full"
          onClick={onOpenCamera}
          disabled={scanLoading}
          data-testid="button-assistant-take-photo"
        >
          {scanLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Camera className="h-4 w-4 mr-2" />
          )}
          Take Photo
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={onUploadFile}
          disabled={scanLoading}
          data-testid="button-assistant-upload"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Image
        </Button>
      </div>
      {scanLoading && (
        <p className="text-xs text-center text-muted-foreground animate-pulse pt-1">
          Scanning your plan…
        </p>
      )}
    </div>
  );
}

export function PlannerAssistantPanel({
  mode,
  onClose,
  onOpenCamera,
  onUploadFile,
  scanLoading,
}: PlannerAssistantPanelProps) {
  const isMobile = useIsMobile();

  if (!mode) return null;

  const titleLabel = mode === "scan" ? "Scan Planner" : "Planner Assistant";

  if (isMobile) {
    return (
      <Sheet open={true} onOpenChange={(v) => { if (!v) onClose(); }}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl px-6 pb-8 pt-6 h-auto"
          data-testid="sheet-planner-assistant"
        >
          <SheetHeader className="flex-row items-center justify-between mb-4 space-y-0">
            <SheetTitle className="text-base flex items-center gap-2">
              <ScanLine className="h-4 w-4 text-primary" />
              {titleLabel}
            </SheetTitle>
            <button
              onClick={onClose}
              className="rounded-md p-1 hover:bg-accent/40 text-muted-foreground transition-colors"
              data-testid="button-assistant-close-mobile"
              aria-label="Close assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </SheetHeader>
          {mode === "scan" && (
            <ScanContent
              onOpenCamera={onOpenCamera}
              onUploadFile={onUploadFile}
              scanLoading={scanLoading}
            />
          )}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      className="shrink-0 w-72 sticky top-20 self-start border border-border rounded-xl bg-card p-4 flex flex-col gap-3"
      data-testid="panel-planner-assistant"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <ScanLine className="h-4 w-4 text-primary" />
          {titleLabel}
        </h3>
        <button
          onClick={onClose}
          className="rounded-md p-1 hover:bg-accent/40 text-muted-foreground transition-colors"
          data-testid="button-assistant-close"
          aria-label="Close assistant"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="w-full h-px bg-border" />
      {mode === "scan" && (
        <ScanContent
          onOpenCamera={onOpenCamera}
          onUploadFile={onUploadFile}
          scanLoading={scanLoading}
        />
      )}
    </aside>
  );
}
