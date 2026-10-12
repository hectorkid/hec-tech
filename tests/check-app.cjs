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
for (const file of ['manual-storage.js','receipt-storage.js','portable-backup.js','drive-pdf-helpers.js','drive-pdf-upload.js','drive-pdf-restore.js','drive-receipt-helpers.js','drive-receipt-upload.js','drive-receipt-restore.js','install-guide.js','private-item-sync.js','sw.js']) {
  new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});
  assert.ok(html.includes(file) || file==='sw.js', file+' is not loaded');
}
const worker = fs.readFileSync('sw.js','utf8');
for (const file of ['manual-storage.js','receipt-storage.js','portable-backup.js','drive-pdf-helpers.js','drive-pdf-upload.js','drive-pdf-restore.js','drive-receipt-helpers.js','drive-receipt-upload.js','drive-receipt-restore.js','install-guide.js','private-item-sync.js?v=107']) {
  assert.ok(worker.includes(file), file+' is missing from offline cache');
}
assert.match(html,/Back up your inventory, attached PDF manuals, and receipts/);
assert.match(html,/manuals that open from web links stay in your inventory backup and need internet to open/);
assert.match(html,/HECPdfDriveUpload/);
assert.match(html,/HECPdfDriveRestore/);
assert.match(html,/receiptStored/);
assert.match(html,/capture="environment"/);
assert.match(html,/printReceipt/);
assert.match(html,/HECReceiptDriveUpload/);
assert.match(html,/HECReceiptDriveRestore/);
assert.match(html,/HECItemSyncBridge/);
assert.match(fs.readFileSync('private-item-sync.js','utf8'),/Private item sync/);
const oauthWorker = fs.readFileSync('worker/index.js','utf8');
assert.ok(oauthWorker.includes('https://www.googleapis.com/auth/drive.file'));
assert.match(oauthWorker,/include_granted_scopes: 'true'/);
assert.match(oauthWorker,/cachedAccessToken = tokens.access_token/);
assert.doesNotMatch(fs.readFileSync('private-item-sync.js','utf8'),/spaces=drive/);
const hecV3 = fs.readFileSync('hec-v3.js','utf8');
assert.match(hecV3,/data-hec-manual/);
assert.match(hecV3,/panel\.style\.removeProperty\('display'\)/);
assert.match(hecV3,/details\.open=true/);
assert.match(hecV3,/panel\.scrollIntoView/);
assert.doesNotMatch(hecV3,/manual-backup-panel[^;]{0,100}display','none'/);
assert.match(hecV3,/window\.HECExportCompleteBackup\)window\.HECExportCompleteBackup\(\)/);
assert.match(hecV3,/data-hec-restore/);
assert.match(hecV3,/window\.HECRestoreCompleteBackup/);
assert.doesNotMatch(hecV3,/querySelectorAll\('button'\)\]\.find/);
const portable=fs.readFileSync('portable-backup.js','utf8');
assert.match(portable,/window\.HECExportCompleteBackup=exportComplete/);
assert.match(portable,/window\.HECRestoreCompleteBackup=\(\)=>picker\.click\(\)/);
assert.match(portable,/position:fixed;top:12px/);
assert.match(portable,/document\.body\.append\(status\)/);
assert.match(portable,/window\.HECExportCompleteBackup=exportComplete/);
assert.match(portable,/hec-tech-complete-v2/);
assert.match(portable,/HECReceiptStore/);
assert.match(portable,/restoredReceipts/);
console.log('HEC TECH static syntax and integration checks passed');

const sync = require('../private-item-sync.js');
const inventory=[{id:4,name:'Existing',model:'X1',notes:'keep'}];
const manifest={format:sync.FORMAT,updatedAt:'2026-10-12T00:00:00Z',updates:[{id:'cs08-dehumidifier',updatedAt:'2026-10-12T00:00:00Z',item:{name:'CS08 Dehumidifier',model:'CS08',image:'data:image/png;base64,AA==',notes:'Best Buy',manualStored:true}}]};
assert.equal(sync.applyRemoteUpdates(inventory,manifest),true);
assert.equal(inventory.length,2);
assert.equal(inventory[1].id,5);
assert.equal(inventory[1].manualStored,false);
assert.equal(sync.applyRemoteUpdates(inventory,manifest),false);
const patch={format:sync.FORMAT,updates:[{id:'cs08-dehumidifier',updatedAt:'2026-10-13T00:00:00Z',item:{name:'CS08 Dehumidifier',model:'CS08',notes:'',image:'new-image'}}]};
assert.equal(sync.applyRemoteUpdates(inventory,patch),true);
assert.equal(inventory[1].notes,'Best Buy');
assert.equal(inventory[1].image,'new-image');
assert.throws(()=>sync.applyRemoteUpdates(inventory,{format:'wrong',updates:[]}));
