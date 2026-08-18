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

const iso = (offset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

async function stubNotification(page: Page) {
  await page.addInitScript(() => {
    const calls: Array<{ title: string; opts?: { body?: string } }> = [];
    (window as unknown as { __notifyCalls: unknown }).__notifyCalls = calls;
    (window as unknown as { Notification: unknown }).Notification = class {
      static permission = "granted";
      static requestPermission = async () => "granted";
      constructor(title: string, opts?: { body?: string }) {
        calls.push({ title, opts });
      }
    };
  });
}

test("notifica tarefas vencidas e de hoje no load", async ({ page }) => {
  await stubNotification(page);
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "atrasada");
  await page.getByTestId("task-row").filter({ hasText: "atrasada" }).getByRole("button", { name: "editar", exact: true }).click();
  await page.getByRole("dialog", { name: "editar tarefa" }).getByLabel("vencimento").fill(iso(-1));
  await page.getByRole("button", { name: "salvar" }).click();

  await page.reload();

  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __notifyCalls: unknown[] }).__notifyCalls.length))
    .toBe(1);
  const calls = await page.evaluate(
    () => (window as unknown as { __notifyCalls: Array<{ title: string; opts?: { body?: string } }> }).__notifyCalls,
  );
  expect(calls[0].title).toBe("1 tarefa pendente");
  expect(calls[0].opts?.body).toContain("atrasada");
});

test("sem tarefas vencidas/hoje não notifica", async ({ page }) => {
  await stubNotification(page);
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "amanhã");
  await page.getByTestId("task-row").filter({ hasText: "amanhã" }).getByRole("button", { name: "editar", exact: true }).click();
  await page.getByRole("dialog", { name: "editar tarefa" }).getByLabel("vencimento").fill(iso(1));
  await page.getByRole("button", { name: "salvar" }).click();

  await page.reload();

  const calls = await page.evaluate(() => (window as unknown as { __notifyCalls: Array<{ title: string }> }).__notifyCalls);
  expect(calls).toHaveLength(0);
});