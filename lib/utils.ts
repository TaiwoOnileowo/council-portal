import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
