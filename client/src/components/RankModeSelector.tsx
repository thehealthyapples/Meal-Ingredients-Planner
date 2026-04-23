import thaAppleUrl from "@/assets/icons/tha-apple-sort.png";
import thaPickUrl from "@/assets/icons/The healthy apples recommneds.png";
import type { RankingMode } from "@/lib/analyser-choice";

const RANK_OPTIONS: { key: RankingMode; label: string; apple?: true; icon?: string; img?: string }[] = [
  { key: "quality_first", label: "Quality",  apple: true },
  { key: "balanced",      label: "Balanced", icon: "⚖" },
  { key: "lowest_price",  label: "Price",    icon: "£" },
  { key: "tha_pick",      label: "THA Pick", img: thaPickUrl },
];

interface RankModeSelectorProps {
  rankMode: RankingMode;
  onChange: (mode: RankingMode) => void;
}

export default function RankModeSelector({ rankMode, onChange }: RankModeSelectorProps) {
  return (
    <div className="hidden sm:flex flex-col items-start gap-0.5">
      <span className="text-[10px] text-muted-foreground font-medium leading-none pl-0.5 select-none">
        Sort by
      </span>
      <div
        className="flex items-center gap-0.5 rounded-md p-0.5"
        style={{ background: "hsl(var(--muted) / 0.5)" }}
      >
        {RANK_OPTIONS.map(opt => (
          <button
            key={opt.key}
            title={opt.label}
            onClick={() => onChange(opt.key)}
            className={`flex items-center gap-1.5 h-7 px-2 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
              rankMode === opt.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.apple ? (
              <img src={thaAppleUrl} alt="" className="h-5 w-5 object-contain flex-shrink-0" />
            ) : opt.img ? (
              <img src={opt.img} alt="" className="h-5 w-5 object-contain flex-shrink-0" />
            ) : (
              <span className="text-[14px] leading-none flex-shrink-0">{opt.icon}</span>
            )}
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
      {rankMode === "tha_pick" && (
        <p className="text-[10px] text-muted-foreground/70 pl-0.5 leading-tight max-w-[220px]">
          THA recommended products prioritised where available.
        </p>
      )}
    </div>
  );
}
