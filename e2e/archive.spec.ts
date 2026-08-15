import { expect, test } from "@playwright/test";

test("arquivar esconde projeto do board e das stats; toggle mostra com selo e desarquiva", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "+ criar primeiro projeto" }).click();
  await page.getByLabel("título").fill("Projeto Arquivo");
  await page.getByRole("button", { name: "criar" }).click();
  await page.getByLabel("nova tarefa").first().fill("tarefa");
  await page.getByLabel("nova tarefa").first().press("Enter");

  await page.getByLabel("ações do projeto").click();
  await page.getByRole("menuitem", { name: "arquivar projeto" }).click();

  await expect(page.getByText("Projeto Arquivo")).toHaveCount(0);
  await expect(page.getByTestId("stat-total")).toHaveText("0");
  const chip = page.getByRole("button", { name: /arquivados/ });
  await expect(chip).toContainText("1");

  await chip.click();
  await expect(page.getByText("Projeto Arquivo")).toBeVisible();
  await expect(page.getByText("arquivado", { exact: true })).toBeVisible();

  await page.getByLabel("ações do projeto").click();
  await page.getByRole("menuitem", { name: "desarquivar projeto" }).click();

  await page.getByRole("button", { name: /arquivados/ }).click();
  await expect(page.getByText("Projeto Arquivo")).toBeVisible();
  await expect(page.getByTestId("stat-total")).toHaveText("1");
  await expect(page.getByRole("button", { name: /arquivados/ })).toContainText("0");
});

test("arquivamento persiste no reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "+ criar primeiro projeto" }).click();
  await page.getByLabel("título").fill("P Arquivo");
  await page.getByRole("button", { name: "criar" }).click();
  await page.getByLabel("ações do projeto").click();
  await page.getByRole("menuitem", { name: "arquivar projeto" }).click();

  await page.reload();
  await expect(page.getByText("P Arquivo")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /arquivados/ })).toContainText("1");
});