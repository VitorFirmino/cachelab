"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { CACHE_TTL, cacheGet, cacheGetVersion, cacheSet, cacheSubscribe } from "@/service/api-cache";
import { cachedGet } from "@/service/api-client";
import type { ProductDetailData } from "@/lib/types";

function buildCacheKey(id: number) {
  return `/api/products?id=${id}&includeEvents=1`;
}

export function useProduct(id: number, initialData?: ProductDetailData) {
  const cacheVersion = useSyncExternalStore(cacheSubscribe, cacheGetVersion, cacheGetVersion);
  const mountVersionRef = useRef(cacheVersion);
  const key = buildCacheKey(id);
  const initialCachedData = cacheGet<ProductDetailData>(key);
  const [fetchedData, setFetchedData] = useState<ProductDetailData | null>(
    initialData ?? initialCachedData,
  );
  const hasInvalidated = cacheVersion !== mountVersionRef.current;
  const data = hasInvalidated ? (fetchedData ?? initialData) : (initialData ?? fetchedData);
  const [isLoading, setIsLoading] = useState(!data);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (initialData) {
      cacheSet(key, initialData, CACHE_TTL.product);
    }
  }, [initialData, key]);

  useEffect(() => {
    if (initialData && cacheVersion === mountVersionRef.current) return;

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await cachedGet<ProductDetailData>(
          "/products",
          { id, includeEvents: 1 },
          CACHE_TTL.product,
        );
        if (!cancelled) setFetchedData(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();

    return () => { cancelled = true; };
  }, [initialData, id, key, cacheVersion]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await cachedGet<ProductDetailData>(
        "/products",
        { id, includeEvents: 1 },
        CACHE_TTL.product,
      );
      setFetchedData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  return { data, isLoading: initialData ? false : isLoading, error, refresh };
}
