# Backup options for Android and iPhone

## Planned settings
- Google Drive: optional account connection and automatic inventory backup using the user's own Google account. Existing integration currently backs up inventory JSON only; IndexedDB PDFs are **not** yet included.
- Apple Files / iCloud Drive: manual export of a complete portable backup containing tool inventory and offline PDF manuals, followed by manual restore. No Google account required. Browser file export and iOS share-sheet compatibility require device testing.
- Device only: no cloud connection; warn users that uninstalling or clearing site data may delete inventory and PDF manuals.

## Release blockers
1. Implement complete portable export and restore of inventory plus IndexedDB PDFs, with missing-file and quota handling.
2. Verify on actual iPhone Safari installed PWA that users can save the export to Files > iCloud Drive and later restore it.
3. Extend optional Google Drive backup to include PDFs or clearly disclose that only inventory is backed up.
4. Never imply automatic iCloud backup exists; it is a future enhancement.
5. Test each user's Drive authorization independently before sharing the app.
6. Do not merge development PR until backup/restore and Android/iOS install testing pass.

The production app remains unchanged.
