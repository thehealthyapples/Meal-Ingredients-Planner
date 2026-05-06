import { useEffect, useRef } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";

import { TopBar, DesktopSidebar, MobileNav } from "@/components/nav-bar";
import OrchardBackdrop from "@/components/layout/orchard-backdrop";
import OrchardShell from "@/components/layout/orchard-shell";
import TrialBanner from "@/components/TrialBanner";
import SiteBanner from "@/components/SiteBanner";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import OnboardingPage from "@/pages/onboarding-page";
import MealsPage from "@/pages/meals-page";
import ShoppingListPage from "@/pages/shopping-list-page";
import ImportRecipePage from "@/pages/import-recipe-page";
import ProductsPage from "@/pages/products-page";
import SupermarketsPage from "@/pages/supermarkets-page";
import MealDetailPage from "@/pages/meal-detail-page";
import WeeklyPlannerPage from "@/pages/weekly-planner-page";
import ProfilePage from "@/pages/profile-page";
import AdminUsersPage from "@/pages/admin-users-page";
import AdminIngredientProductsPage from "@/pages/admin-ingredient-products-page";
import AdminRecipeSourcesPage from "@/pages/admin-recipe-sources-page";
import SharedPlanPage from "@/pages/shared-plan-page";
import PantryPage from "@/pages/pantry-page";
import FoodDiaryPage from "@/pages/food-diary-page";
import PartnersPage from "@/pages/partners-page";
import QuickMealPage from "@/pages/quick-meal-page";
import ListPage from "@/pages/list-page";
import HomePage from "@/pages/home-page";

let _contentRenderMeasured = false;

// Tracks the page the routing system landed the user on, so fast page switches
// can be detected and recorded as correction events.
let _routingLanding: { path: string; at: number } | null = null;

function routeToPath(route: string): string {
  if (route === "planner") return "/weekly-planner";
  if (route === "cookbook") return "/meals";
  if (route === "analyser") return "/analyse-basket";
  return "/list";
}

// Detects when a user navigates away from their routed landing page within 15s
// and posts a routing_correction event so future routing can learn from it.
function useRoutingCorrectionTracker() {
  const [location] = useLocation();
  const prevRef = useRef<string | null>(null);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = location;

    if (!_routingLanding || prev === null) return;
    if (location === _routingLanding.path) return;
    if (prev !== _routingLanding.path) return;

    const elapsed = Date.now() - _routingLanding.at;
    _routingLanding = null;

    if (elapsed < 15_000) {
      fetch("/api/events/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "routing_correction",
          metadata: { destination: location },
        }),
      }).catch(() => {});
    }
  }, [location]);
}

function HomeRoute() {
  const { user, isLoading } = useUser();

  // isPending (not isLoading) so the spinner shows even on the tick before the
  // fetch starts — isLoading is false in TanStack Query v5 until isFetching=true.
  const { data: routingData, isPending: isLoadingRoute } = useQuery<{ route: string }>({
    queryKey: ["/api/routing"],
    enabled: !!user && !!user.onboardingCompleted,
    staleTime: 60_000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    );
  }

  if (user) {
    if (!user.onboardingCompleted) return <Redirect to="/onboarding" />;

    if (isLoadingRoute) {
      return (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
        </div>
      );
    }

    const path = routingData ? routeToPath(routingData.route) : "/list";
    _routingLanding = { path, at: Date.now() };
    return <Redirect to={path} />;
  }

  return <HomePage />;
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && user && !_contentRenderMeasured) {
      _contentRenderMeasured = true;
      try {
        performance.mark("THA_CONTENT_RENDER");
        const m = performance.measure("THA_content_render", "THA_APP_START", "THA_CONTENT_RENDER");
        console.debug(`[THA perf] content render in ${m.duration.toFixed(0)}ms`);
      } catch {}
    }
  }, [isLoading, user]);

  if (!isLoading && !user) return <Redirect to="/auth" />;
  if (!isLoading && user && !user.onboardingCompleted) return <Redirect to="/onboarding" />;

  return (
    <div className="relative min-h-[100dvh]">
      <OrchardBackdrop />
      <div className="relative z-10 flex flex-col h-[100dvh]">
        {user?.isDemo && <TrialBanner />}
        <TopBar />
        <SiteBanner />
        <div className="flex flex-1 overflow-hidden">
          <DesktopSidebar />
          <main className="flex-1 overflow-y-auto overflow-x-hidden main-safe bg-background/25">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
              </div>
            ) : (
              <Component />
            )}
          </main>
        </div>
        <MobileNav />
      </div>
    </div>
  );
}

function Router() {
  useRoutingCorrectionTracker();

  return (
    <Switch>
      <Route path="/auth" component={() => <OrchardShell><AuthPage /></OrchardShell>} />
      <Route path="/onboarding" component={() => <OrchardShell><OnboardingPage /></OrchardShell>} />

      <Route path="/" component={HomeRoute} />
      <Route path="/meals/:id" component={() => <ProtectedRoute component={MealDetailPage} />} />
      <Route path="/meals" component={() => <ProtectedRoute component={MealsPage} />} />
      <Route path="/cookbook" component={() => <ProtectedRoute component={MealsPage} />} />
      <Route path="/import-recipe" component={() => <ProtectedRoute component={ImportRecipePage} />} />
      <Route path="/analyse-basket" component={() => <ProtectedRoute component={ShoppingListPage} />} />
      <Route path="/basket" component={() => <ProtectedRoute component={ShoppingListPage} />} />
      <Route path="/products" component={() => <ProtectedRoute component={ProductsPage} />} />
      <Route path="/analyser" component={() => <ProtectedRoute component={ProductsPage} />} />
      <Route path="/weekly-planner" component={() => <ProtectedRoute component={WeeklyPlannerPage} />} />
      <Route path="/planner" component={() => <ProtectedRoute component={WeeklyPlannerPage} />} />
      <Route path="/supermarkets" component={() => <ProtectedRoute component={SupermarketsPage} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={ProfilePage} />} />
      <Route path="/admin/users" component={() => <ProtectedRoute component={AdminUsersPage} />} />
      <Route path="/admin/ingredient-products" component={() => <ProtectedRoute component={AdminIngredientProductsPage} />} />
      <Route path="/admin/recipe-sources" component={() => <ProtectedRoute component={AdminRecipeSourcesPage} />} />
      <Route path="/pantry" component={() => <ProtectedRoute component={PantryPage} />} />
      <Route path="/diary" component={() => <ProtectedRoute component={FoodDiaryPage} />} />
      <Route path="/shared/:token" component={SharedPlanPage} />
      <Route path="/partners" component={() => <ProtectedRoute component={PartnersPage} />} />
      <Route path="/quick-meal" component={() => <ProtectedRoute component={QuickMealPage} />} />
      <Route path="/list" component={() => <ProtectedRoute component={ListPage} />} />
      <Route path="/shopping-list" component={() => <ProtectedRoute component={ListPage} />} />

      <Route component={NotFound} />
    </Switch>
  );
}

const LOCAL_VERSION = (window as any).__APP_VERSION__ || "unknown";

function App() {
  useEffect(() => {
    // Skip when injection failed — a missing LOCAL_VERSION must not trigger
    // a reload, or it would loop forever if __APP_VERSION__ is never set.
    if (LOCAL_VERSION === "unknown") return;
    fetch('/api/version')
      .then(res => res.json())
      .then(({ version }) => {
        if (version !== LOCAL_VERSION) {
          console.log('Version mismatch detected — reloading app');
          window.location.reload();
        }
      })
      .catch(() => {});
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
