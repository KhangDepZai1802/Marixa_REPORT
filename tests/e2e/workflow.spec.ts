import { test, expect } from "@playwright/test";
import fs from "node:fs";

test("create morning, handle empty date safely, export share fallback and delete own report", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "canShare", {
      value: () => false,
      configurable: true,
    }),
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "Trải nghiệm với vai trò nhân viên" })
    .click();
  const date = page.getByLabel("Ngày báo cáo", { exact: true });
  await date.fill("");
  await expect(page.locator(".sheet-title")).toContainText("Chọn ngày báo cáo");
  await date.fill("2026-10-31");
  await page
    .getByLabel("Trọng tâm 1", { exact: true })
    .fill("Hoàn thành bản báo cáo thử");
  await page
    .getByLabel("Nhiệm vụ 1", { exact: true })
    .fill("Rà soát tiến độ dự án");
  await page.getByRole("button", { name: "Lưu báo cáo", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Lưu thay đổi", exact: true }),
  ).toBeVisible();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Chia sẻ ảnh", exact: true }).click();
  const download = await downloadEvent;
  await download.saveAs("test-results/report-morning.png");
  await page
    .locator(".mobile-bottom-nav")
    .getByRole("button", { name: "Báo cáo", exact: true })
    .click();
  await expect(page.locator(".history-row")).toHaveCount(2);
  const row = page.locator(".history-row").filter({ hasText: "31/10/2026" });
  page.on("dialog", (d) => d.accept());
  await row.getByRole("button", { name: /Xóa báo cáo/ }).click();
  await expect(page.locator(".history-row")).toHaveCount(1);
});

for (const width of [375, 1440]) {
  test(`complete morning → evening, PNG and responsive layout at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await page
      .getByRole("button", { name: "Trải nghiệm với vai trò nhân viên" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Hôm nay, bạn có kế hoạch gì?." }),
    ).toBeVisible();
    await expect(page.locator("body")).toHaveJSProperty("scrollWidth", width);
    const navigation =
      width < 760
        ? page.locator(".mobile-bottom-nav")
        : page.locator(".sidebar nav");
    await navigation
      .getByRole("button", {
        name: width < 760 ? "Báo cáo" : "Báo cáo của tôi",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", { name: "Báo cáo cuối ngày", exact: true })
      .click();
    await expect(page.getByLabel("Nhiệm vụ 1", { exact: true })).toHaveValue(
      "Lên nội dung cho 3 bài đăng trên fanpage",
    );
    await page
      .getByLabel("Kết quả 1", { exact: true })
      .fill("Hoàn thành kế hoạch nội dung tháng 11");
    await page.getByLabel("Tiến độ (%)", { exact: true }).nth(0).fill("100");
    await page
      .getByLabel("Kết quả cụ thể", { exact: true })
      .nth(0)
      .fill("Đã duyệt 3 bài, lên lịch đăng lúc 18:00.");
    await page.getByRole("button", { name: /Thêm nhiệm vụ/ }).click();
    await page
      .getByLabel("Nhiệm vụ 4", { exact: true })
      .fill("Hỗ trợ sự kiện phát sinh");
    await page.getByLabel("Tiến độ (%)", { exact: true }).nth(3).fill("75");
    await page
      .getByLabel("Kết quả cụ thể", { exact: true })
      .nth(3)
      .fill("Cần chốt nhà cung cấp vào ngày mai.");
    await page.getByLabel("Đã đạt", { exact: true }).fill("18");
    await page
      .getByLabel("Ghi chú", { exact: true })
      .fill("Cảm ơn đội thiết kế đã hỗ trợ.");
    await page
      .getByRole("button", { name: "Lưu báo cáo", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Lưu thay đổi", exact: true }),
    ).toBeVisible();
    const downloadEvent = page.waitForEvent("download");
    await page.getByRole("button", { name: "Tải ảnh PNG" }).click();
    const download = await downloadEvent;
    const path = `test-results/report-${width}.png`;
    await download.saveAs(path);
    const png = fs.readFileSync(path);
    expect(png.readUInt32BE(16)).toBe(1520);
    expect(png.readUInt32BE(20)).toBeGreaterThan(1500);
    await page.screenshot({
      path: `test-results/editor-${width}.png`,
      fullPage: true,
    });
    await navigation
      .getByRole("button", {
        name: width < 760 ? "Báo cáo" : "Báo cáo của tôi",
        exact: true,
      })
      .click();
    await expect(page.locator(".history-row")).toHaveCount(2);
    await page
      .getByRole("button", { name: "Báo cáo cuối ngày", exact: true })
      .click();
    await expect(page.getByLabel("Nhiệm vụ 4", { exact: true })).toHaveValue(
      "Hỗ trợ sự kiện phát sinh",
    );
    await expect(
      page.getByRole("button", { name: "Lưu thay đổi", exact: true }),
    ).toBeVisible();
    await page.reload();
    await page
      .getByRole("button", { name: "Trải nghiệm với vai trò nhân viên" })
      .click();
    await navigation
      .getByRole("button", {
        name: width < 760 ? "Báo cáo" : "Báo cáo của tôi",
        exact: true,
      })
      .click();
    await expect(page.locator(".history-row")).toHaveCount(2);
    expect(errors).toEqual([]);
  });
}
test("admin can create, rename and delete employees in explicitly marked demo", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Admin", exact: true }).click();
  await page
    .getByRole("button", { name: "Trải nghiệm với vai trò admin" })
    .click();
  await page
    .locator(".sidebar nav")
    .getByRole("button", { name: "Nhân viên", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Thêm nhân viên", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Họ và tên", { exact: true }).fill("Trần Thảo");
  await expect(dialog.getByLabel("Tên đăng nhập", { exact: true })).toHaveValue(
    "thao.tran",
  );
  await dialog.getByLabel("Phòng ban", { exact: true }).selectOption("Kế toán");
  await dialog
    .getByLabel("Mật khẩu", { exact: true })
    .fill("Demo-password-2026");
  await dialog.getByRole("button", { name: "Lưu nhân viên" }).click();
  await expect(page.getByRole("heading", { name: "Trần Thảo" })).toBeVisible();
  await page
    .getByRole("button", { name: "Sửa Trần Thảo", exact: true })
    .click();
  await dialog.getByLabel("Họ và tên", { exact: true }).fill("Trần Thu Thảo");
  await expect(dialog.getByLabel("Tên đăng nhập", { exact: true })).toHaveValue(
    "thao.tran",
  );
  await dialog.getByRole("button", { name: "Lưu nhân viên" }).click();
  await expect(
    page.getByRole("heading", { name: "Trần Thu Thảo" }),
  ).toBeVisible();
  page.on("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Xóa Trần Thu Thảo", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Trần Thu Thảo" }),
  ).toHaveCount(0);
  const storage = await page.evaluate(() =>
    localStorage.getItem("marixa-demo-v1"),
  );
  expect(storage).not.toContain("Demo-password-2026");
});
test("management API does not operate without configured Supabase", async ({
  request,
}) => {
  const r = await request.post("/api/employees", {
    data: {
      full_name: "Test",
      department: "IT",
      password: "not-real-password",
    },
  });
  expect(r.status()).toBe(503);
});
