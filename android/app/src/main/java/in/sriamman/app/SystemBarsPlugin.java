package in.sriamman.app;

import android.animation.ArgbEvaluator;
import android.animation.ValueAnimator;
import android.graphics.Color;
import android.os.Build;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.widget.FrameLayout;

import androidx.core.graphics.ColorUtils;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Keeps the phone's own status bar (time, signal) and navigation bar readable on every screen.
 * The bars are solid, coloured to match the page, and the icon colour is always worked out here
 * from the colour actually painted behind them, so light icons can never land on a light bar.
 *
 * Android 15+ no longer colours the bars itself, so strips are drawn over them. They live on the
 * decor view and are sized from the root insets: AppCompat's root layout (fitsSystemWindows)
 * consumes the insets, so nothing inside android.R.id.content ever receives them. The decor
 * background also takes the status colour, so the top still matches if a strip has no height.
 */
@CapacitorPlugin(name = "SystemBars")
public class SystemBarsPlugin extends Plugin {

    private static final long FADE_MS = 180;
    // Below this luminance the bar is dark enough for white icons (the blue and green headers are ~0.2).
    private static final double LIGHT_ICONS_BELOW = 0.4;

    private interface ColorSink {
        void apply(int color);
    }

    private View statusStrip;
    private View navStrip;
    private int statusColor = Color.parseColor("#F8F9FA");
    private int navColor = Color.parseColor("#F8F9FA");
    private ValueAnimator statusAnim;
    private ValueAnimator navAnim;

    private static boolean edgeToEdge() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM;
    }

    @Override
    public void load() {
        if (!edgeToEdge()) return;
        getActivity().runOnUiThread(() -> {
            ViewGroup decor = (ViewGroup) getActivity().getWindow().getDecorView();
            decor.setBackgroundColor(statusColor);
            statusStrip = addStrip(decor, Gravity.TOP, statusColor);
            navStrip = addStrip(decor, Gravity.BOTTOM, navColor);
            decor.addOnLayoutChangeListener((v, l, t, r, b, ol, ot, or, ob) -> v.post(this::sizeStrips));
            decor.post(this::sizeStrips);
        });
    }

    private View addStrip(ViewGroup decor, int gravity, int color) {
        View strip = new View(getContext());
        strip.setBackgroundColor(color);
        strip.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
        decor.addView(strip, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, gravity));
        return strip;
    }

    /** Matches the strips to the same bars Capacitor keeps the WebView clear of. */
    private void sizeStrips() {
        Window window = getActivity().getWindow();
        WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(window.getDecorView());
        if (insets == null) return;
        Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
        boolean changed = setHeight(statusStrip, bars.top);
        changed |= setHeight(navStrip, bars.bottom);
        if (changed) applyIcons(window);
    }

    private static boolean setHeight(View strip, int height) {
        ViewGroup.LayoutParams lp = strip.getLayoutParams();
        if (lp.height == height) return false;
        lp.height = height;
        strip.setLayoutParams(lp);
        return true;
    }

    /** { statusColor: '#RRGGBB', navColor?: '#RRGGBB' } */
    @PluginMethod
    public void setStyle(PluginCall call) {
        final int targetStatus;
        final int targetNav;
        try {
            targetStatus = Color.parseColor(call.getString("statusColor", "#F8F9FA"));
            String nav = call.getString("navColor");
            targetNav = nav == null ? navColor : Color.parseColor(nav);
        } catch (IllegalArgumentException e) {
            call.reject("Invalid colour");
            return;
        }

        getActivity().runOnUiThread(() -> {
            Window window = getActivity().getWindow();
            if (statusAnim != null) statusAnim.cancel();
            statusAnim = fade(statusColor, targetStatus, color -> paintStatus(window, color));
            if (navAnim != null) navAnim.cancel();
            navAnim = fade(navColor, targetNav, color -> paintNav(window, color));
            statusColor = targetStatus;
            navColor = targetNav;
            applyIcons(window);
            call.resolve();
        });
    }

    private static ValueAnimator fade(int from, int to, ColorSink sink) {
        ValueAnimator anim = ValueAnimator.ofObject(new ArgbEvaluator(), from, to);
        anim.setDuration(FADE_MS);
        anim.addUpdateListener(a -> sink.apply((int) a.getAnimatedValue()));
        anim.start();
        return anim;
    }

    @SuppressWarnings("deprecation")
    private void paintStatus(Window window, int color) {
        if (statusStrip == null) {
            window.setStatusBarColor(color);
            return;
        }
        statusStrip.setBackgroundColor(color);
        window.getDecorView().setBackgroundColor(color);
    }

    @SuppressWarnings("deprecation")
    private void paintNav(Window window, int color) {
        if (navStrip == null) window.setNavigationBarColor(color);
        else navStrip.setBackgroundColor(color);
    }

    private void applyIcons(Window window) {
        // Without a nav strip height, the decor background (status colour) is what shows at the bottom.
        boolean navShowsStatusColor = navStrip != null && navStrip.getLayoutParams().height == 0;
        int navPainted = navShowsStatusColor ? statusColor : navColor;
        WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(window, window.getDecorView());
        // "Light bars" in Android terms means dark icons.
        controller.setAppearanceLightStatusBars(!wantsLightIcons(statusColor));
        controller.setAppearanceLightNavigationBars(!wantsLightIcons(navPainted));
    }

    private static boolean wantsLightIcons(int color) {
        return ColorUtils.calculateLuminance(color) < LIGHT_ICONS_BELOW;
    }
}
