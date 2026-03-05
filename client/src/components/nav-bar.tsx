import { useState, useEffect, createContext, useContext } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LayoutDashboard, Utensils, CalendarDays, ShoppingBasket,
  Package, User, LogOut, ShoppingCart, ShieldCheck, Star,
  Mail, Sliders, Search, Menu, ChevronLeft, ChevronRight,
  MoreHorizontal, Archive,
} from "lucide-react";
import { api } from "@shared/routes";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/weekly-planner", label: "Planner", icon: CalendarDays },
  { href: "/meals", label: "My Meals", icon: Utensils },
  { href: "/pantry", label: "Pantry", icon: Package },
  { href: "/analyse-basket", label: "Basket", icon: ShoppingBasket },
  { href: "/profile", label: "Profile", icon: User },
];

const ADMIN_ITEMS = [
  { href: "/admin/users", label: "Users", icon: ShieldCheck },
  { href: "/admin/ingredient-products", label: "THA Picks", icon: Star },
  { href: "/admin/recipe-sources", label: "Recipe Sources", icon: Sliders },
];

const MOBILE_BOTTOM_ITEMS = [
  { href: "/weekly-planner", label: "Planner", icon: CalendarDays },
  { href: "/meals", label: "My Meals", icon: Utensils },
  { href: "/pantry", label: "Pantry", icon: Package },
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
  href, label, icon: Icon, isCollapsed, isActive, onClick,
}: {
  href: string; label: string; icon: React.ComponentType<{ className?: string }>;
  isCollapsed: boolean; isActive: boolean; onClick?: () => void;
}) {
  const linkEl = (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 w-full rounded-lg text-sm transition-colors ${
        isCollapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
      } ${
        isActive
          ? "bg-accent text-primary font-medium"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
      }`}
      data-testid={`sidebar-nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <span className="flex items-center justify-center min-w-[24px] flex-shrink-0">
        <Icon className="h-4 w-4" />
      </span>
      {!isCollapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }
  return linkEl;
}

function SidebarBody({
  isCollapsed, location, isAdmin, support, onClose,
}: {
  isCollapsed: boolean; location: string; isAdmin: boolean;
  support: string; onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full py-3 overflow-y-auto">
      <nav className="flex flex-col gap-0.5 px-2 flex-1">
        {NAV_ITEMS.map((item) => (
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
      <div className="px-2 pt-2 border-t border-border">
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
      </div>
    </div>
  );
}

export function TopBar() {
  const [location, navigate] = useLocation();
  const searchStr = useSearch();
  const { user, logout, itemCount, userInitial } = useNavData();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(() => {
    const params = new URLSearchParams(searchStr);
    return params.get("q") || "";
  });

  useEffect(() => {
    const params = new URLSearchParams(searchStr);
    setSearchValue(params.get("q") || "");
  }, [searchStr]);

  const { data: config } = useQuery<{ supportEmail?: string }>({
    queryKey: ["/api/config"],
    enabled: !!user,
  });
  const support = config?.supportEmail || "support@thehealthyapples.com";
  const isAdmin = (user as any)?.role === "admin";

  if (!user) return null;

  const handleSearch = () => {
    if (searchValue.trim()) {
      navigate(`/meals?q=${encodeURIComponent(searchValue.trim())}`);
      setMobileSearchOpen(false);
    }
  };
  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") setMobileSearchOpen(false);
  };

  const searchInput = (
    <div className="relative flex-1">
      <input
        type="text"
        placeholder="Search meals…"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyDown={handleSearchKey}
        className="w-full h-8 pl-3 pr-8 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        data-testid="input-search"
      />
      <button
        onClick={handleSearch}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        data-testid="button-search"
        aria-label="Search"
      >
        <Search className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  const actions = (
    <div className="flex items-center gap-1">
      {/* Mobile search toggle */}
      <button
        className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg hover:bg-accent/60 text-muted-foreground transition-colors"
        onClick={() => setMobileSearchOpen((v) => !v)}
        data-testid="button-mobile-search"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </button>
      <Link
        href="/analyse-basket"
        className="relative flex items-center justify-center h-9 w-9 rounded-lg hover:bg-accent/60 text-muted-foreground transition-colors"
        data-testid="button-basket-top"
        aria-label="Basket"
      >
        <ShoppingCart className="h-4 w-4" />
        {itemCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
            {itemCount}
          </span>
        )}
      </Link>
      <Link
        href="/profile"
        onClick={() => sessionStorage.setItem("profileReturnPath", window.location.pathname + window.location.search)}
      >
        <Avatar className="h-8 w-8 cursor-pointer" data-testid="avatar-user">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            {userInitial}
          </AvatarFallback>
        </Avatar>
      </Link>
      <button
        className="hidden md:flex items-center justify-center h-9 w-9 rounded-lg hover:bg-accent/60 text-muted-foreground transition-colors"
        onClick={() => logout()}
        title="Logout"
        data-testid="button-logout"
        aria-label="Logout"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <>
      <div className="sticky top-0 z-50 shrink-0" data-testid="top-nav-bar">
        {/* Main bar */}
        <header className="h-14 w-full bg-card/85 backdrop-blur-sm border-b border-border">
          {/* Desktop: 3-column grid — search | logo | actions */}
          <div className="hidden md:grid grid-cols-[1fr_auto_1fr] items-center h-full px-4 gap-3">
            <div className="flex items-center max-w-sm w-full">
              {searchInput}
            </div>
            <Link href="/" data-testid="link-logo" className="flex justify-center items-center">
              <img
                src="/logo-long.png"
                alt="The Healthy Apples"
                className="h-9 w-auto max-w-[200px] object-contain"
              />
            </Link>
            <div className="flex items-center justify-end">
              {actions}
            </div>
          </div>

          {/* Mobile: hamburger | logo | actions */}
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
                className="h-7 w-auto max-w-[140px] object-contain"
              />
            </Link>
            <div className="flex items-center justify-end">
              {actions}
            </div>
          </div>
        </header>

        {/* Mobile search panel — slides in below header */}
        {mobileSearchOpen && (
          <div className="md:hidden bg-card border-b border-border px-3 py-2 flex items-center gap-2">
            {searchInput}
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
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

export function DesktopSidebar() {
  const [location] = useLocation();
  const { user } = useUser();
  const { isCollapsed, toggle } = useSidebarState();
  const { data: config } = useQuery<{ supportEmail?: string }>({
    queryKey: ["/api/config"],
    enabled: !!user,
  });
  const support = config?.supportEmail || "support@thehealthyapples.com";
  const isAdmin = (user as any)?.role === "admin";

  if (!user) return null;

  return (
    <aside
      className={`hidden md:flex flex-col relative flex-shrink-0 bg-card/80 backdrop-blur-sm border-r border-border transition-all duration-200 overflow-x-hidden overflow-y-auto ${
        isCollapsed ? "w-16" : "w-[220px]"
      }`}
      data-testid="desktop-sidebar"
    >
      {/* Meadow tint layer behind icon rail */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, hsl(var(--accent)) 0%, hsl(var(--background)) 80%)",
          opacity: "var(--orchard-sidebar-opacity, 0.50)",
        }}
      />

      <div className="relative z-10 flex flex-col flex-1">
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
        />
      </div>
    </aside>
  );
}

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
            <a href={`mailto:${support}`} className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm hover:bg-muted transition-colors" data-testid="more-link-support">
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
