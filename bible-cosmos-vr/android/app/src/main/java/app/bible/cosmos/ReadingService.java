package app.bible.cosmos;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

/**
 * Служба «Чтение вслух»: держит программу живой, пока синтезатор читает главу,
 * даже если программа свёрнута или экран выключен. Показывает уведомление с кнопкой «Остановить».
 */
public class ReadingService extends Service {
    static final String ACTION_STOP = "app.bible.cosmos.STOP_READING";
    static final String EXTRA_TITLE = "title";
    static final String EXTRA_STOP = "stop";
    private static final String CHANNEL = "reading";
    private static final int NOTE_ID = 7;

    private PowerManager.WakeLock wakeLock;
    private static ReadingService running;

    static void start(Context ctx, String title, String stopLabel) {
        // Служба уже работает (следующая глава в фоне): только обновить уведомление.
        if (running != null) {
            running.show(title, stopLabel);
            return;
        }
        Intent i = new Intent(ctx, ReadingService.class);
        i.putExtra(EXTRA_TITLE, title);
        i.putExtra(EXTRA_STOP, stopLabel);
        try {
            if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(i);
            else ctx.startService(i);
        } catch (Exception ignored) {
            // Если система не разрешила службу, чтение всё равно идёт, пока программа на экране.
        }
    }

    static void stop(Context ctx) {
        ctx.stopService(new Intent(ctx, ReadingService.class));
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            MainActivity.stopReadingFromNotification();
            stopSelf();
            return START_NOT_STICKY;
        }
        running = this;
        show(intent != null ? intent.getStringExtra(EXTRA_TITLE) : null, intent != null ? intent.getStringExtra(EXTRA_STOP) : null);
        if (wakeLock == null) {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "BibleCosmos:reading");
            wakeLock.setReferenceCounted(false);
        }
        wakeLock.acquire(3L * 60 * 60 * 1000);
        return START_NOT_STICKY;
    }

    private void show(String title, String stopLabel) {
        Notification n = buildNotification(title == null ? "" : title, stopLabel == null ? "Stop" : stopLabel);
        if (Build.VERSION.SDK_INT >= 29) startForeground(NOTE_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        else startForeground(NOTE_ID, n);
    }

    @SuppressWarnings("deprecation")
    private Notification buildNotification(String title, String stopLabel) {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        Notification.Builder b;
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, getString(R.string.reading_channel), NotificationManager.IMPORTANCE_LOW);
            ch.setShowBadge(false);
            nm.createNotificationChannel(ch);
            b = new Notification.Builder(this, CHANNEL);
        } else {
            b = new Notification.Builder(this);
            b.setPriority(Notification.PRIORITY_LOW);
        }
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        Intent open = new Intent(this, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        PendingIntent openPi = PendingIntent.getActivity(this, 0, open, flags);
        Intent stop = new Intent(this, ReadingService.class);
        stop.setAction(ACTION_STOP);
        PendingIntent stopPi = PendingIntent.getService(this, 1, stop, flags);
        b.setSmallIcon(android.R.drawable.ic_lock_silent_mode_off)
                .setContentTitle(title)
                .setContentText(getString(R.string.app_name))
                .setContentIntent(openPi)
                .setOngoing(true)
                .setShowWhen(false)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .addAction(android.R.drawable.ic_media_pause, stopLabel, stopPi);
        return b.build();
    }

    @Override
    public void onDestroy() {
        running = null;
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
