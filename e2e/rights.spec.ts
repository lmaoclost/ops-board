import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const SEED = {
  projetos: [
    {
      id: "p1",
      title: "alpha",
      blocked: false,
      sections: [
        {
          id: "s1",
          title: "geral",
          notes: "notas do alpha",
          collapsed: false,
          tasks: [{ id: "t1", text: "tarefa do alpha", status: "todo", note: "", blocked: false, prio: 3, due: "", doneAt: null }],
        },
      ],
    },
    {
      id: "p2",
      title: "beta",
      blocked: true,
      sections: [
        {
          id: "s2",
          title: "geral",
          notes: "",
          collapsed: false,
          tasks: [{ id: "t2", text: "tarefa do beta", status: "done", note: "feito", blocked: false, prio: 1, due: "2026-08-20", doneAt: "2026-08-14T10:00:00.000Z" }],
        },
      ],
    },
  ],
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("opsboard.notice-v1", "1"));
});

async function storedProjects(page: Page): Promise<unknown[]> {
  return page.evaluate(() => {
    const raw = localStorage.getItem("opsboard.v1");
    if (!raw) return null;
    return JSON.parse(raw).state.projetos;
  });
}

test("apagar tudo exige confirmação e remove 100% dos dados do localStorage", async ({ page }) => {
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(SEED)),
  });
  await expect(page.getByRole("heading", { name: "alpha" })).toBeVisible();

  await page.getByRole("button", { name: "apagar todos os dados" }).click();
  const dialog = page.getByRole("dialog", { name: "apagar todos os dados" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("2 projeto(s)")).toBeVisible();

  await dialog.getByRole("button", { name: "cancelar" }).click();
  await expect(page.getByRole("heading", { name: "alpha" })).toBeVisible();
  expect(await storedProjects(page)).toHaveLength(2);

  await page.getByRole("button", { name: "apagar todos os dados" }).click();
  await page.getByRole("dialog", { name: "apagar todos os dados" }).getByRole("button", { name: "apagar tudo" }).click();

  await expect(page.getByText("todos os dados apagados")).toBeVisible();
  await expect(page.getByText("nenhum projeto na fila.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "alpha" })).toHaveCount(0);
  expect(await storedProjects(page)).toEqual([]);
});

test("apagar item individual não deixa resíduo no localStorage", async ({ page }) => {
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(SEED)),
  });
  await expect(page.getByRole("heading", { name: "alpha" })).toBeVisible();

  page.once("dialog", (dialog) => void dialog.accept());
  await page
    .locator("section.rounded-lg")
    .filter({ has: page.getByRole("heading", { name: "alpha" }) })
    .getByRole("button", { name: "ações do projeto", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "excluir projeto" }).click();

  await expect(page.getByRole("heading", { name: "alpha" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "beta" })).toBeVisible();

  const stored = (await storedProjects(page)) as Array<{ title: string }>;
  expect(stored.map((p) => p.title)).toEqual(["beta"]);
  expect(JSON.stringify(stored)).not.toContain("alpha");
  expect(JSON.stringify(stored)).not.toContain("tarefa do alpha");
});

test("export contém 100% do estado e import restaura igual", async ({ page }) => {
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(SEED)),
  });
  await expect(page.getByRole("heading", { name: "alpha" })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "↓exportar" }).click();
  const download = await downloadPromise;
  const exported = JSON.parse(readFileSync((await download.path())!, "utf8"));

  expect(exported.projetos).toEqual(SEED.projetos);

  await page.getByRole("button", { name: "apagar todos os dados" }).click();
  await page.getByRole("dialog", { name: "apagar todos os dados" }).getByRole("button", { name: "apagar tudo" }).click();
  await expect(page.getByText("nenhum projeto na fila.")).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(exported)),
  });

  await expect(page.getByText("importado: 2 projeto(s)")).toBeVisible();
  await expect(page.getByRole("heading", { name: "alpha" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "beta" })).toBeVisible();
  await expect(page.getByText("notas do alpha", { exact: false })).toBeVisible();
  expect(await storedProjects(page)).toEqual(SEED.projetos);
});