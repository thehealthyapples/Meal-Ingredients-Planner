import AppleRating from "@/components/ui/apple-rating";

const pantryItems = [
  { name: "Rice", emoji: "🌾" },
  { name: "Pasta", emoji: "🍝" },
  { name: "Lentils", emoji: "🫘" },
  { name: "Oats", emoji: "🌿" },
];

const fridgeItems = [
  { name: "Eggs", emoji: "🥚" },
  { name: "Milk", emoji: "🥛" },
  { name: "Butter", emoji: "🧈" },
];

const basketItems = [
  { name: "Free Range Eggs", price: "£2.49", rating: 5 },
  { name: "Organic Passata", price: "£1.89", rating: 5 },
  { name: "Greek Yoghurt", price: "£1.29", rating: 4 },
  { name: "Olive Oil", price: "£3.99", rating: 5 },
];

export default function KitchenToBasketVisual() {
  return (
    <div
      className="mt-10 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm p-4 shadow-xl"
      data-testid="kitchen-to-basket-visual"
    >
      <div className="flex items-stretch gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50 mb-2">
            Your Kitchen
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {pantryItems.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-1.5 rounded-lg bg-amber-300/10 border border-amber-200/15 px-2.5 py-2"
                data-testid={`pantry-card-${item.name.toLowerCase()}`}
              >
                <span className="text-sm leading-none">{item.emoji}</span>
                <span className="text-[11px] font-medium text-white/75 truncate">{item.name}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-1.5 pt-0.5">
            {fridgeItems.map((item) => (
              <div
                key={item.name}
                className="flex-1 flex flex-col items-center gap-0.5 rounded-lg bg-sky-300/10 border border-sky-200/15 py-2"
                data-testid={`fridge-card-${item.name.toLowerCase()}`}
              >
                <span className="text-sm leading-none">{item.emoji}</span>
                <span className="text-[10px] font-medium text-white/65">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-1 shrink-0 px-0.5">
          <div className="w-px h-6 bg-white/20 rounded-full" />
          <span className="text-white/40 text-lg leading-none">→</span>
          <div className="w-px h-6 bg-white/20 rounded-full" />
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50 mb-2">
            Smart Basket
          </p>
          {basketItems.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between gap-2 rounded-lg bg-white/10 border border-white/10 px-2.5 py-1.5"
              data-testid={`basket-row-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <span className="text-[11px] font-medium text-white/80 truncate">{item.name}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-bold text-secondary-foreground/80">{item.price}</span>
                <AppleRating rating={item.rating} size={11} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-center text-[10px] font-medium text-white/35 tracking-wide">
        Your Kitchen → Smart Basket
      </p>
    </div>
  );
}
