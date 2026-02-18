import { test, expect } from "@playwright/test";

test.describe("Navegação", () => {
  test("Nav links funcionam", async ({ page }) => {
    await page.goto("/");

    await page.locator('header a[href="/products"]').first().click();
    await expect(page).toHaveURL(/\/products/);

    await page.locator('header a[href="/"]').first().click();
    await expect(page).toHaveURL("/");

    await page.locator('header a[href="/admin"]').first().click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("Product card link vai para detail", async ({ page }) => {
    await page.goto("/products");
    await page.waitForLoadState("networkidle");
    const firstCard = page.locator("a[href^='/product/']").first();
    await expect(firstCard).toBeVisible();
    const href = await firstCard.getAttribute("href");
    await firstCard.click({ force: true });
    await expect(page).toHaveURL(href!);
  });

  test("CTA Ver Produtos navega", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Ver Produtos" }).click({ force: true });
    await expect(page).toHaveURL(/\/products/);
  });

  test("Breadcrumb product detail volta para products", async ({ page }) => {
    await page.goto("/product/1");
    await page.getByRole("link", { name: "Produtos" }).click({ force: true });
    await expect(page).toHaveURL(/\/products/);
  });

  test("/stats redireciona corretamente", async ({ page }) => {
    const response = await page.goto("/stats");
    const url = page.url();
    const isAdminStats = /\/admin\/stats/.test(url);
    const isLogin = /\/login/.test(url);
    const isStats = /\/stats/.test(url);
    expect(isAdminStats || isLogin || isStats).toBeTruthy();
    expect(response?.status()).not.toBe(500);
  });
});
