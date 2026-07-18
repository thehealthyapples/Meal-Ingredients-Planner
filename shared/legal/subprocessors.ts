// BUS1 — the third parties that process household data on THA's behalf.
//
// Governing architecture: docs/architecture/ARCHITECTURE_PRINCIPLES.md
// Principle 6 — honest gaps over invented facts.
//
// WHY THIS IS A DATA FILE AND NOT A PARAGRAPH IN THE PRIVACY POLICY:
//   A sub-processor list is the single most frequently-wrong section of every
//   privacy policy in existence, because it is prose and prose is not checked
//   against the code. Holding it as structured data means the privacy page
//   renders a table built from THIS list, and adding a processor to the platform
//   without adding it here is a visible, reviewable omission rather than an
//   invisible one.
//
// EVERY ENTRY BELOW WAS READ OUT OF THE CODE, NOT ASSUMED:
//   openai   — server/intelligence/conversation/llm-provider.ts (OpenAIProvider,
//              gpt-4o-mini, the default production provider; falls back to a
//              NoOpProvider when no key is configured)
//   object-storage — server/lib/media-storage.ts (S3-compatible; provider is
//              resolved purely from the environment, local disk otherwise)
//   database — server/db.ts (PostgreSQL via DATABASE_URL)
//   email    — server/email/index.ts (SMTP; host configurable, defaults to
//              mail.privateemail.com)
//   openfoodfacts / fatsecret — food and product reference lookups
//
// THE HONESTY RULE THIS FILE FOLLOWS:
//   A processor is listed if it is WIRED, even when a given deployment has not
//   configured it. "We might send your data here, and here is the condition" is
//   the fact a household needs in order to decide anything. Listing only what a
//   particular environment happens to have switched on would make this file a
//   description of one server rather than of the product.

import type { SubProcessor } from "./types";

export const SUB_PROCESSORS: readonly SubProcessor[] = [
  {
    id: "database",
    name: "PostgreSQL database hosting",
    purpose:
      "Stores your account and everything you save in The Healthy Apples — your meals, plans, shopping lists, pantry, diary and household details.",
    dataReceived: [
      "Everything you enter into the product",
      "Your email address and the encrypted form of your password",
    ],
    location: "Configurable — set at deployment",
    activeWhen: "Always. The product cannot run without it.",
  },
  {
    id: "email",
    name: "Email delivery (SMTP)",
    purpose:
      "Sends the four emails we send: welcome, email verification, password reset, and confirmation that your account has been deleted.",
    dataReceived: ["Your email address", "The contents of that email"],
    location: "Configurable — set at deployment",
    activeWhen:
      "When an email is sent to you. If email is not configured, no email is sent and no data leaves the platform.",
  },
  {
    id: "openai",
    name: "OpenAI",
    purpose:
      "Powers the Companion's replies, and helps classify and describe food and recipe items you add.",
    dataReceived: [
      "What you type to the Companion",
      "The household context assembled for that specific question — for example your dietary restrictions, so the Companion does not suggest something you cannot eat",
      "Names of food or recipe items being classified",
    ],
    location: "United States",
    activeWhen:
      "When you talk to the Companion, or when an item you add needs classifying. If no key is configured the Companion degrades gracefully and nothing is sent.",
  },
  {
    id: "object-storage",
    name: "S3-compatible object storage",
    purpose: "Stores images you upload, such as photographs of meals or of a product label.",
    dataReceived: ["Images you upload"],
    location: "Configurable — set at deployment",
    activeWhen:
      "When you upload an image, and only if object storage is configured. Otherwise images are stored on the platform's own disk and go nowhere.",
  },
  {
    id: "openfoodfacts",
    name: "Open Food Facts",
    purpose: "Looks up product information when you scan a barcode.",
    dataReceived: [
      "The barcode you scanned",
      "No account identifier is sent — the lookup does not say who is asking",
    ],
    location: "France (European Union)",
    activeWhen: "When you scan a barcode we do not already hold.",
  },
  {
    id: "fatsecret",
    name: "FatSecret",
    purpose: "Provides nutrition reference data for foods.",
    dataReceived: [
      "The name of the food being looked up",
      "No account identifier is sent",
    ],
    location: "United States",
    activeWhen: "When nutrition reference data is needed and credentials are configured.",
  },
] as const;
