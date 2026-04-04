import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

interface Props {
  trigger?: React.ReactNode;
}

export function UPFInfoModal({ trigger }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span onClick={() => setOpen(true)} className="cursor-pointer inline-flex">
        {trigger ?? (
          <span className="text-xs underline underline-offset-2 text-primary cursor-pointer">What is UPF?</span>
        )}
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ultra-Processed Food (UPF)</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 text-sm leading-relaxed">

            {/* Part 1 — What is UPF */}
            <div className="space-y-2">
              <p className="font-semibold text-foreground">What is it?</p>
              <p className="text-muted-foreground">
                Ultra-processed foods are made mainly from industrial ingredients — things
                you wouldn't find in a home kitchen. Think emulsifiers, artificial flavours,
                modified starches, and colour additives. They're engineered to taste great
                and last a long time, but eating a lot of them regularly is linked to
                poorer health outcomes over time.
              </p>
              <p className="text-muted-foreground">
                Foods are classified using the <strong className="text-foreground">NOVA system</strong>,
                which looks at how processed something is — not just what's on the nutrition label.
                A product can look fine nutritionally but still be heavily processed.
              </p>
            </div>

            <hr className="border-border" />

            {/* Part 2 — THA approach */}
            <div className="space-y-3">
              <p className="font-semibold text-foreground">The Healthy Apples approach</p>
              <div className="space-y-2.5">
                <div className="flex gap-2.5">
                  <span className="shrink-0 mt-0.5">🍎</span>
                  <div>
                    <p className="font-medium text-foreground text-xs">Awareness, not restriction</p>
                    <p className="text-xs text-muted-foreground">Knowing what's in your food is the starting point. We're here to inform, not to judge.</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <span className="shrink-0 mt-0.5">🥗</span>
                  <div>
                    <p className="font-medium text-foreground text-xs">Reduce, don't eliminate</p>
                    <p className="text-xs text-muted-foreground">Occasional processed food is fine. What matters is the overall pattern over time.</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <span className="shrink-0 mt-0.5">🌿</span>
                  <div>
                    <p className="font-medium text-foreground text-xs">Healthy eating over perfection</p>
                    <p className="text-xs text-muted-foreground">No guilt, no all-or-nothing thinking. Small, consistent swaps go further than strict rules.</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <span className="shrink-0 mt-0.5">📊</span>
                  <div>
                    <p className="font-medium text-foreground text-xs">Context counts</p>
                    <p className="text-xs text-muted-foreground">A protein bar after a long run is different from daily ultra-processed snacking. Use scores as a guide, not a verdict.</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground/70 pt-1">
              UPF scores come from Open Food Facts and our additive analysis. They're one useful signal, not the whole picture.
            </p>

          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
