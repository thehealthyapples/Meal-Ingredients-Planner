/**
 * admin-banner.tsx — ADMIN1D Admin Domain Navigation
 * ===================================================
 * The shared Admin-domain header rendered above the Admin hub and every Admin
 * sub-page. It gives the Admin domain a consistent identity and a persistent
 * cross-navigation bar between the existing Admin pages (no more browser-back /
 * URL-retyping to move around admin-land — see AUDIT1 §F3).
 *
 * Self-gating: renders nothing unless the current user is an admin, so it is
 * inert if ever mounted for a non-admin (e.g. above a NotFound guard). It links
 * only to already-registered Admin routes; it creates no routes and owns no auth.
 */

import { Link, useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import {
  ShieldCheck, LayoutGrid, Users, Star, Sliders, Sparkles, BarChart3, FlaskConical, Activity, ListTree,
} from "lucide-react";

// Existing Admin routes only (registered in App.tsx). Order mirrors the hub cards.
const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: LayoutGrid },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/ingredient-products", label: "Picks", icon: Star },
  { href: "/admin/recipe-sources", label: "Recipe Sources", icon: Sliders },
  { href: "/admin/companion-intelligence", label: "Companion Intelligence", icon: Sparkles },
  { href: "/admin/intelligence", label: "Intelligence Dashboard", icon: BarChart3 },
  { href: "/admin/benchmark-households", label: "Benchmark Households", icon: FlaskConical },
  { href: "/admin/observations", label: "Observations", icon: Activity },
  { href: "/admin/behaviour", label: "Behaviour", icon: ListTree },
] as const;

export function AdminBanner() {
  const [location] = useLocation();
  const { user } = useUser();

  if ((user as any)?.role !== "admin") return null;

  return (
    <div
      className="shrink-0 border-b border-border bg-card/50 backdrop-blur-sm"
      data-testid="admin-banner"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex items-center gap-2 py-2.5">
          <div className="flex items-center gap-2 pr-3 mr-1 border-r border-border shrink-0">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold tracking-tight">Support Hub</span>
          </div>
          <nav className="flex items-center gap-1 overflow-x-auto" data-testid="admin-banner-nav">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-accent text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                  data-testid={`admin-banner-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
