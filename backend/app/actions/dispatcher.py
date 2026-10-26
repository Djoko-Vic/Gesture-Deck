import time
import webbrowser
from typing import Dict, Any, Optional, List
from pynput.keyboard import Controller, Key
from .window_detector import WindowDetector
from .spotify_client import SpotifyManager


class ActionDispatcher:
    """
    Executes media and system actions across different application contexts:
    - Spotify: Spotify Web API if connected, or media keys
    - YouTube: Browser shortcuts (k/space for play/pause, l/j for seek +/-10s, up/down for vol)
    - Generic: System media keys (Key.media_play_pause, Key.media_volume_up, etc.)
    """

    def __init__(
        self,
        spotify_manager: Optional[SpotifyManager] = None,
        media_detection_enabled: bool = False,
        target_profile_override: str = "auto",
        selected_target_id: str = "auto",
    ):
        self.keyboard = Controller()
        self.window_detector = WindowDetector(enabled=media_detection_enabled)
        self.spotify_manager = spotify_manager or SpotifyManager()
        self.target_profile_override: str = target_profile_override
        self.selected_target_id: str = selected_target_id
        self.last_action_time: float = 0.0
        self.action_history: List[Dict[str, any]] = []
        self.listeners: List[Any] = []

    def add_listener(self, listener) -> None:
        if listener not in self.listeners:
            self.listeners.append(listener)

    def set_spotify_manager(self, manager: SpotifyManager) -> None:
        self.spotify_manager = manager

    def set_media_detection(self, enabled: bool) -> None:
        self.window_detector.is_enabled = enabled

    def set_target_profile(self, profile: str) -> None:
        self.target_profile_override = profile
        if profile in ("auto", "youtube", "spotify", "generic"):
            self.selected_target_id = profile

    def set_selected_target(self, target_id: str) -> None:
        self.selected_target_id = target_id
        if target_id in ("youtube", "spotify", "generic"):
            self.target_profile_override = target_id
        elif target_id == "auto":
            self.target_profile_override = "auto"

    def get_context(self) -> Dict[str, Any]:
        title, detected_profile = self.window_detector.get_active_window_info()
        available_targets = self.window_detector.get_available_targets()

        # Determine effective profile and title based on target selection
        effective_profile = detected_profile
        active_title = title

        if self.selected_target_id.startswith("mpris:"):
            # Match selected MPRIS target
            for t in available_targets:
                if t["id"] == self.selected_target_id:
                    app = t.get("app", "generic")
                    t_title = t.get("title", "")
                    effective_profile = (
                        "youtube" if ("youtube" in t_title.lower() or app == "youtube")
                        else ("spotify" if app == "spotify" else "generic")
                    )
                    active_title = f"{t.get('label', 'Media')} - {t_title}"
                    break
        elif self.selected_target_id in ("youtube", "spotify", "generic"):
            effective_profile = self.selected_target_id
        elif self.target_profile_override != "auto":
            effective_profile = self.target_profile_override

        return {
            "window_title": active_title,
            "profile": effective_profile,
            "detected_profile": detected_profile,
            "target_profile_override": self.target_profile_override,
            "selected_target_id": self.selected_target_id,
            "available_targets": available_targets,
            "media_detection_enabled": self.window_detector.is_enabled,
        }

    def dispatch(self, action_name: str, params: Optional[Dict[str, any]] = None) -> Dict[str, any]:
        """
        Dispatches action based on current target / context profile.
        """
        params = params or {}
        context = self.get_context()
        profile = context["profile"]
        now = time.time()
        self.last_action_time = now

        success = False
        message = f"Dispatched '{action_name}' under '{profile}' profile"

        # Direct MPRIS execution if an MPRIS target is explicitly selected
        if self.selected_target_id.startswith("mpris:"):
            bus_name = self.selected_target_id.replace("mpris:", "")
            lower_bus = bus_name.lower()
            is_chromium = any(b in lower_bus for b in ("brave", "chromium", "chrome", "edge"))
            # Chromium MPRIS does not support writing volume; let _handle_volume execute instead
            if not (is_chromium and action_name in ("volume_up", "volume_down")):
                m_success, m_msg = self.window_detector.control_mpris_player(bus_name, action_name, params)
                if m_success:
                    event = {
                        "action": action_name,
                        "params": params,
                        "success": True,
                        "message": f"Direct MPRIS command '{action_name}' sent to {bus_name}",
                        "profile": profile,
                        "timestamp": now,
                    }
                    self.action_history.append(event)
                    if len(self.action_history) > 50:
                        self.action_history.pop(0)

                    # Notify WebSocket listeners so RemoteControl bridge can react
                    for listener in self.listeners:
                        try:
                            listener(event)
                        except Exception:
                            pass

                    return event

        try:
            if action_name == "play_pause":
                success = self._handle_play_pause(profile)
            elif action_name == "next":
                success = self._handle_next(profile)
            elif action_name == "previous":
                success = self._handle_previous(profile)
            elif action_name == "volume_up":
                success = self._handle_volume(up=True, profile=profile)
            elif action_name == "volume_down":
                success = self._handle_volume(up=False, profile=profile)
            elif action_name == "mute":
                success = self._handle_mute()
            elif action_name in ("seek_forward", "seek_backward", "seek_delta"):
                default_step = getattr(self, "default_seek_seconds", 10.0)
                default_delta = default_step if action_name == "seek_forward" else -default_step
                delta = params.get("delta_seconds", default_delta)
                params["delta_seconds"] = delta
                success = self._handle_seek(delta, profile)
                message = f"Seek {delta:+.1f}s committed under '{profile}'"
            elif action_name == "like_song":
                success = self._handle_like_song()
                message = "Liked song on Spotify" if success else "Could not like song (Spotify API not active)"
            elif action_name == "open_url":
                url = params.get("url", "https://youtube.com")
                webbrowser.open(url)
                success = True
                message = f"Opened URL: {url}"
            elif action_name == "custom_shortcut":
                shortcut = params.get("keys", [])
                success = self._handle_custom_shortcut(shortcut)
                message = f"Executed shortcut: {shortcut}"
            else:
                message = f"Unknown action: {action_name}"
        except Exception as e:
            success = False
            message = f"Error executing {action_name}: {e}"

        event = {
            "action": action_name,
            "params": params,
            "success": success,
            "message": message,
            "profile": profile,
            "timestamp": now,
        }
        self.action_history.append(event)
        if len(self.action_history) > 50:
            self.action_history.pop(0)

        for listener in self.listeners:
            try:
                listener(event)
            except Exception:
                pass

        return event

    def _mpris_call(self, action: str, params: Optional[Dict[str, Any]] = None) -> bool:
        """Helper to invoke MPRIS actions on active media player."""
        try:
            target_bus = None
            if self.selected_target_id.startswith("mpris:"):
                target_bus = self.selected_target_id.replace("mpris:", "")
            else:
                target_bus = self.window_detector.get_active_mpris_bus()

            if target_bus:
                ok, _ = self.window_detector.control_mpris_player(target_bus, action, params or {})
                return ok
        except Exception:
            pass
        return False

    def _handle_play_pause(self, profile: str) -> bool:
        if profile == "spotify" and self.spotify_manager.is_connected():
            if self.spotify_manager.play_pause():
                return True
        self._mpris_call("play_pause")
        if profile == "youtube":
            # Tap 'k' for YouTube
            self.keyboard.tap("k")
            return True
        # Generic system media key
        self.keyboard.tap(Key.media_play_pause)
        return True

    def _handle_next(self, profile: str) -> bool:
        if profile == "spotify" and self.spotify_manager.is_connected():
            if self.spotify_manager.next_track():
                return True

        self._mpris_call("next")

        if profile == "youtube":
            # YouTube next video shortcut: Shift+N
            try:
                self.keyboard.press(Key.shift)
                time.sleep(0.03)
                self.keyboard.tap("n")
                time.sleep(0.03)
                self.keyboard.release(Key.shift)
            except Exception:
                pass
            try:
                self.keyboard.tap("N")
            except Exception:
                pass
            self.keyboard.tap(Key.media_next)
            return True

        self.keyboard.tap(Key.media_next)
        return True

    def _handle_previous(self, profile: str) -> bool:
        if profile == "spotify" and self.spotify_manager.is_connected():
            if self.spotify_manager.previous_track():
                return True

        self._mpris_call("previous")

        if profile == "youtube":
            # On YouTube:
            # 1. Try Shift+P (works if in playlist)
            try:
                self.keyboard.press(Key.shift)
                time.sleep(0.03)
                self.keyboard.tap("p")
                time.sleep(0.03)
                self.keyboard.release(Key.shift)
            except Exception:
                pass
            # 2. For standalone videos, '0' restarts playback from 0:00!
            self.keyboard.tap("0")
            self.keyboard.tap(Key.media_previous)
            return True

        self.keyboard.tap(Key.media_previous)
        return True

    def _handle_volume(self, up: bool, profile: str) -> bool:
        if profile == "spotify" and self.spotify_manager.is_connected():
            delta = 6 if up else -6
            if self.spotify_manager.volume_step(delta):
                return True

        if profile == "youtube":
            # For YouTube: strictly change site/player volume, NEVER system master volume!
            # Up/Down arrows directly step YouTube player volume (5% increments)
            arrow_key = Key.up if up else Key.down
            self.keyboard.tap(arrow_key)
            time.sleep(0.02)
            self.keyboard.tap(arrow_key)
            # Return immediately: never fall through to Key.media_volume_up / Key.media_volume_down
            return True

        # Call MPRIS volume adjustment if available for non-YouTube media targets
        if self._mpris_call("volume_up" if up else "volume_down"):
            return True

        # System volume keys ONLY for generic/desktop profile fallback
        if profile == "generic":
            key = Key.media_volume_up if up else Key.media_volume_down
            self.keyboard.tap(key)
            return True

        return True

    def _handle_mute(self) -> bool:
        try:
            self.keyboard.tap("m")
            self.keyboard.tap(Key.media_volume_mute)
            return True
        except Exception:
            return False

    def _handle_seek(self, delta_seconds: float, profile: str) -> bool:
        if profile == "spotify" and self.spotify_manager.is_connected():
            if self.spotify_manager.seek_delta(delta_seconds):
                return True

        # Direct MPRIS Seek (microseconds) - works even if browser window is unfocused!
        self._mpris_call("seek_delta", {"delta_seconds": delta_seconds})

        if profile == "youtube":
            abs_delta = abs(delta_seconds)
            steps_10s = int(abs_delta // 10)
            remaining_5s = int(round((abs_delta % 10) / 5))

            step_key = "l" if delta_seconds > 0 else "j"
            arrow_key = Key.right if delta_seconds > 0 else Key.left

            # If under 8 seconds, use 5s arrow keys rather than jumping 10s
            if abs_delta < 8:
                arrow_count = max(1, int(round(abs_delta / 5)))
                for _ in range(arrow_count):
                    self.keyboard.tap(arrow_key)
                    time.sleep(0.03)
            else:
                for _ in range(steps_10s):
                    self.keyboard.tap(step_key)
                    time.sleep(0.03)

                if remaining_5s > 0:
                    self.keyboard.tap(arrow_key)

            return True

        # Generic seek via left/right arrow keys
        key = Key.right if delta_seconds > 0 else Key.left
        self.keyboard.tap(key)
        return True

    def _handle_like_song(self) -> bool:
        if self.spotify_manager.is_connected():
            return self.spotify_manager.like_current_song()
        return False

    def _handle_custom_shortcut(self, keys: List[str]) -> bool:
        key_map = {
            "ctrl": Key.ctrl,
            "shift": Key.shift,
            "alt": Key.alt,
            "cmd": Key.cmd,
            "space": Key.space,
            "enter": Key.enter,
            "esc": Key.esc,
            "left": Key.left,
            "right": Key.right,
            "up": Key.up,
            "down": Key.down,
        }
        presses = []
        try:
            for k in keys:
                lower = k.lower()
                target_key = key_map.get(lower, lower)
                self.keyboard.press(target_key)
                presses.append(target_key)
            return True
        finally:
            for pk in reversed(presses):
                try:
                    self.keyboard.release(pk)
                except Exception:
                    pass
