# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: projetos.spec.ts >> vencimento do projeto com ano; tarefa vencida também
- Location: e2e/projetos.spec.ts:51:5

# Error details

```
Error: locator.click: Error: strict mode violation: getByRole('button', { name: 'editar tarefa entrega' }) resolved to 2 elements:
    1) <div tabindex="0" role="button" aria-disabled="false" data-testid="kanban-task" aria-roledescription="draggable" aria-describedby="DndDescribedBy-0" class="cursor-grab rounded-md border border-[var(--line)] bg-[var(--panel-2)] px-2.5 py-1.5 text-xs hover:bg-[var(--panel-3)] ">…</div> aka getByTestId('kanban-task')
    2) <button type="button" title="editar tarefa" class="min-w-0 flex-1 text-left" aria-label="editar tarefa entrega">…</button> aka getByTestId('kanban-task').getByRole('button', { name: 'editar tarefa entrega' })

Call log:
  - waiting for getByRole('button', { name: 'editar tarefa entrega' })

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - heading "ops/board" [level=1] [ref=e6]
          - generic [ref=e7]:
            - button "☀" [ref=e8]
            - button "lista" [active] [ref=e9]
            - button "↓exportar" [ref=e10]
            - button "↑importar" [ref=e11]
            - link "privacidade" [ref=e12] [cursor=pointer]:
              - /url: /privacidade
            - button "+ projeto" [ref=e13]:
              - generic [ref=e14]: +
              - text: projeto
        - generic [ref=e16]:
          - generic [ref=e17]: ">"
          - searchbox "buscar tarefas" [ref=e18]
    - group "filtros por status" [ref=e20]:
      - button "todo 1" [ref=e21]:
        - text: todo
        - generic [ref=e22]: "1"
      - button "doing 0" [ref=e23]:
        - text: doing
        - generic [ref=e24]: "0"
      - button "waiting 0" [ref=e25]:
        - text: waiting
        - generic [ref=e26]: "0"
      - button "done 0" [ref=e27]:
        - text: done
        - generic [ref=e28]: "0"
      - button "bloq 0" [ref=e29]:
        - text: bloq
        - generic [ref=e30]: "0"
      - button "arquivados 0" [ref=e31]:
        - text: arquivados
        - generic [ref=e32]: "0"
    - status [ref=e34]:
      - generic [ref=e35]: total 1
      - generic [ref=e36]: pendentes 1
      - generic [ref=e37]:
        - text: concluídas 0
        - generic [ref=e38]: (0%)
      - generic [ref=e39]:
        - text: hoje
        - generic [ref=e40]: "+0"
      - button "↕ prio" [ref=e41]
      - generic [ref=e42]: "kanban: arraste cartão entre colunas p/ mudar status"
    - main [ref=e43]:
      - generic [ref=e44]:
        - generic [ref=e45]:
          - generic [ref=e46]: a fazer 1
          - button "editar tarefa entrega P3" [ref=e48]:
            - generic [ref=e49]:
              - button "editar tarefa entrega" [ref=e50]:
                - text: entrega
                - generic [ref=e51]: app · geral
              - generic [ref=e52]: P3
        - generic [ref=e53]: em andamento 0
        - generic [ref=e56]: aguardando 0
        - generic [ref=e59]: concluída 0
      - status [ref=e62]
    - contentinfo [ref=e63]:
      - button "apagar todos os dados" [ref=e64] [cursor=pointer]
    - dialog "aviso de privacidade" [ref=e65]:
      - heading "Seus dados, só no seu navegador" [level=2] [ref=e66]
      - paragraph [ref=e67]: O OpsBoard processa os seus dados localmente e os guarda apenas no armazenamento do seu navegador (localStorage). Nada é enviado a servidores. Você pode exportar um backup a qualquer momento e apagar tudo pelos controles do quadro. Veja a política completa na página de privacidade.
      - generic [ref=e68]:
        - link "política completa" [ref=e69] [cursor=pointer]:
          - /url: /privacidade
        - button "entendi" [ref=e70]
  - alert [ref=e71]
```

# Test source

```ts
  1  | import { expect, test, type Page } from "@playwright/test";
  2  | 
  3  | async function createProject(page: Page, title: string) {
  4  |   const empty = page.getByRole("button", { name: "+ criar primeiro projeto" });
  5  |   if (await empty.isVisible()) {
  6  |     await empty.click();
  7  |   } else {
  8  |     await page.getByRole("button", { name: "+ projeto" }).click();
  9  |   }
  10 |   await page.getByLabel("título").fill(title);
  11 |   await page.getByRole("button", { name: "criar" }).click();
  12 | }
  13 | 
  14 | test("badge de prioridade do projeto cicla P3 → P1 → P2", async ({ page }) => {
  15 |   await page.goto("/");
  16 |   await createProject(page, "app");
  17 | 
  18 |   await expect(page.getByLabel("prioridade do projeto P3")).toBeVisible();
  19 |   await page.getByLabel("prioridade do projeto P3").click();
  20 |   await expect(page.getByLabel("prioridade do projeto P1")).toBeVisible();
  21 |   await page.getByLabel("prioridade do projeto P1").click();
  22 |   await expect(page.getByLabel("prioridade do projeto P2")).toBeVisible();
  23 |   await page.getByLabel("prioridade do projeto P2").click();
  24 |   await expect(page.getByLabel("prioridade do projeto P3")).toBeVisible();
  25 | });
  26 | 
  27 | test("minimizar projeto esconde tarefas e expandir restaura", async ({ page }) => {
  28 |   await page.goto("/");
  29 |   await createProject(page, "app");
  30 |   await page.getByLabel("nova tarefa").first().fill("importante");
  31 |   await page.getByLabel("nova tarefa").first().press("Enter");
  32 |   await expect(page.getByText("importante")).toBeVisible();
  33 | 
  34 |   await page.getByLabel("minimizar projeto").click();
  35 |   await expect(page.getByText("importante")).toHaveCount(0);
  36 | 
  37 |   await page.getByLabel("expandir projeto").click();
  38 |   await expect(page.getByText("importante")).toBeVisible();
  39 | });
  40 | 
  41 | test("projeto minimizado persiste após reload", async ({ page }) => {
  42 |   await page.goto("/");
  43 |   await createProject(page, "app");
  44 |   await page.getByLabel("minimizar projeto").click();
  45 |   await expect(page.getByLabel("expandir projeto")).toBeVisible();
  46 | 
  47 |   await page.reload();
  48 |   await expect(page.getByLabel("expandir projeto")).toBeVisible();
  49 | });
  50 | 
  51 | test("vencimento do projeto com ano; tarefa vencida também", async ({ page }) => {
  52 |   await page.goto("/");
  53 |   await createProject(page, "app");
  54 | 
  55 |   await page.getByRole("button", { name: "ações do projeto", exact: true }).click();
  56 |   await page.getByRole("menuitem", { name: "renomear projeto" }).click();
  57 |   await page.getByLabel("vencimento").fill("2026-09-01");
  58 |   await page.getByRole("button", { name: "salvar" }).click();
  59 |   await expect(page.getByText("01/09/2026")).toBeVisible();
  60 | 
  61 |   await page.getByLabel("nova tarefa").first().fill("entrega");
  62 |   await page.getByLabel("nova tarefa").first().press("Enter");
  63 |   await page.getByRole("button", { name: "kanban" }).click();
> 64 |   await page.getByRole("button", { name: "editar tarefa entrega" }).click();
     |                                                                     ^ Error: locator.click: Error: strict mode violation: getByRole('button', { name: 'editar tarefa entrega' }) resolved to 2 elements:
  65 |   await page.getByLabel("vencimento").fill("2026-09-05");
  66 |   await page.getByRole("button", { name: "salvar" }).click();
  67 |   await page.getByRole("button", { name: "lista" }).click();
  68 |   await expect(page.getByText("05/09/2026")).toBeVisible();
  69 | });
```