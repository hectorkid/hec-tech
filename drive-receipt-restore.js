window.HECReceiptDriveRestore=async function(item,request){
 const filename=window.HECReceiptBackup.fileName(item);
 const query=new URLSearchParams({
  spaces:'appDataFolder',
  fields:'files(id,name)',
  q:"name = '"+filename+"' and trashed = false"
 });
 const result=await request('https://www.googleapis.com/drive/v3/files?'+query);
 const files=(await result.json()).files||[];
 if(!files.length)throw new Error('No Drive receipt found for '+item.name);
 const response=await request('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(files[0].id)+'?alt=media');
 const receipt=await response.blob();
 if(!receipt.size)throw new Error('Empty Drive receipt found for '+item.name);
 const type=receipt.type||item.receiptMimeType||'application/octet-stream';
 await HECReceiptStore.put(item.id,new Blob([receipt],{type}));
};
