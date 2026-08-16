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

async function addTask(page: Page, text: string, section = 0) {
  await page.getByLabel("nova tarefa").nth(section).fill(text);
  await page.getByLabel("nova tarefa").nth(section).press("Enter");
}

async function editTask(page: Page, text: string, patch: { prio?: string; due?: string; blocked?: boolean }) {
  const row = page.getByTestId("task-row").filter({ hasText: text });
  await row.getByRole("button", { name: "editar", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "editar tarefa" });
  if (patch.prio) await dialog.getByLabel("prioridade").selectOption({ label: patch.prio });
  if (patch.due) await dialog.getByLabel("vencimento").fill(patch.due);
  if (patch.blocked) await dialog.getByRole("switch").click();
  await page.getByRole("button", { name: "salvar" }).click();
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

test("kanban rico: card mostra prio, due vencida e bloqueada", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "urgente");
  await editTask(page, "urgente", { prio: "P1 — urgente", due: "2020-01-01", blocked: true });

  await page.getByRole("button", { name: "kanban" }).click();

  const card = page.getByTestId("kanban-task").filter({ hasText: "urgente" });
  await expect(card.getByText("P1", { exact: true })).toBeVisible();
  await expect(card.getByText(/vencida/)).toBeVisible();
  await expect(card.getByText(/bloqueada/)).toBeVisible();
});

test("kanban rico: clique no card abre edição e salva mudança", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "na fila");

  await page.getByRole("button", { name: "kanban" }).click();
  await page.getByRole("button", { name: "editar tarefa na fila", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "editar tarefa" });
  await dialog.getByLabel("tarefa", { exact: true }).fill("na fila revisada");
  await page.getByRole("button", { name: "salvar" }).click();

  await expect(page.getByText("na fila revisada", { exact: true })).toBeVisible();
});

test("empty state de filtro: CTA limpar filtros restaura a lista", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "tarefa única");

  await page.getByLabel("buscar").fill("não existe");
  await expect(page.getByText(/nada casa com o filtro/)).toBeVisible();

  await page.getByRole("button", { name: "✕ limpar filtros" }).click();

  await expect(page.getByText("tarefa única", { exact: true })).toBeVisible();
});

test("drag para o fim da seção adiciona a tarefa no final", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "primeira");
  await addTask(page, "segunda");
  await addTask(page, "terceira");

  const rows = page.getByTestId("task-row");
  const endZone = page.locator('[title="soltar no fim"]');
  await drag(page, rows.nth(0), endZone);

  await expect(rows.nth(0)).toContainText("segunda");
  await expect(rows.nth(1)).toContainText("terceira");
  await expect(rows.nth(2)).toContainText("primeira");
});

test("section header é botão nativo com aria-expanded", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "tarefa");

  const header = page.getByRole("button", { name: /geral \d\/\d/ });
  await expect(header).toHaveAttribute("aria-expanded", "true");

  await header.click();
  await expect(page.getByLabel("nova tarefa")).toHaveCount(0);
  await expect(header).toHaveAttribute("aria-expanded", "false");

  await header.click();
  await expect(page.getByLabel("nova tarefa")).toHaveCount(1);
});

test("Enter no ⋯ da seção não colapsa a seção", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "tarefa");

  await page.getByRole("button", { name: "ações da seção" }).focus();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("menuitem", { name: "renomear seção" })).toBeVisible();
  await expect(page.getByLabel("nova tarefa")).toHaveCount(1);
});

test("kanban: cria card direto na coluna a fazer", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");

  await page.getByRole("button", { name: "kanban" }).click();

  const input = page.getByLabel("nova tarefa").first();
  await input.fill("nova card");
  await input.press("Enter");

  const card = page.getByTestId("kanban-task").filter({ hasText: "nova card" });
  await expect(card).toBeVisible();

  await page.getByRole("button", { name: "lista" }).click();
  await expect(page.getByText("nova card", { exact: true })).toBeVisible();
});
