/**
 * Living Larder — zoomed category page (/pantry/:group).
 * Reached by clicking a brass plaque. Zooms the canonical room into that shelf,
 * shows the enlarged brass plaque, and reveals THAT shelf's individual jars
 * (progressive-disclosure Level 3) — never all shelves at once. Back returns to
 * the room. No new imagery: the zoom is the same room, framed to the shelf.
 */
import "./larder-plaque-room.css";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { pageContainerClass } from "@/components/workspace-header";
import { bundleById, bundleOf, nameOf, isLow, type PantryItem } from "./larder-bundles";

const ROOM = "/images/living-larder/room/orchard-workroom.png";

export default function LarderCategoryView() {
  const [, params] = useRoute<{ group: string }>("/pantry/:group");
  const [, navigate] = useLocation();
  const { data: items = [] } = useQuery<PantryItem[]>({ queryKey: ["/api/pantry"] });
  const { toast } = useToast();
  const qc = useQueryClient();

  const g = params ? bundleById(params.group) : null;
  if (!g || g.stub || !g.shelf) {
    return (
      <div data-realm="pantry" className={pageContainerClass(true)}>
        <button className="lpq-back" onClick={() => navigate("/pantry")}><ArrowLeft size={16} /> Larder</button>
        <p className="lpq-empty" style={{ padding: "24px 4px" }}>That shelf isn't in the larder yet.</p>
      </div>
    );
  }

  const list = items.filter(it => bundleOf(it) === g.id);
  const s = g.shelf;
  // zoom the room into this shelf's region (width-based; the room is not redrawn)
  const zoom = { backgroundImage: `url(${ROOM})`,
    backgroundSize: `${(100 / s.w) * 100}%`,
    backgroundPosition: `${(s.l / (100 - s.w)) * 100}% ${(s.t / (100 - s.h)) * 100}%` } as const;

  const addToShopping = async (it: PantryItem) => {
    try {
      await apiRequest("POST", "/api/shopping-list", {
        productName: nameOf(it), quantityValue: it.needQuantityValue ?? 1,
        unit: it.needUnit || "unit", category: it.category,
        source: it.category === "household" ? "household" : "pantry",
      });
      qc.invalidateQueries({ queryKey: ["/api/shopping-list"] });
      toast({ title: `${nameOf(it)} added to shopping`, description: "It's still in your larder — we've noted you need more." });
    } catch { toast({ title: "Couldn't add that to your shopping", variant: "destructive" }); }
  };

  const anyLow = list.some(isLow);

  return (
    <div data-realm="pantry" className={pageContainerClass(true)}>
      <button className="lpq-back" data-testid="lpq-back" onClick={() => navigate("/pantry")}>
        <ArrowLeft size={16} /> Larder
      </button>

      <div className="lpq-zoom" data-testid="lpq-zoom" style={zoom}>
        <div className="lpq-plaque lpq-plaque--hero">
          <span className="lpq-plaque__name">{g.name}</span>
          <span className="lpq-plaque__meta lpq-plaque__meta--open">
            <span className={`lpq-plaque__pip pip-${anyLow ? "low" : "well"}`} />
            {list.length} item{list.length === 1 ? "" : "s"} · {anyLow ? "Running low" : "Well stocked"}
          </span>
        </div>
      </div>

      <div className="lpq-catlist" data-testid="lpq-catlist">
        {list.length === 0 ? (
          <p className="lpq-empty">Nothing kept on this shelf yet — add something from your Larder.</p>
        ) : (
          list.map(it => (
            <div key={it.id} className={`lpq-item${isLow(it) ? " is-low" : ""}`} data-testid={`lpq-item-${it.id}`}>
              <span className="lpq-item__name">{nameOf(it)}</span>
              <span className={`lpq-item__status ${isLow(it) ? "is-low" : ""}`}>
                <span className={`lpq-plaque__pip pip-${isLow(it) ? "low" : "well"}`} />
                {isLow(it) ? "Running low" : "In stock"}
              </span>
              <button type="button" className="lpq-item__act" title="Add to shopping"
                data-testid={`lpq-item-shop-${it.id}`} onClick={() => addToShopping(it)}>
                <ShoppingCart size={15} /> Add
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
