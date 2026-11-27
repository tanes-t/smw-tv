package com.siammetalwork.smwtv;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.net.Uri;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {

    private WebView myWebView;

    private static final String REMOTE_URL = "https://smw-tv.vercel.app/";
    // Offline fallback for devices without a network connection.
    private static final String DEFAULT_URL = "file:///android_asset/index.html";
    private boolean hasLoadedOfflineFallback;

    @Override
    @SuppressLint("SetJavaScriptEnabled")
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Keep screen ON 24/7 for TV display boards
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Set to full screen immersive layout (hide status bar, navigation bar)
        makeFullscreen();

        // Create WebView dynamically with Hardware Acceleration for smooth Android TV rendering
        myWebView = new WebView(this);
        myWebView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        setContentView(myWebView);

        // Configure WebView Settings — optimized for maximum streaming speed & responsiveness
        WebSettings webSettings = myWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setMediaPlaybackRequiresUserGesture(false);
        webSettings.setLoadsImagesAutomatically(true);
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        // ── Performance: Aggressive caching & RAM acceleration ──
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // Force hardware-accelerated compositing for smoother scrolling/animation
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            myWebView.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, false);
        }

        // Cookies
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(myWebView, true);

        // Enable file access for loading local asset index.html
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setAllowFileAccessFromFileURLs(true);
        webSettings.setAllowUniversalAccessFromFileURLs(true);

        // Enable viewport support for responsive grids
        webSettings.setUseWideViewPort(true);
        webSettings.setLoadWithOverviewMode(true);
        myWebView.setInitialScale(0);

        // ── Performance: Disable unused mobile-only overhead ──
        webSettings.setSupportZoom(false);
        webSettings.setBuiltInZoomControls(false);
        webSettings.setDisplayZoomControls(false);
        myWebView.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);
        myWebView.setOverScrollMode(View.OVER_SCROLL_NEVER);

        // Focus configuration for TV Remote (D-pad) compatibility
        myWebView.setFocusable(true);
        myWebView.setFocusableInTouchMode(true);
        myWebView.requestFocus();

        // Set WebViewClient to prevent opening external browser
        myWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (isYouTubeUrl(url)) {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                    return true;
                }
                view.loadUrl(url);
                return true;
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, android.webkit.WebResourceRequest request) {
                if (request.isForMainFrame() && isYouTubeUrl(request.getUrl().toString())) {
                    startActivity(new Intent(Intent.ACTION_VIEW, request.getUrl()));
                    return true;
                }
                return false;
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                makeFullscreen();
            }

            @Override
            public void onReceivedError(
                    WebView view,
                    android.webkit.WebResourceRequest request,
                    android.webkit.WebResourceError error) {
                if (request.isForMainFrame() && !hasLoadedOfflineFallback) {
                    hasLoadedOfflineFallback = true;
                    view.loadUrl(DEFAULT_URL);
                }
            }
        });

        // WebChromeClient for performance monitoring
        myWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int progress) {
                if (progress >= 100) {
                    makeFullscreen();
                }
            }
        });

        // Load production app
        myWebView.loadUrl(REMOTE_URL);
    }

    private boolean isYouTubeUrl(String url) {
        Uri uri = Uri.parse(url);
        String host = uri.getHost();
        return host != null && (host.equals("youtube.com")
                || host.endsWith(".youtube.com")
                || host.equals("youtu.be"));
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (myWebView != null) {
            myWebView.onResume();
            myWebView.resumeTimers();
        }
        makeFullscreen();
    }

    @Override
    protected void onPause() {
        if (myWebView != null) {
            myWebView.onPause();
            myWebView.pauseTimers();
        }
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (myWebView != null) {
            myWebView.stopLoading();
            myWebView.clearHistory();
            myWebView.removeAllViews();
            myWebView.destroy();
            myWebView = null;
        }
        super.onDestroy();
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getAction() == KeyEvent.ACTION_DOWN && myWebView != null) {
            int keyCode = event.getKeyCode();
            if (keyCode == KeyEvent.KEYCODE_BACK) {
                myWebView.evaluateJavascript(
                        "window.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true, cancelable: true}));",
                        null);
                return true;
            } else if (keyCode == KeyEvent.KEYCODE_MENU) {
                myWebView.evaluateJavascript(
                        "window.dispatchEvent(new KeyboardEvent('keydown', {key: 'Menu', bubbles: true, cancelable: true}));",
                        null);
                return true;
            } else if (keyCode == KeyEvent.KEYCODE_CHANNEL_UP) {
                myWebView.evaluateJavascript(
                        "window.dispatchEvent(new KeyboardEvent('keydown', {key: 'ChannelUp', bubbles: true, cancelable: true}));",
                        null);
                return true;
            } else if (keyCode == KeyEvent.KEYCODE_CHANNEL_DOWN) {
                myWebView.evaluateJavascript(
                        "window.dispatchEvent(new KeyboardEvent('keydown', {key: 'ChannelDown', bubbles: true, cancelable: true}));",
                        null);
                return true;
            } else if (keyCode == KeyEvent.KEYCODE_INFO) {
                myWebView.evaluateJavascript(
                        "window.dispatchEvent(new KeyboardEvent('keydown', {key: 'Info', bubbles: true, cancelable: true}));",
                        null);
                return true;
            }
        }
        return super.dispatchKeyEvent(event);
    }

    @Override
    public void onBackPressed() {
        if (myWebView != null) {
            myWebView.evaluateJavascript(
                    "window.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true, cancelable: true}));",
                    null);
        }
    }

    /**
     * Helper to enable Immersive Fullscreen Mode (Kiosk display)
     */
    @SuppressWarnings("deprecation")
    private void makeFullscreen() {
        View decorView = getWindow().getDecorView();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
            android.view.WindowInsetsController controller = decorView.getWindowInsetsController();
            if (controller != null) {
                controller.hide(android.view.WindowInsets.Type.systemBars());
                controller.setSystemBarsBehavior(
                        android.view.WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            int uiOptions = View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN;
            decorView.setSystemUiVisibility(uiOptions);
        }
    }
}
