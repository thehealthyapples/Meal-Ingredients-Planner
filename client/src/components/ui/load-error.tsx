// PX1-W0 — the canonical error presentation.
//
// UIA §17 names "error boundary" as a concern requiring an owner, and PX1 found
// that none existed: `retry: false` on every query, `= []` on every destructure,
// and 14 of 16 household pages with no error branch at all. A thrown query left
// `data` undefined, the `= []` default swallowed it, and the EMPTY STATE rendered.
// The household could not tell "the server is down" from "you have nothing."
//
// This component exists so that those two things can never render the same way
// again. It is a load ERROR — it says what could not be loaded, what that means
// for their data (nothing is lost), and gives one way forward (try again).
//
// Seeded from the admin precedent at admin-behaviour-workbench-page.tsx:270, which
// was the only correct error presentation in the client and was private to one
// page. That private copy is RETIRED in the same change (UIA §17): the admin
// workbench now imports this one.
//
// It never says "empty", "none yet", or "get started". An absence is a different
// thing and belongs to a different owner.

import { AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LoadErrorProps {
  /** What could not be loaded, as the household would name it: "your shopping list". */
  what: string;
  /** The one way forward. Usually a react-query `refetch`. */
  onRetry?: () => void;
  /** Extra sentence when a surface knows something more useful than the default. */
  description?: string;
  className?: string;
  "data-testid"?: string;
}

export function LoadError({
  what,
  onRetry,
  description,
  className,
  "data-testid": testId = "load-error",
}: LoadErrorProps) {
  return (
    <Card className={className} data-testid={testId}>
      <CardContent className="flex items-start gap-3 py-5">
        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-medium text-sm">We couldn't load {what}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {description ?? "Nothing has been lost — this is a problem at our end, not with your data."}
          </p>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={onRetry}
              data-testid={`${testId}-retry`}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
              Try again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default LoadError;
