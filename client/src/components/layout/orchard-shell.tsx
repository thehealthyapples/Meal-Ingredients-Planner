import OrchardBackdrop from "./orchard-backdrop";

export default function OrchardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[100dvh]">
      <OrchardBackdrop />
      <div className="relative z-10 min-h-[100dvh] flex items-center justify-center bg-background/70">
        {children}
      </div>
    </div>
  );
}
