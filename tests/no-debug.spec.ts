import { test, expect } from "@playwright/test";

test.describe("Sem Debug em Páginas Públicas", () => {
  test("Home sem texto de debug interno", async ({ page }) => {
    await page.goto("/");
    // Check only main content area (body includes RSC scripts with internal terms)
    const mainText = await page.locator("main").textContent();
    for (const term of ["fetch cache", "edge cache", "unstable_cache"]) {
      expect(mainText).not.toContain(term);
    }
  });

  test("Products sem CacheBadge", async ({ page }) => {
    await page.goto("/products");
    const mainText = await page.locator("main").textContent();
    expect(mainText).not.toMatch(/CacheBadge/);
    for (const term of ["HIT", "MISS", "BYPASS"]) {
      expect(mainText).not.toContain(term);
    }
  });

  test("Product detail sem debug", async ({ page }) => {
    await page.goto("/product/1");
    const mainText = await page.locator("main").textContent();
    for (const term of ["HIT", "MISS", "BYPASS"]) {
      expect(mainText).not.toContain(term);
    }
  });

  test("Nav sem Modo Cache", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header");
    await expect(header.getByText("Modo Cache")).not.toBeVisible();
  });
});
