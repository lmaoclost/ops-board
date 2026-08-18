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

test("dependência: badge bloqueada por X some quando a dependência conclui", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "build base");
  await addTask(page, "deploy");

  await page
    .getByTestId("task-row")
    .filter({ hasText: "deploy" })
    .getByRole("button", { name: "editar", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "editar tarefa" });
  await dialog.getByLabel("depende de").selectOption({ label: "build base" });
  await page.getByRole("button", { name: "salvar" }).click();

  await expect(page.getByText("⛓ bloqueada por build base", { exact: true })).toBeVisible();

  await page
    .getByTestId("task-row")
    .filter({ hasText: "build base" })
    .first()
    .getByLabel("alternar concluída")
    .click();

  await expect(page.getByText("⛓ bloqueada por build base", { exact: true })).not.toBeVisible();
});

test("kanban mostra o mesmo badge de dependência", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "build base");
  await addTask(page, "deploy");

  await page
    .getByTestId("task-row")
    .filter({ hasText: "deploy" })
    .getByRole("button", { name: "editar", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "editar tarefa" });
  await dialog.getByLabel("depende de").selectOption({ label: "build base" });
  await page.getByRole("button", { name: "salvar" }).click();

  await page.getByRole("button", { name: "kanban" }).click();
  await expect(page.getByText("⛓ bloqueada por build base", { exact: true })).toBeVisible();
});