import { useEffect, useState } from "react";
import { api } from "@shared/routes";

/**
 * Top-3 spelling suggestions for the ⚠ Review edit flow.
 *
 * Read-only: tapping a suggestion calls `onPick(word)` which the parent uses
 * to update the controlled input value. Nothing is auto-saved.
 *
 * Renders nothing if:
 *   - the term is shorter than 4 chars
 *   - the backend returns no suggestions above threshold
 */
export function SpellSuggestions({
  term,
  onPick,
  testIdPrefix,
}: {
  term: string;
  onPick: (word: string) => void;
  testIdPrefix?: string;
}) {
  const [suggestions, setSuggestions] = useState<{ word: string; similarity: number }[]>([]);

  useEffect(() => {
    const t = (term ?? "").trim();
    if (t.length < 4) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const url = `${api.shoppingList.suggestSpellings.path}?term=${encodeURIComponent(t)}`;
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) {
          if (!cancelled) setSuggestions([]);
          return;
        }
        const data = await res.json();
        if (!cancelled) setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [term]);

  if (suggestions.length === 0) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-1 mt-1"
      data-testid={testIdPrefix ? `${testIdPrefix}-suggestions` : "spell-suggestions"}
    >
      <span className="text-[10.5px] text-muted-foreground">Did you mean:</span>
      {suggestions.map((s) => (
        <button
          key={s.word}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPick(s.word);
          }}
          className="text-[10.5px] px-1.5 py-0.5 rounded-full border border-primary/40 bg-primary/5 hover:bg-primary/15 text-foreground transition-colors"
          data-testid={testIdPrefix ? `${testIdPrefix}-suggestion-${s.word}` : `spell-suggestion-${s.word}`}
          title={`similarity ${s.similarity.toFixed(2)}`}
        >
          {s.word}
        </button>
      ))}
    </div>
  );
}
