import { expect, test } from "@playwright/test";

test("aviso de privacidade aparece na primeira visita e some ao aceitar", async ({ page }) => {
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "aviso de privacidade" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("processa os seus dados localmente")).toBeVisible();

  await dialog.getByRole("button", { name: "aceitar" }).click();
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

  await page.getByRole("link", { name: "privacidade", exact: true }).click();

  await expect(page).toHaveURL(/\/privacy/);
  await expect(page.getByRole("heading", { name: "Política de privacidade" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Base legal" })).toBeVisible();
  await expect(page.getByText("localStorage", { exact: false })).toBeVisible();
  await expect(page.getByText("direitos do titular (LGPD, art. 18)", { exact: false })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Como apagar todos os dados" })).toBeVisible();
});

test("aviso oferece link direto para a política", async ({ page }) => {
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "aviso de privacidade" });
  await dialog.getByRole("link", { name: "Política de privacidade" }).click();
  await expect(page).toHaveURL(/\/privacy/);
  await expect(page.getByRole("heading", { name: "Política de privacidade" })).toBeVisible();
});
test("aviso: aceitar métricas liga tracking; recusar desliga", async ({ page }) => {
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "aviso de privacidade" });
  await dialog.getByRole("button", { name: "aceitar" }).click();
  await expect(dialog).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem("opsboard.metrics-v1"))).toBe("1");

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const dialog2 = page.getByRole("dialog", { name: "aviso de privacidade" });
  await dialog2.getByRole("button", { name: "recusar" }).click();
  await expect(dialog2).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem("opsboard.metrics-v1"))).toBe("0");
});

test("privacidade: seção 7 explica métricas e toggle revoga", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("opsboard.notice-v1", "1");
    localStorage.setItem("opsboard.metrics-v1", "1");
  });
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: /Métricas de uso/ })).toBeVisible();
  const toggle = page.getByRole("switch", { name: "métricas de uso" });
  await expect(toggle).toBeChecked();
  await toggle.click();
  expect(await page.evaluate(() => localStorage.getItem("opsboard.metrics-v1"))).toBe("0");
  await expect(toggle).not.toBeChecked();
});
