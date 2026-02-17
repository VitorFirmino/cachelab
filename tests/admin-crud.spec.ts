import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

/** Helper: select a value from a custom Combobox component by aria-label */
async function comboboxSelect(
  page: import("@playwright/test").Page,
  ariaLabel: string,
  optionText: string,
) {
  const trigger = page.locator(`[aria-label="${ariaLabel}"]`);
  await trigger.click();
  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();
  await listbox.getByRole("option", { name: optionText }).click();
}

test.describe("Admin CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("Página admin mostra tabs", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "Criar Produto" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Atualizar Produto" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Criar Evento" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Apagar Produto" })).toBeVisible();
  });

  test("Criar produto", async ({ page }) => {
    await page.getByRole("tab", { name: "Criar Produto" }).click();

    const name = `Teste E2E ${Date.now()}`;
    await page.locator('[aria-label="Nome do produto"]').fill(name);
    await page.locator('[aria-label="Preço do produto"]').fill("99.90");
    await page.locator('[aria-label="Estoque do produto"]').fill("10");

    // Select first real category from combobox
    const categoryTrigger = page.locator('[aria-label="Categoria do produto"]');
    await categoryTrigger.click();
    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();
    // Pick the second option (first is "Nenhuma (opcional)")
    const options = listbox.getByRole("option");
    await options.nth(1).click();

    await page.getByRole("button", { name: "Criar Produto" }).click();
    await expect(page.getByText(/criado/i)).toBeVisible({ timeout: 15_000 });
  });

  test("Produto criado aparece na listagem", async ({ page }) => {
    const name = `ProdutoListagem ${Date.now()}`;
    await page.getByRole("tab", { name: "Criar Produto" }).click();
    await page.locator('[aria-label="Nome do produto"]').fill(name);
    await page.locator('[aria-label="Preço do produto"]').fill("50.00");
    await page.locator('[aria-label="Estoque do produto"]').fill("5");
    await page.getByRole("button", { name: "Criar Produto" }).click();
    await expect(page.getByText(/criado/i)).toBeVisible({ timeout: 15_000 });

    await page.goto(`/products?query=${encodeURIComponent(name)}`);
    await expect(page.getByText(name)).toBeVisible();
  });

  test("Atualizar produto", async ({ page }) => {
    await page.getByRole("tab", { name: "Atualizar Produto" }).click();

    // Open product combobox and pick the second option (first is placeholder)
    const productTrigger = page.locator('[aria-label="Selecionar produto"]');
    await productTrigger.click();
    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();
    await listbox.getByRole("option").nth(1).click();

    await page.locator('[aria-label="Novo preço"]').fill("199.99");
    await page.locator('[aria-label="Novo estoque"]').fill("50");

    await page.getByRole("button", { name: "Revisar Alteração" }).click();
    await expect(page.getByText("Confirmar Alteração")).toBeVisible();
    await page.getByRole("button", { name: "Confirmar" }).click();
    await expect(page.getByText(/atualizado/i)).toBeVisible({ timeout: 15_000 });
  });

  test("Criar evento", async ({ page }) => {
    await page.getByRole("tab", { name: "Criar Evento" }).click();

    await comboboxSelect(page, "Tipo de evento", "Pulse");
    await page.locator('[aria-label="Mensagem do evento"]').fill("Evento de teste E2E");
    await page.getByRole("button", { name: "Criar Evento" }).click();
    await expect(page.getByText(/Evento criado/i)).toBeVisible({ timeout: 15_000 });
  });

  test("Apagar produto criado", async ({ page }) => {
    // 1) Criar produto temporário
    const name = `Deletar E2E ${Date.now()}`;
    await page.getByRole("tab", { name: "Criar Produto" }).click();
    await page.locator('[aria-label="Nome do produto"]').fill(name);
    await page.locator('[aria-label="Preço do produto"]').fill("1.00");
    await page.locator('[aria-label="Estoque do produto"]').fill("1");
    await page.getByRole("button", { name: "Criar Produto" }).click();
    await expect(page.getByText(/criado/i)).toBeVisible({ timeout: 15_000 });

    // 2) Ir para aba Apagar e selecionar o produto
    await page.getByRole("tab", { name: "Apagar Produto" }).click();
    await comboboxSelect(page, "Selecionar produto para apagar", name);

    // 3) Clicar em Apagar e confirmar no dialog
    await page.getByRole("button", { name: "Apagar Produto" }).click();
    await expect(page.getByText("Confirmar Exclusão")).toBeVisible();
    const dialog = page.getByRole("alertdialog").or(page.getByRole("dialog"));
    await expect(dialog.getByText(name)).toBeVisible(); // nome aparece no dialog
    await page.getByRole("button", { name: "Apagar definitivamente" }).click();
    await expect(page.getByText(/apagado/i)).toBeVisible({ timeout: 15_000 });

    // 4) Dialog deve fechar
    await expect(page.getByText("Confirmar Exclusão")).not.toBeVisible();

    // 5) Produto não aparece mais na listagem
    await page.goto(`/products?query=${encodeURIComponent(name)}`);
    await expect(page.getByText(name)).not.toBeVisible({ timeout: 10_000 });
  });

  test("Link para Estatísticas existe", async ({ page }) => {
    const link = page.getByRole("link", { name: /Estatísticas/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/admin/stats");
  });
});
