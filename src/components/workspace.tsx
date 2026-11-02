"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  FileClock,
  FilePlus2,
  FileText,
  LogOut,
  Menu,
  Moon,
  Plus,
  ShieldCheck,
  Sun,
  Users,
  X,
} from "lucide-react";
import Brand from "./brand";
import Login from "./login";
import ReportEditor from "./report-editor";
import History from "./history";
import Employees from "./employees";
import {
  blankReport,
  continueReport,
  dateLabel,
  Profile,
  Report,
  ReportInput,
  reportSchema,
  Role,
  today,
} from "@/lib/model";
import { supabase } from "@/lib/supabase";
import { demoAdmin, demoEmployee, demoProfile, demoReports } from "@/lib/demo";

type View = "editor" | "history" | "employees";
export default function Workspace() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [demo, setDemo] = useState(false);
  const [initializing, setInitializing] = useState(!!supabase);
  const [view, setView] = useState<View>("editor");
  const [reports, setReports] = useState<Report[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [report, setReport] = useState<ReportInput | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [menu, setMenu] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notice = useCallback((s: string) => {
    setMessage(s);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setMessage(""), 7000);
  }, []);
  const refresh = useCallback(async () => {
    if (!supabase || !profile || demo) return;
    setLoading(true);
    setLoadError("");
    try {
      const all: Report[] = [];
      let offset = 0;
      while (true) {
        const { data, error } = await supabase
          .from("reports")
          .select("*")
          .order("report_date", { ascending: false })
          .order("id")
          .range(offset, offset + 499);
        if (error) throw error;
        all.push(...data);
        if (data.length < 500) break;
        offset += 500;
      }
      setReports(all);
      if (profile.role === "admin") {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const response = await fetch("/api/employees", {
          headers: { Authorization: `Bearer ${session?.access_token}` },
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Cannot load employees");
        const result = await response.json();
        setEmployees(result.employees);
      }
    } catch {
      setLoadError("Chưa tải được dữ liệu. Kiểm tra kết nối và thử lại.");
    } finally {
      setLoading(false);
    }
  }, [profile, demo]);
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (error) throw error;
        if (data.session) {
          const { data: p, error: pe } = await supabase!
            .from("profiles")
            .select("*")
            .eq("id", data.session.user.id)
            .single();
          if (pe) throw pe;
          if (alive && p) {
            setProfile(p);
            setReport(blankReport(p));
          }
        }
      })
      .catch(() => {
        if (alive)
          notice(
            "Không khôi phục được phiên đăng nhập. Vui lòng đăng nhập lại.",
          );
      })
      .finally(() => {
        if (alive) setInitializing(false);
      });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setProfile(null);
        setReport(null);
        setReports([]);
        setEmployees([]);
      }
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [notice]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  function login(p: Profile) {
    setDemo(false);
    setProfile(p);
    setReport(blankReport(p));
    setView("editor");
    setDirty(false);
    setEditing(null);
  }
  function enterDemo(role: Role) {
    const p = demoProfile(role);
    setDemo(true);
    setProfile(p);
    let rs = demoReports(),
      ps = [demoAdmin, demoEmployee];
    try {
      const cached = JSON.parse(
        localStorage.getItem("marixa-demo-v1") || "null",
      );
      if (
        cached &&
        Array.isArray(cached.reports) &&
        Array.isArray(cached.employees)
      ) {
        rs = cached.reports;
        ps = cached.employees;
      }
    } catch {
      notice("Không đọc được dữ liệu mẫu đã lưu. Đã khởi tạo lại bản mẫu.");
    }
    setReports(rs);
    setEmployees(ps);
    setReport({
      ...blankReport(p),
      position: role === "admin" ? "Quản lý" : "Chuyên viên Marketing",
    });
    setView("editor");
    setEditing(null);
    setDirty(false);
  }
  function persistDemo(rs: Report[], ps: Profile[]) {
    try {
      localStorage.setItem(
        "marixa-demo-v1",
        JSON.stringify({ reports: rs, employees: ps }),
      );
    } catch {
      notice(
        "Trình duyệt không cho lưu dữ liệu mẫu. Dữ liệu chỉ tồn tại trong phiên này.",
      );
    }
  }
  async function save() {
    if (!profile || !report) return false;
    const parsed = reportSchema.safeParse(report);
    if (!parsed.success) {
      notice(parsed.error.issues[0].message);
      return false;
    }
    setBusy(true);
    try {
      if (demo) {
        if (
          reports.some(
            (r) =>
              r.user_id === profile.id &&
              r.report_date === report.report_date &&
              r.type === report.type &&
              r.id !== editing,
          )
        )
          throw new Error(
            "Bạn đã có báo cáo loại này trong ngày. Mở Lịch sử để sửa báo cáo đó.",
          );
        const old = reports.find((r) => r.id === editing);
        const next: Report = {
          ...parsed.data,
          id: editing || crypto.randomUUID(),
          user_id: profile.id,
          created_at: old?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const updated = editing
          ? reports.map((r) => (r.id === editing ? next : r))
          : [next, ...reports];
        setReports(updated);
        persistDemo(updated, employees);
        setEditing(next.id);
      } else {
        const query = editing
          ? supabase!
              .from("reports")
              .update(parsed.data)
              .eq("id", editing)
              .eq("user_id", profile.id)
          : supabase!
              .from("reports")
              .insert({ ...parsed.data, user_id: profile.id });
        const { data, error } = await query.select().single();
        if (error) {
          if (error.code === "23505")
            throw new Error(
              "Bạn đã có báo cáo loại này trong ngày. Mở Lịch sử để sửa báo cáo đó.",
            );
          throw new Error(
            "Không lưu được báo cáo. Kiểm tra kết nối và thử lại.",
          );
        }
        setEditing(data.id);
        await refresh();
      }
      setDirty(false);
      notice(
        demo
          ? "Đã lưu báo cáo mẫu trên trình duyệt này."
          : "Đã lưu báo cáo. Admin có thể xem ngay.",
      );
      return true;
    } catch (e) {
      notice(e instanceof Error ? e.message : "Không thể lưu báo cáo.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  function createNew() {
    if (!profile || busy) return;
    if (
      dirty &&
      !confirm("Bạn có thay đổi chưa lưu. Bỏ thay đổi để tạo báo cáo mới?")
    )
      return;
    setReport(blankReport(profile));
    setEditing(null);
    setDirty(false);
    setView("editor");
    setMenu(false);
    window.scrollTo(0, 0);
  }
  function edit(r: Report) {
    if (dirty && !confirm("Bỏ các thay đổi chưa lưu để mở báo cáo này?"))
      return;
    const { id, user_id, created_at, updated_at, ...input } = r;
    setReport(input);
    setEditing(id);
    setDirty(false);
    setView("editor");
    window.scrollTo(0, 0);
  }
  async function remove(r: Report) {
    if (reports.some((v) => v.morning_report_id === r.id)) {
      notice(
        "Bản đầu ngày đang có báo cáo cuối ngày liên kết. Xóa bản cuối ngày trước nếu cần xóa cả hai.",
      );
      return;
    }
    if (
      !profile ||
      r.user_id !== profile.id ||
      !confirm(
        `Xóa báo cáo ${r.type === "morning" ? "đầu ngày" : "cuối ngày"} ${dateLabel(r.report_date)}? Thao tác này không thể hoàn tác.`,
      )
    )
      return;
    setLoading(true);
    try {
      if (demo) {
        const updated = reports.filter((v) => v.id !== r.id);
        setReports(updated);
        persistDemo(updated, employees);
      } else {
        const { data, error } = await supabase!
          .from("reports")
          .delete()
          .eq("id", r.id)
          .eq("user_id", profile.id)
          .select("id")
          .single();
        if (error || !data) throw new Error();
        await refresh();
      }
      if (editing === r.id) {
        setEditing(null);
        setReport(blankReport(profile));
        setDirty(false);
      }
      notice("Đã xóa báo cáo.");
    } catch {
      notice("Không xóa được báo cáo. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }
  async function logout() {
    if (busy) return;
    if (
      dirty &&
      !confirm("Báo cáo có thay đổi chưa lưu. Bạn vẫn muốn đăng xuất?")
    )
      return;
    if (!demo) {
      const { error } = await supabase!.auth.signOut();
      if (error) {
        notice("Chưa đăng xuất được. Hãy thử lại.");
        return;
      }
    }
    setProfile(null);
    setReport(null);
    setReports([]);
    setEmployees([]);
    setDirty(false);
    setDemo(false);
    setLoadError("");
  }
  function continueEvening(source?: Report) {
    if (!profile || !report || busy) return;
    if (report.type === "evening" && !source) return;
    const morning =
      source ||
      reports.find(
        (r) =>
          r.user_id === profile.id &&
          r.report_date === report.report_date &&
          r.type === "morning",
      );
    if (!morning) {
      notice(
        "Hãy lưu báo cáo đầu ngày trước, rồi tiếp tục báo cáo cuối ngày từ bản đó.",
      );
      return;
    }
    const existing = reports.find(
      (r) => r.morning_report_id === morning.id && r.user_id === profile.id,
    );
    if (existing) {
      edit(existing);
      return;
    }
    if (
      dirty &&
      !confirm("Bạn có thay đổi chưa lưu. Tiếp tục từ bản đầu ngày đã lưu?")
    )
      return;
    setReport(continueReport(morning));
    setEditing(null);
    setDirty(true);
    setView("editor");
    window.scrollTo(0, 0);
    notice(
      "Đã chuyển nhiệm vụ và KPI sang cuối ngày. Cập nhật tiến độ, ghi chú và thêm việc phát sinh.",
    );
  }
  if (initializing)
    return (
      <div className="loading-screen">
        <Brand />
        <p>Đang mở không gian làm việc…</p>
      </div>
    );
  if (!profile || !report)
    return (
      <>
        <Login onLogin={login} onDemo={enterDemo} />
        {message && (
          <div className="toast" role="status">
            {message}
          </div>
        )}
      </>
    );
  const own = reports.filter((r) => r.user_id === profile.id);
  const todayReports = own.filter((r) => r.report_date === today());
  const morning = todayReports.some((r) => r.type === "morning");
  const evening = todayReports.some((r) => r.type === "evening");
  const visibleReports = profile.role === "admin" ? reports : own;
  const nav = [
    { id: "editor" as const, label: "Viết báo cáo", icon: FilePlus2 },
    {
      id: "history" as const,
      label: profile.role === "admin" ? "Tất cả báo cáo" : "Báo cáo của tôi",
      icon: FileClock,
    },
    ...(profile.role === "admin"
      ? [{ id: "employees" as const, label: "Nhân viên", icon: Users }]
      : []),
  ];
  return (
    <div className="app-shell">
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <div className="sidebar-brand">
          <Brand />
          <button
            className="icon-button close-menu"
            aria-label="Đóng menu"
            onClick={() => setMenu(false)}
          >
            <X />
          </button>
        </div>
        <div className="workspace-label">KHÔNG GIAN LÀM VIỆC</div>
        <nav>
          {nav.map((n) => (
            <button
              key={n.id}
              aria-current={view === n.id ? "page" : undefined}
              className={view === n.id ? "active" : ""}
              onClick={() => {
                setView(n.id);
                setMenu(false);
              }}
            >
              <n.icon size={20} />
              {n.label}
              {view === n.id && <ChevronRight size={16} />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="gold-star">✦</span>
          <h3>
            Mỗi ngày tốt hơn
            <br />
            một chút.
          </h3>
          <p>
            Mục tiêu rõ ràng hôm nay.
            <br />
            Kết quả vững vàng ngày mai.
          </p>
          <div className="sidebar-note-line" />
        </div>
        <div className="sidebar-bottom">
          <div className="user-profile">
            <span className="person-avatar">
              {profile.full_name.split(" ").pop()?.[0]}
            </span>
            <div>
              <strong>{profile.full_name}</strong>
              <small>
                {profile.role === "admin"
                  ? "Quản trị viên"
                  : profile.department}
              </small>
            </div>
            {profile.role === "admin" && <ShieldCheck size={17} />}
          </div>
          <button className="logout" onClick={logout} disabled={busy}>
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>
      {menu && (
        <button
          aria-label="Đóng menu"
          className="menu-backdrop"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="app-body">
        <header className="topbar">
          <div>
            <button
              className="icon-button mobile-menu"
              onClick={() => setMenu(!menu)}
              aria-label="Mở menu"
              aria-expanded={menu}
            >
              <Menu />
            </button>
            <span>Không gian làm việc</span>
            <ChevronRight size={14} />
            <strong>
              {view === "editor"
                ? "Viết báo cáo"
                : view === "history"
                  ? "Lịch sử báo cáo"
                  : "Quản lý nhân viên"}
            </strong>
          </div>
          <span className="topbar-date">{dateLabel(today())}</span>
        </header>
        {demo && (
          <div className="demo-banner">
            <span>
              <strong>CHẾ ĐỘ XEM THỬ</strong> · Dữ liệu mẫu chỉ lưu trên trình
              duyệt này.
            </span>
            <button onClick={logout}>
              Thoát bản mẫu <ArrowUpRight size={14} />
            </button>
          </div>
        )}
        <main className="main-content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {view === "editor"
                  ? "MỘT NGÀY LÀM VIỆC HIỆU QUẢ"
                  : view === "history"
                    ? "LƯU GIỮ TỪNG BƯỚC TIẾN"
                    : "CÙNG NHAU LÀM VIỆC"}
              </span>
              <h1>
                {view === "editor"
                  ? editing
                    ? "Chỉnh sửa báo cáo"
                    : "Hôm nay, bạn có kế hoạch gì?"
                  : view === "history"
                    ? "Lịch sử báo cáo"
                    : "Đội ngũ MARIXA"}
                <span className="heading-dot">.</span>
              </h1>
              <p>
                {view === "editor"
                  ? "Một vài phút ghi lại mục tiêu. Cả ngày làm việc rõ ràng hơn."
                  : view === "history"
                    ? "Xem lại công việc, cập nhật kết quả và chia sẻ báo cáo."
                    : "Quản lý thông tin và tài khoản đăng nhập của nhân viên."}
              </p>
            </div>
            {view !== "employees" && (
              <button
                className="button secondary new-report"
                disabled={busy}
                onClick={createNew}
              >
                <Plus size={18} />
                Báo cáo mới
              </button>
            )}
          </div>
          {view === "editor" && (
            <>
              <div className="daily-status">
                <div>
                  <span className="status-icon morning">
                    <Sun size={20} />
                  </span>
                  <div>
                    <small>BÁO CÁO ĐẦU NGÀY</small>
                    <strong>
                      {morning ? "Đã hoàn thành" : "Sẵn sàng khởi đầu"}
                    </strong>
                  </div>
                  <span className={`status-pill ${morning ? "done" : ""}`}>
                    {morning ? (
                      <>
                        <Check size={13} />
                        Đã lưu
                      </>
                    ) : (
                      "Chưa lưu"
                    )}
                  </span>
                </div>
                <div>
                  <span className="status-icon evening">
                    <Moon size={20} />
                  </span>
                  <div>
                    <small>BÁO CÁO CUỐI NGÀY</small>
                    <strong>
                      {evening ? "Đã hoàn thành" : "Nhìn lại thành quả"}
                    </strong>
                  </div>
                  <span className={`status-pill ${evening ? "done" : ""}`}>
                    {evening ? (
                      <>
                        <Check size={13} />
                        Đã lưu
                      </>
                    ) : (
                      "Chưa lưu"
                    )}
                  </span>
                </div>
                <div className="daily-total">
                  <span className="status-icon total">
                    <FileText size={20} />
                  </span>
                  <div>
                    <small>BÁO CÁO HÔM NAY</small>
                    <strong>
                      {todayReports.length}
                      <em>/ 2 báo cáo</em>
                    </strong>
                  </div>
                </div>
              </div>
              <div className="editor-label">
                <h2>
                  {report.type === "morning"
                    ? "Lên kế hoạch cho ngày mới"
                    : "Ghi lại kết quả hôm nay"}
                </h2>
                <span className="draft-label">
                  <span />
                  {dirty
                    ? "Có thay đổi chưa lưu"
                    : editing
                      ? "Báo cáo đã lưu"
                      : "Báo cáo mới"}
                </span>
              </div>
            </>
          )}
          {loadError && (
            <div className="error" role="alert">
              {loadError}{" "}
              <button className="text-button" onClick={refresh}>
                Thử lại
              </button>
            </div>
          )}
          {view === "editor" && (
            <ReportEditor
              value={report}
              onChange={(r) => {
                setReport(r);
                setDirty(true);
              }}
              editing={!!editing}
              onSave={save}
              busy={busy}
              notice={notice}
              onContinueEvening={() => continueEvening()}
              onReturnMorning={() => {
                if (report.type === "evening") {
                  const morning = reports.find(
                    (r) => r.id === report.morning_report_id,
                  );
                  if (morning) edit(morning);
                }
              }}
            />
          )}
          {view === "history" && (
            <History
              reports={visibleReports}
              profile={profile}
              onContinue={continueEvening}
              onEdit={edit}
              onDelete={remove}
              notice={notice}
              onRefresh={refresh}
              loading={loading}
            />
          )}
          {view === "employees" && profile.role === "admin" && (
            <Employees
              employees={employees}
              onRefresh={refresh}
              demo={demo}
              onDemoChange={(ps) => {
                setEmployees(ps);
                persistDemo(reports, ps);
              }}
              notice={notice}
            />
          )}
          <footer className="app-footer">
            <span>MARIXA REPORT</span>
            <span>Rõ mục tiêu. Vững kết quả.</span>
          </footer>
        </main>
      </div>
      <nav className="mobile-bottom-nav" aria-label="Điều hướng chính">
        {nav.map((n) => (
          <button
            aria-current={view === n.id ? "page" : undefined}
            key={n.id}
            className={view === n.id ? "active" : ""}
            onClick={() => setView(n.id)}
          >
            <n.icon size={21} />
            <span>{n.id === "history" ? "Báo cáo" : n.label}</span>
          </button>
        ))}
      </nav>
      {message && (
        <div className="toast" role="status">
          <span>{message}</span>
          <button
            className="icon-button"
            aria-label="Đóng thông báo"
            onClick={() => setMessage("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
