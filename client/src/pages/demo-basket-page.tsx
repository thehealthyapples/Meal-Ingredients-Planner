import { ShoppingBasket, Download, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEMO_BASKET, DemoBasketItem } from "@/lib/demo-data";
import { useDemoWriteGuard } from "@/components/demo-readonly-modal";

type Category = DemoBasketItem["category"];

const CATEGORY_META: Record<Category, { label: string; color: string }> = {
  produce: { label: "Produce", color: "bg-green-100 text-green-800 border-green-200" },
  meat: { label: "Meat & Fish", color: "bg-red-100 text-red-800 border-red-200" },
  dairy: { label: "Dairy", color: "bg-blue-100 text-blue-800 border-blue-200" },
  pantry: { label: "Pantry", color: "bg-amber-100 text-amber-800 border-amber-200" },
};

const CATEGORY_ORDER: Category[] = ["produce", "meat", "dairy", "pantry"];

function groupByCategory(items: DemoBasketItem[]): Record<Category, DemoBasketItem[]> {
  const groups = {} as Record<Category, DemoBasketItem[]>;
  for (const cat of CATEGORY_ORDER) groups[cat] = [];
  for (const item of items) groups[item.category].push(item);
  return groups;
}

export default function DemoBasketPage() {
  const { guard, modal } = useDemoWriteGuard();
  const grouped = groupByCategory(DEMO_BASKET);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {modal}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="demo-basket-title">
            Demo Shopping Basket
          </h1>
          <Badge data-testid="demo-basket-count">{DEMO_BASKET.length} items</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={guard} data-testid="button-demo-generate-list">
            <Wand2 className="h-4 w-4 mr-1" />
            Generate Shopping List
          </Button>
          <Button variant="outline" size="sm" onClick={guard} data-testid="button-demo-export">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      <div className="space-y-4" data-testid="demo-basket-list">
        {CATEGORY_ORDER.filter((cat) => grouped[cat].length > 0).map((cat) => {
          const meta = CATEGORY_META[cat];
          return (
            <Card key={cat} data-testid={`demo-basket-category-${cat}`}>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ShoppingBasket className="h-4 w-4 text-muted-foreground" />
                  {meta.label}
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {grouped[cat].length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ul className="space-y-1.5">
                  {grouped[cat].map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-2 text-sm"
                      data-testid={`basket-item-${item.id}`}
                    >
                      <span className="font-medium">{item.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-muted-foreground text-xs">{item.quantity}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border font-medium ${meta.color}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
