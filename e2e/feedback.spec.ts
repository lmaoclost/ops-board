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

test("atalho n foca o primeiro input de nova tarefa", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "tarefa a");

  await page.keyboard.press("n");
  await expect(page.getByLabel("nova tarefa").first()).toBeFocused();
});

test("? abre o modal de ajuda com tabela de atalhos e esc fecha", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("?");
  const dialog = page.getByRole("dialog", { name: "atalhos e dicas" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("desfazer (Ctrl+Z)", { exact: true })).toBeVisible();
  await expect(dialog.getByText("focar nova tarefa", { exact: true })).toBeVisible();
  await expect(dialog.getByText("kanban: arraste cartões entre colunas", { exact: false })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("concluir tarefa dispara confete (canvas) e toast acessível de backup", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "tarefa a");

  await page.getByTestId("task-row").getByRole("button", { name: "alternar concluída" }).click();
  await expect.poll(() => page.locator("canvas").count()).toBeGreaterThan(0);

  await page.getByRole("button", { name: "↓exportar" }).click();
  const toast = page.getByRole("status").filter({ hasText: "backup exportado" });
  await expect(toast).toBeVisible();
  await expect(toast).toHaveAttribute("aria-live", "polite");
});

test("hint da lista descreve arraste entre seções/projetos", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/lista: arraste tarefas entre seções\/projetos/)).toBeVisible();
});
