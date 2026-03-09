export interface DemoMember {
  id: number;
  name: string;
  role: "parent" | "child";
  initial: string;
}

export interface DemoMeal {
  id: number;
  name: string;
  category: string;
  ingredients: string[];
}

export type MealSlot = "breakfast" | "lunch" | "dinner";

export interface DemoDayPlan {
  day: string;
  slots: Partial<Record<MealSlot, number>>;
}

export interface DemoBasketItem {
  id: number;
  name: string;
  quantity: string;
  category: "produce" | "meat" | "dairy" | "pantry";
}

export const DEMO_HOUSEHOLD: DemoMember[] = [
  { id: 1, name: "Sarah", role: "parent", initial: "S" },
  { id: 2, name: "Mark", role: "parent", initial: "M" },
  { id: 3, name: "Lily", role: "child", initial: "L" },
  { id: 4, name: "Jack", role: "child", initial: "J" },
];

export const DEMO_MEALS: DemoMeal[] = [
  {
    id: 1,
    name: "Chicken stir fry",
    category: "Asian",
    ingredients: ["chicken breast", "broccoli", "bell peppers", "soy sauce", "garlic", "ginger", "sesame oil"],
  },
  {
    id: 2,
    name: "Spaghetti bolognese",
    category: "Italian",
    ingredients: ["spaghetti", "beef mince", "canned tomatoes", "onion", "garlic", "olive oil", "mixed herbs"],
  },
  {
    id: 3,
    name: "Salmon & vegetables",
    category: "Healthy",
    ingredients: ["salmon fillet", "courgette", "cherry tomatoes", "lemon", "olive oil", "garlic", "fresh dill"],
  },
  {
    id: 4,
    name: "Veggie curry",
    category: "Indian",
    ingredients: ["chickpeas", "spinach", "coconut milk", "canned tomatoes", "onion", "curry powder", "ginger", "garlic"],
  },
  {
    id: 5,
    name: "Homemade pizza",
    category: "Italian",
    ingredients: ["pizza dough", "tomato passata", "mozzarella", "bell peppers", "mushrooms", "olive oil", "mixed herbs"],
  },
  {
    id: 6,
    name: "Burgers",
    category: "American",
    ingredients: ["beef mince", "burger buns", "lettuce", "tomato", "cheddar cheese", "red onion", "ketchup"],
  },
  {
    id: 7,
    name: "Roast chicken",
    category: "British",
    ingredients: ["whole chicken", "potatoes", "carrots", "onion", "garlic", "rosemary", "olive oil", "lemon"],
  },
];

export const DEMO_PLANNER: DemoDayPlan[] = [
  { day: "Mon", slots: { breakfast: undefined, lunch: 1, dinner: 2 } },
  { day: "Tue", slots: { breakfast: undefined, lunch: 4, dinner: 3 } },
  { day: "Wed", slots: { breakfast: undefined, lunch: 2, dinner: 5 } },
  { day: "Thu", slots: { breakfast: undefined, lunch: 3, dinner: 4 } },
  { day: "Fri", slots: { breakfast: undefined, lunch: 1, dinner: 6 } },
  { day: "Sat", slots: { breakfast: undefined, lunch: 5, dinner: 7 } },
  { day: "Sun", slots: { breakfast: undefined, lunch: 6, dinner: 7 } },
];

export const DEMO_BASKET: DemoBasketItem[] = [
  { id: 1, name: "Chicken breast", quantity: "600g", category: "meat" },
  { id: 2, name: "Beef mince", quantity: "800g", category: "meat" },
  { id: 3, name: "Salmon fillet", quantity: "2 fillets", category: "meat" },
  { id: 4, name: "Whole chicken", quantity: "1.5kg", category: "meat" },
  { id: 5, name: "Broccoli", quantity: "1 head", category: "produce" },
  { id: 6, name: "Bell peppers", quantity: "4", category: "produce" },
  { id: 7, name: "Courgette", quantity: "2", category: "produce" },
  { id: 8, name: "Cherry tomatoes", quantity: "250g", category: "produce" },
  { id: 9, name: "Potatoes", quantity: "1kg", category: "produce" },
  { id: 10, name: "Carrots", quantity: "500g", category: "produce" },
  { id: 11, name: "Onions", quantity: "4", category: "produce" },
  { id: 12, name: "Garlic", quantity: "1 bulb", category: "produce" },
  { id: 13, name: "Spinach", quantity: "150g", category: "produce" },
  { id: 14, name: "Mozzarella", quantity: "125g", category: "dairy" },
  { id: 15, name: "Cheddar cheese", quantity: "200g", category: "dairy" },
  { id: 16, name: "Spaghetti", quantity: "500g", category: "pantry" },
  { id: 17, name: "Canned tomatoes", quantity: "2 tins", category: "pantry" },
  { id: 18, name: "Coconut milk", quantity: "400ml", category: "pantry" },
  { id: 19, name: "Chickpeas", quantity: "400g tin", category: "pantry" },
  { id: 20, name: "Olive oil", quantity: "1 bottle", category: "pantry" },
];

export function getMealById(id: number): DemoMeal | undefined {
  return DEMO_MEALS.find((m) => m.id === id);
}
