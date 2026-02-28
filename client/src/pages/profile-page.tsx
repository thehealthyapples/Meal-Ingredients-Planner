import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User, Heart, Home, Flame, Target, Settings, Shield,
  Plus, Minus, Save, Activity, Scale, Ruler,
  Baby, PersonStanding, Users, Apple, TrendingUp,
  Volume2, Scan, Loader2, ArrowLeft, Check, Store,
  PiggyBank, ShieldAlert, Sparkles, Ban, Mail
} from "lucide-react";
import { apiRequest, queryClient as qc } from "@/lib/queryClient";
import { DIET_PATTERNS, DIET_RESTRICTIONS, EATING_SCHEDULES } from "@/lib/diets";

interface ProfileData {
  id: number;
  username: string;
  displayName: string;
  profilePhotoUrl: string | null;
  measurementPreference: string;
  isBetaUser: boolean;
  dietPattern: string | null;
  dietRestrictions: string[];
  eatingSchedule: string | null;
  preferences: any;
  health: {
    bmi: number | null;
    bmiCategory: string;
    dailyCalories: number | null;
    calculatedCalories: number | null;
    heightCm: number | null;
    weightKg: number | null;
    activityLevel: string;
    goalType: string;
  };
  household: {
    adultsCount: number;
    childrenCount: number;
    babiesCount: number;
  };
}

type GoalType = "lose" | "maintain" | "build" | "health";
type ActivityLevel = "low" | "moderate" | "high";

const GOALS: { value: GoalType; label: string }[] = [
  { value: "lose", label: "Lose weight" },
  { value: "maintain", label: "Maintain weight" },
  { value: "build", label: "Build muscle" },
  { value: "health", label: "Improve health" },
];

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
];

const HEALTH_GOALS = [
  { id: "eat-healthier", label: "Eat Healthier" },
  { id: "avoid-upf", label: "Avoid Ultra-Processed" },
  { id: "save-money", label: "Save Money" },
  { id: "build-muscle", label: "Build Muscle" },
  { id: "lose-weight", label: "Lose Weight" },
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
  { id: "strict", label: "Strict", desc: "Avoid all ultra-processed foods" },
  { id: "moderate", label: "Moderate", desc: "Limit most UPF items" },
  { id: "flexible", label: "Flexible", desc: "Occasional UPF is fine" },
];

export default function ProfilePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", "/api/profile", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/profile"], data);
      toast({ title: "Saved", description: "Your profile has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" });
    },
  });

  const saveField = (field: string, value: any, isPreference = true) => {
    if (isPreference) {
      updateMutation.mutate({ preferences: { [field]: value } });
    } else {
      updateMutation.mutate({ [field]: value });
    }
  };

  const savePreferences = (prefs: Record<string, any>) => {
    updateMutation.mutate({ preferences: prefs });
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Unable to load profile.</p>
      </div>
    );
  }

  const prefs = profile.preferences || {};

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4" data-testid="page-profile">
      <div className="flex items-center gap-3 mb-2">
          <Button
            variant="ghost"
            size="icon"
            data-testid="button-back-profile"
            onClick={() => {
              const prev = sessionStorage.getItem("profileReturnPath");
              if (prev) {
                sessionStorage.removeItem("profileReturnPath");
                window.location.href = prev;
              } else {
                window.history.back();
              }
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        <h1 className="text-xl font-semibold" data-testid="text-profile-title">Profile</h1>
      </div>

      <ProfileHeader
        profile={profile}
        onSave={(field, value) => saveField(field, value, false)}
      />

      <HealthSnapshot profile={profile} />

      <HouseholdSettings
        household={profile.household}
        onSave={(prefs) => savePreferences(prefs)}
      />

      <CalorieSettings
        profile={profile}
        onSave={(prefs) => savePreferences(prefs)}
      />

      <GoalsPreferences
        profile={profile}
        onSave={(data) => updateMutation.mutate(data)}
      />

      <ShoppingPreferences
        prefs={prefs}
        onSave={(prefs) => savePreferences(prefs)}
      />

      <ContactSection />

      <MealPlanSection />

      <FeatureToggles
        prefs={prefs}
        onToggle={(field, value) => saveField(field, value)}
      />

      <AccountSettings profile={profile} />
    </div>
  );
}

function ProfileHeader({ profile, onSave }: { profile: ProfileData; onSave: (field: string, value: any) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.displayName);

  const userInitial = (profile.displayName || profile.username || "U").charAt(0).toUpperCase();

  return (
    <Card className="p-5" data-testid="card-profile-header">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16" data-testid="avatar-profile">
          <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
            {userInitial}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="max-w-[200px]"
                data-testid="input-display-name"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  onSave("displayName", name);
                  setEditing(false);
                }}
                data-testid="button-save-name"
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold truncate" data-testid="text-display-name">
                {profile.displayName}
              </h2>
              <p className="text-sm text-muted-foreground" data-testid="text-username">
                @{profile.username}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 text-xs text-muted-foreground"
            onClick={() => { setEditing(!editing); setName(profile.displayName); }}
            data-testid="button-edit-name"
          >
            {editing ? "Cancel" : "Edit name"}
          </Button>
        </div>

        <div className="text-right shrink-0">
          <div className="flex items-center gap-0.5 justify-end" data-testid="display-apple-rating">
            {[1, 2, 3, 4, 5].map((i) => (
              <Apple
                key={i}
                className={`h-4 w-4 ${i <= 3 ? "text-green-500 fill-green-500" : "text-muted-foreground/30"}`}
              />
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">The Healthy Apples Score</p>
        </div>
      </div>
    </Card>
  );
}

function HealthSnapshot({ profile }: { profile: ProfileData }) {
  const { bmi, bmiCategory, dailyCalories, activityLevel } = profile.health;

  const bmiColor = !bmi ? "text-muted-foreground" :
    bmiCategory === "Healthy" ? "text-green-600 dark:text-green-400" :
    bmiCategory === "Underweight" || bmiCategory === "Overweight" ? "text-amber-600 dark:text-amber-400" :
    "text-red-600 dark:text-red-400";

  const activityLabel = activityLevel === "high" ? "High" : activityLevel === "low" ? "Low" : "Moderate";
  const activityColor = activityLevel === "moderate" || activityLevel === "high"
    ? "text-green-600 dark:text-green-400"
    : "text-amber-600 dark:text-amber-400";

  return (
    <Card className="p-5" data-testid="card-health-snapshot">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Health Snapshot</h3>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div data-testid="metric-bmi">
          <p className={`text-2xl font-bold ${bmiColor}`}>{bmi ?? "—"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">BMI</p>
          <p className={`text-[11px] font-medium ${bmiColor}`}>{bmiCategory || "Not set"}</p>
        </div>
        <div data-testid="metric-calories">
          <p className="text-2xl font-bold text-foreground">
            {dailyCalories ? dailyCalories.toLocaleString() : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">kcal / day</p>
          <p className="text-[11px] font-medium text-green-600 dark:text-green-400">
            {dailyCalories ? "Target aligned" : "Not set"}
          </p>
        </div>
        <div data-testid="metric-activity">
          <p className={`text-2xl font-bold ${activityColor}`}>{activityLabel}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Activity</p>
          <p className={`text-[11px] font-medium ${activityColor}`}>
            {activityLevel === "moderate" || activityLevel === "high" ? "Optimal" : "Could improve"}
          </p>
        </div>
      </div>
    </Card>
  );
}

function HouseholdSettings({ household, onSave }: { household: ProfileData["household"]; onSave: (prefs: any) => void }) {
  const [adults, setAdults] = useState(household.adultsCount);
  const [children, setChildren] = useState(household.childrenCount);
  const [babies, setBabies] = useState(household.babiesCount);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setAdults(household.adultsCount);
    setChildren(household.childrenCount);
    setBabies(household.babiesCount);
    setDirty(false);
  }, [household.adultsCount, household.childrenCount, household.babiesCount]);

  const adjust = (setter: (v: number) => void, current: number, delta: number, min = 0) => {
    const next = Math.max(min, current + delta);
    setter(next);
    setDirty(true);
  };

  const save = () => {
    onSave({ adultsCount: adults, childrenCount: children, babiesCount: babies });
    setDirty(false);
  };

  return (
    <Card className="p-5" data-testid="card-household">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Home className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Household</h3>
        </div>
        {dirty && (
          <Button size="sm" onClick={save} data-testid="button-save-household">
            <Save className="h-3.5 w-3.5 mr-1" /> Save
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <CounterRow icon={<Users className="h-4 w-4 text-muted-foreground" />} label="Adults" value={adults} onMinus={() => adjust(setAdults, adults, -1, 1)} onPlus={() => adjust(setAdults, adults, 1)} testId="counter-adults" />
        <CounterRow icon={<PersonStanding className="h-4 w-4 text-sky-500" />} label="Children" value={children} onMinus={() => adjust(setChildren, children, -1)} onPlus={() => adjust(setChildren, children, 1)} testId="counter-children" />
        <CounterRow icon={<Baby className="h-4 w-4 text-pink-500" />} label="Babies" value={babies} onMinus={() => adjust(setBabies, babies, -1)} onPlus={() => adjust(setBabies, babies, 1)} testId="counter-babies" />
      </div>
    </Card>
  );
}

function CounterRow({ icon, label, value, onMinus, onPlus, testId }: {
  icon: React.ReactNode; label: string; value: number;
  onMinus: () => void; onPlus: () => void; testId: string;
}) {
  return (
    <div className="flex items-center justify-between" data-testid={testId}>
      <div className="flex items-center gap-2.5">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={onMinus} data-testid={`button-${testId}-minus`}>
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="w-8 text-center text-sm font-semibold" data-testid={`text-${testId}-value`}>{value}</span>
        <Button variant="outline" size="icon" onClick={onPlus} data-testid={`button-${testId}-plus`}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function CalorieSettings({ profile, onSave }: { profile: ProfileData; onSave: (prefs: any) => void }) {
  const prefs = profile.preferences || {};
  const [mode, setMode] = useState<"auto" | "manual">(prefs.calorieMode || "auto");
  const [manualCal, setManualCal] = useState(prefs.calorieTarget || 2000);
  const [height, setHeight] = useState(profile.health.heightCm || "");
  const [weight, setWeight] = useState(profile.health.weightKg || "");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setMode(prefs.calorieMode || "auto");
    setManualCal(prefs.calorieTarget || 2000);
    setHeight(profile.health.heightCm || "");
    setWeight(profile.health.weightKg || "");
    setDirty(false);
  }, [prefs.calorieMode, prefs.calorieTarget, profile.health.heightCm, profile.health.weightKg]);

  const save = () => {
    const data: any = {
      calorieMode: mode,
      heightCm: height ? Number(height) : null,
      weightKg: weight ? Number(weight) : null,
    };
    if (mode === "manual") data.calorieTarget = manualCal;
    onSave(data);
    setDirty(false);
  };

  return (
    <Card className="p-5" data-testid="card-calorie-settings">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Nutrition Targets</h3>
        </div>
        {dirty && (
          <Button size="sm" onClick={save} data-testid="button-save-calories">
            <Save className="h-3.5 w-3.5 mr-1" /> Save
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              <Ruler className="h-3 w-3 inline mr-1" />Height (cm)
            </Label>
            <Input
              type="number"
              value={height}
              onChange={(e) => { setHeight(e.target.value); setDirty(true); }}
              placeholder="170"
              data-testid="input-height"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              <Scale className="h-3 w-3 inline mr-1" />Weight (kg)
            </Label>
            <Input
              type="number"
              value={weight}
              onChange={(e) => { setWeight(e.target.value); setDirty(true); }}
              placeholder="70"
              data-testid="input-weight"
            />
          </div>
        </div>

        <Separator />

        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Daily Calories</Label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer" data-testid="radio-calorie-auto">
              <input
                type="radio"
                name="calorieMode"
                checked={mode === "auto"}
                onChange={() => { setMode("auto"); setDirty(true); }}
                className="accent-primary"
              />
              <span className="text-sm">Auto calculate (recommended)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer" data-testid="radio-calorie-manual">
              <input
                type="radio"
                name="calorieMode"
                checked={mode === "manual"}
                onChange={() => { setMode("manual"); setDirty(true); }}
                className="accent-primary"
              />
              <span className="text-sm">Set manually</span>
            </label>
          </div>

          {mode === "manual" && (
            <div className="mt-3">
              <Input
                type="number"
                value={manualCal}
                onChange={(e) => { setManualCal(Number(e.target.value)); setDirty(true); }}
                className="max-w-[140px]"
                data-testid="input-manual-calories"
              />
              <p className="text-[11px] text-muted-foreground mt-1">kcal per day</p>
            </div>
          )}

          {mode === "auto" && profile.health.calculatedCalories && (
            <p className="text-xs text-muted-foreground mt-2">
              Calculated: <span className="font-semibold text-foreground">{profile.health.calculatedCalories.toLocaleString()} kcal</span> based on your weight, height, activity level and goal.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

function GoalsPreferences({ profile, onSave }: { profile: ProfileData; onSave: (data: any) => void }) {
  const prefs = profile.preferences || {};
  const [goal, setGoal] = useState<string>(prefs.goalType || profile.health.goalType || "maintain");
  const [activity, setActivity] = useState<string>(prefs.activityLevel || profile.health.activityLevel || "moderate");
  const [dietPattern, setDietPattern] = useState<string | null>(profile.dietPattern ?? null);
  const [dietRestrictions, setDietRestrictions] = useState<string[]>(profile.dietRestrictions ?? []);
  const [eatingSchedule, setEatingSchedule] = useState<string | null>(profile.eatingSchedule ?? null);
  const [healthGoals, setHealthGoals] = useState<string[]>(prefs.healthGoals || []);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setGoal(prefs.goalType || profile.health.goalType || "maintain");
    setActivity(prefs.activityLevel || profile.health.activityLevel || "moderate");
    setDietPattern(profile.dietPattern ?? null);
    setDietRestrictions(profile.dietRestrictions ?? []);
    setEatingSchedule(profile.eatingSchedule ?? null);
    setHealthGoals(prefs.healthGoals || []);
    setDirty(false);
  }, [
    prefs.goalType, prefs.activityLevel, JSON.stringify(prefs.healthGoals),
    profile.health.goalType, profile.health.activityLevel,
    profile.dietPattern, JSON.stringify(profile.dietRestrictions), profile.eatingSchedule,
  ]);

  const toggleRestriction = (r: string) => {
    setDietRestrictions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
    setDirty(true);
  };

  const toggleHealthGoal = (g: string) => {
    setHealthGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
    setDirty(true);
  };

  const save = () => {
    onSave({
      dietPattern: dietPattern ?? null,
      dietRestrictions,
      eatingSchedule: eatingSchedule ?? null,
      preferences: { goalType: goal, activityLevel: activity, healthGoals },
    });
    setDirty(false);
  };

  return (
    <Card className="p-5" data-testid="card-goals">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Goals & Diet</h3>
        </div>
        {dirty && (
          <Button size="sm" onClick={save} data-testid="button-save-goals">
            <Save className="h-3.5 w-3.5 mr-1" /> Save
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Goal</Label>
          <div className="grid grid-cols-2 gap-2">
            {GOALS.map((g) => (
              <Button
                key={g.value}
                variant={goal === g.value ? "default" : "outline"}
                size="sm"
                className="justify-start"
                onClick={() => { setGoal(g.value); setDirty(true); }}
                data-testid={`button-goal-${g.value}`}
              >
                {goal === g.value && <Check className="h-3.5 w-3.5 mr-1.5" />}
                {g.label}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Health goals</Label>
          <div className="flex flex-wrap gap-2">
            {HEALTH_GOALS.map((g) => (
              <Badge
                key={g.id}
                variant={healthGoals.includes(g.id) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleHealthGoal(g.id)}
                data-testid={`badge-health-goal-${g.id}`}
              >
                {healthGoals.includes(g.id) && <Check className="h-3 w-3 mr-1" />}
                {g.label}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Diet pattern</Label>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={!dietPattern ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => { setDietPattern(null); setDirty(true); }}
              data-testid="badge-diet-pattern-none"
            >
              {!dietPattern && <Check className="h-3 w-3 mr-1" />}
              None
            </Badge>
            {DIET_PATTERNS.map((d) => (
              <Badge
                key={d.value}
                variant={dietPattern === d.value ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => { setDietPattern(dietPattern === d.value ? null : d.value); setDirty(true); }}
                data-testid={`badge-diet-pattern-${d.value}`}
              >
                {dietPattern === d.value && <Check className="h-3 w-3 mr-1" />}
                {d.label}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Dietary restrictions</Label>
          <div className="flex flex-wrap gap-2">
            {DIET_RESTRICTIONS.map((r) => (
              <Badge
                key={r.value}
                variant={dietRestrictions.includes(r.value) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleRestriction(r.value)}
                data-testid={`badge-restriction-${r.value}`}
              >
                {dietRestrictions.includes(r.value) && <Check className="h-3 w-3 mr-1" />}
                {r.label}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Eating schedule</Label>
          <div className="flex flex-wrap gap-2">
            {EATING_SCHEDULES.map((s) => (
              <Badge
                key={s.value}
                variant={(eatingSchedule ?? "None") === s.value ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => { setEatingSchedule(s.value === "None" ? null : s.value); setDirty(true); }}
                data-testid={`badge-schedule-${s.value}`}
              >
                {(eatingSchedule ?? "None") === s.value && <Check className="h-3 w-3 mr-1" />}
                {s.label}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Activity level</Label>
          <div className="flex gap-2">
            {ACTIVITY_LEVELS.map((a) => (
              <Button
                key={a.value}
                variant={activity === a.value ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => { setActivity(a.value); setDirty(true); }}
                data-testid={`button-activity-${a.value}`}
              >
                {activity === a.value && <Check className="h-3.5 w-3.5 mr-1" />}
                {a.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function ShoppingPreferences({ prefs, onSave }: { prefs: any; onSave: (prefs: any) => void }) {
  const [budget, setBudget] = useState<string>(prefs.budgetLevel || "standard");
  const [stores, setStores] = useState<string[]>(prefs.preferredStores || []);
  const [upf, setUpf] = useState<string>(prefs.upfSensitivity || "moderate");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setBudget(prefs.budgetLevel || "standard");
    setStores(prefs.preferredStores || []);
    setUpf(prefs.upfSensitivity || "moderate");
    setDirty(false);
  }, [prefs.budgetLevel, JSON.stringify(prefs.preferredStores), prefs.upfSensitivity]);

  const toggleStore = (storeId: string) => {
    setStores(prev => prev.includes(storeId) ? prev.filter(s => s !== storeId) : [...prev, storeId]);
    setDirty(true);
  };

  const save = () => {
    onSave({ budgetLevel: budget, preferredStores: stores, upfSensitivity: upf, qualityPreference: budget });
    setDirty(false);
  };

  return (
    <Card className="p-5" data-testid="card-shopping-prefs">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Shopping & UPF</h3>
        </div>
        {dirty && (
          <Button size="sm" onClick={save} data-testid="button-save-shopping">
            <Save className="h-3.5 w-3.5 mr-1" /> Save
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Budget level</Label>
          <div className="grid grid-cols-2 gap-2">
            {BUDGET_OPTIONS.map((b) => (
              <Button
                key={b.id}
                variant={budget === b.id ? "default" : "outline"}
                size="sm"
                className="justify-start flex-col items-start h-auto py-2"
                onClick={() => { setBudget(b.id); setDirty(true); }}
                data-testid={`button-budget-${b.id}`}
              >
                <span className="flex items-center gap-1.5">
                  {budget === b.id && <Check className="h-3.5 w-3.5" />}
                  {b.label}
                </span>
                <span className="text-[10px] font-normal opacity-70">{b.desc}</span>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Preferred stores</Label>
          <div className="flex flex-wrap gap-2">
            {STORE_OPTIONS.map((s) => (
              <Badge
                key={s.id}
                variant={stores.includes(s.id) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleStore(s.id)}
                data-testid={`badge-store-${s.id}`}
              >
                {stores.includes(s.id) && <Check className="h-3 w-3 mr-1" />}
                {s.label}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">UPF strictness</Label>
          <div className="flex gap-2">
            {UPF_OPTIONS.map((u) => (
              <Button
                key={u.id}
                variant={upf === u.id ? "default" : "outline"}
                size="sm"
                className="flex-1 flex-col items-center h-auto py-2"
                onClick={() => { setUpf(u.id); setDirty(true); }}
                data-testid={`button-upf-${u.id}`}
              >
                <span className="flex items-center gap-1">
                  {upf === u.id && <Check className="h-3.5 w-3.5" />}
                  {u.label}
                </span>
                <span className="text-[10px] font-normal opacity-70">{u.desc}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function ContactSection() {
  const { data: config } = useQuery<{ supportEmail?: string; suggestionsEmail?: string }>({
    queryKey: ["/api/config"],
  });

  const support = config?.supportEmail || "support@thehealthyapples.com";
  const suggestions = config?.suggestionsEmail || "suggestions@thehealthyapples.com";

  return (
    <Card className="p-5" data-testid="card-contact">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Contact</h3>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Support</span>
          <a
            href={`mailto:${support}`}
            className="text-sm text-primary hover:underline font-medium"
            data-testid="link-support-email"
          >
            {support}
          </a>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Suggestions</span>
          <a
            href={`mailto:${suggestions}`}
            className="text-sm text-primary hover:underline font-medium"
            data-testid="link-suggestions-email"
          >
            {suggestions}
          </a>
        </div>
      </div>
    </Card>
  );
}

function MealPlanSection() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleLoad = async () => {
    setLoading(true);
    try {
      const defaultRes = await fetch("/api/plan-templates/default");
      if (!defaultRes.ok) throw new Error("No default template found");
      const { id } = await defaultRes.json();
      const applyRes = await fetch(`/api/plan-templates/${id}/apply?mode=replace`, { method: "POST" });
      if (!applyRes.ok) throw new Error("Failed to apply template");
      const data = await applyRes.json();
      toast({
        title: "Plan loaded!",
        description: `${data.createdCount + data.updatedCount} meals added to your planner.`,
      });
    } catch (err: any) {
      toast({ title: "Failed to load plan", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-5" data-testid="card-meal-plan">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Meal Plan</h3>
      </div>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Load a ready-made 6-week family dinner plan covering all six weeks of your planner. This replaces any dinners currently in your planner.
        </p>
        <Button
          onClick={handleLoad}
          disabled={loading}
          className="w-full"
          data-testid="button-load-family-plan-profile"
        >
          {loading
            ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            : <Sparkles className="h-4 w-4 mr-2" />}
          Load The Healthy Apples Family 6-Week Meal Plan
        </Button>
      </div>
    </Card>
  );
}

function FeatureToggles({ prefs, onToggle }: { prefs: any; onToggle: (field: string, value: boolean) => void }) {
  const toggles = [
    { key: "eliteTrackingEnabled", label: "The Healthy Apples Health Score tracking", icon: Apple, default: true },
    { key: "healthTrendEnabled", label: "The Healthy Apples trend tracking", icon: TrendingUp, default: true },
    { key: "soundEnabled", label: "Sound effects", icon: Volume2, default: true },
    { key: "barcodeScannerEnabled", label: "Barcode scanner", icon: Scan, default: true },
  ];

  return (
    <Card className="p-5" data-testid="card-feature-toggles">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Features</h3>
      </div>

      <div className="space-y-3">
        {toggles.map((t) => {
          const Icon = t.icon;
          const isOn = prefs[t.key] !== undefined ? prefs[t.key] : t.default;
          return (
            <div key={t.key} className="flex items-center justify-between" data-testid={`toggle-${t.key}`}>
              <div className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{t.label}</span>
              </div>
              <Switch
                checked={isOn}
                onCheckedChange={(v) => onToggle(t.key, v)}
                data-testid={`switch-${t.key}`}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function AccountSettings({ profile }: { profile: ProfileData }) {
  const { logout } = useUser();
  const { toast } = useToast();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwState, setPwState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [pwError, setPwError] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (newPassword !== confirmPassword) {
      setPwError("New passwords don't match.");
      return;
    }
    if (newPassword.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }
    setPwState("loading");
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.message || "Something went wrong.");
        setPwState("error");
      } else {
        setPwState("success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowChangePassword(false);
        toast({ title: "Password changed", description: "Your password has been updated successfully." });
      }
    } catch {
      setPwError("Something went wrong. Please try again.");
      setPwState("error");
    }
  };

  return (
    <Card className="p-5" data-testid="card-account">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Account</h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Email / Username</p>
            <p className="text-xs text-muted-foreground">{profile.username}</p>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Measurement system</p>
          <Badge variant="outline">{profile.measurementPreference === "metric" ? "Metric" : "Imperial"}</Badge>
        </div>

        {profile.isBetaUser && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Beta Access</p>
              <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30">Active</Badge>
            </div>
          </>
        )}

        {(profile as any).role === "admin" && (
          <>
            <Separator />
            <div className="flex items-center justify-between" data-testid="row-role">
              <p className="text-sm font-medium">Role</p>
              <Badge className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30" data-testid="badge-role">Admin</Badge>
            </div>
          </>
        )}

        <Separator />
        <div className="flex items-center justify-between" data-testid="row-subscription">
          <p className="text-sm font-medium">Subscription</p>
          {(profile as any).hasPremiumAccess ? (
            <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30" data-testid="badge-subscription-premium">Premium Active</Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground" data-testid="badge-subscription-free">Free</Badge>
          )}
        </div>

        <Separator />

        {!showChangePassword ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => { setShowChangePassword(true); setPwState("idle"); setPwError(""); }}
            data-testid="button-show-change-password"
          >
            Change Password
          </Button>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-3" data-testid="form-change-password">
            <p className="text-sm font-medium">Change Password</p>
            {pwError && (
              <p className="text-xs text-destructive" data-testid="text-pw-error">{pwError}</p>
            )}
            <div className="space-y-1">
              <Label htmlFor="current-password" className="text-xs">Current password</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="Your current password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                data-testid="input-current-password"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-password-profile" className="text-xs">New password</Label>
              <Input
                id="new-password-profile"
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                data-testid="input-new-password-profile"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirm-password-profile" className="text-xs">Confirm new password</Label>
              <Input
                id="confirm-password-profile"
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                data-testid="input-confirm-password-profile"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                className="flex-1"
                disabled={pwState === "loading"}
                data-testid="button-update-password"
              >
                {pwState === "loading" ? "Updating…" : "Update Password"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setShowChangePassword(false); setPwError(""); setPwState("idle"); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}
                data-testid="button-cancel-change-password"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        <Separator />

        <Button
          variant="outline"
          className="w-full text-destructive"
          onClick={() => logout()}
          data-testid="button-logout-profile"
        >
          Sign out
        </Button>
      </div>
    </Card>
  );
}
