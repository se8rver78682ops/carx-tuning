package app.bible.cosmos;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Build;
import android.net.Uri;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import android.util.Base64;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.core.content.FileProvider;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Обёртка «Библейского космоса» для Android: показывает веб-приложение из assets,
 * даёт ему синтезатор речи Android (в WebView нет speechSynthesis), выбор файлов и кнопку «Назад».
 */
public class MainActivity extends Activity {
    private static final int FILE_REQUEST = 42;
    private static final String START_URL = "https://appassets.androidplatform.net/assets/index.html";

    private WebView web;
    private TextToSpeech tts;
    private boolean ttsReady = false;
    private ValueCallback<Uri[]> fileCallback;
    /** Идёт чтение главы: тогда при сворачивании программы речь не останавливается. */
    private volatile boolean reading = false;
    private boolean askedNotify = false;
    private static WeakReference<MainActivity> current = new WeakReference<>(null);

    /** Кнопка «Остановить» в уведомлении. */
    static void stopReadingFromNotification() {
        MainActivity a = current.get();
        if (a == null) return;
        a.runOnUiThread(() -> {
            a.reading = false;
            if (a.tts != null) a.tts.stop();
            a.web.evaluateJavascript("window.__ttsStopped && window.__ttsStopped()", null);
        });
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        current = new WeakReference<>(this);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);

        // Файлы приложения отдаются по https-адресу, чтобы работали fetch, модули и IndexedDB.
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        web.setWebViewClient(new WebViewClientCompat() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);
                try {
                    startActivityForResult(intent, FILE_REQUEST);
                } catch (Exception e) {
                    fileCallback = null;
                    return false;
                }
                return true;
            }
        });

        tts = new TextToSpeech(this, status -> {
            ttsReady = status == TextToSpeech.SUCCESS;
            if (ttsReady) {
                tts.setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build());
            }
        });
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override public void onStart(String id) { notifyStart(id); }
            @Override public void onDone(String id) { notifyDone(id); }
            @Override public void onError(String id) { notifyDone(id); }
        });
        web.addJavascriptInterface(new TtsBridge(), "AndroidTTS");
        web.addJavascriptInterface(new ShareBridge(), "AndroidShare");

        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl(START_URL);
        hideSystemBars();
    }

    private void notifyDone(String id) {
        if (id == null || id.startsWith("part-") || id.startsWith("gap-")) return;
        final String js = "window.__ttsDone && window.__ttsDone('" + id.replace("'", "") + "')";
        web.post(() -> web.evaluateJavascript(js, null));
    }

    private void notifyStart(String id) {
        if (id == null || !id.startsWith("v")) return;
        final String js = "window.__ttsStart && window.__ttsStart('" + id.replace("'", "") + "')";
        web.post(() -> web.evaluateJavascript(js, null));
    }

    private boolean online() {
        try {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            @SuppressWarnings("deprecation") NetworkInfo ni = cm.getActiveNetworkInfo();
            return ni != null && ni.isConnected();
        } catch (Exception e) {
            return false;
        }
    }

    private static boolean installed(Voice v) {
        Set<String> f = v.getFeatures();
        return f == null || !f.contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED);
    }

    /** Голоса синтезатора для языка, лучшие первыми. */
    private List<Voice> voicesFor(Locale locale) {
        List<Voice> out = new ArrayList<>();
        try {
            Set<Voice> all = tts.getVoices();
            if (all == null) return out;
            for (Voice v : all) {
                if (v.getLocale() != null && v.getLocale().getLanguage().equals(locale.getLanguage()) && installed(v)) out.add(v);
            }
        } catch (Exception ignored) {
            return out;
        }
        final boolean net = online();
        out.sort((a, b) -> Integer.compare(score(b, net, locale), score(a, net, locale)));
        return out;
    }

    private static int score(Voice v, boolean net, Locale locale) {
        int s = v.getQuality();
        if (v.isNetworkConnectionRequired()) s += net ? 60 : -1000;
        if (locale.getCountry().equals(v.getLocale().getCountry())) s += 20;
        s -= v.getLatency() / 10;
        return s;
    }

    /** Язык и голос: выбранный в настройках или самый качественный. */
    private void prepareVoice(String lang, String wanted) {
        Locale locale = Locale.forLanguageTag(lang == null ? "ru-RU" : lang);
        int ok = tts.setLanguage(locale);
        if (ok == TextToSpeech.LANG_MISSING_DATA || ok == TextToSpeech.LANG_NOT_SUPPORTED) {
            web.post(() -> web.evaluateJavascript("window.__ttsNoVoice && window.__ttsNoVoice()", null));
        }
        List<Voice> list = voicesFor(locale);
        Voice pick = null;
        if (wanted != null && !wanted.isEmpty()) for (Voice v : list) if (v.getName().equals(wanted)) pick = v;
        if (pick == null && !list.isEmpty()) pick = list.get(0);
        if (pick != null) {
            try { tts.setVoice(pick); } catch (Exception ignored) { }
        }
    }

    /** Текст делится на части, которые синтезатор принимает за один раз. */
    private void enqueue(String text, String id) {
        int max = Math.max(200, TextToSpeech.getMaxSpeechInputLength() - 50);
        String rest = text == null ? "" : text;
        int part = 0;
        boolean first = true;
        while (rest.length() > max) {
            int cut = rest.lastIndexOf(' ', max);
            if (cut < max / 2) cut = max;
            tts.speak(rest.substring(0, cut), TextToSpeech.QUEUE_ADD, null, first ? id : "part-" + (part++));
            first = false;
            rest = rest.substring(cut);
        }
        tts.speak(rest, TextToSpeech.QUEUE_ADD, null, first ? id : "part-" + (part++));
    }

    /** Мост для app.js: window.AndroidTTS.speak(text, 'ru-RU', id) и window.AndroidTTS.stop(). */
    private class TtsBridge {
        private float rate = 0.95f;
        private float pitch = 1f;
        private String voice = "";

        @JavascriptInterface
        public void setRate(float r) {
            rate = Math.max(0.5f, Math.min(2f, r));
        }

        @JavascriptInterface
        public void setPitch(float p) {
            pitch = Math.max(0.5f, Math.min(2f, p));
        }

        @JavascriptInterface
        public void setVoice(String name) {
            voice = name == null ? "" : name;
        }

        /** Список голосов для языка: [{name, label, net, best}]. */
        @JavascriptInterface
        public String voices(String lang) {
            JSONArray arr = new JSONArray();
            if (!ttsReady) return arr.toString();
            try {
                Locale locale = Locale.forLanguageTag(lang == null ? "ru-RU" : lang);
                List<Voice> list = voicesFor(locale);
                int n = 0;
                for (Voice v : list) {
                    JSONObject o = new JSONObject();
                    o.put("name", v.getName());
                    o.put("label", v.getLocale().getDisplayCountry(locale) + " · " + (++n));
                    o.put("net", v.isNetworkConnectionRequired());
                    o.put("best", v.getQuality() >= Voice.QUALITY_VERY_HIGH);
                    arr.put(o);
                }
            } catch (Exception ignored) {
                // пустой список: остаётся «автоматически»
            }
            return arr.toString();
        }

        @JavascriptInterface
        public void installVoices() {
            runOnUiThread(() -> {
                try {
                    Intent i = new Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA);
                    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(i);
                } catch (Exception e) {
                    try { startActivity(new Intent("com.android.settings.TTS_SETTINGS")); } catch (Exception ignored) { }
                }
            });
        }

        private void begin(String lang) {
            tts.stop();
            prepareVoice(lang, voice);
            tts.setSpeechRate(rate);
            tts.setPitch(pitch);
        }

        @JavascriptInterface
        public void speak(String text, String lang, String id) {
            if (!ttsReady) { notifyDone(id); return; }
            begin(lang);
            enqueue(text, id);
        }

        /**
         * Вся глава сразу: [[id, текст], ...]. Между стихами короткая пауза, в конце сообщается listId.
         * Пока очередь звучит, работает служба «Чтение вслух» — так чтение не прерывается в фоне.
         */
        @JavascriptInterface
        public void speakList(String json, String lang, String listId, String title, String stopLabel) {
            if (!ttsReady) { notifyDone(listId); return; }
            try {
                JSONArray items = new JSONArray(json);
                begin(lang);
                for (int i = 0; i < items.length(); i++) {
                    JSONArray it = items.getJSONArray(i);
                    enqueue(it.getString(1), it.getString(0));
                    tts.playSilentUtterance(i == 0 ? 450 : 280, TextToSpeech.QUEUE_ADD, "gap-" + i);
                }
                tts.playSilentUtterance(10, TextToSpeech.QUEUE_ADD, listId);
                reading = true;
                runOnUiThread(() -> {
                    askNotificationPermission();
                    ReadingService.start(MainActivity.this, title, stopLabel);
                });
            } catch (Exception e) {
                notifyDone(listId);
            }
        }

        @JavascriptInterface
        public void stop() {
            tts.stop();
            if (reading) {
                reading = false;
                runOnUiThread(() -> ReadingService.stop(MainActivity.this));
            }
        }
    }

    /** Android 13+: разрешение на уведомление «Чтение вслух» спрашивается один раз. */
    private void askNotificationPermission() {
        if (askedNotify || Build.VERSION.SDK_INT < 33) return;
        askedNotify = true;
        if (checkSelfPermission("android.permission.POST_NOTIFICATIONS") != android.content.pm.PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[] { "android.permission.POST_NOTIFICATIONS" }, 7);
        }
    }

    /** Мост для app.js: window.AndroidShare.shareImage(dataUrl, text) — системное окно «Поделиться». */
    private class ShareBridge {
        @JavascriptInterface
        public void shareImage(String dataUrl, String text) {
            try {
                String b64 = dataUrl.substring(dataUrl.indexOf(',') + 1);
                byte[] png = Base64.decode(b64, Base64.DEFAULT);
                File dir = new File(getCacheDir(), "share");
                if (!dir.exists() && !dir.mkdirs()) return;
                File file = new File(dir, "verse.png");
                try (FileOutputStream out = new FileOutputStream(file)) { out.write(png); }
                Uri uri = FileProvider.getUriForFile(MainActivity.this, "app.bible.cosmos.files", file);
                Intent send = new Intent(Intent.ACTION_SEND);
                send.setType("image/png");
                send.putExtra(Intent.EXTRA_STREAM, uri);
                send.putExtra(Intent.EXTRA_TEXT, text);
                send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                runOnUiThread(() -> startActivity(Intent.createChooser(send, null)));
            } catch (Exception ignored) {
                // Если поделиться не удалось, ничего не ломаем.
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_REQUEST || fileCallback == null) return;
        Uri[] result = null;
        if (resultCode == RESULT_OK && data != null) {
            if (data.getClipData() != null) {
                int n = data.getClipData().getItemCount();
                result = new Uri[n];
                for (int i = 0; i < n; i++) result[i] = data.getClipData().getItemAt(i).getUri();
            } else if (data.getData() != null) {
                result = new Uri[] { data.getData() };
            }
        }
        fileCallback.onReceiveValue(result);
        fileCallback = null;
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        // Сначала «Назад» внутри программы: глава -> книга -> галактика, закрытие окон.
        web.evaluateJavascript("window.__androidBack ? String(window.__androidBack()) : 'false'", value -> {
            if (!"\"true\"".equals(value)) MainActivity.super.onBackPressed();
        });
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    @SuppressWarnings("deprecation")
    private void hideSystemBars() {
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_FULLSCREEN);
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    protected void onPause() {
        super.onPause();
        // Во время чтения главы речь и страница продолжают работать в фоне.
        if (reading) return;
        if (tts != null) tts.stop();
        web.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
    }

    @Override
    protected void onStop() {
        super.onStop();
        web.evaluateJavascript("window.__appBackground && window.__appBackground(true)", null);
    }

    @Override
    protected void onStart() {
        super.onStart();
        if (web != null) web.evaluateJavascript("window.__appBackground && window.__appBackground(false)", null);
    }

    @Override
    protected void onDestroy() {
        reading = false;
        ReadingService.stop(this);
        if (tts != null) tts.shutdown();
        web.destroy();
        super.onDestroy();
    }
}
