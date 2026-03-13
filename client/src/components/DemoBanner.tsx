import { useEffect, useState } from "react";
import { Clock, AlertTriangle, X } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

function formatCountdown(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function DemoBanner() {
  const { user } = useUser();
  const [, navigate] = useLocation();
  const [msLeft, setMsLeft] = useState<number>(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user?.isDemo || !user.demoExpiresAt) return;

    const update = () => {
      const remaining = new Date(user.demoExpiresAt!).getTime() - Date.now();
      setMsLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        window.location.href = "/auth?demo=expired";
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [user?.isDemo, user?.demoExpiresAt]);

  if (!user?.isDemo || dismissed) return null;

  const isWarning = msLeft < 2 * 60 * 1000;
  const isExpired = msLeft <= 0;

  return (
    <div
      className={`w-full px-4 py-2 flex items-center gap-3 text-sm font-medium transition-colors z-50 ${
        isWarning
          ? "bg-amber-500 text-amber-950"
          : "bg-primary text-primary-foreground"
      }`}
      data-testid="banner-demo-mode"
      role="status"
      aria-live="polite"
    >
      {isWarning ? (
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
      ) : (
        <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}

      <span className="flex-1 min-w-0">
        <span className="font-semibold">Demo account</span>
        {" — "}
        <span className="opacity-90">
          Some features are limited. Changes are temporary and not saved permanently.
        </span>
        {" "}
        <span
          className={`font-mono font-bold ${isWarning ? "text-red-900" : ""}`}
          data-testid="text-demo-countdown"
        >
          Session expires in {isExpired ? "0:00" : formatCountdown(msLeft)}.
        </span>
      </span>

      <button
        onClick={() => setDismissed(true)}
        className="ml-2 shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Dismiss demo banner"
        data-testid="button-dismiss-demo-banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
