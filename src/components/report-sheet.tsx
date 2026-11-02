import { forwardRef } from "react";
import {
  Sun,
  Moon,
  Target,
  ListChecks,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import { dateLabel, ReportInput } from "@/lib/model";
import Brand from "./brand";
const ReportSheet = forwardRef<HTMLDivElement, { report: ReportInput }>(
  function ReportSheet({ report: r }, ref) {
    const evening = r.type === "evening";
    const percent =
      r.kpi_target > 0 ? Math.round((r.kpi_actual / r.kpi_target) * 100) : 0;
    return (
      <article
        ref={ref}
        className={`report-sheet ${evening ? "sheet-evening" : ""}`}
      >
        <header className="sheet-header">
          <div className="sheet-brand-row">
            <Brand compact />
            <span>BÁO CÁO CÔNG VIỆC</span>
          </div>
          <div className="sheet-title">
            <div>
              <span className="sheet-eyebrow">
                {evening ? "NHÌN LẠI & TIẾN BƯỚC" : "LÊN KẾ HOẠCH & HÀNH ĐỘNG"}
              </span>
              <h2>Báo cáo {evening ? "cuối ngày" : "đầu ngày"}</h2>
              <p>{dateLabel(r.report_date)}</p>
            </div>
            <div className="sheet-sun">
              {evening ? <Moon size={32} /> : <Sun size={32} />}
            </div>
          </div>
        </header>
        <div className="sheet-body">
          <div className="sheet-person">
            <div className="sheet-avatar">
              {r.full_name.trim().split(" ").pop()?.slice(0, 1) || "M"}
            </div>
            <div>
              <strong>{r.full_name || "Họ và tên"}</strong>
              <p>
                {r.position || "Chức vụ"} · {r.department}
              </p>
            </div>
          </div>
          <section>
            <h3>
              <Target />
              {evening ? "Kết quả nổi bật" : "Trọng tâm trong ngày"}
            </h3>
            <div className="sheet-highlights">
              {r.highlights.map((h, i) => (
                <div key={i}>
                  <span>0{i + 1}</span>
                  <p>{h || "—"}</p>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h3>
              <ListChecks />
              {evening ? "Tiến độ & nhiệm vụ" : "Mục tiêu & nhiệm vụ chi tiết"}
            </h3>
            <div className="sheet-tasks">
              {r.tasks.map((t, i) => (
                <div className="sheet-task" key={i}>
                  <span className="task-number">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <strong>{t.title || "Nhiệm vụ cần thực hiện"}</strong>
                    {evening && t.result && <p>{t.result}</p>}
                    {evening && (
                      <div className="task-progress">
                        <i style={{ width: `${t.progress}%` }} />
                      </div>
                    )}
                  </div>
                  {evening && <b>{t.progress}%</b>}
                </div>
              ))}
            </div>
          </section>
          {(r.kpi_label || r.kpi_target > 0) && (
            <section className="sheet-kpi">
              <h3>
                <TrendingUp />
                {evening ? "Hiệu suất / KPI đạt được" : "Chỉ số / KPI cần đạt"}
              </h3>
              <div className="sheet-kpi-row">
                <div>
                  <p>{r.kpi_label || "Mục tiêu KPI"}</p>
                  <strong>
                    {evening ? (
                      <>
                        {r.kpi_actual.toLocaleString("vi-VN")}{" "}
                        <small>/ {r.kpi_target.toLocaleString("vi-VN")}</small>
                      </>
                    ) : (
                      r.kpi_target.toLocaleString("vi-VN")
                    )}{" "}
                    <small>{r.kpi_unit}</small>
                  </strong>
                </div>
                {evening && <span className="kpi-percent">{percent}%</span>}
              </div>
              {evening && (
                <div className="sheet-progress">
                  <i style={{ width: `${Math.min(percent, 100)}%` }} />
                </div>
              )}
            </section>
          )}
          <section className="sheet-notes">
            <h3>
              <MessageSquare />
              {evening ? "Bài học / Ghi chú / Đồng đội" : "Ghi chú / Đề xuất"}
            </h3>
            <p>{r.notes || "Không có ghi chú thêm."}</p>
          </section>
        </div>
        <footer className="sheet-footer">
          <span className="gold-star">✦</span>
          <strong>
            {evening
              ? "Nỗ lực hôm nay, thành công ngày mai."
              : "Một ngày mới. Một mục tiêu mới."}
          </strong>
          <span>MARIXA · CÙNG NHAU TIẾN XA</span>
        </footer>
      </article>
    );
  },
);
export default ReportSheet;
