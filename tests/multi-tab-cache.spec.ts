import { expect, test, type BrowserContext, type Page } from "@playwright/test";

import { loginAsAdmin } from "./helpers/auth";

function parseCurrencyFromCard(text: string) {
  const m = text.match(/R\$\s*([0-9]+(?:\.[0-9]{2})?)/);
  return m ? Number(m[1]) : null;
}

function parseUnitsFromCard(text: string) {
  const m = text.match(/(\d+)\s*un\./i);
  return m ? Number(m[1]) : null;
}

async function getFeaturedMeta(page: Page) {
  await page.goto("/");
  const section = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Produtos em Destaque" }),
  }).first();
  await expect(section).toBeVisible();
  const card = section.locator('a[href^="/product/"]').first();
  await expect(card).toBeVisible();

  const href = await card.getAttribute("href");
  if (!href) throw new Error("Featured href not found");
  const idMatch = href.match(/\/product\/(\d+)/);
  if (!idMatch) throw new Error(`Could not parse product id from href: ${href}`);

  const name = (await card.getByRole("heading").first().innerText()).trim();
  const text = await card.innerText();

  return {
    id: Number(idMatch[1]),
    name,
    href,
    price: parseCurrencyFromCard(text),
    stock: parseUnitsFromCard(text),
  };
}

async function selectComboboxOption(page: Page, ariaLabel: string, optionText: string) {
  const trigger = page.locator(`[aria-label="${ariaLabel}"]`);
  await trigger.click();
  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();
  const exactOption = listbox.getByRole("option", { name: optionText });
  if (await exactOption.count()) {
    await exactOption.click();
    await expect(trigger).toContainText(optionText);
    return;
  }
  const productNameOnly = optionText.replace(/\s*\(#\d+\)\s*$/, "");
  const fallbackOption = listbox.getByRole("option", { name: new RegExp(productNameOnly, "i") }).first();
  await fallbackOption.click();
  await expect(trigger).toContainText(productNameOnly);
}

function productCardById(page: Page, id: number) {
  return page.locator(`a[href="/product/${id}"]`).first();
}

async function openSecondTab(context: BrowserContext, path: string) {
  const tab = await context.newPage();
  await tab.goto(path);
  return tab;
}

async function navigateWithoutHardReload(tab: Page, productName: string) {
  await tab.getByRole("link", { name: "Início" }).click();
  await expect(tab).toHaveURL(/\/$/);
  await tab.getByRole("link", { name: "Produtos", exact: true }).click();
  await expect(tab).toHaveURL(/\/products/);
  await tab.getByLabel("Buscar produto").fill(productName);
}

test.describe.serial("Multi-tab cache revalidation", () => {
  test("admin update in tab A should update tab B without manual reload", async ({ page, context }) => {
    const product = await getFeaturedMeta(page);

    const tabB = await openSecondTab(context, `/products?query=${encodeURIComponent(product.name)}`);
    const cardB = productCardById(tabB, product.id);
    await expect(cardB).toBeVisible({ timeout: 15_000 });

    const basePrice = product.price ?? 10;
    const baseStock = product.stock ?? 5;
    const newPrice = basePrice + 13;
    const newStock = baseStock + 9;

    await loginAsAdmin(page);
    await page.getByRole("tab", { name: "Atualizar Produto" }).click();
    await selectComboboxOption(page, "Selecionar produto", `${product.name} (#${product.id})`);
    await page.locator('[aria-label="Novo preço"]').fill(newPrice.toFixed(2));
    await page.locator('[aria-label="Novo estoque"]').fill(String(newStock));
    await page.getByRole("button", { name: "Revisar Alteração" }).click();
    await page.getByRole("button", { name: "Confirmar" }).click();
    await expect(page.getByText(/atualizado/i)).toBeVisible({ timeout: 15_000 });

    await navigateWithoutHardReload(tabB, product.name);
    const updatedCardB = productCardById(tabB, product.id);
    await expect(updatedCardB).toBeVisible({ timeout: 20_000 });
    await expect(updatedCardB.getByText(`R$ ${newPrice.toFixed(2)}`)).toBeVisible({ timeout: 20_000 });
    await expect(updatedCardB.getByText(`${newStock} un.`)).toBeVisible({ timeout: 20_000 });

    await tabB.close();
  });

  test("checkout in tab A should update stock in tab B without manual reload", async ({ page, context }) => {
    const product = await getFeaturedMeta(page);

    const tabB = await openSecondTab(context, `/products?query=${encodeURIComponent(product.name)}`);
    const cardB = productCardById(tabB, product.id);
    await expect(cardB).toBeVisible({ timeout: 15_000 });
    const beforeText = await cardB.innerText();
    const beforeStock = parseUnitsFromCard(beforeText);
    test.skip(!beforeStock || beforeStock <= 0, "Produto sem estoque para fluxo de checkout multi-aba.");

    await page.goto(`/products?query=${encodeURIComponent(product.name)}`);
    const cardA = productCardById(page, product.id);
    await expect(cardA).toBeVisible({ timeout: 15_000 });
    await cardA.getByRole("button", { name: "Comprar" }).click();
    await page.getByRole("button", { name: "Abrir carrinho" }).click();
    await page.getByRole("button", { name: "Finalizar Compra" }).click();
    await expect(page.getByRole("heading", { name: "Compra Realizada" })).toBeVisible({ timeout: 20_000 });

    const expectedStock = (beforeStock as number) - 1;
    await navigateWithoutHardReload(tabB, product.name);
    const updatedCardB = productCardById(tabB, product.id);
    await expect(updatedCardB.getByText(`${expectedStock} un.`)).toBeVisible({ timeout: 20_000 });
    await tabB.getByRole("link", { name: "Início" }).click();
    await expect(tabB).toHaveURL(/\/(\?|$)/);
    const featuredSection = tabB.locator("section").filter({
      has: tabB.getByRole("heading", { name: "Produtos em Destaque" }),
    }).first();
    const featuredCard = featuredSection.locator(`a[href="/product/${product.id}"]`).first();
    await expect(featuredCard).toBeVisible({ timeout: 20_000 });
    await expect(featuredCard.getByText(`${expectedStock} un.`)).toBeVisible({ timeout: 20_000 });

    await tabB.close();
  });

  test("admin delete in tab A should remove product from tab B and home featured without manual reload", async ({ page, context }) => {
    const product = await getFeaturedMeta(page);

    const tabB = await openSecondTab(context, `/products?query=${encodeURIComponent(product.name)}`);
    await expect(productCardById(tabB, product.id)).toBeVisible({ timeout: 15_000 });

    await loginAsAdmin(page);
    await page.getByRole("tab", { name: "Apagar Produto" }).click();
    await selectComboboxOption(
      page,
      "Selecionar produto para apagar",
      `${product.name} (#${product.id})`,
    );
    await page.getByRole("button", { name: "Apagar Produto" }).click();
    await expect(page.getByText("Confirmar Exclusão")).toBeVisible();
    await page.getByRole("button", { name: "Apagar definitivamente" }).click();
    await expect(page.getByText(new RegExp(`Produto\\s+\"${product.name}\"\\s+apagado\\.`))).toBeVisible({
      timeout: 15_000,
    });

    await navigateWithoutHardReload(tabB, product.name);
    await expect(productCardById(tabB, product.id)).toHaveCount(0, { timeout: 20_000 });

    await tabB.getByRole("link", { name: "Início" }).click();
    await expect(tabB).toHaveURL(/\/$/);
    const featuredSection = tabB.locator("section").filter({
      has: tabB.getByRole("heading", { name: "Produtos em Destaque" }),
    }).first();
    await expect(featuredSection.locator(`a[href="/product/${product.id}"]`)).toHaveCount(0, {
      timeout: 20_000,
    });

    await tabB.close();
  });
});
