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
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : users_list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users_list.map((u) => {
                const currentTier = pendingTiers[u.id] ?? u.subscriptionTier;
                const isDirty = pendingTiers[u.id] !== undefined && pendingTiers[u.id] !== u.subscriptionTier;
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
    </div>
  );
}
