import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetFeaturedProducts = vi.fn();
const mockGetCategories = vi.fn();

vi.mock("@/service/data", () => ({
  getFeaturedProducts: mockGetFeaturedProducts,
  getCategories: mockGetCategories,
}));

describe("simple API routes", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("GET /api/featured returns cached products payload", async () => {
    const { GET } = await import("@/app/api/featured/route");
    mockGetFeaturedProducts.mockResolvedValueOnce([{ id: 1, name: "Mouse" }]);

    const response = await GET(new Request("http://localhost/api/featured"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(
      "public, s-maxage=60, stale-while-revalidate=120",
    );
    expect(body.data.products).toEqual([{ id: 1, name: "Mouse" }]);
    expect(mockGetFeaturedProducts).toHaveBeenCalledWith(6, undefined);
  });

  it("GET /api/categories returns cached categories payload", async () => {
    const { GET } = await import("@/app/api/categories/route");
    mockGetCategories.mockResolvedValueOnce([{ id: 5, name: "Peripherals" }]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(
      "public, s-maxage=300, stale-while-revalidate=600",
    );
    expect(body.data).toEqual([{ id: 5, name: "Peripherals" }]);
  });
});
