import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Search } from "lucide-react";

interface BadAppleWarningModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productName: string;
  riskSummary: {
    additiveCount: number;
    emulsifierCount: number;
    highRiskCount: number;
    novaGroup: number | null;
    isUltraProcessed: boolean;
    upfScore: number;
  };
  onFindBetter: () => void;
  onAddAnyway: () => void;
}

function SadAppleSVG() {
  return (
    <svg
      width="96"
      height="96"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto apple-shake-entry"
      style={{ animation: "appleShake 0.4s ease-in-out 0.2s 2, appleBounce 0.4s ease-out both" }}
    >
      <path
        d="M16 4 C16 4, 19 2, 21 3"
        stroke="#78350f"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M17 5 C18 3, 21 2.5, 22 4 C21 3, 19 3.5, 17.5 5.5 Z"
        fill="#92400e"
        opacity="0.85"
      />
      <path
        d="M16 6 C13 6, 8 8, 8 15 C8 22, 12 27, 16 27 C20 27, 24 22, 24 15 C24 8, 19 6, 16 6 Z"
        fill="#ef4444"
        stroke="#dc2626"
        strokeWidth="1.2"
      />
      <path
        d="M20 8 C22 10, 25 14, 24.5 16 C24 14, 22 10, 20 9 Z"
        fill="#1a1a1a"
        opacity="0.15"
      />
      <path
        d="M13 16.5 C14 17.5, 18 17.5, 19 16.5"
        stroke="#1a1a1a"
        strokeWidth="0.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      <circle cx="12" cy="12.5" r="0.8" fill="#1a1a1a" opacity="0.5" />
      <circle cx="20" cy="12.5" r="0.8" fill="#1a1a1a" opacity="0.5" />
      <path
        d="M10.5 11 C11 10.5, 12 10.5, 13 11"
        stroke="#1a1a1a"
        strokeWidth="0.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M19 11 C19.5 10.5, 20.5 10.5, 21.5 11"
        stroke="#1a1a1a"
        strokeWidth="0.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
      <ellipse cx="11" cy="14.5" rx="1.5" ry="1" fill="white" opacity="0.1" />
    </svg>
  );
}

export default function BadAppleWarningModal({
  open,
  onOpenChange,
  productName,
  riskSummary,
  onFindBetter,
  onAddAnyway,
}: BadAppleWarningModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="modal-bad-apple-warning">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Highly Ultra-Processed
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-4 gap-4">
          <SadAppleSVG />

          <div className="text-center space-y-2">
            <p className="font-medium text-sm">{productName}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This product contains multiple high-risk additives and emulsifiers.
              Consider a cleaner alternative.
            </p>
          </div>

          <div className="w-full space-y-1.5 px-2">
            {riskSummary.isUltraProcessed && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Ultra-Processed</span>
                <span className="font-medium text-red-500 dark:text-red-400">Yes</span>
              </div>
            )}
            {riskSummary.novaGroup !== null && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">NOVA Group</span>
                <span className="font-medium text-red-500 dark:text-red-400">{riskSummary.novaGroup}</span>
              </div>
            )}
            {riskSummary.additiveCount > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Additives Detected</span>
                <span className="font-medium text-red-500 dark:text-red-400">{riskSummary.additiveCount}</span>
              </div>
            )}
            {riskSummary.highRiskCount > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">High-Risk Additives</span>
                <span className="font-medium text-red-500 dark:text-red-400">{riskSummary.highRiskCount}</span>
              </div>
            )}
            {riskSummary.emulsifierCount > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Emulsifiers</span>
                <span className="font-medium text-orange-500 dark:text-orange-400">{riskSummary.emulsifierCount}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">UPF Score</span>
              <span className="font-medium text-red-500 dark:text-red-400">{riskSummary.upfScore}/100</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Button
            onClick={onFindBetter}
            className="w-full"
            data-testid="button-find-better"
          >
            <Search className="h-4 w-4 mr-2" />
            Find Better Option
          </Button>
          <Button
            variant="ghost"
            onClick={onAddAnyway}
            className="w-full text-muted-foreground"
            data-testid="button-add-anyway"
          >
            Add Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
