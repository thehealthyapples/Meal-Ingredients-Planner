import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { Link } from "wouter";
import {
  ShieldCheck, Users, Star, Sliders,
  Sparkles, BarChart3, FlaskConical, Eye,
  ChevronRight, ClipboardList, Activity, ListTree, Globe2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import NotFound from "./not-found";

const ADMIN_SECTIONS = [
  {
    id: "overview",
    title: "Overview",
    description: "Admin dashboard overview and statistics",
    icon: Eye,
    href: null,
    status: "coming-soon",
  },
  {
    id: "users",
    title: "Users",
    description: "Manage user accounts and roles",
    icon: Users,
    href: "/admin/users",
    status: "active",
  },
  {
    id: "picks",
    title: "Picks",
    description: "Manage ingredient products and recommendations",
    icon: Star,
    href: "/admin/ingredient-products",
    status: "active",
  },
  {
    id: "recipe-sources",
    title: "Recipe Sources",
    description: "Configure recipe acquisition sources",
    icon: Sliders,
    href: "/admin/recipe-sources",
    status: "active",
  },
  {
    id: "companion-intelligence",
    title: "Companion Intelligence",
    description: "Manage companion personality and behavior",
    icon: Sparkles,
    href: "/admin/companion-intelligence",
    status: "active",
  },
  {
    id: "benchmark-households",
    title: "Benchmark Households",
    description: "Manage benchmark test households",
    icon: FlaskConical,
    href: "/admin/benchmark-households",
    status: "active",
  },
  {
    id: "development-world",
    title: "Development World",
    description: "Read-only view of the 50 Development World households (DEV only)",
    icon: Globe2,
    href: "/admin/development-world",
    status: "active",
  },
  {
    id: "intelligence-dashboard",
    title: "Intelligence Dashboard",
    description: "Monitor AI capability benchmarks",
    icon: BarChart3,
    href: "/admin/intelligence",
    status: "active",
  },
  {
    id: "knowledge-review",
    title: "Knowledge Review",
    description: "Review unresolved knowledge terms from the resolver",
    icon: ClipboardList,
    href: "/admin/knowledge-review",
    status: "active",
  },
  {
    id: "observations",
    title: "Observation Workbench",
    description: "Runtime telemetry across the Intelligence Platform — capability health, intent quality, context composition, companion outcomes and diagnostics.",
    icon: Activity,
    href: "/admin/observations",
    status: "active",
  },
  {
    id: "behaviour",
    title: "Behaviour Workbench",
    description: "Execution Timeline — reconstruct the complete execution path of an individual Companion interaction from Observation Engine telemetry.",
    icon: ListTree,
    href: "/admin/behaviour",
    status: "active",
  },
];

function AdminCard({
  section,
}: {
  section: (typeof ADMIN_SECTIONS)[0];
}) {
  const Icon = section.icon;
  const isActive = section.status === "active";

  if (isActive) {
    return (
      <Link href={section.href!}>
        <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{section.title}</CardTitle>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <CardDescription className="mt-2 text-xs">
              {section.description}
            </CardDescription>
          </CardHeader>
        </Card>
      </Link>
    );
  }

  return (
    <Card className="h-full opacity-60">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base text-muted-foreground">{section.title}</CardTitle>
            </div>
          </div>
        </div>
        <CardDescription className="mt-2 text-xs">
          {section.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground font-medium">Coming soon</p>
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const { user, isLoading } = useUser();
  const [location] = useLocation();

  if (isLoading) {
    return null;
  }

  if (!user || (user as any)?.role !== "admin") {
    return <NotFound />;
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-6xl mx-auto" data-testid="admin-page">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="p-2 bg-accent/10 rounded-lg">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage users, configurations, and platform settings
          </p>
        </div>
      </div>

      {/* Grid of admin sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="admin-sections-grid">
        {ADMIN_SECTIONS.map((section) => (
          <AdminCard key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}
