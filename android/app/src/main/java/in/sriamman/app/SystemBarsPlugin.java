package in.sriamman.app;

import android.animation.ArgbEvaluator;
import android.animation.ValueAnimator;
import android.graphics.Color;
import android.os.Build;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.widget.FrameLayout;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Colours the status bar to match whatever the web page shows at the top of the screen, the way
 * GPay / Amazon do, and picks light or dark status-bar icons so notifications stay readable.
 *
 * Android 15+ draws edge to edge and Capacitor moves the WebView below the status bar, so the bar
 * area is painted by a strip view laid over it. Older versions colour the real status bar.
 */
@CapacitorPlugin(name = "SystemBars")
public class SystemBarsPlugin extends Plugin {

    private static final long FADE_MS = 180;

    private View statusStrip;
    private int statusColor = Color.parseColor("#F8F9FA");
    private int navColor = Color.parseColor("#F8F9FA");
    private ValueAnimator statusAnim;

    private static boolean edgeToEdge() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM;
    }

    @Override
    public void load() {
        if (!edgeToEdge()) return;
        getActivity().runOnUiThread(() -> {
            ViewGroup content = getActivity().findViewById(android.R.id.content);
            statusStrip = new View(getContext());
            statusStrip.setBackgroundColor(statusColor);
            content.addView(statusStrip, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0));
            // Keep the strip exactly as tall as the status bar (and any notch).
            ViewCompat.setOnApplyWindowInsetsListener(statusStrip, (v, insets) -> {
                Insets bars = insets.getInsets(WindowInsetsCompat.Type.statusBars() | WindowInsetsCompat.Type.displayCutout());
                ViewGroup.LayoutParams lp = v.getLayoutParams();
                if (lp.height != bars.top) {
                    lp.height = bars.top;
                    v.setLayoutParams(lp);
                }
                return insets;
            });
            ViewCompat.requestApplyInsets(statusStrip);
        });
    }

    /** { statusColor: '#RRGGBB', statusLightIcons: boolean, navColor?: '#RRGGBB', navLightIcons?: boolean } */
    @PluginMethod
    public void setStyle(PluginCall call) {
        final int targetStatus;
        final Integer targetNav;
        try {
            targetStatus = Color.parseColor(call.getString("statusColor", "#F8F9FA"));
            String nav = call.getString("navColor");
            targetNav = nav == null ? null : Color.parseColor(nav);
        } catch (IllegalArgumentException e) {
            call.reject("Invalid colour");
            return;
        }
        final boolean statusLightIcons = Boolean.TRUE.equals(call.getBoolean("statusLightIcons", false));
        final Boolean navLightIcons = call.getBoolean("navLightIcons");

        getActivity().runOnUiThread(() -> {
            Window window = getActivity().getWindow();
            WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(window, window.getDecorView());

            if (statusAnim != null) statusAnim.cancel();
            statusAnim = ValueAnimator.ofObject(new ArgbEvaluator(), statusColor, targetStatus);
            statusAnim.setDuration(FADE_MS);
            statusAnim.addUpdateListener(a -> applyStatus(window, (int) a.getAnimatedValue()));
            statusAnim.start();
            statusColor = targetStatus;
            // "Light status bar" in Android terms means dark icons.
            controller.setAppearanceLightStatusBars(!statusLightIcons);

            if (targetNav != null) {
                navColor = targetNav;
                // Edge to edge, the area behind the gesture bar shows the window background.
                window.getDecorView().setBackgroundColor(navColor);
                if (!edgeToEdge()) window.setNavigationBarColor(navColor);
                if (navLightIcons != null) controller.setAppearanceLightNavigationBars(!navLightIcons);
            }
            call.resolve();
        });
    }

    @SuppressWarnings("deprecation")
    private void applyStatus(Window window, int color) {
        if (statusStrip != null) statusStrip.setBackgroundColor(color);
        else window.setStatusBarColor(color);
    }
}
