package in.sriamman.app;

import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.common.moduleinstall.ModuleInstall;
import com.google.android.gms.common.moduleinstall.ModuleInstallClient;
import com.google.android.gms.common.moduleinstall.ModuleInstallRequest;
import com.google.android.gms.common.moduleinstall.ModuleInstallStatusUpdate;
import com.google.mlkit.vision.barcode.common.Barcode;
import com.google.mlkit.vision.codescanner.GmsBarcodeScanner;
import com.google.mlkit.vision.codescanner.GmsBarcodeScannerOptions;
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning;

/**
 * Scans product barcodes with Google's ML Kit code scanner. Google Play services shows the camera
 * screen itself, so this app handles no camera frames, focus or camera permission. The scanner is
 * an optional module that an APK installed outside the Play Store must download before first use.
 * Any rejection here makes the web app fall back to its own scanner.
 */
@CapacitorPlugin(name = "NativeBarcode")
public class NativeBarcodePlugin extends Plugin {

    private static final long MODULE_TIMEOUT_MS = 30000;

    @PluginMethod
    public void scan(PluginCall call) {
        GmsBarcodeScannerOptions options = new GmsBarcodeScannerOptions.Builder()
            .setBarcodeFormats(Barcode.FORMAT_EAN_13, Barcode.FORMAT_EAN_8, Barcode.FORMAT_UPC_A, Barcode.FORMAT_UPC_E)
            .enableAutoZoom()
            .build();
        GmsBarcodeScanner scanner = GmsBarcodeScanning.getClient(getActivity(), options);
        ModuleInstallClient installer = ModuleInstall.getClient(getContext());

        installer
            .areModulesAvailable(scanner)
            .addOnSuccessListener(response -> {
                if (response.areModulesAvailable()) startScan(scanner, call);
                else installThenScan(installer, scanner, call);
            })
            .addOnFailureListener(e -> call.reject("Scanner unavailable", "unavailable", e));
    }

    private void installThenScan(ModuleInstallClient installer, GmsBarcodeScanner scanner, PluginCall call) {
        Handler handler = new Handler(Looper.getMainLooper());
        boolean[] settled = { false };
        Runnable timeout = () -> {
            if (settled[0]) return;
            settled[0] = true;
            call.reject("Scanner download timed out", "timeout");
        };

        ModuleInstallRequest request = ModuleInstallRequest.newBuilder()
            .addApi(scanner)
            .setListener(update -> {
                if (settled[0]) return;
                int state = update.getInstallState();
                if (state == ModuleInstallStatusUpdate.InstallState.STATE_COMPLETED) {
                    settled[0] = true;
                    handler.removeCallbacks(timeout);
                    startScan(scanner, call);
                } else if (state == ModuleInstallStatusUpdate.InstallState.STATE_FAILED || state == ModuleInstallStatusUpdate.InstallState.STATE_CANCELED) {
                    settled[0] = true;
                    handler.removeCallbacks(timeout);
                    call.reject("Scanner download failed", "install-failed");
                }
            })
            .build();

        handler.postDelayed(timeout, MODULE_TIMEOUT_MS);
        installer
            .installModules(request)
            .addOnSuccessListener(response -> {
                if (response.areModulesAlreadyInstalled() && !settled[0]) {
                    settled[0] = true;
                    handler.removeCallbacks(timeout);
                    startScan(scanner, call);
                }
            })
            .addOnFailureListener(e -> {
                if (settled[0]) return;
                settled[0] = true;
                handler.removeCallbacks(timeout);
                call.reject("Scanner download failed", "install-failed", e);
            });
    }

    private void startScan(GmsBarcodeScanner scanner, PluginCall call) {
        scanner
            .startScan()
            .addOnSuccessListener(barcode -> {
                JSObject result = new JSObject();
                result.put("code", barcode.getRawValue());
                call.resolve(result);
            })
            .addOnCanceledListener(() -> {
                JSObject result = new JSObject();
                result.put("cancelled", true);
                call.resolve(result);
            })
            .addOnFailureListener(e -> call.reject("Scan failed", "scan-failed", e));
    }
}
