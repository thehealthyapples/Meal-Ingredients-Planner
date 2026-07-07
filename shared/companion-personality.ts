/**
 * companion-personality.ts — EWO2 Companion Personality Platform
 * =================================================================
 * The closed `PersonalityId` set plus display-only copy (name + one-line
 * description), shared verbatim between server and client so the Settings
 * selector never duplicates a second list that can drift from the
 * server-side behavioural registry (server/intelligence/conversation/
 * personality-registry.ts, which imports and extends this file). This file
 * carries NO behaviour — no phrasing, no tone, no priorities — only the
 * enum and the copy a picker UI needs.
 */

export const PERSONALITY_IDS = [
  "companion",
  "friend",
  "coach",
  "chef",
  "teacher",
  "sergeant",
] as const;

export type PersonalityId = (typeof PERSONALITY_IDS)[number];

export const DEFAULT_PERSONALITY_ID: PersonalityId = "companion";

export function isPersonalityId(value: unknown): value is PersonalityId {
  return typeof value === "string" && (PERSONALITY_IDS as readonly string[]).includes(value);
}

export function normalizePersonalityId(value: unknown): PersonalityId {
  return isPersonalityId(value) ? value : DEFAULT_PERSONALITY_ID;
}

export interface PersonalityDisplay {
  readonly displayName: string;
  readonly description: string;
}

export const PERSONALITY_DISPLAY: Readonly<Record<PersonalityId, PersonalityDisplay>> = {
  companion: {
    displayName: "Companion",
    description: "Calm, warm and balanced — the classic Companion voice.",
  },
  friend: {
    displayName: "Friend",
    description: "Casual, encouraging and easy-going — talks with you, not at you.",
  },
  coach: {
    displayName: "Coach",
    description: "Motivating and structured — frames things as progress toward your goals.",
  },
  chef: {
    displayName: "Chef",
    description: "Enthusiastic and sensory — kitchen-minded, food-first.",
  },
  teacher: {
    displayName: "Teacher",
    description: "Explanatory and patient — leans into the why behind an answer.",
  },
  sergeant: {
    displayName: "Sergeant",
    description: "Brisk and direct — short sentences, minimal hedging.",
  },
};
