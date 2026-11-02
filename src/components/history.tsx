"use client";
import { useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  Eye,
  FileText,
  Moon,
  Pencil,
  Search,
  Share2,
  Sun,
  Trash2,
} from "lucide-react";
import { dateLabel, Profile, Report } from "@/lib/model";
import ReportSheet from "./report-sheet";
import { downloadBlob, exportReport } from "@/lib/export";
export default function History({
  reports,
  profile,
  onContinue,
  onEdit,
  onDelete,
  notice,
  onRefresh,
  loading,
}: {
  reports: Report[];
  profile: Profile;
  onContinue: (r: Report) => void;
  onEdit: (r: Report) => void;
  onDelete: (r: Report) => Promise<void>;
  notice: (s: string) => void;
  onRefresh: () => Promise<void>;
  loading: boolean;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const filtered = reports.filter(
    (r) =>
      (type === "all" || r.type === type) &&
      (!from || r.report_date >= from) &&
      (!to || r.report_date <= to) &&
      `${r.full_name} ${r.department} ${r.position}`
        .toLocaleLowerCase("vi")
        .includes(query.toLocaleLowerCase("vi")),
  );
  async function image(share: boolean) {
    if (!sheet.current || !selected) return;
    setBusy(true);
    try {
      const blob = await exportReport(sheet.current);
      const name = `MARIXA-${selected.type}-${selected.report_date}.png`;
      const f = new File([blob], name, { type: "image/png" });
      if (share && navigator.canShare?.({ files: [f] })) {
        setFile(f);
        notice("Ảnh đã sẵn sàng. Nhấn Chọn ứng dụng để gửi.");
      } else {
        downloadBlob(blob, name);
        notice(
          share
            ? "Đã tải ảnh. Bạn có thể đính kèm ảnh trong Zalo."
            : "Đã tạo ảnh PNG để tải về.",
        );
      }
    } catch {
      notice("Không tạo được ảnh. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }
  if (selected)
    return (
      <div className="history-detail">
        <div className="detail-toolbar">
          <button
            className="button secondary"
            onClick={() => {
              setSelected(null);
              setFile(null);
            }}
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>
          <div>
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => image(false)}
            >
              <ArrowDownToLine size={17} />
              Tải PNG
            </button>
            <button
              className="button primary"
              disabled={busy}
              onClick={() => image(true)}
            >
              <Share2 size={17} />
              Chia sẻ ảnh
            </button>
          </div>
        </div>
        {file && (
          <button
            className="button teal-button"
            onClick={async () => {
              try {
                await navigator.share({ files: [file] });
                setFile(null);
              } catch (e) {
                if ((e as DOMException).name !== "AbortError") {
                  downloadBlob(file, file.name);
                  notice("Đã tải ảnh để gửi thủ công.");
                }
              }
            }}
          >
            Chọn ứng dụng (Zalo…)
          </button>
        )}
        <ReportSheet ref={sheet} report={selected} />
      </div>
    );
  return (
    <>
      <div className="history-filters">
        <label className="search-field">
          <Search size={18} />
          <span className="sr-only">Tìm báo cáo</span>
          <input
            placeholder="Tìm họ tên, phòng ban…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          Loại báo cáo
          <select
            aria-label="Loại báo cáo"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="all">Tất cả báo cáo</option>
            <option value="morning">Đầu ngày</option>
            <option value="evening">Cuối ngày</option>
          </select>
        </label>
        <label>
          Từ ngày
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          Đến ngày
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
      </div>
      <div className="list-caption">
        <span>
          {filtered.length} báo cáo{" "}
          {profile.role === "admin" ? "của đội ngũ" : "của bạn"}
        </span>
        <button className="text-button" onClick={onRefresh} disabled={loading}>
          {loading ? "Đang tải…" : "Làm mới"}
        </button>
      </div>
      <div className="report-list">
        {filtered.map((r) => (
          <article className="history-row" key={r.id}>
            <div
              className={`report-symbol ${r.type === "evening" ? "night" : ""}`}
            >
              {r.type === "morning" ? <Sun /> : <Moon />}
            </div>
            <div className="history-info">
              <h3>Báo cáo {r.type === "morning" ? "đầu ngày" : "cuối ngày"}</h3>
              <p>
                {r.full_name} <span>· {r.department}</span>
              </p>
              <small>{dateLabel(r.report_date)}</small>
            </div>
            <span className="tag saved">Đã lưu</span>
            <div className="row-actions">
              <button
                className="icon-button"
                aria-label={`Xem báo cáo ${r.id}`}
                onClick={() => setSelected(r)}
              >
                <Eye size={18} />
              </button>
              {r.user_id === profile.id && (
                <>
                  {r.type === "morning" && (
                    <button
                      className="button continue-button"
                      onClick={() => onContinue(r)}
                    >
                      <Moon size={15} />
                      Báo cáo cuối ngày
                    </button>
                  )}
                  <button
                    className="icon-button"
                    aria-label={`Sửa báo cáo ${r.id}`}
                    onClick={() => onEdit(r)}
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    className="icon-button danger"
                    disabled={loading}
                    aria-label={`Xóa báo cáo ${r.id}`}
                    onClick={() => onDelete(r)}
                  >
                    <Trash2 size={18} />
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
        {!filtered.length && (
          <div className="empty-state">
            <FileText />
            <h3>{loading ? "Đang tải báo cáo…" : "Chưa có báo cáo nào"}</h3>
            <p>
              {loading
                ? "Dữ liệu đang được cập nhật."
                : "Báo cáo đã lưu sẽ xuất hiện tại đây. Thử thay đổi bộ lọc nếu cần."}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
