// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCachedGet = vi.fn();
const mockCacheGet = vi.fn();
const mockCacheSet = vi.fn();
const mockCacheSubscribe = vi.fn(() => () => {});
const mockCacheGetVersion = vi.fn(() => 0);

vi.mock("@/service/api-client", () => ({
  cachedGet: mockCachedGet,
}));

vi.mock("@/service/api-cache", () => ({
  CACHE_TTL: { products: 60_000 },
  cacheGet: mockCacheGet,
  cacheSet: mockCacheSet,
  cacheSubscribe: mockCacheSubscribe,
  cacheGetVersion: mockCacheGetVersion,
}));

describe("useProducts", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
    mockCacheGetVersion.mockReturnValue(0);
  });

  it("uses initial data and skips first load when request nonce is absent", async () => {
    const initialData = {
      items: [{ id: 1, name: "Mouse" }],
      total: 1,
      page: 1,
      pageSize: 6,
    };
    const { useProducts } = await import("@/hooks/use-products");

    const { result } = renderHook(() => useProducts({ page: 1 }, initialData));

    expect(result.current.data).toEqual(initialData);
    expect(result.current.isLoading).toBe(false);
    await waitFor(() => {
      expect(mockCacheSet).toHaveBeenCalled();
    });
    expect(mockCachedGet).not.toHaveBeenCalled();
  });

  it("forces fetch when request nonce is provided", async () => {
    const fetched = {
      items: [{ id: 2, name: "Keyboard" }],
      total: 1,
      page: 1,
      pageSize: 6,
    };
    mockCachedGet.mockResolvedValueOnce(fetched);
    const { useProducts } = await import("@/hooks/use-products");

    const { result } = renderHook(() =>
      useProducts({ page: 1, requestNonce: "checkout-123" }, {
        items: [],
        total: 0,
        page: 1,
        pageSize: 6,
      }),
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(fetched);
    });
    expect(mockCachedGet).toHaveBeenCalledWith(
      "/products",
      {
        page: 1,
        pageSize: 6,
        categoryId: undefined,
        query: undefined,
        _r: "checkout-123",
      },
      60_000,
    );
  });

  it("refreshes products and exposes fetch errors", async () => {
    const initialFetch = {
      items: [{ id: 3, name: "Monitor" }],
      total: 1,
      page: 1,
      pageSize: 6,
    };
    mockCachedGet.mockResolvedValueOnce(initialFetch);
    const { useProducts } = await import("@/hooks/use-products");
    const { result } = renderHook(() => useProducts({ page: 1 }));

    await waitFor(() => {
      expect(result.current.data).toEqual(initialFetch);
    });

    const expectedError = new Error("refresh failed");
    mockCachedGet.mockRejectedValueOnce(expectedError);
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.error).toEqual(expectedError);
  });
});
