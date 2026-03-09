import { Link, useLocation } from "wouter";
import {
  CalendarDays,
  ShoppingBasket,
  UtensilsCrossed,
  LayoutDashboard,
} from "lucide-react";
import { DemoProvider, useDemoMode } from "@/contexts/demo-context";
import DemoBanner from "@/components/demo-banner";
import OrchardBackdrop from "@/components/layout/orchard-backdrop";

const DEMO_NAV = [
  { href: "/demo", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/demo/planner", label: "Planner", icon: CalendarDays },
  { href: "/demo/basket", label: "Basket", icon: ShoppingBasket },
  { href: "/demo/meals", label: "Meals", icon: UtensilsCrossed },
];

function DemoTopBar() {
  return (
    <div className="sticky top-0 z-50 shrink-0" data-testid="demo-top-bar">
      <header className="h-16 w-full bg-card/60 backdrop-blur-md border-b border-border flex items-center justify-center px-4">
        <Link href="/demo" data-testid="link-demo-logo" className="flex items-center">
          <img
            src="/logo-long.png"
            alt="The Healthy Apples"
            className="h-12 w-auto max-w-[320px] object-contain"
          />
        </Link>
      </header>
    </div>
  );
}

function DemoDesktopSidebar() {
  const [location] = useLocation();

  return (
    <aside
      className="hidden md:flex flex-col relative flex-shrink-0 h-full w-[180px] bg-card/60 backdrop-blur-md border-r border-border overflow-hidden"
      data-testid="demo-desktop-sidebar"
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, hsl(var(--accent)) 0%, hsl(var(--background)) 80%)",
          opacity: 0.4,
        }}
      />
      <nav className="relative z-10 flex flex-col gap-1 p-3 pt-4">
        {DEMO_NAV.map((item) => {
          const isActive = item.exact ? location === item.href : location.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              }`}
              data-testid={`demo-nav-${item.label.toLowerCase()}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
        <div className="mt-auto pt-6">
          <Link
            href="/auth"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-primary border border-primary/30 hover:bg-primary/5 transition-colors"
            data-testid="demo-nav-create-account"
          >
            Create Account
          </Link>
        </div>
      </nav>
    </aside>
  );
}

function DemoMobileNav() {
  const [location] = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border"
      data-testid="demo-mobile-nav"
    >
      <div className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto">
        {DEMO_NAV.map((item) => {
          const isActive = item.exact ? location === item.href : location.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[56px] ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
              data-testid={`demo-mobile-nav-${item.label.toLowerCase()}`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function DemoShell({ component: Component }: { component: React.ComponentType }) {
  const { resetKey } = useDemoMode();

  return (
    <div className="relative flex flex-col min-h-screen">
      <OrchardBackdrop />
      <div className="relative z-10 flex flex-col flex-1 min-h-screen">
        <DemoBanner />
        <DemoTopBar />
        <div className="flex flex-1 overflow-hidden">
          <DemoDesktopSidebar />
          <main className="flex-1 overflow-y-auto pb-16 md:pb-0" data-testid="demo-main-content">
            <Component key={resetKey} />
          </main>
        </div>
        <DemoMobileNav />
      </div>
    </div>
  );
}

export default function DemoRoute({ component }: { component: React.ComponentType }) {
  return (
    <DemoProvider>
      <DemoShell component={component} />
    </DemoProvider>
  );
}
