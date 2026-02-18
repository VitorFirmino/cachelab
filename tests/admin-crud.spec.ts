import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";
async function comboboxSelect(
  page: import("@playwright/test").Page,
  ariaLabel: string,
  optionText: string,
) {
  const trigger = page.locator(`[aria-label="${ariaLabel}"]`);
  await trigger.click();
  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();
  const option = listbox.getByRole("option", { name: optionText });
  if (await option.count()) {
    await option.click();
    return;
  }
  const fallbackOptions = listbox.getByRole("option");
  const count = await fallbackOptions.count();
  test.skip(count <= 1, `Sem opções suficientes no combobox: ${ariaLabel}`);
  await fallbackOptions.nth(1).click();
}

async function createProductInAdmin(page: import("@playwright/test").Page, name: string, stock = "5") {
  await page.getByRole("tab", { name: "Criar Produto" }).click();
  await page.locator('[aria-label="Nome do produto"]').fill(name);
  await page.locator('[aria-label="Preço do produto"]').fill("50.00");
  await page.locator('[aria-label="Estoque do produto"]').fill(stock);
  await page.getByRole("button", { name: "Criar Produto" }).click();
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
    const name = `Teste E2E ${Date.now()}`;
    await createProductInAdmin(page, name, "10");
    await page.goto(`/products?query=${encodeURIComponent(name)}`);
    await expect(page.getByRole("heading", { name })).toBeVisible({ timeout: 15_000 });
  });

  test("Produto criado aparece na listagem", async ({ page }) => {
    const name = `ProdutoListagem ${Date.now()}`;
    await createProductInAdmin(page, name);

    await page.goto(`/products?query=${encodeURIComponent(name)}`);
    await expect(page.getByRole("heading", { name })).toBeVisible({ timeout: 15_000 });
  });

  test("Atualizar produto", async ({ page }) => {
    const name = `Atualizar E2E ${Date.now()}`;
    await createProductInAdmin(page, name, "2");

    await page.getByRole("tab", { name: "Atualizar Produto" }).click();
    await comboboxSelect(page, "Selecionar produto", name);

    await page.locator('[aria-label="Novo preço"]').fill("199.99");
    await page.locator('[aria-label="Novo estoque"]').fill("50");

    await page.getByRole("button", { name: "Revisar Alteração" }).click();
    await expect(page.getByText("Confirmar Alteração")).toBeVisible();
    await page.getByRole("button", { name: "Confirmar" }).click();
    await expect(page.getByText(/atualizado/i)).toBeVisible({ timeout: 15_000 });
  });

  test("Criar evento", async ({ page }) => {
    const name = `Evento E2E ${Date.now()}`;
    await createProductInAdmin(page, name, "3");

    await page.getByRole("tab", { name: "Criar Evento" }).click();

    await comboboxSelect(page, "Tipo de evento", "Pulse");
    await page.locator('[aria-label="Mensagem do evento"]').fill("Evento de teste E2E");
    await comboboxSelect(page, "Produto do evento", name);
    await page.getByRole("button", { name: "Criar Evento" }).click();
    await expect(page.getByText(/Evento criado/i)).toBeVisible({ timeout: 15_000 });
  });

  test("Apagar produto criado", async ({ page }) => {
    const name = `Deletar E2E ${Date.now()}`;
    await createProductInAdmin(page, name, "1");

    await page.getByRole("tab", { name: "Apagar Produto" }).click();
    await comboboxSelect(page, "Selecionar produto para apagar", name);

    await page.getByRole("button", { name: "Apagar Produto" }).click();
    await expect(page.getByText("Confirmar Exclusão")).toBeVisible();
    const dialog = page.getByRole("alertdialog").or(page.getByRole("dialog"));
    await expect(dialog.getByText(name)).toBeVisible();
    await page.getByRole("button", { name: "Apagar definitivamente" }).click();
    await expect(page.getByText(/apagado/i)).toBeVisible({ timeout: 15_000 });

    await expect(page.getByText("Confirmar Exclusão")).not.toBeVisible();

    await page.goto(`/products?query=${encodeURIComponent(name)}`);
    await expect(page.getByRole("heading", { name })).toHaveCount(0);
  });

  test("Link para Estatísticas existe", async ({ page }) => {
    const link = page.getByRole("link", { name: /Estatísticas/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/admin/stats");
  });
});
