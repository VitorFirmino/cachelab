import { test, expect } from "@playwright/test";

test.describe("API Routes", () => {
  test("GET /api/products retorna lista", async ({ request }) => {
    const response = await request.get("/api/products");
    expect(response.ok()).toBeTruthy();
    const payload = await response.json();
    expect(payload.data.items).toBeInstanceOf(Array);
    expect(payload.data.total).toBeGreaterThan(0);
  });

  test("GET /api/products?id retorna produto", async ({ request }) => {
    // First get a valid product id from the list
    const listRes = await request.get("/api/products");
    const listJson = await listRes.json();
    const firstId = listJson.data.items[0]?.id;
    expect(firstId).toBeTruthy();

    const response = await request.get(`/api/products?id=${firstId}`);
    expect(response.ok()).toBeTruthy();
    const payload = await response.json();
    expect(payload.data.product).toBeTruthy();
    expect(payload.data.product.name).toBeTruthy();
  });

  test("GET /api/products tem Cache-Control", async ({ request }) => {
    const response = await request.get("/api/products");
    const cacheControl = response.headers()["cache-control"];
    expect(cacheControl).toBeTruthy();
    expect(cacheControl).toContain("s-maxage");
  });

  test("GET /api/products não tem X-Cache-Mode", async ({ request }) => {
    const response = await request.get("/api/products");
    expect(response.headers()["x-cache-mode"]).toBeFalsy();
  });
});
