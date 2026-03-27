import { useEffect, useRef, useState } from "react";
import { Clock, AlertTriangle, X, CheckCircle2, Loader2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";

function formatCountdown(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function DemoBanner() {
  const { user } = useUser();
  const [msLeft, setMsLeft] = useState<number>(0);
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitState === "loading") return;
    setSubmitState("loading");
    try {
      const res = await fetch("/api/demo/save-email", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitState("done");
    } catch {
      setSubmitState("error");
    }
  };

  return (
    <div
      className={`w-full px-4 py-2.5 flex items-center gap-3 text-sm font-medium transition-colors z-50 ${
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

      {isWarning ? (
        <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="font-semibold whitespace-nowrap">
            Demo ending in{" "}
            <span className="font-mono" data-testid="text-demo-countdown">
              {isExpired ? "0:00" : formatCountdown(msLeft)}
            </span>
          </span>

          {submitState === "done" ? (
            <span className="flex items-center gap-1.5 font-semibold" data-testid="text-email-confirmed">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Got it! Your 25% discount code is on its way.
            </span>
          ) : (
            <>
              <span className="opacity-90 whitespace-nowrap">- Save your progress &amp; get 25% off your first 6 months:</span>
              <form onSubmit={handleSaveEmail} className="flex items-center gap-1.5">
                <input
                  ref={inputRef}
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={submitState === "loading"}
                  className="h-7 px-2.5 rounded text-sm bg-white/90 text-gray-900 placeholder-gray-400 border-0 outline-none focus:ring-2 focus:ring-amber-800/40 disabled:opacity-60 w-44"
                  data-testid="input-demo-email"
                />
                <button
                  type="submit"
                  disabled={submitState === "loading" || !email.trim()}
                  className="h-7 px-3 rounded bg-amber-800 text-amber-50 text-xs font-semibold hover:bg-amber-900 disabled:opacity-50 transition-colors flex items-center gap-1"
                  data-testid="button-demo-claim"
                >
                  {submitState === "loading" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Claim offer →"
                  )}
                </button>
                {submitState === "error" && (
                  <span className="text-xs text-red-800">Try again</span>
                )}
              </form>
            </>
          )}
        </div>
      ) : (
        <span className="flex-1 min-w-0">
          <span className="font-semibold">Demo account</span>
          {" - "}
          <span className="opacity-90">
            Some features are limited. Changes are temporary and not saved permanently.
          </span>
          {" "}
          <span
            className="font-mono font-bold"
            data-testid="text-demo-countdown"
          >
            Session expires in {isExpired ? "0:00" : formatCountdown(msLeft)}.
          </span>
        </span>
      )}

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
