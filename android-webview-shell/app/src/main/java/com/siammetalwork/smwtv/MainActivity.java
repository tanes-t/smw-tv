package com.siammetalwork.smwtv;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.net.Uri;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {

    private WebView myWebView;
    
    // DEFAULT LOCAL PATH (Loads React TV App embedded inside the APK for instant loading)
    private static final String DEFAULT_URL = "file:///android_asset/index.html";

    @Override
    @SuppressLint("SetJavaScriptEnabled")
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Keep screen ON 24/7 for TV display boards
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Set to full screen immersive layout (hide status bar, navigation bar)
        makeFullscreen();

        // Create WebView dynamically
        myWebView = new WebView(this);
        setContentView(myWebView);

        // Configure WebView Settings
        WebSettings webSettings = myWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true); // Crucial for storing API URL in localStorage
        webSettings.setDatabaseEnabled(true);
        webSettings.setMediaPlaybackRequiresUserGesture(false);
        webSettings.setLoadsImagesAutomatically(true);
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(myWebView, true);
        
        // Enable file access for loading local asset index.html
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        
        // Enable viewport support for responsive grids
        webSettings.setUseWideViewPort(true);
        webSettings.setLoadWithOverviewMode(true);
        
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
        });

        // Load the React TV App URL
        myWebView.loadUrl(DEFAULT_URL);
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
        makeFullscreen();
    }

    @Override
    public void onBackPressed() {
        // Prevent accidental exits on back button press (very common with TV remotes)
        if (myWebView.canGoBack()) {
            myWebView.goBack();
        } else {
            // Un-comment to allow exit, or keep disabled for kiosk display boards
            // super.onBackPressed();
        }
    }

    /**
     * Helper to enable Immersive Fullscreen Mode (Kiosk display)
     */
    private void makeFullscreen() {
        View decorView = getWindow().getDecorView();
        int uiOptions = View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                      | View.SYSTEM_UI_FLAG_FULLSCREEN
                      | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                      | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                      | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                      | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN;
        decorView.setSystemUiVisibility(uiOptions);
    }
}
