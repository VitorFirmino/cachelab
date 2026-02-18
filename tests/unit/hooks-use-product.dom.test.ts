// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCachedGet = vi.fn();
const mockCacheGet = vi.fn();

vi.mock("@/service/api-client", () => ({
  cachedGet: mockCachedGet,
}));

vi.mock("@/service/api-cache", () => ({
  CACHE_TTL: { product: 300_000 },
  cacheGet: mockCacheGet,
}));

describe("useProduct", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it("loads product details with request nonce", async () => {
    const payload = {
      product: { id: 1, name: "Mouse" },
      events: [{ id: 1, type: "sale" }],
    };
    mockCachedGet.mockResolvedValueOnce(payload);
    const { useProduct } = await import("@/hooks/use-product");

    const { result } = renderHook(() => useProduct(1, undefined, "nonce-1"));

    await waitFor(() => {
      expect(result.current.data).toEqual(payload);
      expect(result.current.isLoading).toBe(false);
    });
    expect(mockCachedGet).toHaveBeenCalledWith(
      "/products",
      { id: 1, includeEvents: 1, _r: "nonce-1" },
      300_000,
    );
  });

  it("keeps loading false with initial data and supports refresh", async () => {
    const initialData = {
      product: { id: 2, name: "Keyboard" },
      events: [],
    };
    mockCachedGet.mockResolvedValueOnce(initialData);
    const { useProduct } = await import("@/hooks/use-product");
    const { result } = renderHook(() => useProduct(2, initialData));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual(initialData);

    mockCachedGet.mockResolvedValueOnce({
      product: { id: 2, name: "Keyboard Pro" },
      events: [],
    });
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.data).toEqual({
      product: { id: 2, name: "Keyboard Pro" },
      events: [],
    });
  });

  it("captures fetch errors", async () => {
    const expectedError = new Error("product fetch failed");
    mockCachedGet.mockRejectedValueOnce(expectedError);
    const { useProduct } = await import("@/hooks/use-product");
    const { result } = renderHook(() => useProduct(5));

    await waitFor(() => {
      expect(result.current.error).toEqual(expectedError);
      expect(result.current.isLoading).toBe(false);
    });
  });
});
