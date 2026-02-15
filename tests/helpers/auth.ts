import { type Page, expect, test } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./constants";

export async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(ADMIN_EMAIL);
  await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();

  const waitForAdmin = async () => {
    await page.waitForURL(/\/admin/, { timeout: 15_000 });
    return "ok" as const;
  };
  const waitForInvalid = async () => {
    await page.getByText("Credenciais inválidas").waitFor({ timeout: 15_000 });
    return "invalid" as const;
  };

  const result = await Promise.race([waitForAdmin(), waitForInvalid()]);

  if (result === "invalid") {
    test.skip(true, "Admin não configurado no Supabase. Execute: npx tsx scripts/create-admin.ts");
    return;
  }

  await expect(page.getByText("Painel Administrativo")).toBeVisible();
}
