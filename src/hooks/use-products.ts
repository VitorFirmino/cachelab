"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CACHE_TTL, cacheGet, cacheSet } from "@/service/api-cache";
import { cachedGet } from "@/service/api-client";
import type { ProductsPageData } from "@/lib/types";

export interface UseProductsParams {
  page?: number;
  pageSize?: number;
  categoryId?: number;
  query?: string;
}

function buildCacheKey(params: UseProductsParams) {
  const sorted = Object.entries({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 10,
    ...(params.categoryId ? { categoryId: params.categoryId } : {}),
    ...(params.query ? { query: params.query } : {}),
  }).sort(([a], [b]) => a.localeCompare(b));
  return `/api/products?${sorted.map(([k, v]) => `${k}=${v}`).join("&")}`;
}

export function useProducts(params: UseProductsParams, initialData?: ProductsPageData) {
  const key = buildCacheKey(params);
  const initialKeyRef = useRef<string | null>(initialData ? key : null);
  const initialCachedData = cacheGet<ProductsPageData>(key);
  const canUseInitialData = initialData && key === initialKeyRef.current;
  const initialResolvedData = canUseInitialData ? initialData : initialCachedData;

  const [data, setData] = useState<ProductsPageData | null>(initialResolvedData ?? null);
  const [isLoading, setIsLoading] = useState(!initialResolvedData);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (initialData) {
      cacheSet(key, initialData, CACHE_TTL.products);
    }
  }, [initialData, key]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await cachedGet<ProductsPageData>(
          "/products",
          {
            page: params.page ?? 1,
            pageSize: params.pageSize ?? 10,
            categoryId: params.categoryId,
            query: params.query,
          },
          CACHE_TTL.products,
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
  }, [key, params.page, params.pageSize, params.categoryId, params.query]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await cachedGet<ProductsPageData>(
        "/products",
        {
          page: params.page ?? 1,
          pageSize: params.pageSize ?? 10,
          categoryId: params.categoryId,
          query: params.query,
        },
        CACHE_TTL.products,
      );
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [params.page, params.pageSize, params.categoryId, params.query]);

  return { data, isLoading, error, refresh };
}
