import { expect, test } from "@playwright/test";

test("alterna idioma EN e volta PT persistindo locale", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByLabel("buscar tarefas")).toBeVisible();

  await page.getByRole("button", { name: /^EN$/ }).click();
  await expect(page.getByLabel("search tasks")).toBeVisible();
  await expect(page.getByText("+ create first project", { exact: true })).toBeVisible();

  const stored = await page.evaluate(() => localStorage.getItem("opsboard.v1"));
  expect(stored).toContain('"locale":"en"');

  await page.reload();
  await expect(page.getByLabel("search tasks")).toBeVisible();

  await page.getByRole("button", { name: /^PT$/ }).click();
  await expect(page.getByLabel("buscar tarefas")).toBeVisible();
});