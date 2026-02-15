"use client";

import { useCallback, useEffect, useState } from "react";

import { CACHE_TTL, cacheGet, cacheSet } from "@/service/api-cache";
import { cachedGet } from "@/service/api-client";
import type { FeaturedData } from "@/lib/types";

const CACHE_KEY = "/api/featured?";

export function useFeatured(initialData?: FeaturedData) {
  const initialCachedData = initialData ?? cacheGet<FeaturedData>(CACHE_KEY);
  const [data, setData] = useState<FeaturedData | null>(initialCachedData);
  const [isLoading, setIsLoading] = useState(!initialCachedData);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (initialData) {
      cacheSet(CACHE_KEY, initialData, CACHE_TTL.featured);
    }
  }, [initialData]);

  useEffect(() => {
    if (initialData) return;

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await cachedGet<FeaturedData>("/featured", {}, CACHE_TTL.featured);
        if (!cancelled) setData(result);
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
      const result = await cachedGet<FeaturedData>("/featured", {}, CACHE_TTL.featured);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, refresh };
}
