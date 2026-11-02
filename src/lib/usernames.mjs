/** @param {string} value */
export function normalizeUsername(value) {
  return value.trim().toLowerCase();
}

export const USERNAME_PATTERN = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;
/** @param {string} value */
export function isValidUsername(value) {
  return (
    value.length >= 3 && value.length <= 40 && USERNAME_PATTERN.test(value)
  );
}
/** @param {string} value */
export function usernameEmail(value) {
  const username = normalizeUsername(value);
  if (!isValidUsername(username)) throw new Error("Invalid username");
  return `${username}@login.marixa.invalid`;
}
/** @param {string} value */
function asciiWords(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}
/** @param {string} department */
export function departmentSuffix(department) {
  const key = asciiWords(department).join("");
  /** @type {Record<string,string>} */
  const codes = {
    it: "it",
    marketing: "mkt",
    kinhdoanh: "sale",
    ketoan: "kt",
    nhansu: "hr",
    bangiamdoc: "bgd",
    khac: "khac",
  };
  return codes[key] || key.slice(0, 8) || "nv";
}
/** Full name → given name + family name. Department suffix only on collision.
 * @param {string} fullName
 * @param {string} department
 * @param {string[]} [taken]
 */
export function suggestUsername(fullName, department, taken = []) {
  const parts = asciiWords(fullName);
  if (!parts.length) return "";
  let base = parts.length > 1 ? `${parts.at(-1)}.${parts[0]}` : parts[0];
  if (!/^[a-z]/.test(base)) base = `nv.${base}`;
  if (base.length < 3) base = `${base}.nv`;
  base = base.slice(0, 28).replace(/[._-]+$/, "");
  const used = new Set(taken.map(normalizeUsername));
  if (!used.has(base)) return base;
  const stem = `${base}.${departmentSuffix(department)}`;
  if (!used.has(stem)) return stem;
  for (let n = 2; ; n++) {
    const suffix = String(n);
    const candidate = stem.slice(0, 40 - suffix.length) + suffix;
    if (!used.has(candidate)) return candidate;
  }
}
