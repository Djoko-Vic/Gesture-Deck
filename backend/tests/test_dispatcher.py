from unittest.mock import MagicMock, patch
from pynput.keyboard import Key
from app.actions.dispatcher import ActionDispatcher


def test_dispatcher_youtube_volume_does_not_touch_system_keys():
    dispatcher = ActionDispatcher(target_profile_override="youtube")
    dispatcher.keyboard = MagicMock()

    # Trigger volume_up
    event = dispatcher.dispatch("volume_up")
    assert event["success"] is True

    # Up arrow should be tapped for player volume
    dispatcher.keyboard.tap.assert_any_call(Key.up)

    # Master system volume key must NEVER be tapped for YouTube
    for call_args in dispatcher.keyboard.tap.call_args_list:
        assert call_args[0][0] != Key.media_volume_up
        assert call_args[0][0] != Key.media_volume_down


def test_dispatcher_generic_volume_uses_system_keys():
    dispatcher = ActionDispatcher(target_profile_override="generic")
    dispatcher.keyboard = MagicMock()
    dispatcher._mpris_call = MagicMock(return_value=False)

    event = dispatcher.dispatch("volume_up")
    assert event["success"] is True
    dispatcher.keyboard.tap.assert_any_call(Key.media_volume_up)


def test_dispatcher_action_listeners_receive_events():
    dispatcher = ActionDispatcher(target_profile_override="youtube")
    dispatcher.keyboard = MagicMock()

    received_events = []
    dispatcher.add_listener(lambda ev: received_events.append(ev))

    dispatcher.dispatch("play_pause")
    assert len(received_events) == 1
    assert received_events[0]["action"] == "play_pause"
    assert received_events[0]["profile"] == "youtube"


def test_dispatcher_custom_seek_deltas():
    dispatcher = ActionDispatcher(target_profile_override="youtube")
    dispatcher.keyboard = MagicMock()
    dispatcher._mpris_call = MagicMock(return_value=False)
    dispatcher.default_seek_seconds = 15.0

    # Test seek_forward with default 15s step
    ev = dispatcher.dispatch("seek_forward")
    assert ev["success"] is True
    assert ev["params"]["delta_seconds"] == 15.0

    # Test seek_delta with 5s: under 8s, should tap arrow key, not 'l'
    dispatcher.keyboard.reset_mock()
    ev5 = dispatcher.dispatch("seek_delta", {"delta_seconds": 5.0})
    assert ev5["success"] is True
    dispatcher.keyboard.tap.assert_called_with(Key.right)

    # Test seek_delta with 30s: 3 'l' taps
    dispatcher.keyboard.reset_mock()
    ev30 = dispatcher.dispatch("seek_delta", {"delta_seconds": 30.0})
    assert ev30["success"] is True
    assert dispatcher.keyboard.tap.call_count == 3
