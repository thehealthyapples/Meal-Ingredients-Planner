import * as React from "react"

import { cn } from "@/lib/utils"

// INTARCH2 — THE CARD IS MADE OF THE HOUSE.
//
// This was `rounded-xl border bg-card/82 backdrop-blur-md border-border
// shadow-none`: tinted glass with a line drawn round it, casting nothing. It was
// the correct shape while rooms had no floor. INTARCH1 gave them one, and a
// surface that casts no shadow onto a floor it is standing on is a surface that
// is printed on the floor rather than resting on it.
//
// It is now PLASTER — the primary tier of the one material system, solid and lit
// (Blueprint § 8.2, "solidity follows importance"; the values are NORTH2's, in
// index.css). The four literals are gone and `.surface-primary` reads the tokens
// instead, so the radius law, the shadow definition and dark mode each have
// exactly one owner (UIA § 16) and this file states none of them.
//
// `shadcn-card` is retained: it is the adoption register's machine hook and the
// probe's, and it is how the house can still find every card it owns.
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "shadcn-card surface-primary text-card-foreground",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-4", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader"

// PX1-W4.11 (fnd-px-cardtitle-not-heading, fnd-px-cardtitle-default-dead).
// CardTitle used to render a <div> at text-2xl — a default so wrong that 85 of its
// 86 usages overrode it, and a mark so meaningless that screen-reader heading
// navigation found ONE entry on the densest household pages. It is now a real
// heading (h3 by default: page h1 → section h2 → card h3) whose default is the
// THA type scale's `.title-card` rung (16px/22px, 500, display face — index.css),
// expressed as Tailwind utilities so a call site can still override via twMerge.
type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement> & {
  /** Heading level. Keep it in document order; never pick by size — size is CSS. */
  as?: "h2" | "h3" | "h4";
};

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Comp = "h3", ...props }, ref) => (
    <Comp
      ref={ref}
      className={cn("font-display text-base leading-snug font-medium", className)}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-4 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
}
