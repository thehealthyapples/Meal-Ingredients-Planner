/**
 * Savings event rates (GBP).
 * Single source of truth — do not hardcode these elsewhere.
 */
export const SAVINGS_RATES = {
  takeaway_avoided: 10.00,
  pantry_used: 1.50,
  smart_swap: 1.00,
} as const;

export type SavingsEventType = keyof typeof SAVINGS_RATES;
