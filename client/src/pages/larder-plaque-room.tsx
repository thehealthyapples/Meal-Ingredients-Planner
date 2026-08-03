/**
 * The Living Larder — running room with brass shelf-edge plaques.
 *
 * Settled visual language (2026-08-01, Option A · brass). The photoreal Orchard
 * Workroom is the fixed, dominant background; each food group's identity is a brass
 * plaque built into the shelf edge — the interaction surface. Room dominant.
 *
 * Progressive disclosure: L1 room + subtle plaques → hover warms/enlarges a plaque
 * and brightens only that shelf → CLICK opens the zoomed category page
 * (/pantry/:group), where that shelf's individual jars are revealed. Individual jar
 * names are never shown for every shelf at once.
 *
 * ⚠ %-anchors tuned to the room image; verify/nudge against the running render.
 */
import "./larder-plaque-room.css";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { pageContainerClass } from "@/components/workspace-header";
import { FOOD_GROUPS, bundleOf, isLow, type PantryItem } from "./larder-bundles";

export default function LarderPlaqueRoom() {
  const { data: items = [] } = useQuery<PantryItem[]>({ queryKey: ["/api/pantry"] });
  const [, navigate] = useLocation();
  const [hover, setHover] = useState<string | null>(null);

  const byBundle = useMemo(() => {
    const m = new Map<string, PantryItem[]>();
    for (const it of items) {
      const b = bundleOf(it); if (!b) continue;
      const arr = m.get(b); if (arr) arr.push(it); else m.set(b, [it]);
    }
    return m;
  }, [items]);

  return (
    <div data-realm="pantry" className={pageContainerClass(true)}>
      <div className="lpq-room" data-testid="lpq-room">
        {FOOD_GROUPS.map(g => {
          const list = byBundle.get(g.id) ?? [];
          const count = list.length;
          const anyLow = list.some(isLow);
          const status = g.stub ? "att" : anyLow ? "low" : "well";
          const statusLabel = g.stub ? "Coming soon" : anyLow ? "Running low" : "Well stocked";
          const isHover = hover === g.id;
          return (
            <div key={g.id} className={`lpq-cat${isHover ? " is-hover" : ""}`}>
              {g.shelf && (
                <div className="lpq-shelf" style={{ left: `${g.shelf.l}%`, top: `${g.shelf.t}%`, width: `${g.shelf.w}%`, height: `${g.shelf.h}%` }} />
              )}
              <button
                type="button"
                className={`lpq-plaque${g.stub ? " is-stub" : ""}`}
                style={{ left: `${g.x}%`, top: `${g.y}%` }}
                data-testid={`lpq-plaque-${g.id}`}
                aria-label={g.stub ? `${g.name} — coming soon` : `Open ${g.name}: ${count} item${count === 1 ? "" : "s"}, ${statusLabel}`}
                onMouseEnter={() => setHover(g.id)} onMouseLeave={() => setHover(h => h === g.id ? null : h)}
                onFocus={() => setHover(g.id)} onBlur={() => setHover(h => h === g.id ? null : h)}
                onClick={() => { if (!g.stub) navigate(`/pantry/${g.id}`); }}
              >
                <span className="lpq-plaque__name">{g.name}</span>
                <span className="lpq-plaque__meta">
                  <span className={`lpq-plaque__pip pip-${status}`} />
                  {g.stub ? "Coming soon" : `${count} item${count === 1 ? "" : "s"} · ${statusLabel}`}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
