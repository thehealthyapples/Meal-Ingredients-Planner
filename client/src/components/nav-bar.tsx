import { useState, useEffect, useRef, createContext, useContext } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LayoutDashboard, Utensils, CalendarDays, ShoppingBasket,
  PackageOpen, User, LogOut, ShieldCheck, Star,
  Mail, Sliders, Search, Menu, ChevronLeft, ChevronRight,
  MoreHorizontal, Archive, ScanLine, BookOpen, Heart,
} from "lucide-react";
import { api } from "@shared/routes";

const NAV_ITEMS_TOP = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
];

const NAV_ITEMS_MAIN = [
  { href: "/meals", label: "My Meals", icon: Utensils },
  { href: "/weekly-planner", label: "Planner", icon: CalendarDays },
  { href: "/pantry", label: "Pantry", icon: PackageOpen },
  { href: "/products", label: "Products", icon: ScanLine },
  { href: "/analyse-basket", label: "Basket", icon: ShoppingBasket },
  { href: "/diary", label: "My Diary", icon: BookOpen },
  { href: "/partners", label: "Partners", icon: Heart },
  { href: "/profile", label: "Profile", icon: User },
];

const NAV_ITEMS = [...NAV_ITEMS_TOP, ...NAV_ITEMS_MAIN];

const ADMIN_ITEMS = [
  { href: "/admin/users", label: "Users", icon: ShieldCheck },
  { href: "/admin/ingredient-products", label: "THA Picks", icon: Star },
  { href: "/admin/recipe-sources", label: "Recipe Sources", icon: Sliders },
];

const MOBILE_BOTTOM_ITEMS = [
  { href: "/weekly-planner", label: "Planner", icon: CalendarDays },
  { href: "/meals", label: "My Meals", icon: Utensils },
  { href: "/pantry", label: "Pantry", icon: PackageOpen },
  { href: "/analyse-basket", label: "Basket", icon: ShoppingBasket },
  { href: "/profile", label: "Profile", icon: User },
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
          <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-0.5 leading-none">
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
  const searchBtn = (
    <button
      onClick={() => { onClose?.(); onSearchOpen(); }}
      className={`flex items-center gap-3 w-full rounded-lg text-sm transition-colors text-muted-foreground hover:bg-accent/60 hover:text-foreground ${
        isCollapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
      }`}
      data-testid="sidebar-button-search"
      aria-label="Search meals"
    >
      <span className="flex items-center justify-center min-w-[24px] flex-shrink-0">
        <Search className="h-4 w-4" />
      </span>
      {!isCollapsed && <span className="truncate">Search</span>}
    </button>
  );

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
        {/* Dashboard — always first */}
        {NAV_ITEMS_TOP.map((item) => (
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

        {/* Search — sits directly under Dashboard */}
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>{searchBtn}</TooltipTrigger>
            <TooltipContent side="right">Search meals</TooltipContent>
          </Tooltip>
        ) : searchBtn}

        <div className="my-1 border-t border-border/40" />

        {/* Remaining nav items */}
        {NAV_ITEMS_MAIN.map((item) => (
          <SidebarNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            isCollapsed={isCollapsed}
            isActive={location === item.href}
            onClick={onClose}
            badge={item.href === "/analyse-basket" ? itemCount : undefined}
          />
        ))}

        {isAdmin && (
          <>
            <div className="my-2 border-t border-border" />
            {!isCollapsed && (
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1">
                Admin
              </p>
            )}
            {ADMIN_ITEMS.map((item) => (
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
          </>
        )}
      </nav>

      {/* Bottom section: support + logout */}
      <div className="px-2 pt-2 border-t border-border flex flex-col gap-0.5">
        {/* Support */}
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={`mailto:${support}`}
                className="flex items-center justify-center p-2.5 rounded-lg text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors"
                data-testid="sidebar-link-support"
              >
                <Mail className="h-4 w-4" />
              </a>
            </TooltipTrigger>
            <TooltipContent side="right">Support: {support}</TooltipContent>
          </Tooltip>
        ) : (
          <a
            href={`mailto:${support}`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors"
            data-testid="sidebar-link-support"
          >
            <Mail className="h-4 w-4 shrink-0" />
            <span className="truncate">{support}</span>
          </a>
        )}

        {/* Logout — pinned to very bottom */}
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

/* ── TopBar — logo only on desktop, hamburger + logo + search on mobile ── */
export function TopBar() {
  const [location] = useLocation();
  const { user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [, navigate] = useLocation();
  const { data: config } = useQuery<{ supportEmail?: string }>({
    queryKey: ["/api/config"],
    enabled: !!user,
  });
  const { data: shoppingListItems = [] } = useQuery<any[]>({
    queryKey: [api.shoppingList.list.path],
    enabled: !!user,
  });
  const itemCount = shoppingListItems.length;
  const support = config?.supportEmail || "support@thehealthyapples.com";
  const { logout } = useUser();
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
    <>
      <div className="sticky top-0 z-50 shrink-0" data-testid="top-nav-bar">
        {/* Desktop: pure logo bar */}
        <header className="h-[120px] w-full bg-card/60 backdrop-blur-md border-b border-border">
          <div className="hidden md:flex items-center justify-center h-full px-4">
            <Link href="/" data-testid="link-logo" className="flex items-center">
              <img
                src="/logo-long.png"
                alt="The Healthy Apples"
                className="h-[120px] w-auto max-w-[825px] object-contain"
              />
            </Link>
          </div>

          {/* Mobile: hamburger | logo | search toggle */}
          <div className="md:hidden grid grid-cols-[auto_1fr_auto] items-center h-full px-2 gap-2">
            <button
              className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-accent/60 text-muted-foreground transition-colors"
              onClick={() => setMobileOpen(true)}
              data-testid="button-mobile-menu"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/" className="flex justify-center items-center" data-testid="link-logo-mobile">
              <img
                src="/logo-long.png"
                alt="The Healthy Apples"
                className="h-[84px] w-auto max-w-[480px] object-contain"
              />
            </Link>
            <button
              className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-accent/60 text-muted-foreground transition-colors"
              onClick={() => setMobileSearchOpen((v) => !v)}
              data-testid="button-mobile-search"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Mobile search panel */}
        {mobileSearchOpen && (
          <div className="md:hidden bg-card/80 backdrop-blur-md border-b border-border px-3 py-2 flex items-center gap-2">
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
                className="w-full h-8 pl-3 pr-8 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                data-testid="input-search"
              />
              <button
                onClick={handleMobileSearch}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Search"
              >
                <Search className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              className="text-muted-foreground hover:text-foreground text-sm shrink-0"
              onClick={() => setMobileSearchOpen(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Mobile sidebar sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[260px] p-0" data-testid="sheet-mobile-sidebar">
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
              <img src="/favicon.png" alt="THA" className="h-6 w-6 rounded" />
              The Healthy Apples
            </SheetTitle>
          </SheetHeader>
          <SidebarBody
            isCollapsed={false}
            location={location}
            isAdmin={isAdmin}
            support={support}
            onClose={() => setMobileOpen(false)}
            onSearchOpen={() => {}}
            itemCount={itemCount}
            logout={logout}
          />
        </SheetContent>
      </Sheet>
    </>
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
  const { user, logout } = useUser();
  const [moreOpen, setMoreOpen] = useState(false);
  const { data: config } = useQuery<{ supportEmail?: string }>({
    queryKey: ["/api/config"],
    enabled: !!user,
  });
  const support = config?.supportEmail || "support@thehealthyapples.com";
  const isAdmin = (user as any)?.role === "admin";

  if (!user) return null;

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border"
        data-testid="mobile-bottom-nav"
      >
        <div className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto">
          {MOBILE_BOTTOM_ITEMS.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[56px] ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              </Link>
            );
          })}
          <button
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[56px] text-muted-foreground"
            onClick={() => setMoreOpen(true)}
            data-testid="mobile-nav-more"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-tight">More</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl" data-testid="sheet-more-menu">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-left">More</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1">
            <Link
              href="/"
              onClick={() => setMoreOpen(false)}
              className={`flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm text-left hover:bg-muted transition-colors ${location === "/" ? "text-primary font-medium" : ""}`}
              data-testid="more-link-dashboard"
            >
              <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <Link
              href="/products"
              onClick={() => setMoreOpen(false)}
              className={`flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm text-left hover:bg-muted transition-colors ${location === "/products" ? "text-primary font-medium" : ""}`}
              data-testid="more-link-products"
            >
              <Archive className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Products</span>
            </Link>

            {isAdmin && (
              <>
                <div className="border-t border-border my-1" />
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1">Admin</p>
                {ADMIN_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm text-left hover:bg-muted transition-colors ${location === item.href ? "text-primary font-medium" : ""}`}
                      data-testid={`more-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </>
            )}

            <div className="border-t border-border my-1" />
            <a
              href={`mailto:${support}`}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm hover:bg-muted transition-colors"
              data-testid="more-link-support"
            >
              <Mail className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">{support}</span>
            </a>

            <button
              className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm text-left hover:bg-muted transition-colors text-destructive"
              onClick={() => { setMoreOpen(false); logout(); }}
              data-testid="more-button-logout"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Log out</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function NavBar() {
  return null;
}
