import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCacheLife = vi.fn();
const mockCacheTag = vi.fn();
const mockGetCacheTTL = vi.fn();
const mockInvokeSupabaseFunction = vi.fn();

vi.mock("next/cache", () => ({
  cacheLife: mockCacheLife,
  cacheTag: mockCacheTag,
}));

vi.mock("@/lib/cache-config", () => ({
  getCacheTTL: mockGetCacheTTL,
}));

vi.mock("@/lib/supabase/functions", () => ({
  invokeSupabaseFunction: mockInvokeSupabaseFunction,
}));

async function loadDataService() {
  return import("@/service/data");
}

describe("service/data", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockGetCacheTTL.mockResolvedValue({ stale: 60, revalidate: 120, expire: 1800 });
  });

  it("returns featured products and tags cache", async () => {
    const { getFeaturedProducts } = await loadDataService();
    mockInvokeSupabaseFunction.mockResolvedValueOnce({
      products: [{ id: 1, name: "Mouse" }],
    });

    const result = await getFeaturedProducts(3);

    expect(result).toEqual([{ id: 1, name: "Mouse" }]);
    expect(mockCacheTag).toHaveBeenCalledWith("featured", "products");
    expect(mockInvokeSupabaseFunction).toHaveBeenCalledWith("catalog", {
      op: "featured",
      limit: 3,
    });
  });

  it("returns empty featured array on failure", async () => {
    const { getFeaturedProducts } = await loadDataService();
    mockInvokeSupabaseFunction.mockRejectedValueOnce(new Error("edge failed"));

    await expect(getFeaturedProducts()).resolves.toEqual([]);
  });

  it("returns products page and trims query", async () => {
    const { getProductsPage } = await loadDataService();
    mockInvokeSupabaseFunction.mockResolvedValueOnce({ items: [{ id: 2 }], total: 1 });

    const result = await getProductsPage({
      page: 2,
      pageSize: 6,
      categoryId: 4,
      query: "  keyboard  ",
      cacheBust: "nonce",
    });

    expect(result).toEqual({ items: [{ id: 2 }], total: 1 });
    expect(mockCacheTag).toHaveBeenCalledWith("products");
    expect(mockInvokeSupabaseFunction).toHaveBeenCalledWith("catalog", {
      op: "productsPage",
      page: 2,
      pageSize: 6,
      categoryId: 4,
      query: "keyboard",
      cacheBust: "nonce",
    });
  });

  it("returns product details and events fallbacks", async () => {
    const { getProductById, getProductEvents } = await loadDataService();
    mockInvokeSupabaseFunction
      .mockResolvedValueOnce({ product: { id: 10, name: "Monitor" } })
      .mockRejectedValueOnce(new Error("events failed"));

    await expect(getProductById(10, "n1")).resolves.toEqual({ id: 10, name: "Monitor" });
    await expect(getProductEvents(10, 5, "n1")).resolves.toEqual([]);
    expect(mockCacheTag).toHaveBeenCalledWith("product", "products", "product:10");
    expect(mockCacheTag).toHaveBeenCalledWith("events", "product:10");
  });

  it("returns categories fallback on error", async () => {
    const { getCategories } = await loadDataService();
    mockInvokeSupabaseFunction.mockRejectedValueOnce(new Error("categories failed"));

    await expect(getCategories()).resolves.toEqual([]);
    expect(mockCacheTag).toHaveBeenCalledWith("categories");
  });
});
