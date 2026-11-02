import { z } from "zod";

export const departments = [
  "IT",
  "Marketing",
  "Kinh doanh",
  "Kế toán",
  "Nhân sự",
  "Ban giám đốc",
  "Khác",
] as const;
export type Role = "admin" | "employee";
export type Profile = {
  id: string;
  full_name: string;
  department: string;
  role: Role;
};
export const reportSchema = z
  .object({
    morning_report_id: z.string().nullable(),
    report_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine(
        (v) =>
          !Number.isNaN(Date.parse(v)) &&
          new Date(v).toISOString().slice(0, 10) === v,
        "Ngày không hợp lệ",
      ),
    type: z.enum(["morning", "evening"]),
    full_name: z.string().trim().min(1).max(100),
    department: z.string().trim().min(1).max(80),
    position: z.string().trim().min(1, "Vui lòng nhập chức vụ.").max(100),
    highlights: z
      .array(z.string().trim().max(300))
      .length(3)
      .refine(
        (v) => v.some(Boolean),
        "Nhập ít nhất một trọng tâm hoặc kết quả.",
      ),
    tasks: z
      .array(
        z.object({
          title: z.string().trim().min(1, "Nhập tên nhiệm vụ.").max(500),
          progress: z.number().min(0).max(100),
          result: z.string().max(500),
        }),
      )
      .min(1)
      .max(20),
    kpi_label: z.string().trim().max(100),
    kpi_target: z.number().min(0).max(1000000000),
    kpi_actual: z.number().min(0).max(1000000000),
    kpi_unit: z.string().trim().max(30),
    notes: z.string().max(3000),
  })
  .refine(
    (v) =>
      (!v.kpi_target && !v.kpi_actual) ||
      (v.kpi_label.length > 0 && v.kpi_target > 0),
    "KPI cần tên chỉ số và mục tiêu lớn hơn 0.",
  )
  .refine(
    (v) =>
      v.type === "morning"
        ? v.morning_report_id === null
        : !!v.morning_report_id,
    "Hãy lưu báo cáo đầu ngày trước, rồi tiếp tục báo cáo cuối ngày từ bản đó.",
  );
export type ReportInput = z.infer<typeof reportSchema>;
export type Report = ReportInput & {
  id: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};
export function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function dateLabel(v: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) {
    return "Chọn ngày báo cáo";
  }
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(v + "T12:00:00+07:00"));
}
export function blankReport(
  p: Profile,
  type: ReportInput["type"] = "morning",
): ReportInput {
  return {
    morning_report_id: null,
    report_date: today(),
    type,
    full_name: p.full_name,
    department: p.department,
    position: "",
    highlights: ["", "", ""],
    tasks: [{ title: "", progress: 0, result: "" }],
    kpi_label: "",
    kpi_target: 0,
    kpi_actual: 0,
    kpi_unit: "",
    notes: "",
  };
}
export function continueReport(morning: Report): ReportInput {
  return {
    morning_report_id: morning.id,
    report_date: morning.report_date,
    type: "evening",
    full_name: morning.full_name,
    department: morning.department,
    position: morning.position,
    highlights: ["", "", ""],
    tasks: morning.tasks.map((t) => ({ ...t, progress: 0, result: "" })),
    kpi_label: morning.kpi_label,
    kpi_target: morning.kpi_target,
    kpi_actual: 0,
    kpi_unit: morning.kpi_unit,
    notes: "",
  };
}
export function normalizeName(value: string) {
  return value
    .trim()
    .normalize("NFC")
    .toLocaleLowerCase("vi")
    .replace(/\s+/g, " ");
}
export async function loginEmail(name: string, department: string, role: Role) {
  const input = JSON.stringify([
    role,
    role === "admin" ? "" : normalizeName(department),
    normalizeName(name),
  ]);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return `${Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}@login.marixa.invalid`;
}
export const employeeSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  department: z.enum(departments),
  password: z.string().min(6, "Mật khẩu cần ít nhất 6 ký tự.").max(128),
});
