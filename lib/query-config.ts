export const STALE = {
  REALTIME: 0,
  FREQUENT: 30_000,
  MODERATE: 5 * 60_000,
  SLOW: 30 * 60_000,
  STATIC: Infinity,
} as const;
