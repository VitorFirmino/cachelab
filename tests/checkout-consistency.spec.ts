import { expect, test, type Locator, type Page } from "@playwright/test";

import { loginAsAdmin } from "./helpers/auth";

async function createProductForCheckoutScenario(page: Page) {
  const name = `Checkout E2E ${Date.now()}`;

  await loginAsAdmin(page);
  await page.getByRole("tab", { name: "Criar Produto" }).click();
  await page.locator('[aria-label="Nome do produto"]').fill(name);
  await page.locator('[aria-label="Preço do produto"]').fill("49.90");
  await page.locator('[aria-label="Estoque do produto"]').fill("1");
  await page.getByRole("button", { name: "Criar Produto" }).click();
  await page.goto(`/products?query=${encodeURIComponent(name)}`);
  await expect(page.getByRole("heading", { name })).toBeVisible({ timeout: 15_000 });

  return name;
}

function productCardByName(page: Page, productName: string): Locator {
  return page
    .locator('a[href^="/product/"]')
    .filter({ has: page.getByRole("heading", { name: productName }) })
    .first();
}

async function checkoutSingleUnitFromProducts(page: Page, productName: string) {
  await page.goto("/products");
  await page.getByLabel("Buscar produto").fill(productName);
  await expect(page.getByRole("heading", { name: productName })).toBeVisible({ timeout: 15_000 });

  const card = productCardByName(page, productName);
  await card.getByRole("button", { name: "Comprar" }).click();

  await page.getByRole("button", { name: "Abrir carrinho" }).click();
  await page.getByRole("button", { name: "Finalizar Compra" }).click();
  await expect(page.getByRole("heading", { name: "Compra Realizada" })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Voltar às compras" }).click();
  await expect(page).toHaveURL(/\/products/);
}

async function comboboxSelect(page: Page, ariaLabel: string, optionText: string) {
  const trigger = page.locator(`[aria-label="${ariaLabel}"]`);
  await trigger.click();
  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();
  await listbox.getByRole("option", { name: optionText }).click();
}

async function deleteProductByName(page: Page, productName: string) {
  await loginAsAdmin(page);
  await page.getByRole("tab", { name: "Apagar Produto" }).click();
  await comboboxSelect(page, "Selecionar produto para apagar", productName);
  await page.getByRole("button", { name: "Apagar Produto" }).click();
  await expect(page.getByText("Confirmar Exclusão")).toBeVisible();
  await page.getByRole("button", { name: "Apagar definitivamente" }).click();
  await expect(page.getByText(/apagado/i)).toBeVisible({ timeout: 15_000 });
}

test.describe.serial("Admin + cache consistency", () => {
  test("checkout should update stock without manual reload in /products and /product/[id]", async ({ page }) => {
    const productName = await createProductForCheckoutScenario(page);
    await checkoutSingleUnitFromProducts(page, productName);

    await page.waitForLoadState("networkidle");
    await page.getByLabel("Buscar produto").fill(productName);
    const card = productCardByName(page, productName);
    await expect(card.getByRole("button", { name: "Esgotado" })).toBeVisible({ timeout: 20_000 });

    await card.getByRole("heading", { name: productName }).click();
    await expect(page).toHaveURL(/\/product\/\d+/);
    await expect(page.getByRole("button", { name: "Esgotado" })).toBeVisible({ timeout: 15_000 });
  });

  test("deleting a featured product should remove it from home highlights and /products", async ({ page }) => {
    await page.goto("/");
    const featuredSection = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Produtos em Destaque" }),
    }).first();
    await expect(featuredSection).toBeVisible();

    const featuredCard = featuredSection.locator('a[href^="/product/"]').first();
    await expect(featuredCard).toBeVisible();
    const featuredName = (await featuredCard.getByRole("heading").first().innerText()).trim();
    const featuredHref = await featuredCard.getAttribute("href");
    if (!featuredHref) {
      throw new Error("Featured product href not found.");
    }

    await deleteProductByName(page, featuredName);

    await page.goto("/");
    const updatedFeaturedSection = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Produtos em Destaque" }),
    }).first();
    await expect(updatedFeaturedSection.locator('a[href^="/product/"]').filter({
      has: page.getByRole("heading", { name: featuredName }),
    })).toHaveCount(0, { timeout: 20_000 });

    await page.goto(`/products?query=${encodeURIComponent(featuredName)}`);
    await expect(page.getByRole("heading", { name: featuredName })).toHaveCount(0);

    await page.goto(featuredHref);
    await expect(page.getByRole("heading", { name: /404|Not Found/i })).toBeVisible({ timeout: 15_000 });
  });
});
