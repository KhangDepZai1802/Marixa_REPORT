import { blankReport, Profile, Report, Role } from "./model";
export const demoEmployee: Profile = {
  id: "demo-employee",
  full_name: "Nguyễn Minh Anh",
  department: "Marketing",
  role: "employee",
};
export const demoAdmin: Profile = {
  id: "demo-admin",
  full_name: "Khang",
  department: "Ban giám đốc",
  role: "admin",
};
export function demoProfile(role: Role) {
  return role === "admin" ? demoAdmin : demoEmployee;
}
export function demoReports(): Report[] {
  const base = blankReport(demoEmployee);
  return [
    {
      ...base,
      id: "demo-report",
      user_id: demoEmployee.id,
      position: "Chuyên viên Marketing",
      highlights: [
        "Hoàn thiện kế hoạch nội dung tháng 11",
        "Tối ưu chiến dịch quảng cáo đang chạy",
        "Kết nối và chăm sóc khách hàng mới",
      ],
      tasks: [
        {
          title: "Lên nội dung cho 3 bài đăng trên fanpage",
          progress: 0,
          result: "",
        },
        {
          title: "Rà soát hiệu quả chiến dịch quảng cáo",
          progress: 0,
          result: "",
        },
        {
          title: "Tư vấn và theo dõi 20 khách hàng tiềm năng",
          progress: 0,
          result: "",
        },
      ],
      kpi_label: "Khách hàng được tư vấn",
      kpi_target: 20,
      kpi_actual: 0,
      kpi_unit: "khách hàng",
      notes: "Phối hợp với đội thiết kế để chốt hình ảnh trước 15:00.",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}
