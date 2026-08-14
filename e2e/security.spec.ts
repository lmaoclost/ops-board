import { expect, test } from "@playwright/test";

test("responde com headers de segurança", async ({ request }) => {
  const res = await request.get("/");
  expect(res.ok()).toBe(true);
  const h = res.headers();

  expect(h["content-security-policy"]).toContain("default-src 'self'");
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["content-security-policy"]).toContain("object-src 'none'");
  expect(h["content-security-policy"]).not.toContain("fonts.googleapis.com");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["referrer-policy"]).toBe("no-referrer");
  expect(h["permissions-policy"]).toContain("geolocation=()");
  expect(h["permissions-policy"]).toContain("microphone=()");
});

test("nenhuma violação de CSP no fluxo principal", async ({ page }) => {
  const violations: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") violations.push(m.text());
  });
  page.on("pageerror", (e) => violations.push(String(e)));

  await page.goto("/");
  await page.getByRole("button", { name: "+ criar primeiro projeto" }).click();
  await page.getByLabel("título").fill("app");
  await page.getByRole("button", { name: "criar" }).click();
  await page.getByLabel("nova tarefa").first().fill("tarefa segura");
  await page.getByLabel("nova tarefa").first().press("Enter");
  await page.getByRole("button", { name: "kanban" }).click();
  await page.waitForTimeout(300);

  expect(violations).toEqual([]);
});