import { useEffect } from "react";

const DEFAULT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

type StoredDraft<T> = {
  value: T;
  savedAt: number;
};

export function readLocalDraft<T>(key: string, maxAgeMs = DEFAULT_MAX_AGE_MS): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredDraft<T>;
    if (Date.now() - stored.savedAt > maxAgeMs) {
      window.localStorage.removeItem(key);
      return null;
    }
    return stored.value;
  } catch {
    return null;
  }
}

export function clearLocalDraft(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

export function writeLocalDraft<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  const stored: StoredDraft<T> = { value, savedAt: Date.now() };
  window.localStorage.setItem(key, JSON.stringify(stored));
}

export function useLocalStorageDraft<T>(key: string | null, value: T) {
  useEffect(() => {
    if (!key) return;
    writeLocalDraft(key, value);
  }, [key, value]);
}
