import { expect, test, type Page } from "@playwright/test";

const STORAGE_KEY = "opsboard.v1";

async function seedWithExpiredTrash(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "+ criar primeiro projeto" }).click();
  await page.getByLabel("título").fill("app");
  await page.getByRole("button", { name: "criar" }).click();
  await page.getByLabel("nova tarefa").first().fill("task velha");
  await page.getByLabel("nova tarefa").first().press("Enter");
  await page
    .getByTestId("task-row")
    .filter({ hasText: "task velha" })
    .getByLabel("alternar concluída")
    .click();
  await page
    .getByTestId("task-row")
    .filter({ hasText: "task velha" })
    .getByRole("button", { name: "excluir", exact: true })
    .click();
  await expect(page.getByText("lixeira vazia.")).not.toBeVisible();
}

test("tarefa na lixeira há mais de 7 dias é purgada ao abrir o app", async ({ page }) => {
  await seedWithExpiredTrash(page);
  await page.evaluate((key) => {
    const raw = JSON.parse(localStorage.getItem(key) ?? "{}");
    const task = raw.state.projetos[0].sections[0].tasks[0];
    task.deletedAt = "2020-01-01T00:00:00.000Z";
    localStorage.setItem(key, JSON.stringify(raw));
  }, STORAGE_KEY);

  await page.reload();
  await page.getByRole("button", { name: "lixeira" }).click();
  await expect(page.getByText("lixeira vazia.")).toBeVisible();
});

test("tarefa na lixeira há menos de 7 dias permanece", async ({ page }) => {
  await seedWithExpiredTrash(page);
  await page.evaluate((key) => {
    const raw = JSON.parse(localStorage.getItem(key) ?? "{}");
    const task = raw.state.projetos[0].sections[0].tasks[0];
    task.deletedAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(key, JSON.stringify(raw));
  }, STORAGE_KEY);

  await page.reload();
  await page.getByRole("button", { name: "lixeira" }).click();
  await expect(page.getByText("task velha", { exact: true })).toBeVisible();
});
