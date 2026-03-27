export default function OrchardHero() {
  return (
    <svg
      viewBox="0 0 1440 120"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ display: "block", width: "100%", height: "100%" }}
    >
      <path
        d="M0 70 Q120 40 240 60 Q360 80 480 50 Q600 20 720 45 Q840 70 960 48 Q1080 26 1200 52 Q1320 78 1440 58 L1440 120 L0 120Z"
        fill="hsl(var(--primary) / 0.12)"
      />
      <path
        d="M0 88 Q180 65 360 80 Q540 95 720 72 Q900 50 1080 75 Q1260 100 1440 82 L1440 120 L0 120Z"
        fill="hsl(var(--primary) / 0.08)"
      />
      <path
        d="M0 100 Q240 85 480 96 Q720 107 960 92 Q1200 78 1440 96 L1440 120 L0 120Z"
        fill="hsl(var(--primary) / 0.06)"
      />

      {/* Tree silhouettes - left cluster */}
      <g fill="hsl(var(--primary) / 0.18)">
        <ellipse cx="80" cy="72" rx="18" ry="22" />
        <rect x="78" y="88" width="4" height="12" />
        <ellipse cx="108" cy="66" rx="14" ry="18" />
        <rect x="106" y="80" width="4" height="10" />
        <ellipse cx="55" cy="78" rx="12" ry="15" />
        <rect x="53" y="90" width="4" height="10" />
      </g>

      {/* Tree silhouettes - centre-right cluster */}
      <g fill="hsl(var(--primary) / 0.14)">
        <ellipse cx="820" cy="60" rx="20" ry="24" />
        <rect x="818" y="80" width="4" height="14" />
        <ellipse cx="850" cy="68" rx="15" ry="19" />
        <rect x="848" y="84" width="4" height="12" />
        <ellipse cx="795" cy="70" rx="13" ry="16" />
        <rect x="793" y="84" width="4" height="10" />
      </g>

      {/* Tree silhouettes - far right */}
      <g fill="hsl(var(--primary) / 0.16)">
        <ellipse cx="1320" cy="68" rx="18" ry="21" />
        <rect x="1318" y="85" width="4" height="12" />
        <ellipse cx="1350" cy="74" rx="14" ry="17" />
        <rect x="1348" y="88" width="4" height="10" />
      </g>

      {/* Subtle path / road */}
      <path
        d="M640 120 Q700 95 760 88 Q820 82 900 120"
        stroke="hsl(var(--background))"
        strokeWidth="6"
        fill="none"
        opacity="0.4"
      />
    </svg>
  );
}
