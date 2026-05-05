import { useEffect } from "react";
import { Switch, Route, Redirect } from "wouter";
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
import Dashboard from "@/pages/dashboard";
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

function HomeRoute() {
  const { user, isLoading } = useUser();

  // Shopping list is the best available proxy for meaningful activity without
  // backend changes. Covers items from all sources (quick list, planner-generated,
  // basket). Enabled only once onboarding is done.
  const { data: savedItems, isLoading: isLoadingItems, isError: isErrorItems } = useQuery<{ id: number }[]>({
    queryKey: ['/api/shopping-list'],
    enabled: !!user && !!user.onboardingCompleted,
    staleTime: 60_000,
  });

  // Block only on user resolution. For returning users whose shopping list is
  // cached (stale or fresh), isLoadingItems is already false so no extra wait.
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    );
  }

  if (user) {
    if (!user.onboardingCompleted) return <Redirect to="/onboarding" />;

    // While shopping list is loading (cold cache — no prior data for this session),
    // show a spinner rather than flashing the full Dashboard layout.
    if (isLoadingItems) {
      return (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
        </div>
      );
    }

    // Only redirect to /list when activity is CONFIRMED absent.
    // Uncertain states (API error) default to Dashboard, not Quick List.
    //
    // Known gap: Planner/Cookbook/Pantry users who have never generated a shopping
    // list will still be routed to /list. Closing this gap requires a lightweight
    // backend activity-summary endpoint — not possible with frontend data alone.
    const hasActivity = (() => {
      if (isErrorItems) return true;                   // error → uncertain → Dashboard
      if (Array.isArray(savedItems) && savedItems.length > 0) return true;
      try {
        const h = JSON.parse(localStorage.getItem("tha-quick-list-history") || "[]");
        return Array.isArray(h) && h.length > 0;
      } catch { return false; }
    })();
    if (!hasActivity) return <Redirect to="/list" />;

    return (
      <div className="relative min-h-[100dvh]">
        <OrchardBackdrop />
        <div className="relative z-10 flex flex-col h-[100dvh]">
          {user.isDemo && <TrialBanner />}
          <TopBar />
          <SiteBanner />
          <div className="flex flex-1 overflow-hidden">
            <DesktopSidebar />
            <main className="flex-1 overflow-y-auto main-safe bg-background/25">
              <Dashboard />
            </main>
          </div>
          <MobileNav />
        </div>
      </div>
    );
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
  return (
    <Switch>
      <Route path="/auth" component={() => <OrchardShell><AuthPage /></OrchardShell>} />
      <Route path="/onboarding" component={() => <OrchardShell><OnboardingPage /></OrchardShell>} />

      <Route path="/" component={HomeRoute} />
      <Route path="/meals/:id" component={() => <ProtectedRoute component={MealDetailPage} />} />
      <Route path="/meals" component={() => <ProtectedRoute component={MealsPage} />} />
      <Route path="/import-recipe" component={() => <ProtectedRoute component={ImportRecipePage} />} />
      <Route path="/analyse-basket" component={() => <ProtectedRoute component={ShoppingListPage} />} />
      <Route path="/products" component={() => <ProtectedRoute component={ProductsPage} />} />
<Route path="/weekly-planner" component={() => <ProtectedRoute component={WeeklyPlannerPage} />} />
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

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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
