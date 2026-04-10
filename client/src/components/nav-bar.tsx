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
  LayoutDashboard, CalendarDays, ShoppingBasket,
  LogOut, ShieldCheck, Star,
  Mail, Sliders, Search, ChevronLeft, ChevronRight,
  Microscope, BookOpen, Heart, ScrollText, ChefHat,
  User, NotepadText,
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

// Sidebar nav - high-frequency items (Dashboard, Search, Basket, Profile) live in the top bar
const NAV_ITEMS_MAIN = [
  { href: "/meals", label: "Cookbook", icon: ChefHat },
  { href: "/weekly-planner", label: "Planner", icon: CalendarDays },
  { href: "/pantry", label: "Pantry", icon: PantryIcon },
  { href: "/products", label: "Analyser", icon: Microscope },
  { href: "/diary", label: "My Diary", icon: BookOpen },
];

// Mobile bottom nav - 5 core tools (no More layer)
const MOBILE_BOTTOM_ITEMS = [
  { href: "/meals", label: "Cookbook", icon: ChefHat },
  { href: "/weekly-planner", label: "Planner", icon: CalendarDays },
  { href: "/pantry", label: "Pantry", icon: PantryIcon },
  { href: "/products", label: "Analyser", icon: Microscope },
  { href: "/diary", label: "Diary", icon: BookOpen },
];

export type SidebarContextValue = { isCollapsed: boolean };
export const SidebarContext = createContext<SidebarContextValue>({ isCollapsed: false });
export const useSidebar = () => useContext(SidebarContext);

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
  const linkEl = (
    <Link
      href={href}
      onClick={onClick}
      className={`relative flex items-center gap-3 w-full rounded-lg text-sm transition-colors ${
        isCollapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
      } ${
        isActive
          ? "bg-accent text-primary font-medium"
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
        {NAV_ITEMS_MAIN.map((item) => (
          <SidebarNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            isCollapsed={isCollapsed}
            isActive={location === item.href}
            onClick={onClose}
          />
        ))}

      </nav>

      {/* Bottom section: logout */}
      <div className="px-2 pt-2 border-t border-border flex flex-col gap-0.5">
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
      navigate(`/meals?q=${encodeURIComponent(value.trim())}`);
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
        <DropdownMenuItem asChild>
          <Link href="/partners" className="flex items-center gap-2 cursor-pointer" data-testid="apple-menu-partners">
            <Heart className="h-4 w-4" />
            Partners
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/users" className="flex items-center gap-2 cursor-pointer" data-testid="apple-menu-admin-users">
                <ShieldCheck className="h-4 w-4" />
                Users
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/ingredient-products" className="flex items-center gap-2 cursor-pointer" data-testid="apple-menu-admin-picks">
                <Star className="h-4 w-4" />
                THA Picks
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/recipe-sources" className="flex items-center gap-2 cursor-pointer" data-testid="apple-menu-admin-sources">
                <Sliders className="h-4 w-4" />
                Recipe Sources
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ── TopBar - logo only on desktop, hamburger + logo + search on mobile ── */
export function TopBar() {
  const [location] = useLocation();
  const { user } = useUser();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [, navigate] = useLocation();
  const { data: shoppingListItems = [] } = useQuery<any[]>({
    queryKey: [api.shoppingList.list.path],
    enabled: !!user,
  });
  const itemCount = shoppingListItems.length;
  const isAdmin = (user as any)?.role === "admin";

  if (!user) return null;

  const handleMobileSearch = () => {
    if (searchValue.trim()) {
      navigate(`/meals?q=${encodeURIComponent(searchValue.trim())}`);
      setMobileSearchOpen(false);
      setSearchValue("");
    }
  };

  return (
    <div className="sticky top-0 z-50 shrink-0" data-testid="top-nav-bar">
      <header className="w-full bg-card/60 backdrop-blur-md border-b border-border py-0.5">

        {/* Desktop: [Dashboard, Search, Diary] | logo (center) | [Basket, Partners, Profile] */}
        <div className="hidden md:grid items-center px-4" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
          {/* Left: Dashboard + Search + List */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/"
                  className={`flex items-center justify-center h-10 w-10 rounded-lg transition-colors ${location === "/" ? "text-primary bg-accent" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"}`}
                  aria-label="Dashboard"
                  data-testid="button-topbar-dashboard"
                >
                  <LayoutDashboard className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>Dashboard</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex items-center justify-center h-10 w-10 rounded-lg hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileSearchOpen((v) => !v)}
                  aria-label="Search"
                  data-testid="button-topbar-search"
                >
                  <Search className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Search</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/list"
                  className={`flex items-center justify-center h-10 w-10 rounded-lg transition-colors ${location === "/list" ? "text-primary bg-accent" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"}`}
                  aria-label="List"
                  data-testid="button-topbar-list"
                >
                  <NotepadText className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>List</TooltipContent>
            </Tooltip>
          </div>

          {/* Center: logo */}
          <Link href="/" data-testid="link-logo" className="flex items-center justify-center">
            <img
              src="/logo-long.png"
              alt="The Healthy Apples"
              className="h-auto max-h-[88px] w-auto max-w-[700px]"
            />
          </Link>

          {/* Right: Basket + Apple menu */}
          <div className="flex items-center gap-1 justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/analyse-basket"
                  className={`relative flex items-center justify-center h-10 w-10 rounded-lg transition-colors ${location === "/analyse-basket" ? "text-primary bg-accent" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"}`}
                  aria-label="Basket"
                  data-testid="button-topbar-basket"
                >
                  <ShoppingBasket className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span className="absolute top-1 right-1 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-0.5 leading-none pointer-events-none">
                      {itemCount > 99 ? "99+" : itemCount}
                    </span>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent>Basket{itemCount > 0 ? ` (${itemCount})` : ""}</TooltipContent>
            </Tooltip>
            <AppleMenu location={location} isAdmin={isAdmin} data-testid="button-topbar-apple-menu" />
          </div>
        </div>

        {/* Mobile: [Dashboard, Search] | logo | [Basket, Profile] */}
        <div className="md:hidden flex items-center justify-between px-1 h-14">

          {/* Left: Dashboard + Search + List */}
          <div className="flex items-center">
            <Link
              href="/"
              className={`flex items-center justify-center h-11 w-11 rounded-lg transition-colors ${location === "/" ? "text-primary" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"}`}
              aria-label="Dashboard"
              data-testid="button-topbar-dashboard"
            >
              <LayoutDashboard className="h-5 w-5" />
            </Link>
            <button
              className="flex items-center justify-center h-11 w-11 rounded-lg hover:bg-accent/60 text-muted-foreground transition-colors"
              onClick={() => setMobileSearchOpen((v) => !v)}
              aria-label="Search"
              data-testid="button-mobile-search"
            >
              <Search className="h-5 w-5" />
            </button>
            <Link
              href="/list"
              className={`flex items-center justify-center h-11 w-11 rounded-lg transition-colors ${location === "/list" ? "text-primary" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"}`}
              aria-label="List"
              data-testid="button-topbar-list-mobile"
            >
              <NotepadText className="h-5 w-5" />
            </Link>
          </div>

          {/* Center: logo */}
          <Link href="/" data-testid="link-logo-mobile" className="flex items-center">
            <img
              src="/logo-long.png"
              alt="The Healthy Apples"
              className="h-auto max-h-[44px] w-auto max-w-[160px]"
            />
          </Link>

          {/* Right: Basket + Apple menu */}
          <div className="flex items-center">
            <Link
              href="/analyse-basket"
              className={`relative flex items-center justify-center h-11 w-11 rounded-lg transition-colors ${location === "/analyse-basket" ? "text-primary" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"}`}
              aria-label="Basket"
              data-testid="button-topbar-basket"
            >
              <ShoppingBasket className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-0.5 leading-none pointer-events-none">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>
            <AppleMenu location={location} isAdmin={isAdmin} />
          </div>

        </div>
      </header>

      {/* Mobile search panel */}
      {mobileSearchOpen && (
        <div className="md:hidden bg-card/90 backdrop-blur-md border-b border-border px-3 py-2 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search meals…"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleMobileSearch();
                if (e.key === "Escape") setMobileSearchOpen(false);
              }}
              autoFocus
              className="w-full h-9 pl-3 pr-8 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              data-testid="input-search"
            />
            <button
              onClick={handleMobileSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
          <button
            className="text-muted-foreground hover:text-foreground text-sm shrink-0 px-1"
            onClick={() => setMobileSearchOpen(false)}
          >
            Cancel
          </button>
        </div>
      )}
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
        className={`hidden md:flex flex-col relative flex-shrink-0 h-full bg-card/60 backdrop-blur-md border-r border-border transition-all duration-200 overflow-x-hidden overflow-y-hidden ${
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
            opacity: "var(--orchard-sidebar-opacity, 0.40)",
          }}
        />

        <div className="relative z-10 flex flex-col flex-1 h-full overflow-hidden">
          {/* Collapse toggle */}
          <div className={`flex ${isCollapsed ? "justify-center" : "justify-end"} px-2 pt-3 pb-1 shrink-0`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggle}
                  className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-accent/60 text-muted-foreground transition-colors"
                  data-testid="button-sidebar-toggle"
                  aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
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

/* ── Mobile Bottom Nav ── */
export function MobileNav() {
  const [location] = useLocation();
  const { user } = useUser();

  if (!user) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      data-testid="mobile-bottom-nav"
    >
      <div className="flex items-center justify-around px-1 py-1 max-w-lg mx-auto">
        {MOBILE_BOTTOM_ITEMS.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg transition-colors min-w-[52px] min-h-[44px] justify-center ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
              data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className="text-[9px] font-medium leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function NavBar() {
  return null;
}
