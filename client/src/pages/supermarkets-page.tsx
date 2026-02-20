import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store, ExternalLink, ShoppingCart, Globe, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";
import type { SupermarketLink, ShoppingListItem } from "@shared/schema";

const COUNTRIES = [
  { code: "ALL", label: "All Countries" },
  { code: "UK", label: "United Kingdom" },
  { code: "US", label: "United States" },
  { code: "EU", label: "Europe" },
];

export default function SupermarketsPage() {
  const { toast } = useToast();
  const [selectedCountry, setSelectedCountry] = useState("ALL");

  const { data: allSupermarkets = [], isLoading } = useQuery<SupermarketLink[]>({
    queryKey: [api.supermarkets.list.path],
  });

  const { data: shoppingItems = [] } = useQuery<ShoppingListItem[]>({
    queryKey: [api.shoppingList.list.path],
  });

  const filteredSupermarkets = selectedCountry === "ALL"
    ? allSupermarkets
    : allSupermarkets.filter(s => s.country === selectedCountry);

  const groupedByCountry = filteredSupermarkets.reduce<Record<string, SupermarketLink[]>>((acc, s) => {
    if (!acc[s.country]) acc[s.country] = [];
    acc[s.country].push(s);
    return acc;
  }, {});

  const openSearchLink = (supermarket: SupermarketLink, query: string) => {
    const url = supermarket.searchUrl + encodeURIComponent(query);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const exportShoppingList = (supermarket: SupermarketLink) => {
    if (shoppingItems.length === 0) {
      toast({
        title: "Empty Basket",
        description: "Add items to your basket first, then export to a supermarket.",
        variant: "destructive",
      });
      return;
    }
    const combined = shoppingItems.map(item =>
      item.quantity > 1 ? `${item.productName} x${item.quantity}` : item.productName
    ).join(", ");
    openSearchLink(supermarket, combined);
    toast({
      title: "Opened in New Tab",
      description: `Searching ${supermarket.name} for your basket items.`,
    });
  };

  const searchSingleItem = (supermarket: SupermarketLink, item: ShoppingListItem) => {
    openSearchLink(supermarket, item.productName);
  };

  const countryLabel = (code: string) => {
    return COUNTRIES.find(c => c.code === code)?.label || code;
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight" data-testid="text-supermarkets-title">
            Supermarkets
          </h1>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-supermarkets-subtitle">
            Search your basket across major supermarkets
          </p>
        </div>
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger data-testid="select-country-filter">
            <Globe className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by country" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map(c => (
              <SelectItem key={c.code} value={c.code} data-testid={`option-country-${c.code}`}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {shoppingItems.length > 0 && (
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2" data-testid="text-basket-summary">
              <ShoppingCart className="h-5 w-5" />
              Your Basket ({shoppingItems.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {shoppingItems.map(item => (
                <Badge key={item.id} variant="secondary" data-testid={`badge-shopping-item-${item.id}`}>
                  {item.productName}
                  {item.quantity > 1 && ` x${item.quantity}`}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCountry}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {Object.entries(groupedByCountry).map(([country, supermarkets]) => (
              <div key={country} className="mb-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" data-testid={`text-country-${country}`}>
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  {countryLabel(country)}
                  <Badge variant="outline" data-testid={`badge-store-count-${country}`}>
                    {supermarkets.length} stores
                  </Badge>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {supermarkets.map(supermarket => (
                    <Card key={supermarket.id} className="hover-elevate" data-testid={`card-supermarket-${supermarket.id}`}>
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-md">
                            <Store className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base" data-testid={`text-store-name-${supermarket.id}`}>
                              {supermarket.name}
                            </CardTitle>
                            <Badge variant="outline" className="mt-1" data-testid={`badge-store-country-${supermarket.id}`}>
                              {supermarket.country}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-2">
                        <Button
                          variant="default"
                          className="gap-2"
                          onClick={() => exportShoppingList(supermarket)}
                          disabled={shoppingItems.length === 0}
                          data-testid={`button-export-list-${supermarket.id}`}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Export Basket
                        </Button>

                        {shoppingItems.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-2">Or search individual items:</p>
                            <div className="flex flex-wrap gap-1">
                              {shoppingItems.slice(0, 5).map(item => (
                                <Button
                                  key={item.id}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => searchSingleItem(supermarket, item)}
                                  className="gap-1"
                                  data-testid={`button-search-item-${supermarket.id}-${item.id}`}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  {item.productName}
                                </Button>
                              ))}
                              {shoppingItems.length > 5 && (
                                <Badge variant="secondary" data-testid={`badge-more-items-${supermarket.id}`}>
                                  +{shoppingItems.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {shoppingItems.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center" data-testid={`text-empty-hint-${supermarket.id}`}>
                            Add items to your basket to search this store
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}

            {filteredSupermarkets.length === 0 && (
              <div className="text-center py-16">
                <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold" data-testid="text-no-results">No supermarkets found</h3>
                <p className="text-muted-foreground">Try selecting a different country filter.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
