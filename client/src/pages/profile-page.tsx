import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { useTrackedMutation } from "@/hooks/use-tracked-mutation";
import {
  UnsavedChangesProvider, useUnsavedChangesGuard, useUnsavedSection,
} from "@/hooks/use-unsaved-changes";
import { LoadError } from "@/components/ui/load-error";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  User, Heart, Home, Flame, Target, Settings, Shield,
  Plus, Minus, Save, Activity, Scale, Ruler,
  Baby, PersonStanding, Users, Apple,
  Volume2, Scan, Loader2, Check, Store,
  Sparkles, Mail, Trash2,
  Copy, LogOut, UserMinus, Pencil, X, RefreshCw,
  ChevronDown, MessageSquare,
} from "lucide-react";
import thaAppleSrc from "@/assets/icons/tha-apple.png";
import { cn } from "@/lib/utils";
import { normalizeIngredientKey } from "@shared/normalize";
// CP2 — the ONE closed personality set, shared verbatim with the server's
// Personality Registry. The picker never declares a second list.
import {
  PERSONALITY_IDS,
  PERSONALITY_DISPLAY,
  normalizePersonalityId,
  type PersonalityId,
} from "@shared/companion-personality";
import { WorkspaceHeader, pageContainerClass } from "@/components/workspace-header";
import LearningSignalsPanel from "@/components/LearningSignalsPanel";
import { apiRequest, queryClient as qc } from "@/lib/queryClient";
import { DIET_PATTERNS, DIET_RESTRICTIONS, EATING_SCHEDULES, ONBOARDING_DIET_OPTIONS, ALLERGY_OPTIONS, DIET_PATTERN_OPTIONS, ALLERGY_INTOLERANCE_OPTIONS, formatDietLabel } from "@/lib/diets";
import { GOAL_OPTIONS, STORE_OPTIONS, UPF_OPTIONS, BUDGET_OPTIONS, deriveGoalType } from "@/lib/shared-options";
import type { HouseholdEater } from "@shared/household-eater";

export interface ProfileData {
  id: number;
  username: string;
  firstName: string | null;
  displayName: string;
  profilePhotoUrl: string | null;
  measurementPreference: string;
  isBetaUser: boolean;
  dietPattern: string | null;
  dietRestrictions: string[];
  eatingSchedule: string | null;
  customMetricDefs: Array<{ id: string; name: string; unit: string }>;
  diaryExtraMetrics: string[];
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
    mealMode: string;
    maxExtraPrepMinutes: number | null;
    maxTotalCookTime: number | null;
    preferLessProcessed: boolean;
  };
}

type ActivityLevel = "low" | "moderate" | "high";

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
];

function SectionGroup({
  icon,
  title,
  defaultExpanded,
  children,
  testId,
}: {
  icon: React.ReactNode;
  title: string;
  defaultExpanded: boolean;
  children: React.ReactNode;
  testId?: string;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <div data-testid={testId}>
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-muted/35 hover:bg-muted/55 transition-colors group"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {title}
          </span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && <div className="space-y-3 sm:space-y-4 mt-2">{children}</div>}
    </div>
  );
}

function SettingRow({
  label,
  summary,
  children,
  testId,
}: {
  label: string;
  summary: string;
  children: React.ReactNode;
  testId?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div data-testid={testId}>
      <button
        type="button"
        className="w-full flex items-center justify-between py-3 gap-3 group min-w-0"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        <span className="flex-1 text-sm text-left">{label}</span>
        <span className="text-sm text-muted-foreground shrink-0 truncate max-w-[45%] text-right">{summary || "Not set"}</span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground/40 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="pb-3 pt-0.5">{children}</div>}
    </div>
  );
}

function ProfileSummary({ profile }: { profile: ProfileData }) {
  const prefs = profile.preferences || {};
  const primaryName = profile.firstName || profile.displayName || profile.username;

  const cuisine = profile.dietPattern
    ? (DIET_PATTERNS.find(d => d.value === profile.dietPattern)?.label ?? profile.dietPattern)
    : null;

  const allergies = profile.dietRestrictions.length > 0
    ? profile.dietRestrictions.join(" & ") + " aware"
    : null;

  const { adultsCount, childrenCount, babiesCount } = profile.household;
  const hParts: string[] = [];
  if (adultsCount > 0) hParts.push(`${adultsCount} ${adultsCount === 1 ? "Adult" : "Adults"}`);
  if (childrenCount > 0) hParts.push(`${childrenCount} ${childrenCount === 1 ? "Child" : "Children"}`);
  if (babiesCount > 0) hParts.push(`${babiesCount} ${babiesCount === 1 ? "Baby" : "Babies"}`);
  const householdLine = hParts.length > 0 ? hParts.join(" • ") : null;

  const activityLevel = prefs.activityLevel || profile.health.activityLevel;
  const activityLabel = activityLevel === "high" ? "Highly Active"
    : activityLevel === "low" ? "Low Activity"
    : "Moderately Active";

  const lines = [cuisine, allergies, householdLine, activityLabel].filter(Boolean) as string[];

  if (lines.length === 0) return null;

  return (
    <div className="px-1 flex flex-wrap gap-1.5" data-testid="profile-summary">
      {lines.map((line, i) => (
        <span key={i} className="text-xs bg-muted/60 text-muted-foreground px-2.5 py-1 rounded-full border border-border/30">
          {line}
        </span>
      ))}
    </div>
  );
}

// PX1-W0 (fnd-px-persistence-model-split). Profile is the ONLY surface in THA with a
// dirty→Save model, and it carries four independent dirty flags behind four separate
// Save buttons. Everywhere else in the product commits on interaction. So a household
// that has learned — correctly, everywhere else — that THA saves as you go edits two
// sections, presses one Save, leaves, and silently loses the other. There was no
// `beforeunload` and no route guard anywhere in the client.
//
// The save model is NOT redesigned here (that is a UI decision, and W0 does not make
// UI decisions). The four sections keep their Saves; they now declare their unsaved
// state to one registry, and this page will not let the household leave without being
// asked. The provider must sit above the sections, hence the split.
export default function ProfilePage() {
  return (
    <UnsavedChangesProvider>
      <ProfilePageContent />
    </UnsavedChangesProvider>
  );
}

function ProfilePageContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showHouseholdManagement, setShowHouseholdManagement] = useState(false);
  const unsaved = useUnsavedChangesGuard();

  const { data: profile, isPending, isError, refetch } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
  });

  // PX1-W0 (fnd-px-technical-errors-to-household). This used to toast `err.message`
  // verbatim — and `err.message` is `${status}: ${body}`. A household saving their
  // profile was shown "Couldn't save changes / 500: Internal Server Error". The
  // status code goes to the console, where it is useful; the household gets plain
  // words, what it means for their data, and one way forward (EXP §14).
  const updateMutation = useTrackedMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(`${res.status}: ${body.message || res.statusText}`);
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/profile"], data);
    },
    onError: (err: Error) => {
      console.error("[profile] save failed", err);
    },
    feedback: {
      success: "Profile saved",
      failure: "Couldn't save your changes",
      failureDescription: "Your edits are still on screen — nothing has been lost. Please try again.",
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

  // PX1-W4.5 (fnd-px-back-three-mechanisms): Back is the canonical header slot,
  // resolving the hierarchy parent (EXP §8 — hierarchy over history). The old
  // implementation did `window.location.href` — a full page reload that discarded
  // the TanStack cache — falling back to `window.history.back()`; its
  // `profileReturnPath` sessionStorage read had no writer anywhere in the client.
  // The unsaved-changes guard (PX1-W0) still runs before every leave.
  const back = {
    href: "/home",
    beforeNavigate: (proceed: () => void) => unsaved.guard(proceed),
  };

  const unsavedDialog = (
    <AlertDialog open={unsaved.isPrompting} onOpenChange={(open) => { if (!open) unsaved.stay(); }}>
      <AlertDialogContent data-testid="dialog-unsaved-changes">
        <AlertDialogHeader>
          <AlertDialogTitle>You have changes you haven't saved</AlertDialogTitle>
          <AlertDialogDescription>
            Some of what you've edited hasn't been saved yet. If you leave now, those changes
            will be lost. Each section on this page saves separately — look for the Save button
            in the section you changed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={unsaved.stay} data-testid="button-unsaved-stay">
            Stay and save
          </AlertDialogCancel>
          <AlertDialogAction onClick={unsaved.leave} data-testid="button-unsaved-leave">
            Leave without saving
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (isPending) {
    return (
      <>
      <WorkspaceHeader realm="diary" title="Profile" wide back={back} />
      <div className={`${pageContainerClass(true)} space-y-4`}>
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
      </>
    );
  }

  if (isError || !profile) {
    return (
      <>
      <WorkspaceHeader realm="diary" title="Profile" wide back={back} />
      {/* PX1-W0: "Unable to load profile." said nothing about what it meant or what to
          do next. The canonical LoadError does both, and offers the way forward. */}
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <LoadError what="your profile" onRetry={() => refetch()} data-testid="error-profile" />
      </div>
      </>
    );
  }

  const prefs = profile.preferences || {};

  return (
    <>
    {unsavedDialog}
    <WorkspaceHeader
      realm="diary"
      title="Profile"
      wide
      back={back}
      contextBar={
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-0.5 rounded-lg bg-muted/50 p-1 border border-border/40">
            {(
              [
                { id: "section-personal", label: "Personal" },
                { id: "section-household", label: "Household" },
                { id: "section-account", label: "Account" },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  document.querySelector(`[data-testid="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background/70 transition-all shrink-0"
                data-testid={`tab-profile-${id}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      }
    />
    <div className={`${pageContainerClass(true)} main-safe space-y-4 sm:space-y-6`} data-testid="page-profile">

      <ProfileHeader
        profile={profile}
        onSave={(field, value) => saveField(field, value, false)}
      />

      <ProfileSummary profile={profile} />

      {/* ─── PERSONAL ─────────────────────────────────────────── */}
      <SectionGroup
        icon={<Target className="h-4 w-4" />}
        title="Personal"
        defaultExpanded={true}
        testId="section-personal"
      >
        <GoalsPreferences
          profile={profile}
          onSave={(data) => updateMutation.mutate(data)}
          showDiet={true}
        />
        <ShoppingPreferences
          prefs={prefs}
          onSave={(prefs) => savePreferences(prefs)}
        />
        <MealPlanSection />
        <CompanionVoiceSettings
          prefs={prefs}
          onSelect={(personalityId) => saveField("companionPersonality", personalityId)}
        />
        <FeatureToggles
          prefs={prefs}
          onToggle={(field, value) => saveField(field, value)}
        />
      </SectionGroup>

      {/* ─── HOUSEHOLD ────────────────────────────────────────── */}
      <SectionGroup
        icon={<Home className="h-4 w-4" />}
        title="Household"
        defaultExpanded={true}
        testId="section-household"
      >
        <HouseholdSettings
          household={profile.household}
          onSave={(prefs) => savePreferences(prefs)}
        />
        <HouseholdEatersSection />

        {/* PHASE5C — Household Learning feedback, mounted at the placement
            LearningSignalsPanel itself declares: the Household section of Profile.
            Patterns are household-scoped facts (EL1's own householdId ownership),
            so they belong beside the household's other facts.

            EL1 only ever raises a Pattern from REPEATED, CONSISTENT evidence
            (MIN_EVIDENCE_COUNT = 3, MIN_CONSISTENCY = 0.7) — never from a single
            act. Confirming one is the ONLY door through which it becomes Confirmed
            Understanding, the only thing LEARN1 reads back to re-weight what
            surfaces. Declining is equally terminal and equally recorded. Nothing
            here changes a preference or a restriction by itself. */}
        <LearningSignalsPanel data-testid="panel-household-learning" />

        {/* Manage Household — secondary, collapsed by default */}
        <div>
          <button
            type="button"
            className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
            onClick={() => setShowHouseholdManagement(v => !v)}
            aria-expanded={showHouseholdManagement}
            data-testid="button-toggle-household-management"
          >
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Manage Household</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${showHouseholdManagement ? "rotate-180" : ""}`}
            />
          </button>
          {showHouseholdManagement && (
            <div className="mt-3">
              <HouseholdManagementSection currentUserId={profile.id} />
            </div>
          )}
        </div>
      </SectionGroup>

      {/* ─── SETTINGS & SUPPORT ───────────────────────────────── */}
      <SectionGroup
        icon={<Shield className="h-4 w-4" />}
        title="Settings & Support"
        defaultExpanded={false}
        testId="section-account"
      >
        <AccountSettings profile={profile} />
        <ContactSection />
      </SectionGroup>

    </div>
    </>
  );
}

function ProfileHeader({ profile, onSave }: { profile: ProfileData; onSave: (field: string, value: any) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.firstName || "");

  const primaryName = profile.firstName || profile.displayName || profile.username;
  const userInitial = primaryName.charAt(0).toUpperCase();
  const isEmailUsername = profile.username.includes("@");
  const subtitleText = isEmailUsername ? profile.username : `@${profile.username}`;

  const commitEdit = () => {
    onSave("firstName", name.trim() || null);
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditing(false);
    setName(profile.firstName || "");
  };

  return (
    <Card className="p-4 sm:p-5" data-testid="card-profile-header">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <Avatar className="h-14 w-14 shrink-0" data-testid="avatar-profile">
          <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
            {userInitial}
          </AvatarFallback>
        </Avatar>

        {/* Name area - stable height whether editing or not */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-1.5">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your first name"
                aria-label="First name"
                className="h-8 text-sm max-w-[180px] min-w-0"
                autoFocus
                data-testid="input-first-name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitEdit();
                  if (e.key === "Escape") cancelEdit();
                }}
              />
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={commitEdit} aria-label="Save name" data-testid="button-save-name">
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={cancelEdit} aria-label="Cancel editing name" data-testid="button-cancel-name">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <h2 className="text-lg font-semibold truncate" data-testid="text-display-name">
                {primaryName}
              </h2>
              <button
                onClick={() => setEditing(true)}
                className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                aria-label="Edit name"
                data-testid="button-edit-name"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          {/* Username / email - tiny, faded, always rendered so layout doesn't shift */}
          <p className="text-xs text-muted-foreground/45 truncate mt-0.5 leading-tight" data-testid="text-username">
            {editing ? "\u00A0" : subtitleText}
          </p>
        </div>

        {/* Single THA apple mark */}
        <div className="shrink-0 flex flex-col items-center gap-1" data-testid="display-apple-mark">
          <img
            src={thaAppleSrc}
            alt="The Healthy Apples"
            className="h-10 w-10 object-contain opacity-75"
          />
          <p className="text-[10px] text-muted-foreground/50 leading-tight text-center">THA</p>
        </div>
      </div>
    </Card>
  );
}

export function HealthSnapshot({ profile }: { profile: ProfileData }) {
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
    <Card className="p-4 sm:p-5" data-testid="card-health-snapshot">
      <div className="flex items-center gap-2 mb-3">
        <Heart className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Health Snapshot</h3>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div data-testid="metric-bmi">
          <p className={`text-2xl font-semibold ${bmiColor}`}>{bmi ?? "-"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">BMI</p>
          <p className={`text-xs font-medium ${bmiColor}`}>{bmiCategory || "Not set"}</p>
        </div>
        <div data-testid="metric-calories">
          <p className="text-2xl font-semibold text-foreground">
            {dailyCalories ? dailyCalories.toLocaleString() : "-"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">kcal / day</p>
          <p className="text-xs font-medium text-green-600 dark:text-green-400">
            {dailyCalories ? "Target aligned" : "Not set"}
          </p>
        </div>
        <div data-testid="metric-activity">
          <p className={`text-2xl font-semibold ${activityColor}`}>{activityLabel}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Activity</p>
          <p className={`text-xs font-medium ${activityColor}`}>
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
  const [mealMode, setMealMode] = useState(household.mealMode ?? "exact");
  const [maxExtraPrep, setMaxExtraPrep] = useState<string>(household.maxExtraPrepMinutes != null ? String(household.maxExtraPrepMinutes) : "");
  const [maxCookTime, setMaxCookTime] = useState<string>(household.maxTotalCookTime != null ? String(household.maxTotalCookTime) : "");
  const [preferLessProcessed, setPreferLessProcessed] = useState(household.preferLessProcessed ?? false);
  const [dirty, setDirty] = useState(false);
  // PX1-W0 (fnd-px-persistence-model-split): this section keeps its own dirty flag
  // and its own Save button. It now DECLARES that state, so the page can ask before
  // the household walks away from work THIS section is still holding.
  useUnsavedSection("household", dirty);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setAdults(household.adultsCount);
    setChildren(household.childrenCount);
    setBabies(household.babiesCount);
    setMealMode(household.mealMode ?? "exact");
    setMaxExtraPrep(household.maxExtraPrepMinutes != null ? String(household.maxExtraPrepMinutes) : "");
    setMaxCookTime(household.maxTotalCookTime != null ? String(household.maxTotalCookTime) : "");
    setPreferLessProcessed(household.preferLessProcessed ?? false);
    setDirty(false);
  }, [household.adultsCount, household.childrenCount, household.babiesCount, household.mealMode, household.maxExtraPrepMinutes, household.maxTotalCookTime, household.preferLessProcessed]);

  const adjust = (setter: (v: number) => void, current: number, delta: number, min = 0) => {
    const next = Math.max(min, current + delta);
    setter(next);
    setDirty(true);
  };

  const save = () => {
    onSave({
      adultsCount: adults,
      childrenCount: children,
      babiesCount: babies,
      mealMode,
      maxExtraPrepMinutes: maxExtraPrep !== "" ? parseInt(maxExtraPrep, 10) : null,
      maxTotalCookTime: maxCookTime !== "" ? parseInt(maxCookTime, 10) : null,
      preferLessProcessed,
    });
    setDirty(false);
  };

  const hParts: string[] = [];
  if (adults > 0) hParts.push(`${adults} ${adults === 1 ? "Adult" : "Adults"}`);
  if (children > 0) hParts.push(`${children} ${children === 1 ? "Child" : "Children"}`);
  if (babies > 0) hParts.push(`${babies} ${babies === 1 ? "Baby" : "Babies"}`);
  const mealModeLabel = mealMode === "exact" ? "Same Recipe" : "Shared + Swaps";

  return (
    <Card className="p-4 sm:p-5" data-testid="card-household">
      {/* Summary row — tap to expand editing controls */}
      <button
        type="button"
        className="w-full flex items-center justify-between py-2.5 gap-3 group min-w-0"
        onClick={() => setSettingsOpen(v => !v)}
        aria-expanded={settingsOpen}
        data-testid="button-toggle-household-settings"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Home className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="text-left min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{hParts.join(" · ") || "No members set"}</p>
            <p className="text-xs text-muted-foreground">{mealModeLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {dirty && (
            <Button variant="default" size="sm" onClick={e => { e.stopPropagation(); save(); }} data-testid="button-save-household" className="h-7 px-2 text-xs">
              <Save className="h-3 w-3 mr-1" /> Save
            </Button>
          )}
          <ChevronDown className={`h-4 w-4 text-muted-foreground/40 transition-transform duration-200 ${settingsOpen ? "rotate-180" : ""}`} />
        </div>
      </button>

      {settingsOpen && (
        <div className="space-y-3 pt-3 mt-2 border-t border-border/40">
          <CounterRow icon={<Users className="h-4 w-4 text-muted-foreground" />} label="Adults" value={adults} onMinus={() => adjust(setAdults, adults, -1, 1)} onPlus={() => adjust(setAdults, adults, 1)} testId="counter-adults" />
          <CounterRow icon={<PersonStanding className="h-4 w-4 text-sky-500" />} label="Children" value={children} onMinus={() => adjust(setChildren, children, -1)} onPlus={() => adjust(setChildren, children, 1)} testId="counter-children" />
          <CounterRow icon={<Baby className="h-4 w-4 text-pink-500" />} label="Babies" value={babies} onMinus={() => adjust(setBabies, babies, -1)} onPlus={() => adjust(setBabies, babies, 1)} testId="counter-babies" />

          <Separator className="my-1" />

          <div>
            <p className="text-xs text-muted-foreground mb-2">Shared meal style</p>
            <div className="flex gap-2">
              {[
                { value: "exact", label: "Same recipe" },
                { value: "shared-with-swaps", label: "Shared + swaps" },
              ].map((opt) => (
                <Button
                  key={opt.value}
                  size="sm"
                  variant={mealMode === opt.value ? "default" : "outline"}
                  className="text-xs flex-1"
                  onClick={() => { setMealMode(opt.value); setDirty(true); }}
                  data-testid={`button-meal-mode-${opt.value}`}
                >
                  {mealMode === opt.value && <Check className="h-3 w-3 mr-1" />}
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="input-max-extra-prep" className="text-xs text-muted-foreground">Max extra prep (min)</Label>
              <Input
                id="input-max-extra-prep"
                type="number"
                min={0}
                placeholder="-"
                value={maxExtraPrep}
                onChange={(e) => { setMaxExtraPrep(e.target.value); setDirty(true); }}
                className="mt-1 h-8 text-sm"
                data-testid="input-max-extra-prep"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="input-max-cook-time" className="text-xs text-muted-foreground">Max cook time (min)</Label>
              <Input
                id="input-max-cook-time"
                type="number"
                min={0}
                placeholder="-"
                value={maxCookTime}
                onChange={(e) => { setMaxCookTime(e.target.value); setDirty(true); }}
                className="mt-1 h-8 text-sm"
                data-testid="input-max-cook-time"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="prefer-less-processed" className="text-sm cursor-pointer">Prefer less processed foods</Label>
            <Switch
              id="prefer-less-processed"
              checked={preferLessProcessed}
              onCheckedChange={(v) => { setPreferLessProcessed(v); setDirty(true); }}
              data-testid="switch-prefer-less-processed"
            />
          </div>
        </div>
      )}
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
        <Button variant="outline" size="icon" onClick={onMinus} aria-label={`Decrease ${label.toLowerCase()}`} data-testid={`button-${testId}-minus`}>
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="w-8 text-center text-sm font-semibold" data-testid={`text-${testId}-value`}>{value}</span>
        <Button variant="outline" size="icon" onClick={onPlus} aria-label={`Increase ${label.toLowerCase()}`} data-testid={`button-${testId}-plus`}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

interface HouseholdData {
  id: number;
  name: string;
  inviteCode: string;
  myRole: string;
  members: { userId: number; displayName: string; role: string; status: string }[];
}

function HouseholdManagementSection({ currentUserId }: { currentUserId: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [joinCode, setJoinCode] = useState("");
  const [showJoin, setShowJoin] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  const { data: household, isPending: isLoading } = useQuery<HouseholdData>({
    queryKey: ["/api/household"],
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/household"] });

  const joinMutation = useMutation({
    mutationFn: (inviteCode: string) => apiRequest("POST", "/api/household/join", { inviteCode }),
    onSuccess: () => { toast({ title: "Joined household" }); setJoinCode(""); setShowJoin(false); invalidate(); },
    onError: (err: any) => toast({ variant: "destructive", title: "Could not join", description: err?.message || "Invalid invite code." }),
  });

  const leaveMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/household/leave"),
    onSuccess: () => { toast({ title: "Left household" }); setShowLeaveConfirm(false); invalidate(); },
    onError: (err: any) => toast({ variant: "destructive", title: "Could not leave", description: err?.message || "Failed to leave household." }),
  });

  const renameMutation = useMutation({
    mutationFn: (name: string) => apiRequest("PATCH", "/api/household", { name }),
    onSuccess: () => { toast({ title: "Household renamed" }); setEditingName(false); invalidate(); },
    onError: (err: any) => toast({ variant: "destructive", title: "Could not rename", description: err?.message || "Failed to rename household." }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => apiRequest("DELETE", `/api/household/members/${userId}`),
    onSuccess: () => { toast({ title: "Member removed" }); invalidate(); },
    onError: (err: any) => toast({ variant: "destructive", title: "Could not remove member", description: err?.message || "Failed to remove member." }),
  });

  const copyInviteCode = () => {
    if (!household) return;
    navigator.clipboard.writeText(household.inviteCode).then(() => {
      toast({ title: "Invite code copied", description: household.inviteCode });
    });
  };

  const isOwner = household?.myRole === "owner";

  if (isLoading) {
    return (
      <Card className="p-4 sm:p-5">
        <Skeleton className="h-4 w-40 mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </Card>
    );
  }

  if (!household) return null;

  return (
    <Card className="p-4 sm:p-5 space-y-4 sm:space-y-5" data-testid="card-household-management">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Household Management</h3>
        <Badge variant="secondary" className="ml-auto text-xs capitalize" data-testid="badge-my-role">{household.myRole}</Badge>
      </div>

      {/* Household Name */}
      <div>
        {editingName && isOwner ? (
          <div className="flex gap-2 items-center">
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="h-8 text-sm"
              placeholder="Household name"
              aria-label="Household name"
              data-testid="input-household-name"
              onKeyDown={e => { if (e.key === "Enter") renameMutation.mutate(newName.trim()); if (e.key === "Escape") setEditingName(false); }}
            />
            <Button variant="default" size="sm" onClick={() => renameMutation.mutate(newName.trim())} disabled={renameMutation.isPending || !newName.trim()} aria-label="Save household name" data-testid="button-rename-confirm">
              {renameMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingName(false)} aria-label="Cancel renaming household" data-testid="button-rename-cancel"><X className="h-3.5 w-3.5" /></Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" data-testid="text-household-name">{household.name}</span>
            {isOwner && (
              <button
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => { setNewName(household.name); setEditingName(true); }}
                aria-label="Edit household name"
                data-testid="button-rename-household"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Invite Code */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Invite code - share this to invite someone to your household</p>
        <div className="flex items-center gap-2">
          <code className="bg-muted px-3 py-1.5 rounded text-sm font-mono tracking-wider min-w-0 flex-1 break-all" data-testid="text-invite-code">{household.inviteCode}</code>
          <Button size="sm" variant="outline" onClick={copyInviteCode} data-testid="button-copy-invite-code" className="shrink-0">
            <Copy className="h-3.5 w-3.5 mr-1" /> Copy
          </Button>
        </div>
      </div>

      {/* Members */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">Members</p>
        {household.members.map(member => (
          <div key={member.userId} className="flex items-center gap-3" data-testid={`row-member-${member.userId}`}>
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {(member.displayName || "?").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" data-testid={`text-member-name-${member.userId}`}>{member.displayName}</p>
            </div>
            <Badge variant={member.role === "owner" ? "default" : "secondary"} className="text-xs capitalize shrink-0">{member.role}</Badge>
            {isOwner && member.userId !== currentUserId && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                onClick={() => removeMemberMutation.mutate(member.userId)}
                disabled={removeMemberMutation.isPending}
                aria-label={`Remove ${member.displayName} from household`}
                data-testid={`button-remove-member-${member.userId}`}
              >
                <UserMinus className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Shared vs Private info */}
      <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 px-4 py-3 text-xs">
        <div>
          <p className="font-semibold text-foreground mb-1">Shared with household</p>
          <ul className="text-muted-foreground space-y-0.5">
            <li>Planner</li>
            <li>Shopping basket</li>
            <li>Pantry</li>
            <li>Freezer meals</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">Stays private</p>
          <ul className="text-muted-foreground space-y-0.5">
            <li>Goals</li>
            <li>Preferences</li>
            <li>Health data</li>
          </ul>
        </div>
      </div>

      <Separator />

      {/* Join household */}
      {!showJoin ? (
        <Button variant="outline" size="sm" className="w-full" onClick={() => setShowJoin(true)} data-testid="button-show-join">
          Join a different household
        </Button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Enter an invite code to join another household. Your current household data will remain behind.</p>
          <div className="flex gap-2">
            <Input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="INVITE CODE"
              aria-label="Invite code"
              className="h-8 text-sm font-mono tracking-wider uppercase"
              data-testid="input-join-code"
              onKeyDown={e => { if (e.key === "Enter") joinMutation.mutate(joinCode.trim()); if (e.key === "Escape") setShowJoin(false); }}
            />
            <Button variant="default" size="sm" onClick={() => joinMutation.mutate(joinCode.trim())} disabled={joinMutation.isPending || !joinCode.trim()} data-testid="button-join-household">
              {joinMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Join"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowJoin(false)} aria-label="Cancel joining household" data-testid="button-cancel-join"><X className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      )}

      {/* Leave household */}
      {!showLeaveConfirm ? (
        <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive" onClick={() => setShowLeaveConfirm(true)} data-testid="button-leave-household">
          <LogOut className="h-3.5 w-3.5 mr-1.5" /> Leave household
        </Button>
      ) : (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
          <p className="text-sm text-destructive font-medium">Leave this household?</p>
          <p className="text-xs text-muted-foreground">You'll be moved to a new solo household. Your personal data stays with you; shared household data stays here.</p>
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" onClick={() => leaveMutation.mutate()} disabled={leaveMutation.isPending} data-testid="button-confirm-leave">
              {leaveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm leave"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowLeaveConfirm(false)} data-testid="button-cancel-leave">Cancel</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Household Eaters Section ────────────────────────────────────────────────

const DIET_OPTIONS_FOR_EATER = DIET_PATTERN_OPTIONS;

function EaterForm({
  displayName, setDisplayName,
  selectedDiets, toggleDiet,
  selectedRestrictions, toggleRestriction,
}: {
  displayName: string; setDisplayName: (v: string) => void;
  selectedDiets: string[]; toggleDiet: (v: string) => void;
  selectedRestrictions: string[]; toggleRestriction: (v: string) => void;
}) {
  return (
    <div className="space-y-4 py-1">
      <div className="space-y-1.5">
        <Label htmlFor="eater-name" className="text-sm">Name</Label>
        <Input
          id="eater-name"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="e.g. Lily"
          className="h-8 text-sm"
          data-testid="input-eater-name"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm">Diet (optional)</Label>
        <div className="flex flex-wrap gap-1.5">
          {DIET_OPTIONS_FOR_EATER.map(opt => (
            <button key={opt.value} type="button" onClick={() => toggleDiet(opt.value)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${selectedDiets.includes(opt.value) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-foreground"}`}
              data-testid={`toggle-diet-${opt.value}`}>{opt.label}</button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm">Allergies &amp; intolerances (optional)</Label>
        <div className="flex flex-wrap gap-1.5">
          {ALLERGY_INTOLERANCE_OPTIONS.map(opt => (
            <button key={opt.value} type="button" onClick={() => toggleRestriction(opt.value)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${selectedRestrictions.includes(opt.value) ? "bg-destructive text-destructive-foreground border-destructive" : "border-border text-muted-foreground hover:border-foreground"}`}
              data-testid={`toggle-restriction-${opt.value}`}>{opt.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function HouseholdEatersSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // add dialog state
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([]);

  // edit dialog state
  const [editingEater, setEditingEater] = useState<HouseholdEater | null>(null);
  const [editName, setEditName] = useState("");
  const [editDiets, setEditDiets] = useState<string[]>([]);
  const [editRestrictions, setEditRestrictions] = useState<string[]>([]);

  const { data: eaters = [], isPending: isLoading } = useQuery<HouseholdEater[]>({
    queryKey: ["/api/household/eaters"],
  });

  const addMutation = useMutation({
    mutationFn: (body: { displayName: string; defaultDietTypes: string[]; hardRestrictions: string[] }) =>
      apiRequest("POST", "/api/household/eaters", body),
    onSuccess: () => {
      toast({ title: "Child eater added" });
      queryClient.invalidateQueries({ queryKey: ["/api/household/eaters"] });
      setOpen(false);
      setDisplayName("");
      setSelectedDiets([]);
      setSelectedRestrictions([]);
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Could not add eater", description: err?.message || "Please try again." }),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { displayName: string; defaultDietTypes: string[]; hardRestrictions: string[] } }) =>
      apiRequest("PATCH", `/api/household/eaters/${id}`, body),
    onSuccess: () => {
      toast({ title: "Eater updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/household/eaters"] });
      setEditingEater(null);
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Could not update eater", description: err?.message || "Please try again." }),
  });

  const openEdit = (eater: HouseholdEater) => {
    setEditingEater(eater);
    setEditName(eater.displayName);
    setEditDiets([...eater.defaultDietTypes]);
    setEditRestrictions([...eater.hardRestrictions]);
  };

  const toggleDiet = (v: string) =>
    setSelectedDiets(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

  const toggleRestriction = (v: string) =>
    setSelectedRestrictions(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

  const toggleEditDiet = (v: string) =>
    setEditDiets(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

  const toggleEditRestriction = (v: string) =>
    setEditRestrictions(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

  if (isLoading) return null;

  return (
    <>
      <Card className="p-4 sm:p-5 space-y-3 sm:space-y-4" data-testid="card-household-eaters">
        <div className="flex items-center gap-2 min-w-0">
          <Baby className="h-4 w-4 text-muted-foreground shrink-0" />
          <h3 className="text-sm font-medium shrink-0">Household Eaters</h3>
          <span className="text-xs text-muted-foreground min-w-0 truncate">— who gets meals planned for them</span>
        </div>

        {eaters.length === 0 ? (
          <p className="text-xs text-muted-foreground">No eaters yet. Adult members are synced automatically.</p>
        ) : (
          <div className="space-y-2">
            {eaters.map(eater => (
              <div key={eater.id} className="flex items-start gap-3" data-testid={`row-eater-${eater.id}`}>
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  {eater.kind === "child"
                    ? <Baby className="h-3.5 w-3.5 text-muted-foreground" />
                    : <PersonStanding className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" data-testid={`text-eater-name-${eater.id}`}>{eater.displayName}</p>
                  {(eater.defaultDietTypes.length > 0 || eater.hardRestrictions.length > 0) && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {eater.defaultDietTypes.map(diet => (
                        <span key={diet} className="text-xs px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
                          {formatDietLabel(diet)}
                        </span>
                      ))}
                      {eater.hardRestrictions.map(r => (
                        <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 border border-destructive/20 text-destructive">
                          {formatDietLabel(r)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                  <Badge variant={eater.kind === "child" ? "secondary" : "outline"} className="text-xs capitalize">
                    {eater.kind}
                  </Badge>
                  {eater.kind === "child" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => openEdit(eater)}
                      data-testid={`button-edit-eater-${eater.id}`}
                      aria-label={`Edit ${eater.displayName}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => setOpen(true)}
          data-testid="button-add-child-eater"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add child eater
        </Button>
      </Card>

      {/* Add dialog */}
      <Dialog open={open} onOpenChange={v => { if (!v) { setOpen(false); setDisplayName(""); setSelectedDiets([]); setSelectedRestrictions([]); } }}>
        <DialogContent className="max-w-sm" data-testid="dialog-add-child-eater">
          <DialogHeader>
            <DialogTitle>Add child eater</DialogTitle>
            <DialogDescription>Add a child or household member without an account.</DialogDescription>
          </DialogHeader>
          <EaterForm
            displayName={displayName} setDisplayName={setDisplayName}
            selectedDiets={selectedDiets} toggleDiet={toggleDiet}
            selectedRestrictions={selectedRestrictions} toggleRestriction={toggleRestriction}
          />
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="default"
              size="sm"
              disabled={!displayName.trim() || addMutation.isPending}
              onClick={() => addMutation.mutate({ displayName: displayName.trim(), defaultDietTypes: selectedDiets, hardRestrictions: selectedRestrictions })}
              data-testid="button-confirm-add-eater"
            >
              {addMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingEater} onOpenChange={v => { if (!v) setEditingEater(null); }}>
        <DialogContent className="max-w-sm" data-testid="dialog-edit-child-eater">
          <DialogHeader>
            <DialogTitle>Edit child eater</DialogTitle>
            <DialogDescription>Update name and dietary preferences.</DialogDescription>
          </DialogHeader>
          <EaterForm
            displayName={editName} setDisplayName={setEditName}
            selectedDiets={editDiets} toggleDiet={toggleEditDiet}
            selectedRestrictions={editRestrictions} toggleRestriction={toggleEditRestriction}
          />
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setEditingEater(null)}>Cancel</Button>
            <Button variant="default"
              size="sm"
              disabled={!editName.trim() || editMutation.isPending}
              onClick={() => editingEater && editMutation.mutate({ id: editingEater.id, body: { displayName: editName.trim(), defaultDietTypes: editDiets, hardRestrictions: editRestrictions } })}
              data-testid="button-confirm-edit-eater"
            >
              {editMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CalorieSettings({ profile, onSave }: { profile: ProfileData; onSave: (prefs: any) => void }) {
  const prefs = profile.preferences || {};
  const [mode, setMode] = useState<"auto" | "manual">(prefs.calorieMode || "auto");
  const [manualCal, setManualCal] = useState(prefs.calorieTarget || 2000);
  const [height, setHeight] = useState(profile.health.heightCm || "");
  const [weight, setWeight] = useState(profile.health.weightKg || "");
  const [dirty, setDirty] = useState(false);
  // PX1-W0 (fnd-px-persistence-model-split): this section keeps its own dirty flag
  // and its own Save button. It now DECLARES that state, so the page can ask before
  // the household walks away from work THIS section is still holding.
  useUnsavedSection("calories", dirty);

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
    <Card className="p-4 sm:p-5" data-testid="card-calorie-settings">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Nutrition Targets</h3>
        </div>
        {dirty && (
          <Button variant="default" size="sm" onClick={save} data-testid="button-save-calories">
            <Save className="h-3.5 w-3.5 mr-1" /> Save
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="input-height" className="text-xs text-muted-foreground mb-1 block">
              <Ruler className="h-3 w-3 inline mr-1" />Height (cm)
            </Label>
            <Input
              id="input-height"
              type="number"
              value={height}
              onChange={(e) => { setHeight(e.target.value); setDirty(true); }}
              placeholder="170"
              data-testid="input-height"
            />
          </div>
          <div>
            <Label htmlFor="input-weight" className="text-xs text-muted-foreground mb-1 block">
              <Scale className="h-3 w-3 inline mr-1" />Weight (kg)
            </Label>
            <Input
              id="input-weight"
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
                aria-label="Daily calorie target"
                className="max-w-[140px]"
                data-testid="input-manual-calories"
              />
              <p className="text-xs text-muted-foreground mt-1">kcal per day</p>
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

export function GoalsPreferences({ profile, onSave, showDiet = true }: { profile: ProfileData; onSave: (data: any) => void; showDiet?: boolean }) {
  const prefs = profile.preferences || {};
  const [activity, setActivity] = useState<string>(prefs.activityLevel || profile.health.activityLevel || "moderate");
  const [dietPattern, setDietPattern] = useState<string | null>(profile.dietPattern ?? null);
  const [dietRestrictions, setDietRestrictions] = useState<string[]>(profile.dietRestrictions ?? []);
  const [eatingSchedule, setEatingSchedule] = useState<string | null>(profile.eatingSchedule ?? null);
  const [healthGoals, setHealthGoals] = useState<string[]>(prefs.healthGoals || []);
  const [dirty, setDirty] = useState(false);
  // PX1-W0 (fnd-px-persistence-model-split): this section keeps its own dirty flag
  // and its own Save button. It now DECLARES that state, so the page can ask before
  // the household walks away from work THIS section is still holding.
  useUnsavedSection("goals", dirty);

  useEffect(() => {
    setActivity(prefs.activityLevel || profile.health.activityLevel || "moderate");
    setDietPattern(profile.dietPattern ?? null);
    setDietRestrictions(profile.dietRestrictions ?? []);
    setEatingSchedule(profile.eatingSchedule ?? null);
    setHealthGoals(prefs.healthGoals || []);
    setDirty(false);
  }, [
    prefs.activityLevel, JSON.stringify(prefs.healthGoals),
    profile.health.activityLevel,
    profile.dietPattern, JSON.stringify(profile.dietRestrictions), profile.eatingSchedule,
  ]);

  const toggleRestriction = (r: string) => {
    setDietRestrictions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
    setDirty(true);
  };

  const toggleGoal = (g: string) => {
    setHealthGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
    setDirty(true);
  };

  const save = () => {
    onSave({
      dietPattern: dietPattern ?? null,
      dietRestrictions,
      eatingSchedule: eatingSchedule ?? null,
      preferences: { goalType: deriveGoalType(healthGoals), activityLevel: activity, healthGoals },
    });
    setDirty(false);
  };

  // Summary text for each setting row
  const cuisineSummary = dietPattern
    ? (DIET_PATTERNS.find(d => d.value === dietPattern)?.label ?? dietPattern)
    : "No preference";
  const allergiesSummary = dietRestrictions.length > 0 ? dietRestrictions.join(", ") : "None";
  const scheduleSummary = (eatingSchedule && eatingSchedule !== "None")
    ? (EATING_SCHEDULES.find(s => s.value === eatingSchedule)?.label ?? eatingSchedule)
    : "No preference";
  const activitySummary = activity === "high" ? "High" : activity === "low" ? "Low" : "Moderate";
  const goalsSummary = healthGoals.length > 0
    ? healthGoals.map(id => GOAL_OPTIONS.find(g => g.id === id)?.label).filter(Boolean).join(", ")
    : "None set";

  return (
    <Card className="p-4 sm:p-5" data-testid="card-goals">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">{showDiet ? "Dietary Pattern" : "Goals"}</h3>
        </div>
        {dirty && (
          <Button variant="default" size="sm" onClick={save} data-testid="button-save-goals">
            <Save className="h-3.5 w-3.5 mr-1" /> Save
          </Button>
        )}
      </div>

      <div className="divide-y divide-border/40">
        {showDiet && (
          <>
            <SettingRow label="Dietary Pattern" summary={cuisineSummary} testId="row-cuisine">
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge
                  variant={!dietPattern ? "default" : "outline"}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer"
                  onClick={() => { setDietPattern(null); setDirty(true); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      if (e.key === " ") e.preventDefault();
                      setDietPattern(null); setDirty(true);
                    }
                  }}
                  data-testid="badge-diet-pattern-none"
                >
                  {!dietPattern && <Check className="h-3 w-3 mr-1" />}
                  None
                </Badge>
                {DIET_PATTERNS.map((d) => (
                  <Badge
                    key={d.value}
                    variant={dietPattern === d.value ? "default" : "outline"}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer"
                    onClick={() => { setDietPattern(dietPattern === d.value ? null : d.value); setDirty(true); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        if (e.key === " ") e.preventDefault();
                        setDietPattern(dietPattern === d.value ? null : d.value); setDirty(true);
                      }
                    }}
                    data-testid={`badge-diet-pattern-${d.value}`}
                  >
                    {dietPattern === d.value && <Check className="h-3 w-3 mr-1" />}
                    {d.label}
                  </Badge>
                ))}
              </div>
            </SettingRow>

            <SettingRow label="Allergies & Intolerances" summary={allergiesSummary} testId="row-allergies">
              <div className="flex flex-wrap gap-2 pt-1">
                {ALLERGY_INTOLERANCE_OPTIONS.map((r) => (
                  <Badge
                    key={r.value}
                    variant={dietRestrictions.includes(r.value) ? "default" : "outline"}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer"
                    onClick={() => toggleRestriction(r.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        if (e.key === " ") e.preventDefault();
                        toggleRestriction(r.value);
                      }
                    }}
                    data-testid={`badge-restriction-${r.value}`}
                  >
                    {dietRestrictions.includes(r.value) && <Check className="h-3 w-3 mr-1" />}
                    {r.label}
                  </Badge>
                ))}
              </div>
            </SettingRow>

            <SettingRow label="Eating Schedule" summary={scheduleSummary} testId="row-eating-schedule">
              <div className="flex flex-wrap gap-2 pt-1">
                {EATING_SCHEDULES.map((s) => (
                  <Badge
                    key={s.value}
                    variant={(eatingSchedule ?? "None") === s.value ? "default" : "outline"}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer"
                    onClick={() => { setEatingSchedule(s.value === "None" ? null : s.value); setDirty(true); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        if (e.key === " ") e.preventDefault();
                        setEatingSchedule(s.value === "None" ? null : s.value); setDirty(true);
                      }
                    }}
                    data-testid={`badge-schedule-${s.value}`}
                  >
                    {(eatingSchedule ?? "None") === s.value && <Check className="h-3 w-3 mr-1" />}
                    {s.label}
                  </Badge>
                ))}
              </div>
            </SettingRow>
          </>
        )}

        <SettingRow label="Activity Level" summary={activitySummary} testId="row-activity">
          <div className="flex gap-2 pt-1">
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
        </SettingRow>

        <SettingRow label="Goals" summary={goalsSummary} testId="row-goals">
          <div className="flex flex-wrap gap-2 pt-1" data-testid="goals-content">
            {GOAL_OPTIONS.map((g) => {
              const Icon = g.icon;
              const selected = healthGoals.includes(g.id);
              return (
                <Badge
                  key={g.id}
                  variant={selected ? "default" : "outline"}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer flex items-center gap-1"
                  onClick={() => toggleGoal(g.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      if (e.key === " ") e.preventDefault();
                      toggleGoal(g.id);
                    }
                  }}
                  data-testid={`badge-goal-${g.id}`}
                >
                  <Icon className="h-3 w-3" />
                  {g.label}
                  {selected && <Check className="h-3 w-3 ml-0.5" />}
                </Badge>
              );
            })}
          </div>
        </SettingRow>
      </div>
    </Card>
  );
}

function ShoppingPreferences({ prefs, onSave }: { prefs: any; onSave: (prefs: any) => void }) {
  const [budget, setBudget] = useState<string>(prefs.budgetLevel || "standard");
  const [stores, setStores] = useState<string[]>(prefs.preferredStores || []);
  const [upf, setUpf] = useState<string>(prefs.upfSensitivity || "moderate");
  const [dirty, setDirty] = useState(false);
  // PX1-W0 (fnd-px-persistence-model-split): this section keeps its own dirty flag
  // and its own Save button. It now DECLARES that state, so the page can ask before
  // the household walks away from work THIS section is still holding.
  useUnsavedSection("shopping", dirty);

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

  const budgetSummary = BUDGET_OPTIONS.find(b => b.id === budget)?.label ?? "Balanced";
  const storesSummary = stores.length > 0
    ? stores.map(id => STORE_OPTIONS.find(s => s.id === id)?.label).filter(Boolean).join(", ")
    : "No preference";
  const upfSummary = UPF_OPTIONS.find(u => u.id === upf)?.label ?? "Moderate";

  return (
    <Card className="p-4 sm:p-5" data-testid="card-shopping-prefs">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Shopping & UPF</h3>
        </div>
        {dirty && (
          <Button variant="default" size="sm" onClick={save} data-testid="button-save-shopping">
            <Save className="h-3.5 w-3.5 mr-1" /> Save
          </Button>
        )}
      </div>

      <div className="divide-y divide-border/40">
        <SettingRow label="Budget" summary={budgetSummary} testId="row-budget">
          <div className="pt-2 grid grid-cols-2 gap-2">
            {BUDGET_OPTIONS.map((b) => (
              <Button
                key={b.id}
                variant={budget === b.id ? "default" : "outline"}
                size="sm"
                className="justify-start flex-col items-start h-auto py-2 min-w-0 overflow-hidden"
                onClick={() => { setBudget(b.id); setDirty(true); }}
                data-testid={`button-budget-${b.id}`}
              >
                <span className="flex items-center gap-1.5 w-full min-w-0">
                  {budget === b.id && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                  <span className="whitespace-normal break-words leading-tight">{b.label}</span>
                </span>
                <span className="text-[10px] font-normal opacity-70 whitespace-normal break-words leading-tight w-full">{b.desc}</span>
              </Button>
            ))}
          </div>
        </SettingRow>

        <SettingRow label="Preferred Stores" summary={storesSummary} testId="row-stores">
          <div className="pt-2 flex flex-wrap gap-2">
            {STORE_OPTIONS.map((s) => (
              <Badge
                key={s.id}
                variant={stores.includes(s.id) ? "default" : "outline"}
                role="button"
                tabIndex={0}
                className="cursor-pointer"
                onClick={() => toggleStore(s.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (e.key === " ") e.preventDefault();
                    toggleStore(s.id);
                  }
                }}
                data-testid={`badge-store-${s.id}`}
              >
                {stores.includes(s.id) && <Check className="h-3 w-3 mr-1" />}
                {s.label}
              </Badge>
            ))}
          </div>
        </SettingRow>

        <SettingRow label="UPF Preference" summary={upfSummary} testId="row-upf">
          <div className="pt-2 grid grid-cols-3 gap-2">
            {UPF_OPTIONS.map((u) => {
              const Icon = u.icon;
              return (
                <Button
                  key={u.id}
                  variant={upf === u.id ? "default" : "outline"}
                  size="sm"
                  className="flex-col items-center h-auto py-2.5 px-2 gap-1 min-w-0 overflow-hidden"
                  onClick={() => { setUpf(u.id); setDirty(true); }}
                  data-testid={`button-upf-${u.id}`}
                >
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="text-[10px] font-medium leading-tight text-center break-words whitespace-normal w-full line-clamp-2">{u.label}</span>
                  {upf === u.id && <Check className="h-3 w-3 flex-shrink-0" />}
                </Button>
              );
            })}
          </div>
        </SettingRow>
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
    <Card className="p-4 sm:p-5" data-testid="card-contact">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Contact</h3>
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className="text-sm text-muted-foreground shrink-0">Support</span>
          <a
            href={`mailto:${support}`}
            className="text-sm text-primary hover:underline font-medium break-all"
            data-testid="link-support-email"
          >
            {support}
          </a>
        </div>
        <Separator />
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className="text-sm text-muted-foreground shrink-0">Suggestions</span>
          <a
            href={`mailto:${suggestions}`}
            className="text-sm text-primary hover:underline font-medium break-all"
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
      // PX1-W0 (fnd-px-technical-errors-to-household): forwarded the raw response body.
      console.error("[profile:load-plan]", err);
      toast({ title: "Couldn't load that plan", description: "Your planner is unchanged. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 sm:p-5" data-testid="card-meal-plan">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Meal Plan</h3>
      </div>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Load a ready-made 6-week family dinner plan covering all six weeks of your planner. This replaces any dinners currently in your planner.
        </p>
        <Button variant="default"
          onClick={handleLoad}
          disabled={loading}
          className="w-full whitespace-normal h-auto py-3"
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
    { key: "soundEnabled", label: "Sound effects", icon: Volume2, default: true },
    { key: "barcodeScannerEnabled", label: "Barcode scanner", icon: Scan, default: true },
  ];

  return (
    <Card className="p-4 sm:p-5" data-testid="card-feature-toggles">
      <div className="flex items-center gap-2 mb-3">
        <Settings className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Features</h3>
      </div>

      <div className="space-y-3">
        {toggles.map((t) => {
          const Icon = t.icon;
          const isOn = prefs[t.key] !== undefined ? prefs[t.key] : t.default;
          return (
            <div key={t.key} className="flex items-center justify-between gap-3" data-testid={`toggle-${t.key}`}>
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <label htmlFor={`feature-toggle-${t.key}`} className="text-sm leading-snug">{t.label}</label>
              </div>
              <Switch
                id={`feature-toggle-${t.key}`}
                checked={isOn}
                onCheckedChange={(v) => onToggle(t.key, v)}
                data-testid={`switch-${t.key}`}
                className="shrink-0"
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/**
 * CP2 — the Companion voice picker.
 *
 * The list, the display names and the descriptions all come from
 * `shared/companion-personality.ts`, the one closed set shared verbatim with
 * the server's Personality Registry. This component holds no second list, and
 * it never renders a voice's phrasing — the registry owns every word the
 * Companion says, and the Behaviour Engine is the only thing allowed to say it.
 *
 * Choosing a voice changes HOW the Companion speaks, never what it knows, what
 * it can do, or what it will ask you to confirm (INT21 §5.2). The copy below
 * says so, because a user who believed otherwise would be misled.
 */
function CompanionVoiceSettings({
  prefs,
  onSelect,
}: {
  prefs: any;
  onSelect: (personalityId: PersonalityId) => void;
}) {
  const selected: PersonalityId = normalizePersonalityId(prefs?.companionPersonality);

  return (
    <Card className="p-4 sm:p-5" data-testid="card-companion-voice">
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Companion voice</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Changes how Apple talks to you. Same answers, same data, same checks before anything changes.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {PERSONALITY_IDS.map((id) => {
          const display = PERSONALITY_DISPLAY[id];
          const isSelected = id === selected;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              aria-pressed={isSelected}
              className={cn(
                "text-left rounded-lg border p-3 transition-colors",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border/60 hover:bg-muted/50",
              )}
              data-testid={`button-companion-voice-${id}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{display.displayName}</span>
                {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                {display.description}
              </p>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function AccountSettings({ profile }: { profile: ProfileData }) {
  const { logout } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwState, setPwState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [pwError, setPwError] = useState("");
  const [showPrefsConfirm, setShowPrefsConfirm] = useState(false);

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
        toast({ title: "Password changed" });
      }
    } catch {
      setPwError("Something went wrong. Please try again.");
      setPwState("error");
    }
  };

  return (
    <Card className="p-4 sm:p-5" data-testid="card-account">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Account</h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <p className="text-sm font-medium">Email / Username</p>
            <p className="text-xs text-muted-foreground break-all">{profile.username}</p>
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
              <Button variant="default"
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
          className="w-full"
          onClick={() => setShowPrefsConfirm(true)}
          data-testid="button-update-preferences"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Update my preferences
        </Button>

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

      <Dialog open={showPrefsConfirm} onOpenChange={setShowPrefsConfirm}>
        <DialogContent className="sm:max-w-sm" data-testid="dialog-update-preferences">
          <DialogHeader>
            <DialogTitle>Update your preferences?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground mt-1">
                <p>You'll go back through your setup questions so you can review or change your food and shopping preferences.</p>
                <p>Your current answers will be reused where available.</p>
                <p>No unrelated account data will be removed.</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowPrefsConfirm(false)}
              data-testid="button-cancel-update-preferences"
            >
              Cancel
            </Button>
            <Button variant="default"
              onClick={() => {
                setShowPrefsConfirm(false);
                setLocation("/onboarding");
              }}
              data-testid="button-confirm-update-preferences"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
