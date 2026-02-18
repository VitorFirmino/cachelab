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
  CACHE_TTL: {
    featured: 180_000,
    categories: 300_000,
  },
  cacheGet: mockCacheGet,
  cacheSet: mockCacheSet,
  cacheSubscribe: mockCacheSubscribe,
  cacheGetVersion: mockCacheGetVersion,
}));

describe("useFeatured", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it("uses initial data, writes cache, and skips first fetch", async () => {
    const initialData = { products: [{ id: 1, name: "Mouse" }] };
    const { useFeatured } = await import("@/hooks/use-featured");

    const { result } = renderHook(() => useFeatured(initialData));

    expect(result.current.data).toEqual(initialData);
    expect(result.current.isLoading).toBe(false);
    await waitFor(() => {
      expect(mockCacheSet).toHaveBeenCalledWith("/api/featured?", initialData, 180_000);
    });
    expect(mockCachedGet).not.toHaveBeenCalled();
  });

  it("fetches featured data when no initial data is provided", async () => {
    const fetched = { products: [{ id: 2, name: "Keyboard" }] };
    mockCachedGet.mockResolvedValueOnce(fetched);
    const { useFeatured } = await import("@/hooks/use-featured");

    const { result } = renderHook(() => useFeatured());

    await waitFor(() => {
      expect(result.current.data).toEqual(fetched);
      expect(result.current.isLoading).toBe(false);
    });
    expect(mockCachedGet).toHaveBeenCalledWith("/featured", {}, 180_000);
  });

  it("refresh updates featured state", async () => {
    const fetched = { products: [{ id: 3, name: "Monitor" }] };
    mockCachedGet.mockResolvedValueOnce(fetched);
    const { useFeatured } = await import("@/hooks/use-featured");
    const { result } = renderHook(() => useFeatured());

    await waitFor(() => expect(result.current.data).toEqual(fetched));
    mockCachedGet.mockResolvedValueOnce({ products: [{ id: 4, name: "Headset" }] });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.data).toEqual({ products: [{ id: 4, name: "Headset" }] });
  });

  it("refetches when cache was already invalidated before mount", async () => {
    const initialData = { products: [{ id: 1, name: "Stale Featured" }] };
    const fetched = { products: [{ id: 2, name: "Fresh Featured" }] };
    mockCacheGetVersion.mockReturnValue(1);
    mockCachedGet.mockResolvedValueOnce(fetched);
    const { useFeatured } = await import("@/hooks/use-featured");

    const { result } = renderHook(() => useFeatured(initialData));

    await waitFor(() => {
      expect(result.current.data).toEqual(fetched);
      expect(result.current.isLoading).toBe(false);
    });
    expect(mockCachedGet).toHaveBeenCalledWith("/featured", {}, 180_000);
  });
});

describe("useCategories", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it("uses initial categories and sets cache", async () => {
    const initialCategories = [{ id: 10, name: "Peripherals" }];
    const { useCategories } = await import("@/hooks/use-categories");

    const { result } = renderHook(() => useCategories(initialCategories));

    expect(result.current.data).toEqual(initialCategories);
    expect(result.current.isLoading).toBe(false);
    await waitFor(() => {
      expect(mockCacheSet).toHaveBeenCalledWith(
        "/api/categories?",
        initialCategories,
        300_000,
      );
    });
  });

  it("loads categories and captures errors", async () => {
    const expectedError = new Error("categories failed");
    mockCachedGet.mockRejectedValueOnce(expectedError);
    const { useCategories } = await import("@/hooks/use-categories");

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.error).toEqual(expectedError);
      expect(result.current.isLoading).toBe(false);
    });
  });
});
