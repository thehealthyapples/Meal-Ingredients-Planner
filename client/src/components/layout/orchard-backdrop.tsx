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
        viewBox="0 0 1440 200"
        preserveAspectRatio="xMidYMax slice"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: "var(--orchard-opacity, 0.35)",
          filter: "blur(0.6px)",
        }}
      >
        <defs>
          <radialGradient
            id="orchardSunGlow"
            cx="50%"
            cy="40%"
            r="40%"
            gradientUnits="userSpaceOnUse"
            gradientTransform="scale(1440 200)"
          >
            <stop offset="0%" stopColor="hsl(var(--secondary) / 0.16)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient
            id="orchardSkyWash"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor="hsl(var(--secondary) / 0.08)" />
            <stop offset="100%" stopColor="hsl(var(--background) / 0)" />
          </linearGradient>
        </defs>

        <rect width="1440" height="200" fill="url(#orchardSkyWash)" />
        <ellipse
          cx="720"
          cy="80"
          rx="360"
          ry="120"
          fill="hsl(var(--secondary) / 0.12)"
        />

        <g style={{ transform: "translateY(var(--orchard-far-y, 0px))" }}>
          <path
            d="M0 110 Q360 60 720 90 Q1080 120 1440 80 L1440 200 L0 200Z"
            fill="hsl(var(--accent))"
          />
          <ellipse cx="115" cy="100" rx="14" ry="18" fill="hsl(var(--primary) / 0.20)" />
          <rect x="113" y="114" width="3" height="10" fill="hsl(var(--primary) / 0.20)" />
          <ellipse cx="148" cy="106" rx="11" ry="15" fill="hsl(var(--primary) / 0.18)" />
          <rect x="146" y="118" width="3" height="8" fill="hsl(var(--primary) / 0.18)" />
          <ellipse cx="88" cy="108" rx="10" ry="13" fill="hsl(var(--primary) / 0.16)" />
          <rect x="86" y="119" width="3" height="7" fill="hsl(var(--primary) / 0.16)" />
        </g>

        <g style={{ transform: "translateY(var(--orchard-near-y, 0px))" }}>
          <path
            d="M0 140 Q360 100 720 125 Q1080 150 1440 118 L1440 200 L0 200Z"
            fill="hsl(var(--primary) / 0.18)"
          />
          <path
            d="M0 165 Q480 140 960 158 Q1200 168 1440 148 L1440 200 L0 200Z"
            fill="hsl(var(--primary) / 0.10)"
          />
          <ellipse cx="1285" cy="125" rx="16" ry="21" fill="hsl(var(--primary) / 0.22)" />
          <rect x="1283" y="143" width="3" height="12" fill="hsl(var(--primary) / 0.22)" />
          <ellipse cx="1320" cy="133" rx="13" ry="17" fill="hsl(var(--primary) / 0.20)" />
          <rect x="1318" y="147" width="3" height="9" fill="hsl(var(--primary) / 0.20)" />
          <ellipse cx="1258" cy="136" rx="11" ry="14" fill="hsl(var(--primary) / 0.18)" />
          <rect x="1256" y="148" width="3" height="7" fill="hsl(var(--primary) / 0.18)" />
          <path
            d="M640 200 Q700 160 780 148 Q860 136 960 200"
            stroke="hsl(var(--background) / 0.5)"
            strokeWidth="5"
            fill="none"
          />
        </g>
      </svg>
    </div>
  );
}
