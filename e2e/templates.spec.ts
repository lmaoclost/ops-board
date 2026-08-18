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
  await page.getByLabel("nova tarefa").first().fill(text);
  await page.getByLabel("nova tarefa").first().press("Enter");
}

test("salvar como template e inserir reproduz texto e sub-tarefas", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "limpar cache");
  await page
    .getByTestId("task-row")
    .filter({ hasText: "limpar cache" })
    .getByRole("button", { name: "nova sub-tarefa" })
    .click();
  await page.getByRole("textbox", { name: "nova sub-tarefa" }).fill("drop volumes");
  await page.getByRole("textbox", { name: "nova sub-tarefa" }).press("Enter");

  await page
    .getByTestId("task-row")
    .filter({ hasText: "limpar cache" })
    .getByRole("button", { name: "salvar como template" })
    .click();

  await addTask(page, "outra");
  await page.getByRole("button", { name: "inserir template" }).click();
  await page.getByRole("menuitem", { name: "limpar cache" }).click();

  const rows = page.getByTestId("task-row").filter({ hasText: "limpar cache" });
  await expect(rows).toHaveCount(2);
  await expect(page.getByText("drop volumes", { exact: true })).toHaveCount(2);
});

test("menu vazio mostra aviso e excluir template remove da lista", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");

  await page.getByRole("button", { name: "inserir template" }).click();
  await expect(page.getByText("nenhum template salvo")).toBeVisible();
  await page.keyboard.press("Escape");

  await addTask(page, "checkout");
  await page
    .getByTestId("task-row")
    .filter({ hasText: "checkout" })
    .getByRole("button", { name: "salvar como template" })
    .click();

  await page.getByRole("button", { name: "inserir template" }).click();
  await page.getByRole("button", { name: "excluir template checkout" }).click();
  await expect(page.getByText("nenhum template salvo")).toBeVisible();
});