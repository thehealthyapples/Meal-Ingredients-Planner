import thaAppleUrl from "@/assets/icons/tha-apple.png";

const OVERLAP = 0.38;

function MiniAppleRating({ rating, size = 11 }: { rating: number; size?: number }) {
  const full = Math.floor(Math.max(0, Math.min(5, rating)));
  const overlap = Math.round(size * OVERLAP);
  return (
    <div className="inline-flex items-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <img
          key={i}
          src={thaAppleUrl}
          width={size}
          height={size}
          alt=""
          draggable={false}
          style={{
            display: "block",
            flexShrink: 0,
            marginLeft: i === 0 ? 0 : -overlap,
            opacity: i < full ? 1 : 0.18,
          }}
        />
      ))}
    </div>
  );
}

const CX = 135;
const CY = 135;
const R  = 88;

function pt(deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + R * Math.cos(rad), y: CY + R * Math.sin(rad) };
}

const GAP = 22;
const ARCS = [
  { from: 270 + GAP, to: 360 - GAP, color: "#7c3aed" },
  { from: 0   + GAP, to: 90  - GAP, color: "#0284c7" },
  { from: 90  + GAP, to: 180 - GAP, color: "#15803d" },
  { from: 180 + GAP, to: 270 - GAP, color: "#b45309" },
];

function arcPath(fromDeg: number, toDeg: number) {
  const s = pt(fromDeg);
  const e = pt(toDeg);
  const span = ((toDeg - fromDeg) + 360) % 360;
  const large = span > 180 ? 1 : 0;
  return `M ${s.x},${s.y} A ${R},${R} 0 ${large} 1 ${e.x},${e.y}`;
}

const NODES = [
  {
    deg: 270,
    label: "Kitchen",
    color: "bg-amber-50 border-amber-200",
    labelColor: "text-amber-700",
    testId: "flow-card-kitchen",
    content: (
      <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
        {["🌾","🍝","🥚","🥛"].map(e => (
          <span key={e} className="text-[10px] leading-none">{e}</span>
        ))}
      </div>
    ),
  },
  {
    deg: 0,
    label: "Plan",
    color: "bg-violet-50 border-violet-200",
    labelColor: "text-violet-700",
    testId: "flow-card-plan",
    content: (
      <div className="space-y-px mt-0.5">
        {["🍲 Pasta Bake","🥗 Egg Salad"].map(n => (
          <p key={n} className="text-[8px] text-gray-500 leading-tight truncate">{n}</p>
        ))}
      </div>
    ),
  },
  {
    deg: 90,
    label: "Analyse",
    color: "bg-sky-50 border-sky-200",
    labelColor: "text-sky-700",
    testId: "flow-card-analyse",
    content: (
      <div className="mt-0.5">
        <p className="text-[8px] text-gray-500 truncate">Free Range Eggs</p>
        <MiniAppleRating rating={5} size={10} />
      </div>
    ),
  },
  {
    deg: 180,
    label: "Basket",
    color: "bg-green-50 border-green-200",
    labelColor: "text-green-700",
    testId: "flow-card-basket",
    content: (
      <div className="space-y-px mt-0.5">
        {[["Free Range Eggs","£2.49"],["Greek Yoghurt","£1.29"]].map(([n,p]) => (
          <div key={n} className="flex justify-between gap-1">
            <span className="text-[7px] text-gray-500 truncate">{n}</span>
            <span className="text-[7px] font-bold text-green-700 shrink-0">{p}</span>
          </div>
        ))}
      </div>
    ),
  },
];

const CARD_W = 82;
const CARD_H = 58;

function nodeStyle(deg: number): React.CSSProperties {
  const pos = pt(deg);
  return {
    position: "absolute",
    left: pos.x - CARD_W / 2,
    top:  pos.y - CARD_H / 2,
    width: CARD_W,
    height: CARD_H,
  };
}

export default function ProductFlowVisual() {
  const size = CX * 2 + 4;

  return (
    <div
      className="mt-3 flex flex-col items-center"
      data-testid="kitchen-to-basket-visual"
    >
      <div className="relative" style={{ width: size, height: size }}>

        <svg
          className="absolute inset-0"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          <defs>
            {ARCS.map((a, i) => (
              <marker
                key={i}
                id={`arr${i}`}
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path d="M0,0.5 L0,5.5 L5.5,3 z" fill={a.color} opacity="0.7" />
              </marker>
            ))}
          </defs>

          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {ARCS.map((a, i) => (
            <path
              key={i}
              d={arcPath(a.from, a.to)}
              fill="none"
              stroke={a.color}
              strokeWidth="1.5"
              strokeOpacity="0.55"
              markerEnd={`url(#arr${i})`}
            />
          ))}

          <text
            x={CX}
            y={CY + 5}
            textAnchor="middle"
            fill="#9ca3af"
            fontSize="16"
            fontFamily="sans-serif"
          >
            ↻
          </text>
        </svg>

        {NODES.map((node) => (
          <div
            key={node.deg}
            className={`rounded-lg border shadow-sm px-2 py-1.5 ${node.color}`}
            style={nodeStyle(node.deg)}
            data-testid={node.testId}
          >
            <p className={`text-[9px] font-bold uppercase tracking-wider leading-none ${node.labelColor}`}>
              {node.label}
            </p>
            {node.content}
          </div>
        ))}
      </div>

      <p className="mt-2 text-[8px] font-semibold uppercase tracking-widest text-gray-300">
        Kitchen · Plan · Analyse · Basket · Kitchen
      </p>
    </div>
  );
}
