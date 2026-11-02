"use client";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Sun,
  Users,
} from "lucide-react";
import Brand from "./brand";
import { departments, loginEmail, Profile, Role } from "@/lib/model";
import { supabase } from "@/lib/supabase";
import {
  isValidUsername,
  normalizeUsername,
  usernameEmail,
} from "@/lib/usernames.mjs";
export default function Login({
  onLogin,
  onDemo,
}: {
  onLogin: (p: Profile) => void;
  onDemo: (role: Role) => void;
}) {
  const [role, setRole] = useState<Role>("employee");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState<string>("IT");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!supabase) return;
    setBusy(true);
    try {
      // Legacy fallback keeps existing accounts usable during the username rollout.
      const username = normalizeUsername(name);
      let result = isValidUsername(username)
        ? await supabase.auth.signInWithPassword({
            email: usernameEmail(username),
            password,
          })
        : null;
      if (!result || result.error?.code === "invalid_credentials") {
        result = await supabase.auth.signInWithPassword({
          email: await loginEmail(name, department, role),
          password,
        });
      }
      const { data, error: err } = result;
      if (err || !data.user)
        throw new Error("Tên đăng nhập, phòng ban hoặc mật khẩu chưa đúng.");
      const { data: p, error: pe } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();
      if (
        pe ||
        !p ||
        p.role !== role ||
        (role === "employee" && p.department !== department)
      ) {
        await supabase.auth.signOut();
        throw new Error("Tài khoản không có quyền truy cập đã chọn.");
      }
      onLogin({ ...p, username: data.user.app_metadata.username });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Không thể đăng nhập. Vui lòng thử lại.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-story">
        <Brand />
        <div className="story-body">
          <span className="eyebrow light">MỖI NGÀY MỘT BƯỚC TIẾN</span>
          <h1>
            Bắt đầu có mục tiêu.
            <br />
            Kết thúc có <em>kết quả.</em>
          </h1>
          <p>
            Một nơi gọn gàng để ghi lại kế hoạch, nhìn lại thành quả và kết nối
            công việc mỗi ngày.
          </p>
          <div className="story-report">
            <div className="story-report-top">
              <span>
                <Sun size={18} /> BÁO CÁO ĐẦU NGÀY
              </span>
              <span className="tiny-dot" />
            </div>
            <h3>Sẵn sàng cho một ngày hiệu quả</h3>
            <div className="story-line">
              <Check size={16} /> Xác định 3 trọng tâm quan trọng nhất
            </div>
            <div className="story-line">
              <Check size={16} /> Theo dõi nhiệm vụ và mục tiêu KPI
            </div>
            <div className="story-line">
              <Check size={16} /> Chia sẻ báo cáo thật rõ ràng
            </div>
            <div className="story-progress">
              <i />
            </div>
            <small>Mục tiêu rõ ràng. Đội ngũ vững vàng.</small>
          </div>
        </div>
        <footer>
          MARIXA <span>Đồng hành trong từng kết quả.</span>
        </footer>
      </section>
      <section className="login-panel">
        <div className="mobile-brand">
          <Brand />
        </div>
        <div className="login-box">
          <span className="eyebrow">MARIXA REPORT</span>
          <h2>Chào mừng trở lại</h2>
          <p>Đăng nhập để bắt đầu báo cáo công việc.</p>
          <div className="role-picker" aria-label="Loại tài khoản">
            <button
              type="button"
              aria-pressed={role === "employee"}
              className={role === "employee" ? "selected" : ""}
              onClick={() => {
                setRole("employee");
                setError("");
              }}
            >
              <Users size={20} />
              Nhân viên
            </button>
            <button
              type="button"
              aria-pressed={role === "admin"}
              className={role === "admin" ? "selected" : ""}
              onClick={() => {
                setRole("admin");
                setError("");
              }}
            >
              <ShieldCheck size={20} />
              Admin
            </button>
          </div>
          <form onSubmit={submit}>
            {role === "employee" && (
              <label>
                Phòng ban
                <select
                  aria-label="Phòng ban"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  {departments.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Tên đăng nhập
              <input
                autoComplete="username"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: anh.nguyen"
                autoCapitalize="none"
                spellCheck={false}
                required
                maxLength={100}
              />
            </label>
            <label>
              Mật khẩu
              <div className="password-wrap">
                <input
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  required
                  maxLength={128}
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button
              disabled={busy || !supabase}
              className="button primary full"
              type="submit"
            >
              {busy ? "Đang đăng nhập…" : "Đăng nhập"}
              <ArrowRight size={18} />
            </button>
          </form>
          {!supabase && (
            <div className="demo-callout">
              <strong>Bản xem thử giao diện</strong>
              <p>
                Chưa kết nối dữ liệu công ty. Có thể thử các chức năng với dữ
                liệu mẫu trên trình duyệt này.
              </p>
              <button
                className="button secondary full"
                onClick={() => onDemo(role)}
              >
                Trải nghiệm với vai trò{" "}
                {role === "admin" ? "admin" : "nhân viên"}
                <ArrowRight size={17} />
              </button>
            </div>
          )}
          <p className="login-help">
            <LockKeyhole size={16} /> Quên mật khẩu? Liên hệ admin để được cấp
            lại.
          </p>
        </div>
        <small className="login-bottom">
          Không gian báo cáo nội bộ của MARIXA
        </small>
      </section>
    </main>
  );
}
