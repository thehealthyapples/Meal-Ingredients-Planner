import { db } from "../db";
import { recipeSourceSettings, recipeSourceAuditLog } from "@shared/schema";
import { isNull } from "drizzle-orm";


export type SourceKey =
  | "themealdb" | "bbcgoodfood" | "allrecipes" | "jamieoliver" | "seriouseats"
  | "edamam" | "apininjas" | "bigoven" | "fatsecret";

export interface SourceMeta {
  sourceKey: SourceKey;
  label: string;
  sourceType: "official_api" | "scraped";
  defaultEnabled: boolean;
}

export const ALL_SOURCES: SourceMeta[] = [
  { sourceKey: "themealdb",    label: "TheMealDB",          sourceType: "official_api", defaultEnabled: true },
  { sourceKey: "edamam",       label: "Edamam",             sourceType: "official_api", defaultEnabled: false },
  { sourceKey: "apininjas",    label: "API-Ninjas Recipes", sourceType: "official_api", defaultEnabled: false },
  { sourceKey: "bigoven",      label: "BigOven",            sourceType: "official_api", defaultEnabled: false },
  { sourceKey: "fatsecret",    label: "FatSecret",          sourceType: "official_api", defaultEnabled: false },
  { sourceKey: "bbcgoodfood",  label: "BBC Good Food",      sourceType: "scraped",      defaultEnabled: true },
  { sourceKey: "allrecipes",   label: "AllRecipes",         sourceType: "scraped",      defaultEnabled: true },
  { sourceKey: "jamieoliver",  label: "Jamie Oliver",       sourceType: "scraped",      defaultEnabled: true },
  { sourceKey: "seriouseats",  label: "Serious Eats",       sourceType: "scraped",      defaultEnabled: true },
];

const DOMAIN_TO_SOURCE: Record<string, SourceKey> = {
  "bbcgoodfood.com":   "bbcgoodfood",
  "www.bbcgoodfood.com": "bbcgoodfood",
  "allrecipes.com":    "allrecipes",
  "www.allrecipes.com": "allrecipes",
  "jamieoliver.com":   "jamieoliver",
  "www.jamieoliver.com": "jamieoliver",
  "seriouseats.com":   "seriouseats",
  "www.seriouseats.com": "seriouseats",
};

const SOURCE_REQUIRED_CREDS: Record<string, string[]> = {
  edamam:    ["EDAMAM_APP_ID", "EDAMAM_APP_KEY"],
  apininjas: ["API_NINJAS_API_KEY"],
  bigoven:   ["BIGOVEN_API_KEY"],
  fatsecret: ["FATSECRET_CLIENT_ID", "FATSECRET_CLIENT_SECRET"],
};

let cache: Map<string, boolean> | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 30_000;

export function invalidateCache(): void {
  cache = null;
  cacheExpiry = 0;
}

async function loadCache(): Promise<Map<string, boolean>> {
  if (cache && Date.now() < cacheExpiry) return cache;
  const rows = await db.select().from(recipeSourceSettings);
  const map = new Map<string, boolean>();
  for (const row of rows) {
    map.set(row.sourceKey, row.enabled);
  }
  cache = map;
  cacheExpiry = Date.now() + CACHE_TTL_MS;
  return map;
}

export async function isSourceEnabled(key: string): Promise<boolean> {
  const map = await loadCache();
  if (map.has(key)) return map.get(key)!;
  const meta = ALL_SOURCES.find(s => s.sourceKey === key);
  return meta?.defaultEnabled ?? true;
}

export function getCredentialStatus(key: string): "configured" | "missing" {
  const required = SOURCE_REQUIRED_CREDS[key];
  if (!required) return "configured";
  const allPresent = required.every(envKey => !!process.env[envKey]);
  return allPresent ? "configured" : "missing";
}

export async function isSourceCallable(key: string): Promise<boolean> {
  const enabled = await isSourceEnabled(key);
  if (!enabled) return false;
  return getCredentialStatus(key) === "configured";
}

export function getSourceKeyForUrl(url: string): SourceKey | null {
  try {
    const { hostname } = new URL(url);
    return DOMAIN_TO_SOURCE[hostname] ?? null;
  } catch {
    return null;
  }
}

export async function logAuditEvent(event: {
  userId?: number | null;
  action: "search" | "import";
  sourceName: string;
  urlOrQuery?: string | null;
  reason: "source_disabled" | "missing_credentials" | "upstream_error";
}): Promise<void> {
  try {
    await db.insert(recipeSourceAuditLog).values({
      userId: event.userId ?? null,
      action: event.action,
      sourceName: event.sourceName,
      urlOrQuery: event.urlOrQuery ?? null,
      reason: event.reason,
    });
  } catch (e) {
    console.warn("[recipe-source-gate] Failed to log audit event:", e);
  }
}

export async function seedSourceSettings(): Promise<void> {
  try {
    for (const source of ALL_SOURCES) {
      await db
        .insert(recipeSourceSettings)
        .values({
          sourceKey: source.sourceKey,
          enabled: source.defaultEnabled,
          sourceType: source.sourceType,
        })
        .onConflictDoUpdate({
          target: recipeSourceSettings.sourceKey,
          set: { enabled: source.defaultEnabled, sourceType: source.sourceType },
          setWhere: isNull(recipeSourceSettings.adminUpdatedAt),
        });
    }
    invalidateCache();
  } catch (e) {
    console.warn("[recipe-source-gate] Failed to seed source settings:", e);
  }
}

export async function getAllSourceSettings(): Promise<Array<RecipeSourceSettings & { credentialStatus: "configured" | "missing" }>> {
  const rows = await db.select().from(recipeSourceSettings);
  const rowMap = new Map(rows.map(r => [r.sourceKey, r]));
  return ALL_SOURCES.map(meta => {
    const row = rowMap.get(meta.sourceKey);
    return {
      id: row?.id ?? 0,
      sourceKey: meta.sourceKey,
      enabled: row ? row.enabled : meta.defaultEnabled,
      sourceType: meta.sourceType,
      updatedAt: row?.updatedAt ?? new Date(),
      adminUpdatedAt: row?.adminUpdatedAt ?? null,
      credentialStatus: getCredentialStatus(meta.sourceKey),
    };
  });
}

interface RecipeSourceSettings {
  id: number;
  sourceKey: string;
  enabled: boolean;
  sourceType: string;
  updatedAt: Date;
  adminUpdatedAt: Date | null;
}

export async function updateSourceSettings(updates: Array<{ sourceKey: string; enabled: boolean }>): Promise<void> {
  const now = new Date();
  for (const { sourceKey, enabled } of updates) {
    const meta = ALL_SOURCES.find(s => s.sourceKey === sourceKey);
    await db
      .insert(recipeSourceSettings)
      .values({ sourceKey, enabled, sourceType: meta?.sourceType ?? "scraped", updatedAt: now, adminUpdatedAt: now })
      .onConflictDoUpdate({
        target: recipeSourceSettings.sourceKey,
        set: { enabled, updatedAt: now, adminUpdatedAt: now },
      });
  }
  invalidateCache();
}

export async function getAuditLogs(opts: {
  page?: number;
  pageSize?: number;
  sourceName?: string;
  reason?: string;
}): Promise<{ logs: any[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 50));

  const rows = await db.select().from(recipeSourceAuditLog).orderBy(recipeSourceAuditLog.createdAt);
  const filtered = rows.filter(r => {
    if (opts.sourceName && r.sourceName !== opts.sourceName) return false;
    if (opts.reason && r.reason !== opts.reason) return false;
    return true;
  });
  const logs = filtered.slice((page - 1) * pageSize, page * pageSize);
  return { logs, total: filtered.length, page, pageSize };
}
