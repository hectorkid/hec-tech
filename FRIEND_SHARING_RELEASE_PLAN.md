# HEC TECH — Android & iPhone friend-sharing release plan

Goal: Free installable PWA shared by link; each user owns their own local inventory and connects only their own Google Drive. Preserve current production app until tested.

## Current audit (2026-10-09)
- manifest.webmanifest already sets display=standalone, relative scope/start_url and 192/512 icons.
- sw.js already caches the app shell and supports offline navigation.
- index.html registers a service worker and contains Google sign-in/backup code.
- Draft PR #2 currently stores PDF bytes as base64 inside inventory localStorage: DO NOT MERGE as-is (quota/data-loss risk).
- No GitHub Actions PR workflow run was found for the draft commit. Browser/device testing has NOT been performed.

## Required changes before release
- [ ] Replace PDF-in-localStorage with IndexedDB Blob storage keyed by stable tool ID; keep only lightweight metadata in inventory JSON.
- [ ] Save inventory transactionally: never signal successful save or backup if persistence fails. Handle quota errors visibly.
- [ ] Back up PDF manuals as separate files to the authenticated user's own Google Drive; record file IDs per user, not shared public links. Respect Drive API permissions and consent.
- [ ] Restore PDFs and inventory to a fresh device. Verify account separation, sign-out, failed uploads, and partial restore.
- [ ] Check OAuth publishing / verification requirements for friends outside current test users, and ensure least-privilege scopes.
- [ ] Verify offline PDF viewing on Android Chrome and iPhone Safari (including iOS installed PWA).
- [ ] Verify install flow: Android Chrome install prompt/menu; iPhone Safari Share > Add to Home Screen. Link opens site; installation requires user action.
- [ ] Verify icon and app launch on both platforms, including HTTPS hosting and manifest/service-worker scope.
- [ ] Confirm current production inventory survives updates, failed backups, and storage quota failures.
- [ ] Test with two independent Google accounts before sharing widely.

## Rollout
1. Develop on feature branch; leave main unchanged.
2. Run static checks and manual device tests.
3. Test backup/restore on spare/test inventories, not the owner's only copy.
4. Merge after successful checks and explicit approval.
5. Share public HTTPS install link with short Android/iPhone instructions.
