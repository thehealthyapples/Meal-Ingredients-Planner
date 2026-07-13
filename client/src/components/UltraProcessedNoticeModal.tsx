import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, Search } from "lucide-react";
import { semanticText } from "@/components/intelligence/intelligence-tokens";

// PX1-W4b (fnd-px-sound-moralises-food, fnd-px-success-silent-error-loud).
//
// Predecessor: `BadAppleWarningModal` — deleted in this change, not deprecated
// (UIA §17). It was the visual half of the moment `use-sound-effects` was the
// audible half of: the household scanned a food they had chosen, and THA played a
// 220Hz buzz at them while raising a red `AlertTriangle` "warning" over a hand-drawn
// apple with a FROWNING FACE. The component's own name called their shopping a bad
// apple. EXP §13: "Encouraging, never judgmental — no 'good/bad food'."
//
// What is kept, deliberately: every fact. The NOVA group, the additive counts, the
// emulsifiers and the UPF score are THA's reason to exist, and softening them would
// be misinformation dressed up as kindness — a worse failure than the alarm was.
// The line this file draws is between TELLING THE TRUTH ABOUT FOOD (kept, in full)
// and PASSING JUDGEMENT ON A HOUSEHOLD (gone entirely).
//
// What is removed: the frowning apple, the warning triangle, the destructive red,
// and "Add Anyway" — a label that framed the household's own choice as defiance.
// Red is THA's alarm token and EXP §14 reserves alarm for genuine data loss or
// safety; a food's processing score is information, not a safety event. The one
// signal that IS a safety event — a restriction conflict for a named household
// member — keeps red, and keeps it alone (`attentionPresentation.critical`).

interface UltraProcessedNoticeModalProps {
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

export default function UltraProcessedNoticeModal({
  open,
  onOpenChange,
  productName,
  riskSummary,
  onFindBetter,
  onAddAnyway,
}: UltraProcessedNoticeModalProps) {
  const value = `font-medium ${semanticText.notice}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="modal-bad-apple-warning">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            Ultra-processed
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col py-2 gap-4">
          <div className="space-y-2">
            <p className="font-medium text-sm">{productName}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This one is ultra-processed, and here's what's in it. It's your call —
              THA can show you similar products that score higher, or add this to your
              list as it is.
            </p>
          </div>

          <div className="w-full space-y-1.5">
            {riskSummary.isUltraProcessed && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Ultra-Processed</span>
                <span className={value}>Yes</span>
              </div>
            )}
            {riskSummary.novaGroup !== null && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">NOVA Group</span>
                <span className={value}>{riskSummary.novaGroup}</span>
              </div>
            )}
            {riskSummary.additiveCount > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Additives Detected</span>
                <span className={value}>{riskSummary.additiveCount}</span>
              </div>
            )}
            {riskSummary.highRiskCount > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">High-Risk Additives</span>
                <span className={value}>{riskSummary.highRiskCount}</span>
              </div>
            )}
            {riskSummary.emulsifierCount > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Emulsifiers</span>
                <span className={value}>{riskSummary.emulsifierCount}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">UPF Score</span>
              <span className={value}>{riskSummary.upfScore}/100</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Button variant="default"
            onClick={onFindBetter}
            className="w-full"
            data-testid="button-find-better"
          >
            <Search className="h-4 w-4 mr-2" />
            Show me alternatives
          </Button>
          <Button
            variant="ghost"
            onClick={onAddAnyway}
            className="w-full text-muted-foreground"
            data-testid="button-add-anyway"
          >
            Add to list
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
