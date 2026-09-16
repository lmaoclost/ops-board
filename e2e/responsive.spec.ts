import { expect, test, type Page } from "@playwright/test";

async function seedBoard(page: Page) {
  await page.addInitScript(() => localStorage.setItem("opsboard.notice-v1", "1"));
  await page.goto("/");
  await page.getByRole("button", { name: "+ criar primeiro projeto" }).click();
  await page.getByLabel("título").fill("resp");
  await page.getByRole("button", { name: "criar" }).click();
  await page.getByLabel("nova tarefa").first().fill("tarefa longa para forçar quebra de linha no mobile com prioridade e vencimento");
  await page.getByLabel("nova tarefa").first().press("Enter");
}

async function switchView(page: Page, name: string) {
  const btn = page.getByRole("button", { name, exact: true });
  if (await btn.count()) {
    await btn.click();
    return;
  }
  await page.getByRole("button", { name: "menu" }).click();
  await page.getByRole("menuitem", { name, exact: true }).click();
}

async function noHorizontalScroll(page: Page, width: number) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
}

test("360px: sem scroll horizontal e ações da tarefa no menu ⋯", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await seedBoard(page);
  const row = page.getByTestId("task-row").first();

  await noHorizontalScroll(page, 360);
  await expect(row.getByRole("button", { name: "ações da tarefa", exact: true })).toBeVisible();

  await row.getByRole("button", { name: "ações da tarefa", exact: true }).click();
  await expect(page.getByRole("menuitem", { name: "editar" })).toBeVisible();
  await page.getByRole("menuitem", { name: "excluir" }).click();
  await expect(page.getByRole("dialog", { name: "excluir tarefa?" })).toBeVisible();
});

test("360px: kanban e agenda sem scroll horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await seedBoard(page);

  await switchView(page, "kanban");
  await noHorizontalScroll(page, 360);
  await switchView(page, "agenda");
  await noHorizontalScroll(page, 360);
});

test("768px: sem scroll horizontal e ações inline visíveis", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await seedBoard(page);
  const row = page.getByTestId("task-row").first();

  await noHorizontalScroll(page, 768);
  await expect(row.getByRole("button", { name: "editar" })).toBeVisible();

  await switchView(page, "kanban");
  await noHorizontalScroll(page, 768);
});

test("360px: menu ☰ contém exportar/importar/privacidade; itens funcionam", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await seedBoard(page);

  const burger = page.getByRole("button", { name: "menu" });
  await expect(burger).toBeVisible();

  await burger.click();
  const exportItem = page.getByRole("menuitem", { name: "↓exportar" });
  await expect(exportItem).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "↑importar" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "privacidade" })).toBeVisible();

  await page.getByRole("menuitem", { name: "privacidade" }).click();
  await expect(page).toHaveURL(/\/privacy/);
});

test("360px: kanban arrasta pelo grip da tarefa entre colunas", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await seedBoard(page);

  await switchView(page, "kanban");
  await expect(page.getByText("a fazer 1", { exact: true })).toBeVisible();

  const card = page.getByTestId("kanban-task").filter({ hasText: "tarefa longa" }).first();
  const grip = card.getByRole("button", { name: "arrastar tarefa p/ reordenar" });
  await expect(grip).toBeVisible();
  const sb = await grip.boundingBox();
  const dst = page.getByText("em andamento 0", { exact: true });
  const db = await dst.boundingBox();
  if (!sb || !db) throw new Error("bounding box indisponível");

  await page.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2);
  await page.mouse.down();
  await page.mouse.move(sb.x + sb.width / 2 + 12, sb.y + sb.height / 2, { steps: 4 });
  await page.mouse.move(db.x + db.width / 2, db.y + db.height / 2, { steps: 6 });

  const overlay = page.getByTestId("kanban-drag-overlay");
  await expect(overlay).toBeVisible();
  await expect(overlay).toContainText("tarefa longa");
  await expect(card).toHaveClass(/opacity-40/);

  await page.mouse.up();

  await expect(page.getByText("em andamento 1", { exact: true })).toBeVisible();
  await expect(page.getByText("a fazer 0", { exact: true })).toBeVisible();
});
