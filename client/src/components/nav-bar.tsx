import { useState, useEffect, useRef, createContext, useContext } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard, CalendarDays, ShoppingCart,
  LogOut, ShieldCheck,
  Search, ChevronLeft, ChevronRight,
  Microscope, BookOpen, ChefHat,
  User, BarChart3, Home,
} from "lucide-react";
import { api } from "@shared/routes";
import thaAppleSrc from "@/assets/icons/tha-apple.png";

function PantryIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="1" y1="20" x2="23" y2="20" />
      <rect x="1.5" y="14" width="5" height="6" rx="1" />
      <rect x="2.5" y="12.5" width="3" height="2" rx="0.5" />
      <rect x="9.5" y="11" width="5" height="9" rx="1" />
      <rect x="10.5" y="9.5" width="3" height="2" rx="0.5" />
      <rect x="17" y="13" width="5.5" height="7" rx="1" />
      <rect x="18" y="11.5" width="3" height="2" rx="0.5" />
    </svg>
  );
}

// UX1 — Canonical navigation. ONE ordered list is the single source of truth for
// every navigation surface (the canonical BottomNav on all screen sizes, and the
// retired-but-retained DesktopSidebar kept dormant for safe rollback).
// hasWorkspace: true → repeat-tap on the active page opens that page's workspace drawer.
//
// NORTH1 (2026-07-17) exported it. Home's North Star shows four of the house's rooms as
// doors on the counter, which makes Home a navigation surface — and "ONE ordered list is
// the single source of truth for EVERY navigation surface" is this comment's own rule. A
// second list on Home would have been a second owner of every room's href, label and
// glyph, so Home reads its doors from here (`roomsByHref`) and owns only their
// descriptions. Consumers may read this list; nothing may reorder or fork it.
export const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: Home, hasWorkspace: false },
  { href: "/planner", label: "Planner", icon: CalendarDays, hasWorkspace: true },
  { href: "/cookbook", label: "Cookbook", icon: ChefHat, hasWorkspace: true },
  { href: "/shopping-workspace", label: "Shopping", icon: ShoppingCart, hasWorkspace: false },
  { href: "/pantry", label: "Pantry", icon: PantryIcon, hasWorkspace: true },
  { href: "/nutrition", label: "Nutrition", icon: BarChart3, hasWorkspace: true },
  { href: "/my-diary", label: "Diary", icon: BookOpen, hasWorkspace: true },
  { href: "/analyser", label: "Analyser", icon: Microscope, hasWorkspace: true },
];

export type NavItem = (typeof NAV_ITEMS)[number];

/**
 * The canonical entries for the given hrefs, in the order asked for.
 *
 * Home's doors are a chosen SUBSET in a chosen order, and the choice is Home's to make —
 * but the href, the label and the glyph of each room stay this file's. Throws on an
 * unknown href rather than rendering a door to nowhere: a typo is a broken room, and it
 * should fail where it is written, not in front of a household.
 */
export function roomsByHref(hrefs: readonly string[]): NavItem[] {
  return hrefs.map((href) => {
    const item = NAV_ITEMS.find((i) => i.href === href);
    if (!item) throw new Error(`roomsByHref: no canonical nav item for "${href}"`);
    return item;
  });
}

const REALM_STYLES: Record<string, { active: string; hover: string; inactive: string; mobileActive: string; mobileInactive: string }> = {
  "/home": {
    // orchard/apple green — the calm brand-green home anchor
    active:         "bg-[hsl(132,24%,88%)] text-[hsl(132,36%,20%)] dark:bg-[hsl(132,15%,17%)] dark:text-[hsl(132,26%,70%)]",
    hover:          "hover:bg-[hsl(132,18%,92%)] hover:text-[hsl(132,30%,26%)] dark:hover:bg-[hsl(132,10%,14%)] dark:hover:text-[hsl(132,20%,58%)]",
    inactive:       "bg-[hsl(132,10%,94%)] text-[hsl(132,20%,40%)] dark:bg-[hsl(132,8%,12%)] dark:text-[hsl(132,12%,46%)]",
    mobileActive:   "bg-[hsl(132,24%,86%)] text-[hsl(132,36%,20%)] dark:bg-[hsl(132,15%,19%)] dark:text-[hsl(132,26%,70%)]",
    mobileInactive: "bg-[hsl(132,12%,92%)] text-[hsl(132,18%,42%)] dark:bg-[hsl(132,8%,14%)] dark:text-[hsl(132,10%,44%)]",
  },
  "/dashboard": {
    active:         "bg-[hsl(42,45%,88%)] text-[hsl(42,58%,20%)] dark:bg-[hsl(42,22%,17%)] dark:text-[hsl(42,48%,72%)]",
    hover:          "hover:bg-[hsl(42,38%,93%)] hover:text-[hsl(42,52%,28%)] dark:hover:bg-[hsl(42,14%,14%)] dark:hover:text-[hsl(42,38%,60%)]",
    inactive:       "bg-[hsl(42,26%,94%)] text-[hsl(42,32%,44%)] dark:bg-[hsl(42,12%,12%)] dark:text-[hsl(42,20%,46%)]",
    mobileActive:   "bg-[hsl(42,45%,86%)] text-[hsl(42,58%,20%)] dark:bg-[hsl(42,22%,19%)] dark:text-[hsl(42,48%,72%)]",
    mobileInactive: "bg-[hsl(42,28%,92%)] text-[hsl(42,28%,44%)] dark:bg-[hsl(42,12%,14%)] dark:text-[hsl(42,16%,44%)]",
  },
  "/nutrition": {
    active:         "bg-[hsl(145,22%,88%)] text-[hsl(145,36%,20%)] dark:bg-[hsl(145,14%,17%)] dark:text-[hsl(145,26%,70%)]",
    hover:          "hover:bg-[hsl(145,16%,92%)] hover:text-[hsl(145,30%,26%)] dark:hover:bg-[hsl(145,10%,14%)] dark:hover:text-[hsl(145,20%,58%)]",
    inactive:       "bg-[hsl(145,10%,94%)] text-[hsl(145,20%,42%)] dark:bg-[hsl(145,8%,12%)] dark:text-[hsl(145,12%,46%)]",
    mobileActive:   "bg-[hsl(145,22%,86%)] text-[hsl(145,36%,20%)] dark:bg-[hsl(145,14%,19%)] dark:text-[hsl(145,26%,70%)]",
    mobileInactive: "bg-[hsl(145,12%,92%)] text-[hsl(145,16%,44%)] dark:bg-[hsl(145,8%,14%)] dark:text-[hsl(145,10%,44%)]",
  },
  "/cookbook": {
    // wheat amber - warm baked honey tones
    active:         "bg-[hsl(38,50%,87%)] text-[hsl(38,65%,20%)] dark:bg-[hsl(38,28%,17%)] dark:text-[hsl(38,55%,78%)]",
    hover:          "hover:bg-[hsl(38,42%,92%)] hover:text-[hsl(38,58%,27%)] dark:hover:bg-[hsl(38,22%,14%)] dark:hover:text-[hsl(38,45%,65%)]",
    inactive:       "bg-[hsl(38,28%,94%)] text-[hsl(38,40%,40%)] dark:bg-[hsl(38,15%,12%)] dark:text-[hsl(38,28%,52%)]",
    mobileActive:   "bg-[hsl(38,50%,85%)] text-[hsl(38,65%,20%)] dark:bg-[hsl(38,28%,19%)] dark:text-[hsl(38,55%,78%)]",
    mobileInactive: "bg-[hsl(38,30%,92%)] text-[hsl(38,38%,40%)] dark:bg-[hsl(38,16%,14%)] dark:text-[hsl(38,24%,50%)]",
  },
  "/planner": {
    // teal-green - cooler, clearer separation from pantry
    active:         "bg-[hsl(172,26%,87%)] text-[hsl(172,38%,18%)] dark:bg-[hsl(172,16%,17%)] dark:text-[hsl(172,30%,72%)]",
    hover:          "hover:bg-[hsl(172,20%,92%)] hover:text-[hsl(172,32%,26%)] dark:hover:bg-[hsl(172,12%,14%)] dark:hover:text-[hsl(172,24%,60%)]",
    inactive:       "bg-[hsl(172,14%,94%)] text-[hsl(172,22%,42%)] dark:bg-[hsl(172,8%,12%)] dark:text-[hsl(172,14%,48%)]",
    mobileActive:   "bg-[hsl(172,26%,85%)] text-[hsl(172,38%,18%)] dark:bg-[hsl(172,16%,19%)] dark:text-[hsl(172,30%,72%)]",
    mobileInactive: "bg-[hsl(172,16%,92%)] text-[hsl(172,20%,44%)] dark:bg-[hsl(172,8%,14%)] dark:text-[hsl(172,12%,46%)]",
  },
  "/pantry": {
    // orchard green - warm mid-green, grounded home-storage
    active:         "bg-[hsl(115,22%,88%)] text-[hsl(115,30%,22%)] dark:bg-[hsl(115,15%,17%)] dark:text-[hsl(115,26%,70%)]",
    hover:          "hover:bg-[hsl(115,16%,92%)] hover:text-[hsl(115,26%,28%)] dark:hover:bg-[hsl(115,10%,14%)] dark:hover:text-[hsl(115,20%,58%)]",
    inactive:       "bg-[hsl(115,10%,94%)] text-[hsl(115,20%,40%)] dark:bg-[hsl(115,8%,12%)] dark:text-[hsl(115,14%,46%)]",
    mobileActive:   "bg-[hsl(115,22%,86%)] text-[hsl(115,30%,22%)] dark:bg-[hsl(115,15%,19%)] dark:text-[hsl(115,26%,70%)]",
    mobileInactive: "bg-[hsl(115,12%,92%)] text-[hsl(115,18%,42%)] dark:bg-[hsl(115,8%,14%)] dark:text-[hsl(115,12%,44%)]",
  },
  "/analyser": {
    // warm olive - shifted toward golden-olive for clear separation from pantry
    active:         "bg-[hsl(74,22%,89%)] text-[hsl(74,32%,18%)] dark:bg-[hsl(74,12%,18%)] dark:text-[hsl(74,25%,70%)]",
    hover:          "hover:bg-[hsl(74,16%,93%)] hover:text-[hsl(74,26%,26%)] dark:hover:bg-[hsl(74,8%,15%)] dark:hover:text-[hsl(74,18%,58%)]",
    inactive:       "bg-[hsl(74,10%,94%)] text-[hsl(74,18%,44%)] dark:bg-[hsl(74,6%,12%)] dark:text-[hsl(74,10%,44%)]",
    mobileActive:   "bg-[hsl(74,22%,87%)] text-[hsl(74,32%,18%)] dark:bg-[hsl(74,12%,20%)] dark:text-[hsl(74,25%,70%)]",
    mobileInactive: "bg-[hsl(74,12%,92%)] text-[hsl(74,14%,44%)] dark:bg-[hsl(74,6%,14%)] dark:text-[hsl(74,10%,42%)]",
  },
  "/my-diary": {
    // apple blossom rose - warm muted berry, reflective and gentle
    active:         "bg-[hsl(348,35%,89%)] text-[hsl(348,45%,24%)] dark:bg-[hsl(348,22%,18%)] dark:text-[hsl(348,35%,72%)]",
    hover:          "hover:bg-[hsl(348,26%,93%)] hover:text-[hsl(348,38%,30%)] dark:hover:bg-[hsl(348,16%,15%)] dark:hover:text-[hsl(348,28%,60%)]",
    inactive:       "bg-[hsl(348,16%,94%)] text-[hsl(348,28%,44%)] dark:bg-[hsl(348,10%,12%)] dark:text-[hsl(348,18%,48%)]",
    mobileActive:   "bg-[hsl(348,35%,87%)] text-[hsl(348,45%,24%)] dark:bg-[hsl(348,22%,20%)] dark:text-[hsl(348,35%,72%)]",
    mobileInactive: "bg-[hsl(348,18%,92%)] text-[hsl(348,24%,46%)] dark:bg-[hsl(348,10%,14%)] dark:text-[hsl(348,14%,44%)]",
  },
  "/shopping-workspace": {
    // market teal - fresh, operational, in-store feel
    active:         "bg-[hsl(190,30%,88%)] text-[hsl(190,42%,20%)] dark:bg-[hsl(190,18%,17%)] dark:text-[hsl(190,32%,72%)]",
    hover:          "hover:bg-[hsl(190,22%,92%)] hover:text-[hsl(190,34%,28%)] dark:hover:bg-[hsl(190,12%,14%)] dark:hover:text-[hsl(190,22%,60%)]",
    inactive:       "bg-[hsl(190,12%,94%)] text-[hsl(190,22%,42%)] dark:bg-[hsl(190,8%,12%)] dark:text-[hsl(190,14%,48%)]",
    mobileActive:   "bg-[hsl(190,30%,86%)] text-[hsl(190,42%,20%)] dark:bg-[hsl(190,18%,19%)] dark:text-[hsl(190,32%,72%)]",
    mobileInactive: "bg-[hsl(190,16%,92%)] text-[hsl(190,18%,44%)] dark:bg-[hsl(190,8%,14%)] dark:text-[hsl(190,12%,46%)]",
  },
  "/shopping-list": {
    // soft sage - light, quick-capture feel
    active:         "bg-[hsl(95,22%,88%)] text-[hsl(95,32%,22%)] dark:bg-[hsl(95,14%,17%)] dark:text-[hsl(95,26%,70%)]",
    hover:          "hover:bg-[hsl(95,16%,92%)] hover:text-[hsl(95,26%,28%)] dark:hover:bg-[hsl(95,10%,14%)] dark:hover:text-[hsl(95,18%,58%)]",
    inactive:       "bg-[hsl(95,10%,94%)] text-[hsl(95,20%,42%)] dark:bg-[hsl(95,6%,12%)] dark:text-[hsl(95,12%,46%)]",
    mobileActive:   "bg-[hsl(95,22%,86%)] text-[hsl(95,32%,22%)] dark:bg-[hsl(95,14%,19%)] dark:text-[hsl(95,26%,70%)]",
    mobileInactive: "bg-[hsl(95,12%,92%)] text-[hsl(95,16%,44%)] dark:bg-[hsl(95,6%,14%)] dark:text-[hsl(95,10%,44%)]",
  },
};

export type SidebarContextValue = { isCollapsed: boolean };
export const SidebarContext = createContext<SidebarContextValue>({ isCollapsed: false });
export const useSidebar = () => useContext(SidebarContext);

export interface AppRealmContextValue { realm: string; setRealm: (r: string) => void; }
export const AppRealmContext = createContext<AppRealmContextValue>({ realm: "home", setRealm: () => {} });
export function useAppRealm() { return useContext(AppRealmContext); }

function useSidebarState() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try { return localStorage.getItem("sidebar-collapsed") === "true"; } catch { return false; }
  });
  const toggle = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem("sidebar-collapsed", String(next)); } catch {}
      return next;
    });
  };
  return { isCollapsed, toggle };
}

function useNavData() {
  const { user, logout } = useUser();
  const { data: shoppingListItems = [] } = useQuery<any[]>({
    queryKey: [api.shoppingList.list.path],
    enabled: !!user,
  });
  const { data: config } = useQuery<{ supportEmail?: string; suggestionsEmail?: string }>({
    queryKey: ["/api/config"],
    enabled: !!user,
  });
  return {
    user,
    logout,
    itemCount: shoppingListItems.length,
    support: config?.supportEmail || "support@thehealthyapples.com",
    isAdmin: (user as any)?.role === "admin",
    userInitial: (user?.username || "U").charAt(0).toUpperCase(),
  };
}

function SidebarNavItem({
  href, label, icon: Icon, isCollapsed, isActive, onClick, badge,
}: {
  href: string; label: string; icon: React.ComponentType<{ className?: string }>;
  isCollapsed: boolean; isActive: boolean; onClick?: () => void; badge?: number;
}) {
  const realm = REALM_STYLES[href.split("?")[0]];
  const linkEl = (
    <Link
      href={href}
      onClick={onClick}
      className={`relative flex items-center gap-3 w-full rounded-lg text-sm transition-colors ${
        isCollapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
      } ${
        isActive
          ? realm
            ? `${realm.active} font-medium`
            : "bg-accent text-primary font-medium"
          : realm
            ? `${realm.inactive} ${realm.hover}`
            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
      }`}
      data-testid={`sidebar-nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <span className="relative flex items-center justify-center min-w-[24px] flex-shrink-0">
        <Icon className="h-4 w-4" />
        {badge != null && badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-0.5 leading-none">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </span>
      {!isCollapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
        <TooltipContent side="right">
          {label}{badge != null && badge > 0 ? ` (${badge})` : ""}
        </TooltipContent>
      </Tooltip>
    );
  }
  return linkEl;
}

function SidebarBody({
  isCollapsed, location, isAdmin, support, onClose, onSearchOpen, itemCount, logout,
}: {
  isCollapsed: boolean; location: string; isAdmin: boolean;
  support: string; onClose?: () => void;
  onSearchOpen: () => void; itemCount: number;
  logout: () => void;
}) {
  const logoutBtn = (
    <button
      onClick={() => { onClose?.(); logout(); }}
      className={`flex items-center gap-3 w-full rounded-lg text-sm transition-colors text-muted-foreground hover:bg-destructive/10 hover:text-destructive ${
        isCollapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
      }`}
      data-testid="sidebar-button-logout"
      aria-label="Log out"
    >
      <span className="flex items-center justify-center min-w-[24px] flex-shrink-0">
        <LogOut className="h-4 w-4" />
      </span>
      {!isCollapsed && <span className="truncate">Log out</span>}
    </button>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 py-3">
      {/* Main nav */}
      <nav className="flex flex-col gap-0.5 px-2 flex-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            isCollapsed={isCollapsed}
            isActive={location === item.href.split("?")[0] || (item.href === "/my-diary" && location === "/diary")}
            onClick={onClose}
          />
        ))}

      </nav>

      {/* Bottom section: Admin (admins only) + logout */}
      <div className="px-2 pt-2 border-t border-border flex flex-col gap-0.5">
        {isAdmin && (
          <SidebarNavItem
            href="/admin"
            label="Admin"
            icon={ShieldCheck}
            isCollapsed={isCollapsed}
            isActive={location.startsWith("/admin")}
            onClick={onClose}
          />
        )}
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>{logoutBtn}</TooltipTrigger>
            <TooltipContent side="right">Log out</TooltipContent>
          </Tooltip>
        ) : logoutBtn}
      </div>
    </div>
  );
}

/* ── Search Modal ── */
function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [, navigate] = useLocation();
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const submit = () => {
    if (value.trim()) {
      navigate(`/cookbook?q=${encodeURIComponent(value.trim())}`);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-md bg-[hsl(var(--background))] border-border p-6"
        style={{ backdropFilter: "none", WebkitBackdropFilter: "none" }}
        data-testid="dialog-search"
      >
        <DialogTitle className="text-base font-semibold mb-3">Search meals</DialogTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a meal name…"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") onClose();
            }}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            data-testid="input-search-modal"
          />
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Press <kbd className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">Enter</kbd> to search or{" "}
          <kbd className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">Esc</kbd> to cancel
        </p>
      </DialogContent>
    </Dialog>
  );
}

/* ── Apple Menu ── */
function AppleMenu({ location, isAdmin }: { location: string; isAdmin: boolean }) {
  const [, navigate] = useLocation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center justify-center h-11 w-11 rounded-lg transition-colors text-muted-foreground hover:bg-accent/60 hover:text-foreground"
          aria-label="Menu"
          data-testid="button-apple-menu"
        >
          <img src={thaAppleSrc} alt="Menu" className="h-[60px] w-[60px] object-contain" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2 cursor-pointer" data-testid="apple-menu-profile">
            <User className="h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        {/* PROD2: the "Partners" entry was withdrawn. Every one of the 12
            partners in client/src/data/partners.ts is invented, with an
            example.com URL, shipped behind a real affiliate-disclosure notice —
            so THA was recommending health and nutrition practitioners that do
            not exist. The page and its data are kept for a real partner
            programme; the doors are closed until the partners are real. */}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin" className="flex items-center gap-2 cursor-pointer" data-testid="apple-menu-admin">
                <ShieldCheck className="h-4 w-4" />
                Admin
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ── Brand Banner — full-width top row, desktop only ── */
export function BrandBanner() {
  const { realm } = useAppRealm();
  return (
    <div
      data-realm={realm}
      className="hidden md:flex items-center shrink-0 realm-header-bg border-b realm-header-border h-11 px-4"
      data-testid="brand-banner"
    >
      <Link href="/dashboard" aria-label="Dashboard" className="flex items-center">
        <img
          src="/logo-long.png"
          alt="The Healthy Apples"
          className="max-h-7 h-auto w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
        />
      </Link>
    </div>
  );
}

/* ── Desktop Sidebar ── */
export function DesktopSidebar() {
  const [location] = useLocation();
  const { isCollapsed, toggle } = useSidebarState();
  const { user, logout, itemCount, support, isAdmin } = useNavData();
  const [searchOpen, setSearchOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <aside
        className={`hidden md:flex flex-col relative flex-shrink-0 h-full bg-card/60 backdrop-blur-md transition-all duration-200 overflow-x-hidden overflow-y-hidden ${
          isCollapsed ? "w-16" : "w-[220px]"
        }`}
        data-testid="desktop-sidebar"
      >
        {/* Subtle gradient tint layer */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, hsl(var(--accent)) 0%, hsl(var(--background)) 80%)",
            opacity: "var(--sidebar-tint-opacity)",
          }}
        />

        {/* Nav body — sidebar starts directly below brand banner */}
        <div className="relative z-10 flex flex-col flex-1 h-full overflow-hidden border-r border-border">
          {/* Collapse toggle — at the top of the sidebar nav */}
          <div className={`flex shrink-0 px-2 py-1.5 ${isCollapsed ? "justify-center" : "justify-end"}`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggle}
                  className="flex items-center justify-center h-6 w-6 rounded-md hover:bg-accent/60 text-muted-foreground transition-colors"
                  data-testid="button-sidebar-toggle"
                  aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              </TooltipContent>
            </Tooltip>
          </div>

          <SidebarBody
            isCollapsed={isCollapsed}
            location={location}
            isAdmin={isAdmin}
            support={support}
            onSearchOpen={() => setSearchOpen(true)}
            itemCount={itemCount}
            logout={logout}
          />
        </div>
      </aside>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

/* ── Canonical active-page aliases ──────────────────────────────────────────────
 * Routes that render the same page as a canonical nav destination, so the nav
 * pill stays clearly highlighted regardless of which alias the user is on. */
const NAV_ACTIVE_ALIASES: Record<string, string[]> = {
  "/my-diary": ["/diary"],
  "/cookbook": ["/meals"],
  "/planner": ["/weekly-planner"],
  "/analyser": ["/products"],
  /* SHOP3 — `/basket` and `/analyse-basket` were aliased here so the Shopping
     pip lit up on the duplicate room, which meant a household standing on the
     unguarded door had no visual signal they were anywhere else. Both paths now
     redirect, so there is nothing left to alias. */
};

function isNavItemActive(basePath: string, location: string): boolean {
  if (location === basePath) return true;
  return NAV_ACTIVE_ALIASES[basePath]?.includes(location) ?? false;
}

/* ── Bottom Nav Item — tap navigates; repeat-tap on active page opens workspace ── */
function BottomNavItem({
  href,
  label,
  icon: Icon,
  isActive,
  realm,
  hasWorkspace = false,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  realm: (typeof REALM_STYLES)[string] | undefined;
  hasWorkspace?: boolean;
}) {
  const [, navigate] = useLocation();
  const basePath = href.split("?")[0];

  const handleClick = () => {
    if (hasWorkspace && isActive) {
      // Repeat-tap on the active page → open that page's workspace drawer
      try { if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10); } catch {}
      window.dispatchEvent(new CustomEvent("tha:open-workspace", { detail: { href: basePath } }));
      return;
    }
    navigate(href);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-current={isActive ? "page" : undefined}
      className={`flex flex-col items-center gap-0.5 px-1.5 md:px-4 py-2 rounded-lg transition-colors min-w-[44px] md:min-w-[64px] min-h-[44px] justify-center select-none ${
        isActive
          ? realm ? realm.mobileActive : "bg-accent text-primary"
          : realm ? realm.mobileInactive : "text-muted-foreground"
      }`}
      data-testid={`mobile-nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
      <span className="text-[10px] md:text-[11px] font-medium leading-tight">{label}</span>
    </button>
  );
}

/* ── Canonical Bottom Nav (UX1) — primary navigation on Desktop, Tablet & Mobile ── */
export function BottomNav() {
  const [location] = useLocation();
  const { user } = useUser();

  if (!user) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      data-testid="mobile-bottom-nav"
      aria-label="Primary"
    >
      <div className="flex items-center justify-around md:justify-center md:gap-2 px-1 py-1 max-w-lg md:max-w-3xl mx-auto">
        {NAV_ITEMS.map((item) => {
          const base = item.href.split("?")[0];
          const isActive = isNavItemActive(base, location);
          const realm = REALM_STYLES[base];
          return (
            <BottomNavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={isActive}
              realm={realm}
              hasWorkspace={!!(item as any).hasWorkspace}
            />
          );
        })}
      </div>
    </nav>
  );
}
