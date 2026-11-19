package in.sriamman.app;

import android.app.Activity;
import android.content.Intent;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Opens BarcodeScanActivity, which reads barcodes with the ML Kit model bundled in this APK. It
 * resolves with exactly one of code, typed, cancelled or error, so the web app can always show the
 * person what happened.
 */
@CapacitorPlugin(name = "NativeBarcode")
public class NativeBarcodePlugin extends Plugin {

    @PluginMethod
    public void scan(PluginCall call) {
        startActivityForResult(call, new Intent(getContext(), BarcodeScanActivity.class), "onScanResult");
    }

    @ActivityCallback
    private void onScanResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        JSObject response = new JSObject();
        if (result.getResultCode() == Activity.RESULT_OK && data != null && data.hasExtra(BarcodeScanActivity.EXTRA_CODE)) {
            response.put("code", data.getStringExtra(BarcodeScanActivity.EXTRA_CODE));
        } else if (data != null && data.hasExtra(BarcodeScanActivity.EXTRA_ERROR)) {
            response.put("error", data.getStringExtra(BarcodeScanActivity.EXTRA_ERROR));
        } else if (data != null && data.getBooleanExtra(BarcodeScanActivity.EXTRA_TYPED, false)) {
            response.put("typed", true);
        } else {
            response.put("cancelled", true);
        }
        call.resolve(response);
    }
}
