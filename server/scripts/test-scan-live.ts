import { extractDestination } from "../services/recipeParser";
import { readFileSync } from "fs";

async function main() {
  const buf = readFileSync("server/test-assets/vision-real/shopping list.jpeg");
  console.log("[test] imageBytes=" + buf.length + " OPENAI_API_KEY=" + (!!process.env.OPENAI_API_KEY));

  const t0 = Date.now();
  const result = await extractDestination(buf, "shopping_list", "image/jpeg");
  console.log("[test] elapsed=" + (Date.now() - t0) + "ms parsedBy=" + result.parsedBy + " confidence=" + result.confidence);
  console.log("[test] rawText=" + JSON.stringify(result.rawText?.slice(0, 200)));
  if (result.result?.mode === "shopping_list") {
    for (const item of result.result.items) {
      console.log("[item]", JSON.stringify(item));
    }
  }
  console.log("[test] warnings=" + JSON.stringify(result.warnings));
}

main().catch(console.error);
