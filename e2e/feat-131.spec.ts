import { expect, test, type Locator, type Page } from "@playwright/test";

async function createProject(page: Page, title: string, note?: string) {
  const empty = page.getByRole("button", { name: "+ criar primeiro projeto" });
  if (await empty.isVisible()) {
    await empty.click();
  } else {
    await page.getByRole("button", { name: "+ projeto" }).click();
  }
  await page.getByLabel("título").fill(title);
  if (note !== undefined) await page.getByLabel("nota do projeto").fill(note);
  await page.getByRole("button", { name: "criar" }).click();
}

async function addSection(page: Page, title: string) {
  await page
    .getByRole("button", { name: "ações do projeto", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "adicionar seção" }).click();
  await page.getByLabel("título").fill(title);
  await page.getByRole("button", { name: "criar" }).click();
}

test("novo projeto com nota e vencimento opcional", async ({ page }) => {
  await page.goto("/");
  const empty = page.getByRole("button", { name: "+ criar primeiro projeto" });
  if (await empty.isVisible()) {
    await empty.click();
  } else {
    await page.getByRole("button", { name: "+ projeto" }).click();
  }
  await page.getByLabel("título").fill("app");
  await page.getByLabel("nota do projeto").fill("contexto inicial");
  await page.getByLabel("vencimento").fill("2026-12-25");
  await page.getByRole("button", { name: "criar" }).click();
  await expect(page.getByText("contexto inicial")).toBeVisible();
  await expect(page.getByText("25/12/2026")).toBeVisible();
});

test("editar projeto altera nota", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app", "contexto inicial");
  await page
    .getByRole("button", { name: "ações do projeto", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "editar projeto" }).click();
  await page.getByLabel("nota do projeto").fill("contexto novo");
  await page.getByRole("button", { name: "salvar" }).click();
  await expect(page.getByText("contexto novo")).toBeVisible();
  await expect(page.getByText("contexto inicial")).toHaveCount(0);
});

test("seção: editar pelo ⋯ salva título e nota", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await page
    .getByRole("button", { name: "ações da seção", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "editar seção" }).click();
  await page.getByLabel("título").fill("sprint");
  await page.getByLabel("nota", { exact: true }).fill("foco da sprint");
  await page.getByRole("button", { name: "salvar" }).click();
  await expect(page.getByText("sprint", { exact: true })).toBeVisible();
  await expect(page.getByText("foco da sprint")).toBeVisible();
});

test("adicionar seção com nota exibe texto", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await page
    .getByRole("button", { name: "ações do projeto", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "adicionar seção" }).click();
  await page.getByLabel("título").fill("dev");
  await page.getByLabel("nota", { exact: true }).fill("nota da dev");
  await page.getByRole("button", { name: "criar" }).click();
  await expect(page.getByText("nota da dev")).toBeVisible();
});

test("bloquear tarefa pede motivo opcional e mostra no badge", async ({
  page,
}) => {
  await page.goto("/");
  await createProject(page, "app");
  await page.getByLabel("nova tarefa").first().fill("tarefa travada");
  await page.getByLabel("nova tarefa").first().press("Enter");

  await page.getByTestId("task-row").getByLabel("bloquear tarefa").click();
  await page
    .getByLabel("motivo do bloqueio")
    .fill("sem acesso ao banco");
  await page.getByRole("button", { name: "salvar" }).click();
  const badge = page.getByText("bloqueada", { exact: true });
  await expect(badge).toBeVisible();
  await expect(badge).toHaveAttribute("title", "sem acesso ao banco");
});

async function drag(page: Page, src: Locator, dst: Locator) {
  const grip = src.getByRole("button", { name: "arrastar tarefa p/ reordenar" });
  const anchor = (await grip.count()) > 0 ? grip : src;
  const sb = await anchor.boundingBox();
  const db = await dst.boundingBox();
  if (!sb || !db) throw new Error("bounding box indisponível");
  await page.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2);
  await page.mouse.down();
  await page.mouse.move(sb.x + sb.width / 2 + 12, sb.y + sb.height / 2, {
    steps: 4,
  });
  await page.mouse.move(db.x + db.width / 2, db.y + db.height / 2, {
    steps: 12,
  });
  await page.mouse.up();
}

test("seções reordenam arrastando pelo grip", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addSection(page, "dev");

  const headers = page.locator("h3");
  await expect(headers.nth(0)).toHaveText("geral");
  await expect(headers.nth(1)).toHaveText("dev");

  await drag(
    page,
    page.getByLabel("arrastar seção p/ reordenar").nth(1),
    headers.nth(0),
  );
  await expect(headers.nth(0)).toHaveText("dev");
  await expect(headers.nth(1)).toHaveText("geral");
});

test("excluir tarefa cancela sem remover", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await page.getByLabel("nova tarefa").first().fill("manter");
  await page.getByLabel("nova tarefa").first().press("Enter");

  await page
    .getByTestId("task-row")
    .getByRole("button", { name: "excluir" })
    .click();
  await page
    .getByRole("dialog", { name: "excluir tarefa?" })
    .getByRole("button", { name: "cancelar" })
    .click();
  await expect(page.getByText("manter", { exact: false })).toBeVisible();
});

test("projetos reordenam arrastando pelo grip", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "um");
  await page.getByRole("button", { name: "+ projeto" }).click();
  await page.getByLabel("título").fill("dois");
  await page.getByRole("button", { name: "criar" }).click();

  const headings = page.getByRole("heading", { level: 2 });
  await expect(headings.nth(0)).toHaveText("um");
  await expect(headings.nth(1)).toHaveText("dois");

  await drag(
    page,
    page.getByLabel("arrastar projeto p/ reordenar").nth(1),
    headings.nth(0),
  );
  await expect(headings.nth(0)).toHaveText("dois");
  await expect(headings.nth(1)).toHaveText("um");
});

test("salvar com obrigatório vazio mostra erro e não fecha", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await page
    .getByRole("button", { name: "ações do projeto", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "editar projeto" }).click();
  await page.getByLabel("título").clear();
  await page.getByRole("button", { name: "salvar" }).click();
  await expect(page.getByText("campo obrigatório")).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "editar projeto" }),
  ).toBeVisible();
});

test("editar tarefa com texto vazio mostra erro e não salva", async ({
  page,
}) => {
  await page.goto("/");
  await createProject(page, "app");
  await page.getByLabel("nova tarefa").first().fill("manter texto");
  await page.getByLabel("nova tarefa").first().press("Enter");

  await page.getByTestId("task-row").getByRole("button", { name: "editar" }).click();
  const dialog = page.getByRole("dialog", { name: "editar tarefa" });
  await dialog.getByLabel("tarefa", { exact: true }).clear();
  await page.getByRole("button", { name: "salvar" }).click();
  await expect(page.getByText("campo obrigatório")).toBeVisible();
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: "cancelar" }).click();
  await expect(page.getByText("manter texto", { exact: false })).toBeVisible();
});
