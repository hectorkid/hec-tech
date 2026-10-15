# HEC TECH — optional backups for each user

## Choices
- **Google Drive (optional):** Each person signs in with their own Google account. Inventory JSON, offline PDF manuals, and receipts are backed up to that account's private Drive app-data area. Automatic backup happens only while a valid connection exists. A different person's Drive data is not shared.
- **iCloud Drive / Apple Files (optional, manual):** Export a complete JSON backup containing inventory, stored PDFs, and receipts. On iPhone, use the share sheet's **Save to Files** action and choose **iCloud Drive**. Confirm the file exists in Files. Restore by selecting the JSON file from Files. This is NOT automatic iCloud sync.
- **Device only:** No account or backup is required. Local data can be lost if browser data is cleared or the app is uninstalled.

## Before sharing broadly
- [ ] Verify iPhone Safari and installed Home Screen app can export a complete backup, save to iCloud Drive, and restore it.
- [ ] Verify a different Google account can authorize and back up/restore its own inventory, PDFs, and receipts.
- [ ] Confirm no inventory from the owner's device appears on a new device or account.
- [ ] Test failed upload, insufficient device storage, and interrupted restore; avoid testing with the only copy of real data.
- [ ] Verify OAuth publishing/permissions for outside users.
- [ ] Confirm app install, offline usage, and PDF viewing on an actual iPhone.

Do not deploy this development branch until these checks pass. The production app is unchanged.
