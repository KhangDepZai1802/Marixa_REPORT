import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isValidUsername,
  normalizeUsername,
  suggestUsername,
  usernameEmail,
} from "../src/lib/usernames.mjs";
import { employeeSchema } from "../src/lib/model";

test("suggest given.family names with Vietnamese diacritics and spacing normalized", () => {
  assert.equal(
    suggestUsername("  Nguyễn  Minh Anh ", "Marketing"),
    "anh.nguyen",
  );
  assert.equal(suggestUsername("Lê Minh Khoa", "IT"), "khoa.le");
  assert.equal(suggestUsername("Trần Ngọc Tuyền", "Kế toán"), "tuyen.tran");
  assert.equal(suggestUsername("Lê Minh Khang", "IT"), "khang.le");
  assert.equal(
    suggestUsername("Đặng Đức Đạt".normalize("NFD"), "IT"),
    "dat.dang",
  );
  assert.equal(suggestUsername("", "IT"), "");
});
test("duplicate usernames use department, then a number if same department also collides", () => {
  assert.equal(
    suggestUsername("Nguyễn Minh Anh", "IT", ["anh.nguyen"]),
    "anh.nguyen.it",
  );
  assert.equal(
    suggestUsername("Nguyễn Minh Anh", "Marketing", ["anh.nguyen"]),
    "anh.nguyen.mkt",
  );
  assert.equal(
    suggestUsername("Nguyễn Minh Anh", "IT", ["anh.nguyen", "anh.nguyen.it"]),
    "anh.nguyen.it2",
  );
  assert.equal(
    suggestUsername("Nguyễn Minh Anh", "IT", ["ANH.NGUYEN"]),
    "anh.nguyen.it",
  );
  assert.equal(
    suggestUsername("Trần Thảo", "Kế toán", ["thao.tran"]),
    "thao.tran.kt",
  );
});
test("username identity is independent of full name and department, and validates manual choices", () => {
  assert.equal(usernameEmail("  KHOA.LE  "), usernameEmail("khoa.le"));
  assert.equal(normalizeUsername(" Khang.LE "), "khang.le");
  for (const v of [
    "an",
    "khoa lê",
    "khoa@le",
    "khoa..le",
    "1khoa",
    "khoa.",
    "x".repeat(41),
  ])
    assert.equal(isValidUsername(v), false, v);
  assert.ok(isValidUsername("khoa.le-it_2"));
  const p = employeeSchema.parse({
    full_name: "Lê Minh Khoa",
    username: "  KHOA.LE ",
    department: "IT",
    password: "Qa1234",
  });
  assert.equal(p.username, "khoa.le");
  assert.equal(p.full_name, "Lê Minh Khoa");
  const renamed = employeeSchema.parse({
    ...p,
    full_name: "Lê Minh Khoa Nguyễn",
    department: "Marketing",
  });
  assert.equal(renamed.username, p.username);
});
