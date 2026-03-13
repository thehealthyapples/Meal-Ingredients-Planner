import thaAppleUrl from "@/assets/icons/tha-apple.png";

const OVERLAP = 0.38;

function MiniAppleRating({ rating, size = 14 }: { rating: number; size?: number }) {
  const full = Math.floor(Math.max(0, Math.min(5, rating)));
  const overlap = Math.round(size * OVERLAP);
  return (
    <div className="inline-flex items-center">
      {Array.from({ length: full }).map((_, i) => (
        <img
          key={i}
          src={thaAppleUrl}
          width={size}
          height={size}
          alt=""
          draggable={false}
          style={{ display: "block", flexShrink: 0, marginLeft: i === 0 ? 0 : -overlap }}
        />
      ))}
      {Array.from({ length: 5 - full }).map((_, i) => (
        <img
          key={`empty-${i}`}
          src={thaAppleUrl}
          width={size}
          height={size}
          alt=""
          draggable={false}
          style={{ display: "block", flexShrink: 0, marginLeft: -overlap, opacity: 0.2 }}
        />
      ))}
    </div>
  );
}

const pantryItems = [
  { name: "Rice", emoji: "🌾" },
  { name: "Pasta", emoji: "🍝" },
  { name: "Eggs", emoji: "🥚" },
  { name: "Oats", emoji: "🌿" },
];

const planItems = [
  { name: "Pasta Bake", emoji: "🍲" },
  { name: "Egg Salad", emoji: "🥗" },
  { name: "Oat Bowl", emoji: "🥣" },
];

const analyseItems = [
  { name: "Free Range Eggs", rating: 5 },
  { name: "Organic Passata", rating: 5 },
  { name: "Greek Yoghurt", rating: 4 },
];

const basketItems = [
  { name: "Free Range Eggs", price: "£2.49", rating: 5 },
  { name: "Organic Passata", price: "£1.89", rating: 5 },
  { name: "Greek Yoghurt", price: "£1.29", rating: 4 },
];

function StepLabel({ label }: { label: string }) {
  return (
    <p className="text-[9px] font-bold uppercase tracking-widest text-white/45 mb-1.5">
      {label}
    </p>
  );
}

function Connector() {
  return (
    <div className="flex flex-col items-center justify-center shrink-0 self-center px-0.5 mt-4">
      <span className="text-white/30 text-base leading-none">›</span>
    </div>
  );
}

export default function ProductFlowVisual() {
  return (
    <div
      className="mt-8 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm p-4 shadow-xl"
      data-testid="kitchen-to-basket-visual"
    >
      <div className="flex items-start gap-1.5">

        <div className="flex-1 min-w-0">
          <StepLabel label="Pantry" />
          <div className="space-y-1">
            {pantryItems.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-1 rounded-md bg-amber-300/10 border border-amber-200/15 px-1.5 py-1"
                data-testid={`pantry-card-${item.name.toLowerCase()}`}
              >
                <span className="text-xs leading-none">{item.emoji}</span>
                <span className="text-[10px] font-medium text-white/70 truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <Connector />

        <div className="flex-1 min-w-0">
          <StepLabel label="Plan" />
          <div className="space-y-1">
            {planItems.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-1 rounded-md bg-violet-300/10 border border-violet-200/15 px-1.5 py-1"
                data-testid={`plan-card-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span className="text-xs leading-none">{item.emoji}</span>
                <span className="text-[10px] font-medium text-white/70 truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <Connector />

        <div className="flex-1 min-w-0">
          <StepLabel label="Analyse" />
          <div className="space-y-1">
            {analyseItems.map((item) => (
              <div
                key={item.name}
                className="rounded-md bg-sky-300/10 border border-sky-200/15 px-1.5 py-1"
                data-testid={`analyse-row-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <p className="text-[10px] font-medium text-white/70 truncate mb-0.5">{item.name}</p>
                <MiniAppleRating rating={item.rating} size={11} />
              </div>
            ))}
          </div>
        </div>

        <Connector />

        <div className="flex-1 min-w-0">
          <StepLabel label="Basket" />
          <div className="space-y-1">
            {basketItems.map((item) => (
              <div
                key={item.name}
                className="rounded-md bg-white/10 border border-white/10 px-1.5 py-1"
                data-testid={`basket-row-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <p className="text-[10px] font-medium text-white/80 truncate mb-0.5">{item.name}</p>
                <div className="flex items-center justify-between gap-1">
                  <MiniAppleRating rating={item.rating} size={12} />
                  <span className="text-[10px] font-bold text-secondary-foreground/80 shrink-0">{item.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5">
        {["Pantry", "Plan", "Analyse", "Basket"].map((step, i, arr) => (
          <span key={step} className="flex items-center gap-1.5">
            <span className="text-[9px] font-semibold text-white/30 tracking-wide">{step}</span>
            {i < arr.length - 1 && <span className="text-white/20 text-[9px]">›</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
