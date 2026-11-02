import { test } from "node:test";
import assert from "node:assert/strict";
import {
  blankReport,
  continueReport,
  loginEmail,
  reportSchema,
} from "../src/lib/model";
import { demoEmployee, demoReports } from "../src/lib/demo";
test("login identity normalizes whitespace, case and Unicode while separating department/role", async () => {
  assert.equal(
    await loginEmail("  Nguyễn   Minh Anh ", "Marketing", "employee"),
    await loginEmail("nguyễn minh anh", "marketing", "employee"),
  );
  assert.equal(
    await loginEmail("Nguyễn".normalize("NFD"), "IT", "employee"),
    await loginEmail("Nguyễn", "IT", "employee"),
  );
  assert.notEqual(
    await loginEmail("An", "IT", "employee"),
    await loginEmail("An", "Marketing", "employee"),
  );
  assert.notEqual(
    await loginEmail("An", "IT", "employee"),
    await loginEmail("An", "IT", "admin"),
  );
});
test("evening keeps morning tasks and KPI without mutating original, resets results", () => {
  const m = demoReports()[0];
  m.tasks[0].progress = 50;
  const e = continueReport(m);
  assert.equal(e.morning_report_id, m.id);
  assert.equal(e.report_date, m.report_date);
  assert.equal(e.kpi_target, m.kpi_target);
  assert.equal(e.tasks[0].progress, 0);
  e.tasks[0].title = "changed";
  assert.notEqual(m.tasks[0].title, e.tasks[0].title);
  assert.deepEqual(e.highlights, ["", "", ""]);
});
test("reject incomplete reports, invalid dates/progress/KPI and standalone evening", () => {
  assert.equal(
    reportSchema.safeParse(blankReport(demoEmployee)).success,
    false,
  );
  const m = demoReports()[0];
  assert.equal(reportSchema.safeParse(m).success, true);
  for (const patch of [
    { report_date: "2026-02-30" },
    { tasks: [{ title: "x", progress: 101, result: "" }] },
    { kpi_label: "", kpi_target: 10 },
    { type: "evening", morning_report_id: null },
  ])
    assert.equal(reportSchema.safeParse({ ...m, ...patch }).success, false);
});
