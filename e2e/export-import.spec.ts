import { readFileSync } from "node:fs";
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
          notes: "",
          collapsed: false,
          tasks: [{ id: "t1", text: "tarefa do alpha", status: "todo", note: "", blocked: false, prio: 3, due: "", doneAt: null }],
        },
      ],
    },
    {
      id: "p2",
      title: "beta",
      blocked: false,
      sections: [
        {
          id: "s2",
          title: "backlog",
          notes: "",
          collapsed: false,
          tasks: [{ id: "t2", text: "tarefa do beta", status: "doing", note: "", blocked: false, prio: 2, due: "", doneAt: null }],
        },
      ],
    },
  ],
};

test("exporta JSON válido com o estado atual", async ({ page }) => {
  await page.goto("/");
  await createProject(page, "alpha");
  await addTask(page, "tarefa do alpha");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "↓exportar" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  const data = JSON.parse(readFileSync(path!, "utf8"));
  expect(data.projetos).toHaveLength(1);
  expect(data.projetos[0].title).toBe("alpha");
  expect(data.projetos[0].sections[0].tasks[0].text).toBe("tarefa do alpha");
});

test("importa backup e restaura o estado", async ({ page }) => {
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(SEED)),
  });

  await expect(page.getByText("importado: 2 projeto(s)")).toBeVisible();
  await expect(page.getByRole("heading", { name: "alpha" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "beta" })).toBeVisible();
  await expect(page.getByText("tarefa do beta", { exact: false })).toBeVisible();
});

test("import de arquivo corrompido mostra erro e não muda nada", async ({ page }) => {
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles({
    name: "quebrado.json",
    mimeType: "application/json",
    buffer: Buffer.from("{isso não é json"),
  });

  await expect(page.getByText("arquivo em formato inválido")).toBeVisible();
  await expect(page.getByText("nenhum projeto na fila.")).toBeVisible();
});

test("migra localStorage v1 → v2 no carregamento", async ({ page }) => {
  const v1 = {
    state: {
      projetos: [
        {
          id: "p1",
          title: "legado",
          blocked: false,
          sections: [
            {
              id: "s1",
              title: "geral",
              notes: "",
              collapsed: false,
              tasks: [{ id: "t1", text: "tarefa antiga", status: "todo" }],
            },
          ],
        },
      ],
    },
    version: 1,
  };
  await page.addInitScript((state) => {
    localStorage.setItem("opsboard.v1", JSON.stringify(state));
  }, v1);

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "legado" })).toBeVisible();
  await expect(page.getByText("tarefa antiga", { exact: false })).toBeVisible();

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("opsboard.v1") ?? "{}"));
  expect(stored.version).toBe(2);
  expect(stored.state.projetos[0].sections[0].tasks[0]).toMatchObject({ text: "tarefa antiga", prio: 3, doneAt: null });
});