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
    await expect(page.getByLabel("featured stale")).toHaveValue("120");
    await expect(page.getByLabel("featured revalidate")).toHaveValue("180");
    await expect(page.getByLabel("featured expire")).toHaveValue("3600");

    await expect(page.getByLabel("products stale")).toHaveValue("60");
    await expect(page.getByLabel("products revalidate")).toHaveValue("120");
    await expect(page.getByLabel("products expire")).toHaveValue("1800");

    await expect(page.getByLabel("product stale")).toHaveValue("120");
    await expect(page.getByLabel("product revalidate")).toHaveValue("300");
    await expect(page.getByLabel("product expire")).toHaveValue("3600");

    await expect(page.getByLabel("events stale")).toHaveValue("60");
    await expect(page.getByLabel("events revalidate")).toHaveValue("300");
    await expect(page.getByLabel("events expire")).toHaveValue("3600");

    await expect(page.getByLabel("categories stale")).toHaveValue("300");
    await expect(page.getByLabel("categories revalidate")).toHaveValue("300");
    await expect(page.getByLabel("categories expire")).toHaveValue("86400");
  });

  test("Atualizar TTL de cache", async ({ page }) => {
    const input = page.getByLabel("products stale");
    const original = await input.inputValue();

    const nextValue = String(Number(original) + 1);
    await input.fill(nextValue);

    await page.getByRole("button", { name: "Revisar TTL products" }).click();
    await page.getByRole("button", { name: "Confirmar alteracao TTL" }).click();
    await expect(page.getByText(/TTL \"products\" atualizado/i)).toBeVisible({ timeout: 15_000 });

    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page.getByLabel("products stale")).toHaveValue(nextValue);

    // Restore original value to keep the environment stable for other tests.
    await page.getByLabel("products stale").fill(original);
    await page.getByRole("button", { name: "Revisar TTL products" }).click();
    await page.getByRole("button", { name: "Confirmar alteracao TTL" }).click();
    await expect(page.getByText(/TTL \"products\" atualizado/i)).toBeVisible({ timeout: 15_000 });

    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page.getByLabel("products stale")).toHaveValue(original);
  });

  test("Purgar todo cache", async ({ page }) => {
    await page.getByRole("button", { name: "Purgar Todo Cache" }).click();
    await expect(page.getByText(/cache foi limpo/i)).toBeVisible({ timeout: 15_000 });
  });

  test("Purgar por tag", async ({ page }) => {
    // Click the tag chip button (not a role=button by Radix, just a <button>)
    await page.locator("button", { hasText: "Produtos" }).click();
    await page.getByRole("button", { name: /Purgar \d+ tag/ }).click();
    await expect(page.getByText(/Cache limpo/i)).toBeVisible({ timeout: 15_000 });
  });
});
