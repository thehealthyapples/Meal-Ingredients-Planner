import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarDays, Search, ShoppingBasket, Loader2 } from "lucide-react";
import OrchardBackdrop from "@/components/layout/orchard-backdrop";
import ProductFlowVisual from "@/components/KitchenToBasketVisual";

const VALUE_BLOCKS = [
  {
    icon: <CalendarDays className="h-5 w-5 text-primary" />,
    title: "Plan meals",
    body: "Organise your week clearly with a structured meal plan built around your household, diet, and preferences.",
  },
  {
    icon: <Search className="h-5 w-5 text-primary" />,
    title: "Analyse ingredients",
    body: "Understand what's in your food — NOVA scores, additives, and clear health guidance shown at a glance.",
  },
  {
    icon: <ShoppingBasket className="h-5 w-5 text-primary" />,
    title: "Build smarter baskets",
    body: "Shop with confidence. Build your weekly basket from your plan and make better choices without the effort.",
  },
];

export default function HomePage() {
  const [, setLocation] = useLocation();
  const [demoStarting, setDemoStarting] = useState(false);

  const handleDemo = async () => {
    if (demoStarting) return;
    setDemoStarting(true);
    try {
      const res = await fetch("/api/demo/start", { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error();
      window.location.href = "/";
    } catch {
      setDemoStarting(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] overflow-y-auto">
      <OrchardBackdrop />

      <div className="relative z-10 bg-background/20 min-h-[100dvh] flex flex-col">

        {/* ── Nav ── */}
        <header className="flex items-center justify-between px-6 sm:px-10 py-4 border-b border-border/20 bg-background/40 backdrop-blur-md">
          <img src="/logo-long.png" alt="The Healthy Apples" className="h-9 sm:h-11" />
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
        <section className="flex-1 flex items-center px-6 sm:px-10 py-16 sm:py-24">
          <div className="w-full max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

              {/* Left: copy + CTAs */}
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80 mb-5"
                  data-testid="text-hero-brand-line"
                >
                  Confidently better choices, simply
                </p>

                <h1
                  className="text-[2.4rem] sm:text-5xl font-semibold tracking-tight text-foreground leading-[1.12] mb-6"
                  data-testid="text-hero-headline"
                >
                  Plan meals. Analyse ingredients. Build smarter baskets.
                </h1>

                <p
                  className="text-base text-muted-foreground leading-relaxed mb-8 max-w-[480px]"
                  data-testid="text-hero-body"
                >
                  The Healthy Apples helps you make better food choices with less effort by combining meal planning, ingredient analysis, and practical alternatives for everyday life.
                </p>

                <div className="flex flex-wrap gap-3 mb-4">
                  <Button
                    size="lg"
                    onClick={() => setLocation("/auth?register=1")}
                    data-testid="button-hero-create-account"
                  >
                    Create account
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    className="group hover:shadow-sm hover:-translate-y-px transition-all"
                    onClick={handleDemo}
                    disabled={demoStarting}
                    data-testid="button-hero-explore"
                  >
                    {demoStarting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Explore The Healthy Apples
                    <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </div>

                <p
                  className="text-[11px] text-muted-foreground/60 tracking-wide mb-6"
                  data-testid="text-hero-microcopy"
                >
                  Instant access &nbsp;·&nbsp; No signup &nbsp;·&nbsp; 20-minute demo
                </p>

                <p
                  className="text-[12px] text-muted-foreground/55 italic max-w-[400px] leading-relaxed"
                  data-testid="text-hero-story-line"
                >
                  Born from our family's journey through health challenges and years of learning how food choices affect everyday life.
                </p>
              </div>

              {/* Right: lifecycle visual */}
              <div className="flex justify-center lg:justify-end">
                <div
                  className="rounded-2xl border border-border/40 bg-background/65 backdrop-blur-md p-10 shadow-none"
                  data-testid="card-lifecycle-visual"
                >
                  <div style={{ transform: "scale(1.35)", transformOrigin: "center", width: 224, height: 224 }}>
                    <ProductFlowVisual />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Three value blocks ── */}
        <section className="px-6 sm:px-10 py-16 border-t border-border/20">
          <div className="max-w-6xl mx-auto">
            <div className="grid sm:grid-cols-3 gap-5">
              {VALUE_BLOCKS.map((block) => (
                <div
                  key={block.title}
                  className="rounded-xl border border-border/40 bg-background/70 backdrop-blur-md p-6"
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

        {/* ── Story section ── */}
        <section className="px-6 sm:px-10 py-16 border-t border-border/20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="rounded-2xl border border-border/30 bg-background/65 backdrop-blur-md p-10">
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
              onClick={handleDemo}
              disabled={demoStarting}
              data-testid="button-final-explore"
            >
              {demoStarting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Explore The Healthy Apples
              <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground/50">
            Instant access &nbsp;·&nbsp; No signup &nbsp;·&nbsp; 20-minute demo
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
