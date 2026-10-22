// Next 16's static export writes per-segment RSC payloads as nested folders, e.g.
//   out/contacts/__next.!KGRhc2hib2FyZCk/contacts/__PAGE__.txt
// while the client router requests the dot-joined name:
//   /contacts/__next.!KGRhc2hib2FyZCk.contacts.__PAGE__.txt
// Without an alias those prefetches 404 and client navigation can fall back to a full reload.
// This writes the dot-joined copy next to each nested payload.
import { copyFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const OUT = new URL("../out/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

let count = 0;
for (const file of walk(OUT)) {
  if (!file.endsWith(".txt")) continue;
  const parts = relative(OUT, file).split(sep);
  const i = parts.findIndex((p, idx) => p.startsWith("__next.") && idx < parts.length - 1);
  if (i === -1) continue;
  const dotted = parts.slice(i).join(".");
  const target = join(OUT, ...parts.slice(0, i), dotted);
  if (existsSync(target)) continue;
  copyFileSync(file, target);
  count += 1;
}
console.log(`alias-segment-payloads: wrote ${count} dot-joined segment payload(s)`);
