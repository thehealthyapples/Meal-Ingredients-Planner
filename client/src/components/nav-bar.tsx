import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard, Utensils, CalendarDays, ShoppingBasket,
  Package, User, LogOut, ShoppingCart,
} from "lucide-react";
import { api } from "@shared/routes";
import FiveApplesLogo from "@/components/FiveApplesLogo";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/meals", label: "My Meals", icon: Utensils },
  { href: "/weekly-planner", label: "Planner", icon: CalendarDays },
  { href: "/analyse-basket", label: "Basket", icon: ShoppingBasket },
  { href: "/products", label: "Products", icon: Package },
];

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/meals": "My Meals",
  "/weekly-planner": "Planner",
  "/planner": "Meal Plans",
  "/analyse-basket": "Analyse Basket",
  "/products": "Products",
  "/supermarkets": "Supermarkets",
  "/import-recipe": "Import Recipe",
  "/profile": "Profile",
};

export function NavBar() {
  const [location] = useLocation();
  const { user, logout } = useUser();

  const { data: shoppingListItems = [] } = useQuery<any[]>({
    queryKey: [api.shoppingList.list.path],
    enabled: !!user,
  });

  const itemCount = shoppingListItems.length;

  if (!user) return null;

  const pageTitle = PAGE_TITLES[location] || (location.startsWith("/meals/") ? "Meal Details" : "The Healthy Apples");
  const userInitial = (user.username || "U").charAt(0).toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur-xl border-b border-border" data-testid="top-nav-bar">
        <div className="flex h-14 items-center px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto">
          <Link href="/" className="flex items-center gap-2.5 shrink-0" data-testid="link-logo">
            <FiveApplesLogo size={20} />
            <span className="hidden sm:inline font-semibold text-base tracking-tight" data-testid="text-brand">
              The Healthy Apples
            </span>
          </Link>

          <div className="flex-1 flex justify-center">
            <h1 className="text-sm font-semibold text-foreground tracking-tight" data-testid="text-page-title">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href="/analyse-basket">
              <Button variant="ghost" size="icon" className="relative" data-testid="button-basket-top">
                <ShoppingCart className="h-4.5 w-4.5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/profile">
                <Avatar className="h-8 w-8 cursor-pointer" data-testid="avatar-user">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logout()}
                title="Logout"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1 px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto pb-2" data-testid="desktop-nav">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={`gap-2 h-9 px-3 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border" data-testid="mobile-bottom-nav">
        <div className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[56px] ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                  data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                  <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
