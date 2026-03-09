import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";

import { TopBar, DesktopSidebar, MobileNav } from "@/components/nav-bar";
import OrchardBackdrop from "@/components/layout/orchard-backdrop";
import OrchardShell from "@/components/layout/orchard-shell";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import OnboardingPage from "@/pages/onboarding-page";
import Dashboard from "@/pages/dashboard";
import MealsPage from "@/pages/meals-page";
import ShoppingListPage from "@/pages/shopping-list-page";
import ImportRecipePage from "@/pages/import-recipe-page";
import ProductsPage from "@/pages/products-page";
import MealPlannerPage from "@/pages/meal-planner-page";
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
import DemoRoute from "@/components/demo-route";
import DemoOverviewPage from "@/pages/demo-overview-page";
import DemoPlannerPage from "@/pages/demo-planner-page";
import DemoBasketPage from "@/pages/demo-basket-page";
import DemoMealsPage from "@/pages/demo-meals-page";
import PartnersPage from "@/pages/partners-page";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Redirect to="/auth" />;
  if (!user.onboardingCompleted) return <Redirect to="/onboarding" />;

  return (
    <div className="relative min-h-[100dvh]">
      <OrchardBackdrop />
      <div className="relative z-10 flex flex-col h-[100dvh]">
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <DesktopSidebar />
          <main className="flex-1 overflow-y-auto main-safe bg-background/25">
            <Component />
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

      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/meals/:id" component={() => <ProtectedRoute component={MealDetailPage} />} />
      <Route path="/meals" component={() => <ProtectedRoute component={MealsPage} />} />
      <Route path="/import-recipe" component={() => <ProtectedRoute component={ImportRecipePage} />} />
      <Route path="/analyse-basket" component={() => <ProtectedRoute component={ShoppingListPage} />} />
      <Route path="/products" component={() => <ProtectedRoute component={ProductsPage} />} />
      <Route path="/planner" component={() => <ProtectedRoute component={MealPlannerPage} />} />
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

      <Route path="/demo" component={() => <DemoRoute component={DemoOverviewPage} />} />
      <Route path="/demo/planner" component={() => <DemoRoute component={DemoPlannerPage} />} />
      <Route path="/demo/basket" component={() => <DemoRoute component={DemoBasketPage} />} />
      <Route path="/demo/meals" component={() => <DemoRoute component={DemoMealsPage} />} />

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
