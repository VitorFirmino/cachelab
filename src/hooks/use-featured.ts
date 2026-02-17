"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { CACHE_TTL, cacheGet, cacheGetVersion, cacheSet, cacheSubscribe } from "@/service/api-cache";
import { cachedGet } from "@/service/api-client";
import type { FeaturedData } from "@/lib/types";

const CACHE_KEY = "/api/featured?";

export function useFeatured(initialData?: FeaturedData) {
  const cacheVersion = useSyncExternalStore(cacheSubscribe, cacheGetVersion, cacheGetVersion);
  const mountVersionRef = useRef(cacheVersion);
  const initialCachedData = cacheGet<FeaturedData>(CACHE_KEY);
  const [fetchedData, setFetchedData] = useState<FeaturedData | null>(
    initialData ?? initialCachedData,
  );
  const hasInvalidated = cacheVersion !== mountVersionRef.current;
  const data = hasInvalidated ? (fetchedData ?? initialData) : (initialData ?? fetchedData);
  const [isLoading, setIsLoading] = useState(!data);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (initialData) {
      cacheSet(CACHE_KEY, initialData, CACHE_TTL.featured);
    }
  }, [initialData]);

  useEffect(() => {
    if (initialData && cacheVersion === mountVersionRef.current) return;

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await cachedGet<FeaturedData>("/featured", {}, CACHE_TTL.featured);
        if (!cancelled) setFetchedData(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();

    return () => { cancelled = true; };
  }, [initialData, cacheVersion]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await cachedGet<FeaturedData>("/featured", {}, CACHE_TTL.featured);
      setFetchedData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading: initialData ? false : isLoading, error, refresh };
}
