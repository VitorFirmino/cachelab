// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function loadCacheModule() {
  return import("@/service/api-cache");
}

describe("api-cache", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("tracks hits/misses and expires entries by TTL", async () => {
    const cache = await loadCacheModule();

    expect(cache.cacheGet("missing")).toBeNull();
    expect(cache.cacheStats()).toEqual({
      entries: 0,
      hits: 0,
      misses: 1,
    });

    cache.cacheSet("product:1", { id: 1 }, 1_000);
    expect(cache.cacheGet("product:1")).toEqual({ id: 1 });
    expect(cache.cacheStats()).toEqual({
      entries: 1,
      hits: 1,
      misses: 1,
    });

    vi.advanceTimersByTime(1_001);
    expect(cache.cacheGet("product:1")).toBeNull();
    expect(cache.cacheStats()).toEqual({
      entries: 0,
      hits: 1,
      misses: 2,
    });
  });

  it("clears cache, increments version and notifies listeners", async () => {
    const cache = await loadCacheModule();
    const listener = vi.fn();
    const storageSpy = vi.spyOn(Storage.prototype, "setItem");
    const unsubscribe = cache.cacheSubscribe(listener);

    cache.cacheSet("product:2", { id: 2 }, 10_000);
    cache.cacheClear();

    expect(cache.cacheGetVersion()).toBe(1);
    expect(cache.cacheStats()).toEqual({
      entries: 0,
      hits: 0,
      misses: 0,
    });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(storageSpy).toHaveBeenCalledWith(
      "cachelab:cache-clear",
      expect.any(String),
    );

    unsubscribe();
  });

  it("handles cross-tab storage invalidation events", async () => {
    const cache = await loadCacheModule();
    const listener = vi.fn();
    cache.cacheSubscribe(listener);
    cache.cacheSet("product:3", { id: 3 }, 10_000);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "cachelab:cache-clear",
        newValue: "123",
      }),
    );

    expect(cache.cacheGet("product:3")).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
