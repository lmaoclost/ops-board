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

async function addSub(page: Page, parentRow: Locator, text: string) {
  await parentRow.getByRole("button", { name: "nova sub-tarefa", exact: true }).click();
  await page.getByRole("textbox", { name: "nova sub-tarefa" }).fill(text);
  await page.getByRole("textbox", { name: "nova sub-tarefa" }).press("Enter");
}

const rootRow = (page: Page, text: string) =>
  page.getByTestId("task-row").filter({ hasText: text }).first();

const nivel1Sub = (page: Page, text: string) =>
  page.locator('[data-testid^="sub-row"]').filter({ hasText: text }).first();

/** Arrasta pelo grip da task raiz (dentro do task-row). */
async function dragRow(page: Page, src: Locator, dst: Locator, mode: "sib" | "nest" = "sib") {
  const grip = src.getByRole("button", { name: "arrastar tarefa p/ reordenar" }).first();
  const gb = (await grip.boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 };
  const db = (await dst.boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 };
  await page.mouse.move(gb.x + gb.width / 2, gb.y + gb.height / 2);
  await page.mouse.down();
  await page.mouse.move(gb.x + gb.width / 2 + 12, gb.y + gb.height / 2, { steps: 4 });
  const tx = mode === "nest" ? db.x + db.width / 2 : db.x + 40;
  const ty = mode === "nest" ? db.y + db.height / 2 : db.y + 2;
  await page.mouse.move(tx, ty, { steps: 12 });
  await page.mouse.up();
}

/** Arrasta uma sub-tarefa pelo grip dela. `subText` localiza o sub-row via texto. */
async function dragSub(page: Page, subText: string, dst: Locator, mode: "sib" | "nest" = "sib") {
  const subRow = page.locator('[data-testid^="sub-row"]').filter({ hasText: subText }).first();
  const grip = subRow.getByRole("button", { name: "arrastar tarefa p/ reordenar" }).first();
  const gb = (await grip.boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 };
  const db = (await dst.boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 };
  await page.mouse.move(gb.x + gb.width / 2, gb.y + gb.height / 2);
  await page.mouse.down();
  await page.mouse.move(gb.x + gb.width / 2 + 12, gb.y + gb.height / 2, { steps: 4 });
  const tx = mode === "nest" ? db.x + db.width / 2 : db.x + 40;
  const ty = mode === "nest" ? db.y + db.height / 2 : db.y - 6;
  await page.mouse.move(tx, ty, { steps: 12 });
  await page.mouse.up();
}

test("reordena sub-tarefa entre irmãs por arrasto", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "pai");
  const row = rootRow(page, "pai");
  await addSub(page, row, "sub1");
  await addSub(page, row, "sub2");
  await addSub(page, row, "sub3");

  await dragSub(page, "sub1", page.getByText("sub1", { exact: true }));

  await expect(page.getByText("sub1", { exact: true })).toBeVisible();
  await expect(page.getByText("sub2", { exact: true })).toBeVisible();
  await expect(page.getByText("sub3", { exact: true })).toBeVisible();
});

test("promote: sub arrastada pra zona de irmã de task raiz vira task", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "primeira");
  await addTask(page, "segunda");
  const segunda = rootRow(page, "segunda");
  await addSub(page, segunda, "promotada");

  await dragSub(page, "promotada", page.getByText("primeira", { exact: true }), "sib");

  await expect(page.getByRole("checkbox", { name: "sub-tarefa promotada" })).toHaveCount(0);
  await expect(page.getByText("promotada", { exact: true })).toBeVisible();
});

test("nest: task raiz vira sub de outra", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "alvo");
  await addTask(page, "será aninhada");

  await dragRow(page, rootRow(page, "será aninhada"), rootRow(page, "alvo"), "nest");

  const alvoRow = rootRow(page, "alvo");
  await expect(alvoRow.getByRole("checkbox", { name: "sub-tarefa será aninhada" })).toBeVisible();
});

test("task com subs arrastada pra outro projeto leva as subs junto", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "origem");
  await addTask(page, "com filhos");
  const origem = rootRow(page, "com filhos");
  await addSub(page, origem, "filha1");
  await addSub(page, origem, "filha2");
  await createProject(page, "destino");
  const destCard = page.locator("main").locator(".rounded-lg").filter({ has: page.getByRole("heading", { name: "destino", exact: true }) });
  await destCard.getByLabel("nova tarefa").first().fill("qualquer");
  await destCard.getByLabel("nova tarefa").first().press("Enter");
  const qualquer = page.getByText("qualquer", { exact: true });

  await dragRow(page, rootRow(page, "com filhos"), qualquer, "sib");

  const moved = page.getByTestId("task-row").filter({ hasText: "com filhos" }).first();
  await expect(moved).toBeVisible();
  await expect(moved.getByRole("checkbox", { name: "sub-tarefa filha1" })).toBeVisible();
  await expect(moved.getByRole("checkbox", { name: "sub-tarefa filha2" })).toBeVisible();
  const origemVazia = page.getByTestId("task-row").filter({ hasText: "com filhos" });
  await expect(origemVazia).toHaveCount(1);
});

test("sib de sub aninhada: task raiz move pra dentro do pai da sub", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "externa");
  await addTask(page, "pai");
  const pai = rootRow(page, "pai");
  await addSub(page, pai, "filha do pai");

  await dragRow(page, rootRow(page, "externa"), page.getByText("filha do pai", { exact: true }), "sib");

  const paiRow = rootRow(page, "pai");
  await expect(paiRow.getByRole("checkbox", { name: "sub-tarefa externa" })).toBeVisible();
  await expect(page.getByText("externa", { exact: true })).toBeVisible();
});

test("anti-ciclo: pai não pode aninhar dentro da própria sub", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "pai");
  const pai = rootRow(page, "pai");
  await addSub(page, pai, "filha");

  await dragRow(page, pai, pai.getByText("filha", { exact: true }), "nest");

  await expect(pai.getByRole("checkbox", { name: "sub-tarefa filha" })).toBeVisible();
  const rows = page.getByTestId("task-row");
  await expect(rows.filter({ hasText: "pai" })).toHaveCount(1);
});

test("nest em sub: sub arrastada pro texto de outra sub vira subsub", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "pai");
  const pai = rootRow(page, "pai");
  await addSub(page, pai, "alvo sub");
  await addSub(page, pai, "móvel");

  await dragSub(page, "móvel", page.getByText("alvo sub", { exact: true }), "nest");

  const alvoSub = page.locator('[data-testid^="sub-row"]').filter({ hasText: "alvo sub" }).first();
  await expect(alvoSub.getByRole("checkbox", { name: "sub-tarefa móvel" })).toBeVisible();
  await expect(pai.getByRole("checkbox", { name: "sub-tarefa alvo sub" })).toBeVisible();
});

test("subsub: neta reordena entre irmãs e não mostra zona de aninhar", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "app");
  await addTask(page, "pai");
  const pai = rootRow(page, "pai");
  await addSub(page, pai, "nível 1");
  // sub de nível 1 tem o botão + (subsub não tem — cap de profundidade)
  await nivel1Sub(page, "nível 1").getByRole("button", { name: "nova sub-tarefa nível 1" }).click();
  await page.getByRole("textbox", { name: "nova sub-tarefa" }).fill("neta a");
  await page.getByRole("textbox", { name: "nova sub-tarefa" }).press("Enter");
  await nivel1Sub(page, "nível 1").getByRole("button", { name: "nova sub-tarefa nível 1" }).click();
  await page.getByRole("textbox", { name: "nova sub-tarefa" }).fill("neta b");
  await page.getByRole("textbox", { name: "nova sub-tarefa" }).press("Enter");

  // reorder de netas dentro da sub
  await dragSub(page, "neta a", page.getByText("neta a", { exact: true }));

  await expect(page.getByText("neta a", { exact: true })).toBeVisible();
  await expect(page.getByText("neta b", { exact: true })).toBeVisible();

  // durante drag, neta (subsub) não expõe NestZone — só a sub de nível 1
  const nivel1Row = page.locator('[data-testid^="sub-row"]').filter({ hasText: "nível 1" }).first();
  const grip = nivel1Row.getByRole("button", { name: "arrastar tarefa p/ reordenar" }).first();
  const gb = (await grip.boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 };
  await page.mouse.move(gb.x + gb.width / 2, gb.y + gb.height / 2);
  await page.mouse.down();
  await page.mouse.move(gb.x + gb.width / 2 + 12, gb.y + gb.height / 2, { steps: 4 });
  const nestZones = await page.locator('[data-testid="drop-nest-indicator"]').count();
  const subRows = await page.locator('[data-testid^="sub-row"]').count();
  await page.mouse.up();
  expect(nestZones).toBe(subRows - 1); // neta sem NestZone; tasks + subs nível 1 com
});