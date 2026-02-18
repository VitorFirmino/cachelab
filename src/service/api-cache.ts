interface CacheEntry<T = unknown> {
  data: T;
  expiry: number;
  timestamp: number;
}

const CACHE_CLEAR_BROADCAST_KEY = "cachelab:cache-clear";

let hits = 0;
let misses = 0;
const store = new Map<string, CacheEntry>();

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) {
    misses++;
    return null;
  }
  if (Date.now() > entry.expiry) {
    store.delete(key);
    misses++;
    return null;
  }
  hits++;
  return entry.data as T;
}

export function cacheSet<T>(key: string, data: T, ttlMs: number): void {
  store.set(key, {
    data,
    expiry: Date.now() + ttlMs,
    timestamp: Date.now(),
  });
}

let version = 0;
const listeners = new Set<() => void>();
let storageSyncInitialized = false;

function emitVersionUpdate() {
  version++;
  for (const listener of listeners) listener();
}

function ensureCrossTabSync() {
  if (storageSyncInitialized || typeof window === "undefined") return;
  storageSyncInitialized = true;

  window.addEventListener("storage", (event) => {
    if (event.key !== CACHE_CLEAR_BROADCAST_KEY || !event.newValue) return;
    store.clear();
    hits = 0;
    misses = 0;
    emitVersionUpdate();
  });
}

export function cacheClear(): void {
  store.clear();
  hits = 0;
  misses = 0;
  emitVersionUpdate();

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(CACHE_CLEAR_BROADCAST_KEY, `${Date.now()}`);
    } catch {
      // Ignore storage write failures (private mode / quota / disabled storage).
    }
  }
}

export function cacheSubscribe(listener: () => void) {
  ensureCrossTabSync();
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function cacheGetVersion() {
  return version;
}

export function cacheStats() {
  return {
    entries: store.size,
    hits,
    misses,
  };
}

export const CACHE_TTL = {
  products: 60_000,
  product: 300_000,
  categories: 300_000,
  featured: 180_000,
} as const;
