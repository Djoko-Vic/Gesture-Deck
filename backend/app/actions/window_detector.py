import subprocess
import shutil
import platform
import time
import re
from typing import Tuple, Dict, List, Any, Optional


class WindowDetector:
    """
    Detects the currently focused window or active media source on the system (cross-platform best effort).
    Determines active profile: 'youtube', 'spotify', or 'generic'.
    """

    def __init__(self, enabled: bool = False):
        self.os_type = platform.system().lower()
        self.has_xprop = shutil.which("xprop") is not None
        self.has_gdbus = shutil.which("gdbus") is not None
        self.is_enabled: bool = enabled
        self._cached_title: str = "Media Inspection Standby (Switch Off)"
        self._cached_profile: str = "generic"
        self._last_check_time: float = 0.0
        self._cache_ttl: float = 0.5  # Cache for 500ms to minimize CPU load

    def get_active_window_info(self) -> Tuple[str, str]:
        """
        Returns (window_title, profile_name)
        profile_name is one of: 'youtube', 'spotify', 'generic'
        """
        if not self.is_enabled:
            return "Media Inspection Standby (Switch Off)", "generic"

        now = time.time()
        if (now - self._last_check_time) < self._cache_ttl:
            return self._cached_title, self._cached_profile

        title = "Generic Media"
        profile = "generic"

        try:
            if "linux" in self.os_type:
                title = self._get_linux_active_window()
            elif "darwin" in self.os_type:
                title = self._get_macos_active_window()
            elif "windows" in self.os_type:
                title = self._get_windows_active_window()
        except Exception:
            pass

        title_lower = title.lower()

        if "youtube" in title_lower:
            profile = "youtube"
        elif "spotify" in title_lower:
            profile = "spotify"
        else:
            profile = "generic"

        self._cached_title = title
        self._cached_profile = profile
        self._last_check_time = now

        return title, profile

    def get_available_targets(self) -> List[Dict[str, Any]]:
        """
        Returns a list of media targets available for user selection.
        Includes AUTO, active detected MPRIS players with titles, and presets.
        """
        targets: List[Dict[str, Any]] = [
            {
                "id": "auto",
                "label": "Auto Detect",
                "title": "Follow focused window & active playback",
                "type": "auto",
                "status": "active" if self.is_enabled else "standby",
                "app": "system",
            }
        ]

        if self.is_enabled and "linux" in self.os_type and self.has_gdbus:
            try:
                res_dbus = subprocess.run(
                    [
                        "gdbus", "call", "--session", "--dest", "org.freedesktop.DBus",
                        "--object-path", "/org/freedesktop/DBus", "--method", "org.freedesktop.DBus.ListNames"
                    ],
                    capture_output=True,
                    text=True,
                    timeout=0.3,
                )
                if res_dbus.returncode == 0:
                    mpris_names = re.findall(r"org\.mpris\.MediaPlayer2\.[a-zA-Z0-9_\.]+", res_dbus.stdout)
                    for name in mpris_names:
                        title = ""
                        artist = ""
                        status = "Unknown"
                        
                        # Metadata query
                        try:
                            meta = subprocess.run(
                                [
                                    "gdbus", "call", "--session", "--dest", name,
                                    "--object-path", "/org/mpris/MediaPlayer2", "--method",
                                    "org.freedesktop.DBus.Properties.Get", "org.mpris.MediaPlayer2.Player", "Metadata"
                                ],
                                capture_output=True,
                                text=True,
                                timeout=0.2,
                            )
                            if meta.returncode == 0:
                                t_match = re.search(r"'xesam:title':\s*<'(.*?)'>", meta.stdout)
                                if t_match:
                                    title = t_match.group(1)
                                a_match = re.search(r"'xesam:artist':\s*<\[\s*'(.*?)'", meta.stdout)
                                if a_match:
                                    artist = a_match.group(1)
                        except Exception:
                            pass

                        # Status query
                        try:
                            st = subprocess.run(
                                [
                                    "gdbus", "call", "--session", "--dest", name,
                                    "--object-path", "/org/mpris/MediaPlayer2", "--method",
                                    "org.freedesktop.DBus.Properties.Get", "org.mpris.MediaPlayer2.Player", "PlaybackStatus"
                                ],
                                capture_output=True,
                                text=True,
                                timeout=0.2,
                            )
                            if st.returncode == 0:
                                s_match = re.search(r"<'([a-zA-Z]+)'>", st.stdout)
                                if s_match:
                                    status = s_match.group(1)
                        except Exception:
                            pass

                        player_clean = name.replace("org.mpris.MediaPlayer2.", "").split(".")[0].capitalize()
                        targets.append({
                            "id": f"mpris:{name}",
                            "label": player_clean,
                            "title": title or f"{player_clean} Media Session",
                            "artist": artist,
                            "status": status,
                            "type": "mpris",
                            "app": player_clean.lower(),
                            "bus": name,
                        })
            except Exception:
                pass

        # Standard Fallback Profiles
        targets.extend([
            {
                "id": "youtube",
                "label": "YouTube",
                "title": "Browser Shortcuts (K, J, L, Space, Up/Down)",
                "type": "profile",
                "status": "ready",
                "app": "youtube",
            },
            {
                "id": "spotify",
                "label": "Spotify",
                "title": "Local Spotify Client & Media Keys",
                "type": "profile",
                "status": "ready",
                "app": "spotify",
            },
            {
                "id": "generic",
                "label": "System Media",
                "title": "OS Global Media Keys",
                "type": "profile",
                "status": "ready",
                "app": "generic",
            },
        ])

        return targets

    def control_mpris_player(self, bus_name: str, action: str, params: Optional[Dict[str, Any]] = None) -> Tuple[bool, str]:
        """
        Executes media control command directly on MPRIS bus destination.
        """
        params = params or {}
        if not self.has_gdbus:
            return False, "gdbus not available"

        method_map = {
            "play_pause": "PlayPause",
            "next": "Next",
            "previous": "Previous",
        }

        try:
            if action in method_map:
                method = method_map[action]
                cmd = [
                    "gdbus", "call", "--session", "--dest", bus_name,
                    "--object-path", "/org/mpris/MediaPlayer2", "--method",
                    f"org.mpris.MediaPlayer2.Player.{method}"
                ]
                res = subprocess.run(cmd, capture_output=True, text=True, timeout=0.5)
                return res.returncode == 0, res.stdout or res.stderr
            elif action in ("seek_forward", "seek_backward", "seek_delta"):
                delta = params.get("delta_seconds", 10.0 if action == "seek_forward" else -10.0)
                microseconds = int(delta * 1_000_000)
                cmd = [
                    "gdbus", "call", "--session", "--dest", bus_name,
                    "--object-path", "/org/mpris/MediaPlayer2", "--method",
                    "org.mpris.MediaPlayer2.Player.Seek", str(microseconds)
                ]
                res = subprocess.run(cmd, capture_output=True, text=True, timeout=0.5)
                return res.returncode == 0, res.stdout or res.stderr
            elif action in ("volume_up", "volume_down"):
                lower_bus = bus_name.lower()
                if any(b in lower_bus for b in ("brave", "chromium", "chrome", "edge")):
                    return False, "Chromium browser MPRIS does not support volume write"

                delta = 0.06 if action == "volume_up" else -0.06
                vol_cmd = [
                    "gdbus", "call", "--session", "--dest", bus_name,
                    "--object-path", "/org/mpris/MediaPlayer2", "--method",
                    "org.freedesktop.DBus.Properties.Get", "org.mpris.MediaPlayer2.Player", "Volume"
                ]
                res_vol = subprocess.run(vol_cmd, capture_output=True, text=True, timeout=0.3)
                curr_vol = 0.8
                if res_vol.returncode == 0:
                    match = re.search(r"<([0-9\.]+)>", res_vol.stdout)
                    if match:
                        try:
                            curr_vol = float(match.group(1))
                        except Exception:
                            pass
                new_vol = round(max(0.0, min(1.0, curr_vol + delta)), 2)
                set_cmd = [
                    "gdbus", "call", "--session", "--dest", bus_name,
                    "--object-path", "/org/mpris/MediaPlayer2", "--method",
                    "org.freedesktop.DBus.Properties.Set", "org.mpris.MediaPlayer2.Player",
                    "Volume", f"<{new_vol}>"
                ]
                res = subprocess.run(set_cmd, capture_output=True, text=True, timeout=0.3)
                return res.returncode == 0, res.stdout or res.stderr
        except Exception as e:
            return False, str(e)

        return False, f"Unsupported action for MPRIS: {action}"

    def get_active_mpris_bus(self) -> Optional[str]:
        """Returns the primary active MPRIS bus (prioritizing Playing status)."""
        if not self.has_gdbus or "linux" not in self.os_type:
            return None
        try:
            res_dbus = subprocess.run(
                [
                    "gdbus", "call", "--session", "--dest", "org.freedesktop.DBus",
                    "--object-path", "/org/freedesktop/DBus", "--method", "org.freedesktop.DBus.ListNames"
                ],
                capture_output=True,
                text=True,
                timeout=0.25,
            )
            if res_dbus.returncode == 0:
                mpris_names = re.findall(r"org\.mpris\.MediaPlayer2\.[a-zA-Z0-9_\.]+", res_dbus.stdout)
                for name in mpris_names:
                    try:
                        st = subprocess.run(
                            [
                                "gdbus", "call", "--session", "--dest", name,
                                "--object-path", "/org/mpris/MediaPlayer2", "--method",
                                "org.freedesktop.DBus.Properties.Get", "org.mpris.MediaPlayer2.Player", "PlaybackStatus"
                            ],
                            capture_output=True,
                            text=True,
                            timeout=0.15,
                        )
                        if "Playing" in st.stdout:
                            return name
                    except Exception:
                        pass
                return mpris_names[0] if mpris_names else None
        except Exception:
            pass
        return None

    def _get_linux_active_window(self) -> str:
        # Step 1: Try X11 / XWayland via xprop if available
        if self.has_xprop:
            try:
                res = subprocess.run(
                    ["xprop", "-root", "_NET_ACTIVE_WINDOW"],
                    capture_output=True,
                    text=True,
                    timeout=0.2,
                )
                if res.returncode == 0:
                    lines = res.stdout.strip().split()
                    if len(lines) >= 5:
                        win_id = lines[-1]
                        res_name = subprocess.run(
                            ["xprop", "-id", win_id, "_NET_WM_NAME", "WM_NAME", "WM_CLASS"],
                            capture_output=True,
                            text=True,
                            timeout=0.2,
                        )
                        if res_name.returncode == 0:
                            for line in res_name.stdout.splitlines():
                                if ' = "' in line:
                                    val = line.split(' = "', 1)[1].rstrip('"')
                                    if val and val not in ("Linux Window", "Linux Desktop"):
                                        return val
            except Exception:
                pass

        # Step 2: On Wayland or when xprop lacks window title, query MPRIS via D-Bus (gdbus).
        # Browsers (Brave, Chrome, Firefox) and media apps (Spotify, VLC) publish the active title over MPRIS.
        if self.has_gdbus:
            try:
                res_dbus = subprocess.run(
                    [
                        "gdbus", "call", "--session", "--dest", "org.freedesktop.DBus",
                        "--object-path", "/org/freedesktop/DBus", "--method", "org.freedesktop.DBus.ListNames"
                    ],
                    capture_output=True,
                    text=True,
                    timeout=0.25,
                )
                if res_dbus.returncode == 0:
                    mpris_names = re.findall(r"org\.mpris\.MediaPlayer2\.[a-zA-Z0-9_\.]+", res_dbus.stdout)
                    for name in mpris_names:
                        meta = subprocess.run(
                            [
                                "gdbus", "call", "--session", "--dest", name,
                                "--object-path", "/org/mpris/MediaPlayer2", "--method",
                                "org.freedesktop.DBus.Properties.Get", "org.mpris.MediaPlayer2.Player", "Metadata"
                            ],
                            capture_output=True,
                            text=True,
                            timeout=0.2,
                        )
                        if meta.returncode == 0:
                            match = re.search(r"'xesam:title':\s*<'(.*?)'>", meta.stdout)
                            if match and match.group(1):
                                player_clean = name.replace("org.mpris.MediaPlayer2.", "").split(".")[0].capitalize()
                                return f"{player_clean} - {match.group(1)}"
            except Exception:
                pass

        return "Linux Desktop"

    def _get_macos_active_window(self) -> str:
        cmd = "osascript -e 'tell application \"System Events\" to get name of first process whose frontmost is true'"
        res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=0.3)
        return res.stdout.strip() if res.returncode == 0 else "macOS Window"

    def _get_windows_active_window(self) -> str:
        return "Windows Application"

