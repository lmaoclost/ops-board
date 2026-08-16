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

async function addSection(page: Page, title: string) {
  await page.getByRole("button", { name: "ações do projeto", exact: true }).click();
  await page.getByRole("menuitem", { name: "adicionar seção" }).click();
  await page.getByLabel("título").fill(title);
  await page.getByRole("button", { name: "criar" }).click();
}

async function addTask(page: Page, text: string) {
  await page.getByLabel("nova tarefa").first().fill(text);
  await page.getByLabel("nova tarefa").first().press("Enter");
}

test("cria projeto (com seção padrão), tarefas; persiste após reload", async ({ page }) => {
  await page.goto("/");

  await createProject(page, "webapp");
  await expect(page.getByRole("heading", { name: "webapp" })).toBeVisible();
  await expect(page.getByText("geral", { exact: true })).toHaveCount(1);

  await addTask(page, "fazer café");
  await addTask(page, "beber café");
  await expect(page.getByText("fazer café", { exact: false })).toBeVisible();
  await expect(page.getByText("beber café", { exact: false })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "webapp" })).toBeVisible();
  await expect(page.getByText("fazer café", { exact: false })).toBeVisible();
  await expect(page.getByText("beber café", { exact: false })).toBeVisible();
});

test("adiciona seção extra, edita tarefa: texto, prioridade, vencimento, nota e bloqueada", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addSection(page, "backlog");
  await expect(page.getByText("backlog", { exact: true })).toBeVisible();
  await addTask(page, "tarefa antiga");

  await page.getByTestId("task-row").getByRole("button", { name: "editar" }).click();
  const dialog = page.getByRole("dialog", { name: "editar tarefa" });
  await dialog.getByLabel("tarefa", { exact: true }).fill("tarefa nova");
  await dialog.getByLabel("prioridade").selectOption({ label: "P1 — urgente" });
  await dialog.getByLabel("vencimento").fill("2026-08-14");
  await dialog.getByLabel("nota").fill("detalhe da nota");
  await dialog.getByRole("switch").click();
  await page.getByRole("button", { name: "salvar" }).click();

  await expect(page.getByText("tarefa nova", { exact: false })).toBeVisible();
  await expect(page.getByText("detalhe da nota", { exact: false })).toBeVisible();
  await expect(page.getByText("P1", { exact: true })).toBeVisible();
  await expect(page.getByText("bloqueada", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "bloq 1" })).toBeVisible();
});

test("exclui tarefa, seção e projeto (sem confirm nativo, undo cobre)", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "tarefa a");

  await page.getByTestId("task-row").getByRole("button", { name: "excluir" }).click();
  await expect(page.getByText("tarefa a", { exact: false })).toHaveCount(0);

  await page.getByRole("button", { name: "ações da seção", exact: true }).click();
  await page.getByRole("menuitem", { name: "excluir seção" }).click();
  await expect(page.getByText("geral", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "ações do projeto", exact: true }).click();
  await page.getByRole("menuitem", { name: "excluir projeto" }).click();
  await expect(page.getByText("nenhum projeto na fila.")).toBeVisible();
});

test("renomeia projeto e marca/desmarca stuck pelo ⋯; renomeia seção", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");

  await page.getByRole("button", { name: "ações do projeto", exact: true }).click();
  await page.getByRole("menuitem", { name: "renomear projeto" }).click();
  await page.getByLabel("título").fill("prod");
  await page.getByRole("button", { name: "salvar" }).click();
  await expect(page.getByRole("heading", { name: "prod" })).toBeVisible();

  await page.getByRole("button", { name: "ações do projeto", exact: true }).click();
  await page.getByRole("menuitem", { name: "marcar como stuck / bloqueado" }).click();
  await expect(page.getByText("stuck", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "ações do projeto", exact: true }).click();
  await page.getByRole("menuitem", { name: "desmarcar stuck / bloqueado" }).click();
  await expect(page.getByText("stuck", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "ações da seção", exact: true }).click();
  await page.getByRole("menuitem", { name: "renomear seção" }).click();
  await page.getByLabel("título").fill("backlog");
  await page.getByRole("button", { name: "salvar" }).click();
  await expect(page.getByText("backlog", { exact: true })).toBeVisible();
  await expect(page.getByText("geral", { exact: true })).toHaveCount(0);
});