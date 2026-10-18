package fr.keo.kaster;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.support.v4.media.MediaBrowserCompat;
import android.support.v4.media.MediaDescriptionCompat;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.media.MediaBrowserServiceCompat;

import java.util.ArrayList;
import java.util.List;

public class KeoMediaBrowserService extends MediaBrowserServiceCompat {

    private static final String CHANNEL_ID = "keokaster_auto_playback";
    private static final int NOTIFICATION_ID = 2026;
    private static final String MEDIA_ROOT_ID = "keokaster_root";

    public static final String ACTION_SKIP_AD_60 = "fr.keo.kaster.ACTION_SKIP_AD_60";
    public static final String ACTION_REWIND_15 = "fr.keo.kaster.ACTION_REWIND_15";
    public static final String ACTION_FORWARD_30 = "fr.keo.kaster.ACTION_FORWARD_30";

    private MediaSessionCompat mediaSession;
    private MediaPlayer mediaPlayer;
    private PlaybackStateCompat.Builder stateBuilder;
    private String currentMediaTitle = "Keo Kaster";
    private String currentMediaArtist = "Prêt pour la route";

    @Override
    public void onCreate() {
        super.onCreate();

        createNotificationChannel();

        Intent activityIntent = new Intent(this, MainActivity.class);
        PendingIntent sessionActivityPendingIntent = PendingIntent.getActivity(
                this, 0, activityIntent,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0
        );

        mediaSession = new MediaSessionCompat(this, "KeoMediaBrowserService");
        mediaSession.setSessionActivity(sessionActivityPendingIntent);
        setSessionToken(mediaSession.getSessionToken());

        mediaSession.setFlags(
                MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS |
                MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS
        );

        mediaSession.setCallback(new MediaSessionCallback());

        updatePlaybackState(PlaybackStateCompat.STATE_PAUSED, 0);
    }

    private void updatePlaybackState(int state, long positionMs) {
        long actions = PlaybackStateCompat.ACTION_PLAY |
                PlaybackStateCompat.ACTION_PAUSE |
                PlaybackStateCompat.ACTION_PLAY_PAUSE |
                PlaybackStateCompat.ACTION_SKIP_TO_NEXT |
                PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS |
                PlaybackStateCompat.ACTION_FAST_FORWARD |
                PlaybackStateCompat.ACTION_REWIND |
                PlaybackStateCompat.ACTION_SEEK_TO;

        stateBuilder = new PlaybackStateCompat.Builder()
                .setActions(actions)
                .setState(state, positionMs, 1.0f);

        // Boutons personnalisés spécifiques pour Android Auto (Saut de pub XXL, -15s, +30s)
        stateBuilder.addCustomAction(new PlaybackStateCompat.CustomAction.Builder(
                ACTION_SKIP_AD_60,
                "Sauter Pub (+60s)",
                R.drawable.ic_skip_ad
        ).build());

        stateBuilder.addCustomAction(new PlaybackStateCompat.CustomAction.Builder(
                ACTION_REWIND_15,
                "-15s",
                R.drawable.ic_replay_15
        ).build());

        stateBuilder.addCustomAction(new PlaybackStateCompat.CustomAction.Builder(
                ACTION_FORWARD_30,
                "+30s",
                R.drawable.ic_forward_30
        ).build());

        mediaSession.setPlaybackState(stateBuilder.build());
    }

    private void updateMetadata(String title, String artist, long durationMs) {
        currentMediaTitle = title;
        currentMediaArtist = artist;

        MediaMetadataCompat.Builder metaBuilder = new MediaMetadataCompat.Builder()
                .putString(MediaMetadataCompat.METADATA_KEY_TITLE, title)
                .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, artist)
                .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, "Keo Kaster")
                .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, durationMs);

        mediaSession.setMetadata(metaBuilder.build());
    }

    @Nullable
    @Override
    public BrowserRoot onGetRoot(@NonNull String clientPackageName, int clientUid, @Nullable Bundle rootHints) {
        // Autorise Android Auto ("com.google.android.gms.car.media") et tous les contrôleurs
        return new BrowserRoot(MEDIA_ROOT_ID, null);
    }

    @Override
    public void onLoadChildren(@NonNull String parentId, @NonNull Result<List<MediaBrowserCompat.MediaItem>> result) {
        List<MediaBrowserCompat.MediaItem> items = new ArrayList<>();

        if (MEDIA_ROOT_ID.equals(parentId)) {
            // Catégories principales affichées sur l'écran Android Auto
            items.add(createBrowsableItem("cat_recent", "⚡ Nouveautés (48h)", "Derniers épisodes sortis"));
            items.add(createBrowsableItem("cat_commute", "🚗 Trajet Rapide (< 20 min)", "Idéal pour la conduite"));
            items.add(createBrowsableItem("cat_playlists", "📁 Mes Playlists", "Vos sélections audio"));
            items.add(createBrowsableItem("cat_offline", "📶 Épisodes Hors-Ligne", "Disponibles sans réseau"));
            items.add(createBrowsableItem("cat_subs", "📻 Mes Abonnements", "Tous vos podcasts"));
        } else {
            // Épisodes sous chaque catégorie
            if ("cat_recent".equals(parentId)) {
                items.add(createPlayableItem("ep_recent_1", "Nouveauté du jour", "Émission récente • 24 min"));
            } else if ("cat_commute".equals(parentId)) {
                items.add(createPlayableItem("ep_commute_1", "Flash Info Trajet", "Format court • 12 min"));
            } else if ("cat_playlists".equals(parentId)) {
                items.add(createPlayableItem("ep_pl_1", "Ma Sélection Auto", "Playlist • 45 min"));
            } else if ("cat_offline".equals(parentId)) {
                items.add(createPlayableItem("ep_offline_1", "Épisode Hors-Ligne Téléchargé", "Audio local • 38 min"));
            } else {
                items.add(createPlayableItem("ep_sub_1", "Épisode Podcast", "Vos abonnements"));
            }
        }

        result.sendResult(items);
    }

    private MediaBrowserCompat.MediaItem createBrowsableItem(String mediaId, String title, String subtitle) {
        MediaDescriptionCompat desc = new MediaDescriptionCompat.Builder()
                .setMediaId(mediaId)
                .setTitle(title)
                .setSubtitle(subtitle)
                .build();
        return new MediaBrowserCompat.MediaItem(desc, MediaBrowserCompat.MediaItem.FLAG_BROWSABLE);
    }

    private MediaBrowserCompat.MediaItem createPlayableItem(String mediaId, String title, String subtitle) {
        MediaDescriptionCompat desc = new MediaDescriptionCompat.Builder()
                .setMediaId(mediaId)
                .setTitle(title)
                .setSubtitle(subtitle)
                .build();
        return new MediaBrowserCompat.MediaItem(desc, MediaBrowserCompat.MediaItem.FLAG_PLAYABLE);
    }

    private class MediaSessionCallback extends MediaSessionCompat.Callback {
        @Override
        public void onPlay() {
            if (mediaPlayer != null) {
                mediaPlayer.start();
                updatePlaybackState(PlaybackStateCompat.STATE_PLAYING, mediaPlayer.getCurrentPosition());
                startForeground(NOTIFICATION_ID, buildNotification(true));
            } else {
                updatePlaybackState(PlaybackStateCompat.STATE_PLAYING, 0);
            }
        }

        @Override
        public void onPause() {
            if (mediaPlayer != null && mediaPlayer.isPlaying()) {
                mediaPlayer.pause();
                updatePlaybackState(PlaybackStateCompat.STATE_PAUSED, mediaPlayer.getCurrentPosition());
                stopForeground(false);
                NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm != null) nm.notify(NOTIFICATION_ID, buildNotification(false));
            } else {
                updatePlaybackState(PlaybackStateCompat.STATE_PAUSED, 0);
            }
        }

        @Override
        public void onSkipToNext() {
            onCustomAction(ACTION_FORWARD_30, null);
        }

        @Override
        public void onSkipToPrevious() {
            onCustomAction(ACTION_REWIND_15, null);
        }

        @Override
        public void onFastForward() {
            onCustomAction(ACTION_FORWARD_30, null);
        }

        @Override
        public void onRewind() {
            onCustomAction(ACTION_REWIND_15, null);
        }

        @Override
        public void onSeekTo(long pos) {
            if (mediaPlayer != null) {
                mediaPlayer.seekTo((int) pos);
                int state = mediaPlayer.isPlaying() ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED;
                updatePlaybackState(state, pos);
            }
        }

        @Override
        public void onCustomAction(String action, Bundle extras) {
            if (ACTION_SKIP_AD_60.equals(action)) {
                // Saut de pub instantané (+60s)
                if (mediaPlayer != null) {
                    int nextPos = mediaPlayer.getCurrentPosition() + 60000;
                    mediaPlayer.seekTo(nextPos);
                    int state = mediaPlayer.isPlaying() ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED;
                    updatePlaybackState(state, nextPos);
                }
            } else if (ACTION_REWIND_15.equals(action)) {
                if (mediaPlayer != null) {
                    int nextPos = Math.max(0, mediaPlayer.getCurrentPosition() - 15000);
                    mediaPlayer.seekTo(nextPos);
                    int state = mediaPlayer.isPlaying() ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED;
                    updatePlaybackState(state, nextPos);
                }
            } else if (ACTION_FORWARD_30.equals(action)) {
                if (mediaPlayer != null) {
                    int nextPos = mediaPlayer.getCurrentPosition() + 30000;
                    mediaPlayer.seekTo(nextPos);
                    int state = mediaPlayer.isPlaying() ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED;
                    updatePlaybackState(state, nextPos);
                }
            }
        }

        @Override
        public void onPlayFromMediaId(String mediaId, Bundle extras) {
            updateMetadata("Épisode sélectionné", "Keo Kaster Auto", 1800000);
            updatePlaybackState(PlaybackStateCompat.STATE_PLAYING, 0);
            startForeground(NOTIFICATION_ID, buildNotification(true));
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Lecture Audio Keo Kaster",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Contrôles de lecture Android Auto et arrière-plan");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildNotification(boolean isPlaying) {
        Intent openAppIntent = new Intent(this, MainActivity.class);
        PendingIntent contentPendingIntent = PendingIntent.getActivity(
                this, 0, openAppIntent,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(currentMediaTitle)
                .setContentText(currentMediaArtist)
                .setContentIntent(contentPendingIntent)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setStyle(new androidx.media.app.NotificationCompat.MediaStyle()
                        .setMediaSession(mediaSession.getSessionToken())
                        .setShowActionsInCompactView(0, 1, 2)
                        .setShowCancelButton(true)
                );

        return builder.build();
    }

    @Override
    public void onDestroy() {
        if (mediaPlayer != null) {
            mediaPlayer.release();
            mediaPlayer = null;
        }
        if (mediaSession != null) {
            mediaSession.release();
        }
        super.onDestroy();
    }
}
