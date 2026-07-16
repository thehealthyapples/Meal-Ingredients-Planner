import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { MotionConfig } from "framer-motion";
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
import { PlannerProvider } from "@/contexts/PlannerContext";

// PX1-W3 (fnd-px-no-route-splitting): every page is a lazy chunk. Before this,
// 34 eager imports produced a single ~3.8 MB JS file — every household downloaded
// the entire admin world (recharts, @zxing, the workbenches) to see tonight's
// dinner. Each route now loads on first visit; the shell stays eager.
const NotFound = lazy(() => import("@/pages/not-found"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const OnboardingPage = lazy(() => import("@/pages/onboarding-page"));
const MealsPage = lazy(() => import("@/pages/meals-page"));
const ShoppingListPage = lazy(() => import("@/pages/shopping-list-page"));
const ImportRecipePage = lazy(() => import("@/pages/import-recipe-page"));
const ProductsPage = lazy(() => import("@/pages/products-page"));
const SupermarketsPage = lazy(() => import("@/pages/supermarkets-page"));
const MealDetailPage = lazy(() => import("@/pages/meal-detail-page"));
const WeeklyPlannerPage = lazy(() => import("@/pages/weekly-planner-page"));
const ProfilePage = lazy(() => import("@/pages/profile-page"));
const AdminPage = lazy(() => import("@/pages/admin-page"));
const AdminUsersPage = lazy(() => import("@/pages/admin-users-page"));
const AdminIngredientProductsPage = lazy(() => import("@/pages/admin-ingredient-products-page"));
const AdminRecipeSourcesPage = lazy(() => import("@/pages/admin-recipe-sources-page"));
const AdminCompanionIntelligencePage = lazy(() => import("@/pages/admin-companion-intelligence-page"));
const AdminIntelligencePage = lazy(() => import("@/pages/admin-intelligence-page"));
const AdminBenchmarkHouseholdsPage = lazy(() => import("@/pages/admin-benchmark-households-page"));
const AdminDevelopmentWorldPage = lazy(() => import("@/pages/admin-development-world-page"));
const AdminDevelopmentWorldHouseholdPage = lazy(() => import("@/pages/admin-development-world-household-page"));
const AdminObservationWorkbenchPage = lazy(() => import("@/pages/admin-observation-workbench-page"));
const AdminBehaviourWorkbenchPage = lazy(() => import("@/pages/admin-behaviour-workbench-page"));
const AdminKnowledgeReviewPage = lazy(() => import("@/pages/admin-knowledge-review-page"));
const AdminCanonicalPublicationIntegrityPage = lazy(() => import("@/pages/admin-canonical-publication-integrity-page"));
const SharedPlanPage = lazy(() => import("@/pages/shared-plan-page"));
const PantryPage = lazy(() => import("@/pages/pantry-page"));
const PlantDiversityPage = lazy(() => import("@/pages/plant-diversity-page"));
const FoodDiaryPage = lazy(() => import("@/pages/food-diary-page"));
const PartnersPage = lazy(() => import("@/pages/partners-page"));
const QuickMealPage = lazy(() => import("@/pages/quick-meal-page"));
const HomePage = lazy(() => import("@/pages/home-page"));
const HomeExperiencePage = lazy(() => import("@/pages/home-experience-page"));
// ARRIVAL1 — development-only Arrival Experience prototype. Live Home (`/home`) is untouched.
//
// The ternary is load-bearing and must not be "tidied" into a bare `lazy()` with the
// guard left on the <Route> alone. `import.meta.env.DEV` is a compile-time constant:
// written this way it folds to `false ? … : null`, the `import()` lands in a dead
// branch, and Rollup drops the chunk. Guarding only the <Route> leaves the `import()`
// live at module scope, and the prototype is still emitted into `dist/` — unreachable,
// but shipped. That was the first version of this line, and the build proved it wrong.
const ArrivalExperiencePage = import.meta.env.DEV
  ? lazy(() => import("@/pages/dev/arrival-experience"))
  : null;
// EXP2 — five development-only Arrival Experience exploration prototypes. Same
// load-bearing ternary as ARRIVAL1 above: each `import()` must sit inside the
// compile-time DEV branch so Rollup drops the chunks from production entirely.
const ArrivalAWelcomePage = import.meta.env.DEV
  ? lazy(() => import("@/pages/dev/arrival-a-welcome"))
  : null;
const ArrivalBOrchardPage = import.meta.env.DEV
  ? lazy(() => import("@/pages/dev/arrival-b-orchard"))
  : null;
const ArrivalCWorkspacePage = import.meta.env.DEV
  ? lazy(() => import("@/pages/dev/arrival-c-workspace"))
  : null;
const ArrivalDQuietPage = import.meta.env.DEV
  ? lazy(() => import("@/pages/dev/arrival-d-quiet"))
  : null;
const ArrivalERestraintPage = import.meta.env.DEV
  ? lazy(() => import("@/pages/dev/arrival-e-restraint"))
  : null;
// EXP3 — two development-only Arrival SYNTHESIS prototypes: the strongest EXP2
// ideas deliberately combined into candidate arrivals. Same load-bearing
// ternary as ARRIVAL1 above, so nothing ships in the production bundle.
const ArrivalS1QuietPage = import.meta.env.DEV
  ? lazy(() => import("@/pages/dev/arrival-s1-quiet"))
  : null;
const ArrivalS2WalkingHomePage = import.meta.env.DEV
  ? lazy(() => import("@/pages/dev/arrival-s2-walking-home"))
  : null;
// EXP4 — three development-only Materiality & Depth studies: how THA should
// occupy visual space (layers · light · restraint). Same load-bearing ternary
// as ARRIVAL1 above, so nothing ships in the production bundle.
const MaterialAWarmLayersPage = import.meta.env.DEV
  ? lazy(() => import("@/pages/dev/material-a-warm-layers"))
  : null;
const MaterialBAtmospherePage = import.meta.env.DEV
  ? lazy(() => import("@/pages/dev/material-b-atmosphere"))
  : null;
const MaterialCRestraintPage = import.meta.env.DEV
  ? lazy(() => import("@/pages/dev/material-c-restraint"))
  : null;
const DashboardPage = lazy(() => import("@/pages/dashboard"));
const FoodDetailPage = lazy(() => import("@/pages/food-detail-page"));
const ShoppingWorkspacePage = lazy(() => import("@/pages/shopping-workspace-page"));

// The chunk-loading fallback reuses the exact spinner treatment the shell already
// shows while the user session loads — no new loading vocabulary (that
// convergence is W4.8's).
function RouteFallback() {
  return (
    <div className="flex h-full min-h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
    </div>
  );
}

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
                      {/* PX1-W3: catches the routed page's lazy chunk inside the
                          shell, so the header and nav stay painted while a page
                          loads — navigation never blanks the whole app. */}
                      <Suspense fallback={<RouteFallback />}>
                        <Component />
                      </Suspense>
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
const AdminCanonicalPublicationIntegrityChrome = withAdminBanner(AdminCanonicalPublicationIntegrityPage);

function Router() {
  useRoutingCorrectionTracker();

  return (
    // PX1-W3: the outer boundary serves the routes that render outside the
    // ProtectedRoute shell (auth, onboarding, shared plans, logged-out home).
    // Same spinner the app has always shown while the session loads.
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
        </div>
      }
    >
    <Switch>
      <Route path="/auth" component={() => <OrchardShell><AuthPage /></OrchardShell>} />
      <Route path="/onboarding" component={() => <OrchardShell><OnboardingPage /></OrchardShell>} />

      <Route path="/" component={HomeRoute} />
      <Route path="/home" component={() => <ProtectedRoute component={HomeExperiencePage} />} />
      {/* ARRIVAL1 — development only. Wrapped in ProtectedRoute so the prototype
          inherits the ONE shell: the same orchard backdrop, header slot, bottom
          nav, error boundary and FloatingAssistant every authenticated page gets.
          It composes the shell; it does not copy it. */}
      {ArrivalExperiencePage && (
        <Route
          path="/dev/arrival"
          component={() => <ProtectedRoute component={ArrivalExperiencePage} />}
        />
      )}
      {/* EXP2 — development only, like ARRIVAL1 above: each prototype composes
          the ONE shell via ProtectedRoute; none copies it. */}
      {ArrivalAWelcomePage && (
        <Route
          path="/dev/arrival-a-welcome"
          component={() => <ProtectedRoute component={ArrivalAWelcomePage} />}
        />
      )}
      {ArrivalBOrchardPage && (
        <Route
          path="/dev/arrival-b-orchard"
          component={() => <ProtectedRoute component={ArrivalBOrchardPage} />}
        />
      )}
      {ArrivalCWorkspacePage && (
        <Route
          path="/dev/arrival-c-workspace"
          component={() => <ProtectedRoute component={ArrivalCWorkspacePage} />}
        />
      )}
      {ArrivalDQuietPage && (
        <Route
          path="/dev/arrival-d-quiet"
          component={() => <ProtectedRoute component={ArrivalDQuietPage} />}
        />
      )}
      {ArrivalERestraintPage && (
        <Route
          path="/dev/arrival-e-restraint"
          component={() => <ProtectedRoute component={ArrivalERestraintPage} />}
        />
      )}
      {/* EXP3 — development only: the two synthesis candidates, composed from
          the ONE shell exactly like the EXP2 prototypes above. */}
      {ArrivalS1QuietPage && (
        <Route
          path="/dev/arrival-s1-quiet"
          component={() => <ProtectedRoute component={ArrivalS1QuietPage} />}
        />
      )}
      {ArrivalS2WalkingHomePage && (
        <Route
          path="/dev/arrival-s2-walking-home"
          component={() => <ProtectedRoute component={ArrivalS2WalkingHomePage} />}
        />
      )}
      {/* EXP4 — development only: the three Materiality & Depth studies,
          composed from the ONE shell exactly like the prototypes above. */}
      {MaterialAWarmLayersPage && (
        <Route
          path="/dev/material-a-warm-layers"
          component={() => <ProtectedRoute component={MaterialAWarmLayersPage} />}
        />
      )}
      {MaterialBAtmospherePage && (
        <Route
          path="/dev/material-b-atmosphere"
          component={() => <ProtectedRoute component={MaterialBAtmospherePage} />}
        />
      )}
      {MaterialCRestraintPage && (
        <Route
          path="/dev/material-c-restraint"
          component={() => <ProtectedRoute component={MaterialCRestraintPage} />}
        />
      )}
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
      <Route path="/admin/canonical-publication-integrity" component={() => <ProtectedRoute component={AdminCanonicalPublicationIntegrityChrome} />} />
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
    </Suspense>
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
      {/* PX1-W1 (fnd-px-no-reduced-motion): gates every framer-motion animation
          (11 files) behind the OS reduced-motion preference in one place; CSS
          animations are gated by the matching media block in index.css. */}
      <MotionConfig reducedMotion="user">
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
}

export default App;
