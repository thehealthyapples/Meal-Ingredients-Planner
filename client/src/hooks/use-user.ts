import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InsertUser, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

let _userResolveMeasured = false;

function perfMark(name: string) {
  try { performance.mark(name); } catch {}
}

function perfMeasure(name: string, from: string, to: string): number {
  try {
    const m = performance.measure(name, from, to);
    return m.duration;
  } catch { return -1; }
}

export function useUser() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const res = await fetch("/api/user", { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return await res.json();
    },
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !_userResolveMeasured) {
      _userResolveMeasured = true;
      perfMark("THA_USER_RESOLVED");
      const ms = perfMeasure("THA_user_resolve", "THA_APP_START", "THA_USER_RESOLVED");
      if (ms >= 0) {
        console.debug(`[THA perf] user resolved in ${ms.toFixed(0)}ms (authenticated=${!!user})`);
      }
    }
  }, [isLoading, user]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json()).message || "Login failed");
      return await res.json();
    },
    onSuccess: (data) => {
      perfMark("THA_LOGIN_SUCCESS");
      const ms = perfMeasure("THA_login", "THA_APP_START", "THA_LOGIN_SUCCESS");
      if (ms >= 0) console.debug(`[THA perf] login completed in ${ms.toFixed(0)}ms`);

      queryClient.setQueryData(["/api/user"], data);
      toast({ title: "Welcome back" });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      return data;
    },
    onSuccess: (data) => {
      if (data.needsVerification) {
        toast({
          title: "Check your email",
          description: data.message || "Please check your email to verify your account.",
        });
      } else {
        queryClient.setQueryData(["/api/user"], data);
        toast({ title: "Account created" });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
      toast({ title: "Logged out" });
    },
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutate,
    loginError: loginMutation.error,
    register: registerMutation.mutate,
    registerResult: registerMutation.data,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
}
