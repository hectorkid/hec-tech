const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync('index.html','utf8');
const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
for (const match of scripts) {
  if (/type=["']application\/json/.test(match[1])) continue;
  if (/\bsrc=/.test(match[1])) continue;
  new vm.Script(match[2], {filename:'index.html inline script'});
}
for (const file of ['manual-storage.js','portable-backup.js','drive-pdf-helpers.js','drive-pdf-upload.js','drive-pdf-restore.js','install-guide.js','sw.js']) {
  new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});
  assert.ok(html.includes(file) || file==='sw.js', file+' is not loaded');
}
const worker = fs.readFileSync('sw.js','utf8');
for (const file of ['manual-storage.js','portable-backup.js','drive-pdf-helpers.js','drive-pdf-upload.js','drive-pdf-restore.js','install-guide.js']) {
  assert.ok(worker.includes(file), file+' is missing from offline cache');
}
assert.match(html,/This inventory-only backup references PDF manuals/);
assert.match(html,/HECPdfDriveUpload/);
assert.match(html,/HECPdfDriveRestore/);
console.log('HEC TECH static syntax and integration checks passed');
