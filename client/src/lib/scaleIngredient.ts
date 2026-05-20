// Conservative ingredient quantity scaling.
// Scales only confidently parseable leading numeric quantities.
// Returns original text unchanged for ambiguous or unparseable patterns.

// Matches: mixed fraction "1 1/2", simple fraction "1/2", decimal "0.5", integer "200"
const LEADING_NUM_RE = /^(\d+ \d+\/\d+|\d+\/\d+|\d+\.\d+|\d+)/;

const SIMPLE_FRACS: [number, string][] = [
  [1 / 4, "1/4"],
  [1 / 3, "1/3"],
  [1 / 2, "1/2"],
  [2 / 3, "2/3"],
  [3 / 4, "3/4"],
];
const FRAC_EPS = 0.04;

function parseLeadingQuantity(text: string): { qty: number; len: number } | null {
  const m = text.match(LEADING_NUM_RE);
  if (!m) return null;

  const raw = m[1];
  const len = raw.length;
  const after = text.slice(len);

  // Reject range patterns: "1-2" or "1 to 2"
  if (/^[ \t]*-[ \t]*\d/.test(after)) return null;
  if (/^[ \t]+to[ \t]+\d/i.test(after)) return null;

  if (raw.includes(" ")) {
    // Mixed fraction: "1 1/2"
    const spaceIdx = raw.indexOf(" ");
    const whole = parseInt(raw.slice(0, spaceIdx), 10);
    const [num, den] = raw.slice(spaceIdx + 1).split("/").map(Number);
    if (!den || den === 0) return null;
    return { qty: whole + num / den, len };
  }
  if (raw.includes("/")) {
    // Simple fraction: "1/2"
    const [num, den] = raw.split("/").map(Number);
    if (!den || den === 0) return null;
    return { qty: num / den, len };
  }
  if (raw.includes(".")) {
    return { qty: parseFloat(raw), len };
  }
  return { qty: parseInt(raw, 10), len };
}

function formatQuantity(n: number): string {
  if (n <= 0) return "0";

  const whole = Math.floor(n);
  const frac = n - whole;

  if (frac > 1 - FRAC_EPS) return String(whole + 1);
  if (frac < FRAC_EPS) return String(whole);

  for (const [val, str] of SIMPLE_FRACS) {
    if (Math.abs(frac - val) < FRAC_EPS) {
      return whole === 0 ? str : `${whole} ${str}`;
    }
  }

  // Decimal fallback: round to 2dp and trim trailing zeros
  const rounded = Math.round(n * 100) / 100;
  return String(rounded).replace(/\.?0+$/, "");
}

/**
 * Scale a raw ingredient string by a serving ratio.
 * Returns the original text if the leading quantity cannot be confidently parsed.
 * Never compounds: always apply factor to the original text.
 */
export function scaleIngredient(
  text: string,
  fromServings: number,
  toServings: number
): string {
  if (fromServings <= 0 || toServings <= 0) return text;
  if (fromServings === toServings) return text;

  const trimmed = text.trim();
  const parsed = parseLeadingQuantity(trimmed);
  if (parsed === null) return text;

  const { qty, len } = parsed;
  if (qty <= 0) return text;

  const scaled = qty * (toServings / fromServings);
  return formatQuantity(scaled) + trimmed.slice(len);
}
