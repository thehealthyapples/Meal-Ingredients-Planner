// READ-ONLY investigation simulation. Replicates the /api/meal-plans/smart-suggest
// route + generateSmartSuggestion pipeline with per-stage instrumentation.
// No writes, no schema changes. Safe to delete.
import { db, pool } from "../db.js";
import * as schema from "../../shared/schema.js";
import { eq, and } from "drizzle-orm";
import { storage } from "../storage.js";
import { getHouseholdForUser } from "../lib/household.js";
import {
  candidateIsProduct, candidateIsPremium, candidateHardExcluded, candidateDietExcluded,
  generateSmartSuggestion,
} from "../lib/smart-suggest-service.js";
import { convertMealToCandidate, convertExternalToCandidate } from "../lib/meal-scoring-service.js";
import { fetchExternalCandidates, enrichExternalCandidates } from "../lib/external-meal-service.js";

const DIET_PATTERN_TO_DIET_TYPE: Record<string, string> = {
  Vegan: "vegan", Vegetarian: "vegetarian", Flexitarian: "flexitarian", Keto: "keto",
  "Low-Carb": "low-carb", Paleo: "paleo", Carnivore: "carnivore", Mediterranean: "mediterranean",
  DASH: "dash", MIND: "mind",
};

const SLOT_CATEGORY_MAPPING: Record<string, string[]> = {
  breakfast: ["breakfast", "smoothie"],
  lunch: ["lunch", "snack", "salad"],
  dinner: ["dinner", "main"],
  snack: ["snack", "dessert", "smoothie", "drink"],
};
function slotFit(cat: string | null, slot: string): boolean {
  if (!cat) return slot === "dinner";
  return (SLOT_CATEGORY_MAPPING[slot] || [slot]).includes(cat.toLowerCase());
}

const TARGET_USER = Number(process.env.SIM_USER || 1);
const MEALS_PER_DAY = Number(process.env.SIM_MPD || 4); // exercise breakfast+lunch+dinner+snack

async function main() {
  const slots = MEALS_PER_DAY >= 4 ? ["breakfast","lunch","dinner","snack"]
    : MEALS_PER_DAY === 3 ? ["breakfast","lunch","dinner"]
    : MEALS_PER_DAY === 2 ? ["lunch","dinner"] : ["dinner"];

  console.log(`\n##### SIMULATION for user ${TARGET_USER}, mealsPerDay=${MEALS_PER_DAY}, slots=[${slots.join(", ")}] #####`);

  const reqUser = await storage.getUser(TARGET_USER);
  console.log(`\n=== REQUEST USER ===`);
  console.log(`id=${reqUser?.id} username=${reqUser?.username} dietPattern=${JSON.stringify(reqUser?.dietPattern)} dietRestrictions=${JSON.stringify(reqUser?.dietRestrictions)}`);

  const prefs = await storage.getUserPreferences(TARGET_USER);
  console.log(`prefs.dietTypes=${JSON.stringify(prefs?.dietTypes)} prefs.excludedIngredients=${JSON.stringify(prefs?.excludedIngredients)} plannerEnableDrinks=${prefs?.plannerEnableDrinks}`);

  // ---- Household eaters + diet derivation (mirror route) ----
  console.log(`\n=== HOUSEHOLD ===`);
  let householdId: number | null = null;
  const hardRestrictedSet = new Set<string>((prefs?.excludedIngredients ?? []).map(e => e.toLowerCase()));
  let mergedDietTypes: string[] = prefs?.dietTypes ?? [];
  const householdEaterStrictDiets = new Set<string>();
  try {
    householdId = await getHouseholdForUser(TARGET_USER);
    const eaters = await storage.getHouseholdEaters(householdId);
    console.log(`householdId=${householdId} eaters=${eaters.length}`);
    for (const eater of eaters) {
      let eaterDietTypes: string[] = eater.defaultDietTypes ?? [];
      let derivedFrom = "defaultDietTypes";
      if (eater.userId != null) {
        const [mp, mu] = await Promise.all([storage.getUserPreferences(eater.userId), storage.getUser(eater.userId)]);
        const pdt = mp?.dietTypes ?? [];
        if (pdt.length > 0) { eaterDietTypes = pdt; derivedFrom = "prefs.dietTypes"; }
        else if (mu?.dietPattern) {
          const mapped = DIET_PATTERN_TO_DIET_TYPE[mu.dietPattern];
          eaterDietTypes = mapped ? [mapped] : [mu.dietPattern];
          derivedFrom = `users.dietPattern(${mu.dietPattern})`;
        }
      }
      for (const r of eater.hardRestrictions ?? []) hardRestrictedSet.add(r.toLowerCase());
      for (const d of eaterDietTypes) if (!mergedDietTypes.includes(d)) mergedDietTypes = [...mergedDietTypes, d];
      for (const d of eaterDietTypes) {
        const n = d.toLowerCase().trim();
        if (n === "vegan") householdEaterStrictDiets.add("Vegan");
        else if (n === "vegetarian") householdEaterStrictDiets.add("Vegetarian");
      }
      console.log(`  eater "${eater.displayName}" userId=${eater.userId} dietTypes=${JSON.stringify(eaterDietTypes)} (${derivedFrom}) hardRestrictions=${JSON.stringify(eater.hardRestrictions)}`);
    }
  } catch (e) {
    console.log(`household lookup failed: ${(e as Error).message}`);
  }

  const dietPattern = reqUser?.dietPattern ?? null;
  const dietRestrictions = (reqUser?.dietRestrictions ?? []).filter(Boolean);
  const mergedExcludedIngredients = Array.from(hardRestrictedSet);
  const userDietNorm = (dietPattern ?? "").toLowerCase();
  if (userDietNorm === "vegan") { householdEaterStrictDiets.delete("Vegan"); householdEaterStrictDiets.delete("Vegetarian"); }
  else if (userDietNorm === "vegetarian") { householdEaterStrictDiets.delete("Vegetarian"); }
  const householdStrictDiets = Array.from(householdEaterStrictDiets);

  console.log(`\n=== RESOLVED SETTINGS ===`);
  console.log(`mergedDietTypes=${JSON.stringify(mergedDietTypes)}`);
  console.log(`hardExcludedIngredients=${JSON.stringify(mergedExcludedIngredients)}`);
  console.log(`householdStrictDiets=${JSON.stringify(householdStrictDiets)}`);
  console.log(`request dietPattern=${JSON.stringify(dietPattern)}`);
  console.log(`request dietRestrictions=${JSON.stringify(dietRestrictions)}`);

  // ---- Route-level user meal filtering ----
  let userMeals = await storage.getMeals(TARGET_USER);
  const rawCount = userMeals.length;
  const plannerEnableDrinks = prefs?.plannerEnableDrinks ?? false;
  userMeals = userMeals.filter(m => {
    if (m.drinkType === "alcohol") return false;
    if (!plannerEnableDrinks && m.isDrink) return false;
    if (!plannerEnableDrinks && m.kind === "drink") return false;
    return true;
  });
  const afterDrink = userMeals.length;
  userMeals = userMeals.filter(m => m.mealSourceType !== "starter" && m.mealSourceType !== "planner-placeholder" && m.mealSourceType !== "openfoodfacts");
  const afterSource = userMeals.length;
  userMeals = userMeals.filter(m => m.kind !== "component");
  const afterComponent = userMeals.length;
  const PREMIUM = ["premium piece of content","available to subscribed users","subscribed users","subscriber-only","subscribers only","premium content","subscription required"];
  userMeals = userMeals.filter(m => {
    const nl = m.name.toLowerCase(); const it = (m.instructions ?? []).join("\0").toLowerCase();
    return !PREMIUM.some(x => nl.includes(x) || it.includes(x));
  });
  const afterPremium = userMeals.length;

  console.log(`\n=== ROUTE-LEVEL USER MEAL FILTER ===`);
  console.log(`raw getMeals=${rawCount} -> afterDrink=${afterDrink} -> afterSourceType=${afterSource} -> afterComponent=${afterComponent} -> afterPremium=${afterPremium}`);

  // category map
  const cats = await storage.getAllCategories();
  const categoryMap = new Map(cats.map(c => [c.id, c.name.toLowerCase()]));

  // ---- Pool construction instrumentation (mirror generateSmartSuggestion) ----
  const hardExcluded = mergedExcludedIngredients;
  const isHE = (name: string, ings: string[]) => candidateHardExcluded(name, ings, hardExcluded);
  const isDietEx = (c: {name:string;ingredients:string[];category?:string|null;cuisine?:string|null}) => candidateDietExcluded(c, dietPattern, dietRestrictions);
  const isHSD = (c: {name:string;ingredients:string[];category?:string|null;cuisine?:string|null}) => householdStrictDiets.length>0 && householdStrictDiets.some(d => candidateDietExcluded(c, d, []));
  const profileRestricted = (dietPattern!==null && dietPattern!=="") || dietRestrictions.length>0 || hardExcluded.length>0;

  const stage = { product:0, premium:0, readyProduct:0, drinkAlc:0, hardExcl:0, noIngRestricted:0, dietExcl:0, hsdExcl:0, passed:0 };
  const pool: { name:string; cat:string|null; ings:number; isExternal:boolean }[] = [];

  for (const meal of userMeals) {
    if (candidateIsProduct(meal.mealSourceType)) { stage.product++; continue; }
    if (candidateIsPremium(meal)) { stage.premium++; continue; }
    if (meal.isReadyMeal && meal.ingredients.length===0 && meal.barcode) { stage.readyProduct++; continue; }
    if (meal.drinkType==="alcohol") { stage.drinkAlc++; continue; }
    if (!plannerEnableDrinks && (meal.isDrink || meal.kind==="drink")) { stage.drinkAlc++; continue; }
    const catName = meal.categoryId ? categoryMap.get(meal.categoryId) || null : null;
    if (isHE(meal.name, meal.ingredients)) { stage.hardExcl++; continue; }
    if (profileRestricted && meal.ingredients.length===0) { stage.noIngRestricted++; continue; }
    if (isDietEx({name:meal.name, ingredients:meal.ingredients, category:catName})) { stage.dietExcl++; continue; }
    if (isHSD({name:meal.name, ingredients:meal.ingredients, category:catName})) { stage.hsdExcl++; continue; }
    stage.passed++;
    pool.push({ name: meal.name, cat: catName, ings: meal.ingredients.length, isExternal:false });
  }

  console.log(`\n=== USER MEAL POOL CONSTRUCTION (in generateSmartSuggestion) ===`);
  console.log(JSON.stringify(stage, null, 2));

  // ---- External candidates ----
  const dietaryPrefixOrder: [string,string][] = [["vegan","vegan"],["vegetarian","vegetarian"],["keto","keto"],["paleo","paleo"],["gluten-free","gluten-free"],["dairy-free","dairy-free"],["low-carb","low-carb"],["mediterranean","mediterranean"]];
  const lowerMerged = mergedDietTypes.map(d=>d.toLowerCase().trim());
  let dietaryPrefix: string | undefined;
  for (const [dt,px] of dietaryPrefixOrder) if (lowerMerged.includes(dt)) { dietaryPrefix=px; break; }
  console.log(`\n=== EXTERNAL FETCH ===`);
  console.log(`dietaryPrefix=${JSON.stringify(dietaryPrefix)}`);
  const extStage = { raw:0, enriched:0, drinkAlc:0, hardExcl:0, noIng:0, dietExcl:0, hsdExcl:0, passed:0 };
  try {
    const rawExt = await fetchExternalCandidates({ dietaryPrefix });
    extStage.raw = rawExt.length;
    const enriched = await enrichExternalCandidates(rawExt);
    extStage.enriched = enriched.length;
    for (const ext of enriched) {
      const base = convertExternalToCandidate(ext);
      if (isHE(base.name, base.ingredients)) { extStage.hardExcl++; continue; }
      if (ext.ingredients.length===0) { extStage.noIng++; continue; }
      if (isDietEx({name:base.name, ingredients:base.ingredients, category:base.category, cuisine:base.cuisine})) { extStage.dietExcl++; continue; }
      if (isHSD({name:base.name, ingredients:base.ingredients, category:base.category, cuisine:base.cuisine})) { extStage.hsdExcl++; continue; }
      extStage.passed++;
      pool.push({ name: base.name, cat: base.category ?? null, ings: base.ingredients.length, isExternal:true });
    }
  } catch (e) {
    console.log(`external fetch failed: ${(e as Error).message}`);
  }
  console.log(JSON.stringify(extStage, null, 2));

  // ---- Pool by slot classification ----
  console.log(`\n=== FINAL POOL = ${pool.length} (user ${stage.passed} + external ${extStage.passed}) ===`);
  const catDist: Record<string, number> = {};
  for (const p of pool) catDist[p.cat ?? "null"] = (catDist[p.cat ?? "null"]||0)+1;
  console.log(`category distribution: ${JSON.stringify(catDist)}`);
  console.log(`\n=== POOL BY SLOT (Tier-3 repeat candidate count = total that ever fit slot) ===`);
  for (const slot of slots) {
    const fit = pool.filter(p => slotFit(p.cat, slot));
    const userFit = fit.filter(p=>!p.isExternal).length;
    const extFit = fit.filter(p=>p.isExternal).length;
    console.log(`  ${slot}: ${fit.length} (user ${userFit} + external ${extFit})`);
  }

  // ---- Real run via generateSmartSuggestion ----
  console.log(`\n=== ACTUAL generateSmartSuggestion RUN ===`);
  const mealNutrition = new Map<number, { calories?: string|null }>();
  for (const m of userMeals) { const n = await storage.getNutrition(m.id); if (n) mealNutrition.set(m.id, { calories: n.calories }); }
  const mergedPrefs = prefs ? { ...prefs, excludedIngredients: mergedExcludedIngredients, dietTypes: mergedDietTypes } : null;
  const result = await generateSmartSuggestion(
    userMeals, mergedPrefs as any,
    { mealsPerDay: MEALS_PER_DAY, dietPattern, dietRestrictions, hardExcludedIngredients: mergedExcludedIngredients,
      householdStrictDiets, userId: TARGET_USER, plannerEnableDrinks } as any,
    mealNutrition, categoryMap,
  );

  const totalSlots = 7 * slots.length;
  console.log(`filled entries=${result.entries.length} / ${totalSlots} slots  (userMeals=${result.stats.userMeals}, external=${result.stats.externalMeals})`);

  // empty slots
  const filledKeys = new Set(result.entries.map(e => `${e.dayOfWeek}-${e.slot}`));
  const empty: string[] = [];
  for (let d=0; d<7; d++) for (const s of slots) if (!filledKeys.has(`${d}-${s}`)) empty.push(`${d}-${s}`);
  const emptyBySlot: Record<string,number> = {};
  for (const k of empty) { const s = k.split("-")[1]; emptyBySlot[s]=(emptyBySlot[s]||0)+1; }
  console.log(`empty slots: ${empty.length} -> by slot ${JSON.stringify(emptyBySlot)}`);

  // repeats
  const nameCounts = new Map<string, number>();
  for (const e of result.entries) nameCounts.set(e.candidate.name, (nameCounts.get(e.candidate.name)||0)+1);
  const repeats = Array.from(nameCounts.entries()).filter(([,c])=>c>1).sort((a,b)=>b[1]-a[1]);
  console.log(`\n=== REPEATS (name x count) ===`);
  for (const [n,c] of repeats.slice(0,25)) console.log(`  ${c}x  "${n}"`);
  console.log(`distinct meals used = ${nameCounts.size}`);
  const shellUsed = result.entries.filter(e => String(e.candidate.id).startsWith("shell-"));
  console.log(`Tier-4 shell entries used = ${shellUsed.length}`);
}

main().catch(e=>{console.error(e);}).finally(()=>pool.end());
