import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "www");
const excludedDirectories = new Set([
  ".git", ".github", "android", "ios", "node_modules", "www",
  "cloudflare", "worker", "tests", "scripts", "coverage"
]);
const assetExtensions = new Set([
  ".html", ".js", ".css", ".webmanifest", ".json", ".png", ".jpg",
  ".jpeg", ".webp", ".avif", ".gif", ".svg", ".ico", ".pdf", ".woff",
  ".woff2", ".ttf", ".otf", ".mp4", ".webm", ".mp3", ".m4a"
]);
const excludedFiles = new Set([
  "package.json", "package-lock.json", "capacitor.config.json"
]);

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

async function copyAppFiles(source, destination) {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (excludedDirectories.has(entry.name)) continue;
      const childOut = path.join(destination, entry.name);
      await mkdir(childOut, { recursive: true });
      await copyAppFiles(path.join(source, entry.name), childOut);
      continue;
    }
    if (!entry.isFile() || excludedFiles.has(entry.name)) continue;
    if (!assetExtensions.has(path.extname(entry.name).toLowerCase())) continue;
    await copyFile(path.join(source, entry.name), path.join(destination, entry.name));
  }
}

await copyAppFiles(root, out);

const indexPath = path.join(out, "index.html");
let html = await readFile(indexPath, "utf8");
const registration =
  "if('serviceWorker' in navigator && location.protocol.startsWith('http')){";
const nativeSafeRegistration =
  "if(!(window.Capacitor?.isNativePlatform?.()) && 'serviceWorker' in navigator && location.protocol.startsWith('http')){";
if (!html.includes(registration)) {
  throw new Error("Could not find the expected PWA service-worker registration.");
}
html = html.replace(registration, nativeSafeRegistration);
await writeFile(indexPath, html, "utf8");

const installGuide = path.join(out, "install-guide.js");
try {
  let guide = await readFile(installGuide, "utf8");
  guide = guide.replace(
    "function start(){",
    "function start(){\n    if(window.Capacitor?.isNativePlatform?.())return;"
  );
  await writeFile(installGuide, guide, "utf8");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const copiedIndex = await readFile(indexPath, "utf8");
for (const match of copiedIndex.matchAll(/(?:src|href)=["']\.\/([^"'?#]+)(?:\?[^"']*)?["']/g)) {
  const assetPath = path.join(out, match[1]);
  try {
    await readFile(assetPath);
  } catch {
    throw new Error(`Mobile build is missing a referenced local asset: ${match[1]}`);
  }
}
console.log("Prepared HEC TECH static assets in www/ for Capacitor.");
