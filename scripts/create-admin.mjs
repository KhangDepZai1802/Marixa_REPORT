import { createClient } from "@supabase/supabase-js";
import {
  isValidUsername,
  normalizeUsername,
  suggestUsername,
  usernameEmail,
} from "../src/lib/usernames.mjs";
import { createInterface } from "node:readline/promises";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key)
  throw new Error("Điền Supabase URL và secret key vào .env.local trước.");
const rl = createInterface({ input: process.stdin, output: process.stdout });
const name = (await rl.question("Họ tên admin: ")).trim();
if (name.length < 2 || name.length > 100)
  throw new Error("Tên cần 2–100 ký tự.");
const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const taken = [];
for (let page = 1; ; page++) {
  const { data, error } = await db.auth.admin.listUsers({ page, perPage: 500 });
  if (error) {
    rl.close();
    throw new Error("Không đọc được danh sách tài khoản.");
  }
  for (const user of data.users)
    if (typeof user.app_metadata.username === "string")
      taken.push(user.app_metadata.username);
  if (data.users.length < 500) break;
}
const suggested = suggestUsername(name, "IT", taken);
const username = normalizeUsername(
  (await rl.question(`Tên đăng nhập [${suggested}]: `)) || suggested,
);
rl.close();
if (!isValidUsername(username))
  throw new Error(
    "Tên đăng nhập cần 3–40 ký tự, chữ không dấu, số và dấu chấm/gạch nối/gạch dưới.",
  );
if (taken.includes(username)) throw new Error("Tên đăng nhập đã được dùng.");
async function hiddenPassword() {
  if (!process.stdin.isTTY)
    throw new Error("Chạy trong terminal tương tác để nhập mật khẩu ẩn.");
  process.stdout.write("Mật khẩu admin (ít nhất 6 ký tự, nhập ẩn): ");
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
if (password.length < 6 || password.length > 128)
  throw new Error("Mật khẩu cần 6–128 ký tự.");
const email = usernameEmail(username);
const { error } = await db.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  app_metadata: { role: "admin", full_name: name, username, department: "IT" },
});
if (error) throw new Error("Không tạo được admin: " + error.message);
console.log(`Đã tạo admin. Tên đăng nhập: ${username}`);
