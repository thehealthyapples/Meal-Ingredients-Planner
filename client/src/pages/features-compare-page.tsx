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
  | { level: "yes" | "partial" | "no"; note: string; href?: string; lastReviewed?: string }
  | { level: "unknown"; note: string; href?: string; lastReviewed?: string; unknownReason: "not_reported" | "not_assessed" };
type Product = { id: string; name: string; href: string; broad: string; topics: Partial<Record<TopicId, Evidence>> };
const unknown: Evidence = { level: "unknown", unknownReason: "not_reported", note: "The developer sources reviewed for this comparison do not report this capability. This does not confirm that the app lacks it." };
const notAssessed: Evidence = { level: "unknown", unknownReason: "not_assessed", note: "This app and capability have not yet been assessed in the comparison. This is not a No." };
const yes = (note: string, href?: string): Evidence => ({ level: "yes", note, ...(href ? { href } : {}) });
const partial = (note: string, href?: string): Evidence => ({ level: "partial", note, ...(href ? { href } : {}) });
const no = (note: string, href?: string): Evidence => ({ level: "no", note, ...(href ? { href } : {}) });
const reviewed = (evidence: Evidence, href: string): Evidence => ({ ...evidence, href, lastReviewed: "2026-11-19" });

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
  {
    id: "mealime",
    name: "Mealime",
    href: "https://support.mealime.com/article/151-getting-started-guide",
    broad: "Personalized meal planning, organized groceries and guided cooking",
    topics: {
      family: partial("Meal plans can set household size and servings, but the reviewed sources do not establish distinct restriction profiles for each eater; recipes scale to six servings.", "https://support.mealime.com/article/98-can-i-scale-servings-greater-than-4"),
      "eater-profiles": { ...unknown, note: "Mealime describes one set of eating preferences and household size; separate saved restriction profiles for individual eaters are not established.", href: "https://support.mealime.com/article/59-choose-your-allergies-and-restrictions" },
      "allergen-preferences": yes("Users can select from supported allergy/restriction filters; grocery-list ingredients may show cross-contamination warnings. Preferences apply to the account's plans.", "https://support.mealime.com/article/107-allergen-warnings"),
      "meal-adapt": partial("Recipe selection can filter for diet, allergies, dislikes, calories and other preferences, but separate versions of one shared meal for different eaters are not established.", "https://support.mealime.com/article/151-getting-started-guide"),
      "meal-create": partial("Users assemble plans from Mealime recipes and can save favorites/notes; creating a new recipe from scratch is not established in the sources reviewed.", "https://support.mealime.com/article/151-getting-started-guide"),
      "meal-import": yes("The mobile app imports many web recipes by pasting a recipe URL; parsing success can depend on the source page.", "https://support.mealime.com/article/112-importing-a-recipe-from-the-web"),
      "social-import": partial("Recipe URLs can be copied from a mobile browser and pasted into Mealime; a direct social-media import integration is not established.", "https://support.mealime.com/article/112-importing-a-recipe-from-the-web"),
      "meal-scan": unknown,
      "plan-create": yes("The auto-builder and self-serve planner assemble meal plans; users may plan a week ahead or choose meals day by day.", "https://support.mealime.com/article/151-getting-started-guide"),
      "plan-import": unknown,
      "plan-scan": unknown,
      "plan-templates": { ...unknown, note: "Mealime Pro can show the two most recent plans; reusable plan templates are not established by the reviewed documentation.", href: "https://support.mealime.com/article/79-mealime-pro" },
      shopping: yes("Plans generate consolidated, categorized grocery lists with recipe quantities; retailer delivery integrations depend on location and provider.", "https://support.mealime.com/article/75-how-the-grocery-list-works"),
      collaboration: partial("Several people can keep one account synchronized across their devices, but Mealime says it has no in-app multi-user sharing feature or separate collaborator accounts.", "https://support.mealime.com/article/102-multi-user-accounts"),
      "budget-basket": partial("Meal plans can filter by per-serving price/grocery price and connect lists to delivery services; Mealime says it cannot provide a general total grocery-cost estimate.", "https://support.mealime.com/article/93-how-much-will-my-meal-plans-groceries-cost"),
      "meal-nutrition": partial("Mealime Pro shows recipe calories, macros and micronutrients; nutrition detail is subscription-gated.", "https://support.mealime.com/article/89-viewing-recipe-nutritional-information"),
      "nutrition-uplift": unknown,
      "week-nutrition": partial("Cooked recipe servings and nutrition can be sent to Apple Health; in-app analysis of actual nutrient totals across a week is not established.", "https://support.mealime.com/article/151-getting-started-guide"),
      "weekly-food-explorer": unknown,
      "food-diary": partial("A recipe can be marked cooked and consumed servings can be sent to Apple Health; a full in-app food diary is not established.", "https://support.mealime.com/article/151-getting-started-guide"),
      "photo-diary": unknown,
      weight: unknown,
      "mood-energy": unknown,
      barcode: unknown,
      "offline-scan": unknown,
      "pantry-recipes": partial("Mealime Pro lets the planner use selected fridge or pantry items; it is a plan-building filter, not a documented live pantry inventory.", "https://support.mealime.com/article/151-getting-started-guide"),
      "pantry-visual": unknown,
      "pantry-sync": unknown,
      "ai-tailor": { ...unknown, note: "Meal plans are personalized using recipe filters and preferences; the reviewed sources do not identify AI as the method or establish AI recipe tailoring.", href: "https://work.mealime.com/personalization" },
      "guided-cook": yes("Mobile cooking mode presents one instruction at a time and supports hands-free step advancement.", "https://support.mealime.com/article/88-how-to-use-cooking-mode"),
    },
  },
  {
    id: "mealia",
    name: "Mealia",
    href: "https://mealia.com/uk/home",
    broad: "UK budget-first meal planning with supermarket basket building",
    topics: {
      family: partial("Mealia describes household dietary preferences and portion scaling for family plans; separate restriction profiles for each eater are not established.", "https://mealia.com/uk/guides/family-meal-planning-app-uk"),
      "eater-profiles": { ...unknown, note: "The reviewed sources describe household dietary preferences and serving count, but do not establish separate saved profiles and restrictions for each family member.", href: "https://mealia.com/uk/guides/family-meal-planning-app-uk" },
      "allergen-preferences": partial("Dietary preferences filter household recipes, but the sources reviewed do not specify the supported allergy set or an allergen warning/safety system.", "https://mealia.com/uk/guides/family-meal-planning-app-uk"),
      "meal-adapt": partial("Mealia filters recipe choices to household diet/taste needs and scales servings; separate adaptations of one meal for individual eaters are not established.", "https://mealia.com/uk/guides/family-meal-planning-app-uk"),
      "meal-create": partial("Users swipe through and assemble recipes into a weekly plan; creating custom recipes from scratch is not established.", "https://mealia.com/uk/home"),
      "meal-import": yes("Recent App Store release notes document importing recipes from websites; the exact range of supported sites is not stated.", "https://apps.apple.com/gb/app/mealia-ai-grocery-assistant/id6475587257"),
      "social-import": partial("Recipe import from websites is documented, but direct import from social-media posts/apps is not established.", "https://apps.apple.com/gb/app/mealia-ai-grocery-assistant/id6475587257"),
      "meal-scan": unknown,
      "plan-create": yes("Mealia builds a personalized weekly meal plan from recipes, household needs and budget.", "https://mealia.com/uk/home"),
      "plan-import": unknown,
      "plan-scan": unknown,
      "plan-templates": unknown,
      shopping: yes("For UK users, the app says it builds meal ingredients into a supermarket basket at Tesco, Asda, Sainsbury's or Morrisons; users review/checkout with the retailer.", "https://apps.apple.com/gb/app/mealia-ai-grocery-assistant/id6475587257"),
      collaboration: unknown,
      "budget-basket": yes("Users set a weekly budget before planning; Mealia says it selects a plan and basket to fit, with the retailer handling final basket checkout.", "https://mealia.com/uk/guides/meal-planning-on-a-budget-uk"),
      "meal-nutrition": unknown,
      "nutrition-uplift": unknown,
      "week-nutrition": unknown,
      "weekly-food-explorer": unknown,
      "food-diary": unknown,
      "photo-diary": unknown,
      weight: unknown,
      "mood-energy": unknown,
      barcode: unknown,
      "offline-scan": unknown,
      "pantry-recipes": partial("The App Store description says shoppers can remove items already at home from the basket; recipe discovery from pantry inventory is not established.", "https://apps.apple.com/gb/app/mealia-ai-grocery-assistant/id6475587257"),
      "pantry-visual": unknown,
      "pantry-sync": unknown,
      "ai-tailor": partial("Mealia describes an AI assistant that personalizes meal plans to stated needs, tastes and budget; AI editing of recipes for nutrient targets is not established.", "https://mealia.com/uk/home"),
      "guided-cook": unknown,
    },
  },
  {
    id: "mfp",
    name: "MyFitnessPal",
    href: "https://support.myfitnesspal.com/hc/en-us/articles/34889191368077-The-difference-between-Free-Premium-and-Premium",
    broad: "Food logging, nutrition insights, and tiered meal planning",
    topics: {
      family: partial("Premium+ can scale plans for a household size and account for shared meals, allergies and preferences; this is one plan setup, not documented separate eater profiles.", "https://support.myfitnesspal.com/hc/en-us/articles/34603055097869-How-to-use-the-Meal-Planner"),
      "eater-profiles": { ...unknown, note: "Meal Planner settings describe household size and shared meals, but the sources reviewed do not establish separate saved profiles with individual restrictions for each eater.", href: "https://support.myfitnesspal.com/hc/en-us/articles/34603055097869-How-to-use-the-Meal-Planner" },
      "allergen-preferences": partial("Premium+ Meal Planner accepts allergies, restrictions and dislikes for its plan; separate restriction controls for each person are not established.", "https://support.myfitnesspal.com/hc/en-us/articles/34603055097869-How-to-use-the-Meal-Planner"),
      "meal-adapt": partial("Plans can be tailored around dietary preferences and shared household meals, but the sources reviewed do not document alternative versions of one meal for individual eaters.", "https://support.myfitnesspal.com/hc/en-us/articles/34603055097869-How-to-use-the-Meal-Planner"),
      "meal-create": yes("Free accounts can create custom foods, meals and recipes; recipes can be assembled from ingredients.", "https://support.myfitnesspal.com/hc/en-us/articles/360032271452-How-to-create-and-find-your-recipes"),
      "meal-import": yes("Recipe import accepts web links and ingredient lists; app import currently requires English device language.", "https://support.myfitnesspal.com/hc/en-us/articles/360032623231-How-the-Recipe-Importer-works-in-the-iOS-and-Android-apps"),
      "social-import": { ...unknown, note: "Recipe import from web links is documented, but importing from social-media posts or apps is not established by the sources reviewed.", href: "https://support.myfitnesspal.com/hc/en-us/articles/360032623231-How-the-Recipe-Importer-works-in-the-iOS-and-Android-apps" },
      "meal-scan": yes("Premium Meal Scan suggests foods from a meal photo for diary logging; it is not documented as recipe or meal-plan scanning.", "https://support.myfitnesspal.com/hc/en-us/articles/360045761612-How-to-use-the-Meal-Scanner"),
      "plan-create": partial("Premium+ builds meal plans around goals, preferences and household size; availability requires English and is currently documented for six countries.", "https://support.myfitnesspal.com/hc/en-us/articles/34603055097869-How-to-use-the-Meal-Planner"),
      "plan-import": { ...unknown, note: "Users can view past MyFitnessPal plans, but importing an external meal plan is not established by the sources reviewed.", href: "https://support.myfitnesspal.com/hc/en-us/articles/34603055097869-How-to-use-the-Meal-Planner" },
      "plan-scan": unknown,
      "plan-templates": partial("Past MyFitnessPal plans can be viewed and reused as a starting point; reusable named templates are not established.", "https://support.myfitnesspal.com/hc/en-us/articles/34603055097869-How-to-use-the-Meal-Planner"),
      shopping: partial("Premium+ creates grocery lists; syncing to delivery apps is documented for the US and Canada, while users elsewhere can shop in store.", "https://support.myfitnesspal.com/hc/en-us/articles/34603055097869-How-to-use-the-Meal-Planner"),
      collaboration: partial("Members can share and view a diary, and meal plans can include shared meals; collaborative household plan/list editing is not established.", "https://support.myfitnesspal.com/hc/en-us/articles/34889191368077-The-difference-between-Free-Premium-and-Premium"),
      "budget-basket": { ...unknown, note: "Grocery list handoff is documented in limited regions, but price comparison or budget-led basket planning is not established in the sources reviewed.", href: "https://support.myfitnesspal.com/hc/en-us/articles/34603055097869-How-to-use-the-Meal-Planner" },
      "meal-nutrition": yes("Nutrition is calculated from recipe ingredients and servings; diary and Premium dashboards expose nutrient and meal macro details.", "https://support.myfitnesspal.com/hc/en-us/articles/360032271452-How-to-create-and-find-your-recipes"),
      "nutrition-uplift": partial("Premium+ offers food and macro insights, but suggestions to add nutrient-rich ingredients to a meal are not established.", "https://support.myfitnesspal.com/hc/en-us/articles/360032625951-MyFitnessPal-Premium-features"),
      "week-nutrition": yes("Weekly Digest reports seven days of logged calories, food groups and habits; Progress Overview adds weekly macro patterns in supported regions/devices.", "https://support.myfitnesspal.com/hc/en-us/articles/360032622591-How-to-read-and-manage-your-Weekly-Digest"),
      "weekly-food-explorer": partial("Weekly Digest includes food-group insights and frequently logged foods; a linked nutrient explorer for the week is not established.", "https://support.myfitnesspal.com/hc/en-us/articles/360032622591-How-to-read-and-manage-your-Weekly-Digest"),
      "food-diary": yes("Today/Diary logs food, meals, exercise and related daily nutrition.", "https://support.myfitnesspal.com/hc/en-us/articles/39985611667341-Your-Today-tab"),
      "photo-diary": yes("Premium Meal Scan suggests foods from a photo, with the user able to correct and confirm entries before logging.", "https://support.myfitnesspal.com/hc/en-us/articles/360045761612-How-to-use-the-Meal-Scanner"),
      weight: yes("Weight and additional measurements can be recorded and reviewed over time.", "https://support.myfitnesspal.com/hc/en-us/articles/360032624431-How-to-record-your-weight-and-other-measurements"),
      "mood-energy": unknown,
      barcode: yes("Premium includes packaged-food barcode scanning; feature availability can vary by device, country or language.", "https://support.myfitnesspal.com/hc/en-us/articles/360032625951-MyFitnessPal-Premium-features"),
      "offline-scan": { ...unknown, note: "Offline diary edits can sync later, but offline barcode lookup is not established by the sources reviewed.", href: "https://support.myfitnesspal.com/hc/en-us/articles/360032622851-Can-I-access-MyFitnessPal-when-I-don-t-have-an-internet-connection" },
      "pantry-recipes": partial("Meal Planner can check off pantry items before shopping; finding recipes from current pantry stock is not established.", "https://support.myfitnesspal.com/hc/en-us/articles/34603055097869-How-to-use-the-Meal-Planner"),
      "pantry-visual": unknown,
      "pantry-sync": unknown,
      "ai-tailor": { ...unknown, note: "Plans are personalized to goals and preferences, but the sources reviewed do not identify AI as the method or establish AI recipe tailoring.", href: "https://support.myfitnesspal.com/hc/en-us/articles/34603055097869-How-to-use-the-Meal-Planner" },
      "guided-cook": unknown,
    },
  },
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
  {
    id: "yuka",
    name: "Yuka",
    href: "https://yuka.io/en/app/",
    broad: "Packaged-food scanning, product scores and alternatives",
    topics: {
      family: unknown,
      "eater-profiles": unknown,
      "allergen-preferences": partial("Premium alerts cover a limited set of dietary preferences and product ingredients; Yuka says it does not assess traces and users must check the package label.", "https://help.yuka.io/l/en/article/qzr8gkygvp-food-preferences"),
      "meal-adapt": unknown,
      "meal-create": unknown,
      "meal-import": unknown,
      "social-import": unknown,
      "meal-scan": unknown,
      "plan-create": unknown,
      "plan-import": unknown,
      "plan-scan": unknown,
      "plan-templates": unknown,
      shopping: unknown,
      collaboration: unknown,
      "budget-basket": unknown,
      "meal-nutrition": partial("Yuka explains nutritional gauges and scores for individual packaged products; it does not establish analysis of a prepared meal.", "https://help.yuka.io/l/en/article/yhzlhb4j1o-untitled-article-en"),
      "nutrition-uplift": partial("When a scanned packaged product scores poorly, Yuka suggests similar products with a higher score; it does not establish adding nutritious ingredients to a meal.", "https://help.yuka.io/l/en/article/s71arvkw6u-selection-recommendations"),
      "week-nutrition": unknown,
      "weekly-food-explorer": partial("Scan history lets users revisit product analyses; it is not documented as an exploration of foods consumed in a selected week.", "https://yuka.io/en/app/"),
      "food-diary": unknown,
      "photo-diary": unknown,
      weight: unknown,
      "mood-energy": unknown,
      barcode: yes("Scan packaged-food barcodes to view a product score, nutritional details and similar higher-rated alternatives.", "https://yuka.io/en/app/"),
      "offline-scan": partial("Premium offline scanning works for only the 100,000 most frequently scanned food/cosmetic products, not the whole database.", "https://help.yuka.io/l/en/article/ur4x5k32qg-database-in-offline-mode"),
      "pantry-recipes": unknown,
      "pantry-visual": unknown,
      "pantry-sync": unknown,
      "ai-tailor": unknown,
      "guided-cook": unknown,
    },
  },
  { id: "mynetdiary", name: "MyNetDiary", href: "https://www.mynetdiary.com/help/logging-food/meal-planner", broad: "Seven-day planning, food and nutrient logging, and grocery lists", topics: {
    family: reviewed({ ...unknown, note: "Family Sharing covers an eligible iOS Premium subscription. The reviewed sources do not establish one shared household meal plan." }, "https://mynetdiary.com/help/plans-billing-and-subscriptions/family-sharing-of-mynetdiary-subscriptions"),
    "eater-profiles": reviewed(unknown, "https://mynetdiary.com/help/plans-billing-and-subscriptions/family-sharing-of-mynetdiary-subscriptions"),
    "allergen-preferences": reviewed(partial("Premium Plus meal suggestions let a person enter foods to avoid, including allergens; reviewed sources do not establish safety screening or separate restrictions for each eater.", "https://www.mynetdiary.com/help/ai-features/ai-suggest-meals-premium-plus-feature"), "https://www.mynetdiary.com/help/ai-features/ai-suggest-meals-premium-plus-feature"),
    "meal-adapt": reviewed(partial("Premium Plus can suggest meals around one person's preferences and foods to avoid; per-eater adaptations within a shared family meal are not established.", "https://www.mynetdiary.com/help/ai-features/ai-suggest-meals-premium-plus-feature"), "https://www.mynetdiary.com/help/ai-features/ai-suggest-meals-premium-plus-feature"),
    "meal-create": reviewed(yes("Create custom recipes and meals, including recipes from scratch or saved diary foods.", "https://www.mynetdiary.com/help/logging-food/creating-custom-recipes-and-custom-meals"), "https://www.mynetdiary.com/help/logging-food/creating-custom-recipes-and-custom-meals"),
    "meal-import": reviewed(partial("Premium imports supported recipe URLs or pasted recipe text; unsupported or inaccessible pages may need manual correction.", "https://www.mynetdiary.com/help/logging-food/importing-recipes-from-web-browser-and-recipe-apps"), "https://www.mynetdiary.com/help/logging-food/importing-recipes-from-web-browser-and-recipe-apps"),
    "social-import": reviewed({ ...unknown, note: "The importer accepts supported recipe URLs and pasted recipe text; importing recipes directly from social-media posts is not established." }, "https://www.mynetdiary.com/help/logging-food/importing-recipes-from-web-browser-and-recipe-apps"),
    "meal-scan": reviewed({ ...unknown, note: "Meal Scan identifies and logs food from a meal photo; recipe-image-to-recipe capture is not established." }, "https://www.mynetdiary.com/help/ai-features/meal-scan"),
    "plan-create": reviewed(yes("Premium Meal Planner builds seven-day plans, reviews weekly nutrients and macros, and can send planned foods to the list.", "https://www.mynetdiary.com/help/logging-food/meal-planner"), "https://www.mynetdiary.com/help/logging-food/meal-planner"),
    "plan-import": reviewed(unknown, "https://www.mynetdiary.com/help/logging-food/meal-planner"),
    "plan-scan": reviewed(unknown, "https://www.mynetdiary.com/help/logging-food/meal-planner"),
    "plan-templates": reviewed(yes("Save several meal plans and switch between them; Premium Menus also provide reusable seven-day meal sets.", "https://www.mynetdiary.com/help/logging-food/meal-planner"), "https://www.mynetdiary.com/help/logging-food/meal-planner"),
    shopping: reviewed(partial("A shopping list can be built from planned meals and recipes. MyNetDiary says lists do not sync between devices on the same account; the Meal Planner is Premium.", "https://www.mynetdiary.com/help/logging-food/shopping-list"), "https://www.mynetdiary.com/help/logging-food/shopping-list"),
    collaboration: reviewed(partial("Lists can be shared via message, email or print, but lists do not sync across devices under the same account; collaborative household editing is not established.", "https://www.mynetdiary.com/help/logging-food/shopping-list"), "https://www.mynetdiary.com/help/logging-food/shopping-list"),
    "budget-basket": reviewed(unknown, "https://www.mynetdiary.com/help/logging-food/shopping-list"),
    "meal-nutrition": reviewed(yes("Recipes and logged foods include nutrient information; the database tracks up to 108 nutrients per entry.", "https://www.mynetdiary.com/help/logging-food/"), "https://www.mynetdiary.com/help/logging-food/"),
    "nutrition-uplift": reviewed({ ...unknown, note: "Premium Plus can suggest meals around preferences and a calorie budget, but adding useful nutrients to an existing meal is not established." }, "https://www.mynetdiary.com/help/ai-features/ai-suggest-meals-premium-plus-feature"),
    "week-nutrition": reviewed(partial("The Premium planner shows nutrients and macros for the planned week, and weekly diary summaries are available; exact logged-week nutrient totals are not clear in the reviewed reports.", "https://www.mynetdiary.com/help/logging-food/meal-planner"), "https://www.mynetdiary.com/help/logging-food/meal-planner"),
    "weekly-food-explorer": reviewed(unknown, "https://www.mynetdiary.com/help/logging-food/how-do-i-download-my-log"),
    "food-diary": reviewed(yes("Food diary supports multiple logging methods and tracks up to 108 nutrients per entry.", "https://www.mynetdiary.com/help/logging-food/"), "https://www.mynetdiary.com/help/logging-food/"),
    "photo-diary": reviewed(partial("Premium Meal Scan estimates foods and portions from a meal photo; users review and correct results before logging.", "https://www.mynetdiary.com/help/ai-features/meal-scan"), "https://www.mynetdiary.com/help/ai-features/meal-scan"),
    weight: reviewed(yes("Weight tracking is included in the free feature set.", "https://www.mynetdiary.com/help/plans-billing-and-subscriptions/which-features-available-in-free-tier"), "https://www.mynetdiary.com/help/plans-billing-and-subscriptions/which-features-available-in-free-tier"),
    "mood-energy": reviewed(partial("Subscription custom trackers can record mood and other personal measures; a built-in energy or ability diary is not established.", "https://www.mynetdiary.com/help/health-tracking/more-body-measurements-and-custom-trackers"), "https://www.mynetdiary.com/help/health-tracking/more-body-measurements-and-custom-trackers"),
    barcode: reviewed(yes("Barcode food scanning is included in the free tier.", "https://www.mynetdiary.com/help/logging-food/"), "https://www.mynetdiary.com/help/logging-food/"),
    "offline-scan": reviewed(partial("Previously logged and saved foods are available offline, but new barcode lookups and full database search need a connection.", "https://www.mynetdiary.com/help/troubleshooting-and-known-issues/using-the-app-without-internet-connection"), "https://www.mynetdiary.com/help/troubleshooting-and-known-issues/using-the-app-without-internet-connection"),
    "pantry-recipes": reviewed(unknown, "https://www.mynetdiary.com/help/logging-food/meal-planner"),
    "pantry-visual": reviewed(unknown, "https://www.mynetdiary.com/help/logging-food/meal-planner"),
    "pantry-sync": reviewed(unknown, "https://www.mynetdiary.com/help/logging-food/shopping-list"),
    "ai-tailor": reviewed(partial("Premium Plus AI Coach uses a person's goals, diet plan, food logs and weigh-ins from the last seven days; AI meal suggestions can use preferences and foods to avoid. Suggestions need review.", "https://www.mynetdiary.com/help/ai-features/ai-coach-premium-plus-feature"), "https://www.mynetdiary.com/help/ai-features/ai-coach-premium-plus-feature"),
    "guided-cook": reviewed(unknown, "https://www.mynetdiary.com/help/logging-food/creating-custom-recipes-and-custom-meals"),
  } },
  { id: "realplans", name: "Real Plans", href: "https://realplans.com/features/", broad: "Family-size and restriction-aware planning", topics: {
    family: reviewed(yes("Weekly plans are personalized to family size and household preferences; this is a shared plan, not documented separate eater accounts.", "https://realplans.com/features/"), "https://realplans.com/features/"),
    "eater-profiles": reviewed({ ...unknown, note: "Family-size and household diet settings are described, but separate saved profiles and restrictions for each eater are not established.", href: "https://realplans.com/faqs/" }, "https://realplans.com/faqs/"),
    "allergen-preferences": reviewed(yes("Food groups and individual ingredients can be excluded from the household plan, including foods identified as allergies; separate per-eater safety checks are not established.", "https://realplans.com/faqs/"), "https://realplans.com/faqs/"),
    "meal-adapt": reviewed(partial("Servings, food exclusions and household preferences can shape the shared plan; distinct versions of a meal for individual eaters are not established.", "https://realplans.com/features/"), "https://realplans.com/features/"),
    "meal-create": reviewed(yes("Users can add their own recipes and edit ingredients, proportions and instructions.", "https://realplans.com/features/"), "https://realplans.com/features/"),
    "meal-import": reviewed(yes("Import a recipe from a webpage URL or manually enter a non-web recipe, then review ingredients and quantities before saving.", "https://support.realplans.com/hc/en-us/articles/203446304-How-to-Import-a-Recipe"), "https://support.realplans.com/hc/en-us/articles/203446304-How-to-Import-a-Recipe"),
    "social-import": reviewed(partial("Web recipe URLs can be imported; direct import from social posts or social apps is not established.", "https://support.realplans.com/hc/en-us/articles/203446304-How-to-Import-a-Recipe"), "https://support.realplans.com/hc/en-us/articles/203446304-How-to-Import-a-Recipe"),
    "meal-scan": reviewed(partial("The recipe import guide lists image file formats, but it does not establish that camera scanning or OCR extracts a recipe from an image.", "https://support.realplans.com/hc/en-us/articles/203446304-How-to-Import-a-Recipe"), "https://support.realplans.com/hc/en-us/articles/203446304-How-to-Import-a-Recipe"),
    "plan-create": reviewed(yes("Build a weekly plan automatically, choose meals yourself, start from a blank calendar or plan with nutrition goals; users can swap recipes and schedule leftovers.", "https://realplans.com/"), "https://realplans.com/"),
    "plan-import": reviewed({ ...unknown, note: "The reviewed planning and support sources explain building plans in Real Plans but do not establish importing an existing plan.", href: "https://realplans.com/features/" }, "https://realplans.com/features/"),
    "plan-scan": reviewed({ ...unknown, note: "Paper meal-plan scanning or OCR import is not reported in the reviewed planning and support sources.", href: "https://realplans.com/features/" }, "https://realplans.com/features/"),
    "plan-templates": reviewed({ ...unknown, note: "Users can configure a recurring weekly schedule, but saving and reusing a complete plan as a template is not established.", href: "https://realplans.com/faqs/" }, "https://realplans.com/faqs/"),
    shopping: reviewed(yes("Weekly plans create an organized shopping list; users can mark items already in the kitchen, add extras and schedule recurring staples. Instacart is available where supported.", "https://realplans.com/features/"), "https://realplans.com/features/"),
    collaboration: reviewed({ ...unknown, note: "Plans and lists are available across the account's devices; shared editing by separate household accounts is not established.", href: "https://realplans.com/features/" }, "https://realplans.com/features/"),
    "budget-basket": reviewed(partial("Recipe search can filter by cost and budget tags; grocery lists can hand off to Instacart where supported. A total weekly budget or cross-store price comparison is not established.", "https://realplans.com/faqs/"), "https://realplans.com/faqs/"),
    "meal-nutrition": reviewed(partial("Recipe cards include nutrition information; macro tracking and nutrition data require a separate subscription, according to current plan details.", "https://realplans.com/"), "https://realplans.com/"),
    "nutrition-uplift": reviewed({ ...unknown, note: "Nutrition information and macro-driven planning are documented, but suggestions to add beneficial foods or nutrients to an existing meal are not established.", href: "https://realplans.com/features/" }, "https://realplans.com/features/"),
    "week-nutrition": reviewed(partial("The Daily Macro Tracker tallies what and how much was eaten and shows daily totals; actual logged nutrient totals across a full week are not established.", "https://realplans.com/macro-tracking/"), "https://realplans.com/macro-tracking/"),
    "weekly-food-explorer": reviewed({ ...unknown, note: "Recipe nutrition and daily macro totals are documented, but browsing foods and their linked nutrients from a selected diary week is not established.", href: "https://realplans.com/macro-tracking/" }, "https://realplans.com/macro-tracking/"),
    "food-diary": reviewed(partial("The separately subscribed Daily Macro Tracker records portions and extra snacks and tallies intake; a broader searchable food diary is not established.", "https://realplans.com/macro-tracking/"), "https://realplans.com/macro-tracking/"),
    "photo-diary": reviewed({ ...unknown, note: "Photo-based meal recognition or diary logging is not reported in the reviewed sources.", href: "https://realplans.com/features/" }, "https://realplans.com/features/"),
    weight: reviewed({ ...unknown, note: "Weight can inform macro goals, but logging weigh-ins as diary entries is not established.", href: "https://realplans.com/macro-tracking/" }, "https://realplans.com/macro-tracking/"),
    "mood-energy": reviewed({ ...unknown, note: "Mood, energy or ability tracking is not reported in the reviewed sources.", href: "https://realplans.com/features/" }, "https://realplans.com/features/"),
    barcode: reviewed({ ...unknown, note: "Barcode scanning packaged foods is not reported in the reviewed sources.", href: "https://realplans.com/features/" }, "https://realplans.com/features/"),
    "offline-scan": reviewed({ ...unknown, note: "Offline food or barcode lookup is not reported in the reviewed sources.", href: "https://realplans.com/features/" }, "https://realplans.com/features/"),
    "pantry-recipes": reviewed(partial("The shopping list can mark items already in the kitchen and the app has a pantry feature; finding recipes from a live inventory is not clearly established.", "https://realplans.com/"), "https://realplans.com/"),
    "pantry-visual": reviewed({ ...unknown, note: "Camera recognition of pantry items is not reported in the reviewed sources.", href: "https://realplans.com/features/" }, "https://realplans.com/features/"),
    "pantry-sync": reviewed(partial("Users can track what is already in the kitchen via list/pantry features; automatic inventory updates from shopping or cooking are not established.", "https://realplans.com/features/"), "https://realplans.com/features/"),
    "ai-tailor": reviewed({ ...unknown, note: "Plans are personalized to declared household settings and nutrition goals, but the reviewed sources do not identify AI-driven recipe tailoring.", href: "https://realplans.com/" }, "https://realplans.com/"),
    "guided-cook": reviewed(yes("Cooking mode keeps ingredients available and tracks the current recipe step; recipes can also be printed.", "https://realplans.com/"), "https://realplans.com/"),
  } },
  { id: "lifesum", name: "Lifesum", href: "https://lifesum.com/features", broad: "Personal nutrition tracking, multi-day programs and AI-assisted logging", topics: {
    family: reviewed({ ...unknown, note: "Programs and plans are described for an individual's goals; shared household meal planning is not established.", href: "https://lifesum.com/features" }, "https://lifesum.com/features"),
    "eater-profiles": reviewed({ ...unknown, note: "The reviewed sources describe individual goal and diet preferences, but not separate profiles and restrictions for each household eater.", href: "https://lifesum.com/features" }, "https://lifesum.com/features"),
    "allergen-preferences": reviewed(partial("Recipes may be personalized around an individual's allergies and diet; per-eater allergy profiles or safety screening are not established.", "https://lifesum.com/features"), "https://lifesum.com/features"),
    "meal-adapt": reviewed({ ...unknown, note: "Recipe personalization to an individual's goal, diet and allergies is described; shared meals with eater-specific adaptations are not established.", href: "https://lifesum.com/features" }, "https://lifesum.com/features"),
    "meal-create": reviewed(yes("Users can create and edit their own food items, recipes and meals in Favorites; creating personal entries is documented for Android and iOS help.", "https://help.lifesum.com/en/category/food-tracking-1rthkrv/"), "https://help.lifesum.com/en/category/food-tracking-1rthkrv/"),
    "meal-import": reviewed({ ...unknown, note: "The reviewed sources document Lifesum's own recipes and user-created recipes, but not importing a recipe from a URL or pasted text.", href: "https://lifesum.com/features" }, "https://lifesum.com/features"),
    "social-import": reviewed({ ...unknown, note: "Direct recipe import from social posts or apps is not reported in the reviewed sources.", href: "https://help.lifesum.com/en/category/food-tracking-1rthkrv/" }, "https://help.lifesum.com/en/category/food-tracking-1rthkrv/"),
    "meal-scan": reviewed({ ...unknown, note: "AI photo recognition is documented for logging food eaten, not scanning a recipe image into the recipe collection.", href: "https://help.lifesum.com/en/article/ai-tracking-how-does-it-work-15sw7rk/" }, "https://help.lifesum.com/en/article/ai-tracking-how-does-it-work-15sw7rk/"),
    "plan-create": reviewed(partial("Premium offers fixed 7–21 day plans/programs with a meal planner and adjustable meal choices; an open-ended household weekly planner is not established.", "https://help.lifesum.com/en/article/list-of-all-available-meal-plans-how-to-get-started-1q8a3og/"), "https://help.lifesum.com/en/article/list-of-all-available-meal-plans-how-to-get-started-1q8a3og/"),
    "plan-import": reviewed({ ...unknown, note: "Importing an existing meal plan from another app or document is not reported in the reviewed sources.", href: "https://lifesum.com/features" }, "https://lifesum.com/features"),
    "plan-scan": reviewed({ ...unknown, note: "Scanning a paper meal plan into the app is not reported in the reviewed sources.", href: "https://lifesum.com/features" }, "https://lifesum.com/features"),
    "plan-templates": reviewed(partial("Lifesum offers preplanned programs and allows a meal plan to be restarted; saving a user's own week as a reusable template is not established.", "https://help.lifesum.com/en/article/list-of-all-available-meal-plans-how-to-get-started-1q8a3og/"), "https://help.lifesum.com/en/article/list-of-all-available-meal-plans-how-to-get-started-1q8a3og/"),
    shopping: reviewed(yes("Meal Plans include a digital list that mirrors selected plan recipes and ingredients; lists can be shared as plain text to other apps, not documented as live multi-user sync.", "https://help.lifesum.com/en/article/shopping-list-8mm22c/"), "https://help.lifesum.com/en/article/shopping-list-8mm22c/"),
    collaboration: reviewed(partial("A shopping list can be exported/shared to messages, notes or other compatible apps; shared editing or synchronized household plans are not established.", "https://help.lifesum.com/en/article/shopping-list-8mm22c/"), "https://help.lifesum.com/en/article/shopping-list-8mm22c/"),
    "budget-basket": reviewed({ ...unknown, note: "The reviewed sources describe digital shopping lists but do not establish grocery cost estimates, budgets or retailer basket handoff.", href: "https://help.lifesum.com/en/article/shopping-list-8mm22c/" }, "https://help.lifesum.com/en/article/shopping-list-8mm22c/"),
    "meal-nutrition": reviewed(yes("Recipes show detailed nutrition; food logging tracks calories and macros. The reviewed sources do not pin down the subscription tier for every nutrition view.", "https://lifesum.com/features"), "https://lifesum.com/features"),
    "nutrition-uplift": reviewed(partial("Lifesum provides food/meal ratings, nutrient guidance and personalized feedback to help users make healthier choices; a specific suggestion to add nutrients to a selected meal is not established.", "https://lifesum.com/"), "https://lifesum.com/"),
    "week-nutrition": reviewed(partial("A weekly Life Score reflects what went well and where to improve, while tracked intake has detailed daily nutrient totals; actual nutrient totals summed across a selected week are not established.", "https://lifesum.com/features"), "https://lifesum.com/features"),
    "weekly-food-explorer": reviewed({ ...unknown, note: "Weekly Life Score and nutrition tracking are described, but exploring specific logged foods and their linked nutrients from a selected week is not established.", href: "https://lifesum.com/features" }, "https://lifesum.com/features"),
    "food-diary": reviewed(yes("Diary supports logging foods and meals by search, barcode, AI photo, voice or text; AI Tracking is a Premium feature.", "https://help.lifesum.com/en/article/ai-tracking-how-does-it-work-15sw7rk/"), "https://help.lifesum.com/en/article/ai-tracking-how-does-it-work-15sw7rk/"),
    "photo-diary": reviewed(partial("Premium AI Tracking recognizes a photographed meal and estimates its foods/portions; users are advised to review and correct results because recognition and portion estimates can vary.", "https://help.lifesum.com/en/article/ai-tracking-how-does-it-work-15sw7rk/"), "https://help.lifesum.com/en/article/ai-tracking-how-does-it-work-15sw7rk/"),
    weight: reviewed(yes("Weight and body measurements are tracked, and weight can sync with supported partner apps.", "https://lifesum.com/features"), "https://lifesum.com/features"),
    "mood-energy": reviewed(partial("Lifesum describes goals related to mood, sleep, focus and energy and offers weekly feedback; a diary for recording daily mood/energy or ability is not established.", "https://lifesum.com/"), "https://lifesum.com/"),
    barcode: reviewed(yes("Barcode scanning finds food items to add to the diary; product comparison can scan two items and compare nutritional values.", "https://help.lifesum.com/en/category/food-tracking-1rthkrv/"), "https://help.lifesum.com/en/category/food-tracking-1rthkrv/"),
    "offline-scan": reviewed({ ...unknown, note: "The reviewed sources do not establish barcode lookup against an offline food database.", href: "https://help.lifesum.com/en/category/food-tracking-1rthkrv/" }, "https://help.lifesum.com/en/category/food-tracking-1rthkrv/"),
    "pantry-recipes": reviewed({ ...unknown, note: "The reviewed sources do not establish recipe discovery from a live pantry inventory.", href: "https://lifesum.com/features" }, "https://lifesum.com/features"),
    "pantry-visual": reviewed({ ...unknown, note: "AI camera recognition is described for prepared-food diary logging, but pantry-item recognition into an inventory is not reported.", href: "https://help.lifesum.com/en/article/ai-tracking-how-does-it-work-15sw7rk/" }, "https://help.lifesum.com/en/article/ai-tracking-how-does-it-work-15sw7rk/"),
    "pantry-sync": reviewed({ ...unknown, note: "Pantry stock synchronization with purchases or cooking is not reported in the reviewed sources.", href: "https://help.lifesum.com/en/article/shopping-list-8mm22c/" }, "https://help.lifesum.com/en/article/shopping-list-8mm22c/"),
    "ai-tailor": reviewed(partial("Lifesum personalizes recipes/programs to goals, diet and allergies and offers AI-assisted food logging; AI-personalized recipe adaptations are not established.", "https://lifesum.com/features"), "https://lifesum.com/features"),
    "guided-cook": reviewed({ ...unknown, note: "The reviewed sources describe meal plans and recipes but do not establish interactive step-by-step cooking mode.", href: "https://lifesum.com/features" }, "https://lifesum.com/features"),
  } },
  { id: "yazio", name: "Yazio", href: "https://help.yazio.com/hc/en-us/articles/208847005-How-does-Yazio-Pro-support-my-goals", broad: "Personal nutrition diary, goal-led meal plans and coaching tips", topics: {
    family: reviewed({ ...unknown, note: "The reviewed sources describe personal goals and diary use; a shared household meal plan is not established.", href: "https://help.yazio.com/hc/en-us/articles/11804776635281-Tutorial-of-the-Yazio-app" }, "https://help.yazio.com/hc/en-us/articles/11804776635281-Tutorial-of-the-Yazio-app"),
    "eater-profiles": reviewed({ ...unknown, note: "Individual goals/settings are documented, but separate saved eater profiles and restrictions are not established.", href: "https://help.yazio.com/hc/en-us/articles/11804776635281-Tutorial-of-the-Yazio-app" }, "https://help.yazio.com/hc/en-us/articles/11804776635281-Tutorial-of-the-Yazio-app"),
    "allergen-preferences": reviewed(partial("Pro recipe filters include diet options such as lactose-free; per-eater allergy profiles or safety screening are not established.", "https://help.yazio.com/hc/en-us/articles/12294574525201-How-can-I-apply-a-filter-or-search-through-the-Recipes-tab"), "https://help.yazio.com/hc/en-us/articles/12294574525201-How-can-I-apply-a-filter-or-search-through-the-Recipes-tab"),
    "meal-adapt": reviewed({ ...unknown, note: "Recipes can be filtered for individual diets/preferences, but shared meals with eater-specific adaptations are not established.", href: "https://help.yazio.com/hc/en-us/articles/12294574525201-How-can-I-apply-a-filter-or-search-through-the-Recipes-tab" }, "https://help.yazio.com/hc/en-us/articles/12294574525201-How-can-I-apply-a-filter-or-search-through-the-Recipes-tab"),
    "meal-create": reviewed(yes("Users can create meals and multi-serving recipes with ingredients, portions, preparation steps and nutrition values. Yazio currently flags an issue with this feature in its help article.", "https://help.yazio.com/hc/en-us/articles/4406610369297-How-can-I-create-my-own-recipes-in-Yazio-and-access-edit-them"), "https://help.yazio.com/hc/en-us/articles/4406610369297-How-can-I-create-my-own-recipes-in-Yazio-and-access-edit-them"),
    "meal-import": reviewed({ ...unknown, note: "The reviewed sources document creating recipes from entered ingredients and choosing from Yazio's database; URL or pasted-text import is not established.", href: "https://help.yazio.com/hc/en-us/articles/4406610369297-How-can-I-create-my-own-recipes-in-Yazio-and-access-edit-them" }, "https://help.yazio.com/hc/en-us/articles/4406610369297-How-can-I-create-my-own-recipes-in-Yazio-and-access-edit-them"),
    "social-import": reviewed({ ...unknown, note: "Direct recipe import from social posts or apps is not reported in the reviewed sources.", href: "https://help.yazio.com/hc/en-us/articles/208847005-How-does-Yazio-Pro-support-my-goals" }, "https://help.yazio.com/hc/en-us/articles/208847005-How-does-Yazio-Pro-support-my-goals"),
    "meal-scan": reviewed({ ...unknown, note: "AI photo recognition logs prepared food eaten; scanning a recipe image into a reusable recipe is not established.", href: "https://help.yazio.com/hc/en-us/articles/39137901903889-What-is-the-AI-Calorie-Tracking-Feature-and-how-does-it-work" }, "https://help.yazio.com/hc/en-us/articles/39137901903889-What-is-the-AI-Calorie-Tracking-Feature-and-how-does-it-work"),
    "plan-create": reviewed(yes("Pro users can plan meals in advance and use the planner with recipe/database content; advertised future meal planning is not explicitly limited to a fixed weekly horizon.", "https://help.yazio.com/hc/en-us/articles/208847005-How-does-Yazio-Pro-support-my-goals"), "https://help.yazio.com/hc/en-us/articles/208847005-How-does-Yazio-Pro-support-my-goals"),
    "plan-import": reviewed({ ...unknown, note: "Importing an existing plan from an outside app or document is not reported in the reviewed sources.", href: "https://help.yazio.com/hc/en-us/articles/208847005-How-does-Yazio-Pro-support-my-goals" }, "https://help.yazio.com/hc/en-us/articles/208847005-How-does-Yazio-Pro-support-my-goals"),
    "plan-scan": reviewed({ ...unknown, note: "Paper meal-plan scanning/OCR is not reported in the reviewed sources.", href: "https://help.yazio.com/hc/en-us/articles/208847005-How-does-Yazio-Pro-support-my-goals" }, "https://help.yazio.com/hc/en-us/articles/208847005-How-does-Yazio-Pro-support-my-goals"),
    "plan-templates": reviewed(partial("A scanned AI meal can be saved as a reusable meal template; reusing an entire weekly plan as a template is not established.", "https://help.yazio.com/hc/en-us/articles/39137901903889-What-is-the-AI-Calorie-Tracking-Feature-and-how-does-it-work"), "https://help.yazio.com/hc/en-us/articles/39137901903889-What-is-the-AI-Calorie-Tracking-Feature-and-how-does-it-work"),
    shopping: reviewed(yes("Pro provides unlimited grocery lists and lets users add recipes directly; list creation is described for shopping, not retailer basket checkout.", "https://help.yazio.com/hc/en-us/articles/208847005-How-does-Yazio-Pro-support-my-goals"), "https://help.yazio.com/hc/en-us/articles/208847005-How-does-Yazio-Pro-support-my-goals"),
    collaboration: reviewed({ ...unknown, note: "Grocery lists are documented, but live list sharing or synchronized collaboration with household accounts is not established.", href: "https://help.yazio.com/hc/en-us/articles/208847005-How-does-Yazio-Pro-support-my-goals" }, "https://help.yazio.com/hc/en-us/articles/208847005-How-does-Yazio-Pro-support-my-goals"),
    "budget-basket": reviewed({ ...unknown, note: "Recipe-based grocery lists are documented; grocery price estimates, basket budgets and retailer handoff are not established.", href: "https://help.yazio.com/hc/en-us/articles/208847005-How-does-Yazio-Pro-support-my-goals" }, "https://help.yazio.com/hc/en-us/articles/208847005-How-does-Yazio-Pro-support-my-goals"),
    "meal-nutrition": reviewed(yes("Pro provides advanced nutrient breakdowns for foods, meals and recipes, including fiber, sugar, salt, vitamins and minerals.", "https://help.yazio.com/hc/en-us/articles/208847005-How-does-Yazio-Pro-support-my-goals"), "https://help.yazio.com/hc/en-us/articles/208847005-How-does-Yazio-Pro-support-my-goals"),
    "nutrition-uplift": reviewed(yes("Meal Tips after logging can suggest adding protein, fiber-rich foods, fruit/vegetables or balancing the meal; tips adapt to goals, preferences and eating patterns.", "https://help.yazio.com/hc/en-us/articles/47427044688401-What-are-Meal-Tips"), "https://help.yazio.com/hc/en-us/articles/47427044688401-What-are-Meal-Tips"),
    "week-nutrition": reviewed(yes("Pro analysis provides tracked nutrition data across past days, weeks and months; weekly/monthly analysis is Pro-only.", "https://help.yazio.com/hc/en-us/articles/11804776635281-Tutorial-of-the-Yazio-app"), "https://help.yazio.com/hc/en-us/articles/11804776635281-Tutorial-of-the-Yazio-app"),
    "weekly-food-explorer": reviewed(partial("Pro analysis provides weekly nutrition statistics, but exploring individual foods logged during the week and their linked nutrients is not established.", "https://help.yazio.com/hc/en-us/articles/11804776635281-Tutorial-of-the-Yazio-app"), "https://help.yazio.com/hc/en-us/articles/11804776635281-Tutorial-of-the-Yazio-app"),
    "food-diary": reviewed(yes("The diary records foods/meals plus activity, water, body weight, notes, and (Pro) mood/symptoms/reflections.", "https://help.yazio.com/hc/en-us/articles/11804776635281-Tutorial-of-the-Yazio-app"), "https://help.yazio.com/hc/en-us/articles/11804776635281-Tutorial-of-the-Yazio-app"),
    "photo-diary": reviewed(partial("Pro AI food recognition estimates ingredients, portions and nutrition from a meal photo; results are rough estimates and users should review/edit them.", "https://help.yazio.com/hc/en-us/articles/39137901903889-What-is-the-AI-Calorie-Tracking-Feature-and-how-does-it-work"), "https://help.yazio.com/hc/en-us/articles/39137901903889-What-is-the-AI-Calorie-Tracking-Feature-and-how-does-it-work"),
    weight: reviewed(yes("Weight and other body measurements can be logged in the Diary; Yazio offers daily/weekly weigh-in reminders and progress analysis.", "https://help.yazio.com/hc/en-us/articles/360002401337-How-do-I-add-body-measurements-to-track-my-progress"), "https://help.yazio.com/hc/en-us/articles/360002401337-How-do-I-add-body-measurements-to-track-my-progress"),
    "mood-energy": reviewed(partial("Pro Diary can record mood, symptoms and daily reflections; a specific energy/ability measure is not established.", "https://help.yazio.com/hc/en-us/articles/208847005-How-does-Yazio-Pro-support-my-goals"), "https://help.yazio.com/hc/en-us/articles/208847005-How-does-Yazio-Pro-support-my-goals"),
    barcode: reviewed(yes("The barcode scanner can identify food and add it to the Diary; a Pro feature compares nutritional values of two products.", "https://help.yazio.com/hc/en-us/articles/208847005-How-does-Yazio-Pro-support-my-goals"), "https://help.yazio.com/hc/en-us/articles/208847005-How-does-Yazio-Pro-support-my-goals"),
    "offline-scan": reviewed({ ...unknown, note: "Offline packaged-food barcode lookup is not established in reviewed help sources.", href: "https://help.yazio.com/hc/en-us/articles/208847005-How-does-Yazio-Pro-support-my-goals" }, "https://help.yazio.com/hc/en-us/articles/208847005-How-does-Yazio-Pro-support-my-goals"),
    "pantry-recipes": reviewed({ ...unknown, note: "Recipe discovery based on live household pantry stock is not reported in the reviewed sources.", href: "https://help.yazio.com/hc/en-us/articles/12294574525201-How-can-I-apply-a-filter-or-search-through-the-Recipes-tab" }, "https://help.yazio.com/hc/en-us/articles/12294574525201-How-can-I-apply-a-filter-or-search-through-the-Recipes-tab"),
    "pantry-visual": reviewed({ ...unknown, note: "Photo recognition is documented for prepared meals; scanning pantry items into inventory is not established.", href: "https://help.yazio.com/hc/en-us/articles/39137901903889-What-is-the-AI-Calorie-Tracking-Feature-and-how-does-it-work" }, "https://help.yazio.com/hc/en-us/articles/39137901903889-What-is-the-AI-Calorie-Tracking-Feature-and-how-does-it-work"),
    "pantry-sync": reviewed({ ...unknown, note: "Automatic pantry stock updates after grocery shopping or cooking are not reported in the reviewed sources.", href: "https://help.yazio.com/hc/en-us/articles/208847005-How-does-Yazio-Pro-support-my-goals" }, "https://help.yazio.com/hc/en-us/articles/208847005-How-does-Yazio-Pro-support-my-goals"),
    "ai-tailor": reviewed(partial("AI supports meal-photo logging; personalized programs, food ratings and Meal Tips use goals/preferences/logs, but AI-generated recipe adaptations are not established.", "https://help.yazio.com/hc/en-us/articles/208847005-How-does-Yazio-Pro-support-my-goals"), "https://help.yazio.com/hc/en-us/articles/208847005-How-does-Yazio-Pro-support-my-goals"),
    "guided-cook": reviewed({ ...unknown, note: "Recipes may include preparation steps for reference, but interactive step-by-step cook mode is not established.", href: "https://help.yazio.com/hc/en-us/articles/4406610369297-How-can-I-create-my-own-recipes-in-Yazio-and-access-edit-them" }, "https://help.yazio.com/hc/en-us/articles/4406610369297-How-can-I-create-my-own-recipes-in-Yazio-and-access-edit-them"),
  } },
  { id: "carbmanager", name: "Carb Manager", href: "https://help.carbmanager.com/docs/meal-plan-overview", broad: "Macro-focused plans, recipe discovery and detailed food logging", topics: {
    family: reviewed(partial("Shopping lists can scale ingredients to a specified number of people; distinct shared household planning and eater profiles are not established.", "https://help.carbmanager.com/docs/generate-and-print-shopping-lists"), "https://help.carbmanager.com/docs/generate-and-print-shopping-lists"),
    "eater-profiles": reviewed({ ...unknown, note: "Meal plans can use a person's dietary preferences/intolerances; separate saved profiles for each household eater are not established.", href: "https://help.carbmanager.com/docs/meal-plan-overview" }, "https://help.carbmanager.com/docs/meal-plan-overview"),
    "allergen-preferences": reviewed(partial("Generated meal plans can use food intolerances/aversions and recipe filters include diet restrictions; per-eater profiles or allergen safety screening are not established.", "https://help.carbmanager.com/docs/meal-plan-overview"), "https://help.carbmanager.com/docs/meal-plan-overview"),
    "meal-adapt": reviewed({ ...unknown, note: "Plans can scale servings or fit macro goals, but adapting one shared meal separately for different eaters is not established.", href: "https://help.carbmanager.com/docs/generate-and-print-shopping-lists" }, "https://help.carbmanager.com/docs/generate-and-print-shopping-lists"),
    "meal-create": reviewed(yes("Users can create custom meals and recipes from ingredients, portion information and preparation steps; recipe instructions and nutrition are saved.", "https://help.carbmanager.com/docs/create-custom-recipes"), "https://help.carbmanager.com/docs/create-custom-recipes"),
    "meal-import": reviewed(partial("Premium imports recipe URLs from some websites; import success depends on source recipe quality. Custom recipes can also be entered manually.", "https://help.carbmanager.com/docs/en/import-recipes"), "https://help.carbmanager.com/docs/en/import-recipes"),
    "social-import": reviewed({ ...unknown, note: "Web recipe URL import is documented, but direct social-media post/app import is not established.", href: "https://help.carbmanager.com/docs/en/import-recipes" }, "https://help.carbmanager.com/docs/en/import-recipes"),
    "meal-scan": reviewed(partial("Users with the Carb Manager Keto Diet Cookbook can scan recipe QR codes into My Foods; scanning a recipe photo or paper recipe with OCR is not established.", "https://help.carbmanager.com/docs/en/log-foods-by-scanning-barcodes-and-snapping-pictures"), "https://help.carbmanager.com/docs/en/log-foods-by-scanning-barcodes-and-snapping-pictures"),
    "plan-create": reviewed(yes("Premium supports generated, custom and curated plans; custom plans can cover up to 30 days, and users can schedule a start date.", "https://help.carbmanager.com/docs/meal-plan-overview"), "https://help.carbmanager.com/docs/meal-plan-overview"),
    "plan-import": reviewed(partial("Users can copy curated Carb Manager plans to My Foods and edit them; importing an external plan or document is not established.", "https://help.carbmanager.com/docs/en/start-a-meal-plan"), "https://help.carbmanager.com/docs/en/start-a-meal-plan"),
    "plan-scan": reviewed({ ...unknown, note: "The cookbook QR scanner imports a recipe, not a paper meal plan; plan-image/OCR scanning is not reported.", href: "https://help.carbmanager.com/docs/en/log-foods-by-scanning-barcodes-and-snapping-pictures" }, "https://help.carbmanager.com/docs/en/log-foods-by-scanning-barcodes-and-snapping-pictures"),
    "plan-templates": reviewed(yes("Custom, generated and curated plans can be saved in My Foods, started later, copied and edited for reuse.", "https://help.carbmanager.com/docs/create-custom-meal-plans-1"), "https://help.carbmanager.com/docs/create-custom-meal-plans-1"),
    shopping: reviewed(yes("Premium builds a list from selected plan dates and can scale amounts to the number of people; users can edit, check off, print/download lists. Only one list is available at a time.", "https://help.carbmanager.com/docs/generate-and-print-shopping-lists"), "https://help.carbmanager.com/docs/generate-and-print-shopping-lists"),
    collaboration: reviewed(partial("Users can share daily logs and individual foods/recipes/meals with friends; collaborative household plans or live shared shopping-list editing are not established.", "https://help.carbmanager.com/docs/share-daily-logs-foods-recipes-and-meals"), "https://help.carbmanager.com/docs/share-daily-logs-foods-recipes-and-meals"),
    "budget-basket": reviewed({ ...unknown, note: "Printable/downloadable shopping lists are documented; cost estimates, budgets and retailer basket handoff are not established.", href: "https://help.carbmanager.com/docs/generate-and-print-shopping-lists" }, "https://help.carbmanager.com/docs/generate-and-print-shopping-lists"),
    "meal-nutrition": reviewed(yes("Nutrition is calculated for custom recipes; Pro provides detailed foods/meals/recipe nutrient breakdowns and macro targets.", "https://help.carbmanager.com/docs/create-custom-recipes"), "https://help.carbmanager.com/docs/create-custom-recipes"),
    "nutrition-uplift": reviewed(partial("Macro-scaled plans may suggest foods to add when a plan cannot meet macro goals; this is plan-level and does not establish general nutrient additions to an eaten meal.", "https://help.carbmanager.com/docs/en/start-a-meal-plan"), "https://help.carbmanager.com/docs/en/start-a-meal-plan"),
    "week-nutrition": reviewed(yes("Daily Log includes a My Week chart with consumed totals by day for carbs, protein, fat, calories and fiber; Pro offers further analyses/insights.", "https://help.carbmanager.com/docs/daily-log-overview"), "https://help.carbmanager.com/docs/daily-log-overview"),
    "weekly-food-explorer": reviewed(partial("Weekly totals and in-depth nutrient details are available, but browsing specific foods logged in a selected week and their linked nutrients is not established.", "https://help.carbmanager.com/docs/daily-log-overview"), "https://help.carbmanager.com/docs/daily-log-overview"),
    "food-diary": reviewed(yes("Daily Log records meals, snacks, supplements, water, steps, exercise and (Premium) glucose, ketone or insulin readings.", "https://help.carbmanager.com/docs/daily-log-overview"), "https://help.carbmanager.com/docs/daily-log-overview"),
    "photo-diary": reviewed(partial("Premium supports photo-based food logging; the official food-tracking page describes it as logging food from a photo, but result-review detail is limited in the source reviewed.", "https://www.carbmanager.com/feature-details/x5-75raaacaaoe2g/food-tracker/"), "https://www.carbmanager.com/feature-details/x5-75raaacaaoe2g/food-tracker/"),
    weight: reviewed(yes("All users can log weight in the Daily Log; Premium adds other body/health measurements and weight projections.", "https://help.carbmanager.com/docs/log-weight"), "https://help.carbmanager.com/docs/log-weight"),
    "mood-energy": reviewed(partial("The Lifestyle measurement category can track sleep and other lifestyle measures; a specific mood/energy or ability diary is not established.", "https://help.carbmanager.com/docs/add-body-and-health-measurements"), "https://help.carbmanager.com/docs/add-body-and-health-measurements"),
    barcode: reviewed(yes("Free for all users in the mobile app; scans food UPC/EAN to find nutrition data, and can scan QR recipe codes in Carb Manager's cookbook.", "https://help.carbmanager.com/docs/en/log-foods-by-scanning-barcodes-and-snapping-pictures"), "https://help.carbmanager.com/docs/en/log-foods-by-scanning-barcodes-and-snapping-pictures"),
    "offline-scan": reviewed({ ...unknown, note: "Barcode scans search Carb Manager's food databases; offline lookup is not documented.", href: "https://help.carbmanager.com/docs/view-sources-of-food-data" }, "https://help.carbmanager.com/docs/view-sources-of-food-data"),
    "pantry-recipes": reviewed({ ...unknown, note: "Food-intolerance and recipe filters are documented, but recipe search from live pantry inventory is not established.", href: "https://help.carbmanager.com/docs/find-foods-recipes-and-meals" }, "https://help.carbmanager.com/docs/find-foods-recipes-and-meals"),
    "pantry-visual": reviewed({ ...unknown, note: "Barcode/recipe QR scanning and food photo logging are documented; camera recognition of pantry inventory is not established.", href: "https://help.carbmanager.com/docs/en/log-foods-by-scanning-barcodes-and-snapping-pictures" }, "https://help.carbmanager.com/docs/en/log-foods-by-scanning-barcodes-and-snapping-pictures"),
    "pantry-sync": reviewed({ ...unknown, note: "Automatic pantry stock updates from shopping or cooking are not described in the reviewed sources.", href: "https://help.carbmanager.com/docs/generate-and-print-shopping-lists" }, "https://help.carbmanager.com/docs/generate-and-print-shopping-lists"),
    "ai-tailor": reviewed(partial("Generated plans can use preferences/intolerances and macro targets; older release notes mention a limited beta AI Recipe Finder, but current general AI recipe tailoring is not established.", "https://help.carbmanager.com/docs/meal-plan-overview"), "https://help.carbmanager.com/docs/meal-plan-overview"),
    "guided-cook": reviewed(partial("Custom recipes can store step-by-step instructions, but an interactive cook mode is not established.", "https://help.carbmanager.com/docs/create-custom-recipes"), "https://help.carbmanager.com/docs/create-custom-recipes"),
  } },
  { id: "cronometer", name: "Cronometer", href: "https://cronometer.com/features/", broad: "Detailed personal nutrition tracking, nutrient targets and food logging", topics: {
    family: reviewed({ ...unknown, note: "Reviewed help describes individual profiles and practitioner-client tools; a shared household meal-planning workflow is not established.", href: "https://support.cronometer.com/hc/en-us/articles/360021494291-Pro-Client-Profile" }, "https://support.cronometer.com/hc/en-us/articles/360021494291-Pro-Client-Profile"),
    "eater-profiles": reviewed({ ...unknown, note: "Practitioner client profiles are documented, but multiple family eater profiles within one shared meal plan are not established.", href: "https://support.cronometer.com/hc/en-us/articles/360021494291-Pro-Client-Profile" }, "https://support.cronometer.com/hc/en-us/articles/360021494291-Pro-Client-Profile"),
    "allergen-preferences": reviewed(partial("Food suggestions can filter by diet and exclude selected food groups; a household allergen safety workflow is not established.", "https://support.cronometer.com/hc/en-us/articles/31295132424212-Suggest-Food"), "https://support.cronometer.com/hc/en-us/articles/31295132424212-Suggest-Food"),
    "meal-adapt": reviewed({ ...unknown, note: "Food suggestions can be edited for ingredient amounts, but adapting one shared meal to different family members is not established.", href: "https://support.cronometer.com/hc/en-us/articles/31295132424212-Suggest-Food" }, "https://support.cronometer.com/hc/en-us/articles/31295132424212-Suggest-Food"),
    "meal-create": reviewed(yes("Custom recipes can be created from ingredients, portions and cooked recipe weight, then logged; instructions can be stored in notes.", "https://support.cronometer.com/hc/en-us/articles/360018510311-Create-Custom-Recipe"), "https://support.cronometer.com/hc/en-us/articles/360018510311-Create-Custom-Recipe"),
    "meal-import": reviewed(partial("Gold can import recipes from a webpage URL; users can paste ingredients manually, review ingredient matches and correct servings. Direct social-post import is not established.", "https://support.cronometer.com/hc/en-us/articles/4403966087828-Mobile-Recipe-Importer"), "https://support.cronometer.com/hc/en-us/articles/4403966087828-Mobile-Recipe-Importer"),
    "social-import": reviewed({ ...unknown, note: "Webpage URL recipe import is documented, but direct import from social-media posts or apps is not established.", href: "https://support.cronometer.com/hc/en-us/articles/4403966087828-Mobile-Recipe-Importer" }, "https://support.cronometer.com/hc/en-us/articles/4403966087828-Mobile-Recipe-Importer"),
    "meal-scan": reviewed({ ...unknown, note: "Food-photo logging is documented, but scanning a paper or photographed recipe into a reusable recipe is not established.", href: "https://support.cronometer.com/hc/en-us/articles/360018593112-Mobile-Diary-Overview" }, "https://support.cronometer.com/hc/en-us/articles/360018593112-Mobile-Diary-Overview"),
    "plan-create": reviewed({ ...unknown, note: "Custom meals and food suggestions can be logged, but a weekly meal-planning calendar is not established in reviewed sources.", href: "https://support.cronometer.com/hc/en-us/articles/360018593112-Mobile-Diary-Overview" }, "https://support.cronometer.com/hc/en-us/articles/360018593112-Mobile-Diary-Overview"),
    "plan-import": reviewed({ ...unknown, note: "Recipe URL import is documented; importing a meal plan from another app or document is not reported.", href: "https://support.cronometer.com/hc/en-us/articles/4403966087828-Mobile-Recipe-Importer" }, "https://support.cronometer.com/hc/en-us/articles/4403966087828-Mobile-Recipe-Importer"),
    "plan-scan": reviewed({ ...unknown, note: "Paper meal-plan scanning or OCR is not reported in reviewed help sources.", href: "https://support.cronometer.com/hc/en-us/articles/4403966087828-Mobile-Recipe-Importer" }, "https://support.cronometer.com/hc/en-us/articles/4403966087828-Mobile-Recipe-Importer"),
    "plan-templates": reviewed(partial("Custom recipes, meals and repeat items support reuse in logging; reusable weekly meal-plan templates are not established.", "https://support.cronometer.com/hc/en-us/articles/360019865411-Mobile-Foods-Tab"), "https://support.cronometer.com/hc/en-us/articles/360019865411-Mobile-Foods-Tab"),
    shopping: reviewed({ ...unknown, note: "A meal-planning grocery list or retailer basket workflow is not reported in reviewed sources.", href: "https://support.cronometer.com/hc/en-us/articles/360018593112-Mobile-Diary-Overview" }, "https://support.cronometer.com/hc/en-us/articles/360018593112-Mobile-Diary-Overview"),
    collaboration: reviewed(partial("Recipes and custom foods can be shared with Cronometer users or practitioner clients; collaborative household planning/list editing is not established.", "https://support.cronometer.com/hc/en-us/articles/360018510311-Create-Custom-Recipe"), "https://support.cronometer.com/hc/en-us/articles/360018510311-Create-Custom-Recipe"),
    "budget-basket": reviewed({ ...unknown, note: "Retailer checkout, grocery basket pricing and budget controls are not reported in reviewed sources.", href: "https://support.cronometer.com/hc/en-us/articles/360018593112-Mobile-Diary-Overview" }, "https://support.cronometer.com/hc/en-us/articles/360018593112-Mobile-Diary-Overview"),
    "meal-nutrition": reviewed(yes("Diary and recipe views track detailed macro- and micronutrients, targets, balances and nutrition scores.", "https://support.cronometer.com/hc/en-us/articles/360018171731-Diary-Overview"), "https://support.cronometer.com/hc/en-us/articles/360018171731-Diary-Overview"),
    "nutrition-uplift": reviewed(yes("Gold Suggest Food proposes meals to address remaining daily nutrient targets while considering macro goals, limits and dietary filters; suggestions can be edited before adding to the diary.", "https://support.cronometer.com/hc/en-us/articles/31295132424212-Suggest-Food"), "https://support.cronometer.com/hc/en-us/articles/31295132424212-Suggest-Food"),
    "week-nutrition": reviewed(yes("Nutrition Report summarizes average daily nutrition over a chosen period; Basic covers one prior week and Gold can select custom date ranges.", "https://support.cronometer.com/hc/en-us/articles/360018569691-Nutrition-Report"), "https://support.cronometer.com/hc/en-us/articles/360018569691-Nutrition-Report"),
    "weekly-food-explorer": reviewed(partial("Nutrition reports provide period averages and print reports can include daily diary records; a linked explorer that ranks foods eaten during a week by nutrient contribution is not established.", "https://support.cronometer.com/hc/en-us/articles/360018569691-Nutrition-Report"), "https://support.cronometer.com/hc/en-us/articles/360018569691-Nutrition-Report"),
    "food-diary": reviewed(yes("Diary records foods, exercise, biometrics and notes, with daily macro/micronutrient summaries, targets and balances.", "https://support.cronometer.com/hc/en-us/articles/360018171731-Diary-Overview"), "https://support.cronometer.com/hc/en-us/articles/360018171731-Diary-Overview"),
    "photo-diary": reviewed(partial("Mobile photo logging identifies likely foods, but users review and correct matches; this logs eaten food rather than scanning recipes.", "https://support.cronometer.com/hc/en-us/articles/360018593112-Mobile-Diary-Overview"), "https://support.cronometer.com/hc/en-us/articles/360018593112-Mobile-Diary-Overview"),
    weight: reviewed(yes("Weight is a supported biometric and can inform personal energy and nutrient targets.", "https://support.cronometer.com/hc/en-us/articles/360019870632-Mobile-Profile"), "https://support.cronometer.com/hc/en-us/articles/360019870632-Mobile-Profile"),
    "mood-energy": reviewed(partial("Diary notes can record personal reflections/feelings, but a structured mood, energy or ability measure is not established.", "https://support.cronometer.com/hc/en-us/articles/360018171731-Diary-Overview"), "https://support.cronometer.com/hc/en-us/articles/360018171731-Diary-Overview"),
    barcode: reviewed(yes("Mobile barcode scanning finds packaged foods in the database for logging; users can submit a missing product label for review.", "https://support.cronometer.com/hc/en-us/articles/360020441392-Mobile-Scan-Food"), "https://support.cronometer.com/hc/en-us/articles/360020441392-Mobile-Scan-Food"),
    "offline-scan": reviewed({ ...unknown, note: "Barcode lookup is documented, but offline product lookup is not established.", href: "https://support.cronometer.com/hc/en-us/articles/360020441392-Mobile-Scan-Food" }, "https://support.cronometer.com/hc/en-us/articles/360020441392-Mobile-Scan-Food"),
    "pantry-recipes": reviewed({ ...unknown, note: "Food search and recipe storage are documented; pantry-inventory-based recipe discovery is not reported.", href: "https://support.cronometer.com/hc/en-us/articles/360019865411-Mobile-Foods-Tab" }, "https://support.cronometer.com/hc/en-us/articles/360019865411-Mobile-Foods-Tab"),
    "pantry-visual": reviewed({ ...unknown, note: "Food photo logging and barcode scanning are documented; camera-based pantry inventory capture is not established.", href: "https://support.cronometer.com/hc/en-us/articles/360018593112-Mobile-Diary-Overview" }, "https://support.cronometer.com/hc/en-us/articles/360018593112-Mobile-Diary-Overview"),
    "pantry-sync": reviewed({ ...unknown, note: "Automatic pantry stock updates after shopping or cooking are not reported.", href: "https://support.cronometer.com/hc/en-us/articles/360019865411-Mobile-Foods-Tab" }, "https://support.cronometer.com/hc/en-us/articles/360019865411-Mobile-Foods-Tab"),
    "ai-tailor": reviewed(partial("Gold Crono Coach provides personalized guidance based on nutrition data, goals, preferences and logging habits; AI recipe adaptation or household meal planning is not established.", "https://support.cronometer.com/hc/en-us/articles/10570212821268-Dashboard"), "https://support.cronometer.com/hc/en-us/articles/10570212821268-Dashboard"),
    "guided-cook": reviewed({ ...unknown, note: "Recipe instructions can be stored as notes, but interactive step-by-step cook mode is not established.", href: "https://support.cronometer.com/hc/en-us/articles/360018510311-Create-Custom-Recipe" }, "https://support.cronometer.com/hc/en-us/articles/360018510311-Create-Custom-Recipe"),
  } },
  { id: "cherrypick", name: "Cherrypick", href: "https://apps.apple.com/gb/app/cherrypick-plan-shop-cook/id1567423761", broad: "UK planning, cupboard-aware list and supermarket handoff", topics: { "plan-create": yes("Meal planning described in app listing."), shopping: yes("List and supermarket handoff documented."), "meal-create": yes("Recipes form the plan."), family: unknown } },
  { id: "recime", name: "ReciMe", href: "https://apps.apple.com/gb/app/recime-recipes-meal-planner/id1593779280", broad: "Recipe imports, plans, lists and recipe nutrition", topics: { "meal-import": yes("Recipe import from social and web sources is a core feature."), "plan-create": yes("Meal planning documented."), shopping: yes("Grocery list and checkout documented."), "meal-nutrition": partial("Recipe nutrition depends on the feature tier."), "meal-create": yes("Recipes can be saved and organized."), family: unknown } },
  { id: "cooklist", name: "Cooklist", href: "https://cooklist.com/cooklist-app", broad: "Pantry inventory to recipe, plan and grocery journey", topics: { "plan-create": yes("Meal planning documented."), shopping: yes("Grocery journey documented."), "meal-create": yes("Recipes and cooking suggestions documented."), family: unknown } },
  { id: "mealboard", name: "MealBoard", href: "https://mealboard.com/features.html", broad: "Recipes, planner, aisle list and pantry", topics: { "plan-create": yes("Meal planner documented."), shopping: yes("Store and aisle list documented."), "meal-create": yes("Recipe manager documented."), "meal-import": yes("Recipe importing documented."), family: unknown } },
  { id: "paprika", name: "Paprika", href: "https://paprikaapp.com/help/v3/ios/", broad: "Recipe manager, planner, lists and pantry", topics: { "meal-create": yes("Recipe manager supports user-created recipes."), "meal-import": yes("Recipe web import documented."), "plan-create": yes("Meal planner documented."), shopping: yes("Consolidated shopping list documented."), family: unknown } },
  { id: "anylist", name: "AnyList", href: "https://www.anylist.com/meal-planning", broad: "Shared household recipes, plans and grocery lists", topics: { family: partial("Household list sharing documented; per-eater restrictions not established."), "plan-create": yes("Meal planning documented."), shopping: yes("Shared grocery lists documented."), "meal-create": yes("Recipe collection documented."), "meal-import": yes("Recipe import documented.") } },
  { id: "sidechef", name: "SideChef", href: "https://www.sidechef.com/faq/", broad: "Recipes, planner, shopping and guided cooking", topics: { "meal-create": yes("Recipe collection and cook flow documented."), "plan-create": yes("Meal planning documented."), shopping: yes("Shopping integration documented."), "meal-nutrition": partial("Nutrition details vary by recipe and source."), "meal-import": yes("Recipe import documented.") } },
  { id: "plantoeat", name: "Plan to Eat", href: "https://learn.plantoeat.com/help/getting-started-the-app", broad: "Recipe capture, flexible planning, freezer cooking and food logging", topics: {
    family: reviewed(partial("The planner is described for family needs and recipe servings can be scaled to a household; separate member accounts/profiles sharing restrictions are not established.", "https://learn.plantoeat.com/en/help/adding-recipes-to-your-meal-plan"), "https://learn.plantoeat.com/en/help/adding-recipes-to-your-meal-plan"),
    "eater-profiles": reviewed({ ...unknown, note: "Household-size serving adjustment is documented, but separate saved profiles for each eater are not established.", href: "https://learn.plantoeat.com/help/getting-started-the-app" }, "https://learn.plantoeat.com/help/getting-started-the-app"),
    "allergen-preferences": reviewed(partial("Users choose recipes for their own restrictions; AI substitution suggestions can use a dietary preference, but per-member allergen safety profiles are not established.", "https://learn.plantoeat.com/en/help/instant-ingredient-suggestions"), "https://learn.plantoeat.com/en/help/instant-ingredient-suggestions"),
    "meal-adapt": reviewed(partial("Recipe serving sizes can be scaled for a household or individual planned instance; separate ingredient adaptations per eater are not established.", "https://learn.plantoeat.com/help/getting-started-the-app"), "https://learn.plantoeat.com/help/getting-started-the-app"),
    "meal-create": reviewed(yes("Recipes can be entered by hand, pasted as text, imported from URL/photo/social sources, and edited; nutrition can be calculated per serving.", "https://learn.plantoeat.com/help/how-do-i-add-recipes-using-the-app"), "https://learn.plantoeat.com/help/how-do-i-add-recipes-using-the-app"),
    "meal-import": reviewed(yes("Imports recipe URLs, browser/share clips, pasted recipe text, photos and supported bulk recipe files; imports are reviewable/editable.", "https://learn.plantoeat.com/help/how-do-i-add-recipes-using-the-app"), "https://learn.plantoeat.com/help/how-do-i-add-recipes-using-the-app"),
    "social-import": reviewed(yes("The share-extension clipper supports recipes from multiple social apps, with specific official guides for Instagram, Facebook, YouTube, TikTok and Pinterest.", "https://learn.plantoeat.com/help/import-recipes-from-instagram"), "https://learn.plantoeat.com/help/import-recipes-from-instagram"),
    "meal-scan": reviewed(yes("Mobile app can import recipe text from a camera/photo-library image; multiple pages are supported, but multiple recipes cannot be imported together.", "https://learn.plantoeat.com/help/how-do-i-add-recipes-using-the-app"), "https://learn.plantoeat.com/help/how-do-i-add-recipes-using-the-app"),
    "plan-create": reviewed(yes("Planner schedules recipes by date and mealtime, supports multiple recipes per day and has no documented calendar recipe limit.", "https://learn.plantoeat.com/en/help/adding-recipes-to-your-meal-plan"), "https://learn.plantoeat.com/en/help/adding-recipes-to-your-meal-plan"),
    "plan-import": reviewed(partial("Recipes can be imported from external apps/files and scheduled; importing a complete plan/calendar from another app or document is not established.", "https://learn.plantoeat.com/en/help/add-recipes-from-around-the-web"), "https://learn.plantoeat.com/en/help/add-recipes-from-around-the-web"),
    "plan-scan": reviewed({ ...unknown, note: "Photo OCR import is documented for recipes, not a complete paper meal plan/calendar.", href: "https://learn.plantoeat.com/help/how-do-i-add-recipes-using-the-app" }, "https://learn.plantoeat.com/help/how-do-i-add-recipes-using-the-app"),
    "plan-templates": reviewed(yes("Reusable Menus are collections of planned items that can be added to the planner for recurring plans.", "https://learn.plantoeat.com/help/meal-planner"), "https://learn.plantoeat.com/help/meal-planner"),
    shopping: reviewed(yes("Generated list draws ingredients from planned recipes over selected/custom dates; manual and Staples items, store/category organization, check-off and grocery delivery are supported.", "https://learn.plantoeat.com/help/create-a-shopping-list-app"), "https://learn.plantoeat.com/help/create-a-shopping-list-app"),
    collaboration: reviewed(partial("Friends can share recipes and Menus; shared collaborative household planner edits or a synchronized family grocery list are not established.", "https://learn.plantoeat.com/help/invite-friends-to-share-recipes"), "https://learn.plantoeat.com/help/invite-friends-to-share-recipes"),
    "budget-basket": reviewed(partial("Planner can show estimated and total recipe costs, and users can send selected list items to grocery services; live basket pricing, household budget limits and checkout accuracy vary by integration.", "https://learn.plantoeat.com/help/app-nutritional-data-on-the-app-planner"), "https://learn.plantoeat.com/help/app-nutritional-data-on-the-app-planner"),
    "meal-nutrition": reviewed(yes("Recipe nutrition can be calculated and shown per serving, including calories, macros, fiber, sugar, sodium and nutritional score; source/calculation quality varies.", "https://learn.plantoeat.com/help/app-calculate-nutrition-facts-for-recipes"), "https://learn.plantoeat.com/help/app-calculate-nutrition-facts-for-recipes"),
    "nutrition-uplift": reviewed(partial("AI ingredient substitution suggestions can account for dietary preference or what's missing from a pantry; a nutrient-target gap analysis that adds foods to an eaten meal is not established.", "https://learn.plantoeat.com/en/help/instant-ingredient-suggestions"), "https://learn.plantoeat.com/en/help/instant-ingredient-suggestions"),
    "week-nutrition": reviewed(partial("Planner displays per-serving recipe nutrition and daily totals; Food Logger charts weekly calories and macros plus a 7-day average. Weekly micronutrient intake analysis is not established.", "https://learn.plantoeat.com/help/how-to-use-food-logger"), "https://learn.plantoeat.com/help/how-to-use-food-logger"),
    "weekly-food-explorer": reviewed({ ...unknown, note: "Weekly calories/macros chart is documented, but a week-level food explorer linking logged foods to nutrient contribution is not established.", href: "https://learn.plantoeat.com/help/how-to-use-food-logger" }, "https://learn.plantoeat.com/help/how-to-use-food-logger"),
    "food-diary": reviewed(yes("Food Logger tracks eaten foods/recipes by mealtime, supports USDA food search, copies meals across days, and compares daily calories/macros with goals.", "https://learn.plantoeat.com/help/how-to-use-food-logger"), "https://learn.plantoeat.com/help/how-to-use-food-logger"),
    "photo-diary": reviewed({ ...unknown, note: "Recipe photo OCR is documented for saving recipes; photo-based logging of prepared food eaten is not established.", href: "https://learn.plantoeat.com/help/how-do-i-add-recipes-using-the-app" }, "https://learn.plantoeat.com/help/how-do-i-add-recipes-using-the-app"),
    weight: reviewed({ ...unknown, note: "Food Logger tracks foods and calorie/macronutrient goals; weight logging is not reported in reviewed sources.", href: "https://learn.plantoeat.com/help/how-to-use-food-logger" }, "https://learn.plantoeat.com/help/how-to-use-food-logger"),
    "mood-energy": reviewed({ ...unknown, note: "Mood, energy and ability logging are not reported in reviewed sources.", href: "https://learn.plantoeat.com/help/how-to-use-food-logger" }, "https://learn.plantoeat.com/help/how-to-use-food-logger"),
    barcode: reviewed({ ...unknown, note: "USDA food search and recipe photo import are documented; barcode scanning is not established.", href: "https://learn.plantoeat.com/help/how-to-use-food-logger" }, "https://learn.plantoeat.com/help/how-to-use-food-logger"),
    "offline-scan": reviewed({ ...unknown, note: "Barcode scanning and offline product lookup are not established in reviewed sources.", href: "https://learn.plantoeat.com/help/how-to-use-food-logger" }, "https://learn.plantoeat.com/help/how-to-use-food-logger"),
    "pantry-recipes": reviewed(partial("Recipe substitutions can suggest replacements for a dietary need or something missing from a pantry; automatic recipe discovery from a live pantry inventory is not established.", "https://learn.plantoeat.com/en/help/instant-ingredient-suggestions"), "https://learn.plantoeat.com/en/help/instant-ingredient-suggestions"),
    "pantry-visual": reviewed({ ...unknown, note: "Recipe OCR imports paper/photo recipes; scanning pantry items to create inventory is not established.", href: "https://learn.plantoeat.com/help/how-do-i-add-recipes-using-the-app" }, "https://learn.plantoeat.com/help/how-do-i-add-recipes-using-the-app"),
    "pantry-sync": reviewed({ ...unknown, note: "Freezer meal quantities are tracked, but general pantry stock updates from shopping or cooking are not established.", href: "https://learn.plantoeat.com/help/app-freezer-cooking" }, "https://learn.plantoeat.com/help/app-freezer-cooking"),
    "ai-tailor": reviewed(partial("AI ingredient substitution recommendations can be tailored to dietary preferences and missing pantry items; AI-generated household plans or full recipe rewriting are not established.", "https://learn.plantoeat.com/en/help/instant-ingredient-suggestions"), "https://learn.plantoeat.com/en/help/instant-ingredient-suggestions"),
    "guided-cook": reviewed(yes("Cooking View provides step-by-step directions, ingredient check-offs, multiple timers and a screen-awake cooking display.", "https://learn.plantoeat.com/help/the-cooking-view-app"), "https://learn.plantoeat.com/help/the-cooking-view-app"),
  } },
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
            {detail && <div role="dialog" aria-modal="true" aria-labelledby="evidence-title" className="mt-5 rounded-2xl border border-primary/30 bg-card p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-bold ${evidenceStyle(evidenceFor(detail.product, detail.topic.id).level)}`}>{evidenceLabel(evidenceFor(detail.product, detail.topic.id).level)}</p><h3 id="evidence-title" className="mt-2 text-lg font-semibold">{detail.product.name}: {detail.topic.question}</h3></div><button type="button" onClick={() => setDetail(null)} className="rounded-lg border border-border px-3 py-1 text-sm hover:border-primary/50">Close</button></div>{evidenceAssessmentLabel(evidenceFor(detail.product, detail.topic.id)) && <p className="mt-2 text-xs font-medium text-muted-foreground">{evidenceAssessmentLabel(evidenceFor(detail.product, detail.topic.id))}</p>}<p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{evidenceFor(detail.product, detail.topic.id).note}</p>{detail.product.id !== "tha" && <><a className="mt-4 inline-block text-sm font-medium text-primary underline underline-offset-4" href={evidenceFor(detail.product, detail.topic.id).href ?? detail.product.href} target="_blank" rel="noopener noreferrer">Open the developer source</a>{evidenceFor(detail.product, detail.topic.id).lastReviewed && <p className="mt-2 text-xs text-muted-foreground">Source checked {evidenceFor(detail.product, detail.topic.id).lastReviewed}</p>}</>}</div>}
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
