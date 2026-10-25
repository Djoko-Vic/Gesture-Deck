from typing import Optional, Dict, Any
import webbrowser


class SpotifyManager:
    """
    Manages optional Spotify Web API integration via spotipy.
    Gracefully handles missing credentials or offline playback.
    """

    def __init__(self, client_id: Optional[str] = None, client_secret: Optional[str] = None, redirect_uri: Optional[str] = None):
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
        self.sp = None
        self._init_client()

    def _init_client(self) -> None:
        if not self.client_id or not self.client_secret:
            return

        try:
            import spotipy
            from spotipy.oauth2 import SpotifyOAuth

            scope = "user-modify-playback-state user-read-playback-state user-library-modify"
            auth_manager = SpotifyOAuth(
                client_id=self.client_id,
                client_secret=self.client_secret,
                redirect_uri=self.redirect_uri or "http://localhost:8000/api/spotify/callback",
                scope=scope,
                open_browser=False,
            )
            self.sp = spotipy.Spotify(auth_manager=auth_manager)
        except Exception as e:
            print(f"[Spotify] Could not initialize spotipy client: {e}")
            self.sp = None

    def is_connected(self) -> bool:
        return self.sp is not None

    def play_pause(self) -> bool:
        if not self.sp:
            return False
        try:
            playback = self.sp.current_playback()
            if playback and playback.get("is_playing"):
                self.sp.pause_playback()
            else:
                self.sp.start_playback()
            return True
        except Exception as e:
            print(f"[Spotify] play_pause error: {e}")
            return False

    def next_track(self) -> bool:
        if not self.sp:
            return False
        try:
            self.sp.next_track()
            return True
        except Exception as e:
            print(f"[Spotify] next_track error: {e}")
            return False

    def previous_track(self) -> bool:
        if not self.sp:
            return False
        try:
            self.sp.previous_track()
            return True
        except Exception as e:
            print(f"[Spotify] previous_track error: {e}")
            return False

    def volume_step(self, delta: int) -> bool:
        if not self.sp:
            return False
        try:
            playback = self.sp.current_playback()
            if not playback or not playback.get("device"):
                return False
            curr = playback["device"].get("volume_percent", 50)
            target = max(0, min(100, curr + delta))
            self.sp.volume(target)
            return True
        except Exception as e:
            print(f"[Spotify] volume error: {e}")
            return False

    def seek_delta(self, delta_seconds: float) -> bool:
        if not self.sp:
            return False
        try:
            playback = self.sp.current_playback()
            if not playback:
                return False
            progress_ms = playback.get("progress_ms", 0)
            target_ms = max(0, int(progress_ms + delta_seconds * 1000))
            self.sp.seek_track(target_ms)
            return True
        except Exception as e:
            print(f"[Spotify] seek error: {e}")
            return False

    def like_current_song(self) -> bool:
        if not self.sp:
            return False
        try:
            playback = self.sp.current_playback()
            if not playback or not playback.get("item"):
                return False
            track_id = playback["item"]["id"]
            self.sp.current_user_saved_tracks_add(tracks=[track_id])
            return True
        except Exception as e:
            print(f"[Spotify] like error: {e}")
            return False
