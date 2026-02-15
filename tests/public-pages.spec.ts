import { test, expect } from "@playwright/test";

test.describe("Páginas Públicas", () => {
  test("Home carrega com título CacheLab", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("CacheLab");
  });

  test("Home mostra produtos em destaque", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Produtos em Destaque")).toBeVisible();
    const cards = page.locator(".product-card");
    await expect(cards.first()).toBeVisible();
  });

  test("Home mostra preços em R$", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("R$").first()).toBeVisible();
  });

  test("Home mostra CTA Ver Produtos", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: "Ver Produtos" });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/products");
  });

  test("Products lista produtos", async ({ page }) => {
    await page.goto("/products");
    await expect(page.getByText("Catálogo de Produtos")).toBeVisible();
    const cards = page.locator("a[href^='/product/']");
    await expect(cards.first()).toBeVisible();
  });

  test("Products mostra categorias", async ({ page }) => {
    await page.goto("/products");
    await expect(page.getByText("Todos")).toBeVisible();
    await expect(page.getByText("Eletrônicos")).toBeVisible();
  });

  test("Products mostra contagem", async ({ page }) => {
    await page.goto("/products");
    await expect(page.getByText(/\d+ produtos encontrados/)).toBeVisible();
  });

  test("Product detail carrega", async ({ page }) => {
    // Get a real product id from the products page
    await page.goto("/products");
    const firstLink = page.locator("a[href^='/product/']").first();
    await expect(firstLink).toBeVisible();
    const href = await firstLink.getAttribute("href");
    await page.goto(href!);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByText("R$").first()).toBeVisible();
    await expect(page.getByText(/unidades/)).toBeVisible();
  });

  test("Product detail mostra breadcrumb", async ({ page }) => {
    await page.goto("/product/1");
    const breadcrumb = page.getByRole("link", { name: "Produtos" });
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb).toHaveAttribute("href", "/products");
  });
});
