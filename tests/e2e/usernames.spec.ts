import { test, expect } from "@playwright/test";

test("employee login asks for username instead of full name", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByLabel("Tên đăng nhập", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Họ và tên", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Phòng ban", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Admin", exact: true }).click();
  await expect(page.getByLabel("Tên đăng nhập", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Phòng ban", { exact: true })).toHaveCount(0);
});

test("mobile username suggestions use department collisions and respect manual edits", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Admin", exact: true }).click();
  await page
    .getByRole("button", { name: "Trải nghiệm với vai trò admin" })
    .click();
  await page
    .locator(".mobile-bottom-nav")
    .getByRole("button", { name: "Nhân viên", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Thêm nhân viên", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Họ và tên", { exact: true }).fill("Nguyễn Lan Anh");
  await expect(dialog.getByLabel("Tên đăng nhập", { exact: true })).toHaveValue(
    "anh.nguyen.it",
  );
  await dialog
    .getByLabel("Phòng ban", { exact: true })
    .selectOption("Marketing");
  await expect(dialog.getByLabel("Tên đăng nhập", { exact: true })).toHaveValue(
    "anh.nguyen.mkt",
  );
  await dialog
    .getByLabel("Tên đăng nhập", { exact: true })
    .fill("lananh.custom");
  await dialog.getByLabel("Họ và tên", { exact: true }).fill("Nguyễn Ngọc Anh");
  await expect(dialog.getByLabel("Tên đăng nhập", { exact: true })).toHaveValue(
    "lananh.custom",
  );
  await dialog.getByRole("button", { name: "Gợi ý lại", exact: true }).click();
  await expect(dialog.getByLabel("Tên đăng nhập", { exact: true })).toHaveValue(
    "anh.nguyen.mkt",
  );
  await dialog.getByLabel("Mật khẩu", { exact: true }).fill("Qa1234");
  await dialog
    .getByRole("button", { name: "Lưu nhân viên", exact: true })
    .click();
  await expect(
    page.locator(".employee-row").filter({ hasText: "anh.nguyen.mkt" }),
  ).toContainText("Nguyễn Ngọc Anh");
  await page
    .getByRole("button", { name: "Thêm nhân viên", exact: true })
    .click();
  await dialog.getByLabel("Họ và tên", { exact: true }).fill("Nguyễn Thu Anh");
  await dialog
    .getByLabel("Phòng ban", { exact: true })
    .selectOption("Marketing");
  await expect(dialog.getByLabel("Tên đăng nhập", { exact: true })).toHaveValue(
    "anh.nguyen.mkt2",
  );
  await dialog.getByLabel("Tên đăng nhập", { exact: true }).fill("anh.nguyen");
  await dialog.getByLabel("Mật khẩu", { exact: true }).fill("Qa1234");
  await dialog
    .getByRole("button", { name: "Lưu nhân viên", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText(
    "Tên đăng nhập đã được dùng",
  );
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
  await page.screenshot({ path: "test-results/username-mobile.png" });
});
