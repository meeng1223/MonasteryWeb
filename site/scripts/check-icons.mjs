// Build check: every Material Symbols icon used in src/ must be listed in the
// icon_names= parameter of the icon font link in index.html, because the font
// is subset to those icons (an unlisted icon would show as a blank box/word).
// Runs before `vite build` (see the "prebuild" npm script).

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");
const listed = new Set((html.match(/icon_names=([a-z0-9_,]+)/) || [, ""])[1].split(",").filter(Boolean));

function files(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(jsx?|tsx?)$/.test(f) ? [p] : [];
  });
}

const used = new Map(); // icon -> first file
const add = (name, file) => { if (/^[a-z][a-z0-9_]+$/.test(name) && !used.has(name)) used.set(name, file); };
for (const file of files(join(root, "src"))) {
  const src = readFileSync(file, "utf8");
  // <span className="material-symbols-outlined …">name</span>, incl. {cond ? "a" : "b"}
  for (const m of src.matchAll(/material-symbols-outlined[^>]*>([\s\S]*?)<\//g)) {
    const inner = m[1].trim();
    if (/^[a-z][a-z0-9_]+$/.test(inner)) add(inner, file);
    for (const q of inner.matchAll(/["']([a-z][a-z0-9_]+)["']/g)) add(q[1], file);
  }
  // data-driven icons: { icon: "name" }
  for (const m of src.matchAll(/\bicon:\s*["']([a-z][a-z0-9_]+)["']/g)) add(m[1], file);
}

const missing = [...used].filter(([name]) => !listed.has(name));
if (missing.length) {
  console.error("[check-icons] Icons used but missing from icon_names in index.html:");
  for (const [name, file] of missing) console.error(`  ${name}  (${file.replace(root + "/", "")})`);
  console.error("Add them to icon_names (alphabetical) and build again.");
  process.exit(1);
}
console.log(`[check-icons] ${used.size} icons, all in the font subset.`);

// Tabler icons ("ti ti-name", or { icon: "ti-name" }) come from a self-hosted
// subset font: every one used must have its rule in src/tabler-icons.css.
const tablerCss = readFileSync(join(root, "src/tabler-icons.css"), "utf8");
const tablerHave = new Set([...tablerCss.matchAll(/\.(ti-[a-z0-9-]+):before/g)].map((m) => m[1]));
const tablerUsed = new Map();
for (const file of files(join(root, "src"))) {
  for (const m of readFileSync(file, "utf8").matchAll(/\bti-[a-z0-9]+(?:-[a-z0-9]+)*/g)) {
    if (!tablerUsed.has(m[0])) tablerUsed.set(m[0], file);
  }
}
const tablerMissing = [...tablerUsed].filter(([name]) => !tablerHave.has(name));
if (tablerMissing.length) {
  console.error("[check-icons] Tabler icons used but missing from src/tabler-icons.css (subset font):");
  for (const [name, file] of tablerMissing) console.error(`  ${name}  (${file.replace(root + "/", "")})`);
  console.error("Add them as explained at the top of src/tabler-icons.css and build again.");
  process.exit(1);
}
console.log(`[check-icons] ${tablerUsed.size} Tabler icons, all in the subset font.`);
