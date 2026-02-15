import axios from "axios";

import { cacheGet, cacheSet } from "./api-cache";

const api = axios.create({
  baseURL: "/api",
});

let lastRequest: { url: string; hit: boolean; durationMs: number } | null = null;

export function getLastRequest() {
  return lastRequest;
}

export async function cachedGet<T>(
  url: string,
  params?: Record<string, string | number | undefined>,
  ttlMs?: number,
): Promise<T> {
  const cleanParams: Record<string, string> = {};
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") cleanParams[k] = String(v);
    }
  }

  const sortedEntries = Object.entries(cleanParams).sort(([a], [b]) => a.localeCompare(b));
  const key = `${url}?${sortedEntries.map(([k, v]) => `${k}=${v}`).join("&")}`;

  const cached = cacheGet<T>(key);
  if (cached !== null) {
    lastRequest = { url: key, hit: true, durationMs: 0 };
    return cached;
  }

  const start = performance.now();
  const { data } = await api.get<{ data: T }>(url, { params: cleanParams });
  const durationMs = Math.round(performance.now() - start);

  const result = data.data;
  if (ttlMs) {
    cacheSet(key, result, ttlMs);
  }

  lastRequest = { url: key, hit: false, durationMs };
  return result;
}
