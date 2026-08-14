import { expect, test, type Page } from "@playwright/test";

async function createProject(page: Page, title: string) {
  await page.getByRole("button", { name: "+ criar primeiro projeto" }).click();
  await page.getByLabel("título").fill(title);
  await page.getByRole("button", { name: "criar" }).click();
}

async function addTask(page: Page, text: string) {
  await page.getByLabel("nova tarefa").first().fill(text);
  await page.getByLabel("nova tarefa").first().press("Enter");
}

test("filtra por status no nível do projeto e limpa com esc", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "completado");
  await addTask(page, "tarefa concluída");
  await page.getByRole("combobox", { name: "status" }).click();
  await page.getByRole("option", { name: "concluída" }).click();

  await page.getByRole("button", { name: "+ projeto" }).click();
  await page.getByLabel("título").fill("em aberto");
  await page.getByRole("button", { name: "criar" }).click();
  await addTask(page, "tarefa pendente");

  await page.getByRole("button", { name: "done 1" }).click();
  await expect(page.getByRole("heading", { name: "completado" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "em aberto" })).toHaveCount(0);

  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "em aberto" })).toBeVisible();
  await expect(page.getByRole("button", { name: "✕ limpar" })).toHaveCount(0);
});

test("busca por texto de tarefa e mostra vazio quando nada casa", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "relatório mensal");

  await page.getByLabel("buscar tarefas").fill("relatório");
  await expect(page.getByText("relatório mensal", { exact: false })).toBeVisible();

  await page.getByLabel("buscar tarefas").fill("zumbi");
  await expect(page.getByText("nada casa com o filtro.")).toBeVisible();

  await page.getByRole("button", { name: "limpar busca" }).click();
  await expect(page.getByText("relatório mensal", { exact: false })).toBeVisible();
});

test("kanban por status e volta para a lista (botão e atalho k)", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "na fila");
  await addTask(page, "feita");
  await page.getByRole("combobox", { name: "status" }).first().click();
  await page.getByRole("option", { name: "concluída" }).click();

  await page.getByRole("button", { name: "kanban" }).click();
  await expect(page.getByText("a fazer 1", { exact: true })).toBeVisible();
  await expect(page.getByText("concluída 1", { exact: true })).toBeVisible();

  await page.keyboard.press("k");
  await expect(page.getByRole("button", { name: "kanban" })).toBeVisible();
  await expect(page.getByTestId("task-row")).toHaveCount(2);
});

test("atalhos: p abre projeto, 1 filtra todo, ? mostra ajuda, t alterna tema, esc limpa", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "pendencia");

  await page.locator("body").click({ position: { x: 4, y: 4 } });
  await page.keyboard.press("p");
  await expect(page.getByLabel("título")).toBeVisible();
  await page.getByLabel("título").fill("outro");
  await page.getByRole("button", { name: "criar" }).click();
  await expect(page.getByRole("heading", { name: "outro" })).toBeVisible();

  await page.keyboard.press("1");
  await expect(page.getByRole("button", { name: "todo 1" })).toHaveAttribute("aria-pressed", "true");

  await page.keyboard.press("?");
  await expect(page.getByText("p projeto · n tarefa · 1-5 filtros · k kanban · t tema · ? ajuda · esc limpa")).toBeVisible();

  const html = page.locator("html");
  await expect(html).toHaveClass(/light/);
  await page.keyboard.press("t");
  await expect(html).toHaveClass(/dark/);
  await page.keyboard.press("t");
  await expect(html).toHaveClass(/light/);

  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "todo 1" })).toHaveAttribute("aria-pressed", "false");
});

test("ordena por prioridade (P1 no topo) com ↕ prio", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "tarefa b");
  await addTask(page, "tarefa a");

  const rows = page.getByTestId("task-row");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText("tarefa b");
  await expect(rows.nth(1)).toContainText("tarefa a");

  await rows.nth(1).getByRole("button", { name: "prioridade: clique pra mudar" }).click();
  await expect(rows.nth(1)).toContainText("P1");

  await page.getByRole("button", { name: "↕ prio" }).click();
  await expect(rows.nth(0)).toContainText("tarefa a");
  await expect(rows.nth(1)).toContainText("tarefa b");
});