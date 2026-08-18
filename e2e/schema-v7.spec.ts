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

async function openEdit(page: Page, text: string) {
  await page.getByTestId("task-row").filter({ hasText: text }).getByRole("button", { name: "editar", exact: true }).click();
}

const iso = (offset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

test("recorrência diária: concluir re-agenda para amanhã em vez de concluir", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "regar plantas");
  await openEdit(page, "regar plantas");
  const dialog = page.getByRole("dialog", { name: "editar tarefa" });
  await dialog.getByLabel("vencimento").fill(iso(0));
  await dialog.getByLabel("recorrência").selectOption("daily");
  await page.getByRole("button", { name: "salvar" }).click();

  await expect(page.getByText("↻ diária")).toBeVisible();

  await page.getByLabel("alternar concluída").click();

  await expect(page.getByText("regar plantas", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "a fazer 1" })).toBeVisible();
  await page.getByRole("button", { name: "agenda" }).click();
  await expect(page.getByText("regar plantas", { exact: true })).toBeVisible();
  await expect(page.getByText("próximos 7 dias", { exact: true })).toBeVisible();
});

test("lixeira: excluir esconde, restaurar devolve, excluir definitivamente remove", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "descartável");

  await page.getByTestId("task-row").getByRole("button", { name: "excluir", exact: true }).click();
  await expect(page.getByText("descartável", { exact: true })).not.toBeVisible();

  await page.getByRole("button", { name: "lixeira" }).click();
  await expect(page.getByLabel("restaurar descartável")).toBeVisible();
  await page.getByLabel("restaurar descartável").click();

  await page.getByRole("button", { name: "lista" }).click();
  await expect(page.getByText("descartável", { exact: true })).toBeVisible();

  await page.getByTestId("task-row").getByRole("button", { name: "excluir", exact: true }).click();
  await page.getByRole("button", { name: "lixeira" }).click();
  await page.getByLabel("excluir definitivamente descartável").click();
  await expect(page.getByText("lixeira vazia.")).toBeVisible();
});