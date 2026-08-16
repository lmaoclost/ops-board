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

test("adiciona sub-tarefas, alterna e salva; contador no kanban; persiste", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await page.getByLabel("nova tarefa").first().fill("setup");
  await page.getByLabel("nova tarefa").first().press("Enter");

  await page.getByRole("button", { name: "kanban" }).click();
  await page.getByRole("button", { name: "editar tarefa setup" }).click();
  await page.getByLabel("nova sub-tarefa").fill("instalar deps");
  await page.getByLabel("nova sub-tarefa").press("Enter");
  await page.getByLabel("nova sub-tarefa").fill("configurar env");
  await page.getByLabel("nova sub-tarefa").press("Enter");
  await page.getByRole("checkbox", { name: "sub-tarefa instalar deps" }).click();
  await page.getByRole("button", { name: "salvar" }).click();
  await page.getByRole("button", { name: "lista" }).click();

  await expect(page.getByRole("checkbox", { name: "sub-tarefa instalar deps" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText("instalar deps")).toBeVisible();
  await expect(page.getByText("configurar env")).toBeVisible();

  await page.getByRole("button", { name: "kanban" }).click();
  await expect(page.getByLabel("sub-tarefas 1/2")).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: "kanban" }).click();
  await expect(page.getByLabel("sub-tarefas 1/2")).toBeVisible();
});

test("remove sub-tarefa e o contador atualiza", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await page.getByLabel("nova tarefa").first().fill("setup");
  await page.getByLabel("nova tarefa").first().press("Enter");

  await page.getByRole("button", { name: "kanban" }).click();
  await page.getByRole("button", { name: "editar tarefa setup" }).click();
  await page.getByLabel("nova sub-tarefa").fill("sobraria");
  await page.getByLabel("nova sub-tarefa").press("Enter");
  await page.getByRole("checkbox", { name: "sub-tarefa sobraria" }).click();
  await page.getByLabel("remover sub-tarefa sobraria").click();
  await page.getByRole("button", { name: "salvar" }).click();
  await page.getByRole("button", { name: "lista" }).click();

  await expect(page.getByText("sobraria")).toHaveCount(0);
  await page.getByRole("button", { name: "kanban" }).click();
  await expect(page.getByLabel("sub-tarefas 1/2")).toHaveCount(0);
});

test("adiciona sub-tarefa inline na lista, alterna e remove", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await page.getByLabel("nova tarefa").first().fill("setup");
  await page.getByLabel("nova tarefa").first().press("Enter");

  const addSub = page.getByTestId("task-row").getByRole("button", { name: "nova sub-tarefa" });
  await addSub.click();
  await page.getByRole("textbox", { name: "nova sub-tarefa" }).fill("instalar deps");
  await page.getByRole("textbox", { name: "nova sub-tarefa" }).press("Enter");
  await addSub.click();
  await page.getByRole("textbox", { name: "nova sub-tarefa" }).fill("configurar env");
  await page.getByRole("textbox", { name: "nova sub-tarefa" }).press("Enter");

  await expect(page.getByText("instalar deps")).toBeVisible();
  await expect(page.getByText("configurar env")).toBeVisible();

  await page.getByRole("checkbox", { name: "sub-tarefa instalar deps" }).click();
  await expect(page.getByRole("checkbox", { name: "sub-tarefa instalar deps" })).toHaveAttribute("aria-checked", "true");

  await page.getByRole("button", { name: "kanban" }).click();
  await expect(page.getByLabel("sub-tarefas 1/2")).toBeVisible();

  await page.getByRole("button", { name: "lista" }).click();
  await page.getByLabel("remover sub-tarefa configurar env").click();
  await expect(page.getByText("configurar env")).toHaveCount(0);

  await page.getByRole("button", { name: "kanban" }).click();
  await expect(page.getByLabel("sub-tarefas 1/1")).toBeVisible();
});