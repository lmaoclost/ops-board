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

const projectCard = (page: Page, title: string) =>
  page.locator("section.rounded-lg").filter({ hasText: title });

async function addTask(page: Page, projectTitle: string, text: string) {
  const input = projectCard(page, projectTitle).getByLabel("nova tarefa").first();
  await input.fill(text);
  await input.press("Enter");
}

const archiveMenu = (page: Page, title: string) =>
  projectCard(page, title).getByLabel("ações do projeto");

test("chip arquivados filtra de verdade: só arquivados visíveis; limpar reseta", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "Ativo A");
  await addTask(page, "Ativo A", "tarefa ativa");
  await createProject(page, "Arquivo P");
  await addTask(page, "Arquivo P", "tarefa antiga");

  await archiveMenu(page, "Arquivo P").click();
  await page.getByRole("menuitem", { name: "arquivar projeto" }).click();

  await expect(page.getByText("Arquivo P")).toHaveCount(0);
  await expect(page.getByTestId("stat-total")).toHaveText("1");
  const chip = page.getByRole("button", { name: /arquivados/ });
  await expect(chip).toContainText("1");
  await expect(page.getByRole("button", { name: "✕ limpar" })).toHaveCount(0);

  await chip.click();
  await expect(page.getByText("Arquivo P")).toBeVisible();
  await expect(page.getByText("Ativo A")).toHaveCount(0);
  await expect(page.getByText("arquivado", { exact: true })).toBeVisible();
  await expect(page.getByTestId("stat-total")).toHaveText("1");
  await expect(page.getByRole("button", { name: "✕ limpar" })).toBeVisible();

  await page.getByLabel("ações do projeto").click();
  await page.getByRole("menuitem", { name: "desarquivar projeto" }).click();
  await expect(page.getByText("projeto desarquivado")).toBeVisible();
  await expect(page.getByText("Arquivo P")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /arquivados/ })).toContainText("0");

  await page.getByRole("button", { name: "✕ limpar" }).click();
  await expect(page.getByText("Arquivo P")).toBeVisible();
  await expect(page.getByTestId("stat-total")).toHaveText("2");
  await expect(page.getByRole("button", { name: /arquivados/ })).toHaveAttribute("aria-pressed", "false");
});

test("filtro de status combina com arquivados", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "P Done");
  await addTask(page, "P Done", "terminada");
  await page.getByLabel("alternar concluída").first().click();
  await createProject(page, "P Todo");
  await addTask(page, "P Todo", "pendente");

  await archiveMenu(page, "P Done").click();
  await page.getByRole("menuitem", { name: "arquivar projeto" }).click();
  await archiveMenu(page, "P Todo").click();
  await page.getByRole("menuitem", { name: "arquivar projeto" }).click();
  await page.getByRole("button", { name: /arquivados/ }).click();

  await page.getByRole("button", { name: "done" }).click();
  await expect(page.getByText("terminada")).toBeVisible();
  await expect(page.getByText("P Todo")).toHaveCount(0);

  await page.getByRole("button", { name: /^todo/ }).click();
  await expect(page.getByText("pendente", { exact: true })).toBeVisible();
  await expect(page.getByText("P Done")).toHaveCount(0);
});

test("arquivamento persiste no reload", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "P Arquivo");
  await page.getByLabel("ações do projeto").click();
  await page.getByRole("menuitem", { name: "arquivar projeto" }).click();

  await page.reload();
  await expect(page.getByText("P Arquivo")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /arquivados/ })).toContainText("1");
});
