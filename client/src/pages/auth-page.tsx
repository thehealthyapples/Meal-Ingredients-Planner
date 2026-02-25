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
import { ArrowRight, Lock, UserPlus, CheckCircle2, AlertTriangle, Mail, Loader2, RefreshCw } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import FiveApplesLogo from "@/components/FiveApplesLogo";

type AppConfig = {
  registrationEnabled: boolean;
  environment: string;
};

export default function AuthPage() {
  const { login, loginError, register, registerResult, user, isLoggingIn, isRegistering } = useUser();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [lastLoginEmail, setLastLoginEmail] = useState("");
  const [resendState, setResendState] = useState<"idle" | "loading" | "sent">("idle");
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const verified = params.get("verified") === "1";
  const verifyError = params.get("verify_error");

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

  if (user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-primary overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 text-primary-foreground mb-8">
            <h1 className="text-4xl font-bold font-display tracking-tight" data-testid="text-brand-title">The Healthy Apples</h1>
            <FiveApplesLogo size={40} />
          </div>
          
          <div className="space-y-6 max-w-lg">
            <h2 className="text-5xl font-bold font-display text-white leading-tight">
              Plan your meals,<br/>
              <span className="text-secondary-foreground">Simplify your shopping.</span>
            </h2>
            <p className="text-lg text-primary-foreground/90 leading-relaxed">
              Create custom meal plans, organise your favourite recipes, and automatically analyse your basket in seconds.
            </p>
          </div>
        </div>

        <div className="relative h-64 mt-12 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
          <img 
            src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=1000" 
            alt="Fresh ingredients layout"
            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
            <p className="text-white font-medium">Start eating better today.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          {verified && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800" data-testid="banner-email-verified">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">Email verified — you can log in now.</p>
            </div>
          )}

          {verifyError && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800" data-testid="banner-verify-error">
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

          {showCheckEmail ? (
            <div className="text-center space-y-6" data-testid="panel-check-email">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight" data-testid="text-check-email-title">Check your email</h2>
                <p className="text-muted-foreground mt-2">
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
              <Button
                variant="ghost"
                onClick={() => window.location.reload()}
                className="mt-2"
                data-testid="button-back-to-login"
              >
                Back to login
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center lg:text-left mb-8">
                {isBeta && (
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs">
                      <Lock className="h-3 w-3 mr-1" />
                      Private Beta
                    </Badge>
                  </div>
                )}
                <h2 className="text-2xl font-bold tracking-tight" data-testid="text-auth-title">
                  {mode === "login" ? "Welcome back" : "Create your account"}
                </h2>
                <p className="text-muted-foreground mt-2" data-testid="text-auth-subtitle">
                  {mode === "login"
                    ? isBeta
                      ? "Sign in with your beta account to access The Healthy Apples."
                      : "Sign in to access The Healthy Apples."
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
                    submitLabel="Sign In"
                    isSubmitting={isLoggingIn}
                    testIdPrefix="login"
                  />
                  {needsEmailVerification && (
                    <div className="mt-4 p-4 rounded-lg bg-amber-50 border border-amber-200" data-testid="panel-needs-verification">
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
                <div className="text-center pt-4 border-t">
                  {mode === "login" ? (
                    <p className="text-sm text-muted-foreground" data-testid="text-switch-to-register">
                      Don't have an account?{" "}
                      <button
                        onClick={() => setMode("register")}
                        className="text-primary font-medium hover:underline"
                        data-testid="button-switch-register"
                      >
                        Create one
                      </button>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground" data-testid="text-switch-to-login">
                      Already have an account?{" "}
                      <button
                        onClick={() => setMode("login")}
                        className="text-primary font-medium hover:underline"
                        data-testid="button-switch-login"
                      >
                        Sign in
                      </button>
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-muted-foreground" data-testid="text-beta-notice">
                    This app is in private beta. To request access, please contact the team.
                  </p>
                </div>
              )}
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" className="h-12 bg-white/50" {...field} data-testid={`input-${testIdPrefix}-username`} />
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={isRegister ? "Create a password (min 6 characters)" : "Enter your password"} className="h-12 bg-white/50" {...field} data-testid={`input-${testIdPrefix}-password`} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20"
              disabled={isSubmitting}
              data-testid={`button-${testIdPrefix}-submit`}
            >
              {isRegister ? (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {submitLabel}
                </>
              ) : (
                <>
                  {submitLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
