import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { employeeSchema } from "@/lib/model";
import { usernameEmail } from "@/lib/usernames.mjs";
import { z } from "zod";

export const runtime = "nodejs";
function reply(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
async function authorize(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    secret =
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) throw new Error("CONFIG");
  const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new Error("AUTH");
  const db = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error,
  } = await db.auth.getUser(token);
  if (error || !user) throw new Error("AUTH");
  const { data: profile } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") throw new Error("FORBIDDEN");
  return db;
}
function failure(e: unknown) {
  const message = e instanceof Error ? e.message : "";
  if (message === "AUTH")
    return reply(
      { error: "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại." },
      401,
    );
  if (message === "FORBIDDEN")
    return reply({ error: "Bạn không có quyền quản lý nhân viên." }, 403);
  if (message === "CONFIG")
    return reply({ error: "Chưa cấu hình dịch vụ quản lý nhân viên." }, 503);
  return reply({ error: "Không thể xử lý yêu cầu. Vui lòng thử lại." }, 500);
}
export async function GET(req: NextRequest) {
  try {
    const db = await authorize(req);
    const usernames = new Map<string, string>();
    for (let page = 1; ; page++) {
      const { data, error } = await db.auth.admin.listUsers({
        page,
        perPage: 500,
      });
      if (error) throw error;
      for (const user of data.users) {
        const username = user.app_metadata.username;
        if (typeof username === "string") usernames.set(user.id, username);
      }
      if (data.users.length < 500) break;
    }
    const profiles = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await db
        .from("profiles")
        .select("id,full_name,department,role")
        .order("full_name")
        .order("id")
        .range(offset, offset + 499);
      if (error) throw error;
      profiles.push(
        ...data.map((p) => ({ ...p, username: usernames.get(p.id) || "" })),
      );
      if (data.length < 500) break;
    }
    // Never return Auth records, emails, tokens or metadata beyond the username.
    return reply({ employees: profiles });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: NextRequest) {
  try {
    const db = await authorize(req);
    const parsed = employeeSchema.safeParse(await req.json());
    if (!parsed.success)
      return reply({ error: parsed.error.issues[0].message }, 400);
    const { full_name, username, department, password } = parsed.data;
    const { data, error } = await db.auth.admin.createUser({
      email: usernameEmail(username),
      password,
      email_confirm: true,
      app_metadata: { full_name, username, department, role: "employee" },
    });
    if (error)
      return reply(
        {
          error:
            error.code === "email_exists"
              ? "Tên đăng nhập đã được dùng. Bấm Gợi ý lại hoặc chọn tên khác."
              : "Không tạo được nhân viên. Kiểm tra tên đăng nhập trùng và chính sách mật khẩu.",
        },
        400,
      );
    return reply({ id: data.user.id }, 201);
  } catch (e) {
    return failure(e);
  }
}
export async function PATCH(req: NextRequest) {
  try {
    const db = await authorize(req);
    const schema = employeeSchema.extend({
      id: z.uuid(),
      password: z.union([z.literal(""), employeeSchema.shape.password]),
    });
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success)
      return reply({ error: parsed.error.issues[0].message }, 400);
    const { id, full_name, username, department, password } = parsed.data;
    const { data: existing } = await db
      .from("profiles")
      .select("role")
      .eq("id", id)
      .single();
    if (existing?.role !== "employee")
      return reply({ error: "Không tìm thấy nhân viên." }, 404);
    const {
      data: { user: target },
      error: targetError,
    } = await db.auth.admin.getUserById(id);
    if (targetError || !target)
      return reply({ error: "Không tìm thấy nhân viên." }, 404);
    const { error } = await db.auth.admin.updateUserById(id, {
      email: usernameEmail(username),
      email_confirm: true,
      ...(password ? { password } : {}),
      app_metadata: {
        ...target.app_metadata,
        full_name,
        username,
        department,
        role: "employee",
      },
    });
    if (error)
      return reply(
        {
          error:
            "Không cập nhật được. Kiểm tra tên đăng nhập trùng và mật khẩu.",
        },
        400,
      );
    return reply({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(req: NextRequest) {
  try {
    const db = await authorize(req);
    const parsed = z.object({ id: z.uuid() }).safeParse(await req.json());
    if (!parsed.success)
      return reply({ error: "Mã nhân viên không hợp lệ." }, 400);
    const { data: existing } = await db
      .from("profiles")
      .select("role")
      .eq("id", parsed.data.id)
      .single();
    if (existing?.role !== "employee")
      return reply({ error: "Không tìm thấy nhân viên." }, 404);
    const { error } = await db.auth.admin.deleteUser(parsed.data.id);
    if (error)
      return reply(
        { error: "Không thể xóa nhân viên. Vui lòng thử lại." },
        400,
      );
    return reply({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
