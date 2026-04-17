import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, ScanLine, Lightbulb, TrendingUp, Loader2, ChevronDown } from "lucide-react";
import OrchardBackdrop from "@/components/layout/orchard-backdrop";
import ProductFlowVisual from "@/components/KitchenToBasketVisual";

const VALUE_BLOCKS = [
  {
    icon: <ScanLine className="h-5 w-5 text-primary" />,
    title: "Scan & Understand",
    body: "Instantly see what's in your food — no confusion.",
  },
  {
    icon: <Lightbulb className="h-5 w-5 text-primary" />,
    title: "Make Better Choices",
    body: "Clear guidance, so you can decide with confidence.",
  },
  {
    icon: <TrendingUp className="h-5 w-5 text-primary" />,
    title: "Build Better Habits",
    body: "Small changes that add up over time.",
  },
];

export default function HomePage() {
  const [, setLocation] = useLocation();
  const [trialStarting, setTrialStarting] = useState(false);
  const valueSectionRef = useRef<HTMLElement>(null);

  const handleTrial = async () => {
    if (trialStarting) return;
    setTrialStarting(true);
    try {
      const res = await fetch("/api/demo/start", { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error();
      window.location.href = "/";
    } catch {
      setTrialStarting(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] overflow-y-auto">
      <OrchardBackdrop />

      <div className="relative z-10 bg-background/20 min-h-[100dvh] flex flex-col">

        {/* ── Nav ── */}
        <header className="flex items-center justify-between px-6 sm:px-10 py-4 border-b border-border/20 bg-background/40 backdrop-blur-md">
          <img src="/logo-long.png" alt="The Healthy Apples" className="h-[72px] sm:h-[88px]" />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/auth")}
              data-testid="button-nav-signin"
            >
              Sign in
            </Button>
            <Button
              size="sm"
              onClick={() => setLocation("/auth?register=1")}
              data-testid="button-nav-create-account"
            >
              Create account
            </Button>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="flex-1 flex flex-col justify-center px-6 sm:px-10 py-16 sm:py-24">
          <div className="w-full max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

              {/* Left: copy + CTAs */}
              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.12em] text-primary/80 mb-5"
                  data-testid="text-hero-brand-line"
                >
                  Confidently better choices, simply
                </p>

                <h1
                  className="text-[2.4rem] sm:text-5xl font-semibold tracking-tight text-foreground leading-[1.12] mb-6"
                  data-testid="text-hero-headline"
                >
                  Eat better. Without overthinking it.
                </h1>

                <p
                  className="text-base text-muted-foreground leading-relaxed mb-8 max-w-[480px]"
                  data-testid="text-hero-body"
                >
                  Scan food, understand what's inside, and make confidently better choices — simply.
                </p>

                <div className="flex flex-col items-stretch sm:items-start gap-3 mb-6 w-full sm:w-auto">
                  {/* Primary CTA */}
                  <Button
                    size="lg"
                    className="h-auto py-3 px-7 flex flex-col items-center justify-center gap-0.5 w-full sm:min-w-[280px]"
                    onClick={handleTrial}
                    disabled={trialStarting}
                    data-testid="button-hero-explore"
                  >
                    {trialStarting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span className="font-semibold">Explore The Healthy Apples →</span>
                        <span className="text-xs opacity-75">Instant access · No signup · 20-minute trial</span>
                      </>
                    )}
                  </Button>
                  {/* Secondary CTA */}
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:min-w-[280px]"
                    onClick={() => setLocation("/auth?register=1")}
                    data-testid="button-hero-create-account"
                  >
                    Create account
                  </Button>
                </div>

                <p
                  className="text-[16px] text-foreground/65 italic max-w-[400px] leading-relaxed"
                  data-testid="text-hero-story-line"
                >
                  Born from our family's journey through health challenges and years of learning how food choices affect everyday life.
                </p>
              </div>

              {/* Right: lifecycle visual */}
              <div className="flex justify-center lg:justify-end">
                <div
                  className="rounded-2xl border border-border/40 bg-background/92 backdrop-blur-md p-10 shadow-none"
                  data-testid="card-lifecycle-visual"
                >
                  <div style={{ transform: "scale(1.35)", transformOrigin: "center", width: 224, height: 224 }}>
                    <ProductFlowVisual />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Scroll chevron - centered, inline with end of left copy */}
          <div className="flex justify-center mt-2">
            <button
              onClick={() => valueSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="text-foreground/40 hover:text-foreground/70 transition-colors animate-bounce"
              aria-label="Scroll to learn more"
            >
              <ChevronDown className="h-9 w-9" />
            </button>
          </div>

        </section>

        {/* ── Three value blocks ── */}
        <section ref={valueSectionRef} className="px-6 sm:px-10 py-16 border-t border-border/20">
          <div className="max-w-6xl mx-auto">
            <div className="grid sm:grid-cols-3 gap-5">
              {VALUE_BLOCKS.map((block) => (
                <div
                  key={block.title}
                  className="rounded-xl border border-border/40 bg-background/92 backdrop-blur-md p-6"
                  data-testid={`card-value-${block.title.toLowerCase().replace(/\s/g, "-")}`}
                >
                  <div className="mb-3">{block.icon}</div>
                  <h3 className="font-semibold text-foreground mb-2">{block.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{block.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Ethos strip ── */}
        <section className="px-6 sm:px-10 py-10 border-t border-border/20 text-center">
          <p
            className="text-sm text-muted-foreground/80 italic max-w-xl mx-auto leading-relaxed"
            data-testid="text-ethos-strip"
          >
            We don't believe in perfect diets or constant tracking. Just better choices, made consistently.
          </p>
        </section>

        {/* ── Story section ── */}
        <section className="px-6 sm:px-10 py-16 border-t border-border/20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="rounded-2xl border border-border/30 bg-background/92 backdrop-blur-md p-10">
              <p
                className="text-base text-foreground/80 leading-relaxed"
                data-testid="text-story-section"
              >
                The Healthy Apples was built out of a genuine need — helping a family navigate confusing food choices during a period of serious health challenges. We believe that better food knowledge should be simple, practical, and within reach for everyone.
              </p>
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="px-6 sm:px-10 py-20 border-t border-border/20 text-center">
          <h2
            className="text-3xl font-semibold tracking-tight text-foreground mb-3"
            data-testid="text-final-cta-headline"
          >
            Ready to eat better, simply?
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Join families making calmer, more confident food choices every day.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-5">
            <Button
              size="lg"
              onClick={() => setLocation("/auth?register=1")}
              data-testid="button-final-create-account"
            >
              Create account
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="group hover:shadow-sm hover:-translate-y-px transition-all"
              onClick={handleTrial}
              disabled={trialStarting}
              data-testid="button-final-explore"
            >
              {trialStarting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Explore The Healthy Apples
              <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground/50">
            Instant access &nbsp;·&nbsp; No signup &nbsp;·&nbsp; 20-minute trial
          </p>
        </section>

        {/* ── Footer ── */}
        <footer className="px-6 sm:px-10 py-6 border-t border-border/20 text-center">
          <p className="text-xs text-muted-foreground/40">
            © {new Date().getFullYear()} The Healthy Apples. All rights reserved.
          </p>
        </footer>

      </div>
    </div>
  );
}
