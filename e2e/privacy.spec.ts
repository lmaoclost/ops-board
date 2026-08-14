import { expect, test } from "@playwright/test";

test("aviso de privacidade aparece na primeira visita e some ao aceitar", async ({ page }) => {
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "aviso de privacidade" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Seus dados, só no seu navegador")).toBeVisible();

  await dialog.getByRole("button", { name: "entendi" }).click();
  await expect(dialog).toBeHidden();

  await page.reload();
  await expect(dialog).toHaveCount(0);
});

test("aviso não reaparece quando já aceito (localStorage persistido)", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("opsboard.notice-v1", "1"));
  await page.goto("/");
  await expect(page.getByRole("dialog", { name: "aviso de privacidade" })).toHaveCount(0);
});

test("política de privacidade acessível em 1 clique pelo topbar", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("opsboard.notice-v1", "1"));
  await page.goto("/");

  await page.getByRole("link", { name: "privacidade" }).click();

  await expect(page).toHaveURL(/\/privacidade/);
  await expect(page.getByRole("heading", { name: "Política de privacidade" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Base legal" })).toBeVisible();
  await expect(page.getByText("localStorage", { exact: false })).toBeVisible();
  await expect(page.getByText("direitos do titular (LGPD, art. 18)", { exact: false })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Como apagar todos os dados" })).toBeVisible();
});

test("aviso oferece link direto para a política", async ({ page }) => {
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "aviso de privacidade" });
  await dialog.getByRole("link", { name: "política completa" }).click();
  await expect(page).toHaveURL(/\/privacidade/);
  await expect(page.getByRole("heading", { name: "Política de privacidade" })).toBeVisible();
});