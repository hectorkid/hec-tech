/* PDF backup helpers. Each request must be authorized by the existing app. */
window.HECPdfBackup = {
  fileName(toolId) {
    return 'hec-tech-pdf-' + String(toolId) + '.pdf';
  },
  async localPdf(toolId) {
    const pdf = await HECManualStore.get(toolId);
    if (!pdf) throw new Error('The PDF is not available on this device.');
    return pdf;
  }
};
