import pytest
from app.actions.window_detector import WindowDetector
from app.actions.dispatcher import ActionDispatcher


def test_window_detector_disabled_by_default():
    detector = WindowDetector(enabled=False)
    title, profile = detector.get_active_window_info()
    assert "Standby" in title
    assert profile == "generic"


def test_window_detector_profiles(monkeypatch):
    detector = WindowDetector(enabled=True)

    # Test YouTube matching
    monkeypatch.setattr(detector, "_get_linux_active_window", lambda: "Lo-Fi Beats - YouTube - Brave")
    detector._last_check_time = 0.0
    title, profile = detector.get_active_window_info()
    assert profile == "youtube"
    assert "YouTube" in title

    # Test Spotify matching
    monkeypatch.setattr(detector, "_get_linux_active_window", lambda: "Spotify Free")
    detector._last_check_time = 0.0
    title, profile = detector.get_active_window_info()
    assert profile == "spotify"

    # Test Generic fallback (e.g. VLC, SoundCloud, or Desktop)
    monkeypatch.setattr(detector, "_get_linux_active_window", lambda: "VLC media player")
    detector._last_check_time = 0.0
    title, profile = detector.get_active_window_info()
    assert profile == "generic"


def test_dispatcher_target_profile_override(monkeypatch):
    dispatcher = ActionDispatcher(media_detection_enabled=True, target_profile_override="youtube")
    # Even if detected window is Spotify, forced target profile is YouTube
    monkeypatch.setattr(dispatcher.window_detector, "_get_linux_active_window", lambda: "Spotify Free")
    dispatcher.window_detector._last_check_time = 0.0
    ctx = dispatcher.get_context()
    assert ctx["profile"] == "youtube"
    assert ctx["detected_profile"] == "spotify"


def test_window_detector_caching(monkeypatch):
    detector = WindowDetector(enabled=True)
    call_count = 0

    def mock_fetch():
        nonlocal call_count
        call_count += 1
        return "Call Result"

    monkeypatch.setattr(detector, "_get_linux_active_window", mock_fetch)
    detector._last_check_time = 0.0

    # First call triggers fetch
    detector.get_active_window_info()
    assert call_count == 1

    # Immediate second call uses cache (< 0.5s)
    detector.get_active_window_info()
    assert call_count == 1


def test_available_targets_listing():
    detector = WindowDetector(enabled=False)
    targets = detector.get_available_targets()
    ids = [t["id"] for t in targets]
    assert "auto" in ids
    assert "youtube" in ids
    assert "spotify" in ids
    assert "generic" in ids


def test_dispatcher_selected_target_mpris(monkeypatch):
    dispatcher = ActionDispatcher(media_detection_enabled=True)
    dispatcher.set_selected_target("mpris:org.mpris.MediaPlayer2.brave.instance2")
    assert dispatcher.selected_target_id == "mpris:org.mpris.MediaPlayer2.brave.instance2"

    # Mock MPRIS player control
    mpris_called = []
    def mock_control(bus, action, params=None):
        mpris_called.append((bus, action))
        return True, "Success"

    monkeypatch.setattr(dispatcher.window_detector, "control_mpris_player", mock_control)
    res = dispatcher.dispatch("play_pause")
    assert res["success"] is True
    assert len(mpris_called) == 1
    assert mpris_called[0] == ("org.mpris.MediaPlayer2.brave.instance2", "play_pause")


