export function inferCacheStatus(headers: Headers, fallback: "BYPASS" | "UNKNOWN" = "UNKNOWN") {
  const cfStatus = headers.get("cf-cache-status")?.toUpperCase();
  if (cfStatus === "HIT" || cfStatus === "MISS" || cfStatus === "EXPIRED" || cfStatus === "REVALIDATED" || cfStatus === "DYNAMIC") {
    if (cfStatus === "HIT") return "HIT" as const;
    if (cfStatus === "REVALIDATED") return "STALE" as const;
    if (cfStatus === "EXPIRED") return "STALE" as const;
    if (cfStatus === "MISS") return "BYPASS" as const;
    if (cfStatus === "DYNAMIC") return "BYPASS" as const;
  }

  const cacheControl = headers.get("cache-control") || "";
  if (cacheControl.includes("no-store")) return "BYPASS" as const;

  return fallback;
}

export function getHeaderValue(headers: Headers, key: string) {
  return headers.get(key);
}
