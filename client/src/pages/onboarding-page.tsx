import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ArrowRight, ArrowLeft, Check, Info,
  BookOpen, ScanLine, CalendarDays, ClipboardList, ShoppingBasket,
  Scale, Activity, Target, Microscope, Compass,
  Leaf, Sparkles, Snowflake,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import FiveApplesLogo from "@/components/FiveApplesLogo";
import {
  ONBOARDING_DIET_OPTIONS,
  ALLERGY_OPTIONS,
  EATING_STYLE_OPTIONS,
} from "@/lib/diets";
import appleIcon from "@/assets/icons/tha-apple.png";

// ── Constants ────────────────────────────────────────────────────────────────

const STEP_LABELS = [
  "Welcome", "Values", "Approach", "Real Food",
  "About You", "Allergies", "Diet", "Style",
  "Choices", "Features", "Tracking", "Begin",
];
const TOTAL_STEPS = STEP_LABELS.length; // 12

// Determined by step 10 (5 StartAreaCards). All cards share this height so
// transitions are stable — no layout jump between steps.
const CARD_CONTENT_MIN_HEIGHT = 370;

// ── Start area definitions ───────────────────────────────────────────────────

const START_AREAS = [
  {
    key: "meals",
    route: "/meals",
    icon: BookOpen,
    title: "Cookbook",
    label: "Save and organise your meals",
    hint: "Save meals from anywhere — build your own collection.",
  },
  {
    key: "products",
    route: "/products",
    icon: ScanLine,
    title: "Analyser",
    label: "Understand what's in your food",
    hint: "Scan or search to understand what's in your food.",
  },
  {
    key: "weekly-planner",
    route: "/weekly-planner",
    icon: CalendarDays,
    title: "Planner",
    label: "Plan your meals for the week",
    hint: "Start by adding a meal or recipe.",
  },
  {
    key: "diary",
    route: "/diary",
    icon: ClipboardList,
    title: "Diary",
    label: "Keep a simple record of your day",
    hint: "Keep it simple — add anything you've eaten today.",
  },
  {
    key: "pantry",
    route: "/pantry",
    icon: ShoppingBasket,
    title: "Pantry",
    label: "Build your go-to foods",
    hint: "Add foods you use often — we'll help you make better choices.",
  },
] as const;

type StartAreaKey = (typeof START_AREAS)[number]["key"];

// ── Progress indicator ───────────────────────────────────────────────────────

function AppleProgressIndicator({ step, total, onNavigate }: { step: number; total: number; onNavigate: (i: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6" aria-label={`Step ${step + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Go to step ${i + 1}`}
          onClick={() => onNavigate(i)}
          className="relative flex items-center justify-center focus:outline-none"
          style={{ width: 44, height: 44 }}
        >
          <img
            src={appleIcon}
            alt=""
            draggable={false}
            className="w-8 h-8 object-contain transition-all duration-200"
            style={{
              opacity: i < step ? 1 : i === step ? 1 : 0.2,
              filter: i === step
                ? "none"
                : i < step
                ? "saturate(0.7) brightness(0.85)"
                : "saturate(0) brightness(1.1)",
              transform: i === step ? "scale(1.25)" : "scale(1)",
            }}
          />
        </button>
      ))}
    </div>
  );
}

// ── Chip components ──────────────────────────────────────────────────────────

function AllergyChip({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all duration-150 ${
        selected
          ? "border-primary bg-primary/10 text-primary font-medium"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {selected && <Check className="h-3 w-3 flex-shrink-0" />}
      {label}
    </button>
  );
}

function DietChip({
  label, def, selected, onClick,
}: { label: string; def: string; selected: boolean; onClick: () => void }) {
  return (
    <div className="flex items-center w-full">
      <button
        type="button"
        onClick={onClick}
        className={`flex-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-l-full text-sm border-y border-l transition-all duration-150 ${
          selected
            ? "border-primary bg-primary/10 text-primary font-medium"
            : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
        }`}
      >
        {selected && <Check className="h-3 w-3 flex-shrink-0" />}
        {label}
      </button>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`h-full flex items-center px-1.5 rounded-r-full text-sm border-y border-r transition-all duration-150 ${
              selected
                ? "border-primary bg-primary/10 text-primary/60 hover:text-primary"
                : "border-border text-muted-foreground/40 hover:text-muted-foreground"
            }`}
            aria-label={`What is ${label}?`}
          >
            <Info className="h-3 w-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="text-xs p-2.5 max-w-[200px] leading-relaxed" side="top">
          {def}
        </PopoverContent>
      </Popover>
    </div>
  );
}

function StyleChip({
  label, def, selected, onClick,
}: { label: string; def: string; selected: boolean; onClick: () => void }) {
  return (
    <DietChip label={label} def={def} selected={selected} onClick={onClick} />
  );
}

// ── Tracking toggle row ──────────────────────────────────────────────────────

function TrackingToggle({
  id, label, description, checked, onChange, icon: Icon,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border/40 last:border-0">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon className="h-5 w-5 text-muted-foreground/70" />
        </div>
        <div>
          <Label htmlFor={id} className="text-sm font-medium cursor-pointer">{label}</Label>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// ── Start area card ──────────────────────────────────────────────────────────

function StartAreaCard({
  area, selected, onClick,
}: {
  area: (typeof START_AREAS)[number];
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = area.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-150 w-full ${
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:border-primary/40 hover:bg-muted/30"
      }`}
    >
      <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
        <Icon className={`h-5 w-5 transition-colors ${selected ? "text-primary" : "text-muted-foreground/70"}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm">{area.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{area.label}</p>
      </div>
      {selected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
    </button>
  );
}

// ── Main onboarding page ─────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Screen 4 — Preferences
  const [allergies, setAllergies] = useState<string[]>([]);
  const [otherAllergyText, setOtherAllergyText] = useState("");
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>([]);
  const [eatingStyles, setEatingStyles] = useState<string[]>([]);

  // Screen 6 — Tracking (all OFF by default per product philosophy)
  const [trackCalories, setTrackCalories] = useState(false);
  const [trackMacros, setTrackMacros] = useState(false);
  const [trackWeight, setTrackWeight] = useState(false);

  // Screen 7 — Start area
  const [startArea, setStartArea] = useState<StartAreaKey | null>(null);

  // ── Prefill from saved preferences (re-onboarding / existing user) ──────────
  const { data: savedPrefs } = useQuery<any>({
    queryKey: ["/api/user/preferences"],
    queryFn: async () => {
      const res = await fetch("/api/user/preferences", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const prefsInitialised = useRef(false);
  const KNOWN_ALLERGY_VALUES = ALLERGY_OPTIONS.map((o) => o.value).filter((v) => v !== "other");

  useEffect(() => {
    if (!savedPrefs || prefsInitialised.current) return;
    prefsInitialised.current = true;

    // Excluded ingredients → allergy chip state
    if (savedPrefs.excludedIngredients?.length) {
      const known = savedPrefs.excludedIngredients.filter((i: string) => KNOWN_ALLERGY_VALUES.includes(i));
      const custom = savedPrefs.excludedIngredients.filter((i: string) => !KNOWN_ALLERGY_VALUES.includes(i));
      setAllergies(custom.length > 0 ? [...known, "other"] : known);
      if (custom.length > 0) setOtherAllergyText(custom.join(", "));
    }

    // dietTypes → dietary prefs + eating styles
    if (savedPrefs.dietTypes?.length) {
      setDietaryPrefs(savedPrefs.dietTypes.filter((d: string) => !d.startsWith("style:")));
      setEatingStyles(
        savedPrefs.dietTypes
          .filter((d: string) => d.startsWith("style:"))
          .map((d: string) => d.slice(6)),
      );
    }

    // Tracking toggles
    if (savedPrefs.calorieMode !== undefined) setTrackCalories(savedPrefs.calorieMode === "manual");
    if (savedPrefs.eliteTrackingEnabled !== undefined) setTrackMacros(savedPrefs.eliteTrackingEnabled);
    if (savedPrefs.healthTrendEnabled !== undefined) setTrackWeight(savedPrefs.healthTrendEnabled);
  }, [savedPrefs]);

  const completeMutation = useMutation({
    mutationFn: async () => {
      // Build excludedIngredients from allergy selections
      const excludedIngredients: string[] = allergies
        .filter((a) => a !== "other")
        .concat(
          allergies.includes("other") && otherAllergyText.trim()
            ? [otherAllergyText.trim().toLowerCase()]
            : []
        );

      // Build dietTypes: dietary preferences + eating styles (prefixed)
      const dietTypes: string[] = [
        ...dietaryPrefs,
        ...eatingStyles.map((s) => `style:${s}`),
      ];

      const res = await apiRequest("POST", "/api/user/complete-onboarding", {
        excludedIngredients,
        dietTypes,
        healthGoals: [],
        budgetLevel: "standard",
        preferredStores: [],
        upfSensitivity: "moderate",
        qualityPreference: "standard",
        // Tracking choices
        calorieMode: trackCalories ? "manual" : "auto",
        eliteTrackingEnabled: trackMacros,
        healthTrendEnabled: trackWeight,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data);
      // Invalidate profile and preferences caches so Profile page reflects the
      // updated values immediately without requiring a manual reload.
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/preferences"] });

      // Store preferred start area for soft contextual hints (localStorage only —
      // this is a navigation UX preference, not core profile data).
      if (startArea) {
        try {
          localStorage.setItem("tha_preferred_start_area", startArea);
        } catch {}
      }

      // Route to chosen area
      const chosen = START_AREAS.find((a) => a.key === startArea);
      setLocation(chosen ? chosen.route : "/");
    },
  });

  function toggle<T extends string>(value: T, list: T[], setter: (v: T[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 280 : -280, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -280 : 280, opacity: 0 }),
  };

  const goNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    } else {
      completeMutation.mutate();
    }
  };

  const goPrev = () => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  // Screens 4–7 are the preferences screens (all skippable)
  const isPreferencesScreen = step >= 4 && step <= 7;

  const isLastStep = step === TOTAL_STEPS - 1;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background apple watermark */}
      <img
        src={appleIcon}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none select-none absolute right-[-60px] bottom-[-40px] w-[360px] sm:w-[440px] opacity-[0.04]"
        style={{ zIndex: 0 }}
      />

      <div className="w-full max-w-xl relative z-10">
        {/* Header */}
        <div className="flex justify-center mb-6">
          <img
            src="/logo-long.png"
            alt="The Healthy Apples"
            className="h-14 sm:h-16 w-auto object-contain"
          />
        </div>

        <AppleProgressIndicator
          step={step}
          total={TOTAL_STEPS}
          onNavigate={(i) => { setDirection(i > step ? 1 : -1); setStep(i); }}
        />

        <div className="mt-8">
          <Card
            className="shadow-none border-border/60 overflow-hidden"
            style={{
              backgroundImage: "url('/orchard-bg.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundAttachment: "fixed",
            }}
          >
            <CardContent className="p-5 sm:p-6">
              <div className="overflow-hidden relative" style={{ minHeight: CARD_CONTENT_MIN_HEIGHT }}>
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={step}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className="w-full"
                  >

                    {/* ── Screen 0 — Welcome ─────────────────────────── */}
                    {step === 0 && (
                      <div className="space-y-5 text-center py-4">
                        <div className="w-16 h-16 mx-auto">
                          <img src={appleIcon} alt="" className="w-full h-full object-contain" />
                        </div>
                        <div className="space-y-3">
                          <h2 className="text-2xl font-semibold tracking-tight">Let's make food simpler.</h2>
                          <p className="text-base text-muted-foreground leading-relaxed max-w-sm mx-auto">
                            No pressure. Just clearer choices.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ── Screen 1 — Reframing health ────────────────── */}
                    {step === 1 && (
                      <div className="space-y-5 text-center py-4">
                        <div className="flex justify-center"><Leaf className="h-12 w-12 text-primary/70" /></div>
                        <div className="space-y-3">
                          <h2 className="text-2xl font-semibold tracking-tight">Healthy eating isn't about perfection.</h2>
                          <p className="text-base text-muted-foreground leading-relaxed max-w-sm mx-auto">
                            It's about making better choices, more often.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ── Screen 2 — Remove pressure ─────────────────── */}
                    {step === 2 && (
                      <div className="space-y-5 text-center py-4">
                        <div className="flex justify-center"><Sparkles className="h-12 w-12 text-primary/70" /></div>
                        <div className="space-y-3">
                          <h2 className="text-2xl font-semibold tracking-tight">No calorie counting required.</h2>
                          <p className="text-base text-muted-foreground leading-relaxed max-w-sm mx-auto">
                            No strict plans. No pressure.
                          </p>
                        </div>
                        <div className="text-left max-w-sm mx-auto rounded-xl border border-border/50 bg-muted/30 p-4">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Use Healthy Apples through your{" "}
                            <span className="text-foreground font-medium">Cookbook</span>,{" "}
                            <span className="text-foreground font-medium">Planner</span>,{" "}
                            <span className="text-foreground font-medium">Pantry</span>, or{" "}
                            <span className="text-foreground font-medium">Diary</span> — whichever feels right for you.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ── Screen 3 — Introduce UPF ───────────────────── */}
                    {step === 3 && (
                      <div className="space-y-5 text-center py-4">
                        <div className="w-16 h-16 mx-auto flex items-center justify-center">
                          <Microscope className="w-12 h-12 text-muted-foreground/60" />
                        </div>
                        <div className="space-y-3">
                          <h2 className="text-2xl font-semibold tracking-tight">
                            Most of the problem isn't how much we eat… it's what's in the food we are eating.
                          </h2>
                        </div>
                        <div className="text-left max-w-sm mx-auto rounded-xl border border-border/50 bg-muted/30 p-4 space-y-2">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Ultra-processed foods often contain additives, flavourings, and ingredients you wouldn't find in a home kitchen.
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Healthy Apples helps you spot them — simply and without stress.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ── Screen 4 — Preferences intro ──────────────── */}
                    {step === 4 && (
                      <div className="space-y-4 text-center py-4">
                        <div className="flex justify-center"><Leaf className="h-12 w-12 text-primary/70" /></div>
                        <div className="space-y-3">
                          <h2 className="text-2xl font-semibold tracking-tight">Anything we should know?</h2>
                          <p className="text-base text-muted-foreground leading-relaxed max-w-sm mx-auto">
                            We'll use this to tailor suggestions — you can change it anytime.
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground/60 pt-2">
                          Keep it simple — skip anything that doesn't apply.
                        </p>
                      </div>
                    )}

                    {/* ── Screen 5 — Allergies ───────────────────────── */}
                    {step === 5 && (
                      <div className="space-y-4">
                        <div>
                          <h2 className="text-xl font-semibold mb-1">Allergies or intolerances</h2>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Select anything that applies.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {ALLERGY_OPTIONS.map((opt) => (
                            <AllergyChip
                              key={opt.value}
                              label={opt.label}
                              selected={allergies.includes(opt.value)}
                              onClick={() => toggle(opt.value, allergies, setAllergies)}
                            />
                          ))}
                        </div>
                        {allergies.includes("other") && (
                          <Input
                            value={otherAllergyText}
                            onChange={(e) => setOtherAllergyText(e.target.value)}
                            placeholder="e.g. sesame, mustard…"
                            className="mt-1 h-8 text-sm max-w-xs"
                            autoFocus
                          />
                        )}
                      </div>
                    )}

                    {/* ── Screen 6 — Dietary preferences ────────────── */}
                    {step === 6 && (
                      <div className="space-y-4">
                        <div>
                          <h2 className="text-xl font-semibold mb-1">Dietary preferences</h2>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Tap <Info className="h-3 w-3 inline mb-0.5" /> for a quick definition.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {ONBOARDING_DIET_OPTIONS.map((opt) => (
                            <DietChip
                              key={opt.value}
                              label={opt.label}
                              def={opt.def}
                              selected={dietaryPrefs.includes(opt.value)}
                              onClick={() => toggle(opt.value, dietaryPrefs, setDietaryPrefs)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Screen 7 — Eating style ────────────────────── */}
                    {step === 7 && (
                      <div className="space-y-4">
                        <div>
                          <h2 className="text-xl font-semibold mb-1">Eating style</h2>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            How would you describe the way you eat?
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {EATING_STYLE_OPTIONS.map((opt) => (
                            <StyleChip
                              key={opt.value}
                              label={opt.label}
                              def={opt.def}
                              selected={eatingStyles.includes(opt.value)}
                              onClick={() => toggle(opt.value, eatingStyles, setEatingStyles)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Screen 8 — Better Options ──────────────────── */}
                    {step === 8 && (
                      <div className="space-y-5 text-center py-4">
                        <div className="w-16 h-16 mx-auto">
                          <img src={appleIcon} alt="" className="w-full h-full object-contain" />
                        </div>
                        <div className="space-y-2">
                          <h2 className="text-2xl font-semibold tracking-tight">
                            We help you spot better options — instantly.
                          </h2>
                        </div>
                        <div className="text-left max-w-sm mx-auto space-y-1 pt-1">
                          <p className="text-sm text-center text-muted-foreground mb-3">
                            We rate food using our simple apple system.
                          </p>
                          {[
                            { count: 5, label: "Whole foods" },
                            { count: 4, label: "Minimally processed, great options" },
                            { count: 3, label: "Better choices" },
                            { count: 2, label: "More processed, occasional" },
                            { count: 1, label: "Highly processed" },
                          ].map(({ count, label }) => (
                            <div key={count} className="flex items-center gap-3 py-1">
                              <div className="flex gap-0.5 flex-shrink-0" style={{ width: "calc(5 * 1.25rem + 4 * 0.125rem)" }}>
                                {Array.from({ length: count }).map((_, i) => (
                                  <img key={i} src={appleIcon} alt="" className="w-5 h-5 object-contain" />
                                ))}
                                {Array.from({ length: 5 - count }).map((_, i) => (
                                  <div key={i} className="w-5 h-5 flex-shrink-0" />
                                ))}
                              </div>
                              <span className="text-xs text-muted-foreground">{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Screen 9 — Real Food System ────────────────── */}
                    {step === 9 && (
                      <div className="space-y-5 text-center py-4">
                        <div className="w-16 h-16 mx-auto">
                          <img src={appleIcon} alt="" className="w-full h-full object-contain" />
                        </div>
                        <div className="space-y-2">
                          <h2 className="text-2xl font-semibold tracking-tight">Everything you need in one place.</h2>
                        </div>
                        <div className="text-left max-w-sm mx-auto space-y-2 pt-1">
                          {[
                            { icon: BookOpen, text: "Save recipes from anywhere" },
                            { icon: CalendarDays, text: "Plan meals for the week" },
                            { icon: Snowflake, text: "Store meals for later" },
                            { icon: ShoppingBasket, text: "Know what's in your pantry" },
                            { icon: ClipboardList, text: "Record what you eat — simply" },
                          ].map(({ icon: Icon, text }) => (
                            <div key={text} className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5">
                              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="text-sm text-foreground/75 leading-snug">{text}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground/60 max-w-sm mx-auto pt-1">
                          And more custom records if you want to go deeper.
                        </p>
                      </div>
                    )}

                    {/* ── Screen 10 — Optional tracking ──────────────── */}
                    {step === 10 && (
                      <div className="space-y-5">
                        <div className="flex items-center gap-3">
                          <Compass className="w-8 h-8 text-muted-foreground/60 flex-shrink-0" />
                          <div>
                            <h2 className="text-xl font-semibold mb-1">Want to track more? You can — anytime.</h2>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              All off by default. Turn on what's useful to you.
                            </p>
                          </div>
                        </div>

                        <div className="rounded-xl border border-border/60 px-4 divide-y divide-border/40">
                          <TrackingToggle
                            id="track-calories"
                            icon={Target}
                            label="Track calories"
                            description="Log calorie intake against a daily target"
                            checked={trackCalories}
                            onChange={setTrackCalories}
                          />
                          <TrackingToggle
                            id="track-macros"
                            icon={Activity}
                            label="Track macros"
                            description="Monitor protein, carbs, and fat"
                            checked={trackMacros}
                            onChange={setTrackMacros}
                          />
                          <TrackingToggle
                            id="track-weight"
                            icon={Scale}
                            label="Track weight"
                            description="Log your weight and see trends over time"
                            checked={trackWeight}
                            onChange={setTrackWeight}
                          />
                        </div>

                        <p className="text-xs text-muted-foreground/70 leading-relaxed border-l-2 border-primary/30 pl-3">
                          Goals aren't targets to chase — they're guides to help you move forward.
                        </p>
                        <p className="text-xs text-muted-foreground/60">
                          And more custom records are available if you want them.
                        </p>
                      </div>
                    )}

                    {/* ── Screen 11 — Choose where to begin ──────────── */}
                    {step === 11 && (
                      <div className="space-y-4">
                        <div>
                          <h2 className="text-xl font-semibold mb-1">Where would you like to start?</h2>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            You can explore everything — this just helps you begin.
                          </p>
                        </div>
                        <div className="space-y-2">
                          {START_AREAS.map((area) => (
                            <StartAreaCard
                              key={area.key}
                              area={area}
                              selected={startArea === area.key}
                              onClick={() =>
                                setStartArea(startArea === area.key ? null : area.key)
                              }
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground/60 text-center pt-1">
                          Use Healthy Apples in a way that works for you.
                        </p>
                      </div>
                    )}

                  </motion.div>
                </AnimatePresence>
              </div>

              {/* ── Navigation bar ────────────────────────────────── */}
              <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/40">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goPrev}
                  disabled={step === 0}
                  className="text-muted-foreground"
                  data-testid="button-onboarding-back"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>

                <span className="text-xs text-muted-foreground">
                  {step + 1} / {TOTAL_STEPS}
                </span>

                <div className="flex items-center gap-2">
                  {/* Skip button only on preferences screen */}
                  {isPreferencesScreen && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground/70 text-xs"
                      onClick={goNext}
                      data-testid="button-onboarding-skip"
                    >
                      Skip
                    </Button>
                  )}

                  <Button
                    onClick={goNext}
                    disabled={completeMutation.isPending}
                    size="sm"
                    data-testid="button-onboarding-next"
                  >
                    {isLastStep ? (
                      completeMutation.isPending ? "Starting…" : "Get started"
                    ) : (
                      <>
                        {step >= 4 ? "Continue" : "Next"}
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
