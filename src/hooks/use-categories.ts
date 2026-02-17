"use client";

import { useCallback, useEffect, useState } from "react";

import { CACHE_TTL, cacheGet, cacheSet } from "@/service/api-cache";
import { cachedGet } from "@/service/api-client";
import type { Category } from "@/lib/types";

const CACHE_KEY = "/api/categories?";

export function useCategories(initialData?: Category[]) {
  const initialCachedData = cacheGet<Category[]>(CACHE_KEY);
  const [fetchedData, setFetchedData] = useState<Category[] | null>(
    initialData ?? initialCachedData,
  );
  const data = initialData ?? fetchedData;
  const [isLoading, setIsLoading] = useState(!data);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (initialData) {
      cacheSet(CACHE_KEY, initialData, CACHE_TTL.categories);
    }
  }, [initialData]);

  useEffect(() => {
    if (initialData) return;

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
  }, [initialData]);

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
