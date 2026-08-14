import { expect, test } from "@playwright/test";

test("carrega o app e persiste dados no localStorage", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /ops\/board/ })).toBeVisible();

  await page.getByRole("button", { name: "+ criar primeiro projeto" }).click();
  await page.getByLabel("título").fill("projeto-ci");
  await page.getByRole("button", { name: "criar" }).click();
  await expect(page.getByText("projeto-ci", { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByText("projeto-ci", { exact: true })).toBeVisible();

  const stored = await page.evaluate(() => localStorage.getItem("opsboard.v1"));
  expect(stored).toContain("projeto-ci");
});

test("alternar tema persiste e sobrevive a reload", async ({ page }) => {
  await page.goto("/");
  const isLight = await page.evaluate(() =>
    document.documentElement.classList.contains("light"),
  );
  const icon = isLight ? "☀" : "☾";
  const expected = isLight ? "dark" : "light";

  await page.getByRole("button", { name: icon }).click();
  const stored = await page.evaluate(() => localStorage.getItem("opsboard.theme"));
  expect(stored).toBe(expected);

  await page.reload();
  const after = await page.evaluate(() => localStorage.getItem("opsboard.theme"));
  expect(after).toBe(stored);
  await expect(page.getByRole("button", { name: expected === "light" ? "☀" : "☾" })).toBeVisible();
});