import axios from "axios";

export interface BasketItem {
  name: string;
  quantity: number;
  unit: string;
  preference?: string;
}

export interface BasketRequest {
  supermarket: string;
  items: BasketItem[];
}

export interface BasketResponse {
  success: boolean;
  checkoutUrl?: string;
  fallbackUrls?: string[];
  method: "api" | "search";
  message?: string;
}

const SUPERMARKET_SEARCH_URLS: Record<string, string> = {
  tesco: "https://www.tesco.com/groceries/en-GB/search?query={query}",
  "sainsbury's": "https://www.sainsburys.co.uk/gol-ui/SearchResults/{query}",
  sainsburys: "https://www.sainsburys.co.uk/gol-ui/SearchResults/{query}",
  ocado: "https://www.ocado.com/search?entry={query}",
  asda: "https://groceries.asda.com/search/{query}",
  "amazon fresh": "https://www.amazon.co.uk/s?k={query}&i=amazonfresh",
  amazonfresh: "https://www.amazon.co.uk/s?k={query}&i=amazonfresh",
  morrisons: "https://groceries.morrisons.com/search?entry={query}",
  waitrose: "https://www.waitrose.com/ecom/shop/search?searchTerm={query}",
  aldi: "https://groceries.aldi.co.uk/en-GB/Search?keywords={query}",
  lidl: "https://www.lidl.co.uk/q/search?q={query}",
  "marks & spencer": "https://www.ocado.com/search?entry={query}&dnr=y&bof=marksandspencer",
  "marks&spencer": "https://www.ocado.com/search?entry={query}&dnr=y&bof=marksandspencer",
};

function formatItemForSearch(item: BasketItem): string {
  let query = item.name;
  if (item.preference && item.preference !== "standard") {
    query = `${item.preference} ${query}`;
  }
  return query;
}

function buildSearchUrls(supermarket: string, items: BasketItem[]): string[] {
  const key = supermarket.toLowerCase();
  const template = SUPERMARKET_SEARCH_URLS[key];
  if (!template) return [];

  return items.map(item => {
    const query = formatItemForSearch(item);
    return template.replace("{query}", encodeURIComponent(query));
  });
}

async function sendViaWhiskApi(
  apiKey: string,
  supermarket: string,
  items: BasketItem[]
): Promise<BasketResponse> {
  const retailerMap: Record<string, string> = {
    tesco: "tesco",
    "sainsbury's": "sainsburys",
    sainsburys: "sainsburys",
    ocado: "ocado",
    asda: "asda",
    "amazon fresh": "amazon_fresh",
    amazonfresh: "amazon_fresh",
    morrisons: "morrisons",
    waitrose: "waitrose",
  };

  const retailer = retailerMap[supermarket.toLowerCase()];
  if (!retailer) {
    return {
      success: false,
      method: "api",
      message: `Supermarket "${supermarket}" is not supported by the basket API.`,
    };
  }

  const ingredients = items.map(item => ({
    name: formatItemForSearch(item),
    quantity: item.quantity,
    unit: item.unit || undefined,
  }));

  try {
    const response = await axios.post(
      "https://api.whisk.com/v1/baskets",
      {
        retailer,
        ingredients,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    if (response.data?.checkoutUrl) {
      return {
        success: true,
        checkoutUrl: response.data.checkoutUrl,
        method: "api",
      };
    }

    if (response.data?.url) {
      return {
        success: true,
        checkoutUrl: response.data.url,
        method: "api",
      };
    }

    return {
      success: false,
      method: "api",
      message: "API returned no checkout URL. Falling back to search links.",
    };
  } catch (error: any) {
    const msg = error?.response?.data?.message || error.message || "API request failed";
    return {
      success: false,
      method: "api",
      message: msg,
    };
  }
}

export async function sendBasketToSupermarket(
  supermarket: string,
  items: BasketItem[],
  whiskApiKey?: string
): Promise<BasketResponse> {
  if (items.length === 0) {
    return {
      success: false,
      method: "search",
      message: "Basket is empty.",
    };
  }

  if (whiskApiKey) {
    const apiResult = await sendViaWhiskApi(whiskApiKey, supermarket, items);
    if (apiResult.success) {
      return apiResult;
    }
  }

  const fallbackUrls = buildSearchUrls(supermarket, items);
  if (fallbackUrls.length === 0) {
    return {
      success: false,
      method: "search",
      message: `No search URL available for "${supermarket}".`,
    };
  }

  return {
    success: true,
    fallbackUrls,
    method: "search",
    message: `Opening ${Math.min(fallbackUrls.length, 10)} product search pages on ${supermarket}.`,
  };
}

export function getSupportedSupermarkets(): { name: string; hasSearchUrl: boolean }[] {
  return [
    { name: "Tesco", hasSearchUrl: true },
    { name: "Sainsbury's", hasSearchUrl: true },
    { name: "Ocado", hasSearchUrl: true },
    { name: "Asda", hasSearchUrl: true },
    { name: "Amazon Fresh", hasSearchUrl: true },
    { name: "Morrisons", hasSearchUrl: true },
    { name: "Waitrose", hasSearchUrl: true },
    { name: "Aldi", hasSearchUrl: true },
    { name: "Lidl", hasSearchUrl: true },
    { name: "Marks & Spencer", hasSearchUrl: true },
  ];
}

