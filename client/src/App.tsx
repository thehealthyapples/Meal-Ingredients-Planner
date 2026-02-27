import { useEffect } from "react";
import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";

import { NavBar } from "@/components/nav-bar";
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

function SiteFooter() {
  const { data: config } = useQuery<{ supportEmail?: string; suggestionsEmail?: string }>({
    queryKey: ["/api/config"],
  });
  const support = config?.supportEmail || "support@thehealthyapples.com";
  const suggestions = config?.suggestionsEmail || "suggestions@thehealthyapples.com";

  return (
    <footer className="hidden md:flex items-center justify-center gap-6 py-3 border-t bg-background text-xs text-muted-foreground" data-testid="site-footer">
      <a href={`mailto:${support}`} className="hover:text-primary hover:underline transition-colors" data-testid="footer-link-support">
        Support: {support}
      </a>
      <span aria-hidden="true">·</span>
      <a href={`mailto:${suggestions}`} className="hover:text-primary hover:underline transition-colors" data-testid="footer-link-suggestions">
        Suggestions: {suggestions}
      </a>
    </footer>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (!user.onboardingCompleted) {
    return <Redirect to="/onboarding" />;
  }

  return (
    <>
      <NavBar />
      <main className="min-h-[calc(100vh-4rem)] bg-background pb-20 md:pb-0">
        <Component />
      </main>
      <SiteFooter />
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      
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
