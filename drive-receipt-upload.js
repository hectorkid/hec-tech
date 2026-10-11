window.HECReceiptDriveUpload=async function(item,request){
 const receipt=await window.HECReceiptBackup.localReceipt(item);
 const filename=window.HECReceiptBackup.fileName(item);
 const query=new URLSearchParams({
  spaces:'appDataFolder',
  fields:'files(id,name)',
  q:"name = '"+filename+"' and trashed = false"
 });
 const found=await request('https://www.googleapis.com/drive/v3/files?'+query);
 const files=(await found.json()).files||[];
 const id=files.length?files[0].id:null;
 const boundary='hectechreceipt';
 const mimeType=receipt.type||item.receiptMimeType||'application/octet-stream';
 const body=new Blob([
  '--'+boundary+'\r\nContent-Type: application/json\r\n\r\n',
  JSON.stringify(id?{name:filename}:{name:filename,parents:['appDataFolder'],mimeType}),
  '\r\n--'+boundary+'\r\nContent-Type: '+mimeType+'\r\n\r\n',
  receipt,
  '\r\n--'+boundary+'--'
 ]);
 const endpoint='https://www.googleapis.com/upload/drive/v3/files'+
  (id?'/'+encodeURIComponent(id):'')+'?uploadType=multipart';
 await request(endpoint,{method:id?'PATCH':'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body});
};
