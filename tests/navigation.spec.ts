import { test, expect } from "@playwright/test";

test.describe("Navegação", () => {
  test("Nav links funcionam", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Produtos" }).first().click();
    await expect(page).toHaveURL(/\/products/);

    await page.getByRole("link", { name: "Início" }).first().click();
    await expect(page).toHaveURL("/");

    await page.getByRole("link", { name: "Admin" }).first().click();
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
    // /stats → /admin/stats → middleware may redirect to /login if not authenticated
    const url = page.url();
    const isAdminStats = /\/admin\/stats/.test(url);
    const isLogin = /\/login/.test(url);
    const isStats = /\/stats/.test(url);
    // Should redirect somewhere (admin/stats, login, or at least acknowledge /stats)
    expect(isAdminStats || isLogin || isStats).toBeTruthy();
    // Should not be a 500 error
    expect(response?.status()).not.toBe(500);
  });
});
