import { extractDestination } from "../services/recipeParser";
import { readFileSync } from "fs";

async function main() {
  const imagePath = process.argv[2] || "server/test-assets/vision-real/week6.jpeg";
  const mode = (process.argv[3] as "planner" | "recipe" | "shopping_list") || "planner";

  const buf = readFileSync(imagePath);
  console.log(`[test] imagePath=${imagePath} mode=${mode} imageBytes=${buf.length} OPENAI_API_KEY=${!!process.env.OPENAI_API_KEY}`);

  const t0 = Date.now();
  const result = await extractDestination(buf, mode, "image/jpeg");
  console.log(`[test] elapsed=${Date.now() - t0}ms parsedBy=${result.parsedBy} confidence=${result.confidence}`);
  console.log(`[test] rawTextChars=${result.rawText?.length ?? 0}`);
  console.log(`[test] warnings=${JSON.stringify(result.warnings)}`);

  if (result.result?.mode === "planner") {
    const meals = result.result.meals;
    const ideas = meals.filter(m => m.proposedType === "meal_idea");
    const scheduled = meals.filter(m => m.proposedType !== "meal_idea");
    console.log(`[test] PLANNER total_meals=${meals.length} scheduled=${scheduled.length} meal_ideas=${ideas.length} shoppingItems=${result.result.shoppingItems.length}`);
    console.log("[test] --- SCHEDULED MEALS ---");
    for (const m of scheduled) {
      console.log(`[meal] day=${m.day ?? "null"} slot=${m.mealSlot ?? "null"} type=${m.proposedType} conf=${m.confidence} label="${m.label}"`);
      if (m.interpretedName && m.interpretedName !== m.label) console.log(`  → interpretedName="${m.interpretedName}"`);
      if (m.contextNote) console.log(`  → contextNote="${m.contextNote}"`);
    }
    if (ideas.length > 0) {
      console.log("[test] --- MEAL IDEAS ---");
      for (const m of ideas) {
        console.log(`[idea] label="${m.label}" interpretedName="${m.interpretedName ?? ""}"`);
      }
    }
    if (result.result.shoppingItems.length > 0) {
      console.log("[test] --- SHOPPING ITEMS ---");
      for (const i of result.result.shoppingItems) {
        console.log(`[shop] label="${i.label}" qty=${i.quantity ?? "null"} conf=${i.confidence}`);
      }
    }
  } else if (result.result?.mode === "shopping_list") {
    for (const item of result.result.items) {
      console.log("[item]", JSON.stringify(item));
    }
  }
}

main().catch(console.error);
