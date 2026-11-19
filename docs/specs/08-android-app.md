# 08 · Android app

> New session: read `docs/SPEC.md`, then this file. Task: …

## Purpose
A Capacitor 7 shell (`in.sriamman.app`, "Sri Amman") that loads the live site and adds what a web
page can't do.

## Shell (`capacitor.config.ts`)
- `server.url` = the live Vercel site; `allowNavigation` = only that host, so other links open in
  their own apps (dialer, WhatsApp).
- The fallback page `native-shell/index.html` shows when the site can't load.
- `adjustMarginsForEdgeToEdge: 'auto'`, no mixed content, WebView debugging off.
- Plugins: Firebase Authentication (native Google sign-in handed to web Firebase), Local
  Notifications, App, and two local plugins.

## Local plugins (`android/app/src/main/java/in/sriamman/app/`, registered in `MainActivity`)
- `SystemBarsPlugin`: sets status and navigation bar colours; icon colour follows the colour.
- `NativeBarcodePlugin` + `BarcodeScanActivity`: the built-in scanner (see 03). Dependencies:
  `com.google.mlkit:barcode-scanning:17.3.0`, `androidx.camera:camera-camera2/lifecycle/view:1.4.2`
  (security-scanned clean on 7 Nov 2026).

## Build
```
JAVA_HOME = E:\Git Repos\tools\jdk-21
ANDROID_HOME = C:\Users\praveen\AppData\Local\Android\Sdk
npx cap sync android
cd android && ./gradlew assembleRelease
copy app/build/outputs/apk/release/app-release.apk → deploy/SriAmman-<version>.apk   (gitignored)
```
- Signing key path comes from `android/keystore.properties` (gitignored). Every APK must use the
  same key, or phones refuse the update.
- Bump `versionCode` and `versionName` in `android/app/build.gradle`. Current: **1.5 / build 6**
  (35.7 MB, all four CPU types).
- Once the APK is shared, set `public/app-version.json` `latestBuild` to the new build so installed
  apps show the update banner. (It is still 2.)
- minSdk 29, compile/target SDK 35.

## Rules
- Web changes never need an APK. Only native code, plugins, permissions, icon or Capacitor config
  do.
- Any new Gradle or npm dependency gets the security scan from the global CLAUDE.md first.
- Native errors must reach the web page as a readable reason.

## Testing
- No phone is connected to this PC, and the emulator image download was blocked, so native code
  is unproven until it runs on a real phone. Ask the user to test and report the on-screen message.

## Open
- The APK could be about 12 MB smaller by including only ARM CPU types (would drop emulator support).
