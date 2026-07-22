import { lazy, Suspense, useEffect, useRef } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { MotionConfig } from "framer-motion";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";

import { ErrorBoundary } from "@/components/error-boundary";
import { AdminBanner } from "@/components/admin-banner";
import { AppShell } from "@/components/layout/app-shell";
import OrchardShell from "@/components/layout/orchard-shell";
import { PlannerProvider } from "@/contexts/PlannerContext";

// PX1-W3 (fnd-px-no-route-splitting): every page is a lazy chunk. Before this,
// 34 eager imports produced a single ~3.8 MB JS file — every household downloaded
// the entire admin world (recharts, @zxing, the workbenches) to see tonight's
// dinner. Each route now loads on first visit; the shell stays eager.
const NotFound = lazy(() => import("@/pages/not-found"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const OnboardingPage = lazy(() => import("@/pages/onboarding-page"));
const MealsPage = lazy(() => import("@/pages/meals-page"));
const ImportRecipePage = lazy(() => import("@/pages/import-recipe-page"));
const ProductsPage = lazy(() => import("@/pages/products-page"));
const SupermarketsPage = lazy(() => import("@/pages/supermarkets-page"));
const MealDetailPage = lazy(() => import("@/pages/meal-detail-page"));
const FoodComparisonPage = lazy(() => import("@/pages/food-comparison-page"));
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
const AdminKnowledgeClaimsPage = lazy(() => import("@/pages/admin-knowledge-claims-page"));
const AdminCanonicalPublicationIntegrityPage = lazy(() => import("@/pages/admin-canonical-publication-integrity-page"));
const SharedPlanPage = lazy(() => import("@/pages/shared-plan-page"));
// COMM1A — the doorstep. Public and bare, like /shared/:token: the person
// holding an invitation link may have no account at all.
const InvitationPage = lazy(() => import("@/pages/invitation-page"));
const PantryPage = lazy(() => import("@/pages/pantry-page"));
// LARDER Pass 1 — the Living Larder as a physical room, built furniture-first and
// complete while EMPTY (LARDER4 § 8, Pass 1). Its own future home under LARDER1's
// Pantry→Larder rename; /pantry remains the reference reconstruction until the
// later passes (data, interactions, motion) grow the room into this route.
const LarderRoomPage = lazy(() => import("@/pages/larder-room"));
// COMM2 — the Orchard: Community as a place. ONE route for the whole room; the
// Orchard overview, Neighbourhoods, the Village and the High Street are state
// inside the page, never separate destinations.
const OrchardPage = lazy(() => import("@/pages/orchard-page"));
const PlantDiversityPage = lazy(() => import("@/pages/plant-diversity-page"));
const FoodDiaryPage = lazy(() => import("@/pages/food-diary-page"));
// PROD2: PartnersPage is deliberately not imported — the /partners route is
// withdrawn (see the Routes block). Kept on disk, out of the bundle.
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
// EXP4's three Materiality & Depth studies are all gone, and the disposition EXP4 §6
// set for them is complete. B (material-b-atmosphere) and C (material-c-restraint) lost
// ODL2's selection and were deleted then — both set type directly on the orchard, which
// Blueprint §6.1 forbids without negotiation. A (material-a-warm-layers) won, graduated
// into UIA §4 as the canonical depth/light vocabulary, and survived as that vocabulary's
// dev-only reference implementation ONLY until a household surface adopted the tokens.
// NORTH1 (2026-07-17) is that adoption: Home now stands at E3 on the real ground plane,
// so the reference was deleted in the same change — the closing trigger the adoption
// register recorded against `depth-light-ground`. A study that survives its own decision
// has become the thing it was built to prevent.
const DashboardPage = lazy(() => import("@/pages/dashboard"));
const FoodDetailPage = lazy(() => import("@/pages/food-detail-page"));
const ShoppingWorkspacePage = lazy(() => import("@/pages/shopping-workspace-page"));

// BUS1 — Trust & Compliance surfaces.
// `LegalPage` is PUBLIC and serves both `/legal` and `/legal/:slug` (it reads the
// slug itself with `useRoute`), because a policy a person must agree to before
// signing up cannot live behind a login. The other three are household surfaces
// reached from Profile.
const LegalPage = lazy(() => import("@/pages/legal-page"));
const PrivacySettingsPage = lazy(() => import("@/pages/privacy-settings-page"));
const HelpCentrePage = lazy(() => import("@/pages/help-centre-page"));
const ContactPage = lazy(() => import("@/pages/contact-page"));

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

  // NAV1 — the shell is no longer drawn here. It was ~50 lines of inline JSX in
  // this routing file, which meant the walls of the house had no owner you could
  // import, test or point at; `AppShell` is that owner now. The structure it
  // renders is this block, moved rather than rewritten.
  return (
    <AppShell isLoading={isLoading} showTrialBanner={!!user?.isDemo}>
      {/* PX1-W3: catches the routed page's lazy chunk inside the shell, so the
          header and nav stay painted while a page loads — navigation never
          blanks the whole app. */}
      <Suspense fallback={<RouteFallback />}>
        <Component />
      </Suspense>
    </AppShell>
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
const AdminKnowledgeClaimsChrome = withAdminBanner(AdminKnowledgeClaimsPage);

function Router() {
  useRoutingCorrectionTracker();
  const [routerLocation] = useLocation();

  return (
    // PROD1 — an ERROR boundary around the outer SUSPENSE boundary.
    //
    // PX1-W0 put an ErrorBoundary inside `ProtectedRoute`, which covers every
    // authenticated household page. The routes that render OUTSIDE that shell had
    // none — and they are the ones that matter most commercially:
    //   • /auth and /onboarding — every new household passes through both, so a
    //     throw here is a white screen at the exact moment of acquisition;
    //   • /shared/:token — the only viral loop in the product;
    //   • the logged-out marketing home.
    //
    // It also wraps the Suspense rather than sitting inside it, which is the whole
    // point: every route below is a lazy chunk, so after a redeploy an old client
    // requesting a hashed chunk that no longer exists throws DURING suspense. That
    // is a routine event for a frequently-deployed app — frequent enough that this
    // very file ships a version-mismatch reloader — and with no boundary above the
    // Suspense it was an unrecoverable white screen. Keyed on location, so
    // navigating away from a broken route clears it.
    <ErrorBoundary resetKey={routerLocation}>
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

      {/* BUS1 — the policies. Public and unauthenticated, deliberately: a person
          must be able to read what they are agreeing to BEFORE they have an
          account, and a privacy policy behind a login is not published. Rendered
          bare (like `/shared/:token`) rather than in OrchardShell — a document a
          person is reading closely should not sit inside the house's chrome.
          The `:slug` route precedes the index because wouter matches in order. */}
      <Route path="/legal/:slug" component={LegalPage} />
      <Route path="/legal" component={LegalPage} />

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
      <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
      <Route path="/meals/:id" component={() => <ProtectedRoute component={MealDetailPage} />} />
      <Route path="/foods/:slug" component={() => <ProtectedRoute component={FoodDetailPage} />} />
      <Route path="/compare" component={() => <ProtectedRoute component={FoodComparisonPage} />} />
      <Route path="/meals" component={() => <ProtectedRoute component={MealsPage} />} />
      <Route path="/cookbook" component={() => <ProtectedRoute component={MealsPage} />} />
      <Route path="/import-recipe" component={() => <ProtectedRoute component={ImportRecipePage} />} />
      {/* SHOP3 — the second Shopping door is closed. `/basket` and
          `/analyse-basket` were a duplicate of the canonical Shopping room
          that, critically, never mounted the ambient surface carrying
          `shopping-restriction-conflict` — THA's only `critical` signal. A
          household arriving on the old door now lands on the room that
          warns them. Bookmarks are honoured by redirect, not by 404. */}
      <Route path="/analyse-basket" component={() => <Redirect to="/shopping-workspace" />} />
      <Route path="/basket" component={() => <Redirect to="/shopping-workspace" />} />
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
      <Route path="/admin/knowledge-claims" component={() => <ProtectedRoute component={AdminKnowledgeClaimsChrome} />} />
      <Route path="/admin/canonical-publication-integrity" component={() => <ProtectedRoute component={AdminCanonicalPublicationIntegrityChrome} />} />
      <Route path="/pantry" component={() => <ProtectedRoute component={PantryPage} />} />
      {/* LARDER Pass 1 — the empty Living Larder room (furniture only; no data,
          no interactions). See docs/implementation/LARDER_PASS1_ROOM_STRUCTURE.md. */}
      <Route path="/larder" component={() => <ProtectedRoute component={LarderRoomPage} />} />
      {/* COMM2 — the Orchard. An invitation arrives as ?invitation=<token>;
          the room answers it and clears the token from the URL once spent. */}
      <Route path="/orchard" component={() => <ProtectedRoute component={OrchardPage} />} />
      {/* PROD4 — the room is called "Nutrition" in the one navigation list and
          was reachable only at /plant-diversity. Plant diversity is one TAB of
          this room (the other is Nutrients), so the path named a part after the
          whole. /nutrition is now canonical and /plant-diversity redirects, so
          every existing deep link, bookmark and shared URL still lands. */}
      <Route path="/nutrition" component={() => <ProtectedRoute component={PlantDiversityPage} />} />
      <Route path="/plant-diversity" component={() => <Redirect to="/nutrition" />} />
      <Route path="/diary" component={() => <ProtectedRoute component={FoodDiaryPage} />} />
      <Route path="/my-diary" component={() => <ProtectedRoute component={FoodDiaryPage} />} />
      <Route path="/shared/:token" component={SharedPlanPage} />
      {/* COMM1A — rendered OUTSIDE ProtectedRoute on purpose. An invitation
          reaches someone who is not signed in and may have no account; sending
          them through the auth gate would lose the token they arrived with,
          which is the exact defect /shared/:token still has (App.tsx above). */}
      <Route path="/invitation" component={InvitationPage} />
      {/* PROD2: /partners is withdrawn — all 12 entries in data/partners.ts are
          invented businesses on example.com, marked isActive, and presented under
          a genuine affiliate-disclosure notice. A health-adjacent product must not
          recommend practitioners that do not exist (Core Principle 6). The page,
          its data file and its types are intact and the route returns the moment
          the partners are real; until then the door is closed rather than ajar. */}
      <Route path="/quick-meal" component={() => <ProtectedRoute component={QuickMealPage} />} />
      <Route path="/list" component={() => <Redirect to="/shopping-workspace" />} />
      <Route path="/shopping-list" component={() => <Redirect to="/shopping-workspace" />} />
      <Route path="/shopping-workspace" component={() => <ProtectedRoute component={ShoppingWorkspacePage} />} />

      {/* BUS1 — the household-facing trust surfaces. All three hang off Profile,
          which is where a person already goes to change something about
          themselves rather than about their food. */}
      <Route path="/privacy-settings" component={() => <ProtectedRoute component={PrivacySettingsPage} />} />
      <Route path="/help" component={() => <ProtectedRoute component={HelpCentrePage} />} />
      <Route path="/contact" component={() => <ProtectedRoute component={ContactPage} />} />

      <Route component={NotFound} />
    </Switch>
    </Suspense>
    </ErrorBoundary>
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
