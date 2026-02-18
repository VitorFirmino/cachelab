"use client";

import { useCallback, useEffect, useState } from "react";

import { CACHE_TTL, cacheGet } from "@/service/api-cache";
import { cachedGet } from "@/service/api-client";
import type { ProductDetailData } from "@/lib/types";

function buildCacheKey(id: number) {
  return `/api/products?id=${id}&includeEvents=1`;
}

export function useProduct(id: number, initialData?: ProductDetailData, requestNonce?: string) {
  const requestKey = requestNonce?.trim();
  const key = requestKey ? `${buildCacheKey(id)}&_r=${requestKey}` : buildCacheKey(id);
  const initialCachedData = cacheGet<ProductDetailData>(key);
  const [fetchedData, setFetchedData] = useState<ProductDetailData | null>(
    initialData ?? initialCachedData,
  );
  const data = fetchedData ?? initialData;
  const [isLoading, setIsLoading] = useState(!data);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await cachedGet<ProductDetailData>(
          "/products",
          requestKey ? { id, includeEvents: 1, _r: requestKey } : { id, includeEvents: 1 },
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
  }, [id, key, requestKey]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await cachedGet<ProductDetailData>(
        "/products",
        requestKey ? { id, includeEvents: 1, _r: requestKey } : { id, includeEvents: 1 },
        CACHE_TTL.product,
      );
      setFetchedData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [id, requestKey]);

  return { data, isLoading: initialData ? false : isLoading, error, refresh };
}
