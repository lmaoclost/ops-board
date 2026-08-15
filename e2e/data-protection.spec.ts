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

test("ctrl+z desfaz exclusão de projeto", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "tarefa a");

  await page.getByRole("button", { name: "ações do projeto", exact: true }).click();
  await page.getByRole("menuitem", { name: "excluir projeto" }).click();
  await expect(page.getByText("nenhum projeto na fila.")).toBeVisible();

  await page.keyboard.press("Control+z");
  await expect(page.getByRole("heading", { name: "app" })).toBeVisible();
  await expect(page.getByText("tarefa a", { exact: false })).toBeVisible();
  await expect(page.getByText("desfeito", { exact: true })).toBeVisible();
});

test("ctrl+z não desfaz enquanto digitando em input", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "tarefa a");

  await page.getByLabel("nova tarefa").first().focus();
  await page.keyboard.press("Control+z");
  await expect(page.getByRole("heading", { name: "app" })).toBeVisible();
});

test("import pede confirmação; cancelar não muda nada", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");

  await page.getByRole("button", { name: "↑importar" }).click();
  const dialog = page.getByRole("dialog", { name: "importar backup" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/substitui 1 projeto/)).toBeVisible();
  await dialog.getByRole("button", { name: "cancelar" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "app" })).toBeVisible();
});

test("ctrl+z desfaz import", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");

  const backup = {
    projetos: [
      { id: "x1", title: "importado", blocked: false, archived: false, sections: [{ id: "sx", title: "geral", notes: "", collapsed: false, tasks: [] }] },
    ],
  };
  await page.getByRole("button", { name: "↑importar" }).click();
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "escolher arquivo" }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles({ name: "b.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup)) });
  await expect(page.getByText("importado: 1 projeto(s)")).toBeVisible();
  await expect(page.getByRole("heading", { name: "importado" })).toBeVisible();

  await page.keyboard.press("Control+z");
  await expect(page.getByRole("heading", { name: "app" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "importado" })).toHaveCount(0);
});

test("ctrl+z desfaz apagar todos os dados", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "tarefa a");

  await page.getByRole("button", { name: "apagar todos os dados" }).click();
  const dialog = page.getByRole("dialog", { name: "apagar todos os dados" });
  await expect(dialog.getByText(/pode desfazer com Ctrl\+Z/)).toBeVisible();
  await dialog.getByRole("button", { name: "apagar tudo" }).click();
  await expect(page.getByText("nenhum projeto na fila.")).toBeVisible();

  await page.keyboard.press("Control+z");
  await expect(page.getByRole("heading", { name: "app" })).toBeVisible();
  await expect(page.getByText("tarefa a", { exact: false })).toBeVisible();
});

test("ctrl+z desfaz conclusão de tarefa", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "tarefa a");

  await page.getByTestId("task-row").getByRole("button", { name: "alternar concluída" }).click();
  await page.keyboard.press("Control+z");
  await expect(page.getByText("tarefa a", { exact: false })).toBeVisible();
});
