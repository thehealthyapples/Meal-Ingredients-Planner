import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChefHat, ArrowRight, ArrowLeft, Check,
  Leaf, Flame, Wheat, Ban, Sparkles,
  Heart, ShieldAlert, PiggyBank, Dumbbell, TrendingDown,
  Store, Star, Shield, Drumstick,
  Fish, Activity, Scale, Brain, Mountain, Zap, Clock,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import FiveApplesLogo from "@/components/FiveApplesLogo";
import { DIET_PATTERNS, DIET_RESTRICTIONS, EATING_SCHEDULES } from "@/lib/diets";
import type { LucideIcon } from "lucide-react";

const PATTERN_ICONS: Record<string, LucideIcon> = {
  Mediterranean: Fish,
  DASH: Activity,
  MIND: Brain,
  Flexitarian: Scale,
  Vegetarian: Leaf,
  Vegan: Leaf,
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
  { id: "eat-healthier", label: "Eat Healthier", icon: Heart, desc: "Better nutrition choices" },
  { id: "avoid-upf", label: "Avoid Ultra-Processed", icon: ShieldAlert, desc: "Cut out UPF foods" },
  { id: "save-money", label: "Save Money", icon: PiggyBank, desc: "Budget-friendly meals" },
  { id: "build-muscle", label: "Build Muscle", icon: Dumbbell, desc: "High protein meals" },
  { id: "lose-weight", label: "Lose Weight", icon: TrendingDown, desc: "Calorie-conscious plans" },
];

const BUDGET_OPTIONS = [
  { id: "budget", label: "Budget", desc: "Best value picks" },
  { id: "standard", label: "Standard", desc: "Good quality balance" },
  { id: "premium", label: "Premium", desc: "Higher quality brands" },
  { id: "organic", label: "Organic", desc: "Certified organic products" },
  { id: "grass-finished", label: "Grass Finished", desc: "Premium sourced meats" },
];

const STORE_OPTIONS = [
  { id: "tesco", label: "Tesco" },
  { id: "sainsburys", label: "Sainsbury's" },
  { id: "waitrose", label: "Waitrose" },
  { id: "ocado", label: "Ocado" },
  { id: "aldi", label: "Aldi" },
  { id: "lidl", label: "Lidl" },
  { id: "asda", label: "Asda" },
];

const UPF_OPTIONS = [
  { id: "strict", label: "Strict", icon: Shield, desc: "Avoid all ultra-processed foods" },
  { id: "moderate", label: "Moderate", icon: ShieldAlert, desc: "Limit most UPF items" },
  { id: "flexible", label: "Flexible", icon: Sparkles, desc: "Occasional UPF is fine" },
];

const STEPS = ["Diet", "Goals", "Budget", "Stores", "UPF"];

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

  const [direction, setDirection] = useState(0);

  const goNext = () => {
    if (step < 4) {
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <FiveApplesLogo size={24} />
            <h1 className="text-2xl font-bold" data-testid="text-onboarding-title">The Healthy Apples</h1>
          </div>
          <p className="text-muted-foreground">Let's personalize your experience</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <button
                onClick={() => { setDirection(i > step ? 1 : -1); setStep(i); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  i === step
                    ? "bg-primary text-primary-foreground"
                    : i < step
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
                data-testid={`button-step-${i}`}
              >
                {i < step && <Check className="w-3 h-3" />}
                <span>{label}</span>
              </button>
              {i < STEPS.length - 1 && <div className="w-6 h-px bg-border" />}
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
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
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-xl font-semibold mb-1">What's your diet?</h2>
                        <p className="text-sm text-muted-foreground">Choose a diet pattern, any restrictions, and your eating schedule.</p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Diet pattern — pick one</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setDietPattern(null)}
                            className={`flex items-center gap-3 p-3 rounded-md border text-left transition-colors ${
                              !dietPattern ? "border-primary bg-primary/5" : "border-border hover-elevate"
                            }`}
                            data-testid="button-diet-pattern-none"
                          >
                            <ChefHat className={`w-5 h-5 flex-shrink-0 ${!dietPattern ? "text-primary" : "text-muted-foreground"}`} />
                            <div className="min-w-0">
                              <div className="font-medium text-sm">No preference</div>
                              <div className="text-xs text-muted-foreground">All diet types</div>
                            </div>
                            {!dietPattern && <Check className="w-4 h-4 text-primary ml-auto flex-shrink-0" />}
                          </button>
                          {DIET_PATTERNS.map((opt) => {
                            const Icon = PATTERN_ICONS[opt.value] ?? Star;
                            const selected = dietPattern === opt.value;
                            return (
                              <button
                                key={opt.value}
                                onClick={() => setDietPattern(selected ? null : opt.value)}
                                className={`flex items-center gap-3 p-3 rounded-md border text-left transition-colors ${
                                  selected ? "border-primary bg-primary/5" : "border-border hover-elevate"
                                }`}
                                data-testid={`button-diet-pattern-${opt.value}`}
                              >
                                <Icon className={`w-5 h-5 flex-shrink-0 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                                <div className="min-w-0">
                                  <div className="font-medium text-sm">{opt.label}</div>
                                  <div className="text-xs text-muted-foreground">{opt.desc}</div>
                                </div>
                                {selected && <Check className="w-4 h-4 text-primary ml-auto flex-shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Dietary restrictions — select all that apply</p>
                        <div className="grid grid-cols-2 gap-2">
                          {DIET_RESTRICTIONS.map((opt) => {
                            const Icon = RESTRICTION_ICONS[opt.value] ?? Ban;
                            const selected = dietRestrictions.includes(opt.value);
                            return (
                              <button
                                key={opt.value}
                                onClick={() => toggleList(opt.value, dietRestrictions, setDietRestrictions)}
                                className={`flex items-center gap-3 p-3 rounded-md border text-left transition-colors ${
                                  selected ? "border-primary bg-primary/5" : "border-border hover-elevate"
                                }`}
                                data-testid={`button-diet-restriction-${opt.value}`}
                              >
                                <Icon className={`w-5 h-5 flex-shrink-0 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                                <div className="min-w-0">
                                  <div className="font-medium text-sm">{opt.label}</div>
                                  <div className="text-xs text-muted-foreground">{opt.desc}</div>
                                </div>
                                {selected && <Check className="w-4 h-4 text-primary ml-auto flex-shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Eating schedule</p>
                        <div className="grid grid-cols-2 gap-2">
                          {EATING_SCHEDULES.map((opt) => {
                            const Icon = SCHEDULE_ICONS[opt.value] ?? Clock;
                            const selected = (eatingSchedule ?? "None") === opt.value;
                            return (
                              <button
                                key={opt.value}
                                onClick={() => setEatingSchedule(opt.value === "None" ? null : opt.value)}
                                className={`flex items-center gap-3 p-3 rounded-md border text-left transition-colors ${
                                  selected ? "border-primary bg-primary/5" : "border-border hover-elevate"
                                }`}
                                data-testid={`button-diet-schedule-${opt.value}`}
                              >
                                <Icon className={`w-5 h-5 flex-shrink-0 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                                <div className="min-w-0">
                                  <div className="font-medium text-sm">{opt.label}</div>
                                  <div className="text-xs text-muted-foreground">{opt.desc}</div>
                                </div>
                                {selected && <Check className="w-4 h-4 text-primary ml-auto flex-shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div>
                      <h2 className="text-xl font-semibold mb-1">What are your goals?</h2>
                      <p className="text-sm text-muted-foreground mb-4">Choose the goals that matter to you.</p>
                      <div className="grid grid-cols-1 gap-3">
                        {GOAL_OPTIONS.map((opt) => {
                          const Icon = opt.icon;
                          const selected = healthGoals.includes(opt.id);
                          return (
                            <button
                              key={opt.id}
                              onClick={() => toggleList(opt.id, healthGoals, setHealthGoals)}
                              className={`flex items-center gap-3 p-3 rounded-md border text-left transition-colors ${
                                selected ? "border-primary bg-primary/5" : "border-border hover-elevate"
                              }`}
                              data-testid={`button-goal-${opt.id}`}
                            >
                              <Icon className={`w-5 h-5 flex-shrink-0 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                              <div className="min-w-0">
                                <div className="font-medium text-sm">{opt.label}</div>
                                <div className="text-xs text-muted-foreground">{opt.desc}</div>
                              </div>
                              {selected && <Check className="w-4 h-4 text-primary ml-auto flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div>
                      <h2 className="text-xl font-semibold mb-1">What's your budget?</h2>
                      <p className="text-sm text-muted-foreground mb-4">This affects product recommendations and price comparisons.</p>
                      <div className="grid grid-cols-1 gap-3">
                        {BUDGET_OPTIONS.map((opt) => {
                          const selected = budgetLevel === opt.id;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => setBudgetLevel(opt.id)}
                              className={`flex items-center gap-3 p-3 rounded-md border text-left transition-colors ${
                                selected ? "border-primary bg-primary/5" : "border-border hover-elevate"
                              }`}
                              data-testid={`button-budget-${opt.id}`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-sm">{opt.label}</div>
                                <div className="text-xs text-muted-foreground">{opt.desc}</div>
                              </div>
                              {selected && <Check className="w-4 h-4 text-primary ml-auto flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div>
                      <h2 className="text-xl font-semibold mb-1">Your preferred stores</h2>
                      <p className="text-sm text-muted-foreground mb-4">Select where you usually shop. You can pick multiple.</p>
                      <div className="grid grid-cols-2 gap-3">
                        {STORE_OPTIONS.map((opt) => {
                          const selected = preferredStores.includes(opt.id);
                          return (
                            <button
                              key={opt.id}
                              onClick={() => toggleList(opt.id, preferredStores, setPreferredStores)}
                              className={`flex items-center gap-3 p-3 rounded-md border text-left transition-colors ${
                                selected ? "border-primary bg-primary/5" : "border-border hover-elevate"
                              }`}
                              data-testid={`button-store-${opt.id}`}
                            >
                              <Store className={`w-5 h-5 flex-shrink-0 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                              <div className="font-medium text-sm">{opt.label}</div>
                              {selected && <Check className="w-4 h-4 text-primary ml-auto flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div>
                      <h2 className="text-xl font-semibold mb-1">UPF strictness</h2>
                      <p className="text-sm text-muted-foreground mb-4">How strictly do you want to avoid ultra-processed foods?</p>
                      <div className="grid grid-cols-1 gap-3">
                        {UPF_OPTIONS.map((opt) => {
                          const Icon = opt.icon;
                          const selected = upfSensitivity === opt.id;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => setUpfSensitivity(opt.id)}
                              className={`flex items-center gap-3 p-4 rounded-md border text-left transition-colors ${
                                selected ? "border-primary bg-primary/5" : "border-border hover-elevate"
                              }`}
                              data-testid={`button-upf-${opt.id}`}
                            >
                              <Icon className={`w-5 h-5 flex-shrink-0 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-sm">{opt.label}</div>
                                <div className="text-xs text-muted-foreground">{opt.desc}</div>
                              </div>
                              {selected && <Check className="w-4 h-4 text-primary ml-auto flex-shrink-0" />}
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
                {step < 4 && (
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
                  ) : step === 4 ? (
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
  );
}
