"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { CACHE_TTL, cacheGet, cacheGetVersion, cacheSet, cacheSubscribe } from "@/service/api-cache";
import { cachedGet } from "@/service/api-client";
import type { Category } from "@/lib/types";

const CACHE_KEY = "/api/categories?";

export function useCategories(initialData?: Category[]) {
  const cacheVersion = useSyncExternalStore(cacheSubscribe, cacheGetVersion, cacheGetVersion);
  const mountVersionRef = useRef(cacheVersion);
  const initialCachedData = cacheGet<Category[]>(CACHE_KEY);
  const [fetchedData, setFetchedData] = useState<Category[] | null>(
    initialData ?? initialCachedData,
  );
  const hasInvalidated = cacheVersion !== mountVersionRef.current;
  const data = hasInvalidated ? (fetchedData ?? initialData) : (initialData ?? fetchedData);
  const [isLoading, setIsLoading] = useState(!data);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (initialData && cacheVersion === mountVersionRef.current) {
      cacheSet(CACHE_KEY, initialData, CACHE_TTL.categories);
    }
  }, [initialData, cacheVersion]);

  useEffect(() => {
    if (initialData && cacheVersion === mountVersionRef.current) return;

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await cachedGet<Category[]>("/categories", {}, CACHE_TTL.categories);
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
      const result = await cachedGet<Category[]>("/categories", {}, CACHE_TTL.categories);
      setFetchedData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading: initialData ? false : isLoading, error, refresh };
}
