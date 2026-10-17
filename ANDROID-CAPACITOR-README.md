# Capacitor Android preview

The production web app remains unchanged. This branch adds a reproducible Android preview build.

## Build locally

Requirements: Node.js 22+, Java 21+, Android SDK / Android Studio.

```sh
npm install
npm run android:init
npm run android:sync
cd android
./gradlew assembleDebug
```

The debug APK is created at `android/app/build/outputs/apk/debug/app-debug.apk`. It uses the preview ID `com.hectech.inventory.preview`, so it is separate from the existing browser-installed PWA and is clearly labeled as a test app.

## GitHub preview build

Push to `feat/capacitor-play-store-shell` or run the Android Capacitor Preview workflow manually. It uploads a debug APK artifact for device testing. It does not publish to Google Play.

## Important testing notes

- The wrapper bundles the web assets at build time. Rebuild the Android app after web code changes to test those changes in the wrapper.
- PWA service-worker registration and the web-only install guide are disabled in the native build.
- Native app storage is separate from Chrome/PWA storage. Back up the inventory first; restore a snapshot into the preview app and use a separate test backup.
- Google Drive OAuth currently returns to the hosted web URL. Native OAuth deep-link/return handling is a required follow-up before Drive restore is considered verified in the Android app.
- Android camera/OCR/barcode bridging is not part of this initial shell. It will be added and tested as a native feature after the preview builds successfully.
