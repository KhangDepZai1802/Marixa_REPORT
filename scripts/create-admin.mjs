import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { createInterface } from "node:readline/promises";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key)
  throw new Error(
    "Điền Supabase URL và service role key vào .env.local trước.",
  );
const rl = createInterface({ input: process.stdin, output: process.stdout });
const name = (await rl.question("Họ tên admin: ")).trim();
rl.close();
if (name.length < 2 || name.length > 100)
  throw new Error("Tên cần 2–100 ký tự.");
async function hiddenPassword() {
  if (!process.stdin.isTTY)
    throw new Error("Chạy trong terminal tương tác để nhập mật khẩu ẩn.");
  process.stdout.write("Mật khẩu admin (ít nhất 10 ký tự, nhập ẩn): ");
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  return new Promise((resolve, reject) => {
    let value = "";
    const onData = (chunk) => {
      for (const c of chunk) {
        if (c === "\u0003") {
          cleanup();
          reject(new Error("Đã hủy."));
          return;
        }
        if (c === "\r" || c === "\n") {
          cleanup();
          resolve(value);
          return;
        }
        if (c === "\u007f" || c === "\b") value = value.slice(0, -1);
        else if (c >= " ") value += c;
      }
    };
    function cleanup() {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
    }
    process.stdin.on("data", onData);
  });
}
const password = await hiddenPassword();
if (password.length < 10 || password.length > 128)
  throw new Error("Mật khẩu cần 10–128 ký tự.");
const normalized = name
  .normalize("NFC")
  .toLocaleLowerCase("vi")
  .replace(/\s+/g, " ");
const email =
  createHash("sha256")
    .update(JSON.stringify(["admin", "", normalized]))
    .digest("hex") + "@login.marixa.invalid";
const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { error } = await db.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  app_metadata: { role: "admin", full_name: name, department: "Ban giám đốc" },
});
if (error) throw new Error("Không tạo được admin: " + error.message);
console.log("Đã tạo admin. Đăng nhập bằng họ tên vừa nhập.");
