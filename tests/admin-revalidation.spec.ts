import { expect, test, type Page } from "@playwright/test";

import { loginAsAdmin } from "./helpers/auth";

function parsePrice(text: string) {
  const m = text.match(/R\$\s*([0-9]+(?:\.[0-9]{2})?)/);
  return m ? Number(m[1]) : null;
}

function parseStockUnits(text: string) {
  const m = text.match(/(\d+)\s*un\./i);
  return m ? Number(m[1]) : null;
}

async function comboboxSelect(page: Page, ariaLabel: string, optionText: string) {
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

async function getUniqueFeaturedProductMeta(page: Page) {
  await page.goto("/");
  const section = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Produtos em Destaque" }),
  }).first();
  await expect(section).toBeVisible();

  const cards = section.locator('a[href^="/product/"]');
  const count = await cards.count();
  const featuredCandidates: Array<{ id: number; name: string; href: string; text: string }> = [];

  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    const name = (await card.getByRole("heading").first().innerText()).trim();
    const href = await card.getAttribute("href");
    if (!href) continue;
    const idMatch = href.match(/\/product\/(\d+)/);
    if (!idMatch) continue;
    const id = Number(idMatch[1]);
    const text = await card.innerText();
    featuredCandidates.push({ id, name, href, text });
  }

  for (const candidate of featuredCandidates) {
    await page.goto(`/products?query=${encodeURIComponent(candidate.name)}`);
    const matches = await page
      .locator('a[href^="/product/"]')
      .filter({ has: page.getByRole("heading", { name: candidate.name }) })
      .count();
    if (matches === 1) {
      return {
        id: candidate.id,
        name: candidate.name,
        href: candidate.href,
        price: parsePrice(candidate.text),
        stock: parseStockUnits(candidate.text),
      };
    }
  }

  test.skip(true, "Nenhum produto em destaque com nome único para validação confiável.");
  throw new Error("unreachable");
}

test.describe.serial("Admin revalidation without manual reload", () => {
  test("update in admin should reflect in /products, home featured and detail", async ({ page }) => {
    const featured = await getUniqueFeaturedProductMeta(page);

    await loginAsAdmin(page);
    await page.getByRole("tab", { name: "Atualizar Produto" }).click();
    await comboboxSelect(page, "Selecionar produto", `${featured.name} (#${featured.id})`);

    const newPrice = (featured.price ?? 199.99) + 11;
    const newStock = (featured.stock ?? 10) + 7;
    await page.locator('[aria-label="Novo preço"]').fill(newPrice.toFixed(2));
    await page.locator('[aria-label="Novo estoque"]').fill(String(newStock));
    await page.getByRole("button", { name: "Revisar Alteração" }).click();
    await page.getByRole("button", { name: "Confirmar" }).click();
    await expect(page.getByText(/atualizado/i)).toBeVisible({ timeout: 15_000 });

    await page.goto(`/products?query=${encodeURIComponent(featured.name)}`);
    const productsCard = page.locator('a[href^="/product/"]').filter({
      has: page.getByRole("heading", { name: featured.name }),
    }).first();
    await expect(productsCard).toBeVisible({ timeout: 15_000 });
    await expect(productsCard.getByText(`R$ ${newPrice.toFixed(2)}`)).toBeVisible();
    await expect(productsCard.getByText(`${newStock} un.`)).toBeVisible();

    await page.goto("/");
    const featuredSection = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Produtos em Destaque" }),
    }).first();
    const updatedFeaturedCard = featuredSection.locator('a[href^="/product/"]').filter({
      has: page.getByRole("heading", { name: featured.name }),
    }).first();
    await expect(updatedFeaturedCard).toBeVisible({ timeout: 20_000 });
    await expect(updatedFeaturedCard.getByText(`R$ ${newPrice.toFixed(2)}`)).toBeVisible();
    await expect(updatedFeaturedCard.getByText(`${newStock} un.`)).toBeVisible();

    await updatedFeaturedCard.click();
    await expect(page).toHaveURL(/\/product\/\d+/);
    await expect(page.locator("main")).toContainText(`R$ ${newPrice.toFixed(2)}`);
    await expect(page.locator("main")).toContainText(new RegExp(`${newStock}\\s+unidades`));
  });

  test("delete in admin should remove from /products and home featured immediately", async ({ page }) => {
    const featured = await getUniqueFeaturedProductMeta(page);

    await loginAsAdmin(page);
    await page.getByRole("tab", { name: "Apagar Produto" }).click();
    await comboboxSelect(
      page,
      "Selecionar produto para apagar",
      `${featured.name} (#${featured.id})`,
    );
    const deleteButton = page.getByRole("button", { name: "Apagar Produto" });
    await expect(deleteButton).toBeEnabled();
    await deleteButton.click();
    await expect(page.getByText("Confirmar Exclusão")).toBeVisible();
    await page.getByRole("button", { name: "Apagar definitivamente" }).click();
    await expect(page.getByText(new RegExp(`Produto\\s+\"${featured.name}\"\\s+apagado\\.`))).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/");
    const featuredSection = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Produtos em Destaque" }),
    }).first();
    await expect(featuredSection.locator(`a[href="${featured.href}"]`)).toHaveCount(0, {
      timeout: 20_000,
    });

    await page.goto(`/products?query=${encodeURIComponent(featured.name)}`);
    await expect(page.locator(`a[href="${featured.href}"]`)).toHaveCount(0, { timeout: 15_000 });

    await page.goto(featured.href);
    await expect(page.getByRole("heading", { name: /404|Not Found/i })).toBeVisible({ timeout: 15_000 });
  });
});
