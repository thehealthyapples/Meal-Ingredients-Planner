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

  const farTrees: { x: number; by: number }[] = [
    { x: 155, by: 312 },
    { x: 300, by: 295 },
    { x: 460, by: 304 },
    { x: 650, by: 292 },
    { x: 840, by: 308 },
    { x: 1020, by: 296 },
    { x: 1220, by: 305 },
  ];

  const leftTrees: { x: number; by: number }[] = [
    { x: 45,  by: 570 },
    { x: 110, by: 558 },
    { x: 175, by: 578 },
  ];

  const rightTrees: { x: number; by: number }[] = [
    { x: 1280, by: 562 },
    { x: 1350, by: 548 },
    { x: 1415, by: 570 },
  ];

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
          opacity: "var(--orchard-opacity, 0.72)",
        }}
      >
        <defs>
          {/* Blur filters for organic tree softness */}
          <filter id="orchBlur4" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <filter id="orchBlur7" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          <filter id="orchBlur12" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="12" />
          </filter>

          {/* Sky: pale blue-cream top → warm golden horizon → sage lower */}
          <linearGradient id="orchardSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="hsl(200,22%,93%)" />
            <stop offset="40%"  stopColor="hsl(48,75%,88%)" />
            <stop offset="75%"  stopColor="hsl(140,20%,80%)" />
            <stop offset="100%" stopColor="hsl(130,28%,72%)" />
          </linearGradient>

          {/* Sunrise glow: large diffuse golden radial on the left */}
          <radialGradient id="orchardSunGlow" cx="18%" cy="65%" r="52%" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="hsl(50,95%,85%)" stopOpacity="0.80" />
            <stop offset="35%"  stopColor="hsl(48,88%,82%)" stopOpacity="0.45" />
            <stop offset="65%"  stopColor="hsl(46,70%,80%)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="hsl(44,55%,78%)" stopOpacity="0" />
          </radialGradient>

          {/* Hill gradients */}
          <linearGradient id="hillFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="hsl(140,18%,74%)" />
            <stop offset="100%" stopColor="hsl(140,14%,65%)" />
          </linearGradient>
          <linearGradient id="hillMid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="hsl(130,28%,63%)" />
            <stop offset="100%" stopColor="hsl(130,24%,54%)" />
          </linearGradient>
          <linearGradient id="hillNearA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="hsl(125,36%,55%)" />
            <stop offset="100%" stopColor="hsl(125,32%,46%)" />
          </linearGradient>
          <linearGradient id="hillNearB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="hsl(120,40%,50%)" />
            <stop offset="100%" stopColor="hsl(118,38%,40%)" />
          </linearGradient>

          {/* Fog dissolve: bottom of image fades to white mist */}
          <linearGradient id="orchardFog" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="hsl(0,0%,100%)" stopOpacity="0" />
            <stop offset="55%"  stopColor="hsl(0,0%,100%)" stopOpacity="0" />
            <stop offset="80%"  stopColor="hsl(0,0%,100%)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="hsl(0,0%,100%)" stopOpacity="0.62" />
          </linearGradient>
        </defs>

        {/* ── 1. SKY ── */}
        <rect width="1440" height="810" fill="url(#orchardSky)" />

        {/* ── 2. SUNRISE GLOW (large diffuse, left-centre) ── */}
        <ellipse cx="260" cy="528" rx="520" ry="440" fill="url(#orchardSunGlow)" />

        {/* ── 3. SUN DISC (soft bloomy circle near left horizon) ── */}
        <circle cx="248" cy="484" r="42" fill="hsl(52,100%,90%)" filter="url(#orchBlur12)" opacity="0.92" />

        {/* ── 4. FAR HILL ── */}
        <g style={{ transform: "translateY(var(--orchard-far-y, 0px))" }}>
          <path
            d="M0 390 C220 300 440 340 660 310 C880 280 1100 320 1300 300 C1380 292 1420 308 1440 300 L1440 810 L0 810Z"
            fill="url(#hillFar)"
          />

          {/* ── 5. FAR TREE SILHOUETTES (blurred organic blobs on far hill crest) ── */}
          {farTrees.map(({ x, by }) => (
            <g key={x} filter="url(#orchBlur4)" fill="hsl(130,22%,38%)" opacity="0.72">
              <ellipse cx={x}      cy={by - 46} rx={32} ry={38} />
              <ellipse cx={x - 20} cy={by - 30} rx={22} ry={26} />
              <ellipse cx={x + 18} cy={by - 24} rx={19} ry={23} />
              <ellipse cx={x + 4}  cy={by - 62} rx={18} ry={22} />
              <rect x={x - 4} y={by - 8} width={8} height={22} rx={2} />
            </g>
          ))}
        </g>

        {/* ── 6. MID HILL ── */}
        <path
          d="M0 460 C180 420 380 445 580 428 C780 412 980 448 1180 432 C1340 420 1400 438 1440 432 L1440 810 L0 810Z"
          fill="url(#hillMid)"
        />

        {/* ── 7. NEAR HILL A ── */}
        <path
          d="M0 560 C160 530 340 548 560 535 C780 522 1000 545 1200 532 C1340 522 1400 538 1440 532 L1440 810 L0 810Z"
          fill="url(#hillNearA)"
        />

        {/* ── 8. WINDING PATH ── */}
        <g style={{ transform: "translateY(var(--orchard-near-y, 0px))" }}>
          {/* Shadow stroke */}
          <path
            d="M720 810 C660 730 560 668 430 608 C320 554 268 510 252 484"
            stroke="hsl(44,28%,60%)" strokeWidth="34" fill="none" opacity="0.28"
            strokeLinecap="round"
          />
          {/* Highlight stroke */}
          <path
            d="M720 810 C660 730 560 668 430 608 C320 554 268 510 252 484"
            stroke="hsl(44,42%,86%)" strokeWidth="20" fill="none" opacity="0.50"
            strokeLinecap="round"
          />

          {/* ── 9. LEFT TREE CLUSTER (near side) ── */}
          {leftTrees.map(({ x, by }) => (
            <g key={x} filter="url(#orchBlur7)" fill="hsl(128,28%,33%)" opacity="0.80">
              <ellipse cx={x}      cy={by - 60} rx={40} ry={50} />
              <ellipse cx={x - 26} cy={by - 42} rx={28} ry={34} />
              <ellipse cx={x + 22} cy={by - 36} rx={24} ry={30} />
              <ellipse cx={x - 8}  cy={by - 80} rx={22} ry={28} />
              <rect x={x - 5} y={by - 10} width={10} height={24} rx={3} />
            </g>
          ))}

          {/* ── 10. RIGHT TREE CLUSTER (near side) ── */}
          {rightTrees.map(({ x, by }) => (
            <g key={x} filter="url(#orchBlur7)" fill="hsl(128,28%,33%)" opacity="0.80">
              <ellipse cx={x}      cy={by - 58} rx={38} ry={48} />
              <ellipse cx={x - 24} cy={by - 40} rx={26} ry={32} />
              <ellipse cx={x + 20} cy={by - 34} rx={22} ry={28} />
              <ellipse cx={x + 6}  cy={by - 76} rx={20} ry={26} />
              <rect x={x - 5} y={by - 10} width={10} height={22} rx={3} />
            </g>
          ))}
        </g>

        {/* ── 11. NEAR HILL B (foreground) ── */}
        <path
          d="M0 648 C200 622 440 638 720 628 C980 618 1220 635 1440 624 L1440 810 L0 810Z"
          fill="url(#hillNearB)"
        />

        {/* ── 12. FOG DISSOLVE (bottom mist) ── */}
        <rect width="1440" height="810" fill="url(#orchardFog)" />
      </svg>
    </div>
  );
}
