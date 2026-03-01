import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronLeft, ChevronRight, ShieldCheck, KeyRound, Eye, EyeOff, Loader2 } from "lucide-react";

type SafeUser = {
  id: number;
  username: string;
  displayName: string | null;
  role: string;
  subscriptionTier: string;
  subscriptionStatus: string | null;
};

type UsersResponse = {
  users: SafeUser[];
  total: number;
  limit: number;
  offset: number;
};

const TIER_LABELS: Record<string, string> = {
  free: "Free",
  premium: "Premium",
  friends_family: "Friends & Family",
};

const TIER_COLORS: Record<string, string> = {
  free: "secondary",
  premium: "default",
  friends_family: "outline",
};

const PAGE_SIZE = 25;

export default function AdminUsersPage() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [searchInput, setSearchInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [offset, setOffset] = useState(0);

  const [pendingTiers, setPendingTiers] = useState<Record<number, string>>({});
  const [confirmDialog, setConfirmDialog] = useState<{ userId: number; username: string; newTier: string } | null>(null);

  const [resetDialog, setResetDialog] = useState<{ userId: number; username: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if ((user as any)?.role !== "admin") {
    setLocation("/");
    return null;
  }

  const queryKey = ["/api/admin/users", { query: activeQuery, limit: PAGE_SIZE, offset }];

  const { data, isLoading } = useQuery<UsersResponse>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        query: activeQuery,
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });
      const res = await fetch(`/api/admin/users?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const tierMutation = useMutation({
    mutationFn: async ({ userId, tier }: { userId: number; tier: string }) => {
      return apiRequest("PUT", `/api/admin/users/${userId}/subscription`, { subscriptionTier: tier });
    },
    onSuccess: (_, { userId, tier }) => {
      toast({ title: "Tier updated", description: `User tier changed to ${TIER_LABELS[tier] ?? tier}` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setPendingTiers(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update tier", description: err.message, variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, password }: { userId: number; password: string }) =>
      apiRequest("POST", `/api/admin/users/${userId}/reset-password`, { newPassword: password }),
    onSuccess: () => {
      toast({ title: "Password reset", description: "The user's password has been updated successfully." });
      closeResetDialog();
    },
    onError: (err: any) => {
      toast({ title: "Reset failed", description: err.message || "Failed to reset password.", variant: "destructive" });
    },
  });

  function handleSearch() {
    setActiveQuery(searchInput.trim());
    setOffset(0);
  }

  function handleSaveTier(u: SafeUser) {
    const newTier = pendingTiers[u.id] ?? u.subscriptionTier;
    setConfirmDialog({ userId: u.id, username: u.username, newTier });
  }

  function confirmTierChange() {
    if (!confirmDialog) return;
    tierMutation.mutate({ userId: confirmDialog.userId, tier: confirmDialog.newTier });
    setConfirmDialog(null);
  }

  function openResetDialog(u: SafeUser) {
    setResetDialog({ userId: u.id, username: u.username });
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
  }

  function closeResetDialog() {
    setResetDialog(null);
    setNewPassword("");
    setConfirmPassword("");
  }

  const passwordsMatch = newPassword === confirmPassword;
  const passwordValid = newPassword.length >= 8;
  const canSubmitReset = passwordValid && passwordsMatch && newPassword.length > 0;

  const total = data?.total ?? 0;
  const users_list = data?.users ?? [];
  const start = offset + 1;
  const end = Math.min(offset + PAGE_SIZE, total);
  const canPrev = offset > 0;
  const canNext = offset + PAGE_SIZE < total;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" data-testid="page-admin-users">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
      </div>

      <div className="flex gap-2 mb-6">
        <Input
          placeholder="Search by email or name..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          className="max-w-sm"
          data-testid="input-user-search"
        />
        <Button onClick={handleSearch} data-testid="button-user-search">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden" data-testid="table-users">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Change Tier</TableHead>
              <TableHead className="w-20">Save</TableHead>
              <TableHead className="w-32">Password</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : users_list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users_list.map((u) => {
                const currentTier = pendingTiers[u.id] ?? u.subscriptionTier;
                const isDirty = pendingTiers[u.id] !== undefined && pendingTiers[u.id] !== u.subscriptionTier;
                const isSelf = u.id === (user as any)?.id;
                return (
                  <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                    <TableCell className="font-mono text-sm">{u.username}</TableCell>
                    <TableCell className="text-muted-foreground">{u.displayName || "—"}</TableCell>
                    <TableCell>
                      {u.role === "admin" ? (
                        <Badge variant="default" className="gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Admin
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">User</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={TIER_COLORS[u.subscriptionTier] as any}>
                        {TIER_LABELS[u.subscriptionTier] ?? u.subscriptionTier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={currentTier}
                        onValueChange={(val) => setPendingTiers(prev => ({ ...prev, [u.id]: val }))}
                        data-testid={`select-tier-${u.id}`}
                      >
                        <SelectTrigger className="w-44" data-testid={`select-tier-trigger-${u.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="friends_family">Friends &amp; Family</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        disabled={!isDirty || tierMutation.isPending}
                        onClick={() => handleSaveTier(u)}
                        data-testid={`button-save-tier-${u.id}`}
                      >
                        Save
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isSelf}
                        onClick={() => openResetDialog(u)}
                        data-testid={`button-reset-password-${u.id}`}
                        title={isSelf ? "Cannot reset your own password here" : "Reset password"}
                      >
                        <KeyRound className="h-3.5 w-3.5 mr-1.5" />
                        Reset
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted-foreground" data-testid="text-pagination-info">
            Showing {start}–{end} of {total} users
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!canPrev}
              onClick={() => setOffset(o => Math.max(0, o - PAGE_SIZE))}
              data-testid="button-prev-page"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canNext}
              onClick={() => setOffset(o => o + PAGE_SIZE)}
              data-testid="button-next-page"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change subscription tier?</AlertDialogTitle>
            <AlertDialogDescription>
              Change <strong>{confirmDialog?.username}</strong>'s tier to{" "}
              <strong>{TIER_LABELS[confirmDialog?.newTier ?? ""] ?? confirmDialog?.newTier}</strong>?
              This will immediately affect what features they can access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmTierChange}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!resetDialog} onOpenChange={(open) => !open && closeResetDialog()}>
        <DialogContent className="sm:max-w-sm" data-testid="dialog-reset-password">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{resetDialog?.username}</strong>.
              They will be able to log in with this password immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="pr-10"
                  data-testid="input-new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  data-testid="button-toggle-password-visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPassword.length > 0 && !passwordValid && (
                <p className="text-xs text-destructive" data-testid="text-password-too-short">Password must be at least 8 characters</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                data-testid="input-confirm-password"
              />
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-xs text-destructive" data-testid="text-passwords-mismatch">Passwords do not match</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeResetDialog} data-testid="button-cancel-reset">
              Cancel
            </Button>
            <Button
              disabled={!canSubmitReset || resetPasswordMutation.isPending}
              onClick={() => resetDialog && resetPasswordMutation.mutate({ userId: resetDialog.userId, password: newPassword })}
              data-testid="button-confirm-reset-password"
            >
              {resetPasswordMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Resetting...</>
              ) : (
                "Reset Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
