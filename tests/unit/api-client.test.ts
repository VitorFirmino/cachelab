import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCacheGet = vi.fn();
const mockCacheSet = vi.fn();
const mockApiGet = vi.fn();

vi.mock("@/service/api-cache", () => ({
  cacheGet: mockCacheGet,
  cacheSet: mockCacheSet,
}));

vi.mock("axios", () => ({
  default: {
    create: () => ({
      get: mockApiGet,
    }),
  },
}));

async function loadApiClient() {
  return import("@/service/api-client");
}

describe("cachedGet", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.spyOn(performance, "now").mockReturnValueOnce(100).mockReturnValueOnce(118.7);
  });

  it("returns cached data when present", async () => {
    const { cachedGet, getLastRequest } = await loadApiClient();
    mockCacheGet.mockReturnValueOnce({ ok: true });

    const result = await cachedGet<{ ok: boolean }>("/products", { page: 1, q: "abc" }, 1000);

    expect(result).toEqual({ ok: true });
    expect(mockApiGet).not.toHaveBeenCalled();
    expect(getLastRequest()).toEqual({
      url: "/products?page=1&q=abc",
      hit: true,
      durationMs: 0,
    });
  });

  it("fetches, caches and tracks request metadata", async () => {
    const { cachedGet, getLastRequest } = await loadApiClient();
    mockCacheGet.mockReturnValueOnce(null);
    mockApiGet.mockResolvedValueOnce({
      data: { data: { items: [1, 2], total: 2 } },
    });

    const result = await cachedGet<{ items: number[]; total: number }>(
      "/products",
      { q: "abc", page: 2, empty: "", ignored: undefined },
      5000,
    );

    expect(mockApiGet).toHaveBeenCalledWith("/products", {
      params: { q: "abc", page: "2" },
    });
    expect(mockCacheSet).toHaveBeenCalledWith(
      "/products?page=2&q=abc",
      { items: [1, 2], total: 2 },
      5000,
    );
    expect(result).toEqual({ items: [1, 2], total: 2 });
    expect(getLastRequest()).toEqual({
      url: "/products?page=2&q=abc",
      hit: false,
      durationMs: 19,
    });
  });

  it("does not cache when ttl is undefined", async () => {
    const { cachedGet } = await loadApiClient();
    mockCacheGet.mockReturnValueOnce(null);
    mockApiGet.mockResolvedValueOnce({ data: { data: { value: 42 } } });

    const result = await cachedGet<{ value: number }>("/pulse");

    expect(result).toEqual({ value: 42 });
    expect(mockCacheSet).not.toHaveBeenCalled();
  });
});
