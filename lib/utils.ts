import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { distance } from "fastest-levenshtein";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const inputClass = (err?: string, size: "sm" | "md" = "md") =>
  size === "sm"
    ? `w-full text-[13.5px] text-portal-text bg-portal-accent-bg/50 border ${
        err
          ? "border-red-400 focus:ring-red-300"
          : "border-portal-border focus:border-portal-accent focus:ring-portal-accent/30"
      } rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition-all`
    : `w-full rounded-lg border ${
        err
          ? "border-red-400 focus:border-red-400 focus:ring-red-400"
          : "border-portal-border focus:border-portal-accent focus:ring-portal-accent"
      } bg-white px-4 py-3 text-[15px] text-portal-text placeholder:text-portal-muted outline-none focus:ring-1 transition`;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


export function stripTrailingParenthetical(name: string): string {
  return name.replace(/\s*\([^()]*\)\s*$/, "").trim();
}

/**
 * Ranks how closely `name` matches `query` for search relevance — lower is a
 * closer match. Returns -1 when `query` isn't found in `name` at all.
 * 0 = exact match, 1 = starts with query, 2 = query starts a word within
 * name (e.g. "ago" in "Ago Palace" or ".../OGOMBO"), 3 = query appears
 * mid-word (e.g. "ago" inside "Magodo").
 */
export function textMatchRank(name: string, query: string): number {
  const q = query.trim();
  if (!q) return -1;
  const n = name.toLowerCase();
  const lq = q.toLowerCase();
  if (n === lq) return 0;
  if (n.startsWith(lq)) return 1;
  if (!n.includes(lq)) return -1;
  const wordBoundary = new RegExp(`[^a-z0-9]${escapeRegExp(lq)}`, "i");
  return wordBoundary.test(name) ? 2 : 3;
}

export function similarityPercent(a: string, b: string): number {
  if (!a && !b) return 100;
  if (!a || !b) return 0;
  const maxLength = Math.max(a.length, b.length);
  return Math.round(((maxLength - distance(a, b)) / maxLength) * 100);
}
