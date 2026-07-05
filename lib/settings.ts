import { cache } from "react";
import { db } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/cache";
import type { Prisma } from "@/generated/prisma/client";
import {
  SETTINGS_REGISTRY,
  type SettingKey,
  type SettingValue,
} from "@/lib/settings.constant";

const CACHE_PREFIX = "setting:";
const CACHE_TTL_SECONDS = 300;

function cacheKeyFor(key: SettingKey) {
  return `${CACHE_PREFIX}${key}`;
}

async function fetchSetting<K extends SettingKey>(
  key: K,
): Promise<SettingValue<K>> {
  const definition = SETTINGS_REGISTRY[key];

  const cached = await cacheGet<unknown>(cacheKeyFor(key));
  if (cached !== null && cached !== undefined) {
    const parsed = definition.schema.safeParse(cached);
    if (parsed.success) return parsed.data as SettingValue<K>;
    console.error(
      `[settings] cached value for "${key}" failed validation, falling back to default`,
      parsed.error,
    );
  }

  const row = await db.app_setting.findUnique({ where: { key } });
  if (row) {
    const parsed = definition.schema.safeParse(row.value);
    if (parsed.success) {
      await cacheSet(cacheKeyFor(key), parsed.data, CACHE_TTL_SECONDS);
      return parsed.data as SettingValue<K>;
    }
    console.error(
      `[settings] stored value for "${key}" failed validation, falling back to default`,
      parsed.error,
    );
  }

  const value = definition.default as SettingValue<K>;
  await cacheSet(cacheKeyFor(key), value, CACHE_TTL_SECONDS);
  return value;
}

// Deduped per request/render — repeated reads of the same key within a
// single server render only hit Redis once. Each new request still reads
// fresh, so this never masks an admin's update.
export const getSetting = cache(fetchSetting) as <K extends SettingKey>(
  key: K,
) => Promise<SettingValue<K>>;

export async function setSetting<K extends SettingKey>(
  key: K,
  value: SettingValue<K>,
) {
  const definition = SETTINGS_REGISTRY[key];
  const parsed = definition.schema.parse(value);

  await db.app_setting.upsert({
    where: { key },
    create: { key, value: parsed as Prisma.InputJsonValue },
    update: { value: parsed as Prisma.InputJsonValue },
  });

  await cacheSet(cacheKeyFor(key), parsed, CACHE_TTL_SECONDS);

  return parsed;
}

export async function getAllSettings(): Promise<{
  [K in SettingKey]: SettingValue<K>;
}> {
  const keys = Object.keys(SETTINGS_REGISTRY) as SettingKey[];
  const entries = await Promise.all(
    keys.map(async (key) => [key, await getSetting(key)] as const),
  );
  return Object.fromEntries(entries) as {
    [K in SettingKey]: SettingValue<K>;
  };
}
