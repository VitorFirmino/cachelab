import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetProductsPage = vi.fn();
const mockGetProductById = vi.fn();
const mockGetProductEvents = vi.fn();

vi.mock("@/service/data", () => ({
  getProductsPage: mockGetProductsPage,
  getProductById: mockGetProductById,
  getProductEvents: mockGetProductEvents,
}));

async function loadProductsRoute() {
  return import("@/app/api/products/route");
}

describe("GET /api/products", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns 400 for invalid product id", async () => {
    const { GET } = await loadProductsRoute();
    const response = await GET(new Request("http://localhost/api/products?id=abc"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Invalid id." });
  });

  it("returns product detail with events when requested", async () => {
    const { GET } = await loadProductsRoute();
    mockGetProductById.mockResolvedValueOnce({ id: 7, name: "Mouse" });
    mockGetProductEvents.mockResolvedValueOnce([{ id: 99, type: "sale" }]);

    const response = await GET(
      new Request("http://localhost/api/products?id=7&includeEvents=1&_r=nonce"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(
      "public, s-maxage=300, stale-while-revalidate=600",
    );
    expect(body.data).toEqual({
      product: { id: 7, name: "Mouse" },
      events: [{ id: 99, type: "sale" }],
    });
    expect(mockGetProductById).toHaveBeenCalledWith(7, "nonce");
    expect(mockGetProductEvents).toHaveBeenCalledWith(7, 5, "nonce");
  });

  it("returns paginated list and normalizes query params", async () => {
    const { GET } = await loadProductsRoute();
    mockGetProductsPage.mockResolvedValueOnce({
      items: [{ id: 1 }, { id: 2 }],
      total: 2,
    });

    const response = await GET(
      new Request(
        "http://localhost/api/products?page=2&pageSize=6&categoryId=3&q=%20mouse%20&_r=ref",
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(
      "public, s-maxage=60, stale-while-revalidate=120",
    );
    expect(body.data).toMatchObject({
      items: [{ id: 1 }, { id: 2 }],
      total: 2,
      page: 2,
      pageSize: 6,
    });
    expect(mockGetProductsPage).toHaveBeenCalledWith({
      page: 2,
      pageSize: 6,
      categoryId: 3,
      query: "mouse",
      cacheBust: "ref",
    });
  });
});
