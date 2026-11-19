package in.sriamman.app;

import android.os.Bundle;
import android.os.SystemClock;
import android.webkit.WebView;

import androidx.core.splashscreen.SplashScreen;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {

    // Never hold the splash longer than this, even if the page never reports in (slow network).
    private static final long SPLASH_MAX_MS = 8000;

    private static volatile boolean pageReady = false;

    /** Called when the web page has drawn its first screen (SystemBarsPlugin.ready). */
    static void markPageReady() {
        pageReady = true;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // The splash stays up until the live site has painted, instead of showing the empty
        // WebView, which is black on many phones in both light and dark mode.
        SplashScreen splash = SplashScreen.installSplashScreen(this);
        pageReady = false;
        final long deadline = SystemClock.uptimeMillis() + SPLASH_MAX_MS;
        splash.setKeepOnScreenCondition(() -> !pageReady && SystemClock.uptimeMillis() < deadline);

        // Local plugin: status bar follows the colour at the top of the page (see SystemBarsPlugin).
        registerPlugin(SystemBarsPlugin.class);
        // Local plugin: Google's native barcode scanner (see NativeBarcodePlugin).
        registerPlugin(NativeBarcodePlugin.class);
        super.onCreate(savedInstanceState);

        // Before the first page paints, the WebView shows the page colour from the last visit
        // (light or dark, saved by SystemBarsPlugin), never black.
        WebView webView = getBridge().getWebView();
        webView.setBackgroundColor(SystemBarsPlugin.savedPageColor(this));

        // Pages from older web versions never call ready(): let go once the page has loaded. An
        // offline start loads the error page (native-shell/index.html), which also ends here.
        getBridge().addWebViewListener(new WebViewListener() {
            @Override
            public void onPageLoaded(WebView view) {
                markPageReady();
            }
        });
    }
}
