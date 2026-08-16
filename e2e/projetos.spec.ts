import { expect, test, type Page } from "@playwright/test";

async function createProject(page: Page, title: string) {
  const empty = page.getByRole("button", { name: "+ criar primeiro projeto" });
  if (await empty.isVisible()) {
    await empty.click();
  } else {
    await page.getByRole("button", { name: "+ projeto" }).click();
  }
  await page.getByLabel("título").fill(title);
  await page.getByRole("button", { name: "criar" }).click();
}

test("badge de prioridade do projeto cicla P3 → P1 → P2", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");

  await expect(page.getByLabel("prioridade do projeto P3")).toBeVisible();
  await page.getByLabel("prioridade do projeto P3").click();
  await expect(page.getByLabel("prioridade do projeto P1")).toBeVisible();
  await page.getByLabel("prioridade do projeto P1").click();
  await expect(page.getByLabel("prioridade do projeto P2")).toBeVisible();
  await page.getByLabel("prioridade do projeto P2").click();
  await expect(page.getByLabel("prioridade do projeto P3")).toBeVisible();
});

test("minimizar projeto esconde tarefas e expandir restaura", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await page.getByLabel("nova tarefa").first().fill("importante");
  await page.getByLabel("nova tarefa").first().press("Enter");
  await expect(page.getByText("importante")).toBeVisible();

  await page.getByLabel("minimizar projeto").click();
  await expect(page.getByText("importante")).toHaveCount(0);

  await page.getByLabel("expandir projeto").click();
  await expect(page.getByText("importante")).toBeVisible();
});

test("projeto minimizado persiste após reload", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await page.getByLabel("minimizar projeto").click();
  await expect(page.getByLabel("expandir projeto")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("expandir projeto")).toBeVisible();
});

test("vencimento do projeto com ano; tarefa vencida também", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");

  await page.getByRole("button", { name: "ações do projeto", exact: true }).click();
  await page.getByRole("menuitem", { name: "renomear projeto" }).click();
  await page.getByLabel("vencimento").fill("2026-09-01");
  await page.getByRole("button", { name: "salvar" }).click();
  await expect(page.getByText("01/09/2026")).toBeVisible();

  await page.getByLabel("nova tarefa").first().fill("entrega");
  await page.getByLabel("nova tarefa").first().press("Enter");
  await page.getByRole("button", { name: "kanban" }).click();
  await page.getByRole("button", { name: "editar tarefa entrega" }).first().click();
  await page.getByLabel("vencimento").fill("2026-09-05");
  await page.getByRole("button", { name: "salvar" }).click();
  await page.getByRole("button", { name: "lista" }).click();
  await expect(page.getByText("05/09/2026")).toBeVisible();
});