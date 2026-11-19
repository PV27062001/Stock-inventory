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

## Launch splash (1.6+)
- `AppTheme.NoActionBarLaunch` (`res/values/styles.xml`) sets `windowSplashScreenBackground`
  (`#F8F9FA`), the launcher foreground as the icon, and `postSplashScreenTheme`.
- `MainActivity` calls `SplashScreen.installSplashScreen` and keeps it on screen until
  `MainActivity.markPageReady()`: from the web's `SystemBars.ready()` (sent after the first
  screen has painted), or the WebView's `onPageLoaded` (older web code, or the offline error page),
  or 8 s at most.
- The WebView background is set to the page colour saved from the last visit
  (`SystemBarsPlugin.savedPageColor`, SharedPreferences `system_bars`), default `#F8F9FA`, so a
  slow first paint shows the app's light or dark background, not black.

## Local plugins (`android/app/src/main/java/in/sriamman/app/`, registered in `MainActivity`)
- `SystemBarsPlugin`: sets status and navigation bar colours; icon colour follows the colour.
  `setStyle` also takes `pageColor` (saved for the next launch); `ready()` ends the launch splash.
  Older APKs reject `ready()`; the web ignores that.
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
- Bump `versionCode` and `versionName` in `android/app/build.gradle`. Current: **1.6 / build 7**
  (35.7 MB, all four CPU types; launch splash until the first paint). 1.5 / build 6 added the
  built-in scanner.
- Once the APK is shared, set `public/app-version.json` `latestBuild` to the new build so installed
  apps show the update banner. (It is still 2.)
- minSdk 29, compile/target SDK 35.

## Rules
- Web changes never need an APK. Only native code, plugins, permissions, icon or Capacitor config
  do.
- Any new Gradle or npm dependency gets the security scan from the global CLAUDE.md first.
- Native errors must reach the web page as a readable reason.

## Testing
- No phone is connected to this PC and no emulator system image is installed, so native code
  is unproven until it runs on a real phone. 1.6 was built and its signature checked (same key as
  1.5, so it installs as an update) but not run. Ask the user to test and report the on-screen message.

## Open
- The APK could be about 12 MB smaller by including only ARM CPU types (would drop emulator support).
