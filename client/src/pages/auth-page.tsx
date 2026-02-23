import { useUser } from "@/hooks/use-user";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Lock } from "lucide-react";
import { useLocation } from "wouter";
import FiveApplesLogo from "@/components/FiveApplesLogo";

export default function AuthPage() {
  const { login, user } = useUser();
  const [, setLocation] = useLocation();

  if (user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-primary overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-primary-foreground mb-8">
            <FiveApplesLogo size={32} />
            <h1 className="text-3xl font-bold font-display tracking-tight" data-testid="text-brand-title">The Healthy Apples</h1>
          </div>
          
          <div className="space-y-6 max-w-lg">
            <h2 className="text-5xl font-bold font-display text-white leading-tight">
              Plan your meals,<br/>
              <span className="text-secondary-foreground">Simplify your shopping.</span>
            </h2>
            <p className="text-lg text-primary-foreground/90 leading-relaxed">
              Create custom meal plans, organise your favourite recipes, and automatically analyse your basket in seconds.
            </p>
          </div>
        </div>

        <div className="relative h-64 mt-12 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
          <img 
            src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=1000" 
            alt="Fresh ingredients layout"
            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
            <p className="text-white font-medium">Start eating better today.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="text-xs">
                <Lock className="h-3 w-3 mr-1" />
                Private Beta
              </Badge>
            </div>
            <h2 className="text-2xl font-bold tracking-tight" data-testid="text-auth-title">Welcome back</h2>
            <p className="text-muted-foreground mt-2" data-testid="text-auth-subtitle">Sign in with your beta account to access The Healthy Apples.</p>
          </div>

          <AuthForm onSubmit={(data) => login(data)} />

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground" data-testid="text-beta-notice">
              This app is in private beta. To request access, please contact the team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthForm({ onSubmit }: { onSubmit: (data: InsertUser) => void }) {
  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: { username: "", password: "" },
  });

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" className="h-12 bg-white/50" {...field} data-testid="input-username" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter your password" className="h-12 bg-white/50" {...field} data-testid="input-password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20"
              disabled={form.formState.isSubmitting}
              data-testid="button-login"
            >
              Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
