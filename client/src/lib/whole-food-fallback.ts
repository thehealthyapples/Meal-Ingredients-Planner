import type { WholeFoodIntent } from "./whole-food-matcher";

export function buildFallbackChain(intent: WholeFoodIntent): string[] {
  const { ingredientName, variantSelections, attributePreferences } = intent;

  const variants = Object.values(variantSelections).filter(Boolean);
  const attrs = Object.entries(attributePreferences)
    .filter(([, wanted]) => wanted)
    .map(([attr]) => attr.replace("_", " "));

  const chain: string[] = [];

  if (variants.length > 0 && attrs.length > 0) {
    chain.push(`${attrs.join(" ")} ${variants.join(" ")} ${ingredientName}`);
  }

  if (attrs.length > 0) {
    chain.push(`${attrs.join(" ")} ${ingredientName}`);
  }

  if (variants.length > 0) {
    chain.push(`${variants.join(" ")} ${ingredientName}`);
  }

  chain.push(ingredientName);

  const seen = new Set<string>();
  return chain.map((s) => s.trim().toLowerCase()).filter((s) => {
    if (seen.has(s)) return false;
    seen.add(s);
    return true;
  });
}
