import { useEffect, useRef, useState } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";

import { BottomNav, AppRealmContext } from "@/components/nav-bar";
import { ErrorBoundary } from "@/components/error-boundary";
import { AdminBanner } from "@/components/admin-banner";
import FloatingAssistant from "@/components/conversation/FloatingAssistant";
import { CompanionContextProvider } from "@/components/conversation/companion-context";
import { WorkspaceHeaderSlotContext } from "@/components/workspace-header";
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
import { PlannerProvider } from "@/contexts/PlannerContext";
import ProfilePage from "@/pages/profile-page";
import AdminPage from "@/pages/admin-page";
import AdminUsersPage from "@/pages/admin-users-page";
import AdminIngredientProductsPage from "@/pages/admin-ingredient-products-page";
import AdminRecipeSourcesPage from "@/pages/admin-recipe-sources-page";
import AdminCompanionIntelligencePage from "@/pages/admin-companion-intelligence-page";
import AdminIntelligencePage from "@/pages/admin-intelligence-page";
import AdminBenchmarkHouseholdsPage from "@/pages/admin-benchmark-households-page";
import AdminDevelopmentWorldPage from "@/pages/admin-development-world-page";
import AdminDevelopmentWorldHouseholdPage from "@/pages/admin-development-world-household-page";
import AdminObservationWorkbenchPage from "@/pages/admin-observation-workbench-page";
import AdminBehaviourWorkbenchPage from "@/pages/admin-behaviour-workbench-page";
import AdminKnowledgeReviewPage from "@/pages/admin-knowledge-review-page";
import SharedPlanPage from "@/pages/shared-plan-page";
import PantryPage from "@/pages/pantry-page";
import PlantDiversityPage from "@/pages/plant-diversity-page";
import FoodDiaryPage from "@/pages/food-diary-page";
import PartnersPage from "@/pages/partners-page";
import QuickMealPage from "@/pages/quick-meal-page";
import HomePage from "@/pages/home-page";
import HomeExperiencePage from "@/pages/home-experience-page";
import DashboardPage from "@/pages/dashboard";
import FoodDetailPage from "@/pages/food-detail-page";
import ShoppingWorkspacePage from "@/pages/shopping-workspace-page";

let _contentRenderMeasured = false;

// Tracks the page the routing system landed the user on, so fast page switches
// can be detected and recorded as correction events.
let _routingLanding: { path: string; at: number } | null = null;

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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    );
  }

  if (user) {
    if (!user.onboardingCompleted) return <Redirect to="/onboarding" />;
    // UX0 — Home is the default destination after login. The prior intent-based
    // routing (planner/cookbook/analyser/shopping) is superseded as the landing;
    // its telemetry (routeToPath / useRoutingCorrectionTracker) is now dormant.
    return <Redirect to="/home" />;
  }

  return <HomePage />;
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useUser();
  const [location] = useLocation();
  const [activeRealm, setActiveRealm] = useState("home");
  const [headerSlot, setHeaderSlot] = useState<HTMLDivElement | null>(null);

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
    <AppRealmContext.Provider value={{ realm: activeRealm, setRealm: setActiveRealm }}>
      <WorkspaceHeaderSlotContext.Provider value={headerSlot}>
        {/* PHASE5D — the Companion Context Channel wraps the routed page (which
            publishes the pointers on screen) and the one FloatingAssistant (which
            reads them). One channel, one assistant — never one per surface. */}
        <CompanionContextProvider>
          <div className="relative min-h-[100dvh]">
            <OrchardBackdrop />
            <div className="relative z-10 flex flex-col h-[100dvh]">
              {user?.isDemo && <TrialBanner />}
              <SiteBanner />
              {/* Slot target: WorkspaceHeader portals here so the brand banner spans full width */}
              <div ref={setHeaderSlot} className="shrink-0 w-full" data-testid="ws-header-slot" />
              {/* UX1 — the canonical BottomNav is the sole primary navigation on all
                  screen sizes; the left DesktopSidebar is retired (dormant in nav-bar.tsx). */}
              <div className="flex flex-1 overflow-hidden">
                <main className="flex-1 overflow-y-auto overflow-x-hidden main-safe bg-background/25 flex flex-col">
                  {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                    </div>
                  ) : (
                    // PX1-W0 (fnd-px-error-renders-as-empty). No ErrorBoundary existed
                    // anywhere in the client, so a render-time throw on any household
                    // page took the whole app to a white screen. It sits INSIDE the
                    // shell — the header and the bottom nav survive, so a broken
                    // surface is never a surface the household cannot leave. Keyed on
                    // the location so walking away from a broken page unbreaks it.
                    <ErrorBoundary resetKey={location}>
                      <Component />
                    </ErrorBoundary>
                  )}
                </main>
              </div>
              <BottomNav />
            </div>
          </div>
          <FloatingAssistant />
        </CompanionContextProvider>
      </WorkspaceHeaderSlotContext.Provider>
    </AppRealmContext.Provider>
  );
}

function PlannerPageWrapper() {
  return (
    <PlannerProvider>
      <WeeklyPlannerPage />
    </PlannerProvider>
  );
}

// ADMIN1D — every Admin page renders the shared Admin domain banner above its
// content, giving the Admin domain a consistent header and cross-navigation.
// Wrapped once at module scope (stable component identity → no remount churn).
const withAdminBanner = (Component: React.ComponentType) => {
  const Wrapped = () => (
    <>
      <AdminBanner />
      <Component />
    </>
  );
  return Wrapped;
};
const AdminHomeChrome = withAdminBanner(AdminPage);
const AdminUsersChrome = withAdminBanner(AdminUsersPage);
const AdminIngredientProductsChrome = withAdminBanner(AdminIngredientProductsPage);
const AdminRecipeSourcesChrome = withAdminBanner(AdminRecipeSourcesPage);
const AdminCompanionIntelligenceChrome = withAdminBanner(AdminCompanionIntelligencePage);
const AdminIntelligenceChrome = withAdminBanner(AdminIntelligencePage);
const AdminBenchmarkHouseholdsChrome = withAdminBanner(AdminBenchmarkHouseholdsPage);
const AdminDevelopmentWorldChrome = withAdminBanner(AdminDevelopmentWorldPage);
const AdminDevelopmentWorldHouseholdChrome = withAdminBanner(AdminDevelopmentWorldHouseholdPage);
const AdminObservationsChrome = withAdminBanner(AdminObservationWorkbenchPage);
const AdminBehaviourChrome = withAdminBanner(AdminBehaviourWorkbenchPage);

function Router() {
  useRoutingCorrectionTracker();

  return (
    <Switch>
      <Route path="/auth" component={() => <OrchardShell><AuthPage /></OrchardShell>} />
      <Route path="/onboarding" component={() => <OrchardShell><OnboardingPage /></OrchardShell>} />

      <Route path="/" component={HomeRoute} />
      <Route path="/home" component={() => <ProtectedRoute component={HomeExperiencePage} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
      <Route path="/meals/:id" component={() => <ProtectedRoute component={MealDetailPage} />} />
      <Route path="/foods/:slug" component={() => <ProtectedRoute component={FoodDetailPage} />} />
      <Route path="/meals" component={() => <ProtectedRoute component={MealsPage} />} />
      <Route path="/cookbook" component={() => <ProtectedRoute component={MealsPage} />} />
      <Route path="/import-recipe" component={() => <ProtectedRoute component={ImportRecipePage} />} />
      <Route path="/analyse-basket" component={() => <ProtectedRoute component={ShoppingListPage} />} />
      <Route path="/basket" component={() => <ProtectedRoute component={ShoppingListPage} />} />
      <Route path="/products" component={() => <ProtectedRoute component={ProductsPage} />} />
      <Route path="/analyser" component={() => <ProtectedRoute component={ProductsPage} />} />
      <Route path="/weekly-planner" component={() => <ProtectedRoute component={PlannerPageWrapper} />} />
      <Route path="/planner" component={() => <ProtectedRoute component={PlannerPageWrapper} />} />
      <Route path="/supermarkets" component={() => <ProtectedRoute component={SupermarketsPage} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={ProfilePage} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={AdminHomeChrome} />} />
      <Route path="/admin/users" component={() => <ProtectedRoute component={AdminUsersChrome} />} />
      <Route path="/admin/ingredient-products" component={() => <ProtectedRoute component={AdminIngredientProductsChrome} />} />
      <Route path="/admin/recipe-sources" component={() => <ProtectedRoute component={AdminRecipeSourcesChrome} />} />
      <Route path="/admin/companion-intelligence" component={() => <ProtectedRoute component={AdminCompanionIntelligenceChrome} />} />
      <Route path="/admin/intelligence" component={() => <ProtectedRoute component={AdminIntelligenceChrome} />} />
      <Route path="/admin/benchmark-households" component={() => <ProtectedRoute component={AdminBenchmarkHouseholdsChrome} />} />
      <Route path="/admin/development-world/:id" component={() => <ProtectedRoute component={AdminDevelopmentWorldHouseholdChrome} />} />
      <Route path="/admin/development-world" component={() => <ProtectedRoute component={AdminDevelopmentWorldChrome} />} />
      <Route path="/admin/observations" component={() => <ProtectedRoute component={AdminObservationsChrome} />} />
      <Route path="/admin/behaviour" component={() => <ProtectedRoute component={AdminBehaviourChrome} />} />
      <Route path="/admin/knowledge-review" component={() => <ProtectedRoute component={AdminKnowledgeReviewPage} />} />
      <Route path="/pantry" component={() => <ProtectedRoute component={PantryPage} />} />
      <Route path="/plant-diversity" component={() => <ProtectedRoute component={PlantDiversityPage} />} />
      <Route path="/diary" component={() => <ProtectedRoute component={FoodDiaryPage} />} />
      <Route path="/my-diary" component={() => <ProtectedRoute component={FoodDiaryPage} />} />
      <Route path="/shared/:token" component={SharedPlanPage} />
      <Route path="/partners" component={() => <ProtectedRoute component={PartnersPage} />} />
      <Route path="/quick-meal" component={() => <ProtectedRoute component={QuickMealPage} />} />
      <Route path="/list" component={() => <Redirect to="/shopping-workspace" />} />
      <Route path="/shopping-list" component={() => <Redirect to="/shopping-workspace" />} />
      <Route path="/shopping-workspace" component={() => <ProtectedRoute component={ShoppingWorkspacePage} />} />

      <Route component={NotFound} />
    </Switch>
  );
}

const LOCAL_VERSION = (window as any).__APP_VERSION__ || "unknown";

function App() {
  useEffect(() => {
    // Skip when injection failed - a missing LOCAL_VERSION must not trigger
    // a reload, or it would loop forever if __APP_VERSION__ is never set.
    if (LOCAL_VERSION === "unknown") return;
    fetch('/api/version')
      .then(res => res.json())
      .then(({ version }) => {
        if (version !== LOCAL_VERSION) {
          console.log('Version mismatch detected - reloading app');
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
