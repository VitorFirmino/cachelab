"use client";

import { useCallback, useEffect, useState } from "react";

import { CACHE_TTL, cacheGet, cacheSet } from "@/service/api-cache";
import { cachedGet } from "@/service/api-client";
import type { ProductDetailData } from "@/lib/types";

function buildCacheKey(id: number) {
  return `/api/products?id=${id}&includeEvents=1`;
}

export function useProduct(id: number, initialData?: ProductDetailData) {
  const key = buildCacheKey(id);
  const initialCachedData = initialData ?? cacheGet<ProductDetailData>(key);

  const [data, setData] = useState<ProductDetailData | null>(initialCachedData);
  const [isLoading, setIsLoading] = useState(!initialCachedData);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (initialData) {
      cacheSet(key, initialData, CACHE_TTL.product);
    }
  }, [initialData, key]);

  useEffect(() => {
    if (initialData) return;

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
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();

    return () => { cancelled = true; };
  }, [initialData, id, key]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await cachedGet<ProductDetailData>(
        "/products",
        { id, includeEvents: 1 },
        CACHE_TTL.product,
      );
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  return { data, isLoading, error, refresh };
}
