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

async function importFile(page: Page, name: string, buffer: Buffer) {
  await page.getByRole("button", { name: "↑importar" }).click();
  await expect(page.getByRole("dialog", { name: "importar backup" })).toBeVisible();
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "escolher arquivo" }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles({ name, mimeType: "application/json", buffer });
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
          tasks: [
            {
              id: "t1",
              text: "tarefa do alpha",
              status: "todo",
              note: "",
              blocked: false,
              prio: 3,
              due: "",
              doneAt: null,
              subs: [
                { id: "s1", text: "passo do alpha", note: "", prio: 3, due: "", status: "todo", blocked: false, subs: [] },
                { id: "s2", text: "passo pronto", note: "", prio: 3, due: "", status: "done", blocked: false, subs: [] },
              ],
            },
          ],
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
  await importFile(page, "backup.json", Buffer.from(JSON.stringify(SEED)));

  await expect(page.getByText("importado: 2 projeto(s)")).toBeVisible();
  await expect(page.getByRole("heading", { name: "alpha" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "beta" })).toBeVisible();
  await expect(page.getByText("tarefa do beta", { exact: false })).toBeVisible();
});

test("import de arquivo corrompido mostra erro e não muda nada", async ({ page }) => {
  await page.goto("/");
  await importFile(page, "quebrado.json", Buffer.from("{isso não é json"));

  await expect(page.getByText("arquivo em formato inválido")).toBeVisible();
  await expect(page.getByText("nenhum projeto na fila.")).toBeVisible();
});

test("import de JSON válido com estrutura inválida mostra erro claro", async ({ page }) => {
  await page.goto("/");
  const injetado = {
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
            tasks: [{ id: "t1", text: "x", status: "todo", prio: "urgente", note: "", blocked: false, due: "", doneAt: null }],
          },
        ],
      },
    ],
  };
  await importFile(page, "injetado.json", Buffer.from(JSON.stringify(injetado)));

  await expect(page.getByText("dados inválidos: estrutura de projeto, seção ou tarefa incorreta")).toBeVisible();
  await expect(page.getByText("nenhum projeto na fila.")).toBeVisible();
});

test("import de arquivo gigante é rejeitado sem quebrar o estado", async ({ page }) => {
  await page.goto("/");
  const gigante = JSON.stringify({ projetos: [] }).padEnd(2 * 1024 * 1024 + 1, " ");
  await importFile(page, "gigante.json", Buffer.from(gigante));

  await expect(page.getByText("arquivo muito grande (máx. 2 MB)")).toBeVisible();
  await expect(page.getByText("nenhum projeto na fila.")).toBeVisible();
});

test("migra localStorage v1 → v6 no carregamento (sub legada v5 migrada)", async ({ page }) => {
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
              tasks: [
                {
                  id: "t1",
                  text: "tarefa antiga",
                  status: "todo",
                  subs: [{ id: "s1", text: "sub antiga", done: true }],
                },
              ],
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
  await expect(page.getByRole("checkbox", { name: "sub-tarefa sub antiga" })).toHaveAttribute("aria-checked", "true");

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("opsboard.v1") ?? "{}"));
  expect(stored.version).toBe(7);
  expect(stored.state.projetos[0].sections[0].tasks[0]).toMatchObject({ text: "tarefa antiga", prio: 3, doneAt: null });
  expect(stored.state.projetos[0].sections[0].tasks[0].subs[0]).toMatchObject({
    id: "s1",
    text: "sub antiga",
    status: "done",
    prio: 3,
    note: "",
    blocked: false,
    subs: [],
  });
});