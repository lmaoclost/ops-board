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

async function editTask(page: Page, text: string, due: string) {
  const row = page.getByTestId("task-row").filter({ hasText: text });
  await row.getByRole("button", { name: "editar", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "editar tarefa" });
  await dialog.getByLabel("vencimento").fill(due);
  await page.getByRole("button", { name: "salvar" }).click();
}

const iso = (offset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

test("agenda: agrupa vencidas, hoje e próximos 7 dias; sem due não aparece", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "atrasada");
  await editTask(page, "atrasada", iso(-2));
  await addTask(page, "de hoje");
  await editTask(page, "de hoje", iso(0));
  await addTask(page, "em breve");
  await editTask(page, "em breve", iso(3));
  await addTask(page, "sem data");

  await page.getByRole("button", { name: "agenda" }).click();

  await expect(page.getByText("vencidas", { exact: true })).toBeVisible();
  await expect(page.getByText("hoje", { exact: true })).toBeVisible();
  await expect(page.getByText("próximos 7 dias", { exact: true })).toBeVisible();
  await expect(page.getByText("atrasada", { exact: true })).toBeVisible();
  await expect(page.getByText("de hoje", { exact: true })).toBeVisible();
  await expect(page.getByText("em breve", { exact: true })).toBeVisible();
  await expect(page.getByText("sem data", { exact: true })).not.toBeVisible();
});

test("agenda: LED conclui a tarefa e ela sai da agenda", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "de hoje");
  await editTask(page, "de hoje", iso(0));

  await page.getByRole("button", { name: "agenda" }).click();
  await page.getByLabel("alternar concluída").click();
  await expect(page.getByText("de hoje", { exact: true })).not.toBeVisible();
  await expect(page.getByText("nenhuma tarefa para a agenda.")).toBeVisible();
});

test("agenda: clique na tarefa abre a edição", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "de hoje");
  await editTask(page, "de hoje", iso(0));

  await page.getByRole("button", { name: "agenda" }).click();
  await page.getByRole("button", { name: /de hoje/ }).click();
  const dialog = page.getByRole("dialog", { name: "editar tarefa" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("tarefa", { exact: true }).fill("revisada");
  await page.getByRole("button", { name: "salvar" }).click();
  await expect(page.getByText("revisada", { exact: true })).toBeVisible();
});