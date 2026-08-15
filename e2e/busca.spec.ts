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

async function addTask(page: Page, text: string) {
  await page.getByLabel("nova tarefa").fill(text);
  await page.getByLabel("nova tarefa").press("Enter");
}

test("buscar nome de tarefa mostra só a tarefa que casa", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "teste");
  await addTask(page, "relatório do cliente");
  await addTask(page, "reunião de alinhamento");
  await addTask(page, "pagar fatura");

  await page.getByLabel("buscar tarefas").fill("relatório");
  await expect(page.getByTestId("task-row")).toHaveCount(1);
  await expect(page.getByTestId("task-row")).toContainText("relatório do cliente");
});

test("buscar título do projeto mostra o projeto inteiro", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "teste");
  await addTask(page, "tarefa um");
  await addTask(page, "tarefa dois");

  await page.getByLabel("buscar tarefas").fill("teste");
  await expect(page.getByTestId("task-row")).toHaveCount(2);
  await expect(page.getByText("tarefa um", { exact: true })).toBeVisible();
  await expect(page.getByText("tarefa dois", { exact: true })).toBeVisible();
});

test("buscar sem resultado mostra empty state com CTA e limpar restaura", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "teste");
  await addTask(page, "tarefa única");

  await page.getByLabel("buscar tarefas").fill("nada disso existe");
  await expect(page.getByText(/nada casa com o filtro/)).toBeVisible();

  await page.getByRole("button", { name: "✕ limpar filtros" }).click();
  await expect(page.getByText("tarefa única", { exact: true })).toBeVisible();
});

test("filtro por status também é granular (só tarefas do status)", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "teste");
  await addTask(page, "na fila");
  await addTask(page, "outra na fila");

  await page.getByRole("button", { name: "doing 0" }).click();
  await expect(page.getByText(/nada casa com o filtro/)).toBeVisible();
});