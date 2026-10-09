window.HECPdfDriveUpload = async function(tool, request) {
  const pdf = await window.HECPdfBackup.localPdf(tool.id);
  const filename = window.HECPdfBackup.fileName(tool.id);
  const query = new URLSearchParams({
    spaces: 'appDataFolder',
    fields: 'files(id,name)',
    q: "name = '" + filename + "' and trashed = false"
  });
  const found = await request('https://www.googleapis.com/drive/v3/files?' + query);
  const files = (await found.json()).files || [];
  const id = files.length ? files[0].id : null;
  const boundary = 'hectechpdf';
  const parts = [
    '--' + boundary + '\r\nContent-Type: application/json\r\n\r\n',
    JSON.stringify(id ? {name:filename} : {name:filename,parents:['appDataFolder'],mimeType:'application/pdf'}),
    '\r\n--' + boundary + '\r\nContent-Type: application/pdf\r\n\r\n',
    pdf,
    '\r\n--' + boundary + '--'
  ];
  const endpoint = 'https://www.googleapis.com/upload/drive/v3/files' +
    (id ? '/' + encodeURIComponent(id) : '') + '?uploadType=multipart';
  await request(endpoint, {
    method: id ? 'PATCH' : 'POST',
    headers: {'Content-Type':'multipart/related; boundary=' + boundary},
    body: new Blob(parts)
  });
};
