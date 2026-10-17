# HEC TECH platform direction

Decision recorded October 17, 2026:

- Android users will receive HEC TECH through the Google Play Store.
- iPhone users will continue using the hosted web app/PWA.
- Keep one shared web codebase and the existing Cloudflare product catalog.
- Add Android-specific native capabilities through Capacitor, starting with no-cost, on-device text/barcode recognition.
- Continue developing Pro and web features in the shared codebase while the Android wrapper is prepared.
- The current branch uses the preview app ID `com.hectech.inventory.preview` so a test build is identifiable. Choose and freeze the production Play Store app ID before release.
- The private inventory remains local to each app installation. Google Drive restore can seed the Android test app from a backup, but it is a snapshot unless synchronization is deliberately implemented. Use a separate test backup to avoid replacing the user's primary backup.
- Google Drive OAuth return handling must be tested and made compatible with the Capacitor app before promising backup/restore in the native app.
- The existing web app remains the Apple-user distribution route. Native-only Android recognition is not automatically available to iPhone web users.

## Current foundation

The existing app is a static PWA with `index.html` at the repository root, not a bundled npm application. `scripts/build-mobile.mjs` assembles only the client assets into `www/`, excludes server/workflow/test files, skips the PWA service worker in Capacitor, and suppresses the PWA installation instructions inside the native shell. The Android preview workflow builds a debug APK artifact without publishing it.
