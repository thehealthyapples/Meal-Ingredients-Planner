import { useState } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useDemoMode } from "@/contexts/demo-context";

export function DemoReadOnlyModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [, navigate] = useLocation();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm" data-testid="demo-readonly-modal">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-100">
              <Lock className="h-4 w-4 text-amber-700" />
            </div>
            <DialogTitle>Demo Mode — Read Only</DialogTitle>
          </div>
          <DialogDescription>
            You're exploring THA in demo mode. Create a free account to save meals, build
            your planner, and track your progress.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full"
            onClick={() => navigate("/auth")}
            data-testid="button-demo-modal-create-account"
          >
            Create Account
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={onClose}
            data-testid="button-demo-modal-continue"
          >
            Continue Browsing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useDemoWriteGuard(): { guard: () => void; modal: React.ReactElement } {
  const { isDemoMode } = useDemoMode();
  const [open, setOpen] = useState(false);

  const guard = () => {
    if (isDemoMode) setOpen(true);
  };

  const modal = (
    <DemoReadOnlyModal open={open} onClose={() => setOpen(false)} />
  );

  return { guard, modal };
}
