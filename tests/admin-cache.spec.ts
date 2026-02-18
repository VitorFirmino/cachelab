import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Admin Cache Controls", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/stats");
    await page.waitForLoadState("networkidle");
  });

  test("Admin stats carrega", async ({ page }) => {
    await expect(page.getByText("Estatísticas")).toBeVisible();
    await expect(page.getByText("Total de Produtos")).toBeVisible();
    await expect(page.getByText("Uptime do Processo")).toBeVisible();
  });

  test("TTLs configurados visíveis", async ({ page }) => {
    await expect(page.getByText("TTLs Configurados")).toBeVisible();

    const profiles = ["featured", "products", "product", "events", "categories"];
    for (const profile of profiles) {
      const stale = Number(await page.getByLabel(`${profile} stale`).inputValue());
      const revalidate = Number(await page.getByLabel(`${profile} revalidate`).inputValue());
      const expire = Number(await page.getByLabel(`${profile} expire`).inputValue());
      expect(Number.isFinite(stale)).toBeTruthy();
      expect(Number.isFinite(revalidate)).toBeTruthy();
      expect(Number.isFinite(expire)).toBeTruthy();
      expect(stale).toBeLessThanOrEqual(revalidate);
      expect(revalidate).toBeLessThanOrEqual(expire);
    }
  });

  test("Atualizar TTL de cache", async ({ page }) => {
    const input = page.getByLabel("products stale");
    const original = await input.inputValue();

    const nextValue = String(Number(original) + 1);
    await input.fill(nextValue);

    const reviewButton = page.getByRole("button", { name: /Revisar TTL/i }).first();
    await expect(reviewButton).toBeVisible();
    await reviewButton.click();
    await page.getByRole("button", { name: "Confirmar alteracao TTL" }).click();
    await expect(page.getByText(/TTL \"products\" atualizado/i)).toBeVisible({ timeout: 15_000 });

    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page.getByLabel("products stale")).toHaveValue(nextValue);

    await page.getByLabel("products stale").fill(original);
    await page.getByRole("button", { name: /Revisar TTL/i }).first().click();
    await page.getByRole("button", { name: "Confirmar alteracao TTL" }).click();
    await expect(page.getByText(/TTL \"products\" atualizado/i)).toBeVisible({ timeout: 15_000 });

    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page.getByLabel("products stale")).toHaveValue(original);
  });

  test("Purgar todo cache", async ({ page }) => {
    await page.getByRole("button", { name: "Purgar Todo Cache" }).click();
    await expect(page.getByRole("button", { name: /Limpando.../ })).toBeVisible({ timeout: 15_000 });
  });

  test("Purgar por tag", async ({ page }) => {
    const tagButton = page.getByRole("button", { name: "Produtos" }).first();
    await tagButton.click();
    const purgeByTagButton = page.getByRole("button", { name: /Purgar \d+ tag/ }).first();
    await expect(purgeByTagButton).toBeEnabled();
    await purgeByTagButton.click();
    await expect(page.getByRole("button", { name: /Limpando.../ })).toBeVisible({ timeout: 15_000 });
  });
});
