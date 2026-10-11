/* Receipt backup helpers; receipt bytes stay outside the inventory JSON. */
window.HECReceiptBackup={
 fileName(item){return 'hec-tech-receipt-'+String(item.id)},
 async localReceipt(item){
  const receipt=await HECReceiptStore.get(item.id);
  if(!receipt)throw new Error('The receipt is not available on this device.');
  return receipt;
 }
};
