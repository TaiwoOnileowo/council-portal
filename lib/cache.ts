import { redis } from "./redis";
import { logger } from "./logger";

// Next's patched `fetch` throws this internally (during `next build`'s static
// generation attempt, or an ISR revalidation) to signal "this route reads
// live data, render it dynamically" — it's control flow, not a real failure.
// Swallowing it here would both misreport a cache outage AND stop Next from
// ever seeing the signal it needs to mark the route dynamic.
function isDynamicServerUsageError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    (err as { digest?: unknown }).digest === "DYNAMIC_SERVER_USAGE"
  );
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    return await redis.get<T>(key);
  } catch (err) {
    if (isDynamicServerUsageError(err)) throw err;
    logger.error("[cache]", "get failed, treating as miss", { key, err });
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds?: number,
): Promise<void> {
  try {
    if (ttlSeconds && ttlSeconds > 0) {
      await redis.setex(key, ttlSeconds, value);
    } else {
      await redis.set(key, value);
    }
  } catch (err) {
    if (isDynamicServerUsageError(err)) throw err;
    logger.error("[cache]", "set failed, skipping cache write", { key, err });
  }
}

export async function cacheDel(key: string): Promise<void> {
  await redis.del(key);
}

// Atomically increments key. Sets TTL on first increment (when key is created).
export async function cacheIncr(
  key: string,
  ttlSeconds?: number,
): Promise<number> {
  const value = await redis.incr(key);
  if (value === 1 && ttlSeconds && ttlSeconds > 0) {
    await redis.expire(key, ttlSeconds);
  }
  return value;
}

export async function cacheSetIfNotExists(
  key: string,
  value: string,
  ttlSeconds?: number,
): Promise<boolean> {
  const opts =
    ttlSeconds && ttlSeconds > 0
      ? { nx: true as const, ex: ttlSeconds }
      : { nx: true as const };
  const result = await redis.set(key, value, opts);
  return result === "OK";
}
