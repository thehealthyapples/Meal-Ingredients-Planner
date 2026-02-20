import { useUser } from "@/hooks/use-user";
import { useMeals } from "@/hooks/use-meals";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Utensils, ShoppingBasket, Plus, ArrowRight,
  CalendarDays, Package, Apple, TrendingUp,
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { api } from "@shared/routes";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user } = useUser();
  const { meals } = useMeals();

  const { data: shoppingListItems = [] } = useQuery<any[]>({
    queryKey: [api.shoppingList.list.path],
    enabled: !!user,
  });

  const { data: plannerWeeks = [] } = useQuery<any[]>({
    queryKey: ['/api/planner/weeks'],
    enabled: !!user,
  });

  const userMeals = meals?.filter(m => !m.isSystemMeal) || [];
  const recipeMeals = meals?.filter(m => !m.isReadyMeal) || [];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } }
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-[28px] font-semibold tracking-tight" data-testid="text-welcome">
          {getGreeting()}, <span className="text-primary">{user?.username}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here's your meal planning overview
        </p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={item}>
          <Card className="h-full" data-testid="card-total-meals">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">My Meals</span>
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Utensils className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-semibold tracking-tight" data-testid="text-meal-count">{userMeals.length}</div>
              <p className="text-xs text-muted-foreground mt-1">recipes saved</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="h-full" data-testid="card-basket-items">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Basket</span>
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ShoppingBasket className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-semibold tracking-tight">{shoppingListItems.length}</div>
              <p className="text-xs text-muted-foreground mt-1">items to buy</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="h-full" data-testid="card-recipes">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recipes</span>
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-semibold tracking-tight">{recipeMeals.length}</div>
              <p className="text-xs text-muted-foreground mt-1">from scratch</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="h-full" data-testid="card-planner">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Planner</span>
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CalendarDays className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-semibold tracking-tight">{plannerWeeks.length || 6}</div>
              <p className="text-xs text-muted-foreground mt-1">weeks planned</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <motion.div variants={item}>
          <h2 className="text-xl font-semibold tracking-tight mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/meals">
              <Card className="group cursor-pointer hover-elevate transition-all duration-200" data-testid="action-add-meal">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Add Meal</p>
                    <p className="text-xs text-muted-foreground">Browse or create recipes</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/weekly-planner">
              <Card className="group cursor-pointer hover-elevate transition-all duration-200" data-testid="action-view-planner">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">View Planner</p>
                    <p className="text-xs text-muted-foreground">Plan your weekly meals</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/analyse-basket">
              <Card className="group cursor-pointer hover-elevate transition-all duration-200" data-testid="action-analyse-basket">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                    <ShoppingBasket className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Analyse Basket</p>
                    <p className="text-xs text-muted-foreground">Check prices and products</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </motion.div>

        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold tracking-tight">Recent Meals</h2>
            {meals && meals.length > 0 && (
              <Link href="/meals">
                <Button variant="ghost" className="text-sm text-muted-foreground gap-1" data-testid="link-view-all-meals">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
          </div>
          {(!meals || userMeals.length === 0) ? (
            <Card className="border-dashed" data-testid="card-empty-meals">
              <CardContent className="py-12 text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Utensils className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-base">No meals yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                  Start by adding your favourite recipes to build your personal collection.
                </p>
                <Link href="/meals">
                  <Button className="mt-5" data-testid="button-add-first-meal">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Meal
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {userMeals.slice(0, 4).map((meal) => (
                <Link key={meal.id} href={`/meals/${meal.id}`}>
                  <Card className="group cursor-pointer overflow-hidden hover-elevate transition-all duration-200" data-testid={`card-recent-meal-${meal.id}`}>
                    {meal.imageUrl ? (
                      <div className="w-full aspect-[4/3] overflow-hidden bg-muted">
                        <img
                          src={meal.imageUrl}
                          alt={meal.name}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-[4/3] bg-muted/50 flex items-center justify-center">
                        <Utensils className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-medium text-sm truncate">{meal.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {meal.ingredients.length} ingredients
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
