"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  Check,
  ClipboardList,
  Eye,
  FileCheck2,
  LoaderCircle,
  MessageSquare,
  Moon,
  Plus,
  Save,
  Share2,
  Sun,
  Target,
  Trash2,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { ReportInput, reportSchema } from "@/lib/model";
import ReportSheet from "./report-sheet";
import { downloadBlob, exportReport } from "@/lib/export";

export default function ReportEditor({
  value: r,
  onChange,
  editing,
  onSave,
  busy,
  notice,
  onContinueEvening,
  onReturnMorning,
}: {
  value: ReportInput;
  onChange: (r: ReportInput) => void;
  editing: boolean;
  onSave: () => Promise<boolean>;
  busy: boolean;
  notice: (s: string) => void;
  onContinueEvening: () => void;
  onReturnMorning: () => void;
}) {
  const sheet = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [ready, setReady] = useState<File | null>(null);
  const [error, setError] = useState("");
  const evening = r.type === "evening";
  useEffect(() => {
    setReady(null);
    setError("");
  }, [r]);
  const set = <K extends keyof ReportInput>(key: K, value: ReportInput[K]) =>
    onChange({ ...r, [key]: value });
  const completed = [
    !!r.position,
    r.highlights.some(Boolean),
    r.tasks.every((t) => !!t.title.trim()),
  ].filter(Boolean).length;
  async function makeImage(share: boolean) {
    if (!sheet.current) return;
    setError("");
    const parsed = reportSchema.safeParse(r);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setExporting(true);
    try {
      const blob = await exportReport(sheet.current);
      const filename = `MARIXA-${r.type === "morning" ? "dau-ngay" : "cuoi-ngay"}-${r.report_date}.png`;
      if (share) {
        const file = new File([blob], filename, { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) {
          setReady(file);
          notice("Ảnh đã sẵn sàng. Nhấn “Chọn ứng dụng” rồi chọn Zalo.");
        } else {
          downloadBlob(blob, filename);
          notice("Đã tải ảnh. Mở Zalo và đính kèm ảnh từ máy để gửi.");
        }
      } else {
        downloadBlob(blob, filename);
        notice("Đã tạo ảnh PNG để tải về.");
      }
    } catch {
      setError(
        "Không tạo được ảnh. Hãy thử lại hoặc dùng trình duyệt Chrome/Safari mới.",
      );
    } finally {
      setExporting(false);
    }
  }
  async function shareReady() {
    if (!ready) return;
    try {
      await navigator.share({ files: [ready], title: "Báo cáo MARIXA" });
      setReady(null);
    } catch (e) {
      if ((e as DOMException).name !== "AbortError") {
        downloadBlob(ready, ready.name);
        notice(
          "Không mở được bảng chia sẻ. Ảnh đã tải về để bạn gửi qua Zalo.",
        );
      }
    }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsed = reportSchema.safeParse(r);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    await onSave();
  }
  return (
    <div className="editor-layout">
      <form className="editor-form" onSubmit={save}>
        <fieldset disabled={busy} className="editor-fieldset">
          <div className="report-type-switch">
            <button
              type="button"
              disabled={busy}
              className={!evening ? "active morning" : ""}
              aria-pressed={!evening}
              onClick={onReturnMorning}
            >
              <Sun size={23} />
              <span>
                <strong>Đầu ngày</strong>
                <small>Kế hoạch & mục tiêu</small>
              </span>
              {!evening && <Check size={17} />}
            </button>
            <button
              type="button"
              disabled={busy}
              className={evening ? "active evening" : ""}
              aria-pressed={evening}
              onClick={onContinueEvening}
            >
              <Moon size={23} />
              <span>
                <strong>Cuối ngày</strong>
                <small>Kết quả & bài học</small>
              </span>
              {evening && <Check size={17} />}
            </button>
          </div>
          <section className="form-card">
            <div className="section-heading">
              <span className="section-icon">
                <UserRound />
              </span>
              <div>
                <h2>Thông tin báo cáo</h2>
                <p>Ghi lại công việc của bạn trong ngày.</p>
              </div>
              <span className="step">01</span>
            </div>
            <div className="field-grid">
              <label>
                Ngày báo cáo
                <input
                  type="date"
                  required
                  readOnly={evening || editing}
                  value={r.report_date}
                  onChange={(e) => set("report_date", e.target.value)}
                />
              </label>
              <label>
                Họ và tên
                <input value={r.full_name} readOnly />
              </label>
              <label>
                Phòng ban
                <input value={r.department} readOnly />
              </label>
              <label>
                <span>
                  Chức vụ <span className="required">*</span>
                </span>
                <input
                  placeholder="VD: Chuyên viên Marketing"
                  required
                  maxLength={100}
                  value={r.position}
                  onChange={(e) => set("position", e.target.value)}
                />
              </label>
            </div>
          </section>
          <section className="form-card">
            <div className="section-heading">
              <span className="section-icon teal">
                <Target />
              </span>
              <div>
                <h2>{evening ? "Kết quả nổi bật" : "Trọng tâm trong ngày"}</h2>
                <p>
                  {evening
                    ? "Ba kết quả đáng chú ý nhất hôm nay."
                    : "Hôm nay, bạn muốn tập trung vào điều gì?"}
                </p>
              </div>
              <span className="step">02</span>
            </div>
            <div className="focus-fields">
              {r.highlights.map((h, i) => (
                <label key={i}>
                  <span aria-hidden="true" className={`focus-number n${i}`}>
                    0{i + 1}
                  </span>
                  <span className="sr-only">
                    {evening ? "Kết quả" : "Trọng tâm"} {i + 1}
                  </span>
                  <textarea
                    aria-label={`${evening ? "Kết quả" : "Trọng tâm"} ${i + 1}`}
                    rows={2}
                    maxLength={300}
                    value={h}
                    onChange={(e) =>
                      set(
                        "highlights",
                        r.highlights.map((v, j) =>
                          j === i ? e.target.value : v,
                        ),
                      )
                    }
                    placeholder={
                      evening
                        ? `Kết quả nổi bật ${i + 1}`
                        : [
                            "Mục tiêu quan trọng nhất hôm nay…",
                            "Ưu tiên tiếp theo của bạn…",
                            "Một việc nữa bạn muốn hoàn thành…",
                          ][i]
                    }
                  />
                </label>
              ))}
            </div>
            <small className="hint">
              Nhập ít nhất 1 mục. Viết ngắn gọn để báo cáo dễ đọc.
            </small>
          </section>
          <section className="form-card">
            <div className="section-heading">
              <span className="section-icon">
                <ClipboardList />
              </span>
              <div>
                <h2>
                  {evening
                    ? "Tiến độ & nhiệm vụ"
                    : "Mục tiêu & nhiệm vụ chi tiết"}
                </h2>
                <p>
                  {evening
                    ? "Cập nhật tiến độ và kết quả thực tế."
                    : "Chia mục tiêu thành những việc cụ thể."}
                </p>
              </div>
              <span className="step">03</span>
            </div>
            {evening && (
              <p className="linked-note">
                <Check size={15} />
                Tiếp nối báo cáo đầu ngày · Có thể thêm việc phát sinh.
              </p>
            )}
            <div className="tasks-form">
              {r.tasks.map((t, i) => (
                <div className="task-form" key={i}>
                  <div className="task-form-title">
                    <b>{String(i + 1).padStart(2, "0")}</b>
                    <label>
                      <span className="sr-only">Nhiệm vụ {i + 1}</span>
                      <textarea
                        aria-label={`Nhiệm vụ ${i + 1}`}
                        required
                        rows={2}
                        maxLength={500}
                        value={t.title}
                        placeholder="Nhập nội dung công việc…"
                        onChange={(e) =>
                          set(
                            "tasks",
                            r.tasks.map((v, j) =>
                              j === i ? { ...v, title: e.target.value } : v,
                            ),
                          )
                        }
                      />
                    </label>
                    <button
                      className="icon-button danger"
                      type="button"
                      disabled={r.tasks.length === 1}
                      aria-label={`Xóa nhiệm vụ ${i + 1}`}
                      onClick={() =>
                        set(
                          "tasks",
                          r.tasks.filter((_, j) => j !== i),
                        )
                      }
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                  {evening && (
                    <div className="task-details">
                      <label>
                        Tiến độ (%)
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={t.progress}
                          onChange={(e) =>
                            set(
                              "tasks",
                              r.tasks.map((v, j) =>
                                j === i
                                  ? { ...v, progress: Number(e.target.value) }
                                  : v,
                              ),
                            )
                          }
                        />
                      </label>
                      <label>
                        Kết quả cụ thể
                        <textarea
                          aria-label="Kết quả cụ thể"
                          rows={2}
                          maxLength={500}
                          value={t.result}
                          placeholder="Đã hoàn thành được gì?"
                          onChange={(e) =>
                            set(
                              "tasks",
                              r.tasks.map((v, j) =>
                                j === i ? { ...v, result: e.target.value } : v,
                              ),
                            )
                          }
                        />
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              className="add-task"
              disabled={r.tasks.length >= 20}
              onClick={() =>
                set("tasks", [
                  ...r.tasks,
                  { title: "", progress: 0, result: "" },
                ])
              }
            >
              <Plus size={17} />
              Thêm nhiệm vụ <span>{r.tasks.length}/20</span>
            </button>
          </section>
          <section className="form-card">
            <div className="section-heading">
              <span className="section-icon teal">
                <TrendingUp />
              </span>
              <div>
                <h2>
                  {evening
                    ? "Hiệu suất / KPI đạt được"
                    : "Chỉ số / KPI cần đạt"}
                </h2>
                <p>Không bắt buộc · Điền nếu công việc có KPI.</p>
              </div>
              <span className="step">04</span>
            </div>
            <label>
              Tên chỉ số
              <input
                maxLength={100}
                value={r.kpi_label}
                placeholder="VD: Khách hàng được tư vấn"
                onChange={(e) => set("kpi_label", e.target.value)}
              />
            </label>
            <div className="field-grid kpi-fields">
              <label>
                Mục tiêu
                <input
                  type="number"
                  min="0"
                  max="1000000000"
                  step="any"
                  value={r.kpi_target || ""}
                  placeholder="0"
                  onChange={(e) => set("kpi_target", Number(e.target.value))}
                />
              </label>
              {evening && (
                <label>
                  Đã đạt
                  <input
                    type="number"
                    min="0"
                    max="1000000000"
                    step="any"
                    value={r.kpi_actual || ""}
                    placeholder="0"
                    onChange={(e) => set("kpi_actual", Number(e.target.value))}
                  />
                </label>
              )}
              <label>
                Đơn vị
                <input
                  maxLength={30}
                  value={r.kpi_unit}
                  placeholder="VD: khách hàng"
                  onChange={(e) => set("kpi_unit", e.target.value)}
                />
              </label>
            </div>
          </section>
          <section className="form-card">
            <div className="section-heading">
              <span className="section-icon amber">
                <MessageSquare />
              </span>
              <div>
                <h2>
                  {evening
                    ? "Bài học / Ghi chú / Đồng đội"
                    : "Ghi chú / Đề xuất"}
                </h2>
                <p>
                  {evening
                    ? "Điều học được, hỗ trợ cần có hoặc lời cảm ơn."
                    : "Chia sẻ thêm để công việc thuận lợi hơn."}
                </p>
              </div>
              <span className="step">05</span>
            </div>
            <label>
              <span className="sr-only">Ghi chú</span>
              <textarea
                aria-label="Ghi chú"
                rows={4}
                maxLength={3000}
                value={r.notes}
                placeholder={
                  evening
                    ? "Hôm nay bạn rút ra điều gì?"
                    : "Khó khăn, đề xuất hoặc hỗ trợ bạn cần…"
                }
                onChange={(e) => set("notes", e.target.value)}
              />
            </label>
            <div className="char-count">{r.notes.length}/3000</div>
          </section>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="editor-actions">
            <span>
              <FileCheck2 size={17} />
              {completed}/3 phần bắt buộc đã điền
            </span>
            <button
              type="button"
              className="button secondary mobile-preview"
              onClick={() =>
                preview.current?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <Eye size={18} />
              Xem trước
            </button>
            <button type="submit" className="button primary" disabled={busy}>
              {busy ? (
                <LoaderCircle className="spin" size={18} />
              ) : (
                <Save size={18} />
              )}{" "}
              {editing ? "Lưu thay đổi" : "Lưu báo cáo"}
            </button>
          </div>
        </fieldset>
      </form>
      <aside className="preview-column" ref={preview}>
        <div className="preview-sticky">
          <div className="preview-heading">
            <span>
              <Eye size={17} /> Xem trước báo cáo
            </span>
            <span className="live-indicator">Trực tiếp</span>
          </div>
          <div className="preview-paper">
            <ReportSheet ref={sheet} report={r} />
          </div>
          <div className="export-buttons">
            <button
              className="button secondary"
              disabled={exporting}
              onClick={() => makeImage(false)}
            >
              <ArrowDownToLine size={17} />
              {exporting ? "Đang tạo…" : "Tải ảnh PNG"}
            </button>
            <button
              className="button primary"
              disabled={exporting}
              onClick={() => makeImage(true)}
            >
              <Share2 size={17} />
              Chia sẻ ảnh
            </button>
          </div>
          {ready && (
            <button className="button teal-button full" onClick={shareReady}>
              <Share2 size={18} />
              Chọn ứng dụng (Zalo…)
            </button>
          )}
          <p className="preview-note">
            Ảnh chất lượng cao · Sẵn sàng gửi cho sếp
            <br />
            Chọn Zalo trong bảng chia sẻ nếu thiết bị hỗ trợ.
          </p>
        </div>
      </aside>
    </div>
  );
}
