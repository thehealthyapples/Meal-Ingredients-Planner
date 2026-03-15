import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  User, Heart, Home, Flame, Target, Settings, Shield,
  Plus, Minus, Save, Activity, Scale, Ruler,
  Baby, PersonStanding, Users, Apple, TrendingUp,
  Volume2, Scan, Loader2, ArrowLeft, Check, Store,
  Sparkles, Mail, Trash2,
  Copy, LogOut, UserMinus, Pencil, X, RefreshCw
} from "lucide-react";
import thaAppleSrc from "@/assets/icons/tha-apple.png";
import { normalizeIngredientKey } from "@shared/normalize";
import { apiRequest, queryClient as qc } from "@/lib/queryClient";
import { DIET_PATTERNS, DIET_RESTRICTIONS, EATING_SCHEDULES } from "@/lib/diets";
import { GOAL_OPTIONS, STORE_OPTIONS, UPF_OPTIONS, BUDGET_OPTIONS, deriveGoalType } from "@/lib/shared-options";

interface ProfileData {
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

      <HouseholdManagementSection currentUserId={profile.id} />

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
    <Card className="p-5" data-testid="card-profile-header">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <Avatar className="h-14 w-14 shrink-0" data-testid="avatar-profile">
          <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
            {userInitial}
          </AvatarFallback>
        </Avatar>

        {/* Name area — stable height whether editing or not */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-1.5">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your first name"
                className="h-8 text-sm max-w-[180px]"
                autoFocus
                data-testid="input-first-name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitEdit();
                  if (e.key === "Escape") cancelEdit();
                }}
              />
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={commitEdit} data-testid="button-save-name">
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={cancelEdit} data-testid="button-cancel-name">
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
          {/* Username / email — tiny, faded, always rendered so layout doesn't shift */}
          <p className="text-[11px] text-muted-foreground/45 truncate mt-0.5 leading-tight" data-testid="text-username">
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
  const [mealMode, setMealMode] = useState(household.mealMode ?? "exact");
  const [maxExtraPrep, setMaxExtraPrep] = useState<string>(household.maxExtraPrepMinutes != null ? String(household.maxExtraPrepMinutes) : "");
  const [maxCookTime, setMaxCookTime] = useState<string>(household.maxTotalCookTime != null ? String(household.maxTotalCookTime) : "");
  const [preferLessProcessed, setPreferLessProcessed] = useState(household.preferLessProcessed ?? false);
  const [dirty, setDirty] = useState(false);

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
            <Label className="text-xs text-muted-foreground">Max extra prep (min)</Label>
            <Input
              type="number"
              min={0}
              placeholder="—"
              value={maxExtraPrep}
              onChange={(e) => { setMaxExtraPrep(e.target.value); setDirty(true); }}
              className="mt-1 h-8 text-sm"
              data-testid="input-max-extra-prep"
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Max cook time (min)</Label>
            <Input
              type="number"
              min={0}
              placeholder="—"
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

  const { data: household, isLoading } = useQuery<HouseholdData>({
    queryKey: ["/api/household"],
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/household"] });

  const joinMutation = useMutation({
    mutationFn: (inviteCode: string) => apiRequest("POST", "/api/household/join", { inviteCode }),
    onSuccess: () => { toast({ title: "Joined household", description: "You have joined the household." }); setJoinCode(""); setShowJoin(false); invalidate(); },
    onError: (err: any) => toast({ variant: "destructive", title: "Could not join", description: err?.message || "Invalid invite code." }),
  });

  const leaveMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/household/leave"),
    onSuccess: () => { toast({ title: "Left household", description: "You now have your own household." }); setShowLeaveConfirm(false); invalidate(); },
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
      <Card className="p-5">
        <Skeleton className="h-4 w-40 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </Card>
    );
  }

  if (!household) return null;

  return (
    <Card className="p-5 space-y-5" data-testid="card-household-management">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Household Management</h3>
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
              data-testid="input-household-name"
              onKeyDown={e => { if (e.key === "Enter") renameMutation.mutate(newName.trim()); if (e.key === "Escape") setEditingName(false); }}
            />
            <Button size="sm" onClick={() => renameMutation.mutate(newName.trim())} disabled={renameMutation.isPending || !newName.trim()} data-testid="button-rename-confirm">
              {renameMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingName(false)} data-testid="button-rename-cancel"><X className="h-3.5 w-3.5" /></Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" data-testid="text-household-name">{household.name}</span>
            {isOwner && (
              <button
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => { setNewName(household.name); setEditingName(true); }}
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
        <p className="text-xs text-muted-foreground">Invite code — share this to invite someone to your household</p>
        <div className="flex items-center gap-2">
          <code className="bg-muted px-3 py-1.5 rounded text-sm font-mono tracking-wider" data-testid="text-invite-code">{household.inviteCode}</code>
          <Button size="sm" variant="outline" onClick={copyInviteCode} data-testid="button-copy-invite-code">
            <Copy className="h-3.5 w-3.5 mr-1" /> Copy
          </Button>
        </div>
      </div>

      {/* Members */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Members</p>
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
              className="h-8 text-sm font-mono tracking-wider uppercase"
              data-testid="input-join-code"
              onKeyDown={e => { if (e.key === "Enter") joinMutation.mutate(joinCode.trim()); if (e.key === "Escape") setShowJoin(false); }}
            />
            <Button size="sm" onClick={() => joinMutation.mutate(joinCode.trim())} disabled={joinMutation.isPending || !joinCode.trim()} data-testid="button-join-household">
              {joinMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Join"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowJoin(false)} data-testid="button-cancel-join"><X className="h-3.5 w-3.5" /></Button>
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
  const [activity, setActivity] = useState<string>(prefs.activityLevel || profile.health.activityLevel || "moderate");
  const [dietPattern, setDietPattern] = useState<string | null>(profile.dietPattern ?? null);
  const [dietRestrictions, setDietRestrictions] = useState<string[]>(profile.dietRestrictions ?? []);
  const [eatingSchedule, setEatingSchedule] = useState<string | null>(profile.eatingSchedule ?? null);
  const [healthGoals, setHealthGoals] = useState<string[]>(prefs.healthGoals || []);
  const [dirty, setDirty] = useState(false);

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
          <Label className="text-xs text-muted-foreground mb-2 block">Goals</Label>
          <div className="flex flex-wrap gap-2">
            {GOAL_OPTIONS.map((g) => {
              const Icon = g.icon;
              const selected = healthGoals.includes(g.id);
              return (
                <Badge
                  key={g.id}
                  variant={selected ? "default" : "outline"}
                  className="cursor-pointer flex items-center gap-1"
                  onClick={() => toggleGoal(g.id)}
                  data-testid={`badge-goal-${g.id}`}
                >
                  <Icon className="h-3 w-3" />
                  {g.label}
                  {selected && <Check className="h-3 w-3 ml-0.5" />}
                </Badge>
              );
            })}
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
          <div className="grid grid-cols-3 gap-2">
            {UPF_OPTIONS.map((u) => {
              const Icon = u.icon;
              return (
                <Button
                  key={u.id}
                  variant={upf === u.id ? "default" : "outline"}
                  size="sm"
                  className="flex-col items-center h-auto py-2.5 px-2 gap-1 min-w-0"
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
            <Button
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
