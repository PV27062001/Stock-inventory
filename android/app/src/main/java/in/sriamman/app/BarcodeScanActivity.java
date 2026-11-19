package in.sriamman.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.RectF;
import android.graphics.drawable.GradientDrawable;
import android.media.Image;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Size;
import android.view.Gravity;
import android.view.HapticFeedbackConstants;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.Camera;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.FocusMeteringAction;
import androidx.camera.core.ImageAnalysis;
import androidx.camera.core.ImageProxy;
import androidx.camera.core.Preview;
import androidx.camera.core.ZoomState;
import androidx.camera.core.resolutionselector.ResolutionSelector;
import androidx.camera.core.resolutionselector.ResolutionStrategy;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import com.google.common.util.concurrent.ListenableFuture;
import com.google.mlkit.vision.barcode.BarcodeScanner;
import com.google.mlkit.vision.barcode.BarcodeScannerOptions;
import com.google.mlkit.vision.barcode.BarcodeScanning;
import com.google.mlkit.vision.barcode.common.Barcode;
import com.google.mlkit.vision.common.InputImage;

import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Full-screen barcode camera. The ML Kit model is bundled in the APK, so nothing has to download on
 * the phone first. Starting slightly zoomed in makes people hold the pack further away, where the
 * lens can focus on it.
 */
public class BarcodeScanActivity extends AppCompatActivity {

    static final String EXTRA_CODE = "code";
    static final String EXTRA_ERROR = "error";
    static final String EXTRA_TYPED = "typed";

    private static final long HINT_DELAY_MS = 8000;
    private static final float[] ZOOM_STEPS = { 1.5f, 2.5f, 1f };

    private final ExecutorService analysisExecutor = Executors.newSingleThreadExecutor();
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final ActivityResultLauncher<String> cameraPermission = registerForActivityResult(
        new ActivityResultContracts.RequestPermission(),
        granted -> {
            if (granted) startCamera();
            else finishWithError("Camera permission is off. Allow it in phone settings");
        }
    );

    private BarcodeScanner scanner;
    private PreviewView previewView;
    private TextView statusView;
    private Button torchButton;
    private Button zoomButton;
    private Camera camera;
    private String lastRead;
    private int zoomStep = 0;
    private boolean torchOn = false;
    private volatile boolean finished = false;

    private final Runnable showHint = () -> statusView.setText("Hold the pack further away and keep it steady. Tap the screen to focus, or use the torch.");

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().setStatusBarColor(Color.BLACK);
        getWindow().setNavigationBarColor(Color.BLACK);
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView()).setAppearanceLightStatusBars(false);
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView()).setAppearanceLightNavigationBars(false);

        scanner = BarcodeScanning.getClient(new BarcodeScannerOptions.Builder()
            .setBarcodeFormats(Barcode.FORMAT_EAN_13, Barcode.FORMAT_EAN_8, Barcode.FORMAT_UPC_A, Barcode.FORMAT_UPC_E, Barcode.FORMAT_QR_CODE, Barcode.FORMAT_DATA_MATRIX)
            .build());
        buildScreen();

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) startCamera();
        else cameraPermission.launch(Manifest.permission.CAMERA);
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private Button controlButton(String label) {
        Button button = new Button(this);
        button.setText(label);
        button.setAllCaps(false);
        button.setTextColor(Color.WHITE);
        button.setTextSize(15);
        button.setMinHeight(dp(48));
        GradientDrawable background = new GradientDrawable();
        background.setColor(0x33FFFFFF);
        background.setCornerRadius(dp(12));
        button.setBackground(background);
        return button;
    }

    @SuppressLint("ClickableViewAccessibility")
    private void buildScreen() {
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);

        previewView = new PreviewView(this);
        previewView.setOnTouchListener((view, event) -> {
            if (event.getAction() == MotionEvent.ACTION_UP) {
                focusAt(event.getX(), event.getY());
                view.performClick();
            }
            return true;
        });
        root.addView(previewView, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        root.addView(new GuideBox(this), new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        LinearLayout controls = new LinearLayout(this);
        controls.setOrientation(LinearLayout.VERTICAL);
        controls.setBackgroundColor(0x99000000);

        statusView = new TextView(this);
        statusView.setText("Line up the barcode inside the box");
        statusView.setTextColor(Color.WHITE);
        statusView.setTextSize(15);
        statusView.setGravity(Gravity.CENTER);
        statusView.setPadding(0, 0, 0, dp(12));
        controls.addView(statusView);

        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        torchButton = controlButton("Torch");
        torchButton.setOnClickListener(view -> toggleTorch());
        zoomButton = controlButton("Zoom");
        zoomButton.setOnClickListener(view -> nextZoom());
        Button typeButton = controlButton("Type number");
        typeButton.setOnClickListener(view -> finishTyped());
        Button[] buttons = { torchButton, zoomButton, typeButton };
        for (int i = 0; i < buttons.length; i++) {
            LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1);
            if (i > 0) params.leftMargin = dp(8);
            row.addView(buttons[i], params);
        }
        controls.addView(row);
        root.addView(controls, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.BOTTOM));

        Button closeButton = controlButton("Close");
        closeButton.setPadding(dp(16), 0, dp(16), 0);
        closeButton.setOnClickListener(view -> finish());
        FrameLayout.LayoutParams closeParams = new FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.TOP | Gravity.END);
        closeParams.setMargins(dp(16), dp(16), dp(16), dp(16));
        root.addView(closeButton, closeParams);

        // Android 15 draws behind the system bars, so keep the controls clear of them.
        ViewCompat.setOnApplyWindowInsetsListener(root, (view, windowInsets) -> {
            Insets bars = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
            controls.setPadding(dp(16), dp(16), dp(16), dp(16) + bars.bottom);
            closeParams.topMargin = dp(16) + bars.top;
            closeButton.setLayoutParams(closeParams);
            return windowInsets;
        });
        setContentView(root);
    }

    private void startCamera() {
        ListenableFuture<ProcessCameraProvider> future = ProcessCameraProvider.getInstance(this);
        future.addListener(() -> {
            try {
                bindCamera(future.get());
            } catch (Exception e) {
                finishWithError("The camera could not be opened (" + e.getClass().getSimpleName() + ")");
            }
        }, ContextCompat.getMainExecutor(this));
    }

    private void bindCamera(ProcessCameraProvider provider) {
        Preview preview = new Preview.Builder().build();
        preview.setSurfaceProvider(previewView.getSurfaceProvider());

        // Thin barcode lines need a sharp frame; the default analysis size is too small for them.
        ImageAnalysis analysis = new ImageAnalysis.Builder()
            .setResolutionSelector(new ResolutionSelector.Builder()
                .setResolutionStrategy(new ResolutionStrategy(new Size(1920, 1080), ResolutionStrategy.FALLBACK_RULE_CLOSEST_HIGHER_THEN_LOWER))
                .build())
            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            .build();
        analysis.setAnalyzer(analysisExecutor, this::analyze);

        provider.unbindAll();
        camera = provider.bindToLifecycle(this, CameraSelector.DEFAULT_BACK_CAMERA, preview, analysis);
        torchButton.setVisibility(camera.getCameraInfo().hasFlashUnit() ? View.VISIBLE : View.GONE);
        applyZoom();
        handler.postDelayed(showHint, HINT_DELAY_MS);
    }

    @SuppressLint("UnsafeOptInUsageError")
    private void analyze(@NonNull ImageProxy frame) {
        Image image = frame.getImage();
        if (image == null || finished) {
            frame.close();
            return;
        }
        scanner
            .process(InputImage.fromMediaImage(image, frame.getImageInfo().getRotationDegrees()))
            .addOnSuccessListener(this::onBarcodes)
            .addOnFailureListener(e -> statusView.setText("Scanner problem: " + e.getMessage()))
            .addOnCompleteListener(task -> frame.close());
    }

    private void onBarcodes(List<Barcode> barcodes) {
        if (finished || barcodes.isEmpty()) return;
        String value = barcodes.get(0).getRawValue();
        if (value == null || value.isEmpty()) return;
        // The same value on two frames in a row, so a blurred frame can't enter a wrong product.
        if (value.equals(lastRead)) finishWithCode(value);
        else lastRead = value;
    }

    private void focusAt(float x, float y) {
        if (camera == null) return;
        camera.getCameraControl().startFocusAndMetering(new FocusMeteringAction.Builder(previewView.getMeteringPointFactory().createPoint(x, y)).build());
    }

    private void toggleTorch() {
        if (camera == null) return;
        torchOn = !torchOn;
        camera.getCameraControl().enableTorch(torchOn);
        torchButton.setText(torchOn ? "Torch off" : "Torch");
    }

    private void nextZoom() {
        zoomStep = (zoomStep + 1) % ZOOM_STEPS.length;
        applyZoom();
    }

    private void applyZoom() {
        if (camera == null) return;
        ZoomState state = camera.getCameraInfo().getZoomState().getValue();
        float max = state == null ? 1f : state.getMaxZoomRatio();
        float ratio = Math.min(ZOOM_STEPS[zoomStep], max);
        camera.getCameraControl().setZoomRatio(ratio);
        zoomButton.setText("Zoom " + ratio + "x");
    }

    private void finishWithCode(String code) {
        finished = true;
        previewView.performHapticFeedback(HapticFeedbackConstants.LONG_PRESS);
        setResult(RESULT_OK, new Intent().putExtra(EXTRA_CODE, code));
        finish();
    }

    private void finishWithError(String message) {
        finished = true;
        setResult(RESULT_CANCELED, new Intent().putExtra(EXTRA_ERROR, message));
        finish();
    }

    private void finishTyped() {
        finished = true;
        setResult(RESULT_CANCELED, new Intent().putExtra(EXTRA_TYPED, true));
        finish();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        finished = true;
        handler.removeCallbacks(showHint);
        analysisExecutor.shutdown();
        scanner.close();
    }

    /** Darkens the picture around the box the barcode should sit in. */
    private static class GuideBox extends View {
        private final Paint shade = new Paint();
        private final Paint hole = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint border = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final float density;

        GuideBox(Context context) {
            super(context);
            density = context.getResources().getDisplayMetrics().density;
            setLayerType(LAYER_TYPE_SOFTWARE, null);
            shade.setColor(0x73000000);
            hole.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.CLEAR));
            border.setColor(Color.WHITE);
            border.setStyle(Paint.Style.STROKE);
            border.setStrokeWidth(2 * density);
        }

        @Override
        protected void onDraw(@NonNull Canvas canvas) {
            float width = getWidth() * 0.84f;
            float height = 170 * density;
            float left = (getWidth() - width) / 2;
            float top = (getHeight() - height) / 2;
            RectF box = new RectF(left, top, left + width, top + height);
            float radius = 16 * density;
            canvas.drawRect(0, 0, getWidth(), getHeight(), shade);
            canvas.drawRoundRect(box, radius, radius, hole);
            canvas.drawRoundRect(box, radius, radius, border);
        }
    }
}
