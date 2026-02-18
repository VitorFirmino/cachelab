"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { CACHE_TTL, cacheGet, cacheGetVersion, cacheSet, cacheSubscribe } from "@/service/api-cache";
import { cachedGet } from "@/service/api-client";
import type { FeaturedData } from "@/lib/types";

const CACHE_KEY = "/api/featured?";

export function useFeatured(initialData?: FeaturedData, requestNonce?: string) {
  const cacheVersion = useSyncExternalStore(cacheSubscribe, cacheGetVersion, cacheGetVersion);
  const mountVersionRef = useRef(cacheVersion);
  const key = requestNonce ? `${CACHE_KEY}_r=${requestNonce}` : CACHE_KEY;
  const initialCachedData = cacheGet<FeaturedData>(key);
  const [fetchedData, setFetchedData] = useState<FeaturedData | null>(
    initialCachedData ?? initialData ?? null,
  );
  const data = fetchedData ?? initialData ?? null;
  const [isLoading, setIsLoading] = useState(!data);
  const [error, setError] = useState<Error | null>(null);
  const canTrustInitialPayload =
    cacheVersion === 0 && !initialCachedData;

  useEffect(() => {
    if (initialData && canTrustInitialPayload) {
      cacheSet(key, initialData, CACHE_TTL.featured);
    }
  }, [initialData, canTrustInitialPayload, key]);

  useEffect(() => {
    if (initialData && canTrustInitialPayload) return;

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await cachedGet<FeaturedData>(
          "/featured",
          requestNonce ? { _r: requestNonce } : {},
          CACHE_TTL.featured,
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
  }, [initialData, cacheVersion, canTrustInitialPayload, requestNonce]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await cachedGet<FeaturedData>(
        "/featured",
        requestNonce ? { _r: requestNonce } : {},
        CACHE_TTL.featured,
      );
      setFetchedData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [requestNonce]);

  return { data, isLoading: initialData ? false : isLoading, error, refresh };
}
