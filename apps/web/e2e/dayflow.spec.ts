import { expect, test } from "@playwright/test";

test("employee can login and see dashboard", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email").fill("maya@dayflow.test");
  await page.getByLabel("Password").fill("Dayflow@123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});
