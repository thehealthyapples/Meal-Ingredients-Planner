import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Lock, UserPlus, CheckCircle2, AlertTriangle, Mail,
  Loader2, RefreshCw, KeyRound, Play, CalendarDays, Search, ShoppingBasket,
} from "lucide-react";
import { useLocation, useSearch } from "wouter";
import KitchenToBasketVisual from "@/components/KitchenToBasketVisual";
import transparentAppleUrl from "@assets/new_single_apple_transparent_1772836544576.png";
import brandLogoUrl from "@assets/thehealthy_apples_transparent_logo__1773438557183.png";

type AppConfig = {
  registrationEnabled: boolean;
  environment: string;
  supportEmail?: string;
  suggestionsEmail?: string;
};

type AuthMode = "login" | "register" | "forgot" | "reset" | "resend";

const FEATURE_CARDS = [
  {
    icon: <CalendarDays className="h-4 w-4" />,
    title: "Plan clearly",
    desc: "Organise your week with a calm, structured meal plan that actually works.",
  },
  {
    icon: <Search className="h-4 w-4" />,
    title: "Analyse simply",
    desc: "Understand ingredients, additives, and nutrition at a glance.",
  },
  {
    icon: <ShoppingBasket className="h-4 w-4" />,
    title: "Shop intentionally",
    desc: "Build a smarter basket without second-guessing every choice.",
  },
];

export default function AuthPage() {
  const { login, loginError, register, registerResult, user, isLoggingIn, isRegistering } = useUser();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<AuthMode>("login");
  const [lastLoginEmail, setLastLoginEmail] = useState("");
  const [resendState, setResendState] = useState<"idle" | "loading" | "sent">("idle");

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotState, setForgotState] = useState<"idle" | "loading" | "sent">("idle");

  const [resendEmail, setResendEmail] = useState("");
  const [standaloneResendState, setStandaloneResendState] = useState<"idle" | "loading" | "sent">("idle");

  const [resetToken, setResetToken] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetState, setResetState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [resetError, setResetError] = useState("");

  const [demoStarting, setDemoStarting] = useState(false);

  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const verified = params.get("verified") === "1";
  const verifyError = params.get("verify_error");
  const resetTokenParam = params.get("reset_token");
  const demoExpired = params.get("demo") === "expired";
  const forceRegister = params.get("register") === "1";

  useEffect(() => {
    if (resetTokenParam) {
      setResetToken(resetTokenParam);
      setMode("reset");
    } else if (forceRegister) {
      setMode("register");
    }
  }, [resetTokenParam, forceRegister]);

  const handleDemoStart = async () => {
    if (demoStarting) return;
    setDemoStarting(true);
    try {
      const res = await fetch("/api/demo/start", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to start demo");
      window.location.href = "/";
    } catch {
      setDemoStarting(false);
    }
  };

  const handleExploreBeta = () => {
    const el = document.querySelector<HTMLInputElement>('[data-testid="input-login-username"]');
    el?.focus();
  };

  const { data: config } = useQuery<AppConfig>({
    queryKey: ["/api/config"],
    queryFn: async () => {
      const res = await fetch("/api/config");
      if (!res.ok) return { registrationEnabled: false, environment: "beta" };
      return res.json();
    },
  });

  const registrationEnabled = config?.registrationEnabled ?? false;
  const isBeta = !registrationEnabled;

  const showCheckEmail = registerResult?.needsVerification === true;
  const needsEmailVerification = loginError?.message?.toLowerCase().includes("verify your email");

  const handleResend = async (email: string) => {
    if (!email || resendState === "loading") return;
    setResendState("loading");
    try {
      await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      setResendState("sent");
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || forgotState === "loading") return;
    setForgotState("loading");
    try {
      await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: forgotEmail.trim() }),
      });
    } finally {
      setForgotState("sent");
    }
  };

  const handleStandaloneResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim() || standaloneResendState === "loading") return;
    setStandaloneResendState("loading");
    try {
      await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail.trim() }),
      });
    } finally {
      setStandaloneResendState("sent");
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    if (resetNewPassword !== resetConfirmPassword) {
      setResetError("Passwords don't match.");
      return;
    }
    if (resetNewPassword.length < 6) {
      setResetError("Password must be at least 6 characters.");
      return;
    }
    setResetState("loading");
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, newPassword: resetNewPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetError(data.message || "Something went wrong.");
        setResetState("error");
      } else {
        setResetState("success");
        setTimeout(() => {
          setMode("login");
          setResetState("idle");
          setResetNewPassword("");
          setResetConfirmPassword("");
        }, 2000);
      }
    } catch {
      setResetError("Something went wrong. Please try again.");
      setResetState("error");
    }
  };

  useEffect(() => {
    if (user) setLocation("/");
  }, [user, setLocation]);

  if (user) return null;

  return (
    <div className="min-h-screen lg:h-screen grid lg:grid-cols-2 bg-background overflow-hidden">

      {/* ── LEFT PANEL ── */}
      <div className="relative hidden lg:flex flex-col p-10 bg-background overflow-y-auto">
        <img
          src={transparentAppleUrl}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute top-1/2 right-6 -translate-y-1/2 w-80 h-80 object-contain opacity-[0.035] pointer-events-none select-none"
          data-testid="img-apple-watermark-hero"
        />

        <div className="relative z-10 flex flex-col h-full">

          {/* Logo */}
          <div className="mb-6 -ml-2">
            <img
              src={brandLogoUrl}
              alt="The Healthy Apples — Confidently Choose Better, Simply"
              className="h-36 w-auto object-contain"
              draggable={false}
              data-testid="img-brand-logo"
            />
          </div>

          {/* Headline + copy */}
          <div className="max-w-lg mb-7">
            <h1
              className="text-[2rem] font-bold font-display text-foreground leading-[1.2] mb-3"
              data-testid="text-hero-headline"
            >
              Plan meals. Analyse ingredients.<br />
              <span className="text-primary">Build smarter baskets.</span>
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md" data-testid="text-hero-sub-copy">
              A calmer way to review your meals, understand every ingredient, and make more confident grocery choices — with far less effort.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={handleDemoStart}
              disabled={demoStarting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold shadow-md shadow-primary/20 hover:bg-primary/90 transition-colors disabled:opacity-60"
              data-testid="button-watch-demo"
            >
              {demoStarting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4 fill-current" />
              )}
              {demoStarting ? "Starting…" : "Watch the demo"}
            </button>

            <button
              onClick={handleExploreBeta}
              className="inline-flex items-center gap-1.5 px-5 py-3 border border-border rounded-xl text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-accent transition-colors"
              data-testid="button-explore-beta"
            >
              Explore the beta
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {FEATURE_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-border/60 bg-white/60 p-4 space-y-2"
              >
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {card.icon}
                </div>
                <p className="text-sm font-semibold text-foreground">{card.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

          {/* Flow visual */}
          <div className="mt-auto">
            <KitchenToBasketVisual />
          </div>

        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex items-center justify-center p-6 lg:p-10 bg-accent overflow-y-auto">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 space-y-5">

          {/* Status banners */}
          {demoExpired && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800" data-testid="banner-demo-expired">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">Your demo session has ended. Create an account to save your progress and continue.</p>
            </div>
          )}
          {verified && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800" data-testid="banner-email-verified">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">Email verified — you can log in now.</p>
            </div>
          )}
          {verifyError && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800" data-testid="banner-verify-error">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">
                {verifyError === "expired"
                  ? "Verification link has expired. Please register again."
                  : verifyError === "invalid"
                  ? "Invalid verification link. Please check your email or register again."
                  : "Something went wrong. Please try again."}
              </p>
            </div>
          )}

          {/* ── STATES ── */}
          {showCheckEmail ? (
            <div className="text-center space-y-6" data-testid="panel-check-email">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight font-display" data-testid="text-check-email-title">Check your email</h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  We've sent a verification link to your email address. Please click the link to verify your account before logging in.
                </p>
              </div>
              {resendState === "sent" ? (
                <div className="flex items-center justify-center gap-2 text-sm text-primary font-medium" data-testid="text-resend-sent">
                  <CheckCircle2 className="h-4 w-4" />
                  Email resent — check your inbox
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => handleResend(registerResult?.email || lastLoginEmail)}
                  disabled={resendState === "loading"}
                  className="gap-2"
                  data-testid="button-resend-verification"
                >
                  {resendState === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Resend verification email
                </Button>
              )}
              <Button variant="ghost" onClick={() => window.location.reload()} className="mt-2" data-testid="button-back-to-login">
                Back to login
              </Button>
            </div>

          ) : mode === "forgot" ? (
            <div className="space-y-6" data-testid="panel-forgot-password">
              <div>
                <h2 className="text-2xl font-bold font-display tracking-tight">Forgot your password?</h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>
              {forgotState === "sent" ? (
                <div className="flex flex-col items-center gap-4 py-6 text-center" data-testid="panel-forgot-sent">
                  <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-7 w-7 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Check your inbox — if your email is registered, a reset link is on its way.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" htmlFor="forgot-email">Email address</label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="you@example.com"
                      className="h-12"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      required
                      data-testid="input-forgot-email"
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={forgotState === "loading"} data-testid="button-send-reset">
                    {forgotState === "loading" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                    Send Reset Link
                  </Button>
                </form>
              )}
              <div className="text-center pt-2">
                <button onClick={() => { setMode("login"); setForgotState("idle"); setForgotEmail(""); }} className="text-sm text-primary font-medium hover:underline" data-testid="link-back-to-login">
                  Back to sign in
                </button>
              </div>
            </div>

          ) : mode === "resend" ? (
            <div className="space-y-6" data-testid="panel-resend-verification">
              <div>
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-2xl font-bold font-display tracking-tight">Resend verification email</h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  Enter your email and we'll send you a new verification link.
                </p>
              </div>
              {standaloneResendState === "sent" ? (
                <div className="flex flex-col items-center gap-4 py-6 text-center" data-testid="panel-resend-sent">
                  <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-7 w-7 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Verification email sent — please check your inbox.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleStandaloneResend} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" htmlFor="resend-email">Email address</label>
                    <Input
                      id="resend-email"
                      type="email"
                      placeholder="you@example.com"
                      className="h-12"
                      value={resendEmail}
                      onChange={e => setResendEmail(e.target.value)}
                      required
                      data-testid="input-resend-email"
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={standaloneResendState === "loading"} data-testid="button-send-verification-link">
                    {standaloneResendState === "loading" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                    Send verification link
                  </Button>
                </form>
              )}
              <div className="text-center pt-2">
                <button onClick={() => { setMode("login"); setStandaloneResendState("idle"); setResendEmail(""); }} className="text-sm text-primary font-medium hover:underline" data-testid="link-back-to-login-resend">
                  Back to sign in
                </button>
              </div>
            </div>

          ) : mode === "reset" ? (
            <div className="space-y-6" data-testid="panel-reset-password">
              <div>
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <KeyRound className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-2xl font-bold font-display tracking-tight">Set a new password</h2>
                <p className="text-muted-foreground mt-2 text-sm">Choose a strong password with at least 6 characters.</p>
              </div>
              {resetState === "success" ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800" data-testid="banner-reset-success">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm font-medium">Password updated! Redirecting to login…</p>
                </div>
              ) : (
                <form onSubmit={handleResetSubmit} className="space-y-4">
                  {resetError && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700" data-testid="banner-reset-error">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <p className="text-sm">{resetError}</p>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" htmlFor="reset-new-password">New password</label>
                    <Input id="reset-new-password" type="password" placeholder="At least 6 characters" className="h-12" value={resetNewPassword} onChange={e => setResetNewPassword(e.target.value)} required data-testid="input-new-password" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" htmlFor="reset-confirm-password">Confirm new password</label>
                    <Input id="reset-confirm-password" type="password" placeholder="Repeat your new password" className="h-12" value={resetConfirmPassword} onChange={e => setResetConfirmPassword(e.target.value)} required data-testid="input-confirm-password" />
                  </div>
                  <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={resetState === "loading"} data-testid="button-reset-password">
                    {resetState === "loading" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Update Password
                  </Button>
                </form>
              )}
              <div className="text-center pt-2">
                <button onClick={() => { setMode("login"); setResetState("idle"); setResetError(""); }} className="text-sm text-primary font-medium hover:underline" data-testid="link-back-to-login-from-reset">
                  Back to sign in
                </button>
              </div>
            </div>

          ) : (
            <>
              {/* Login / Register header */}
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-4">
                  {isBeta && (
                    <Badge variant="secondary" className="text-xs gap-1.5 px-2.5 py-1 bg-accent border-0 text-foreground/60 font-medium">
                      <Lock className="h-3 w-3" />
                      Private Beta
                    </Badge>
                  )}
                </div>
                <h2
                  className="text-2xl font-bold font-display text-foreground leading-snug"
                  data-testid="text-auth-title"
                >
                  {mode === "login"
                    ? "Really good to see you again."
                    : "Create your account"}
                </h2>
                <p className="text-muted-foreground mt-1.5 text-sm" data-testid="text-auth-subtitle">
                  {mode === "login"
                    ? "Let's get you in and review some meals."
                    : "Sign up to start planning healthier meals."}
                </p>
              </div>

              {mode === "login" ? (
                <>
                  <AuthForm
                    onSubmit={(data) => {
                      setLastLoginEmail(data.username);
                      setResendState("idle");
                      login(data);
                    }}
                    submitLabel="Sign in"
                    isSubmitting={isLoggingIn}
                    testIdPrefix="login"
                  />
                  <div className="space-y-1.5">
                    <div className="text-center">
                      <button
                        onClick={() => setMode("forgot")}
                        className="text-sm text-muted-foreground hover:text-primary hover:underline transition-colors"
                        data-testid="link-forgot-password"
                      >
                        Forgot your password?
                      </button>
                    </div>
                    {registrationEnabled && (
                      <div className="text-center">
                        <button
                          onClick={() => { setMode("resend"); setStandaloneResendState("idle"); setResendEmail(""); }}
                          className="text-sm text-muted-foreground hover:text-primary hover:underline transition-colors"
                          data-testid="link-resend-verification"
                        >
                          Didn't receive your verification email?
                        </button>
                      </div>
                    )}
                  </div>
                  {needsEmailVerification && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200" data-testid="panel-needs-verification">
                      <p className="text-sm text-amber-800 font-medium mb-3">
                        Your email address hasn't been verified yet. Check your inbox for the verification link, or request a new one.
                      </p>
                      {resendState === "sent" ? (
                        <div className="flex items-center gap-2 text-sm text-primary font-medium" data-testid="text-resend-sent-login">
                          <CheckCircle2 className="h-4 w-4" />
                          Verification email sent — check your inbox
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResend(lastLoginEmail)}
                          disabled={resendState === "loading"}
                          className="gap-2 w-full"
                          data-testid="button-resend-login"
                        >
                          {resendState === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                          Resend verification email
                        </Button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <AuthForm
                  onSubmit={(data) => {
                    setLastLoginEmail(data.username);
                    register(data);
                  }}
                  submitLabel="Create Account"
                  isSubmitting={isRegistering}
                  testIdPrefix="register"
                  isRegister
                />
              )}

              {registrationEnabled ? (
                <div className="text-center pt-3 border-t border-border/50">
                  {mode === "login" ? (
                    <p className="text-sm text-muted-foreground" data-testid="text-switch-to-register">
                      Don't have an account?{" "}
                      <button onClick={() => setMode("register")} className="text-primary font-medium hover:underline" data-testid="button-switch-register">
                        Create one
                      </button>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground" data-testid="text-switch-to-login">
                      Already have an account?{" "}
                      <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline" data-testid="button-switch-login">
                        Sign in
                      </button>
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground" data-testid="text-beta-notice">
                    This app is in private beta. To request access, please contact the team.
                  </p>
                </div>
              )}

              {/* Trust line */}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                <Lock className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                <p className="text-xs text-muted-foreground/50">Secure login. Your data stays private.</p>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}

function AuthForm({ onSubmit, submitLabel, isSubmitting, testIdPrefix, isRegister }: {
  onSubmit: (data: InsertUser) => void;
  submitLabel: string;
  isSubmitting: boolean;
  testIdPrefix: string;
  isRegister?: boolean;
}) {
  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: { username: "", password: "" },
  });

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground/80">Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="you@example.com"
                      className="h-12 bg-background/50 border-border/70 focus-visible:ring-primary/30"
                      {...field}
                      data-testid={`input-${testIdPrefix}-username`}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground/80">Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={isRegister ? "Create a password (min 6 characters)" : "Enter your password"}
                      className="h-12 bg-background/50 border-border/70 focus-visible:ring-primary/30"
                      {...field}
                      data-testid={`input-${testIdPrefix}-password`}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold shadow-sm shadow-primary/15 mt-1"
              disabled={isSubmitting}
              data-testid={`button-${testIdPrefix}-submit`}
            >
              {isRegister ? (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : submitLabel}
                </>
              ) : (
                <>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {submitLabel}
                  {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
