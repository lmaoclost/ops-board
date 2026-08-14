import { expect, test } from "@playwright/test";

const VECTOR_TEXT = `<script>alert(1)</script>`;
const VECTOR_HREF = `javascript:alert(2)`;
const VECTOR_DATA = `data:text/html,<b>x</b>`;
const NOTE_URL = `veja https://exemplo.com/x "fim"`;

async function createProjectWithTitle(page: import("@playwright/test").Page, title: string) {
  await page.getByRole("button", { name: "+ criar primeiro projeto" }).click();
  await page.getByLabel("título").fill(title);
  await page.getByRole("button", { name: "criar" }).click();
}

test("vetores XSS viram texto inerte e console fica limpo", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("/");
  await createProjectWithTitle(page, `xss "aspas" & <b>título</b>`);

  const row = page.getByTestId("task-row").first();
  await page.getByLabel("nova tarefa").first().fill(`${VECTOR_TEXT} ${VECTOR_HREF} ${VECTOR_DATA}`);
  await page.getByLabel("nova tarefa").first().press("Enter");

  await expect(page.getByRole("button", { name: "editar" }).first()).toBeVisible();
  await expect(page.getByText(VECTOR_TEXT, { exact: false })).toBeVisible();

  const rowText = await row.textContent();
  expect(rowText).toContain(VECTOR_TEXT);
  expect(rowText).toContain(VECTOR_HREF);
  expect(rowText).toContain(VECTOR_DATA);

  const projectTitle = await page.locator("h2").first().textContent();
  expect(projectTitle).toBe(`xss "aspas" & <b>título</b>`);
  expect(projectTitle).not.toContain("&amp;");

  await expect(page.locator("script").filter({ hasText: "alert" })).toHaveCount(0);

  await row.getByRole("button", { name: "editar" }).click();
  const dialog = page.getByRole("dialog", { name: "editar tarefa" });
  await dialog.getByLabel("nota").fill(NOTE_URL);
  await page.getByRole("button", { name: "salvar" }).click();

  const link = page.locator('a[href="https://exemplo.com/x"]');
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  await expect(page.getByText('"fim"', { exact: false })).toBeVisible();

  await page.getByRole("button", { name: "kanban" }).click();
  await expect(page.getByText(VECTOR_TEXT, { exact: false })).toBeVisible();
  await page.waitForTimeout(200);

  expect(errors).toEqual([]);
});