import type { ShoppingListItem, ProductMatch } from "@shared/schema";

export interface SupermarketBasketItem {
  name: string;
  quantity: number;
  unit: string;
  productId?: string | null;
  productUrl?: string | null;
  price?: number | null;
  imageUrl?: string | null;
}

export interface BasketResult {
  success: boolean;
  supermarket: string;
  checkoutUrl?: string;
  itemUrls: { name: string; url: string; productId?: string }[];
  matchedCount: number;
  totalCount: number;
  estimatedTotal?: number;
  message?: string;
}

const SUPERMARKET_CONFIG: Record<string, {
  name: string;
  searchUrl: string;
  productUrlTemplate: string;
  basketUrlTemplate: string;
  color: string;
}> = {
  tesco: {
    name: "Tesco",
    searchUrl: "https://www.tesco.com/groceries/en-GB/search?query={query}",
    productUrlTemplate: "https://www.tesco.com/groceries/en-GB/products/{id}",
    basketUrlTemplate: "https://www.tesco.com/groceries/en-GB/search?query={query}",
    color: "#00539F",
  },
  "sainsbury's": {
    name: "Sainsbury's",
    searchUrl: "https://www.sainsburys.co.uk/gol-ui/SearchResults/{query}",
    productUrlTemplate: "https://www.sainsburys.co.uk/gol-ui/product/{id}",
    basketUrlTemplate: "https://www.sainsburys.co.uk/gol-ui/SearchResults/{query}",
    color: "#F06C00",
  },
  sainsburys: {
    name: "Sainsbury's",
    searchUrl: "https://www.sainsburys.co.uk/gol-ui/SearchResults/{query}",
    productUrlTemplate: "https://www.sainsburys.co.uk/gol-ui/product/{id}",
    basketUrlTemplate: "https://www.sainsburys.co.uk/gol-ui/SearchResults/{query}",
    color: "#F06C00",
  },
  ocado: {
    name: "Ocado",
    searchUrl: "https://www.ocado.com/search?entry={query}",
    productUrlTemplate: "https://www.ocado.com/products/{id}",
    basketUrlTemplate: "https://www.ocado.com/search?entry={query}",
    color: "#6B2D8B",
  },
  asda: {
    name: "Asda",
    searchUrl: "https://groceries.asda.com/search/{query}",
    productUrlTemplate: "https://groceries.asda.com/product/{id}",
    basketUrlTemplate: "https://groceries.asda.com/search/{query}",
    color: "#78BE20",
  },
  morrisons: {
    name: "Morrisons",
    searchUrl: "https://groceries.morrisons.com/search?entry={query}",
    productUrlTemplate: "https://groceries.morrisons.com/products/{id}",
    basketUrlTemplate: "https://groceries.morrisons.com/search?entry={query}",
    color: "#007A3D",
  },
  aldi: {
    name: "Aldi",
    searchUrl: "https://groceries.aldi.co.uk/en-GB/Search?keywords={query}",
    productUrlTemplate: "https://groceries.aldi.co.uk/en-GB/p/{id}",
    basketUrlTemplate: "https://groceries.aldi.co.uk/en-GB/Search?keywords={query}",
    color: "#00205B",
  },
  lidl: {
    name: "Lidl",
    searchUrl: "https://www.lidl.co.uk/q/search?q={query}",
    productUrlTemplate: "https://www.lidl.co.uk/p/{id}",
    basketUrlTemplate: "https://www.lidl.co.uk/q/search?q={query}",
    color: "#0050AA",
  },
  waitrose: {
    name: "Waitrose",
    searchUrl: "https://www.waitrose.com/ecom/shop/search?searchTerm={query}",
    productUrlTemplate: "https://www.waitrose.com/ecom/products/{id}",
    basketUrlTemplate: "https://www.waitrose.com/ecom/shop/search?searchTerm={query}",
    color: "#5D8A3C",
  },
  "marks & spencer": {
    name: "Marks & Spencer",
    searchUrl: "https://www.ocado.com/search?entry={query}&dnr=y&bof=marksandspencer",
    productUrlTemplate: "https://www.ocado.com/products/{id}",
    basketUrlTemplate: "https://www.ocado.com/search?entry={query}&dnr=y&bof=marksandspencer",
    color: "#003D29",
  },
};

function getSupermarketProductId(match: ProductMatch, supermarket: string): string | null {
  const key = supermarket.toLowerCase().replace(/'/g, '');
  switch (key) {
    case 'tesco':
      return match.tescoProductId || null;
    case 'sainsburys':
    case "sainsbury's":
      return match.sainsburysProductId || null;
    case 'ocado':
      return match.ocadoProductId || null;
    default:
      return null;
  }
}

function buildProductUrl(supermarket: string, productId: string): string {
  const key = supermarket.toLowerCase().replace(/'/g, '');
  const config = SUPERMARKET_CONFIG[key] || SUPERMARKET_CONFIG[supermarket.toLowerCase()];
  if (!config) return '';
  return config.productUrlTemplate.replace('{id}', encodeURIComponent(productId));
}

function buildSearchUrl(supermarket: string, query: string): string {
  const key = supermarket.toLowerCase().replace(/'/g, '');
  const config = SUPERMARKET_CONFIG[key] || SUPERMARKET_CONFIG[supermarket.toLowerCase()];
  if (!config) return '';
  return config.searchUrl.replace('{query}', encodeURIComponent(query));
}

export function createBasket(
  supermarket: string,
  shoppingListItems: ShoppingListItem[],
  productMatches: ProductMatch[],
  tier: string = 'standard',
): BasketResult {
  if (shoppingListItems.length === 0) {
    return {
      success: false,
      supermarket,
      itemUrls: [],
      matchedCount: 0,
      totalCount: 0,
      message: "Basket is empty.",
    };
  }

  const matchesByItemId = new Map<number, ProductMatch[]>();
  for (const match of productMatches) {
    if (!matchesByItemId.has(match.shoppingListItemId)) {
      matchesByItemId.set(match.shoppingListItemId, []);
    }
    matchesByItemId.get(match.shoppingListItemId)!.push(match);
  }

  const itemUrls: { name: string; url: string; productId?: string }[] = [];
  let matchedCount = 0;
  let estimatedTotal = 0;

  for (const item of shoppingListItems) {
    const itemMatches = matchesByItemId.get(item.id) || [];
    const supermarketMatch = itemMatches.find(m =>
      m.supermarket.toLowerCase() === supermarket.toLowerCase() &&
      m.tier === (item.selectedTier || tier)
    ) || itemMatches.find(m =>
      m.supermarket.toLowerCase() === supermarket.toLowerCase()
    );

    if (supermarketMatch) {
      const productId = getSupermarketProductId(supermarketMatch, supermarket);
      if (productId) {
        itemUrls.push({
          name: item.productName,
          url: buildProductUrl(supermarket, productId),
          productId,
        });
        matchedCount++;
      } else if (supermarketMatch.productUrl) {
        itemUrls.push({
          name: item.productName,
          url: supermarketMatch.productUrl,
        });
        matchedCount++;
      } else {
        itemUrls.push({
          name: item.productName,
          url: buildSearchUrl(supermarket, supermarketMatch.productName || item.productName),
        });
      }

      if (supermarketMatch.price) {
        estimatedTotal += supermarketMatch.price * (item.quantity || 1);
      }
    } else {
      itemUrls.push({
        name: item.productName,
        url: buildSearchUrl(supermarket, item.productName),
      });
    }
  }

  const config = SUPERMARKET_CONFIG[supermarket.toLowerCase().replace(/'/g, '')] ||
                 SUPERMARKET_CONFIG[supermarket.toLowerCase()];

  return {
    success: true,
    supermarket: config?.name || supermarket,
    itemUrls,
    matchedCount,
    totalCount: shoppingListItems.length,
    estimatedTotal: estimatedTotal > 0 ? Math.round(estimatedTotal * 100) / 100 : undefined,
    message: matchedCount > 0
      ? `${matchedCount} of ${shoppingListItems.length} items matched with product links. ${shoppingListItems.length - matchedCount > 0 ? `${shoppingListItems.length - matchedCount} items will open as search pages.` : ''}`
      : `Opening search pages for all ${shoppingListItems.length} items on ${config?.name || supermarket}.`,
  };
}

export function getSupermarketConfig(supermarket: string) {
  const key = supermarket.toLowerCase().replace(/'/g, '');
  return SUPERMARKET_CONFIG[key] || SUPERMARKET_CONFIG[supermarket.toLowerCase()] || null;
}

export function getBasketSupermarkets() {
  return [
    { name: "Tesco", key: "tesco", color: "#00539F", hasDirectBasket: true },
    { name: "Sainsbury's", key: "sainsburys", color: "#F06C00", hasDirectBasket: true },
    { name: "Ocado", key: "ocado", color: "#6B2D8B", hasDirectBasket: true },
    { name: "Asda", key: "asda", color: "#78BE20", hasDirectBasket: false },
    { name: "Morrisons", key: "morrisons", color: "#007A3D", hasDirectBasket: false },
    { name: "Waitrose", key: "waitrose", color: "#5D8C51", hasDirectBasket: false },
    { name: "Amazon Fresh", key: "amazonfresh", color: "#FF9900", hasDirectBasket: false },
    { name: "Aldi", key: "aldi", color: "#00205B", hasDirectBasket: false },
    { name: "Lidl", key: "lidl", color: "#0050AA", hasDirectBasket: false },
  ];
}
