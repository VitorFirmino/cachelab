import { describe, expect, it } from "vitest";

import { getHeaderValue, inferCacheStatus } from "@/lib/cache";

describe("inferCacheStatus", () => {
  it("maps cf-cache-status values", () => {
    expect(inferCacheStatus(new Headers({ "cf-cache-status": "HIT" }))).toBe("HIT");
    expect(inferCacheStatus(new Headers({ "cf-cache-status": "REVALIDATED" }))).toBe("STALE");
    expect(inferCacheStatus(new Headers({ "cf-cache-status": "EXPIRED" }))).toBe("STALE");
    expect(inferCacheStatus(new Headers({ "cf-cache-status": "MISS" }))).toBe("BYPASS");
    expect(inferCacheStatus(new Headers({ "cf-cache-status": "DYNAMIC" }))).toBe("BYPASS");
  });

  it("returns BYPASS for no-store cache-control", () => {
    const headers = new Headers({ "cache-control": "private, no-store, max-age=0" });
    expect(inferCacheStatus(headers)).toBe("BYPASS");
  });

  it("uses fallback for unknown inputs", () => {
    expect(inferCacheStatus(new Headers())).toBe("UNKNOWN");
    expect(inferCacheStatus(new Headers(), "BYPASS")).toBe("BYPASS");
  });
});

describe("getHeaderValue", () => {
  it("reads headers by key", () => {
    const headers = new Headers({ etag: "abc123" });
    expect(getHeaderValue(headers, "etag")).toBe("abc123");
  });
});
