import { test, expect } from "@playwright/test";

test("home loads", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { name: "Ager" })).toBeVisible();
});
