import { Link } from "wouter";
import { CalendarDays, ShoppingBasket, UtensilsCrossed, User, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEMO_HOUSEHOLD, DEMO_MEALS } from "@/lib/demo-data";

export default function DemoOverviewPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-10">
      {/* Hero */}
      <div className="text-center space-y-3 pt-4">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="demo-overview-title">
          Welcome to The Healthy Apples
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
          Plan healthy meals for your whole family, build shopping lists automatically, and
          track what you eat - all in one place. This is a read-only demo showing what THA
          looks like with a real household.
        </p>
      </div>

      {/* Household */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          The Demo Household
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="demo-household-grid">
          {DEMO_HOUSEHOLD.map((member) => (
            <Card key={member.id} data-testid={`card-member-${member.id}`}>
              <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {member.initial}
                </div>
                <span className="font-medium text-sm">{member.name}</span>
                <Badge variant={member.role === "parent" ? "default" : "secondary"} className="capitalize text-xs">
                  {member.role}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* This Week's Plan */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          This Week's Meals
        </h2>
        <div className="flex flex-wrap gap-2" data-testid="demo-meals-chips">
          {DEMO_MEALS.map((meal) => (
            <Badge key={meal.id} variant="outline" className="px-3 py-1 text-sm" data-testid={`chip-meal-${meal.id}`}>
              {meal.name}
            </Badge>
          ))}
        </div>
      </section>

      {/* Navigation Cards */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Explore the Demo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="demo-nav-cards">
          <Link href="/demo/planner">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" data-testid="card-nav-planner">
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <CalendarDays className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">Planner</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    View the weekly meal grid
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/demo/basket">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" data-testid="card-nav-basket">
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <ShoppingBasket className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold">Shopping Basket</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Browse this week's grocery list
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/demo/meals">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" data-testid="card-nav-meals">
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center">
                  <UtensilsCrossed className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold">Meals</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    See the saved recipe library
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* Footer note */}
      <div className="text-center text-sm text-muted-foreground pb-4" data-testid="demo-footer-note">
        Product analysis and meal analysis require a free account.{" "}
        <Link href="/auth" className="text-primary font-medium hover:underline" data-testid="link-demo-footer-signup">
          Sign up for free
        </Link>
        .
      </div>
    </div>
  );
}
