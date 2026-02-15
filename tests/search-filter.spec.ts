import { test, expect } from "@playwright/test";

test.describe("Busca, Filtros e Paginação", () => {
  test("Busca por nome funciona", async ({ page }) => {
    await page.goto("/products?query=iPhone");
    await expect(page.getByText(/iPhone/i).first()).toBeVisible();
    await expect(page.getByText(/\d+ produtos encontrados/)).toBeVisible();
  });

  test("Busca sem resultado", async ({ page }) => {
    await page.goto("/products?query=xyznonexistent");
    await expect(page.getByText("0 produtos encontrados")).toBeVisible();
  });

  test("Filtro por categoria", async ({ page }) => {
    await page.goto("/products");
    const categoryButton = page.locator("button.category-chip", { hasText: "Eletrônicos" });
    await expect(categoryButton).toBeVisible();
    await categoryButton.click();
    await expect(page).toHaveURL(/category=/);
    await expect(page.getByText(/\d+ produtos encontrados/)).toBeVisible();
  });

  test("Categoria + busca combinados", async ({ page }) => {
    await page.goto("/products");
    const categoryButton = page.locator("button.category-chip", { hasText: "Eletrônicos" });
    await categoryButton.click();
    await expect(page).toHaveURL(/category=/);
    await page.getByPlaceholder("Buscar produto...").fill("iPhone");
    await page.waitForTimeout(500); // debounce
    await expect(page).toHaveURL(/category=.*query=|query=.*category=/);
  });

  test("Limpar filtro", async ({ page }) => {
    await page.goto("/products");
    const categoryButton = page.locator("button.category-chip", { hasText: "Eletrônicos" });
    await categoryButton.click();
    await expect(page).toHaveURL(/category=/);
    const clearButton = page.getByText("Limpar filtro");
    await expect(clearButton).toBeVisible();
    await clearButton.click({ force: true });
    await expect(page).toHaveURL(/\/products$/);
  });

  test("Paginação funciona", async ({ page }) => {
    await page.goto("/products");
    await page.waitForTimeout(2000);
    const paginationContainer = page.locator("text=Página").first();
    await expect(paginationContainer).toBeVisible();

    const nextButton = page.getByRole("button", { name: "Próxima" });
    const isDisabled = await nextButton.evaluate(
      (element) => element.classList.contains("pointer-events-none"),
    );
    if (!isDisabled) {
      await nextButton.click({ force: true });
      await expect(page).toHaveURL(/page=2/);
    }
  });

  test("Paginação mostra página atual", async ({ page }) => {
    await page.goto("/products");
    await page.waitForTimeout(2000);
    const paginationContainer = page.locator("text=Página").first();
    await expect(paginationContainer).toBeVisible();
  });
});
