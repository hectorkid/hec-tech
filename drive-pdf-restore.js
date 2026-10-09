window.HECPdfDriveRestore = async function(tool, request) {
  const filename = window.HECPdfBackup.fileName(tool.id);
  const query = new URLSearchParams({
    spaces: 'appDataFolder',
    fields: 'files(id,name)',
    q: "name = '" + filename + "' and trashed = false"
  });
  const result = await request('https://www.googleapis.com/drive/v3/files?' + query);
  const files = (await result.json()).files || [];
  if (!files.length) throw new Error('No Drive PDF found for ' + tool.name);
  const file = await request('https://www.googleapis.com/drive/v3/files/' +
    encodeURIComponent(files[0].id) + '?alt=media');
  const pdf = await file.blob();
  if (!pdf.size) throw new Error('Empty PDF returned for ' + tool.name);
  await HECManualStore.put(tool.id, pdf);
};
