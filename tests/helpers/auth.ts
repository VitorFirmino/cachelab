import { type Page, expect, test } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./constants";

export async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  const emailInput = page.locator('input[name="email"]');

  if (await emailInput.count()) {
    await emailInput.fill(ADMIN_EMAIL);
    await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
  } else if (!/\/admin/.test(page.url())) {
    await page.goto("/admin");
  }

  if (/\/admin/.test(page.url())) {
    if (!/\/admin\/?$/.test(page.url())) {
      await page.goto("/admin");
    }
    await expect(page.getByRole("tab", { name: "Criar Produto" })).toBeVisible({ timeout: 15_000 });
    return;
  }

  const invalidVisible = await page.getByText(/Credenciais inválidas|Invalid login credentials/i).isVisible().catch(() => false);
  const notAdminVisible = await page.getByText(/não tem permissão|not_admin/i).isVisible().catch(() => false);

  if (invalidVisible || notAdminVisible || /\/login/.test(page.url())) {
    test.skip(true, "Admin não configurado no Supabase. Execute: npx tsx scripts/create-admin.ts");
    return;
  }

  await page.goto("/admin");
  if (/\/login/.test(page.url())) {
    test.skip(true, "Admin não configurado no Supabase. Execute: npx tsx scripts/create-admin.ts");
    return;
  }
  await expect(page.getByRole("tab", { name: "Criar Produto" })).toBeVisible({ timeout: 15_000 });
}
