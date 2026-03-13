import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChefHat, ArrowRight, ArrowLeft, Check,
  Leaf, Flame, Wheat, Ban, Sparkles,
  Heart, ShieldAlert, PiggyBank, Dumbbell, TrendingDown,
  Store, Star, Shield, Drumstick,
  Fish, Activity, Scale, Brain, Mountain, Zap, Clock, Sprout,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import FiveApplesLogo from "@/components/FiveApplesLogo";
import { DIET_PATTERNS, DIET_RESTRICTIONS, EATING_SCHEDULES } from "@/lib/diets";
import type { LucideIcon } from "lucide-react";
import appleIcon from "@/assets/icons/tha-apple.png";

const PATTERN_ICONS: Record<string, LucideIcon> = {
  Mediterranean: Fish,
  DASH: Activity,
  MIND: Brain,
  Flexitarian: Scale,
  Vegetarian: Leaf,
  Vegan: Sprout,
  Keto: Flame,
  "Low-Carb": Zap,
  Paleo: Mountain,
  Carnivore: Drumstick,
};

const RESTRICTION_ICONS: Record<string, LucideIcon> = {
  "Gluten-Free": Wheat,
  "Dairy-Free": Ban,
};

const SCHEDULE_ICONS: Record<string, LucideIcon> = {
  "None": ChefHat,
  "Intermittent Fasting": Clock,
};

const GOAL_OPTIONS = [
  { id: "eat-healthier",  label: "Eat more whole foods",           icon: Heart,       desc: "Better nutrition every day" },
  { id: "avoid-upf",      label: "Cut back on ultra-processed foods", icon: ShieldAlert, desc: "Choose simpler, cleaner ingredients" },
  { id: "save-money",     label: "Save money on groceries",        icon: PiggyBank,   desc: "Smart choices that fit your budget" },
  { id: "build-muscle",   label: "Build muscle / higher protein",  icon: Dumbbell,    desc: "Meals that support strength and recovery" },
  { id: "lose-weight",    label: "Manage weight more easily",      icon: TrendingDown,desc: "Balanced, calorie-conscious plans" },
];

const BUDGET_OPTIONS = [
  { id: "budget",         label: "Best value",                        desc: "Great nutrition without overspending" },
  { id: "standard",       label: "Balanced",                          desc: "A good mix of quality and value" },
  { id: "premium",        label: "Higher quality",                    desc: "Better brands and better ingredients" },
  { id: "organic",        label: "Organic when possible",             desc: "Certified organic products where available" },
  { id: "grass-finished", label: "Pasture-raised / grass-fed where it matters", desc: "Premium sourced meat and dairy" },
];

const STORE_OPTIONS = [
  { id: "tesco",      label: "Tesco" },
  { id: "sainsburys", label: "Sainsbury's" },
  { id: "waitrose",   label: "Waitrose" },
  { id: "ocado",      label: "Ocado" },
  { id: "aldi",       label: "Aldi" },
  { id: "lidl",       label: "Lidl" },
  { id: "asda",       label: "Asda" },
];

const UPF_OPTIONS = [
  {
    id: "strict",
    label: "Mostly whole foods",
    icon: Shield,
    desc: "I'd prefer choices that lean as natural and minimally processed as possible.",
  },
  {
    id: "moderate",
    label: "A balanced approach",
    icon: ShieldAlert,
    desc: "I prefer simpler ingredients, but convenience still matters.",
  },
  {
    id: "flexible",
    label: "Flexible",
    icon: Sparkles,
    desc: "I'm happy with a mix of fresh foods and convenient options.",
  },
];

const STEP_LABELS = ["Diet", "Goals", "Shopping", "Stores", "Food approach"];
const TOTAL_STEPS = STEP_LABELS.length;

function AppleProgressIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-6" aria-label={`Step ${step + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => {}}
          className="relative flex items-center justify-center"
          style={{ width: 28, height: 28 }}
          aria-label={STEP_LABELS[i]}
          data-testid={`button-apple-step-${i}`}
        >
          <img
            src={appleIcon}
            alt=""
            draggable={false}
            className="w-5 h-5 object-contain transition-all duration-200"
            style={{
              opacity: i < step ? 1 : i === step ? 1 : 0.25,
              filter: i === step
                ? "none"
                : i < step
                ? "saturate(0.7) brightness(0.85)"
                : "saturate(0) brightness(1.1)",
              transform: i === step ? "scale(1.15)" : "scale(1)",
            }}
          />
          {i === step && (
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-medium text-primary whitespace-nowrap leading-none">
              {STEP_LABELS[i]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);

  const [dietPattern, setDietPattern] = useState<string | null>(null);
  const [dietRestrictions, setDietRestrictions] = useState<string[]>([]);
  const [eatingSchedule, setEatingSchedule] = useState<string | null>(null);

  const [healthGoals, setHealthGoals] = useState<string[]>([]);
  const [budgetLevel, setBudgetLevel] = useState("standard");
  const [preferredStores, setPreferredStores] = useState<string[]>([]);
  const [upfSensitivity, setUpfSensitivity] = useState("moderate");

  const [direction, setDirection] = useState(0);

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/user/complete-onboarding", {
        dietPattern: dietPattern ?? null,
        dietRestrictions,
        eatingSchedule: eatingSchedule ?? null,
        healthGoals,
        budgetLevel,
        preferredStores,
        upfSensitivity,
        qualityPreference: budgetLevel,
        excludedIngredients: [],
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data);
      setLocation("/");
    },
  });

  function toggleList<T extends string>(value: T, list: T[], setter: (v: T[]) => void) {
    setter(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
  }

  const canProceed = () => {
    if (step === 2) return !!budgetLevel;
    if (step === 4) return !!upfSensitivity;
    return true;
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  const goNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setDirection(1);
      setStep(step + 1);
    } else {
      completeMutation.mutate();
    }
  };

  const goPrev = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const cardBase = "flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer";
  const cardSelected = "border-primary bg-primary/5 shadow-sm";
  const cardIdle = "border-border hover:border-primary/40 hover:bg-muted/40";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <img
        src={appleIcon}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none select-none absolute right-[-60px] bottom-[-40px] w-[380px] sm:w-[460px] opacity-[0.04]"
        style={{ zIndex: 0 }}
      />

      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 mb-3">
            <FiveApplesLogo size={26} />
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-onboarding-title">The Healthy Apples</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            A few quick preferences and we'll tailor meals, baskets, and better choices around you.
          </p>
        </div>

        <AppleProgressIndicator step={step} total={TOTAL_STEPS} />

        <div className="mt-8">
          <Card className="shadow-md border-border/60">
            <CardContent className="p-6 sm:p-8">
              <div className="overflow-hidden relative min-h-[360px]">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={step}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="w-full"
                  >

                    {step === 0 && (
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-xl font-semibold mb-1">How do you like to eat?</h2>
                          <p className="text-sm text-muted-foreground">Choose the style that fits you best. You can always change this later.</p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Diet style — pick one</p>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setDietPattern(null)}
                              className={`${cardBase} ${!dietPattern ? cardSelected : cardIdle}`}
                              data-testid="button-diet-pattern-none"
                            >
                              <ChefHat className={`w-5 h-5 flex-shrink-0 mt-0.5 ${!dietPattern ? "text-primary" : "text-muted-foreground"}`} />
                              <div className="min-w-0">
                                <div className="font-medium text-sm">No particular style</div>
                                <div className="text-xs text-muted-foreground mt-0.5">All food types welcome</div>
                              </div>
                              {!dietPattern && <Check className="w-4 h-4 text-primary ml-auto flex-shrink-0 mt-0.5" />}
                            </button>
                            {DIET_PATTERNS.map((opt) => {
                              const Icon = PATTERN_ICONS[opt.value] ?? Star;
                              const selected = dietPattern === opt.value;
                              const displayLabel = opt.value === "Low-Carb" ? "Lower carb" : opt.label;
                              return (
                                <button
                                  key={opt.value}
                                  onClick={() => setDietPattern(selected ? null : opt.value)}
                                  className={`${cardBase} ${selected ? cardSelected : cardIdle}`}
                                  data-testid={`button-diet-pattern-${opt.value}`}
                                >
                                  <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                                  <div className="min-w-0">
                                    <div className="font-medium text-sm">{displayLabel}</div>
                                    <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                                  </div>
                                  {selected && <Check className="w-4 h-4 text-primary ml-auto flex-shrink-0 mt-0.5" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Are there any foods you prefer to avoid?</p>
                          <p className="text-xs text-muted-foreground mb-2">Select any that matter to you.</p>
                          <div className="grid grid-cols-2 gap-2">
                            {DIET_RESTRICTIONS.map((opt) => {
                              const Icon = RESTRICTION_ICONS[opt.value] ?? Ban;
                              const selected = dietRestrictions.includes(opt.value);
                              return (
                                <button
                                  key={opt.value}
                                  onClick={() => toggleList(opt.value, dietRestrictions, setDietRestrictions)}
                                  className={`${cardBase} ${selected ? cardSelected : cardIdle}`}
                                  data-testid={`button-diet-restriction-${opt.value}`}
                                >
                                  <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                                  <div className="min-w-0">
                                    <div className="font-medium text-sm">{opt.label}</div>
                                    <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                                  </div>
                                  {selected && <Check className="w-4 h-4 text-primary ml-auto flex-shrink-0 mt-0.5" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Does your eating routine have a rhythm to it?</p>
                          <div className="grid grid-cols-2 gap-2">
                            {EATING_SCHEDULES.map((opt) => {
                              const Icon = SCHEDULE_ICONS[opt.value] ?? Clock;
                              const selected = (eatingSchedule ?? "None") === opt.value;
                              const displayLabel = opt.value === "None" ? "No set routine" : "Intermittent fasting";
                              const displayDesc = opt.value === "None" ? "Eat whenever works for you" : "Time-restricted eating windows";
                              return (
                                <button
                                  key={opt.value}
                                  onClick={() => setEatingSchedule(opt.value === "None" ? null : opt.value)}
                                  className={`${cardBase} ${selected ? cardSelected : cardIdle}`}
                                  data-testid={`button-diet-schedule-${opt.value}`}
                                >
                                  <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                                  <div className="min-w-0">
                                    <div className="font-medium text-sm">{displayLabel}</div>
                                    <div className="text-xs text-muted-foreground mt-0.5">{displayDesc}</div>
                                  </div>
                                  {selected && <Check className="w-4 h-4 text-primary ml-auto flex-shrink-0 mt-0.5" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 1 && (
                      <div className="space-y-5">
                        <div>
                          <h2 className="text-xl font-semibold mb-1">What would you like to focus on?</h2>
                          <p className="text-sm text-muted-foreground">Choose up to 3 things that matter most to you.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-2.5">
                          {GOAL_OPTIONS.map((opt) => {
                            const Icon = opt.icon;
                            const selected = healthGoals.includes(opt.id);
                            const atLimit = healthGoals.length >= 3 && !selected;
                            return (
                              <button
                                key={opt.id}
                                onClick={() => !atLimit && toggleList(opt.id, healthGoals, setHealthGoals)}
                                className={`${cardBase} ${selected ? cardSelected : cardIdle} ${atLimit ? "opacity-40 cursor-not-allowed" : ""}`}
                                data-testid={`button-goal-${opt.id}`}
                                disabled={atLimit}
                              >
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${selected ? "bg-primary/10" : "bg-muted"}`}>
                                  <Icon className={`w-5 h-5 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-sm">{opt.label}</div>
                                  <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                                </div>
                                {selected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                        {healthGoals.length >= 3 && (
                          <p className="text-xs text-muted-foreground text-center">Up to 3 selected — deselect one to change your choices</p>
                        )}
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-5">
                        <div>
                          <h2 className="text-xl font-semibold mb-1">What matters most when you shop?</h2>
                          <p className="text-sm text-muted-foreground">We'll use this to shape product and basket suggestions.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-2.5">
                          {BUDGET_OPTIONS.map((opt) => {
                            const selected = budgetLevel === opt.id;
                            return (
                              <button
                                key={opt.id}
                                onClick={() => setBudgetLevel(opt.id)}
                                className={`${cardBase} ${selected ? cardSelected : cardIdle}`}
                                data-testid={`button-budget-${opt.id}`}
                              >
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${selected ? "bg-primary/10" : "bg-muted"}`}>
                                  <div className={`w-3 h-3 rounded-full transition-colors ${selected ? "bg-primary" : "bg-muted-foreground/40"}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-sm">{opt.label}</div>
                                  <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                                </div>
                                {selected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-5">
                        <div>
                          <h2 className="text-xl font-semibold mb-1">Which shops do you usually use?</h2>
                          <p className="text-sm text-muted-foreground">We'll use this for matching products and prices.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          {STORE_OPTIONS.map((opt) => {
                            const selected = preferredStores.includes(opt.id);
                            return (
                              <button
                                key={opt.id}
                                onClick={() => toggleList(opt.id, preferredStores, setPreferredStores)}
                                className={`${cardBase} items-center ${selected ? cardSelected : cardIdle}`}
                                data-testid={`button-store-${opt.id}`}
                              >
                                <Store className={`w-5 h-5 flex-shrink-0 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                                <div className="font-medium text-sm flex-1">{opt.label}</div>
                                {selected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {step === 4 && (
                      <div className="space-y-5">
                        <div>
                          <h2 className="text-xl font-semibold mb-1">How would you like us to approach processed foods?</h2>
                          <p className="text-sm text-muted-foreground">We'll tailor recommendations to match your preference.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {UPF_OPTIONS.map((opt) => {
                            const Icon = opt.icon;
                            const selected = upfSensitivity === opt.id;
                            return (
                              <button
                                key={opt.id}
                                onClick={() => setUpfSensitivity(opt.id)}
                                className={`${cardBase} ${selected ? cardSelected : cardIdle} p-4`}
                                data-testid={`button-upf-${opt.id}`}
                              >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${selected ? "bg-primary/10" : "bg-muted"}`}>
                                  <Icon className={`w-5 h-5 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-sm">{opt.label}</div>
                                  <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{opt.desc}</div>
                                </div>
                                {selected && <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t gap-3">
                <Button
                  variant="ghost"
                  onClick={goPrev}
                  disabled={step === 0}
                  data-testid="button-prev-step"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>

                <div className="flex items-center gap-3">
                  {step < TOTAL_STEPS - 1 && (
                    <Button
                      variant="ghost"
                      onClick={() => completeMutation.mutate()}
                      disabled={completeMutation.isPending}
                      className="text-muted-foreground"
                      data-testid="button-skip-onboarding"
                    >
                      Skip for now
                    </Button>
                  )}
                  <Button
                    onClick={goNext}
                    disabled={!canProceed() || completeMutation.isPending}
                    data-testid="button-next-step"
                  >
                    {completeMutation.isPending ? (
                      "Saving..."
                    ) : step === TOTAL_STEPS - 1 ? (
                      <>
                        Get Started
                        <Sparkles className="w-4 h-4 ml-1" />
                      </>
                    ) : (
                      <>
                        Next
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
