// The demo-session banner.
//
// ─── BUS2A WITHDREW A COMMERCIAL CLAIM FROM THIS FILE ────────────────────────
//
// It previously read "Save your progress & get 25% off your first 6 months",
// and on submission "Got it! Your 25% discount code is on its way."
//
// Every part of that was untrue. THA had no subscription, no price, no payment
// path, no six-month term, and no mechanism that generates or sends a discount
// code — `POST /api/demo/save-email` writes `users.demo_claimed_email` and does
// nothing else (server/auth.ts). It was a discount off an unstated price for a
// product that could not be bought, and it contradicted THA's own published
// Terms of Service in the same repository, which say: "The Healthy Apples does
// not currently charge for anything, and does not process payments."
//
// BUS1 found it and recorded it as out of scope, belonging to BUS2
// (BUS1_TRUST_AND_COMPLIANCE_FOUNDATION.md, Suggestion 1). This is BUS2A
// discharging it. The copy now states exactly what the button does.
//
// It is NOT replaced with a configured-price offer, because there is no
// approved pricing: `isPublishable()` in shared/commerce/plans.ts returns false
// for the whole platform, and that gate — not this comment — is what stops the
// next claim. Nothing may quote a price, saving or percentage until it passes.
//
// ─── THIS IS A DEMO SESSION, NOT A COMMERCIAL TRIAL ──────────────────────────
//
// Worth stating because the word "trial" now means two different things. This
// banner counts down `users.demo_expires_at` — a 20-minute anonymous demo whose
// data is discarded (server/storage.ts). BUS2A's `trialing` subscription status
// is an unrelated commercial concept with its own duration and lifecycle. They
// share no column, no code path and no vocabulary, and must not be merged.

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

export default function TrialBanner() {
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
        window.location.href = "/auth?trial=expired";
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
          ? "bg-secondary text-secondary-foreground"
          : "bg-primary text-primary-foreground"
      }`}
      data-testid="banner-trial-mode"
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
            Trial ending in{" "}
            <span className="font-mono" data-testid="text-trial-countdown">
              {isExpired ? "0:00" : formatCountdown(msLeft)}
            </span>
          </span>

          {submitState === "done" ? (
            <span className="flex items-center gap-1.5 font-semibold" data-testid="text-email-confirmed">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Thanks — we&apos;ve saved your email.
            </span>
          ) : (
            <>
              <span className="opacity-90 whitespace-nowrap">- Save your progress:</span>
              <form onSubmit={handleSaveEmail} className="flex items-center gap-1.5">
                <input
                  ref={inputRef}
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={submitState === "loading"}
                  className="h-7 px-2.5 rounded text-sm bg-background text-foreground placeholder:text-muted-foreground border border-border outline-none focus:ring-2 focus:ring-ring/40 disabled:opacity-60 w-44"
                  data-testid="input-trial-email"
                />
                <button
                  type="submit"
                  disabled={submitState === "loading" || !email.trim()}
                  className="h-7 px-3 rounded bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1"
                  data-testid="button-trial-claim"
                >
                  {submitState === "loading" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Save →"
                  )}
                </button>
                {submitState === "error" && (
                  <span className="text-xs text-destructive">Try again</span>
                )}
              </form>
            </>
          )}
        </div>
      ) : (
        <span className="flex-1 min-w-0">
          <span className="font-semibold">Time trial</span>
          {" - "}
          <span className="opacity-90">
            You have full access to The Healthy Apples. Changes are temporary.
          </span>
          {" "}
          <span
            className="font-mono font-bold"
            data-testid="text-trial-countdown"
          >
            Trial expires in {isExpired ? "0:00" : formatCountdown(msLeft)}.
          </span>
        </span>
      )}

      <button
        onClick={() => setDismissed(true)}
        className="ml-2 shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Dismiss trial banner"
        data-testid="button-dismiss-trial-banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
