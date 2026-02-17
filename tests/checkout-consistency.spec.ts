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
  await expect(page.getByText(/criado/i)).toBeVisible({ timeout: 15_000 });

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

test.describe("Checkout consistency", () => {
  test.fixme("should update product list stock when returning from checkout without manual reload", async ({ page }) => {
    const productName = await createProductForCheckoutScenario(page);
    await checkoutSingleUnitFromProducts(page, productName);

    await page.waitForLoadState("networkidle");
    await page.getByLabel("Buscar produto").fill(productName);
    await expect(page.getByRole("heading", { name: productName })).toBeVisible({ timeout: 15_000 });
    const card = productCardByName(page, productName);
    await expect(card.getByRole("button", { name: "Esgotado" })).toBeVisible({ timeout: 20_000 });
  });

  test("should show sold out state when opening product detail right after checkout", async ({ page }) => {
    const productName = await createProductForCheckoutScenario(page);
    await checkoutSingleUnitFromProducts(page, productName);

    await page.waitForLoadState("networkidle");
    await page.getByLabel("Buscar produto").fill(productName);
    await expect(page.getByRole("heading", { name: productName })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("heading", { name: productName }).click();
    await expect(page).toHaveURL(/\/product\/\d+/);
    await expect(page.getByRole("button", { name: "Esgotado" })).toBeVisible();
  });

  test("should not show stale stock on home featured card when the purchased product is featured", async ({ page }) => {
    const productName = await createProductForCheckoutScenario(page);
    await checkoutSingleUnitFromProducts(page, productName);

    await page.goto("/");
    const card = productCardByName(page, productName);
    if (await card.count() === 0) {
      test.skip(true, "Product is not featured in this environment.");
    }

    await expect(card.getByText("0 un.")).toBeVisible();
    await expect(card.getByRole("button", { name: "Esgotado" })).toBeVisible();
  });
});
