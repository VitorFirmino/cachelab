import { test, expect } from "@playwright/test";

test.describe("Busca, Filtros e Paginação", () => {
  async function pickFirstCategory(page: import("@playwright/test").Page) {
    const chips = page.locator("button.category-chip");
    const count = await chips.count();
    test.skip(count <= 1, "Sem categorias suficientes para testar filtro.");
    const chip = chips.nth(1);
    const label = (await chip.innerText()).trim();
    await chip.click();
    return { chip, label };
  }

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
    await pickFirstCategory(page);
    await expect(page.getByText(/\d+ produtos encontrados/)).toBeVisible();
  });

  test("Categoria + busca combinados", async ({ page }) => {
    await page.goto("/products");
    await pickFirstCategory(page);
    await page.getByPlaceholder("Buscar produto...").fill("iPhone");
    await page.waitForTimeout(500); // debounce
    await expect(page.getByText(/\d+ produtos encontrados/)).toBeVisible();
  });

  test("Limpar filtro", async ({ page }) => {
    await page.goto("/products");
    await pickFirstCategory(page);
    const allButton = page.locator("button.category-chip", { hasText: "Todos" });
    await allButton.click();
    await expect(page.getByText(/\d+ produtos encontrados/)).toBeVisible();
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
      await expect(page.locator("text=Página").first()).toBeVisible();
    }
  });

  test("Paginação mostra página atual", async ({ page }) => {
    await page.goto("/products");
    await page.waitForTimeout(2000);
    const paginationContainer = page.locator("text=Página").first();
    await expect(paginationContainer).toBeVisible();
  });
});
