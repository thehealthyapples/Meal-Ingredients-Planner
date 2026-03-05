import { useEffect, useRef } from "react";

export default function OrchardBackdrop() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const scrollContainer =
      document.querySelector<HTMLElement>("main.overflow-y-auto") ||
      document.querySelector<HTMLElement>("main") ||
      null;

    const getStrength = () => {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue("--orchard-parallax-strength")
        .trim();
      return parseFloat(raw) || 10;
    };

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const scrollTop = scrollContainer
          ? scrollContainer.scrollTop
          : window.scrollY;
        const strength = getStrength();
        const nearY = Math.min(scrollTop * 0.02, strength);
        const farY = Math.min(scrollTop * 0.01, strength / 2);
        el.style.setProperty("--orchard-near-y", `${nearY}px`);
        el.style.setProperty("--orchard-far-y", `${farY}px`);
      });
    };

    const target = scrollContainer || window;
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      target.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      aria-hidden
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <svg
        viewBox="0 0 1440 810"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: "var(--orchard-opacity, 0.65)",
        }}
      >
        <defs>
          <linearGradient id="orchardSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="hsl(42,30%,90%)" />
            <stop offset="55%"  stopColor="hsl(185,18%,82%)" />
            <stop offset="100%" stopColor="hsl(132,18%,75%)" />
          </linearGradient>

          <radialGradient id="orchardSunGlow" cx="76%" cy="16%" r="18%" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="hsl(42,89%,72%)" stopOpacity="0.55" />
            <stop offset="50%"  stopColor="hsl(42,89%,72%)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="hsl(42,89%,72%)" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="orchardSunDisc" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="hsl(48,95%,80%)" />
            <stop offset="60%"  stopColor="hsl(42,89%,68%)" />
            <stop offset="100%" stopColor="hsl(36,80%,58%)" />
          </radialGradient>
        </defs>

        {/* ── SKY ── */}
        <rect width="1440" height="810" fill="url(#orchardSky)" />

        {/* ── SUN GLOW ── */}
        <ellipse cx="1096" cy="148" rx="220" ry="200" fill="url(#orchardSunGlow)" />

        {/* ── SUN DISC ── */}
        <circle cx="1096" cy="148" r="58" fill="url(#orchardSunDisc)" />

        {/* ── SUN RAYS ── */}
        {[0, 35, 70, 105, 140, 175, 210, 245, 280, 315].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 1096 + Math.cos(rad) * 68;
          const y1 = 148 + Math.sin(rad) * 68;
          const x2 = 1096 + Math.cos(rad) * (i % 2 === 0 ? 100 : 88);
          const y2 = 148 + Math.sin(rad) * (i % 2 === 0 ? 100 : 88);
          return (
            <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="hsl(48,95%,82%)" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
          );
        })}

        {/* ── FAR HILLS ── */}
        <path
          d="M0 400 Q180 310 360 350 Q540 390 720 320 Q900 250 1080 300 Q1260 350 1440 290 L1440 810 L0 810Z"
          fill="hsl(132,12%,67%)"
        />
        <path
          d="M0 450 Q200 390 400 420 Q600 450 800 400 Q1000 350 1200 390 Q1350 420 1440 395 L1440 810 L0 810Z"
          fill="hsl(132,15%,59%)"
        />

        {/* ── FAR TREES (slow parallax) ── */}
        <g style={{ transform: "translateY(var(--orchard-far-y, 0px))" }}>
          {([55, 190, 350, 530, 700, 875, 1065, 1250, 1395] as const).map((x, i) => {
            const cx = x;
            const baseY = 432 + (i % 3) * 4;
            const ry = 30 + (i % 3) * 4;
            const rx = 26 + (i % 2) * 3;
            return (
              <g key={x}>
                <rect x={cx - 3} y={baseY} width={6} height={26} rx={2}
                  fill="hsl(28,35%,38%)" opacity="0.85" />
                <ellipse cx={cx} cy={baseY - ry * 0.7} rx={rx} ry={ry}
                  fill="hsl(132,20%,40%)" opacity="0.80" />
                <circle cx={cx - 10} cy={baseY - ry * 0.9} r={4}
                  fill="hsl(5,65%,50%)" opacity="0.75" />
                <circle cx={cx + 9}  cy={baseY - ry * 1.05} r={3.5}
                  fill="hsl(42,89%,55%)" opacity="0.75" />
              </g>
            );
          })}
        </g>

        {/* ── MID GROUND ── */}
        <path
          d="M0 530 Q180 505 360 520 Q540 535 720 508 Q900 482 1100 518 Q1280 545 1440 518 L1440 810 L0 810Z"
          fill="hsl(132,22%,52%)"
        />

        {/* ── NEAR TREES (near parallax) ── */}
        <g style={{ transform: "translateY(var(--orchard-near-y, 0px))" }}>
          {([
            { x: 88,   baseY: 598, rx: 60, ry: 70 },
            { x: 268,  baseY: 602, rx: 66, ry: 76 },
            { x: 458,  baseY: 596, rx: 58, ry: 68 },
            { x: 648,  baseY: 604, rx: 70, ry: 80 },
            { x: 838,  baseY: 600, rx: 63, ry: 73 },
            { x: 1026, baseY: 602, rx: 67, ry: 77 },
            { x: 1215, baseY: 596, rx: 61, ry: 71 },
            { x: 1378, baseY: 594, rx: 55, ry: 64 },
          ]).map(({ x, baseY, rx, ry }) => (
            <g key={x}>
              <rect x={x - 7} y={baseY} width={14} height={88} rx={4}
                fill="hsl(28,38%,38%)" />
              <ellipse cx={x} cy={baseY - ry * 0.72} rx={rx} ry={ry}
                fill="hsl(132,22%,33%)" />
              <circle cx={x - 22} cy={baseY - ry * 0.85} r={9}
                fill="hsl(5,68%,50%)" opacity="0.88" />
              <circle cx={x + 18} cy={baseY - ry * 0.98} r={8.5}
                fill="hsl(42,89%,53%)" opacity="0.88" />
              <circle cx={x - 5}  cy={baseY - ry * 0.60} r={9}
                fill="hsl(5,68%,50%)" opacity="0.88" />
              <circle cx={x + 28} cy={baseY - ry * 0.72} r={7.5}
                fill="hsl(5,68%,50%)" opacity="0.80" />
            </g>
          ))}
        </g>

        {/* ── NEAR MEADOW ── */}
        <path
          d="M0 685 Q360 660 720 674 Q1080 688 1440 665 L1440 810 L0 810Z"
          fill="hsl(118,25%,72%)"
        />

        {/* ── GRASS SHIMMER (subtle highlight on meadow edge) ── */}
        <path
          d="M0 685 Q360 660 720 674 Q1080 688 1440 665"
          stroke="hsl(118,30%,82%)" strokeWidth="3" fill="none" opacity="0.45"
        />
      </svg>
    </div>
  );
}
