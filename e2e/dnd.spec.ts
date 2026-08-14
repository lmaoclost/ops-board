import { expect, test, type Locator, type Page } from "@playwright/test";

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

async function addSection(page: Page, title: string) {
  await page.getByRole("button", { name: "ações do projeto", exact: true }).click();
  await page.getByRole("menuitem", { name: "adicionar seção" }).click();
  await page.getByLabel("título").fill(title);
  await page.getByRole("button", { name: "criar" }).click();
}

async function addTask(page: Page, text: string, section = 0) {
  await page.getByLabel("nova tarefa").nth(section).fill(text);
  await page.getByLabel("nova tarefa").nth(section).press("Enter");
}

async function drag(page: Page, src: Locator, dst: Locator) {
  const sb = await src.boundingBox();
  const db = await dst.boundingBox();
  if (!sb || !db) throw new Error("bounding box indisponível");
  await page.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2);
  await page.mouse.down();
  await page.mouse.move(sb.x + sb.width / 2 + 12, sb.y + sb.height / 2, { steps: 4 });
  await page.mouse.move(db.x + db.width / 2, db.y + db.height / 2, { steps: 12 });
  await page.mouse.up();
}

test("reordena tarefa dentro da seção por arrasto", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "primeira");
  await addTask(page, "segunda");

  const rows = page.getByTestId("task-row");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText("primeira");
  await expect(rows.nth(1)).toContainText("segunda");

  await drag(page, rows.nth(1), rows.nth(0));

  await expect(rows.nth(0)).toContainText("segunda");
  await expect(rows.nth(1)).toContainText("primeira");
});

test("move tarefa entre seções por arrasto", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addSection(page, "backlog");
  await addTask(page, "em geral", 0);
  await addTask(page, "em backlog", 1);

  await drag(page, page.getByTestId("task-row").first(), page.getByTestId("task-row").nth(1));

  await expect(page.getByText("0/0", { exact: true })).toBeVisible();
  await expect(page.getByText("0/2", { exact: true })).toBeVisible();
  await expect(page.getByTestId("task-row")).toHaveCount(2);
});

test("muda status via kanban: arrasta para a coluna concluída e dispara confete", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "na fila");

  await page.getByRole("button", { name: "kanban" }).click();
  await expect(page.getByText("a fazer 1", { exact: true })).toBeVisible();

  await drag(page, page.getByText("na fila", { exact: true }), page.getByText("concluída 0", { exact: true }));

  await expect(page.getByText("concluída 1", { exact: true })).toBeVisible();
  await expect(page.getByText("a fazer 0", { exact: true })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(1);
});

test("kanban: move tarefa entre colunas (todo → em andamento)", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "na fila");

  await page.getByRole("button", { name: "kanban" }).click();

  await drag(page, page.getByText("na fila", { exact: true }), page.getByText("em andamento 0", { exact: true }));

  await expect(page.getByText("em andamento 1", { exact: true })).toBeVisible();
  await expect(page.getByText("a fazer 0", { exact: true })).toBeVisible();
  await expect(page.getByText("na fila", { exact: true })).toBeVisible();
});