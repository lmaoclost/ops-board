import { expect, test, type Page } from "@playwright/test";

async function seedBoard(page: Page) {
  await page.addInitScript(() => localStorage.setItem("opsboard.notice-v1", "1"));
  await page.goto("/");
  await page.getByRole("button", { name: "+ criar primeiro projeto" }).click();
  await page.getByLabel("título").fill("resp");
  await page.getByRole("button", { name: "criar" }).click();
  await page.getByLabel("nova tarefa").first().fill("tarefa longa para forçar quebra de linha no mobile com prioridade e vencimento");
  await page.getByLabel("nova tarefa").first().press("Enter");
}

async function noHorizontalScroll(page: Page, width: number) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
}

test("360px: sem scroll horizontal e ações da tarefa no menu ⋯", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await seedBoard(page);
  const row = page.getByTestId("task-row").first();

  await noHorizontalScroll(page, 360);
  await expect(row.getByRole("button", { name: "ações da tarefa", exact: true })).toBeVisible();

  await row.getByRole("button", { name: "ações da tarefa", exact: true }).click();
  await expect(page.getByRole("menuitem", { name: "editar" })).toBeVisible();
  await page.getByRole("menuitem", { name: "excluir" }).click();
  await expect(page.getByRole("dialog", { name: "excluir tarefa?" })).toBeVisible();
});

test("360px: kanban e agenda sem scroll horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await seedBoard(page);

  await page.getByRole("button", { name: "kanban" }).click();
  await noHorizontalScroll(page, 360);
  await page.getByRole("button", { name: "lista" }).click();
  await page.getByRole("button", { name: "agenda" }).click();
  await noHorizontalScroll(page, 360);
});

test("768px: sem scroll horizontal e ações inline visíveis", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await seedBoard(page);
  const row = page.getByTestId("task-row").first();

  await noHorizontalScroll(page, 768);
  await expect(row.getByRole("button", { name: "editar" })).toBeVisible();

  await page.getByRole("button", { name: "kanban" }).click();
  await noHorizontalScroll(page, 768);
});
