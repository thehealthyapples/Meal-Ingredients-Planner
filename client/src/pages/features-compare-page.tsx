import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, BookOpen, Heart, Leaf, ShoppingBasket, UsersRound, RotateCcw } from "lucide-react";
import OrchardBackdrop from "@/components/layout/orchard-backdrop";

const strengths = [
  {
    icon: UsersRound,
    title: "The people at your table",
    body: "Bring each person's preferences and restrictions into the meal decision. Suggestions are there to review, so the household stays in charge.",
  },
  {
    icon: Leaf,
    title: "What to add to a meal",
    body: "Look for useful ways to add variety and nutrition across the week, with food safety taking priority.",
  },
  {
    icon: BookOpen,
    title: "Recipes you already love",
    body: "Bring in a recipe from an image, pasted text or a link. Check the result before adding it to your cookbook or plan.",
  },
  {
    icon: ShoppingBasket,
    title: "A plan you can shop for",
    body: "Carry a meal idea into the week's plan and a shopping list, so the next step is as useful as the advice.",
  },
];

const comparisons = [
  {
    name: "Yuka",
    href: "https://yuka.io/en/app/",
    focus: "Scanning packaged foods, explaining ratings and suggesting alternatives.",
    question: "What happens after choosing the food: dinner, the week and the shop?",
  },
  {
    name: "MyFitnessPal",
    href: "https://support.myfitnesspal.com/hc/en-us/articles/34889191368077-The-difference-between-Free-Premium-and-Premium",
    focus: "Food and nutrient logging; planning and shopping depend on the plan tier.",
    question: "Is detailed individual tracking or a shared household meal the main job?",
  },
  {
    name: "Mealime",
    href: "https://support.mealime.com/article/151-getting-started-guide",
    focus: "Choosing meals and building a consolidated grocery list.",
    question: "How well does the plan explain each eater's needs and nutrition?",
  },
  {
    name: "Samsung Food",
    href: "https://samsungfood.com/food-plus/",
    focus: "Recipes, plans, lists, food information and sharing in one place.",
    question: "How do both apps handle the same family with differing restrictions?",
  },
  {
    name: "ReciMe",
    href: "https://recime.app/help/en/articles/11596201-is-there-a-free-version-of-the-app",
    focus: "Capturing recipes and taking them into a plan and grocery list.",
    question: "How accurately does each app turn a family recipe into a usable meal?",
  },
  {
    name: "Mealia",
    href: "https://mealia.com/uk/home",
    focus: "Budget-led meal planning and a UK supermarket basket.",
    question: "How much work is left between a family plan and a real shop?",
  },
];

type TopicId = "family" | "eater-profiles" | "allergen-preferences" | "meal-adapt" | "meal-create" | "meal-import" | "social-import" | "meal-scan" | "plan-create" | "plan-import" | "plan-scan" | "plan-templates" | "shopping" | "collaboration" | "budget-basket" | "meal-nutrition" | "nutrition-uplift" | "week-nutrition" | "weekly-food-explorer" | "food-diary" | "photo-diary" | "weight" | "mood-energy" | "barcode" | "offline-scan" | "pantry-recipes" | "pantry-visual" | "pantry-sync" | "ai-tailor" | "guided-cook";
type Evidence =
  | { level: "yes" | "partial" | "no"; note: string; href?: string }
  | { level: "unknown"; note: string; href?: string; unknownReason: "not_reported" | "not_assessed" };
type Product = { id: string; name: string; href: string; broad: string; topics: Partial<Record<TopicId, Evidence>> };
const unknown: Evidence = { level: "unknown", unknownReason: "not_reported", note: "The developer sources reviewed for this comparison do not report this capability. This does not confirm that the app lacks it." };
const notAssessed: Evidence = { level: "unknown", unknownReason: "not_assessed", note: "This app and capability have not yet been assessed in the comparison. This is not a No." };
const yes = (note: string, href?: string): Evidence => ({ level: "yes", note, ...(href ? { href } : {}) });
const partial = (note: string, href?: string): Evidence => ({ level: "partial", note, ...(href ? { href } : {}) });
const no = (note: string, href?: string): Evidence => ({ level: "no", note, ...(href ? { href } : {}) });

const topics: Array<{ id: TopicId; label: string; question: string }> = [
  { id: "family", label: "One household plan", question: "Coordinate meals for several eaters" },
  { id: "eater-profiles", label: "Eater profiles", question: "Keep restrictions and preferences for each eater" },
  { id: "allergen-preferences", label: "Food restrictions", question: "Set or check food restrictions and allergens" },
  { id: "meal-adapt", label: "Adapt for each eater", question: "Offer a shared meal with reviewed eater-specific adaptations" },
  { id: "meal-create", label: "Create meals", question: "Create or assemble a meal in the app" },
  { id: "meal-import", label: "Import recipes", question: "Bring a recipe in from a link or text" },
  { id: "social-import", label: "Social recipe import", question: "Import recipes shared through social media" },
  { id: "meal-scan", label: "Scan recipes", question: "Scan a recipe image into the app" },
  { id: "plan-create", label: "Create weekly plans", question: "Build a plan for the coming week" },
  { id: "plan-import", label: "Import a plan", question: "Bring an existing meal plan into the app" },
  { id: "plan-scan", label: "Scan a plan", question: "Scan a paper meal plan into the app" },
  { id: "plan-templates", label: "Reuse plan templates", question: "Save a plan and reuse it in a later week" },
  { id: "shopping", label: "Shopping list", question: "Turn meals into a shopping list or basket" },
  { id: "collaboration", label: "Shared household", question: "Share plans or grocery lists with household members" },
  { id: "budget-basket", label: "Budget & store costs", question: "Compare grocery costs or hand a basket to a retailer" },
  { id: "meal-nutrition", label: "Meal nutrition", question: "Explain nutrition in a meal or recipe" },
  { id: "nutrition-uplift", label: "Add nutrition", question: "Suggest ways to add useful foods or nutrients to a meal" },
  { id: "week-nutrition", label: "Weekly intake", question: "Review nutrient intake totals across diary days" },
  { id: "weekly-food-explorer", label: "Explore the week", question: "Explore foods and their linked nutrients from the week" },
  { id: "food-diary", label: "Food diary", question: "Record what you ate" },
  { id: "photo-diary", label: "Photo meal logging", question: "Suggest diary foods from a meal photo" },
  { id: "weight", label: "Weight in diary", question: "Log weight alongside diary entries" },
  { id: "mood-energy", label: "Mood & energy", question: "Record mood and energy or ability" },
  { id: "barcode", label: "Barcode scan", question: "Scan packaged food in the shop" },
  { id: "offline-scan", label: "Offline scan", question: "Look up scanned packaged food without a connection" },
  { id: "pantry-recipes", label: "Cook from pantry", question: "Find recipes using food already in the house" },
  { id: "pantry-visual", label: "Scan pantry items", question: "Use a camera to recognise ingredients for a pantry list" },
  { id: "pantry-sync", label: "Pantry sync", question: "Keep pantry stock updated from shopping or cooking" },
  { id: "ai-tailor", label: "AI recipe tailoring", question: "Personalise recipes around preferences or nutrition goals" },
  { id: "guided-cook", label: "Guided cooking", question: "Offer an interactive step-by-step cook mode" },
];

const products: Product[] = [
  { id: "tha", name: "The Healthy Apples", href: "/", broad: "Household meals, recipes, nutrition guidance, planning and shopping", topics: {
    family: yes("The shared planner supports meals for the household and can carry different eaters and meal slots."),
    "eater-profiles": yes("Household eater records hold each person's diet choices and hard restrictions."),
    "allergen-preferences": yes("Per-eater restrictions are used in meal adaptation and the Analyser can check a product against household restrictions."),
    "meal-adapt": yes("The planner can offer household-safe variants or per-eater adaptations. People review the proposed changes before accepting them."),
    "meal-create": yes("Create and edit recipes and meals in the Cookbook."),
    "meal-import": partial("URL and pasted-text import paths exist. Some social links cannot be read and require pasted recipe text."),
    "social-import": partial("Instagram and TikTok links can be submitted, but private or dynamically loaded posts may require pasted recipe text."),
    "meal-scan": yes("Recipe images can be scanned, reviewed and saved."),
    "plan-create": yes("The weekly planner creates and edits meal plans."),
    "plan-import": partial("Image scan can extract an existing plan; edit and review the proposals before staging."),
    "plan-scan": yes("Planner scan accepts an image, extracts meal ideas and asks the user to review and accept them."),
    "plan-templates": yes("Weeks can be saved as private templates and reapplied to another planner week."),
    shopping: yes("Planned meals can be sent through a review step into the household shopping list."),
    collaboration: yes("The household shares one planner and shopping list through its membership."),
    "budget-basket": yes("Shopping supports budget tiers, price lookups and retailer basket handoff; availability varies by store."),
    "meal-nutrition": partial("Nutrition Boost surfaces additions and contribution; it is not a full nutrient analysis of every meal."),
    "nutrition-uplift": yes("Rule-based Nutrition Boost suggests useful ingredient additions or swaps; restrictions are checked and suggestions require household review."),
    "week-nutrition": partial("The diary can show nutrients for logged foods, but THA does not claim a complete nutrient-intake report across an entire week."),
    "weekly-food-explorer": yes("The Food room can explore foods from the selected week and the nutrients linked to those foods; it does not measure consumed nutrient amounts."),
    "food-diary": yes("Households can record food eaten."),
    "photo-diary": no("The diary supports manual entries and planner handoff; the reviewed diary flow does not identify foods from a meal photo."),
    weight: yes("The diary supports logging weight."),
    "mood-energy": yes("The diary records mood and energy; this is a lightweight self-report, not a clinical ability measure."),
    barcode: yes("The Analyser supports barcode scanning."),
    "offline-scan": no("Product lookup uses the online analyser service; offline product database lookup is not available."),
    "pantry-recipes": partial("The pantry links foods to matching meals already in the household's Cookbook, but does not yet provide a full use-it-up recipe search."),
    "pantry-visual": no("Pantry items are entered or updated in the household larder; camera-based ingredient recognition is not part of that flow."),
    "pantry-sync": no("Pantry stock is manually maintained; cooking does not automatically decrement the inventory."),
    "ai-tailor": partial("AI assistance and reviewed household adaptations exist; THA does not yet offer a broad goal-based recipe personalisation mode."),
    "guided-cook": no("Recipes contain cooking instructions, but the reviewed app has no dedicated interactive cook mode."),
  } },
  { id: "mealime", name: "Mealime", href: "https://support.mealime.com/article/151-getting-started-guide", broad: "Meal plans, recipes and consolidated groceries", topics: { family: partial("Servings and household sharing are supported; separate eater profiles are not established.", "https://support.mealime.com/article/151-getting-started-guide"), "eater-profiles": unknown, "allergen-preferences": yes("Mealime supports selected allergies and restrictions and warns about possible allergens in grocery-list ingredients.", "https://support.mealime.com/article/107-allergen-warnings"), "plan-create": yes("Meal planning described in developer help."), shopping: yes("Consolidated grocery list described in developer help."), collaboration: yes("A shared account lets people plan together and divide grocery shopping.", "https://support.mealime.com/article/151-getting-started-guide"), "meal-nutrition": partial("Recipe nutrition information is described; detailed analysis scope not checked."), "meal-create": yes("Choose meals from the recipe collection."), "meal-import": unknown, "meal-adapt": unknown, "nutrition-uplift": unknown, "pantry-recipes": unknown, "pantry-visual": unknown, "pantry-sync": unknown, "social-import": unknown, "meal-scan": unknown, "plan-templates": unknown, "budget-basket": unknown, "photo-diary": unknown, "offline-scan": unknown, "ai-tailor": unknown, "guided-cook": unknown } },
  { id: "mealia", name: "Mealia", href: "https://mealia.com/uk/home", broad: "UK budget-led planning and supermarket basket", topics: { "plan-create": yes("UK meal-planning journey described by the developer."), shopping: yes("Plan connects to a UK supermarket basket."), "budget-basket": yes("Budget-led meal planning connects the week's meals to a UK supermarket basket."), "meal-create": yes("Meal plans are assembled from recipes."), "meal-import": unknown } },
  { id: "mfp", name: "MyFitnessPal", href: "https://support.myfitnesspal.com/hc/en-us/articles/34889191368077-The-difference-between-Free-Premium-and-Premium", broad: "Food and nutrient logging; some planning features are tiered", topics: { "food-diary": yes("Food and nutrient diary are core documented functions."), "photo-diary": yes("Premium Meal Scan suggests foods from a meal photo and lets the user correct the result before logging.", "https://support.myfitnesspal.com/hc/en-us/articles/360045761612-How-to-use-the-Meal-Scanner"), weight: yes("Weight tracking is documented."), "plan-create": partial("Meal planning is a Premium+ feature."), shopping: partial("Grocery lists and shopping are Premium+ features."), barcode: yes("Food logging includes barcode scanning."), "meal-nutrition": yes("Tracks nutrients for logged food."), "week-nutrition": yes("Weekly nutrition and fitness reports are documented."), "meal-create": yes("Recipes and custom meals can be logged."), "mood-energy": unknown, "offline-scan": unknown, "plan-templates": unknown } },
  {
    id: "samsung",
    name: "Samsung Food",
    href: "https://support.samsungfood.com/hc/en-us/articles/32709269852052-What-s-Included-in-Your-Samsung-Food-Subscription",
    broad: "Recipes, plans, lists, food information and sharing",
    topics: {
      family: partial("Household size and shared plans are supported; the profile settings reviewed do not establish separate restrictions for each eater.", "https://support.samsungfood.com/hc/en-us/articles/18365212922644-Managing-Your-Samsung-Food-Account"),
      "eater-profiles": { level: "unknown", unknownReason: "not_reported", note: "The account settings reviewed describe one primary diet and household size, but not separate restrictions for each eater. This does not confirm those profiles are absent.", href: "https://support.samsungfood.com/hc/en-us/articles/18365212922644-Managing-Your-Samsung-Food-Account" },
      "allergen-preferences": yes("Account settings let a user choose one diet and multiple food avoidances, including allergies; per-eater controls are not established.", "https://support.samsungfood.com/hc/en-us/articles/18365212922644-Managing-Your-Samsung-Food-Account"),
      "meal-adapt": partial("Food+ can personalize a saved recipe for a user's diet, but the sources reviewed do not establish eater-specific adaptations within one shared family meal.", "https://support.samsungfood.com/hc/en-us/articles/18369261226644-Getting-Started-with-Samsung-Food-Create-and-Edit-Recipes"),
      "meal-create": yes("Recipe Builder supports creating and editing recipes.", "https://support.samsungfood.com/hc/en-us/articles/18369261226644-Getting-Started-with-Samsung-Food-Create-and-Edit-Recipes"),
      "meal-import": yes("Recipes can be imported from web links, a browser extension, mobile share extensions, or an image scan; recipe-site compatibility can vary.", "https://support.samsungfood.com/hc/en-us/articles/18365507924372-Getting-Started-with-Samsung-Food-Save-Search-and-Share-Recipes"),
      "social-import": yes("The mobile share extension can save recipes from apps such as Pinterest and Facebook.", "https://support.samsungfood.com/hc/en-us/articles/18365507924372-Getting-Started-with-Samsung-Food-Save-Search-and-Share-Recipes"),
      "meal-scan": yes("Recipe-image scanning is documented; Basic accounts receive three scans and Food+ includes unlimited scans.", "https://support.samsungfood.com/hc/en-us/articles/18365507924372-Getting-Started-with-Samsung-Food-Save-Search-and-Share-Recipes"),
      "plan-create": yes("The weekly planner schedules saved recipes by day and meal type.", "https://support.samsungfood.com/hc/en-us/articles/35369657798548-Getting-Started-with-Meal-Planner"),
      "plan-import": { level: "unknown", unknownReason: "not_reported", note: "The planner sources reviewed describe adding recipes and reusing saved plan templates, but do not document importing an existing external meal plan. This is not confirmation that import is absent.", href: "https://support.samsungfood.com/hc/en-us/articles/35369657798548-Getting-Started-with-Meal-Planner" },
      "plan-scan": { level: "unknown", unknownReason: "not_reported", note: "The planner sources reviewed do not document scanning a paper meal plan. This is not confirmation that the capability is absent.", href: "https://support.samsungfood.com/hc/en-us/articles/35369657798548-Getting-Started-with-Meal-Planner" },
      "plan-templates": yes("Meal plans can be saved and reused; up to three plans are available free, with unlimited saved plans in Food+.", "https://support.samsungfood.com/hc/en-us/articles/35374865737620-Meal-Planner-FAQ"),
      shopping: yes("Meal plans generate shopping lists, with retailer checkout in supported regions.", "https://support.samsungfood.com/hc/en-us/articles/18369342052372-Getting-Started-with-Samsung-Food-Create-and-Manage-Shopping-Lists"),
      collaboration: yes("Meal plans and shopping lists can be shared with family and friends.", "https://support.samsungfood.com/hc/en-us/articles/18689681101716-Sharing-Collaboration-on-Samsung-Food"),
      "budget-basket": partial("Shopping lists can hand items to retailer checkout in supported regions; budget comparison is not established in the sources reviewed.", "https://support.samsungfood.com/hc/en-us/articles/18369342052372-Getting-Started-with-Samsung-Food-Create-and-Manage-Shopping-Lists"),
      "meal-nutrition": yes("Recipes include detailed macro- and micronutrient information; the help page documents calculation inputs and limits.", "https://support.samsungfood.com/hc/en-us/articles/18725068057620-Nutrition-calculations-Macronutrients-Micronutrients-and-Health-Score"),
      "nutrition-uplift": partial("Food+ AI can balance macros or give a recipe a healthier twist; specific nutrient-adding ingredient suggestions are not established.", "https://samsungfood.com/food-plus/"),
      "week-nutrition": partial("Food+ tracks daily nutrition goals and offers tailored seven-day plans; a report of actual consumed nutrient totals across diary days is not established.", "https://support.samsungfood.com/hc/en-us/articles/30286911223956-How-to-Set-and-Manage-Your-Daily-Nutrition-Goals-in-Samsung-Food"),
      "pantry-recipes": yes("Use It Up searches recipes using foods in the Food List.", "https://support.samsungfood.com/hc/en-us/articles/32709269852052-What-s-Included-in-Your-Samsung-Food-Subscription"),
      "pantry-visual": yes("Vision AI can identify ingredients from a photo and add selected items to the Food List.", "https://support.samsungfood.com/hc/en-us/articles/30025317487508-Getting-Started-with-Food-List"),
      "pantry-sync": yes("Food+ supports transferring items between Shopping and Food Lists and automated Food List updates.", "https://support.samsungfood.com/hc/en-us/articles/32709269852052-What-s-Included-in-Your-Samsung-Food-Subscription"),
      "ai-tailor": yes("Food+ creates tailored seven-day plans from tastes, dietary needs and health goals; Samsung Health can provide personal health data.", "https://support.samsungfood.com/hc/en-us/articles/35369657798548-Getting-Started-with-Meal-Planner"),
      "guided-cook": yes("Food+ Smart Cook Mode offers guided steps and AI tips; appliance control is also described.", "https://support.samsungfood.com/hc/en-us/articles/32709269852052-What-s-Included-in-Your-Samsung-Food-Subscription"),
    },
  },
  { id: "yuka", name: "Yuka", href: "https://yuka.io/en/app/", broad: "Packaged-food scanning, ratings and alternatives", topics: { barcode: yes("Scans packaged food and explains its product rating."), "allergen-preferences": partial("Premium dietary preferences highlight selected ingredients such as gluten or lactose; this is a product preference check, not household meal planning.", "https://yuka.io/en/app/"), "offline-scan": yes("Premium offline mode allows scanning products without a connection.", "https://help.yuka.io/l/en/article/dop80j54bb-paid-version-features"), "meal-nutrition": partial("Explains the nutritional profile of a packaged product; meal-level planning is not established."), "plan-create": unknown, shopping: unknown, "food-diary": unknown, "meal-create": unknown, "meal-import": unknown, "meal-adapt": unknown } },
  { id: "mynetdiary", name: "MyNetDiary", href: "https://www.mynetdiary.com/help/logging-food/meal-planner", broad: "Planner, grocery check, food logging and scanning", topics: { "plan-create": yes("Weekly meal planner documented."), shopping: yes("Shopping list and grocery check connect to the meal plan."), "food-diary": yes("Food diary and nutrient logging documented."), weight: yes("Weight tracking documented."), barcode: yes("Food scanning documented."), "meal-nutrition": yes("Nutrient tracking for meals documented."), "meal-create": yes("Custom recipes and meals documented."), "week-nutrition": yes("Nutrient reports across diary periods documented.") } },
  { id: "realplans", name: "Real Plans", href: "https://datav2.realplans.com/features/", broad: "Family-size and restriction-aware planning", topics: { family: partial("Family-size and dietary-restriction planning described; separate eater profiles not established."), "plan-create": yes("Meal plans and prep timelines documented."), shopping: yes("Plans generate shopping lists."), "meal-create": yes("Recipe collection used to assemble plans."), "meal-nutrition": partial("Macros described; full meal nutrient analysis not verified.") } },
  { id: "lifesum", name: "Lifesum", href: "https://lifesum.com/", broad: "Meal plans, recipes, tracking and barcode logging", topics: { "plan-create": yes("Meal plans documented."), shopping: yes("Shopping list documented by help center."), "food-diary": yes("Food diary and tracking documented."), barcode: yes("Barcode food logging documented."), "meal-nutrition": yes("Nutrient tracking and recipe nutrition documented."), weight: yes("Weight tracking documented."), "mood-energy": unknown } },
  { id: "yazio", name: "Yazio", href: "https://help.yazio.com/hc/en-us/articles/208847005-How-does-Yazio-Pro-support-my-goals", broad: "Meal planning, recipes, nutrition and diary", topics: { "plan-create": yes("Planned meals and recipes described in Pro features."), shopping: yes("Recipe shopping list documented."), "food-diary": yes("Food diary and nutrient tracking documented."), "meal-nutrition": yes("Detailed nutrient information documented."), weight: yes("Weight tracking documented."), barcode: unknown } },
  { id: "carbmanager", name: "Carb Manager", href: "https://help.carbmanager.com/docs/meal-plan-overview", broad: "Diet-focused plans, recipes, shopping and barcode logging", topics: { "plan-create": yes("Meal-plan overview documented."), shopping: yes("Meal plans link to grocery list."), "food-diary": yes("Food and nutrient tracking documented."), barcode: yes("Barcode scan documented."), "meal-nutrition": yes("Macro and nutrient tracking documented."), "meal-create": yes("Recipes and custom meals documented.") } },
  { id: "cherrypick", name: "Cherrypick", href: "https://apps.apple.com/gb/app/cherrypick-plan-shop-cook/id1567423761", broad: "UK planning, cupboard-aware list and supermarket handoff", topics: { "plan-create": yes("Meal planning described in app listing."), shopping: yes("List and supermarket handoff documented."), "meal-create": yes("Recipes form the plan."), family: unknown } },
  { id: "recime", name: "ReciMe", href: "https://apps.apple.com/gb/app/recime-recipes-meal-planner/id1593779280", broad: "Recipe imports, plans, lists and recipe nutrition", topics: { "meal-import": yes("Recipe import from social and web sources is a core feature."), "plan-create": yes("Meal planning documented."), shopping: yes("Grocery list and checkout documented."), "meal-nutrition": partial("Recipe nutrition depends on the feature tier."), "meal-create": yes("Recipes can be saved and organized."), family: unknown } },
  { id: "cooklist", name: "Cooklist", href: "https://cooklist.com/cooklist-app", broad: "Pantry inventory to recipe, plan and grocery journey", topics: { "plan-create": yes("Meal planning documented."), shopping: yes("Grocery journey documented."), "meal-create": yes("Recipes and cooking suggestions documented."), family: unknown } },
  { id: "mealboard", name: "MealBoard", href: "https://mealboard.com/features.html", broad: "Recipes, planner, aisle list and pantry", topics: { "plan-create": yes("Meal planner documented."), shopping: yes("Store and aisle list documented."), "meal-create": yes("Recipe manager documented."), "meal-import": yes("Recipe importing documented."), family: unknown } },
  { id: "paprika", name: "Paprika", href: "https://paprikaapp.com/help/v3/ios/", broad: "Recipe manager, planner, lists and pantry", topics: { "meal-create": yes("Recipe manager supports user-created recipes."), "meal-import": yes("Recipe web import documented."), "plan-create": yes("Meal planner documented."), shopping: yes("Consolidated shopping list documented."), family: unknown } },
  { id: "anylist", name: "AnyList", href: "https://www.anylist.com/meal-planning", broad: "Shared household recipes, plans and grocery lists", topics: { family: partial("Household list sharing documented; per-eater restrictions not established."), "plan-create": yes("Meal planning documented."), shopping: yes("Shared grocery lists documented."), "meal-create": yes("Recipe collection documented."), "meal-import": yes("Recipe import documented.") } },
  { id: "sidechef", name: "SideChef", href: "https://www.sidechef.com/faq/", broad: "Recipes, planner, shopping and guided cooking", topics: { "meal-create": yes("Recipe collection and cook flow documented."), "plan-create": yes("Meal planning documented."), shopping: yes("Shopping integration documented."), "meal-nutrition": partial("Nutrition details vary by recipe and source."), "meal-import": yes("Recipe import documented.") } },
  { id: "plantoeat", name: "Plan to Eat", href: "https://learn.plantoeat.com/en/help/getting-started-the-app", broad: "Save recipes, schedule them and generate a list", topics: { "meal-create": yes("Personal recipe collection documented."), "meal-import": yes("Recipe clipper/import documented."), "plan-create": yes("Recipe scheduling calendar documented."), shopping: yes("Shopping list generated from scheduled recipes.") } },
  { id: "sidekick", name: "Sorted Sidekick", href: "https://help.sortedfood.com/hc/en-gb/articles/4638394094482-What-do-I-get-from-Sidekick", broad: "Weekly menu, shared ingredients, list and cooking guidance", topics: { "plan-create": yes("Weekly menu packs documented."), shopping: yes("Shared-ingredient shopping list documented."), "meal-nutrition": partial("Optional nutrition information; detailed scope not verified."), "meal-create": yes("Curated recipes and cooking guidance.") } },
  { id: "whipp", name: "Whipp", href: "https://www.whipp.app/", broad: "Budget/store-led week, aisle list and recipe macros", topics: { "plan-create": yes("Weekly meal planning documented."), shopping: yes("Aisle-based shopping list documented."), "meal-nutrition": yes("Recipe calories and macros documented."), "meal-create": yes("Recipe selection documented.") } },
  { id: "crouton", name: "Crouton", href: "https://crouton.app/press-kit.html", broad: "Shared recipes, flexible planning, shopping and cook mode", topics: { family: partial("Household recipe sharing documented; per-eater restrictions not established."), "plan-create": yes("Flexible planning documented."), shopping: yes("Shopping lists documented."), "meal-create": yes("Recipe creation and sharing documented."), "meal-import": yes("Recipe import documented.") } },
];

function evidenceFor(product: Product, topicId: TopicId): Evidence {
  return product.topics[topicId] ?? notAssessed;
}

function evidenceStyle(level: Evidence["level"]) {
  if (level === "yes") return "border-emerald-700/30 bg-emerald-700/10 text-emerald-800 dark:text-emerald-300";
  if (level === "partial") return "border-amber-600/30 bg-amber-500/10 text-amber-800 dark:text-amber-300";
  if (level === "no") return "border-red-700/30 bg-red-700/10 text-red-800 dark:text-red-300";
  return "border-border bg-muted text-muted-foreground";
}

function evidenceLabel(level: Evidence["level"]) {
  return level === "yes" ? "Yes" : level === "partial" ? "Some limits" : level === "no" ? "No" : "Not verified";
}

function evidenceAssessmentLabel(evidence: Evidence) {
  if (evidence.level !== "unknown") return null;
  return evidence.unknownReason === "not_assessed" ? "Not assessed yet" : "Not reported in reviewed sources";
}

export default function FeaturesComparePage() {
  const [selectedTopics, setSelectedTopics] = useState<TopicId[]>([]);
  const [selectedComparatorId, setSelectedComparatorId] = useState("");
  const [detail, setDetail] = useState<{ product: Product; topic: (typeof topics)[number] } | null>(null);
  const visibleTopics = useMemo(() => [
    ...(selectedComparatorId
      ? [...topics].sort((a, b) => {
          const selectedComparator = products.find((product) => product.id === selectedComparatorId);
          const levelOrder: Record<Evidence["level"], number> = { yes: 0, partial: 1, no: 2, unknown: 3 };
          const evidenceDifference = levelOrder[evidenceFor(selectedComparator!, a.id).level] - levelOrder[evidenceFor(selectedComparator!, b.id).level];
          if (evidenceDifference !== 0) return evidenceDifference;
          const priorityDifference = Number(selectedTopics.includes(b.id)) - Number(selectedTopics.includes(a.id));
          return priorityDifference || topics.indexOf(a) - topics.indexOf(b);
        })
      : [
          ...topics.filter((topic) => selectedTopics.includes(topic.id)),
          ...topics.filter((topic) => !selectedTopics.includes(topic.id)),
        ]),
  ], [selectedTopics, selectedComparatorId]);
  const visibleProducts = useMemo(() => {
    if (!selectedTopics.length && !selectedComparatorId) return products;
    return [...products].sort((a, b) => {
      if (a.id === "tha") return -1;
      if (b.id === "tha") return 1;
      if (a.id === selectedComparatorId) return -1;
      if (b.id === selectedComparatorId) return 1;
      const score = (p: Product) => selectedTopics.reduce((n, topic) => n + (evidenceFor(p, topic).level === "yes" ? 1 : evidenceFor(p, topic).level === "partial" ? 0.5 : 0), 0);
      return score(b) - score(a);
    });
  }, [selectedTopics, selectedComparatorId]);

  const toggleTopic = (id: TopicId) => setSelectedTopics((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Features & comparison | The Healthy Apples";
    return () => { document.title = previousTitle; };
  }, []);

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-background text-foreground">
      <OrchardBackdrop />
      <div className="relative z-10 min-h-[100dvh] bg-background/30">
        <header className="border-b border-border/50 bg-card/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <Link href="/" aria-label="The Healthy Apples home" className="shrink-0">
              <img src="/logo-long.png" alt="The Healthy Apples" className="h-14 w-auto sm:h-16" />
            </Link>
            <nav aria-label="Page navigation" className="flex items-center gap-3 sm:gap-6 text-sm">
              <Link href="/" className="hidden text-foreground/75 hover:text-primary sm:inline">Home</Link>
              <span aria-current="page" className="font-semibold text-primary">Features &amp; compare</span>
              <Link href="/auth" className="hidden rounded-xl border border-border bg-card px-4 py-2 font-medium hover:border-primary/50 sm:inline">Sign in</Link>
            </nav>
          </div>
        </header>

        <main>
          <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.15fr_.85fr]">
            <div>
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">Features &amp; comparison</p>
              <h1 className="max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">One table. Everyone considered.</h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">The Healthy Apples helps a household think through one meal with each eater in mind, then carry that decision into a plan and shopping list.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#compare-apps" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground hover:bg-primary/90">See how apps compare <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
                <a href="#our-approach" className="inline-flex min-h-11 items-center rounded-xl border border-border bg-card px-5 py-3 font-semibold text-primary hover:border-primary/50">Explore THA's approach</a>
              </div>
            </div>
            <div className="rounded-3xl border border-border/70 bg-card/95 p-7 shadow-sm sm:p-9" aria-label="One household dinner with different needs">
              <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
                <Heart className="h-8 w-8 text-primary" aria-hidden="true" />
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary">A meal for the household</span>
              </div>
              <h2 className="mt-6 text-2xl font-semibold tracking-tight">Dinner starts together</h2>
              <p className="mt-2 text-sm text-muted-foreground">One starting point, with individual needs in view.</p>
              <ul className="mt-6 divide-y divide-border text-sm">
                <li className="flex gap-4 py-3"><span className="w-20 font-semibold">Eater 1</span><span className="text-muted-foreground">Vegetarian preference</span></li>
                <li className="flex gap-4 py-3"><span className="w-20 font-semibold">Eater 2</span><span className="text-muted-foreground">Ingredient restriction</span></li>
                <li className="flex gap-4 py-3"><span className="w-20 font-semibold">Eater 3</span><span className="text-muted-foreground">Looking for more variety</span></li>
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Illustrative example. Always review ingredients and suggested adaptations before cooking.</p>
            </div>
          </section>

          <section id="our-approach" className="border-t border-border/60 bg-card/40 py-16 sm:py-20">
            <div className="mx-auto max-w-6xl px-5 sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">What THA brings together</p>
              <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">Help with the whole dinner decision.</h2>
              <p className="mt-4 max-w-2xl text-muted-foreground">Food advice is most useful when it fits the people eating, the recipe in hand and the shopping that follows.</p>
              <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {strengths.map(({ icon: Icon, title, body }) => (
                  <article key={title} className="rounded-2xl border border-border/80 bg-card p-6">
                    <Icon className="mb-5 h-6 w-6 text-primary" aria-hidden="true" />
                    <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section id="compare-apps" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Build your comparison</p>
            <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">What matters most to your household?</h2>
            <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">Compare THA with 21 competitor food apps across household needs, recipe capture, planning, nutrition, diaries, shopping and pantry tools. Choose priorities to bring the most relevant apps forward, or click an app name above its column to order features by its evidence. Select a dot to inspect the details.</p>
            <p className="mt-2 text-xs text-muted-foreground">Evidence checked 19 November 2026 against THA source code and app developers' own help pages. Availability can vary by country, device and subscription tier.</p>
            <div className="mt-7 flex flex-wrap gap-2">
              {topics.map((topic) => {
                const active = selectedTopics.includes(topic.id);
                return <button key={topic.id} type="button" aria-pressed={active} onClick={() => toggleTopic(topic.id)} className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50"}`}>{topic.label}</button>;
              })}
              <button type="button" onClick={() => setSelectedTopics([])} className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm text-muted-foreground hover:text-primary"><RotateCcw className="h-3.5 w-3.5"/> Clear priorities</button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">{selectedComparatorId ? `${products.find((product) => product.id === selectedComparatorId)?.name} is selected. Features are ordered Yes, Some limits, No, then Not verified; selected priorities are highlighted within each group. Click the selected name again to return to priority order.` : selectedTopics.length > 0 ? "Selected priorities move to the top of the grid. Apps are ordered by documented support for those priorities; unknown cells do not count against an app." : "Click a competitor name in the table header to order features by its evidence. Click the selected name again to return to priority order."}</p>

            <div className="mt-7 overflow-x-auto rounded-2xl border border-border bg-card">
              <div role="table" aria-label="Feature evidence by app" className="min-w-[1080px]">
                <div role="row" className="grid bg-accent" style={{ gridTemplateColumns: `minmax(240px, 260px) repeat(${visibleProducts.length}, minmax(40px, 1fr))` }}>
                  <div role="columnheader" className="flex h-32 items-end px-4 pb-3 text-sm font-semibold">What it needs to do</div>
                  {visibleProducts.map((product) => <div role="columnheader" key={product.id} className={`relative h-32 border-l border-border/70 ${product.id === selectedComparatorId ? "bg-primary/10" : ""}`} title={product.broad}>{product.id === "tha" ? <a href={product.href} className="absolute bottom-3 left-1/2 origin-bottom-left -rotate-[55deg] whitespace-nowrap text-[11px] font-semibold text-primary underline-offset-4 hover:underline">{product.name}</a> : <button type="button" aria-pressed={product.id === selectedComparatorId} aria-label={product.id === selectedComparatorId ? `${product.name} selected for feature order. Click to clear.` : `Order features by ${product.name}`} onClick={() => setSelectedComparatorId((current) => current === product.id ? "" : product.id)} className={`absolute bottom-3 left-1/2 origin-bottom-left -rotate-[55deg] whitespace-nowrap rounded px-1 text-[11px] font-semibold underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${product.id === selectedComparatorId ? "bg-primary text-primary-foreground" : "text-primary"}`}>{product.name}</button>}</div>)}
                </div>
                {visibleTopics.map((topic) => <div role="row" key={topic.id} className={`grid min-h-10 border-t border-border ${selectedTopics.includes(topic.id) ? "bg-accent/40" : ""}`} style={{ gridTemplateColumns: `minmax(240px, 260px) repeat(${visibleProducts.length}, minmax(40px, 1fr))` }}>
                  <div role="rowheader" className="flex items-center px-4 py-2 text-xs font-medium leading-tight">{topic.question}{selectedTopics.includes(topic.id) && <span className="ml-2 shrink-0 text-[10px] font-semibold text-primary">Priority</span>}</div>
                  {visibleProducts.map((product) => {const evidence = evidenceFor(product, topic.id); const dot = evidence.level === "yes" ? "bg-emerald-700" : evidence.level === "partial" ? "bg-amber-500" : evidence.level === "no" ? "bg-red-700" : "bg-muted-foreground/35"; return <div role="cell" key={product.id} className={`flex items-center justify-center border-l border-border/50 ${product.id === selectedComparatorId ? "bg-primary/5" : ""}`}><button type="button" onClick={() => setDetail({ product, topic })} title={`${product.name}: ${evidenceLabel(evidence.level)}`} aria-label={`${product.name}, ${topic.question}: ${evidenceLabel(evidence.level)}. Open evidence.`} className={`h-3.5 w-3.5 rounded-full ${dot} ring-offset-2 transition-transform hover:scale-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`} /></div>;})}
                </div>)}
              </div>
            </div>
            {detail && <div role="dialog" aria-modal="true" aria-labelledby="evidence-title" className="mt-5 rounded-2xl border border-primary/30 bg-card p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-bold ${evidenceStyle(evidenceFor(detail.product, detail.topic.id).level)}`}>{evidenceLabel(evidenceFor(detail.product, detail.topic.id).level)}</p><h3 id="evidence-title" className="mt-2 text-lg font-semibold">{detail.product.name}: {detail.topic.question}</h3></div><button type="button" onClick={() => setDetail(null)} className="rounded-lg border border-border px-3 py-1 text-sm hover:border-primary/50">Close</button></div>{evidenceAssessmentLabel(evidenceFor(detail.product, detail.topic.id)) && <p className="mt-2 text-xs font-medium text-muted-foreground">{evidenceAssessmentLabel(evidenceFor(detail.product, detail.topic.id))}</p>}<p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{evidenceFor(detail.product, detail.topic.id).note}</p>{detail.product.id !== "tha" && <a className="mt-4 inline-block text-sm font-medium text-primary underline underline-offset-4" href={evidenceFor(detail.product, detail.topic.id).href ?? detail.product.href} target="_blank" rel="noopener noreferrer">Open the developer source</a>}</div>}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-background/80 p-5 text-sm text-muted-foreground"><strong className="text-foreground">Evidence key</strong><span className="inline-flex items-center gap-2"><i className="h-3 w-3 rounded-full bg-emerald-700"/>Yes</span><span className="inline-flex items-center gap-2"><i className="h-3 w-3 rounded-full bg-amber-500"/>Some limits</span><span className="inline-flex items-center gap-2"><i className="h-3 w-3 rounded-full bg-red-700"/>No</span><span className="inline-flex items-center gap-2"><i className="h-3 w-3 rounded-full bg-muted-foreground/35"/>Not verified</span><span className="basis-full pt-1">Grey means Not verified. Details distinguish a cell not assessed yet from a feature not reported in reviewed developer sources; neither confirms absence. Red is reserved for evidence that confirms a capability is not offered. Select a dot to read the evidence and open the relevant developer source. No overall winner or total score is published.</span></div>

          </section>

          <section className="border-t border-border/60 bg-accent/70 py-16">
            <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 px-5 sm:px-8 lg:flex-row lg:items-center">
              <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">A calmer next step</p><h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">Start with the people you feed.</h2><p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">AI suggestions, scans and imported recipes need your review. The household makes the final choice.</p></div>
              <Link href="/" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90">Explore The Healthy Apples <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
          </section>
        </main>

        <footer className="border-t border-border/60 bg-card/70 px-5 py-7 text-center text-xs text-muted-foreground sm:px-8">
          © {new Date().getFullYear()} The Healthy Apples. <Link href="/legal" className="ml-2 underline underline-offset-2 hover:text-primary">Legal &amp; privacy</Link>
        </footer>
      </div>
    </div>
  );
}
