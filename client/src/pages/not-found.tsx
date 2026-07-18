// PROD1 — the wrong-door page.
//
// This file previously read, to the household: "Did you forget to add the page to
// the router?" — a question addressed to a developer, shipped to every person who
// mistyped a URL, followed a stale link, or opened an expired share. It is the
// catch-all at App.tsx's `<Route component={NotFound} />`, so it is the one page
// in THA that anyone can reach by accident. It also styled itself in `bg-gray-50`
// and `text-red-500` — raw Tailwind greys and a destructive red, bypassing the
// design system every other surface uses, so the one page a lost household sees
// was also the one page that did not look like THA.
//
// It is now written the way the house is written (EXPBLUE1 §5.1 — every domain is
// a room in one home): a wrong door is not an error and must not be dressed as
// one. Nothing has broken, nothing is lost, and the household is not at fault —
// so there is no alarm colour, no error iconography, and no apology for a failure
// that did not occur. It says where they are, and it opens the door back to Home.
//
// Owners adopted, not re-created: Card (surface), Button (the one action),
// semantic tokens (`bg-background`, `text-muted-foreground`) rather than raw
// greys. It deliberately does NOT adopt EmptyState — a missing page is not "you
// have nothing yet" — nor LoadError, whose sentence is "we couldn't load this",
// which would claim a failure that never happened (Core Principle 6).

import { Link } from "wouter";
import { Compass, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-background px-4"
      data-testid="page-not-found"
    >
      <Card className="w-full max-w-md">
        <CardContent className="py-8 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-primary/10">
            <Compass className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>

          <h1 className="title-card">This door doesn't open onto anything</h1>

          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
            The page you were looking for isn't here. Nothing has gone wrong, and
            nothing of yours has been lost — this address just doesn't lead
            anywhere in the house.
          </p>

          <Button asChild variant="default" className="mt-6" data-testid="button-not-found-home">
            <Link href="/home">
              <Home className="w-4 h-4 mr-1.5" aria-hidden="true" />
              Take me home
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
