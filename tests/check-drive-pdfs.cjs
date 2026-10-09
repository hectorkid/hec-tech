const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

async function run() {
  const saved = new Map();
  const remote = new Map();
  let nextId = 1;
  const context = {
    window: {},
    URL,
    HECManualStore: {
      get: async key => saved.get(String(key)),
      put: async (key, value) => { saved.set(String(key), value); }
    },
    Blob, URLSearchParams, encodeURIComponent, Error
  };
  vm.createContext(context);
  for (const file of ['drive-pdf-helpers.js','drive-pdf-upload.js','drive-pdf-restore.js']) {
    vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
  }
  const request = async (url, options) => {
    if (url.includes('/upload/drive/v3/files')) {
      const id = url.match(/\/files\/([^?]+)/)?.[1] || String(nextId++);
      const content = Buffer.from(await options.body.arrayBuffer());
      const start=content.indexOf(Buffer.from('%PDF-'));
      assert.ok(start>=0,'multipart body contains PDF');
      const end=content.indexOf(Buffer.from('\r\n--hectechpdf'),start);
      remote.set(id,{name:'hec-tech-pdf-123.pdf',bytes:content.subarray(start,end)});
      return {json:async()=>({id})};
    }
    if (url.includes('alt=media')) {
      const id = url.match(/\/files\/([^?]+)/)?.[1];
      const file = remote.get(id);
      if (!file) throw Error('No remote PDF');
      return {blob:async()=>new Blob([file.bytes],{type:'application/pdf'})};
    }
    if (url.includes('/drive/v3/files?')) {
      const query = new URL(url).searchParams.get('q');
      const name = query.match(/name = '([^']+)'/)?.[1];
      return {json:async()=>({files:[...remote.entries()].filter(([,f])=>f.name===name).map(([id])=>({id}))})};
    }
    throw Error('Unexpected request '+url);
  };
  const tool={id:123,name:'Sander',manualStored:true};
  const pdf=new Blob(['%PDF-1.4 example'],{type:'application/pdf'});
  saved.set('123',pdf);
  await context.window.HECPdfDriveUpload(tool,request);
  assert.equal(remote.size,1,'one private PDF uploaded');
  await context.window.HECPdfDriveUpload(tool,request);
  assert.equal(remote.size,1,'second backup updates instead of duplicating');
  saved.delete('123');
  await context.window.HECPdfDriveRestore(tool,request);
  assert.ok(saved.has('123'),'PDF restored to local storage');
  assert.equal(await saved.get('123').text(),'%PDF-1.4 example','PDF contents survive upload and restore');
  await assert.rejects(context.window.HECPdfDriveRestore({id:999,name:'Unknown'},request),/No Drive PDF found/);
  console.log('Drive PDF upload and restore mock tests passed');
}
run().catch(e=>{console.error(e);process.exitCode=1});
