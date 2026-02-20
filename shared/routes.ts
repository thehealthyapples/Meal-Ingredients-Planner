import { z } from 'zod';
import { insertMealSchema, insertShoppingListItemSchema, insertMealPlanSchema, insertMealPlanEntrySchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const nutritionSchema = z.object({
  calories: z.string().nullable().optional(),
  protein: z.string().nullable().optional(),
  carbs: z.string().nullable().optional(),
  fat: z.string().nullable().optional(),
  sugar: z.string().nullable().optional(),
  salt: z.string().nullable().optional(),
});

export const api = {
  meals: {
    list: {
      method: 'GET' as const,
      path: '/api/meals' as const,
    },
    get: {
      method: 'GET' as const,
      path: '/api/meals/:id' as const,
    },
    create: {
      method: 'POST' as const,
      path: '/api/meals' as const,
      input: insertMealSchema.extend({
        nutrition: nutritionSchema.optional(),
      }),
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/meals/:id' as const,
    },
    copy: {
      method: 'POST' as const,
      path: '/api/meals/:id/copy' as const,
    },
    reimportInstructions: {
      method: 'PATCH' as const,
      path: '/api/meals/:id/reimport-instructions' as const,
      input: z.object({ url: z.string().url() }),
    },
    update: {
      method: 'PUT' as const,
      path: '/api/meals/:id' as const,
    },
    getEditedCopy: {
      method: 'GET' as const,
      path: '/api/meals/:id/edited-copy' as const,
    },
    saveProduct: {
      method: 'POST' as const,
      path: '/api/meals/save-product' as const,
      input: z.object({
        barcode: z.string().nullable(),
        name: z.string(),
        brand: z.string().nullable(),
        imageUrl: z.string().nullable(),
        nutrition: z.object({
          calories: z.string().nullable(),
          protein: z.string().nullable(),
          carbs: z.string().nullable(),
          fat: z.string().nullable(),
          sugar: z.string().nullable(),
          salt: z.string().nullable(),
        }),
        nutriscoreGrade: z.string().nullable(),
        novaGroup: z.number().nullable(),
        smpRating: z.number(),
        isDrink: z.boolean(),
        isBabyFood: z.boolean(),
        isReadyMeal: z.boolean(),
        quantity: z.string().nullable(),
        categoryId: z.number().nullable().optional(),
      }),
    },
  },
  nutrition: {
    get: {
      method: 'GET' as const,
      path: '/api/meals/:id/nutrition' as const,
    },
  },
  import: {
    recipe: {
      method: 'POST' as const,
      path: '/api/import-recipe' as const,
      input: z.object({ url: z.string().url() }),
    },
  },
  search: {
    recipes: {
      method: 'GET' as const,
      path: '/api/search-recipes' as const,
    },
    products: {
      method: 'GET' as const,
      path: '/api/search-products' as const,
    },
  },
  analyze: {
    meal: {
      method: 'POST' as const,
      path: '/api/analyze-meal' as const,
      input: z.object({ mealId: z.number() }),
    },
  },
  allergens: {
    get: {
      method: 'GET' as const,
      path: '/api/meals/:id/allergens' as const,
    },
  },
  swaps: {
    list: {
      method: 'GET' as const,
      path: '/api/ingredient-swaps' as const,
    },
  },
  categories: {
    list: {
      method: 'GET' as const,
      path: '/api/categories' as const,
    },
  },
  shoppingList: {
    list: {
      method: 'GET' as const,
      path: '/api/shopping-list' as const,
    },
    add: {
      method: 'POST' as const,
      path: '/api/shopping-list' as const,
      input: insertShoppingListItemSchema,
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/shopping-list/:id' as const,
    },
    remove: {
      method: 'DELETE' as const,
      path: '/api/shopping-list/:id' as const,
    },
    clear: {
      method: 'DELETE' as const,
      path: '/api/shopping-list' as const,
    },
    generateFromPlan: {
      method: 'POST' as const,
      path: '/api/shopping-list/from-plan' as const,
      input: z.object({
        planId: z.number(),
      }),
    },
    generateFromMeals: {
      method: 'POST' as const,
      path: '/api/shopping-list/from-meals' as const,
      input: z.object({
        mealSelections: z.array(z.object({
          mealId: z.number(),
          count: z.number().min(1).default(1),
        })),
      }),
    },
    lookupPrices: {
      method: 'POST' as const,
      path: '/api/shopping-list/lookup-prices' as const,
    },
    totalCost: {
      method: 'GET' as const,
      path: '/api/shopping-list/total-cost' as const,
    },
    prices: {
      method: 'GET' as const,
      path: '/api/shopping-list/prices' as const,
    },
    sources: {
      method: 'GET' as const,
      path: '/api/shopping-list/sources' as const,
    },
    itemMatches: {
      method: 'GET' as const,
      path: '/api/shopping-list/:id/matches' as const,
    },
    autoSmp: {
      method: 'POST' as const,
      path: '/api/shopping-list/auto-smp' as const,
    },
  },
  priceTier: {
    update: {
      method: 'PATCH' as const,
      path: '/api/user/price-tier' as const,
      input: z.object({
        tier: z.enum(['budget', 'standard', 'premium', 'organic']),
      }),
    },
  },
  diets: {
    list: {
      method: 'GET' as const,
      path: '/api/diets' as const,
    },
    getMealDiets: {
      method: 'GET' as const,
      path: '/api/meals/:id/diets' as const,
    },
    setMealDiets: {
      method: 'POST' as const,
      path: '/api/meals/:id/diets' as const,
      input: z.object({
        dietIds: z.array(z.number()),
      }),
    },
  },
  basket: {
    send: {
      method: 'POST' as const,
      path: '/api/basket/send' as const,
      input: z.object({
        supermarket: z.string(),
        items: z.array(z.object({
          name: z.string(),
          quantity: z.number(),
          unit: z.string(),
          preference: z.string().optional(),
        })),
      }),
    },
    supermarkets: {
      method: 'GET' as const,
      path: '/api/basket/supermarkets' as const,
    },
    checkout: {
      method: 'POST' as const,
      path: '/api/basket/checkout' as const,
      input: z.object({
        supermarket: z.string(),
      }),
    },
    updateStore: {
      method: 'POST' as const,
      path: '/api/basket/update-store' as const,
      input: z.object({
        store: z.string().nullable(),
      }),
    },
  },
  userBasket: {
    list: {
      method: 'GET' as const,
      path: '/api/user-basket' as const,
    },
    add: {
      method: 'POST' as const,
      path: '/api/user-basket' as const,
      input: z.object({
        mealId: z.number(),
        quantity: z.number().min(1).default(1),
      }),
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/user-basket/:id' as const,
      input: z.object({
        quantity: z.number().min(0),
      }),
    },
    remove: {
      method: 'DELETE' as const,
      path: '/api/user-basket/:id' as const,
    },
    clear: {
      method: 'DELETE' as const,
      path: '/api/user-basket' as const,
    },
  },
  supermarkets: {
    list: {
      method: 'GET' as const,
      path: '/api/supermarkets' as const,
    },
    byCountry: {
      method: 'GET' as const,
      path: '/api/supermarkets/:country' as const,
    },
  },
  mealPlans: {
    list: {
      method: 'GET' as const,
      path: '/api/meal-plans' as const,
    },
    get: {
      method: 'GET' as const,
      path: '/api/meal-plans/:id' as const,
    },
    create: {
      method: 'POST' as const,
      path: '/api/meal-plans' as const,
      input: insertMealPlanSchema,
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/meal-plans/:id' as const,
    },
    addEntry: {
      method: 'POST' as const,
      path: '/api/meal-plans/:id/entries' as const,
      input: z.object({
        dayOfWeek: z.number().min(0).max(6),
        slot: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
        mealId: z.number(),
        mealTemplateId: z.number().optional(),
        resolvedSourceType: z.string().optional(),
      }),
    },
    removeEntry: {
      method: 'DELETE' as const,
      path: '/api/meal-plan-entries/:id' as const,
    },
    getEntries: {
      method: 'GET' as const,
      path: '/api/meal-plans/:id/entries' as const,
    },
    suggest: {
      method: 'POST' as const,
      path: '/api/meal-plans/suggest' as const,
      input: z.object({
        dietId: z.number().optional(),
        calorieTarget: z.number().optional(),
        peopleCount: z.number().optional(),
      }).optional(),
    },
    duplicate: {
      method: 'POST' as const,
      path: '/api/meal-plans/:id/duplicate' as const,
      input: z.object({
        weekStart: z.string(),
        name: z.string(),
      }),
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
