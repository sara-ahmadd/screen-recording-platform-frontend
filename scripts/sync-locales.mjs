/**
 * Ensures every key in en/*.json exists in ar/*.json (deep merge).
 * Run: node scripts/sync-locales.mjs
 */
import fs from "fs";
import path from "path";

const localesDir = path.resolve("src/i18n/locales");
const enDir = path.join(localesDir, "en");
const arDir = path.join(localesDir, "ar");

function deepMergeMissing(target, source) {
  if (source === null || typeof source !== "object" || Array.isArray(source)) {
    return target ?? source;
  }
  const out = { ...(target && typeof target === "object" ? target : {}) };
  for (const [key, value] of Object.entries(source)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof out[key] === "object" &&
      out[key] &&
      !Array.isArray(out[key])
    ) {
      out[key] = deepMergeMissing(out[key], value);
    } else if (out[key] === undefined) {
      out[key] = value;
    }
  }
  return out;
}

const files = fs.readdirSync(enDir).filter((f) => f.endsWith(".json"));
let added = 0;

for (const file of files) {
  const enPath = path.join(enDir, file);
  const arPath = path.join(arDir, file);
  const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
  const ar = fs.existsSync(arPath) ? JSON.parse(fs.readFileSync(arPath, "utf8")) : {};
  const before = JSON.stringify(ar);
  const merged = deepMergeMissing(ar, en);
  const after = JSON.stringify(merged);
  if (before !== after) {
    fs.writeFileSync(arPath, JSON.stringify(merged, null, 2) + "\n");
    added++;
    console.log(`Updated ar/${file}`);
  }
}

console.log(`Synced ${added} file(s). Review ar/ for keys still in English.`);
