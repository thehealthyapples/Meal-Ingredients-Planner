import thaAppleUrl from "@/assets/icons/tha-apple.png";

const OVERLAP = 0.38;

function MiniAppleRating({ rating, size = 13 }: { rating: number; size?: number }) {
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
            opacity: i < full ? 1 : 0.2,
          }}
        />
      ))}
    </div>
  );
}

export default function ProductFlowVisual() {
  return (
    <div
      className="mt-8 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm p-4 shadow-xl"
      data-testid="kitchen-to-basket-visual"
    >
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: "1fr auto 1fr", gridTemplateRows: "auto auto auto" }}
      >

        {/* ── Row 1 ── */}

        {/* Kitchen */}
        <div className="rounded-xl bg-amber-300/10 border border-amber-200/15 p-2.5" data-testid="flow-card-kitchen">
          <p className="text-[9px] font-bold uppercase tracking-widest text-amber-200/60 mb-1.5">Kitchen</p>
          <div className="grid grid-cols-2 gap-1">
            {[["🌾","Rice"],["🍝","Pasta"],["🥚","Eggs"],["🥛","Milk"]].map(([e, n]) => (
              <div key={n} className="flex items-center gap-1 rounded-md bg-white/5 px-1.5 py-0.5">
                <span className="text-xs leading-none">{e}</span>
                <span className="text-[10px] text-white/65 font-medium truncate">{n}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top connector → */}
        <div className="flex items-center justify-center px-1">
          <span className="text-white/25 text-sm">›</span>
        </div>

        {/* Plan */}
        <div className="rounded-xl bg-violet-300/10 border border-violet-200/15 p-2.5" data-testid="flow-card-plan">
          <p className="text-[9px] font-bold uppercase tracking-widest text-violet-200/60 mb-1.5">Plan</p>
          <div className="space-y-1">
            {[["🍲","Pasta Bake"],["🥗","Egg Salad"],["🥣","Oat Bowl"]].map(([e, n]) => (
              <div key={n} className="flex items-center gap-1 rounded-md bg-white/5 px-1.5 py-0.5">
                <span className="text-xs leading-none">{e}</span>
                <span className="text-[10px] text-white/65 font-medium truncate">{n}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Row 2 — middle connectors ── */}

        {/* Left ↑ connector (Basket → Kitchen) */}
        <div className="flex items-center justify-center py-0.5">
          <span className="text-white/25 text-sm">‹</span>
        </div>

        {/* Centre cycle mark */}
        <div className="flex items-center justify-center">
          <span className="text-white/20 text-base leading-none select-none">↻</span>
        </div>

        {/* Right ↓ connector (Plan → Analyse) */}
        <div className="flex items-center justify-center py-0.5">
          <span className="text-white/25 text-sm">›</span>
        </div>

        {/* ── Row 3 ── */}

        {/* Basket */}
        <div className="rounded-xl bg-white/8 border border-white/12 p-2.5" data-testid="flow-card-basket">
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/45 mb-1.5">Basket</p>
          <div className="space-y-1">
            {[
              { name: "Free Range Eggs", price: "£2.49", rating: 5 },
              { name: "Organic Passata",  price: "£1.89", rating: 5 },
              { name: "Greek Yoghurt",    price: "£1.29", rating: 4 },
            ].map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between gap-1 rounded-md bg-white/5 px-1.5 py-0.5"
                data-testid={`basket-row-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span className="text-[10px] text-white/70 font-medium truncate">{item.name}</span>
                <span className="text-[10px] font-bold text-secondary-foreground/80 shrink-0 ml-1">{item.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom connector ← */}
        <div className="flex items-center justify-center px-1">
          <span className="text-white/25 text-sm">‹</span>
        </div>

        {/* Analyse */}
        <div className="rounded-xl bg-sky-300/10 border border-sky-200/15 p-2.5" data-testid="flow-card-analyse">
          <p className="text-[9px] font-bold uppercase tracking-widest text-sky-200/60 mb-1.5">Analyse</p>
          <div className="space-y-1.5">
            {[
              { name: "Free Range Eggs", rating: 5 },
              { name: "Organic Passata",  rating: 5 },
              { name: "Greek Yoghurt",    rating: 4 },
            ].map((item) => (
              <div key={item.name} data-testid={`analyse-row-${item.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <p className="text-[10px] text-white/65 font-medium truncate mb-0.5">{item.name}</p>
                <MiniAppleRating rating={item.rating} size={12} />
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Loop label */}
      <p className="mt-2.5 text-center text-[9px] font-semibold uppercase tracking-widest text-white/25">
        Kitchen · Plan · Analyse · Basket · Kitchen
      </p>
    </div>
  );
}
