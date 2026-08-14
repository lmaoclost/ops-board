import { expect, test } from "@playwright/test";

test("nenhuma requisição a terceiros no runtime (só origin)", async ({ page }) => {
  const thirdParty: string[] = [];
  let origin: string | null = null;
  page.on("request", (req) => {
    try {
      const u = new URL(req.url());
      if (req.resourceType() === "document" && !origin) origin = u.origin;
      if (origin && u.origin !== origin) thirdParty.push(req.url());
    } catch {
      thirdParty.push(req.url());
    }
  });

  await page.goto("/");
  await page.getByRole("button", { name: "+ criar primeiro projeto" }).click();
  await page.getByLabel("título").fill("app");
  await page.getByRole("button", { name: "criar" }).click();
  await page.getByLabel("nova tarefa").first().fill("tarefa");
  await page.getByLabel("nova tarefa").first().press("Enter");
  await page.getByRole("button", { name: "kanban" }).click();
  await page.getByRole("button", { name: "lista" }).click();
  await page.getByRole("link", { name: "privacidade" }).click();
  await expect(page.getByRole("heading", { name: "Política de privacidade" })).toBeVisible();
  await page.waitForTimeout(300);

  expect(thirdParty).toEqual([]);
});