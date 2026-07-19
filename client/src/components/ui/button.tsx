import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { warnIfUnnamedIconButton } from "@/lib/a11y-dev-warnings"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0" +
  // PX1-W2 (fnd-px-touch-floor-absent): `touch-target` extends the hit area to
  // ≥44×44 on coarse pointers whatever the visual size; `relative` anchors it
  // (an explicit position class from a call site still wins via twMerge).
  " hover-elevate active-elevate-2 relative touch-target",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-primary-border",
        destructive:
          "bg-destructive text-destructive-foreground border border-destructive-border",
        outline:
          // Shows the background color of whatever card / sidebar / accent background it is inside of.
          // Inherits the current text color.
          " border [border-color:var(--button-outline)]  shadow-xs active:shadow-none ",
        secondary: "border bg-secondary text-secondary-foreground border border-secondary-border ",
        // Add a transparent border so that when someone toggles a border on later, it doesn't shift layout/size.
        ghost: "border border-transparent",
      },
      // Heights are set as "min" heights, because sometimes Ai will place large amount of content
      // inside buttons. With a min-height they will look appropriate with small amounts of content,
      // but will expand to fit large amounts of content.
      size: {
        default: "min-h-9 px-4 py-2",
        sm: "min-h-8 rounded-md px-3 text-xs",
        lg: "min-h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<VariantProps<typeof buttonVariants>, "variant"> {
  asChild?: boolean
  /**
   * Required (PX1-W4.6, fnd-px-primary-action-unenforceable). EXP §7 demands
   * exactly one obvious next thing to do on a surface — unenforceable while
   * "primary" happened by omission (PX1 counted 4 explicit `default`s against
   * 124 implicit ones). A surface must now DECLARE what its primary action is:
   * `variant="default"` is a statement, not an accident.
   */
  variant: NonNullable<VariantProps<typeof buttonVariants>["variant"]>
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    // PROD4 — an icon-only button has no text to be named by. Development-only;
    // production builds strip it. Same owner as the Input/Textarea enforcement.
    if (size === "icon") warnIfUnnamedIconButton(props)
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
