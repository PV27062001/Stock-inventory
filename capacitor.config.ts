import type { CapacitorConfig } from '@capacitor/cli';

// Android shell for the shop app. It always loads the live Vercel site, so every
// deploy shows up on next launch without reinstalling the APK. Only changes to the
// native shell itself (plugins, icon, Android settings) need a new APK.
const LIVE_URL = 'https://amman-samiyana-kadai.vercel.app';

const config: CapacitorConfig = {
  appId: 'in.sriamman.app',
  appName: 'Sri Amman',
  // Shown only if the live site cannot be loaded (see native-shell/index.html).
  webDir: 'native-shell',
  server: {
    url: LIVE_URL,
    // Keep the WebView on our own site; any other link is handed to the matching app
    // (dialer, WhatsApp) by Android instead of opening inside the app.
    allowNavigation: [new URL(LIVE_URL).host],
    errorPath: 'index.html',
  },
  android: {
    appendUserAgent: 'SriAmmanApp',
    // Android 15+ draws apps edge to edge, putting the header under the status bar and the
    // bottom nav under the system navigation buttons. 'auto' keeps the page between the bars.
    adjustMarginsForEdgeToEdge: 'auto',
    // Never allow plain-http content inside the app.
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    FirebaseAuthentication: {
      // Sign in natively, then hand the Google token to the web Firebase SDK.
      skipNativeAuth: true,
      providers: ['google.com'],
    },
  },
};

export default config;
