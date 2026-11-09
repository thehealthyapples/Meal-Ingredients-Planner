// ARRIVAL1 — The Arrival Experience (DEVELOPMENT-ONLY PROTOTYPE).
//
// ─────────────────────────────────────────────────────────────────────────────
// THIS IS NOT A SECOND HOME, AND NOT A SPLASH SCREEN. It is a proposal about how
// it should FEEL to arrive at The Healthy Apples — walking gently through the
// orchard before stepping into a calm workspace — in a form you can look at
// instead of imagine.
//
// The live Home (`home-experience-page.tsx`, `/home`) is untouched by this file
// and does not import it. This page is routed ONLY under `import.meta.env.DEV`
// (App.tsx), so it does not exist in a production bundle and no household can
// reach it.
//
// It is, deliberately, a temporary rival to a canonical surface — exactly the
// "authored-but-unadopted successor sitting live-looking in the tree" the
// adoption register exists to make impossible to hide (UIA §17). Its disposition
// is binary and has no third option:
//
//     ADOPT  → fold the arrival into home-experience-page.tsx, DELETE this file.
//     REJECT → DELETE this file.
//
// A prototype that survives its own decision has become the thing it was built to
// prevent.
// ─────────────────────────────────────────────────────────────────────────────
//
// WHAT IT OWNS: nothing. No data, no business state, no conversation state.
//   • Every value is read from the SAME query keys as the live Home, so this page
//     shares its react-query cache entries and fetches nothing extra.
//   • Every element is the canonical owner — Card, Button, Skeleton, LoadError,
//     MealCard, WorkspaceHeader. It re-implements none of them.
//   • The Companion is the ONE FloatingAssistant, mounted by ProtectedRoute. This
//     page does not render one; it only asks the existing one to hold its entrance
//     (`useWithholdCompanion`) until the workspace is reached, and hands the
//     invitation back on unmount. It never ANIMATES the Companion.
//
// THE DIFFERENCE FROM UXHOME1, which this replaces: UXHOME1 animated the Home page
// itself — its cards revealed in sequence. This does not animate a page. It stages
// an ARRIVAL: a calm cream field, a handwritten hello, the orchard emerging, the
// standard header, then a single quiet downward glide that carries you INTO the
// workspace. The workspace at the end is ordinary, still, and fits one viewport —
// the arrival is the thing; the dashboard is simply where you land.

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import type { FullWeek } from "@/lib/planner-types";
import { api } from "@shared/routes";
import { useUser } from "@/hooks/use-user";
import { useMealsSummary } from "@/hooks/use-meals-summary";
import { useCompanionNotices } from "@/hooks/use-companion-notices";
import { useWithholdCompanion } from "@/components/conversation/companion-context";
import { prefersReducedMotion } from "@/lib/companion-delight";
import { WorkspaceHeader } from "@/components/workspace-header";
import { MealCard } from "@/components/MealCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadError } from "@/components/ui/load-error";
import { CalendarDays, ShoppingCart, Leaf, ArrowRight, Bell } from "lucide-react";

// ── The arrival, in seconds ─────────────────────────────────────────────────
//
// One rule governs every number: MOTION DIRECTS ATTENTION; IT NEVER GATES USE.
// Nothing below is a loading step — every surface is in the DOM and interactive
// from the first frame. The sequence is choreography, not a queue, and the
// household can scroll, click, or ignore it at any instant. It is also, by
// design, barely perceptible: soft opacity and a slow glide, no travel that
// bounces, no easing that shows off. You should not notice the animation; you
// should notice that arriving felt pleasant.
//
// The welcome LINGERS. "Welcome home" and the name are held, fully readable, for
// a real beat before anything moves — a person must have time to notice and read
// the greeting, not glimpse it. It never vanishes abruptly: once the household
// has had that beat, the greeting fades slowly AS the orchard and workspace
// become dominant, rather than cutting away.
const T = {
  signature: 0.6,        // the hand begins to write "Welcome home"
  name: 1.5,             // the household's name settles beneath it
  // — a breathing hold here: the greeting stays whole and readable —
  orchard: 3.9,          // the cream lifts; the orchard AND the standard header emerge
  orchardDur: 1.8,       //   together, with no zoom, no parallax, no reflow
  greetingFade: 4.5,     // the greeting begins a SLOW fade as the orchard takes over
  greetingFadeDur: 1.7,  //   long and gentle — the words recede, they never blink out
  sheen: 6.0,            // once the header + long logo are in place, one soft sunrise sheen
  sheenDur: 1.15,        //   a single left-to-right pass, morning light catching the mark
  drift: 6.8,            // a single, gentle downward glide carries you into the workspace
  driftDur: 1700,        // ms — slow enough to feel like descending, not scrolling
} as const;

type Arrival = "full" | "none";

/** Resolves ONCE per mount — the arrival must not change under the household mid-sequence. */
function useArrival(): Arrival {
  const [arrival] = useState<Arrival>(() => {
    // Reduced motion is a guarantee, not a variant (UIA §11): the finished
    // workspace, immediately, with no cream field, no writing, no glide. It is
    // the ABSENCE of an arrival — the only honest response to that preference.
    if (prefersReducedMotion()) return "none";
    // A return within the same session is navigation, not a first impression;
    // greeting it again would turn a welcome into a toll. The full arrival is
    // shown once per session — and tomorrow THA says hello again.
    try {
      if (sessionStorage.getItem(ARRIVAL_KEY)) return "none";
      sessionStorage.setItem(ARRIVAL_KEY, "1");
      return "full";
    } catch {
      return "none";
    }
  });
  return arrival;
}

const ARRIVAL_KEY = "tha:arrival-seen";

// ── The signature webfont ───────────────────────────────────────────────────
//
// Loaded HERE, not in index.css, and that is the whole reason production pays
// nothing for it: until a household-facing surface adopts the signature voice,
// no household downloads a font for a page only a developer can open. The TOKEN
// (`--font-signature`) lives in index.css where §16 requires it. On adoption,
// add Caveat to the @import there and delete this hook.
function useSignatureFont(): void {
  useEffect(() => {
    const HREF = "https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&display=swap";
    if (document.querySelector(`link[href="${HREF}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = HREF;
    document.head.appendChild(link);
  }, []);
}

// ── The gentle downward glide ────────────────────────────────────────────────
//
// NOT scroll-jacking. Scroll-jacking captures the wheel and rations the page out
// by gesture; this never touches a wheel or touch event. It is a ONE-TIME,
// self-easing scroll of the shell's own scroll container — the same container the
// household drives by hand the rest of the time — and it yields the instant the
// household takes over. If they have already scrolled, it never starts.
function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const oy = getComputedStyle(node).overflowY;
    if ((oy === "auto" || oy === "scroll") && node.scrollHeight > node.clientHeight) return node;
    node = node.parentElement;
  }
  return null;
}

/** easeOutCubic — a calm deceleration into place. No overshoot, no bounce. */
const easeOutCubic = (p: number): number => 1 - Math.pow(1 - p, 3);

// ── Locating the long THA logo for the sunrise sheen ─────────────────────────
//
// The sheen runs across the CANONICAL header's long logo — it does NOT own or
// modify the header (WorkspaceHeader is the one owner; this page must not fork
// it). So it locates the logo already in the DOM and lays a masked light over
// it. The query is scoped to the canonical header (`[data-testid="workspace-
// header"]`) so no other `/logo-long.png` on the shell can be picked, and it
// returns the VISIBLE one — the desktop and mobile headers both render a logo,
// but only one is displayed at a time (the other measures 0×0).
function measureLogoRect(): DOMRect | null {
  const header = document.querySelector('[data-testid="workspace-header"]');
  if (!header) return null;
  const logos = header.querySelectorAll('img[src="/logo-long.png"]');
  for (const logo of Array.from(logos)) {
    const rect = (logo as HTMLElement).getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return rect;
  }
  return null;
}

// ── Data (shared caches — identical keys to the live Home) ───────────────────

const ACTIVE_WEEK_KEY = "planner:active-week";
const WEEKLY_PLANT_TARGET = 30;

function loadActiveWeek(): number {
  try {
    const raw = localStorage.getItem(ACTIVE_WEEK_KEY);
    if (!raw) return 1;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "string" && /^[1-9]\d*$/.test(parsed)) return Number(parsed);
  } catch {
    /* fall through to default */
  }
  return 1;
}

interface HomeIntelligenceData {
  weeklyProgress: { plantCount: number; mealsPlanned: number; daysWithMeals: number } | null;
}

interface TodayMeal {
  id: string;
  name: string;
  mealType: string | null;
  imageUrl: string | null;
}

function firstNameOf(user: ReturnType<typeof useUser>["user"]): string | null {
  const raw = user?.firstName || user?.displayName || user?.username || null;
  if (!raw) return null;
  return raw.split("@")[0] || null;
}

function todayLabel(): string {
  try {
    return new Date().toLocaleDateString(undefined, {
      weekday: "long", day: "numeric", month: "long",
    });
  } catch {
    return "";
  }
}

export default function ArrivalExperiencePage() {
  const { user } = useUser();
  const arrival = useArrival();
  const isFull = arrival === "full";
  useSignatureFont();

  // `settled` releases the Companion once the glide has landed. The header is
  // NOT gated — it is mounted from the first frame and simply hidden beneath the
  // cream scrim, so that when the cream lifts the header is already in place and
  // nothing reflows. (Mounting it late would shift the whole workspace down the
  // instant it appeared — the opposite of "barely noticed".)
  const [settled, setSettled] = useState(!isFull);
  const workspaceRef = useRef<HTMLDivElement | null>(null);

  // The single sunrise sheen across the long THA logo. `sheenOn` flips true ONCE,
  // after the canonical header is fully visible, and stays true — the sweep is a
  // one-shot framer animation that ends with the light parked off the mark, so
  // nothing lingers, pulses or repeats. Reduced motion / return never mount it
  // (isFull is false), so those visitors see the finished logo with no sheen.
  const [logoRect, setLogoRect] = useState<DOMRect | null>(null);
  const [sheenOn, setSheenOn] = useState(false);

  useWithholdCompanion(!settled);

  // ── Size each scene to the shell's own scroll viewport ──────────────────────
  // The scroll container is the shared <main> (height = viewport − header −
  // bottom nav). Measuring it lets each scene fill EXACTLY that area, so the
  // workspace lands as one honest viewport with no stray scroll — rather than
  // guessing with `100dvh` and overshooting by the chrome.
  const [sceneH, setSceneH] = useState<number | null>(null);
  useEffect(() => {
    const measure = () => {
      const container = findScrollParent(workspaceRef.current);
      if (container) setSceneH(container.clientHeight);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // ── The sunrise sheen — measure the logo, keep it aligned, fire once ────────
  // The masked light is a fixed overlay pinned to the logo's viewport box. The
  // logo sits in the sticky header, so it does not move under the glide — but it
  // DOES move on resize/orientation change, so we re-measure there. We measure
  // again at the moment of firing, because the logo's width is only known once
  // its image has loaded (w-auto follows the natural aspect ratio).
  useEffect(() => {
    if (!isFull) return;
    const remeasure = () => setLogoRect(measureLogoRect());
    remeasure();
    window.addEventListener("resize", remeasure);
    const fire = window.setTimeout(() => {
      setLogoRect(measureLogoRect());
      setSheenOn(true);
    }, T.sheen * 1000);
    return () => {
      window.removeEventListener("resize", remeasure);
      clearTimeout(fire);
    };
  }, [isFull]);

  useEffect(() => {
    if (!isFull) return;
    // The glide. Only if the household has not already taken the wheel.
    let userTook = false;
    let cancelDrift: (() => void) | null = null;
    const yieldToUser = () => {
      userTook = true;
      cancelDrift?.();
      setSettled(true);
    };
    window.addEventListener("wheel", yieldToUser, { passive: true, once: true });
    window.addEventListener("touchstart", yieldToUser, { passive: true, once: true });
    window.addEventListener("keydown", yieldToUser, { once: true });

    const driftTimer = window.setTimeout(() => {
      if (userTook) return;
      const container = findScrollParent(workspaceRef.current);
      const target = workspaceRef.current;
      if (!container || !target) { setSettled(true); return; }
      const cRect = container.getBoundingClientRect();
      const tRect = target.getBoundingClientRect();
      const from = container.scrollTop;
      const to = from + (tRect.top - cRect.top); // workspace top, in the container's scroll space
      const dist = to - from;
      if (Math.abs(dist) < 4) { setSettled(true); return; }
      const t0 = performance.now();
      let raf = 0;
      const step = (now: number) => {
        if (userTook) return;
        const p = Math.min(1, (now - t0) / T.driftDur);
        container.scrollTop = from + dist * easeOutCubic(p);
        if (p < 1) raf = requestAnimationFrame(step);
        else setSettled(true);
      };
      raf = requestAnimationFrame(step);
      cancelDrift = () => cancelAnimationFrame(raf);
    }, T.drift * 1000);

    return () => {
      clearTimeout(driftTimer);
      cancelDrift?.();
      window.removeEventListener("wheel", yieldToUser);
      window.removeEventListener("touchstart", yieldToUser);
      window.removeEventListener("keydown", yieldToUser);
    };
  }, [isFull]);

  // ── Data — same keys, same cache, as the live Home ─────────────────────────
  const activeWeek = loadActiveWeek();
  const plannerQuery = useQuery<FullWeek[]>({ queryKey: ["/api/planner/full"], enabled: !!user });
  const mealsQuery = useMealsSummary();
  const shoppingQuery = useQuery<any[]>({ queryKey: [api.shoppingList.list.path], enabled: !!user });
  const homeIntelQuery = useQuery<HomeIntelligenceData>({
    queryKey: ["/api/home/intelligence"],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
  const { data: noticesData } = useCompanionNotices(!!user);

  const fullPlanner = plannerQuery.data ?? [];
  const mealsList = mealsQuery.meals ?? [];
  const shoppingItems = shoppingQuery.data ?? [];
  const homeIntel = homeIntelQuery.data;

  const mealsWaiting = plannerQuery.isLoading || mealsQuery.isLoading;
  const mealsBroken = plannerQuery.isError || mealsQuery.isError;
  const retryTodaysMeals = () => { plannerQuery.refetch(); mealsQuery.refetch(); };

  const todaysMeals = useMemo<TodayMeal[]>(() => {
    const week = fullPlanner.find((w) => w.weekNumber === activeWeek);
    if (!week) return [];
    const todayDow = new Date().getDay();
    const day = week.days.find((d) => d.dayOfWeek === todayDow);
    if (!day) return [];
    const mealById = new Map(mealsList.map((m) => [m.id, m]));
    const out: TodayMeal[] = [];
    for (const entry of day.entries) {
      const meal = mealById.get(entry.mealId);
      if (!meal) continue;
      out.push({
        id: String(entry.id),
        name: meal.name,
        mealType: entry.mealType ?? null,
        imageUrl: meal.imageUrl ?? null,
      });
    }
    return out;
  }, [fullPlanner, mealsList, activeWeek]);

  const openShoppingCount = shoppingItems.filter((i: any) => !i.checked).length;
  const plantCount = homeIntel?.weeklyProgress?.plantCount ?? 0;
  const plantPct = Math.min(100, Math.round((plantCount / WEEKLY_PLANT_TARGET) * 100));
  // ONE household reminder — the single most relevant, never a feed (EXP §7).
  const reminder = (noticesData?.notices ?? [])[0] ?? null;
  const name = firstNameOf(user);

  // The one primary action. Its LABEL follows the truth of today — "Plan today"
  // when nothing is planned promises something different from "Open today's plan"
  // when three meals are, and a button that said the same in both would be lying
  // in one of them.
  const primaryLabel = todaysMeals.length === 0 ? "Plan today" : "Open today's plan";

  return (
    <div data-testid="arrival-experience" data-arrival={arrival}>
      {/* The standard THA header — never a bespoke one. It portals to the shared
          top slot, so it appears exactly as on every other page in the product.
          Mounted from the first frame and simply hidden under the cream field; it
          emerges as the cream lifts, already in place, so nothing reflows. */}
      <WorkspaceHeader realm="home" title="Home" wide titleTestId="text-home-title" />

      {/* ── The cream field, lifting to reveal the orchard ──────────────────────
          A scrim laid over the shared OrchardBackdrop and then taken away: the
          scene begins as calm cream with nothing in it, and the orchard simply
          emerges — no zoom, no parallax, no focus pull. It ends at nothing, which
          is the only ending that leaves the workspace identical to the rest of the
          product. Reduced motion / return: never rendered, so the orchard is
          simply already there. */}
      {isFull && (
        <motion.div
          aria-hidden
          // z above the sticky header (40), the bottom nav (50) and the Companion
          // FAB (40) — so "nothing else visible" is literally true: the cream
          // covers the whole shell, and the header and nav emerge WITH the orchard
          // as it lifts, rather than sitting on top of the welcome.
          className="pointer-events-none fixed inset-0 z-[60] bg-background"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: T.orchardDur, delay: T.orchard, ease: [0.4, 0, 0.2, 1] }}
        />
      )}

      {/* ── The sunrise sheen — ONE soft pass of morning light across the long
          THA logo, once the canonical header has settled into view ──────────────
          Not a glow, not a pulse, not an edge. A single left-to-right highlight
          that crosses the mark the way early sun catches a sign, then is gone. It
          is MASKED to the logo's own shape (`mask-image: /logo-long.png`), so the
          light runs across the mark itself rather than a rectangle around it; it
          is pinned to the logo's live viewport box, and the logo is in the sticky
          header, so the glide never drags it out of place. It plays exactly once
          per full arrival (the sweep is a one-shot that parks the light off the
          mark) and is never mounted for reduced-motion or a returning visitor —
          they see the finished logo, immediately, with no sheen. */}
      {isFull && sheenOn && logoRect && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[62] overflow-hidden"
          style={{
            left: logoRect.left,
            top: logoRect.top,
            width: logoRect.width,
            height: logoRect.height,
            WebkitMaskImage: "url(/logo-long.png)",
            maskImage: "url(/logo-long.png)",
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
          }}
          data-testid="arrival-logo-sheen"
        >
          <motion.div
            className="absolute inset-y-[-45%] w-[55%]"
            style={{
              // A warm, near-white band — morning light, not a colour wash. Soft
              // fade at both edges so nothing shows a hard line; `screen` blend so
              // it brightens the mark like light rather than painting over it.
              background:
                "linear-gradient(90deg, hsla(45,90%,92%,0) 0%, hsla(45,92%,90%,0.72) 50%, hsla(45,90%,92%,0) 100%)",
              mixBlendMode: "screen",
              rotate: "12deg",
            }}
            initial={{ x: "-165%" }}
            animate={{ x: "235%" }}
            transition={{ duration: T.sheenDur, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      )}

      {/* ── Scene 1 — the welcome. Fills the first viewport; you land here. ──── */}
      {isFull && (
        <motion.section
          // z above the cream (60) so the greeting sits ON the calm field while
          // it is still whole; it scrolls away under the header during the glide.
          className="relative z-[61] flex min-h-[100svh] flex-col items-center justify-center px-6 text-center"
          style={sceneH ? { minHeight: sceneH } : undefined}
          aria-label="Welcome"
          data-testid="arrival-welcome"
          // The greeting is HELD (opacity 1) through the read, then fades slowly
          // as the orchard becomes dominant — it recedes, it never blinks out.
          // The two spans below run their own entrance; this only governs the
          // long, gentle exit, which begins well after the words have settled.
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: T.greetingFadeDur, delay: T.greetingFade, ease: [0.4, 0, 0.2, 1] }}
        >
          <h1>
            {/* THA greets in its own hand. The DOM reads "Welcome home, <name>."
                in order, so a screen reader hears one ordinary sentence and never
                learns two typefaces were involved — the handwriting carries no
                information of its own.

                COLOUR: a deep THA green — the palette's deep-primary token
                (`--primary-border`, hsl(132 14% 37/44%)), not the near-black
                `--foreground`. It reads as the orchard's own green on the cream,
                and clears WCAG AA for large text on both themes (≈5.8:1 on cream,
                ≈3.8:1 in dark). It is a colour we already own — no new value. */}
            <motion.span
              className="block text-signature signature-ink text-[3rem] sm:text-[4.25rem] leading-none"
              style={{ color: "var(--primary-border)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: T.signature }}
              data-testid="text-arrival-signature"
            >
              Welcome home
            </motion.span>

            {name && (
              <motion.span
                className="mt-3 block font-display text-[1.6rem] sm:text-3xl font-medium tracking-tight text-primary"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: T.name, ease: [0.22, 1, 0.36, 1] }}
                data-testid="text-arrival-name"
              >
                {name}
              </motion.span>
            )}
          </h1>
        </motion.section>
      )}

      {/* ── Scene 2 — the workspace. Calm, still, one viewport. ───────────────
          Softer surfaces, more air, one clear hierarchy: Today (primary), then
          Shopping + Plants as one supporting beat, then a single reminder, then
          one quiet way deeper. Nothing here animates independently — it is simply
          where the glide sets you down. */}
      <div
        ref={workspaceRef}
        className="relative z-[6] mx-auto w-full max-w-2xl px-4 sm:px-6 flex min-h-[100svh] flex-col justify-center py-10 sm:py-14"
        style={sceneH ? { minHeight: sceneH } : undefined}
        data-testid="arrival-workspace"
      >
        <header className="mb-7 sm:mb-9">
          <p
            className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70 mb-1.5"
            data-testid="text-arrival-date"
          >
            {todayLabel()}
          </p>
          <h2 className="font-display text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-foreground">
            Today
          </h2>
        </header>

        <div className="space-y-4" aria-label="Home">
          {/* ── Today's meals — the primary, and the home of the one action ──── */}
          {mealsBroken ? (
            <LoadError what="today's meals" onRetry={retryTodaysMeals} data-testid="error-arrival-todays-meals" />
          ) : (
            <Card className="border-border/30 bg-card/70 backdrop-blur-sm shadow-sm" data-testid="card-arrival-todays-meals">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-[hsl(172,20%,92%)] text-[hsl(172,38%,26%)] dark:bg-[hsl(172,14%,18%)] dark:text-[hsl(172,26%,68%)] shrink-0">
                    <CalendarDays style={{ width: 18, height: 18 }} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">Today's meals</h3>
                    <p className="text-xs text-muted-foreground">What's planned for today</p>
                  </div>
                </div>

                {mealsWaiting ? (
                  <div className="flex flex-col gap-2" data-testid="loading-arrival-todays-meals">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-5 w-1/2" />
                  </div>
                ) : todaysMeals.length === 0 ? (
                  <p className="text-sm text-muted-foreground" data-testid="text-arrival-meals-empty">
                    Nothing planned for today yet.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1.5" data-testid="list-arrival-todays-meals">
                    {todaysMeals.map((m) => (
                      <li key={m.id} className="text-foreground/85">
                        <MealCard
                          meal={m}
                          variant="row"
                          thumbnailSize="xs"
                          href={null}
                          meta={m.mealType ? <span className="capitalize">{m.mealType}</span> : undefined}
                        />
                      </li>
                    ))}
                  </ul>
                )}

                {/* The one primary-styled action on the page. */}
                <Button asChild variant="default" className="mt-5 w-full sm:w-auto" data-testid="button-arrival-primary">
                  <Link href="/planner">{primaryLabel}</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ── Shopping + Plants — one supporting beat, visibly subordinate ──── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {shoppingQuery.isError ? (
              <LoadError what="your shopping list" onRetry={() => shoppingQuery.refetch()} className="h-full" data-testid="error-arrival-shopping" />
            ) : (
              <Link href="/shopping-workspace" aria-label="Go to shopping">
                <Card className="h-full group cursor-pointer hover-elevate transition-all duration-200 border-border/30 bg-card/60 backdrop-blur-sm" data-testid="card-arrival-shopping">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-[hsl(190,24%,92%)] text-[hsl(190,42%,26%)] dark:bg-[hsl(190,16%,18%)] dark:text-[hsl(190,30%,68%)] shrink-0">
                        <ShoppingCart style={{ width: 16, height: 16 }} />
                      </span>
                      <h3 className="text-sm font-semibold text-foreground">Shopping</h3>
                    </div>
                    {shoppingQuery.isLoading ? (
                      <Skeleton className="h-5 w-24" data-testid="loading-arrival-shopping" />
                    ) : (
                      <p className="text-sm text-foreground/85" data-testid="text-arrival-shopping-summary">
                        {openShoppingCount === 0 ? (
                          "Your list is clear."
                        ) : (
                          <>
                            <span className="font-semibold text-foreground">{openShoppingCount}</span>{" "}
                            {openShoppingCount === 1 ? "item" : "items"} to buy
                          </>
                        )}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )}

            {homeIntelQuery.isError ? (
              <LoadError what="your plant diversity" onRetry={() => homeIntelQuery.refetch()} className="h-full" data-testid="error-arrival-plant-diversity" />
            ) : (
              <Link href="/plant-diversity" aria-label="Go to plant diversity">
                <Card className="h-full group cursor-pointer hover-elevate transition-all duration-200 border-border/30 bg-card/60 backdrop-blur-sm" data-testid="card-arrival-plant-diversity">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-[hsl(145,20%,91%)] text-[hsl(145,36%,26%)] dark:bg-[hsl(145,14%,18%)] dark:text-[hsl(145,26%,66%)] shrink-0">
                        <Leaf style={{ width: 16, height: 16 }} />
                      </span>
                      <h3 className="text-sm font-semibold text-foreground">Plant diversity</h3>
                    </div>
                    {homeIntelQuery.isLoading ? (
                      <div className="flex flex-col gap-2" data-testid="loading-arrival-plant-diversity">
                        <Skeleton className="h-5 w-28" />
                        <Skeleton className="h-1.5 w-full" />
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-foreground/85 mb-2" data-testid="text-arrival-plant-summary">
                          <span className="font-semibold text-foreground">{plantCount}</span> of {WEEKLY_PLANT_TARGET} plants
                        </p>
                        <div className="h-1.5 w-full rounded-full bg-[hsl(145,16%,90%)] dark:bg-[hsl(145,10%,20%)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[hsl(145,34%,52%)] transition-all"
                            style={{ width: `${plantPct}%` }}
                            data-testid="bar-arrival-plant-progress"
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )}
          </div>

          {/* ── One household reminder — a single sentence, never a feed ──────── */}
          {reminder && (
            <div className="flex items-start gap-2.5 px-1 pt-1 text-sm text-foreground/75 leading-relaxed" data-testid="arrival-reminder">
              <Bell className="h-4 w-4 text-primary/50 mt-0.5 shrink-0" />
              {/* The Behaviour Engine's sentence, rendered verbatim. Never reworded here. */}
              <span>{reminder.text}</span>
            </div>
          )}
        </div>

        {/* The quiet way deeper — never competing with the primary. */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="link-arrival-dashboard"
          >
            See your full dashboard
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
