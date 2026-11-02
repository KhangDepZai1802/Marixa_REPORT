"use client";
import { useEffect, useRef, useState } from "react";
import {
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { departments, employeeSchema, Profile } from "@/lib/model";
import { supabase } from "@/lib/supabase";

export default function Employees({
  employees,
  onRefresh,
  demo,
  onDemoChange,
  notice,
}: {
  employees: Profile[];
  onRefresh: () => Promise<void>;
  demo: boolean;
  onDemoChange: (p: Profile[]) => void;
  notice: (s: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Profile | null>(null);
  const [opened, setOpened] = useState(false);
  const [name, setName] = useState("");
  const [dept, setDept] = useState<string>("IT");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (opened) dialog.current?.showModal();
    else dialog.current?.close();
  }, [opened]);
  function open(p?: Profile) {
    setEditing(p || null);
    setName(p?.full_name || "");
    setDept(p?.department || "IT");
    setPassword("");
    setError("");
    setOpened(true);
  }
  async function request(method: string, body: unknown) {
    const { data } = await supabase!.auth.getSession();
    const response = await fetch("/api/employees", {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.session?.access_token}`,
      },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Không thể thực hiện.");
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsed = employeeSchema.safeParse({
      full_name: name,
      department: dept,
      password: editing && !password ? "unchanged-password" : password,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      if (demo) {
        if (
          employees.some(
            (p) =>
              p.id !== editing?.id &&
              p.full_name.trim().toLocaleLowerCase("vi") ===
                name.trim().toLocaleLowerCase("vi") &&
              p.department === dept,
          )
        )
          throw new Error("Tên này đã tồn tại trong phòng ban.");
        const p: Profile = {
          id: editing?.id || crypto.randomUUID(),
          full_name: name.trim(),
          department: dept,
          role: "employee",
        };
        onDemoChange(
          editing
            ? employees.map((v) => (v.id === p.id ? p : v))
            : [...employees, p],
        );
      } else {
        await request(editing ? "PATCH" : "POST", {
          ...(editing ? { id: editing.id } : {}),
          full_name: name,
          department: dept,
          password,
        });
        await onRefresh();
      }
      setOpened(false);
      setPassword("");
      notice(editing ? "Đã cập nhật nhân viên." : "Đã thêm nhân viên.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể lưu.");
    } finally {
      setBusy(false);
    }
  }
  async function remove(p: Profile) {
    if (
      !confirm(
        `Xóa tài khoản ${p.full_name}? Người này sẽ không thể đăng nhập. Báo cáo cũ vẫn được giữ để admin xem.`,
      )
    )
      return;
    setBusy(true);
    try {
      if (demo) onDemoChange(employees.filter((v) => v.id !== p.id));
      else {
        await request("DELETE", { id: p.id });
        await onRefresh();
      }
      notice("Đã xóa tài khoản nhân viên.");
    } catch (e) {
      notice(e instanceof Error ? e.message : "Không thể xóa.");
    } finally {
      setBusy(false);
    }
  }
  const filtered = employees.filter(
    (p) =>
      p.role === "employee" &&
      `${p.full_name} ${p.department}`
        .toLocaleLowerCase("vi")
        .includes(search.toLocaleLowerCase("vi")),
  );
  return (
    <>
      <div className="list-toolbar">
        <label className="search-field">
          <Search size={18} />
          <span className="sr-only">Tìm nhân viên</span>
          <input
            placeholder="Tìm tên hoặc phòng ban…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <button className="button primary" onClick={() => open()}>
          <Plus size={18} />
          Thêm nhân viên
        </button>
      </div>
      <div className="access-note">
        <ShieldCheck size={20} />
        <p>
          Nhân viên ở mọi phòng ban có quyền như nhau: tạo, xem, sửa và xóa báo
          cáo của chính mình.
        </p>
      </div>
      <div className="employee-list">
        {filtered.map((p) => (
          <article className="employee-row" key={p.id}>
            <span className="person-avatar">
              {p.full_name.split(" ").pop()?.[0]}
            </span>
            <div>
              <h3>{p.full_name}</h3>
              <p>{p.department}</p>
            </div>
            <span className="tag">Nhân viên</span>
            <div className="row-actions">
              <button
                className="icon-button"
                disabled={busy}
                onClick={() => open(p)}
                aria-label={`Sửa ${p.full_name}`}
              >
                <Pencil size={18} />
              </button>
              <button
                className="icon-button danger"
                disabled={busy}
                onClick={() => remove(p)}
                aria-label={`Xóa ${p.full_name}`}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </article>
        ))}
        {!filtered.length && (
          <div className="empty-state">
            <Users />
            <h3>Chưa có nhân viên phù hợp</h3>
            <p>Thêm nhân viên mới hoặc thử tìm bằng tên khác.</p>
          </div>
        )}
      </div>
      <dialog
        ref={dialog}
        className="employee-dialog"
        onCancel={(e) => {
          if (busy) e.preventDefault();
          else setOpened(false);
        }}
        onClose={() => {
          setOpened(false);
          setPassword("");
        }}
      >
        <form onSubmit={save}>
          <div className="dialog-heading">
            <div>
              <span className="eyebrow">QUẢN LÝ ĐỘI NGŨ</span>
              <h2>{editing ? "Cập nhật nhân viên" : "Thêm nhân viên"}</h2>
            </div>
            <button
              className="icon-button"
              type="button"
              disabled={busy}
              onClick={() => setOpened(false)}
              aria-label="Đóng"
            >
              <X />
            </button>
          </div>
          <label>
            Họ và tên
            <input
              autoFocus
              required
              minLength={2}
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn An"
            />
          </label>
          <label>
            Phòng ban
            <select
              aria-label="Phòng ban"
              value={dept}
              onChange={(e) => setDept(e.target.value)}
            >
              {departments.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label>
            {editing ? "Mật khẩu mới (để trống nếu giữ nguyên)" : "Mật khẩu"}
            <input
              type="password"
              autoComplete="new-password"
              required={!editing}
              minLength={10}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ít nhất 10 ký tự"
            />
          </label>
          <p className="hint">
            Nhân viên đăng nhập bằng đúng họ tên và phòng ban này. Tên trùng
            trong cùng phòng ban cần thêm mã phân biệt.
          </p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <button
              className="button secondary"
              type="button"
              disabled={busy}
              onClick={() => setOpened(false)}
            >
              Hủy
            </button>
            <button className="button primary" type="submit" disabled={busy}>
              {busy ? "Đang lưu…" : "Lưu nhân viên"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
