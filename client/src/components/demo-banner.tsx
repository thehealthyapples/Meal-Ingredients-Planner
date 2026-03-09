import { Link } from "wouter";
import { useDemoMode } from "@/contexts/demo-context";
import { Button } from "@/components/ui/button";
import { FlaskConical, RotateCcw } from "lucide-react";

export default function DemoBanner() {
  const { reset } = useDemoMode();

  return (
    <div
      className="sticky top-0 z-[60] flex items-center justify-between gap-4 bg-amber-50 border-b border-amber-200 text-amber-900 text-sm py-2 px-4"
      data-testid="demo-banner"
    >
      <div className="flex items-center gap-2 min-w-0">
        <FlaskConical className="h-4 w-4 shrink-0" />
        <span className="truncate">
          You are viewing the THA demo. Create an account to start your own planner.
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          asChild
          size="sm"
          className="h-7 px-3 text-xs"
          data-testid="button-demo-create-account"
        >
          <Link href="/auth">Create Account</Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-3 text-xs border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
          onClick={reset}
          data-testid="button-demo-reset"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset Demo
        </Button>
      </div>
    </div>
  );
}
